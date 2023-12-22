---
layout: single
title: '两个 Golang 无锁编程技法'
date: 2023-12-22 05:00:00 +0800
last_modified_at: 2023-12-22 12:00:00 +0800
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
  这阵子有时候遇到想到 go 协程里面的一些有效技法，就记录一下 ...
---

## 两个有用的无锁编程技法

对于无锁编程来讲，无锁只是一个表象，编程者设法组织 data+processing 的聚焦点在于如果消除 dataracing。而消除 dataracing 而言，古典的并发编程逻辑是采用关键区、排他性锁、读写锁等方式来保护 data 不会因为 processing 而导致错误读或错误写，那么对于无锁编程来说，则是通过消除 data 的共享性，或者消除并发操作 data 等方式来解决问题。

所以最典型的无锁编程技法包含两个技巧：

1. structure 副本（Entry 模式）
2. bumper loop（循环泵模式）

其他的技法都是相似思路的具体衍生。

至于在共享性的 data 上强行消除竞争读写问题的其他无锁方案，例如我曾经编写过 MPMC 的 RingBuffer 工具类库，这些路线则完全依赖于具体的 data 实体并在具体的 CPU 上进行设计，基本上是一种很受限的技法，不具备高层次抽象层面的通用性。尽管其具体的设计思路有迹可循（例如），但却不是最佳的选择：一个优秀的 MPMC RingBuffer，它的致命之处就在于在单核心的 CPU 上，或者单颗 vCPU 的 vHost 上可能是无法降级工作的，或者即使能工作也是低效的或者高消费的。

所以本文讨论的是更通用的，在任何高级语言（无论其线程、协程支持度如何）于任何 Targets 上都可以通行的无锁编程技法。

### Structure 副本

Structure 副本手段是一种经典的无锁编程技法。它的核心思想在于将易变数据一一个 structure 管理，通常可能起名为 Entry，然后在这个 structure 上展开数据处理过程。如此，由于数据处理过程只会操作其所关联到的 structure，因此这一组数据本身就是非共享的，也就无虑 dataracing 的潜在可能性的。

```go
type Worker struct {
  closed int32 // avoid duplicated release rsrc in Close()
  entries []*Entry
}

type Entry struct {
  Count int
  Data []any
}

func (w *Worker) New(data ...any) *Entry {
  e:=&Entry{Data:data}
  w.entries = append(w.entries, e)
  return e
}

func (e *Entry) Run() {
  // processing e.data
}
```

假设初始化数据 data []any 被提供给 Worker，基于此产生一个 Entry，然后通过 Entry.Run 来处理初始化数据，产生结果，那么上面的示例代码就避免了数据包（Count，Data）的共享问题，因为这个数据包是排他性独立的。

有时候我们的数据包很难拆解，此时可以以衍生技法来实现拆解。具体的思路是设法进行分治。即数据包可以按照推进程度重新设计为 step1，step2，等等，每一步骤中的小数据包的计算结果依次提交给下一步骤。又或者数据包可以拆解为若干个小计项目，最后将多个小计结果合并计算。

无论采取哪种拆解思路，总的思路不变，即单个 processing 所操作的 data 是排他性独立的一个副本，从而从根本上去除共享加锁解锁的需求。

#### 问题

问题在于太多的小块内存（Entry struct）可能是不好的。一方面它可能带来额外的内存消耗（如果正在处理一个巨大的链表、数组之类，你不太可能总是制造它们的副本），另一方面，太多频繁的小块内存的分发和析构也会产生难以接受的开销。有时候，强制这样的小块内存在栈上分配（如果语言或者编译器支持）是解决后一问题的良药。不过更多的情况下、或许这的确就是不可行的。

#### 应用

很多 Logger 都会运用到这种方法。

##### logger

包括我没有放出来的 logg/slog 也使用了这种方法。我们的 Logger 接口实际上仅仅是简单的包含了一个 Entry 接口：

```go
type Logger interface {
  Entry
}

type Entry interface {
  // ...
}

type loggerS struct {
  //..
  *entryS
}

type entryS struct {
  //...
  skipFrames int
}

func (s *loggerS) WithExtraSkips(frames int) {
  return newEntry(frames)
}

func newEntry(frames int) *entryS {
  return &entryS{skipFrames:frames}
}
```

这样的好处是，每个 loggerS 上可以随时低代价地建立 entryS 副本，用以包装特定数据（例如需要额外摘除几个栈帧）。

##### Trie

除了 logger 和 sublogger 之外，很多场景都可以广泛地运用 Entry 模式。例如我这边有一份 Trie tree 实现，也用到了类似的手法。

```go
type trieS struct {
  root *nodeS
}

type nodeS struct {
  fullPath string
  matchedKey string
  // ...
}

type prefixedTrie struct {
  *trieS
  prefix string
}

func (s *trieS) newTrie(prefix string) *prefixedTrie {
  return &prefixedTrie{s,prefix}
}
```

其中一个用法是 prefixedTrie，它在原样照搬 trieS 极其操作接口的同时，引入了额外的前缀字段。其用途在于可以在一个给定的前缀路径下操作子树的键。

所以说 Entry 模式可以说是到处都有在用，用途也不一定限于为了无锁。然而凡是运用到该模式的地方，自动获得了无锁的收益，这其实是很划算的。

在 C++ 中使用同样的模型模式就可能会得不到足够的收益了，因为 C++er 可能连这个 new entry 所消耗的小块内存也想优化掉。





### Bumper Loop

循环泵模式有时候是一种 design pattern。

它的核心思想是将并行事件强行序列化，然后再一一分发给具体处理程序。于是对于这些具体处理程序来讲，共享数据总是排他性的：因为所有处理程序在同一时间下只会运行一个。

如果具体处理程序总是飞快地完成，没有阻塞的忧虑，那么循环泵模式将会是一个非常好的消费模式。

```go
func (w *Worker) runLoop() {
  for {
    switch{
      case ev:=<-fileWatcherCh:
        onFileChanged(ev)
    }
  }
}
```

对于低频事件的分发和简化并在此同时去除加锁需求、提升性能来说，循环泵模式是一时之选。在诸如 TCP/IP 服务器的 incoming data 处理上通常循环泵是最佳选择：对新进连接请求采取 Entry 模式制作一个独立的处理器 connectionProcessor，该处理器中以循环泵模式接受输入数据，识别输入数据的模式为规约命令，然后分发给具体的规约命令处理器。

#### 问题

其问题在于，一个阻塞会破坏整个循环，一个过慢的处理会带来不可知的下一事件的处理延迟，高频率的事件会在分发点上阻塞、堆积，甚至是丢失。

#### 应用

尽管 Bumper Loop 似乎很明显地有串行化的效率劣势，但它仍被广泛地用于 TCP/IP server/client 编程中。例如一个 tcp server 在接受 client 请求建立了新连接之后，新连接对象 connS 就会启动一个 go rountine 开始跑循环泵：

```go
func (s *serverWrap) makeListener() (err error) {
	if s.l == nil {
		addr := net.JoinHostPort(s.host, strconv.Itoa(s.port))
		s.l, err = net.Listen(s.network, addr)
		if err == nil && s.tlsConfig != nil {
			s.l = tls.NewListener(s.l, s.tlsConfig)
		}
		if err == nil {
			l := s.l
			s.closeListener = l.Close
			s.loop = func(ctx context.Context) (err error) {
				// timer := time.NewTicker(10 * time.Second)
				// defer func() {
				// 	timer.Stop()
				// 	s.debug("[tcp][server] runLoop goroutine exited.")
				// }()

				if !s.quiet {
					s.info("Server starts listening", "at", l.Addr())
				}

				for {
					var conn net.Conn
					conn, err = l.Accept()
					if err != nil {
						if dc, db, _ := s.handleListenError(err); dc {
							continue // os.Exit(1)
						} else if db {
							break
						}
					}

					s.debug("[serverWrap] new incoming connection", "remote", conn.RemoteAddr(), "local", conn.LocalAddr())
					if s.onNewResponse == nil {
						go newConn(s, conn).run(ctx)
					} else {
						w := s.onNewResponse.New()
						if r, ok := w.(Runnable); ok {
							go r.Run()
						} else {
							// nothing to do, we assume the OnNewResponse handled New()
							// which have already created a Response writer and run the
							// necessary looper.
						}
					}
				}
				s.debug("[serverWrap] server's listener loop ended.")
				return
			}
		}
	}
	return
}

func newConn(s *serverWrap, conn net.Conn) *connS {
	c := &connS{
		serverWrap:   s,
		conn:         conn,
		tmStart:      time.Now().UTC(),
		writeTimeout: 5 * time.Second,
		chWriteSize:  16,
		wl:           &sync.Mutex{},
	}
	s.connections[c] = true
	return c
}

type connS struct {
	*serverWrap
	conn         net.Conn
  // ...
}

func (s *connS) run(ctx context.Context) {
	//...

	// fallback to default serve routine
	s.serve(ctx, s, s)
}

func (s *connS) serve(ctx context.Context, w Response, r Request) {
	// ...

workingLoop:
	for {
		select {
		case <-ctx.Done():
			s.debug("[connS] looper ended.")
			break workingLoop

		case data := <-s.chWrite:
			if _, err := s.rawWriteNow(data, s.writeTimeout); err != nil {
				s.handleError(err, "[connS] Write failed")
				break workingLoop
			}

		default:
			n, err := r.Read(buf[pos : pos+s.bufferSize])
			if err != nil {
				s.handleReadError(n, err, buf, pos, w, r)
				break workingLoop
			} else if n == 0 {
				time.Sleep(1 * time.Millisecond)
				continue
			}

			nEnd := pos + n
			nRead, err = s.onProcessData(buf[:nEnd], w, r)
			
			if nRead <= 0 {
				s.warn("[connS] data block decode failed, skipped.", "client.addr", w.RemoteAddr(), "client.id", cidHolder.GetClientID(), "data", buf[:nEnd], "err", err)
				pos = s.onCorruptData(buf[:nEnd], w, r)
				// ...
				continue
			}

			if err != nil {
				s.handleError(err, "[connS] onProcessData(buf, wr) failed.", "client.addr", w.RemoteAddr(), "client.id", cidHolder.GetClientID(), "nRead", nRead)
				break workingLoop
			}

			// ...
		}
	}

	s.tmStop = time.Now().UTC()
}
```

这是我没有放出的 go-socketlib 的新版代码的节录。

其中 connS.serve() 就是那么一个循环泵模式的应用，for-select 多路分发几种事件，反复处理，只要单次处理足够快，那么工作就良好。反之，例如如果读取一个数据报文解释处理出错的话，可能循环泵就异常退出了，或者不运作了。

所以优势和劣势都明摆着，就看你怎么解了。



### 两者组合运用

Bumper Loop 的问题之一是不太适合高频事件场景，一般来说事件频率在80ms以上时才比较好用。这种尺度的隐喻是说单次事件处理平均耗时应该小于 80ms。

在不那么严格的场景中（例如非金融高频交易），有时候可以在耗时的事件处理器中启动一个 go rountine 去异步地慢慢处理，而主体的 bumpper loop 则继续去分发后继事件。这时候异步 go rountine 又可以用到 Entry 模式，适当地复制少许状态以便解耦竞态条件。



### 问，高频交易怎么办？

如果你非要问，严格实时的高频交易怎么办。不加锁就竞态，加锁就迟滞，上面的算法似乎不怎么好用的样子。

答案是，这种问题你不该问。

背后的事实是，这样的高频交易是无法简单用几个流行的模式来解决问题的。事实上我们在处理电厂变电所信号时，就是全方面到处动刀。例如设计数据结构和算法需要经过专业调教，使得运算单纯；使用像 PI 数据库这样的工业实时内存数据库来解决数据管理问题和消除数据块在事件处理过程中的无意义的复制；采用小规模的计算节点集群来分散计算压力和容错，等等。

你不该问的原因就是这样，这样的问题的解决方案是一个系统性的问题，没有单一有效的答案。



## 后记

放飞自我时间到！

今次因为年终了，同时又冷的无法生存（夸张），所以也就不飞了。其实有时候是很多看法的，渐渐的却又说话越来越少。有人说这就是城府深的表现，也有人说这是成长，嗯，这个是双商在线的说法，还有人就说这是老的老不死的，那当然就是双商极低罗。



### REFs

这次完全是个人经验，所以连命名也都是自己命的，也就没什么外部参考了。

或者，也可能是有的，但我都说了，冷的手脚都僵了不是，就不找了。





🔚