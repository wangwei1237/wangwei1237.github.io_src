---
title: Chrome浏览器中的视频解码硬件加速
reward: false
top: false
date: 2021-10-22 14:04:29
authors:
categories:
  - 视频技术
tags:
  - 硬件加速
  - GPU
  - Chrome Video Decode
---

![](1.png)

从 [Google Chrome version history](https://en.wikipedia.org/wiki/Google_Chrome_version_history) 可以知道，2011 年 3 月 发布的 10.0.648 版本的 Chrome 浏览器就已经支持视频的硬件加速能力。从 [chromium/chrome 88 开始，视频的硬件加速已经成为默认配置](https://www.reddit.com/r/linux/comments/l112mr/hardware_video_acceleration_now_available_in/)。

即便如此，因为视频的硬件解码需要 GPU 的特殊支持，而目前的视频编解码标准又比较丰富，我们如何判断 Chrome 在解码视频的时候是否启用了硬件加速呢？
<!--more-->

## chrome://gpu

## chrome://flags

## chrome://media-internals