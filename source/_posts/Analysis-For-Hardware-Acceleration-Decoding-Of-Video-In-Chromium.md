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

## 1. chrome://gpu
首先，利用 `chrome://gpu` 来获取相关的 GPU 信息，这里获取的信息非常丰富，我们可以从这些信息中来判断 Chrome 是否支持特定场景的 GPU 加速。

!!! note 在这部分信息中，我们需要特别关注如下几部分的信息：
    * Graphics Feature Status
    * Driver Information
    * Display(s) Information
    * Video Acceleration Information

#### Graphics Feature Status
**Graphics Feature Status** 反映了 GPU 对 Chrome 中的不同的能力的支持，对于我的 MacBook Pro (13-inch, 2017) 上的 Chrome 94 而言，可以得到如下的结果：

!!! note Graphics Feature Status
    * Canvas: Hardware accelerated
    * Compositing: Hardware accelerated
    * Metal: Disabled
    * Multiple Raster Threads: Enabled
    * Out-of-process Rasterization: Hardware accelerated
    * OpenGL: Enabled
    * Rasterization: Hardware accelerated
    * Skia Renderer: Enabled
    * Video Decode: Hardware accelerated
    * WebGL: Hardware accelerated
    * WebGL2: Hardware accelerated

从中可以看出，对于 **视频解码** 而言，Chrome 启用了 GPU 的硬件加速。当然我们还能从如上的信息中获取更多内容，例如 WebGL 是否有 GPU 支持，GPU 的硬件加速是采用的 [OpenGL](https://www.opengl.org/) 还是 [Metal](https://developer.apple.com/cn/metal/)，……

#### Video Acceleration Information
**Video Acceleration Information** 显示了 Chrome 支持的硬件编解码的编解码器类型以及相关编解码器的 profile。从中我们可以判断，对于某种编解码器而言，Chrome 是否支持硬编解码。该信息大致如下表所示：
|||
|---|---|
|Decoding(VideoDecoder)||
|Decode h264 baseline|16x16 to 4096x4096 pixels |
|……|……|
|Encoding||
|Encode h264 baseline|0x0 to 4096x2160 pixels, and/or 30.000 fps|
|……|……|

## 2. chrome://flags
根据 `chrome://gpu` 提供的信息，我们可以判断我们所使用的 Chrome 在视频编解码时的硬件支持能力。但是，需要注意的是，具备硬件编解码能力，不代表 Chrome 就可以硬件编解码。如果没有开启这些能力，自然是无法利用 Chrome 提供的这些能力的。

因此，我们接下来需要判断，Chrome 是否开启了硬件编解码加速的能力，此时，我们可以使用 `chrome://flags` 来获取我们需要的信息。

!!! note chrome://flags
    [**chrome://flags** 是一组实验性功能和设置](https://beebom.com/chrome-flags-guide-to-enhance-web-browsing/)，它们隐藏在 Chrome 中，供开发人员使用。这些实验性功能包括 Google 正在开发、但尚未为普通用户启用的功能。**chrome://flags** 可以提升我们的浏览体验，还可以让我们使用那些新的、开发中的功能。

在 **chrome://flags** 中，我们可以得到如下的信息：

![](2.png)

从图中的信息，我们可以知道，对于当前的 Chrome 浏览器而言，Chrome 开启了视频的编解码硬件加速能力。

## 3. chrome://media-internals
如上所述，对于播放的视频，根据视频属性以及 `chrome://gpu` 和 `chrome://flags` 提供的信息，我们可以大致判断出在播放该视频时，Chrome 是否使用了硬件解码。

但是，我们要时刻提醒自己，目前为止我们的判断还仅仅是一种猜测而言，要想确切的判断 Chrome 是否使用了硬件解码，就需要获取 Chrome 播放视频时使用的解码器。此时，就该用到 `chrome://media-internals` 工具啦。

!!! note chrome://media-internals 
    [**chrome://media-internals**](https://www.chromium.org/audio-video/media-internals) 是一个研究 Chrome 音频/视频内部堆栈结构的工具。目前，**chrome://media-internals** 可以显示如下信息：
    * 从媒体堆栈中挖掘有关正在使用的媒体播放器的所有内容，包括已缓冲数据、视频属性、事件之间的测量时间和事件日志。
    * 当前音频流的状态和音量，这些信息不会与特定的 tab 关联。
    * 缓存活动信息，包括对媒体缓存的读取和写入。 

我们可以用 Chrome 浏览器播放 [B 站视频上的视频](https://www.bilibili.com/video/BV1jh411n7d7?spm_id_from=333.6.0.0)，然后使用 **chrome://media-internals** 工具进行分析，如下图所示：

![](3.png)

如上图所示，媒体播放器的所有信息都会以列表的形式展现，同时列表中的每一项都会展现该项对应的播放状态。因为视频正在播放中，因此我们选择状态为 `kPlay` 的项目来查看对应的媒体播放器的信息。**Player Properties** 信息展示了媒体播放器的详细属性，例如：

|Property|Value|
|---|---|
|……|……|
|kVideoDecoderName|VDAVideoDecoder|
|kVideoTracks|[{"alpha mode":"is_opaque","codec":"h264","coded size":"1920x1080","color space":"{primaries:BT709, transfer:BT709, matrix:BT709, range:LIMITED}","encryption scheme":"Unencrypted","has extra data":false,"hdr metadata":"unset","natural size":"1920x1080","orientation":"0°","profile":"h264 high","visible rect":"0,0 1920x1080"}]|

根据 [VDAVideoDecoder](https://chromium.googlesource.com/chromium/src/+/39e7de240b63c0103078624d09130c4a990920d2/media/gpu/ipc/service/vda_video_decoder.h) 的源码可以知道，VDAVideoDecoder 解码器是通过 MojoVideoDecoder 而运行于 GPU，因此我们可以确定，该 h264 编码的视频在播放时使用的是硬件解码。

使用 Chrome 播放一个 8K 视频，然后使用 **chrome://media-internals** 工具进行分析，可以得到如下信息：

|Property|Value|
|---|---|
|……|……|
|kVideoDecoderName|Dav1dVideoDecoder|
|kVideoTracks|[{"alpha mode":"is_opaque","codec":"av1","coded size":"7680x4320","color space":"{primaries:BT709, transfer:BT709, matrix:BT709, range:LIMITED}","encryption scheme":"Unencrypted","has extra data":false,"hdr metadata":"unset","natural size":"7680x4320","orientation":"0°","profile":"av1 profile main","visible rect":"0,0 7680x4320"}]|

[dav1d 解码器](https://www.videolan.org/projects/dav1d.html) 是一个跨平台的开源 AV1 解码器，因此，对于该 8K 视频而言，Chrome 在播放时使用的是 CPU 解码。