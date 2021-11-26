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

这个问题的具体描述可以参见 [OpenCV Issues 21006](https://github.com/opencv/opencv/issues/21006)。该问题的模拟直播流片段 test.ts 可以点击[链接](https://pan.baidu.com/s/1RY0Zk5C_DOEwTXYe2SLFEg)下载，下载提取码为 x87m。

## OpenCV 如何计算帧率
如果用如下的代码获取 test.ts 的 fps，
```c++
const double FPS = cap.get(cv::CAP_PROP_FPS);
std::cout << "fps: " << FPS << std::endl;
```

可以得到：
```shell
$ fps: 2000
```

我们用 `ffprobe -select_streams v -show_streams test.ts` 对视频进行分析，可以得到：
```shell
codec_name=h264
r_frame_rate=30/1
avg_frame_rate=0/0
……
```

从 [opencv/modules/videoio/src/cap_ffmpeg_impl.hpp](https://github.com/opencv/opencv/blob/4.x/modules/videoio/src/cap_ffmpeg_impl.hpp) 中我们可以找到 fps 的计算函数 `CvCapture_FFMPEG::get_fps()`，其计算逻辑如下：

```
double fps = r2d(ic->streams[video_stream]->avg_frame_rate);
if (fps < eps_zero) {
    fps = 1.0 / r2d(ic->streams[video_stream]->codec->time_base);
}
```

## 为什么 OpenCV 得到的帧率是错的
利用 [test_time_base.cpp](https://github.com/wangwei1237/wangwei1237.github.io_src/blob/master/source/_posts/Why-OpenCV-Get-the-Wrong-FPS/test_time_base.cpp)，我们可以得到：

```
time_base: 1/2000
framerate: 0/0
avg_framerate: 0/0
```

*r2d(ic->streams[video_stream]->avg_frame_rate)* 的结果为 0，所以 OpenCV 采用了 *1.0 / r2d(ic->streams[video_stream]->codec->time_base)* 来计算该视频的 fps。而 *ic->streams[video_stream]->codec->time_base = 1/2000*，因此，最终得到的 fps 是 2000。

也就是说，AVStream->codec->time_base 的值导致了 OpenCV 得到一个看起来是错误的 fps。那么，AVStream->codec->time_base 为什么是这个数呢？FFMpeg 是怎么计算这个字段的呢？

## FFMpeg 如何计算AVStream->codec->time_base