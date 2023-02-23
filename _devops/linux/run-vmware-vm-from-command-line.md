---
layout: single
title: vmware_run - 更方便地从命令行启动 vmware 虚拟机
date: 2023-01-08 10:51:00 +0800
last_modified_at: 2023-01-18 14:13:00 +0800
Author: hedzr
tags: [linux, ubuntu, bash, vm, devops]
categories: devops linux
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@latest/uPic/image-20230223182822880.png
  overlay_image: /assets/images/ubuntuhero.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
excerpt: "工具脚本 AGAIN ..."
---

## 缘起

说起来呢，这些脚本我自己就已经用了很久了，只是这两天从封锁、适应、到收拾心情继续码字呢，需要一个过渡期。

所以就先放它们出来了。

而实际上关于运维和 DevOps 这一块来说，诸如用 Ansible 或者在 [bash.sh](https://github.com/hedzr/bash.sh) 之上建立的 `ops.sh` 呢，暂时还没精力整理出来，还要等等。毕竟我主业还是 C++ 和 Golang，而不是每天监视服务器。

好接续上一篇 [vagrant_run - 更方便地从命令行启动 vagrant 虚拟机](https://hedzr.com/devops/linux/run-virtualbox-vm-from-command-line/) ，这次是 vmware_run，面对的是 VMware Fusion，但应该可以适用于 VMware Workstation。

## vmware_run

Vmware_run 不再使用 Hash 文件夹了。因为当年做这个脚本时我对 Hash 文件夹其实根本没认识。另外呢，vmrun（VMware Fusion 自带的工具）提供的能力是面对它的专属格式的 vmwareram 文件夹（Apple Package）的，所以需不着我重命名或者建立特别的助记名来帮助定位，更无需像 vagrant 那样一定要转到目标文件夹才能发出命令。

所以相对而言究其策略反而很简单。

我们首先需要约定所有的虚拟机一律做到 `~/Downloads/VMs/vmware` 之下。实际上整个 Downloads 文件夹默认是被我排除在 Time Machine 以及 Spotlight 之外的，这样来说频繁变化的内容、可能并不真的有价值的内容，以及根本不应该备份的就好像虚拟机及其磁盘镜像这些，就没必要被TM或者被索引了，那样没什么意义，徒耗资源。

下面就说说我的思路。

### 发现 vmrun

首先是找到了 VMware 自带的命令行工具 vmrun，这个呢去 VMware Fusion.app 的文件夹里面扫视一遍就能找得到，再不行就是通过 Google “start stop vmware from command-line” 也最终能够找到源头。

```bash
which vmrun >/dev/null 2>&1 || ln -s "/Applications/VMware Fusion.app/Contents/Library/vmrun" /usr/local/bin/vmrun
```

所以我们会将这个工具符号连接出来，以后我们就可以直接发出命令 vmrun 而不是去 Fusion.app 的子目录中调用了。

检测 PATH 搜索路径中有没有 vmrun，我这里用到的是 which，这个方法很简单粗暴。但是实际上在 bash 中检测一个命令是不是可用是有标准方案的：

```bash
if command -v vmrun; then
  echo vmrun exists
else
  echo vmrun cannot be found
fi
```

`command -v <a command>` 不但更标准，而且是 POSIX 兼容的。这话的意思是你可以将这个测试用在 Ubuntu，ArchLinux 等的 bash，zsh 等不同的场所。

如果不高兴，你也可以使用 hash 或者 type（type 不适合于 Windows，本文讲述的也都是 Unix-Like）：

```bash
❯ hash vmrun && echo Y || echo N
Y
❯ type vmrun && echo Y || echo N
vmrun is '/Applications/VMware Fusion.app/Contents/Public/vmrun'
Y
```

哦，type 说的目标怎么和前文设定的目标不一样呢？

因为这也是一个符号链接：

```bash
❯ ll /Applications/VMware\ Fusion.app/Contents/Public/vmrun
lrw-r--r--  1 root  wheel  16 Nov 16 23:50 /Applications/VMware Fusion.app/Contents/Public/vmrun -> ../Library/vmrun
```

#### 检测一个 command 的可用性

1. `command -v <command>`
2. `type <command>`
3. `hash <command>`
4. `which <command>`
5. `(( $+commands[foobar] ))` - *zsh only*

在必要时，你需要禁止标准输出和错误输出以免这些测试的 outputs 污染你的脚本流程：

```bash
type vmrun 1>/dev/null 2>&1
```

不过这是可选的。



### 启动一个虚拟机

vmrun 自己给出的范例是：

```bash
vmrun -T ws start "c:\my VMs\myVM.vmx"
```

我们需要变形一下，首先 -T 应该后接 `fusion` 而不是 `ws`，`ws` 适用于 VMware Workstation 环境。其次，.vmx 文件是在 一个 vmwarevm Package Folder 之中的。例如我们有一个 `~/Downloads/VMs/vmware/u20s.local.vmwarevm` 的虚拟机包文件，那么通常情况下 vmx 文件就是 `~/Downloads/VMs/vmware/u20s.local.vmwarevm/u20s.local.vmx`。

所以我们可以这样启动 `u20s.local` 虚拟机：

```bash
vmrun -T fusion start "~/Downloads/VMs/vmware/u20s.local.vmwarevm/u20s.local.vmx"
```

#### 无界面启动

另一个问题是 headless 启动一个虚拟机，不要弹出虚拟机窗口。这个要求可以用追加参数 nogui 来实现：

```bash
vmrun -T fusion start "~/Downloads/VMs/vmware/u20s.local.vmwarevm/u20s.local.vmx" nogui
```



### 停止一个虚拟机

参考前文，除了将 `start` 换为 `stop` 之外，其他没有改动。

### 检测重复启停

vmrun list 能够列出当前已经运行的虚拟机。所以我们只需要检测我们的虚拟机名字是不是存在就可以了：

```bash
❯ vmrun list
Total running VMs: 1
~/Downloads/VMs/vmware/u20s.local.vmwarevm/u20s.local.vmx

❯ vmrun list|grep 'u20s.local.vmx' && echo Y || echo N
~/Downloads/VMs/vmware/u20s.local.vmwarevm/u20s.local.vmx
Y
```



### 完整的脚本定义

于是我们就可以整合上面的知识，形成一个完整的 vmware_run 命令了。

Bash Script 的有些细节往往能够颠覆 C++ 开发者的思维惯性。比如说在 Bash 脚本开发中，function 是不必写 function 的：

```bash
function real-world(){
  echo This is a real world!
}

real-world(){
  echo This is a real world!
}
```

上面两个函数都是正确的写法。

多数情况下，我不写 function 关键字。但是如果你在一个巨型 shell script 团队中协作的话，注意如下亮点：

1. 总是写 function 关键字
2. 不要使用短横线作为函数名的一部分

如果是为了让你的函数更具备通用性和可移植性，那么短横线不要使用，改用下划线以代替之。尽管这一点我很不喜欢，但是在例如 zsh 中，函数名中的短横线将会带来问题，而在 fish 中就根本不允许短横线参与到名字之中。

如果要指出 Shell script 中反常识的地方，最 topest 的应该是嵌套函数，就是说一个函数的实体可以被写在另一个之中。

```bash
vmware_run() {
	local VMDIR="${VMWARE_DIR:-$HOME/Downloads/VMs/vmware}"
	local VMTYPE="${VMWARE_TYPE:-fusion}" # or "ws"
	# local VMDIR="$HOME/Documents/Virtual Machines.localized"
	which vmrun >/dev/null 2>&1 || ln -s "/Applications/VMware Fusion.app/Contents/Library/vmrun" /usr/local/bin/vmrun

	vmware_run_usage() {
		cat <<-EOF
			Usage:
				$(basename $0) <VM-name> <start|up|stop|halt|suspend|reset|pause|unpause>
				$(basename $0) <VM-name> <start_with_gui|start-with-gui>

			Examples:
				$(basename $0) u20.local start
				# start vm without gui (headless mode)

		EOF
	}
	vmware_run_start() {
		local cmd=$1
		local vmname=$2
		shift
		shift
		vmrun list | grep -q "$vmname" && {
			echo "VM '$vmname' already running"
		} || {
			[ "$cmd" != "start" ] && cmd=start
			echo "vmrun -T $VMTYPE $cmd $VMDIR/$vmname.vmwarevm/$vmname.vmx" "$@"
			vmrun -T $VMTYPE $cmd $VMDIR/$vmname.vmwarevm/$vmname.vmx "$@"
		}
	}
	vmware_run_stop() {
		local cmd=$1
		local vmname=$2
		vmrun list | grep -q "$vmname" || {
			echo "VM '$vmname' not running"
		} && {
			[ "$cmd" != "stop" ] && cmd=stop
			vmrun -T $VMTYPE $cmd $VMDIR/$vmname.vmwarevm/$vmname.vmx
		}
	}

	case ${2:-start} in
	start | start-without-gui | up)
		local cmd=${2:-start} && local vmn=$1
		(($#)) && shift
		(($#)) && shift
		dbg "vmn=$wmn" &&
			vmware_run_start $cmd $vmn nogui "$@"
		;;
	start_with_gui | start-with-gui | unpause)
		local cmd=$2 && local vmn=$1
		(($#)) && shift
		(($#)) && shift
		vmware_run_start start $vmn "$@"
		;;
	stop | suspend | reset | pause | halt)
		local cmd=$2 && local vmn=$1
		(($#)) && shift
		(($#)) && shift
		vmware_run_stop $cmd $vmn "$@"
		;;
	usage | help | -h | -H | --help)
		vmware_run_usage
		;;
	*)
		case $1 in
		usage | help | -h | -H | --help)
			vmware_run_usage
			;;

		*)
			vmrun "$@"
			;;
		esac
		;;
	esac
}

```

同样地，够用就好，所以这个大大的脚本并不够精细，少数地方可堪斟酌。但通常情况下它完全足够了。



### 使用

使用 vmware_run 的方法是比较明显的，上面的脚本不困难：

```bash
vmware_run u20s.local
vmware_run k8s.local start
vmware_run k8s.local stop
vmware_run kubuntu.local start-with-gui
```

可以定制环境变量：

```bash
VMWARE_DIR="/Users/Shared/Virtual Hosts" vmware_run u20s.local
```





### Gist

这个大大的脚本并不是太大，所以还是放在 gist 了：

- <https://gist.github.com/hedzr/956cb892069b0353f915b395a9504ebf>

请自行按需取用吧。





### 小结

暂时写这么多。