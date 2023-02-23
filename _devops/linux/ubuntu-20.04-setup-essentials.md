---
layout: single
title: Ubuntu Server 安装提要
date: 2020-07-06 11:10:00 +0800
last_modified_at: 2020-11-27 12:38:00 +0800
Author: hedzr
tags: [linux, ubuntu, ubuntu 20.04, focal, focal fossa, devops]
categories: devops linux
comments: true
toc: true
header:
  overlay_image: /assets/images/ubuntuhero.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
#excerpt: "BASH 小技巧一小组 [...]"
#header:
#  overlay_image: /assets/images/unsplash-image-1.jpg
#  overlay_filter: rgba(0, 0, 0, 0.15)
#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---


> **摘要**：  
> 本文就 Ubuntu 20.04 LTS 服务器安装之后有必要首要完成的小任务做一个汇总。  
> 但也并非就做成了大全，那就要日积月累且正好有精力了。
<!--MORE-->



> 2023-01-06 Updated
>
> 追加了两个小节，分别是“增大启动屏”，“路由表”。



Ubuntu 已经（早已，2020-04-23）发布了 20.04 LTS 版本，代号为 Focal Fossa [^1]。

[^1]: <https://ubuntu.com/download/alternative-downloads>

随这个版本而来的是 **QEMU 4.2**， **libvirt 6.0**， **PHP 7.4**， **Ruby 2.7**， **GCC 9.3**， **Python 3.8**和 **NGINX 1.17** 等等更**新**的软件包，一个新的服务器安装文本界面（非常好用，但自动化安装的支持还很弱）。

但这个版本也有其问题，官方推荐的最低系统是 双核4GBRAM。这在云上未免会带来价格上的更审慎的评估。



### 提要

下面是新版服务器安装之后应该有必要被解决的例行操作的提要，并不是大全，只是今天刚好想到这些而已，姑且先成一篇再说吧。



#### 启用网卡

