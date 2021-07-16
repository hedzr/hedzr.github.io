---
layout: single
title: "std::optional T 作为返回值时的优化问题，及其他相关"
date: 2021-07-16 05:00:00 +0800
last_modified_at: 2021-07-16 23:50:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,rvo,std,optional,nrvo,copy elision,named return value optimization]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210716153922781.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  直觉式的写法存在着不能 RVO 的问题，所以需要一个惯用法...
---



![image-20210716153922781](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210716153922781.png)



## 基本问题

### 问题引发

在我的 message-queue 开发过程中，有这么样的代码：

```c++
inline std::optional<T> pop_front() {
  lock l(_m);
  _cv.wait(l, [this] { return _abort || !_data.empty(); });
  if (_abort) return {}; // std::nullopt;

  auto r = std::move(_data.back());
  _data.pop_back();
  return r;
}
```

它的用意足够简单，就是从 `std::deque _data` 中弹出一个队尾元素。只是由于队列可能为空，所以有一个阻塞式的条件变量来等待队列中有有效值（前三行）。

按照直觉，我顺理成章地写完了这段代码。

随即我编写了一个测试片段：

```c++
void test_mq() {
    hicc::pool::threaded_message_queue<hicc::debug::X> xmq;

    hicc::debug::X x1("aa");
    {
        xmq.emplace_back(std::move(x1));
        hicc_debug("  xmq.emplace_back(std::move(x1)) DONE. AND, xmq.pop_front() ...");
        std::optional<hicc::debug::X> vv = xmq.pop_front();
        hicc_debug("vv (%p): '%s'", (void *) &vv, vv.value().c_str());
    }
    hicc_debug("x1 (%p): '%s'", (void *) &x1, x1.c_str());
}
```

`hicc::debug::X` 是一个专门用来调试 RVO，In-place construction，Copy Elision 等等特性的工具类，它平平无奇，只不过是在若干位置埋点冰打印 stdout 文字而已，这可以让我们直观观察到哪些行为实际上发生了。

```c++
namespace hicc::debug {

    class X {
        std::string _str;

        void _ct(const char *leading) {
            printf("  - %s: X[ptr=%p].str: %p, '%s'\n", leading, (void *) this, (void *) _str.c_str(), _str.c_str());
        }

    public:
        X() {
            _ct("ctor()");
        }
        ~X() {
            _ct("dtor");
        }
        X(std::string &&s)
            : _str(std::move(s)) {
            _ct("ctor(s)");
        }
        X(std::string const &s)
            : _str(s) {
            _ct("ctor(s(const&))");
        }
        X &operator=(std::string &&s) {
            _str = std::move(s);
            _ct("operator=(&&s)");
            return (*this);
        }
        X &operator=(std::string const &s) {
            _str = s;
            _ct("operator=(const&s)");
            return (*this);
        }

        const char *c_str() const { return _str.c_str(); }
        operator const char *() const { return _str.c_str(); }
    };

} // namespace hicc::debug
```

但我实现的很简略，所以有时候要配合 gdb 调试和断点，以便实质性地确认一行输出究竟和代码中的哪一行相互对应。



### 问题实况

好的，上面的测试片段跑起来，结果如下：

```bash
  - ctor(s): X[ptr=0x7ffeeb08a690].str: 0x7ffeeb08a691, 'aa'
07/16/21 07:49:18 [debug]:   xmq.emplace_back(std::move(x1)) DONE. AND, xmq.pop_front() ...  /Users/hz/hzw/cc/hicc-cxx/tests/pool.cc:24 (void test_mq())
  - dtor: X[ptr=0x621000001500].str: 0x621000001501, 'aa'
  - dtor: X[ptr=0x7ffeeb08a460].str: 0x7ffeeb08a461, 'aa'
07/16/21 07:49:18 [debug]: vv (0x7ffeeb08a750): 'aa'  /Users/hz/hzw/cc/hicc-cxx/tests/pool.cc:26 (void test_mq())
  - dtor: X[ptr=0x7ffeeb08a750].str: 0x7ffeeb08a751, 'aa'
07/16/21 07:49:18 [debug]: x1 (0x7ffeeb08a690): 'aa'  /Users/hz/hzw/cc/hicc-cxx/tests/pool.cc:28 (void test_mq())
  - dtor: X[ptr=0x7ffeeb08a690].str: 0x7ffeeb08a691, 'aa'

```

看起来 dtor 非常多。

我耐心辨别，ctor(s) 这代表着 `test_mq()` 的 L4，没有问题；`emplace_back()` 没有多余的 dtor，达到了我的原始构想，没有问题；

L3 和 L4 的 dtor，有点怪，我只能通过调试器来确认：L3 是由 `pop_front()` 的 L7 产生的，`_data.pop_back()` 析构了一个队尾元素，所以打印了该元素的 dtor（由于 X class 没有对内部的 str 进行 swap 优化，所以 std::move(X x) 不能完整地达成移动语义，表现出来就是 str 的值不会在移动语义之后被清零）。而 L4 的 dtor 发生在 `pop_front()` 退出点，由 `return r` 隐式构造的 `std::optional<X>` 临时对象的析构所带出。

再之后，L6 的 dtor 是 `test_mq()` 中的 vv 析构所带出；L8 的 dtor 是第一个 ctor(s) 的对应析构调用。这两个 dtor 没有问题。

所以看起来 dtor 多是在测试代码上，核心库只有一个问题：L4 的 dtor 是意料外的发生。

