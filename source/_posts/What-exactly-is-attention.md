---
title: 注意力究竟是什么？
reward: false
top: false
date: 2024-10-16 17:19:11
authors:
categories:
  - 算法与数学
tags:
  - Attention
  - 注意力机制
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

于是，对于原始的词向量矩阵 $\mathbf{X}$ 而言，经过一些列的矩阵乘法运算，我们得到了根据相关性权重的加权词向量表示。也就是说原始的词向量 $\mathbf{x_i}$ 可以表示为所有词向量的加权表示 $\mathbf{z_i}$

了解如上介绍的 $\text{softmax}\left(\mathbf{X}\mathbf{X}^T\right)\mathbf{X}$ 背后的逻辑对于理解 Transform 中的各个矩阵的含义至关重要，因此我们花了很大的篇幅来对其进行分析。

接下来，我们用一个具体的例子来展示如上的过程。

## 举个例子🌰
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