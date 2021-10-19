---
layout: single
title: "谈 C++17 里的 Observer 模式"
date: 2021-09-15 05:00:00 +0800
last_modified_at: 2021-09-16 04:33:00 +0800
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
  关于观察者模式的研究，及其实现，...
---



> 昨天很疲惫，没精力写字。今天凌晨被摇醒，一开始没意识到真的在摇，换了两个姿势没感觉，干脆就写字吧。半晌之后，看新闻才知道确实震了，上一次 CQ 有明显感觉时是 08 年，抱着娃下楼呆站，没有实时的资讯可言，不知道事态将会怎么演变，升斗小民想要挣扎求存也不可得，哪怕是今天其实也是如此，并不会因为消息满天飞就有所不同。
>
> 因为，中文网着实是个充满了垃圾的地方啊。
>
> 所以我订阅的震情速报毫无意义。缘何，因为国产的 Android 机太肮脏啊，所以我总是会装很多杀后台的工具。结果杀得通知总是晚上6点时噼里啪啦来几十上百条，幸好有分组，一划就能抹掉几十条，不算累，可以忍。
>
> 谢谢你看我叨叨，继续谈谈观察者模式吧：

## Observer Pattern

观察者模式是一种行为模式，它是一种订阅-发布机制。对象能够发布公告，这种公告事件发生时，凡是向对象注册了观察者身份的人将能够收到通知。注册身份即订阅，事件发生即发布。

可以有很多的观察者做订阅，此时在被观察对象中持有一个观察者链条。



### 工程上的疑难

通常的 C++ 实现都关注模式的模型化实现，而不注重实用特质。所以你能看到的多数观察者模式的实现都是案例型的，不支持跨线程、异步和非阻塞。

由于观察者链条的阻塞式单向遍历特性，一个不规矩的观察者可能会挂起事件发生的通知链，并且进一步地挂起整个线程。

然而，解决这个问题并不容易——多数情况下我们依赖于约定：观察者必须规规矩矩地做好自己的事，而且必须很快地完成观察。如果想要彻底地解决这个问题，将会需要一个超时打断机制，但这往往会使得整个观察者模式的实现代码模糊而复杂，事实上导致该手法不可行。

如果令你的观察者模式实作支持异步方式，这可能是有用的，但它的问题在于事件的响应时延不可预知（交由 CPU 线程调度特性）。有两种方式来非阻塞触发：一是在事件发生时启动一个线程以便遍历观察者链并依次回调，二是遍历观察者链并在新线程中回调。两种方式各有特点，你可以在实际实作时予以评估。此外，采用 C++20 提供的协程标准库有助于改善响应时延。



### 是误解吗

我已经很多年没有绘制过 UML 图了。实际上我觉得这个图用处不大，还不如直接看代码来的直接直觉呢，看图还得脑子里翻译一遍，看代码吧，好像脑子当 CPU 非常熟练啊，直接就有。

我是不是错过了什么，或者，误会了什么。



### 场景

观察者模式是如此的易于理解，以至于无需专门设计恰当的场景来解说它。

顾客看看商店里商品有否到货了。我去订一份南华早报。向乳品公司订每早鲜牛奶。等等。



### 组成

话虽如此（boring on uml），还是引用一张图：

![观察者设计模式的结构](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/structure.png)

> FROM:  [观察者设计模式](https://refactoringguru.cn/design-patterns/observer) 

1. **发布者** （Publisher） 会向其他对象发送值得关注的事件。 事件会在发布者自身状态改变或执行特定行为后发生。 发布者中包含一个允许新订阅者加入和当前订阅者离开列表的订阅构架。
2. 当新事件发生时， 发送者会遍历订阅列表并调用每个订阅者对象的通知方法。 该方法是在订阅者接口中声明的。
3. **订阅者** （Subscriber） 接口声明了通知接口。 在绝大多数情况下， 该接口仅包含一个 `update`更新方法。 该方法可以拥有多个参数， 使发布者能在更新时传递事件的详细信息。
4. **具体订阅者** （Concrete Subscribers） 可以执行一些操作来回应发布者的通知。 所有具体订阅者类都实现了同样的接口， 因此发布者不需要与具体类相耦合。
5. 订阅者通常需要一些上下文信息来正确地处理更新。 因此， 发布者通常会将一些上下文数据作为通知方法的参数进行传递。 发布者也可将自身作为参数进行传递， 使订阅者直接获取所需的数据。
6. **客户端** （Client） 会分别创建发布者和订阅者对象， 然后为订阅者注册发布者更新。



### 实现

观察者模式的 C++17 全新实现，主要在于这些方面：

- 使用智能指针而不是以前的裸指针，同时也精细明确管理权
- 允许不同手段的添加观察者方式
- 允许定制的 Observer 类型
- 优先采用空结构体作为事件信号

![image-20210916080003947](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210916080003947.png)



#### 核心模板 observable 及 observer

一个默认推荐的 observer 基类模板向你提供基础构造原型。你的观察者类应该从该模板派生。除非你打算自行定义接口（不过，很大程度上，自行定义的必要性无限趋近于零，因为 observable 模板要求一个 Observer 必须具有 `observe(subject const&)` 这样的接口）。

至于 observable 模板本身，它包含了 '+=' 以及 '-=' 运算符重载，所以你可以使用较为语义化的编码方式。

代码如下（参考于 hz-common.hh）：

```cpp
namespace hicc::util {

  template<typename S>
  class observer {
    public:
    virtual ~observer() {}
    using subject_t = S;
    virtual void observe(subject_t const &e) = 0;
  };

  template<typename S, typename Observer = observer<S>, bool Managed = false>
  class observable {
    public:
    virtual ~observable() { clear(); }
    using subject_t = S;
    using observer_t_nacked = Observer;
    using observer_t = std::weak_ptr<observer_t_nacked>;
    using observer_t_shared = std::shared_ptr<observer_t_nacked>;
    observable &add_observer(observer_t const &o) {
      _observers.push_back(o);
      return (*this);
    }
    observable &add_observer(observer_t_shared &o) {
      observer_t wp = o;
      _observers.push_back(wp);
      return (*this);
    }
    observable &remove_observer(observer_t_shared &o) { return remove_observer(o.get()); }
    observable &remove_observer(observer_t_nacked *o) {
      _observers.erase(std::remove_if(_observers.begin(), _observers.end(), [o](observer_t const &rhs) {
        if (auto spt = rhs.lock())
          return spt.get() == o;
        return false;
      }), _observers.end());
      return (*this);
    }
    observable &operator+=(observer_t const &o) { return add_observer(o); }
    observable &operator+=(observer_t_shared &o) { return add_observer(o); }
    observable &operator-=(observer_t_nacked *o) { return remove_observer(o); }
    observable &operator-=(observer_t_shared &o) { return remove_observer(o); }

    public:
    /**
      * @brief fire an event along the observers chain.
      * @param event_or_subject 
      */
    void emit(subject_t const &event_or_subject) {
      for (auto const &wp : _observers)
        if (auto spt = wp.lock())
          spt->observe(event_or_subject);
    }

    private:
    void clear() {
      if (Managed) {
      }
    }

    private:
    std::vector<observer_t> _observers;
  };

} // namespace hicc::util
```

在当前实现中，observable 的模板参数 Managed 是无用的，目前尚未实现观察者的托管功能，所以你总是必须自行管理每个观察者的实例。而在 observable 中仅包含到观察者的 weak_ptr，这为将来加入异步能力埋下伏笔，但当前其用处显得不大。

在前边话说了很多，但具体实现时核心类模板的代码也就这样，并不太多。

#### test case

使用的方法是：

- 声明事件信号为结构体，你可以在结构体中包含必要的负载，从而使用一个单一的结构体承载不同的事件信号
- 但 observable 并不支持你提供多个结构体类型的事件信号
- 可观察对象需要从 observable 派生出来
- 观察者利用 `make_shareable` 建立并注册到可观察对象中

示例代码如下：

```cpp
namespace hicc::dp::observer::basic {

  struct event {};

  class Store : public hicc::util::observable<event> {};

  class Customer : public hicc::util::observer<event> {
    public:
    virtual ~Customer() {}
    bool operator==(const Customer &r) const { return this == &r; }
    void observe(const subject_t &) override {
      hicc_debug("event raised: %s", debug::type_name<subject_t>().data());
    }
  };

} // namespace hicc::dp::observer::basic

void test_observer_basic() {
  using namespace hicc::dp::observer::basic;

  Store store;
  Store::observer_t_shared c = std::make_shared<Customer>(); // uses Store::observer_t_shared rather than 'auto'
  store += c;
  store.emit(event{});
  store -= c;
}
```

Store 是一个可观察对象。

Customer 作为观察者，通过 `store += c` 注册，并通过 `store -= c` 撤销注册。

在合适的地方，store.emit() 将一个事件信号发射出去，然后所有的观察者将会收到该信号，然后该怎么解释就怎么解释。

注意智能指针的降级：

- 必须使用 `Store::observer_t_shared c = std::make_shared<Customer>();`，因为 '+=' 和 '-=' 运算符能识别的是 `hicc::util::observable<event>::observer_t_shared` 类型
- 如果你使用 `auto c = std::make_shared<Customer>()`，它们不能被 '+=' 或 '-=' 所推导，编译会无法完成
- 可以通过 CRTP 技术考虑解决这一问题，但必要性其实并不大 - 你可以抱怨出来，我说不定就有动力了

遗留的问题：

- 没有防止观察者重复注册的机制。加上它并不困难，但我们觉得你不应该写出重复注册的代码，所以我们不关心重复与否，你来～



## Epilogue

我们没有能解决疑难问题。上文中提出的疑难问题，只能由观察者模式的一个现实中的增强版本——Rx/ReactiveX——来予以解决。但 ReactiveX 呢，却又根本不是一个单纯的订阅模式，而且门槛过于高了。

所以呢，或者，也许，下回考虑做一个简单一点的 Rx，你知道 ReactiveX 已经有 RxCpp 了，然而我们或许弄个简易版 Rx，把主要目的放在为观察者模式添加异步能力就好，至于那些运算子就放弃了。

订阅者模式，或者说观察者模式还有一种著名的实现：Qt 的 Signal-Slot 机制。这种东西有赖于 Qt 的 QObject，提供一种 connect 之后能被 signal 所触发的机制，它几乎等同于观察者模式，但强调了 sender 和 receiver 的概念，这对于多数情况下的观察者模式实现来说或许并不是必要的。但是信号槽机制针对 C++11 之前的开发者来说提供了带参数无关联的槽函数回调能力，这是当初大家都做不到的，即使 C++11 之后，由于模板变参与完美转发有时候语法不够完善，也要等到 C++14/17 之后才能有全面的超越。所以现在呢，slot 这种机制已经失去了其诱惑力，只是在固守而已，而实际应用的话，除非你在使用 qt 否则大多还是随便做个 observable 也很轻巧容易。

---

BTW，题外话，自从有了弹幕之后，旅游景点的到此一游不文明行为都不再有听说了，譬如说 Alan 的 94 金曲演唱会里面还有昨前天的好多人打卡，也挺好的。这就是弹幕的贡献了吧？

我做开源，是不是也有对这世界有所贡献呢？每个人还是都喜欢被认可的。





:end:

