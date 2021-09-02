---
layout: single
title: "cxx 枚举类型"
date: 2021-08-31 22:00:00 +0800
last_modified_at: 2021-09-01 01:11:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,enum class]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210901010943203.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  C++ 中的枚举类型应用以及转换到字符串的增强：AWESOME_MAKE_ENUM，...
---



> 因为临时发现需要一个枚举量到字符串的转换器，所以干脆梳理了以便古往今来的枚举类型的变化。
>
> 于是奇怪的冷知识又增加了。

## 枚举类型

![image-20210901010943203](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210901010943203.png)

### enum

在 cxx11 之前，C/C++ 通过 enum 关键字声明枚举量。

```c++
// 匿名全局枚举量
enum {
  DOG,
  CAT = 100,
  HORSE = 1000
};

enum Animal {
  DOG,
  CAT = 100,
  HORSE = 1000
};
```

从 cxx11 起，enum 允许使用不同于 integer 的其它数据类型。此时它的语法是这样的：

```
enum 名字(可选) : 类型 { 枚举项 = 常量表达式 , 枚举项 = 常量表达式 , ... }
enum 名字 : 类型 ;
```

所以在必要时可以：

```c++
enum smallenum: std::int16_t {
    a,
    b,
    c
};
```

但类型并不允许大过 int，受制于 CPU 字长。所以类型的支持几乎没有任何实用价值，不知道那堆人怎么想的，看来嵌入式真的很火。

### enum class

从 cxx11 起，我们被推荐放弃 enum 改用有作用域的 enum class，也或者 enum struct。这时候声明枚举类型的方式如下：

```c++
enum class Animal {
  DOG,
  CAT = 100,
  HORSE = 1000
};
```

同样也支持 `:类型` 的类型限定，同样地，没什么用处。

```c++
// altitude 可以是 altitude::high 或 altitude::low
enum class altitude: char
{ 
     high='h',
     low='l', // C++11 允许尾随逗号
}; 
```

#### 区别

enum class 与 enum 的不同之处在于作用域受限以及强类型限定。

作用域受限主要体现在 class/struct 中的 enum class 被其外围所限定。下面的例子可以简单地说明：

```c++
enum class fruit { orange, apple };
struct S {
  using enum fruit; // OK ：引入 orange 与 apple 到 S 中
};
void f() {
    S s;
    s.orange;  // OK ：指名 fruit::orange
    S::orange; // OK ：指名 fruit::orange
}
```

这对于内外同名的情况有很好的支持。

强类型限定现在拒绝枚举量与 int 之间的隐式强制与互换，但支持 `static_cast<int>(enum-value)` 的方式获取到枚举量的底层 int 值。另外，枚举在满足下列条件时都能用[列表初始化](https://zh.cppreference.com/w/cpp/language/list_initialization)从一个整数初始化而无需转型：

- 初始化是直接列表初始化
- 初始化器列表仅有单个元素
- 枚举是底层类型固定的有作用域枚举或无作用域枚举
- 转换为非窄化转换

#### is_enum 和 underlying_type

由于枚举类型现在是强类型了，所以标准库也有专用的 type check 对其进行检测：

```c++
#include <iostream>
#include <type_traits>
 
class A {};
 
enum E {};
 
enum class Ec : int {};
 
int main() {
    std::cout << std::boolalpha;
    std::cout << std::is_enum<A>::value << '\n';
    std::cout << std::is_enum<E>::value << '\n';
    std::cout << std::is_enum<Ec>::value << '\n';
    std::cout << std::is_enum<int>::value << '\n';
}

// Output
false
true
true
false
```

并且可以用 std::underlying_type 或 std::underlying_type_t 来抽出相应的底层类型。示例如下：

```c++
#include <iostream>
#include <type_traits>
 
enum e1 {};
enum class e2 {};
enum class e3: unsigned {};
enum class e4: int {};
 
int main() {
 
  constexpr bool e1_t = std::is_same_v< std::underlying_type_t<e1>, int >;
  constexpr bool e2_t = std::is_same_v< std::underlying_type_t<e2>, int >;
  constexpr bool e3_t = std::is_same_v< std::underlying_type_t<e3>, int >;
  constexpr bool e4_t = std::is_same_v< std::underlying_type_t<e4>, int >;
 
  std::cout
    << "underlying type for 'e1' is " << (e1_t ? "int" : "non-int") << '\n'
    << "underlying type for 'e2' is " << (e2_t ? "int" : "non-int") << '\n'
    << "underlying type for 'e3' is " << (e3_t ? "int" : "non-int") << '\n'
    << "underlying type for 'e4' is " << (e4_t ? "int" : "non-int") << '\n'
    ;
}
```

可能的输出：

```
underlying type for 'e1' is non-int
underlying type for 'e2' is int
underlying type for 'e3' is non-int
underlying type for 'e4' is int
```





### cxx20

#### using enum

在 cxx20 中枚举类能够被 using。这有可能是一个很重要的特性，当我们想要字符串化枚举量时可能需要一个可展开的枚举量列表。

`using enum Xxx` 能够削减枚举类的名字空间：

```c++
void foo(Color c)
  using enum Color;
  switch (c) {
    case Red: ...;
    case Green: ...;
    case Blue: ...;
    // etc
  }
}
```

然而对于早期（cxx11..cxx17）的代码来说，你必须使用全限定名：

```c++
void foo(Color c)
  switch (c) {
    case Color::Red: ...;
    case Color::Green: ...;
    case Color::Blue: ...;
    // etc
  }
}
```

孰优孰劣呢？

我比较支持全限定名方式，它显得正规明晰，而那一点点键入时的麻烦一般的 IDE 都可以自动补全所以无问题。

在特殊场景中 cxx20 的这个特性可能是非常关键的，但由于大抵你不可能遇到，所以我也就不解释这种场景如何难得、如何无法解决、如何被迫采用其它手段了。



### cxx23

#### std::is_scoped_enum 和 std::to_underlying

在 cxx23 中继续新增类型检查 std::is_scoped_enum，这没什么好说的。

此外就是 std::to_underlying 了，你可以不必使用 static_cast 了。真的没什么卵用，我特么还不如写 static_cast 呐。



## 对其增强：AWESOME_MAKE_ENUM

一个显而易见的场所就是枚举量的字符串化了。

### 手撸

简单的手撸可以这样：

```c++
#include <iostream>
#include <string>
#include <chrono>

using std::cout; using std::cin;
using std::endl; using std::string;

enum Fruit { Banana, Coconut, Mango, Carambola, Total } ;
static const char *enum_str[] =
        { "Banana Pie", "Coconut Tart", "Mango Cookie", "Carambola Crumble" };

string getStringForEnum( int enum_val )
{
    string tmp(enum_str[enum_val]);
    return tmp;
}

int main(){
    string todays_dish = getStringForEnum(Banana);
    cout << todays_dish << endl;

    return EXIT_SUCCESS;
}
```

### 三方库

另外，已经有一个较成熟的全面的支撑在 [Neargye/magic_enum](https://github.com/Neargye/magic_enum)，他使用了有趣的技术来提供各种各样的 enum class 的额外支持，诸如 enum_cast, enum_name, enum_value, enum_values 等等。他也向你充分地展示了 c++ 的跨编译器能力是多么的变态。

### AWESOME_MAKE_ENUM

如果你不想集成 magic_enum 那么全面的能力，而是仅仅只需要一个简单的字面量映射的话，我们在 [hicc-cxx](https://github.com/hedzr/hicc)/[cmdr-cxx](https://github.com/hedzr.cmdr-cxx) 中提供了一个宏 AWESOME_MAKE_ENUM（基于 [Debdatta Basu](https://stackoverflow.com/users/1078703/debdatta-basu) 提供的版本），用它的话你可以以很少量的代价获得枚举量的字面量表示。

```c++
#include <cmdr/cmdr_defs.hh>

/* enum class Week {
  Sunday, Monday, Tuesday, 
  Wednesday, Thursday, Friday, Saturday
}; */
AWESOME_MAKE_ENUM(Week,
                  Sunday, Monday, Tuesday, 
                  Wednesday, Thursday, Friday, Saturday);

std::cout << Week::Saturday << '\n';
// Output:
// Week::Saturday

AWESOME_MAKE_ENUM(Animal
                  DOG,
                  CAT = 100,
                  HORSE = 1000
};

auto dog = Animal::DOG;
std::cout << dog << '\n';
std::cout << Animal::HORSE << '\n';
std::cout << Animal::CAT << '\n';
// Output:
// Animal::DOG
// Animal::HORSE
// Animal::CAT
```

我得承认，AWESOME_MAKE_ENUM 的实现是比较低效率的，这可能是不得不付出的代价，所以它应该只被用在少量的字符串输出场所。但哪怕它是那么的低效，其实也不算什么，只要你不在高频交易中频繁地使用它的字符串输出特性，那就算不得个什么。

`AWESOME_MAKE_ENUM` 的实现是这样的：

```c++
#define AWESOME_MAKE_ENUM(name, ...)                                \
    enum class name { __VA_ARGS__,                                  \
                      __COUNT };                                    \
    inline std::ostream &operator<<(std::ostream &os, name value) { \
        std::string enumName = #name;                               \
        std::string str = #__VA_ARGS__;                             \
        int len = str.length(), val = -1;                           \
        std::map<int, std::string> maps;                            \
        std::ostringstream temp;                                    \
        for (int i = 0; i < len; i++) {                             \
            if (isspace(str[i])) continue;                          \
            if (str[i] == ',') {                                    \
                std::string s0 = temp.str();                        \
                auto ix = s0.find('=');                             \
                if (ix != std::string::npos) {                      \
                    auto s2 = s0.substr(ix + 1);                    \
                    s0 = s0.substr(0, ix);                          \
                    std::stringstream ss(s2);                       \
                    ss >> val;                                      \
                } else                                              \
                    val++;                                          \
                maps.emplace(val, s0);                              \
                temp.str(std::string());                            \
            } else                                                  \
                temp << str[i];                                     \
        }                                                           \
        std::string s0 = temp.str();                                \
        auto ix = s0.find('=');                                     \
        if (ix != std::string::npos) {                              \
            auto s2 = s0.substr(ix + 1);                            \
            s0 = s0.substr(0, ix);                                  \
            std::stringstream ss(s2);                               \
            ss >> val;                                              \
        } else                                                      \
            val++;                                                  \
        maps.emplace(val, s0);                                      \
        os << enumName << "::" << maps[(int) value];                \
        return os;                                                  \
    }

```

它需要 `__VA_ARGS__`  这种变参宏展开能力，以下编译器（完整在 [这里](https://en.wikipedia.org/wiki/Variadic_macro_in_the_C_preprocessor)）都能支持：

- Gcc 3+
- clang
- Visual Studio 2005+

此外，你也需要 c++11 编译器。

从道理上讲，我本也可以继续提供字符串 parse 的功能，但想到这本来就是一个将就的快速版本，也就没必要完善了，cxx11 以来 10 年了，这些方面有很多实现版本都是较为完善的，虽说各有各的不适之处，但也没什么不能忍，不能忍就手撸两个 switch case 做正反向映射就足够了，能有多麻烦呢。

### 后话

当然，如果上面两种方法仍不满足，而且又很想弄个简单而*全面*的自动化映射，或许你可以在 [这里](https://stackoverflow.com/questions/201593/is-there-a-simple-way-to-convert-c-enum-to-string) 寻找一些思路，然后自行实现。



:end:

