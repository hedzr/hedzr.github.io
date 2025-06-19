---
layout: single
title: '让 VMware Fusion 共享文件夹在 Apple Silicon 上工作'
date: 2025-05-29 20:00:00 +0800
last_modified_at: 2025-05-30 01:17:00 +0800
Author: hedzr
tags: [opensuse, shared-folder, vm]
categories: devops opensuse
comments: true
toc: true
header:
  teaser: /assets/images/unsplash-gallery-image-3.jpg
  overlay_image: /assets/images/unsplash-gallery-image-3-th.jpg
  overlay_filter: rgba(32, 32, 0, 0.3)
excerpt: >-
  在宿主机上远程接入到虚拟机中进行开发，同一份代码 ...
---

## 使能 Shared Folder

在 VMware Fusion 中新建一个虚拟机，安装 openSUSE 16.0 beta（你可以使用其它 Linux 发行版），设置好 Shared Folder，然而无论你安装的是 Linux Server 还是 Desktop，在 Apple Silicon 上基本上都无法直接工作。

此前很多时候，我只通过 ssh rsync 等方法来同步代码到虚拟机。

但是最近突然想到，UTM 的一些经验可以搬移到 VMware Fusion 中来。首先是 UTM 使用 9p 驱动程序来完成共享文件夹的装载（mount），但在 VMware Fusion 中，我发现没有必要这么“麻烦”，直接使用 fuse 就可以。其次是 UTM 中介绍了 bingfs 的实用方案，这简直是神器，owner 和 permissons 现在就不再是难题了。

所以下面介绍我现在的共享文件夹的做法。

### For VMware Fusion on Apple Silicon Only

#### bindfs

总体上需要用到 bindfs 软件包：

```bash
sudo zypper in bindfs
```

如果你不是在使用 openSUSE，那么使用恰当的包管理器，例如在 Ubuntu 中这样安装：

```bash
sudo apt-get install bindfs
```

#### Mount the shared folder

首先在 `/etc/fstab` 中装载 Shared Folder：

```bash
SUDO=sudo

grep -q '/mnt/hgfs' /etc/fstab ||
	echo "vmhgfs-fuse   /mnt/hgfs fuse defaults,allow_other,_netdev   0 0" | $SUDO tee -a /etc/fstab

[ -d /mnt/hgfs ] || $SUDO mkdir /mnt/hgfs

$SUDO mount -a
```

现在在 /mnt/hgfs 中就能看到你设置的共享文件夹了。

假设你已经指定了 macOS 上的 `~/Downloads` 文件夹为 Shared Folder，那么下面的命令应该能显示它了：

```bash
ls -la /mnt/hgfs/Downloads
```

这一策略很关键，而且相当轻便（直接使用 fuse），根本不必编译 vmtools，直接就可以生效。

这是由于 openSUSE 16.0 的内置驱动支持力度加强了。

对于较旧的版本，可能你需要安装 vmtools 包（不必编译）：

```bash
sudo zypper in open-vm-tools open-vm-tools-desktop
```

对于其它发行版或者较旧的 openSUSE，你可能需要手工编译。

但是，VMware Fusion for Apple Silicon 可能不支持你挂载 vmtools iso 来获取其驱动源码，你需要另行寻找解决方案。

#### Mapping file owner and permissions

接下来利用 bindfs 来完成用户身份和文件权限的映射，从而让你的 macOS 上的文件的所属身份转换为虚拟机中的当前用户，这样就可以在虚拟机中直接编辑而无需 sudo 了。下面的实例中，假设你已经指定了 macOS 上的 `~/Downloads` 文件夹为 Shared Folder，并且其中有一个 `ops.work` 子目录，以及 macOS 和 VM 中的当前用户均为 `hz`：

```bash
SUDO=sudo

echo "/mnt/hgfs/Downloads/ops.work   /home/hz/ops.share fuse.bindfs map=501/1000:@20/@1000,x-systemd.requires=/mnt/hgfs 0 0" | $SUDO tee -a /etc/fstab
[ -d /home/hz/ops.share ] || { $SUDO mkdir /home/hz/ops.share && $SUDO chown -R hz: /home/hz/ops.share; }

$SUDO mount -a
```

现在，映射成功，操作正常。

### 结论

很显然的一点是，你可以在 VMware Fusion 的 VM settings 中指定多个 Shared Folders，它们将被统一挂载到虚拟机中的 `/mnt/hgfs` 之下。

所以你可以分别通过第二步（`Mount the shared folder`）中的 bindfs 映射方式将这些共享文件夹都映射到 `$HOME` 中，并且动态转换其 owner 为当前用户。

另一点是，挂载子目录也毫无问题。

如此，你可以非常容易地将 macOS 中的文件夹映射到虚拟机中，并且可以直接修改、没有延迟、无需 rsync/scp 同步，这对于做 ops 开发，做交叉编译等工作场景来说非常有优势：一旦虚拟机环境准备就绪，你就可以在 macOS 中通过 VSCode Remote Explorer 直接打开虚拟机中的工作文件夹，建立 workspace，直接开始开发。

### 结束语

佚失。

其实我使用了很长一段时间的 UTM，总的感觉还可以。

但是 UTM 确实很多 Bugs，很多怪现象的限制。

自从 VMware Fusion 免费而且支持 Apple Silicon 之后，我发现我还是比较习惯这一边，比较稳定，而且没有多少消耗，CPU 或者 Memory 的压力都基本可以忽略，而且支持虚拟机快照。

所以我可以建立若干节点，等到虚拟机的磁盘空间膨胀了，就抛弃这些变化，返回快照节点，于是磁盘空间也就返还了，这一点对于 UTM 来说就比较无解，没有办法。



### 参考材料

- [The Unofficial Fusion 13 for Apple Silicon Companion Guide (pdf)](https://seaphages.org/media/forums/attachments/56c9bf43-93bc-46c6-bc09-a94088bee0fa.pdf)
- [Sharing | UTM Documentation](https://docs.getutm.app/settings-qemu/sharing/)
- [Linux | UTM Documentation](https://docs.getutm.app/guest-support/linux/)



🔚