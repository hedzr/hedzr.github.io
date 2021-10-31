---
layout: "single"
title: "浅谈如何实现自定义的 iterator 之二"
date: "2021-10-30 05:19:00 +0800"
last_modified_at: "2021-10-30 15:00:00 +0800"
Author: hedzr
tags: [c++,c++11,c++17,iterator]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20211031011351070.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  实现一个树结构容器，然后为其实现 STL 风格的迭代器实例，它们可作为绝佳的编码实现范本 ...
---



## 实现你自己的迭代器 II

实现一个树结构容器，然后为其实现 STL 风格的迭代器实例。

本文是为了给上一篇文章 [浅谈如何实现自定义的 iterator](https://hedzr.com/c++/algorithm/writing-your-own-stl-iterator/)  提供补充案例。



### tree_t 的实现

我打算实现一个简单而又不简单的树容器，让它成为标准的文件目录结构式的容器类型。但简单就在于，我只准备实现最最必要的几个树结构的接口，诸如遍历啦什么的。

这是一个很标准的文件目录的仿真品，致力于完全仿照文件夹的表现。它和什么 binary tree，AVL，又或是红黑树什么的完全是风马牛不相及。

首先可以确定的是 tree_t 依赖于 generic_node_t，tree_t 自身并不真的负责树的算法，它只是持有一个 root node 指针。所有与树操作相关的内容都在 generic_node_t 中。

#### tree_t

因此下面首先给出 tree_t 的具体实现：

```cpp
namespace dp::tree{
  template<typename Data, typename Node = detail::generic_node_t<Data>>
  class tree_t : detail::generic_tree_ops<Node> {
    public:
    using Self = tree_t<Data, Node>;
    using BaseT = detail::generic_tree_ops<Node>;
    using NodeT = Node;
    using NodePtr = Node *;
    using iterator = typename Node::iterator;
    using const_iterator = typename Node::const_iterator;
    using reverse_iterator = typename Node::reverse_iterator;
    using const_reverse_iterator = typename Node::const_reverse_iterator;

    using difference_type = std::ptrdiff_t;
    using value_type = typename iterator::value_type;
    using pointer = typename iterator::pointer;
    using reference = typename iterator::reference;
    using const_pointer = typename iterator::const_pointer;
    using const_reference = typename iterator::const_reference;

    ~tree_t() { clear(); }

    void clear() override {
      if (_root) delete _root;
      BaseT::clear();
    }

    void insert(Data const &data) {
      if (!_root) {
        _root = new NodeT{data};
        return;
      }
      _root->insert(data);
    }
    void insert(Data &&data) {
      if (!_root) {
        _root = new NodeT{data};
        return;
      }
      _root->insert(std::move(data));
    }
    template<typename... Args>
    void emplace(Args &&...args) {
      if (!_root) {
        _root = new NodeT{std::forward<Args>(args)...};
        return;
      }
      _root->emplace(std::forward<Args>(args)...);
    }

    Node const &root() const { return *_root; }
    Node &root() { return *_root; }

    iterator begin() { return _root->begin(); }
    iterator end() { return _root->end(); }
    const_iterator begin() const { return _root->begin(); }
    const_iterator end() const { return _root->end(); }
    reverse_iterator rbegin() { return _root->rbegin(); }
    reverse_iterator rend() { return _root->rend(); }
    const_reverse_iterator rbegin() const { return _root->rbegin(); }
    const_reverse_iterator rend() const { return _root->rend(); }

    private:
    NodePtr _root{nullptr};
  }; // class tree_t

} // namespace dp::tree
```

其中的必要的接口基本上都转向到 _root 中了。

#### generic_node_t

再来研究 node 的实现。

一个树节点持有如下的数据：

```cpp
namespace dp::tree::detail{
  template<typename Data>
  struct generic_node_t {
    using Node = generic_node_t<Data>;
    using NodePtr = Node *; //std::unique_ptr<Node>;
    using Nodes = std::vector<NodePtr>;

    private:
    Data _data{};
    NodePtr _parent{nullptr};
    Nodes _children{};
    
    // ...
  }
}
```

据此我们可以实现节点的插入、删除以及基本的访问操作。

> 这些内容因为篇幅原因就略去了。
>
> 如果你感兴趣的话，请查阅源代码 [dp-tree.hh](https://github.com/hedzr/design-patterns-cxx/blob/master/include/design_patterns_cxx/dp-tree.hh#L540) 和 [tree.cc](https://github.com/hedzr/design-patterns-cxx/blob/master/tests/tree.cc#L357)。

#### 正向迭代器

下面给出它的正向迭代器的完整实现，以便对上一篇文章做出更完整的交代。

正向迭代器是指 begin() 和 end() 及其代表的若干操作。简单来说，它支持从开始到结束的单向的容器元素遍历。

对于树结构来说，begin() 是指根节点。遍历算法是根 - 左子树 - 右子树，也就是前序遍历算法。这和 AVL 等主要使用中序遍历有着完全不同的思路。

据此，end() 指的是 right of 最右最低的子树的最右最低叶子节点。什么意思？在最后一个叶子节点向后再递增一次，实质上是将 _invalid 标志置为 true 来表示已经抵达终点。

> 为了避免 STL end() 迭代器求值会发生访问异常的情况，我们实现的 end() 是可以安全求值的，尽管求值结果实际上没有意义（`end() - 1` 才是正确的 `back()` 元素）。

```cpp
namespace dp::tree::detail{
  template<typename Data>
  struct generic_node_t {

    // ...

    struct preorder_iter_data {

      // iterator traits
      using difference_type = std::ptrdiff_t;
      using value_type = Node;
      using pointer = value_type *;
      using reference = value_type &;
      using iterator_category = std::forward_iterator_tag;
      using self = preorder_iter_data;
      using const_pointer = value_type const *;
      using const_reference = value_type const &;

      preorder_iter_data() {}
      preorder_iter_data(pointer ptr_, bool invalid_ = false)
        : _ptr(ptr_)
          , _invalid(invalid_) {}
      preorder_iter_data(const preorder_iter_data &o)
        : _ptr(o._ptr)
          , _invalid(o._invalid) {}
      preorder_iter_data &operator=(const preorder_iter_data &o) {
        _ptr = o._ptr, _invalid = o._invalid;
        return *this;
      }

      bool operator==(self const &r) const { return _ptr == r._ptr && _invalid == r._invalid; }
      bool operator!=(self const &r) const { return _ptr != r._ptr || _invalid != r._invalid; }
      reference data() { return *_ptr; }
      const_reference data() const { return *_ptr; }
      reference operator*() { return data(); }
      const_reference operator*() const { return data(); }
      pointer operator->() { return &(data()); }
      const_pointer operator->() const { return &(data()); }
      self &operator++() { return _incr(); }
      self operator++(int) {
        self copy{_ptr, _invalid};
        ++(*this);
        return copy;
      }

      static self begin(const_pointer root_) {
        return self{const_cast<pointer>(root_)};
      }
      static self end(const_pointer root_) {
        if (root_ == nullptr) return self{const_cast<pointer>(root_)};
        pointer p = const_cast<pointer>(root_), last{nullptr};
        while (p) {
          last = p;
          if (p->empty())
            break;
          p = &((*p)[p->size() - 1]);
        }
        auto it = self{last, true};
        ++it;
        return it;
      }

      private:
      self &_incr() {
        if (_invalid) {
          return (*this);
        }

        auto *cc = _ptr;
        if (cc->empty()) {
          Node *pp = cc;
          size_type idx;
          go_up_level:
          pp = pp->parent();
          idx = 0;
          for (auto *vv : pp->_children) {
            ++idx;
            if (vv == _ptr) break;
          }
          if (idx < pp->size()) {
            _ptr = &((*pp)[idx]);
          } else {
            if (pp->parent()) {
              goto go_up_level;
            }
            _invalid = true;
          }
        } else {
          _ptr = &((*cc)[0]);
        }
        return (*this);
      }

      pointer _ptr{};
      bool _invalid{};
      // size_type _child_idx{};
    };

    using iterator = preorder_iter_data;
    using const_iterator = iterator;
    iterator begin() { return iterator::begin(this); }
    const_iterator begin() const { return const_iterator::begin(this); }
    iterator end() { return iterator::end(this); }
    const_iterator end() const { return const_iterator::end(this); }

    // ...
  }
}
```

这个正向迭代器从根节点开始从上至下、从左至右对树结构进行遍历。

有句话怎么说的来着，高手随随便便一站着全身都是破绽然后就全数都冇破绽了。对于 preorder_iter_data 来说也有点这个味道：细节太多之后，让他们全都圆满之后，然后就无法评讲代码实现的理由了。

只是讲笑，实际上是讲述起来太耗费篇幅，所以你直接看代码，我就省笔墨。



#### 反向迭代器

类似于正向迭代器，但是具体算法不同。

本文中限于篇幅不予列出，如果你感兴趣的话，请查阅源代码 [dp-tree.hh](https://github.com/hedzr/design-patterns-cxx/blob/master/include/design_patterns_cxx/dp-tree.hh#L540) 和 [tree.cc](https://github.com/hedzr/design-patterns-cxx/blob/master/tests/tree.cc#L357)。



#### 需要照顾到的事情

再次复述完全手写迭代器的注意事项，并且补充一些上回文中没有精细解说的内容，包括：

1. begin() 和 end()
2. 迭代器嵌入类（不必被限定为嵌入），至少实现：
   1. 递增运算符重载，以便行走
   2. 递减运算符重载，如果是双向行走（bidirectional_iterator_tag）或随机行走（random_access_iterator_tag）
   3. `operator*`  运算符重载，以便迭代器求值：使能 `(*it).xxx`
   4. 配套实现 `operator->` ，以使能 `it->xxx`
   5. `operator!=` 运算符重载，以便计算迭代范围；必要时也可以显式重载 `operator==`（默认时编译器自动从 `!=` 运算符上生成一个配套替代品）

补充说明：

1. 为了能与 STL 的 `<algorithm>` 算法兼容，你需要手动定义 iterator traits，如同这样：

   ```cpp
   struct preorder_iter_data {
   
     // iterator traits
     using difference_type = std::ptrdiff_t;
     using value_type = Node;
     using pointer = value_type *;
     using reference = value_type &;
     using iterator_category = std::forward_iterator_tag;
   }
   ```

   这么做的目的在于让 std::find_if 等等 algorithms 能够透过你宣告的 `iterator_catagory` 而正确引用 distance、advance、++ or -- 等等实现。如果你的 iterator 不支持双向行走，那么 -- 会被模拟：从容器的第一个元素开始遍历并登记，直到行走到 it 所在的位置，然后将 last_it 返回。其它的多数谓词也都会有类似的模拟版本。

   

   原本，这些 traits 是通过从 std::iterator 派生而自动被定义的。但是自 C++17 起，暂时建议直接手工编写和定义它们。

   你可以不必定义它们，这并不是强制。

   

2. 绝大多数情况下，你声明 std::forward_iterator_tag 类型，并定义 ++ 运算符与其配套；如果你定义为 std::bidirectional_iterator_tag 类型，那么还需要定义 -- 运算符。

   自增自减运算符需要同时定义前缀与后缀，请参考上一篇文章 [浅谈如何实现自定义的 iterator](https://hedzr.com/c++/algorithm/writing-your-own-stl-iterator/)  中的有关章节。

3. 在迭代器中，定义 begin() 与 end()，以便在容器类中借用它们（在本文的 tree_t 示例中，容器类指的是 generic_node_t。

4. 如果你想要定义 rbegin/rend，它们并不是 -- 的替代品，它们通常需要你完全独立于正向迭代器而单独定义另外一套。在 tree_t 中对此有明确的实现，但本文中限于篇幅不予列出，如果你感兴趣的话，请查阅源代码 [dp-tree.hh](https://github.com/hedzr/design-patterns-cxx/blob/master/include/design_patterns_cxx/dp-tree.hh#L540) 和 [tree.cc](https://github.com/hedzr/design-patterns-cxx/blob/master/tests/tree.cc#L357)。



### 使用/测试代码

一些测试用的代码列举一下：

```cpp
void test_g_tree() {
  dp::tree::tree_t<tree_data> t;
  UNUSED(t);
  assert(t.rbegin() == t.rend());
  assert(t.begin() == t.end());

  std::array<char, 128> buf;

  //     1
  // 2 3 4 5 6 7
  for (auto v : {1, 2, 3, 4, 5, 6, 7}) {
    std::sprintf(buf.data(), "str#%d", v);
    // t.insert(tree_data{v, buf.data()});
    tree_data vd{v, buf.data()};
    t.insert(std::move(vd));
    // tree_info(t);
  }

  {
    auto v = 8;
    std::sprintf(buf.data(), "str#%d", v);
    tree_data td{v, buf.data()};
    t.insert(td);

    v = 9;
    std::sprintf(buf.data(), "str#%d", v);
    t.emplace(v, buf.data());

    {
      auto b = t.root().begin(), e = t.root().end();
      auto &bNode = (*b), &eNode = (*e);
      std::cout << "::: " << (*bNode) << '\n'; // print bNode.data()
      std::cout << "::: " << (eNode.data()) << '\n';
    }

    {
      int i;
      i = 0;
      for (auto &vv : t) {
        std::cout << i << ": " << (*vv) << ", " << '\n';
        if (i == 8) {
          std::cout << ' ';
        }
        i++;
      }
      std::cout << '\n';
    }

    using T = decltype(t);
    auto it = std::find_if(t.root().begin(), t.root().end(), [](typename T::NodeT &n) -> bool { return (*n) == 9; });

    v = 10;
    std::sprintf(buf.data(), "str#%d", v);
    it->emplace(v, buf.data());

    v = 11;
    std::sprintf(buf.data(), "str#%d", v);
    (*it).emplace(v, buf.data());

    #if defined(_DEBUG)
    auto const itv = t.find([](T::const_reference n) { return (*n) == 10; });
    assert(*(*itv) == 10);
    #endif
  }

  //

  int i;

  i = 0;
  for (auto &v : t) {
    std::cout << i << ": " << (*v) << ", " << '\n';
    if (i == 8) {
      std::cout << ' ';
    }
    i++;
  }
  std::cout << '\n';

  i = 0;
  for (auto it = t.rbegin(); it != t.rend(); ++it, ++i) {
    auto &v = (*it);
    std::cout << i << ": " << (*v) << ", " << '\n';
    if (i == 8) {
      std::cout << ' ';
    }
  }
  std::cout << '\n';
}
```

这些代码只是单纯地展示了用法，并没有按照单元测试的做法来书写——也无此必要。



## 后记

本文给出了一个真实工作的容器类已经相应的迭代器实现，我相信它们将是你的绝佳的编码实现范本。

- 源代码 [dp-tree.hh](https://github.com/hedzr/design-patterns-cxx/blob/master/include/design_patterns_cxx/dp-tree.hh#L540) 和 [tree.cc](https://github.com/hedzr/design-patterns-cxx/blob/master/tests/tree.cc#L357)



:end:

