---
layout: single
title: 关于 docker 容器的 Tags
date: 2020-07-09 09:15:11 +0800
Author: hedzr
tags: [docker, container, tags, devops]
categories: devops docker
comments: true
toc: true
header:
  overlay_image: /assets/images/docker-cloud-twitter-card.png
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  关于 docker 容器的标签（Tags），我想说的是……
#header:
#  overlay_image: /assets/images/unsplash-image-1.jpg
#  overlay_filter: rgba(0, 0, 0, 0.15)
#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---





关于容器镜像的标签，下面会提到一些技巧。



### 添加 Tag

#### `docker tag`

`tag` 命令可以为容器打上标签

```bash
❯ docker tag --help

Usage:	docker tag SOURCE_IMAGE[:TAG] TARGET_IMAGE[:TAG]

Create a tag TARGET_IMAGE that refers to SOURCE_IMAGE
```

注意第一个参数是一个已有的容器镜像，例如 `ubuntu:18.04`。第二个参数是想要打上的标签，例如 `ubuntu:latest`。



`docker build -t`

所以对于容器创建者来说，问题就在于第一个标签哪儿来的。这就是 `docker build` 的 `-t` 参数要干的事了：

```bash
❯ docker build --help

Usage:	docker build [OPTIONS] PATH | URL | -

Build an image from a Dockerfile

Options:
  -t, --tag list                Name and optionally a tag in the 'name:tag' format

```

在构建时实际上是可以给出一堆想要打的标签：

```bash
docker build -t latest -t ubuntu:latest-mod -t ubuntu:20.04-mod .
```

参阅：<https://docs.docker.com/engine/reference/commandline/build/#tag-an-image--t>



### 删除 Tag

#### `docker rmi`

`rmi` 命令通过指定的 hash 或者 tag 来删除容器镜像。其格式如下：

```bash
❯ docker rmi --help

Usage:	docker rmi [OPTIONS] IMAGE [IMAGE...]

Remove one or more images

Options:
  -f, --force      Force removal of the image
      --no-prune   Do not delete untagged parents
```

没有指定 `--no-prune` 参数的话，rmi 将会在真的删除容器镜像的前提下，上溯容器的父级各个文件系统层，并自动删除首先发现的（也就是没有后裔依赖的）那些没有关联到一个 tag 的文件系统层。

> 我们知道通过诸如 FROM，RUN，ENV 等 Dockerfile 指令构建的一个容器镜像实际上是依次叠加的多级文件系统层，每一层对应着一条 Dockerfile 指令。
>
> 例如对于 FROM 指令来说，docker build 会取得对应的父容器例如 ubuntu:latest 并关联到这个 tag 所指向的文件系统层 U，这个层 U 的最终视图实际上包含了一个完整的 ubuntu 系统的全部文件，彷佛一个完整的物理磁盘一样。
>
> 随后我们的 `RUN` 指令在对这个层 U 作出了一些修改，这些修改就构成了新的一层 N。
>
> 对于一个容器镜像来说，通常它包含了很多没有关联任何 tag 的文件系统层，对应着其 Dockerfile 中的每一条指令。

`--force` 会不关心容器镜像有没有调度在运行中的实例、或者是不是有已经停运的实例，总是删除指定的容器。

不过如果指定 tag 的容器如果还有别的关联（例如别的 tags，或者后裔）的话，rmi只会删除指定的 tag 而不会物理上删除这个文件系统层（乃至其无关联的上级）。



#### 删除一个标签而不移除容器本身

只要你的容器有多个标签，那么 `docker rm` 将会删除一个指定的标签且保留容器本身。

或者如果你的容器还有别的依赖于它而构建的容器的话，同样的容器的文件系统层本身也会被保留。



#### 删除 `<none>` 的镜像

通常我们在做过很多容器构建之后，特别是当某个容器的 Dockerfile 被反复修改反复构建的情况下，通过 docker images 我们会看到很多标记为 `<none>` 的镜像：

```bash
❯ docker images
REPOSITORY             TAG                 IMAGE ID            CREATED             SIZE
<none>                 <none>              8c3413f7bb0e        9 hours ago         643MB
<none>                 <none>              6fe3033c98bc        9 hours ago         637MB
<none>                 <none>              1477b57e8ca4        9 hours ago         637MB
<none>                 <none>              608f155472e8        9 hours ago         637MB
<none>                 <none>              80ad380c1615        9 hours ago         637MB
<none>                 <none>              bd179808c8e0        9 hours ago         637MB
<none>                 <none>              0576b401fe66        10 hours ago        637MB
<none>                 <none>              5da3f098818b        10 hours ago        637MB
<none>                 <none>              7a459271eea9        11 hours ago        637MB
<none>                 <none>              d542b0a8b75c        11 hours ago        637MB
<none>                 <none>              2c5d8ccd19f7        11 hours ago        637MB
<none>                 <none>              a6942148687a        11 hours ago        637MB
<none>                 <none>              5e32e2a7bb9e        11 hours ago        637MB
<none>                 <none>              17bb971d83fb        11 hours ago        370MB
<none>                 <none>              dd5876b96bef        11 hours ago        370MB
<none>                 <none>              878e46dfad27        11 hours ago        370MB
<none>                 <none>              f57ed09135d2        11 hours ago        370MB
<none>                 <none>              79d6a7f1dca4        11 hours ago        370MB
<none>                 <none>              3d64c65a426d        11 hours ago        370MB
<none>                 <none>              cf409aad6be9        12 hours ago        370MB
<none>                 <none>              30926f619369        14 hours ago        627MB
busybox                latest              c7c37e472d31        10 days ago         1.22MB
```

关于这些镜像，我们需要知道的是：

- 它们都是无后裔的，没有他人对其依赖
- 它们都可以被安全地删除

要删除这些 `<none>` 镜像（实际上就是一个无后裔无关联的文件系统层），我们需要通过其 hash 才能完成：

```bash
docker rmi 30926f619369
```

显然，我们需要一个自动化的操作，把这些碍眼的家伙一起干掉，我不要去找这些hash，然后粘来粘去的。这样的话我们可以有一个 bash 函数 `docker-rmi-none` 来做：

> 如果想要为你的 Terminal 环境增加一系列的 docker 专用扩展函数的话，可以安装我的[^1]：
>
> <https://github.com/hedzr/docker-functions>

```bash
function docker-rmi-none() {
  for i in `docker-images-none-cids`; do
    echo $i
    #local cid=$(docker-cid "$i")
    #[ "$cid" != "" ] && 
    local pid=$(docker-pid "$i" 2>/dev/null)
    [ "$pid" != "" ] && echo "-------- Clean the stopped container: $i, $pid" && docker rm -f $pid
    [ "$i"   != "" ] && echo "-------- Erase the container: $i, $pid" && docker rmi -f $i
  done
}

function docker-images-none-cids() {
    docker images | grep -Ei "<none>" | grep -Eio " ([0-9a-f]{12}) "
}

function docker-cid() {
	CID=$(docker ps | grep -Eoi "^[0-9a-f]+[ \t]+$1" | grep -Eoi "^[0-9a-f]+")
	[ "$CID" != "" ] && echo $CID || echo $1
}

alias docker-pid="docker inspect --format '{{.State.Pid}}'"
```

用法很简单：

```bash
❯ docker-rmi-none
-------- Erase the stopped container: 734ef03e0ffc,
Deleted: sha256:734ef03e0ffccf1c01b3a213f6f5bfb73367bd2293600dfee80210258c0afaa7
Deleted: sha256:3d6a9a8a2cd42bfe2f2edeb62b42ef5eb16dbb734282c0feba5d155bfb879fbd
Deleted: sha256:0e86a615e08cb8188a63c8e9ae5e7538395e84d494395eba65089f5dc94f0307
Deleted: sha256:5ba4bcd0f855c3c4c129f8870f08d00d4de2d6e1ed29590347a53b360052c151
Deleted: sha256:48a6e94cc47827a8cbc6cea9c713b457fd5ae35a55690fbd323e6bb81fd6965b
Deleted: sha256:25f9f3d461d0f29da1be391c29ce78576a93861efed01560757d95b79d12185a
26002ba9abc2
-------- Erase the stopped container: 26002ba9abc2,
Deleted: sha256:26002ba9abc2bb636cf9be93168a6cb9f8497ec03bb15c48e20a4f93f50760a0
Deleted: sha256:62f0e4fa5da23a698e297922f5f5a8dd1ccf6d3d55fe8fe88ae94ed720b7d0dd

```



##### 更优秀的版本

上面是一个比较古板的实现。实际上针对 `<none>` 镜像还有更简洁美观的办法：

```bash
docker rmi $(docker images -f dangling=true -q --no-trunc)
```

关于 docker images 的 filters 的用法可以参考[^2]：

1. <https://docs.docker.com/engine/reference/commandline/images/#filtering>

这个版本是官方建议的。不过实际使用起来，有点问题，限制的更严格、选择更少，例如如果有上上次过时的已经停止的实例引用了过时的无用镜像，则这个版本会报错提示不可以删除。

```bash
Error response from daemon: conflict: unable to delete 283f7abdace2 (must be forced) - image is being used by stopped container 40193c7b0fc5
```

除非你做强制删除 --force。





##### 还可以更简单

上一条，借助了子 Shell 连接两条指令来干活。实际上还可以更加简单地在一条指令中把活给干了：

```bash
docker image prune --filter="dangling=true"
```

追加上 `-f` 可以略过确认问题直接删除。

不过这条指令有时候可能并不能恰当地工作，或许你还是需要上两个版本。

> 不要使用 `docker image prune -a` ，因为它会删掉一切容器。

> `docker system prune` 也会 *顺便* 删除无用的镜像：
>
> ```
> WARNING! This will remove:
> 	- all stopped containers
> 	- all volumes not used by at least one container
> 	- all networks not used by at least one container
> 	- all dangling images
> ```
>
> 小心使用。



##### 不要制造 `<none>` 镜像

这是有可能的。

我们或许可以从根源上解决问题，方法是在构建的同时自动删除它们，如果有的话。

这甚至无需更多的bash脚本，只要在构建是加上 `--rm` 参数即可：

```bash
docker build --rm -t golang-builder .
```

不过这种办法目前来看并不保险。因为 --rm 参数只会在构建成功之后才会起作用。

所以前面说到的古板手段可能其实还是最佳选择，时不时地跑一下就好。







[^1]: <https://github.com/hedzr/docker-functions>
[^2]: [`docker images` - Documentation](https://docs.docker.com/engine/reference/commandline/images/#filtering)





## 🔚