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



下面分为四个部分介绍一个 Golang 版本的环形队列的实现细节：

1. [环形队列简介](../ringbuf-01-intro/)
2. [无锁编程概要](../ringbuf-02-lock-free/)
3. [并发编程和多核编程概要](../ringbuf-03-smp/)
4. [Golang环形队列实现](../ringbuf-04-impl/)

具体的实现代码在 <https://github.com/hedzr/go-ringbuf> 中可以找到。