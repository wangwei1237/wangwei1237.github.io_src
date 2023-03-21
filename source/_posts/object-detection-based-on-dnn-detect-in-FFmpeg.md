---
title: FFmpeg中基于深度学习模型的目标检测
reward: false
top: false
date: 2021-04-27 16:21:49
authors:
categories:
  - 视频技术
tags:
  - FFmpeg
  - 目标检测
  - dnn_detect
---

![](1.png)

从FFmpeg的代码提交记录[**lavfi: add filter dnn_detect for object detection**](https://github.com/FFmpeg/FFmpeg/commit/aa9ffdaa1eaeb5e16fb6b89852f38ff488d81173)中，我们发现，FFmpeg已经以滤镜的形式提供了基于DNN的目标检测能力。

<!--more-->

## dnn_detect滤镜
在FFmpeg中，基于DNN的目标检测能力由`dnn_detect滤镜`（[vf_dnn_detect.c](https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/vf_dnn_detect.c)）提供。根据该能力的作者所提供的资料[*目标检测，FFmpeg中第一个基于深度学习模型的视频分析功能*](https://mp.weixin.qq.com/s?__biz=MzI3MjU1MjU1Mw==&mid=2247483828&idx=1&sn=df8fe902868ca2a0ea1cf50fff28ff95)可知：

> 当前目标检测只支持OpenVINO后端，后续还将尽快加入更多功能，比如基于TensorFlow模型的目标检测、支持OpenVINO后端的目标识别、目标检测和识别结果的可视化等。

根据[*目标检测，FFmpeg中第一个基于深度学习模型的视频分析功能*](https://mp.weixin.qq.com/s?__biz=MzI3MjU1MjU1Mw==&mid=2247483828&idx=1&sn=df8fe902868ca2a0ea1cf50fff28ff95)一文提供的demo可知，在当前的版本中，检测结果是通过`showinfo滤镜`以日志的形式输出的。

```shell
root@9d26c3a57bc7:/workspace# ffmpeg -i cici.jpg -vf dnn_detect=dnn_backend=openvino:model=face-detection-adas-0001.xml:input=data:output=detection_out:confidence=0.6:labels=face-detection-adas-0001.label,showinfo -f null -
...
[Parsed_showinfo_1 @ 0x561cf20c1f40]   side data - detection bounding boxes:
[Parsed_showinfo_1 @ 0x561cf20c1f40] source: face-detection-adas-0001.xml
[Parsed_showinfo_1 @ 0x561cf20c1f40] index: 0,  region: (1005, 813) -> (1086, 905), label: face, confidence: 10000/10000.
[Parsed_showinfo_1 @ 0x561cf20c1f40] index: 1,  region: (888, 839) -> (967, 926), label: face, confidence: 6917/10000.
...
```

日志格式的检测结果不利于直观的分析，因此我对该滤镜做了简单的修改，为其增加了检测结果框选的能力，以便可以更方便的评估`dnn_detect`的检测能力。具体效果如下所示：

![](2.jpg)

## dnn_detect滤镜的安装
#### 安装libtensorflow
从[https://storage.googleapis.com/tensorflow/](https://storage.googleapis.com/tensorflow/)中选择适合的libtensorflow版本下载即可，由于我是在MacOS上进行的实验，因此我选择了[libtensorflow/libtensorflow-cpu-darwin-x86_64-2.4.1.tar.gz](https://storage.googleapis.com/tensorflow/libtensorflow/libtensorflow-cpu-darwin-x86_64-2.4.1.tar.gz)。

```
cd workspace
wget https://storage.googleapis.com/tensorflow/libtensorflow/libtensorflow-cpu-darwin-x86_64-2.4.1.tar.gz --no-check-certificate
tar xzvf libtensorflow-cpu-darwin-x86_64-2.4.1.tar.gz
```

#### 安装openvino_toolkit
进入[openvino_toolkit的下载页面](https://software.intel.com/content/www/us/en/develop/tools/openvino-toolkit/download.html)，根据提示选择对应的版本下载并安装即可。MacOS的openvino_toolkit安装比较简单，下载对应的dmg文件之后，一路点击默认，然后安装就可以。默认会将相关的库文件安装在`/opt/intel/openvino_2021`目录。

#### 重新编译FFmpeg
* 拉取FFmpeg的master分支代码。
* 根据[vf_dnn_detect.7a6ea6ce2a.patch](https://gitee.com/wangwei1237/wangwei1237/blob/master/2021/04/27/object-detection-based-on-dnn-detect-in-FFmpeg/vf_dnn_detect.7a6ea6ce2a.patch)修改`dnn_detect`的代码。
* 设置相关的环境变量，如下所示：
    ```shell
    export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:\
    /opt/intel/openvino_2021/inference_engine/lib/intel64:\
    /opt/intel/openvino_2021/inference_engine/external/tbb/lib:\
    /opt/intel/openvino_2021/deployment_tools/ngraph/lib:\
    /workspace/tensorflow/lib:\
    /workspace/ffmpeg/outputs/lib

    export DYLD_LIBRARY_PATH=$DYLD_LIBRARY_PATH:\
    /workspace/ffmpeg/outputs/lib
    ```
* 编译FFmpeg
    ```
    ./configure --prefix=./outputs \
    ... \
    --enable-libtensorflow \
    --enable-libopenvino \
    --extra-cflags="-I/workspace/tensorflow/include -I/opt/intel/openvino_2021/inference_engine/include" \
    --extra-ldflags="-L/workspace/tensorflow/lib -L/opt/intel/openvino_2021/inference_engine/lib/intel64"

    make && make install
    ```

* 根据[*目标检测，FFmpeg中第一个基于深度学习模型的视频分析功能*](https://mp.weixin.qq.com/s?__biz=MzI3MjU1MjU1Mw==&mid=2247483828&idx=1&sn=df8fe902868ca2a0ea1cf50fff28ff95)中的demo下载对应的模型和相关文件，并使用ffplay播放。
    ```
    cd outputs && ./bin/ffplay -i test.mp4 \
    -vf "dnn_detect=dnn_backend=openvino:model=model/face-detection-adas-0001.xml:input=data:output=detection_out:confidence=0.6:labels=model/face-detection-adas-0001.label"
    ```

    ![](3.jpg)

## dnn_detect滤镜参数
从[vf_dnn_detect.c](https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/vf_dnn_detect.c)可知，`dnn_detect滤镜`的参数主要有：
* dnn_backend：控制dnn的后端，目前只支持openvivo
* confidence：dnn目标检测时的置信阈值，可以根据实际情况来设置
* labels：指定检测使用模型所对应的label文件路径
* model：指定检测使用模型所对应的model文件路径
* input：模型的输入
* output：模型的输出
* backend_configs, options：这两个参数都对应的是模型后端的相关配置
* async：设置是否启用异步的DNN接口，默认为异步

在使用中，可以根据自己的需要来设置滤镜的相关参数，进而达到自己的目的。例如，通过设置`async`来启用同步DNN接口，具体如下：

```
./bin/ffplay -i test.mp4 \
    -vf "dnn_detect=dnn_backend=openvino:model=model/face-detection-adas-0001.xml:input=data:output=detection_out:confidence=0.6:labels=model/face-detection-adas-0001.label:async=0"
```

## dnn_detect的其他模型
在如上的例子中，我们用人脸检测模型作为例子演示了FFmpeg中的DNN目标检测。实际上，作为一个通用的滤镜，替换模型之后，我们也可以用来进行其他类型的目标检测。

在[openvinotoolkit/open_model_zoo](https://github.com/openvinotoolkit/open_model_zoo)中，介绍了很多预训练好的模型，我们可以拿来直接用。各预训练模型可以从[download.01.org/opencv/](https://download.01.org/opencv/)下载。选择模型的时候，务必保证下载和所使用的OpenVINO版本对应的模型，否则，可能会导致加载模型失败的问题。

![](4.jpg)
