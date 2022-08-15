---
title: 视频中为什么需要这么多的颜色空间？
reward: false
top: false
date: 2022-08-14 15:50:03
authors:
categories:
  - 视频技术
tags:
  - 颜色空间
---

![](1.jpeg)

在视频处理中，我们经常会用到不同的色彩空间：RGB，YUV，HSL……。为什么需要这么多的色彩空间呢？
<!--more-->

## 相机系统--采集
![](2.png)

如上图所示，在相机系统中，外部世界的光信息（光子，photons）通过透镜或其他光学器件聚焦之后达到相机的图像传感器（[CCD](https://en.wikipedia.org/wiki/Charge-coupled_device) 或者 [CMOS](https://en.wikipedia.org/wiki/Active-pixel_sensor)）。[^1]
* 图像传感器可以将一个入射光子（photon）转换为对应的一个电子（electron）。
* 在曝光时间内，图像传感器对转换的电子进行电荷积累。
* 然后，图像传感器会将积累的电荷信号转换成对应的电压信号。
* 最后，利用 [ADC](https://en.wikipedia.org/wiki/Analog-to-digital_converter) 把电信号转换成数字信号，而转换后的数字信号则为某个范围内的整数值。

!!! note ADC 数字信号的取值范围
    ADC 转换之后的数字信号的取值范围受限于 ADC 设备。对于 8-bits 的 ADC 而言，数字信号的取值范围为 $[0, 2^8-1]$，因此，对于每一个像素而言，会用 $[0, 255]$ 之间的整数来进行编码。

![](3.jpeg)

ADC 转换的数字信号的数值是一个线性编码的过程，这意味着如果将图像传感器上的光量增加 1 倍，则 ADC 转换之后对应的数值也会增加 1 倍。这是一个非常有用的特性：无论是增加物理世界的光量，还是增加 ADC 转换之后的数值，对图片而言，都会带来相同的效果。线性编码意味着我们所处理的数据和光发射的强度成正比关系。[^2]

由数码相机中的 CMOS 传感器产生并写入原始文件（Raw File）的数据是线性的。与普通照片相比，线性数据通常看起来非常暗且对比度较低。[^3]

![](4.jpg)

在 iPhone 手机中，可以通过设置相机来拍摄 [Apple ProRAW](https://support.apple.com/zh-cn/HT211965) 格式的照片。

#### 线性VS非线性数据
实际上，研究表明，人类视觉系统是以对数函数的方式来感知光亮度。这意味着，人眼会提高暗部的敏感度，降低高光部分的敏感度。

![](5.png)

从数学角度看，感知光强度和测量光强度之间存在一个近似的平方关系，具体如下式所示。
$$
Approximate Perceived Brightness = \sqrt{Measured Brightness}
$$

由于人类视觉感知系统不是以线性方式工作的，因此必须使用非线性曲线来对 ADC 生成的的线性数据进行变换，从而使得拍摄的图像色调与我们的视觉系统的工作方式相匹配。这个过程也就是我们所说的 [伽马校正](https://en.wikipedia.org/wiki/Gamma_correction)。

$$
V_{out}=V_{in}^{\gamma}
$$

因此，在从线性 RGB 空间转换到非线性 RGB 空间时，需要 $\gamma$ 作为转换参数。相机中的 ISP 模块中负责对图像传感器的线性 RGB 进行伽马校正进而产生对应的符合人眼感知的非线性 RGB 数据。

![](6.png)

## 相机系统--存储
根据如上的信息，我们知道：相机系统经过 ISP 处理之后，最终会得到非线性的 RGB 信息。对于视频而言，如果以 RGB 存储每帧的信息，则需要消耗大量的存储空间。

人类视觉系统对颜色信息的敏感度要弱于亮度信息，利用这一特点，通常相机会将捕获的 RGB 信息转换为 [YUV](https://en.wikipedia.org/wiki/YUV) 格式，然后对 YUV 格式进行色度信息采样（例如，YUV420）以便压缩图像空间。

RGB->YUV，不同标准有不同要求，一般常用的标准有：
* [BT. 601(SD: Standard-Definition)](https://en.wikipedia.org/wiki/Rec._601)
* [BT. 709(HD: High-Definition)](https://en.wikipedia.org/wiki/Rec._709)
* [BT. 2020(UHD: Ultra-High-Definition)](https://en.wikipedia.org/wiki/Rec._2020)

!!! note 注意
    标准中，不但会规定 RGB->YUV 的转换系数，同时还会规定从线性 RGB 到非线性 RGB 转换的 gamma 系数。

将 RGB颜色模型，转换成 YUV 模型后，接下来会采用某种视频编解码算法（例如，H265, VP9）对获取的数据进行视频编码，最终得到编码时候的视频文件（此处忽略了音频的采集编码以及合流的操作）。

![](7.png)

## 视频播放
#### 显示设备和相机的色域一致
#### 显示设备和相机的色域不一致

## FFMpeg如何处理这些变换

## 参考文献
\[1\]: [https://zhuanlan.zhihu.com/p/158502818](https://zhuanlan.zhihu.com/p/158502818)
\[2\]: [https://discuss.pixls.us/t/what-does-linear-rgb-mean/16584](https://discuss.pixls.us/t/what-does-linear-rgb-mean/16584)
\[3\]: [https://www.astropix.com/html/astrophotography/how.html](https://www.astropix.com/html/astrophotography/how.html)
\[4\]: [Linear vs. Logarithmic Dimming—A White Paper](https://www.pathwaylighting.com/products/downloads/brochure/technical_materials_1466797044_Linear+vs+Logarithmic+Dimming+White+Paper.pdf)




