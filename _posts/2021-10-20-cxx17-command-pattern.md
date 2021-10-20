---
layout: single
title: "谈 C++17 里的 Command 模式"
date: 2021-10-20 05:20:00 +0800
last_modified_at: 2021-10-20 06:20:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,command pattern,design patterns,命令模式,设计模式]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20211019103247571.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  跟随前文备忘录模式而继续介绍关联者：命令模式...
---





> 命令模式：介绍相关概念。实作参考上回的 Memento



## Command Pattern



### 关于本系列文章

这次的 谈XX模式 系列，并不会逐个全部介绍 GoF 的 23 个模式，也不限于 GoF。有的模式可能是没有模板化复用的必要性的，另外有的模式却并不包含在 GoF 中，所以有时候会有正文的补充版本，像上次的 [谈 C++17 里的 Observer 模式 - 4 - 信号槽模式](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-4/) 就是如此。

因为本系列的重心在于模板化实作上面，以工程实作为目标，所以我们并不会像一般的设计模式文章那样规规矩矩地介绍动机、场景什么的（有时候又未必），而是会以我们的经验和对模式的理解，用自己的话来做阐述，我觉得它可能会有点用，当然快消的世界这样做是很愚蠢。

这对于我们来讲，对个人来讲，也是一个审视和再思考的过程。而对于你来说，换个角度看看他人的理解，说不定其实是有用处的。



### 关于命令模式

