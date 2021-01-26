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

HDR是*High Dynamic Range*的缩写。HDR是一种数字图像技术，可以利用这种技术来提升数字图像的色彩以及对比度的范围。

和SDR（*Standard Dynamic Range*：标准动态范围）相比，HDR具有如下特点：
* 更宽的色彩范围
* 更亮的亮度上限
* 更黑的亮度下限
* 在对比度、灰度分辨率等维度上对影像质量上进行了整体提升

从而，HDR可以给用户带来更具沉浸式的感受。

<!--more-->

HDR技术可以应用于拍照（*photography*）和视频（*video*），但是需要注意的是：虽然`photo HDR`和`video HDR`的目标都是让我们所看到的数字内容更逼近人眼的真实体验，但是这两者确实是完全不同的两个概念。本质上讲，`photo HDR`是一个相机捕获照片、处理照片（**）的过程，而`video HDR`则是一个显示的过程。[^1]

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


---
[^1]: https://www.cnet.com/news/hdr-for-cameras-vs-hdr-for-tvs-whats-the-difference/
[^2]: https://en.wikipedia.org/wiki/High-dynamic-range_imaging