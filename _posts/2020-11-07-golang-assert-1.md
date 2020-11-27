---
layout: single
title: 'Golang Testing: 关于 assert'
date: 2020-11-07 15:48:00 +0800
last_modified_at: 2020-11-07 15:48:00 +0800
Author: hedzr
tags: [testing, assertions, assert, golang]
categories: golang testing
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-11.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Golang 测试系列，断言...
---



以前曾经提及过软件测试中的断言，并且对断言的开源库有过简单的介绍。今次是为了为我的开源库 assert 提供的特性进行介绍。

此前也已经介绍过为何在那么多已有的 Golang 断言库之后还要再次制作一个断言库：

- 早期 Go testing 没有抽出 testing.T 和 testing.B 的公共部分，因而已有的断言库往往只能支持 *testing.T 而忽略了 *testing.B 等等
- stretchr 的库有更新、但慢，而且积累了数百个 PR，不太欢迎 PR 的样子
- stretchr 测试库包含太全面了，实际上我的日常只对断言有兴趣，mock 和 suite 并没有必须性。这里的另一个原因也在于 Go testing 现在支持的特性越来越多了。
- 其它的库则是停更好几年了。
- 最后一个原因：我懒得做论文一般地继续查新了。
- Go 自家对于集成测试和 Mock 都有支持了，但唯独断言总是没有，这很奇怪，不可理解，但也不知道什么时候就将会提供内置的断言机制了，然而目前我还是觉得自己的 assert 对于自己的开源代码而言具有实用价值。



## `hedzr/assert`

[`hedzr/assert`](https://github.com/hedzr/assert) 断言库也是**仅包含断言工具**，是由几个开源断言库的特性**综合而来**，主要在于将实现代码简化、重写，令断言提示信息更丰富。

引用 `hedzr/assert`  是通过：

```go
import "github.com/hedzr/assert"
```

以下依次说明这些断言工具的用法：



### Equal(t, expect, actual), , NotEqual

相等性断言。

期待 expect 值，而实际得到的是 actual 值，Equal 提供两者之间是否相等的断言。如果失败则测试流程终止。

实际上对其的用法可能是这样的：

```go
expected := []*Person{ {"Alec", 20}, {"Bob", 21}, {"Sally", 22} }
	actual := []*Person{ {"Alex", 20}, {"Bob", 22}, {"Sally", 22} }
	assert.NotEqual(t, expected, actual)

	assert.Equal(t, expected, actual) // 将会失败
}
```

运行结果类似于：

```bash
assert_test.go:25 expecting [0xc00000c220 0xc00000c240 0xc00000c260], but got [0xc00000c2a0 0xc00000c2c0 0xc00000c2e0]. DIFF is: []*assert_test....rson{Name: "Alecx", Age: 20}, &a...: "Bob", Age: 212}, &assert_test...lly", Age: 22}}
```



NotEqual 是不等性断言，只是 Equal 的否定形式。用法类似，不再赘述。



#### EqualSkip(t, skip, expect, actual), NotEqualSkip

EqualSkip 是 Equal 的等冗长的版本，因为它还需要一个额外的 skip 参数，这个参数用于指明应该忽略的调用栈帧数，从而使得测试的日志输出能够正确地指示源码位置。

NotEqualSkip 是相似的。

查看源码将能够看到 Equal 的实现很简单：

```go
// Equal validates that 'actual' is equal to 'expect' and throws an error with line number
func Equal(t testing.TB, expect, actual interface{}) {
	EqualSkip(t, 2, expect, actual)
}
```



### EqualFalse(t, actual), EqualTrue(t, actual) 

针对布尔量的相等性判定，也提供了更简洁的断言方式：EqualFalse 以及 EqualTrue。因而不再额外详解。



### Error(t, err), NoError(t, err)

对于 err 返回值的断言，可以通过 assert.Error 和 assert.NoError 来测试。

```go
func TestErrors(t *testing.T) {
  f, err := os.Open("/tmp/not-exist")
  assert.Error(t, err) // err 应该是一个 notfound 错误
  defer f.Close()
  
  f， err = os.Open("/etc/passwd")
  assert.NoError(t, err) // err 应该为 nil
  defer f.Close()
}
```





### Nil(t, value), NotNil(t, val)

对于指针或者空数组，或者未初始化的 channel 等等，可以通过 Nil 和 NotNil 来测试。

```go
func TestNilObjects(t *testing.T) {
  var ch chan struct{}
  assert.Nil(t, ch)
  ch = make(chan struct{})
  assert.NotNil(t, ch)
  close(ch)
}
```



### Match(t, value, regex), NotMatch

对于字符串类型的变量，除了通过相等性断言来测试之外，也可以采用正则式来进行测试和判定：

```go
func TestStrings(t *testing.T){
  var s = "365 days"
  assert.Match(t, s, `\d[ ]*days`)
}
```



### PanicMatches(t, fn, matches)

而对于 panic 问题，PanicMatches 可以对 fn 发生的 panics 具体内容进行测试：

```go
func TestPanics(t *testing.T) {
	fn := func() {
		panic("omg omg omg!")
	}

	assert.PanicMatches(t, func() { fn() }, "omg omg omg!")
	assert.PanicMatches(t, func() { panic("omg omg omg!") }, "omg omg omg!")
}
```





### 其它



#### DiffValues(a, b)

DiffValues 可以用于比较 a 和 b 的不同之处，并以终端彩色输出的形式表现出来，因此你可以通过 print DiffValues(a, b) 的方式来获得一个彩色的终端输出，其式样类似于：

![image-20201107154351470](https://i.loli.net/2020/11/07/gtHK4Ou8ynraDd7.png)



#### DiffValuesDefault(a, b)

DiffValuesDefault 与 DiffValues 的区别在于， DiffValues 不关心那些为零值的字段的可能的不同之处，而 DiffValuesDefault 则不会略过这些字段。











🔚