---
title: 如何根据历史胜负数据估计 Elo 打分？
reward: false
top: false
date: 2025-11-15 16:20:21
authors:
categories:
  - LLM
tags:
  - Elo
  - Bradley-Terry
  - Pairwise Comparisons
---

最近，Grok4.1 和 Gemini3 模型的发布都提到了人类偏好打分平台——LMArena 大模型竞技场：
* 在 LMArena 的 Text Arena 排行榜上，Grok 4.1 的推理模式（代号：quasarflux）以 1483 的 Elo 分数位居总榜首位，领先最高的非 xAI 模型整整 31 分[^1]。
* 刚一发布，Gemini 3就几乎屠榜所有评测集，以1501 Elo得分位列LMArena大模型竞技场第一[^2]。

通过对 LMArena 的榜单进行仔细分析，我们发现，不同于我们在 [有趣的 Elo 积分系统](/2023/08/12/the-interesting-elo-rating-system/) 中介绍的实时更新的 Elo 分数，LMArena 的 Elo 分数还提供了 95% 置信区间的估计，同时还提供了模型上下限能力的排序。

这种新颖的打分、排序方式引起了我们的兴趣，于是我们决定深入研究 LMArena 的 Elo 评分系统，了解其背后的原理和方法，从而可以对 LMArena 的榜单有更深入的理解。

![](1.png)
<!--more-->

## 成对打分
在 LMArena 平台，对于同一个 Query，平台会给出两个匿名模型的结果，然后让用户根据自己的偏好对这两个匿名模型的结果进行投票。

![](2.png)

如果不考虑 *两个模型差不多* 和 *两个模型都很差* 这两种情况，那么用户的每次投票都可以看作是对两个模型进行的一次成对比较（*Pairwise Comparison*）打分，要么 A 胜 B，要么 B 胜 A。因此，每一次投票，都可以得到如下的数据：

```shell
winner,loser
model_A,model_B
model_B,model_C
……
```

在 *Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference* [^3] 的第 4 节中提到：如何根据胜负数据对模型的能力进行排序是排序领域中需要深入研究的一个课题。

> ur data consists of pairwise comparisons—but how can we use these comparisons to recover a ranking over all M models? This is a well-studied topic in the literature on learning to rank (Liu et al., 2009), and we present our perspective here.

在 LMArena 的 *Statistical Extensions of the Bradley-Terry and Elo Models* [^4]这篇博客中，作者提到 LMArena 是通过 Bradley-Terry 模型来估计模型的真实能力。

> Based on our previous posts, Chatbot Arena uses the Bradley-Terry model for the purposes of statistical inference on the model strength. 

## Bradley-Terry 模型
Bradley-Terry[^5] 模型是一种统计模型，用于根据成对比较的结果来估计参与者的相对实力。Bradley-Terry 模型由 Bradley 和 Terry 在 1952 年提出，并且广泛应用于体育竞技、心理学实验和机器学习模型评估等领域。

Bradley-Terry 模型假设每个参与者（大模型）都有一个潜在的“能力参数” $\theta$，模型 $i$ 战胜模型 $j$ 的概率为：

$$
P(i\ beats\ j) = \frac{\theta_i}{\theta_i + \theta_j}
$$

上述公式有如下的重要特性：

* 对称性：如果 $\theta_i = \theta_j$，则两个模型各有 50% 的获胜概率
* 传递性：如果 $i$ 强于 $j$，$j$ 强于 $k$，则 $i$ 强于 $k$
* 可解释性：能力参数的比值直接对应获胜概率的几率比

Bradley-Terry 模型最常见的应用就是在给定一组 $i > j$ 的比赛结果下，推断潜在的能力参数 $\theta_i$ 的值。采用最大似然估计法来估计 $\theta_i$ 的值是最简单的方法——即通过估计的参数来实现模型的输出结果与实际观察到的比赛结果最大程度的相似。

假设我们已经有了一份 $n$ 个选手比赛结果的数据，令 $w_{ij}$ 表示 $i$ 战胜 $j$ 的次数。那么在 Bradley-Terry 模型中，这组结果的似然性为：

$$
L(\theta_1,...,\theta_n) = \prod_{ij} \left[P(i > j)\right]^{w_{ij}} = \prod_{ij} \left[\frac{\theta_i}{\theta_i + \theta_j}\right]^{w_{ij}}
$$

