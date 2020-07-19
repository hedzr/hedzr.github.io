---
layout: single
title: '从 flag 迁移到 cmdr'
date: 2020-07-17 22:15:11 +0800
last_modified: 2020-07-19 18:00:00 +0800
Author: hedzr
tags: [commander, command-line, "command-line-parser", command-line-interface,  getops, posix, posix-compatible, hierarchical-configuration, hierarchy, cli, golang]
categories: golang cmdr others
comments: true
toc: true
header:
  overlay_image: /assets/images/cmdr/help-screen.png
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Migrating to cmdr ...

#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---



# 从 `flag` 迁移到 `cmdr`

> 一个早期的版本已经发布在 juejin 和 segmentfault。本文是很久以后的修改版，一方面是订正错误，另一方面是集中我的文档到一个地方。

采用一个新的命令行解释器框架，最痛苦地莫过于编写数据结构或者流式定义了。我们首先回顾一下  [`cmdr`](https://github.com/hedzr/cmdr) 和其它大多数三方增强命令行解释器都支持的最典型的两种命令行界面定义方式，然后再来研究一下 [`cmdr`](https://github.com/hedzr/cmdr) 新增的最平滑的迁移方案。



## 典型的方式

### 通过结构数据体定义

有的增强工具（例如 cobra，viper）采用结构体数据定义方式来完成界面指定，如同 [`cmdr`](https://github.com/hedzr/cmdr) 的这样：

```go
rootCmd = &cmdr.RootCommand{
    Command: cmdr.Command{
        BaseOpt: cmdr.BaseOpt{
            Name:            appName,
            Description:     desc,
            LongDescription: longDesc,
            Examples:        examples,
        },
        Flags: []*cmdr.Flag{},
        SubCommands: []*cmdr.Command{
            // generatorCommands,
            // serverCommands,
            msCommands,
            testCommands,
            {
                BaseOpt: cmdr.BaseOpt{
                    Short:       "xy",
                    Full:        "xy-print",
                    Description: `test terminal control sequences`,
                    Action: func(cmd *cmdr.Command, args []string) (err error) {
                        fmt.Println("\x1b[2J") // clear screen

                        for i, s := range args {
                            fmt.Printf("\x1b[s\x1b[%d;%dH%s\x1b[u", 15+i, 30, s)
                        }

                        return
                    },
                },
            },
            {
                BaseOpt: cmdr.BaseOpt{
                    Short:       "mx",
                    Full:        "mx-test",
                    Description: `test new features`,
                    Action: func(cmd *cmdr.Command, args []string) (err error) {
                        fmt.Printf("*** Got pp: %s\n", cmdr.GetString("app.mx-test.password"))
                        fmt.Printf("*** Got msg: %s\n", cmdr.GetString("app.mx-test.message"))
                        return
                    },
                },
                Flags: []*cmdr.Flag{
                    {
                        BaseOpt: cmdr.BaseOpt{
                            Short:       "pp",
                            Full:        "password",
                            Description: "the password requesting.",
                        },
                        DefaultValue: "",
                        ExternalTool: cmdr.ExternalToolPasswordInput,
                    },
                    {
                        BaseOpt: cmdr.BaseOpt{
                            Short:       "m",
                            Full:        "message",
                            Description: "the message requesting.",
                        },
                        DefaultValue: "",
                        ExternalTool: cmdr.ExternalToolEditor,
                    },
                },
            },
        },
    },

    AppName:    appName,
    Version:    cmdr.Version,
    VersionInt: cmdr.VersionInt,
    Copyright:  copyright,
    Author:     "xxx <xxx@gmail.com>",
}
//... More
```

它的问题在于，如果你有 docker 那样的较多的子命令以及选项需要安排的话，这个方案会相当难定位，写起来也很痛苦，改起来更痛苦。







### 通过结构 Tag 方式定义

这种方式被有一些第三方解释器所采用，可以算是比较有价值的定义方式。其特点在于直观、易于管理。

它的典型案例可能是这样子的：

```go
type argT struct {
	cli.Helper
	Port int  `cli:"p,port" usage:"short and long format flags both are supported"`
	X    bool `cli:"x" usage:"boolean type"`
	Y    bool `cli:"y" usage:"boolean type, too"`
}

func main() {
	os.Exit(cli.Run(new(argT), func(ctx *cli.Context) error {
		argv := ctx.Argv().(*argT)
		ctx.String("port=%d, x=%v, y=%v\n", argv.Port, argv.X, argv.Y)
		return nil
	}))
}
```



不过，由于 `cmdr` 没有打算支持这种方案，所以这里仅介绍到这个程度。

> 说明一下，`cmdr` 之所以不打算支持这种方案，是因为这样做好处固然明显，坏处也同样令人烦恼：复杂的定义可能会因为被嵌套在 Tag 内而导致难以编写，例如多行字符串在这里就很难过。





### 通过和 `flag` 相同的界面定义

这些解释器采用了完全等价于 `flag` 的方式，只是提供了更多的例如子命令的支持方案。不过随着 flag 自身的升级并支持了子命令之后，它们的作用就比较有限了。

```go
// 示例请看稍后的章节
```





### 通过流式调用链方式定义

比结构体数据定义方案更好一点的是采用流式调用链方式。它可能长得像这样：

```go
func buildRootCmd() (rootCmd *cmdr.RootCommand) {
	root := cmdr.Root(appName, cmdr_examples.Version).
		// Header("fluent - test for cmdr - no version - hedzr").
		Copyright(copyright, "hedzr").
		Description(desc, longDesc).
		Examples(examples)
	rootCmd = root.RootCommand()
  AddFlags(root)
	return
}

func AddFlags(root cmdr.OptCmd) {
	// tags sub-commands

	parent := root.NewSubCommand("flags", "f").
		Description("flags demo", "").
		Group("").
		Action(flagsAction)

	cmdr.NewBool(false).
		Titles("bool", "b").
		Description("A bool flag", "").
		Group("").
		AttachTo(parent)

	cmdr.NewInt(1).
		Titles("int", "i").
		Description("A int flag", "").
		Group("1000.Integer").
		AttachTo(parent)
	cmdr.NewInt64(2).
		Titles("int64", "i64").
		Description("A int64 flag", "").
		Group("1000.Integer").
		AttachTo(parent)
	cmdr.NewUint(3).
		Titles("uint", "u").
		Description("A uint flag", "").
		Group("1000.Integer").
		AttachTo(parent)
	cmdr.NewUint64(4).
		Titles("uint64", "u64").
		Description("A uint64 flag", "").
		Group("1000.Integer").
		AttachTo(parent)

	cmdr.NewFloat32(2.71828).
		Titles("float32", "f", "float").
		Description("A float32 flag with 'e' value", "").
		Group("2000.Float").
		AttachTo(parent)
	cmdr.NewFloat64(3.14159265358979323846264338327950288419716939937510582097494459230781640628620899).
		Titles("float64", "f64").
		Description("A float64 flag with a `PI` value", "").
		Group("2000.Float").
		AttachTo(parent)
	cmdr.NewComplex64(3.14+9i).
		Titles("complex64", "c64").
		Description("A complex64 flag", "").
		Group("2010.Complex").
		AttachTo(parent)
	cmdr.NewComplex64(3.14+9i).
		Titles("complex128", "c128").
		Description("A complex128 flag", "").
		Group("2010.Complex").
		AttachTo(parent)

	// a set of booleans

	cmdr.NewBool().
		Titles("single", "s").
		Description("A bool flag: single", "").
		Group("Boolean").
		EnvKeys("").
		AttachTo(parent)

	cmdr.NewBool().
		Titles("double", "d").
		Description("A bool flag: double", "").
		Group("Boolean").
		EnvKeys("").
		AttachTo(parent)

	cmdr.NewBool().
		Titles("norway", "n", "nw").
		Description("A bool flag: norway", "").
		Group("Boolean").
		EnvKeys("").
		AttachTo(parent)

	cmdr.NewBool().
		Titles("mongo", "m").
		Description("A bool flag: mongo", "").
		Group("Boolean").
		EnvKeys("").
		AttachTo(parent)

	// others

	cmdr.NewString().
		Titles("string-value", "sv", "str", "string").
		Description("A string flag", "").
		Group("").
		EnvKeys("").
		AttachTo(parent)

	cmdr.NewDuration(time.Second).
		Titles("time-duration-value", "tdv").
		Description("A time duration flag: '3m15s', ...", "").
		Group("").
		EnvKeys("").
		AttachTo(parent)

	// arrays

	cmdr.NewIntSlice(1, 2, 3).
		Titles("int-slice-value", "isv").
		Description("A int slice flag: ", "").
		Group("Array").
		EnvKeys("").
		AttachTo(parent)

	cmdr.NewStringSlice("quick", "fox", "jumps").
		Titles("string-slice-value", "ssv").
		Description("A string slice flag: ", ``).
		Group("Array").
		EnvKeys("").
		Examples(``).
		AttachTo(parent)

}

//...More
```

这种方式很有效地改进的痛苦之源。要说起来，也没有什么缺点了。所以这也是 [`cmdr`](https://github.com/hedzr/cmdr) 主要推荐你采用的方案。

> cmdr  的早期版本采用另一种方式做标志（Flag）的定义，基本无差别：
>
> ```go
> 	mx.NewFlagV("", "test", "t").
> 		Description("the test text.", "").
> 		EnvKeys("COOLT", "TEST").
> 		Group("")
> 	mx.NewFlagV("", "password", "pp").
> 		Description("the password requesting.", "").
> 		Group("").
> 		Placeholder("PASSWORD").
> 		ExternalTool(cmdr.ExternalToolPasswordInput)
> ```
>
> 但现在我们推荐你采用前面的 `cmdr.NewXXX()...AttachTo(optCmd)` 的语义方案。



## `cmdr` 的兼容 `flag` 的定义方式

那么，我们回顾了两种或者三种典型的命令行界面定义方式之后，可以发现他们和 `flag` 之前的区别是比较大的，当你一开始设计你的 app 时，如果为了便宜和最快开始而采用了 `flag` 方案的话（毕竟，这是golang自带的包嘛），再要想切换到一个增强版本的话，无论哪一个都会令你痛一下。

### `flag` 方式

我们看看当你采用 `flag` 方式时，你的 main 入口可能是这样的：

```go
// old codes

package main

import "flag"

var (
  	serv           = flag.String("service", "hello_service", "service name")
  	host           = flag.String("host", "localhost", "listening host")
  	port           = flag.Int("port", 50001, "listening port")
  	reg            = flag.String("reg", "localhost:32379", "register etcd address")
  	count          = flag.Int("count", 3, "instance's count")
  	connectTimeout = flag.Duration("connect-timeout", 5*time.Second, "connect timeout")
)

func main(){
      flag.Parse()
      // ...
}
```



### 迁移到 `cmdr`

为了迁移为使用 `cmdr`，你可以简单地替换 `import "flag"` 语句为这样：

```go
import (
  // “flag”
  "github.com/hedzr/cmdr/flag"
)
```



其它内容一律不变，也就是说完整的入口现在像这样：

```go
// new codes

package main

import (
  // “flag”
  "github.com/hedzr/cmdr/flag"
)

var (
  	serv           = flag.String("service", "hello_service", "service name")
  	host           = flag.String("host", "localhost", "listening host")
  	port           = flag.Int("port", 50001, "listening port")
  	reg            = flag.String("reg", "localhost:32379", "register etcd address")
  	count          = flag.Int("count", 3, "instance's count")
  	connectTimeout = flag.Duration("connect-timeout", 5*time.Second, "connect timeout")
)
  
func main(){
    flag.Parse()
    // ...
}
```



怎么样，足够简单吧？



## 引入增强特性

那么我们现在期望引入更多 `cmdr` 专有特性怎么办呢？

例如想要全名（完整单词）作为长选项，补充短选项定义，这可以通过如下的序列来达成：

```go
import (
    // “flag”
  	"github.com/hedzr/cmdr"
  	"github.com/hedzr/cmdr/flag"
)

var(
    // uncomment this line if you like long opt (such as --service)
    treatAsLongOpt = flag.TreatAsLongOpt(true)
  
    serv = flag.String("service", "hello_service", "service name",
                       flag.WithShort("s"),
                       flag.WithDescription("single line desc", `long desc`))
)
```

类似的可以完成其他增强特性的定义。



## 可用的增强特性

所有 `cmdr` 特性被浓缩在几个少量的接口中了。此外，某些特性是当你使用 `cmdr` 时就立即获得了，无需其它表述或设定（例如短选项的组合，自动的帮助屏，多级命令等等）。

所有的这些需要指定适当参数的特性，包含在如下的这些定义中：

### 对于标志

#### `flag.WithTitles(short, long string, aliases ...string)`

定义短选项，长选项，别名。

综合来说，你必须在某个地方定义了一个选项的长名字，因为这是内容索引的依据，如果长名字缺失，那么可能会有意料之外的错误。

别名是随意的。

如果可以，尽可能提供短选项。

短选项一般来说是一个字母，然而使用两个甚至更多字母是被允许的，这是为了提供多种风格的命令行界面的兼容性。例如 `wget`, `rar` 都采用了双字母的短选项。而 golang `flag` 自身支持的是任意长度的短选项，没有长选项支持。`cmdr` 在短选项上的宽松和兼容程度，是其它几乎所有第三方命令行参数解释器所不能达到的。

#### `flag.WithShort(short string)`

提供短选项定义。

#### `flag.WithLong(long string)`

提供长选项定义。

#### `flag.WithAliases(aliases ...string)`

提供别名定义。别名是任意多、可选的。

#### `flag.WithDescription(oneLine, long string)`

提供描述行文本。

`oneLine` 提供单行描述文本，这通常是在参数被列表时。`long` 提供的多行描述文本是可选的，你可以提供空字串给它，这个文本在参数被单独显示帮助详情时会给予用户更多的描述信息。

#### `flag.WithExamples(examples string)`

可以提供参数用法的命令行实例样本。

这个字串可以是多行的，它遵照一定的格式要求，我们以前的文章中对该格式有过描述。这样的格式要求是为了在 man/info page 中能够获得更视觉敏锐的条目，所以你可以自行判定要不要遵守规则。

#### `flag.WithGroup(group string)`

命令或者参数都是可以被分组的。

分组是可以被排序的。给 `group` 字串一个带句点的前缀，则这个前缀会被切割出来用于排序，排序规则是 A-Z0-9a-z 按照 ASCII 顺序。所以：

- `1001.c++`, `1100.golang`, `1200.java`, …;

- `abcd.c++`, `b999.golang`, `zzzz.java`, …;

是有顺序的。

由于第一个句点之前的排序用子串被切掉了，因此你的 `group` 名字可以不受这个序号的影响。

给分组一个空字串，意味着使用内置的 `空` 分组，这个分组被排列在其他所有分组之前。

给分组一个 `cmdr.UnsortedGroup` 常量，则它会被归纳到最后一个分组中。值得注意的是，最后一个分组，依赖的是 `cmdr.UnsortedGroup` 常量的具体值`zzzz.unsorted`，所以，你仍然有机会定义一个别的序号来绕过这个“最后”。

#### `flag.WithHidden(hidden bool)`

hidden为true是，该选项不会被列举到帮助屏中。

#### `flag.WithDeprecated(deprecation string)`

一般来说，你需要给 `deprecation` 提供一个版本号。这意味着，你提醒最终用户该选项从某个版本号开始就已经被废弃了。

> 按照 Deprecated 的礼貌规则，我们废弃一个选项时，首先标记它，并给出替代提示，然后在若干次版本迭代之后正式取消它。

#### `flag.WithAction(action func(cmd *Command, args []string) (err error))`

按照 `cmdr` 的逻辑，一个选项在被显式命中时，你可以提供一个即时的响应动作，这可能允许你完成一些特别的操作，例如为相关联的其它一组选项调整默认值什么的。

#### `flag.WithToggleGroup(group string)`

如果你打算定义一组选项，带有互斥效果，如同 radio button group 那样，那么你可以为它们提供相同的 `WithToggleGroup group name`，**这个名字和 `WithGroup group name` 没有任何关联关系**。

#### `flag.WithDefaultValue(val interface{}, placeholder string)`

提供选项的默认值以及占位符。

默认值的数据类型相当重要，因为这个数据类型时后续抽取该选项真实值的参考依据。

例如，int数据一定要提供一个 int 数值，Duration数据一定要提供一个 `3*time.Second` 这样的确切数值。

#### `flag.WithExternalTool(envKeyName string)`

提供一个环境变量名，例如 EDITOR。那么，如果该选项的 value 部分没有在命令行中被提供时，`cmdr` 会搜索环境变量的值，将其作为控制台终端应用程序运行，并收集该运行的结果（一个临时文件的文件内容）用于为该选项复制。

如同 `git commit -m` 那样。

#### `flag.WithValidArgs(list ...string)`

提供一个枚举表，用于约束用户所提供的值。

#### `flag.WithHeadLike(enable bool, min, max int64)`

当该选项被设定为 enable=true 时，识别用户输入的诸如 `-1973`, `-211` 之类的整数短选项，将其整数数值作为本选项的数值。

如同 `head -9` 等效于 `head -n 9` 那样。



#### `flag.WithEnvKeys(keys ...string)`

可以指定相关联的环境变量名。



#### `flag.WithOnSet(f func(keyPath string, value interface{}))`

指定 OnSet 回调函数。



### 命令和子命令

#### `flag.WithCommand(cmdDefines func(newSubCmd cmdr.OptCmd))`

定义一个子命令可以通过这种方式：

```go
flag.WithCommand(func(newSubCmd cmdr.OptCmd){
  newSubCmd.Titles("cert", "c", "certification").
    Group(...).
    Action(...)
})
```





## 结束语

还可以，写出来了这么多！

cmdr 提供的平滑迁移方案，说起来只是权宜之计。我们还是鼓励你直接采用我们新的流式调用方案，并直接利用 `Option Store` 来管理配置数据，而且充分利用这种方式提前完成配置参数表的设计（我们都会在一开始就建立配置文件的 yaml 格式，从而令配置参数具有更好的可读性，这也会从另一角度帮助你完善应用程序的架构和逻辑）。





🔚