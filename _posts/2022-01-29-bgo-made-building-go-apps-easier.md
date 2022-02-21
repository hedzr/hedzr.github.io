---
layout: single
title: 'bgo: 让构建 go 程序更容易'
date: 2022-01-29 05:00:01 +0800
last_modified_at: 2022-01-30 11:39:01 +0800
Author: hedzr
tags: [golang, compiler, build-tool]
categories: golang ci
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220130110150772.png
  overlay_image: /assets/images/unsplash-image-3.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  bgo 的目标是减少键击，帮助你更好地构建 go 应用程序 ...
---



## bgo

> 一句话了解：**bgo 管 exe 不管 lib**



### 前言

> **前言之前**:  
>
> 这次的前言很长，可以直接跳过。



[bgo](https://github.com/hedzr/bgo) 是一个构建辅助工具，它和已知的那些为 go 应用程序构建服务的工具没有多大的不同，都能支持在你的工作环境中交叉编译构建出 go 应用程序的执行文件。<!--MORE-->

---

尽管这个能力本来是 go build 自带所有，但这样外包装一次后的辅助性的构建工具可以让你节省大量的精力，无论是那些难以记忆的 go build 命令行参数也好，还是那些我们不得不用到的前准备，后处理步骤，例如 go generate，复制到某个公共地点，等等。

所以这就是 bgo 这样的工具的用途，省力。



#### 缘起

当然，为什么我要开发又一个辅助工具呢？

原因也不复杂，有这么几个：

我现在常常在一个大目录中弄一大堆小项目，也许只是试验一下某个功能，做某件事情，也许是因为我需要罗列一大堆 examples 给用户睇，总之很多就是了。但一个小的周期里，我通常聚焦在其中的某一个或者某两三个，为此，切换目录，构建就很疲惫了。Goland 倒是很贴心能让我省去这些命令行环境里的工作，但它的运行结果窗口不能支持全功能的键盘交互，所以有的行为我就只能开出一个终端来跑。当然还有很多别的是 Goland 一定做不了的，就不列举了，总之这是一个具体的问题。对此，为什么不 vscode 呢？你用过吗？你要知道 vscode 跑 goapp 只有调试跑某一个主程序的能力，想要不调试，或者想多个 apps，需要去它的嵌入终端里敲命令行的。另外，如果你不在 go.mod 那里打开工作区的话，vscode 会有很多问题——换句话说，vscode 顶多支持单个 go.mod 代表的模块。

另一个原因，是作为较为正式的发布，我可能频繁需要用到 -X 或者 go generate。对此，我原本有一个复杂的 Makefile 可以自动解决这些问题。不过他们对于我在大规模项目中也不怎么好用，因为我可能会有很多不同的目录对应不同的子模块。

再一个原因是构建时的顺序问题，我有时候需要有序地做一系列构建，而有时候我需要很快地构建单个 target 在 exeutable 模式下运行和检视结果。

当然还有其它原因，不过拉拉杂杂的就不说了。

你可以注意到主要的理由还是在于我在维护大型项目结构。为什么不切分成很多很多的 repos 呢？这又涉及到另一个问题：go modules 不支持多个嵌套的 go.mod。也就是说，如果你的上级目录有 go.mod，那么下级就不可以再有，这是个很复杂的情况，但终归对于你来说，这个限制是很硬的，所以这样的结构行不通：

```
/complex-system
  go.mod
  /api
    /v1
      go.mod
  /common
    go.mod
  /account
    go.mod
  /backends
    /order
      go.mod
    /ticket
      go.mod
```

这里只列举了部分目录结构，而且仅仅是个示意。

同样地，还是会有人说，每个 go.mod 都一个 repo 就好了丫。恩，是这样的，确实这样是可以的，也只能这样做。

完了之后就需要想办法解决依赖关系了。



go 1.18 的 go.work 对此没有什么帮助，甚至于很难用。



git submodules？很麻烦，很难用，会忘记状态，然后就杯具。



再来有人就会说，那就顶级一个 go.mod，其它的都不要用，只分出目录结构就好了。对的，在我几年前做类似的大规模项目时就是这么做的，但 api 的 protobuf 参考，common 的 etcd 参考，等等，混杂在一起，而且都是解决起来很麻烦的那种，最后弄得整个巨型项目臃肿不堪，而且毫无必要地混乱。



其实，曾经有一段时间，多个 go.mod 嵌套存在是可以马马虎虎运作的，但那个阶段很短，我忘记是在 1.13 还是哪个时期了，总之这是一个遥远的怀念了。那段时光里项目的构型我就满意，但后来重新顺应单 go.mod 也更痛苦。



#### 所以

理由说了一堆，但是 bgo 只解决了一部分问题，也就是很多小 apps 分布在一堆复杂的子目录中时的构建问题。

采用 bgo 的话，我们就可以用一个大的顶级目录来管理若干的子项目了，当然，由于 go modules 的限制在顶级目录是不能建立 go.mod 的（以免子目录中的 go.mod 出现问题），它只是起到聚集的作用，而我们利用 Goland 或者 vscode 打开这种结构时也都会很 OK。

现在的构型：

```
/atonal
  .bgo.yml
  /api
    /v1
      go.mod
  /common
    go.mod
  ...
```

你可以注意到，在顶级目录中包含一个 `.bgo.yml` 文件，这就是 bgo 的配置文件了，它可以通过 `bgo init` 经过扫描子目录之后自动生成，然后在这个基础上你可以进一步地调整。

唯一的问题是，它只收集 main 包所在的目录，也就是能够产出 executable 的那些目录，至于说你的带有 go.mod 的目录并不真的被纳入管理范围。

这是 bgo 的限制，但本也就是 bgo 的设计目标：我们是扫描和管理一系列的 CLI apps 并以一种较轻便的方式完成相应的构建。我们并不提供以 go.mod 为标志的多个 modules 的管理，这种功能要么我们另行设计一款工具来说，要么不做，免得哪天 google 发神经又搞一套 go.zone 出来——然而往往总是牛头不对马嘴。

> 当然，你可以为每个 go.mod 配一个 main.go 来让 bgo 兼管它。但总的来说，**bgo 管 exe 不管 lib**



#### 令人失望的 go 演进

话说 go.mod go.work 都有了，却全都不是对大型项目做解决的有效方案，而是仅仅局限在*我*的某一个 module 之中。

在 Go 的工程管理中，总是有很多问题：

- 私有 repos 的解决
- 问题 repo 或者遗失的 repo 的解决
- 复杂的多模块建设与组织
- 可怜的泛型，还不如没有呢
- 等等

讲真，我曾抱有很高的期待。但我和 yaml 那些人的心情估计是相似的，哇，泛型来了，哦，泛型走好。在这个领域里（自动类型解决，未知类型解决），golang 的泛型算得上是一无是处。按照目前的演进态势，也不可能期望它解决自由预判未知类型。



### 如何开始？

#### 安装

首先当然是要安装 bgo。

##### Releases

bgo 被设计为只需单个可执行文件即可开始工作，所以请在 [Releases](https://github.com/hedzr/bgo/releases) 下载预编译版本并放到你的搜素路径中。

##### go get

或者，你可以通过 go get 系统：

```bash
go get -u -v github.com/hedzr/bgo
```

##### From source code

![image-20220130101919648](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220130101919648.png)

##### Homebrew

homebrew 是可以的：

```bash
brew install hedzr/brew/bgo
```

其它平台的包管理暂不支持，因为这就是个小工具而已。

##### Docker

也可以使用 docker 方式运行，但稍微有点复杂，因为需要搭载本机卷上去：

```bash
docker run -it --rm -v $PWD:/app -v /tmp:/tmp -v /tmp/go-pkg:/go/pkg hedzr/bgo
```

这样就和执行原生 bgo 作用一致。

docker 容器版本可以从这些地方获取：

```bash
docker pull hedzr/bgo:latest
docker pull ghcr.io/hedzr/bgo:latest
```





#### 运行

在你想要构建的目录，运行 bgo。

例如我们在 [ini-op](https://github.com/hedzr/ini-op) 的源代码中运行它：

![image-20220128104835837](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220128104835837.png)

这就是最简便的开始。



### 特点

不过如果就是这样，有什么价值呢？命令行缩短器？

bgo 所能做的，特别在于~~两~~几处：

- tags 等等 go build 命令行太长太难于编辑
- 想要编排构建指令及其前后处理行为。例如加入后处理器，等等。
- 有一大堆子目录中都有 CLIs，但不想逐个构建、或者构建参数各有区别而不能一次性处理。
- 有一系列的 go modules，但想要统一编排。

这些目标，都可以通过配置文件来解决。



### 创建构建配置文件

bgo 以当前目录为基准，它会寻找当前目录下的 `.bgo.yml` 文件，载入其中的 projects 配置信息，然后按照特定的顺序依次构建。

由于我们强调有序性，因此 bgo 并不支持多个项目并行编译。

> 事实上，这种功能是无价值的，因为它只会降低整体的编译速度。

所以问题的第一个是，`.bgo.yml` 如何准备？

方法是，选择你的根目录来首次运行 bgo。

```bash
bgo -f --save          # Or: bgo init
mv bgo.yml .bgo.yml
```

这个命令会扫描全部子目录，然后编制一个构建配置表并保存为 `bgo.yml` 文件。

然后你可以选择重命名配置文件（这是被推荐的，防止错误运行了 `--save` 后带来的可能的副作用）。但如果你想，也可以保持文件名原样不变。

#### 同义词

```bash
bgo init
bgo init --output=.bgo.yml
```

如果你需要一份带注释的示例，请查阅：

[https://github.com/hedzr/bgo/blob/master/.bgo.yaml](https://github.com/hedzr/bgo/blob/master/.bgo.yaml)





### 开始构建

配置文件准备好之后，就可以跑了：

```bash
bgo
```

这就会将配置文件中的全部 projects 都给构建了。

> 事实上，如果没有配置文件，bgo 会自动扫描出第一个 main cli 并构建它。



### 采用不同的构建范围

bgo 支持三种范围，它们的区别在于如何处理配置文件中的 projects 以及是否扫描当前文件夹中的 projects：

```bash
  [Scope?]
  -a, --auto      ⬢ Build all modules defined in .bgo.yaml recursively (auto mode) [env: AUTO] (default=true)
  -f, --full      ⬡ Build all CLIs under work directory recursively [env: FULL](default=false)
  -s, --short     ⬡ Build for current CPU and OS Arch ONLY [env: SHORT] (default=false)
```

平时 bgo 在自动模式（`--auto`），此时仅配置文件中的 projects 被考虑纳入构建序列中。如果没有找到配置文件的话，bgo 会尝试扫描当前文件夹找出第一个 main app。

完整扫描模式（`--full`）会扫描当前文件夹中的全部可能的 projects。

而简短模式（`--short`） 只会从配置文件中提取第一个项目，不过，如果你的根目录中没有配置文件的话，它会扫描到首个 project 来构建。它的特别之处在于只有工作机的当前 GOOS+GOARCH 才会被构建。



除此之外，你可以显式指定一个名字来运行 bgo。bgo 会在配置表中检索同名的project 并单独对其运行构建序列。

```bash
bgo -pn whoami   # Or `--project-name`
```



在配置文件中，你可以设置 `disabled: true` 来禁止一个项目，或者禁止一个项目组。



### 对 projects 分组

多个 projects 可以划分为一个分组，好处是构建参数可以统一指定。例如：

```yaml
---
app:
  bgo:
    build:
      cgo: false

      projects:
        000-default-group:
          # leading-text:
          cgo: false
          items:
            001-bgo:   # <- project name
              name:    # <- app name
              dir: .
              gen: false
              install: true
              cgo: false
            010-jsonx: # <- project name
              name:    # <- app name
              dir: ../../tools/jsonx
```

例子中定义了一个 `default-group` 组，然后定义了 `bgo` 和 `jsonx` 两个 projects。

它们的名字前缀（如 `001-` 片段）被用于排序目的，在构建行为中会被忽略，不会被当作是名称的一部分。

项目组的构建配置设定（例如 cgo 参数）会被下拉应用到每个项目，除非你显式指定它；类似地，在 `app.bgo.build` 这一级也可以定义 cgo, for, os, arch 等等参数，它们具有更高一级的优先性。

示例片段中，cgo 这个参数在各级都有定义，项目级的 cgo 优先级最高。



### Project 的配置参数

除了 name, dir, package 字段之外，其它的参数都是公共的。也就是说，其它参数都可以被用于顶级或者项目组一级。



#### name, dir, package

每个 project 需要 dir 作为基本的定义，这是必须的：

```yaml
---
app:
  bgo:
    build:

      projects:
        000-default-group:
          # leading-text:
          items:
            001-bgo:   # <- project name
              name:    # <- app name
              dir: .
              package: # optional

```

可以采用 `../` 的相对路径的语法，跳出当前目录的限制。理论上说，你可以纳入一切项目。

bgo 会检测该目录中的 go.mod 以决定应否启动 go modules 编译。

每当具体执行 go build 时，总是会切换到 dir 所指向的位置，以此为基准，除非你指定了 `keep-workdir`，这个参数告诉 bgo 保持当前工作目录。你也可以使用 `use-workdir` 来为某个 project 特别指明一个 go build 时的基准工作目录。

`name` 可以被用于显式地指定项目的 app name，如果不指定，那么会从 project name 取值。project name 是开发者的工程管理用名，而 app name 是用给 end user 看的（以及，将被作为输出的 executable 的基本名字）。

`package` 是可选的，通常你不必手工指定它。通过 `bgo init` 扫描得来的结果里这个字段会被自动填写，但实际构建时它总是会被重新提取。



#### disabled

这个字段使得相应项目被跳过



#### disable-result

bgo 在完成了构建之后，自动 ll 结果的 executable。这个字段可以禁止 bgo 的这一行为。



#### keep-workdir, use-workdir

一般情况下，bgo 跳转到项目所在目录之后开始 `go build .`，然后再返回当前目录。

但 `keep-workdir` 允许你停留在当前目录（也即启动 bgo 时所在的目录），使用 `go build ./tools/bgo` 这样的句法进行构建。此时你可以设置 keep-workdir 为 true。

如果你想某个项目使用特定的一个基准目录（多半是因为那个基准目录才有 go.mod）的话，可以使用 `use-workdir` 字段指定一个。

```yaml
    use-workdir: ./api/v1
    keep-workdir: false
```





#### gen, install, debug, gocmd, cgo, race, msan, 

`gen` 决定了是否在 go build 前运行 go generate ./...

`install` 决定了是否将执行文件复制到 `$GOPATH/bin` 中，如同 `go install` 做的那样。

`debug` 会产出更大的可执行文件，而默认时会使用 -trimpath -s -w 这些典型配置来削减执行文件的尺寸。

`gocmd` 在你要使用不同的 go 版本执行构建时很有用，把它设置为指向你的特定版本的 go 执行文件即可。当大多数情况下你可能都会保持它为空。但如果你在哦某个文件夹中编制了一段需要泛型的试验代码时 gocmd 可能很有用。

`cgo` 决定了环境变量 `CGO_ENABLED` 的取值以及构建时是否使能 gcc 环节。注意 CGO 特性仅可用于当前 GOOS/GOARCH，对于交叉编译它不能被很好地支持。

`race` 表示是否打开竞态条件检测。

`msan` 被原样传递给 go build，以便产出内存诊断和审计代码。



#### 目标平台：`for`, `os`, `arch`

在配置文件中，可以指定要对哪些目标平台进行构建。

```yaml
---
app:
  bgo:
    build:
      # the predefined limitations
      # for guiding which os and arch will be building in auto scope.
      #
      # If 'bgo.build.for' is empty slice, the whole available 'go tool dist list'
      # will be used.
      #
      #for:
      #  - "linux/amd64"
      #  - "windows/amd64"
      #  - "darwin/amd64"
      #  - "darwin/arm64"

      # the predefined limitations
      os: [ linux ]

      # the predefined limitations
      #
      arch: [ amd64,"386",arm64 ]

```

注意这些键值也可以被用于 project-group 或者 project，例如这样：

```yaml
      projects:
        000-default-group:
          # leading-text:
          items:
            001-bgo:   # <- project name
              name:    # <- app name
              dir: .
              gen: true
              install: true
              # os: [ "linux","darwin","windows" ]
              # arch: [ "amd64" ]
              # for: [ "linux/riscv64" ]
```

for 会指定一个目标平台数组，每一个条目都是 os/arch 对。

但如果你指明了 os 和 arch 数组的话，它们俩会做笛卡尔积来产生最终的目标平台 martrix。



#### post-action，pre-action

可以指定 shell 脚本在 go build 之前或者之后执行。

一个 post-action 可能是像这样的：

```yaml
post-action: |
  if [[ "$OSTYPE" == *{ {.OS}}* && "{ {.Info.GOARCH}}" == { {.ARCH}} ]]; then
    cp { {.Output.Path}} $HOME/go/bin/
  fi
  echo "OS: $OSTYPE, Arch: { {.Info.GOARCH}}"

```

它使用了模板展开功能。相应的数据源来自于 我们的 `build.Context` 变量，这个变量的定义在文末会有一个描述。

具体而言，`{ {.Info.GOARCH}}` 代表着正在运行的 go runtime 值，即 `runtime.GOARCH`，而 `{ {.OS}}` 和 `{ {.ARCH}}` 是正在构建的目标的相应值。

> 由于 jekyll 模板展开的原因，所以所有的 `{ {` 都被插入了空格以防止文章发布失败。

##### post-action-file，pre-action-file

如果你想要，可以使用脚本文件。

##### 注意

这些设定仅用于每个 project，不支持被应用到 project-group 这一级。原因在于我们的代码实现中在最后阶段删除了 group 这个层级。





#### ldflags, asmflags, gcflags, tags

这些选填的参数将被传递给 go build 的相应命令行参数。

但是在我们这里，你应该将它们指定为数组形式，例如：

```yaml
---
app:
  bgo:
    build:
      ldflags: [ "-s", "-w" ]
```

指定了全局的 ldflags 参数，将被用到所有的 projects 构建时，除非你在某个 project 明确地指定了专属的 ldflags 版本。



#### extends

向正在构建的代码的特定包写入变量值，是通过 `go build -ldflags -X ...`  来达成的。同样的也有配置文件条目来简化这个问题：

```yaml
            001-bgo: # <- project name
              name:    # <- app name
              dir: tools/bgo
              gen: false
              install: true
              cgo: true
              extends:
                - pkg: "github.com/hedzr/cmdr/conf"
                  values:
                    AppName: "{ {.AppName}}"
                    Version: "{ {.Version}}"
                    Buildstamp: "{ {.BuildTime}}" # or shell it
                    Githash: "`git describe --tags --abbrev=16`"
                    # Githash: "{{.GitRevision}}"  # or shell it: "`git describe --tags --abbrev=9`"
                    GoVersion: "{ {.GoVersion}}"  # or shell it
                    ServerID: "{ {.randomString}}"

```

可以采用模板展开，也可以嵌入小的 shell 脚本。

但不鼓励写很多的脚本在这里。

示例中给出的是针对 [hedzr/cmdr](https://github.com/hedzr/cmdr) CLI app 的构建参数，但实际上它们是多余的：作为一家人，我们会自动尝试识别你的 go.mod 是不是包含了到 cmdr 的引用，从而决定了我们要不要自动填写这组参数。

很显然，在构建时写入包变量并不是 cmdr 专属的东西，所以你可以用它来做你的专属配置。



### 顶级的特有配置参数

在配置文件中，`app.bgo.build` 是配置项的顶层，在这一层可以指定排除目录和输出文件名模板：

```yaml
---
app:
  bgo:
    build:
      output:
        dir: ./bin
        # split-to sample: "{ {.GroupKey}}/{ {.ProjectName}}"
        #
        # named-as sample: "{ {.AppName}}-{ {.Version}}-{ {.OS}}-{ {.ARCH}}"

      # wild matches with '*' and '?'
      # excludes patterns will be performed to project directories.
      # but projects specified in .bgo.yml are always enabled.
      excludes:
        - "study*"
        - "test*"

```

`output` 块中可以指定 `named-as` 作为输出可执行文件名的模板，默认时 bgo 会采用 `{ {.AppName}}-{ {.OS}}-{ {.ARCH}}`。

`dir` 指明输出文件夹，可执行文件被指向这里。

当然你还可以指明 `split-to` 为每个 project 设定额外的子文件层次，例如可以是 `{ { .ProjecName}}`，等等。

`excludes` 是一个字符串数组，提供一组文件名通配符模板，和这些模板匹配的文件夹将不会被扫描。





### Build Context

在一些字段中我们允许你嵌入动态变量值，它们会根据每个项目的构建时而因应变化。例如 `{ {.AppName}}` 可以被展开为当前正在被构建的项目的 app name。

这些值被包含在 `build.Context` 的声明中。

下面给出 bgo 源代码的相应代码片段，因此我就不必再做解释了。

> 这里并非最新版本，目前仍在迭代中

```go
type (
	Context struct {
		WorkDir    string
		TempDir    string
		PackageDir string

		// Output collects the target binary executable path pieces in building
		Output PathPieces

		*Common
		*Info
		*DynBuildInfo
	}
)

type PathPieces struct {
	Path    string
	Dir     string
	Base    string
	Ext     string
	AbsPath string
}

type (
	Info struct {
		GoVersion   string // the result from 'go version'
		GitVersion  string // the result from 'git describe --tags --abbrev=0'
		GitRevision string // revision, git hash code, from 'git rev-parse --short HEAD'
		BuildTime   string //
		GOOS        string // a copy from runtime.GOOS
		GOARCH      string // a copy from runtime.GOARCH
		GOVERSION   string // a copy from runtime.Version()

		RandomString string
		RandomInt    int
		Serial       int
	}
  
	DynBuildInfo struct {
		ProjectName         string
		AppName             string
		Version             string
		BgoGroupKey         string // project-group key in .bgo.yml
		BgoGroupLeadingText string // same above,
		HasGoMod            bool   //
		GoModFile           string //
		GOROOT              string // force using a special GOROOT
		Dir                 string
	}
)

type (
	CommonBase struct {
		OS   string `yaml:"-"` // just for string template expansion
		ARCH string `yaml:"-"` // just for string template expansion

		Ldflags    []string `yaml:"ldflags,omitempty,flow"`    // default ldflags is to get the smaller build for releasing
		Asmflags   []string `yaml:"asmflags,omitempty,flow"`   //
		Gcflags    []string `yaml:"gcflags,omitempty,flow"`    //
		Gccgoflags []string `yaml:"gccgoflags,omitempty,flow"` //
		Tags       []string `yaml:"tags,omitempty,flow"`       //
		// Cgo option
		Cgo bool `yaml:",omitempty"` //
		// Race option enables data race detection.
		//		Supported only on linux/amd64, freebsd/amd64, darwin/amd64, windows/amd64,
		//		linux/ppc64le and linux/arm64 (only for 48-bit VMA).
		Race bool `yaml:",omitempty"` //
		// Msan option enables interoperation with memory sanitizer.
		//		Supported only on linux/amd64, linux/arm64
		//		and only with Clang/LLVM as the host C compiler.
		//		On linux/arm64, pie build mode will be used.
		Msan          bool   `yaml:",omitempty"`               //
		Gocmd         string `yaml:",omitempty"`               // -gocmd go
		Gen           bool   `yaml:",omitempty"`               // go generate at first?
		Install       bool   `yaml:",omitempty"`               // install binary to $GOPATH/bin like 'go install' ?
		Debug         bool   `yaml:",omitempty"`               // true to produce a larger build with debug info
		DisableResult bool   `yaml:"disable-result,omitempty"` // no ll (Shell list) building result

		// -X for -ldflags,
		// -X importpath.name=value
		//    Set the value of the string variable in importpath named name to value.
		//    Note that before Go 1.5 this option took two separate arguments.
		//    Now it takes one argument split on the first = sign.
		Extends      []PackageNameValues `yaml:"extends,omitempty"` //
		CmdrSpecials bool                `yaml:"cmdr,omitempty"`
	}

	PackageNameValues struct {
		Package string            `yaml:"pkg,omitempty"`
		Values  map[string]string `yaml:"values,omitempty"`
	}

	Common struct {
		CommonBase     `yaml:"base,omitempty,inline,flow"`
		Disabled       bool     `yaml:"disabled,omitempty"`
		KeepWorkdir    bool     `yaml:"keep-workdir,omitempty"`
		For            []string `yaml:"for,omitempty,flow"`
		Os             []string `yaml:"os,omitempty,flow"`
		Arch           []string `yaml:"arch,omitempty,flow"`
		Goroot         string   `yaml:"goroot,omitempty,flow"`
		PreAction      string   `yaml:"pre-action,omitempty"`       // bash script
		PostAction     string   `yaml:"post-action,omitempty"`      // bash script
		PreActionFile  string   `yaml:"pre-action-file,omitempty"`  // bash script
		PostActionFile string   `yaml:"post-action-file,omitempty"` // bash script
	}
)

```

最新版本请直接前往 [build package](https://github.com/hedzr/bgo/tree/master/internal/logic/build) 或者 [go.dev](https://pkg.go.dev/github.com/hedzr/bgo) 处查阅。

- [build package on go.dev](https://pkg.go.dev/github.com/hedzr/bgo@v0.2.17/internal/logic/build)



### 命令行的使用

bgo 是一个基于 [hedzr/cmdr](https://github.com/hedzr/cmdr) 的命令行程序，带有 cmdr 所支持的基本特性，例如自由的多级子命令参数输入与识别，等等。

![image-20220128180556300](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220128180556300.png)

总的来说，你应该以两个步骤来使用 bgo：

1. 利用 `bgo init` 生成一个 `bgo.yml` 模板，它组织了扫描到的 cli apps 到这个配置模板中，请将其改名为 `.bgo.yml` 便于 bgo 自动装载。

   bgo 会从若干自动位置查找 .bgo.yml 文件的存在。实际上它也会查看 bgo.yml，并且还会自动拓展到相应的 conf.d 文件夹中做自动装载与合并，所以你可以在 conf.d 中分离地为每个 project 编写一个 yaml 片段，这对于持续集成是很有好处的。

2. .bgo.yml 就绪之后（你可以手工编辑它以增添定制属性），直接使用 `bgo` 就能一次性构建。

在上述自动模式之外，也有一些离开自动模式临时特定操作的方式。

1. 如果 bgo 没有发现配置文件，我们会试着扫描当前文件夹来尝试构建。
2. 如果不想发生预期之外的构建行为，请带上 `--dry-run` 参数。

一些可能有用的命令行在下面列举出来，它们都是不必强求配置文件在场的——但是如前所述，配置文件能够以一种易于调整的格式让你充满了控制力，而命令行无论如何优化，也不能掩盖像 `-ldflags` 这样的控制参数的内容如此复杂与难以编辑。



为了缩短命令行输入，运行 bgo 时隐含着等价于执行 bgo build 子命令。也就是说，`bgo -s` 实质上实在执行 `bgo build -s`，将启动一个简短构建模式。

所以为了查看可能的命令行参数，你应该使用 `bgo build --help`。



#### 修订

由于实际命令是 `bgo build`，因此除了全局选项 -s, -f, -a 之外，使用其它 bgo build 选项（例如 bgo -os linux 等）将必须采用 `bgo build -os linux` 语法。

这一问题将在 cmdr v1.10.23+ 以及 bgo v0.3.23+ 得到解决，当前需要 bgo build 或者 bgo b。





#### 针对当前 GOOS/GOARCH 构建

```bash
bgo -s
bgo -s -pn project-one
```

其中后一种形式的目的是只针对当前 GOOS/GOARCH 编译 project-one 这个项目，忽略配置文件中的其它 projects。

如果没有配置文件，它会自动查找首个 main cli 然后进行构建。



#### 完整扫描模式

```bash
bgo -f
```

这时除了配置文件中定义的 projects 之外，bgo 会再次扫描文件夹下的所有 cli apps。

> 附加 `--save` 时则保存扫描结果到 `bgo.yml` 并退出。



#### 指定构建目标平台

例如仅编译指定目标平台 linux/386 执行文件，忽略配置文件中可能存在的其它目标平台定义：

```bash
bgo build --for linux/386
bgo -os linux -arch 386
```

两条命令的用途相同。

同时，可以通过多次指定来指明一个数组：

```bash
bgo -os linux --arch 386 --arch amd64,arm64
```

并且可以随意使用逗号分隔符（`,`）来告诉 bgo 识别数组列表，例如上例中实际上给出了一个包含三个 arch 的数组作为参数：`[ "386", "amd64", "arm64"]`。

> 此外，`for`、`os` 以及 `arch` 同时适用于长短参数形式，`--for` 或者 `-for` 都没问题，目的是为了降低记忆负担。

类似的，这样也是有效的：

```bash
bgo --for linux/386 --for darwin/am64
bgo --for linux/386,darwin/amd64
```





#### 指定构建项目名

```bash
bgo -pn bgo
```

> `bgo` 用作构建简称，是 `bgo build` 的缩短方式。

你可以同时限定项目名以及目标平台：

```bash
bgo -os linux,windows -arch 386,amd64 -pn project-one
```



#### 启用 Shell 自动完成

当前 bgo 能够提供 Shell 自动完成功能，输入 bgo 之后键击 <kbd>TAB</kbd> 即可。

![image-20220130092618399](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220130092618399.png)

以及

![image-20220130092701837](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220130092701837.png)

和

![image-20220130092728651](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220130092728651.png)



如果你是通过下载二进制执行文件的方式运行 bgo 的，需要一点步骤来启用 Shell 自动完成功能。

##### zsh

对于 zsh 环境，这样生成自动完成脚本：

```bash
$ bgo gen sh --zsh

# "/usr/local/share/zsh/site-functions/_bgo" generated.
# Re-login to enable the new zsh completion script.
```

如果 bgo 没有能找到放置 `_bgo` 完成脚本的位置，它会将脚本输出到控制台，你需要自行保存为 `_bgo` 然后放入你的 zsh 自动完成脚本搜索位置中。

> zsh 使用环境变量 fpath 来指示自动完成脚本应该放在什么地方。例如：
>
> ```bash
> ❯ print -l $fpath
> /Users/hz/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
> /Users/hz/.oh-my-zsh/custom/plugins/zsh-autosuggestions
> /Users/hz/.oh-my-zsh/plugins/z
> /Users/hz/.oh-my-zsh/plugins/docker
> /Users/hz/.oh-my-zsh/plugins/git
> /Users/hz/.oh-my-zsh/functions
> /Users/hz/.oh-my-zsh/completions
> /Users/hz/.oh-my-zsh/cache/completions
> /usr/local/share/zsh/site-functions
> /usr/share/zsh/site-functions
> /usr/share/zsh/5.7.1/functions
> ```
>
> `bgo` 将会自动解释这些路径位置并寻找最佳放置路径。然而如果由于写入权限或其它问题导致 `bgo` 无法成功写入的话，那么你需要手工操作。

你也可以生成该脚本到指定位置：

```bash
bgo gen sh --zsh -o /some/where/for/_bgo
```

##### bash

bash 自动完成脚本可以这样生成：

```bash
bgo gen sh --bash -o bgo.bash
mv bgo.bash /etc/autocompletion.d/bgo

# might be:
mv bgo.bash /usr/local/etc/bash_completion.d/bgo
```

不同的平台中所需的前提以及复制到的目标位置可能有轻微的不同，具体则自行查询系统管理员。



## 后记

bgo 看起来似乎有点用，但是它对你可能也并没有用处。

bgo 如像是个 modules 管理器和构建辅助工具，但实际上它并不是 modules 管理器，顶多只能算是 main packages 自动构建器吧。

所以重要的事说三遍：bgo 管 exe 不管 lib。



### 最后

最后不得不说，bgo 做的是很粗暴的，因为最初的念头只是想有一个 Disabled 标志可以毙掉某些 projects，然后就想有个 --project-name 做筛选，然后是 -os, -arch，然后又发觉有必要有 --for。

然后其实几乎已经失控了。

但总之它现在可以跑了。



#### 题图

![image-20220130110150772](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220130110150772.png)



#### 题外话

还有谁记得新蛋网吗？

突然看到些 news 是关于 newegg 的，原来它的美国母公司活得好好的，远不至于说是倒闭衰败，去年还上市了。

在这个年岁交替的时候，回首二十年来互联网上的变迁，心生感慨却难以挥发。



### REFs

- [GOOS/GOARCH combos on macOS - Marcelo Cantos](https://marcelocantos.com/posts/goos-goarch-survey/) 
- 项目：[https://github.com/hedzr/bgo](https://github.com/hedzr/bgo)
- 配置文件示例：[https://github.com/hedzr/bgo/blob/master/.bgo.yaml](https://github.com/hedzr/bgo/blob/master/.bgo.yaml)
- go.dev: [这里](https://pkg.go.dev/github.com/hedzr/bgo)
- Docker Hub： [hedzr/bgo - Docker Image | Docker Hub](https://hub.docker.com/r/hedzr/bgo) 



🔚