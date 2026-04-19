---
title: 'I use harness engineering to help me translate books'
date: 2026-04-13 16:00:00
categories:
  - LLM
tags:
  - Gemini CLI
  - Harness Engineering
  - Translation
  - Prompt Engineering
---

翻译一本书，往往意味着与“颗粒度焦虑”的长期搏斗：长文本导致的上下文丢失、术语在不同章节的不一致、风格的漂移……面对这些问题，我们通常的反应是“加大上下文窗口”或者“寻找更强的模型”。

但其实，我们可以换一种思路——**Harness Engineering（编排工程）**。

<!--more-->

## 引言：不仅仅是翻译

Harness Engineering 的核心不在于依赖模型本身有多强大，而在于通过工具链的“微调”，将大任务切分成一个个原子化的翻译单元。通过将翻译过程工程化，我们不再是被动等待 LLM 输出结果的受众，而是成为整个翻译工作流的编排者。

## System Prompt 编排：翻译的“基石”

一个好的翻译工作流，其基石是结构化的 System Prompt。不要仅仅告诉模型“翻译这段话”，你需要通过结构化的约束来定义语境。

以下是我在实际使用中构建的 System Prompt 核心架构：

```markdown
# Role
你是一位资深的专业图书翻译专家，擅长中英文互译，语感自然、专业。

# Constraints
- 术语一致性：严格遵守【术语表】要求。
- 风格一致性：保持学术/商业风格，避免过度意译或直译。
- 上下文：根据所提供的【书籍背景】进行翻译。

# Terminology
- Term A: [Definition]
- Term B: [Definition]

# Workflow
1. 分析原文意图
2. 匹配术语库
3. 输出翻译片段
```

通过这种方式，模型在处理每一段文本时，都带有一套预设的“心智模型”，极大地降低了术语漂移的概率。

## Gemini CLI 的实战工作流

我利用 Gemini CLI 将整个翻译过程自动化，其核心流程概括为：**分片（Chunking） -> 调用（Execution） -> 校对（Feedback）**。

### 1. 分片（Chunking）
不要试图一次性翻译整个章节。利用简单的脚本，将书籍的 Markdown 文件按段落或固定字符数（如 2000 字）切分为小文件。

### 2. 调用（Execution）
使用 Gemini CLI 的单任务执行模式，将 System Prompt 与分片文件结合：

```bash
# 示例：通过参数注入 System Prompt 并执行翻译
gemini-cli generate --system-prompt "path/to/system_prompt.md" --input "chapter1_part1.md" > "chapter1_part1_translated.md"
```

这种单命令调用的原子化模式，让我可以随时针对某一特定片段的翻译效果进行微调，而不影响整体进度。

## 总结：从人工到工程化的跨越

Harness Engineering 带给我的最大感触是：**翻译不再是凭灵感的创作，而是可复现、可调优的工程产出。**

通过将翻译过程工具化、模块化，我们不仅解决了长文本翻译的质量一致性问题，更重要的是，当 Prompt 模板一旦固定，整个翻译效率便呈指数级增长。这或许就是 AI 时代，我们作为工程师参与文字创作的全新姿势。
