---
layout: single
title: "cxx17 尾随返回类型"
date: 2022-08-28 05:00:00 +0800
last_modified_at: 2022-08-28 23:23:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,basics]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210716153922781.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  C++11 起的“尾随返回类型”之我见...
---



多数情况下，我都很少会用到尾随返回类型。

这是因为习惯的力量。

不过个人而言，必须不断打破自己的惯性。

所以关于尾随返回类型，我也有一些看法，可以记录一下。



## 尾随返回类型



### 何者？

尾随返回类型（`trailing return type declaration`）自从 C++11 起被引入以来，经受了各式各样的赞扬与意料之外的保守势力的反对。

所谓尾随返回类型，无非是将函数声明格式中的返回类型部分予以后置，而其原来的位置则采用 `auto` 关键字代替。

这样的做法一方面是向现代编程语言的风格靠齐，另一方面也是强调自动推定类型的一个开始。从那时起，自动推定类型经历了 11 年的演进，在 C++17 开始以来，不但获得了广泛的编译器支持（该填的坑大抵也算是填的差不多了），而且着着实实地改善了程序员的生活质量。

现在用 auto 这个词的时候大家也没什么心理负担了。而当初 auto 改变其原有的语义转而变为自动推定的标志时，很多保守派是极力反对的，因为这样或会引发程序员对类型不求甚解、胡乱运用、甚至引发意料外的误用问题。

那么，尾随返回类型的典型开始是这样：

```cpp
auto main() -> int {
  //...
  return 0;
}

// = int main() { return 0; }
```

所以，它的范式一目了然：对于传统的函数声明

```cpp
int func_name(int x, int y);
```

来说，新的尾随返回类型声明方法看起来像这样：

```cpp
auto func_name(int x, int y) -> int;
```

它看起来就好像只不过是一支语法糖而已，是吗？



### 强调自动推定从这时候开始

其实，并不然，这就是我们所提到的 auto 的身份转变和被强调的开始。

使用尾随返回类型，首先是部分强制的。即是说，当你正在使用 lambda 表达式时，如果需要返回值，怎么办？

此时有两种做法。

一是什么也不做，那么自动推定将会从调用者签名以及 lambda 表达式的 return 语句中试图完成自动推导。

```cpp
#include <iostream>
#include <functional>

auto caller(std::function<uint64_t (uint64_t, uint64_t)> sum) {
  return sum(1, 3);
}

int main(){
  std::cout << caller([](uint64_t a, uint64_t b){
    return a+b;
  }) << '\n';
}
```

第二种是使用尾随返回类型，显式完成类型宣告。特别要注意的是，如果你想要在书写匿名函数时宣告返回类型的话，这也是唯一的方法：

```cpp
#include <iostream>
#include <functional>

auto caller(std::function<int64_t (uint64_t, uint64_t)> sum) {
  return sum(1, 3);
}

int main(){
  std::cout << caller([](uint64_t a, uint64_t b) -> int64_t {
    return int64_t(a+b);
  }) << '\n';
}
```

这里给出的例子不能向你明确地解释显式声明返回类型的必要性，但当你在返回一个派生类体系中的抽象类时，它可能就是必要的了：

```cpp
struct abs_shape {
  virtual void paint(paint_context&) const = 0;
};
struct rectangle : public abs_shape {
  // ...
};

class canva {
  std::vector<abs_shape*> _shapes;
  public:
  auto &elements() { return _shapes; }
  auto const &elements() const { return _shapes; }

  void add(std::function<abs_shape*> creator) {
    auto* el = creator();
    _shapes.push_back(el);
  }
};

auto do_paint(std::function<void(abs_shape const&) painter) {
  for(auto const& elem: canva.elements()){
    painter(*elem);
  }
}

auto main() -> int {
  canva.add([]() -> abs_shape* {
    return new rectangle();
  })
}
```

为了给出一个示例，上面使用了 `std::vector<abs_shape*> _shapes` 定义，真实的设计中它会是使用 shared_ptr 方式来完成的。

在这个示例中，canva.add() 带有形参标签，所以其实匿名函数其实不必真的需要返回类型，但是在更复杂的模板编程中，这种必须的场景将会是显然必然会出现的。

而我们在这个示例中是要向你说明，返回一个派生类指针需要降级到抽象类指针时，你可能不得不需要一个显式的返回类型来进行约束。

此外，对于派生类带有基类类型构造函数时，为了避免 `return {}` 被推定为基类构造，可能也需要显式声明返回类型而不是使用 auto。

```cpp
struct base{
  std::string str{};
  virtual ~base() = default;
  base() = default;
  base(std::string const& s):str(s){}
};
class derived : public base {
  public:
  using base::base;
  
  derived(base const& o);
  derived() = default;
  virtual ~derived() = default;
};

auto which_one() {
  if (ok)
    return base{"x"};
  return {}; // call base{} directly
}

auto which_one_case2() -> derived {
  if (ok)
    return base{"x"}; // implicit construct with derived(base const&)
  return {}; // call derived{} directly
}
```

