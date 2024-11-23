---
title: 大模型的运行时推理和 KV Cache
reward: false
top: false
date: 2024-11-16 09:17:39
authors:
categories:
  - LLM
tags:
  - Prefill
  - KV Cache
  - Runtime Inference
---

![](Prefill-and-decoding-phase-in-the-LLM-inference.png)

在 [自注意力究竟是什么？](/2024/10/16/What-exactly-is-attention/) 和 [从 Transformer 到 GPT](/2024/10/31/From-Transformer-To-GPT/) 中，我们介绍了 Transformer 架构的详细细节，并介绍了基于 Transformer 的 GPT 架构的细节。距离我们探究 [Prompt Caching](https://openai.com/index/api-prompt-caching/) 的原理又近了一步。就像 `程序` 和 `进程` 之间的区别一样，Prompt Caching 属于运行时的范畴，因此在探究 [Prompt Caching](https://openai.com/index/api-prompt-caching/) 的原理之前，我们还要继续了解大模型在部署和运行时推理方面的细节。

<!--more-->

## Prefill 阶段 & Decode 阶段详解
每个 Transformer 架构的大型语言模型的推理请求都会经历两个阶段：`prefill 阶段` 和 `decode 阶段`。`prefill 阶段` 会对输入的 prompts 进行处理，而 `decode 阶段` 则主要是利用自回归的方式来生成 tokens。如下图所示[^LLMInferenceSurvey]，一个请求仅需要经历 1 次 `prefill 阶段`，但却需要经历多次 `decode 阶段`，每生成 1 个 token 就需要 1 次 `decode 阶段`，这一特性也将显著影响到大语言模型的整体推理效率。

![From https://arxiv.org/abs/2407.12391v1](17320037998361.jpg)

### Prefill & Decode
Transformer 架构的推理从 `prefill 阶段` 开始，在该阶段中，模型会并行处理给定 `batch size` 下的所有的输入 tokens。此时，Transformer 解码器的输入是一个形状为 $[B, L, H]$ 的张量 $\mathbf{X}$，其中，$B$ 表示批处理中所包含的请求个数，$L$ 表示每个请求的 prompt  长度，也就是给定查询中输入 tokens 的数量，$H$ 是模型的（嵌入向量）维度（例如，对于 GPT-3 模型来说，$H$ 的值为 12288）。

![](17319145519382.jpg)

`decode 阶段` 的操作与 `prefill 阶段` 完全相同，唯一的区别是 `decode 阶段` 仅针对上一次自回归迭代中生成的单个 token。因此，在 `decode 阶段` 中，Transformer 解码器的输入是一个形状为 $[B, 1, H]$ 的张量。
![](17319151377664.jpg)

此外，对每个新生成的 token 的注意力的计算依赖于同一请求中所有的、先前的 tokens 的 $\mathbf{k}$ 向量和 $\mathbf{v}$ 向量（维度为 $[1,d_{head}]$）。在每次迭代中，为了避免重新计算所有的、先前的 tokens 的 $\mathbf{k}$ 向量和 $\mathbf{v}$ 向量，大部分的推理框架都会将这些向量值缓存到 GPU 内存中，这就是所谓的 `KV 缓存`。

如果模型的解码器总共有 $n_{layers}$ 层、每层有 $n_{heads}$ 个注意力头、每个注意力头的维度为 $d_{head}$、模型的精度为 $p_m$（单位为 Byte），那么每个 token 需要的 `KV 缓存` 的大小为：

$$
2 * n_{layers} * n_{heads} * d_{head} * p_m
$$

以 GPT-3 模型为例，$n_{layers}=96$、$n_{heads}=96$、$d_{head}=128$，如果模型精度 $p_m=2$，那么每个 token 需要的 `KV 缓存` 的大小为：

$$
2 * 96 * 96 * 128 * 2 \approx 4.5 MB
$$

因此，如果模型的上下文窗口大小是 1000，则对于每个请求而言，需要的 `KV 缓存` 的大小为：

$$
1000 * 4.5 MB \approx 4.4 GB
$$

以 LLaMa-13B 模型为例，$n_{layers}=40$、$n_{heads}=40$、$d_{head}=128$，如果模型精度 $p_m=2$，那么每个 token 需要的 `KV 缓存` 的大小为：

$$
2 * 40 * 40 * 128 * 2 \approx 800 KB
$$

因此，如果模型的上下文窗口大小是 1000，则对于每个请求而言，需要的 `KV 缓存` 的大小为：

$$
1000 * 800 KB \approx 781 MB
$$

### 各阶段的计算特性
> 本节中所有的实验数据均来自 SARATHI[^SARATHI]。

[SARATHI](https://arxiv.org/abs/2308.16369) 给出了在不同的 `batch size` 下，部署在 [A6000](https://www.nvidia.com/en-us/design-visualization/rtx-a6000/) GPU 上的 LLaMa-13B 大模型在处理长度为 1024 的 prompt 时的不同推理阶段的单 token 耗时对比。

![From SARATHI, https://arxiv.org/abs/2308.16369](17319839433982.jpg)
从图中可以看到：
* `prefill 阶段` 会并行处理输入序列中的所有 tokens，处理过程涉及自注意力计算等的大量矩阵运算，属于计算密集型任务。因此，对于不同的 `batch size`，`prefill 阶段` 的单 token 耗时几乎是一致的，即使在 `batch size` 比较小的情况下（例如 `batch size` 为 1）也能令 GPU 的负载达到饱和状态。
* `decode 阶段` 在每次自回归迭代中仅处理一个 token，这就导致在 `batch size` 较小的情况下，GPU 的利用率非常低。所以我们看到，随着 `batch size` 的增加，该阶段的单 token 耗时呈现显著的降低趋势。尤其是当 `batch size` 比较小时（为 1 时），单 token 的 `decode` 成本是 `prefill` 成本的 200 倍。由于该阶段需要频繁地读取 `KV 缓存`，导致 IO 开销较大，增加 `batch size` 能更有效地分摊 IO 成本，所以可以显著降低 `decode 阶段` 的开销。但是，毕竟该阶段的 IO 开销过大，该阶段仍然是 IO 密集型任务，即便 `batch size` 再大（比如为 18 时）也不能令 GPU 完全饱和。所以当 `batch size` 比较大时（为 18 时），单 token 的 `decode` 成本虽然降低至 `prefill` 成本的 4 倍，但是和计算密集型的 `prefill 阶段` 相比，单 token 的成本依然很高。

我们可以使用 [arithmetic intensity](https://docs.nvidia.com/deeplearning/performance/dl-performance-gpu-background/index.html)——每次内存 IO 对应的计算量——来区分计算密集型任务和内存密集型任务。如果 `arithmetic intensity` 大于 GPU 的每 IO 操作的计算量，则可以认为改任务是计算密集型任务，否则就是 IO 密集型任务。[^GPUPBUG]

$$
\text{arithmetic intensity} = \frac{\text{\#ops}}{\text{\#bytes}}
$$

$$
\begin{cases}
\text{计算密集型}, \quad & if\ \text{arithmetic intensity} \gt \frac{GPU's\ FLOPS}{GPU's\ Memory\ Bandwidth}\\
\text{IO 密集型}, \quad & otherwise
\end{cases}
$$

[A6000](https://www.nvidia.com/en-us/design-visualization/rtx-a6000/) GPU 每秒单精度计算次数为 38.7 TFLOPS，内存带宽为 768 GB/s [^A6000]，因此 $\frac{GPU's\ FLOPS}{GPU's\ Memory\ Bandwidth} \approx 50$，因此如果 `arithmetic intensity` 大于 50，则意味着在 A6000 GPU 上，该任务是计算密集型任务，可以非常好的利用 GPU 的计算能力；否则，任务会受限于 IO 操作而无法有效利用 GPU 的能力。

[SARATHI](https://arxiv.org/abs/2308.16369) 给出了 [A6000](https://www.nvidia.com/en-us/design-visualization/rtx-a6000/) GPU 上部署的 LLaMa-13B 大模型在不同 `batch size` 下的各阶段的 `arithmetic intensity`。

> 注意：为了能够让 `decode 阶段` 达到非常高的 `batch size`，在实验中，当 `batch size` 为 256 时，模型的 $n_{layers}$ 是 1 而不是原始的 40。

![From SARATHI, https://arxiv.org/abs/2308.16369](17319876353902.jpg)
从上图可以看到：
* 即使 `batch size` 为 1 时，`prefill 阶段` 的所有操作都具有很高的 `arithmetic intensity`（远大于 50）；而此时，`decode 阶段` 的 `arithmetic intensity` 只有个位数（远小于 50），在数量级上下降了 2 个数量级。当 `batch size` 为 8 时，与 `prefill 阶段` 相比，`decode 阶段` 的 `arithmetic intensity` 下降了 3 个数量级。
* 只有在非常大的 `batch size` 时（256），`decode 阶段` 才会变成计算密集型任务。然而，由于每个请求都需要 `KV 缓存`，因此，在实践中，如此高的 `batch size` 是不可行的。例如，对于 LLaMA 13B 模型，在输入序列长度为 1K 的情况下，在 [A6000](https://www.nvidia.com/en-us/design-visualization/rtx-a6000/) GPU 上，最多可以处理 18 个请求。因此，在实际的应用中，在实际可行的 `batch size` 的大小范围内，`decode 阶段` 仍然是 IO 密集型任务，会受到 IO 和内存的限制。

于是 [SARATHI](https://arxiv.org/abs/2308.16369) 给出了如下的 [A6000](https://www.nvidia.com/en-us/design-visualization/rtx-a6000/) GPU 上部署的 LLaMa-13B 大模型在不同 `batch size` 下的各阶段的 token 吞吐量（每毫秒处理的 tokens 数量）。

> 注意：为了能够让 `decode 阶段` 达到非常高的 `batch size`，在实验中，当 `batch size` 为 256 时，模型的 $n_{layers}$ 是 1 而不是原始的 40。

![From SARATHI, https://arxiv.org/abs/2308.16369](17319948375916.jpg)

如图所示：
* 当 $B \times L \ge 512$ 时，`prefill 阶段` 的吞吐量在 180 tokens/ms 左右时达到饱和。例如，当 `batch size` 为 1 时，当请求的输入序列长度 $L \ge 512$ 时就已经达到峰值吞吐量。
* 相比之下，当 `batch size` 比较小的时候，`decode 阶段` 的吞吐量呈现线性增长的趋势。只有当 `batch size` 达到 256 时，`decode 阶段` 的吞吐量才达到峰值。但是，如前所述，实际上，无法实现如此高的 `batch size`。

## 多 GPU 推理
随着大语言模型的参数量不断增加，把模型扩展到多个 GPU 并且采用多节点部署越来越有必要性。以 GPT-3 为例，其模型的参数大小为 1750 亿，如果模型的精度为 FP16，那么需要 350GB 的内存才能完全加载模型。但是，[A6000](https://www.nvidia.com/en-us/design-visualization/rtx-a6000/) 显卡的内存是 48GB，最新的 [A100](https://www.nvidia.com/en-us/data-center/a100/) 显卡的内存可以达到 80GB，由此可以看出，单块 GPU 无法加载 1750 亿参数的 GPT-3 并使其运行。

同时，如前所述，大型语言模型在推理阶段的吞吐量——尤其是 `decode 阶段` 的吞吐量受限于 GPU 上的 `batch size` 的最大值。如果模型可以并行，并将模型的权重参数分散到多个 GPU 上，那么就可以释放单个 GPU 的内存以支持更大的 `batch size`，进而提高模型的推理效率和吞吐。目前主要有两种方案来实现模型并行：tensor-parallelism(*TP*) 和 pipeline-parallelism(*PP*)[^NeMoP]。

`tensor-parallelism` 把模型的每一层的权重分散到不同的 GPU 上，每个 GPU 都将包含模型的所有层，只是每一层的参数权重会降低。此时，模型的权重和 `KV 缓存` 也会平均分配到各个 GPU 节点，从而使得每个 GPU 的 `batch size` 可以性扩展。我们可以把模型中某一层涉及到的权重分散到 2 个 GPU 上，其计算过程如下图所示[^TPDemo]。

![](17320000591724.jpg)
例如，可以采用 `tensor-parallelism` 把 GPT-3 部署到 20 个 [A6000](https://www.nvidia.com/en-us/design-visualization/rtx-a6000/) GPU，每个 GPU 只需 17.5 GB 的内存就可以存储模型参数，而剩余的内存则可用于不同 `batch size` 的用户请求和 `KV 缓存`，从而使得单个 GPU 的 `batch size` 可以线性增加。

然而，由于模型的每层有两次 [`all-reduce` 操作](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html)[^AllReduce]（一次在注意力计算，另一次在前向神经网络），这无疑带来了很高的通信成本。

`pipeline-parallelism` 主要用于大语言模型的跨节点部署，与 `tensor-parallelism` 相比，`pipeline-parallelism` 按层对模型进行拆分，其中每个 GPU 负责模型中的部分层的全部计算，并且包含这些层的所有参数权重。`pipeline-parallelism` 的示意图如下所示[^NeMoP]：

![](17320030900440.jpg)

例如，可以采用 `pipeline-parallelism` 把 GPT-3 部署到 12 个 [A6000](https://www.nvidia.com/en-us/design-visualization/rtx-a6000/) GPU，每个 GPU 只需要负责其中 8 层的计算，通过这种方式来释放 GPU 的内存从而提升单个 GPU 的 `batch size`。

在 `pipeline-parallelism` 中，为了使流水线中的所有 GPU 都保持忙碌，还会采用 `micro-batching` 技术[^MLLMTMicroB]。与 `tensor-parallelism` 相比，`pipeline-parallelism` 只需要通过点对点的方式为多层计算发送一次最终计算结果，因此 `pipeline-parallelism` 具有更好的计算通信比优势。因此，当 GPU 集群中缺乏像 [NVLink](https://www.nvidia.com/en-us/design-visualization/nvlink-bridges/) 这样的高速连接通道时，`pipeline-parallelism` 是目前唯一可行的模型并行方法。

`tensor-parallelism` 和 `pipeline-parallelism` 之间的不同可以参见下图[^TPPPD]：

![](17320028806804.jpg)

## 性能指标
在实际应用中，通常会通过并行化技术将大模型部署在多个 GPU 结点。为了提升用户体验，在实际响应用户请求时，也会通过批处理和推理阶段拆分等技术提升整体系统的性能。

如前所述，`prefill 阶段` 和 `decode 阶段` 对于 GPU 的负载以及批处理的 `batch size` 大小并不相同，不同阶段有各自的特点，并且 `prefill 阶段` 主要影响 `First Token` 的性能，而 `decode 阶段` 则主要影响系统的内存和吞吐，进而影响后续 token 的生成性能。因此，在评估大模型的性能指标时，我们需要综合考虑这些因素，来设计对应的指标，这样才能从系统层面做更好的优化。

从用户请求层面来看，大模型服务响应用户的请求流程如下所示[^NIM]：

![](17320781354210.jpg)

所以，评估大模型的性能指标主要有：
* TTFT（Time To First Token）：用于衡量从用户发送完请求到接收到第一个 token 所用的时间，可以用该指标评估 `prefill 阶段` 的性能。
![生成 First Token](17320783298264.jpg)
* E2ELatency（End-to-End Latency）：用于衡量从用户发送完请求到接受到最后一个 token 所用的总时间。
![生成所有 Token](17320783489548.jpg)
* ITL（Inter-Token Latency）：用于衡量 `decode 阶段` 生成的 token 之间的时间，可以用来评估流式输出过程是否存在卡顿。ITL 的计算方式为：

  $$ITL = \frac{\text{E2ELatency - TTFT}}{TotalOutputTokens - 1}$$
  
* TPOT（Time Per Output Token）：与上面介绍的平均 ITL 的概念是一致的。
* RPS（Requests Per Second）：用于衡量系统每秒可以相应的请求总数，可以用来评估系统的吞吐。
* TPS（Tokens Per Second）：用户衡量系统每秒可以生成的 token是总数，可以和 RPS 一起来评估系统整体的吞吐和性能。

## ISL & OSL
在系统层面来说，需要特别关注用户请求的输入、输出 tokens 数量的特性：
* 更长的输入 prompt（ISL: Input Sequence Length）会导致 `prefill 阶段` 的计算量更大，进而带来更大的 TTFT。
  ![From https://pytorch2024.sched.com/event/1fHnQ/understanding-the-llm-inference-workload-mark-moyou-nvidia](17320800431179.jpg)


* 更长的输出 tokens（OSL: Output Sequence Length）会导致 GPU 长时间消耗 `KV 缓存`，进而占用更多的系统资源，并不断降低系统的整体吞吐。

一般而言，可以根据 ISL 和 OSL 将用户请求分为如下的四种类型[^LLMInferenceWorkload]：
* LISO（Long Input Short Output）：总结会议摘要，总结较长文章的核心观点等场景。
* LILO（Long Input Long Output）：翻译，文章润色，代码修改等场景。
* SILO（Short Input Long Output）：文本创作——以北京的秋天为题写一篇 300 字的作文。
* SISO（Short Input Short Output）：问答场景——A100 GPU 的内存规格。

![From https://pytorch2024.sched.com/event/1fHnQ/understanding-the-llm-inference-workload-mark-moyou-nvidia](17320806601823.jpg)

如果不对用户请求类型进行合理的调度，就会形成如下所示的情况，并最终影响整体的用户体验。
![From https://pytorch2024.sched.com/event/1fHnQ/understanding-the-llm-inference-workload-mark-moyou-nvidia](17320807534949.jpg)

## KV 缓存详解
在 *Prefill & Decode* 部分，我们提到了 `KV 缓存` 并给出了不同模型的单 token `KV 缓存` 占用的内存空间。接下来，我们来详细介绍下为什么要使用 `KV 缓存`。

在大模型的推理过程中，当解码器生成下一个 token 之后，会将该 token 追加到原始的 prompt 中并重新输入解码器并预测下一个 token。因此，在一次请求中，prompt 的长度是不断增加的，并且每次推理都会重新计算如下所示的注意力。

$$
\text{Attention}(\mathbf{Q},\mathbf{K},\mathbf{V})=\text{softmax}\left(\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d_k}}\right)\mathbf{V}
$$

其中，$\mathbf{Q}, \mathbf{K}, \mathbf{V} \in \mathbb{R}^{L \times d_{head}}$。

我们将对应的矩阵转换成向量的向量的表示方式，例如：

$$
\mathbf{Q} = \begin{bmatrix}
q_{11} & q_{12} & \cdots & q_{1d_{head}} \\
q_{21} & q_{22} & \cdots & q_{2d_{head}} \\
\vdots & \vdots & \vdots & \vdots \\
q_{L1} & q_{L2} & \cdots & q_{Ld_{head}}
\end{bmatrix} =
\begin{bmatrix}
\mathbf{q}_1 \\
\mathbf{q}_2 \\
\vdots \\
\mathbf{q}_L
\end{bmatrix}
$$

于是，我们得到：

$$
\mathbf{Q} = 
\begin{bmatrix}
\mathbf{q}_1 \\
\mathbf{q}_2 \\
\vdots \\
\mathbf{q}_L
\end{bmatrix}, \ 
\mathbf{K} = 
\begin{bmatrix}
\mathbf{k}_1 \\
\mathbf{k}_2 \\
\vdots \\
\mathbf{k}_L
\end{bmatrix}, \ 
\mathbf{V} = 
\begin{bmatrix}
\mathbf{v}_1 \\
\mathbf{v}_2 \\
\vdots \\
\mathbf{v}_L
\end{bmatrix}
$$

其中，$\mathbf{q}_i, \mathbf{k}_i, \mathbf{v}_i \in \mathbb{R}^{1 \times d_{head}}$，$i = 1 \cdots L$。

于是，权重的计算可以表示为如下的形式：

$$
\mathbf{Q}\mathbf{K}^T = \begin{bmatrix}
\mathbf{q}_1 \\
\mathbf{q}_2 \\
\vdots \\
\mathbf{q}_L
\end{bmatrix} 
\begin{bmatrix}
\mathbf{k}_1^T, 
\mathbf{k}_2^T, \cdots,\mathbf{k}_L^T
\end{bmatrix} = 
\begin{bmatrix}
\mathbf{q}_1 \cdot \mathbf{k}_1 & \mathbf{q}_1 \cdot \mathbf{k}_2 & \cdots & \mathbf{q}_1 \cdot \mathbf{k}_L \\
\mathbf{q}_2 \cdot \mathbf{k}_1 & \mathbf{q}_2 \cdot \mathbf{k}_2 & \cdots & \mathbf{q}_2 \cdot \mathbf{k}_L \\
\vdots & \vdots & \vdots & \vdots \\
\mathbf{q}_L \cdot \mathbf{k}_1 & \mathbf{q}_L \cdot \mathbf{k}_2 & \cdots & \mathbf{q}_L \cdot \mathbf{k}_L
\end{bmatrix}
$$

因为 $\sqrt{d_k}$ 是一个常数，因此在计算 `softmax()` 时，可以先忽略 $\sqrt{d_k}$，也就是说，为了分析方便，我们令

$$
\text{Attention}(\mathbf{Q},\mathbf{K},\mathbf{V})=S\left(\mathbf{Q}\mathbf{K^T}\right)\mathbf{V}
$$

来替换自注意力机制的计算。

于是，我们得到如下的结果：

$$
\begin{aligned}
S\left(\mathbf{Q}\mathbf{K^T}\right)\mathbf{V} &=
\begin{bmatrix}
S(\mathbf{q}_1 \cdot \mathbf{k}_1) & S(\mathbf{q}_1 \cdot \mathbf{k}_2) & \cdots & S(\mathbf{q}_1 \cdot \mathbf{k}_L) \\
S(\mathbf{q}_2 \cdot \mathbf{k}_1) & S(\mathbf{q}_2 \cdot \mathbf{k}_2) & \cdots & S(\mathbf{q}_2 \cdot \mathbf{k}_L) \\
\vdots & \vdots & \vdots & \vdots \\
S(\mathbf{q}_L \cdot \mathbf{k}_1) & S(\mathbf{q}_L \cdot \mathbf{k}_2) & \cdots & S(\mathbf{q}_L \cdot \mathbf{k}_L)
\end{bmatrix}
\begin{bmatrix}
\mathbf{v}_1 \\
\mathbf{v}_2 \\
\vdots \\
\mathbf{v}_L
\end{bmatrix} \\
\\
\\
& = \begin{bmatrix}
S(\mathbf{q}_1 \cdot \mathbf{k}_1)\mathbf{v}_1 + S(\mathbf{q}_1 \cdot \mathbf{k}_2)\mathbf{v_2} + \cdots + S(\mathbf{q}_1 \cdot \mathbf{k}_L)\mathbf{v}_L \\
S(\mathbf{q}_2 \cdot \mathbf{k}_1)\mathbf{v}_1 + S(\mathbf{q}_2 \cdot \mathbf{k}_2)\mathbf{v}_2 + \cdots + S(\mathbf{q}_2 \cdot \mathbf{k}_L)\mathbf{v}_L \\
\vdots \\
S(\mathbf{q}_L \cdot \mathbf{k}_1)\mathbf{v}_1 + S(\mathbf{q}_L \cdot \mathbf{k}_2)\mathbf{v}_2 + \cdots + S(\mathbf{q}_L \cdot \mathbf{k}_L)\mathbf{v}_L
\end{bmatrix}
\end{aligned}
$$

如上是没有增加 Causal Mask（因果掩码）[^CM]的情况，当增加 Causal Mask 后则会变成如下的结果：

$$
\begin{aligned}
S\left(\mathbf{Q}\mathbf{K^T}\right)\mathbf{V} &=
\begin{bmatrix}
S(\mathbf{q}_1 \cdot \mathbf{k}_1) & 0 & \cdots & 0 \\
S(\mathbf{q}_2 \cdot \mathbf{k}_1) & S(\mathbf{q}_2 \cdot \mathbf{k}_2) & \cdots & 0 \\
\vdots & \vdots & \vdots & \vdots \\
S(\mathbf{q}_L \cdot \mathbf{k}_1) & S(\mathbf{q}_L \cdot \mathbf{k}_2) & \cdots & S(\mathbf{q}_L \cdot \mathbf{k}_L)
\end{bmatrix}
\begin{bmatrix}
\mathbf{v}_1 \\
\mathbf{v}_2 \\
\vdots \\
\mathbf{v}_L
\end{bmatrix} \\
\\
\\
& = \begin{bmatrix}
S(\mathbf{q}_1 \cdot \mathbf{k}_1)\mathbf{v}_1 \\
S(\mathbf{q}_2 \cdot \mathbf{k}_1)\mathbf{v}_1 + S(\mathbf{q}_2 \cdot \mathbf{k}_2)\mathbf{v}_2 \\
\vdots \\
S(\mathbf{q}_L \cdot \mathbf{k}_1)\mathbf{v}_1 + S(\mathbf{q}_L \cdot \mathbf{k}_2)\mathbf{v}_2 + \cdots + S(\mathbf{q}_L \cdot \mathbf{k}_L)\mathbf{v}_L
\end{bmatrix}
\end{aligned}
$$

因此可以看到，当没有增加 Causal Mask 时，对于第 $l$ 次迭代而言，其注意力机制的计算方式如下：

$$
S\left(\mathbf{Q}\mathbf{K^T}\right)\mathbf{V}|_{l} = \sum_{j=1}^{L}S(\mathbf{q}_l \cdot \mathbf{k}_j)\mathbf{v}_j
$$

当增加 Causal Mask 后，对于第 $l$ 次迭代而言，其注意力机制的计算方式如下：

$$
S\left(\mathbf{Q}\mathbf{K^T}\right)\mathbf{V}|_{l} = \sum_{j=1}^{l}S(\mathbf{q}_l \cdot \mathbf{k}_j)\mathbf{v}_j
$$

如果输入的 prompt 的初始 token 个数为 1，那么随着生成的进行，我们可以看到如下的变化：

$$
\begin{aligned}
S\left(\mathbf{Q}\mathbf{K^T}\right)\mathbf{V}|_{1} &= \sum_{j=1}^{1}S(\mathbf{q}_1 \cdot \mathbf{k}_j)\mathbf{v}_j \\
S\left(\mathbf{Q}\mathbf{K^T}\right)\mathbf{V}|_{2} &= \sum_{j=1}^{2}S(\mathbf{q}_2 \cdot \mathbf{k}_j)\mathbf{v}_j \\
S\left(\mathbf{Q}\mathbf{K^T}\right)\mathbf{V}|_{3} &= \sum_{j=1}^{3}S(\mathbf{q}_3 \cdot \mathbf{k}_j)\mathbf{v}_j \\
\vdots \\
S\left(\mathbf{Q}\mathbf{K^T}\right)\mathbf{V}|_{L} &= \sum_{j=1}^{L}S(\mathbf{q}_L \cdot \mathbf{k}_j)\mathbf{v}_j
\end{aligned}
$$

所以，当第 $l$ 次迭代时，对于 $\mathbf{q}$ 而言，只用到了当前的 $\mathbf{q}_l$，但是对于 $\mathbf{k}$、$\mathbf{v}$ 而言，则会重复使用到之前的 $\mathbf{k}_i$、$\mathbf{v}_i$（$i=1\cdots (l-1)$），为了避免重复计算，因此需要对 $\mathbf{k}$、$\mathbf{v}$ 进行缓存，这也就是 `KV 缓存` 的概念。

具体的过程如下所示[^LLMInferenceSurvey]：
```python
Input P : encoded input sequence [p1, p2, ..., pl]
Output X: generated new sequence [].
    
1: Forward Pass [p1, p2, ..., pl]
2: Store the KV cache: [(k1, v1), (k2, v2), ..., (kl, vl)]

3: for i from 1 to M do
4:     Predict the next token pl+i using the KV cache.
5:     Store (kl+i, vl+i) to the KV cache.
6:     X ← X ∪ {pl+i}

7:     if pl+i is EOS token or len(X)>max length then
8:         break
```

引入 `KV 缓存` 后，对于第 $l$ 次迭代而言，其注意力机制的计算方式如下[^KVGif]：

![](kv_cache_cacluation_demo.gif)

## 参考文献
[^GPUPBUG]: [GPU Performance Background User's Guide](https://docs.nvidia.com/deeplearning/performance/dl-performance-gpu-background/index.html)
[^A6000]: [NVIDIA RTX A6000](https://resources.nvidia.com/en-us-briefcase-for-datasheets/proviz-print-nvidia-1?ncid=no-ncid)
[^NeMoP]: [NVIDIA NeMo Framework User Guide: Parallelisms](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/parallelisms.html)
[^TPDemo]: [Tensor Parallelism: Supercharging Large Model Training with PyTorch Lightning](https://lightning.ai/lightning-ai/studios/tensor-parallelism-supercharging-large-model-training-with-pytorch-lightning)
[^AllReduce]: [Collective Operations](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html)
[^TPPPD]: [Pipeline Parallelism](https://uvadlc-notebooks.readthedocs.io/en/latest/tutorial_notebooks/scaling/JAX/pipeline_parallel_simple.html)
[^SARATHI]: [SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills](https://arxiv.org/abs/2308.16369)
[^LLMInferenceSurvey]: [LLM Inference Serving: Survey of Recent Advances and Opportunities](https://arxiv.org/abs/2407.12391v1)
[^MLLMTMicroB]: [Mastering LLM Techniques: Inference Optimization](https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization/)
[^LLMInferenceWorkload]: [Understanding the LLM Inference Workload - Mark Moyou, NVIDIA](https://pytorch2024.sched.com/event/1fHnQ/understanding-the-llm-inference-workload-mark-moyou-nvidia)
[^NIM]: [NIM for LLM Benchmarking Guide: Metrics](https://docs.nvidia.com/nim/benchmarking/llm/latest/metrics.html)
[^CM]: [Difference Between Attention Mask and Causal Mask](https://discuss.huggingface.co/t/difference-between-attention-mask-and-causal-mask/104922)
[^KVGif]: [Transformers KV Caching Explained](https://medium.com/@joaolages/kv-caching-explained-276520203249)