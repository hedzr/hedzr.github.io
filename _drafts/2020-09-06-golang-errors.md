---
layout: single
title: 'Golang errors 编程模型'
date: 2020-09-06 23:43:11 +0800
last_modified: 2020-09-06 23:43:11 +0800
Author: hedzr
tags: [errors, golang]
categories: golang errors
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-10.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Migrating to cmdr, One line is those you have to modify ...

#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---



# Golang errors 编程模型

> 

>
>
>
>
> 





## 结束语

还可以，写出来了这么多！

cmdr 提供的平滑迁移方案，说起来只是权宜之计。我们还是鼓励你直接采用我们新的流式调用方案，并直接利用 `Option Store` 来管理配置数据，而且充分利用这种方式提前完成配置参数表的设计（我们都会在一开始就建立配置文件的 yaml 格式，从而令配置参数具有更好的可读性，这也会从另一角度帮助你完善应用程序的架构和逻辑）。





🔚