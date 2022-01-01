---
layout: single
title: 通过 PXE 自动化安装 Ubuntu Server
date: 2021-12-31 09:58:00 +0800
last_modified_at: 2022-1-1 21:13:00 +0800
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
  建立一个 PXE 服务器以便在 LAN 中提供 UbuntuServer 的自动化安装任务 / new post about building a pxe server and get unattended ubuntu server installation work. [...]
---


> **摘要**：  
> 关于如何构造一台 PXE 服务器，以及 Ubuntu autoinstall 功能的实际应用。
>
> **注意**：  
> 阅读本文你必须具备一定的 bash 编程知识。
>
> **附言**：  
> 本文是跨年版本，原本打算年前发出的，但是这两天耽搁了，只好现在了。
>
> <!--MORE-->



## 前言

在云环境中，云服务商提供了主机模板（和服务器镜像）以便加速服务器节点的开设。这类功能（包括像 Vultr 那样的或者各种 VPS 提供商那样的）有几种不同的架构方法，一般情况下主要是通过 KVM 底层结构，搭配上层的管理模块如 Cobble 之类来组成。

### PXE

为了做到从客户下单就触发全自动操作，则需要 PXE 机制的介入，使得新节点主机从加电开始就开始如下的流程：

1. 尝试寻找 DHCP 服务器，并从 PXE Server 获得 DHCP 的 IP 地址，以及额外的 BOOTP 参数
2. 使用 BOOTP 参数（通常是一个文件名“pxelinux.0”），从 PXE Server 的 TFTP 服务中获取启动文件 pxelinux.0
3. pxelinux.0 启动文件开始一整套 linux 引导序列，包括：
   1. 查找 grub 信息并显示 grub 选单
   2. 在用户选择了 grub 选单条目、或者默认条目命中时，载入对应的 vmlinuz 与 initrd 去引导 Linux 的内核
   3. 引导该内核时总是配搭 install 参数，所以将会自动进入到 Linux 标准的安装界面
   4. 由 autoinstall 所提供的 cloud-config 参数（即 user-data 文件）在安装过程中自动提供应答数据，从而令安装界面能够自动推进
4. cloud-init 机制负责解释 meta-data 数据
5. cloud-init 机制促使后期脚本完成服务商所需的其它任务

云服务商们经由上述机制，就能提供完整的在线开机服务了。

当然这里面的细节还非常地多，不过那就是填入人命的问题了。

对于其它 OS 来说，pxelinux.0 可以是别的 bootloader，甚至文件名也不必如此。



### cloud-init

cloud-init 是一整套的主机节点从零开始的开机机制，由 Canonical 研发，并且是当前主流云服务商的事实上的开机标准，不同的 OS 均能通过这套机制的对接和装饰达到无人看管的开机工作。

在 Ubuntu 中，现在是使用所谓的 autoinstall 机制来与 cloud-init 做对接。由于两者的开发商都是一个人，所以不妨将 autoinstall 看作是 Ubuntu 版本的 cloud-init 具体实现。

早期的 Ubuntu，以及 Debian 系，都是使用 preseed 机制来做无人看管安装操作系统的任务，但现在已经被 cloud-init 和 autoinstall 所接管。

在 RedHat 系中以前是使用 Kickstart 机制来做无人看管安装任务，现在在云上则是通过符合 Openstack 规范的机制经由 cloud-init 来完成。其它操作系统也有类似的方案。

这些内容就大大超出本文的纲要范围。



## 正文

### 范围

我们就只讲解一段在本地模拟相应场景的实例，提供一组基础脚本，以达到展示这套基本流程的目的。

这里不仅仅是准备一台 PXE 服务器，也是为了提供一套可重用，易于调整的 devops 运维范例。完全不必使用任何已知的高层包装器。

在本文中，你会看到我们建设了一台 pxe-server，然后通过它支持其它新虚拟机无人值守地全自动完成操作系统安装和工作环境的配置。



### 概要

我们的环境是建设在 VMWare 中的，所有 VMs 均使用单一的网卡挂接为 NAT 方式，NAT 网络被用来模拟云服务商的网络。

一台 PXE Server 被运行在 NAT 网段中，提供 DHCP+BOOTP，TFTP 和 WEB 服务，这三者向 NewNode 提供无人看管安装任务的全部所需材料。

我们在同一网段中建立若干新 VM 主机，并设置启动 BIOS 类型的 UEFI 方式而非传统方式。然后直接开机，令其自动查找 DHCP 获得 IP 地址，进入安装序列，完成全部安装任务后停留在启动就绪状态，从而达到了模拟的目的。



