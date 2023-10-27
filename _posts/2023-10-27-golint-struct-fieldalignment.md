---
layout: single
title: 'go lint 时的 fieldalignment 是什么'
date: 2023-10-27 05:00:00 +0800
last_modified_at: 2023-10-27 12:00:00 +0800
Author: hedzr
tags: [golang, lint]
categories: golang lint
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20231026110402900.png
  overlay_image: /assets/images/unsplash-image-3.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  专门谈论 fieldalignment 警告及其解决方法 ...
---



Golang 开发时，有时候看到 fieldalignment 警告，那么它为什么会发生，如何解决呢。



## About fieldalignment



### 结构体的 align 优化

结构体中的成员的对齐优化，是 lint 中一个含混的提法。初学者尤其是 C++ 程序员会对此迷惑，因为 string 就是一个指针，一个指针在结构体中当然是字长对齐的呀。

```go
type MyStruct struct { //nolint:govet //can be reordered
	id       uint64
	required string
	note     *string
}

```

这个结构体（去掉 nolint 宣告后）会得到 golangci-lint govet filedalignment 的报告：

`````
fieldalignment: struct with 32 pointer bytes could be 16 (govet)
`````

实际上呢，fieldalignment 这个家伙并不是真的在分析结构体的成员变量是不是有效地字长对齐了。它做的事是研究成员变量的排列顺序是否有利于 GC 扫描依赖关系。

所以解决的方法就很清楚了，将带有指针的字段尽量提前，隐式指针的类型（例如 string，slice，array，map 等）也如此，那么 GC 只需要扫描结构体的前面若干字节就能判断依赖关系了。

相反地，如果首先摆放占地面积很大的字段，那么 GC 可能不得不需要先遍历这块空间后才能发现 b 是需要登记一个引用计数的：

```go
// GC will scan all 808 bytes.
type gcNotOptimized struct {
  a [100]int64
  b *int64 
}
```

所以它的改进应该是：

```go
// GC will scan only 8 bytes.
type gcNotOptimized struct {
  b *int64 
  a [100]int64
}
```

> 严格地说，GC 的确不喜欢 [100]int64 这样的东西，这更是因为单个结构体占据空间太大了，这样的代码应该从设计上拆分，使用小巧的结构体才是被推荐的。
>
> 当然这个例子纯属故意，仅作示意，不够严谨之处就算了。

而前面的例子 MyStruct 应该改写为：

```go
type MyStruct struct {
	note     *string  // 指针优先
	required string   // 隐式指针次之
	id       uint64
}
```

关于 fieldalignment 还有一些可以讨论的，所以下次单独一篇聊一聊吧。呐，现在就是下一次了。







### 以上都是上篇文章中说过的

下面才是新的。





### 字段摆放原则

由于核心要素在于让 GC 扫描器针对 struct 从头开始扫描字段时尽可能少遍历内存块，那就要将指针型字段尽可能前置，方便扫描器只要检视这部分字段就可以了，然后占地面积少的小字段尽可能靠前，让扫描器必须检视的内存块的 Size 也足够小。

不过实际上 fieldalignment 的源码揭示的规则相当复杂，很难对其进行简化和归纳。

所以我们只能采用比较笨的办法，罗列出如下的顺序原则供参考：

1. map 最优先, key 和 value 的类型无关紧要。
2. 指针字段次优先。通常指向的类型无关紧要。
3. 隐式指针，彼此可以互相混排
   1. array（但不包括 byte array）
   2. slice（也包括 byte slice）
   3. string
   4. 嵌入结构及其 array 和 slice

4. primitives
   1. int, uint, float, complex 等的彼此顺序无关紧要
   2. 原则上可以与隐式指针混排

5. byte array
6. int8/byte 次之
7. bool 最后
8. 特别案例
   1. 空结构 `struct{}` 在语言规范层面被设计为 0 字节占用，而不是像结构那样被当作隐式指针。它需要被置于结构体最前端。
   1. 其后才是 map，pointer

总的来说，字段摆放和 C++ 惯例上的字长对齐是一点关系也没有的。而且所谓的不合格的顺序，其实和对齐之后节约空间也是一点关系都木有。

另外，C++ 程序员往往习惯于将字段按照小的功能组来分组排列，但这是没意义的，因为顺序首先需要屈服于 GC 的喜好。所以在 Golang 里面强迫症患者都得死，很可悲。

下面是不合适示例及其解决：

```go
type MyStruct struct { //nolint:govet //can be reordered
	id       uint64
	required string
	note     *string
}

type testCase struct { //nolint:govet //can be reordered
	given  float64
	expect string
}
```

改正后的写法如下：

```go
type MyStruct struct {
	note     *string
	required string
	id       uint64
}

type testCase struct {
	expect string
	given  float64
}
```







### 自动更正

实际上也有一个工具可以自动更正你的代码中的这些问题。

可以编译和安装这个工具：

```bash
go install golang.org/x/tools/go/analysis/passes/fieldalignment/cmd/fieldalignment@latest
```

然后你肯定已经将 `~/go/bin` 加入到环境变量 `PATH` 之中了。所以：

```bash
fieldalignment -fix <package_path>
```

就能够自动解决问题了。所有的结构体都会被重新摆布一遍，依据前面我们所提到过的那些基本准则。

然后，这个工具也有一个关键的短板，让人欲罢不能：它会在重新排布结构体成员的时候，将所有空行、注释通通删去。

这就要了老命了。

所以有时候，你应该 git commit 一次，然后用一下这个工具，然后通过 git diff 来 review 它所做的变更，然后进行若干后处理。

更好的办法是，参考前文所叙述的原则上的顺序，你可以自行手工排布，在编码的时候直接就消除一切相关警告。那就不会有问题了。



### 在 golangci-lint 中使用

自从从某人那边了解到 golangci-lint 之后，我就再也没用过 go lint 了。必须承认 golangci-lint 的可用性要优秀的多。当然有时候（特别是项目足够大时）它占用的 CPU 也太高了，以至于有时候必须对其进行限制。

在 Golang Project 的根目录放一个 .gilangci.yaml 就能在整个项目中应用其中使能的 validdators。

fieldalignment 是隶属于 govet 的一个子功能，在 .golangci.yaml 中可以这样启用它：

```yaml

linters:
  disable-all: true
  enable:
    - govet
  fast: false

linters-settings:
  govet:
    # report about shadowed variables
    check-shadowing: false
    fast: false
    # disable:
    #  - fieldalignment # I'm ok to waste some bytes
    enable:
      - fieldalignment
```

反之就取消 disable 注释然后去掉 enable 子句。



### 背后

如果感兴趣官方是怎么做的，可以研究源码：

 `fieldalignment` code <https://cs.opensource.google/go/x/tools/+/refs/tags/v0.1.7:go/analysis/passes/fieldalignment/fieldalignment.go>

golang 的源码也可以读读，可以从这里开始：

<https://github.com/golang/go/blob/master/src/runtime/mgcmark.go>

一般来说我并不推荐。

超大型项目不是那么好读的，也不一定有用处。特别是遇到活跃的项目都活跃的部位时更是很不值得。





## 后记

放飞自我时间到！

我这次很沉稳，啥也不说。



### REFs

稍微列出一点，

- [Structure size optimization in Golang (alignment/padding). More effective memory layout (linters). - by Roman Romadin - ITNEXT](https://itnext.io/structure-size-optimization-in-golang-alignment-padding-more-effective-memory-layout-linters-fffdcba27c61)
- [Can you help me understand "fieldalignment: struct with 40 pointer bytes could be 8" ? · golangci/golangci-lint · Discussion #2298](https://github.com/golangci/golangci-lint/discussions/2298)

更多的自己搜吧



### 申明

本文论及的排列顺序，纯属个人理解，并未得到相关官方认可。

参考本文所引起的后果辄非作者所控。

如有必要，请以 `fieldalignment -fix` 的结论为准。



🔚