---
title: 用 Excel 分析数据的小技巧
reward: false
top: false
date: 2022-05-18 20:07:35
authors:
categories:
  - 数据分析
tags:
  - Excel
  - VLOOKUP
  - 数据透视表
---

![](1.jpeg)

因为工作原因，最近经常要分析一些数据，这些数据的格式不规范，并且数据量级不大——大概在 1W 左右。

一开始，我是不屑于使用 Excel 来处理的，总想着写个程序来完成处理。后来，我发现，我的想法是多么的愚蠢，因为我发现，Excel 简直是太强大了，完全满足了我的各种需要。还好我及时纠正了自己愚蠢的想法，否则我现在还在忙个不停的调试自己的那些代码。

本文把自己使用 Excel 进行数据分析过程中学习到的小技巧进行了梳理总结。
<!--more-->

## 数据说明
在我的分析中，数据格式如下所示：
| ID | score1 | score2 | …… |
|---|---|---| --- |
| 1 | 2.32 | 3.56 | 6.78 |
| 2 | 3.22 | 6.56 | 8.23 |
| 3 | 6.98 | 8.12 | 3.78 |
| 4 | 4.56 | 7.35 | 6.53 |
| 5 | 5.78 | 2.34 | 9.12 |
|...|...|...|...|

其中，ID 代表我的分析对象中的某个样本，每个样本都会请求不同的服务对其进行打分，因而会得到如下图所示的表格文件。

![](2.jpg)

在上图的 Excel 中，每个 Sheet 的数据为不同服务返回的打分数据。

!!! warning 注意
    不同服务返回的打分中，可能会存在样本的丢失。例如 Sheet2 中就缺少 ID=10 的数据打分。
    
    在分析中，这种数据缺失是完全随机的。


## VLOOKUP
为了分析方便，需要把 Sheet1 和 Sheet2 的数据按照 ID 进行聚合。这个时候，使用 VLOOKUP 就可以非常方便的完成这个工作。

!!! note <a href="https://support.microsoft.com/en-us/office/vlookup-function-0bbc8083-26fe-4963-8ab8-93a18ad188a1">VLOOKUP</a> 
    Use VLOOKUP when you need to find things in a table or a range by row. For example, look up a price of an automotive part by the part number, or find an employee name based on their employee ID.

    =VLOOKUP(What you want to look up, where you want to look for it, the column number in the range containing the value to return, return an Approximate or Exact match – indicated as 1/TRUE, or 0/FALSE).


因此，我们用如下的代码就可以实现按照 ID 合并两个 Sheet 的数据：

```
=VLOOKUP(A1,Sheet2!A:B,2,0)
```

![](3.jpg)

!!! warning <a href="https://www.microsoft.com/en-us/microsoft-365/blog/2011/08/17/making-sense-of-dollar-signs-in-excel/">注意单元格的引用方式</a>
    * 相对引用，如：A1，B1，公式复制到另一个位置时行和列都要变
    * 绝对引用，如：$A$1，$B$1，公式复制到另一个位置时行和列都不变
    * 混合引用，如：$A1，$B1，$A1此时公式复制到另一个位置时行要变，列不变

## 数据透视表
如果希望分析 score1 的不同区间（例如[1, 10],[11, 20]）下，score2 分数各整数区间的个数，也即：
* scroe1 属于 [1, 10]
* score2 属于 [1,2], [2,3], [3,4], ...的样本个数

此时使用数据透视表就非常方便了。

* 首先，我们选中需要进行数据分析的数据。
  ![](4.jpg)
* 然后，按照如下图视频所示的方式进行数据分析。
  {% bilibili 939365062 %}


## Excel 宏
