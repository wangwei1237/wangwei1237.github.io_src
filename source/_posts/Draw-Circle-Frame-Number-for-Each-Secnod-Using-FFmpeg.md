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

有时候，我们想绘制一些特殊的内容，比如：**当前帧是每秒中的第几帧**？这是一件有趣的事情，但是 **drawtext** 却没办法支持这种内容的绘制。在大多数场景下，我们几乎用户到这种特殊的功能，但是，如果遇到了，我们如何解决呢？

<!--more-->

## 不对写入信息做任何改变
实际上，不进行任何改变也可以实现目的，只是我们需要对现有的工具进行一定程度的整合。一般而言，写入特殊信息到视频中去后，我们会在后续的处理中提取该信息，然后进行很多逻辑判断。

写入信息不做改变，那么就需要在提取信息或者更靠后的步骤进行改变。实际上我们可以在最后使用到该信息的步骤中进行判断就可以了，具体如下图所示：

![](1.png)

## 修改 drawtext 滤镜
可以使用市面上的视频编辑软件把**当前帧是每秒中的第几帧**的信息增加到视频中，但是这种手工操作的方式还是存在一定的复杂度。

既然 drawtext 滤镜已经提供写入帧号信息的能力了，那么我们是否可以在 drawtext 滤镜的基础上来实现我们的目标呢？

带着问题，阅读了 drawtext 滤镜的源码，发现还真可以实现。

drawtext 滤镜使用如下的代码获取当前帧的帧序号：

```c
s->var_values[VAR_N] = inlink->frame_count_out + s->start_number;
```

其中， `inlink` 为 `AVFilterLink` 类型的变量，而 `AVFilterLink` 本身就提供了 `frame_rate` 信息。

```c
struct AVFilterLink {
    ...
    /**
    * Frame rate of the stream on the link, or 1/0 if unknown or variable;
    * if left to 0/0, will be automatically copied from the first input
    * of the source filter if it exists.
    *
    * Sources should set it to the best estimation of the real frame rate.
    * If the source frame rate is unknown or variable, set this to 1/0.
    * Filters should update it if necessary depending on their function.
    * Sinks can use it to set a default output frame rate.
    * It is similar to the r_frame_rate field in AVStream.
    */
    AVRational frame_rate;
    ...
}
```

可以发现，对 drawtext 滤镜稍加改造，就可以实现目标，具体思路如下所示：

```c
AVRational frame_rate = inlink->frame_rate;
int fps = frame_rate.num / frame_rate.den;
s->var_values[VAR_N] = (inlink->frame_count_out + s->start_number) % fps;
```

为了增加 drawtext 的兼容性，可以为该滤镜增加一个参数来，以控制当`text=%{n}`的时候，滤镜绘制的帧号究竟是连续的帧号还是帧号对帧率的模。

```c
AVRational frame_rate = inlink->frame_rate;
if (s->c && frame_rate.den > 0) {
    int fps = frame_rate.num / frame_rate.den;
    s->var_values[VAR_N] = (inlink->frame_count_out + s->start_number) % fps;
} else {
    s->var_values[VAR_N] = inlink->frame_count_out + s->start_number;
}
```

详细的修改代码可以参见 [vf_drawtext.patch](https://github.com/wangwei1237/wangwei1237.github.io/blob/master/2021/09/09/Draw-Circle-Frame-Number-for-Each-Secnod-Using-FFmpeg/vf_drawtext.patch)。

## 修改 drawtext 之后的效果
此时，我们利用修改后的 drawtext 滤镜来生成我们需要视频，具体操作如下所示：

```shell
$ ffmpeg -i test.mp4 -vf drawtext=text=%{n}:x=50:y=50:c=1 -y output.mp4
```

生成的视频具体如下所示：

{% bilibili 975468511 %}
