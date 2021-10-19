---
layout: single
title: "谈 C++17 里的 Observer 模式 - 补"
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
  关于观察者模式上一 POST 的补充与改进，...
---



> 上一回的  [谈 C++17 里的 Observer 模式](https://hedzr.com/c++/algorithm/cxx17-observer-pattern/) 还是有点慌张，所以需要补充完善一下下

## Observer Pattern - Part II



### 多种 event (types) 问题

我们已经解释过，如果你需要很多不同的 event 对象，那么你应该扩展 event 结构成员：

```cpp
struct event {
  enum EventType type;
  ... // extras body
};
```

这就好像设计一份通讯协议一般的做法，当然，后面的 body 部分应该是相对一致的数据类型才比较好，或者，采用 union 的解决方案。

进一步地，如果你的事件族非常庞大复杂，你可以采用派生类体系的方案：

```cpp
struct event {
  enum EventType type;
  ... // extras body
};

struct mouse_move_event : public event {
  int x, y;
  int modifiers;
};

struct kb_event : public event {
  int key_code, scan_code;
  int modifiers;
  bool pressed_or_released_or_holding;
};

// ...
store.emit(mouse_move_event{});
```

放心，我们的 observable 具有足够的容纳能力。



### 在观察者中修改被观察者

**请不要那么做**。

这不是观察者模式原本要承担的责任。因此我们根本就不会 emit observable 本身，也正因如此正常情况下你并不能修改它——除非你用*不道德*的手段持有了一个被观察者的实例参考，但这样做真的是太坏了：用观察者模式就是为了解耦的，你拿住目标的引用参考你礼貌吗。

如果你真的想这么做，也不是不行，但你需要自行 async 一下。c++ 的 async 关键字提供了一种简便的异步能力（其实就是隐含了一个新线程而已）。在异步的上下文中修改被观察者，你知道修改被观察者本身可能会触发新的事件，所以异步的目的在于防止事件观察的无限循环与死锁。

如果某个事件的被观察是无副作用的，那么也可以直接做修改操作。这种情况在 DOS 时代叫做可重入的中断程序。对的，那时候的中断程序实际上就是一种观察者模式，只不过它是以汇编语言的形式组织的。



### 生命周期问题

采用 weak_ptr 保证了即使 observer 被提前释放，也不会影响到 observable 的 emit 动作。反过来呢，observable 如果提前释放了，则毫无任何可能的副作用。



### 动态修改观察者链问题 - 改进后的新版本

上一版中的 observable 实现没有做锁定，因此若是在多线程环境动态修改观察者链且发生 emit 时，会有竞态问题。

因此针对这种可能，我们提供改进之后的、可托管的版本实现：

```cpp
namespace hicc::util {

  template<typename S>
  class observer {
    public:
    virtual ~observer() {}
    using subject_t = S;
    virtual void observe(subject_t const &e) = 0;
  };

  /**
   * @brief 
   * @tparam S 
   * @tparam Observer 
   * @tparam AutoLock  thread-safe even if modifying observers chain dynamically
   * @tparam CNS       use Copy-and-Swap to shorten locking time.
   */
  template<typename S, bool AutoLock = false, bool CNS = true, typename Observer = observer<S>>
  class observable {
    public:
    virtual ~observable() { clear(); }
    using subject_t = S;
    using observer_t_nacked = Observer;
    using observer_t = std::weak_ptr<observer_t_nacked>;
    using observer_t_shared = std::shared_ptr<observer_t_nacked>;
    observable &add_observer(observer_t const &o) {
      if (AutoLock) {
        if (CNS) {
          auto copy = _observers;
          copy.push_back(o);
          std::lock_guard _l(_m);
          _observers.swap(copy);
        } else {
          std::lock_guard _l(_m);
          _observers.push_back(o);
        }
      } else
        _observers.push_back(o);
      return (*this);
    }
    observable &add_observer(observer_t_shared &o) {
      observer_t wp = o;
      if (AutoLock) {
        if (CNS) {
          auto copy = _observers;
          copy.push_back(wp);
          std::lock_guard _l(_m);
          _observers.swap(copy);
        } else {
          std::lock_guard _l(_m);
          _observers.push_back(wp);
        }
      } else
        _observers.push_back(wp);
      return (*this);
    }
    observable &remove_observer(observer_t_shared &o) { return remove_observer(o.get()); }
    observable &remove_observer(observer_t_nacked *o) {
      if (AutoLock) {
        if (CNS) {
          auto copy = _observers;
          copy.erase(std::remove_if(copy.begin(), copy.end(), [o](observer_t const &rhs) {
            if (auto spt = rhs.lock())
              return spt.get() == o;
            return false;
          }),
                     copy.end());
          std::lock_guard _l(_m);
          _observers.swap(copy);
        } else {
          std::lock_guard _l(_m);
          _observers.erase(std::remove_if(_observers.begin(), _observers.end(), [o](observer_t const &rhs) {
            if (auto spt = rhs.lock())
              return spt.get() == o;
            return false;
          }),
                           _observers.end());
        }
      } else
        _observers.erase(std::remove_if(_observers.begin(), _observers.end(), [o](observer_t const &rhs) {
          if (auto spt = rhs.lock())
            return spt.get() == o;
          return false;
        }),
                         _observers.end());
      return (*this);
    }
    friend observable &operator+(observable &lhs, observer_t_shared &o) { return lhs.add_observer(o); }
    friend observable &operator+(observable &lhs, observer_t const &o) { return lhs.add_observer(o); }
    friend observable &operator-(observable &lhs, observer_t_shared &o) { return lhs.remove_observer(o); }
    friend observable &operator-(observable &lhs, observer_t_nacked *o) { return lhs.remove_observer(o); }
    observable &operator+=(observer_t_shared &o) { return add_observer(o); }
    observable &operator+=(observer_t const &o) { return add_observer(o); }
    observable &operator-=(observer_t_shared &o) { return remove_observer(o); }
    observable &operator-=(observer_t_nacked *o) { return remove_observer(o); }

    public:
    /**
         * @brief fire an event along the observers chain.
         * @param event_or_subject 
         */
    void emit(subject_t const &event_or_subject) {
      if (AutoLock) {
        std::lock_guard _l(_m);
        for (auto const &wp : _observers)
          if (auto spt = wp.lock())
            spt->observe(event_or_subject);
      } else {
        for (auto const &wp : _observers)
          if (auto spt = wp.lock())
            spt->observe(event_or_subject);
      }
    }

    private:
    void clear() {
      if (AutoLock) {
        std::lock_guard _l(_m);
        _observers.clear();
      }
    }

    private:
    std::vector<observer_t> _observers{};
    std::mutex _m{};
  };

} // namespace hicc::util
```

如果你知道观察者不多，例如不过数个乃至数百个，那么可以使用默认的 CNS = true 的算法。这是一种先复制再交换（Copy-and-Swap）的方法，用一定的内存代价来换取更短的加锁时间。但如果你会有成千上百万的观察者（真的会吗？），请不要这么做，使用 CNS - false 的工作模态，这不必消耗额外的内存，只不过锁定的时间可能相对略长。

此外，启用了加锁特性的 observable 不能解决 emit 过程中的长时间锁定问题，尤其是要注意若是某个观察者太坏，则副作用会影响到整个 emit 乃至父级调用者。

#### 辅助 RAII 类

为了帮助你临时注册观察者，这里也提供一个支持 RAII 特性的辅助类：

```cpp
namespace hicc::util {

  template<typename S, bool AutoLock = false, bool CNS = true, typename Observer = observer<S>>
  struct registerer {
    using _Observable = observable<S, AutoLock, CNS, Observer>;
    _Observable &_observable;
    typename _Observable::observer_t_shared &_observer;
    registerer(_Observable &observable, typename _Observable::observer_t_shared &observer)
      : _observable(observable)
        , _observer(observer) {
        _observable += _observer;
      }
    ~registerer() {
      _observable -= _observer;
    }
  };

} // namespace hicc::util
```

#### 新的测试代码

所以测试代码也有所调整：

```cpp
namespace hicc::dp::observer::basic {

  struct event {};

  class Store : public hicc::util::observable<event, true> {};

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

  {hicc::util::registerer<event, true> __r(store, c);
  store.emit(event{});}
}
```





## 后记

这次补充之后，总算是看得过去了，也稍微具有了点实用价值。

不过还存在一些遗憾，它们的一部分不应该由 observable observer pattern 负责解决，另一部分呢要留待其它解决思路去完成（例如 Rx 类似的异步手段）。

另外，使用一个 observer 类有时候可能太傻了。这也是为什么会有新的声音发出来说不要有 observer。这个问题不算困难，只是风格不同。但今天没力量完成了，下次看看是不是有兴趣弄的话大概就不得不再次补充了。

也或许不。





:end:

