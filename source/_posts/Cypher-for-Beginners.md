---
title: Cypher 初学者指南
reward: false
top: false
date: 2025-08-09 16:47:32
authors:
categories:
  - Neo4j
tags:
  - Knowledge Graph
  - Cypher
---

![](neo4j.jpg)

**Knowledge Grahp**（**KG**） 可用于表示现实世界中的不同实体网络并对其关系进行建模，例如：基于人和人的关系构建的社交网络图，基因与蛋白质之间的关系图…… **KG** 代表了一种理解数据的思维范式的转变，这有助于我们理解数据之间的关系，以便我们能够轻松识别数据中隐藏的重要模式并做出更好的决策。尤其是在生成式 LLM 快速发展的今天，**KG** 可以作为一种结构化的知识表示方式，为 LLM 提供更准确、更丰富、更精简的上下文信息，从而提升 LLM 的性能。

<!-- more -->

## 图数据库与 Neo4j 简介
传统的*关系型数据库*（RDBMS）使用*表*（table）来存储数据，并通过*外键*（foreign key）在不同的表之间链接数据。而*图数据库*（Graph Database）则用*节点*（Node）和*关系*（Relationship）来存储数据，对于网络、社交关系、知识图谱等复杂关联的数据表示具有天然的优势。

[Neo4j](https://neo4j.com/) 是当前最流行的图数据库之一，Neo4j 中的基本概念包括：

- **节点 (Node)**: 图中的实体，用 `()` 表示
- **标签 (Labels)**: 节点的分类，如 `:Person`, `:Movie`
- **属性 (Properties)**: 节点和关系的键值对数据，（如 `{name: "Alice", age: 30}`）
- **关系 (Relationship)**: 连接节点的边，可以有方向和类型（如 `ACTED_IN`、`FRIEND_OF`），用 `-->` 或 `-[]->`表示  

Alice 是 Bob 的朋友，在 Neo4j 中可以表示为：

```cypher
(Alice:Person)-[:FRIEND_OF]->(Bob:Person)
```

### Neo4j Desktop 安装与使用
对于初学者，建议直接安装 [Neo4j Desktop](https://neo4j.com/deployment-center/?desktop-gdb) 版本，Neo4j Desktop 是 Neo4j 官方推出的桌面应用程序（支持 Windows、Mac、Linux 等多个平台），专为简化图形数据库的管理、开发和学习而设计，尤其适合开发者、数据分析师和初学者。其核心优点如下：

* **一站式图形数据库管理**

    * 便捷的数据库生命周期管理：可直接在界面中创建、启动、停止、删除 Neo4j 数据库（支持社区版和企业版），无需手动配置命令行或服务器参数。
    * 多版本兼容：支持同时管理多个不同版本的 Neo4j 数据库，方便测试不同版本的特性或兼容性。
    * 直观的状态监控：通过仪表盘实时显示数据库的运行状态（如内存占用、连接数、查询性能等），便于快速排查问题。

* **集成开发环境（IDE）级体验**

    * 内置 Neo4j Browser：无需额外安装，直接在桌面端打开图形化查询工具 Neo4j Browser，支持编写、运行 Cypher 语句，并以图形化、表格或文本形式展示结果，可视化效果直观。
    * 项目管理功能：可将数据库、查询脚本、文档等资源归类到 “项目” 中，便于多任务场景下的资源组织（如不同业务场景的数据库隔离）。
    * 语法高亮与自动补全：Cypher 语句编辑时支持语法高亮、关键字提示和自动补全，减少语法错误，提升编写效率。

* **降低入门与学习门槛**

    * 零配置快速启动：无需手动安装 JDK、配置环境变量或修改复杂的配置文件，下载后即可一键创建并启动数据库，新手可快速上手。
    * 内置示例数据库：提供多个预配置的示例项目（如电影数据库、社交网络示例），包含现成的节点、关系和查询案例，便于通过实际数据学习 Cypher 和图形数据模型。
    * 文档与教程集成：内置官方文档入口和学习资源链接，方便随时查阅语法、最佳实践和场景案例。

* **支持扩展与集成** 

    * 插件与应用市场：可通过 “应用市场” 安装扩展工具（如数据导入插件、可视化工具），扩展功能边界。
    * 外部工具集成：支持将数据库连接到外部应用（如 Python、Java 程序），或与其他工具（如 Jupyter Notebook）联动，方便开发和数据分析流程。

安装 Neo4j Desktop 后，我们可以创建一个新的数据库实例，并通过内置的 Neo4j Browser 编写和运行 Cypher 语句。

![](2.png)

!!! warning "注意事项"
    由于 Neo4j Desktop 封禁了中国区的访问，因此安装完成后可能会出现：
    * 打开应用不显示应用界面（Neo4j Desktop 1.x 版本）
    * 无法创建数据库实例（Neo4j Desktop 2.x 版本）的情况

    此时，可以通过配置代理的方式来解决该问题。

## Cypher 语言简介
Cypher 是 Neo4j 的声明式图查询语言，类似 SQL，但专为图模型设计，其基本语法特点如下：

* 节点用圆括号 () 表示
* 关系用方括号 [] 表示
* 箭头 -> 或 <- 表示关系方向
* 属性用花括号 {} 表示
* 标签用冒号 : 表示

### 创建节点和关系
```cypher
CREATE (p1:Person {name: "Alice", age: 30}), 
       (p2:Person {name: "Bob", age: 17})
```

```cypher
MATCH (a:Person {name: "Alice"}), (b:Person {name: "Bob"})
CREATE (a)-[:FRIEND_OF]->(b)
```

### 查询节点和关系
```cypher
MATCH path=(:Person)-[:FRIEND_OF]->(:Person) 
RETURN path
```

![](3.png)

### 条件查询

```cypher
MATCH (p:Person) 
WHERE p.age > 18
RETURN p
```

![](4.png)

### 属性设置与更新

```cypher
MATCH (p1:Person {name: "Alice"})
SET p1.gender = "female"

MATCH (p2:Person {name: "Bob"})
SET p2.gender = "male"

RETURN p1, p2
```

![](5.png)

### 删除节点和关系
`DETACH DELETE` 会同时删除节点及其所有关系。

```cypher
MATCH (p:Person {name: "Alice"})
DETACH DELETE p
```

## Cypher 语法速查表

!!! note "Neo4j Cypher 语法速查表"
    更多的 Cypher 语法可以参考 [Neo4j Cypher 语法速查表](/2025/08/08/Neo4j-Cypher-Syntax-Cheat-Sheet/)。


## HPO（The Human Phenotype Ontology）
[人类表型本体论（HPO）](https://hpo.jax.org/) 提供了一套标准化的词汇，用于描述人类疾病中出现的表型异常。HPO 是 Monarch Initiative 的核心成果，致力于生物医学和模式生物数据的语义整合，其最终目标是推动生物医学研究的发展。作为 Monarch Initiative 的一部分，HPO 是全球基因组与健康联盟（GA4GH）战略路线图中的 13 个驱动项目之一的核心组成部分。HPO 中的每个术语都描述了一种表型异常，例如房间隔缺损。HPO 目前包含超过 18,000 个术语，以及超过 156,000 个与遗传性疾病相关的注释。目前，借助 HPO 项目及其他相关项目，人们已经开发出用于表型驱动的鉴别诊断、基因组诊断和转化医学研究的相关软件。

**接下来，我们将利用 HPO 数据构建一个简单的 KG，并使用 Cypher 查询语句对其进行探索。**

### Neo4j 插件安装
在 [Knowledge Graphs And LLMs in Action](https://www.manning.com/books/knowledge-graphs-and-llms-in-action) 一书中，提供了根据 HPO 数据构建 KG 的代码示例（[chapter_03_code](https://github.com/alenegro81/knowledge-graphs-and-llms-in-action/tree/main/chapters/ch03)）。我们可以使用该代码来构建 HPO KG。

该代码使用了 Neo4j 的 `APOC` 插件和 `neosemantics` 插件，因此，在运行代码之前，我们需要确保 Neo4j Desktop 中安装了这两个插件。

Neo4j Desktop 中的插件中心提供了 `APOC` 插件，我们直接安装即可，但是 `neosemantics` 插件需要手动安装。我们可以从 [neosemantics GitHub 仓库](https://github.com/neo4j-contrib/neosemantics) 下载插件的 `.jar` 文件，并将其放置在 Neo4j Desktop 的 `plugins` 目录下。

插件安装完毕后，我们需要修改 Neo4j 的配置文件，以允许 `APOC` 和 `neosemantics` 插件访问数据库。通过 Neo4j Desktop 插件中心安装的插件会自动增加这些配置项，但是如果是手动安装的插件（例如 `neosemantics`），我们需要手动添加以下配置到 Neo4j 的 `neo4j.conf` 文件中：

```bash
# A comma separated list of procedures and user defined functions that are allowed
# full access to the database through unsupported/insecure internal APIs.
dbms.security.procedures.unrestricted=gds.*,n10s.*

# A comma separated list of procedures to be loaded by default.
# Leaving this unconfigured will load all procedures found.
dbms.security.procedures.allowlist=gds.*,n10s.*,apoc.*
```

然后重启 Neo4j 数据库实例，使配置和插件生效。

![](8.jpg)

### 构建 HPO KG
按照 [chapter_03_code](https://github.com/alenegro81/knowledge-graphs-and-llms-in-action/tree/main/chapters/ch03) 中的说明，我们可以构建 HPO KG。

!!! warning "python 版本问题"
    务必注意，执行代码需要使用 3.10 以下的 python 版本。否则，会报如下的错误：
    
    ```bash
    AttributeError: module 'pkgutil' has no attribute 'ImpImporter'. Did you mean: 'zipimporter'?
    ```

```bash
$ /usr/bin/python3 chapters/ch03/importer/import_hpo.py
```

执行上述命令后，我们就把 HPO 数据导入到 Neo4j 数据库中，并形成了一个简单的 KG。

![](9.png)




