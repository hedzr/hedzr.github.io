---
layout: single
title: "谈 C++17 里的 Observer 模式 - 4 - 信号槽模式"
date: 2021-09-22 05:00:00 +0800
last_modified_at: 2021-09-22 19:33:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,observer pattern,pub-sub,publish,subcription,signal-slot,qt,design patterns,观察者模式,设计模式]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210916080003947.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  关于观察者模式之四，Qt 的 Slot-Signal 模式的单独实现，...
---



> 上上上回的  [谈 C++17 里的 Observer 模式](https://hedzr.com/c++/algorithm/cxx17-observer-pattern/) 介绍了该模式的基本构造。后来在 [谈 C++17 里的 Observer 模式 - 补/2](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-2/) 里面提供了改进版本，主要聚焦于针对多线程环境的暴力使用的场景。再后来又有一篇 [谈 C++17 里的 Observer 模式 - 再补/3](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-3/)，谈的是直接绑定 lambda 作为观察者的方案。
>
> **C++17 系列的 Design Patterns 文章也被同步发表在 InfoQ，掘金，Segmentfault 平台。**

## Observer Pattern - Part IV

所以嘛，我觉得这个第四篇，无论如何也要复刻一份 Qt 的 Slot 信号槽模型的独立实现了吧。而且这次复刻做完之后，观察者模式必须告一段落了，毕竟我在这个 Pattern 上真还是费了老大的神了，该结束了。

> 要不要做 Rx 轻量版呢？这是个问题。



### 原始参考

说起 Qt 的信号槽模式，可以算是鼎鼎大名了。它强就强在能够无视函数签名，想怎么绑定就怎么绑定（也不是全然随意，但也很可以了），从 sender 到 receiver 的 UI 事件推送和触发显得比较清晰干净，而且不必受制于确定性的函数签名。

确定性的函数签名嘛，Microsoft 的 MFC 乃至于 ATL、WTL 都爱在 UI 消息泵部分采用，它们还使用宏来解决绑定问题，着实是充满了落后的气息。

要说在当年，MFC 也要是当红炸子鸡了，Qt 只能悄悄地龟缩于一隅，哪怕 Qt 有很多好设计。那又怎么样呢？我们家 MFC 的优秀设计，尤其是 ATL/WTL 的优秀设计也多的是。所以这又是一个技术、市场认可的古老历史。

好的，随便吐槽一下而已。

> Qt 的问题，在于两点：一是模凌两可一直暧昧的许可制度，再一是令人无法去爱的私有扩展，从 qmake 到 qml 到各种 c++ 上的 MOC 扩展，实在是令 Pure C++ 派很不爽。
>
> 当然，Qt 也并不像我们本以为的那么小众，实际上它的受众群体还是很不小的，它至少占据了跨平台 UI 的很强的一部分，以及嵌入式设备的 UI 开发的主要部分。

首先一点，信号槽是 Qt 独特的核心机制，从根本类 QObject 开始就受到基础支持的，它实际上是为了完成对象之间的通信，也不仅仅是 UI 事件的分发。然而，考虑到这个通信机制的核心机理和逻辑呢，我们认为它仍然是一种观察者模式的表现，或者说是一种订阅者阅读发布者的特定信号的机制。

信号槽算法的关键在于，它认为一个函数不论被怎么转换，总是可以变成一个函数指针并放在某个槽中，每个 QObject（Qt 的基础类）都可以根据需要管理这么一个槽位表。

```cpp
bool QObject::connect ( const QObject * sender, const char * signal, const QObject * receiver, const char * member ) [static]
```

而在发射一个信号时，这个对象就扫描每个 slot，然后根据需要对信号变形（匹配为被绑定函数的实参表）并回调那个被绑定函数，尤其是，如果被绑定函数是某个类实例的成员函数呢，正确的 this 指针也会被引用以确保回调完成。

Qt 使用一个关键字 signals 来指定信号：

```cpp
signals: 
		void mySignal(); 
		void mySignal(int x); 
		void mySignalParam(int x,int y);
```

这显然很怪异（习惯了就好了）。而 Qt 的怪异之处还很多，所以这也是它无法大红的根本原因，太封闭自嗨了大家就不愿意陪你玩噻。

那么槽呢，槽函数就是一普通的 C++ 函数，它的不普通之处在于将会有一些信号和它相关联。关联的方法是 QObject::connect 与 disconnect，上面已经给出了原型。

一个例子片段来展现信号槽的使用方式：

```cpp
QLabel     *label  = new QLabel; 
QScrollBar *scroll = new QScrollBar; 
QObject::connect( scroll, SIGNAL(valueChanged(int)), 
                  label,  SLOT(setNum(int)) );
```

SIGNAL 与 SLOT 是宏，它们将会借助 Qt 内部实现来完成转换工作。



#### 小小结

我们不打算教授 Qt 开发知识，更不关心 Qt 的内部实现机制，所以例子摘取这么一个也就够了。

如果你正在学习或想了解 Qt 开发知识，请查阅它们的官网，并可以着重了解 元对象编译器  MOC（meta object compiler），Qt 依赖这个东西来解决它的专有的非 c++ 的 扩展，例如 signals 等等。





### 基本实现

现在我们来复刻一套信号槽的 C++17 实现，当然就不考虑 Qt 的任何其它关联概念，而是仅就订阅、发射信号、接受信号这一套观察者模式相关的内容进行实现。

复刻版本并不会原样照搬 Qt 的 connect 接口样式。

我们需要重新思考应该以何为主，采用什么样的语法。

可以首先肯定的是，一个 observable 对象也就是一个 slot 管理器、同时也是一个信号发射器。作为一个 slot 管理器，每一个 slot 中可以包含 M 个被连接的 slot entries，也就是观察者。由于一个 observable 对象管理一个单个到 slot，所以若是你想要很多槽（slots），你就需要派生出多个 observable 对象。

无论如何，找回信号槽的本质之后，我们的 signal-slot 实现其实和上一篇的  [谈 C++17 里的 Observer 模式 - 再补](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-3/) 几乎完全相同——除了 signal-slot 需要支持可变的函数参数表之外。

#### `signal<SignalSubject...>`

既然是一个信号发射器，所以我们的 observable 对象就叫做 signal，并且带有可变的 SignalSubject... 模板参数。一个 `signal<int, float>` 的模板实例允许在发射信号时带上 int 和 float 两个参数：`sig.emit(1, 3.14f)`。当然可以将 int 换为某个复合对象，由于是变参，所以甚至你也可以不带具体参数，此时发射信号就如同仅仅是触发功能一般。

这就是我们的实现：

```cpp
namespace hicc::util {

  /**
   * @brief A covered pure C++ implementation for QT signal-slot mechanism
   * @tparam SignalSubjects 
   */
  template<typename... SignalSubjects>
  class signal {
    public:
    virtual ~signal() { clear(); }
    using FN = std::function<void(SignalSubjects &&...)>;
    
    template<typename _Callable, typename... _Args>
    signal &connect(_Callable &&f, _Args &&...args) {
      FN fn = std::bind(std::forward<_Callable>(f), std::forward<_Args>(args)...);
      _callbacks.push_back(fn);
      return (*this);
    }
    template<typename _Callable, typename... _Args>
    signal &on(_Callable &&f, _Args &&...args) {
      FN fn = std::bind(std::forward<_Callable>(f), std::forward<_Args>(args)...);
      _callbacks.push_back(fn);
      return (*this);
    }

    /**
     * @brief fire an event along the observers chain.
     * @param event_or_subject 
     */
    signal &emit(SignalSubjects &&...event_or_subjects) {
      for (auto &fn : _callbacks)
        fn(std::move(event_or_subjects)...);
      return (*this);
    }
    signal &operator()(SignalSubjects &&...event_or_subjects) { return emit(event_or_subjects...); }

    private:
    void clear() {}

    private:
    std::vector<FN> _callbacks{};
  };

} // namespace hicc::util
```

connect() 模仿 Qt 的接口名，但我们更建议其同义词 on() 来做函数实体的绑定。

上面的实现不像已知的开源实现那样复杂。其实现在的很多精妙的 C++ 开源元编程代码有点走火入魔，traits 什么的用的太多，拆分的过于厉害，我脑力内存小，有点跑不过来。

还是说回我们的实现，基本没什么好说的，秉承上一回的实现思路，抛弃显式的 slot 实体的设计方案，简单地将用户函数包装为 `FN` 就当作是槽函数了。这样做没有了 Qt 的某些全面性，但实际上现代社会里并不需要哪些为了满足 Qt 类体系而制造的精巧之处。纯粹是过度设计。



#### Tests

然后再来看测试程序：

```cpp
namespace hicc::dp::observer::slots::tests {

  void f() { std::cout << "free function\n"; }

  struct s {
    void m(char *, int &) { std::cout << "member function\n"; }
    static void sm(char *, int &) { std::cout << "static member function\n"; }
    void ma() { std::cout << "member function\n"; }
    static void sma() { std::cout << "static member function\n"; }
  };

  struct o {
    void operator()() { std::cout << "function object\n"; }
  };

  inline void foo1(int, int, int) {}
  void foo2(int, int &, char *) {}

  struct example {
    template<typename... Args, typename T = std::common_type_t<Args...>>
    static std::vector<T> foo(Args &&...args) {
      std::initializer_list<T> li{std::forward<Args>(args)...};
      std::vector<T> res{li};
      return res;
    }
  };

} // namespace hicc::dp::observer::slots::tests

void test_observer_slots() {
  using namespace hicc::dp::observer::slots;
  using namespace hicc::dp::observer::slots::tests;
  using namespace std::placeholders;
  {
    std::vector<int> v1 = example::foo(1, 2, 3, 4);
    for (const auto &elem : v1)
      std::cout << elem << " ";
    std::cout << "\n";
  }
  s d;
  auto lambda = []() { std::cout << "lambda\n"; };
  auto gen_lambda = [](auto &&...a) { std::cout << "generic lambda: "; (std::cout << ... << a) << '\n'; };
  UNUSED(d);

  hicc::util::signal<> sig;

  sig.on(f);
  sig.connect(&s::ma, d);
  sig.on(&s::sma);
  sig.on(o());
  sig.on(lambda);
  sig.on(gen_lambda);

  sig(); // emit a signal
}

void test_observer_slots_args() {
  using namespace hicc::dp::observer::slots;
  using namespace std::placeholders;

  struct foo {
    void bar(double d, int i, bool b, std::string &&s) {
      std::cout << "memfn: " << s << (b ? std::to_string(i) : std::to_string(d)) << '\n';
    }
  };

  struct obj {
    void operator()(float f, int i, bool b, std::string &&s, int tail = 0) {
      std::cout << "obj.operator(): I was here: ";
      std::cout << f << ' ' << i << ' ' << std::boolalpha << b << ' ' << s << ' ' << tail;
      std::cout << '\n';
    }
  };

  // a generic lambda that prints its arguments to stdout
  auto printer = [](auto a, auto &&...args) {
    std::cout << a << std::boolalpha;
    (void) std::initializer_list<int>{
      ((void) (std::cout << " " << args), 1)...};
    std::cout << '\n';
  };

  // declare a signal with float, int, bool and string& arguments
  hicc::util::signal<float, int, bool, std::string> sig;

  connect the slots
  sig.connect(printer, _1, _2, _3, _4);
  foo ff;
  sig.on(&foo::bar, ff, _1, _2, _3, _4);
  sig.on(obj(), _1, _2, _3, _4);

  float f = 1.f;
  short i = 2; // convertible to int
  std::string s = "0";

  // emit a signal
  sig.emit(std::move(f), i, false, std::move(s));
  sig.emit(std::move(f), i, true, std::move(s));
  sig(std::move(f), i, true, std::move(s)); // emit diectly
}
```

同样的，熟悉的 std::bind 支撑能力，不再赘述。

test_observer_slots 就是无参数信号的示例，而 test_observer_slots_args 演示了带有四个参数时信号如何发射，稍稍有点遗憾的是你可能有时候不得不带上 std::move ，这个问题我可能未来某一天才会找个时间段来解决，但欢迎通过 hicc-cxx 的 ISSUE 系统投 PR 给我。



### 优化

这一次，函数形参表是可变的，并非仅有一个 `_1`，也不能预测会有多少参数，所以上一回我们使用的*有赖*手段现在就行不通了。只能老老实实地谋求有无办法自动绑定 placeholders。不幸的是对于 std::bind 来说，std::placeholders 是一个绝对不能缺少的支撑，因为 std::bind 允许你在绑定时指定绑定参数顺序以及提前绑入预置值。由于这个设计目标，因而你不可能抹去 `_1` 等等的使用。

万一当你找到一个办法时，那么同时也就意味着你放弃了 `_1` 等占位符带来的全部利益。

所以这将是一个艰难的决定。对了，BTW，英语根本不会有“艰难的决定”一词，它只会说“那个决定会是非常难”。总之，英语实际上不能精确地描述出决定的艰难程度，例如：“有点艰难的”，“有点点艰难的”，“有那么些艰难的”，“略有些艰难的”，“仿若在过九曲十八弯般的艰难的”，……。一开始还可以“a little”，“a little bit”，但到后面时肯定它死了，对吧……我是不是又跑题了。

> 关于 std::bind 和 std::placeholders 的不可不说的故事，SO 早有人在不停吐槽了。不过支持者总是在说 A (partial) callable entity 的重要性，而不考虑另一方面的实用性：完全可以来个 std::connect 或者 std::link 这样的接口以允许 Callbacks 的自动绑定和自动填充形参的省缺值（即零值）。

能够行得通的方式大概有两种。

一种是分解不同的函数对象，分别进行绑定以及变参转发，这将是个有点庞大的小工程——因为它将会是重新实现一份 std::bind 并且提供自动绑定的额外能力。

另一种是我们将要采用的方法，我们大体上保持借助于 std::bind 的原有能力，但是也沿用上一回的追加占位符实参的手段。

#### cool::bind_tie

不过，刚才前文也说了，现在根本不知道用户准备实例化多少个 SignalSubjects 模板参数，所以简单的添加占位符是不行的。所以我们略略调转思路，一次性加上 9 个占位符，但是增多一层模板函数的展开，在新的一层模板函数中仅仅从 callee 那里取出正好 SubjectsCount 那么多的参数包，再传递给 std::bind 就满意了。

一个可资验证的原型是：

```cpp
template<typename Function, typename Tuple, size_t... I>
auto bind_N(Function &&f, Tuple &&t, std::index_sequence<I...>) {
  return std::bind(f, std::get<I>(t)...);
}
template<int N, typename Function, typename Tuple>
auto bind_N(Function &&f, Tuple &&t) {
  // static constexpr auto size = std::tuple_size<Tuple>::value;
  return bind_N(f, t, std::make_index_sequence<N>{});
}

auto printer = [](auto a, auto &&...args) {
        std::cout << a << std::boolalpha;
        (void) std::initializer_list<int>{
                ((void) (std::cout << " " << args), 1)...};
        std::cout << '\n';
    };

// for signal<float, int, bool, std::string> :

template<typename _Callable, typename... _Args>
auto bind_tie(_Callable &&f, _Args &&...args){
  using namespace std::placeholders;
  return bind_N<4>(printer, std::make_tuple(args...));
}

bind_tie(printer, _1,_2,_3,_4,_5,_6,_7,_8,_9);
```

在这里我们假设了一些前提以模拟 `signal<...>` 类的展开场所。

- 对于 printer 来说，它需要 4 个参数，但我们给它配上 9 个。
- 然后在 `bind_tie()` 中，9 个占位符被收束成一个 tuple，这是为了下一层能够接续处理。
- 下一层 `bind_N()` 的带 N 版本，主要是为了产生一个编译期的自然数序列，这是通过 `std::make_index_sequence<N>{}` 来达成的，它产生 1..N 序列
- 在 `bind_N()` 不带 N 的版本中，利用了参数包展开能力，它使用 `std::get<I>(t)...` 展开式将 tuple 中的 9 个占位符抽出 4 个来
- 我们的目的达到了

这个过程，有一点点内存和时间上的损耗，因为需要 `make_tuple` 嘛。但是和语法的语义性相比这点损耗给得起。

如此，我们可以改写 `signal::connect()` 为 `bind_tie` 版本了：

```cpp
static constexpr std::size_t SubjectCount = sizeof...(SignalSubjects);

template<typename _Callable, typename... _Args>
signal &connect(_Callable &&f, _Args &&...args) {
  using namespace std::placeholders;
  FN fn = cool::bind_tie<SubjectCount>(std::forward<_Callable>(f), std::forward<_Args>(args)..., _1, _2, _3, _4, _5, _6, _7, _8, _9);
  _callbacks.push_back(fn);
  return (*this);
}
```

注意我们从 signal 的模板参数 `SignalSubjects` 抽出了个数，采用 `sizeof...(SignalSubjects)` 语法。

#### 也支持成员函数的绑定

仍有最后一个问题，面对成员函数时 connect 会出错：

```cpp
sig.on(&foo::bar, ff);
```

解决的办法是做第二套 bind_N 特化版本，允许通过 `std::is_member_function_pointer_v` 识别到成员函数并特殊处理。为了让两套特化版本正确共存，需要提供 `std::enable_if` 的模板参数限定语义。最终的 `cool::bind_tie` 完整版本如下：

```cpp
namespace hicc::util::cool {

  template<typename _Callable, typename... _Args>
  auto bind(_Callable &&f, _Args &&...args) {
    return std::bind(std::forward<_Callable>(f), std::forward<_Args>(args)...);
  }

  template<typename Function, typename Tuple, size_t... I>
  auto bind_N(Function &&f, Tuple &&t, std::index_sequence<I...>) {
    return std::bind(f, std::get<I>(t)...);
  }
  template<int N, typename Function, typename Tuple>
  auto bind_N(Function &&f, Tuple &&t) {
    // static constexpr auto size = std::tuple_size<Tuple>::value;
    return bind_N(f, t, std::make_index_sequence<N>{});
  }

  template<int N, typename _Callable, typename... _Args,
  std::enable_if_t<!std::is_member_function_pointer_v<_Callable>, bool> = true>
    auto bind_tie(_Callable &&f, _Args &&...args) {
    return bind_N<N>(f, std::make_tuple(args...));
  }

  template<typename Function, typename _Instance, typename Tuple, size_t... I>
  auto bind_N_mem(Function &&f, _Instance &&ii, Tuple &&t, std::index_sequence<I...>) {
    return std::bind(f, ii, std::get<I>(t)...);
  }
  template<int N, typename Function, typename _Instance, typename Tuple>
  auto bind_N_mem(Function &&f, _Instance &&ii, Tuple &&t) {
    return bind_N_mem(f, ii, t, std::make_index_sequence<N>{});
  }

  template<int N, typename _Callable, typename _Instance, typename... _Args,
  std::enable_if_t<std::is_member_function_pointer_v<_Callable>, bool> = true>
    auto bind_tie_mem(_Callable &&f, _Instance &&ii, _Args &&...args) {
    return bind_N_mem<N>(f, ii, std::make_tuple(args...));
  }
  template<int N, typename _Callable, typename... _Args,
  std::enable_if_t<std::is_member_function_pointer_v<_Callable>, bool> = true>
    auto bind_tie(_Callable &&f, _Args &&...args) {
    return bind_tie_mem<N>(std::forward<_Callable>(f), std::forward<_Args>(args)...);
  }

} // namespace hicc::util::cool
```

经过 bind_tie 的展开和截断之后，我们解决了自动绑定占位符的问题，而且并没有大动干戈，只是使用了最常见的、最不复杂的展开手段，所以还是很得意的。

现在测试代码面对多 subjects 信号触发可以简写为这样了：

```cpp

    // connect the slots
    // sig.connect(printer, _1, _2, _3, _4);
    // foo ff;
    // sig.on(&foo::bar, ff, _1, _2, _3, _4);
    // sig.on(obj(), _1, _2, _3, _4);

    sig.connect(printer);
    foo ff;
    sig.on(&foo::bar, ff);
    sig.on(obj(), _1, _2, _3, _4);
    sig.on(obj());

```

对于静态成员函数，没有做额外测试，但它和普通函数对象是相同的，所以也能正确工作。



## 后记

这一次，Observer Pattern 的计划出乎意料的加长了。

不过这才是我的本意，我自己也顺便梳理一下知识结果，尤其是横向纵向一起梳理才有意思。

这一批观察者模式的完整的代码，请直达 [repo](https://github.com/hedzr/hicc) 的 [hz-common.hh](https://github.com/hedzr/hicc/blob/master/libs/hicc/include/hicc/hz-common.hh) 和 [dp-observer.cc](https://github.com/hedzr/hicc/blob/master/tests/dp-observer.cc)。忽略 github actions 常常 hung up 的超时问题。

:end:

