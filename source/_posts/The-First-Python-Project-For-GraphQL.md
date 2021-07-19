---
title: GraphQL 实践
reward: false
top: false
date: 2021-07-17 18:32:00
authors:
categories:
  - GraphQL
tags:
  - GraphQL-Python
  - Graphene
  - Graphene-Django
---

![](1.png)

> 纸上得来终觉浅，绝知此事要躬行。

在 [GraphQL 初探](/2021/06/15/Preliminary-Exploration-of-the-GraphQL/)一文中，对 GraphQL 进行了初步的介绍和分析。在对 GraphQL 有了一定认识之后，总想着能在实践中真正的体验一下 GraphQL。实践是检验真理的唯一标准嘛，与其轻信与网络上的各种对比分析，倒不如真正的去体验一下。

恰好近期有一个小型的项目需要优化，于是就在该小型项目基础上实践了 GraphQL。之前，该项目是基于 django 框架开发的 REST API，此次实践，采用 [Graphene-Django](https://github.com/graphql-python/graphene-django) 为该项目增加了对应的 GraphQL API。

<!--more-->

## 项目的简化模型
这个小项目的核心其实就是为各种视频物料提供一个存储和检索的微服务，该微服务具有以下的功能：
* 存储视频以及视频的元数据
* 根据不同的条件检索满足条件的视频

在该微服务中的每条视频：
* 都包含视频标签（VideoTag）信息
* 利用该视频产生其他格式的视频（我们称之为派生视频）

该项目用到的数据存储如下图所示：
![](2.png)

* *Video* 表中存储了视频的相关信息
* *DerivedVideo* 表中存储了派生视频的相关信息，用以记录根据 parentId 视频派生出的视频的 vid 信息
* *VideoTag* 表中存储了视频的标签信息

该微服务的整体架构如下所示：
![](3.png)

## GraphQL 的迁移思路
将现有的 REST API 迁移到 GraphQL API 有三种思路：
* 完全按照 GraphQL 实现现有微服务提供的所有能力
* 利用 GraphQL 对当前系统的现有代码进行整合
  ![](4.png)
* 利用 GraphQL 对当前系统的 REST API 进行封装
  ![](5.png)

考虑到学习成本，改造成本，服务性能等问题，最终我们决定采用第 2 种方法对当前的微服务进行 GraphQL 升级。

## GraphQL 迁移过程中的感想




