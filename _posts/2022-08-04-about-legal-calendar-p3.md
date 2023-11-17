---
layout: single
title: "关于历法的一系列知识整编 - P3"
date: 2022-08-04 05:00:00 +0800
last_modified_at: 2022-08-04 07:50:00 +0800
Author: hedzr
tags: [c++17,timer,ticker,timing,lunar,calendar]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/800px-World_Time_Zones_Map.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  历法知识整编 依赖于天文的时间标准...
---


> [历法知识整编索引页](https://hedzr.com/c++/algorithm/about-legal-calendar/)

> 摘抄、整编，已尽力罗列来源。


## 与地球自转相关的时间标准

### 回顾

世界上第一个授时系统以日晷为根据，量度的时间为视太阳时。

由于地球轨道并非圆形，其运行速度又随著地球与太阳的距离改变而出现变化，因此视太阳时欠缺均匀性。视太阳时同时亦受到地球赤道面与轨道面倾斜度的影响，因此必须采用一种较有均匀性的平太阳时。在格林尼治子午线的平太阳时称为世界时﹝UT0﹞，又叫格林尼治平时﹝GMT﹞。

随著较为精确的时钟面世，天文学家发觉在不同地点量度的世界时出现差别。稍后发现这种差别是由于地轴摆动而引起的。各地天文台详细测量了地轴摆动对世界时的影响后，制定了一种称为 UT1 的新时标将这种影响删除。

在摆钟及石英钟的精确度进一步改进后，又发觉 UT1 具有周期性变化，这种变化是由地球自转率的季节性变动引起的。上述影响经矫正后，便可得到更加有均匀性的 UT2 时标。天文学家为了避免矫正以上的困难，根据地球环绕太阳旋转建立另一种时标，称为历书时。但这种时标却不适合于一般应用，因为用来制定时标的天文观测费时并带来延误。

原子频率标准的研究显示，「秒」的定义或者可能以另外一种基础作为依据。结果 1967 年的第十三届国际度量衡会议上通过了一项决议，采纳以下定义代替「秒」的天文定义：

- 「一秒为铯﹝133﹞原子基态两个超精细能级间跃迁辐射 9 192 631 770 周所持续的时间。」

原子时标的准确度为每日数纳秒，而世界时的准确度则为数毫秒。国际原子时标是原子时的国际参照时标，根据以上「秒」的定义，用国际单位制﹝SI﹞制定。国际原子时标是一种连续性时标，由 1958 年 1 月 1 日零时零分零秒起，以日、时、分、秒计算。

一种称为协调世界时的折衷时标于 1972 年初改用新的基准，使协调世界时 1972 年 1 月 1 日零时零分十秒与指示同一时刻的国际原子时准确地重叠。从协调世界时减去 0.107 757 7 秒便可达到以上目的。由 1972 年 1 月1 日开始协调世界时每一秒的持续时间缩短约 30 纳秒，以便与国际原子时标的一秒相符，为了确保协调世界时与世界时﹝UT1﹞相差不会超过 0.9 秒，所以便在协调世界时内引进「闰秒」的概念。更由于国际原子时现较协调世界时为快，所以引进的都属于正闰秒。虽然协调世界时与国际原子时之间会出现若干整数秒的差别，但两者的秒的记号却会永远重叠。

国际度量衡局及国际地球自转事务中央局负责协调国际间的时间与频率标准。根据国际协议，所有协调世界时时标与这两个机构操作的协调世界时时标相差不应超过一毫秒，结果便出现了一种均匀的世界时间系统：不同国家的时间相差祇有数微秒。在这两个国际机构的协调之下，若干国家研究机构负责操作基本时间标准并提供国际性授时服务，例如日本邮政省通信总合研究所。

### 恒星时

恒星时是根据恒星的[周日視運動](https://zh.wikipedia.org/wiki/周日視運動)而建立的时间基准。在这一时间基准中，[春分点](https://zh.wikipedia.org/wiki/春分点)连续两次经过某地[上子午圈](https://zh.wikipedia.org/wiki/上子午圈)的时间间隔被称为一个[恒星日](https://zh.wikipedia.org/wiki/恒星日)，长度约为23时54分04秒，其他的时间单位（如时、分、秒等）再由恒星日划分而得。其中，根据真春分点的运动定义的恒星时被称为真恒星时（又称视恒星时，英語：Apparent Sidereal Time，缩写：AST）。但受到地球[章动](https://zh.wikipedia.org/wiki/章动)的影响，真春分点的运动速率存在变化，由此定义出的真恒星时并非稳定的时间系统。因此，可以取真春分点的平均运动状态定义出匀速运动的平春分点，并由平春分点定义出平恒星时（英語：Mean Sidereal Time，缩写：MST）。真恒星时和平恒星时的差别在0.8－1.2秒之间。

在天文观测中，恒星时在数值上与春分点相对于本地子午圈的[时角](https://zh.wikipedia.org/wiki/時角)相等。对于不同位置的测站，其观测到的恒星时也并非相等。以[格林尼治天文台](https://zh.wikipedia.org/wiki/格林尼治天文台)观测到的恒星时，即格林尼治恒星时（英語：Greenwich Sideral Time，缩写：GST）为基准，其他测站观测到的地方恒星时（英語：Local Sidereal Time，缩写：LST）与格林尼治恒星时之间的差异即为测站的[天文经度](https://zh.wikipedia.org/w/index.php?title=天文经度&action=edit&redlink=1)

LST - GST = ℷ

由于对恒星的测量较对太阳的测量精度更高，在天文观测中亦常以恒星时作为时间标准。

### 太阳时

与恒星时类似，太阳时是根据太阳的[周日視運動](https://zh.wikipedia.org/wiki/周日視運動)而建立的时间基准，一个太阳日被定义为太阳连续两次经过某地[上子午圈](https://zh.wikipedia.org/wiki/上子午圈)的时间间隔。类似地，根据真太阳的运动定义的太阳时被称为真太阳时，其速率受到地球公转速度的不均匀性以及[黄道面](https://zh.wikipedia.org/wiki/黄道面)与[赤道面](https://zh.wikipedia.org/wiki/赤道面)的偏差的影响。因此，亦可取一个在赤道面上运动，且运动速率等于真太阳在赤道上的运动速率分量的平均值的理想模型作为“平太阳”，并根据平太阳的运动定义出平太阳时。真太阳时与平太阳时之间的偏差又被称为[均時差](https://zh.wikipedia.org/wiki/均時差)，其数值在-14分24秒至+16分21秒间变化，变化的周期为一年。

#### 民用时

[民用時](https://zh.wikipedia.org/wiki/民用時)亦是根据平太阳时建立的时间基准，最早由[英国航海天文历](https://zh.wikipedia.org/w/index.php?title=航海天文历&action=edit&redlink=1)自1925年起使用。这一时间基准在平太阳时的基础上后移了12小时，使其参考时刻由[正午](https://zh.wikipedia.org/wiki/正午)移至[子夜](https://zh.wikipedia.org/wiki/子夜)，更符合民用习惯。有时也直接将该民用时直接称为平太阳时。



#### 世界时（UT）

[世界时](https://zh.wikipedia.org/wiki/世界时)是[本初子午線](https://zh.wikipedia.org/wiki/本初子午線)上观测到的民用时，也称[格林尼治標準時間](https://zh.wikipedia.org/wiki/格林尼治標準時間)。现有的世界时有 UT0、UT1 和 UT2 三种。其中，UT0 是通过天文观测得到的、未经改正的世界时，包含了[極移](https://zh.wikipedia.org/wiki/極移)现象给测站位置的变化带来的影响。将测站位置归算到以[协议地球极](https://zh.wikipedia.org/w/index.php?title=协议地球极&action=edit&redlink=1)为极点的[协议地球坐标系](https://zh.wikipedia.org/wiki/协议地球坐标系)中，即在UT0上加以极移改正 *Δλ* 之后，得到的世界时被称为为 UT1。UT2 则是在 UT1 的基础上再增加了地球自转速度的季节性改正 *ΔT*：

UT1 = UT0 + Δλ

UT2 = UT1 + ΔT

除此而外，在 UT1 基础上进行潮汐修正后还促使一个被称为 UT1R 的世界时。



#### 格林尼治标准时间（GMT）

格林尼治标准时间（Greenwich Mean Time, GMT）是英国伦敦格林尼治 当地的平太阳时，以平子夜作为0时开始。

历史上格林尼治标准时间的定义和计算较为混乱。比如，天文学领域常以正午12时作为格林尼治标准时间开始的计算方法，也有地方将其作为协调世界时UTC+0的别名。在导航领域，GMT常常被认为与UT1等同。正因为如此混乱的定义与使用，格林尼治标准时间不可以被单独作为精确的时间标准。

1935年，国际天文学联合会推荐使用“世界时”一词，作为比格林威治标准时间更精确的术语，用以指代以平子夜作为0时开始的格林尼治标准时间。但在一些应用中（英国广播公司国际频道、英国气象局、英国皇家海军、中东广播中心等），格林威治标准时间一词在民用计时方面一直沿用至今。



## 与天体运动相关的时间标准

### 历书时

历书时（英語：Ephemeris Time，缩写：ET）是建立在[牛顿力学](https://zh.wikipedia.org/wiki/牛顿力学)上的均匀的时间基准，亦称为牛顿时（英語：Newtonian Time），是力学时的一种。1948 年，美国天文学家[杰拉德·莫里斯·克莱门斯](https://zh.wikipedia.org/w/index.php?title=杰拉德·莫里斯·克莱门斯&action=edit&redlink=1)提出建立历书时以避免世界时中因[日长变化](https://zh.wikipedia.org/w/index.php?title=日长变化&action=edit&redlink=1)造成的不均匀性，更准确地描述[天体](https://zh.wikipedia.org/wiki/天体)的运动。历书时在 1952 年－1976 年间被[国际天文联合会](https://zh.wikipedia.org/wiki/国际天文联合会)采用为天文计算中的时间标准，并在 1956 年－1967 年间同时作为[国际单位制](https://zh.wikipedia.org/wiki/国际单位制)中的时间标准。历书时的时间间隔以秒为基本单位，一秒被定义为 1900 年 1 月 0.5 日所对应的[回归年](https://zh.wikipedia.org/wiki/回归年)长度的 1/31 556 925.9747；其起始时刻则被定义为世界时中的 1900 年 1 月 0 日 12 时。在历书时中，秒长的定义不随时间而变化，因此历书时的时间长度是严格一致的。

历书时的维持方式是将观测得到的天体位置与历书时计算得到的[星历表](https://zh.wikipedia.org/wiki/星曆表)进行比较，实际中的观测对象则是[月球](https://zh.wikipedia.org/wiki/月球)的运动。由于计算中使用的月球星历的改动，根据这些星历求得的历书时被分为 ET1、ET2 和 ET3 三个版本，这就使得不同版本的历书时出现了不连续的问题。在 1967 年，[国际单位制](https://zh.wikipedia.org/wiki/国际单位制)采用的时间标准由历书时变为原子时。后在 1976 年，国际天文联合会也决定自 1984 年起以力学时取代历书时。

### 相对论力学时

#### 地球力学时与质心力学时

- **[地球力學時](https://zh.wikipedia.org/wiki/地球時)**（法語：Temps Dynamigue Terretre，缩写：TDT）建立在[国际原子时](https://zh.wikipedia.org/wiki/国际原子时)的基础上，其秒长与国际原子时的秒长相等，起始时刻则被定义在历书时的1977年1月1日0时（[JD](https://zh.wikipedia.org/wiki/JD) 2443144.5 ），以保证力学时系统和历书时系统的连续性。地球力学时的提出是为了弥补[牛顿力学](https://zh.wikipedia.org/wiki/牛顿力学)框架下定义的时间基准的不足。从定义上看，地球力学时也可被视作是在[大地水准面](https://zh.wikipedia.org/wiki/大地水准面)上实现的、与[国际单位制](https://zh.wikipedia.org/wiki/国际单位制)的秒长相一致的理想原子时。在1991年召开的第21届国际天文联合会大会上，地球力学时被重新命名为地球时（英語：Terrestrial Time，缩写：TT）。地球时继承了起始时刻历书时与国际原子时的不一致性，其与国际原子时的转换关系如下：

  TT - TAI = 32.184s

- **[质心力学时](https://zh.wikipedia.org/w/index.php?title=质心力学时&action=edit&redlink=1)**（法語：Temps Dynamigue Barycentrigue，缩写：TDB）的定义与地球力学时类似，所不同的是质心力学时是在解算太阳系质心坐标系统中的运动方程时被使用。在定义质心力学时的时候，为了使质心力学时和地球时之间不出现较大的差异，国际天文联合会要求两个时间系统的只存在周期项而非长期项的差别，具体的定义公式如下：

  ![image-20220604075429103](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220604075429103.png)

#### 地心坐标时与质心坐标时

- **[地心坐标时](https://zh.wikipedia.org/w/index.php?title=地心坐标时&action=edit&redlink=1)**（法語：Temps Coordinate Geocentrigue，缩写：TCG）是与地球质心处在相同时空框架下的时间基准，与[地球重力场](https://zh.wikipedia.org/w/index.php?title=地球重力场&action=edit&redlink=1)所产生的相对论效应无关，在对地球的[岁差](https://zh.wikipedia.org/wiki/岁差)和[章动](https://zh.wikipedia.org/wiki/章动)、[人造卫星](https://zh.wikipedia.org/wiki/人造卫星)与[月球](https://zh.wikipedia.org/wiki/月球)轨道的计算中作为独立变量出现。通俗地说，地心坐标时是摆放在地球质心的时钟所标示的时间。地心坐标时与地球时的转换关系如下，其中比例系数 ![image-20220604075542024](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220604075542024.png)：

​			![image-20220604075555878](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220604075555878.png)

- **[质心坐标时](https://zh.wikipedia.org/w/index.php?title=质心坐标时&action=edit&redlink=1)**（法語：Temps Coordinate Barycentrigue，缩写：TCB）的定义与地心坐标时类似，不同的是质心坐标时所处的时空框架位于太阳系的质心。质心坐标时进一步消除了太阳和其他行星的引力场带来的相对论效应以及地球的[公转运动](https://zh.wikipedia.org/wiki/公转)带来的相对论效应，在编制行星星历时作为独立变量出现。日心坐标时与地球时的转换关系如下，其中比例系数 ![image-20220604075610182](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220604075610182.png)：

​		![image-20220604075624825](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220604075624825.png)

上式中的 Δt 为当前时刻与1977年1月1日0时（[JD](https://zh.wikipedia.org/wiki/JD) 2443144.5 )的时间差。





## Refs

- [Time in the United States - Wikipedia](https://en.wikipedia.org/wiki/Time_in_the_United_States)
- [Historical time zones of China - Wikipedia](https://en.wikipedia.org/wiki/Historical_time_zones_of_China)
- [Time in China - Wikipedia](https://en.wikipedia.org/wiki/Time_in_China)
- [时间 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/时间)
- [時間標準 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/時間標準)
- [时区 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/时区)
- [ISO 8601 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/ISO_8601)
- [恒星时 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/恒星时)
- [太陽時 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/太阳日)
- [均時差 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/均時差)
- [曆書時 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/曆書時)
- [國際原子時 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/國際原子時)
- [地球定向参数](https://zh.wikipedia.org/wiki/地球定向参数)
  - [地球自转](https://zh.wikipedia.org/wiki/地球自转)
- [地球坐标系统](https://zh.wikipedia.org/wiki/地球坐标系统)
- [轨道周期](https://zh.wikipedia.org/wiki/轨道周期)
- [時鐘](https://zh.wikipedia.org/wiki/時鐘)
  - [天文钟](https://zh.wikipedia.org/wiki/天文钟)
  - [無線電時鐘](https://zh.wikipedia.org/wiki/無線電時鐘)
  - [原子鐘](https://zh.wikipedia.org/wiki/原子鐘)
- [守时](https://zh.wikipedia.org/w/index.php?title=守时&action=edit&redlink=1)
- [授时](https://zh.wikipedia.org/wiki/授时)
- [天球坐标系统](https://zh.wikipedia.org/wiki/天球坐标系统)
  - [春分点](https://zh.wikipedia.org/wiki/春分点)
  - [子午圈](https://zh.wikipedia.org/wiki/子午圈)
- [香港授時服務｜香港天文台(HKO)｜服務概覽](https://www.hko.gov.hk/tc/wservice/tsheet/timeserv.htm)
- 





















:end:

