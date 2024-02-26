---
layout: single
title: '嵌套 go.mod 有可能吗'
date: 2023-02-25 00:30:11 +0800
last_modified_at: 2023-02-25 00:45:11 +0800
Author: hedzr
tags: [golang]
categories: golang
comments: true
toc: true
header:
  image: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/nested-go.mod-is-is-possible.png
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/nested-go.mod.png
  overlay_image: /assets/images/unsplash-image-1.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  找到逃脱的办法 ...
---



## 如何使得嵌套 go.mod 可行

![nested-go.mod-is-is-possible](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/nested-go.mod-is-is-possible.png)

### 场景

一个典型的例子，当我发布 [go-sockellib](https://github.com/hedzr/go-sockerlib) 时，我的这个 library 本身并没有什么三方包依赖，嗯，除了我自己的 log 和 errors 之外。同时我也附带了 `examples/` 目录。现在问题来了，examples 中演示了用在 gin 甚至 gorilla 的场景（举个例子，不要在意），结果，我的 socketlib 的依赖关系中不得不带上这些三方包。此外，不管我愿不愿意，所有的 test 包也都混入进来，这就促使我根本不去使用那些优秀的测试框架，例如 assertion 库等等。假如我用到了它们中的一个，尽管这和 socketlib 核心库代码没有什么关系，但 license 扫描仍然会提示我需要去解决潜在的许可证协调性问题，那只是测试包哦。我承认，测试包它也是包，许可证当然也应该被正确评估。

这也没啥。那么，examples 以及 tests 也别用第三方库就好了。

这样的做法可能稍微有点傻。



### Way 1

所以一个隐藏的技巧是使用前缀 `_` 文件夹，即 `_examples/` 目录名，这种技巧能够阻断其中的代码被 go mod tidy 所扫描。这个技巧在 go 1.20 下测试是正常运作的（其实它普遍工作在 go 1.11-1.20）。

其代价是 `_examples` 中的代码也就无法编译了。因为它们的依赖关系没有地方去做解决。



### Hack 2

其次，Golang 编译器有一个未公开的“特性”：子目录中的 go.mod 能够阻断 依赖关系 向上级目录传递。

> 在早期版本的 go 1.11-1.1？，我多次遇到问题：
>
> 1. 子 mod 的依赖仍然向上传递
> 2. 警告不能使用嵌套的 go.mod
>
> 然而今天我尝试复现它们却不成功。

如上面的 quote 所提到的，有时候这个特性似乎 broken 了，有时候根本不被支持。更多时候它并不如预期般的良好工作。

> 这就是我对 golang 开发团队感到抱歉的地方，他们真的是随随便便就做了。同时他们还有大道理占住了。

所以我想定论的是，在今天的 go 1.20 版本，上述特性，即阻断传播，是能够工作的，但要限于依赖关系足够简单。太复杂的情况下，将会产生 import 链接破损的问题。

唯一的前提是，你的代码的参考关系不那么复杂，没有导致 go.mod+go.work 体系的崩溃。



### Hack 3

我无法预估一个现实的复杂大规模项目能够有多么复杂，所以你仍然可能遇到问题。也就是上面提及的崩溃问题，它表现为依赖的外部包的关系无从解决，尽管 go mod tidy 将这些包扫出并写入了 go.mod 中也没有用处。

自 go 1.18 引入 go.work 以来，如果你继续遇到问题，还可以采取 go.work 的方式来解决依赖关系。

例如在上面的 `examples/` 文件夹中放入一个 `go.work`，包含如下内容：

```go
go 1.20

use(
  .
  ..
)
```

这个技巧对于你的 repo 是私有的情况可能是有用的，因为它或许可以避免 go mod/build 去实际查询和尝试拉取一个私有 repo。

我说“也许”，实在是因为我也没有什么把握。

有时候你可能还需要加上更多的 helpers：

```go
go 1.20

use(
  .
  ..
)

replace "github.com/user/private-go-lib" => ..
```

需要提及的是，如果你使用了上述的一系列的 hacks 来使能多个嵌套的 go.mod 的话，那么 `go test ./...` 或者 `go build ./...` 这样的助记符就可能无法生效了。



### Hack 4

即使混合了前面所有的 hacks，你仍然可能遇到 import 问题，具体可能表现在大部分操作都工作，但少量的几个顽固的包不知为何 import links 破损了，导致整体无法工作。

终极的方法——有点无赖，但是管用——就是删除顶层的 go.mod 仅保留任何子目录中的。这样做，等于是完全不采用 go.mod 嵌套问题。其唯一的问题，大概就是从顶层目录再也无法直接发出 go build/test 等命令了，你必须切人到每个子目录中去做。但是这个问题可以使用我们的 [bgo](https://github.com/hedzr/bgo) 来帮你简化一下：bgo run/test 现在是等价于 go run/test 的，而 bgo/bgo build 则是通过一个配置文件（也可以省缺）解决了逐个进入子目录进行构建的问题。



### 后话

开始的时候我们还提到了 test 三方包的问题。

采用一个子目录 tests/ 中加上 go.mod 的方式，这个问题同样可以解决。这里有一个衍生的隐含约定：当我们需要用到三方测试工具的时候，我们当然是在做包外测试，也就是仅对一个包的公开接口做黑盒，而不是去测试包内的私有函数。

也就是说，单元测试就是单元测试，它应该纯粹一点。

很多团队写单元测试已经写的啥都混入了，远程请求、等待响应等等，这些其实往往都是集成测试的范畴了，应该区别出去。

单元测试做的是具体实现片段的验证，完整的业务逻辑就应该交给别人去做。



## 后记

扫尾例行要总结一下。

上面提供的都是非正式方案，除了 hack 4 之外。也就是说，有限度地用一下，有时候能解决一些问题，但还是不推荐。除了非官方的原因之外，也是因为这些 hacks 不稳定，有时候灵、有时候不。

对于我们一开始提到的 library+examples 的场景，由于依赖关系通常比较简单，所以使用起来应该不容易遇到问题的。但是那样就可能给你的 library 的用户带来困扰，所以还是不推荐。那么此时怎么办？最好的办法是使用 Hack 1，这个方法除了不能编译 examples 之外，是最安全且受到官方支持的方法。解决 examples/apps 的编译构建问题是通过构建脚本临时地为 examples 建立一个 go.mod 从而当作一个常规的外部模块来操作。

而最后的总结的总结是：

不要使用嵌套 go.mod

那样很危险。



## 后后记

2024 年，随着 go 1.21 的 go.work 具体表现更加稳定，现在我们有了比较靠谱的嵌套 go.mod 组织方法。这在我的 [hedzr/go-socketlib](https://github.com/hedzr/go-socketlib) 上做了公开实践。实际上在内部（私有）环境中它的表现也没有问题，请查阅更新的博文：

[go.work 在开源库开发中的运用](https://hedzr.com/golang/arch/go-work-for-library-dev/)

那边介绍这个思路。

这个也不算我的发明，大约要算个综合体了吧，因为这么实践的、或者基本类似的实例也很多了。



🔚