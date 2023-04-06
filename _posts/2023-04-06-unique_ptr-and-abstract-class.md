---
layout: single
title: "unique_ptr 与抽象类的多态"
date: 2023-04-06 00:07:11 +0800
last_modified_at: 2023-04-07 06:11:11 +0800
Author: hedzr
tags: [cxx]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: /assets/images/foo-bar-identity-th.jpg
  overlay_image: /assets/images/foo-bar-identity-th.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  std::unique_ptr/shared_ptr 能够多态吗 ...

---



一直以来，我对于使用智能指针都是敬而远之的。

我不喜欢智能指针，因为它们经常性地导致设计思路破坏问题。究其根源还是因为传统的类体系设计惯性根深蒂固的原因，指针及其多态，函数指针等等都是我的利器。然而自从 C++11以来，这些传统利器统统被冠以了落后的标签。Why？因为一堆人用不好指针，所以它是糟糕的，对吗。所以，从这个角度上讲，我觉得这一堆人嘴里高谈阔论指针安全其实也挺那啥的。也就是搞不定罢了，说一千道一万，底下还是这个根本问题。

不过，智能指针就是新的利器。

这一点却是我不能否认的。当然它带来了一系列认知障碍，不过多数障碍都不是问题，实际上钻到标准库里面耐着性子看一遍它们的源代码——BTW，标准库的源代码那么恶心，怎么没人讨伐——也就理解了。充其量就是运用的时候脑壳里面要沿着源代码实现多转俩圈的问题。

我描述了老人如何顺应新变化的方法，有时候别扭地转圈，转了多次之后，也就成为新的惯用法了。

所以现在做 C++ 项目顺理成章地若是出现了指针那不就是落后的设计么。哎，其实全现代化的 make_shared 以及 enable_shared_from_this 固然算是一种范式，但是它是僵硬的，有时候难于拓展的，而且额外增加了多个层面的开销。这些开销是为何呢？就是因为有人掌握不了有的东西的原因。这个问题见仁见智，人人都有话说，所以不说了。

这里，今次，只谈类体系设计中的一个基础点，智能指针能不能调用到基类实例的多态函数呢？这关系到类体系能否被建构起来的问题。

然后会继续谈谈多态性问题。

如下，首先一点

## 智能指针可以多态的

智能指针当然能够多态，它是通过重载 `operator->` 来达到多态的。

第一点是，一个派生类的智能指针能够直接降级为基类智能指针；然后第二点是基类智能指针透过 `operator->` 或者 `operator*` 提供基类指针访问，在这个基础上原有的基类指针的多态性并不会受到影响。

也就是说：

```c++
class A{
  public:
  virtual void run() = 0;
};
class B: public A{
  public:
	void run() override { std::cout << "B"; }
};

std::shared_ptr<A> sp = std::make_shared<B>();
sp->run(); // prints 'B'
```

这个精简的例子说明了多态如何不受影响地被传递。

精简例子各方面都太示意性，所以下面的例子提供一个完整全面的展现，更为真实：

> 这是个完整的示例，所以不像简例那么专一、清晰，但它更真实世界一些；
>
> 这篇文章也是给 C++ 初通的人看的，他们已经能写代码了，但也许在各种概念上的融会贯通方面还没有最终完成；
>
> Line 8 的 `o.to_string()` 完成了对象的多态函数调用。
>
> Line 20 是不必要的，因为我们设计为只会面对基类对象以多态方式操作，而不会直接操作派生类的某个实例。但当我们进一步完成这个类库的时候这个限制还是会取消的，目前的不必要是为了避免混淆今天谈论的主题。

```c++
namespace aml::res {

  class base {
  public:
    base() = default;
    virtual ~base() = default;
    [[nodiscard]] virtual std::string to_string() const = 0;
    friend std::ostream &operator<<(std::ostream &os, base const &o) { return os << o.to_string(); }
  };

  template<typename T>
  class base_t : public base {
  public:
    ~base_t() override = default;

    using root_type = base;
    using parent_type = T;
    using base_type = base_t<parent_type>;

    // friend std::ostream &operator<<(std::ostream &os, T const &o) { return os << o.to_string(); }

    [[nodiscard]] constexpr std::string_view name() const {
      using namespace std::string_view_literals;
      constexpr auto v = aml::debug::type_name<T>();
      constexpr auto tail_length = v.rfind("_t"sv);
      auto v1 = v.substr(0, (tail_length == std::string_view::npos) ? v.length() : tail_length);
      constexpr auto end = v.rfind("::"sv);
      return v1.substr((end == std::string_view::npos) ? 0 : end + 2);
    }

    auto This() { return static_cast<T &>(*this); }
    [[nodiscard]] auto This() const { return static_cast<T const &>(*this); }

    // auto This() -> T & { return static_cast<T &>(*this); }
    // auto This() const -> T const & { return static_cast<T const &>(*this); }
  };

  class rect_t : public base_t<rect_t> {
  public:
    using base_type::base_type;
    ~rect_t() override = default;

    rect_t(int t, int l, int b, int r) : _t(t), _l(l), _b(b), _r(r) {}
    rect_t(rect_t &&o) : _t(o._t), _l(o._l), _b(o._b), _r(o._r) {}
    rect_t &operator=(rect_t &&o) {
      _t = (o._t), _l = (o._l), _b = (o._b), _r = (o._r);
      return (*this);
    }

    // [[nodiscard]] std::string name() const override { return "rect"; }
    [[nodiscard]] std::string to_string() const override {
      std::stringstream ss;
      ss << name() << '[' << _t << ',' << _l << ',' << _r << ',' << _b << ']';
      return ss.str();
    }

  private:
    int _t, _l, _b, _r;
  };


  void test1() {
    using namespace aml::res;
    rect_t const rc(1, 2, 3, 4);
    std::cout << rc << '\n';
  }

  class canvas_t {
  public:
    canvas_t() = default;
    ~canvas_t() = default;

    using elem_sp = std::unique_ptr<base>;
    using container_t = std::vector<elem_sp>;

    template<typename T, typename... Args>
    void emplace_back(Args &&...args) {
      auto p = std::make_unique<T>(std::forward<Args>(args)...);
      _coll.emplace_back(std::move(p));
    }

    friend std::ostream &operator<<(std::ostream &os, canvas_t const &o) { return o.write(os); }

  protected:
    std::ostream &write(std::ostream &os) const {
      os << "Canvas:" << '\n';
      int idx{0};
      for (auto const &el : _coll) {
        auto const *ptr = el.get();
        os << std::setw(5) << ++idx << ". " << (*el) << ' ' << std::hex << (long long) ptr << '\n';
      }
      return os;
    }

  private:
    container_t _coll;
  };

  void test2() {
    canvas_t c;
    c.emplace_back<rect_t>(1, 2, 3, 4);
    std::cout << c << '\n';
  }

} // namespace aml::res

auto main() -> int {
  aml::res::test1();
  aml::res::test2();
}
```

这个例子将会输出类似于下面的效果：

```bash
rect[1,2,4,3]
Canvas:
    1. rect[1,2,4,3] 7f9eeff05d10
```

示例代码中，`aml::debug::type_name()` 是一个编译期工具类，目的是提取出当前类名，稍作变换之后得到一个字符串字面量，省去了我们在每个派生类中重复编写类型名代码。这个工具类在我的开源库 hicc 或者 cmdr-cxx 或者其它我的 cxx 开源库中都能找得到，所以不再额外列举。如果你试图 play 上面的代码，也可以手工编写一小段代码（如同我们在 rect_t 类中注释掉的那段代码那样）就可以了。



### 多态如何实现的

尽管从视觉直觉上我们往往以为只有 `base->do_sth()` 才能激发多态性，但这个认识并不完整：实际上 `base.do_sth()` 同样能激发多态特性。

C++ 的多态特性依赖于两个前提的同时具备：

1. 虚拟函数及其重载的存在
2. 虚析构函数的存在

首先来讲，你必须在基类做出虚拟函数宣告。一般地，它多半是纯虚的，如同下例中的 `to_string()`：

```c++
class base {
  public:
  base() = default;
  virtual ~base() = default;
  [[nodiscard]] virtual std::string to_string() const = 0;
  friend std::ostream &operator<<(std::ostream &os, base const &o) { return os << o.to_string(); }
};
```

大多数编译器将会在察觉到虚拟函数存在的情况下构造和生成 vtable，这是一个虚拟函数地址表，它列举了一个派生类中所实现的全部基类虚拟函数的清单。一个派生类的实例的指针，其内存结构中包含着指向它所属类型的公共 vtable 的指针，所以在 C++ 代码上无论如何从派生类降级到基类指针，但在内存结构里它都是在寻找它自身的 vtable 的——也就是说，C++ 语义上的降级并不引起 vtable 指向也被同时降级，那样做反而是不自然、不合理的。这一点，甚至无需描绘图解示例，就能令你完全理解一个降级后的指针为什么能够调用到多态函数的正确目标。当然我知道有很多人曾经做过非常好的示意图来帮助你理解 vtable，vpointer 和多态的实现机制，但是本质也就一句话不是吗：C++ 语义上的派生类指针降级，并不改变指针指向的内存结构，以及在那个结构中所指示的 vtable。

> arias 的 post 就有这样的示意图： [Understandig Virtual Tables in C++ - pablo arias](https://pabloariasal.github.io/2017/06/10/understanding-virtual-tables/) 

每个编译器在这里的实现细节都有所不同。不过这已经不是我们所必须考证的问题了。

> 假设每个类实例都包含一个到它的类型 vtable 的指针，而每个 vtable 都包含一个内部的双向链表分别指向类层次的上级和下级，那么这个数据结构就能够完全支持多态的任何场景了。
>
> 但是 C++ 允许多个基类、同时也可以任意派生，所以简单的双向链表只能用在单父单子的场合，实作时还需要进一步扩展。



其次则是虚析构函数问题。



如果基类没有虚析构函数宣告，每一级派生类没有重载虚析构函数，那么导致的后果将会是从缺失的父类开始向上直到根一级基类中的所有析构函数都不会被调用。也就是说，派生类在析构自己时，它的基类成员可能并没有被正确的释放。这带来的后果可能是相当严重的。

所以当设计类体系的时候，第一件事是编制基类的声明，并且第一件事中的第一件事是给它写一个 `virtual ~base() = default;` 的虚析构函数宣告。

>一些人总喜欢剑走偏锋，说那我的所有基类根本不声明数据成员不就行了？
>
>可惜的是，这种人自以为得计，其实这个想法是坏的。每个人都建构了自己的一套世界观和思维模式，以及行为模式。错误的思维模式就可以称之为脑壳坏掉，因为得出的结论总会是错的。这一点非常遗憾。
>
>回到问题本身来，避开了释放数据成员问题，然而依赖于 RAII 的自动清理就避不开了。那就意味着存在某些资源可能无法被释放。这样的衍生问题、设计模式的破坏，大概不是单纯采用脑力补全所能弥补的。
>
>所以正确的思维模式、编程范式的目的在于让你有套路可循，每一层都是稳固的，然后层层叠叠地建立起高楼大厦，才也是稳固的。地基不稳，上面就不必做了。



### 回到容器中来

好，我们已经知道了多态并不需要受制于 `->` 和 `.` 的区别，这些区别都是 C++ 语义层面上的，不会更改一个对象示例指针中所附着的类型指针以及对应类型的 vtable 地址。

所以一个对象容器作为对象生命周期的管理者，它理所当然地可以使用：

```c++
using elem_sp = std::unique_ptr<base>;
using container_t = std::vector<elem_sp>;
```

来管理元素集合。

这个方法，如同前文示例代码中所做的那样，在容器中排他性地管理全部元素的实例。它没有足够友善的单个元素的暴露接口。就是说，从容器中得到的是一个 unique_ptr，这是不利于他人做参考引用的。如果你要建立元素之间的关联关系，使用 unique_ptr 就不是合乎时宜的设计方案了。

这种时候就必须改为 shared_ptr，当然设计师也需要更多地关注元素生存周期的控制，防止实例引用关系的循环递归，等等。

> 一个 unique_ptr 是可以在之后通过赋值（实质上是右值移动）转换为 shared_ptr 的。但这会导致所有权的移交，于实际场景无补，所以应该是采用 `vector<shared_ptr<elem>>` 的方式来持有元素实例，然后公开 weak ptr 供访问和建构关联关系，仅在受限场景中提供 shared_ptr 副本的衍生。

这一部分内容，涉及到类体系的总体架构问题，今天就不展开了。以后有精力时再考虑吧。但后面会给出一个经过改善的版本的源代码略作展示。

> 元素创建，可以套用工厂模式，我写过一篇 [谈 C++17 里的 Factory 模式](https://hedzr.com/c++/algorithm/cxx17-factory-pattern/) 。后来，为了做的更元编程，更无依赖，又制作了一个更通用的新的版本： [谈 C++17 里的 Factory 模式之二](https://hedzr.com/c++/algorithm/cxx17-factory-pattern-2/)。
>
> 元素访问，可以套用观察者模式和访问者模式，嗯，这个就多了，我写过好几篇：
>
> [谈 C++17 里的 Visitor 模式](https://hedzr.com/c++/algorithm/cxx17-visitor-pattern/)
>
> [谈 C++17 里的 Observer 模式](https://hedzr.com/c++/algorithm/cxx17-observer-pattern/)
>
> [谈 C++17 里的 Observer 模式 - 补/2](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-2/)
>
> [谈 C++17 里的 Observer 模式 - 再补/3](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-3/)
>
> [谈 C++17 里的 Observer 模式 - 4 - 信号槽模式](https://hedzr.com/c++/algorithm/cxx17-observer-pattern-4/) 



### 更完整的示例

基于上文中的例子，对类体系做了充实并改善后的例子是这样的：

```c++
namespace aml::res {

  class elem : public std::enable_shared_from_this<elem> {
  public:
    virtual ~elem() = default;
    [[nodiscard]] virtual std::string to_string() const = 0;
    friend std::ostream &operator<<(std::ostream &os, elem const &o) { return os << o.to_string(); }

  protected:
    elem() = default;
  };

#define AML_DRAWING_NAME                                                                       \
  [[nodiscard]] constexpr std::string_view name() const {                                      \
    using namespace std::string_view_literals;                                                 \
    constexpr auto v = aml::debug::type_name<parent_type>();                                   \
    constexpr auto tail_length = v.rfind("_t"sv);                                              \
    auto v1 = v.substr(0, (tail_length == std::string_view::npos) ? v.length() : tail_length); \
    constexpr auto end = v.rfind("::"sv);                                                      \
    return v1.substr((end == std::string_view::npos) ? 0 : end + 2);                           \
  }

  template<typename T>
  class base_t : public elem {
  public:
    ~base_t() override = default;

    using root_type = elem;
    using parent_type = T;
    using base_type = base_t<parent_type>;
    AML_DRAWING_NAME

    // friend std::ostream &operator<<(std::ostream &os, T const &o) { return os << o.to_string(); }

    auto This() { return static_cast<T &>(*this); }
    [[nodiscard]] auto This() const { return static_cast<T const &>(*this); }

    // auto This() -> T & { return static_cast<T &>(*this); }
    // auto This() const -> T const & { return static_cast<T const &>(*this); }

  public:
    template<typename... Args>
    static std::shared_ptr<parent_type> create(Args &&...args) {
      struct make_shared_enabler : public parent_type {};
      return std::make_shared<make_shared_enabler>(std::forward<Args>(args)...);
    }
  };

  class point_t : public base_t<point_t> {
  public:
    using base_type::base_type;
    ~point_t() override = default;

    point_t(int x, int y) : _x(x), _y(y) {}
    point_t(point_t &&o) : _x(o._x), _y(o._y) {}
    point_t &operator=(point_t &&o) {
      _x = (o._x), _y = (o._y);
      return (*this);
    }

    // [[nodiscard]] std::string name() const override { return "point"; }
    [[nodiscard]] std::string to_string() const override {
      std::stringstream ss;
      ss << name() << '[' << _x << ',' << _y << ']';
      return ss.str();
    }

  protected:
    int _x, _y;
  };

  class line_t : public base_t<line_t> {
  public:
    using base_type::base_type;
    ~line_t() override = default;

    line_t(int t, int l, int b, int r) : _t(t), _l(l), _b(b), _r(r) {}
    line_t(line_t &&o) : _t(o._t), _l(o._l), _b(o._b), _r(o._r) {}
    line_t &operator=(line_t &&o) {
      _t = (o._t), _l = (o._l), _b = (o._b), _r = (o._r);
      return (*this);
    }

    // [[nodiscard]] std::string name() const override { return "line"; }
    [[nodiscard]] std::string to_string() const override {
      std::stringstream ss;
      ss << name() << '[' << _t << ',' << _l << '-' << _r << ',' << _b << ']';
      return ss.str();
    }

  protected:
    int _t, _l, _b, _r;
  };

  class rect_t : public base_t<rect_t> {
  public:
    using base_type::base_type;
    ~rect_t() override = default;

    rect_t(int t, int l, int b, int r, int arc = 0) : _t(t), _l(l), _b(b), _r(r), _arc(arc) {}
    rect_t(rect_t &&o) : _t(o._t), _l(o._l), _b(o._b), _r(o._r), _arc(o._arc) {}
    rect_t &operator=(rect_t &&o) {
      _t = (o._t), _l = (o._l), _b = (o._b), _r = (o._r), _arc = (o._arc);
      return (*this);
    }

    // [[nodiscard]] std::string name() const override { return "rect"; }
    [[nodiscard]] std::string to_string() const override {
      std::stringstream ss;
      ss << name() << '[' << _t << ',' << _l << ',' << _r << ',' << _b << '|' << _arc << ']';
      return ss.str();
    }

  protected:
    int _t, _l, _b, _r;
    int _arc;
  };

  class ellipse_t : public rect_t {
  public:
    ~ellipse_t() override = default;

    using base_type = rect_t;
    using parent_type = ellipse_t;
    using base_type::base_type;
    AML_DRAWING_NAME

    [[nodiscard]] std::string to_string() const override {
      std::stringstream ss;
      ss << name() << '[' << _t << ',' << _l << ',' << _r << ',' << _b << '|' << _arc << ']';
      return ss.str();
    }
  };


  void test1() {
    using namespace aml::res;
    rect_t const rc(1, 2, 3, 4);
    std::cout << rc << '\n';
  }

  class canvas_t : public std::enable_shared_from_this<canvas_t> {
  public:
    canvas_t() = default;
    ~canvas_t() = default;

    using elem_sp = std::shared_ptr<elem>;
    using container_t = std::vector<elem_sp>;

    // factory method here
    template<typename T, typename... Args>
    void emplace_back(Args &&...args) {
      auto p = std::make_shared<T>(std::forward<Args>(args)...);
      _coll.emplace_back(std::move(p));
    }

    friend std::ostream &operator<<(std::ostream &os, canvas_t const &o) { return o.write(os); }

    // example for shared_from_this
    elem_sp rent_first() { return _coll.front()->shared_from_this(); }

  protected:
    std::ostream &write(std::ostream &os) const {
      os << "Canvas:" << '\n';
      int idx{0};
      for (auto const &el : _coll) {
        auto const *ptr = el.get();
        os << std::setw(5) << ++idx << ". " << (*el) << ' ' << std::hex << (long long) ptr << '\n';
      }
      return os;
    }

  private:
    container_t _coll;
  };

  void test2() {
    canvas_t c;
    c.emplace_back<rect_t>(1, 2, 3, 4);
    c.emplace_back<ellipse_t>(1, 2, 3, 4);
    c.emplace_back<point_t>(1, 2);
    c.emplace_back<line_t>(1, 2, 3, 4);
    std::cout << c << '\n';

    auto sp = c.rent_first();
    std::cout << *sp << '\n';
  }

} // namespace aml::res

auto main() -> int {
  aml::res::test1();

  using namespace aml::res;
  std::cout << std::boolalpha
            << "base: " << std::is_polymorphic<elem>::value << '\n'
            << "rect: " << std::is_polymorphic<rect_t>::value << '\n'
            << "ellipse: " << std::is_polymorphic<ellipse_t>::value << '\n'
            << "canva: " << std::is_polymorphic<canvas_t>::value << '\n';

  aml::res::test2();
}
```

它的输出结果如同预期：

```bash
rect[1,2,4,3|0]
base: true
rect: true
ellipse: true
canva: false
Canvas:
    1. rect[1,2,4,3|0] 7f9016705b28
    2. ellipse[1,2,4,3|0] 7f9016705b78
    3. point[1,2] 7f9016705bc8
    4. line[1,2-4,3] 7f9016705d98

rect[1,2,4,3|0]
```

最后一行结果源于 `rent_first()` 返回的 `shared_ptr<elem>` 智能指针。这里展示了如何正确地从对象内部抽出它的智能指针包装版，避免直接抽出 *this 带来引用计数脱钩的问题。

但是对于当前案例设计，实际上它是多余的，无需如此。`shared_from_this()` 的用途是在于这样的场景，你没有办法从类内部获得它的 shared_ptr 版本时。这种情景通常出现在一个 elem 派生类中有一个 work 线程要跑，但此时线程循环体中无法拿到 this 的智能指针，唯一的解决方案就是基类实现到 enable_shared_from_this 的派生，然后循环体中就可以使用 shared_from_this 拿到正确的 shared_ptr 了。所以它并不是对管理类对外支出用的，在那里管理类 canvas_t 本可以直接拿到 elem 的 shared_ptr 版本，没必要多此一举了。示例代码只是为了强调和演示一下罢了。



## 多态概念（Polymorphism）

### 什么是多态

多态这个概念，是指为不同数据类型的实体提供统一的接口。

从这个角度来看，它有很多种实现的可能性。例如在 Golang 中就采用 `type Base interface { Paint() }` 这样的接口类型定义来声明一个多态基准类型，其它任何实现了 `Paint()` 函数接口的 struct 都在编译器的管理下被归结为实现了 Base 接口，这就形成了事实上的多态。

而 C++ 则是在类继承的体系上，通过基类中的虚拟函数宣告来要求派生类按需重载之，重载的后果是一个派生类指针在跳用该函数时将会自动调用到重载后的版本，不同的派生类据此各自完成重载，于是通过不同类型的指针也就能调用到各自重载后的版本。与此同时，所有派生类的指针都可以降级为一个基类类型指针，然而即使降级也不会影响到调用虚拟函数重载版本的正确性。所以这就是 C++ 的多态表现。

下面的简单例子说明了这个效果：

```c++
struct A {
  virtual ~A() = default;
  virtual void run() = 0;
};

struct B : public A {
  virtual ~B() = default;
  virtual void run() { std::cout << "B" << '\n'; };
};

struct C : public A {
  virtual ~C() = default;
  virtual void run() { std::cout << "C" << '\n'; };
};

auto main() -> int {
  A* ptr;
  B b;
  C c;
  ptr = &b;
  ptr->run(); // prints "B"
  ptr = &c;
  ptr->run(); // prints "C"
}
```

### 编译期多态

上面给出的例子展示了 C++ 经典版本的多态性，这是运行期的。

结合前文谈及的多态实现方案，也即 vtable 方案，在运行期的多态需要付出间接寻址和查找 vtable 表项，甚至于可能需要沿着派生链条上下导航的开销，所以整体上将是有额外开销的。

编译期多态则没有运行时开销。但它就需要付出编译时间延长的开销来提前解决指向问题。

C++ 编译期多态一般来说时通过模板类元编程的方式来实现的，这个方法具体来讲是 CRTP 惯用法。我在以前的 Posts 中也都有提到过，见于：

- [谈 C++17 里的 Builder 模式 - 3.1. CRTP](https://hedzr.com/c++/algorithm/cxx17-builder-pattern/#crtp) 
- [C++ 元编程技术笔记 - 8. CRTP](https://hedzr.com/cxx/c++-requires#crtp)

在本文中的示例代码中，`base_t<T>` 模板类就包含了 CRTP 惯用法实现代码，你可以在派生类中直接使用 This() 来发起调用。



### 运行时多态的一个改善方案

这种方法是利用嵌套类作为抽象基类接口的方式来达成的，参见前文的介绍：

-  [理解 declval 和 decltype - 2.3. Runtime Polymorphism](https://hedzr.com/c++/algorithm/cxx-std-declval-and-decltype/#runtime-polymorphism) 



### More

如果跨越语言的界限，从计算机科学学科的层面来研究的话，多态还可以有更多的表现。

这些理论性到实践的案例与研究就不做展开了，详见参考引用章节。



## 后记

这几天偶然想起 unique_ptr 放在 vector 中的问题，一个方面是确切类型问题，一个方面是自动推导问题。于是乎就干脆将其根基先整理出来，似乎当作入门材料也还是可以的。

当然，还是要基本掌握时求进阶才能看。

### 你是在反对智能指针的使用吗

显然，不是的。

有的人经历了不一样的苦难，那他有所抱怨。

但是所有人都需要向前走而不停歇。

无论多么讨厌变化，也一定要拥抱变化。能够欣然更好。

### REFs

- [Polymorphism (computer science) - Wikipedia](https://en.wikipedia.org/wiki/Polymorphism_(computer_science))
- [Virtual method table - Wikipedia](https://en.wikipedia.org/wiki/Virtual_method_table)
- [std::is_polymorphic - cppreference.com](https://en.cppreference.com/w/cpp/types/is_polymorphic)

🔚



