---
title: 自注意力究竟是什么？
reward: false
top: false
date: 2024-10-16 17:19:11
authors:
categories:
  - 算法与数学
tags:
  - Attention
  - 自注意力机制
  - Transformer
---

![](1.png)

最近的 1 年多以来，一直使用 文心一言、豆包、Kimi 等大模型来帮助自己提高各种场景的效率，但是一直没有对当前大模型的底层原理做深入了解。在编写 [Large Language Model in Action](https://wangwei1237.github.io/LLM_in_Action/) 这本书的时候，我也曾说过：

> 这是一本关于大语言模型实践的书籍，而不是一本深入研究大语言模型的运行原理和底层算法的书籍。

但是，2024 年 10 月 1 日，OpenAI 发布了 [Prompt Caching in the API](https://openai.com/index/api-prompt-caching/) 以提升大语言模型 API 的性能。当听到这个消息的时候，我感到非常震惊，也非常兴奋，于是接下来的几天我总想搞明白这背后的原理是什么，这里的 `prompt caching` 又究竟是什么？

于是，我想，是时候需要深入了解一下当前大模型的起点——Transformer 模型，也是时候需要深入了解一下究竟什么是自注意力机制。
<!--more-->

## 向量的点积和矩阵表示
令 $\mathbf{x}$ 和 $\mathbf{y}$ 表示维度为 $n$ 的向量，即：

$$
\begin{aligned}
\mathbf{x} &= [x_1, x_2, ..., x_n] \\
\mathbf{y} &= [y_1, y_2, ..., y_n]
\end{aligned}
$$

则 $\mathbf{x}$ 和 $\mathbf{y}$ 的点积运算（$\cdot$）可以表示这两个向量之间的相似度，向量点积越大，表明两个向量越相似。

$$
\mathbf{x} \cdot \mathbf{y} = \sum_{i=1}^{n}{x_iy_i} = x_1y_1 + x_2y_2 +...+ x_ny_n
$$

如果用向量 $\mathbf{x}$ 表示一个词的词向量，对于 $m$ 个词向量而言，其任意两个词向量之间的相似度可以表示为：

$$
\mathbf{x_i} \cdot \mathbf{x_j} = \sum_{k=1}^{n}{x_{ik}y_{jk}} = x_{i1}y_{j1} + x_{i2}y_{j2} + ... + x_{in}y_{jn} \quad \forall i,j = 1,2,\cdots,m
$$


如果用 $m \times n$ 的矩阵 $\mathbf{X}$ 来表示 $m$ 个词向量，

$$
\mathbf{X} = \begin{bmatrix}
\mathbf{x_1} \\
\mathbf{x_2} \\
\vdots \\
\mathbf{x_m}
\end{bmatrix} = \begin{bmatrix}
x_{11} & x_{12} & \cdots & x_{1n} \\
x_{21} & x_{22} & \cdots & x_{2n} \\
\vdots & \vdots & \vdots & \vdots \\
x_{m1} & x_{m2} & \cdots & x_{mn}
\end{bmatrix}
$$

则 $\mathbf{S} = \mathbf{X} \mathbf{X}^T$ 为 $m \times m$ 的矩阵，并且 $s_{ij} = \mathbf{x_i} \cdot \mathbf{x_j}$ 表示第 $i$ 个词向量和第 $j$ 个词向量之间的相似度。

$$
\mathbf{X}\mathbf{X}^T = \begin{bmatrix}
\mathbf{x_1} \cdot \mathbf{x_1} & \mathbf{x_1} \cdot \mathbf{x_2} & \cdots & \mathbf{x_1} \cdot \mathbf{x_m} \\
\mathbf{x_2} \cdot \mathbf{x_1} & \mathbf{x_2} \cdot \mathbf{x_2}  & \cdots & \mathbf{x_2} \cdot \mathbf{x_m} \\
\vdots & \vdots & \vdots & \vdots \\
\mathbf{x_m} \cdot \mathbf{x_1} & \mathbf{x_m} \cdot \mathbf{x_2}  & \cdots & \mathbf{x_m} \cdot \mathbf{x_m}
\end{bmatrix}
$$

使用 `softmax()` 函数对矩阵 $\mathbf{S}$ 进行归一化处理得到矩阵 $\mathbf{W} = \text{softmax}\left(\mathbf{X}\mathbf{X}^T\right)$，使得 $\mathbf{W}$ 中每一行的所有元素之和都为 1，于是每一行的各个元素就可以看作是一个权重。

$w_{i1},w_{i2},\cdots,w_{im}$ 分别表示第 $i$ 个词向量和第 $1,2,\cdots,m$ 个词向量之间的相似度权重，用该权重分别乘以对应的词向量，于是我们得到了第 $i$ 个词的新的表达形式 $\mathbf{z_i}$，某个词向量的权重越大，表示相似度越高。

$$
\mathbf{z_i} = \sum_{k=1}^{m}{w_{ik}\mathbf{x_k}} = w_{i1}\mathbf{x_1} + w_{i2}\mathbf{x_2} + \cdots + w_{im}\mathbf{x_m} 
$$ 

对于 $m$ 个词向量都执行如上的操作可以得到：
$$
\mathbf{Z} = \begin{bmatrix}
\mathbf{z_1} \\
\mathbf{z_2} \\
\vdots \\
\mathbf{z_m}
\end{bmatrix} = \begin{bmatrix}
w_{11}\mathbf{x_1} + w_{12}\mathbf{x_2} + \cdots + w_{1m}\mathbf{x_m} \\
w_{21}\mathbf{x_1} + w_{22}\mathbf{x_2} + \cdots + w_{2m}\mathbf{x_m} \\
\vdots \\
w_{m1}\mathbf{x_1} + w_{m2}\mathbf{x_2} + \cdots + w_{mm}\mathbf{x_m}
\end{bmatrix}
$$

实际上，可以证明：

$$
\mathbf{Z} = \mathbf{W}\mathbf{X} = \text{softmax}\left(\mathbf{X}\mathbf{X}^T\right)\mathbf{X}
$$

于是，对于原始的词向量矩阵 $\mathbf{X}$ 而言，经过一些列的矩阵乘法运算，我们得到了根据相关性权重的加权词向量表示。也就是说原始的词向量 $\mathbf{x_i}$ 可以表示为所有词向量的加权表示 $\mathbf{z_i}$。所以，可以用 `Attention` 来解释一句话中不同词之间的相互关系。Transformer 模型中的 `Attention` 其实就是矩阵 $\mathbf{Z}$，所以 Transformer 可以理解输入序列中的不同的部分，并分析输入序列中不同词之间的关系，进而捕获到上下文信息。

了解如上介绍的 $\text{softmax}\left(\mathbf{X}\mathbf{X}^T\right)\mathbf{X}$ 背后的逻辑对于理解 Transformer 中的各个矩阵的含义至关重要，因此我们花了很大的篇幅来对其进行分析。

接下来，我们用一个具体的例子来展示如上的过程。

### 举个例子🌰
以 `I am good` 这句话为例，我们用词向量 $\mathbf{x_1}$ 表示 `I`，$\mathbf{x_2}$ 表示 `am`，$\mathbf{x_3}$ 表示 `good`，对应的词向量分别为：

$$
\begin{aligned}
\mathbf{x_1} &= [1, 3, 2] \\
\mathbf{x_2} &= [1, 1, 3] \\
\mathbf{x_3} &= [1, 2, 1]
\end{aligned}
$$

所以，我们有矩阵 $\mathbf{X}$：

$$
\mathbf{X} = \begin{bmatrix}
1 & 3 & 2 \\
1 & 1 & 3 \\
1 & 2 & 1
\end{bmatrix}
$$

于是，$\mathbf{W}$ 矩阵的计算过程如下：

![](zmatrix.png)

权重矩阵 $\mathbf{W}$ 中某一行分别与 $\mathbf{X}$ 的一列相乘，如前所述，该操作相当于对 $\mathbf{X}$ 中各行向量（不同的词向量）加权求和，得到的结果是每个词向量 $\mathbf{x_i}$ 经过加权求和之后的新表示 $\mathbf{z_i}$，而权重矩阵则是经过相似度和归一化计算而得到的。

![](vec_matrix.png)

$$
\begin{aligned}
\mathbf{z_{I}}    &= 0.97 \cdot \mathbf{x_{I}} + 0.02 \cdot \mathbf{x_{am}} + 0.01 \cdot \mathbf{x_{good}} \\
\mathbf{z_{am}}   &= 0.27 \cdot \mathbf{x_{I}} + 0.73 \cdot \mathbf{x_{am}} + 0.00 \cdot \mathbf{x_{good}} \\
\mathbf{z_{good}} &= 0.90 \cdot \mathbf{x_{I}} + 0.05 \cdot \mathbf{x_{am}} + 0.05 \cdot \mathbf{x_{good}}
\end{aligned}
$$

### R 实现过程

```R
softmax <- function(mat) {
  exp_mat <- exp(mat)           # 对矩阵中的每个元素取指数
  row_sums <- rowSums(exp_mat)  # 计算每行的总和
  softmax_mat <- sweep(exp_mat, 1, row_sums, FUN = "/")  # 对每行进行归一化
  return(softmax_mat)
}

X <- matrix(c(1, 3, 2, 1, 1, 3, 1, 2, 1), nrow = 3, byrow = TRUE)
W <- softmax(X %*% t(X))
Z <- W %*% X
print(Z)

#=================================================================

     [,1]     [,2]     [,3]
[1,]    1 2.957691 2.011295
[2,]    1 1.540148 2.722573
[3,]    1 2.864164 2.000000
```

### 引入新的矩阵
现在，我们引入一个新的矩阵 $\mathbf{Y}$，并令 

$$
\mathbf{Z} = \text{softmax}\left(\mathbf{X}\mathbf{Y}^T\right)\mathbf{Y} = \mathbf{W}\mathbf{Y}
$$

根据之前的描述，此时的 $\mathbf{Z}$ 为 $\mathbf{X}$ 中的每一个词向量 $\mathbf{x_i}$ 在 $\mathbf{Y}$ 中的每一个词向量 $\mathbf{y_j}$ 的加权表示，即：

$$
\mathbf{x_i} = \sum_{j=1}^{m}{w_{ij}\mathbf{y_j}}
$$

![](w_xy.png)

$$
\begin{aligned}
\mathbf{z_{I}}    &= 0.95 \cdot \mathbf{y_{\text{我}}} + 0.05 \cdot \mathbf{y_{\text{很好}}} \\
\mathbf{z_{am}}   &= 0.12 \cdot \mathbf{y_{\text{我}}} + 0.88 \cdot \mathbf{y_{\text{很好}}} \\
\mathbf{z_{good}} &= 0.88 \cdot \mathbf{y_{\text{我}}} + 0.12 \cdot \mathbf{y_{\text{很好}}} 
\end{aligned}
$$

如上的计算和权重只是为了说明原理而随机选择的数据，并不代表真实的相关性。因此，我们会看到 `good` 和 `我`（而不是 `很好`） 之间的关系最相似。

## Transformer 中的自注意力
论文 [Attention Is All You Need](https://arxiv.org/html/1706.03762v7) 的 3.2 节对 Attention 的描述如下[^1]：

> An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors.
>  
> The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.

论文中也给出了 Self-Attention 的计算公式：

$$
\text{Attention}(\mathbf{Q},\mathbf{K},\mathbf{V})=\text{softmax}\left(\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d_k}}\right)\mathbf{V}
$$

其中，$\mathbf{Q}$、$\mathbf{K}$ 和 $\mathbf{V}$ 都是矩阵，分别代表 `Query`、`Key` 和 `Value`，$d_k$ 是 $\mathbf{K}$ 的行向量维度。 `Query`、`Key` 和 `Value` 都是为了计算 `自注意力` 而引入的抽象的概念，它们都是对原始的输入 $\mathbf{X}$ 的线性变换。

$$
\begin{aligned}
\mathbf{Q} &= \mathbf{X}\mathbf{W}^Q \\
\mathbf{K} &= \mathbf{X}\mathbf{W}^K \\
\mathbf{V} &= \mathbf{X}\mathbf{W}^V
\end{aligned}
$$

因为 $\mathbf{X}$ 是 $m \times n$ 的矩阵，所以如果令 $\mathbf{W}^Q$、$\mathbf{W}^K$、$\mathbf{W}^V$ 均是 $n \times n$ 的单位矩阵 $\mathbf{I}$，那么 $\mathbf{Q}$、$\mathbf{K}$、$\mathbf{V}$ 经过线性变换（$\mathbf{I}$）后仍然是 $\mathbf{X}$，此时我们可以用 $\mathbf{X}$ 替换 $\mathbf{Q}$、$\mathbf{K}$、$\mathbf{V}$，那么公式就变成了：

$$
\text{Attention}(\mathbf{Q},\mathbf{K},\mathbf{V})=\text{softmax}\left(\frac{\mathbf{X}\mathbf{X}^T}{\sqrt{d_k}}\right)\mathbf{X}
$$

这也就是为什么我们之前面说：Transformer 模型中的 `Attention` 其实就是对原始输入词向量的加权求和而得到的新的表示，在新的表示中，Transformer 可以理解输入序列中的不同的部分，并分析输入序列中不同词之间的关系，进而捕获到上下文信息。

实际上，为了增强增强模型的拟合能力，我们并不会采用单位矩阵 $\mathbf{I}$ 对矩阵 $\mathbf{X}$ 做线性变换，而是分别采用 $\mathbf{W}^Q$、$\mathbf{W}^K$、$\mathbf{W}^V$ 这三个可以通过大量语料训练而学习到的参数矩阵（参数矩阵可以是任何维度，但行向量个数必须和 $\mathbf{X}$ 的行向量维度一致）。

除此之外，在计算 `softmax()` 之前，Transformer 会用 $\sqrt{d_k}$ 对 $\mathbf{Q}\mathbf{K}^T$ 的结果进行缩放，所以论文中也把 `自注意力` 叫作：Scaled Dot-Product Attention。当 $d_k$ 很大时，$\mathbf{Q}\mathbf{K}^T$ 的向量点积会非常大，如果不进行缩放，`softmax()` 的梯度会非常小，进而导致在反向传播时，模型参数更新的速度会变慢，甚至接近停滞，影响模型的学习效率。

自注意力机制的整体流程如下图所示：

![自注意力机制](sattention.png)

所以，根据 $\text{Attention}(\mathbf{Q},\mathbf{K},\mathbf{V})$，Transformer 可以理解一句话中不同词之间的相互关系。

$\mathbf{Q},\mathbf{K},\mathbf{V}$ 和原始输入之间的关系如下图所示[^4]：

![计算 Q、K、V 矩阵的示例](qkv.png)


### Scaled 的说明
对于一个 $m\times n$ 的矩阵 $\mathbf{A}$，`softmax()` 的计算如下：

$$
\text{softmax}(\mathbf{A}_{ij}) = \frac{e^{\mathbf{A}_{ij}}}{\sum_{k=1}^{n}e^{\mathbf{A}_{ik}}}
$$

$d_k$ 变大时，会存在向量点积结果过大的可能性，如果 $\mathbf{A}_{ij}$ 很大，则 $e^{\mathbf{A}_{ij}}$ 会迅速趋近于无穷大，而行向量中其余较小的 $\mathbf{A}_{ij}$ 则会变得相对较小。此时，`softmax()` 的结果会向 0 或 1 的两个极端值推移。

根据 `softmax()` 的梯度定义[^2]：

$$
\frac{\partial \text{softmax}(\mathbf{A}_{ij})}{\partial \mathbf{A}_{ij}} = \text{softmax}(\mathbf{A}_{ij})(1 - \text{softmax}(\mathbf{A}_{ij}))
$$

当 `softmax()` 的输出值过于极端（输出 0 或 1）时，`softmax()` 的梯度结果将趋近于零，在反向传播时，模型参数的更新速度会非常慢，甚至接近停滞。这也就是所谓的梯度消失（vanishing gradient）问题，梯度消失会导致模型训练效率极大降低，特别是在深度神经网络中，梯度消失可能会导致网络无法有效学习。

为了避免梯度消失问题，可以使用 $\frac{1}{\sqrt{d_k}}$ 缩放点积结果：$\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d_k}}$。缩放之后，点积结果的数值会变小，确保 `softmax()` 的输入不会过大，避免 `softmax()` 输出过于极端的值，从而使得 `softmax()` 的梯度更加适中，进而更有利于模型的有效训练。

