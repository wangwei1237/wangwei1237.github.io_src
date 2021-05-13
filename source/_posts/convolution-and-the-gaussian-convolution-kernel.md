---
title: 卷积运算以及高斯滤波器的构造
reward: false
top: false
date: 2021-04-14 09:51:31
authors:
categories:
  - 算法与数学
tags:
  - 卷积
  - 高斯滤波器
  - 图像滤波
---
## 卷积的数学定义
在图像分析和图像处理中，**卷积**(*convolution*)是一种非常重要的运算。卷积是一个积分运算，其反应的是函数$f(x)$在另一个函数$h(x)$上移动时所叠加的量。函数$f$和$h$在有限域$[0,t]$上的一维卷积为：

$$
\begin{aligned}
(f*h)(t) &= \int^{t}_{0}f(\tau)h(t-\tau)\mathrm{d}\tau \\
&= \int^{t}_{0}f(t - \tau)h(\tau)\mathrm{d}\tau
\end{aligned}
$$

需要注意的是，卷积积分的上下限实际为$(-\infty, +\infty)$，但是此处我们假设负坐标部分的值为0，因此这里可以限定在区间$[0,t]$中。<sup>[1]</sup>

<!--more-->

根据一维卷积的定义，我们可以得到函数$f(x,y)$在另一个函数$h(x,y)$上移动时的卷积：

$$
\begin{aligned}
(f*h)(x,y) &= \int^{+\infty}_{-\infty}f(a,b)h(x-a,y-b)\mathrm{d}a\mathrm{d}b \\ 
&= \int^{+\infty}_{-\infty}f(x-a,y-b)h(a,b)\mathrm{d}a\mathrm{d}b
\end{aligned}
$$

## 数字图像分析中的卷积
数字图像是一个二维的离散数据，因此对于数字图像而言，需要将积分运算（$\int$)改为加和运算（$\sum$），从而得到**离散卷积**(*discrete convolution*)。

对于数字图像而言，在图像平面上存在有限的定义域，对于定义域之外的离散卷积结果为0。因此，这个特点并不妨碍我们在数字图像上执行卷积运算。此时，卷积表示的是使用滤波器$h$对图像执行一个线性滤波处理。

我们在图像$f(i,j)$的一个局部邻域$\mathcal{O}$内计算其所有像素的线性组合，邻域$\mathcal{O}$中的各个像素的权重由$h(i,j)$来确定。因此，对于图像中的像素$f(i,j)$，我们在其邻域$\mathcal{O}$内使用滤波器$h$对其执行卷积运算，得到$g(i,j)$：

$$
g(i,j)=\displaystyle\sum_{(m,n)\in\mathcal{O}}f(i-m,j-n)h(m,n)
$$

在上式中，称$h$为**卷积掩膜**(*convolution mask*)或者滤波器，并且一般会选择具有奇数行和列的矩形邻域$\mathcal{O}$，以方便确定领域的中心。<sup>[1]</sup>

## 利用高斯滤波器来模糊图像
通常，图像处理软件会提供“模糊”（blur）滤镜，使图片产生模糊的效果。具体如下图所示：

![](1.jpeg)

模糊的本质就是利用像素邻域$\mathcal{O}$内其他像素的线性运算来计算该像素的值，从而提高该像素和邻域内其他像素之间的相关性。

模糊的方式和效果取决于线性运算时的滤波器$h$的选取。$h$的选择有很多，其中有一种就是高斯滤波器，其对应的模糊效果称之为“高斯模糊”。“高斯模糊”的本质就是利用高斯函数生成线性运算时各像素的权重，即利用高斯函数（当$\mu=0$且各方向的$\sigma$相等时）生成滤波器$h$：

$$
G(x,y) = \frac{1}{2\pi\sigma^2}e^{-\frac{x^2+y^2}{2\sigma^2}}
$$

$h$中心点的坐标为$(0,0)$，则整个$h$的坐标如下所示：

![](2.png)

利用$G(x,y)$的公式，即可计算得到$\sigma$为指定值时的高斯滤波器$h$。具体细节此处不再赘述，具体可以参考：[高斯模糊的算法](http://www.ruanyifeng.com/blog/2012/11/gaussian_blur.html)。

## 不依赖其他库生成高斯滤波器
当$\mu=0$且各方向的$\sigma$相等时，对于$h(i,j)$我们得到：

$$
\begin{aligned}

h(i,j)&=\frac{G(i,j)}{\displaystyle\sum_{i,j}{G(i,j)}} \\
&=\frac{\frac{1}{2\pi\sigma^2}e^{-(i^2+j^2)/(2\sigma^2)}}{\displaystyle\sum_{i,j}{\frac{1}{2\pi\sigma^2}e^{-(i^2+j^2)/(2\sigma^2)}}} \\
&=\frac{\frac{1}{2\pi\sigma^2}e^{-(i^2+j^2)/(2\sigma^2)}}{\frac{1}{2\pi\sigma^2}\displaystyle\sum_{i,j}e^{-(i^2+j^2)/(2\sigma^2)}} \\
&=\frac{e^{-(i^2+j^2)/(2\sigma^2)}}{\displaystyle\sum_{i,j}e^{-(i^2+j^2)/(2\sigma^2)}}

\end{aligned}
$$

使用python得到二维的高斯滤波器的代码如下：

```python
def gaussian_kernel_2d(sigma, width):
    if width == 1:
        return np.ones((1, 1))

    kernel_radius = np.floor(width >> 1)
    ax            = np.arange(-kernel_radius, kernel_radius + 1., dtype=np.float32)
    xx, yy        = np.meshgrid(ax, ax)
    kernel        = np.exp(-(xx**2 + yy**2) / (2. * sigma**2))
    return kernel / np.sum(kernel)
```

详细代码可以参考[高斯滤波器的生成和可视化](https://gitee.com/wangwei1237/wangwei1237/blob/master/2021/04/14/convolution-and-the-gaussian-convolution-kernel/gaussian_cov_kernel.ipynb)。

## 滤波器的可分离特性
图像处理中的**可分离滤波器**(*separable filter*)可以写成两个更简单的滤波器的乘积。通常，可以把二维卷积运算分离为两个一维滤波器，从而降低图像的卷积运算复杂度。

例如，对于$W \times H$的图像，如果采用$n \times n$的二维滤波器，则卷积运算的复杂度为$O(M·N·n^2)$，而如果用两个$1 \times n$的一维滤波器，则卷积运算的复杂度为$O(2M·N·n)$。<sup>[4]</sup>

Karas Pavel和Svoboda David在[Algorithms for Efficient Computation of Convolution](https://www.intechopen.com/books/design-and-architectures-for-digital-signal-processing/algorithms-for-efficient-computation-of-convolution)<sup>[5]</sup>的**3. Separable convolution**部分指出：

给定一个行向量$\overrightarrow{u}=(u_1,u_2,...u_m)$和一个列向量$\overrightarrow{v}^T=(v_1,v_2,...,v_n)$，则其二者的卷积定义为：

$$
\begin{aligned}
\overrightarrow{u}*\overrightarrow{v}&=\overrightarrow{v}\ \overrightarrow{u} \\
&=\begin{pmatrix}
v_1 \\
v_2 \\
. \\
. \\
. \\
v_n \end{pmatrix} * \begin{pmatrix} u_1, u_2, ..., u_m\end{pmatrix} \\
&=\begin{pmatrix}
v_1u_1 & v_1u_2 & v_1u_3 & ... & v_1u_m \\
v_2u_1 & v_2u_2 & v_2u_3 & ... & v_2u_m \\
v_3u_1 & v_3u_2 & v_3u_3 & ... & v_3u_m \\
. & . & . & . & . \\
. & . & . & \ \ \ \ \ \ . & . \\
. & . & . & \ \ \ \ \ \ \ \ \ \ \ \ . & . \\
v_nu_1 & v_nu_2 & v_nu_3 & ... & v_nu_m
\end{pmatrix} \\
&=\mathbf{A}_{n \times m}
\end{aligned}

$$

并且，当且仅当矩阵$\mathbf{A}_{n \times m}$的秩$r(\mathbf{A})=1$时，滤波器才是可分离的滤波器。Gaussian滤波器和Sobel滤波器就是这种可分离的滤波器。 

利用这个特性，对于二维高斯滤波器$h(x,y)$而言，我们将其分离成两个一维滤波器。对图像的二维卷积运算从而简化为对图像的两次一维卷积，具体如下所示：

$$
\begin{aligned}
h(x,y) &= (h_x * h_y)(x) \\
(f*h)(x,y) &= f*(h_x * h_y) \\
&=(f*h_x)*f_y
\end{aligned}
$$

同时，利用如上的特性，我们还可以利用一维高斯滤波器的结果生成二维高斯滤波器，代码如下所示：
```python
def gaussian_kernel_2d_acc(self):
    if self.width == 1:
        self.kernel = np.ones((1, 1))
        return
    
    self.gaussian_kernel_1d()
    k = self.kernel
    self.kernel = k.reshape(self.width,1) * k.reshape(1,self.width)
```

更详细的代码可以参考[高斯滤波器的生成](https://gitee.com/wangwei1237/wangwei1237/blob/master/2021/04/14/convolution-and-the-gaussian-convolution-kernel/gaussian_cov_kernel_acc.ipynb)。

## 参考文献
\[1\]: 图像处理、分析与机器视觉（第4版）
\[2\]: [如何通俗易懂的解释卷积？](https://www.zhihu.com/question/22298352)
\[3\]: [高斯模糊的算法](http://www.ruanyifeng.com/blog/2012/11/gaussian_blur.html)
\[4\]: [separable filter](https://en.wikipedia.org/wiki/Separable_filter)
\[5\]: Karas Pavel and Svoboda David (January 16th 2013). Algorithms for Efficient Computation of Convolution, Design and Architectures for Digital Signal Processing, Gustavo Ruiz and Juan A. Michell, IntechOpen, DOI: 10.5772/51942. Available from: https://www.intechopen.com/books/design-and-architectures-for-digital-signal-processing/algorithms-for-efficient-computation-of-convolution
