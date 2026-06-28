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

正如在 [如何利用 Harness “一句话交付产品功能”？](/2026/05/28/How-to-Achieve-One-Command-Feature-Delivery-with-Harness/) 一文中所提到的那样，我们可以做到在单个 `clone` 仓库中利用 Harness Engineering 实现需求的自动实现。但是当这个目录正在编写代码的时候，我们能做的只能是等待。

如果我们想要同时开发另外的功能，我们只能重新 `clone` 到一个新的目录。这个过程太麻烦了，我们不想来回 `clone` 与 `merge`，我们期待能有新的解决方案来更方便的实现并行开发。于是，我们发现了 git worktree 这个特性。

<!--more-->

git worktree 是 Git 中非常有趣的一个特性，自从 2015 年发布该特性的 10 年多的时间里[^1]，git worktree 一直都是鲜为人知的存在。如果不是 AI Coding Agent 的快速发展，我想，git worktree 将会一直停留在 Git 的发布日志中。

## Git Worktree 简介
根据 Git 的官方文档[^2]：git worktree 用于在同一仓库中管理多个工作目录。

在单个 Git 仓库的多个分支之间进行切换，或者在本地为某个 Git 仓库创建第二个克隆（clone）目录是一件容易的事。通过如上的方式，我们可以同时在不同的分支上工作，例如：在一个克隆中启动耗时较长的测试，同时在另一个克隆中继续进行新功能的开发。然而，维护一个仓库的多个克隆意味着我们需要付出额外的精力来保持这些克隆版本之间的同步。

git worktree 可以创建与现有 Git 仓库关联的新的工作目录。每个工作目录（*linked working tree*）看起来像一个独立仓库，但其实不是完整仓库。它只是有自己的一份代码目录，背后仍然共用主仓库的 Git 数据。git worktree 目录中的 .git 实际上是一个文件，指向了主仓库的历史记录和引用（references）。

![](2.png)

## Linked Working Tree
在 git worktree 中，需要理解两个关键的概念：
* **主工作目录（Main Working Tree）**：通过 git clone 或 git init 命令创建的原始 Git 仓库目录为主工作目录，该目录包含完整的 .git 目录，是所有链接工作目录的 “母体”。
* **链接工作目录（Linked Working Tree）**：通过 git worktree add 命令创建的工作目录，不包含独立的 .git 目录，而是通过一个 .git 文件链接到主工作目录的 .git 目录，实现与主仓库的关联和资源共享。

## 创建 worktree
假设我们正在 `feature` 分支上开发一个功能，这时突然有用户提交了一个需要在 `main` 分支上紧急修复的 Bug。如果不使用 worktree，我们需要做如下的操作：
1. 暂存 `feature` 的所有改动，并把工作区恢复成干净状态
2. 切换到 `main` 分支，然后创建一个新的分支 `hotfix`
3. 在 `hotfix` 分支上修复 Bug，并提交
4. 切换回 `feature` 分支，并回复之前的改动

```bash
git stash
git checkout main
git checkout -b hotfix
# 修 bug，提交修复
git checkout feature
git stash pop
```

整个操作过程还是非常繁琐的，而使用 worktree 则可以简化这个流程。我们可以使用 `git worktree add` 命令来创建一个新的 worktree。

```bash
git worktree add ../project-hotfix -b hotfix main
```

然后，我们就得到了两个目录：

```bash
project/        # 继续开发 feature
hotfix/         # 专门修 Bug
```

我们可以分别在 `project` 和 `hotfix` 目录中进行开发和修复工作，而不要繁琐的分支切换。

## 查看 worktree
若要查看主仓库下所有关联的 worktree 清单，则可以使用 `git worktree list` 命令来一目了然的查看所有并行工作目录、对应绑定分支、仓库路径。该命令会输出：每一个工作目录的本地路径、提交哈希值，以及该目录当前检出的分支名称。

![](3.png)

## 删除 worktree
为了保持 Git 工作目录的整洁，我们需要时不时的删除无用的工作目录。可以使用 `git worktree remove` 命令删除指定的工作目录。例如，当我们在 `hotfix` 工作目录上修复完 bug 后，我们就可以删除该工作目录。

```bash
git worktree remove ../hotfix
```

如上的命令会做两件事：
1. 删除该 worktree 目录下所有代码文件
2. 自动从仓库的 worktree 注册表清除记录

如果某个工作目录内存在未提交的修改，Git 默认不允许我们删除该工作目录。此时，我们可以使用 `--force` 参数解除这一限制。和所有 `-f` 参数的使用场景一样，执行前务必谨慎，充分确认操作后果，再绕过 Git 的安全防护机制。

```bash
git worktree remove --force ../hotfix
```

## worktree 与 brance
git branch 和 git worktree 不是同一层面的东西[^3]：

* branch 是代码版本线，branch 要解决的问题是——基于某个版本开一条新的开发线。
* worktree 是把某个版本线检出到一个独立目录里工作，worktree 要解决的问题是——同时打开多个分支工作，而不用来回 checkout。

```bash
Git 仓库
├── branch: main
├── branch: feature/1
├── branch: fix/bug-123
└── worktree:
    ├── 当前目录       -> main
    ├── ../f1-dev  -> feature/1
    └── ../bugfix     -> fix/bug-123
```

| 对比项 | branch | worktree |
| ---- | ---- | ---- |
| 本质 | 一条提交线 / 指针 | 一个独立工作目录 |
| 解决问题 | 管理不同开发线 | 同时在多个开发线工作 |
| 是否占用目录 | 不占独立目录 | 会创建独立目录 |
| 是否可以同时打开多个 | 分支可以有很多，但当前目录只能 checkout 一个 | 可以多个目录同时 checkout 不同分支 |
| 典型命令 | `git branch` / `git checkout` / `git switch` | `git worktree add` / `git worktree list` / `git worktree remove` |

!!! note "branch 是“版本线”，worktree 是“工作现场”"
    worktree 不是 branch 的替代品，worktree 通常是把某个 branch 检出到另一个目录。


## 何时使用 worktree

在 AI Coding Agent 出现之前，工程师通常只并行做一个（或者少量）任务，此时用 branch 就够了。但是，当我们需要同时处理多个任务（3个以上）时，用 worktree 就会更舒服，比如：

* 一个目录跑主需求开发
* 一个目录修线上 bug
* 一个目录跑升级依赖实验
* 一个目录做代码评审验证
* ……

## 参考文献
[^1]: [Git 2.5, including multiple worktrees and triangular workflows](https://github.blog/open-source/git/git-2-5-including-multiple-worktrees-and-triangular-workflows/)
[^2]: [git-worktree](https://git-scm.com/docs/git-worktree)
[^3]: [Git Worktree vs Branch - What Developers Actually Need to Know](https://www.worktreewise.com/blog/git-worktree-vs-branch)