对上式取对数，得到对数似然函数：
$$
\begin{aligned}
\ln L(\theta_1,...,\theta_n) &= \ln \prod_{ij,i \ne j} \left[\frac{\theta_i}{\theta_i + \theta_j}\right]^{w_{ij}} \\
&= \sum_{i=1}^{n}\sum_{j=1,j \ne i}^{n} {\ln \left[\frac{\theta_i}{\theta_i + \theta_j}\right]^{w_{ij}}} \\
&= \sum_{ij,i \ne j} {w_{ij} \ln \frac{\theta_i}{\theta_i + \theta_j}} \\
&= \sum_{ij, i \ne j} \left[ w_{ij} \ln(\theta_i) - w_{ij} \ln(\theta_i + \theta_j)\right]
\end{aligned}
$$


$\ln L(\theta_1,...,\theta_n)$ 只有一个最大值，并且可以通过对 $\theta_i$ 求导并令结果为零来找到该最大值。

## Bradley-Terry 模型的例子
假设我们有三个模型 A、B 和 C，它们之间的比赛结果如下：
| 比赛 | 胜 | 负 |
|------|------|------|
| A 对 B    | 8    | 4    |
| A 对 C    | 3    | 5    |

$$
\ln L(\theta_A,\theta_B,\theta_C) = 8 \ln \frac{\theta_A}{\theta_A + \theta_B} + 4 \ln \frac{\theta_B}{\theta_A + \theta_B} + 3 \ln \frac{\theta_A}{\theta_A + \theta_C} + 5 \ln \frac{\theta_C}{\theta_A + \theta_C}
$$

分别对 $\theta_A$、$\theta_B$ 和 $\theta_C$ 求导，并令结果为零，我们可以得到：

$$
\theta_A = 1, \ \theta_B = \frac{1}{2}, \ \theta_C = \frac{5}{3}
$$

即根据观察到的比赛结果，如果以模型 A 的能力参数作为参考（1），那么模型 B 的能力参数为 0.5，模型 C 的能力参数为 1.67。此时，模型 B 战胜模型 C 的概率为：

$$
P(B\ beats\ C) = \frac{\theta_B}{\theta_B + \theta_C} = \frac{0.5}{0.5 + 1.67} \approx 0.23
$$

在实际应用中，我们可以直接使用 R 语言中的 `BradleyTerry2` 包来进行 Bradley-Terry 模型的拟合和参数估计。我们首先把比赛结果整理成成对比较的格式：

```shell
winner,loser
A,B
A,B
A,B
A,B
A,B
A,B
A,B
A,B
B,A
B,A
B,A
B,A
A,C
A,C
A,C
C,A
C,A
C,A
C,A
C,A
```

然后我们把如上的数据处理成如下的格式：

```shell
  player1 player2 win1 win2
1       B       A    4    8
2       C       A    5    3
3       A       B    8    4
4       A       C    3    5
```

然后使用 `BradleyTerry2` 包进行拟合：

```R
# 拟合模型（使用默认参考类别）
model <- BTm(cbind(win1, win2), player1, player2, data = bt_data)

# 显示模型摘要
cat("Bradley-Terry模型结果:\n")
print(summary(model))

cat("\n", rep("=", 60), "\n\n", sep = "")

# 提取能力参数(对数几率)
abilities <- BTabilities(model)
print("选手能力参数(log-odds):")
print(abilities)

cat("\n", rep("=", 60), "\n\n", sep = "")

# 计算相对强度(exponential of abilities)
relative_strength <- exp(coef(model))
cat("相对强度(相对于参考选手A):\n")
print(relative_strength)

cat("\n", rep("=", 60), "\n\n", sep="")
```

最终可以得到如下的输出结果：

```shell
Bradley-Terry模型结果:

Call:
BTm(outcome = cbind(win1, win2), player1 = player1, player2 = player2, 
    data = bt_data)

Coefficients:
    Estimate Std. Error z value Pr(>|z|)
..B  -0.6931     0.4330  -1.601    0.109
..C   0.5108     0.5164   0.989    0.323

(Dispersion parameter for binomial family taken to be 1)

    Null deviance: 3.7291e+00  on 4  degrees of freedom
Residual deviance: 1.3323e-15  on 2  degrees of freedom
AIC: 14.803

Number of Fisher Scoring iterations: 3


============================================================

[1] "选手能力参数(log-odds):"
     ability      s.e.
A  0.0000000 0.0000000
B -0.6931472 0.4330127
C  0.5108256 0.5163978

============================================================
相对强度(相对于参考选手A):
     ..B      ..C 
0.500000 1.666667 

============================================================
```

根据如上的输出可以看出，`BradleyTerry2` 包计算出的能力参数与我们手动计算的结果是一致的。

当然，我们也可以用如下的代码来计算能力参数的置信区间：

```R
# 计算95%置信区间
conf_intervals <- confint(model, level = 0.95)
print("能力参数的95%置信区间(log-odds):")
print(conf_intervals)

cat("\n", rep("=", 60), "\n\n", sep = "")
```

最终可以得到如下的输出结果：

