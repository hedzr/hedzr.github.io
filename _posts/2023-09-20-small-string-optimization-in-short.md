---

layout: single
title: 'SSO - 小串优化快速一览'
date: 2023-8-13 05:00:00 +0800
last_modified_at: 2023-9-20 15:00:00 +0800
Author: hedzr
tags: [c++, idiom, sso]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20230811092120144.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  简要介绍 SSO (Small/Short String Optimization) 技术的可能性 ...
---



## Small String Optimization (SSO)

小字符串的内存分配优化，主要的思路是将内部指针挪作实际的字串存储空间。

### 典型地思路

正常情况下，字符串的内存管理结构（struct or class）需要一个 length 字段，以及一个（甚至于多个）内存块指针去指向实际存储空间。

在 32-bit 计算环境下，每个字符串的管理区应该会至少占用 8 bytes（length 4bytes，pointer 4 bytes）；而在 64-bit 计算环境下，这个消耗是至少 16 bytes。实际上，由于管理的需要还得算上一个容量字段来表征数据块是被分配了多大的空间。所以在 STL 库中，`std::string` 需要一个 length，一个 capacity，以及一个 pointer，一共是 24 bytes，除开 length 字段总是需要之外，其他 16 bytes 是可以被充分利用的。

这里的核心要素就在于，这 16 bytes 可以直接放字符串本身，从而避开为区区 16bytes 去分配一个堆数据块。

我们主要考虑大型计算环境，即 Intel CPU 和其他 64-bit CPU 的计算环境，典型地如手机、PC 桌面等等，在这些场景下，所谓的典型的 SSO 就是将上述的 16 bytes 直接存储字符串。例如存放“Hello”这个字串，它只需要 6bytes（含一个null结尾），加上串长也只需 14bytes，所以直接例如管理结构存储，就无需分配堆空间了。

考虑到频繁分配堆空间总是一个昂贵的操作，并且还会带来内存碎片，上述的策略显然在面对大规模小字符串且频繁分配和释放的场景有奇效。

这种思路需要一个略略改造的管理结构，一种方案是像这样：

```c++
class string {
  //
private:
    size_type m_size;
    union {
        class {
            // This is probably better designed as an array-like class
            std::unique_ptr<char[]> m_data;
            size_type m_capacity;
        } m_large;
        std::array<char, sizeof(m_large)> m_small;
    };
};
```

这是现行的 C++ 库（例如 libc++）的 `std::string` 的优化方案的简写。

如前面所说的那样，在 64-bit 计算环境中，可资利用的字段 capacity + ptr 能够提供 16 bytes 的余量，这就给 SSO 带来了优化的空间。如果返回 32-bit 的年代，区区 8 bytes 的余量能够带来的优化力度比较鸡肋，场景受到更大限制。但 16bytes余量意味着串长 15 chars 的 ASCIIZ 字符串，或者尤其是面对 UTF-8 字符串时也能有 5-15 u8-chars 的能力，这就使得优化有了意义。

> 这个缩写可以参考：<https://stackoverflow.com/questions/10315041/meaning-of-acronym-sso-in-the-context-of-stdstring>

当然，标准库（libstdc++，或者 libc++）在这方面的实现都有它们自己的考虑和复杂度。真实情况下的 std::string 比上面的缩写更复杂的多：它们可能还为 copy-on-write 等优化特性准备了额外的内务字段（例如 refcount）。所以实际的优化与权衡不如上面的策略来得简练和清晰，而是复杂和综合地考量。

全面思考 std::string 的实现，理解并且再度实现它，绝对是一个庞大的任务。或许你可以考虑去挑战一下，如果你刚刚察觉到自己的 C++ 水平在上涨了。那么你需要一点毒打。

### 另一种场景

作为思维方式的拓展，设想一下另一种场景，大量的小字符串，比较频繁的分配和回收，字符串有一定的相似度（即可能存在长字串的部分被匹配到新的更小的字符串的情况）。

这时候或许可以考虑分配一块堆空间，然后自行控制每个字符串的分配。

可以考虑不采用 AsciiZ 方式存储字符串，而是转而使用头尾指针的方式。注意由于增加了一个额外的指针，所以有更多的管理消耗。但是这样做看似没能从去除字串零结尾的手法中获得利益，但却有利于表达部分匹配的字串片段。所以当整个字串集合中的部分匹配的状况较多时，这么做还是有益的。

如果想象一下扩大整体集合的规模，在大数据的场景中考虑，例如数亿篇文章中进行词汇反排，那么上述的方法仍然有一定的好处。

此时我们的分配算法还可能考虑动态平衡和旋转，即在适当的时候重新排列内存块中的字符串，使得它们符合特定要求（以平衡二叉树的技术要求来做衡量）。

### 更多特定场景

以通用性为目的的 SSO，标准库所采用的方案具有绝对的代表性。基本上算是优无可优的唯一选择。

但在工程中的特定场景下，SSO 还可能能有其他的选择。这就需要具体情况再做考量了。

此外，内存中的优化和磁盘上的优化是各自不同的。磁盘上的算法更多需要考虑减少 I/O 次数，这是为了性能和外部存储器的寿命着想。







### Conclusion

这次讨论 SSO 其实只是浅谈一下。关于工程里受限场景中的可能性，以后有机会时找出来再重新探讨吧。

总的来说，SSO 这种技术算是细枝末节，意义不大，但也不是没有意义，在特定场合运用也能有奇效——以前曾经做过电网潮流计算以及潮流图组态，面对小串以及小数据体，这种优化能力还是有用的——只不过时日太久，捞出来解说其实也不是很有趣，那就以后吧，以后觉得有趣了或者心态闲暇时再做申发。



### References

- <https://stackoverflow.com/questions/10315041/meaning-of-acronym-sso-in-the-context-of-stdstring>