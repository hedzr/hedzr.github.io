---
layout: single
title: 'Golang errors 编程模型 - Part II'
date: 2020-09-09 23:47:11 +0800
last_modified: 2020-09-11 20:31:11 +0800
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



# Golang errors 最佳实践 Part II

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







## 辅助库

[hedzr/errors](https://github.com/hedzr/errors) 是一个辅助库，它的用途是在兼容标准库的同时，涵盖 pkg/errors 的特性，同时提供更多（但仅提供必需品）的特性来帮助你简化错误开发模型。

[hedzr/errors](https://github.com/hedzr/errors) 同时也将 go 1.13 所提供的有关 errors 的新特性向下兼容到直至 go 1.11，你可以透明地运行这些新特性。

> 唯一的例外是 fmt.Errorf 中的 %w



### 特性

下面对 [hedzr/errors](https://github.com/hedzr/errors) 的主要内容进行介绍，但极少数内容或已过时，此时当然以 live codes 为准。



#### 基本兼容性

`hedzr/errors` 复制了标准库（go 1.13+）的特性。这包括：

- `func As(err error, target interface{}) bool`
- `func Is(err, target error) bool`
- `func New(text string) error`
- `func Unwrap(err error) error`

此外，`hedzr/errors` 也复制了 `pkg/errors` 的特性，这包括（且不限于）：

- `func Wrap(err error, message string) error`
- `func Cause(err error) error`: unwraps recursively, just like Unwrap()
- `func Cause1(err error) error`: unwraps just one level
- `func WithCause(cause error, message string, args ...interface{}) error`, = `Wrap`
- supports Stacktrace
  - in an error by `Wrap()`, stacktrace wrapped;
  - for your error, attached by `WithStack(cause error)`;

在上面所作出的兼容性的努力，是为了让你能够无感知地平滑迁移到 `hedzr/errors` 。这样做的最大目的，还是为了让 `hedzr/errors` 所提供的增强特性能够以最低代价为你所使用。最低代价是简单到将所有 import 语句

```go
import "errors"
import "pkg/errors"
```

替换为：

```go
import "gopkg.in/hedzr/errors.v2"
```

就可以了。



现在你可以照原样编写代码：

##### 使用 Is() 测试

```go
// Similar to:
//   if err == ErrNotFound { … }
if errors.Is(err, ErrNotFound) {
    // something wasn't found
}

// Similar to:
// if e, ok := err.(*QueryError); ok && e.Err == ErrPermission {
//     // query failed because of a permission problem
// }
if errors.Is(err, ErrPermission) {
    // err, or some error that it wraps, is a permission problem
}
```

##### 使用 As() 转换或抽出

```go
// Similar to:
//   if e, ok := err.(*QueryError); ok { … }
var e *QueryError
if errors.As(err, &e) {
    // err is a *QueryError, and e is set to the error's value
}
```

##### 用%w包装错误并抽出它

```go
if err != nil {
    // asssumed err as a ErrPermission
    // Return an error which unwraps to err.
    return fmt.Errorf("decompress %v: %w", name, err)
}

if errors.Is(err, ErrPermission) {
    // err, or some error that it wraps, is a permission problem
}
var e *ErrPermission
if errors.As(err, &e) {
    // err is a *QueryError, and e is set to the error's value
}
e = errors.Unwrap(err)
if e == ErrPermission {
  // ...
}
```



#### `hedzr/errors`  的增强特性



##### \1. `New(msg, args...)`

`New(msg, args...)` 统一了 New， `Newf`(如果有这个名字的话), WithMessage, WithMessagef, ...。仅需一个原型，就可以将上述的 errors, pkg/errors 中的附带信息的接口覆盖掉。

> 这样的后果是有轻微的性能损失，原因是 `New(msg, args...)` 会采用一个 if 测试来区别 New(msg) 和 New(msg, args...) 两种情况，这个条件测试是额外的损失。

```go
var err = errors.New("hello error: %v", randNumber)
var err = errors.New("hello error: %w", innerError) // 支持，但不建议
```

在文本消息模版 `msg` 中采用 go 1.13 的 `%w` 是可行的，但并不推荐这么做。你应该使用间接方式，稍后我们还会进一步介绍（参见 [关于 WithStackInfo](#关于-withstackinfo)）：

```go
var err = errors.New("tip mseesage").Attach(causeError)
```

或者是使用 `errrors.Wrap()`，参见接下来的两小节。

`hedzr/errors` 的 New() 具有如下原型：

```go
func New(message string, args ...interface{}) *WithStackInfo { ... }
```

请注意 `WithStackInfo` 是一个 error 对象，在后文中对其有一个介绍。



##### \2. `WithCause(cause, msg, args...)`

这是一个附加上内嵌错误 cause 以及文本信息的接口。其原型为：

```go
func WithCause(cause error, message string, args ...interface{}) error
```

用法为：

```go
var err = errors.WithCause(io.EOF, "hello %s", "world")
```





##### \3. `Wrap(err, msg, args...) error`

这是和 WithCause 等价的接口，但还额外提供上下文调用栈信息。

其原型为：

```go
func Wrap(err error, message string, args ...interface{}) *WithStackInfo
```

用法为：

```go
var err = errors.Wrap(io.EOF, "hello %s", "world")
```







##### \4. `DumpStacksAsString()`

这只是一个工具函数。它返回调用栈信息，如同 `debug.PrintStack()` 所做的那样。

其原型为：

```go
func DumpStacksAsString(allRoutines bool) string
```





##### \5. `CanXXX`:

通过 `hedzr/errors` 提供的 CanXXX 接口，你可以做一些特征性的测试。

- `CanAttach(err interface{}) bool`
- `CanCause(err interface{}) bool`
- `CanUnwrap(err interface{}) bool`
- `CanIs(err interface{}) bool`
- `CanAs(err interface{}) bool`





#### 关于 `WithStackInfo`

请注意 `WithStackInfo` 是一个实现了 error 接口的结构类。它实现了如下的全部接口：

```go
// CauseInterface is an interface with Cause
type CauseInterface interface {
	// Cause returns the underlying cause of the error, if possible.
	// An error value has a cause if it implements the following
	// interface:
	//
	//     type causer interface {
	//            Cause() error
	//     }
	//
	// If the error does not implement Cause, the original error will
	// be returned. If the error is nil, nil will be returned without further
	// investigation.
	Cause() error
	// SetCause sets the underlying error manually if necessary.
	SetCause(cause error) error
}

// FormatInterface is an interface with Format
type FormatInterface interface {
	// Format formats the stack of Frames according to the fmt.Formatter interface.
	//
	//    %s	lists source files for each Frame in the stack
	//    %v	lists the source file and line number for each Frame in the stack
	//
	// Format accepts flags that alter the printing of some verbs, as follows:
	//
	//    %+v   Prints filename, function, and line number for each Frame in the stack.
	Format(s fmt.State, verb rune)
}

// IsAsUnwrapInterface is an interface with Is, As, and Unwrap
type IsAsUnwrapInterface interface {
	// Is reports whether any error in err's chain matches target.
	Is(target error) bool
	// As finds the first error in err's chain that matches target, and if so, sets
	// target to that error value and returns true.
	As(target interface{}) bool
	// Unwrap returns the result of calling the Unwrap method on err, if err's
	// type contains an Unwrap method returning error.
	// Otherwise, Unwrap returns nil.
	Unwrap() error
}

// AttachInterface is an interface with Attach
type AttachInterface interface {
	// Attach appends errs
	Attach(errs ...error) *WithStackInfo
}

// ContainerInterface is an interface with IsEmpty
type ContainerInterface interface {
	// IsEmpty tests has attached errors
	IsEmpty() bool
}

// WithStackInfoInterface is an interface for WithStackInfo
type WithStackInfoInterface interface {
	CauseInterface
	FormatInterface
	IsAsUnwrapInterface
	AttachInterface
	ContainerInterface
}
```



### 其它增强



#### 错误容器

> error Container and sub-errors (wrapped, attached or nested)

错误容器是可以容纳一系列多个子错误的容器，它有如下的关键接口：

- `NewContainer(message string, args ...interface{}) *withCauses`
- `ContainerIsEmpty(container error) bool`
- `AttachTo(container *withCauses, errs ...error)`
- `withCauses.Attach(errs ...error)`

我们曾提及标准库常常在结构中缓存一个 error 对象用以将过程中的错误延迟到业务结束时再行处理。标准库的做法是一旦有一个错误发生了，那么后续的交易一律放弃。

然而我们的业务也许是一个批量性的操作，一个子交易失败不必终止其它子交易的进行。在这种情况下我们可以用错误容器来代替单个的 error 对象缓存：

```go
type bizStrut struct {
	err errors.Holder
	w   *bufio.Writer
}

func (bw *bizStrut) Write(b []byte) {
	_, err := bw.w.Write(b)
	bw.err.Attach(err)
}

func (bw *bizStrut) Flush() error {
	err := bw.w.Flush()
	bw.err.Attach(err)
	return bw.err.Error()
}

func TestContainer2(t *testing.T) {
	var bb bytes.Buffer
	var bw = &bizStrut{
		err: errors.NewContainer("bizStrut have errors"),
		w:   bufio.NewWriter(&bb),
	}
	bw.Write([]byte("hello "))
	bw.Write([]byte("world "))
	if err := bw.Flush(); err != nil {
		t.Fatal(err)
	}
}
```

你能看到，我们首先用 errors.NewContainer() 返回一个 `errors.Holder` 对象，并不断地将 err 压入这个 holder （`bw.err`）中。在最后，我们通过 holder.Error() 将全部错误打包取出，这里面利用到了我们的 `errors.WithCauses` 结构体，这个结构体允许我们将一组 error 集合嵌入一个大的 error 容器中。

> 对于传入的 err==nil 的情况，实际上 holder 能够安全地忽略它，并不会接纳它。



同样地，对于循环操作一组子业务的情况，也可以直接编写代码：

```go
func a() (err error){
  container := errors.NewContainer("sample error")
    // ...
    for {
        // ...
        // in a long loop, we can add many sub-errors into container 'c'...
        errors.AttachTo(container, io.EOF, io.ErrUnexpectedEOF, io.ErrShortBuffer, io.ErrShortWrite)
        // Or:
        // container.Attach(someFuncReturnsErr(xxx))
        // ... break
    }
	// and we extract all of them as a single parent error object now.
	err = container.Error()
	return
}

func b(){
    err := a()
    // test the containered error 'err' if it hosted a sub-error `io.ErrShortWrite` or not.
    if errors.Is(err, io.ErrShortWrite) {
        panic(err)
    }
}
```

尽管这段示例代码中采用了 `errors.AttachTo(container, ...)` 而不是 `container.Attach(...)`，但两者并没有什么不同，喜欢用哪一种方式取决于你喜欢用什么样的视角来看待这段逻辑。



#### Coded error

`hedzr/errors` 中也提供一组预定义错误号，并且准许你扩展自己的错误号到这个体系中。

- `Code` is a generic type of error codes / `Code` 是一个通用性的错误号类型
- `errors.WithCode(code, err, msg, args...)` can format an error object with error code, attached inner err, message or msg template, and stack info. / 可以用 `errors.WithCode(code, err, msg, args...)` 来格式化一个带有错误号的、可以包含嵌入 error 对象的、可以带有信息文本的总的 error 对象。
- `Code.New(msg, args...)` is like `WithCode`. / `Code.New(msg, args...)` 和 `WithCode 是相似的，但没有那么多参数。但你总是可以使用 Code.New(...).Attach(err,...) 的方式进一步追加信息。
- `Code.Register(codeNameString)` declares the name string of an error code yourself. / `Code.Register(codeNameString)` 能够将你定制的错误号和一个描述文本相关联，并注册到系统体系中。
- `EqualR(err, code)`: compares `err` with `code`



使用错误号系统，通常是这样的顺序：

```go
// using the pre-defined error code
err := InvalidArgument.New("wrong").Attach(io.ErrShortWrite)

// customizing the error code
const MyCode001 Code = 1001

// and register its name
MyCode001.Register("MyCode001")
// and use the error code
err := MyCode001.New("wrong 001: no config file")
```

你首先通过 `const MyCode001 Code = 1001` 自定义一个错误号，然后将其注册到系统体系中（通常是在一个 init() 函数中调用 `MyCode001.Register("MyCode001")`）。

在需要这个错误号的位置，利用 `MyCode001.New("wrong 001: no config file")` 构造一个错误场所恰当的实例对象 err，然后像处理其它 error 实例对象那样使用 err。

> Try it at: <https://play.golang.org/p/Y2uThZHAvK1>



##### Error Template: late-formatting the coded-error

使用 `NewTemplate(tmpl)` 可以基于错误号创建一个错误对象的字符串格式化模版，稍后在错误现场可以用于就地格式化。


```go
var errTmpl1001 = BUG1001.NewTemplate("something is wrong, %v")

err4 := errTmpl1001.FormatNew("unsatisfied conditions").Attach(io.ShortBuffer)

fmt.Println(err4)
fmt.Printf("%+v\n", err4)
```











## REF

[^1]: [Error handling and Go - The Go Blog](https://blog.golang.org/error-handling-and-go) 
[^2]:  [Working with Errors in Go 1.13 - The Go Blog](https://blog.golang.org/go1.13-errors) 
[^3]:  [Defer, Panic, and Recover - The Go Blog](https://blog.golang.org/defer-panic-and-recover) 
[^4]: [Don't just check errors, handle them gracefully | Dave Cheney](https://dave.cheney.net/2016/04/27/dont-just-check-errors-handle-them-gracefully)
[^5]: [Errors are values - The Go Blog](https://blog.golang.org/errors-are-values)







🔚