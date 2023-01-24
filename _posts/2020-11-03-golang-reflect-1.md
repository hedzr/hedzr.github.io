---
layout: single
title: 'Golang Reflect 系列一 - 和 deepcopy 有关的'
date: 2020-11-03 10:08:00 +0800
last_modified_at: 2020-11-05 15:01:00 +0800
Author: hedzr
tags: [reflect, deepcopy, clone, golang]
categories: golang reflect
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-11.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Golang 反射之一，deepcopy相关的内容...
---

> **May 2H22** 补记: 时隔一年半，终于还是造了一个 deepcopy 类：
>
> 1. [容易定制的 deepcopy 反射库 evendeep](https://hedzr.com/golang/reflect/deepcopy-with-go-reflect/)
>
> 2. 和 [https://github.com/hedzr/evendeep](https://github.com/hedzr/evendeep)
>
> 算是对历年来对反射情有独钟的一种交待吧。



> 本阶段讨论反射共两篇：
>
> 1. [Golang Reflect 系列一 - 和 deepcopy 有关的](https://hedzr.com/golang/reflect/golang-reflect-1/)
> 2. [Golang Reflect 系列二 - 和 Map 操作有关的](https://hedzr.com/golang/reflect/golang-reflect-2/)



近期在考虑 deepcopy 功能，所以有下面的一些收集与思考。



## 和 deepcopy 有关的





### 对结构赋值

#### 基本方法

ValueOf 一个 struct 对象后，你是无法对其设置成员值的，原因在于这是一个只读性质的结构对象（unaddressable）。

要想对一个结构进行成员赋值，你需要使用结构的指针：

```go
user := User{Name:"abd"}
vou := reflect.ValueOf(user)
fld := vou.FieldByName("Name")
fld.SetString("sss") // 将会失败

vou = reflect.ValueOf(&user)
	if vou.Kind() == reflect.Ptr {
		vou = vou.Elem()
	}
fld = vou.FieldByName("Name")
fld.SetString("sss") // 正确的方法
```

Line 6 取得一个指向结构对象的指针的 reflect.Value 构造体，然后检查和确认其 reflect.Ptr Kind，并在 Line 8 进一步取得通过该指针所指向的结构体本身，注意现在 vou 就是一个结构成员可写的 Value 构造体了。

所以 Line10 和 11 将能够顺利地通过结构体的成员反射对象 fld 对其进行赋值。



#### 反射法则3

这也是所谓的**反射法则3**:

**To modify a reflection object, the value must be settable.**

对于一个结构来说，非指针的 receiver 是无法修改结构本身的：

```go
type User struct{ Name string }
func (u User) SetName(name string) { u.Name = name }
```

在这里，`User.SetName(name)` 无法达成你的原有目的。

正确的 SetName 应该是这样：

```go
func (u *User) SetName(n string) { u.Name = n }
```

很多人觉得 go 坑多，此言甚善。但是反过来看，其实也是因为大家将自己已经习惯的 C++、Java 的 class，struct 等概念代入了 golang 之中，这当是舒适区之外的愤慨，就很缹。

> 所谓的反射三法则，源于  [The Laws of Reflection - The Go Blog](https://blog.golang.org/laws-of-reflection) 一文，总论如下：
>
> - Reflection goes from interface value to reflection object.
> - Reflection goes from reflection object to interface value.
> - To modify a reflection object, the value must be settable.
>
> 想要深入了解这些法则，请直达原文。
>
> 三法则的前两条都是教程性质、只在讲述 Go 反射是如何抽象出来的，唯有第三条是涉及到内存中具体数据类型布局的真正法则，融会贯通了计组、编译原理的人应当理解此语。



#### 进一步理解：CanAddr 和 CanSet

前文针对 struct 向你解释了什么叫做 settable：对于结构的成员（Field）来说，仅当使用一个指向结构的指针进行反射操作时，才是*可设置*的。

这个特性实际上可以用 reflect.Value.CanSet() 来确定，并且使用 CanSet 并不需要限制于 struct 或者其 Field，对于任何对象都可以通过 reflect.ValueOf(obj).CanSet() 来进行测试。

CanSet 表示说一个给定的 reflect.Value 是可寻址的（addressable），并且是 exported 的，对于小写字母开头的 unexported 变量，其 CanSet 总是为 false。

而所谓的 addressable 对象，包括这些：

- slice 的元素
- 可寻址的数组的元素
- 可寻址的结构的成员（字段）（Field）
- 指针引用的目标

还有一些特殊的时态，例如已回收但尚未无效化的变量等等。所谓我们需要知道，使用 go 进行开发和编码，要尊重约定、尊重惯用法。反面的例子可以是这样：用两个指针指向同一个变量，并且在超出作用域之后通过这些指针去非法访问已经无效的原变量；更有说服力的案例是再次访问已经 close 掉的 channel。

这些例子中之所以有非法操作的存在，本质上说正是因为原始变量已经被回收，但你仍然通过手段试图对其进行操作——绝对安全的高级编程语言是不可能存在的，除非这种语言不支持“高级”操作。



#### Helper：`reflectValue`

由于赋值时结构体的指针是如此的重要，所以我们通常都会有一个工具函数 reflectValue 来取得最后一步的 vou：

```go
func reflectValue(obj interface{}) reflect.Value {
	var val reflect.Value

	if reflect.TypeOf(obj).Kind() == reflect.Ptr {
		val = reflect.ValueOf(obj).Elem()
	} else {
		val = reflect.ValueOf(obj)
	}

	return val
}

vou := reflectValue(&user)
// 等价于：
vou = reflect.ValueOf(&user)
if vou.Kind() == reflect.Ptr {
		vou = vou.Elem()
}
```

注意新版 Go 的反射库中 `reflect.Indirect(v)` 已经提供了相似（几乎等效）的功能，只是需要你提供 reflect.Value 而已：

```go
vou := reflect.ValueOf(&user)
vou = reflect.Indirect(vou)
```



### Deep Copy：针对 unexported 成员

我们已经知道的各种 deepcopy 开源库，一律包含了一个限制：对于结构体的非导出的字段无法实现复制。这是因为 CanSet 的安全性设定：既然非导出的字段在内部被定义为不可赋值的，那么 Set(value) 对其就是无意义的，在 reflect 包中针对这类情况会以 panic 返回，所以开源的 deepcopy 库们无法完成这一功能。

有没有办法迈过这一限制？

目前来看，有人在 Golang 源码 issues 中提出了相似的 Proposal，即提供一个原生的 duplicate 关键字，与 copy 相似但能够实现 deepcopy 功能。这个 Proposal 似乎未被认可。

对于我们来说，有几种可能的方案可以设法达成上述目标：

1. 实现 Cloneable 接口
2. 通过 unsafe pointer
3. 通过 reflect 反射



#### Cloneable 接口

我们可以约定一个 Cloneable 接口：

```go
type (
  // Cloneable interface represents a cloneable object
	Cloneable interface {
		// Clone will always return a new cloned object instance on 'this' object
		Clone() interface{}
	}
)
```

一个对象可以通过实现该接口的方式来返回一个自己的副本：

```go
type U struct {
	Name     string
	Birthday *time.Time
	Nickname string
  hidden   bool
}

func (u U) Clone() interface{} {
	return &U{
		Name:     u.Name,
		Birthday: u.Birthday,
		Nickname: u.Nickname,
    hidden:   u.hidden,
	}
}
```

[`hedzr/ref`](https://github.com/hedzr/ref) 中所提供的 `Clone(fromVar, toVar)` 能够识别那些实现了 Cloneable 接口的类型并自动完成恰当的 Clone 动作。如果给出的入参 fromVar 并没有实现 Cloneable 接口，那么 `hedzr/ref.Clone()` 会使用传统的 reflect 方案对 exported 的字段完成 deepcopy。

> [hedzr/ref](https://github.com/hedzr/ref) 是一个和 refelct 有关的库，有待正式开源，尚未完成。



#### unsafe pointer 方式

我们一直没有真正提及过 `unsafe pointer`，这是 Golang 中的指向某个内存地址的裸指针。它之所以重要，是因为你可以通过它越过 Golang 的一切明面上的约定，包括对 unexported 字段赋值。

```go
func testSetFieldValueUnsafe(t *testing.T) {
	cat := &Cat{
		Age:     9,
		name:    "cat",
		friends: []string{},
	}

	v := reflect.ValueOf(cat).Elem()
	v.FieldByName("Age").SetInt(11)

	type VV struct {
		typ  unsafe.Pointer
		ptr  unsafe.Pointer
		flag uintptr
	}

	v2 := (*VV)(unsafe.Pointer(&v))
	println("v2.ptr: ", v2.ptr)

	type CatX struct {
		Age     int
		Name    string
		friends []string
	}

	c2 := (*CatX)(unsafe.Pointer(cat))
	c2.Name = "ohmygod"
	
	t.Logf("cat  : %+v", cat)
	t.Logf("cat 2: %+v", c2)
}

type Cat struct {
	Age     int
	name    string
	friends []string
}
```

这样的手段，真的不要滥用，实际上可能是非常可怕的。



#### 通过 reflect 方式

本质上说，reflect 方式和 unsafe pointer 方式是差不多的，不过代码上面看要简练一些：

```go
type Foo struct {
	Exported string
	unexported string
}

func testUnexported(t *testing.T) {
	f := &Foo{
		Exported: "Old Value ",
	}

	t.Log(f.Exported)

	field := reflect.ValueOf(f).Elem().FieldByName("unexported")
	SetUnexportedField(field, "New Value")
	t.Log(GetUnexportedField(field))
	t.Logf("foo: %+v", f)
}

func GetUnexportedField(field reflect.Value) interface{} {
	return reflect.NewAt(field.Type(), unsafe.Pointer(field.UnsafeAddr())).Elem().Interface()
}

func SetUnexportedField(field reflect.Value, value interface{}) {
	reflect.NewAt(field.Type(), unsafe.Pointer(field.UnsafeAddr())).
		Elem().
		Set(reflect.ValueOf(value))
}
```







### 所谓的已知的 deepcopy 开源库

大体上在 Github 上可以搜索到的是这些库，排名无分先后，大体上源于 Github 自身列举出来的顺序：



[jinzhu/copier](https://github.com/jinzhu/copier)

Copier for golang, copy value from struct to struct and more

[mohae/*deepcopy*](https://github.com/mohae/deepcopy)

*Deep* *copy* things

[ulule/*deepcopier*](https://github.com/ulule/deepcopier)

simple struct *copying* for golang

[mitchellh/*copystructure*](https://github.com/mitchellh/copystructure)

Go (golang) library for *deep* *copying* values in Go.

[globusdigital/*deep*-*copy*](https://github.com/globusdigital/deep-copy)

*Deep* *copy* generator

[getlantern/*deepcopy*](https://github.com/getlantern/deepcopy)

*Deep* *copying* for Go

[antlabs/*deepcopy*](https://github.com/antlabs/deepcopy)

deepcopy库支持dst, src间的深度拷贝，类型从struct,map,slice基本都支持，支持过滤条件[从零实现]

[go-toolsmith/astcopy](https://github.com/go-toolsmith/astcopy)

Package astcopy implements Go AST *deep* *copy* operations.

[qdm12/reprint](https://github.com/qdm12/reprint)

Golang *deep* *copying*, THE RIGHT WAY ™️

[ybriffa/*deepcopy*](https://github.com/ybriffa/deepcopy)

library to make *deep* *copies* in go

[volio/go-*copy*](https://github.com/volio/go-copy)

Go *deep* *copy* library, support circular reference

[huandu/go-*clone*](https://github.com/huandu/go-clone)

*Deep* *clone* any Go data.

[wzshiming/*deepclone*](https://github.com/wzshiming/deepclone)

deepclone

[davidwalter0/go-*clone*](https://github.com/davidwalter0/go-clone)

recursive *deep* copy of go object











🔚