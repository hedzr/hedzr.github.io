---
layout: single
title: "谈 C++17 里的 Factory 模式之二"
date: 2021-10-18 05:10:00 +0800
last_modified_at: 2021-10-19 07:40:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,factory pattern,design patterns,工厂模式,设计模式]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20211018121121383.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  改进后的工厂模式，以及 type_name 等等...
---



## 前言

### 回顾上回

回想上回为了写一个 memento 模式（请看 [谈 C++17 里的 Memento 模式](https://hedzr.com/c++/algorithm/cxx17-memento-pattern/)），觉得仅仅 memento 太干瘪了，干脆就写了个类库 [undo-cxx](https://github.com/hedzr/undo-cxx)，也真是没谁了。

这两日想来想去，愈发觉得这事干得太那啥了。今后还是不必如此的吧？话说这两天头发都不长长了，担忧啊。



### 本文缘起

在 [谈 C++17 里的 Factory 模式](https://hedzr.com/c++/algorithm/cxx17-factory-pattern/) 中我介绍了 hicc/cmdr-cxx 中的 factory 模板类，看了一下时间表，动念是 0822，居然这么长时间了（而且都三个月了，写个 GoF 系列竟然也没写出来，我不应该这么懒的）。当时提到 factory 的存在的 `T data` 问题，即在 factory 的 tuple 中持有每个 products 类的一个具体化实例，原因是为了稍后能够从 T data 中抽出类型供 create 使用。

这显然是一个不舒服的东西。

但是当时不想纠缠了，问题就这么遗留下来了，直到后来某一天感到了不能忍，才去研究了怎么消灭这玩意，事实上它确实是可以被消灭的。

## `factory<>` 改进版

所以现在改进的版本是：

```cpp
namespace cmdr::util::factory {

    /**
     * @brief a factory template class
     * @tparam product_base   such as `Shape`
     * @tparam products       such as `Rect`, `Ellipse`, ...
     */
    template<typename product_base, typename... products>
    class factory final {
    public:
        CLAZZ_NON_COPYABLE(factory);
        using string = id_type;
        template<typename T>
        struct clz_name_t {
            string id = id_name<T>();
            using type = T;
            using base_type = product_base;
            static void static_check() {
                static_assert(std::is_base_of<product_base, T>::value, "all products must inherit from product_base");
            }
            template<typename... Args>
            std::unique_ptr<base_type> gen(Args &&...args) const {
                return std::make_unique<T>(args...);
            }
            // T data;
        };
        using named_products = std::tuple<clz_name_t<products>...>;
        
        template<typename... Args>
        static auto create(string const &id, Args &&...args) {
            std::unique_ptr<product_base> result{};
            
            std::apply([](auto &&...it) {
                ((it.static_check() /*static_check<decltype(it.data)>()*/), ...);
            },
                       named_products{});
            
            std::apply([&](auto &&...it) {
                ((it.id == id ? result = it.gen(args...) : result), ...);
            },
                       named_products{});
            return result;
        }
        template<typename... Args>
        static std::shared_ptr<product_base> make_shared(string const &id, Args &&...args) {
            std::shared_ptr<product_base> ptr = create(id, args...);
            return ptr;
        }
        template<typename... Args>
        static std::unique_ptr<product_base> make_unique(string const &id, Args &&...args) {
            return create(id, args...);
        }
        template<typename... Args>
        static product_base *create_nacked_ptr(string const &id, Args &&...args) {
            return create(id, args...).release();
        }

    private:
    }; // class factory

} // namespace cmdr::util::factory
```

在这个改进版中，我们通过在 clz_name_t 中定义一个 generator 函数的方式来构造 T 的最终实例，而不必借助于 decltype(T data) 这样的运算来获得 T 类型，所以能够顺利地消除 T data。

顺便也改写了 static_assert 函数，这个函数仅被用于编译期。

在 create() 中的两次 named_products{} 实例实际上会在 release build 时被优化为单次。

#### 遗憾的是

仍未能解决的是大量 products（例如数千个）时遍历 named_products{} 导致的可能的性能问题。因为没有合适的参数包展开语法，这个问题依然还是被搁置，今后有了念头再来补充一次咯。

幸运的是，一般情况下这并不会真是个问题。



### 改进版的 type_name，以及 id_name

在 `factory<>` 新版本中使用了新的 id 名算法 id_name，它从类型 T 抽出其类型名表述（如同 `word_processor::FontStyleCmd<State>` 这样），然后去掉泛型参数部分，留下 `word_processor::FontStyleCmd`，这样更适合于被其他场所所使用。 /

 



#### 改进的 type_name

此前并未专门展示 type_name 的实现，你需要去检查源代码才行。另外，旧的实现存在一定的兼容性问题，尤其是在 msvc 中一直是勉强工作。

所以，也不能忍，改掉：

```cpp
namespace cmdr::debug{
template<typename T>
constexpr std::string_view type_name();

template<>
constexpr std::string_view type_name<void>() { return "void"; }

namespace detail {

  using type_name_prober = void;

  template<typename T>
  constexpr std::string_view wrapped_type_name() {
    #ifdef __clang__
    return __PRETTY_FUNCTION__;
    #elif defined(__GNUC__)
    return __PRETTY_FUNCTION__;
    #elif defined(_MSC_VER)
    return __FUNCSIG__;
    #else
    #error "Unsupported compiler"
    #endif
  }

  constexpr std::size_t wrapped_type_name_prefix_length() {
    return wrapped_type_name<type_name_prober>().find(type_name<type_name_prober>());
  }

  constexpr std::size_t wrapped_type_name_suffix_length() {
    return wrapped_type_name<type_name_prober>().length() - wrapped_type_name_prefix_length() - type_name<type_name_prober>().length();
  }

  template<typename T>
  constexpr std::string_view type_name() {
    constexpr auto wrapped_name = wrapped_type_name<T>();
    constexpr auto prefix_length = wrapped_type_name_prefix_length();
    constexpr auto suffix_length = wrapped_type_name_suffix_length();
    constexpr auto type_name_length = wrapped_name.length() - prefix_length - suffix_length;
    return wrapped_name.substr(prefix_length, type_name_length);
  }

} // namespace detail

template<typename T>
constexpr std::string_view type_name() {
  constexpr auto r = detail::type_name<T>();

  using namespace std::string_view_literals;
  constexpr auto pr1 = "struct "sv;
  auto ps1 = r.find(pr1);
  auto st1 = (ps1 == 0 ? pr1.length() : 0);
  auto name1 = r.substr(st1);
  constexpr auto pr2 = "class "sv;
  auto ps2 = name1.find(pr2);
  auto st2 = (ps2 == 0 ? pr2.length() : 0);
  auto name2 = name1.substr(st2);
  constexpr auto pr3 = "union "sv;
  auto ps3 = name2.find(pr3);
  auto st3 = (ps3 == 0 ? pr3.length() : 0);
  auto name3 = name2.substr(st3);

  return name3;
}

template<typename T>
constexpr auto short_type_name() -> std::string_view {
  constexpr auto &value = type_name<T>();
  constexpr auto end = value.rfind("::");
  return std::string_view{value.data() + (end != std::string_view::npos ? end + 2 : 0)};
}
}
```

它能够良好地兼容三种编译器，当然必须是 C++17 模式。

测试代码

```cpp
class test;

int main() {
  using std::cout;
  using std::endl;
  using namespace dp::debug;

  cout << "test                     : " << type_name<test>() << endl;

  cout << "const int*&              : " << type_name<const int *&>() << endl;
  cout << "unsigned int             : " << type_name<unsigned int>() << endl;

  const int ic = 42;
  const int *pic = &ic;
  const int *&rpic = pic;
  cout << "const int                : " << type_name<decltype(ic)>() << endl;
  cout << "const int*               : " << type_name<decltype(pic)>() << endl;
  cout << "const int*&              : " << type_name<decltype(rpic)>() << endl;

  cout << "void                     : " << type_name<void>() << endl;

  cout << "std::string              : " << type_name<std::string>() << endl;
  cout << "std::vector<std::string> : " << type_name<std::vector<std::string>>() << endl;
}
```

的运行反馈是：

```bash
test                     : test
const int*&              : const int *&
unsigned int             : unsigned int
const int                : const int
const int*               : const int *
const int*&              : const int *&
void                     : void
std::string              : std::__1::basic_string<char>
std::vector<std::string> : std::__1::vector<std::__1::basic_string<char>, std::__1::allocator<std::__1::basic_string<char> > >
```



#### Id_name

在 type_name 的基础上，id_name 能够将部分修饰词去掉，另外对于 `std::__1::basic_string<char>` 它会去掉其泛型参数部分：

```cpp
namespace cmdr::util {

  #if defined(_MSC_VER)
  using id_type = std::string_view; // or std::string_view
  #else
  using id_type = std::string_view;
  #endif

  template<typename T>
  constexpr auto id_name() -> id_type {
    constexpr id_type v = debug::type_name<T>();
    constexpr auto begin = v.find("()::");
    constexpr auto end = v.find('<');
    constexpr auto begin1 = begin != v.npos ? begin + 4 : 0;
    return v.substr(begin1, (end != v.npos ? end : v.length()) - begin1);
  }

} // namespace cmdr::util
```

修饰词是指 `void func()::` 这样的前缀，如果你在函数体中声明一个 struct，就可能得到这样的前缀。



## 后记

称得上技巧的就只有一个了，本文目的是延续和让系列化文章完整，免得过时的实现遭到诟病。



:end:

