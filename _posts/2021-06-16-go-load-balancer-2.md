---
layout: single
title: "负载均衡算法之二 - 以 Golang 方式"
date: 2021-06-16 05:00:00 +0800
last_modified_at: 2021-06-16 23:53:00 +0800
Author: hedzr
tags: [load balancer, lb, load balancing, consistent hashing, weighted round-robin, gRPC, web, golang]
categories: golang algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/what-is-load-balancing-diagram-NGINX-1024x518.png
  overlay_image: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/what-is-load-balancing-diagram-NGINX-1024x518.png
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  以前实作 API GW 时的一些收获，现在可以重组这些技术心得为开源物品了，完全的重写 ... 2: 更多的算法与类库整体...
---



## 过门

经过[上一篇](https://hedzr.com/golang/algorithm/go-load-balancer-1)对基本算法的列举之后，我们注意到基本算法的堆叠是个比较重要的特性。此外，怎么样对 factor 做约束也是一个比较重要的特性，因为它可以帮助决定堆叠后的 LB 如何完成第二级选择。



## 建设类库

所以最终，我建立了一个 golang 的 lb 类库：[这里](https://github.com/hedzr/lb)。

其实 lb 类库真的是多的要命了，不过我也有特定的目的（前面、上一篇也都有提到过）：

1. 线程安全
2. 可堆叠的设计
3. 可以对 factor 进行约束

所谓线程安全无外乎解决 go routines data racing 问题。

可堆叠则是指基本算法应该能被堆叠起来，形成复合的定制的 LB 算法。比如说将 wrr 和 random 堆叠起来可以形成加权随机算法；或者为一致性hash增加权重也不是不可能。

对 factor 进行约束是我们的设计目标之一，这是为了让调用者能够传入特定的二级算法的解释器，它将会解释满足了什么样的约束条件之后就可以抽出什么样的结果。它也是为了完整的可堆叠的组成成分之一。

此外，算法是要可扩充的。

最后，由于算法研究是一种非正式的研究行为，所以这次不打算针对高频交易进行优化，因为那样做了之后往往都会面目全非了。尽管如此，由于对每种算法有所选择的原因，所以性能还是很不错的，为免竞争，不做性能测试了。



### 可嵌套的设计

怎么样设计我们的 LB 库，使得基本算法，特别是加权这样的特性能够嵌套在别的基本算法之上，形成复合的 LB 算法呢？

例如加权的随机算法，它和加权的轮询算法确确实实还是有区别的。

基本上来说，嵌套套娃的实作已经涉及到强人工智能的领域，也就是我如何创建我自己的终极命题。所以呢，WTF，我只是胡说在八道，其实其关键就在于让 child interface 包含一个 到 parent interface 的嵌入，从而达到隐含的等同性的目的。我这就是传授了 Golang 中的架构设计之终极大法了哦。

说得有点绕。具体到我们的 LB 设计体系中呢，注意到我们认为你会给 Balancer 添加一堆 Peer(s)，然后在它们上做均衡性计算，计算的依据之一为 Factor 因素，当然，对于轮询和随机这些算法来说并不需要 factor 的参与。所以，当我们想要在 Random Balancer 上叠加 Weighted 算法时，我们需要一个承上启下的 A2B interface，它是 Weighted 算法的 Factor，又是 Random 算法的 Peer，这就解决问题了。

然后在我们的每一个 Next 中会鉴别 next-picked peer 是不是也是一个 BalancerLite，如果是的话就递归进去，从而达到套娃的目的。

比如说，我们的最终 random 算法是这样子的（wrr 中的 Next 也是相似的）：

```go
func (s *randomS) Next(factor lbapi.Factor) (next lbapi.Peer, c lbapi.Constraintenable) {
	next = s.miniNext()
	if fc, ok := factor.(lbapi.FactorComparable); ok {
		next, c, ok = fc.ConstrainedBy(next)
	} else if nested, ok := next.(lbapi.BalancerLite); ok {
		next, c = nested.Next(factor)
	}
	return
}

func (s *randomS) miniNext() (next lbapi.Peer) {
	s.rw.RLock()
	defer s.rw.RUnlock()

	l := int64(len(s.peers))
	ni := atomic.AddInt64(&s.count, inRange(0, l)) % l
	next = s.peers[ni]
	return
}
```

它一方面做了 BalancerLite 类型诊断然后递归到 child.Next，所以当你在 Balancer.Add(peers) 的时候如果添加对是一个 Balancer 耦合的 Peer 对象的话，嵌套堆叠就能够顺利地级联下去。

另一方面，Next 还针对可被约束的 Factor（即 FactorComparable）做一个约束限定操作（即 ConstrainedBy），这个约束限定操作可以被你用于增强的 LB 目的上。

下面就会介绍如何在我们这套 LB 类库上做扩展和定制。



### 额外的算法实现



在这里呢，我们挨个介绍一下两种扩展思路的实例。它们都包含在正式的 LB 库 release 中，一面是做示范，一面是免去你可能的重复编码的无谓浪费——无须担心，实际的生产中各种变态的需求我都有遇到过，你完全不必担心没得代码可写，通用类库怎么也不能替你干完一切事的。



#### 加权随机算法：对 random 做 weighted 堆叠

既然 wrr 能够加权，random 能够随机，那么借助于已经建设好的基础设施我们就可以堆叠两者。

在这个需求里，需要用到 Next 中的这个分支锁提供的能力：

```go
  if nested, ok := next.(lbapi.BalancerLite); ok {
		next, c = nested.Next(factor)
	}
```

我们的实现方法是，制作一个新的 Peer 实现，让它是一个 random lb，并且能够提供一个权重值，因为首先来讲 wrr 需要我们添加给它的都是 WeightedPeer，这就是代码中的 wpPeer struct，它实现了 WBPeer interface。

```go
package wrandom

import (
	"github.com/hedzr/lb/lbapi"
	"github.com/hedzr/lb/wrr"
)

func New(opts ...lbapi.Opt) lbapi.Balancer { return wrr.New(opts...) }

func WithWeightedBalancedPeers(peers ...WBPeer) lbapi.Opt {
	return func(balancer lbapi.Balancer) {
		for _, b := range peers {
			if bp, ok := b.(lbapi.WeightedPeer); ok {
				balancer.Add(bp)
			}
		}
	}
}

func NewPeer(weight int, gen func(opts ...lbapi.Opt) lbapi.Balancer, opts ...lbapi.Opt) WBPeer {
	return &wpPeer{
		weight: weight,
		lb:     gen(opts...),
	}
}

// WBPeer is a weighted, balanced peer.
type WBPeer interface {
	lbapi.WeightedPeer
	lbapi.Balancer
}

type wpPeer struct {
	weight int
	lb     lbapi.Balancer
}

func (w *wpPeer) String() string { return "wpBeer" }

func (w *wpPeer) Weight() int { return w.weight }

func (w *wpPeer) Next(factor lbapi.Factor) (next lbapi.Peer, c lbapi.Constrainable) {
	return w.lb.Next(factor)
}
func (w *wpPeer) Count() int              { return w.lb.Count() }
func (w *wpPeer) Add(peers ...lbapi.Peer) { w.lb.Add(peers...) }
func (w *wpPeer) Remove(peer lbapi.Peer)  { w.lb.Remove(peer) }
func (w *wpPeer) Clear()                  { w.lb.Clear() }

```

按照上一篇中提供的 lbapi 的 interfaces 定义，在示例中我们构造了一个 wbPeer 的 lbapi.Peer 实现。L38 实现了 Peer，L40 帮助实现了 WeightedPeer，而 L42 则完成了 Balancer 的实现。注意到 wpPeer 结构中包含一个 random balancer 的实例 w.lb。

`WithWeightedBalancedPeers(peers ...WBPeer)` 需要一组通过 NewPeer 所创建的 Peer 对象，这些对象最后被 `New` 用来构造一个 wrr LB。

所以我们可以这样使用它：

```go
package wrandom_test

import (
	"github.com/hedzr/lb/lbapi"
	"github.com/hedzr/lb/random"
	"github.com/hedzr/lb/wrandom"
	"testing"
)

type exP string

func (s exP) String() string { return string(s) }

func withPeers(peers ...lbapi.Peer) lbapi.Opt {
	return func(balancer lbapi.Balancer) {
		for _, p := range peers {
			balancer.Add(p)
		}
	}
}

func TestWR1(t *testing.T) {
	peer1, peer2, peer3 := exP("172.16.0.7:3500"), exP("172.16.0.8:3500"), exP("172.16.0.9:3500")
	peer4, peer5 := exP("172.16.0.2:3500"), exP("172.16.0.3:3500")

	lb := wrandom.New(
		wrandom.WithWeightedBalancedPeers(
			wrandom.NewPeer(3, random.New, withPeers(peer1, peer2, peer3)),
			wrandom.NewPeer(2, random.New, withPeers(peer4, peer5)),
		),
	)

	sum := make(map[lbapi.Peer]int)

	for i := 0; i < 5000; i++ {
		p, _ := lb.Next(lbapi.DummyFactor)
		sum[p]++
	}

	// results
	for k, v := range sum {
		t.Logf("%v: %v", k, v)
	}
}
```

当然，这里的代码是为了测试使用的。在业务代码中你可以将上述的一体化初始化语句拆分为多步骤的，在运行时刻对 wpPeer 对象做 Add/Remove 来增减其从属的后端而不是直接加入 peer1, peer2, ..., peer5。

一个参考结果是：

```bash
    wr_test.go:42: 172.16.0.8:3500: 1018
    wr_test.go:42: 172.16.0.3:3500: 1012
    wr_test.go:42: 172.16.0.9:3500: 1026
    wr_test.go:42: 172.16.0.2:3500: 988
    wr_test.go:42: 172.16.0.7:3500: 956
```

5 个后端节点最终*均分*了全部请求，这就是我们想要的结果。

同样的道理，随机算法不必有绝对的均分，允许一定的统计学上的偏差。





#### 加权的版本比较算法：对 factor 做约束

任意组合两种已有的 balancer 算法，上一节已经作出了示范，应该说还算是比较容易实作的吧。

现在来制作一个全新的加权算法 WV。它包含一个 semver 比较器集合，我们认为调用者将会传入一组带有具体版本号的 host+port 集合作为 factor ，WV 要做的就是：

1. 按权重比例抽出某一个 semver 比较器 X
2. 将 factor 传入 X，从而挑选出一个 host+port+version 使得其 version 满足 X 所约束的条件。

我们使用了 "github.com/Masterminds/semver" 来做 semver 相关操作。

##### New

首先需要一个 wrr 及其 peers 的专属构建器：

```go
package version

func New(opts ...lbapi.Opt) lbapi.Balancer { return wrr.New(opts...) }

func WithConstrainedPeers(cs ...lbapi.Constrainable) lbapi.Opt {
	return func(balancer lbapi.Balancer) {
		for _, vp := range cs {
			balancer.Add(vp)
		}
	}
}
```

它看起来平平无奇，除了使用一个 Constrainable 接口的 peer 输入之外。

所以我们将会为 `version.New(version.WithConstrainedPeers(...))` 传入一堆 Constrainable 这样的 peers。回顾一下 Constrainable 的定义，它本身就是满足 Peer 接口的。

##### constrainablePeer

现在来实现这样的特殊 peer：

```go
package version

import (
	"fmt"
	"github.com/Masterminds/semver"
	"github.com/hedzr/lb/lbapi"
)

func NewConstrainablePeer(constraints string, weight int) (peer lbapi.Constrainable) {
	p := &constrainablePeer{
		constraints:    constraints,
		weight:         weight,
		constraintsObj: nil,
	}
	vc, err := semver.NewConstraint(constraints)
	if err == nil {
		p.constraintsObj = vc
		peer = p
	}
	return
}

type constrainablePeer struct {
	constraints    string
	weight         int
	constraintsObj *semver.Constraints
}

func (s *constrainablePeer) String() string                   { return s.constraints }
func (s *constrainablePeer) Weight() int                      { return s.weight }
func (s *constrainablePeer) Constraints() *semver.Constraints { return s.constraintsObj }
func (s *constrainablePeer) CanConstrain(o interface{}) (yes bool) {
	if _, ok := o.(*semver.Version); ok {
		yes = true
	}
	return
}
func (s *constrainablePeer) Check(factor interface{}) (satisfied bool) {
	if s.constraintsObj == nil {
		var err error
		s.constraintsObj, err = semver.NewConstraint(s.constraints)
		if err != nil {
			fmt.Printf("illegal constraints: %q. %v\n", s.constraints, err)
		}
	}

	if v, ok := factor.(*semver.Version); ok {
		satisfied = s.constraintsObj.Check(v)
	} else if v, ok := factor.(interface{ Version() *semver.Version }); ok {
		satisfied = s.constraintsObj.Check(v.Version())
	}
	return
}
```

`constrainablePeer` 的关键之处在于它的 Check 函数，在这里它会试图解开 factor 中包含的 `*semver.Version` 值 V，然后运用约束器 `s.constraintsObj` 来检查 V 是不是满足约束条件。

翻译成直白的话就是：我是版本号 1.3，我是不是 `< 1.3,x` 啊？`constrainablePeer`  就会说，是的。

##### NewConstrainablePeer

为 `constrainablePeer`  准备了一个公开函数 `NewConstrainablePeer`，所以：

```go
var testConstraints = []lbapi.Constrainable{
	version.NewConstrainablePeer("<= 1.1.x", 2),
	version.NewConstrainablePeer("^1.2.x", 4),
	version.NewConstrainablePeer("^2.x", 11),
	version.NewConstrainablePeer("^3.x", 3),
}

	lb := version.New(version.WithConstrainedPeers(testConstraints...))
```

##### TestCase

现在需要的是准备好 factor，然后来做测试：

```go
func initFactors() version.BackendsFactor {
	fa := version.NewBackendsFactor(rr.New)
	fa.AddPeers(
		version.NewBackendFactor("1.1", "172.16.0.6:3500"),
		version.NewBackendFactor("1.3", "172.16.0.7:3500"),
		version.NewBackendFactor("2.0", "172.16.0.8:3500"),
		version.NewBackendFactor("3.13", "172.16.0.9:3500"),
	)
	return fa
}

factor := initFactors()
peer, c := lb.Next(factor)
```

在这里我们略过了 NewBackendsFactor 以及 NewBackendFactor 的大部分实现细节，其中值得特别提及的是 fs 也就是 backendsFactor 的 ConstrainedBy：

```go
func (fa *backendsFactor) ConstrainedBy(constraints interface{}) (peer lbapi.Peer, c lbapi.Constrainable, satisfied bool) {
	if cc, ok := constraints.(lbapi.Constrainable); ok {
		var lb lbapi.Balancer
		
		// for this object cc, build a lb and associate with it
		fa.crw.RLock()
		if _, ok := fa.constraints[cc]; !ok {
			fa.crw.RUnlock()

			lb = fa.generator()
			fa.crw.Lock()
			fa.constraints[cc] = lb
			fa.crw.Unlock()
		} else {
			lb = fa.constraints[cc]
			fa.crw.RUnlock()
			lb.Clear()
		}

		// find all satisfied backends/peers and add them into lb
		for _, f := range fa.backends {
			if cc.Check(f) {
				satisfied = true
				lb.Add(f)
			}
		}

		// now, pick up the next peer of them
		peer, c = lb.Next(lbapi.DummyFactor)
		if c == nil {
			c = cc
		}
	}
	return
}
```

一般地讲，在这里 fa.generator 应该是一个 `rr.New`（通过 `fa := version.NewBackendsFactor(rr.New)`），也即 lb 会被创建为一个轮询算法的 LB，或者别的亦可。然后全部满足约束条件（通过 Check）的后端将被当作是一个 peers 集合让 lb 进行选择。

感兴趣的朋友可以去到源码查阅。

出于代码逻辑清晰的缘故，上面采用了代价较高的运算，也就是每次都对全部 fa.backends 做一次 Check 比较。可想而知对于大规模的后端它不是好的方式。以后将会在此增加 cache 并做增量式添加删除，以便尽可能地消除 Check all。



##### 小小结

有何用意？这个加权的版本范围比较算法，其实是我以前做 api gw 时的一个念头，其目的在于做到整个自研框架的灰度上线测试。

当然，作为一个完整的框架要达成灰度上线目标，需要的是全方位的适配。至少会包含这些：

1. 可以按照版本范围的约束表达式来进行权重分配
2. 能够透明地完成 incoming requests 的 dispatch
3. 利用 cmdr 锁提供的配置文件自动监控、自动载入和合并、自动触发变更机制，以便在 microservice 在线的状态下实时地调整权重分配设定
4. 如果没有配置文件合并能力，则需要考虑采用诸如 redis 缓存的配置项等手段来保证实时权重分配。
5. 需要能够综合多种负载均衡算法，特别是正确地抽取请求上下文中的 Properties 来完成分发决策

所以，真正全功能的 API GW，已知的能开箱即用的大概还没有，能够通过代码调整来适配的可能都有限，或者是需要在系统的各种角落做不知名的 hack 才行。



### 最后



最后，把所有的 LB 算法收归到上一级 package 中，我们用一个 map，这个 map 配备了一颗 RWMutex 来防止你会在多线程的环境中使用它。但是实际上我们认为你应该事先建立一个 lb 的实例，之后动态地 add/remove 它的 peers 就好了，此外，我们也认为你应该是在 app 一开始的时候就已经注册了自行定制的 balancer 算法及其 generator 的——也就是说，其实这颗锁意思有限。

好，在上一级的总领中，代码片段是这样：

```go
func New(algorithm string, opts ...lbapi.Opt) lbapi.Balancer {
	kbs.RLock()
	defer kbs.RUnlock()
	if g, ok := knownBalancers[algorithm]; ok {
		return g(opts...)
	}
	log.Fatalf("unknown/unregistered balancer and generator: %q", algorithm)
	return nil // unreachable
}

// WithPeers adds the initial peers.
func WithPeers(peers ...lbapi.Peer) lbapi.Opt {
	return func(balancer lbapi.Balancer) {
		for _, p := range peers {
			balancer.Add(p)
		}
	}
}

// Register assign a (algorithm, generator) pair.
func Register(algorithm string, generator func(opts ...lbapi.Opt) lbapi.Balancer) {
	kbs.Lock()
	defer kbs.Unlock()
	knownBalancers[algorithm] = generator
}

// Unregister revoke a (algorithm, generator) pair.
func Unregister(algorithm string) {
	kbs.Lock()
	defer kbs.Unlock()
	delete(knownBalancers, algorithm)
}

const (
	// Random algorithm
	Random = "random"
	// RoundRobin algorithm
	RoundRobin = "round-robin"
	// WeightedRoundRobin algorithm
	WeightedRoundRobin = "weighted-round-robin"
	// ConsistentHash algorithm
	ConsistentHash = "consistent-hash"
	// WeightedRandom algorithm
	WeightedRandom = "weighted-random"
	// VersioningWRR algorithm
	VersioningWRR = "versioning-wrr"
)

func init() {
	kbs.Lock()
	defer kbs.Unlock()

	knownBalancers = make(map[string]func(opts ...lbapi.Opt) lbapi.Balancer)

	knownBalancers[Random] = random.New
	knownBalancers[RoundRobin] = rr.New
	knownBalancers[WeightedRoundRobin] = wrr.New
	knownBalancers[ConsistentHash] = hash.New

	knownBalancers[WeightedRandom] = wrandom.New

	knownBalancers[VersioningWRR] = version.New
}

var knownBalancers map[string]func(opts ...lbapi.Opt) lbapi.Balancer
var kbs sync.RWMutex
```

#### 用法

这个类库允许你 register 自己的 lb 算法进去，目的在于让调用者能够有更统一的界面。至于使用某个 lb 算法是很简单的：

```go
package main

import (
	"fmt"
	lb "github.com/hedzr/lb"
	"github.com/hedzr/lb/lbapi"
)

func main() {
	b := lb.New(lb.RoundRobin)

	b.Add(exP("172.16.0.7:3500"), exP("172.16.0.8:3500"), exP("172.16.0.9:3500"))
	sum := make(map[lbapi.Peer]int)
	for i := 0; i < 300; i++ {
		p, _ := b.Next(lbapi.DummyFactor)
		sum[p]++
	}
	
	for k, v := range sum {
		fmt.Printf("%v: %v\n", k, v)
	}
}

type exP string

func (s exP) String() string { return string(s) }
```

根据你的实际场景，你需要自己的 exP 实现（它需要实现 `lbapi.Peer`），但为了便利于你的使用，一个 Peer 只需要实现了 String() string 接口就够了。





## 结束

所以，在这次放出的 LB 类库中，我们提供了一堆基本算法以及复合算法：

1. 随机
2. 轮询
3. ~~最少连接数~~
4. hashing
5. 加权轮询
6. 加权随机
7. 加权的版本范围比较

而且，我们认为已经提供了充足的基础设施以便利于你在一个 unified 的框架下面拓展负载均衡算法达成你的实际需要。

> 话说昨天刷 github，发现 profile page 大变样了，有 explore，trending 之类的 pages。今天现在去看又恢复老样子了。我难不成是幻觉了，还是说是昨晚想着这第二篇该怎么写就睡着了在 dreaming？



:end: