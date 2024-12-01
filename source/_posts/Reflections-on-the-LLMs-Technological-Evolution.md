---
title: 对大模型技术演化的思考
reward: false
top: false
date: 2024-12-01 10:58:56
authors:
categories:
  - 总结
tags:
  - 思考
  - 实践
---

![](ai-generated.jpg)

最近的一段时间，为了满足自己对于 OpenAI 发布的 *[Prompt Caching in the API](https://openai.com/index/api-prompt-caching/)* 的强烈好奇心，对大模型的相关论文和技术做了非常多的梳理，包括了大模型的底层原理 Transformer 架构，到 GPT架构 的演变，到大模型的运行时推理、在线推理优化……

当我坐下来细细的回味这段解惑的时光，才发现畅游于大模型发展之路的沿途风景亦百花盛开。恰巧今年的工作大多和效率优化有关，再回顾一下自己的工作，发现这其中也存在很多相似的地方，例如：问题的量化与分析，优化方案的拆解，十字路口支出的技术信仰……
<!--more-->

## 量化与分析
大模型的很多技术并非全部来自严格的数学推导，而是基于大量的实验数据，然后通过对实验数据的量化分析得出结论。因此，在很多的论文中，经常都会看到如下的描述：

> * **Experiments** on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. (*From: Attention is all you need*)
> 
> * In our **experiments**, we use a multi-layer Transformer decoder for the language model, which is
a variant of the transformer. This model applies a multi-headed self-attention operation over the
input context tokens followed by position-wise feedforward layers to produce an output distribution
over target tokens. (*From: Improving Language Understanding by Generative Pre-Training*)
> 
> * We study **empirical** scaling laws for language model performance on the cross-entropy loss. (*From: Scaling Laws for Neural Language Models*)
> 
>  * Our **experiments** reveal that, at small batch sizes, the decode cost per token can be as high as ∼ 200 times the prefill cost per token.(*From: SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills*)
>
>  * Our second idea is our **empirical** finding that LLMs can operate on attention states with discontinuous position IDs.(*From: PROMPT CACHE: MODULAR ATTENTION REUSE FOR LOW-LATENCY INFERENCE*)

在这里面，最为典型的研究当属 OpenAI 在 2020 年 1 月 发表的 *[Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)* ，这篇论文通过实验的量化分析对大模型的性能、参数量、训练数据、计算量之间的关联性进行了深入的分析，并提出了大模型领域的 “Scaling Laws” 理论，为后续大模型的发展提供了重要的指导意义。

自从谷歌的翻译团队在 2018 年提出 Transformer 架构之后，非常多的研究者都在探索不同的模型结构，并在不同的任务上取得了新的 SOTA，但是在 OpenAI 发表 *Scaling Laws* 之前却很少有人考虑影响模型性能的主要因素究竟是什么？

或者，在 OpenAI 发表 *Scaling Laws* 之前，也有研究者对影响模型性能的相关因素进行了量化的研究或者分析，或者也发现了初步的结论[^dl-scaling-laws]，但是仍然没有人对这些大量的实验数据进行量化分析并提出 *Scaling Laws* 的具体数学表示[^sl-scaling-laws-bd]。 

当然，站在今天的视觉再来回顾 *Scaling Laws* 的定义，我们会发现这里面其实并没有什么特别高深的技术，只是利用实验做了量化分析并用数学语言来表述所发现的规律。或许，我们会说，这个实验我们也能做，就好像如果时光倒流，我们也能提出 *Scaling Laws* 一样。但是，直到 OpenAI 发表了 *Scaling Laws*，也没有团队能够这样系统的提出 *Scaling Laws*。

所谓 *Scaling laws* 其实就是一种描述系统随着规模的变化而发生的规律性变化的数学表达——通常表现为随着系统规模的增加，某些可测量的特征呈现出的某种固定的比例关系。

2018 年 6 月，OpenAI 发布了 116M 参数规模的 GPT-1 模型（Improving Language Understanding by Generative Pre-Training），2019 年 4 月，他们又发布了 1.5B 参数规模的 GPT-2 模型（Language Models are Few-Shot Learners），随着参数规模的增加，模型性能也呈现出了明显的线性增长。

接下来，如何能够让模型的性能再上一个新的台阶呢？GPT-2 模型的参数量达到了 1.5B，训练数据量达到了 40GB，训练的成本也高达 256$ 每小时[^gpt-2]（总成本预估在 10 万$ 左右），接下来的方向将是什么？参数量要继续增加到多少？需要多少训练数据？

如果完全是走一步看一步的思路，或者数据量不够、或者数据量过大，导致浪费非常多的计算资源，反复的迭代探索也会让训练成本变得无比庞大。这可能是 OpenAI 团队当时面临的最大问题。因此在继续训练下一代大模型之前，他们开始认真的思考这些问题，通过一系列的实验量化分析，于 2020 年 1 月提出了 *Scaling Laws for Neural Language Models*，并用此来指导后续更大模型的训练。

4 个月之后，2020 年 5 月，175B 参数的 GPT-3 模型（Language Models are Few-Shot Learners）正式发布。在 GPT-3 的论文中，我们看到了如下描述：
> * Based on the analysis in Scaling Laws For Neural Language Models, we train much larger models on many fewer tokens than is typical. 
> 
> * applied scaling laws to help predict and guide model and data scaling decisions for the research.

### Scaling Laws
大语言模型的 *Scaling Laws* 描述的是模型的性能 $L$， 模型的参数量大小 $N$，训练模型的数据大小 $D$，以及训练模型使用的计算量 $C$ 之间的关系。[^scalling-laws]在论文中，采用测试集上交叉熵来表征模型的性能 $L$：

$$
L = - \frac{1}{T} \sum_{t = 0}^{T} \sum_{i = 1}^{\vert \mathcal{D} \vert} \hat{y}_{t + 1}^{i} \log p(y_{t + 1}^{i} \vert w_1, w_2, \cdots, w_t; \theta)
$$

$\mathcal{D}$ 表示 token 字典表，$T$ 表示文本样本被划分为 token 后的长度。论文同时给出了在使用 Transformer 架构训练模型时，$C$、$N$、$D$ 之间的关系近似于：

$$
C = 6ND
$$

*Scaling Laws* 的核心就是：对于计算量 $C$，模型参数量 $N$，数据集大小 $D$ 而言，当不受其他两个因素制约时，模型的性能 $L$ 与每个因素都呈现幂律关系，即：：

$$
L(x) = \left(\frac{c}{x}\right)^{\alpha}
$$

$L$ 与 $C$ 的幂律关系告诉我们，为了得到更高性能的模型，我们是需要付出一定的代价的。论文中提出，每增加 10 倍的计算量，数据集大小应该增加约 1.8 倍，模型参数量应该增加约 5.5 倍。

### 效能工作的量化
回头想一下今年的效能工作，其实和 *Scaling Laws* 的思路非常相似，我们也是通过大量的实证数据的量化分析来指导我们的工作。我们认为质量是影响当前效率的核心因素，所以我们通过质量数据的分阶段分布来指导并优化我们的工作。

虽然听起来非常简单，但是当我们真正开始做的时候，我们发现，之前我们都忽略了这些数据，之前我们也从来没有利用这些数据来做更好的量化分析。在衡量效能提升的量化分析中，我们也发现，确实有很多具体工作的工时无法精准的获取，但是我们采用了很多的近似原则来估算对应的效能，并且提出了用节省的工时量来表征效能提升的思路。

就像 OpenAI 用训练阶段的交叉熵来表征模型性能一样，这可能会存在一定的不合理性，但是这确是一种非常简便的方式。所以，我们也知道用节省的工时量来表征效能提升的方式并不准确，但是这是我们能够想到的最便捷的方式。

在我们的效能提升工作中，我们时刻利用量化分析来刻画并指导我们的工作，我们能够从量化分析中发现我们下一步的核心工作和重点方向，并且能够近似的预估出完成这些工作我们可以优化的效果。

![](demo_2.png)

### 量化的好处
工作中，量化是区分事实、感受、评价的有效手段。同样的一件事，不同人的认知、背景不同，对这件事的感受也不相同、自然评价也就不同。而量化可以把不同人的背景、认知对齐到同一水平，从而有助于形成更为客观、一致的感受和评价。

工作中，经常听到大家说：这个需求太复杂了，这个需求的交付质量太差了，这个需求的交付速度太慢了……我们查看需求的 BUG 数量，发现这个需求也只有 5 个 BUG 而已。只是近期的需求的 BUG 量都比较少（只有 2~3 个），所以我们会觉得这个需求的质量比较差。但是，实际上，我们拉长时间线（2 个季度）对需求的质量（用表示单需求 BUG 量的随机变量 $X$ 表示需求质量）进行统计分析发现：类似需求（样本量为 40）的 BUG 量的均值 $\mu = 4$，方差 $\sigma^2 = 16$，假定 $X$ 服从正态分布，那么 $X$ 的 95% 置信区间为：

$$
\mu \pm 1.96\frac{\sigma}{\sqrt{n}} = 4 \pm 1.96 \frac{8}{\sqrt{40}} = (2.8, 5.2)
$$

所以，单需求 5 个 BUG是一个正常的范围，不能说明这个需求的质量差，没有必要采取特殊的优化方案。如果没有必要的量化分析，我们就容易陷入个人感受的泥潭，并做出并不正确的判断和工作方向。

* 类似需求的 BUG 量的均值的 95% 置信区间估计为 $(2.8, 5.2)$ 这是具体的推断量化数据、是客观事实。
* 这个需求的交付质量太差了，这是一种个人感受。
* 我们需要采取必要的手段放置需求质量持续恶化，这是一种基于个人感受的评价结果。

尤其是对于优化工作，量化分析都是一切工作的起点，是我们启动任何优化工作的前提，能够保障我们始终在正确的方向上前进。

!!! note 量化是工作的起点
    用什么指标来刻画需求的复杂性？用什么指标来刻画需求的交付速度？这些指标过去一段时间的统计数据是怎样的？我们基于这些数据的推断又是什么？针对这些推断我们需要采取什么动作？……

## 优化的思路

## 技术的信仰

## 参考文献
[^scalling-laws]: [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
[^dl-scaling-laws]: [Deep Learning Scaling is Predictable, Empirically](https://arxiv.org/abs/1712.00409)
[^sl-scaling-laws-bd]: [Scaling Law 百度最早提出？！OpenAI/Claude 都受它启发，Ilya 出现在致谢名单中](https://mp.weixin.qq.com/s/mBgXZZLpg-7bcQqlrXu8EA)
[^gpt-2]: [GPT-2](https://en.wikipedia.org/wiki/GPT-2)