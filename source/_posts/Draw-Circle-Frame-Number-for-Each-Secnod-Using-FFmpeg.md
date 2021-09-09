---
title: 用 FFMpeg 把以秒为周期的帧序号信息写入到视频
reward: false
top: false
date: 2021-09-09 12:10:18
authors:
categories:
  - 视频技术
tags:
  - FFMpeg
---

利用 FFMpeg 的 [**drawtext**](https://ffmpeg.org/ffmpeg-filters.html#drawtext-1) 滤镜，我们可以把特定的文本信息绘制于视频之上。FFMpeg 的 **drawtext** 滤镜可以绘制的文本信息可以参见文档 [Text expansion](https://ffmpeg.org/ffmpeg-filters.html#Text-expansion) 中的描述。例如，我们可以把视频的帧号信息描绘在视频上：

```shell
$ ffmpeg -i test.mp4 -vf drawtext=text=%{n}:x=50:y=50 -y output.mp4
```

有时候，我们想绘制一些特殊的内容，比如：当前帧是每秒中的第几帧？这是一件有趣的事情，但是 **drawtext** 却没办法支持这种内容的绘制。

<!--more-->

待续。。。