从 Ubuntu18.04 （Bionic）开始，他们使用了[netplan](https://netplan.io/) 作为网络配置工具。老实说，这个方案我喜欢的很，比起以前的方法来讲，现在的网卡特性配置、桥接、虚拟都简单得多了，以一种我的思维模式很顺畅的方式来做事情。

[^2]: [Examples - Netplan](https://netplan.io/examples) 
[^3]: [Netplan Official Site](https://netplan.io/)
[^4]: [Ubuntu Bionic: Netplan - Ubuntu](https://ubuntu.com/blog/ubuntu-bionic-netplan)



更多详细信息，请看：
- <https://netplan.io/examples> [^2]，
- Netplan 官网 [^3]，
- 以及 [Ubuntu Bionic: Netplan - Ubuntu](https://ubuntu.com/blog/ubuntu-bionic-netplan) [^4]。


netplan 的配置文件为 YAML 格式，放在 `/etc/netplan` 之中。

为了启用第二块网卡，我们可以这样配置：

```bash
root@u18svr:~# cat /etc/netplan/01-netcfg.yaml
# This file describes the network interfaces available on your system
# For more information, see netplan(5).
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:
      dhcp4: yes
    enp0s8:
      dhcp4: yes
      dhcp6: yes

root@u18svr:~# netplan apply
```

如果你使用了系统安装时的网络定制（for Ubuntu 20.04+）的话，相应的文件名可能会是 `/etc/netplan/00-installer-config.yaml`。无论如何，任何在 `/etc/netplan` 中的 yaml 文件都是相关配置的一部分，你需要对该文件自行探索后找到正确的编辑位置。



##### enp0s8 是什么鬼？

这种编目方式，来自于 systemd 的所谓 [Predictable Network Interface naming](http://www.freedesktop.org/wiki/Software/systemd/PredictableNetworkInterfaceNames/)，大概从 Ubuntu 15.04 开始启用并代替了旧的 eth0 命名方式[^5]。

[^5]:  [networking - Why is my network interface named enp0s25 instead of eth0? - Ask Ubuntu](https://askubuntu.com/questions/704361/why-is-my-network-interface-named-enp0s25-instead-of-eth0) 



##### 如何找到我的网卡的名字？

用 `ip a` 可以看，例如：

```bash
hz@u18svr:~$ ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 08:00:27:c6:9c:d9 brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic enp0s3
       valid_lft 75444sec preferred_lft 75444sec
    inet6 fe80::a00:27ff:fec6:9cd9/64 scope link
       valid_lft forever preferred_lft forever
3: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 08:00:27:5f:d2:d7 brd ff:ff:ff:ff:ff:ff
    inet 192.168.0.18/24 brd 192.168.0.255 scope global dynamic enp0s8
       valid_lft 161846sec preferred_lft 161846sec
    inet6 fe80::a00:27ff:fe5f:d2d7/64 scope link
       valid_lft forever preferred_lft forever
```



##### 设置静态 IP

有时候你可能想要设置使用静态 IP 地址，尤其当是服务器的时候。

如果你处于云环境，那么在自动化安装时刻 **cloud-init** 可能已经为你的主机提供了 DHCP 配置。因此我们需要确定该机制已经被禁用了：

```bash
$ cat /etc/cloud/cloud.cfg.d/subiquity-disable-cloudinit-networking.cfg
network: {config: disabled}
```

如果显示内容不同于 `network: {config: disabled}`，请修改该文件保证 network 这个 entry 的值为 disabled。如果没有名为 network 的 entry，添加它。

现在去编辑 `/etc/netplan/00-installer-config.yaml` 文件。它的内容可能是这样的：

```yaml
network:
  ethernets:
    ens33:
      dhcp4: true
  version: 2
```

为了使用静态 IP，我们可以将其修改为：

```yaml
network:
  ethernets:
    ens33:
      addresses: [172.16.151.133/24]
      gateway4: 172.16.151.1
      nameservers:
        addresses: [4.2.2.2, 8.8.8.8]
  version: 2
```

然后重启服务器即可。

如果你想立即应用，可以使用命令行：

```bash
sudo netplan apply
```

但为了避免潜在的问题，重启是较为安全的措施，它能解决某些不更新的双端缓存，例如 netbios 名字，smaba 连接，某些在线注册表等。





#### 启用免密 sudo



一般来说，出于管理目的，我们可能会为 Linux 账户增加用户组所属关系：

```bash
sudo usermod -aG staff,sambashare hz
# for Ubuntu 20.04, this following line might be better
sudo usermod -aG staff,sambashare,systemd-journal,systemd-timesync hz
#systemd-network
#systemd-resolve
# 如果你没有安装 samba 服务，考虑安装它(如有必要)：sudo apt install samba
```

为了令指定用户能够无需密码即可sudo操作，我们可以建立一个 power 用户组：

```bash
root@u18svr:~# sudo groupadd -g 201 power
```

然后将想要授信的用户加入到这个组中：

```bash
root@u18svr:~# sudo usermod -aG power hz
```

接下来，我们将整个power组的sudoer特性进行提权：

```bash
echo "%power   ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/power
sudo chmod 440 /etc/sudoers.d/power
```



如果你只是想针对单一账户进行授信，可以使用 visudo 直接编辑 `/etc/sudoers` 文件，考虑在其中追加如下的行：

```bash
$hz    ALL=(ALL) NOPASSWD: ALL
```

`sudo visudo` 在存盘时也会验证你添加的行会不会语法错误。

> 错误的 `/etc/sudoers` 文件将会导致你无法sudo，这往往也会导致你无法再操控的系统。





#### 控制台自动登录

为了安全的原因，服务器不应该启用某个账户自动登录控制台的功能。这可能意味着非法用户可以在机房借用键盘显示器直接操作该服务器而无需任何验证。

但对于你或你的组织所私有控制的云服务器组（私有云、私有高安全级的VPC网络等）来说，也许控制台自动登录功能有时候是你最后的机会，以便直接进入某失控服务器中查证来源等等。

总而言之，是否该使用控制台自动登录功能是由目的和环境决定的。



[^30]: <https://askubuntu.com/questions/819117/how-can-i-get-autologin-at-startup-working-on-ubuntu-server-16-04-1>

为了启用控制台自动登录功能，可以这样[^30]：

```
sudo systemctl edit getty@tty1.service
```

这条命令将会建立一个临时文件 （[drop-in](https://www.freedesktop.org/software/systemd/man/systemd.unit.html) file）并在编辑器（例如 nano，vim）中打开它。你需要在编辑器中书写下面的内容，同时记得将 myusername 替换为你想要令其自动登录的 Linux 账户名：

```
[Service]
ExecStart=
ExecStart=-/sbin/agetty --noissue --autologin myusername %I $TERM
Type=idle
```

存盘退出，背后将会发生这些事情：

- 一个文件夹 `/etc/systemd/system/getty@tty1.service.d` 将会被建立
- 一个文件 `/etc/systemd/system/getty@tty1.service.d/override.conf` 将会被建立

这样一来，一个专属于 getty 账户的系统服务将会在开机时起到作用并完成自动登录控制台的功能。重启您的服务器即可验证到这一点。



#### 重启、关闭服务器

```bash
sudo reboot
sudo poweroff -pf
sudo shutdown -hf now
```

如果你在使用终端远程SSH，poweroff命令就应该慎用，这倒不是因为远程服务器开机很麻烦，而是因为poweroff之后，你的终端tty将被挂起，不能做任何操作，除了关闭终端窗口之外。所以一般我们还是用shutdown来干这活，那将会让终端tty中的远程会话被打断，回到你的本地会话中来，你开可以继续连接别的服务器等等。

当然，关闭服务器要慎用——除非你有远程开机的控制面板。



#### 增大启动屏

如果你使用 virtualbox 这样的虚拟机环境，那么当 ubuntu 启动时也许你想要看到更大的屏幕，这样启动过程中的进度文字可以更容易被观察。

Ubuntu 服务器启动时通常默认采用 800x600 的屏幕尺寸，这个尺寸对于飞速卷滚的文字来说有点不那么友好。

通常而言，为了增大该尺寸，你需要调整的是 grub2 的配置。

首先你需要编辑 `/etc/default/grub` 并追加如下的设置内容：

```bash
# GRUB_GFXMODE=1280x1024  # width x height required - see below
GRUB_GFXMODE=1152x864
GRUB_CMDLINE_LINUX_DEFAULT="nomodeset"
GRUB_GFXPAYLOAD_LINUX=keep
```

然后编译该配置令其在下次启动时生效：

```bash
sudo update-grub
sudo reboot
```

这样，下次启动时屏幕的分辨率将采用新设定的值。

> 还可以同时设定色深：
>
> ```bash
> GRUB_GFXMODE=1024x768x32
> ```
>
> 不过通常这就没什么用了。



#### 增加小工具

在你的 `.bashrc` 或 `.profile` 中增加小工具，有利于日常工作。

你也可以考虑采用其他的工具集合，或者基于 [bash.sh](https://github.com/hedzr/bash.sh) [^51] 自己开发。

[^51]: <https://github.com/hedzr/bash.sh>

ports

```bash
function ports () {
	if [ $# -eq 0 ]; then
		sudo lsof -Pni | grep -P "LISTEN|UDP"
	else
		local p='' i
		for i in "$@"; do
			if [[ "$i" -gt 0 ]]; then
				p="$p -i :$i"
			else
				p="$p -i $i"
			fi
		done
		# DEBUG echo "lsof -Pn $p"
		sudo lsof -Pn $p
	fi
}

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
  PATH="$HOME/bin:$PATH"
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/.local/bin" ] ; then
  PATH="$HOME/.local/bin:$PATH"
fi
```

也可以考虑建立 bin 目录：

```bash
mkdir -p $HOME/bin $HOME/.local/bin
```

并且授信 `/usr/local/bin` 目录：

```bash
sudo chown -R $USER /usr/local/bin
# 或者授予 power 分组
sudo chown -R $USER:power /usr/local/bin && sudo chmod -R g+w /usr/local/bin
```





#### 服务器初装之后，哪些软件是例行要安装的？

这个问题很个性化，不过，由于多数工作不可避免，所以下面的案例给出了一种选择，你可以按需取用：

```bash
sudo apt install -y mc curl wget git build-essential cmake glances byobu jq htop lsof ccze net-tools dnsutils # for dig

sudo apt install ssh samba # 基础服务，确保系统初装后能够被远程配置
```



#### 要不要配上 zsh？

服务器上要不要安装 zsh，oh-my-ssh？

我个人的看法是不要。

对于服务器运维来说，自己称手的工具集比较重要。干了很多事却没什么实质性帮助，只是界面更美观了，通常来说不是首选。此外，很多时候zsh的反应太慢了，这一点经历过网络卡顿的朋友才会有同感，紧急任务时每一毫秒都在念叨着快、快、快，恐怕还是只有原配的 bash 来的更贴心。

当然，像 z/autojump 等工具是很好用的，幸好 bash 中一样有它们，即使没有我们立即造一个也费不了多少事，z 这样的工具实际上念头改变一切，实现上却极为简单，只是一个带计数器的目录路径的列表，awk和grep就足以还原其特点了。



#### SSH 应该修改端口号吗？

很多所谓的运维材料会告诉你，如果你的服务器在公网，建议修改默认的SSH端口，可以降低自动攻击的风险，从而增加系统安全性。

这话，其实纯粹是想当然耳。

在公网上，扫描一台设备的典型端口，是常规性操作，对于手里持有大量肉鸡的人来说，使用多代理方式扫描一个网段所有地址的所有端口，看似昂贵，实际上如果精通 TCP/IP 协议的话，非常便宜。对于有充分渗透能力的人来说，OpenSSH 软件上的漏洞被利用的可能性实在是太低了，低到扫出了 22 端口他们也不会以此为突破点——除非，你还在用 Ubuntu 8、9 之类，那么有几个著名的 OpenSSH 问题可以被利用。

被扫到 SSH 口后爆破？你更应该做的是配置 Linux 账户安全策略，拒绝用户采用弱口令的可能性，而且强制他们定期修改登录密码（比如每个月）。

所以说，修改了 SSH 端口号，彷佛降低了风险，其实毫无帮助，反而对运维人员自身的各种工作带来不便，因为你需要额外的语法才能重用大量的运维脚本。其所带来的好处仅仅是低端人员扫描不到你的服务器的 SSH 端口，老实说，在今天很少有人会为了渗透而选择 SSH 入口的，大量的 XSS、CSP、XXE 或者 CTF 它们不香吗，犯得着和 OpenSSH 去较劲吗？

所以，为了你的各种脚本、登录、转发、Ansible 等等的便利，还是从了默认 22 口的好。





### 附加知识



#### 路由表 route table

##### 显示路由表

```bash
ip route
ip route show  # 同义词
ip route list
```

例如

```bash
$ ip route
default via 192.168.56.1 dev enp0s8 proto static
default via 10.0.2.2 dev enp0s3 metric 100
10.0.2.0/24 dev enp0s3 proto kernel scope link src 10.0.2.15
10.0.2.2 dev enp0s3 proto dhcp scope link src 10.0.2.15 metric 100
192.168.56.0/24 dev enp0s8 proto kernel scope link src 192.168.56.41
```

如果有多块网卡，那就会有多条 default 路由，分别指示相应的 gateway 地址。



##### 增加一条路由

通常当你想要增加一个新的网关 gateway 地址时，

```bash
sudo ip route add default via 192.168.56.1
```

此时一般无需明示网卡，它会被自动关联，除非你使用一个奇怪的网段。



##### 调整已存在的路由

如果多条路由带有不同的 metric，那么可以修改 metric 的方式来调整路由的优先级：

```bash
sudo ip route replace default via 192.168.56.1 metric 100
```

如果某条路由根本没有 metric，那么它指定了系统的首选网关。此时你需要新增/替换次要网关为无 metric 的条目。例如对于

```
default via 192.168.56.1 dev enp0s8 proto static
default via 10.0.2.2 dev enp0s3 metric 100
```

可以这样提权 10.0.2.2 网关为系统首选：

```bash
sudo ip route replace default via 10.0.2.2
sudo ip route replace default via 192.168.56.1 metric 100
```

##### 删除一条路由

```bash
sudo ip route delete default via 192.168.56.1
```

##### 小小结

路由表有时候显得很神秘，而且搞错之后可能是灾难性的（如果你正在远程登入服务器……）。

然而它又是简单的，系统按照从上到下的顺序查看路由表中的每一条目，如果条目达到要求、符合要求、被命中，那么系统就通过该条目的指示完成网络包的发送。

当你在 netplan 中管理、调整了多块网卡的设定之后，往往需要验证、证明一下路由表是恰当的。











### 小结

暂时写这么多。