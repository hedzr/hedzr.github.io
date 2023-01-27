---
layout: single
title: 'Vertura 改变登录屏背景'
date: 2023-1-28 04:55:00 +0800
last_modified_at: 2023-1-28 07:13:00 +0800
Author: hedzr
tags: [macOS, login screen]
categories: lifestyle review
comments: true
toc: true
header:
  overlay_image: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/Screenshot 2023-01-28 at 07.08.17.png
  overlay_filter: rgba(255, 255, 255, 0.5)
excerpt: >-
  改登录屏墙纸原本是不可能的，...

---



## 据说的办法

比较正式的说法，根据 macOS 的设计架构，自从 macOS 采用了密封只读系统卷的方式来保持系统完整性之后，修改登录屏壁纸的可能性就等于 0 了。

网上流传的办法，是关闭 SIP（System Integrity Protection）之后，去修改系统卷中的壁纸文件。一般来说应该是：

- `/System/Library/Desktop Pictures/Ventura Graphic.heic`

对于 Monterey，Big Sur，Catalina 这又有少许不同。而且另一个问题是 heic 这个文件格式。HEIC 大致是在 iOS 11 之后被推出的新图片格式，比较于 JPEG 来说尺寸更小，画质更“无损”，元数据更丰富。现在操作 HEIC 的工具也多了，说它是个问题倒也不确切，但是这些 macOS 封闭的东西确实难以令人产生好感。



以上的办法符合逻辑，符合 macOS 设计架构的逻辑。早在 Catalina 时代我也成功过。



## 但是

但是这些办法的成功率是非常低的。

目前 Vertura 上有不少人试错得到了经验，你需要确保：

1. File Vault 必需被关闭
2. 你必需是 Mac 设备的唯一用户
3. 哪怕 Guest 账户被 Disabled 也不可以
4. 你要保证系统设定 **System Settings** -> **Lock Screen** -> “**List of users**” 处于选中状态，而不能是 “**Name and password**” 状态
5. 不可打开自动登录设定

还可能有一些神仙般的要求。

FROM：https://www.fireebok.com/resource/how-to-change-login-screen-wallpaper-in-macos-ventura.html



## 我可证实的

看到要关闭 File Vault，要关闭 SIP 等等我就已经被劝退了。

所幸的是另外仍有一个便宜的办法可以让登录屏壁纸改变，这个技巧来自 Apple Discussion 讨论组，方法如下：

1. Set you preferred background  in Systems Settings -> Wallpapers 
2. then go to Systems Settings -> Lock Screen -> Show message when locked -> enable the option -> set a message (you can disable it after) -> it will update the default login screen wallpaper to include the message -> that's the trick
3. Quit Systems Settings
4. Logout -> the new wallpaper is used for the login

它的意思是你设置好 macOS 的正常桌面背景图片先，然后去 Lock Screen 系统设置中设置一条登录屏信息文字，随便写个啥，比如写两个空格或许也可以。然后就行了。别的啥都不必做。现在去锁屏看一下，你的桌面壁纸就被应用在登录屏上了。

![Screenshot 2023-01-28 at 07.08.17](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/Screenshot 2023-01-28 at 07.08.17.png)

它的限制是当 macOS 开机时，或者你的账户不是当前已登录态时，你的壁纸不会显示，尝尝会还是 Vertura Graphic。

不过这都是无所谓了，已经算是很不错了。

FROM：

https://discussions.apple.com/thread/254318261



## 🔚



