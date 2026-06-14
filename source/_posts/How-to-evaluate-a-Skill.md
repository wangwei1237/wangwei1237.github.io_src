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

![](1.jpg)

[对 Agent Skills 的认知与思考](/2025/12/24/Reflections-on-Agent-Skills/) 这篇文章对 Agent Skills 做了详细介绍。自 Anthropic 发布 Agent Skills 以来，Skills 已经逐渐成为 Agentic 系统构建中的一种共识范式。无论是公开的 Skills Marketplace、OpenClaw 的 [ClawHub](https://clawhub.ai/skills)，还是团队内部沉淀的专用能力库，Skills 的数量都在快速增长。

[Skills Marketplace](https://skillsmp.com/) 平台已经托管了 172W+ 的 Agent Skills；而在年初红极一时的 OpenClaw 的 [ClawHub](https://clawhub.ai/skills) 平台也已经托管了 7W+ 的 Agent Skills；在我们内部，也已经积累了成千上百的 Skills。

<!--more-->

随着 Agent 加载的 Skills 越来越多，我们也开始观察到一个新问题：不同 Skills 之间会发生冲突、覆盖和干扰，导致 Agent 的行为更难预测，调试成本也随之上升。

同时，当我们更新某个 Skill 之后，往往很难判断这次修改是否破坏了原有能力，也很难证明它真的带来了优化。

问题不再是“能不能写一个 Skill”，而是“能不能知道这个 Skill 什么时候有效、什么时候失效、什么时候应该回滚”。

**于是，我们认为，Skill 的快速评估与测试是保障 Agent 系统可控的必要手段。**

## 重新认识 Skill
Anthropic 的官方文档 [*Extend Claude Code*](https://code.claude.com/docs/en/features-overview#extend-claude-code)[^1] 对相关概念之间的区别进行了如下阐述：

!!! note "核心概念"
    * Skills add reusable knowledge and invocable workflows
    * Subagents run their own loops in isolated context, returning summaries

    Skills are the most flexible extension. A skill is a markdown file containing knowledge, workflows, or instructions. You can invoke skills with a command like /deploy, or Claude can load them automatically when relevant. **Skills can run in your current conversation or in an isolated context via subagents.**

在上面的描述中，Skills 就是：
* 可复用的知识
* 可调用的工作流

“invocable workflows” 是一个很容易被误读的描述：它可能让人误以为 Skills 是可以独立运行的操作单元。

但更准确地说，“invocable workflows” 是一套可被按需调用的结构化操作步骤，是被封装好的行动方案。它赋予 Agent “怎么做”的能力，而具体执行仍然由 Agent 按照工作流中描述的路线与外部世界交互完成。

此处的 “invocable” 更合理的理解是“可以被 Agent 调用”，而不是“可以独立运行”。即便某个 Skill 包含可执行的 `scripts` 脚本，真正的运行顺序也是：Agent 读取 Skill 中的说明，再按需调用指定脚本。Skill 本身不能自主执行，必须由 Agent 在真实环境中按照其定义的流程完成任务。

```bash
my-skill/
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates, resources
└── ...               # Any additional files or directories
```

如果从这个角度理解 “invocable workflows”，它本质上就是一种特殊形式的知识。

## Agent VS. Skills
因此，我们不但需要重新认识 Skills，也需要重新认识 Agent 与 Skills 之间的关系。

![](2.jpg)

正如 [*Extend Claude Code*](https://code.claude.com/docs/en/features-overview#extend-claude-code)[^1] 中所述：

!!! note "Skills and subagents solve different problems"
    * **Skills** are reusable content you can load into any context
    * **Subagents** are isolated workers that run separately from your main conversation

## 重新认识知识
谷歌发布的 [Context Engineering: Sessions & Memory](https://www.kaggle.com/whitepaper-context-engineering-sessions-and-memory)[^2] 白皮书中的 *Types of information* 这一节，对知识进行了分类：

!!! note "Types of information"
    Beyond their basic structure, memories can be classified by **the fundamental type of knowledge** they represent. This distinction, crucial for understanding how an agent uses memories, separates memory into two primary functional categories derived from cognitive science: **declarative memories** (“knowing what”) and **procedural memories** (“knowing how”).

    * **Declarative memory** is the agent's knowledge of facts, figures, and events. It's all the information that the agent can explicitly state or "declare." If the memory is an answer to a "what" question, it's declarative. This category encompasses both general world knowledge (Semantic) and specific user facts (Entity/Episodic).

    * **Procedural memory** is the agent's knowledge of skills and workflows. It guides the agent's actions by demonstrating implicitly how to perform a task correctly. If the memory helps answer a "how" question—like the correct sequence of tool calls to book a trip—it's procedural.

从这个层面来看，“invocable workflows” 其实就是 **Procedural Knowledge**，即一种用于存储操作步骤、执行流程和动作技能的程序性知识。

!!! note "Skill 与普通知识的区别"
    普通知识回答的是“是什么”，而 Skill 回答的是“怎么做”。

一个 API 文档会以普通知识的形式告诉模型接口相关信息：

```text
登录接口是 POST /api/login
请求字段包含 username、password
返回字段包含 token、expireTime
```

而一个 API 测试 Skill 则会告诉模型：

```text
当用户要求验证 API 是否符合 PRD 时，必须按照以下流程执行：
1. 读取 PRD；
2. 读取 API 文档；
3. 生成主路径、异常路径、边界路径测试用例；
4. 执行或规划 API 测试；
5. 解析测试结果；
6. 输出 api_test_report.json；
7. 失败时标记 suspected_owner，并给出 next_action。
```

Skill 本身虽然不会自主执行，但作为 **Procedural Knowledge**，它会直接影响 AI 的执行路径和输出质量。

* 如果 Skill 写得不清楚，后续 Agent 执行就会不稳定；
* 如果 Skill 的产物契约不明确，Hook 和 Workflow 就无法做自动判断；
* 如果 Skill 缺少失败处理策略，多 Agent 闭环就会在失败处停住。

## Agent VS. Skills VS. Knowledge
Agent、Skills、Knowledge 三者之间的关系如下所示：

![](ask.jpg)

!!! note "Skills 更是结构化的知识"
    Skills 不仅是程序性知识，更是对 “invocable workflows” 的结构化封装。通过这种结构化方式，Agent 可以更高效地发现、加载和使用相关知识。

## Skill 究竟要测什么？
既然 Skills 在本质上是一种特殊的知识，那么 Skill 测试的目的就不是验证“模型知道了什么”，而是验证：**Skills 提供的程序性知识能不能稳定指导模型完成一类任务。**

更进一步，Skill 测试不是“跑业务功能”，而是“测试方法是否可靠”。它的目的不是验证真实业务最终是否成功，而是验证：

* Skill 是否在正确场景下被触发；
* 模型是否理解 Skill 的执行流程；
* 输出产物是否符合约定；
* 信息缺失、失败、边界场景下是否处理合理；
* Skill 输出是否能被 Agent、Hook 或 Workflow 后续消费；
* ……

根据上面的描述，我们可以得到 Skills 测试的边界：

```text
1. 触发是否准确；
2. 流程是否完整；
3. 输出契约是否稳定；
4. 边界处理是否合理；
5. 失败信息是否可回流；
6. 是否避免幻觉和越权行为；
7. ……
```

例如，测试 `api-test-flow` Skill，不是要真的启动服务跑接口测试，而是验证模型：

```text
1. 是否会在相关 Query 下加载该 Skill
2. 是否会按照该 Skill 的要求：
    1. 读取 PRD；
    2. 读取 API 文档；
    3. 生成 API 测试用例；
    4. 规划或执行 API 测试；
    5. 解析测试结果；
    6. 输出 api_test_report.json；
    7. 失败时给出 suspected_owner 和 next_action；
```

Skills 测试更像单元测试：它可以不依赖真实业务环境，而是验证 Skill 是否能稳定提供正确的方法、步骤和约束。这与 Agent 测试不同。Agent 测试的目标是验证 Agent 是否能在真实环境中正确完成任务。

例如，测试 `coding-agent` 时，就必须准备一个代码仓库，让 `coding-agent` 修复一个明确的编译错误，并期望结果是：

```text
正确修改错误代码；
编译通过；
测试用例通过；
没有修改无关文件；
……
```

## Skills 测试规范
根据上面的描述，在 Skills 测试中，一般需要覆盖如下场景[^3]：

| 类型 | 说明 |
|---|---|
| `trigger` | 验证 Skill 是否应该触发，以及是否避免误触发 |
| `plan` | 验证 dry-run 模式下是否能给出符合 Skill 的执行计划 |
| `contract` | 验证输出产物、字段和格式是否稳定 |
| `edge` | 验证信息缺失、输入模糊、文档不完整等边界场景 |
| `failure` | 验证失败诊断、失败分类和回流策略 |

我们可以用 YAML 文件组织一个 Skill 的测试用例：

```yaml
version: "1.0"

skill:
  name: "api-test-flow"
  description: "验证 API 测试类 Skill 的触发、计划和输出契约"

cases:
  - id: "plan_001"
    type: "plan"
    title: "API 测试 Skill 应给出正确执行计划"
    query: >
      请根据 PRD 验证登录接口是否符合预期。
    inputs:
      files:
        - "examples/login_prd.md"
        - "examples/login_api_doc.md"
    expected:
      skill:
        should_use: "api-test-flow"
        should_not_use: []
      must_include:
        - "读取 PRD"
        - "读取 API 文档"
        - "生成 API 测试用例"
        - "执行或规划 API 测试"
        - "解析测试结果"
        - "输出 api_test_report"
      must_not_include:
        - "直接修改业务代码"
        - "调用 UI 验收流程"
    assertions:
      - "selected_skill == 'api-test-flow'"
```

更详细的 Skills 测试规范可以参考 [Skill Test Case Specific](/Skills-Test-Specification/)。

## Skill 测试实践

!!! note "skill-testing 介绍"
    `skill-testing` 是一个用于测试 Skill 的 Skill，具体实现参见：[https://github.com/wangwei1237/agent-skills/tree/main/skill-testing](https://github.com/wangwei1237/agent-skills/tree/main/skill-testing)。

    **该 Skill 目前仅在 Codex 中完成验证，不保证在其他 Agent 中也能正常运行。如果使用过程中遇到问题，可以提交 Pull Request 或 Issue，我会尽快处理。**

我们把上面描述的 Skill 测试规范封装到了 `skill-testing` Skill 中。你可以直接将 `skill-testing` 安装到 Codex 或 Claude Code 中，用它来测试其他 Skills。

下面继续以 [对 Agent Skills 的认知与思考](/2025/12/24/Reflections-on-Agent-Skills/)[^4] 这篇文章中的 [pdf-case-converter](https://github.com/wangwei1237/agent-skills/tree/main/pdf-lowercase-skill) 为例，展示如何使用 `skill-testing` 测试 `pdf-case-converter`。

`pdf-case-converter/tests/skill_cases.yaml` 的内容如下所示：

```yaml
version: "1.0"

skill:
  name: "pdf-case-converter"
  description: "pdf-case-converter 的测试用例"

defaults:
  mode: "dry-run"
  execution: "no_tool_call"
  output_format: "markdown"

cases:
  - id: "trigger_001"
    type: "trigger"
    title: "PDF 大小写转换场景应触发 Skill"
    query: "请把 example/test.pdf 文档中的大写英文字母转换成小写"
    inputs:
      files: []
      context: {}
    expected:
      skill:
        should_use: "pdf-case-converter"
        should_not_use: []
      must_include: []
      must_not_include: []
      artifacts: []
      routing: {}
    assertions:
      - "selected_skill == 'pdf-case-converter'"
    tags:
      - "trigger"
      - "positive"

  - id: "trigger_002"
    type: "trigger"
    title: "图片生成场景不应触发 Skill"
    query: "请生成一张夏季的海边风景的图片，并转换为 pdf 格式"
    inputs:
      files: []
      context: {}
    expected:
      skill:
        should_use: ""
        should_not_use:
          - "pdf-case-converter"
      must_include: []
      must_not_include: []
      artifacts: []
      routing: {}
    assertions:
      - "selected_skill != 'pdf-case-converter'"
    tags:
      - "trigger"
      - "negative"
```

1. 在当前 Codex 中安装 `skill-testing` 和 `pdf-case-converter` 两个 Skill。
2. 在 Codex 中输入测试提示词：请测试 skill: pdf-case-converter。
  ![](pdf_testing_1.png)
3. Codex 会根据 `skill-testing` 中的说明，加载 `pdf-case-converter/tests/skill_cases.yaml` 中的测试用例，生成 dry-run 测试响应，并对响应进行评分。
  ![](pdf_testing_2.png)
4. 最后生成测试报告。
  ![](pdf_testing_3.png)

!!! warning "注意"
    默认情况下，我们会发现 Codex 会提示：**多 agent 工具存在，但当前规则只允许在用户明确要求 sub-agent 时使用**；所以这次我会按 skill-testing 的 fallback 路径，用当前 agent 生成干跑响应，并在 Downloads 下保存可复现的响应文件。
    ![](codex_1.png)
    
    因此，为了强制让 Codex 生成 Sub-Agent 并在 Sub-Agent 中测试 Skills 的用例，我们需要改 SKill 测试的提示词：
    
    > 请使用 sub-agent 测试 skill: pdf-case-converter

    ![](codex_2.png)

## 总结
Skill 是一种 **Procedural Knowledge**。它不是普通文档知识，也不是可独立执行的 Agent，而是模型完成某类任务时需要遵循的方法、流程和契约。只有明确 Skills 与 Agents 之间的区别，认识到 Skills 的本质，才能将 Skills 从一份提示词文档升级为可测试、可维护、可复用的 AI 工程资产。

当然，我们的实践还刚刚开始。当 Skills 变成 Agent 系统的基础设施，评估能力就不再是可选项，而是让 Agent 工程可维护、可回归、可扩展的前提。

## 参考文献
[^1]: [Extend Claude Code](https://code.claude.com/docs/en/features-overview#extend-claude-code)
[^2]: [Context Engineering: Sessions & Memory](https://www.kaggle.com/whitepaper-context-engineering-sessions-and-memory)
[^3]: [Skill Test Case Specific](/Skills-Test-Specification/)
[^4]: [对 Agent Skills 的认知与思考](/2025/12/24/Reflections-on-Agent-Skills/)
