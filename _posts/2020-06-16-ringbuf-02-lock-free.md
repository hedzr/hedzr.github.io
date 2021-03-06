---
layout: single
title: 高性能环形队列及其实现 [无锁编程概要]
date: 2020-06-16 11:00:38 +0800
Author: hedzr
tags: [ring-buffer, circular-queue, lock-free, mpmc, golang]
categories: algorithm golang
comments: true
toc: true
---

> **摘要**：  
> 针对无锁编程需要考虑的问题简要做一罗列。

### 无锁编程概要

高性能的无锁编程涉及到两个关键点，首先是CAS粒度缩小问题，再一是利用CPU的流水线预取，也就是一级和二级缓存 L1 和 L2。

#### 锁粒度控制

缩小CAS粒度，主要在于利用 `atomic.CompareAndSwapUint32` 函数。这样的CPU机器指令能够在单条指令中完成数据的比较和更改且保证数据的一致性。这是已知的唯一的保证一致性前提下的最小代价的CAS。所以所有的有意义的无锁编程的核心之一，就是充分利用这一CPU支持来达到最小代价的锁，或者说，在CAS理论的领导下，不可能有不加锁而保证数据一致性的办法，只不过有了 `atomic.CompareAndSwapUint32` 函数（以及其它相关指令）的支持下，锁定的粒度被限制到了一条机器指令里，这就使得锁到代价被视为了零。

对于 Windows API 来说，`InterlockedIncrement()` 及其相关原型基本等价于 `atomic` 的 `CompareAndSwapUint32` 等一系列原语。它们也对应着 Intel CPU 的 `lock cmpxchg`

#### 预取机制

CPU的流水线预取，这原本是 x86 系列CPU的特性（1982，1985），但在 ARM，MIPS 等架构中也被良好的支持，所以在多数情况下我们不考虑无预取机制不能带来性能提升的问题，转而考虑怎么才能真正正确地利用CPU预取特性。

CPU预取实际上指的是两个方面，一是机器指令的预取，而是内存的相邻区域被自动预取到 L1 和 L2 的行为。

##### 指令预取

机器指令的预取会被跳转指令所打断，否则的话当前指令的后继数条指令将被自动地提取到执行机构的等待管线（Pipeline）中，因此当前指令执行完毕后，下一条指令无需内存和总线等待就会被立即执行。当然这是一个相当复杂的逻辑，尤其在多核情况下更是复杂。此外，最新的CPU已经能够较智能地识别跳转指令所带来的影响并正确地预取跳转目标位置的新指令，这仍然是有限的，不过通过更大的片上缓存（L2）也并非不能改善（*分支预测*）。由于高级语言的编译器优化等原因，程序员对于指令预取的操控力较为有限，因此在无锁编程中这个方面较少被考虑，但如果你在实现 C/C++ 算法的话，这一块也需要被纳入性能化编程的考虑范围。

##### 数据预取/内存预取

L1 Cache 和 L2 Cache 的预取特性，是指当 CPU 执行指令是如果正在访问内存位置 A，那么 A 地址之后的一块内存将会被自动装入L1缓存中，如果下一条指令没有操作这块内存的话，则 L1 中的内存块失效并被退化到 L2 中，如果命中的话则无需延迟直接被使用；如果当前指令是在修改 A 地址中的数据的话，则缓存完全失效，这块内存如果还要被继续使用的话将需要重新预取。但 `atomic.CompareAndSwapUint32` 函数可以算是例外，L1缓存并不需要因为被修改而失效。