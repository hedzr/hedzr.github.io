---
layout: single
title: "Golang - 关于指针与性能"
date: 2021-05-26 12:23:00 +0800
last_modified_at: 2021-05-26 13:53:00 +0800
Author: hedzr
tags: [pointer, struct, map, slice, GC, performance, pros, cons, golang]
categories: golang pointer
comments: true
toc: true
excerpt: >-
  Golang pointer 最佳实践吗 ...
---



## 引子

指针是指向内存某区域起始点的一个地址值。所以你需要对计算机组成原理有充分的认识。一般说来，保持对这门课程讲述的内容的深刻的记忆，然后日积月累，才会真正达成理解。

在高级语言中，指针的概念和低级界面上的指针并无本质的不同。只是因为高级语言往往需要在不同程度上对底层物理结构进行包装，所以指针在不同的高级语言中，有着不同的表现形式。

然而，无论有多少的不同，在高级语言中有一点是相同的，如果一个指针是被分配的，那么你需要关心它何时被解除分配。当然，在带有 GC 的高级语言中，这一点往往表现的更为隐晦，因为在这些语言中，你真正关心的是：

1. 我创建的对象是不是能够被合理地回收
2. 合理回收我的对象不会消耗过分的 CPU 时间
3. 我的对象不会因为引用计数的原因迟迟得不到回收，进而导致内存不够
4. Oops，Null Exception！这是有 GC 的呀

而在不带有 GC 的高级语言中，我们可能关心的是：

1. 我创建了多少对象，我析构了它们吗
2. 我创建了大量的对象和频繁地析构，会否导致堆空间碎片问题
3. 堆空间碎片重整算法会不会太频繁而导致 CPU 超高
4. 会不会因为碎片太多而得到内存不足，哪怕实际上还有充分的内存
5. 我的智能指针用对了吗
6. Oops！Null Exception

自从指针这个概念问世以来，它就是一个关键性问题。

所以，在 Golang 中我打算总结一次指针如何用。当然，也就是马马虎虎地小结一下，梳理一下自己长久以来的各种碎片知识。

你需要有较充分的 Golang 编码经验，因为文内会忽略 Golang 编码的基本知识。



## Cases

### 应该使用结构还是它的指针？

你应该读一读 [Go: Should I Use a Pointer instead of a Copy of my Struct? - by Vincent Blanchon - A Journey With Go - Medium](https://medium.com/a-journey-with-go/go-should-i-use-a-pointer-instead-of-a-copy-of-my-struct-44b43b104963)，他们证明了 struct 的 copy 可能通常会 8 倍速快于使用 struct 指针。原因在于使用指针使得 struct 变量被置于 heap（经过逃逸分析后），而 GC 因此而受到更大的压力。

> 换句话说，使用指针时，GC回收一个变量的开销更大，而且大到了足以影响效率的程度。这个实在是违背C++程序员的直觉啊。

go 的值传递没有想象中那么大的开销，原因一部分是因为副本的复制比想象中更快。



#### 是这样吗

然而，只要你拿不准是否该使用指针，一切情况下，请一律使用指针。基本上你不必担心使用指针导致的 GC 压力。

因为除非你在频繁地制造小对象并且立即抛弃它们，否则大多数时候 GC 都不会试图*立即*回收你的指针及其指向的 struct 等对象，所以所谓的 GC 压力只是虚妄。

想象一下，我们为什么使用结构？因为有一个块包含不同的数据，我们需要描述这个块。所以当我们使用 struct 时，我们往往需要它生存较长的时间，而显然地，在它的生存周期里 GC 必须对它总是视而不见。所以一般情况下，你总是应该使用指针，就是在讲这样的场景。

也就是说，struct 是不是应该立即构造为指针对象，取决于：

1. 生存周期长短：长周期总是用指针，短的嘛随意好了
2. 结构实体尺寸大小：一个结构几百字节甚至几十KB的话，你最好采用指针，否则极端情况下你的栈空间甚至会溢出，特别要注意这种情况，它不但难以检测，而且是安全风险点。

此外，struct 也有一些通识：

1. 当你需要修改结构题内部数据时，必须使用指针

   ```go
   type xS struct {
     Status bool
   }
   
   func (x xS) SetStatusButWrong(b bool) { x.Status = b }
   func (x *xS) SetStatus(b bool) { x.Status = b }
   ```
   
1. 当结构类型包含 `sync.Mutex` 或者 sync 包中对象这样的字段成员时，总是使用指针构造方式，防止潜在的拷贝可能性

   ```go
   type xinS struct {
     sync.RWMutex
   }
   
   func newXinS() *xinS {
     return &xinS{}
   }
   ```

   


#### 接收器

结构的 receiver 被推荐优先选用指针。原因见前面的通识部分案例，因为你往往需要从结构之外对其进行设置（写入）。

这个坑/特性，已经很著名了。所以本小节不再赘述了。





#### 作为方法参数

一般来说，将 struct 作为方法参数时，总是使用指针形式。

即使当你在使用一个 struct 对象而非其指针构造形式时，如果将其传递给方法，也应该采用取地址的方式传递它的指针形态。除非你明确地想要结构的副本被传递给方法（或许你想要避免方法给该结构带来副作用）。

采用指针形态进行结构传参时，可以避免对结构实体进行拷贝。

```go
type xS struct {
  I8 int8
  I int
}

func A(){
  x := x{ 1, 2, }
  B(&x)
  println(x)
}

func B(x *xS) {
  x.I++
}
```

在代码示例中，B 方法有两个特性：

1. 可以避免传参 x 时不必要的结构体拷贝
2. 能够修改 x 的成员，并能将这一副作用返回给调用者

明确到这样两个事实之后，根据你的实际需要去决定要不要使用指针形态。但你的实际需要，根据经验来说，都会 say yes I do。





### 基本类型

诸如 bool，int，float，string 这样的基本类型，通常不必使用指针。

一来它们的内存拷贝代价不高。二来针对它们往往有语言层面的特殊优化，你不必在这些细枝末节上消耗脑力。

值得注意的是，基本类型（Primitive Datatypes）有时候略微有一点歧义。尤其是在 string 对象上，不同语言是否对它有不同的设计方案以及取舍策略。

不过在 Golang 中，我们可以将 string 视作基本类型。按照 Golang 语法规范的定义，它也确实是基本类型的一种。



### map 等等

map，slice，channel 不需要使用指针。

原因很有意思，因为它们本身就是指针：

```go
var m map[string]bool
if m == nil {
  println("an empty (or uninitialized) map is always nil")
}
```

所以清空一个数组是这样的：

```go
var ss []int
// ... append some items into ss

// and reset ss
ss = nil
```

其它可以自行想象。



### 使用 `[]T` 还是 `[]*T`

只要有可能，总是使用 `[]*T`。

因为当采用 range 迭代时，range 操作符总是会对 item 进行拷贝。所以对于 `[]T` 来说，range 迭代时是无法修改 T 的内容的——或者说，修改了也会被立即废弃，无法被体现到 `[]T` 中去。

```go
type T struct {
  I8 int8
}

func Test(){
  var ta []*T
  for i := 0; i < 10; i++ {
    ta = append(ta, &{ int8(i) })
  }
  for _, t := range ta {
    t.I8++
  }
}
```

在上面的代码示例中，`ta` 最终会正确增量，得到一个 1..10 的数组。



## 总结

本文前面介绍的全是废话，所有列举的准则条目都不是真的。真的只有一句话：

**除了基本类型，map，slice，channel 等等，在一切有可能的时候，一律采用指针。**

至于谁谁谁在说 XXX 能够带来 n 倍的性能提升。忘记他们吧，性能提升、逃逸分析全数都是无意义的，你根本无需考虑额外的因素。一个残酷的事实是：优化根本轮不到你来考虑，即使你时刻考虑到优化也不能代表你是一个好程序员，说不定正好相反。

### 为什么？

记住这样的公认的准则：

1. 不要过早优化
2. 产品定型后，利用 profiling 技术来寻找优化点

作为一个程序员，写对代码是基本要求。在做不到这一点之前，别去人云亦云地讨论性能。



## References

- [Go: Should I Use a Pointer instead of a Copy of my Struct? - by Vincent Blanchon - A Journey With Go - Medium](https://medium.com/a-journey-with-go/go-should-i-use-a-pointer-instead-of-a-copy-of-my-struct-44b43b104963)
- [Golang Profiling: 关于 pprof - hzSomthing](https://hedzr.com/golang/profiling/golang-pprof/)
- BTW, a good post: [People development through coaching: How we use a coaching culture to facilitate career progression](https://engageinteractive.co.uk/blog/people-development-through-coaching)





:end: