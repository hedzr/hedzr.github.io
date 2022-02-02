---
layout: single
title: 'bgo: 具备扩展性的 go 程序构建工具'
date: 2022-02-01 05:00:00 +0800
last_modified_at: 2022-02-02 13:55:00 +0800
Author: hedzr
tags: [golang, compiler, build-tool]
categories: golang ci
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220202111728058.png
  overlay_image: /assets/images/unsplash-image-3.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  bgo 现在不仅仅是个 main 包批量构建器了 ...
---



## bgo v0.3.0+



### 前言

我们已经在 [bgo: 让构建 go 程序更容易](https://hedzr.com/golang/ci/bgo-made-building-go-apps-easier/) 中介绍了 bgo 的基本能力。

经过几天的迭代，初步感觉到比较稳定了，因此发了 0.3.0 版本，作为是春节前的划断。

#### 新版本有了

节后嘛，得益于 [cmdr](https://github.com/hedzr/cmdr) 原有的 Aliases 功能的升级（除夕时遇到很多意外，都是忙乱惹的祸），[bgo](https://github.com/hedzr/bgo) 向着`不仅只是个 main 包批量构建器`迈出了一小步：

我们通过 Aliases 的方式提供了预建的 check-code-quanlities 功能。

这是 v0.3.1+ 之后提供的新功能。



### check-code-qualities 功能

这个功能是需要第三方工具的。当前需要 golint 和 gocyclo 在场，此外也需要 gofmt 工具。前两者需要提前安装：

```bash
go install golang.org/x/lint/golint
go install github.com/fzipp/gocyclo
```

当上述工具有效时，bgo 可以代为行使上述工具提供的质量检查功能：

```bash
bgo check-code-quanlities
bgo chk
# Or
bgo chk ./...
```

这个命令依次执行 gofmt, golint 以及 gocyclo 工具，对你的当前文件夹以及下级进行代码质量检测。

你可以附带参数如 `./...` 或者其它指定的文件夹偏移。

#### Homebrew

brew 版本预建了安装脚本，你需要更新 hedzr/brew Tap 然后 reinstall bgo。

由于 brew 通过 update 命令来更新它自己以及所有的taps，因此其效率可能太低下。我觉得，一个变通的方法是：

```bash
brew untap hedzr/brew
brew tap hedzr/brew
```

brew 现在会安装预置配置文件到 /usr/local/etc/bgo/。

后文我们会介绍其它环境应该怎么办。



### 正文

上面提到的功能，是依赖于 [cmdr](https://github.com/hedzr/cmdr) 的 Aliases 能力。因此我们对此有必要进行解释。

#### bgo 新版本的安装

首先来讲，现在 bgo 的 release 下载包中携带了一个 etc/bgo 子目录，你需要将其移动为 `$HOME/.bgo` 目录：

```bash
wget https://github.com/hedzr/bgo/releases/download/v0.3.3/bgo-darwin-amd64.tgz
tar -xf bgo-darwin-amd64.tgz
mv bin/bgo /usr/local/bin/bgo
mv etc/bgo ~/.bgo

# 如果使用 zsh 环境，重新生成自动完成脚本
bgo gen sh --zsh
```

现在在 `$HOME/.bgo` 目录包含了预建 aliases 命令的定义。

具体来讲，它（ `$HOME/.bgo/conf.d/80.aliases.yml` ）是这样的：

```yaml
app:

  aliases:
    # group:                                  # group-name (optional). such as: "别名".
    commands:
      # - title: list
      #   short-name: ls
      #   # aliases: []
      #   # name: ""
      #   invoke-sh: ls -la -G                # for macOS, -G = --color; for linux: -G = --no-group
      #   # invoke: "another cmdr command"
      #   # invoke-proc: "..." # same with invoke-sh
      #   desc: list the current directory

      - title: check-code-qualities
        short-name: chk
        # aliases: [check]
        # name: ""
        # group: ""
        # hidden: false
        invoke-sh: |
          echo "Command hit: { {.Cmd.GetDottedNamePath}}"
          echo "fmt { {.ArgsString}}"
          gofmt -l -s -w { {range .Args}}{ {.}}{ {end}}
          echo "lint { {.ArgsString}}"
          golint { {.ArgsString}}
          echo "cyclo ."
          gocyclo -top 20 .
        # invoke: "another cmdr command"
        # invoke-proc: "..." # same with invoke-sh
        shell: /usr/bin/env bash  # optional, default is /bin/bash
        desc: pre-options before releasing. typically fmt,lint,cyclo,...

```

想必我无需额外解释了。

> 正式发版时这个文件具有更多命令别名定义

这里提供了一套扩充机制（通过 shell 脚本片段），你可以继续扩充你自己的特定命令，透过 bgo 的命令系统来进一步简化构建前后的各种任务。

在上面的 yaml 代码中，解除 `title: list` 所在的 map 的注释即可使能一条 list 命令，这是 ls 的同义词。它当然没有实际意义，其目的在于向你解释怎么添加自己的另一条命令（或者另 n 条）。



#### 建立多级子命令系统

在 cmdr 的 [examples/fluent]([cmdr/examples/fluent at master · hedzr/cmdr · GitHub](https://github.com/hedzr/cmdr/tree/master/examples/fluent)) 的附带的配置文件 [91.cmd-aliases.yml](https://github.com/hedzr/cmdr/blob/master/ci/etc/fluent/conf.d/91.cmd-aliases.yml) 中，为你展示了如何通过 Aliases 能力构建自己的子命令系统：

```yaml
app:

  aliases:
    group:                                  # group-name (optional). such as: "别名".
    commands:
      - title: list
        short-name: ls
        # aliases: []
        # name: ""
        invoke-sh: ls -la -G                # for macOS, -G = --color; for linux: -G = --no-group
        # invoke: "another cmdr command"
        # invoke-proc: "..." # same with invoke-sh
        desc: list the current directory
      - title: pwd
        invoke-sh: pwd
        desc: print the current directory
      - title: services
        desc: "the service commands and options"
        subcmds:
          - title: ls
            invoke: /server/list            # invoke a command from the command tree in this app
            invoke-proc:                    # invoke the external commands (via: executable)
            invoke-sh:                      # invoke the external commands (via: shell)
            shell: /bin/bash                # or /usr/bin/env bash|zsh|...
            desc: list the services
          - title: start
            flags: []
            desc: start a service
          - title: stop
            flags: []
            desc: stop a service
          - title: git-version
            invoke-proc: git describe --tags --abbrev=0
            desc: print the git version
            group: Proc
          - title: git-revision
            invoke-proc: git rev-parse --short HEAD
            desc: print the git revision
            group: Proc
          - title: kx1
            invoke: /kb
            desc: invoke /kb command
            group: Internal
          - title: kx2
            invoke: ../.././//kb --size 32mb   # allow related path to seek a cmdr-command, and the ugly path is allowed (multiple slashes, ...)
            desc: invoke /kb command
            group: Internal
          - title: kx3
            invoke: /kb --size 2kb
            desc: invoke /kb command
            group: Internal
        flags:
          - title: name
            default: noname
            type: string          # bool, string, duration, int, uint, ...
            group:
            toggle-group:
            desc: specify the name of a service

```

不仅如此，甚至于你还能为子命令提供专属的 flag 选项。



#### 使用标志（Flag）选项

由于 invoke, invoke-proc, invoke-sh 字段都支持模板展开，所以你可以通过模板语法提取到某个 flag 的实际值，实际值是指用户在命令行输入的，又或是该 flag 的默认值。

一个示例的 aliases 定义可以是这样：

```yaml
      - title: echo
        invoke-sh: |
          # pwd
          echo "{ {$flg := index .Cmd.Flags 0}}{ {$dpath :=$flg.GetDottedNamePath}} { {$fullpath := .Store.Wrap $dpath}} { {$fullpath}} | { {.Store.GetString $fullpath}}"
        desc: print the name
        flags:
          - title: name
            default:              # default value
            type: string          # bool, string, duration, int, uint, ...
            group:
            toggle-group:
            desc: specify the name to be printed

```

该模板字符串序列几乎等价于 Golang 代码：

```go
flg := obj.Cmd.Flags[0]
dpath := flg.GetDottedNamePath()
fullpath := obj.Store.Wrap(dpath)
stringVal := obj.Store.GetString(dpath) // 从 cmdr Option Store 中抽出该选项的实际值，以字符串的形式
```

模板从上下文变量环境 obj 中得到命中的子命令 `echo`，即 `obj.Cmd`；类似的，`obj.Store` 获得 cmdr Option Store 的实例，然后是一系列 cmdr 接口调用，从而获得 cmdr 处理命令行参数后设置到 Option Store 中的 `--name` 的实际值。

其运行的效果类似于：

```bash
$ bgo echo --name watching
  app.echo.name | watching
```

其中，`echo` 子命令的完整的路径为 `app.echo`，`app` 是隐含的前缀，cmdr 使用这样的隐含的前缀来构筑一个名字空间，而 `Store.Wrap()` 正是为了给一般路径附上这样的前缀。

#### 更新你的自动完成脚本

在扩充了你的 aliases 之后，你需要更新自动完成脚本来反应变化。是的，Aliases   们是完全融入 bgo 命令系统中的，因此重新生成一次自动完成脚本，即可将 aliases 们纳入到自动完成的提示列表中。

![image-20220201014605480](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220201014605480.png)

一个示意图如上。



#### 小节

有了上面介绍的这些信息，你将可以在不必修改 bgo 源代码的情况下，自行扩充 bgo 了。

![image-20220202111546956](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220202111546956.png)

你可以尝试：

- 添加 cov（coverage）命令，简短快捷地做覆盖测试
- bench
- 增加前置脚本以便做资源文件打包
- 等等

>在新版本中，分发包中已经包含了 coverage 命令定义，不妨对比一下。
>
>或者直接浏览 repo 中的配置文件定义 [ci/etc/bgo/conf.d/80.aliases.yml](https://github.com/hedzr/bgo/blob/master/ci/etc/bgo/conf.d/80.aliases.yml)



`bgo` 希望做的是将不断重复的冗长的命令行缩短到一个或者两个子命令的程度，让每次工作在 6-8 击键之内。这比你充分利用 zsh 的自动完成以及上下翻页等功能还要有用得多。



具备 Aliases 融合能力后，现在说一句 `bgo: 富于扩展性的 go 程序构建工具` 大约勉强也能算作是名副其实了。

> 其实，我们尚未介绍由 cmdr 支持的 Extensions 特性，它允许你在特定的文件夹中存放一系列的文件夹和脚本文件，并将其融入既有的命令系统中，如同上面 Aliases 特性借助于 YAML 配置文件所做的那样。
>
> Cmdr 所提供的 Extensions，Aliases，以及 Addons 等外部扩展能力，一个主要的激发就来自于 git aliases，以及还在互联网之前的一些 DOS 应用程序的特色。
>
> 亲自复现出自己记忆中的那样的效果，肯定是对一个 developer 的最好的奖赏，养在深闺也无所谓了，我已经得到了我要的褒奖。
>
> **题外话**
>
> 我一直想要复刻一份 LIST 出来。只是一直没有精力动手。
>
> LIST.COM 是已故的 Vernon D. Buerg 所开发的 DOS shareware。这个工具是我做反向 TWAY 的时候的有力工具之一，恩，它倒不是亲自做反向的，只是一个文件列表器而已。





### 关于 bgo 的配置文件

#### 支持多种格式

同样是源自 cmdr 提供的支持，bgo 能够自动识别 json，toml 和 yml（或 yaml）后缀。

也就是说，在 一个工作目录中，存在 .bgo.yml 或者 .bgo.toml 都是可以的。尽管我们的示例中总是使用 yaml 向你讲解如何编写，但将其改变为不同的文件格式能够一样地生效。而 bgo 或者说 cmdr 则会自动加载它们。



#### 配置文件夹

你已经注意到，我们在 `$HOME/.bgo` 下提供了 bgo.yml，并且其中的子目录 conf.d 中提供了 80.aliases.yml。

按照 cmdr 的约定，一个配置文件目录中一定要有同名（即 `bgo`）的配置文件，至于后缀应该是 .json.toml.yml.yaml 中的一个。cmdr 的配置文件被分为三种类型：primary，secondary 以及 alternative。

对于 bgo 来说， `$HOME/.bgo` 是 primary 配置文件组的一个可能的位置，bgo 和 cmdr 会自动搜寻若干预定义的位置（包括 `/usr/local/etc/bgo` 以及 `$HOME/.bgo`）来试图加载 primary 配置文件，然后将其 `conf.d` 作为监视文件夹，并加载其中的任何 .json.toml.yml.yaml 。

> 所以，混用不同的配置文件格式也无所谓。



#### conf.d 自动配置文件夹

在主配置文件的目录里，conf.d 子目录是被监视的，这里面的任何配置文件都能够被自动重载。当然，对于 bgo 来说自动重载毫无意义。

但是你可以在这个文件夹里面添加一系列的配置文件，例如 alias-001.yml, alias-002.yml。这种结构对于 ci 操作或者说 devops 操作会是很方便的，你无需绞尽脑汁去编排脚本想一个 yaml 中添加一大段 yaml 片段，还要保证它们的嵌入位置适当，缩进层次适当。直接新增一个yml好了。



#### 辅助配置文件

至于当前工作目录下的 `.bgo.yml`，是作为 Alternative/Secondary 配置文件组的身份被载入的。

按照 cmdr 的约定，如果 .bgo.yml 被作为 Alternative 配置文件加载，则这个配置文件不含有子文件夹监视，并且可以开启自动配置文件回写功能。不过这个功能在 bgo 中并没有打开，因为回写功能会抹去配置文件中的注释部分，这可能往往并不是你所想要的。

之所以身份不定，是因此 cmdr 支持同时从 Primary/Seconary/Alternative 三个位置载入三组配置并合并到一起。尽管我们没有专门说明，bgo 在这里留有很多扩充的可能性。





### 在 `bgo init` 时改用不同格式

使用下面的语法，可以建立不同的配置文件格式：

```bash
bgo init --output=.bgo.yml
bgo init --output=.bgo.yaml
bgo init --output=.bgo.json
bgo init --output=.bgo.toml
```

输出文件名的后缀名决定了初始化操作将扫描结果存储为那一种配置文件格式。





## 后记

bgo 目前存在的问题：

- 没有 Windows 系统下的有力测试，因此不太确定配置文件的加载位置是否能被有效识别。
- 配置文件中的 bash shell 可能会在 windows 中改为 powershell 还是 cmd？我不太知道，或许需要少许调整才能工作。
  - FEEL FREE TO ISSUE ME

![image-20220202111728058](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220202111728058.png)

上次说到，这次是突然动念，直接就做的。然后找空去看了看 goxc，哎唷我去

看了，人家干脆都停更了。

顿时觉得前途喵喵啊。

为什么我觉得 go build 交叉编译并没有那么 simple 呢，或者说麻烦的很吧。唉，不管了，反正 bgo 就是这么个工具了。



### REFs

- 项目：[https://github.com/hedzr/bgo](https://github.com/hedzr/bgo)
- 依赖：[https://github.com/hedzr/cmdr](https://github.com/hedzr/cmdr)
- 配置文件示例：[https://github.com/hedzr/bgo/blob/master/.bgo.yaml](https://github.com/hedzr/bgo/blob/master/.bgo.yaml)
- go.dev: [这里](https://pkg.go.dev/github.com/hedzr/bgo)
- Docker Hub： [hedzr/bgo - Docker Image - Docker Hub](https://hub.docker.com/r/hedzr/bgo) 





🔚