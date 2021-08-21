---
layout: single
title: C++ 中的 Pipeable 编程
date: 2021-08-21 05:00:00 +0800
last_modified_at: 2021-08-21 17:31:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,pipeable,piped,boost,ranges,protocol-oriented,swift,protocol oriented,c#,kotlin,extension function]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/cpp11pipes.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  介绍 Pipeable 编程，引申到 std::ranges 等等...
---



## Pipeable

### 缘起

`Pipeable` 或许是相当有争议的一种 C++ 编程方式。

在 Boost 中有 pipeable ： [pipable — Boost.HigherOrderFunctions 0.6 documentation - master](https://www.boost.org/doc/libs/master/libs/hof/doc/html/include/boost/hof/pipable.html) 。它是 [hof 库](https://www.boost.org/doc/libs/release/libs/hof/) 的一个部分：

```c++
#include <boost/hof.hpp>
#include <cassert>
using namespace boost::hof;

struct sum
{
    template<class T, class U>
    T operator()(T x, U y) const
    {
        return x+y;
    }
};

int main() {
    assert(3 == (1 | pipable(sum())(2)));
    assert(3 == pipable(sum())(1, 2));
}
```

HOF 库是 Higher-order functions for C++ 的意思，其作者 [Paul Fultz II](http://pfultz2.com/blog/) 也是名人。在他的博客中有两篇 Posts 和本文主题相关：

1.  [Pipable functions in C++14](http://pfultz2.com/blog/2014/09/05/pipable-functions/) 
2.  [Extension methods in C++](http://pfultz2.com/blog/2013/02/14/extensions/) 

同样地，Boost 中也有  [Extension methods](https://www.boost.org/doc/libs/master/libs/hof/doc/html/doc/src/more_examples.html#extension-methods) 与之相对应。



### 基本机理

我们注意到，Pipeable 编程的起源来自于 OS Shell 中的管道操作，例如：

```bash
cat 1.txt | grep 'best of' | uniq -c | head -10
```

特别是当 C++ 的运算符 '|'（逻辑或）也能被重载时，一切似乎就变得顺理成章了。

它的 C++ 关键思路是做 '|' 操作符重载以及 '()' 操作符重载：

```c++
template<class F>
struct pipe_closure : F
{
    template<class... Xs>
    pipe_closure(Xs&&... xs) : F(std::forward<Xs>(xs)...)
    { }
};

template<class T, class F>
decltype(auto) operator|(T&& x, const pipe_closure<F>& p)
{
    return p(std::forward<T>(x));
}
```

于是用户类 F 就能够在 pipe_closure<F> 的装饰下具有 '|' 操作的能力（只要 F 也实现了 '()' 操作符重载：

```c++
struct add_one_f
{
    template<class T>
    auto operator()(T x) const // `T const &x` is better
    {
        return x + 1;
    }
};
```

那么 pipeable 串联操作就像这样：

```c++
const pipe_closure<add_one_f> add_one = { };
int number_3 = 1 | add_one | add_one;
std::cout << number_3 << std::endl;
```

要注意 '()' 操作符接受泛型类 T 为入参，这样就能够收到 `pip_closure<F>::operator |` 转发的 lhs 要件了，也即 "|" 操作符的左手操作数。这样一来，lhs 表达式的结果就被 pipe 到了 rhs 操作数到 `operator ()<T>()` 中，从而完成了这次管道操作。



### 略加改进的

显然这个思路还可以进一步美化。

```c++
namespace hicc::pipeable {

    template<class F>
    struct pipeable {
    private:
        F f;

    public:
        pipeable(F &&f)
            : f(std::forward<F>(f)) { }

        template<class... Xs>
        auto operator()(Xs &&...xs) -> decltype(std::bind(f, std::placeholders::_1, std::forward<Xs>(xs)...)) const {
            return std::bind(f, std::placeholders::_1, std::forward<Xs>(xs)...);
        }
    };

    template<class F>
    pipeable<F> piped(F &&f) { return pipeable<F>{std::forward<F>(f)}; }

    template<class T, class F>
    auto operator|(T &&x, const F &f) -> decltype(f(std::forward<T>(x))) {
        return f(std::forward<T>(x));
    }

} // namespace hicc::pipeable
```

然后，能够有更雅致的呈现：

```c++
void test_piped() {
    using namespace hicc::pipeable;

    {
        auto add = piped([](int x, int y) { return x + y; });
        auto mul = piped([](int x, int y) { return x * y; });
        int y = 5 | add(2) | mul(5) | add(1);
        hicc_print("    y = %d", y);

        int y2 = 5 | add(2) | piped([](int x, int y) { return x * y; })(5) | piped([](int x) { return x + 1; })();
        // Output: 36
        hicc_print("    y2 = %d", y2);
    }
}
```

上面的 pipeable class 以及 piped(...) 源于  [Functional pipeline in C++11 - Victor Laskin's Blog](http://vitiy.info/functional-pipeline-in-c11/)，他的实现更 meaningful，所以我们更喜欢一些。

> ACK：下图来自他的博客

![c++11 pipeline](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/cpp11pipes.png)

Paul Fultz II 的动机更优先，只是我从来不会真正使用 boost，它太庞大了，太完整了，根本不适合在工程中使用。我更喜欢相对轻量级的，但却有相对完整的。

如果你对 Paul Fultz II 的实现感兴趣，除了 boost::hof::pipeable 之外，他还制作了开源的 Linq： [pfultz2/Linq: Linq for list comprehension in C++](https://github.com/pfultz2/Linq) 。这是 C# Linq 技术的 C++ 实现，很 amazing，也很疯狂。



## 后继

以下是延伸阅读时间。

### ranges

当然，也需要提到的是 [std::ranges 范围库](https://zh.cppreference.com/w/cpp/ranges)，它是 C++20 带来的改变之一，不过目前 C++20 规范也没发布多久，工程应用并不现实。

ranges 也有同名的孵化项目  [ericniebler/range-v3: Range library for C++14/17/20, basis for C++20's std::ranges](https://github.com/ericniebler/range-v3) ，如果不想理机启用 c++20，那么可以使用这个项目，它需要 clang 3.6+ 或者 gcc 4.9.1，所以旧工程表示无压力。

总的来说，ranges 提供一种 filter 手段，在管道过滤的基础上你可以做筛选、排序、mapreduce 等等操作。

不过 range v3 也是褒贬不一了。

#### 怎么理解范围库？

实际上这个家伙和其它一些术语，例如 protocol，concept 等等同样地莫名其妙、不知所云。

你知道什么是概念吗？iykyk，我特么一真真的中国人还会对概念没概念吗。

不过，C++20 的 std::concept 就是个怪怪的东西。

它们的实际含义要去考究英文词根的词源，所以对于中国人来说很难直观理解。

在这里，我们不去管 ranges 词源问题，而是借助于 std::ranges::view 来理解它。范围库换个人话来说，就是对一个集合做一个截面，获得一个可观察到视图（view），然后对该 view 进行各种可能的操作，可以倍乘、加一，也可以计算均值、做其他聚集操作，还可以排序，更可以 map reduce。

能做什么的问题，不是 ranges 的问题，而是你准备如何在 ranges 提供的 view 上做操作的问题。所以想要运用好 ranges 库，你应该对函数式编程（functional programming）有足够的理解。对于 C# Linq 技术，RxJava 有理解的朋友能够很容易理解 std::ranges 的核心内涵。



#### 使用

至于使用 ranges，参考它们提供的例子：

```c++
#include <iostream>
#include <string>
#include <vector>

#include <range/v3/view/filter.hpp>
#include <range/v3/view/transform.hpp>
using std::cout;

int main()
{
    std::vector<int> const vi{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    using namespace ranges;
    auto rng = vi | views::filter([](int i) { return i % 2 == 0; }) |
               views::transform([](int i) { return std::to_string(i); });
    // prints: [2,4,6,8,10]
    cout << rng << '\n';
}
```

很难说这是不是进步。

### 别人家的孩子

康康 Kotlin 的：

```kotlin
val animals = listOf("raccoon", "reindeer", "cow", "camel", "giraffe", "goat")

// grouping by first char and collect only max of contains vowels
val compareByVowelCount = compareBy { s: String -> s.count { it in "aeiou" } }

val maxVowels = animals.groupingBy { it.first() }.reduce { _, a, b -> maxOf(a, b, compareByVowelCount) }

println(maxVowels) // {r=reindeer, c=camel, g=giraffe}
```

如果是 RxJava 的 Kotlin 更好看：

```kotlin
Observable.just("Apple", "Orange", "Banana")
.subscribe(
  { value -> println("Received: $value") }, // onNext
  { error -> println("Error: $error") },    // onError
  { println("Completed!") }                 // onComplete
)
```

要不是 Kotlin 总是带着 JVM，我就完整彻底地慕了。

当然 Rx 还有 c++ 版本 RxCpp，用起来是这个味道：

```c++
#include "rxcpp/rx.hpp"
namespace Rx {
using namespace rxcpp;
using namespace rxcpp::sources;
using namespace rxcpp::operators;
using namespace rxcpp::util;
}
using namespace Rx;

#include <regex>
#include <random>
using namespace std;
using namespace std::chrono;

int main()
{
    random_device rd;   // non-deterministic generator
    mt19937 gen(rd());
    uniform_int_distribution<> dist(4, 18);

    // for testing purposes, produce byte stream that from lines of text
    auto bytes = range(0, 10) |
        flat_map([&](int i){
            auto body = from((uint8_t)('A' + i)) |
                repeat(dist(gen)) |
                as_dynamic();
            auto delim = from((uint8_t)'\r');
            return from(body, delim) | concat();
        }) |
        window(17) |
        flat_map([](observable<uint8_t> w){
            return w |
                reduce(
                    vector<uint8_t>(),
                    [](vector<uint8_t> v, uint8_t b){
                        v.push_back(b);
                        return v;
                    }) |
                as_dynamic();
        }) |
        tap([](vector<uint8_t>& v){
            // print input packet of bytes
            copy(v.begin(), v.end(), ostream_iterator<long>(cout, " "));
            cout << endl;
        });

    // ...
		// full codes at: https://github.com/ReactiveX/RxCpp
    return 0;
}
```

只能说什么，坏就坏在 `[...](...){ ... }` 这样的 lambda 函数体太离谱了，相当不好看。它和 kotlin 的 lambda 一比较的话就只能退散了。

其实 C++11 以来的各种改变一直如此，造就了大量奇奇怪怪不符合直觉的东西。若非也有新造一些好东西，加上历史沿革，恐怕它也死了吧。



### 关于我提到的争议

首先一方面，C++ 的匿名函数形状太糟糕。请参考  [C++0x lambdas suck](https://kfsone.wordpress.com/2010/06/27/c0x-lambdas-suck/)，C++ lambda ugly 等等。

另一方面，我们不得不看到，这也是历史的原因，不提 C++ 的函数式原本有它自己的风格，而 ranges 之类的东西标准来的太迟，太多各种各样的实现造成了混乱，而标准嘛、总是姗姗来迟。

有了 C# 闭包，Java 8 闭包，Kotlin 闭包的珠玉在前，先入为主之下，C++ 的这一战役是胜不了了。



### 关于 Extension Method

这个概念，是协议化编程（Protocol-oriented Progamming）的一部分。

#### Swift

在 Swift 语言中，你可以通过 [Protocol](https://docs.swift.org/swift-book/LanguageGuide/Protocols.html) 的方式对任意一个类进行扩充（[Extensions](https://docs.swift.org/swift-book/LanguageGuide/Extensions.html)）。它表现的有些像这样：

```swift
let pythons = ["Eric", "Graham", "John", "Michael", "Terry", "Terry"]
let beatles = Set(["John", "Paul", "George", "Ringo"])

extension Collection {
    func summarize() {
        print("There are \(count) of us:")

        for name in self {
            print(name)
        }
    }
}

// Both Array and Set will now have that method, so we can try it out
pythons.summarize()
beatles.summarize()
```

另一个例子，在 String 类上增加一个 reverse() 方法（注：String 有原生方法 reversed()）：

```swift
import Foundation

extension String {
    func reverse() -> String {
        var word = [Character]()
        for char in self {
            word.insert(char, at: 0)
        }
        return String(word)
    }
}

var bobobo = "reversing"
print(bobobo.reverse())
// gnisrever
```

上面的例子们都没有利用 Protocol 进行约束，所以只展示了对已有的类做 Extension 的能力。你可以对符合特定 protocol 约束条件的泛型类进行 extension，从而让这组泛型类额外地具备一个新的方法。这些内容太庞大了，所以不再在这里继续展开了。

#### Kotlin

Kotlin 提供了 Extension Function 的手段，这对 Java 可以算是颠覆性的创新设计。

这次的例子稍微变一变：

```kotlin
fun String.reverseCaseOfString(): String {
    val inputCharArr = toCharArray()
    var output = ""
    for (i in 0 until inputCharArr.size) {
        output += if (inputCharArr[i].isUpperCase()) {
            inputCharArr[i].toLowerCase()
        } else {
            inputCharArr[i].toUpperCase()
        }
    }
    return output
}
```

这就为 String 类增加了 reverseCaseOfString() 方法，用起来和 String.length() 没有区别：

```kotlin
print("CaseSensitive".reverseCaseOfString())
```

做手机端开发的朋友对 Swift 和 Kotlin 的这个能力应该是很熟悉的。



#### 在 C++ 中

我已经研究、梦想了很久了（数年之久，跨了十年了），想要在 C++ 中能够做同样的事情。不过即使到 c++23 这也仍旧是不可能滴。

至于创作一个等效的 C++ 类库，屡败屡战之下，结论是仍旧不可能。

不那么完美地通过 c++ 来达到扩展已有类功能，可以通过 [Decorator Pattern](https://en.wikipedia.org/wiki/Decorator_pattern)，这是最规范的方案，但形状不好、累赘太多：

```c++
#include <iostream>
#include <string>

struct Shape {
  virtual ~Shape() = default;

  virtual std::string GetName() const = 0;
};

struct Circle : Shape {
  void Resize(float factor) { radius *= factor; }

  std::string GetName() const override {
    return std::string("A circle of radius ") + std::to_string(radius);
  }

  float radius = 10.0f;
};

struct ColoredShape : Shape {
  ColoredShape(const std::string& color, Shape* shape)
      : color(color), shape(shape) {}

  std::string GetName() const override {
    return shape->GetName() + " which is colored " + color;
  }

  std::string color;
  Shape* shape;
};

int main() {
  Circle circle;
  ColoredShape colored_shape("red", &circle);
  std::cout << colored_shape.GetName() << std::endl;
}
```

使用装饰模式，既可以装饰已有方法的实现，也可以新增方法（CIrcle.Resize()），但你需要显示地构造到装饰器类才行（`ColoredShape colored_shape("red", &circle)`）。改进的方法是利用模板类进行 mixin，但那也改善的有限。



## 小结

以上，个人观点，你随便看看就好——Dont come for me pls。

> Retried



:end:

