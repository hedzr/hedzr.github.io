---
layout: single
title: Linux 命令 man 全知全会
date: 2021-12-26 09:58:00 +0800
last_modified_at: 2021-12-26 09:58:00 +0800
Author: hedzr
tags: [linux, ubuntu, man-pages, devops]
categories: devops linux
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20211226010348217.png
  overlay_image: /assets/images/ubuntuhero.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
excerpt: >-
  man 命令完整解读 [...]
---


> **摘要**：  
> 对 man 的各种用法做一次整理，顺便也可以当作参考手册。
> <!--MORE-->



## 引子

`man` 是一个 Linux 命令行实用程序，用于显示 linux 命令、系统调用、库函数等的帮助手册。

**手册页**，即 Manual pages，又称作 man page，是在 [Unix](https://zh.wikipedia.org/wiki/UNIX) 或 [类Unix](https://zh.wikipedia.org/wiki/类Unix系统) [操作系统](https://zh.wikipedia.org/wiki/操作系统) 在线 [软件文档](https://zh.wikipedia.org/wiki/软件文档) 的一种普遍的形式。 内容包括[计算机程序](https://zh.wikipedia.org/wiki/计算机程序)（包括[库](https://zh.wikipedia.org/wiki/库)和[系统调用](https://zh.wikipedia.org/wiki/系统调用)），正式的标准和惯例，甚至是抽象的概念。[用户](https://zh.wikipedia.org/wiki/用户)可以通过执行`man`[命令](https://zh.wikipedia.org/wiki/命令_(计算机))调用手册页。

man 手册页被设计成独立的文档，不能引用其它手册页面。这与支持超链接的 [Info 文档](https://wiki.archlinux.org/title/Info_manual) 形成鲜明对比，GNU正在将 man 手册替换成 info 文档。

手册页的默认格式是[troff](https://zh.wikipedia.org/wiki/Troff)，使用man[宏软件包](https://zh.wikipedia.org/w/index.php?title=Troff宏&action=edit&redlink=1)（着重展现）或[mdoc](https://zh.wikipedia.org/w/index.php?title=Mdoc&action=edit&redlink=1)宏软件包（着重语义）。可以把手册页排版成[PostScript](https://zh.wikipedia.org/wiki/PostScript)、[PDF](https://zh.wikipedia.org/wiki/PDF)和其他各种格式进行查看或打印。

## 安装

[man-db](https://archlinux.org/packages/?name=man-db) 提供了 *man* 命令，[less](https://wiki.archlinux.org/title/Core_utilities#Essentials) 是 *man* 的默认分页器。

![image-20211226010348217](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20211226010348217.png)

[man-pages](https://archlinux.org/packages/?name=man-pages) 提供了 Linux man 页面的内容。

![image-20211226010416504](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20211226010416504.png)

下面是一些语言的翻译版本:

- [man-pages-cs](https://archlinux.org/packages/?name=man-pages-cs) for Czech
- [man-pages-de](https://archlinux.org/packages/?name=man-pages-de) for German
- [man-pages-zh_cn](https://archlinux.org/packages/?name=man-pages-zh_cn) for Simplified Chinese
- [man-pages-zh_tw](https://archlinux.org/packages/?name=man-pages-zh_tw) for Traditional Chinese

下面程序也可以用来阅读手册:

- **GNOME Help** — [GNOME](https://wiki.archlinux.org/title/GNOME) 帮助阅读程序。 通过 `yelp man:<name>` 或 `Ctrl+L` 快捷键阅读手册页面。

- **KHelpCenter** — [KDE](https://wiki.archlinux.org/title/KDE) 帮助阅读程序，可以通过 `khelpcenter man:<name>` 阅读手册。

- **[Konqueror](https://en.wikipedia.org/wiki/Konqueror)** — KDE 文件和网页浏览器，也可以通过 `man:<name>` 显示手册。

- **xman** — 可以分类查看手册。

对于 Linux 发行版来说，man 是标准配置，任何一个最小系统均包含了 man 命令（即，man-db 包总是被预装的），但手册页的文档内容部分则不一定了，根据实际情况进行选装。

对于像 Ubuntu 这样的系统来说，应用程序的手册页常常以后缀 `-doc` 的独立包方式存在，例如 flex 包的配套手册页为 flex-doc 包。

```bash
sudo apt install flex flex-doc
sudo apt install bison bison-doc
sudo apt install git git-doc
```

对于 POSIX 可移植性较为关注的人，可能会需要安装：

```bash
sudo apt install manpages-poxis*
```

然后就可以查阅 POSIX 调用，例如：

```bash
man 3p connect
```

等等。

## 阅读手册页

通过以下命令阅读man手册页：

```bash
$ man 手册名
```

man 手册页分为很多区块。完整的列表可以参考: [man-pages(7)](https://man.archlinux.org/man/man-pages.7)。

man 手册页通过名称和所属分类标识。有些不同分类的 man 手册页名字可能相同，比如 man(1) 和 man(7)，这时需要额外指明分类以访问需要的手册。例如：

```bash
$ man 5 passwd
```

会显示有关文件`/etc/passwd`，而非命令 `passwd`，的内容。

读分区1的常规命令手册页时通常省略 `1`：

```bash
$ man ls         # 等价于 man 1 ls
```

上面的命令查看的是 `ls` 命令行帮助信息，这个信息文本被存储在一个名为 `ls.1` 的文件中，并被储存在你的机器上的某个 manpage 可搜索位置（例如 `/usr/share/man/` 之中，可以查阅 `$MANPATH` 的值来确定）中。

如果你是一个开发者，查看开源代码中的 command.1 文件时，可以直接查阅它，并不需要将这个文件 gzip 并复制到某个 MANPATH 之中才能阅读：

```bash
$ man ./command.1
$ man -l ./command.1   # -l localfile.1
```

你也可以 inplace 地设置一个额外的搜索路径以便能够搜索当前路径中的 `command.1`：

```bash
$ man -M . command
```

注意这个方法通常要求文件位于：`./man1/command.1`，然后此时无需后缀 `.1` ，因为对其采用的是 man 命令 语法而不是在打开一个本地文件。



### 快捷键（`less`）

在手册页阅读界面中，可以使用快捷键来帮助阅读。

由于手册页的显示是使用操作系统 Shell 环境中的默认 PAGER 来完成的，所以快捷键遵循相应 PAGER 的功能映射。

大多数系统中现在默认采用 `less` 作为默认 PAGER，因此请参考 [less 命令全知全会](https://hedzr.com/devops/linux/linux-less-command/)。



### 布局

所有的手册页遵循一个常见的布局，其为通过简单的[ASCII](https://zh.wikipedia.org/wiki/ASCII)文本展示而优化，而这种情况下可能没有任何形式的高亮或字体控制。一般包括以下部分内容：

- NAME（名称）

  该命令或函数的名称，接着是一行简介。

- SYNOPSIS（概要）

  对于[命令](https://zh.wikipedia.org/wiki/命令_(计算机))，正式的描述它如何运行，以及需要什么样的命令行参数。对于函数，介绍函数所需的参数，以及哪个头文件包含该函数的定义。

- DESCRIPTION（说明）

  命令或函数功能的文本描述。

- EXAMPLES（示例）

  常用的一些示例。

- SEE ALSO（参见）

  相关命令或函数的列表。

也可能存在其他部分内容，但这些部分没有得到跨手册页的标准化。常见的例子包括：OPTIONS（选项），EXIT STATUS（退出状态），ENVIRONMENT（环境），BUGS（程序漏洞），FILES（文件），AUTHOR（作者），REPORTING BUGS（已知漏洞），HISTORY（历史）和COPYRIGHT（著作权）。

你可以在 [`man-pages(7)`](https://manpages.debian.org/bullseye/manpages/man-pages.7.en.html) 查阅到这些手册页内的区块的描述，如同我们前文中所描述的那样。

一个较完整的列表节录如下：

| **NAME**        |                                   |
| --------------- | --------------------------------- |
| **SYNOPSIS**    |                                   |
| CONFIGURATION   | [Normally only in Section 4]      |
| **DESCRIPTION** |                                   |
| OPTIONS         | [Normally only in Sections 1, 8]  |
| EXIT STATUS     | [Normally only in Sections 1, 8]  |
| RETURN VALUE    | [Normally only in Sections 2, 3]  |
| ERRORS          | [Typically only in Sections 2, 3] |
| ENVIRONMENT     |                                   |
| FILES           |                                   |
| VERSIONS        | [Normally only in Sections 2, 3]  |
| ATTRIBUTES      | [Normally only in Sections 2, 3]  |
| CONFORMING TO   |                                   |
| NOTES           |                                   |
| BUGS            |                                   |
| EXAMPLES        |                                   |
| AUTHORS         | [Discouraged]                     |
| REPORTING BUGS  | [Not used in man-pages]           |
| COPYRIGHT       | [Not used in man-pages]           |
| **SEE ALSO**    |                                   |





### 手册区块

在操作系统中，所有的手册页被按照其主题分类划分为多个区块，例如系统调用，Shell 命令，C 库函数等等。这些区块主要定位在 `/usr/share/man/man1` 到 `/usr/share/man/man9` 文件夹中。

在 Arch Linux、[Research Unix](https://zh.wikipedia.org/wiki/Research_Unix)、[BSD](https://zh.wikipedia.org/wiki/BSD)、[OS X](https://zh.wikipedia.org/wiki/OS_X) 和 [Linux](https://zh.wikipedia.org/wiki/Linux) 中，手册通常被分为8个区块，安排如下：

| 区块 |                             说明                             |
| :--: | :----------------------------------------------------------: |
|  1   |   一般[命令](https://zh.wikipedia.org/wiki/命令_(计算机))    |
|  2   |      [系统调用](https://zh.wikipedia.org/wiki/系统调用)      |
|  3   | [库](https://zh.wikipedia.org/wiki/函式庫)函数，涵盖[C标准函数库](https://zh.wikipedia.org/wiki/C標準函數庫) |
|  4   | [特殊文件](https://zh.wikipedia.org/wiki/设备文件)（通常是/dev中的设备）和[驱动程序](https://zh.wikipedia.org/wiki/驱动程序) |
|  5   |   [文件格式](https://zh.wikipedia.org/wiki/檔案格式)和约定   |
|  6   | [游戏](https://zh.wikipedia.org/wiki/电子游戏)和[屏保](https://zh.wikipedia.org/wiki/螢幕保護裝置) |
|  7   |                             杂项                             |
|  8   | 系统管理[命令](https://zh.wikipedia.org/wiki/命令_(计算机))和[守护进程](https://zh.wikipedia.org/wiki/守护进程) |

Unix [System V](https://zh.wikipedia.org/wiki/System_V) 采用了类似的编号方案，但顺序不同：

| 区块 |                             说明                             |
| :--: | :----------------------------------------------------------: |
|  1   |   一般[命令](https://zh.wikipedia.org/wiki/命令_(计算机))    |
|  1M  | 系统管理[命令](https://zh.wikipedia.org/wiki/命令_(计算机))和[守护进程](https://zh.wikipedia.org/wiki/守护进程) |
|  2   |      [系统调用](https://zh.wikipedia.org/wiki/系统调用)      |
|  3   |   [C函数库](https://zh.wikipedia.org/wiki/C標準函數庫)函数   |
|  4   |   [文件格式](https://zh.wikipedia.org/wiki/檔案格式)和约定   |
|  5   |                             杂项                             |
|  6   | [游戏](https://zh.wikipedia.org/wiki/电子游戏)和[屏保](https://zh.wikipedia.org/wiki/螢幕保護裝置) |
|  7   | [特殊文件](https://zh.wikipedia.org/wiki/设备文件)（通常是/dev中的设备）和[驱动程序](https://zh.wikipedia.org/wiki/驱动程序) |

在某些系统中还有下述的区块可用：

| 区块 |                             描述                             |
| :--: | :----------------------------------------------------------: |
|  0   | [C函数库](https://zh.wikipedia.org/wiki/C標準函數庫)[头文件](https://zh.wikipedia.org/wiki/头文件) |
|  9   |        [内核](https://zh.wikipedia.org/wiki/内核)例程        |
|  n   | [Tcl](https://zh.wikipedia.org/wiki/Tcl)/[Tk](https://zh.wikipedia.org/wiki/Tk)[关键字](https://zh.wikipedia.org/wiki/保留字) |
|  x   |   [X窗口系统](https://zh.wikipedia.org/wiki/X_Window系统)    |

一些区块利用后缀进一步细分了。例如在一些系统中，区块3C是C函数库调用，3M是数学（Math）函数库，等等。这样做的结果是区块8（系统管理命令）有时也被移动到区块1M（作为[命令](https://zh.wikipedia.org/wiki/命令_(计算机))区块的子区块）。一些子区块后缀有跨区块的一般含义：

| 子区块 |                            说明                             |
| :----: | :---------------------------------------------------------: |
|   p    |      [POSIX](https://zh.wikipedia.org/wiki/POSIX)规范       |
|   x    | [X窗口系统](https://zh.wikipedia.org/wiki/X_Window系统)文档 |
|   pm   |                      Perl Module 函数                       |



#### 综述

综上所述，手册页的主要的类别和对应的编号有：

```plain
0     Header files
0p    Header files (POSIX)
1     Executable programs or shell commands
1p    Executable programs or shell commands (POSIX)
2     System calls (functions provided by the kernel)
3     Library calls (functions within program libraries)
3n    Network Functions
3p,3pm    Perl Modules
4     Special files (usually found in /dev)
5     File formats and conventions eg /etc/passwd
6     Games
7     Miscellaneous  (including  macro  packages and conventions), e.g. man(7), groff(7)
8     System administration commands (usually only for root)
9     Kernel routines
l     Local documentation
n     New manpages
```

翻译过来粗略是：

- 0, 0p：已过时，相应的条目已经被合并到 section 3 之中了。
- l, n：基本上不存在于发行版中，但开发者可以用于开发周期中。
- 1：可执行程序或是 shell 指令。
- 2：系统调用（system calls，Linux 核心所提供的函數）。
- 3：一般库函數，C 库函数。
- 4：特殊文件（通常位于 `/dev` 之中）。
- 5：文件格式于协定，如 `/etc/passwd`
- 6：游戏。
- 7：杂项（宏处理等，如 `man(7)`、`groff(7)`）。
- 8：系统管理员指令（通常是管理者 `root` 专用指令）。
- 9：Kernel routines（非标准）。

注意前文已经提及，绝大多数系统中，只有区块 1 到 8 这几个类别。你可以在 [`man-pages(7)`](https://manpages.debian.org/bullseye/manpages/man-pages.7.en.html) 查阅到这些区块的描述，如同我们前文中所描述的那样。

在手册页系统中的会用小括号来注明手册所属的区块，例如 `ls(1)` 表示 Shell 命令 `ls` 隶属于区块 1。

有时候一个主题名称可能会在不同的区块中有不同的说明文件，若是查询一个主题时未能在指定区块中找到，那么 man 会依照 `1 n l 8 3 2 3posix 3pm 3perl 5 4 9 6 7` 的顺序依次检索相应的其它区块，然后显示第一个搜索到的章节内容。

例如 `passwd` 这个主题 `passwd(1)` 与 `passwd(5)` 两个章节，如果不指定章节的话：

```bash
man passwd
```

会显示 `passwd(1)`，而若要查询 `passwd(5)` 的话，就应该明确指定区块编号：

```bash
man 5 passwd
```

如果你对这种语法感到困惑的话，可以采用如下的格式：

```bash
man passwd.5
```

两者是等效的。



### 列出所有章节

由于具体主题的复杂性，所以有的条目未必在你以为的分区中，例如 recv C 函数的参考并不是在分区 3 中，而是在分区 2 中，因为它是 Linux 内核调用之一。这种情况在系统调用和 C 库函数重名时常常可见。

有时候我们对某主题很感兴趣，但却并不知道该主题有哪些章节可以被查询，这时候就可以用 `-aw` 参数进行查询：

```bash
man -aw printf
```

典型的结果可能是这样：

```
/usr/share/man/man1/printf.1.gz
/usr/share/man/man1/printf.1posix.gz
/usr/share/man/man3/printf.3.gz
/usr/share/man/man3/printf.3posix.gz
```

但你或许更喜欢 whatis 返回的结果：

```bash
$ whatis printf
printf (1)           - format and print data
printf (3)           - formatted output conversion
printf (1posix)      - write formatted output
printf (3posix)      - print formatted output
```

它更直观。

whatis 等价于 `man -f`：

```bash
$ man -f printf
printf (1)           - format and print data
printf (3)           - formatted output conversion
printf (1posix)      - write formatted output
printf (3posix)      - print formatted output
```





### 一次查阅所有章节

如果要一次性查阅某个主题的所有章节，可以用 `-a` 参数，这会令 `man` 依次显示所有章节：

```bash
man -a printf
```

当你看完一个章节并按 `q` 退出之后，`man` 会显示：

```
--Man-- next: printf(3) [ view (return) | skip (Ctrl-D) | quit (Ctrl-C) ]
```


j简单地回车（按下 Enter 键）就可以继续阅读下一个章节。你也可以用 Ctrl-C 终止 man 返回到 Shell 提示符状态。





### 搜索手册页

如果用户压根儿不知道要查阅的手册的名称，该怎么办呢？没事，通过 `-k` 或者 `--apropos` 参数就可以按给定关键词搜索相关手册。例如，要查阅有关密码的手册（“password”）：

```bash
$ man -k password
chage (1)            - change user password expiry information
chgpasswd (8)        - update group passwords in batch mode
chpasswd (8)         - update passwords in batch mode
...
pam_unix (8)         - Module for traditional password authentication
passwd (1)           - change user password
passwd (1ssl)        - compute password hashes
passwd (5)           - the password file
passwd2des (3)       - RFS password encryption
...
pwd.h (7posix)       - password structure
...
shadow (5)           - shadowed password file
shadowconfig (8)     - toggle shadow passwords on and off
smbpasswd (5)        - The Samba encrypted password file
smbpasswd (8)        - change a user's SMB password
...
xdecrypt (3)         - RFS password encryption
xencrypt (3)         - RFS password encryption
```

`man -k` 会筛选主题名称以及简短描述文字来尝试匹配给定的关键字。

现在你可以开始搜索了。 例如，要查阅有关密码的手册（“password”）,可以使用下面的命令:

```
$ man -k password
$ man --apropos password
$ apropos password
```

它们是同义词。

关键字可以使用正则表达式。

> 例如
>
> ```bash
> $ man -k sprintf
> asprintf (3)         - print to allocated string
> sprintf (3)          - formatted output conversion
> Text::sprintfn (3pm) - Drop-in replacement for sprintf(), with named parameter support
> vasprintf (3)        - print to allocated string
> vsprintf (3)         - formatted output conversion
> ```
>
> 注意得到上面的结果需要首先安装：
>
> ```bash
> sudo apt install libtext-sprintfn-perl
> ```
>
> 以保证 Text::sprintfn (3pm) 条目已经存在。
>
> `/usr/share/man/man3/Text::sprintfn.3pm.gz`



### 全文检索某个关键字

如果你想全文搜索的话，你可以用`-K`选项：

```
$ man -K sprintf
```

它会打开第一个手册页供你阅读，你可以 `q` 退出阅读界面，而后会有一个提示：

```bash
--Man-- next: gcc-7(1) [ view (return) | skip (Ctrl-D) | quit (Ctrl-C) ]
```

此时你可以回车（Enter）阅读下一个匹配的手册页，也可以 Ctrl-C 退出 man -K 状态。



### 其它功能

#### 在浏览器中显示手册页

```bash
man -Hfirefox printf
```

此功能可能需要 `groff` 命令能够在 PATH 路径中可被搜索到。所以你也许需要显式地安装 `groff`：

```bash
sudo apt-get install groff
```



#### 指定分页程序（PAGER）

我们提到过显示主题内容使用的是通过环境变量 PAGER 指定的分页程序，默认时为 less。但你可以显式地指定其它分页程序作为显示工具，这是通过命令行参数 `-P` 来指定的：

```bash
man -P more printf
```



#### 转换为纯文本、网页或 PDF

##### 纯文本

```bash
man printf | col -b > printf.txt
```

##### 网页

首先，安装软件包 [man2html](https://archlinux.org/packages/?name=man2html)。

然后使用它转换 man 手册页：

```
$ man free | man2html -compress -cgiurl man$section/$title.$section$subsection.html > ~/man/free.html
```

此外，`man2html` 还可以把 man 页转换为便于打印的文本文件：

```
$ man free | man2html -bare > ~/free.txt
```

另一种方式是直接通过 groff 来做：

```
zcat `man -w printf` | groff -mandoc -T html > printf.html
```

##### PDF

将手册页转换为 PDF：

```
man -t printf | ps2pdf - printf.pdf
```

man pages 是可以打印的，遵循 troff 格式，本来就是一种打印设置语言，安装 [ghostscript](https://archlinux.org/packages/?name=ghostscript) 后，可以用下面命令将 man 页面转换为 PDF `man -t <manpage> | ps2pdf - <pdf>`.

注意这里仅能使用 Times 字体，没有超链接，有些手册是转为终端设计，PS 或 PDF 格式看起来不太正常。



#### 指定文字语言

你可以安装 manpages-zh 包来提供中文手册页支持。

在终端中，设置 LANG 环境变量为 `UTF-8.zh_CN`，则 man 会以中文方式显示主题章节内容。不过如果没有中文版的话，还是会 fallback 到英文版。

如果你不想改变环境变量，也可以通过命令行参数 `-L` 来达到目的，例如

```bash
man -L en 5 passwd
man -L zh_CN 5 passwd
```



## 其它信息

### 手册页存储在哪里？

典型的位置在 `/usr/share/man` 和 `/usr/local/share/man` 中。

此外，常常会有 `/usr/man` 和 `/usr/local/man` 的符号链接。

manpath 命令是获知确切的存储位置的正确方法：

```bash
$ manpath
/usr/local/man:/usr/local/share/man:/usr/share/man
```

manpath 命令或者 man 命令都是通过 `/etc/manpath.config` 或者 `/etc/man_db.conf` 配置文件来取得正确的存储位置集合的。但对于多数人来说我们不建议你去探究这些配置文件，它们遵循一定的格式约定，但分析和抽取结果往往对于 Shell 脚本来说过于繁杂了，远不如分析 manpath 返回的结果来得简单易用。

要获知 `/etc/manpath.config` 的更多信息，可以查看手册页 `man manpath`。

有的时候，`$MANPATH$` 环境变量可能包含了正确的值。但绝大多数情况下可能它都是空值。

另一种方法是通过 whereis 命令来间接获知：

```bash
$ whereis man
man: /usr/bin/man /usr/local/man /usr/share/man /usr/share/man/man1/man.1.gz /usr/share/man/man7/man.7.gz
```

`/usr/share/man-db/chconfig` 是一个 perl 执行脚本，会重新生成 `/etc/manpath.config` ，这是系统级的内部行为。



### 使用在线手册页

许多网站提供在线man手册页，详细列表参见：[Wikipedia:Man_page#Repositories_of_manual_pages](https://en.wikipedia.org/wiki/Man_page#Repositories_of_manual_pages)。

- [Man7.org.](https://man7.org/linux/man-pages/index.html) Upstream for Arch Linux's [man-pages](https://archlinux.org/packages/?name=man-pages).
- [*Debian GNU/Linux man pages*](http://manpages.debian.net/)
- [*DragonFlyBSD manual pages*](https://leaf.dragonflybsd.org/cgi/web-man)
- [*FreeBSD Hypertext Man Pages*](https://www.freebsd.org/cgi/man.cgi)
- [*Linux and Solaris 10 Man Pages*](http://www.manpages.spotlynx.com/)
- [*Linux/FreeBSD Man Pages*](http://manpagehelp.net/)[[失效链接](https://en.wikipedia.org/wiki/Wikipedia:Link_rot) 2020-08-04 ⓘ] with user comments
- [*Linux man pages at die.net*](https://linux.die.net/man/)
- [The Linux man-pages project at kernel.org](https://www.kernel.org/doc/man-pages/)
- [*NetBSD manual pages*](http://netbsd.gw.com/cgi-bin/man-cgi)[[失效链接](https://en.wikipedia.org/wiki/Wikipedia:Link_rot) 2021-05-17 ⓘ]
- [*Mac OS X Manual Pages*](http://developer.apple.com/documentation/Darwin/Reference/ManPages/index.html)[[失效链接](https://en.wikipedia.org/wiki/Wikipedia:Link_rot) 2021-11-13 ⓘ]
- [*On-line UNIX manual pages*](http://unixhelp.ed.ac.uk/alphabetical/index.html)
- [*OpenBSD manual pages*](https://www.openbsd.org/cgi-bin/man.cgi)
- [*Plan 9 Manual — Volume 1*](http://man.cat-v.org/plan_9/)
- [*Inferno Manual — Volume 1*](http://man.cat-v.org/inferno/)
- [*Storage Foundation Man Pages*](http://sfdoccentral.symantec.com/sf/5.0MP3/linux/manpages/index.html)[[失效链接](https://en.wikipedia.org/wiki/Wikipedia:Link_rot) 2020-08-04 ⓘ]
- [*The Missing Man Project*](http://markhobley.yi.org/manpages/missingman.html) [dead link as of 9 July 2010]
- [*Gobuntu Manual Pages*](http://en.linuxpages.info/index.php?title=Main_Page)[[失效链接](https://en.wikipedia.org/wiki/Wikipedia:Link_rot) 2020-08-04 ⓘ] [dead link as of 9 July 2010]
- [*The UNIX and Linux Forums Man Page Repository*](https://www.unix.com/man-page/OpenSolaris/1/man/)
- [*Ubuntu Manpage Repository*](https://manpages.ubuntu.com/)



## 参考

- `man man`
- `man man-pages`
- [man page (简体中文) - ArchWiki](https://wiki.archlinux.org/title/Man_page_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) 
- [man page - Wikipedia](https://en.wikipedia.org/wiki/Man_page) 



## 后记

本文中有的内容完全复制于参考链接中。



🔚