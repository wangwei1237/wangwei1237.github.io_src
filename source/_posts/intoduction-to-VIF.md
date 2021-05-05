---
title: VIF质量评估方法简介
reward: false
top: false
date: 2021-03-05 13:23:07
categories:
  - IVQA
tags:
  - VIF
  - FR
---

视觉信息保真度（VIF）是基于[自然场景统计（*natural scene statistics*）](https://en.wikipedia.org/wiki/Scene_statistics)和[人类视觉系统（*human visual system*）](https://wangwei1237.gitee.io/digital-video-concept/docs/2_2_0_TheHumanVisualSystem.html)提取图像信息的一种全参考的图像质量评估指标，并且与人类对视觉质量的判断具有良好的相关性。

2006年，Hamid R Sheikh和Alan Bovik在德克萨斯大学奥斯汀分校的图像和视频工程实验室（*LIVE: Laboratory for Image and Video Engineering*）提出了[VIF算法](https://live.ece.utexas.edu/research/Quality/VIF.htm)。

![](1.gif)

<!--more-->

## 背景知识
#### 自然场景统计（*NSS: natural scene statistics*）
使用可以在光谱范围内进行操作的高质量的**捕获设备**（红外拍摄仪、相机等）而获取到的**视觉环境**的图像和视频，我们称之为自然场景。因此，当我们提到术语`自然场景(NS:natural scene)`的时候，我们一般指的就是我们所拍摄的，我们所处的，这个世界的照片或视频。这与其他类型的信息完全不同，例如：
* 文本
* 计算机生成的图形
* 卡通或者动画
* 绘画或者绘图
* 随机噪声
* 利用`nonvisual stimuli`生成的图像或者视频，例如雷达、声呐、X-rays、超声成像技术等

`自然场景`构成了所有类型的图像集合中的极小的子集。

`场景统计`是感知领域中的一门学科。场景统计涉及到与场景有关的统计规律，并基于如下的前提：设计一个感知系统来解释场景。

很多研究者试图通过研究[`自然场景`的统计信息来了解其结构](https://link.springer.com/article/10.1023/A:1021889010444)。研究人员认为，自然环境产生的视觉刺激促进了HVS的进化，并且，自然场景建模和HVS建模在本质上是一个[对偶问题](https://baike.baidu.com/item/%E5%AF%B9%E5%81%B6%E7%90%86%E8%AE%BA/9582786)。

结合信号检测理论（*signal detection theory*），信息论（*information theory*）或估计理论（*estimation theory.*），自然场景统计可用于定义观察者的行为。目前，自然场景统计模型最成功的应用之一就是图片和视频的可感知的质量预测。之所以可以如此应用，其基本的前提是：
* 图像、视频通常会涉及自然场景
* 图像、视频的失真会改变自然场景的统计信息
* 人类视觉系统对自然场景统计信息的变化非常敏感

#### VMAF
以VIF为基础，Netflix开发了到目前为止，视频质量评估领域的最优秀的全参考评估算法：[VMAF（*Video Multimethod Assessment Fusion*）](https://netflixtechblog.com/toward-a-practimathcal-perceptual-video-quality-metric-653f208b9652)。

VMAF认为每个基本测量指标都在视频特征、失真类型和失真度上有不同的表现，通过机器学习算法可以将基础的测量指标融合得到最终的结果。当前，VMAF算法使用VIF、DLM（*细节损失指标*）、运动（*相邻帧差异*）作为基本测量指标，并使用SVM算法对测量指标进行融合来预测最终结果。VMAF基本原理如下图所示：

![](2.png) 

虽然，VMAF的效果比PSNR和SSIM要好，但是其运行速度却较慢，在部分机器上甚至小于1帧/秒。

同时，虽然开源的VMAF也可以得到较好的得分，但是与Netflix公布的分值相比仍然稍有逊色。或许是因为VMAF未开源的部分中包含了更多的数据集训练模型和GPU的支持。

## VIF算法
#### VIF算法的核心思想
VIF算法将图像/视频的质量评估问题看作一个信息保真的问题，并从信息通信和共享的角度来评估图像/视频的质量。

VIF认为：
* 人眼所看到的图像是通过HVS过滤之后而提取到的信息，在这个过程中，人类视觉系统也是一个简单的失真通道
* 在经过HVS之前，失真图像只是比原始图像多经过了一个失真通道
* 利用信息论的理论，把人眼从失真图像中提取到的信息和人眼从原始图像中提取到的信息进行对比，从而得到符合人主观感知的图像质量

整体VIF算法中包含三个部分：`Source Model`，`Distortion Model`，`HVS Model`，具体如下图所示：

![](1.gif)

#### Source Model
`Source Model`也称为原始图像建模，为了模拟HVS的多通道特性，VIF算法利用[高斯金字塔](/2020/03/18/introduction-to-image-pyramid/)将图像分成四个不同的尺度，然后将每一个尺度分成大小不一的块，每一个块中的所有像素组成一个向量$\overrightarrow{c}$，并使用高斯混合模型对向量进行建模：

$$
\mathcal{C} = \mathcal{S} · \mathcal{U} = \{ S_i · \overrightarrow{U}_i : i \in I \}
$$

对于`Source Model`而言，$block(i)$表示第$i$个块，如下图所示：
![](3.jpg)

在计算时，可以利用第$i$块中的系数来估计第$i$块的参数$s$，具体如下：

$$
\widehat{s}_i^2 = \widehat{Cov}(C,C)
$$

#### Distortion Model
对于`Distortion Model`而言，为了能够让`Distortion Model`中的计算可以成立，论文采用局部估计的方式来获取`distortion channel`的参数。

$$
\mathcal{D} = \mathcal{GC} + \mathcal{V} = \{g_i {\overrightarrow{C}}_i+{\overrightarrow{V}}_i:i \in I\}
$$

具体做法为，在如下图所示的小波变换之后的频域图中，对于图中的第$i$个系数而言，我们采用以$i$为中心的$B \times B$的系数块上估计第$i$个系数对应的参数：$g_i$和$\sigma_{v,i}^{2}$。

其中，$g_i$为在该对应块之上的随机场${G}$的值，$\sigma_{v,i}^{2}$为在该对应块之上的随机场${V}$的方差。
![](4.jpg)


此时，`Distortion Model`中的参考信号和折损信号都能获取，因此可以很容易的用如下所示方法来对$g_i$和$\sigma_{v,i}^{2}$进行估计。

$$
\widehat{g}_{i} = \widehat{Cov}(C,D)\widehat{Cov}(C,C)^{-1}
$$

$$
\widehat{\sigma}_{v,i}^{2} = \widehat{Cov}(D,D) - \widehat{g}_{i}\widehat{Cov}(C,D)
$$

在估计前，会对每一个系数进行不同尺度的高斯卷积计算。

$$
Cov(C,D) = [C(n)D(n)] * F(n) - \\ 
           [C(n)*F(n)][D(n)*F(n)] 
$$

#### HVS Model
对于`HVS Model`而言，VIF将其带来的误差整合为一个噪声。具体如下所示：

$$
\mathcal{E} = \mathcal{C} + \mathcal{N} = \mathcal{S} · \mathcal{U} + \mathcal{N} \\
\mathcal{F} = \mathcal{D} + \mathcal{N}' = \mathcal{GC} + \mathcal{V} + \mathcal{N}'
$$

因此，在VIF算法中，`HVS Model`其只有一个参数：视觉噪声的方差$\sigma_n^2$，从论文中可以发现，该参数是一个可以调节的参数，需要根据不同的视频数据集来调整以获取最佳的$\sigma_n^2$。

在VIF提供的小波域下的算法实现中，$\sigma_n^2=0.4$，在VIF提供的[像素域下的算法实现中](vifp_mscale.m)，$\sigma_n^2=2$，在VMAF的integer_vif中，$\sigma_n^2=65536<<1$。

[VMAF实现VIF时](https://github.com/Netflix/vmaf/blob/master/libvmaf/src/feature/vif_tools.c)，对相关参数的计算函数`vif_statistic_s`就是采用了如上的方法。

```c
g     = sigma12 / (sigma1_sq + eps);
sv_sq = sigma2_sq - g * sigma12;
```

#### VIF的多尺度计算
最终，结合`Source Model`，`Distortion Model`，`HVS Model`，得到VIF算法：

$$
VIF = \frac{I(C;F|s)}{I(C;E|s)}
$$

在得到一个尺度VIF得分之后，可以非常方便的将计算过程扩展到其他的尺度。例如，对于有4个尺度的VIF的计算过程如下图所示：
![](5.jpg)
其中，$f0$-$f3$滤波分别对应着宽度（$N$）为$17 \times 17$, $9 \times 9$, $5 \times 5$, $3 \times 3$，$\sigma=N/5$的高斯卷积核，具体如下图所示：
![](6.jpg)

$$
VIF = \frac{\displaystyle\sum_{i \in all\_scales}{num_i}}{\displaystyle\sum_{i \in all\_scales}{den_i}}
$$

## 利用libvmaf计算VIF
依赖于[VMAF](https://github.com/Netflix/vmaf)良好的设计和强大的可扩展性，我们可以利用VMAF来单独的计算其单个特征的评估结果。对于VIF而言，我们可以采用如下的步骤，来计算两个给定的YUV格式的视频的VIF得分：
* 按照[libvmaf的文档](https://github.com/Netflix/vmaf/tree/master/libvmaf)编译libvmaf，如果希望得到更多的debug的信息，可以将[integer_vif](https://github.com/Netflix/vmaf/blob/master/libvmaf/src/feature/integer_vif.c)的debug参数修改为`true`。
* 编写测试代码，调用libvmaf库中提供的相关api计算各尺度的VIF得分，具体参见[test_vif.cpp](test_vif.cpp)。
* 利用如下命令编译test_vif.cpp:
  ```shell
  $ g++ -o vif test_vif.cpp -Ilibvmaf/include -Llibvmaf/build/src -lvmaf
  ```
* 计算两个视频的vif得分：
  ```shell
  $ export DYLD_LIBRARY_PATH=$DYLD_LIBRARY_PATH:libvmaf/build/src # 如果执行vif报错
  $ vif t1.yuv t3.yuv 2160x2840
  ```

对于如下图所示的视频对，

![](9.jpg)

我们分别计算vif，ssim，psnr的得分可以得出如下结果：

![](8.jpg)

从结果看，对于这种折损VIF算法给出的结果更符合人的主观感受。

## VIF的优势和局限性
#### VIF的优势
* 一个好的`Distortion Model`可以使得折损图像和合成的图像能够有相同的感官质量。`Distortion Model`的目的并不是对图像的所有折损类型进行建模，而是对图像的折损带来的主观感受进行建模。因此，VIF不一定能够捕获所有的图像折损，但是却可以捕获这些图像的折损带来的感知折损。
* 另外，从`Distortion Model`（$\mathcal{D} = \mathcal{GC} + \mathcal{V}$）可以发现，VIF将图像的折损拆分为三部分：
  * 信号增益$G$
  * 噪声$V$
  * HVS噪声$N'$
  
  这使得VIF更符合当前的实际应用。例如图像的亮度增强，对比度增强等场景。在这些场景下，图像信号虽然发生了变化，但是这并不是图像处理过程引入的噪声。这也是为什么PSNR，SSIM等算法无法应用于类似场景的原因，而VIF的折损图像模型却可以完美的应用于这些场景。对于亮度增强或对比度增强的场景，$G>1$，从而使得$VIF>1$，从而可以得出增强后的图像在感官质量上要优于参考图像的结论。我们用VIF计算对比度提升50%的视频视频时，发现参数$G$实际上是>1的，
  ![](12.jpg)
  并且得到如下的结果：
  ![](11.jpg)

* 从VIF的计算可以，VIF的最终得分是失真图像D在参考图像C下的得分。实际上而言，VIF是一种内容自适应的算法。给定的图像折损，对于不同的内容而言，其带来的主观感受是不一样的。利如，某些时候，我们需要利用运动模糊来展现物体的高速运动，但是对于观看羽毛球比赛时，如果出现羽毛球运动模糊的情况，就会令人讨厌了。对于，PSNR和SSIM等算法而言，在计算过程中是没有做类似的考虑的。
  ![](7.jpeg)

#### VIF的局限性
* VIF的理论基础来自于`自然场景`，因此VIF并不适用于非`自然场景`下的图像/视频的质量评估，这一点要尤其注意。
* 和PSNR，SSIM等算法相比，VIF算法的计算性能也是需要考虑的问题之一，在某些性能较差的机器上，其运算速度甚至低于1FPS。

