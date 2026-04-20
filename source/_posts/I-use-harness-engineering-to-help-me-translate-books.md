---
title: '用 Harness Engineering 来进行书籍翻译工作'
date: 2026-04-19 16:00:00
categories:
  - LLM
tags:
  - Gemini CLI
  - Harness Engineering
  - Translation
---

为了强化对某项特定技术的理解与实践，我经常会利用空余时间阅读并翻译该技术领域的相对较前言的英文书籍，自从 chatGPT 发布以来，翻译外文书籍越来越方便。即便如此，翻译一本书还是需要非常多的繁杂的规则，例如：交叉引用、公式编号、字体使用规范、图片引用规范、排版规范……这些规范在我翻译书籍的过程中往往占据了非常大的时间。

恰好最近在研究 Harness Engineering，突然我想：写代码与翻译在本质上不都是生成吗？Transformer 架构最初不也是为机器翻译而提出的吗？于是我就想把 Harness Engineering 的思想应用到书籍翻译上来，并依此来分析一下 Harness Engineering 的效果。

![](harness_1.png)
<!--more-->

## Harness Engineering
2026 年 2 月 5 日，Mitchell Hashimoto 在他的博客 *My AI Adoption Journey*[^4] 中提除了 Harness Engineering 这个概念。

> I don't know if there is a broad industry-accepted term for this yet, but I've grown to calling this **"harness engineering"**.
> 
> It is the idea that **anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again**. I don't need to invent any new terms here; if another one exists, I'll jump on the bandwagon.

这就是 Harness Engineering 最出的含义：当你发现 Agent 犯错的时候，需要采用系统化的方案来确保 Agent 不再犯类似的错误。

然后，Cursor、OpenAI、Anthropic 先后发布了各自在 Agent-First 软件开发上的实践报告[^1][^2][^3]。这三篇实践报告均指向了 Mitchell Hashimoto 文章中的一个术语：Harness Engineering，从而引爆了 Harness Engineering 的浪潮。

于是一个混乱的时代到来了，就像我在 [什么是微服务](/monolith-to-microservices/docs/What_Are_Microservices.html) 里提到的那样：虽然我们是在讨论同一个术语，但是实际上我们却是在讨论不同的东西。

仔细阅读 Cursor、OpenAI、Anthropic 的实践报告之后，我发现，虽然他们都提到了 Harness Engineering，虽然这三篇文章的读者群高度重叠，虽然用的术语高度一致，但各自回答的工程问题截然不同[^5]:

- 时间维度：Anthropic 研究的是如何让 Agent 更长时间的自主运行。
- 空间维度：Cursor 研究的是如何让几百个 Agent 能并行自主工作。
- 协作维度：OpenAI 研究的则是当 Agent 的产出速度远超人类的注意力时，人应该通过什么方式来控制整个系统。

后来，我想了好久，终于想通了——其实理解 Harness Engineering 可以从多个维度切入：
- 从问题空间来看：它主要解决智能体重复犯相同错误、自主运行时长有限、输出结果不符合预期等问题。
- 从解决空间来看：它为大模型系统性地构建约束空间、引导模型沿着有限路径、高效朝着预设目标推进。
- 从最终效果来看：它实现了智能体自主化、长时程、可管控的稳定运行。

所以，Harness Engineering 也可以看作是一种面向失败、面相不稳定性开发的有效实践范式。

![](harness_arch.png)

## 翻译书籍的复杂性
在 Chat 模式时，大模型可以帮助我完成从英文到中文的初步翻译过程，这个过程也就仅仅是把内容从英文变成中文，除此之外剩下的大部分的工作还需要我来处理：

- 字体样式的统一
- 交叉引用的统一
- 翻译术语的前后统一
- ……

如果涉及到数学公式，还需要做更多的工作……

**仔细分析，就会发现，这些复杂性恰好是 Harness Engineering 最开始要解决的问题**：

> 当你发现 Agent 犯错的时候，需要采用系统化的方案来确保 Agent 不再犯类似的错误

只要告诉 Agent，在翻译过程中需要遵循什么样的规范，遇到图要怎么处理、遇到公式要怎么处理、遇到交叉引用要怎么处理…… Agent 自己就可以按照这个规范生成正确的内容。

想想我自己的翻译过程，也是如此：当我间隔很长时间没有翻译的时候，在继续翻译的时候我也会翻一下之前的规则，来保障整本书的统一。Harness Engineering 只是把我脑子中的哪些规则固化下来而已，从而解决了 Agent 重复犯错的问题。

## 我的实践
为了验证我的想法，我找到了 2 年前的一个翻译项目：[ntroduction to Probability and Statistics for Engineers and Scientists(Sixth Edition)](https://github.com/wangwei1237/introduction_to_probability_and_statistics)。这本书从 2024 年 2 月开始就没有持续翻译了，也算是一个有着历史包袱的遗留项目，要在这种项目上引入 Harness Engineering 并让 Agent 继续工作下去，说实话，心里确实没底。



## 参考文献
[^1]: [Towards self-driving codebases](https://cursor.com/blog/self-driving-codebases)
[^2]: [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)
[^3]: [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)
[^4]: [My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey#step-5-engineer-the-harness)
[^5]: [Harness Engineering 在讨论什么：三个 Scaling 维度的统一框架](https://yage.ai/share/harness-engineering-scalability-20260330.html)
