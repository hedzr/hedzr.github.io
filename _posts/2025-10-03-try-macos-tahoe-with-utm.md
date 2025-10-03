---
layout: single
title: '在 MacBook 上尝试 macOS Tahoe'
date: 2025-10-03 10:00:00 +0800
last_modified_at: 2025-10-03 01:17:00 +0800
Author: hedzr
tags: [macOS, tahoe, utm, visualization]
categories: lifestyle review
comments: true
toc: true
header:
  teaser: /assets/images/unsplash-gallery-image-3.jpg
  overlay_image: /assets/images/unsplash-gallery-image-3-th.jpg
  overlay_filter: rgba(32, 32, 0, 0.3)
excerpt: >-
  在宿主机上远程接入到虚拟机中进行开发，同一份代码 ...
---

## 尝试 Tahoe

首先要说的是，升级到 Tahoe 是不建议的。

macOS 的大版本更新从来都是不值得信赖的，至少 3 个正式小版本之后才可以研究要不要更新大版本的问题。

但是要研究，就要亲自尝试。

只有一台主力机的人在这种情景下就不免有点难受。

我还记得 2015 年的时候（在那前后），我只有一台 256GB 磁盘的 MBP，而且剩余空间极其可怜，每日都在清理空间与工作之间挣扎。有一日也是大版本更新，可能是 Catalina，年代久远记不清了，总之然后升级到一半就崩了，变砖不能开机。

后来还是终于解决了，但丢失了新一部分工作内容。

那时候对于恢复模式、故障修复的概念不多，而且一个月未必备份一次 TM，造成了上述结果，起因是剩余盘空间不太充裕。

后来 18,19 年大概还遇到过一次纯硬件问题，现象是下载升级过程中随机失败，如果反复尝试数遍的话则可以成功，但然后正式使用过程中仍会随机重启。

总而言之，对于手边 MBP 类似的 macOS 设备不多的情况，升级大版本绝对是一个需要认真对待、并且需要赌上人品的时刻。

然而，实际上你还有至少两种选择可以让上述状况得到解决。

在保证如下三个前提的情况下，本文将会介绍这两种方案：

1. 确保 Time Machine 具有最新备份
2. 有一块 U 盘中烧录了当前工作机的 macOS 版本安装盘
3. 工作机中剩余 SSD 容量大于 60-80GB（我现在日常都会尽量保持 200GB 以上的余量，这对于 SSD 健康也有好处）

那么，这两种方案分别是：

1. 使用 UTM 虚拟机来尝试
2. 在额外的卷分区中尝试

