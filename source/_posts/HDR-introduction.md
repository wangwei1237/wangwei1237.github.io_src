---
title: HDR技术导论
reward: false
top: false
date: 2021-01-26 15:37:44
categories:
  - 视频技术
tags:
  - HDR
---

真实世界的亮度范围是十分广阔的，而人眼能感知到的亮度范围在十万尼特左右。举个例子，用分光色度计测量向着阳光盛开的花朵，其黄色区域亮度最高可达14700尼特，边缘的红色是2300尼特，中央的花蕊和绿叶只有200尼特以下，但这张照片在窄色域、亮度普遍不超过100尼特，对比度也只有1000：1的SDR显示效果下色彩会暗淡很多，而随着技术的发展，HDR技术色域广、普遍亮度在1000尼特，对比度甚至能达到上万，虽然还是远达不到现实标准，但比三十年前的SDR还是前进了一大步。

![](nit.jpg)

<!--more-->

HDR是*High Dynamic Range*的缩写。HDR是一种数字图像技术，可以利用这种技术来提升数字图像的色彩以及对比度的范围。

和SDR（*Standard Dynamic Range*：标准动态范围）相比，HDR具有如下特点：
* 更宽的色彩范围
* 更亮的亮度上限
* 更黑的亮度下限
* 在对比度、灰度分辨率等维度上对影像质量上进行了整体提升

从而，HDR可以给用户带来更具沉浸式的感受。

HDR技术可以应用于拍照（*photography*）和视频（*video*），但是需要注意的是：虽然`photo HDR`和`video HDR`的目标都是让我们所看到的数字内容更逼近人眼的真实体验，但是这两者确实是完全不同的两个概念。本质上讲，`photo HDR`是一个相机捕获照片（*capture*）的过程，而`video HDR`则是一个显示(*display*)的过程。[^1]

## 广度学概念
#### 尼特
#### 坎德拉

## photography HDR
可以通过同时捕获不同曝光度的多张图像的方法来生成HDR照片。相机会使用不同的曝光值快速拍摄三张或更多的照片，然后对其进行处理，以生成一张HDR照片。

在拍摄高对比度场景的照片时，HDR图像处理非常有用。

如下图的夜景所示，例如，曝光度太低时，会让后面的景色显得暗淡。如果调整曝光以显示后面的景色，则前面的景色又会太亮，甚至可能会完全变白。通过组合多次曝光，则可以平均这些不同的曝光，使的后面的景色可以出现在照片上，而又不会过度曝光前面的景色。[^2]

![](EVDifferent.png)

![](EVToneMapping.png)

目前，很多智能手机（例如iPhone）的相机都具有HDR选项。我们可以选择让相机：
* 开启HDR（ON）
* 关闭HDR（OFF）
* 自动判断是否开启HDR（Auto）

对于Auto模式，相机仅在高对比度的情况下才拍摄HDR照片。大多数相机还会在合成HDR照片时，同时捕获普通照片，从而允许我们可以在HDR照片和普通照片之间进行选择。

### dodging and burning和tone mapping
实际上，在胶片时代，摄影师就会拍摄多张不同曝光程度的底片，并在[暗房](https://baike.baidu.com/item/%E6%9A%97%E6%88%BF/62291)中使用一种**[dodging and burning](https://en.wikipedia.org/wiki/Dodging_and_burning)**的手法，把数张底片合成为一张具有高动态范围的照片。随着数码相机的出现，HDR将暗房里的技术引入相机成像传感器，通过对同一个场景进行多种不同的曝光，然后对其进行合成，最终实现增强照片动态范围，达到增加照片层次感的目的。在照片HDR中，这种合成技术称之为[色调映射（*tone mapping*）](https://en.wikipedia.org/wiki/Tone_mapping)。

## video HDR
HDR视频的捕获方式与HDR照片类似。同时以不同的曝光（或不同的ISO配置）来录制每个镜头。然后把这些镜头融合在一起以生成单个镜头。尽管会产生看起来不真实的灰色效果，但这种方法通常可以使视频更亮。因此，HDR视频通常会在发布之前进行后期处理。

为了正确的显示HDR视频，显示设备也必须支持HDR。例如，具备HDR功能的电视必须支持特定的视频输出标准。这些标准中会涉及：10-bit色彩和至少覆盖90％的DCI-P3色彩空间。HDR显示器还必须支持特定的HDR格式，例如HDR10，Dolby Vision或Hybrid Log Gamma（HLG）。

![](color_space.jpg)

CIE 1931 xy 中各个色彩空间的对比

以HDR10为例，因为HDR10标准使用广色域`Rec.2020`，10-bit色深以及`SMTPE ST 2084`PQ转换函数，因此在一台非HDR显示设备上去显示HDR10的内容，则会出现两种情况[^3],[^4]：
* 无法解码导致花屏
* 可以解码，但是因为影片中的高亮部分会按照显示设备的最高亮度来显示而导致影片整体变灰

这也就是HDR照片和HDR视频的不同之处：HDR视频除了视频捕获之外，对显示设备的能力有较强的依赖。

## HDR标准
#### HDR10
#### DOLBY VISION
#### HDR10+
#### UHD Premium
#### DisPlayHDR
#### Mobile HDR

---
[^1]: https://www.cnet.com/news/hdr-for-cameras-vs-hdr-for-tvs-whats-the-difference/
[^2]: https://en.wikipedia.org/wiki/High-dynamic-range_imaging
[^3]: https://en.wikipedia.org/wiki/High-dynamic-range_video
[^4]: https://www.zhihu.com/question/19774840/answer/998271233
[^5]: https://alliance.experienceuhd.com/uhd-premium-features
[^6]: https://www.experienceuhd.com/uhd-mobile-hdr-premium-features