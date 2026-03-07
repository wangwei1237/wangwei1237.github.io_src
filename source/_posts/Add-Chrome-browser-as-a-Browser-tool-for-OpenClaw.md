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

在 [OpenClaw 初体验](/2026/02/22/First-Experience-with-OpenClaw/) 中，我在阿里云的 ECS 主机上部署了 OpenClaw，并用它做了些初步的尝试。有时候，可能想浏览某些网页，但是这些网页在手机上的浏览体验又不好，所以此时就可以通过 IM 软件让 OpenClaw 调用 Chrome 浏览器来帮我们打开页面并截图。

我想每天上班的时候扫一眼 Github Trending 的内容（我在手机上没法直接访问这个页面，当然也有方法，但是我嫌麻烦），这个时候就可以通过 OpenClaw 调用 Chrome 浏览器来打开这个页面并截图发给我了。

<!--more-->

![](github_trends.png)

在纯净的 Ubuntu 22.04 云主机上以 `root` 用户安装 Chrome 浏览器并配置 OpenClaw 时，我遇到了不少的坑。本文将详细记录在云主机上从零配置 OpenClaw + Chrome 环境的全过程，避免大家遇到那些让人抓狂的“权限坑”。

## 1. Chrome 安装避坑

我在 Ubuntu 22.04 上安装 Chrome 时最开始的方式是执行：`apt install chromium-browser`。**务必立刻停止这个操作！**

**deb to snap transition**：

* 从 Ubuntu 19.10 开始，Canonical 将 chromium-browser 做成了过渡包（transitional package），该包并不包含真正的 DEB 程序，仅包含包装脚本、桌面文件和依赖声明，并明确依赖 snapd 和 chromium Snap 包。[^1]

* 因此 `apt install chromium-browser` 命令安装的 Chrome 实际上是 [Snap](https://snapcraft.io/) 版本的 Chrome。若系统未安装 snapd，该过渡包会先通过 apt 安装 snapd，再从 Snap Store 拉取 Chromium。

而 Snap 拥有极其严苛的 AppArmor 沙箱隔离[^2]，其默认规则就是：禁止访问任何系统敏感目录和其他用户目录。`/root` 目录是超级用户目录，属于最高敏感路径，因此，AppArmor 会直接拦截对其目录下的文件访问请求[^3]：
* 读：deny
* 写：deny
* 执行：deny
* 列出文件：deny

!!! note "安装官方原生 DEB 版 Google Chrome"
    1. 彻底卸载可能存在的 Snap 版 Chromium
    ```bash
    sudo apt remove --purge chromium-browser -y
    sudo snap remove chromium
    ```

    2. 下载并安装官方原生 Chrome
    ```bash
    # 下载 Google Chrome 官方最新稳定版
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

    # 通过 apt 安装（自动解析并安装底层的图形/字体依赖）
    sudo apt install ./google-chrome-stable_current_amd64.deb -y
    ```

    3. 安装中文字体（防止截图变“豆腐块”）
    ```bash
    sudo apt install -y fonts-noto-cjk
    ```


## 2. 配置 OpenClaw

安装完 Chrome 浏览器后，必须在 OpenClaw 的网关配置中为 Browser 工具开放权限，并解决云主机 `root` 运行的核心安全冲突。

### 2.1 开启 browser 工具权限
OpenClaw 从 3.2 版本开始对工具调用实施了更严格的权限控制，从而希望有效解决饱受诟病的安全问题。针对工具调用的安全控制能力，OpenClaw 3.2 版本增加了：精细化的工具访问控制、执行环境隔离、运行时行为约束等安全策略[^4]。

{% twitter https://x.com/wangwei1237/status/2028981937843650602 %}

另外，根据 OpenClaw 官方文档的描述[^5]：

> OpenClaw can run a dedicated Chrome/Brave/Edge/Chromium profile that the agent controls. 
> It is isolated from your personal browser and is managed through a small local control service inside the Gateway (loopback only).

OpenClaw 支持在 `openclaw.json` 中通过 `tools.allow`、`tools.deny` 全局配置工具的黑白名单，并且黑名单优先级高于白名单，从而阻止没有权限的工具发送给模型，进而避免无权限的工具的执行。

因此，需要首先在全局配置文件 `~/.openclaw/openclaw.json` 中把 `browser` 工具加入白名单：

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

### 2.2 关闭沙箱（No-Sandbox）限制
沙箱是 Chrome 的核心安全机制。当 Chrome 打开一个网页时，它会把网页里的 HTML 渲染、JavaScript 执行等操作，全都关进一个“隔离的 Sandbox” 里运行。[^6]

而在 Linux 的世界中，`root` 是拥有绝对权限的超级用户，如果以 `root` 身份运行 Chrome，这就产生了一个巨大的安全悖论：

> 沙箱的存在是为了限制权限，但 `root` 账号却偏偏拥有无限权限

因此，在 Chrome 中，有一条硬性规定：检测到当前用户是 `root` 账号时，浏览器会直接退出，绝不在 `root` 下带着沙箱运行，没有意义。[^7]

> Running as root without --no-sandbox is not supported. 

但是对于 docker 容器来说，容器已经对安全性做了控制与隔离，因此在容器内以 `root` 用户运行 Chrome 是没有问题的。此时可以使用 `--no-sandbox` 参数来关闭沙箱，从而以 `root` 用户身份运行 Chrome。

同样的，当在 `root` 账号下用 OpenClaw 控制浏览器时，也必须在 OpenClaw 配置中显式关闭沙箱限制：

```bash
openclaw config set browser.noSandbox true
```

### 2.3 重启网关
配置完成后，重启 OpenClaw 网关服务：

```bash
openclaw gateway restart
```

## 3. snapshot 与 screenshot
可以用如下的命令来验证浏览器工具是否可用：

```
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://www.baidu.com
openclaw browser --browser-profile openclaw snapshot
```

* **Snapshot 提取结构化文本**：如果需要提取页面的可读内容，我们可以执行 `snapshot` 动作。这个操作会返回当前网页完整的 HTML 字符串、JSON 格式的 DOM 树结构，非常适合让 LLM 对其进行总结与分析。

  ```bash
  openclaw browser --browser-profile openclaw snapshot
  ```

* **Screenshot 截取视觉画面**：如果需要真实的网页截图，需要执行 `screenshot` 动作。该动作会在底层执行截屏，并返回一个包含媒体路径的图像块（image block + MEDIA:<path>）。执行命令后，控制台会返回图片在服务器上的绝对路径，我们可以通过 `cp` 命令将其拷贝并下载查看。

  ```bash
  openclaw browser --browser-profile openclaw screenshot
  ```

## 参考文献
[^1]: [Chromium in Ubuntu – deb to snap transition](https://ubuntu.com/blog/chromium-in-ubuntu-deb-to-snap-transition)
[^2]: [Snap System architecture](https://snapcraft.io/docs/reference/system-architecture/)
[^3]: [Snap confinement](https://snapcraft.io/docs/explanation/security/snap-confinement/index.html)
[^4]: [OpenClaw Tools](https://docs.openclaw.ai/tools)
[^5]: [OpenClaw Browser Tool](https://docs.openclaw.ai/tools/browser)
[^6]: [Chrome Sandbox](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/design/sandbox.md)
[^7]: [Exit instead of crashing when running as root without --no-sandbox](https://issues.chromium.org/issues/40480798)