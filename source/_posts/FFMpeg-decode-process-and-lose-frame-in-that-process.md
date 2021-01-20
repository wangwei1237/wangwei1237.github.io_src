---
title: FFMpeg解码API以及在解码过程中存在的丢帧问题
reward: false
top: false
date: 2021-01-19 14:10:38
categories: 
  - 视频技术
tags:
  - FFMpeg
  - 视频解码
  - 解码丢帧
  - avcodec_send_packet
  - avcodec_receive_frame
---

![](1.png)

## 背景
在优化视频客观全参考算法（主要是*PSNR*, *SSIM*, *MS-SSIM*）时，我们首先利用FFMpeg提供的API（*`avcodec_send_packet()`*，*`avcodec_receive_frame()`*）对输入的两个MP4文件转成对应的YUV格式的数据文件，然后再基于这两份YUV数据文件进行计算，得到对应的结果。

但是，我们发现，MP4文件转成YUV数据后，总是会发生**丢失视频最后几帧**的现象。

为了弄清楚这个问题，查阅了FFMpeg的源码，并参考了网络上的资料，然后总结出了这篇文章。
<!--more-->

## FFMpeg的编解码API
从[3.1版本](https://github.com/FFmpeg/FFmpeg/commit/7fc329e2dd6226dfecaa4a1d7adf353bf2773726)开始，FFMpeg提供了[新的编解码API](https://github.com/FFmpeg/FFmpeg/blob/release/3.1/libavcodec/avcodec.h)来对音视频数据进行编解码操作，从而实现对输入和输出的解耦：
* 解码API
  * avcodec_send_packet()
  * avcodec_receive_frame()
* 编码API
  * avcodec_send_frame()
  * avcodec_receive_packet()

```c
/**
 * @ingroup libavc
 * @defgroup lavc_encdec send/receive encoding and decoding API overview
 * @{
 *
 * The avcodec_send_packet()/avcodec_receive_frame()/avcodec_send_frame()/
 * avcodec_receive_packet() functions provide an encode/decode API, which
 * decouples input and output.
 * ...
 */
```

同时，也正是从3.1版本开始，之前的编解码API也被标注为`deprecated`：
* 解码API
  * avcodec_decode_video2()
  * avcodec_decode_audio4():
* 编码API
  * avcodec_encode_video2()
  * avcodec_encode_audio2()

```c
attribute_deprecated
int avcodec_decode_audio4(AVCodecContext *avctx, AVFrame *frame,
                          int *got_frame_ptr, const AVPacket *avpkt);
```

在我们的工具中，我们采用了新的解码API：`avcodec_send_packet()`和`avcodec_receive_frame()`，实现视频帧的解码，并将解码后的数据转成YUV数据。具体的代码片段如下，[点击可查看完整测试代码](https://wangwei1237.gitee.io/2021/01/19/FFMpeg-decode-process-and-lose-frame-in-that-process/test_video_parser_1.cpp)。

```c++
int process_frame() {
    ......
}

//decode operation.
while (!av_read_frame(fmt_ctx, pkt)) {
    if (pkt->stream_index != video_stream_idx) {
        continue;
    }

    int packet_new = 1;
    while (process_frame(fmt_ctx, dec_ctx, video_stream->codecpar, 
                         frame, pkt, &packet_new) > 0) {
        i++;
    };
    av_packet_unref(pkt);
}
```

从代码可以看出，`i`是解码帧的总数，但是我们运行之后发现，一个252帧的视频，最终只得到了248帧。

```shell
$ g++ --std=c++11 test_video_parser_1.cpp $(pkg-config --cflags --libs libavcodec libavdevice libavformat libavutil)
$ frame count: 248
```

## send_packet & receive_frame
为了加深对解码API的了解，以便能查出问题原因，我们查阅了[FFMpeg的代码](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/avcodec.h)，从代码的注释中，我们发现了问题：**我们没有遵循API的使用规范，同时FFMpeg在注释中也说明了为什么会出现我们遇到的问题**。

```c
/**
  * ... 
  * At the beginning of decoding or encoding, the codec might accept multiple
  * input frames/packets without returning a frame, until its internal buffers
  * are filled. This situation is handled transparently if you follow the steps
  * outlined above.
  * 
  * End of stream situations. These require "flushing" (aka draining) the codec,
  * as the codec might buffer multiple frames or packets internally for
  * performance or out of necessity (consider B-frames).
  * ...
  */
```

也就是说，为了提升性能或出于其他的考虑，解码器会在内部缓存多个`frames`/`packets`。因此，当流结束的时候，需要对解码器执行`flushing`操作，以便获取解码器缓存的`frames`/`packets`。

我们的工具中，在流结束之后，并没有执行`flushing`操作，因此就出现了解码过程丢帧的现象。按照FFMpeg的指导，我们补充了如下的逻辑，以便获取解码器中缓存的帧，[点击可查看完整测试代码](https://wangwei1237.gitee.io/2021/01/19/FFMpeg-decode-process-and-lose-frame-in-that-process/test_video_parser_2.cpp)。

```c++
//Flush remaining frames that are cached in the decoder
int packet_new = 1;
av_init_packet(pkt);
pkt->data = NULL;
pkt->size = 0;
while (process_frame(fmt_ctx, dec_ctx, video_stream->codecpar, 
                     frame, pkt, &packet_new) > 0) {
    i++;
    packet_new = 1;
};
```

再次运行，我们发现，丢帧问题消失了。

```shell
$ g++ --std=c++11 test_video_parser_1.cpp $(pkg-config --cflags --libs libavcodec libavdevice libavformat libavutil)
$ frame count: 252
```

## FFMPeg解码API状态机
### avcodec_send_packet返回值
从FFMpeg的源码中，我们会发现，正常情况下，`avcodec_send_packet()`函数的返回值主要有以下三种：
* `0`: on success.
* `EAGAIN`: input is not accepted in the current state - user must read output with avcodec_receive_frame() (once all output is read, the packet should be resent, and the call will not fail with EAGAIN). 
* `EOF`: the decoder has been flushed, and no new packets can be sent to it (also returned if more than 1 flush packet is sent).

### avcodec_receive_frame返回值
同样的，正常情况下，`avcodec_receive_frame()`函数的返回值主要有以下三种：
* `0`: success, a frame was returned.
* `EAGAIN`: output is not available in this state - user must try to send new input.
* `EOF`: the decoder has been fully flushed, and there will be no more output frames.

### 解码API状态机
`avcodec_send_packet()`和`avcodec_receive_frame()`不同的返回值代表了解码器的不同的状态。

对API的调用实际上是一种动作，而API的返回值则用来标志当前解码器的状态。因此，解码API的整个过程实际上就是一个状态机。

根据[avcodec_send_packet返回值](#avcodec_send_packet返回值)和[avcodec_receive_frame返回值](#avcodec_receive_frame返回值)中的介绍，可以得到正常情况下，解码过程的状态机，如下图所示。

![](2.png)

在图中，`节点`代表状态（API的返回值），`箭头`代表API的调用。蓝色表示和`avcodec_send_packet()`相关，红色表示和`avcodec_receive_frame()`相关。

[我们修复版本的解码实现](https://wangwei1237.gitee.io/2021/01/19/FFMpeg-decode-process-and-lose-frame-in-that-process/test_video_parser_2.cpp)实际上就是对如上图所示的状态机的实现。

而如果在实现的时候，没有处理如下图所示的状态，则会导致无法获取视频最后几帧的问题。

![](3.png)

## 思考
* 源码面前，了无秘密。侯捷老师说过“源码面前，了无秘密”。工作中发现，源码确实是我们获取知识和经验的一个非常有效的途径，尤其是那些好的开源项目的源码，更是如此。
* 源码还是我们解决问题的强有力的手段之一。对于这些优秀的开源项目的源码而言，代码只是一个部分，源码中的注释、文档等会为我们提供足够的资源。这次问题的解决就是依赖源码，之前在Android摄像头Mock技术的研究中，也是在查阅Android相关源码后才有了思路。因此，当我们在工作中遇到问题的时候，第一手的资料还是源码（当然，要有源码才行），其次才是官方文档，最后才是网络上的其他资源。
* 看了那么多的源码才发现：优秀的项目是那么的一致，而糟糕的项目，各有各的糟糕之处。