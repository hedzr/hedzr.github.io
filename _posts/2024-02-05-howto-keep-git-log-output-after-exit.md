---
layout: single
title: 'Git Tips - 怎么才能在 git log 之后保留屏幕输出'
date: 2024-02-05 05:00:00 +0800
last_modified_at: 2024-02-05 09:55:00 +0800
Author: hedzr
tags: [git, log]
categories: devops git
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/Screenshot%202024-02-05%20at%2010.20.10.png
  overlay_image: /assets/images/git-banner.jpeg
  overlay_filter: rgba(32, 32, 0, 0.3)
excerpt: >-
  Git Log/Diff/Blame 命令之微调，...
---

问题简单，答案也简单。

## How to keep the output after `git log` exit

### Question

通常 git log 和 git diff 命令返回之后它们的屏幕输出会被清除，这一特性在 mac 和 linux 中比较常见，这是因为默认时它们的输出被隐含地管道输出给 less 命令接管。

### Reason

less 命令本身支持标准输入的接管和全屏幕显示，然后在 less 退出时自动清屏以退出全屏显示，这是 linux Terminal/Tty 的一种不成文的规定，原因可以追溯到古早时期，清屏的目的是为了将终端显示屏幕给弄干净啰，不然的话光标说不定在屏幕正中，隐藏在一片文字之中，难免让人无法找到其坐标。为此当时人们的基操是退出全屏 CLI 程序后就回车多次，然后扫视屏幕变化从而找到光标位置。于是乎后来就干脆让全屏 CLI 程序总是在运行开始时请求全屏幕控制，具体参考 ANSI Color Sequences 规范，然后在运行结束前除了归还全屏控制之外也自动清屏。

> less 命令已经 man 命令我以前曾经专门介绍过它们的使用特色，请阅读：
>
> - [Linux 命令 less 全知全会](https://hedzr.com/devops/linux/linux-less-command/)
> - [Linux 命令 man 全知全会](https://hedzr.com/devops/linux/linux-man-command/)

### Solution

所以，让 less 在退出时保留屏幕输出的办法是增加命令行参数 `-X`，[See Here](https://hedzr.com/devops/linux/linux-less-command/#less)，

而让 git 自动引用这一变动的方法是：

```bash
git config --global --replace-all core.pager "less -iRFX"
```

其中的参数作用为：

- -i - ignore case when searching (but respect case if search term contains uppercase letters)
- -R - raw control chars / 遇到控制字符时输出为 `^X` 样式
- -F - exit if text is less then one screen long / 如果输出内容不足一屏那就直接退出，而不进入全屏模式
- -X - do not clear screen on exit / 保留输出文字

然后你就可以愉快地玩耍了。

由于 `git log` 和 `git diff` 都会使用操作系统环境变量 PAGER 的参数，所以上述方法同时作用于这些命令。而且，如果你想要临时变更而不是永久变更的话，也可以这样：

```bash
$ PAGE='less -iRFX' git log
$ PAGE='less -iRFX' git diff
```

## 使用 `delta`

为了让 git diff 在命令行中的输出更有参考性，你可能已经定制了 git config `core.pager` 去使用 `delta` 这个第三方工具。

`delta` 是一个 less 的替代品，它用在 git log/diff/blame 场景中的主要亮点在于：

- 语法高亮
- 带有行号
- 可以导航（即如同 less 一样的全屏模式）
- 支持 diff 的双列显示
- 自适应 dark/light 主题色

等等。

好，我不是要带货推广，delta 的使用很容易，直接去 [官网](https://github.com/dandavison/delta) 阅读就好。

这里只给出一个快捷方式，为了保留屏幕输出，你可以给 delta 加上 --pager 参数。是不是很熟悉？这样就可以沿用前文所给出的 less 解决方案了。所以当你使用 delta 作为 git 的 pager 时，就这么定制一下：

```bash
git config --global --replace-all core.pager "delta --dark -n --navigate --pager 'less -iRFX'"
```

然后就继续愉快地玩耍吧。

一个效果图如下：

![Screenshot 2024-02-05 at 10.20.10](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/Screenshot%202024-02-05%20at%2010.20.10.png)

## 结束语

很多事情都很奇妙。

这次只是一个简单的记录，因为确实发现记忆力减退了。

- [Linux 命令 less 全知全会](https://hedzr.com/devops/linux/linux-less-command/)
- [Linux 命令 man 全知全会](https://hedzr.com/devops/linux/linux-man-command/)
- [Git Delta is a Syntax Highlighting Pager for git, diff, and grep output - Laravel News](https://laravel-news.com/git-delta)
- [dandavison/delta: A syntax-highlighting pager for git, diff, and grep output](https://github.com/dandavison/delta)
- [dandavison/delta: A syntax-highlighting pager for git, diff, and grep output](https://github.com/dandavison/delta)



🔚