---
title: kill -9导致subprocess.run启动的子进程无法退出
reward: false
top: false
date: 2020-08-07 12:06:29
categories: 
  - python
tags:
  - subprocess
  - kill命令 
  - 多线程
---

## 背景
我们有一个任务托管平台，该平台可以托管`python`语言编写任务，并且可以对任务状态进行管理。由于业务的需要，我们需要在`python`的任务中调起一个`shell`脚本来完成一些额外的事情。当我们把编写好的任务部署到任务托管平台之后，我们发现一个奇怪的现象：当在任务的超时时间内手动结束任务的时候，只有`python`的父进程退出了，而`python`启动的`shell`子进程却没有退出。

<!--more-->

## subprocess模块
我们使用subprocess.run()来创建新的shell进程，具体如下：

```python
subprocess.run(
    cmd,
    cwd=cwd,
    shell=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    encoding="utf-8",
    timeout=600
)
```

为了方便测试，分别写了一段[`python`代码](https://gitee.com/wangwei1237/wangwei1237/blob/master/2020/08/07/cannot-terminate-the-subprocess-run-child-process-caused-by-kill-9/timeout.py)和[`shell`代码](https://gitee.com/wangwei1237/wangwei1237/blob/master/2020/08/07/cannot-terminate-the-subprocess-run-child-process-caused-by-kill-9/timeout.sh)，可以点击链接查看具体代码。其中，`shell`脚本为一个死循环，具体如下：

```shell
for((i=0;;i++))
do
    echo "$i" >log 2>&1
done
```

然后，我们在本地使用`kill -2（ctrl+c）`结束父进程的时候，子进程也确实结束了。具体如下图所示：

![](sigint.png)

我们继续查出问题的原因，我们咨询了任务托管平台的负责人：任务托管平台页面上的`结束任务`是怎么实现的？

平台的负责人回应说：`kill -9`命令结束的。

在这时候，我知道，我可能大概知道问题的原因了。

## kill和signal
关于`kill`命令，此处不做详细介绍，具体可以参考[kill(1)手册](https://man7.org/linux/man-pages/man1/kill.1.html)。`kill`的作用是向某个特殊的进程或进程组发送一个特殊的信号，从而达到结束进程的目的。关于`信号(signal)`，此处也不做详细介绍，具体可以参考[signal(7)手册](https://man7.org/linux/man-pages/man7/signal.7.html)。

而`kill -9`命令实际上是向进程发送了`SIGKILL`信号，而在[signal(7)手册](https://man7.org/linux/man-pages/man7/signal.7.html)中可以看到：**The signals SIGKILL and SIGSTOP cannot be caught, blocked, or ignored.** 因此，`kill -9`是一种不可捕获的、不可忽略的信号，用来在特殊情况下紧急结束进程（如果该信号可以捕获和忽略的话，就达不到这个目的了）。

而对于一个单进程的程序而言，直接`kill -9`结束并没有什么问题，但是对于一个多进程的程序，例如本文中的例子，在`python`进程中又创建了`shell`子进程，那么直接用`kill -9`粗暴的结束父进程是非常不安全的，具体如下图所示：

![](sig9.jpg)

可见，在`kill -9`结束父进程之后，`shell`编写的子进程成为了[孤儿进程](https://www.geeksforgeeks.org/zombie-and-orphan-processes-in-c/)，并继续执行。

这也就是，我们在任务托管平台上结束任务后，子进程并没有退出的根本原因。父进程结束的信号根本就没有机会通知到子进程，子进程也就不可能结束了。

那么，我们换另外一个可以被捕获和忽略的信号，例如`SIGTERM`是否能结束子进程呢？

![](sigterm.jpg)

从图中可以看出，`SIGTERM`信号也没有结束子进程。

## subprocess.run()所捕获的异常
我们从[subprocess模块的源码](https://github.com/python/cpython/blob/3.8/Lib/subprocess.py)中可以发现，`subprocess.run()`实际上只捕获自定义的`TimeoutExpired`异常和`KeyboardInterrupt`异常，而在`python`中，`KeyboardInterrupt`异常对应的就是**用户中断执行**，一般就是输入`ctl+c`或发送`SIGINT`信号。具体如下：

```python
with Popen(*popenargs, **kwargs) as process:
    try:
        stdout, stderr = process.communicate(input, timeout=timeout)
    except TimeoutExpired as exc:
        # ...
        raise
    except:  # Including KeyboardInterrupt, communicate handled that.
        process.kill()
        # We don't call process.wait() as .__exit__ does that for us.
        raise
```

可见，对于`SIGINT`信号而言，`subprocess.run()`函数会调用`Popen.kill()`来结束子进程。

因此，对于多进程而言，当父进结束之前，需要通过某种机制来通知其子进程，进而让子进程知晓父进程的退出信息，并作出合理的后续行为。否则，就会出现本文中出现的孤儿进程的现象。

因此，对于其他的信号，`subprocess`模块本身就无法处理了。

## 捕获SIGTERM信号
如果要捕获`SIGTERM`信号，使得`kill -15`结束python任务的时候，同时也能结束子进程，那么就要耍点小聪明了，例如：在`python`中捕获其他信号，并将其转成`SIGINT`信号，具体可以参见[timeout_1.py](https://gitee.com/wangwei1237/wangwei1237/blob/master/2020/08/07/cannot-terminate-the-subprocess-run-child-process-caused-by-kill-9/timeout_1.py)。具体执行效果如下所示：

![](popen.jpg)

此处，我用了一个偷懒的方法，也就是把`SIGTERM`信号捕获之后转成`SIGINT`信号，具体的代码如下：

```
def sigintHandler(signum, frame):
    raise KeyboardInterrupt

    exit()

def run_cmd(cmd, cwd):
    signal.signal(signal.SIGTERM, sigintHandler)
    # ...
```

## 结语
查完这个问题，也算是对进程相关的内容有了更深入的了解。孤儿进程，僵尸进程，不可屏蔽进程……，好像经过很多时间之后，忽然都不记得自己曾经也钻研过这些概念一样。感谢我的同事*一卓*([@GerenLiu](https://github.com/GerenLiu))，在工作之余抽时间来一起讨论这个问题。