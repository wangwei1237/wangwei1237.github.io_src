---
title: 视频中为什么需要这么多的颜色空间？
reward: false
top: false
date: 2022-08-14 15:50:03
authors:
categories:
  - 视频技术
tags:
  - RGB 
  - XYZ
  - linear RGB
  - FFMpeg colorspace
---

![](1.jpeg)

在视频处理中，我们经常会用到不同的色彩空间：`非线性RGB`，`线性 RGB`，`YUV`，`XYZ`……为什么需要这么多的色彩空间呢？为什么在 FFMpeg 中会有 `color_space`，`color_transfer`，`color_primaries` 等一系列的颜色属性呢？这些术语之间究竟隐藏着什么秘密？
<!--more-->

## 相机系统--采集
![](2.png)

如上图所示，在相机系统中，外部世界的光信息（光子，photons）通过透镜或其他光学器件聚焦之后达到相机的图像传感器（[CCD](https://en.wikipedia.org/wiki/Charge-coupled_device) 或者 [CMOS](https://en.wikipedia.org/wiki/Active-pixel_sensor)）。[^1]
* 图像传感器可以将一个入射光子（photon）转换为对应的一个电子（electron）。
* 在曝光时间内，图像传感器对转换的电子进行电荷积累。
* 然后，图像传感器会将积累的电荷信号转换成对应的电压信号。
* 最后，利用 [ADC](https://en.wikipedia.org/wiki/Analog-to-digital_converter) 把电信号转换成数字信号，而转换后的数字信号则为某个范围内的整数值。

!!! note ADC 数字信号的取值范围
    ADC 转换之后的数字信号的取值范围受限于 ADC 设备。对于 8-bits 的 ADC 而言，数字信号的取值范围为 [0, 2^8-1]，因此，对于每一个像素而言，会用 [0, 255] 之间的整数来进行编码。

![](3.jpeg)

ADC 转换的数字信号的数值是一个线性编码的过程，这意味着如果将图像传感器上的光量增加 1 倍，则 ADC 转换之后对应的数值也会增加 1 倍。这是一个非常有用的特性：无论是增加物理世界的光量，还是增加 ADC 转换之后的数值，对图片而言，都会带来相同的效果。线性编码意味着我们所处理的数据和光发射的强度成正比关系。[^2]

由数码相机中的 CMOS 传感器产生并写入原始文件（Raw File）的数据是线性的。与普通照片相比，线性数据通常看起来非常暗且对比度较低。[^3]

![](4.jpg)

在 iPhone 手机中，可以通过设置相机来拍摄 [Apple ProRAW](https://support.apple.com/zh-cn/HT211965) 格式的照片。

#### 线性VS非线性数据
实际上，研究表明，人类视觉系统是以对数函数的方式来感知光亮度。这意味着，人眼会提高暗部的敏感度，降低高光部分的敏感度。[^4]

![](5.png)

从数学角度看，感知光强度和测量光强度之间存在一个近似的平方关系，具体如下式所示。
$$
近似感知亮度 = \sqrt{测量亮度}
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
对于大部分显示设备，例如CRT显示器、LCD、OLED，屏幕上的每个像素都是通过驱动三个非常靠近但仍然分开的小型 RGB 光源而构建的。[^5] 因此，显示屏（监视器，电视机，屏幕等等）仅使用 RGB 模型，并以不同的方式来组织，并显示最终的图像。[^6]

![](8.jpeg)

而不同的显示设备采用的 RGB 的色域并不一定相同，因此，RGB 是一种设备依赖型的颜色模型。[^7]在 Mac 电脑上，可以通过显示器配置来选择显示器支持不同的 RGB 色域。

![](10.jpg)

#### 显示设备和相机的色域一致
如果编码视频和播放视频的显示器采用的 RGB 色域是一致的，比如都是 sRGB，此时的播放过程相对比较简单。视频解码之后，得到 YUV 数据，然后根据标准将 YUV 数据转换成非线性的 sRGB 数据，然后显示器根据 sRGB 数据显示图像即可。

![](11.png)

#### 显示设备和相机的色域不一致
当显示设备支持的色域从 sRGB 变为 Rec. 2020 时，如果直接显示 sRGB 色域下的数据，则会导致比较严重的颜色失真。

![](12.png)

此时，就需要在不同的色域空间进行 RGB 数据的转换，这也就是我们所说的 [色彩管理](https://en.wikipedia.org/wiki/Color_management)。色彩管理会对图像进行色彩管理以适配当前设备环境下的颜色效果，从而保证同一张图片在不同输入、输出、显示设备上都呈现出最好的颜色。[^8]

色彩转换需要在某个线性空间下进行操作，并且操作过程需要保持设备的独立性。因此，不同的 RGB 色域空间是不能直接进行转换的，需要一个设备无关、线性的颜色模型作为中转才能实现其转换。

而 [XYZ(CIE 1931 XYZ color space)](https://en.wikipedia.org/wiki/CIE_1931_color_space) 具备设备无关、线性操作的特性。sRGB->RGB(Rec. 2020)的转换过程如下所示：

![](13.png)

因此，对于拍摄设备和显示设备的色域不同时，视频的播放增加了颜色管理的过程。
![](14.png)

## FFMpeg如何处理这些变换
类似的，在视频转码中，如果我们希望对原视频进行色域的变换，那么我们也会经历类似的操作。例如从 BT. 601 转码为 BT. 709。[^9]

![](15.png)

在如上的变换中，涉及到 3 个颜色空间的转换，分别是：
1. YUV 和 RGB 之间的转换
2. 线性 RGB 和非线性 RGB 之间的转换
3. 线性 RGB 和 XYZ 之间的转换

在 FFMpeg 中，所有的这些转换参数都保存在 [AVFrame](https://ffmpeg.org/doxygen/trunk/structAVFrame.html) 结构中[^10]：
* AVFrame->[colorspace](https://ffmpeg.org/doxygen/trunk/structAVFrame.html#a9262c231f1f64869439b4fe587fe1710) 中保存了 YUV/RGB 的转换矩阵
* AVFrame->[color_trc](https://ffmpeg.org/doxygen/trunk/structAVFrame.html#ab09abb126e3922bc1d010cf044087939) 中保存了线性 RGB 和非线性 RGB 之间的转换函数（transformation characteristics）。
* AVFrame->[color_primaries](color_primaries) 中保存了 RGB/XYZ 的转换矩阵

如果用 `ffprobe` 命令解析视频文件，则：
* color_space 字段对应 YUV/RGB 的转换矩阵
* color_transfer 字段对应线性 RGB 和非线性 RGB 之间的转换函数
* color_primaries 字段对应 RGB/XYZ 的转换矩阵

在 `MediaInfo` 中，
* Matrix coefficients 字段对应 YUV/RGB 的转换矩阵
* Transfer characteristic 字段对应线性 RGB 和非线性 RGB 之间的转换函数
* Color primaries 字段对应 RGB/XYZ 的转换矩阵

除了如上的参数外，AVFrame->[range](https://ffmpeg.org/doxygen/trunk/pixfmt_8h.html#a3da0bf691418bc22c4bcbe6583ad589a) 还用来存储视频中对应像素的每个分量的取值范围。在 [vf_setparams.c](https://github.com/FFmpeg/FFmpeg/blob/a78f136f3fa039fd7ad664fd6e6e976f1448c68b/libavfilter/vf_setparams.c) 中也作了相关的定义说明：

```
{"limited", NULL, 0, AV_OPT_TYPE_CONST, {.i64=AVCOL_RANGE_MPEG},  0, 0, FLAGS, "range"},
{"tv",      NULL, 0, AV_OPT_TYPE_CONST, {.i64=AVCOL_RANGE_MPEG},  0, 0, FLAGS, "range"},
{"mpeg",    NULL, 0, AV_OPT_TYPE_CONST, {.i64=AVCOL_RANGE_MPEG},  0, 0, FLAGS, "range"},
{"full",    NULL, 0, AV_OPT_TYPE_CONST, {.i64=AVCOL_RANGE_JPEG},  0, 0, FLAGS, "range"},
{"pc",      NULL, 0, AV_OPT_TYPE_CONST, {.i64=AVCOL_RANGE_JPEG},  0, 0, FLAGS, "range"},
{"jpeg",    NULL, 0, AV_OPT_TYPE_CONST, {.i64=AVCOL_RANGE_JPEG},  0, 0, FLAGS, "range"},
```

正是通过不同的颜色模型和不同的变换，才得以让我们实现：在不同输入、输出、显示设备上都呈现出最好的颜色。

## 参考文献
[^1]: [https://zhuanlan.zhihu.com/p/158502818](https://zhuanlan.zhihu.com/p/158502818)
[^2]: [https://discuss.pixls.us/t/what-does-linear-rgb-mean/16584](https://discuss.pixls.us/t/what-does-linear-rgb-mean/16584)
[^3]: [https://www.astropix.com/html/astrophotography/how.html](https://www.astropix.com/html/astrophotography/how.html)
[^4]: [Linear vs. Logarithmic Dimming—A White Paper](https://www.pathwaylighting.com/products/downloads/brochure/technical_materials_1466797044_Linear+vs+Logarithmic+Dimming+White+Paper.pdf)
[^5]: [https://en.wikipedia.org/wiki/RGB_color_model](https://en.wikipedia.org/wiki/RGB_color_model)
[^6]: [https://wangwei1237.github.io/2020/02/28/Introduction-to-digital-video-technology/](https://wangwei1237.github.io/2020/02/28/Introduction-to-digital-video-technology/)
[^7]: [Computational Color Technology](https://www.spiedigitallibrary.org/ebooks/PM/Computational-Color-Technology/eISBN-9780819481085/10.1117/3.660835)
[^8]: [https://blog.csdn.net/weixin_43194305/article/details/107944264](https://blog.csdn.net/weixin_43194305/article/details/107944264)
[^9]: [https://medium.com/invideo-io/talking-about-colorspaces-and-ffmpeg-f6d0b037cc2f](https://medium.com/invideo-io/talking-about-colorspaces-and-ffmpeg-f6d0b037cc2f)
[^10]: [https://trac.ffmpeg.org/wiki/colorspace](https://trac.ffmpeg.org/wiki/colorspace)