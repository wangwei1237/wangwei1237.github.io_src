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
\mathbf{z_{I}}    &= 0.10 \cdot \mathbf{y_{\text{我}}} + 0.66 \cdot \mathbf{y_{\text{很}}} + 0.24 \cdot \mathbf{y_{\text{好}}} \\
\mathbf{z_{am}}   &= 0.49 \cdot \mathbf{y_{\text{我}}} + 0.49 \cdot \mathbf{y_{\text{很}}} + 0.02 \cdot \mathbf{y_{\text{好}}} \\
\mathbf{z_{good}} &= 0.16 \cdot \mathbf{y_{\text{我}}} + 0.42 \cdot \mathbf{y_{\text{很}}} + 0.42 \cdot \mathbf{y_{\text{好}}}
\end{aligned}
$$

如上的计算和权重只是为了说明原理而随机选择的数据，并不代表真实的相关性。因此，我们会看到 `I` 和 `很` 之间的关系最相似，实际上 `I` 和 `我` 之间最相似。

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

$\mathbf{Q},\mathbf{K},\mathbf{V}$ 和原始输入之间的关系如下图所示：

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
\text{MultiHeadAttention} = \text{Concatenate}(\mathbf{Z}_1,\cdots,\mathbf{Z}_h)\mathbf{W}_0
$$

其中，$\mathbf{W}_0$ 是一个新的权重矩阵。

## Transformer 中的 Encoder
在 `Multi-Head Attention` 的基础之上，再增加前馈网络、叠加和归一组件，就得到了完整的 Transformer Encoder。当然，实际中，可以将 $N$ 个 Encoder 一个一个的叠加起来，最后一个 Encoder 的输出就是原始输入内容的特征值 $\mathbf{R}$。

![Encoder 架构图](encoder.png)

## Transformer 中的 Decoder

## 参考文献
[^1]: [Attention Is All You Need](https://arxiv.org/html/1706.03762v7)
[^2]: [The Softmax function and its derivative](https://eli.thegreenplace.net/2016/the-softmax-function-and-its-derivative/)
[^3]: [Intuition for Multi-headed Attention](https://medium.com/@ngiengkianyew/multi-headed-attention-8b940b76c351)