### Multi-Head Attention
回想一下前面我们介绍的 `I am good` 的例子，我们假设该结果就是按照 Transforer 中的自注意力机制计算而来，那么 `good` 的自注意力为：

$$
\mathbf{z_{good}} = 0.90 \cdot \mathbf{v_{I}} + 0.05 \cdot \mathbf{v_{am}} + 0.05 \cdot \mathbf{v_{good}}
$$

由此，我们可以看出，`good` 的自注意力值实际上由 `I` 的值向量来主导。

但是如果我们要计算下句中的 `it` 的自注意力值呢？`it` 的自注意力值应该由 `dog` 主导还是由 `food` 主导呢？当然，我们可以很容易的看出，`it` 的自注意力值应该由 `dog` 主导，但是机器如何来判断呢？

> A dog ate the food because it was hungry.

如果 `it` 的自注意力值的结果如下所示，那么 `it` 的自注意力值确实由 `dog` 主导：

![](msattention.png)

但如果 `it` 的自注意力值的结果如下所示呢？

![](msattention_2.png)

因此，为了确保结果的准确性，我们不能依赖一个注意力矩阵，而应该计算多个注意力矩阵，并将这多个注意力矩阵的结果整合起来，这也就是 `Multi-Head Attention` 的由来[^3]。如果我们有 $h$ 个注意力矩阵，那么我们可以按如下的方式将这 $h$ 个注意力矩阵的结果整合起来得到最终的注意力矩阵：

$$
\text{MultiHeadAttention} = \text{Concatenate}(\mathbf{Z}_1,\cdots,\mathbf{Z}_h)\mathbf{W}_O
$$

其中，$\mathbf{W}_O$ 是一个新的权重矩阵。

## Transformer 中的 Positional Encoding
对于 Transformer 模型而言，为了缩短训练时间，我们会将一句话中的所有的词并行的输入到模型中。但是，这也带来了一个问题：并行输入的词向量之间丢失了相互之间的位置信息。词序信息能够帮助 Transformer 模型学习词与词之间的相互关系，因此，为了解决这个问题，Transformer 中引入了 `Positional Encoding`。

对于一个给定的句子，例如：`I am good`，我们首先计算每个单词的词向量表示（假定词向量的维度为 $d_{model}$）。如果 $d_{model} = 4$，那么对于 `I am good` 而言，我们就得到了 $3 \times 4$ 的输入矩阵 $\mathbf{X}$：

![输入矩阵 X](pe_input_x.png)

如果把 $\mathbf{X}$ 直接输入到 Transformer 的 Encoder 中，那么模型无法理解不同单词之间的词序。所以，需要对 $\mathbf{X}$ 增加一些表示词序信息的数据，以便模型可以正确理解句子的含义。为此，我们可以构造一个包含位置编码信息的矩阵 $\mathbf{P}$，然后把矩阵 $\mathbf{P}$ 添加到 $\mathbf{X}$ 中，即可得到包含位置信息的输入矩阵。

