---
layout: single
title: 'print/println function'
date: 2023-02-25 00:07:11 +0800
last_modified_at: 2023-02-25 00:29:11 +0800
Author: hedzr
tags: [golang]
categories: golfing
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-1.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Golang builtin functions ...
---

关于 Golang 自带的 println 以及 print 函数，在这里有相应的说明：

<https://go.dev/ref/spec#Bootstrapping>

Current implementations provide several built-in functions useful during bootstrapping. These functions are documented for completeness but are not guaranteed to stay in the language. They do not return a result.

```
Function   Behavior

print      prints all arguments; formatting of arguments is implementation-specific
println    like print but prints spaces between arguments and a newline at the end
```

Implementation restriction: `print` and `println` need not accept arbitrary argument types, but printing of boolean, numeric, and string [types](https://go.dev/ref/spec#Types) must be supported.

按照其说明，这些内建函数保证布尔量、数字、以及字符串的正确输出，而对于其他的类型则较为随心所欲。

在这里有一些相关的讨论：

<https://stackoverflow.com/questions/14680255/difference-between-fmt-println-and-println-in-go>

我们给出的例子是这样的：

```go

package main_test

import (
	"fmt"
	"io"
	"testing"

	"gopkg.in/hedzr/errors.v3"
)

func TestPrintln(t *testing.T) {
	var err = errors.New("OK").WithErrors(io.EOF)

	println(err)
	println(io.EOF)

	fmt.Println(err)
	fmt.Println(io.EOF)

	print("An old falcon\n")
	println("An old falcon")

	vararg(56, 7)  // model prints
	vararg2(56, 7) // primitives directly

	// fmt.Printf("%+v", err) // prints with stacktrace info
}

func vararg(args ...any) {
	for _, v := range args {
		println(v)
	}
}

func vararg2(args ...int) {
	for _, v := range args {
		println(v)
	}
}
```

它的输出应该类似于这样：

```bash
(0x1158998,0xc00002a180)
(0x1157760,0x120ce50)
An old falcon
An old falcon
(0x11076c0,0x1156e20)
(0x11076c0,0x1156e28)
56
7
```

原因就没什么好解释了。

数据的解读，尤其是复杂类型，例如第一行的对应于 error 对象的输出内容的含义是这样的：

两个数字构成了一个 pair。前一个数字代表着资源编号，后一个数字代表着对象的内存地址。

所谓资源编号，是我的一个随机制造的词语。对于 eface 数据来说，这个数字是 `eface._type` 的 hex 表达；而对于 iface 来说，它是 `iface.tab` 的 hex 表达。由于这个话题涉及到 golang 源码中的内部数据结构问题，所以深究其意义在本文中是没意义的——你只需要知道这是个内部使用的资源编号就够了。

所以 println 函数的输出带有很大的草率性，它不适合于被用在 dump 复杂类型对象的可阅读文字值的场所，而是适于内部开发人员调试而用。

对于绝大多数常规性的开发来说，你应该使用 fmt.Printf 或者各种基于其上或者 fmt.Fprintf 的变种包装。大多数 logger 库都是如此。



## REFs

如果有兴趣研究 Golang 源码，print/println 的实现部分在这里：

<https://github.com/golang/go/blob/a1e9148e3dbb20a18e0139583e7d835cc7a820bf/src/runtime/print.go>





🔚