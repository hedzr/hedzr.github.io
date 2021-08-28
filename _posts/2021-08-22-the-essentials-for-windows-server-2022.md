---
layout: single
title: "Windows Server 2022 安装提要"
date: 2021-08-22 14:39:00 +0800
last_modified_at: 2021-08-22 14:39:00 +0800
Author: hedzr
tags: [windows server, windows server 2022, server core, desktop experience, install, setup, remote desktop, computer name, hostname, file sharing, net use, devops]
categories: devops windows
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/1*Po9vJ6BTPdhvdhO6YuZQHg.png
  overlay_image: /assets/images/windows-server-2019.png
  overlay_filter: rgba(48, 48, 64, 0.86)
excerpt: "Windows Server 2019 (Core, Desktop Expirience, ...) 安装提要，以及 Visual Studio 2019 Build Tool 安装提要..."

---



## The Essentials: After Windows Server 2022 Evaluation Installed

实际上没什么必要。

不过既然评估版本已经发放了，就试试。



### 试用评估版本

Windows Server 2022 允许试用 180 天，试用到期后还可以重置 5 次以延长评估期(Should Be)，所以这是比较难得的基础工具了。

Windows Server 2022 试用 官网： [这里](https://www.microsoft.com/en-us/evalcenter/evaluate-windows-server-2022)

数天前，2022 已经被放出了，当然目前是正式版的一个受限制版本，意思是 OEM 厂商等等请努力试用，但 Retail 厂商以及消费端则不必那么快跟进。毕竟这是服务器版本，没有必要频繁地变动。



#### 延长试用期

延长试用期的命令为：

```bash
slmgr.vbs -rearm
```



#### **Windows Server 2022 Evaluation Keys:**

目前，评估 iso 是可以直接安装的。

今后还将会有新的发行版本。



#### GVLK 密钥

You could use the following KMS keys for installing Windows server 2022 v10.0.20344.1
Windows Server 2022 Datacenter: WX4NM-KYWYW-QJJR4-XV3QB-6VM33
Windows Server 2022 Standard: VDYBN-27WPP-V4HQT-9VMD4-VMK7H

> [Windows Server 2022 Product Key - Microsoft Tech Community](https://techcommunity.microsoft.com/t5/windows-server-insiders/windows-server-2022-product-key/m-p/2379600) 







### 版本比较：Core 与 Desktop Experience

Windows Server 2019 有多种版本：

首先是大版本的划分：

- Data Center，
- Standard，

然后是小版本被分为 Server Core 和 With Desktop Exxpirience 两种，其区别在于有没有 GUI 环境。



#### Server Core

对于 Server Core 来说，只有一个命令行盒子的界面：

![image-20210817103618347](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210817103618347.png)

但是，所谓的 no GUI 只是在说没有 GUI 管理工具（例如开始菜单，各种控制面板元素等等），实际上它还是允许你从命令行界面启动 Desktop app 的。例如 Visual Studio 2019 Build Tool 就会被启动和运行在一个独立的窗口界面中：

![image-20210817104553901](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210817104553901.png)

稍后就会有安装管理界面出来。

在 Server Core 中，至少这些应用程序是不兼容的：

- Microsoft Server Virtual Machine Manager 2019 (SCVMM)
- System Center Data Protection Manager 2019
- Sharepoint Server 2019
- Project Server 2019

此外，系统组件中至少这些是不兼容的：Windows Tiff IFilter, Internet Printing Client, RAS Connection Manager Kit, Simple TCP/IP Services, TFTP Client, Windows Search Service, XPS Viewer, 等等.

可以见到不兼容的东西几乎和普通人无关。

除此之外，基本上你可以认为 Core 就是更轻量级一点的版本，它的安装后尺寸大约在 5.1GB 上下，算是比较难得的了。



#### Desktop Experience

而 Desktop Experience 小版本则有完整的 GUI 界面，你可以像操作 Windows 11 或者 Windows NT 那样通过开始菜单进行 GUI 操作，当然也可以打开命令行提示符做工作。

这里有该界面的参考图样：

![img](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/1*Po9vJ6BTPdhvdhO6YuZQHg.png)

> **Windows Server 2019 with Desktop Experience — The Classic Look (e.g. Windows 10 1809)**

安装过程中的截图有这些：

![image-20210817131128654](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210817131128654.png)









#### 小结

所以官方的称呼，在 Windows Server 2022 ISO 的安装界面中能够看到，通常是这样：

1. Windows Server 2022 Standard (Desktop Experience)
2. Windows Server 2022 Standard

所以其中 2 即为 Server Core 版本。



##### 磁盘尺寸占用

Server Core 是更轻量级一点的版本，它的安装后尺寸大约在 6GB 上下。

而 Windows Server 2019 Core 的安装后尺寸约为 5.1GB。

作为参考，一个普通的 Windows 20H2 安装后大约占用 20GB 左右，而一个 Windows Server 2022 Standard (Desktop Expirience) 的安装后尺寸大约为 9～10GB。





## 安装后提要

安装后的必要动作，参考 2019 版本，并没有什么变化。

1.  [Windows Server 2019 安装提要 (及 VS 2019 Build Tool) | hzSomthing](/devops/windows/the-essentials/) 
2.  [Windows Server 2019 安装提要 (及 VS 2019 Build Tool) - Part 2 | hzSomthing](/devops/windows/the-essentials-2/) 



## 🔚

暂时写这么多。

