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
#### GraphQL 改造确实具有一定的成本
利用新技术改造老的系统必须要考虑的因素之一就是成本，这里面涉及到：
* 新技术的学习成本
* 开发的成本
* 出现问题后的定位成本
* ……

我在 GraphQL 迁移过程所花费的成本上，重点还是学习成本，主要涉及：
* 理论学习
* 框架学习：[Graphene](https://docs.graphene-python.org/en/stable/) 框架以及 [Graphene-Django](https://docs.graphene-python.org/projects/django/en/latest/) 框架

并且，整个学习所花费的时间比真正开发的时间要高很多，真正用于 GraphQL API 开发所花费的时间并不多。

#### GraphQL 的代码更简练
个人感觉，在某些情况下，GraphQL 的类型系统使得其更具表达性，这可以让 GraphQL API 看起来更简练。

如下所示的 GraphQL Schema 中，`videoList` 字段的类型为 `VideoList`，而 `VideoList` 类型则包含一个类型为 `[Video]` 的字段。因此对于 `videoList` 字段而言，只需要处理 `total` 和 `hasMore` 字段即可。从这个层面上讲，整个的代码会更加简洁。

``` python
type Query {
  video(vid: ID!): Video
  videoList(first: Int!, 
            after: Int, 
            codec: VideoCodec, 
            format: VideoDemux, 
            resolution: VideoResolution, 
            vid: Int): VideoList
}

type VideoList {
  videos: [Video!]
  total: Int!
  hasMore: Boolean!
}
```

尤其是在当 `video` 和 `videoList.videos` 所需的数据不一致时，GraphQL *按需请求*的特性使得服务端无需额外的改动，即可实现不同的请求方请求不同数据。而在 REST API 的老系统中，可以随处看到为了兼容不同请求方的各种补丁代码。

#### GraphQL 更加面向服务使用者
GraphQL API 完成之后，我们找了几名该服务的使用者来亲自体验 GraphQL API。得益于 GraphQL 提供的如下图所示的接口文档，大家普遍反馈使用 GraphQL API 比使用 REST API 更顺畅，更放心，更高效。使用 GraphQL API 后，再也不用到处找 API 的文档了。

<p><img src="/2021/07/17/The-First-Python-Project-For-GraphQL/6.gif" width="200px"></p>

对于 `videoList`，可以根据视频所用的编解码器（`codec` 参数）来进行筛选。对于下游消费者而言，如果使用 REST API，则需要通过各种格式的接口文档才能确定该参数的值；而使用 GraphQL API，则直接通过如上图所示的文档即可明确的了解到该参数的取值范围。

尤其是当接口文档和接口的实现不一致的时候，REST API 的文档对于使用者而言，简直就是一场噩梦。而 GraphQL API 的文档是根据 GraphQL Schema 自动生成的，因此，GraphQL 天然就具有文档和代码同步的优势。

尤其是在微服务大行其道的现在，相较于 REST API 而言，我认为 GraphQL API 的效率更高。这里的效率集中体现在*沟通效率*和*协作效率*。在 Sam Newman 的 *Monolith to Microservices* 的[破坏性的服务变更](/monolith-to-microservices/docs/Breaking_Changes.html)中讲的那样：

> 微服务作为更大的系统的一部分而存在。每个微服务要么使用其他微服务提供的功能，要么向其他微服务提供自己的功能，要么二者兼而有之。对于微服务架构而言，我们正在努力实现其独立可部署性。但是为了实现其独立部署，我们需要确保对微服务的修改不会干扰其下游消费者。

因此，对于微服务架构下的系统而言，虽然不同的微服务内部可以做到独立部署，但是却不可避免的会使用到其他团队提供的微服务。当微服务的数量不断增加的同时更带来了异常复杂的沟通、协作成本，这种情况下，沟通效率可能会成为阻碍开发效能的重要因素。

所以，我认为，GraphQL 对于微服务架构而言具备天然的优势。当然，如果 REST API 的接口文档能够做到和代码实现同步的话，使用 REST API 也是没有问题的，但是有多少团队可以做到这一点呢？

#### GraphAPI 的性能