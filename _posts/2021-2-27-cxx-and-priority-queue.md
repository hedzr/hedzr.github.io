---

layout: single
title: '优先队列 (C++)'
date: 2021-2-28 08:41:00 +0800
last_modified_at: 2021-2-28 09:21:12 +0800
Author: hedzr
tags: [c++, queue, priority queue]
categories: c++ queue
comments: true
toc: true
header:
  overlay_image: /assets/images/foo-bar-identity-th.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  优先队列的 C++ 实现 ...
---





本文中接上一篇[队列（C++）](/c++/queue/cxx-and-queue)回顾了队列这种数据结构后，进一步探讨优先队列（Piority Queue）的一种 C++ 实现，但限于理论性的而非工程性的，特别是，并非高频交易的。

## 背景

### Java

Java 上有预建的 [`PriorityQueue<T>`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/PriorityQueue.html) 数据结构。它有所谓的最小堆（小顶堆），最大堆（大顶堆）的概念，但这个概念并不是什么特别严谨的说法，而是在排序领域借用了堆排序中的一些概念，用最粗鄙的说法是优先级是按增量排序还是降序排列的问题。

> 值得注意的是，堆排序也只是一种稍稍有点特别的二叉树而已。它的特殊之处在于，堆排序更强调 Top N 问题域而不是集合排序问题。

Java 优先队列采用了一颗完全二叉树作为其内部实现的核心结构。借用二叉树的排序能力，倒也不是 Java 优先队列的专利。事实上，大多数语言提供的、实现的优先队列，都必须采用一种方案来完成最小开销的排序能力，从而完成“优先”队列中优先级的比较和排序。

从理论上来说，采用红黑树可能是最佳的方案，因为红黑树带有一个特性：它是强制完全平衡的。这意味着在队列出口做 Peek 时，你会获得最佳的性能。作为其代价，在队列的入口会产生额外的插入时开销，此外在队列出口做 Dequeue 也会有额外的删除时开销，其开销比起普通的自平衡二叉树来说要深刻一些。所以在现实的工程性实现中，PriorityQueue 通常并不会采用红黑树，而是仅仅使用一个完全二叉树，诸如 AVL，乃至于 [B 树](https://en.wikipedia.org/wiki/B%2B_tree) 等，具体选择取决于业务场景中队列元素的可能的分布概率、访问频率等等。

如果队列元素比较有特殊性，例如是基于餐馆地址的距离来决定优先级的，有500米，2公里，5公里，10公里这样的商圈划分，那么你可能会有有必要专门实现特定的优先队列，例如内核采用 [R 树](https://en.wikipedia.org/wiki/R-tree) 来实现，将会有可能在这个瓶颈上获得最优化。不过事实上据我所知没有什么人会这么做：很明显，大家都会用个现成的优先队列，定制一个排序器就算了，哪怕这个排序器中的算法可能代价很高，谁在乎呢？性能不行就加内存、加机器……而且，恐怕也没有什么场景会真的有上亿家店铺等待着我们的商圈划分吧，或许就是一千家店铺的排序而已，有何必要专门优化呢？所以这里只是一种设想。



### C++

STL 中很早（C++98）就内置了优先队列作为一种基础设施：[`std::priority_queue<class T, class Container, class Compare>`](https://en.cppreference.com/w/cpp/container/priority_queue)。

和 Java 有所不同的是，它提供了更强大的应用层面的可定制性，你可以选择自己的容器来蓄积同一优先级中元素队列，可以使用 vector，也可以使用 list 或者 deque。

其实际应用示例如下：

```cpp
#include <functional>
#include <queue>
#include <vector>
#include <iostream>
 
template<typename T> void print_queue(T& q) {
    while(!q.empty()) {
        std::cout << q.top() << " ";
        q.pop();
    }
    std::cout << '\n';
}
 
int main() {
    std::priority_queue<int> q;
 
    for(int n : {1,8,5,6,3,4,0,9,7,2})
        q.push(n);
 
    print_queue(q);
 
    std::priority_queue<int, std::vector<int>, std::greater<int> > q2;
 
    for(int n : {1,8,5,6,3,4,0,9,7,2})
        q2.push(n);
 
    print_queue(q2);
 
    // 用 lambda 比较元素。
    auto cmp = [](int left, int right) { return (left ^ 1) < (right ^ 1); };
    std::priority_queue<int, std::vector<int>, decltype(cmp)> q3(cmp);
 
    for(int n : {1,8,5,6,3,4,0,9,7,2})
        q3.push(n);
 
    print_queue(q3);
 
}
```

STL 版本的优先队列相当 NB，不过也并非完美。它还是存在一些瑕疵，所以才会有本文的存在价值。我们会在稍后探讨其“瑕疵”并针对性地解决和完成一个自有的实现。



## 优先队列



### 基本介绍

[优先队列](https://en.wikipedia.org/wiki/Priority_queue)，它本质上还是一种队列。换句话说，它必须保证最优的入列出列算法代价，否则就没有队列的意义了。除此而外，基于“优先”一词的限定，它必须支持插入带优先级的元素，并依照优先级的从高到低的顺序依次取出元素。

> 极端情况下，有人可能会设计一个队列，常规方式入列，而在出列时则会遍历队列中全部元素，找到优先级最高的元素并对其做出列操作——这不是我的编造，而是实有其事的——又或者出列的时候统一做一次排序操作，然后捡出最大或最小值再来出列。说实话，这么做的人也不见得就叫做少数。他们有罪吗？难以评论



其次，优先队列必须满足队列的基本特性，即先进先出特性。换句话说，如果所有的入列元素的优先级是相同的，那么出列顺序必须是 FIFO 的。否则，如果反之那就成了堆栈，如果是乱序，那就是乱序滤波器了。





### 一个实现

数据结构与算法的理论课发展到今天，很多东西现在已经别无选择了。优先队列的实现方案正是如此（加上 STL 提供内置版本的原因，所以根本没有多少场景真的需要我们做手写考虑了），为了达到入列出列以及排序的综合平衡，我们**只能**选择某种自平衡的完全二叉树，换种说法，也就是堆排序的一种定制方案。除此而外再无其他可能性能达到最优解效果了。

所以本文已经强调过这是一种理论性的探讨，主要的目的在于是提高个人专业素养，而非为了在工程上实践性地应用（尽管最终我们会有一个开源版）。

如此，我们会这样来做实现：

#### Comparer

首先，我们决定了有较宽泛的适用性，所以我们需要一个比 `std::less` 强大得多的比较器，以便于在这一点上能够完败标准库：

```cpp
template<class T, class PT = int>
  using comparer = std::function<PT(T const &lhs, T const &rhs)>;
```

可以设想，你能够采用 double 作为 `PT`，那将会在 GIS，2D/3D 等领域具备更优秀的适应能力。以后我们会进一步探讨 `PT` 实际上具有的更多的能力。

其次，我们想要具有正反序的能力，这可以通过一个额外的模板参数 `bool ReverseComp = false` 来调校。

你不必反向定义一个比较器，简单地换一个模板参数就可以了。

#### tree

我们准备让 priority_queue 作为二叉树的管理者，基本上它会长成这样：

```cpp
template<class T,
         class PT = int,
         class Comp = comparer<T, PT>,
         class Container = std::list<T>,
         bool ReverseComp = false>
class priority_queue {
};
```

我们计划想要具备的特性，在模板参数中都有所体现了。

注意我们默认采用 list 作为队列的承载容器，因为 STL 中的 vector 是不可以做指针依赖的。什么意思？为了投机取巧，我们简化了迭代器取指针的算法，也就是简单地从 list 中拿到一个元素实例，就地取其地址并使用这个得到的指针。这不够安全，但如果你只是使用 list 的话，它没有问题。要排除掉这个问题很容易，但我们暂时不打算做，今后会对此有所交代。



#### element

然后我们考虑采用 element 结构的方式来制作树节点，element 比较像这样：

```cpp
struct element {
  Container _list;
  int _min_value;
  std::shared_ptr<element> _left{};
  std::shared_ptr<element> _right{};
  element() = default;
  ~element() = default;
};
```

其中，`Container` 是一个 `std::list` 一样的类型，由外包装类的模板参数来提供其默认值和实际值。

##### 增强

我们的想法是，STL 的版本其实存在一个问题：它不能允许两个不同的 data item 具有相等的优先级。换句话说，你在 STL 优先队列的支持下获得的其实只不过是一个经过了特定排序方案的单线索队列。

然而从 Real World 抽象而来的优先队列，实际上是允许同一个优先级中构成一个子队列的。这样的抽象，就需要我们的 `element::_list 配合前面的增强的比较器来达成目标了。所以说，我们相对于 STL 的第二个增强是更强大、更灵活的子队列支持。

实际上，由于我们的 priority_queue 在关键接口上和 `std::list` 是相同的，所以你甚至能够进行进一步的嵌套，形成多层级优先级别的复杂队列：首先由总成绩做排名，然后以净胜球决胜负，这是很典型的多优先级场景。

> 为了达到这样的嵌套效果，我们的 priority_queue 本身需要提供和 std::lilst 相同的一部分接口。哪些接口呢？诸如 begin, end, size, empty, push_back, pop_front, front 等等，这些是在我们的 element 中用到的接口，只要保证对它们的代码级（模板）的原型兼容性就可以了。
>
> 在我们提供的开源版本中，已经完成了这些细节。具体请参考[参考部分](#参考)
>
> 类似的，你可以提供自己的承载容器替换 Container，而不必一定要采用 vector, deque 等 STL 选择。

##### 树结构遍历

在这里我们会将树结构的关键性算法进行内部实现，因为我们需要采用递归的方法比较简练地完成算法的具现：

```cpp
struct element {
  // pre-order traversal
  void NLR(std::function<void(element *)> const &fn) {
    fn(this);
    if (_left)
      _left->LNR(fn);
    if (_right)
      _right->LNR(fn);
  }
  // in-order traversal
  void LNR(std::function<void(element *)> const &fn) {
    if (_left)
      _left->LNR(fn);
    fn(this);
    if (_right)
      _right->LNR(fn);
  }
  // post-order traversal
  void LRN(std::function<void(element *)> const &fn) {
    if (_left)
      _left->LRN(fn);
    if (_right)
      _right->LRN(fn);
    fn(this);
  }
  // reverse in-order
  void RNL(std::function<void(element *)> const &fn) {
    if (_right)
      _right->LRN(fn);
    fn(this);
    if (_left)
      _left->LRN(fn);
  }
};
```



##### 理由

为何不采用数组方式？

从节省空间、一定程度上节省元素构造析构开销的角度来说，以数组来表示二叉树，是一种比较成熟的策略，在算法与数据结构理论中这是获得了证明的。

但这种方式有一个不易解决的限制：难以在同一优先级之中下辖子队列。想要在数组这样的存储结构中提供同一级中子队列的话，你就要对 payload 部分进行扩展。但扩展了 payload 的同时可能又会影响到二叉树的插入和取出策略，或者其简洁性。如果你进行了类似的处理，那么整个代码结构已经被进一步含混化了。这不见得是值得的。



为了达到直观编码的效果，也就是说为了让代码呈现的语义显得符合直觉，而不是引入晦涩的数学证明，我们决定在本文中采用以 element 代表一个节点的方式进行实现。其代价就是额外的两个指针的开销，外加上多级节点访问和操作时的寻址的额外负担。



尽管当前我们否决了数组方案，但并不意味着我们不认可它。事实上我们可能有计划会要在将来采纳这种方案改写我们的开源版本。而在当前，为了配合本文写作的目的，为了阐释优先队列的实现方法，我们暂时选择了 struct 和节点指针的方案，你会看到 push 和 pop 部分都是比较简洁易懂的代码，用不着特意去绞尽脑汁。





#### 插入数据

数据的入列最终也是通过 priority_queue 的成员函数来实现的。

我们采用了最简单的判定手段来决定数据 data 应该被插入左节点，或右节点，还是就地在本节点的 list 中插入。我们通过比较器函数返回的 小于等于大于 状态来完成上述的判定。由于比较器返回的是一个优先级的数值，所以这样的判定最简化地默认了这样的事实：左节点是优先级更低的节点，右节点是优先级更高的节点，而本节点中的数据集则是优先级相同的节点集合。

我们并不在此时考虑插入数据时的平衡问题。甚至在将来，我们也不特别考虑树平衡问题，原因在于树平衡对出列的益处是相对有限的，既然我们不能预知哪种优先级的数据更多、或是更少，我们也不能预知不同优先级的数据集的正态分布规律，那么做出额外的平衡操作实际上就没有意义，甚至可能有害。

```cpp
    void _push(std::shared_ptr<element> &at, T const &data) {
      PT l{}, r{};
      for (auto const &v : at->_list) {
        PT ret = _comparer(data, v);
        if (ret < 0) {
          if (ret < l)
            l = ret;
        } else if (ret > 0) {
          if (ret > r)
            r = ret;
        }
      }

      if (l < 0) {
        if (at->_left) {
          _push(at->_left, data);
        } else {
          at->_left = std::make_shared<element>(element{ {data}, l});
        }
        return;
      } else if (r > 0) {
        if (at->_right) {
          _push(at->_right, data);
        } else {
          at->_right = std::make_shared<element>(element{ {data}, r});
        }
      } else {
        at->_list.push_back(data);
      }
    }

		void push(T const &data) {
      _push(_root, data);
      _count++;
    }
```

在这里，`_push` 是内部实现，`push` 是公开接口。

没有注释，代码的意图很简单，我们在“当前”节点 at 的子队列中检查和比较优先级的差异，小于 at 就记录到 `l`，大于则记录到 `r`，注意如果相等则 `l == r == 0`。

然后拿着得到的 `l` 和 `r` 我们选择左节点或者右节点去做同样的算法递归。如果优先级是相等的则直接在 `at` 的子队列中追加。

这里有一个遗留的问题：我们不处理同一优先级的子队列中的再排序问题，而是简单地向子队列追加。

虽说是遗留问题，但我们并不打算解决。因为这就是我们想要的特性。一方面工程上的真实需求大抵都是顺序进入并追加的。另一方面，如果你还要再排序的话实际上你在请求一个多级优先队列，这种情况下我们建议你做嵌套的优先队列：

```cpp
using child_pq = cmdr::util::priority_queue<int, ...>;
using pq = cmdr::util::priority_queue<std::string, int, child_pq, ...>;
```

如上，通过嵌套的方式你可以轻易的构造想要的多级优先队列，这也是我们的实现有别于 STL 的地方。

 

#### 出列数据

出列数据以及 peek first one 有着相同的逻辑，但由于涉及到了数据是否需要被摘除的问题，它们的实现会有一点点区别。我们不研究这点区别是什么，而是单纯地讨论如何出列。

根据我们的设计思路，我们认为二叉树的节点是左低右高中间相等。所以在出列这一端来观察的话，这颗二叉树就是已经按照优先级排序就绪的成品了。所以抽出它只需要中序遍历就够了。由于我们支持 ReverseComp，所以必要时我们可能会采用反向中序遍历。

```cpp
      T &pop(std::size_t &count) {
        if (ReverseComp) {
          if (_left) {
            std::size_t before = count;
            T &t = _left->pop(count);
            if (before > count)
              return t;
          }
          if (!_list.empty()) {
            count--;
            T &t = _list.front();
            _list.pop_front();
            return t;
          }
          if (_right) {
            std::size_t before = count;
            T &t = _right->pop(count);
            if (before > count)
              return t;
          }
          return _null;
        }

        // normal
        if (_right) {
          std::size_t before = count;
          T &t = _right->pop(count);
          if (before > count)
            return t;
        }
        if (!_list.empty()) {
          count--;
          T &t = _list.front();
          _list.pop_front();
          return t;
        }
        if (_left) {
          std::size_t before = count;
          T &t = _left->pop(count);
          if (before > count)
            return t;
        }
        return _null;
      }
```

在这个实现中，只有一点需要特别提请注意：我们认为默认时应该是优先级由高到低依次出列，所以 normal 部分使用了反向中序遍历，而 `ReverseComp == true` 的部分才是正常的中序遍历。

至于另外一点，我们在 priority_queue 中维护了一个队列元素的计数值，所以入列出列时都应该订正该计数。这个计数值至少有利于我们去做 empty 测试。





#### 最终

最终的成品代码是像这样的：

```cpp
template<class T,
class PT = int,
class Comp = comparer<T, PT>,
class Container = std::list<T>,
bool ReverseComp = false>
  class priority_queue {
    public:
    struct element {
      Container _list;
      int _min_value;
      std::shared_ptr<element> _left{};
      std::shared_ptr<element> _right{};
      element() = default;
      ~element() = default;
      // pre-order traversal
      void NLR(std::function<void(element *)> const &fn) {
        fn(this);
        if (_left)
          _left->LNR(fn);
        if (_right)
          _right->LNR(fn);
      }
      // in-order traversal
      void LNR(std::function<void(element *)> const &fn) {
        if (_left)
          _left->LNR(fn);
        fn(this);
        if (_right)
          _right->LNR(fn);
      }
      // post-order traversal
      void LRN(std::function<void(element *)> const &fn) {
        if (_left)
          _left->LRN(fn);
        if (_right)
          _right->LRN(fn);
        fn(this);
      }
      // reverse in-order
      void RNL(std::function<void(element *)> const &fn) {
        if (_right)
          _right->LRN(fn);
        fn(this);
        if (_left)
          _left->LRN(fn);
      }
      T &pop(std::size_t &count) {
        if (ReverseComp) {
          if (_left) {
            std::size_t before = count;
            T &t = _left->pop(count);
            if (before > count)
              return t;
          }
          if (!_list.empty()) {
            count--;
            T &t = _list.front();
            _list.pop_front();
            return t;
          }
          if (_right) {
            std::size_t before = count;
            T &t = _right->pop(count);
            if (before > count)
              return t;
          }
          return _null;
        }

        // normal
        if (_right) {
          std::size_t before = count;
          T &t = _right->pop(count);
          if (before > count)
            return t;
        }
        if (!_list.empty()) {
          count--;
          T &t = _list.front();
          _list.pop_front();
          return t;
        }
        if (_left) {
          std::size_t before = count;
          T &t = _left->pop(count);
          if (before > count)
            return t;
        }
        return _null;
      }

      static T _null;
    };

    public:
    priority_queue()
      : _root{std::make_shared<element>()}
    , _comparer{} {}
    ~priority_queue() {}

    void push_back(T const &data) { push(data); }
    void pop_front() { _root->pop(_count); }
    // T &front() { return _root->front(); }

    void push(T const &data) {
      _push(_root, data);
      _count++;
    }
    T &pop() { return _root->pop(_count); }
    bool empty() const { return _count == 0; }
    static bool is_null(T const &t) { return t == element::_null; }

    public:
    void dump(std::function<void(element *)> const &fn) { ReverseComp ? _root->LNR(fn) : _root->RNL(fn); }

    private:
    void _push(std::shared_ptr<element> &at, T const &data) {
      PT l{}, r{};
      for (auto const &v : at->_list) {
        PT ret = _comparer(data, v);
        if (ret < 0) {
          if (ret < l)
            l = ret;
        } else if (ret > 0) {
          if (ret > r)
            r = ret;
        }
      }

      if (l < 0) {
        if (at->_left) {
          _push(at->_left, data);
        } else {
          at->_left = std::make_shared<element>(element{ {data}, l});
        }
        return;
      } else if (r > 0) {
        if (at->_right) {
          _push(at->_right, data);
        } else {
          at->_right = std::make_shared<element>(element{ {data}, r});
        }
      } else {
        at->_list.push_back(data);
      }
    }

    private:
    std::shared_ptr<element> _root;
    Comp _comparer{};
    std::size_t _count{};
  };

template<class T,
class PT,
class Comp,
class Container,
bool ReverseComp>
  inline T priority_queue<T, PT, Comp, Container, ReverseComp>::element::_null{};
```

##### 测试代码和结果

```cpp
void test_pq() {
    struct pq_comp {
        std::function<int(std::string const &lhs, std::string const &rhs)> pq_comp = [](std::string const &lhs, std::string const &rhs) -> int {
            if (lhs.substr(0, 4) == "CMD:") {
                if (rhs.substr(0, 4) == "CMD:")
                    return std::less()(lhs, rhs) ? -1 : 1;
            } else {
                if (rhs.substr(0, 4) == "CMD:")
                    return -1;

                return std::less()(lhs, rhs) ? -1 : 1;
            }
            return 0;
        };
        int operator()(std::string const &lhs, std::string const &rhs) const {
            return pq_comp(lhs, rhs);
        }
    };

    bet::priority_queue<std::string, int, pq_comp> pq;
    pq.push("CMD:CONNECT TO");
    pq.push("data:a123");
    pq.push("data:a125");
    pq.push("data:b1");
    pq.push("CMD:SEND");
    pq.push("data:tv1");
    pq.push("data:c3");
    pq.push("CMD:CLOSE");

    std::cout << "DUMP..." << '\n';
    pq.dump([](bet::priority_queue<std::string, int, pq_comp>::element *el) {
        for (auto const &it : el->_list) {
            std::cout << it << ',';
        }
        std::cout << '\n';
    });
  
    std::cout << "POP..." << '\n';
    while (!pq.empty())
        std::cout << pq.pop() << '\n';
}
```

它的结果类似于：

```bash
DUMP...
CMD:SEND,
CMD:CONNECT TO,
data:c3,
data:tv1,
data:b1,
data:a125,
data:a123,CMD:CLOSE,
POP...
CMD:SEND
CMD:CONNECT TO
data:tv1
data:c3
data:b1
data:a125
data:a123
CMD:CLOSE
```



### 后继

综上，我们提供了一种 C++17（没有确切地验证其向下兼容的级别，但着手编写时借用了 C++17 的工程配置）的优先队列实现。

这个实现具有比标准库版本 `std::priority_queue` 更强大的特性：

1. 比较器更宽泛，至少支持 `(-1,0,1)` 方案而不是 bool 方案，并且能够拓展到 `[MIN_INT, MAX_INT)`，甚至能够采用 float/double/complex 等其他优先级方案。如果有必要，你也可以提供枚举值作为优先级级别类型。
   1. 但因此你总是需要提供一个比较器，幸好通常它很容易编写
2. 清晰明朗的实现过程。代码部分应该属于极其易读易理解易维护的程度。
   1. 但因此在优化性能的程度上没有特别优势。

我们的实现，目前只给出了标准的部分，更多的实现代码，例如迭代器的支持、自平衡算法、更 inplace 的入列出列适配等等则被略过了，因为这些内容和优先队列本身的关系不太大了，它们影响的是工程性能，或者工程应用遍历性等方面，故而本文没有打算就其具体实施做太多介绍。



#### 问题

我们的实现是存在一点点问题的。

带优先级的比较，符合我们预期效果的，需要返回两个状态：优先级，在所属优先级之下的子队列中的级别。如此，才能构成两级的队列存储：首先是优先级排序的二叉树，然后是二叉树每个节点中的子队列中的顺次。

然而为了我们的比较器的原型足够简单，便于被用户所构造，所以我们仅仅返回了单个值作为优先级本身。

这就带来一个后果，我们插入的数据由于缺失了优先级的子顺次，所以可能并不能正确地落入我们预期的节点中。例如：首先插入“CMD:v1”，然后在插入 “CMD:v2” 时，理想的位置应该是根节点的子队列里，然而实际上我们抹去了“CMD:” 前缀的优先级（假设这是99），所以第二个值绝不会落在根节点，而是总是落入其左侧子节点中。

所以这其实是不对的。

为了保证正确的优先级划分，在定义 comparer 时需要抹去子顺次的比较部分，例如这样：

```cpp
struct pq_comp {
  std::function<int(std::string const &lhs, std::string const &rhs)> pq_comp = [](std::string const &lhs, std::string const &rhs) -> int {
    if (lhs.substr(0, 4) == "CMD:") {
      if (rhs.substr(0, 4) == "CMD:")
        return 0; // return std::less()(lhs, rhs) ? -1 : 1;
    } else {
      if (rhs.substr(0, 4) == "CMD:")
        return -1;

      return std::less()(lhs, rhs) ? -1 : 1;
    }
    return 0;
  };
  int operator()(std::string const &lhs, std::string const &rhs) const {
    return pq_comp(lhs, rhs);
  }
};
```

相比较于原来的版本，我们仅仅修改了 line 5，它将会保证所有“CMD:” 前缀的数据全部放在同一个节点之中。

#### 正确的解决

进一步的解决的办法是利用 `std::pair` 或者 `std::tuple`：既然我们已经允许你自定义优先级的数据类型 PT 了，你大可以通过 `std::pair<int, int>` 的方式，或者一个 struct 来容纳优先级。在这个方案的支撑下，我们的优先队列就有了更强劲的动力了。





#### 计划

我们打算以 [`cmdr::util::priority_queue<...>`](https://github.com/hedzr/cmdr-cxx/blob/master/libs/cmdr11/include/cmdr11/cmdr_utils.hh#L299) 作为本文所描述的优先队列的相对完整版并予以开源，作为 [`cmdr-cxx`](https://github.com/hedzr/cmdr-cxx) 的附加工具类提供。在这里我们善后了不少的细节问题，基本上可以适应工程级别的开发需求了。

> 警告：开源版本较诸本文中提供的代码有所不同。
>
> 当然，并没有本质的不同，只是完善了代码的构造方式，做了一定的重构而已。

在场景不严苛的情况下我或许是在鼓励你使用它——因为未来不太久的时间里我应该会将其进一步调优，令其开销更低。

至于适合较严苛场景的优先队列可能在将来有必要的情况下再另行独立开源。



## Conclusion

### 应用场景

优先队列在实践中的应用，莫过于银行排队策略系了，在带有优先级的作业系统调度方案实现中，优先队列是一种很自然的运用。

此外，在通讯协议设计中，控制信号具有较数据流更高的优先级，而控制信号也有紧急指令和常规指令之分，这时候就有必要用到优先队列了。

在实时系统中，优先队列的应用更为广泛，甚至可能到了任何数据流都带有优先级的程度。比方说 IoT 中的常规温度上报在走一个正常的队列，而越过某个阈值的温度值则被要求实时优先上报以利于决策端立即做出响应。

在前面提到的商圈划分方案中，按照距离远近实际上是另一种优先级。

### 有无必要再造轮子

在工程上做选择题，由于 `std::deque`，`std::list` 以及 `std::priority_queue` 的存在，大多数情况下它们都是最佳选择，你可以获得非常好的性能和便利性——除非你选择错误——例如不正确的互换使用 `std::list` 和 `std::vector`。所以绝大多数常规编程场景中我们并不需要手撸这类基础结构。

但在特殊的情况下，一般说当我们需要面对较高要求的性能调优时，可能需要在这方面进行额外的处理。这个话题，暂时我没有重新整理的动力，所以你可以考虑查阅我的旧文章  [高性能环形队列及其实现 [无锁编程概要]](http://localhost:3999/algorithm/golang/ringbuf-02-lock-free/) 以及  [高性能环形队列及其实现 [并发和多核编程概要]](http://localhost:3999/algorithm/golang/ringbuf-03-smp/) ，它们至少罗列了一些关键要素，你可以当作 checklist 来对自己的实现做指引。当你遇到需要自己的环形队列、优先队列、自己的二叉树搜索、排序等工具时，这些文章可能会有助于你适配它们到高频交易场景中。



### 参考

- [队列 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/%E9%98%9F%E5%88%97) 
- [优先队列 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/%E5%84%AA%E5%85%88%E4%BD%87%E5%88%97) 
- [高性能环形队列及其实现 [无锁编程概要]](http://localhost:3999/algorithm/golang/ringbuf-02-lock-free/) 以及  [高性能环形队列及其实现 [并发和多核编程概要]](http://localhost:3999/algorithm/golang/ringbuf-03-smp/) 
- [`cmdr-cxx`](https://github.com/hedzr/cmdr-cxx) - 一个 CLI 命令行解释工具，getopt 的替代品



### :end: