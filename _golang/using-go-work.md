---
layout: single
title: 'Golang 中使用 go.work 管理多个 modules'
date: 2023-02-25 00:30:11 +0800
last_modified_at: 2023-02-25 00:45:11 +0800
Author: hedzr
tags: [golang]
categories: golang
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-1.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  记录一下方法 ...
---

## 方法

一个大型项目可能会有十数个分离的 libraries，分别都是 go module；同时还会有十数个 microservices，所以这些项目的完整布局实际上一直是个难题。

go.work 功能可以提供一种方案来管理它们。

假定已经建立了这样的文件夹结构：

```bash
/big-project
  /lib1
    go.mod
  /lib2
    go.mod
  /lib3
    go.mod
  /ms1
    go.mod
  /ms2
    go.mod
  /ms3
    go.mod
  go.work
```

那么 go.work 可以这么编写：

```go
go 1.18

use (
	./ms1
	./ms2
	./ms3

	./lib1
	./lib2
	./lib3
)
```

然后你照常进行开发即可。

那么此时 go.work 带来了哪些影响呢？

1. 上述六个 modules 之间的交叉引用关系（golang 代码中的 import）被 go.work 限定在本机磁盘目录之中，而不是去查询远程代码仓库服务器。

所以你修改了 lib1 之后，无需做 git commit 和 git push，在 lib2 或 ms1 中使用 lib1 的代码时就可以立即感知到前面的修改内容。

这就省却了大量无效的中间步骤，你不需要反复提交、推送，然后在引用 lib1 的 modules 中执行 go mod tidy 来获取代码更新。而且不需要反复 tidy 来搞清楚确确实实拖回了最新的代码。

但是注意，go.work 并不适用于你的协作伙伴，他想要 lib1 的最新版本的话，仍然需要你完成提交和推送，然后他再做 tidy 取回更新内容。

所以一个很重要的点是：将 `go.work*` 加入 .gitignore 中。

你不应该将自己的 go.work 文件分享给项目协作者，这么做无效、也无意义，反而可能打乱协作者的生活：某个协作者可能将 lib1 放在一个完全不同的文件夹中，那么你的 go.work 就破坏了他的私人结构了。

一句话；

`go.work` 适用于一个人需要同时维护相互关联的多个 modules 的情况。

所以，早前我曾经说，这个功能真的没什么趣味。不是说它完全没用。有时候它是有用的，甚至还很有用。但是大多数情况下它其实用不着，同时管理数个相互依存的 modules 的人还是并不多。此外有一些能够一肩挑的人，对于他们来说，又何必分那么多 modules 呢，简简单单一个巨无霸 monorepo 就是了。

对于复杂的大型项目来说，实际上可能需要更有力的武器来做管理。尽管有的时候有的人可能会认为将大型项目平铺为我们本文开头的所示意的文件夹结构就足够了。但事实上是这种方案太“平”了，远不足以描述复杂依赖的群组关系。我们其实是需要那样的文件夹结构组织能力的。





🔚