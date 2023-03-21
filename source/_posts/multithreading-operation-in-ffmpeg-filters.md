---
title: FFmpeg滤镜中的多线程计算
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

## 1. FFmpeg 滤镜的基本概念
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

## 2. FFmpeg 滤镜开发简介
根据 [FFmpeg Filtering Guide](https://trac.ffmpeg.org/wiki/FilteringGuide)，可以在 [FFmpeg filter HOWTO](https://wiki.multimedia.cx/index.php/FFmpeg_filter_HOWTO) 的帮助下来编写 FFmpeg 滤镜，为 FFmpeg 增加新的能力。

但是，根据个人经验，在开发滤镜时，我更建议把 [FFmpeg/doc/writing_filters.txt](https://github.com/FFmpeg/FFmpeg/blob/master/doc/writing_filters.txt) 作为滤镜开发指南。

## 3. 多线程滤镜开发
FFmpeg 滤镜会涉及到大量的计算，因此，如果可以采用多线程的方式来加速滤镜的计算，对于有效率要求的场景而言将是一大福音。

根据 [FFmpeg/doc/writing_filters.txt](https://github.com/FFmpeg/FFmpeg/blob/master/doc/writing_filters.txt) 的说明，到目前为止，对于滤镜而言，FFmpeg 仅支持 `slice-级别`多线程（还不支持`帧-级别`多线程）。

!!! note slice 基本概念
    ![](3.jpeg)
    <br /> 如上图所示，在滤镜计算过程中，视频帧被分割成若干单独的 `slice(切片)`，不同的 `slice` 可以同时并行执行滤镜操作。

    实际上，在计算过程中，可以简单的把 `slice` 理解为由多行构成的帧数据。因此，`slice-级别` 的多线程实际上就是按行将图像拆分为多个 `slice`，然后多个 `slice` 之间并行执行滤镜计算。

### 3.1 slice 分割
对于单线程的滤镜操作，整体代码实现如下所示：

```c
// ......
for (y = 0; y < inlink->h; y++) {
    for (x = 0; x < inlink->w; x++) {
        dst[x] = foobar(src[x]);
    }
    // ......
}
```

为了使如上的代码可以进行 `slice-级别` 的并行计算，需要做如下的修改：

```c
// ......
for (y = slice_start; y < slice_end; y++) {
    for (x = 0; x < inlink->w; x++) {
        dst[x] = foobar(src[x]);
    }
    // ......
}
```

其中，`slice_start`，`slice_end` 在回调函数 `avfilter_action_func` 中根据线程的数量来定义，一般而言，其定义的代码如下所示：

```c
const int slice_start = (in->height *  jobnr     ) / nb_jobs;
const int slice_end   = (in->height * (jobnr + 1)) / nb_jobs;
```

### 3.2 定义 ThreadData
`avfilter_action_func` 的定义位于 [libavfilter/avfilter.h](https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/avfilter.h) 中：

```c
/**
 * A function pointer passed to the @ref AVFilterGraph.execute callback to be
 * executed multiple times, possibly in parallel.
 *
 * @param ctx the filter context the job belongs to
 * @param arg an opaque parameter passed through from @ref
 *            AVFilterGraph.execute
 * @param jobnr the index of the job being executed
 * @param nb_jobs the total number of jobs
 *
 * @return 0 on success, a negative AVERROR on error
 */
typedef int (avfilter_action_func)(AVFilterContext *ctx, void *arg, int jobnr, int nb_jobs);
```

根据如上的文档可知，为了使得 `avfilter_action_func` 可以并行执行，需要通过 `arg` 参数将滤镜执行需要的数据传递到回调函数中。一般而言，可以通过定义一个 `ThreadData` 的结构来打包滤镜计算所需要的信息：

```c
typedef struct ThreadData {
    AVFrame *in, *out;
    // ......
} ThreadData;
```

### 3.3 修改 filter_frame
最后，在 `filter_frame()` 中，我们需要调用 `threading distributor` 以实现滤镜的并行执行。

```c
ThreadData td;

// ...

td.in  = in;
td.out = out;

ff_filter_execute(ctx, filter_slice, &td, NULL, FFMIN(outlink->h, ff_filter_get_nb_threads(ctx)));

// ...
```

### 3.4 修改 AVFilter.flags
到此为止，我们已经让滤镜具备的多线程并行执行的能力，但是为了能够实现并行计算的能力，我们还要修改 `AVFilter.flags`，并为其增加 `AVFILTER_FLAG_SLICE_THREADS` 属性。

在 [libavfilter/avfilter.h](https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/avfilter.h) 中，`AVFILTER_FLAG_SLICE_THREADS` 的定义如下：

```c
/**
 * The filter supports multithreading by splitting frames 
 * into multiple parts and processing them concurrently.
 */
#define AVFILTER_FLAG_SLICE_THREADS         (1 << 2)
```

## 4. 多线程滤镜 Demo
在 [vf_ms.c](https://github.com/wangwei1237/wangwei1237.github.io/blob/master/2023/03/01/multithreading-operation-in-ffmpeg-filters/vf_ms.c) 中，我们实现了一个简单的滤镜，该滤镜仅提供了一个参数（`ms`）用来控制是否启用多线程。

```shell
$ ffmpeg -help filter=ms

Filter ms
  Test for the multithreading filter.
    slice threading supported
    Inputs:
       #0: default (video)
    Outputs:
       #0: default (video)
ms AVOptions:
   ms                <boolean>    ..FV....... Multithreading or not (default false)
```

在相同的机器上对如上滤镜进行测试，在不开启多线程的情况下，其性能如下所示：

```shell
$ ffmpeg -i ./test.mp4 -vf ms=ms=0 -f null -

frame= 2455 fps= 88 q=-0.0 Lsize=N/A time=00:01:43.12 bitrate=N/A speed=3.71x
```

在开启多线程时，其性能如下所示：

```shell
$ ffmpeg -i ./test.mp4 -vf ms=ms=1 -f null -

frame= 2455 fps= 97 q=-0.0 Lsize=N/A time=00:01:43.12 bitrate=N/A speed=4.07x
```

当然，如上的测试不是一个严格的测试过程，因此并不能用该测试来证明启用多线程就一定能提升滤镜的性能。但是，从如上的对比可知，开启多线程计算时，针对该滤镜算法，其性能大概有 10% 左右的提升。
