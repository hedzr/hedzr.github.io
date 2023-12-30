---
layout: single
title: '两个 Golang 无锁编程技法 [再续]'
date: 2023-12-30 05:00:00 +0800
last_modified_at: 2023-12-30 08:00:00 +0800
Author: hedzr
tags: [golang, nolock]
categories: golang nolock
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20231026110402900.png
  overlay_image: /assets/images/unsplash-image-3.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  不谈加锁及其避免，谈谈削减频繁小内存分配思路 ...
---

## 两个有用的无锁编程技法 [再续]

接续上回的 [两个 Golang 无锁编程技法](https://hedzr.com/golang/nolock/two-nolock-skills-in-go/) 和  [两个 Golang 无锁编程技法 [续]](https://hedzr.com/golang/nolock/two-nolock-skills-in-go-2/) ，接下来讨论一下小内存的大量、频繁分配带来的问题及其优化思路。前两篇投身于锁和它的轻量化，衍生出来的技巧的基本上是采用以空间换性能的想法，通过制造共享数据的副本，仅在必须的时刻才回写。

例如 Entry 模式的后果就是带来大量的小块内存的分配。这对于高频交易肯定是膨胀的代价，难以接受。而像 Swap 技巧需要将数据先复制、再修改、然后再回写，这能缩短加锁时长、减小锁定面积，但 contents 尺寸很大的时候显然就难以忍受了。

所以这些场景就受到限制，它们不是万能技能。

在轻度受限的场景强行使用这些技巧，或者使用类似的思路，或者你的场景面临着同样的小内存分配问题，例如大量小字符串的场景，以上这些情况就提出了辅助手段：

1. Golang 专用：借助 sync.Pool 复用缓冲区
2. 一次性分配大块内存，自行管理小块内存的分配与回收
3. 使用资源池，仅取用小对象和回收之，而不分配它
4. 使用 AppendXXX

可能这里并不能罗列全部，以后整理脑瓜子了再继续。



### 借助 sync.Pool 复用缓冲区

sync.Pool 是一个单个类型对象的复用技术。它解决的问题是 Entry 模式这样的场景：以 Logger 开发需求为例，Entry 会包装一个用于格式化字符串的缓冲区，然后将用户的 Attributes 以及 Message 格式化后写出到输出设备。

所以 Entry 可以利用 sync.Pool 来管理这个用给格式化的缓冲区。就像这样子：

```go
var printCtxPool = sync.Pool{New: func() any {
	return newPrintCtx()
}}

func newPrintCtx() *PrintCtx {
	return &PrintCtx{
		buf:      make([]byte, 0, 1024),
		noQuoted: true,
		clr:      clrBasic,
		bg:       clrNone,
	}
}

type PrintCtx struct {
	buf      []byte
	// ...
}

//... codes for printCtx ignored

// The logger struct
type logimp struct {
  *entry
}

type entry struct {
  // ...
}

func (s *entry) print(ctx context.Context, lvl Level, timestamp time.Time, stackFrame uintptr, msg string, kvps Attrs) (ret []byte) {
	pc := printCtxPool.Get().(*PrintCtx)
	defer func() {
		printCtxPool.Put(pc)
	}()

	// pc := newPrintCtx(s, lvl, timestamp, stackFrame, msg, kvps)

	// pc.set will truncate internal buffer and reset all states for
	// this current session. So, don't worry about a reused buffer
	// takes wasted bytes.
	pc.set(s, lvl, timestamp, stackFrame, msg, kvps)

	return s.printImpl(ctx, pc)
}
```

上面的节选代码（hedzr/logg/slog，暂未发布）展示了 logger's entry 怎么将潜在公共数据包装到 PrintCtx 之中，然后通过 sync.Pool 缓存这些 *PrintCtx 对象。如果存在并发请求，同时有多个 go routines 发出了 log.Info 这样的日志输出请求，那么 sync.Pool 会分别为每个请求分配出相应的 PrintCtx 对象，这些对象在输出完成之后被归还到 sync.Pool 的内部池中，下一次请求时就会被再次复用。

没有进一步贴出的代码（`pc.set()`）还包括在拿出 PrintCtx 对象时将其 buf 清零（但并不释放其已分配的空间）。这是为了让每次日志输出时格式化结果不会混淆。

在我们的实现中，entry 这个结构体实现了 Entry 模式。你可以任意创建顶级 Default() Logger 的子 Logger，这些 children and siblings 彼此之间互不干扰。除此而外，内部代码也多次临时地使用子 Logger 的方式来叠加一些临时状态，同样地新的临时对象也不会和原始 Logger 互相干扰。

有必要强调的是，sync.Pool 起到了防止频繁分配对象的作用，只有当并发请求更多时才会 New 出新对象。

如果你总是借助于 sync.Pool 做单输入单输出，那么下面的泛型函数能够帮助你：

```go
func Pool[T any, Out any, In any](generator generatorT[T], cb func(T, In) Out) func(In) Out {
	pool := sync.Pool{New: func() any { return generator() }}
	return func(in In) Out {
		obj := pool.Get().(T)
		defer func() {
			if r, ok := any(obj).(interface{ Reset() }); ok {
				r.Reset()
			}
			pool.Put(obj)
		}()
		return cb(obj, in)
	}
}

type generatorT[T any] func() T
```

使用它的方式是：

```go
var objHelper = Pool[](newBuf, func(buf *Buf, txt string) []byte {
	buf.buf = append(buf.buf, txt...)
	return buf.buf
})

func newBuf() *Buf { return &Buf{} }

type Buf struct {
	buf []byte
}

func run() {
	buf := objHelper("hello")
	fmt.Printf("Buf: %v\n", buf)
}
```

这会省却不少事。

遗憾的是 Golang 泛型无法支持 varidic parameters，所以上面的 Pool 只能单输入（here is string）单输出（here is []byte），而不能有多个输出，例如（ctx context.Context, lvl Level）之类。

所以面对一个残缺的泛型，我只能说想说爱你并不容易。

能不能通过高阶函数解决这个问题呢？

我稍微尝试过，不行。

但那可能只是我尝试的粗糙，或许以后找个时间认认真真设计一下，或许就行了呢。



### 一次性分配大块内存，自行管理小对象分配和回收

这个技术，在 Golang 基本上不可能实现，或者说相当难过。你需要手动管理 unsafe.Pointer 的方式来处理一块内存。但由于 Golang 不支持 C/C++ 那样的内存提取方式，所以你要放入和抽出数据实体都需要非常小心，以免导致错误放置。

但在 C++11 之后，这个技术能够很有效，编码也非常典雅。

这里不做示例了，标题已经完全体现了算法的核心思想。



### 使用资源池

sync.Pool 实际上干的就是资源池的事情。

但它的问题在于 sync.Pool 是按需分配的，这对于高频交易并不友好。

传统的连接池做的方案是预先分配例如 500 个连接对象，然后随取随用。如果并发请求超过 500 那就返回连接池忙的错误。

类似地，工作线程池等场景都是相似的方案。

在 Golang 中借助于诸如 WaitGroup 等的方式可以自行实现这样的资源池，难度不大，所以本文点到为止，xxxx。

有时候，你也可以变相地利用 sync.Pool 来预先分配若干实例，方法也不困难：

```go
var pool = sync.Pool{
  New: func() []byte {
    return make([]byte, 0, 4096)
  }
}

var tmp [200][]byte
for i:=0; i<200; i++ {
  tmp[i] = pool.Get().([]byte)
}
for i:=0; i<200; i++ {
  pool.Put(tmp[i])
}
tmp = nil
```

惟其难免有点弱智。



### 使用 AppendXXX

在 Golang 新版本中，很多包中添加了 AppendXXX 函数集。

例如 bytes.AppendInt/AppendFloat/..., fmt.AppendFormat(...) 等等。

它们的用处在于在既有的缓冲区中追加数值，而不是新分配一个缓冲区来格式化数值，然后合并两个缓冲区。

比较两种做法：

```go

func f1() {
	var buf = make([]byte, 0, 1024)
	buf = strconv.AppendBool(buf, true)
	buf = strconv.AppendInt(buf, 1, 10)
	buf = strconv.AppendQuoteRune(buf, 'V')
  println(string(buf))
}

func f2() {
	var buf string
	buf = buf + strconv.FormatBool(true)
	buf = buf + strconv.Itoa(1)
	buf = buf + string('V')
	println(buf)
}
```

f1 显然性能更好，使用资源（内存和CPU）的效率也更高。

这也是当前 Golang 中处理小字符串的通行办法。而且 buf 这个变量还可以使用 sync.Pool 略加复用，从而进一步提高复用程度，减少分配数量。

### pprof 观察 allocs

在性能调优阶段，可以通过 Profiling 观察对象分配次数，以此手段来帮助解决小内存分配问题。

我以前旧文曾经探讨过 Profiling 和 pprof 有关的内容。这里就不想重复了。



## 后记

放飞自我时间到！

还是不要飞这一次。



### REFs

完全是个人经验，所以连命名也都是自己命的，也就没什么外部参考了。

或者，也可能是有的，但我都说了，冷的手脚都僵了不是，就不找了。



🔚