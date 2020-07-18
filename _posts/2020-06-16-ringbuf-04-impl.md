---
layout: single
title: 高性能环形队列及其实现 [Golang版本实现]
date: 2020-06-16 13:00:38 +0800
last_modified_at: 2020-07-18 09:00:00 +0800
Author: hedzr
tags: [ring-buffer, circular-queue, lock-free, mpmc, golang]
categories: algorithm golang
comments: true
toc: true
---




> **摘要**：  
> 下面将依据前面的背景知识实现一个无锁的（Lock-Free）环形
> 队列（Circular Queue，Ring Buffer），尽可能地解除各种竞争状况。  
> 可以直接访问代码仓库：<https://github.com/hedzr/go-ringbuf>





下面将依据前面的背景知识实现一个无锁的环形队列（Circular Queue，Ring Buffer），尽可能地解除各种竞争状况。

### 基本定义

首先是队列的大小，多数已有的环形队列均推荐使用 2 的冥数（`2^n`）为队列尺寸，其好处在于通过和 `2^n-1` 的 `AND` 操作即可将 `head`/`tail` 指针绕回，避免了 `mod` 操作。在 CPU 指令集中，`mod` 操作依赖于一个 `IDIV` （整数除法）运算，这通常是 `AND` 操作耗时的数倍。

其次是 `ringbuf` 结构体的对齐，在 Golang 中这是自动的，所以没有什么可说的。

为了解决 `ringbuf` 元素数组中每个元素 `rbItem` 的 CacheLine 问题，我们对其进行了填充，使得一个 `rbItem` 能够占满一个 CacheLine。

```go
type (
	Queue interface {
		Enqueue(item interface{}) (err error)
		Dequeue() (item interface{}, err error)
		// Cap returns the outer capacity of the ring buffer.
		Cap() uint32
		// Size returns the quantity of items in the ring buffer queue
		Size() uint32
		IsEmpty() (b bool)
		IsFull() (b bool)
	}

	RingBuffer interface {
		io.Closer // for logger

		Queue

		Put(item interface{}) (err error)
		Get() (item interface{}, err error)

		// Quantity returns the quantity of items in the ring buffer queue
		Quantity() uint32

		Debug(enabled bool) (lastState bool)

		ResetCounters()
	}

	ringBuf struct {
		cap        uint32
		capModMask uint32
		head       uint32
		tail       uint32
		putWaits   uint64
		getWaits   uint64
		_          [CacheLinePadSize]byte
		data       []rbItem
		debugMode  bool
		logger     *zap.Logger
	}

	rbItem struct {
		readWrite uint64      // 0: writable, 1: readable, 2: write ok, 3: read ok
		value     interface{} // ptr
		_         [CacheLinePadSize - 8 - 8]byte
		// _         cpu.CacheLinePad
	}
)
```

至于 `Queue` 和 `RingBuffer` 是库作者的例行操作，就不赘述了。

在 `rbItem` 中增加了 CacheLine 对齐字段，这是为了避免每个 producer/consumer 操作一个 `rbItem` 时彼此之间发生 false sharing 干扰。因此，多个 `rbItem`  无法被同时载入一个 Cache Line 中，所以数据竞争的问题也同时被避免了。实测呢，好像有点点改善，但也没有好到一倍的状态，不过即使没有性能改善，为了 DATA RACE 也必须进行这样的对齐，才能确保在这里不必引入一颗锁。

在 `ringBuf` 中同样也有对齐字段以免操作 head/tail/putWaits/getWaits 时关联载入 data 指针，不过正因为data是指针，所以这个对齐字段的效用通常为 0。为了代码可移植性（到 C++11 模版类？），暂且保留该对齐。



### 操作

#### 测试：队列空，队列满

```go
func (rb *ringBuf) IsEmpty() (b bool) {
	var tail, head uint32
	var quad uint64
	quad = atomic.LoadUint64((*uint64)(unsafe.Pointer(&rb.head)))
	head = (uint32)(quad & MaxUint32_64)
	tail = (uint32)(quad >> 32)
	// var tail, head uint32
	// head = atomic.LoadUint32(&rb.head)
	// tail = atomic.LoadUint32(&rb.tail)
	b = head == tail
	return
}

func (rb *ringBuf) IsFull() (b bool) {
	var tail, head uint32
	var quad uint64
	quad = atomic.LoadUint64((*uint64)(unsafe.Pointer(&rb.head)))
	head = (uint32)(quad & MaxUint32_64)
	tail = (uint32)(quad >> 32)
	b = ((tail + 1) & rb.capModMask) == head
	return
}
```



##### 关于 head/tail 的载入优化

由于我们限定了 head 和 tail 指针为 32 位整数，因此原子操作可以一次取得它们而不是两次。这能够带来小小的提升，实测证明了有其存在的价值。

> 如果 CPU 架构使用 Big Endian 模式，上述代码需要被调整。
>
> 在移植时才会考虑针对性改写。

> **考虑进一步优化**：
>
> 如果是 C++/C/ASM的话，原子指令的相关函数调用可以去掉，quard，tail，head可以使用寄存器，也无需 AND 和 SHIFT 运算。
>
> binary 包对此没有帮助。



##### 进一步的针对 head/tail 的优化

由于 put 操作使用 tail 和 head，但不会修改 head（相应的 get 操作也类似于此），所以我们还有另一个选择进行性能提升：

分离 head 和 tail 的存储位置保证不会同时载入单一 CacheLine。

这个策略可以这样实现：

```go

	ringBuf struct {
		cap        uint32
		capModMask uint32
		_          [CacheLinePadSize - 8]byte
		head       uint32
		_          [CacheLinePadSize - 4]byte
		tail       uint32
		_          [CacheLinePadSize - 4]byte
		putWaits   uint64
		_          [CacheLinePadSize - 8]byte
		getWaits   uint64
		_          [CacheLinePadSize - 8]byte
		data       []rbItem
		debugMode  bool
		logger     *zap.Logger
	}

// 此时需要分别取得 head tail：
var tail, head uint32
head = atomic.LoadUint32(&rb.head)
tail = atomic.LoadUint32(&rb.tail)
```

这种方法应该比当前的简要方案更具有优势。但是出于试验的目的，我们暂时没有应用该方案，而是将此优化推迟到 v1.x 发布时。目前 go-ringbuf v0.7.x 将采用前文述及到单次原子操作方案。



##### 关于判定算法

我们采用标准的环形队列实现方案：

2. 保留一个元素的空间

即不允许 tail 赶上 head，队尾节点和对首节点之间至少留有一个元素的空间。

如果 head == tail，队列空；

如果 (tail+1) % M == head，队列满。



#### Cap 和 Size

`Cap()` 表示环形队列的容量，`Size()` 及其同义词 `Quantity()` 返回的是当前队列中的元素数量。

```go
func (rb *ringBuf) Quantity() uint32 {
	return rb.Size()
}

func (rb *ringBuf) Size() uint32 {
	var quantity uint32
	// head = atomic.LoadUint32(&rb.head)
	// tail = atomic.LoadUint32(&rb.tail)
	var tail, head uint32
	var quad uint64
	quad = atomic.LoadUint64((*uint64)(unsafe.Pointer(&rb.head)))
	head = (uint32)(quad & MaxUint32_64)
	tail = (uint32)(quad >> 32)

	if tail >= head {
		quantity = tail - head
	} else {
		quantity = rb.capModMask + (tail - head)
	}

	return quantity
}

func (rb *ringBuf) Cap() uint32 {
	return rb.cap
}
```



#### Enqueue / Put

一些无锁方案在实现之后会显得较为玄妙，这当然是体现了设计者的精巧思路的。其麻烦在于，配图配论文都不容易改善它们的可读性。

##### Put 算法

在我们的 `ringBuf` 中，解决无锁以及避让问题采用了比较明晰而且简洁的路子，其思路是这样的：

1. 每个 `rbItem` 承载着一个标志 `readWrite` 以及元素实体 `value`

