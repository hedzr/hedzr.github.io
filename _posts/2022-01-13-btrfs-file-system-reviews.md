---
layout: single
title: Linux：回顾一下 BtrFS 这些年
date: 2022-01-13 05:11:00 +0800
last_modified_at: 2022-01-13 11:11:00 +0800
Author: hedzr
tags: [linux, btrfs, file system]
categories: devops linux
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20211226010348217.png
  overlay_image: /assets/images/ubuntuhero.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
excerpt: >-
  记录 BtrFS 的我所了解的 [...]
---


> **摘要**：  
> 记录 BtrFS 的我所了解的
> <!--MORE-->



## 引子

近日来因 Linux 内核 5.17 释出，又唤起了我对 BtrFS 的关注。

因而去扫描了一下相应的状态并且做了一点点记录。既然记录了，就干脆放这里，算是自己有个交待。

## BtrFS

BtrFS 被称作是 Linux 的未来，或者说是 Linux 未来的文件系统。他已经用了15 年的时间，不过迄今为止仍未能成为 Linux 的主流，目前大多数 Linux 装机实例中 Ext4 仍然是主流，而在无日志需求里则是 Ext2/3 或 FAT32，BtrFS 仍然没有获得主卷默认格式的待遇。就目前而言，Linux 5.17 刚刚发行，仍在对 BtrFS 进行关键性改善。

> 按照公开的说法，2007 年时 Oracle 公开了 BtrFS 的开发计划，不过那时候 BtrFS 已经初步成型了。
>
> 它的思想很大一部分来自于 ZFS 的供养。注意 ZFS 同样是 Oracle 开发的。而另一个事实是，Oracle 是最大的企业级数据库提供商，所以不难理解为何它对文件系统的能力有如此之多的想法，而且还予以了实施。

是什么原因令到文件系统的替代如此的难？大概是因为惯性的力量吧。做出改变往往是最为困难的事。

文件系统是如此的复杂，BtrFS 的愿景是如此的高级，以至于事实上当下仍未有确切的完整的 TestSuite 能够证明 BtrFS 的稳定性已经 stable 到令无知小白也能放心的地步。不能自证用于生产是如此的稳定，这大概就是 BtrFS 当下的困境吧。

按照 [Status - btrfs Wiki](https://btrfs.wiki.kernel.org/index.php/Status) 的说明，实际上即使是用于生产，BtrFS 其实也已经完全能够胜任了，它的不够效率大致上表现在这些方面：

- defrag
- RAID56 使用场景
- 少数的 RAID1 相关场景，极少数 RAID10 场景
- 动态调整：FS Resize, ..
- 有时候的 zone mode
- 极个别的 Samba 场景中
- 极个别的 cgroup io 操作中

我回顾了已知的多数生产场景，这些特别的存在疑问的案例是较少被真正用在生产环境中的。

多数生产场景聚焦在 flat 方式的文件系统应用中：一个平面的、固定的、带有 LVM 卷管理 FS 会从一而终，不太可能发生为其制作 RAID，或者进行磁盘分区调整等等行为。换句话说，除非你整天在折腾 FS 的各种行为，否则的话 BtrFS 早已满足生产需要了。这些针对 FS 的动态调整或者 RAID 重建等任务一般会在 NAS，NFS 等大规模存储集群场景中被使用，也即大规模存储，大规模企业数据库等等场景，而这类需求通常并不是多数公司、多数场景下主要任务。

而对于个人应用或桌面应用来说，一般也不会设计到这类专用场景，也许一部分原因如此，所以 Fedora 才会激进地采用 BtrFS 为默认的 FS 吧。

简单一句话，现在用 BtrFS 代替 Ext4 是毫无问题的。

BtrFS 提供了一揽子的高级特性，简要来看它们包括：

- 小文件高效能使用，高效率存储
- 目录高效能使用
- 面对海量存储时的高效率
- 自动化的快照能力和版本化
- 对 SSD 寿命友好
- 易于管理

这些能力促使一切关心的观众都在渴求着 BtrFS 的真正落地，现实世界的演变是如此之快，不久之前（10 年前）我们还处于一部电影 300MB 的时代，单现在一部高码率 1080p 电影可达 40 ~ 80GB，更不用说 4K 或者 8K 视频了。

相比较而言，XFS 是 64 位高性能日志式文件系统，16 EiB 单卷，8 EiB 单文件；Ext 4 同样是日志式文件系统，可支持 1 EiB 单卷，16 TiB 单文件；而 BtrFS 支持 16EiB 单卷，16 EiB 单文件，这个存储能力显然是更优胜的。



经过了重新梳理，我组织了一个较为详尽的特性表，即 BtrFS 的优势所在。该表如下：

- B-tree 技术核心
- CoW：Copy on Write 是其关键性基础依据
  - 自动的版本快照能力
  - 适应于 SSD 的优化
  - 支持在 COW 之上的事务能力
- 透明的自动压缩
  - 适应于 SSD 的优化
- 支持配额管理
- 支持内建 RAID 能力（主要为类 RAID-0 或类 RAID-1）
- 支持子卷
  - 以子卷为单位，在多设备上进行负载均衡
  - 在多设备上做出 FS 级别的 RAID 能力
  - 子卷能够自动从底层块设备中分配和获取空间，这使得子卷不可能出现空间不够的情况，除非底层的存储池耗尽——这是针对传统的分区表以及 LVM 来说的：传统的分区如果划分不恰当，例如 /var 尺寸太小，那么要为其增加空间基本上是不可能的；LVM 使得这种不可能变为可能，但却不能在线操作，你必须卸下该分区，然后为其增加 lvm 成分，而且除了不能在线联机变更之外，还需要人力介入，且危险性极高。
  - 动态挂载能力可以延伸出各种特殊的应用
    - 对不同用户挂载不同的子卷集合，达到另一维度的权限管理
- 支持快照（以及快照的快照）
- 支持 clone
- 特别针对 SSD 的优化（但不限于）
  - 延迟分配
  - 小文件存储优化
  - 目录的自动索引
- 容错（允许内建的校验和支持，可能依赖于 CPU 指令集）
- 修复：自动检修
- 数据平衡（在块设备之间自动移动对象，以达到负载平衡目的）
- 易于管理（可在联机状态下做碎片整理，卷生长雨收缩，块设备增减）



不过，系统化地总结尚未有精力来做。因此本文只是先期成文，做一记录。



## 参考

- [Btrfs Wiki](https://btrfs.wiki.kernel.org/index.php/Main_Page)

- [Btrfs (简体中文) - ArchWiki](https://wiki.archlinux.org/title/Btrfs_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

- [Btrfs Status - btrfs Wiki](https://btrfs.wiki.kernel.org/index.php/Status)

- [Btrfs - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/Btrfs)

  - [文件系统的对比](https://zh.wikipedia.org/wiki/文件系统的对比)

- [ZFS - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/ZFS) 

  



## 后记

本文仅作先期记录，立此存照。



🔚