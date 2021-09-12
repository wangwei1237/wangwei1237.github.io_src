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
* FFMpeg
* Android/platform/frameworks/av
* VMAF
* ……

从这些项目中学到了很多，也成长了很多，还曾经利用这些项目来完成过自己的工作。自认为自己对于阅读开源项目代码并利用开源项目帮助自己完成工作上还算是有一些经验。因此，正好借这篇文章将自己过去在阅读并使用开源项目上的一些思考和经验整理了出来。

## 一个 CMake 的案例
我有一个只有几个人的小组，我们这个小组的主要工作就是探索并开发和视频质量评估、视频检测、视频相关测试等方面的平台和工具。

对于视频检测而言，我们开发了一个项目，可以暂且称之为 MT。整个项目用 C++ 语言来开发，并且使用 CMake 来作为编译工具。因为需要对视频进行解码处理，因此该项目会依赖 FFMpeg。一开始，我们发现，在 CMake 中，[FFMpeg 并不支持使用 find_package 来查找 FFMPeg 的依](https://github.com/Microsoft/vcpkg/issues/1379)。为了简单期间，我们就用了暴力一点的方式来解决这个问题，我们在 CMakeLists 中写下了如下的代码：

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

这段代码确实写的有些糟糕（你也可以试着说一下这段代码究竟有哪些问题），但是他看起来确实可以工作了。后来，我发现了 [FindFFmpeg.cmake](https://github.com/snikulov/cmake-modules/blob/master/FindFFmpeg.cmake) 这个开源的库可以更优雅的实现在 CMake 中查找 FFMpeg 的依赖，于是我让一个同事来升级之前那段有些糟糕的代码。

```cmake
......
include(cmake/FindFFmpeg.cmake)

IF (APPLE)
target_link_libraries( mpc
    PRIVATE
        libavutil.dylib 
        libavcodec.dylib 
        libavformat.dylib 
        ......
)
ELSEIF (UNIX)
target_link_libraries( mpc
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
target_link_libraries( MT
    PRIVATE
        ${AVUTIL_LIBRARIES}
        ${AVCODEC_LIBRARIES}
        ${AVFORMAT_LIBRARIES}
        ......
```

![](3.png)

因此，无论在阅读别人的代码，还是在使用别人的代码之前，首先阅读代码的文档或者注释是一件非常有必要的事情，这是我们了解代码的最快速有效的手段（如果有比较规范的注释的话，一般对于比较好的开源项目，注释是比较规范的）。

## 如何使用开源项目
#### 阅读项目的 README
一般而言， README 中会对整个项目进行简要的介绍，例如：
* 这个项目是什么？
* 为什么要做这个项目？
* 这个项目的目的是什么？
* 这个项目都提供了什么能力？
* 如何使用这个项目提供的能力？
* ……

以 VMAF 为例，阅读 [VMAF 的 README](https://github.com/netflix/vmaf#readme) 能够让我们对项目的背景、目标有一个大致了解，并且能够了解到这个项目的：
* 包含了什么能力？
* 设计逻辑是什么？
* 可以解决那些问题？
* 那些问题解决不了？
* 如何使用该项目？
* 可以从那些地方获取到更详细的信息？
* ……

相比较一上来就阅读项目的源码而言，阅读 README 是了解这个项目并准备使用该项目的最快速有效的方法。如果具备可以通过阅读源码提取到项目文档的能力的话，直接阅读源码也可以，但是我认为和阅读 README 相比，阅读源码的效率还是差一点的。
