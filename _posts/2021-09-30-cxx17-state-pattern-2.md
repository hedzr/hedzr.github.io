---
layout: single
title: "谈 C++17 里的 State 模式之二"
date: 2021-09-30 05:00:00 +0800
last_modified_at: 2021-09-30 20:00:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,state pattern,fsm,fsm-cxx,state machine,state chart,design patterns]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210930084318643.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  关于状态模式的研究，以及状态机的 C++17 中的通用实现，介绍 fsm-cxx ...
---





> 这是第二部分，有关有限状态机（FSM）的 C++ 实作部分，也等同于状态模式实现。
> 介绍 [fsm-cxx](https://github.com/hedzr/fsm-cxx) 的实现

## Prologue

上一篇 [谈 C++17 里的 State 模式之一](/c++/algorithm/cxx17-state-pattern/) 对于状态模式所牵扯到的基本概念做了一个综述性的梳理。所以是时候从这些概念中抽取我们感兴趣的部分予以实作了。

## C++ 实现（元编程实现）

如果不采用 DFA 理论推动的手段，而是在 C++11/17 的语境里考虑实现状态模式，那么我们应该重新梳理一下理论：

- 状态机 FSM：状态机总是有限的（我们不可能去处理无限的状态集合）。
- 开始状态 S：Start State/Initial State
- 当前状态 C：Current State
- 下一状态 N：Next State
- 终止状态：Terminated State (Optional)
- 进入状态时的动作：enter-action
- 离开状态时的动作：exit-action
- 输入动作/输入流：input action，也可以是输入条件、或者事件对象等
- 转换：Transition
- 上下文：Context
- 负载：Payload

有的时候，Input Action 也被称作 Transition Condition/Guard。它的内涵始终如一，是指在进入下一状态前通过条件进行判定状态变迁是否被许可。



### 状态机

#### 核心定义

根据以上的设定，我们决定了 fsm machine 的基础定义如下：

```cpp
namespace fsm_cxx {

  AWESOME_MAKE_ENUM(Reason,
                    Unknown,
                    FailureGuard,
                    StateNotFound)

  template<typename S,
           typename EventT = event_t,
           typename MutexT = void, // or std::mutex
           typename PayloadT = payload_t,
           typename StateT = state_t<S>,
           typename ContextT = context_t<StateT, EventT, MutexT, PayloadT>,
           typename ActionT = action_t<S, EventT, MutexT, PayloadT, StateT, ContextT>,
           typename CharT = char,
           typename InT = std::basic_istream<CharT>>
    class machine_t final {
      public:
      machine_t() {}
      ~machine_t() {}
      machine_t(machine_t const &) = default;
      machine_t &operator=(machine_t &) = delete;

      using Event = EventT;
      using State = StateT;
      using Context = ContextT;
      using Payload = PayloadT;
      using Action = ActionT;
      using Actions = detail::actions_t<S, EventT, MutexT, PayloadT, StateT, ContextT, ActionT>;
      using Transition = transition_t<S, EventT, MutexT, PayloadT, StateT, ContextT, ActionT>;
      using TransitionTable = std::unordered_map<StateT, Transition>;
      using OnAction = std::function<void(StateT const &, std::string const &, StateT const &, typename Transition::Second const &, Payload const &)>;
      using OnErrorAction = std::function<void(Reason reason, State const &, Context &, Event const &, Payload const &)>;
      using StateActions = std::unordered_map<StateT, Actions>;
      using lock_guard_t = util::cool::lock_guard<MutexT>;

      // ...
    };
}
```

这是反复迭代之后的成果。

你一定要明白，多数人，和我一样，都是那种脑容量普通的人，我们做设计时一开始都是简陋的，然后不断修正枝蔓、改善设计后才能得到看起来似乎还算完备的结果，如同上面给出的主机器定义那样。



##### 早期版本

作为一个信心增强，下面给出首次跑通一个事件触发和状态推进时的 [machine_t 定义](https://github.com/hedzr/fsm-cxx/blob/648fde035a98e67b9aa06efae65a90b7bfe5d34d/include/fsm_cxx/fsm-sm.hh#L221)：

```cpp
    template<typename StateT = state_t,
             typename ContextT = context_t<StateT>,
             typename ActionT = action_t<StateT, ContextT>,
             typename CharT = char,
             typename InT = std::basic_istream<CharT>>
    class machine_t final {
    public:
        machine_t() {}
        ~machine_t() {}

        using State = StateT;
        using Action = ActionT;
        using Context = ContextT;
        using Transition = transition_t<StateT, ActionT>;
        using TransitionTable = std::unordered_map<StateT, Transition>;
        using on_action = std::function<void(State const &, std::string const &, State const &, typename Transition::Second const &)>;
      
      // ...
    };
```

你得知道的是，状态机的设计有一定的复杂度，这个规模不能算大规模，中规模都算不上，但是也不算小。

不会有多少人能够一次性将其设计并编码到位。除非这个人脑容量特大，再不然就是他习惯于首先做完备的 UML 图，然后 convert to C++ codes...，不过这种功能应该是在 IBM Rational Rose 时代才比较行得通的步骤了，现在已经不太可能借助什么 UML 工具这样来做设计了，我不清楚 PlantUML 今天的发展情况，但我自己是很久没有画过 UML 图了，还不如我手写出 classes 来得直观呢，至少对我的脑路是这样的。



##### 阐释

`machine_t` 的头部定义了一堆模板参数。我觉得无需要什么额外的解释，它们的用意大约是能够直白地传递给你的，如果不能，你可能需要回顾一下状态机的各种背景，嗯，问题绝对不会在我身上。



###### `S` 和 `StateT`

需要特别提及的是，`S` 是 State 的枚举类传入，我们要求你一定要在这里传入一个枚举类作为状态表，并且我们建议你的枚举类采用 AWESOME_MAKE_ENUM 宏来帮助定义（不是必需）。注意在稍后 `S` 会被 `state_t<S>` 所装饰，在 machine_t 内部的一切场所，我们只会使用这个包装过后的类来访问和操作状态。

这是一种防御性的编程手法。

假如未来我们想要引入其他机制，例如一个状态类体系而不是枚举类型的值表示，那么我们可以提供一个不同的 state_t 包装方案，从而将新的机制无破坏地引入到现有的 machine_t 体系中。甚至于我们连 state_t 也可以不必破坏，仅仅是对其做带有 enable_if 的模板特化就足矣。



###### `StateT` 和 `State`

你可能注意到模板参数 `StateT` 和 `using` 别名 `State` 了：

```cpp
using State = StateT;
```

定义别名的用意至少有两个：

1. 在 machine_t 的内部和外部，使用类型别名 `State` 比使用 machine_t 的模板参数名要可靠的多，并且多数时候（尤其是在 machine_t 的外部）你只能使用类型别名
2. 采用抽象后的类型别名有利于调整调优设计

在 `State` 上，我们可以直接使用 StateT，也可以使用更复杂的定义，这些变更（几乎）不会影响到 `State` 的使用者。例如：

```cpp
using State = std::optional<StateT>;
```

也是行得通的。当然实际工程中这么做没有什么必要性。



###### `CharT` 和 `InT`

它们会在未来某一时间点有用。

对于吃进字符流并作 DFA 推动的场景它们可能是有用的。

但目前只是停留在念头上。



###### `OnAction` 以及 `OnErrorAction`

`OnAction` 实际上是 on_transition_made / on_state_changed 的意思。暂时来讲我们没有 rename 令其更显著，因为当初只想着要有一个可以调试输出的 callback，还没有想过 on_state_changed 的 Hook 的必要性。直到后来做了 OnErrorAction 的设计之后才察觉到有必要关联两个 callbacks。







### 其它定义以及如何使用



#### 状态集合

有可能有多种方式提供状态集合，如：枚举量，整数，短字符串，甚至是小型结构。

不过在 `fsm-cxx` 中，我们约定你总是定义枚举量作为 fsm machine 的状态集合。你的枚举类型将作为 machine 的模板参数 `S` 而传递，machine 将以此为基础进行若干的封装。

##### 指定状态的枚举量集合

所以使用时的代码类似于这样：

```cpp
AWESOME_MAKE_ENUM(my_state,
                  Empty,
                  Error,
                  Initial,
                  Terminated,
                  Opened,
                  Closed)

machine_t<my_state, event_base> m;
```

在 [cxx 枚举类型](https://hedzr.com/c++/algorithm/cxx-enum-class/) 中我们曾经介绍过 `AWESOME_MAKE_ENUM` 可以简化枚举类型的定义，在这里你只需要将其看成是：

```cpp
enum class my_state {
                      Empty,
                      Error,
                      Initial,
                      Terminated,
                      Opened,
                      Closed  
}
```

就可以了。

##### 设定 states

接下来可以声明一些基本状态：

```cpp
machine_t<my_state, event_base> m;
using M = decltype(m);

// states
        m.state().set(my_state::Initial).as_initial().build();
m.state().set(my_state::Terminated).as_terminated().build();
m.state().set(my_state::Error).as_error()
  .entry_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cerr << "          .. <error> entering" << '\n'; })
  .build();
m.state().set(my_state::Opened)
  .guard([](M::Event const &, M::Context &, M::State const &, M::Payload const &) -> bool { return true; })
  .guard([](M::Event const &, M::Context &, M::State const &, M::Payload const &p) -> bool { return p._ok; })
  .entry_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <opened> entering" << '\n'; })
  .exit_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <opened> exiting" << '\n'; })
  .build();
m.state().set(my_state::Closed)
  .entry_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <closed> entering" << '\n'; })
  .exit_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <closed> exiting" << '\n'; })
  .build();
```

Initial 是必需的初始状态。状态机总是呆在这里，直到有信号推动它。初始状态可以用 as_initial() 来授予。

terminated，error 状态是可选的。而且暂时来讲它们没有显著的作用——但你可以在你的 action 中检测这些状态并做出相应的应变。类似的，有 `as_terminated()`/`as_eeror()` 来完成相应的指定。

对于每一个状态枚举量来说，你可以根据需要为它们关联 entry/exit_action，如同上面的 `entry_action()/exit_action()` 调用所展示的那样。



##### guards

对于一个将要转进的 state，你也可以为其定义 guards。和 Transition Guards 相同地，一个 State guard 是一个可以返回 bool 结果的函数。而且，该 guard 的用途也相似：在将要转进某个 state 时，根据上下文环境做出判断，以决定是否应该转进到该 state 中。返回 false 时转进动作将不会执行。

定义 state guards 的方式如同这样：

```cpp
// guards
m.state().set(my_state::Opened)
  .guard([](M::Event const &, M::Context &, M::State const &, M::Payload const &) -> bool { return true; })
  .guard([](M::Event const &, M::Context &, M::State const &, M::Payload const &p) -> bool { return p._ok; })
```

你可以为一个 state 定义多条 guards。在上面的实例中，第二条 guard 将会根据 payload 中携带的 _ok 布尔类型值来决定要不要转进到 Opened 状态。

如果 guard 表示不可以转进，则状态机停留在原位置，`machine_t::on_error()` 回调函数将会获得一个 `reason == Reasion::FailureGuard` 的通知，你可以在此时操纵 context 转进到另一状态，但要注意这时候将会是一个内部操作：通过 `context.current(new_state)` 进行到内部转进操作是不会触发任何条件约束和回调机会的。

同样道理，在 `guard()` 所添加的 guard 函数中你也可以操作 context 去修改新的转进状态而不会触发进一步的条件约束和回调机会。



#### 事件

事件，或者说步进信号，需要以一个公共的基类 event_t 为基准，event_t 被用作模板参数传递给 fsm machine，所以你可以使用这个默认设定。

你当然也可以传递一个不同的自定义的基类作为模板参数。例如：

```cpp
struct event_base {};
struct begin : public event_base {};
struct end : public event_base {};
struct open : public event_base {};
struct close : public event_base {};

machine_t<my_state, event_base> m;
```

但这样的 event 体系有可能过于简单了，并且存在着类型丢失的风险（没有虚析构函数声明的类体系是危险的）。

所以我们建议你采用 `fsm-cxx` 预置的 `event_t` 和 `event_type<E>` 来实现你的事件类体系，也就是这样：

```cpp
struct begin : public fsm_cxx::event_type<begin> {
  virtual ~begin() {}
  int val{9};
};
struct end : public fsm_cxx::event_type<end> {
  virtual ~end() {}
};
struct open : public fsm_cxx::event_type<open> {
  virtual ~open() {}
};
struct close : public fsm_cxx::event_type<close> {
  virtual ~close() {}
};
```

这样扩充之后，也可以免去显式声明 event 模板参数：

```cpp
machine_t<my_state> m;
// Or
machine_t<my_state, fsm_cxx::event_t> m;
```

除了上面的好处之外，最大的好处是你可以使用 `(begin{}).to_string()` 来得到类名。它是依赖 `event_t` 和 `event_type<E>` 的简要包装所提供的支撑：

```cpp
namespace fsm_cxx {
  struct event_t {
    virtual ~event_t() {}
    virtual std::string to_string() const { return ""; }
  };
  template<typename T>
  struct event_type : public event_t {
    virtual ~event_type() {}
    std::string to_string() const { return detail::shorten(std::string(debug::type_name<T>())); }
  };
}
```

这对于未来的腾挪留下了充分的余地。

如果你觉得为每个事件类写一个虚析构函数太过于弱爆了，那么用一个辅助的宏好了：

```cpp
struct begin : public fsm_cxx::event_type<begin> {
  virtual ~begin() {}
  int val{9};
};
FSM_DEFINE_EVENT(end);
FSM_DEFINE_EVENT(open);
FSM_DEFINE_EVENT(closed);
```





#### 上下文

在 machine_t 中维持一份内部的上下文环境 Context，这在发生状态转换时是非常重要的核心结构。

Context 提供了当前所处的状态位置，并允许你修改该位置。但要注意如果你通过这个能力进行状态修改的话，条件约束和回调函数将会被你的操作所略过。

> 如果查看 `context_t` 的源代码你会发现在这个上下文环境中 fsm-cxx 还管理了和 states 相关的 entry/exit_action 及其校验代码。这个设计本来是为未来的 HFSM 而准备的。



#### 负载

负载 Payload 从使用者编码的角度来看是游离在上下文、事件之外的。但对于状态机理论来说，它是随着事件一起被传递给状态机的。

在每一次推动状态机步进时，你可以通过 m.step_by() 携带一些有效载荷。这些载荷可以参与 guards 决策，也可以在 entry/exit_actions 中参与动作执行。

默认时 machine_t 使用 payload_t 作为其 PayloadT 模板参数。所以你只需要从 payload_t 派生你的类就可以自定义想要携带的负载了：

```cpp
struct my_payload: public fsm_cxx::payload_t {};
```

你也可以采用 payload_type 模板包装的方式：

```cpp
struct my_payload: public fsm_cxx::payload_type<my_payload> {
  // ...
}
```

至于 machine_t 的模板参数无需做什么修改。

使用时通过 `m.step_by(event, payload)` 直接传递 my_payload 实例即可。



#### 转换表

我们的实现中准备简单地建立两级 hash_map，但第二级中使用一种较笨拙的构造方式。目前看来还没有必要应该在这个部位进行额外的优化。

具体的定义是这样的：

```c++
using Transition = transition_t<S, EventT, MutexT, PayloadT, StateT, ContextT, ActionT>;
using TransitionTable = std::unordered_map<StateT, Transition>;
```

转换表以 from_state 为第一层的 key，并关联一个 transition_t 结构。在 transition_t 中，实际上又有第二级 hash_map 是关联到 EventT 的类名上的，所以一个 EventT 实例信号会索引到关联的 trans_item_t 结构，但这里需要注意的是 EventT 实例本身不重要，重要的是它的类名。你看到我们之前约定事件信号应该分别以最小型 struct 的方式予以声明，而 struct 的结构体成员是被忽视的，machine_t 只需要它的类型名称。

```cpp
template<typename S,
         typename EventT = dummy_event,
         typename MutexT = void,
         typename PayloadT = payload_t,
         typename StateT = state_t<S, MutexT>,
         typename ContextT = context_t<StateT, EventT, MutexT, PayloadT>,
         typename ActionT = action_t<S, EventT, MutexT, PayloadT, StateT, ContextT>>
  struct transition_t {
    using Event = EventT;
    using State = StateT;
    using Context = ContextT;
    using Payload = PayloadT;
    using Action = ActionT;
    using First = std::string;
    using Second = detail::trans_item_t<S, EventT, MutexT, PayloadT, StateT, ContextT, ActionT>;
    using Maps = std::unordered_map<First, Second>;

    Maps m_;

    //...
  };
```

按照上述定义，你在使用时应该这么定义转换表：

```cpp
// transistions
m.transition(my_state::Initial, begin{}, my_state::Closed)
  .transition(
    my_state::Closed, open{}, my_state::Opened,
    [](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <closed -> opened> entering" << '\n'; },
    [](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <closed -> opened> exiting" << '\n'; })
  .transition(my_state::Opened, close{}, my_state::Closed)
  .transition(my_state::Closed, end{}, my_state::Terminated);

m.transition(my_state::Opened,
             M::Transition{end{}, my_state::Terminated,
                           [](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <T><END>" << '\n'; },
                           nullptr});

```

类似于 state()，定义一条转换表规则时，可以为规则挂钩专属的 entry/exit_action，你可以根据你的实际需求来选择是在 state 还是 transition-rule 的恰当位置 hook 事件并执行 action。

你可以选择采用 Builder Pattern 的风格来构造转换表条目：

```cpp
m.builder()
  .transition(my_state::Closed, open{}, my_state::Opened)
  .guard([](M::Event const &, M::Context &, M::State const &, M::Payload const &p) -> bool { return p._ok; })
  .entry_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <closed -> opened> entering" << '\n'; })
  .exit_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <closed -> opened> exiting" << '\n'; })
  .build();
```

它和一次 `m.transition()` 调用是等价的。

##### Guard for A Transition

在转换表定义时，你可以为一个变换（Transition）定义一个前提条件。在转换将要发生时，状态机将会校验该 guard 期待的条件是否满足，只有在满足时才会执行转换动作。

我们曾经提到过，通过 event 信号面向 from_state 的转换路径可以有多条，实际转进中在多条路径中如何选择呢？就是通过 guard 条件来挑选的。

> 在具体实现中，还隐含着顺序挑选原则：最先满足 guard 条件的路径被优先择出，后续的路径则被放弃探查。

##### 无限制

一条转换表条目代表着从 from_state 因为事件 ev 的激励而转进到 to_state。我们既不限制 from 到 (ev, to_state) 的转换路径，而是利用 guard 条件进行选择（但实际上是一个顺序优先的选择）。具体情况可以参考源码的 `transition_t::get()` 部分。





#### 推动状态机运行

当上述的主要定义完成之后，状态机就处于可工作状态。此时你需要某种机制来推动状态机运行。例如当接收到一个鼠标事件时，你可以调用 m.step_by() 去推动状态机。如果推动成功，则状态机将会变换到新的状态。

例如下面的代码做了简单的推动：

```cpp
m.step_by(begin{});   // goto Closed
if (!m.step_by(open{}, payload_t{false}))
  std::cout << "          E. cannot step to next with a false payload\n";
m.step_by(open{});    // goto Opened
m.step_by(close{});
m.step_by(open{});
m.step_by(end{});

```

其输出结果如同这样：

```
        [Closed] -- begin --> [Closed] (payload = a payload)
          .. <closed> entering
          Error: reason = Reason::FailureGuard
          E. cannot step to next with a false payload
          .. <closed -> opened> exiting
          .. <closed> exiting
        [Opened] -- open --> [Opened] (payload = a payload)
          .. <closed -> opened> entering
          .. <opened> entering
          .. <opened> exiting
        [Closed] -- close --> [Closed] (payload = a payload)
          .. <closed> entering
          .. <closed -> opened> exiting
          .. <closed> exiting
        [Opened] -- open --> [Opened] (payload = a payload)
          .. <closed -> opened> entering
          .. <opened> entering
          .. <opened> exiting
        [Closed] -- end --> [Closed] (payload = a payload)
          .. <closed> entering
```

注意推动代码中的第二行会因为 guard 的缘故导致推动不成功，所以输出行中会有 `Error: reason = Reason::FailureGuard` 这样的输出信息。



#### 线程安全

如果你需要一个线程安全的状态机，那么可以给 machine_t 传入第三个模板参数为 `std::mutex`。如同这样：

```cpp
fsm_cxx::machine_t<my_state, fsm_cxx::event_t, std::mutex> m;
using M = decltype(m);

// Or:
fsm_cxx::safe_machine_t<my_state> m;
```

在 m.step_by 的内部进行了竞态条件控制。

但是在定义功能中（例如定义 state/guard/transition 的时候）并没有进行保护，所以线程安全仅适用于 machine_t 开始运行之后。

另外，如果你自定义、或者扩展了你的上下文类，在上下文的内部操作中必需进行竞态条件保护。



### 示例代码完整一览

上面提到的测试用的代码：

```cpp
namespace fsm_cxx { namespace test {

  // states

  AWESOME_MAKE_ENUM(my_state,
                    Empty,
                    Error,
                    Initial,
                    Terminated,
                    Opened,
                    Closed)

  // events

  struct begin : public fsm_cxx::event_type<begin> {
    virtual ~begin() {}
    int val{9};
  };
  struct end : public fsm_cxx::event_type<end> {
    virtual ~end() {}
  };
  struct open : public fsm_cxx::event_type<open> {
    virtual ~open() {}
  };
  struct close : public fsm_cxx::event_type<close> {
    virtual ~close() {}
  };

  void test_state_meta() {
    machine_t<my_state> m;
    using M = decltype(m);

    // @formatter:off
    // states
    m.state().set(my_state::Initial).as_initial().build();
    m.state().set(my_state::Terminated).as_terminated().build();
    m.state().set(my_state::Error).as_error()
      .entry_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cerr << "          .. <error> entering" << '\n'; })
      .build();
    m.state().set(my_state::Opened)
      .guard([](M::Event const &, M::Context &, M::State const &, M::Payload const &) -> bool { return true; })
      .guard([](M::Event const &, M::Context &, M::State const &, M::Payload const &p) -> bool { return p._ok; })
      .entry_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <opened> entering" << '\n'; })
      .exit_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <opened> exiting" << '\n'; })
      .build();
    m.state().set(my_state::Closed)
      .entry_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <closed> entering" << '\n'; })
      .exit_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <closed> exiting" << '\n'; })
      .build();

    // transistions
    m.transition().set(my_state::Initial, begin{}, my_state::Closed).build();
    m.transition()
      .set(my_state::Closed, open{}, my_state::Opened)
      .guard([](M::Event const &, M::Context &, M::State const &, M::Payload const &p) -> bool { return p._ok; })
      .entry_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <closed -> opened> entering" << '\n'; })
      .exit_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <closed -> opened> exiting" << '\n'; })
      .build();
    m.transition().set(my_state::Opened, close{}, my_state::Closed).build()
      .transition().set(my_state::Closed, end{}, my_state::Terminated).build();
    m.transition().set(my_state::Opened, end{}, my_state::Terminated)
      .entry_action([](M::Event const &, M::Context &, M::State const &, M::Payload const &) { std::cout << "          .. <T><END>" << '\n'; })
      .build();
    // @formatter:on

    m.on_error([](Reason reason, M::State const &, M::Context &, M::Event const &, M::Payload const &) {
      std::cout << "          Error: reason = " << reason << '\n';
    });

    // debug log
    m.on_transition([&m](auto const &from, fsm_cxx::event_t const &ev, auto const &to, auto const &actions, auto const &payload) {
      std::printf("        [%s] -- %s --> [%s] (payload = %s)\n", m.state_to_sting(from).c_str(), ev.to_string().c_str(), m.state_to_sting(to).c_str(), to_string(payload).c_str());
      UNUSED(actions);
    });

    // processing

    m.step_by(begin{});
    if (!m.step_by(open{}, payload_t{false}))
      std::cout << "          E. cannot step to next with a false payload\n";
    m.step_by(open{});
    m.step_by(close{});
    m.step_by(open{});
    m.step_by(end{});

    std::printf("---- END OF test_state_meta()\n\n\n");
  }

}}
```



## Epilogue

这一次，代码的细节太多，所以我们偏重于解释如何使用 fsm-cxx。并且由于篇幅的原因，也没有足够的地盘提供完整的代码，所以请参考 repo: [https://github.com/hedzr/fsm-cxx](https://github.com/hedzr/fsm-cxx)。

总的来说，这一次写的自己都不满意。

这种文章总是会非常无趣的吧，不管怎么写都觉得一片散乱。





:end:

