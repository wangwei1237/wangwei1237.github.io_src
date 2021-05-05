---
title: 如何在MacOS下编译vmaf并训练自己的模型
reward: false
top: false
date: 2021-03-24 14:51:28
authors:
categories:
  - IVQA
tags:
  - VMAF
---
[VMAF](https://github.com/Netflix/vmaf)是Netflix开发的、用于评估视频感知质量的算法。VMAF包括一个独立的C语言库libvmaf及其对该库的Python包装。在Python库中，还提供了一组工具，以方便用户可以训练和测试自定义的VMAF模型。目前为止，在工业实践中，VMAF是视频质量评估领域中最优秀的全参考评估算法。

但是，在MacOS上编译并使用VMAF的过程中，发现会有一些问题导致无法编译成功，并且和模型训练相关的python代码也存在某些小的冲突，导致在整个模型训练的过程会出现某些异常。

本文就是对自己在调试过程中遇到的问题的总结。

![](1.jpeg)

<!--more-->

我所使用的VMAF的版本为commit id为[6f1f0c98](https://github.com/Netflix/vmaf/commit/6f1f0c98845e4e9c34ae0bdfa00aee5c91fa6e0c)的这次提交。遇到的所有问题也都是基于这次提交，这一点要额外注意。主要解决的问题和具体的解决方法可以参考文章接下来的部分。

## libvmaf test/tools链接问题
在编译libvmaf的`C`库的时候，发现当编译`test`和`tools`目录下的文件时，会出现异常。

经过排查以后，发现是对应的编译产出的链接库出现了异常。在编译时，如果配置`default_library`为`both`，则会产出libvmaf的静态链接库和动态链接库，并且在产出`test`和`tools`相关对象时，会优先选择采用静态链接库进行链编。具体如下所示：

```
vmaf = executable(
    'vmaf',
    ...
    link_with : get_option('default_library') == 'both' ? libvmaf.get_static_lib() : libvmaf,
    ...
)
```

不确定为什么这里采用静态链接库时会出现异常，但是把静态链接库改成动态链接库之后，整个工程就可以成功编译了。至于原因，等有时间再仔细定位一下。

```
vmaf = executable(
    'vmaf',
    ...
    link_with : libvmaf,
    ...
)
```

## libsvm库的路径设置问题
在使用python目录下提供的相关工具进行模型训练的时候，最终会使用`python/vmaf/svmutil.py`来实现对`libsvm`库的调用，进而根据训练数据产出`SVM`的模型文件。

但是，在`svmutil.py`中会配置`libsvm`库的路径，默认情况下，这个路径的配置如下：

```
libsvm_path = VmafConfig.root_path('third_party', 'libsvm', 'python')
```

而实际上，在我所编译的机器上，使用`pip3 install libsvm`之后，`libsvm`的路径并非是如上指定的路径，因此会导致在调用`libsvm`时出现异常，根据自己编译机器的具体情况，修改`libsvm_path`的路径即可解决问题，具体如下：

```
libsvm_path = VmafConfig.root_path('site-packages', 'libsvm')
```

## Matplotlib中设置backend为agg带来的问题
关于Matplotlib中的backend相关的问题，此处不再详细展开，具体可以参见[matplotlib的backends以及非交互式绘图](/2020/04/28/Matplotlib-s-backends-and-non-interactive-backends-for-rendering/)。

默认情况下，在vmaf中，Matplotlib的backend会设置为agg模式。例如，在[python/vmaf/script/run_vmaf_training.py](https://github.com/Netflix/vmaf/blob/master/python/vmaf/script/run_vmaf_training.py)中，就进行了相关的配置：

```
#!/usr/bin/env python3

import matplotlib
matplotlib.use('Agg')
```

在使用`libsvm`训练完模型之后，会对VMAF的`SRCC`，`PCC`等指标进行计算，并利用`python/vmaf/config.py`中的`DisplayConfig.show()`最终调用`matplotlib`来进行结果的可视化展现。但是，在`DisplayConfig.show()`中，却是使用是否存在参数`write_to_dir`来判断调用什么`backends`，这就会和之前的`Agg`配置出现冲突，因此这里需要做一个简单的升级，如下所示：

```
if matplotlib.rcParams['backend'] == 'agg':
    if 'write_to_dir' in kwargs:
        format = kwargs['format'] if 'format' in kwargs else 'png'
        filedir = kwargs['write_to_dir'] if kwargs['write_to_dir'] is not None else VmafConfig.workspace_path('output')
        os.makedirs(filedir, exist_ok=True)
        for fignum in plt.get_fignums():
            fig = plt.figure(fignum)
            fig.savefig(os.path.join(filedir, str(fignum) + '.' + format), format=format)
    else:
        format = 'png'
        filedir = VmafConfig.workspace_path('output')
        os.makedirs(filedir, exist_ok=True)
        for fignum in plt.get_fignums():
            fig = plt.figure(fignum)
            fig.savefig(os.path.join(filedir, str(fignum) + '.' + format), format=format)
else:
    plt.show()
```

实际上，只有在MacOS上才会出现该问题，因此更合理的方式是根据系统来设置Matplotlib的backends，而不是直接修改Config类。具体可以参考[这里的讨论](https://github.com/Netflix/vmaf/pull/852)。

## libvmaf的特征和python中使用的特征的差异
#### libvmaf种各特征的类型
默认情况下，编译出来的libvmaf库使用的是integer类型的特征，具体如`meson_option.txt`所示：

```
option('enable_float',
    type: 'boolean',
    value: false,
    description: 'Compile floating-point feature extractors into the library')
```

#### python训练模型时各特征的类型
在使用python来训练模型时，会根据`run_vmaf_training.py`指定的特征文件来确定是抽取`float`类型的特征还是`integer`类型的特征。

当`feature_dict`的key为`VMAF_integer_feature`时，则抽取的是`integer`类型的特征，当key为`VMAF_feature`时，抽取的为`float`类型的特征。具体的判断逻辑位于[feature_assembler.py](https://github.com/Netflix/vmaf/blob/master/python/vmaf/core/feature_assembler.py)中的`FeatureAssembler.run()`。

```python
''' 抽取各特征的integer类型特征
feature_dict = {
    'VMAF_integer_feature': ['vif_scale0', 
                             'vif_scale1', 
                             'vif_scale2', 
                             'vif_scale3', 
                             'adm2', 
                             'motion']
}

''' 抽取各特征的float类型特征
feature_dict = {
    'VMAF_feature': ['vif_scale0', 
                             'vif_scale1', 
                             'vif_scale2', 
                             'vif_scale3', 
                             'adm2', 
                             'motion']
}
```

#### 保持libvmaf和python的对应
因此，在自己训练模型的时候要特别注意：务必保证libvmaf和python两处的特征类型必须对应起来。
1. 可以修改`meson_option.txt`的配置，让`libvmaf`的float类型的特征生效，此时需要使用`feature_dict['VMAF_feature']`来训练模型。

    ```
    option('enable_float',
        type: 'boolean',
        value: true,
        description: 'Compile floating-point feature extractors into the library')
    ```
    如上的所有改动，可以参考[update.diff](update.diff)。

2. 当然，也可以在编译的时候使用`-Denable_float=true`来开启float类型的特征支持。
    ```
    meson setup build -Denable_float=true
    ```
3. 使用`feature_dict['VMAF_integer_feature']`来训练模型，此时不需要修改libvmaf的编译脚本。但是需要修改[feature_extractor.py](https://github.com/Netflix/vmaf/blob/master/python/vmaf/core/feature_extractor.py)，将`VmafIntegerFeatureExtractor`类中的`float_ansnr`特征去掉。具体如下所示：

    ```
    ExternalProgramCaller.call_vmafexec_multi_features(
        ['adm', 'vif', 'motion'],
        yuv_type, ref_path, dis_path, w, h, log_file_path, logger, options={
            'adm': {'debug': True},
            'vif': {'debug': True},
            'motion': {'debug': True},
        }
    )
    ```
