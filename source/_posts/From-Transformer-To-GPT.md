---
title: 从 Transformer 到 GPT
reward: false
top: false
date: 2024-10-31 18:19:48
authors:
categories:
  - 算法与数学
tags:
  - GPT
  - Transformer
---

![](1.png)
在 [自注意力究竟是什么？](/2024/10/16/What-exactly-is-attention/) 一文中，我们介绍了基于注意力机制的 Transformer 模型的基本原理和架构。

* 2017年 6 月，谷歌机器翻译团队提出的机器翻译模型 Transformer 就像大语言模型的一颗种子一样，悄然落地生根，并迅速席卷了 AI 领域。
* 一年之后，2018 年 6 月，OpenAI 发布了基于 Transformer 架构的 GPT-1[^gpt1]，虽然当时还存在一些局限性，例如当时还不能根据一个给定的标题来生成一篇新闻报道。谁也没想到，就是这个框架，在 4 年之后成为了 AI 领域最炙手可热的模型。
* 4 个月后，2018 年 10 月，谷歌也发布了基于 Transformer 架构的 BERT 模型[^bert]，与 GPT-1 相比，BERT 在很多下游任务上表现出更强劲的性能，并且也刷新了多个榜单的记录。在很长一段时间里，BERT（及其变体）一直处于各类榜单的首位，是人们谈论的焦点。
* 直到 2022 年 3 月，OpenAI 发布了 GPT-3.5[^gpt35]，并基于 GPT-3.5 于当年的 11 月 30 日正式发布了面向消费用户的产品——ChatGPT，大模型再次引起了圈内、圈外的广泛讨论，开启了新一轮的大模型时代。

这篇文章，我们就来详细的介绍一下传奇的 GPT 模型以及其原理，慢慢揭开 GPT 那神秘的面纱，也为后续对 [Prompt Caching](https://openai.com/index/api-prompt-caching/) 的讨论打下坚实的基础。
<!--more-->

## 大语言模型族谱
[A Survey on ChatGPT and Beyond](https://arxiv.org/abs/2304.13712) 给出了基于 Transformer 架构的大语言模型的发展概况和不同模型之间的演化关系[^harnessingpowerllmspractice]：

![大语言模型进化树](LLMTree.jpeg)

从图中可以看出，大语言模型的架构整体上可以分为 Enoder-Only、Encoder-Decoder、Decoder-Only 三类：

* Encoder-Only 模型：仅包含 Transformer 中的编码器部分，主要用于从输入数据提取特征或表示，最典型的代表就是 2018 年 10 月，谷歌也发布的 BERT[^bert]。 
* Encoder-Decoder 模型：包含完整的 Transformer 的编码器和解码器，编码器负责将输入序列转换为压缩的中间表示，解码器则基于这个中间表示生成目标输出序列，最典型的代表就是 2019 年 谷歌发布的 T5 模型[^t5]。
* Decoder-Only 模型：仅包含 Transformer 中的解码器部分，专注于使用 **自回归** 的方式根据前面生成的内容生成新的序列，新的输出仅依赖于前面生成的所有内容，最典型的代表就是 2018 年 6 月，OpenAI 发布的 GPT-1[^gpt1]。2020 年 1月，OpenAI 发布了所谓的语言模型的 **Scaling Law** [^scalinglaw]，尤其是在 当前的 5 月发布 GPT-3[^gpt3] 之后，Decoder-Only 架构成为了语言模型领域的主流架构。到目前为止，我们所熟知的大部分的大语言模型都是基于 Decoder-Only 架构，真可谓是一枝独秀。

## 自编码&自回归
对于 **『北京的秋天是最美的季节，我爱北京』** 这句话，如果我们对这句话中的词进行随机掩码（遮盖），我们可以得到如下的掩码结果：

> 北京的`__`是最美的季节，我爱北京

我们的目标就是让模型来预测空白处的被掩码掉的词。有两种模型可以完成这个任务：自编码模型（Auto-Encoder）和自回归模型（Auto-Regressive）。

### 自编码模型
自编码模型在预测 `空白词` 时会同时从两个方向阅读句子，可以同时利用正向预测和反向预测的优势来完成预测：

* 如果使用正向预测，那么模型会从左到右读取所有的词，直到遇到 `空白词`，然后进行预测：
> 北京的`__`

* 如果使用反向预测，那么模型会从右到左读取所有的词，直到遇到 `空白词`，然后进行预测：
> `__`是最美的季节，我爱北京

从两个方向读取句子，模型能够更加全面和清晰的理解句子，因此自编码模型能够给出更好的结果。这也就是为什么比 GPT-1 晚 4 个月发布 BERT 模型在当时能够获得更好的效果的主要原因[^bert]，也是 2021 年以前，以 BERT 为代表的自编码模型能够一骑绝尘的原因。

![来源：BERT, Pre-training of Deep Bidirectional Transformers for Language Understanding](bert_result.png)

### 自回归模型
与自编码模型不同，自回归模型在预测 `空白词` 时要么仅使用正向预测，要么仅使用反向预测，而不能像自编码模型那样可以同时利用正向预测和反向预测的优势来完成预测。大部分情况下，在预测 `空白词` 时，自回归模型会使用正向预测：
> 北京的`__`

本质上，自回归模型是单向预测模型，也就是说，自回归模型只能沿一个方向来理解句子并做出预测。这也就是我们通常所说的：GPT 只能根据输入序列中的前面的内容来预测序列中的下一个词。

## GPT 模型

![从 Transformer 到 GPT 架构的演化](GPTX_arch.png)

## GPT 模型的参数量

## GPT 模型的计算量


## 参考文献
[^gpt1]: [Improving Language Understanding by Generative Pre-Training](https://openai.com/index/language-unsupervised/)
[^bert]: [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805)
[^gpt2]: [Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)
[^gpt3]: [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)
[^gpt35]: [Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155)
[^harnessingpowerllmspractice]: [Harnessing the Power of LLMs in Practice: A Survey on ChatGPT and Beyond](https://arxiv.org/abs/2304.13712)
[^t5]: [Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683)
[^scalinglaw]: [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)