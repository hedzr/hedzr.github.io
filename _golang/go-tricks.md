---
layout: single
title: 'Golang开发环境中的技巧'
date: 2020-09-07 00:07:11 +0800
last_modified_at: 2020-09-07 00:29:11 +0800
Author: hedzr
tags: [development, skills, tricks]
categories: develop tricks
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/215px-Go_Logo_Blue.svg.png
  overlay_image: /assets/images/unsplash-image-1.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  对于Golang 开发环境相关的小的技巧很难再被记住了，所以只好收录在某处 ...

#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---



# Golang 开发环境中的技巧

> 对于Golang 开发环境相关的小的技巧很难再被记住了，所以只好收录在某处



## Golang goarch list

https://stackoverflow.com/questions/20728767/all-possible-goos-value

Note that those values are defined in [`src/go/build/syslist.go`](https://github.com/golang/go/blob/master/src/go/build/syslist.go).

With Go 1.5 (Q3 2015), `GOARCH` will become *much* more complete.
See [commit 1eebb91](https://github.com/golang/go/commit/1eebb91a5828c26532125b9464c92f721cd79d0f) by [Minux Ma (`minux`)](https://github.com/minux)

> ## `go/build`: reserve `GOARCH` values for *all* common architectures
>
> Whenever we introduce a new `GOARCH`, older Go releases won't recognize them and this causes trouble for both our users and us (we need to add unnecessary build tags).
>
> Go 1.5 has introduced three new GOARCHes so far: `arm64 ppc64 ppc64le`, we can take the time to introduce GOARCHes for all common architectures that Go might support in the future to avoid the problem.

```golang
const goosList = "android darwin dragonfly freebsd linux nacl \ 
  netbsd openbsd plan9 solaris windows "

const goarchList = "386 amd64 amd64p32 arm arm64 ppc64 ppc64le \
   mips mipsle mips64 mips64le mips64p32 mips64p32le \ # (new)
   ppc s390 s390x sparc sparc64 " # (new)
```

The list is still being review in [Change 9644](https://go-review.googlesource.com/#/c/9644/), with comments like:

> I wouldn't bother with Itanium. It's basically a dead architecture.
> Plus, it's so hard to write a compiler for it that I really can't see it happening except as a labor of love, and nobody loves the Itanium.

The [**official documentation**](https://golang.org/doc/install/source#environment) now (GO 1.5+ Q3 2015) reflects that completed list.

------

Update 2018: as documented in [Giorgos Oikonomou](https://stackoverflow.com/users/1199408/giorgos-oikonomou)'s [answer](https://stackoverflow.com/a/50117892/6309), Go 1.7 (Q1 2016) has introduced the
**`go tool dist list`** command.
See [commit c3ecded](https://github.com/golang/go/commit/c3ecded729214abf8a146902741cd6f9d257f68c): it fixes [issue 12270](https://github.com/golang/go/issues/12270) opened in Q3 2015:

> To easier write tooling for cross compiling it would be good to programmatically get the possible combinations of GOOS and GOARCH.

This was implemented in [CL 19837](https://go-review.googlesource.com/c/go/+/19837)

> `cmd/dist`: introduce `list` subcommand to list all supported platforms

You can list in plain text, or in json:

```golang
> go tool dist list -json
[
        {
                "GOOS": "android",
                "GOARCH": "386",
                "CgoSupported": true
        },
        ...
]
```

As [Mark Bates tweeted](https://twitter.com/markbates/status/1177326527287107585):

> Bonus: Column output properly formatted for display:
>
> ```golang
> go tool dist list | column -c 75 | column -t
> ```





## Golang Build Tags

build tags,

build constraints,



Excersices

- https://www.digitalocean.com/community/tutorials/customizing-go-binaries-with-build-tags

Official

- https://golang.org/pkg/go/build/ : [go/build](http://golang.org/pkg/go/build/#pkg-overview) from Go Document

Refs

- ~~https://stackoverflow.com/questions/15214459/how-to-properly-use-build-tags~~
- [Dave Cheney: Using //+build to swtich between debug and release builds](http://dave.cheney.net/2014/09/28/using-build-to-switch-between-debug-and-release)
- 
- [http://stackoverflow.com/questions/15214459/how-to-properly-use-build-tags](https://stackoverflow.com/questions/15214459/how-to-properly-use-build-tags)
- [http://stackoverflow.com/questions/11354518/golang-application-auto-build-versioning](https://stackoverflow.com/questions/11354518/golang-application-auto-build-versioning)
- http://codegangsta.io/blog/2013/07/11/practical-go-build-tags/
- http://technosophos.com/2014/06/11/compile-time-string-in-go.html
- 
- https://ijayer.github.io/post/tech/code/golang/20180623-go_cmd_01_1_go-build-constraint/



在 `src/go/build/build.go` 中，ctxt.BuildTags 列举了全部可用的内置的 Tags。



### 语法规则

https://studygolang.com/articles/19280

1）只允许是字母数字或_

2）多个条件之间，空格表示OR；逗号表示AND；叹号(!)表示NOT

3）一个文件可以有多个+build，它们之间的关系是AND。如：

```
// +build linux darwin
// +build 386
等价于
// +build (linux OR darwin) AND 386
```

4）预定义了一些条件：
runtime.GOOS、runtime.GOARCH、compiler（gc或gccgo）、cgo、context.BuildTags中的其他单词

5）如果一个文件名（不含后缀），以 *_GOOS, *_GOARCH, 或 *_GOOS_GOARCH结尾，它们隐式包含了 构建约束

6）当不想编译某个文件时，可以加上`// +build ignore`。这里的`ignore`可以是其他单词，只是`ignore`更能让人知道什么意思

更多详细信息，可以查看`go/build/build.go`文件中`shouldBuild`和`match`方法。









🔚