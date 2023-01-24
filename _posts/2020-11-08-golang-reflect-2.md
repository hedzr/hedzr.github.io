---
layout: single
title: 'Golang Reflect 系列二 - 和 Map 操作有关的'
date: 2020-11-08 10:08:00 +0800
last_modified_at: 2020-11-08 10:08:00 +0800
Author: hedzr
tags: [reflect, map, clone, golang]
categories: golang reflect
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-11.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Golang 反射之二，Map 的相关操作...
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
>
> 接续 [Golang Reflect 系列一 - 和 deepcopy 有关的](https://hedzr.com/golang/reflect/golang-reflect-1/) 谈反射问题。

通过反射方式对 map 进行操作，实际上未必会有多么复杂，它包含了如下的一系列 reflect 中的方法以及一个迭代对象 MapIter：

- `reflect.Type`
  - `Key() Type`
  - `Value() Type`
- `reflect.Value`
  - `MapKeys() []Value`
  - `MapRange() *MapIter`
  - `MapIndex(key Value) Value`
  - `SetMapIndex(key, value Value)`
- `reflect.MapIter`
  - `Next() bool`
  - `Key() Value`
  - `Value() Value`
- `reflect.MapOf(key, elem Type) Type`
- `reflect.MakeMap(typ Type) Value`
- `reflect.MakeMapWithSize(typ Type, n int) Value`



## 和 Map 操作有关的



对于 Map (`reflect.Map`) 类型来说，通过反射的方式对其进行操作，并不困难。



### 用样例说话



#### 获取 map 的类型

```go
var mi = make(map[string]interface{})
typ := reflect.TypeOf(mi)
t.Log(typ)

/// Or:
var mi = make(map[string]interface{})
var mv = reflect.ValueOf(mi)
typ := mv.Type()
t.Log(typ)
```



#### 通过 type 构造 map 新实例

```go
newInstanceValue := reflect.MakeMap(typ)
t.Log(newInstanceValue.Interface())
assert.EqualTrue(t, newInstanceValue.CanAddr())
```

首先你需要有一个 map 类型的 reflect.Type 表示。一般来说通过对一个已有的对象进行 reflect.TypeOf 是最简单的方法。

> 稍后的章节会有更复杂的示例。

MakeMap会创建一个 map 新实例 ins，并返回 `ins` 的 Value 表示。需要注意的是此时所得到的 `newInstanceValue` 是 `addressable` 的（因为一个 map 对象本身就是 addresable 的），这意味着你可以直接使用 `newInstanceValue` 进行赋值操作（SetXXX 类操作）:

```go
newInstanceValue.SetMapIndex(reflect.ValueOf("1"), reflect.ValueOf(1))
```









#### 取得 map 实例的 Value 表示

```go
// MakeMap 返回的是 map 实例的 Value 表示
newInstanceValue := reflect.MakeMap(typ)

// 从已有的实例求得其 Value 表示
var mm map[string]string
m := reflect.ValueOf(mm)
```

这和其它的数据类型及其实例的反射操作是完全相同的。



#### 取得 map 实例的 keys

```go
newInstanceValue := reflect.MakeMap(typ)
keys := newInstanceValue.MapKeys()
for i, k := range keys {
  t.Logf("key %d = %v", i, k)
  key := k.Convert(newInstance.Type().Key())  // 将 k 转换为 map 被定义的 key 类型
  t.Logf("       = %v (%v) -> %v", key, key.Type(), newInstanceValue.MapIndex(key).String())
}
```

通过 `val.MapKeys()` 取得的是一个 `[]Value`，所以我们可以迭代它，此时迭代得到的 `k` 所代表的 map key 实际上是 `interface{}` 类型的，所以我们应该会需要 `key := k.Convert(newInstance.Type().Key())` 来对其进行拆箱、从而得到一个符合其类型定义的 map key 的 Value 表示。

> 但，如果你无需针对 map key 作深度的值的操作、转换，那么你可以直接使用 `interface{}` 状态的 `k` 而不必一定要对其进行拆箱操作。



#### 取得 map 的 key，value 类型

```go
kt, vt := typ.Key(), typ.Elem()
```

通过 `typ.Key()`, `typ.Elem()` 可以取得 map 对象所被定义的 k， v 类型。例如对于 `map[string]bool` 来说，`typ.Key()` 将会为 `reflect.String`，`typ.Elem()` 将会为 `reflect.Int`。



#### 取得 map 的值

通过 `vMap.MapIndex(key)` 可以取得 map[key]。

```go
	mi := map[string]string{
		"a": "this is a",
		"b": "this is b",
	}
  m := reflect.ValueOf(mi)

  var key = reflect.ValueOf("a")
  val := m.MapIndex(key)
  t.Logf("map[%q] = %q", key.String(), val.String())
```



#### 对 map 进行 range 迭代

`m.MapRange()` 可以返回一个 `*reflect.MapIter` 对象。

此对象具有一个成员方法 `Next()` ，其效果等价于对 map 对象实例的 range 迭代：

```go
		var it *reflect.MapIter
		it = m.MapRange()
		t.Log("iterating...")
		for it.Next() {
			t.Logf("  m[%q] = %q", it.Key(), it.Value())
		}
```





#### 复制/设置 Map 对象 / 用 (k,v) 对 map 赋值

通过 `reflect.SetMapIndex(k, v)` 我们可以对 map 进行赋值设置。它相当于 `m1[k1] = v1`  这样的操作。

> 此时，m1 = m.Interface(), k1 = k.Interface(), v1 = v.Interface()。请注意这只是一个简略的表示，因为对于基本类型来说，k.Interface() 是无意义的，但我们的意图在于用一个 Value 对象，也就是 k，的 Interface() 方法来表示 k 这个 Value 对象所表示的实际数值，对于 int 来说它其实应该是 k.Int()，对于 float64 来说它其实应该是 k.Float()，但为了叙述文字的简单性，我们统一用 k.Interface() 调用来指示我们想要 Value 对象的底层数值。

```go
func testMap_basics(t *testing.T) {
	mi := map[string]string{
		"a": "this is a",
		"b": "this is b",
	}

	var input interface{}
	input = mi
	m := reflect.ValueOf(input)
	if m.Kind() == reflect.Map {
		newInstance := reflect.MakeMap(m.Type())
		keys := m.MapKeys()
		for _, k := range keys {
			key := k.Convert(newInstance.Type().Key())
			value := m.MapIndex(key)
			newInstance.SetMapIndex(key, value)
		}
		t.Logf("newInstance = %v", newInstance)
	}
}
```



#### 从零开始构造 map 新实例

##### 一个完整示例

如果想要从零开始构造 map 新实例，可以参考下面的例子（通过 reflect.MapOf）：

```go
func testMap_newMap_1(t *testing.T) {
	var key = "key1"
	var value = 123

	var keyType = reflect.TypeOf(key)
	var valueType = reflect.TypeOf(value)
	var aMapType = reflect.MapOf(keyType, valueType)
	aMap := reflect.MakeMapWithSize(aMapType, 0)
	aMap.SetMapIndex(reflect.ValueOf(key), reflect.ValueOf(value))
	t.Logf("%T:  %v\n", aMap.Interface(), aMap.Interface())
}
```

##### 更进一步的完整示例

```go
func testMap_newMap_2(t *testing.T) {
	key := 1
	value := "abc"

	mapType := reflect.MapOf(reflect.TypeOf(key), reflect.TypeOf(value))

	mapValue := reflect.MakeMap(mapType)
	mapValue.SetMapIndex(reflect.ValueOf(key), reflect.ValueOf(value))
	mapValue.SetMapIndex(reflect.ValueOf(2), reflect.ValueOf("def"))
	mapValue.SetMapIndex(reflect.ValueOf(3), reflect.ValueOf("gh"))

	keys := mapValue.MapKeys()
	for _, k := range keys {
		ck := k.Convert(mapValue.Type().Key())
		cv := mapValue.MapIndex(ck)
		t.Logf("key: %v,  value: %v", ck, cv)
	}
}
```

##### map 新实例赋值给一个指针对象

```go
func testMap_d2(t *testing.T) {
	var m1 map[string]interface{}
	var m2 = &m1

	v2 := ValueOf(m2)
	v2i := v2.IndirectValueRecursive()

	t.Logf("v2i: %v     | v2: %v      | m2: %v", v2i.Type(), v2.Type(), m2)
	nmi := reflect.MakeMap(reflect.TypeOf(m1))
	nmi.SetMapIndex(reflect.ValueOf("today"), reflect.ValueOf("is monday"))
	t.Logf("nmi: %v", nmi.Type())
	t.Logf("     %v | %v | %v", v2.CanAddr(), v2i.CanAddr(), nmi.CanAddr())
	//*(v2.Interface().(*map[string]interface{})) = nmi.Interface().(map[string]interface{})
	v2.Elem().Set(nmi)
	t.Logf("m2 = %v", m2)
}
```





🔚