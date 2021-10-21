---
layout: single
title: "理解 declval 和 decltype"
date: 2021-10-21 05:10:00 +0800
last_modified_at: 2021-10-21 07:48:00 +0800
Author: hedzr
tags: [c++,c++11,std::declval,decltype,abstract class]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/declval-deduce-type.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  理解 std::declval 的力量；顺带提提抽象类容器化等 tricks ...
---



## std::declval 和 decltype

> 题图来自于 [C++ Type Deduction Introduction - hacking C++](https://hackingcpp.com/cpp/lang/type_deduction.html) 但略有变形以适合 banner



### 关于 decltype

`decltype(expr)` 是一个 C++11 新增的关键字，它的作用是将实体或者表达式的类型求出来。

```cpp
#include <iostream>
int main() {
  int i = 33;
  decltype(i) j = i * 2;
  std::cout << j;
}
```

它很简单，无需额外解释。

但如此简单的一个东西，怎么就需要新增一个关键字这么大件事呢？还是元编程闹的！元编程世界里，长的怀疑人生的一串模板类声明让人崩溃，重复书写它们更是累赘。例如一条运行时调试日志输出：

![image-20211018201558979](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20211018201558979.png)

这不是我印象中最长的名称，只是最顺手就能截取的一个引用。这样的例子多的是。

借用我的 [谈 C++17 里的 State 模式之二](https://hedzr.com/c++/algorithm/cxx17-state-pattern-2/)  也即 [fsm-cxx](https://github.com/hedzr/fsm-cxx) 的使用例子稍加改写来体现 decltype 的用处：

```cpp
void test_state_meta() {
  machine_t<my_state, void, payload_t<my_state>> m;
  using M = decltype(m);
  // equals to: using M = machine_t<my_state, void, payload_t<my_state>>;

  // @formatter:off
  // states
  m.state().set(my_state::Initial).as_initial().build();
  // ...
}
```

显然，`using M = decltype(m)` 更简练，特别是当 `machine_t<my_state, void, payload_t<my_state>>` 可能是一超级长带超级多模板参数的定义的字串时，decltype 的价值还会体现的更明显。

在元编程里，特别是涉及到大型类体系彼此纠结的情形时，很多时候可能不能不借助 decltype 的能力以及 auto 自动推导能力，因为在一个具体场景中可能我们不能预设具体类型会是什么。

#### 规范化的编码风格

此外，善用 decltype 和 using 能够为你的代码规范性和编码省力性上贡献力量。

在编写一个类时，我们应该多加使用 using 提供的类型别名能力，当然同时这其中可能会涉及到对 decltype 的运用。

使用 using 的好处在于，可以提前显式地催促编译器进行相关类型推导，如果有错可以在一组 using 语句处进行修正，不必在一大堆代码段落中去研究为何类型用错。

用错了类型又可能引发大堆代码的被迫改写。

使用 using 还能帮助你减少代码段落修改。例如 `using Container=std::list<T>` 改为 `using Container=std::vector<T>` 时，你的已经写就的代码段落乃至于 `Container _container` 声明均可以一丝一毫不做修改，只需要重新编译就够。

本小节不给参考用例，因为那会喧宾夺主。而且时机不到，讲给你听也不起作用。



### 关于 `std::declval`

[`std::declval<T>()`](https://en.cppreference.com/w/cpp/utility/declval) 也没什么好说的，它能返回类型 T 的右值引用参考。

但是 [cppref](https://en.cppreference.com/w/cpp/utility/declval) 讲的真是云里雾里，说到底 declval 到底能干什么？它就是用于返回一个 T 对象的伪造实例，同时又具有右值引用参考。换句话说，它等价于下面的 objref 的编译期态：

```cpp
T obj{};
T &objref = obj{};
```

首先，它在词法和语义上等价于 objref，是对象 T 的实例值，且具有 T&& 的类型；其次，它仅用于非求值的场合；再次，它并不真的存在。啥意思，说人话就是在编译期中，需要一个值对象，但并不希望这个值对象被编译为一个二进制实体，那就用 declval 虚拟地构造一个，从而彷佛获得了一个临时对象，可以在该对象上施加操作，例如调用成员函数什么的，但既然是虚拟的，就不会真的存在这么个临时对象，所以我称之为伪实例。

我们常常并不真的直接需要 declval 求值求得的伪实例，更多的是需要借助于这个伪实例来求取到相应的类型描述，也就是 T。所以一般情况下 declval 之外往往包围着 decltype 计算，设法拿到 T 才是我们的真实目的：

```cpp
#include <iostream>

namespace {
  struct base_t { virtual ~base_t(){} };

  template<class T>
    struct Base : public base_t {
      virtual T t() = 0;
    };

  template<class T>
    struct A : public Base<T> {
      ~A(){}
      virtual T t() override { std::cout << "A" << '\n'; return T{}; }
    };
}

int main() {
  decltype(std::declval<A<int>>().t()) a{}; // = int a;
  decltype(std::declval<Base<int>>().t()) b{}; // = int b;
  std::cout << a << ',' << b << '\n';
}
```

可以看到，`A<int>` 的伪实例能够“调用” A 的成员函数 t()，然后借助于 decltype 我们就可以拿到 t() 的返回类型，并用来声明一个具体的变量 a。因为 t() 的返回类型为 T，所以 main() 函数中的这条变量声明语句实际上等价于 `int a{};`。

这个例子是为了帮助你理解 declval 的实际含义，例子本身是比较无意义的。



#### declval 的力量

`declval(expr)` 的核心力量在上面的例子中显示的很明白：它不会对 expr 真正求值。所以你不必在 expr 处产生任何临时对象，也不会因为表达式很复杂而发生真实的计算。这对于元编程的复杂环境是非常有用的。

下面的来自于某 ppt 的一页还展示了表达式不必求值仅求类型的用例：

![slide 14](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/cpp_genericity_type_deduction_14.svg)

> FROM: [HERE](https://hackingcpp.com/cpp/lang/type_deduction.html)

但不仅如此，declval 的不求值还衍生出了进一步的力量。



##### 无默认构造函数

如果一个类没有定义默认构造函数，在元编程环境中可能是很麻烦的。例如下面的 decltype 就无法通过编译：

```cpp
struct A{
  A() = delete;
  int t(){ return 1; }
}

int main(){
  decltype(A().t()) i; // BAD
}
```

因为 A() 是不存在的。

但改用 declval 就能够绕过问题了：

```cpp
int main(){
  decltype(std::declval<A>().t()) i; // OK
}
```



##### 纯虚类

在纯虚基类上有时候元编程会比较麻烦，这时候可能可以借助 declval 来避开纯虚基类不能实例化的问题。

在第一个示例中有相应的参考 `decltype(std::declval<Base<int>>().t()) b{}; // = int b;`。



### Refs

- [C++ Type Deduction Introduction - hacking C++](https://hackingcpp.com/cpp/lang/type_deduction.html)
- [std::declval - cppreference.com](https://en.cppreference.com/w/cpp/utility/declval)
- [decltype specifier - cppreference.com](https://en.cppreference.com/w/cpp/language/decltype)



## Tricks

上面的代码涉及到了一些惯用法，下面做一简单的背景介绍，也包含一点点联想延伸。

### 采用一个普通的抽象类作为基类

模板类的体系设计中，如果基类的代码、数据很多，可能会导致膨胀问题。一个解决方法是采用一个普通的基类，并在其基础上建立模板化的基类：

```cpp
struct base {
  virtual ~base_t(){}
  
  void operation() { do_sth(); }
  
  protected:
  virtual void do_sth() = 0;
};

template <class T>
  struct base_t: public base{
    protected:
    virtual void another() = 0;
  };

template <class T, class C=std::list<T>>
  struct vec_style: public base_t<T> {
    protected:
    void do_sth() override {}
    void another() override {}
    
    private:
    C _container{};
  };
```

这样的写法，可以将通用逻辑（不必泛型化的）抽出到 base 中，避免留在 base_t 中随着泛型实例化而膨胀。



### 纯虚类如何放入容器里

顺便也谈谈纯虚类，抽象类，的容器化问题。

对于类体系设计，我们鼓励基类纯虚化，但这样的纯虚基类就无法放到 std::vector 等容器中了：

```cpp
#include <iostream>

namespace {
  struct base {};

  template<class T>
    struct base_t : public base {
      virtual ~base_t(){}
      virtual T t() = 0;
    };

  template<class T>
    struct A : public base_t<T> {
      A(){}
      A(T const& t_): _t(t_) {}
      ~A(){}
      T _t{};
      virtual T t() override { std::cout << _t << '\n'; return _t; }
    };
}

std::vector<A<int>> vec; // BAD

int main() {
}
```

怎么破？

这里用 declval 是没意义的，应该使用智能指针来装饰抽象基类：

```cpp
std::vector<std::shared_ptr<base_t<int>>> vec;

int main(){
  vec.push_back(std::make_shared<A<int>>(1));
}
```

> 由于我们为泛型类 base_t 声明了非泛型的基类 base，所以还可能采用 `std::vector<base>` 的方法，但这要求你将所有 virtual 接口都抽取到 base 中，那样做的话，总会有一部分泛型接口无法抽取，所以这种方法有可能是行不通的。

如果觉得虚函数与其重载如此痛苦竟然不能忍的话，你可以考虑  [谈 C++17 里的 Builder 模式 所介绍的 CRTP](https://hedzr.com/c++/algorithm/cxx17-builder-pattern/#crtp) 惯用法的能力，CRTP 在模板类继承体系中是个很强大的编译期多态能力。

除此而外，还可以放弃基类抽象化的设计方案，改用所谓的运行时多态 trick 来设计类体系。



### Runtime Polymorphism

这是一种由 Sean Parent 提供的 [运行时多态](https://sean-parent.stlab.cc/papers-and-presentations/#better-code-runtime-polymorphism) 编码技术：

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Animal {
 public:
  struct Interface {
    virtual std::string toString() const = 0;
    virtual ~Interface()                 = default;
  };
  std::shared_ptr<const Interface> _p;

 public:
  Animal(Interface* p) : _p(p) { }
  std::string toString() const { return _p->toString(); }
};

class Bird : public Animal::Interface {
 private:
  std::string _name;
  bool        _canFly;

 public:
  Bird(std::string name, bool canFly = true) : _name(name), _canFly(canFly) {}
  std::string toString() const override { return "I am a bird"; }
};

class Insect : public Animal::Interface {
 private:
  std::string _name;
  int         _numberOfLegs;

 public:
  Insect(std::string name, int numberOfLegs)
      : _name(name), _numberOfLegs(numberOfLegs) {}
  std::string toString() const override { return "I am an insect."; }
};

int main() {
  std::vector<Animal> creatures;

  creatures.emplace_back(new Bird("duck", true));
  creatures.emplace_back(new Bird("penguin", false));
  creatures.emplace_back(new Insect("spider", 8));
  creatures.emplace_back(new Insect("centipede", 44));

  // now iterate through the creatures and call their toString()

  for (int i = 0; i < creatures.size(); i++) {
    std::cout << creatures[i].toString() << '\n';
  }
}
```

其特点是基类不是基类，基类的嵌套类才是基类：Animal::Interface 才是用于类体系的抽象基类，它是纯虚的，但却不影响 `std::vector<Animal>` 的有效编译与工作。Animal 使用简单的转接技术将 Animal::Interface 的接口（如 toString()）映射出来，这种转接有点像 Pimpl Trick，但也有一点微小的区别。





## 后记

总的一句话，declval 就是专门治那些无法实例化具体对象的场合的。

`std::declval<T>()` 也被典型地用在编译期测试等用途，下一次有闲再做探讨吧，那个话题太大了。



:end:

