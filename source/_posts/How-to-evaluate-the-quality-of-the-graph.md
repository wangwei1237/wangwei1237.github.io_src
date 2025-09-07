---
title: 如何评估知识图谱的质量
reward: false
top: false
date: 2025-08-23 09:16:00
authors:
categories:
  - Neo4j
tags:
  - 图质量
  - 弱联通分量
  - WCC
  - Louvain Modularity
  - GDS
---

![](1.png)

在基于我们所构建的 **知识图谱** 数据执行复杂任务之前，检查 **知识图谱** 的质量是必不可少的步骤。**知识图谱** 的质量检查能够确保导入数据的完整性和准确性，及早发现数据异常、关系映射错误等问题，避免低质量数据影响模型效果。同时，**知识图谱** 的质量检查可以为后续的图分析提供可靠的数据基础，确保后续任务的成功。本文将基于 Neo4j 的图数据科学库（GDS）介绍如何评估 **知识图谱** 的质量，主要包括 WCC（弱联通网络）和 Louvain Modularity 这两种算法。

<!--more-->

## 1. WCC（弱联通分量）
### 1.1 WCC 算法简介
WCC（Weakly Connected Components，弱联通分量）是图论中的一个重要概念。要理解WCC，我们首先需要了解图论中的几个基础概念。

* **有向图与无向图**：知识图谱本质上是一个有向图，其中实体作为节点，关系作为有向边。例如，`17哥`→`工作于`→`百度` 就构成了一条有向边。

* **强连通与弱连通**：
  * **强连通**：在有向图中，如果从节点 A 可以通过有向边到达节点 B，并且从节点 B 也可以通过有向边回到节点 A，那么 A 和 B 是强连通的。
  * **弱连通**：如果我们忽略边的方向，将有向图看作无向图后，如果两个节点之间存在路径，则它们是弱连通的。

* **弱联通分量**：在一个有向图中，最大的弱连通子图就是一个弱联通分量。简单来说，WCC 是指图中所有能够相互到达的节点集合，此处定义的"到达"会忽略边的方向[^1]。

在一个社交网络图中，人们通过各种关系彼此连接（朋友、同事、家人……）起来。即使这些关系有方向性（比如"关注"关系），但只要两个人之间存在某种路径连接（不考虑方向），他们就属于同一个弱联通分量。如果整个社交网络分成了几个完全独立的小群体，那么每个群体就是一个弱联通分量。

![](exm_net.png)

在 Neo4j 中，我们可以使用 GDS 库来计算 WCC。例如：

* 首先，我们需要将有向图转换为无向图。在 Neo4j 中，我们可以使用 `gds.graph.project` 方法来实现这一点，并通过设置 `orientation: 'UNDIRECTED'` 来忽略边的方向。

```Cypher
CALL gds.graph.project(
  'social-graph',
  'Person',
  {
      FRIEND_OF: {
          orientation: 'UNDIRECTED'
      }
  }
)
```

* 然后，我们可以使用 `gds.wcc.write` 方法来计算 WCC，并将结果写入节点属性中。

```
CALL gds.wcc.write('social-graph', {writeProperty: 'componentId'})
YIELD nodePropertiesWritten, componentCount, componentDistribution
```

执行上述代码后，我们可以得到以下结果：

| nodePropertiesWr | componentCount | componentDistribution |
|------------------|----------------|-----------------------|
| 5                | 2              | {<br/>  min: 2,<br/>  p5: 2,<br/>  max: 3,<br/>  p999: 3,<br/>  p99: 3,<br/>  p1: 2,<br/>  p10: 2,<br/>  p90: 3,<br/>  p50: 2,<br/>  p25: 2,<br/>  p75: 3,<br/>  p95: 3,<br/>  mean: 2.5<br/>} |

可以看到如上的一个社交网络中，对于 `FRIEND_OF` 关系而言，存在 2 个弱联通分量，从图中也可以看出来，这两个弱联通分量分别是：

* Alice，Bob，David
* Charles，Alex

### 1.2 WCC的计算方法
计算WCC通常使用以下步骤：
* 图的预处理：将有向图转换为无向图，即忽略所有边的方向
* 深度优先搜索（**DFS**）或广度优先搜索（**BFS**）：从任意未访问的节点开始，遍历所有可达的节点
* 分量标记：将每次搜索到的所有节点标记为同一个连通分量
* 重复过程：对所有未访问的节点重复上述过程，直到所有节点都被访问

标准的 WCC 算法时间复杂度为 $O(V+E)$，其中 $V$ 是节点数，$E$ 是边数。在实践中，由于实际应用中的图通常非常大，因此通常会使用并行或分布式算法来优化性能。

### 1.3 WCC 在知识图谱质量评估中的作用

