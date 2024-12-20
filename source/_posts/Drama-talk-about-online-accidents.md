---
title: 大话线上事故
reward: false
top: false
date: 2023-11-26 21:13:51
authors: 
  - 刘一卓
categories:
  - 总结
tags:
  - 运维
  - 架构
  - 线上事故
---

![](1_1.png)

!!! note 这就是微服务，这就是线上事故——17哥
    微服务架构虽然解决了单体架构下的部署、运维、扩展、效率等痛点问题，但是它让系统架构变得更加复杂。很多时候，微服务架构用的不好，就很容易形成分布式单体的效果，最终导致很多非预期的线上问题。

    如上图所示，当我们兴冲冲的发现了一个线上 BUG，满怀激动的修复好，然后一脸骄傲的点下发布按钮之后，我们才深悟痛彻的理解了那句：“能跑就别动它”。

    我的同事将自己工作中遇到的一些线上问题的案例进行了提炼、总结，然后形成了这篇文章——其中很多案例即有趣又痛心——希望对大家有所帮助。
<!--more-->

说起线上事故，资深的 IT 从业人员也难免“谈虎色变”。对于一叶扁舟的小型初创公司，它像狂风暴雨，轻则使之风雨飘摇，对于泰坦尼克号类的大型公司，则可能是危险的冰山，重则致其折戟沉沙。

本文尝试通过浅显易懂的方式，从系统设计的角度对某些线上事故进行原因分析并总结其改进方案，愿“哀之鉴之，不使后人而复哀后人也”。

* 事故一：西瓜和芝麻一起蚌埠住了--组件上线导致服务不可用x分钟
* 事故二：超时还是不超时，这是个问题--不合理的止损方案导致服务大量拒绝
* 事故三：删除一条数据，系统崩溃了--牵一发而动全身，不合理的系统架构

## 事故一 西瓜和芝麻一起宕机了

`故障描述`：不重要的芝麻组件发生配置变更，由于线上程序不兼容，导致其重启后挂掉，重要的西瓜组件由于采用同步阻塞方式调用了芝麻组件，进而无法写入卡死，导致大量用户访问拒绝

![](1.png)

`经验教训`：
* 关键点：西瓜重要，相对来说，芝麻不重要，芝麻丢了不应该西瓜也一起跟着丢掉，需要保住西瓜！！
* 芝麻组件未做好前向兼容，对于不能识别的配置，没有终止操作
* 组件之间的强/弱耦合关系需要正确处理，系统才具备容灾/解耦能力
* 由于程序健壮性不足，无法自动重启，通过手动发单操作重启，导致回滚环节持续时间较长

!!! error 17哥 点评
    千里之堤毁于蚁穴，一叶扁舟之险也。需要面向服务整体进行服务等级的划分，并做好服务降级、容灾、限流等措施。

    在微服务架构下，没有什么服务有高低贵贱之分，所有服务都是平等的。在服务演化的进程中，谁能保证所有人都能意识到某个服务是弱依赖？谁又能保证，所有人都做了容错的兜底？

## 事故二 超时还是不超时，这是个问题

`故障描述`：网络异常触发了 Redis 主从全量同步，导致 Redis 负载较高，读写成功率降低。处理该问题时，将超时时间配置修改为 0，意图尝试快速超时断开 Redis 连接，而 0 的含义实际为不超时，操作后问题进一步扩大：PHP 进程夯住，大量请求拒绝，问题等级上升为事故。

![](2.png)

`经验教训`：
* 存储层未区分核心、非核心，导致无法对非核心数据进行摘除，止损方案本身不合理
* 连接层的处理上，未对边界配置进行充分了解，仓促进行调整，导致故障范围扩大
* 监控角度，地域连通性监控，主从同步监控有效性需要检查

!!! error 17哥 点评
    在分布式架构下，服务的状态不是只有 `成功`、`失败` 两态，而是三态：`成功`、`超时`、`失败`。

## 事故三 删除一条数据，系统崩溃了

`故障描述`：删除 Redis 的一个大 Key，导致地域 X、Y 机房 Redis 阻塞，Redis 不可读写，在横跨多业务线的系统中，逐层触发重试风暴，最终 DB 流量暴增被压垮，同时影响共用 DB 的模块 B、C、D，其中包含某“一级服务（核心）”，另外上游模块也被拖死，请求大量拒绝。

![](3.png)

`经验教训`：
* 不合理的重试次数设置：底层服务挂掉后，逐层触发重试，疯狂重试
* 共用数据库可以考虑拆分与隔离，使用异步队列等
* 大 Key 删除可能导致“堵水管”（redis 主线程执行 del），4.0 以后得版本可以考虑 lazy free
* 同理考虑 DB 删除记录带来的锁升级风险

!!! error 17哥 点评
    不知道哪个角落的某台计算机发生了故障，导致了我们自己的电脑无法使用，这就是分布系统。
    
    如果你不了解服务的全貌，那么就不要轻易去动任何你觉得“并不重要”的东西。任何时候，对线上都要保持敬畏，如果不了解，就别动；如果想动，就要去做好全面的了解。
