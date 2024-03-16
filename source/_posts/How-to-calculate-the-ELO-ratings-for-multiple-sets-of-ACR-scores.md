---
title: 如何计算多组 ACR 打分的 ELO 积分
reward: false
top: false
date: 2024-03-13 13:22:44
authors:
categories:
  - 算法与数学
tags:
  - ACR
  - Elo rating
---

![](1.jpeg)

在 [有趣的 Elo 积分系统](/2023/08/12/the-interesting-elo-rating-system/) 这篇文章中，我们介绍了 Elo 积分系统的基本原理，并介绍了我们如何在视频评估系统中采用 Elo 积分来评估不同编解码器之间的性能。不过，之前文章中介绍的是对于 ***成对打分*** 场景下应用  Elo 积分，在本文中，我们将介绍在 ***ACR 打分场景*** 下如何采用 Elo 积分评估不同方案的性能。
<!--more-->

## 背景
我们最近需要评估不同版本的 TTS 的表现效果，由于我们的评估系统 [度知了](/2023/02/13/duzhiliao/) 还不支持对纯音频的评估，因此我们需要把音频转换为视频，然后利用视频的评估方案对音频进行评估。

```bash
ffmpeg -f lavfi -i color=s=1920x1080:r=15:c='0x000000':d=5 \
-i INPUT.mp3 \
-map "0:v" -map "1:a" -acodec copy OUTPUT.mp4
```
在 *度知了* 中，采用 *成对评估法* 对视频进行打分时没有开放切换视频语音的能力（在视频评估中，我们认为音频效果并非核心关注点），因此我们需要采用接下来要介绍的 *ACR 打分法* 对音频进行打分。

于是，也就有了本文提到的问题：如何计算多组 ACR 打分的 Elo 积分？

## 什么是 ACR 打分？
[ACR（绝对等级评分）打分](https://wangwei1237.github.io/digital_video_concepts/docs/4_2_1_SubjectiveVideoQualityEvaluation.html) 是音、视频主观质量评估标准中的一种评估方法。在 ACR 的打分过程中，会逐个呈现测试序列中的每一个待评估样本，并针对每一个样本在质量等级量表内对其进行独立打分。ACR 也称之为单刺激方法，其中受试者观看、听取一个刺激（例如，视频剪辑、音频剪辑），然后对其进行独立评级。

在 我们的评估系统中，采用标准的 ACR 打分量级表：

| 分数 | 等级 | 解释 |
| :---: | :---: | :---: |
| 5 | Excellent | 优秀 |
| 4 | Good | 良好 |
| 3 | Fair | 普通 |
| 2 | Poor | 较差 |
| 1 | Bad | 差 |

针对每一个样本，我们会让至少 10 名用户按照如上的量级表进行打分，然后根据用户的打分（$S_{i,j}$，第 $i$ 个用户对第 $j$ 个样本的打分）得到每个样本的 $MOS_j$ 分（平均主观得分），最后我们会将 5 分制的 $MOS$ 分转换为 100 分制的 $MOS$ 分作为该样本的最终 $MOS$ 分。

$$
MOS_j = \big(\frac{1}{N} \sum_{i=1}^{N} S_{i,j} - 1 \big) \times 25
$$

## ACR 的评估方案
我们有两个不同版本的 TTS 模型，我们抽取了 100 个文本样本利用不同的模型分别生成了对应的音频样本 $sample_A$，$sample_B$，然后我们采用洗牌算法对两个样本进行打乱，然后招募用户对这些样本进行音频效果的 ACR 打分。

$$
sample = shuffle\big(\{sample_A, sample_B\}\big)
$$

用户打分完毕之后，我们会得到混合之后的样本的 $MOS$ 得分（$MOS_{sample}$），然后我们根据生成样本的 TTS 的模型的不同得到 A、B 两组 $MOS$ 打分：[$MOS_A$](https://github.com/wangwei1237/wangwei1237.github.io/blob/master/2024/03/13/How-to-calculate-the-ELO-ratings-for-multiple-sets-of-ACR-scores/code/mosA)，[$MOS_B$](https://github.com/wangwei1237/wangwei1237.github.io/blob/master/2024/03/13/How-to-calculate-the-ELO-ratings-for-multiple-sets-of-ACR-scores/code/mosB)。

## 根据 ACR 计算 Elo 积分
因为 ELo 本身具备**收敛过程**和**比赛顺序相关**等特点，因此我们采用了 [Bootstrap Sampling](https://online.stat.psu.edu/stat500/lesson/11/11.2/11.2.1) 方法来计算 Elo 积分。

为了保证样本的随机型，在每一次重抽样的过程中，我们会首先从 $MOS_A$ 和 $MOS_B$ 中随机抽取 $M$ 个样本，然后取其平均值作为该次对抗的 $MOS$ 分来计算 Elo 积分。

* STEP 1：从 $MOS_A$ 和 $MOS_B$ 中随机抽取 $M$ 个样本得到 $MOS_{A'}$ 和 $MOS_{B'}$
* STEP 2：计算 $MOS_{A'}$ 和 $MOS_{B'}$ 的平均值 $MOS_{A,i}$ 和 $MOS_{B,i}$
* STEP 3：利用 $Elo_{A,i}$ 和 $Elo_{B,i}$ 计算 Elo 积分
* STEP 4：重复如上步骤 $K$ 次，得到 $K$ 轮的 Elo 积分
* STEP 5：计算 $K$ 组 Elo 积分的平均值作为最终 Elo 积分

具体的代码如下所示：

```python
eloA = []
eloB = []

for i in tqdm(range(num_round), desc="bootstrap"):
    A = random.sample(mosA, batch_size)
    B = random.sample(mosB, batch_size)
    meanA = int(np.mean(A))
    meanB = int(np.mean(B))
    ratingA, ratingB = func_compute_elo(meanA, meanB, ratingA, ratingB)
    eloA.append(ratingA)
    eloB.append(ratingB)

eloA = np.mean(eloA)
eloB = np.mean(eloB)
```

完整的代码实现可以参考：
* [elo.py](https://github.com/wangwei1237/wangwei1237.github.io/blob/master/2024/03/13/How-to-calculate-the-ELO-ratings-for-multiple-sets-of-ACR-scores/code/elo.py)
* [utils.py](https://github.com/wangwei1237/wangwei1237.github.io/blob/master/2024/03/13/How-to-calculate-the-ELO-ratings-for-multiple-sets-of-ACR-scores/code/utils.py)
* [elo_test_acr.py](https://github.com/wangwei1237/wangwei1237.github.io/blob/master/2024/03/13/How-to-calculate-the-ELO-ratings-for-multiple-sets-of-ACR-scores/code/elo_test_acr.py)

根据我们的实验，当 bootstrap sampling 的轮数 $K$ 设置为 5000 时，Elo 的积分会趋于收敛和稳定。

例如对于相同打分的两组打分，抽样 5000 次的结果如下图所示：

![抽样 5000 次](bootstrap_5000.png)

而抽样 1000 次的结果如下图所示：

![抽样 1000 次](bootstrap_1000.png)

对于同样打分的两组样本而言，其最终的 Elo 积分应该是趋于一致的，从如上的结果对比也可以看出，当抽样 5000 次时，Elo 积分趋向于一致，也更为置信。