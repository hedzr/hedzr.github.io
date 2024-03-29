---
layout: single
title: 'gochecknoinits - init() 是不是真的很要不得'
date: 2022-04-10 05:00:00 +0800
last_modified_at: 2022-04-10 13:55:00 +0800
Author: hedzr
tags: [golang, lint]
categories: golang lint
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220202111728058.png
  overlay_image: /assets/images/unsplash-image-3.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  关于 lint 时遇到的 ...
---



## 不能使用 init() 吗



最近一段时间，较多改用 golangci-lint 工具。这是因为 golint 已经停止维护了，所以面对不断释出的 golang 新版本，就必须对各类辅助工具同步进行更新。比如说 gofmt 时不时有点不妥了，gocyclo 认不得泛型语法了，等等。很多工具目前尚未有新版本发放，GoLand 也总是爱崩溃了，所以面对 go 1.18 来讲，问题还很多。

言归正传，使用新的 lint 工具，很多报错，基本上都是 Effective Go 一文中提及的各类不良味道。

其中 gochecknoinits 错误就是一条。

报错是这样的：

```bash
diff/v/a.go:3:1: don't use `init` function (gochecknoinits)
func init() {
^

```

对应的源码是这样的：

```go
package v

func init() {
	println("a.init")
}

var A int
```

### 消除这个错误

使用 nolint 注释可以消除这个错误：

```go
package v

func init() { //nolint:gochecknoinits
	println("a.init")
}

var A int
```



### 研究这个错误

那么，它是不是真的是个错误呢？

对于我们的代码，在 init 函数中做一些全局性的初始化，令其集中到一处，有若干好处：

1. 比较于全局变量在声明处就地赋值来说，init() 能够正确约束初始化顺序，这一点有时候是我们所必需的
2. init 能够提供复杂的初始化逻辑，从而不必受制于变量声明并赋值的语法
2. 在变量声明时使用一个函数调用来给付初值，有可能是另一种滥用：你可以会不能觉察到沉重的初始化延迟是来自于不恰当的初值构造。但如果使用 init 的话，通常更容易警醒于此。

这些好处不见得是必然的、必需的，我们总是可以有多种方法来改写代码越过限制。

所以说 init() 如此的有用，怎么就成为了 bad smell 了呢？

反对者们是这么说的：

因为 init() 的用途本质上就是初始化全局变量，而良好的代码习惯是尽可能别要用全局变量，所以顺理成章地也就不应该使用 init()。这不难理解，对吗？

为何不应该使用全局变量呢？按照 Golang 创始人之一的说法是，避免边际效应，不要使用包级别的全局变量。

> \- no side effect imports
> \- no package level variables

所谓边际效应，其实是指全局变量被在 init 中被以各种潜在可能的方法进行初始化，这可能会导致变量的值被意外地设定到非预期的状态。这一点比较麻烦，得是要多么无理才会写出那么奇葩的代码序列吖。然而，Deve Cheney 的话也并不尽然是危言耸听。

此外，由于变量的初始化被转移到了 init 函数体中（甚至于进一步地迁移到某些子函数中），它的声明处的代码就无法体现出正确的变量状态，你必须在整个包中翻拣全部的 init 函数，以及全部相关的子函数调用，才能查证到该变量究竟会得到一个什么样的初值。从这个结果来说，把 init 看作是不良代码习惯也不算太冤枉。

话说回来，用对了，就是好刀；用错了，难免就会割到手。



### 结论

所以对于终端开发者来说，避免 init 基本上是正确的态度。顺便，也避免滥用全局变量。

但是对于库作者来说，嗯，是的，说的就是我自己，那么该用就用，最多不过加条 nolint 注释也没什么大不了的。

> Why?
>
> 库作者知道自己在干什么，也知道自己该干什么，所以他有权利变废为宝。





### 后话

除了 gochecknoinits 之外，还有一个 gochecknoglobals ，大家是差不多的，就不再另文了。

另外，更恰当的消除方案是配置一个久经考验的 golangci 配置文件。这一方案，或许我会在以后的文章中提出一份参考，目前来说先放一放吧。



### REFs

- [Go: No globals, no init functions (leighmcculloch.com)](https://leighmcculloch.com/posts/tool-go-check-no-globals-no-inits/)
- [Is it really bad to use init in go? - Stack Overflow](https://stackoverflow.com/questions/56039154/is-it-really-bad-to-use-init-in-go)





🔚