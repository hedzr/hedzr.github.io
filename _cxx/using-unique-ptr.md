---
layout: single
title: 'C++ 惯用法：使用 std::unique_ptr'
date: 2023-03-18 00:07:11 +0800
last_modified_at: 2023-03-18 00:29:11 +0800
Author: hedzr
tags: [cxx]
categories: cxx
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-1.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  C++ 惯用法：使用 `std::unique_ptr` ...
---

>**DRAFT**
>
>本文内容尚未审定，不确定是否存在错误解说之处，请谨慎阅读，欢迎纠错。

-  [如何：创建和使用 unique_ptr 实例 - Microsoft Learn](https://learn.microsoft.com/zh-cn/cpp/cpp/how-to-create-and-use-unique-ptr-instances?view=msvc-170) 
-  [条款21：优先使用std::make_unique和std::make_shared而不是直接使用new · Effective-Modern-Cpp-Zh](https://vivym.gitbooks.io/effective-modern-cpp-zh/content/SmartPointers/21-Prefer-std-make_unique-and-std-make_shared-to-direct-use-of-new.html) 
- [CProgramming.com: Move semantics and rvalue references in C++11](http://www.cprogramming.com/c++11/rvalue-references-and-move-semantics-in-c++11.html)
- [InformIT: Using unique_ptr, Part I](http://www.informit.com/guides/content.aspx?g=cplusplus&seqNum=400) BROKEN
- [InformIT: Using unique_ptr, Part II](http://www.informit.com/guides/content.aspx?g=cplusplus&seqNum=401) BROKEN
- [SmartBear: The Biggest Changes in C++11 (and Why You Should Care)](http://blog.smartbear.com/software-quality/bid/167271/The-Biggest-Changes-in-C-11-and-Why-You-Should-Care)
- [CodeProject: Unique_ptr custom deleters and class factories](http://www.codeproject.com/Tips/459832/Unique_ptr-custom-deleters-and-class-factories')
- [MSDN: How to: Create and Use unique_ptr Instances](http://msdn.microsoft.com/en-us/library/hh279676.aspx)
- [C++11: Using std::unique_ptr as a class member: initialization, move semantics and custom deleters - Katy's Code](https://katyscode.wordpress.com/2012/10/04/c11-using-stdunique_ptr-as-a-class-member-initialization-move-semantics-and-custom-deleters/) 





## 作为类成员



### 规范的用法

一个容器 Vec 包含有以 `std::unique_ptr` 来管理的成员变量时，要注意大家都应该使用移动构造函数，因为这样将会有利于从外向内赋值或者进行就地构造，避免重复多次的对象构造与析构。

```c++
namespace aml::sample::tool {
class EL {
 public:
  EL() = default;
  ~EL() = default;
  EL(EL const &o) : _name(o._name) {}
  explicit EL(std::string const &n) : _name(n) {}
  explicit EL(EL &&o) : _name(std::move(o._name)) {}
  explicit EL(std::string &&n) : _name(std::move(n)) {}
  EL &operator=(EL &&o) {
    _name = std::move(o._name);
    return (*this);
  }
  EL &operator=(std::string &&o) {
    _name = std::move(o);
    return (*this);
  }
  std::string _name;
};

class Vec {
 public:
  Vec() = default;
  ~Vec() = default;
  Vec(EL const &o) : _el(std::make_unique<EL>(o)) {}
  Vec(std::string const &o) : _el(std::make_unique<EL>(std::move(o))) {}
  // Vec(char const *o) : _el(std::make_unique<EL>(std::string(o))) {}
  explicit Vec(EL &&o) : _el(std::make_unique<EL>(std::move(o))) {}
  explicit Vec(std::string &&o) : _el(std::make_unique<EL>(std::move(o))) {}
  Vec &operator=(EL const &o) {
    _el = std::make_unique<EL>(o);
    return (*this);
  }
  Vec &operator=(std::string const &o) {
    _el = std::make_unique<EL>(std::move(o));
    return (*this);
  }
  Vec &operator=(EL &&o) {
    _el = std::make_unique<EL>(std::move(o));
    return (*this);
  }
  Vec &operator=(std::string &&o) {
    _el = std::make_unique<EL>(std::move(o));
    return (*this);
  }

 private:
  std::unique_ptr<EL> _el;
};
}  // namespace aml::sample::tool
```

由于编写了完整而全面的构造函数以及赋值函数，所以可以有多种初始化方法：

```c++
namespace aml::sample::tool {
inline void test1() {
  Vec vec = EL("el");     // EL(std::string &&n) -> Vec(EL const &o)
  Vec v1(EL("el"));       // EL(std::string &&n) -> Vec(EL &&o)
  EL el("el");            // EL(std::string &&n)
  Vec v2(std::move(el));  // EL(std::string &&n) -> Vec(EL &&o)
  Vec v3(el);             // EL(std::string &&n) -> Vec(EL const &o)
  Vec v4;                 //
  v4 = EL("el");  // EL(std::string &&n) -> Vec::operator=(std::string &&o)
  v4 = el;        // EL(std::string &&n) -> Vec::operator=(EL const &o)
  
  Vec v5{"el"}; // EL(std::string &&n) -> Vec(std::string &&o)
  Vec v6{std::string("el")};
}
inline void test2() {
  // Vec vec = "el";
  Vec v1("el");
  Vec v2;
  v2 = std::string("el");
  
  Vec v3{"el"};
}
}  // namespace aml::sample::tool
```

注意 `Vec v5{"el"};`，由于 Vec 以及 EL 均具有针对 std::string 的移动构造函数的存在，这一初始化语句首先使用 `EL(std::string &&n)` 构造一个 EL 的临时对象，然后使用 `Vec(std::string &&o)` 将临时对象移动到 Vec 中完成最终的初始化。其中 "el" 首先经由 std::string(char const*) 推导到 std::string 。

整个流程中 “el” 依次被拷贝送入 std::string 中，然后被移动送入 EL, Vec 中，没有多余的深拷贝，所以这是我们所期望的最佳结果。

少数情况下，由于给定的是左值 EL 对象实例，故而将会被迫采用 Vec(EL const& o) 进行拷贝，例如 `Vec vec = EL("el");` 和 `Vec v3(el);` 都会不得不产生额外的拷贝动作，这是因为给定的源 EL 实例是不可修改的。

### 类体系架构设计

在实际编码中，避免导致额外拷贝的情况，应该从类体系结构设计之初进行深入的架构设计。

但对于编码初期而言，又或者难以首先完成完备架构设计的情况下，一个策略是不要急于编写拷贝构造和拷贝赋值函数，但总是事先完成移动构造以及移动赋值。如此，借助于现代 IDE 的实时编译或者实时语法提示功能，在遇到无法构造、无法拷贝的情况下再来研究是否必须添加拷贝构造函数或拷贝赋值函数，并且尽可能地避免添加函数，转而设法规避所遇到的错误提示。有时候，简单的显式加上 std::move 即可规避问题——事实上此时本就应该采取移动语义。

> 如果你精通左右值语义，也熟悉大多数标准库类及其内部实现时，上述策略就是多余。
>
> 对于那些从 C++11 以前摸爬滚打上来的人，或者对左右值移动的掌握度低于 95% 的人来说，上面的策略可能会有点用处。
>
> 实际上，即使你完全掌握了，在编码过程中也难以避免一不小心就造就了多余的复制。对此也有事后的侦测手段可以从宏观角度来反向定位——Sanitizer 以及 Profiling 可以从不同角度提供观测表格以供分析和找到多余的拷贝。
>
> 现代 C++ 程序员是可以做到基本避免泄漏问题，然而在一个大规模应用中，他们不太容易做到基本避免冗余的拷贝问题。

其次，架构设计中，尽可能具像化资源管理器也是一个正确的思路：对于业务逻辑中的对象分配，统一丢进一个 pool 中对其进行资源管理即可完全防止产生资源/内存泄漏，而在业务关系建构时，总是从 pool 中取得对象的实例引用，使用该引用来完成关系搭建。这里所谓的引用，可以是 `Obj&`，也可以是 `shared_ptr<Obj>`，它们都可以隐含地使用一个指针来避免对象被深拷贝。由于没有显式的 `Obj*`，因而它们都很安全，不会被误操作。当你来不及构建周边代码时，可以临时地采用 `Obj*` 先期完成业务逻辑框架，稍后在替换为 shared_ptr。



### 使用定制释放器

unique_ptr 具有第二个模板参数 `_Dp` 以允许你指定定制的释放器。缺省时它会是 `std::delete<T>`，这会转发实际的 T* 指针给 `delete` 去完成删除。

很显然，你可以为一个经由 `malloc()` 分配的指针 p 定义一个定制的释放器 `std::free(p)`

```c++
struct freeable {
  void operator()(void *res) const { free(res); }
};

template<typename T>
using freeable_t = std::unique_ptr<T, freeable>;

void freeable_demo() {
  char *p = (char *) malloc(256);
  freeable_t<char> sp{p};
}
```

### 使用外部资源时

类似于 malloc 与 free，当我们在包装外部资源时，例如一个数据库连接指针，也可以采用相似的方法。

假定我们将这些外部资源都视作可关闭的（`closable`）,无论是数据库也好，还是 MQ 也好，它们的包装类总是使用 `void Close()` 来清理已经打开的资源。那么，对这些外部资源的管理可以是这样的省心的方式：

```c++
namespace aml::res {

  template<typename T>
  struct closable {
    void operator()(T *res) const {
      if (!res) res->Close();
    }
  };

  struct freeable {
    void operator()(void *res) const { free(res); }
  };

  class ExternalResource {
    public:
    virtual ~ExternalResource() = default;

    public:
    virtual void CreateResourceFromAPI() = 0;
    virtual void Close() = 0;
  };

  class ExternalResource1 : public ExternalResource {
    public:
    ~ExternalResource1() = default;
    ExternalResource1() = default;
    ExternalResource1(ExternalResource1 &&o) { swap(std::move(o)); }

    public:
    void CreateResourceFromAPI() override {}
    void Close() override {
      // do something to close the opened external resources
    }
    void swap(ExternalResource1 &&) {}
  };

  class ResourceClass {
    private:
    template<typename T, class Dp = closable<T>>
      using res_t = std::unique_ptr<T, Dp>;
    res_t<ExternalResource> _resource;

    public:
    explicit ResourceClass(ExternalResource *ptr = nullptr)
      : _resource(ptr) {}

    void OpenOrCreate() {
      ExternalResource *data = nullptr;
      // CreateResourceFromAPI(&data);
      _resource = res_t<ExternalResource>(data);
    }

    public:
    template<typename T>
    using freeable_t = std::unique_ptr<T, freeable>;
    void freeable_demo() {
      char *p = (char *) malloc(256);
      freeable_t<char> sp{p};
    }
  };

} // namespace aml::res
```

为节省篇幅，实际代码可能与上面给出的示例有所不同。但示例代码演示了如何建立类体系结构以便不再操心资源泄漏问题。

当然，你其实也可以使用 C 函数指针的方式来构造释放器：

```c++
void closeResource(Resource *res) {
  res->Close();
}

class ResourceClass {
  private:
  std::unique_ptr<Resource, void (*)(Resource *)> resource;
  public:
  ResourceClass(...) : resource(new Resource, closeResource) {
    // Do something to populate 'resource' if needed
  }
};
```

效果相同，但比较节省键击。缺点在于在整篇的现代 C++ 中，使用 `free()` 或者 `function pointer` 总是显得有点突兀——假如强迫症的话一定不能忍。 

## 🔚