下面分别概要介绍，考虑到大家大概都是老玩家了，所以我行文将会从简。如有未尽之处，请尽可留言或者在讨论区 [hedzr/hedzr.github.io · Discussions · GitHub](https://github.com/hedzr/hedzr.github.io/discussions) 讨论。



## 使用 UTM 虚拟机

UTM 虚拟机，没有玩过的朋友可以安装一份。

注意，如果你需要 Linux 虚拟机的话，我的推荐是 OrbStack。但是对于尝鲜 macOS 各种版本，则 UTM 将会有最佳体验，无论是安装过程还是实际使用。

安装一份 macOS 虚拟机的方法并不困难，请遵循如下步骤：

1. 做 TM 备份（尽管这一条没有必要，但我习惯了）
2. 保证磁盘空间 100GB 以上
3. 使用 Mist 下载 macOS 的新版本的安装包
4. 生成 macOS 系统安装包
5. 在 UTM 中使用该安装包安装一个新虚拟机
6. 然后开始体验

其中需要略加解释的内容如下：

macOS 系统的安装包大致上在 15 - 20GB 之间，然后安装包需要被执行然后生成 ipsw 安装包，UTM 接受 ipsw 安装包并且将会很顺畅地完成 macOS 系统安装。

所以上述两个安装包以及 Mist 的运作大约吃掉了 40GB，料敌从宽。

而随后的 Tahoe 虚拟机本身，我的建议是预先保留 64GB 磁盘空间来安装，其中为 Tahoe 系统本身保留大约 20GB 空间，安装后系统占用即是如此，然后虚拟机中持有 40 GB 剩余空间你可以进行一部分迁移和软件安装以方便评估。

Mist 下载的系统文件包是一个 installer app，你需要运行它从而生成 ipsw 安装包。

不要试图下载系统的安装 iso。

因为首先你仍然会需要下载若干片段，然后 Mist 将会在本地磁盘中构建出你想要的 iso，期间会消耗大量 CPU 和 SSD 资源。然后得到的 iso 在 UTM 中的安装过程并不优秀，没有 ipsw 来的顺畅。

尽管 Mist 同样也是在本地构建 ipsw，但这个过程显然在消耗上大大小于 iso。

另一个原因，则是因为最新的 macOS 系统，常常没有生成 iso 的按钮，所以你想要 iso 的话需要遵照相应规范自行构建。

但是 macOS 的旧版本则往往额外带有“Create bootable macOS installer”的按钮，在得到 iso 之后你可以烧录到 U 盘上用作启动盘备用。

再来是为什么使用 UTM 虚拟机？

首先，这是因为针对 macOS 虚拟机而言，UTM 采用 Apple Visualization 机制，所以虚拟化中间层的消耗无限接近于 0（略有夸张，实际上大概是 5-15% 之间），目前没有其它虚拟化软件能够优于这一技术栈，顶多也就是持平（如 Parallel Desktop）。

其次同样是因为 Apple 虚拟化层，所以 Tahoe 虚拟机同样可以自动开启特效，因此在虚拟机中你基本上可以获得完整的效果，几乎不弱于原生安装到本机。

最后一点，是第二套方案所不具备的优势，即无限的尝试可能性。你可能没有尝试过安装一份香港语言和身份为基准的 macOS 系统，日语的呢？大概也没有过。UTM 的 macOS 虚拟机给出了这种可能性，这对于面向全球潜在用户的开发者应该是有用的。基本上，每份这样的虚拟机的代价是 64GB 本机磁盘空间，稍微有点浪费。当然如果你手里有 7、8 台 Mac Mini 那就另说了。

值得一提的是，UTM 本身实际上并不特别出彩，一般而言，UTM 比较简陋，功能不强，面对 Linux 虚拟机的时候 io 损耗比较大，而且时常会有 bug 或者无法实现的功能。只不过这些缺点基本上只在 Linux 虚拟机中体现出来，所以对于本文的命题反而是 UTM 占得上风。

如果你的磁盘空间吃紧，理论上 50GB 剩余空间也可以尝试，但并不建议。

> UTM 最新版本 4.7.4 支持 Tahoe 的全部特效。
>
> 前提是在虚拟机中安装 UTM 的 Guest Tool 软件包，该软件包负责安装一组驱动程序到虚拟机中以提升性能、支持剪贴板交互以及共享文件夹等等在主机和虚拟机之间交互的手段。

本文只提点要点，也包含我的实际体验，至于说图文并茂和参考链接，这一次就能省则省了，想必爱折腾的朋友对于这点问题难不倒你们。

## 在额外的卷分区中安装系统

UTM 技术方案虽好，但性能确实是个短板。

尽管我强调了 UTM 的 macOS 虚拟机实际上相当具有实操性，但它的反应、丢帧等等还是很冥想的。

所以第二套技术方案，是在你的本机上原生地同时安装两份系统：你的原始系统保持不变，然后在一个新的卷分区中安装第二个系统，通过“系统设置-启动磁盘”可以选择下一次启动时从哪一个系统中引导。

基于此方案，你可以直接原生地体验新系统，测试兼容性，可选地逐步迁移旧系统的全套内容到新系统中，无痛地完成整个迁移过程。

缺点很明显，如果你旧系统没有分区来隔离日常工作文件的话，那么你需要整个 SSD 容量的一半的剩余空间方可完成旧系统的内容的迁移（由于 APFS 卷分区自动共享整个 SSD 的容量，所以实际需要的剩余空间往往小于一半；如果你采用移动的方式迁移内容，旧系统中的原有内容简单删除的话，则无需保留太多剩余空间，因为 APFS 文件系统令新旧系统分区共享磁盘总容量，所以删除旧文件释放的空间能够被新系统透明地使用）。

关键的步骤如下：

1. TM 备份，这是必需的
2. Mist 下载新系统的安装包，生成 iso 文件并烧录到 U 盘中，然后做出新的磁盘分区，重启并通过 U 盘引导，然后安装新系统到新的卷分区中。
3. 或者，直接下载 [InstallAssistant.pkg](https://swcdn.apple.com/content/downloads/26/38/093-37779-A_Y4733G5GHI/adlxnkoqzyrrzfl1r5krg7ql0cod8vpl5e/InstallAssistant.pkg)，也可以使用 Mist 下载直接得到该 pkg，
4. 然后做出新磁盘分区
5. 双击运行该 pkg，然后安装系统到新分区中，
6. 在“系统设置-启动磁盘”选择新分区作为下一次引导设备，
7. 重启本机，然后进入新系统

### Mist 下载新系统安装文件

#### 获得 `Install macOS [xxx].app`

Mist 刷新固件和安装器列表，在 Installers 面板中将会得到 Tahoe 26.0.1，然后点它的右侧下载按钮（`Download and export macOS Installer`）下载：

![Screenshot 2025-10-03 at 10.45.28](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/upgit/2025/10/20251003_1759472529.png)

弹出的文件夹对话框中，有几个勾选框：

![image-20251003105011884](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/upgit/2025/10/20251003_1759472522.png)

其中：

- Application，将会得到 `Install macOS Tahoe 26.0.1_25A362.app` 文件，双击可以就地开始安装新系统的流程（期间将会生成 `Install macOS Tahoe.app` 并放入 `/Applications` 中）。
- Disk Image，将会得到 dmg 文件，双击它将会得到 `Install macOS Tahoe.app` 文件，将其发到 `/Applications` 文件夹中，然后双击即可启动安装新系统的流程。
- ISO，将会得到 iso 文件，可以烧录到 U 盘中用于引导和安装新系统。
- Package，将会得到 `Install macOS Tahoe 26.0.1_25A362.pkg` 文件，双击运行该文件，将会得到 `Install macOS Tahoe.app` 文件。

注意，上述 4 个格式，每个大约 17GB 大小，所以注意你的剩余磁盘空间。

#### Creat bootable macOS installer

在 Mist 的系统列表中，Tahoe 的右侧有两个按钮，前者在上面介绍了，而另一个按钮 `Create bootable macOS installer` 将会下载系统文件并直接烧录到 U 盘中，所以你需要准备一个 U 盘，然后选中它即可。

#### 取得 ipsw 文件

ipsw 格式是一种固件格式，现在仅使用于 Apple Silicon 芯片。

在 Mist 中可以选中 Firmwares 面板，然后找到 Tahoe 点击其后的下载按钮，等待完成之后即可得到 `Install macOS Tahoe 26.0.1_25A362.ipsw` 文件。

UTM 使用该文件安装虚拟机最为流畅。

但此过程略微慢于使用恢复固件安装新系统。

#### 使用 Mist cli 工具

`brew install mist-cli` 可以得到 mist-cli 命令行工具。

#### 使用恢复固件

你可以在某些网站下载得到 `UniversalMac_26.0_25A354_Restore.ipsw` 恢复固件，同样地，UTM 也可以直接使用此固件安装新系统。

该恢复固件也可以用于 DFU 恢复模式进行系统升降级，这是强制性地，不受网络端口限制（Apple 常常会关闭旧系统的降级端口，所以你的 macOS，iPhoneOS 可能会升级后无法通过在线恢复功能降级，此时这个恢复固件就相当有用了）。



### 准备本地安装程序

在上面的链接地址下载得到 `InstallAssistant.pkg` 文件后，双击执行它，即可得到本地安装程序 `Install macOS [xxx].app`，你可以在 `/Applications` 文件夹中找到它。

比较简单的方法是通过 Mist 下载 DMG 格式文件，然后双击挂载 DMG，将其中的 `Install macOS [xxx].app` 拖拽到 `/Applications` 中。

### 准备第二分区

制作新磁盘分区的方法是使用“Disk Utilities”工具，选择 `Machintosh HD` 宗卷，然后创建一个新的 Volume（点击 + 号），

![image-20250918021337371](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/upgit/2025/10/20251003_1759472499.png)

输入名字，例如 `Tahoe26`，然后点击 Add 按钮添加新的 Volume 到 `Machintosh HD` 宗卷容器中：

![image-20250918021410995](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/upgit/2025/10/20251003_1759472491.png)

然后得到这个新卷

![image-20251003101424545](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/upgit/2025/10/20251003_1759472440.png)

备注：

截图中我们原本已有一个分区 VolHack，所以实际上准备的是第三分区。

日常工作中，建立另一个分区来放置工作文件也是有意义的，例如我们出于各种目的，在 VolHack 分区创建时为其指定了文件名大小写敏感，这样我们就能拖回一些 Linux Kernel 源代码共查阅了。

### 安装到新的 Tahoe26 卷中

现在双击 `Install macOS.app` 安装程序，并将 macOS Tahoe 安装到刚刚新建的 Tahoe26 卷中。

安装完成之后整个 SSD 中就同时存在了两个可引导系统，一是你的当前工作系统，一是刚刚安装的 Tahoe 系统。

这样就能保持当前工作系统不受影响。

今后可以通过切换引导磁盘的方式选择引导两个可引导系统中的哪一个。





## 参考材料

- [為 macOS（或 Linux）添上套件管理工具 — Homebrew](https://brew.sh/zh-tw/)
- [如何修复或恢复 Mac 固件 - 官方 Apple 支持 (中国)](https://support.apple.com/zh-cn/108900) - 关于 DFU 恢复
- [如何从“macOS 恢复”启动 - 官方 Apple 支持 (中国)](https://support.apple.com/zh-cn/102518)
- [ninxsoft/Mist: A Mac utility that automatically downloads macOS Firmwares / Installers.](https://github.com/ninxsoft/Mist)
- [从时间机器备份中恢复所有文件 - 官方 Apple 支持 (中国)](https://support.apple.com/zh-cn/guide/mac-help/mh15638/26/mac/26)
- [重新安装 macOS - 官方 Apple 支持 (中国)](https://support.apple.com/zh-cn/guide/mac-help/mchlp1599/26/mac/26)
- [抹掉并重新安装 macOS - 官方 Apple 支持 (中国)](https://support.apple.com/zh-cn/guide/mac-help/mh27903/mac)
- [The Unofficial Fusion 13 for Apple Silicon Companion Guide (pdf)](https://seaphages.org/media/forums/attachments/56c9bf43-93bc-46c6-bc09-a94088bee0fa.pdf)
- [Sharing | UTM Documentation](https://docs.getutm.app/settings-qemu/sharing/)
- [Linux | UTM Documentation](https://docs.getutm.app/guest-support/linux/)



## 后记

### 为何采用上面的方案？

仅仅只是为了尝鲜，和评估升级风险，上面的方法对于硬件设备有限的用户是基本上无损的，唯一的损失大约是磁盘剩余空间。另外则是时间，但严格来说，实际上是节省了时间和减少了意外发生的可能性。

### 应该升级到 Tahoe 吗？

当然不。

本文开篇提示过，无论你是谁，26.0.3 以后再来考虑升级到 Tahoe 的问题才是合适的时机。

而对于我这样的用户来说，已经放弃了升级了。

Tahoe 给出的 UI 新外观，和更强的多设备整合，对我来说一钱不值。

我更看重的是，更低的系统开销，更好的面向开发者的细节处理。然而这些小众要求不是 Apple 的考虑方向。

从中美关系上来说，我手中的 MBP 也很可能成为遗产了。

### Tahoe 一无是处吗？

这倒不至于。

我实际使用的一大感慨是，这一次 Apple 是真的没做什么额外的核心功能。因为基本上我所有的旧系统上的 apps 全都无痛地在 Tahoe 中直接可用。当然，不少 apps 也提供了更新版本来适配 Tahoe 的 UI 风格就是了。

甚至包括我的 iStatsMenu 也没有任何更新，直接 copy 一下就开工了。

所以担心升级后旧 apps 的兼容性，尤其是双击无法运行这种以前的痛点，这次是没有了，至少我没有遇上。

不过正因为如此，我已经失去了升级的欲望。

能得到更好的什么呢？

更好的 Apple Music，可能吗？

显然，捆绑式推进策略对我是没有吸引力的。



🔚