在 [Attention Is All You Need](https://arxiv.org/html/1706.03762v7) 的第 3.5 节 **Positional Encoding** 中给出了位置矩阵的计算方式：

$$
\begin{aligned}
\mathbf{P}(pos, 2i) &= sin\left(\frac{pos}{10000^{2i/d_{model}}}\right) \\ 
\mathbf{P}(pos, 2i + 1) &= cos\left(\frac{pos}{10000^{2i/d_{model}}}\right)
\end{aligned}
$$

* $pos$ 表示当前的单词在句子中的位置，也就是输入矩阵的第 $pos$ 行（从 0 开始索引）；
* $i$ 表示当前的单词在输入矩阵中的列位置，$2i$ 表示 $\mathbf{P}$ 的所有偶数列，$2i+1$ 表示所有的奇数列。
* $d_{model}$ 是词向量的维度。

根据位置矩阵的计算公式，对与所有的偶数列，使用正弦函数计算位置编码信息；对于所有的奇数列，使用余弦函数计算位置编码信息。对于 `I am good` 而言，位置矩阵 $\mathbf{P}$ 的计算结果如下：

$$
\begin{aligned}
\mathbf{P} &= 
\begin{bmatrix}
sin\left(\frac{pos}{10000^{0}}\right) & cos\left(\frac{pos}{10000^{0}}\right) & sin\left(\frac{pos}{10000^{2/4}}\right) & cos\left(\frac{pos}{10000^{2/4}}\right) \\
sin\left(\frac{pos}{10000^{0}}\right) & cos\left(\frac{pos}{10000^{0}}\right) & sin\left(\frac{pos}{10000^{2/4}}\right) & cos\left(\frac{pos}{10000^{2/4}}\right) \\
sin\left(\frac{pos}{10000^{0}}\right) & cos\left(\frac{pos}{10000^{0}}\right) & sin\left(\frac{pos}{10000^{2/4}}\right) & cos\left(\frac{pos}{10000^{2/4}}\right)
\end{bmatrix} \\
&= \begin{bmatrix}
sin(0) & cos(0) & sin(0/100) & cos(0 / 100) \\
sin(1) & cos(1) & sin(1/100) & cos(1 / 100) \\
sin(2) & cos(2) & sin(2/100) & cos(2 / 100) \\
\end{bmatrix} \\
&= \begin{bmatrix}
0 & 1 & 0 & 1 \\
0.841 & 0.54 & 0.01 & 0.99 \\
0.909 & -0.416 & 0.02 & 0.99 
\end{bmatrix}
\end{aligned}
$$

于是，我们得到了包含位置信息的输入矩阵 $\mathbf{X} + \mathbf{P}$：

$$
\begin{aligned}
\mathbf{X} + \mathbf{P} &= 
\begin{bmatrix}
1.8 & 2.2 & 3.4 & 5.8 \\
7.3 & 9.9 & 8.5 & 7.1 \\
9.1 & 7.1 & 0.9 & 10.1 
\end{bmatrix} + 
\begin{bmatrix}
0 & 1 & 0 & 1 \\
0.841 & 0.54 & 0.01 & 0.99 \\
0.909 & -0.416 & 0.02 & 0.99 
\end{bmatrix} \\
&= \begin{bmatrix}
1.8 & 3.2 & 3.4 & 6.8 \\
8.141 & 10.44 & 8.51 & 8.09 \\
10.009 & 6.684 & 0.92 & 11.09
\end{bmatrix}
\end{aligned}
$$

计算位置矩阵的 R 代码如下所示：

```r
# 位置编码函数，从 0 开始计算
get_position_encoding <- function(seq_len, d_model) {
  position <- 0:(seq_len - 1)
  div_term <- exp(seq(0, d_model - 1, by = 2) * -(log(10000) / d_model))
  
  # 初始化位置编码矩阵
  position_enc <- matrix(0, nrow = seq_len, ncol = d_model)
  for (pos in 0:(seq_len - 1)) {
    # 奇数索引：sin函数
    position_enc[pos + 1, seq(1, d_model, by = 2)] <- sin(pos * div_term)
    # 偶数索引：cos函数
    position_enc[pos + 1, seq(2, d_model, by = 2)] <- cos(pos * div_term)
  }
  return(position_enc)
}

# 生成位置编码矩阵
position_encoding_matrix <- get_position_encoding(3, 4)

# 查看位置编码矩阵
print(position_encoding_matrix)
```

如果一个句子包含 128 个词，每个词向量的维度 $d_{model} = 512$，那么位置编码矩阵的维度为 $128 \times 512$，可以用如下的 R 代码生成位置编码矩阵，并对其可视化。

```r
position_encoding_matrix <- get_position_encoding(128, 512)
position_encoding_df <- melt(position_encoding_matrix)

# 绘制热图
ggplot(position_encoding_df, aes(x = Var2, y = Var1, fill = value)) +
  geom_tile() +
  scale_fill_viridis_c() +                     # 使用类似的颜色映射
  scale_y_reverse() + 
  theme_minimal(base_family = "STKaiti") + 
  scale_x_continuous(expand = expansion(mult = c(0, 0.05))) + 
  labs(title = "Position Encoding 可视化",
       x = "Dimensions", y = "words", fill = "Value") + 
  theme(panel.grid.major.x = element_blank(),  # 移除 x 轴的主要网格线
        panel.grid.minor.x = element_blank(),
        panel.grid.minor.y = element_blank(),
        axis.line = element_line(),           # 保留x轴和y轴本身
        axis.ticks = element_line(),          # 保留x轴和y轴上的刻度线
        legend.position = "top",              # 图例放置在左上角
        legend.justification = c(0, 1),       # 设置图例的对齐方式
        legend.title = element_blank())
```

![](pe_hot_image.png)

## Transformer 中的 Encoder
在 `Multi-Head Attention` 和 `Positional Encoding` 的基础之上，再增加前馈网络、叠加和归一组件，就得到了完整的 Transformer Encoder。当然，实际中，可以将 $N$ 个 Encoder 一个一个的叠加起来，最后一个 Encoder 的输出就是原始输入内容的特征值 $\mathbf{R}$（矩阵 $\mathbf{R}$ 与输入内容的词向量矩阵的维度是一致的）。

![Encoder 架构图](encoder.png)

## Transformer 中的 Decoder
假设我们要把英语句子 `I am a student`（原句）翻译成中文 `我是一个学生`（目标句）。

1. 首先，我们把原句 `I am a student` 输入到 Transformer 的 Encoder 中，让 Encoder 学习原句并得到原句的特征矩阵 $\mathbf{R}$。
2. 然后，我们把 $\mathbf{R}$ 输入到解码器，解码器根据 $\mathbf{R}$ 和解码器之前的输出作为输入，并生成目标句中的下一个词，直到生成目标句为止（解码器每次迭代会生成一个词，直到生成目标句为止）。

具体的生成过程如下图所示：

![解码器的例子](decode_demo1.gif)

### 带掩码的多头注意力层
以如上的翻译认为为例，假设训练数据集如下所示：

| 原句 | 目标句 |
| :---: | :---: |
| I am a student | 我是一个学生 |
| I am a teacher | 我是一个老师 |
| Good morning | 早上好 |
| Thank you very much | 非常感谢你 |

上表所示的数据集由两部分构成：`原句` 和 `目标句`。如前所述，我们也了解了解码器在 **运行时** 逐字（token）预测目标句的过程。但是，在训练时，由于我们有标注好的、正确的 `目标句`，所以，为了简化训练过程，我们可以对整个 `目标句` 稍作修改然后将其作为输入（而不需要像 **运行时** 那样逐字输入）。解码器把输入的 **\<sos\>**（start of sequence）作为第一个 token，并在之后的每一步中把下一个预测 token 追加到当前的输入，以预测目标句，直到预测输出为 **\<eos\>**（end of sequence）为止。因此，在训练时，我们只需要把 **\<sos\>** 添加到 `目标句` 的开头，然后将其作为输入发送给解码器，具体如下图所示。

![Transformer 中的编码器和解码器](encoder_decoder_demo1.png)

如上图所示，如果要把 `I am a student` 翻译成 `我是一个学生`，我们只需要把 `<sos>我是一个学生` 作为输入发送给解码器，解码器的目标是根据 `I am a student` 和 `<sos>我是一个学生` 预测输出 `我是一个学生<eos>`。

对于解码器的输入序列而言，我们会先将其转换成嵌入矩阵并增加位置编码信息得到输入矩阵 $\mathbf{X}$，然后我们将 $\mathbf{X}$ 输入到编码器中进行后续的预测。假设矩阵 $\mathbf{X}$ 为：

$$
\mathbf{X} = \begin{bmatrix}
1.1 & 1.2  & 1.3  & \cdots & 1.4 \\
1.5 & 1.6  & 1.7  & \cdots & 1.8 \\
1.2 & 1.1  & 1.3  & \cdots & 1.2 \\
1.4 & 1.5  & 1.6  & \cdots & 1.7 \\
1.6 & 1.3  & 1.4  & \cdots & 1.5
\end{bmatrix}
$$

解码器首先会计算 $\mathbf{X}$ 的自注意力矩阵 $\mathbf{Z}$，然后计算句子中所有词之间的关联并提取每个词的信息。但是与编码器不同的是，在解码器的 **运行时**，解码器只是将上一个步骤生成的词作为输入，而不是将整个输入序列作为输入。因此，在第 $2$ 步时，解码器的输入中只有 $[<sos>, 我]$，所以我们只能得到这两个词之间的关联，而不能得到之后的任何词的信息。

因此，在训练期间，虽然我们可以将整个 `目标句` 作为输入，但是我们仍然需要以解码器在 `运行时` 的运行方式来训练模型。也就是说，在训练期间，我们只能计算 `目标句` 序列中某个词和该词之前的所有词之间的注意力。为此，可以引入 `掩码` 的概念以实现这个目的。例如，我们想要预测 `<sos>我` 之后的词 `是`，此时，模型应该只看到 `<sos>我`，所以我们需要用掩码来阻止模型看到 `我` 之后的词。

![掩码的例子](mask_demo.png)

根据注意力矩阵的计算方式：

$$
\text{Attention}(\mathbf{Q},\mathbf{K},\mathbf{V})=\text{softmax}\left(\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d_k}}\right)\mathbf{V}
$$

