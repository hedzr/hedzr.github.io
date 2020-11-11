---
layout: single
title: 高性能环形队列及其实现 [Overview]
date: 2020-06-15
Author: hedzr
tags: [ring-buffer, circular-queue, lock-free, mpmc, golang]
categories: algorithm golang
comments: true
toc: true
---




在现代的工业性的软件开发中，Socket编程可能是不可缺少的通信方式了。无论你是在采用什么样的RPC通信机制，当开始考虑性能和效率问题时，他们最终会演变为 Socket 编程的某种变体。

而高吞吐量的 TCP/UDP 通信设计中，我们最常会用到的就是环形队列这种数据结构了。

---

事实上当然远非如此简单。

借助经典环形队列的固定尺寸且允许覆盖这一特性，我们可以非常容易地得到削峰效果，这对于允许点覆盖的高速收集场景（非强一致日志收集，非严格的采集点收集）相当有用。

如果我们实现了阻塞而非覆盖的环形队列，那么过于密集的 incoming points 可以被“较安全”地暂停。此特性对于下游设施较慢的情况依然是很有用的，但需要注意因应上游长时间阻塞的后果。

---

环形队列（ringbuf，ring queue），又被称作循环队列（cyclic queue）、圆形缓冲区（circular buffer），也称作圆形队列（circular queue），循环缓冲区（cyclic buffer），环形缓冲区（ring buffer），是一种用于表示一个固定尺寸、头尾相连的缓冲区的数据结构，适合缓存数据流。

---

本系列文章的重点在于研究高吞吐量场景下环形队列的现代实现方法。也就是说，当在MPMC（Multiple Producers and Multiple Consumers）环境下，采用 SMP 架构（[对称多处理器 Symmetric MultiProcessing](https://en.wikipedia.org/wiki/Symmetric_multiprocessing) 或者[多核 Multi-core processor](https://en.wikipedia.org/wiki/Multi-core_processor)）时，怎么样实现一个线程安全的环形队列——当然，这是基于 Golang 的。

所以系列中会讨论多核或者说 SMP 架构中的 CPU 与内存总线协作时的高级应用。

而且我们也会重点研究无锁编程（lock-free）究竟怎么做的问题。

---

下面分为四个部分介绍一个 Golang 版本的环形队列的实现细节：

1. [环形队列简介](../ringbuf-01-intro/)
2. [无锁编程概要](../ringbuf-02-lock-free/)
3. [并发编程和多核编程概要](../ringbuf-03-smp/)
4. [Golang环形队列实现](../ringbuf-04-impl/)

具体的实现代码在 <https://github.com/hedzr/go-ringbuf> 中可以找到。





:end: