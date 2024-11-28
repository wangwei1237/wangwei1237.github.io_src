---
title: Prompt Cache 究竟是什么？
reward: false
top: false
date: 2024-11-23 22:17:05
authors:
categories:
  - LLM
tags:
  - Prompt Cache
  - LLM Interface
---

![](context_caching.png)

在介绍了 [Transformer](/2024/10/16/What-exactly-is-attention/) 模型、[GPT](/2024/10/31/From-Transformer-To-GPT/) 模型、[大模型的运行时推理和 KV Cache](/2024/11/16/The-LLMs-Runtime-Inference-and-KV-Cache/) 后，我们终于越来越接近于最原始的目标：OpenAI 2024 年 10 月 1 日发布的 [Prompt Caching in the API](https://openai.com/index/api-prompt-caching/)。这篇文章，我们就来介绍一下 `Prompt Cache` 相关技术的发展并对 OpenAI 的 `prompt caching` 技术方案进行简单的分析。
<!--more-->

## KV Cache
根据 [大模型的运行时推理和 KV Cache](/2024/11/16/The-LLMs-Runtime-Inference-and-KV-Cache/) 中的介绍，如果输入 prompt 的长度为 $n$ 个 tokens——$s_1, s_2,...,s_n$，大模型会根据这 $n$ 个 tokens 生成了后续的 $k$ 个 tokens——$s_{n+1}, s_{n+2}, ...,s_{n+k}$。

如果没有 `KV 缓存`，则每生成一个新的 token $s_{n+k}$，都需要重新计算 $s_1,s_2,...,s_{n+k}$ 之间的注意力。

但是，在 `KV 缓存` 机制下，`prefill 阶段` 会计算输入序列中的 $n$ 个 tokens 之间的注意力 $S_0=\{(k_i, v_i)\ |\ i \le n\}$，并将 $(k_i, v_i)$ 缓存在 `KV 缓存` 中。对于后续生成的每一个 token $s_{n+j}(j\le k)$，我们将使用 `KV 缓存` 中的 $S_j=\{(k_i, v_i)\ | \ i \lt n + j \}$ 来计算新 token $s_{n+j}(j\le k)$ 的自注意力。

令模型的维度为 $d_{model}$，$\mathbf{W}^Q$、$\mathbf{W}^K$、$\mathbf{W}^V$ 的维度为 $d_{head}$，则利用 `KV 缓存` 可以将计算注意力的浮点数计算量从 $6nd_{model}d_{head} + 4n^2d_{head}$ 降低到 $6d_{model}d_{head} + 4nd_{model}$[^yelu_prompt_cache]，整体的计算量降低了 $100(1 - \frac{1}{n})\%$。

## Prompt Cache
`KV 缓存` 可以显著降低一个请求中的注意力的重复计算。但是，实际应用中，不同的请求也经常会有很多重复的内容，例如：

* 根据 Prompt 模版派生的 Prompt 在请求 LLM 时通常包含：系统提示、角色指定、指令描述、样例说明、自定义的动态内容……
    
    $$
    \text{System Prompt} \ | \ \text{Role Setting} \ | \ \text{Instruction Description} \ | \ \text{Few Shot} \ | \ \text{User Query......}
    $$

  这其中，系统提示词、角色设定、指令描述、具体例子等都是通用的模版内容，同一类型的任务仅在最后的用户自定义部分不同。
    
* Chat Robot 之间的多轮对话，随着对话轮次的不断增加，新的对话内容会作为对话历史不断的增加到 Prompt 中并重新发送给大 LLM，当对话历史较多的时候，就会导致和大模型的每次对话都会携带大量的重复内容。

* 使用批处理方式调用 LLM 解决特定的任务，比如以使用大模型进行图片分析，此时输入的 Prompt 的前面部分内容都是一致的，只是最后要分析的图片内容不一致。

如前所述，`KV 缓存` 可以解决单个请求内的自回归过程中的注意力机制的重复计算问题，提升 LLM 的性能，但是无法解决如上场景中存在的跨请求间的注意力机制的重复计算问题。`Prompt Cache` 就是解决跨请求间的注意力机制重复计算的问题，从而提升后续请求的性能，尤其是提升 `prefill 阶段` 的性能（降低 TTFT）。
* 2024 年 5 月 14 日，谷歌为 Gemini 模型宣布了一系列的新特性，其中就包括可以降低费用的 `Context Caching`。[^gemini_pc_intro]
* 2024 年 7 月 1 日，月之暗面宣布启动 `Context Cache` 的公测，对于请求频繁、重复引用大量初始上下文的场景，可以降低 83% 的 TTFT 同时费用最高降低 90%。[^kimi_pc_intro]
* 2024 年 8 月 2 日，DeepSeek 在 API 模型上支持了硬盘 `Prompt Cache`，把本来就白菜价的 API 价格又降低了一个数量级[^deepseek_pc_intro]，在命中缓存的情况下，每百万输入 tokens 仅 0.014$，几乎要等同于免费了。
* 2024 年 8 月 15 日，Claude 也宣布在 Claude 3.5 Sonnet、Claude 3 Opus、Claude 3 Haiku 模型上支持 `Prompt Cache`。对于较长的 prompts，使用 `Prompt Cache` 可以把费用最高降低 90%、请求延迟最高降低 85%。[^claude_pc_intro]
* 2024 年 10 月 1 日，OpenAI 也宣布在其最新的模型版本 GPT-4o、GPT-4o mini、o1-preview、o1-mini 上支持 `Prompt Cache`，使用 `Prompt Cache` 技术，可以为开发者提供更快的请求响应速度和低至 50% 的费用。[^openai_pc_intro]

## Prompt Cache 技术方案
`Prompt Cache` 并不是一种传统的缓存技术，传统的缓存技术通常用于临时存储数据以便于再次请求相同的数据时可以加速数据的访问速度。传统的缓存技术通常用于处理静态内容输出，例如网页内容，js、css、image 等静态内容，数据库查询结果……

在传统的缓存技术中，我们使用 `key-value` 的结构来组织并访问缓存内容，例如我们可以把某个 `url` 作为 `key`、并将其对应的网页内容作为 `value` 缓存起来，以便有其他用户再次请求该 `url` 时可以直接从缓存中提取到该网页的内容，从而加速网页的访问速度。

在实际中，确实存在不同用户请求的内容大致相似，因此可以利用 `key-value` 的传统缓存技术来解决一部分场景的访问速度问题，例如：
* Query 1：天空为什么是蓝色的？
* Query 2：为什么天空是蓝色的？
* Query 3：天空为什么是蓝的？
* ……

但是，对于 LLM 而言，在大部分场景下，LLM 根据固定的上下文内容和可变的用户输入内容动态生成输出。因此，在大部分场景下，传统的 `key-value` 缓存技术并不适用于大模型领域。

根据如上的这两种场景，`Prompt Cache` 技术也基本上划分为两种：
* 输入整体一致时，利用 `key-value` 的传统缓存技术对相似请求的输出内容进行缓存，例如  GPTCache: Semantic Cache for LLMs[^gpt_semantic_cache]。
* 输入前缀一致时，利用 `KV 缓存` 技术避免注意力重复计算带来的计算开销，从而提升大模型响应速度，例如耶鲁大学和谷歌研发的 Prompt Cache: Modular Attention Reuse 技术[^yelu_prompt_cache]。

### GPTCache: Semantic Cache for LLMs
GPTCache: Semantic Cache for LLMs [^gpt_semantic_cache] 是一种典型的传统缓存技术，GPTCache 的本质是把 `Query-Response` 缓存到 Redis 中，当有语义上相似的 `Query` 时，直接从 Redis 中返回缓存的结果而不需要 LLM 再重复计算并生成结果，从而降低大模型的推理成本并提升响应性能。但是这种方式只适用于语义上非常相似的请求，对于如下的请求则不适用：

* Query 1：天空为什么是蓝色的？
* Query 2：天空为什么是蓝色的，请给出详细的物理学上的解释？

GPTCache 的架构如下所示[^git_gptcache]：

![](17325377216331.jpg)

### Prompt Cache: Modular Attention Reuse
耶鲁大学和谷歌联合发布的 Prompt Cache: Modular Attention Reuse [^yelu_prompt_cache] 在本质上时基于 `KV 缓存` 的 `Prompt Cache` 技术，将请求内的 `KV 缓存` 技术扩展到了请求间，从而可以非常好的解决如下的场景：

* Query 1：天空为什么是蓝色的？
* Query 2：天空为什么是蓝色的，请给出详细的物理学上的解释？

> 本节中提到的 `Prompt Cache` 均指代论文 *Prompt Cache: Modular Attention Reuse* 中的 `Prompt Cache`。

`Prompt Cache` 的基本思想是：在推理阶段，以文本片段（text segment）为单位，把频繁出现的文本段对应的注意力状态（结果）存储下来；在之后请求的推理时，如果遇到相同的文本段，就直接使用缓存的注意力状态（结果）。

为了实现这个目标，有两个挑战需要解决：
* Transformers 架构中存在位置编码，因此 tokens 之间的自注意力状态（结果）与位置有关。所以，只有当相同的文本段出现在相同位置时，才能复用该文本段的自注意力状态（结果）。
* 必须具备有效识别已经缓存了自注意力状态（结果）的文本段的能力，这样系统才能够使用这些文本段缓存的自注意力状态（结果）。

为了解决如上的两个难题，`Prompt Cache` 采取了如下的技术方案和探索：
* 论文中提到，作者通过实验证明：虽然自注意力机制和位置编码有关，但是只要保持输入 tokens 之间的相对位置不变，那么大语言模型的输出质量就不会受到影响。这意味着我们可以提取输入 prompts 的不同片段的注意力状态（结果），并将它们拼接在一起，从而构建新的语义。
* 提出了一种提示词标记语言 (*PML：Prompt Markup Language*) 以明确 prompt 的结构。PML  将可重用的文本段表示为模块，从而解决了有效识别可复用的文本段的问题。

例如，如果我们有一条如下的 prompt：

```
PROMPT = """
SystemPrompt
Context
Examples

Query: q?
Answer: 
"""
```

根据论文中的 PML 的定义，我们可以构建如下的 prompt schema：

```
<prompt schema="TaskPrompt">
  <SystemPrompt/>
  <Context/>
  <Examples/>
  Query: q? Answer: 
</prompt>
``` 

在推理时，`Prompt Cache` 的处理流程如下：
* 检索缓存的注意力状态（结果）：从缓存中获取 SystemPrompt, Context, Examples 的注意力状态（结果）。
* 处理新文本：用户输入的文本都未缓存，需要重新计算注意力状态（结果），例如上例中的 `Query: q? Answer: ` 就是未缓存的部分。
* 合并注意力状态（结果）：按顺序拼接 SystemPrompt + Context + Examples + UserPrompt 的注意力状态（结果）。
* 生成响应：使用合并后的注意力状态（结果）来生成 LLM 的响应。

更详细的例子如下图所示：

![](17325398113275.jpg)

## OpenAI API 中的 Prompt Caching
对于 OpenAI API 中提供的 `Prompt Caching` 技术大概率也是基于 `KV 缓存` 技术来避免跨请求间的注意力重复计算来提升 `prefill 阶段` 的性能并实现费用降低的目的。OpenAI 的 `Prompt Caching` 要求必须有精准匹配的前缀，因此我们可以推测，OpenAI 可能并没有使用耶鲁大学的 `Prompt Cache` 技术，而是采用了一种更为简便的方案。

根据 OpenAI 官网的介绍，OpenAI 会自动为 GPT-4o、GPT-4o-mini、o1-preview、o1-mini 模型以及这些模型的微调版本开启 `Prompt Caching` 功能。当通过 API 调用对应的模型，并且输入 prompts 的长度大于 1024 时，OpenAI 会自动为这些请求开启 `Prompt Caching` 功能，以提升模型的响应速度。

之所以采用 1024 个 tokens 的阈值，可能是一个权衡的结果，毕竟 `Prompt Caching` 在本质上时一种 **通过空间换时间** 的技术，虽然可以提升请求的响应速度，但是也会导致 GPU 内存的过渡消耗，从而影响到单个 GPU 的吞吐。因此，当请求中的 prompts 长度比较小时，`Prompt Caching` 的 ROI 就比较低了。

SARATHI 提出的 `chunked-prefills` 技术可以允许我们将一个 `prefill 阶段` 的请求拆分为大小相等的块，同时利用把一个 `prefill-chunk` 和多个 `decode` 构建成一个批处理请求的这种搭便车（*piggyback*）的技术来实现解码最大化批处理（decode-maximal batching），进而避免了模型在流水线并行中存在的流水线等待问题，从而提高大模型的推理性能。[^SARATHI]

![](17325284975396.jpg)

OpenAI 大概率也采用了类似 SARATHI 中的 `chunked-prefills` 技术，因此可以实现缓存不同请求间的最长前缀来达到加速计算的效果。OpenAI 在对输入 prompts 进行分块时，采用的分块大小为 128 tokens，以实现最大程度的可控性。

根据 OpenAI 的介绍[^openai_pc_intro]，当用户输入 prompts 的长度超过 1024 个 tokens 时：
* API 首先会计算该请求的最长前缀，并将该最长前缀的结果缓存起来（`KV 缓存`），该最长前缀的长度从 1024 开始，并且以 128 的大小逐步递增。
* 当该用户的下一个请求包含该最长前缀时，API 则可以直接复用最长前缀的注意力结果、并且依赖缓存结果仅计算最长前缀之后的 tokens 的注意力结果实现请求的加速。

基于 Transformer 架构的大模型利用 **因果计算**（*causal computation*）来计算自注意力，所以在使用 `Prompt Caching` 时必须保证请求间存在一致的前缀。因此，OpenAI 的官方文档中说：只有当请求间存在完全一致的前缀时，才会命中 `Prompt Caching`[^pc_docs]。

> Cache hits are only possible for exact prefix matches within a prompt. 
> 
> To realize caching benefits, place static content like instructions and examples at the beginning of your prompt, and put variable content, such as user-specific information, at the end.
> ![](17325296211790.jpg)

根据 OpenAI 的官方文档，`Prompt Caching` 的流程如下[^pc_docs]：

* **Cache Lookup**：检查输入 prompts 的前缀是否位于缓存
* **Cache Hit**：如果找到匹配的前缀，则使用缓存结果
* **Cache Miss**：否则，按照完成的处理方式从头处理该请求，并将对应的结果缓存起来以备将来使用

为了避免无效的缓存占用，对于缓存的最长前缀计算结果，如果没有在 5~10 分钟内再次访问该缓存结果，OpenAI 将清空该缓存。在非高峰时段，缓存可以保存长达 1 小时。

`Prompt Caching` 可用于 1024 个或更多 tokens 的 prompts，并且缓存以 128 个 token 不断增加，也就是说请求中缓存的 tokens 数量将始终为：1024、1152、1280、1408……

可以通过 API 响应中的 `usage.prompt_tokens_details.cached_tokens` 字段来查看请求是否命中 `Prompt Caching` 以及命中 `Prompt Caching` 的 tokens 数量。

```
"usage": {
  "prompt_tokens": 2006,
  "completion_tokens": 300,
  "total_tokens": 2306,
  "prompt_tokens_details": {
    "cached_tokens": 1920
  },
  "completion_tokens_details": {
    "reasoning_tokens": 0,
    "accepted_prediction_tokens": 0,
    "rejected_prediction_tokens": 0
  }
}
```

## 举个例子🌰
我有一个图片内容分析的服务，该服务允许用户输入一张图片和一段文本描述，然后判断图片内容和文本描述之间的相关性，并根据相关性给于一个打分。

简便期间，我使用 GPT-4o 模型来实现这个功能，整体的 prompts 得格式如下所示：

![](pic_prompt.png)

一般而言，我会一次分析几百张图片，并且我们的 prompts 的长度非常大，平均长度在 1200 个 tokens 左右。而其中的角色设定、分析规则、打分规则的描述部分在 1000 个 tokens 左右，并且是固定不变的，变化的图片和文本miaon描述部分在 200 个 tokens 左右（其中图片固定 85 个 tokens）。所以在没有 `prompt caching` 之前，每次请求都会重复计算 1000 个 tokens（占比 80%），从而造成大量的重复计算，进而带来了更多的费用。

在 `prompt caching` 之后，我每次请求只需要计算 200 个 tokens（占比 20%），从而节省了 80% 的计算量和费用，具体的 GPT-4o 的 API 响应如下所示：

```
"usage": {
  "prompt_tokens": 1135, 
  "completion_tokens": 284, 
  "total_tokens": 1419, 
  "prompt_tokens_details": {
    "cached_tokens": 1024
  }, 
  "completion_tokens_details": {
    "reasoning_tokens": 0
  }
}
```

从上述的结果可以发现，使用 `prompt caching` 之后，该请求有 1024 个 tokens（占比 90%）命中了缓存，从而节省了 90% 的费用。

## 参考文献
[^yelu_prompt_cache]: [Prompt Cache: Modular Attention Reuse For Low-Latency Inference](https://arxiv.org/abs/2311.04934v2)
[^gemini_pc_intro]: [Context caching for Google Gemini](https://simonwillison.net/2024/May/14/context-caching-for-google-gemini/)
[^kimi_pc_intro]: [Context Caching 正式公测](https://platform.moonshot.cn/blog/posts/context-caching)
[^deepseek_pc_intro]: [DeepSeek API introduces Context Caching on Disk, cutting prices by an order of magnitude](https://api-docs.deepseek.com/news/news0802)
[^claude_pc_intro]: [Prompt caching with Claude](https://www.anthropic.com/news/prompt-caching)
[^openai_pc_intro]: [Prompt Caching in the API](https://openai.com/index/api-prompt-caching/)
[^gpt_semantic_cache]: [GPT Semantic Cache: Reducing LLM Costs and Latency via Semantic Embedding Caching](https://arxiv.org/abs/2411.05276v1)
[^SARATHI]: [SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills](https://arxiv.org/abs/2308.16369)
[^pc_docs]: [Prompt caching: Reduce latency and cost with prompt caching](https://platform.openai.com/docs/guides/prompt-caching)
[^git_gptcache]: [GPTCache : A Library for Creating Semantic Cache for LLM Queries](https://github.com/zilliztech/GPTCache)