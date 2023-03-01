---
layout: single
title: 'Tilde 展开以及命名目录'
date: 2021-1-9 21:46:00 +0800
last_modified_at: 2021-1-9 21:46:00 +0800
Author: hedzr
tags: [shell, bash, zsh, tilde expansion, named directory, named folder]
categories: devops shell
comments: true
toc: true
header:
  teaser: /assets/images/backslashes.png
  overlay_image: /assets/images/backslashes.png
  overlay_filter: rgba(0, 170, 255, 0.5)
excerpt: >-
  自定义你的文件夹缩写词，...

---



> crash zone:
>
> 今天崩溃两次，分别是 Nextcloud，zsh。现在 Nextcloud 我已经卸载了，全都用 iCloud 了，zsh 肿么办，挺急的，在线等。



## About Expansions

zsh 支持一系列的展开功能。

其中 Filename Expansion 是比较有趣的一项，因为它既常见，又总是被忽略。尤为重要的一个原因在于，用户面对到这些现象时，往往根本无从得知这样的特性究竟是叫做什么名字，用什么样的术语才能获得其求助信息。

像前面提到的波浪号展开特性，就是一个例子，你怎么才能找到正确的术语名称呢？







### ‘=’ expansion

作为一个示例，也作为一个引子，我们首先提一提 `=` 展开式。

```bash
$ ll =echo
-rwxr-xr-x  1 root  wheel   118K Jan  1  2020 /bin/echo
```

`=` 展开式可以被展开为可执行文件的完整路径。例如对于 echo 来说，相应的全路径为 `/bin/echo`。

`=` 展开式对 `$PATH` 中的可执行文件有效，如果不能被搜索到式不会展开的。一般来说，which 命令与其是等效的。

那么为什么编写脚本时我们很少使用 `=` 展开式形式呢？`=` 展开式的可用性由 `EQUALS` 选项来决定（对于 zsh 来说），所以它并不是一个保证能开箱即用的特性。而 which 是内建命令之一，符合 GNU 相关规范，为了脚本的可移植性我们还是会使用 which。类似的情形也出现在 `~` 和 `$HOME` 的使用时。

If a word begins with an unquoted ‘`=`’ and the `EQUALS` option is set, the remainder of the word is taken as the name of a command. If a command exists by that name, the word is replaced by the full pathname of the command.



## Named Folder

命名文件夹（Named Folder）也被称为 `Named Directories`。

> 在 Shell 世界中，通常术语 Folder 和 Directory 具有完全相同的含义。

在 zsh 中，有两种命名文件夹：Dynamic & Static named directories。动态的命名文件夹暂待以后论及。静态命名文件夹由你自行定义：

```bash
$ hash -d github="$HOME/Downloads/tmp"
$ ll ~github
```

`~github` 通过 `hash -d` 的方式被定义为一个命名文件夹，这一特性也被称作 Tilde 展开。

> 在 Shell 中有一系列的 Tilde 展开，那是一个专门的话题，但另行再论。

当前我们首先需要知道的是，`~github` 就是一个静态命名文件夹。所有的静态命名文件夹均可以在 `hash -d` 中被列出：

```bash
$ hash -d
4LINUX=/Volumes/FOR-LINUX
NC='~iCloud/Nextcloud.New'
iCloud='/Users/monid/Library/Mobile Documents/com~apple~CloudDocs'
github='/Users/monid/Downloads/tmp'
```

所以，借助一个波浪号前缀的展开特性，现在我们可以通过 ~github 来替代那串冗长的路径了。

> 除了命名文件夹之外，`z` 这样的扩展可以通过 Oh-my-zsh 的方式被加载，z 实际上间接提供了一种动态命名文件夹的能力。当然，这也不在本文范畴，以后有空再说吧。



### The Builtin Command - hash

> hash 同时适用于 bash 和 zsh，但这里以 zsh 为依据进行介绍。

`hash` 是一个专门的 builtin[^1] 命令。builtin 意味着这条命令没有任何额外损耗，它是纯内存的命令，如同 `alias`，`if` 等等一样，完全可以肆意滥用\^\-\^。所以我们可以在 .zshrc 中放入如下内容：

