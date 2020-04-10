---
title: macOS Catalina编译的FFMpeg运行crash
reward: false
top: false
date: 2020-04-08 09:23:19
categories: 
  - 视频技术
tags:
  - FFMpeg
  - 编译
  - macOS Catalina
---

因为近期正在调研&了解[SRT协议](https://github.com/Haivision/srt)的相关内容，为了方便，需要打开FFMpeg的`--enable-libsrt`功能并重新编译FFMpeg，从而保证FFMpeg支持SRT协议。但是重新编译之后却发现启动ffmpeg工具就会被内核杀死，具体如下所示。

![](1.jpg)
<!--more-->

利用*lldb*调试该*ffmpeg*发现直接提示`error: Malformed Mach-o file`的错误，具体如下：

![](2.jpg)

编译异常的Mac版本和Xcode版本信息分别如下：

![](3.jpg)

查阅了[网上的资料](https://trac.ffmpeg.org/ticket/8073)，也查看了[brew编译FFMpeg的指令](https://github.com/Homebrew/homebrew-core/blob/master/Formula/ffmpeg.rb)，原因可能是：**Xcode11下clang默认开启-fstack-check**。

同时，在如下图所示的Xcode 10.3版本的Mac上则可编译成功：

![](4.jpg)

因此根据如上信息：`./configure`时需要增加`--host-cflags=-fno-stack-check`配置。

但是增加该配置之后，编译出的ffmpeg依然无法正常运行。

**暂时先将这个问题记录下来，等有时间了再彻底追查一下。**
