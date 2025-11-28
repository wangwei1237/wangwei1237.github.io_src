---
title: Agent 中的 Context Engineering
reward: false
top: false
date: 2025-11-28 16:50:51
authors:
categories:
  - LLM
tags:
  - Context Engineering
  - Context Rot
  - Long-Horizon Tasks
  - 上下文工程
---

![](CE.jpeg)

<!--more-->

## 1. Workflow & Agent
*Building effective agents*[^8] 介绍了 *workflow* 和 *agent* 的区别，这两者之间最本质的区别在于：究竟是由谁来控制执行流程。

如果是由代码编写的规则、流程来控制大语言模型（*LLM*），那么这种架构就是 *workflow*；如果是大语言模型（*LLM*）自主的与环境进行互动、并根据新的信息来自主的决定后续的执行动作，那么这种架构就是 *Agent*。

![左图为 workflow，右图为 Agent](17643155839477.jpg)


| 维度     | Workflow (工作流)                          | Agent (智能体)                              |
| -------- | ------------------------------------------ | ------------------------------------------- |
| 结构     | 线性或树状 (DAG)<br>A → B → C              | 循环 (Loop)<br>思考 → 行动 → 观察 → 再思考 |
| 确定性   | 高。<br>路径是固定的，输出结果通常比较稳定。 | 低。<br>同样的任务，模型可能会选择不同的路径。 |
| 灵活性   | 低。只能处理预设好的场景。                 | 高。可以处理未知的、开放式的问题。          |
| 错误处理 | 需要在代码中预设 if/else 来处理错误。 | 模型自我反思：“哎呀报错了，换个方法试试”。 |
| 适用场景 | 翻译、数据提取、分类、内容生成等定义明确的任务。 | 开放式研究、复杂编码任务、多步推理等边界模糊的任务。 |

> *start with a simple workflow, move to an agent only when you need to.* 

对于软件交付领域而言，端到端的 CodingAgent 或者 TestingAgent 因为需要多步迭代、并且在不同的迭代过程中需要根据当前的结果与状态来调整执行步骤进而完成代码编写或者软件测试工作，因此简单的 *workflow* 不足以完成这样的工作，必须采用 *Agent* 才能实现这种复杂的任务。

![00d6dc12dfbcff77181d77f96b323027](00d6dc12dfbcff77181d77f96b323027.png)

假设我们要测试一个电商网站的登录功能，TestAgent 会：

1. 先调用工具打开网页
2. 再理解当前的网页，解析到用户名、密码的输入框以及登录按钮
3. 再调用工具执行登录操作
4. 判断状态→如果登录失败，需要根据错误信息以及调用工具获取更多的领域知识来决策如何解决当前的登录失败
5. ……
6. 随着 N 次迭代，这些工具调用信息、信息空间中查询到的信息、对话历史信息就会迅速撑爆上下文窗口……然后，TestAgent 就会因为接下来要讲到的 *Context Rot* 问题而导致执行性能急剧下降。

## 2. Context Rot
2025 年 7 月 14 日，Chroma 公司的研究员通过测试主流模型发现：随着输入 tokens 长度的增加，模型性能反而出现了持续下降的现象。Chroma 把这一现象称之为 *Context Rot*，并且把他们的发现整理为这篇技术报告 *Context Rot: How Increasing Input Tokens Impacts LLM Performance*[^5]。

![](17642451948931.jpg)

过去，我们总是期望大语言模型的上下文窗口能够变得越来越大，从而我们可以把更多的信息塞进提示词中，以期望提升模型的性能。

然而，就像人类的记忆容量也有限制一样，大型语言模型（LLMs）在解析大量上下文时也有一个 *注意力预算*（*attention budget*），每引入一个新的 token，就会在一定程度上消耗该 *注意力预算*。

因此，*Context Rot* 提醒我们：在一段持续的对话或长文本生成过程中，随着输入信息（Context）的不断累积，大语言模型会逐渐丧失对早期关键信息的“注意力”，导致回答质量下降、逻辑断层或指令遗忘。

![224c5f534db954028ae9e44474887478](224c5f534db954028ae9e44474887478.jpg)

在 *Context Rot* 的限制下，大语言模型的上下文窗口是一种边际收益递减的有限资源。长上下文能力不应该仅仅看作是模型的一项技术指标，而更应该看作是一个需要精心设计和管理的系统工程。我们必须为大语言模型精心筛选信息，以避免 *Context Rot* 现象。

![](17642475708110.jpg)

这种在 Agent 的迭代过程中，为大语言模型（*LLM*）精心筛选信息的过程就是我们将要介绍的 *上下文工程*。

### 2.1 Transformers 架构的天然缺陷
在 *[自注意力究竟是什么？](/2024/10/16/What-exactly-is-attention/)* 这篇文章中，我们详细介绍了 Transformer 架构，并对其中的 *注意力机制*（*Attention Mechanism*）进行了详细的解释。

$$
\text{Attention}(\mathbf{Q}, \mathbf{K}, \mathbf{V}) = \text{softmax}\left( \frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d_k}} \right) \mathbf{V}
$$

在推理阶段，模型需要计算当前生成的 token 与上下文中几千个 token 之间的注意力。在单个注意力头内，对于某个输入 token，它对所有 tokens 的注意力权重（经过 $softmax(\cdot)$ 后）会满足：

$$
 \sum_i w_i = 1
$$

因此当上文过长，token 之间的注意力结果就不容易区分，模型就很难精准地“聚焦”到那个最重要的 token 上。

![](17642961219029.jpg)

### 2.2 K/V/Q 矩阵维度的溢出
除了 $softmax(\cdot)$ 的注意力分散机制外，*KV Cache* 的量化损失也是导致 *Context Rot*  的物理根源。

*K/V/Q* 矩阵的维度本身是固定的（以 [deepseek-R100528](https://huggingface.co/deepseek-ai/DeepSeek-R1-0528/blob/main/config.json) 为例，$d_Q$ = 7168），不会因为输入 tokens 的变长而变大。但是，赋予这些向量的 *位置感* 的数学机制——*旋转位置编码*（*RoPE*）——却会因为上下文过长而失效。

*RoPE* 通过在多维空间中对向量进行旋转来表示位置。模型在训练时，只见过比如 0 到 4000 的旋转角度。当上下文变成 10000 时，向量被旋转到了一个模型从未见过的高频角度。此时 $softmax(\cdot)$ 就不再能准确反映相对距离，模型也就无法区分 “第 9000 个词” 和 “第 9005 个词” 的区别。

就像 *uint8* 只能表示 0~255 这个 256 个数，但是当用 *uint8* 存储 256 这个整数时，结果就会变成 0。那么，在 *uint8* 下，如何区分 0 到底是 0 呢，还是溢出了的 256 呢？

## 3. Long-Horizon Tasks
在大模型领域，*长程任务*（*long-horizon tasks*）是指那些无法通过单次原子操作完成，而必须拆解为一系列具有逻辑依赖关系的连续决策步骤（*Sequential Decision Making*）才能解决的任务。

> 我们在第一节中提到的 TestAgent 测试电商网站登录功能的任务，就属于 *长程任务*。

*长程任务* 不仅仅指“执行时间长”，更强调执行步骤多、步骤之间依赖性强、执行的状态空间大，其核心特征如下：

1. 多步推理与决策（*Multi-step Reasoning & Decision Making*）：Agent 需要生成一个包含 $T$ 个步骤的计划（*Plan*），即 $a_1, a_2, \dots, a_T$。

2. 延迟奖励（*Delayed Sparse Rewards*）：在大多数中间步骤中，Agent 往往得不到及时的、明确的正反馈（*Reward*）。只有当整条链路执行完毕且成功时，才能判定任务完成。这意味着 Agent 需要具备很强的“自纠错能力”、“自决策能力”以及“规划能力”。

3. 时序依赖性（*Temporal Dependency*）：第 $t$ 步的动作 $a_t$ 严格依赖于第 $t-1$ 步的执行结果（*State*）$s_{t-1}$。一旦中间某一步出现异常，后续的所有步骤都可能失效，从而导致误差累积。

4. 动态环境交互（*Dynamic Environment Interaction*）：Agent 需要不断观察环境的即时反馈来调整下一步动作，而不是盲目执行预设的静态脚本。


因此，Agent 在面对 *长程任务* 时，常常面临着如下的困难：

* 记忆负担：随着执行步骤 $T$ 的不断增加，历史轨迹会不断变长，历史信息也会不断增加，Agent 容易因为 *Context Rot* 现象而忘记最开始的任务目标。
* 误差滚雪球：如果 Agent 在第 $a_5$ 时产生幻觉（*Hallucination*）或执行错误，但是由于没有及时纠正，直到第 $a_{25}$ 时，整个任务才彻底失败。假设每一步成功率是 95%，执行 20 步后的成功率仅为 $ 0.95^{20} ≈ 35\% $。

![](17642216363819.jpg)


## 4. Context Engineering
*上下文工程* 就是在大语言模型（LLMs）的 *有限注意力预算*（*finite attention budget*）的限制下，精心筛选并找到最小的 *high-signal tokens* 集合，以最大限度地提高实现某种预期结果的可能性。正如 Anthropic 在 *Effective context engineering for AI agents*[^1] 中说的那样：

> 我们对于上下文的不同组成部分（系统提示、工具、示例、消息历史等）的总体指导原则是：要深思熟虑，确保上下文的内容即丰富又简洁。
> 
> Our overall guidance across the different components of context (system prompts, tools, examples, message history, etc) is to be thoughtful and keep your context informative, yet tight. Now let's dive into dynamically retrieving context at runtime.

- 令 $\mathcal{U}$ 表示所有可用的、潜在上下文中的 tokens 的全集（即原始、未过滤的“信息池”）。
- 令 $S$ 表示通过上下文工程筛选出的 tokens 子集，满足 $S \subseteq \mathcal{U}$。
- 令 $|S|$ 表示集合 $S$ 中的 tokens 的数量。
- 令 $B$ 表示“有限注意力预算（*finite attention budget*）”，即模型能有效处理的最大 token 数量。
- 令 $\theta$ 表示大语言模型（LLM）的固定参数。
- 令 $Y^*$ 表示“期望输出”，即目标输出字符串或答案。
- 令 $P_{\theta}(Y^*|S)$ 表示模型计算结果的概率：在给定所选上下文 $S$ 的条件下，生成期望输出 $Y^*$ 的条件概率。

因此，可以用如下的数学语言来表示 *上下文工程* 的含义：

$$
\begin{aligned}
& \text{ContextEngineering} \rightarrow  \mathcal{S}_{opt} = \underset{S \in \mathcal{S}^{*}}{\operatorname{argmin}} |S|  \\
& \\
& \text{for} \quad \mathcal{S}^* = \underset{S \subseteq \mathcal{U}}{\operatorname{argmax}} \left\{ P_{\theta}(Y^*|S) \right\} \\
& \quad \quad \text{s.t.} \quad |S| \leq B \\
& \\
\end{aligned}
$$

上下文工程是即是一门艺术、又是一门科学，上下文工程指导我们从不断演变的海量信息中精心筛选出所需要的信息，并将这些信息放入有限的上下文窗口中，从而让 Agent 产出我们最希望的结果。

### 4.1 上下文工程与提示词工程之间的区别
在使用大型语言模型（LLMs）进行 AI 原生应用开发的早期阶段，编写并优化提示词是工程开发工作中的最主要的部分。

* 2024 年，业界提供了各种不同的提示词模版以优化大模型的推理结果，例如 OpenAI 在 *Prompt engineering*[^4] 中，对如何组织提示词做了详尽的说明。
* 2024 年，提示词「神人」李继刚也爆红网络，他写的提示词在各大 AI 社群和提示词网站广为流传。
* 同时，为了提升提示词工程的效率，寻找在当前模型下最优的提示词，提示词的快速评估工作也如火如荼。

提示词工程的核心主要在于如何编写有效的提示词（尤其是系统提示词）以让大模型能够准确的理解用户的意图，并输出用户期望的结果。然而，话术的优化仅限于精准描述与定义问题，这中优化在 LLM ChatBot 时代能够非常好的解决人与大模型沟通的问题。

但是，对于 *长程任务* 而言，仅仅优化话术还是不够的，此时必须为大模型提供更多的额外信息（例如：系统指令、工具、模型上下文协议（MCP）、外部数据、消息历史等）才能保证大模型产出我们希望的结果。

![](17642429672199.jpg)

因此，从本质上讲：提示词工程是单次的话术优化，而上下文工程是迭代中的信息筛选，每当我们需要决定向模型传递什么内容时，筛选就会发生，上下文工程就会存在。

## 5. Context Engineering in Action
为了让 Agent 能够在 *长程任务* 上高效工作，Anthropic 开发了多种技术来解决 Agent 在面对 *长程任务* 时所面临的挑战，这些技术包括：压缩（*compaction*）、结构化笔记（*structured note-taking*）、多 Agent 架构（*multi-agent architectures*）。

### 5.1 Compaction
*压缩* 是指当对话接近上下文窗口限制时，对其内容进行总结，并利用该总结重新开启一个新的上下文窗口的做法。*压缩* 通常是上下文工程中提升长期连贯性的首要手段。从本质上讲，*压缩* 以高保真的方式提炼上下文窗口的内容，使智能体能够在性能下降最小的情况下继续运行。

*压缩* 的艺术在于选择保留什么信息以及决策舍弃什么信息。过度激进的压缩策略会导致那些细微但关键的上下文信息丢失，而这些信息的重要性往往只有在 Agent 执行到后面的时候才会显现出来。

当构建压缩系统时，我们必须在复杂的 Agent 执行轨迹上仔细调整我们的提示词（*prompt*）。在 *压缩* 过程中：
* 我们必须首先保证最大限度地提高召回率（*recall*），以确保压缩提示词能从大量的轨迹信息中捕捉到每一个相关信息；
* 然后再通过多次迭代来删除多余的提示词内容，从而不断提高精确率（*precision*）。

实际上，工具结果清理是最安全、最轻量级的压缩形式之一——确实，Agent 一旦调用过某个工具并得到了结果，在后续的执行中，Agent 为什么还需要再次查看这次工具调用的原始结果呢？在 *Managing context on the Claude Developer Platform*[^2] 这篇文章中，Anthropic 把工具清理作为特性集成到了Claude 开发者平台。

> Today, we’re introducing new capabilities for managing your agents’ context on the Claude Developer Platform: context editing and the memory tool.
> 
> With our latest model, Claude Sonnet 4.5, these capabilities enable developers to build AI agents capable of handling long-running tasks at higher performance and without hitting context limits or losing critical information.

当 Agent 经过多轮的工具调用后，此时累积的历史信息导致提示词的数量已经接近大模型的上下文窗口大小限制。此时，*context editing* 会自动从上下文窗口中清除过时的工具调用和结果，从而可以在保留对话流程的同时移除过时内容，进而有效延长 Agent 在无需人工干预的情况下的运行时间。

![](17642271057749.jpg)


### 5.2 Structured Note-Taking
*笔记*（*note-taking*）与 *原始信息*（*raw information*）之间的核心区别，本质上是 **认知加工（*Cognitive Processing*）** 的介入程度。*原始信息* 是矿石——包含金子，但同时也包含了大量的泥土、杂质和石头）；而 *笔记* 是提炼后的金块——去除了杂质，改变了形态，并且还会打上了所有者的印记。从另一个角度讲：*笔记* 是我们思维的快照，具备一定的主观和个性化，是构建自己思维体系的有效形式之一。

![4792b51210851a049a66959f577b0dd0](4792b51210851a049a66959f577b0dd0.jpg)

在 Agent 领域，*结构化笔记*——又称为 *Agent 记忆*——是一种 Agent 定期把 *笔记*（*note*）写入大模型上下文窗口之外的持久性存储介质中的技术。在 Agent 的后续执行过程中，Agent 会再次从这些持久性存储介质中把这些 *笔记* 拉回到上下文窗口。

利用 *结构化笔记*，我们能够以最小的开销为 Agent 提供持久记忆能力，从而允许 Agent 在 *长程任务* 中可以跟踪结果与进度、保留关键的上下文信息与依赖关系，以避免 Agent 在多次迭代之后遗忘原始任务目标的问题。

> 我们已经走得太远，以至于忘记了为什么而出发。——纪伯伦

在上下文重置后，Agent 会通过阅读之前的 *结构化笔记*，并继续进行任务执行与探索，这在仅依靠大语言模型（LLM）的上下文窗口来存储所有信息的场景下，是无法实现的。

同时，*结构化笔记* 还使得 Agent 能够随着时间的推移而建立自己的知识库，并在不同会话中保持项目状态，新启动的 Agent 也无需重新梳理所有的原始信息就可以学习到之前的、持久保存的知识。另外，对于多 Agent 架构而言，统一的 *Agent 记忆* 也会解决 Agent 之间的协同问题，Agent 之间不需要通过冗余而又复杂的信息的传输、而是通过共享的 *Agent 记忆* 来保持统一的系统状态。

### 5.3 Multi-Agent Architectures
多 Agent 架构是解决上下文限制的另一种有效的技术思路。在解决 *长程任务* 时，我们不再依赖单个Agent 来维持整个任务的状态，而是把任务进行拆分，并且由专门的 Sub-Agent 来处理特定的子任务。

![](17642344199896.jpg)

在 Sub-Agent 处理子任务的时候，这些 Sub-Agent 会具有清晰的上下文窗口，从而避免了 *Context Rot* 的问题。

在 多 Agent 架构下，Lead-Agent 主要是在更高层级上对计划进行协调，而 Sub-Agent 负责具体执行更专精的技术工作或使用工具查找相关信息。每个 Sub-Agent 还可能会进行广泛的探索，使用数万个甚至更多的 tokens，但只给 Lead-Agent 返回最精简的、提炼后的摘要信息（通常为1000-2000个标记）作为执行结果。

在 *How we built our multi-agent research system*[^3] 中，Anthropic 提到，在复杂研究任务上，多 Agent 架构比单 Agent 系统有显著的改进。

## 6. Context Engineering 白皮书
2025 年 11 月 16 日，谷歌发布了 *Context Engineering 白皮书*[^6]，白皮书中认为：Agent 真正的“智能”，并非仅仅源于底层模型，更重要还在于开发者如何为其“组装”上下文。

谷歌在白皮书中详细介绍了现在 Agent 的两大基础：会话（*Sessions*） 与 记忆（*Memory*），同时也对构建 Agent 的众多底层基础设施的工程实践做了详细的探讨：

* 压缩策略（*Compaction Strategies*）：如何让信息更紧凑。
* 数据溯源（*Provenance Tracking*）：知道每一条信息的来源。
* 记忆提取与整合工作流（*Extraction & Consolidation*）：从对话中提炼价值。
* 检索评分（*Retrieval Scoring*）：决定提取哪段记忆的算法。
* 后台处理（*Background Processing*）：异步处理繁重的记忆整理工作。
* 多 Agent 互操作性（*Multi-agent Interoperability*）：通过共享的、与框架无关的记忆层，实现不同 Agent 之间的协作。

2025 年 11 月 19 日，谷歌发布了 Gemini3，在 Gemini3 的开发文档 *Gemini 3 Developer Guide*[^7] 中，我们发现了如下的内容：

> To bypass strict validation in these specific scenarios, populate the field with this specific dummy string: 
> 
> "thoughtSignature": "context_engineering_is_the_way_to_go"

由此，也能看出谷歌对于 *Context Engineering* 是多么的痴迷。

!!! note "后记"
    ...



## 参考文献
[^1]: [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
[^2]: [Managing context on the Claude Developer Platform](https://claude.com/blog/context-management)
[^3]: [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
[^4]: [Prompt engineering](https://platform.openai.com/docs/guides/prompt-engineering)
[^5]: [Context Rot: How Increasing Input Tokens Impacts LLM Performance](https://research.trychroma.com/context-rot)
[^6]: [Context Engineering: Sessions & Memory](https://www.kaggle.com/whitepaper-context-engineering-sessions-and-memory)
[^7]: [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3?thinking=high)
[^8]: [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)