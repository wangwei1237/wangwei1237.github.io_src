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
* 一年之后，2018 年 6 月，OpenAI 发布了基于 Transformer 架构的 GPT-1[^gpt1]，虽然当时还存在一些局限性，例如当时还不能根据一个给定的标题来生成一篇新闻报道；但是，谁也没想到，就是这个框架，在 4 年之后成为了 AI 领域最炙手可热的模型。
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
### GPT-1
在 *Improving Language Understanding by Generative Pre-Training* [^gpt1] 中，OpenAI 提出了 GPT-1 的模型架构（预训练模型+下游任务微调），并且其核心是一种 **多层 Transformer 解码器** 的 Transformer 架构变体。GPT-1 先计算输入的上下文 tokens 的多头自注意力，然后在经过前向反馈网络的处理，最终生成目标输出 token 的概率分布。在论文的第 3 节 Framework 中，给出了模型的整体架构描述：

> In our experiments, we use a **multi-layer Transformer decoder** for the language model, which is a variant of the transformer. This model applies a multi-headed self-attention operation over the input context tokens followed by position-wise feedforward layers to produce an output distribution over target tokens.

在论文的第 4 节 Experiments 中，给出了模型的详细参数和训练细节，包括模型超参数、训练数据集和训练过程等：

> **Model specifications** 
> * Our model largely follows the original transformer work. 
> * We trained a 12-layer decoder-only transformer with masked self-attention heads (768 dimensional states and 12 attention heads). 
> * For the position-wise feed-forward networks, we used 3072 dimensional inner states. We used the Adam optimization scheme with a max learning rate of 2.5e-4. The learning rate was increased linearly from zero over the first 2000 updates and annealed to 0 using a cosine schedule. We train for 100 epochs on minibatches of 64 randomly sampled, contiguous sequences of 512 tokens. 
> * Since layernorm is used extensively throughout the model, a simple weight initialization of N(0,0.02) was sufficient. 
> * We used a bytepair encoding (BPE) vocabulary with 40,000 merges and residual, embedding, and attention dropouts with a rate of 0.1 for regularization. We also employed a modified version of L2 regularization proposed in , with w= 0.01 on all non bias or gain weights. For the activation function, we used the Gaussian Error Linear Unit (GELU). 
> * We used learned position embeddings instead of the sinusoidal version proposed in the original work.

### GPT-2
在 *Language Models are Unsupervised Multitask Learners* [^gpt2] 中的第 2 节 Approach 中，给出了 GPT-2 和 GPT-1 在处理下游任务的数据的不同：
* GPT-1 对下游任务的数据进行了标注和处理，加入了一些特殊的词元（\<s\>，\<e\>，\<$\>），分别表示开始、提取、分隔。在预训练阶段，模型没有见过这些词元，因此模型必须经过微调阶段的重新训练后才会认识这些新增加的词元。
* 在 GPT-2 的 Zero-Shot 的设定下，对于下游任务而言，模型不能再次被调整和更新，因此就无法再引入一些新的词元。也就是说，对于下游任务的输入，模型在预训练阶段都应该见过，这要求模型的输入必须更接近人类的自然语言。在建模过程中，只有一个学习任务，即给定输入序列来预测输出单词的概率：$p(output|input)$。同时，模型应该能够执行许多不同的任务，不同的任务，即使输入相同，模型的输出也应该不同，因此模型的学习目标就变成了在给定输入和任务的前提下预测输出的概率：$p(output|input, task)$。

在模型的后续发展中，我们称 GPT-2 中这种更接近人类自然语言的输入为 **提示词**（*Prompt*），GPT-2 的这种 Zero-Shot 设定和使用自然语言提示词来指导预训练模型执行下游任务是 GPT-2 的最大胆的一步。

但是，在模型结构上，论文的第 2.3 节 Model 中指出，GPT-2 与 GPT-1 相比基本一致，仅仅是做了一些小的修改而已：
* 把 Post-LN 改成了 Pre-LN
* 在最后一个 Transformer-Decoder 模块之后增加了一个 Norm 层。
* 扩大了 Transformer-Encoder 模块的层数以及模型对应的超参数的增加。