### 准备 PXE 服务器



PXE 是**预启动执行环境**（**Preboot eXecution Environment**，**PXE**，也被称为**预执行环境**），它提供了一种使用网络接口（Network Interface）启动计算机的机制。这种机制让计算机的启动可以不依赖本地数据存储设备（如硬盘）或本地已安装的操作系统。

在我们的设想中，LAN 中一台新的主机节点从裸机上电开始，首先经由 PXE 机制获得一个启动环境，然后供给它恰当的安装系统，以便让这台裸机进入自动化安装流程，最终得到一台 OS 就绪的可工作运行节点，并入当前的生产环境中成为云设施的一份子。

所以我们需要在 LAN 中运行一台 PXE 服务器来提供 DHCP+BOOTP 服务。其中 DHCP 服务通过 UDP 协议等候裸机的网卡召唤请求一个新的 IP 地址，BOOTP 附着在 DHCP New IP Requested 报文中回应给裸机网卡，支持 BOOTP 协议的网卡就能检索对应的 BOOTP 文件并载入它进行首次启动。PXE 服务器的 DHCP+BOOP 服务通常回应的启动文件名为 pxelinux.0，这是可定制的。

![img](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/290px-PXE_diagram.png)

客户机网卡以此文件名向 PXE 服务器的 TFTP 服务请求该文件，读取此文件到内存中特定位置，并将 CPU 执行权限交给该启动位置，进入相应的启动流程。

pxelinux.0 的典型流程：

- 一般来说，此流程取得 TFTP 服务器的 /grub 文件夹，获得 grub.cfg 并向用户展示一个带有倒计时的 GRUB 启动菜单。

对于自动安装系统来说，这个选单的默认值是指向 WEB 服务器的特定位置 `I`，并从该位置拉回安装镜像执行，从而进入到典型的 Linux 系统安装流程。注意我们会配给一个无人应答文件，因此 Linux 系统安装流程会自动执行全部序列，无需人工介入。

说了这么多，现在我们来看看怎么具体地准备这台 PXE 服务器

| 主机       | IP            |      |
| ---------- | ------------- | ---- |
| PXE-server | 172.16.207.90 |      |
| NewNode    | -             |      |
|            |               |      |



#### 基本系统

首先我们安装基本系统，注意本文仅针对 Ubuntu 20.04 LTS，所以 PXE-server 也使用此系统。

> 但这倒并不是必需的。实际上你需要一台服务器支持 DHCP, TFTP, WEB 服务就可以了。

根据个人爱好，我们安装 zsh 和插件来帮助减轻击键压力。



#### 总的入口代码

我们使用一个脚本 `vms-builder` 来做整体的 PXE-server 构建。

> 一些辅助函数的解释在后继章节 `bash.sh` 中单独介绍（后记：其实并没有），目前你可以脑补他们：例如 Install_packages 等价于 sudo apt-get install -y，headline 相当于 高亮文字的 echo，fn_name 能够得到当前 bash/zsh 函数名，等等。
>
> 部分需要用到的变量，此时也可能不做介绍，你可以稍后查阅脚本源代码。

这个脚本中的起点，也就是入口代码是这样的：

```bash
vms_entry() {
	headline "vms-builder is running"

	local ubuntu_iso_url="https://${ubuntu_mirrors[0]}/ubuntu-releases/${ubuntu_codename}/${ubuntu_iso}"
	local alternate_ubuntu_iso_url=${alternate_ubuntu_iso_url:-$ubuntu_iso_url}

	local tftp_dir=/srv/tftp
	local full_nginx=-full

	v_install   # install software packages: tftp, dhcp, nginx, etc
	v_config    # and configure its
	v_end       #
}
```

> 这是本文与其它相同主题文章的不同之处：我们提供一套编制 bash 脚本的最佳范例，你可以很容易地调整它，也能够简便地藉此范本做其它用途。
>
> 此外这是一套支持冥等性的系统配置方法，你可以反复多次执行脚本而无需担心弄出莫名其妙的结果。
>
> 因此我们会对编程方法进行同步的解说。

`v_install` 和 `v_config` 是整个 PXE-server 构造的关键入口。其意自明。



#### 软件包安装的入口

系统中需要如下的软件包

| Package         | Usage                                           |      |
| --------------- | ----------------------------------------------- | ---- |
| tftp-hpa        | TFTP 服务提供系统安装文件如 pxelinux.0, grub 等 |      |
| isc-dhcp-server | DHCP+BOOTP 服务                                 |      |
| Nginx           | 提供 Ubuntu 20.04 安装镜像                      |      |

PXE 协议结合了 [DHCP](https://zh.wikipedia.org/wiki/DHCP) 和 [TFTP](https://zh.wikipedia.org/wiki/TFTP)。DHCP 用于查找合适的启动服务器，TFTP 用于下载网络启动程序（NBP）和附加文件。

由于 Ubuntu 的安装程序采用 iso 镜像方式（此方式对于我们来说最为方便），因此还需要 Web 服务器提供下载功能。

好，`v_install` 将会安装他们：

```bash

v_install() {
	echo && headline "$(fn_name)" && line

	v_install_tftp_server
	v_install_dhcp_server
	v_install_web_server
}

v_install_tftp_server() {
	headline "$(fn_name)"
	install_packages tftpd-hpa
}

v_install_dhcp_server() {
	headline "$(fn_name)"
	install_packages isc-dhcp-server
}

v_install_web_server() {
	headline "$(fn_name)"
	install_packages nginx$full_nginx
}

```

不再赘述了。



#### 配置软件包的入口

`v_config` 处理全部配置动作。

```bash
v_config() {
	echo && headline "$(fn_name)" && line

	v_config_dirs
	v_download_iso

	v_config_boot
	v_config_grub

	v_config_bash_skel

	v_config_tftp
	v_config_dhcp
	v_config_nginx

	v_config_aif        # autoinstall files
}
```

我们将要达成的目标是建立这样的 TFTP 布局：

![image-20220101132339519](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220101132339519.png)

此外，还需要配置 DHCP，Web Server 等等。

下面的章节将会依照 v_config 给定的顺序依次解说。



#### v_config_dirs

我们最终要建立一整颗 tftp 文件夹结构，所以这里首先做出基本结构：

```bash
v_config_dirs() {
	$SUDO mkdir -pv $tftp_dir/{autoinstall,bash,boot/live-server,cdrom,grub,iso,priv}
}
```

> SUDO 是一个防御性措施。它是这么定义的：
>
> ```bash
> SUDO=sudo
> [ "$(id -u)" = "0" ] && SUDO=
> ```
>
> 因此对于 root 用户来说它等同于没有，而对于其它用户而言它就是 `sudo` 指令。



#### v_download_iso

然后是下载 Ubuntu 20.04 live server iso 文件。

```bash
v_download_iso() {
	headline "$(fn_name)"
	local tgt=$tftp_dir/iso/$ubuntu_iso
	[ -f $tgt ] || {
		wget "$alternate_ubuntu_iso_url" -O $tgt
	}

	grep -qE "$tftp_dir/iso/" /etc/fstab || {
		echo "$tftp_dir/iso/$ubuntu_iso on $tftp_dir/cdrom    iso9660     ro,loop    0 0" | $SUDO tee -a /etc/fstab
		$SUDO mount -a && ls -la --color $tftp_dir/cdrom
	}
}
```

> 这里涉及到一系列预定义的变量，它们是这样的：
>
> ```bash
> ubuntu_codename=focal
> ubuntu_version=20.04.3
> ubuntu_iso=ubuntu-${ubuntu_version}-live-server-amd64.iso
> 
> ubuntu_mirrors=("mirrors.cqu.edu.cn" "mirrors.ustc.edu.cn" "mirrors.tuna.tsinghua.edu.cn" "mirrors.163.com" "mirrors.aliyun.com")
> ```
>
> ubuntu_mirrors 是一个 bash 的数组型变量，但这个列表实际上仅有第一个值才会被我们用到：
>
> ```bash
> # in vms_entry():
>   local ubuntu_iso_url="https://${ubuntu_mirrors[0]}/ubuntu-releases/${ubuntu_codename}/${ubuntu_iso}"
> 	local alternate_ubuntu_iso_url=${alternate_ubuntu_iso_url:-$ubuntu_iso_url}
> 
> ```
>
> :ok:
>

一开始我们首先测试文件有否存在，并根据需要下载 iso 文件。

在 v_download_iso 的末尾，我们通过 grep 校验 fstab 是不是尚未修改过，然后添加条目进去，目的是将下载的 iso 文件挂载到 `/srv/tftp/cdrom` 中。

自动挂载并不耽误什么事，但是今后我们就能很便利地提取 iso 中的文件了。



#### v_config_boot

> 在上一节，我们已经挂载了 iso 文件到 cdrom/ 中

```bash
v_config_boot() {
	# boot files
	local tgt=$tftp_dir/boot/live-server
	[ -f $tgt/vmlinuz ] || {
		$SUDO cp $tftp_dir/cdrom/casper/vmlinuz $tgt/
		$SUDO cp $tftp_dir/cdrom/casper/initrd $tgt/
	}
}
```

简单不解释。



#### v_config_grub

前提：

```bash
local tgt=$tftp_dir/grub
```

这部分代码首先下载和准备 pxelinux.0 文件；

```bash
	[ -f $tftp_dir/pxelinux.0 ] || {
		$SUDO wget http://archive.ubuntu.com/ubuntu/dists/${ubuntu_codename}/main/uefi/grub2-amd64/current/grubnetx64.efi.signed -O $tftp_dir/pxelinux.0
	}
```

然后从 cdrom/ 中复制 grub 的字体文件：

> 在前面小节中，我们已经挂载了 iso 文件到 cdrom/ 中

```bash
	[ -f $tgt/font.pf2 ] || $SUDO cp $tftp_dir/cdrom/boot/grub/font.pf2 $tgt/
```

然后是生成 grub.cfg 文件：

```bash
	[ -f $tgt/grub.cfg ] || {
		cat <<-EOF | $SUDO tee $tgt/grub.cfg

			if loadfont /boot/grub/font.pf2 ; then
			  set gfxmode=auto
			  insmod efi_gop
			  insmod efi_uga
			  insmod gfxterm
			  terminal_output gfxterm
			fi

			set menu_color_normal=white/black
			set menu_color_highlight=black/light-gray

			set timeout=3

			menuentry "Ubuntu server 20.04 autoinstall" --id=autoinstall {
			    echo "Loading Kernel..."
			    # make sure to escape the ';' or surround argument in quotes
			    linux /boot/live-server/vmlinuz ramdisk_size=1500000 ip=dhcp url="http://${PXE_IP}:3001/iso/ubuntu-${ubuntu_version}-live-server-amd64.iso" autoinstall ds="nocloud-net;s=http://${PXE_IP}:3001/autoinstall/" root=/dev/ram0 cloud-config-url=/dev/null
			    echo "Loading Ram Disk..."
			    initrd /boot/live-server/initrd
			}

			menuentry "Install Ubuntu Server [NEVER USED]" {
			    set gfxpayload=keep
			    linux  /casper/vmlinuz   quiet  ---
			    initrd /casper/initrd
			}

			grub_platform
			# END OF grub.cfg
		EOF
```

你必须检视源代码而不是从页面上复制粘贴这些代码，因为 heredoc 的缩进功能需要 tab 制表符来缩进，而页面上这些字符的原貌可能已经丢失。

> 有关 heredoc 的高级技巧请参阅： [认识 Here Document](https://hedzr.com/devops/shell/about-heredoc/) 

在这个 grub 菜单中，`url="http://${PXE_IP}:3001/iso/ubuntu-${ubuntu_version}-live-server-amd64.iso"` 给出的是安装光盘的 iso 镜像，这是通过 Web Server 服务访问的，稍后在 v_config_nginx 中我们会将 tftp 文件夹映射为 listable 的页面结构。

`ds="nocloud-net;s=http://${PXE_IP}:3001/autoinstall/"` 指定的是 autoinstall 文件夹，目的是通过 autoinstall 规范提供 meta-data 和 user-data 两个文件，它们被用于免值守自动安装。

ubuntu live server 的 iso 文件大约是 1GB 上下，所以 `ramdisk_size=1500000` 指定内存磁盘大小到大约 1.5GB 以容纳该 iso，还要留出一定余量给安装程序。所以你的每台新主机节点至少需要 2GB 内存的配置，否则可能无法完成自动安装过程。

##### 特权状态与管道输出

对于 bash 编写来说，非特权用户要想通过 heredoc 生成一个文件，需要如下的惯用法：

```bash
cat <<-EOF | sudo tee filename
EOF
```

然后会有一些变种，例如追加到 filename 中：

```bash
cat <<-EOF | sudo tee -a filename
EOF
```

这个惯用法是为了解决输出管道符不能 sudo 的问题：

```bash
echo "dsjkdjs" > filename
```

如果 filename 是受特权保护的，则echo管道输出会报错，要想解决问题，就需要改用 `cat heredoc | sudo tee filename` 句法。

由于 bash 支持多行字符串，所以当你不想使用 heredoc 时，也可以：

```bash
echo "djask
djska
daskl
dajskldjsakl" | sudo tee filename
```

但它在简单无变量展开的场景中尚算可用，若是你的文本内容庞大且可能包含复杂的变量展开，又或者有各种单引号双引号包围，那么 cat heredoc 才是正确的道路。



#### v_config_bash_skel

v_config_bash_skel 的目的是生成最小的后安装脚本 boot.sh：

```bash
v_config_bash_skel() {
	[ -f $tftp_dir/bash/boot.sh ] || {
		cat <<-"EOF" | $SUDO tee $tftp_dir/bash/boot.sh
			#!/bin/bash
			# -*- mode: bash; c-basic-offset: 2; tab-width: 2; indent-tabs-mode: t-*-
			# vi: set ft=bash noet ci pi sts=0 sw=2 ts=2:
			# st: 
			#

			echo "booted."
			[ -f custom.sh ] && bash custom.sh

		EOF
	}

	#
	$SUDO touch $tftp_dir/priv/gpg.key
	$SUDO touch $tftp_dir/priv/custom.sh
}
```

`boot.sh` 将被在 Ubuntu 安装完成后，首次启动就绪时被自动执行。

此外我们还建立 0 长度的备用文件 `gpg.key` 和 `custom.sh`。

如果你想自动灌入专用的密钥，例如当你需要做 devops 分发部署前签名时，那么你可以提供一个有效的 gpg.key 文件，否则保留 0 长度即可。

如果你需要额外的后后处理脚本的话，可以提供一个有效的 custom.sh 脚本文件。

我们也提供一份更完整的 boot.sh，但可能需要在下一次再做介绍了。



#### v_config_tftp

```bash
v_config_tftp() {
	cat /etc/default/tftpd-hpa
}
```

什么都不做！

tftp 默认的配置是指向 `/srv/tftp` 文件夹，我们就用这个，无需额外配置。



#### v_config_dhcp

主要目的是配置 DHCP 的 IP 池：

```bash
v_config_dhcp() {
	local f=/etc/dhcp/dhcpd.conf
	$SUDO sed -i -r "s/option domain-name .+\$/option domain-name \"$LOCAL_DOMAIN\";/" $f
	$SUDO sed -i -r "s/option domain-name-servers .+\$/option domain-name-servers ns1.$LOCAL_DOMAIN, ns2.$LOCAL_DOMAIN;/" $f

	grep -qE "^subnet $DHCP_SUBNET netmask" $f || {
		cat <<-EOF | $SUDO tee -a $f

			# https://kb.isc.org/v1/docs/isc-dhcp-44-manual-pages-dhcpdconf
			subnet $DHCP_SUBNET netmask $DHCP_MASK {
			    option routers             $DHCP_DHCP_ROUTER;
			    option domain-name-servers 114.114.114.114;
			    option subnet-mask         $DHCP_MASK;
			    range dynamic-bootp        $DHCP_RANGE;
			    default-lease-time         21600;
			    max-lease-time             43200;
			    next-server                $DHCP_DHCP_SERVER;
			    filename "pxelinux.0";
			    # filename "grubx64.efi";
			}

		EOF
	}

	$SUDO systemctl restart isc-dhcp-server.service
}
```

`filename "pxelinux.0";` 命名了 BOOTP 文件名。

涉及到的变量主要有这些：

```bash
LOCAL_DOMAIN="ops.local"

DHCP_PRE=172.16.207
DHCP_SUBNET=$DHCP_PRE.0
DHCP_MASK=255.255.255.0
DHCP_DHCP_ROUTER=$DHCP_PRE.2   # it should be a router ip in most cases
DHCP_DHCP_SERVER=$DHCP_PRE.90  # IP address of 'pxe-server'
DHCP_RANGE="${DHCP_PRE}.100  ${DHCP_PRE}.220"  # the pool

PXE_IP=$DHCP_DHCP_SERVER
PXE_HOSTNAME="pxe-server" # BIOS name of PXE server, or IP address
```

由于是在本地的 VMWare 虚拟机中进行模拟，所以使用了一个小型的网段规划。





#### v_config_nginx

简单地追加 nginx 配置并重启 nginx：

```bash
v_config_nginx() {
	local f=/etc/nginx/sites-available/default
	grep -qE 'listen 3001' $f || {
		cat <<-EOF | $SUDO tee -a $f

			server {
			  listen 3001 default_server;
			  listen [::]:3001 default_server;
			  root $tftp_dir;
			  autoindex on;
			  autoindex_exact_size on;
			  autoindex_localtime on;
			  charset utf-8;
			  server_name _;
			}

		EOF
		$SUDO systemctl restart nginx.service
	}
}
```

这个配置指定了 pxe-server:3003 的 web 服务，在 grub.cfg 中被使用。



#### v_config_aif

v_config_aif 可谓为重头戏，它构造了 autoinstall 所需的文件。

按照 Ubuntu autoinstall 规范，meta-data 可以提供 instance_id 等 key:value 对，但也可以什么都不提供。

至于 user-data 文件，则是用于对安装过程进行自动应答。它的内容较多，但并不难理解。其难度大概在于，什么可以怎样调整的问题，有时候找不到依据。不过下面以函数的方式提供出来，特定的占位符都已经准备就绪，因此你基本上能够很好地按照自己的意愿进行调整——只需要去修改 bash 变量值即可。

下面是函数的全景，略有删减：

```bash
v_config_aif() {
	# autoinstall files
	$SUDO touch $tftp_dir/autoinstall/meta-data

	declare -a na
	local network_str="" str="" n=1 i
	na=($(ifconfig -s -a | tail -n +2 | grep -v '^lo' | awk '{print $1}'))
	for i in ${na[@]}; do
		[[ $n -gt 1 ]] && str=", " || str=""
		str="${str}${i}: {dhcp4: yes,dhcp6: yes}"
		network_str="${network_str}${str}"
		let n++
	done

	grep -qE '^#cloud-config' $tftp_dir/autoinstall/user-data || {
		cat <<-EOF | $SUDO tee $tftp_dir/autoinstall/user-data
			#cloud-config
			autoinstall:
			  version: 1
			  interactive-sections: []

			  # https://ubuntu.com/server/docs/install/autoinstall-reference
			  # https://ubuntu.com/server/docs/install/autoinstall-schema
			  apt:
			    primary:
			      - arches: [default]
			        uri: http://${ubuntu_mirrors[0]}/ubuntu

			  user-data:
			    timezone: $TARGET_TIMEZONE
			    # Europe/London
			    disable_root: true
			    # openssl passwd -6 -salt 1234
			    # mkpasswd -m sha-512
			    chpasswd:
			      list: |
			        root: ${TARGET_PASSWORD}
			    runcmd:
			      - wget -P /root/ http://$PXE_HOSTNAME:3001/bash/boot.sh
			      - wget -P /root/ http://$PXE_HOSTNAME:3001/priv/gpg.key || echo "no gpg key, skipped"
			      - wget -P /root/ http://$PXE_HOSTNAME:3001/priv/custom.sh || echo "no custom.sh, skipped"
			      - bash /root/boot.sh
			      #- sed -ie 's/GRUB_TIMEOUT=.*/GRUB_TIMEOUT=3/' /target/etc/default/grub

			  identity:
			    hostname: $TARGET_HOSTNAME
			    # username: ubuntu
			    # password: "\$6\$exDY1mhS4KUYCE/2\$zmn9ToZwTKLhCw.b4/b.ZRTIZM30JZ4QrOQ2aOXJ8yk96xpcCof0kxKwuX1kqLG/ygbJ1f8wxED22bTL4F46P0"
			    username: $TARGET_USERNAME
			    password: "${TARGET_PASSWORD}"

			  keyboard: {layout: 'us', variant: 'us'}
			  # keyboard: {layout: 'gb', variant: 'devorak'}
			  locale: $TARGET_LOCALE

			  ssh:
			    allow-pw: no
			    install-server: true
			    authorized-keys: [$(n=1 && for arg in "${TARGET_SSH_KEYS[@]}"; do
				# arg=\"$arg\"
				[ $n -gt 1 ] && echo -n ", "
				echo -n "\"$arg\""
				let n++
			done)]

			  packages: [$(n=1 && for arg in "${TARGET_PKGS[@]}"; do
				# arg=\"$arg\"
				[ $n -gt 1 ] && echo -n ", "
				echo -n "\"$arg\""
				let n++
			done)]

			  storage:
			    grub:
			      reorder_uefi: false
			    swap:
			      size: 0
			    config:
			      # https://askubuntu.com/questions/1244293/how-to-autoinstall-config-fill-disk-option-on-ubuntu-20-04-automated-server-in
			      - {ptable: gpt, path: /dev/sda, preserve: false, name: '', grub_device: false, type: disk, id: disk-sda}
			      
			      - {device: disk-sda, size: 536870912, wipe: superblock, flag: boot, number: 1, preserve: false, grub_device: true, type: partition, id: partition-sda1}
			      - {fstype: fat32, volume: partition-sda1, preserve: false, type: format, id: format-2}
			      
			      - {device: disk-sda, size: 1073741824, wipe: superblock, flag: linux, number: 2,
			        preserve: false, grub_device: false, type: partition, id: partition-sda2}
			      - {fstype: ext4, volume: partition-sda2, preserve: false, type: format, id: format-0}
			      
			      - {device: disk-sda, size: -1, flag: linux, number: 3, preserve: false,
			        grub_device: false, type: partition, id: partition-sda3}
			      - name: vg-0
			        devices: [partition-sda3]
			        preserve: false
			        type: lvm_volgroup
			        id: lvm-volgroup-vg-0
			      - {name: lv-root, volgroup: lvm-volgroup-vg-0, size: 100%, preserve: false, type: lvm_partition, id: lvm-partition-lv-root}
			      - {fstype: ext4, volume: lvm-partition-lv-root, preserve: false, type: format, id: format-1}
			      
			      - {device: format-1, path: /, type: mount, id: mount-2}
			      - {device: format-0, path: /boot, type: mount, id: mount-1}
			      - {device: format-2, path: /boot/efi, type: mount, id: mount-3}

		EOF
	}
}
```

它用到的 bash 变量另有声明，部分节录如下：

```bash
TARGET_HOSTNAME="${TARGET_HOSTNAME:-ubuntu-server}"
TARGET_USERNAME="${TARGET_USERNAME:-hz}"
TARGET_PASSWORD="${TARGET_PASSWORD:-$_default_passwd}"
TARGET_LOCALE="${TARGET_LOCALE:-en_US.UTF-8}"
TARGET_SSH_KEYS=(
	"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDxjcUOlmgsabCmeYD8MHnsVxueebIocv5AfG3mpmxA3UZu6GZqnp65ipbWL9oGtZK3BY+WytnbTDMYdVQWmYvlvuU6+HbOoQf/3z3rywkerbNQdffm5o9Yv/re6dlMG5kE4j78cXFcR11xAJvJ3vmM9tGSBBu68DR35KWz2iRUV8l7XV6E+XmkPkqJKr3IvrxdhM0KpCZixuz8z9krNue6NdpyELT/mvD5sL9LG4+XtU0ss7xH1jk5nmAQGaJW9IY8CVGy07awf0Du5CEfepmOH5gJbGwpAIIubAzGarefbltXteerB0bhyyC3VX0Q8lIHZ6GhMZSqfD9vBHRnDLIL"
)
TARGET_PKGS=(
	# net-tools
	# lsof
	curl
	wget
	# whois
)
TARGET_TIMEZONE=Asia/Chongqing
```

`_default_passwd` 你可以自行生成：

```bash
$ mkpasswd -m sha-512
```

或者干脆写作这样：

```bash
_default_passwd="$(mkpasswd -m sha-512 'password')"
```



`TARGET_SSH_KEYS` 可以给出一个数组，自行调整。

`TARGET_PKGS` 可以调整，但不建议。有了 curl 和 wget 之后，在 boot.sh 中你可以进一步地、更好地进行安装后处理，而不必在系统安装过程中去做。因为 Ubuntu 安装流程的原因，安装过程中软件源的镜像指定有可能不能完全生效，所以在安装过程中不宜安装太多软件包，留待首次启动后再进行操作时软件源就不会有问题了。

> 我们提供的更完整的 boot.sh 中包含了自动登录控制台，免密 sudo 等实用功能，此外 `TARGET_SSH_KEYS` 提供了远程 SSH 登录的能力，因此 `_default_passwd` 随意指定都可以，基本上你没有亲自用到它的可能，所以预设一个超级复杂（但超级难记忆）的密码有利于服务器安全。



##### 背景：cloud-init 和 autoinstall

user-data 是 cloud-init 规范的一部分，但 cloud-init 和 autoinstall 是一家生的，在 Ubuntu 语境内可以互换使用。

注意我们采用了 yaml 配置结构。如果你想，还可以使用 user-data script 等等其它格式。



##### heredoc 中展开数组

注意利用 bash 变量展开语法，我们编写了一段嵌入式脚本，用于展开 TARGET_SSH_KEYS 这个数组：

```yaml
			  ssh:
			    allow-pw: no
			    install-server: true
			    authorized-keys: [$(n=1 && for arg in "${TARGET_SSH_KEYS[@]}"; do
				# arg=\"$arg\"
				[ $n -gt 1 ] && echo -n ", "
				echo -n "\"$arg\""
				let n++
			done)]
```

展开后的效果示意如下：

```yaml
			  ssh:
			    allow-pw: no
			    install-server: true
			    authorized-keys: ["ssh-rsa dskldl", "ssh-rsa djskld"]
```

类似的做法在 packages 部分也有用到。





#### 小结

全部脚本准备完成，跑它！

不出意外（当然不会有），那么现在 pxe-server 已经就绪了。就等着你开新机做试验了。



### 试验效果

现在新建主机节点只要处于 pxe-server 网段中，就能通过网卡的 pxe 搜索自动完成安装。

新主机上电并获得 DHCP+BOOTP 启动参数后，运行 pxelinux.0 和自动执行 GRUB 菜单项时（图中处于 inittd 和 vmlinuz 运行状态）：

![image-20220101205844882](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220101205844882.png)

已经进入到无人值守系统安装流程的状态如下图：

![image-20220101205558999](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20220101205558999.png)

我们没有解决的问题是：

- 支持多种系统，多种硬件配置
- 支持云设施构架的可编程管理与维护
- 运用 meta-data 元数据集
- 等等

这些问题不是本文应该完成的内容。

*部分内容今后可能会另文轻量探讨*。



### 编写后安装脚本

我们已经提供了一份所谓的更完整的 boot.sh 后安装脚本，它完成了一台工作节点必须的基本环境准备，这些环境配置是为了运维人员能够在节点中的工作更快乐，你可以自己编写以适应你们的网络架构。

关于后安装脚本的解说，*也许下一次再做讨论吧*，本文篇幅够长了。





## bash.sh

请参考 [bash.sh](https://github.com/hedzr/bash.sh)，这是一个单独的文件，它可以被用作手工编写 bash 脚本的基本骨架。

运用它的方法最佳的范例恰如本文中的 vms-builder 脚本。

bash.sh 提供了一组基础检测函数，可以帮助你编写具备通用性的脚本。vms-builder 还额外提供了包管理操作的简要包装，以便能够跨平台应用。

> 本打算介绍一下 bash.sh 本身，以帮助你理解本文中给出的代码，但是发现篇幅已经很长了，我又对《万字长文》们很不以为然，那就算了，今后再说吧，等不及的就自己去看源代码得了。

## Tarball

本文提及的代码，例如 vms-builder，以及其它必要的文件，以及参考用的文件夹结构等等，均可在 [repo](https://github.com/hedzr/pxe-server-and-focal) 中找到，欢迎取用。



## 后记

应该一提的是，VMWare 提供专门的 Data Source 可以向 cloud-init 提供数据源服务，从这个角度来说，本文实际上不必那么麻烦——但那要 VMWare vSphere 这样的企业级平台才行。

这种数据源供给机制，已经为各大云服务商所支持，所以 cloud-init 是事实上的云服务基础设施准备标准。

这大概是 Canonical 少有的造的令所有人喜闻乐见的轮子了吧。

## 参考

- [Preboot Execution Environment - Wikipedia](https://en.wikipedia.org/wiki/Preboot_Execution_Environment) 
- [PXE specification](https://web.archive.org/web/20110524083740/http://download.intel.com/design/archives/wfm/downloads/pxespec.pdf) – The Preboot Execution Environment specification v2.1 published by Intel & SystemSoft
- [BIS specification](https://web.archive.org/web/20091117070518/http://download.intel.com/design/archives/wfm/downloads/bisspec.pdf) – The Boot Integrity Services specification v1.0 published by Intel
- [Intel Preboot Execution Environment](http://tools.ietf.org/html/draft-henry-remote-boot-protocol-00) – Internet-Draft 00 of the PXE Client/Server Protocol included in the PXE specification
- [PXE error codes](https://web.archive.org/web/20140221222847/http://h18013.www1.hp.com/products/servers/management/rdp/knowledgebase/00000138.html) – A catalogue of PXE error codes
- [Automated server install -- schema - Ubuntu](https://ubuntu.com/server/docs/install/autoinstall-schema) 
- [Automated server install reference - Ubuntu](https://ubuntu.com/server/docs/install/autoinstall-reference) 
- [cloud-init Documentation — cloud-init 21.4 documentation](https://cloudinit.readthedocs.io/en/latest/) 
- [cloud-init.io](https://cloud-init.io/) 
- [hedzr/bash.sh: main entry template of your first bash script file](https://github.com/hedzr/bash.sh) 





🔚