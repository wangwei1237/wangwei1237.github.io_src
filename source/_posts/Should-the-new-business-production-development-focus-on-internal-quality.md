---
title: 新业务的开发就不需要重视内部质量吗？
reward: false
top: false
date: 2021-12-04 12:31:23
authors:
categories:
  - 文化
tags:
  - 方法论
  - 软件开发
  - 质量与成本
---
![](0.jpeg)

一直以来，我都在思考如下的问题：
* 新启动的业务是否值得花费时间来开展单元测试、接口自动化测等质量保证手段？
* 新启动的业务是否值得花费时间来践行持续集成等软件开发模式？
* 新启动的业务是否值得花费时间来设计架构、编写接口文档……?
* ……

<!--more-->

## 一直以来的疑问和迷惑
一直以来，都没有想的非常清楚。随着经历的越多，观察的越多，对这些问题的迷惑也随之增加：
* 如果说，自动化是提升效率的必要手段，那么，为什么新业务都不愿意采用对应的自动化手段呢？
* 如果说，持续集成真的能够提升软件价值的交付效率，那么，为什么新业务都不愿意采用这种实践模式？
* 我总是听到，新业务要快速验证业务逻辑，代码都没有时间写，哪还有时间编写：
    * 架构设计文档
    * 接口文档
    * 单元测试用例
    * 自动化用例
    * ……
    难道如上的这些手段会降低价值交付的效率？如果不是这样，那为什么我总能听到这种言论呢？

