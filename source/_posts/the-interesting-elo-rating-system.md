---
title: 有趣的 Elo 积分系统
reward: false
top: false
date: 2023-08-12 14:14:51
authors:
categories:
  - 算法与数学
tags:
  - Elo rating
  - Chatbot Arena
---

![](1.png)

我们的 [视频质量评估系统](/2023/02/13/duzhiliao/) 可以通过众包的形式为一组视频进行主观质量打分。如果想评估两个视频编解码器的编码效果，并确定哪个编解码器更优，则可以采用我们的系统来完成。

<!--more-->

## 众包成对打分法
我们会利用不同的编解码器对相同的视频源进行编码，并得到两个视频：A（编解码器 A 的编码视频），B（编解码器 B 的编码视频）。在评估的过程中，我们的系统会隐藏编解码器的信息，并要求众包用户对两个视频的效果进行评估，以选取效果好的视频。具体的打分如下图所示：

![](2.png)

其中各选项对应的得分如下：

|选项|5分制打分|百分制打分|
|---|---|---|
| A 特好 | 1 | 0~19 |
| A 较好 | 2 | 20~39 |
| 差不多 | 3 | 40~59 |
| B 较好 | 4 | 60~79 |
| B 特好 | 5 | 80~100 |

对于每一个视频，我们都会邀请至少 10 个众包用户进行打分，我们会过滤不置信的打分并对剩余的打分进行 MOS 计算，然后将结果转换为百分制的打分（$[1,5]$->$[0,100]$）。例如，如果有5对视频，我们可能会得到如下的打分：

```
MOS_Scores = [61, 55, 54, 65, 15] 
```

根据实践，我们不能采用平均分的方式对两个编解码器效果进行评估，否则可能会存在偏差。以如上的打分为例，其平均打分为：$\mu_{MOS\_Scores}=50$，但是我们不能说两个编解码器的小姑是一致的。因为 B 对于 A 而言，其 GSB（Good/Same/Bad）分布为：40%/40%/20%。因此，对于我们的评估系统而言，我们一般用 GSB 的分布，而不是一个单一的分数来确定哪个编解码器更好。

## Chatbot Arena 
但是，事情发生了一些有趣的变化。

最近在阅读一篇大语言模型评估的综述论文——[*A Survey on Evaluation of Large Language Models*](https://arxiv.org/abs/2307.03109)，该论文中提到了由 [LMSYS Org](https://lmsys.org/) 发布的 Chatbot Arena 平台，Chatbot Arena 是一个基于 Elo 打分的大语言模型的基准平台（[Chatbot Arena: Benchmarking LLMs in the Wild with Elo Ratings](https://lmsys.org/blog/2023-05-03-arena/)）。

Chatbot Arena 平台通过众包的形式，采用匿名、随机的方式对不同的 LLMs（Large Language Models） 进行打分，然后基于国际象棋等竞技游戏中广泛使用的 Elo 积分系统对 LLMs 进行 Elo 积分计算，最终通过 Elo 积分对 LLMs 进行排序以确定 LLMs 的排名。

Chatbot Arena 每次会随机选择两个不同的大语言模型和用户聊天，并让用户在匿名的情况下判定哪款大模型产品的表现更好一些。

![](3.png)

在得到用户的匿名打分之后，Chatbot Arena 通过计算 Elo 算法来获得 LLMs 的 Elo 积分。

![](4.png)

我们可以在 [chatbot-arena-leaderboard 页面](https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard) 获取当前 Chatbot Arena 平台的 LLMs 的榜单。

## Elo rating


