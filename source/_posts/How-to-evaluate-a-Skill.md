---
title: 如何评估 Skill？
reward: false
top: false
date: 2026-06-12 13:33:23
authors:
categories:
  - LLM
tags:
  - Skill
  - 评估
---

![](skills.png)

[对 Agent Skills 的认知与思考](/2025/12/24/Reflections-on-Agent-Skills/) 这篇文章对 Agent Skills 做了详细的介绍。在 Anthropic 发布 Agent Skills 的 8 个月后，Agent Skills 已经成为了一种共识的 Agentic 构建范式。[Skills Marketplace](https://skillsmp.com/) 平台已经托管了 172W+ 的 Agent Skills；而在年初红极一时的 OpenClaw 的 [ClawHub](https://clawhub.ai/skills) 平台也已经托管了 7W+ 的 Agent Skills。在我们内部，也已经积累了成千上百的 Skills。

<!--more-->

随着 Agent 加载的 Skills 越来越多，我们却发现 Skills 之间开始出现相互冲突与干扰的现象，这导致 Agent 的表现变得更不可控，Agent 的调试变得更复杂……

同时，当我们更新了 Agent 系统中的某个 Skill 之后，我们无法判断当前的更新是否会影响该 Skill 的原有功能，我们甚至无法判断 Skill 是否真的做了优化。

**于是，我们认为，Skill 的快速评估与测试是保障 Agent 系统可控的必要手段。**

## 重新认识 Skill
Anthropic 的官方文档 [*Extend Claude Code*](https://code.claude.com/docs/en/features-overview#extend-claude-code)[^1] 对相关概念之间的区别进行了如下的、详细阐述：

!!! note "核心概念"
    * Skills add reusable knowledge and invocable workflows
    * Subagents run their own loops in isolated context, returning summaries

    Skills are the most flexible extension. A skill is a markdown file containing knowledge, workflows, or instructions. You can invoke skills with a command like /deploy, or Claude can load them automatically when relevant. **Skills can run in your current conversation or in an isolated context via subagents.**

在如上的描述中，Skills 就是：
* 可复用的知识
* 可调用的工作流

“invocable workflows” 这是一个极具诱导性的描述，这会让人们误以为 Skills 是可以独立操作的单元。

然而，“invocable workflows” 是“能够按需触发并自动执行的一套结构化操作步骤”，是“被封装好的行动方案”，仅此而已。“invocable workflows” 赋予了 Agent “怎么做”的能力。而具体的执行最终还是由 Agent 按照 “invocable workflows” 中描述的既定路线与外部世界交互而完成。

此处的 “invocable” 更合理的理解是可以被 Agent 而调用，而不应该理解为独立的运行单元。即便是存在可执行的 `scripts` 脚本的 Skill 而言，真正的运行顺序也是：Agent 按照 Skills 中的描述来调用指定的 `scripts` 脚本。Skill 本身并不能自主执行，必须由 Agent 在真实环境中按照其定义的流程来执行。

```bash
my-skill/
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates, resources
└── ...               # Any additional files or directories
```

如果从如上的描述来看待 “invocable workflows”，那么 “invocable workflows” 其实就是一种特殊形式的知识。

## 重新认识知识
谷歌发布的 [Context Engineering: Sessions & Memory](https://www.kaggle.com/whitepaper-context-engineering-sessions-and-memory)[^2] 白皮书中的 *Types of information* 这一节，对知识进行了分类：

!!! note "Types of information"
    Beyond their basic structure, memories can be classified by **the fundamental type of knowledge** they represent. This distinction, crucial for understanding how an agent uses memories, separates memory into two primary functional categories derived from cognitive science: **declarative memories** (“knowing what”) and **procedural memories** (“knowing how”).

    * **Declarative memory** is the agent's knowledge of facts, figures, and events. It's all the information that the agent can explicitly state or "declare." If the memory is an answer to a "what" question, it's declarative. This category encompasses both general world knowledge (Semantic) and specific user facts (Entity/Episodic).

    * **Procedural memory** is the agent's knowledge of skills and workflows. It guides the agent's actions by demonstrating implicitly how to perform a task correctly. If the memory helps answer a "how" question—like the correct sequence of tool calls to book a trip—it's procedural.

从这个层面来看，“invocable workflows” 其实就是 **Procedural Knowledge**，是一种存储了操作步骤、执行流程、动作技能等知识的程序性知识。

!!! note "Skills 更是结构化的知识"
    Skills 不仅是程序性知识，Skills 更是用一种特殊的结构化方式将 “invocable workflows” 封装起来，通过这一结构化方式，极大提升了 Agent 检索知识的效率和性能。

## Agent VS. Skills
因此，我们不但需要重新认识 Skills，还需要重新认识 Agent 与 Skills 之间的关系。

![](2.jpg)

## Agent VS. Skills VS. Knowledge
而 Agent、Skills、Knowledge 三者之间的关系如下所示：

![](1.jpg)

## 参考文献
[^1]: [Extend Claude Code](https://code.claude.com/docs/en/features-overview#extend-claude-code)
[^2]: [Context Engineering: Sessions & Memory](https://www.kaggle.com/whitepaper-context-engineering-sessions-and-memory)
