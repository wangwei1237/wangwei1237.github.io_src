---
title: Skill Test Case Specific
date: 2026-06-12 15:57:55
---

> Version: 1.0.0

## 1. 目标

Skill 是一种**过程性知识**，用于指导模型完成某一类任务。Skill Test 的目标不是验证真实业务最终是否成功，而是验证：

- Skill 是否在正确场景下被触发；
- 模型是否理解 Skill 的执行流程；
- 输出产物是否符合约定；
- 信息缺失、失败、边界场景下是否处理合理；
- Skill 输出是否能被 Agent、Hook 或 Workflow 后续消费。

!!! note "备注"
    Skill Test 是测“方案是否可靠”；而对应的 Agent Test 是测“执行是否正确”。
    

## 2. 测试边界

### 2.1 Skill Test 关注

- 触发是否准确；
- 执行步骤是否完整；
- 输出格式是否稳定；
- 是否识别缺失信息；
- 是否避免幻觉；
- 是否输出可回流的失败信息；
- 是否遵守职责边界；

### 2.2 Skill Test 不关注

- 真实代码是否最终修复成功；
- 真实服务是否可用；
- 真实测试环境是否稳定；

这些应由 Agent Eval、Hook Test 或 Workflow Eval 负责。


## 3. 测试类型

| 类型 | 说明 |
|---|---|
| `trigger` | 验证 Skill 是否应该触发，以及是否避免误触发 |
| `plan` | 验证 dry-run 模式下是否能给出符合 Skill 的执行计划 |
| `contract` | 验证输出产物、字段和格式是否稳定 |
| `edge` | 验证信息缺失、输入模糊、文档不完整等边界场景 |
| `failure` | 验证失败诊断、失败分类和回流策略 |


## 4. 测试模式

Skill 测试默认采用 **dry-run** 模式：

!!! note "备注"
    不执行命令、不修改文件、不调用外部服务，只输出计划或结构化说明。


推荐测试层级：

| 模式 | 是否真实执行 | 适用场景 |
|---|---|---|
| `dry-run` | 否 | 触发、计划、流程理解、职责边界 |
| `mock` | 半真实 | 样例文档、样例日志、样例报告分析 |
| `execution` | 是 | 通常用于 Agent Evals，不作为 Skill 默认测试模式 |


## 5. 文件位置

每个 Skill 至少维护一份测试文件：

```text
${ABS_ROOT}/skills/<skill-name>/tests/skill_cases.yaml
```

推荐结构：

```bash
${ABS_ROOT}/
└── skills/
    └── <skill-name>/
        ├── SKILL.md
        ├── scripts/
        │   └── script.py
        └── tests/
            └── skill_cases.yaml
```


## 6. YAML 顶层结构

```yaml
version: "1.0"

skill:
  name: "api-test-flow"
  description: "验证 API 测试类 Skill 的触发、计划和输出契约"

defaults:
  mode: "dry-run"
  execution: "no_tool_call"
  output_format: "json"

cases:
  - id: "trigger_001"
    type: "trigger"
    title: "API 测试请求应触发 api-test-flow"
    query: "如果要测试登录接口是否符合预期，你会调用哪个 skill？"
    inputs:
      files: []
      context: {}
    expected:
      skill:
        should_use: "api-test-flow"
        should_not_use:
          - "ui-acceptance-test"
          - "release-check"
      must_include: []
      must_not_include: []
      artifacts: []
      routing: {}
    assertions:
      - "selected_skill == 'api-test-flow'"
    tags:
      - "trigger"
      - "positive"
```

## 7. 字段说明

| 字段 | 必填 | 说明 |
|---|---|---|
| `version` | 是 | 测试规范版本 |
| `skill.name` | 是 | 被测 Skill 名称 |
| `skill.description` | 否 | Skill 简要说明 |
| `defaults.mode` | 是 | 默认测试模式，推荐 `dry-run` |
| `defaults.execution` | 是 | 是否允许工具调用，Skill 单测推荐 `no_tool_call` |
| `cases[].id` | 是 | 用例唯一 ID |
| `cases[].type` | 是 | `trigger` / `plan` / `contract` / `edge` / `failure` |
| `cases[].title` | 是 | 用例标题 |
| `cases[].query` | 是 | 测试输入 |
| `inputs.files` | 是 | 测试依赖文件，无则为空数组 |
| `inputs.context` | 是 | 额外上下文，无则为空对象 |
| `expected.skill.should_use` | 是 | 期望使用的 Skill |
| `expected.skill.should_not_use` | 是 | 不应使用的 Skill 列表 |
| `expected.must_include` | 是 | 输出中必须包含的步骤、字段或语义 |
| `expected.must_not_include` | 是 | 输出中不能出现的行为或内容 |
| `expected.artifacts` | 是 | 期望产物 |
| `expected.routing` | 是 | 成功、失败或阻塞时的路由 |
| `assertions` | 是 | 可被脚本或 LLM Judge 执行的断言 |
| `tags` | 否 | 用于筛选测试集 |


## 8. 各类 Case 编写要求

### 8.1 Trigger Case

用于验证 Skill 是否应该被触发。

要求至少包含：

- 一个正例：应该触发该 Skill；
- 一个反例：不应该触发该 Skill；
- 如有相似 Skill，应加入误触发测试。

示例：

```yaml
- id: "trigger_001"
  type: "trigger"
  title: "API 测试请求应触发 api-test-flow"
  query: "请根据 PRD 验证登录接口是否符合预期"
  inputs:
    files: []
    context: {}
  expected:
    skill:
      should_use: "api-test-flow"
      should_not_use:
        - "ui-acceptance-test"
    must_include: []
    must_not_include: []
    artifacts: []
    routing: {}
  assertions:
    - "selected_skill == 'api-test-flow'"
  tags:
    - "trigger"
    - "positive"
```

### 8.2 Plan Case

用于验证模型是否理解 Skill 的执行流程。

Plan Case 必须要求：

- 不实际执行工具；
- 不修改文件；
- 只输出计划；
- 明确使用哪个 Skill；
- 明确步骤、输入、输出、成功/失败标准、失败路由。

推荐 Query：

!!! note "备注"
    如果用户 Query 是：“xxxx”，你会怎么做？
    不要实际执行工具，不要修改文件，只输出计划。

示例：

```yaml
- id: "plan_001"
  type: "plan"
  title: "API 测试 Skill 应给出正确执行计划"
  query: >
    如果用户 Query 是：“请根据 PRD 验证登录接口是否符合预期”，你会怎么做？
    不要实际执行工具，不要修改文件，只输出计划。
  inputs:
    files:
      - "examples/login_prd.md"
      - "examples/login_api_doc.md"
    context:
      target_api: "login"
  expected:
    skill:
      should_use: "api-test-flow"
      should_not_use: []
    must_include:
      - "读取 PRD"
      - "读取 API 文档"
      - "生成 API 测试用例"
      - "解析测试结果"
      - "输出 api_test_report"
    must_not_include:
      - "直接修改业务代码"
    artifacts:
      - "api_test_report.json"
    routing:
      on_success: "finish"
      on_code_failure: "coding-agent"
      on_case_failure: "testcase-agent"
      on_env_failure: "env-agent"
  assertions:
    - "selected_skill == 'api-test-flow'"
    - "'api_test_report.json' in artifacts"
  tags:
    - "plan"
    - "dry-run"
```

### 8.3 Contract Case

用于验证输出契约。

重点检查：

- 产物文件名；
- 必填字段；
- 字段取值范围；
- Markdown 标题结构；
- JSON Schema；
- 是否可被下游 Agent 或 Hook 消费。

示例：

```yaml
- id: "contract_001"
  type: "contract"
  title: "api_test_report.json 输出契约校验"
  query: "请根据样例接口文档生成 API 测试报告，不要实际执行测试"
  inputs:
    files:
      - "examples/login_prd.md"
      - "examples/login_api_doc.md"
    context:
      mock_result: "pass"
  expected:
    skill:
      should_use: "api-test-flow"
      should_not_use: []
    must_include:
      - "status"
      - "tested_apis"
      - "test_cases"
      - "failures"
      - "next_action"
    must_not_include:
      - "不存在的接口字段"
    artifacts:
      - "api_test_report.json"
    routing:
      on_success: "finish"
      on_failure: "coding-agent"
  assertions:
    - "artifact_exists('api_test_report.json')"
    - "json_field_exists('api_test_report.json', 'status')"
    - "json_field_in('api_test_report.json', 'status', ['PASS', 'FAIL', 'BLOCKED'])"
  tags:
    - "contract"
    - "schema"
```

### 8.4 Edge Case

用于验证信息不足、输入冲突、文档缺失等场景。

要求模型：

- 不编造缺失信息；
- 明确标记缺失字段；
- 可输出 `BLOCKED` 或 `NEEDS_CONFIRMATION`；
- 给出下一步确认问题。

示例：

```yaml
- id: "edge_001"
  type: "edge"
  title: "API 文档缺失时不应编造字段"
  query: "请根据这份不完整 API 文档生成接口测试方案"
  inputs:
    files:
      - "examples/incomplete_api_doc.md"
    context:
      missing_fields:
        - "request_schema"
        - "error_codes"
  expected:
    skill:
      should_use: "api-test-flow"
      should_not_use: []
    must_include:
      - "NEEDS_CONFIRMATION"
      - "缺失信息"
    must_not_include:
      - "编造接口字段"
      - "虚构错误码"
    artifacts:
      - "api_test_report.json"
    routing:
      on_blocked: "human_confirm"
  assertions:
    - "status in ['BLOCKED', 'NEEDS_CONFIRMATION']"
    - "missing_fields.length > 0"
    - "no_hallucinated_api_fields == true"
  tags:
    - "edge"
    - "anti-hallucination"
```

### 8.5 Failure Case

用于验证失败诊断和回流策略。

失败场景应要求输出：

- 失败用例；
- 期望结果；
- 实际结果；
- 失败证据；
- 疑似原因；
- 建议回流对象；
- 下一步动作。

示例：

```yaml
- id: "failure_001"
  type: "failure"
  title: "测试失败时应输出可回流给 coding-agent 的信息"
  query: "请分析这份 API 测试失败日志，并给出下一步处理建议"
  inputs:
    files:
      - "fixtures/api_test_failure.log"
    context:
      current_agent: "api-test-agent"
  expected:
    skill:
      should_use: "api-test-flow"
      should_not_use: []
    must_include:
      - "失败用例"
      - "期望结果"
      - "实际结果"
      - "失败证据"
      - "疑似原因"
      - "建议回流对象"
    must_not_include:
      - "仅输出测试失败，无下一步建议"
    artifacts:
      - "api_test_report.json"
    routing:
      on_failure: "coding-agent"
  assertions:
    - "status == 'FAIL'"
    - "failure_count > 0"
    - "suspected_owner == 'coding-agent'"
    - "next_action != ''"
  tags:
    - "failure"
    - "routing"
```

## 9. 最小测试集要求

每个 Skill 至少包含 6 个 测试用例：

!!! note "备注"
    * trigger_positive: 1
    * trigger_negative: 1
    * plan: 1
    * contract: 1
    * edge: 1
    * failure: 1
    
    
## 10. 编写原则

1. **字段统一**：所有 Case 保持相同字段结构，空值也保留。
2. **Query 明确**：Plan Case 必须声明“不执行工具、不修改文件、只输出计划”。
3. **Expected 可判断**：避免“输出完整”“分析清楚”这类模糊描述。
4. **Assertions 可自动化**：优先使用简单、可解析的断言。
5. **必须有正反例**：每个 Skill 至少有一个触发正例和一个触发反例。
6. **禁止 Skill 调用 Skill**：跨阶段流程由 Hooks、Workflow Runtime 或主 Agent 编排。
7. **Skill 目录放小测试**：完整测试集放 `tests/skill-evals/<skill-name>/`。


## 11. 评估方式

推荐评分 Rubric：

| 维度 | 分数 |
|---|---:|
| Skill 选择正确 | 15 |
| 流程步骤完整 | 20 |
| 输出契约符合 | 20 |
| 边界处理合理 | 15 |
| 失败回流清晰 | 15 |
| 不越权、不幻觉 | 10 |
| 表达清晰 | 5 |

通过阈值建议：

!!! note "备注"
    * 85+：通过
    * 70 - 84：需人工 Review
    * < 70：失败
  
## 12. 完整模板

```yaml
version: "1.0"

skill:
  name: "<skill-name>"
  description: "<skill-description>"

defaults:
  mode: "dry-run"
  execution: "no_tool_call"
  output_format: "json"

cases:
  - id: "trigger_001"
    type: "trigger"
    title: "<正向触发场景>"
    query: "<用户请求>"
    inputs:
      files: []
      context: {}
    expected:
      skill:
        should_use: "<skill-name>"
        should_not_use: []
      must_include: []
      must_not_include: []
      artifacts: []
      routing: {}
    assertions:
      - "selected_skill == '<skill-name>'"
    tags:
      - "trigger"
      - "positive"

  - id: "trigger_002"
    type: "trigger"
    title: "<反向触发场景>"
    query: "<不应触发该 Skill 的用户请求>"
    inputs:
      files: []
      context: {}
    expected:
      skill:
        should_use: "<better-skill-or-empty>"
        should_not_use:
          - "<skill-name>"
      must_include: []
      must_not_include: []
      artifacts: []
      routing: {}
    assertions:
      - "selected_skill != '<skill-name>'"
    tags:
      - "trigger"
      - "negative"

  - id: "plan_001"
    type: "plan"
    title: "<计划测试场景>"
    query: >
      如果用户 Query 是：“<用户请求>”，你会怎么做？
      不要实际执行工具，不要修改文件，只输出计划。
    inputs:
      files: []
      context: {}
    expected:
      skill:
        should_use: "<skill-name>"
        should_not_use: []
      must_include:
        - "<步骤1>"
        - "<步骤2>"
      must_not_include:
        - "<禁止行为>"
      artifacts:
        - "<expected_artifact>"
      routing:
        on_success: "finish"
        on_failure: "<target-agent>"
    assertions:
      - "selected_skill == '<skill-name>'"
      - "'<expected_artifact>' in artifacts"
    tags:
      - "plan"
      - "dry-run"

  - id: "contract_001"
    type: "contract"
    title: "<输出契约测试场景>"
    query: "<要求生成结构化产物的请求>"
    inputs:
      files: []
      context: {}
    expected:
      skill:
        should_use: "<skill-name>"
        should_not_use: []
      must_include:
        - "<required_field>"
      must_not_include: []
      artifacts:
        - "<expected_artifact>"
      routing: {}
    assertions:
      - "artifact_exists('<expected_artifact>')"
    tags:
      - "contract"
      - "schema"

  - id: "edge_001"
    type: "edge"
    title: "<边界场景>"
    query: "<信息缺失或输入冲突的请求>"
    inputs:
      files: []
      context: {}
    expected:
      skill:
        should_use: "<skill-name>"
        should_not_use: []
      must_include:
        - "NEEDS_CONFIRMATION"
      must_not_include:
        - "编造信息"
      artifacts: []
      routing:
        on_blocked: "human_confirm"
    assertions:
      - "status in ['BLOCKED', 'NEEDS_CONFIRMATION']"
    tags:
      - "edge"
      - "anti-hallucination"

  - id: "failure_001"
    type: "failure"
    title: "<失败处理场景>"
    query: "<失败日志或失败报告分析请求>"
    inputs:
      files: []
      context: {}
    expected:
      skill:
        should_use: "<skill-name>"
        should_not_use: []
      must_include:
        - "失败原因"
        - "下一步动作"
      must_not_include:
        - "仅输出失败，无处理建议"
      artifacts:
        - "<failure_report>"
      routing:
        on_failure: "<target-agent>"
    assertions:
      - "status == 'FAIL'"
      - "next_action != ''"
    tags:
      - "failure"
      - "routing"
```
