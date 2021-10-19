---
layout: single
title: "谈 C++17 里的 Singleton 模式"
date: 2021-09-03 05:00:00 +0800
last_modified_at: 2021-09-03 19:43:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,singleton pattern,design patterns,单件模式,设计模式]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210902103740865.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  回顾单件模式的各种可能的实现，尝试建立其 C++17 中的可能的最优解，...
---




## Singleton Pattern

回顾下单件模式，并考虑实现一个通用的单件模板类以达成业务端低代码的目标。

### Prologue

设计模式中最平民的 Pattern 是哪一个？几乎不会有任何分歧，那必须是单件模式了。所谓单件模式，是在 C 语言开发历史上经历了各种各样的全局变量失控的折磨后发展起来的一种技术，得益于 C++ 的封装能力，我们可以将各种各样的全局变量管控在一个全局静态类（或者说一个类中全都是静态变量的实现方式）中，从而防止任意放置全局变量带来的灾难性的后果。

我不必在此重复这些后果能有多糟，因为本文不是入门教材，而是实作经验的一个梳理而已。

很明显，静态类只不过是开始，它不是特别好的解决手段，因为除了能够集中在一处这一优点之外，这些静态变量还是是予取予求的，此外，早期（C++11以前）的编译器没有明确和统一的静态变量初始化顺序约定，所以你较难处理这些变量的初始化时机，再一个问题是，没有任何手段能够让你实现这些变量的懒加载（lazyinit），除非你将它们统统变成指针，那样的话，还会搞出多少事来只有天知道了。



### 理论基础

Singleton 模式是 [Creational Patterns](https://en.wikipedia.org/wiki/Creational_pattern) 中的一种。在  [谈 C++17 里的 Factory 模式](https://hedzr.com/c++/algorithm/cxx17-factory-pattern/) 中，我们已经介绍过创建型模式了，所以本文不再赘述了。

单件模式的意图，及其基本实现，都是非常简单的，因而也不必耗费笔墨凑字数，直接略过。



### Goal

我们想要的是一个能够 lazyinit 或者能够控制起初始化时机的、线程安全的单件模式。 

所以下面会介绍 C++11（包括 C++0x）以来的若干能够实际运用的 Singleton 实现方案，但略过了更早期的实现手法，以及略过了那些顾头不顾尾的示例性实现。嗯，其中一个是这样的：

```c++
class singleton {
  static singleton* _ptr;
  singleton() {}
  public:
  singleton* get() {
    if (_ptr == NULL)
      _ptr = new singleton();
    return _ptr;
  }
};
```

这个实现最为亲民，因为任何人无需任何知识（还是需要会c++的）也能一次性手写成功，甚至不必担心手误或者其它什么编译错误。它的弱点，较为明显的就先不提了，有时候会被展示者有意无意忽略或者掩盖的一个重要弱点是，`_ptr` 是不会被 delete 的：但使用者会说服自己说我的程序就这么一个指针泄漏，这个代价是付得起的。

可怕吗？或许也不。这就是真的。

讲究一点的家伙，知道 C 提供了一种 atexit 的手段，所以会设法挂载一个退出时的 delete 例程，但还是不能解决在 `if(_ptr==null)` 这里可能发生的跨线程 data racing 问题。问题在于，一个 C++er 你搞个 C 技法在里面，那它也很不纯洁的不是？

所以，下面正文开始了。



### Meyers' Singleton in C++

Scott Meyers 是 Effective C++系列的作者，他最早提供了简洁版本的 Singletion 模型：

```c++
static Singleton& instance() {
  static Singleton instance;
  return instance;
}
```

> "This approach is founded on C++'s guarantee that local static objects are initialized when the object's definition is first encountered during a call to that function." ... "As a bonus, if you never call a function emulating a non-local static object, you never incur the cost of constructing and destructing the object."
>
> —— Scott Meyers

Singleton 模式已经流传了多年，有很多不同目的的实现方法，但 Meyers 的版本是最为精炼且满足线程安全的，它是完全实用化的。

#### Backstage

编译器对函数中的静态变量采用了符合 [C++11 Initialization](https://en.cppreference.com/w/cpp/language/initialization#Dynamic_initialization) 特性的初始化和析构绑定，以确保该静态变量将能够在满足 thread-safe 的前提下唯一地被构造和析构。关于确保静态变量初始化和析构的线程安全被细分为多种类型，C++11 保证来有序性，而 C++17 起又支持 *Partially-ordered dynamic initialization* 。当然这么细节的技术规范不必去抠了，就上面的 `instance()` 中的 instance 变量来说，实际上编译器为此会引入一个隐藏变量来帮助识别初始化与否：

```c++
static bool __guard = false;
static char __storage[sizeof(Singleton)]; // also align it

Singleton& Instance() {
  if (!__guard ) {
    __guard = true;
    new (__storage) Singleton();
  }
  return *reinterpret_cast<Singleton*>(__storage);
}

// called automatically when the process exits
void __destruct() {
  if (__guard)
    reinterpret_cast<Singleton*>(__storage)->~Singleton();
}
```

由于优化的存在，因此编译器常常省略 `__guard`，直接使用 instance 静态变量，因为该变量在汇编中就是一个指针表示，以非零来代表其 bool 状态即可。因此，以 x86-64 clang 9 为例，Meyers 单例生成的汇编代码如下（[godbolt](https://gcc.godbolt.org/z/fvbr31s76)）：

```
singleton_t::instance():            # @singleton_t::instance()
        push    rbp
        mov     rbp, rsp
        sub     rsp, 16
        cmp     byte ptr [guard variable for singleton_t::instance()::instance], 0
        jne     .LBB1_4
        movabs  rdi, offset guard variable for singleton_t::instance()::instance
        call    __cxa_guard_acquire
        cmp     eax, 0
        je      .LBB1_4
        mov     edi, offset singleton_t::instance()::instance
        call    singleton_t::singleton_t() [base object constructor]
        jmp     .LBB1_3
.LBB1_3:
        movabs  rax, offset singleton_t::~singleton_t() [base object destructor]
        mov     rdi, rax
        movabs  rsi, offset singleton_t::instance()::instance
        movabs  rdx, offset __dso_handle
        call    __cxa_atexit
        movabs  rdi, offset guard variable for singleton_t::instance()::instance
        mov     dword ptr [rbp - 16], eax # 4-byte Spill
        call    __cxa_guard_release
.LBB1_4:
        movabs  rax, offset singleton_t::instance()::instance
        add     rsp, 16
        pop     rbp
        ret
```

请注意 `__cxa_guard_acquire` 直接对 instance 起作用，`__cxa_guard_release` 亦是如此。

#### Source Code

一个完整的、采用 C++11 的 Mayers' Singleton Pattern 实现是这样的：

```c++
#include <stdio.h>

struct singleton_t {
  static
  singleton_t &instance() {
    static singleton_t instance;
    return instance;
  } // instance

  singleton_t(const singleton_t &) = delete;
  singleton_t & operator = (const singleton_t &) = delete;

private:
  singleton_t() {}
  ~singleton_t() {}

public:
  void out(){ printf("out\n"); }
}; // struct singleton_t

int main() {
    singleton_t::instance().out();
    return 0;
}
```

基本上说，你复制它，改个类名，就可以开始了。这是大多数 class GlobalVar 的做法。



### 更多实现方法参考

关于 C++ Singleton Pattern 的更多讨论见诸 [于此](https://stackoverflow.com/questions/1008019/c-singleton-design-pattern)。

至于说那些弄 double-check 还是别的什么的，都是渣渣。因为 C++11 以来 Singleton 的线程安全问题已经无需额外的编码考虑了。





### 模板化实现

Mayers 的版本很完美、而且简练简明，但是有一个问题，那个单一的实例总是在 main() 开始之前被初始化的，我们无法做到 lazyinit。

lazyinit 有什么用呢？

如果我们打算维持若干单件类，并且它们中很多的 ctor() 还比较有代价，那么 lazyinit 可以降低启动时间，并且能够避免运行时从未用到的那些单件类永远也不必被构造出一个实例。

这就需要将 static instance 改为一个 unique_ptr 了。

#### 标准实现

在 [hicc-cxx](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fhedzr%2Fhicc)/[cmdr-cxx](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fhedzr.cmdr-cxx) 中，我们提供了模板化的 `singleton<T>`，它对于省却代码有很好的帮助，也能支持线程安全的 lazyinit：

```c++
namespace hicc::util {

  template<typename T>
  class singleton {
    public:
    static T &instance();

    singleton(const singleton &) = delete;
    singleton &operator=(const singleton) = delete;

    protected:
    struct token {};
    singleton() = default;
  };

  template<typename T>
  inline T &singleton<T>::instance() {
    static const std::unique_ptr<T> instance{new T{token{}}};
    return *instance;
  }

} // namespace hicc::util
```

关于 C++11 标准库的 make_unique_ptr/make_shared_ptr 不能在私有构造函数上工作的问题也早已被多方讨论了，但直接的解决方法没有什么简洁的（而且难以做到跨编译器兼容性），所以在 `singleton<T>` 中提供了 struct token 的方法来拒绝使用者直接构造一个类——为了让派生类能够实现特别的构造函数，`struct token {}` 以及 `ctor()` 被标记为 protected。

这个模板类的使用一般来说必须采用派生类的方式，但需要特别的构造函数：

```c++
#include <hicc/hz-common.hh>
// #include <cmdr11/cmdr_common.hh>

class MyVars: public hicc::util::singleton<MyVars> {
  public:
  explicit MyVars(typename hicc::util::singleton<MyVars>::token) {}
  long var1;
};

int main() {
  printf("%ld\n", MyVars.instance().var1);
}
```

如果不在意可否手动实例化的编码防范，你可以简化派生类的书写，但模板类中需要去掉 token 的使用。



#### 变参 Singleton 模板

如果你的类需要构造参数，问题就稍微复杂一点，可以使用我们的 `singleton_with_optional_construction_args`，它也是 C++11 起能被直接支持的，无需 hack：

```c++
namespace hicc::util {

  template<typename C, typename... Args>
  class singleton_with_optional_construction_args {
    private:
    singleton_with_optional_construction_args() = default;
    static C *_instance;

    public:
    ~singleton_with_optional_construction_args() {
      delete _instance;
      _instance = nullptr;
    }
    static C &instance(Args... args) {
      if (_instance == nullptr)
        _instance = new C(args...);
      return *_instance;
    }
  };

  template<typename C, typename... Args>
  C *singleton_with_optional_construction_args<C, Args...>::_instance = nullptr;

} // namespace hicc::util
```

使用方法大概像这样：

```c++
void test_singleton_with_optional_construction_args() {
  int &i = singleton_with_optional_construction_args<int, int>::instance(1);
  UTEST_CHECK(i == 1);

  tester1 &t1 = singleton_with_optional_construction_args<tester1, int>::instance(1);
  UTEST_CHECK(t1.result() == 1);

  tester2 &t2 = singleton_with_optional_construction_args<tester2, int, int>::instance(1, 2);
  UTEST_CHECK(t2.result() == 3);
}
```

这个实现的原始来源不可考了。

它也不是最优的实现。

其实它可以被改写的和 `singleton<T>` 相似，不必使用 new 和 delete，但是讲真我从未用到过一个单件类还带构造参数的，也就没有改写的动力了。

留在这里，只是为了提供一个参考范本，我不会建议你在工程中直接实作它，除非你能够自行完善。



### Epilogue

严格地说，上面的模板化实现只需要 c++11 支持即可。但是考虑到我已经写了一篇关于 c++ design patterns 的文字了，而我又决定了不关心 c++11 的特性（老话题了，它比起 17 来不够工程诱惑力），所以还是就冠这个标题名算了。

#### 话题 2：关于 main 之前的初始化

在 Turbo C 年代，main 之前从 OS（例如 DOS/Linux 经过 EXE/PE/ELF）发起一个执行文件的执行动作是通过 c0.asm 来完成的。它接收到 OS 移交到代码执行控制权之后，完成 C 环境的准备，完成 _atexit 注册的回调函数的登记，然后移交执行控制权到 _main。这个时期里，我们可以通过指定代码段（`_DATA`，`_BSS` 之类）的方式来指明一个编译单元中的变量被放在何处，并且通过指明编译顺序的方式来控制变量的初始化优先顺序。

后来，C++ 的时代，以 Visual C++ 为例，除了完成 C 环境准备之外，还需要做 CRT 库准备（c0crt.asm）。VC 的 CRT 库在很大程度上就是它的标准库了。对于 gcc 来说，可能是 libstdc++ 之类。这一段时期里，一些非标扩展甚至允许我们指定某个静态变量在 CRT 库之前就能被初始化。

在 C++11 之后，main 之前的初始化工作大体上被分为三部分：基本 C 环境，stdc 库，stdc++ 库，如果有必要你可以替换这些核心库，如果你在尝试编写一个 OS 内核，那么通常你都必须替换掉它们。由于 C++ 本身的语法语义能力得到了进一步规范和增强，已经不再会有也不被推荐你去使用非标扩展了，我们不再去设想设计某个 singleton 是不是应该在 stdc/stdc++ 之前就必须提前被初始化了。

说到这里，你或许不会理解有何必要提前初始化点，但其实是有的，如果想要接管 stdc 的某些函数入口，或者你需要一个特别的 logging 支撑等等，那就确实会用得上这样的怪招。不过，这确实不是常态，也不会在规模化生产中被应用。

不过就到这里吧，因为很早以前写 singleton 真的是一个野蛮生长的年代啊，所以简单聊聊这些话题。



:end:

