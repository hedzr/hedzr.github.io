---
layout: single
title: vm - 更方便地从命令行启动虚拟机
date: 2023-01-18 15:00:00 +0800
last_modified_at: 2023-01-19 14:13:00 +0800
Author: hedzr
tags: [linux, ubuntu, bash, vm, devops]
categories: devops linux
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@latest/uPic/image-20230223182822880.png
  overlay_image: /assets/images/ubuntuhero.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
excerpt: "工具脚本 AGAIN AGAIN 以及 lazyloader ..."
---

## 缘起

接续上上一篇 [vagrant_run - 更方便地从命令行启动 vagrant 虚拟机](https://hedzr.com/devops/linux/run-virtualbox-vm-from-command-line/) 以及  [vmware_run - 更方便地从命令行启动 vmware 虚拟机](https://hedzr.com/devops/linux/run-vmware-vm-from-command-line/) ，再来一次吧，这次准备综合一下，进一步提升易用性，所以打算制造一个 vm 命令。

这样，也就算是成为一个小小系列：

1. [vagrant_run - 更方便地从命令行启动 vagrant 虚拟机](https://hedzr.com/devops/linux/run-virtualbox-vm-from-command-line/)
2. [vmware_run - 更方便地从命令行启动 vmware 虚拟机](https://hedzr.com/devops/linux/run-vmware-vm-from-command-line/)
3. vm - 从命令行管理虚拟机



## `vm` & `vm.sh`

既然我的总的目的总是为了简便，那么 `vmware_run xxx` 有了下划线那就终究是不符合我的审美观的。

为什么一个真正的 Shell Scripter 应该讨厌下划线呢？Cheap，下划线需要组合键输入啊。哪有减号来的撇脱呢。



### 理想的使用方案

所以在有了 vagrant_run 和 vmware_run 之后，我反思了一遍，发觉其实便利度还不够。那我就反其道而思之，似乎理想的方式应该差不多是这样子：

#### 列出已经运行的 VMs，以及全部的

```bash
❯ vm list
VMs in virtualbox (* running):

  "armcxxbuilder_arm-cxx_1672653341445_34553" {447f620c-20d6-465d-b6f6-940b15b7cf1d}
  "opssh_ops-sh_1673305664051_23747" {ca24e1d1-20cc-4dcb-bd26-edb7377ef016}
  "ubuntu20test" {546dd35c-0ef7-4414-b06c-6e0067afb394}

VMs in hash folder (for vagant vhosts):

  vhost.arm-cxx=~/work/ops.work/armcxxbuilder
  vhost.hello=~/work/cc.work/hello/hello-1-cxx
  vhost.ops-sh=~/work/ops.work/ops.sh-dev/ops.sh
  vhost.ub20a=~/work/ops.work/ub20a.local

  To manage the short names (hash folder names) of your
  vagrant hosts, modify the $HOME/.vagrant.hosts with
  any text editor.

The Running VMware VMs:

  Total running VMs: 1
  ~/Downloads/VMs/vmware/u20s.local.vmwarevm/u20s.local.vmx

```

#### 可以衡量虚拟机的磁盘占用情况

```bash
❯ vm size arm-cxx
Calculating the folder size of  ~/work/ops.work/armcxxbuilder  ...
 16M	~/work/ops.work/armcxxbuilder
4.8G	~/Downloads/VMs/virtualbox/armcxxbuilder_arm-cxx_1672653341445_34553

❯ vm sizes

The VirtualBox VMs:

  4.8G	~/Downloads/VMs/virtualbox/armcxxbuilder_arm-cxx_1672653341445_34553
  4.7G	~/Downloads/VMs/virtualbox/ubuntu20test
  2.2G	~/Downloads/VMs/virtualbox/opssh_ops-sh_1673305664051_23747

The VMware VMs:

  22G	~/Downloads/VMs/vmware/win22dc.vmwarevm
  5.4G	~/Downloads/VMs/vmware/u20s.local.vmwarevm

The VirtualBox BOXes:

  6.4G	~/.vagrant.d/boxes/StefanScherer-VAGRANTSLASH-windows_2022_docker
  1.0G	~/.vagrant.d/boxes/debian-VAGRANTSLASH-buster64
  786M	~/.vagrant.d/boxes/hedzr-VAGRANTSLASH-ubuntu-20-ops-sh
  656M	~/.vagrant.d/boxes/ubuntu-VAGRANTSLASH-lunar64
  645M	~/.vagrant.d/boxes/test-VAGRANTSLASH-focal64
  605M	~/.vagrant.d/boxes/ubuntu-VAGRANTSLASH-jammy64
  543M	~/.vagrant.d/boxes/ubuntu-VAGRANTSLASH-focal64
  456M	~/.vagrant.d/boxes/centos-VAGRANTSLASH-7

The Podman vmdisk:

  2.3G	~/.local/share/containers/podman
  4.0K	~/.local/share/containers/podman-desktop

The Podman VM configs:

  20K	~/.config/containers/podman
  4.0K	~/.config/containers/containers.conf
  4.0K	~/.config/containers/auth.json

The Docker Desktop vmdisk:
  9.3G	~/Library/Containers/com.docker.docker/Data/vms

```

#### 启停虚拟机

理所当然地，`vm` 必须能够启停虚拟机：

```bash
❯ vm run ops-sh halt    # = stop,
❯ vm run ops-sh up      # = start
❯ vm run ops-sh         # = up
❯ vm run ops-sh destroy # vagrant VM only
```

为什么不进一步缩短它，改为 `vm u20s.local up` 呢？主要还是因为懒做优化了。

> 后来，我还是做了。
>
> 但是就不放出来了，不如留给你自己去做改造吧，因为这个活根本没有难度，只是有点琐碎，我就不再加多剧透了。

不得不特殊对待 vmware 虚拟机：

```bash
❯ vm vmware u20s.local halt    # = stop,
❯ vm vmware u20s.local up      # = start
❯ vm vmware u20s.local         # = up
❯ vm vmware u20s.local destroy # vagrant VM only
```

### 实现它

#### 背景

在 `vm` 中大量使用了 [`bash.sh`](https://github.com/hedzr/bash.sh) 所提供的工具函数，例如 headline，tip，err，strip_r, fn_name, commander 等等。

在我的电脑中，通过 `.zshrc` 我首先引入了 `bash.config` ，所以这些工具函数是就地可用的。但当你想要独立使用 vm.sh 的时候，就需要摘抄它们了。它们很容易被截取，所以这不会是个问题。

其次，通过一点点定制脚本，我在载入 `bash.config` 之后同时也预加载了少许的脚本以及提供了一个懒加载机制，于是像这里提到的 vm.sh 将会被自动载入，所以 `vm`  这个主命令是随时待命的，然后 vmware_run.sh 和 vagrant_run.sh 则视乎实际情况被自动 sourced in，其中的函数则会被自动调用。

#### `bash.sh` 提供的多级命令开发框架

通过 `commander` 这个工具函数，你可以轻易地建立多级命令结构。例如开发一个 dns 领导的命令结构体系：


```bash
dns() {
	dns_entry() { commander $(strip_r $(fn_name) _entry) "$@"; }
	dns_usage() {
		cat <<-EOF
			Usage: $0 $self <sub-command> [...]
			Sub-commands:
			  ls [--all|-a|--cname|--txt|--one|-1] [string]   list all/most-of-all/generics matched dns-records
			  dump                    [RESERVED] dump dns-records [just for dns01]
			  nsupdate                [DNS] [DYN] [MODIFY]
			  fix_nameservers         [ali] general fix nameservers, step 1
			  vpc_fix                 [ali] for VPC envir
			  profile                 [ali] make a query perf test and report
			  check                   [ali] check dns query is ok [version 1]
			  check_2                 [ali] check dns query is ok [version 2]
			  check_resolv_conf       [ali] check resolv.conf is right

			Examples:
			  $ ops dns ls          # just print the pyhsical ECS' A records
			  $ ops dns ls --all
			  $ ops dns ls --cname
			  $ ops dns ls --txt
			  $ ops dns ls sw0
			  $ ops dns nsupdate-add sw0ttt00 10.0.24.30
			  $ ops dns nsupdate-del sw0ttt00
			  $ ops dns nsupdate-add mongo cname mgo.ops.local
			  $ ops dns nsupdate-del mongo cname

		EOF
	}

	dns_check() {
		echo "dns check"
	}
	dns_check_2() {
		echo "dns check 2"
	}
	dns_ls() { :; }
	dns_dump() { echo dump dns; }
	dns_nsupdate() { :; }
	dns_ls() { :; }
	dns_vpc_fix() { :; }
	dns_profile() { :; }
	dns_check_resolv_conf() { :; }

	# sub of sub-commands
	#dns_fix()        { dns_entry "$@"; }
	dns_fix_entry() { commander $(strip_r $(fn_name) _entry) "$@"; }
	dns_fix_usage() {
		cat <<-EOF
			Usage: $0 $self <sub-command> [...]
			Sub-commands:
			  nameservers             [ali] general fix nameservers, step 1
			  resolv_conf             [ali] for VPC envir

			Examples:
			  $ ops dns fix nameservers
			  $ ops dns fix resolv_conf

		EOF
	}
	dns_fix_nameservers() { echo dns_fix_nameservers; }
	dns_fix_resolv_conf() { echo dns_fix_resolv_conf; }

	dns_entry "$@"
}
```

注意 `dns` 将参数转发给 dns_entry，而 `dns_entry` 通过 `commander` 来解释这些参数。`fn_name` 会取得当前函数名，`strip_r` 则从字符串右侧移除给定的后缀。所以 `dns_entry` 就等于调用了 `commander "dns" "$@"`，第一个参数 `"dns"` 给出的是所处的命令层级，当你发出 `dns ls` 这个命令行时，`commander` 最终会据此尝试将请求转发给 dns_ls 这个函数。

所以上面的脚本实际上代表了如下的用法：

```bash
dns ls
dns check
dns check_2
dns dump

# sub of sub-commands
dns fix nameservers
dns fix resolv_conf
dns fix_nameservers
```

`vm.sh` 完全采用上面这套框架机制。

#### list 指令

ls 和 list 指令查证 vmware 虚拟机的运行情况，以及 vagrant 管理的虚拟机情况。所用到的约定就是：

1. vmware 虚拟机被建立在 `~/Downloads/VMs/vmware` 之中
2. virtualbox 虚拟机被建立在 `~/Downloads/VMs/virtualbox` 之中
3. vagrant 虚拟机采用 virtualbox 引擎，且在 `~/.vagrant.hosts` 中登记为一个入口

> 这些约定能够在脚本源码中被调整，甚至也能够通过环境变量来实时改变。

所以 list 指令本身的实现如同这样：

```bash
	vm_list() { vm_ls; }
	vm_ls() {
		__vms_reg
		which VBoxManage >/dev/null && {
			headline "VMs in virtualbox (* running)"
			echo
			local line lines=$(VBoxManage list vms --sorted)
			local unprocessed=1 running=$(echo $(VBoxManage list runningvms | awk '{print $1}'))
			while read line; do
				if [ "$running" != "" ]; then
					if echo $line | grep -q "$running"; then
						printf '* %s\n' "$line" && unprocessed=0
					fi
				fi
				if ((unprocessed)); then
					printf '  %s\n' "$line"
				fi
			done <<<"$lines"
			echo
		}
		headline "VMs in hash folder (for vagant vhosts)"
		echo
		hash -d | grep -E 'vhost\.(.*)=' | sed -re "s#${HOME//\//\\/}#~#" | pad 2
		cat <<-"EOF"
			  
			  To manage the short names (hash folder names) of your 
			  vagrant hosts, modify the $HOME/.vagrant.hosts with 
			  any text editor.

		EOF
		which vmrun >/dev/null && {
			headline "The Running VMware VMs"
			echo
			vmrun list | pad 2 | sed -re "s,$HOME,~,"
		}
	}
```

其运行和展示的效果如前文。



#### size(s) 指令

我使用 sizes 指令来列举全部虚拟机，甚至也包括别的虚拟机（例如 Android Emulator 的 AVDs，Docker Desktop 的虚拟机磁盘等等）。

我也使用 `size <hash-folder-name>` 来具体列出某个 vagrant 虚拟机的磁盘占用情况。

这些磁盘情况我不得不时常关注，必要时就要删掉某个虚拟机，或者某些。因为磁盘空间真是尝尝都在不够，从没有宽松过。

size 和 sizes 被实现为同义词，它们的核心技术都是 `du -sh xxx | sort -rh` ，所以具体的实现代码就请移步 gist 处直接观察。

![image-20230223182822880](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@latest/uPic/image-20230223182822880.png)

#### run 指令以及 vmware 指令

这两个指令分别转发请求给 `vagrant_run.sh` 以及 `vmware_run.sh` 中提供的函数入口 `vagrant_run()` 和 `vmware_run()` ，从而将所有功能整合为一体：

```bash
	vm_vmware() { tip "$@" && vmware_run "$@"; }
	vm_call() { vagrant_run "$@"; }
	vm_run() { vagrant_run "$@"; }
```

我们前面提到了 `vagrant_run.sh` 以及 `vmware_run.sh` 在我的 zsh 环境中是懒加载的，所以这里的实现代码本身非常简单，直接调用目标函数入口即可，别的杂务将有 lazyloader 负责处理。

> 此外，我们也提到为了躲懒采用了这两个转发命令入口，实际上还可以进一步优化以便缩短二级命令的使用。




### Gist

那么，总的来说 vm 这个命令就完整实现了。

所以这个脚本就放在 gist 供你取用。

- <https://gist.github.com/hedzr/ea2626fb290e5ca74687967d0d768cdb>

具体使用就需要少少的整合处理，因为我没有理由让自己的偏好环境侵入到他人的 zsh 之中，所以你就得自己组装一下了。





## 小结

暂时写这么多。

### 参考

- bash.sh - <https://github.com/hedzr/bash.sh>
- vm.sh - <https://gist.github.com/hedzr/ea2626fb290e5ca74687967d0d768cdb>
- vmware_run.sh - <https://gist.github.com/hedzr/956cb892069b0353f915b395a9504ebf>
- vagrant_run.sh - <https://gist.github.com/hedzr/a24592879ac90239be6c8b1746feebd4>



## Bonus

### lazy-loader

在 zsh 中实现懒加载功能，也就是说用到一个命令时才载入相应的脚本文件，这需要拦截 zsh 的 unkown command 处理函数。

具体来说，简单上我的代码 `lazy-loader.sh`：

```bash
# for zsh
lazy_loaded=()
function command_not_found_handler() {
	local f dir processed=0 cmd=$1 && shift
	for dir in $HOME/.local/bin $HOME/bin /opt/bin; do
		local dx="$dir/.zsh/lazy"
		dbg "dx: $dx"
		if [ -d $dx ]; then
			f="$dx/$cmd.sh"
			if not_in_array $f $kazy_loaded; then
				if [ -f "$f" ]; then
					source $f
					dbg "yes: $f"
					lazy_loaded+=($f)
					processed=1
					eval $cmd $@
				fi
			fi
		fi
	done
	if (($processed)); then
		return 0
	else
		err "COMMAND NOT FOUND: You tried to run '$cmd' with args '$@'"
		return 127
	fi
}
# for bash
command_not_found_handle() {
	command_not_found_handler "$@"
}
```

发现有函数没有放出到 bash.sh，那就如下：

```bash
not_in_array() {
	local find="$1"
	shift
	local arr=("$@")
	[[ ! ${arr[*]} =~ (^|[[:space:]])"$find"($|[[:space:]]) ]]
}
```

至于 `dbg`, `tip`, `err`, `debug`, `headline` 等等都是 echo 命令的变种，都可以在 `bash.sh` 中找到，就不再提了。

- <https://gist.github.com/hedzr/5c7bc141c14b075e2bed9175e4aac948>