---
layout: single
title: 'go.work 在开源库开发中的运用'
date: 2024-02-03 05:00:00 +0800
last_modified_at: 2024-02-03 13:55:00 +0800
Author: hedzr
tags: [golang, arch]
categories: golang arch
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220202111728058.png
  overlay_image: /assets/images/unsplash-image-3.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  嵌套 go.mod 的新方法 ...
---



Golang 的工程结构组织一直以来都非常难过。

基本上你只能采用单个的巨大无比的 monorepo 才能解决各种潜在可能的麻烦。

如果你曾经尝试过多种方案的嵌套、平级的 go.mod 组织，你才会知道我在说什么。为了解决这时候的各种问题，特别是当你有时候暂时不会发布 repo 到 github，或者你在使用私有 repo，或者公司域名，那么常常会在这些地方心力交瘁。

但麻烦不仅如此。当你在发布一个公共库的时候，按道理你应该有大量的 testcases，examples 附着在 repo 中，以便提供和证明这个公共库已经经过了严格的自我证明。但这就会在 repo 中引入意料之外的依赖关系。为此，我在发布公共库的时候根本不使用 testify，是我如此自矜吗。并非如此，我只是为了让依赖关系干净一点，特别是在一些时间节点之后大家都很关注代码的追根溯源、潜在的不合法的许可证依赖关系，此时引用第三方库几乎成了约定俗成的不可为的第三件事了。

嗯，第三件？Waht's first and second？我胡诌的。

解决的办法总是会有。比如建立第二个 repo，专为前一个库提供 examples，那就可以随便胡搞了。但是 tests 呢，没法，因为有时候 tests 需要在包内，不可能单开一个新的 repo。所以我基本上不使用 testify，实在忍不住时就临时手搓几个类似的 assertions 来用一用。

## 使用 go.work

但是通过嵌入一个 go.work 之后，examples 和 tests 就可以在同一个 repo 中以子目录的方式自行独立建立 go.mod 了。

这一方法的结构基本上是这么构成的。假设你有一个公共库 go-socketlib，它是一个 repo，其根目录和子目录结构框架如下：

```bash
$ tree .
.
├── _examples
│   ├── colored_slog.go
│   ├── go.mod
│   ├── go.sum
... ...
├── addons
│   └── cmdr
│       ├── README.md
│       ├── cmdr.go
│       ├── go.mod
│       └── go.sum
...
├── doc.go
├── go-socketlib.code-workspace
├── go.mod
├── go.sum
├── go.work
├── go.work.sum
...
```

而根下面的 go.work 包含这样的内容：

```go.work
go 1.21

use (
	.
	./addons/cmdr
	./_examples
)
```

就是这样。

用户在使用 go-socketlib 的时候，不会受到这个 go.work 的干扰，因为在这个 go.work 完全只负责自己的目录，不会溢出到目录结构之外。

由于该 go.work 的存在，在 examples 中引入的第三方库依赖关系不会再体现在 go-socketlib 的本体中，所以用户得到了一个干净的库引用，不必被 examples 所污染。

这就是我们想要的效果。



### 后话

看起来这是一个完美的解决方案。它只有一个问题，如果你的库在初期开发中，没有建立 github 上的 repo，更没有做一次推送，那么纯本地环境中你还是会遇到问题。尤其是当你在建立一整套系统架构时，不但有多个 apps，还有多个公共库，那么问题也会很复杂。

此时，go.mod 中的 replace 子句将是你的救星。尽管看起来龌蹉，但管用。一旦你进行了推送，就可以依次解除这些 replace 子句。当你正式发布全套架构后，应该摘除全部 replace 子句，以防止它们破坏 pullers 的构建环境，导致使用者下拉代码后无法构建。

早前（几年来）我一直设法达成本文想要达到的目标，想要无污染地形成潜逃 go.mod，为此做出过种种尝试，无一例外，都算是失败，除了 go 本身的支持方案缺失之外，各个 IDEs 的限制也是问题。曾经留下的记录在这个博客中也有记录，包括

... [嵌套 go.mod 有可能吗](https://hedzr.com/golang/nested-go-modules-is-it-possible) ...

等等，但到今天的方案为止，那些旧文虽不算错，但是确实过时了。目前 Goland 和 vscode 中本文的新的结构是可以工作的。

本文的要点在于，你要保证一个自包含的 root directory 之下，go.work 只负责自身及其子目录，那么所有问题就被协调了。

### REFs

[hedzr/go-socketlib](https://github.com/hedzr/go-socketlib) 是我首次践行这一方案的样本，实践的效果大体上还是满意的。你可以阅读源码相关部分，理解我所说的这种内嵌 go.work 管理嵌套 go.mod 的方案。





🔚