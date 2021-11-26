---
title: 为什么 OpenCV 计算的视频 FPS 是错的
reward: false
top: false
date: 2021-11-26 10:17:22
authors: 
  - 王伟
  - 刘一卓
categories:
  - 视频技术
tags:
  - OpenCV
  - FFMpeg
  - 帧率
---

![](1.jpeg)

我们有一个平台来周期性的对线上的直播流数据进行某些检测，例如黑/白屏检测、静态画面检测……在检测中，我们会根据提取到的直播流的帧率来预估要计算的帧数量，例如如果要检测 5s 的直播流，而该直播流的帧率为 20 fps，需要计算的帧数量则为 100。忽然有一天，我们发现，平台开始大面积的超时，之前只需要 2s 就能完成的计算，现在却需要 30+ 分钟。

<!--more-->

这个问题的具体描述可以参见 [OpenCV Issues 21006](https://github.com/opencv/opencv/issues/21006)。该问题的模拟直播流片段可以点击[链接](https://pan.baidu.com/s/1RY0Zk5C_DOEwTXYe2SLFEg)下载，下载提取码为 x87m。

## 帧率异常的追查
