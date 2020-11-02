---
title: 一场关于FLV是否要支持HEVC的争论
reward: false
top: false
date: 2020-10-29 19:54:11
categories: 
  - 视频技术
tags:
  - 直播
  - hevc
  - flv
---

> 前几天，在浏览FFMpeg的Trac时，发现了一个希望[**FFMpeg增加*让FLV支持HEVC编码***](https://trac.ffmpeg.org/ticket/6389)的需求。
> 
> 这个需求是2017年提交到FFMpeg社区的，从整个交流过程可以看出，需求提出者和FFMpeg的社区维护者对这个需求的分歧较大，从中也能看出一些工作思路和工作文化上的差异。看完整个讨论过程，感触还是比较深的，所以想写一篇文章来记录一下自己的感触。

![](1.png)

<!--more-->

## 整个需求讨论的大概过程
* **提议发起**：目前HLS和TS都已经支持H265了，但是国内大部分CDN更多采用的是RTMP/HTTP-FLV格式。并且，因为HLS的延迟比较高，因此国内大部分直播业务采用的都是RTMP/HTTP-FLV格式。所以，该ISSUE的发起者就想问一下FFMpeg社区是否有计划让FLV支持HEVC。
* **FFMpeg社区回复**：不得不说，社区的回复还是很快的。在需求提出20分钟后，有人回复了。大概意思就是：并不是不能让FLV支持HEVC，只是因为Adobe没有对FLV支持HEVC做出具体说明。因此，如果Adobe不扩展标准，FFMpeg是不会让FLV支持HEVC的。同时，社区还提出了一些备选的解决方法。
* **针对延迟的争论**：接下来就是双方针对直播流延迟的争论了。一方认为可以对HLS或MPEG-DASH做一些优化来降低延迟，一方认为HLS不可能达到1-3秒的延迟，基本上接下来的讨论就是在讨论延迟了。因为RTMP/HTTP-FLV的低延迟已经国内CDN厂商的完美支持，因此，还是希望FFMpeg能让FLV支持HEVC。并且，有好多评论也在支持这个需求。确实，在2017年，尤其是在国内，对于直播业务而言，能让FLV支持H265真的是一件非常值得激动的事。
* **社区强烈反对**：在众多支持该需求的评论之后，FFMpeg直接关闭了这个提议，并且将该提议置为了`invalid`状态。
  * 这些是马甲账号的灌水评论，这些评论对于FFMpeg是否实现该提议没有任何作用。
  * 只要Adobe不升级FLV的标准，FFMpeg就不会让FLV支持HEVC。
  * 不管怎么样，FFMpeg都不会支持这种定制的需求。

因此，一直到现在，3年过去了，FFMpeg也没有实现在FLV中支持HEVC的特性。因此，直到如今，在直播业务中，也都无法使用社区版本的FFMpeg实现：在FLV格式中传输H265的直播流。

所幸的[**金山云实现了FFMpeg的*hack*版本**](https://github.com/ksvc/FFmpeg/tree/release/3.4)，从而让RTMP/HTTP-FLV协议支持了HEVC编码。因此，即使标准的解码器（播放器）无法播放金山云的*hack*版本生成的RTMP/HTTP-FLV的H265直播流，但是，金山云实现的这个私有的协议也基本上成为了国内直播相关业务的标准协议了。

## 协议/标准先行，还是实现先行？
> 11:6 耶和华说，看哪，他们成为一样的人民，都是一样的言语，如今既作起这事来，以后他们所要作的事就没有不成就的了。
> 
> 11:7 我们下去，在那里变乱他们的口音，使他们的言语彼此不通。
> 
> 11:8 于是，耶和华使他们从那里分散在全地上。他们就停工，不造那城了。
> 
> 11:9 因为耶和华在那里变乱天下人的言语，使众人分散在全地上，所以那城名叫巴别（就是变乱的意思）。
> <div align="right">——《圣经·创世纪》</div>

如今，生产社会化程度越来越高，技术要求越来越复杂，生产协作越来越广泛。许多技术和产品，往往涉及几十个、几百个甚至上万个企业，这客观上要求：必须在技术上使生产活动保持高度的统一和协调。此时，必须通过制定和执行技术标准使各生产部门和企业内部各生产环节有机地联系起来，保证生产有条不紊地进行。没有标准、协议，就无法有效的实现社会化大生产。

纵观整个计算机行业，无论哪个领域，无论是网络通信还是编解码协议，都是协议先行。私有协议的推广，也是先从标准化开始，然后才推动具体实现。否则，行业内就无法达成共识，否则，整个网络的互联、互通也就无从谈起。因此，必须是标准、协议先行。

另一个方面，标准、协议是具体实现的抽象，没有接口的定义，哪里来的接口的实现呢？当然，也可以从具体的实现中抽取接口，但是我们必须意识到，在接口抽取之前，这个实现相当于是私有的。

因此，FFMpeg社区拒绝让FLV自持HEVC是合理的。否则，我们的工作就会充斥着各种FFMpeg的*hack*版本，并且每个*hack*版本都是用来解决不同的问题。这真是一件非常恐怖的事情。

兵马未动，粮草先行。如果真的想让事情变的更便捷，最好的方式就是优先推动标准或协议的升级。

我见到过很多次较为严重的线上问题，其根本原因就是上下游之间没有一个定义良好的协议，导致升级过程出现了[破坏性修改](/monolith-to-microservices/docs/Breaking_Changes.html)，进而导致问题的发生。

## 组织文化优先还是用户需求优先？
不同的社区有不同的文化。组织的文化会使得当出现问题的时候，组织内所有成员对该问题的应激反应都是一致的，这种应激反应是无需请求上级就可以作出的。从[提议](https://trac.ffmpeg.org/ticket/6389)中可以看出，FFMpeg社区的文化之一是：编解码器要针对标准和规范来实施。

如果阅读FFMpeg的源码，其实也能发现很多如下的代码：
```c++
enum {
    // 7.4.3.1: vps_max_layers_minus1 is in [0, 62].
    HEVC_MAX_LAYERS     = 63,
    // 7.4.3.1: vps_max_sub_layers_minus1 is in [0, 6].
    HEVC_MAX_SUB_LAYERS = 7,
    // 7.4.3.1: vps_num_layer_sets_minus1 is in [0, 1023].
    HEVC_MAX_LAYER_SETS = 1024,

    // 7.4.2.1: vps_video_parameter_set_id is u(4).
    HEVC_MAX_VPS_COUNT = 16,
    // 7.4.3.2.1: sps_seq_parameter_set_id is in [0, 15].
    HEVC_MAX_SPS_COUNT = 16,
    // 7.4.3.3.1: pps_pic_parameter_set_id is in [0, 63].
    HEVC_MAX_PPS_COUNT = 64,

    // A.4.2: MaxDpbSize is bounded above by 16.
    HEVC_MAX_DPB_SIZE = 16,
    // 7.4.3.1: vps_max_dec_pic_buffering_minus1[i] is in [0, MaxDpbSize - 1].
    HEVC_MAX_REFS     = HEVC_MAX_DPB_SIZE,
    
    // ...
};
```

因此，社区不同的人对该提议的意见都是一致的。即便这个用户需求再合理，即便这个需求有多少用户支持，只要是标准不更新，FFMpeg永远都不会支持。

另外，用户只是需要一种能够支持H265编码的、CDN又支持良好的、延迟又非常低的视频流媒体格式而已，不是吗？如果真的有这种格式，让FLV支持HEVC是否就不是一个问题了呢？既然，Adobe已经停止了对RTMP的维护了，那么为什么还要花时间在这个协议上呢？为什么不选择更新的技术呢？虽然选择新的技术意味着需要冒更大的风险和花费更多的成本。

尤其是当不同的用户需求之间存在冲突，如何处理？To be or not to be,that's a question!

## 对于技术，是向前看还是回头看？
“始生之物，其形必丑”。但是，新技术必然会取代旧技术，从根本上说是因为：
* 新技术具有新的结构和功能，能适应已经变化了的环境和条件
* 新技术是对旧技术的扬弃，并添加了旧技术所不能容纳的新内容

因此，对于技术而言，我们需要向前看，需要去了解这些新技术。当然，采用新技术肯定是要付出一定代价的，没有不付出就会有的收获。需要深入研究新技术和我们业务之间的差距，然后在业务的实践中不断完善新的技术。

另外，在了解新技术时，还要了解新技术的历史，了解在新技术是基于什么历史背景而产出的，是用于解决什么问题的？这些东西，是新技术的应用根本，只有深入了解了这些，才能在后续的应用中，得心应手。错误的应用新技术产生的问题比正确的使用旧技术要大的多。

例如在HTTP2的协议中，有这样的描述：
> HTTP/2 addresses these issues by defining an optimized mapping of HTTP's semantics to an underlying connection. Specifically, it allows interleaving of request and response messages on the same connection and uses an efficient coding for HTTP header fields. It also allows prioritization of requests, letting more important requests complete more quickly, further improving performance.

在HTTP3中，有如下的描述：
> HTTP/2 introduced a binary framing and multiplexing layer to improve latency without modifying the transport layer. However, because the parallel nature of HTTP/2’s multiplexing is not visible to TCP’s loss recovery mechanisms, a lost or reordered packet causes all active transactions to experience a stall regardless of whether that transaction was impacted by the lost packet.
> 
> The QUIC transport protocol incorporates stream multiplexing and per-stream flow control, similar to that provided by the HTTP/2 framing layer. By providing reliability at the stream level and congestion control across the entire connection, it has the capability to improve the performance of HTTP compared to a TCP mapping. 

![](../2.jpg)

就像上图的“乌鸦喝水”一样，是采用吸管呢？还是对原有的石头进行各种改进呢？

后来，在网上找到了又拍云的一篇[《如何将HLS延时缩短至4秒，HLS+技术详解》](https://www.cnblogs.com/upyun/p/7053150.html)的一篇文章。



