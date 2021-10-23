---
layout: single
title: "谈 C++17 里的 Chain of Responsibility 模式"
date: 2021-10-22 05:10:00 +0800
last_modified_at: 2021-10-22 07:00:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,design patterns,责任链模式,设计模式]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20211022074132666.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  探讨责任链模式（chain of responsibility pattern），并实现一个消息分发系统...
---





> 责任链模式：介绍相关概念并模拟实现一个消息分发系统。

## Responsibility Chain Pattern



### 关于本系列文章

这次的 谈XX模式 系列，并不会逐个全部介绍 GoF 的 23 个模式，也不限于 GoF。有的模式可能是没有模板化复用的必要性的，另外有的模式却并不包含在 GoF 中，所以有时候会有正文的补充版本，像上次的 [谈 C++17 里的 Observer 模式 - 4 - 信号槽模式](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-4/) 就是如此。

因为本系列的重心在于模板化实作上面，以工程实作为目标，所以我们并不会像一般的设计模式文章那样规规矩矩地介绍动机、场景什么的（有时候又未必），而是会以我们的经验和对模式的理解，用自己的话来做阐述，我觉得它可能会有点用，当然快消的世界这样做是很愚蠢。

这对于我们来讲，对个人来讲，也是一个审视和再思考的过程。而对于你来说，换个角度看看他人的理解，说不定其实是有用处的。



### 描述

责任链模式也是一种行为模式（Behavior Patterns）。它的核心概念在于消息或者请求沿着一条观察者链条被传递，每个观察者都可以处理请求、或者略过请求，又或者通过信号终止消息继续向后传递。

消息分发系统是它的典型运用场景。

除此之外，在用户身份鉴权与角色赋予环节也是应用责任链的好场景。

> Responsibility Chain 和观察者模式的区别在于前者的观察者是依次处理同一事件且有可能被中断的，观察者们具有一个轮次关系，而后者的观察者们具有普遍意义上的平等性。

## 实作

我们会建立一个消息分发系统的可复用模板，借助于这个 message_chain_t 可以很容易地建立一套消息分发机制起来。其特点在于 message_chain_t 负责分发消息事件，接收者 receivers 会收到一切事件。

- 所以每个接收者应该判断消息来源以及消息类别来决定自己是否应该处理一个消息。
- 如果接收者消费了某个事件，那么应该返回一个消费结果实体，这个实体由你的消息协议来决定，可以是一个简单的 bool，或者一个状态码，也可以是一个处理结果包（struct result）。
- 一个有效的结果实体会令 message_chain_t 结束消息分发行为。
- 如果返回空（`std::optional<R>{}`），则 message_chain_t 会继续分发消息给其它全部接收者。

和信号槽、observer 模式等的不同之处在于，message_chain_t 是一个 message bumper，而不是发布订阅系统，它是泛泛广播的。



### message_chain_t

message_chain_t 是一个可以指定消息参数包 Messages 以及消息处理结果 R 的模板。消息处理结果 R 由 std::optional 打包，所以 message_chain_t 根据 `std::optional<R>::has_value()` 来决定是否继续消息分发循环。

```cpp
namespace dp::resp_chain {
  template<typename R, typename... Messages>
  class message_chain_t {
    public:
    using Self = message_chain_t<R, Messages...>;
    using SenderT = sender_t<R, Messages...>;
    using ReceiverT = receiver_t<R, Messages...>;
    using ReceiverSP = std::shared_ptr<ReceiverT>;
    using Receivers = std::vector<ReceiverSP>;

    void add_receiver(ReceiverSP &&o) { _coll.emplace_back(o); }
    template<class T, class... Args>
      void add_receiver(Args &&...args) { _coll.emplace_back(std::make_shared<T>(args...)); }

    std::optional<R> send(SenderT *sender, Messages &&...msgs) {
      std::optional<R> ret;
      for (auto &c : _coll) {
        ret = c->recv(sender, std::forward<Messages>(msgs)...);
        if (!ret.has_value())
          break;
      }
      return ret;
    }

    protected:
    Receivers _coll;
  };
}
```

如果接收者成千上万，那么消息分发循环将会是一个性能瓶颈点。

如果有这样的需求，一般是通过消息分层分级之后再分组的方式来解决。无论是分层级还是分组的目的都是为了削减一次分发循环所需要遍历的 elements 大幅度减少（减少到几百、几十的数量级）。

> 分层级可以通过串联两个 message_chain_t 的方法来实现。

### receiver_t

你可以向 message_chain_t 添加接收者。接收者需要从 receiver_t 派生，并且实现 on_recv 虚函数。

```cpp
namespace dp::resp_chain {
  template<typename R, typename... Messages>
  class receiver_t {
    public:
    virtual ~receiver_t() {}
    using SenderT = sender_t<R, Messages...>;
    std::optional<R> recv(SenderT *sender, Messages &&...msgs) { return on_recv(sender, std::forward<Messages>(msgs)...); }

    protected:
    virtual std::optional<R> on_recv(SenderT *sender, Messages &&...msgs) = 0;
  };
}
```



### sender_t

消息的生产者需要 sender_t 的帮助，它的声明如下：

```cpp
namespace dp::resp_chain {
  template<typename R, typename... Messages>
  class sender_t {
    public:
    virtual ~sender_t() {}

    using ControllerT = message_chain_t<R, Messages...>;
    using ControllerPtr = ControllerT *;
    void controller(ControllerPtr sp) { _controller = sp; }
    ControllerPtr &controller() { return _controller; }

    std::optional<R> send(Messages &&...msgs) { return on_send(std::forward<Messages>(msgs)...); }

    protected:
    virtual std::optional<R> on_send(Messages &&...msgs);

    private:
    ControllerPtr _controller{};
  };
}
```

类似地，一个发送者要实现 sender_t::on_send。

### 测试代码

测试代码有一点复杂度。

#### StatusCode, A and B

首先是定义相应的对象：

```cpp
namespace dp::resp_chain::test {

  enum class StatusCode {
    OK,
    BROADCASTING,
  };

  template<typename R, typename... Messages>
  class A : public sender_t<R, Messages...> {
    public:
    A(const char *id = nullptr)
      : _id(id ? id : "") {}
    ~A() override {}
    std::string const &id() const { return _id; }
    using BaseS = sender_t<R, Messages...>;

    private:
    std::string _id;
  };

  template<typename R, typename... Messages>
  class B : public receiver_t<R, Messages...> {
    public:
    B(const char *id = nullptr)
      : _id(id ? id : "") {}
    ~B() override {}
    std::string const &id() const { return _id; }
    using BaseR = receiver_t<R, Messages...>;

    protected:
    virtual std::optional<R> on_recv(typename BaseR::SenderT *, Messages &&...msgs) override {
      std::cout << '[' << _id << "} received: ";
      std::tuple tup{msgs...};
      auto &[v, is_broadcast] = tup;
      if (_id == "bb2" && v == "quit") { // for demo app, we assume "quit" to stop message propagation
        if (is_broadcast) {
          std::cout << v << ' ' << '*' << '\n';
          return R{StatusCode::BROADCASTING};
        }
        std::cout << "QUIT SIGNAL to stop message propagation" << '\n';
        dbg_print("QUIT SIGNAL to stop message propagation");
        return {};
      }
      std::cout << v << '\n';
      return R{StatusCode::OK};
    }

    private:
    std::string _id;
  };

} // namespace dp::resp_chain::test
```

#### test_resp_chain

在测试代码中，我们定义了一个消息组为 （Msg，bool）的 message_chain_t。

bool 参数的含义为 is_broadcasting，true 代表着消息将始终被分发给所有接收者，false 时则遵守 message_chain_t 的默认逻辑，一旦有接收者消费了消息组的内容，就停止消息的继续分发。

> 注意 is_broadcasting = true 时，接收者 A 和 B 都会有相应的条件分支来返回空，从而令 message_chain_t 继续向下分发。

test_resp_chain() 为：

```cpp
void test_resp_chain() {
  using namespace dp::resp_chain;

  using R = test::StatusCode;
  using Msg = std::string;
  using M = message_chain_t<R, Msg, bool>;
  using AA = test::A<R, Msg, bool>;
  using BB = test::B<R, Msg, bool>;

  M m;

  AA aa{"aa"};
  aa.controller(&m); //

  m.add_receiver<BB>("bb1");
  m.add_receiver<BB>("bb2");
  m.add_receiver<BB>("bb3");

  aa.send("123", false);
  aa.send("456", false);
  aa.send("quit", false);
  aa.send("quit", true);
}

```

运行结果会是这样：

```bash
--- BEGIN OF test_resp_chain                            --------
[bb1} received: 123
[bb2} received: 123
[bb3} received: 123
[bb1} received: 456
[bb2} received: 456
[bb3} received: 456
[bb1} received: quit
[bb2} received: QUIT SIGNAL to stop message propagation
[bb1} received: quit
[bb2} received: quit *
[bb3} received: quit
--- END OF test_resp_chain                              --------
```

其中最后一组信息是广播消息，所以 quit 信号不会导致终止。



## 后记

真实的消息分发，例如 Windows 系统的窗口消息分发，会在性能和逻辑上继续深入，而我们的示例代码在这个部分比较简易。

可以很容易修改 message_chain_t 管理一个 tree 结构以应对诸如窗口、对话框这样的 UI 系统模型，但由于多数 GUI 类库都会自行负责和提供一整套基础设施，所以本文仅作参考。

![对象树的枝干可以组成一条链](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/solution2-zh.png)

> FROM: [here](https://refactoringguru.cn/design-patterns/chain-of-responsibility)

:end:

