---
title: 'Sora——AGI 漫漫长夜中的星光'
reward: false
top: false
date: 2024-02-22 09:36:09
authors:
categories:
  - LLM
tags:
  - TTV
  - CG
  - AGI
  - 文生视频
---

![](1.jpg)

> Prompt: 一位时尚的女士漫步在东京的街道，街道上充满了温暖的霓虹灯和生动的城市标志。她穿着黑色皮夹克、红色长裙和黑色靴子，手里拿着一个黑色钱包。她戴着太阳镜，涂着红色的口红。她走路自信而随意。街道潮湿且反光，形成了彩色灯光的镜面效果。街道上，许多行人走来走去。

2024 年，2 月 16 日，农历的大年初七，当我们还沉浸在春节假期的团聚与欢乐时，大洋彼岸的 OpenAI 突然发布了轰动科技街的最新研究成果——Sora。利用如上的 `提示词`，Sora 可以生成较高画质的、非常逼真的、长达一分钟的视频。就像当时 ChatGPT 发布一样，Sora 的发布又一次引爆了技术大讨论。正如 Sora 的开发者 Bill Peebles 所说的那样：Sora 令他们非常兴奋，他们可以通过模拟一切来不断地追求 AGI。[^billpeeb]

> we're pumped about pursuing AGI by simulating everything! 

<!--more-->

## Sora 的流行趋势
* 自从 Bill Peebles 在 X 上发布 Sora 生成的视频以来，该帖子已经超过 19W 的浏览量。
* 如果在各大平台搜索 Sora，我们也会发现相关的文章、视频如雨后春笋般在暴增。
* 在 Sora 发布的 4 天内，中信建投、国泰君安、申万宏源、招商证券等 10 家券商在研报中均表示，Sora 是人工智能发展进程中的里程碑，预示 AGI（人工通用智能）将加速到来，众多行业将迎来颠覆式变革[^cctv_sora]。
* 2 月 19 日，央视财经频道的《天下财经》栏目也对 Sora 的爆火进行了报道[^cctv_2]。
* 对 Sora 的讨论依然在持续火热中……

通过谷歌趋势我们发现，在 Sora 刚发布的 1 个小时以内，Sora 的搜索热度就开始突增。对于国内的热度曲线，我们会发现一个比较有趣的地方：即便在凌晨，即便此时的搜索热度在下降，但是搜索的热度依然没有下降至 0。即便在夜深人静的时刻，仍然有很多人在跟踪新的事物，这也从侧面反映出 Sora 的发布所带来的影响。

![Sora 的谷歌搜索热度趋势](sora_google_trend.png)

从分城市的热度趋势能看到，中国、印度、美国、欧洲区的相关城市的搜索热度相对较高，并且北京、杭州、深圳的热度进到了热度城市的 TOP5，足见国内对 Sora 的关注度。

![Sora 的分城市搜索热度趋势](sora_hot_city.png)

根据热搜引擎提供的微博热搜历史数据，在 Sora 发布的当天早上 9 点的时候，在大洋彼岸已经沸腾了 6 个小时之后，Sora 也初次登上了微博热搜榜，并且之后的几天里一直在榜。

![Sora 登上微博热搜榜](Sora_weibo_hot_search.png)

受到 Sora 发布的影响，Adobe 股价 2 月 16 日暴跌 7% 以上，创 2023 年 11 月 1 日以来的新低，市值在短短一个交易日内就蒸发了近 198 亿美元。

![Abode 股价趋势](adobe_stock.png)

## Sora 的能力
目前网络上已经有很多人从产品、技术等不同的层面对 Sora 进行了详细的分析，这些内容可以很方便的从网络中获取。即便如此，也建议大家认真阅读 OpenAI 官方发布的 Sora 介绍（Creating video from text[^sora_homepage]）和 Sora 的技术文档（Video generation models as world simulators[^sora_tr]）。