我们在计算 `softmax()` 之前，对 $\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d_k}}$ 矩阵进行如下的操作即可：在预测第 $i$ 个词的注意力时，用 $-\infty$ 替换 $\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d_k}}$ 中该词之后的所有点积结果。

![带掩码的权重矩阵](mask_demo_2.png)

此时，我们就可以利用 `softmax()` 对如上的掩码矩阵进行计算，并乘以对应的矩阵 $\mathbf{V}$，得到最终的注意力矩阵 $\mathbf{Z}$。同样的，如果我们有 $h$ 个注意力矩阵，那么我们可以按如下的方式将这 $h$ 个注意力矩阵的结果整合起来得到最终的注意力矩阵 $\mathbf{M}$：

$$
\mathbf{M} = \text{Concatenate}(\mathbf{Z}_1,\cdots,\mathbf{Z}_h)\mathbf{W}_O
$$

其中，$\mathbf{W}_O$ 是一个新的权重矩阵。

### 多头注意力层
为了根据解码器中计算的 `原句` 的注意力矩阵 $\mathbf{R}$ 和解码器中计算的 `目标句` 的带掩码的注意力矩阵 $\mathbf{M}$ 来预测最终的 `目标句`，我们还需要一个多头注意力层。由于该层涉及到了编码器与解码器的交互，因此，这一层也称之为 **编码器-解码器注意力层**（Encoder-Decoder Attention）。

