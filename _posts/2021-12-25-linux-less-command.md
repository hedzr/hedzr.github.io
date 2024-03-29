---
layout: single
title: Linux 命令 less 全知全会
date: 2021-12-25 09:58:00 +0800
last_modified_at: 2021-12-25 09:58:00 +0800
Author: hedzr
tags: [linux, ubuntu, less, devops]
categories: devops linux
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20211225100221467.png
  overlay_image: /assets/images/ubuntuhero.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
excerpt: >-
  less 命令完整解读 [...]
---


> **摘要**：  
> 对 less 的各种用法做一次整理，顺便也可以当作参考手册。
> <!--MORE-->



## 引子

`less` 是一个 Linux 命令行实用程序，用于显示文件内容，它支持管道输入，所以能够被用于接收前一命令的标准输出病进行全屏展示。

`less` 是 `more` 的增强版本，它具有更全面的全文件导航能力，以及全文搜索能力。`less` 在大文件打开方面有很好的优化，在即时显示、快速加载等方面性能突出。`less` 还支持一次性打开多个文件，它将会逐一地显示这些文件的内容。

取名为 `less` 也因为一句名人名言：`less is more`。这句名言已经哲学化了。



![image-20211225100221467](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20211225100221467.png)



## 基本使用

less 的基本使用方法有两种，一是打开一个或多个文件：

```bash
less /var/log/messages
```

二是作为管道操作的末端：

```bash
ps aux|less
```

在管理操作时，可能会常常用到 `tail -f` 等价的实时刷新模式：

```bash
dmsg|less +F
```





### 被嵌入地、隐含地使用

在很多场所中 less 被通过 PAGER 环境变量而悄悄地使用。

一个典型的例子是 man 命令。当：

```bash
man printf
```

时，printf 的手册页将被显示在 less 的阅读界面中，如同这样：

![image-20211225100928604](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20211225100928604.png)



### 阅读界面操作

在 less 显示的阅读界面中，按键即命令。

你可以随时按下 `h` 显示帮助屏，`q` 将退出帮助屏。

其它最常用的按键命令有：

|     按键     |                             指令                             |
| :----------: | :----------------------------------------------------------: |
|    SPACE     |                            下一页                            |
|      d       |                            下半页                            |
|      b       |                            前一页                            |
|      u       |                            前半页                            |
|      v       |                           编辑内容                           |
| j 或 ↵ Enter |                            下ㄧ行                            |
|      k       |                            前ㄧ行                            |
|     Home     |                           文件顶部                           |
|     End      |                           文件结尾                           |
|      F       | 跟随模式（供日志使用）。Follow Mode (for logs). Interrupt to abort. |
|    g 或 <    |                            第一行                            |
|    G 或 >    |                           最后ㄧ行                           |
|    `⟨n⟩`G    |                        跳到第`⟨n⟩`行                         |
|  /`⟨text⟩`   | 向前搜索`⟨text⟩`。文字会被视为[正则表达式](https://zh.wikipedia.org/wiki/正则表达式)。 |
|  ?`⟨text⟩`   |                    如同/，但为向后搜索。                     |
|      n       |                     下一个符合的搜索结果                     |
|      N       |                     上一个符合的搜索结果                     |
|     Escu     |              关闭符合突显（请见`-g`命令行选项）              |
|    -`⟨c⟩`    |     切换选项`⟨c⟩`，例如-i会切换是否要在搜索时忽略大小写      |
|    m`⟨c⟩`    |                        设置标记`⟨c⟩`                         |
|    '`⟨c⟩`    |                        跳到标记`⟨c⟩`                         |
| = 或 Ctrl+G  |                           文件信息                           |
|      :n      |                          下一个文件                          |
|      :p      |                          上一个文件                          |
|      h       |              说明。这会使用`less`显示，q离开。               |
|      q       |                             离开                             |

稍后键盘一节中我们会完整地介绍全部可用的按键命令。





### 搜索

在 less 的阅读界面中，底部行被称作状态命令行。如果你在界面中按键，则该行的状态提示暂时被隐藏，带有 `:` 提示符的命令行输入会被显示。

当你按下 `/` 进入搜索状态时，状态命令行等待你继续键入 pattern。

你可以在搜索时使用正则式 pattern。

重复上一次搜索是 `n` 。

如果你键入 `-J` 序列，那么阅读界面左侧将显示一列垂直的状态栏，而 `pattern` 匹配的行在这个状态栏中会有显示：

![image-20211225103745594](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20211225103745594.png)



### 标记（Mark）

标记是一个字母，大小写敏感。标记等同于我们在 Visual Studio Code 这样的图形化文字编辑器中的书签。

在阅读界面按下 ma 按键序列，`m` 命令将会为你的当前阅读位置建立一个名为 `a` 的标记。稍后你可以使用 `'a` 返回到这个位置。

如果你键入 `-J` 序列，那么阅读界面左侧将显示一列垂直的状态栏，而 `a` 标记在这个状态栏中会有显示：

![image-20211225102328869](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20211225102328869.png)







## 选项

选项既可以从命令行指定，也可以在 less 阅读界面中通过前缀字符序列 `-` 或 `--` 直接键入和进行翻转。

例如你可以键入 `-?` 来显示帮助屏（尽管 `h` 来得更简便）。

```bash
less [-[+]aABcCdeEfFgGiIJKLmMnNqQrRsSuUVwWX~]
     [-b space] [-h lines] [-j line] [-k keyfile]
     [-{oO} logfile] [-p pattern] [-P prompt] [-t tag]
     [-T tagsfile] [-x tab,...] [-y lines] [-[z] lines]
     [-# shift] [+[+]cmd] [--] [filename]...
```

less 允许从命令行直接键入命令，使用 `+` 前缀即可，所以 `+F` 代表着进入滚动刷新模式，例如：

```bash
less +F /var/log/messages
```

注意你仍然可以使用 less 的命令行专有的选项，例如 `-F` 代表着文件内容不够一屏时立即退出 less。

如果你使用了 `++` 前缀，那么该命令将会被自动应用到每一个文件。

> `less` 可以一次性打开多个文件并依次显示。



### 主要的命令行选项

有效的命令行专有选项大体上如下表（由于描述文字很简单故保留原文）：

```
  -?  ........  --help
                  Display help (from command line).
  -a  ........  --search-skip-screen
                  Search skips current screen.
  -A  ........  --SEARCH-SKIP-SCREEN
                  Search starts just after target line.
  -b [N]  ....  --buffers=[N]
                  Number of buffers.
  -B  ........  --auto-buffers
                  Don't automatically allocate buffers for pipes.
  -c  ........  --clear-screen
                  Repaint by clearing rather than scrolling.
  -d  ........  --dumb
                  Dumb terminal.
  -D [xn.n]  .  --color=xn.n
                  Set screen colors. (MS-DOS only)
  -e  -E  ....  --quit-at-eof  --QUIT-AT-EOF
                  Quit at end of file.
  -f  ........  --force
                  Force open non-regular files.
  -F  ........  --quit-if-one-screen
                  Quit if entire file fits on first screen.
  -g  ........  --hilite-search
                  Highlight only last match for searches.
  -G  ........  --HILITE-SEARCH
                  Don't highlight any matches for searches.
  -h [N]  ....  --max-back-scroll=[N]
                  Backward scroll limit.
  -i  ........  --ignore-case
                  Ignore case in searches that do not contain uppercase.
  -I  ........  --IGNORE-CASE
                  Ignore case in all searches.
  -j [N]  ....  --jump-target=[N]
                  Screen position of target lines.
  -J  ........  --status-column
                  Display a status column at left edge of screen.
  -k [file]  .  --lesskey-file=[file]
                  Use a lesskey file.
  -K            --quit-on-intr
                  Exit less in response to ctrl-C.
  -L  ........  --no-lessopen
                  Ignore the LESSOPEN environment variable.
  -m  -M  ....  --long-prompt  --LONG-PROMPT
                  Set prompt style.
  -n  -N  ....  --line-numbers  --LINE-NUMBERS
                  Don't use line numbers.
  -o [file]  .  --log-file=[file]
                  Copy to log file (standard input only).
  -O [file]  .  --LOG-FILE=[file]
                  Copy to log file (unconditionally overwrite).
  -p [pattern]  --pattern=[pattern]
                  Start at pattern (from command line).
  -P [prompt]   --prompt=[prompt]
                  Define new prompt.
  -q  -Q  ....  --quiet  --QUIET  --silent --SILENT
                  Quiet the terminal bell.
  -r  -R  ....  --raw-control-chars  --RAW-CONTROL-CHARS
                  Output "raw" control characters.
  -s  ........  --squeeze-blank-lines
                  Squeeze multiple blank lines.
  -S  ........  --chop-long-lines
                  Chop (truncate) long lines rather than wrapping.
  -t [tag]  ..  --tag=[tag]
                  Find a tag.
  -T [tagsfile] --tag-file=[tagsfile]
                  Use an alternate tags file.
  -u  -U  ....  --underline-special  --UNDERLINE-SPECIAL
                  Change handling of backspaces.
  -V  ........  --version
                  Display the version number of "less".
  -w  ........  --hilite-unread
                  Highlight first new line after forward-screen.
  -W  ........  --HILITE-UNREAD
                  Highlight first new line after any forward movement.
  -x [N[,...]]  --tabs=[N[,...]]
                  Set tab stops.
  -X  ........  --no-init
                  Don't use termcap init/deinit strings.
  -y [N]  ....  --max-forw-scroll=[N]
                  Forward scroll limit.
  -z [N]  ....  --window=[N]
                  Set size of window.
  -" [c[c]]  .  --quotes=[c[c]]
                  Set shell quote characters.
  -~  ........  --tilde
                  Don't display tildes after end of file.
  -# [N]  ....  --shift=[N]
                  Horizontal scroll amount (0 = one half screen width)
      ........  --no-keypad
                  Don't send termcap keypad init/deinit strings.
      ........  --follow-name
                  The F command changes files if the input file is renamed.
      ........  --use-backslash
                  Subsequent options use backslash as escape char.

```



### 常用选项

其中或许会被常常用到的可能有：

| 选项                                           | 能力                                                         |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `-X  ........  --no-init`                      | 不使用 termcap 的 init/deinit 功能。退出 less 时不清屏。     |
| `-x [N[,...]]  --tabs=[N[,...]]`               | 设置 TAB 字符的显示宽度                                      |
| `-n  -N  ....  --line-numbers  --LINE-NUMBERS` | 显示/不显示行号。行号被显示在状态命令行中                    |
| `-m  -M  ....  --long-prompt  --LONG-PROMPT`   | 切换状态命令行的提示符的风格                                 |
| `-J  ........  --status-column`                | 在左侧显示一列垂直的状态行，搜索结果行可以在这一列提供一个标记显示 |
| `-F  ........  --quit-if-one-screen`           | 如果内容显示不足一屏则立即退出 less                          |
| `-e  -E  ....  --quit-at-eof  --QUIT-AT-EOF`   | 当首次抵达文件结尾位置时立即退出 less                        |

状态命令行有两种风格：short, medium。前者显示一个 `:` 提示符，后者显示一系列文档状态信息如行号、显示位置百分比等等。

如果在阅读界面中使用 `-N`，则行号会被显示在状态命令行中。

如果在命令行使用了 `-N`，那么行号可以被显示在每一行的左侧。对于：

```bash
less -N /var/log/syslog
```

会有：

![image-20211225101246073](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20211225101246073.png)







## 键盘

### 快捷键（`less`）

在手册页阅读界面中，可以使用快捷键来帮助阅读。

由于手册页的显示是使用操作系统 Shell 环境中的默认 PAGER 来完成的，所以快捷键遵循相应 PAGER 的功能映射。

大多数系统中现在默认采用 `less` 作为默认 PAGER，因此下面介绍 `less` 快捷键，但针对 manpage 修正描述文字。



#### 基本操作

| 按键              | 能力                                       |
| ----------------- | ------------------------------------------ |
| h                 | 显示帮助屏幕                               |
| q                 | 退出                                       |
| e ^E J ^N CR      | 前进一行（或 N 行）                        |
| y ^Y k ^K ^P      | 后退一行（或 N 行）                        |
| f ^F ^V SPACE     | 前进一屏                                   |
| b ^B ESC-v        | 后退一屏                                   |
| z                 | 前进一屏（设置屏高为 N）                   |
| w                 | 后退一屏（设置屏高为 N）                   |
| ESC-SPACE         | 前进一屏，在文末允许上滚                   |
| d ^D              | 前进半屏                                   |
| u ^U              | 后退半屏                                   |
| ESC-) RightArrow  | 向右卷动半屏                               |
| ESC-( LeftArrow   | 向左卷动半屏                               |
| ESC-} ^RightArrow | 向右卷动到最右侧                           |
| ESC-{ ^LeftArrow  | 向左卷动到第一列                           |
| F                 | 持续滚动前进，如同 `tail -f` 那样          |
| ESC-F             | 持续滚动前进，但在查找关键字匹配时停止滚动 |
| r ^R ^L           | 重新绘制屏幕                               |
| R                 | 重绘屏幕，废弃已经缓存的输入               |

带有 `N` 的命令，允许 `N` `cmd` 的输入方法。

以 `f` 命令为例，简单地键入 `f` 则屏幕向下卷滚，内容上移一行；但你可以键入 `31f` 使得内容一次性地向上滚动 31 行。与其相反的是 `b` 命令，可以使屏幕向上卷滚，内容下移一行。

F 命令具有即时刷新文件内容的能力，它相当于增强版的 `tail -f` 功能，不但可以随时刷新和显示最新的文件内容，也能够暂时停止刷新，在已有的内容中导航和检索，而且还能继续再次地使用 F 进入即时刷新的状态。



#### 搜索

| 按键       | 能力                                 |
| ---------- | ------------------------------------ |
| `/pattern` | 向前搜索关键词 `pattern`             |
| `?pattern` | 向后搜索关键词 `pattern`             |
| n          | 重复上一次搜索（重复 N 次）          |
| N          | 反向地重复上一次搜索                 |
| ESC-n      | 重复上一搜索，允许跨越多个文件       |
| ESC-N      | 重复上一搜索，反向，允许跨越多个文件 |
| ESC-u      | 放弃、还原、翻转搜索高亮状态         |
| `&pattern` | 只显示匹配行文字                     |

一个 `pattern` 可以由以下按键（ASCII字符）进行前缀修饰：

| 按键    | 能力                                           |
| ------- | ---------------------------------------------- |
| ^N or ! | 搜索非匹配行                                   |
| ^E or * | 搜索多个文件（越过当前主题的文件末尾）         |
| ^F or @ | 从第一个文件(`/`)或者最后一个文件(`?`)开始搜索 |
| ^K      | 高亮匹配文字，但不移动（保持当前阅读位置不变） |
| ^R      | 不使用正则式                                   |

#### 跳转

| 按键             | 能力                                 |
| ---------------- | ------------------------------------ |
| g < ESC-<        | 文件第一行（或第 N 行）              |
| G > ESC->        | 文件最后一行（或最后第 N 行）        |
| p %              | 转到文件开始（或者按百分比定位到 N） |
| t                | 转到下一个标记（重复 N 次）          |
| T                | 转到前一个标记（重复 N 次）          |
| [ ( {            | 查找闭括号 } ) ]                     |
| } ) ]            | 查找开括号 [ ( {                     |
| ESC-^F (c1) (c2) | 查找闭括号 (c2)                      |
| ESC-^B (c1) (c2) | 查找开括号 (c1)                      |
|                  |                                      |

g 这样的按键，在阅读界面可以直接生效。但你也可以连续按键，例如 1 3 g 可以转到第 13 行。

| 按键        | 能力                                         |
| ----------- | -------------------------------------------- |
| m`<letter>` | 标记当前位置为 `<letter>`                    |
| '`<letter>` | 跳转到前一个标记位置（以 `<letter>` 为索引） |
| ''          | 跳转到前一个标记位置                         |
| `^X^X`      | 等同于 '                                     |

一个标记位置（mark）是一个大写字母或者小写字母。另外，下面是预定义的标记位置：

- `^` 文件开始
- `$` 文件结尾



#### 切换文件

| 按键      | 能力                        |
| --------- | --------------------------- |
| :e [file] | 装载一个新文件              |
| `^X^V`    | 等同于 :e                   |
| :n        | 列表中下一个（后 N 个）文件 |
| :p        | 列表中上一个（上 N 个）文件 |
| :x        | 列表中第一个（第 N 个）文件 |
| :d        | 从命令行列表中删除当前文件  |
| = ^G :f   | 打印当前文件名              |



#### 杂项


| 按键         | 能力                                                       |
| ------------ | ---------------------------------------------------------- |
| -`<flag>`    | 翻转一个命令行选项                                         |
| --`<name>`   | 翻转一个选项                                               |
| _`<flag>`    | 显示一个命令行选项                                         |
| __`<name>`   | 显示一个选项                                               |
| +`cmd`       | 每当载入解释一个新文件时，执行 less 命令 `cmd`             |
| !`command`   | 执行 Shell 命令 `command`                                  |
| \|X`command` | 管道操作，从当前位置和标记位置 `X` 到 Shell 命令 `command` |
| s `file`     | 保存输入到文件                                             |
| v            | 编辑当前文件（使用 `$VISUAL` 或 `$EDITOR`）                |
| V            | 打印 less 版本号                                           |







## 环境变量

###  PAGER

`less` 现在是大多数 Linux 发行版的 PAGER 默认值。因此当 PAGER 没有显式设定时，系统总是使用它。

```bash
export PAGER=less
```



### LESS

你可以为 `less` 指定预设的命令行选项，例如：

```bash
LESS="-X"; export LESS
```

这使得 less 退出之后不会清屏。



## 行编辑

less 阅读界面中，按键输入会显示在屏幕最下面一行，同时进入行编辑模式。有时候你可以像 vi 一样按下 `:` 进入到命令的行编辑模式。

下面是这个行编辑的键盘操作方法（由于描述文字很简单故保留原文）。

```
 RightArrow ..................... ESC-l ... Move cursor right one character.
 LeftArrow ...................... ESC-h ... Move cursor left one character.
 ctrl-RightArrow  ESC-RightArrow  ESC-w ... Move cursor right one word.
 ctrl-LeftArrow   ESC-LeftArrow   ESC-b ... Move cursor left one word.
 HOME ........................... ESC-0 ... Move cursor to start of line.
 END ............................ ESC-$ ... Move cursor to end of line.
 BACKSPACE ................................ Delete char to left of cursor.
 DELETE ......................... ESC-x ... Delete char under cursor.
 ctrl-BACKSPACE   ESC-BACKSPACE ........... Delete word to left of cursor.
 ctrl-DELETE .... ESC-DELETE .... ESC-X ... Delete word under cursor.
 ctrl-U ......... ESC (MS-DOS only) ....... Delete entire line.
 UpArrow ........................ ESC-k ... Retrieve previous command line.
 DownArrow ...................... ESC-j ... Retrieve next command line.
 TAB ...................................... Complete filename & cycle.
 SHIFT-TAB ...................... ESC-TAB   Complete filename & reverse cycle.
 ctrl-L ................................... Complete filename, list all.
```





## 参考

- `man less`
- [less (Unix) - Wikipedia](https://en.wikipedia.org/wiki/Less_(Unix)) 



🔚