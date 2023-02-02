---
layout: single
title: "cxx17 thread pool"
date: 2022-08-08 05:00:00 +0800
last_modified_at: 2022-08-08 06:23:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,async,future,packaged_task,thread pool]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210716153922781.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  捞出两年多的旧文，把线程池拿来叙叙...
---



> 2021 0724: 
>
> 2021 0824: 
>
> 2021 0901:
>
> 这是遗忘了很久的一篇，一直没有发出来。
>
> 今天我的 RSS 表里面出现了一篇写 C++11 线程池的，使得我觉得要清理一下，就找出来，重写了一遍，发了。
>
> 说是重写，其实八成都是去年的想法，也不打算梳理自己这方面的思考了，就这么着吧——回头审视自己以前的（我私人的电脑里还有很多年前我的旧网站的截图）页面，文字什么的，感觉也很有意思。 
>
> 2022 0808:
>
> 拖了很久（算起来竟然有两三年了），最终还是决定把线程池这篇发出来了。
>
> 一直不想发的原因是，这个科目其实没什么个人创见，大抵就是综合综合再综合。
>
> 但是放在 _draft 里面着实碍眼，又觉得丢弃了很不环保。那就发出来吧，拉低水准有何不可。



## 提前的话

几近三年疫情以来，没有健康码，没有核酸检测过，没有打疫苗过，没被隔离过，没有时空重叠过，没有弹窗过，没有被封小区过的人，该是多么完美干净的一个人啊。

一夜难眠之后，

听我说，从弹窗人士回归绿色，人是一定会成长的。

听我说，是男人也无所谓，此时此刻绿了就绿了。

## 缘起

基本上说，这次介绍的线程池（Thread Pool）是面向 C++17 的，但是下降到 C++11 也没有什么不可逾越的新设施。

这个实现是受到一个外部实现的激发（应该是源于某几个相关的 Stackoverflow posts），而后做出来用了段时间感觉不错，并且进行了各种修补后形成的最终版本。~~然后现在是在 [hicc-cxx](https:://github.com/hedzr/hicc) 中发酵，这是一个目标为实验性的项目，而稳定后的版本则会移入到 [cmdr-cxx](https://github.com/hedzr/cmdr-cxx) 中~~。现在可以直接在 [cmdr-cxx](https://github.com/hedzr/cmdr-cxx) 中取用它。

[cmdr-cxx](https://github.com/hedzr/cmdr-cxx) 是一个核心上提供命令行参数解析的基本库，同时也提供一个层级型的配置参数管理器，从而非常适合被用作一个 CLI 项目的基本构架。除了对其进行例行维护之外，目前我是在将一些项目开发所需的基础设施填充到 cmdr-cxx 中，例如包装过的 path/filesystem，process，mmap 等等，当然还有 thread_pool 等。这些设施的共性是跨平台（至少是 darwin/linux/windows），所以这是个有用处的 repo。





## 基本知识

- [launch](https://en.cppreference.com/w/cpp/thread/launch)：包括 `std::launch::async` 和 `std::launch::deferred` 两个枚举值
- [std::thread](https://en.cppreference.com/w/cpp/thread/thread)：执行一个线程
- [async](https://en.cppreference.com/w/cpp/thread/async)：异步运行给定的函数 f
- [future](https://en.cppreference.com/w/cpp/thread/future)：用于访问异步函数 f 的返回值
- [packaged_task](https://en.cppreference.com/w/cpp/thread/packaged_task)：用于包装一个 [*Callable*](https://en.cppreference.com/w/cpp/named_req/Callable) 对象
- [promise](https://en.cppreference.com/w/cpp/thread/promise)：我不怎么喜爱用
- threaded message queue
- thread pool

从 C++11 起，标准库提供了一组线程方面的跨平台原语，包括 [std::thread](https://en.cppreference.com/w/cpp/thread/thread)，[async](https://en.cppreference.com/w/cpp/thread/async)，[launch](https://en.cppreference.com/w/cpp/thread/launch)，[future](https://en.cppreference.com/w/cpp/thread/future)，[packaged_task](https://en.cppreference.com/w/cpp/thread/packaged_task)，[promise](https://en.cppreference.com/w/cpp/thread/promise) 等等。完整的列表可以在 [这里](https://en.cppreference.com/w/cpp/header/future) 查询。

下面对其中的主要原语作一个概要的介绍。

### std::thread

thread 的概念很容易理解。你可以启动一个线程，然后 join 它以便等待其执行结束。

```cpp
#include <iostream>
#include <cmath>
#include <thread>
#include <future>
#include <functional>

void task_thread()
{
    std::packaged_task<int(int,int)> task(f);
    std::future<int> result = task.get_future();
 
    std::thread task_td(std::move(task), 2, 10);
    task_td.join();
 
    std::cout << "task_thread:\t" << result.get() << '\n';
}
 
int main()
{
    task_thread();
}
```





### [packaged_task](https://en.cppreference.com/w/cpp/thread/packaged_task) 和 [future](https://en.cppreference.com/w/cpp/thread/future)

参见上一节的代码示例。

packaged_task 采用 std::function 的模板塑形技术，让你可以将函数签名规范化。例如 `std::packaged_task<int(int,int)> task(f)` 声明了一个异步函数对象 `task`，它要求你给出的 `f` 必须满足函数签名 `int(int,int)`。

以后，你可以借助 std::thread 的完美转发能力将异步函数 f 所需的入参传入。例如 `std::thread task_td(std::move(task), 2, 10);`

为了访问异步函数 f 的返回值（一个 `int`），我们需要 future 的包装：`std::future<int> result = task.get_future();`。当 `task_td.join()` 返回控制权时，f 执行结束了，所以返回值也就可用了，所以现在使用 `result.get()` 可以提取到返回值。



### async 

async 是 std::thread 的升级版。它允许提供 launch 枚举入参，所以能够控制异步启动的方式（新线程，或是当前线程中延后执行）。

一般来说，你只需要声明一个静态成员函数，将它交给 async 就可以了，如同这样：

```cpp
auto a1 = std::async(&X::foo, &x, 42, "Hello");
```

一个完整的示例如下，

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
#include <future>
#include <string>
#include <mutex>
 
std::mutex m;

struct X {
    void foo(int i, const std::string& str) {
        std::lock_guard<std::mutex> lk(m);
        std::cout << str << ' ' << i << '\n';
    }
    void bar(const std::string& str) {
        std::lock_guard<std::mutex> lk(m);
        std::cout << str << '\n';
    }
    int operator()(int i) {
        std::lock_guard<std::mutex> lk(m);
        std::cout << i << '\n';
        return i + 10;
    }
};
 
template <typename RandomIt>
int parallel_sum(RandomIt beg, RandomIt end)
{
    auto len = end - beg;
    if (len < 1000)
        return std::accumulate(beg, end, 0);
 
    RandomIt mid = beg + len/2;
    auto handle = std::async(std::launch::async,
                             parallel_sum<RandomIt>, mid, end);
    (void)handle;
    int sum = parallel_sum(beg, mid);
    return sum + handle.get();
}

int main()
{
    std::vector<int> v(10000, 1);
    std::cout << "The sum is " << parallel_sum(v.begin(), v.end()) << '\n';
 
    X x;
    // Calls (&x)->foo(42, "Hello") with default policy:
    // may print "Hello 42" concurrently or defer execution
    auto a1 = std::async(&X::foo, &x, 42, "Hello");
    // Calls x.bar("world!") with deferred policy
    // prints "world!" when a2.get() or a2.wait() is called
    auto a2 = std::async(std::launch::deferred, &X::bar, x, "world!");
    // Calls X()(43); with async policy
    // prints "43" concurrently
    auto a3 = std::async(std::launch::async, X(), 43);
    a2.wait();                     // prints "world!"
    std::cout << a3.get() << '\n'; // prints "53"
} // if a1 is not done at this point, destructor of a1 prints "Hello 42" here
```

async 实际上是将 std::thread 的使用方法改造了下。



### 小小结

有了 async，packaged_task，future 的基本概念，下面可以介绍我们最终的线程池代码了。




## 主要实现

> 下文中为示意性的代码展示，如欲查看在运行的真实代码，请前往 cmdr-cxx 中检视 cmdr-pool.hh 文件。

一个线程池 `thread_pool` 包含两个主要接口：将异步函数放入池中，以及调度其进入运行态。

我们将要实现的线程池的用意在于在 CPU 占用率上进行控制和平衡，既要尽可能充分利用 CPU 算力，又不要无谓地消耗额外资源在线程的上下文切换上。所以我们建立 CPU 核心数相同的 workers，然后将任务不断地送给这些 workers 以便调度执行，从而达到预期的目的。



### `queue_task`

`queue_task` 的关键代码是这样：

```cpp
template<class F, class R = std::result_of_t<F &()>>
std::future<R> queue_task(F &&task) {
    auto p = std::packaged_task<R()>(std::forward<F>(task));
    // std::packaged_task<R()> p(std::move(task));
    auto r = p.get_future();
    // _tasks.push_back(std::move(p));
    _tasks.emplace_back(std::move(p));
    pool_debug("queue_task.");
    std::this_thread::yield();
    return r;
}
```

借助于 std::function 的配套工具 std::result_of_t 我们能够将异步函数的返回值类型抽出来，这在元编程中是一个关键性工具。

然后就乏善可陈了，无非是建立 packaged_task 对象及其 future 对象，然后放入成员变量 `_tasks` 中。

`std::this_thread::yield()` 的目的在于发出一个信号，令当前线程（正在添加任务到线程池中的线程）暂时休眠一下，释放出 CPU 控制。这样可以让其他线程有机会被调度运行。在我们添加任务到线程池的过程中，这么打断一下，潜在的用意是让刚刚被放入的任务能够有机会被调度执行（只要线程池还比较空闲）。

但是也并不是一定非要执行不可。在这里并没有硬性的约定，这个调用是懒散式的：就是说，喂，要是得空的话，就 run 一下呗。



### `start_thread`

`start_thread` 在 `thread_pool` 构造函数中被启动。

它的任务是负责核心的调度算法。

我们的线程池有一个运行任务阈值 N，你可以通过 `cmdr::pool::thread_pool(int n = 1)` 来传入该阈值，其默认值为 CPU 的核心数量。如果你在多 CPU 环境中使用，那么你可能会需要显式指定 N 以便获得更多并行任务管线。

`start_thread` 会一次性启动 N 个线程，每个线程都试图从 _tasks 中取得一个任务，并将该任务调度运行。这就达到了线程池约束并行任务数的目的。

> 所以这个线程池是不能动态修改阈值 N 的。

只要我们解决了同步、竞争、锁的最小化等几个相关问题，这个线程池就可用了。

当前的骨干代码是这样的：

```cpp
void start_thread(std::size_t n = 1) {
  while (n-- > 0) {
    _threads.push_back(
      std::async(std::launch::async, [&] {
        cw_setter cws(_future_ended);
        while (auto task = _tasks.pop_front()) {
          pool_debug("got_task.");
          ++_active;
          try {
            (*task)();
          } catch (...) {
            --_active;
            throw;
          }
          --_active;
        }
      }));
  }
}
```

`cw_setter` 是一个条件变量的包装类，利用 RAII 来设定 `_future_ended`，该标志跟踪线程池中的每个工作线程的结束状态。全部工作线程都退出的时候，就表示着 `thread_pool` 已经 shutdown 完毕了。

`_active` 是原子的，无需担心其竞态问题。

`_threads` 是工作线程的容器。

`_tasks` 是待调度任务的容器。它是一个由包装类 `threaded_message_queue` 负责管理的数组，默认时使用底层容器 `std::deque`，但我们尚未提供修改底层容器类的终端模板参数入口。

```cpp
std::vector<std::future<void>> _threads{};                           // fixed, running pool
mutable threaded_message_queue<std::packaged_task<void()>> _tasks{}; // the futures
```

包装类 `threaded_message_queue` 解决了并行环境中队列的竞态问题，如果感兴趣可以前去源码中查看。

> 完整的源码在 GitHub 中可以找到。

`auto task = _tasks.pop_front()` 以原子的方式从队尾取出一个 task，然后执行该任务，然后再度尝试出列 _tasks。这个过程会在调用 pop_front 时阻塞，从而释放 CPU 控制权。





### 队列化任务流

由于  `threaded_message_queue` 具有队列的编程接口，所以 `thread_pool` 是不断从队列中取用，同时队列也不断缩减的。

这是我们的 `thread_pool` 的关键用法。

你将会不断地压入新任务，这些任务最终会被调度运行，然后被丢弃。

了解上述事实非常重要。



### 小小结

是否可以采用别的调度方案？

当然可以。

这是你的任务了。



## 结束

完整的源码在 GitHub 中可以找到。我们已经提到过，这些代码都会在 [hicc-cxx](https://github.com/hedzr/hicc) 中发酵，稳定之后即迁移到 [cmdr-cxx](https://github.com/hedzr/cmdr-cxx) 中。

所以尽管文章一直没有发，但是代码是早已发布了。

如果你愿意在自己的项目中以 [cmdr-cxx](https://github.com/hedzr/cmdr-cxx) 提供的命令行参数处理（类似于 getopt）以及层级化配置选项管理器为基础框架的话，那么你也可以使用到那些已经发酵的工具类，例如 mmap，thread_pool 等等。





:end:

