---
title: 如何阅读并使用开源项目
reward: false
top: false
date: 2021-09-11 10:08:34
authors:
categories:
  - 文化
tags:
  - 代码阅读
---

我会经常浏览并借鉴很多开源项目的代码来完成自己的工作，有很多时候这种方法让我的工作效率非常高。阅读并借鉴开源项目的成果，让我得以站在巨人的肩膀上，使得我可以更高效的工作。

不知道你也是否和我一样？如果你也和我一样，那么我们是否思考过？我们在引用别人的代码完成自己的项目时，我们的项目是否变成了一个如下图所示的四不像呢？

![](1.gif)

<!--more-->

## 缘起
很久之前就想写一篇类似的文章，但是一直没有写。前几天，在项目中遇到了类似的问题，我才决定要花时间来写一写。

之前阅读过很多开源项目的代码，例如：
* Nginx
* Redis
* FFmpeg
* VMAF
* ……

从这些项目中学到了很多，也成长了很多，还曾经利用这些项目来完成过自己的工作。自认为自己对于阅读开源项目代码并利用开源项目帮助自己完成工作上还算是有一些经验。因此，正好借这篇文章将自己过去在阅读并使用开源项目上的一些思考和经验整理了出来。

## 一个 CMake 的案例
我有一个只有几个人的小组，我们这个小组的主要工作就是探索并开发和视频质量评估、视频检测、视频相关测试等方面的平台和工具。

对于视频检测而言，我们开发了一个项目，可以暂且称之为 MT。整个项目用 C++ 语言来开发，并且使用 CMake 来作为编译工具。因为需要对视频进行解码处理，因此该项目会依赖 FFmpeg。一开始，我们发现，在 CMake 中，[FFmpeg 并不支持使用 find_package 来查找 FFMPeg 的依](https://github.com/Microsoft/vcpkg/issues/1379)。为了简单期间，我们就用了暴力一点的方式来解决这个问题，我们在 CMakeLists 中写下了如下的代码：

```cmake
......
include_directories("${ffmpeg_include_path}")
link_directories("${ffmpeg_lib_path}")
target_link_libraries( MT
    PRIVATE
        libavutil.so
        libavcodec.so
        libavformat.so
        ......
)
```

这段代码确实写的有些糟糕（你也可以试着说一下这段代码究竟有哪些问题），但是他看起来确实可以工作了。后来，我发现了 [FindFFmpeg.cmake](https://github.com/snikulov/cmake-modules/blob/master/FindFFmpeg.cmake) 这个开源的库可以更优雅的实现在 CMake 中查找 FFmpeg 的依赖，于是我让一个同事来升级之前那段有些糟糕的代码。

```cmake
......
include(cmake/FindFFmpeg.cmake)

IF (APPLE)
target_link_libraries( MT
    PRIVATE
        libavutil.dylib 
        libavcodec.dylib 
        libavformat.dylib 
        ......
)
ELSEIF (UNIX)
target_link_libraries( MT
    PRIVATE
        libavutil.so
        libavcodec.so
        libavformat.so
        ......
)
ENDIF ()
```

好吧，看起来问题是解决了。但是，我总觉得这段代码看上去有点别扭，这完全有悖于 CMake 的初衷呀：根据不同的系统链接不同动态库的逻辑为什么要这么显示的写出来？这段代码看起来就下下面这个图一样：

![](2.png)

#### 我是怎么做的
看到提交的代码后，我打回了同事的代码提交。没有仔细的阅读 FindFFmpeg.cmake 的代码（虽然这段代码并不多，我们也可以在短时间内看懂，但是我并没有这么做），我们首先阅读了 FindFFmpeg.cmake 的文档（其实就是代码开始的注释部分），如下所示：

```cmake
# - Try to find the required ffmpeg components(default: AVFORMAT, AVUTIL, AVCODEC)
#
# Once done this will define
#  FFMPEG_FOUND         - System has the all required components.
#  FFMPEG_INCLUDE_DIRS  - Include directory necessary for using the required components headers.
#  FFMPEG_LIBRARIES     - Link these to use the required ffmpeg components.
#  FFMPEG_DEFINITIONS   - Compiler switches required for using the required ffmpeg components.
#
# For each of the components it will additionally set.
#   - AVCODEC
#   - AVDEVICE
#   ......
# the following variables will be defined
#  <component>_FOUND        - System has <component>
#  ......
```

因此，阅读完文档后，我们知道只需要使用 `${AVCODEC}` 等就可以。于是，同事又第二次提交了升级的代码，如下所示：

```cmake
......
include(cmake/FindFFmpeg.cmake)
include_directories("${FFMPEG_INCLUDE_DIRS}")
target_link_libraries( MT
    PRIVATE
        ${FFMPEG_LIBRARIES}
```

![](3.png)

因此，无论在阅读别人的代码，还是在使用别人的代码之前，首先阅读代码的文档或者注释是一件非常有必要的事情，这是我们了解代码的最快速有效的手段（如果有比较规范的注释的话，一般对于比较好的开源项目，注释是比较规范的）。

## 如何使用开源项目
#### 1. 阅读项目的 README
一般而言， README 中会对整个项目进行简要的介绍，例如：
* 这个项目是什么？
* 为什么要做这个项目？
* 这个项目的目的是什么？
* 这个项目都提供了什么能力？
* 如何使用这个项目提供的能力？
* ……

以 VMAF 为例，阅读 [VMAF 的 README](https://github.com/netflix/vmaf#readme) 和 [libvmaf 的 README](https://github.com/Netflix/vmaf/blob/master/libvmaf/README.md) 能够让我们对项目的背景、目标有一个大致了解，并且能够了解到这个项目的：
* 包含了什么能力？
* 设计逻辑是什么？
* 可以解决那些问题？
* 那些问题解决不了？
* 如何使用该项目？
* 可以从那些地方获取到更详细的信息？
* ……

相比较一上来就阅读项目的源码而言，阅读 README 是了解这个项目并准备使用该项目的最快速有效的方法。如果具备可以通过阅读源码提取到项目文档的能力的话，直接阅读源码也可以，但是我认为和阅读 README 相比，阅读源码的效率还是差一点的。

#### 2. 深入阅读需要用到的能力
在 [FFmpeg 解码 API 以及在解码过程中存在的丢帧问题](/2021/01/19/FFMpeg-decode-process-and-lose-frame-in-that-process/) 中，我提到过我是如何利用 FFmpeg API 中的代码注释来定位并解决我们小组开发的工具中存在的 BUG。实际上，如果同事当时能够认真的阅读 [FFmpeg avcodec](https://github.com/FFmpeg/FFmpeg/blob/release/3.1/libavcodec/avcodec.h) 的文档（代码注释），那么就不会有这篇文章中的 BUG 了。

因此，在阅读完 README 之后，如果要在自己的项目中使用开源项目的某个具体能力或 API，那么首先需要针对需要使用的部分更详细的阅读：
1. 开发者指南中对应的内容
    * Developer Guides：需要首先阅读 Developer Guides 中对应的相关资料，例如 [Android Developer Guides](https://developer.android.com/guide/index.html)，[IntelliJ Platform SDK](https://plugins.jetbrains.com/docs/intellij/getting-started.html)……还有很多非开源项目也会有 Developer Guides，对于这种项目，Developer Guides 无疑是最好的、必须首先阅读的资料，比较典型的就是[Apple Developer Guides](https://developer.apple.com/library/archive/navigation/)，我当时了解 iOS 消息推送相关的技术就是首先阅读的 [Local and Remote Notification Programming Guide](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/index.html#//apple_ref/doc/uid/TP40008194)，自我认为比查阅互联网上其他人总结的文档要高效很多。
    * Document：除了 Developer Guides 之外，项目提供的 documentation 也是需要首先阅读的内容，例如 [nginx document](http://nginx.org/en/docs/)，[FFmpeg document](https://ffmpeg.org/documentation.html)，……我比较喜欢使用 [Dash](https://kapeli.com/dash) 这款 MacOS 上的这款 API document 工具，真的非常方便。每当使用一个新的 API 或者使用一个自己拿不准的 API 的时候，Dash 总是我最好的帮手。
    ![](5.png)

2. API 对应的代码注释
    很多的项目，尤其是优秀的项目会有非常优秀的代码注释（很多文档也可能是从代码注释中自动生成的）。因此，在动手写代码之前，最好还是再认真阅读以下项目代码中的注释，这对于我们理解所引用的项目会有很大好处。
    
    在我的工作中，我经常会从开源代码的注释中获取灵感，进而找到解决我所遇到的问题的思路：
    * 在 [用 FFmpeg 把以秒为周期的帧序号信息写入到视频](/2021/09/09/Draw-Circle-Frame-Number-for-Each-Secnod-Using-FFmpeg/) 一文中，我通过阅读 [AVFilter](https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/avfilter.h) 的注释找到了实现“把当前帧是每秒中的第几帧的信息增加到视频中”的思路。
    * 在 解决 [Android 摄像头数据 Hook 问题](https://github.com/wangwei1237/CameraHook) 时，我从阅读 [android.graphics.SurfaceTexture](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/master/graphics/java/android/graphics/SurfaceTexture.java) 的源码注释中找到了解决方案。
    * ……

3. 阅读项目中给出的示例代码
    很多项目会直接以源代码的形式给出示例代码，这些代码会放在如下的目录中：
    * test 目录
    * example 目录
    * ……

    在动手写代码之前，真的建议大家在这些目录下尝试找到项目给出的使用案例。在我的项目中，每次需要用到 FFmpeg 来帮我完成工作时，我总是会第一时间去 `ffmpeg`，`ffprobe`，`ffplay` 这三个工具的实现中找到灵感。

#### 3. 慎用搜索引擎
真的，除非万不得已，除非是我们在执行了如上的步骤之后还没有找到解决方案时，我们才需要运用搜索引擎来帮我们找出如何使用某个项目中的特定能力的方法。我非常不建议一开始就运用搜索引擎，当然这在大多数情况下可能会解决我们的问题，但是我们会因为使用搜索引擎而错过获得更多知识、错过更全面的了解我们将要使用的对象的机会。

并且，我们从搜索引擎获得的方案有时候可能会存在问题，我在 [FFmpeg 解码 API 以及在解码过程中存在的丢帧问题](/2021/01/19/FFMpeg-decode-process-and-lose-frame-in-that-process/) 中提到的解码丢帧问题就是通过搜索引擎而得到的方案。尤其是当我们还处于某方面的新手的时候，这种情况出现的可能会更大。

## 善用别人的代码
善用别人的项目让我们可以站在巨人的肩膀上工作，最重要的是我们需要了解、熟悉我们所用的代码。否则，我们不但没有利用这个项目的优势，反而让自己的项目变成了恐龙。

![](4.jpeg)

## 后记
针对文章中提到的 `FindFFmpeg.cmake` 插件，后来，当我们将该插件应用到自己编译的 `FFmpeg` 之后，我们发现这个插件无法正常工作。直到这个时候，我和我的同事才开始仔细阅读这个插件的代码，最后发现并且修复了存在的 [BUG](https://github.com/snikulov/cmake-modules/pull/2)。我们发现，其实，和开源软件一起成长真的非常快乐。我们要善用别人的代码，同时，我们也要一起为巨人的成长付出应有的努力。
