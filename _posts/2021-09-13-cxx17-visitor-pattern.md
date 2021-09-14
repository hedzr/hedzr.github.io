---
layout: single
title: "谈 C++17 里的 Visitor 模式"
date: 2021-09-13 23:35:00 +0800
last_modified_at: 2021-09-14 08:00:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,visitor pattern,design patterns]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210914091034034.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  关于访问者模式的研究，及其实现，...
---





## Visitor Pattern

访问者模式是一种行为模式，允许任意的分离的访问者能够在管理者控制下访问所管理的元素。访问者不能改变对象的定义（但这并不是强制性的，你可以约定为允许改变）。对管理者而言，它不关心究竟有多少访问者，它只关心一个确定的元素访问顺序（例如对于二叉树来说，你可以提供中序、前序等多种访问顺序）。

![image-20210914091034034](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210914091034034.png)

### 组成

Visitor 模式包含两个主要的对象：Visitable 对象和 Vistor 对象。此外，作为将被操作的对象，在 Visitor 模式中也包含 Visited 对象。

一个 Visitable 对象，即管理者，可能包含一系列形态各异的元素（Visited），它们可能在 Visitable 中具有复杂的结构关系（但也可以是某种单纯的容纳关系，如一个简单的 vector）。Visitable 一般会是一个复杂的容器，负责解释这些关系，并以一种标准的逻辑遍历这些元素。当 Visitable 对这些元素进行遍历时，它会将每个元素提供给 Visitor 令其能够访问该 Visited 元素。

这样一种编程模式就是 Visitor Pattern。

### 接口

为了能够观察每个元素，因此实际上必然会有一个约束：所有的可被观察的元素具有共同的基类 Visited。

所有的 Visitors 必须派生于 Visitor 才能提供给 Visitable.accept(visitor&) 接口。

```cpp
namespace hicc::util {

    struct base_visitor {
        virtual ~base_visitor() {}
    };
    struct base_visitable {
        virtual ~base_visitable() {}
    };

    template<typename Visited, typename ReturnType = void>
    class visitor : public base_visitor {
    public:
        using return_t = ReturnType;
        using visited_t = std::unique_ptr<Visited>;
        virtual return_t visit(visited_t const &visited) = 0;
    };

    template<typename Visited, typename ReturnType = void>
    class visitable : public base_visitable {
    public:
        virtual ~visitable() {}
        using return_t = ReturnType;
        using visitor_t = visitor<Visited, return_t>;
        virtual return_t accept(visitor_t &guest) = 0;
    };

} // namespace hicc::util
```

### 场景

以一个实例来说，假设我们正在设计一套矢量图编辑器，在画布（Canvas）中，可以有很多图层（Layer），每一图层包含一定的属性（例如填充色，透明度），并且可以有多种图元（Element）。图元可以是 Point，Line，Rect，Arc 等等。

为了能够将画布绘制在屏幕上，我们可以有一个 Screen 设备对象，它实现了 Visitor 接口，因此画布可以接受 Screen 的访问，从而将画布中的图元绘制到屏幕上。

如果我们提供 Printer 作为观察者 ，那么画布将能够把图元打印出来。

如果我们提供 Document 作为观察者，那么画布将能够把图元特性序列化到一个磁盘文件中去。

如果今后需要其它的行为，我们可以继续增加新的观察者，然后对画布及其所拥有的图元进行类似的操作。



### 特点

- 如果你需要对一个复杂对象结构 （例如对象树） 中的所有元素执行某些操作， 可使用访问者模式。

- 访问者模式将非主要的功能从对象管理者身上抽离，所以它也是一种解耦手段。

- 如果你正在制作一个对象库的类库，那么向外提供一个访问接口，将会有利于用户无侵入地开发自己的 visitor 来访问你的类库——他不必为了自己的一点点事情就给你 issue/pull request。

- 对于结构层级复杂的情况，要善于使用对象嵌套与递归能力，避免反复编写相似逻辑。

  > 请查阅 canva，layer，group 的参考实现，它们通过实现 `drawable` 和 `vistiable<drawable>` 的方式完成了嵌套性的自我管理能力，并使得 `accept()` 能够递归地进入每一个容器中。



### 实现

我们以矢量图编辑器的一部分为示例进行实现，采用了前面给出的基础类模板。

#### drawable 和 基础图元

首先做 drawable/shape 的基本声明以及基础图元：

```cpp
namespace hicc::dp::visitor::basic {

  using draw_id = std::size_t;

  /** @brief a shape such as a dot, a line, a rectangle, and so on. */
  struct drawable {
    virtual ~drawable() {}
    friend std::ostream &operator<<(std::ostream &os, drawable const *o) {
      return os << '<' << o->type_name() << '#' << o->id() << '>';
    }
    virtual std::string type_name() const = 0;
    draw_id id() const { return _id; }
    void id(draw_id id_) { _id = id_; }

    private:
    draw_id _id;
  };

  #define MAKE_DRAWABLE(T)                                            \
    T(draw_id id_) { id(id_); }                                     \
    T() {}                                                          \
    virtual ~T() {}                                                 \
    std::string type_name() const override {                        \
        return std::string{hicc::debug::type_name<T>()};            \
    }                                                               \
    friend std::ostream &operator<<(std::ostream &os, T const &o) { \
        return os << '<' << o.type_name() << '#' << o.id() << '>';  \
    }

  //@formatter:off
  struct point : public drawable {MAKE_DRAWABLE(point)};
  struct line : public drawable {MAKE_DRAWABLE(line)};
  struct rect : public drawable {MAKE_DRAWABLE(rect)};
  struct ellipse : public drawable {MAKE_DRAWABLE(ellipse)};
  struct arc : public drawable {MAKE_DRAWABLE(arc)};
  struct triangle : public drawable {MAKE_DRAWABLE(triangle)};
  struct star : public drawable {MAKE_DRAWABLE(star)};
  struct polygon : public drawable {MAKE_DRAWABLE(polygon)};
  struct text : public drawable {MAKE_DRAWABLE(text)};
  //@formatter:on
  // note: dot, rect (line, rect, ellipse, arc, text), poly (triangle, star, polygon)
}
```

为了调试目的，我们重载了 '<<' 流输出运算符，而且利用宏 MAKE_DRAWABLE 来削减重复性代码的键击输入。在 MAKE_DRAWABLE 宏中，我们通过 `hicc::debug::type_name<T>()` 来获得类名，并将此作为字符串从 `drawable::type_name()` 返回。

出于简化的理由基础图元没有进行层次化，而是平行地派生于 drawable。

#### 复合性图元和图层

下面声明 group 对象，这种对象包含一组图元。由于我们想要尽可能多的递归结构，所以图层也被认为是一种一组图元的组合形式：

```cpp
namespace hicc::dp::visitor::basic {

  struct group : public drawable
    , public hicc::util::visitable<drawable> {
    MAKE_DRAWABLE(group)
      using drawable_t = std::unique_ptr<drawable>;
    using drawables_t = std::unordered_map<draw_id, drawable_t>;
    drawables_t drawables;
    void add(drawable_t &&t) { drawables.emplace(t->id(), std::move(t)); }
    return_t accept(visitor_t &guest) override {
      for (auto const &[did, dr] : drawables) {
        guest.visit(dr);
        UNUSED(did);
      }
    }
  };

  struct layer : public group {
    MAKE_DRAWABLE(layer)
    // more: attrs, ...
  };
}
```

在 group class 中已经实现了 visitable 接口，它的 accept 能够接受访问者的访问，此时 图元组 group 会遍历自己的所有图元并提供给访问者。

> 你还可以基于 group class 创建 compound 图元类型，它允许将若干图元组合成一个新的图元元件，两者的区别在于，group 一般是 UI 操作中的临时性对象，而 compound 图元能够作为元件库中的一员供用户挑选和使用。

默认时 guest 会访问 `visited const &` 形式的图元，也就是只读方式。

图层至少具有 group 的全部能力，所以面对访问者它的做法是相同的。图层的属性部分（mask，overlay 等等）被略过了。



#### 画布 Canvas

画布包含了若干图层，所以它同样应该实现 visitable 接口：

```cpp
namespace hicc::dp::visitor::basic {

  struct canvas : public hicc::util::visitable<drawable> {
    using layer_t = std::unique_ptr<layer>;
    using layers_t = std::unordered_map<draw_id, layer_t>;
    layers_t layers;
    void add(draw_id id) { layers.emplace(id, std::make_unique<layer>(id)); }
    layer_t &get(draw_id id) { return layers[id]; }
    layer_t &operator[](draw_id id) { return layers[id]; }

    virtual return_t accept(visitor_t &guest) override {
      // hicc_debug("[canva] visiting for: %s", to_string(guest).c_str());
      for (auto const &[lid, ly] : layers) {
        ly->accept(guest);
      }
      return;
    }
  };
}
```

其中，add 将会以默认参数创建一个新图层，图层顺序遵循向上叠加方式。get 和 `[]` 运算符能够通过正整数下标访问某一个图层。但是代码中没有包含图层顺序的管理功能，如果有意，你可以添加一个 `std::vector<draw_id>` 的辅助结构来帮助管理图层顺序。

现在我们来回顾画布-图层-图元体系，accept 接口成功地贯穿了整个体系。

是时候建立访问者们了

#### screen 或 printer

这两者实现了简单的访问者接口：

```cpp
namespace hicc::dp::visitor::basic {
  struct screen : public hicc::util::visitor<drawable> {
    return_t visit(visited_t const &visited) override {
      hicc_debug("[screen][draw] for: %s", to_string(visited.get()).c_str());
    }
    friend std::ostream &operator<<(std::ostream &os, screen const &) {
      return os << "[screen] ";
    }
  };

  struct printer : public hicc::util::visitor<drawable> {
    return_t visit(visited_t const &visited) override {
      hicc_debug("[printer][draw] for: %s", to_string(visited.get()).c_str());
    }
    friend std::ostream &operator<<(std::ostream &os, printer const &) {
      return os << "[printer] ";
    }
  };
}
```

`hicc::to_string` 是一个简易的串流包装，它做如下的核心逻辑：

```cpp
template<typename T>
inline std::string to_string(T const &t) {
  std::stringstream ss;
  ss << t;
  return ss.str();
}
```



#### test case

测试程序构造了微型的画布以及几个图元，然后示意性地访问它们：

```cpp
void test_visitor_basic() {
    using namespace hicc::dp::visitor::basic;

    canvas c;
    static draw_id id = 0, did = 0;
    c.add(++id); // added one graph-layer
    c[1]->add(std::make_unique<line>(++did));
    c[1]->add(std::make_unique<line>(++did));
    c[1]->add(std::make_unique<rect>(++did));

    screen scr;
    c.accept(scr);
}
```

输出结果应该类似于这样：

```bash
--- BEGIN OF test_visitor_basic                       ----------------------
09/14/21 00:33:31 [debug]: [screen][draw] for: <hicc::dp::visitor::basic::rect#3>
09/14/21 00:33:31 [debug]: [screen][draw] for: <hicc::dp::visitor::basic::line#2>
09/14/21 00:33:31 [debug]: [screen][draw] for: <hicc::dp::visitor::basic::line#1
--- END OF test_visitor_basic                         ----------------------

It took 2.813.753ms
```





## Epilogue

Visitor 模式有时候能够被迭代器模式所代替。但是迭代器常常会有一个致命缺陷而影响了其实用性：迭代器本身可能是僵化的、高代价的、效率低下的——除非你做出了最恰当的设计时选择并实现了最精巧的迭代器。 它们两者都允许用户无侵入地访问一个已知的复杂容器的内容。







:end:

