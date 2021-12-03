---
layout: single
title: '从 Golang 正则式讲起'
date: 2021-12-03 06:00:11 +0800
last_modified_at: 2021-12-03 07:29:11 +0800
Author: hedzr
tags: [golang, regexp]
categories: golang regexp
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/reFind.png
  overlay_image: /assets/images/unsplash-image-1.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  介绍正则表达式我之了解与理解 ...
---



## Golang 正则式语法

Golang 实际上支持两种正则式语法，其一为标配语法，这是源于 RE2 的语法规则，稍后将会完整阐释，其二为 POSIX ERE 规范，这种规范源于 Perl 正则式规范但有所变化，此规范本文内不做介绍。

### Examples

#### POSIX 方式

POSIX ERE 规范，也就是 egrep 正则式语法，在 Linux/macOS 中可以这样获得：

```bash
egrep 'a*b?c'
grep -E 'a(.*?)c'
```

详细介绍这种所谓的扩展的正则式语法，不是本文的目标，故而略过。

golang 中可以使用 [CompilePOSIX](https://pkg.go.dev/regexp#CompilePOSIX) 和 [MustCompilePOSIX](https://pkg.go.dev/regexp#MustCompilePOSIX)，简短示例如下：

```go
// remove new line chars
reg, _ := regexp.CompilePOSIX("\r\n|\r|\n")
inner = reg.ReplaceAllString(inner, "")
```



#### RE2 方式

大多数情况下，我们可能都是采用 Golang 的基本方式，也就是 [RE2](https://github.com/google/re2) 规范来做正则式计算，一般是通过 func [Compile](https://cs.opensource.google/go/go/+/go1.17.3:src/regexp/regexp.go;l=132) 或者 func [MustCompile](https://cs.opensource.google/go/go/+/go1.17.3:src/regexp/regexp.go;l=308) 来编译一个正则式模板：

```go
package main

import (
	"fmt"
	"regexp"
)

func main() {
	// Compile the expression once, usually at init time.
	// Use raw strings to avoid having to quote the backslashes.
	var validID = regexp.MustCompile(`^[a-z]+\[[0-9]+\]$`)

	fmt.Println(validID.MatchString("adam[23]"))
	fmt.Println(validID.MatchString("eve[7]"))
	fmt.Println(validID.MatchString("Job[48]"))
	fmt.Println(validID.MatchString("snakey"))
}

// Output:
// 
// true
// true
// false
// false
```

[RE2](https://github.com/google/re2)  语法在 [https://golang.org/s/re2syntax](https://golang.org/s/re2syntax) 有完整的描述，本文基于该描述进行阐释。它的一个微有节选的易读版本在 [https://pkg.go.dev/regexp/syntax](https://pkg.go.dev/regexp/syntax) 可以访问，两者可以同时对照以便阅读和相互印证。

注意此 [RE2](https://github.com/google/re2)  和 [微软的 RE2](https://docs.microsoft.com/en-us/deployedge/edge-learnmore-regex) 相同而又有所不同。简而言之，[RE2](https://github.com/google/re2) 是 [微软的 RE2](https://docs.microsoft.com/en-us/deployedge/edge-learnmore-regex) 的 Golang 实现版本，由 Google 官方进行维护。



#### 区别

RE2 和 POSIX/Perl 兼容的正则式的区别较为难以叙述，其中一个原因在于 Perl 正则式自己曾经发生过演变与分叉，形成了所谓古典的 Perl regexp 和现代的 Perl regexp 的区别，此外，POSIX regexp 和 RE2 也略有区别，这主要表现在 submatch 的处理上，POSIX 将会尽量返回更长版本（默认为贪婪模式），而 RE2 则会返回尽可能短的版本（默认为非贪婪模式）。

```go
package main

import (
	"fmt"
	"regexp"
)

func main() {
	pattern := "(foo|foobar)"
	str := []byte("foobarbaz")

	rPCRE, _ := regexp.Compile(pattern)
	rPOSIX, _ := regexp.CompilePOSIX(pattern)

	matchesPCRE := rPCRE.Find(str)
	fmt.Println("RE2: ", string(matchesPCRE))
	// prints "foo"

	matchesPOSIX := rPOSIX.Find(str)
	fmt.Println("POSIX: ", string(matchesPOSIX))
	// prints "foobar"
}
```

注意，这个示例源于 [playground](https://play.golang.org/p/kldUzzH8ZO)，但源码中的命名有一个问题：PCRE 是 *Perl Compatible Regular Expressions* 的意思，在一个很大的程度上它几乎也是 POSIX Regular Expressions 的代名词。

所以 `matchesPCRE` 变量名应该命名为 `matchesRE2` 才是正确的。





### Find(All)?(String)?(Submatch)?(Index)?

所有关于 Golang regexp 包的介绍都不能少却这一小节。regexp 包为正则表达式提供了 16 个查找方法，它们的命名具有一定规律，其格式为 `Find(All)?(String)?(Submatch)?(Index)?`。

其中的名称短语具有如下特点：

- All：它会继续查找非重叠的后续的字符串，返回全部匹配结果为一个 slice
- String：入参将会采用 string 类型，否则你需要提供 []byte
- Submatch：在返回匹配结果的同时，也返回子表达式（Capturing Group）的匹配项
- Index：





## 正则式简史

发觉有必要简述一下正则式的各种分支版本。

正则表达式的 POSIX 规范，分为基本型正则表达式（Basic Regular Expression，BRE）和扩展型正则表达式（Extended Regular Express，ERE）两大流派。在兼容 POSIX 的 UNIX 系统上，grep 和 egrep 之类的工具都遵循 POSIX 规范，一些数据库系统中的正则表达式也匹配 POSIX 规范。grep、vi、sed 都属于 BRE，是历史最早的正则表达式，因此元字符必须转译之后才具有特殊含义。egrep、awk 则属于 ERE，元字符不用转译。（源自 [Wiki](https://zh.wikipedia.org/wiki/%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F)）

Perl 的正则式解析器原采用 PCRE，但在分叉之后就形成了 egrep 和 pgrep 两种版本。PCRE 继续单独开发，形成了 Extended RE（ERE，egrep），Perl 自己维护自身的正则式形成了 Perl RE 语法（pgrep）。

macOS 上的 grep 不支持 pgrep 格式，因此跨平台有效的 RE Pattern 最好以 ERE 风格来编写，即采用 POSIX RE 标准。

实际上，POSIX 标准中还有一种标准型正则表达式（Simple RE，SRE）。不过由于其简单性，没有什么实作案例，通常也不推荐采用这种规范。

在现代浏览器应用开发中，Javascript 也通过 ECMA 标准维护着一套正则式规范。ECMAScript 中的正则式基本上是 POSIX RE 的一种拓展版本。不过要由我个人观点来看，渐入歧途吧。

但 RE2 当然是一个不同的家伙。

[微软的 RE2](https://docs.microsoft.com/en-us/deployedge/edge-learnmore-regex) 原出于微软中国研究院，刚发布时名为 greta，名声相当嘹亮，性能优秀，一出品时性能是当时的正则式引擎（boost.regexp）的 7 倍以上，着实是有相当的风头。我之所以对其印象如此深刻，是因为这家伙是 C++ 模板元编程实现的，质量很好（当然，写这类型的类库的人往往都很变态，所以可读性不要有什么期待）

一晃也是二十年过去了，真是物是人非啊。现在你很难找到 greta 的源流了，所以说时间真的可以湮没一切，即使有北极磁带备份又如何，greta 甚至不值得一个维基词条，这既是一个悲哀，又是某种必然。

如果想了解正规表达式，可以阅读维基词条：

- [Regular expression - Wikipedia](https://en.wikipedia.org/wiki/Regular_expression) 
- [Comparison of regular expression engines - Wikipedia](https://en.wikipedia.org/wiki/Comparison_of_regular_expression_engines) 

如果想了解 PCRE 语法，请查阅 [Regular expression - Wikipedia](https://en.wikipedia.org/wiki/Regular_expression) ，这里完整但缺乏样例。

如果想了解 Greta/RE2 语法，可以查阅 [微软的 RE2](https://docs.microsoft.com/en-us/deployedge/edge-learnmore-regex) ，也是完整但缺乏样例。

如果想了解 Golang 标配的 RE2 语法，请注意它和 [微软的 RE2](https://docs.microsoft.com/en-us/deployedge/edge-learnmore-regex) 并无区别，但你当然可以在这里进行查阅：

- [RE2](https://github.com/google/re2)  语法在 [https://golang.org/s/re2syntax](https://golang.org/s/re2syntax) 有完整的描述
- 一个微有节选的易读版本在 [https://pkg.go.dev/regexp/syntax](https://pkg.go.dev/regexp/syntax) 可以访问，两者可以同时对照以便阅读和相互印证。



## Golang 正则式语法一览

本章节以  [Syntax · google/re2 Wiki](https://github.com/google/re2/wiki/Syntax) 为参考基准。

[https://pkg.go.dev/regexp/syntax](https://pkg.go.dev/regexp/syntax) 更简单明快一些，剔除了不支持的条目。



### 单个字符（Single character）

| kinds of single-character expressions                        | examples       |
| ------------------------------------------------------------ | -------------- |
| 匹配任意一个字符，如果设置 s = true，则可以匹配换行符        | `.`            |
| 匹配 “字符类” 中的一个字符，即匹配 x, y 或 z                 | `[xyz]`        |
| 不匹配 “字符类” 中的任一字符，即不匹配 x,y 或 z              | `[^xyz]`       |
| 匹配 “Perl类” 中的一个字符 [(link)](https://github.com/google/re2/wiki/Syntax#perl) | `\d`           |
| 不匹配 “Perl类” 中的任一字符                                 | `\D`           |
| 匹配 “ASCII类” 中的一个字符 [(link)](https://github.com/google/re2/wiki/Syntax#ascii) | `[[:alpha:]]`  |
| 不匹配 “ASCII类” 中的任一字符                                | `[[:^alpha:]]` |
| 匹配 “Unicode 字符类” (one-letter name) 的一个字符           | `\pN`          |
| 匹配 “Unicode 字符类” 的一个字符                             | `\p{Greek}`    |
| 不匹配 “Unicode 字符类” (one-letter name) 的任一字符         | `\PN`          |
| 不匹配 “Unicode 字符类” 的任一字符                           | `\P{Greek}`    |

1. 字符类在后文中进行解释。



### 复合匹配/结合（Composite）

| Composites |                                    |
| ---------- | ---------------------------------- |
| `xy`       | 匹配 xy（`x` 之后跟随着 `y`）      |
| `x|y`      | 匹配 `x` 或者 `y` (`x` 相对更优先) |





### 重复（Repetitions）

|           | Repetitions                                      |
| --------- | ------------------------------------------------ |
| `x*`      | 匹配零个或多个 `x`，优先匹配更多(贪婪)           |
| `x+`      | 匹配一个或多个 `x`，优先匹配更多(贪婪)           |
| `x?`      | 匹配零个或一个 `x`，优先匹配一个(贪婪)           |
| `x{n,m}`  | 匹配 `n` 到 `m` 个 `x`，优先匹配更多(贪婪)       |
| `x{n,}`   | 匹配 `n` 个或多个 `x`，优先匹配更多(贪婪)        |
| `x{n}`    | 精确地匹配 `n` 个 `x`                            |
| `x*?`     | 匹配零个或多个 `x`，优先匹配更少(非贪婪模式)     |
| `x+?`     | 匹配一个或多个 `x`，优先匹配更少(非贪婪模式)     |
| `x??`     | 匹配零个或一个 `x`，优先匹配零个(非贪婪模式)     |
| `x{n,m}?` | 匹配 `n` 到 `m` 个 `x`，优先匹配更少(非贪婪模式) |
| `x{n,}?`  | 匹配 `n` 个或多个 `x`，优先匹配更少(非贪婪模式)  |
| `x{n}?`   | 精确地匹配 `n` 个 `x`(非贪婪模式)                |
| `x{}`     | （等价于 `x*`）（不支持）VIM                     |
| `x{-}`    | （等价于 `x*?`）（不支持）VIM                    |
| `x{-n}`   | （等价于 `x{n}?`）（不支持）VIM                  |
| `x=`      | （等价于 `x?`）（不支持）VIM                     |

启动限制：计数形式 x{n,m}、x{n,} 和 x{n} 最小或最大重复个数不能超过 1000。 无限制的重复不受此限制约束。

| 所有格重复 |                                      |
| :--------- | ------------------------------------ |
| x*+        | 匹配零个或任意个 x，所有格（不支持） |
| x++        | 匹配至少一个 x，所有格（不支持）     |
| x?+        | 匹配零个或一个 x，所有格（不支持）   |
| x {n，m} + | 匹配 n...或 m 个 x，所有格（不支持） |
| x{n,}+     | 匹配至少 n 个 x，所有格（不支持）    |
| x{n}+      | 匹配确定的 n 个 x，所有格（不支持）  |



### 分组（Grouping）

|                | Grouping                              |
| -------------- | ------------------------------------- |
| `(re)`         | 编号捕获组（子匹配）                  |
| `(?P<name>re)` | 命名 & 编号捕获组（子匹配）           |
| `(?<name>re)`  | 命名 & 编号捕获组（子匹配）（不支持） |
| `(?'name're)`  | 命名 & 编号捕获组（子匹配）（不支持） |
| `(?:re)`       | 非捕获组                              |
| `(?flags)`     | 在当前组中设置标志；非捕获            |
| `(?flags:re)`  | 在表达式中设置标志；非捕获            |
| `(?#text)`     | 注释（不支持）                        |
| `(?|x|y|z)`    | 分支编号重置（不支持）                |
| `(?>re)`       | 表达式所有格匹配 （不支持）           |
| `re@>`         | 表达式所有格匹配（不支持）VIM         |
| `%(re)`        | 非捕获组（不支持） VIM                |

上表中的 `flags` 可以是：

|      | Flags                                                        |
| ---- | ------------------------------------------------------------ |
| `i`  | 不区分大小写（默认为 false）                                 |
| `m`  | 多行模式： `^` 和 `$` 匹配行首/尾，以及文本开头/结尾（默认为 false） |
| `s`  | 允许 `.` 匹配 `\n` （默认为 false）                          |
| `U`  | 非贪婪模式：以 `x*?` 替换 `x*`、`x+?` 替换 `x+` 等（默认为 false） |

标记语法为 `xyz` （已设置）或 `-xyz` （清除）或 `xy-z` （设置为 `xy`，清除 `z`）。

Flag syntax is `xyz` (set) or `-xyz` (clear) or `xy-z` (set `xy`, clear `z`).



### 空字符串

|           | Empty strings                                               |
| --------- | ----------------------------------------------------------- |
| `^`       | 文本开始或行首（m = true）                                  |
| `$`       | 文本开始或行首（m = true）                                  |
| `\A`      | 文本开头                                                    |
| `\b`      | 匹配 ASCII 单词边界（\w 表示一端，\W、\A 或 \z 表示另一端） |
| `\B`      | 匹配非 ASCII 单词边界                                       |
| `\g`      | 匹配正在搜索的从属文本开头（不支持） PCRE                   |
| `\G`      | 匹配上一个匹配的结尾（不支持） PERL                         |
| `\Z`      | 匹配必须出现在文本末尾，或在文本末尾换行前的位置（不支持）  |
| `\z`      | 匹配文本末尾                                                |
| `(?=re)`  | 前向肯定界定符（不支持）                                    |
| `(?!re)`  | 前向否定界定符（不支持）                                    |
| `(?<=re)` | 后向肯定界定符（不支持）                                    |
| `(?<!re)` | 后向否定界定符（不支持）                                    |
| `re&`     | 前向肯定界定符（不支持）VIM                                 |
| `re@=`    | 前向肯定界定符（不支持）VIM                                 |
| `re@!`    | 前向否定界定符（不支持）VIM                                 |
| `re@<=`   | 后向肯定界定符（不支持）VIM                                 |
| `re@<!`   | 后向否定界定符（不支持）VIM                                 |
| `\zs`     | 设置匹配开始（同 \K）（不支持） VIM                         |
| `\ze`     | 设置匹配结尾（不支持） VIM                                  |
| `\%^`     | 匹配文件开头（不支持） VIM                                  |
| `\%$`     | 匹配文件结尾（不支持） VIM                                  |
| `\%V`     | 在屏幕上匹配（不支持）VIM                                   |
| `\%#`     | 从光标位置匹配（不支持） VIM                                |
| `\%'m`    | 在标记 m 的位置匹配（不支持） VIM                           |
| `\%23l`   | 在第 23 行匹配（不支持）VIM                                 |
| `\%23c`   | 在第 23 列匹配（不支持）VIM                                 |
| `\%23v`   | 在虚拟第 23 列匹配（不支持）VIM                             |



### 转义序列

|               | Escape sequences                               |
| ------------- | ---------------------------------------------- |
| `\a`          | 报警符 bell (≡ `\007`)                         |
| `\f`          | 换页符 form feed (≡ `\014`)                    |
| `\t`          | 水平制表符 horizontal tab (≡ `\011`)           |
| `\n`          | 换行符 newline (≡ `\012`)                      |
| `\r`          | 回车符 carriage return (≡ `\015`)              |
| `\v`          | 垂直制表符 vertical tab character (≡ `\013`)   |
| `\*`          | 字面量 `*`, 匹配任意标点字符 `*`               |
| `\123`        | 匹配八进制字符代码（最多三位）                 |
| `\x7F`        | 匹配十六进制字符代码（最多两位）               |
| `\x{10FFFF}`  | 匹配十六进制字符代码                           |
| `\C`          | 匹配单字节，即使在 UTF-8 模式下                |
| `\Q...\E`     | 匹配文本 `...` ，即使 `...` 中包含标点         |
| `\1`          | 匹配反向引用（不支持）                         |
| `\b`          | 匹配退格 （不支持）（使用 `\010`）             |
| `\cK`         | 匹配控制字符 `^K` （不支持）（使用 `\001` 等） |
| `\e`          | 匹配转义符 （不支持）（使用 `\033`）           |
| `\g1`         | 匹配反向引用（不支持）                         |
| `\g{1}`       | 匹配反向引用（不支持）                         |
| `\g{+1}`      | 匹配反向引用（不支持）                         |
| `\g{-1}`      | 匹配反向引用（不支持）                         |
| `\g{name}`    | 匹配已命名反向引用（不支持）                   |
| `\g<name>`    | 匹配子例程调用（不支持）                       |
| `\g'name'`    | 匹配子例程调用（不支持）                       |
| `\k<name>`    | 匹配已命名反向引用（不支持）                   |
| `\k'name'`    | 匹配已命名反向引用（不支持）                   |
| `\lX`         | 匹配小写 `X`（不支持）                         |
| `\ux`         | 匹配大写 `x`（不支持）                         |
| `\L...\E`     | 匹配小写文本 `...` （不支持）                  |
| `\K`          | 重置 `$0` 开头（不支持）                       |
| `\N{name}`    | 匹配已命名 Unicode 字符（不支持）              |
| `\R`          | 匹配换行符（不支持）                           |
| `\U...\E`     | 匹配大写文本  `...` （不支持）                 |
| `\X`          | 匹配扩展 Unicode 序列（不支持）                |
| `\%d123`      | 匹配十进制字符 123（不支持） VIM               |
| `\%xFF`       | 匹配十六进制字符 FF （不支持） VIM             |
| `\%o123`      | 匹配八进制字符 123（不支持） VIM               |
| `\%u1234`     | 匹配 Unicode 字符 0x1234（不支持）VIM          |
| `\%U12345678` | 匹配 Unicode 字符 0x12345678（不支持）VIM      |



### **字符组元素**（字符类）

|           | Character class elements              |
| --------- | ------------------------------------- |
| `x`       | 单个字符                              |
| `A-Z`     | 字符范围（含）                        |
| `\d`      | 匹配 Perl 字符类                      |
| `[:foo:]` | 匹配 ASCII 字符类 `foo`               |
| `\p{Foo}` | 匹配 Unicode 字符类 `Foo`             |
| `\pF`     | 匹配 Unicode 字符类 `F`（单字母名称） |

### **作为字符类元素命名的字符组**

|               | Named character classes as character class elements      |
| ------------- | -------------------------------------------------------- |
| `[\d]`        | 数字字符 (≡ `\d`)                                        |
| `[^\d]`       | 非数字字符 (≡ `\D`)                                      |
| `[\D]`        | 非数字字符 (≡ `\D`)                                      |
| `[^\D]`       | 非非数字字符、即数字字符 (≡ `\d`)                        |
| `[[:name:]]`  | 匹配在字符类内部命名的 ASCII 类 (≡ `[:name:]`)           |
| `[^[:name:]]` | 匹配在排除型字符类内部命名的 ASCII 类 (≡ `[:^name:]`)    |
| `[\p{Name}]`  | 匹配在字符类内部命名的 Unicode 属性 (≡ `\p{Name}`)       |
| `[^\p{Name}]` | 匹配在排除型字符类内部命名的 Unicode 属性 (≡ `\P{Name}`) |

### **Perl 字符组（仅限所有 ASCII 码）**

|      | Perl character classes (all ASCII-only) |
| ---- | --------------------------------------- |
| `\d` | 数字 (≡ `[0-9]`)                        |
| `\D` | 非数字 (≡ `[^0-9]`)                     |
| `\s` | 白空格 (≡ `[\t\n\f\r ]`)                |
| `\S` | 非白空格 (≡ `[^\t\n\f\r ]`)             |
| `\w` | 整个单词 (≡ `[0-9A-Za-z_]`)             |
| `\W` | 非整个单词 (≡ `[^0-9A-Za-z_]`)          |
| `\h` | 水平空格 (不支持)                       |
| `\H` | 非水平空格 (不支持)                     |
| `\v` | 垂直空格 (不支持)                       |
| `\V` | 非垂直空格 (不支持)                     |

### **ASCII 字符类**

|                | ASCII character classes                                      |
| -------------- | ------------------------------------------------------------ |
| `[[:alnum:]]`  | 字母和数字 (≡ `[0-9A-Za-z]`)                                 |
| `[[:alpha:]]`  | 字母 (≡ `[A-Za-z]`)                                          |
| `[[:ascii:]]`  | ASCII字符 (≡ `[\x00-\x7F]`)                                  |
| `[[:blank:]]`  | 空白字符 (≡ `[\t ]`)                                         |
| `[[:cntrl:]]`  | 控制字符 (≡ `[\x00-\x1F\x7F]`)                               |
| `[[:digit:]]`  | 数字 (≡ `[0-9]`)                                             |
| `[[:graph:]]`  | 图形字符，可打印字符，可见字符 (≡ `[!-~]` ≡ `[A-Za-z0-9!"#$%&'()*+,\-./:;<=>?@[\\\]^_`````{|}~]`) |
| `[[:lower:]]`  | 小写字符 (≡ `[a-z]`)                                         |
| `[[:print:]]`  | 可打印字符 (≡ `[ -~]` ≡ `[ [:graph:]]`)                      |
| `[[:punct:]]`  | 标点字符 (≡ `[!-/:-@[-`````{-~]`)                            |
| `[[:space:]]`  | 白空格 (≡ `[\t\n\v\f\r ]`)                                   |
| `[[:upper:]]`  | 大些字符 (≡ `[A-Z]`)                                         |
| `[[:word:]]`   | 整个单词 (≡ `[0-9A-Za-z_]`)                                  |
| `[[:xdigit:]]` | 十六进制字符 (≡ `[0-9A-Fa-f]`)                               |

### **Unicode 字符类名称 - 常规类别**

|      | Unicode character class names--general category |
| ---- | ----------------------------------------------- |
| `C`  | 其它                                            |
| `Cc` | control                                         |
| `Cf` | format                                          |
| `Cn` | 未赋值码点 (NOT SUPPORTED)                      |
| `Co` | 私有用途                                        |
| `Cs` | 代理项 surrogate                                |
| `L`  | 字母                                            |
| `LC` | 大小写字母（不支持）                            |
| `L&` | 大小写字母（不支持）                            |
| `Ll` | 小写字母                                        |
| `Lm` | 修饰字母                                        |
| `Lo` | 其他字母                                        |
| `Lt` | 首字母大写                                      |
| `Lu` | 大写字母                                        |
| `M`  | 标记 mark                                       |
| `Mc` | 间距标记 spacing mark                           |
| `Me` | 封闭标记 enclosing mark                         |
| `Mn` | 非间距标记 non-spacing mark                     |
| `N`  | 数字 number                                     |
| `Nd` | 十进制数字 decimal number                       |
| `Nl` | 字母或数字 letter number                        |
| `No` | 其它数字 other number                           |
| `P`  | 标点符号 punctuation                            |
| `Pc` | 连接符 connector punctuation                    |
| `Pd` | 短划线 dash punctuation                         |
| `Pe` | 结束标点 close punctuation                      |
| `Pf` | 后引号 final punctuation                        |
| `Pi` | 前引号 initial punctuation                      |
| `Po` | 其它标点符号 other punctuation                  |
| `Ps` | 开始标点 open punctuation                       |
| `S`  | 符号 symbol                                     |
| `Sc` | 货币符号 currency symbol                        |
| `Sk` | 修饰符符号 modifier symbol                      |
| `Sm` | 数学符号 math symbol                            |
| `So` | 其它符号 other symbol                           |
| `Z`  | 分隔符 separator                                |
| `Zl` | 行分隔符 line separator                         |
| `Zp` | 段落分隔符 paragraph separator                  |
| `Zs` | 空白分隔符 space separator                      |

### **Unicode 字符类名称 - 文字系统**

| Unicode character class names--scripts       |
| -------------------------------------------- |
| 阿德拉姆`Adlam`                              |
| 阿霍姆语`Ahom`                               |
| 安纳托利亚 _ 象形文字`Anatolian_Hieroglyphs` |
| 阿拉伯语`Arabic`                             |
| 亚美尼亚语`Armenian`                         |
| 阿维斯陀语`Avestan`                          |
| 巴厘文`Balinese`                             |
| 巴姆穆文`Bamum`                              |
| `Bassa_Vah`                                  |
| 巴塔克文`Batak`                              |
| 孟加拉语`Bengali`                            |
| 拜克舒克文`Bhaiksuki`                        |
| 汉语拼音字母`Bopomofo`                       |
| 婆罗米文`Brahmi`                             |
| 布莱叶盲文`Braille`                          |
| 布吉文`Buginese`                             |
| 布锡语`Buhid`                                |
| 加拿大 _ 澳大利亚土著语`Canadian_Aboriginal` |
| 卡里亚文`Carian`                             |
| 高加索 _ 阿尔巴尼亚语`Caucasian_Albanian`    |
| 占文`Chakma`                                 |
| `Cham`                                       |
| 切罗基语`Cherokee`                           |
| 花剌子模语`Chorasmian`                       |
| 通用`Common`                                 |
| 科普特语`Coptic`                             |
| 楔形文字`Cuneiform`                          |
| 塞浦路斯语`Cypriot`                          |
| `Cypro_Minoan`                               |
| 西里尔字母`Cyrillic`                         |
| 德塞莱特文`Deseret`                          |
| 梵文`Devanagari`                             |
| `Dives_Akuru`                                |
| 多格兰语`Dogra`                              |
| 杜普洛伊速记体`Duployan`                     |
| 埃及 _ 象形文字`Egyptian_Hieroglyphs`        |
| 爱尔巴桑语`Elbasan`                          |
| 埃利迈语`Elymaic`                            |
| 埃塞俄比亚文`Ethiopic`                       |
| 格鲁吉亚语`Georgian`                         |
| 格拉哥里语`Glagolitic`                       |
| 哥特语`Gothic`                               |
| 格兰塔字母`Grantha`                          |
| 希腊语`Greek`                                |
| 古吉拉特语`Gujarati`                         |
| `Gunjala_Gondi`                              |
| 锡克教文`Gurmukhi`                           |
| 汉语`Han`                                    |
| 韩语`Hangul`                                 |
| `Hanifi_Rohingya`                            |
| 汉奴劳族文`Hanunoo`                          |
| 哈特兰文`Hatran`                             |
| 希伯来语`Hebrew`                             |
| 日文`Hiragana`                               |
| 英制文字 _ 阿拉姆语`Imperial_Aramaic`        |
| 继承`Inherited`                              |
| 碑文 _ 巴拉维语`Inscriptional_Pahlavi`       |
| 碑文 _ 帕提亚语`Inscriptional_Parthian`      |
| 爪哇文`Javanese`                             |
| 凯提文`Kaithi`                               |
| 埃纳德语`Kannada`                            |
| 片假名`Katakana`                             |
| 克耶 _ 列支敦士登`Kayah_Li`                  |
| 卡罗须提文`Kharoshthi`                       |
| 契丹 _小_文字`Khitan_Small_Script`           |
| 高棉语`Khmer`                                |
| 克吉奇文`Khojki`                             |
| 信德文`Khudawadi`                            |
| 老挝语`Lao`                                  |
| 拉丁语`Latin`                                |
| 雷布查文`Lepcha`                             |
| 林布文`Limbu`                                |
| 线性 _A`Linear_A`                            |
| 线性 _B`Linear_B`                            |
| 僳文傈`Lisu`                                 |
| 利西亚文`Lycian`                             |
| 吕底亚文`Lydian`                             |
| 马哈詹语`Mahajani`                           |
| 望加锡语`Makasar`                            |
| 马拉雅拉姆语`Malayalam`                      |
| 阿拉米文`Mandaic`                            |
| 摩尼文`Manichaean`                           |
| `Marchen`                                    |
| `Masaram_Gondi`                              |
| 梅德法伊德林文`Medefaidrin`                  |
| 梅泰族 _ 曼尼普尔文`Meetei_Mayek`            |
| 门德 _ 门迪文`Mende_Kikakui`                 |
| 麦罗埃 _ 手写体`Meroitic_Cursive`            |
| 麦罗埃 _ 象形文字`Meroitic_Hieroglyphs`      |
| 苗文`Miao`                                   |
| 莫迪文`Modi`                                 |
| 蒙古语`Mongolian`                            |
| 毛里塔尼亚乌吉亚`Mro`                        |
| 穆尔塔尼`Multani`                            |
| 缅甸`Myanmar`                                |
| 纳巴泰`Nabataean`                            |
| 楠迪梵文`Nandinagari`                        |
| `New_Tai_Lue`                                |
| `Newa`                                       |
| `Nko`                                        |
| 女书`Nushu`                                  |
| `Nyiakeng_Puachue_Hmong`                     |
| 欧甘字母`Ogham`                              |
| `Ol_Chiki`                                   |
| 古语 _ 匈牙利语`Old_Hungarian`               |
| 古语 _ 意大利语`Old_Italic`                  |
| 古语 _ 北部 _ 阿拉伯语`Old_North_Arabian`    |
| 古语 _ 彼尔姆语`Old_Permic`                  |
| 古语 _ 波斯语`Old_Persian`                   |
| 古语 _ 古索格代亚纳语`Old_Sogdian`           |
| 古语 _ 南部 _ 阿拉伯语`Old_South_Arabian`    |
| 古语 _ 突厥语`Old_Turkic`                    |
| `Old_Uyghur`                                 |
| 奥里雅语`Oriya`                              |
| 欧塞奇语`Osage`                              |
| 奥斯曼亚字母`Osmanya`                        |
| 救世苗文 _ 苗语`Pahawh_Hmong`                |
| 帕米拉语`Palmyrene`                          |
| `Pau_Cin_Hau`                                |
| `Phags_Pa`                                   |
| 腓尼基语`Phoenician`                         |
| `Psalter_Pahlavi`                            |
| 勒姜语`Rejang`                               |
| 古北欧文字`Runic`                            |
| 撒马利亚文`Samaritan`                        |
| 索拉什特拉文`Saurashtra`                     |
| 夏拉达文`Sharada`                            |
| 萧伯纳文`Shavian`                            |
| 悉昙文字`Siddham`                            |
| 手语书写体`SignWriting`                      |
| 僧伽罗语`Sinhala`                            |
| 粟特语`Sogdian`                              |
| `Sora_Sompeng`                               |
| 索永布语`Soyombo`                            |
| 巽他语`Sundanese`                            |
| `Syloti_Nagri`                               |
| 叙利亚语`Syriac`                             |
| 他加禄语`Tagalog`                            |
| 塔班瓦语`Tagbanwa`                           |
| `Tai_Le`                                     |
| `Tai_Tham`                                   |
| `Tai_Viet`                                   |
| 泰克里文`Takri`                              |
| 泰米尔语`Tamil`                              |
| 西夏语`Tangsa`                               |
| `Tangut`                                     |
| 泰卢固语`Telugu`                             |
| 它拿字母`Thaana`                             |
| 泰语`Thai`                                   |
| 藏语`Tibetan`                                |
| 提夫纳语`Tifinagh`                           |
| `Tirhuta`                                    |
| `Toto`                                       |
| 乌加里特语`Ugaritic`                         |
| 瓦依语`Vai`                                  |
| `Vithkuqi`                                   |
| 万秋文`Wancho`                               |
| `Warang_Citi`                                |
| 雅兹迪语`Yezidi`                             |
| 彝语`Yi`                                     |
| `Zanabazar_Square`                           |

### **Vim 字符类**

|       | Vim character classes                              |
| ----- | -------------------------------------------------- |
| `\i`  | 匹配标识符字符（不支持） VIM                       |
| `\I`  | `\i` 不包括数字字符（不支持）VIM                   |
| `\k`  | 匹配关键字字符（不支持）VIM                        |
| `\K`  | `\k` 不包括数字字符（不支持）VIM                   |
| `\f`  | 匹配文件名称字符（不支持）VIM                      |
| `\F`  | `\f` 不包括数字字符（不支持）VIM                   |
| `\p`  | 匹配可打印字符（不支持）VIM                        |
| `\P`  | `\p` 不包括数字字符（不支持）VIM                   |
| `\s`  | 匹配空白字符 (≡ `[ \t]`) (NOT SUPPORTED) VIM       |
| `\S`  | 匹配非空白字符 (≡ `[^ \t]`) (NOT SUPPORTED) VIM    |
| `\d`  | 数字 (≡ `[0-9]`) VIM                               |
| `\D`  | 非 `\d` VIM                                        |
| `\x`  | 十六进制数字 (≡ `[0-9A-Fa-f]`) (NOT SUPPORTED) VIM |
| `\X`  | 非 `\x` (NOT SUPPORTED) VIM                        |
| `\o`  | 八进制数字 (≡ `[0-7]`) (NOT SUPPORTED) VIM         |
| `\O`  | 非 `\o` (NOT SUPPORTED) VIM                        |
| `\w`  | 单词 VIM                                           |
| `\W`  | 非 `\w` VIM                                        |
| `\h`  | 匹配单词起始字符 (NOT SUPPORTED) VIM               |
| `\H`  | 非 `\h` (NOT SUPPORTED) VIM                        |
| `\a`  | 匹配字母字符 (NOT SUPPORTED) VIM                   |
| `\A`  | 非 `\a` (NOT SUPPORTED) VIM                        |
| `\l`  | 小写字符 (NOT SUPPORTED) VIM                       |
| `\L`  | 非小写字符 (NOT SUPPORTED) VIM                     |
| `\u`  | 大写字符 (NOT SUPPORTED) VIM                       |
| `\U`  | 非大写字符 (NOT SUPPORTED) VIM                     |
| `\_x` | `\x` 加上换行符，匹配任意 `x` (NOT SUPPORTED) VIM  |
| `\c`  | 忽略大小写 (NOT SUPPORTED) VIM                     |
| `\C`  | 匹配大小写 (NOT SUPPORTED) VIM                     |
| `\m`  | magic (NOT SUPPORTED) VIM                          |
| `\M`  | nomagic (NOT SUPPORTED) VIM                        |
| `\v`  | verymagic (NOT SUPPORTED) VIM                      |
| `\V`  | verynomagic (NOT SUPPORTED) VIM                    |
| `\Z`  | 忽略 Unicode 组合字符的不同 (NOT SUPPORTED) VIM    |

### Magic

|                       | Magic                                         |
| --------------------- | --------------------------------------------- |
| `(?{code})`           | PERL 中的任意 Perl 代码（不支持）             |
| `(??{code})`          | PERL 中延迟的任意 Perl 代码（不支持）         |
| `(?n)`                | 递归调用 regexp 捕获组 n （不支持）           |
| `(?+n)`               | 递归调用相对组 +n （不支持）                  |
| `(?-n)`               | 递归调用相对组 -n （不支持）                  |
| `(?C)`                | PCRE 回调（不支持） PCRE                      |
| `(?R)`                | 递归调用整个 regexp （等价于 (?0)）（不支持） |
| `(?&name)`            | 递归调用已命名组（不支持）                    |
| `(?P=name)`           | 匹配已命名反向引用（不支持）                  |
| `(?P>name)`           | 递归调用已命名组（不支持）                    |
| `(?(cond)true|false)` | 条件分支（不支持）                            |
| `(?(cond)true)`       | 条件分支（不支持）                            |
| `(*ACCEPT)`           | 让 regexps 更类似于 Prolog （不支持）         |
| `(*COMMIT)`           | (NOT SUPPORTED)                               |
| `(*F)`                | (NOT SUPPORTED)                               |
| `(*FAIL)`             | (NOT SUPPORTED)                               |
| `(*MARK)`             | (NOT SUPPORTED)                               |
| `(*PRUNE)`            | (NOT SUPPORTED)                               |
| `(*SKIP)`             | (NOT SUPPORTED)                               |
| `(*THEN)`             | (NOT SUPPORTED)                               |
| `(*ANY)`              | 设置换行约定（不支持）                        |
| `(*ANYCRLF)`          | (NOT SUPPORTED)                               |
| `(*CR)`               | (NOT SUPPORTED)                               |
| `(*CRLF)`             | (NOT SUPPORTED)                               |
| `(*LF)`               | (NOT SUPPORTED)                               |
| `(*BSR_ANYCRLF)`      | 设置 \R 约定（不支持） PCRE                   |
| `(*BSR_UNICODE)`      | (NOT SUPPORTED) PCRE                          |



## 后记

本文主要目的是回顾和整理一个 cheatsheet。很显然，一篇文章是不可能教会你正则式的，所以本文也不怎么给示例，要想讲清楚会需要太多示例。

作为一个示例，[cmdr](https://github.com/hedzr/cmdr) 包含一个工具函数 `UnescapeUnicode`，其源码为：

```go
// UnescapeUnicode 解码 \uxxxx 为 unicode 字符; 但是输入的 b 应该是 yaml 格式
func UnescapeUnicode(b []byte) string {
	b = reFind.ReplaceAllFunc(b, expandUnicodeInYamlLine)
	return string(b)
}

func expandUnicodeInYamlLine(line []byte) []byte {
	// TODO: restrict this to the quoted string value
	return reFindU.ReplaceAllFunc(line, expandUnicodeRune)
}

func expandUnicodeRune(esc []byte) []byte {
	ri, _ := strconv.ParseInt(string(esc[2:]), 16, 32)
	r := rune(ri)
	repr := make([]byte, utf8.RuneLen(r))
	utf8.EncodeRune(repr, r)
	return repr
}

var reFind = regexp.MustCompile(`[^\s\:]+\:\s*["']?.*\\u.*["']?`)
```

jex.im 为这个 Pattern 提供了一个可视化图解：

![reFind](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/reFind.png)



### References

- [https://pkg.go.dev/regexp](https://pkg.go.dev/regexp)
- [https://pkg.go.dev/regexp#Compile](https://pkg.go.dev/regexp#Compile)
- [https://pkg.go.dev/regexp#MustCompile](https://pkg.go.dev/regexp#MustCompile)
- [https://pkg.go.dev/regexp#CompilePOSIX](https://pkg.go.dev/regexp#CompilePOSIX)
- [https://pkg.go.dev/regexp#MustCompilePOSIX](https://pkg.go.dev/regexp#MustCompilePOSIX)
- [regex - What is the difference between regexp.Compile and regexp.CompilePOSIX? - Stack Overflow](https://stackoverflow.com/questions/34828408/what-is-the-difference-between-regexp-compile-and-regexp-compileposix) 
- [https://golang.org/s/re2syntax](https://golang.org/s/re2syntax)
- [https://pkg.go.dev/regexp/syntax](https://pkg.go.dev/regexp/syntax)
- [微软的 RE2](https://docs.microsoft.com/en-us/deployedge/edge-learnmore-regex) 
- [正则表达式 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F)





🔚