---
title: LangChain 简介
reward: false
top: false
date: 2023-09-20 22:18:11
authors:
categories: LLM
tags:
  - LangChain
  - OpenAI
  - Ernie
---

![](langchain.png)

我们不想花更多的力气来实现和LLM交互的流程，而是更关注于业务逻辑的实现；我们也不想重复编写相似的流程代码，而是可以共享我们的成果，别人只需要键入 `docker pull` 就可以使用我们的成果……如果你有这样的想法，那么 LangChain 正是你的菜~

<!--more-->

## LangChain 的发展
随着大型语言模型（LLM）的引入，自然语言处理已经成为互联网上的热门话题。LangChain 是一个开源 Python 框架，利用 LangChain，开发人员能够非常方便的开发基于大型语言模型的应用程序（AI 原生应用），例如：聊天机器人，摘要，生成式问答……。

LangChain 虽然是一个非常年轻的框架，但又是一个发展速度非常快的框架。自从 2022 年 10 月 25 在 GitHub [第一次提交](https://github.com/langchain-ai/langchain/commit/18aeb7201)以来，在 11 个 月的时间里，累计发布了 200 多次，累计提交 [4000](https://github.com/langchain-ai/langchain/graphs/commit-activity) 多次代码。2023 年 3 月，ChatGPT 的 API 因升级降价大受欢迎，LangChain 的使用也随之爆炸式增长。

![LangChain 代码提交趋势](langchain_commit_counts.jpg)

之后，LangChain 在没有任何收入也没有任何明显的创收计划的情况下，获得了 1000 万美元的种子轮融资和 2000-2500 万美元的 A 轮融资，估值达到 2 亿美元左右。[^7]

作为一个年轻而又活力的框架，LangChain 正在彻底改变工业和技术，改变我们与技术的每一次互动。

## LangChain 的目标
不同的大语言模型都有各自的优势，我们可能会用 A 模型来进行自然语言理解，然后用 B 模型进行逻辑推理并获取结果……此时，如果使用大语言模型各自提供的 API 来和模型交互，那么就会存在非常多的重复工作。

虽然大语言模型有很多，但是和大语言模型的交互流程又是非常类似，如果每次和模型交互都需要重复如上的步骤，那听起来也是一件非常繁琐的事情。对于相同的提示词，我们不想每次都 `ctr+c`、`ctr+v`，这真是一件非常可怕的事情。

![和模型交互的流程](1.jpg)

和 FFmpeg 对视频的处理一样，FFmpeg 提供的 `filtergraph` [^1]机制大大增强了其音视频的处理能力，奠定其在视音频领域的地位。`filtergraph` 可以将不同的音视频处理能力以链条的形式组合起来，不但简化了音视频的处理流程，更让 FFmpeg 可以实现复杂的音视频处理。

同理，和 LLMs 的单次交互并不会形成什么惊人的能量，而如果可以使用类似 `filtergraph` 的机制，将与 LLMs 的多次交互整合起来，那么其所释放的能量将是无穷的。

而 LangChain 就是为了解决如上的问题而产生的。LangChain 可以提供给我们的最主要的价值如下[^2]：

* 组件化：LangChain 对与 LLMs 交互的流程进行了统一的抽象，同时也提供了不同 LLMs 的实现。这极大的提升了我们使用 LLMs 的效率。
* 序列化：LangChain 提供的序列化的能力，可以将`提示词`、`chain`等以文件的形式而不是以代码的形式进行存储，这样可以极大的方便我们共享 `提示词`，并对 `提示词` 进行版本管理。[^3]
* 丰富的 chains 套件：LangChain 提供了丰富、用于完成特定目的、开箱即用的 chains 套件，例如用于总结文档的 ` StuffDocumentsChain` 和 `MapReduceDocumentsChain`，这些套件将会降低我们使用 LLMs 的门槛。

更具体的， LangChain 可以在如下的 6 大方向上给我们提供非常大的便利：

1. **LLMs & Prompt**：LangChain 提供了目前市面上几乎所有 LLM 的通用接口，同时还提供了 `提示词` 的管理和优化能力，同时也提供了非常多的相关适用工具，以方便开发人员利用 LangChain 与 LLMs 进行交互。
2. **Chains**：LangChain 把 `提示词`、`大语言模型`、`结果解析` 封装成 `Chain`，并提供标准的接口，以便允许不同的 `Chain` 形成交互序列，为 AI 原生应用提供了端到端的 `Chain`。
3. **Data Augemented Generation**[^4]：`数据增强生成式` 是一种解决预训练语料数据无法及时更新而带来的回答内容陈旧的方式。LangChain 提供了支持 `数据增强生成式` 的 `Chain`，在使用时，这些 `Chain` 会首先与外部数据源进行交互以获得对应数据，然后再利用获得的数据与 `LLMs` 进行交互。典型的应用场景如：基于特定数据源的问答机器人。
4. **Agent**：对于一个任务，`代理` 主要涉及让 `LLMs` 来对任务进行拆分、执行该行动、并观察执行结果，`代理` 会重复执行这个过程，直到该任务完成为止。LangChain 为 `代理` 提供了标准接口，可供选择的代理，以及一些端到端的 `代理` 的示例。
5. **Memory**：`内存` 指的是 chain 或 agent 调用之间的状态持久化。LangChain 为 `内存` 提供了标准接口，并提供了一系列的 `内存` 实现。
6. **Evaluation**：LangChain 还提供了非常多的评估能力以允许我们可以更方便的对 `LLMs` 进行评估。

## LangChain 的基本概念
使用 LLMs 和使用电脑一样，需要一些基本的架构体系。LangChain 把整体架构体系分为两部分：输入/输出系统，大语言模型。其中，输入部分为 `Prompt` 相关组件，输出为 `Output Parser` 相关组件。具体如下：

![LangChain I/O](langchain_io.png)

LangChain 提供了与 LLMs 交互的通用构件：

* `Prompts`：提示词模版，提示词动态选择，提示词序列化。
* `LLMs`：与 LLM 交互的通用接口。
* `Output Parsers`：对模型的输出信息进行解析，以输出符合特定格式的响应。

![LangChain I/O 示例](langchain_io_example.jpeg)

### Prompt Templates
提示词模版为不同的提示词提供预定义格式。就好像目前超市售卖的洗净切好、配好相关配菜源材料的预制菜一样，提示词模版可以简化我们和 LLMs 交互的效率。

模版会包含：指令，少量的样本示例，相关的上下文信息。LLMs 会分为 `大语言模型` 和 `聊天模型` 两种类型，因此，LangChain 提供了两种类型的提示词模版：`prompt template`、`chat prompt template`。

* `prompt template`：提供字符串格式的提示词。
* `chat prompt template`：提示聊天消息格式的提示词。

```python
from langchain import PromptTemplate

prompt_template = PromptTemplate.from_template(
    "请以轻松欢快的语气写一篇描写 {topic} 的文章，字数不超过 {count} 字。"
)
res = prompt_template.format(topic="北京的秋天", count="100")

print(res)
# 请以轻松欢快的语气写一篇描写 北京的秋天 的文章，字数不超过 100 字。
```

```python
from langchain.prompts import ChatPromptTemplate

template = ChatPromptTemplate.from_messages([
    ("system", "你是一个能力非凡的人工智能机器人，你的名字是 {name}。"),
    ("human", "你好！"),
    ("ai", "你好~"),
    ("human", "{user_input}"),
])

messages = template.format_messages(
    name="小明",
    user_input="你是谁？"
)

print(messages)
# [SystemMessage(content='你是一个能力非凡的人工智能机器人，你的名字是 小明。', 
#                additional_kwargs={}), 
# HumanMessage(content='你好！', additional_kwargs={}, example=False), 
# AIMessage(content='你好~', additional_kwargs={}, example=False), 
# HumanMessage(content='你是谁？', additional_kwargs={}, example=False)]
```

### LLMs
LangChain 提供了两种模型的通用接口：

* `LLMs`：模型以字符串格式的提示词作为输入，并返回字符串格式的结果。
* `Chat models`：其背后也是由某种 LLM 来支撑，但是以聊天消息列表格式的提示词作为输入，并返回聊天消息格式的结果。

!!! note LLM 和 聊天模式的区别
    LLM 和 聊天模式 之间的区别虽然很微妙，但是却完全不同。

    LangChain 中的 LLM 指的是纯文本 I/O 的模型，其包装的 API 将字符串提示作为输入，并输出字符串。OpenAI 的 GPT-3 就是 LLM。

    聊天模型通常由 LLM 支持，但专门针对对话进行了调整，其 API 采用聊天消息列表作为输入，而不是单个字符串。通常，这些消息都标有角色（例如，“System”，“AI”，“Human”）。聊天模型会返回一条 AI 聊天消息作为输出。OpenAI 的 GPT-4，Anthropic 的 Claude，百度的 Ernie 都是聊天模型。


在 LangChain 中，LLM 和 聊天模式两者都实现了 `BaseLanguageModel` 接口，因此一般情况下，这两种模型可以混用。例如，两种模型都实现了常见的方法 `predict()` 和 `predict_messages()`。`predict()` 接受字符串并返回字符串，`predict_messages()` 接受消息并返回消息。

```python
class OpenAI(BaseOpenAI):
    # ...

class BaseOpenAI(BaseLLM):
    # ...

class BaseLLM(BaseLanguageModel[str], ABC):
    # ...
```

```python
class ErnieBotChat(BaseChatModel):
    # ...

class BaseChatModel(BaseLanguageModel[BaseMessageChunk], ABC):
    # ...
```

接下来，我们将 `Prompt` 和 `LLM` 整合起来，实现和大语言模型交互。

```python
from langchain import PromptTemplate
from langchain.llms import OpenAI

prompt_template = PromptTemplate.from_template(
    "请以轻松欢快的语气写一篇描写 {topic} 的文章，字数不超过 {count} 字。"
)
llm = OpenAI()

prompt = prompt_template.format(topic="北京的秋天", count="100")
res = llm.predict(prompt)
print(res)

# 秋天来到了北京，一片金黄色的枫叶，漫山遍野。
# 湖面上的微风，吹起柔和的秋意，空气中弥漫着淡淡的枫香。
# 这时，每一个角落都洋溢着秋日的温馨，令人心旷神怡。
# 古老的长城上披着红叶，熙熙攘攘的人群中，也多了几分热闹与欢畅，这就是北京的秋天
```

由于文心聊天模型对 `message` 角色和条数有限制[^5] [^6]，因此我们需要对 `提示词` 做一些修改。

```python
from langchain.chat_models import ErnieBotChat
from langchain.prompts import ChatPromptTemplate

template = ChatPromptTemplate.from_messages([
    ("user", "你是一个能力非凡的人工智能机器人，你的名字是 {name}。"),
    ("assistant", "你好~"),
    ("user", "{user_input}"),
])
chat = ErnieBotChat()

messages = template.format_messages(
    name="小明",
    user_input="你是谁？"
)

res = chat.predict_messages(messages)
print(res)
# content='我是你的新朋友小明，一个拥有先进人工智能技术的人工智能机器人。' 
# additional_kwargs={} example=False
```

### Output Parsers
大语言模型一般会输出文本内容作为响应，当然更高级的大语言模型（例如文心大模型）还可以输出图片、视频作为响应。但是，很多时候，我们希望可以获得更结构化的信息，而不仅仅是回复一串字符串文本。

我们可以使用 `提示词工程` 来提示 LLMs 输出特定的格式，如下所示：

```python
from langchain.chat_models import ErnieBotChat
from langchain.prompts import ChatPromptTemplate

template = ChatPromptTemplate.from_messages([
    ("user", "你是一个能力非凡的人工智能机器人，你的名字是 {name}。"),
    ("assistant", "你好~"),
    ("user", "{user_input}"),
])
chat = ErnieBotChat()

messages = template.format_messages(
    name="小明",
    user_input="请给出 10 个表示快乐的成语，并输出为 JSON 格式"
)

res = chat.predict_messages(messages)
print(res)

# content='```json\n[\n    "乐不可支",
#                    \n    "喜从天降",
#                    \n    "笑逐颜开",
#                    \n    "手舞足蹈",
#                     ......
#                    \n    "弹冠相庆"\n]\n```' 
# additional_kwargs={} example=False
```

但是，使用 LangChain 提供的 `Output Parsers` 能力，会更加的方便。

```python
from langchain.chat_models import ErnieBotChat
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import CommaSeparatedListOutputParser

template = ChatPromptTemplate.from_messages([
    ("user", "你是一个能力非凡的人工智能机器人，你的名字是 {name}。"),
    ("assistant", "你好~"),
    ("user", "{user_input}"),
])
chat = ErnieBotChat()

messages = template.format_messages(
    name="小明",
    user_input="请仅给5个表示快乐的成语并以 , 分隔，除了成语外不要输出任何其他内容"
)

res = chat.predict_messages(messages)
print(res)
# content='欢呼雀跃，手舞足蹈，笑逐颜开，心花怒放，喜笑颜开' additional_kwargs={} example=False

output_parser = CommaSeparatedListOutputParser()
res =  output_parser.parse(res.content.replace('，', ', '))
print(res)
# ['欢呼雀跃', '手舞足蹈', '笑逐颜开', '心花怒放', '喜笑颜开']
```

!!! warning
    由于文心大模型的指令遵循能力还有进一步提升的空间，因此这里的演示可能需要进行一些额外的操作，例如需要对模型返回的内容进行一些简单的字符串替换。


### LLMChain
虽然一台独立的计算机也能实现很强大的功能，但是通过网络将更多的计算机链接起来，可能发挥出更大的性能。同样的，单独使用 LLMs 已经可以实现强大的功能，但是如果可以将更多次的交互有效的链接起来，则能发挥 LLMs 更大的能量。为了实现这个目标，LangChain 提供了 `Chain` 的概念，以实现对不同组件的一系列调用。

在 LangChain 中，`提示词`、`LLM`、`输出解析` 这三者构成了 `Chain`，而不同的 `Chain` 则可以通过一定的方式链接起来，以实现强大的功能。具体如下所示。

![LangChain 中 Chain 的概念](./images/chain.png)

利用 `Chain` 的概念，我们可以对之前的代码进行重构，

```python
from langchain.chat_models import ErnieBotChat
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import CommaSeparatedListOutputParser
from langchain.chains import LLMChain

template = ChatPromptTemplate.from_messages([
    ("user", "你是一个能力非凡的人工智能机器人，你的名字是 {name}。"),
    ("assistant", "你好~"),
    ("user", "{user_input}"),
])
chat = ErnieBotChat()

chain =  LLMChain(llm=chat, prompt=template, output_parser=CommaSeparatedListOutputParser())

res =  chain.run(name="小明", user_input="请仅给5个表示快乐的成语并以 , 分隔，除了成语外不要输出任何其他内容")

print(res)
# ['以下是五个表示快乐的成语：\n\n1. 喜出望外\n2. 乐不可支\n3. 心花怒放\n4. 满心欢喜\n5. 手舞足蹈']
```

## LangChain 的学习资料

* LangChain 官方文档：[https://python.langchain.com/docs/get_started](https://python.langchain.com/docs/get_started)
* LangChain 的典型应用场景：[https://python.langchain.com/docs/use_cases](https://python.langchain.com/docs/use_cases)
* LangChain 目前集成的能力：[https://python.langchain.com/docs/integrations](https://python.langchain.com/docs/integrations)
* LangChain AI Handbook：[https://www.pinecone.io/learn/series/langchain/](https://www.pinecone.io/learn/series/langchain/)
* LangChain Dart：[https://langchaindart.com/#/](https://langchaindart.com/#/)
* 百度智能云千帆大模型平台：[https://cloud.baidu.com/product/wenxinworkshop](https://cloud.baidu.com/product/wenxinworkshop)

## 参考文献
[^1]: [FFmpeg Filters Documentation](https://ffmpeg.org/ffmpeg-filters.html)
[^2]: [LangChain Introdction](https://python.langchain.com/docs/get_started/introduction)
[^3]: [Prompt Serialization](https://python.langchain.com/docs/modules/model_io/prompts/prompt_templates/prompt_serialization)
[^4]: [A Complete Guide to Data Augmentation](https://www.datacamp.com/tutorial/complete-guide-data-augmentation)
[^5]: [ERNIE-Bot-turbo](https://cloud.baidu.com/doc/WENXINWORKSHOP/s/4lilb2lpf)
[^6]: [百度智能云千帆大模型平台](https://cloud.baidu.com/product/wenxinworkshop)
[^7]: [LangChain 估值](https://ecosystem.lafrenchtech.com/companies/langchain)