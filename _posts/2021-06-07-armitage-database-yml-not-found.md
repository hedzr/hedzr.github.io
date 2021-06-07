---
layout: single
title: 'Armitage 无法启动问题'
date: 2021-06-07 19:11:11 +0800
last_modified_at: 2021-06-07 19:41:11 +0800
Author: hedzr
tags: [armitage, metasploit-framework, msf, MSF_DATABASE_CONFIG, JRELoadErr]
categories: tools armitage
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-10.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  在 macOS 中遇到的 MSF_DATABASE_CONFIG、JRELoadErr 等等问题 ...
---

Intro: 一个（或者两个）关于 Armitage for mac 无法启动的问题。



## 问题

在[下载](http://www.fastandeasyhacking.com/download/)了 Armitage mac 版本之后，启动时出错：

![image-20210607165148144](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210607165148144.png)



## 原因

其原因在于 msf （for mac）现在已经改动了太多。例如 msf 的所有活动数据现在放在 `$HOME/.msf4` 之中了。

但 Armitage 依然只对 Kali 做适配。所以它的 mac 版本找不到 msf 的正确位置。

> BTW，而且 Armitage mac 只能认得 JRE 7 or 8，因为它用了一个老版本的 JavaAppLauncher。
>
> 所以启动时你可能会首先遇到 JRELoadErr 对话框。
>
> 解决的办法是去 java.com 下载一个 jre-8u271-x64.dmg 回来装上。大版本号必须为 8，不要使用 jre 11 之类的，认不到的。



## 解决

解决 MSF_DATABASE_CONFIG 对话框问题的方法是：

```bash
❯ sudo mkdir -p /opt/metasploit/apps/pro/ui/config/
Password:
❯ sudo mv ~/.msf/database.yml /opt/metasploit/apps/pro/ui/config/
❯ ll /opt/metasploit/apps/pro/ui/config/
total 0
lrwxr-xr-x  1 hz  staff    28B Jun  7 16:43 database.yml -> /Users/somthing/.msf4/database.yml
```

提示：

1. 首先，不必尝试 .bashrc .zshrc 中设置 `MSF_DATABASE_CONFIG` 环境变量的手段，因为那个古老的 [JavaAppLauncher](https://github.com/rsmudge/armitage/blob/c8ca6c00b5/dist/mac/Armitage.app/Contents/MacOS/JavaAppLauncher) 的缘故，这些手段一律不会生效。
2. 其次，`/opt/metasploit/apps/pro/ui/config/database.yml` 是一个著名的硬编码地址，请见：[here](https://github.com/rsmudge/armitage/blob/c8ca6c00b5584444ef3c3a8e32341f43974567bd/scripts/preferences.sl#L179)

所以叻，建一个符号链接是最省心的办法。



## 吐槽

不知道为什么原因，这两天虚拟机闹革命，以至于 kali 不能好好地跑了，有时候还会搞到前面 mac 直接崩掉，WTF。所以才会有转主机的事出来。





🔚

