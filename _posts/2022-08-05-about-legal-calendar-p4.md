---
layout: single
title: "关于历法的一系列知识整编 - P4"
date: 2022-08-05 00:00:00 +0800
last_modified_at: 2022-08-05 00:45:00 +0800
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
  历法知识整编 依赖于物理量的时间标准...
---

> [历法知识整编索引页](https://hedzr.com/c++/algorithm/about-legal-calendar/)

> 摘抄、整编，已尽力罗列来源。

## 与谐波振荡相关的时间标准

### 原子时

原子时（英語：Atomic Time，缩写：AT）是以原子的能级[跃迁](https://zh.wikipedia.org/wiki/跃迁)为基础建立的时间基准。由于原子的能级跃迁发出的电磁波频率稳定且容易复现，因此较通过地球自转和行星公转建立的时间基准更为准确和稳定。现今原子时的具体标准在1967年由第十三届国际计量大会确定，原子时中的秒长被定义为高度在[海平面](https://zh.wikipedia.org/wiki/海平面)上、处于零[磁场](https://zh.wikipedia.org/wiki/磁场)的[铯-133](https://zh.wikipedia.org/wiki/铯的同位素#铯-133)在[原子基态](https://zh.wikipedia.org/wiki/基态)下两个[超精细能级](https://zh.wikipedia.org/wiki/超精细结构)之间跃迁辐射9,192,631,770周所持续的时间，而起点则被定义为UT2的1958年1月1日0时。但事后比对发现，原子时在起始时刻与UT2实际相差了0.0039秒，即

![image-20220604075740714](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220604075740714.png)

采用其他类型的原子钟（如[铷](https://zh.wikipedia.org/wiki/铷)原子钟或[氢](https://zh.wikipedia.org/wiki/氢)原子钟）亦可定义出不同的原子时标准，广义的原子时也可指这类以原子跃迁的稳定频率为时间基准的时间系统。

#### 国际原子时

[国际原子时](https://zh.wikipedia.org/wiki/国际原子时)（法語：Temps Atomique International，缩写：TAI）的提出是为了消除通过不同[原子钟](https://zh.wikipedia.org/wiki/原子鐘)定义的原子时的不一致性，最初由[国际时间局](https://zh.wikipedia.org/wiki/国际时间局)在1971年建立。1987年国际时间局被裁撤后，TAI被交由[国际计量局](https://zh.wikipedia.org/wiki/國際計量局)维持。国际计量局每个月收集一次分布于全球约240台原子钟所给出的时间偏差，根据各原子钟的性能对其进行加权平均，经统一处理后得出高稳定度的时间尺度。

#### 协调世界时

[协调世界时](https://zh.wikipedia.org/wiki/协调世界时)（英語：Coordinated Universal Time，法語：Temps Universel Coordonne，缩写：UTC）是一类世界统一的时间与频率传输标准。现行的UTC由[国际电信联盟](https://zh.wikipedia.org/wiki/国际电信联盟)在2002年定义，并由国际计量局和[国际地球自转服务](https://zh.wikipedia.org/wiki/国际地球自转服务)共同维护。在该定义下，UTC与国际原子时的速率相同且数值上相差整数秒，与UT1的偏差则通过[闰秒](https://zh.wikipedia.org/wiki/闰秒)机制被控在0.9秒以内。

#### 卫星导航系统使用的原子时

[卫星导航系统](https://zh.wikipedia.org/wiki/卫星导航系统)使用的时间标准通常是由地面控制系统和[卫星](https://zh.wikipedia.org/wiki/人造卫星)中的原子钟共同维护的一类原子时，如[GPS](https://zh.wikipedia.org/wiki/GPS)使用的GPS时等。这类时间标准的初始时刻被定义为UTC下的某一时刻，频率则与UTC、TAI及国际单位制下的秒长相同。然而，由于维护TAI所使用的原子钟与卫星导航系统并不一致，实际上卫星导航系统使用的原子时的频率与UTC会存在微小的差别。另外，卫星导航系统使用的原子时通常不含闰秒，因此其与UTC的偏差会随着时间的推移逐渐增大。现行的各类卫星导航系统所使用的原子时及其初始时刻如下：

|                         卫星导航系统                         | 其时间系统的初始时刻（UTC） |
| :----------------------------------------------------------: | :-------------------------: |
| [全球定位系统](https://zh.wikipedia.org/wiki/全球定位系统)（GPS） |     1980-01-06 00:00:00     |
| [全球导航卫星系统](https://zh.wikipedia.org/wiki/全球导航卫星系统)（GLONASS） |                             |
| [伽利略定位系統](https://zh.wikipedia.org/wiki/伽利略定位系統)（Galileo） |     1999-08-22 00:00:00     |
| [北斗卫星导航系统](https://zh.wikipedia.org/wiki/北斗卫星导航系统)（BDS） |     2006-01-01 00:00:00     |



## 相关：秒的定义与测量

早期的计时系统并非是全球化的。

古代采用沙漏计时。

后来使用单摆，即各色式样的挂钟。其依据在于定长单摆的等时性，当然，应用早已有了，理论的完善则要等到伽利略。

>  [摆 - 维基百科，自由的百科全书](https://zh.m.wikipedia.org/zh-hans/%E6%93%BA) 

然而单摆受到纬度、高度制约，进一步地说，单摆来定义秒是不精确的。

故而精确的机械表采用高精打磨后的擒纵机构与齿轮组来实现不受地理条件影响的计时设备——各种机械表、怀表等等。

> [Mechanical watch - Wikipedia](https://en.wikipedia.org/wiki/Mechanical_watch) 

显然机械表的精度依然是有限的，所以后来采用晶振来定义秒。

晶振，即刻意精确切割的石英晶体，利用石英晶体的压电震荡特性，可以获得精确稳定的单秒来源。一般来说，会采用高精切割技术切割和打磨石英晶体，令其具有 32768Hz 的震荡频率，然后连接到电路中，并经过15级分频电路，即可得到 1Hz 的正弦波输出，经过整形电路后还可以得到相应的方波输出。这就是精确的 1 秒的来源了。

当然上述说法适用于石英表而不适合于电子设备，在电子设备中往往是采用更高基础频率，例如 16.7 MHz，然后根据实际需要进行必要的倍频。例如 Intel CPU 的时钟引入即是如此，在 CPU 内部有倍频电路来对晶振输入进行加倍。

晶振依然不是稳定可靠的秒的来源：一是受制于加工工艺，而是随着时间推移，石英晶体会发生老化、频率漂移等现象。

因此，目前的选择是采用原子时：

**国际原子时**（英語：International Atomic Time、法語：Temps Atomique International, **TAI**）是根据以下秒的定义的一种国际参照[时标](https://zh.wikipedia.org/w/index.php?title=时标（物理）&action=edit&redlink=1)， 属于[国际单位制](https://zh.wikipedia.org/wiki/国际单位制)。

1967年第13届[國際度量衡大會](https://zh.wikipedia.org/wiki/國際度量衡大會)上通过一项决议，定义一秒为铯-133[原子](https://zh.wikipedia.org/wiki/原子)[基态](https://zh.wikipedia.org/wiki/基态)两个超精细能级间[跃迁](https://zh.wikipedia.org/wiki/跃迁)辐射振荡9,192,631,770周所持续的时间。其起点为[世界时](https://zh.wikipedia.org/wiki/世界时)1958年的开始。



## REFs

- [原子鐘](https://zh.wikipedia.org/wiki/原子鐘)
- [時間和頻率轉換](https://zh.wikipedia.org/wiki/時間和頻率轉換)
- [網絡時間協議](https://zh.wikipedia.org/wiki/網絡時間協議)（以協調世界時的形式普及原子時）
- [天文钟](https://zh.wikipedia.org/wiki/天文钟)
- [深空原子鐘](https://zh.wikipedia.org/wiki/深空原子钟)
- [國際計量局(BIPM)的協調世界時(UTC)年度報告](https://www.bipm.org/en/time-ftp/annual-reports)
- [國際計量局(BIPM)的基準原子鐘年度評鑑](https://webtai.bipm.org/ftp/pub/tai/data/PSFS_reports/)







:end:

