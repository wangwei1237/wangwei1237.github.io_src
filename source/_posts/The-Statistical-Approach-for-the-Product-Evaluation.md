---
title: 推断统计方法在评估分析中的应用
reward: false
top: false
date: 2024-10-06 21:33:42
authors:
categories:
  - 总结
tags:
  - 数据分析
  - 评测
  - 统计学
  - 推断统计
---

![](Inferential-Statistics.png)

在 [产品评测的基本模型](/2024/08/17/The-Basic-Model-for-the-Product-Evaluation/) 这篇文章中，我提到了对 **评测的疑惑**：

> 曾经多少次，在系统上线之前，我们从多个方面进行了评测：性能也提升了，效果也提升了，我们兴高采烈的上线，然后激动的等待着实验数据的产出，最后得到的却是效果不明显的结论。多少个不眠的夜里，我总会问自己：技术上已经有了很大的提升啦，为什么却没有在线上表现出对应的效果呢？这究竟是为什么呀？

同时，根据我的观察和实践，提出了评测的基本模型 $\text{Perception} = f(\text{Actual}, \ \text{Expected}, \ \text{UX})$ 来解释了评测的疑惑。但是，仅仅依靠这个模型，我们就可以得出合理的结论吗？如上的模型，只能帮助我们获得准确的观察数据，但是如何从准确的观察数据中得出合理的结论呢？
<!--more-->

## 举个例子🌰
我们来看一个视频编解码的例子：有 100 个源视频（$S_1,...,S_{100}$），每个视频都会通过 A、B 两组编码参数进行转码并得到 $A_1,...A_{100}$ 和 $B_1,...B_{100}$ 两组编码后的视频。我们对 $A_i$ 和 $B_i$ 进行成对评估，得到了如下的结果：

| A 好于 B 的视频数量 | A 差于 B 的视频数量 | 差不多的视频数量 |
| ------------------ | ----------------- | --------------- |
| <center>42</center>  | <center>37</center> | <center>21</center> |

那么，A 编码参数和 B 编码参数究竟哪个好呢？还是没有差别呢？

因为 A 编码参数更好的视频占比是 $42/100 = 42\%$, B 编码参数更好的视频占比是 $37/100 = 37\%$，所以 A 编码参数的效果更好。我们在以往的视频质量评估中，采用的大多都是这样的方式来分析评估结果，但是这个结论是正确的吗？

在如上的结果中，A 和 B 之间有差异的数据总共是 $42 + 37 = 79$ 条。而在在 79 条数据中，A 要么比 B 差，要么比 B 好，令 $X_i$（$i=1,...,79$）表示评估的结果，那么 $X_i$ 是一个二项分布。我们先判断在 5% 的显著性水平下，A 与 B 是否没有显著差异，即：

$$
H_0: p = \frac{1}{2} \quad vs \quad H_1: p \neq \frac{1}{2}
$$

我们可以使用如下的 `R` 代码进行检验：

```r
> binom.test(42, 79)

	Exact binomial test

data:  42 and 79
number of successes = 42, number of trials = 79, p-value = 0.653
alternative hypothesis: true probability of success is not equal to 0.5
95 percent confidence interval:
 0.4159522 0.6448955
sample estimates:
probability of success 
             0.5316456 
```

从结果可以看出，根据评测数据，$p-\text{value} = 0.653$，因此在 5% 的显著性水平下，我们不能拒绝 $p=\frac{1}{2}$，即 A 和 B 之间没有差异的假设。

同样的，我们可以使用 `R` 得到如下的假设的检验结果：

$$
H_0: p \le \frac{1}{2} \quad vs \quad H_1: p \ge \frac{1}{2}
$$

```r
> binom.test(42, 79, alternative="greater")

	Exact binomial test

data:  42 and 79
number of successes = 42, number of trials = 79, p-value = 0.3265
alternative hypothesis: true probability of success is greater than 0.5
95 percent confidence interval:
 0.4333002 1.0000000
sample estimates:
probability of success 
             0.5316456
```

从结果可以看出，根据评测数据，$p-\text{value} = 0.3265$，因此我们无法拒绝 $p \le \frac{1}{2}$ 得到 A 更好的结论。

!!! note ❓
    同样的一份数据在采用不同的分析方法时得出了不同的结论，哪个才是正确的呢？

    虽然在如上的例子中，有很多例如：显著性水平，*p-value* 等术语，但是不用担心，在文章的后面，我们会详细介绍这些术语的含义。

