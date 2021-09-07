---
layout: single
title: "谈 C++17 里的 FlyWeight 模式"
date: 2021-09-07 05:00:00 +0800
last_modified_at: 2021-09-07 20:00:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,flyweight pattern,design patterns]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210907201203834.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  关于享元模式的 C++17 中的较通用实现，...
---



回顾享元模式，考虑实作它的各种问题。

## Prologue

略过

## FlyWeight Pattern

### 理论

享元模式，是将复杂对象的相同的组成元素抽出并单独维护的一种结构型设计模式。这些相同的组成元素被称为共享元件，它们在一个单独的容器中被唯一性地管理，而复杂对象只需持有到该唯一实例的参考，而无需重复创建这样的相同的元素，从而能够大幅度地削减内存占用。

以字处理器为例，每个字符都具有独立的、区别于其它字符的特殊属性：例如字体样式，背景、边框、对齐等等。如果一个文档中全部字符都单独存储一份它的所有属性的副本，那么这将会是庞大的内存需求。但考虑到一大堆（例如1000个）字符可能都有相同的“宋体，9pt”这样的属性，那么实际上我们只需要单独存储一份“宋体，9pt”的字体样式属性，而一个字符只需要一个指向该字体样式属性的指针就可以了，这就比1000个字符的1000个字体样式属性拷贝要节约的多。

类似的案例还有相当多，例如例子系统中的每个粒子（例如子弹、弹片，或者敌方飞机）都有一些相同的属性（例如颜色，轮廓等等）占地不小，但值却相同。

#### 工厂模式

很容易想到，我们可以在一个工厂中就地管理享元对象。当客户以具体值来请求一个享元对象时，工厂会从一个字典中检索享元是否存在，然后返回该元素的参考引用给客户。如果享元尚未存在，那么工厂会创建它，然后在返回引用。

#### 不可变性

按照传统的说法，享元模式要求这些相同的部分（享元，相同的组成元素）是不可变的。但这并不是铁律。

一个方法是，以一个享元为整体，我们可以整体修改对象持有的享元参考。

例如我们正在修改字处理器中的一个单词的字体样式，从“宋体，9pt”改为“黑体，12pt”，那么我们可以直接修改引用指向。也就是说，我们提供 `character.apply_font_style(font_style& style)` 这样的整体修改接口。

另一个方法可以从更细的粒度出发进行修改，例如从“宋体，9pt”改为“宋体，10pt”，但在发生变更时，尝试从工厂中查证新值的参考。也就是说，我们提供 `character.set_font_size(float pt)` 这样的接口，但在其实现过程中记得去查证享元工厂（管理器）以求更新内部引用。











### C++ 实现

传统的享元模式的实现方式有这样的示例代码：

```c++
namespace hicc::dp::flyweight::basic {

  /**
     * flyweight Design Pattern
     *
     * Intent: Lets you fit more objects into the available amount of RAM by sharing
     * common parts of state between multiple objects, instead of keeping all of the
     * data in each object.
     */
  struct shared_state {
    std::string brand_;
    std::string model_;
    std::string color_;

    shared_state(const std::string &brand, const std::string &model, const std::string &color)
      : brand_(brand)
        , model_(model)
        , color_(color) {
      }

    friend std::ostream &operator<<(std::ostream &os, const shared_state &ss) {
      return os << "[ " << ss.brand_ << " , " << ss.model_ << " , " << ss.color_ << " ]";
    }
  };

  struct unique_state {
    std::string owner_;
    std::string plates_;

    unique_state(const std::string &owner, const std::string &plates)
      : owner_(owner)
        , plates_(plates) {
      }

    friend std::ostream &operator<<(std::ostream &os, const unique_state &us) {
      return os << "[ " << us.owner_ << " , " << us.plates_ << " ]";
    }
  };

  /**
     * The flyweight stores a common portion of the state (also called intrinsic
     * state) that belongs to multiple real business entities. The flyweight accepts
     * the rest of the state (extrinsic state, unique for each entity) via its
     * method parameters.
     */
  class flyweight {
    private:
    shared_state *shared_state_;

    public:
    flyweight(const shared_state *o)
      : shared_state_(new struct shared_state(*o)) {
      }
    flyweight(const flyweight &o)
      : shared_state_(new struct shared_state(*o.shared_state_)) {
      }
    ~flyweight() { delete shared_state_; }
    shared_state *state() const { return shared_state_; }
    void Operation(const unique_state &unique_state) const {
      std::cout << "flyweight: Displaying shared (" << *shared_state_ << ") and unique (" << unique_state << ") state.\n";
    }
  };

  /**
     * The flyweight Factory creates and manages the flyweight objects. It ensures
     * that flyweights are shared correctly. When the client requests a flyweight,
     * the factory either returns an existing instance or creates a new one, if it
     * doesn't exist yet.
     */
  class flyweight_factory {
    std::unordered_map<std::string, flyweight> flyweights_;
    std::string key(const shared_state &ss) const {
      return ss.brand_ + "_" + ss.model_ + "_" + ss.color_;
    }

    public:
    flyweight_factory(std::initializer_list<shared_state> lists) {
      for (const shared_state &ss : lists) {
        this->flyweights_.insert(std::make_pair<std::string, flyweight>(this->key(ss), flyweight(&ss)));
      }
    }

    /**
     * Returns an existing flyweight with a given state or creates a new one.
     */
    flyweight get(const shared_state &shared_state) {
      std::string key = this->key(shared_state);
      if (this->flyweights_.find(key) == this->flyweights_.end()) {
        std::cout << "flyweight_factory: Can't find a flyweight, creating new one.\n";
        this->flyweights_.insert(std::make_pair(key, flyweight(&shared_state)));
      } else {
        std::cout << "flyweight_factory: Reusing existing flyweight.\n";
      }
      return this->flyweights_.at(key);
    }
    void list() const {
      size_t count = this->flyweights_.size();
      std::cout << "\nflyweight_factory: I have " << count << " flyweights:\n";
      for (std::pair<std::string, flyweight> pair : this->flyweights_) {
        std::cout << pair.first << "\n";
      }
    }
  };

  // ...
  void AddCarToPoliceDatabase(
    flyweight_factory &ff,
    const std::string &plates, const std::string &owner,
    const std::string &brand, const std::string &model, const std::string &color) {
    std::cout << "\nClient: Adding a car to database.\n";
    const flyweight &flyweight = ff.get({brand, model, color});
    // The client code either stores or calculates extrinsic state and passes it
    // to the flyweight's methods.
    flyweight.Operation({owner, plates});
  }

} // namespace hicc::dp::flyweight::basic

void test_flyweight_basic() {
  using namespace hicc::dp::flyweight::basic;

  flyweight_factory *factory = new flyweight_factory({ {"Chevrolet", "Camaro2018", "pink"}, {"Mercedes Benz", "C300", "black"}, {"Mercedes Benz", "C500", "red"}, {"BMW", "M5", "red"}, {"BMW", "X6", "white"} });
  factory->list();

  AddCarToPoliceDatabase(*factory,
                         "CL234IR",
                         "James Doe",
                         "BMW",
                         "M5",
                         "red");

  AddCarToPoliceDatabase(*factory,
                         "CL234IR",
                         "James Doe",
                         "BMW",
                         "X1",
                         "red");
  factory->list();
  delete factory;
}
```

其输出结果如同这样：

```
--- BEGIN OF test_flyweight_basic                     ----------------------

flyweight_factory: I have 5 flyweights:
BMW_X6_white
Mercedes Benz_C500_red
Mercedes Benz_C300_black
BMW_M5_red
Chevrolet_Camaro2018_pink

Client: Adding a car to database.
flyweight_factory: Reusing existing flyweight.
flyweight: Displaying shared ([ BMW , M5 , red ]) and unique ([ James Doe , CL234IR ]) state.

Client: Adding a car to database.
flyweight_factory: Can't find a flyweight, creating new one.
flyweight: Displaying shared ([ BMW , X1 , red ]) and unique ([ James Doe , CL234IR ]) state.

flyweight_factory: I have 6 flyweights:
BMW_X1_red
Mercedes Benz_C300_black
BMW_X6_white
Mercedes Benz_C500_red
BMW_M5_red
Chevrolet_Camaro2018_pink
--- END OF test_flyweight_basic                       ----------------------
```

可以看到，像 `[ BMW , X1 , red ]` 这样的一个享元，单个实例较大（数十、数百乃至数十K 字节），而引用参考不过是一个指针的大小（通常是 64 bytes on 64-bit OS），那么最终节省的内存是非常可观的。







## 元编程中的 FlyWeight Pattern

上面的示例，已经是旧风格了，C++11 以后我们需要大量地使用智能指针、以及模板语法，而在 C++17 之后更好的原位构造能力允许我们的代码能够更加 meaningful。

### flyweight_factory

一个想法是，我们认为一个尽可能通用的享元工厂可能是有利于代码书写的。所以我们尝试这样一个享元工厂模板：

```c++
namespace hicc::dp::flyweight::meta {

  template<typename shared_t = shared_state_impl, typename unique_t = unique_state_impl>
  class flyweight {
    std::shared_ptr<shared_t> shared_state_;

    public:
    flyweight(flyweight const &o)
      : shared_state_(std::move(o.shared_state_)) {
      }
    flyweight(shared_t const &o)
      : shared_state_(std::make_shared<shared_t>(o)) {
      }
    ~flyweight() {}
    auto state() const { return shared_state_; }
    auto &state() { return shared_state_; }
    void Operation(const unique_t &unique_state) const {
      std::cout << "flyweight: Displaying shared (" << *shared_state_ << ") and unique (" << unique_state << ") state.\n";
    }
    friend std::ostream &operator<<(std::ostream &os, const flyweight &o) {
      return os << *o.shared_state_;
    }
  };

  template<typename shared_t = shared_state_impl,
  				 typename unique_t = unique_state_impl,
  				 typename flyweight_t = flyweight<shared_t, unique_t>,
  				 typename hasher_t = std::hash<shared_t>>
  class flyweight_factory {
    public:
    flyweight_factory() {}
    explicit flyweight_factory(std::initializer_list<shared_t> args) {
      for (auto const &ss : args) {
        flyweights_.emplace(_hasher(ss), flyweight_t(ss));
      }
    }

    flyweight_t get(shared_t const &shared_state) {
      auto key = _hasher(shared_state);
      if (this->flyweights_.find(key) == this->flyweights_.end()) {
        std::cout << "flyweight_factory: Can't find a flyweight, creating new one.\n";
        this->flyweights_.emplace(key, flyweight_t(shared_state));
      } else {
        std::cout << "flyweight_factory: Reusing existing flyweight.\n";
      }
      return this->flyweights_.at(key);
    }
    void list() const {
      size_t count = this->flyweights_.size();
      std::cout << "\nflyweight_factory: I have " << count << " flyweights:\n";
      for (auto const &pair : this->flyweights_) {
        std::cout << pair.first << " => " << pair.second << "\n";
      }
    }

    private:
    std::unordered_map<std::size_t, flyweight_t> flyweights_;
    hasher_t _hasher{};
  };

} // namespace hicc::dp::flyweight::meta
```

然后我们就可以以派生类的方式直接使用这个享元工厂了：

```c++
class vehicle : public flyweight_factory<shared_state_impl, unique_state_impl> {
  public:
  using flyweight_factory<shared_state_impl, unique_state_impl>::flyweight_factory;

  void AddCarToPoliceDatabase(
    const std::string &plates, const std::string &owner,
    const std::string &brand, const std::string &model, const std::string &color) {
    std::cout << "\nClient: Adding a car to database.\n";
    auto const &flyweight = this->get({brand, model, color});
    flyweight.Operation({owner, plates});
  }
};
```

其中 `using flyweight_factory<shared_state_impl, unique_state_impl>::flyweight_factory;` 是 C++17 以后的新语法，它将父类的所有构造函数原样复制给派生类，从而让你不必拷贝粘贴代码然后修改类名。

在 `vehicle` 模板类中我们使用默认的 `flyweight<shared_t, unique_t>`，但你可以在 `flyweight_factory` 的模板参数中修改它以便提供你自己的享元类具体实现。

#### 测试代码

```c++
void test_flyweight_meta() {
    using namespace hicc::dp::flyweight::meta;

    auto factory = std::make_unique<vehicle>(
            std::initializer_list<shared_state_impl>{
                    {"Chevrolet", "Camaro2018", "pink"},
                    {"Mercedes Benz", "C300", "black"},
                    {"Mercedes Benz", "C500", "red"},
                    {"BMW", "M5", "red"},
                    {"BMW", "X6", "white"}});

    factory->list();

    factory->AddCarToPoliceDatabase("CL234IR",
                                    "James Doe",
                                    "BMW",
                                    "M5",
                                    "red");

    factory->AddCarToPoliceDatabase("CL234IR",
                                    "James Doe",
                                    "BMW",
                                    "X1",
                                    "red");
    factory->list();
}
```

