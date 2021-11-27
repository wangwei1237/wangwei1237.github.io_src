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

## FFMpeg 如何计算 AVCodecContext.time_base
AVStream->codec->time_base 是 AVCodecContext 中定义的 time_base，根据 [libavcodec/avcodec.h](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/avcodec.h) 中的定义，该字段的解释如下：

```c
/**
  * This is the fundamental unit of time (in seconds) in terms
  * of which frame timestamps are represented. For fixed-fps content,
  * timebase should be 1/framerate and timestamp increments should be
  * identically 1.
  * This often, but not always is the inverse of the frame rate or field rate
  * for video. 1/time_base is not the average frame rate if the frame rate is not
  * constant.
  *
  * Like containers, elementary streams also can store timestamps, 1/time_base
  * is the unit in which these timestamps are specified.
  * As example of such codec time base see ISO/IEC 14496-2:2001(E)
  * vop_time_increment_resolution and fixed_vop_rate
  * (fixed_vop_rate == 0 implies that it is different from the framerate)
  *
  * - encoding: MUST be set by user.
  * - decoding: the use of this field for decoding is deprecated.
  *             Use framerate instead.
  */
AVRational time_base;
```

从中可以看出，对于解码而言，time_base 已经被废弃，需要使用 framerate 来替换 time_base。并且，对于固定帧率而言，time_base = 1/framerate，但是，并非总是如此。

利用 [H264Naked](https://github.com/shi-yan/H264Naked) 对 test.ts 对应的 H264 码流进行分析，我们得到SPS.Vui 信息：
```shell
timing_info_present_flag :1
num_units_in_tick :1
time_scale :2000
fixed_frame_rate_flag :0
```
从中可以看到，test.ts 是非固定帧率视频。从 [test_time_base.cpp](https://github.com/wangwei1237/wangwei1237.github.io_src/blob/master/source/_posts/Why-OpenCV-Get-the-Wrong-FPS/test_time_base.cpp) 的结果看，test.ts 视频中，framerate = 0/0，而 time_base = 1/2000。难道，对于非固定帧率视频而言，time_base 和 framerate 之间没有关联？如果存在关联，那又是怎样的运算才能产生这种结果？这个 time_base 究竟是怎么计算的呢？究竟和 framerate 有没有关系呢？一连串的问题随之而来……

源码面前，了无秘密。接下来，带着这个问题，我们来一起分析一下 FFMpeg 究竟是如何处理 time_base 的。

## avformat_find_stream_info
在 FFMpeg 中，`avformat_find_stream_info()` 会对 `ic->streams[video_stream]->codec` 进行初始化，因此，我们可以从 `avformat_find_stream_info()` 开始分析。

从 [libavformat/avformat.h](https://github.com/FFmpeg/FFmpeg/blob/master/libavformat/avformat.h) 中，可以得知`avformat_open_input()`会打开视频流，从中读取相关的信息，然后存储在`AVFormatContext`中，但是有时候，此处获取的信息并不完整，因此需要调用`avformat_find_stream_info()`来获取更多的信息。

```c
* @section lavf_decoding_open Opening a media file
* The minimum information required to open a file is its URL, which
* is passed to avformat_open_input(), as in the following code:
* @code
* const char    *url = "file:in.mp3";
* AVFormatContext *s = NULL;
* int ret = avformat_open_input(&s, url, NULL, NULL);
* if (ret < 0)
*     abort();
* @endcode
* The above code attempts to allocate an AVFormatContext, open the
* specified file (autodetecting the format) and read the header, exporting the
* information stored there into s. Some formats do not have a header or do not
* store enough information there, so it is recommended that you call the
* avformat_find_stream_info() function which tries to read and decode a few
* frames to find missing information.
```

需要注意的是：`avformat_find_stream_info()` 会尝试通过解码部分视频帧来获取需要的信息。

```c
/**
 * Read packets of a media file to get stream information. This
 * is useful for file formats with no headers such as MPEG. This
 * function also computes the real framerate in case of MPEG-2 repeat
 * frame mode.
 * The logical file position is not changed by this function;
 * examined packets may be buffered for later processing.
 *
 * @param ic media file handle
 * @param options  If non-NULL, an ic.nb_streams long array of pointers to
 *                 dictionaries, where i-th member contains options for
 *                 codec corresponding to i-th stream.
 *                 On return each dictionary will be filled with options that were not found.
 * @return >=0 if OK, AVERROR_xxx on error
 *
 * @note this function isn't guaranteed to open all the codecs, so
 *       options being non-empty at return is a perfectly normal behavior.
 *
 * @todo Let the user decide somehow what information is needed so that
 *       we do not waste time getting stuff the user does not need.
 */
int avformat_find_stream_info(AVFormatContext *ic, AVDictionary **options);
```

`avformat_find_stream_info()` 的整体逻辑大致如下图所示，其中特别需要关注图中所示的 7 个步骤：
![](2.png)

!!! note avformat_find_stream_info() 的几个重要步骤
    * **STEP 1**. 设置线程数，避免 H264 多线程解码时没有把 SPS/PPS 信息提取到 extradata 的问题。
    * **STEP 2**. 设置 AVStream \*st，st 会在后续的函数调用中一直透到 try_decode_frame()。
    * **STEP 4**. 设置 AVCodecContext \*avctx 为透传的 st->internal->avctx，在后续的解码函数调用中，一直透传的就是这个 avctx，因此，从这里开始的执行流程，FFMpeg 使用的全部都是 st->internal->avctx，而不是st->codec，这里要特别的注意。此处同时会设置解码的线程数，其目的和 *STEP 1*是一致的。
    * **STEP 5**. 因为之前设置了解码线程数为 1，因此此处会调用 ret = avctx->codec->decode(avctx, frame, &got_frame, pkt) 来解码并计算 avctx->framerate。注意，此处的 avctx 实际上是透传而来的 st->internal->avctx。这里先假定解码之后我们拿到了 framerate，具体的解码过程以及计算framerate 的逻辑我们在后续的章节继续介绍。
    * **STEP 6**. 根据解码器得到的 framerate 信息来计算 avctx->time_base，注意此处实际上是 st->internal->avctx->time_base。
    * **STEP 7**. 这一步可谓是“瞒天过海，明修栈道暗度陈仓”，这一步为了解决 API 的前向兼容，做了一个替换，把st->internal->avctx->time_base 赋值给了 st->codec->time_base，而把 st->avg_frame_rate 赋值给了 st->codec->framerate。

正是如上所示的 *STEP 7* 导致了 [test_time_base.cpp](https://github.com/wangwei1237/wangwei1237.github.io_src/blob/master/source/_posts/Why-OpenCV-Get-the-Wrong-FPS/test_time_base.cpp) 的结果：

```
st->codec->framerate: 0/0
st->codec->time_base: 1/2000
```

## ff_h264_decoder