## 什么是推断统计？
统计学（*Statistics*）是一门从数据中学习的艺术，它包括数据的收集，也包括通过后续的数据描述和数据分析来获得结论。对数据的分析有两种不同的方式：描述统计和推断统计，描述统计是统计学的基础，其主要处理样本数据；而推断统计则是描述统计的升华，其利用样本数据来推测总体特征。

* 描述统计主要关注于数据的收集、处理、汇总、图表描述、概括与分析，包括统计数据的收集方法、数据的加工处理方法、数据的显示方法、数据的分布特征与分析方法等。描述统计的目的是将数据转化为有意义的信息，并帮助我们理解数据的特征和规律。常见的描述统计包括直方图、平均数、中位数、众数等。

* 推断统计主要关注如何利用样本数据来推断总体特征，包括参数估计（例如平均数、标准差的估计）和假设检验两种类型。推断统计允许我们根据部分数据来推断总体特征，从而提高研究的效率和准确性。常用的推断统计包括置信区间、t 检验、方差分析等。

推断统计是数据分析的强大力量，允许我们能够根据样本来推断总体的特征，并对总体进行预测。

正如数据可视化领域的先驱 William Cleveland 所说[^1]：

> 现代数据分析的目标是预测和推断，而不仅仅是描述（The goal of modern data analysis is prediction and inference, not just description）。

统计学领域的泰斗 John Tukey 给出了推断的定义，这意味着推断统计的本质在于从整体的一小部分告诉我们整体的情况[^1]：

> 推断不是演绎，而是归纳（Inference is not deduction; it’s induction.）。

