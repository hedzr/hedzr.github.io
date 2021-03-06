---
layout: single
title: 'Shell - 关于 Shebang'
date: 2020-12-12 00:00:00 +0800
last_modified_at: 2020-12-12 07:11:00 +0800
Author: hedzr
tags: [shell, shebang, hashbang, ]
categories: devops shell
comments: true
toc: true
header:
  overlay_image: /assets/images/bash-shell.png
  overlay_filter: rgba(255, 255, 255, 0.5)
excerpt: >-
  Shebang 是什么，...

---



# Shebang in Shell



> 按
>
> 以前我曾经概括过 [HereDoc](/devops/shell/about-heredoc/)，[Grep](/devops/shell/things-about-grep/) 等等，今次对 Shebang 做一个概括介绍。



## 导言



首先你需要知道的是，在计算机领域中，bang 是叹号❗️的意思，它的本意是重击，所以俚语引申为感叹号。

无论你是否知道甚至是熟练于 shell 脚本编写，你应该都听说过见到过 `#!/bin/bash` 的文件头。它被称作为 Shebang/Hashbang，是由一个井号和叹号构成的字符序列。

不限于 bash/zsh，类 Unix 操作系统的 Shell loader 会分析 Shebang 之后的内容并将其作为解释器指令而调用。

例如对于如下的文件：

```bash
#!/bin/bash
echo "hello"
```

Shell 会识别到 shebang 字头，然后将后继的 `/bin/bash` 作为解释器，并向 bash 传递文件的内容进行执行。所以 bash 解释了 `echo "hello"` 之后在控制台输出了 `hello` 文本。





## Shebang，Hash-bang (#!)

Shebang 由一个井号和叹号开头，请注意，多数 Shell（sh/bash/zsh/fish/ksh）会期待文件开头有限字节范围内，在第一行行首能够识别到 Shebang 序列，然后进入 Shebang 解释模式。

在 `#!` 序列之后可以有 0 到多个空白字符，然后是解释器的绝对路径（可以为其指定参数）。从第一个非空字符开始，loader 将会期待一行完整的命令行文本，并会将这段命令行（无论有否带有参数）当作解释器执行，并为该解释器的标准输入设备中写入脚本文件的内容。

> 对于现代的大多数 Shell 程序来说，它们都是简单地将脚本文件本身传递给解释器，而不是将去掉 Shebang line 之后的内容传递给解释器。
>
> 这个行为也很好理解，因为 Shebang loader 的实现者就无需构建脚本文件的缓冲区来去掉 Shebang line 了。
>
> 如果我是 OS 以及 Shell 的作者，我会考虑在 file system 的支撑能力上提供一个 mmap 机制，这个增强型的 mmap 能够指定 (offset_start, offset_stop) 或者 (offset, length) 的方式来映射一个虚拟的文件句柄（虚拟的 inode），这样就可以很轻易地实现排除 shebang line 的算法了。
>
> > 这样有意思吗？
> >
> > 有的。
> >
> > 对于多数编译器来说，语言的语法层面能够支持 # 作为单行注释的，并不多，例如 c++, golang, rust, scala, kotlin 统统都不行。
> >
> > 这就带来一个问题，把这些传统型编译语言型的编译器当作解释型的解释器，在你解决了 shebang 行加载问题之后，你会遇到不能识别的 '#' 字符问题，这是很有点哭笑不得的。
> >
> > ![image-20201211093217275](https://i.loli.net/2020/12/11/I7VnNa6FcbXP4y9.png)
> >
> > 所以如果 OS 在 filesystem 上提供这样的特性的话，Shell 开发者可以很轻易地解决掉 Shebang line，这样像 go 这样的编译器就能够很好地契合到 Shell 中了。
> >
> > > 当前，最简单的 Golang 像解释器一样工作的方式是：
> > >
> > > ```bash
> > > go run a.go
> > > ```
> > >
> > > 也有一些方法试图解决这一问题。
> > >
> > > 稍后章节我们还会展开研讨这个问题。
> >
> > 或许这种机制 linux mmap 已经能支持了，尚未去查阅过其变迁。

理论上说，你可以指定一个 bash 脚本到这里，它会被正确地套娃。

而指定一个 ELF 可执行文件的绝对路径到这里是比较常见的选择，正如下面的例子：

```bash
#!/bin/bash
#!/bin/zsh
#!/bin/fish

#!/usr/bin/env bash
#!/usr/bin/env zsh

#!/usr/local/bin/my-prog
#!/usr/local/bin/my-script.sh
```

其中，使用 `#!/usr/bin/env arg` 是一种常见的在不同平台上都能正确找到解释器的办法。因为有的平台上 bash 被安置在 /bin，有的平台上可能是安置在 /usr/bin，所以 `/bin/bash` 可能并不是总是能找到 bash 的真身。此时借助 `/usr/bin/env bash` 的方式，平台会将自己的 bash 安置位置返回给 Shebang loader，这就能保证 bash 二进制执行文件的可用性。



### 更多例子

Perl 和 Python 通常都是 Linux 发行版中的标配。

所以直接使用它们的解释脚本做工具的例子也很多。这时候的 Shebang 可能是这样的：

```bash
#!/usr/bin/perl -w         # 使用带警告的Perl执行
#!/usr/bin/python -O       # 使用具有代码优化的Python执行
```

PHP 也支持脚本化运行，你需要用到：

```bash
#!/usr/bin/php             # 使用PHP的命令行解释器执行
```

Golang 是一个比 Python 更有力的解释器候选人，不过这边的积累还远远不够发起挑战，你可以这样跑 Golang 的脚本：

```bash
#!/usr/bin/env bash
exec go run "$0" "$@"
!#
package main

import (
    "fmt"
    "os"
)

func main() {
    fmt.Println("Hello", os.Args[1])
    os.Exit(42)
}

```

但它会以不合适的golang 语法而告终。行得通的办法在稍后会进行讨论。

但 Scala，Scheme，Nodejs 都能够达到解释运行的目的。



### 使用其它执行文件而不是 bash

既然 Shebang loader 是在执行一条命令行，那么你并不一定非要使用 bash。

例如可以用 cat 试试：

```bash
#!/bin/cat
hello world
```





## bang-pound (!#) in Scala

`!#` 是 Scala 专有的一个语法单位，它的作用是将 scala 编译器切换到脚本解释模式。所以 Scala 的脚本开发者能够编写[^7]：

```scala
#!/bin/sh
exec scala "$0" "$@"
!#
// Say hello to the first argument
println("Hello, "+ args(0) +"!")
```

对于 Scala 来说，其语法分析会将 `#!` .. `!#` 之间的内容当作是普通注释一般地略过。



[^7]: [What is the meaning of !# (bang-pound) in a sh / Bash shell script? - Stack Overflow](https://stackoverflow.com/questions/10060419/what-is-the-meaning-of-bang-pound-in-a-sh-bash-shell-script) 







## golang

让 golang 工作为解释器，是个不容易的事。

### hack

我们已经知道一种 [hack 方法](https://posener.github.io/go-shebang-story/)[^9]（[译文](https://www.infoq.cn/article/mbzyz8sedtbz5*4mhizo)[^10]，[Stackoverflow](https://stackoverflow.com/questions/41542941/is-it-possible-to-run-go-code-as-a-script)[^11]）可以奏效：

```go
//usr/bin/env go run "$0" "$@"; exit "$?"
package main

import (
    "fmt"
    "os"
)

func main() {
    fmt.Println("Hello", os.Args[1:])
    os.Exit(42)
}
```

### gorun

此外，我们可以借助 [`gorun`](https://github.com/erning/gorun) 来间接地跑 .go 如同脚本：

```go
#! /usr/bin/env gorun
package main

import (
    "fmt"
    "os"
)

func main() {
    fmt.Println("Hello", os.Args[1:])
    os.Exit(42)
}
```

然后：

```bash
./example.go world
```

这种方法的问题在于，.go 文件不再是合法有效的。

这会导致一系列的问题。你只能将这些 .go 脚本文件移出你的 source-tree，否则你的 Golang 项目连 gofmt，go run 都做不了。

### 提案

让 golang 支持 '#' 单行注释是个很困难的事吗？按照 Golang 开发队那堆人的性子，这很困难，因为这需要调整编译器的词法和语法逻辑，还会影响到 golang 工具树中的一系列工具，gofmt，goyacc 等等，而且所有的第三方工具都会感觉不好了，这显然是个不能被接受的提案嘛。

让 Golang 像 Nodejs 那样专门为 Shebang line 进行一个 hack 性处理，这困难吗？想必仍然是很困难的，毕竟这会影响 go 的编译速度嘛！



## 结论

所以我在想，我应该设计一种语言，没有这些狗屎的事，哦，还要写个 OS，支持那些我觉得很有道理的支持。

明年就 2021 了。

梦仍然没有醒。



[^9]: [A Story About Writing Scripts with Go - Eyal Posener's Blog](https://posener.github.io/go-shebang-story/) 
[^10]:  [一次使用Go语言编写脚本的经历-InfoQ](https://www.infoq.cn/article/mbzyz8sedtbz5*4mhizo) 
[^11]:  [Is it possible to run Go code as a script? - Stack Overflow](https://stackoverflow.com/questions/41542941/is-it-possible-to-run-go-code-as-a-script) 



## 🔚



