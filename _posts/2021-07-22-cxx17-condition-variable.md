---
layout: single
title: "C++17 中的条件变量"
date: 2021-07-22 05:00:00 +0800
last_modified_at: 2021-07-22 22:59:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,condition variable,policy,traits,loki,boost,modern c++ design]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/timeline.png
  overlay_image: /assets/images/unsplash-image-3.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  条件变量及其理解和改进。顺便讲了一些拉拉杂杂的，有点失控了...
---


## 引子

今次打算做条件变量（condition variable）的介绍，但不会做基础解释，因为基本定义类的概念直接 cppreference 就够了。

同样的道理，我讲述的是面向 C++17 及以后的规范的。

原因在于我一向以为，C++11 固然不错，但实在是太简陋了，一切稍微重要的实作型基础设施，例如读写锁，信号量等等全都没有，而可变参数模板、可变参数展开、折叠表达式等等也没有（或者说存在问题），这导致我浅度尝试了迁移代码后发现同样的形状难看（因为实在是需要太多预处理和各式各样的 hack 手法）后被迫挂起了操作，转投其他语言。相信我，对 TC 有感情的人（暂时）放弃也绝对是很难过的。

直到 C++17 的各种特性固化后，这些情况才得以最终改善（即使是信号量仍旧是没有）。

其实还不算完美，例如匿名函数一直以来真的炒鸡难看，和 Kotlin 比比看就是被秒的下场。不过你忍一下哈。

所以呢，我从 C++17 开始觉得可以重新操练一下。这么多年来 C++ 的演变史，人的审美观也是在主动地、被迫地不断演进。不管什么原因，我现在就是觉得可以从 17 开始。

没有 C++11 的奠基，14，17 都是不可能的，所以我也没有贬低 11 的意思。

此外，何不从 20 开始呢？毕竟 C++23 都已经热闹起来了。我想，还是不必太激进吧。再有就是 20 其实没什么必不可少的特性，不像 17，没有参数包展开以及折叠，一大票类库构型可能都会很难编写，后果是调用者有时候就要忍受不自然的语法。

## 条件变量

![timeline](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/timeline.png)

> FROM: <https://www.modernescpp.com/images/blog/Cpp17/Overview/timeline.png>

**条件变量**（condition variable）的存在目的是“被唤醒”。

多线程（多例程、或者说多协程）开发中若干消费者等待有 food 喂食了被唤醒，是条件变量的典型的应用场景。

所以条件变量有两种典型的需求：唤醒某个消费者，给它喂一颗食，此时要求随机唤醒；唤醒所有消费者，（让它们自己去抢？）让它们自尽，app 将要 terminated 了。

这是由 `std::condition_variable` 的 `notify_one()` 和 `notify_all()` 分别达成的。

### 等待某个条件满足

假设我们需要 100 个线程，并且我们想要知道这些线程都已经就绪了，这一点可以通过 condition_variable 来实现：

```c++
std::condition_variable cv100;
std::mutex cv100_m;
int count{0};

void test_cv_0() {
  std::vector<std::thread> waits;
  for (int i = 0; i < 100; i++) {
    auto t = std::thread([]() {
      {
        {
          std::unique_lock<std::mutex> lk(cv100_m);
          count++;
        }
        cv100.notify_one();

        // one thread running now
      }

      using namespace std::literals::chrono_literals;
      std::this_thread::sleep_for(10s); //simulate a long stuff
      std::cout << "end of thread" << '\n';
    });
    waits.push_back(std::move(t));
  }

  {
    std::unique_lock<std::mutex> lk(cv100_m);
    cv100.wait(lk, []() { return count >= 100; });
    // all threads ran now.
  }

  // all threads ready, do stuff ...

  // and, waiting for their stops.
  for (auto it = waits.begin(); it != waits.end(); it++) {
    auto &t = (*it);
    t.join();
  }
}
```

这个模型可以被你改造到你自己的用途。我认为这是我为你制作的一个最佳范本，它能够清晰明了地向你解释清楚 condition variable 有何用处，该怎么用。而大多数的 condition variable 的范例都显得非常的高深，或者难以解释。

显然，每当 notify_one 在被调用时，“生产者”已经投食了（通过 `count++`），此时等待语句 `cv100.wait(lk, []() { return count >= 100; });` 就会活过来一下，发现条件不满足（`count>=100`），就又睡了。

等到 100 个线程都投过食了，等待语句发现条件满足，那么就向下走。

据此，我们就得到了一个证实，全部线程都已经开始运行了。



### 生产者消费者模型

而稍稍调整其用法，只有 m 个线程在反复不断地投食，n 个线程都使用等待语句在睡着：

```c++
std::condition_variable cvpc;
std::mutex cvpc_m;
std::deque<int> cvpc_queue;
int seq;

void test_cv_1() {
  std::vector<std::thread> waits;
  for (int i = 0; i < 5; i++) {
    auto t = std::thread([]() {
      for (int j = 0; j < 10; j++) {
        {
          std::unique_lock<std::mutex> lk(cvpc_m);
          seq++;
          cvpc_queue.push_back(seq);
        }
        cvpc.notify_one();

        std::this_thread::yield();
      }
      // printf("#%d: ended.\n", i);
    });
    waits.push_back(std::move(t));
  }

  for (int i = 5; i < 15; i++) {
    auto t = std::thread([i]() {
      while (true) {
        {
          std::unique_lock<std::mutex> lk(cvpc_m);
          if (seq >= 50 && cvpc_queue.empty()) break;
          cv100.wait(lk, []() { return !cvpc_queue.empty(); });
        }
        auto vv = cvpc_queue.front(); // 不那么费力地
        cvpc_queue.pop_front();       // 简化这两句 
        printf("#%d: got %d\n", i, vv);

        std::this_thread::yield();
      }
      // printf("#%d: ended.\n", i);
    });
    waits.push_back(std::move(t));
  }

  for (auto it = waits.begin(); it != waits.end(); it++) {
    auto &t = (*it);
    t.join();
  }
}
```

这是简易的示范，它忽略了提取数据时的严谨性，为了避免可能的竞争条件，你可能需要改进这两行代码的写法：

```c++
        auto vv = cvpc_queue.front(); // 不那么费力地
        cvpc_queue.pop_front();       // 简化这两句 
```

不过用于演示目的目前是足够了。

另外，我们没有在这里加入全部线程就绪的条件变量，所以有的线程活动比较早，也因此它的运行结果可能不那么均匀，某些线程在早期会获得更多的唤醒机会并吃到投食。

但这些并不是我们演示的重点。

### 改进

即使像上面这样简单，我们还是会觉得条件变量显得麻烦，这可能是因为它需要搭配一些别的数据（一颗锁，一个乃至多个变量）才能一起使用吧。

所以我们可以这样做一点点封装：

```c++
namespace hicc::pool {
  template<typename Pred = std::function<bool()>, typename Setter = std::function<void()>>
  class conditional_wait {
    std::condition_variable cv;
    std::mutex m;
    Pred p;
    Setter s;

    public:
    conditional_wait(Pred &&p_, Setter &&s_)
      : p(std::move(p_))
        , s(std::move(s_)) {}
    ~conditional_wait() {}
    conditional_wait(conditional_wait &&) = delete;
    conditional_wait &operator=(conditional_wait &&) = delete;

    public:
    void wait() {
      std::unique_lock<std::mutex> lk(m);
      cv.wait(lk, p);
    }
    void set() {
      {
        std::unique_lock<std::mutex> lk(m);
        s();
      }
      cv.notify_one();
    }
    void set_for_all() {
      {
        std::unique_lock<std::mutex> lk(m);
        s();
      }
      cv.notify_all();
    }
  };
}
```

这个包装类对条件变量的使用做了一些抽象和封装。但它还只是一个基础类，我们提供了两个进一步的封装，除了能演示 `conditional_wait` 的用法之外，也提供更简明的编码能力：

```c++
namespace hicc::pool {
  class conditional_wait_for_bool : public conditional_wait<> {
    bool var;

    public:
    conditional_wait_for_bool()
      : conditional_wait([this]() { return _wait(); }, [this]() { _set(); }) {}
    ~conditional_wait_for_bool() { release(); }
    conditional_wait_for_bool(conditional_wait_for_bool &&) = delete;
    conditional_wait_for_bool &operator=(conditional_wait_for_bool &&) = delete;

    private:
    bool _wait() const { return var; }
    void _set() { var = true; }
    void release() {
      //
    }
  };

  class conditional_wait_for_int : public conditional_wait<> {
    int var;
    int max_value;

    public:
    conditional_wait_for_int(int max_value_ = 1)
      : conditional_wait([this]() { return _wait(); }, [this]() { _set(); })
        , max_value(max_value_) {}
    ~conditional_wait_for_int() { release(); }
    conditional_wait_for_int(conditional_wait_for_int &&) = delete;
    conditional_wait_for_int &operator=(conditional_wait_for_int &&) = delete;

    private:
    bool _wait() const { return var >= max_value; }
    void _set() { var++; }
    void release() {
      //
    }
  };
}
```

