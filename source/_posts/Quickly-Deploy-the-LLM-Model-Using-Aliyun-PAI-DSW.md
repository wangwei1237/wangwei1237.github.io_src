---
title: 使用阿里云PAI-DSW快速部署模型
reward: false
top: false
date: 2025-05-04 16:43:52
authors:
categories:
  - LLM
tags:
  - PAI-DSW
  - 模型部署
  - GPU
---

![](1.png)

自从 2025 年 1 月 20 日，DeepSeek-R1 发布以来，大模型行业经历了 DeepSeek 的火爆、经历了大模型厂商的密集迭代和发布、更经历了开源大模型生态的快速发展和壮大。

尤其是，开源大模型厂商会同时发布多种不同参数量的模型以满足不同的应用场景，例如 2025 年 1 月 26 日，阿里发布的 [Qwen2.5-VL 系列模型](https://qwenlm.github.io/blog/qwen2.5-vl/) 就同时提供了 3B、7B、72B 三个不同参数量的版本。以 [Qwen2.5-VL-3B-Instruct](https://modelscope.cn/models/Qwen/Qwen2.5-VL-3B-Instruct/summary) 为例，其模型文件的大小仅为 7GB 左右，这使得我们可以类似 [RTX 4080](https://www.nvidia.cn/geforce/graphics-cards/40-series/rtx-4080-family/) 这样的消费级显卡上去部署 Qwen2.5-VL-3B，以体验其模型能力。

但是，如果连 [RTX 4080](https://www.nvidia.cn/geforce/graphics-cards/40-series/rtx-4080-family/) 这样的消费级显卡都没有，或者说我们并不想购买一张显卡来部署模型，那么我们又如何来部署模型呢？另外，虽然 Qwen2.5-VL-3B 的模型文件大小仅为 7GB 左右，但是如果我们的网络带宽比较低的时候，下载模型文件也会是一个比较耗时的过程。

<!-- more -->

所以，模型参数量变小之后，我们部署模型的门槛虽然看起来降低了，但因为显卡的缺乏、网络带宽的不足、基础环境的依赖——python版本、pytorch 版本、CUDA 驱动——等诸多因素，实际上我们部署模型的门槛并没有降低。

## PAI-DSW 的特点
PAI-DSW 是阿里云为算法开发者量身打造的云端深度学习开发环境，内置 JupyterLab、WebIDE 及 Terminal，无需任何运维配置即可编写、调试及运行 Python 代码。

在 PAI-DSW 中，还预装了 `ModelScope Library` 以方便我们便捷的使用 [ModelScope](https://modelscope.cn/models) 上的模型，同时还会提供不同的基础环境镜像供我们选择，我们可以根据自己的需求选择不同的基础环境镜像，例如镜像 modelscope:1.25.0-pytorch2.6.0-gpu-py311-cu124-ubuntu22.04 中指定了：

* modelscope 版本为 1.25.0
* pytorch 版本为 2.6.0
* python 版本为 3.11
* CUDA 版本为 12.4
* ubuntu 版本为 22.04
* 其他 gpu 基础配置

最后，PAI-DSW 还提供了 GPU 计算资源我们使用，我们可以根据自己的需求选择不同的 GPU 计算资源，一般来说，选择 NVIDIA A10 计算资源就可以满足大部分 10B 参数规模的或者部分的量化模型的部署需求。对于 NVIDIA A10 GPU，PAI-DSW 会提供 1 * NVIDIA A10、2 * NVIDA A10、4 * NVIDA A10 三种计算资源，我们可以根据自己的部署需求选择不同的 GPU 计算资源。目前，PAI-DSW 支持的 GPU 计算资源有：

* NVIDIA A10
* NVIDIA RTX 6000
* NVIDIA V100
* NVIDIA T4
* NVIDIA P100

总之，通过 ModelScope Library 和 PAI-DSW，我们可以在云端快速部署模型，避免了 GPU 的缺乏、网络带宽的不足、基础环境的依赖等诸多因素对我们部署模型的影响。

## 申请 PAI-DSW 实例
API-DSW 提供了 每月 250 计算时（大约 35 个小时）、共计 3 个月的 [免费试用](https://free.aliyun.com/?spm=5176.14094288.J_8006650780.5.606f130eQcWdIW&productCode=learn)额度，这对于新手来说，是一个非常好的福利。

![](201.png)

我们可以在 [交互式建模 PAI-DSW](https://www.aliyun.com/activity/bigdata/pai/dsw) 页面根据需求申请 PAI-DSW 实例，我选择的是 **模型开发 按量付费** 的方式，对于该方式，会优先使用免费额度（免费额度仅支持部分 GPU 资源配置），免费额度用完后会按量付费。

![](202.png)

点击 **立即购买** 后，在新的页面中，根据需求选择不同的 GPU 计算资源和基础环境镜像，然后点击 **下一步** 并 **创建实例** 即可完成 PAI-DSW 实例的申请。

![](203.png)

申请完毕后，我们可以在 [人工智能平台PAI-控制台](https://pai.console.aliyun.com/) 中查看到我们申请的 PAI-DSW 实例。

![](pai-dsw-instance.png)

启动 PAI-DSW 实例后，我们就可以点击 **打开** 按钮，进入到 PAI-DSW 的在线开发环境，在关闭 PAI-DSW 实例前，我们可以点击 **制作镜像** 来保存当前的环境，以方便下次启动实例时可以保存我们当前的操作和环境配置。在我的使用过程中，这一点非常有用也非常便利。

## 使用本地 Terminal 连接 DSW 实例
如果希望通过本地工具（VSCode 或 Terminal）远程连接 DSW 实例并进行机器学习开发，可以使用 DSW 提供的 ProxyClient 客户端代理工具。ProxyClient 工具允许我们通过 SSH 远程连接 DSW 实例，实现本地与 DSW 实例的连接。

具体的操作步骤可以参考 [PAI-DSW 的官方文档——ProxyClient方式](https://help.aliyun.com/zh/pai/user-guide/connect-to-a-dsw-instance-over-ssh?spm=a2c4g.11186623.0.0.5a6c22dazl9cXN)，这里不再赘述。

!!! warning "无法使用 ProxyClient 的特殊场景"
    在我的使用过程中，我发现在某些特殊的场景下，处于安全性的控制，我们是无法使用 ProxyClient 的，例如：使用 [LLaMa-Factory](https://github.com/hiyouga/LLaMA-Factory) 的 [WebUI](https://llamafactory.readthedocs.io/en/latest/getting_started/webui.html) 进行模型的微调时，此时必须使用在线的方式打开 DSW 实例，才能打开 LLaMa-Factory 的 WebUI 界面。

## 使用 llama.cpp 部署 Qwen3-4B