#### 附加

我们使用了稍稍不同的基础类 `shared_state_impl` 以及 `unique_state_impl`：

```c++
namespace hicc::dp::flyweight::meta {
  struct shared_state_impl {
    std::string brand_;
    std::string model_;
    std::string color_;

    shared_state_impl(const std::string &brand, const std::string &model, const std::string &color)
      : brand_(brand)
        , model_(model)
        , color_(color) {
      }
    shared_state_impl(shared_state_impl const &o)
      : brand_(o.brand_)
        , model_(o.model_)
        , color_(o.color_) {
      }
    friend std::ostream &operator<<(std::ostream &os, const shared_state_impl &ss) {
      return os << "[ " << ss.brand_ << " , " << ss.model_ << " , " << ss.color_ << " ]";
    }
  };
  struct unique_state_impl {
    std::string owner_;
    std::string plates_;

    unique_state_impl(const std::string &owner, const std::string &plates)
      : owner_(owner)
        , plates_(plates) {
      }

    friend std::ostream &operator<<(std::ostream &os, const unique_state_impl &us) {
      return os << "[ " << us.owner_ << " , " << us.plates_ << " ]";
    }
  };
} // namespace hicc::dp::flyweight::meta

namespace std {
  template<>
  struct hash<hicc::dp::flyweight::meta::shared_state_impl> {
    typedef hicc::dp::flyweight::meta::shared_state_impl argument_type;
    typedef std::size_t result_type;
    result_type operator()(argument_type const &s) const {
      result_type h1(std::hash<std::string>{}(s.brand_));
      hash_combine(h1, s.model_, s.color_);
      return h1;
    }
  };
} // namespace std
```

这是因为我们在 flyweight_factory 中使用了 std::hash 技术来管理一个享元的键值，所以我们必须明确地实现 shared_state_impl 的 std::hash 特化版本。

而在这个特化版本中我们又利用了一个特别的 hash_combine 函数。

### hash_combine

这是一个技术性很强的概念，因为它涉及到了一个神奇的幻数（magicnum）0x9e3779b9。

我们在 [hicc-cxx](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fhedzr%2Fhicc)/[cmdr-cxx](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fhedzr.cmdr-cxx) 中提供了一个源于 boost::hash_combine 的同名扩展：

```c++
namespace std {
  template<typename T, typename... Rest>
  inline void hash_combine(std::size_t &seed, T const &t, Rest &&...rest) {
    std::hash<T> hasher;
    seed ^= 0x9e3779b9 + (seed << 6) + (seed >> 2) + hasher(t);
    int i[] = {0, (hash_combine(seed, std::forward<Rest>(rest)), 0)...};
    (void) (i);
  }

  template<typename T>
  inline void hash_combine(std::size_t &seed, T const &v) {
    std::hash<T> hasher;
    seed ^= 0x9e3779b9 + (seed << 6) + (seed >> 2) + hasher(v);
  }
} // namespace std
```

它的作用在于计算一系列的对象的 hash 值并组合它们。

关于如何正确地组合一堆 hash 值，较为简单地方法是：

```c++
std::size_t h1 = std::hash<std::string>("hello");
std::size_t h2 = std::hash<std::string>("world");
std::size_t h = h1 | (h2 << 1);
```

但仍然有更多的探讨，其中得到了公认的最佳手段（C++中）是源自于 boost::hash_combine 实现代码的一个方法：

```c++
seed ^= hasher(v) + 0x9e3779b9 + (seed<<6) + (seed>>2);
```

就目前已知的*学术*研究中，这是*最佳*的。

那么谁制造了这么奇幻的一个神经质数(golden ratio)呢，大体可考的原作应该是： [A Hash Function for Hash Table Lookup](http://burtleburtle.net/bob/hash/doobs.html) 或  [Hash Functions for Hash Table Lookup](http://burtleburtle.net/bob/hash/evahash.html) 。原作者 Bob Jenkins，原发于 DDJ 刊物 1997 年，代码大约是成形于 1996 年。而这个数嘛，源于这个表达式：$\frac{2^{32}}{\frac{1+\sqrt{5}}{2}}$。





## Epilogue

好，虽然不算太尽人意，但我确实实现了一个 C++17 的勉强比较通用的 flyweight_factory 模板类，就将就了吧。







:end:

