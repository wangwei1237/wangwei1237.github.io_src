---
title: 用示例揭开 MCP 的神秘面纱
reward: false
top: false
date: 2025-04-17 09:30:10
authors:
categories:
  - LLM
tags:
  - MCP
  - Agent
---
![](1.jpg)

2024 年 11 月 25 日，Anthropic 在官方博客 [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) 中正式开源了可以将各种工具链接到 LLM 的 MCP（*Model Context Protocol*）协议，以增强 LLM 的能力。

> Today, we're open-sourcing the Model Context Protocol (MCP), a new standard for connecting AI assistants to the systems where data lives, including content repositories, business tools, and development environments. Its aim is to help frontier models produce better, more relevant responses.
<!--more-->

## 缘起
起初的时候，MCP 并没有引起我的注意，因为根据 [MCP 官方文档](https://modelcontextprotocol.io/introduction) 中对 MCP 架构的描述可知，宿主程序通过 `MCP-Client` 和 `MCP-Server` 进行通信以获得当前可用的外部工具列表信息，同时宿主程序通过 `MCP-Client` 向 `MCP-Server` 发送请求以获得具体的外部数据或者外部 API 的调用。

```mermaid
flowchart LR
    %% 子图 Your Computer 区域
    subgraph "Your Computer"
        direction TB
        Host["Host with MCP Client<br>(Claude, IDEs, Tools)"]
        S1["MCP Server A"]
        S2["MCP Server B"]
        S3["MCP Server C"]
        D1[("Local<br>Data Source A")]
        D2[("Local<br>Data Source B")]
        
        Host e1@-->|MCP Protocol| S1
        Host e2@-->|MCP Protocol| S2
        Host e3@-->|MCP Protocol| S3
        S1 e4@--> D1
        S2 e5@--> D2
        e1@{ animate: true }
        e2@{ animate: true }
        e3@{ animate: true }
        e4@{ animate: true }
        e5@{ animate: true }
    end

    %% 子图 Internet 区域在右侧
    subgraph "Internet"
        direction TB
        D3[("Remote<br>Service C")]
    end

    S3 e6@-->|Web APIs| D3
    e6@{ animate: true }
```

以获取天气信息的场景为例：宿主程序通过 `MCP-Client` 向 `MCP-Server` 发送请求以获取天气信息，`MCP-Server` 会调用具体的天气服务 API 获取结果并返回给 `MCP-Client`。
```mermaid
sequenceDiagram
    autonumber
    participant Client as Client
    participant MCP as MCP Server
    participant WeatherTool as Weather Service

    Client->>MCP: mcp.call("weather.get", {"city": "Tokyo"})
    MCP->>WeatherTool: GET /weather?city=Tokyo
    WeatherTool-->>MCP: { "temp": 18, "humidity": 65 }
    MCP-->>Client: Result({ "temp": 18, "humidity": 65 })
```

而这个过程实际上和 OpenAI 的 [`Function Calling`](https://platform.openai.com/docs/guides/function-calling?api-mode=responses) 没有太大区别，表面上看起来仅仅是对工具的发现方式进行了重新定义而已。看起来，MCP 引入了 `Client` 和 `Server` 的概念，实际上只是将 `Function Calling` 中的工具发现和调用进行了拆分，本质上并没有带来新的东西。因此，当 MCP 刚刚发布的时候，我只是简单看了一下而已，并没有深入研究。

直到 2025 年 3 月的时候，MCP 突然爆红，成为了 LLM 领域的热门话题。
* 3 月 8 日，LangChain CEO Harrison Chase 与 LangChain 创始工程师、LangGraph 负责人 Nuno Campos 围绕着 [*MCP 是真正的技术突破，还是 AI 炒作浪潮下的又一朵浪花？*](https://blog.langchain.dev/mcp-fad-or-fixture/) 这一话题展开了激励的讨论。在讨论中，Harrison 更看好 MCP，并认为如果需要向无法控制的智能体中引入工具，MCP 就是最好的选择。而 Nuno 则认为，MCP 的潜力上限也就到 Zapier 这个程度了，它至少得变得更像 OpenAI 的自定义 GPT，才配得上大家如今对它的关注和期待。
* 3 月 9 日，LangChain 在 [X 平台上发起了一项投票](https://x.com/LangChainAI/status/1898410721215750487)：结合实际用例、与 OpenAI Plugin 的比较以及 MCP 自身的局限性，大家认为 MCP 到底是昙花一现、还是未来标准？根据 473 个用户的投票结果显示，有 40.8% 的人认为 MCP 是未来标准，25.8% 的人认为 MCP 只是昙花一现，剩下 33.4% 的人选择观望。
  ![](langchain_vote.png)
* 3 月 27 日，OpenAI 的 CEO Sam Altman 在 [X 平台发消息称](https://x.com/sama/status/1904957253456941061)：我们很高兴在我们的产品中增加对 MCP 的支持，agent SDK 已经可以支持 MCP，并且 ChatGPT 桌面应用程序 和 API 也将很快就会增加对 MCP 的支持。OpenAI 对 MCP 的支持，无疑加速了 MCP 的发展，同时也意味着 MCP 成为行业标准的可能性也越来越大。
* 4 月，阿里云、腾讯云、百度智能云等云服务商也纷纷宣布支持 MCP 协议，进一步加速了 MCP 在国内的发展。
* 根据 [Smithery](https://smithery.ai/)、[modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)、[modelscope MCP 广场](https://modelscope.cn/mcp) 等平台的信息，目前已经有上千款 MCP 工具可供使用，从此也可以看出 MCP 的社区生态发展之快。

真正令我心动、想要深入研究一下 MCP 的事情还是 4 月 8 日 Github 官方开源了自己的 MCP Server——[github-mcp-server](https://github.com/github/github-mcp-server) 以重新定义 GitHub 自动化。我自己平时使用 Github 比较多，很多项目都会采用 Github 的 Actions 触发相关的自动化流水线执行，早在 2021 年[调研 GraphQL](/2021/06/15/Preliminary-Exploration-of-the-GraphQL/) 的时候，就对 Github 的 API 进行了非常深入的研究。因此，Github MCP Server 的开源对我触动比较大，我第一次萌生了想看看 MCP 究竟是什么的想法。

于是，我开始疯狂的在 Github Copilot 中、在 Cline 中、在其他的开源 MCP Client 中不停的使用 Github MCP Server，也在不停的使用过程中慢慢的对 MCP 有了更新的认识。

本文将以 [mcp-client-cli](https://github.com/adhikasp/mcp-client-cli) 和 [github-mcp-server](https://github.com/github/github-mcp-server)、[weather-mcp-server](https://github.com/CodeByWaqas/weather-mcp-server)、[dbhub](https://github.com/bytebase/dbhub) 为具体的例子，来一步步的揭开 MCP 的神秘面纱。

## Function Calling
预训练大模型的训练知识存在一个截止日期，例如 [o3](https://platform.openai.com/docs/models/o3) 的训练知识截止日期是 2024 年 6 月 1 日，[GPT-4o](https://platform.openai.com/docs/models/gpt-4o) 的训练知识截止日期是 2023 年 10 月 1 日。

![不同模型的训练数据截止日期](openai_kco.png)

大语言模型的本质是在训练知识的环境中，预测下一个 token。如果不能与外部系统交互，模型就只能模仿，无法成为真正能干事的“助手”。模型也永远只能在“语言的沙箱”中玩耍，无法跳出模型的知识边界去改变世界。最终，模型无法回答某些最新的、超出其训练截止日期的问题，也无法完成某些特定的动作，例如：

* 明天北京的天气如何
* 预定一张从北京到天津的火车票
* ……

为此，OpenAI 在 2023 年 6 月 13 日发布了 [Function Calling](https://openai.com/index/function-calling-and-other-api-updates/) 功能，开发者可以通过 Function Calling 解决模型与外部系统交互、调用逻辑程序、获取最新数据等方面的关键限制，以实现在需要时调用外部 API 获取最新信息或执行特定操作，进而使得大语言模型从“对话生成器”升级为“智能助手”。

根据 [OpenAI 的官方文档中给出的示例代码](https://platform.openai.com/docs/guides/function-calling?api-mode=responses)，通过 Function Calling 查询天气信息的步骤如下所示：

```mermaid
sequenceDiagram
    participant Developer
    participant Model

    Note over Developer,Model: Step 1 - Tool Definitions + Messages
    Developer->>Model: get_weather(location)<br>“What’s the weather in Beijing?”

    Note over Model: Step 2 - Tool Calls
    Model->>Developer: get_weather("Beijing")

    Note over Developer: Step 3 - Execute Function Code
    Developer->>Developer: get_weather("Beijing")<br>→ {"temperature": 14}

    Note over Developer,Model: Step 4 - Results
    Developer->>Model: All prior messages +<br>{"temperature": 14}

    Note over Model,Developer: Step 5 - Final Response
    Model->>Developer: "It’s currently 14°C in Beijing."
```

## Function Calling 的局限性
* 在 Function Calling 中，开发者必须使用宿主语言编写 `tools` 中定义的工具，而不同的宿主可能会采用不同的变成语言（python，javascript，golang……）。因此，对于某一工具（`get_weather()`）而言，该工具的开发者需要针对不同的宿主语言来重新编写该工具，无论怎样，这都是一件令人讨厌与痛苦的事情。而这种重复的、兼容适配工作，必然会降低工具提供者的维护热情，工具提供者也不太可能将自己的工具共享给其他宿主使用，因此也无法形成良好的工具共享生态。这也是 Function Calling 发布这么长时间以来一直没有形成良好的工具生态的原因之一。

```mermaid
    flowchart LR
    subgraph Host
        Python["Python"] 
        Golang["Golang"] 
        JavaScript["Java<br>Script"] 
    end

    subgraph Host Tools
        Python["Python"] e1@--> PythonTools[py_tools]
        Golang["Golang"] e2@--> GoTools[go_tools]
        JavaScript["Java<br>Script"] e3@--> JsTools[js_tools]
    end

    PythonTools e4@--> SharedTools[tools]
    JsTools e5@--> SharedTools
    GoTools e6@--> SharedTools

    e1@{ animate: true }
    e2@{ animate: true }
    e3@{ animate: true }
    e4@{ animate: true }
    e5@{ animate: true }
    e6@{ animate: true }
```

* 在 Function Calling 中，LLM 能够检测到的工具是通过硬编码的方式进行注册的，缺乏动态加载或者热更新的能力，每次新增工具都需要修改宿主代码甚至重新编译宿主代码，对于中大型的宿主而言，重新编译、重新发布都意味着额外的风险和成本。

```python
response = client.responses.create(
    model="gpt-4.1",
    input=input_messages,
    tools=tools,
)
```

* 在 Function Calling 中，对工具的调用是同步、即时调用，整个过程不能挂起任务或中断后恢复，也无法有效的引入人工校验机制，对于某些需要人工确认的任务（例如：是否继续发送邮件、是否继续删除等），Function Calling 无法满足需求。

```mermaid
flowchart LR
    Q[Query:<br>预定明天北京到天津的车票] --> A[函数调用：<br>查询可预订车票]
    A --> B[人工干预：<br>选择车次]
    B --> C[函数调用：<br> 提交订单]
    C -->D[人工干预：<br> 订单确认]
    D -->E[函数调用：<br> 执行预定]
    E --> F[任务完成]
```

## MCP

!!! note "万能的抽象层，无所不能的中间件"
    **没有什么是抽象一层解决不了的事情，如果有，那就再抽象一层。**

### http 协议的例子
我们先来看一个使用 golang 编写服务模块的例子，入下所示：

```mermaid
flowchart LR
 subgraph s2["基于 http 的服务网关"]
        Nginx["Nginx"]
        ClientNew["Client"]
        ServiceA_new["Service A - Golang"]
        ServiceB_new["Service B - Python"]
  end
 subgraph s3["使用 golang 开发的服务模块"]
        ClientOld["Client"]
        GoModule["module M <br> golang"]
        ServiceA_old["Service A"]
        ServiceB_old["Service B"]

        ClientOld -- 私有协议 --> GoModule
        GoModule -- golang代码 --> ServiceA_old
        GoModule -- golang代码 --> ServiceB_old
  end
    ClientNew -- HTTP --> Nginx
    Nginx -- HTTP --> ServiceA_new & ServiceB_new
    s3 e1@ == 使用 http 协议抽象一层 ==> s2

    style Nginx fill:#f9f,stroke:#333,stroke-width:1px
    e1@{ animate: true }
```

在上面的例子中，`Client` 私有通信协议与 golang 编写的 `Module M` 通信，该模块会提供 `Service A` 和 `Service B` 两种服务。此时，如果要为 `Module M` 增加新的功能，我们则需要修改原有的 `Service A` 或这 `Service B` 的代码，或者新增一个 golang 编写的 `Service C`。而如果此时，你的团队中 golang 开发人员正在高优处理其他项目，只有 python 开发人员有时间可以处理这个问题，那么你就只能等着了。

当然，大语言模型的编程能力已经相当棒了，我们可以假设 python 开发者可以在大语言模型的帮助下完成 golang 新服务 `Service C` 的开发。但是接下来的测试、发布、上线等工作仍然需要繁琐的流程。

而如果我们抽象一层， 在 `Module M` 与 `Service A`、`Service B` 之间增加一个 http 的服务网关 `Nginx`，那么我们就可以通过 http 协议来进行通信并提供服务了。对于新增加 `Service C` 模块，python 开发人员完全可以使用自己熟悉的开发栈、发布流程来进行开发、测试、发布等工作。当 `Service C` 模块发布之后，只需要在 `Nginx` 中增加一条路由规则即可实现服务的发布。只要我们允许，团队中的 NodeJS 开发者、Java 开发者……不同语言栈的开发者都可以使用自己熟悉的语言栈来扩展 `Module M`服务的功能，而 `Module M` 的生态也将越来越丰富。

在 http 协议的基础上，通过抽象出一层 `Nginx` 服务网关层，我们从架构上解决了不同语言、不同开发栈之间的耦合问题，同时也解决了服务模块的热更新问题。

### MCP 协议的本质
从本质上，`MCP 协议` 和 `http 协议` 一样，是大语言模型与不同工具的通信协议，大模型助手程序中的 `MCP Client` 通过 `MCP 协议` 与 `MCP Server` 通信，以获取工具列表并调用工具。我们在来回顾一下本文开头提到的 MCP 的架构图：

```mermaid
flowchart LR
    %% 子图 Your Computer 区域
    subgraph "Your Computer"
        direction TB
        Host["Host with MCP Client<br>(Claude, IDEs, Tools)"]
        S1["MCP Server A"]
        S2["MCP Server B"]
        S3["MCP Server C"]
        D1[("Local<br>Data Source A")]
        D2[("Local<br>Data Source B")]
        
        Host e1@-->|MCP Protocol| S1
        Host e2@-->|MCP Protocol| S2
        Host e3@-->|MCP Protocol| S3
        S1 e4@--> D1
        S2 e5@--> D2
        e1@{ animate: true }
        e2@{ animate: true }
        e3@{ animate: true }
        e4@{ animate: true }
        e5@{ animate: true }
    end

    %% 子图 Internet 区域在右侧
    subgraph "Internet"
        direction TB
        D3[("Remote<br>Service C")]
    end

    S3 e6@-->|Web APIs| D3
    e6@{ animate: true }
```

如上的 MCP 架构总共分为了五个部分：

* `MCP Hosts`: Hosts 是指通过 MCP 协议访问外部数据的应用程序，例如 Claude Desktop、Cline。
* `MCP Clients`: 客户端是在 Hosts 应用程序内，用于维护与 Server 通信的模块。
* `MCP Servers`: 通过标准化的 `MCP 协议`，为 `MCP Client` 提供工具，同时具体的工具执行也是通过 `MCP Server` 来完成。
* `Local Data Sources`: 本地数据资源：文件、数据库和 API。
* `Remote Services`: 网络资源：文件、数据库和 API。