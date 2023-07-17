---

layout: single
title: 'C++ 命名空间'
date: 2023-7-17 05:00:00 +0800
last_modified_at: 2023-7-17 07:21:12 +0800
Author: hedzr
tags: [c++, namespace]
categories: c++ namespace
comments: true
toc: true
header:
  teaser: /assets/images/foo-bar-identity-th.jpg
  overlay_image: /assets/images/foo-bar-identity-th.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  回顾 C++ 中的命名空间（namespace） ...
---

> 父亲大人终于去和母亲大人团聚了，在那边应该少了很多烦心事的吧。
>
> 我常常想，为什么父亲大人放弃写出点什么，也完全不在意他的书法会不会、有没有被传承下去。这是难以明白的事情之一。
>
> 不过，可可很好，她及时赶回来见到了爷爷一面，两小时后爷爷终于停止了呼吸，或者他是等到了他在这个世界还想等待的吧。
>
> 十一天后，我想着我该继续写写什么了，我选的是 C++，这毕竟是我弄了很多年的家伙事，我还能写点什么呢？不着急，我真的需要歇歇、想想，毕竟在这边世界里我现在是个孤儿了，宝宝心里苦啊。





本文中回顾 C++ 中命名空间这种语法概念，算是一个横向的综合介绍吧——主要从符号表的融合这个角度来谈论。难以控制深浅，全由己心、自由放飞。



## Intro

命名空间（namespace），有时又被称作名字空间，它是一种用于限定标识符可见性范围的语法单元。

它是允许嵌套的。

你可以想象从根节点开始的一颗语法树，每个分支节点就是一层/一级命名空间，标识符（例如函数、变量名，类定义等等）被挂在分支节点上，形成一个子名称空间。所以不同分支节点上允许定义相同名字的标识符，它们彼此没有冲突。每个标识符事实上由一条完整的路径（例如 stl/basics/int_pair）来指示而不是仅仅是其标识符名字。

所谓的可见性范围在 C++ 以及大多数高级语言中又被称作作用域。不过 namespace 是一种特殊抽象的作用域，它和语句块（即大括号包围的一组语句，例如函数的实现部分，if 语句的从句部分）这样的约定为处于执行态的作用域还是有所区别。

已知的编译器们将一个 namespace 单元视为一个由标识符名字领导的作用域，其中包含了处于该作用域内的标识符。此外，全局变量默认属于命名空间树中的根节点。如果你使用了全局匿名命名空间，它会被编译器隐式地赋予一个唯一标识符，并挂接在根节点上。至于函数实现部分、类的定义部分、乃至于语句的从句部分和语句块，也可以被看作为一种隐式的命名空间，实际上编译器也为它们分配唯一标识符。

示例：

````c++
namespace A {
    auto a1 = 1.0f;
    namespace B {
        auto a2 = 2;
    }
}

namespace A::B {
    struct C {
        bool a3;
    };
}

void test_namespace_a() {
    A::B::C const c{true};
    std::cout << "A::B::C::a3: " << std::boolalpha << c.a3 << '\n';
    std::cout << "A::B::a2: " << A::B::a2 << '\n';
    std::cout << "A::a1: " << A::a1 << '\n';
}

############## Result:
A::B::C::a3: true
A::B::a2: 2
A::a1: 1
````

### History

大约在 1990～1994 年间，namespace 被首次提出和予以实现。据信由 Cfront 3（[here](https://github.com/farisawan-2000/cfront-3)，or [here](https://github.com/seyko2/cfront-3)）首先以前端方式实现了 namespace 以及其他的一些 C++ 新特性（诸如 template 等等）。

此后的十数年中，包括 Visual C++，Borland C++，Intel CPP，Dev C++等一系列主流编译器实现厂商陆续实现了原生的 namespace 语法，在 C++98/03 时期 namespace 已经是工业标准，STL 标准库也成为 C++ 标准的一部分。

在 C++11 年代，namespace 被规范化地提出，同时也包含了一系列基础特性的明确化、明晰化。此时 C++ 规范完全正规化，各种奇技淫巧被收编的收编，渐渐淡去的淡去，往事如烟，不值一哂。

从 C++11 起开始支持内联 namespace。

从 C++17 起支持嵌套 namespace 的简单定义语法 `namespace A::B {...}` 而无需展开形式 `namespace A { namespace B {...} }`。

从 C++20 起支持内联嵌套 namespace 的简单定义语法 `namespace A::inline B {...}`。



## 学习 namespace

### 语法

| `namespace` *命名空间名* `{` *声明序列* `}`                  | (1)  |            |
| ------------------------------------------------------------ | ---- | ---------- |
| `inline` `namespace` *命名空间名* `{` *声明序列* `}`         | (2)  | (C++11 起) |
| `namespace` `{` *声明序列* `}`                               | (3)  |            |
| *命名空间名* `::` *成员名*                                   | (4)  |            |
| `using` `namespace` *命名空间名* `;`                         | (5)  |            |
| `using` *命名空间名* `::` *成员名* `;`                       | (6)  |            |
| `namespace` *名字* `=` *有限定命名空间* `;`                  | (7)  |            |
| `namespace` *命名空间名* `::` *成员名* `{` *声明序列* `}`    | (8)  | (C++17 起) |
| `namespace` *命名空间名*`::inline` *成员名* `{` *声明序列* `}` | (9)  | (C++20 起) |

这些语法格式的基础含义不做解释了，你可以翻阅 [cppref](https://en.cppreference.com/w/cpp/language/namespace) 或者 C++ 入门材料，在前文 [Intro](#intro) 部分也已经进行了简略的提示可供参考。

精确的辨析可以参考 [cppref](https://en.cppreference.com/w/cpp/language/namespace)。但多数情况下凭藉直觉你应可无误书写。

```c++
namespace Q
{
    namespace V   // V 是 Q 的成员，且完全在 Q 内定义
    { // namespace Q::V { // C++17 起可以用来替代以上几行
        class C { void m(); }; // C 是 V 的成员且完全在 V 内定义，C::m 只是被声明
        void f(); // f 是 V 的成员，但只在此声明
    }
 
    void V::f() // 在 V 外对 V 的成员 f 的定义
                // f 的外围命名空间仍是全局命名空间、Q 与 Q::V
    {
        extern void h(); // 这声明了 ::Q::V::h
    }
 
    void V::C::m() // 在命名空间外（及类外）对 V::C::m 的定义
                   // 外围命名空间是全局命名空间、Q 与 Q::V
    {}
}
```

下面对于已经初步理解 namespace 和能够初步运用 namespace 的朋友们提供一些概念上的辨析和使用上的最佳实践。



### 命名空间的融合

在多个文件中都定义了 `namespace A {...}`，那么在编译器处理一个编译单元时，所有被 #include 的这些 namespace A 的定义将被融合在一起，形成一个单一的统一的命名空间，你可以使用 `A::name` 来访问这个单一的 A namespace。

> C++ 编译单元：
>
> 技术上说这是一个惯用语，是翻译单元（translation unit）的一个习惯性称呼。
>
> C++ 规范上来说没有真正的编译单元（compilation unit），只有翻译单元。早期的 C++ 总是借助于 Cfront 之类的处理器翻译到 C 代码然后再转译为 asm 和机器码的。
>
> 由于工业上的 C++ 编译器都“直接”产出机器码，所以我们惯常以编译来称呼这个过程。



### 匿名命名空间

匿名命名空间被编译器视作具体文件作用域下辖的“全局”变量作用域。一个匿名命名空间中的标识符在其它文件中是不可见的，仅从属于当前文件所在的编译单元。

同一文件中的所有匿名命名空间被隐式地融合在一起构成一个统一的命名空间。这个融合的效果如同具名的命名空间的行为一样，区别在于具名的命名空间是跨文件的。

在编译器眼里它仍是有名字的，只不过是由编译器自行为其分配一个唯一标识符而已。

但是这个匿名命名空间中的标识符能够在编译器查找全局符号时被检索到，即你可以将其视为受限的全局符号。注意这些标识符依然是处于一个隐式唯一的 namespace 之中，并不会污染全局符号表。

和 static 全局变量不同的是，匿名 namespace 中的符号并不处于本文件的全局符号表中。但相同则在于，两种变量都不在其他文件中可见。

```c++
namespace
{
    int i; // 定义 ::(独有)::i
}
 
void f()
{
    i++;   // 自增 ::(独有)::i
}
 
namespace A
{
    namespace
    {
        int i;        // A::(独有)::i
        int j;        // A::(独有)::j
    }
 
    void g() { i++; } // A::(独有)::i++
}
 
using namespace A; // 从 A 引入所有名称到全局命名空间
 
void h()
{
    i++;    // 错误：::(独有)::i 与 ::A::(独有)::i 均在作用域中
    A::i++; // OK：自增 A::(独有)::i
    j++;    // OK：自增 A::(独有)::j
}
```

在代码编写时有两种匿名 namespace，正常的和内联的。

内联的匿名 namespace 将标识符融合到当前编译单元的全局符号表中，这一点有别于正常的匿名空间。



### inline 命名空间

C++11起支持内联的命名空间。

一个内联命名空间在引用和名称查找时被特别对待，即名字可以省略。所以其中的标识符被融合到上级命名空间之中。这个作用往往被用于标识接口兼容的不同版本，以便实施二进制兼容。对于 ABI 兼容话题，则是另一个大型话题，以后有机会再予展开。

下面的示例代表着一种典型的用法：

```c++
namespace Contoso
{
  namespace v_10
  {
      template <typename T>
      class Funcs
      {
      public:
          Funcs(void);
          T Add(T a, T b);
          T Subtract(T a, T b);
          T Multiply(T a, T b);
          T Divide(T a, T b);
      };
  }


  inline namespace v_20
  {
      template <typename T>
      class Funcs
      {
      public:
          Funcs(void);
          T Add(T a, T b);
          T Subtract(T a, T b);
          T Multiply(T a, T b);
          std::vector<double> Log(double);
          T Accumulate(std::vector<T> nums);
    };
  }
}
```

在 C++17 之后，嵌套 namespaces 可以写作 `namespace A::B {...}`，但此时就无法解决内联 namespace 的书写问题。不过这个问题最终在 C++20 之后有了方案，可以写作：

`````c++
namespace Contoso::inline v_20
{
    template <typename T>
    class Funcs
    {
    public:
        Funcs(void);
        T Add(T a, T b);
        T Subtract(T a, T b);
        T Multiply(T a, T b);
        std::vector<double> Log(double);
        T Accumulate(std::vector<T> nums);
  };
}
`````

#### 标准库中的内联命名空间

STD 标准库中也广泛地应用了内联 namespace 来支持版本迭代或者其他目的。

最典型的例子是 std::string_literals

```c++
// C++14 中，std::literals 和它的成员命名空间是内联的
{
    using namespace std::string_literals; // 令来自 std::literals::string_literals
                                          // 的 operator""s 可见
    auto str = "abc"s;
}
 
{
    using namespace std::literals; // 令 std::literals::string_literals::operator""s 与
                                   // std::literals::chrono_literals::operator""s 均可见
    auto str = "abc"s;
    auto min = 60s;
}
 
{
    using std::operator""s; // 令 std::literals::string_literals::operator""s 与
                            // std::literals::chrono_literals::operator""s 均可见
    auto str = "abc"s;
    auto min = 60s;
}
```



### using 声明

using 声明引入在别处定义的名称到此 using 声明出现的声明性区域。

它同时兼具将彼处的一组名称融合到当前作用域的能力，这一能力有时帮助程序员简化代码编写，有时则难免会污染当前作用域。

```c++
void f();
 
namespace A
{
    void g();
}
 
namespace X
{
    using ::f;        // 全局 f 现在作为 ::X::f 可见
    using A::g;       // A::g 现在作为 ::X::g 可见
    using A::g, A::g; //（C++17）OK：命名空间作用域允许双重声明
}
 
void h()
{
    X::f(); // 调用 ::f
    X::g(); // 调用 A::g
}
```

避免名字污染的方法有几种。其一是不要 using namespace，这当然是斩草除根的态度。不过还可以使用别名定义的方式来防止污染，例如

```c++
#include <iostream>
 
namespace foo {
    namespace bar {
         namespace baz {
             int qux = 42;
         }
    }
}
 
namespace fbz = foo::bar::baz;
 
int main()
{
    std::cout << fbz::qux << '\n';
}
```

为一个长名字定义别名是一种好的实践。

贸然使用 using namespace 是一种不被鼓励的行为。

即使使用了 using namespace std，你还是可以采用限定式语法例如 `std::endl` 和 `::endl` 等方式来避免歧义。但它不能解决无限定名字 `endl` 被意外地解释为 `std::endl`，所以在你的代码中随意使用 using namespace std 是不被鼓励的。



### using 还是 inline

以融合符号表为目的来看，using namespace 和 inline 都能达到效果。不过 inline namespace 是一次性操作，由设计者在发布时决定，而 using namespace 可以由使用者自由选用。

所以两者并无冲突。

对于版本迭代管理者而言，inline namespace 是一种关键性武器，值得好好使用。



### 扩充 std

借助于 namespace 的融合能力，我们有可能自行扩充 std 标准库。

有时候这个行为是一种必须品，例如在处理 hash value 时。

```c++
#include <iostream>
#include <iomanip>
#include <functional>
#include <string>
#include <unordered_set>
 
struct S {
    std::string first_name;
    std::string last_name;
};
bool operator==(const S& lhs, const S& rhs) {
    return lhs.first_name == rhs.first_name && lhs.last_name == rhs.last_name;
}
 
// 自定义散列函数能是独立函数对象：
struct MyHash
{
    std::size_t operator()(S const& s) const 
    {
        std::size_t h1 = std::hash<std::string>{}(s.first_name);
        std::size_t h2 = std::hash<std::string>{}(s.last_name);
        return h1 ^ (h2 << 1); // 或使用 boost::hash_combine （见讨论）
    }
};
 
// std::hash 的自定义特化能注入 namespace std
namespace std
{
    template<> struct hash<S>
    {
        typedef S argument_type;
        typedef std::size_t result_type;
        result_type operator()(argument_type const& s) const
        {
            result_type const h1 ( std::hash<std::string>{}(s.first_name) );
            result_type const h2 ( std::hash<std::string>{}(s.last_name) );
            return h1 ^ (h2 << 1); // 或使用 boost::hash_combine （见讨论）
        }
    };
}
 
int main()
{
    std::string str = "Meet the new boss...";
    std::size_t str_hash = std::hash<std::string>{}(str);
    std::cout << "hash(" << std::quoted(str) << ") = " << str_hash << '\n';
 
    S obj = { "Hubert", "Farnsworth"};
    // 使用独立的函数对象
    std::cout << "hash(" << std::quoted(obj.first_name) << ", "
              << std::quoted(obj.last_name) << ") = "
              << MyHash{}(obj) << " (using MyHash)\n" << std::setw(31) << "or "
              << std::hash<S>{}(obj) << " (using injected std::hash<S> specialization)\n";
 
    // 自定义散列函数令在无序容器中使用自定义类型可行
    // 此示例将使用注入的 std::hash 特化，
    // 若要使用 MyHash 替代，则将其作为第二模板参数传递
    std::unordered_set<S> names = {obj, {"Bender", "Rodriguez"}, {"Leela", "Turanga"} };
    for(auto& s: names)
        std::cout << std::quoted(s.first_name) << ' ' << std::quoted(s.last_name) << '\n';
}
```

可能的输出：

```bash
hash("Meet the new boss...") = 1861821886482076440
hash("Hubert", "Farnsworth") = 17622465712001802105 (using MyHash)
                            or 17622465712001802105 (using injected std::hash<S> specialization) 
"Turanga" "Leela"
"Bender" "Rodriguez"
"Hubert" "Farnsworth"
```

> 这一示例来自于 [cppreference example for user-defined hash functions](http://en.cppreference.com/w/cpp/utility/hash)
>
> 这个话题（用自定义类当作 haspmap 的 key）也可以查阅 [hash - C++ unordered_map using a custom class type as the key - Stack Overflow](https://stackoverflow.com/questions/17016175/c-unordered-map-using-a-custom-class-type-as-the-key) 







## Conclusion

对于普通开发者而言，namespace 有或是无其实无关紧要。namespace 作为一种组织工具，主要还是被类库设计者、应用程序框架设计者、架构设计者所使用。

它可以被用于组织一个大型框架到若干分层级的子概念中，从而帮助设计者和实现者采用分治法则来解决问题。

### 思考

有了 C++20 Modules，namespace 还需要吗？

这个问题，其实对于像我（们）这样的对此前 C++ 技术较为熟悉的人来讲，Modules 有点用，但其实 C++20里面的 Modules 只是一个未完成版，恐怕还得 23、26 才能像样。注意到人都会死，那么未来十年里的 C++ 规范的演进与实现、恐怕还是有阴影存在的。

没有 Modules，C++ 是很好地工作了几十年的，这中间 namespace 是不可缺少的设施之一。

所以这个问题不值得问。

### 进一步

每次谈论到未来规范，C++ 行走这么多年，就由不得不感慨 C# 真特么大冤种啊，语法层面上如此完美，但却因为不跨平台而活生生地垂死病中，这几年 dotnet(Core) 挣扎有点用，但又会有几多用处呢？



### REFs

- 
- 
- [Namespace - Wikipedia](https://en.wikipedia.org/wiki/Namespace)
- [名前空間 - Wikipedia](https://ja.wikipedia.org/wiki/%E5%90%8D%E5%89%8D%E7%A9%BA%E9%96%93)
- 
- 
- [名前空間 (C++) | Microsoft Learn](https://learn.microsoft.com/ja-jp/cpp/cpp/namespaces-cpp?view=msvc-170)
- [命名空间 (C++) | Microsoft Learn](https://learn.microsoft.com/zh-cn/cpp/cpp/namespaces-cpp?view=msvc-170)
- 
- 
- 
- 1