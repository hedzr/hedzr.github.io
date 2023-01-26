---
layout: single
title: "GitHub Actions: Resource Not Accessible by Integration"
date: 2023-01-27 05:00:00 +0800
last_modified_at: 2023-01-27 06:50:00 +0800
Author: hedzr
tags: [tech,github]
categories: tech nology
comments: true
toc: true
header:
  teaser: /assets/images/unsplash-gallery-image-1-th.jpg
  overlay_image: /assets/images/unsplash-gallery-image-1-th.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  老家伙，新问题...
---



## 事件复盘

这次问题很简单，就是在昨天发版时 Github Action 出错，说是“Error: Resource not accessible by integration”

![image-20230127065101719](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20230127065101719.png)

这个提示模模糊糊的，本来我应该意识到点什么的，但是我 rerun failed jobs 后得到了不同的错误：

![image-20230127065024455](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20230127065024455.png)

说什么“reason: socket hang up”。

于是我就凌乱了。

原本有可能正确的思路就跑偏了。

我现在就在想一件事，哦是不是 GitHub 又抽风了？（我为什么要说又呢）我去看了 [githubstatus](https://www.githubstatus.com/)，人家说 GitHub 好好的，上一次打摆子那都是 Jan-25 的事了。

那我只好去搜 GG 了。结果毫无帮助。

怎么办，挺急的。正在发版ing，能不急吗。

纠结了很久就耗不起，直接去网页上手工建了个 Release，就先发了。

纳，今天，这是第二天了，清早起来先揭开盖子跑进来 rerun jobs 了一次，我还是以为是 GH 抽风，是不是把我跟 resism 挂钩搞小黑屋了？但是 Github Actions 报告说还是失败。我就建立了一个新 repo，为了保持老家伙形象，这次就搞了个 private repo 悄悄弄。可惜的是遇到同样的问题。

怎么肥事？

我百思不得其解，想我发版那么多年了，今天怎么着，竟然遇到了新问题。于是我耐下性子开始翻 Github Docs，Events，以及，repo Settings。

最终我在  [Automatic token authentication - GitHub Docs](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#modifying-the-permissions-for-the-github_token) 获得了原因。

为了防止得到了 GITHUB_TOKEN 授权的 Github Actions 脚本修改 repository 本身、或者从 Actions 中发起新 PR 、或者许可并解决一个 PR，或者别的潜在的安全风险，现在的新 repository 的 Actions 只有只读权限，你只能下拉 repository 源代码到 runner 中搞搞编译什么的，不可以拿着 GITHUB_TOKEN 授权反向 commit 什么变更回去。

对此，在 Repository Settings 的 Actions/General 中有相关的控制项，当我授权了 Read/Write 之后，不能发版的问题也就解决了。授权可读写的状态如下：

![Screenshot 2023-01-27 at 06.45.54](./_assets/2023-01-27-github-actions-resource-not-accesible-by-integration/Screenshot 2023-01-27 at 06.45.54-4775748.png)

我并没有搞什么花哨的玩意，在 [hedzr/progressbar](https://github.com/hedzr/progressbar) 的 Workflow 里面我和以前一样，规规矩矩地 coverage，build-release 然后 upload assets to release，没想到就这么死了一会。

怪谁呢？

还是怪我这几个月因为封了，天天被捅喉咙，所以很少上HG而且几乎没发版的吧。

## REFs

参考

-  [Security hardening for GitHub Actions - GitHub Docs](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions) 
-  [hedzr/progressbar: A task-based terminal progress bar in golang, with a python/pip installing like ui. Integrated more styles.](https://github.com/hedzr/progressbar) 

以上

## 后记

### 别的呢，怎么活着的？

于是我又去检查了几个旧项目，保不成全都有问题的吧。

在我的旧项目里是这样子的：

![image-20230127071920515](./_assets/2023-01-27-github-actions-resource-not-accesible-by-integration/image-20230127071920515-4775761.png)

我发誓这不是我做的。



### 进一步地

然后继续读。所以原来其实也可以直接在 Actions 脚本中请求权限：

```yaml
name: "My workflow"

on: [ push ]

permissions: read-all

jobs:
  ...
```

或者

```yaml
name: "My workflow"

on: [ push ]

permissions: write-all

jobs:
  ...
```

依据是这里：[permissions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#permissions)

那么，

这算什么，脱了 KUZI 放 PI？



### 后后记

前一阵子装了 podman，千辛万苦。

后来装了 podman desktop，也不容易，而且一个启动时弹对话框的选项无论如何也关不掉。这倒也罢了，但前几天我去查看了一下 console.app 中的 Crash Report，这个家伙 crash 的很惊人，太多了，而且前台其实完全无感知。我特么的！

然后我又装了 Docker Desktop。

而且下定决心给它调配了 6 core，24GB Memory。

因为我自从付不起钱 VPS 之后，一直想要装个 Gitlab Server，这次就装了，跑起来还好，而且这家伙改名叫极狐在重庆设了公司要真的进入中国市场。

但是我又卸了。Gitlab 真的跑不起，太重太吃 CPU 了。自从把它起在后台以来，Docker 的 CPU 就没低过350%，这也 罢了，因为从综合 CPU 上来看也就是八分之三而已，似乎也不怕。然而 CPU 温度也不低于85°，经常在 95°到 100°，这还能忍吗？只能关掉算了。

想起一句话，它不是不想去 120°，只是因为卷面只有 100 分呐！



今天抽空叨叨一下，花了几乎三个钟头码字查证上传图片什么的。就发一篇杂感吧。

给大家拜个晚年！大吉大利！

:end:

