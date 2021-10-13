---
title: GraphQL 初探
reward: false
top: false
date: 2021-06-15 13:55:38
authors:
categories:
  - GraphQL
tags:
  - GraphQL
---

![](1.jpg)

早在 2019 年的时候，我在 InfoQ 上读到了一篇携程介绍其关于 GraphQL 探索的文章：[全面解析 GraphQL，携程微服务背景下的前后端数据交互方案](https://www.infoq.cn/article/xZ0ws6_A5jmrJ6ZTPOz8)。这是我第一次接触到 GraphQL 的概念，当时并没有做深入的了解和学习，后来，在工作中，这个概念也在脑海中慢慢的淡化了。

今年 3 月份的时候，我在 InfoQ 上读到了爱奇艺关于 GraphQL 落地的文章：[减少重复开发，GraphQL 在低代码平台如何落地？](https://www.infoq.cn/article/cWTUJhYMT6DjGQOHIse2)。刚开始觉得这个概念似曾相识，于是就搜索了一下，然后勾起了初次听到 GraphQL 的记忆。接下来，我在 InfoQ 上搜索了和 GraphQL 相关的内容，才发现原来有很多文章已经在介绍 GraphQL。同时，我在 GitHub 的文档中发现 GitHub 也提供了 [GraphQL API 文档](https://docs.github.com/en/graphql)，技术的敏感性促使我下定决心来仔细&深入的了解 GraphQL。

于是，我在 [manning](https://www.manning.com/) 上找到了 [GraphQL in Action](https://www.manning.com/books/graphql-in-action)（我一般会试图在这个站点找到希望了解的技术领域的最新的书籍）， 然后参照这本书，开启了我的 GraphQL 之旅。
<!--more-->

## GraphQL 简介
对于 API 而言，GraphQL 被视为一种革命性的新思路、新技术。GraphQL 改变了前后端团队的交互方式、颠覆了前后端团队的通信方式，使得他们可以更顺畅而高效地协作。

正如Samer Buna在其著作 [《GraphQL in Action》](https://wangwei1237.gitee.io/shares/GraphQL_in_Action.pdf) 中的序言中所说的那样[^1]：

> 早在 2015 年，Facebook 首次宣布 GraphQL 项目时，我第一次听说了 GraphQL，那个时候 GraphQL 就深深的吸引了我。并且，学习 GraphQL 是我做过的最好的时间投资之一。

在不断的了解、学习、使用 GraphQL 之后，我也像 Samer Buna 一样，被 GraphQL 深深的吸引了。

关于 GraphQL 的介绍，网上已经有非常多的资料了，这里不再过多描述，具体可以参考 [GraphQL.org](https://graphql.cn/)[^2]，[GitHub GraphQL Docs](https://docs.github.com/en/graphql)[^3]，以及 [GraphQL in Action](https://wangwei1237.gitee.io/shares/GraphQL_in_Action.pdf)。

## GraphQL vs. REST
关于 GraphQL 和 REST 之间的详细对比，我认为可以参考 [GraphQL vs. REST](https://www.apollographql.com/blog/graphql/basics/graphql-vs-rest/) 以及 [GraphQL is the better REST](https://www.howtographql.com/basics/1-graphql-is-the-better-rest/)，此处不再赘述了[^4] [^5]。

## GraphQL 的优势有哪些
在  [《GraphQL in Action》](https://wangwei1237.gitee.io/shares/GraphQL_in_Action.pdf) 中，作者对 GraphQL 的优缺点做了很全面的介绍；在 [GraphQL 的社区网站](https://graphql.org/) 上，也对 GraphQL 的优点做了全面的介绍；甚至，可以用搜索引擎搜索出一堆 GraphQL 相关的文章和资源……

但是，作为一个刚接触 GraphQL 的门外汉，我还是希望写一写自己学习 GraphQL 之后的感想，尤其是我觉的 GraphQL 那些能让我激动无比的特性。

#### GraphQL 的强类型系统
在 GraphQL 中，类型系统用于描述 GraphQL Server 的能力并用于判断一个查询是否有效。类型系统还描述了查询参数的输入类型，并在 GraphQL Runtime 中检查参数值的有效性。

一个 GraphQL 服务是通过定义`类型`和`类型`上的`字段`来创建的，然后给每个`类型`上的每个`字段`提供`解析函数`。

例如，在 [Github GraphQL Server](https://docs.github.com/en/graphql/overview/explorer) 中，使用 `viewer` 字段来描述当前登录用户的信息，而 `viewer` 的`类型`为 `User`。

```javascript
type Query {
  viewer: User!
}

type User {
  // ...
  location: String
  login: String!
  name: String
  // ...
}
```

一旦启动某个 GraphQL Server，它就能接收 GraphQL 查询，并验证和执行该查询。GraphQL Server 首先会检查该查询以确保它只引用了已定义的`类型`和`字段`，然后运行指定的`解析函数`来生成结果。例如，我们可以在 [Github GraphQL Server](https://docs.github.com/en/graphql/overview/explorer) 中运行如下的查询：

```
query { 
  viewer { 
    login
    name
  }
}
```

从如上的例子可以看出，GraphQL 实际上是一种强类型的 API。与使用普通的 REST API 相比，强类型系统是 GraphQL 最吸引我的地方之一。在我看来，正是 GraphQL 强类型的特性，开创了 API 的新天地。

在我看来，REST API 缺乏`类型系统`特性在开发中会引入很多的问题，工作中，我经常会遇到如下的情况：
* 上游服务修改了 REST API 的字段类型而未周知下游消费者导致下游服务异常甚至崩溃
* 服务端未返回特定字段导致客户端崩溃
* 客户端请求参数异常，导致服务端的错误率上升
* 到处找借口文档，好不容易找到了忽然发现，接口文档和接口的返回并不一致，文档太滞后了
* ……

如果有一个类型系统进行约束，则情况会变的更好一点。因此，针对于 json 格式的 REST API 而言，开始出现类似 [Swagger UI](https://swagger.io/tools/swagger-ui/) 这样的工具，利用 [Json Schema](https://json-schema.org/) 来强化其类型系统。虽然如此，但是，在我看来，基于 Json Schema 的 REST API 类型系统仅仅是一个规范和建议而已，团队中的其他人不使用也没办法。但是，GraphQL 的类型系统是其根基，所有人必须遵守，这就在大家对接口描述形成统一认识上发挥着重要作用。

同样的道理，对于 [rapidjson](https://github.com/Tencent/rapidjson/) 而言，从 v1.1 版本开始，也加入了 JSON Schema 功能，使其可以在解析或生成 JSON 时进行校验，以避免类型错误的 json 而导致的解析时崩溃问题的发生。

弱类型语言引入类型系统也变得越来越流行，例如微软的 [TypeScript](https://www.typescriptlang.org/)，PHP7 的 [强类型模式](https://www.php.net/manual/en/language.types.declarations.php)，还有 Facebook 开发的 [Hack语言](https://hacklang.org/)……

弱类型语言，看似无拘无束，实则充满了混乱与危险；强类型语言，看似画地为牢，实则是另一种自由。在 GraphQL 类型系统的帮助下，我们可以精确的描述我们的接口数据，并且可以做到数据描述和接口完全对应。这种能力对于大型、多人协作式团队而言，至关重要。尤其是微服务盛行的今天，我认为，GraphQL 的强类型系统为微服务交互提供了新的活力。

#### 我的地盘听我的，仅要我所需
在 GraphQL 中，GraphQL Runtime 确定 GraphQL Server 可以提供的能力，而消费端具体要获取哪些数据则完全由消费者说了算。对于下游消费者而言真正做到了：我的地盘，听我的！只要我所要的，不多也不少！

之所以说 GraphQL 是革命性的新技术，我觉得就在于此。GraphQL 改变了服务之间交互的方式，让通信双方在交互的过程中更加平等，改变了之前响应数据完全由 Server 端说了算的局面。如今，在 GraphQL 中，客户端（消费端）可以以更加平等的地位，更加积极的参与到整个的数据交互过程。

借助于 GraphQL 的类型系统，客户端可以更加自由的根据自己的需求来获得自己的所需，而无需收到 Server 端的限制。

在我的个人博客站点中，我采用 [github action](https://docs.github.com/en/actions) 来编译并发布站点内容。站点中，会有很多基于 [gitbook](https://www.gitbook.com/) 的书籍，并且每一本书都对应一个 github 仓库。为了加快站点的发布速度，对于每一本书籍而言，都会提前编译并且将编译产物置于 latest release 中。在发布主站内容时，我利用 [build_books.sh](https://github.com/wangwei1237/wangwei1237.github.io_src/blob/master/build_books.sh) 脚本来获取书籍的 release 产物。如果采用REST API，则相对比较简单，直接请求如下的 `end point` 即可：

```javascript
https://api.github.com/repos/wangwei1237/${BOOKS[i]}/releases/latest
```

这种情况下，我只需要对应的 `assets.browser_download_url`字段，但是使用 REST API 我没办法控制接口的返回数据，即便我只需要某一个字段，接口还是会返给我所有的数据。

而如果使用 GraphQL，我就可以自己说了算了：

```javascript
// GraphQL Query
query getBooksAssetUrl($repo: String!, $owner: String!) { 
  repository(name: $repo, owner: $owner) {
    latestRelease {
      releaseAssets(first: 1) {
        nodes {
          downloadUrl
        }
      }
    }
  }
}

// Query Variables
{
  "repo": "monolith-to-microservices",
  "owner": "wangwei1237"
}

// Query Response
{
  "data": {
    "repository": {
      "latestRelease": {
        "releaseAssets": {
          "nodes": [
            {
              "downloadUrl": "https://github.com/wangwei1237/monolith-to-microservices/releases/download/v1.1.1/monolith-to-microservices.tar.gz"
            }
          ]
        }
      }
    }
  }
}
```

因此，在这种情况下，GraphQL 完美的避免了不必要的数据传输（overfetching）[^6],尤其是对于如下的场景：流量较大，网络较差，针对不同的客户端返回不同数据……，这个特性尤为重要。更重要的是，这个特性改变了通信双方的话语权。

#### 精确预测响应数据
GraphQL 不但改变了通信双方的话语权，还使得客户端可以精确的预测服务端的响应。在使用 REST API 时，我们需要借助各种 API 文档才能**大概**预测请求的响应，在开发中，这确实是一件非常讨厌的事情。无法精确的预测请求的响应，这回直接导致代码的容错性大大折扣。谁能确保所有的接口的接口文档都会详细的穷举所有情况下的接口响应呢？据我的经验而言，很难……

当我请求一个没有 release 产物的的仓库时，根据 GraphQL 的类型系统，我会预测到，此时 GraphQL 会返回 null，如下所示：

```javascript
// latestRelease type
latestRelease: Release

// Query Variables
{
  "repo": "wangwei1237.github.io",
  "owner": "wangwei1237"
}

// Query Response
{
  "data": {
    "repository": {
      "latestRelease": null
    }
  }
}
```

#### GraphQL API 的版本控制
对于 API 的版本控制而言，GraphQL 借鉴了其他语言中的 `@deprecated注解`。如果经受过 REST API 的版本控制之痛，经受过那些 v1，v2，……，那么你也会像我一样，喜欢 GraphQL 提供的这一特性。

摘录Samer Buna在 [《GraphQL in Action》](https://wangwei1237.gitee.io/shares/GraphQL_in_Action.pdf) 中的例子如下：

```javascript
type Query {
  hello: String
  currentTime: String
  sumNumbersInRange(begin: Int!, end: Int!): Int! @deprecated(reason: "use new fields numbersInRange")
  numbersInRange(begin: Int!, end: Int!): NumbersInRange!
  taskMainList: [Task!]
  taskInfo(taskId: ID!): Task!
}

"""Aggregate info on a range numbers"""
type NumbersInRange {
  sum: Int!
  count: Int!
  avg: Float!
}
```

对于 `sumNumbersInRange` 字段，使用 `@deprecated` 标志该字段是废弃字段，并且利用 `reason` 参数来将该废弃字段和推荐的新字段关联起来。如果配合 IDE 的代码扫描能力，当在接口中请求 `sumNumbersInRange` 的时候，IDE 给出对应的废弃提示和原因，那么经过一段时间的迭代，标记为 `@deprecated` 的字段就会慢慢消失在产品代码中。这会使得 API 的版本管理更加容易，也使得客户端更加容易理解 API 的进化和向后兼容。

而使用 REST API 的时候，在没有这种类似机制的帮助下，我经常会使用了上游服务准备 `deprecated` 的字段，因此，在这种情况下，准备废弃的字段不得不为了兼容而永久的保留在了服务之中。

我见过一个 REST API，这个 API 经过好几年的发展，每次请求都会返回 10K+ 的数据，并且里面有很多字段的含义基本一致，只不过是有些字段为了兼容某个特定的需求而增加。这个 API 中的字段谁也不敢动，能做的只能是随着需求的增加而不断的增加该 API 的规模。开发这个 API 是一件非常可怕的事情。

## 如何看待 GraphQL 的缺点
新生之物，其貌必丑。虽然 GraphQL 已经发展了几年，但是实际上而言 GraphQL 还算是一个比较新颖的技术。根据 [《GraphQL in Action》](https://wangwei1237.gitee.io/shares/GraphQL_in_Action.pdf) 中的第 1.3 节的介绍，到目前为止，GraphQL 仍然有很多的问题需要解决，例如：
* 安全性问题
* 缓存问题
* 学习门槛问题
* ……

虽然如此，我还是认为 GraphQL 开创了 API 交互的新天地，代表着新的技术的发展方向。并且我也发现，目前整个 GraphQL 社区也在做很多的工作来解决目前的一些问题。例如 Facebook 为了解决缓存问题而开发的 dataloader 库，[apollo graphql](https://www.apollographql.com/) 在推动 GraphQL 工业落地方面所做的各种努力，……

正如我在 [如何提升工作效率](/2021/05/01/how-to-improve-the-work-efficiency/) 一文中说的那样：

> 我们必须认识到，短期看，新技术会解决我们当前的问题，但是新技术必然会引入新的问题，我们需要与时俱进，在新的场景下不断解决新技术带来的问题。这有这样，才能不断的提升工作效率。
> 
> 我们不能因为堵车，就回退到自行车的时代；我们不能因为有假币，就回退到物物交换的时代；……

并且，目前看，GraphQL 正在变的越来越流行。Postman 博客站点的 [Postman v7.2 Supports GraphQL](https://blog.postman.com/postman-v7-2-supports-graphql/) 中提到：

> 如果您一直在等待 Postman 对 GraphQL 的支持，那么现在可以结束这种等待了。随着 Postman v7.2 的发布，Postman 已经支持 GraphQL！在 GitHub 上，[GraphQL 的内置支持](https://github.com/postmanlabs/postman-app-support/issues/1669)一直是我们的第二大最受欢迎的特性，我们很高兴将这个流行的规范引入 Postman 应用程序。

## 如何判断是否要使用 GraphQL
即便如此，在确定是否要使用 GraphQL 技术时，需要做认真的分析，且不可为了追新而采用 GraphQL。

如果所提供服务的下游消费者较少并且范围也较少，那么还是推荐使用 REST API。但是如果提供的服务是类似 Github Open API 这样的规模较大的服务，或者使用该服务的下游消费者范围较大、数量较多，我认为采用 GraphQL 确实是上上之选。

总之，越是涉及到团队交互多、团队协作多的服务，我越是建议采用 GraphQL。因为协作最复杂的地方在于 `communication`，而 GraphQL 就是革新多方协作的一种新技术。就像万维网彻底改变了人类世界的交流方式一样，我想，GraphQL 正在彻底改变 API 的交流方式，尤其是在微服务架构中[^7] [^8] [^9]。

!!! warning "除了如上的考虑外，还需要思考如下的问题"
    * GraphQL 是否适合当前的业务发展阶段？
    * 引入 GraphQL 之后的版本兼容问题、配套基础设施的改造等如何处理？
    * 引入 GraphQL 是否能够在解决现有业务问题的基础上避免引入更多的问题？
    * 团队内部的其他成员是否接受 GraphQL 的这种理念，例如前端人员是否乐意拥有定义接口的这种权利？
    * ……

![](2.png)

## 后记
后来，我们对一个内部的小项目实施了 GraphQL 迁移，具体的可以参见：[GraphQL 实践](/2021/07/17/The-First-Python-Project-For-GraphQL/)。

## 学习资源
* https://spec.graphql.cn/
* https://graphql.org/ or https://graphql.cn
* https://graphql.org/swapi-graphql/
* https://docs.github.com/en/graphql
* https://docs.github.com/en/graphql/overview/explorer
* https://www.apollographql.com/docs/
* https://www.howtographql.com
* https://wangwei1237.gitee.io/shares/GraphQL_in_Action.pdf
* https://github.com/graphql/graphql-playground

## 参考文献
[^1]: Samer Buna. GraphQL in Action. Manning Publications, March 9, 2021. 
[^2]: https://graphql.org/, https://graphql.cn/.
[^3]: [Github Docs: GitHub GraphQL API](https://docs.github.com/en/graphql)
[^4]: [GraphQL vs. REST](https://www.apollographql.com/blog/graphql/basics/graphql-vs-rest/).
[^5]: [GraphQL is the better REST](https://www.howtographql.com/basics/1-graphql-is-the-better-rest/)
[^6]: [Reasons to use GraphQL | Top 5 Reasons Why and How to use GraphQL](https://www.prisma.io/blog/top-5-reasons-to-use-graphql-b60cfa683511)
[^7]: [GraphQL as an API Gateway to Microservices](https://www.cloudbees.com/blog/graphql-as-an-api-gateway-to-micro-services)
[^8]: [Netflix Embraces GraphQL Microservices for Rapid Application Development](https://www.infoq.com/news/2021/03/netflix-graphql-microservices/)
[^9]: [Beyond REST——Rapid Development with GraphQL Microservices](https://netflixtechblog.com/beyond-rest-1b76f7c20ef6)