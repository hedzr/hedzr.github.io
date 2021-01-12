---
layout: single
title: 'C++17 中的 std::variant 等等'
date: 2021-1-12 06:10:00 +0800
last_modified_at: 2021-1-12 07:00:00 +0800
Author: hedzr
tags: [c++, variant, optional, any, union]
categories: c++ variant
comments: true
toc: true
header:
  overlay_image: /assets/images/foo-bar-identity-th.jpg
  overlay_filter: rgba(255, 255, 255, 0.5)
excerpt: >-
  关于 std::variant，...
---



## 引子

经受了 big sur 的折磨之后，有那么几篇 Posts 不讲技术面的东西而且转而扮演怨妇，想必也是可以理解的吧？

你们都知道，技术性的东西，最紧要就是合适的锤子。

所以，我一技术人，有那么几篇锤子般的 trouble-solving-posts，这自然是合情合理的，不是吗？

当然还是要回到老路上来，认真梳理里来曾经学到过的东西。比方说……

但在这之前，最后碎碎念一次，刚刚，又特么 reboot 了一次，（哦，其实最近几天也都有 crashes，麻木的我），幸好看起来这次也似乎只是特别怀念版而不是常态版。而且，老 MBP 突然也无缘无故地崩了一次，是因为我装了 Parelles 试用版的原因吗？现在总是在疑神疑鬼，生活收到了极大的摧残，身心俱毙，对的，完全不是疲。



## std::variant, std::optional, std::any in C++17

变体类型，自由类型，随便你怎么叫，它最终是表达这么一种场景：你可以将任意类型的值放进去，然后你可以安全地将其抽出来。

这个统一的要求，具体实现起来有多种取舍。大多数情况下，除了能够依照原来放入时的数据类型正确地抽出来之外，还应该具体和字符串的交互能力：也就是说，能够从字符串（流）中转换得到一个特定数据类型的值（例如将 “123” 转译为 123），也能够从特定数据类型的值输出为一个字符串表示（例如从 8.301 输出为 “8.301”）。

本篇之中，仅仅述及 `std::variant`，至于另两位新模板因为篇幅原因下次再说吧。



### C++17 之前

在 C 时代以及早期 C++ 时代，语法层面支持的变体类型有两种方式：`void` 或者 `union`。

#### `void`

`void` 代表着无类型，但你不能直接定义 `void` 类型的变量，只能通过 `void*` 指针的方式来间接引用它。同时，由于它是一种“无类型”，所以放入的数值的类型信息就完全被抹除了，需要你依靠人脑来保证正确的抽出：

```cpp
void *varval;

char* s = "string";
varval = &s;
printf("%s\n", *varval);

int i = 9;
varval = &i;
printf("%d\n", *varval);
```

注意抽取类型错了的话，后果不可预知。



#### union

比 void* 更好一点的方式是 union，它代表着一组类型的混合体，你可以决定放入什么类型并取出什么类型，但同样需要人脑记忆来保证不要异种类型交互：如果放入 char* 却以 int 方式取出，结果是什么呢？此时的结果是未定义的。

```cpp
typedef union _U {
  int32_t i;
  float f;
  char* s;
  struct _2_WORD {
    unsigned short lo;
    unsigned short hi;
  } double_word;
} __attribute__ ((packed)) U;

U u;
u.i = 0x12345678;
printf("lo_word = %x, hi_word = %s\n", u.double_word.lo, u.double_word.hi);
printf("i = %d (%x)\n", u.i, u.i);

# RESULTS
#
# Hello, Wandbox!
# lo_word = 5678, hi_word = 1234
# i = 305419896 (12345678)
```

> [在 Wandbox 运行]()。
>
> 注意，上述代码需要 gcc 编译，因为它用到了 packed struct 定义方式，这是为了紧缩结构字段的内存的排布方式，在这种方式下，32bit 的整数(int32_t) 和两个 16bit 的整数(double_word) 在内存占用上是完全重叠的。所以我们可以直接取出 lo 和 hi 并能够得到正确的结果。



##### UB（NO，NO）

> 注意，这种“正确的结果” 依赖于编译器，目标运行环境（CPU 字长，CPU 的 Endian 表示）等多种因素，所以它实际上是不安全的，或者至少说是不可移植的。



##### 稍好一点的包装：Tagged Union

不关心移植性，union 也是一个危险的工具，想想看如果我们放进去一个字符串，然后以 float 方式取出来，或者放入一个整数值，却以字符串的方式取出来呢？轻则数据是错误的，重则可能内存越界、或者侵占或意外修改别的数据，致命的情况是造成安全隐患。

你能看到直接使用 union 需要一个精明警醒的老练程序员，否则太容易出错了。通过简易地包装 union 我们可以定义更安全的使用方式：