### 寻根究底

#### RVO

经过实况的分析，我们知道问题出自于 `std::optional<T>` 做函数返回值时没有正确地 RVO。

这相当不科学。

康康：

```c++
std::string build(){
  std::string ret;
  ret += "2";
  ret += "3";
  return ret;
}

int main(){
  std::cout << build() << '\n';
}
```

RVO 的特性让 L2 的 ret 不必析构直接被返回给了 caller。

这是个很正常的编译器优化能力，也是 C++11 以来的规范约定，怎么可能在 optional 上就 XJBG 了呢。

所以我试图改写代码来找到原因。

#### 解决

无趣的过程略略略。

最终能够顺利 RVO 的实现是这样的：

```c++
inline std::optional<T> pop_front() {
  std::optional<T> ret;
  lock l(_m);
  _cv.wait(l, [this] { return _abort || !_data.empty(); });
  if (_abort) return ret; // std::nullopt;

  ret.template emplace(std::move(_data.back()));
  _data.pop_back();
  return ret;
}
```

用这个新实现跑测试片段，得到：

```bash
  - ctor(s): X[ptr=0x7ffee3d86690].str: 0x7ffee3d86691, 'aa'
07/16/21 07:51:43 [debug]:   xmq.emplace_back(std::move(x1)) DONE. AND, xmq.pop_front() ...  /Users/hz/hzw/cc/hicc-cxx/tests/pool.cc:24 (void test_mq())
  - dtor: X[ptr=0x621000001500].str: 0x621000001501, 'aa'
07/16/21 07:51:43 [debug]: vv (0x7ffee3d86750): 'aa'  /Users/hz/hzw/cc/hicc-cxx/tests/pool.cc:26 (void test_mq())
  - dtor: X[ptr=0x7ffee3d86750].str: 0x7ffee3d86751, 'aa'
07/16/21 07:51:43 [debug]: x1 (0x7ffee3d86690): 'aa'  /Users/hz/hzw/cc/hicc-cxx/tests/pool.cc:28 (void test_mq())
  - dtor: X[ptr=0x7ffee3d86690].str: 0x7ffee3d86691, 'aa'
```

可以看到，原本的 L4 dtor 被解决掉了，也就是说 std::optional 返回值被正确地 RVO 了。通过调试器查看 ret 的地址指针以及 vv 的地址指针能够确认这一点。



### 缘由

对比前后两个实现，两者的区别在于我们最后使用了一个函数体作用域内的唯一的 `std::optional<T>` 变量 ret，在 clang 编译器中，它会将 ret 标记为识别到 RVO 变量的状态。而原有的实现采用了隐式构造方法，编译器未能正确识别到 RVO 变量。

当我们采用多个变量时，编译器也有可能不能正确 RVO：

```c++
inline std::optional<T> pop_front_bad() {
  lock l(_m);
  _cv.wait(l, [this] { return _abort || !_data.empty(); });
  if (_abort) return {}; // std::nullopt;

  std::optional<T> ret{ std::move(_data.back()) };
  _data.pop_back();
  return ret;
}
```

上述例子中，除了 ret 还有隐式返回：`return {}`，所以同样不能正确地 RVO。

## 小结

限于精力，不想再做其他编译器的行为探讨了。

这里是以 `std::optional` 返回值发生的问题来讨论 RVO 的。之所以正好使它，是因为 optional 最容易发生 RVO 失败的情况。我们采用 `std::optional` 作为返回值时，总是在面临这样的场景：正常时我们返回有效值，异常时我们期望能返回一个空值。而空值不是 `{}` 就是 `std::nullopt` ，完美地挑战了编译器的死角。

### C++ Spec

那么，对于 RVO (Return Value Optimization) 来说，C++ 规范上的要求大致上是这样的：

> #### 非强制的复制/移动 (C++11 起)操作消除
>
> 下列环境下，容许但不要求编译器省略类对象的复制和移动 (C++11 起)构造，即使复制/移动 (C++11 起)构造函数和析构函数拥有可观察副作用。直接将对象构造到它们本来要复制/移动到的存储中。这是一项优化：即使进行了优化而不调用复制/移动 (C++11 起)构造函数，它仍然必须存在且可访问（如同完全未发生优化），否则程序非良构：
>
> - [return 语句](https://zh.cppreference.com/w/cpp/language/return)中，当操作数是拥有自动存储期的非 volatile 对象的名字，其并非函数形参或 catch 子句形参，且其具有与函数返回类型相同的类类型（忽略 [cv 限定](https://zh.cppreference.com/w/cpp/language/cv)）时。这种复制消除的变体被称为 NRVO，“具名返回值优化 (named return value optimization)”。
>
> | 在对象的初始化中，当源对象是无名临时量且与目标对象具有相同类型（忽略 [cv 限定](https://zh.cppreference.com/w/cpp/language/cv)）时。当无名临时量为 return 语句的操作数时，称这种复制消除的变体为 RVO，“返回值优化 (return value optimization)”。 | (C++17 前) |
> | ------------------------------------------------------------ | ---------- |
> | 返回值优化是强制要求的，而不再被当做复制消除；见上文。       |            |
>
> > [复制消除 - cppreference.com](https://zh.cppreference.com/w/cpp/language/copy_elision) 

很复杂是不是。

我看的脑子爆炸。

不过，简单一句话：**安全的 RVO（或者具名的 NRVO） 是在函数中提前声明返回值变量，并在任何返回点都返回它**。





:end:

