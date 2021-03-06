---
layout: single
title: 'Golang errors 编程模型 - Part I'
date: 2020-09-09 23:45:11 +0800
last_modified_at: 2020-09-11 20:32:11 +0800
Author: hedzr
tags: [errors, golang]
categories: golang errors
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-10.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Golang errors 最佳实践 ...

#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---



# Golang errors 最佳实践 Part I

> 这个系列的文章有一定的摘抄，来自于原文，也包括译文等等。
>
> 技巧总是被不断重复，本系列的目的是整合 Golang 错误模型，所以只好抄一些、编一些。

>系列被分为两个部分：
>
>[〇、目录页](/golang/errors/golang-errors/)
>
>[一、最佳实践](/golang/errors/golang-errors-1/)
>
>[二、辅助库](/golang/errors/golang-errors-2/) - [hedzr/errors](https://github.com/hedzr/errors)





## 一、Error 处理模型 - 最佳实践



### 我们讲 error 惯用模型时，是在说什么？

这是个很难措辞的东西。大体上讲，怎样避免为众人所诟病的那些 err 检测语句，避免不恰当地运用和使用各种和 error 对象构造、抛出、检测相关的编码手法，我们在下文中将其称作为 error 的处理模型的最佳实践，也算作是 error 相关开发的惯用模型。



#### 错误以及错误现场

为了提供错误现场的额外信息，我们通常会：

- 嵌入一条文字信息
- 嵌入若干现场处的变量具体值
- 收集现场的调用栈、行号信息
- 为底层错误做一次外包装，统一为你的 MyBizError 对象
  - 在捕俘地点能够更好地统一处理一切业务逻辑错误 MyBizError
  - 在业务逻辑出口可以直接返回 MyBizError 对象，出口能够自动转换该对象为 API Error 信息结构（无论是 Json 格式，错误码，还是其它通信层面错误信息结构）



我们会利用错误处理模型来做这些事：

- 提供给终端用户的友好的文字信息

  例如用户输入信息校验错误时，你应该提供一些辅助文字帮助用户纠正其输入内容

- 提供给开发员的有利于错误排查的错误信息

  例如后端不能调用，某某资源无法连接或者超时



#### 错误处理的演进

按照一些[^1]官方的观点，错误处理可以归纳如下：

1. Sentinel errors
2. Error Types
3. Opaque errors

这些类别分别代表了不同的错误处理模型，也代表着标准库在这方面的演进历史。

> 请参阅：
>
> - Errors are just values[^1]
> - Don't just check errors, handle them gracefully[^1]

##### Sentinel errors

`Sentinel errors` 表示无法继续的关键性错误。此时，你必须终止正在进行的业务流程，放弃这次交易。

> Examples include values like `io.EOF` or low level errors like the constants in the `syscall` package, like `syscall.ENOENT`.
>
> There are even sentinel errors that signify that an error *did not* occur, like `go/build.NoGoError, and path/filepath.SkipDir from path/filepath.Walk.`

另一个方面，`Sentinel errors` 也代表着强依赖关系。无论你在什么地方，如果想要返回一个 io.EOF，你就必须引入 io 包。

由于这些错误总所周知且明确，所以对它们的测试是通过相等比较来测试的：

```go
if err == io.EOF { ... }
```



##### Error Types

错误类型 `Error Types`[^2] 是指你定义的一个实现了 error 接口的结构类型。为了存储一个现场的几个上下文相关的变量，我们定义了一个专门的错误类：

```go
type MyError struct {
	Msg string
	File string
	Line int
}

func (e *MyError) Error() string {
	return fmt.Sprintf("%s:%d: %s”, e.File, e.Line, e.Msg)
}

return &MyError{"Something happened", “server.go", 42}
```

在这里，`MyError` 类型跟踪文件和行，以及解释所发生情况的消息。

对自定义的错误类型，以前总是采用 err.(*OpErr) 的方式来检测：

```go
err := something()
switch err := err.(type) {
case nil:
	// call succeeded, nothing to do
case *MyError:
	fmt.Println(“error occurred on line:”, err.Line)
default:
	// unknown error
}
```

如上，传统方式是采用类型诊断，这是已经确信不好的方式，在 go 1.13 之后更推荐使用 errors.As() [^3] 来测试它。

```go
var e *MyError
if errors.As(err, &e) {
  // handle error
}
```

自定义错误类能够很好地提供错误现场的上下文信息，但它仍然是强依赖关系的。

此外，老实说，errors.As() 也并不是很好的改进。



##### Opaque errors

`Opaque errors` 可以被认为是隐性错误。这是因为当错误发生时，你无法取得该错误的类型，无法完成类型诊断。标准库中有不少这样的实例，例如网络操作的超时错误等。之所以无法取得错误类型，原因在于相应的错误类型是 non-exported 的。

标准库越来越多地采用这种含混的、柔性的错误抛出方式，原因在于你并不需要对错误进行类型诊断，更不需要在处理错误时不得不引入对应包的依赖关系。现在我们可以采用行为诊断的方式来测试错误：

```go
if te, ok := err.(interface{ Temorary() bool}); ok && te.Temporary() {
  // handle temproray error
}
```





### 错误处理的基本模型

好的模式是：

```go
ret1, ..., err := aFunction(...)
if err != nil {
  // handle error
  return ...
}

// go on doing something
ret1....
```

不好的模式是：

```go
ret1, ..., err := aFunction(...)
if err == nil {
  // doing something
  return ...
}

// handle error
```

不好的模式会带来额外的心智负担，不太符合人阅读业务逻辑的从上到下的隐式期待。



### 聚合错误以利于 Coverage Test

然而，这并非绝对。

当为了更好的 coverage 测试时，又或者为了集中全部错误分支到一处时，`err == nil` 也是常常被用到的：

```go
var (
  err error
  ret1, ret2, ..., 
)

ret1, ..., err = aFunction(...)
if err == nil {
  ..., err = bFunction(...)
	if err == nil {
	  ..., err = cFunction(...)
		if err == nil {
		  return ...
    }
  }
}

// handle error
```

请注意，这种例外不宜滥用。

它的好处是，你可以不必为了这一组代码提供充分的错误样本而顺利完成覆盖测试，这对于已经确知的序列来说可以省却不必要的冗长测试。其坏处也显而易见，你跳过了提供临界样本也就放弃了验证这些样本可能带来的潜在的问题。



### 采用 Defer、Recover 和 Panic

略，请参考 [^4]



### 不要直接返回 error

```go
sth, err = subfunc()
if err != nil {
  return nil
}
```

换句话说，Don't just check errors, handle them gracefully[^1]。

一般来说，作为subfunc()的调用者，你应该收集或提供一定的现场信息，而不是直接返回由 subfunc() 提供的错误。

> 除非，你的函数仅仅是一个包装者。
>
> 我们在编写大型业务逻辑代码时，为了将一个完整的逻辑书写的更易懂，往往会将其拆分为若干小函数。对于这些小函数而言，他们仅仅充当了开发者更友好的包装者角色，所以你可以不必在这些包装函数体中对底层错误再包装，如果你已经在业务逻辑的总函数中进行了全部错误识别、处理和再包装工作的话。



如果你捕俘了一个错误，那么你应该对其进行良好的处理，也就是说，总是一律panic是不对的，总是简单地 log.Errorf 也未必正确，要不要 defer recover 也一定要依据实际情况进行完善的选择和决定。

为了能让使用者能够很好地捕俘错误并分类处理它们，库作者需要：

1. 根据库的逻辑，封装所有错误（无论它们来自于硬件、OS、网络还是库自身的不同部分的业务逻辑）为单一的、或者几种主要的 error types，或者将它们封装到几种不同的 behaviors，以便使用者能够以良好的代码风格和结构捕俘这些错误
2. 必要时，库作者应该掩盖无足轻重的内部错误，这取决于库本身应该提供怎样的业务逻辑



### 在结构体中缓存错误对象

在 Rob Pike 的 [Errors are values](https://blog.golang.org/errors-are-values)[^5] 一文中，他提到了标准库中使用了一种简化错误处理代码的技巧，bufio的Writer就使用了这个技巧：

```go
b := bufio.NewWriter(fd)
b.Write(p0[a:b])
b.Write(p1[c:d])
b.Write(p2[e:f])
// and so on
if b.Flush() != nil {
    return b.Flush()
}
```



实际上，这种模式在标准库中被广泛使用，例如 [`archive/zip`](https://golang.org/pkg/archive/zip/) 和 [`net/http`](https://golang.org/pkg/net/http/) 包等等。该讨论最显著的是， [`bufio` 包的 `Writer`](https://golang.org/pkg/bufio/) 实际上是 `errWriter` 想法的实现。 尽管 `bufio.Writer.Write` 返回错误，但主要是在于实现 [`io.Writer`](https://golang.org/pkg/io/#Writer) 接口。 `bufio.Writer` 的 `Write` 方法不会直接报告错误，而是由 `Flush` 报告错误，因此我们的示例可以像这样编写：

```go
b := bufio.NewWriter(fd)
b.Write(p0[a:b])
b.Write(p1[c:d])
b.Write(p2[e:f])
// and so on
if b.Flush() != nil {
    return b.Flush()
}
```

在内里，bufio.Writer.Write 会检测自己缓存的 err，如果已经出错了，Write 不会再执行正常的逻辑而是直接返回。



至少对于某些应用程序， 这种方法有一个明显的缺点：在错误发生之前无法知道完成了多少处理。 如果该信息很重要，则需要采用更细粒度的方法。 但是，通常，最后全有或全无检查就足够了。

> 为了改善这一问题，[hedzr/errors](https://github.com/hedzr/errors) 提供了 `NewContainer` 来帮助你在结构体中缓存多个步骤或多次迭代的全部错误。详见本系列文章的下一部分：[二、辅助库](/golang/errors/golang-errors-2/) - [hedzr/errors](https://github.com/hedzr/errors)



它的实现机制并不复杂，在 errWriter 的内部缓存了一个 error 对象：

```go
type errWriter struct {
    w   io.Writer
    err error
}

func (ew *errWriter) Write(buf []byte) {
    if ew.err != nil {
        return
    }
    _, ew.err = ew.w.Write(buf)
}

func (ew *errWriter) Flush() error {
  ew.w.Flush()
  return ew.err
}
```

从而将多个步骤的 Write 产生的错误累积到了 Flush() 返回时再进行处理。



### 测试其行为而不是测试其类型[^1]

以前我们可能习惯于这样子测试一个错误类型：

```go
if err, ok := err.(*MyError); ok { … }
```

不过，更好的方法至少有两个：

1. 通过 Is(err, type) 测试
2. 通过测试其行为



#### 测试其行为

对于 os.temporaryErr 而言，我们可以采用下面的方式来测试它：

```go
type temporary interface {
	Temporary() bool
}

// IsTemporary returns true if err is temporary.
func IsTemporary(err error) bool {
	te, ok := err.(temporary)
	return ok && te.Temporary()
}
```

甚至我们可以采用内联的方式简化代码（但会稍微隐晦一些）：

```go
if te, ok := err.(interface{ Temorary() bool}); ok && te.Temporary() {
  // handle temproray error
}
```



### 小结

上面对一些情形进行了总结。这里已经涵盖了最主要的场景，不过更多的场景以及准则仍然未能尽录，请参考脚注提及的文章。












[^1]: [Don't just check errors, handle them gracefully - Dave Cheney](https://dave.cheney.net/2016/04/27/dont-just-check-errors-handle-them-gracefully)
[^2]: [Error handling and Go - The Go Blog](https://blog.golang.org/error-handling-and-go) 
[^3]:  [Working with Errors in Go 1.13 - The Go Blog](https://blog.golang.org/go1.13-errors) 
[^4]:  [Defer, Panic, and Recover - The Go Blog](https://blog.golang.org/defer-panic-and-recover) 
[^5]: [Errors are values - The Go Blog](https://blog.golang.org/errors-are-values)







🔚