直到最近读了 Martin Fowler 的文章 *[Is High Quality Software Worth the Cost?](https://martinfowler.com/articles/is-quality-worth-cost.html)* （[高质量的软件是否值得付出代价？](https://mp.weixin.qq.com/s/mGq5SsMp2yuSA_p5meWRCg)），才想明白了如上的问题和迷惑的根源。

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

实际上，对于新业务而言，我们在探索的初期就是向着一个可能会成功的方向上来探索。因此，整个探索的过程会经历数月、甚至 1~2 年的时间。而根据 Martin Fowler 的 **软件累计功能** 模型，如果不重视 **内部质量**，数周之后，糟糕的 **内部质量** 就会严重影响软件的交付效率。因此，只有在一开始就重视软件的 **内部质量**，才能真正有效的提升新业务的价值探索效率。

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
在文章的最后，Martin Fowler 也提到：**成本** 和 **内部质量** 是一种不寻常且违反直觉的关系，因此通常难以理解二者之间的关系，但是理解他们之间的关系对于以最高效率开发软件至关重要。

> When thinking about internal quality, I stress that we should only approach it as an economic argument. 
> 
> High internal quality reduces the cost of future features, meaning that putting the time into writing good code actually reduces cost. 
> 
> Because the relationship between cost and internal quality is an unusual and counter-intuitive relationship, it's usually hard to absorb. But understanding it is critical to developing software at maximum efficiency.

## 醍醐灌顶
直到现在，直到读了 Martin Fowler 的这篇文章，直到将软件质量区分为 **内部质量** 和 **外部质量**，直到了解到 **成本** 和 **内部质量** 之间的这种不寻常、但又违反直觉、讲不清道不明、剪不断理还乱的关系，我才明白，我为什么会有本文开头所列的种种迷惑和不解，我才找到了一直追寻的答案。

#### 越是新业务，越要及早重视内部质量
最开始的时候，我也认为在新业务的早期，没有必要过早的建设单元测试、自动化测试、接口文档等工作。对这个事情的认知改变始于 2014 年开始参与的 **宝宝知道** 这款产品的研发工作。

当时，我负责这款产品的服务端测试工作。在 1.0 版本的测试过程中，没有接口文档、没有单元测试用例、没有接口测试用例……整个测试过程就是利用 `curl` 命令发起请求，然后手动逐一校验返回结果中的每一个字段，校验字段的类型、字段的结果、数据库中的数据……

当 1.0 版本上线的时候，我就在想，不能再这么搞了，效率太低了。恰巧那个时候，研发同学正在推动接口定义的文档化：使用 `json` 定义接口，然后服务端、iOS 端、Android 端利用该接口定义自动生成各自需要的对象实体。

在新接口设计之初，团队内所有角色都会参与进来一起制定对应接口的 `json` 格式的接口定义，然后由服务端 RD 存储在代码库之中。借助于这种有利的形式，我开始和 RD 讨论：在 RD 编写代码时，测试人员同步编写自动化接口测试用例的可行性。

最终，我和 RD 一拍即和，在随即开始的下一次迭代开发中，RD 在开发过程中，我也在根据接口定义文档来编写该接口的自动化测试用例。我把之前手工校验的所有校验点全部用代码的方式来实现。同时，为了兼顾到架构层面的风险，我和 RD 约定：每天下午5点，RD 需要将当前的代码入库，然后我就可以拉取到 RD 的代码，并执行 **代码走读**，同时也可以根据目前的代码来及时修正自动化测试的校验点。

我每天都会花费一些时间来编写自动化测试用例，走读代码，修正自动化测试用例。就这样，不断的把原本在 Excel 中的手工测试用例切换到了自动化测试用例。当然，在测试用例设计上，比 1.0 版本的测试设计花费了更多的时间。但是，当 RD 提测的时候，对于测试执行的时间，则比之前大大缩短，我只花了 10 分钟左右的时间就完成了测试。到后来，RD 在开发过程中也用上了我编写的自动化测试用例，RD 在开发中调试、定位、修复问题的效率也大为提升。后来，服务端的架构做了一些调整，例如：数据库迁移、缓存机制、异步提交机制……在自动化测试用例的帮助下，我发现，对于我们而言，这种变更变得非常可控。

**时至今日，每当回想起来，我都认为，在项目的初期就采用了代码化的接口定义文档、完善的自动化测试用例等有利于提升 *内部质量* 的措施，才保证了之后的交付效率，才使得作为后来者的 *宝宝知道* 在之后的竞争中及时抓住市场机会、获取市场先机，在众多母婴类产品中脱颖而出。**

#### 忽略内部质量，欲速则不达
机缘巧合，我有幸能够观察到更多的新业务的交付过程。对于新业务而言，唯快不破。然而，对于新业务，我发现总会出现 Martin Fowler 所说的那种情况：
* 团队普遍会拒绝为那些没有效果的 **内部质量** 付出更多的资源和成本
* 团队每天都疲于实现用户可感知到的功能，每天都围绕着 **外部质量** 而忙碌

我总能听到这些团队的决策者说：现在业务处于逻辑验证期，要保证功能的快速上线，其他的事情（架构设计、接口文档、自动化测试……）都先放一下，优先保证功能上线。

据我多年的观察，我发现，凡是有这种思想的业务，总会在最该快速奔跑的时刻受到 **内部质量** 的束缚。残缺的架构设计，丢失的接口文档，无法快速验证软件是否正常的自动化测试能力……所有的这些因素导致功能迭代的效率急剧下降，同时带来的还有产品质量的持续走低。

团队着急将某个新特性发布到线上，然而，数小时之后线上开始出现了异常：
* 团队不得不回滚这次新特性的发布，并花费很大的代价来定位&修复问题，然后再次将新特性推送给用户。
* 更严重的是，功能回滚、问题定位&修复、功能再发布占用了其他新特性的研发时间，打乱了团队的研发节奏，进而严重影响了交付的效率，增加了交付的成本。
* 最后，为了体现对该问题的重视，每当这个时候，团队会放下手里的新特性，“郑重其事”的对问题的来龙去脉进行复盘，以避免类似的事情再次发生。然而，我观察到，每次的结果总是：年年岁岁花相似，岁岁年年人不同。
* 直到团队内部所有的人都无法再忍受类似的事情了，无法再忍受那看也看不懂、改也没法改、需要猜来猜去的代码了，一种有趣的现象随之出现：重构，大规模的重构。然而，因为新业务缺乏对应的快速验证的有效手段，因此，此时的重构需要花费高昂的成本。而重构本身又是一种没有 **价值增值** 的行为，当团队花费巨大的成本完成重构的时候，有可能已经错过市场的机会。

新业务总想着快速起跑，而忽略了检查自己的装备，倒出鞋里的沙子，系紧鞋带……新业务总认为这些事情会占用跑步的时间，到后来才发现，不久之后，这些事情就会降低跑步的速度，导致我们不得不在之后的某个时间点停下脚步去处理这些事情。在这个时候，就这样眼睁睁的看着别人以不断增加的加速度来奔跑。欲速则不达，非不想，实不能。

#### 忽略内部质量带来的破窗效应
> **破窗原理**
> 
> 一扇破损的窗户，只要一段时间不去修理，建筑中的居民就会潜移默化地产生一种被遗弃的感觉——当权者不关心这幢建筑的感觉。
> 
> 然后，其他的窗户也开始损坏，居民开始乱丢废物，墙上开始出现涂鸦，建筑开始出现严重的结构性损坏。
> 
> 在看上去很短的时间内，建筑的损坏程度就足以打消业主们想修好它的期望，被遗弃的感觉终变成了现实。

在项目启动的初期，遗留在项目中的那些被忽视的 **内部质量** 问题，就会像破窗效应一样在后续的开发中不断蔓延、扩散。如果低头看一下键盘就会发现，我们总会使用：`ctrl + c` 和 `ctrl +v`，每一次这样的操作，都有可能放大那些之前被忽视的 **内部质量** 而带来的问题。

* 原来的代码就是这样写的，之前也都没有问题，为什么现在会出问题呢？
* 我就是复制了原来的代码而已？
* ……

永远不要指望一个一开始就忽视 **内部质量** 的项目，能够在项目的后期会有较好的质量和迭代效率，我从未见过这样的奇迹发生。

#### 忽略内部质量，远不止成本的增加那样简单
我们处在一个“数字化生活”的时代，软件对我们日常生活的影响从未像现在一样如此巨大。依赖强大的软件和网络，新发生的事情在数分钟内就会触达世界各地。我们日常生活的各个方面越来越离不开各类软件和网络的支持，我们网上购物、在线支付、利用网络查询信息、和家人互动……

因此，软件带来的问题对我们生活的影响比以往任何一个时期都要严重。2021 年 8 月 30 日，特斯拉汽车互联网网络出现宕机，导致 Model3 车主无法开启车辆。即便是软件偶尔的异常有可能会影响到我们的心情甚至是生活状态。因此，我们对软件的可靠性的理解要比之前更进一步，软件 N 个 9 的可靠性难道不会产生影响用户心情甚至是生活状态的事情了？

在最开始就忽视了 **内部质量** 而带来的问题，远不只 Martin Fowler 文中所说的会增加未来的变革成本那样简单，他们还会对我们的日常生活带来烦恼。

## 起步时就关注内部质量吧
不要再自欺欺人了，不要在业务的一开始就去做 **内部质量** 与 **效率** 的权衡，这样会让我们在之后的研发中根本没有时间去权衡。

在新业务的初期，就应该花费一定的时间来建设那些可以提高软件 **内部质量** 的事情。否则，当我们在全力以赴去加速奔跑的时候，就需要停下脚步来处理因为这些 **内部质量** 而带来的问题。

做饭时，我们要不时的清理灶台和设备。因为做饭时必然会弄脏灶台和设备，如果不快速清洁的话，污垢就会变干，会变的更难去除，而所有的脏东西都会妨碍下一道菜的烹饪。

## 其他案例
在 [高手的战略](https://mp.weixin.qq.com/s/VAxY0IRwvq0uzs_lJWhNiQ) 这篇文章中，也提到了很多不同行业的案例，我们也可以用来参考。