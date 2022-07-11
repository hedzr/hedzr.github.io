---
layout: single
title: "c++ policies & traits"
date: 2021-07-23 05:00:00 +0800
last_modified_at: 2021-07-25 07:26:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,policy,policies,traits,modern c++ design,loki]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210722232648067.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  接上一篇顺便讲讲 policy pattern 及其相关，有点失控了...

---


## 前言

policy-based programming 是一个超级大的话题。我没有准备好要开启这么大的工程（去谈及它）。

这次是为了延伸上一篇提到的 Lockable policy 话题，而在元编程的 policy 范式范围中做一些回忆。

想到啥就说啥，别当真。



## Policy in metaprogramming



### Policy

在模板元编程中有一种被称为 Policy 的技法，它隐含了 Java 或 Golang 的 interface 的能力。换句话说，它是一种约定了一组方法的手段，如果你的 class 提供了这组方法的话，那么就叫做满足约定。

> 严格地说，这种“满足接口约定”是一种最终呈现，其实现机理也并非由 policy pattern 这种技法来提供的，而是 template metaprogramming 的一种编译法则，它是待决名 dependent name 的一种查找规则。
>
> 但是由于 policy 的实现效果与 Java 的接口的一定程度的相似性，所以我就混合到一起来成文了。

和这种技法相对应的是 C++ 语言中的纯虚函数，或者 interface。

> 是的，C++ 也有 interface，只不过它是扩展性的，MSVC（至少从 VC6 开始） 提供了这一支持，一般被用于 IDL/MIDL 开发场景。
>
> 此外，作为非标准拓展，interface 关键字常常都是可用的（在 gcc，clang 中也可以，但不一定是你想要的那种方式：[C++ Interface (Using the GNU Compiler Collection (GCC))](https://gcc.gnu.org/onlinedocs/gcc/C_002b_002b-Interface.html)）。

#### 纯虚函数方式

纯虚函数基本上是 C++ 语言层面上能够支持接口的唯一方法，符合标准的：

```c++
class IDemo
{
  public:
  virtual ~IDemo() {}
  virtual void OverrideMe() = 0;
};

class Parent
{
  public:
  virtual ~Parent();
};

class Child : public Parent, public IDemo
{
  public:
  virtual void OverrideMe()
  {
    //do stuff
  }
};
```

一个纯虚函数形如 `virtual void func() = 0`，`= 0` 表示 pure，此时不能提供函数体，不必提供一个就地的实现，`virtual` 往往不是必须的，但出于惯例，从来都会被在此时提供。

在 C++98/或者 C++11 之后，虚析构函数被明确了，所以当你在可能使用多态、或者当你定义了纯虚函数接口时，你必须显式地声明虚析构函数，这能够避免通过基类指针删除对象时的未定义行为。

> BTW，UB 常常很无聊。



#### Policy 方式

有时候，Policy Pattern 是很含混的。

这里有一个例子（来自于[这里](https://stackoverflow.com/questions/872675/policy-based-design-and-best-practices-c)）但做了改进和完善：

```c++
struct InkPen {
    void Write() {
        this->WriteImplementation();
    }

    void WriteImplementation() {
        std::cout << "Writing using a inkpen" << std::endl;
    }
};

struct BoldPen {
    void Write() {
        std::cout << "Writing using a boldpen" << std::endl;
    }
};

template<class PenPolicy>
class Writer : private PenPolicy {
public:
    void StartWriting() {
        PenPolicy::Write();
    }
};

void test_policy_1() {
    Writer<InkPen> writer;
    writer.StartWriting();
    Writer<BoldPen> writer1;
    writer1.StartWriting();
}
```

它展示了 Policy 的一种应用方法：你不必知道 duck 是谁，你只需要知道 duck 能够做什么。在这个例子中，PenPolicy 类的实体（实参）必须要能够 `void Write()`，否则编译期就会报错。

但是 Policy 并不被限制于你要做一个派生类才能实施这样的约定，在成员函数或者函数中也可以：

```c++
template <class PenPolicy>
class Writer {
  PenPolicy pt;
  public:
  Writer(PenPolicy&& pt_): pt(std::move(pt_)){}
  ~Writer(){}
  void StartWriting(){
    pt.Write();
  }
}

void test() {
  BoldPen bp{};
  Writer writer(bp);
  writer.StartWriting();
}
```

这种方式类似于 std::lock_guard 的实现机制，但严格地说它可能已经不是 policy pattern 了。这一点关系不大，只有做学术的才分的那么清，对吧，我特么全都要。

对于你的类以及类体系来说，该怎么设计是一种综合考量的问题，这取决于你的类库想要达到什么样的目的，遵循什么样的风格。



#### 小小结

我们已经知道了 Policy 模式的核心价值在于提供 duck type 的解耦能力。但实际上你需要了解到的最重要一点是，如前所述，解耦能力是由元编程技术提供的，并不是 policy pattern 专属，而本质上 policy pattern 是什么，**它是一种向某一父类注入新的行为能力的一种 pattern**：例如 BoldPen 在经由 Writer 的 wrap 之后，现在有了 StartWriting() 这一新的能力。

所以，按照这一理解，你能发现像 STL 中的 allocator 等等，都是 policy 手法的体现。

所谓的父类，你应该将其理解为 `template <class T> class TMP` 中的 `TMP`。而注入，你可以将其理解为 `template <class _T, class allocator = allocator<_T> > class vector { ... };` 中的 `allocator`。

当我们采用 Writer 的视角时，我们可以说，我们正在期待的 PenPolicy 必须是支持 `void write()` 的。在这个意义上，Policy pattern 可以被认为是一种完全解耦的 interface，如同 Golang 中的 interface 那样。在这一点上，Java 甚至还有所不如，因为它家的 interface 是强耦合的。

按照这样的定义，policy 范式就被大大延展了。它不仅仅代表着某一种或者几种惯用手法，而是形成了一个体系，这就是后来以及 C++11写作基本概念的 policy-based programming 风格。



### Traits

Policy 技法常常被与 Traits 一起提及，并被比较。Traits 也是模板元编程中的一种技法，这和 Rust 中的 Traits 是不同的，并且 Traits 本身（以及 Policy）出现的时间也早于 Rust 这门语言。

Traits 的目的在于从给定的类中抽出特定的属性，在标准库头文件 type_traits 中有大量的演示。

一个典型的 Traits 可能是这样的：

```c++
template< class T >
struct is_integral
{
    static const bool value /* = true if T is integral, false otherwise */;
    typedef std::integral_constant<bool, value> type;
};
```

它可以检测 T 是不是一个整数类型。

而进一步的多值 Traits 的典范是 iterator：

```c++
template<T>
struct iterator_traits<T*>
{
    using difference_type   = std::ptrdiff_t;
    using value_type        = T;
    using pointer           = T*;
    using reference         = T&;
    using iterator_category = std::random_access_iterator_tag;
};
```

它的目的在于为一个 iterator 类 T 提供/包装一组原型类型，这些类型将被用在容器类中，于是容器类的算法实现不必在 T 还是 T* 上伤脑筋，算法实现中都是用 value_type 和 pointer 这样的统一的类型名就可以了。在 STL 的实现中，会大量定义和用到统一的类型名，因为这样类的实现算法部分就不必考虑 T 究竟是 who 了。通常在一个类的一开始就会定义一堆类型，而 iterator_traits 则是容器类如 vertor 或 deque 等所使用的场所。

除了上面所描述的 type traits 之外，也有 value traits。实际上我们的第一个示例中，`is_integral::value` 就是一个 value traits。而且相似的做法在标准库中非常多，`std::enable_if::value` 就是一个好例子。



#### 收

Traits 只是顺便的顺便，在这里小小提一下，不再展开了。



### 小结

![image-20210722232648067](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210722232648067.png)

> FROM: <https://www.youtube.com/watch?v=SSsTRLyAG7Q>

policy-based design 是现代 C++ 编程所推崇的理念之一。所谓的 Modern C++ Design 不但是一种 C++11 以来的 [理念](https://en.wikipedia.org/wiki/Modern_C%2B%2B_Design)，实际上也正是源于早前的同名书籍的酝酿，该书有译本《C++设计新思维》。

policy 本身作为一种技法手段，在上世纪 90 年代就已经出现，并且在多个类库（MFC，OWL 等，不够精确，不易考证了，Prof-UIS C++ Library for MFC 等）中有所实作，并且曾有文章（可能是在 Code Project 上），但当时或许往往并不被刻意归纳和总结并命名为 xxxPolicy。不过后来在神库 Loki 中它就完完全全起势了，跟随 Modern C++ Design 一书所获的的一系列关注最终将编码理念推进了一大步。Loki 所制造的锁定语义（即 ClassLevelLockable 与 ObjectLevelLockable），其实也正是后来 C++11 中的 BasicLockable，这个现在被译作“基本可锁定”，我也是一种 #$%^@&​。实际上，C++11 标准在很大程度上是 Loki 和 Boost 的催生物。

> 一般的认识，Loki 比 boost 出生的更早。
>
> 不过，这是很难考证的事情。因为从上世纪 80 年代起，C++ 开发一直处于绝对强势的地位。20 年来的技法探讨、工程实践促使了 loki 和 boost 原始版本的出世，从 70 年代起约 40 年的实践才带来了 C++11 的标准面世，所以你不太可能区分出这两者究竟谁更早，在 2001 左右的大家都受到过相似的思潮（Turbo Vision，SGI STL 等等）培育。考虑到 boost 有着 2001 以来的一系列发展和逐渐完善的过程，且其首版（约1999）甚至连智能指针都没有，所以通常会认为它（现在人们所认识的那个 boost）比较于 loki 更晚一点。
>
> <https://web.archive.org/web/19991103202539/http://www.boost.org/>
>
> <https://en.wikipedia.org/wiki/Modern_C%2B%2B_Design>

### 再结

回想我对 template 的认知，也是遵循这样的过程：

1. 这个类怪通用的，给它戴上 `template <class T>` 的前缀，然后替换一下类型到 T。好了，搞定收工。
2. 再到初识 policies。一开始时将其当成策略来理解的。
3. 等到对组装爱不释手时，我才明白 template 并不是泛泛的类型，

可以这么说，只有在 Loki 为代表的现代 C++ 风格上能够做出优秀的组装工件的程序员，才能算是好手。既然在早几十年前没有那样的 C++ 编译器，那么那时候的如云好手们自不必受此约束。

#### 元编程是高精尖吗？

不过，如果我们不是对元编程抱有那么大的敬畏的话，以通用的眼光去看待编程能力，则你不必具有元编程能力才能被称作好手。元编程是在普通编程方法上加上一层编译过程，如果说普通编程是我编写代码并预判其运行效果的话，那么元编程则是我编写代码并预判其“生成”的代码，然后这些“生成”的代码将会有怎样的运行效果就是整个元编程套路的呈现了。所以如果你已经入了编程的大门的话，元编程是顺理成章的，一个好手自然不可能在元编程上无所建树。



:end:

因为耽搁，结果拖了两天，回头审视这篇文章，感觉不如意处甚多。不过即使是思考没有整理的太好，表述不怎么达意，也无所谓了。

因为我也无所求。
