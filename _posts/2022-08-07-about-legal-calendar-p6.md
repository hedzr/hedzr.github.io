---
layout: single
title: "关于历法的一系列知识整编 - P6"
date: 2022-08-07 05:00:00 +0800
last_modified_at: 2022-08-07 07:50:00 +0800
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
  历法知识整编 历法相关...
---

> [历法知识整编索引页](https://hedzr.com/c++/algorithm/about-legal-calendar/)

> 摘抄、整编，已尽力罗列来源。

## 历法

[陽曆](https://zh.wikipedia.org/wiki/陽曆) **·** [陰曆](https://zh.wikipedia.org/wiki/陰曆) **·** [陰陽曆](https://zh.wikipedia.org/wiki/陰陽曆)

[農曆](https://zh.wikipedia.org/wiki/農曆) **·** [西曆](https://zh.wikipedia.org/wiki/西曆)（[格里曆](https://zh.wikipedia.org/wiki/格里曆)為主） **·** [希伯來曆](https://zh.wikipedia.org/wiki/希伯來曆) **·** [伊斯蘭曆](https://zh.wikipedia.org/wiki/伊斯蘭曆) **·** [天文計年](https://zh.wikipedia.org/wiki/天文計年) **·** [ISO 8601](https://zh.wikipedia.org/wiki/ISO_8601) **·** [UNIX時間](https://zh.wikipedia.org/wiki/UNIX時間)



> **以下是摘的哪儿的呢？去年啥时候干的，没留底不知道了，知道的不妨通知我。**



### 3.1. 儒略历（Julian calendar）

儒略历（Julian calendar）是由罗马共和国独裁官儒略·凯撒采纳埃及亚历山大的数学家兼天文学家索西琴尼的计算后，于公元前45年1月1日起执行的取代旧罗马历法的一种历法。

儒略历中，一年被划分为12个月，大小月交替；四年一闰，平年365日，闰年366日为在当年二月底增加一闰日，年平均长度为365.25日。

由于实际使用过程中累积的误差随着时间越来越大，1582年教皇格里高利十三世颁布、推行了以儒略历为基础改善而来的格里历，即公历。

### 3.2. 格里高利历（Gregory Calendar）

是由意大利医生兼哲学家 Aloysius Lilius 对儒略历加以改革而制成的一种历法——《**格里历**》。1582年，时任罗马教皇的格列高利十三世予以批准颁行。

格里历即为现行的**公历**，日期包括年、月、日。格里历 + UTC 即为日常的日期时间的定义。


### 3.3. 儒略记日法（Julian Day）

Julian Day，儒略记日法是在儒略周期内以连续的日数计算时间的计时法，是一种不用年月的长期记日法。由 Joseph Justus Scaliger 发明，为了将所有历史日期用一个系统表述，天文学家经常用JD来赋予每天一个唯一的数字，方便追朔日期。

> https://en.wikipedia.org/wiki/Julian_day 
> Julian day is the continuous count of days since the beginning of the Julian Period and is used primarily by astronomers, and in software for easily calculating elapsed days between two events (e.g. food production date and sell by date).[1]

### 3.4. 儒略日数（JDN）

Julian Day Number，指从UT1时正午开始的一整天，是一个整数。

> https://en.wikipedia.org/wiki/Julian_day 
> The Julian Day Number (JDN) is the integer assigned to a whole solar day in the Julian day count starting from noon Universal time, with Julian day number 0 assigned to the day starting at noon on Monday, January 1, 4713 BC, proleptic Julian calendar (November 24, 4714 BC, in the proleptic Gregorian calendar),[2][3][4] a date at which three multi-year cycles started (which are: Indiction, Solar, and Lunar cycles) and which preceded any dates in recorded history.[5] For example, the Julian day number for the day starting at 12:00 UT on January 1, 2000, was 2 451 545.[6]


JDN0 指定为：

- 格里历4714BC的11月24日UT1时12:00:00开始的24小时

或

- 儒略历4713BC的1月1日UT1时12:00:00开始的24小时。

例如，格里历2000年1月1日UT1时12:00:00开始的JDN是2451545。

### 3.5. 儒略日（JD）

Julian Date，JD 等于 JDN 加上从 UT1 时 12 时起的小数日部分。

2013年1月1日UT1时00:30:00.000，JD = 2456293.520833

2020年3月30日UTC时01:35:00.000，JD = 2458937.62847

= 2020年3月30日UT1时01:35:00.100

历史上，儒略日基于 $\rm GMT$ 来记录，自1997来，IAU建议以 $\rm TT$ 为单位记录JD。Seidelmann 指出儒略日期可以与国际原子时（$\rm TAI$）、地球时间（$\rm TT$）、协调质心时间（$\rm TCB$）、协调世界时（$\rm UTC$）一起使用，当差异显著时，应指示刻度。通过将中午后的小时、分钟和秒数转换为等效的小数部分，可以找到一天中的小数部分。

> https://en.wikipedia.org/wiki/Julian_day 
> The Julian date (JD) of any instant is the Julian day number plus the fraction of a day since the preceding noon in Universal Time. Julian dates are expressed as a Julian day number with a decimal fraction added.[7] For example, the Julian Date for 00:30:00.0 UT January 1, 2013, is 2 456 293.520 833.[8]
> Current value is as of 01:35, Monday, March 30, 2020 (UTC)

![2](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/2.jpg)

> Historically, Julian dates were recorded relative to Greenwich Mean Time (GMT) (later, Ephemeris Time), but since 1997 the International Astronomical Union has recommended that Julian dates be specified in Terrestrial Time.[12] Seidelmann indicates that Julian dates may be used with International Atomic Time (TAI), Terrestrial Time (TT), Barycentric Coordinate Time ( $\rm TCB$ ), or Coordinated Universal Time (UTC) and that the scale should be indicated when the difference is significant.[13] The fraction of the day is found by converting the number of hours, minutes, and seconds after noon into the equivalent decimal fraction. Time intervals calculated from differences of Julian Dates specified in non-uniform time scales, such as UTC, may need to be corrected for changes in time scales (e.g. leap seconds).[7]

### 3.6. 简化的儒略日

由于儒略日的整数部分过长，为了便于使用，1957年史密松天体物理天文台，将儒略日进行了简化，并将其命名为简化儒略日，其定义为：MJD=JD-2400000.5。

JD2400000是1858年11月16日中午12时，因为JD从中午开始计算，所以简化儒略日的定义中引入偏移量0.5，这意味着MJD0相当于1858年11月17日0时。每一个简化儒略日都在世界时午夜开始和结束。

简化儒略日有两个目的：

1) 日期从午夜而不是中午开始；
2) 儒略日的整数部分由7位数减为5位数，节省计算机储存空间。


### 3.7. 标准历元（J2000.0）

标准历元（J2000.0）是天文学上使用的历元，前缀J表示是一个儒略纪元。1994年IAU决议明确了新的标准历元为

```
  2000年1月1日 TT时  12:00:00
= 2000年1月1日 TAI时 11:59:27.816
= 2000年1月1日 UTC时 11:58:55.816
```

记为 **J2000.0**。

### 3.8. 由格里历计算儒略日JD

首先根据日期时间得到年 $Y$，月 $M$，日 $D$
然后调整 $Y$ 和 $M$

$$
\begin{aligned}
\left\{\begin{matrix}
&M = M+2, Y = Y - 1&\quad(M<3)\\ 
&M = M, Y = Y&\quad(M\geq3)
\end{matrix}\right.
\end{aligned}
$$

换句话说，如果日期在 1 月或者 2 月，则被看作时前一年的 13 月或 14 月。
然后计算辅助系数 $A$ 和 $B$

$$
\begin{aligned}
A &= floor(Y/100)\\
B &= 2-A+floor(A/4)
\end{aligned}
$$

然后计算 JD

$$
JD=floor(365.25\times (Y+4716))+floor(30.6001\times(M+1))+D+B-1524.5
$$

计时间为时 $H$，分 $N$，秒 $S$，毫秒 $MS$，微秒 $US$，将其转换为天为单位，叠加到 JD

$$
JD = JD + H/24 + N / 1440 + S/86400 + MS / 86400000 + US / 86400000000
$$

特别地，J2000.0 被定义为2000年1月1.5日（TT时），则J2000.0 的儒略日为

$$
JD_{J2000.0} = 2451545.0\quad TT
$$

由于儒略日JD是一个整数部分和小数部分均很长的double，按照本节直接计算得到的JD，其小数部分的有效位数会被整数部分挤占而不足15位，这在儒略日转为格里历日期时间时会出现精度损失，导致时间中的毫秒和微秒数据不对。

因此，不建议直接采用本节的计算方法计算JD，而是采用类似IAU的sofa程序包的方法，计算简化的儒略日MJD，并在计算过程中分别计算整数部分和小数部分。

同时，建议将儒略日的定义，从原先的一个double变为一个struct，struct包含两个double即整数部分double和小数部分double。相应的修改所有以JD作为形参的函数。

若需要完整的JD，则将整数部分和小数部分相加即可。

### 3.9. 由格里历算简化的儒略日

参考 sofa 程序 `iauCal2jd.c` 。

### 3.10. 计算标准历元起的儒略日


计算当前时刻的 `JD_Current_UTC`

将其转化为 TT 时

```
JD_Current_TT = JD_Current_UTC + 64.184 / 86400.0
```

计算 J2000.0 时刻的 JD_J2000_TT（因为 J2000.0 本身就定义在TT下）

作差，得到 `JD_FromJ2000`

```
JD_FromJ2000 = JD_Current_TT – JD_J2000_TT
```

### 3.11. 计算标准历元起的儒略世纪

```
JulianCentry = JDFromJ2000 / 365.25 / 100
```

其中365.25是儒略年。











## Refs

- [曆法](https://zh.wikipedia.org/wiki/曆法)
- [陽曆](https://zh.wikipedia.org/wiki/陽曆) **·** [陰曆](https://zh.wikipedia.org/wiki/陰曆) **·** [陰陽曆](https://zh.wikipedia.org/wiki/陰陽曆)
- [農曆](https://zh.wikipedia.org/wiki/農曆) **·** [西曆](https://zh.wikipedia.org/wiki/西曆)（[格里曆](https://zh.wikipedia.org/wiki/格里曆)為主） **·** [希伯來曆](https://zh.wikipedia.org/wiki/希伯來曆) **·** [伊斯蘭曆](https://zh.wikipedia.org/wiki/伊斯蘭曆) **·** [天文計年](https://zh.wikipedia.org/wiki/天文計年) **·** [ISO 8601](https://zh.wikipedia.org/wiki/ISO_8601) **·** [UNIX時間](https://zh.wikipedia.org/wiki/UNIX時間)
- 
- [天文学基础（时间和历法）- sirlis](http://sirlis.cn/posts/astronomy-basic-time-calender/)
- 
- [中国传统历法](https://zh.wikipedia.org/wiki/中國傳統曆法)
- [历法](https://zh.wikipedia.org/wiki/曆法)、[历法列表](https://zh.wikipedia.org/wiki/历法列表)
- [黄历](https://zh.wikipedia.org/wiki/黃曆)
- [西历](https://zh.wikipedia.org/wiki/西曆)
- [干支](https://zh.wikipedia.org/wiki/干支)、[生肖](https://zh.wikipedia.org/wiki/生肖)
- [五行](https://zh.wikipedia.org/wiki/五行)
- [七曜](https://zh.wikipedia.org/wiki/七曜)、[六曜](https://zh.wikipedia.org/wiki/六曜)
- [阴阳历](https://zh.wikipedia.org/wiki/阴阳历)

- 

- [置闰](https://zh.wikipedia.org/wiki/置闰)问题

- 

- [香港天文台1901至2100年西历与农历日期对照表](https://web.archive.org/web/20111017124826/http://www.weather.gov.hk/gts/time/conversionc.htm)
- [台湾](https://zh.wikipedia.org/wiki/臺灣)[中央气象局](https://zh.wikipedia.org/wiki/中央氣象局)[日历资料表](https://web.archive.org/web/20150926233254/http://www.cwb.gov.tw/V7/astronomy/cdata/calpdf/calpdf.htm)
- [台湾](https://zh.wikipedia.org/wiki/臺灣)[中央研究院](https://zh.wikipedia.org/wiki/中央研究院)数位文化中心[两千年中西历变换](http://sinocal.sinica.edu.tw/)（西元元年2月11日至2100年2月9日）
- [台湾](https://zh.wikipedia.org/wiki/臺灣)[台北市](https://zh.wikipedia.org/wiki/臺北市)立天文科学教育馆  [陰陽曆對照表+曆象表](https://www.tam.gov.taipei/News_Content.aspx?n=2D5F18609004C0CE&sms=3AABB000A3E78431&s=AC19298B0509F078) 
- [国历农历查询](http://ppg.naif.org.tw/naif/MarketInformation/Other/Calendar_V3.aspx) - 畜产行情 - 中华民国[行政院农业委员会](https://zh.wikipedia.org/wiki/行政院農業委員會)



## 历史上的历法如何形成的

》这里就是个人理解，草草一写：

历法与时间上有很多奇怪的问题，例如为什么一年是 12 个月，为什么 1 分钟是 60 秒，等等。



秒的定义是可以写一部小说的。甚至是更冗长的人类史也不意外。

历法也是如此。历法与秒是相辅相成的。



### 农历的梗概

1. 看月圆月缺，决定了一个月是 30 天
2. 看回归线回归点决定了 春分或/和 冬至，决定了 12 个节气，也决定了一年是 360 天更多（即 12 个月），随着天文观测的精确而逐渐定为 365 天，并加上了闰年，农历则进一步制定了闰月的规则。
3. 以日晷（圆盘）上的刻度划分问题为课题，一天最终被定为 12 个时辰，这样最容易等分，并且细分为 60 等分，也就是分钟和秒了。现代西方怀表之后渐渐演变为加倍到 24 小时。
4. 涉及到圆的等分为题，又会演变为数学上的公约数问题，360 是第一个能被10以内几乎所有自然数（除了 7 之外）倍数的数，也就是说，360 最容易被切割出来。
5. 实际上，农历早期曾有过四时八节气，以及十六时辰的划分。但最终还是演变为 十二时辰，二十四节气，三十天，十二个月，四个季度。
6. 此外尚有百刻制（一天为 100 刻），等等

> 7 是一个神秘的数字。这是另一个话题了。



### 回归线问题

古人立一根杆子，测量其正午时影子长度，每当春分点时影子长度适中，每当冬至时影子最短。

一日之中，正午时影子最短；一年之中，冬至正午时影子最短。

因此，农历是以冬至定年并定节气的。

然后是月相变化定月份。

这就是历法的来源——农历是阴阳合历。

当然这是对北半球的中国而言。

但是话说回来，北纬三十度是世界上古代文明的发源地，所以即使是换个世界，也还是会演变出农历一摸一样的历法出来。



---

### 更

BTW，三更天是子时，即 23:00 - 01:00 这个阶段。

|      |          |      |        |      |
| ---- | :------: | ---- | :----: | ---- |
| 更头 |   时刻   | 时段 | 小时段 | 称呼 |
| 一更 | 戌初一刻 | 戌时 | 19-21  | 黄昏 |
| 二更 | 亥初二刻 | 亥时 | 21-23  | 入定 |
| 三更 |  子时整  | 子时 | 23-01  | 夜半 |
| 四更 | 丑正二刻 | 丑时 | 01-03  | 鸡鸣 |
| 五更 | 寅正四刻 | 寅时 | 03-05  | 平旦 |
|      |          |      |        |      |

以下或有争议：

更念做 `jīn`，但现代大陆一般以讹传讹（？或者是规范化）念为 `geng`，且反而认为这才是正确音。类似的例子颇多……我才知道`的地得`都不分了。害！

部分方言中保留了古音，例如重庆话“三更半夜”念做 `/sānjīn-bànyè/`。

> 老山城：三精半夜你娃不拽瞌睡你搞啥子灯嘛
>
> 普通话：三更半夜你不睡觉搞什么名堂！

一说 `jīn` 应该后鼻音念做 `jīng`。咱重庆人不分这个，不纠结哈。



- [更 - 维基百科，自由的百科全书](https://zh.m.wikipedia.org/zh/%E6%9B%B4) 
- [汉典“更”字的基本解释](https://www.zdic.net/hans/%E6%9B%B4) - 國語辭典



我不做韵学研究，也没力气考据，只能根据自己的个人经验留一笔记录在此了。



## 秒和更小的尺度

以前的几个帖子中，讲述历史和回顾时已经描述过秒的定义及其测量方法。

浓缩一下。

在农历时节，中国、印度等多数文明无所谓秒这一概念。

中国会使用一眨眼，一瞬时等量度来描述秒等小尺度的时间间隔。

### 刹那

佛教经文中译和融合过程中，小尺度时间的描述被大大丰富。

佛教经典《仁王经》中提到：“一弹指六十刹那，一刹那九百生灭”，算得事相的生成消灭率为每秒216,000次，或说每次生灭约4.6微秒；和科技所能达的飞秒时间尺度相比，或者和物理理论上真空涨落的时间尺度相比，也算是相当大的。

古代印度梵典《僧祗律》(又有资料是《倡祗律》) 有这样的记载：一刹那者为一念，二十念为一瞬，二十瞬为一弹指，二十弹指为一罗预，二十罗预为一须臾，一日一昼为三十臾。照此可推算出具体时间来。即一天一夜24小时有480万个“刹那”，或24万个“瞬间”，或12千个“弹指”，或30个“须臾”。再细算，一昼夜有86400秒，那么一“须臾”等于2880秒（48分钟），一“弹指”为7.2秒，一“瞬间”为0.36秒，一“刹那”却只有0.018秒。（一日有十二时辰（一时辰合现代2小时），一时辰有八刻（一刻合现代15分钟），一刻有三盏茶（一盏茶合现代5分钟），一盏茶有两炷香（一炷香合现代2分30秒），一炷香有五分（一分合现代30秒），一分有六弹指（一弹指合现代5秒），一弹指有十刹那（一刹那合现代0.5秒）。）

“一刹那”：原来是印度古代语言（梵语）的音译，是古代印度的一个时间单位，唐代玄奘写的《大唐西域记》中载：时极短者，谓刹那边，百二十刹那为一咀刹那，六十咀刹那即为一腊缚，三十腊缚为一牟呼粟多，五牟呼粟多为一时，六时合成一日一夜”。由此推算，所谓一刹那应当是我们现在的七十五分之一秒。即百家讲坛：走进印度玄奘西游记之十四 所算出来的 一刹那为0.013秒。

### 公制换算

**《摩訶僧祇律》**

|                           單位名稱                           |        公制換算        | 上級倍數 | 剎那倍數 |
| :----------------------------------------------------------: | :--------------------: | :------: | :------: |
|                              念                              |        0.018 秒        |    ／    |    1     |
| [瞬頃](https://zh.wikipedia.org/w/index.php?title=瞬頃&action=edit&redlink=1) |        0.36 秒         |  20 念   |    20    |
|          [弹指](https://zh.wikipedia.org/wiki/彈指)          |         7.2 秒         | 20 瞬頃  |   400    |
| [羅豫](https://zh.wikipedia.org/w/index.php?title=羅豫&action=edit&redlink=1) | 2.4 分鐘 （2分鐘24秒） | 20 弹指  |   8000   |
|          [须臾](https://zh.wikipedia.org/wiki/須臾)          |        48 分鐘         | 20 羅豫  |  160000  |
|          [晝夜](https://zh.wikipedia.org/wiki/昼夜)          |        24 小時         | 30 须臾  | 4800000  |

**《大毘婆沙論》＆《俱舍論》**

|                           單位名稱                           |        公制換算        |  上級倍數   | 剎那倍數 |
| :----------------------------------------------------------: | :--------------------: | :---------: | :------: |
|                             剎那                             | 1/75 秒 = 0.01333.. 秒 |     ／      |    1     |
| [怛刹那](https://zh.wikipedia.org/w/index.php?title=怛刹那&action=edit&redlink=1) |         1.6 秒         |  120 剎那   |   120    |
| [腊缚](https://zh.wikipedia.org/w/index.php?title=腊缚&action=edit&redlink=1) |         96 秒          |  60 怛刹那  |   7200   |
|      [牟呼栗多](https://zh.wikipedia.org/wiki/牟呼栗多)      |   2880 秒 = 48 分鐘    |   30 腊缚   |  216000  |
|                             晝夜                             |        24 小時         | 30 牟呼栗多 | 6480000  |

**《大唐西域记》在《大毘婆沙論》之上的補充**

|                     單位名稱                      | 公制換算 |                       上級倍數                       | 剎那倍數 |
| :-----------------------------------------------: | :------: | :--------------------------------------------------: | :------: |
| [大時](https://zh.wikipedia.org/wiki/時_(古印度)) |  4 小時  | 5 [牟呼栗多](https://zh.wikipedia.org/wiki/牟呼栗多) | 1080000  |
|                       晝夜                        | 24 小時  |                        6 大時                        | 6480000  |



### 刹那之后

关于刹那的长度，佛经中有多种解释：

1、一弹指顷有六十刹那；
2、一念中有九十刹那，一刹那又有九百生灭；
3、刹那是算数譬喻所不能表达的短暂时间。

传入中国后，口语中具体长度逐渐淡化，仅用来说明短暂时间，犹“一瞬间”。

所以无所谓哪一种说法，刹那是个很短的时间段这是无疑义的。

值得说明的是，刹那、须臾、弹指等等词汇虽然来源于佛教文本，然而中译之后，这些词汇确实是地地道道的汉语词汇。不同文明之间的交流本就是如此：互相融合。

---

在怀表和机械表被发明之后，秒有了真正的定义，一日为 24 小时，一小时为 60 分钟，一分钟为 60 秒，以表盘圆周为依据切割而得来。

> 一说为 24 小时源自于古埃及计时法。

近代当代最终采取原子钟的方式，来逼近钟表“秒”的时长，然后定义了我们目前所使用的秒的长度。

反过来，依据这一国际标准量纲，其它各种时计、量度就有了根本依据。



## REFs

- [刹那 - 维基百科，自由的百科全书](https://zh.wikipedia.org/zh/%E5%88%B9%E9%82%A3) 





## 结尾的话

这次的大部分历法有关的资料就差不多先这样了。

另外还有一些很难整理。就搁着先。









:end:

