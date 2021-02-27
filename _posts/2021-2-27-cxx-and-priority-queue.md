---
layout: single
title: '优先队列(C++)'
date: 2021-2-27 07:41:00 +0800
last_modified_at:2021-2-27 15:21:12 +0800
Author: hedzr
tags: [c++, queue, priority queue]
categories: c++ queue
comments: true
toc: true
header:
  overlay_image: /assets/images/foo-bar-identity-th.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  回顾队列这种数据结构，以及优先队列的 C++ 实现 ...
---







本文中接上一篇[队列（C++）](/c++/queue/cxx-and-queue)回顾了队列这种数据结构后，进一步探讨优先队列（Piority Queue）的一种 C++ 实现，但限于理论性的而非工程性的，特别是，并非高频交易的。

## 背景

### Java

Java 上有预建的 [`PriorityQueue<T>`][https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/PriorityQueue.html] 数据结构。它有所谓的最小堆（小顶堆），最大堆（大顶堆）的概念，但这个概念并不是什么特别严谨的说法，而是在排序领域借用了堆排序中的一些概念，用最粗鄙的说法是优先级是按增量排序还是降序排列的问题。

> 值得注意的是，堆排序也只是一种稍稍有点特别的二叉树而已。它的特殊之处在于，堆排序更强调 Top N 问题域而不是集合排序问题。

Java 优先队列采用了一颗完全二叉树作为其内部实现的核心结构。借用二叉树的排序能力，倒也不是 Java 优先队列的专利。事实上，大多数语言提供的、实现的优先队列，都必须采用一种方案来完成最小开销的排序能力，从而完成“优先”队列中优先级的比较和排序。

从理论上来说，采用红黑树可能是最佳的方案，因为红黑树带有一个特性：它是强制完全平衡的。这意味着在队列出口做 Peek 时，你会获得最佳的性能。作为其代价，在队列的入口会产生额外的插入时开销，此外在队列出口做 Dequeue 也会有额外的删除时开销，其开销比起普通的自平衡二叉树来说要深刻一些。所以在现实的工程性实现中，PriorityQueue 通常并不会采用红黑树，而是仅仅使用一个完全二叉树，诸如 AVL，乃至于 [B 树](https://en.wikipedia.org/wiki/B%2B_tree) 等，具体选择取决于业务场景中队列元素的可能的分布概率、访问频率等等。

如果队列元素比较有特殊性，例如是基于餐馆地址的距离来决定优先级的，有500米，2公里，5公里，10公里这样的商圈划分，那么你可能会有有必要专门实现特定的优先队列，例如内核采用 [R 树](https://en.wikipedia.org/wiki/R-tree) 来实现，将会有可能在这个瓶颈上获得最优化。不过事实上据我所知没有什么人会这么做：很明显，大家都会用个现成的优先队列，定制一个排序器就算了，哪怕这个排序器中的算法可能代价很高，谁在乎呢？性能不行就加内存、加机器……而且，恐怕也没有什么场景会真的有上亿家店铺等待着我们的商圈划分吧，或许就是一千家店铺的排序而已，有何必要专门优化呢？所以这里只是一种设想。



### C++

STL 中很早就内置了优先队列所谓一种基础设施：[`std::priority_queue<class T, class Container, class Compare>`](https://en.cppreference.com/w/cpp/container/priority_queue)。

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





## 优先队列



### 基本介绍

[优先队列](https://en.wikipedia.org/wiki/Priority_queue)，它本质上还是一种队列。换句话说，它必须保证最优的入列出列算法代价，否则就没有队列的意义了。除此而外，基于“优先”一词的限定，它必须支持插入带优先级的元素，并依照优先级的从高到低的顺序依次取出元素。

> 极端情况下，有人可能会设计一个队列，常规方式入列，而在出列时则会遍历队列中全部元素，找到优先级最高的元素并对其做出列操作——这不是我的编造，而是实有其事的——又或者出列的时候统一做一次排序操作，然后捡出最大或最小值再来出列。说实话，这么做的人也不见得就叫做少数。他们有罪吗？难以评论



其次，优先队列必须满足队列的基本特性，即先进先出特性。换句话说，如果所有的入列元素的优先级是相同的，那么出列顺序必须是 FIFO 的。否则，如果反之那就成了堆栈，如果是乱序，那就是乱序滤波器了。





### 一个实现







## Conclusion



[队列 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/%E9%98%9F%E5%88%97) 