2. 申请队尾写入权

   当入队列操作时，首先期待 `readWrite` == 0，这意味着这个队列尾部的 `rbItem` 是干净的，写入就绪的（即空闲状态）；

   一旦原子操作确认到这样的队列尾部 `rbItem`，则其 `readWrite` 标志也被更新为 2。这表示着该 `rbItem` 被申请成功了。其它 producers 将无法取得该 `rbItem` 作为它们的写入目标了。

3. 现在是时候更新 `tail` 指针到下一元素了

4. 同时，我们可以安全地更新 `value` 成员（多个 `rbItem`  无法被同时载入一个 Cache Line 中）

5. 最后，我们将 `readWrite` 标志更新为 `1`，这标志着入列操作已经完成，这个 `rbItem` 现在是读出就绪的

```go
func (rb *ringBuf) Enqueue(item interface{}) (err error) {
	var tail, head, nt uint32
	var holder *rbItem
	for {
		var quad uint64
		quad = atomic.LoadUint64((*uint64)(unsafe.Pointer(&rb.head)))
		head = (uint32)(quad & MaxUint32_64)
		tail = (uint32)(quad >> 32)
		// head = atomic.LoadUint32(&rb.head)
		// tail = atomic.LoadUint32(&rb.tail)
		nt = (tail + 1) & rb.capModMask

		isFull := nt == head
		if isFull {
			err = ErrQueueFull
			return
		}

		holder = &rb.data[tail]

		if atomic.CompareAndSwapUint64(&holder.readWrite, 0, 2) {
			holder.value = item
			atomic.CompareAndSwapUint32(&rb.tail, tail, nt)
			break
		}

		time.Sleep(1 * time.Nanosecond)
		atomic.AddUint64(&rb.putWaits, 1)
	}

	if !atomic.CompareAndSwapUint64(&holder.readWrite, 2, 1) {
		err = fmt.Errorf("[W] %w, 2=>1, %v", ErrRaced, holder.readWrite)
		return
	}

	return
}
```

##### 例外情况

1. `步骤2` 操作失败时，意味着其它 producers 已经拿到了队尾 `rbItem` 的写入权，因此我们使用一个 1ns 的延迟并再次自旋，以求取得新的队尾写入权。

2. `步骤3` 的原子操作可能会失败。

   这代表着这个队尾已经旧了，新的队尾已经被别的 producers 提交成功了。

   因此，我们可以安全地忽略 `tail` 的更新不成功的问题。

3. `步骤4` 存在偶然的可能性会失败。

   这种可能性发生时，代表着运行环境已经崩塌了，属于致命性错误。

   暂时，我不能排除时算法错误的因素带来的这个错误，但目前经过大量工程实测验证来看，算法可能不是最优的，但没有缺陷。

   理论上的证明需要另外成文了，以后再说了。



#### Dequeue / Get

##### Get算法

类似于 Put 算法，Get 算法操作 head 指针并写入 value 实体：

1. 每个 `rbItem` 承载着一个标志 `readWrite` 以及元素实体 `value`

2. 申请队首读取和更新权

   当出队列操作时，首先期待 `readWrite` == 1，这意味着这个队列尾部的 `rbItem` 是干净的，读出就绪的；

   一旦原子操作确认到这样的队列尾部 `rbItem`，则其 `readWrite` 标志也被更新为 3。这表示着该 `rbItem` 被申请成功了。其它 consumers 将无法取得该 `rbItem` 作为它们的读出目标了。

3. 现在是时候更新 `head` 指针到下一元素了

4. 同时，我们可以安全地读取 `value` 成员（多个 `rbItem`  无法被同时载入一个 Cache Line 中）

5. 最后，我们将 `readWrite` 标志更新为 `0`，这标志着出列操作已经完成，这个 `rbItem` 现在是空闲状态了。

```go
func (rb *ringBuf) Dequeue() (item interface{}, err error) {
	var tail, head, nh uint32
	var holder *rbItem
	for {
		var quad uint64
		quad = atomic.LoadUint64((*uint64)(unsafe.Pointer(&rb.head)))
		head = (uint32)(quad & MaxUint32_64)
		tail = (uint32)(quad >> 32)
		// head = atomic.LoadUint32(&rb.head)
		// tail = atomic.LoadUint32(&rb.tail)

		isEmpty := head == tail
		if isEmpty {
			err = ErrQueueEmpty
			return
		}

		holder = &rb.data[head]

		if atomic.CompareAndSwapUint64(&holder.readWrite, 1, 3) {
			item = holder.value
			nh = (head + 1) & rb.capModMask
			atomic.CompareAndSwapUint32(&rb.head, head, nh)
			break
		}

		time.Sleep(1 * time.Nanosecond)
		atomic.AddUint64(&rb.getWaits, 1)
	}

	if !atomic.CompareAndSwapUint64(&holder.readWrite, 3, 0) {
		err = fmt.Errorf("[R] %w, 3=>0, %v", ErrRaced, holder.readWrite)
		return
	}

	if item == nil {
		err = fmt.Errorf("[ringbuf][GET] cap: %v, qty: %v, head: %v, tail: %v, new head: %v", rb.cap, rb.qty(head, tail), head, tail, nh)

		if !rb.debugMode {
			rb.logger.Warn("[ringbuf][GET] ", zap.Uint32("cap", rb.cap), zap.Uint32("qty", rb.qty(head, tail)), zap.Uint32("tail", tail), zap.Uint32("head", head), zap.Uint32("new head", nh))
		}
		rb.logger.Fatal("[ringbuf][GET] [ERR] unexpected nil element value FOUND!")
	}
	return
}
```

同样地，多个 consumers 通过 1ns 的自旋来申请读出权直至成功，这会带来潜在的阻塞问题。

既然 `ringBuf` 的用途时面向高吞吐、高并发场景，那么多个 consumers 在申请读出权失败时被阻塞也是调用者期待的行为，因为那个成功的 consumer 必然会在有限的步骤里（一般来说可能是 2.691µs 这个级别）释放这个被锁定的元素，所以往往自旋 1 到数次即可拿到下一个新的队首元素的读出权、或者是返回队列为空错误由调用者决定下一步行为。

注意 Enqueue 在相似的步骤中面对的情况是类似的，因而不再单独解析其行为。

由于自旋部分一定会在有限步骤中退出（成功，失败，空队列），所以这部分算法是 lock free 的。

#### 无锁的 PUT 和 GET

##### ABA Problem

在 Golang 中并没有线程的概念，Goroutine 实质上是在一个维护线程中分片的。

ABA 问题的本质在于不同线程、不同CPU核心等 Yield 场景下脏数据的问题。对此我们是通过独占的 rbItem 数据块的方式来避让的。只要任何时候仅有一个 Producer 能够拿到一个特定 rbItem 的写入权，那么就不会发生 ABA 问题：这个 rbItem 在任何时候都不可能被另一个 Producer 写，也不可能被另一个 Consumer 读（任何一个 Consumer 能读到的只会是队列尾部的 rbItem）。

所以特定地针对环形队列，只要在 队列为空或已满 的检测能够保证无歧义，就无需担心发生 ABA 问题。


### 小结

我们已经解释了关键性的无锁 Enqueue/Dequeue 思路，具体的实现代码在 <https://github.com/hedzr/go-ringbuf> 中可以找到。

#### 性能

##### MPMC

我们在实现过程中作出了必要的取舍，目前看来算法正确性是有保障的。同时它的性能不俗：

