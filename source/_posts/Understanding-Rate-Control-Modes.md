---
title: 视频编码中的码率控制模式
reward: false
top: false
date: 2022-03-11 16:05:28
authors:
categories:
  - 视频技术
tags:
  - CQP
  - CBR
  - ABR
  - CRF
---
![](1.png)

数字视频在处理、存储和传输上需要大量数据，典型的 30FPS 的高清视频（1920x1080），如果每个像素需要 8bit 来表示的话，那么每秒需要大约 15亿 bit。而视频编码技术的目标就是获取码率和视觉质量之间的权衡。

```
1920 x 1080 x 8 x 3 x 30 = 1,492,992,000
```

在视频编码技术中，码率控制（Rate Control）是一件非常重要的事情。在编码视频帧时，码率控制决定了编码器为该视频帧分配的 bit 数。

本文将基于 FFmpeg 中的 X264、X265 编码器来介绍常用的码率控制模式。
<!--more-->

## CQP(Constant Quantization Parameter)
[**QP(Quantization Parameter)**](https://www.vcodex.com/h264avc-4x4-transform-and-quantization/) 用于控制每帧视频中每一个宏块的压缩量。实际上，QP 反映了空间细节压缩情况。QP 越小，就会保留越多的细节信息，视频质量也会越高，同时码率越大。QP 越大，细节信息丢失的越多，码率也会随之降低，但图像失真也会越严重。也就是说，QP 和码率成反比，QP 越大，码率越低；QP 越小，码率越高。

在 H.264/H.265 中，QP 的取值范围为 $[0, 51]$。利用 FFmpeg，我们可以非常方便的为整个编码（转码）过程设置一个固定的 QP。

```shell
ffmpeg -i <input> -c:v libx264 -qp 23 <output>
ffmpeg -i <input> -c:v libx265 -x265-params qp=23 <output>
```

!!! attention 谨慎使用 CQP
    除非我们知道自己在做什么，否则永远不要使用 CQP 来进行码率控制。为整个编码过程设置一个固定的 QP 意味着：最终的视频码率会因为场景的复杂性而发生巨大变化。如果设置的 QP 足够低，那么编码的视频质量会非常好，但与 CRF 相比，这无疑会产生码率的浪费。

    CQP 比较适合用于视频编码器的研究，比如在 RD 曲线中，我们会采用不同的 QP 来产生对应的编码视频，进而对编码器进行对比。

#### QP 与 率失真曲线
在评估不同编码器时，我们会用到率失真（$RD$）曲线。一般而言，$RD$ 曲线都是以码率(*Kbps*)做为横坐标，以 $PSNR(dB)$ 作为纵坐标做出来一条曲线。对于 $RD$ 曲线上的点，我们一般采用的是 $QP=28, 32, 36, 40$ 这四个 QP 下的编码码率和编码质量。

## ABR(Average Bitrate)
ABR 又称为目标码率（target bitrate）。ABR 会为编码器设置一个目标码率，然后让编码器来计算如何才能达到我们设定的目标码率。

我们可以利用如下的命令将目标码率设定为 1Mbs。

```shell
ffmpeg -i <input> -c:v libx264 -b:v 1M <output>
ffmpeg -i <input> -c:v libx265 -b:v 1M <output>
```

!!! attention 避免使用 ABR
    一位 x264 的主要开发人员说：永远不要使用 ABR 来控制视频的码率。为什么这么说呢？这主要是因为，编码器无法确切的知道接下来需要编码的视频帧的情况，因此编码器不得不通过猜测来确定如何才能达到我们设定的目标码率。这也意味着，ABR 在控制码率时，码率的波动范围相对较大，尤其是在视频的开头或者达到目标码率的地方。尤其是对于 HAS(HTTP Adaptive Streaming) 流媒体而言，ABR 会导致分片内的视频质量产生较大的变化。

ABR 并不是一种固定码率控制模式。尽管 ABR 也是一种 VBR 模式，但是 因为 ABR 并无法可靠的提供良好的编码质量，因此，ABR 也并不比 CBR 好多少。

## CBR(Constant Bitrate)
如果我们需要强制编码器总是使用某个固定的码率来编码视频，我们可以使用 CBR。对于 x264，可以通过 nal-hrd 来设置 CBR 和 VBR 模式。

``` shell 
ffmpeg -i <input> -c:v libx264 -x264-params "nal-hrd=cbr:force-cfr=1" \
-b:v 1M -minrate 1M -maxrate 1M -bufsize 2M <output>
```

!!! note nal-hrd
    [nal-hrd](http://www.chaneru.com/Roku/HLS/X264_Settings.htm#nal-hrd)

    Default: None

    Signal HRD information. Required for Blu-ray streams, television broadcast and a few other specialist areas. Acceptable values are:

    * none: Specify no HRD information
    * vbr: Specify HRD information
    * cbr: Specify HRD information and pack the bitstream to the bitrate specified by bitrate. Requires bitrate mode ratecontrol.

    Recommendation: none, unless you need to signal this information.

## CRF(Constant Rate Factor)
CRF 是 x264 和 x265 编码器的默认质量/码率控制设置。CRF 的取值范围为 $[0,51]$，数值越低，质量越好，文件越大。对于不同的编码器，CRF的默认值如下： 
* x264：23
* x265：28

当CRF 取值为 18(x264)、24(x265) 时，其编码质量在视觉上被认为是无感知的，更小的取值往往意味着码率的浪费。

CRF 的值每 $\pm 6$，对应的编码文件的大小就会增加1倍或减半。

```shell
ffmpeg -i <input> -c:v libx264 -crf 23 <output>
ffmpeg -i <input> -c:v libx265 -crf 28 <output>
```

!!! note CRF & 2-Pass
    具有相同码率的 2-Pass 和 CRF 编码在质量上应该相同。二者的主要区别在于：
    * 使用 2-Pass 编码时，可以控制文件大小
    * 使用 CRF 时，只需指定所需的视频质量

## 2-Pass ABR(2-Pass Average Bitrate)
当采用 2-Pass 编码的时候，对于视频流中的所有数据，编码器会对其处理两次。在第一遍处理的时候，编码器会收集视频的相关信息，在第二次处理时，编码器利用第一次处理收集到的信息来优化编码过程。

在 CBR 模式下，2-Pass 编码比 1-Pass 编码的效率更高。2-Pass 编码比 1-Pass 编码的质量要高，但是编码时间也会随之增加。使用 2-Pass 编码时，对于场景变化不大的画面（如静态画面），分配的码率会低一些；而场景变化大的画面（如赛车、运动等），分配的码率会高一些。因此， 2-Pass 编码可以让整部影片的清晰度比较均匀。

x264 编码器的 2-Pass 编码命令如下：

```shell
ffmpeg -i <input> -c:v libx264 -b:v 1M -pass 1 -f null /dev/null
ffmpeg -i <input> -c:v libx264 -b:v 1M -pass 2 <output>.mp4
```

x265 编码器的 2-Pass 编码命令如下：

```shell
ffmpeg -i <input> -c:v libx265 -b:v 1M -x265-params pass=1 -f null /dev/null
ffmpeg -i <input> -c:v libx265 -b:v 1M -x265-params pass=2 <output>.mp4
```

!!! error 直播场景
    2-Pass 编码不可用于直播场景。


## 参考文献
* [Understanding Rate Control Modes (x264, x265, vpx)](https://slhck.info/video/2017/03/01/rate-control.html)
* [CRF Guide (Constant Rate Factor in x264, x265 and libvpx)](https://slhck.info/video/2017/02/24/crf-guide.html)
