---
title: Neo4j Cypher 语法速查表
reward: false
top: false
date: 2025-08-08 23:58:48
authors:
categories:
  - Neo4j
tags:
  - Cypher
---

![](CQL.webp)

Cypher 是 Neo4j 的声明式图查询语言，类似 SQL，但专为图模型设计。与其他编程语言或查询语言一样，Cypher 有一套既定的规则，用于编写可读性强且设计良好的结构。如果你对图数据库或 Cypher 还不熟悉，也不用担心，本文将为你提供一个 Cypher 语法速查表，帮助你快速上手。

<!-- more -->

### 基本语法表格

| 类别 | 命令/语法 | 用法简介 | 示例 |
|------|-----------|----------|------|
| **节点** | (n) | 匹配任意节点 | MATCH (n) RETURN n |
| **节点** | (n:Label) | 匹配指定标签的节点 | MATCH (p:Person) RETURN p |
| **节点** | (n:Label {prop: value}) | 匹配带属性的节点 | MATCH (p:Person {name: "张三"}) RETURN p |
| **关系** | -[r]-> | 匹配有向关系 | MATCH (a)-[r]->(b) RETURN a, r, b |
| **关系** | -[r:TYPE]-> | 匹配指定类型的关系 | MATCH (a)-[r:KNOWS]->(b) RETURN a, b |
| **关系** | -[r:TYPE {prop: value}]-> | 匹配带属性的关系 | MATCH (a)-[r:KNOWS {since: 2020}]->(b) RETURN a, b |

### 查询命令表格

| 命令 | 用法简介 | 示例 |
|------|----------|------|
| MATCH | 匹配图中的模式 | MATCH (p:Person) RETURN p |
| RETURN | 返回查询结果 | RETURN p.name, p.age |
| RETURN DISTINCT | 返回不重复的结果 | RETURN DISTINCT p.city |
| WHERE | 添加过滤条件 | MATCH (p:Person) WHERE p.age > 25 RETURN p |
| ORDER BY | 对结果排序 | MATCH (p:Person) RETURN p ORDER BY p.age |
| ORDER BY ... DESC | 降序排序 | MATCH (p:Person) RETURN p ORDER BY p.age DESC |
| LIMIT | 限制返回结果数量 | MATCH (p:Person) RETURN p LIMIT 10 |
| SKIP | 跳过指定数量的结果 | MATCH (p:Person) RETURN p SKIP 5 LIMIT 10 |

### 创建和修改命令表格

| 命令 | 用法简介 | 示例 |
|------|----------|------|
| CREATE | 创建节点或关系 | CREATE (p:Person {name: "张三", age: 28}) |
| MERGE | 匹配或创建（如果不存在） | MERGE (p:Person {email: "zhang@example.com"}) |
| SET | 设置或更新属性 | MATCH (p:Person {name: "张三"}) SET p.age = 30 |
| SET ... :Label | 添加标签 | MATCH (p:Person {name: "张三"}) SET p:Manager |
| REMOVE | 移除属性 | MATCH (p:Person {name: "张三"}) REMOVE p.age |
| REMOVE ... :Label | 移除标签 | MATCH (p:Person {name: "张三"}) REMOVE p:Manager |
| DELETE | 删除关系或节点 | MATCH (p:Person)-[r]-() DELETE r, p |
| DETACH DELETE | 删除节点及其所有关系 | MATCH (p:Person {name: "张三"}) DETACH DELETE p |

### 条件操作符表格

| 操作符 | 用法简介 | 示例 |
|--------|----------|------|
| = | 等于 | WHERE p.age = 25 |
| <> | 不等于 | WHERE p.age <> 25 |
| < | 小于 | WHERE p.age < 30 |
| <= | 小于等于 | WHERE p.age <= 30 |
| > | 大于 | WHERE p.age > 18 |
| >= | 大于等于 | WHERE p.age >= 18 |
| AND | 逻辑与 | WHERE p.age > 18 AND p.city = "北京" |
| OR | 逻辑或 | WHERE p.age < 18 OR p.age > 65 |
| NOT | 逻辑非 | WHERE NOT p.name = "张三" |
| IN | 包含在列表中 | WHERE p.age IN [25, 30, 35] |
| CONTAINS | 字符串包含 | WHERE p.name CONTAINS "张" |
| STARTS WITH | 字符串开始于 | WHERE p.name STARTS WITH "张" |
| ENDS WITH | 字符串结束于 | WHERE p.name ENDS WITH "三" |
| =~ | 正则表达式匹配 | WHERE p.name =~ "张.*" |
| IS NULL | 检查空值 | WHERE p.email IS NULL |
| IS NOT NULL | 检查非空值 | WHERE p.email IS NOT NULL |

### 聚合函数表格

| 函数 | 用法简介 | 示例 |
|------|----------|------|
| COUNT() | 计数 | MATCH (p:Person) RETURN COUNT(p) |
| COUNT(DISTINCT) | 去重计数 | MATCH (p:Person) RETURN COUNT(DISTINCT p.city) |
| SUM() | 求和 | MATCH (p:Person) RETURN SUM(p.age) |
| AVG() | 平均值 | MATCH (p:Person) RETURN AVG(p.age) |
| MAX() | 最大值 | MATCH (p:Person) RETURN MAX(p.age) |
| MIN() | 最小值 | MATCH (p:Person) RETURN MIN(p.age) |
| COLLECT() | 收集为列表 | MATCH (p:Person) RETURN COLLECT(p.name) |
| COLLECT(DISTINCT) | 去重收集 | MATCH (p:Person) RETURN COLLECT(DISTINCT p.city) |

### 路径匹配表格

| 语法 | 用法简介 | 示例 |
|------|----------|------|
| -[*]-> | 任意长度路径 | MATCH (a)-[*]->(b) RETURN a, b |
| -[*1..3]-> | 1到3步路径 | MATCH (a)-[*1..3]->(b) RETURN a, b |
| -[*..5]-> | 最多5步路径 | MATCH (a)-[*..5]->(b) RETURN a, b |
| -[*2..]-> | 至少2步路径 | MATCH (a)-[*2..]->(b) RETURN a, b |
| shortestPath() | 最短路径 | MATCH path = shortestPath((a)-[*]-(b)) RETURN path |
| allShortestPaths() | 所有最短路径 | MATCH paths = allShortestPaths((a)-[*]-(b)) RETURN paths |

### 路径函数表格

| 函数 | 用法简介 | 示例 |
|------|----------|------|
| LENGTH() | 路径长度 | MATCH path = (a)-[*]-(b) RETURN LENGTH(path) |
| NODES() | 路径中的节点 | MATCH path = (a)-[*]-(b) RETURN NODES(path) |
| RELATIONSHIPS() | 路径中的关系 | MATCH path = (a)-[*]-(b) RETURN RELATIONSHIPS(path) |
| startNode() | 关系的起始节点 | MATCH ()-[r]->() RETURN startNode(r) |
| endNode() | 关系的结束节点 | MATCH ()-[r]->() RETURN endNode(r) |

### 字符串函数表格

| 函数 | 用法简介 | 示例 |
|------|----------|------|
| UPPER() | 转换为大写 | RETURN UPPER("hello") → "HELLO" |
| LOWER() | 转换为小写 | RETURN LOWER("HELLO") → "hello" |
| SIZE() | 字符串长度 | RETURN SIZE("hello") → 5 |
| SUBSTRING() | 截取子字符串 | RETURN SUBSTRING("hello", 1, 3) → "ell" |
| LEFT() | 左侧截取 | RETURN LEFT("hello", 3) → "hel" |
| RIGHT() | 右侧截取 | RETURN RIGHT("hello", 3) → "llo" |
| TRIM() | 去除两端空格 | RETURN TRIM(" hello ") → "hello" |
| REPLACE() | 字符串替换 | RETURN REPLACE("hello", "l", "x") → "hexxo" |
| SPLIT() | 字符串分割 | RETURN SPLIT("a,b,c", ",") → ["a","b","c"] |
| toString() | 转换为字符串 | RETURN toString(123) → "123" |

### 数学函数表格

| 函数 | 用法简介 | 示例 |
|------|----------|------|
| ABS() | 绝对值 | RETURN ABS(-5) → 5 |
| CEIL() | 向上取整 | RETURN CEIL(4.3) → 5 |
| FLOOR() | 向下取整 | RETURN FLOOR(4.7) → 4 |
| ROUND() | 四舍五入 | RETURN ROUND(4.6) → 5 |
| SQRT() | 平方根 | RETURN SQRT(16) → 4.0 |
| RAND() | 随机数(0-1) | RETURN RAND() → 0.123456 |
| SIGN() | 符号函数 | RETURN SIGN(-5) → -1 |

### 列表函数表格

| 函数 | 用法简介 | 示例 |
|------|----------|------|
| SIZE() | 列表长度 | RETURN SIZE([1,2,3]) → 3 |
| HEAD() | 列表第一个元素 | RETURN HEAD([1,2,3]) → 1 |
| LAST() | 列表最后一个元素 | RETURN LAST([1,2,3]) → 3 |
| TAIL() | 除第一个元素外的列表 | RETURN TAIL([1,2,3]) → [2,3] |
| REVERSE() | 反转列表 | RETURN REVERSE([1,2,3]) → [3,2,1] |
| RANGE() | 生成数字范围 | RETURN RANGE(1,5) → [1,2,3,4,5] |
| UNWIND | 展开列表为行 | UNWIND [1,2,3] AS x RETURN x |

### 日期时间函数表格

| 函数 | 用法简介 | 示例 |
|------|----------|------|
| timestamp() | 当前时间戳(毫秒) | RETURN timestamp() → 1640995200000 |
| datetime() | 当前日期时间 | RETURN datetime() → 2024-01-01T00:00:00Z |
| date() | 当前日期 | RETURN date() → 2024-01-01 |
| time() | 当前时间 | RETURN time() → 12:30:45.123 |
| datetime.now() | 当前日期时间 | RETURN datetime.now() |
| date.parse() | 解析日期字符串 | RETURN date("2024-01-01") |

### 类型检查函数表格

| 函数 | 用法简介 | 示例 |
|------|----------|------|
| type() | 关系类型 | MATCH ()-[r]->() RETURN type(r) |
| labels() | 节点标签 | MATCH (n) RETURN labels(n) |
| keys() | 属性键列表 | MATCH (n) RETURN keys(n) |
| properties() | 所有属性 | MATCH (n) RETURN properties(n) |
| id() | 内部ID | MATCH (n) RETURN id(n) |
| exists() | 检查属性是否存在 | MATCH (n) WHERE exists(n.email) RETURN n |

### 高级查询模式表格

| 模式 | 用法简介 | 示例 |
|------|----------|------|
| OPTIONAL MATCH | 可选匹配(类似LEFT JOIN) | MATCH (p:Person) OPTIONAL MATCH (p)-[r:KNOWS]->(f) RETURN p, f |
| WITH | 传递中间结果 | MATCH (p:Person) WITH p WHERE p.age > 25 RETURN p.name |
| UNION | 合并查询结果 | MATCH (p:Person) RETURN p.name UNION MATCH (c:Company) RETURN c.name |
| UNION ALL | 合并所有结果(包含重复) | MATCH (p:Person) RETURN p.name UNION ALL MATCH (p:Person) RETURN p.email |
| CASE WHEN | 条件表达式 | MATCH (p:Person) RETURN p.name, CASE WHEN p.age < 18 THEN "未成年" ELSE "成年" END |
| FOREACH | 遍历列表执行操作 | MATCH (p:Person) FOREACH (skill IN p.skills | CREATE (p)-[:HAS_SKILL]->(:Skill {name: skill})) |

### 索引和约束表格

| 命令 | 用法简介 | 示例 |
|------|----------|------|
| CREATE INDEX | 创建索引 | CREATE INDEX FOR (p:Person) ON (p.name) |
| DROP INDEX | 删除索引 | DROP INDEX FOR (p:Person) ON (p.name) |
| SHOW INDEXES | 显示所有索引 | SHOW INDEXES |
| CREATE CONSTRAINT | 创建唯一约束 | CREATE CONSTRAINT FOR (p:Person) REQUIRE p.email IS UNIQUE |
| DROP CONSTRAINT | 删除约束 | DROP CONSTRAINT constraint_name |
| SHOW CONSTRAINTS | 显示所有约束 | SHOW CONSTRAINTS |

### 查询分析表格

| 命令 | 用法简介 | 示例 |
|------|----------|------|
| EXPLAIN | 显示执行计划 | EXPLAIN MATCH (p:Person) WHERE p.age > 25 RETURN p |
| PROFILE | 显示执行计划和统计信息 | PROFILE MATCH (p:Person) WHERE p.age > 25 RETURN p |
| CALL | 调用存储过程 | CALL db.labels() |
| YIELD | 指定过程返回字段 | CALL db.labels() YIELD label |


### 常用查询示例

| 场景 | 查询示例 |
|------|----------|
| **查找二度好友** | MATCH (me:Person)-[:KNOWS]-(friend)-[:KNOWS]-(fof:Person) WHERE me.name = "张三" AND fof <> me RETURN DISTINCT fof.name |
| **共同好友** | MATCH (a:Person)-[:KNOWS]-(common)-[:KNOWS]-(b:Person) WHERE a.name = "张三" AND b.name = "李四" RETURN common.name |
| **节点度数统计** | MATCH (p:Person)-[r]-() RETURN p.name, COUNT(r) AS degree ORDER BY degree DESC |
| **路径长度查询** | MATCH path = shortestPath((a:Person)-[*]-(b:Person)) WHERE a.name = "张三" AND b.name = "李四" RETURN LENGTH(path) |
| **批量创建关系** | MATCH (a:Person), (b:Person) WHERE a.department = b.department AND a <> b MERGE (a)-[:COLLEAGUE]->(b) |