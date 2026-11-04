---
title: 为什么 OpenMausBot 中的 OTel 会失效？
reward: false
top: false
date: 2026-11-04 19:45:38
authors:
  - 王伟
  - Gemini 4 Argon
categories:
  - LLM
tags:
  - OpenMausBot
  - OpenTelemetry
  - Claude Code
---
在 [OpenMausBot 实践](/2026/11/03/OpenMausBot-in-Action/) 中的最后我提到：
> 在 Claude Code 中，我配置了 OpenTelemetry 来上报 Traces 信息，但是 OpenMausBot 触发的 Claude Code Bots 在执行过程中，并没有将相关 Trace 信息上报。

开会之余，我在 Gemini 的帮助下对这个问题进行了排查与分析，整个过程也确实增强了自己对 Claude 的理解。
<!--more-->

确实，我有点懒，懒得自己去看代码、分析为什么会这样。另一方面，在模型能力如此强的今天，我的确认为没有必要向之前那样一点点的死扣代码、自己去分析。

于是，我把问题直接抛给了 Antigravity：
> 我在 claude 中配置了 OpenTelemetry，在 claude 中是可以检测到 trace 信息的，为什么在 OpenMausBots 的 VersusRD 中调用 claude 时，却没有检测到上报的 trace 信息呢？

Antigravity 的分析如下：
- 您的 OpenTelemetry 配置在用户级 `~/.claude/settings.json` 中。您本机的 `~/.claude/settings.json` 在 `"env"` 下配置了完整的遥测参数。在终端直接运行 claude 时，默认会加载 user/project/local 全部三层配置，因此能正常上报。

- OpenMausBot 默认强制传入了 `--setting-sources project`（屏蔽了 user 和 local 层）。在 OpenMausBot 的 `server/drivers/claude.ts`（第 1072-1081 行）中，为了防止宿主机的全局 MCP、Hooks 和个人指令污染每个 Bot，默认开启了隔离模式（`isolated = true`），启动命令会被强制加上 `--setting-sources project`，claude 不再读取用户级的 `~/.claude/settings.json`，而只会读取 VersusRD 工作目录下的项目级配置 `settings.json`。同时，OpenMausBot 在源码（`server/drivers/claude.ts:145`）中预留了一个环境变量开关 `OMB_CLAUDE_INHERIT_USER_CONFIG=1`，以关闭 isolated 模式，从而避免 `--setting-sources project` 的配置。

  ```bash
  claude -p --output-format stream-json ... --setting-sources project --settings /tmp/omb-mcp-xxx/auth-settings.json
  ```

- OpenMausBot 提取 `~/.claude/settings.json` 时只保留了 12 个认证白名单变量，虽然 OpenMausBot 会通过 `readClaudeAuthSettings()`（`server/drivers/claude.ts` 第 164-185 行）从 `~/.claude/settings.json` 的 `"env"` 中提取认证信息写入临时 `auth-settings.json`，但它使用了严格的白名单 `CLAUDE_ACCOUNT_ENV_KEYS`，因此 `CLAUDE_CODE_ENABLE_TELEMETRY` 和所有 `OTEL_*` 变量全部被丢弃了。

按照 Antigravity 的分析，我下载了 OpenMausBot 的源码，原因也确实如 Antigravity 所说。`server/drivers/claude.ts` 对 `--setting-sources` 的配置代码如下：

```ts
if (isolated) {
	// Without these every turn gets this machine's MCP servers, connectors, skills, hooks and CLAUDE.md
	// (one desktop: 407 tools, ~10k tokens).
    if (!turn.mcpFromUserConfig && claudeCliSupports(cliVersion, "--strict-mcp-config")) args.push("--strict-mcp-config");
    if (claudeCliSupports(cliVersion, "--setting-sources")) args.push("--setting-sources", "project");
    if (turn.userSkillsDir) args.push("--add-dir", turn.userSkillsDir);
}
```

但是，`OMB_CLAUDE_INHERIT_USER_CONFIG` 的方案并不推荐，因为这种方案和 OpenMausBot 的设计理念也有一定的冲突。从代码中我们也能看出增加该环境变量之后，也会打印一条错误日志。

```ts
if (inheritsUserConfig(catalogEnv)) {
      console.error(`claude (${instanceId}): OMB_CLAUDE_INHERIT_USER_CONFIG=1 — bots inherit this machine's Claude Code MCP servers, skills, hooks and CLAUDE.md on every turn; remove it unless a bot needs a user-scope server`);
}
```

实践之后，我发现：在项目级 `.claude/settings.json` 中的 `"env"` 字段增加 OpenTelemetry 相关配置的方式也不会生效。

claude 中存在如下规则：项目中的 `.claude/settings.json` 只能用来“关停”遥测，绝不允许用来“开启”遥测或指定 `OTEL_EXPORTER_OTLP_ENDPOINT`。因此，即便把相关配置补充到项目级的 `settings.json`，claude 也会直接把这些配置当成不安全配置并忽略。

> Claude Code ignores these telemetry variables in [project settings]... A project's settings files can only turn telemetry off: set OTEL_METRICS_EXPORTER, or OTEL_TRACES_EXPORTER to none, or a content variable such as OTEL_LOG_USER_PROMPTS to 0... If you set them or purpose, set them in your shell, your user settings (~/.claude/settings.json), or managed settings instead.

因此，根据如上的分析，为了在 OpenMausBot 中开启 OpenTelemetry，我们可以采用把配置写入 `managed-settings.json` 的方案。

```bash
$ sudo mkdir -p "/Library/Application Support/ClaudeCode"

sudo tee "/Library/Application Support/ClaudeCode/managed-settings.json" << 'EOF'
{

	"env": {
		"CLAUDE_CODE_ENABLE_TELEMETRY": "1",
		"CLAUDE_CODE_ENHANCED_TELEMETRY_BETA": "1",
		"OTEL_TRACES_EXPORTER": "otlp",
		"OTEL_METRICS_EXPORTER": "otlp",
		"OTEL_LOGS_EXPORTER": "otlp",
		"OTEL_EXPORTER_OTLP_PROTOCOL": "grpc",
		"OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:4317",
		"OTEL_SERVICE_NAME": "claude",
		"OTEL_LOG_USER_PROMPTS": "1",
		"OTEL_LOG_ASSISTANT_RESPONSES": "1",
		"OTEL_LOG_TOOL_DETAILS": "1",
		"OTEL_LOG_TOOL_CONTENT": "1",
		"OTEL_LOG_RAW_API_BODIES": "1"
	}
}
EOF
```

在 VersusRD Bot 中输入“hello”，现在已经可以在 otel-desktop-viewer 中看到 trace 信息了。

![VersusRD Bot 的 Trace 信息已显示在 otel-desktop-viewer 中](1.png)
