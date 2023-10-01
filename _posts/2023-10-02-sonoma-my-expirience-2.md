---
layout: single
title: '关于 Sonoma 的体验: golang'
date: 2023-10-02 08:00:00 +0800
last_modified_at: 2023-10-02 10:33:00 +0800
Author: hedzr
tags: [macOS]
categories: lifestyle review
comments: true
toc: true
header:
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(255, 255, 255, 0.5)
excerpt: >-
  Sonoma 比较稳定，但 golang 编译器有大堆不适 `ld warning -bind_at_load`...

---



## 状况

目前 golang 1.20 或者 1.21 有大量问题出现，基本上都是因为和 Apple clang 的不适配而产生的。其中一些只是多出了警告信息，可以不必理会，但有的信息能够导致 go test 最终得到失败结果，哪怕你的单元测试全都没错。例如：

```bash
ld: warning: -bind_at_load is deprecated on macOS
```

一开始，我根本不知道原因，所以去搜 Sonoma 相关，几无所获。后来偶然变换关键词，结果在 go.dev 得到了一些提示。比方说这里：

<https://github.com/golang/go/issues/61229>

罗列了大堆可能获知的警告信息：

```bash
ld: warning: -bind_at_load is deprecated on macOS

ld: warning: search path '/usr/local/lib' not found

ld: warning: ignoring duplicate library '-lm'

ld: warning: '.../go.o' has malformed LC_DYSYMTAB, expected 92 undefined symbols to start at index 15983, found 102 undefined symbol
```

它们会不同程度地影响到你的 golang 编译结果、运行和测试结果。

有的案例存在一些 workaround，但当我一一检视后难免失望，因为基本上都是伤筋动骨的手法，并且条件苛刻；又或者该手法会产生额外的副作用。至少对于我来说，结论是尚无可行的办法避开上面存在的问题。

按照 go.dev 的里程碑安排，这些毛病将在 go1.22 发布时得到解决，实际上也就是编译器对上述警告直接略过就好。但是有的等了，因为按照 golang 发行策略，1.22 应该等到明年 2月份才会发布。只是不知道少数已经修复的 issues 会否被最近的 1.21 patch 所优先发布出来。

> 已有一些和 Sonoma beta Xcode 15 beta 相关的修订已经被合并到 1.21 主线并且发行了，例如 `cmd/link: use symbol-targeted relocation for initializers on Mach-O` 等等。



## 后记

目前，我只关心稳定性。

好孩子不折腾。

golang bug-tracing board：

- <https://go-review.googlesource.com/c/go/+/503538>
- <https://go-review.googlesource.com/c/go/+/503935>
- <https://go-review.googlesource.com/c/go/+/505415>
- <https://go-review.googlesource.com/c/go/+/502616>

其它 Sonoma 环境暂时没有发现状况，总体来说很稳定，比上三个大版本稳定多了，对于我来说。

## 🔚



