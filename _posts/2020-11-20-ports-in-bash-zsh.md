---
layout: single
title: 'ports 更新版 - 如何从命令行快速检视已侦听端口'
date: 2020-11-21 10:23:00 +0800
last_modified: 2020-11-19 10:23:00 +0800
Author: hedzr
tags: [shell, bash, zsh, devops]
categories: devops shell
comments: true
toc: true
header:
  overlay_image: /assets/images/bash-shell.png
  overlay_filter: rgba(255, 255, 255, 0.5)
excerpt: >-
  如何从命令行快速检视已侦听端口，...
---





以前（按：[Ubuntu Server 安装提要](/devops/linux/ubuntu-20.04-setup-essentials/)）曾经提到过初装系统之后需要做的事，其中之一是添加 ports 命令。方法是在 .bashrc 中增加一段 bash function 定义，目的在于提供一条简便指令以便查看当前已经打开的端口列表。

时过境迁，现在这条命令不但适合于 bash，也已经更新为适合 zsh 环境，不但在服务器上是条好指令，在工作用机上面照样有用得很。

下面就是目前我所用的 `ports`，新鲜的版本：

```bash
ports() {
    local SUDO=${SUDO:-}
    if [[ $# -eq 0 ]]; then
        eval $SUDO lsof -Pni | grep -E "LISTEN|UDP"
    else
        local p=''
        local i
        for i in $*; do
            if [[ "$i" -eq "$i" ]]; then
                p="$p -i :$i"
            else
                p="$p -i $i"
            fi
        done
        eval $SUDO lsof -Pn $p
    fi
}
```

用法基本相同：

```bash
$ ports
...
$ ports 3306
...
$ ports 3306 6379
...
$ SUDO=sudo ports
...
```

要不要 sudo 取决于你在什么环境中使用 ports。对于 Linux 服务器来说，可以预设 `export SUDO=sudo` 且使能免密sudo 功能来使得 ports 指令具有特权。对于 macOS 工作机的话，无需额外操作，因为你的当前账户身份具有足够的特权来列举端口。

---

在 macOS 中，可以额外附加一条：

```bash
ports_simple(){
	ports|grep -vE 'grep|v2ray|docke|V2Ray|MEGA|Google|iSta|Dropbox|rapportd|sharingd|PDF|WeChat|clion|WiFi|loginwind|identitys|assistant'
}
```

ports_simple 可以滤除你不太想看到的一些总是会有的端口，削减产出的端口列表，以利于你寻找问题。















🔚