```bash
$ go test ./ringbuf/rb -v -race -run 'TestRingBuf_MPut'
=== RUN   TestRingBuf_MPut
    TestRingBuf_MPut: rb_test.go:223: Grp: 16, Times: 1360000, use: 26.266041367s, 19.313µs/op
    TestRingBuf_MPut: rb_test.go:224: Put: 1360000, use: 24.036637261s, 17.673µs/op | retry times: 0
    TestRingBuf_MPut: rb_test.go:225: Get: 1360000, use: 2.229404106s, 1.639µs/op | retry times: 0
--- PASS: TestRingBuf_MPut (51.29s)

=== RUN   TestRingBuf_MPut
    TestRingBuf_MPut: rb_test.go:231: Grp: 16, Times: 1360000, use: 42.836537705s, 31.497µs/op
    TestRingBuf_MPut: rb_test.go:232: Put: 1360000, use: 39.277276612s, 28.88µs/op | retry times: 0
    TestRingBuf_MPut: rb_test.go:233: Get: 1360000, use: 3.559261093s, 2.617µs/op | retry times: 0
--- PASS: TestRingBuf_MPut (53.60s)

=== RUN   TestRingBuf_MPut
    TestRingBuf_MPut: rb_test.go:437: Grp: 64, Times: 2080000, use: 1.727441842s, 830ns/op
    TestRingBuf_MPut: rb_test.go:438: Put: 2080000, use: 1.456310596s, 700ns/op | retry times: 0
    TestRingBuf_MPut: rb_test.go:439: Get: 2080000, use: 271.131246ms, 130ns/op | retry times: 0
--- PASS: TestRingBuf_MPut (187.82s)
PASS
```

我们运行多生产者多消费者的手工 benchmark 测试可以得到以上结果，这里给出的结果实例是两次运行的结果，原因是单独的工作站测试的参考价值一般话且不稳定。从结果中我们可以看到 put + get 的操作平均值大约在 19.313µs/op .. 31.497µs/op 之间。

由于模拟了真实场景的消费情况，因此覆盖了 Enqueue/Dequeue 的各个分支尤其是做到了申请写入/读出权竞争状态的模拟，因此这里的数据比较有参考价值。

1.639µs/op 的出列（610M/s），17.673µs/op 的入列（57M/s）已经是达到了我们预期的目标了。

换用 8Core 64M 的机器跑到了 700ns/write-op，120ns/read-op 的程度。






##### 对照

为了横向比较，我们以相同方式运行了别的例子，得到的结论是 ringBuf 大概在 9.734µs/op 左右，而对照者大约在 8.373µs/op 左右。



之所以这组对照结果和 MPMC 有所不同，原因是对照组采用先一次性写入然后一次性读出的方式来计算 put+get 时长，所以我们使用同样的测试方式另行完成了对照测试。



在高性能服务器上，这一测试的工作性能有可能达到 1~2µs/op 级别（增加核心、增加内存，选择高总线带宽）：

```bash
=== RUN   TestQueuePutGetLong
    TestQueuePutGetLong: rb_test.go:399: Grp: 64, Times: 20800000, use: 2m1.90187948s, 5.86µs/op
    TestQueuePutGetLong: rb_test.go:400: Put: 20800000, use: 52.716325629s, 2.534µs/op
    TestQueuePutGetLong: rb_test.go:401: Get: 20800000, use: 57.048982796s, 2.742µs/op
--- PASS: TestQueuePutGetLong (121.90s)

```

但这种先写后读的测试结果没有太大的参考性，比较理论化。



##### 说明

性能测试自己跑才能比较，因为我懒得去找标准机做 Benchmark。上面给出的数据是在 i5-5257U CPU @ 2.70GHz 的 MBP 上跑出来的，只能证明 Server 端表现可以更好，但不能当作独立的依据。





### References:

[^1], [^2], [^3], [^4], [^5], [^6], [^7], [^8], [^9], [^10], [^11], [^12], [^13], [^14], [^15], [^16]

[^100], [^101], [^201], [^202], [^203], [^204], [^205], [^206], [^207]



#### 时间度量



```
1	普朗克时间：约 5.39×10-44秒
2	幺秒（ys）：10-24秒
3	仄秒（zs）：10-21秒
4	阿秒（as）：10-18秒
5	飞秒（fs）：10-15秒
6	皮秒（ps）：10-12秒
7	纳秒（ns）：10-9秒
8	微秒（µs）：10-6秒
9	毫秒（ms）：10-3秒
10	秒（s）
11	千秒（ks）：103秒
12	兆秒（Ms）：106秒
13	吉秒（Gs）：109秒
14	太秒（Ts）1012秒
15	1013秒
16	1014秒：相当于317万年
17	1015秒（Ps）：相当于3200万年
18	1016秒：相当于3.2亿年
19	1017秒：相当于32亿年
20	1018秒（Es）：相当于320亿年
21	1019秒以上：相当于3,200亿年以上的时间
```





🔚




[^1]: [環形緩衝區 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/%E7%92%B0%E5%BD%A2%E7%B7%A9%E8%A1%9D%E5%8D%80) 
[^2]: [CircularBuffer - c2 - wiki](http://wiki.c2.com/?CircularBuffer)
[^3]: [boost: circular_buffer](https://www.boost.org/doc/libs/1_39_0/libs/circular_buffer/doc/circular_buffer.html)
[^4]: 多核 CPU，CPU集群：预取，乱序执行，超标量流水线，并发编程
[^5]: [Paul E. McKenney: *Memory Barriers: a Hardware View for Software Hackers* (pdf)](http://www.rdrop.com/users/paulmck/scalability/paper/whymb.2010.06.07c.pdf)
[^6]: [内存屏障 (Wikipedia, en)](https://en.wikipedia.org/wiki/Memory_barrier)
[^7]: [Intel® 64 and IA-32 Architectures Software Developer’s Manual](https://software.intel.com/en-us/articles/intel-sdm)
[^8]: [Memory Barriers/Fences](https://mechanical-sympathy.blogspot.jp/2011/07/memory-barriersfences.html)
[^9]: [Memory Barriers: a Hardware View for Software Hackers, Paul E. McKenney, Linux Technology Center, IBM Beaverton](https://www.researchgate.net/publication/228824849_Memory_Barriers_a_Hardware_View_for_Software_Hackers)
[^10]: [Intel Sandy Bridge Configuration](http://www.7-cpu.com/cpu/SandyBridge.html)
[^11]: [Intel’s Haswell CPU Microarchitecture](http://www.realworldtech.com/haswell-cpu/5/)
[^12]: [Write Combining](http://mechanical-sympathy.blogspot.com/2011/07/write-combining.html)
[^13]: [Memory ordering](https://en.wikipedia.org/wiki/Memory_ordering)
[^14]: [C++内存屏障（内存顺序）总结](http://lday.me/2017/12/02/0018_cpp_atomic_summary/)
[^15]: [Race Condition(竞态条件) 和Memory Barrier(内存屏障)](https://holajiawei.com/race-and-memory/)
[^16]: [可视化Go内存管理 - Tony Bai](https://tonybai.com/2020/03/10/visualizing-memory-management-in-golang/)
[^100]: [DPHPC: Sequential Consistency - pdf/slider](https://spcl.inf.ethz.ch/Teaching/2017-dphpc/recitation/seqcons.pdf)
[^101]: [CPU Cache Line伪共享问题的总结和分析- 51CTO.COM](https://biz.51cto.com/art/201901/590602.htm)
[^201]: [**探索Golang 一致性原语**- 温习江湖](https://wweir.cc/post/探索-golang-一致性原语/)
[^202]: [https://golang.org/ref/mem](https://golang.org/ref/mem)
[^203]: [LearnConcurrency](https://github.com/golang/go/wiki/LearnConcurrency): Read [Advanced Go Concurrency Primitives](https://encore.dev/blog/advanced-go-concurrency), Study [The Go Memory Model](https://golang.org/ref/mem)
[^204]: [Golang内存模型 - apeipo的博客](http://longlog.me/2018/09/12/2018-09-12-golang-mem/)
[^205]: [Go语言内存模型](http://hugozhu.myalert.info/2013/04/20/31-golang-memory-model.html)
[^206]: [Golang内存模型- 简书](https://www.jianshu.com/p/ba9114542bb7)
[^207]: [Go并发编程中的那些事](https://github.com/xitu/gold-miner/blob/master/TODO/concurrent-programming.md)