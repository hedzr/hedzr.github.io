---
layout: single
title: "关于历法的一系列知识整编 - P2"
date: 2022-08-03 00:00:00 +0800
last_modified_at: 2022-08-03 00:43:00 +0800
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
  历法知识整编 历史源流...
---

> [历法知识整编索引页](https://hedzr.com/c++/algorithm/about-legal-calendar/)

> 摘抄、整编，已尽力罗列来源。

这部分大致上是 wiki 的摘抄（除了[近日动向](#近日动向---闰秒问题)之外）。

## 历史

### 19世纪－20世纪初：世界时的形成

#### 标准子午线的确定

在19世纪，“世界时”一词被用于指称一种与“地方时”相对的、不随使用者的所在地而变化的约定的时间标准。当时，确定时间标准的最精确的的方法是通过天文观测来确定某一[天体](https://zh.wikipedia.org/wiki/天体)经过观测者所在位置的的[子午线](https://zh.wikipedia.org/wiki/子午线)的时刻。因此，世界时这一概念不可避免地会与[标准子午线](https://zh.wikipedia.org/wiki/本初子午線)联系在一起。而在当时，不同[海图](https://zh.wikipedia.org/wiki/海图)所使用的标准子午线却并不相同：[奥斯陆](https://zh.wikipedia.org/wiki/奥斯陆)、[哥本哈根](https://zh.wikipedia.org/wiki/哥本哈根)、[那不勒斯](https://zh.wikipedia.org/wiki/那不勒斯)、[巴黎](https://zh.wikipedia.org/wiki/巴黎)、[斯德哥尔摩](https://zh.wikipedia.org/wiki/斯德哥尔摩)等城市所在的子午线都曾作为标准子午线出现。[格林尼治子午线](https://zh.wikipedia.org/wiki/格林尼治子午線)作为标准子午线的历史开始于1767年，当时[英国航海天文历](https://zh.wikipedia.org/w/index.php?title=英国航海天文历&action=edit&redlink=1)将穿过[格林尼治天文台](https://zh.wikipedia.org/wiki/格林尼治天文台)的经线作为其星历表中的标准子午线。1871年8月，召开于[安特卫普](https://zh.wikipedia.org/wiki/安特卫普)的第一届[国际地理大会](https://zh.wikipedia.org/wiki/國際地理聯合會)建议将格林尼治子午线作为所有海图的零度经线。后在1875年，召开于[罗马](https://zh.wikipedia.org/wiki/罗马)的第二届国际地理大会继续建议，以[英国](https://zh.wikipedia.org/wiki/英国)采用[米制](https://zh.wikipedia.org/wiki/米制)单位为条件，[法国](https://zh.wikipedia.org/wiki/法国)可以考虑使用格林尼治子午线作为其标准子午线。

1876年，[加拿大](https://zh.wikipedia.org/wiki/加拿大)工程师[斯坦福·佛莱明](https://zh.wikipedia.org/wiki/斯坦福·佛莱明)发表了一篇提议使用世界时的文章。最初，他将这类世界时称为“cosmopolitan time”，随后在其陆续发表的几篇文章中他对进这一概念行了补充了。他认为，世界时应当是能以“共同的（common）” “普遍的（universal）” “非地方的（non-local）” “一致的（uniform）” “绝对的（absolute）” “全世界的（all world）” “地球的（terrestrial）” 或 “世界性的（cosmopolitan）” 来描述的时间，“宇宙时（cosmic time）” 一词也曾在他的文章中出现。然而，弗莱明并不同意将格林尼治子午线作为标准子午线，原因是这种做法过于政治敏感。最终，他赞成将与格林尼治子午线相隔180度的经线作为标准子午线，这条子午线大致与今天的[国际日期变更线](https://zh.wikipedia.org/wiki/国际日期变更线)相当。

1880年，英国将[格林尼治平时](https://zh.wikipedia.org/wiki/格林尼治平时)（英語：Greenwich Mean Time，缩写：GMT）确定为英国的法定时间。随后在1883年，[美国](https://zh.wikipedia.org/wiki/美国)和加拿大的[铁路](https://zh.wikipedia.org/wiki/铁路)系统也采用了以格林尼治子午线作为[零时区](https://zh.wikipedia.org/wiki/零時區)的时间系统。同年，召开于罗马的第七届[国际大地测量大会](https://zh.wikipedia.org/w/index.php?title=国际地球物理联合会&action=edit&redlink=1)通过了相关决议：提议将格林尼治子午线作为本初子午线、将格林尼治[正午](https://zh.wikipedia.org/wiki/正午)作为世界时中一天的起点、以从 0 时到 24 时的方式计算世界时等等。1884 年召开于[华盛顿](https://zh.wikipedia.org/wiki/华盛顿)的[国际子午线会议](https://zh.wikipedia.org/w/index.php?title=国际子午线会议&action=edit&redlink=1)亦通过了类似的决议，同时还确定了世界时是[平太阳时](https://zh.wikipedia.org/w/index.php?title=平太阳时&action=edit&redlink=1)、世界时的起算时刻是本初子午线的[平子夜](https://zh.wikipedia.org/wiki/子夜)等等。

#### 起算时刻的确定

尽管1884年召开的国际子午线会议决定世界时中的一天是从子夜起算，但[天文学家](https://zh.wikipedia.org/wiki/天文学家)依然沿用着从正午开始量测世界时的习惯，[格林尼治平时](https://zh.wikipedia.org/wiki/格林尼治平时)即为这一从正午起算的时间标准。然而在1925年年初，英国航海天文历决定将1924年的12月31.5日作为1925年的1月1.0日，加入12小时以将该时间标准的起算时刻从正午改为子夜。对这一新的时间标准，英国航海天文历沿用了格林尼治平时的称呼，而[美国星历表](https://zh.wikipedia.org/w/index.php?title=美国星历表和航海天文历&action=edit&redlink=1)则将其称为“格林尼治民用时（英語：Greenwich Civil Time，缩写：GCT）”。为避免混淆，原本从正午起算的时间标准后被成为“格林尼治天文时（英語：Greenwich Mean Astronomical Time，缩写：GMAT）”。

1928年，[国际天文联合会](https://zh.wikipedia.org/wiki/国际天文联合会)（IAU）提议以“世界时（英語：Universal Time，缩写：UT）”代替出现在星历表中的GMT或GCT，这也是“世界时”第一次出现在“官方”场合。在1935年，IAU决定正式弃用格林尼治民用时，改以世界时作为时间标准。至此，世界时的维持仍是通过天文观测的手段进行，这种方式后来被电子钟取代。到1956年，IAU确定了三类世界时的标准：UT0、UT1 和 UT2，三者间存在细微的差别，其中UT2在当时被作为[无线电](https://zh.wikipedia.org/wiki/无线电波)时间信号的标准来使用。

### 20世纪初－20世纪70年代：广播时间信号与协调时间

随着[电报](https://zh.wikipedia.org/wiki/电报)在19世纪的普及，世界上首个规律的[广播时间信号](https://zh.wikipedia.org/w/index.php?title=广播时间信号&action=edit&redlink=1)在1904年出现。1919年，[国际时间局](https://zh.wikipedia.org/wiki/国际时间局)（BIH）在巴黎成立，其职责是公布[广播无线电信号](https://zh.wikipedia.org/wiki/電台廣播)所使用的时间与通过天文观测维持的时间标准之间的差异。但在20世纪初，不同国家使用的广播时间信号间仍然存在差别。1959年召开的[世界无线电通信大会](https://zh.wikipedia.org/wiki/世界无线电通信大会)意识到了这一问题，因此他们决定让[国际无线电咨询委员会](https://zh.wikipedia.org/wiki/国际无线电咨询委员会)（CCIR）对其进行研究。同年，格林尼治天文台、[英国国家物理实验室](https://zh.wikipedia.org/wiki/英国国家物理实验室)与[美国海军天文台](https://zh.wikipedia.org/wiki/美国海军天文台)达成了建立一种统一的、基于UT2和原子时的时间与频率传送基准的协议，并自1960年1月1日开始使用。该时间基准也被非正式地称为“协调世界时”。随后，其他国家的时间实验室也逐渐参与到这一项目中。到1961年，国际时间局开始接管这一工作。

1963 年，CCIR 在其发布的第 374 号建议案中给出了首个对协调世界时作出定义的国际规范，国际时间局则在 1965 年开始以当时的原子时 A3（国际原子时的前身）来计量UTC。但由于 UTC 与原子时存在的频偏问题以及其时间单位与[国际单位制](https://zh.wikipedia.org/wiki/国际单位制)下的秒长的不一致性，其后几年 UTC 经历了多次的调整。直到 1970年，CCIR 发布了第 460 号建议案，对上述两个问题进行了修正，且要求加入[跳秒](https://zh.wikipedia.org/wiki/跳秒)机制使 UTC 与原有世界时的偏移被控制在1秒以内，UTC 的定义才得以稳定下来。这一新的 UTC 系统自 1972 年的 1 月 1 日零时开始使用，并沿用至今。



## 近日动向 - 闰秒问题

### 2022: 废除闰秒的呼吁

由于闰秒的引入，全球基础设施不断经受考验，而且不断地经受不起考验——最近两次闰秒均造成了 Internet 网络故障——所以最近几个巨型互联网公司联名倡议取消闰秒制度。

- [Tech Giants Want to Banish the Leap Second To Stop Internet Crashes](https://www.cnet.com/tech/computing/tech-giants-try-banishing-the-leap-second-to-stop-internet-crashes/) 
- [Leap seconds cause chaos for computers — so Meta wants to get rid of them - The Verge](https://www.theverge.com/2022/7/26/23278718/leap-second-computer-chaos-meta-backs-campaign-to-end-it) 
- [The Inside Story of the Extra Second That Crashed the Web - WIRED](https://www.wired.com/2012/07/leap-second-glitch-explained/) 
- [It’s time to leave the leap second in the past - Engineering at Meta](https://engineering.fb.com/2022/07/25/production-engineering/its-time-to-leave-the-leap-second-in-the-past/) 



### 闰秒导致的网络故障

- 2012年，社交网站Reddit因为闰秒而遭遇一次大规模停机，用户在30到40分钟内无法访问此网站，工程师不得不重启服务器。据英国卫报，开源社区Mozilla、社交平台LinkedIn、美国商户点评网站Yelp和机票预订供应商Amadeus也都遇到过类似情况。

- 2017年，美国云安全网络公司Cloudflare受闰秒影响，导致托管在该公司的部分网络资源暂时脱机。
- This is not a joke scenario. When a leap second was added in 2012, it caused substantial outages for sites like [Foursquare, Reddit, LinkedIn, and Yelp](https://www.wired.com/2012/07/leap-second-glitch-explained/). By 2015, when the next leap second was due, engineers had mostly learned their lessons, but there were [still some glitches](https://www.theregister.com/2015/07/01/leap_second_bomb_bust). Ditto [2016](https://blog.cloudflare.com/how-and-why-the-leap-second-affected-cloudflare-dns/). As Linux creator Linus Torvalds [put it](https://www.wired.com/2012/07/leap-second-glitch-explained/#:~:text="Almost every time we have,users under their normal conditions."): ”Almost every time we have a leap second, we find something. It’s really annoying, because it’s a classic case of code that is basically never run, and thus not tested by users under their normal conditions.”
- 與閏秒相關的其他報告的軟體問題 - [HERE](https://zh.wikipedia.org/wiki/%E9%97%B0%E7%A7%92#%E8%88%87%E9%96%8F%E7%A7%92%E7%9B%B8%E9%97%9C%E7%9A%84%E5%85%B6%E4%BB%96%E5%A0%B1%E5%91%8A%E7%9A%84%E8%BB%9F%E9%AB%94%E5%95%8F%E9%A1%8C) 

闰秒目前已有 27 次，全部为正（+1秒）。但规范确定，随着地球公转的变化，不排除负一秒闰秒的可能性。然而负闰秒很可能导致全球网络的全面崩溃，随着 IPv6 的推进这一后果可能是致命性的。



## REFs

- [闰秒 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/%E9%97%B0%E7%A7%92) 



:end:

