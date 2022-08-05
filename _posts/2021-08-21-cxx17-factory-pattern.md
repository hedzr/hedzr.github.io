---
layout: single
title: 谈 C++17 里的 Factory 模式
date: 2021-08-22 14:50:00 +0800
last_modified_at: 2021-08-28 05:01:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,factory pattern,abstract factory pattern,design patterns,工厂模式,设计模式]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/factory-method-en.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  回顾工厂模式的各种可能的实现，尝试建立其 C++17 中的最优解 ...
---



> 本文不适合初学者，你应该已经对 Factory 模式有所了解，你对于 C++17 的常见特性也不陌生。

## Factory Pattern

回顾下工厂模式，并考虑实现一个通用的工厂模板类以达成业务端低代码的目标。

![Factory Method&nbsp;pattern](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/factory-method-en.png)

> FROM: [Refactoring Guru](https://refactoring.guru/images/patterns/content/factory-method)

## 理论

Factory 模式是 [Creational Patterns](https://en.wikipedia.org/wiki/Creational_pattern) 中的一种。

### 创建型模式

所谓的创建型模式，主要包含这几种：

- [Abstract factory](https://en.wikipedia.org/wiki/Abstract_factory_pattern) 抽象工厂模式。一组具有同一主题的对象创建工厂被单独封装起来，而多组不同的对象工厂具有统一抽象的创建接口，该抽象的创建接口即为抽象工厂。
- [Builder](https://en.wikipedia.org/wiki/Builder_pattern) 构建者模式。目的是为了构造出一个复杂对象，有必要将其包含的各种属性分门别类地依次设定，以便令构造过程易于管理。一般采用链式调用方式，而在属性构造完毕之后，一个发令枪（例如 build()）将指挥该复杂对象被最终构造为实例。
- [Factory method](https://en.wikipedia.org/wiki/Factory_method_pattern) 古典的工厂模式。工厂方法模式。一般有一个静态的 create() 以便创建对象的实例。
- [Prototype](https://en.wikipedia.org/wiki/Prototype_pattern) 原型模式。通过复制一个已有类型的方式创建新实例，即 clone()
- [Singleton](https://en.wikipedia.org/wiki/Singleton_pattern) 单例模式。全局只有一个对象实例。

以上为 [GoF 的经典划分](https://en.wikipedia.org/wiki/Design_Patterns#Creational)。不过，几乎三十年过去了，现在还有更多的创建型模式：

- 和 Builder 略有不同的 生成器模式（generator pattern）
- 延迟初始化模式。Kotlin 中的 lazyinit 关键字是它的一种语言性支持。
- 对象池模式。如果对象的创建相当耗时或者耗资源，那么一次性提前创建一组对象，需要时取用，用完后放回池子里。
- 等等。



### 工厂模式

本文中提到工厂模式时，泛指 Factory Method，Factory，Abstract Factory 等等。综合起来看，工厂模式是指借助于一个厂房 Factory 来创建产品 Product 的某种编程范式。其目的是为了让消费者（业务端代码）不去关心产品怎么制造出来的（简单地通过 Factory.create() 就能够得到），只需直接关心怎么使用产品就行了。

从另一角度看，工厂模式具有这样的特性：我知道工厂能够造清污产品，但是肥皂还是香皂就无所谓了，我想有点香味的，工厂就将会造香皂给我，我没有要求的，工厂造给我的可能就是肥皂了。也就是说，接口是那个样子，但工厂将会造出来的一定符合这个接口约定，但究竟是那个类的实例就不一定了（通常会由创建参数来决定）。

在编程实践上，工厂模式总是伴随着一个产品根类，这是一个接口类，通常包含一系列抽象方法作为业务端操作接口。对于复杂的产品族来说则在该接口类的基础上会继续派生若干品类。



#### Factory Method

最古典的工厂模式是 [Factory Method](https://en.wikipedia.org/wiki/Factory_method_pattern)，由 [GoF](https://en.wikipedia.org/wiki/Design_Patterns) 首次论述的一种 Pattern。

以 Point 为例，

```c++
namespace cmdr::dp::factory::classical {

    class classical_factory_method;

    class Transport {
    public:
        virtual ~Transport() {}
        virtual void deliver() = 0;
    };

    class Trunk : public Transport {
        float x, y;

    public:
        explicit Trunk(double x_, double y_) { x = (float)x_, y = (float)y_; }
        explicit Trunk(float x_, float y_) { x = x_, y = y_; }
        ~Trunk() = default;
        friend class classical_factory_method;
        void deliver() override { printf("Trunk::deliver()\n"); }
        friend std::ostream &operator<<(std::ostream &os, const Trunk &o) { return os << "x: " << o.x << " y: " << o.y; }
    };

    class Ship : public Transport {
        float x, y;

    public:
        explicit Ship(double x_, double y_) { x = (float)x_, y = (float)y_; }
        explicit Ship(float x_, float y_) { x = x_, y = y_; }
        ~Ship() = default;
        friend class classical_factory_method;
        void deliver() override { printf("Ship::deliver()\n"); }
        friend std::ostream &operator<<(std::ostream &os, const Ship &o) { return os << "x: " << o.x << " y: " << o.y; }
    };

    class classical_factory_method {
    public:
        static Transport *create_ship(float r_, float theta_) {
            return new Ship{r_ * cos(theta_), r_ * sin(theta_)};
        }
        static Transport *create_trunk(float x_, float y_) {
            return new Trunk{x_, y_};
        }
        static std::unique_ptr<Ship> create_ship_2(float r_, float theta_) {
            return std::make_unique<Ship>(r_ * cos(theta_), r_ * sin(theta_));
        }
        static std::unique_ptr<Trunk> create_trunk_2(float x_, float y_) {
            return std::make_unique<Trunk>(x_, y_);
        }

        template<typename T, typename... Args>
        static std::unique_ptr<T> create(Args &&...args) {
            return std::make_unique<T>(args...);
        }
    };

} // namespace cmdr::dp::factory::classical

void test_factory_classical() {
    using namespace cmdr::dp::factory::classical;
    classical_factory_method f;

    auto p1 = f.create_trunk(3.1f, 4.2f);
    std::cout << p1 << '\n';
    p1->deliver();

    auto p2 = f.create_ship(3.1f, 4.2f);
    std::cout << p2 << '\n';
    p2->deliver();

    auto p3 = f.create_ship_2(3.1f, 4.2f);
    std::cout << p3.get() << '\n';
    p3->deliver();

    auto p4 = f.create<Ship>(3.1f, 4.2f);
    std::cout << p4.get() << '\n';
    p4->deliver();
}
```

按照古典的表述，工厂方法模式建议使用特殊的*工厂*方法代替对于对象构造函数的直接调用 （即使用 `new`运算符）。 不用担心， 对象仍将通过 `new`运算符创建， 只是该运算符改在工厂方法中调用罢了。 工厂方法返回的对象通常被称作 “产品”。

但是在现代 C++ 中，拒绝 new delete 的显式出现（甚至也拒绝*裸*指针的出现），所以上面的表述也需要微微调整一下。可能会像这样：

```c++
static std::unique_ptr<Ship> create_ship_2(float r_, float theta_) {
  return std::make_unique<Ship>(r_ * cos(theta_), r_ * sin(theta_));
}
static std::unique_ptr<Trunk> create_trunk_2(float x_, float y_) {
  return std::make_unique<Trunk>(x_, y_);
}
```

使用时也要微调，但也可以几乎没变化（因为智能指针的封装能力）：

```c++
    auto p3 = f.create_ship_2(3.1, 4.2);
    std::cout << *p3.get() << '\n';
    p3->deliver();
```

如此。

##### 评讲

工厂方法模式的特点在于将创建一个子类对象的代码集中放到一个独立的工厂类中来进行管理，对于每个子类来说通常会有一个专门的方法相对应，这也是 Factory Method 一名的由来。

工厂方法模式的优势很明显，劣处也不少。

其优势在于集中的创建点，易于维护，若有设计调整或者需求变更都可以很容易地甚至是不必调整业务代码。调用工厂方法的代码 （以下均称为*业务*代码） 无需了解不同子类返回实际对象之间的差别。 业务代码将所有产品视为抽象的 `Point` 。 业务代码知道所有 Point 对象都提供 `at` 方法， 但是并不关心其具体实现方式。

其劣势在于较为僵硬，新增产品的话将会带来比较糟的后果。一般来讲，总是会有若干重复的 create() 方法和新产品相配套，这使得类库版本迭代成为不大不小的问题，又或者会导致用户无法自行添加产品实现类。



##### 改进

在 Modern C++ 中借助于模板变参（C++17 or later）和完美转发有可能能够削减创建方法，将其糅合为一个单一的函数：

```c++
class classical_factory_method {
  public:
  template<typename T, typename... Args>
  static std::unique_ptr<T> create(Args &&...args) {
    return std::make_unique<T>(args...);
  }
};
```

使用时像这样：

```c++
    auto p4 = f.create<Ship>(3.1, 4.2);
    std::cout << *p4.get() << '\n';
    p4->deliver();
```

这会使得编码上很简练，对于添加一个新产品的情况也很友好，几乎无需对 factroy 做任何修改。

> 稍后我们还将提供一个更加改善的 factory 模板类，可以解决这些问题。



#### Inner

将工厂方法模式的实现略微调整一下，把创建新实例的方法分散到每个产品类当中，可以构成 Inner 方式的 Factory Method。一般地可能仅仅将其视为 Factory Method 的变体。

```c++
namespace hicc::dp::factory::inner {

    class Transport {
    public:
        virtual ~Transport() {}
        virtual void deliver() = 0;
    };

    class Trunk : public Transport {
        float x, y;

    public:
        explicit Trunk(float x_, float y_) { x = x_, y = y_; }
        ~Trunk() = default;
        void deliver() override { printf("Trunk::deliver()\n"); }
        friend std::ostream &operator<<(std::ostream &os, const Trunk &o) { return os << "x: " << o.x << " y: " << o.y; }
        static std::unique_ptr<Trunk> create(float x_, float y_) {
            return std::make_unique<Trunk>(x_, y_);
        }
    };

    class Ship : public Transport {
        float x, y;

    public:
        explicit Ship(float x_, float y_) { x = x_, y = y_; }
        ~Ship() = default;
        void deliver() override { printf("Ship::deliver()\n"); }
        friend std::ostream &operator<<(std::ostream &os, const Ship &o) { return os << "x: " << o.x << " y: " << o.y; }
        static std::unique_ptr<Ship> create(float r_, float theta_) {
            return std::make_unique<Ship>(r_ * cos(theta_), r_ * sin(theta_));
        }
    };

} // namespace hicc::dp::factory::inner
```

有时候，没有集中的 factory class 也许是恰当的。这就是为什么我们要强调 inner factory method pattern 的原因。



##### 改进

为了利用一个集中的 factory class 的优点（集中统一的入口可以有利于代码维护、业务层级的维护——例如埋点），即使是 Inner FM Pattern 也可以提供一个 helper class/function 来做具体的调用，我们可以考虑 Modern C++ 的 SFINAE 特性。

在元编程的世界里，既然所有 product 对象总是会实现 create （以及 clone 方法），那么我们可以很容易地利用 SFINAE 技术（以及 C++17 的参数包展开，模板变参，折叠表达式）来构造它的实例：

```c++
template<typename T, typename... Args>
inline std::unique_ptr<T> create_transport(Args &&...args) {
  return T::create(args...);
}
```

而且甚至无需什么高超的编码技巧（尽管学习技巧时会有一定的痛苦性，但代码写出来后看起来是无需什么技巧的，一切都显得平平无奇，符合直觉，多数人都能理解，对于 reviewers 也非常友好）。

使用时会是这样子：

```c++
void test_factory_inner() {
    using namespace hicc::dp::factory::inner;
    
    auto p1 = create_transport<Trunk>(3.1, 4.2);
    std::cout << *p1.get() << '\n';
    p1->deliver();

    auto p2 = create_transport<Ship>(3.1, 4.2);
    std::cout << *p2.get() << '\n';
    p2->deliver();
}
```

当然也可以这样子：

```c++
    auto p3 = Ship::create(3.1, 4.2);
    std::cout << *p3.get() << '\n';
    p3->deliver();
```

看起来也还行。

##### 评讲

综合来看 Factory Method 的几种形态，不仅仅是 Inner 方式的，也包括正统的 Factory Method 模式。

它们的共性在于抽出了一个明显的 creator 作为方法，这个方法被放在何处姑且不论，但这么做的目的首先是为了解除创建者和具体产品之间的紧密耦合，于是我们可以采用多种手段来做到更好的分离。此外，由于我们往往会将产品创建代码集中放置在某个位置，例如 factory class 中，所以代码更容易维护，这也是单一职责原则的目标。转而研究业务代码，我们会发现在必要的改进后新增产品类型甚至可以几乎不影响到业务代码的变更，所以这一方面 Factory Method 也是有优势的。

至于缺点，在经过了前文提及的几种 Modern C++ 基础上的改进之后，基本上没有缺点了，或者，子类可能太多太分离，导致类继承体系有时候膨胀到管理困难，也算是一种缺点了。



#### Abstract Factory

由于这个命名的原因，我们可能常常会将它和 C++ 的 Abstract class、Virtual Method，Polymorphic object 相互混淆起来。

但实际上两者之间并无必然的因果关系。

好的例子难寻，所以下面我们借用 [Refactoring Guru 的范例](https://refactoringguru.cn/design-patterns/abstract-factory) 来做简单解说，我们推荐你在本文基础上去阅读  [Refactoring Guru 的 常用设计模式有哪些？](https://refactoringguru.cn/design-patterns) 

假设你正在开发一款家具商店模拟器。 你的代码中包括一些类， 用于表示：

1. 一系列相关产品， 例如 `椅子Chair` 、  `沙发Sofa` 和  `咖啡桌Coffee­Table` 。
2. 系列产品的不同变体。 例如， 你可以使用 `现代Modern` 、  `维多利亚Victorian` 、  `装饰风艺术Art­Deco` 等风格生成 `椅子` 、  `沙发`和 `咖啡桌` 。

![生成不同风格的系列家具。](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/problem-zh.png)

所以，Abstract Factory 的特点就在于工厂可以以某种特定的风格统一地创建所有产品，而不是仅仅创建了产品就完事。这样的对于多种维度进行控制的能力，才是 Abstract Factory 的独有之处。

换而言之，另外考虑，在 UI 控件上引入多种风格（Metro，Fluent，Apple，Material Design 等等），以及引入多种主题（红色，白色，暗色等等），这样的创建工厂，才是抽象工厂。

除了多维度之外，进一步地推进这个理解，实际上椅子和沙发是完全不同的两种产品，只不过它们都有“家具”这一共性，所以“木工工厂”这家抽象工厂才会一起办了。也因此我们需要注意到抽象工厂的另一特色在于它可能创建多种系列的产品，椅子系列，桌子系列等等。

如此一来，抽象工厂将可以创建：Point,  Line, Arc, Ellipse, Circle, Rect, Rounded Rect 等等一系列的 Shapes，而且可以控制它们的填充色和边框线等等等等。

##### 评讲

由于示例代码将会明显地庞大，所以没有示例代码。但想必经由前文表述后，你能够轻易透彻地理解什么是 AF，它和 FM 有何区别。

事实上，抽象工厂和工厂方法模式有一定的继承关系。将工厂方法进一步拓展就可以得到抽象工厂。所以它们两者的界限也没有那么明晰。并且在大多数架构设计中，一开始还是简简单单的 inner，随后就会重构为一个具体的 factory class，从而形成 FM 模式，紧接着引入更多对象，继续重构对象以进行分组分类，抽取共性，引入主题，于是就开始演变为抽象工厂模式。



### 小小结

和 generator/builder 模式不同，工厂模式总是一次性地立即返回对象新实例，而前者更关心怎么去分步骤地、循序渐进地构造出一个复杂对象。

业务代码面对 factory class 就可以了，再加上产品体系中的各种接口抽象类。这就是所谓的，我无需知道有哪些产品，我只需知道提供什么原料怎么操作就能生产出符合要求的产品。





## factory 模板类

我们当然不会止步于前。

如果仅仅只是对几种古老的 Patterns 做出 Modern C++ 的改进型的话，到此本文就可以为止了。不过我还不想满足于此，因为这样的 Posts 应该已经有不少了。所以说人就是会不满足的。

那么现在，不去回忆 factory pattern 的若干特点、优点、缺点，我们将思路清空，重新来做一番设计。

我们想要做一个通用的 Factory Pattern 的工厂模板类，目的是省去 create method 的编写，因为它常常是 boring 的重复的，此外我们也不想总是要编写一个 factory class 的骨架，而是想要在有一组 products 类之后就能自动有一个配套工厂。

### 实现

首先来讲，一系列的 products 类实际上可以被用作模板的变参；

其次而言从一个类型名上、在编译期我们已经有一个工具能够取得类名（[`hicc::debug::type_name<T>()`](https://github.com/hedzr/hicc/blob/master/libs/hicc/include/hicc/hz-dbg.hh#L207)）。

这样，我们将能够构造一个 tuple，将类名和 creator 打包后堆放到 tuple 中。

> 之所以使用 tuple，是因为我们想利用 C++17 std::tuple 的形参包展开语法。
>
> 如果不借助于 std::tuple，那么我们需要这样的片段：
>
> ```c++
> template<typename product_base, typename... products>
> struct factory {
>   template<typename T>
>   struct clz_name_t {
>     std::string_view id = debug::type_name<T>();
>     T data;
>   };
>   auto named_products = {clz_name_t<products>...};
> };
> ```
>
> 但这会引发一系列的编码问题。
>
> 或者也许你认为使用 `std::map<std::string, std::function<T()> >` 是一种好想法？
>
> 不妨事，如果真的有兴趣，你可以试试做相应的改写。

而当这么一个 tuple 在手之后，我们可以根据传入的类名标识字符串来搜索对应的对象的实例构造器，然后完成对象的实例化。

所以我们可以有这样一个实现方案：

```c++
namespace hicc::util::factory {

  template<typename product_base, typename... products>
  class factory final {
    public:
    CLAZZ_NON_COPYABLE(factory);
    template<typename T>
    struct clz_name_t {
      std::string_view id = debug::type_name<T>();
      T data;
    };
    using named_products = std::tuple<clz_name_t<products>...>;

    template<typename... Args>
    static std::unique_ptr<product_base> create_unique_ptr(const std::string_view &id, Args &&...args) {
      std::unique_ptr<product_base> result{};

      std::apply([](auto &&...it) {
        ((static_check<decltype(it.data)>()), ...);
      },
                 named_products{});

      std::apply([&](auto &&...it) {
        ((it.id == id ? result = std::make_unique<decltype(it.data)>(args...) : result), ...);
      },
                 named_products{});
      return result;
    }
    template<typename... Args>
    static product_base *create(const std::string_view &id, Args &&...args) {
      return create_unique_ptr(id, args...).release();
    }

    private:
    template<typename product>
    static void static_check() {
      static_assert(std::is_base_of<product_base, product>::value, "all products must inherit from product_base");
    }
  }; // class factory

} // namespace hicc::util::factory
```

这个类的原始动机来自于  [C++ Template to implement the Factory Pattern - Code Review Stack Exchange](https://codereview.stackexchange.com/questions/240157/c-template-to-implement-the-factory-pattern) ，但消除了原有的移植性问题，改善了构造函数的变参问题，所以现在是一个真实可用的版本，在 cmdr-cxx 中它也***将***是开箱即用的（`cmdr::util::factory<...>`）。

为了想要做成充分利用 C++17 新特性的代码，我们尝试过多种方案。然而目前来讲，使用一个 T 的编译期固化的实例，并用 tuple 打包，是最简洁的。欢迎在这里做多番尝试并探讨。

这么做的结果就是上面给出的实现代码，它的弱点在于不得不遍历 `named_products{}` 数组，这往往是一个笨拙的手段，but 代码形状好看啊。此外对每个产品都会提前构造一个内部实例 `T data`，因为没有其他的有效手段来抽出 `decltype(it.data)`，故而这个手段是被迫的，它的坏处在于浪费内存，降低启动速度，但运行时使用倒是没有副作用。

> 2021-10-18:
>
> 后来，我们改进了代码实现，去除了 `T data` 这个实例，所以就显得更好看了，而且节省了无意义的内存消耗。所以请看：
>
> [谈 C++17 里的 Factory 模式之二](https://hedzr.com/c++/algorithm/cxx17-factory-pattern-2/)

总的来看，想象你的产品类不应该会超出 500 个的吧，那么这些浪费大概没什么不可以接受的。





### 使用

使用它也和往常的工厂模式的用法有一点点的不同，你需要在具现化 factory 模板类时指定产品的接口类以及所有产品类。

```c++
namespace fct = hicc::util::factory;
using shape_factory = fct::factory<tmp1::Point, tmp1::Point2D, tmp1::Point3D>;
```

这里会有一个强制要求你的全部产品类必须有统一的根类（即 product_base 抽象类），然后 factory class 才能通过这个根类的多态向你返回新产品的实例。

一个实际的例子可以是这样子：

```c++
namespace tmp1 {
    struct Point {
        virtual ~Point() = default;
        // virtual Point *clone() const = 0;
        virtual const char *name() const = 0;
    };

    struct Point2D : Point {
        Point2D() = default;
        virtual ~Point2D() = default;
        static std::unique_ptr<Point2D> create_unique() { return std::make_unique<Point2D>(); }
        static Point2D *create() { return new Point2D(); }
        // Point *clone() const override { return new Point2D(*this); }
        const char *name() const override { return hicc::debug::type_name<std::decay_t<decltype(*this)>>().data(); }
    };

    struct Point3D : Point {
        // Point3D() = default;
        virtual ~Point3D() = default;
        static std::unique_ptr<Point3D> create_unique() { return std::make_unique<Point3D>(); }
        static Point3D *create() { return new Point3D(); }
        // Point *clone() const override { return new Point3D(*this); }
        const char *name() const override { return hicc::debug::type_name<std::decay_t<decltype(*this)>>().data(); }
    };
} // namespace tmp1

void test_factory() {
    namespace fct = hicc::util::factory;
    using shape_factory = fct::factory<tmp1::Point, tmp1::Point2D, tmp1::Point3D>;
  
    auto *ptr = shape_factory::create("tmp1::Point2D");
    hicc_print("shape_factory: Point2D = %p, %s", ptr, ptr->name());
    ptr = shape_factory::create("tmp1::Point3D");
    hicc_print("shape_factory: Point3D = %p, %s", ptr, ptr->name());

    std::unique_ptr<tmp1::Point> smt = std::make_unique<tmp1::Point3D>();
    hicc_print("name = %s", smt->name()); // ok
}
```

### 优点

以上我们认为是工厂模式的一个最优解，因为大量的琐事被去除或掩盖了，现在的新代码量已经算是充分少的状态了。

你可能注意到了这个 factory 模板类的 create 方法需要业务代码提供类名作为创建标识。这是特意设计的。因为我们需要一个运行期变量而不是编译期的展开。想象一下组态软件的需求，你可以在一个下拉框中选茄子或者黄瓜，然后在绘图区域绘制一个元件，这时候你需要的就是一个运行期变量标识。

即使你并不想要这样的未来的拓展性，它也并不影响到你的业务代码。

不过你也完全可以自己写一套类模板展开的，甚至偏特化的。





### 背景知识

想要进一步了解完美转发等等知识，可以看看  [C++ 中的原位构造函数及完美转发 - 写我们自己的 variant 包装类](/c++/variant/in-place-construction-in-cxx/) 和 [C++ 中的原位构造函数 (2)](/c++/variant/in-place-construction-in-cxx-2/) ，但也应该去看 cppreferences 信息。



#### 虚析构函数

注意虚析构函数的重要用途在于通过基类指针可以安全的 delete 多态实例，这是一个强制性的要求。如果你没有实现虚析构函数，那么 delete base 时可能无法正确地释放一个多态对象。所以在绝大多数派生类体系中一定要在基类声明虚析构函数，此后，理论上编译器会为一切派生类生成相应的析构函数多态。

> 然而我从不在这些情况下去挑战编译器能力，而是一切派生类都显式地写出析构函数代码。除了避免潜在的移植性问题之外，显式的虚析构函数有利于降低代码阅读者的心智负担，这是你应该做的。
>
> 一旦 base 声明了虚析构函数，那么派生类的析构函数不必带有 virtual 或者 override 关键字，这是自动的。

参见上面“使用”一节中的范例。



#### 智能指针与多态

- 在需要多态能力时，应该使用基类的指针，引用参考将不能执行多态操作

  ```c++
  Point* ptr = new Point3D();
  ptr->name();   // ok
  (*ptr).name(); // mostly bad
  ```

- 基类指针的智能指针包装也能正确地多态：

  ```c++
  std::unique_ptr<Point> ptr = std::make_unique<Point3D>();
  smt->name(); // ok
  ```

  请注意细节。

- 从派生类智能指针，通过 move 操作或者调用 release() 的方式可以转移裸指针到基类智能指针中。否则，使用上面的构造并立即降级的方式（利用的是 std::unique_ptr<T,...> 的移动构造函数，实际上隐含了 move 语义）。



#### **闲谈指针和智能指针**

但是那是弱者的借口而已。如果你连指针都用不好，反而津津乐道地跟我谈 unique 还是 shared，那恐怕一个先天不足的评价是少不了了。

我们都说会而不用，按需择用，那是高手游刃有余的表现。不过如果是无法会而不用，转而选择不那么烧脑的手段，这就很难让人不去怀疑这是否只不过是酸葡萄了。

经历过 C98 前的痛苦和毒打的人往往有很好的防止指针失控的手法，这也是他们能力的表现。而事实上现代 C++ 也无法防止指针问题，在 C++/C 这样的系统级编程语言中谈论指针你只有一个选择，面对它，干掉它。

或许可以这么说，Modern C++ 提供了很多新的手法来帮助我们将指针误用能够掩盖起来，其实就是为了让菜鸡可以去做填空题。

但你别甘于做菜鸡。

##### 所以

所以，在我们的 factory 模板类中提供了 `create(...)` 和 `create_unique_ptr(...)` 两个输出接口，无论你是哪一种风格的爱好者，指针派也好，智能指针派也好，或者中立派也好，可以按需取用而无需不爽。



## 小结

以上，个人观点，你随便看看就好。

更完善的源码（消除潜在warnings的）参阅 [hicc-cxx 源代码 factory.cc](https://github.com/hedzr/hicc/blob/master/tests/factory.cc)。





:end:

