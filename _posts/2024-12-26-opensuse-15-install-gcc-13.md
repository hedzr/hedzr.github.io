---
layout: single
title: 在 openSUSE 15 Leap 上安装 gcc-13/14
date: 2024-12-26 05:00:00 +0800
last_modified_at: 2024-12-26 11:01:00 +0800
Author: hedzr
tags: [linux, opensuse, leap, gcc-13, gcc-14, devops]
categories: devops linux
comments: true
toc: true
header:
  teaser: /assets/images/ubuntuhero.jpg
  overlay_image: /assets/images/ubuntuhero.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
excerpt: "安装 gcc-13，特别是通过编译源码方式来安装它"
---

> 今年上半年开始暂停了很久，一是因为精力分配问题，二是考虑像 C++/Golang 这些语言，给我的感觉每况愈下，着实很是失望。这个博客是面向开发方面的，按说不该那么挑剔语言才对。不过开发就得使用语言不是吗，心情差了也属于正常系列对不对。
>
> 今年除了休养身体之外，也在考虑什么是开发，怎么开发的问题。当然我也没兴趣分享抽象领域的思考，那会太抽象，确实是抽象。
>
> 但是年底了，今年还是要有所报告。
>
> 无奈之下也只能更新一篇 devops 的东西。
>
> 这次的缘起在于我陆续放弃了很多不怎么行的东西。多年以前我放弃了 Java，后来是 Rust，然后是 Ubuntu，等等。世界局势在变化，有的放弃也是被迫的。例如我正在考虑放弃 Linux。等等。
>
> 前几年我已经在放弃 Ubuntu 的路上了。除了复返 Debian 之外，更多是投身于 openSUSE。
>
> 所以这次就根据最新（相对的）的 openSUSE 15.x Leap 来分享我的虚拟工作机的准备方法。



由于时间关系，本文暂时仅作列举而不讨论编程（脚本）细节。

如题头按语，我介绍了一些变迁的路途。根据我的经验和筛选，目前我的编译服务器全都是 openSUSE Leap，它被安装为 server 方式，没有 GUI。安装的过程非常琐碎，本文不介绍这个方面——如果你是 DevOps 从业人员，那么很多模板方法可以帮助你初装服务器，无论是 Packer 也好，vagrant 或者 ovf 也好，方法很多，也都很有效。

对于在 macOS Mx 上使用 UTM/VMWare 的朋友来说，初装 openSUSE server 也没有难度，然后利用 vmware snapshot 或者简单地拷贝 utm 虚拟机等方式都可以帮助你省去反复安装、调教基本系统的麻烦。

所以，下面是直入主题，介绍我在基本系统上如何准备 c++ 编译环境的。

## openSUSE 上的 C++ 编译环境

### 安装 gcc-13

以 openSUSE 15.x Leap 为例，gcc-13 可以被直接安装。

> 也适用于 openSUSE 14.x

默认的方式，openSUSE 会安装 gcc-7，使用下面的语句：

```bash
sudo zypper install -t pattern devel_C_C++
```

但这就确实太老了，所以为了得到 gcc-13，你需要下面的语句：

```bash
sudo zypper install gcc gcc-c++ gcc13 gcc13-c++
```

但这并不完全是全部。

因为这样安装之后，`gcc --version` 得到的还是 gcc-7。

所以完全正确的方法是放弃上面介绍的“标准的”语句，在 BASH 终端中依次执行下面的指令：

```bash
# best way to install gcc(-13) on openSUSE Leap 14
sudo zypper install gcc gcc-c++ gcc13 gcc13-c++ gcc13-PIE gcc13-info gcc13-locale libstdc++-devel libtool make m4 flex bison bison-lang autoconf automake pkg-config ncurses-devel zlib-devel yaml-cpp-devel binutils-devel gdb cmake ccache ninja git

sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-7 20
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-12 40
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-13 50
sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-7 20
sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-12 40
sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-13 50
sudo update-alternatives --query gcc  # check state of gcc alternatives
echo | sudo update-alternatives --config gcc # check and update config of gcc
sudo update-alternatives --query g++
echo | sudo update-alternatives --config g++

gcc --version
g++ --version

sudo update-alternatives --install /usr/bin/cc cc /usr/bin/gcc-7 20
sudo update-alternatives --install /usr/bin/cc cc /usr/bin/gcc-12 40
sudo update-alternatives --install /usr/bin/cc cc /usr/bin/gcc-13 50
sudo update-alternatives --install /usr/bin/c++ c++ /usr/bin/g++-7 20
sudo update-alternatives --install /usr/bin/c++ c++ /usr/bin/g++-12 40
sudo update-alternatives --install /usr/bin/c++ c++ /usr/bin/g++-13 50

sudo update-alternatives --query cc
sudo update-alternatives --query c++
```

