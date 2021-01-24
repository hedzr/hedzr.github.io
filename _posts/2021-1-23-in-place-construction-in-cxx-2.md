---
layout: single
title: 'C++ 中的原位构造函数 (2)'
date: 2021-1-23 21:00:00 +0800
last_modified_at: 2021-1-24 08:35:12 +0800
Author: hedzr
tags: [c++, in-place construction, in-place constructor, perfect frwarding]
categories: c++ variant
comments: true
toc: true
header:
  overlay_image: /assets/images/foo-bar-identity-th.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  关于原位构造再补充一下，重点研究 std::any ...
---



## 导读

下面将会进一步研究 `std::any` 及其可能的改善，并顺便展示原位构造等技法等实用案例。

本文中提供或部分提供了这些工具类的实现：

- `template<typename holderT = std::any> var_t` 实际上应该是 ``template<typename holderT = streamable_any> var_t`; 具有多种设计目的的，`std::any` 的改善品。
- `struct streamable_any`; 是 `std::any` 的一个简易抽出辅助类，提供一个简便的抽出方案。
- `template<class OS = std::ostream> class streamer_any`; 基于 visitor 模式的 `std::any` 的辅助抽出工具类。

## 进一步研究 `std::any`

上一次我们在 [C++ 中的原位构造函数及完美转发 - 写我们自己的 variant 包装类](/c++/variant/in-place-construction-in-cxx/) 中提供了 `diagram` 这个支持原位构造函数的模板类。

注意它是模板的。所以你使用它时是针对一个确定的类型做 diagram 装饰。

而像 `std::any` 这样的类如果被我们所继承的话，则派生类只能通过完美转发来实现转发后的原位构造。

### 从 `std::any` 派生

假设我们准备实现一个 `var_t` 且派生于 `std::any`，那么它可能看起来是像这样的：

```cpp
template<typename holderT = std::any>
    class var_t {
    public:
        typedef var_t self_type;
        typedef std::list<self_type> var_t_array;
        typedef std::unordered_map<std::string, var_t> children_container;
        typedef std::unordered_map<std::string, var_t *> child_pointers;

    public:
        var_t() = default;
        ~var_t() = default;
        var_t(var_t const &) = default;
        var_t(var_t &&) noexcept = default;

        template<typename A = holderT, typename... Args,
                 std::enable_if_t<
                         std::is_constructible<holderT, A, Args...>::value &&
                                 !std::is_same<std::decay_t<A>, var_t>::value,
                         int> = 0>
        explicit var_t(A &&a0, Args &&...args)
            : _value(std::forward<A>(a0), std::forward<Args>(args)...) {}

        explicit var_t(holderT &&v)
            : _value(std::move(v)) {}

        bool operator==(const var_t &r) {
            return _value == r._value;
        }

      private:
      holderT _value;
    };
```

在这里有两点：

1. 我们没有真的直接派生 `std::any`，但稍后我们另有所图

2. 我们没有费太多力气，而是沿用了 `diagram` 的写法。在这里我们的取巧的方法是，的确 `std::any` 不需要什么模板参数，但我们依然可以伪造一个，也就是这里的 `holderT`。通过这样的方法，我们几乎原样地照搬了 `diagram` 的经验，而且甚至于还获得了新的支持：

> 考虑一下，为什么 `std::any` 骂声一片？
>
> 因为它的完成度太低了。任何草率看到 any 的人都会如我一样地狂呼“终于有真正的 variant 啦”（不是指 `std::variant`，那是需要约束有效类型范围的）。然而一旦用起来时，这轻率的人才会发现放进去容易取出来难呐！

所以，在提供了 holderT 抽象层的基础上，我们可以设法改进 any 的抽出难题。

假设我们实现了这样一个包装类 `streamable_any`，它提供更好的抽出工具：

```cpp
struct streamable_any : std::any {
  void (*streamer)(std::ostream &, streamable_any const &);
  friend std::ostream &operator<<(std::ostream &os, streamable_any const &a) {
    a.streamer(os, a);
    return os;
  }

  [[nodiscard]] std::string as_string() const {
    std::stringstream os;
    if (streamer)
      streamer(os, *this);
    return os.str();
  }

  template<class T>
    const T &get() const {
    return std::any_cast<T>(*this);
  }
  template<class T,
  typename std::enable_if<
    !is_duration<std::decay_t<T>>::value &&
      !is_stl_container<std::decay_t<T>>::value &&
        !std::is_same<std::decay_t<T>, streamable_any>{}>::type * = nullptr>
        explicit streamable_any(T &&t)
        : std::any(std::forward<T>(t))
          , streamer([](std::ostream &os, streamable_any const &self) {
            if constexpr (!std::is_void_v<T>) {
              os << std::any_cast<std::decay_t<T>>(self);
            }
          }) {}
};
```

> 处于篇幅原因，我们只提供了主要片段而省略了一些例外情况的处理。
>
> 这是我们真正从 std::any 派生的类。

那么现在我们可以这样使用 var_t 了：

```cpp
streamable_any v("yes");
std::cout << v << '\n';

var_t<streamable_any> v("yes");
std::cout << v << '\n';
```

所以前面 var_t 的头部应该可以改成了：

```cpp
template<typename holderT = streamable_any>
    class var_t {
			// ...
    };
```

这才是我们设计 var_t 时本来想要的样子。



#### 只剩下一个缺点

`streamable_any` 存在一个缺点，你不能在运行时更改数据类型了。

其实改也可以，但抽出函数部分会导致 bad_any_cast 异常。因为 streamer 是一次性初始化到特定类型的，并不支持动态类型绑定。

解决的办法是采用 visitor 模式，但这需要你显式地写很多类型的 lambda。一个可能的实现是这样的：

```cpp
template<class OS = std::ostream>
  class streamer_any {
    public:
    // OS &os;
    typedef std::unordered_map<std::type_index, std::function<void(std::ostream &os, std::any const &)>> R;
    static R &any_visitors() {
      static R _visitors = {
        to_any_visitor<void>([](std::ostream &os) { os << "{}"; }),
        to_any_visitor<int>([](std::ostream &os, int x) { os << x; }),
        to_any_visitor<unsigned>([](std::ostream &os, unsigned x) { os << x; }),
        to_any_visitor<float>([](std::ostream &os, float x) { os << x; }),
        to_any_visitor<double>([](std::ostream &os, double x) { os << x; }),
        to_any_visitor<char const *>([](std::ostream &os, char const *s) { os << std::quoted(s); }),
        // ... add more handlers for your types ...
        to_any_visitor<std::chrono::nanoseconds>([](std::ostream &os, const std::chrono::nanoseconds &x) { cmdr::chrono::format_duration(os, x); }),
        to_any_visitor<std::chrono::seconds>([](std::ostream &os, const std::chrono::seconds &x) { cmdr::chrono::format_duration(os, x); }),
      };
      return _visitors;
    }
    streamer_any() = default;

    template<class T, class F>
      static inline std::pair<const std::type_index, std::function<void(std::ostream &os, std::any const &)>>
      to_any_visitor(F const &f) {
      return {
        std::type_index(typeid(T)),
        [g = f](std::ostream &os, std::any const &a) {
          if constexpr (std::is_void_v<T>)
            g(os);
          else
            g(os, std::any_cast<T const &>(a));
        }};
    }

    inline void process(std::ostream &os, const std::any &a) {
      if (const auto it = any_visitors().find(std::type_index(a.type()));
          it != any_visitors().cend()) {
        it->second(os, a);
      } else {
        std::cout << "Unregistered type " << std::quoted(a.type().name());
      }
    }

    template<class T, class F>
      inline void register_any_visitor(F const &f) {
      std::cout << "Register visitor for type "
        << std::quoted(typeid(T).name()) << '\n';
      any_visitors().insert(to_any_visitor<T>(f));
    }
  };
```

这个类的原型来自于一篇 [cppreference](https://en.cppreference.com/w/cpp/utility/any/type)。

它很好，但也很糟，我们暂时没有办法自动支持全部类型，也就是说我们现在没有办法为其构造所有类型的流化操作器，所以你需要确定自己的数据类型范围，并向其提供特定类型的流化操作器（通过 `register_any_visitor()`）。

事实上，这也正是 `std::any` 无法做到完美的原因：C++ 是一种静态数据类型的语言，它对于动态可变的类型是很难具备全方位操作性的。

你也需要提醒自己，当我们通过模板泛型能力支持任意数据类型时，我们实际上是在支持编译期可确定的数据类型集合，而不是运行期的。

所幸的是，几乎难以真正找到一个场景，是非动态类型语言而不可构建的。事实上正相反，所有的世界都是有 C/C++ 这样的静态类型语言构建出来的（直接或间接地）。



## :end:

`var_t` 和 `streamable_any` 的完整代码有待于下一阶段完成之后在一并放出，敬请期待 cmdr-cxx，它将是 `cmdr` 命令行参数解释器的 cxx17 版本。

草草成篇——一个记录。以后有暇时再来 review 是否需要订正。





