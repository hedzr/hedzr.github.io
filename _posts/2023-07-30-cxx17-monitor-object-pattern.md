---

layout: single
title: 'C++17 Monitor Object 模式'
date: 2023-7-30 05:00:00 +0800
last_modified_at: 2023-8-11 09:15:00 +0800
Author: hedzr
tags: [c++, monitor]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20230811092120144.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  以 C++17 方式实现监视器对象模式，同时讨论管程模型，也讨论 Java synchronized 关键字 ...
---

> 监视器对象模式（Monitor Object Pattern）是一种并发编程领域的设计模式。它的理论基础来自于监视器（Monitors）模型，即管程（Monitors）。
>



Monitor Object 能够保证在对象内部任意时刻只能运行一个方法，使线程可以获得对共享资源的独占访问，防止多个线程同时访问它。当线程想要访问共享资源时，它必须先获得监视器对象上的锁。如果锁已经被另一个线程持有，则请求线程将被阻塞，直到锁被释放。



监视器（Monitors）模型是并发编程中的一种概念，由 [东尼·霍尔](https://zh.wikipedia.org/wiki/東尼·霍爾) 与 [泊·派克·汉森](https://zh.wikipedia.org/wiki/泊·派克·漢森) 提出的，并由泊·派克·汉森首次在并行Pascal中实现。当时（约1972）监视器模型的扩展体也被用在单操作系统环境中为进程间通信提供支持。

同时，监视器模型，多被称作管程，又是操作系统中的一种基础结构和概念。一个现代化的操作系统，一定支持线程（POSIX级别或专有类型）和管程（管程首先需要线程的存在），这是多任务操作系统的本职工作。同时它与现代 PL 的发展也相互交融：现代 PL 多半需要线程（或其等价物）和并发编程等特性作为基础设施之一。无法想象一种现代的高级编程语言在不具备这些特性的前提下向它的用户，即程序员，提供编程接口，而且还能流行起来——除非它将这些特性包装为更高层的编程接口。



### 表述

监视器模型实现了对共享资源的互斥访问，这个模型包含了：

- 多个彼此可以交互并共享资源的线程
- 多个与资源使用有关的变量
- 一个互斥锁
- 一个用来避免竞态条件的不变量

一个管程的程序在执行一个线程前会先获取互斥锁，直到完成线程或是线程等待某个条件被满足才会放弃互斥锁。若每个执行中的线程在放弃互斥锁之前都能保证不变量成立，则所有线程皆不会导致竞态条件成立。

> 在表述部分的定义比较官方，它来自于 Wiki 中译文。
>
> - [Monitor (synchronization) - Wikipedia](https://en.wikipedia.org/wiki/Monitor_(synchronization))
> - [Concurrency pattern - Wikipedia](https://en.wikipedia.org/wiki/Concurrency_pattern)

用图示来看它：

![image-20230811092120144](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20230811092120144.png)



### 在 Java 中认识管程

Java 中可以使用内置关键字 `synchronized` 直接获得管程支持，带有该关键字标记的成员函数或者代码块将会构成互斥性的区域，使得访问 this object 的成员变量是线程安全的。注意到 Java 从语言层面就预设了 object.wait() 和 object.notify() 支持，所以 `synchronized` 区块实际上是隐含了 lock wait unlock notify 原语。

```java
class Bank {

   private int[] accounts;
   Logger logger;

   public Bank(int accountNum, int baseAmount, Logger logger) {
       this.logger = logger;
       accounts = new int[accountNum];
       Arrays.fill(accounts, baseAmount);
   }

   public synchronized void transfer(int accountA, int accountB, int amount) {
       if (accounts[accountA] >= amount) {
           accounts[accountB] += amount;
           accounts[accountA] -= amount;
           logger.info("Transferred from account :" + accountA + " to account :" + accountB + " , amount :" + amount + " . balance :" + getBalance());
       }
   }

   private synchronized int getBalance() {
       int balance = 0;
       for (int account : accounts) {
           balance += account;
       }
       return balance;
   }
}
```

在示例里，transfer() 是一个线程安全的函数，调用它实现账户间的转账是线程安全的（挑战是当应用被分布式部署时）。

类似地，getBalance() 也是线程安全的。也就是说，任意多线程同时调用 transfer/getBalance 时，只会有一个线程成功 lock 并获得排他性的资源读写权利，其它线程只能在请求 lock 的位置 wait。被授权线程执行完它的 transfer/getBalance 函数体，通过隐含调用 unlock() 释放所有权，此时所有 waiting 的线程获得一个竞争的机会，其中随机的某个等待线程将被选中获得所有权。如是反复。

这个示例没有展示代码块被 synchronized 的场景，但效果是相似的。

#### 小结

我们并不讨论 Java 的全部同步原语和特性，以及 Java 面向 concurrence 方面的各种支持，例如偏向锁、轻量锁、JUC 等等。它们与本文的主题关系不大——但也要看到并发编程中的一个核心模式与原语就是 Monitor 模式——所以多少也会有点关系，无外乎是取舍：

是粗暴地一锁了之、还是能在各种粒度级别下可控地锁定资料和让某个请求者获得资源的 R/W 权利。

synchronized 是粗暴锁定的典范，通常它锁定 this 对象实例。但你可以使用 `synchronized(this.lockForMap)` 这样的方式来锁定较小粒度级别的专用锁具（例如为 this 中的所有 maps 提供一个专用锁具 this.lockForMap 以获得更细腻一点的锁范围）。另外，它不可能 notifyAll，只能从等待队列中挑选一个予以唤醒。

synchronized 可以被视作为 object.lock. unlock, wait, notify 的包装后的语法糖。下面会以 C++ 的方式来讨论起替代实现样例。值得注意的是，C++ 当然具有各种各样、各种粒度的锁与同步能力，但还是那句话，本文限定于 Monitor Pattern/Monitor Object Pattern 中来讨论问题。

最后，应该注意到的是，Java 以 sychronized 为代表的监视器模式是比较重的一种实现。尽管历年来 Java 对其实现做了诸多升级来降低其负载，并试图准许更随机地唤醒等待队列中的某个成员，但包装好的东西那就意味着你的操控能力和自由度会更低。



### 以 C++ 的方式认识管程

通过 Java 实例其实应该能够对其有充分的理解了，但我们当然需要从更底层一点的角度来分解管程的实现方式，也从不同角度重新来认识它。

对于官样的表述亦可换一个不那么抽象的说法，即管程仿佛一个实体。不妨将其视为一个类，类的成员即为受保护的资源。那么这个类应该包含一个 mutex 和一个条件变量。mutex 用于互斥访问关键资源，条件变量则用于通知其它的等待线程。

下面是一个轻量级的仿 Java synchronized 能力的 C++ 实现，需要你提供 C++11 编译器：

```c++
#include <iomanip>
#include <iostream>

#include <condition_variable>
#include <functional>
#include <mutex>
#include <queue>
#include <random>
#include <thread>

namespace A {
  class monitor_t {
  public:
    void lock() const { _monit_mutex.lock(); }
    void unlock() const { _monit_mutex.unlock(); }
    void notify_one() const noexcept { _monit_cond.notify_one(); }
    void notify_all() const noexcept { _monit_cond.notify_all(); }

#if (__cplusplus < 202002L) // c++20a, c++17 and lower

    template<typename Predicate>
    void wait(Predicate pred) const { // (10)
      std::unique_lock<std::mutex> monit_guard(_monit_mutex);
      _monit_cond.wait(monit_guard, pred);
    }

#else // c++20 or higher
    template<std::predicate Predicate>
    void wait(Predicate pred) const {
      std::unique_lock<std::mutex> monit_guard(_monit_mutex);
      _monit_cond.wait(monit_guard, pred);
    }
#endif

  private:
    mutable std::mutex _monit_mutex;
    mutable std::condition_variable _monit_cond;
  };

  template<typename T>
  class thread_safe_queue_t : public monitor_t {
  public:
    void add(T val) {
      lock();
      _my_queue.push(val);
      unlock();
      notify_one();
    }

    T get() {
      wait([this] { return !_my_queue.empty(); });
      lock();
      auto val = _my_queue.front();
      _my_queue.pop();
      unlock();
      return val;
    }

  private:
    std::queue<T> _my_queue;
  };

  class dice_t {
  public:
    int operator()() { return _rand(); }

  private:
    std::function<int()> _rand = std::bind(std::uniform_int_distribution<>(1, 6),
                                           std::default_random_engine());
  };
} // namespace A

void test_namespace_a() {
  std::cout << '\n';

  constexpr auto NumberThreads = 100;

  A::thread_safe_queue_t<int> safe_queue;

  auto add_lambda = [&safe_queue](int val) {
    safe_queue.add(val);
    std::cout << val << " " << std::this_thread::get_id() << "; ";
  };
  auto get_lambda = [&safe_queue] { safe_queue.get(); };

  std::vector<std::thread> add_threads(NumberThreads);
  A::dice_t dice;
  for (auto &thr : add_threads) thr = std::thread(add_lambda, dice());

  std::vector<std::thread> get_threads(NumberThreads);
  for (auto &thr : get_threads) thr = std::thread(get_lambda);

  for (auto &thr : add_threads) thr.join();
  for (auto &thr : get_threads) thr.join();

  std::cout << "\n\n";
}

int main() {
  std::cout << "Hello, World!" << '\n';
  test_namespace_a();
}
```

如上，我们在示例代码中提供了标准的借口：

- lock，unlock
- wait
- notify_one, notify_all

关键资源（`_my_queue`）的请求者可以简单地进行 `wait & lock..unlock & notify_one/all`，籍此来标记排他性代码块，如同 `thread_safe_queue_t.add` 所做的那样。这种请求者往往充当 Production..Consumer 模式中的生产者。

但 `add()` 没有前置 wait 调用，这是因为示例代码隐含地约定 add 只在初始化阶段被使用。为了在生产环境中杜绝这样的不可靠的预设前提，你应该使用标准的过程，即加上 wait 调用。

而其它的请求者（往往是 Production..Consumer 模式中的消费者）同样应该通过 `wait & lock..unlock & notify_one/all`。

示例代码中的 `thread_safe_queue_t.get` 演示来这一用法。类似地，示例代码中预设了 get 只会在初始化之后被使用、而且不讲究怎么唤醒另一线程，所以它没有采用结尾的 notify 函数。但正式场合中你需要完善调用序列，添加 notify 函数调用来唤醒任意一个/全部等待在条件变量处的线程以及关联的请求者们。

#### 小结

同样的，这是简略的解说。

但无论如何，关于 Monitor Object 的作用以及实际实现方式，我们应该已经列举明晰了。秉承我的一贯风格，虽然我总是讨论浅显的编程技术，但我不爱逐句讲解代码，你必须真正学会脑算和阅读代码，因为一个正常的程序员的代码书写总是伴随着完全彻底的脑算来执行的，他当然一边也在阅读自己正在书写的代码，所以这两个能力必须被不断训练，直到成为本能。

那么，C++ 方式完全展示了 Monitor Object 的实现原理。在这个基本的结构之上，还可以做各种各样的扩展、变形。这就留待实际需要的时候在自行衍生了。



### Conclusion

所以，线程安全（Thread-safe）是这么一种概念：即面对公共资源 CR，在多个线程中对其操作时，应该采取某种互斥的手段来保证 CR 不被同时读写。这是由于现代 CPU 的多核特性或者是堆叠 CPU 的主板都准许同时访问的可能，但如果有一个或者多个线程正在写入 CR，而其它线程尝试读取时，则会因为 CPU 流水线，CPU 时钟周期，总线时钟周期等多方面因素而导致读取失败，并且多个写入线程也会导致写入失败（或者违例，取决于 CPU 设计）。

故而线程安全技术是并发编程（Concurrence Programming）中的重要概念。

Monitor Object 正是这种场景下的一种惯用手段。事实上诸如生产者消费者模式，读写锁等与其也都有不同程度的相似性。理解 Monitor Object Pattern 将能有助于你更好的从事并发编程。

本文仅对其做了基础的探讨。如果希望了解基于此基础衍生的进阶变体，则可前往 Wikipedia 进行查询。

因为拖延，所以本文草草结束了，尚缺一个章节，即模板化的 Monitor 的实现。以后择机再补吧。



### References

- [Monitor (synchronization) - Wikipedia](https://en.wikipedia.org/wiki/Monitor_(synchronization))
- [Monitor Object – MC++ BLOG](https://www.modernescpp.com/index.php/monitor-oject/)
- [C++ Monitor Pattern - C++ Blog](https://cppguru.wordpress.com/2009/01/05/c-monitor-pattern/)