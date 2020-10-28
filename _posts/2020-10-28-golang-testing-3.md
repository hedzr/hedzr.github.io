---
layout: single
title: 'Golang Testing 概览 - 补充篇'
date: 2020-10-28 06:08:00 +0800
last_modified: 2020-10-28 10:01:00 +0800
Author: hedzr
tags: [testing, tests, mock, "unit test", benchmark, assert, assertions, fp, "functional programming", glang]
categories: golang testing
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-11.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Golang 测试补充篇，介绍一些重构的思路，介绍前文未及提及的某些内容...
---







本系列文章计划是回顾以下 Golang 中与测试相关的各种话题，并对这些内容进行一个浓缩后的概括，同时也提出一些笔者多年来从事开发的经验。

不过，Tips 或 Tricks 都是术的层面的问题，要想在开发方面技近乎道，仅仅是收集技巧是没有用处的。

当然目前来讲，我还没有可能性去讲述道的问题，所以近期我会做的事都会是技巧层面的内容，时时刻刻都会注意不要越过雷池。也希望阅读者不要期望太高，这里都不会讲什么高深的东西，当然也不可能有什么学了就成为高手的东西。

本系列的话题是 Go Testing，原本准备分为两块来作一个回顾：

1. 一是基本篇，大抵是一线开发天天该要面临的那些内容的一个回顾，我觉得这有助于你的反思，有时候不是我的文章有多好，而是它让你有机会能够去想一想，这就是它了。
2. 二来呢是一个深入篇，会对一些相对不常见或不常用的例如集成测试等话题作一些浅层次的探讨，这也已经发布了。

不过，现在还有一些补充性的内容可以继续成篇：

- 补充篇：介绍一些重构的思路，介绍前文未及提及的某些内容