多头注意力机制的第一步就是要创建查询矩阵 $\mathbf{Q}$、键矩阵 $\mathbf{K}$ 和值矩阵 $\mathbf{V}$。如前所述，可以通过输入矩阵 $\mathbf{X}$ 乘以权重矩阵 $\mathbf{W}^Q$、键矩阵 $\mathbf{W}^K$ 和值矩阵 $\mathbf{W}^V$ 得到查询矩阵 $\mathbf{Q}$、键矩阵 $\mathbf{K}$ 和值矩阵 $\mathbf{V}$。但是现在，我们有两个输入矩阵 $\mathbf{R}$（编码器输出的特征矩阵） 和 $\mathbf{M}$（解码器中带掩码的多头注意力层输出的注意力矩阵），我们该如何使用这两个输入矩阵呢？怎么利用这两个输入矩阵生成查询矩阵 $\mathbf{Q}$、键矩阵 $\mathbf{K}$ 和值矩阵 $\mathbf{V}$ 呢？

我们使用矩阵 $\mathbf{M}$ 生成查询矩阵 $\mathbf{Q}$，以使得查询矩阵可以包含 `目标句` 的特征；使用矩阵 $\mathbf{R}$ 生成键矩阵 $\mathbf{K}$ 和值矩阵 $\mathbf{V}$，以使得键矩阵和值矩阵可以包含 `原句` 的特征。然后再利用计算求得的 $\mathbf{Q}$、$\mathbf{K}$、$\mathbf{V}$ 计算注意力矩阵 $\mathbf{Z}$。具体的步骤如下所示：