你还可以做你自己的简洁封装，它们会非常有用。请看我们下面的示例就知道了，你的代码能够因此而易读的多，无需太多的脑力消耗。

#### 示例

```c++
void test_cv() {
  {
    hicc::pool::conditional_wait_for_bool cv;
    auto t = std::thread([&cv]() {
      using namespace std::literals::chrono_literals;
      std::this_thread::yield();
      std::this_thread::sleep_for(1s);

      cv.set_for_all();
      std::cout << "end of thread" << '\n';
    });
    std::cout << "wait for cv" << '\n';
    cv.wait();
    std::cout << "end of cv test" << '\n';
    t.join();
  }
  {
    std::vector<std::thread> waits;
    hicc::pool::conditional_wait_for_int cv(3);
    for (int i = 0; i < 3; i++) {
      auto t = std::thread([&cv]() {
        using namespace std::literals::chrono_literals;
        std::this_thread::sleep_for(2s);

        cv.set();
        std::cout << "end of thread" << '\n';
      });
      waits.push_back(std::move(t));
    }
    std::cout << "wait for cv" << '\n';
    cv.wait(); // waiting for all threads ended.

    std::cout << "end of cv test" << '\n';
    for (auto it = waits.begin(); it != waits.end(); it++) {
      auto &t = (*it);
      t.join();
    }
  }
}
```

注意，第二个子测试只是为了演示的目的，作为生产者消费者模型的一种简易替代。你应该将 `conditional_wait_for_int` 直接作用于上一小节的示例程序中，从而获得更简明的代码，那样将会有更好的示范效果。但在这里我只是懒惰所以放飞了一下。



### 小结

所以，上面我们提供的改进方案，能够很好地简化地、清晰化地运用 condition variable，你可以不必分散地申明一组相关变量（通常是 cv, m, ready 等三个以上的变量），而是收纳到一个单一的类中。

对于很多典型的 condition variable，我们提供的预制 `conditional_wait_for_bool`  和 `conditional_wait_for_int` 可能就足够用了。

你也能够非常轻易地利用 `conditional_wait` 做你的定制实现。

#### 关于 hicc-cxx

[hicc-cxx](https://github.com/hedzr/hicc) 是我的一个实验性项目，我会做不少重整、重建工作，并且借助于 GitHub Actions 进行一些跨平台的试验。如果一个实现、封装或者实用工具达到了足够稳定的程度，通常我会在未来一段时间内将其迁移到 cmdr-cxx 中。

所以我不鼓励你直接使用 hicc，虽然这么做也是行得通的。你应该取用 cmdr-cxx 中的相对应的 stable 版本。如果你未能在 cmdr-cxx 中发现期待的目标，issue 我或者自行抽取都可以。

## 结束

### 基本可锁定

除了 `std::condition_variable` 之外，还有一个条件变量类：`std::condition_variable_any`。它和前者的区别在于：前者被要求和 `std::unique_lock<std::mutex>` 联合使用，不可以换用其他手段，而后者则可以在任何满足[*基本可锁定* *(BasicLockable)* ](https://zh.cppreference.com/w/cpp/named_req/BasicLockable)要求的锁上工作。也就是说，你可以使用更广泛的其他锁定手段。

所以，什么是基本可锁定呢？

所谓的 [BasicLockable](https://zh.cppreference.com/w/cpp/named_req/BasicLockable) 是一种约定。它要求你的类必须实现 lock() 和 unlock() 两个函数。

除了标准库提供的 std::mutex 系列类之外，你可以设计实现自定义类并通过提供 lock/unlock 函数的方式来满足约定。

这么做有何用处？你的类将能够被用来 `std::condition_variable_any` 中，或者其他要求 `BasicLockable` 的场所，例如` std::lock_guard`：

```c++
class L {
public:
    L() {}
    virtual ~L() {}
    void lock() {}
    void unlock() {}
};

void test() {
    {
        L l;
        std::lock_guard<L> lk(l);
    }
}
```

对于做并发同步类库的朋友来说，它将会是一个有力的能力。

注意到我们的定制类 L 并没有任何派生类，没有任何合约声明，直接就能满足 std::lock_guard 的使用需要。这一点，Java 是做不到的，与其等价的能力是 Golang 的 interface，同样是提供了一种解耦的、满足合约的类库实现方法。在 C++ 的模板元编程中，很多时候这是一种被称为 Policy 的技法。

> duck type 解耦并不是 Policy 专有提供的能力，它是由模板技术提供的基础能力，不过，policy 范式往往将这一特点呈现的最好。

下一篇文章将会对此做进一步的延伸，尽情期待。





:end:

这里是真的 END
