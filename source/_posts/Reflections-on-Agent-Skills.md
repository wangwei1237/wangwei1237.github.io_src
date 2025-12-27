---
title: 对 Agent Skills 的认知与思考
reward: false
top: false
date: 2025-12-24 10:00:00
authors:
categories:
  - LLM
tags:
  - Claude
  - Claude Code
  - Agent Skills
---

![](1.png)

自从 12 月 9 日，Anthropic 的 Barry Zhang 和 Mahesh Murag 在内部做了一个名为 *Stop Building Agents, Build Skills Instead*[^6] 的分享之后，`Skills` 突然就火了起来。微信公众号、小红书等平台上涌现出了大量的介绍 `Skills` 的文章。一开始对这个概念也是迷迷糊糊的，于是就花了点时间阅读了 Claude 官方对 `Skills` 的所有博客与文档，自己也写了一个简单的 `Skills` 体验了一把这个火得不能再火的技术。

!!! note "Skills 的本质"
    * `Agent Skills` 通过工程层面的优化，改变了 **如何管理**、**如何交付**、**如何使用** 大模型能力的方式，让 `Agent` 的构建更加简便、可控。
    * 从技术层面看，`Agent Skills` 并没有改变 *LLM* 的底层原理，Transformer 架构没变、权重没变、预测下一个 token 的逻辑也没变……

<!--more-->

等等，我好像想起了另一个类似的技术——*微服务*。很多工程师会把 *微服务* 作为一种技术或者一种架构，但实际上，*微服务* 只是为了让交付节奏更可控、更稳定、更高效的组织结构。为了适应 *微服务* 这种组织结构，才产生了诸如 *Kubernetes*、*服务网关* 等新技术。

## 1. Skills 的发展节奏
* 2025 年 10 月 16 日，Anthropic 发布了 `Agent Skills` 以扩展 Claude 在执行特定任务场景下的性能[^1]。`Agent Skills` 是一个打包好的目录，该目录下包含了与特定任务相关的指令、脚本和资源。Claude 可以在需要时加载这些内容以完成对应的特定任务。

* 2025 年 12 月 9 日，Anthropic 的 Barry Zhang 和 Mahesh Murag 在内部分享 [Stop Building Agents, Build Skills Instead](https://www.youtube.com/watch?v=CEvIs9y1uog)（也可以在小宇宙上获取对应的中文播客内容：[别再从头造 Agent 了：Anthropic 专家揭秘“Agent Skill”如何重塑 AI 协作](https://www.xiaoyuzhoufm.com/episode/6943bf87c4f10bdeea0d738b)）中提出了构建 `Agent` 的新范式——`Agent Skills`，从而引爆了社区。

    ![](17664071212332.jpg)

* 2025 年 12 月 18 日，Anthropic 发布了跨平台的、具备兼容性的 `Agent Skills` 开放标准[^2]。在 `Agent Skills` 标准下，非 Cluade 生态的 *LLM*、*Agent*、平台也可以使用 `Skills` 来更方便的扩展自身的能力。

* 2025 年 12 月 19 日，OpenAI 宣布 [在 Codex CLI 和 Codex IDE 中增加了 `Skills` 能力支持](https://developers.openai.com/codex/changelog)，`SKills` 从名义上的开放标准走进了实质上的开放标准。我们也在 OpenAI 的开发者文档中发现和 `Agent Skills` 相关的描述[^5]：
  
  > Agent Skills let you extend Codex with task-specific capabilities. A skill packages instructions, resources, and optional scripts so Codex can perform a specific workflow reliably. You can share skills across teams or the community, and they build on the open Agent Skills standard.

## 2. Agent Skills 
根据 Anthropic 的介绍，`Agent Skills` 就是一个整理并打包好的、包含指令、脚本和资源的目录，`Agent` 可以动态发现并加载 `Agent Skills` 目录下的内容，从而使得 `Agent` 可以在特定任务上有更好的表现。

`Agent Skills` 的详细的目录规范可以参见：[Agent Skills-Specification](https://agentskills.io/specification)。

通过 `Agent Skills`，我们可以把某领域的专业知识打包成可组合、可扩展、可迁移的资源，Claude 可以使用这些资源来扩展能力，从而把通用 `Agent` 变为符合特定领域需求的专业 `Agent`。

为 `Agent` 构建 `Skills`，就如同为新员工整理的入职指南文档。我们无需为每个场景构建零散的、定制化的 `Agent`，我们可以通过沉淀和分享自己的专业知识，并通过可组合的 `Skills` 以允许我们的 `Agent` 具备专业化能力[^3]。

![](e447e5048f150fe4459d8f2585cf3066.png)



## 3. Skills 与渐进式信息披露
`Agent Skills` 的核心设计原则就是 *渐进式信息披露*，该设计原则使得 `Agent Skills` 更加灵活性，也使其扩展性更好，最重要的是可以保持与大模型交互过程中的 `Context` 内容始终保持精简。

1. `SKILL.md` 文件中的 *YAML* 格式的元数据是 *渐进式信息披露* 的第一层级：Claude 仅根据元数据中提供的信息，就足以知道需要在何时使用哪种 `skill`。
2. `SKILL.md` 文件中的剩余信息是 *渐进式信息披露* 的第二层级：该内容提供了如何使用该 `skill` 的全部内容，包括 `skill` 的概述、代码示例…… 如果 Claude 认为某 `skill` 与当前任务有关，Claude 就会读取完整的 `SKILL.md` 并将其加载到上下文中。
3. 随着 `Agent Skills` 越来越复杂，`SKILL.md` 文件可能会包含越来过多的背景信息，而根据 [Context Engineering for AI Agents](/2025/11/29/context-engineering-for-AI-agents/) 中的 *Context Rot* 的问题，我们无法把所有的这些信息都放到单个 `SKILL.md`文件。有时候，有些背景信息仅与特定的应用场景有关，例如 [PDF skill](https://github.com/anthropics/skills/tree/main/skills/pdf) 中的表单填充能力，此时，把这些仅与特定场景关联的信息全部放到所有场景的背景信息中，不但会导致上下文不断增加，还容易因为 *Context Rot* 导致模型性能下降。我们可以把这些信息进行拆分并将其置于 `Agent Skills` 目录下的单独文件，同时在 `SKILL.md` 中通过文件名来引用这些单独的信息文件。而类似这些附加的链接文件则属于 *渐进式信息披露* 的第三层级：Claude 可以根据需要来选择浏览和发现这些特殊场景的 `skill` 信息。

![](17663818747722.jpg)

*渐进式信息披露* 就像一本精心组织、策划的书籍一样，先从序言开始，然后是目录，接下来是具体章节内容，最后是相关的附录内容。这种精心安排的方式，能够让 Claude 只在需要时才加载必要的信息，从而有效的避免了 `Context Rot`，即为大模型提供了足够的信息、同时又让大模型保持较高的性能。

![](17663826189780.jpg)

实际上，人类在通过翻阅工具类书籍、手册完成任务时，也不会从头到尾阅读完整本书：

1. 我们首先会了解下这本手册的适用范围，是 Java 语言还是 C++ 语言，是底层网络库还是应用层的传输协议，是面相用户的还是面相开发者的……
2. 然后我们会通过目录了解手册都包含哪些内容，并于我们当前的人物进行匹配，圈定需要使用哪部分内容才能解决当前的任务。
3. 最后，我们加载圈定的章节内容，并详细阅读，最终尝试利用新学到的知识解决当前的任务。

例如，如果我想了解 *假设检验* 的相关内容，我只需要阅读 [*第 8 章*](/introduction_to_probability_and_statistics/chapter_8/8.html) 的内容就可以了，没必要阅读完整的一本书。

以 `PDF skill` 为例，在 `Agent Skills` 的 *渐进式信息披露* 机制下，随着与用户之间的交互，Claude 的 `Context Window` 的变化如下图所示：

![](17663862891763.jpg)

1. 最开始的时候，`Context Window` 仅包含 *系统提示词*、*每个已安装 `Skills` 的元数据*、*用户的初始消息*
2. Claude 通过调用 `Bash` 工具读取 `pdf/SKILL.md` 的内容来触发 `PDF skill`
3. 根据 `SKILL.md` 的描述，Claude 继续选择读取 `PDF skill` 的 `forms.md` 文件内容来获取如何填充表单的信息
4. 最后，Claude 从 `PDF skill` 加载相关指令后，继续处理用户的任务

## 4. Skills 与 代码执行
以本地文件系统构建起来的 `Skills` 与生俱来的最大优势就是可以直接利用本地文件系统提供的强大能力：*Bash 能力*、*Command 能力*、*代码脚本能力*……

虽然直接使用大模型也可以完成一项任务，但有的任务更适合通过代码、程序来完成。例如，我们可以让大模型对数据进行排序，但是直接调用本地文件系统中的排序程序反而是一种更高效的任务执行方式。尤其是，当我们需要保持任务结果的确定性时，代码、程序是更为合适的选择，毕竟大模型的执行存在概率性的问题。

以 `PDF skill` 中的表单填充能力为例，在 `pdf/forms.md` 中就明确告知了大模型：如何使执行本地的 python 脚本来完成表单填充任务。 

![](17665550024178.jpg)

作为非英语母语的人，每次在阅读全是大写字母的英文文献时我总是感觉会非常吃力：

> HELLO, MY NAME IS WANG WEI. I AM A COMPUTER ENGINEER.

> 
> hello, my name is wang wei. i am a computer engineer.


于是，我就想用 `Skills` 来实现：把 PDF 文献中的大写字母转成小写字母，从而提升阅读的效率。当然，这可能并不是一个痛点，但是我们就假定以这个场景来介绍 `Skills` 如何执通过行本地代码解决这个假定的任务。

### 4.1 创建 SKILL 文件

![](cc_skill_demo.png)

### 4.2 实现 pdf_lowercase.py

```python
def main():
    """主函数"""
    if len(sys.argv) != 3:
        print("用法: python pdf_lowercase.py <输入PDF路径> <输出PDF路径>")
        print("示例: python pdf_lowercase.py input.pdf output.pdf")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    # 确保输出目录存在
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 处理PDF
    success = process_pdf(input_path, output_path)
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### 4.3 部署
按照 `Skills` 的规范组织好目录，并将整个目录放到如下的目录 `${PROJECT_BASE_DIR}/.claude/skills/`，我们就可以让 Claude 调用该 `Skills` 实现字母大小写转换的任务了。

关于 `pdf-case-converter` 的全部代码，可以参考：[pdf-lowercase-skill](https://github.com/wangwei1237/agent-skills/tree/main/pdf-lowercase-skill)。

试想一下，如果有一个 100 页的文档需要转换（当然，实际生活中可能不存在这种场景），如果让大模型来完成转换，首先要面对的问题就是 `tokens` 成本的问题，其次还有可能会导致 `context window` 爆炸的问题。但是，如果采用 `Skills` 调用本地代码的方式，就完美的解决了成本与 `context window` 的问题。

<!--video example-->
{% bilibili 115772269527051  %}

## 5. Skills 与 MCP
作为 `MCP` 的有效补充，`Skills` 也大大增加了 *LLM* 的能力边界，让 *LLM* 可以完成的任务规模得以扩张，*LLM* 从单点任务跨越到了完成更复杂、更垂直、更专业任务的 *pipeline*。

2025 年，12 月 19 日，当 `Skills` 概念大火的时候，为了避免开发者对 `MCP` 和 `Skills` 之间的混淆和误用，Anthropic 发布了一篇博客 *[Extending Claude’s capabilities with skills and MCP servers](https://claude.com/blog/extending-claude-capabilities-with-skills-mcp-servers)* 来阐述二者之间的区别与差异，同时还给出了 2 个例子来阐述如何在实际应用中联合使用 `MCP` 和 `Skills` 技术完成特定的任务[^4]。

> Since launching Skills, two of the biggest questions we’ve heard from customers are: "How do skills and MCP work together? When should I use one versus the other?"

![](17664670800710.jpg)

作为协议层，`MCP` 统一了真实环境中的所有工具与 *LLM* 的交互方式；作为能力层，`MCP` 允许大模型通过自主的调用工具来获取实时信息，例如天气信息、科技新闻……

但是，对于某个垂类行业，例如 *科技跟踪日报* ——根据每天的各大媒体报道的科技新闻对当前的各方向的技术进行跟踪报道——这种非常垂直的任务，单纯使用 `MCP` 是不够的。

`MCP` 只能获取到最新的科技信息，如果根据这些信息撰写出最终的报告，需要一套复杂的业务编排流程。而 `Agent Skills` 的目标就是用来解决类似规模的垂类任务。

`MCP` 是工具的开放，而 `Agent Skills` 则是业务流的开放。

## 6. Skills 的本质
### 6.1 工程上的优化
在 `Skills` 之前，*科技跟踪日报* 可以通过构建一个 `Agent` 来实现，实现该 `Agent` 的 *系统提示词*、*业务流*、*信息处理* 等所有的信息都通过硬编码封装在 `Agent` 中，很难与别人分享，也很难形成规模化的复用。更重要的是，如果要更新 `Agent` 的能力，还需要手动修改 *提示词* 或者代码，管理和维护的成本也就相对较高。

但是，在 `Agent Skills` 机制下，原来硬编码的 *业务流程*、*系统提示词* 等信息都以模块化的方式组织在了 `Skills` 对应的目录下。我们可以非常方便的把 *科技跟踪日报* `skill` 集成到其他的 `Agent` 以实现对应的能力，我们也可以非常方便的通过修改 `SKILL.md` 文件中的描述来更新 `Agent` 的能力。

正如 Anthropic 在 `Agent Skills` 的 [博客](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) 中所说的那样：对于 `Skills` 这一功能，我们感到无比兴奋。`Skills` 可以帮助企业和个人更方便的分享他们所处行业的 *背景信息* 和 *工作流程*。

> We’re especially excited about the opportunity for Skills to help organizations and individuals share their context and workflows with Claude.

本质上讲：`Agent Skills` 通过工程层面的优化，改变了 **如何管理**、**如何交付**、**如何使用** 大模型能力的方式，让 `Agent` 的构建更加简便、可控。从技术层面看，`Agent Skills` 并没有改变 *LLM* 的底层原理，Transformer 架构没变、权重没变、预测下一个 token 的逻辑也没变……

### 6.2 上下文工程策略
`Agent Skills` 通过本地文件系统的组织结构，帮我们实现了 Agent 的高效管理与交付。同时，`Agent Skills` 的 *渐进式信息披露* 机制，让大模型在处理复杂任务时，只需要加载必要的信息即可。因此，从另一个角度讲，`Agent Skills` 其实还是一种非常有效的 *上下文工程策略*，从而避免了 `Context Rot` 的问题。

`Skills` 与 `MCP` 的机制完全不同。在 `MCP` 架构中，无论模型是否会用到某个工具，都需要将所有的工具定义加载到 `Context Window` 中，从而会导致 `Context Window` 的无效膨胀。Cluade 在 *[Introducing advanced tool use on the Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use)*[^7] 中提出了 *Tool Search Tool* 能力来避免 `MCP` 中加载所有工具定义带来的 `Context Window` 膨胀的问题。

![](tst.webp)

在 `Skills` 之前，上下文工程的机制主要是如何在对话过程中精简 `Context Window`，而 `Skills` 则反其道而行之，采用 *非必要不加载* 的方式来精简 `Context Window`。

![](ce-skills.jpg)

`Skills` 的出现，扩展了上下文工程的思路，让我们在构建大模型应用时，有了更多的选择。传统的 *上下文工程* 主要解决长程任务的多轮对话过程因为 *对话历史* 和 *工具调用* 导致的 `Context Window` 膨胀，而 `Skills` 则主要解决系统提示词增加导致的 `Context Window` 膨胀问题。

同时，我们也需要认识到：`Skills` 通过 *非必要不加载*（把不用的规则卸载）的方式解决系统提示词的膨胀，但是对于历史对话和工具调用的膨胀问题，`Skills` 仍然无能为力。

## 参考文献
[^1]: [Introducing Agent Skills](https://claude.com/blog/skills)
[^2]: [ Agent Skills Open Standard](https://agentskills.io/home)
[^3]: [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
[^4]: [Extending Claude’s capabilities with skills and MCP servers](https://claude.com/blog/extending-claude-capabilities-with-skills-mcp-servers)
[^5]: [OpenAI Developers: Agent Skills](https://developers.openai.com/codex/skills)
[^6]: [Stop Building Agents, Build Skills Instead](https://www.youtube.com/watch?v=CEvIs9y1uog)
[^7]: [Introducing advanced tool use on the Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use)