原发于：[Go Testing 3](http://hedzr.github.io/golang/testing/golang-testing-3/)



## 补充篇



### TextPainter & Terminal Paint

我们现在有一个 textPainter 的结构，准备测试其实现代码，然而其中主要的函数 Draw 是这样的：

```go
func (p *textPainter) Draw(s tcell.Screen, box *box.Box) {
	i := p.firstVisRow - p.startLn
	box.MoveTo(0, 0)
	for i < len(p.locations) {
		l := p.locations[i]
		if l.loaded {
			var vo bool
			if cmdr.GetBoolR("preview.wordwrap", true) {
				vo = box.Puts(s, l.line)
			} else {
				vo = box.PutsNoWrap(s, l.line)
			}
			if vo {
				break
			}
		} else {
			go p.readlines(i, 20)
			return
		}
		i++
	}
}
```

代码不算太复杂，测试时存在这样的问题：为了测试Draw，我们必须构造恰当的入参并传递给它。然而即使我们已经构造了合适的参数，我们也无法校验其结果，原因在于 Draw 的工作是将文本文件的行输出到 `s tcell.Screen` 上，但实际上在测试过程中，根本不可能有文本终端和测试进程相关联，也就不可能在这里得到有效的结果。

> `tcell.Screen` 是字符终端的一个 Golang 中的虚拟表示，代表着一个终端窗口。详见 ...
>
> `*box.Box` 是一个我们所实现的终端屏幕区域的虚拟表示，提供了绘制边线之类的辅助功能，也算是一种 OO 思路与实现方法。



这就是我们在编写测试用例时常常会遇到的案例之一：要测试的动作在测试进程的运行环境下不可能运作。类似的例子可能会有很多：

- 向文本终端写内容
- 向GUI Canva绘制内容
- 向某个真实的公众接口发出请求：例如你在编写 Github Client，由于 Github RESTful API 的免费调用计数限制而不能在测试中随意地进行请求。或者向 Sina/QQ 等公众 API 发出请求，都会遇到相似的问题
- 向某个支付网关发出请求：当你没有支付网关的测试端口时，或者你需要通过正式端口进行某项验证时。
- ……



#### How to test with it?

总的一句话，遇到这些场景，我们需要解决它们的思路如下：

1. 使用 Mock 技术
2. 改写代码剥离外部依赖，然后针对剥离后的子函数进行测试。



#### Approcach 2

首先我们对上面提出的具体案例展示一下方法2。对于 Draw 我们该如何剥离外部依赖形成一个干净的 impl 呢？方法有多种，但最简单的方法是高阶函数，我们可以将Draw 的大部分实现语句搬入 `drawImpl` 中，然后将涉及到外部依赖的语句通过高阶函数包装为一个 functor，并将其作为 drawImpl 的入参，这就可以解决问题。对于 Draw 来讲，我们的重构结果如下：

```go
func (p *textPainter) Draw(s tcell.Screen, box *box.Box) {
	box.MoveTo(0, 0)
	p.drawImpl(func(ln int, line string) (vOverflow bool) {
		if cmdr.GetBoolR("preview.wordwrap", true) {
			vOverflow = box.Puts(s, line)
		} else {
			vOverflow = box.PutsNoWrap(s, line)
		}
		return
	})
}

func (p *textPainter) drawImpl(paintOneLine func(ln int, line string) (vOverflow bool)) {
	i := p.firstVisRow - p.startLn
	for i < len(p.locations) {
		l := p.locations[i]
		if !l.loaded {
			go p.readlines(i, 20)
			return
		}

		if paintOneLine(i, l.line) {
			break
		}
		i++
	}
}
```

现在我们可以了解到高阶函数怎么在这里发挥作用了。代码中的 drawImpl() 现在很纯粹，外部依赖在其中没有任何表示，所以我们可以通过编写一个空白的 paintLine 的方式在测试用例中调用它，而 Draw 则通过一个匿名函数去完成到 tcell.Screen 的调用。



### Using Assertions

#### 实例

在测试代码中使用断言，对于代码的可读性、稳健性都有巨大的提升，请看下面的例子：

```go
package assert_test

import (
	"github.com/hedzr/assert"
	"testing"
)

type Person struct {
	Name string
	Age  int
}

func TestDiff(t *testing.T) {
	expected := []*Person{ {"Alec", 20}, {"Bob", 21}, {"Sally", 22} }
	actual := []*Person{ {"Alex", 20}, {"Bob", 22}, {"Sally", 22} }
	assert.NotEqual(t, expected, actual)
	t.Log(assert.DiffValues(expected, actual))
}
```

这个例子中使用了 `NotEqual` 断言，如果 `expected` 与 `actual` 确实是不相等的，则没有疑问继续向后执行测试代码，否则断言失败将停止测试流程。

如果是采用 `Equal` 断言，当 `expected` 与 `actual` 确实不相等时，断言失败的输出中还将会自动打印两个结构的不同的部分，这是通过 `assert.DiffValues` 功能完成的，所以上面的测试代码中为了能让整个测试代码通过决定采用 `NotEqual` 和 `DiffValues` 配合的方式来展示不同之处，形如：

![image-20201028075651364](https://i.loli.net/2020/10/28/41crkJdzwpFLU3o.png)

请注意其中的 diff 颜色，有时候还是有点作用的。



#### 一些断言第三方库

##### stretchr/testify

<https://github.com/stretchr/testify>

stretchr 的 [Testify](https://github.com/stretchr/testify) 很有名，包含一大组测试工具包，`assert` 为断言库并且带有返回值表示断言成功与否，`require` 基于 `assert` 断言库，取消了返回值，在断言失败时令测试流程中指，`mock` 提供一些仿真工具，`suite` 提供一些集成测试工具，等等。



##### alecthomas/assert

<https://github.com/alecthomas/assert>

这个库基于 stretchr 的断言库中的 require 魔改而来，主要是增加了 diff 比较以及终端中的彩色支持。

- This is a fork of stretchr's assertion library that does two things:
  1. It makes spotting differences in equality much easier. It uses [repr](https://github.com/alecthomas/repr) and [diffmatchpatch](https://github.com/sergi/go-diff/diffmatchpatch) to display structural differences in colour.
  2. Aborts tests on first assertion failure (the same behaviour as `stretchr/testify/require`).



##### go-playground/assert

<https://github.com/go-playground/assert>

这是一个单纯的断言库，提供一组断言工具，比 strtchr 的 require 略微丰富一些。



##### hedzr/assert

这个断言库也是**仅包含断言工具**，是由前面几个断言库的特性**综合而来**，主要在于将实现代码简化、重写，令断言提示信息更丰富。

另一改进之处在于同时适用于单元测试与性能测试，而前面几个库对此或多或少有点问题（因为它们实现的太早，早期 Go testing 没有抽出 testing.T 和 testing.B 的公共部分）。

再一个原因是上面几个库的更新不及时：

- stretchr 的库有更新、但慢，而且积累了数百个 PR，不太欢迎 PR 的样子
- stretchr 测试库包含太全面了，实际上我的日常只对断言有兴趣，mock 和 suite 并没有必须性。这里的另一个原因也在于 Go testing 现在支持的特性越来越多了。
- 其它的库则是停更好几年了。
- 最后一个原因：我懒得做论文一般地继续查新了。
- Go 自家对于集成测试和 Mock 都有支持了，但唯独断言总是没有，这很奇怪，不可理解，但也不知道什么时候就将会提供内置的断言机制了，然而目前我还是觉得自己的 assert 对于自己的开源代码而言具有实用价值。







### Using Mock

我个人的看法，是能不 Mock 就不 Mock。

对于基础库作者来说这种态度是过得去的，因为 Mock 最适合的场景就是业务逻辑层，我是指面向 End-User 的业务逻辑层，而不是我惯常所言的 BLL。

> 对于基础库来说，它眼里的业务逻辑大概是使用基础库的开发员期待的库API上层。

所以我这里不准备展开讲 Mock，只是简要介绍一下已有的库在 Mock 上的支持。



#### 一些 Mock 支持库



##### stretchr/testify

<https://github.com/stretchr/testify>

stretchr 的 [Testify](https://github.com/stretchr/testify) 很有名，包含一大组测试工具包，其中 `mock` 提供一些仿真工具。由于前面已经介绍过，这里就不重复了。

###### 实例片段

在 strtchr 中使用 `mock` 包中的特性来提供 Mock 支持，一般地说它需要你从 `mock.Mock` 上派生你自己的 Mock 对象：

```go
package yours

import (
  "testing"
  "github.com/stretchr/testify/mock"
)

/*
  Test objects
*/

// MyMockedObject is a mocked object that implements an interface
// that describes an object that the code I am testing relies on.
type MyMockedObject struct{
  mock.Mock
}
```

具体请看可以参阅：

1. <https://github.com/stretchr/testify#mock-package>
2. <https://godoc.org/github.com/stretchr/testify/mock>



##### gomock

[github.com/golang/mock](https://github.com/golang/mock)

`gomock` 是 Google 开源的 golang 测试框架。他们家自称为 “GoMock is a **mocking framework** for the Go programming language”。

gomock 是通过 mockgen 命令来生成包含 mock 对象的 .go 源代码，从而提供 Mock 以及 Stub 的支持，这种方式自动维护 mock 对象，所以很大程度上确实减省了我们的劳动强度。

###### 实例片段

假设你的业务逻辑中有如下定义：

```go
//foo.go
type Foo interface {
   Do(int) int
}
func Bar(f Foo) {
  ...
}
```

那么首先为其进行 mockgen

```bash
$ mockgen -destination=mocks/mock_foo.go -package=mocks . Foo
```

你也可以利用 go:generate 特性集成 mockgen 而无需额外的命令行操作，但你的 go build 之前不要忘记 go generate：

```go
//foo.go
//go:generate mockgen -destination=mocks/mock_foo.go -package=mocks . Foo
type Foo interface {
   Do(int) int
}
...
```

> 以上示例来自于 [A GoMock Quick Start Guide](https://medium.com/better-programming/a-gomock-quick-start-guide-71bee4b3a6f1)

生成的代码看起来像这样：

```go
...
// MockFoo is a mock of Foo interface
type MockFoo struct {
   ...
}
// MockFooMockRecorder is the mock recorder for MockFoo
type MockFooMockRecorder struct {
   mock *MockFoo
}
// NewMockFoo creates a new mock instance
func NewMockFoo(ctrl *gomock.Controller) *MockFoo {
   ...
}
// EXPECT returns an object that allows the caller to indicate expected use
func (m *MockFoo) EXPECT() *MockFooMockRecorder {
   return m.recorder
}
// Do mocks base method
func (m *MockFoo) Do(arg0 int) int {
   ...
}
// Do indicates an expected call of Do
func (mr *MockFooMockRecorder) Do(arg0 interface{}) *gomock.Call {
   ...
}
```

借助 MockFoo 对象我们可以这样编写测试用例：

```go
func TestFoo(t *testing.T) {
    ctrl := gomock.NewController(t)
    // Assert that Bar() is invoked.
    defer ctrl.Finish()
    m := mocks.NewMockFoo(ctrl)
    // Asserts: the first and only call to Do() is passed 99 with 101 returned.
    // Anything else will fail.
    m.EXPECT().Do(99).Return(101)
  
    Bar(m)
}
```

所以对于 `Bar()` 的测试而言，我可以不必关心 Foo 这个接口的实际对象，在业务逻辑层它可能是由某个我讨厌的家伙实现的（例如 `type fooImpl struct{}`），但我不想和他打交道，我只跟 MockFoo 对话就是了。

你能够很容易地拓展这个设想到更广泛的场景中，例如在 HTTP API 交互的场景，很明显借用 MockRequest 我们可以不必真的去访问某个远程的 RESTful API。

但更详尽的 Mock 技术的介绍暂时不在我的考虑范围之内，所以就到这里。



### `+build integration`

上一篇中我们曾经介绍过 `testing.Short()` 及其运用。

实际上通过构建时标签（build tags）我们也可以实现类似的方案，例如使用 `+build integration`。

假设我们由一个独立的测试源码文件 `longer_test.go`:

```go
// longer_test.go

// +build integration

func Test....
```

那么正常情况下这个文件中的测试用例将被忽略。

除非你使用这样的命令行：

```bash
$ go test -tags=integration
```

此时，这些用例将被纳入测试流程中。

所以可以考虑将某些特殊的测试用例单列出来，例如需要一个特殊的压测时：

> 请注意，为了你的目的，`integration` 这个单词是由你自行决定的，你可以将其设定为 `sunsunde`，又或是 `ohmygod`，等等。
>
> 当然，如果是为了配合做压测，为什么不命名为 for-pressure-testing 呢？







### `testdata` 文件夹

Go 在编译时会忽略 `*_test.go` 文件和 `testdata/` 文件夹，除非你正在使用 `go test `。这个特点可以帮助你实现一些有趣的特性，不过现在我们主要还是谈论其测试时用途。

`testdata` 文件夹被约定为放置你的测试数据。

Dave Cheney 有一篇专文 [Test fixture in Go](https://dave.cheney.net/2016/05/10/test-fixtures-in-go)，其中用一句话讲述了如何在测试用例中从 `testdata` 中载入测试数据：

```go
f, err := os.Open("testdata/somefixture.json")
```

go test 工作时的当前目录一般而言总是在 go Module 的项目根目录，所以你可以直接取到 `./testdata` 文件夹。





#### `.golden` 文件

一个 `golden file` 通常是指对于某个测试（通常都是自动化测试）来说所期待的输出文件。换句话说，按照惯例，我们将一个黑盒测试的输入文件命名为 `xxx.input`，而将其输出内容与 `xxx.golden` 相比对，如果两者内容相同则测试通过，否则测试失败。

这样的机制其实是软件测试技术中的一种约定，某些语言或框架对此有集成性的支持，你提供的 .golden 文件能够被自动完成二进制级别的内容比对。但是在 golang 中你需要自行进行文件内容比较，当然这并不困难，只是为了令测试用例和测试流程符合惯例罢了。



##### 实例

假定我们由这样的项目文件夹结构：

```
- testdata/
  - TestToJSON.golden
- main.go
- main_test.go
```

我们的主要工作代码是 main.go:

```go
// main.go
package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
)

func ToJSON(w io.Writer) error {
	return json.NewEncoder(w).Encode(&struct {
		Foo string `json:"foo"`
		Bar string `json:"bar"`
	}{
		"Foo",
		"Bar",
	})
}

func main() {
	var b bytes.Buffer
	w := bufio.NewWriter(&b)
	if err := ToJSON(w); err != nil {
		fmt.Fprintln(os.Stderr, "error writing json: %s", err)
	}
	w.Flush()
	fmt.Println(string(b.Bytes()))
}
```

相应地我们可以编写测试用例如下：

```go
// main_test.go

package main

import (
	"bufio"
	"bytes"
	"flag"
	"io/ioutil"
	"path/filepath"
	"testing"
)

var update = flag.Bool("update", false, "update .golden files")

func TestToJSON(t *testing.T) {
	var b bytes.Buffer
	w := bufio.NewWriter(&b)
	err := ToJSON(w)
	if err != nil {
		t.Fatalf("failed writing json: %s", err)
	}
	w.Flush()
  
	gp := filepath.Join("testdata", t.Name()+".golden")
	if *update {
		t.Log("update golden file")
		if err := ioutil.WriteFile(gp, b.Bytes(), 0644); err != nil {
			t.Fatalf("failed to update golden file: %s", err)
		}
	}
	g, err := ioutil.ReadFile(gp)
	if err != nil {
		t.Fatalf("failed reading .golden: %s", err)
	}
	t.Log(string(b.Bytes()))
	if !bytes.Equal(b.Bytes(), g) {
		t.Errorf("writtein json does not match .golden file")
	}
}
```

当然我们要准备 `testdata/TestToJSON.golden` 文件内容为：

```json
{"foo":"Foo","bar":"Bar"}
```

实际上我们也可以通过命令行来准备这个 golden 的文件内容：

```bash
$ go test -v ./... -update
```

然后再以常规方式进行测试：

```bash
go test -v ./...
```

> 以上用例来自于 [Testing with golden files in Go](https://medium.com/soon-london/testing-with-golden-files-in-go-7fccc71c43d3)



##### 说明

在 Golang 中没有对 Golden 文件有显式的支持，所以 .golden 的后缀名并不是必须的，你也可以将其命名为 `.goldedn.json` 或者其它，又或者是准备一个名为 `testdata/golden` 的文件夹。只是为了符合惯例你应该在这样的目标的命名上保持 `golden` 这个单词，这能够帮助其它了解同样的测试技术惯例的开发者。

较为丰富的实践中的示例可以参阅 gofmt 的源码：

<https://github.com/golang/go/tree/master/src/cmd/gofmt/testdata>









🔚