1. 使用矩阵 $\mathbf{M}$ 乘以 $\mathbf{W}^Q$ 生成查询矩阵 $\mathbf{Q}$，使用矩阵 $\mathbf{R}$ 乘以 $\mathbf{W}^K$ 生成键矩阵 $\mathbf{K}$，使用矩阵 $\mathbf{R}$ 乘以 $\mathbf{W}^V$ 生成值矩阵 $\mathbf{V}$。
    
    ![根据矩阵 M 和矩阵 R 创建矩阵 Q、K、V](m_r_qkv.png)

2. 计算查询矩阵 $\mathbf{Q}$ 和键矩阵 $\mathbf{K}^T$ 的点积，得到 `目标句` 中每个词和 `原句` 中每个词的相似度。
    
    ![查询矩阵和键矩阵的点积](m_r_q_mul_k.png)

3. 根据 $\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d_k}}$ 的到权重矩阵，为了演示方便，此处我们令 $d_k = 64$。

4. 根据 $\text{softmax}\left(\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d_k}}\right) \mathbf{V}$ 计算注意力矩阵 $\mathbf{Z}$。

    ![](m_r_attention.png)

    如图所示：

    $$
    \mathbf{z}_{我} = 0.99 \cdot \mathbf{v}_{I} + 0.01 \cdot \mathbf{v}_{am} + 0.0 \cdot \mathbf{v}_{a} + 0.0 \cdot \mathbf{v}_{student}
    $$
    
    由此，如上的结果可以让模型理解 `目标句` 中的 `我` 指代的其实就是 `原句` 中的 `I`。

