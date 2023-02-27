---
layout: single
title: 'Golang 中使用私有模块'
date: 2023-02-25 00:07:11 +0800
last_modified_at: 2023-02-25 00:29:11 +0800
Author: hedzr
tags: [golang]
categories: golang
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-1.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  记录一下方法 ...
---

## 方法

假设有一个私有仓库 hedzr/go-lb-ref 放在 github 上，如何使用它呢？以下是关键性的要点的节录，以充作快速查阅之用。

1. 建立私有仓库并推入 [github.com/hedzr/go-lb-ref](https://github.com/hedzr/go-lb-ref)。嗯，其他人请勿点击该链接进入，毕竟是我用来测试的。该源码实际上早已开源在 [hedzr/lb](https;//github.com/hedzr/lb)。所以你可以出门往左去瞅瞅。

2. 修改本地的 git 全局配置文件 `$HOME/.gitconfig`，加入如下的片段：

   ```ini
   [url "ssh://git@github.com/hedzr"]
   	insteadOf = https://github.com/hedzr
   ```

   注意这个设定的意图是将所有的我的仓库全都从 https 协议自动切换为 ssh 协议。

   反正都是我自己的，改成 ssh 协议之后 pull/push 都要流畅的多，因为 https 常常抽风。

   你还可以采用更激进的方式：

   ```ini
   [url "ssh://git@github.com"]
   	insteadOf = https://github.com
   ```

   请放心，这些设定完全不会影响到你的日常开源项目的管理和维护。这是因为你在维护常规项目时已经做好了 SSH Key 方面的配置。 如果尚未做好，请查阅 [Adding a new SSH key to your GitHub account](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account) 去完成它。

3. 本地的 go sdk 环境做一下 GOPRIVATE 设定

   ```bash
   go env -w GOPRIVATE="gitlab.com/my-priv/*,github.com/hedzr/*"
   ```

   它和 GOPROXY 的语法差不多，多个值之间以逗号隔开，此外还可以使用通配符。你也可以使用 github url 的激进版：

   ```bash
   go env -w GOPRIVATE="gitlab.com/my-priv/*,github.com/*"
   ```

   这一个嘛，我不是很推荐。

4. 开启新项目，引用我们的私有仓库中的 go module，使用的方式和寻常的 go modules 无异，完全透明。

### 解释

上面的办法的核心在于通过 SSH Key 的方式将你的个人信用自动提供给了 ssh 方式拉取私有仓库。此外借助于 git 自身的 url 替换能力透明地将 https 协议转换为 ssh 协议。

两者相加，就解决了私有仓库的 import 问题。

这个办法能够适用于自定义域名的 git repository。例如你在 mydomain.com 搭建了团队使用的 gitlab 服务器，并给团队成员们分配了 登录账户，团员们也都完成了 ssh key 的登记。那么他们也可以简单地做如下两个步骤来使用 mydomain.com 中的 golang 代码仓库：

1. https 协议转换：

   ```ini
   [url "ssh://git@mydomain.com"]
   	insteadOf = https://mydomain.com
   ```

2. 本地的 GOPRIVATE 设定

   ```bash
   go env -w GOPRIVATE="gitlab.com/my-priv/*,mydomain.com"
   ```

这就是全部了。





🔚