---
layout: single
title: 'The Idioms about docker Building'
date: 2020-08-15 14:19:00 +0800
last_modified: 2020-08-15 14:19:00 +0800
Author: hedzr
tags: [devops, docker]
categories: devops docker
comments: true
toc: true
header:
  overlay_image: /assets/images/docker-cloud-twitter-card.png
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Smaller, Faster container in docker building ...

#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---



# Dockerfile 惯用法，应该分发更小的容器



> 这是以前的旧文档了，不过陆续地我会回顾和订正一下，然后全数搬移到这边来，慢慢做，有的没意思的就扔了。



> Dockerfile Idioms



分发更小的容器，是一种应该被推荐的行为。

更小的容器，启动会更快，分发会更快，重用会更快，……。对于生命来说，快是一种态度，代表你的时间被消费的更有价值：节约时间总是正确的。



几年前，其实我就想写有关容器缩减的内容，不过那时候 alpine 还不被重视，它自己也很难用，所以我们更多地是在 ubuntu 这样的大块头上研究怎么削减最终尺寸。

值得欣慰的是，那些曾经用到的原则一直都是对的，尽管这个世界、这些生态在变，但准则没有变。



现在，关于容器尺寸削减的问题，文章多得很，问答也很多。

但我还是打算写一篇。写者嘛，总是觉得自己写的内容对一点，逻辑对一点，用词对一点，覆盖面对一点，限定语对一点。等等。



不过，这次准备随便写，不打算整构逻辑了。



## Checklist

削减容器的最终尺寸，首先考虑如下的 Checklist：

- 采用更小的基准包

  - 在绝大多数情况下，alpine是最佳选择
  - 极端情况下可以使用 distroless，但后果是没有shell，无法进入容器
  - 有的时候你可以使用 busybox

- 选取最恰当的基准包。

  - 对于 golang 服务来说，`alpine:latest` 是最佳选择
    - 但如果你需要golang构建操作，则 `golang:alpine` 可能才是对的
  - 对于 java 系列来说，这些都是好选择：
    - [anapsix/alpine-java](https://hub.docker.com/r/anapsix/alpine-java/)
    - [frolvlad/alpine-java](https://hub.docker.com/r/frolvlad/alpine-java/)
    - [openjdk](https://hub.docker.com/_/openjdk)
    - 这些也可以参考：
      - https://github.com/dockerfile/java
      - https://hub.docker.com/r/domblack/oracle-jdk8/
    - 无论哪一个，都是巨的一逼。
    - 加上 SpringCloud 之后，更是2B。
    - 选 Java 已经是错了。
  - 对于 nodejs 来说，alpine 版本是最佳的：`node:8-alpine`
  - 等等，没法一一按语言枚举。

- 使用包安装命令时，记住清除包安装过程所下载的索引、安装包

  后面我会在惯用法中更多介绍这一点。

- 去掉内存交换机制，去掉交换分区

- 不要安装带有 ncurse 依赖的工具，例如 mc

- 不要安装带有调试工具或者调试工具性质的工具，例如 vim，curl。一定要用，使用 nano 和 wget 替代它们

- 调整命令顺序，合并相同命令，使得产生更少的层

- 使用记忆功能以便去掉打包过程中才会使用的包，从而缩减最终容器尺寸

  这个记忆功能，主要是指 `alpine apk --virtual` 功能；对于 apt 则有一个 apt-mark 工具。

- 对于 apt 使用 `apt install --no-install-recommends -y ` 方式

- 使用多遍构建过程，将打包和中间内容排除在最终容器之外，以缩减其尺寸



> 下面都是基于 voxr vdeps-base 来介绍。
>
> 可以查阅 https://github.com/hedzr/docker-basics



## 各种惯用法

### alpine apk 的惯用法

较典型的做法是这样子：

```dockerfile
RUN fetchDeps=" \
    		ca-certificates \
    		bash less nano iputils bind-tools busybox-extras \
    		wget lsof unzip \
    	"; \
    apk update \
    && apk --update add ${fetchDeps} \
    && apk info -vv | sort \
    && apk -v cache clean && rm /var/cache/apk/*
# 摘自 https://github.com/hedzr/docker-basics/blob/master/alpine-base/Dockerfile
```

`apk -v cache clean` 和 `rm /var/cache/apk/*` 两者选一就可以了，这里只是为了示例。



比上例更严格精确、也更节省空间的办法是：

```dockerfile
RUN buildDeps="gcc \
      freetype-dev \
      musl-dev \
      "; \
    apl add --update --no-cache bash less nano unzip \
    && apk add --no-cache --virtual .build-deps ${buildDeps} \
    && pip install --no-cache-dir requests \
    && apk del .build-deps \
    && rm /var/cache/apk/*
```



采用国内镜像服务器加速，更舒适的结构：

```dockerfile
# 改编自 hedzr/docker-basics/golang-builder
RUN fetchDeps=" \
              ca-certificates \
            "; \
    buildDeps=" tig "; \
       cp /etc/apk/repositories /etc/apk/repositories.bak; \
       echo "http://mirrors.aliyun.com/alpine/v3.10/main/" > /etc/apk/repositories; \
       apk update \
    && apk add --virtual .build-deps ${buildDeps} \
    && apk add ${fetchDeps} \
    && echo \
    && echo "Put your building scripts HERE" \
    && apk del .build-deps \
    && rm /var/cache/apk/* \
```





### debian apt 的惯用法



```dockerfile
RUN fetchDeps=" \
    	   ca-certificates \
    	   wget nano vim.tiny net-tools iputils-ping lsof \
    	   dnsutils inetutils-telnet locales \
    	 "; \
       TZ=Etc/UTC; LOCALE=en_US.UTF-8; \
       apt update \
    && DEBIAN_FRONTEND=noninteractive apt install -y --no-install-recommends ${fetchDeps} \
    && locale-gen $LOCALE \
    && cat /etc/default/locale && echo "Original TimeZone is: $(locale -a)" && date +'%z' \
    && ln -s /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ | tee /etc/timezone \
    && echo "Current TimeZone updated: $(locale -a)" && date +'%z' \
    # && apt-get purge -y --auto-remove ${fetchDeps} \
    && rm -rf /var/lib/apt/lists/*
# 时钟时区部分可以去掉
# 摘自 https://github.com/hedzr/docker-basics/blob/master/ubuntu-mod/Dockerfile
```

对于用到 python pip 的场景还可以这样：

```dockerfile
RUN buildDeps="curl python-pip" \
    && apt-get update \
    && apt-get install -y --no-install-recommends $buildDeps \
    && pip install requests \
    && apt-get purge -y --auto-remove $buildDeps \
    && rm -rf /var/lib/apt/lists/*

```

用到 build-essential 或者 gcc 系的也可以类似地处理：

```dockerfile
RUN buildDeps="curl wget build-essentials flex bison make cmake autoconf automake git libtool"; \
    fetchDeps="nano wget curl"; \
    apt-get update \
    && apt-get install -y --no-install-recommends $fetchDeps \
    && AUTO_ADDED_PACKAGES=`apt-mark showauto` \
    && apt-get install -y --no-install-recommends $buildDeps \
    && mkdir build \
    && cd build \
    && cmake .. \
    && make && make install \
    && apt-get purge -y --auto-remove $buildDeps $AUTO_ADDED_PACKAGES \
    && rm -rf /var/lib/apt/lists/*
```



注意到我们采用了 `AUTO_ADDED_PACKAGES` 机制，这是一种 Debian 包管理系的记忆功能，可以被用来很好地削减尺寸。





### centos 的 yum 系惯用法

类似 apt，不再赘述了



### 多遍构建

尽管包管理的记忆功能能够完美地削减容器尺寸，但它并非是没有缺点的：

1. 你必须在单句 `RUN` 中写出记忆以及消除记忆的全部脚本，如果分割到多句指令，那么容器中的 OS的占地面积依然能被收缩，但容器的尺寸可能并不能被削减。

2. 如果你在单句 `RUN` 指令中完成了你的整个容器构建脚本的话，构建的开发过程将会非常痛苦，因为冗长的指令序列不能被缓存到多层中，所以每一次微小的变化都会导致 `docker build` 去完整地重建你的这个容器。

   > 所以缩减容器尺寸，应该是当你的容器构建过程已经开发完成之后才去做的事情。

好的，记忆功能有点点不完美，但是多遍构建能够很好地平衡这一切问题。

以 golang 应用的容器化为例，下面是一个多遍构建的例子：

```dockerfile
FROM golang:1.7.3 AS builder
WORKDIR /go/src/github.com/alexellis/href-counter/
RUN go get -d -v golang.org/x/net/html  
COPY app.go    .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

FROM alpine:latest  
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /go/src/github.com/alexellis/href-counter/app .
CMD ["./app"]
# 摘自 https://github.com/alexellis/href-counter
```

好吧，我自己的写的复杂得多，但暂时还不能展示，此外，复杂的版本也不利于阐述骨架结构。



## 结束

写到这里，暂时告一段落了。

关于缩减尺寸以及 Dockerfile 的惯用写法，也就先说这么多了。再要释出点什么也不是不可以，但可能涉及到的就不是仅仅 Docker 的知识了。

> 结果还是分了分章节，哎呀德性了





🔚