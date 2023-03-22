---
layout: single
title: "Bison build 出错，xsltproc failed with status 127"
date: 2023-03-22 12:33:00 +0800
last_modified_at: 2023-03-22 13:20:00 +0800
Author: hedzr
tags: [c++]
categories: c++ cp
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20230322212542327.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  莫名其妙的错误，以及 gcc-12 builder in Docker ...
---

## 问题

### 问题1，bison 时 xsltproc 失败

在 Ubuntu 22.04 上安装了 gcc 然后做一个构建，然后得到了一个错误：

```bash
parser.y: error: xsltproc failed with status 127
```

如下图

![image-20230322212542327](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20230322212542327.png)

这个项目中用到了 flex 和 bison，然后构建过程中 bison 的处理失败，报错如上。

我能够确定 parser.y 非常正确，因为在 macOS 上构建是一点错没有的，转而到服务器上去做的时候就不行了。

算是个百思不解的问题。

然后后来还是解决了：只要安装缺失的 xsltproc 就行了：

```bash
sudo apt-get install -y bison xsltproc
```

这算是个不大不小的挫折。原来，`failed with status 127` 说的就是找不到那个执行文件啊。



### 问题2：flex include directory NOTFOUND

同上，在一开始，先有的是 Flex 的错误，还在 CMake 寻找 Flex 的时候就失败了，说是：

```bash
-- - FLEX 2.6.4 FOUND: /usr/bin/flex, inc: FLEX_INCLUDE_DIR-NOTFOUND - BUILT FOR 
```

明明 flex package 已经安装了，明明 CMake 都找到了 flex 执行文件了，非要说 FLEX_INCLUDE_DIR-NOTFOUND。

我就真的设法钻到 runner 里面去 find 了一下，还真是没有 FlexLexer.h 头文件。

后来也找到了原因，因为 ubuntu 不知道从什么时候起，把这个头文件搬到 fl-dev 里面去了，同样地，fl.a 链接库也在那个包里面。所以需要这么做：

```bash
sudo apt install -y flex libfl-dev
```

确实是个低级错误。



### 问题3: doxygen 缺少组件 dot

这个问题其实很古老，也不困难。但是经常会写脚本时忘记安装 graphviz 包，dot 这个执行文件就在这个包里面。

所以：

```bash
sudo apt install -y doxygen graphviz
```

就是这样。



### 用作制作 gcc-12 builder 的 Docker 源文件

于是顺便更新一下 Dockerfile 中的有关序列：

```Dockerfile
FROM ubuntu:jammy
# 22.04

ARG DEBIAN_FRONTEND=noninteractive
ARG APT_MIRROR_SITE=archive.ubuntu.com
ARG PROXY

ENV MIRROR="${APT_MIRROR_SITE:-archive.ubuntu.com}" \
    HTTP_PROXY="${PROXY}" \
    HTTPS_PROXY="${PROXY}"

RUN sed -i "s@//.*archive.ubuntu.com@//$MIRROR@g" /etc/apt/sources.list \
    && apt-get update -y

RUN fetchDeps=" \
    ca-certificates locales \
    software-properties-common gpg-agent curl wget lsof \
    python3 python3-pip \
    git ccache clang-tidy build-essential \
    make cmake automake bison flex xsltproc libfl-dev \
    libtool pkg-config \
    doxygen graphviz \
    "; \
    TZ=Etc/UTC; LOCALE=en_US.UTF-8; \
    echo && echo && echo "install basics ..." \
    && apt-get install -y --no-install-recommends ${fetchDeps}

RUN echo && echo && echo "install gcc-12 ..." \
    && add-apt-repository --yes -u ppa:ubuntu-toolchain-r/test \
    && echo && echo && apt-get install -y gcc-12 gcc-12-locales g++-12-multilib \
    && [ -x /usr/bin/gcc-12 ] && update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-12 50 --slave /usr/bin/g++ g++ /usr/bin/g++-12 \
    && echo 1 | update-alternatives --config gcc

RUN echo && echo && echo "setup locale ..." \
    && locale-gen $LOCALE \
    && cat /etc/default/locale && echo "Original TimeZone is: $(locale -a)" && date +'%FT%T%z' \
    && ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ | tee /etc/timezone \
    && echo "Current TimeZone updated: $(locale -a)" && date +'%FT%T%z'

RUN echo && echo && echo "install conan ..." \
    && pip3 install conan

RUN echo && echo && echo "cleanup ..." \
    && echo "# SKIP #: apt-get purge -y --auto-remove ${fetchDeps}" \
    && rm -rf /var/lib/apt/lists/* \
    && cat <<-EOF
	    python3: $(python3 --version)
	    git: $(git --version)
	    doxygen: $(doxygen --version)
	    clang-tidy: $(clang-tidy --version)
	    gcc: $(gcc --version)
	    gcc-12: $(gcc-12 --version)
	    flex: $(flex --version)
	    bison: $(bison --version)
	    cmake: $(cmake --version)
	    conan: $(conan --version)
	    timstamp: $(date +'%FT%T%z')
	EOF

```

这个 Dockerfile 制作的构建环境，可以被直接用在 GitLab CI 中。





:end:

