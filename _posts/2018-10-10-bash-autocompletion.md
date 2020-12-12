---
layout: single
title: BASH AUTO-COMPLETION
date: 2018-10-10 08:00:00 +0800
Author: hedzr
tags: [shell, bash, devops]
categories: devops shell
comments: true
toc: true
header:
  overlay_image: /assets/images/bash-shell.png
  overlay_filter: rgba(255, 255, 255, 0.5)
excerpt: "BASH 自动完成 [...]"
#header:
#  overlay_image: /assets/images/unsplash-image-1.jpg
#  overlay_filter: rgba(0, 0, 0, 0.15)
#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---





## BASH 自动完成



AWS EC2 中，安装 bash-completion 软件包：

```
yum install -y --enablerepo=epel bash-completion
```

在原生状态下，/etc/bash-completion.d是有效可用的，但增加自定义完成函数到这个文件夹中并不能获得自动完成效果，这通常是由于默认状态下只启用了部分自动完成特性，简单地安装bash-completion软件包则可以激活全部自动完成特性，而且附带了大量系统命令 的自动补全函数。

 

upstart命令的自动补全。

在EC2中，自定义的 upstart 服务无法被自动补全，也就是说，输入了 start 之后，TAB无法列举出可用的 upstart services 清单。然而在非EC2环境中，例如自行安装Ubuntu 14/15/16发行版后upstart的自动补全功能是有效的。

为此，在EC2中则需要添加自定义补全脚本到 /etc/bash-completion.d/中，并logout & login以使能它（前提是已经安装了 bash-completion软件包）。

 

## 参阅

[自定义Mac Bash补全和高亮显示](https://rawbin-.github.io/操作系统/开发环境/2016/04/02/custom-bash/)

https://datahunter.org/bash-completion

https://www.cyberciti.biz/faq/fedora-redhat-scientific-linuxenable-bash-completion/

[bash-completion 自动补全功能增强](http://foolishfish.blog.51cto.com/3822001/1610101)

[编写 Bash 补全脚本](http://kodango.com/bash-competion-programming)

  

 

## 🔚