嗯，上面连续设法制造了三个示例，不过都有点不怎么好。

就这样吧。



### Pros

尾随返回类型的好处：

1. 统一函数声明签名的样式，这使得常规函数、成员函数、匿名函数的签名可以统一，尤其是在匿名函数中需要显式声明返回类型时，它很有用

2. 降低函数的识别难度，提高可读性：现在 auto 就好像是 kotlin 中的 fn，golang 中的 func，rust 中的 fun 那样是一个函数的引导标签，例如 golang 的函数：

   ```go
   func add(a, b int) (sum int){ return a+b }
   ```

   在审查或浏览代码时，这有利于快速识别到函数的区块。

   对于程序员的心智来说，后置的返回类型也有可能是更顺利的。

   当然，这种语法糖特质其实也可以通过引入函数指针的类型定义或别名来达到：

   ```cpp
   using FuncPtr = void (*)(int);
   FuncPtr get_func_on(int i);
   ```

   不过这显然常常是更复杂的。

   另一方面，整齐的前置 auto 也能从纵向排列上改善可读性：

   ```cpp
   auto foo() -> int;
   auto bar() -> really_long_typedef_name;
   ```

   如上。

3. 由于返回类型能够被自动推导，所以 decltype 在被使用时更为自然：

   ```cpp
   struct A {
     std::vector<int> a;
   
     // OK, works as expected
     auto begin() const -> decltype(a.begin()) { return a.begin(); }
   
     // FAIL, does not work: "decltype(a.end())" will be "iterator", but 
     // the return statement returns "const_iterator"
     decltype(a.end()) end() const { return a.end(); }
   };
   ```

   而且这是能使用 decltype 的唯一方法，如上所见。

4. 省略类范围限定符

   ```cpp
   class Person {
   public:
       enum PersonType { ADULT, CHILD, SENIOR };
       void setPersonType (PersonType person_type);
       PersonType getPersonType ();
   private:
       PersonType _person_type;
   };
   
   // UGLY: Person::PersonType Person::getPersonType () { return _person_type; }
   auto Person::getPersonType () -> PersonType {
       return _person_type;
   }
   ```

   如上，在分离（Outside）定义函数体时，你可以不必被迫采用 `Person::PersonType` 而是使用简明的 `PersonType`，因为从语义分析的 token 单元的角度来看，此时已经处于 Person 的范围之内了（`Person::getPersonType` 前置部分已经宣告了 Person 范围），就好像在 class Person 内部直接声明函数体一样。

5. 如果你广泛地使用类中的类型别名定义，那么在分离定义函数体时还能获得更多的好处，特别是当模板编程中频繁使用复杂且加长的类型名字时。

   例如我们的 [fsm-cxx](https://github.com/hedzr/fsm-cxx) 中的 `transition_t`：

   ```cpp
   template<
       typename S,
       typename EventT = event_t,
       typename MutexT = void,
       typename PayloadT = payload_t,
       typename StateT = state_t<S, MutexT>,
       typename ContextT = context_t<StateT, EventT, MutexT, PayloadT>,
       typename ActionT = action_t<S, EventT, MutexT, PayloadT, StateT, ContextT>>
     struct transition_t {
       using Event = EventT;
       using State = StateT;
       using Context = ContextT;
       using Payload = PayloadT;
       using Action = ActionT;
       using First = std::string; // event_name
       using Item = detail::trans_item_t<S, EventT, MutexT, PayloadT, StateT, ContextT, ActionT>;
       using Second = std::vector<Item>;
       using Maps = std::unordered_map<First, Second>;
       using Guard = typename Item::Guard;
   
       Maps m_;
   
       transition_t() {}
       ~transition_t() {}
   
       // ...
       
       public:
       // NOT REALLY GOOD: std::tuple<bool, Item const &> get(std::string const &event_name, EventT const &ev, Context &ctx, Payload const &payload) const { return _get(event_name, ev, ctx, payload); }
       auto get(std::string const &event_name, EventT const &ev, Context &ctx, Payload const &payload) const -> std::tuple<bool, Item const &> { return _get(event_name, ev, ctx, payload); }
   
       // ...
     };
   ```

   比较一下上面的 transition_t::get() 的两种写法，无疑后一种更具可读性；如果我们是分离地定义它时，会获得更多好处。



### Cons

作为一个反例，如果你正在实现一个 builder pattern，我们鼓励你采用传统语法：

```cpp
class Builder {
  public:
  Builder() = default;
  ~Builder() = default;
  
  // auto house_type(HouseType typ) -> Builder;
  Builder& house_type(HouseType typ);
  
  House Build();
}
```

因为前置的返回类型 `Buidler&` 更能提醒读者这是一个 builder pattern，如同 house_type() 那样。



其次来说，对于

```cpp
void do_something(int a) { ... }
```

来说，新的表达是不是确实有意义呢？

```cpp
auto do_something(int a) -> void { ... }
auto do_something(int a) { ... }
```



## REFs

- [函数声明 - cppreference.com](https://zh.cppreference.com/w/cpp/language/function) 







:end:

