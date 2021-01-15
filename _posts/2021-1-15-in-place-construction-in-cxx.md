---
layout: single
title: 'C++ 中的原位构造构造函数以及完美转发 - 我们的 variant 包装类'
date: 2021-1-15 06:00:00 +0800
last_modified_at: 2021-1-15 08:13:12 +0800
Author: hedzr
tags: [c++, in-place construction, in-place constructor, perfect frwarding]
categories: c++ variant
comments: true
toc: true
header:
  overlay_image: /assets/images/foo-bar-identity-th.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  关于原位构造及其在我们的包装类中的运用，也划归 variant 类别 ...
---



## 原位构造函数 In-place Constructors

所谓的原位构造，实质是说让构造参数表被传递给类成员去完成相应的构造动作，而不是先构造一个临时对象 t 之后将 t 传送给类成员（以拷贝赋值的语义完成类成员构造并丢弃临时对象 t，或者以移动赋值的语义完成 t 的传送）。C++ 由来已久的临时对象的构造、拷贝以及析构问题，在原位构造面前最终变得不堪一击，这也大大地有利于库作者进行基础数据类型的包装。

原位构造函数呢，是指在包装类的构造函数中传递构造参数到成员。

### 早期的 PtrList

早期的类成员构造无法避免临时对象的复制问题，那时候的解决方案是指针：

```cpp
template <class T>
  class PtrList : std::list<T*> {
    public:
    PtrList(){}
    virtual ~PtrList(){_clear();}
    private:
    void _clear(){
      for(iterator it = begin(); it!=end(); it++)
        if ((*it) != NULL)
          delete (*it);
      std::list<T*>::clear();
    }
    public:
    void clear(){_clear();}
  };
```

这是那时候（早于 C++03）的最优解，因为成本最低而道理最为简练，不需要你在管理指针上承受太大的负担。其问题是显得有点 low，仅适用于那些 C++03 之后才学习的人，因为这之后的思想是不要用指针，其实这也挺可笑的，有力量的程序员喜欢掌控一切的感觉的。

### C++03 以来的演变

后来，C++标准引入了拷贝构造语义，再后来进一步引入了移动构造语义，将构造函数的复杂度提升了 N 个量级，上面的 `PtrList<T>` 也被迫成为了过时的恶形。这时候起，你应该在设计一个类时充分地考虑拷贝和移动问题，它们也能够降低构造开销，大多数情况下其背后时一个临时对象的移动传递而已。

而在 C++17 之后，`原位构造函数`（而非借助 emplace）成为了可能，这是通过完美转发来实现的。作为典范，可以参考 optional 的构造方法。

请注意，像 `std::map::insert` 避免临时对象构造，`std::vector::push_back` 被 emplace 所替代等这些原位构造问题，反而不在本文探讨范围之内。因为这些方法实际上是另一种场景。而本文中重点讨论的是包装一个子类型的问题。



### C++17 中 optional 的原位构造

这里是实际的例子：

```cpp
std::optional<std::string> o2(std::in_place, "a string");
std::cout << o2.value() << std::endl;
std::optional<std::string> o2(std::in_place, 8, 'c');
std::cout << o2.value() << std::endl;
```

所以，optional 就是包装一个子类型的最佳范本。它（`std::optional<std::string>`）可以完全直接地使用 `std::string` 的构造函数的各种形式，使得你仿佛就是在构造一个 string 实例一样。

唯一的区别就是它需要加上一个前缀 `std::in_place`，这其实是一个占位符。之所以采用这个前缀，是因为如果不采用一个特别的前缀参数以示区别的话，原位构造函数的函数原型将会在推导和解决 `std::optional` 本身时产生问题：

```cpp
namespace std {
  template <class T>
    class optional {
      public:
      optional()=default;
      ~optional()=default;
      public:
      template <class ...ARGS>
        optional(/* std::inplace_t inplace, */ ARGS&& ...args)
        : _value(std::forward<T>(args)...)
        {}
      optional(optional&& o){
        //...
      }
      private:
      T _value;
    }
}
```

上面是简写的 optional 的这部分代码，注意我们去掉了 `std::inplace_t` 前缀，它将会在下面的语句上发生问题（其实是产生了套娃现象）：

```cpp
std::optional<std::string> o1("a string"); // OK
std::optional<std::string> o2(o1);         // BAD
```

你能看到在第二行时无法推导出到 `optional(optional&& o)` 的归约，它总是被应用到 `optional(ARGS&& ...args)` 并进一步地产生套娃问题。

而加上 `std::inplace_t` 前缀之后就避免了这种问题的发生，代价是你需要额外添加一个固定的前缀到使用时的代码中。

> emplace() 则不再讨论范围中。



### 完美转发构造参数

除了在上面我们简写的示例中的方式完成 perfect forwarding 之外，我们也可以转发参数以构建一个指针实例。`std::forward<T>` 就是干这个的。



#### 以指针方式 new 实例

来自于 [c++ - Forwarding to in-place constructor - Stack Overflow](https://stackoverflow.com/questions/21492264/forwarding-to-in-place-constructor) 的片段：

```cpp
typedef uint8_t id_t;
template <typename T, id_t id> struct Tag {};
struct MessageId {
    static constexpr Tag<MyStruct, 1> WorldPeace;
    // ...
};
template <typename T, id_t id, typename... A>
Message::Message(Tag<T, id>, A&&... args)
    Message(id, sizeof(T)) {
    new(this->m_data) T(std::forward<A>)(args)...);
}
```

`new(this->m_data) T(std::forward<A>)(args)...);` 片段是其关键之处。

然而它使用 new 关键字会有可能带来额外的 allocate 负担。



### 如何包装一个子类型

C++ 中我们常常会需要将一个基础类型 T 做一次外包装（wrapping），然后在包装的基础上提供一些上层所需要的功能。

在上面已经描述过的知识的支撑下，我们现在可以完成和 `std::optional` 相似的包装了。只不过，这一次我们想要去掉 `std::inplace_t` 前缀，让无意义的文字不必出现在我们的代码中。



#### 场景研究

例如对我们所预知的一些数据包类型（假设为通信协议中的一些报文格式），我们首先会定义一个 struct，然后我们可能会在这之上将一系列报文结构包装为统一的 Data 类并提供统一的操作接口（例如 encode/decode）。对于这样的场景我们可能会是这样来做：首先我们做一些报文结构：

```cpp
namespace diagram::entities {
  struct Header {
    //...
    public:
      Header(int protocol_length, int magic_num);
      Header() = default;
  };
  struct Body {
    //...
  };
  struct Tail {
    //...
  };
}
```

代码做了必要的精简，请注意 `Header(int protocol_length, int magic_num)` 构造函数，这将是后文中我们演示代码的基础。



#### 实现包装类 class diagram

##### 构造函数部分

然后我们将这些实体结构通过一个 wrapper 类将其包装起来：

```cpp
namespace diagram {
  template <typename T>
  class diagram {
    	// constructions
    public:
        diagram() = default;
        diagram(diagram const &) = default;

        diagram(diagram &&)  noexcept = default;

        template<typename A=T, typename... Args,
                std::enable_if_t<
                        std::is_constructible<T, A, Args...>::value &&
                        !std::is_same<std::decay_t<A>, diagram>::value, int> = 0>
        explicit diagram(A &&a0, Args &&... args)
                : value(std::forward<A>(a0), std::forward<Args>(args)...) {}

        explicit diagram(T&& v)
                : value(std::move(v)) {}

    protected:
        T value;
  };
}
```

前文中我们讨论过 optional 需要借助 `std::inplace_t` 来解决其自身移动构造语义问题。但这并不是其唯一的原因，也还因为 optional 需要保持和其它 std 模板的统一性，尽管 optional 不支持，但有的模板类还可以采用更多的构造选项，例如 `std::piecewise_construct` 等等。

但 `class diagram` 则不必有这样的负担。

所以我们这里的实现方案，采用了编译期诊断工具来避免和 `diagram::diagram(diagram && o)` 的冲突，从而顺利地准许你采用这样的语句：

```cpp
diagram<std::string> so(5, 'c'); // repeat 'c' 5 times.
```

当然，`diagram<T>` 并非以包装 `std::string` 为目的，那样做也没有实际意义，`diagram<T>` 的目的是为了提供一致性的流操作语法，请看下一节。



##### 流操作部分

这部分只是一个示例：

```cpp
namespace diagram {
  template <typename T>
  class diagram {
    	// operations
    public:
        friend std::ostream &operator<<(std::ostream &output, const diagram &v) {
            output << v.value;
            return output;
        }

        friend std::istream &operator>>(std::istream &input, diagram &v) {
            input >> v.value;
            return input;
        }

        friend std::ostream &operator<<(std::ostream &output, const T &v) {
            output << v;
            return output;
        }

        friend std::istream &operator>>(std::istream &input, T &v) {
            input >> v;
            return input;
        }
  };
}
```

实际的业务代码可能会更复杂，但也可能将复杂性转移到 Encoder/Decoder 中，那样也有其好处。



##### 消费者：Encoder 和 Decoder

我们只提供 Encoder 和 Decoder 的骨架：

```cpp
namespace diagram {
  template <typename T = diagram<T>>
  class Encoder : std::ostream, std::streambuf {
    public:
    // ...
  };
  
  template <typename T = diagram<T>>
  class Decoder : std::istream, std::streambuf {
    public:
    // ...
  };
}
```

它们是 C++ Streaming 风格的类，支持 `>>` 和 `<<` 操作符的消费。



##### 小结

在 `class diagram` 包装类中，我们做了两大类事情：原位构造，以及通用操作。

通用操作很好理解，我们假设有 Encoder/Decoder 类支持流操作，所以在 `class diagram` 类中实现相应的移位运算操作符重载就可以了（对于 C++ 流 I/O 来说，移位操作符含有输入输出的语义，这也是一种惯用法）。

`diagram(A &&a0, Args &&... args)` 这一部分是原位构造的关键设施，它通过可变参数模板函数的方式让 diagram 构造函数支持将函数参数完美转发到被包装类 T 上。当然，其它几个构造函数也是重要的，它们一起组成了一个比较全面的构造接口。

现在我们可以这样使用它：

```cpp
diagram::diagram<diagram::entities::Header> hdr(80, 0x55aa);
diagram::diagram<diagram::entities::Body> body(...);
diagram::diagram<diagram::entities::Tail> tail(...);

// build header, body, and tail if biz-logic presents.

// ...
Encoder encoder;
encoder << hdr << body << tail;  // post the value in hdr to encode it by encoder

// ...
Decoder decoder(input_stream);
struct pkg {
  Header hdr;
  Body body;
  Tail tail;
} pkg_;
decoder >> pkg_.hdr >> pkg_.body >> pkg_.tail;
```

你能看到我们可以在这里直接采用 Header 的构造参数，而实际上它们被直接转发给 diagram::value 去完成实际的对象构造，不必在 hdr 的构造入口之前先构造一个 Header 实例，也不必将这个临时实例复制到 value 之中。

所以这就是较为正统的原位构造实现方案。

当然，Encoder 和 Decoder 的具体实现不在本文的探讨范围之内，就姑且略过了——但下面也确确实实会略加讨论。



#### 讨论可能性

这样做的好处在于我们可以很好地令编码解码操作的 facade 一致化，但却不必在每个具体的数据类上重复地做 `>>` 和 `<<` 的重定义，这对于代码整洁是有益的，代码结构可以因此而最佳化，它也满足了我们对于重复代码段落进行简化的渴望。

进一步地，实际上我们未必只有今天的需求：在这段编码产生之时，我们主要是为了报文编码解码问题而工作，但当一个 diagram 类抽象形成之后，我们还能适应将来的需求变更。

##### 压缩特性

例如过几天我们被要求需要可选地加上压缩特性，那么在 encode/decode 时就需要分别针对每个报文数据块进行必要的工作，而这些工作都会集中在移位运算符重载代码段落，所以添加特性非常简单和干净：我们选择在 encoder 的基础上外包一层 compressing 运算层，将这个任务透明地加到编码逻辑中，类似地我们也处理 decoder，这样的好处是业务逻辑的代码几乎没有什么变化。

```cpp
namespace diagram {
  template <typename T = diagram<T>>
  class EncoderCore : public std::ostream, public std::streambuf {
    public:
    // ...
  };
  
  template <typename OS = EncoderCore<T>>
  class EncoderCompressed : public OS {
    public:
    // ...
  };
  
  using template<class T> Encoder = EncoderCompressed<T>;

  
  template <typename T = diagram<T>>
  class DecoderCore : std::istream, std::streambuf {
    public:
    // ...
  };
  
  template <typename IS = DecoderCore<T>>
  class DecoderDecompressed : public OS {
    public:
    // ...
  };

  using template<class T> Decoder = DecoderDecompressed<T>;
}
```

##### 加密特性

再过几天新需求要求我们添加加密解密算法时，对策一如既往，没有什么麻烦。做到平和地顺应需求变更，依靠的是良好的代码组织结构，所以编码工作本来不应该是得过且过的。

```cpp
namespace diagram {
  template <typename T = diagram<T>>
  class EncoderCore : public std::ostream, public std::streambuf {
    public:
    // ...
  };
  
  template <typename OS = EncoderCore<T>>
  class EncoderCompressed : public OS {
    public:
    // ...
  };
  
  template <typename OS = EncoderCore<T>>
  class EncoderEncrypted : public OS {
    public:
    // ...
  };
  
  using template<class T> Encoder = EncoderEncrypted<EncoderCompressed<T>>;

  
  template <typename T = diagram<T>>
  class DecoderCore : std::istream, std::streambuf {
    public:
    // ...
  };
  
  template <typename IS = DecoderCore<T>>
  class DecoderDecompressed : public OS {
    public:
    // ...
  };

  template <typename IS = DecoderCore<T>>
  class DecoderDecrypt : public OS {
    public:
    // ...
  };


  using template<class T> Decoder = DecoderDecrypt<DecoderDecompressed<T>>;
}
```



事实上，不仅仅是在报文数据块的运算操作上的变更需求能够被良好地接纳，还有更多的可能性：假设我们现在有一个专用的调试端点，它希望接受报文数据，然后将编码后的十六进制数据按照一定要求打印到调试设备上，这时我们可以使用 Encoder 类似的编码策略来实现，又或者在 Encoder 之外继续包装一层调试设备适配层，同样也能满足要求。



#### 额外的：encoder 的实现可能性

完整的 encoder 实现取决于承载的通信协议，所以这里对自定义 istream/ostream 相似类提供一个简写的范本，你可以以此为蓝本进行构造：

```cpp
template<class cT, class traits = std::char_traits<cT> >
class basic_encoder_buf : public std::basic_streambuf<cT, traits> {
    typename traits::int_type overflow(typename traits::int_type c) {
        return traits::not_eof(c); // indicate success
    }
};

template<class cT, class traits = std::char_traits<cT> >
class basic_encoder : public std::basic_ostream<cT, traits> {
public:
    basic_encoder() :
            std::basic_ios<cT, traits>(&m_sbuf),
            std::basic_ostream<cT, traits>(&m_sbuf) {
        init(&m_sbuf);
    }

private:
    static void init(basic_nullbuf<cT, traits> *sbuf) {
        UNUSED(sbuf);
    }

private:
    basic_nullbuf<cT, traits> m_sbuf;
};

typedef basic_encoder<char> encoder;
typedef basic_encoder<wchar_t> wencoder;

void test_encoder() {
    encoder os;
    os << 666 << hdr << "string";
}
```

这是最简单版本的实现，它只是一个 no-op stream。





### 关于 emplace 的就地构造

> 说起翻译术语来，那就很是脑壳疼了，in-place construction 被称作就地构造根本没有问题，然而 cppreference 上面却译作原位构造，这当然理解起来也毫无难度，但一个英文术语对应着两个、甚至 N 个中文术语，那绝对不是什么美好的事情。
>
> 所以我用 cppreference 的译法，偶尔却也随意一下，这是我可以的任性对不对。

除此而外，所有 STL 中提供 emplace() 函数的地方，实际上也都是原位构造，它们同样是将函数入参原封不动地传入内部去直接在容器中构造一个对象实例，目的也是为了避免临时实例以及复制该实例的开销。由于历史的原因，较旧的容器类的 emplace 可能不能很好地削减的临时实例复制问题，你可能需要比较繁琐的方案才行，例如 `std::map`：

```cpp
std::map<int, std::string> id_name_map;

// classical insertion: temporary string instance construction & copy, temporary std::pair construction via initializing expression
id_name_map.insert({10, std::string("name 1")}); // C++11 initial-expr
id_name_map.insert(std::pair<int, std::string>(10, std::string("name 1")));
// emplace 1: one copy on temporary string instance
id_name_map.emplace(11, std::string("name 2"));
// empalce 2: perfect forward without constructing and copying
id_name_map.emplace(std::piecewise_construct, std::forward_as_tuple(12), std::forward_as_tuple("name 3"));
```

如上，line 4 使用了大括号形式的初始化表达式，隐含着一个对 `std::pair` 临时对象构造器的调用，如同 line 5 所做的那样。这是古典形式的 map 插入方法，类似的方法也在 unordered_map 中被同样地应用。这种方法的问题在于至少有一次不必要的的 `std::pair` 临时对象的构造以及复制操作，而当 pair 中是复杂对象时，这些对象，例如 `std::string` 还会被临时构造并最终被在 map 内部完成一次复制操作。所有这些操作都是不必要的。

采用 line 7 的 emplace 可以去除 `std::pair` 上的多余操作，因为在这里不会有 `std::pair` 的临时对象了，map 将会直接拿着两个参数到内部去构建一个字典条目。这是很好的一次优化，但很明显地，我们无法避免 `std::string` 临时对象的多余操作。

采用更新的 emplace 形式，如 line 9 所做的那样，利用 piecewise_construct 构造方案，我们终于可以将 `std::string` 临时对象的多余操作一并优化掉了。其缺点只有一个，这个写法太特么裹脚布了。跟随 `std::map` 接口的演进历史我们能够发现，这是历史的原因造成的，我们大概也无法让它的调用更简化了，除非我们为其添加一个 inplace_insert() 的新 API——但这显然是难以达成的目标。

所幸的是在真实编程中，实际上我们很少用到 `std::map`，它真的是一个有点原始的基础数据结构了，而生产中的逻辑往往需要更高级的数据表达手段，例如 unordered_map，sorted_list 等等。所以 `std::map::emplace`  有点不完美其实并不造成多大的影响。

而像 `std::optional` 这样的新生代模板，它的构造函数以及 emplace 接口就显得优美多了：

```cpp
std::optional<std::string> o2(std::in_place, "a string");
std::cout << o2.value() << std::endl;
o2.emplace(5, ' ');
std::cout << o2.value() << std::endl;
o2.emplace({5, ' '});
std::cout << o2.value() << std::endl;

std::optional<std::string> o2(std::in_place, 8, 'c');
std::cout << o2.value() << std::endl;
```



## :end:

这一次呢，似乎没有讲多少 in-place 构造本身的内容。

算了吧，也无妨就卖狗肉一次，说起来有点流口水了。

验证我们的代码，可以在 cppinsights 上解开它们。







