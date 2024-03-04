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
* 自从 Bill Peebles 在 Twitter 上发布 Sora 生成的视频以来，该帖子已经超过 19W 的浏览量。
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

我们之所以感觉到 Sora 生成的视频如此的逼真，是因为 Sora 不仅仅是在操作像素、图形，而是在慢慢的学习物理世界的规律。就像 ChatGTP 通过大量的数据来理解人类语言体系一样，Sora 正在通过大量的视觉数据来理解物理世界的法则——视觉数据中的信息是对真实物理世界的映射，这才是 Sora 最令人惊奇的地方。

Sora 可以理解画面，理解画面上的角色和实体，并理解实体之间的相互关系和物理规律。ChatGPT 通过理解人类语言实现了 AI 和人的互动，Sora 通过理解物理世界则可能会实现 AI 和世界的互动，这是既 ChatGPT 以来， AGI 道路上的又一座里程碑。

正如 OpenAI 在 Sora 技术报告中所说的那样[^sora_tr]：
> Our results suggest that scaling video generation models is a promising path towards building general purpose simulators of the physical world.

也正如 OpenAI 在其使命和愿景中所说的那样[^openai_about]：
> Our mission is to ensure that artificial general intelligence—AI systems that are generally smarter than humans—benefits all of humanity.


## Sora 的不足
从目前 Sora 生成的视频来看，即便 Sora 已经令我们相当兴奋，但是也依然存在很多不足。所有的这些不足，OpenAI 在其官方介绍页面也都给了对应的生成视频，并且给出了对应视频中存在的问题。
* 对于某些复杂的场景，Sora 很难准确模拟这些复杂场景的物理特性，也可能无法理解这些场景中存在的对象之间的因果关系。例如：
    * 一个人咬了一口饼干，但是饼干可能没有咬痕
    * 一个人在吹生日蛋糕上的蜡烛，但是蜡烛的火焰却没有熄灭
* Sora 还可能会混淆用户提示词中的空间细节（混淆左右）。

{% vjs2 
"video=https://cdn.openai.com/sora/videos/grandma-birthday.mp4" "autoplay" "poster=/2024/02/22/Sora-the-starlight-in-the-long-night-of-AGI/2.jpg"
%}

## Sora 的相关技术
在 Sora 的技术文档 [Video generation models as world simulators](https://openai.com/research/video-generation-models-as-world-simulators) 中，OpenAI 介绍了 Sora 模型的能力和用到的相关技术，但是对于 Sora 模型的具体技术细节并没有进行过多的披露。
* 把 Visual Patches 作为 Visual Tokens，进而统一了文本、图像、视频的生成式模型架构。不过 Visual Tokens 并非是 OpenAI 的原创，而是借鉴了谷歌的 magvit[^magvit] [^magvit_paper] 的思路。
* Diffusion Models，正如技术报告中所述：*Sora is a diffusion model, given input noisy patches (and conditioning information like text prompts), it’s trained to predict the original “clean” patches. **Importantly, Sora is a diffusion transformer.*** 而这个技术最初是由 Bill 和 谢赛宁在论文 [Scalable Diffusion Models with Transformers](https://arxiv.org/abs/2212.09748)[^DiTs] 提出的。这也导致当 Sora 刚发布的的时候，网上有自媒体误传 Sora 的作者是 谢赛宁的乌龙事件，之后 谢赛宁也在 Twitter 上对此作了解释和回应。
* Autoregressive Transformers，为了让 DiT 支持自回归 Diffusion，Sora 借鉴了谷歌在 [Photorealistic Video Generation with Diffusion Models](https://arxiv.org/abs/2312.06662) 中提到的 W.A.L.T 方案。

更多的技术解读可以参考红博士的 [去魅 Sora: OpenAI 鲜肉小组的小试牛刀](https://mp.weixin.qq.com/s/H8UYQ27nNPbW2jetseJgYQ)，此处不再一一介绍。

微软研究院和理海大学的研究者根据已发表的技术报告和逆向工程，首次在论文 *Sora: A Review on Background, Technology, Limitations, and Opportunities of Large Vision Models* 中全面回顾了 Sora 的背景、相关技术、新兴应用、当前局限和未来机遇[^sora_wr]。

## Sora 的思考
所以，整体上看 Sora 并没有发明新的技术，只是对原有技术的整合而已。但是这恰恰是我们该认真思考的最重要的点。都是原有的技术，这些技术论文也都是公开的，为什么在 Sora 之前，却没有出现如此惊艳的 TTV 效果呢？单纯的技术拼凑可以拼凑出类似 Sora 的突破性产品吗？同样是用乐高的零件，为什么有的大牛就能[用 84000 片乐高拼成宏伟的紫禁城呢](https://zhuanlan.zhihu.com/p/336748815)，而有些人离开了图纸就什么也拼不出来呢？

### 鉴定的践行能力
我想，之所以是 OpenAI 首先发布了 Sora，这里面肯定是有某些特殊的原因的。在我看来 **思维方式的多样性** 以及其 **坚定的践行能力** 是非常重要的因素。

从 *A Survey on ChatGPT and Beyond*[^chatgpt] 中的大语言模型族谱中我们也能发现，GPT 在发展之初就没有采用当时自编码的主流方案，而是采用了很少有人涉足的自回归的分支，这对 OpenAI 的科研工作者而言，需要非常大的勇气和毅力。感谢 OpenAI 的大胆和魄力，我们才尽可能早的感受到了 AI 大模型的强大性能。

![大语言模型族谱](https://wangwei1237.github.io/LLM_in_Action/images/LLMTree.jpeg)

而这样的大胆，并非是匹夫之勇，而是通过不断实践、实验来不断强化对技术方向的判断。在 *Scaling Laws for Neural Language Models*[^sl] 中，他们提到：
> We study **empirical scaling laws** for language model performance on the cross-entropy loss. The loss scales as a power-law with model size, dataset size, and the amount of compute used for training, with some trends spanning more than seven orders of magnitude. Other architectural details such as network width or depth have minimal effects within a wide range. 

在 Sora 的技术文档中，我们又看到：
> We **explore large-scale training of generative models on video data**.

从 GPT 的演进历程[^gptc]我们也能感受到，从 2018 年～2022 年，在长达 5 年多的时间里，OpenAI 一步一步通过探索和实践，让大模型应该具备的相关能力一点一点的浮出水面，进入我们的视野。

实践是检验真理的唯一标准，想尽一切办法让实践边的可行：扩大数据规模，增强数据质量，扩大模型规模……

### 强大的工程能力
当不该发生的事情发生了，科学就需要登场了；当该发生的事情没有发生，工程就需要登场了。OpenAI 强大的技术整合能力和工程化能力是 Sora 可以成功的另一个因素。

虽然 Sora 用到的大部分的技术都是现成的技术，但是为了在工程上将其整合到一起从而实现 Sora 的效果，整个团队作了非常多的事情：
* 整合 DiT[^DiTs] 和 W.A.L.T[^magvit]。
* 在训练阶段，利用 GPT 给视频标注 Caption 数据，在推理阶段，利用 GPT 扩写用户输入的 Prompt，这使得 Sora 可以生成精准遵循用户指令的高质量的视频。
* 生产了足够规模、质量足够大的标注数据，做过标注的应该都可以理解到这里的难度究竟有多大。
* 提出了通用视觉数据模型，从而可以不再像之前的方法那样需要对不同的视觉数据进行特定的处理。
* ……

我们的工程能力产出了多少像下图那样的系统？

![](https://wangwei1237.github.io/2021/09/11/How-to-Read-and-Use-the-Open-Source-Projects/2.png)

在 GPT-4 的技术报告中[^gpt4_tr]，OpenAI 提到他们可以做到：在小规模的计算成本下训练出来的模型，可以准确预估到在计算成本扩大之后，模型的性能将会怎样？这对于像 GPT4 这样训练一次就要耗费几周甚至上月的大模型而言，其效率提升真的是如虎添翼。
> A large focus of the GPT-4 project was building a deep learning stack that scales predictably. The primary reason is that for very large training runs like GPT-4, it is not feasible to do extensive model-specific tuning. To address this, we developed infrastructure and optimization methods that have very predictable behavior across multiple scales. These improvements allowed us to reliably predict some aspects of the performance of GPT-4 from smaller models trained using 1, 000× – 10, 000× less compute.

所以我们讲，科学和技术决定了产品的上限，工程能力决定了产品的下限，科学和技术可以试错，但是工程能力务必讲究精益求精，唯有精益求精的工程能力才能产生足够惊艳的效果。

## 后记
随着 Sora 的爆火，越来越多的公司也开始发布新的技术：
* 2 月 22 日，Stability AI 发布了 [Stable Diffusion 3](https://stability.ai/news/stable-diffusion-3)，从其官方展示的效果看，SD3 在文字拼写、色彩协调、图片逼真度等各个方面都表现惊人。

## 参考文献
[^billpeeb]: [Sora is here!](https://twitter.com/billpeeb/status/1758194105111269697?s=20)
[^cctv_sora]: [Sora 爆火 96 小时](https://news.cctv.com/2024/02/20/ARTINzD0eOR0jQxxVZxibLQT240220.shtml)
[^cctv_2]: [新模型 Sora 爆火，OpenAI 估值不到 10 个月增加近两倍](https://www.toutiao.com/article/7337293210861388303/)
[^sora_homepage]: [Creating video from text](https://openai.com/sora)
[^sora_tr]: [Video generation models as world simulators](https://openai.com/research/video-generation-models-as-world-simulators)
[^DiTs]: [Scalable Diffusion Models with Transformers](https://arxiv.org/abs/2212.09748)
[^dm]: [一文弄懂 Diffusion Model](https://mp.weixin.qq.com/s/rGyX0w43EifuK781i3NmHw)
[^magvit]: [google-research/magvit](https://github.com/google-research/magvit)
[^magvit_paper]: [MAGVIT: Masked Generative Video Transformer](https://arxiv.org/abs/2212.05199)
[^openai_about]: [OpenAI Vision](https://openai.com/about)
[^chatgpt]: [Harnessing the Power of LLMs in Practice: A Survey on ChatGPT and Beyond](https://arxiv.org/abs/2304.13712)
[^sl]: [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
[^gptc]: [GPT 的贡献](https://wangwei1237.github.io/LLM_in_Action/llm_intro.html)
[^gpt4_tr]: [GPT-4 Technical Report](https://arxiv.org/abs/2303.08774)
[^sora_wr]: [Sora: A Review on Background, Technology, Limitations, and Opportunities of Large Vision Models](https://arxiv.org/abs/2402.17177)