* 连通性评估：WCC 数量是评估知识图谱整体连通性的重要指标。理想情况下，一个高质量的知识图谱应该只有一个巨大的弱联通分量，这意味着图谱中的知识是相互关联的整体。如果知识图谱存在多个 WCC，特别是很多小的 WCC，这通常表明：数据集成不充分，存在知识孤岛；某些领域的知识缺失或连接不足；数据质量问题导致实体无法正确链接。

* 知识覆盖度分析：通过分析最大 WCC 的规模占比，可以评估知识图谱的覆盖度。主要 WCC 的节点数占比高，说明大部分知识都被有效组织在一起。
如果存在多个中等规模的 WCC，这可能表明不同领域间缺乏桥接知识。如果存在大量微小 WCC，通常意味着数据质量问题或实体消歧不充分。

* 图谱完整性检验：如果某些本应相连的知识点被分割在不同的 WCC 中，则说明需要补充相关关系或实体。

* 图谱演化监控：在知识图谱的持续构建过程中，WCC指标可以用来监控图谱质量的变化。如果 WCC 数量减少，通常表明图谱质量在提升，知识间的连接更加充分。如果主要的 WCC 规模在增长，则说明新增知识能够有效融入现有知识体系。如果新增小的 WCC，则需要关注是否存在数据质量问题。

一般而言，在实际应用中，WCC 通常通过以下几个维度来评估知识图谱质量：
* WCC 数量：总的弱联通分量个数
* 最大 WCC 占比：最大弱联通分量包含的节点数占总节点数的比例
* WCC 规模分布：不同规模WCC的数量分布
* 孤立节点率：只包含单个节点的WCC比例

一般来说，高质量的知识图谱应该满足：
* WCC 数量相对较少
* 存在一个占主导地位的大 WCC（通常应占80%以上的节点）
* 小规模 WCC 数量较少
* 孤立节点比例较低

### 1.4 WCC 的局限性
尽管 WCC 是一个有用的评估指标，但它也有一些局限性：

* 无法反映语义质量：WCC 只关注结构连通性，无法判断连接的语义合理性。即使图谱结构连通性很好，仍可能存在语义错误。

* 领域特异性：不同领域的知识图谱有不同的特点。某些特定领域可能天然存在多个独立的知识群体，这种情况下多个WCC可能是合理的。

* 规模敏感性：对于不同规模的知识图谱，WCC的评估标准可能需要调整。小规模专业图谱和大规模通用图谱的评估标准应该有所不同。

## 2. Louvain Modularity 算法
在知识图谱的质量评估体系中，除了连通性分析外，社区结构的合理性也是衡量图谱质量的重要维度。而 Louvain Modularity（鲁汶模块度）正是一个能够揭示知识图谱内在组织结构质量的强大算法。Louvain Modularity 不仅能够发现图谱中的自然社区划分，还能够量化评估图中社区结构的合理程度。

### 2.1 Louvain Modularity 算法简介
在网络科学中，**Modularity（模块度）** [^2]是用来衡量网络社区结构质量的重要指标。Newman 和 Girvan 在 2004 年提出了 **Modularity（模块度）** 的概念，并通过比较实际网络中的边分布与随机网络中的期望边分布，来评估社区划分的合理性。

Louvain 算法[^3]是由比利时鲁汶大学的研究者在 2008 年提出的一种高效的社区发现算法。该算法能够快速识别大规模网络中的社区结构，并计算相应的模块度值。Louvain Modularity 则是指使用 Louvain 算法发现社区结构后计算得到的模块度值，它综合反映了知识图谱中实体聚类的合理性和社区间边界的清晰度。

### 2.2 Louvain Modularity 的计算方法
在 Networks: An Introduction 一书中[^4]，模块度的定义如下：

$$
Q = \frac{1}{2m} \sum_{ij} \left( A_{ij} - \gamma \frac{k_i k_j}{2m} \right) \delta(c_i, c_j)
$$

其中：

* $m$：图中边的总数
* $A_{ij}$：图的邻接矩阵元素（节点 $i$ 和 $j$ 之间有边则为 1，否则为 0）
* $\gamma$：分辨率参数。$\gamma$ 的不同取值会影响社区划分的精细程度，较小的 $\gamma$ 可能会检测出更大型、包含节点更多的社区；较大的 $\gamma$ 则可能会检测出更多小型、更精细的社区。通过调整 $\gamma$，可以适配不同尺度的社区结构分析需求。
* $k_i$、$k_j$：节点 $i$ 和 $j$ 的度
* $c_i、c_j$：节点 $i$ 和 $j$ 所属的社区
* $\delta(c_i, c_j)$：如果两节点属于同一社区则为 1，否则为 0

例如，在学术研究的网络图谱中，学者之间往往通过合作关系产生链接。如果该学术研究网络具有良好的社区结构，那么同一研究领域的学者之间应该有更密集的合作，而不同领域的学者之间的合作则相对较少。模块度就是用来量化这种“内部紧密、外部稀疏”特性的指标。

模块度值的范围通常在 -0.5 到 1 之间：

* $Q$ < 0：社区内连接比随机期望还要稀少
* $Q \approx$ 0：网络接近随机图，无明显社区结构
* $Q$ > 0.3：通常认为存在显著的社区结构
* $Q$ > 0.5：表示社区结构非常明显

Louvain 算法具备如下的优点：

* 时间复杂度近似 $O(n \log_n)$，适用于大规模网络
* 能够发现多层次的社区结构
* 可以通过模块度优化来确保社区划分的合理性
* 对不同类型的网络都有良好的表现

### 2.3 Louvain Modularity 在知识图谱质量评估中的作用
* 知识组织结构评估：在知识图谱中，语义相关的实体往往通过关系紧密连接。Louvain Modularity 能够评估这种语义聚类的质量。高模块度值表明相关实体被有效聚集在同一社区，低模块度值可能暗示实体间关系的语义一致性较差。另外，通过分析发现的社区结构，可以检验知识图谱中不同主题领域的边界是否清晰，明确的社区边界反映良好的主题区分，模糊的社区结构可能表明主题交叉过于复杂或分类不当。

* 数据质量诊断：如果知识图谱中存在大量错误关系，会导致不相关实体被错误连接，从而降低模块度值。通过监控模块度变化，可以间接评估数据清洗的效果。实体消歧错误会导致本应分离的实体被合并，或相关实体被错误分离，这些都会在社区结构中体现出来，过度消歧会产生异常紧密的社区，消歧不足则会导致社区结构过于分散。

* 图谱完整性分析：模块度不仅反映社区结构的存在，也间接反映了知识的密度分布，如果某些社区内部连接过于稀疏，可能表明该领域知识不完整；如果所有社区密度都较低，则可能暗示整体知识的密度不足。通过分析社区间的边，可以评估跨领域知识的连接质量，合理的跨社区连接反映良好的知识整合，过多或过少的跨社区连接都可能表明图谱的结构存在问题。

* 图谱演化监控：在知识图谱的持续更新过程中，Louvain Modularity 可以用来监控图谱结构的稳定性。模块度的剧烈波动可能表明新增数据与现有结构不协调，渐进式的模块度变化通常表明健康的图谱演化。新领域知识的加入应该形成新的社区或合理扩展现有社区，新社区的形成表明新领域知识的有效整合，而现有社区的合理扩展反映知识补充的质量。

### 2.4 Louvain Modularity 的局限性
尽管 Louvain Modularity 是一个强大的评估工具，但它也存在一些局限性：

* 算法局限性：Louvain 算法存在分辨率限制问题，这可能导致无法发现小于某个规模的社区，从而导致分析过程忽略了细粒度的专业领域。另外，与 WCC 不同，Louvain 算法的结果可能因初始条件或节点处理顺序的不同而有所变化，因此需要多次运行取平均值以增强器健壮性。

* 知识图谱特异性：知识图谱中存在多种类型的关系，简单的无权重处理可能无法充分反映不同关系的重要性。

### 2.5 与 WCC 的比较
WCC（弱联通分量）主要关注图谱的整体连通性，而 Louvain Modularity 更关注内部结构的合理性，两者在知识图谱质量评估中各有侧重：

* WCC 回答：图谱是否连通？
* Louvain Modularity 回答：连通的图谱结构是否合理？

两者的结合使用可以提供更全面的质量评估，在实际应用中，我们可以先用 WCC 检测图的基本连通性，然后再用 Louvain Modularity 来评估图的结构合理性。

对于 **1.1 WCC 算法简介** 中提到的社交网络图，如果我们可以通过 `gds.louvain.write` 方法计算 Louvain Modularity，并将结果写入节点属性中：

```Cypher
CALL gds.louvain.write('social-graph', {writeProperty: 'componentLouvainId'})
YIELD communityCount, modularity, modularities, communityDistribution
```

如上的代码可以得到以下结果：

| communityCount | modularity | modularities | communityDistribution |
| -------------- | ---------- | ------------ | --------------------- |
| 2              | 0.32       | [0.32]       | {<br/>  min: 2,<br/>  p5: 2,<br/>  max: 3,<br/>  p999: 3,<br/>  p99: 3,<br/>  p1: 2,<br/>  p10: 2,<br/>  p90: 3,<br/>  p50: 2,<br/>  p25: 2,<br/>  p75: 3,<br/>  p95: 3,<br/>  mean: 2.5<br/>} |

## 3. GDS 库
在 Neo4j 数据库中，GDS（Graph Data Science）是一个强大的图数据科学库，它提供了高效实现的通用图形算法的并行版本，并以 Cypher 过程的形式供开发者使用。此外，GDS 还包括机器学习的 pipeline 以用于训练监督模型来解决图问题，例如预测图中缺失的关系。[^5]

我们可以按照 [Cypher 初学者指南](/2025/08/09/Cypher-for-Beginners/#neo4j-%E6%8F%92%E4%BB%B6%E5%AE%89%E8%A3%85) 中的插件安装步骤来安装 GDS 库。

对于非 Neo4j Desktop 用户，可以参照 Neo4j 官方文档中的 [Graph Data Science Installation](https://neo4j.com/docs/graph-data-science/current/installation/) 的内容来安装对应版本的 GDS 库。

## 4. 使用 GDS 进行图质量评估
在 在 [Knowledge Graphs And LLMs in Action](https://www.manning.com/books/knowledge-graphs-and-llms-in-action) 一书中的第 4 章中，作者给出了使用 GDS 中的 WCC 和 Louvain 算法来评估 PPI [^6]图质量评估的例子。

### 4.1 PPI 简介
Protein-Protein Interactions (PPIs，蛋白质-蛋白质相互作用) 是指细胞内或细胞间两个或多个蛋白质分子通过物理结合形成复合物的过程，是生命活动中至关重要的分子机制之一。

PPI 的核心特点主要包括：
* 分子基础：蛋白质通过表面的特定结构域（如酶的活性位点、结合口袋等）或氨基酸残基（如疏水相互作用、氢键、离子键等）发生特异性结合。
* 普遍性：几乎所有细胞功能（如信号传导、代谢调控、DNA 复制、免疫反应等）都依赖 PPIs 实现。例如，酶与底物的结合、抗体与抗原的识别、蛋白质复合体（如核糖体、剪接体）的组装等。

PPIs 的研究有助于揭示生命活动的分子网络，为理解疾病机制和开发靶向药物提供关键依据。

### 4.2 PPI 图数据导入
利用 [import_seed.py](https://github.com/alenegro81/knowledge-graphs-and-llms-in-action/blob/main/chapters/ch04/importer/import_seed.py) 导入 PPI 图数据。

利用如下的代码查询图中不同的节点类型和对应的节点数量：

```Cypher
MATCH (n)
UNWIND labels(n) AS label
RETURN label, count(*) AS count
ORDER BY count DESC;
```

![](ppi_node_cnt.png)

### 4.3 创建图的投影

```Cypher
CALL gds.graph.project(
  'ppi-graph',
  'PPIProtein',
  {
      INTERACTS_WITH: {
          orientation: 'UNDIRECTED'
      }
  }
)
```

![](ppi_project.png)

### 4.4 计算 WCC 与 Louvain Modularity

使用如下的代码计算 WCC：

```Cypher
CALL gds.wcc.write('ppi-graph', { writeProperty: 'componentId' })
YIELD nodePropertiesWritten, componentCount, componentDistribution;
```

![](ppi_wcc.png)

使用如下的代码计算 Louvain Modularity：

```Cypher
CALL gds.louvain.write('ppi-graph', {writeProperty: 'componentLouvainId'})
YIELD communityCount, modularity, modularities, communityDistribution
```

![](ppi_louvain.png)

综合 WCC 和 Louvain Modularity 的结果，我们可以看到：

* 最大的一个弱联通分量包含了 21521 个节点，这说明 99.6% 的节点都包含在一个巨大的弱联通分量中，表明图的连通性非常好。
* Louvain Modularity 的值为 0.39，表明图中存在非常显著的社区结构，相关实体被有效聚集在同一社区，社区间边界也相对清晰。

在对比 WCC 与 Louvain Modularity 的计算耗时我们发现，WCC 的计算耗时只有 285 ms，而 Louvain Modularity 的计算耗时却高达 10285 ms，可见，Louvain Modularity 的计算复杂度要高于 WCC。


## 参考文献
[^1]: [Weakly Connected Components](https://neo4j.com/docs/graph-data-science/current/algorithms/wcc/)
[^2]: [Modularity](https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.community.quality.modularity.html#r6937dc4d2017-1)
[^3]: [Louvain](https://neo4j.com/docs/graph-data-science/current/algorithms/louvain/)
[^4]: [Networks: An Introduction](https://academic.oup.com/book/27303?login=false)
[^5]: [Neo4j Graph Data Science](https://neo4j.com/docs/graph-data-science/current/introduction/)
[^6]: [Brief Introduction of Protein-Protein Interaction (PPI)](https://www.creative-proteomics.com/blog/brief-introduction-protein-protein.htm)
