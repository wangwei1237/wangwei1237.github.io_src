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
  - FFmpeg
  - 帧率
---

![](1.jpeg)

我们有一个平台来周期性的对线上的直播流数据进行某些检测，例如黑/白屏检测、静态画面检测……在检测中，我们会根据提取到的直播流的帧率来预估要计算的帧数量，例如如果要检测 5s 的直播流，而该直播流的帧率为 20 fps，需要计算的帧数量则为 100。忽然有一天，我们发现，平台开始大面积的超时，之前只需要 2s 就能完成的计算，现在却需要 30+ 分钟。查了之后，我们发现，之所以计算超时是因为 OpenCV 计算的帧率为 2000，从而导致需要计算的帧数量从之前的 100 变为了 10000，进而引起了计算超时。 

<!--more-->

## OpenCV 如何计算帧率
这个问题的具体描述可以参见 [OpenCV Issues 21006](https://github.com/opencv/opencv/issues/21006)。该问题的模拟直播流片段 test.ts 可以点击[链接](https://pan.baidu.com/s/1RY0Zk5C_DOEwTXYe2SLFEg)下载，下载提取码为 x87m。

如果用如下的代码获取 test.ts 的 fps，
```c++
const double FPS = cap.get(cv::CAP_PROP_FPS);
std::cout << "fps: " << FPS << std::endl;
```

可以得到：
```shell
$ fps: 2000
```

用 ffprobe 对视频进行分析，
```shell
$ ffprobe -select_streams v -show_streams test.ts
```
可以得到：
```shell
codec_name=h264
r_frame_rate=30/1
avg_frame_rate=0/0
……
```

从 [opencv/modules/videoio/src/cap_ffmpeg_impl.hpp](https://github.com/opencv/opencv/blob/4.x/modules/videoio/src/cap_ffmpeg_impl.hpp) 中，我们发现 fps 由 `CvCapture_FFMPEG::get_fps()` 计算而来，其计算逻辑如下：

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

```
r2d(ic->streams[video_stream]->avg_frame_rate) = 0
```
所以 OpenCV 采用了 <a name="opencv-framerate"></a>
```
1.0 / r2d(ic->streams[video_stream]->codec->time_base) 
```
来计算该视频的 fps。而此处的 **time_base = 1/2000**，因此，最终得到的 fps 是 2000。

也就是说，**AVStream->codec->time_base** 的值导致了 OpenCV 得到一个看起来是错误的 fps。那么，**AVStream->codec->time_base** 为什么是这个数呢？FFmpeg 是怎么计算这个字段的呢？

## FFmpeg 如何计算 AVCodecContext.time_base
**AVStream->codec->time_base** 是 **AVCodecContext** 中定义的 **time_base** 字段，根据 [libavcodec/avcodec.h](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/avcodec.h) 中的定义，该字段的解释如下：
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

从中可以看出，对于解码而言，**time_base** 已经被废弃，需要使用 **framerate** 来替换 **time_base**。并且，对于固定帧率而言，**time_base = 1/framerate**，但是，并非总是如此。

利用 [H264Naked](https://github.com/shi-yan/H264Naked) 对 test.ts 对应的 H264 码流进行分析，我们得到 <a name="sps">SPS.Vui</a> 信息：
```shell
timing_info_present_flag :1
num_units_in_tick :1
time_scale :2000
fixed_frame_rate_flag :0
```
从中可以看到，test.ts 是非固定帧率视频。从 [test_time_base.cpp](https://github.com/wangwei1237/wangwei1237.github.io_src/blob/master/source/_posts/Why-OpenCV-Get-the-Wrong-FPS/test_time_base.cpp) 的结果看，test.ts 视频中，**framerate = 0/0**，而 **time_base = 1/2000**。

难道，对于非固定帧率视频而言，**time_base** 和 **framerate** 之间没有关联？如果存在关联，那又是怎样的运算才能产生这种结果？这个 **time_base** 究竟是怎么计算的呢？究竟和 **framerate** 有没有关系呢？一连串的问题随之而来……

源码面前，了无秘密。接下来，带着这个问题，我们来一起分析一下 FFmpeg 究竟是如何处理 **time_base** 的。

## avformat_find_stream_info
在 FFmpeg 中，`avformat_find_stream_info()` 会对 **ic->streams[video_stream]->codec** 进行初始化，因此，我们可以从 `avformat_find_stream_info()` 开始分析。

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

!!! note avformat_find_stream_info() 的重要步骤说明
    * <a name="step1">**STEP 1**</a>. 设置线程数，避免 H264 多线程解码时没有把 **SPS/PPS** 信息提取到 **extradata**。
    * **STEP 2**. 设置 `AVStream *st`，**st** 会在后续的函数调用中一直透到 `try_decode_frame()`。
    * <a name="step4">**STEP 4**</a>. 设置 `AVCodecContext *avctx` 为透传的 **st->internal->avctx**，在后续的解码函数调用中，一直透传的就是这个 **avctx**，因此，从这里开始的执行流程，FFmpeg 使用的全部都是 **st->internal->avctx**，而不是 **st->codec**，这里要特别的注意。此处同时会设置解码的线程数，其目的和 [STEP 1](#step1)是一致的。
    * <a name="step5">**STEP 5**</a>. 因为之前设置了解码线程数为 1，因此此处会调用 
    ```c
    ret = avctx->codec->decode(avctx, frame, &got_frame, pkt)
    ```
    来解码并计算 **avctx->framerate**。
    注意，此处的 **avctx** 实际上是透传而来的 **st->internal->avctx**。计算 **framerate** 的逻辑会在 [如何计算 framerate](#framerate) 介绍。
    * <a name="step6">**STEP 6**</a>. 根据解码器得到的 **framerate** 信息来计算 **avctx->time_base**，注意此处实际上是 **st->internal->avctx->time_base**。
      根据 [下文 framerate 的计算](#framerate) 可知，此处 **framerate** = {1000, 1}。
      根据 [AVCodecContext.ticks_per_frame 的介绍](#ticks_per_frame) 可知，**ticks_per_frame** = 2。
      因此，此处 **avctx->time_base** = {1, 2000}：
      ```
      avctx->time_base = av_inv_q(av_mul_q({1000, 1}, {2, 1})) = {1, 2000}
      ```
    * <a name="step7">**STEP 7**</a>. 这一步可谓是“瞒天过海，明修栈道暗度陈仓”，这一步为了解决 API 的前向兼容，做了一个替换，把 **st->internal->avctx->time_base** 赋值给了 **st->codec->time_base**，而把 **st->avg_frame_rate** 赋值给了 **st->codec->framerate**。因此：
    ```
    st->codec->time_base = {1, 2000}
    st->codec->framerate = {0, 0}
    ```
    **st->codec->time_base** 的计算和 **st->codec->framerate** 之间没有任何关系，而是和 **st->internal->avctx->framerate** 有关。本质而言，和 **sps.time_scale**，**sps.num_units_in_tick** 有关。
    ```c
    st->internal->avctx->time_base.num = sps->num_units_in_tick * 
        st->internal->avctx->ticks_per_frame

    st->internal->avctx->time_base.den = sps->time_scale * 
        st->internal->avctx->ticks_per_frame;

    st->internal->avctx->time_base = {sps->num_units_in_tick, sps->time_scale}
    ```

!!! attention internal->avctx->time_base & internal->framerate
    * 所以实际上，**internal->avctx->time_base** 为：
    ```c
    avctx->time_base = sps->num_units_in_tick / sps->time_scale
    ```
    * 而，**internal->avctx->framerate** 则是：
    ```c
    avctx->framerate = sps->time_scale / (sps->num_units_in_tick * avctx->ticks_per_frame)
    ```
    因此，对于 H264 码流而言，**time_base = 1 / (2 * framerate)**，而不是 **1 / framerate**。

    这也就是为什么 [libavcodec/avcodec.h](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/avcodec.h) 中说：

    ```c
     * This often, but not always is the inverse of the frame rate or field rate
     * for video.
    ```

    从如上的分析可以知道：
    ```c
    avctx->framerate = 1 / (avctx->time_base * avctx->ticks_per_frame)
    ```
    因此，当 **st->avg_frame_rate = 0** 时，[OpenCV 计算 fps 的逻辑](#opencv-framerate) 是错误的。
    
    在 H265 中，**ticks_per_frame = 1**，因此对于 H265 的编码，OpenCV 是没有这个问题的。可以使用 [Zond 265](https://www.dektec.com/products/applications/Zond/) 工具来分析一个 H265 的视频码流，然后对照 OpenCV 以及 FFmpeg 的结果来验证。


同时，正是如上所示的 *[STEP 7](#step7)* 中的移花接木导致了 [test_time_base.cpp](https://github.com/wangwei1237/wangwei1237.github.io_src/blob/master/source/_posts/Why-OpenCV-Get-the-Wrong-FPS/test_time_base.cpp) 的结果：

```
st->codec->framerate: 0/0
st->codec->time_base: 1/2000
```

## ff_h264_decoder
[libavcodec/decode.c](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/decode.c) 中的 `decode_simple_internal()` 中会调用对应的解码器来进行解码（[STPE 5](#step5)）。而正如前所示，test.ts 为 H264 编码的视频流，因此，此处会调用 H264 解码器来进行解码。在 FFmpeg 中，H264 解码器位于 [libavcodec/h264dec.c](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/h264dec.c) 中定义的 `const AVCodec ff_h264_decoder`。

```c
const AVCodec ff_h264_decoder = {
    .name                  = "h264",
    .type                  = AVMEDIA_TYPE_VIDEO,
    .id                    = AV_CODEC_ID_H264,
    .priv_data_size        = sizeof(H264Context),
    .init                  = h264_decode_init,
    .close                 = h264_decode_end,
    .decode                = h264_decode_frame,
    ......
};
```
在上文图中的 [STPE 5](#step5) 中，
```c
ret = avctx->codec->decode(avctx, frame, &got_frame, pkt);
```

实际调用的就是
```
ff_h264_decoder->h264_decode_frame(avctx, frame, &got_frame, pkt);
```
而此处的 **avctx** 也就是 `try_decode_frame()` 中的透传下来的 **st->internal->avctx**，即上文图中的 [STEP 4](#step4)。

## h264_decode_frame
`h264_decode_frame()` 的整体逻辑如下图所示：

![](3.png)

!!! note <a name="ticks_per_frame">AVCodecContext.ticks_per_frame</a>
    后面会用到 **ticks_per_frame** 来计算 **framerate**。在 [STEP 6](#step6) 中计算 **time_base** 的时候也用到了该值。因此，有必要做一下特殊说明。
    在 H264 解码器中，**ticks_per_frame=2**，其具体的取值可以从如下几处得知：
    * [libavcodec/avcodec.h](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/avcodec.h) 中的字段说明：
    ```c
    /**
     * For some codecs, the time base is closer to the field rate than the frame rate.
     * Most notably, H.264 and MPEG-2 specify time_base as half of frame duration
     * if no telecine is used ...
     *
     * Set to time_base ticks per frame. Default 1, e.g., H.264/MPEG-2 set it to 2.
     */
    int ticks_per_frame;
    ```
    * [libavcodec/h264dec.c](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/h264dec.c) 中的 `h264_decode_init()`：
    ```c
    avctx->ticks_per_frame = 2;
    ```

## 如何计算 framerate

!!! note 如何计算 st->internal->avctx->framerate
    * STEP 1. 根据整体的计算流程可知，此处的 **h** 实际上就是 `avformat_find_stream_info()` 中的 **st->internal->avctx->priv_data**。**h** 会一直透传到之后的所有流程，这个务必要注意。
    * STEP 2. 此处会首先获取到 **sps** 的相关信息，以备后续的计算使用，我们可以再次看一下 [test.ts sps](#sps) 的相关信息。
    ```shell
    timing_info_present_flag :1
    num_units_in_tick :1
    time_scale :2000
    fixed_frame_rate_flag :0
    ```
    * STEP 3. 根据 **sps** 的相关信息计算 **framerate**，在上文的 [STEP 6](#step6) 中计算 **time_base** 用到的 **framerate** 就是在此处计算的。因为 **timing_info_present_flag = 1**，因此会执行计算 <a name="framerate">`framerate`</a> 的逻辑：
    ```c
    avctx->framerate.den = sps->num_units_in_tick * h->avctx->ticks_per_frame = 1 * 2 = 2
    avctx->framerate.num = sps->time_scale = 2000
    avctx->framerate = (AVRational){1000, 1}
    ```
    因此，
    ```c
    st->internal->avctx->framerate = {1000, 1}
    ```

## 结论
通过如上的分析我们可以知道：
* FFmpeg 在计算 `AVCodecContex` 中的 **framerate** 和 **time_base** 的时候，会用到：
  * **sps.time_scale**
  * **sps.num_units_in_tick**
  * **AVCodecContex.ticks_per_frame**
* 在 FFmpeg 中，**framerate** 和 **time_base** 的关系为：
  * **framerate = 1 / (time_base * ticks_per_frame)**
  * **time_base = 1 / (framerate * ticks_per_frame)**
* 对于非 H.264/MPEG-2，**ticks_per_frame=1**，因此 **framerate** 和 **time_base** 是互为倒数的关系。而对于 H.264/MPEG-2 而言，**ticks_per_frame=2**，因此，此时，二者并非是互为倒数的关系。因此，FFmpeg 中才说，**framerate** 和 **time_base** 通常是互为倒数的关系，但并非总是如此。
* 在 OpenCV 中，对于 H.264/MPEG-2 视频而言，当 **AVStream.avg_frame_rate=0** 时，其计算 fps 的逻辑存在 BUG。
* 因为在解码时，**AVCodecContex.time_base** 已经废弃，同时 **AVStream.avctx** 也已经废弃，而 `avformat_find_stream_info()` 中为了兼容老的 API，因此会利用 **AVStream.internal.avctx** 和其他的信息来设置 **AVStream.avctx**。而 **AVStream.avctx.time_base** 取自 **AVStream.internal.avctx**，**AVStream.avctx.framerate** 则取自 **AVStream.framerate**。