> We use a Transformer based architecture for our LMs. 
> * The model largely follows the details of the OpenAI GPT model (Radford et al., 2018) with a few modifications. 
> * Layer normalization was moved to the input of each sub-block, similar to a pre-activation residual network and an additional layer normalization was added after the final self-attention block.

### GPT-3
GPT-1 提出的“预训练模型+下游任务微调”的模式有一个很大的限制：下游任务需要针对特定任务标注数据集。GPT-2 虽然可以实 Zero-Shot，并不再需要针对特定任务标注数据集，但在当时仍然存在很多限制导致模型并没有达到 SOTA 的效果。

从应用的角度讲，持续提升 Zero-Shot 的效果非常必要，因为对于“预训练模型+下游任务微调”而言：
* 不同的下游任务都需要大量的标注数据集，但是下游任务类型非常多，如果每个任务都要收集数据集并微调的话，成本相对较大。
* 在下游任务上微调之后的效果好并不一定能说明预训练的大模型泛化效果好，还有可能是过拟合了预训练数据集所包含的一部分微调任务的数据而已。因此，对于下游任务而言，如果不需要针对性的微调，那么起决定性作用的就是预训练模型的泛化性。
* 从人类学习一个新技能的角度看，我们执行一个新的任务时并不需要巨大的数据集，可能看一两个例子就学会了。

对于所有类型的任务，在没有任何梯度更新或微调的情况下，GPT-3 只需通过自然语言文本的方式给出少量示例并指定任务就可以完成对应的任务。

在 *Language Models are Few-Shot Learners* [^gpt3] 的第 2.1 节 Model and Architectures 中指出，GPT-3 和 GPT-2 的模型架构是一致的，并且为了验证先前的论文 *Scaling Laws for Neural Language Models* [^scalinglaw] 中提出的“Scaling Laws”，OpenAI 特意训练了 8 个不同规模的模型。

> * We use the same model and architecture as GPT-2, including the modified initialization, pre-normalization, and reversible tokenization described therein, with the exception that we use alternating dense and locally banded sparse attention patterns in the layers of the transformer, similar to the Sparse Transformer. 
> * To study the dependence of ML performance on model size, we train 8 different sizes of model, ranging over three orders of magnitude from 125 million parameters to 175 billion parameters, with the last being the model we call GPT-3.

### GPT 架构的演化
因此，根据如上的描述，我们可以看出 GPT 系列模型架构的演化过程如下：

![从 Transformer 到 GPT 架构的演化](GPTX_arch.png)

利用如上的模型架构，我们可以实现如下所示的内容生成任务：

![使用 GPT 进行内容续写的示例](GPT_demo_for_student.gif)

## GPT 的压缩本质
在如上的 demo 中，GPT 是如何根据提示词来生成下一个词呢？

在 [自注意力究竟是什么？](/2024/10/16/What-exactly-is-attention/) 这篇文章的 *举个例子🌰* 这一节我们提到，经过矩阵的线性变换后，`I am good` 这三个词的词向量之间可以表示成如下的形式：

$$
\begin{aligned}
\mathbf{z_{I}}    &= 0.97 \cdot \mathbf{x_{I}} + 0.02 \cdot \mathbf{x_{am}} + 0.01 \cdot \mathbf{x_{good}} \\
\mathbf{z_{am}}   &= 0.27 \cdot \mathbf{x_{I}} + 0.73 \cdot \mathbf{x_{am}} + 0.00 \cdot \mathbf{x_{good}} \\
\mathbf{z_{good}} &= 0.90 \cdot \mathbf{x_{I}} + 0.05 \cdot \mathbf{x_{am}} + 0.05 \cdot \mathbf{x_{good}}
\end{aligned}
$$

换句话说，经过自注意力机制后，提示词中的最后一个词都将包含提示词中的任何一个单词的信息。随着 Transformer-Decoder 的层级不断增加，提示词中的最后一个词所包含的信息将会越来越丰富、越来越精准。从另一个角度来讲，经过多层 Transformer-Decoder 之后，提示词中的所有信息将压缩至了最后一个词向量中，然后，我们就可以利用最后一个词向量来生成下一个词。

具体的过程如下图所示：

![词向量的处理流程](llm_compress.png)