```bash
hash -d | grep -qE '^github=' || hash -d github="$HOME/Downloads/tmp"
```

这样，github 这个缩写就可以保证可用性了。

因为 `hash -d` 是无错误返回的，所以你也可以更粗暴一点，不必 grep，直接定义就好：

```sh
hash -d github="$HOME/Downloads/tmp"
```

这其实是更被推荐的，有利于缩减 zsh 的初次打开速度。

[^1]: [Shell Builtin Commands](http://zsh.sourceforge.net/Doc/Release/Shell-Builtin-Commands.html)

> 由于我们会经常性地利用 Terminal 和 Shell 环境来做很多事，所以一些常用的名字、变量、或者函数等等我们总会通过类似的方式来保证可用性。这样我们的脚本就具备可移植性了，因为在另一台服务器上，我们可以将一个单列的 `.startup.sh` 复制进去，然后执行一条指令就可以保证我们用得到的那些依赖能够生效：
>
> ```bash
> echo '. ~/.startup.sh' >> ~/.zshrc
> [[ -f ~/.bashrc ]] && echo '. ~/.startup.sh' >> ~/.bashrc
> ```
>
> 如何编写同时适用于 bash 和 zsh 的脚本是另外一个话题了，以后再说。

`hash` 有几个选项：

```
hash [ -dfmr ] [ name[=value ] ] ...
With no arguments or options, hash will list the entire command hash table. The `-m' option causes the arguments to be taken as patterns (they should be quoted) and the elements of the command hash table matching these patterns are printed. The `-r' option causes the command hash table to be thrown out and restarted. The `-f' option causes the entire path to be searched, and all the commands found are added to the hash table. These options cannot be used with any arguments. For each name with a corresponding value, put name in the command hash table, associating it with the pathname value. Whenever name is used as a command argument, the shell will try to execute the file given by value. For each name with no corresponding value, search for name in the path, and add it to the command hash table, and associating it with the discovered path, if it is found. Adding the `-d' option causes hash to act on the named directory table instead of the command hash table. The remaining discussion of hash will assume that the `-d' is given. If invoked without any arguments, and without any other options, hash -d lists the entire named directory table. The `-m' option causes the arguments to be taken as patterns (they should be quoted) and the elements of the named directory table matching these patterns are printed. The `-r' option causes the named directory table to be thrown out and restarted so that it only contains ~. The `-f' option causes all usernames to be added to the named directory table. These options cannot be used with any arguments. For each name with a corresponding value, put name in the named directory table. The directory name name is then associated with the specified path value, so that value may be referred to as ~name. For each name with no corresponding value, search for as a username and as a parameter. If it is found, it is added to the named directory hash table.

```

从前，我看到这么大段的英文时，总是具备一个人工智能的能力，那就是自动无视之。

可今次不行，因为在写文章嘛，所以我耐着性子研究了一番，用人话转译，它说：

`-m` 选项可以指定一个模式匹配串，然后 hash 就会只打印匹配的条目。

`-f` 选项会搜索给定的路径，并将全部命令（可执行文件）自动加入到 hash table 中。此外，所有的 linux 账户名也自动被加入，所以诸如 `~yourname` 等都是自动有效的。

`-d` 选项显式地定义一条条目，格式是 `name=value`。

`-r` 删除全部条目，只留下 `~` 这一条。这也是默认的状态，所以我们可以用 `~/.zshrc` 来表示 `$HOME/.zshrc` 即是源于这个映射。



> PS:
>
> hash 命令取决于不同的上下文，bash or zsh，以及 shell 的版本的不同，则其命令行参数可能会很不一样。
>
> 基本上来说，-d 和 -r 的表现是相同的。别的参数就未必有效了。



### Builtin Commands

之前我们给出了 zsh 内建命令的在线版本地址[^1]。这是因为 `man hash` 这样的指令只能显示一个概要介绍，完全没有在线版本中提供的细节。

实际上，我们也可以改造自己的 zsh 来提供同样详细的 man 手册，这一方法在 [Accessing On-Line Help](http://zsh.sourceforge.net/Doc/Release/User-Contributions.html#Accessing-On_002dLine-Help) (`man zshcontrib`) 中做了介绍。对于现行的发行版来说，你只需要在 `.zshrc` 加入以下语句就可以了，没有在线文档中说的那么复杂：

```sh
unalias run-help && autoload run-help
```

然后，你可以 `. ~/.zshrc` 立即应用变更，但我推荐你重新打开一个 Terminal，或者重新登录一次。接着就可以看看 `run-help hash` 的结果了，基本上和连线版本一摸一样，但代价就低得多了。

![image-20210109205242632](https://i.loli.net/2021/01/09/6DCHgnVxXhOUwvJ.png)

有的人爱扳，告诉我说 macOS 10.15 里 run-help 已经开箱即用了。其实他是有所误解：默认时 run-help=man，而默认时 man hash 只会显示一个缩略的介绍而不是全文。对于像内建命令这样的手册条目来说，我还是很需要详细解说版本的，这就是本小节被提供的意义之所在。

当然，从截图你也能看到，单单讲内建命令详细版手册的话，可以直接：

```sh
man zshbuiltins
man zshall
```

都可以。

不过，如果是一无所知的 newbie，我觉得他跟我一样不会知道 man 还有这样一个 entry 可用的。我知道 man something 就已经很能耐了好么？

那么，简版的 builtin 手册页怎么办呢，可以这样直达：

```sh
man builtin
```



## Tilde Expansion

发觉偏离了主题很远了。回来继续说和命名文件夹相关的话题，关于波浪号展开特性。

波浪号展开特性[^2]是源于 bash 的，但也在 zsh 中得到了完整的复刻，当然有的术语就有所调整而已。

在更早期的年代，这个特性被叫做 `Tilde notation`，而且也不是采用 hash -d 这样的映射表，而是借助于 `/etc/passwd` 的映射能力。由于那样的特性已经不再被日常使用了（因为它们实际上加入了无意义的 linux 用户名和账户，所以其实也不是正经的用法，只能算是一种 hack 行为），所以也就不提了。

波浪号展开有一个限制，不能被引号包围。所以你不能使用 `V="~github/hedzr/cmdr"` 这样的定义，它不会被展开，但 `V=~github"/hedzr/cmdr"` 将能够会工作。

[^2]: [Tilde Expansion](https://www.gnu.org/software/bash/manual/html_node/Tilde-Expansion.html)

```
~
The value of $HOME

~/foo
$HOME/foo

~fred/foo
The subdirectory foo of the home directory of the user fred

~+/foo
$PWD/foo

~-/foo
${OLDPWD-'~-'}/foo

~N
The string that would be displayed by ‘dirs +N’

~+N
The string that would be displayed by ‘dirs +N’

~-N
The string that would be displayed by ‘dirs -N’
```

对于上面的这些形式，没有太多解说的必要。

~fred/foo 表示展开到用户 frew 的 `$HOME/foo`。但对于个人用户来说没什么意义，即使是对于服务器维护人员，其实也不一定会用得到。

~N 是个仅看解说容易茫然的形式，它实际上是允许展开和访问到 pushd 的嵌套层级，所以 ~1 等价于上一次 pushd 时的所在文件夹，其余类推。但对于 zsh 来说，它不仅仅是 pushd 也是 cd 的历史层级的表达。此外，zsh 还支持 ` -1` 的方式，这种方式的优点在于可以 TAB 补全，试试 `cd -<TAB><TAB>` 你就明白了，这对于缩减瞬时记忆负担是有利的，同时它也会加速你的衰老。

因为，衰老的特征之一就是瞬时记忆能力降低，转头就忘。

而记忆力的特点，是用进废退啊兄弟！







- About `Named Directory`: <https://zsh.sourceforge.io/Doc/Release/Expansion.html#Static-named-directories>



## :end: