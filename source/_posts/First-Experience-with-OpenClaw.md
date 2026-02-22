---
title: OpenClaw 初体验
reward: false
top: false
date: 2026-02-22 10:06:08
authors:
categories:
  - LLM
tags:
  - OpenClaw
  - Clawdbot
---

![](1.jpg)

2026 年初，除了基础大模型争相斗艳之外，在技术圈，一个名叫 OpenClaw 的 个人 AI 助手火出了天际，引爆了新一轮的 Agent 热潮。OpenClaw 的核心理念是让 AI 直接接管系统的读写与执行权限，并通过 Telegram、Discord 或 WhatsApp 等 IM 软件接收自然语言指令，然后再服务器上自动执行代码编写、文件管理、收发邮件等任务。通过 IM 软件下达任务，OpenClaw 会自己分析任务，然后自动执行任务，并返回执行结果。这才是我们一直在苦苦追求的 AI 个人助理。

<!--more-->

## 1. 什么是 OpenClaw
OpenClaw 是奥地利程序员 [Peter Steinberger](https://steipete.me/) 在 2025 年 11 月发布的开源项目。项目的最初命名为 Clawdbot，是一个能连通各种 API 和本地 Shell 的轻量级对话机器人原型。2026 年 1 月，Clawbot 在 GitHub 上突然爆火出圈，同时也顺便带火了 Mac mini，甚至有用户一口气买了 40 台 Mac mini，全部用来运行 Clawdbot。

{% twitter https://x.com/mikecantmiss/status/2015450752378908835 %}

就在 Clawdbot 爆发式增长的时候，Peter 收到了 Anthropic 的律师函：因为 Clawdbot 与 Anthropic 的大语言模型 Claude 太像，因此涉嫌商标侵权。2026 年 1 月 27 日，Peter 在 Discord 频道里召集社区成员进行头脑风暴，并最终为项目改名为 Moltbot。

![](clawdbot.png)

3 天后，Peter 觉得 Moltbot 读音感觉像是嘴里含了块石头，同时为了彻底规避未来的版权争议并彰显开源和自由的属性，再次为项目更名为 OpenClaw 并沿用至今。改名后的 OpenClaw 像火箭一样起飞：

* 1 月底：2K GitHub stars
* 2 月初：突破 100K  stars
* 2 月中旬：突破 180K  stars
* 2 月底：突破 200K stars

![](star-history-2026222.png)

2 月 4 日，Founder Park 搞了一场闭门活动，聚集了 130 多位 AI 创业者，来自 AI 游戏、AI Coding、Agent Memory、AI 硬件、AI 语音等不同赛道，分享了他们在上手用 Clawdbot 的感受和思考。[^2]

> Clawdbot 带来了一些和聊天不一样的「增量」。它的本质，是为你配了一台「云电脑」。第一次可以真正地指挥一个 AI 去增、删、改、查文件。这让 AI 从一个信息工具，变成了一个执行工具。

2 月 14 日，Peter 宣布加入 OpenAI，领导“下一代个人代理”的开发，OpenClaw 则转由开源基金会维护，确保项目永远自由和独立。[^1]

{% twitter https://x.com/steipete/status/2023154018714100102 %}

直到今天，OpenClaw 的热度依然不减：在 Google Trends 上，搜索趋势热度依然在 60 以上；微信公众号上关于 OpenClaw 的文章也多如牛毛。
![](google_trends.png)

即便如此，我想，依然有非常多的人和我一样，对 OpenClaw 的了解和认知还主要在别人的讨论中，依然没有亲自上手、真正体验。纸上得来终觉浅，绝知此事要躬行。

于是，在春节前的几天，我花了一些时间，亲自上手部署了 OpenClaw，并记录下了整个体验过程。

## 2. 为什么选择 ECS
1. 首先，我个人并不喜欢云厂商提供的一键部署服务，相反，我更喜欢在一台干净的服务器上，从零开始搭建自己的环境。
2. 其次，在 [在阿里云上部署 Vui 语音模型](/2025/06/14/Deploy-vui-audio-model/) 这篇文章中，我介绍了我在阿里云的 PAI-DSW 上部署 Vui 模型的经验，那时我就被阿里云的使用体验所折服。
3. 然后，对于新用户而言，阿里云提供了 [价值 300 元的免费 ECS 额度](https://www.aliyun.com/solution/tech-solution/clawdbot?spm=5176.29619931.nav-v2-dropdown-menu-2.d_main_0_0.45a610d7nAKirZ&scm=20140722.M_10963134.P_102.MO_4509-ID_10950062-MID_10950062-CID_10950062-ST_14271-V_1)。
4. 最后，阿里旗下的钉钉机器人已经有 Channel 插件支持通过钉钉和 OpenClaw 交互。

因此，当我决定要亲自体验一下 OpenClaw 的时候，我选择了阿里云的 ECS。

## 3. 在 ECS 上部署 OpenClaw
### 3.1 申请 ECS 主机
根据自己的需求选择合适的 ECS 实例配置，我选择了 2 核 4G 的 Ubuntu 22.04 作为 ECS 实例，在创建 ECS 实例时，阿里云会提供对应的公网 IP，这极大方便了后续的部署和访问。

![](ECS.png)

点击 `远程链接` 按钮，可以配置登录方式，我选择使用 SSH 密钥对登录并设置了登录的 `root` 密码。通过提供的公网 IP 和设置的密码，就可以通过 SSH 登录到 ECS 实例了。

![](ECS_login.png)

### 3.2 配置 ECS 的安全组
OpenClaw 运行依赖两个核心端口——18789 和 80：
* 18789 端口为网关通信与控制界面访问端口
* 80 端口用于部分 IM 平台的回调通信

因此，为了保障 OpenClaw 的可用性，ECS 主机启动后，需要在 `网络与安全组` 中对这两个端口进行配置，避免因端口拦截导致服务不可用。
 
![](ecs_port.png)

### 3.3 安装 Node 环境

```bash
snap install node --classic
npm config set registry https://registry.npmmirror.com
```

### 3.4 安装 OpenClaw
根据 [OpenClaw 官方文档](https://github.com/openclaw/openclaw) 安装 OpenClaw：

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

`向导程序` 会安装 OpenClaw 的网关守护进程（launchd/systemd 用户服务），并使其保持运行状态。在安装过程中，`向导程序` 会让我们配置各种参数：例如 IM 平台、所用的大模型、安装的插件……根据自己的需求进行配置即可。

安装完成之后，可以通过 `openclaw status` 查看 OpenClaw 的运行状态。

![](status.png)

### 3.5 配置 SSH 本地端口转发
为了方便本地访问 OpenClaw 的控制界面，可以通过 SSH 的本地端口转发功能，将 ECS 实例的 18789 端口转发到本地。

```bash
ssh -L 18789:localhost127.0.0.1:18789 root@<ECS公网IP>
```

!!! note 为什么要配置端口转发
    由于 OpenClaw 的控制界面是以 18789 端口作为访问端口，而该端口并非标准的 HTTP 协议端口，而是一个普通的 TCP 端口。因此，如果直接在本地浏览器访问：http://<ECS公网IP>:18789，无法访问 ECS 主机中的 OpenClaw 的控制界面。


![](openclaw_ui.png)

### 3.6 配置大模型
在阿里云的百炼平台申请对应模型的 `API-KEY`，在 openclaw.json 中增加大模型配置。

1.在 `models` 字段中增加大模型配置：

  ```json
  "models": {
    "providers": {
      "alibaba-cloud": {
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "apiKey": "<your-api-key>",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen3-coder-plus",
            "name": "Qwen Coder",
            "reasoning": false,
            "input": [
              "text"
            ],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 128000,
            "maxTokens": 8192
          },
          {
            "id": "qwen3-vl-plus",
            "name": "Qwen Vision",
            "reasoning": false,
            "input": [
              "text",
              "image"
            ],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 128000,
            "maxTokens": 8192
          }
        ]
      }
    }
  }
  ```

2.在 `agents` 字段中增加大模型配置：

  ```json
  "agents": {
    "defaults": {
      "model": {
        "primary": "alibaba-cloud/qwen3-coder-plus"
      },
      "models": {
        "alibaba-cloud/qwen3-coder-plus": {
          "alias": "qwen"
        },
        "alibaba-cloud/qwen3-vl-plus": {}
      },
    }
  }
  ```

### 3.7 配置钉钉机器人
根据 [阿里云 ECS 云服务器部署OpenClaw（Clawdbot）详细步骤流程](https://developer.aliyun.com/article/1710314) 中的 `钉钉对接流程` 部分创建钉钉机器人并进行配置。

根据 [openclaw-channel-dingtalk](https://github.com/soimy/openclaw-channel-dingtalk) 中的说明安装 DingTalk Channel 插件，并重启 OpenClaw 服务。

```bash
openclaw gateway restart
```

重启 OpenClaw 服务后，在 OpenClaw 控制界面中的 `Control`→`Channels`，用创建的钉钉机器人信息对 `DingTalk` 进行配置。

![](dingtalk.png)

### 3.8 测试
把钉钉机器人添加到钉钉群中，并在钉钉群中发送指令，测试 OpenClaw 的功能。

![](dingtalk_test1.png)


## 参考文献
[^1]: [OpenClaw, OpenAI and the future](https://steipete.me/posts/2026/openclaw)
[^2]: [闭门探讨：130位AI创业者，对Clawdbot和下一代AI产品的39条思考](https://mp.weixin.qq.com/s/9MKq3jRNsorCVnA6vWQIDg)


