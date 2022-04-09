---
layout: single
title: '在 Go 中实现更好的埋点日志功能'
date: 2022-04-09 05:00:00 +0800
last_modified_at: 2022-04-09 13:55:00 +0800
Author: hedzr
tags: [golang, logging]
categories: golang logging
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220409105705674.png
  overlay_image: /assets/images/unsplash-image-3.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  埋点日志，与库作者谈研发 ...
---



## Golang 埋点诊断功能



研发一段代码之后，我们需要测试和调试它。

关于 Golang 测试此前我已经有过一些角度的探讨：

Golang 的调试功能是指主程序处于运行状态下的追踪，断点等特性，这会典型地使用两种方式，一种是使用 dlv 的支持在源码特定位置打断点，然后观察变量值，研究分支线路等等，这是一种侵入方案，由于断点挂起了应用程序的执行，所以对于连续性业务可能是不适当的，特别是网络通讯任务采用断点调试方法时会有很多局限。所以另一种方式则是埋点诊断。

### 埋点诊断

埋点诊断的意思是指，在开发阶段我们嵌入很多日志语句来显示特定场所的状态。显示日志会带来少许的性能损耗，但这可能是我们精确观察程序运行状态的唯一方法，尤其是对于连续性业务来说。

所以说，埋点诊断，不就是打日志么？

是，又不那么单纯。何解？当软件包被释出时，这些诊断或者日志输出语句能否被自动地、彻底地去除，如同 C++ 中的宏 ASSERT/DEBUG 那样完整地被消除，这就是一个问题了。

埋点的首要问题，在于日志语句应该尽可能地减小损耗，例如复杂沉重的状态计算应该被避免，你应该仅打印那些简单运算即可得到的内容，尤其是直接打印出上下文变量的值，而不是在这个基础上附着太多的额外运算。

其次来讲，包含两种类型的日志输出语句：一种是在生产环境中也要保持输出的语句；一种是在生产环境最好能被消除的语句。

较为典型的异地案例是，你在做一个高性能的库，例如 ringbuf，那么开发时你肯定希望有足够多的输出来展示你的内部指针在如何变化，但当你发布这个库之后，这些日志输出语句就应该被从源码中彻底移除。这不是在采用通常的日志库中的日志级别的问题，我是在描述说这些语句必须被完全删除，想象这是一个高频交易，1s 会有百万级乃至于更高的调用次数，此时 log.Debug 这种语句需要完全不存在。

这就好像 C++ 的 ASSERT/DEBUG 宏，我们常常会设计、编写这样的宏，无论它原本有没有，这种 DEBUG 宏在调试版程序中会打印出日志，而在正式版中由于 C++ 预处理变换的关系它就根本不存在了。

可以办到吗？在 Golang 中，这不算太容易。但也并不难。知识的隔膜，就如同一张纸：Golang 中可以使用 buildtag 来达到该目的，只不过实战效果上有少许的不同，但关键性的目的——正式发布版中没有埋点日志输出——还是达到了。



### 实现方法

下面解释我们所设计的这个体系：

1. 有一个 VDebugf() 函数
2. 它具有两个版本，一是当 `--tags=verbose` 定义时，VDebugf 会打印输入参数；二是正常情况下，VDebugf 具有一个空函数体

其代码如下面两个文件：

`file=logger.vf.funcs.go`

```go
//+build !verbose

package log

// VTracef prints the text to stdin if logging level is greater than TraceLevel
func VTracef(msg string, args ...interface{}) {
	//logger.Tracef(msg, args...)
}

// VDebugf prints the text to stdin if logging level is greater than DebugLevel
func VDebugf(msg string, args ...interface{}) {
	//logger.Debugf(msg, args...)
}
```

以及 `file=logger.vt.funcs.go`

```go
//+build verbose

package log

// VTracef prints the text to stdin if logging level is greater than TraceLevel
func VTracef(msg string, args ...interface{}) {
	logger.Tracef(msg, args...)
}

// VDebugf prints the text to stdin if logging level is greater than DebugLevel
func VDebugf(msg string, args ...interface{}) {
	logger.Debugf(msg, args...)
}
```

在这里需要向你强调（而非证明）的是，Golang 编译器具有这样的特性：它能够较为智能地进行编译优化，输出经过优化后的机器码，除非你指明了 debug 参数。这种智能包含函数尾递归，deadcode，无调用过的函数，包内未调用过的 go 文件，以及，最重要的一个：空包体的函数。

空包体的函数会被彻底从机器码序列中移除，我不必向你证明，你可以自行去 compilerexplorer 尝试 go 代码编译并观察其汇编语言输出，或者自己在本地做 go build -S 并验证这一说法。

这是个事实。

所以，如果你需要 VDebugf 函数输出日志可见的话，带上 `--tags=verbose` 去运行或调试你的 app 就可以了，而在正常情况下它就是不存在的。

#### 例外情况

尽管编译器能够优化掉 VDebugf 函数，但你需要注意在 go test 场景中，即使是空包体的函数也可能并不会被移除，这导致该函数调用中的入参计算依然会被执行：

```go
			log.VDebugf("[ringbuf][GET] cap=%v, qty=%v, tail=%v, head=%v, new head=%v, item=%v", rb.Cap(), rb.qty(head, tail), tail, head, nh, toString(item))
```

在这个例子中，rb.Cap(), rb.qty() 等等调用在测试流程中仍将被计算。

如果想要进一步避免多余的计算，可以考虑我们在 [hedzr/log](https://github.com/hedzr/log) 中为 VDebugf 准备的布尔常量 `VerboseEnabled`。所以上面的代码可以被改写为：

```go
		if log.VerboseEnabled {
			log.VDebugf("[ringbuf][GET] cap=%v, qty=%v, tail=%v, head=%v, new head=%v, item=%v", rb.Cap(), rb.qty(head, tail), tail, head, nh, toString(item))
		}
```

于是，在测试执行过程中，入参也不必发生不必要的计算行为了。并且你也不必担心多余得到 if 测试：

由于该 if 测试在一般情况下总是 `false` 分支，因而它也将被编译器所优化。



#### 就使用 `if VerboseEnabled` 岂非就够了？

发生这样的想法不奇怪。何须 VDebugf 什么空包体呢，既然 VerboseEnabled 为 false 时分支就会被优化掉的话。

实际上，一般情况下不需要使用额外的 if VerboseEnabled 测试，因此能让你编码更轻松一点点，所以如果你喜欢，可以总是使用 if 测试，但也可以简单地 VDebugf 即可，按需取用就好了。







### 有何用处

这个特性对于开发 golang 的第三方库非常有用。

所以我在 [hedzr/log](https://github.com/hedzr/log) 中内置了这一基础特性，并在 [hedzr/evendeep](https://github.com/hedzr/evendeep) 中正式采用这一方案。

![image-20220409105705674](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220409105705674.png)

在 evendeep 的功能包 dbglog 中，使用了如图示的接驳方案来调用 hedzr/log 中的日志输出接口，而不是直接使用 log.VDebugf，这是为了将来能进一步剥离到 hedzr/log 的依赖。但和直接使用并无什么区别。

#### veryquiet

值得一提的是，我也同时在 [hedzr/log](https://github.com/hedzr/log) 中包含另一种相反的策略，即 veryquiet。其骨干代码如下：

`file=logger.funcs.go`

```go
//go:build !veryquiet
// +build !veryquiet

package log

// Tracef prints the text to stdin if logging level is greater than TraceLevel
func Tracef(msg string, args ...interface{}) {
	logger.Tracef(msg, args...)
}

// Debugf prints the text to stdin if logging level is greater than DebugLevel
func Debugf(msg string, args ...interface{}) {
	logger.Debugf(msg, args...)
}
```

以及 `file=logger.funcs.quiet.go`

```go
//go:build veryquiet
// +build veryquiet

package log

// Tracef prints the text to stdin if logging level is greater than TraceLevel
func Tracef(msg string, args ...interface{}) {
	// logger.Tracef(msg, args...)
}

// Debugf prints the text to stdin if logging level is greater than DebugLevel
func Debugf(msg string, args ...interface{}) {
	// logger.Debugf(msg, args...)
}
```

也就是正常时输出，带上 `--tags=veryquiet` 时闭嘴。





### 关于 go build 的特性

golang go build 包含这样几个特性：

1. 编译时会做以函数为单位的使用记录，没有用到的函数会被排除

2. 编译函数时会进行一定程度的路径检查，不可达的代码、条件分支、条件表达式求值可能被优化掉。

3. _test.go 的代码在 go build 产生执行文件或者二进制库时被排除

4. 对函数的调用会被优化：

   1. 如果被调用函数没有局部变量，那么它无需发生栈帧扩张，也就是说此时的栈帧检查代码是没有必要的，将被略掉。通常函数入口包含栈帧检查序言，目的是防止栈的成长破坏堆的空间、或者下降到栈所在内存页面的偏移0导致栈溢出 fatal 异常。

   2. 如果函数的内容经过优化后成为了空函数，也就是说如果函数只有 ret 返回指令，那么对函数的调用语句（甚至于在调用点的函数入参准备语句）将被完全优化。

      意思就是，这个函数的调用全数都被摘除掉了。

      但是函数自身还存在，哪怕只有一条 ret 指令。

   3. 尾调用（Tail Call）时，caller 的栈帧被提前释放，这样就允许支持更多的嵌套函数调用层级。特定情况下，caller 栈帧并不提前释放，而是被直接用做 callee 的栈帧，也就是说 callee 的栈帧 prologue and epilogue 被完全省却。

   4. 尾递归（Tail Recursion）时，递归函数内部会改为循环方式而不会进行递归函数调用，倒是不知道这个优化是从哪个版本开始的。

   5. 有的函数可以被 inline 掉

5. 如果一个包会被用到，该包中任何文件中的 init() 都会被触发。

6. If false 分支会被完全移除

7. 条件表达式具备短路特性：`if A && B ...` 这样的测试，如果 A == false 则 B 以及其后的表达式都不再会被计算。对于 `||` 连接，A == true 会导致短路

8. switch 具有较为复杂的优化策略

9. switch 和 if 有时候会被优化为跳转表（不太确定，但不做深入了）

对于编译器优化策略的技术理论感兴趣的朋友，可以重新学习编译原理，深入研究 llvm 项目。go 编译器的优化器部分，相对来说也是规模较小的，不过胜在还算是比较有活力就是了，例如早期版本是不支持尾递归优化的，现在不也就可以了。



### 真的需要关注底层吗

略



### REFs

- [https://github.com/hedzr/log](https://github.com/hedzr/log)
- [https://github.com/hedzr/evendeep](https://github.com/hedzr/evendeep)

哦，对了，evendeep 作为一个 dive-into-anything 库，还需要一些时日才能放出，这些天没有充分的时间去扣细节，敬请期待。



🔚