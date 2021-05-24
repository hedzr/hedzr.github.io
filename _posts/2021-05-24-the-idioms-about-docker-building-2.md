---
layout: single
title: 'Docker 惯用法续 - Packaing a Go App'
date: 2021-05-23 05:11:00 +0800
last_modified_at: 2021-05-24 19:52:00 +0800
Author: hedzr
tags: [devops, docker, lfs, linux from scratch, docker-compose, golang]
categories: devops docker
comments: true
toc: true
header:
  overlay_image: /assets/images/docker-cloud-twitter-card.png
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Smaller, Faster container in docker building ...
---





> Dockerfile Idioms - II



此前在  [The Idioms about docker Building | hzSomthing](https://hedzr.com/devops/docker/the-idioms-about-docker-building/) 我们已经提到过，为了有效缩减最终容器镜像的尺寸，应该在有可能的情况下使用 [Docker Scratch image](https://hub.docker.com/_/scratch/)。

随着时间推移，新的手段在增加，过时的方法被废弃，因此今天有必要做一定的更新。

在这里，我打算维持旧文章不变，针对 go app 的 docker 打包做一个专项的描述，将一些最佳实践展示出来。

## 关于 golang 程序的打包



### 基本的多遍构建和打包



#### 非 Go Modules 构建方法

```dockerfile
#
# Stage I
#
FROM golang:alpine AS builder

# Install git.
# Git is required for fetching the dependencies.
RUN apk update && apk add --no-cache git
WORKDIR $GOPATH/src/mypackage/myapp/
COPY . .

# Fetch dependencies.
# Using go get.
RUN go get -d -v

# Build the binary.
RUN go build -o /go/bin/hello


#
# Stage II
#
FROM scratch
# Copy our static executable.
COPY --from=builder /go/bin/hello /go/bin/hello
# Run the hello binary.
ENTRYPOINT ["/go/bin/hello"]
```



#### 基于 Go Modules 的 构建方法

区别不大，但这是现在更常用的方法了：

```dockerfile
#
# Stage I
#
FROM golang:alpine AS builder

# Install git.
# Git is required for fetching the dependencies.
RUN apk update && apk add --no-cache git
WORKDIR $GOPATH/src/mypackage/myapp/
COPY . .

# Fetch dependencies.
# Using go get.
RUN go mod download

# Build the binary.
RUN go build -o /go/bin/hello .


#
# Stage II
#
FROM scratch
# Copy our static executable.
COPY --from=builder /go/bin/hello /go/bin/hello
# Run the hello binary.
ENTRYPOINT ["/go/bin/hello"]
```



#### 额外的 Go 构建参数

Golang 构建指令允许去除调试信息而获得更小的目标文件输出，这是通过 LDFLAGS 参数来实现的。

具体来说，在 go < 1.10 时，你可以采用这样的 RUN 指令：

```dockerfile
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -ldflags="-w -s" -o /go/bin/hello

而在 go >= 1.10 时，需要这样的 RUN 指令：

​```dockerfile
RUN GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /go/bin/hello
```

注意，在我们的多遍构建方案中，是不需要明确指定 GOOS 和 GOARCH 的，而是交给 go 自己去判断容器的 OS 属性（在我们的方案中是 alpine linux）。同时，也由于 alpine 的特性（默认时它不带有 gcc），所以你总是需要 `CGO_ENABLED=0` 作为前缀。所以在 Go Modules 多遍构建中，你通常应该使用这样的 RUN 指令：

```dockerfile
RUN CGO_ENABLED=0 go build -ldflags="-w -s" -o /go/bin/hello
```



### 添加用户

即使是在容器中，我们也应该保持 go app 运行于非特权账户身份之下，避免潜在的攻击能够借助于取得了容器特权之后使用穿透技术去进一步地攻陷宿主服务器。

所以，我们需要在构建 Stage 中添加用户，然后将这样的用户记录复制到 Scratch 镜像中，从而完成非特权用户身份的构造。

之所以不得不这么做，是因为 Scratch 镜像是一个零字节镜像，既没有基本的 /etc 乃至于 /bin 环境，也没有任何可被利用的 shell 指令，你甚至不可能在这个镜像中执行 touch a.txt 这样的 shell 命令。

如此，可供参考的非特权账户身份的构造需要这样的方法：

```dockerfile
# Stage I
FROM golang:alpine AS builder

RUN apk update && apk add --no-cache git

ARG USERNAME
ARG GROUP_ID
ARG USER_ID
ENV USER=${USERNAME:-appuser}
ENV UID=${USER_ID:-10001}
ENV GID=${GROUP_ID:-$UID}
ENV APP_HOME=$GOPATH/src/mypackage/myapp/

# See https://stackoverflow.com/a/55757473/12429735RUN 
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    "${USER}" \
    && mkdir -p $APP_HOME \
    && chown -R $USER: $APP_HOME

WORKDIR $APP_HOME
COPY . .

RUN go mod download \
    && CGO_ENABLED=0 go build -ldflags="-w -s" -o /go/bin/hello


# Stage II
FROM scratch

# Import the user and group files from the builder.
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

# Copy our static executable.
COPY --from=builder /go/bin/hello /go/bin/hello

# Use an unprivileged user.
USER appuser:appuser

ENTRYPOINT ["/go/bin/hello"]
```



为了提供必要的构建参数，你可以这样发起 docker 构建命令：

```bash
docker build \
       --build-arg USER_ID=$(id -u) \
       --build-arg GROUP_ID=$(id -g) \
       -t my-org/my-app:$VERSION \
       -t my-org/my-app:latest .
```

如果有必要，你还可以指定用户名：

```bash
--build-arg USERNAME=goappuser
```

但这并不被建议。原因在于 dockerfile 中的 USER 指令在支持环境变量展开方面有时候会模棱两可，这可能属于有未知力量介入的场景。类似的情况还发生在 `.env` 文件中的 Shell 环境变量展开问题，同样的是时灵时不灵。

由于有时候不灵，而不灵的部分却难以复现，更重要的是我并没有精力去为它们做这次小白鼠，因此避开这一特性就成为了首选。

至于提供那样的能力（可以定制用户名或者类似的其他参数），纯粹是做类库开发太久了之后的惯用法，基本属于本能。

附带一提，ENTRYPOINT 指令也并不友善地支持环境变量展开。



### 添加 SSL CA 证书

同样的道理，在 Scratch 镜像中是没有 CA 证书的。如果你的 app 是将要提供 TLS/SSL 等类型的服务时，你需要在容器中预先插入 CA 证书，才能让证书链的校验有可能被完成。

为了权威性和安全性，通常我们不会建议你将自签名的证书也送入 Scratch 中已经建立的 CA 证书表里去。这需要另外的解决方案。稍后我们会就此给出恰当的建议。

那么，添加证书的方法如下：

```dockerfile
# Stage I
FROM golang:alpine as builder

# Install git + SSL ca certificates.
# Git is required for fetching the dependencies.
# Ca-certificates is required to call HTTPS endpoints.
RUN apk update && apk add --no-cache git ca-certificates && update-ca-certificates

ARG USERNAME
ARG GROUP_ID
ARG USER_ID
ENV USER=${USERNAME:-appuser}
ENV UID=${USER_ID:-10001}
ENV GID=${GROUP_ID:-$UID}
ENV APP_HOME=$GOPATH/src/mypackage/myapp/

# See https://stackoverflow.com/a/55757473/12429735RUN 
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    "${USER}" \
    && mkdir -p $APP_HOME \
    && chown -R $USER $APP_HOME

WORKDIR $APP_HOME
COPY . .

RUN go mod download \
    && CGO_ENABLED=0 go build -ldflags="-w -s" -o /go/bin/hello


# Stage II
FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

COPY --from=builder /go/bin/hello /go/bin/hello

USER appuser:appuser

ENTRYPOINT ["/go/bin/hello"]
```



### 添加时区信息

一样的道理，时区信息可能是你的服务所需要依赖的基础。

```dockerfile
# Stage I
FROM golang:alpine as builder

# Install git + SSL ca certificates.
# Git is required for fetching the dependencies.
# Ca-certificates is required to call HTTPS endpoints.
RUN apk update && apk add --no-cache git ca-certificates tzdata && update-ca-certificates

ARG USERNAME
ARG GROUP_ID
ARG USER_ID
ENV USER=${USERNAME:-appuser}
ENV UID=${USER_ID:-10001}
ENV GID=${GROUP_ID:-$UID}
ENV APP_HOME=$GOPATH/src/mypackage/myapp/

# See https://stackoverflow.com/a/55757473/12429735RUN 
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    "${USER}" \
    && mkdir -p $APP_HOME \
    && chown -R $USER: $APP_HOME

WORKDIR $APP_HOME
COPY . .

RUN go mod download \
    && CGO_ENABLED=0 go build -ldflags="-w -s" -o /go/bin/hello


# Stage II
FROM scratch

COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

COPY --from=builder /go/bin/hello /go/bin/hello

USER appuser:appuser

ENTRYPOINT ["/go/bin/hello"]
```



有的时候，你不仅需要 Time Zone Database 也就是 tzinfo 的支持，也需要区域信息（国家和语言）的支持，此时简单地添加 locales 包即可。

进一步地，如果你希望改变运行环境中的时区信息，或者你的 app 将会明确指定运行环境（通常这并不包含 webapp 向 web 用户提供的时区区域定制功能，是否需要，取决于应用程序的语言支持、运行库支持以及你的代码如何编写），你需要额外的动作诸如复制 timezone 文件和或 localtime 文件等等。

```dockerfile
# Stage I
RUN apk add --no-cache git ca-certificates tzdata

RUN cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime
RUN echo "America/Sao_Paulo" >  /etc/timezone

# Stage II
COPY --from=builder /etc/localtime /etc/localtime
COPY --from=builder /etc/timezone /etc/timezone
COPY --from=builder /usr/share/i18n /usr/share/i18n
COPY --from=builder /var/lib/locales /var/lib/locales

ENV TZ America/Sao_Paulo
ENV LANG pt_BR.UTF-8
ENV LANGUAGE pt_BR.UTF-8
ENV LC_ALL pt_BR.UTF-8

```

然而，locales 包应该包含的内容不仅仅如此（尤其是该包已被废弃），所以完整地复建 locales 环境是很复杂的事情，有兴趣的小伙伴可以自行研究，欢迎探讨。

一些参考在：

- [区域设置 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/%E5%8C%BA%E5%9F%9F%E8%AE%BE%E7%BD%AE) 
- [Setting the timezone - Alpine Linux](https://wiki.alpinelinux.org/wiki/Setting_the_timezone)
- [How I use locales in Alpine · Issue #144 · gliderlabs/docker-alpine](https://github.com/gliderlabs/docker-alpine/issues/144) 
  -  [Locales alpine 3.9](https://gist.github.com/Herz3h/0ffc2198cb63949a20ef61c1d2086cc0) 
- https://github.com/Auswaschbar/alpine-localized-docker
- https://gitlab.com/dcs3spp/alpine-locale

一个可行的方法由 Herz3h 给出：[Locales alpine 3.9](https://gist.github.com/Herz3h/0ffc2198cb63949a20ef61c1d2086cc0) .





#### 为何通常无需定制运行环境的时区？

实际上绝大多数服务的运行环境不应该设置 TZ，LANG 等等环境变量。**因为作为服务来说，保持中立的态度才是正确的**。

这意味着你的服务应该总是处理 UTF-8 字符集，总是基于 UTC 时区，总是操作 UTC 时间戳记，总是认为自己是无国籍的，没有语言预设。

数据应该以何种方式被呈现给最终用户，不是服务所应该关心的事情，服务一定要保持中立态度，操作无属性的数据，保持数据的原始性。

可惜知道这一点的人不多。



## 其他

总的来说，在 Scratch 镜像中重新构建 linux 的基本环境，是个很有意思的课题。

### LFS

如果你想要在这方面深入研究，首先要好好地研究一遍乃至数遍  [Linux From Scratch](https://www.linuxfromscratch.org/) 。Linux From Scratch 现在已经是一个大规模的概念了，所以这里给出的官网包含一个总体的介绍。

而作为入门者，首先需要直入 [LFS](https://www.linuxfromscratch.org/lfs/) 门户（在线阅读：[here](https://www.linuxfromscratch.org/lfs/read.html)）。也就是所谓的从零开始构建 Linux 基本环境的权威指南。它介绍了如果从 linux 源代码开始做编译和链接，如何组织 linux 启动镜像和基本运行环境，也介绍了如何在基本环境上叠加进一步的工具环境。

> 基本背景：
>
> 如何选择 sysv 和 systemd？这是 linux 系统服务应该如何被管理的两种基本组件以及管理系统，你可以任选。我建议你两者都要深入研究，因为这能帮助你更完整地理解 Linux 的组织体系以及相关哲学。

在此基础上，我建议你进一步学习 Debian 的构建指引：[Debian 开发者天地](https://www.debian.org/devel/) 。但这里我不给出具体的 page 了，因为除非你对 LFS 有了概念、有所掌握，否则千头万绪之中你是找不到该看什么的。

我只能告诉你的是，Debian 提供了如何将你的软件包按照它们的方式发行的方法，这也是 Debian 或者其他 Linux 发行版所采取的基本策略（尽管可能大家不会采用同一种包管理软件）。所以在 LFS 基础上进一步研究发行版是怎么构造出来的，是必由之路。







### alpine 加速

一般来说，alpine 还是挺给力的。不过，网络质量通常都如六月天气，说变就变。所以有时候，你还是需的着的：

```dockerfile
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories
```

可以使用的源有：

- mirrors.aliyun.com
- mirrors.ustc.edu.cn
- mirrors.tuna.tsinghua.edu.cn
- 等等

这在我们的 mirror-list 中也有介绍：[hedzr/mirror-list](https://github.com/hedzr/mirror-list#alpine-apk)。



### CGO or CGO not

前文述及，一般情况下在 alpine golang 构建中，cgo 需要被禁用，因为gcc不存在。

那么，当你必需启用 cgo 时，你可能需要提前安装gcc相关包：

```dockerfile
RUN fetchDeps=" \
            git ca-certificates tzdata \
            musl-dev musl-utils strace \
            bash less nano wget lsof unzip \
            busybox-extras \
            iputils bind-tools \
            curl \
            cmake \
            gcc \
            freetype-dev \
    	"; \
    apk update \
    && apk --update add ${fetchDeps} \
    && update-ca-certificates


# go build commands here

# (Optional) AT LAST:
# RUN rm /var/cache/apk/*
```

根据需要，你应该调整上面 getchDeps 中的列表。在大多数情况下，你只需要 gcc 以及 git 这两个包。这里作出这样的罗列，目的在于有的工具查找起来还是有点费事的，既然找到了，也别浪费，就当作是一个记录好了。



### 无法运行

一些情况下，你构建的 golang app 容器可能无法启动。有时候它表现为启动容器后没有任何日志输出。

一般情况下，golang app 有可能产生到 glibc 的动态库的依赖（尤其是当你开启了 CGO_ENABLED 时）。想要检查你的 app 存在哪些 so 依赖，可以使用 ldd 命令：

```bash
/go # ldd /bin/sed
	/lib/ld-musl-x86_64.so.1 (0x7f449cc08000)
	libc.musl-x86_64.so.1 => /lib/ld-musl-x86_64.so.1 (0x7f449cc08000)
```

在 alpine linux 上，go build 所产生的依赖是到 musl 的 libc.so 而不是 glibc。

所以，如果 go app 无法启动的话，大体上有这么几种解决方法：

1. 使用 [hub.docker.com/r/frolvlad/alpine-glibc](https://hub.docker.com/r/frolvlad/alpine-glibc/) 而不是 golang:alpine 作为 builder 的基准镜像，不过你需要自行拉取 golang package 之后才能展开构建。或者自行添加 glibc 包到你的构建 Stage 中，并复制到 Scratch Stage 中。
2. 在构建 app 完成之后使用 ldd 确认相应的 so 依赖，然后解决这些缺失的 so。注意，在两遍构建时，你不但要在 builder 中解决 so 依赖，还要将 /usr/lib* 复制到 Scratch 镜像中。



## 小结

还有没有更多的缩减尺寸的方法？

请参考我的旧文章： [The Idioms about docker Building | hzSomthing](https://hedzr.com/devops/docker/the-idioms-about-docker-building/) 

其中有一条值得今天再度强调一遍：

- 调整命令顺序，合并相同命令，使得产生更少的层

由于 Stage I 作为 builder 最终将被抛弃，因此上述规则只应该被用在 Stage II 之中。进一步地，Stage I 中我们建议你尽可能分列每一条指令。

Why？便于调试呀阿当。在反复尝试构建你的 dockerfile 指令序列时，分列不同的命令，让它们尽可能地能被 docker build 建立为独立的层，将会有利于下一次构建时加速（如果该层没有发生变动，并且被检测为 CACHED 状态的话，就可以直接被再次取用而无需实际地构建）。

所以构建加速和最终容器尺寸是一对需要平衡的指标。

这很有趣，这也是生活。

## ref

 [Docker ARG, ENV and .env - a Complete Guide · vsupalov.com](https://vsupalov.com/docker-arg-env-variable-guide/) 

 [Environment variables in Compose - Docker Documentation](https://docs.docker.com/compose/environment-variables/) 

 [How to find out the dynamic libraries executables loads when run? - Unix & Linux Stack Exchange](https://unix.stackexchange.com/questions/120015/how-to-find-out-the-dynamic-libraries-executables-loads-when-run) 





🔚