---
layout: single
title: "实作中的 std::is_detected 和 Detection Idioms (C++17)"
date: 2021-10-23 05:10:00 +0800
last_modified_at: 2021-10-23 07:43:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,is_detected,detection idioms]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20211023074113412.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  介绍 Detect Idioms 相关知识在实作中的一些应用...
---



## std::is_detected 和 Detection Idoms

本文锁定于 C++17 范围内谈实作。

### 关于 std::is_detected

确切地说，是指 `std::experimental::is_detected`, `std::experimental::detected_t`, `std::experimental::detected_or`。因为尚未被纳入正式库，所以在现行的编译器中，它们通常至少需要 C++17 规范指定，并包含专门的头文件 `<experimental/type_traits>`。参考这里：[cppref](https://en.cppreference.com/w/cpp/experimental/is_detected)。



但是编译器的支持也是参差不齐。所以我们一般都采用自定义的版本，同样需要 C++17 规范（如果需要更低规范适配版本，请自行搜索），但表现能力更可靠、更可预测：

```cpp
#if !defined(__TRAITS_VOIT_T_DEFINED)
#define __TRAITS_VOIT_T_DEFINED
// ------------------------- void_t
namespace cmdr::traits {
#if (__cplusplus > 201402L)
    using std::void_t; // C++17 or later
#else
    // template<class...>
    // using void_t = void;

    template<typename... T>
    struct make_void { using type = void; };
    template<typename... T>
    using void_t = typename make_void<T...>::type;
#endif
} // namespace cmdr::traits
#endif // __TRAITS_VOIT_T_DEFINED


#if !defined(__TRAITS_IS_DETECTED_DEFINED)
#define __TRAITS_IS_DETECTED_DEFINED
// ------------------------- is_detected
namespace cmdr::traits {
    template<class, template<class> class, class = void_t<>>
    struct detect : std::false_type {};

    template<class T, template<class> class Op>
    struct detect<T, Op, void_t<Op<T>>> : std::true_type {};

    template<class T, class Void, template<class...> class Op, class... Args>
    struct detector {
        using value_t = std::false_type;
        using type = T;
    };

    template<class T, template<class...> class Op, class... Args>
    struct detector<T, void_t<Op<Args...>>, Op, Args...> {
        using value_t = std::true_type;
        using type = Op<Args...>;
    };

    struct nonesuch final {
        nonesuch() = delete;
        ~nonesuch() = delete;
        nonesuch(const nonesuch &) = delete;
        void operator=(const nonesuch &) = delete;
    };

    template<class T, template<class...> class Op, class... Args>
    using detected_or = detector<T, void, Op, Args...>;

    template<class T, template<class...> class Op, class... Args>
    using detected_or_t = typename detected_or<T, Op, Args...>::type;

    template<template<class...> class Op, class... Args>
    using detected = detected_or<nonesuch, Op, Args...>;

    template<template<class...> class Op, class... Args>
    using detected_t = typename detected<Op, Args...>::type;

    /**
     * @brief another std::is_detected
     * @details For example:
     * @code{c++}
     * template&lt;typename T>
     * using copy_assign_op = decltype(std::declval&lt;T &>() = std::declval&lt;const T &>());
     * 
     * template&lt;typename T>
     * using is_copy_assignable = is_detected&lt;copy_assign_op, T>;
     * 
     * template&lt;typename T>
     * constexpr bool is_copy_assignable_v = is_copy_assignable&lt;T>::value;
     * @endcode
     */
    template<template<class...> class Op, class... Args>
    using is_detected = typename detected<Op, Args...>::value_t;

    template<template<class...> class Op, class... Args>
    constexpr bool is_detected_v = is_detected<Op, Args...>::value;

    template<class T, template<class...> class Op, class... Args>
    using is_detected_exact = std::is_same<T, detected_t<Op, Args...>>;

    template<class To, template<class...> class Op, class... Args>
    using is_detected_convertible = std::is_convertible<detected_t<Op, Args...>, To>;

} // namespace cmdr::traits
#endif // __TRAITS_IS_DETECTED_DEFINED
```

当然，也涉及到 std::void_t，也是 C++17 才进入标准库的。但你可以自己声明，如同上面的 VOID_T 部分一样。

但 is_detected 的低版本兼容部分我们就放弃了，太长了，我也不想加多单元测试负担。

它的使用方式是这样的：

```cpp
#include <type_traits>
#include <string>

template<typename T>
using copy_assign_op = decltype(std::declval<T &>() = std::declval<const T &>());

template<typename T>
using is_copy_assignable = is_detected<copy_assign_op, T>;

template<typename T>
constexpr bool is_copy_assignable_v = is_copy_assignable<T>::value;

struct foo {};
struct bar {
  bar &operator=(const bar &) = delete;
};

int main() {
  static_assert(is_copy_assignable_v<foo>, "foo is copy assignable");
  static_assert(!is_copy_assignable_v<bar>, "bar is not copy assignable");
  return 0;
}
```

可以看到这是一种典型的 detection idioms 惯用法，能够在编译期测试出一个类型具有什么特性。例如 is_chrono_duration, is_iterator, is_integer 等等，在标准库中有大量预定义的检测专用的 traits。

但在实际生活中我们通常还需要定义自己的。例如在我们的 [undo-cxx](https://github.com/hedzr/undo-cxx) 中就有一组：

```cpp
namespace undo_cxx {

  template<typename State,
  typename Context,
  typename BaseCmdT,
  template<class S, class B> typename RefCmdT,
  typename Cmd>
    class undoable_cmd_system_t {
      public:
      ~undoable_cmd_system_t() = default;

      using StateT = State;
      using ContextT = Context;
      using CmdT = Cmd;
      using CmdSP = std::shared_ptr<CmdT>;
      using Memento = typename CmdT::Memento;
      using MementoPtr = typename std::unique_ptr<Memento>;
      using Container = std::list<MementoPtr>;
      using Iterator = typename Container::iterator;

      using size_type = typename Container::size_type;

      template<typename T, typename = void>
      struct has_save_state : std::false_type {};
      template<typename T>
      struct has_save_state<T, decltype(void(std::declval<T &>().save_state()))> : std::true_type {};

      template<typename T, typename = void>
      struct has_undo : std::false_type {};
      template<typename T>
      struct has_undo<T, decltype(void(std::declval<T &>().undo()))> : std::true_type {};

      template<typename T, typename = void>
      struct has_redo : std::false_type {};
      template<typename T>
      struct has_redo<T, decltype(void(std::declval<T &>().redo()))> : std::true_type {};

      template<typename T, typename = void>
      struct has_can_be_memento : std::false_type {};
      template<typename T>
      struct has_can_be_memento<T, decltype(void(std::declval<T &>().can_be_memento()))> : std::true_type {};

      public:
      
      // ...
      
      void undo(CmdSP &undo_cmd) {
        if constexpr (has_undo<CmdT>::value) {
          // needs void undo_cmd::undo(sender, ctx, delta)
          undo_cmd->undo(undo_cmd, _ctx, 1);
          return;
        }

        if (undo_one()) {
          // undo ok
        }
      }
      
      // ...
    };
}
```

你可能注意到这个例子中压根没有用到 is_detected。

确实如此，Detection Idioms 包含一系列手法，并不是一定要用到哪一个工具模板，重点还是在于目标，它们都是为了在编译期测试出某个类型的特性，以便针对性地进行特化、偏特化，或者用于完成其他任务。

所以这是个巨大无比的话题。



### Detection Idioms

在提案 [WG21 N4436 - Proposing Standard Library Support for the C++ Detection Idiom [pdf]](http://open-std.org/JTC1/SC22/WG21/docs/papers/2015/n4436.pdf) 中，检测惯用法被称作 Detection Idiom。这个提案是在 C++20 中被加入，一部分原因在于它可以成为一个补全性的方案，另一方面则是因为 Concepts 一直提了十几年却都没有定论。当然最后我们知道了，去年 C++20 定案之后 concepts 终于被加入了。

但是可以预见的是，未来直到 2023 年，工程当中使用 concepts 的可能性还是基本上为零。事实上 2023 年 C++17 如能成为工程应用主流的话就阿弥陀佛了，多数工程还是 C++11 的，而且那些遗留项目连 C++11 都不用呢。

作为一个提案的代表，Detection Idiom 是一个专有名词。但检测惯用法，却是早已有之。或者说，traits 本来就是干这个的。在本文中的检测惯用法，会包含类型测试与约束，以及函数签名检测等等检测方法。

在 C++11 之后，借助于 SFINAE 我们有几种选择来完成类型约束与选择：特化方式，添加 enable_if 测试的特化方式，借助于 is_detected 的约束力。



#### 普通的特化方式

模板参数的特化能力，对于一般情况的约束就是足够的：

```cpp
template<typename T>
bool max(T l, T r) { return l > r ? l : r; }

bool max(bool l, bool r) { return false; }

bool max(float l, float r) {
  return (l+0.000005f > r) ? l : (r+0.000005f>l) ? r : IS_NAN;
}
```

上面的例子没有实际用处，只是用来展示特化的直接使用效果。

对于简单的类型来说，这种特化能力就已经足够了。不过遇到复杂的类型，特别是复合类型它的能力就比较短板了。

所以这种情况下我们需要借助于 enable_if 来进行约束。



#### std::enable_if 方式



##### std::enable_if 可能的实现方法

std::enable_if 的实现方法可以比较简单：

```cpp
template <bool, typename T=void>
struct enable_if {};

template <typename T>
struct enable_if<true, T> {
  using type = T;
};
```



##### 约束返回类型

对于函数返回类型来说，用法略有不同：

```cpp
#include <iostream>
#include <type_traits>

class foo;
class bar;

template<class T>
struct is_bar {
    template<class Q = T>
    typename std::enable_if<std::is_same<Q, bar>::value, bool>::type check() { return true; }

    template<class Q = T>
    typename std::enable_if<!std::is_same<Q, bar>::value, bool>::type check() { return false; }
};

int main() {
    is_bar<foo> foo_is_bar;
    is_bar<bar> bar_is_bar;
    if (!foo_is_bar.check() && bar_is_bar.check())
        std::cout << "It works!" << std::endl;

    return 0;
}
```

这是测试类型并返回 bool 的用例，也是较为典型的如何编写 traits 的用例。

不过为了真正说明函数返回类型模板化，还是要下面这个例子：

```cpp
#include <iostream>
#include <type_traits>

namespace AAA {
    template<class T>
    class Y {
    public:
        template<typename Q = T>
        typename std::enable_if<std::is_same<Q, double>::value || std::is_same<Q, float>::value, Q>::type foo() {
            return 11;
        }
        template<typename Q = T>
        typename std::enable_if<!std::is_same<Q, double>::value && !std::is_same<Q, float>::value, Q>::type foo() {
            return 7;
        }
    };
} // namespace

int main(){
#define TestQ(typ)  std::cout << "T foo() : " << (AAA::Y<typ>{}).foo() << '\n'

    TestQ(short);
    TestQ(int);
    TestQ(long);
    TestQ(bool);
    TestQ(float);
    TestQ(double);  
}
```

输出为：

```bash
T foo() : 7
T foo() : 7
T foo() : 7
T foo() : 1
T foo() : 11
T foo() : 11
```

这是一个实用化的用例，可以直接检测 double 或者 float 类型。



##### 在 traits 中使用

测试一个模板中是否有名为 value 的类型定义：

```cpp
template <typename T, typename=void>
struct has_typed_value;

template <typename T>
struct has_typed_value<T, typename std::enable_if<T::value>::type> {
    static constexpr bool value = T::value;
};

template<class T>
inline constexpr bool has_typed_value_v = has_typed_value<T>::value;

static_assert(has_typed_value<std::is_same<bool, bool>>::value, "std::is_same<bool, bool>::value is valid");
static_assert(has_typed_value_v<std::is_same<bool, bool>>, "std::is_same<bool, bool>::value is valid");
```

类似地：

```cpp
template <typename T> struct has_typed_type;
template <typename T>
struct has_typed_type<T, typename std::enable_if<T::value>::type> {
    static constexpr bool value = T::type;
};

template<class T>
inline constexpr bool has_typed_type_v = has_typed_type<T>::value;
```



#### 使用 conjuction

C++17 之后就可以直接使用[ `std::conjuction`](https://en.cppreference.com/w/cpp/types/conjunction)，它可以用于组合一组 detectors。

这里只给出一个 sample 片段：

```cpp
template <class T>
  using is_regular = std::conjunction<std::is_default_constructible<T>,
    std::is_copy_constructible<T>,
    supports_equality<T,T>,
    supports_inequality<T,T>, //assume impl
    supports_less_than<T,T>>; //ditto
```



## 更多的



### 检测成员函数存在性

#### declval 方式

这个用例比较独立自主，什么都自己来，自己定义了 void_t，自己定义了名为 supports_foo 的 traits，目的是为了检测类型 T 是不是有 T::get_foo() 函数签名的存在。最后，calculate_foo_factor() 的特化目的就显而易见，无需解释了。

```cpp
template <class... Ts>
using void_t = void;

template <class T, class=void>
struct supports_foo : std::false_type{};

template <class T>
struct supports_foo<T, void_t<decltype(std::declval<T>().get_foo())>>
: std::true_type{};

template <class T, 
          std::enable_if_t<supports_foo<T>::value>* = nullptr>
auto calculate_foo_factor (const T& t) {
  return t.get_foo();
}

template <class T, 
          std::enable_if_t<!supports_foo<T>::value>* = nullptr>
int calculate_foo_factor (const T& t) {
  // insert generic calculation here
  return 42;
}
```

它采用了 declval 的*伪造实例*的技术，对此可以参考我们的 [std::declval 和 decltype](https://hedzr.com/c++/algorithm/cxx-std-declval-and-decltype) 一文。



#### Is_detected 方式

改用 is_detected 方式：

```cpp
template<typename T>
using to_string_t = decltype(std::declval<T &>().to_string());

template<typename T>
constexpr bool has_to_string = is_detected_v<to_string_t, T>;

struct AA {
  std::string to_string() const { return ""; }
};

struct BB{};

static_assert(has_to_string<AA>, "");
static_assert(!has_to_string<BB>, "");
```

这个没什么好说的，你可以用 std::experimental::is_detected，也可以使用我们前文中定义的 is_detected 工具。



##### 作为一个补充

在没有 std::enable_if 的时候，需要借助于 struct char[] 方式，这种技巧被称作 [Member Detector](https://en.wikibooks.org/wiki/More_C%2B%2B_Idioms/Member_Detector)，是 C++11 之前的经典惯用法：

```cpp
template<typename T>
class DetectX
{
    struct Fallback { int X; }; // add member name "X"
    struct Derived : T, Fallback { };

    template<typename U, U> struct Check;

    typedef char ArrayOfOne[1];  // typedef for an array of size one.
    typedef char ArrayOfTwo[2];  // typedef for an array of size two.

    template<typename U> 
    static ArrayOfOne & func(Check<int Fallback::*, &U::X> *);
    
    template<typename U> 
    static ArrayOfTwo & func(...);

  public:
    typedef DetectX type;
    enum { value = sizeof(func<Derived>(0)) == 2 };
};
```

而且还有配套的宏定义 `GENERATE_HAS_MEMBER(member)` ，所以在应用代码中只需要：

```cpp
GENERATE_HAS_MEMBER(att)  // Creates 'has_member_att'.
GENERATE_HAS_MEMBER(func) // Creates 'has_member_func'.

std::cout << std::boolalpha
  << "\n" "'att' in 'C' : "
  << has_member_att<C>::value // <type_traits>-like interface.
    << "\n" "'func' in 'C' : "
    << has_member_func<C>() // Implicitly convertible to 'bool'.
    << "\n";
```

也是很疯狂。



### 进一步延伸

上一节提供的技术，仅仅对函数签名中的函数名本身进行检测。有时候，可能我们会在想对形参表或者返回类型做检测并约束。有可能吗？

确实是有的。

#### 抽出函数返回类型

`return_type_of_t<Callable>` 可以抽出函数的返回类型：

```cpp
namespace AA1 {
  template<typename Callable>
  using return_type_of_t =
  typename decltype(std::function{std::declval<Callable>()})::result_type;

  int foo(int a, int b, int c, int d) {
    return 1;
  }
  auto bar = [](){ return 1; };
  struct baz_ { 
    double operator()(){ return 0; } 
  } baz;

  void test_aa1() {
    using ReturnTypeOfFoo = return_type_of_t<decltype(foo)>;
    using ReturnTypeOfBar = return_type_of_t<decltype(bar)>;
    using ReturnTypeOfBaz = return_type_of_t<decltype(baz)>;

    // ...
  }
}
```

在这个基础上你就可以运用 enable_if 或者 is_detected 了。具体检测略略略……



#### 检测函数形参表

至于形参表的检测问题，有点而麻烦，而且这一话题也很大，方向较多，所以我暂且给出一个方向供你参考，其他方向也就是万变不离其宗了。

bar_t 可以以 variadic 参数的方式罗列出类型表，并用来检测类型 T 是不是有一个函数 bar() 而且还有相应的形参表：

```cpp
template<class T, typename... Arguments>
using bar_t = std::conditional_t<
        true,
        decltype(std::declval<T>().bar(std::declval<Arguments>()...)),
        std::integral_constant<
                decltype(std::declval<T>().bar(std::declval<Arguments>()...)) (T::*)(Arguments...),
                &T::bar>>;

struct foo1 {
    int const &bar(int &&) {
        static int vv_{0};
        return vv_;
    }
};

static_assert(dp::traits::is_detected_v<bar_t, foo1, int &&>, "not detected");
```

暂时我没有想法将它通用化，所以你需要具体情况具体拷贝和修改。

谁要是有改进版，不妨通知我。



#### 检测 begin() 存在性并调用它

前文对成员函数存在性已经介绍过了，这里是一个实用的片段：检测成员函数存在与否，存在的话就调用它，否则的话调用我们的备用实现方案：

```cpp
// test for `any begin() const`
template <typename T>
using begin_op = decltype(std::declval<T const&>().begin());

struct A_Container {
  template <typename T>
  void invoke_begin(T const& t){
    if constexpr(std::experimental::is_detected_v<begin_op, T>){
      t.begin();
    }else{
      my_begin(); // begin() not exists!!
    }
  }
  iterator my_begin() { ... }
};
```

为什么不直接使用 SFINAE 技术呢？

因为 SFINAE 技术能够让我们做出 invoke_begin 的特化版本，但这有可能阻碍了我们的进一步拓展性。SFINAE 仅能在类型不匹配时起作用，但采用 begin_op 的方式我们可以：针对返回类型，针对形参表，针对 const or not，等等。



#### 检测 emplace(Args &&...)

这要用到我们前面的 bar_t 技法：

```cpp
template<class T, typename... Arguments>
  using emplace_variadic_t = std::conditional_t<
  true,
decltype(std::declval<T>().emplace(std::declval<Arguments>()...)),
std::integral_constant<
  decltype(std::declval<T>().emplace(std::declval<Arguments>()...)) (T::*)(Arguments...),
&T::emplace>>;

/**
 * @brief test member function `emplace()` with variadic params
 * @tparam T 
 * @tparam Arguments 
 * @details For example:
 * @code{c++}
 * using C = std::list&lt;int>;
 * static_assert(has_emplace_variadic_v&lt;C, C::const_iterator, int &&>);
 * @endcode
 */
template<class T, typename... Arguments>
  constexpr bool has_emplace_variadic_v = is_detected_v<emplace_variadic_t, T, Arguments...>;

namespace detail {
  using C = std::list<int>;
  static_assert(has_emplace_variadic_v<C, C::const_iterator, int &&>);
} // namespace detail
```



#### More...

在 [cmdr-cxx](https://github.com/hedzr/cmdr-cxx) 中有一组 detection traits，是用于检测标准库容器函数签名的。在 [undo-cxx](https://github.com/hedzr/undo-cxx) 中的 `undoable_cmd_system_t<State>` 中我们运用了检测函数名存在性并调用它的技法。



##### 关于 `_t` 和 `_v`

在标准库和标准化推行中，`_t` 和 `_v` 后缀隐含着直接提供 `::type` 或者 `::value` 成员的意思。

但这并不影响我（们）惯于使用 `_t` 表示一个模板类。

在一个模板类被用做基础类、被当成工具类使用时，我（们）喜欢为其增加 `_t` 后缀。



### Refs

- [WG21 N4436 - Proposing Standard Library Support for the C++ Detection Idiom [pdf]](http://open-std.org/JTC1/SC22/WG21/docs/papers/2015/n4436.pdf) - Walter E. Brown 計劃在C++標準庫中加入 Detection 慣用法
- WG21 N4502: [PDF](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2015/n4502.pdf) - Proposing Standard Library Support for the C++ Detection Idiom, v2
- [std::experimental::is_detected, std::experimental::detected_t, std::experimental::detected_or - cppreference.com](https://zh.cppreference.com/w/cpp/experimental/is_detected) 
- [std::void_t - cppreference.com](https://en.cppreference.com/w/cpp/types/void_t) 
- [std::enable_if - cppreference.com](https://en.cppreference.com/w/cpp/types/enable_if) 
- [Detection Idiom - A Stopgap for Concepts](https://blog.tartanllama.xyz/detection-idiom/) 



## 后记

检测惯用法实在是太大了，本文只是导引，将基本工具提供出来。后续未来应该会继续就此问题介绍我的经验。



:end:

