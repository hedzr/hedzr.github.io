---
layout: single
title: '容易定制的 deepcopy 反射库 evendeep'
date: 2022-04-17 05:00:00 +0800
last_modified_at: 2022-05-01 15:05:00 +0800
Author: hedzr
tags: [golang, deepcopy, reflect]
categories: golang reflect
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220501131135531.png
  overlay_image: /assets/images/unsplash-image-3.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  evendeep 提供 deep 系列工具: deepcopy, deepdiff 以及 deepequal ...
---

## evendeep

实际上，我想要实现一个 deepcopy 库很久了，很多年了，大约 15 年的时候就渴望手中有这个武器，但是那时候我自己对 reflect 都还没弄明白，写的时候就非常的磕磕绊绊，也就放下了。

后来有一些可堪使用的 deepcopy 库了，就更是放下了。

尽管没有一个已有的能够满足我实践中的要求，但是那又何妨呢，日子还不是要照样过不是吗？

后来写 blog 就把反射有关的知识整理了一下：

- [Golang Reflect 系列一 - 和 deepcopy 有关的](https://hedzr.com/golang/reflect/golang-reflect-1/)

- [Golang Reflect 系列二 - 和 Map 操作有关的](https://hedzr.com/golang/reflect/golang-reflect-2/)

当然不是要写一份全面总结，只是针对个人需要而日记罢了。

但这个念头（实现满足自己需要的 deepcopy 库）就挥之不去了。直到上上月初，偶然开启了一个新目录，随手建立了一些骨架后，这项工作终于被不知不觉地开始了执行，然而时间有限，于是就时不时地写一点，搁置几天，回头来又花时间厘清思路，找回状态，又写一点，间或遇到麻烦，动了一点点代码结果到处飘红。

总之一言难尽的吧。



### 苦力活

evendeep 是个苦力活，因为必须设法去处理全部可能的类型。做到现在，我们基本上可以说办到了，大部分类型都可以被恰当地处理。也就是说基本类型及其复合类型，是可以被处理的，而特殊的类型如 chan，Mutex 等标配或预制类型则能够被恰当地掠过。

在这方面，evendeep 就不像有的三方库，它们要么说我只处理 struct 的 deepcopy，要么什么也不说，等你送个带 chan 的结构进去就 panic 了。这时候，我就很无语，而且还很恼怒，可惜仅此而已了，难不成顺着网线找到对方 ￥%& 他一次。

所以这也是我必须要做一个 deepcopy 的原因。

除此之外，我们不但支持 deepcopy，还同时支持 deepdiff 和 deepequal，这是为了让你不必分别 import，而且即使你可以，也要面对不同的三方库风格、态度各不相同的问题，我们所提供的 deep-series 在处理思路，编程接口等各方面都具备统一性——这当然是我的一贯的建设方式。

值得一提的是，deepdiff 的算法实现，很大层面上照搬了 [d4l3k/messagediff](https://github.com/d4l3k/messagediff) 的思路。至于为什么不直接 PR，一是他家这两年没什么 activities 了，其二是 messagediff 有自己的一套编程接口，PR 的话不免会令旧用户被打断。最后再加上我仍有一些其它的特性需要支持，例如我们的 DeepDiff 是允许你以忽略下标顺序的方式比较 slice 的。

### DeepCopy 特色

evendeep 提供两个主要的包级函数让你直接开始，一是 DeepCopy，二是 MakeClone。

它们有着不同的场景面向。如果你是在做真正的 deepcopy，有一个确定的 target，那么就应该使用 DeepCopy，否则的话，尤其是当你想获得一个 clone 新副本时，就可以使用 MakeClone。

#### DeepCopy 的用法

是这样的：

```go
func TestDeepCopy(t *testing.T) {
	type AA struct {
		A bool
		B int32
		C string
	}
	type BB struct {
		A int
		B int16
		C *string
	}

	var aa = AA{A: true, B: 16, C: helloString}
	var bb BB
	var ret typ.Any = evendeep.DeepCopy(aa, &bb,
		evendeep.WithIgnoreNames("Shit", "Memo", "Name"))
	t.Logf("ret = %v", ret)
	// ret = &{0 16 &"hello"}
	if *bb.C != helloString {
		t.FailNow()
	}
}
```

ret 返回值是 `interface{}`，为了在将来能够适应于 1.18+，我们定义了 `typ.Any` 作为 `any` 的别名。

`DeepCopy` 要求第二个参数，也就 target，必须以指针方式提供，也就是说你总是应该去地址。这样从 aa 提取的值才能写入到 bb 中。通常来说，你可以自由地反复取地址，因为 evendeep 的内部会首先脱掉指针的包裹，无论它有多少层。

![image-20220501131135531](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220501131135531.png)

你可以给 `DeepCopy`  提供额外的 WithXXX 选项，这是标准的 Options 模式，好像我以前不记得在哪篇 post 中曾经单独描述过。



#### MakeClone 的用法

而 MakeClone 带有不同的接口：

```go
func TestMakeClone(t *testing.T) {
	type AA struct {
		A bool
		B int32
		C string
	}

	var aa = AA{A: true, B: 16, C: helloString}
	var ret typ.Any = evendeep.MakeClone(aa)
	var aaCopy = ret.(AA)
	t.Logf("ret = %v", aaCopy)
	// ret = {true 16 hello}
}
```

由于 MakeClone 语义的原因，它没有任何可选项，你只能得到一个原样照搬的副本。

如果你的结构实现了 Cloneable 接口，它将被用到：

```go
// Cloneable interface represents a cloneable object that supports Clone() method.
//
// The native Clone algorithm of a Cloneable object can be adapted into DeepCopier.
type Cloneable interface {
	// Clone return a pointer to copy of source object.
	// But you can return the copy itself with your will.
	Clone() interface{}
}

// DeepCopyable interface represents a cloneable object that supports DeepCopy() method.
//
// The native DeepCopy algorithm of a DeepCopyable object can be adapted into DeepCopier.
type DeepCopyable interface {
	DeepCopy() interface{}
}
```

类似的，DeepCopyable 也允许你自己的结构采用你自己的算法。



#### 使用 New()

功能性的类库的标准接口是这样的范式：`lib.New().Do(key-param1, key-param2, opts...)`，或者是 `lib.New(key-param1, key-param2, opts...)`。

如果需要提供关键入参，那么就是 key-param1，key-param2，乃至于更多。然后是任意多的 options 以便向类库的核心结构中灌入工作选项。

使用 `New()` 的方式区别不大：

```go
func TestNew(t *testing.T) {
	type AA struct {
		A bool
		B int32
		C string
	}
	type BB struct {
		A int
		B int16
		C *string
	}

	var aa = AA{A: true, B: 16, C: helloString}
	var bb BB
  var opts []evendeep.Opt
	var ret typ.Any = evendeep.New(opts...).CopyTo(aa, &bb,
		evendeep.WithIgnoreNames("Shit", "Memo", "Name"))
	t.Logf("ret = %v", ret)
	// ret = &{0 16 &"hello"}
	if *bb.C != helloString {
		t.FailNow()
	}
}
```

在这里，New(opts...) 和 CopyTo(from, to, opts...) 都接受 opts 的传入，你可以任意选择。

`New` 和 `DeepCopy` 的区别在于，`DeepCopy` 使用一个全局预置的变量 `DefaultCopyController.CopyTo()` 来调用核心逻辑，所以 opts 在 `DefaultCopyController` 中可能会产生叠加效应。而使用 `New` 总是获取一个新的 copier，你不必担心反复调用时潜在的 opts 叠加问题。



#### 支持的特性

evendeep 支持这些特性：

- 结构，map，slice，array，标量等的任意相互拷贝
- 对于非数值类型，例如 chan，将会安全地忽略
- 不会进入 go 标准库对象的私有结构中（除非你进行了特别的定制）
- 允许用户类型的私有成员的拷贝
- 识别循环引用问题
- 全可定制特性：
  - Value/Type 自定义 Converter 或者 Copier
  - NameConvertRule
  - 结构 Tag 指引的不同策略
  - global source extractor
  - global target setter
- 两种遍历机制：按下标顺序，按名字对应方式
  - 在 ByName 策略下，NameConvertRule 可以提供名字映射能力，适合于 ORM 场景
- 充分预制的拷贝和合并策略
- slice 和 map 默认时启用 merge 机制
- 同名的 member function 作为源，或者目的地
- 全局的 StringMarshaller 定义，允许在 deepcopy 时序列化到 json/yaml 等等







#### 不支持泛型

evendeep 没有支持泛型，因为 go118 泛型根本不是为了泛类型而设计的。吐槽这一点，我已经没有兴趣了。需要解释的是，go 泛型支持在未来也不可能提供语言编码支持，令我们能够在泛泛的类型之间进行 deepcopy，正如它也不可能提供 yaml 或者 json 的泛型编码能力一样。咱们这一领域，包括 [hedzr/cmdr](https://github.com/hedzr/cmdr) 的泛类型配置中心在内，是 go 泛型不可能支持的场景。

所以讲到 cmdr 的实现，我其实最满意的反而是 C++ 版本 [hedzr/cmdr-cxx](https://github.com/hedzr/cmdr-cxx)，在那边借助于 C++17 的能力，我实现了一个非常舒服的泛类型配置中心，可以严密地配合到与CLI 参数解析能力联动。那才是我觉得正常的泛型。

> C# 的泛型能力也充分强，但有点制式化，缺乏灵动性。所以就不鼓吹我的 Cmdr.Core 了。而且另一方面我暂时也没精力去升级 C# 到 5.0，6.0 去。

说到 go 泛型，倒也不是一无是处。如果你在制作一个古典的、单纯的、单一的容器类库，例如 vector 之类，那么 go 泛型还是算好用的。所以，我就把 [hedzr/go-ringbuf](https://github.com/hedzr/go-ringbuf) 升级到 v2 版，这样就能够利用泛型能力从 ringbuffer 的 enqueue/dequeue 操作上消除了 interface{} 装箱拆箱的额外开销。

> 然而也并没有额外获得特别大的性能提升。这是因为 go 泛型本身也带来了少少的额外开销；此外由于语法限制，我们的编码有时候反而要以分外的笨拙方式来做泛型编码，这也会另外带来不必要的代码开销。最后一点是我们的 ringbuf 的性能本已针对 MPMC 场景做了深层优化，go 代码层面上的优化或损失并不是重点。

最最关键的一个原因，我们的设计目标就是要用反射啊，deepcopy 的功能只能借助 reflect 来做，所以泛型就是多此一举了。

路线图中暂时也不会包含提供类型泛型支持。



#### 使用 WithXXX 选项

已经有一组预定义的选项可以简化或/和控制 evendeep deepcopy 的行为。完整的列表以及功用请查阅代码自动完成列表以及 godoc 文档。在这里我们会拣选少少予以展示。

例如 `WithIgnoreNames(names...)` 可以提供字段名通配符列表对源进行筛选，这在进行 struct/map 的拷贝时会有用。如果你需要精细的控制，一个方法是在 struct tag 中进行定义，后续的小节中会就此进行提示。

以前文的例子稍作变化：

```go
func TestWithIgnoreNames(t *testing.T) {
	type AA struct {
		A bool
		B int32
		C string
		D string
	}
	type BB struct {
		A int
		B int16
		C *string
	}

	var aa = AA{A: true, B: 16, C: helloString, D: worldString}
	var bb BB
	var ret typ.Any = evendeep.DeepCopy(aa, &bb,
		evendeep.WithIgnoreNames("C*"),
		evendeep.WithSyncAdvancing(false),
		evendeep.WithByOrdinalStrategyOpt,
	)
	t.Logf("ret = %v, .C = %v", ret, *bb.C)
	// ret = &{0 16 &"world"}
	if *bb.C != worldString {
		t.FailNow()
	}

	var cc BB
	ret = evendeep.DeepCopy(aa, &cc,
		evendeep.WithIgnoreNames("C*"),
		evendeep.WithSyncAdvancing(true),
		evendeep.WithByOrdinalStrategyOpt,
	)
	t.Logf("ret = %v, .C = %v", ret, *cc.C)
	// ret = &{0 16 &""}
	if *cc.C != "" {
		t.FailNow()
	}
}
```

`evendeep.WithByOrdinalStrategyOpt` 是默认的，但是为了避免 opts 叠加带来的边际效应，这里显式宣告来保证遍历模式。

`evendeep.WithSyncAdvancing(false)` 是默认的，这种方式下，当源的字段被判定忽略之后，相应的目标字段不会向后推进。在示例中，这等效于目标字段的指针保持在 "C"，所以下一个源字段 “D” 被处理为复制到目标的 "C"。

反之，`evendeep.WithSyncAdvancing(true)` 要求源和目标的字段同步推进，所以源的 “D” 字段没有对应的目标字段进行复制，而目标的“C”字段由于被忽略的原因，所以保持空字符串状态。

`evendeep.WithIgnoreNames("C*")` 指明所有的 C 开头的源字段名都将被忽略。通配符匹配的算法是标准的文件名通配符模型，至少支持这样的模式：

```go
output := IsWildMatch("aa", "aa")
expectTrue(t, output)

output = IsWildMatch("aaaa", "*")
expectTrue(t, output)

output = IsWildMatch("ab", "a?")
expectTrue(t, output)

output = IsWildMatch("adceb", "*a*b")
expectTrue(t, output)

output = IsWildMatch("aa", "a")
expectFalse(t, output)

output = IsWildMatch("mississippi", "m??*ss*?i*pi")
expectFalse(t, output)

output = IsWildMatch("acdcb", "a*c?b")
expectFalse(t, output)
```



#### 自定义源字段的 Extractor

可以指定一个全局的 Source Field Extractor 选项，当核心逻辑在遍历字段时会尝试使用这个 extractor 来抽取源值。

由于这一功能依赖于你有明确的字段名列表，所以当 extractor 被显式指明时，核心逻辑会采用以目标结构的字段名为导向的方式来做遍历。这样才能有适当的字段名称供给 extractor 用以抽取源值。

反之，正常情况下核心逻辑是以源结构的字段名列表（或者下标顺序）为导向，据此寻找正确的目标字段名并完成复制（或合并）的。

利用 Extractor，我们可以从特殊的数据源中收集和复制数据。下面的例子展示了我们如何从 `context.Context` 抽出上下文敏感的 Value 值：

```go
func TestStructWithSourceExtractor(t *testing.T) {
	c := context.WithValue(context.TODO(), "Data", map[string]typ.Any{
		"A": 12,
	})

	tgt := struct {
		A int
	}{}

	evendeep.DeepCopy(c, &tgt, evendeep.WithSourceValueExtractor(func(name string) typ.Any {
		if m, ok := c.Value("Data").(map[string]typ.Any); ok {
			return m[name]
		}
		return nil
	}))

	if tgt.A != 12 {
		t.FailNow()
	}
}
```

这种方式需要目标是一个 struct 或者 map，因为只有如此才能拿到目标字段名列表，甚至于对于空 map 的目标来说，次功能也无法有效工作。



#### 自定义 Target Setter

和 Source Field Extractor 相对应的是 Target Field Setter。

下面的示例展示了不同的手法来进行名称转换（而不是使用 NameConvertRule 方式）：

```go
func TestStructWithTargetSetter(t *testing.T) {
	type srcS struct {
		A int
		B bool
		C string
	}

	src := &srcS{
		A: 5,
		B: true,
		C: "helloString",
	}
	tgt := map[string]typ.Any{
		"Z": "str",
	}

	err := evendeep.New().CopyTo(src, &tgt,
		evendeep.WithTargetValueSetter(func(value *reflect.Value, sourceNames ...string) (err error) {
			if value != nil {
				name := "Mo" + strings.Join(sourceNames, ".")
				tgt[name] = value.Interface()
			}
			return // ErrShouldFallback to call the evendeep standard processing
		}),
	)

	if err != nil || tgt["MoA"] != 5 || tgt["MoB"] != true || tgt["MoC"] != "helloString" || tgt["Z"] != "str" {
		t.Errorf("err: %v, tgt: %v", err, tgt)
		t.FailNow()
	}
}
```

基于相同的理由，Field Setter 只在 struct 和 map 之间（笛卡尔积）有意义。

如果你需要精细的控制，那么还是应该通过 Struct Tag 中的 NameConvertRule 来达到目的。

如果你想要的是针对特定类型的定制算法的是，另一种可能的途径是 ValueConverter 和 ValueCopier。



#### 自定义一个 Converter

面对特定的源类型和目标类型，evendeep 允许你实现定制的 ValueConverter 或/和 ValueCopier 来控制相应的行为。

```go
// ValueConverter _
type ValueConverter interface {
	Transform(ctx *ValueConverterContext, source reflect.Value, targetType reflect.Type) (target reflect.Value, err error)
	Match(params *Params, source, target reflect.Type) (ctx *ValueConverterContext, yes bool)
}

// ValueCopier _
type ValueCopier interface {
	CopyTo(ctx *ValueConverterContext, source, target reflect.Value) (err error)
	Match(params *Params, source, target reflect.Type) (ctx *ValueConverterContext, yes bool)
}
```

`ValueConverter` 支持从 source 克隆一个新的 target 实例，而 `ValueCopier` 支持从 source 复制内容到现存的 target 实例。所以通常我们在具体实现时是两者一并做到：可以在 CopyTo 的代码中调用 Transform 的逻辑来简化你的 Converter 代码。

这两种接口分别适合于 MakeClone 和 DeepCopy 的场景，但在核心逻辑里两种接口都会被查阅和应用。

以一个实例来说话：

```go
type MyType struct {
	I int
}

type MyTypeToStringConverter struct{}

// Uncomment this line if you wanna implment a ValueCopier implementation too: 
// func (c *MyTypeToStringConverter) CopyTo(ctx *eventdeep.ValueConverterContext, source, target reflect.Value) (err error) { return }

func (c *MyTypeToStringConverter) Transform(ctx *eventdeep.ValueConverterContext, source reflect.Value, targetType reflect.Type) (target reflect.Value, err error) {
	if source.IsValid() && targetType.Kind() == reflect.String {
		var str string
		if str, err = eventdeep.FallbackToBuiltinStringMarshalling(source); err == nil {
			target = reflect.ValueOf(str)
		}
	}
	return
}

func (c *MyTypeToStringConverter) Match(params *eventdeep.Params, source, target reflect.Type) (ctx *eventdeep.ValueConverterContext, yes bool) {
	sn, sp := source.Name(), source.PkgPath()
	sk, tk := source.Kind(), target.Kind()
	if yes = sk == reflect.Struct && tk == reflect.String &&
		sn == "MyType" && sp == "github.com/hedzr/eventdeep_test"; yes {
		ctx = &eventdeep.ValueConverterContext{Params: params}
	}
	return
}

func TestExample2(t *testing.T) {
	var myData = MyType{I: 9}
	var dst string
	eventdeep.DeepCopy(myData, &dst, eventdeep.WithValueConverters(&MyTypeToStringConverter{}))
	if dst != `{
  "I": 9
}` {
		t.Fatalf("bad, got %v", dst)
	}
}
```

`Match` 函数决定了什么类型将被 `MyTypeToStringConverter` 所解释，在示例中实现的是从 MyType 到 string 复制时的定制算法。编码完成后的 `MyTypeToStringConverter` 需要使用 `WithValueConverters` 来启用。相应地，如果你实现的是 `ValueCopier`，那么就使用 `WithValueCopiers`。

如果你想将自己的 Converter 持久化登记，那就使用  `RegisterDefaultConverters` / `RegisterDefaultCopiers`。它们会登记到 evendeep 的全局注册表，并在任何 CopyTo 时被引用，而无需在每次调用 CopyTo 的时候显示调用 `WithValueConverters` / `WithValueCopiers` 。

```go
  // a stub call for coverage
	eventdeep.RegisterDefaultCopiers()

	var dst1 string
	eventdeep.RegisterDefaultConverters(&MyTypeToStringConverter{})
	eventdeep.DeepCopy(myData, &dst1)
	if dst1 != `{
  "I": 9
}` {
		t.Fatalf("bad, got %v", dst)
	}
```

Converters 的内部注册表中，内建支持了这些转换器：

- `fromStringConverter`
- `toStringConverter`
- `fromFuncConverter`
- `toDurationConverter`
- `fromDurationConverter`
- `toTimeConverter`
- `fromTimeConverter`
- `fromBytesBufferConverter`
- `fromMapConverter`

理论上说，我们本应该将一切类型都设计并实现为若干的转换器，例如 struct, slice, array 等等。然而确实存在一些理由使得我们采用了双轨制，即一部分是 copy functors 而一部分是 converters。在 copy functors 中我们实现了 deepcopy 的主要核心逻辑，因为在其中包含了我们已知的一些优化，以及一些应该避免的隐患，以及一些捷径。

当然，最初我们实际上是有一个挺完美的架构的。

只不过嘛，写着写着就开始有一些不那么干净的东西混进去了。一开始大家的愿景都是很高竿的，最后可能还是免不了要妥协，又或者是被迫要弄点脏东西。



### 暂停了

写到这里，突然就没什么信心了。

所以关于 deepcopy 的介绍就暂停了，以后有心情的话再做其它特性的介绍吧。不如直接看代码去吧。

但是下面还不得不继续罗嗦一下。



### DeepDiff 和 DeepEqual

这里就从简了，只给出一个测试用例：

```go
delta, equal := evendeep.DeepDiff([]int{3, 0, 9}, []int{9, 3, 0}, diff.WithSliceOrderedComparison(true))
t.Logf("delta: %v", delta) // ""

delta, equal := evendeep.DeepDiff([]int{3, 0}, []int{9, 3, 0}, diff.WithSliceOrderedComparison(true))
t.Logf("delta: %v", delta) // "added: [0] = 9\n"

delta, equal := evendeep.DeepDiff([]int{3, 0}, []int{9, 3, 0})
t.Logf("delta: %v", delta)
// Outputs:
//   added: [2] = <zero>
//   modified: [0] = 9 (int) (Old: 3)
//   modified: [1] = 3 (int) (Old: <zero>)
```

没什么别的特别要说的。毕竟它的用途够简单。

DeepEqual 只是 DeepDiff 的一个包装，去掉了 delta 部分，所以示例也都免了。

就这么草草结束吧。







### 放飞自我

其实我一直在想一个问题，Elon Mask 会不会某一天演变了，不仅是个造车大亨，还是个造火箭大亨，星链大亨，现在更是要演变为媒体舆论工具大亨了，今后是不是就会变成垄断独裁皇帝，某天把他自己放到电脑网络里，造成一个不灭的灵魂，控制这个世界的大多数人。

由于已经半人半机械化了，甚至干脆就完全 NFT 了，所以他就是未来天网的真正起源？

PS:

这篇文章也是放了很长时间，上面谈论 Mask 的言论也随着 Twitter 的最终被收购而变得未可知了起来。

未来什么也说不定。



### REFs

Repository：

- [https://github.com/hedzr/evendeep](https://github.com/hedzr/evendeep)

哦，对了 Again again，evendeep 作为一个 dive-into-anything 库，不再需要一些时日才能放出，现在已经以 pre-release 的方式发布了，先挂个 v0.2 的版本，争取早日固定到 v1 版本。



🔚