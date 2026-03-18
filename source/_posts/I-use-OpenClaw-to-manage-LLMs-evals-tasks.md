---
title: 我让 OpenClaw 🦞 管理大模型评测任务
reward: false
top: false
date: 2026-03-15 19:20:25
authors:
categories:
  - LLM
tags:
  - OpenClaw
  - 任务管理
  - Task Management
---

![](1.png)

虽然 LLM 的能力现在已经非常强大，但是对于多模态大模型的评测而言，仍然需要进行大量的人工评测工作。所以，我们也会看到，类似 [Arean](https://arena.ai/leaderboard) 平台的这种基于人类偏好打分的榜单，依然是我们评估大模型性能的有效参考。

我们参考 LMArena 团队开源的榜单算法 [Arena Rank](https://arena.ai/blog/arena-rank/) 构建了自己的大模型 Side-by-Side 评测系统，来满足我们对大模型评测的需求。
<!--more-->

## Side-by-Side 评测系统
与 LMArena 不同的是，在我的系统中，用户的偏好打分的样本是我们预先准备好的，而不是用户自己上传的。在我们的系统中，我们会讲待用户打分的样本组织成一个任务，同时我们会招募打分用户为这个任务打分。

以文生图任务为例，平台的打分过程如下图所示：

![Side-by-Side 偏好打分](2.png)

当用户打分完成之后，我们会利用 [Arena Rank](https://arena.ai/blog/arena-rank/) 算法来更新所有模型的评分与榜单信息。

所以，在我们的系统中，一个评测任务的基本流程如下：

```mermaid
graph LR
    A[创建评估任务] --> B[发布招募信息]
    B --> C[用户报名]
    C --> D[创建群聊]
    D --> E[群聊中发布任务链接]
    E --> F[定期跟进进度]
    F --> G[计算 Elo 排序]

    style A fill:#f9f9f9,stroke:#333,stroke-width:2px
    style B fill:#f9f9f9,stroke:#333,stroke-width:2px
    style C fill:#f9f9f9,stroke:#333,stroke-width:2px
    style D fill:#f9f9f9,stroke:#333,stroke-width:2px
    style E fill:#f9f9f9,stroke:#333,stroke-width:2px
    style F fill:#f9f9f9,stroke:#333,stroke-width:2px
    style G fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px
```

在 OpenClaw 出现之前，我们需要安排专人来完成如上所述的评测任务的创建、发布、招募、跟进、计算等整个流程。有时候，我们一天也会创建多个评测任务，这个时候负责管理评测任务的同学就会焦头烂额。

在用了一段时间的 OpenClaw 之后，我发现 OpenClaw 具备如下的四大特性，这四大特性让 OpenClaw 非常适合用来管理大模型的评测任务。

* 更强大的记忆能力（跨天级别长程任务）
* 更强大的主机控制能力（系统管理员级别）
* 更强大的交互能力（多端 IM 触达，随时、随地的触达）
* 更强大的 Agent 蜂群能力（多 Agent 协同）

{% twitter https://x.com/wangwei1237/status/2033849102954598823 %}

于是，我们心动了，我们决定用技术手段来解决我们评测专员的烦恼，我们决定让 OpenClaw 来管理我们的评测任务。

## OpenClaw 的基本能力
这是一个典型的 `pipeline skill` [^4]，在正式开始之前，我们需要先来梳理一下这个 `agent` 需要的能力并梳理 OpenClaw 能提供的能力，从而方便我们后续的 `skill` 开发。

![](agent_types.jpeg)

### Workspace 文件加载时机
OpenClaw 的行为主要由 `worksapce` 文件而非隐藏的 `prompt` 文件定义。正确设置 *SOUL.md*、*AGENTS.md*、*USER.md*、*MEMORY.md* 以及 *TOOLS.md* 等文件以及了解每个文件的作用及其加载时机，对于实现我们的目标至关重要。

OpenClaw 会在 session 启动的时候去读取 `~/.openclaw/workspace/` 下的相关文件，具体的区别和作用如下所示[^7]：
| 文件               |  作用                                                  | 加载时机          |
|--------------------|----------------------------------------------------------|-----------------|
| AGENTS.md          | Operating instructions, priorities, workflow rules       | Every session   |
| SOUL.md            | Personality, tone, values, behavioral constraints       | Every session   |
| USER.md            | About you — name, preferences, style                     | Every session   |
| IDENTITY.md        | Agent name, role, goals, voice                           | Every session   |
| TOOLS.md           | Local tool notes, calendar IDs, conventions              | Every session   |
| HEARTBEAT.md       | Checklist for periodic heartbeat runs                    | Heartbeat only  |
| BOOTSTRAP.md       | First-run interview — auto-deleted after                 | First run       |
| MEMORY.md          | Long-term curated memory (optional)                      | Main DM only    |
| memory/YYYY-MM-DD.md | Daily logs — today + yesterday loaded                  | Every session |

因此，如果我们想在群聊启动时、或者在群聊中通过 `/new` 命令创建一个新的群聊 `session` 的时候，让群聊能够记起之前的内容，那么最好不要把记忆放在 `MEMORY.md` 文件中。`TOOLS.md` 文件是一个不错的选择。

### 跨 session 通信能力
在 OpenClaw 中，默认情况下，所有的 “私聊（DM）” 共用一个“主会话（main session）”，以保证对话的连贯性；而不同的 “群聊（Group）” 或者 “频道” 则会拥有各自的“独立会话（isolated sessions）”。[^6]

如果你的 OpenClaw 可以接收来自多个用户的私信消息，此时，所有用户将共享相同的“主会话”上下文，这会导致用户之间的私人信息泄露，进而带来安全风险。比如我的 OpenClaw 授权给了我的很多同事，他们每天都会和我用同一个 🦞 来私聊并处理工作上的事情，而我不想让其他的同事知道我和 🦞 都聊了什么。

这个时候，就需要使用 `session.dmScope` 来控制私聊会话的隔离范围，保证不同用户之间的会话隔离。[^6]

```json
// ~/.openclaw/openclaw.json
{
  session: {
    // Secure DM mode: isolate DM context per channel + sender.
    dmScope: "per-channel-peer",
  },
}
```

```bash
* main (default): all DMs share the main session for continuity.
* per-peer: isolate by sender id across channels.
* per-channel-peer: isolate by channel + sender (recommended for multi-user inboxes).
* per-account-channel-peer: isolate by account + channel + sender (recommended for multi-account inboxes). 
```

当多个私聊、多个群聊以单独的 session 运行时，接下来需要考虑的问题就是：如何让这些相互隔离的 sessions 保持一定的信息互通（只互通关系的信息）。整个评测的过程是在不同的私聊、群聊中不停的切换，没有一定的跨 session 能力，🦞 就会给人一种暂时性失忆的印象。

**是的，有时候就是这么矛盾，既要保证信息隔离，又要保证一定的信息互通。**

### 文件读写能力
文件操作最基本的能力就是对文件路径的访问能力，根据 OpenClaw 的 *官方文档*：`agent` 的 `workspace` 目录就是当前 `agent` 的默认 `CWD`，在 `agent` 的 `context` 中，所有的 *相对路径* 均基于 `workspace` 进行解析。当然，绝对路径可以访问主机的其他位置。[^1][^2][^3]

> OpenClaw uses a single agent workspace directory (agents.defaults.workspace) as the agent’s only working directory (cwd) for tools and context.
>
> The workspace is the default cwd, not a hard sandbox. Tools resolve relative paths against the workspace, but absolute paths can still reach elsewhere on the host unless sandboxing is enabled. 
>
> Workspace note: each agent’s workspace is the default cwd, not a hard sandbox. Relative paths resolve inside the workspace, but absolute paths can reach other host locations unless sandboxing is enabled.

这一点非常重要，因为接下来我们在写 `skill` 的时候，会经常涉及到文件路径的解析问题：

* 在 `SKILL.md` 中引用其他参考文件；
* 在 `SKILL.md` 中执行 `scripts` 路径下的某个脚本；
* ……

!!! warning "CWD 路径问题"
    在 Claude Code 中写 `skill` 时，`CWD` 路径就是该 `skill` 的路径。所以，对于 Claude Code 而言，`SKILL.md` 中所有的 *相对路径* 均基于 `skill` 的路径进行解析。
    
    但是，在 OpenClaw 中，规则变了：`workspace` 目录才是 `agent` 的默认 `CWD`。因此，对于 OpenClaw 来说，`SKILL.md` 中所有的 *相对路径* 均基于 `workspace` 进行解析。
    
从 3.2 版本开始，为了解决饱受诟病的安全问题，OpenClaw 对工具调用实施了更严格的权限控制，并且默认情况下，OpenClaw 无法对主机上的文件系统进行写、执行等操作。如果需要执行写、执行等操作，需要显式在 OpenClaw 的配置文件中对相关工具进行授权。[^5]

```json
"tools": {
  "profile": "full"
}
```

### 多 Agent 协同能力
整个评估过程，核心会涉及到三个阶段：发起任务、跟进任务状态、销毁任务。可以用一个 Agent 来完成这所有的阶段，但是拆分成多个 Agent 实现起来可能会更容易维护。

* 每次任务都会重新执行 Main Agent，Main Agent 只负责发起任务并生成 Status Agent（跟进任务） 和 Killer Agent（销毁任务）
  * 每一次评估任务都会创建单独的 Status Agent 来跟踪当前的评估任务状态
  * 如果 Killer Agent 已经存在了就不需要重新创建
  * Main Agent 完成任务后就退出了
* Status Agent 和 Killer Agent 会周期性的醒来并执行相应的任务。
* 当 Killer Agent 发现某个任务已经完成，则会结束对应 Status Agent，这样这个任务的 Status Agent 就不需要再占用资源。

![](4.png)

OpenClaw 中的 Cron 即是调度器、更是一个非常强大的 Agent Spawn 工具[^8]。

> Cron is the Gateway’s built-in scheduler. It persists jobs, wakes the agent at the right time, and can optionally deliver output back to a chat.

当我们使用 `--session isolated` 和 `--message` 创建定时任务时，OpenClaw 会以 `--message` 指定的内容作为提示词创建一个新的 Agent，并以 `--cron` 中指定的调度周期定期唤醒该 Agent。

```bash
openclaw cron add \
--name "${job-name}" \
--cron "*/3 * * * *" \
--tz "Asia/Shanghai" \
--session isolated \
--message "${MESSAGE}"
```

此时，每次定时任务触发，OpenClaw 都会强制生成一个全新的 Session ID（以 cron:<job.id> 作为 Session Key），并且完全不会复用之前的闲置会话，从而避免任务多次执行过程中的上下文污染。

![](8.png)

## 工程实现
》》》

## 参考文献
[^1]: [OpenClaw: Workspace Required](https://docs.openclaw.ai/concepts/agent#workspace-required)
[^2]: [OpenClaw: Agent Workspace](https://docs.openclaw.ai/concepts/agent-workspace)
[^3]: [OpenClaw: Multi Agent](https://docs.openclaw.ai/concepts/multi-agent)
[^4]: [5 Agent Skill design patterns every ADK developer should know](https://x.com/GoogleCloudTech/status/2033953579824758855)
[^5]: [OpenClaw: Tools](https://docs.openclaw.ai/tools)
[^6]: [OpenClaw: Session Management](https://docs.openclaw.ai/concepts/session#secure-dm-mode-recommended-for-multi-user-setups)
[^7]: [OpenClaw Cheat Sheet](https://openclawcheatsheet.com/)
[^8]: [OpenClaw Cron Jobs](https://docs.openclaw.ai/automation/cron-jobs)