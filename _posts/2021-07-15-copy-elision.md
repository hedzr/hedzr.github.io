---
layout: single
title: "C++ 复制消除问题"
date: 2021-07-15 12:00:00 +0800
last_modified_at: 2021-07-15 13:00:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,copy elision]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210716153922781.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  直觉式的写法存在着不能有效复制消除的问题，所以需要一个惯用法...
---



## 错误示范

push_back 这么写是错的：

```c++
template<class T>
  class threaded_message_queue {
    public:
    using lock = std::unique_lock<std::mutex>;
    void push_back(T t) {
      {
        lock l(_m);
        _data.push_back(std::move(t));
      }
      _cv.notify_one();
    }
  }
};//
```

入参 `T t` 导致了调用者在这里会发生一次临时对象 TMP 的复制，稍后在函数退出点处 TMP 还会被隐式析构。**所以这个写法不是良构**。

至于函数体中的 `std::move(t)` 也就是聊胜于无了，它并不会让 `t` 少掉 TMP 的复制，仅仅只是少掉了 `t` 到 `_data` 的一次复制而已。

## 正确工作

做模板类开发时，经常会遇到 push_back 的这种场景。

正确的 push_back 应该包含左值复制和右值移动两种语义，一般来说像是这样子：

```c++
template<class T>
  class threaded_message_queue {
    public:
    using lock = std::unique_lock<std::mutex>;
    void emplace_back(T &&t) {
      {
        lock l(_m);
        _data.template emplace_back(std::move(t));
      }
      _cv.notify_one();
    }
    void push_back(T const &t) {
      {
        lock l(_m);
        _data.push_back(t);
      }
      _cv.notify_one();
    }
  }
};
```

注意右值加上移动语义才是一对搭配。**`T t` 和移动语义在一起只是一种错觉**。

你还可以加上一个 push_back 的移动语义：

```c++
    void push_back(T &&t) {
      {
        lock l(_m);
        _data.template emplace_back(std::move(t));
      }
      _cv.notify_one();
    }
```

这是因为按照约定，emplace_back 通常采用模板变参并实现 T 类的原位构造。这个话题我在 [C++ 中的原位构造函数及完美转发 - 写我们自己的 variant 包装类](https://hedzr.com/c++/variant/in-place-construction-in-cxx/) 已经有过一定的讨论，这里就不详述了。

## X-class

`hicc::debug::X` 是一个专门用来调试 RVO，In-place construction，Copy Elision 等等特性的工具类，它平平无奇，只不过是在若干位置埋点冰打印 stdout 文字而已，这可以让我们直观观察到哪些行为实际上发生了。

X-class 在构造函数的入参部分有相似的构造：

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







:end:

