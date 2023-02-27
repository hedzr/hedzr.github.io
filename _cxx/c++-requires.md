---
layout: single
title: 'C++ 元编程技术笔记'
date: 2023-02-25 00:07:11 +0800
last_modified_at: 2023-02-25 00:29:11 +0800
Author: hedzr
tags: [cxx]
categories: cxx
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-1.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  C++ 元编程技术笔记 ...
---

C++ 元编程技术笔记

> **Caution**
>
> | 这里纯粹是曾经的快速笔记，不保证质量，罗列于此仅供触类旁通。
>

## 使用模板类作为模板参数

using template class as template parameters

 [C++ template template parameter - Stack Overflow](https://stackoverflow.com/questions/52803490/c-template-template-parameter) 

```cpp
template<typename X>
struct GenericThing
{
    X data;
};

template<template<typename> class T, typename E>
struct Bar
{
    T<E> sub; // instantiate T with E
    Bar() : sub() { cout << "Bar" << endl; }
};

int main()
{
    Bar<GenericThing, int> intbar;
    Bar<GenericThing, float> floatbar;
    return 0;
}
```



### 定义别名时注意：

```cpp
template<typename T, typename = void>
struct gg {
};

template<template<typename, typename...> class Source, typename T, typename... TArgs>
struct wrapper {
    using Source<T, TArgs...>::Source;

    typedef T value_type;
    template<typename T_, typename... Args_>
    using base_type_t = Source<T_, Args_...>;
    using self_type_t = wrapper;
    using base_type = Source<T, TArgs...>;
    using self_type = wrapper<Source, T, TArgs...>;
};

template<typename T>
using ggw = wrapper<gg, T>;
// 此时注意不要使用 wrapper<gg<T>, T> 这样的写法
```





## 继承基类的构造函数

 [using 声明 - cppreference.com](https://zh.cppreference.com/w/cpp/language/using_declaration) 

```cpp
using typename(可选) 嵌套名说明符 无限定标识 ;		(C++17 前)
using 声明符列表 ;		(C++17 起)
```

示例：

```cpp
#include <iostream>
 
// 基类 B
struct B
{
    virtual void f(int) { std::cout << "B::f\n"; }
    void g(char)        { std::cout << "B::g(char)\n"; }
    void h(int)         { std::cout << "B::h\n"; }
protected:
    int m; // B::m 是受保护的
    typedef int value_type;
};
 
// 派生类 D
struct D : B
{
    using B::m; // D::m 是公开的
    using B::value_type; // D::value_type 是公开的
 
    // using 的非必要使用场合：
    // B::f 已经公开，它作为 D::f 公开可用，
    // 并且下面的 D::f 和上面的 B::f 有相同的签名。
    using B::f;
    void f(int) { std::cout << "D::f\n"; } // D::f(int) **覆盖** B::f(int)
 
    // using 的必要使用场合：
    // B::g(char) 被 D::g(int) 隐藏，
    // 除非它在这里通过 using B::g 显式暴露为 D::g(char)。 
    // 如果不用 using B::g，将 char 传递给 D::g(char) 实际上调用的是下面定义的 D::g(int)，
    // 因为后者隐藏了 B::g(char)，并且 char 形参会因此隐式转型到 int。
    using B::g; // 将 B::g(char) 作为 D::g(char) 暴露，
                // 后者与下面定义的 D::g(int) 完全是不同的函数。
    void g(int) { std::cout << "D::g(int)\n"; } // g(int) 与 g(char) 均作为 D 的成员可见
 
    // using 的非必要使用场合：
    // B::h 已经公开，它作为 D::h 公开可用，
    // 并且下面的 D::h 和上面的 B::h 有相同的签名。
    using B::h;
    void h(int) { std::cout << "D::h\n"; } // D::h(int) **隐藏** B::h(int)
};
 
int main()
{
    D d;
    B& b = d;
 
//  b.m = 2;  // 错误：B::m 受保护
    d.m = 1;  // 受保护的 B::m 可以作为公开的 D::m 访问
 
    b.f(1);   // 调用派生类的 f()
    d.f(1);   // 调用派生类的 f()
    std::cout << "----------\n";
 
    d.g(1);   // 调用派生类的 g(int)
    d.g('a'); // 调用基类的 g(char)，它**只是因为**
              // 派生类中用到了 using B::g; 才会暴露
    std::cout << "----------\n";
 
    b.h(1);   // 调用基类的 h()
    d.h(1);   // 调用派生类的 h()
}
```





## Extract...



### template parameter class

- [C++ type traits to extract template parameter class - Stack Overflow](https://stackoverflow.com/questions/11056714/c-type-traits-to-extract-template-parameter-class) 
-  [c++ - Extract first template parameter from a template template parameter and using it inside the class? - ZaiZheLe Developer Zone](https://zaizhele.net/qa/?qa=305700/) 
- 

1.

You can use this:

```cpp
template<typename T>
struct extract_value_type //lets call it extract_value_type
{
    typedef T value_type;
};

template<template<typename> class X, typename T>
struct extract_value_type<X<T>>   //specialization
{
    typedef T value_type;
};
```

It should work as long as the template argument to `extract_value_type` is of the form of either `T` or `X<T>`. It will not work for `X<T,U>`, however. But then it is easy to implement it in C++11 using variadic template.

Use it as:

```cpp
template <typename T>
struct MyTemplate
{
    typedef typename extract_value_type<T>::value_type value_type;
};
```

Online demo : http://ideone.com/mbyvj

------

Now in C++11, you can use variadic template to make `extract_value_type` work with class templates which take more than one template arguments, such as `std::vector`, `std::set`, `std::list` etc.

```cpp
template<template<typename, typename ...> class X, typename T, typename ...Args>
struct extract_value_type<X<T, Args...>>   //specialization
{
    typedef T value_type;
};
```

Demo : http://ideone.com/SDEgq





## Constraint...

收集和研究各种约束手法





### template type to copy-assignable

要求模板参数类必须为带有拷贝构造函数实现的。

From: https://stackoverflow.com/questions/63802972/c-how-to-constrain-template-type-to-copy-assignable-types

#### static_assert

You can also use [`static_assert`](https://en.cppreference.com/w/cpp/language/static_assert) for this, which lets you generate a nicer error message:

```cpp
template<typename T>
class A
{
    static_assert (std::is_copy_assignable_v<T>, "T must be copy-assignable");
};


```

#### enable_if

You can use [`std::enable_if`](https://en.cppreference.com/w/cpp/types/enable_if) like this:

```cpp
template<typename T, 
  typename = std::enable_if_t<std::is_copy_assignable_v<T>, void>> 
class A {};
```

Here's a [demo](https://godbolt.org/z/5shcsz) on Compiler Explorer using the following code:

```cpp
#include<type_traits>
#include<ostream>

template<typename T, 
  typename = std::enable_if_t<std::is_copy_assignable_v<T>, void>> 
class A {};

int main() {
    A<int> a;
    // A<std::ostream> b; // error
}
```

------

In c++20, you could write:

```cpp
template<typename T> 
  requires std::is_copy_assignable_v<T> 
class A {};
```

which is easier to read, and produces a better error message.

And here's a [demo](https://godbolt.org/z/P3z8Tx) of that:

```cpp
#include<type_traits>
#include<ostream>

template<typename T> 
  requires std::is_copy_assignable_v<T> 
class A {};

int main() {
    A<int> a;
    // A<std::ostream> b; // error
}
```



#### good

注意，一个 class 中会有自动生成的复制构造函数，除非：

- 被显式地 delete 了

  ```cpp
  class A {
    public:
    A(A const&) = delete;
  };
  ```

- 某个基类无法复制构造

所以可以采用辅助的 enable_if 模板参数来进行约束：

```cpp
template<typename T,
typename = std::enable_if_t<std::is_copy_assignable_v<T>, void>>
  class A2 {};

inline A2<int> test_A2() {
  A2<int> a2;
  return a2;
}

class T1{};

inline test_T1(){
  A2<T1> a2;
  return a2;
}
```







## iterator_traits

例子 1

```cpp
// iterator_traits example
#include <iostream>     // std::cout
#include <iterator>     // std::iterator_traits
#include <typeinfo>     // typeid

int main() {
  typedef std::iterator_traits<int*> traits;
  if (typeid(traits::iterator_category)==typeid(std::random_access_iterator_tag))
    std::cout << "int* is a random-access iterator";
  return 0;
}
```



`iterator_traits` 往往被用在 iterator 实现类中，以便能取出一个代名词（通过类型别名），例如 pointer 能够更好地指代用户类型的指针形式，这比直接使用 T* 要更具备可读性以及可写性。

```cpp
template <class T>
struct iterator_traits {
  typedef typename T::iterator_category iterator_category;
  typedef typename T::value_type value_type;
  typedef typename T::difference_type difference_type;
  typedef typename T::iterator_category iterator_category;
  typedef typename T::pointer pointer;
  typedef typename T::reference reference;
};
```

`std::iterator<>` 通过模板参数以及内部声明语句向其提供所需的依赖类型，所以一般来说这些类型（例如 `T::value_type`）无需你显式声明。

`iterator_traits` 一次性地提供一组类型别名，这些别名也可以被你的类实体所使用。

```cpp
class TT{};

assert(std::is_same<std::iterator_traits<TT>::pointer, TT*>);
```

精简后的 `iterator_traits` 是与如下实现代码相等价（或者相近似）的：

```cpp
template <typename T>
struct iterator_traits
{
    typedef std::random_access_iterator_tag iterator_category;
    typedef T                               value_type;
    typedef T*                              pointer;
    typedef T&                              reference;
    typedef std::ptrdiff_t                  difference_type;
};
```







## Sanitize & Google Sanitizers

sanitize 是一种动态代码分析技术。

一般来说，动态代码分析技术手段包含这些工具和相关技术：

- Google Sanitizers
- Valgrind memcheck
- Profiler - CMake Profiling
- Code coverage



### Google Sanitizers

- [Google sanitizers - CLion](https://www.jetbrains.com/help/clion/google-sanitizers.html#AsanChapter) 
-  [c++ - What's the proper way to enable AddressSanitizer in CMake that works in Xcode - Stack Overflow](https://stackoverflow.com/questions/44320465/whats-the-proper-way-to-enable-addresssanitizer-in-cmake-that-works-in-xcode) 
-  [c++ - Enabling AddressSanitizer with Cmake - Stack Overflow](https://stackoverflow.com/questions/50897079/enabling-addresssanitizer-with-cmake) 
-  [cmake - C++ AddressSanitizer with CMakeLists.txt results in asan errors - Stack Overflow](https://stackoverflow.com/questions/50163828/c-addresssanitizer-with-cmakelists-txt-results-in-asan-errors) 
-  [Add sanitizers only to debug build in CMake - Stack Overflow](https://stackoverflow.com/questions/61059783/add-sanitizers-only-to-debug-build-in-cmake) 
-  [c++ - LLVM address sanitizer with CMake - Stack Overflow](https://stackoverflow.com/questions/47603005/llvm-address-sanitizer-with-cmake) 
-  [Integrating sanitizer tools to CMake builds](http://www.stablecoder.ca/2018/02/01/analyzer-build-types.html) 
-  [Compiler sanitizers — conan 1.18.5 documentation](https://docs.conan.io/en/1.18/howtos/sanitizers.html) 
- 
- 
- 



Sanitizers are tools that perform checks during a program’s runtime and returns issues, and as such, along with unit testing, code coverage and static analysis, is another tool to add to the programmers toolbox. And of course, like the previous tools, are tragically simple to add into any project using CMake, allowing any project and developer to quickly and easily use.

A quick rundown of the tools available, and what they do:

- [LeakSanitizer](https://clang.llvm.org/docs/LeakSanitizer.html) detects memory leaks, or issues where memory is allocated and never deallocated, causing programs to slowly consume more and more memory, eventually leading to a crash.

- AddressSanitizer

  is a fast memory error detector. It is useful for detecting most issues dealing with memory, such as:

  - Out of bounds accesses to heap, stack, global
  - Use after free
  - Use after return
  - Use after scope
  - Double-free, invalid free
  - Memory leaks (using LeakSanitizer)

- [ThreadSanitizer](https://clang.llvm.org/docs/ThreadSanitizer.html) detects data races for multi-threaded code.

- UndefinedBehaviourSanitizer

  detects the use of various features of C/C++ that are explicitly listed as resulting in undefined behaviour. Most notably:

  - Using misaligned or null pointer.
  - Signed integer overflow
  - Conversion to, from, or between floating-point types which would overflow the destination
  - Division by zero
  - Unreachable code

- [MemorySanitizer](https://clang.llvm.org/docs/MemorySanitizer.html) detects uninitialized reads.









## ReactiveX

 [ReactiveX/RxCpp: Reactive Extensions for C++](https://github.com/ReactiveX/RxCpp) 

 [ericniebler/range-v3: Range library for C++14/17/20, basis for C++20's std::ranges](https://github.com/ericniebler/range-v3) 

 [**Reactor 3 参考指南**](https://easywheelsoft.github.io/reactor-core-zh/index.html) 





### 适用场景

[Rx操作符决策树](https://link.juejin.cn/?target=http%3A%2F%2Freactivex.io%2Fdocumentation%2Foperators.html%23tree)



### rxjava 操作符



1. https://reactivex.io/documentation/operators.html#categorized

2. [**Operators · ReactiveX文档中文翻译**](https://mcxiaoke.gitbooks.io/rxdocs/content/Operators.html) 

3. https://reactivex.io/assets/operators/legend.png

   **Filtering Observables**

   Operators that selectively emit items from a source Observable.

   - [**`Debounce`**](https://reactivex.io/documentation/operators/debounce.html) — only emit an item from an Observable if a particular timespan has passed without it emitting another item
   - [**`Distinct`**](https://reactivex.io/documentation/operators/distinct.html) — suppress duplicate items emitted by an Observable
   - [**`ElementAt`**](https://reactivex.io/documentation/operators/elementat.html) — emit only item *n* emitted by an Observable
   - [**`Filter`**](https://reactivex.io/documentation/operators/filter.html) — emit only those items from an Observable that pass a predicate test
   - [**`First`**](https://reactivex.io/documentation/operators/first.html) — emit only the first item, or the first item that meets a condition, from an Observable
   - [**`IgnoreElements`**](https://reactivex.io/documentation/operators/ignoreelements.html) — do not emit any items from an Observable but mirror its termination notification
   - [**`Last`**](https://reactivex.io/documentation/operators/last.html) — emit only the last item emitted by an Observable
   - [**`Sample`**](https://reactivex.io/documentation/operators/sample.html) — emit the most recent item emitted by an Observable within periodic time intervals
   - [**`Skip`**](https://reactivex.io/documentation/operators/skip.html) — suppress the first *n* items emitted by an Observable
   - [**`SkipLast`**](https://reactivex.io/documentation/operators/skiplast.html) — suppress the last *n* items emitted by an Observable
   - [**`Take`**](https://reactivex.io/documentation/operators/take.html) — emit only the first *n* items emitted by an Observable
   - [**`TakeLast`**](https://reactivex.io/documentation/operators/takelast.html) — emit only the last *n* items emitted by an Observable

- [RxJava2.0实用操作符总结及原理简析](https://juejin.cn/post/6844903517438607367)



![op](data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1942 1576"%3E%3C/svg%3E)



- [RxJava系列1(简介)](https://zhuanlan.zhihu.com/p/20687178)
- [RxJava系列2(基本概念及使用介绍)](https://zhuanlan.zhihu.com/p/20687307)
- [RxJava系列3(转换操作符)](https://zhuanlan.zhihu.com/p/21926591)
- [RxJava系列4(过滤操作符)](https://zhuanlan.zhihu.com/p/21966621)
- [RxJava系列5(组合操作符)](https://zhuanlan.zhihu.com/p/22039934)
- [RxJava系列6(从微观角度解读RxJava源码)](https://zhuanlan.zhihu.com/p/22338235)
- [RxJava系列7(最佳实践)](https://zhuanlan.zhihu.com/p/23108381)









## CRTP



如果觉得虚函数与其重载如此痛苦竟然不能忍的话，你可以考虑 [谈 C++17 里的 Builder 模式 所介绍的 CRTP](https://hedzr.com/c++/algorithm/cxx17-builder-pattern/#crtp) 惯用法的能力，CRTP 在模板类继承体系中是个很强大的编译期多态能力。



### What's it?

CRTP 是一种 C++ 惯用法，它比 C++11 出生的早得多。在 Visual C++ 年代，ATL，WTL 以及少量的 MFC 均大规模地使用了这种技术，后来的 ProfUIS 也如此。

简单地说，CRTP 的目的在于实现编译期的多态绑定，实现方法是向基类的模板参数中传入派生类类名，于是基类就能够借助 `static_cast<derived_t>(*this)` 语法来获得派生类的“多态”的操作能力了：

```cpp
template <typename derived_t>
class base{
  public:
  void do_sth(){
    static_cast<derived_t>(*this)->show();
  }
  void show(){hicc_debug("base::show");}
};

template <typename T>
class derived: public base<derived> {
  public:
  T _t{};
  void show(){
    hicc_debug("t: %s", hicc::to_string(_t).c_str());
  }
};
```



#### 相似的旁路继承 - 一个例子

https://godbolt.org/z/oqEPsGzqe

```cpp
#include <iostream>

struct base_type {
  virtual void dump(){
    std::cout << "base_type!" << '\n';
  }
};

template<class T>
struct baseT {
  T* ThisPtr() { return static_cast<T*>(this); }
  auto& This() { return *ThisPtr(); }
  
  void call() { This().dump(); }
};

class derived: public base_type, public baseT<derived> {
  public:
  using baseT<derived>::baseT;
  
//   void dump() { 
//       base_type::dump();
//       std::cout << "derived!" << '\n';
//   }
};

int main(){
  derived d;
  d.call(); // call derived::dump()
}
```





### 有什么用处，适用场景







## Range-based for loop in c++17

实际上本文内容也适用于 C++11，因为这一特性源自当时。

对于范围 for 循环的如下语句形式来说，

```cpp
attr(optional) for ( init-statement(optional) range-declaration : range-expression )
loop-statement
```

编译器以语法糖的态度对其进行展开，展开式如同这样：

```cpp
{
	init-statement
	auto && __range = range-expression ;
	auto __begin = begin-expr ;
	auto __end = end-expr ;
	for ( ; __begin != __end; ++__begin)
	{
		range-declaration = *__begin;
		loop-statement
	}
}
```

这是适用于 C++20 以上的规范性要求，但在早期（C++17 及以前），规范性要求稍稍有点宽泛：

```cpp
{
	auto && __range = range-expression ;
	for (auto __begin = begin-expr, __end = end-expr; __begin != __end; ++__begin)
	{
		range-declaration = *__begin;
		loop-statement
	}
}
```

按理说这一展开式并无不妥，只要是符合 C++11 的编译器均不应该在这一展开行为上产生歧义。但是这一表达的确不够严谨，因为早期 C,C89 等等的 for initial-statement 在 for 之后是可见的，从一以贯之的延续性角度来看，这样的表述可能误导阅读规范的人，因为随后采用了更精确无歧义的表述：C++20 开始的展开式表述适合于任何背景的阅读者，他们从此表述中能够得到完全相同的理解——而不至于因为其不同的背景而产生分歧。

这一展开式尚且包含附注来定义何者为初始化表达式，何者为 begin-expr, end-expr，等等。你可以检查其详情：

>  [Range-based for loop (since C++11) - cppreference.com](https://en.cppreference.com/w/cpp/language/range-for) 

但不管它，我们理解到，基于范围表达式的 for 循环在枚举范围对象时，要求你的对象应该实现 begin() 和 end() 这两个 iterator 方法。两者的原型为：

```cpp
const_iterator begin() const;
iterator begin();
const_iterator end() const;
iterator end();
```

这样一来问题就转变为如何实现自己的 iterable object 了。

有的时候，你可能还需要实现 cbegin() 和 cend()

对此我的旧文章 ？ 或许有所帮助。

简而言之，

 [c++ - How to make my custom type to work with "range-based for loops"? - Stack Overflow](https://stackoverflow.com/questions/8164567/how-to-make-my-custom-type-to-work-with-range-based-for-loops) 





## 🔚



