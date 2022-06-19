---
title: 1k bit = 1024 bit？
reward: false
top: false
date: 2022-06-19 11:17:53
authors:
categories:
  - 码率
tags:
  - IEC(国际电工委员会) 
  - SI(国际单位制)
---
![](1.jpg)

## 引言
我们的平台有一个算子用于计算给定视频的音视频流的码率，该算子底层通过调用 `ffprobe` 来计算音视频的码率。

```bash
ffprobe -select_streams v:0 -show_entries stream=bit_rate \
-of default=nokey=0:noprint_wrappers=1 'video_file'
```

此时，得到的 bit_rate 的单位是 b/s，因为为了方便，我们把该码率转换为了 Mb/s：

```C
bit_rate = bit_rate / 1024 / 1024;
```

忽然有一天，我们的用户反馈，平台返回的码率结果和 `ffprobe` 的结果不一致。具体表现如下所示：

```
Stream #0:0(und): Video: hevc (Main) (hvc1), 3492 kb/s, ...
    ...
bit_rate=3492451 ==> 3.33 Mb/s
```

平台返回 3.33 Mb/s x 1024 = 3410 kb/s，而 `ffprobe` 返回的则为 3492 kb/s。

<!--more-->

## 问题追查
都是 `ffprobe` 返回的数据，为什么单位转换之后结果不一致呢了？带着这个问题，我咨询了音视频处理的同事，同事达复说：

```
在 FFMpeg 中，kb 就是 1000 bit 的意思，b 转换到 kb 是 /1000 而不是 /1024。
```

从 [libavcodec/avcodec.c](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/avcodec.c) 中的 avcodec_string() 所定义的码率信息打印操作的代码可以知道，在 FFMpeg 中，1kb 的确为 1000 bit。 

```C
bitrate = get_bit_rate(enc);
if (bitrate != 0) {
    av_bprintf(&bprint, ", %"PRId64" kb/s", bitrate / 1000);
} else if (enc->rc_max_rate > 0) {
    av_bprintf(&bprint, ", max. %"PRId64" kb/s", enc->rc_max_rate / 1000);
}
```

印象中，在学校的时候老师就告诉我们：
> 1024B = 1KB，1024KB = 1MB，1024MB = 1GB，……

翻阅2017 年出版的 [《计算机文化基础》](https://item.jd.com/10046467986315.html) 的 **1.2.2 计算机中的单位** 章节中写到：
> 字节（Byte，缩写为 B）是计算机存储信息的最基本单位。1 个字节用 8 位二进制数表示。
> 
> 存储空间容量的单位除了用字节表示以外，还从小到大依次可以用千字节（KB）、兆字节（MB）、吉字节（GB）、太字节（TB）等表示。它们之间每一级别的换算关系为 1024 倍，也就是说 1KB 相当于 1024B，其他单位以此类推。

为什么到了 FFMpeg 这里，1 kb 就等于 1000 b 了呢？

## kb and Kib
维基百科对码率的解释如下：
> The bit rate is expressed in the unit bit per second (symbol: bit/s), often in conjunction with an SI prefix such as kilo (1 kbit/s = 1,000 bit/s), mega (1 Mbit/s = 1,000 kbit/s), giga (1 Gbit/s = 1,000 Mbit/s) or tera (1 Tbit/s = 1,000 Gbit/s).
> 
> When quantifying large or small bit rates, SI (International System of Units) prefixes (also known as metric prefixes or decimal prefixes). 
>
> Binary prefixes are sometimes used for bit rates. The International Standard (IEC 80000-13) specifies different abbreviations for binary and decimal (SI) prefixes (e.g. 1 KiB/s = 1024 B/s = 8192 bit/s, and 1 MiB/s = 1024 KiB/s).

在 SI 中，基于 10 进制定义了各缩写字母的含义：
* k：$10^3$
* M：$10^6$
* G：$10^9$
* T：$10^{12}$
* P：$10^{15}$

在二进制领域中，使用“k”（kilo-）、“M”（mega-）、“G”（giga-）等缩写符号会引起严重的混淆，因此在 1999 年 1 月，国际电工委员会（IEC）在 [IEC 60027-2](https://webstore.iec.ch/publication/12253) 中引入了“kibi-”、“mebi-”、“gibi-”等词头以及缩写符号“Ki”、“Mi”、“Gi”等来明确说明二进制计数。

因此：
* $1Gb = 10^{3}Mb = 10^{6}kb = 10^{9}b$
* $1Gib = 2^{10}Mib = 2^{20}Kib = 2^{30}b$

所以，在 FFMpeg 中，当码率需要转换为 kb/s 单位时，采用了 **(b/s) / 1000** 的操作。

## 必须关注Kib制带来的差别
在 Linux 或者 Mac 中，已经采用了 IEC 引入了 KiB、MiB 等单位。例如，我们可以查看下 `du` 命令的帮助文档：

```
$ man du
  ...
  -h      “Human-readable” output.  Use unit suffixes: Byte, Kilobyte, Megabyte, Gigabyte, Terabyte and Petabyte based on powers of 1024.
  --si    “Human-readable” output.  Use unit suffixes: Byte, Kilobyte, Megabyte, Gigabyte, Terabyte and Petabyte based on powers of 1000.
  ...
```

如果我们查看 Mac 系统中的文件简介的时候，我们也会发现 Mac 是采用了 SI 来表示单位转换的。
![](2.jpg)

因此，后续在使用相关命令的时候，务必需要查看对应的文档，以确认该命令的输出是基于 SI 还是基于 IEC。

## 结语
$$
1kb \ne 1024b
$$

$$
1Kib = 1024b
$$

是时候更新我们的知识库了~

