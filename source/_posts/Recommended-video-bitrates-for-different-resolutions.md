---
title: 不同分辨率视频的推荐码率
reward: false
top: false
date: 2021-05-28 14:19:36
authors:
categories: 
  - IVQA
tags:
  - 码率
  - 视频清晰度
---

视频的清晰度会受到多种因素的影响：分辨率，帧率，色深……对于UGC类型的视频业务而言，为了保证整站视频的质量，需要对用户上传的视频质量进行一点的判断。虽然不是绝对准确，但是，码率也是一种相对有效的评估指标。[^1]

![](1.png)

在YouTube的帮助文档中，就提供了一份建议用于指导用户设置其上传的视频的编码参数[^2]。本文对码率的推荐数据进行了摘录。

<!--more-->

## SDR视频的推荐码率

| Type | Video Bitrate <br /> 标准帧率(24, 25, 30) <br /> 编码器(H264) | Video Bitrate <br /> 高帧率(48, 50, 60) <br /> 编码器(H264) |
|:---|:---|:---|
|2160p (4K) |35–45 Mbps |53–68 Mbps|
|1440p (2K) |16 Mbps    |24 Mbps   |
|1080p      |8 Mbps     |12 Mbps   |
|720p       |5 Mbps     |7.5 Mbps  |
|480p       |2.5 Mbps   |4 Mbps    |
|360p       |1 Mbps     |1.5 Mbps  |

## HDR视频的推荐码率

| Type | Video Bitrate <br /> 标准帧率(24, 25, 30) <br /> 编码器(H264) | Video Bitrate <br /> 高帧率(48, 50, 60) <br /> 编码器(H264) |
|:---|:---|:---|
|2160p (4K) |44–56 Mbps    |66–85 Mbps   |
|1440p (2K) |20 Mbps       |30 Mbps      |
|1080p      |10 Mbps       |15 Mbps      |
|720p       |6.5 Mbps      |9.5 Mbps     |
|480p       |Not supported |Not supported|
|360p       |Not supported |Not supported|

## 音频的推荐码率

| Type | Audio Bitrate <br /> 采样率(96K/48K HZ) <br /> 编码器(AAC-LC)|
|:---|:---|
|Mono   |128 kbps|
|Stereo |384 kbps|
|5.1    |512 kbps|

## 参考文献
[^1]: https://www.muvi.com/blogs/video-bitrate-or-resolution-what-makes-video-streaming-better.html.
[^2]: https://support.google.com/youtube/answer/1722171?hl=en&ref_topic=9257782.