---
layout: single
title: "关于历法的一系列知识整编 - P1"
date: 2022-08-02 05:00:00 +0800
last_modified_at: 2022-08-02 07:50:00 +0800
Author: hedzr
tags: [c++17,timer,ticker,timing,calendar]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/800px-World_Time_Zones_Map.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  历法知识整编 关于计时系统现状...
---

> [历法知识整编索引页](https://hedzr.com/c++/algorithm/about-legal-calendar/)

> 摘抄、整编，已尽力罗列来源。

## 计时系统现状

当前，国际上统一采用 UTC 时间系统作为主流计时系统，大多数国家、几乎所有的计算机系统均以该时间规范为基础。

> 有时候，我们也称之为 GMT 即格林威治（有译格林尼治者）时间。但两者还是有一点点区别的，如果需要精确表述，那么还是应该使用 UTC 术语。

UTC 全称为 Coordinated Universal Time，即协调世界时。

对于软件开发人员来讲，通常无需掌握天文学、地球物理学、测地学等相关知识，也无需了解力学时、原子时、世界时等等概念乃至于它们之间的关系和换算方法。我们只需要掌握在给予 UTC 时间系统中针对均匀、稳定的时间线进行编程的实践性技法就足够了。

一般认为，UTC 为所有人提供了一个均匀、稳定的时间线，这条时间线轴时单调地线性前进的，所以我们可以用简单的加减法来得到全部的时间点（取决于离散点的精度，一般最小到纳秒，但这并非必须），并在这个基础上演化出我们日常生活所需的日期时间系统。

在日期时间系统中，考虑全球性问题，所以首先要解决的是时区问题。



### 时区划分

整个地球的时间系统，按照经度划分为 24 个时区，即每 15° 划分一个时区，这是**理论时区**。因为经度 0° 是英国格林尼治天文台所在经线，由此延展故而有东 n 区以及西 n 区，直至东 12 区与西 12 区，而东 12 区与西 12 区实际上是同一个地方。

所以每相差一个时区，区时则相差一个小时。

但为了处理东 12 区与西 12 区重叠问题，又有国际换日线的定义，它以 180° 经线为基准，定义了该线东侧比西侧晚 24 小时（而不是因为时区重叠而时间相同）。

![img](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/800px-World_Time_Zones_Map.png)

一般来说，为了避免换日线经过的地区人民生活不便（例如向前一步就前进了一整天），所以换日线不是一条直线，而是弯弯曲曲的，刻意避开了陆地、岛屿以及海峡。

当然，如果你在北极极点处转圈，那么你会面对到时间时区混乱的问题。这对于地球两极均会发生。

这类问题在 GPS 授时系统的锚定下可以得到最终解决：或者说，只要你离开极地，就能获得稳定的时间线。只要不使用本地时间，而是单一使用 UTC+00 时间戳记，那就无所谓本地时间混乱的问题了。

另可参考：

- [时区列表](https://zh.wikipedia.org/wiki/时区列表)
- [國際換日線](https://zh.wikipedia.org/wiki/國際換日線)
- [格林尼治標準時間](https://zh.wikipedia.org/wiki/格林尼治標準時間)
- [时区](https://zh.wikipedia.org/wiki/时区)

世界各国和地区为了规范本地人民生活，又在理论时区的基础上制定了本国法定时区。可能是单一时区，也可能应用若干传统时区。



### 跨出地球

我们提到了在北极极点附近，由于你一只脚就能踩住甚至十几个时区，因为这里的时间是混乱的。当然，确切地说，北极圈内只是冰盖，并无陆地，也没有固定居民，所以这个问题并不大。北极圈范围内也没有专有的时区。对于科研或探险者来说，他们可以采用 UTC 基础的绝对时间来做记录，也可以使用自己所属国家的本地时间。

在南极洲，对的，南极冰盖之下有陆地，所以它是一个真正的洲，在南极洲，时间混乱的现象依然存在。解决的办法同上，以 UTC 时间点的方式而不带入本地时间即可将时间线单一化。

当我们飞出地球，或者探测器、卫星等超出地球陆地范畴之后，采用地球上的时间系统就缺乏意义了。因此，以恒星为参照系，我们又定义了世界时、太阳时、恒星时作为时间线的参考轴，在这一统一化的参考轴上，地球内时间系统只是被附加了一个偏移。具体内容，我们在后文还会有所叙述。





### 北京时间

按照中国大陆官方标准，北京时间被统一应用到全中国，采用 +8 时区，即使整个中国横跨了大约 5 个时区。

以此为依据，现行的计算机时区标准将 Asia/Chongqing 和 Asia/Shanghai 都解释到 +8 区。

但是在历史上则有一些不同，例如在 1949 之前，北京时间被称为为中原时区，并将昆仑时区（Asia/Kashgar +0530）、新藏时区（Asia/Urumqi +6）、陇蜀时区（Asia/Chongqing +7）和长白时区（Asia/Harbin +0830）独立出来。为了简化文字表述，这段历史在此没有精确化，细节很多，但也不算特别重点，故而掠过。

而今，国际标准对大中国则以北京时间，台湾时间为准。

此外大陆区曾多次废除又恢复新疆时间，目前新疆多数汉人使用北京时间而其它少数民族偏爱乌鲁木齐时间，有的政府部门两个时间同时采用。

而在1986 起的六年中，中国大陆区曾实施了夏令时。

一直以来，香港和澳门都有专门的时间标准。不过，他们都采用 +8 制，故而在回归大陆区之后一般情况下不再刻意单列。



### 美国时间

**美利坚合众国标准时间**（英語：United States Standard Time），又称**美國時區**（英語：US time zone），是覆蓋[美国](https://zh.wikipedia.org/wiki/美国)及其屬地九個[时区](https://zh.wikipedia.org/wiki/时区)的總稱，配以由聯邦及地區立法制訂的[夏令時](https://zh.wikipedia.org/wiki/夏时制)法規使用。

美利坚合众国标准时间由《[美国法典](https://zh.wikipedia.org/wiki/美国法典)》第15章（Title 15 of the United States Code）第260節規定，時區界線由《[美國聯邦條例法典](https://zh.wikipedia.org/wiki/聯邦規則彙編)》（CFR, Code of Federal Regulations）第49章第71節規定。

美国本土采用多个时区：

美国东部时间，中部时间，太平洋时间，山区标准时，

美国海外州分：

阿拉斯加标准时，夏威夷-阿留申时区，

美国海外属地：

大西洋标准时，萨摩亚标准时，查莫罗标准时，



### 其它国家和地区

俄罗斯领土横跨大约 11.4 个时区，所以它是世界上单个国家占用时区数量最多的，它使用 UTC+2 到 UTC+12 共 12 个时区。不过，目前俄罗斯官方定义了 11 个标准时间用于国内各地区使用。

另一个说法则认为法国才是时区最多的国家，因为在法国国内共有 12 个标准时间被使用。

澳大利亚时区是覆盖澳大利亚及其属地三个时区的总称。 三个时区分别为澳大利亚西部标准时间（AWST; UTC+08：00）、澳大利亚中部标准时间（ACST; UTC+09：30）和澳大利亚东部标准时间（AEST; UTC+10：00），各州份及行政地区以地区立法制订适用的时区及夏令时间。

加拿大采用多个时区，包括太平洋时区，山地时区，中部时区，东部时区，大西洋时区，纽芬兰时区等等。大体上它和美国本土保持一致，有微小的不同。

墨西哥当前使用四个主要的时区：东南时区，中部时区，太平洋时区，西北时区。同时墨西哥所属各岛屿则使用其地理位置所处的时区。

埃及使用一个单一的埃及标准时间。

欧洲各国总体上来说使用欧洲中部时区（CET，部分为欧洲中部夏令时区），欧洲东部时区（基本废弃），欧洲西部时区（部分国家采用欧洲西部夏令时）。

印度使用单一的印度标准时间。

巴基斯坦采用单一的巴基斯坦标准时间。

更多的国家地区时区信息，可以参考 [各國時區列表](https://zh.wikipedia.org/wiki/各國時區列表)。





### 时区信息数据库

除了上述的具有公信力的 Wiki 页面以及时区列表之外，在计算机领域存在着与现行政体同步的时区信息数据库。

**时区信息数据库**，又称**TZ database**、**Zoneinfo database**，是一个主要应用于电脑程序以及操作系统的，可协作编辑世界[时区](https://zh.wikipedia.org/wiki/时区)信息的[数据库](https://zh.wikipedia.org/wiki/数据库)。由于该数据库由 David Olson 创立，因而有些地方也将其称作 **Olson数据库**。数据库由 Paul Eggert 进行编辑和维护[[4\]](https://zh.wikipedia.org/wiki/时区信息数据库#cite_note-4)。

它的显著特色是由上面提到的 Paul Eggert 设计的一套通用时区命名规则，例如 "America/New_York" 和 "Europe/Paris"。数据库试图记录自1970年（Unix元年）以来时区和城市的变化，并且还包含一些时间的转换，例如[夏令时](https://zh.wikipedia.org/wiki/夏令时)和[闰秒](https://zh.wikipedia.org/wiki/闰秒)。

过去以来直至目前，zone.tab 都是由一群志愿者进行维护，并在 ftp 公共服务器上发布。随着时间的推移，发布内容格式、发布方式也在演变。就目下而言，你应该阅读 [这里](https://data.iana.org/time-zones/tz-link.html) 来寻求最新数据。

当 github 依旧对你的国家友善时，你也可以通过 [这里](https://github.com/eggert/tz) 获取到 tzdb 的最新版本，一般来说这里相当勤力，更新相当及时。



#### 使用 Linux/Unix-Like 系统

对于使用类 `*nix` 系统的人来说，直接访问 `/usr/share/zoneinfo` 可能更为方便，也无需做编译行动，但这份内容通常不是最新的，只能说是相当新、足够新。

此外，zoneinfo 并非原始的 tzdb 数据库，而是在此基础上有所整编。为了便于操作系统和支撑平台所使用，原始的时区信息数据库 tzdb 是以文本文件形式发布的，但会在特定软件平台、操作系统上被编译为和平台无关的二进制文件 ，每个时区对应着一个文件，编译相关的代码被称为 `zic`，编译后的结果被用于 localtime, mktime 等基础 API。







### Ref

- [Time in the United States - Wikipedia](https://en.wikipedia.org/wiki/Time_in_the_United_States)
- [Historical time zones of China - Wikipedia](https://en.wikipedia.org/wiki/Historical_time_zones_of_China)
- [Time in China - Wikipedia](https://en.wikipedia.org/wiki/Time_in_China)
- [俄羅斯時區 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/俄羅斯時區)
- [巴基斯坦标准时间 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/巴基斯坦标准时间)
- [时区 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/时区)
- [时区信息数据库 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/时区信息数据库)
- [各國時區列表 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/各國時區列表)
- [UNIX时间 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/UNIX时间)
- [时间 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/时间)







:end:

