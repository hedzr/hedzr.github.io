---
layout: single
title: "谈 C++17 里的 Strategy 模式"
date: 2021-10-03 04:03:00 +0800
last_modified_at: 2021-10-03 07:00:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,strategy pattern,design patterns]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/dp-strategy-3221408.svg
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  重新思考状态模式的实作可能性...
---





> 策略模式

## Strategy Pattern

在地图上对两点进行路线规划就是一种典型的策略模式应用场景。当我们进行起点到终点的路线规划时，我们期待地图给出这些方式的最佳路线：步行。公交，驾车。有时候可能细分为公交（轨道交通优先），公交（换乘优先）等若干策略。

### 标准实作

按照我们的构造习惯，下面是路径规划的一个框架性代码

```cpp
namespace hicc::dp::strategy::basic {

    struct guide {};
    struct context {};

    class router {
    public:
        virtual ~router() {}
        virtual guide make_guide(context &ctx) = 0;
    };

    template<typename T>
    class router_t : public router {
    public:
        virtual ~router_t() {}
    };

    class by_walk : public router_t<by_walk> {
    public:
        virtual ~by_walk() {}
        guide make_guide(context &ctx) override {
            guide g;
            UNUSED(ctx);
            return g;
        }
    };

    class by_transit : public router_t<by_transit> {
    public:
        virtual ~by_transit() {}
        guide make_guide(context &ctx) override {
            guide g;
            UNUSED(ctx);
            return g;
        }
    };

    class by_drive : public router_t<by_drive> {
    public:
        virtual ~by_drive() {}
        guide make_guide(context &ctx) override {
            guide g;
            UNUSED(ctx);
            return g;
        }
    };

    class route_guide {
    public:
        void guide_it(router &strategy) {
            context ctx;
            guide g = strategy.make_guide(ctx);
            print(g);
        }

    protected:
        void print(guide &g) {
            UNUSED(g);
        }
    };

} // namespace hicc::dp::strategy::basic

void test_strategy_basic() {
    using namespace hicc::dp::strategy::basic;
    route_guide rg;

    by_walk s;
    rg.guide_it(s);
}
```

除了上面的测试代码部分那样的写法之外，我们还可以援引工厂模式来创建所有 router 的实例，并且枚举全部 routers 来一次性地得到所有路径规划。这种遍历的方式也是工程上真实会采用的方案，例如地图软件中总是这么管理所有的可能的`路由器`的。

![dp-strategy](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/dp-strategy-3221408.svg)





### 整理

根据上面的示例，我们可以重新整理出策略模式的若干要点：

1. 策略模式是从一堆方法中抽象出完成特定任务的公共接口，依据该公共接口，提供一个管理者，以及若干策略。
2. 每一策略代表着实现特定任务的不同算法。
3. 管理者不关心具体采用的策略有何特别之处，只要它支持公共的策略计算接口就行。
4. 管理者负责提供一个上下文环境来调用策略计算器。
5. 上下文环境能够为策略计算带来不同的计算环境。
6. 策略计算器根据自己的算法需要从上下文环境中抽取感兴趣的参数，籍以完成计算
7. 计算结果被抽象为一个公共类的形态。
8. 策略计算器可以在公共结果类的基础上派生出自己的特殊实现，但为了管理者能够抽取结果，此时要约定一个公有的抽取结果的接口。

在示例代码中提供了一个模板类的中间层 `router_t<T>`，我们正是打算在这个位置为 routers 引入工厂创建和注册机制，以便能够在一个管理器中收集全部 routers 的唯一实例，稍后可以在 router_guide 中使用它们。



### Policy-based Programming

此前我在 [C++ policies & traits](/c++/algorithm/cxx-policy-traits) 中曾经谈论过面向 policy 的元编程手法。

面向 Policy 编程，和策略模式有些相似之处，也有不同之处。

例如选择不同笔型的写作器：

```cpp
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

这是用面向 Policy 编程手法实作的策略模式的一个例子。它有这样的细微之处值得注意：

1. 没有 strategy 的公共基类了

   不像前文的 router 的基类来提供一个策略操作接口，元编程的世界里可以借助于 SFINAE 的技巧直接做接口耦合。

2. 由于模板的编译期展开的特点，因此在运行期动态切换策略变得较为不可行。

   为了做到运行期动态切换，你可能需要特别附加若干代码来提供数个 writers，它们分别对不同的笔型进行展开，以备运行期可用。



### 可能恰当的场所

按照通常的理解，你或许会觉得前一种方法才是标准的策略模式。而且，怎么会有什么场景需要我选择一种策略在编译期就固化下来呢？

事实上还真是有。

在上面选择笔型作为示例，只是为了较为精简地演示出代码编写方法（而且它是我们上一篇文章中的案例），但它确实不是编译期策略选择的最佳例子。

但是设想这样的情况，你是一个类库作者，正在提供一个通用型的 socket 通信库。那么对于阻塞式和非阻塞式就可以提供两个 policy class 分别予以实现。而用户在使用你的 socket 库时可以根据他的通信场景选择一个最恰当的 policy：

```cpp
class non_blocked {
  public:
  void connect(){}
  void disconnect(){}
  
};

class blocked {
  public:
  void connect(){}
  void disconnect(){}
};

struct tcp_conn;
struct udp_conn;

template<typename DiagramMode = tcp_conn,
         typename CommunicateMode = non_blocked,
         typename Codec = packaged_codec>
class socket_man {
  public:
  void connect(){}
  void disconnect(){}
  
  protected:
  virtual void on_connect(...);
  virtual void on_recv(...);
  virtual void on_send(...);
  
  protected:
  static void runner_routine(){
    // ...
  }
};
```

在这个构型中，通过选择通信模式为阻塞或非阻塞，同样也将实现了策略模式，但它就是适合于编译期做出的选择。

类似的，你还可以在使用这个通信库时选择时 TCP 还是 UDP 通信，数据报的编码解码采用何种算法等等，这些都可以通过 socket_man 的模板参数以 policy 的方式完成策略模式的选择。



## 后记

文中提供了两种典型的实作方法，分别代表着策略模式的编译期展开和运行期展开方案。

根据实际的场景你可以参考并挑选一种。

策略模式的工程上的应用还可以有很多种形态，甚至不必局限于编码、特定语言的编码层面中。例如我们还可以通过插件结构的方式来提供二进制层面的策略选择。

另：这一次倒是没用到 C++17 的专有特性。奈何咱们这标题需要系列化嘛。



:end:

