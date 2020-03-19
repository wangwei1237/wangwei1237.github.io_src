---
title: 图像金字塔简介
reward: false
date: 2020-03-18 21:38:18
categories: 视觉技术
tags: 
  - 图像金字塔
  - 高斯金字塔
  - 拉普拉斯金字塔
  - image pyramid
---

# 图像金字塔
## 图像金字塔的概念
一般而言，我们处理的图像通常是恒定大小（分辨率）的图像。但是在某些特殊的场景下，需要处理同一图像的不同分辨率的图像。例如，在图像中搜索某些内容时（例如面部），由于不确定待搜索的内容在图像中的区域大小，因此需要创建一个具有不同分辨率的图像集，并在该图像集的所有图像中执行搜索操作。

这些具有不同分辨率的图像集称为“图像金字塔”。之所以称其为“图像金字塔”，是因为当这些图像按照分辨率由低到高堆叠在一起时，底部的最大图像和顶部的最小图像看起来就像是一座金字塔。

因此，图像金字塔是图像的集合，这些图像集合由单个原始图像通过连续的降采样——直到达到某个期望的暂停点为止——产生。

<!--more-->

![](1.jpg)

## 图像金字塔的分类
应用中经常用到的图像金字塔主要有两种：
* 高斯金字塔
* 拉普拉斯金字塔

高斯金字塔一般用于图像的降采样，而拉普拉斯金字塔则用于通过图像金字塔中的低分辨率图像重构高分率图像的图像上采样。

### 高斯金字塔
高斯金字塔中的低分辨率图像是通过删除高分辨率图像中的行和列而产生，具体如下所示：
* 令高斯金字塔中第$i$层的图像为$G_i$
* 使用一个高斯核对$G_i$执行卷积操作得到$G_i^{\prime}$
* 然后删除$G_i^{\prime}$中的偶数行和偶数列，得到$G_{i+1}$

根据如上的步骤，可以知道，第$i+1$级图像的分辨率是第$i$级图像的分辨率的$\frac{1}{4}$。

#### pyrDown
在OpenCV中，可以使用`cv2.pyrDown()`生成图像的上一层级图像。

```python
higher_resolution = cv2.imread('img.jpg')
lower_resolution  = cv2.pyrDown(higher_resolution)
```

下图是一个4级的高斯金字塔的例子。
![](2.jpg)

#### pyrUp
我们还可以使用`cv2.pyrUp()`将图像转换为每个方向两倍大小的图像，该函数
* 首先将图像的大小在各个维度上扩展2倍
* 然后对新增的行用0进行填充
* 最后再使用高斯滤波器执行卷积计算来获取“丢失”的像素的值

```python
higher_resolution_2 = cv2.pyrUp(lower_resolution)
```

从如上的步骤不难发现，`cv2.pyrUp()`并不是`cv2.pyrDown()`的逆运算，因为`cv2.pyrDown()`是一个丢失信息的操作，一旦分辨率降低，就会存在信息丢失。

因此，在示例代码中，`higher_resolution_2`和`higher_resolution`是不同的。

对[pyrDown](#pyrDown)中的图像执行`pyrUp()`效果如下所示：
![](3.jpg)

### 拉普拉斯金字塔
为了从图像金字塔中的低分辨率图像恢复高分辨率的图像，需要使用下采样过程中丢弃的信息。而这些数据则构成了拉普拉斯金字塔。

令$L_i$为高斯金字塔的第$i$级图像$G_i$下采样得到第$i+1$级图像$G_{i+1}$时丢失的信息，则：

$$L_i=G_i - cv2.pyrUp(G_{i+1})$$

$\{L_i | i \in 1...n\}$则构成拉普拉斯金字塔。

拉普拉斯金字塔由高斯金字塔而形成，并没有其它的额外功能，并且拉普拉斯金字塔图像和图像的边缘图像很像。在拉普拉斯金字塔中的图像的大多数元素为零。一个4级拉普拉斯金字塔的图像如下所示（已调整图像的曝光度以增强图像内容）：
![](4.jpg)

## 图像金字塔的应用
图像金字塔的一种应用是图像融合。例如，在图像拼接中会将两个图像堆叠，但是由于图像之间的不连续性，这种对原始图像的直接拼接的效果并不好。例如，我们直接拼接如下图所以的两幅图像：

![](5.jpg)

的效果为：

![Direct_blending](7.jpg)

此时，使用“图像金字塔”融合图像则可以让拼接之后的图像看起来天衣无缝。例如，按照如下的步骤使用“图像金字塔”来拼接如上的图像：

1. 加载图像
2. 计算图像的高斯金字塔（在此示例中，级数为6）
3. 从高斯金字塔中计算拉普拉斯金字塔
4. 在每个拉普拉斯金字塔中加入苹果的左半部分和橙子的右半部分
5. 最后，从联合图像金字塔中重建原始图像

最终的拼接效果如下所示：
![](6.jpg)

如下则是该示例的完成代码。

```python
import cv2
import numpy as np,sys

A = cv2.imread('apple.jpg')
B = cv2.imread('orange.jpg')

# generate Gaussian pyramid for A
G = A.copy()
gpA = [G]
for i in range(6):
    G = cv2.pyrDown(G)
    gpA.append(G)

# generate Gaussian pyramid for B
G = B.copy()
gpB = [G]
for i in range(6):
    G = cv2.pyrDown(G)
    gpB.append(G)

# generate Laplacian Pyramid for A
lpA = [gpA[5]]
for i in range(5,0,-1):
    GE = cv2.pyrUp(gpA[i])
    L = cv2.subtract(gpA[i-1],GE)
    lpA.append(L)

# generate Laplacian Pyramid for B
lpB = [gpB[5]]
for i in range(5,0,-1):
    GE = cv2.pyrUp(gpB[i])
    L = cv2.subtract(gpB[i-1],GE)
    lpB.append(L)

# Now add left and right halves of images in each level
LS = []
ii = 0
for la,lb in zip(lpA,lpB):
    ii=ii+1
    rows,cols,dpt = la.shape
    ls = np.hstack((la[:,0:int(cols/2)], lb[:,int(cols/2):]))
    cv2.imwrite('py_' + str(ii) + '.jpg', ls)
    LS.append(ls)

# now reconstruct
ls_ = LS[0]
for i in range(1,6):
    ls_ = cv2.pyrUp(ls_)
    ls_ = cv2.add(ls_, LS[i])

# image with direct connecting each half
real = np.hstack((A[:,:int(cols/2)],B[:,int(cols/2):]))

cv2.imwrite('Pyramid_blending2.jpg',ls_)
cv2.imwrite('Direct_blending.jpg',real)
```
