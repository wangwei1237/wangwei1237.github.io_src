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
### 启动 DSW 实例
在 [人工智能平台PAI-控制台](https://pai.console.aliyun.com/) 中找到我们申请的 PAI-DSW 实例，并启动。

![](start_dsw.png)

`ssh dsw-<instanceID>` 远程连接到 DSW 实例。

![](connect_dsw.png)

### 安装 llama.cpp
克隆 llama.cpp 的代码仓库并进入到 llama.cpp 目录：

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
```

根据 [Build llama.cpp locally-CUDA](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#cuda) 文档中的说明，编译 CUDA 版本的 llama.cpp。DSW 实例中已经安装了 CUDA 12.1 的驱动，其安装目录位于 /usr/local/cuda-12.1，所以我们可以直接使用 `cmake -DGGML_CUDA=ON` 命令来编译 CUDA 版本的 llama.cpp。如果在编译过程提示找不到 CUDA 的头文件和库文件，我们可以通过 `cmake -DCMAKE_CUDA_COMPILER=/usr/local/cuda-12.1/bin/nvcc` 命令来指定 CUDA 的安装目录。

```bash
mkdir build
cmake -B build -DGGMML_CUDA=ON -DCMAKE_CUDA_COMPILER=/usr/local/cuda-12.1/bin/nvcc
cmake --build build --config Release
```

编译完成后，我们可以在 build/bin 目录下找到编译好的可执行文件。

![](llama.cpp_cmd.cpp.png)

我们可以使用 llama.cpp 目录下的 `convert-hf-to-gguf.py` 脚本将 Qwen3-4B 的模型文件转换为 GGUF 格式的模型文件。我们可以在 [ModelScope](https://modelscope.cn/models) 上找到 Qwen3-4B 的模型文件，下载完成后，使用 `convert-hf-to-gguf.py` 脚本进行转换。在使用 `convert-hf-to-gguf.py` 之前，我们需要首先安装相关的依赖库：

```bash
cd llama.cpp
pip install -r requirements.txt
```

### 下载 Qwen3-4B 模型文件
使用 `modelscope` 命令下载 Qwen3-4B 模型文件：

```bash
cd /mnt/workspace/models/
modelscope download --model Qwen/Qwen3-4B --local_dir ./Qwen3-4B
```

![](ms_download_llm.png)

从图中可以看到，下载 Qwen3-4B 模型文件的速度非常快，最高的下载速度达到了 200MB/s，对于 Qwen3-4B 这样的 7GB 的模型文件，基本上不到 1 分钟就可以下载完成。

使用 `convert-hf-to-gguf.py` 脚本将 Qwen3-4B 模型文件转换为 GGUF 格式的模型文件：

```bash
cd llama.cpp
python3 convert_hf_to_gguf.py /mnt/workspace/models/Qwen3-4B
```

![](GGUF.png)

### llama-cli 运行 Qwen3-4B
通过 `llama-cli` 启动 Qwen3-4B 的交互模式，以便我们可以通过命令行与模型进行交互。

```bash
llama-cli -m /mnt/workspace/models/Qwen3-4B/Qwen3-4B-F16.gguf \
 --jinja \ 
 --color \
 -ngl 99 \
 -fa \
 -sm row \
 --temp 0.6 \
 --top-k 20 \
 --top-p 0.95 \
 --min-p 0 \
 -c 40960 \
 -n 32768 \
 --no-context-shift
```

* -m：指定加载的 GGUF 模型文件
* --jinja：启用 Jinja 模板支持，用于 prompt 模版，如 chat 模式
* --color：使用颜色输出
* -ngl：使用最多可用 GPU 层数，尽可能多地将模型加载到 GPU，从而加速推理
* -fa：启用 Flash Attention，提升注意力机制性能，需要 GPU 支持
* -sm row：启用 row-wise attention 排布优化，row 表示矩阵行优先计算
* --temp：指定温度值，控制随机性，值越小越确定，值越大越随机
* --top-k：指定 top-k 采样
* --top-p：指定 top-p 采样
* --min-p：指定罕见词的概率限制
* -c：指定上下文的 tokens 长度
* -n：指定生成的 token 数量
* --no-context-shift：禁用“滑动窗口”机制，保持固定上下文，适合多轮对话或长文本生成

![](llama_cli.png)

### llama-server 运行 Qwen3-8B
通过 `llama-server` 启动 Qwen3-4B 的服务端，以便可以通过 OpenAI 规范的 API 进行调用。

```bash
./llama-server -m /mnt/workspace/models/Qwen3-4B/Qwen3-4B-F16.gguf \
 --jinja \
 --reasoning-format deepseek \
 -ngl 99 \
 -fa \
 -sm row \
 --temp 0.6 \
 --top-k 20 \
 --top-p 0.95 \
 --min-p 0 \
 -c 40960 \
 -n 32768 \
 --no-context-shift \
 --port 8080
```

我们把 `curl` 请求组织在脚本 `qwen34b.sh` 中，脚本内容如下：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat/completions' \
 --header 'Content-Type: application/json' \
 --header 'appid;' \
 --data-raw '{"model":"Qwen3-4B","messages":[{"role":"user","content":"Strawberry里有几个 r"}],"stream": false}'
```

`sh qwen34b.sh` 的结果如下：

![](llama_server.png)





