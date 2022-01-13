---
layout: single
title: 在 cloud-init 中使用 meta-data 来控制开机参数
date: 2022-01-03 13:00:00 +0800
last_modified_at: 2022-01-04 07:57:00 +0800
Author: hedzr
tags: [linux, ubuntu, focal, pxe, cloud-init, autoinstall, devops]
categories: devops linux
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220101205558999.png
  overlay_image: /assets/images/ubuntuhero.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
excerpt: >-
  向云服务模式推进一步，使用 meta-data 来定义你的新主机开机参数 [...]
---


> **摘要**：  
> 向云服务模式推进一步，使用 meta-data 来定义你的新主机开机参数
>
> <!--MORE-->



## 引子

本文的上篇是 [通过 PXE 自动化安装 Ubuntu Server](https://hedzr.com/devops/linux/build-pxe-server-and-autoinstall-ubuntu-server/) ，在那里我介绍了 Ubuntu 提供的 autoinstall 方法，该方法利用 cloud-init 的支持确立了一套关于 user-data 的规范，并被用于无人值守安装。

配合 PXE 技术之后就能实现新主机上电后自动准备系统等一系列工作。

在上一篇中我们混用 cloud-init 和 autoinstall 两个说法。

但实际上这两者完全不同。后者实际上是前者的针对 Ubuntu 的一个专有适配。

而利用 cloud-init 可以构造一整套云基础设施，这些是 autoinstall 完全不负责处理的东西。

## 范围

本文因而基于上一篇的的成果向前推进一步，向你解释如何在 user-data 中使用 meta-data 中准备的数据集。

当使用一个持久层以及前端从页面表单获取到由用户指定的 meta-data 数据集之后，我们可以包装 http 以提供一个基于持久层的动态的 meta-data，它反应了用户请求新主机时所提供的数据集。这就是云服务提供商所干的关键的一步，这样一来，我们从 aws console 提交的新主机节点的请求就能完全按照我们的意愿从母机上 kvm 出一台 vm，自动安装用户所请求的系统，自动设定主机名等等行为了。

> 还记得我们配置的 grub.cfg 内容吗，GRUB 菜单项启动 Ubuntu 安装器的指令里包含 `ds="nocloud-net;s=http://172.16.207.90:3001/autoinstall/"` 的参数，它说明了一点：透过这个 Web Server 提供一份和顾客请求 ID 相匹配的 meta-data 动态文本是相当容易的。你可以用到你想象得到的任何动态网站构造工具，nodejs，python，ruby，golang，就能够依据新主机的 Mac-address 或者 instance-id 来提取该客户请求数据包中的 meta-data 数据集了。
>
> PS:
>
> 由于可以选择不一样的方式（非 iso 下拉方式，改用 netinstall 模式）来引导安装器，所以未必是采用上述的技术措施。

显而易见地，这个过程有大量的细节需要人命去填满，网络规划，主机规格，定制的主机安装模板，等等规模非常庞大。

然而核心的核心，不就是用户的 meta-data 数据集如何呈现给到 user-data 中相应的字段上去么？

这就是本文的范围了。



## HOW

从技术规范上讲，这个呈现的方案一句话就能说完：JINJA 模板。

不过哪怕就是这么一个小小的东西，也还是有很多含混不清的东西，所以我们还是老样子，来一个可以跑的实例，给你讲解为什么那里要那样做。

> Jinja 是为 Python 应用程序所使用的一种文字模板引擎，主要特点是提供了完整的 HTML 转义系统以及沙盒执行模式，因而从它的角度能够有效地抵抗来自于跨站脚本攻击。在像 Ansible 等这样的典型运维工具中都有 Jinja 的身影。
>
> 历史上主要流传的，被大众熟知和所使用的是 Jinja2 版本。不过现在 Jinja 已有 Jinja3 版本了。两者没有 BROKEN 的差别，你可以不刻意地区分。

## 实例

按照 cloud-init 的官方文档，在任何 `#cloud-config` 标记的文档中，都可以引入 Jinja 模板特性。

### identity

所以 user-data 这个文件就可以写作这样：

```yaml
## template: jinja
#cloud-config
# vim: syntax=yaml
autoinstall:
  version: 1
  interactive-sections: [ ]
  identity:
    hostname: "{ { ds.meta_data.moore.hostname }}"  # ubuntu-server
    username: "{ { ds.meta_data.moore.default_user }}"  #hz
    password: "{ { ds.meta_data.moore.default_user_password }}"

...
```

> 为了越过 GitHub Pages 以及 Jekyll 的 Markdown 运算限制，上述代码中的一切 `{ %` 或者 `{ {` 符号均额外插入了一个空格来防止被计算展开。

配套的 meta-data 同样是一个 yaml 格式的文本文件：

```yaml
# instance-id: moore-autoinstall-serial-793156
moore:
  default_user: hz
  default_user_password: "$6$M8WnHMy5c6Mj$9hBKDqImDNSvhU.ANvrRfMW.qEmK0wZS1zExtGh0hkSc7kb4TTAC1q6TCC/MF806v5yXi8jZ/g6gHGchKb2Ko/"
  hostname: u20t01.ops.local

```

真的很有幸福感。



### ssh-keys

在 meta-data 中我们定义了一组预先授权的 authorized keys，它们将被以数组的方式做展开。

meta-data

```yaml
moore:
  ssh_keys:
    - "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDxjcUOlmgsabCmeYD8MHnsVxueebIocv5AfG3mpmxA3UZu6GZqnp65ipbWL9oGtZK3BY+WytnbTDMYdVQWmYvlvuU6+HbOoQf/3z3rywkerbNQdffm5o9Yv/re6dlMG5kE4j78cXFcR11xAJvJ3vmM9tGSBBu68DR35KWz2iRUV8l7XV6E+XmkPkqJKr3IvrxdhM0KpCZixuz8z9krNue6NdpyELT/mvD5sL9LG4+XtU0ss7xH1jk5nmAQGaJW9IY8CVGy07awf0Du5CEfepmOH5gJbGwpAIIubAzGarefbltXteerB0bhyyC3VX0Q8lIHZ6GhMZSqfD9vBHRnDLIL"
```

User-data

```yaml
## template: jinja
#cloud-config
# vim: syntax=yaml
autoinstall:
  version: 1
  ssh:
    allow-pw: no
    install-server: true
    authorized-keys:
      { % for sk in ds.meta_data.moore.ssh_keys %}
      - { { sk }}
      { % endfor %}

```

> 为了越过 GitHub Pages 以及 Jekyll 的 Markdown 运算限制，上述代码中的一切 `{ %` 或者 `{ {` 符号均额外插入了一个空格来防止被计算展开。

### 小结

Enough！

我本打算再水个几千字的。后来一想，有时候含蓄也是美，都把过筋过脉的 keypoint 点到这个程度了，剩下的还是你自己来吧。



## Tarball

同样地，代码仍然在那里。你可以在 [repo](https://github.com/hedzr/pxe-server-and-focal) 中 devel 分支找到进一步的代码，欢迎取用。

## 参考

- [Instance Metadata — cloud-init 21.4 documentation](https://cloudinit.readthedocs.io/en/latest/topics/instancedata.html) 
- [tftp-hpa at git.kernal.org](https://git.kernel.org/cgit/network/tftp/tftp-hpa.git)
- [Jinja — Jinja Documentation (3.0.x)](https://jinja.palletsprojects.com/en/3.0.x/) 



## 后记

本文中没有提到的是，我们在 devel 分支中的新代码里，改进了 boot.sh 脚本的内容，一方面是排除了一些变量展开失常的 bugs，另一方面是增加了更多的开机微调参数。

作为一个原理性的研究，本文和 [通过 PXE 自动化安装 Ubuntu Server](https://hedzr.com/devops/linux/build-pxe-server-and-autoinstall-ubuntu-server/) 就此暂告一段落了，继续下去就主要是云服务商有关团队的工作了。



🔚