```shell
Waiting for profiling to be done...
[1] "能力参数的95%置信区间(log-odds):"
         2.5 %    97.5 %
..B -1.5958865 0.1280845
..C -0.4797566 1.5889808

============================================================
```

## 把能力参数转化为 Elo 分数
利用如下的公式把 Bradley-Terry 模型的能力参数转化为 Elo 分数：

$$
Elo\_Scores = Elo\_Base + 400 \times \frac{\theta_i}{\log_{10}}
$$

具体代码如下所示：

```R
# ========== 重新参数化：所有选手都有置信区间 ==========
cat("重新参数化模型 - 所有选手都有置信区间:\n\n")

# 计算所有选手的对数能力参数（包括A）
# A的系数为0（参考类别）
abilities_all <- c(A = 0, coef(model))

# 计算方差-协方差矩阵
vcov_matrix <- vcov(model)

# 为A添加行和列（方差为0，协方差为0）
n_players <- length(abilities_all)
vcov_all <- matrix(0, n_players, n_players)
rownames(vcov_all) <- colnames(vcov_all) <- names(abilities_all)
vcov_all[2:n_players, 2:n_players] <- vcov_matrix

# 方法1: 计算相对于平均水平的能力参数
mean_ability <- mean(abilities_all)
abilities_centered <- abilities_all - mean_ability

# 使用Delta方法计算标准误
# 对于centered abilities: SE(ability_i - mean) 
se_centered <- rep(0, n_players)
names(se_centered) <- names(abilities_all)

for (i in 1:n_players) {
  # 构造线性组合系数: c_i = 1, c_j = -1/n for all j
  contrast <- rep(-1 / n_players, n_players)
  contrast[i] <- contrast[i] + 1
  
  # SE = sqrt(c' * Vcov * c)
  se_centered[i] <- sqrt(t(contrast) %*% vcov_all %*% contrast)
}

# 计算95%置信区间
z_value <- qnorm(0.975)  # 95% CI
ci_lower_centered <- abilities_centered - z_value * se_centered
ci_upper_centered <- abilities_centered + z_value * se_centered

cat("相对于平均水平的能力参数:\n")
result_centered <- data.frame(
  Player = names(abilities_centered),
  Ability = round(abilities_centered, 4),
  SE = round(se_centered, 4),
  CI_Lower = round(ci_lower_centered, 4),
  CI_Upper = round(ci_upper_centered, 4)
)
print(result_centered)

cat("\n", rep("=", 60), "\n\n", sep="")

# 转换为Elo评分（所有选手都相对于平均1500分）
base_elo <- 1500
elo_scores_centered <- base_elo + 400 * abilities_centered / log(10)
elo_ci_lower <- base_elo + 400 * ci_lower_centered / log(10)
elo_ci_upper <- base_elo + 400 * ci_upper_centered / log(10)

results_final <- data.frame(
  Player = names(elo_scores_centered),
  Elo_Rating = round(elo_scores_centered, 1),
  SE = round(400 * se_centered / log(10), 1),
  CI_Lower = round(elo_ci_lower, 1),
  CI_Upper = round(elo_ci_upper, 1),
  CI_Width = round(elo_ci_upper - elo_ci_lower, 1)
)
results_final <- results_final[order(-results_final$Elo_Rating), ]

cat("最终结果 - Elo评分及95%置信区间（所有选手）:\n")
print(results_final, row.names = FALSE)

cat("\n注: 所有Elo评分都相对于平均水平1500分\n")

cat("\n", rep("=", 60), "\n\n", sep = "")
```

最终可以得到如下的输出结果：

```shell
重新参数化模型 - 所有选手都有置信区间:

相对于平均水平的能力参数:
    Player Ability     SE CI_Lower CI_Upper
A        A  0.0608 0.2246  -0.3795   0.5011
..B    ..B -0.6324 0.3361  -1.2911   0.0264
..C    ..C  0.5716 0.3733  -0.1601   1.3033

============================================================

最终结果 - Elo评分及95%置信区间（所有选手）:
 Player Elo_Rating   SE CI_Lower CI_Upper CI_Width
    ..C     1599.3 64.8   1472.2   1726.4    254.2
      A     1510.6 39.0   1434.1   1587.0    153.0
    ..B     1390.1 58.4   1275.7   1504.6    228.9

注: 所有Elo评分都相对于平均水平1500分

============================================================
```

所以，我们就根据成对比赛数据，计算出了和 LMArena 类似的 Elo 分数和置信区间。