在 [谈 C++17 里的 Memento 模式](https://hedzr.com/c++/algorithm/cxx17-memento-pattern/) 一文中我提到过备忘录模式和命令模式往往是联动协同工作的，并且在给出的传统实现以及 Undo Manager 实现（类库 [undo-cxx](https://github.com/hedzr/undo-cxx)）中居包含了命令模式部分。

所以本文算是凑数的意思。



### 动机

命令模式是一种行为模式。这种设计模式把多种多样的动作抽象为命令，Client 通过执行器 Caller/Invoker/Executor 执行这些命令而不必关心调用的细节。一个具体的命令对象 ConcreteCommand 负责解释命令执行动作的全部细节，包括命令的接收者。接收者 Receiver 是命令执行的承受者，例如在字处理器中，接收者是当前编辑器的当前选择文字，而字体样式命令会对该接收者做出样式设定。

这段描述的 UML 图是这样的：



![img](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/2880px-Command_pattern.svg.png)

> FROM: [here: svg file](https://en.wikipedia.org/wiki/Command_pattern#/media/File:Command_pattern.svg)

另一张图很漂亮，摘取在这里供对照：

![img](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/command-pattern.png)

> FROM:  [The Command Pattern - fjp.github.io](https://fjp.at/design-patterns/command) 



### 场景

在一个餐厅中，顾客点餐后，点餐的动作可以被视为 Client 在通知 Executor 该要执行命令了。命令被执行的上下文包含了顾客点餐的菜单（Receipt）。菜单被送到后厨，被指派给恰当的厨师烹饪，这相当于命令被具体执行。

在一个音乐播放器中，Play，Pause，Stop，Forward，Rewind 是相应的命令，Invoker 执行命令时，导致接收者 Receriver 即录音机被控制。

在一个字处理器中，当前编辑器的当前选择文字通常被视作接收者，Bold，Italic 等用户的 UI 操作会触发到相应命令的执行。

矢量作图的场景类似于字处理器。

桌面窗口应用中的菜单和快捷键系统，也是命令模式的典型体现。

游戏开发中 Command 模式也非常常用，基本上是必需品。

通讯协议解析器是另一种你可能没有深思的命令模式运用场景。通讯协议通常都包含一系列 tokens 的识别，一系列指令指示，一系列数据汇报信息，这些内容都可以被抽象和组织到命令模式中去进行具体处理。



### 代码实现

关于命令模式的设计思路，关键之处无非是如下几点：

1. cmd_t 的类体系应该如何构建，对象实例的管理与销毁问题
2. 命令分组问题，即 composite_cmd_t 应该如何设计的问题
3. 上下文问题：预先固化一个接收器，对于类库来说是行不通的，所以接收器甚至于 sender 都可以被放在一个所谓的上下文容器中，在命令被执行的过程中被传递。而类库的使用者能够有能力扩展这个上下文容器以容纳其他想要的数据。
4. undo/redo 问题
5. 命令的管理问题，command_id 的分配问题
6. 命令的调用问题，好的调用语法能简化使用者的负担

有了这些前提或约束，再来设计命令系统就比较有方向性了。

我们采取的策略有：

1. 请看上一篇系列文章 memento pattern 以及 undo-cxx 的源码部分。
2. :)

本文中就不重复摘取片段了。



### Tricks

#### protected virtual function

作为一个 class 编写的准则，不要将 public function 设计为 virtual 的。

这个准则似乎并不为人所重视。

但是作为一种惯用法和 Trick，virtual function 总是 protected 的，这是程序员之间的一种隐语：看到了保护的虚函数，派生类就知道这是应该被重载的。

关于这个准则的深入讨论，本文就算了，你可以听听 [Herb Sutter](http://www.gotw.ca/publications/mill18.htm) 的说法。在 [C++ FAQ](http://www.parashift.com/c++-faq-lite/index.html) 中也有相关的讨论：

- [Should I use protected virtuals instead of public virtuals?](http://www.parashift.com/c++-faq-lite/strange-inheritance.html#faq-23.3)
- [When should someone use private virtuals?](http://www.parashift.com/c++-faq-lite/strange-inheritance.html#faq-23.4)

在 cmd_t 的实现中，严格地遵守了这样的准则。用我的话来说呢，大概是这样：能被重载的虚函数代表着具体实现和能力，所以它当然不应该被 public 不是吗？如果一个接口必须被公开却又允许被重载，大抵是代表着你的设计上拆分的不充分。

不过，也未必一定要拆分：这个思路也间接导致了另一个惯用法，即将一个应该被重载的虚函数拆分为普通成员函数与虚实现函数：

```cpp
class X {
  public:
  void chilling_out() { this->chilling_out_impl(); }
  
  protected:
  virtual void chilling_out_impl() = 0;
};
```

算不算很无理？

或许吧。



##### private virtual function

BTW，介绍一个你可能忽视的小知识，虚函数是可以被设置为 private 的。

这听起来彷佛有点荒谬，但它是真的：

```cpp
namespace {
  struct base { virtual ~base(){} };

  template<class T>
    struct base_t : public base {
      virtual T t() = 0;
      protected:
      void chilling_out() { this->chilling_out_impl(); }
      private:
      virtual void chilling_out_impl() = 0;
    };

  template<class T>
    struct A : public base_t<T> {
      A(){}
      A(T const& t_): _t(t_) {}
      ~A(){}
      T _t{};
      virtual T t() override { std::cout << _t << '\n'; return _t; }
      private:
      virtual void chilling_out_impl() override {}
    };
}
```

这段代码编译、运行都毫无问题。

虚函数是 private 的，意味着派生类不能调用它，但基类自己能调用就行。而且，你可以在派生类中重载它。不仅如此，你甚至可以在派生类中重载它的同时修改其访问特性：

```cpp
namespace {
  struct base { virtual ~base(){} };

  template<class T>
    struct base_t : public base {
      virtual T t() = 0;
      protected:
      void chilling_out() { this->chilling_out_impl(); }
      private:
      virtual void chilling_out_impl() = 0;
    };

  template<class T>
    struct A : public base_t<T> {
      A(){}
      A(T const& t_): _t(t_) {}
      ~A(){}
      T _t{};
      virtual T t() override { std::cout << _t << '\n'; return _t; }
      protected:
      // private:
      virtual void chilling_out_impl() override {}
    };

    struct B: public A<int> {
        virtual int t() override { std::cout << _t << '\n'; return _t; chilling_out_impl(); }
    };
}
```

如上，在 struct A 中重载了 chilling_out_impl() 并改为 protected，所以在派生类 B 中要直接使用它也不会报错了。这是一个有用的特性，别人的类库有时候我们也可以有条件地重载某些细节；同时这也是一个有用的 Bug，话说这样的漏洞真的不会带来隐患吗？







### Refs

- [命令设计模式](https://refactoringguru.cn/design-patterns/command) 
- [Command pattern - Wikipedia](https://en.wikipedia.org/wiki/Command_pattern) 

## 后记

围绕着 virtual function 还有着众多的技巧，不过很多时候，良好的设计会让你根本无需额外特别的技巧，堂堂正正地就把钱钱给挣了。

那样很好。

:end:

