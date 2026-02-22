---
title: OpenClaw 初体验
reward: false
top: false
date: 2026-02-14 16:06:56
authors:
categories:
  - LLM
tags:
  - OpenClaw
  - Clawdbot
---

![](1.jpg)

2026 年初，除了基础大模型争相斗艳之外，在技术圈，一个名叫 OpenClaw 的 个人 AI 助手火出了天际，引爆了新一轮的 Agent 热潮。OpenClaw 的核心理念是让 AI 直接接管系统的读写与执行权限，并通过 Telegram、Discord 或 WhatsApp 等 IM 软件接收自然语言指令，然后再服务器上自动执行代码编写、文件管理、收发邮件等任务。通过 IM 软件下达任务，OpenClaw 会自己分析任务，然后自动执行任务，并返回执行结果。这才是我们一直在苦苦追求的 AI 个人助理。

<!--more-->

## 什么是 OpenClaw
OpenClaw 是奥地利程序员 [Peter Steinberger](https://steipete.me/) 在 2025 年 11 月发布的开源项目。项目的最初命名为 Clawdbot，是一个能连通各种 API 和本地 Shell 的轻量级对话机器人原型。2026 年 1 月，Clawbot 在 GitHub 上突然爆火出圈，同时也顺便带火了 Mac mini，甚至有用户一口气买了 40 台 Mac mini，全部用来运行 Clawdbot。

{% twitter https://x.com/mikecantmiss/status/2015450752378908835 %}

就在 Clawdbot 爆发式增长的时候，Peter 收到了 Anthropic 的律师函：因为 Clawdbot 与 Anthropic 的大语言模型 Claude 太像，因此涉嫌商标侵权。2026 年 1 月 27 日，Peter 在 Discord 频道里召集社区成员进行头脑风暴，并最终为项目改名为 Moltbot。

![](clawdbot.png)

3 天后，Peter 觉得 Moltbot 读音感觉像是嘴里含了块石头，同时为了彻底规避未来的版权争议并彰显开源和自由的属性，再次为项目更名为 OpenClaw 并沿用至今。改名后的 OpenClaw 像火箭一样起飞：

* 1 月底：2K GitHub stars
* 2 月初：突破 100K  stars
* 2 月中旬：突破 180K  stars
* 2 月底：突破 200K stars

![](star-history-2026222.png)

2 月 4 日，Founder Park 搞了一场闭门活动，聚集了 130 多位 AI 创业者，来自 AI 游戏、AI Coding、Agent Memory、AI 硬件、AI 语音等不同赛道，分享了他们在上手用 Clawdbot 的感受和思考。[^2]

> Clawdbot 带来了一些和聊天不一样的「增量」。它的本质，是为你配了一台「云电脑」。第一次可以真正地指挥一个 AI 去增、删、改、查文件。这让 AI 从一个信息工具，变成了一个执行工具。

2 月 14 日，Peter 宣布加入 OpenAI，领导“下一代个人代理”的开发，OpenClaw 则转由开源基金会维护，确保项目永远自由和独立。[^1]

{% twitter https://x.com/steipete/status/2023154018714100102 %}

## 在 ECS 上部署 OpenClaw



 





## 参考文献
[^1]: [OpenClaw, OpenAI and the future](https://steipete.me/posts/2026/openclaw)
[^2]: [闭门探讨：130位AI创业者，对Clawdbot和下一代AI产品的39条思考](https://mp.weixin.qq.com/s/9MKq3jRNsorCVnA6vWQIDg)