!!! note "R 源代码与输入数据"
    完整的 R 代码和输入数据可以点击链接 [bt.R](https://github.com/wangwei1237/wangwei1237.github.io_src/blob/master/source/_posts/How-to-estimate-the-winning-rate-based-on-historical-match-results/bt.R)、[matches_2.csv](https://github.com/wangwei1237/wangwei1237.github.io_src/blob/master/source/_posts/How-to-estimate-the-winning-rate-based-on-historical-match-results/matches_2.csv)获取。

## 如何进行排序？
用户偏好打分，本质上还是使用抽样的方式来估计群体参数，因此采用绝对 Elo 分值对模型能力排序有时候也并不那么客观。有可能 A、B 两个模型的能力实际上差不多，但是刚好在观察到的打分结果中，$Elo\_A = 1500$、$Elo\_B = 1498$。难道这就能说明模型 A 的能力要比模型 B 好吗？

如前所述，对于每一个模型，我们均可以通过 Bradley-Terry 模型计算出该模型的能力参数、以及能力参数对应的 95% 置信区间。因此，基于 Bradley-Terry 模型，我们可以估计出每一个模型的实际能力、实际能力的下限、实际能力的上限。

为了让排序更为合理，LMArena 根据模型的实际能力、实际能力的下限、实际能力的上限这三个数据提供了 `Rank Spread` 的排序方式。在 LMArena 的 *LMArena's Ranking Method* [^6] 这篇博客中，作者对 `Rank Spread` 的排名方法进行了详细的描述。

对于模型 $M$ 而言：

* 模型 $M$ 的最佳排名为：$1+\#\{置信区间下限 > 模型 M 置信区间上限的模型数量\}$。
* 模型 $M$ 的最差排名为：$1+\#\{置信区间上限 > 模型 M 置信区间下限的模型数量\}$。

> $1+$ 确保排名不会为零，并且可能的最佳排名是 $1$。

![](Raw-Ranking_v5.png)

对于上图中的模型 C 而言：

* 模型 C 的 Elo 分数为 1400，按照 Elo 分数排序，模型 C 的排名为第 3 名。
* 置信区间下限大于模型 C 置信区间上限（1420）的模型只有模型 A，因此模型 C 的最佳排名为 $1 + 1 = 2$。
* 置信区间上限大于模型 C 置信区间下限（1380）的模型有模型 A、B、D、E 四个模型，因此模型 C 的最差排名为 $1 + 4 = 5$。
* 最终，模型 C 的 `Rank Spread` 为 $2 \Longleftrightarrow	 5$。

对于模型 B 而言：

* 模型 B 的 Elo 分数为 1418，按照 Elo 分数排序，模型 B 的排名为第 2 名。
* 置信区间下限大于模型 B 置信区间上限（1418）的模型只有模型 A，因此模型 B 的最佳排名为 $1 + 1 = 2$。
* 置信区间上限大于模型 B 置信区间下限的模型有模型 A、C、D 三个模型，因此模型 B 的最差排名为 $1 + 3 = 4$。
* 最终，模型 B 的 `Rank Spread` 为 $2 \Longleftrightarrow	 4$。

因此，当两个模型的 `Rank Spread` 有重叠时，那么他们就属于同级别模型（如上所示的模型 B 和模型 C），我们可以认为他们在能力上是属于统一梯队的。当然就和体育赛事一样，虽然两名选手都是产不多的视频，但实际比赛结果只能有一个冠军。因此，我们可以认为 Elo 分数排序（唯一排序）就代表在当前的数据下，模型的实际能力排序结果。

## 后记[^7]

!!! note "Arena-Rank: Open Sourcing the Leaderboard Methodology"
    值得高兴的是，LMArena 团队宣布开源他们的排行榜方法 [Arena-Rank](https://lmarena.ai/blog/arena-rank/)，并且提供了 [Python 版本](https://github.com/lmarena/arena-rank?ref=lmarena.ai) 的实现。我们可以使用 [lmarena-ai/arena-expert-5k](https://huggingface.co/datasets/lmarena-ai/arena-expert-5k) 数据集对 Arena-Rank 进行测试。

## 参考文献
[^1]: [刚刚，马斯克Grok 4.1低调发布！通用能力碾压其他一切模型](https://mp.weixin.qq.com/s/6V3M1BFho0Y2L26SrgOT4g)
[^2]: [全世界在等的Gemini 3终于来了！强到断崖领先，连马斯克OpenAI都夸好](https://mp.weixin.qq.com/s/1qvy9mH-KXGPQrBv3PGYag)
[^3]: [Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference](https://arxiv.org/abs/2403.04132)
[^4]: [Statistical Extensions of the Bradley-Terry and Elo Models](https://news.lmarena.ai/extended-arena/)
[^5]: [Bradley–Terry model](https://en.wikipedia.org/wiki/Bradley%E2%80%93Terry_model)
[^6]: [LMArena's Ranking Method](https://news.lmarena.ai/ranking-method/)
[^7]: [Arena-Rank](https://lmarena.ai/blog/arena-rank/)