OpenAI 官方发布的 [Sora 介绍页面](https://openai.com/sora) 描述了 Sora 可以提供的能力及其当前存在的问题，同时还提供了 48 个 由 Sora 生成的视频。

{% bilibili 1950695804 %}

### 更高的时长
Sora 可以生成长达 1 分钟的视频，而传统的文生视频模型生成的视频的平均长度则只有 4 秒，从时间上看，Sora 已经是一个非常大的突破。同时，在长达 1 分钟的视频中，Sora 还能持续维持视频画质并遵循用户提示词中给出的指令，这一点也让人惊叹。目前的短视频时长大概也就在 10S ~ 1 Min 左右的样子，而微短剧的时长也就在 2Min ~ 5 Min，因此，从视频时长和指令遵循这两点看，Sora 对整个视频行业带来了非常有想象力的空间。

### 更好的物理规律模拟能力
Sora 能够生成复杂场景的视频，这些复杂场景可以具有多个角色、特定类型的运动、具备精确细节的主体和背景。Sora 不仅了解用户在提示词中的要求，还了解这些实体在物理世界中是如何存在的——他们之间的关系是怎样的、他们会如何互动、他们之间的互动会产生怎样的反馈……

### 更多的镜头表现能力
Sora 对自然语言有着深刻的理解，这使其可以准确地解释用户输入的提示词，并生可以表达丰富情感的、逼真的角色。在一次生成的这个视频中，Sora 可以创建多个镜头，并可以在不同的镜头中保持角色和视觉风格的一致。视频是由镜头构成的，镜头是视频展现其背后人文特性的基本语言。电影《疯狂的赛车》共有 2400 个镜头，平均镜头时长为 2.5S，《让子弹飞》共有 4000 个镜头，其平均镜头时长为 1.92 S。从平均镜头时长看，Sora 生成的视频中可以包含多达 30 个镜头，这足以让生成的视频具备更丰富的表现能力。

{% vjs2 
"video=https://cdn.openai.com/sora/videos/tokyo-walk.mp4" "autoplay" "poster=/2024/02/22/Sora-the-starlight-in-the-long-night-of-AGI/1.jpg"
%}

如上的视频将 Sora 的优势体现的淋漓尽致，当我第一次见到这个视频的时候，我也被视频的逼真程度惊掉了下巴。
* 对光影的模拟，对主角和背景人物的处理都表现的非常逼真。
* 对采用“跟”镜头的方式来拍摄主角的镜头运动方式和轨迹也非常真实。
* 当路边的广告牌跟随者镜头的运动逐渐出现，并从近景慢慢变为远景的时候，广告牌上的字体也慢慢变得模糊，并且在这个过程中视频丝毫没有出现跳跃。
* 在视频的第 36S 处，视频从全景镜头丝滑切换到了特写镜头，墨镜的反光效果、脸部皮肤、头发的效果、主角的表情更是相当逼真。


## Sora 的不足
从目前 Sora 生成的视频来看，即便 Sora 已经令我们相当兴奋，但是也依然存在很多不足。所有的这些不足，OpenAI 在其官方介绍页面也都给了对应的生成视频，并且给出了对应视频中存在的问题。
* 对于某些复杂的场景，Sora 很难准确模拟这些复杂场景的物理特性，也可能无法理解这些场景中存在的对象之间的因果关系。例如：
    * 一个人咬了一口饼干，但是饼干可能没有咬痕
    * 一个人在吹生日蛋糕上的蜡烛，但是蜡烛的火焰却没有熄灭
* Sora 还可能会混淆用户提示词中的空间细节（混淆左右）。

{% vjs2 
"video=https://cdn.openai.com/sora/videos/grandma-birthday.mp4" "autoplay" "poster=/2024/02/22/Sora-the-starlight-in-the-long-night-of-AGI/2.jpg"
%}

## Sora 的思考

## 参考文献
[^billpeeb]: [Sora is here!](https://twitter.com/billpeeb/status/1758194105111269697?s=20)
[^cctv_sora]: [Sora 爆火 96 小时](https://news.cctv.com/2024/02/20/ARTINzD0eOR0jQxxVZxibLQT240220.shtml)
[^cctv_2]: [新模型 Sora 爆火，OpenAI 估值不到 10 个月增加近两倍](https://www.toutiao.com/article/7337293210861388303/)
[^sora_homepage]: [Creating video from text](https://openai.com/sora)
[^sora_tr]: [Video generation models as world simulators](https://openai.com/research/video-generation-models-as-world-simulators)
[^DiTs]: [Scalable Diffusion Models with Transformers](https://arxiv.org/abs/2212.09748)
[^dm]: [一文弄懂 Diffusion Model](https://mp.weixin.qq.com/s/rGyX0w43EifuK781i3NmHw)
