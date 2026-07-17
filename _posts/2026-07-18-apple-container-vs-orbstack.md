---
layout: single
title: Apple Container 和 OrbStack
date: 2026-07-18 03:55:00 +0800
last_modified_at: 2026-07-18 06:10:00 +0800
author: hedzr
tags: [VM, visualization]
categories: lifestyle review
comments: true
toc: true
header:
  teaser: /assets/images/unsplash-gallery-image-4.jpg
  overlay_image: /assets/images/unsplash-gallery-image-4-th.jpg
  overlay_filter: rgba(32, 32, 0, 0.3)
excerpt: >-
  从我的使用体验来粗略比较一下……
---



以基于底层的视角来看，Apple Container 和 UTM、OrbStack 没有太大区别（但也很大），并且与 OrbStack 基本上是竞品的关系。

UTM 能够采用 macOS `Virtualization.framework` 来创建虚拟机，然而它并不支持 Docker 容器，它是一个较为纯粹的虚拟机工具。UTM 的特点在于创建多种多样的 OS 系统，而 Apple Container/OrbStack 仅仅支持创建 Linux 虚拟机，你无法为其创建 Windows 虚拟机（或者未来会有，但这一希望比较渺茫），也无法创建诸如 DOS，FreeBSD 等等系统。

OrbStack 与 Apple Container 在功能方向上几乎完全相同，都支持（且仅支持）轻量级 Linux 虚拟机，Docker 容器（Apple Container 尚未支持 docker-compose）以及 k8s 环境（Apple Container 尚未完全支持）。两者采用的底层基础也完全相同（即 macOS `Virtualization.framework`），所以能力与限制也都相同。但 OrbStack 能够运行在 macOS 15.x Sequoia 上，而 Apple Container 自正式版 1.0 释出时就只支持 macOS 26+ Tahoe 以上。

所以对于 Sequoia 用户来说，使用 OrbStack 就好。

按照 Reddit 上一篇评估贴的说法，Apple Container，Docker Desktop 和 OrbStack 的评估表为：

| Category        | Apple (emulated amd64) | Apple (native arm64) | Docker (emulated amd64) | Docker (native arm64) | OrbStack (emulated amd64) | OrbStack (native arm64) | Units                     |
| --------------- | ---------------------- | -------------------- | ----------------------- | --------------------- | ------------------------- | ----------------------- | ------------------------- |
|                 |                        |                      |                         |                       |                           |                         |                           |
| CPU 1 thread    | 7132.88                | 11089.55             | 7006.09                 | 10505.76              | 7075.07                   | 11047.06                | events/s                  |
| CPU all threads | 42025.87               | 54718.16             | 40882.76                | 53301.71              | 42363.40                  | 55134.99                | events/s                  |
| Memory          | 84108.09               | 103288.30            | 80762.94                | 77505.92              | 67111.55                  | 90177.42                | MiB/s                     |
| Startup time    | 0.936                  | 0.940                | 0.205                   | 0.187                 | 0.232                     | 0.228                   | seconds (lower is better) |

Full charts and detailed results are available here - [Full Benchmark](https://www.repoflow.io/blog/apple-containers-vs-docker-desktop-vs-orbstack)

该评估于 2025 年底做出，现在已经略有过时（Apple Container 已经推出了 1.1 版本）。

按照该评估结果，当前 OrbStack 占据绝对优势。这个结果其实挺意外的。但是却又毫不意外啊！

Apple Container 的优势在于：

1. Apple 公司推动，故而远景较为安全、合规。相比较而言，OrbStack 公司天生地受制于 Apple 的底层 API，未必能够坚持（5年以上）。
2. Apple Container 使用多个 Micro-VMs（轻量级虚拟机）来运行多个 Docker 容器，而 OrbStack 和 Docker Desktop 都是使用一个重量级 Linux 虚拟机（完全能力的 VM）作为核心，在其中运行多个容器。
3. Apple Container 使用 Micro-VMs 技术来创建 Linux 虚拟机，非常轻快。你可以毫无压力地随意创建数十上百个 Linux 虚拟机，涵盖各种发行版以及各种版本，这对于开发测试来说是极致的利好。这些数百个虚拟机无论是在平时运行还是初始化启动方面都几乎没有额外负载，在密集计算方面基本没有损耗、密集 I/O 方面也损耗极小（仍略逊于 OrbStack）。由于 Apple CPU 的特性（核心数较多），调度方面也更平滑。
4. OrbStack 使用专有的优化技术建立了一个超优的 Linux VM 并用于运行 Docker 容器和 Linux 虚拟机。由于它们家的技术实力，容器与虚拟机的表现都非常惊艳，当前是超过 Apple Container 的。
5. 采用 OrbStack 来运行数百不同 Linux 发行版和不同版本，同样是在启动与运行时几无负载，可以无压力地随时候命。由于 Network/Disk I/O 损耗很小，所以用于构建 Linux Kernel/GCC/LLVM 也没有太大压力（实测 M3 Pro 用于构建能够接受）。
6. Apple Container 和 OrbStack 都有一个诱人的特性，即在数秒内即可创建一台完整功能的 Linux VM（当然前提在于你的网络状态不要拖后腿，因为安装过程需要下载 Linux 发行版的 network-install images/packages）。这个能力是由 OrbStack 首创的，Apple Container 完美地复制了它。由于该能力的存在，你能够像云厂商那样快速创建和销毁虚拟机（借助于 cloud-init），所以开发者掌握 Ansible，Terraform 等 devops 工具的需求被放大了。
7. 但是未来，例如 5 年以后，OrbStack 可能会被 Apple Container 追平和超过。特别要指出的是，OrbStack 还优化了 Network 和 Disk I/O，所以这方面的表现很亮眼。

OrbStack 虽然创建的是较重量级的 Linux 虚拟机，但仍然是基于 macOS `Virtualization.framework` 技术，所以得益于他们家的变态技术实力和不同于常人的着眼点（深度优化 Network/Disk I/O），当前表现是最好的，在容器、Linux 虚拟机以及 K8s 集群等三方面都最强。

OrbStack 也仍然有一些缺点，例如某些 Linux 发行版的安装总是受挫，容器运行的兼容性偶有问题，自动启动支持不足（如果使能其自动启动功能，则 macOS 启动环节较慢），网络驱动有时候会破坏环境（开机数日后网络可能中断或受阻，需 reboot macOS 来恢复），等等，这里就不展开了。因为瑕不掩瑜，OrbStack 当前是最能打的，暂时没有竞争者，即使 Apple Container 也不行。





























