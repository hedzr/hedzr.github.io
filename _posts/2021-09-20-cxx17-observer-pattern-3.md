---
layout: single
title: "谈 C++17 里的 Observer 模式 - 再补"
date: 2021-09-18 05:00:00 +0800
last_modified_at: 2021-09-18 04:33:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,observer pattern,pub-sub,publish,subcription,design patterns,观察者模式,设计模式]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210916080003947.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  关于观察者模式之三，直接绑定函数对象，...
---



> 上上回的  [谈 C++17 里的 Observer 模式](https://hedzr.com/c++/algorithm/cxx17-observer-pattern/) 介绍了该模式的基本构造。后来在 [谈 C++17 里的 Observer 模式 - 补](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-2/) 里面提供了改进版本，主要聚焦于针对多线程环境的暴力使用的场景。

## Observer Pattern - Part III

然后我们提到了，对于观察者模式来说，GoF 的原生定义当然是采用一个 observer class 的方式，但对于差不多 15 年后的 C++11 来说，观察者使用一个 class 定义的方式有点落伍了。特别是到了几乎 23 年后的 C++14/17 之后，lambda 以及 std::function 的支持力度变得较为稳定，无需太多“高级”手法也能轻松地包装闭包或者函数对象，在加上折叠表达式对变参模板的加成能力。所以现在是有一种呼声认为，直接在被观察者上绑定匿名函数对象、或者函数对象，才是观察者模式的正确打开方式。

那么是不是如此呢？

我们首先要做的是实现这样的想法，然后用一段测试用例来展示这种模态下编码的可能性。再然后才来看看它的优缺点。

### 基本实现

这一次的核心类模板我们将其命名为 `observable_bindable`，因为这在你修改自己的实现代码时有利——只需要添加后缀就可以。这个模板类仍然使用一个单一的结构 `S` 作为事件/信号实体：

```cpp
namespace hicc::util {

  /**
   * @brief an observable object, which allows a lambda or a function to be bound as the observer.
   * @tparam S subject or event will be emitted to all bound observers.
   * 
   */
  template<typename S>
  class observable_bindable {
    public:
    virtual ~observable_bindable() { clear(); }
    using subject_t = S;
    using FN = std::function<void(subject_t const &)>;

    template<typename _Callable, typename... _Args>
    observable_bindable &add_callback(_Callable &&f, _Args &&...args) {
      FN fn = std::bind(std::forward<_Callable>(f), std::forward<_Args>(args)...);
      _callbacks.push_back(fn);
      return (*this);
    }
    template<typename _Callable, typename... _Args>
    observable_bindable &on(_Callable &&f, _Args &&...args) {
      return add_callback(f, args...);
    }

    /**
     * @brief fire an event along the observers chain.
     * @param event_or_subject 
     */
    void emit(subject_t const &event_or_subject) {
      for (auto &fn : _callbacks)
        fn(event_or_subject);
    }

    private:
    void clear() {}

    private:
    std::vector<FN> _callbacks{};
  };

}
```

首先，我们不提供解除 observer 绑定的成员函数。我们觉得这是不必要的，因为这一设计的目标本来就是冲着 lambda 函数去的，解除 lambda 函数的绑定，没有多大意义。当然你可以实现一份 remove_observer，这并没有什么技术性难度，甚至你都不必多么懂 c++，照猫画虎也能弄一份。

然后借助于 std::bind 函数（整个绑定乃至于类型推导等等至少 c++14，建议 c++17）的推导能力，我们提供了一个强力有效的 add_callback 实现，另外，on() 是它的同义词。

所谓强力有效，是指，我们在这个单一的函数签名上实现了各种各样的函数对象的通用绑定，匿名函数也好、成员函数也好、或者普通函数等，都可以借助于 add_callback() 被绑定到 observable_bindable 对象中去。



#### 新的测试代码

到底有多么有力，还是要看测试代码：

```cpp
namespace hicc::dp::observer::cb {

  struct event {
    std::string to_string() const { return "event"; }
  };

  struct mouse_move_event : public event {};

  class Store : public hicc::util::observable_bindable<event> {};

} // namespace hicc::dp::observer::cb

void fntest(hicc::dp::observer::cb::event const &e) {
  hicc_print("event CB regular function: %s", e.to_string().c_str());
}

void test_observer_cb() {
  using namespace hicc::dp::observer::cb;
  using namespace std::placeholders;

  Store store;

  store.add_callback([](event const &e) {
    hicc_print("event CB lamdba: %s", e.to_string().c_str());
  }, _1);
  
  struct eh1 {
    void cb(event const &e) {
      hicc_print("event CB member fn: %s", e.to_string().c_str());
    }
    void operator()(event const &e) {
      hicc_print("event CB member operator() fn: %s", e.to_string().c_str());
    }
  };
  
  store.on(&eh1::cb, eh1{}, _1);
  store.on(&eh1::operator(), eh1{}, _1);

  store.on(fntest, _1);

  store.emit(mouse_move_event{});
}
```

注意，这个 on()/add_callback() 的绑定语法类似于 `std::bind`，你可能需要 `std::placeholder::_1, _2, ..` 等等占位符。你还需要注意到这个绑定语法完全沿袭了 std::bind 的各种特殊能力，例如提前绑定技术。不过这些能力有的在 on() 中无法直接体现，有的虽然有用但是却又用不到，此外这里毕竟还在谈论 observer pattern，现有的展示已经足够了。

输出结果类似于如此：

```bash
--- BEGIN OF test_observer_cb                         ----------------------
09/19/21 08:38:02 [debug]: event CB lamdba: event ...
09/19/21 08:38:02 [debug]: event CB member fn: event ...
09/19/21 08:38:02 [debug]: event CB member operator() fn: event 
09/19/21 08:38:02 [debug]: event CB regular function: event 
--- END OF test_observer_cb                           ----------------------

It took 465.238us
```

所以没有什么意外，甚至于无论是 observable_bindable 还是用例代码都是出乎意料的简洁明快，符合直觉。

这个例子能够提醒我们，GoF 当然是经典里的经典（没办法，它出的早，它出的时候我们的脑子根本没往这种总结方向上去转，只好是它经典了，我那时候在干啥哩，哦，我在贵州一个鸟不生蛋的深山里的变电所搞什么 scada 调试吧，陷入细节之中），但也**未必就要祖宗之法不可易**。



### 改进

上面显得颇为完美了，然而还有一个小小的问题。康康测试代码的绑定语法，例如：

```cpp
store.on(fntest, _1);
```

那个丑陋的 `_1` 很是刺眼。能不能消灭它呢？

由于我们约定的回调函数的接口为：

```cpp
using FN = std::function<void(subject_t const &)>;
```

所以这个 `_1` 是对应于 `subject_t const &`，这是 std::bind 的调用约定。注意到回调函数的签名是固定的，所以我们确实有一个方法能够消除 `_1`，即修改 `add_callback()` 的代码：

```cpp
template<typename _Callable, typename... _Args>
observable_bindable &add_callback(_Callable &&f, _Args &&...args) {
  FN fn = std::bind(std::forward<_Callable>(f), std::forward<_Args>(args)..., std::placeholders::_1);
  _callbacks.push_back(fn);
  return (*this);
}
```

我们加上它，用户代码中就不必写它了对吗。

这法子有点点无赖，但它管用。然后测试代码中是这样：

```cpp
    store.add_callback([](event const &e) {
        hicc_print("event CB lamdba: %s", e.to_string().c_str());
    });

    store.on(&eh1::cb, eh1{});
    store.on(&eh1::operator(), eh1{});

    store.on(fntest);
```

是不是好看多了？

这个例子告诉我们，写 C++ 有时候根本不需要那些所谓的精巧的、精致的、绝妙的、奇思妙想的奇技淫巧。

善战者赫赫无功，说的是就是平平无奇。



### 优缺点

总之，我们已经实现了这个主打函数式风格的观察者模式。你仍然需要从 `observable_bindable` 派生出来你的被观察者，但你可以随时随地就地建立对其的观察，你可以使用匿名的 lambda，也可以使用各种风格的具名的函数对象。

至于缺点，不算太多，或许，采用 lambda 的时候就不那么容易 remove_callback 了，这对于有的需要重入的场景可能有点不妥，但这可以用显式具名的方式轻松解决。

有两种显式具名的方法，一是将 lambda 付给一个变量：

```cpp
auto my_observer = [](event const &e) {
  hicc_print("event CB lamdba: %s", e.to_string().c_str());
};
store.on(my_observer);
store.emit(event{});
store.remove(my_observer);
```

> remove() 需要你自行实现

另一种方法是普通函数对象、或者类成员函数对象、或者类静态成员函数对象，这些都是天然具名的。例子略过。

## 后记

整个过程很简单，甚至比我料想的还简单，当然我还是遇到了点麻烦的。

主要的麻烦在于函数签名中的形参列表需要被正确地传导到 emit 中的调用部分去。但是你也看到了，最终的代码其实完全借助了自动推导的能力，出人意料地直接解决了该问题。我当然遇到了麻烦，走了些弯路，设法想要求助于变参模板能力以及 traits 的力量，事实证明不必那么累，也没有那么复杂的形参表的必要。而且 auto 常常可以打天下。

Callable 技术，我在 pool，ticker 等之中也有同样的应用，但是那些时候有一点点不同，那时候待绑定的函数对象是没有参数表的。而在 cmdr-cxx 中做函数绑定时，我面临的是确定格式的参数表。

不过这些也都无所谓。



:end:

