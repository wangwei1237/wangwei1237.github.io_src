---
title: FFMpeg滤镜中的多线程计算
reward: false
top: false
date: 2023-03-01 14:55:32
authors:
categories:
  - 视频技术
tags:
  - FFmpeg
  - 多线程
---

![](1.png)

在图像处理中，可以通过滤镜来实现多种多样的图像特殊效果。同样的，在视频处理中，滤镜的概念也基本相似——滤镜指的是在编码之前针对解码器解码出来的原始数据（即音视频帧）进行处理的动作。

<!--more-->

## FFmpeg 滤镜的基本概念
FFmpeg 通过 libavfilter 库来实现滤镜的功能，并且在 FFmpeg 中，可以通过滤镜来对输入视频进行各种各样的处理。

FFmpeg中，滤镜的处理位置如下图所示：

![](2.png)

例如，如果我们要对一个视频从中间部分进行“镜像”操作，则可以用如下的“滤镜链”来实现：

```shell
                [main]
input --> split ---------------------> overlay --> output
            |                             ^
            |[tmp]                  [flip]|
            |                             |
            +-----> crop --> vflip -------+
```

在这个“滤镜链”图中，利用 `split` 滤镜把输入流分离成了两路流，其中一路通过 `crop` 滤镜和 `vfilp` 滤镜的同一路级联应用，再同另外一路一起通过 `overlay` 滤镜处理的流合成并输出最终处理之后的视频。

如上操作对应的 FFmpeg 命令如下所示：

```shell
ffmpeg -i INPUT -vf "split [main][tmp]; [tmp] crop=iw:ih/2:0:0, vflip [flip]; [main][flip] overlay=0:H/2" OUTPUT
```

更详细的 FFmpeg 滤镜的相关内容可以参考 [FFmpeg Filters Documentation](http://ffmpeg.org/ffmpeg-filters.html)。

## FFmpeg 滤镜开发简介
根据 [FFmpeg Filtering Guide](https://trac.ffmpeg.org/wiki/FilteringGuide)，可以在 [FFmpeg filter HOWTO](https://wiki.multimedia.cx/index.php/FFmpeg_filter_HOWTO) 的帮助下来编写 FFmpeg 滤镜，为 FFmpeg 增加新的能力。

但是，根据个人经验，在开发滤镜时，我更建议把 [FFmpeg/doc/writing_filters.txt](https://github.com/FFmpeg/FFmpeg/blob/master/doc/writing_filters.txt) 作为滤镜开发指南。

## 多线程滤镜开发
FFmpeg 滤镜会涉及到大量的计算，因此，如果可以采用多线程的方式来加速滤镜的计算，对于有效率要求的场景而言将是一大福音。

根据 [FFmpeg/doc/writing_filters.txt](https://github.com/FFmpeg/FFmpeg/blob/master/doc/writing_filters.txt) 的说明，到目前为止，对于滤镜而言，FFmpeg 仅支持 `slice-级别`多线程（还不支持`帧-级别`多线程）。

!!! note slice 基本概念
    ![](3.jpeg)
    <br /> 如上图所示，在滤镜计算过程中，视频帧被分割成若干单独的 `slice(切片)`，不同的 `slice` 可以同时并行执行滤镜操作。

    实际上，在计算过程中，可以简单的把 `slice` 理解为由多行构成的帧数据。因此，`slice-级别` 的多线程实际上就是按行将图像拆分为多个 `slice`，然后多个 `slice` 之间并行执行滤镜计算。

待续》》》



