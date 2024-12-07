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

当然，站在今天的视角再来回顾 *Scaling Laws* 的定义，我们会发现这里面其实并没有什么特别高深的技术，只是利用实验做了量化分析并用数学语言来表述所发现的规律。或许，我们会说，这个实验我们也能做，就好像如果时光倒流，我们也能提出 *Scaling Laws* 一样。但是，直到 OpenAI 发表了 *Scaling Laws*，也没有团队能够这样系统的提出 *Scaling Laws*。

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

就像 OpenAI 用训练阶段的交叉熵来表征模型性能一样，这可能会存在一定的不合理性（例如，虽然交叉熵下降了 10%，但并不等价于模型在下游任务上的 *性能* 只提升了百分之十，有可能模型在下游任务上的性能有非常大幅度的提升），但是这确是一种非常简便的方式。所以，我们也知道用节省的工时量来表征效能提升的方式并不准确，但是这是我们能够想到的最便捷的方式。

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
### 大模型的推理优化
大模型的推理优化技术有如下的思路：

* 在推理设备上从 CPU 迁移到 GPU，从而可以 GPU 高并行的特征来解决推理过程中的大量的矩阵运算，提升推理的速度。
* 不断细化的并行化处理，从推理阶段的 `Prefill 阶段`、`Decode 阶段` 分离，到请求级别的 `Batching` 批处理到请求级别的 `Micro-Batching` 批处理，然后再到 Token 级别的 `Piggybacking` 批处理，从而可以最大程度的减少推理过程的无效等待，提升推理的速度和 GPU 的吞吐。[^SARATHI]
* KV 缓存、Prompt Caching 技术，避免推理过程中的重复计算，从而提升推理的速度。
* 量化技术，用 `INT8` 来替换 `FLOAT16`、`FLOAT32` 的浮点计算，降低推理过程的计算复杂度，在保障推理效果的情况下提升推理的速度。我们也可以在 Netflex 开发的视频画质评估工具 [VMAF](https://github.com/Netflix/vmaf) 中看到同样的优化技术。
* ……

所以我们看到，推理优化的思路大致上可以分为三个部分：
* 去掉不必要的等待
* 减少重复的计算
* 优化计算的算法

![推理优化的技术线条](2.png)

### 效能工作的优化
回顾今年的效能工作，我才发现整体的优化思路和大模型的推理优化思路基本一致：我们没有像之前那样仅从效能的维度来思考问题，而是在保障质量这个约束条件下，从等待、重复、优化这三个正交的维度开展效能提升工作，进而达到提升交付效能的目标。

要实现这种包含约束条件的优化，需要我们首先从端到端的全局工作进行分析，然后对每个阶段的工作效能进行量化，再对不同阶段的的工作进行分析，从而识别出：
* 哪些工作存在着非必须的等待，例如测试环境的等待，不同团队合并代码之间的等待，……
* 哪些工作存在的大量的重复，例如多轮迭代测试中的重复测试
* 哪些工作的方式需要进一步优化，例如手工测试是否可以转变为自动化测试？

进而根据识别出的不同阶段的问题，采取有针对性的方案进行优化，从而提升整体的交付效能。在整个优化过程中，因为有质量这个优化的约束条件，所以我们可以做到在我们可以控制的范围内做到效能提升的最大化，做到了快，但又不是无极限的快。

刘润先生在 2024 年度演讲《进化的力量》中提到了 **越汇乌鸡卷** 的例子[^liurun]：

> 我们的工厂，每天会在不锈钢台面上，加工鸡肉。然后，清理台面，再加工鸡架。
> 
> 清理台面的过程，要花 4 分钟。一位员工提出来，要不咱们用桌垫吧？就像吃饭时铺个餐垫，吃完直接换新的。这样，清理台面的时间，就从 4 分钟缩短到了 1 分钟。
> 
> 以前我们用 “镊子” 去除鸡架的内脏，要花 14 到 20 秒。所以这活，需要 5 个人干。
>
> 一位员工提出来，要不我们试试 “弯头水果叉” 呢？结果，用叉子一试，时间几乎减半！从此，5 个人的活，现在 3 个人就能搞定。

这就是：减少浪费，降低重复。这就是在保障质量的前提下，提升效率。低成本的核心，不是降低品质，而是减少浪费。

### 控制的重要性
在 [新业务的开发就不需要重视内部质量吗？](/2021/12/04/Should-the-new-business-production-development-focus-on-internal-quality/) 这篇文章中，我提到：

> 根据 Martin Fowler 的 *软件累计功能* 模型，如果不重视 *内部质量*，数周之后，糟糕的 *内部质量* 就会严重影响软件的交付效率。因此，只有在一开始就重视软件的 *内部质量*，才能真正有效的提升新业务的价值探索效率。

在交付过程中，一味地求快，一味地追求超出自己控制范围的快，最终只会让效率变得更糟糕。

清代的文学家周容写过一篇散文 《小港渡者》，这篇杂记散文，通过短短不到二百个字，通过自己未听 *渡者* 缓行的建议，希望通过 *急行* 而达到在城门关闭之前入城的目标，最终因为 *急行* 而没有入城的故事，来说明了 **欲速则不达** 的道理。

> 庚寅冬，予自小港欲入蛟川城，命小奚以木简束书从。时西日沉山，晚烟萦树，望城二里许。
> 因问渡者：“尚可得南门开否？” 渡者熟视小奚，应曰：“徐行之，尚开也； 速进，则阖。” 
> 予愠为戏。趋行及半，小奚仆，束断书崩，啼，未即起。理书就束，而前门已牡下矣。
> 予爽然思渡者言近道。天下之以躁急自败，穷暮而无所归宿者，其犹是也夫，其犹是也夫！

## 技术的信仰
如果我们回顾一下 GPT 的发展历程，我们就会发现 OpenAI 的对大模型的技术信仰。当技术路线出现岔路口时，技术信仰能够确保团队不会在技术路线上摇摆不定并始终向着自己认定的方向前进。

在技术信仰的加持下，团队会坚定自己的技术路线，并不停地用实践的方式去验证自己的技术信仰，并在不断的验证中修正自己的技术方向。

![](llm_his.png)

* 2018 年 6 月，OpenAI 发布了基于 Transformer 架构的自回归模型 GPT-1，开启了他们的 AGI 之旅。
* 4 个月后，2018 年 10 月，谷歌就发布了基于 Transformer 架构的自编码模型 BERT。与 GPT-1 相比，BERT 在很多下游任务上表现出更强劲的性能，并且也刷新了多个榜单的记录。在很长一段时间里，BERT（及其变体）一直处于各类榜单的首位，是人们谈论的焦点。

在这个时候，如果我们是 OpenAI 团队，我们将如何判断技术的方向？在有更强大的架构为前提得情况下，是否还要继续坚持自己自回归的架构？

置身于历史之中，在 BERT 发布之后，如果我们也要进入到大模型的领域，那么我们在技术选型上将作出何种抉择？

幸运的是，OpenAI 团队并没有因为 BERT 的发布而摇摆，这种技术的坚定，才有了 4 年之后的 2022 年的 ChatGPT 的发布，也才有了之后的大模型的火爆。

在研究大模型的代码能力时，对 AGI 的技术信仰推动 OpenAI 发现了 SWE 数据集存在的问题，并推动他们于 SWE 的作者一起合作提出了更好的数据集——[SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/)，以更好的评估大模型的能力。

针对 [SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 我们会说，这不就是个数据集吗，这有什么技术含量、这有什么难度呢？我们要是做我们也可以做出来。但是就像之前说的 `Scaling Laws` 一样，虽然简单，但是在 OpenAI 之前，确实也没有团队真正系统化的提出来。

技术发展日新月异，技术信仰能够让团队避免盲目跟随热点，确保团队能够沿着既定的技术脉络发展。团队不但能够降低技术路线反复变更所带来的成本，也能保证自身在日新月异的技术浪潮中具备足够的自主性和话语权。

如 OpenAI 所实践的那样，技术信仰可以让团队文化更加内敛与坚韧。研发人员不再是单纯的“任务执行者”，而是对所研产品与技术充满热忱的探索者。团队成员会相信，自己的每一次实验、每一次数据集优化、每一段代码改进，都将在通往更高层次智能的路途中发挥作用。在这种充满信仰的氛围中，失败不再是阻碍前行的壁垒，而成为验证思路、激发创意的助力。在这种长期投入与坚持下，技术信仰最终转化为组织的核心竞争力，使团队在日益激烈的大模型竞赛中屹立不倒。

## 参考文献
[^scalling-laws]: [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
[^dl-scaling-laws]: [Deep Learning Scaling is Predictable, Empirically](https://arxiv.org/abs/1712.00409)
[^sl-scaling-laws-bd]: [Scaling Law 百度最早提出？！OpenAI/Claude 都受它启发，Ilya 出现在致谢名单中](https://mp.weixin.qq.com/s/mBgXZZLpg-7bcQqlrXu8EA)
[^gpt-2]: [GPT-2](https://en.wikipedia.org/wiki/GPT-2)
[^SARATHI]: [SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills](https://arxiv.org/abs/2308.16369)
[^liurun]: [进化的力量：刘润 2024 年度演讲](https://mp.weixin.qq.com/s?__biz=MjM5NjA3MzYxNA==&mid=2652200096&idx=1&sn=988d7f5ddaae6460be20498c3d3d9323&chksm=bc40431d308a044b00410fec5557557a6ec92154f712913b6cbeb6e9bf5095703d65a18b4e19&scene=27)