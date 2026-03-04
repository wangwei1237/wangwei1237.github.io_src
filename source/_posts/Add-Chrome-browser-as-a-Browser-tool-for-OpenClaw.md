---
title: 为 OpneClaw 增加 Chrome 作为 Browser 工具
reward: false
top: false
date: 2026-03-04 20:40:37
authors:
  - 王伟
  - Gemini
categories:
  - LLM
tags:
  - OpenClaw
  - Chrome
  - Browser
---

![](openclaw_chrome.png)

在 [OpenClaw 初体验](/2026/02/22/First-Experience-with-OpenClaw/) 中，我在阿里云的 ECS 主机上部署了 OpenClaw，并用它做了些初步的尝试。有时候，可能想浏览某些网页，但是这些网页在手机上的浏览体验又不好，所以此时就可以通过 IM 软件让 OpenClaw 调用 Chrome 浏览器来帮我们打开页面并截图。比如我想每天上班的时候扫一眼 Github Trending 的内容，这个时候就可以通过 OpenClaw 调用 Chrome 浏览器来打开这个页面并截图发给我了。

<!--more-->

![](github_trends.png)

然而，在纯净的云主机（Ubuntu 22.04）上以 `root` 用户安装 Chrome 浏览器，并配置 OpenClaw 的过程中却遇到了很多坑。本文将详细记录在云主机上从零配置 OpenClaw + Chrome 环境的全过程，避免大家遇到那些让人抓狂的“权限坑”。

## 1. 环境准备与 Chrome 避坑安装

很多开发者在 Ubuntu 22.04 上的第一直觉是执行 `apt install chromium-browser`。**请立刻停止这个操作！**

Ubuntu 22.04 的源中，Chromium 默认被打包成了 Snap 格式。Snap 拥有极其严苛的 AppArmor 沙箱隔离，天生禁止访问 `/root` 目录。如果你在 root 下运行 OpenClaw，这会导致后续 Agent 试图写入用户数据（Profile）时彻底崩溃。

**正确的姿势：安装官方原生 DEB 版 Google Chrome。**

### 1.1 彻底卸载可能存在的 Snap 版 Chromium

```bash
sudo apt remove --purge chromium-browser -y
sudo snap remove chromium

```

### 1.2 下载并安装官方原生 Chrome

```bash
# 下载 Google Chrome 官方最新稳定版
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

# 通过 apt 安装（自动解析并安装底层的图形/字体依赖）
sudo apt install ./google-chrome-stable_current_amd64.deb -y

```

### 1.3 安装中文字体（防止截图变“豆腐块”）

对于国内云服务器，这一步不可或缺：

```bash
sudo apt install -y fonts-noto-cjk

```

## 2. 配置 OpenClaw 权限与核心参数

安装完底层浏览器后，必须在 OpenClaw 的网关配置中为其放行，并解决云主机 `root` 运行的核心安全冲突。

### 2.1 开启 browser 工具权限

OpenClaw 暴露了 `first-class agent tools`，其中 `browser` 工具专门用于控制受管的浏览器。打开全局配置文件 `~/.openclaw/openclaw.json`，将其加入白名单，可以使用 `tools.allow` 数组来实现：

```json
{
  "agents": {
    "defaults": {
      "tools": {
        "allow": ["exec", "shell", "browser", "web_fetch"] 
      }
    }
  }
}

```

### 2.2 注入免沙箱（No-Sandbox）灵魂配置

由于 Chrome 拒绝在 `root` 用户下带沙箱运行，必须在 OpenClaw 配置中显式关闭沙箱限制。在终端执行以下命令：

```bash
openclaw config set browser.noSandbox true

```

### 2.3 重启网关使配置生效

```bash
openclaw gateway restart

```

## 3. 实战测试：Snapshot 与 Screenshot 的区别

配置完成后，就可以通过 OpenClaw 命令行直接测试浏览器的核心动作了。

### 3.1 提取结构化文本（喂给大模型）

如果你需要提取页面的可读内容，执行 `snapshot` 动作。它会返回提取的 aria/ai 节点信息，适合让 LLM 进行总结分析：

```bash
openclaw browser --browser-profile openclaw snapshot

```

### 3.2 截取视觉画面（人类审核/图像识别）

如果你需要真实的网页截图，执行 `screenshot` 动作。该动作会在底层执行截屏，并返回一个包含媒体路径的图像块（image block + MEDIA:<path>）：

```bash
openclaw browser --browser-profile openclaw screenshot

```

*执行后，控制台会返回图片在服务器上的绝对路径，你可以通过 `cp` 命令将其拷贝并下载查看。*


