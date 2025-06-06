---
title: HDR技术导论
reward: false
top: false
date: 2021-01-26 15:37:44
categories:
  - 视频技术
tags:
  - HDR
---

真实世界的亮度范围是十分广阔的，而人眼能感知到的亮度范围在十万尼特左右。举个例子，用分光色度计测量向着阳光盛开的花朵，其黄色区域亮度最高可达14700尼特，边缘的红色是2300尼特，中央的花蕊和绿叶只有200尼特以下。但是，在窄色域、亮度普遍不超过100尼特、对比度也只有1000：1的SDR显示器下，这张照片的色彩会暗淡很多。但是随着技术的发展，HDR技术可以达到广色域、1000尼特亮度以及上万的对比度。虽然和现实标准相差还是比较大，但是相较于三十年前的SDR，HDR还是前进了一大步。

![](nit.jpg)

<!--more-->

## HDR介绍
HDR是*High Dynamic Range*的缩写。HDR是一种数字图像技术，可以利用这种技术来提升数字图像的色彩以及对比度的范围。

和SDR（*Standard Dynamic Range*：标准动态范围）相比，HDR具有如下特点：
* 更宽的色彩范围
* 更亮的亮度上限
* 更黑的亮度下限
* 在对比度、灰度分辨率等维度上对影像质量上进行了整体提升

从而，HDR可以给用户带来更具沉浸式的感受。

HDR技术可以应用于拍照（*photography*）和视频（*video*），但是需要注意的是：虽然`photo HDR`和`video HDR`的目标都是让我们所看到的数字内容更逼近人眼的真实体验，但是这两者确实是完全不同的两个概念。本质上讲，`photo HDR`是一个相机捕获照片（*capture*）的过程，而`video HDR`则是一个显示(*display*)的过程。[^1]

