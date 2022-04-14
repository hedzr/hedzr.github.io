---
layout: single
title: '[Go-Lib] 实现基本类型之上的类型扩展'
date: 2022-04-13 05:00:00 +0800
last_modified_at: 2022-04-15 00:05:00 +0800
Author: hedzr
tags: [golang, lib-writing]
categories: golang lib-writing
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220409105705674.png
  overlay_image: /assets/images/unsplash-image-3.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  类型扩展，与库作者谈研发 ...
---



## 基于基本类型进行类型扩展

Go 有一种不同于其它语言的类型扩展方法，即别名后扩充方法。

你可以对任何一种类型进行别名定义，然后在别名类型上进行扩充。

### 扩充 string 类型

假设我们想要制作一个 strings 库，提供有别于标准库 strings 的串操作，那么我们可以这么做：

```go
package tool

import "strings"

type String string // a type alias here

func (s String) Split(sep string) []string {
	return strings.Split(string(s), sep)
}
```

使用它：

```go
func TestString_Split(t *testing.T) {
	var s String = "hello world"
	t.Log(s.Split(" "))
	// Output:
	// [hello world]
}
```

这么做有如下好处：

1. 平面数据类型化：简单类型被包装为复杂类型，并且通常几乎没有运行时开销
2. 代码语义化：更富于自解释性
3. 代码自动完成能力被加强。在 IDE 中输入 `s.` 后即可获得代码自动完成列表，省却记忆负担。
4. 对业务逻辑做最省力的包装

实际上还有更多好处，不过谁用谁知道，就不多说了。

有没有坏处？

也许还是有的，总是需要单列一组代码，表面上看来会有额外的代码编写。



### 解释 Redis 键值

典型的用法，例如 redis 的键值的解释：

```go
type SessionsRedisKey string

func (s SessionsRedisKey) SessionID() string {
  return strings.Split(":")[0]
}

func (s SessionsRedisKey) UserID() string {
  return strings.Split(":")[1]
}

type SessionRedisKeyCached struct {
  SessionRedisKey
  slice []string
}

func (s *SessionRedisKeyCached) Set(s string) {
  s.SessionRedisKey = SessionRedisKey(s)
  s.slice = strings.Split(s, ":")
}

func (s *SessionRedisKeyCached) SessionID() string {
  return s.slice[0]
}

func (s *SessionRedisKeyCached) UserID() string {
  return s.slice[1]
}
```



### 包装位运算操作

我们有一个 int32 数据，高 4 位分别表示 deleted，parallel，suspended，powered，这是位运算操作，可以被打包到一个别名类型中：

```go
type UserStatus int32

func (s UserStatus) Serial() int32 { return s&0x0fffffff }

func (s UserStatus) Powered() bool { return s&0x10000000 != 0 }
func (s UserStatus) Suspended() bool { return s&0x20000000 != 0 }
func (s UserStatus) Parallel() bool { return s&0x40000000 != 0 }
func (s UserStatus) Deleted() bool { return s&0x80000000 != 0}

func (s *UserStatus) SetDeleted(b bool) {
  if b {
    (*s) |= 0x80000000
  } else {
    (*s) ^= 0x80000000
  }
}
```

好处不必多说了对吧。



### `evendeep.NameConvertRule`

在 `hedzr/evendeep` 库中也使用了这种技法，因为这样做代码可以更干净。例如我们对 struct tag 有一个 `NameConvertRule` 类型，它是 struct tag 的一部分，一个字段的 "copy" Tag 有这样的格式：`[NameConvertRule],strategies...`。例如一个实例可以是：

```go
type A struct {
  A SpecialStruct `copy:"A->A1,cleareq,omitempty,slicemerge"`
}
```

> 实际上，这种技法可以用于随时随地，无需特别表明身份。

具体到 `NameConvertRule` 这个片段，也就是 `A->A1`，我们的代码中是这样做的：

```go
// fieldTags collect the flags and others which are parsed from a struct field tags definition.
//
//     type sample struct {
//         SomeName string `copy:"someName,omitempty"`
//         IgnoredName string `copy:"-"`
//     }
type fieldTags struct {
	flags flags.Flags `copy:"zeroIfEq"`

	converter     *ValueConverter
	copier        *ValueCopier
	nameConverter func(source string, ctx *NameConverterContext) string `yaml:"-,omitempty"`

	// targetNameRule:
	// "-"                 ignore
	// "dstName"           from source field to 'dstName' field (thinking about name converters too)
	// "->dstName"         from source field to 'dstName' field (thinking about name converters too)
	// "srcName->dstName"  from 'srcName' to 'dstName' field
	targetNameRule string // first section in struct field tag, such as: "someName,must,..."
}

// NameConvertRule 
type NameConvertRule string
type nameConvertRule struct {
	IsIgnored bool
	From      string
	To        string
}

func (s NameConvertRule) IsIgnored() bool  { return s.get().IsIgnored }
func (s NameConvertRule) FromName() string { return s.get().To }
func (s NameConvertRule) ToName() string   { return s.get().From }

func (s NameConvertRule) get() (r nameConvertRule) {
	a := strings.Split(string(s), "->")
	if len(a) > 0 {
		if a[0] == "-" {
			r.IsIgnored = true
		} else if len(a) == 1 {
			r.To = strings.TrimSpace(a[0])
		} else {
			r.From = strings.TrimSpace(a[0])
			r.To = strings.TrimSpace(a[1])
		}
	}
	return
}

// ...
```

