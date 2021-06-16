---
title: GraphQL初探
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

对于 API 而言，GraphQL 被视为一种革命性的新思路、新技术。GraphQL 改变了前后端团队的交互方式、颠覆了前后端团队的通信方式，使得他们可以更顺畅而高效地协作。

正如Samer Buna在其著作《GraphQL in Action》中的序言中所说的那样[^1]：

> 早在 2015 年，Facebook 首次宣布 GraphQL 项目时，我第一次听说了 GraphQL，那个时候 GraphQL 就深深的吸引了我。并且，学习 GraphQL 是我做过的最好的时间投资之一。

最近，在不断的了解、学习、使用 GraphQL 之后，我也像 Samer Buna 一样，被 GraphQL 深深的吸引了。

<!--more-->

## GraphQL简介[^2] [^3]


## GraphQL vs. REST
关于 GraphQL 和 REST 之间的详细对比，我认为可以参考 *GraphQL vs. REST*，此处不再赘述了[^4] [^5]。

## GraphQL 的优势
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

从如上的例子可以看出，GraphQL 实际上是一种强类型的Api。与使用普通的 REST Api 相比，强类型系统是 GraphQL 最吸引我的地方之一。在我看来，正是 GraphQL 强类型的特性，开创了 Api 的新天地。

在我看来，REST Api 缺乏`类型系统`特性在开发中会引入很多的问题，工作中，我经常会遇到如下的情况：
* 上游服务修改了 REST Api 的字段类型而未周知下游消费者导致下游服务异常甚至崩溃
* 服务端未返回特定字段导致客户端崩溃
* 客户端请求参数异常，导致服务端的错误率上升
* 到处找借口文档，好不容易找到了忽然发现，接口文档和接口的返回并不一致，文档太滞后了
* ……

如果有一个类型系统进行约束，则情况会变的更好一点。因此，针对于 json 格式的 REST Api 而言，开始出现类似 [Swagger UI](https://swagger.io/tools/swagger-ui/) 这样的工具，利用 [Json Schema](https://json-schema.org/) 来强化其类型系统。虽然如此，但是，在我看来，基于 Json Schema 的 REST Api 类型系统仅仅是一个规范和建议而已，团队中的其他人不使用也没办法。但是，GraphQL 的类型系统是其根基，所有人必须遵守，这就在大家对接口描述形成统一认识上发挥着重要作用。

同样的道理，对于 [rapidjson](https://github.com/Tencent/rapidjson/) 而言，从 v1.1 版本开始，也加入了 JSON Schema 功能，使其可以在解析或生成 JSON 时进行校验，以避免类型错误的 json 而导致的解析时崩溃问题的发生。

弱类型语言引入类型系统也变得越来越流行，例如微软的 [TypeScript](https://www.typescriptlang.org/)，PHP7 的 [强类型模式](https://www.php.net/manual/en/language.types.declarations.php)，还有 Facebook 开发的 [Hack语言](https://hacklang.org/)……

弱类型语言，看似无拘无束，实则充满了混乱与危险；强类型语言，看似画地为牢，实则是另一种自由。在 GraphQL 类型系统的帮助下，我们可以精确的描述我们的接口数据，并且可以做到数据描述和接口完全对应。这种能力对于大型、多人协作式团队而言，至关重要。尤其是微服务盛行的今天，我认为，GraphQL 的强类型系统为微服务交互提供了新的活力。

#### 我的地盘听我的，仅要我所需
在 GraphQL 中，GraphQL Runtime 确定 GraphQL Server 可以提供的能力，而消费端具体要获取哪些数据则完全由消费者说了算。对于下游消费者而言真正做到了：我的地盘，听我的！只要我所要的，不多也不少！

之所以说 GraphQL 是革命性的新技术，我觉得就在于此。GraphQL 改变了服务之间交互的方式，让通信双方在交互的过程中更加平等，改变了之前响应数据完全由 Server 端说了算的局面。如今，在 GraphQL 中，客户端（消费端）可以以更加平等的地位，更加积极的参与到整个的数据交互过程。

借助于 GraphQL 的类型系统，客户端可以更加自由的根据自己的需求来获得自己的所需，而无需收到 Server 端的限制。

在我的个人博客站点中，我采用 [github action](https://docs.github.com/en/actions) 来编译并发布站点内容。站点中，会有很多基于 [gitbook](https://www.gitbook.com/) 的书籍，并且每一本书都对应一个 github 仓库。为了加快站点的发布速度，对于每一本书籍而言，都会提前编译并且将编译产物置于 latest release 中。在发布主站内容时，我利用 [build_books.sh](https://github.com/wangwei1237/wangwei1237.github.io_src/blob/master/build_books.sh) 脚本来获取书籍的 release 产物。如果采用REST Api，则相对比较简单，直接请求如下的 `end point` 即可：

```javascript
https://api.github.com/repos/wangwei1237/${BOOKS[i]}/releases/latest
```

这种情况下，我只需要对应的 `assets.browser_download_url`字段，但是使用 REST Api 我没办法控制接口的返回数据，即便我只需要某一个字段，接口还是会返给我所有的数据。

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
GraphQL 不但改变了通信双方的话语权，还使得客户端可以精确的预测服务端的响应。在使用 REST Api 时，我们需要借助各种 Api 文档才能**大概**预测请求的响应，在开发中，这确实是一件非常讨厌的事情。无法精确的预测请求的响应，这回直接导致代码的容错性大大折扣。谁能确保所有的接口的接口文档都会详细的穷举所有情况下的接口响应呢？据我的经验而言，很难……

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

## 学习资源
* https://spec.graphql.cn/
* https://graphql.org/ or https://graphql.cn
* https://graphql.org/swapi-graphql/
* https://docs.github.com/en/graphql
* https://docs.github.com/en/graphql/overview/explorer
* https://www.apollographql.com/docs/
* https://www.howtographql.com
* https://wangwei1237.gitee.io/shares/GraphQL_in_Action.pdf

## 参考文献
[^1]: Samer Buna. GraphQL in Action. Manning Publications, March 9, 2021. 
[^2]: https://graphql.org/, https://graphql.cn/.
[^3]: [Github Docs: GitHub GraphQL API](https://docs.github.com/en/graphql)
[^4]: [GraphQL vs. REST](https://www.apollographql.com/blog/graphql/basics/graphql-vs-rest/).
[^5]: [GraphQL is the better REST](https://www.howtographql.com/basics/1-graphql-is-the-better-rest/)
[^6]: [Reasons to use GraphQL | Top 5 Reasons Why and How to use GraphQL](https://www.prisma.io/blog/top-5-reasons-to-use-graphql-b60cfa683511)