```cpp
struct S {
  private:
    enum{CHAR, INT, DOUBLE} tag;
    union
    {
        char c;
        int i;
        double d;
    };

  public:
    void put(char c){ this->c = c; tag = CHAR; }
    void put(int i){ this->i = i; tag = INT; }
    void put(double d){ this->d = d; tag = DOUBLE; }

    int get_int() const { if (tag==INT) return i; throw; }
    // ...
}
```

然而它也只是有限的安全，而且并不易用，你可以进一步改进，但能做的并不多。

上述的包装方案实际上就是 [Tagged Union](https://en.wikipedia.org/wiki/Tagged_union) 的简写示意版。所谓的 `标签联合`，也正是变体类型的最经典的方案。

事实上，变体类型理所当然地就是应该被如此实现的，不同的方案的区别只在于：**标签放哪里，应该被如何具现**。



#### Variant

在 VC++ 中，随着 OLE/COM/MFC/ATL 类库而来的还有一个 `VARIANT` 类型及其包装。

各种第三方库也有一些 variant 的实现，例如 `boost::varian`。

在支持 RTTI 的编译器中，你也可以通过 typeid 关键字的方式来自行实现。其坏处在于 RTTI 本身会带来少许的性能开销，不过甚至是上月球，可能也都不会在意这个开销能有多大，也许只有华尔街的高频交易才会 Care 它。

不使用 RTTI，我们仍然有武器：template。实际上，大多数第三方库对 variant 的实现方案，一律都是借助模板的类型安全手段。



### C++17 的 `std::variant`

但不管怎么说，现在尘埃落定了，C++14 没有加入的 `std::variant` 终于在 17 中列装了标准库。它和 C++11 的 `std::regex` 一样，是关键性的、决定性的。

#### 基本操作

`std::variant` 提供一个**类型安全**的变体类型，它的特点在于：

1. 通过可变的模板参数（variable template，variadic template）你可以指定一组可选类型，它们将是这个实例类型所支持的值类型表。例如 `std::variant<int, boo>` 允许你放入 int 或者 bool 的值并安全的抽出它。
2. 其实例在任意时刻要么包含一个其可选类型之一的值，要么处于病式状态。
3. 其实例的默认值为其首个可选类型的默认构造值。即 `std::variant<int, bool> a;` 语句中，`a` 具有 `(int)(0)` 值。如果首个可选类型没有默认的构造器，那么你需要显式地提供初始化表达式。
4. 不支持引用类型，数组，void 等作为其可选类型。

类模板 `std::variant` 并没有无值状态，默认构造的 `variant` 保有其首个选项的值，除非该选项不是可默认构造的。所以有时候你可能需要一个空结构来表达无值态，这种情况下一般应该使用辅助类 [`std::monostate`](https://zh.cppreference.com/w/cpp/utility/variant/monostate) 使这种 `variant` ，它是一个标准库中的空结构，可以被借用来表达空值。

```cpp
#include <variant>
#include <string>
#include <cassert>

std::variant<std::monostate, int, bool, float> v; // v的初值现在为 std::monostate{}
if (std::holds_alternative<std::monostate>(v)) {
  // std::cout << "empty value" << std::endl;
}
```

你能看到我们通过 `std::holds_alternative<T>` 来测试 variant 中的值是不是某种特定类型，注意这是运行期的测试。

可以使用 `std::get` 或者 `std::get_if` 来抽取特定类型的值，区别在于是抛出异常还是返回 nullptr：

```cpp
#include <variant>
#include <string>
#include <cassert>

std::variant<std::monostate, int, bool, float> v;

v = 12;
// std::cout << "valid: " << std::get<int>(v) <<< std::endl;

v = true;
assert(v.index() == 2);

v = 3.14;
assert(v.index() == 1);
try {
    std::get<int>(v); // v 含 float 而非 int, 将抛出异常
}
catch (const std::bad_variant_access&) {}

if (auto pval = std::get_if<int>(&v)) // get_if 不抛出异常而是返回 null 指针
    std::cout << "variant value: " << *pval << '\n';
```

可选类型的构造函数只要无歧义，那么一定程度上的自动转换是可行的：

```cpp
#include <variant>
#include <string>
#include <cassert>

{
    using namespace std::literals;
 
    std::variant<std::string> x("abc"); // 转换构造函数在无歧义时起作用
    x = "def"; // 转换赋值在无歧义时亦起作用
 
    std::variant<std::string, void const*> y("abc");
    // 传递 char const * 时转换成 void const *
    assert(std::holds_alternative<void const*>(y)); // 成功
    y = "xyz";
    assert(std::holds_alternative<std::string>(y)); // 失败
}
```





#### 通过 visit

可以通过 std::visit 提供一组观察器来抽出实际值，这是替代 switch 语句的好途径，但也不必纠结。

简单地看，你可以在一个结构中定义和 variant 可选类型相同的函数重载，然后利用这些重载来处理对应的可选类型。其概要结构是这样的：

```cpp
struct Visitor {
   void operator()(float) const {}
   void operator()(bool) const {}
   void operator()(int) const {}
   void operator()(const std::monostate&) const{}
};

std::variant<std::monostate, int, bool, float> v = 1;
std::visit(Visitor{}, v); // for int
v = std::monostate{};
std::visit(Visitor{}, v); // for std::monostate
v = 2.718f;
std::visit(Visitor{}, v); // for float
```

上面的结构是为了让你理解 visit 要 what，how。但 visit 实际上可以采用更多的语法形式，下面是摘自 cppreferences 的例子：

```cpp
#include <iomanip>
#include <iostream>
#include <string>
#include <type_traits>
#include <variant>
#include <vector>
 
// 要观览的 variant
using var_t = std::variant<int, long, double, std::string>;
 
// 观览器 #3 的辅助常量
template<class> inline constexpr bool always_false_v = false;
 
// 观览器 #4 的辅助类型
template<class... Ts> struct overloaded : Ts... { using Ts::operator()...; };
// 显式推导指引（ C++20 起不需要）
template<class... Ts> overloaded(Ts...) -> overloaded<Ts...>;
 
int main() {
    std::vector<var_t> vec = {10, 15l, 1.5, "hello"};
    for(auto&& v: vec) {
        // 1. void 观览器，仅为其副效应调用
        std::visit([](auto&& arg){std::cout << arg;}, v);
 
        // 2. 返回值的观览器，返回另一 variant 的常见模式
        var_t w = std::visit([](auto&& arg) -> var_t {return arg + arg;}, v);
 
        std::cout << ". After doubling, variant holds ";
        // 3. 类型匹配观览器：亦能为带 4 个重载的 operator() 的类
        std::visit([](auto&& arg) {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (std::is_same_v<T, int>)
                std::cout << "int with value " << arg << '\n';
            else if constexpr (std::is_same_v<T, long>)
                std::cout << "long with value " << arg << '\n';
            else if constexpr (std::is_same_v<T, double>)
                std::cout << "double with value " << arg << '\n';
            else if constexpr (std::is_same_v<T, std::string>)
                std::cout << "std::string with value " << std::quoted(arg) << '\n';
            else 
                static_assert(always_false_v<T>, "non-exhaustive visitor!");
        }, w);
    }
 
    for (auto&& v: vec) {
        // 4. 另一种类型匹配观览器：有三个重载的 operator() 的类
        std::visit(overloaded {
            [](auto arg) { std::cout << arg << ' '; },
            [](double arg) { std::cout << std::fixed << arg << ' '; },
            [](const std::string& arg) { std::cout << std::quoted(arg) << ' '; },
        }, v);
    }
}
```



#### 复制的代价

由于 `std::variant` 身为容器并持有其可选类型的值，因此复制语义的后果是深度复制相应的值，这也同时代表着复制的代价是相当昂贵的。

所以 `std::variant` 也提供原位构造 emplace 和交换 swap 来降低深度复制带来的开销：

```cpp
#include <iostream>
#include <string>
#include <variant>

typedef std::variant<int, std::string> var_t;
var_t v{"a string"};
std::visit([] (auto&& x) { std::cout << x << ' '; }, v);
v.emplace<int>(37); // construct a int, and destroy the old string
std::visit([] (auto&& x) { std::cout << x << ' '; }, v);


var_t z{3};
z.swap(v);
std::visit([] (auto&& x) { std::cout << x << ' '; }, v);

std::swap(z, v);
std::visit([] (auto&& x) { std::cout << x << ' '; }, v);
```



#### 派生类

声明 `std::variant` 的派生子类是行得通的。

```cpp
class MyVarT: public std::variant<int, float> {
  public:
  MyVarT() = default;
  ~MyVarT() = default;
};

MyVarT v{ { 9 } };
```

如果你需要对特定类型封装抽出函数的话，借助于派生类可以很好地达到你的要求。



## 小结

`std::variant` 可以有广泛的用途，类库作者对这种东西根本没有丝毫抵抗力。

如果想做一个 JSON/YAML 处理器，那么你大概是绕不开 std::variant 的（或者类似品），这是它能大显身手的地方。

此外，像 [hedzr/cmdr](https://github.com/hedzr/cmdr) 这样的具有应用程序配置管理器的类库，当然也少不了 std::variant 的身影。只不过，hedzr/cmdr 是一个 Golang 版本。而它的 C++17 版本或许会将要放出来，我很久没在 C++ 这边研究过类库了，谦虚点说和初学者也没区别，重新来吧。



## :end:

- [std::variant at cppreference](https://zh.cppreference.com/w/cpp/utility/variant)
-  [Bartek's coding blog: Everything You Need to Know About std::variant from C++17](https://www.bfilipek.com/2018/06/variant.html) 







