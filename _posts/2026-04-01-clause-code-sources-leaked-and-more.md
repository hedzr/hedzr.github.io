---
layout: single
title: Claude Code 泄露我所想
date: 2026-04-01 08:00:00 +0800
last_modified_at: 2026-04-01 09:00:00 +0800
author: hedzr
tags: [life, ai, leak]
categories: life style
comments: true
toc: true
header:
  overlay_image: /assets/images/bash-shell.png
  overlay_filter: rgba(255, 255, 255, 0.5)
excerpt: >-
  随意想想……
---

## Claude Code 源码泄露事件

### 原始信源

[Claude Code’s source code has been leaked via a map file in their NPM registry](https://www.hndigest.com/m/RbztJyVBMsODLoST_v9B2w==/s/613237)[twitter.com | points: 1786 | comments: 878](https://www.hndigest.com/m/RbztJyVBMsODLoST_v9B2w==/c/613237)

![image-20260401095756200](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/upgit/2026/04/20260401_1775008681.png)

>Chaofan Shou / @Fried_rice
>
>https://x.com/Fried_rice
>
>Claude code source code has been leaked via a map file in their npm registry!  Code: [https://pub-aea8527898604c1bbb12468b1581d95e.r2.dev/src.zip](https://t.co/jBiMoOzt8G)
>
>![Image](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/upgit/2026/04/20260401_1775008630.jpeg)
>
>[4:23 PM · Mar 31, 2026](https://x.com/Fried_rice/status/2038894956459290963) **25.1M** Views



### 时间线

- 2026-03-31 凌晨：Anthropic发布Claude Code v2.1.88版本。
- 2026-03-31 凌晨：npm包中意外包含57-60MB的cli.js.map（Source Map文件），任何人安装该版本即可完整还原所有TypeScript源码。
- 2026-03-31 08:23：安全研究员Chaofan Shou (@Fried_rice) 在X上首发披露，附带src.zip下载链接，帖子迅速破百万浏览。
- 上午10点后：GitHub上出现多个镜像仓库，星标几小时内从0冲到2万+；系统提示词、Undercover模式、权限系统等核心逻辑被迅速提取。
- 目前状态 04-01 07:xx：Anthropic刚刚推送了修复版本并撤销了v2.1.88，但镜像和解读已经独自存活。



### 之我见

对于 Claude Code 来说，这可能是个意外，也可能是一个莫测的局。

即使这是个意外，CC 也能够很轻易地消弭负面分数。既然它们原本掌控着 CC 源代码前后端的整体架构，那么调整 cli 前端的实现架构也是一件很轻松的事情，因为这一部分子系统的占比大概也只有整体架构的 10% ~ 20%，应该不可能更多了。

如果我是 CC 掌门人，CLI 前端正进行一次翻江倒海的全面重构，并且这个重构的流程实质上已经开始了数月，并且到达了稳定的状态，只需要给予一定的时间进行沉淀。那么此时旧版本最后一次发布增量更新版，却发生了泄露，又有什么可怕的呢？或者这正是有意而为之，正是为了要期待竞争对手误判，指导他们走向错误的方向，这种可能性大不大呢。

无从判定，内幕太少，烟雾甚多。



### AI，AGI

作为自以为掌握了编码与架构这件事的整体精髓的人，我不认为现阶段的 AI 是 AI。这只不过是又一个劣币驱逐良币的例证。

2005-2017 年间，NLP 技术得到了长足的发展，这时候没有学者敢于将其拿出来冠以 AI 之名。后来，突然就如此了，这是多方面因素导致的：商人，如黄等，需要卖显卡，政客，需要发起新的军备竞赛来诱导东大解体，等等。

> 上述时间段是一个概数，没有查证确切。本来就只是随想。

这就是现在这些“AI”的背景。

它们并不是一无是处，70 分的伪 AI 给你提供的“伪”建议还是像模像样地具备一定的参照性的。上世纪 90 年代的蚁群思想，现在也被无人机规模化军事 AI 所使用，用来更富有效率地杀人，挺好的——必欲使其疯狂。这种蚁群思想，实际上是衍生于六七十年代的群体智慧理论，只是在九十年代因为一些原因而被大众所知。

但是，获得这 70 分的代价就不正常了，电力、算力、社会成本等等。

当你意识到作为意识的唯一代言人，人类，它们的大脑的功率仅仅是数瓦特的功耗的时候（即使爱因斯坦的脑功耗大约也只不过是这个挡位），你才会明白现阶段这些“AI”们，以及种种相互蒸馏的复制品们，统统都是笑话。现阶段的研究表明，人类大脑的功耗大概在 20W 以内，其中约 9W 以热量形式耗散，皮层灰质约 3W，其余能量才是大脑思考和记忆储存所需。

“涌现”，是最可笑的用词。可惜了这么好的一个词，它的本意是指超出意料的收获。但在 AI 大模型里面，它成了你不知道如何发生的，我也不知道如何发生的，但我们需要一个说法，我们需要创造一个新词来 cover 这些尴尬的状况，的遮羞布。

可怜！



























