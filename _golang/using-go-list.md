---
layout: single
title: '使用 go list 命令'
date: 2023-02-25 00:07:11 +0800
last_modified_at: 2023-02-25 00:29:11 +0800
Author: hedzr
tags: [golang]
categories: golang
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/215px-Go_Logo_Blue.svg.png
  overlay_image: /assets/images/unsplash-image-1.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  go list 有时候显得神秘 ...
---



You can use `go list` command to see which versions of the module are available at the moment:

```sh
go list -m -versions github.com/hashicorp/vault/api
github.com/hashicorp/vault/api v1.0.1 v1.0.2 v1.0.3 v1.0.4 v1.1.0
```

Or use -u flag to see which (most recent) version you can upgrade to (if any):

```sh
go list -m -u github.com/hashicorp/vault/api
github.com/hashicorp/vault/api v1.0.3 [v1.1.0]
```

Where `v1.0.3` is your current version, and `[v1.1.0]` is a most recent possible version.

[go list docs](https://golang.org/cmd/go/#hdr-List_packages_or_modules)



- FROM [Here](https://stackoverflow.com/a/67772298/6375060)



🔚