---
layout: single
title: '两个 Golang 无锁编程技法 [续]'
date: 2023-12-26 05:00:00 +0800
last_modified_at: 2023-12-26 12:00:00 +0800
Author: hedzr
tags: [golang, nolock]
categories: golang nolock
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20231026110402900.png
  overlay_image: /assets/images/unsplash-image-3.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  还有一些关于加锁和避免、减轻锁定强度的思路 ...
---

## 两个有用的无锁编程技法 [续]

接续上回的 [两个 Golang 无锁编程技法](https://hedzr.com/golang/nolock/two-nolock-skills-in-go/)，继续讨论无锁技法。前篇的思想算是比较激进的吧，属于纯粹的 nolock programming 讨论。

尽管我们的理想是全面无锁，但事实上这是不可能的。公共的数据就会带来竞争，竞争带来的负面代价就是锁定，无论采用何种思路，只要有公共数据的共用需求，那各种技巧都不能最终将锁定抹除。所以除开纯粹的 nolock programming 之外，lock-free 也是一种可堪接受的实作范式。一般来说，泛泛讨论无锁编程时多数人其实都是在渴求 lock-free，因为想要拒绝加锁既然不可能，那就 CAS 吧，足够轻量了。如果连 lock-free 也都做不到，那就 RW locking 也好过 mutex/critical-section。

所以从编码的角度来看，我们一方面要尽可能减少锁定区域面积，一方面要设法避免锁定。这就引出如下几个惯用法：

1. Golang 专用：借助 channel 避开加锁
2. 使用交换（swap）模式
3. 将锁定精简化、轻量化：RWMutex，atomic+CAS

可能这里并不能罗列全部，以后整理脑瓜子了再继续。



### 借助 channel 避开加锁

Golang 提供的 channel 基本上对于初学者来说是个神奇的东西。对于 C++ 转来的人来说它也比较抽象，还好不至于无法理解，毕竟都是经过 C++ 毒打的人了，还能有什么东西能让我惊惧呢。

不过，所谓 channel 避开加锁或者通过 channel 共享数据以消解 dataracing，在本质上依赖于两点：

1. 待共享数据的所有权被转交了
2. channel 内部加锁了

下面的示例解释了数据所有权转交的含义：

```go
func (s *connS) Write(data []byte) (n int, err error) {
	if n = len(data); n > 0 {
		s.chWrite <- data
	}
	return
}

func (s *connS) rawWriteNow(data []byte, deadline time.Duration) (n int, err error) {
	err = s.conn.SetWriteDeadline(time.Now().Add(deadline))

	if err == nil {
		n, err = s.conn.Write(data)
	}
	return
}

func (s *connS) serve(ctx context.Context, w api.Response, r api.Request) {
	defer s.Close()
	s.Verbose("[connS] looper - entering...")
	go s.readBump(ctx, w, r)
writeBump:
	for {
		select {
		case <-ctx.Done():
			s.Debug("[connS] looper/writeBump ended.")
			break writeBump

		case data := <-s.chWrite:
			s.Verbose("[connS] rawWriteNow wake up")
			if _, err := s.rawWriteNow(data, s.writeTimeout); err != nil {
				s.handleError(err, "[connS] Write failed")
				break writeBump
			}
		}
	}
}
```

> 代码节选自 go-socketlib 中 server 部分。

由于数据在通过 channel （`s.chWrite`）传输之后，拥有者事实上就必须放弃其所有权，所以在任一瞬间，数据都没有被超过一人所共享，那就没有竞争了。这其实是变相的另一种 Entry 模式，对不对。

[Share Memory By Communicating - The Go Programming Language](https://go.dev/blog/codelab-share) 提供了关于通过 channel 共享内存数据块的更官方的表述。但这篇文章有它自己的服务目标。而本文从新描述这个套路，是为了揭示其本质：放弃所有权（不仅仅是读写权利）来避开数据共享，从而避开加锁。

Golang channel 的源码中揭示了在特定情况下会隐含地调用加锁操作来保护数据块安全，所以有的时候通过 channel 传输/转交数据未必是真的无锁。

有兴趣可以查阅 Golang 源码有关 chansend.c 的部分。

这方面，针对讨论 channel 的 concurrent 编程的文章很多，所以我的重心并非讨论它，只做上面的表述就够了。



### 使用交换（swap）模式

在很多时候是必须使用 Mutex 的。例如你需要并发安全的 map 的时候，是不是就要加上一颗读写锁？然后代码就好像这样：

```go
type SharedMap struct {
  m map[string]any
  rw sync.RWMutex
}

func (s *SharedMap) Get(key string) (val any) {
  s.rw.Lock()
  defer s.rw.Unlock()
  return s.m[key]
}

// ...
```

然而真实的业务开发中，往往会有复杂的逻辑。例如下面的函数片段：

```go
func (s *streamBufS) WriteRune(r rune) (n int, err error) {
	s.rw.Lock()
	defer s.rw.Unlock()

	// Compare as uint32 to correctly handle negative runes.
	if uint32(r) < utf8.RuneSelf {
		err = s.writeByte(byte(r))
		return 1, err
	}

	s.lastRead = opInvalid
	m, ok := s.tryGrowByReslice(utf8.UTFMax)
	if !ok {
		m = s.grow(utf8.UTFMax)
	}
	s.buf = utf8.AppendRune(s.buf[:m], r)
	return len(s.buf) - m, nil
}
```

这个片段展示了某种可能的复杂的情景。它功能正常，唯一的问题是 WriteRune 的整体全都处于锁定之中，你也几乎没有办法优化它，读写锁在这里只能以最沉重的方式（写锁定）完全锁住 streamBufS 实体。

在某个应用场景中我们要求必须对 WriteRune 进行优化，降低其锁定粒度和强度。怎么办呢？这就需要 swap 模式了。

说到底，swap 模式的核心思想就是首先在一个副本上完成修改，然后将副本替换（swap）回来。由于替换一个指针或者 swap 一块内存往往只是一条机器指令就能完成的任务，所以加锁的需求就只在这一条指令上，这就将粒度最小化了。

回到上面的函数而言，示意性的改写如下：

```go
func (s *streamBufS) WriteRune(r rune) (n int, err error) {
	// Compare as uint32 to correctly handle negative runes.
	if uint32(r) < utf8.RuneSelf {
		err = s.WriteByte(byte(r)) // =locked writeByte
		return 1, err
	}

  s2 = s.clone()
	m, ok := s2.tryGrowByReslice(utf8.UTFMax)
	if !ok {
		m = s2.grow(utf8.UTFMax)
	}
	s2.buf = utf8.AppendRune(s2.buf[:m], r)
  n := len(s2.buf) - m
  
	s.rw.Lock()
	defer s.rw.Unlock()
  
  copy(s.buf, s2.buf)
  s.lastRead = opInvalid
	return
}

func (s *streamBufS) clone() *streamBufS {
	s.rw.RLock()
	defer s.rw.RUnlock()
  ns := &streamBufS {
    off:      s.off,
    lastRead: s.lastRead,
    split:    s.split,
  }
  copy(ns.buf, s.buf)
  return ns
}
```

改写的代码中，s2 是 s 的一个副本，它（`clone()`）会要求一次 RLock，但这自然是远远轻于 Lock 的。最为耗时的 tryGrowByReslice 和 grow 都在 s2 上以不加锁的方式进行。真正需要 Lock 的被减少到 line17～19 这两行。其中 copy() 是 Golang 的内部函数，它的具体实现可以是 repnz movsd 这样的单条 CPU 指令，本身是高效的并自带锁定性。 然后下一行是轻量的赋值语句，只占用单个 CPU 时钟周期。所以这三行的重度锁定的代价极低。

在 C++ 中使用 swap 模式的例子可以更清晰：

```c++
void append(T&& el, std::function<bool precond(T&&)> cb) {
  std::list<T> cache;
  {
    rlock _l(&this->rwl);   // read lock to this->data
    cache.swap(this->data);
  }
  
  // assume this is a heavy operation
  if (cb(el))
    cache.push_back(el);
  
  {
    wlock _l(&this->rwl);   // write lock to this->data
    this->data.swap(cache);
  }
}
```

这段代码仅作示例，不算太严谨（line 5 是存在问题的），但足以展示 swap 模式的特点：在一个副本上完成操作任务，然后替换回到数据本体（`this->data`），那么加锁面积就最小化了。



### 将锁定精简化、轻量化：RWMutex，atomic+CAS

这一条倒是没什么可说的。

无非是传统上使用 Mutex 来保护数据。但如果是典型的生产者-消费者模型，那么使用读写锁 RWMutex 能够更轻量，尤其对于多消费者读的场景，读写锁的读锁定代价轻量的多，划算的多。而进一步，如果能够使用原子操作的话，比读写锁就更轻量。

原子操作又是构成 CAS 的基石。最初（80286时代）原子操作只能被表现为 lock inc（即加锁的 i++），奔腾 CPU（？待查待确认，但大体上可能没记错吧）之后才有了（CompareAndSwap，CAS）的机器指令形式。所以 CAS 听起来多高大上的，本质上也就是单条机器指令加上锁定地址总线的体现。进一步地，操作系统原理教材中的各种各样的锁，都要变相地表现为指令流水线、CPU 片上缓存、地址总线锁的某种恰当的组合。只不过这个东西就不是本文（乃至于本系列）所能够展开的了。

另外，对于复杂的数据体来说，原子操作应该是不够用的，我们还是必须要用到 Mutex 的各种形式。







## 后记

放飞自我时间到！

还是不要飞这一次。



### REFs

完全是个人经验，所以连命名也都是自己命的，也就没什么外部参考了。

或者，也可能是有的，但我都说了，冷的手脚都僵了不是，就不找了。

另外本文中内容同样地没有做代码层面的严格测试，不妨将它们当作是伪码，不要挑剔我的示例代码不太对，因为我确实只是思想去到了那么远，手嘛，太冻了，就没有去到 Goland 那边了。



🔚