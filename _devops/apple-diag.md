---
# permalink: /apple-diag/
title: "Apple MBP & macOS Diagnosis"
excerpt: "Foo Bar design system including logo mark, website design, and branding applications."
last_modified_at: 2023-02-22
toc: true
sidebar:
  nav: sidebar-meta
header:
  image: /assets/images/foo-bar-identity.jpg
  teaser: /assets/images/foo-bar-identity-th.jpg
sidebar:
  - title: "Role"
    image: http://placehold.it/350x250
    image_alt: "logo"
    text: "Designer, Front-End Developer"
  - title: "Responsibilities"
    text: "Reuters try PR stupid commenters should isn't a business model"
gallery:
  - url: /assets/images/unsplash-gallery-image-1.jpg
    image_path: assets/images/unsplash-gallery-image-1-th.jpg
    alt: "placeholder image 1"
  - url: /assets/images/unsplash-gallery-image-2.jpg
    image_path: assets/images/unsplash-gallery-image-2-th.jpg
    alt: "placeholder image 2"
  - url: /assets/images/unsplash-gallery-image-3.jpg
    image_path: assets/images/unsplash-gallery-image-3-th.jpg
    alt: "placeholder image 3"
---

> Original Post at: [macOS/MBP/MacBook Pro 维护页面集合](/lifestyle/review/mbp-maintain-collections).

这些页面集中一下，罗列出来，有时候查询比较方便。

## MBP 维修，以及基本自检

MBP 出现问题，首先是自我检查，做一个粗略的评估和判断。

一般说往往都是能够通过这些操作自行恢复：

- 重置 SMC/NVRAM/PRAM、
  - [Apple 支持文章：如何在 Mac 上使用安全模式](https://support.apple.com/zh-cn/HT201262)
  - [Apple 支持文章：如何重置 Mac 的 SMC](https://support.apple.com/zh-cn/HT201295)
    - [What Is SMC & How to Reset the SMC on Intel/M1 Mac](https://iboysoft.com/wiki/system-management-controller.html)
  - [Apple 支持文章：重置 Mac 上的 NVRAM 或 PRAM](https://support.apple.com/HT204063)
    - [NVRAM/PRAM: How to Reset & When Should You Use It on Mac](https://iboysoft.com/wiki/nvram.html)
- 重装系统、
- 通过 TM 恢复、
- 通过 TM 重装，
- 重装系统后从 TM 迁移

如果这些都不能，特别是当通过网络重装系统发生问题时，那么要检查一下：

- 自行检查硬件有否问题：[在 Mac 上使用 Apple 诊断 - Apple 支持](https://support.apple.com/zh-cn/guide/mac-help/mh35727/11.0/mac/11.0)
  - [Apple Diagnostics: The Hidden Trick to Check Your Mac](https://iboysoft.com/wiki/apple-diagnostics.html)

- 联络天才吧预约报修
- 请天才吧帮助重装系统

有的硬件问题比较直观，可以从外观目测：

- 电池鼓包，导致 MBP 放不平了
- 屏幕花了，保护膜脱落
- 按键不灵或者失效

此时应该联络天才吧预约报修。



[了解如何维护或修理 Mac](https://support.apple.com/zh-cn/guide/system-information/syspr35948)

[Apple Trade In 换购计划网站](https://www.apple.com/cn/shop/trade-in)





### MBP 重新安装 macOS

 [如何重新安装 macOS - Apple 支持 (中国)](https://support.apple.com/zh-cn/HT204904) 

![img](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/macos-big-sur-recovery-reinstall-macos.jpg)

 [确定 Mac 的启动磁盘 - Apple 支持](https://support.apple.com/zh-cn/guide/mac-help/mh19543/11.0/mac/11.0) 

 [启动 Mac 的方法 - Apple 支持](https://support.apple.com/zh-cn/guide/mac-help/mh26785/11.0/mac/11.0)





### MBP 安全模式

 [以安全模式启动 Mac - Apple 支持](https://support.apple.com/zh-cn/guide/mac-help/mh21245/mac) 

 [如何在 Mac 上使用安全模式 - Apple 支持 (中国)](https://support.apple.com/zh-cn/HT201262) 



### MBP 恢复模式

 [8 Mac System Features You Can Access in Recovery Mode](https://www.howtogeek.com/189575/8-mac-system-features-you-can-access-in-recovery-mode/) 

 [How to Repair Disk and File System Problems on Your Mac](https://www.howtogeek.com/236978/how-to-repair-disk-and-file-system-problems-on-your-mac/) 

{% include gallery caption="This is a sample gallery to go along with this case study." %}

## Mac 的启动组合键

 [Mac 的启动组合键 - Apple 支持 (中国)](https://support.apple.com/zh-cn/HT201255) 

### 在搭载 Apple 芯片的 Mac 上

将[搭载 Apple 芯片的 Mac](https://support.apple.com/zh-cn/HT211814) 开机并继续按住电源按钮，直至看到启动选项窗口。在那里，您可以从另一个磁盘启动，以安全模式启动，使用 macOS 恢复功能和进行更多操作。[进一步了解包括 macOS 恢复功能在内的这些选项](https://support.apple.com/zh-cn/guide/mac-help/macos-recovery-a-mac-apple-silicon-mchl82829c17/mac)。

### 在基于 Intel 的 Mac 上

要使用这些组合键中的任何一个，请在按下电源按钮以开启 Mac 后或在 Mac 开始重新启动后，立即按住相应按键。请一直按住，直至电脑出现对应的行为。

- **Command (⌘)-R：**从内建的 [macOS 恢复](https://support.apple.com/zh-cn/HT201314)系统启动。或者，您也可以使用 Option-Command-R 或 Shift-Option-Command-R 以通过互联网从 macOS 恢复功能启动。[macOS 恢复功能可以安装不同版本的 macOS](https://support.apple.com/zh-cn/HT204904)，具体取决于您使用的组合键。如果您的 Mac 使用了[固件密码](https://support.apple.com/zh-cn/HT204455)，系统将提示您输入这个密码。
- **Option (⌥) 或 Alt：**启动进入“[启动管理器](https://support.apple.com/zh-cn/guide/mac-help/change-your-mac-startup-disk-mchlp1034/mac)”，您可以从中选取其他可用的启动磁盘或宗卷。如果您的 Mac 使用了[固件密码](https://support.apple.com/zh-cn/HT204455)，系统将提示您输入这个密码。
- **Option-Command-P-R：**[重置 NVRAM](https://support.apple.com/zh-cn/HT204063) 或 PRAM。如果您的 Mac 使用了[固件密码](https://support.apple.com/zh-cn/HT204455)，电脑会忽略这个组合键或从 [macOS 恢复功能](https://support.apple.com/zh-cn/HT201314)启动。
- **Shift (⇧)：**以[安全模式](https://support.apple.com/zh-cn/HT201262)启动。如果使用了[固件密码](https://support.apple.com/zh-cn/HT204455)，这个组合键将被停用。
- **D：**启动进入“[Apple 诊断](https://support.apple.com/zh-cn/HT202731)”实用工具。或者，您也可以使用 Option-D 通过互联网启动进入这个实用工具。如果使用了[固件密码](https://support.apple.com/zh-cn/HT204455)，这个组合键将被停用。
- **N：**从 NetBoot 服务器启动，[前提是您的 Mac 支持网络启动宗卷](https://support.apple.com/zh-cn/HT202770)。要使用服务器上默认的引导映像，请按住 Option-N。如果使用了[固件密码](https://support.apple.com/zh-cn/HT204455)，这个组合键将被停用。
- **Command-S：**以单用户模式启动。如果运行的是 macOS Mojave 或更高版本，或者使用了[固件密码](https://support.apple.com/zh-cn/HT204455)，这个组合键将被停用。
- **T：**以[目标磁盘模式](https://support.apple.com/zh-cn/guide/mac-help/transfer-files-mac-computers-target-disk-mode-mchlp1443/mac)启动。如果使用了[固件密码](https://support.apple.com/zh-cn/HT204455)，这个组合键将被停用。
- **Command-V：**以详细模式启动。如果使用了[固件密码](https://support.apple.com/zh-cn/HT204455)，这个组合键将被停用。
- **推出键** (⏏)、**F12**、**鼠标按钮**或**触控板按钮：**推出可移动介质，例如光盘。如果使用了[固件密码](https://support.apple.com/zh-cn/HT204455)，这个组合键将被停用。

如果某个组合键在启动时不起作用，以下解决方案之一可能会有所帮助：

- 同时按住组合键中的所有按键，而不是一次只按住一个。 
- 将 Mac 关机。然后按下电源按钮以将 Mac 开机。接下来，在 Mac 启动时按住相应按键。在按下相应按键之前，您可能需要等待几秒钟，以便让 Mac 在启动时有更多时间来识别键盘。某些键盘上有一个指示灯会在启动时短暂闪烁，表明键盘已被识别并可供使用。
- 如果您使用的是无线键盘，请在可能的情况下将这个键盘接入 Mac。或者使用您的内建键盘或有线键盘。如果您使用的是 PC 专用键盘，例如带有 Windows 标志的键盘，请尝试改用 Mac 专用键盘。
- 如果您使用“启动转换”从 Microsoft Windows 进行启动，请对[“启动磁盘”偏好设置](https://support.apple.com/zh-cn/guide/mac-help/change-your-mac-startup-disk-mchlp1034/mac)进行相应设置，修改为从 macOS 启动。随后关机或重新启动，然后再试一次。





## Terminal Commands

有的时候也许用得着的系统命令，想到或者遇到用一个就记录一个。

### Flush disk cache

```bash
sudo purge
```

尽管 SSD 谈不上什么延迟，但是确实还是有的。这表现在写盘操作总是会被缓存而不是立即向 SSD 中写入。这样做的首要目的实际上是为了增强 SSD 的使用寿命，有关此节的原因是因为 SSD 的电气性能以及文件系统设计的原因，这里就不展开了，也懒得去查权威材料的链接了，你知道就行。

所以有时候或许你想立即将待写盘内存刷出到 SSD 里去。



## Matters

### Volume Hash Mismatch

这个问题基本上算是无解，我更倾向于它是 macOS 的 BUG。

 [How to Fix “Volume Hash Mismatch” Error on Mac - Stellar](https://www.stellarinfo.com/blog/fix-volume-hash-mismatch-error-on-mac/) 

 [How to Fix 'Volume Hash Mismatch' on macOS Monterey 2022](https://iboysoft.com/news/volume-hash-mismatch.html) 

如果你有闲情折腾，那么可以试试上面的办法。

但我要说的是那样做没什么用，仍然会得不到真的解决。









## :end:

不完整，若是遇到特殊状况再来补充完整。

虽然你可以直接去 Apple Support 网站上搜索相关文章，但有时候可能往往你并不知道从何下手，这就是本文专门组织它们到一起的目的。