## 在评估中应用推断统计
如今，随着大模型的兴起，大模型评估也越来越重要，我们经常会看到各种榜单公布的不同大模型的能力排行，例如 [Huggingface 的 Chatbot Arena](https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard?accessToken=eyJhbGciOiJIUzI1NiIsImtpZCI6ImRlZmF1bHQiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE3Mjg1MzMxNzAsImZpbGVHVUlEIjoiV2xBcmRndkdsNVNud3ZxMiIsImlhdCI6MTcyODUzMjg3MCwiaXNzIjoidXBsb2FkZXJfYWNjZXNzX3Jlc291cmNlIiwidXNlcklkIjotODkyNzg3NTY0Nn0.pvYtAUT7FOF_BXcGBDjMdtku1GHb_svVO8pqoHL__P4)，[SuperGLUE 榜单](https://superclueai.com/) 等。

但是，这些榜单中的不同打分究竟意味着什么呢？在为业务选择模型、优化模型的时候，79 分就一定比 78 分要好吗？就像体育赛事中，虽然有冠军和亚军，但是冠军和亚军之间会存在非常显著的差异吗？

在 [Comprehensive Reassessment of Large-Scale Evaluation Outcomes in LLMs: A Multifaceted Statistical Approach](https://arxiv.org/html/2403.15250v2)[^2] 这篇文论中提到：

> The rapid growth of LLMs calls for more comprehensive and reliable evaluation methods. This necessitates broadening the scope of assessments, employing rigorous statistical methods.
> 
> Currently, fundamental statistical techniques, such as ANOVA or $\chi^2$ tests are missing in testing resulting data. These analyses are crucial for understanding whether LLM performance varies significantly across different training types, architectures, and parameter sizes.
> 
> ![](2.png)

在美国，新药上市之前必须经过美国食品药品监督管理局（FDA）的批准，即“新药申请审评程序”（NDA），以确保药品的安全性和有效性。并且为了确保药品安全性和有效性评估的科学严谨性，新药的审批需要根据 [ICH E9: Statistical Principles for Clinical Trials](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/e9-statistical-principles-clinical-trials) 中提供的标准的实验框架和规范的统计方法。

回头想想，虽然在我们的视频评估过程中，我们进行了各种结果打分的优化（比如引入 GSB， [Elo 打分](/2024/03/13/How-to-calculate-the-ELO-ratings-for-multiple-sets-of-ACR-scores/)……），我们可以更精准的刻画不同编解码器的效果，但是我们只能给出绝对排序却无法判断不同编解码器之间是否存在显著差异；我们只能说在当前的样本上，哪个编解码器的效果更好，但是却无法将这个结论泛化到线上的所有视频。就像我们在文章开头举的例子那样，42% 就一定比 37% 要好吗？而推断统计方法就可以帮助我们更好的分析数据，并得出更为合理的结论。

## 参数估计与假设检验
参数估计和假设检验是统计推断中的两个基本问题：参数估计提供对总体参数的估计，而假设检验则对总体参数是否等于某个特定值进行检验。

* 参数估计主要解决如何使用数据来估计感兴趣的参数。例如，科学家可能想要确定受到酸雨影响的中西部湖泊的比例。参数估计主要有点估计和区间估计两种。点估计方法用一个数字来估计感兴趣的统计量（例如，中西部湖泊中有 47% 的湖泊受到了酸雨的影响）。区间估计则是以一个数值区间的形式来估计总体参数的范围（例如，中西部湖泊中有 45% ~ 49% 的湖泊受到了酸雨的影响）。区间估计方法还告诉我们对其估计结果的 “置信水平”（ level of confidence）。例如，尽管我们并不能肯定 47% 就是受影响的湖泊的确切比例，但我们很可能有 95% 的信心认为实际受影响的湖泊比例在 45% ~ 49% 之间。
* 假设检验则是利用数据来检验特定假设的合理性。例如，假设检验可能会拒绝 “中西部受酸雨影响的湖泊少于 44%” 这样的假设。建设检验技术会涉及到如下的概念：统计量，显著性水平，原假设，备择假设，拒绝域，$p-\text{value}$ 等概念[^3]：
  * 原假设（$H_0$）：这是我们的起点（默认假设），通常表示没有效应、差异或关联。例如，一个新药与现有药物在疗效上没有差异。
  * 备择假设（$H_1$）：与原假设相对立的假设，表示存在某种效应、差异或关联。例如，一个新药比现有药物更有效。
  * 拒绝域：检验统计量的值域，如果检验统计量的值落在这个区域内，我们将拒绝原假设。
  * 显著性水平（$\alpha$）：这是我们愿意承担错误拒绝原假设的最大风险水平，通常设定为 0.05 或 0.01。
  * 检验统计量（$T$）：一个基于样本数据计算出的数值，用于衡量样本统计量与原假设之间的差异。
  * $p-\text{value}$：在原假设为真的情况下，观察到的样本结果出现的概率，如果 $p-\text{value} \le \alpha$，则拒绝零假设，这表明观察到的效应或差异在统计上是显著的。如果 $p-\text{value} \gt \alpha$，则不拒绝零假设，这表明没有足够的证据表明观察到的效应或差异是显著的。

当涉及到需要判断多组数据时，我们通常使用 ANOVA（分析方差）和卡方检验来检验不同方案的效果是否一致的假设。例如[^4]：

> 目前市面上有 4 款软件可以教授用户学习一门新的变成语言，某大公司正在考虑大规模购买这 4 款软件中的一款。公司内部一些资深人士声称，这几款软件没有太大的区别，它们对用户的最终学习效果影响很小。为了检验这一假设，公司决定选择 160 名工程师，并将他们分成 4 组，每组 40 人。第 *i* 组的工程师使用第 *i* 款软件来学习新的语言。当所有工程师完成学习后，参与学习的所有工程师将进行一次全面考试。公司希望使用这次考试的结果来确定不同的教学软件是否真的可以互换。该公司需要怎么做才能实现这一点？

## 推荐阅读
Introduction to Probability and Statistics for Engineers and Scientists (Sixth Edition) 是一本为工程师和科学家而作的有关概率论和数理统计方面的书籍。这本书展示了如何应用概率论来洞察现实生活中的统计问题，书中精心设计的概率论相关的内容将真实现象的概率模型和其统计程序关联起来，以便读者能够更直观的理解实践工程师和科学家最常用的统计程序和策略。

可以点击[🔗链接](https://wangwei1237.github.io/introduction_to_probability_and_statistics/)来阅读这本书的中文翻译版。

## 参考文献
[^1]: [inferential statistics](https://aimarketingengineers.com/inferential-statistics/)
[^2]: [Comprehensive Reassessment of Large-Scale Evaluation Outcomes in LLMs: A Multifaceted Statistical Approach](https://arxiv.org/html/2403.15250v2)
[^3]: [假设检验 101：基于数据构建的可信结论](https://mp.weixin.qq.com/s/UUIfY4oAvUXoxS-t1zPR2g)
[^4]: [方差分析](https://wangwei1237.github.io/introduction_to_probability_and_statistics/chapter_10/10.html)



