---
layout: single
title: BASH RENAME，批量重命名就靠它了
date: 2018-10-03 08:00:00 +0800
Author: hedzr
tags: [shell, bash, devops]
categories: devops shell
comments: true
toc: true
header:
  overlay_image: /assets/images/bash-shell.png
  overlay_filter: rgba(255, 255, 255, 0.5)
#excerpt: "This post should [...]"
#header:
#  overlay_image: /assets/images/unsplash-image-1.jpg
#  overlay_filter: rgba(0, 0, 0, 0.15)
#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---



bash中重命名文件一般是使用内置命令mv来完成的。mv的本质含义是移动一个文件，在bash中使用它则无须在文件系统中查找命令文件。

然而mv的语法受到很多限制，如果你需要重命名一批文件的话，它就不合适了。

幸运的是还有 rename 这条命令，而且在绝大多数 linux 发行版中，rename都是存在的并且表现一致。

<!--more-->



### RENAME

批量重命名可以使用 rename 命令，这个命令允许你使用正则式完成一堆文件名的策略性重命名操作。

rename的语法如下：

```
Usage:
    rename [ -h|-m|-V ] [ -v ] [ -n ] [ -f ] [ -e|-E *perlexpr*]*|*perlexpr*
    [ *files* ]

Options:
    -v, -verbose
       Verbose: print names of files successfully renamed.

    -n, -nono
       No action: print names of files to be renamed, but don't rename.

    -f, -force
       Over write: allow existing files to be over-written.

    -h, -help
       Help: print SYNOPSIS and OPTIONS.

    -m, -man
       Manual: print manual page.

    -V, -version
       Version: show version number.

    -e Expression: code to act on files name.

       May be repeated to build up code (like "perl -e"). If no -e, the
       first argument is used as code.

    -E Statement: code to act on files name, as -e but terminated by
       ';'.
```

你可以这样来使用它：

```bash
rename 's/\.JPG/.jpg/' *.JPG
```

如果你有 foo1, …, foo9, foo10, …, foo278 等一组文件，那么如下的两条命令：

```bash
rename foo foo0 foo?
rename foo foo0 foo??
```

能够将这些文件重命名为 foo001, foo002, …, foo278。

以下命令修正文件的后缀名，将所有 .htm 后缀都修改为 .html：

```bash
rename .htm .html *.htm
```

以下命令将大写改为小写：

```bash
rename 's/A-Z/a-z/' *
```

 

 

## 🔚