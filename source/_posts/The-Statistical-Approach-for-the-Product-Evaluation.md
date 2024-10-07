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
我们来看一个视频编解码的例子：有 100 个源视频（$S_1,...,S_100$），每个视频都会通过 A、B 两组编码参数进行转码并得到 $A_1,...A_100$ 和 $B_1,...B_100$ 两组编码后的视频。我们对 $A_i$ 和 $B_i$ 进行成对评估，得到了如下的结果：

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
    好吧，同样的一份数据得出了不同的结论，哪个才是正确的呢？