所以这段代码将 "copy" tag 的一切编码规则都打包了，代码的难度很低，没有解释的必要。

#### 效率？优化？

看起来 `NameConvertRule` 的效率不高是吗？

直觉上这么看是对的。可惜你忘记了数量级。对于通常不过 1..30 个字符的 "copy" Tag，就算每次都不得不做三次 strings.Split 调用，也仍不足以令其成为性能瓶颈。如果你真的去做 profiling 或者试试对 NameConvertRule 做 benchmark，实际结果将会佐证我的说法。

> 将日志输出设备从控制台改为文件，可以显著地提升 app 整体性能。控制台日志输出往往是最首要的应当被优化的点。

我的看法是，不要去做优化。知道吗，做优化是真正的熟手在代码完全定型之后的某一时刻才应该去做的事情。你丫要一菜鸟还是好好地去写你的商务规则 crud 吧。啊哈哈，不专指谁哈。

温和一点地说，优化过早是错误的。在早期不去做它。在后期要不要做，取决于你的经验和实测跟踪，而不是看着代码拍脑瓜。

退回一步，对当前的 `NameConvertRule` 做一个 Cached 扩展也极不艰难，又不会伤筋动骨，未来某一天说不定我会做的。

> 其实屡次都想吐槽那些面试问题，什么 GC 啦，优化啦，GMP 啦。诶，其实没什么用的哈，对于那些个岗位来说。



### More

在标准库中这种方法被广泛运用。



### 结语

还可以列举很多很多例子。

请举一反三吧。

这种编码技巧一般地包含两个关键技术：

1. 定义一个别名类型，然后对其进行函数扩充
2. 使用嵌入式的匿名结构，对基础结构进行无缝扩展

正确运用上述技巧能够带来更 meaningful 的代码，Reviewers 会感激你。



### 在其它语言中的类似手法

#### C++

使用模板方式可以得到类似效果：

```cpp
// just for std::string
template <class B>
  class splittable: public B {
    public:
    std::vector<B> split(B const& sep){
      return std::vector<B>{};
    }
  }

template <>
  class splittable: public std::string {
    public:
    std::vector<std::string> split(std::string const& sep) {
      std::vector<std::string> tokens;
      std::string token;
      std::istringstream tokenStream(s);
      while (std::getline(tokenStream, token, sep)) {
        tokens.push_back(token);
      }
      return tokens;
    }
  }

splittable<std::string> text = "split,this,into,words";
auto vec = text.split(",")
```

此外，C++11 支持 literal 后缀，可以提供更好的可读性。不过这种技巧并非在既有类型上进行扩展，而是截然不同的另一种类型。

但  C++ 中没有完全等同于 Swift 及 Kotlin 的相同能力，只能说是和 Go 的相似能力各有千秋吧。

最好的原生类型上的扩展，还是要看 Swift 与 Kotlin。（Smalltalk 等就不提了）

#### Swift

Swift 和 Object-C 都支持对任何类型直接扩展（Protocol Extension）。

```swift
extension Int {
    func repetitions(task: () -> Void) {
        for _ in 0..<self {
            task()
        }
    }
}

3.repetitions {
    print("Hello!")
}
// Hello!
// Hello!
// Hello!
```

并没有重写 swift 版的 split，因为没有必要，所以就截取了[官方的示例](https://docs.swift.org/swift-book/LanguageGuide/Extensions.html)做一个简短示意。

同样地，swift 也支持一个被称作 Computed Properties 的后缀技巧，这是 Protocol Extension 手法中的一种。具体请看官方的示例。



#### Kotlin

Kotlin 支持 Swift 类似的扩展方法，即 Kotlin Extension Function，这一语法糖准许在既有类型上直接扩充新的成员函数（实际上是一种像 C++ 宏一样的到 Java 的展开式，但不同于宏的是它是强类型的）。例如：

```kotlin
fun String.reverseCase(): String = map { if (it.isUpperCase()) it.toLowerCase() else it.toUpperCase() }.joinToString("")

val input = "Hello WorLD"
val expected = "hELLO wORld"
input.reverseCase() shouldBeEqualTo expected
```

由于 kotlin 在 String 上原生提供了 split()，所以上面给出的是一个 [reverseCase 的示例](https://stackoverflow.com/questions/51231848/how-to-reverse-the-case-of-a-string-in-kotlin)。



#### More and More

还可以举证更多例子，算了吧，就到这里。





### REFs

Go Libraries：

- [https://github.com/hedzr/errors](https://github.com/hedzr/errors)，`errors` 库中提供 `Code` 错误码类型，它的底层是一个 int 值，但被重新包装为了 `error` 对象。
- [https://github.com/hedzr/evendeep](https://github.com/hedzr/evendeep)，`evendeep` 中很多地方进行了别名类型的扩展，例如 `CopyMergeStrategy` 等等。

哦，对了 Again，evendeep 作为一个 dive-into-anything 库，还需要一些时日才能放出，这些天没有充分的时间去扣细节，敬请期待。



🔚