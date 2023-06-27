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
#### 从存在超链接的单元格中提取超链接
如下图所示，从 **工具->宏->Visual Basic编辑器** 打开Visual Basic 编辑器，然后选择插入**模块**选项，在编辑器中输入如下的代码。

![](5.jpg)

```vb
Function GetAdrs(Rng)
    Application.Volatile True
    With Rng.Hyperlinks(1)
        GetAdrs = IIf(.Address = "", .SubAddress, .Address)
    End With
End Function
```

然后按照如下图所示像使用普通 Excel 函数一样使用 `GetAdrs` 就可以了。
![](6.jpg)

## 字符串操作
当需要处理类似视频分辨率信息的数据`720x1280`时，Excel 中的字符串相关函数就派上大用途了。例如，对于如下表所示的视频数据信息中，如何从resolution列提取视频对应宽高信息？

| ID | URL | resolution | …… |
|---|---|---| --- |
| 1 | url | 720*1280 | …… |
| 2 | url | 1080*1920 | …… |

!!! note <a href="https://support.microsoft.com/en-us/office/left-leftb-functions-9203d2d2-7960-479b-84c6-1ea52b99640c">left</a>, <a href="https://support.microsoft.com/en-us/office/right-rightb-functions-240267ee-9afa-4639-a02b-f19e1786cf2f">right</a>, <a href="https://support.microsoft.com/en-us/office/len-lenb-functions-29236f94-cedc-429d-affd-b5e33d2c67cb">len</a>, <a href="https://support.microsoft.com/en-us/office/find-findb-functions-c7912941-af2a-4bdf-a553-d0d89b0a0628">find</a>
    * **LEFT** returns the first character or characters in a text string, based on the number of characters you specify.
    * **RIGHT** returns the last character or characters in a text string, based on the number of characters you specify.
    * **LEN** returns the number of characters in a text string.
    * **FIND** locate one text string within a second text string, and return the number of the starting position of the first text string from the first character of the second text string.

对于 `720*1280` 而言，`*`左边的字符构成了视频的宽度信息，而 `*` 右边的字符构成了高度信息。
* 宽度信息：left(str, position(*) - 1) → `=LEFT(str, FIND("*", str)-1)`
* 高度信息：right(str, length(str) - position(*)) → `=RIGHT(str, LEN(str)-FIND("*",str))`

![](7.jpg)

在视频中，我们一般称视频的分辨率为720P，1080P……，其实也就是宽高信息中的最小值。因此，在得到宽高信息后，我们还希望得到这个视频是720P还是1080P。

!!! note <a href="https://support.microsoft.com/en-us/office/min-function-61635d12-920f-4ce2-a70f-96f202dcc152">min</a>，<a href="https://support.microsoft.com/en-us/office/value-function-257d0108-07dc-437d-ae1c-bc2d3953d8c2">value</a>
    * **MIN** Returns the smallest number in a set of values.
    * **VALUE** Converts a text string that represents a number to a number.

但是，实际中，我们使用 `min` 得出的结果却是 0，如下图所示。
![](8.jpg)

至于原因，在 [min](https://support.microsoft.com/en-us/office/min-function-61635d12-920f-4ce2-a70f-96f202dcc152) 的 `Remarks` 部分解释的非常清楚：
* If an argument is an array or reference, only numbers in that array or reference are used. Empty cells, logical values, or **text** in the array or reference are ignored.
* If the arguments contain no numbers, MIN returns 0.

因为我们之前通过 `left`、`right` 得到的数据是字符串类型，因此在 `min` 函数中，这些数据均被过滤，而当 `min` 函数参数中不存在数字参数时，它就返回 0。

此时就需要用到 `value` 函数将字符串转成数字，如下所示：
![](9.jpg)

## 总结
写到这里，回头想想，觉得自己真是幸运，幸运于自己及时制止了那按耐不住的想展示一下技术的愚蠢的想法，否则我现在还在焦头烂额的调试自己的那一堆代码。当然，Excel 还有更多的、其他的强大的能力，等遇到了再继续补充吧~