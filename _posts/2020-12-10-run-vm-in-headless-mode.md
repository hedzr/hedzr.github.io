---
layout: single
title: 无窗口方式运行VM
date: 2020-12-10 08:00:00 +0800
last_modified_at: 2020-11-29 10:23:00 +0800
Author: hedzr
tags: [shell, bash, devops, vmware, VMWare Fusion, VM, headless, nogui]
categories: devops shell
comments: true
toc: true
header:
  overlay_image: /assets/images/bash-shell.png
  overlay_filter: rgba(255, 255, 255, 0.5)
excerpt: >-
  提供一个工具以便能够以无窗口方式启动一个 VM [...]
---



### 前言



我常常跑一个 Linux Server 虚拟机在后台，很多工作需要在这里面做一定的兼容性测试。有时候可能我会在这边编译一些代码。有时候我还会依赖 Linux 这边提供一些服务调用。所以长期保持一个 Linux 服务器在后台是有必要的。有时候我可能会需要一个 Linux 桌面，因为那里面有 kDevelop，以前没有 CLion 的时候我觉得它是最好的 C++ IDE。

早些年的时候 Windows 中有 HyperV 虚拟机，完美地提供了我所想要的机制，但后来 HyperV 也办不到了，而且 HyperV 跑的 Desktop 一律性能低下，也只有 Server 才能在里面顺利地跑。

今天的时候 Windows 10 中 WSL 2 提供了 Linux Server 的全透明方案。不过它不能解决两个问题：一是我想要跑两个或更多 VMs（64G内存我乐意）；二是同样地不能跑 Desktop，更不必提跑 Desktop 还性能低下了（所以 Desktop 性能高强完全没影子）

至于 VMWare，在 Windows 环境里可以有办法达到我想要的目的，马马虎虎：首先是让 VMWare 自己自动启动，然后是将某个 VM 的“跟随 VMWare 启动”选项打开，大体上能够达到效果。但我不记得是不是总是有点这样那样的问题，反正后来我也放弃了。

VMware Windows 还有一个问题是资源泄露问题，如果长期跑不关机你可能会察觉到 Windows 响应降低的很快，休眠恢复后更明显。完全关掉 VMWare 之后情况会有所好转。

当用到 VMWare Fusion 时，他没有资源泄露问题，起码十几天一个月的不重启使用时感受不到这种响应缓慢的问题。而且 VMWare Fusion 同样有 Start automatically when VMWare Fusion launches 选项，能够在 masOS 开机后自动启动，唯一的麻烦是然后会弹出一个 VM 窗口，而且你不能关掉它，因为关掉窗口得到的反应是 suspend VM。

所以这个选项是个鸡肋，我只能寻求 headless 启动方式，尽管需要手工执行命令行，但开机之后执行一次而已，当我需要 ssh vm.local 之前执行一次 vm 启动也没什么大不了的。

值得表扬的是现在 Ubuntu Server 启动很快了，从启动命令回车后到可以 ssh 进去，几乎没有什么延迟（实际上的启动时间大约只有3～7sec，但 ssh 的延迟可以令其近似于无感知）。

也就是说：

```bash
vmware_run u20.local.new start && ssh u20.local
# 或者
vmware_run u20.local.new start && sleep 5 && ssh u20.local
```

是行得通的。



无论如何，现在生活是勉强可以继续了。

所以下面是分享时间。











<!--more-->



### 各种虚拟机的无窗口启动



#### Parallels Desktop

首先是关掉 Parallels Desktop，如果它开着的话。然后进入 Terminal 使用如下命令：

```bash
# 列出已经运行的 VMs
prlctl list -a
# 启动某个 VM
prlctl start "VM NAME"
```



#### VirtualBox

在 VirtualBox 的 GUI 界面中，VM 的右键菜单中有 headless start，选用它即可。或者点击工具栏的 Start 按钮但同时也按下 Shift 也可以。

virtualbox 的命令行工具也行得通，但这里就不介绍了。



#### VMWare (Fusion/Windows)

首先是找到 vmrun 命令行工具（参考 PDF 文件 [Using vmrun to Control Virtual Machines](https://www.vmware.com/pdf/vix162_vmrun_command.pdf)）：

```bash
# 对于 VMware Fusion 找到 vmrun
alias vmrun=/Applications/VMware\ Fusion.app/Contents/Library/vmrun
set VMRUN=vmrun
# 对于 VMWare for Windows 找到 vmrun
set VMRUN="C:\Program Files\VMware\VMware VIX\vmrun.exe"
# 对于 VMWare for Linux
set VMRUN="/usr/lib/vmware-vix/lib/vmrun"
```

然后使用 nogui 启动：

```bash
vmrun -T fusion start "/path/to/vm.vmx" nogui
```







### VMWare 的 工具函数 `vmware_run`

一如既往，会反复用到的，那就脚本化，所以我建立了一个专用函数，你可以在 .zshrc 或者 .bashrc 中粘贴它：

```bash
vmware_run(){
	local VMDIR="$HOME/Downloads/VMs/vmware"
	local VMTYPE=fusion # or "ws"
	# local VMDIR="$HOME/Documents/Virtual Machines.localized"
	which vmrun >/dev/null 2>&1 || ln -s "/Applications/VMware Fusion.app/Contents/Library/vmrun" /usr/local/bin/vmrun
	case $2 in
		start)
			local cmd=$2 && local vmn=$1 && shift && shift && vmware_run_start $cmd $vmn nogui "$@"
			;;
		start_with_gui|start-with-gui|unpause)
			local cmd=$2 && local vmn=$1 && shift && shift && vmware_run_start start $vmn "$@"
			;;
		stop|suspend|reset|pause)
			local cmd=$2 && local vmn=$1 && shift && shift && vmware_run_stop $cmd $vmn nogui "$@"
			;;
		*)
			case $1 in
				usage|help)
					cat <<-EOF
					Usage:
					  $(basename $0) <VM-name> <start|stop|suspend|reset|pause|unpause>
					  $(basename $0) <VM-name> <start_with_gui|start-with-gui>

					Examples:
					  $(basename $0) start u20.local.new
					  # start vm without gui (headless mode)

					EOF
					;;

				*)
					vmrun "$@"
					;;
			esac
			;;
	esac
}
vmware_run_start () {
	local cmd=$1
	local vmname=$2
	shift; shift
	vmrun list | grep -q "$vmname" && {
		echo "VM '$vmname' already running"
	} || {
		vmrun -T $VMTYPE $cmd $VMDIR/$vmname.vmwarevm/$vmname.vmx "$@"
	}
}
vmware_run_stop () {
	local cmd=$1
	local vmname=$2
	vmrun list | grep -q "$vmname" || {
		echo "VM '$vmname' not running"
	} && {
		vmrun -T $VMTYPE $cmd $VMDIR/$vmname.vmwarevm/$vmname.vmx
	}
}
```

使用它的方式类似于这样：

```bash
$ vmware_run help
Usage:
  vmware_run <VM-name> <start|stop|suspend|reset|pause|unpause>
  vmware_run <VM-name> <start_with_gui|start-with-gui>

Examples:
  vmware_run start u20.local.new
  # start vm without gui (headless mode)

$ vmware_run u20.local.new start && sleep 5 && ssh u20.local
....

$ vmware_run u20.local.new suspend

```



### 后文

可以在 [gist](https://gist.github.com/hedzr/f16f6f2b13a4a2c83d4ac92226749373) 拿到这个脚本。





 

## 🔚