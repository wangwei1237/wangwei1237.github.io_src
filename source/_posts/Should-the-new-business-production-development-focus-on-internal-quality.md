---
title: 新业务的开发就不需要重视内部质量吗？
reward: false
top: false
date: 2021-12-04 12:31:23
authors:
categories:
  - 总结
tags:
  - 方法论
  - 文化
  - 软件开发
  - 质量与成本
---
一直以来，我都在思考如下的问题：
* 新启动的业务是否要花费时间来开展单元测试、接口自动化测等质量保证手段？
* 新启动的业务是否要花费时间来践行持续集成等软件开发模式？
* 新启动的业务是否要花费时间来设计架构、编写接口文档……?
* ……

<!--more-->

## 一直以来的疑问和迷惑
一直以来，都没有想的非常清楚。随着观察到的越多，对这些问题的迷惑也随之增加：
* 如果说自动化是提升效率的必要手段，那么为什么新业务都不愿意采用对应的自动化手段呢？
* 如果说，持续集成真的能够提升软件价值的交付效率，那么为什么新业务都不愿意采用这种实践模式？
* 我总是听到，新业务要快速验证业务逻辑，代码都没有时间写，哪还有时间编写：
    * 架构设计文档
    * 接口文档、
    * 单元测试用例、
    * 自动化用例
    * ……
    难道如上的这些手段会降低价值交付的效率？如果不是这样，那为什么我总能得到这种言论呢？

直到最近读了 Martin Fowler 的文章 *[Is High Quality Software Worth the Cost?](https://martinfowler.com/articles/is-quality-worth-cost.html)* （[高质量的软件是否值得付出代价？](https://mp.weixin.qq.com/s/mGq5SsMp2yuSA_p5meWRCg)），才想明白了如上的问题和迷惑。

## 高质量的软件是否值得付出代价？
#### 内部质量和外部质量
在 *[Is High Quality Software Worth the Cost?](https://martinfowler.com/articles/is-quality-worth-cost.html)* 一文中，Martin Fowler 将软件质量分为 **外部质量** 和 **内部质量**。

> I thus divide software quality attributes into **external** (such as the UI and defects) and **internal** (architecture). 
> 
> The distinction is that users and customers can see what makes a software product have high **external quality**, but cannot tell the difference between higher or lower **internal quality**.

然后，Martin Fowler 提到：既然用户无法区分 **内部质量** 的好坏，为什么要为没有效果的东西付出更多呢？

> Another way I put this is that it makes sense to trade cost for **external quality** but it makes no sense to trade cost for **internal quality**. 
> 
> A user can judge whether they want to pay more to get a better user interface, since they can assess whether the user interface is sufficiently nicer to be worth the extra money. 
> 
> But a user can't see the internal modular structure of the software, let alone judge that it's better. 
> 
> **Why pay more for something that has no effect?**
> 
>  Since that's the case - why should any software developer put their time and effort into improving the internal quality of their work?

因此，对于新业务而言，用户无法感知到：接口文档、单元测试用例、接口测试用例、持续集成的配套建设等有利于 **内部质量** 的措施，有这些时间还不如多写点代码，多实现一些用户可以感知到的功能。

这听起来是多么的合乎逻辑，推理的过程又是多么的顺理成章、无懈可击。

#### 内部质量的重要性
然后，Martin Fowler 利用 **软件累积功能** 和 **对应的开发成本** 之间的关系模型阐述了 **内部质量** 的重要性。

> ![](1.jpg)
> 
> The fundamental role of **internal quality** is that **it lowers the cost of future change**. 
> 
> But there is some extra effort required to write good software, which does impose some cost in the short term.

Martin Fowler 采用了访谈的方式来评估两条曲线的交点在整个软件开发过程中出现的时间，并惊奇的发现该交点在数周以后就会出现。

实际上，对于新业务而言，我们在探索的初期就是向着一个可能会成功的方向上来探索的。因此整个探索的过程会经历数月、甚至数年的时间。而根据 Martin Fowler 的 **软件累计功能** 模型，如果不重视 **内部质量**，数周之后，糟糕的 **内部质量** 就会严重影响软件的交付效率。因此，只有在一开始就重视软件的 **内部质量**，才能真正有效的提升新业务的价值探索效率。

> The way I assess where lines cross is by canvassing the opinion of skilled developers that I know. 
> 
> And the answer surprises a lot of folks. 
> 
> Developers find **poor quality code significantly slows them down within a few weeks**. 
> 
> So there's not much runway where the trade-off between internal quality and cost applies. 
> 
> **Even small software** efforts benefit from attention to good software practices, certainly something I can attest from my experience.

#### 成本和内部质量的关系
在文章的最后，Martin Fowler 也提到：成本和 **内部质量** 是一种不寻常且违反直觉的关系，因此通常难以理解二者之间的关系，但是理解他们之间的关系对于以最高效率开发软件至关重要。

> When thinking about internal quality, I stress that we should only approach it as an economic argument. 
> 
> High internal quality reduces the cost of future features, meaning that putting the time into writing good code actually reduces cost. 
> 
> Because the relationship between cost and internal quality is an unusual and counter-intuitive relationship, it's usually hard to absorb. But understanding it is critical to developing software at maximum efficiency.

## 醍醐灌顶
直到现在，直到读了 Martin Fowler 的这篇文章，直到将软件质量区分为 **内部质量** 和 **外部质量**，直到了解到成本和 **内部质量** 之间的这种不寻常、但又违反直觉、讲不清又道不明、剪不断理还乱的关系，我才明白我为什么会有文章开头所列的种种迷惑和不解，我才找到了我一直追寻的答案。

#### 越是新业务，越要及早重视内部质量
