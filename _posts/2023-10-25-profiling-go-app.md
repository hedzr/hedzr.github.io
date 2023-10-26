---
layout: single
title: '高效 Golang 编码点滴锱铢'
date: 2023-10-24 05:00:00 +0800
last_modified_at: 2023-10-25 12:00:00 +0800
Author: hedzr
tags: [golang, profiling, pprof]
categories: golang profiling
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20231026110402900.png
  overlay_image: /assets/images/unsplash-image-3.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  谈论 Golang 代码优化问题，罗列一些常见手段关于 optimizations, 调优，等等 ...
---



Golang 开发时，减少不必要的资源、算力要求，是一种礼貌。

不是说因为内存、SSD 现在多便宜啊就说嫩个大数组搞个循环有啥关系啊，能够用 hashmap 的地方还是应该采用几乎直接命中的方案而不是遍历整个集合的策略的。

这原本该是一种礼貌的。

可惜的是完全无知的人意识不到那里不是荒原，也不应该因为是荒原就可以乱扔垃圾对不。



## Profiling

Profiling and Tune/Optimizing 是编程中例行的研究手段，用时髦的话来说就是这是一种洞见能力，能够洞察代码中的不优雅之处以便予以改正。

实际上很多编程惯例都是有章可循的，直接就能写出来，而非需要时候 pprof 找到瓶颈才来修订代码。

所以下面总结一些惯例出来，基本上到处都有不同形式地提过、论述过、讲解过这些手段，不过我这边就会加上我的思考来帮助你知其然且知其所以然，甚而至于能够推及未有罗列的其它场景。

> 例如高效的连接字符串和 rune 字符，也有其惯用法的，和下文的方案大同小异，但是就不必单开小节来讲了。
>
> 真要讲起来，区区一篇文章怎么可能？
>
> 现在的任何一个所谓的优化，背后都是数十年来计算机系统演进历史，PL 演进历史的浓缩。小到一个 8 bytes 对齐后边就涉及得到 CPU 的整个演进历史。
>
> 所以推而广之、举一反三的能力你必须有。

好，下面一一列举一下。

### 尽可能地将结构指针换为结构体

和一般的 C++ 老手的直觉完全不同，给函数传递结构体在 C++ 里面是很傻的行为，因为这带来隐含的结构体平凡拷贝（[Trivial Copy](https://en.cppreference.com/w/cpp/named_req/TriviallyCopyable)，按位按字节复制结构体本身，对于指针成员仅复制指针本身，而不制作指针所指向的对象的副本），所以老式的 C++ 程序员会记得传递结构体的指针，而善用新风格的则更愿意使用结构体的引用，特别是 const 方式的引用。例如：

```c++
#include <string>
#include <regex>

void replace(std::string const& str, std::string const& find, std::string const& repl) std::string {
  return std::regex_replace(str, std::regex(find), repl);
}
```

> 上面代码仅作示意，未经过编译运行和测试，可能存在记忆混淆带来的量子扰乱。

在 Golang 中，情况恰好相反。首先一个不同在于，Golang 传递一个结构体时也不过就是传递其实际内存地址，这相当于是一个指针了，也并不包含隐含的平凡拷贝行为。其次一个问题在于 GC。在绝大多数情况下，由于 GC 的逃逸分析带来的副作用，所以传递指针作为函数参数会带来额外的逃逸分析，即需要跳进到指针所指对象结构体中扫描逐个成员以求取其引用计数。这使得 Golang 指针比较结构体本身需要更多算力和资源作为代价。

以前我写过一篇文章 [Golang - 关于指针与性能](https://hedzr.com/golang/pointer/go-pointer/) 宣称说能用指针的时候一律使用指针。那话不能算错，因为场景不同。在常规编程领域，你首先需要关注自己的编程目标的达成，即代码逻辑和功能正确实现。使用指针会为你消除较多隐式的坑。例如函数传递结构体的代价在于这个结构体在函数体中的修改是不能反应到调用者的，

```go
package main

type A struct {
	F int
}

func Work(a A) {
	a.F = a.F + 1
}

func main() {
	var a = A{3}
	Work(a)
	println(a.F)
}

// Output:
// 3
```

这个结果理所当然。不过 Golang 初学者会因为无意识忽略而忘记检查，此时他们的愿意可能就被坑掉了。

或者说，那篇文章中的提法不免有点片面。

不过倒也无所谓。



#### 不要在函数体内修改只读的结构体参数

还是上面的示例代码，问题在 Work 函数这里就复杂化了。

此时，Work 函数中结构体由于成员被修改，因而产生了一个隐式的副本！

这不但带来了额外的一次拷贝，实际上也增加了 GC 分析的工作量。可以说不但没能获得结构体传输相比于指针参数所带来的益处，还变本加厉地增加了开销。改正的办法是采用指针作为参数。

```go
package main

type A struct {
	F int
}

func Work(a A) {
	a.F = a.F + 1
	println(a.F, &a.F)
}

func Work2(a &A) {
	a.F = a.F + 1
	println(a.F, &a.F)
}

func main() {
	var a = A{3}
	Work(a)
	println(a.F, &a.F)
  Work2(&a)
}

// Output (as a ref):
// 4 0xc00003e718
// 3 0xc00003e720
// 4 0xc00003e720
```

多么可悲啊。

或者说，Golang 是多么可怜的一种开发语言啊。但凡你的计组学的差了点，也都会在 Go 上面死得花样地难看。



#### 不得不使用指针

此外，

有的场景是必须指针才行的。

下面就略作探讨，也算是补齐以前旧文章对指针的未竟之处吧。

首先要知道的是，接受者只能是指针才能修改成员值的。

```go
type Int int

func (s Int) Set(i int) { s = i } // Wrong
func (s *Int) Set(i int) { *s = Int(i) } // It worked.

var i Int = 7
i.Set(8)
println(i)
```

Line 3 的写法也是一个坑，它能编译，能运行，没有任何错误，只有一个问题，本尊的值不会被 Set(i) 所修改。

要想达到目的，只能采用指针版本的 receiver（如同 Line 4 那样）。

进一步地，slice 场景也是类似的：你为一个 Slice 声明了别名类型，然后想要为其配备一些功能，例如对给出的参数进行装饰后再设置到 Slice 中，

```go
type IS []int

func (s IS) Set(args ...int) {
  for _,v:=range args {
    s = append(s, v+1)
  }
}

var is = IS{2, 3}
is.Set(1, 2)
fmt.Println(is)

// Outputs:
// [2, 3]
```

正确的方法是采用指针版本，然后书写方式上有一点点小技巧，即通过 `*s` 来访问 Slice 本体。

```go
type IS []int

func (s *IS) Set(args ...int) {
	for _, v := range args {
		*s = append(*s, v+1)
	}
}

var is = IS{2, 3}
is.Set(1, 2)
fmt.Println(is)

// Outputs:
// [2, 3, 2, 3]
```

再进一步，把结构体用作 map value 时，你有可能无法在迭代中修改结构体成员值。例如：

```go
var m1 = map[int]A{1: {4}}
for k, v := range m1 {
  if k == 1 {
    v.F *= 2
  }
}
fmt.Printf("%+v", m1[1])

// Output:
// &{F:4}
```

解决的办法是指针：

```go
var m1 = map[int]*A{1: {4}}
for k, v := range m1 {
  if k == 1 {
    v.F *= 2
  }
}
fmt.Printf("%+v", m1[1])

// Output:
// &{F:8}
```

#### 减少指针间接引用，尽可能使用 copy 引用

当然，本条目的主题还是优先使用 copy 引用以达到性能优化的目的。例如使用 bytes.Buffer，而不是使用 *bytes.Buffer，尽管书写时两者常常没有使用上的区别。

前面提到的函数传参使用结构体而不是结构体的指针，也是为了使用 copy 引用。都是为了有利于 gc 分析。

然后前面也提到旧文章 [Golang - 关于指针与性能](https://hedzr.com/golang/pointer/go-pointer/) 宣称函数传参使用结构体指针才是推荐的，因为这可以避免结构体的复制。这一点，本文中散乱在各种的解说能够给你全貌：

- 是的，指针避免结构体复制，但复制并不会总是发生。除非你在函数体中修改了结构体成员，导致 golang 不得不为其创建一个本地副本，此时就是一定会复制。其它情况下，是否总是复制我暂未有定论，可能需要追溯 golang 规范或者源代码才能确定。姑且可以认为是总是会发生吧。

- 指针参数带来额外的 GC 逃逸分析开销，究竟大不大、值不值，那就是一个神学问题。怎么办，pprof 具体分析和判断。其实普通情况下不至于为此大动干戈。

- 如果结构体超级大，那么 copy 引用在 GC 上的收益可能抵不过指针传递，那么此时可能你还是应该使用指针传参才对。

- 在 go 最新的几个版本里，有各种各样的微型优化。例如小于 16 bytes 的 string 将不会发生内存分配，等等。

  > 我想说 shit。虽然这种特性好得很，但是太随意了。





### 尽可能将多个小对象的构造合并为单一的一个大对象

一个善良的类库可能广泛地使用很多小对象，并且每个小对象都有配套的 new 函数。然后下面的代码就显得很正常：

```go
type Data struct {
  config *DataConfig
}

cfg := NewDataConfig(true, 1, "slow")
data = NewData(cfg)
```

这并没有什么不妥。但是它的性能弱于：

```go
data = &Data{
  config: &DataConfig{
    enabled: true,
    count: 1,
    mode: "slow",
  }
}
```

如果有必要且有能力，那么就不要分离地构造这些所属的小型对象，而且组合在一起，一次性地完成。



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

而前面的例子 MyStruct 应该改写为：

```go
type MyStruct struct {
	note     *string  // 指针优先
	required string   // 隐式指针次之
	id       uint64
}
```

关于 fieldalignment 还有一些可以讨论的，或者下次单独一篇聊一聊吧。







### 预分配空间

前面的字符串连接优化提示中已经讨论过 []byte 的预分配了。

但这个技巧还在广泛的场景中可被应用。

```go
type X struct {
    buf      []byte
    bufArray [16]byte // Buf usually does not grow beyond 16 bytes.
}

func MakeX() *X {
    x := &X{}
    // Preinitialize buf with the backing array.
    x.buf = x.bufArray[:0]
    return x
}
```

这里，使用 `[16]byte` 尤其是 CPU 字长对齐或者 CPU 流水线长对齐，或者内存总线字长对齐，或者内存页帧长度对齐（对于不同的目标的对象，常常有 16 字节，4K 字节，16K 字节等等不同的页帧或者类似页帧的对齐尺度，具体语言具体目标设备具体研究），全都是好的想法，并且能够有效果。这方面的细节进一步的研究请忘高性能编程、无锁编程、高频交易方面深入。

另一个案例是抽取栈帧：

```go
func getpc(skip int) (pc uintptr) {
	var pcs [1]uintptr
	runtime.Callers(skip+1, pcs[:])
	pc = pcs[0]
	return
}

func getpcsource(pc uintptr) Source {
	frames := runtime.CallersFrames([]uintptr{pc})
	frame, _ := frames.Next()
	return Source{
		Function: frame.Function,
		File:     checkpath(frame.File),
		Line:     frame.Line,
	}
}
```

这里的 [1]uintptr 是最优化的抽取具体一帧的做法。

当然，接下来的 getpcsource 函数也是实现的极为精简的了。这一套实现比较于 logrus 的逐帧遍历，分析 package name 来跳过 logrus 自身代码寻找到 caller 的算法要高效的多了。



### 局部变量聚集到一起进行声明和初始化

这个思想也在于减少对象分配，减少 gc 综合压力。例如：

```go
for k, v := range m {
  k, v = k, v
  go func() {
    // use k and v
  }()
}
```

不得不说荒唐镜啊。

对于这多个局部变量的捕获，更好的办法是使用一个临时 struct：

```go
for k, v := range m {
	x := struct{ k, v string }{k, v}   // copy for capturing by the goroutine
	go func() {
		// use x.k and x.v
	}()
}
```

而且也可以传入而不是捕俘：

```go
for k, v := range m {
	go func(k, v string) {
		// use k and v
	}(k, v)
}
```



此外，使用多变量同时赋值，用 var() 聚合声明，也都有利于 gc 分析的好处，尽管它们的好处微不足道：

```go
var k, v = 1, "str"

var (
  k = 1
  v = newData()
)
```



### 采用更有效的字符串连接

代码中经常会发生连接字符串的需求，这通常可以

1. 直接使用 `+` 运算符
2. 使用 fmt.Sprintf
3. 使用 strings.Builder
4. 使用 bytes.Buffer

我这里不给出分析或者 bench 证明，那有点小题大做。省力一点出结论，上述四种办法的常规写法都不是特别恰当的高效连接方案。例如下面这些写法：

```go
var s1 = "This solution"
var s2 = " is pretty good."
var s3 = s1 + s2
var s4

// fmt.Sprintf 和 + 难分高下，除非具体场景 profiling
s4 = fmt.Sprintf("%v%v", s1, s2)
s4 = fmt.Sprintf("%s%s", s1, s2) // 优于 %v

var s5 strings.Builder
s5.WriteString(s1)
s5.WriteString(s2)
var s6 = s5.String()

var s7 bytes.Buffer
s7.WriteString(s1)
s7.WriteString(s2)
var s8 = s7.String()
```

在通用场景中，bytes.Buffer 比较 strings.Builder 有微小的优势，但有时候则会更差。但两者都比 fmt 或者 + 更有效率。

然而，更好的方案是如下两个：

1. 对于字串追加数字，使用 strconv.AppendXXX 函数族
2. 对于字符串、rune 的通用连接，使用预分配空间后 append，
3. 或者使用 strings.Builder.Grow / bytes.Buffer.Grow 然后追加

```go
buf := []byte("Size: ")
buf = strconv.AppendInt(buf, 85, 10)
buf = append(buf, " MB."...)
s := string(buf)
```

效能更高的：

```go
roughSize = (6+2+4)*3 // 粗略估算，至少大于实际需要的串长
buf = make([]byte, 0, roughSize)
buf = append(buf, "Size: "...)
buf = strconv.AppendInt(buf, 85, 10)
buf = append(buf, " MB."...)
s := string(buf)
```

roughSize 如果能够提前精确计算那就更好。如果不能，那么也应保证至少会大于实际需要的串长。由于 Golang 字符串采用 UTF-8 格式，这种编码的特点是对于全部字平面来讲平均长度为 3 bytes（粗略地），所以 roughSize 需要乘以 3 来适应国际化场景。如果使用 []rune 则没有这样的忧虑。但是一切均需以 profiling 为话事者，虽然大多数情况下，两者的区别不值得要跑几遍 progiliing 来做 deed hard 优化。

这里的核心思想在于**提前一次性分配所需空间，而不是在需要时临时扩充**，也就是提前做单次 grow。如果有大量字符串串接的需求，这个思想可以带来显著的收益。

类似地也可以：

```go
roughSize = (6+2+4)*3 // 粗略估算，至少大于实际需要的串长
var sb strings.Builder
sb.Grow(roughSize)
buf.WriteString("Size: ")
buf.WriteString(strconv.Itoa(buf, 85, 10))
buf.WriteString(" MB.")
s := string(buf)
```

它和 append+strconv.AppendXXX 的差距不大，有时候更容易适应复杂场景。

[40+ practical string tips (cheat sheet)](https://yourbasic.org/golang/string-functions-reference-cheat-sheet/)



### 鼓励使用 sync.Pool

就我个人而言呢，这辈子都不可能用 sync.Pool 的。

哈哈玩笑一个。

实际上很多人都推荐使用 sync.Pool 的。这个数据结构原本是用于制作一个临时对象池，减少临时对象的分配。这种 Pattern 的本意是用于比方说数据库连接对象池，不必在需要连接时才向数据库发起连接请求，而是提前准备就绪，立即取用。然后现实生活中，它被 gophers 们用于提前分配内存，需要的时候直接取用，目的在于减少高频交易时分配内存的开销，进一步由于不必释放内存，还降低了对 GC 的请求频度，缓解了 GC 压力过重导致的 CPU High Usages 以及 app 的瞬时停止应答（由于算力被用于 GC 回收）问题。

该说什么呢？

这倒也算不得误用滥用，反而可能是一种合理的选择。

而且 syncPool 还有一个独特的优势，它是原子的，被用在并发编程中时省却很多“心智负担”。

我个人之所以很少用到它，纯粹是很多时候无法忍受泛型缺失或者阉割泛型的丑陋却又不愿意等而次之选择一个次优品作为代替。



### 其它的

fmtPrintf 基本上是代价较为昂贵的东西，它的 `%v` 很好用，但是会用到 reflect，那更是个性能坑货。

json 之类的东西，yaml 或者 toml 等等，全都代价昂贵。

磁盘 I/O 尽可能使用 Buffered I/O，这个带来的益处好过调优内存。

采用埋点日志方案（参考我的 [在 Go 中实现更好的埋点日志功能](https://hedzr.com/golang/logging/better-tracking-diagnosed-logging-in-go/)  ），编译 release 版本时关掉日志，可以大幅度提升性能。如果需要运行日志，在 release 版本中将其改为异步写入磁盘文件，这也是一种选项。

避免使用 any。如果有可能，则使用确切的数据类型。

不使用 reflect。





## 实作说明

在 Goland 中 Bench with Profiling 非常容易，也很容易查看 pprof 火焰图，以及 Allocated Objects 统计表。

![image-20231026110402900](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20231026110402900.png)

> 在一个 Test/Bench 函数的左侧边栏上直接做带有内存分配分析的 pprof，直接就可以。
>
> vscode golang 在 run a main function, test with profiling 上没有这些舒适度。
>
> vscode 也没有 run config，saved run/debug config, pinned，这些都是 Goland 的优势。

所以我都是被养刁了。

我本来是个很纯粹的 Bash 党。你可能知道我干过不少 DevOps 的工作，甚至还维护了一个 bash 函数集合与基本框架 [bash.sh](https://github.com/hedzr/bash.sh)。

所以以命令行方式使用 pprof 我也很熟悉的，奈何，少折腾也是好事。少数最关键的 pprof 命令行用法，可以参考我的旧文章 [Golang Profiling: 关于 pprof](https://hedzr.com/golang/profiling/golang-pprof/) ，它不是参考手册，顶多算个 cheetsheet，临时取用还是方便的。







## 后记

放飞自我时间到！

### 聊次优品选择

前面提到我不爱用 syncPool。

C++ 在这方面简直完美。就是说，C++ 随手撸个 connectPool 都可以性能、优雅尽皆上佳的程度，程序员有充分的操控能力。同时，还是类型完美泛化的。

强类型的泛化，采用 C++ 的零抽象+编译期计算思路，可以得到最佳性能，还可以规避了类似于 Golang interface{} 的封箱开箱代价。C# 如此的完美，但在基本类型上的封箱开箱潜在代价也还是令人不适。但我没有研究过 dotnetCore 3+ 以及 dotnet 5\6\7 在各种细节上的优化力度，就不多说了。而 Golang 的泛型，没有匿名函数泛化，以及方法函数泛化，那还能做什么？我的工程只需要一个 Pool[T] 就够了么？所以现在的 Golang 虽说有了很多泛型库，但其实就是个玩具，做做演示还可以，工程中实用，也就只能 minmax 了。什么时候标准库泛型化了，才能谈工程实作。

所以我的选择是这么高频的交易那就还是 C++ 吧，如果还不满意，那就 C 吧。什么 Golang，Python 都是弱爆了被吊打的家伙什。

至于 Rust，你可能注意到了我从来不写 Rust 的技术相关内容，因为这也是个丑陋到爆的家伙呀，而且我最讨厌有人把我当傻瓜一副为我好的嘴脸了。

回忆以前用了好多年才学会 Java，后来我总结，不是我太笨，而是太笨的语言我确实从心底里抵触它所以学不会，;D。这倒不是我为自己开脱，真哒！实在是完美主义者必会如此，忍不下去怎么办呢对不对。我一直也有计划想做一门自己专属的语言（C++ 我不满的地方也多了去了，特别是现在这些特性都那么异形，lambda 语法如此丑陋，Shit，后来我自己设想 C++ 增加 lambfa 也没想出来漂亮超过 Kotlin 的语法，也就作罢了），哎，可惜这种工程真的太庞大，又难以把这想法拿来合作，众口难调，那时候做出来的新 PL 还是我想要的那个吗。只能搁置下去了。

然后回忆学了好几年 Rust，也不能说不会，但是衷心地难受啊，循环引用搞死人。我不能像那样地生活，我确信是如此的。我学计算机的初心是啥哩，不就是能够操控计算机吗，整出个语言来操控我、把我当作初中二年级般的呵护，我谢谢你吖，那就还是算了吧。



### 聊不知道什么

前面也说到了若干 C++ 程序员在 Golang 上的难看的死相。

我就是一路踩坑上来的。

我一直在筹备想要把 [cmdr](https://github,cin/hedzr/cmdr) 重写一遍，把那些拙笨的细节给抹了去。然而因为一些个原因，这两年没有什么整块的时间能够静心编码，就一直搁置。所幸功能上 cmdr 还是有自己的特点的。而且其实即使未来升级 v2 了，那些 ugly 的代码也消失不了了，它们都成为黑历史隐藏在平时不可见之处，稍稍用心翻一翻依然能够抽出来。说到这里还要说点额外的话，我都不担心别人翻我的黑历史，毕竟我的项目没名气，我也不是什么有名气的人物，我也不喜欢有名气，我更喜欢放一堆人中间找不出来的效果，那谁会来专门跟我过不去呢是不是，这成本也不划算啊。然而，AI 和你讲什么成本？！它会把我的代码从仓库里翻检出来反反复复地研究、计算，some day 在某本 AI 教科书里面就能作为经典反面案例给公示出来，TM 下面还会用小字体给出一个链接，直达我的 GH repo source code source line。哎嘛的，越想越不舒服斯基。

由此，我也会对 Dave 等真正的大佬佩服的紧，他们给出的代码总是能够成为正面范本，从未有什么过了两年我懂的又多了，代码写的更好了的说法。换句话说，他们的代码水平没有学习和提升一说，一直都在巅峰高位。

这是不是也挺恐怖的。

都说到这里了，继续对 AI 嗤之以鼻。讲真，我不是一个人，我的眼里市面上的 AI 能叫什么 AI，全都是傻子。70～90年代理论界和工业界都比较淳朴，他们讲人工智能时，会谈论等效智力，所以强人工智能若能达到 4 岁小孩水平那就足够 OK 了。但当下的 AI 要谈智力岂非可笑。所以现在资本的眼光又在看 AGI 了。其实都是无聊的东西。按照我个人私下的看法，冯氏计算体系下面机器要诞生智慧，应该是不可能的事情。未来，甚至也许就是明年，不同的计算模式下诞生真正的人工智能说不定就会发生，但那肯定是不同的系统模式和计算模式了。我很久以前从 Prolog 开始思考如何达成和创造机器智能，但数度思考失败的结论就是上面的看法，现在的 CPU、内存、外存 这样的组合，通过计算来产生智慧，这在逻辑上、理论上都是不可行的。智慧，需要一种无限递归且能够自动中断的能力，以及一种无限发散然后自动归纳的能力，这些能力是先有计算体系所难以实现的。

收！

所以，旧文章如果有错误，我也不订正了，顶多写篇新的。

别说我不是什么大佬。就算真大佬犯错被喷的也多的是，我错错错点什么的又有什么了。

一笑而过。



### REFs

稍微列出一点，

- [Profiling Go Programs - The Go Programming Language](https://go.dev/blog/pprof)
- [Profile-guided optimization in Go 1.21 - The Go Programming Language](https://go.dev/blog/pgo)
- [Performance Measuring, Profiling, and Optimizing Tips for Go Web Applications - by Santosh Shrestha - wesionaryTEAM](https://articles.wesionary.team/performance-measuring-profiling-and-optimizing-tips-for-go-web-applications-20f2f812ff6e)
- [Optimising Go allocations using pprof](https://www.robustperception.io/optimising-go-allocations-using-pprof/)
- [Debugging performance issues in Go programs](https://software.intel.com/en-us/blogs/2014/05/10/debugging-performance-issues-in-go-programs)
- [Golang Slices And The Case Of The Missing Memory](http://openmymind.net/Go-Slices-And-The-Case-Of-The-Missing-Memory/)
- [Daily code optimization using benchmarks and profiling in Golang - Gophercon India 2016 talk - by karthic Rao - Medium](https://medium.com/@hackintoshrao/daily-code-optimization-using-benchmarks-and-profiling-in-golang-gophercon-india-2016-talk-874c8b4dc3c5) 

更多的自己搜吧





🔚