同样的，在该层中，我们仍然可以有 $h$ 个注意力矩阵，那么我们可以按如下的方式将这 $h$ 个注意力矩阵的结果整合起来得到最终的注意力矩阵 $\mathbf{Decoder Multi-head Attention}$：

$$
\mathbf{Decoder Multi-head Attention} = \text{Concatenate}(\mathbf{Z}_1,\cdots,\mathbf{Z}_h)\mathbf{W}_O
$$

其中，$\mathbf{W}_O$ 是一个新的权重矩阵。

同编码器一样，在多头注意力层之后，我们还会增加叠加和归一组件、前馈网络层并最终构成了完整的解码器。在实际应用中，我们可以将 $N$ 个解码器一个一个的叠加起来，最后一个解码器的输出就是最终的 `目标句` 的特征值 $\mathbf{T}$。

![Decoder 架构图](encoder_decoder.png)

### 线性层和 softmax 层
一旦解码器学习到了 `目标句` 的特征值 $\mathbf{T}$，我们就可以使用线性层和 `softmax` 层来生成最终的 `目标句`。线性层将生成一个 `logit` 向量，其大小等于 `目标句` 中的词汇量。假设目标句的词汇量只有 4 个词组成：

$$
Vocabulary = \{ 是, 我, 学生, 一个 \}
$$

那么，线性层返回的 `logit` 的向量的维度将是 4。然后使用 `softmax()` 将 `logit` 向量转换成概率表示，最后输出具有最高概率值的词的索引值。

例如，如果解码器的输入是 `<sos>我`，则解码器需要根据当前的输入预测下一个词。我们把最顶层的解码器的输出特征值 $\mathbf{T}$ 输入到线性层，假设我们得到的 `logit` 向量如下所示：

$$
\text{logit} = [39, 20, 31, 35]
$$

然后，我们对如上的 `logit` 向量应用 `softmax()` 计算，并得到如下的概率向量：

$$
\text{probability} = [0.98, 0.00, 0.00, 0.12]
$$

从中，我们可以看出，索引值为 0 的词 `是` 具有最高的概率值，因此，解码器会输出索引值为 0 的词 `是` 作为下一个词。通过该方式，解码器可以不断的预测 `目标句` 中的下一个词，直到输出 `<eos>` 为止。

## Transformer 整体架构
根据如上的介绍，我们可以得到 Transformer 模型的整体架构图：

![Transformer 的架构图](transformer.png)

在上图中，$N \times$ 表示可以堆叠 $N$ 个编码器和解码器，$h \times$ 表示可以堆叠 $h$ 个注意力矩阵。我们可以看到，一旦输入 `原句`，编码器就会学习 `原句` 的特征并将特征发送给解码器，而解码器则会不断的预测并生成 `目标句`。

在内容生成的场景中，我们提供给模型的 `prompt` 就相当于 `原句`，而 `目标句` 则相当于生成的内容。从 Transformer 的整体架构图中，我们可以看到，模型会不断的根据 `prompt` 和 `目标句` 的特征来生成最终的 `目标句`，而不会生成与 `prompt` 无关的内容，这也就是我们所说的 **上下文学习**（ICL: in context learning） 和 **指令遵循**（instruction following）。


## 参考文献
[^1]: [Attention Is All You Need](https://arxiv.org/html/1706.03762v7)
[^2]: [The Softmax function and its derivative](https://eli.thegreenplace.net/2016/the-softmax-function-and-its-derivative/)
[^3]: [Intuition for Multi-headed Attention](https://medium.com/@ngiengkianyew/multi-headed-attention-8b940b76c351)
[^4]: [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/)