注意到上面的安装包列表已经包含了 C++ 的周边用品，例如 cmake、ccahe、ninja 等等。基本上就是说，这么做了之后你就得到了一个就绪的 C++ 编译环境。

> 为了适配不同的系统，上面的脚本包含了一些无效语句，但它们没有副作用，可以安全地忽略相关错误。例如 `sudo update-alternatives --install /usr/bin/cc cc /usr/bin/gcc-12 40` 会报错，但是无害。



### 安装 gcc-14

对于当前的 openSUSE，安装 gcc-14 还需要手动编译。

参考我的旧文章 [在 Ubuntu Server 22.04 上安装 gcc-13](https://hedzr.com/devops/linux/ubuntu-22.04-install-gcc-13/)，稍作修改就能顺利完成这个任务。

一个参考片段如下：

```bash
#!/bin/bash


install_gcc_14_src() {
	echo && headline "  - $(fn_name_dyn)"

	install_gcc # bundled gcc first for building gcc-13 from sources
	ig14src
	upd_alter_gcc
}


install_gcc() {
	echo && headline "$(fn_name_dyn)"

	# $SUDO add-apt-repository --yes -u ppa:ubuntu-toolchain-r/test

	# install_packages 等价于 sudo apt-get install -y
  install_packages build-essential gcc-locales g++-multilib \
		git \
		gdb gdbserver \
    automake bison flex xsltproc libfl-dev \
		libtool pkg-config \
		make || :

	upd_alter_gcc
}

ig14src() {
	SRCDIR=$HOME/gcc-source
	INSTDIR=$HOME/gcc-install
	BUILDDIR=./gcc-1x-build
	# VER=gcc-13
	# VERSION=gcc-13.3.0
	# VER=gcc-12
	# VERSION=gcc-12.2.0
	VER=gcc-14
	VERSION=gcc-14.2.0

	[ -d $SRCDIR ] || {
		# tip set git insteadOf
		git config --global url."https://gcc.gnu.org/".insteadOf https://gcc.gnu.org
		# tip clone gcc sources
		git clone https://gcc.gnu.org/git/gcc.git $SRCDIR
	}
	cd $SRCDIR/
	# git branch -a | grep $VER
	# git checkout remotes/origin/releases/$VERSION
	git checkout releases/$VERSION

	# instead of: ./contrib/download_prerequisites
	package-search MPFR | grep devel
	package-install mpfr-devel
	package-search MPC | grep devel
	package-install mpc-devel
	package-search GMP | grep devel
	package-install gmp-devel
	package-install gcc-multilib

	echo && gcc -v && echo && ls -l $(which gcc) && echo

	[ -d $BUILDDIR ] || mkdir $BUILDDIR
	cd $BUILDDIR

	[ -f Makefile ] ||
		../configure --prefix=$INSTDIR --enable-languages=c,c++ # ,fortran,go

	if [ ! -x $INSTDIR/bin/gcc ]; then
		[ -f /swapfile ] || {
			# $SUDO dd if=/dev/zero of=/swapfile bs=64M count=16  # 1GB swap file
			$SUDO dd if=/dev/zero of=/swapfile bs=64M count=64 # 4GB swap file
			# $SUDO dd if=/dev/zero of=/swapfile bs=64M count=320 # 20GB swap file
			$SUDO mkswap /swapfile
		}
		$SUDO swapon --show | grep -q '/swapfile' || $SUDO swapon /swapfile
		$SUDO swapon --show

		make -j4 # decerase the cores so that reduce the memery usages to avoid out of memory whenn compiling
		make install

		[ -f /swapfile ] && $SUDO swapoff /swapfile && $SUDO rm /swapfile
	fi

	ig14local
}

ig14local() {
	PREFIX=/usr/local/lib/gcc-$VERSION
	if [ ! -L $PREFIX ]; then
		# $SUDO cp -R $INSTDIR $PREFIX
		$SUDO ln -sf $INSTDIR $PREFIX
		$SUDO ln -sf $PREFIX/bin/gcc /usr/local/bin/gcc-14
		$SUDO ln -sf $PREFIX/bin/g++ /usr/local/bin/g++-14
		#
		# To run an executable compiled with this gcc, PRELOAD its lib64/ directory:
		# LD_LIBRARY_PATH=/usr/local/lib/gcc-13.1.0/lib64 ./hello
		[ -f /etc/profile.d/gcc-$VERSION ] || $SUDO echo "LD_LIBRARY_PATH=$PREFIX/lib64" >/etc/profile.d/gcc-$VERSION
	fi
	upd_alter_gcc
}

upd_alter_gcc() {
	$SUDO update-alternatives --list gcc || :
	$SUDO update-alternatives --list g++ || :

  W=/usr/bin/gcc-7 && [ -x $W ] && $SUDO update-alternatives --install /usr/bin/gcc gcc $W 90 --slave /usr/bin/g++ g++ "${W//gcc/g++}" && V="$W"
	W=/usr/bin/gcc-9 && [ -x $W ] && $SUDO update-alternatives --install /usr/bin/gcc gcc $W 90 --slave /usr/bin/g++ g++ "${W//gcc/g++}" && V="$W"
	W=/usr/bin/gcc-10 && [ -x $W ] && $SUDO update-alternatives --install /usr/bin/gcc gcc $W 90 --slave /usr/bin/g++ g++ "${W//gcc/g++}" && V="$W"
	W=/usr/bin/gcc-11 && [ -x $W ] && $SUDO update-alternatives --install /usr/bin/gcc gcc $W 90 --slave /usr/bin/g++ g++ "${W//gcc/g++}" && V="$W"
	W=/usr/bin/gcc-12 && [ -x $W ] && $SUDO update-alternatives --install /usr/bin/gcc gcc $W 90 --slave /usr/bin/g++ g++ "${W//gcc/g++}" && V="$W"
	W=/usr/bin/gcc-13 && [ -x $W ] && $SUDO update-alternatives --install /usr/bin/gcc gcc $W 90 --slave /usr/bin/g++ g++ "${W//gcc/g++}" && V="$W"
	W=/usr/bin/gcc-14 && [ -x $W ] && $SUDO update-alternatives --install /usr/bin/gcc gcc $W 90 --slave /usr/bin/g++ g++ "${W//gcc/g++}" && V="$W"

	W="$(which gcc-11)" && WX="$(which g++-11)"
	[ "$W" != "" ] && [ -x $W ] && $SUDO update-alternatives --install /usr/bin/gcc gcc $W 60 --slave /usr/bin/g++ g++ $WX && V="$W"
	W="$(which gcc-12)" && WX="$(which g++-12)"
	[ "$W" != "" ] && [ -x $W ] && $SUDO update-alternatives --install /usr/bin/gcc gcc $W 50 --slave /usr/bin/g++ g++ $WX && V="$W"
	W="$(which gcc-13)" && WX="$(which g++-13)"
	[ "$W" != "" ] && [ -x $W ] && $SUDO update-alternatives --install /usr/bin/gcc gcc $W 49 --slave /usr/bin/g++ g++ $WX && V="$W"
	W="$(which gcc-14)" && WX="$(which g++-14)"
	[ "$W" != "" ] && [ -x $W ] && $SUDO update-alternatives --install /usr/bin/gcc gcc $W 49 --slave /usr/bin/g++ g++ $WX && V="$W"

	echo
	# echo 1 | $SUDO update-alternatives --config gcc
	[ "$V" != "" ] && $SUDO update-alternatives --set gcc "$V"

	echo
	gcc --version
	echo
	g++ -v
	echo
}


# import bash.sh code fragment here
...
```

这个片段需要 [bash.sh](https://github.com/hedzr/bash.sh) 的支持。

方法也简单，复制 bash.sh repo 中的 bash.sh 文件到本地改名为 install-gcc-14.sh，然后在文件中插入上面的 bash 脚本函数们即可。

随后使用

```bash
./install-gcc-14.sh install_gcc_14_src
```

就能调用到入口函数 `install_gcc_14_src()`。



### 小结

暂时就这么多了。

本文有点草率，但因为心神放在另一侧，只好放松这边了。