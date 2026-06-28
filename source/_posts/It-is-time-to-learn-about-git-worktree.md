---
title: 是时候了解一下 git worktree 了
reward: false
top: false
date: 2026-06-28 12:58:05
authors:
categories:
  - LLM
tags:
  - git
  - worktree
  - branch
---

![](1.png)

在 [如何利用 Harness “一句话交付产品功能”？](/2026/05/28/How-to-Achieve-One-Command-Feature-Delivery-with-Harness/) 一文中，我们已经讨论过如何在单个 `clone` 仓库里借助 Harness Engineering 自动完成需求开发。但问题也随之出现：当这个目录正在被 Coding Agent 执行任务、修改代码、运行测试时，我们能做的往往只剩下等待。

如果还想并行开发另一个功能，最直观的办法是重新 `clone` 一份仓库到新目录。这个方案能用，但并不优雅：重复下载、重复安装依赖、重复同步分支，最后还要在多个副本之间来回合并。我们需要一种更轻、更原生、更适合并行开发的方案。于是，git worktree 重新进入了视野。

<!--more-->

git worktree 是 Git 中一个长期被低估的能力。它随 Git 2.5 在 2015 年发布，至今已经存在十多年[^1]，但依旧鲜为人知。如果不是 AI Coding Agent 的告诉发展，git worktree 很可能仍然仅仅停留在更新日志中。

## Git Worktree 简介

根据 Git 官方文档[^2]，`git worktree` 用于在同一个仓库之上管理多个工作目录。

在传统 Git 工作流中，我们通常有两种并行方式：在同一个目录里不断切换分支，或者为同一个仓库创建多个 `clone`。前者会频繁打断当前上下文，尤其是在工作区还存在未提交修改时；后者虽然隔离性更好，但每个克隆都拥有独立的 Git 数据，需要额外同步远端、分支和提交。

git worktree 提供了第三种选择：为现有仓库创建一个新的工作目录。这个目录看起来像一个独立仓库，有自己的文件树和当前分支；但它并不是一份完整克隆，而是复用主仓库背后的 Git 对象、引用和历史记录。在 linked working tree 中，`.git` 通常不是目录，而是一个指向主仓库 Git 元数据的普通文件。

![](2.png)

## Linked Working Tree

理解 git worktree，需要先区分两个概念：

* **主工作目录（Main Working Tree）**：通过 `git clone` 或 `git init` 创建的原始仓库目录。它包含完整的 `.git` 目录，是其他链接工作目录共享 Git 数据的基础。
* **链接工作目录（Linked Working Tree）**：通过 `git worktree add` 创建的额外工作目录。它拥有独立的代码文件和工作区状态，但通过 `.git` 文件关联到主仓库的 Git 元数据。

换句话说，worktree 不是“再克隆一份仓库”，而是在同一个仓库历史之上打开多个互相隔离的工作现场。

## 创建 Worktree

假设我们正在 `feature` 分支上开发一个功能，这时线上突然出现一个需要基于 `main` 紧急修复的 Bug。如果不使用 worktree，通常需要这样操作：

1. 暂存 `feature` 分支上的所有改动，并让工作区恢复干净状态
2. 切换到 `main` 分支，再创建新的 `hotfix` 分支
3. 在 `hotfix` 分支上修复 Bug 并提交
4. 切回 `feature` 分支，并恢复之前暂存的改动

```bash
git stash
git checkout main
git checkout -b hotfix
# 修复 Bug，提交修复
git checkout feature
git stash pop
```

这个流程并不复杂，但很容易打断思路。如果 `stash pop` 发生冲突，原本只想修一个小 Bug，最后可能变成上下文切换和冲突处理。

使用 worktree 可以把这个过程变成一次目录创建：

```bash
git worktree add ../project-hotfix -b hotfix main
```

执行后，我们会得到两个工作目录：

```bash
project/            # 继续开发 feature
project-hotfix/     # 专门处理 hotfix
```

两个目录共享同一份 Git 历史，但工作区彼此独立。我们可以在 `project` 中继续开发功能，在 `project-hotfix` 中修复线上问题，不需要来回 `checkout`，也不需要临时清空当前工作现场。

## 查看 Worktree

若要查看当前仓库关联的所有 worktree，可以使用 `git worktree list`：

```bash
git worktree list
```

这个命令会列出每个工作目录的本地路径、当前提交哈希，以及该目录正在检出的分支或 HEAD 状态。对于同时处理多个任务的项目来说，它相当于一张本地并行工作区清单。

![](3.png)

## 删除 Worktree

为了保持本地目录整洁，完成任务后应及时删除不再需要的 worktree。例如，当 `hotfix` 修复完成并提交后，可以执行：

```bash
git worktree remove ../project-hotfix
```

这条命令会完成两件事：

1. 删除该 worktree 目录下的代码文件
2. 从仓库的 worktree 注册表中清除对应记录

如果目标工作目录中仍有未提交修改，Git 默认会拒绝删除，以避免误删本地工作。确实需要删除时，可以追加 `--force`：

```bash
git worktree remove --force ../project-hotfix
```

和所有 `-f` / `--force` 参数一样，执行前务必确认里面没有需要保留的修改、未跟踪文件或本地提交。

## Worktree 与 Branch

git branch 和 git worktree 不是同一层面的概念[^3]。

* branch 是一条版本线，本质上是指向某个提交的引用。它解决的是“基于哪个版本继续演进”的问题。
* worktree 是一个工作目录，它把某条版本线检出到独立目录中。它解决的是“如何同时打开多个工作现场”的问题。

```text
Git 仓库
├── branch: main
├── branch: feature/1
├── branch: fix/bug-123
└── worktree:
    ├── 当前目录        -> main
    ├── ../f1-dev      -> feature/1
    └── ../bugfix      -> fix/bug-123
```

| 对比项 | branch | worktree |
| ---- | ---- | ---- |
| 本质 | 一条提交线 / 指针 | 一个独立工作目录 |
| 解决问题 | 管理不同开发线 | 同时在多个开发线工作 |
| 是否占用独立目录 | 不占用 | 会创建独立目录 |
| 是否可以同时打开多个 | 分支可以有很多，但当前目录一次只能 checkout 一个 | 可以在多个目录中同时 checkout 不同分支 |
| 典型命令 | `git branch` / `git checkout` / `git switch` | `git worktree add` / `git worktree list` / `git worktree remove` |

!!! note "branch 是“版本线”，worktree 是“工作现场”"
    worktree 不是 branch 的替代品。更准确地说，worktree 通常是把某个 branch 检出到另一个目录，让它成为一个独立工作现场。

## 何时使用 Worktree

在 AI Coding Agent 普及之前，工程师通常只会并行推进一个或少数几个任务，branch 已经足够。但当我们需要同时处理多个任务，尤其是三个以上彼此独立的任务时，worktree 的优势会非常明显：

* 一个目录继续主需求开发
* 一个目录修复线上 Bug
* 一个目录验证依赖升级
* 一个目录复现或审查 Pull Request
* 一个目录交给 Coding Agent 跑长期任务

worktree 的关键价值不是“多一个 Git 命令”，而是把研发现场从单线程切换升级成多工作区并行。

## Coding Agent 中的 Worktree

在 Coding Agent 场景下，worktree 的价值会进一步放大。Agent 不只是帮我们写几行代码，它往往会执行一个完整任务链：阅读代码、修改文件、安装依赖、运行测试、分析失败、继续修复。如果多个 Agent 或多个任务挤在同一个工作目录里，文件修改、未提交变更、依赖状态和本地服务都很容易互相干扰。

因此，Codex 和 Claude Code 都把 worktree 作为并行编码的重要基础设施。简单来说：

* 对人来说，worktree 是多个独立的工作现场。
* 对 Coding Agent 来说，worktree 是多个互不干扰的任务沙箱。

### Codex 中的 Worktree

Codex 中的 worktree 主要用于让 Codex 在同一个项目里并行执行多个独立任务，同时不影响我们正在使用的本地工作目录。Codex 文档把这个本地目录称为 **Local checkout**，也就是我们自己创建并日常使用的仓库；Codex 从它创建出来的后台工作目录则称为 **Worktree**[^4]。

可以把这个模型理解为：

```text
Local checkout   # 前台工作区：我们正在 IDE、终端、开发服务器中使用
Worktree A       # 后台任务：Codex 实现 feature-a
Worktree B       # 后台任务：Codex 修复 bug-b
Worktree C       # 后台任务：Codex 处理代码评审反馈
```

在 Codex 中创建新线程时，可以选择让线程运行在 Worktree 中。Codex 会基于我们选择的起始分支创建一个 Git worktree。这个起始分支可以是 `main` / `master`，也可以是某个功能分支，甚至可以是当前带有未暂存改动的分支。默认情况下，Codex 会在 detached HEAD 状态下工作；当我们确认这条任务值得保留时，再在该 worktree 上创建分支、提交代码、推送远端并创建 Pull Request。

![](4.png)

Codex 还有一个关键概念：**Handoff**。Handoff 用于在线程的 Local 和 Worktree 之间移动任务。也就是说，当 Codex 在后台 worktree 中完成一批修改后，如果我们想用熟悉的 IDE 和本地开发服务器继续检查，可以把这个线程 handoff 到 Local；反过来，如果一个任务最初在 Local 中启动，但希望放到后台继续执行，也可以 handoff 到 Worktree。

这个机制解决的是 Git 的一个天然限制：同一个分支不能同时被 checkout 到多个 worktree 中。Codex 的 Handoff 会处理必要的 Git 操作，避免我们手动搬运修改、切换分支和处理由此引入的冲突。对于使用者来说，真正需要决定的是：这个任务现在应该留在前台，还是交给后台环境继续推进。

!!! note "Codex 的核心抽象"
    Local 是前台工作现场，Worktree 是后台任务现场，Handoff 是二者之间的交接机制。

Codex 的 worktree 特别适合这些场景：

* 让 Codex 在后台实现一个功能，同时我们继续在 Local 中开发另一个功能。
* 把自动化任务运行在独立 worktree 中，避免影响当前工作目录。
* 在 worktree 中完成修改后，创建分支并提交 PR。
* 将 worktree 中的任务 handoff 到 Local，用日常 IDE 和开发服务器做最终检查。

需要注意的是：worktree 是一个新的 checkout，所以 `.gitignore` 中忽略的文件默认不会自动出现在 worktree 中，例如 `.env`、`.env.local`、本地密钥配置等。如果 Agent 任务依赖这些文件，就需要额外处理。Codex 支持通过 `.worktreeinclude` 把指定的已忽略文件复制到本地托管的 worktree 中。

### Claude Code 中的 Worktree

Claude Code 对 worktree 的支持更偏 CLI 工作流。它提供 `--worktree` / `-w` 参数，用于在独立 worktree 中启动一个 Claude Code 会话[^5]：

```bash
claude --worktree feature-auth
claude --worktree bugfix-123
```

默认情况下，Claude Code 会在仓库根目录下的 `.claude/worktrees/<name>/` 创建 worktree，并创建名为 `worktree-<name>` 的分支。例如：

```text
.claude/
└── worktrees/
    ├── feature-auth/   # branch: worktree-feature-auth
    └── bugfix-123/     # branch: worktree-bugfix-123
```

这样，我们可以在多个终端中同时启动多个 Claude Code 会话。一个会话实现认证功能，另一个会话修复线上 Bug；它们分别修改不同目录中的文件，因此不会互相覆盖。

Claude Code 默认从仓库的默认远端分支 `origin/HEAD` 创建新的 worktree，这意味着每个任务通常会从一个干净的远端状态开始。如果希望新的 worktree 基于当前本地 `HEAD` 创建，可以在设置中配置 `worktree.baseRef` 为 `"head"`：

```json
{
  "worktree": {
    "baseRef": "head"
  }
}
```

这个设置适合一种常见场景：我们已经在本地完成了一部分改动或提交，希望 Claude 的子任务基于当前进度继续拆分，而不是从远端默认分支重新开始。

Claude Code 还支持将子代理（subagent）隔离到 worktree 中。我们可以要求 Claude “use worktrees for your agents”，也可以在自定义 subagent 的 Front Matter 中配置 `isolation: worktree`。这样，每个子代理都会获得自己的临时 worktree，适合并行探索多个方案、拆分多个模块，或者让不同代理分别修复不同测试失败。

同样需要注意 `.gitignore` 文件。Claude Code 支持在仓库根目录创建 `.worktreeinclude` 文件，用 `.gitignore` 语法声明哪些已被 Git 忽略的本地文件需要复制进新 worktree。例如：

```text
.env
.env.local
config/secrets.json
```

这对前端项目、后端服务，以及依赖本地密钥的测试环境尤其重要。否则 Agent 在 worktree 中运行测试或启动服务时，可能会因为缺少环境变量而失败。

在清理策略上，Claude Code 会根据 worktree 中是否存在未提交修改、未跟踪文件或新提交来决定是否自动清理。没有变更的临时 worktree 可以被自动删除；有变更的 worktree 会提示保留或删除；非交互式 `claude -p --worktree` 创建的 worktree 不会自动清理，需要使用 `git worktree remove` 手动删除。

### 二者的共同点与差异

Codex 和 Claude Code 使用 worktree 的目标是一致的：让多个 Agent 任务在同一个仓库中并行运行，并隔离文件修改。二者的差异更多体现在产品形态上：

| 对比项 | Codex | Claude Code |
| ---- | ---- | ---- |
| 主要入口 | Codex 中新建线程时选择 Worktree | CLI 中使用 `claude --worktree` |
| 核心抽象 | Local、Worktree、Handoff | worktree 会话、子代理 worktree |
| 典型用法 | 后台运行 Codex 任务，再 handoff 到 Local 检查 | 多个终端并行运行多个 Claude Code 会话 |
| 默认分支行为 | 创建线程时选择起始分支，默认在 detached HEAD 工作 | 默认基于 `origin/HEAD`，可配置为本地 `HEAD` |
| 本地忽略文件 | 本地托管 worktree 场景可通过 `.worktreeinclude` 处理 | 通过 `.worktreeinclude` 复制已被 Git 忽略的文件 |
| 清理方式 | 通过 App 工作流管理 worktree 和线程 | 根据会话状态提示或自动清理，也可手动 `git worktree remove` |

这也解释了为什么 AI Coding Agent 让 git worktree 重新变得重要：过去使用 worktree，主要是为了让人类工程师并行开发；现在使用 worktree，是为了让人和多个 Agent 能够同时在同一个仓库里协作，而不互相污染工作现场。

!!! note "Agent 时代的 worktree 使用原则"
    只要一个任务可能长时间运行、可能修改大量文件、可能启动服务或运行测试，就应该优先考虑把它放进独立 worktree。即使 Agent 走错方向，也不会破坏我们当前的工作现场。

## 参考文献

[^1]: [Git 2.5, including multiple worktrees and triangular workflows](https://github.blog/open-source/git/git-2-5-including-multiple-worktrees-and-triangular-workflows/)
[^2]: [git-worktree](https://git-scm.com/docs/git-worktree)
[^3]: [Git Worktree vs Branch - What Developers Actually Need to Know](https://www.worktreewise.com/blog/git-worktree-vs-branch)
[^4]: [Worktrees - Codex app](https://developers.openai.com/codex/app/worktrees)
[^5]: [Run parallel sessions with worktrees - Claude Code](https://code.claude.com/docs/en/worktrees)
