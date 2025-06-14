---
title: 在阿里云上部署 Vui 语音模型
reward: false
top: false
date: 2025-06-14 10:32:41
authors:
  - 王伟
  - 马海亮
categories:
  - LLM
tags:
  - TTS
  - Vui
  - DSW
---

![](tts-basics.jpg)

6 月初，Fluxions-AI 团队在 GitHub 上开源了一款轻量级、可在设备端运行的语音对话模型：[Vui](https://github.com/fluxions-ai/vui)。Vui 语音模型基于 [Llama transformer](https://huggingface.co/docs/transformers/en/model_doc/llama) 架构来预测下一个语音 token。据 Fluxions-AI 团队介绍，他们在 [2 张 4090](https://x.com/harrycblum/status/1752698806184063153) 显卡上完成了 Vui 的训练，并且提供了 3 个不同的模型。Vui训练成本极低，参数量也较小，可以支持语气词的拟人化模拟，在生成效果上更自然、更逼真，并且还支持两人对话的语音生成，非常适合语聊、生成播客语音内容、采访/访谈配音等场景。

<!-- more -->

在 Vui 的推理代码中，使用了 `from_pretrained()` 或者 `hf_hub_download()` 等方法直接从 HuggingFace Hub 下载模型文件。但是由于各种原因，如上的方式在模型部署的时候可能会存在一些问题，导致在部署在线推理代码时存在异常。一般而言，HuggingFace Hub 上的大部分模型文件都可以在 [ModelScope](https://modelscope.cn/) 上找到，所以我们可以先从 ModelScope 上下载模型文件，然后修改 Vui 的推理代码，从而实现推理代码的部署。

本文将介绍如何在阿里云 PAI-DSW 上部署 Vui 模型。

## 下载 Vui 推理代码
```bash
cd /mnt/workspace
git clone https://github.com/fluxions-ai/vui.git
```

## 修改 Vui.vad 代码
Vui 项目中，用到了基于深度学习的语音活动检测（VAD, Voice Activity Detection）模型 `pyannote/voice-activity-detection`，该模型的加载和处理位于 [src/vui/vad.py](https://github.com/fluxions-ai/vui/blob/main/src/vui/vad.py) 代码文件。

```python
# 模型权重文件
VAD_SEGMENTATION_URL = "https://whisperx.s3.eu-west-2.amazonaws.com/model_weights/segmentation/0b5b3216d60a2d32fc086b47ea8c67589aaeb26b7e07fcbe620d6d0b83e209ea/pytorch_model.bin"

# 加载并构造一个包含模型、特征处理器、后处理等步骤的完整语音活动检测的 pipeline
pipeline = None
pipeline_name = "pyannote/voice-activity-detection"
```

首先，代码中的 `VAD_SEGMENTATION_URL` 中指定的 URL 目前已经失效。

![](whisperx_error.png)

参考 [pyannote/voice-activity-detection 的 Model Card](https://huggingface.co/pyannote/voice-activity-detection)，我们发现了如下的提示：

```python
# 1. visit hf.co/pyannote/segmentation and accept user conditions
# 2. visit hf.co/settings/tokens to create an access token
# 3. instantiate pretrained voice activity detection pipeline

from pyannote.audio import Pipeline
pipeline = Pipeline.from_pretrained("pyannote/voice-activity-detection",
                                    use_auth_token="ACCESS_TOKEN_GOES_HERE")
output = pipeline("audio.wav")

for speech in output.get_timeline().support():
    # active speech between speech.start and speech.end
    ...
```

所以，首先我们需要在 Hugging Face 的 [pyannote/segmentation](https://huggingface.co/pyannote/segmentation) 页面接受模型的使用条款。然后在 [Settings](https://huggingface.co/settings/tokens) 页面上创建一个新的 Access Token，并将 [pyannote/segmentation](https://huggingface.co/pyannote/segmentation) 和 [pyannote/voice-activity-detection](https://huggingface.co/pyannote/voice-activity-detection) 这两个模型的访问权限授予该 Token。

然后，我们使用如下的代码将 [pyannote/segmentation](https://huggingface.co/pyannote/segmentation) 模型的权重文件下载到本地：

```bash
cd /mnt/workspace/vui
modelscope download --model pyannote/segmentation --local-dir segmentation
cd segmentation && cp pytorch_model.bin whisperx-vad-segmentation.bin
```

最后修改 `src/vui/vad.py` 中的代码，在 detect_voice_activity:from_pretrained(pipeline_name) 中传入刚刚创建的 Access Token：

```python
pipeline = Pipeline.from_pretrained(pipeline_name,
                                    use_auth_token="{huggingface_access_token}")
```

同时，修改 `load_vad_model()` 中的模型加载本地下载好的模型，避免直接从 URL 或者 Hugging Face Hub 加载模型。

```python
if model_fp is None:
    model_fp = os.path.join("/mnt/workspace/vui/segmentation/", "whisperx-vad-segmentation.bin")
```

!!! note "HuggingFace 代理"
    对于 pyannote.audio.Pipeline.from_pretrained() 方法，默认是从 Hugging Face Hub 加载一个预训练的 VAD pipeline，如果无法访问 Hugging Face Hub，可以尝试采用 [hf-mirror](https://hf-mirror.com/) 的方法。

    ```bash
    export HF_ENDPOINT=https://hf-mirror.com
    ```

    如果模型文件非常小，或者采用类似于 `pyannote.audio.Pipeline.from_pretraine()` 的方法需要直接从 Hugging Face Hub 上加载模型文件，可以使用 [hf-mirror](https://hf-mirror.com/) 的代理服务。
    
    除非不得已，否则不建议直接从 Hugging Face Hub 下载模型文件，如果对应的模型在 ModelScope 也存在，建议直接从 ModelScope 上下载。

## 修改 Vui.model 代码
Vui 项目中，使用了 Google 发布的 [byt5-small](https://huggingface.co/google/byt5-small) 模型，为了避免直接从 Hugging Face Hub 上下载模型文件，我们首先手动从 ModelScope 下载该模型，然后修改 Vui 中的 AutoTokenizer 的加载方式：

```bash
cd /mnt/workspace/vui
modelscope download --model google/byt5-small --local-dir byt5-small
```

```python
class Vui(nn.Module):
    BASE = "vui-100m-base.pt"
    COHOST = "vui-cohost-100m.pt"
    ABRAHAM = "vui-abraham-100m.pt"

    def __init__(self, config: Config = Config()):
        super().__init__()
        self.codec = Fluac.from_pretrained()
        self.config = config
        cfg = config.model
        self.tokenizer = AutoTokenizer.from_pretrained("/mnt/workspace/vui/byt5-small")    
```

## 下载 Vui 模型文件

```bash
# 目前 ModelScope 上还未提供 Vui 模型文件
cd /mnt/workspace/models
huggingface-cli download --resume-download fluxions/vui --local-dir vui

# 将模型文件复制到 Vui 的代码目录下
cd /mnt/workspace/vui/src/vui && cp -r /mnt/workspace/models/vui/*.pt .
```

## 申请公网 IP
根据 [使用阿里云PAI-DSW快速部署模型](/2025/05/04/Quickly-Deploy-the-LLM-Model-Using-Aliyun-PAI-DSW/) 中的 **在公网中访问实例中的服务** 部分的说明，为 DSW 实例申请一个公网 IP。

修改 `vui/demo.py` 中的代码，在启动 gradio 服务时，指定服务端口：

```python
demo.launch(server_name="0.0.0.0", server_port=8080)
```

## 启动 Vui 服务
```bash
conda create -n vui python=3.12
conda activate vui
cd /mnt/workspace/vui && pip install -e .
python demo.py
```

![](vui_demo_1.jpg)

## 为什么要申请公网 IP
在阿里云 PAI-DSW 上部署模型时，默认情况下实例是没有公网 IP 的，这意味着外部无法直接访问实例中的服务。为了方便开发者可以通过浏览器通过 WEB UI 访问 DSW 实例中的服务，阿里云提供了一个代理域名。为了安全性，该代理域名只允许在启动 DSW 实例的浏览器中访问，例如 `https://935142-proxy-8080.dsw-gateway-cn-hangzhou.data.aliyun.com/`。

![](vui_demo_2_2.png)

!!! note "注意"
    此处，需要特别注意，阿里云提供的代理域名是 `https` 协议的域名。

但是，我们在 DSW 实例中，启动的 gradio 服务却是 `http` 协议的服务。

![](vui_demo_2_1.png)

这就导致，当我们在浏览器中通过 gradio 体验 Vui 的模型效果时，出现了 `https` 的 URL 请求了 `http` 的资源的场景，进而导致浏览器的安全策略阻止了 `http` 的请求。

![](vui_demo_3.jpg)

而该 `http` 的请求正式 Vui 模型生成的语音文件，进而导致无法实现在线播放的效果。

![](vui_demo_4.png)

## 后记

当我们遇到这个问题的时候，我们一直以为是 Vui 模型在推理的过程中出现了异常，导致无法生成语音文件。经过一番排查后，我们才发现问题的根源在于浏览器的安全策略阻止了 `http` 的请求。实际上，Vui 已经生成了语音文件，并且可以通过 `https` 的 URL 访问到该语音文件。只是我们在启动 gradio 服务时，使用了 `http` 协议，所以 gradio 通过 `SSE` 协议返回的语音地址是 `http` 协议的 URL。

![](gradio_data.png)

我们尝试了多种方法，希望能修改 gradio 的代码，以便当以 `http` 启动 gradio 服务时，返回的语音地址是 `https` 协议的 URL，但是都没有成功。

最终，我们还是决定申请一个公网 IP，这样就可以直接通过公网 IP 访问 DSW 实例中的服务。


