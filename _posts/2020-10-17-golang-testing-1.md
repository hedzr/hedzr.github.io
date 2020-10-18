---
layout: single
title: 'Golang Testing 概览 - 基本篇'
date: 2020-10-17 12:41:11 +0800
last_modified: 2020-10-17 12:41:11 +0800
Author: hedzr
tags: [testing, tests, golang]
categories: golang testing
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-10.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Golang Testing 概览，适合入门级欲进一步者 ...

#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---







本系列文章计划是回顾以下 Golang 中与测试相关的各种话题，并对这些内容进行一个浓缩后的概括，同时也提出一些笔者多年来从事开发的经验。

不过，Tips 或 Tricks 都是术的层面的问题，要想在开发方面技近乎道，仅仅是收集技巧是没有用处的。

当然目前来讲，我还没有可能性去讲述道的问题，所以近期我会做的事都会是技巧层面的内容，时时刻刻都会注意不要越过雷池。也希望阅读者不要期望太高，这里都不会讲什么高深的东西，当然也不可能有什么学了就成为高手的东西。

本系列的话题是 Go Testing，准备分为两块来作一个回顾，一是[基本篇](../golang-testing-1/)，大抵是一线开发天天该要面临的那些内容的一个回顾，我觉得这有助于你的反思，有时候不是我的文章有多好，而是它让你有机会能够去想一想，这就是它了。二来呢是一个[深入篇](../golang-testing-2/)，会对一些相对不常见或不常用的例如集成测试等话题作一些浅层次的探讨，敬请期待。



## 基本篇



### 准备

首先我们假设你已经做了一定的代码开发，编写了一个名为 yy 的包，并包含如下的代码实现：

```go
package yy

func Factorial(num int) int {
	return factorialTailRecursive(num)
}

func factorialTailRecursive(num int) int {
	return factorial(1, num)
}

func factorial(accumulator, val int) int {
	if val == 1 {
		return accumulator
	}
	return factorial(accumulator*val, val-1)
}
```

后继章节将会基于这份源码依次阐释如何对其进行验证和测试。



### 单元测试

#### What's This?

单元测试是针对任意一个具体的函数而言，无论是一个已导出的函数接口，或者是一个并不导出的内部工具函数，你可以针对这个函数做一组测试，目的在于证明该函数的功用与其所宣称的相同。

由于针对的测试目标是一个小型的代码单元（例如一个函数），所以也就得名为单元测试。早期的单元测试可以一直追溯到至少 Pascal 时代，如果学过 Pascal 语言的小伙伴应该知道我们可以组织一个 Pascal 源文件为一个 Unit，这个 Unit 允许接收输入，允许完成输出，外界与其的交互是通过暴露的接口成员函数来完成的。这样的代码单元有利于代码复用以及对其进行完备性测试，早期的软件工程学中逐渐在实践中浓缩这一系列概念，最终形成了单元测试（Unit Test）的概念。在这一概念中，代码单元是一个重要的术语，通常我们会认为，一个函数（Function）、一个过程（Procedure），乃至一个类（Class）、基类（Base Class）或者一个类的方法（Method/Message），甚至于一个文件、或者一个包（Package），就是一个代码单元。

所以你需要明白的是，作为一个编码人员，你在实现一个具体目标，并为之而建立了一组函数作为其实现代码的同时，你必须同时为其配套一组单元测试，用以证明组成这个具体目标的每一代码单元都如其预期地在工作。

所谓的单元测试是从微观的角度来观察源码的，所以我们在这时候并不关心高层的业务逻辑需求如何，而是具体化地研究某一个实现（例如一个确切的函数）是不是正常工作。比方说，你创建了一个作阶乘的函数，那么我们现在不关心这个阶乘在高层业务逻辑中被如何运用，我们在单元测试阶段专门关心该函数对于合法不合法的输入是不是都能得到正确的被期待的结果输出。这就是单元测试的意义。

对于 Golang 来说，编写单元测试很容易：

1. 在一个包例如 `yy` 之中新建一个 go 源文件，确保文件名以 `_test.go` 结尾，例如 `yy_test.go`
2. 在这个文件中可以使用 `yy` 或者 `yy_test` 作为包名
3. 编写一个测试函数入口，其签名必以 Test开头，参数必须是 `t *testing.T` （对于性能测试函数来说是 `b *benchmark.B`）
4. 在函数体中编写测试代码，如果认为测试不通过，采用 `t.Fatal("...")` 的方式抛出异常；如果没有异常正常地结束了函数体的运行，则被视作测试已通过。
5. 执行过程中可以使用 `t.Log(...)` 等方式输出日志文本。类似地 `t.Fatal` 也会输出日志文件，以报错的形式。

#### 简单的例子

所以，我们可以看一个样本可以这样编写：

```go
func TestOne(t *testing.T) {
	ret := yy.Factorial(3)
	if ret == 6 {
		t.Log(ret)
	} else {
		t.Fatal("bad")
	}
}
```

运行这个测试用例的结果为：

```bash
❯ go test -v -test.run '^TestOne$' ./yy/
=== RUN   TestOne
    yy_test.go:11: 6
--- PASS: TestOne (0.00s)
PASS
ok      github.com/hedzr/pools/yy       0.114s
```

可以看到，在命令行中，我们通过 `-test.run '^TestOne$' ` 的方式限定了仅执行以正则式决定的测试用例。注意如果没有 `-v` 参数的话，你将看不到 `PASS` 之前输出的日志信息，而只能看到 `PASS` 之后的总结信息。

#### 复杂的例子

上面的例子太简单了，真实世界里这样一个用例什么也不能证明。所以实际上我们编写的用例会复杂得多，会对各种临界情况都进行充分的验证，才能说证明OK了。。

```go
func TestFactorial(t *testing.T) {
	for i, tst := range []struct {
		input, expected int
	}{
		{0, 1},
		{1, 1},
		{2, 2},
		{3, 6},
		{4, 24},
		{5, 120},
	} {
		if ret := yy.Factorial(tst.input); ret != tst.expected {
			t.Fatalf("%3d. for Factorial(%d) expecting %v but got %v", i, tst.input, tst.expected, ret)
		}
	}
}
```

我们来运行它，但会失败，因为我们的源码中没有处理小于等于0的输入值，结果导致了无穷递归：

```bash
❯ go test -v -test.run '^TestFactorial$' ./yy/ 
....
testing.runTests(0xc00000c0a0, 0x121ed80, 0x2, 0x2, 0xbfd978f38b91f1d0, 0x8bb2cf3ef8, 0x1226260, 0x100d150)
        /usr/local/opt/go/libexec/src/testing/testing.go:1447 +0x2e8
testing.(*M).Run(0xc000022080, 0x0)
        /usr/local/opt/go/libexec/src/testing/testing.go:1357 +0x245
main.main()
        _testmain.go:47 +0x138
FAIL    github.com/hedzr/pools/yy       1.461s
FAIL
```

所以我们现在需要更新源码实现如下：

```go
func factorial(accumulator, val int) int {
	if val <= 1 {  // <---- 为求简单明了，我们仅仅修改了这一行
		return accumulator
	}
	return factorial(accumulator*val, val-1)
}
```

现在再来跑测试：

```bash
❯ go test -v -test.run '^TestFactorial$' ./yy/
=== RUN   TestFactorial
--- PASS: TestFactorial (0.00s)
PASS
ok      github.com/hedzr/pools/yy       0.295s
```

那就没有什么问题了，顺利跑通。





### 覆盖测试

#### What's This?

覆盖测试的具体含义是对你实现的代码中的一切分支都采用测试用例的方式遍历到，并期待测试的执行结果符合预期。

通常意义下，覆盖测试是单元测试的一种，我们期待的是对代码的测试覆盖率越高越好。

但在 Golang 中，覆盖测试可以被单列出来，原因在于我们实际上也可以将综合测试的用例写入常规范畴，所以综合测试与单元测试的界限未必明显，要做区分的意义也并不大。

在 Golang 中执行覆盖测试需要两个步骤：

```bash
go test -v . -coverprofile=coverage.txt -covermode=atomic
go tool cover -html=coverage.txt -o cover.html
```

这里的第一步和通常的单元测试相似，但加多了两个参数：-coverprofile 指定一个中间文件用于收集覆盖测试结果，可选的 -covermode 可以指定覆盖测试的方式，当前可以使用 set, count, atomic 三个值，默认值为 set，但当 -race 有效时，默认值为 atomic，绝大多数情况下你可以统一使用 atomic，详细的阐释不在本文范畴之内。



#### Tips & Tricks

很明显，怎么编写覆盖测试是比较头疼的问题。想要合理地走遍一个函数中的全部分支，往往需要绞尽脑汁才行。下面有一些要点来帮助你：



##### 1. 不使用 `os.Exit(n)` 

这意味着在编写你的函数实现时，稍微用点力气，不要使用 `os.Exit(1)` 这样的不可恢复的代码分支。同样的道理，`log.Fatal` 或者其他各种类似的衍生物均不宜使用。

道理很简单，这样的不可恢复分支，测试时一旦走入，整个测试流程也都被破坏了，你将无法跑完整个覆盖测试和拿到分析结果。



##### 2. 有限制地使用 `panic(...)`

如果业务逻辑的语义要求在一个场景中产生致命性错误来表达业务逻辑本身的不可继续性，可以对错误进行恰当的封装，以表达其致命性。例如：

```go
type bizlogicErr struct{
  isFatal bool
  msg string
  inner error
}

func (b *bizlogicErr) Error() string {
  if b.isFatal {
    return "FATAL: " + b.err.Error()
  }
  return b.err.Error()
}

func (b *bizlogicErr) IsFatal() bool { return b.isFatal }
```

但是，如果有时候想要省力，又或者不一定非要过度包装，那么也可以采用 panic 方式终止任务的继续。

对于上层调用者而言，下层实现可以是 a -> b -> c -> d 这样的调用序列，假定在 b 调用过程中发生了致命性错误并采用 panic 终止了自己，则 c 和 d 都将顺理成章地被略过。而上层调用者可以通过 defer recover 机制拿到这个 panic 错误并有控制地决定如何汇报给业务调用者。

所以说，panic 是可以被用在下层调用中的，毕竟，它也是可恢复的致命性异常的一种，我们完全可以把它看作是 C++ exception 的一种表现；甚至很多时候它还是非常好用的一种特性，尤其对于下层嵌套和分支非常复杂的情况，panic 可以以最俭省的代码量直接返回到 recover 所在的控制层。

对于带有 panic 的具体函数实现，我们可以通过在测试代码中包装一层 recover 之后来测试该 panic 分支：

```go
// ----- a.go

func a(v int) int {
  if v < 0 {
    panic("neg")
  }
  return v
}

// ----- a_test.go

func TestA(t *testing.T) {
  for _, tst := range []struct{
    input, expect int
  }{
    { -9, -1 },
    { 1, 1 },
  }{
    if ret := warpA(tst.input); ret != tst.expect {
      t.Fatal(...)
    }
  }
}

func wrapA(in int) (ret int) {
  defer func(){
    if err := recover(); err!= nil {
      ret = -1
    }
  }
  
  ret = a(in)
  return
}
```



##### 3. 尽量使用 `func fn(...) (..., err error)` 的函数原型

首先一点是，尽可能利用 Golang 的多返回值的特性，总是在返回值列表中追加 error 返回值。

> 在编写你的函数实现时，如果没有封装和遮盖的目的，则尽量不必在函数体中直接处理错误值，而是返回错误给上级调用者。
>
> 又或者是进行统一的错误封装之后再返回给上级调用者。

其次而言，Golang 允许返回值被命名，因此我们认为最佳的函数体是善用命名返回值并总是包含一个错误值返回：

```go
// 典型的实现方式
func IsRegularFile(path string) (bool, error) {
	fileInfo, err := os.Stat(path)
	if err != nil {
		return false, err
	}
	return fileInfo.Mode().IsRegular(), err
}

// 改进的实现方式
func IsRegularFile(path string) (yes bool, err error) {
	var fileInfo os.FileInfo
	fileInfo, err = os.Stat(path)
	if err == nil {
		yes = fileInfo.Mode().IsRegular()
	}
	return
}
```

比较一下前后两种实现方式，使用命名返回值的时候，return 语句显得简练得多，借助返回值的有用的命名，代码可以显得更清晰，这实际上有助于你的代码编写。而对于调用者来说，显式的返回值名字有助于调用者了解函数的输出，这比匿名返回时要更清晰。

此外，你可以看到采用命名返回值的函数实现中，很容易通过改写的方式将所有分支归结到同一个返回语句上。当然，对于很复杂的函数体来说这未必是好的，但对于一般性的实现来说，归结到有限的几个返回语句，有效地削减来函数体中的分支路径数量，对于实现覆盖测试是更有利的。

当然，采用命名返回值时，函数体中往往不得不显式地申明一些局部变量，例如上例中的 fileInfo 的声明语句。这种问题通常也不是负担，可以考虑将大多数局部变量声明语句提前到函数入口处，并采用 `var(...)` 方式将其收拢在一起：

```go
func A(...) {
  var(
    fileInfo os.FileInfo
    yes      bool
    ti       int
    ...
  )
  ...
}
```

另一种避免局部变量声明的方式是，将它列作另一个命名返回值。这是很有意思的一种方案，有点点无赖，但也不一定，反而说不定有时候是更富有韵味的方案：

```go
func IsRegularFile(path string) (yes bool, fileInfo os.FileInfo, err error) {
	fileInfo, err = os.Stat(path)
	if err == nil {
		yes = fileInfo.Mode().IsRegular()
	}
	return
}
```

采纳与否，见仁见智。



##### 4. 善用 `if err == nil`

在很多指南中，我们被推荐尽快结束一个分支：

```go
func A(filePath string) (err error) {
  var f *os.File
  if f, err = os.Open(filePath); err!=nil{
    return
  }
  
  if !f.IsRegular() {
    return errors.New("not regular file")
  }
  //...
}
```

也就是说，发现错误就立即返回。

这种方式对于很多情况来说都是有利的。它符合阅读者的思维习惯，发现错误，走了，下面，继续正确时候的后继逻辑……

此外，这种方式对于削减条件分支嵌套也很有用，很多时候它都能有效地摊平嵌套分支。

只不过当我们需要做覆盖测试时，这样的待测试函数会是消耗测试用例的重点。对于这样的函数要想完成覆盖测试，你必须依次为每一次 `if err != nil { return }` 准备一条用例，才能保证分支被走过。

所以，我们在这种情况下向你推荐 `if err == nil` 改写方案：

```go
func A(filePath string) (err error) {
  var f *os.File
  if f, err = os.Open(filePath); err == nil {
    // open ok
    if f.IsRegular() {
      // go further ...
    }
  }
  //
  return
}
```

请脑补完整更多的代码。

很明显，这里有两个不足之处：

1. 嵌套很深
2. 不合法的情况没有详情输出，调用者可能无法知道失败的具体原因

假如你能够忍受这两个不足，请使用我们改写的方案，它让你在测试了一种成功的路径之后就等同于完成了整个函数全部路径的覆盖测试。

这也是一种不算太好的技巧，因为它还忽略了各种临界情况的检测，这和覆盖测试的宗旨是不符的。所以使用与否应该由你们小组研究决定。

采纳与否，见仁见智。







### go test 命令行参数

由于篇幅原因无法做逐一解释，因此本章节仅仅列举最重要、最常用、最可能被用到的少部分标志。[^4][^5][^6]

#### 常规语法

```bash
# 在当前项目当前包文件夹下执行全部测试用例，但不递归子目录
go test .
# 在当前项目当前文件夹下执行全部测试用例并显示测试过程中的日志内容，不递归子目录
go test -v .

# 和 go test . 相似，但也递归子目录中的一切测试用例
go test ./...
go test -v ./...
```

#### 执行特定的测试用例

```bash
go test -v . -test.run '^TestOne$'
```

你可以改写该正则式，以便完成特定的某一个或者某一组测试用例。



#### 执行覆盖测试

```bash
# 以下两句连用以生成覆盖测试报告 cover.html
go test -v . -coverprofile=coverage.txt -covermode=atomic
go tool cover -html=coverage.txt -o cover.html

# 也可以执行最长的用例执行时间，超出时则判为测试失败
go test -v . -coverprofile=coverage.txt -covermode=atomic -timeout=20m
```



#### 在测试时检测数据竞争问题

```bash
go test -v -race .
```

打开数据竞争检测模式，则完整的测试跑下来之后，潜在的数据竞争问题极大可能被检测到和暴露出来。如果想要尽可能安全地检测到绝大多数 data racing 问题，你应该完善你的覆盖测试用例，使其达到超过90%的代码覆盖率，方可尽可能多地发现潜在问题。

数据竞争是一个有趣的问题，不过此处也无法深入分析，留待专文另行研讨。



#### 传递特定通知

在 go test 命令行可以传递特殊参数到测试用例中，以通知长的测试用例选择更短的执行模式。例如我们有这样的用例：

```go
func Test1(t *testing.T) {
  runTests(t, "a", ...)
}

func runTests(t *testing.T, baseName string, tests []test) {
	delta := 1
	if testing.Short() {
		delta = 16
	}
	for i := 0; i < len(tests); i += delta {
		name := fmt.Sprintf("%s[%d]", baseName, i)
		tests[i].run(t, name)
	}
}
```

请注意 `if testing.Short() {}` 语句，它检测 go test 命令行中有无 `-test.short` 指定，然后设置一个更大的增量，用以削减循环测试的循环数，从而达到削减测试时间的目的。

所以当我们需要快一点的测试时，可以：

```bash
go test -v ./... -test.short
```





[^4]: [go - The Go Programming Language - Testing Flags](https://tip.golang.org/cmd/go/#hdr-Testing_flags) 
[^5]:  [go - The Go Programming Language - Testing Functions](https://tip.golang.org/cmd/go/#hdr-Testing_functions) 
[^6]: <https://golang.org/pkg/testing/>



### 其它入门教程

 [Unit Testing made easy in Go. In this article, we will learn about… / by Uday Hiwarale / RunGo / Medium](https://medium.com/rungo/unit-testing-made-easy-in-go-25077669318) 是一篇很有意思的教程，它有很多 vscode 截图，仅凭这一点，就足以被推荐，这很用心了。

当然，我的文章虽然不爱截图，但是也是很用心的，同意的朋友不妨点赞我。





🔚