这也就是为什么 OpenAI 前首席科学家 Ilya Sutskever 在[公开采访](https://www.youtube.com/watch?v=goOa0biX6Tc&ab_channel=FuVenture) 中指出大规模预训练本质上是在做一个世界知识的压缩，从而能够学习到一个编码世界知识的参数模型，这个模型能够通过解压缩所需要的知识来解决真实世界的任务。

所以 Ilya Sutskever 一直的信念就是：
> 如果能够高效的压缩信息，就已经得到了知识。想高效压缩信息，就一定得有一些知识，所以他坚信 GPT-3 和最新的 GPT-4，它们已经有了一个世界模型在里面！GPT 学的其实不是语言，而是语言背后的那个真实世界。

在 [Language Modeling Is Compression](https://arxiv.org/pdf/2309.10668) 这篇论文中，作者也提到：
> 由于大模型表现出强悍的预测能力，因此它们非常适合成为强大的压缩器。我们通过压缩的视角来看待大模型的预测问题，并评估了大模型的压缩能力。

## GPT 模型的参数量
在 *Language Models are Few-Shot Learners* [^gpt3] 中提到，GPT-3 的参数数量是 1750 亿，我们也经常说 ChatGPT 的参数数量是 1750 亿，那么如何计算模型的参数数量呢？

既然 GPT-3 的架构、超参数都是公开的，我们不妨按照相关数据来测算一下 GPT-3 的参数数量，也借这个机会熟悉一下 GPT 系列模型的细节。

对于之前的文本生成的例子，下图展示了其中的一个迭代的详细过程：

![GPT 预测下一个词的详细过程](GPT_arch_detail.png)

如上图所示，对于 GPT 架构而言，整个预测的过程可以分为 6 个步骤：

1. 分词
  对于原始的输入 `我是一个学生`，首先需要使用某种分词算法进行分词，并得到分词之后的 Tokens 序列：
    > tokens = [我, 是, 一个, 学生]
  
    以 GPT-3 为例，模型的总词汇量（tokens）为 50257，每个 token 都有一个对应的 ID 序号，比如 `tokens = [我, 是, 一个, 学生]` 对应的 ID 序号为：
    > tokens = [176389, 22912, 52770]
  
    对于分词而言，并不涉及到任何的模型参数，由于涉及到的计算量并不大，因此整体的操作均在 CPU 上完成。得到 tokens 后，然后将对应的序列发送给 GPU 进行计算。

2. 词嵌入
  模型需要根据 `tokens = [176389, 22912, 52770]` 中的 ID 得到对应 token 的词向量，并组装成矩阵形式的输入序列 $\mathbf{X}$。在这个过程中，需要使用模型的词嵌入矩阵，该矩阵的每一行代表一个 token 的词向量，词嵌入矩阵的维度依赖于具体的模型。以 GPT-3 为例，其词汇量为 50257，每个 token 的维度为 12288，所以 GPT-3 的词嵌入矩阵的维度为 $50257 \times 12288$，也就是共计有 `617,558,016` 个参数。

3. 位置嵌入
  根据 [自注意力究竟是什么？中的 Transformer 中的 Positional Encoding 一节](/2024/10/16/What-exactly-is-attention/#transformer-中的-positional-encoding) 中的介绍，我们还需要对输入的矩阵 $\mathbf{X}$ 增加位置信息，并得到含有位置信息的输入矩阵 $\mathbf{X}$。而在该步骤中，需要使用到模型的位置嵌入矩阵，该矩阵的行数和模型的上下文大小一致，并且每一行的大小和模型的词嵌入矩阵中每个 token 的维度一致。以 GPT-3 为例，其模型上下文大小为 2048，所以 GPT-3 的位置嵌入矩阵的维度为 $2048 \times 12288$，也就是共计有 `25,165,824` 个参数。

4. 计算自注意力
  接下来，需要根据输入矩阵 $\mathbf{X}$ 计算自注意力，根据之前的介绍，需要首先利用 3 个权重矩阵 $\mathbf{W}^Q$、$\mathbf{W}^K$、$\mathbf{W}^V$ 对 $\mathbf{X}$ 进行线性变换并得到 $\mathbf{Q}$、$\mathbf{K}$、$\mathbf{V}$，然后利用 $\text{Attention}(\mathbf{Q},\mathbf{K},\mathbf{V})=\text{softmax}\left(\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d_k}}\right)\mathbf{V}$ 计算自注意力。在 GPT-3 中，$\mathbf{W}^Q$、$\mathbf{W}^K$、$\mathbf{W}^V$ 的维度均为 $12288 \times 128$，并且每个解码器包含 96 个自注意力模块，因此共计有 $12288 \times 128 \times 3 \times 96$——即 `452,984,832` 个参数。对于多头注意力计算的结果，还需要使用 $96*128 \times 12288$ 的矩阵 $\mathbf{W}^O$ 对其进行线性变换，因此还需要 $96*128 \times 12288$——即 `150,994,944` 个参数。因此，对于每个解码器而言，自注意力模块的参数共计有 `603,979,776` 个参数。而 GPT-3 中，共计包含 96 个解码器，因此共计有 `57,982,058,496` 个参数。

  ![](mhattention_parameters.png)

5. 前向反馈网络处理
  前向连接层的计算公式为：$\text{FFN}(\mathbf{x}) = \text{max}(0, \mathbf{x}\mathbf{W}_1 + \mathbf{b}_1)\mathbf{W}_2+\mathbf{b}_2$，因此，其参数包括四个部分：两个权重矩阵和两个偏置变换。权重矩阵的维度 = 词向量维度 * 隐藏层维度，在 GPT-3 中，隐藏层维度为 4 倍词向量维度，因此，前向反馈网络的参数量为 $12288 * (12288 * 4) * 2 + 12288 * 4 + 12288$——即 `1,208,020,992` 个参数。而 GPT-3 中，共计包含 96 个解码器，因此共计有 `115,970,015,232` 个参数。
6. 线性层生成 logit 向量 并计算概率
  最终，经过 96 层的解码器之后，我们得到了最后一个词的向量表示 $\mathbf{h}_n$，然后利用 $\text{softmax}(\mathbf{h}_n\mathbf{W}_e^T)$ 计算下一个词的可能概率。由于 $\mathbf{W}_e^T)$ 和模型的词向量矩阵是一致的，因此不需要额外的参数。


!!! note "归一化层的参数"
    对于 GPT-3 模型而言，除了如上的步骤外，在每一个解码器中，还会有 2 个归一化层，同时在最后一个解码器之后，还增加了一个额外的归一化层，其主要作用为：
    * 稳定训练过程：在深度神经网络中，层归一化通过将每层的输入标准化为相同的分布，减少了梯度爆炸或梯度消失的问题，使模型能够更稳定地进行训练。
    * 加速收敛：归一化层可以使模型在训练中更快地找到合适的权重参数，通常会加快模型的收敛速度，从而缩短训练时间。
    * 减小内部协变量偏移：归一化层通过使输入分布保持一致，减少了每层的激活分布随训练而发生的变化，从而有助于模型更容易捕捉数据的特征。
    * 提升泛化能力：归一化操作可以使模型的训练更具鲁棒性，从而在测试数据上表现更好，提高模型的泛化能力。
    
    归一化层只涉及到两个参数：缩放参数（gamma）和偏移参数（beta），这两个参数的大小和模型的词向量维度大小一致。因此，对于 GPT-3 而言，每个归一化层需要 `12288 * 2 = 24,576` 个参数。

我们可以使用如下的代码来计算 GPT 的参数数量，完整的代码参见 [llm_parameters.R](https://github.com/wangwei1237/R/blob/main/llm_parameters.R)。

```r
get_llm_parameters_cnt <- function(
  model_name = "",
  n_vocabulary,    # 模型的总 token 量
  n_ctx,           # 模型的 prompt 窗口大小
  d_model,         # 模型的 embedding 向量维度
  d_q,             # W^Q 矩阵的行向量维度
  d_k,             # W^K 矩阵的行向量维度
  d_v,             # W^V 矩阵的行向量维度
  n_heads,         # 每一个解码器中多头注意力矩阵的头数
  n_layers,        # 解码器的层数
  d_ff             # 前向反馈网络隐藏层的维度
) {
  n_embedding  <- n_vocabulary * d_model
  n_position   <- n_ctx * d_model

  # n_layers 层解码器的总参数
  n_attention  <- n_layers * single_decoder_attention_cnt(d_model,
                                                          d_q,
                                                          d_k,
                                                          d_v,
                                                          n_heads)
  n_ffn        <- n_layers * single_decoder_ffn_cnt(d_model, d_ff)
  n_norm       <- n_layers * single_decoder_norm_cnt(d_model)
  n_top_norm   <- 2 * d_model # 最顶层的 Norm 层的参数

  total_params <- n_embedding + n_position + n_attention + n_ffn + n_norm +
    n_top_norm

  # 输出相关参数
  df <- data.frame(Model     = model_name,
                   Embedding = n_embedding,
                   Emd_Rate  = round(n_embedding / total_params, 1),
                   Position  = n_position,
                   Attention = n_attention,
                   Atn_Rate  = round(n_attention / total_params, 1),
                   Ffn       = n_ffn,
                   Ffn_Rate  = round(n_ffn / total_params, 1),
                   Norm      = n_norm,
                   Total     = total_params)
  print(kable(df, format = "markdown"))

  return(total_params)
}
```

根据论文中公开的模型超参数，我们可以得到不同模型的参数数量，如下表所示：
```r
llm_list <- list(
  list(model_name = "GPT-1",
       n_vocabulary = 40000,
       n_ctx = 512,
       d_model = 768,
       d_q = 64,
       d_k = 64,
       d_v = 64,
       n_heads = 12,
       n_layers = 12,
       d_ff = 768 * 4),
  ...
  ...
)

get_llm_list_parameters_cnt(llm_list)
```

|Model        | Embedding| Emd_Rate| Position|   Attention| Atn_Rate|          Ffn| Ffn_Rate|    Norm|        Total|
|:------------|---------:|--------:|--------:|-----------:|--------:|------------:|--------:|-------:|------------:|
|GPT-1        |  30720000|      0.3|   393216|    28311552|      0.2|     56669184|      0.5|   36864|    116132352|
|GPT-2-Small  |  38597376|      0.3|   786432|    28311552|      0.2|     56669184|      0.5|   36864|    124402944|
|GPT-3-Small  |  38597376|      0.3|  1572864|    28311552|      0.2|     56669184|      0.5|   36864|    125189376|
|GPT-3-Medium |  51463168|      0.1|  2097152|   100663296|      0.3|    201449472|      0.6|   98304|    355773440|
|GPT-3-Large  |  77194752|      0.1|  3145728|   226492416|      0.3|    453169152|      0.6|  147456|    760152576|
|GPT-3-XL     | 102926336|      0.1|  4194304|   603979776|      0.4|    805552128|      0.5|  196608|   1516853248|
|GPT-3-2.7B   | 128657920|      0.0|  5242880|   838860800|      0.3|   1678131200|      0.6|  327680|   2651225600|
|GPT-3-6.7B   | 205852672|      0.0|  8388608|  2147483648|      0.3|   4295622656|      0.6|  524288|   6657880064|
|GPT-3-13B    | 258320980|      0.0| 10526720|  4210688000|      0.3|   8455300000|      0.7|  822400|  12935668380|
|GPT-3-175B   | 617558016|      0.0| 25165824| 57982058496|      0.3| 115970015232|      0.7| 4718592| 174599540736|

!!! attention "Attention Is (Not) All You Need"
    根据如上的参数量表格，在 GPT 架构中，Attention 层的参数占整个模型的参数的占比在 20%~40%，特别在 GPT-3-175B 模型中，Attention 层的参数占比只有 30%。因此，在大模型架构中，Attention 并非是模型的全部，*Attention Is **(Not)** All You Need*，这一点需要特别的注意。


## 参考文献
[^gpt1]: [Improving Language Understanding by Generative Pre-Training](https://openai.com/index/language-unsupervised/)
[^bert]: [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805)
[^gpt2]: [Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)
[^gpt3]: [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)
[^gpt35]: [Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155)
[^harnessingpowerllmspractice]: [Harnessing the Power of LLMs in Practice: A Survey on ChatGPT and Beyond](https://arxiv.org/abs/2304.13712)
[^t5]: [Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683)
[^scalinglaw]: [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)