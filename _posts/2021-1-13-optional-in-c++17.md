---
layout: single
title: 'C++17 中的 std::optional 等等'
date: 2021-1-13 06:00:00 +0800
last_modified_at: 2021-1-13 06:27:12 +0800
Author: hedzr
tags: [c++, variant, optional, any, union]
categories: c++ variant
comments: true
toc: true
header:
  overlay_image: /assets/images/foo-bar-identity-th.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  关于 std::optional，也划归 variant 类别 ...
---



## 直入主题

本篇之中，仅仅述及 `std::optional`，其它和 variant 相关的话题以后再说吧。

`std::optional` 也划入 variant 类别中，其实它还是谈不上可称为变体类型的，但新版本中的三大件（optional，any and variant）也可以归一类无妨。



## C++17 之前

在 C 时代以及早期 C++ 时代，语法层面支持的 nullable 类型可以采用指针方式：`T*`，如果指针为 `NULL`（C++11 之后则使用 `nullptr`） 就表示无值状态（empty value）。

```cpp
typedef template <typename T> T* NullableT;
NullableT<int> pInt = nullptr;
```

为了更好地使用这个类别而不是总是采用指针，需要对其进行封装。下面给出一个示例（但并未完善）：

```cpp
// 使用 C++11 语法
namespace cmdr {
    template<typename T>
    class Nullable {
    public:
        Nullable() = default;

        virtual ~Nullable(){ if (_value) delete _value; }

    public:
        Nullable(const Nullable &o) { _copy(o); }

        Nullable &operator=(const Nullable &o) {
            _copy(o);
            return *this;
        }

        Nullable &operator=(const T &o) {
            this->_value = o;
            return *this;
        }

    private:
        void _copy(const Nullable &o) {
            this->_value = o._value;
        }

    public:
        T &val() { return *_value; }

        const T &val() const { return *_value; }

        void val(T &&v) {
            if (!_value)
                _value = new T;
            (*_value) = v;
        }

        explicit operator T() const { return val(); }

        explicit operator T() { return val(); }

        // operator ->
        // operator *
      
        [[nodiscard]] bool is_null() const { return !_value; }
        
    private:
        T *_value{nullptr};
    };// class Nullable<T>
}
```

所以，这个 `Nullable<T>` 现在很像 C# 或者 Kotlin 中的 T?。使用它和直接使用 T 差不多，只是隐含着 new/delete 的额外开销，当然我们也可以采用别的实现方案例如增加一个额外的 bool 成员变量来表示是否尚未赋值，这样就可以去掉 heap allocating 开销，孰优孰劣也未必可以计较。





## std::optional in C++17

`std::optional` 类似于 `Nullable<T>` 和 `std::variant` 的联合体，它管理一个 Nullable 变体类型。

但它和 `Nullable<T>` 不同之处在于，optional 实现的更为精炼和全面：Nullable 是刚才我手写的，甚至没经过编译器检验，也缺乏大多数重载以及构造特性。optional 在构造对象的开销方面比 Nullable 好无数倍，因为它能够利用原位构造特性使得自身的开销趋向于 0 而只需要 T 对象的构造开销，而 Nullable 为了表达出早期（C++03）的状态直接采用了 new/delete 来简化代码。

> 如果想要改进前文中 `Nullable<T>` 的实现，使其和 optional 一样地完善，则需要关注如下几点：
>
> 1. 去掉 new / delete 机制，考虑采用一个空结构来表达尚未赋值的状态：事实上，optional 使用了 std::nullopt_t 来表述该状态。
> 2. 完善操作符重载
> 3. 加入 swap 特性支持
> 4. 加入原位构造特性支持

optional 和 variant 也不同，variant 是提前确定好一组可选的类型，你只能在这一组类型中进行变换，而 optional 是具体化到一个特定类型的，你不能动态地将不同类型的值赋予 optional 的变量。

optional 从语法意义上来说，就是一个完美版的 `Nullable<T>`，你可以将其和 Kotlin 的可空类型等价。

### 使用



我们可以以多种方式来构造、声明 optional 的变量，最原始的方式是在构造参数时传入值对象：

```cpp
std::optional<int> opt_int(72);
std::optional opt_int2(8);
std::optional opt_int2(std::string("a string"));
```

使用 `std::make_optional<T>` 是比较 meaningful 的一种，而且也是更整洁的原位构造：

```cpp
auto opt_double = std::make_optional(3.14);
auto opt_complex = std::make_optional<std::complex<double>>(3.0, 4.0);
std::optional<std::complex<double>> opt_complex2{std::in_place, 3.0, 4.0};
```

使用原位构造

```cpp
// constructing a string in-place
std::optional<std::string> o1(std::in_place, "a string");
// with a repeated spaces
std::optional<std::string> o1(std::in_place, 8, ' ');
```

has_value 可以用于测试有没有值，是否尚未赋值：

```cpp
auto x = std::make_optional(9);
std::optional<int> y;
assert(x.hash_value() == true);
assert(y.hash_value() == false);

std::cout << x.value();
std::cout << y.value_or(0);
```

value() 和 value_or() 是抽出 T 值的方法，含义明显，不必赘述。当无值或者类型不能转换时，value() 有可能抛出异常 std::bad_optional_access，如果想要避免则可以使用 value_or。

对于复合对象来说，原位构造 emplace 也是可用的。同样地也可以善加利用 swap。

### 应用

optional 相当于一个全类型的 Nullable 类型，所以在运用工厂模式时将其作为创建器的返回值将会是非常适合的选择，好过无包装的 T* 或者智能指针。因为当你使用智能指针的工厂模式时，创建器只能创建基于一个公共基类的实例，所以受制较多。但采用 optional 时则不会收到基类指针的限制。

下面是来自于 cppreference 的示例：

```cpp
#include <string>
#include <functional>
#include <iostream>
#include <optional>
 
// optional 可用作可能失败的工厂的返回类型
std::optional<std::string> create(bool b) {
    if(b)
        return "Godzilla";
    else
        return {};
}
 
// 能用 std::nullopt 创建任何（空的） std::optional
auto create2(bool b) {
    return b ? std::optional<std::string>{"Godzilla"} : std::nullopt;
}
 
// std::reference_wrapper 可用于返回引用
auto create_ref(bool b) {
    static std::string value = "Godzilla";
    return b ? std::optional<std::reference_wrapper<std::string>>{value}
             : std::nullopt;
}
 
int main()
{
    std::cout << "create(false) returned "
              << create(false).value_or("empty") << '\n';
 
    // 返回 optional 的工厂函数可用作 while 和 if 的条件
    if (auto str = create2(true)) {
        std::cout << "create2(true) returned " << *str << '\n';
    }
 
    if (auto str = create_ref(true)) {
        // 用 get() 访问 reference_wrapper 的值
        std::cout << "create_ref(true) returned " << str->get() << '\n';
        str->get() = "Mothra";
        std::cout << "modifying it changed it to " << str->get() << '\n';
    }
}

// Output
create(false) returned empty
create2(true) returned Godzilla
create_ref(true) returned Godzilla
modifying it changed it to Mothra
```

此外，在搜索算法中返回搜索结果或者返回没找到状态，可以不必使用 bool 加上 search::result 了，可以直接返回 `std::optional<search::result>`。

这样的设计策略完全可以产生深远的影响。从有洁癖的我的心态出发，大多数类库都可以据此重新改写，从而得到更简练、更 meaningful 的接口。而更富有表达力的接口反过来也能影响到算法的实现部分，它们将会变得更易读，更可维护。

那些 Machine Learning 算法，写出来如同天书一般，但借助新的手段重构的话，有望可以增进理解程度。

所以，像 C# 具有了 Nullable 类型几十年（稍稍有点夸张）了之后，C++17 才正式支持 std::optional 实在是相当操蛋的一件事情。

### 和 Kotlin 比较

和 Kotlin 相比较的话，现阶段的 optional 不但冗长，而且缺乏一大组闭包工具（let，apply，类型诊断，空安全）。多数人将这些工具称作语法糖，但我更希望它们被视为必需品。下面是一段 Kotlin 的代码块，可以看出整体上它们的简练性，而 std::optional 嘛，实际上还差得远，看起来也不可能赶得上了：

```kotlin
if (obj is String!!) { // 对于 String? obj 也一样生效，自动升级为非空版本
    print(obj.length)
}

if (obj !is String) { // 与 !(obj is String) 相同
    print("Not a String")
} else {
    print(obj.length)
}

fun demo(x: Any) {
    if (x is String) {
        print(x.length) // x 自动转换为字符串
    }
}

when (x) {
    is Int -> print(x + 1)
    is String -> print(x.length + 1)
    is IntArray -> print(x.sum())
}

// 可空类型的集合
val nullableList: List<Int?> = listOf(1, 2, null, 4)
val intList: List<Int> = nullableList.filterNotNull()

// 可空类型的简化诊断代码块
Int? zz = 8;
zz?.let {
  sum += it // 仅当 zz 非空时， 块内才被执行，it 表示 zz 的非空版
}
```

Kotlin 的这套语法机制真的是让人如同吃了人参果，无一个毛孔不舒服。但是它的实现机制是低代价而非无代价的，从这一点上来说，C++ 将不可能采纳等效的新语法，只能使用 `std::optional<T>` 这样的老奶奶裹脚布方案了。但它至少比没有的好。





## 小结

通过和 Kotlin 的比较，我们不无悲哀地看到，比较于 C++11 甚至于 C++98，optional 固然是个提升，然而受制于 C++ 标准委员会以及历史包袱的原因，简练有效的表达方式在现在不可能，在未来的 C++2x, 3x 中也应该是行不通的。



## :end:

- [std::optional at cppreference](https://zh.cppreference.com/w/cpp/utility/optional)
-  







