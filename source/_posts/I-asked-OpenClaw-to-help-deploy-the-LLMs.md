---
title: 我让 OpenClaw 🦞 帮我部署模型
reward: false
top: false
date: 2026-03-13 17:53:42
authors:
categories:
  - LLM
tags:
  - OpenClaw
  - 模型部署
---

![](1.png)

在 [我让 OpenClaw 🦞 为我当 OP](/2026/03/08/I-let-OpenClaw-do-OP-for-me/) 这篇文章中，我介绍了我是如何让 OpenClaw 帮我管理服务器集群的。

过了几天，我就开始想搞一点更复杂的事情。既然 OpenClaw 都可以帮我管理服务器集群了，那为什么不能让它帮我部署模型呢？反正我每次部署模型不也是先登录 GPU 服务器，然后在上面执行各种 CLI 操作（下载模型、配置虚拟环境、下载依赖……）？并且每次遇到部署问题时，我也是截个图直接丢给大模型……

<!--more-->

## 调教之旅
于是，我开始了我的调教 OpenClaw 并让它帮我部署模型之旅。整体的体验过程还是非常不错的。

虽然 LLMs 能力对 Linux 命令很熟悉，对模型部署的流程也很熟悉，对部署报错的排查也很熟悉……但是它对我服务器集群的细节并不熟悉。

于是我先开始告诉 OpenClaw 我的服务器集群的细节，包括：
- 如何在远程服务器上执行命令
- 服务器的初始环境配置都有哪些：比如 Conda 配置、网络代理配置、可用的 vllm 环境……

但是，在告诉它这些信息的时候，我没有把这些信息一股脑直接丢给 OpenClaw，我讨厌“填鸭式”教学，我也不想我的 🦞 接受这种方式的知识灌输。

**1. 我先从一个问题开始了我的调教之旅：**

```bash
给你一台 8 卡的 A100 机器，你会部署一个 qwen3.5 的模型吗？
```

![](3.png)

你看，虽然我给他的输入还有错别字，但是它已经可以理解我的意思了，并且开始尝试回答了。然后它根据自己的知识，给了我一个部署流程。

![](4.png)

**2. 输入服务器知识，让 🦞 优化部署步骤：**

```bash
1. 机器上是多人共用的，所以为了避免影响其他人，我们用conda工具为每个带部署的模型提供一个conda 虚拟环境。
2. 我们采用vllm的方式来部署模型。
3. 模型文件，我们采用modelscope下载到本地的方式，下载根路径统一放在 /home/work/models/ 中。

请根据这些信息重新整理一下模型部署的步骤。
```

![](5.png)

**3. 在执行中提供更多信息：**
部署流程对不对，得执行一下才知道，然后我让 OpenClaw 去目标服务器执行它写的部署流程，然后我再根据执行的结果不听的告诉它其他的额外信息。

![](6_7.jpg)

!!! note "除非必要，绝不多嘴"
    只有当执行过程出现网络异常的时候，我才会告诉它：服务器上要如何配置网络代理。否则，我是绝对不会提供这种冗余的信息的。

就像下面要讲到的端口占用的问题一样，OpenClaw 自己就可以解决掉，根本不需要我多嘴。

![](8.png)


就这样，经过几次尝试，大概 30 分钟之后，OpenClaw 就在和我的聊天中，帮我把 QWen3.5-0.8B 部署到了我的服务器。而我在整个过程中，除了和 OpenClaw 聊天外，我什么也没做。我没有登录我的服务器，我也没有手写任何的命令，连部署之后的服务可用性测试都是 OpenClaw 帮我做的。

![](2.png)

## 沉淀成 Skill
虽然我的 🦞 又获得了一项新技能，但是对于没有经过类似调教的 OpenClaw 来说，再经过一次类似的过程还是比较麻烦的。如果能把模型部署的 SOP 沉淀为 [Skill](/2025/12/24/Reflections-on-Agent-Skills/)，别的 🦞 挂载上这个 Skill，就会即刻拥有模型部署的能力。

在 [MCP is dead. Long live the CLI](https://ejholmes.github.io/2026/02/28/mcp-is-dead-long-live-the-cli.html) 这篇文章中，作者提到：

> The best tools are the ones that work for both humans and machines. CLIs have had decades of design iteration. They’re composable, debuggable, and they piggyback on auth systems that already exist.
> 
> MCP tried to build a better abstraction. Turns out we already had a pretty good one.

> {%twitter https://x.com/wangwei1237/status/2028715565985255635 %}

我们已经看到，越来越多的框架或者产品都开始弃用 MCP 转而支持 CLI：
* OpenClaw 不支持 MCP
* Pi 也不支持 MCP
* 甚至连卖 MCP 服务器的 [Perplexity 也不再支持 MCP](https://mp.weixin.qq.com/s/lsAbbq3VSOubE6P_7vCFgg)
> 3月11日，Perplexity 的联合创始人兼 CTO Denis Yarats 在自家开发者大会上说，公司内部已经不用 MCP 了，转向了 API 和 CLI。

所以，在我和 OpenClaw 的聊天过程中，我就让他把部署的流程写成了一个 shell 脚本，实际执行部署时执行的就是那个部署脚本。于是，当我让 OpenClaw 根据聊天内容生成模型部署 Skill 时，生成的 Skill 本就是一个 `业务流说明` + `CLI` 的组合。

我也不想给他一系列的接口文档和命令说明，让他在运行时实时写代码并执行，而是直接给他一个它自己写的 CLI 脚本，让它直接执行。这样，可控性和稳定性会更高。

于是，我让 OpenClaw 帮我生成了一个模型部署的 Skill：

```bash
你能把刚才咱们的过程整理成一个模型部署的skill吗？
把shell作为改shell的一个脚本文件。
把整理好的skill放在/home/work/wangwei17/model-deploy目录
```

并且，很快，OpenClaw 就生成了一个模型部署的 Skill：

![](10_11.jpg)

我稍加修改，就得到了一个可以直接使用的模型部署的 Skill——[**model-deploy**](https://github.com/wangwei1237/wangwei1237.github.io_src/tree/master/source/_posts/I-asked-OpenClaw-to-help-deploy-the-LLMs/model-deploy)。

> 备注：该 Skill 在 MiniMax-M2.5 上测试通过，可以点击 [链接]((https://github.com/wangwei1237/wangwei1237.github.io_src/tree/master/source/_posts/I-asked-OpenClaw-to-help-deploy-the-LLMs/model-deploy)) 获取该 Skill 的代码。

我把该 Skill 挂载到我的 OpenClaw 实例上，然后让它帮我部署模型。为了避免大模型使用 Session 会话中的对话历史获取知识，而没有从 `model-deploy` 技能获取知识，我首先用 `/new` 指令创建了一个新的对话 Session。

![](12.jpg)

🦞 能够知道它可以用 `model-deploy` 技能来部署模型，并且当部署过程中遇到 GPU 内存不足时，他还会问我怎么处理……
整个过程，除了给 🦞 发布部署任务外，我就只和它通信了一次：告诉他在卡 2 上部署，仅此而已。

## 思考与总结
当然，`model-deploy` 这个 Skill 并不是完美的，它只能在 vLLM 推理引擎上部署 Qwen 系模型，但是这已经是一个非常有趣的开端了。

只能控制一台服务器的 🦞 再厉害也仅仅是一个玩具。**链接即智能**，当 🦞 可以控制更大规模的集群的时候，它才能释放出无限的潜能，给与我们更大的想象空间。

实践之后我发现：**Skill 是看起来简单，但是要写好是一件非常难的事情**。虽然，我在文章中说：

> 我稍加修改，就得到了一个可以直接使用的模型部署的 Skill。

但是，说实话，我还是花了一些时间来修改这个 Skill 的，并没有像我说的那样那么轻松、简单。

另外，这个 Skill 我也仅仅在 MiniMax-M2.5 模型上测试通过，还没有在更大范围的模型上测试，有可能换个模型该 Skill 就不能用了。

所以，如何构建出一个可用的、稳健的、好用的 Skill 是一个值得深入探讨的问题，还需要做更多的尝试。正如谷歌在 [SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks](https://arxiv.org/html/2602.12670v1) 中发现的那样：

> our evaluation yields four key findings: 
> (1) **curated Skills** provide substantial but variable benefit (+16.2 percentage points average, with high variance across domains and configurations); 
> (2) **self-generated Skills** provide negligible or negative benefit (–1.3pp average), demonstrating that effective Skills require human-curated domain expertise;  

{%twitter https://x.com/wangwei1237/status/2030430467829444670%}


