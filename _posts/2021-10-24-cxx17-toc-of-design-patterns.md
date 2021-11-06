---
layout: single
title: "谈 C++17 里的设计模式们之收尾篇"
date: 2021-10-24 07:10:00 +0800
last_modified_at: 2021-10-24 07:35:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,design patterns,设计模式]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20211017164237144.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  这一次实作 GoF 设计模式的通用模板的旅程暂告一段落了，这里总和一下前面的所有内容...
---



## TOC of Design Patterns



### 关于本系列文章

这次的 <mark>谈C++17里的设计模式</mark> 系列，并没有逐个全部介绍 GoF 的 23 个模式，也不限于 GoF。有的模式可能是没有模板化复用的必要性的，另外有的模式却并不包含在 GoF 中，所以有时候会有正文的补充版本，像上次的 [谈 C++17 里的 Observer 模式 - 4 - 信号槽模式](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-4/) 就是如此。

因为本系列的重心在于模板化实作上面，以工程实作为目标，所以我们并不会像一般的设计模式文章那样规规矩矩地介绍动机、场景什么的（有时候又未必），而是会以我们的经验和对模式的理解，用自己的话来做阐述，我觉得它可能会有点用，当然快消的世界这样做是很愚蠢。

这对于我们来讲，对个人来讲，也是一个审视和再思考的过程。而对于你来说，换个角度看看他人的理解，说不定其实是有用处的。



### 动机

<acronym>谈 XXX 模式系列</acronym> 的动机算是可笑的，因为需要实作一个工厂模式，于是就在反思都 C++17 了，还在用以前的方式弄个工厂类，而不是采用可复用的方法吗。然后就有了 [谈 C++17 里的 Factory 模式](https://hedzr.com/c++/algorithm/cxx17-factory-pattern/) ，而且顺便也就有了 [谈 C++17 里的 Singleton 模式](https://hedzr.com/c++/algorithm/cxx17-singleton-pattern/)。

再后来一切事情就都失控了。

那时候尚未仔细思考，只是任随心意一篇篇就写下来了。



#### 关于系列中缺失的模式

不过，GoF 的设计模式们并不是全都可复用的。基本上大多数结构型设计模式均没有复用的必要性或者可能性。它们分别是：

- 适配器模式
- 桥接模式
- 组合模式
- 装饰模式
- 外观模式
- 代理模式

它们的共通之处在于都需要一个庞大的待优化实体，并依附于该类才能构成相应的模式类，对原有的类要么拆分、要么重组，要么在借用的基础上变换为新接口，而新构成的模式类可能是一组拆分后的类，或者全然不同的新模式类，模式类其本身是没有共通性的。所以这些模式的通用性模板化复用的价值通常为 0。

在原型模式这一问题上情况有所不同，因为原型模式太简单了而没有单列一篇的必要（注水是不道德的），一句话就讲完了：`virtual T clone() const;` 这就是原型模式。

- 原型模式

关于 Mediator 模式呢，是一个特例。没有对它做出可复用是因为它是个相当含混的模式，它与其它几种模式（观察者，职责链，命令，访问者等）的区别非常细微，以至于在实作案例中，我们往往是将这几种模式复合在一起综合考虑综合体现出来的。在以实作为目标的本系列文章中，我在职责链中提供的一套实现方案很大程度上就已经涵盖了对应的情形。

- 中介者模式

关于迭代器模式，由于标准库提供了一套完整的机制，所以没必要我来狗尾续貂了。

- 迭代器模式

综上，本系列中无法谈论全部模式。话虽如此，但是回顾了一下过往的内容，发觉还是写了不少的。



### TOC

所以这一次的谈 XXX 模式系列是收尾的时候了。

已经写就的文章列表如下，可供查阅：



#### [谈 C++17 里的 Chain of Responsibility 模式](https://hedzr.com/c++/algorithm/cxx17-chain-of-responsibility-pattern/)

 3 分钟阅读

探讨责任链模式（chain of responsibility pattern），并实现一个<mark>消息分发系统</mark>…



#### [谈 C++17 里的 Command 模式](https://hedzr.com/c++/algorithm/cxx17-command-pattern/)

 2 分钟阅读

跟随前文备忘录模式而继续介绍关联者：命令模式…



#### [谈 C++17 里的 Factory 模式之二](https://hedzr.com/c++/algorithm/cxx17-factory-pattern-2/)

 4 分钟阅读

改进后的工厂模式，以及 type_name 等等…



#### [谈 C++17 里的 Memento 模式](https://hedzr.com/c++/algorithm/cxx17-memento-pattern/)

 7 分钟阅读

介绍备忘录模式及其 C++ 实作，介绍 [<mark>undo-cxx</mark>](https://github.com/hedzr/undo-cxx) 的实现…



#### [谈 C++17 里的 Strategy 模式](https://hedzr.com/c++/algorithm/cxx17-strategy-pattern/)

 2 分钟阅读

重新思考状态模式的实作可能性…



#### [谈 C++17 里的 State 模式之二](https://hedzr.com/c++/algorithm/cxx17-state-pattern-2/)

 10 分钟阅读

关于状态模式的研究，以及状态机的 C++17 中的通用实现，介绍 [<mark>fsm-cxx</mark>](https://github.com/hedzr/fsm-cxx) …



#### [谈 C++17 里的 State 模式之一](https://hedzr.com/c++/algorithm/cxx17-state-pattern/)

 2 分钟阅读

关于状态模式的研究，以及状态机的 C++17 中的通用实现，介绍 [<mark>fsm-cxx</mark>](https://github.com/hedzr/fsm-cxx)  …



#### [谈 C++17 里的 Observer 模式 - 4 - 信号槽模式](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-4/)

 7 分钟阅读

关于观察者模式之四，Qt 的 Slot-Signal 模式的单独实现，…



#### [谈 C++17 里的 Observer 模式 - 再补](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-3/)

 2 分钟阅读

关于观察者模式之三，直接绑定函数对象，…



#### [谈 C++17 里的 Observer 模式 - 补](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-2/)

 4 分钟阅读

关于观察者模式上一 POST 的补充与改进，…



#### [谈 C++17 里的 Observer 模式](https://hedzr.com/c++/algorithm/cxx17-observer-pattern/)

 2 分钟阅读

关于观察者模式的研究，及其实现，…



#### [谈 C++17 里的 Visitor 模式](https://hedzr.com/c++/algorithm/cxx17-visitor-pattern/)

 4 分钟阅读

关于访问者模式的研究，及其实现，…



#### [谈 C++17 里的 FlyWeight 模式](https://hedzr.com/c++/algorithm/cxx17-flyweight-pattern/)

 8 分钟阅读

关于享元模式的 C++17 中的较通用实现，…



#### [谈 C++17 里的 Builder 模式](https://hedzr.com/c++/algorithm/cxx17-builder-pattern/)

 8 分钟阅读

回顾构建者模式的各种可能的实现，在 C++17 语境中讨论，…



#### [谈 C++17 里的 Singleton 模式](https://hedzr.com/c++/algorithm/cxx17-singleton-pattern/)

 4 分钟阅读

回顾单件模式的各种可能的实现，尝试建立其 C++17 中的可能的最优解，…



#### [谈 C++17 里的 Factory 模式](https://hedzr.com/c++/algorithm/cxx17-factory-pattern/)

 8 分钟阅读

回顾工厂模式的各种可能的实现，尝试建立其 C++17 中的最优解 …



## 后记

暂告一段落了。

除了特别提及的单列库之外，主要的参考代码可见于：

- <https://github.com/hedzr/design-patterns-cxx>
- <https://github.com/hedzr/cmdr-cxx>



:end:

