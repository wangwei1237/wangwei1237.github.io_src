---
title: 音频质量评估中的 ABX 测试
reward: false
top: false
date: 2024-04-04 22:05:15
authors:
categories:
  - 音频技术
tags:
  - 音频质量评估
  - ABX
---

![](1.jpeg)

在音频编解码中，经常需要判断经过不同的编解码算法、参数而生成的音频在人的感知层面是否存在差异。虽然 [成对打分](2023/08/12/the-interesting-elo-rating-system/) 也可以用于这种场景，但是成对比较的结果可能会涉及到很多无意识的影响因素，例如不同受试者的经验、心情等。如果受试者采用随机选择的策略，对于成对比较而言，则缺乏有效的手段来对其进行识别。

<!--more-->

## 成对打分法的缺点
我们可以在成对打分中引入**锚点样本**来评估受试者的打分是否置信，但是为了避免评估过程中的感知疲劳对受试者带来干扰，我们引入的**锚点样本**必须控制在一定量级，比如 2 个。

!!! note 锚点样本
    锚点样本指的是在一个待评估的样本序列中，随机插入的、有明显质量差异的、有预先设定好打分的样本。

在评估过程中，一组样本（A，B）要么是有差异的，要么是没有差异的，因此结果是一个典型的[伯努利分布](https://baike.baidu.com/item/0%E2%80%941%E5%88%86%E5%B8%83)。当锚点样本数量为 2 时，我们可以使用如下的代码来计算随机因素下的打分正确的概率：

```python
from scipy.stats import binom

for k in range(3):
    x = binom.pmf(k, 2, 0.5)
    print(x)

# 0.25 0.5 0.25
```

可知，即便两个锚点样本的打分都是正确的，那么也可能有 25% 的概率是受试者在随机打分的情况下做出的选择。

## ABX 测试
和 **成对打分** 类似，ABX 测试是一种判断两个信号（例如视觉、听觉、嗅觉等信号）之间是否存在感知差异的一种评估方法。

在 ABX 测试中，会先将两个已知的样本（分别为样本A和样本B）呈现给受试者，然后从A、B中随机选择一个样本作为未知样本 X 呈现给受试者。受试者的目标就是根据自己的感知体验来判断 X 究竟是 A 还是 B。如果在一定次数的测试中，受试者无法以较低的 $p$ 值可靠地识别出 X，则不能否定零假设——即没有足够的证据证明 A 与 B 之间存在可感知的差异。

在 ABX 测试中，样本 A 和 样本 B 均是在样本 X 之前呈现给受试者，所以受试者无需依赖长期记忆或过去的经验来辨别差异，这可以消除其他评估方式中存在的无意识影响因素。

同时，在 ABX 测试中，除了传统的正确率指标外，还会通过 $p$ 值来进行假设检验，从而可以最大程度的避免随机因素带来的误差的概率，进而使得评估的结果更为置信。

ABX 测试最早是由贝尔实验室的两位研究人员 W.a.Munson 和 Mark B.Gardner 在 1950 年发表的 *Standardizing Auditory Tests* 这篇论文中提出的音频测试方法[^ABX]。在这篇论文中，作者提到：ABX 测试其实就是一种成对比较方式的变体。
> The procedure, which we have called the “ABX” test, is a modification of the method of paired comparisons.

## ABX 结果的统计分析
在论文 *Statistical Analysis of ABX Results Using Signal Detection Theory* 中，作者提到：虽然 ABX 测试作为一种简单、直观的评估音频之间是否存在可感知的差异的测试方法已经存在了几十年，但是在目前的 ABX 测试中，评估者却很少披露评估结果的统计分析结果，这导致 ABX 测试的结论缺乏相应的置信度和可解释性[^SA_ABX]]。

因此，在 ABX 测试中，除了一般的聚合指标外，还需要对评估结果进行统计推断，以获得更可信的评估结果。例如 [ABXTEST.COM](https://abxtests.com/) 提供的 ABX 测试中，就会包含 $p$ 值计算结果[^abxtest]。

如前所述，ABX 测试中的打分结果如下表所示：

| 样本 X 来源 | 受试者选择 A | 受试者选择 B |
| :--: | :-: | :-: | 
| A | 正确 | 错误 | 
| B | 错误 | 正确 | 

因此，ABX 测试的结果本质上是一个伯努利分布：要么打分正确，要么打分错误。其结果的概率密度函数（*PMF: probability mass function*）如下所示：

$$
f(k) = C_{n}^{k}p^{k}(1-p)^{n-k}
$$

其中，$n$ 表示实验次数，$k$ 表示正确次数，$p$ 表示每次实验正确的概率。

### 概率密度函数
如果某次 ABX 测试包含 10 个测试样本，某个受试者打分正确的样本个数为 8，那么能说明 A 与 B 之间存在可感知的差异吗？一个用户可以以 80%（8/10）的正确率来识别出样本 X 的来源，这么高的正确率难道还不足以证明 A 与 B 之间存在可感知的差异吗？

我们可以用如下的代码计算 10 次实验所对应的伯努利的概率分布图：

```python
import matplotlib.pyplot as plt 
import scipy.stats

X = []
Y = []

for i in range(11):
    Y.append(stats.binom.pmf(i, 10, 0.5))
    X.append(i)
plt.bar(X, Y)
plt.show()
```

![图1 概率分布](10_binom_p_d.png)

从 图1 中可以看出，如果假设（$H_0$）受试者是按照完全随机的情况来打分，那么出现 8 次打分正确的概率就是 0.044（4.4%），这看起来确实是一个比较小的概率。换句话说，如果出现了 8 次正确的打分的情况，那么该结果是受试者按照完全随机的情况来打分的概率是 4.4%，这个概率比出现 7 次正确打分的概率（11.7%）要更置信。

那么对于不同实验次数的情况，我们是否要求 80% 的打分正确率才能拒绝 $H_0$ 呢？

我们可以使用如下的代码获取在置信度为 95% 的情况下，不同的实验次数至少需要出现多少次正确的打分才能拒绝 $H_0$：

```python
import scipy.stats 

for i in range(10, 26):
    p_value = stats.binom.interval(0.95, i, 0.5)
    print(i, p_value[1], p_value[1] * 1.0 / i)
```

具体结果如下：
| 实验次数 | 10 | 20 | 40 | 80 | 160 | 
| :--: | :-: | :-: | :-: | :-: | :-: | 
| 最小正确次数 | 8 | 14 | 26 | 49 | 92 | 
| 最小正确率 | 80% | 70% | 65% | 61.25% | 57.5% | 

可见，当实验次数为 40 的时候，我们只需要 65% 的打分正确率就可以达到 95% 的置信度。

### 累积概率分布
然后，我们可以利用如下的代码计算 10 次实验对应的伯努利的累积概率分布（*CDF: cumulative distribution function*）和逆累积概率分布（*ICDF: inverse cumulative distribution function*）：
```python
import scipy.stats

X = []
PMF = []
CDF = [] 
ICDF = []

for i in range(11):
    PMF.append(scipy.stats.binom.pmf(i, 10, 0.5))
    CDF.append(scipy.stats.binom.cdf(i, 10, 0.5))
    X.append(i)

ICDF.append(1)
for i in range(10):
    ICDF.append(1 - CDF[i])
```

![图2 累积概率分布和逆累积概率分布](CDF_ICDF.jpg)

从 图2 中可以看出，当实验次数为 10 次时，至少有 8 次打分正确的概率为 5.5%，也就是说，如果受试者在随机打分的情况下，其至少有 8 次打分正确的概率是 5.5%，而当正确打分次数提升至 9 次时，其概率则降低为 1.1%。

### 伯努利分布的 p 值
我们可以对观察到的打分结果样本计算其 $p$ 值，从而来判断是否存在足够的观测正确来允许我们拒绝 $H_0$。

根据 *Improving Your Statistical Inferences* 中的 第一章中对 $p$ 值的介绍：

> 在区分信号和噪点时，$p$ 值是作为防止被随机因素诱导的第一道防线。
> 
> 并且有迹象表明，禁止使用 $p$ 值将会使得研究者更容易做出错误结论。
> 
> 研究者提出差异性说明时，如果假设检验方法使用得当，是可以有效控制研究者自欺欺人的。

```python
import matplotlib.pyplot as plt
import scipy.stats

k = []
p = []

for i in range(11):
    p_value = scipy.stats.binomtest(i, 10, 0.5)
    k.append(i)
    p.append(p_value.pvalue)

plt.bar(k, p)
plt.show()
```

![图3 对于 10 次实验，不同成功次数对应的 p 值](p_value.png)

从 图3 中可以看出，当实验次数为 10 次时，如果有 8 次打分正确时，其 $p$ 值是 10.9%，而有 9 次正确打分时，其 $p$ 值为 2.1%。如果我们取 $\alpha = 0.05$，则当正确打分次数为 9 次时，我们认为此时存在足够的证据拒绝 $H_0$，即认为 A 与 B 之间存在可感知的差异。 当然，从概率的角度来说，即便是 9 次打分正确也是存在受试者随机打分的可能性，只是我们说这种可能性比较小而已。

因此，在 ABX 测试报告中，除了聚类类统计信息外，我们还需要披露更多的统计推断的指标，例如 $p$ 值，$\alpha$ 值，置信区间等，以便让结果更具备可解释性。

## ABX 测试需要关注的事项




## 参考文献
[^ABX]: [Standardizing Auditory Tests](https://pubs.aip.org/asa/jasa/article/22/5_Supplement/675/625412/Standardizing-Auditory-Tests)
[^SA_ABX]: [Statistical Analysis of ABX Results Using Signal Detection Theory](https://www.researchgate.net/publication/267193579_Statistical_Analysis_of_ABX_Results_Using_Signal_Detection_Theory)
[^abxtest]: [abxtests.com/](https://abxtests.com/)
[^abx_user_manual]: [QSC ABX Comparator User Manual](https://www.manualslib.com/manual/513767/Qsc-Abx-Comparator.html)
[^p_value]: [Using p-values to test a hypothesis](https://lakens.github.io/statistical_inferences/01-pvalue.html)