## 光度学概念及单位
在进一步介绍HDR之前，我们需要先了解一些[光度学](http://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=AB4FAB66987D97573EA90F4DD56ABA36)的相关概念，以便能够能够对HDR有更好的理解和认识。

* **辐射通量**：在光辐射测量学中，使用的基本物理量是`辐射通量`或`辐射功率`，符号表示为：$\Phi_{e}$，单位是瓦特（$W$）。辐射通量由一个辐射源发出，并通过某种传播介质进行传输并在某种表面上接收该辐射通量。

* **光通量**：`光通量`是指按照国际规定的标准人眼视觉特性评价的辐射通量的导出量，也就是对`辐射通量`的光度量，其符号为：$\Phi_{v}$。可以从`辐射通量`来导出`光通量`。

* **光量**： `光量`也称为`光能`，指的是在给定的时间间隔（$\Delta t$）内，`光通量`的时间积分，符号表示为：$Q_{v}$，且$Q_{v}=\int_{\Delta t}{\Phi_{v} \cdot dt}$。

* **发光强度**：`发光强度`（$I_{v}$）为光源发出的并且在指定方向的立体角元$d \Omega$内传播的光通量$d \Phi_{v}$与该立体角元$d \Omega$的商，即：$I_{v}=\frac{d \Phi_{v}}{d \Omega}$。`发光强度`的单位为`坎德拉`（$cd$）。坎德拉是发射出频率为$540 \times 10^{12} Hz$的单色辐射的光源在指定方向上的发光强度，并且该光源在该方向上的辐射强度为$\frac{1}{683} W \cdot sr$。

* **光亮度**： `光亮度`（$I_{v}$）指在某方向上单位投影面积的面光源沿该方向的`发光强度`。面光源上小面元的面积为$dA$，某一方向与面元法线的夹角为$\theta$，面元沿这个方向的投影面积为$dA \cdot cos \theta$，则面元沿这个方向的光亮度为：$\frac{I_{v}}{dA \cdot cos \theta}$，即$I_{v}=\frac{d \Phi_{v}}{dA \cdot cos \theta \cdot d \Omega}$。由此可知，`光亮度`的单位为$cd/m^{2}$（坎德拉/平方米），又称为`尼特`。例如，iPhone12的屏幕的光亮度为：625 尼特最大亮度 (典型)，1200 尼特最大亮度 (HDR)。

## photography HDR
可以通过同时捕获不同曝光度的多张图像的方法来生成HDR照片。相机会使用不同的曝光值快速拍摄三张或更多的照片，然后对其进行处理，以生成一张HDR照片。

在拍摄高对比度场景的照片时，HDR图像处理非常有用。

如下图的夜景所示，例如，曝光度太低时，会让后面的景色显得暗淡。如果调整曝光以显示后面的景色，则前面的景色又会太亮，甚至可能会完全变白。通过组合多次曝光，则可以平均这些不同的曝光，使的后面的景色可以出现在照片上，而又不会过度曝光前面的景色。[^2]

![](EVDifferent.png)

![](EVToneMapping.png)

目前，很多智能手机（例如iPhone）的相机都具有HDR选项。我们可以选择让相机：
* 开启HDR（ON）
* 关闭HDR（OFF）
* 自动判断是否开启HDR（Auto）

对于Auto模式，相机仅在高对比度的情况下才拍摄HDR照片。大多数相机还会在合成HDR照片时，同时捕获普通照片，从而允许我们可以在HDR照片和普通照片之间进行选择。

### dodging and burning和tone mapping
实际上，在胶片时代，摄影师就会拍摄多张不同曝光程度的底片，并在[暗房](https://baike.baidu.com/item/%E6%9A%97%E6%88%BF/62291)中使用一种**[dodging and burning](https://en.wikipedia.org/wiki/Dodging_and_burning)**的手法，把数张底片合成为一张具有高动态范围的照片。随着数码相机的出现，HDR将暗房里的技术引入相机成像传感器，通过对同一个场景进行多种不同的曝光，然后对其进行合成，最终实现增强照片动态范围，达到增加照片层次感的目的。在照片HDR中，这种合成技术称之为[色调映射（*tone mapping*）](https://en.wikipedia.org/wiki/Tone_mapping)。当然，在接下来的`video HDR`中也会用到色调映射技术，不同的是，`video HDR`中的色调映射是用来将HDR内容映射到SDR显示设备，使得SDR设备也能显示HDR内容。

## video HDR
HDR视频的捕获方式与HDR照片类似。同时以不同的曝光（或不同的ISO配置）来录制每个镜头。然后把这些镜头融合在一起以生成单个镜头。尽管会产生看起来不真实的灰色效果，但这种方法通常可以使视频更亮。因此，HDR视频通常会在发布之前进行后期处理。

为了正确的显示HDR视频，显示设备也必须支持HDR。例如，具备HDR功能的电视必须支持特定的视频输出标准。这些标准中会涉及：10-bit色彩和至少覆盖90％的DCI-P3色彩空间。HDR显示器还必须支持特定的HDR格式，例如HDR10，Dolby Vision或Hybrid Log Gamma（HLG）。

![](color_space.jpg)

CIE 1931 xy 中各个色彩空间的对比

以HDR10为例，因为HDR10标准使用广色域`Rec.2020`，10-bit色深以及`SMTPE ST 2084`PQ转换函数，因此在一台非HDR显示设备上去显示HDR10的内容，则会出现两种情况[^3],[^4]：
* 无法解码导致花屏
* 可以解码，但是因为影片中的高亮部分会按照显示设备的最高亮度来显示而导致影片整体变灰

这也就是HDR照片和HDR视频的不同之处：HDR视频除了视频捕获之外，对显示设备的能力有较强的依赖。

#### PQ & HLG
为了正确显示HDR图像，仅仅提高亮度是不够的，以一种与人类视力相匹配的方式显示色彩和色调至关重要。色彩和色调受伽玛`输入-输出`特性的影响。在HDR中，伽玛曲线有两种，分别是PQ和HLG。

* PQ伽玛曲线基于人类视觉感知的特征，并且最适合于在互联网上制作电影或串流视频的内容，其中再现准确性是关键。
* HLG伽玛曲线旨在允许在现有的SDR电视上显示而不会看不到位置，并且最适合于广播电视和直播视频馈送。

PQ和HLG的具体区别如下表所示：
| | PQ (感知量化) | HLG (混合对数伽玛) |
| --- | --- | --- |
| 目标 | 互联网视频流，电影 | 广播电视，直播视频 |
| 优点 | 处理亮度的绝对值高达 10,000 cd/m²，基于人类视觉感知的新伽玛曲线 | 将亮度处理为相对值（与现有标准相同）兼容SDR电视 |
| 最大亮度 | 1,000 cd/m² 绝对值 一致，不管显示装置 | 相对值，因显示设备而异 |
| 黑色等级 | 0.005 cd/m2或更低 | 0.005 cd/m2 或更低 | 
| 提议者 | Dolby | BBC 和 NHK |
| 参考标准 | SMPTE ST 2084、ITU-R BT.2100 | ITU-R BT.2100 |
| 在SDR显示设备上的效果 | Poor | 良 |
| 直播效果 | 良 | 优 |


## HDR标准
#### HDR10
#### DOLBY VISION
#### HDR10+
#### UHD Premium
#### DisPlayHDR
#### Mobile HDR
#### CUVA HDR
#### VESA HDR

## 手机对HDR的支持
#### iPhone
iPhone 12 Pro对于杜比视界的全方位支持，可以说是凭借着一己之力，将一项最先进，最前卫的HDR技术，带到了普罗大众的眼前。作为第一部支持HDR拍摄的手机，iPhone 12的Dolby Vision HDR拍摄是如何实现的？真的如宣传所说的那么牛吗？

或许我们能够从这位拥有5年HDR调色和教学经验的专家Samuel Bilodeau撰写的这篇评测中找到答案。作者在评测的最后说：我特别兴奋和开心的看到iPhone和其他具有HDR拍摄功能的消费级相机的出现，并推动着HDR向前迈了一步。

{% bilibili 289414701 %}

## FFmpeg分析HDR内容
#### ffprobe分析HDR内容的元数据
可以使用ffprobe命令来提取`Mastering Display`和`Content Light Level`的元数据。我们只需要提取第一帧的相关数据即可，因此，在分析时，可以使用[`-read_intervals "%+#1"`](http://ffmpeg.org/ffprobe.html#Main-options)选项，让ffprobe只提取第一帧的元数据。具体分析名利如下所示：

```shell
ffprobe \
-hide_banner \
-loglevel warning \
-select_streams v \
-print_format json \
-show_frames \
-read_intervals "%+#1" \
-show_entries "frame=color_space,color_primaries,color_transfer,side_data_list,pix_fmt" \
HDR.mp4
```
各选项的含义如下：
* -hide_banner -loglevel warning：不显示我们不需要的信息
* -select_streams v：只选择视频流来分析
* -print_format json：以json格式输出分析结果
* -read_intervals "%+#1"：只分析第一帧中的数据
* -show_entries ... ：只输出我们指定的数据

命令执行后，会显示如下的分析结果：
```json
{
    "frames": [
        {
            "pix_fmt": "yuv420p10le",
            "color_space": "bt2020nc",
            "color_primaries": "bt2020",
            "color_transfer": "smpte2084",
            "side_data_list": [
                {
                    "side_data_type": "Mastering display metadata",
                    "red_x": "34000/50000",
                    "red_y": "16000/50000",
                    "green_x": "13250/50000",
                    "green_y": "34500/50000",
                    "blue_x": "7500/50000",
                    "blue_y": "3000/50000",
                    "white_point_x": "15635/50000",
                    "white_point_y": "16450/50000",
                    "min_luminance": "40/10000",
                    "max_luminance": "11000000/10000"
                }
            ]
        }
    ]
}
```

如上所示，ffprobe分析结果中的颜色值以及最大/小亮度值均为一个比值，颜色值的最终结果会确定母版内容所用的颜色空间，而最大/小亮度值则确定了母版内容的动态范围。

根据如上的结果，我们可以知道，在CIE坐标上，红色，绿色，蓝色以及白点的坐标分别是：
* red: (0.68, 0.32)
* green: (0.265, 0.69)
* blue: (0.15, 0.06)
* white point: (0.3127, 0.329) 

从[DCI-P3](https://en.wikipedia.org/wiki/DCI-P3)的相关信息可知，该视频的母版内容在制作的时候采用的是`P3-D65 (Display)`颜色空间，其最小亮度为0.004尼特，最大亮度为1100尼特，对比度为275000。

#### FFmpeg转码HDR内容
对于HDR视频的转码时，需要将`Mastering Display`和`Content Light Level`元数据的内容传递给编码器（注意，不是传递给FFmpeg），否则，在转码的过程中会丢失这些信息，进而导致转码对画面内容的影响。具体的方式如下所示：

```shell
ffmpeg  -i hdr.mp4 \
-map 0 -c:v libx265 \
-x265-params hdr-opt=1:repeat-headers=1:colorprim=bt2020:transfer=smpte2084:colormatrix=bt2020nc:master-display=G(13250,34500)B(7500,3000)R(34000,16000)WP(15635,16450)L(11000000,40) \
-crf 20 \
-preset veryfast \
-pix_fmt yuv420p10le \
test.mp4
```

其中，
* hdr-opt=1: 表示我们要启用HDR
* repeat-headers=1: 表示每一帧都需要这些数据
* colorprim, transfer and colormatrix: 和ffprobe保持一致
* master-display: 根据ffprobe的结果来构造的颜色字符串

## 相关术语
#### Color Calibration of Screens（屏幕的色彩校正）
用于确保屏幕上色彩被准确显示的一个过程。一般使用色度计来测量一块显示屏的原生色彩响应，之后计算一个用于修正的指标以确保颜色能正确地显示在该显示器上，最后对经过修正后的响应进行检测。

#### Color Spaces（色彩空间）
一个色彩空间可以指一种颜色的组织方式，也可以指某个特定范围的色彩。在影院和电视的领域，我们一般使用 RGB（用红、绿、蓝原色分量来表示一个颜色）或者 YUV（用一个颜色的明度（黑白值），以及它的基于色彩成分差值所计算的色度值）色彩空间（译者注：RGB 和 YUV 为色彩模型，非色彩空间，此处原文有错误）。这些色彩空间一般基于特定的显示设备特性，参见 D65-P3 词条。其它的色彩空间，比如 XYZ 或者 Lab 更适用于表示人眼色彩视觉模型。

#### Contrast Ratio（对比度）
对比度是一个系统所能产生的最亮（白）部分和最暗（黑）部分之间的明度比值，通常用一个 n:1 的比值描述。

#### CRI Color Remapping Information（色彩重映射信息）
一套通过分析相同内容的两份不同母版（如 HDR 和 SDR 母版）所产生的标准元数据。当一份母版（如 HDR）和 CRI 元数据被一同传输时，解码器在面对 HDR 屏幕时可以仅解码 HDR 内容，而在面对 SDR 屏幕时也可以通过利用 CRI 元数据的方式将 HDR 内容变换成 SDR 内容。采用这一方案的主要优势在于对于两个解码后的版本，作者的创作意图得以保留。CRI 是 MPEG（HEVC v2）的标准成分之一，并且对于 Ultra HD Blu-ray 制作是可选功能。

#### DCI-P3，D65-P3，ST 428-1
一个数字电影色彩空间。DCI-P3 色彩空间是一个 2005 年由数字影院联盟（Digital Cinema Initiatives）引入的 RGB 色彩空间，并由 SMPTE ST428-1 于 2006 年标准化。

这一色彩空间拥有远比 sRGB（参见 Rec.709）宽广得多的色域。

所有的数字电影放映机都能完整显示 DCI-P3 色彩空间，D65 P3 指的是其白点的色温由 DCI 白点改为 D65 白点。

图中的三个三角形展现了：最大的是 Rec.2020 标准，Ultra HD TV 的新标准（目前只有激光显示能完整实现），略小的、用于数字电影的 DCI-P3，以及传统视频监视器、高清广播电视、蓝光、OTT 所采用的最小的 Rec.709 色彩空间。

#### EDID 扩展显示标识数据
EDID 是扩展显示标识数据（Extended Display Information Data）的缩写，这个标准由 Consumer Technology Association（CTA）制定。这是由每个 DVI 显示器、HDMI 显示器，或其它支持 DVI HDMI 输入的设备（aka DVI/HDMI Sinks）所提供的。可能每个 DVI/HDMI 输入都有自己的 EDID。EDID 会告诉设备它所连接的显示器的性能特征。

源设备确认显示器的 DVI 或者 HDMI 接口是否存在 EDID 存储器（EDID memory）并使用其中的信息优化输出的视频（分辨率、帧率、色彩……）和/或音频格式。所有支持 DVI/HDMI 标准输入的设备，即 TMDS 接收端（DVI/HDMI Sinks）必须实现 EDID。

#### EOTF 电光转换函数
EOTF 是 Electro-Optical Transfer Function 的缩写。他是一个映射码值到显示亮度的数学函数。换言之，一个 ETOF 定义了图像中的码值如何被显示器或者投影仪显示为可见光。

参见 OETF 光电转换函数，ST2084。

#### OETF 光电转换函数
OETF 是 Opto-Electronic Transfer Function 的缩写。它是一个映射场景明度（某个场景的光）与可传输压缩的数字编码值之间的数学函数映射关系。这个术语一般用于获取图像的设备，比如数字相机。

在后期制作中，内容一般在某个拥有特定 EOTF 的屏幕上进行调色，历史上，常用一个OETF 的逆函数作为屏幕的 EOTF。

#### OOTF 光光转换函数
OOTF 是 Optical-to-Optical Transfer Function 的缩写。它是一个把相机所拍摄的场景亮度映射到显示器亮度的数学函数。

#### Flicker 闪烁
部分特定种类的显示器的特征，比如老的阴极射线管显示器（CRT），或者调教得很糟糕的平板显示器，甚至电影（motion picture film）放映机这一不受欢迎的亮度改变主要在频率低于 50 帧每秒时可见。对于亮度更高的显示器来说，人眼能感受到更高频率的闪烁。

#### f-stop of Dynamic Range 动态范围的 f 制光圈档数
在摄影中，一档 f 制光圈的改变对应双倍（或减半）捕获图像时所捕捉的光。

一张图片中所包含的 f 制光圈数量描述了这张图片的对比度（2^N 标记）比如一台相机可以输出 10 档的图像，这意味着对比度可以高达 2^10（1024：1），即白色部分会比黑色部分亮 1024 倍。相比之下，人眼可以达到 18-20 档（这是一个很高的动态范围 HDR，一般的 SDR 视频图像是 6-7 档）

#### Gamut or Color Gamut 色域
在包括但不限于计算机图形和摄影领域的色彩还原过程中，色域是某个特定的色彩的子集。

色域一词最常见的用途是指某个范围内可以被准确反应的色彩子集，这个前提可能是某个特定的显示设备或某个给定的色彩空间。色域一般使用 CIE 1931 色度图上的面积来表示，CIE 1931 曲线的边缘代表可见光光谱颜色的范围。

#### Gamut Mapping 色域映射
在几乎所有的转译过程（指的是对于某个特定颜色的表示，在不同色彩空间中的转换过程）中，我们必须面对不同设备的色域所覆盖的范围是有所不同的现实，这使得准确还原色彩是不可能的。

因此，对于靠近色域边缘的部分是有必要进行一些处理的。有些颜色必须被移入色域中，不然它们在输出设备上无法被显示，它们会被粗暴地舍弃（clipped）掉。这就是所谓的色域不匹配，比如说当我们将更广的 RGB 色彩空间转换到 CMYK 色彩空间的时候就会出现。

色彩管理系统可以使用多种方法来实现所需的结果并且给予有经验的用户控制色域映射的的方式。

#### IMF 可交互母版文件
Interoperable Master Format（IMF）是一个由 SMPTE 提供的标准，用于实现一个单文件的、可交换使用的母版文件格式和结构，用于全球范围内的商业内容分发。它是由 Digital Cinema Package（DCP）架构进化而来的，DCP 为分发渠道提供了一个完整的文件可交换单元。IMF 可以说是一个革命性的进步，IMF 提供了一个真正的基于文件的最终母版。DCP 针对的是影院内容分发，而 IMF 为商用环境提供了一个可以基于同一内容为不同的观众创建多种剪辑版本的母版格式。

#### Inverse Tone Mapping (ITM) 逆影调映射/反向影调映射
对于 SDR 内容的母版重制从而实现 HDR 内容。

ITM 使用 SDR 内容并且扩展其明度和色彩空间，使其匹配 HDR 显示器的能力，并且保留原本内容创作者的意图。

#### LUT 查找表
是 Look Up Table 的缩写。LUT 提供了一种对输入的数据施加复杂数学运算的高效方式———如果不使用 LUT 则会耗费许多的计算资源。因此，它们是一种将图像从一个色彩空间映射到零一个色彩空间的理想实现方法。

存在以下的 LUTs：

3D LUTs，每个像素的输出 R’、G’、B’ 值是由输入像素的 R、G、B 值共同计算的。

1D LUTs，输出的 R’ 只由输入的 R 值计算，G’、B’ 同理。它们一般被用于 gamma 函数和其它 EOTF 的施加矫正，一般在消费级电子设备的芯片组中出现。

3D LUT 相较于 1D LUT 而言，它支持更加强大的数学转换，但在芯片组里部署起来更复杂且更昂贵。一般 3D LUT 被用于在后期制作过程中施加创造性的“风格”以及色彩空间的转换。

#### MaxCLL Metadata MaxCLL 元数据
Maximum Content Light Level（MaxCLL）是一个整数类型的元数据值，用于定义某个编码的 HDR 视频流或者文件中，任意一个像素的最高亮度，单位是 nits。MaxCLL 可以在母版制作过程中或者制作过程后来测量，但是为了保证 HDR 显示器在 MaxCLL HDR 范围里的色彩过渡，并且在显示器的最大亮度外施加一个硬 clip，显示器的 MaxCLL 也可以被用作 MaxCLL 元数据。

#### MaxFALL Metadata MaxFALL 元数据
Maximum Frame Average Light Level（MaxFALL）是一个整数类型的元数据值，用于定义某个编码的 HDR 视频流或者文件中，任意一帧画面的最高的平均亮度，单位是 nits。MaxFALL 是通过计算每一帧画面解码后的所有像素的亮度的平均值来获取的。

#### Peak Code Value 峰值编码值
Peak Code Value 指的是通过某一个系统组件而不产生硬剪（clip）的最大数字编码值。

#### Peak Display Luminance 峰值显示亮度
一个显示器所能产生的最高亮度。

#### Perceptual Quantizer 感官量化曲线
Perceptual Quantizer 的缩写，它是一个 EOTF。

MovieLabs 提出了一条基于 Barton Curve，并可被用于高动态范围（HDR）的数学曲线，于 2014 年由 SMPTE 制定了 ST2084 标准。

Perceptual Quantization 是一个高效率的编码 HDR 明度信息的方式。在整个动态范围中，每一对相邻的编码值区别都比可感知的区别略小，使得码值利用率极高。

但是，这一 EOTF 并不兼容传统显示器（legacy display），PQ 编码的信号只能在新的、支持 HDR 的设备上被解码。

PQ 为 10bit 或者 12bit 内容所设计，且根据 SMPTE ST2084 标准，不推荐在实时广播时使用它。

#### Quantum Dot（QD）Displays 量子点显示器
量子点显示器使用了纳米尺度（2nm-10nm）的晶体“点”。每一个点会发出一个不同的纯色，而它们所发出的颜色取决于它的尺寸。

在 LCD 背光前加入一张带有量子点的薄膜（film），图像的色彩还原和总体的亮度可以被显著提高。

这些微小的纳米晶体可以在背光到达红、绿、蓝子像素前改变背光的光谱，实现高达 20-30% 的色域提升，使得显示设备的色彩可以更接近 Rec.2020 目标色域。

#### ST2084
SMPTE 标准中定义的用于制作 HDR 内容母版所用的 EOTF。该 EOTF 又被称为 PQ，主要用于制作非广播内容的母版。

#### ST2086
SMPTE 标准中定义的用于描述制作视频母版所使用的显示器的绝对色彩空间的元数据（基色坐标、白点、亮度范围）。

#### Tone Mapping/Tone Mapping Operator（TMO） 色调映射/色调映射运算符
色调映射是一种用于图像处理和计算机图形的技术，它被用于将一组颜色映射到另一组颜色，从而在具有更有限动态范围的介质中实现逼近高动态范围（HDR）图像的观感。 打印输出，CRT或标准动态范围（SDR）监视器和投影仪都具有较低的动态范围，不足以再现HDR图像中存在的全部光强。色调映射解决了从记录范围到可显示范围的对比度剧烈降低的问题，同时保留了图像细节和色彩表现，这对于欣赏原始场景内容和保留创作意图是重要的。一般使用色调映射运算符（Tone Mapping Operator）执行该色调映射过程，通常为“S”形曲线以实现高光和阴影细节的柔和过渡。参见 Inverse Tone Mapping（ITM）。

#### Wide Color Gamut（WCG） 广色域
Wide Color Gamut 的缩写，意为广色域。广色域包括了比 Recommendation ITU-R BT.709 更饱和的色彩，比如说被 Rec.2020 所定义的色彩空间就属于广色域。

#### White Point 白点
白点（通常在技术文档中被称为参考白 reference white 或目标白 target white）是一组用于定义图像采集，编码或再现中的“白色”颜色的色度坐标。根据应用，需要不同的“白色”定义以提供可接受的结果。例如，在室内拍摄的照片可能用白炽灯照明，白炽灯比日光相对偏橙。 因此，大多数专业相机拥有在白炽灯照明与日光下拍摄所用的不同设置。同样，为 D65 白点显示器所生产的图像在具有不同白点的显示器上将无法被正确显示。

CIE 定义 D65 常被用来定义视频显示器的白点。

D55 曾是胶片投影的标准白点，DCI 白点（译者注：接近 D63，但更绿）和 D60 白点这两个白点均被数字电影广泛使用。

> 
> 更多术语可以参考：[**Quick Reference HDR Glossary**](/shares/hdr-field-guide-final-web.pdf)
> 

## 参考资料
1: https://www.cnet.com/news/hdr-for-cameras-vs-hdr-for-tvs-whats-the-difference/
2: https://en.wikipedia.org/wiki/High-dynamic-range_imaging
3: https://en.wikipedia.org/wiki/High-dynamic-range_video
4: https://www.zhihu.com/question/19774840/answer/998271233
5: https://alliance.experienceuhd.com/uhd-premium-features
6: https://www.experienceuhd.com/uhd-mobile-hdr-premium-features
7: http://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=AB4FAB66987D97573EA90F4DD56ABA36
8: http://www.cuva.org.cn/ueditor/php/upload/file/20200904/1599186578364054.pdf
9: https://zhuanlan.zhihu.com/p/345169019
10: [What Is HDR: Concepts, Standards, and Related Aspects](https://www.videoproc.com/resource/high-dynamic-range.htm)