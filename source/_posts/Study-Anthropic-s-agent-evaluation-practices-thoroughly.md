---
title: 深入研究 Anthropic 的 Agent 评估实践
reward: false
top: false
date: 2026-01-25 21:47:35
authors:
categories:
  - LLM
tags:
  - Anthropic
  - Agent 评估
---

![](evals_1.png)

2026 年 1 月 9 日，Anthropic 发布了一篇题为 *Demystifying evals for AI agents* [^1]的博文，详细介绍了他们在评估 Agent 方面的思考、实践和方法。恰巧，我们在 LLM 评估领域也做了一些工作，并且也遇到了很多亟待解决的问题，因此对这篇博文产生了浓厚的兴趣。于是，花了几天时间，认真研习了这篇博文，并对其中的内容进行了整理和总结。

<!--more-->

## 1. 与 Gemini-3 协同学习
在如今 LLM 能力持续突破天花板的背景下，我想，整理和总结的方式也需要做出变革。于是，这次，我们有采用文字版本的方式来呈现自己对这边博文的理解。借助谷歌的 Nano Banana Pro 生图大模型，我把我的理解整理成了图的形式来更直观的呈现我的思考和理解。

整体的思考涵盖了以下内容，每个点都对应了一张图：
* Agent 评估中的 8 大基本概念
* 3 种基本打分器
* 能力评估与回归评估的区别
* 对话 Agent 与其他 Agent 的多轮交互的区别
* 不同类型 Agent 评估设计上的差异
* 如何用 pass@k、pass^k 衡量 Agent 的不确定性
* 如何设计评估器
* 监控能力评估的饱和度的必要性
* 什么是 EDD（Evals-Driven-Development）
* 构建 Agent 评估的 9 大流程
* 如何系统化的理解 Agent 交付端到端评估

## 2. PDF 版本的思考内容
{% pdf evals.pdf %}

## 参考文献
[^1]: [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)