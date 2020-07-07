---
layout: single
title: "BASH TRICKS: NO ALIAS, IN SOURCE, …"
date: 2018-10-10 09:00:00 +0800
Author: hedzr
tags: [shell, bash, devops]
categories: devops shell
comments: true
toc: true
header:
  overlay_image: /assets/images/bash-shell.png
  overlay_filter: rgba(255, 255, 255, 0.5)
excerpt: "BASH 小技巧一小组 [...]"
#header:
#  overlay_image: /assets/images/unsplash-image-1.jpg
#  overlay_filter: rgba(0, 0, 0, 0.15)
#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---



### BASH: \LS

前缀\的目的是避免alias替换，使用命令的原生目标来执行。当 alias ls=’ls –color’ 时，ls的输出结果是带高亮色的，\ls则避免了alias替换，输出结果没有高亮色。

 

### BASH：函数名

```bash
function test_func()
{
    echo "Current $FUNCNAME, \$FUNCNAME => (${FUNCNAME[@]})"
    another_func
    echo "Current $FUNCNAME, \$FUNCNAME => (${FUNCNAME[@]})"
}
```

$FUNCNAME是一个数组，包含倒序的函数名调用栈。例如“(child_func parent_func main_entry main)”，其中main_entry是首个函数调用入口，然后依次嵌套调用函数 parent_func 和 child_func，而main是一个伪函数名，它表示整个脚本文件。

 

### BASH：避免多次SOURCE

1. BASH自身检测SOURCE状态
2. 使用一个环境变量来标识已经source过了

```bash
_sourced_="__sourced_$$__"

echo "Flag variable $_sourced_=${!_sourced_}"

if [ -z "${!_sourced_}" ]; then
    eval "$_sourced_=1"
    echo "It is the first time to source script"
else
    echo "The script have been sourced"
fi
```

以及：

```bash
function if_in_source () { [[ $- = *i* ]]; }
```

以及：

```bash
# If the script is sourced by another script
if [ -n "$BASH_SOURCE" -a "$BASH_SOURCE" != "$0" ]
then
    do_something
else # Otherwise, run directly in the shell
    do_other
fi

function if_in_source () { [ -n "$BASH_SOURCE" -a "$BASH_SOURCE" != "$0" ]; }
```

 

 

## 🔚