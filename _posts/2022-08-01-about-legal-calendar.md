---
layout: single
title: "关于历法的一系列知识整编"
date: 2022-08-01 05:00:00 +0800
last_modified_at: 2022-08-01 07:50:00 +0800
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
  历法知识整编 序...
---



## 引言

这里是一系列知识的收集与整编，除了摘抄各来源的文字内容与图片内容之外，为了个人的学习目的也重新笔记过，所以部分内容是整编过的。

接续上一次 [实现一个定时任务库：ticker-cxx](https://hedzr.com/c++/algorithm/ticker-timer-within-cxx17/) ，ticker-cxx 实际上是去年就已实现的内容，但一直搁置，因为整合发布一个类库本身很复杂，也一直在犹豫是不是应该发表到诸如 vcpkg 或是 conan 等平台上。又一直懒，干脆就拖到了现在。

而且追根溯源的话，ticker-cxx 的功能也是很多年来一直想要去做的。

不过前几天觉得 blog 停更了好久了，还是应该回来——此前几个月因为工作关系不得不基本搁置了 blog 更新。直到上月想要恢复，却又手烫伤，躺平了一个月。

至于现在吗，烫伤依然未好，但可怖的水泡蔫了，手臂上较轻的伤已经开始褪皮了，所以敲字也不怎么困难了。

哦，这些都是空话。

真实是，前两天把 ticker-cxx 发布了，也就间接决定了不要自己去做历法部分，至少现在是这么决定的。所以这部分知识整编干脆也整理一下发布出来，说不定有人用得着。

我自己觉得这个还不如跟随 c++20 calendar 计划走，自己做太冤屈了。至于说网上有很多什么千年的、黄历天干的各类代码，也有开源的，其中还有几个是很规范的，但大多都不能讲精确，有着各种各样的近似法，所以我暂时也不觉得 trnasplant/port 这些算法的意义有多大。

好，未来几天内会依次把有关历法、时间的一些知识收集略微整理后发布出来。

但是也并不会特别成体系，只能说是个笔记兼收集的杂烩吧。

> 因为我并不打算深入学天文，所以也就比较草草了事了。

1. [关于计时系统现状](https://hedzr.com/c++/algorithm/about-legal-calendar-p1/)
2. [历史源流](https://hedzr.com/c++/algorithm/about-legal-calendar-p2/)
3. [依赖于天文的时间标准](https://hedzr.com/c++/algorithm/about-legal-calendar-p3/)
4. [依赖于物理量的时间标准](https://hedzr.com/c++/algorithm/about-legal-calendar-p4/)
5. [授时与授时服务](https://hedzr.com/c++/algorithm/about-legal-calendar-p5/)
6. [历法相关](https://hedzr.com/c++/algorithm/about-legal-calendar-p6/)

> NOTE: 且等后面几日挨个整理完毕后发出来



无法全面收集和罗列，因为这是个庞然大物。

不过关于农历计算，确实可以在已有的框架下做概略计算，一次性算出几百上千年也可以，只是说这不能因应地球、太阳系乃至银河系的运转变化而已。

这么一来，就更加是个大问题了，所以这应该是一个国际性组织来解决的问题。



## 零星关键词





时间

时区

历法



时区：

夏时制，夏令时



国际标准 ISO 8601

ISO 8601 定义了日期和时间的数字化表示方法。这个表示方法主要决定了显示样式。

年份由4位数字组成YYYY，或者带正负号的四或五位数字表示±YYYYY。以[公历](https://zh.wikipedia.org/wiki/公历)公元1年为0001年，以公元前1年为0000年，公元前2年为-0001年，其他以此类推。

月份、日期用两位数字表示：MM、DD。

日期扩展格式：使用短横线“-”间隔开年、月、日。

日期基本格式：只使用数字。



授时服务

NTP，SNTP，









:end:

