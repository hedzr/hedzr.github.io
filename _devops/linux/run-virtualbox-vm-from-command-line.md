---
layout: single
title: vagrant_run - 更方便地从命令行启动 vagrant 虚拟机
date: 2023-01-06 19:07:00 +0800
last_modified_at: 2023-01-06 20:55:00 +0800
Author: hedzr
tags: [linux, ubuntu, bash, vm, devops]
categories: devops linux
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@latest/uPic/image-20230223182822880.png
  overlay_image: /assets/images/ubuntuhero.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
excerpt: "工具脚本 ..."
---

## 缘起

平时常常操作 vagrant 和虚拟机，就很烦要切换到对应文件夹之后才能发出指令。

所以就搞了很多想法想要简化。

由于往往会做很多虚拟机，有时候还不断修订、改造，所以我并不喜欢采用 `z name` 的方式来加速目录切换，只因此时可能有很多名字相似的目录，z 对此可能比较蠢笨，不一定能 cd 到我真正想要的目的地。

## 工具脚本化

后来，我就考虑使用 zsh 的 hash 文件夹方案了，另外也考虑整合了在 virtualbox 中直接创建的虚拟机。最后得到了一个大大的脚本。

> **Hash 文件夹**
>
> 即 `Named Folder` 之我所谓。这个概念以前我有文章介绍过：
>
>  [Tilde 展开以及命名目录](https://hedzr.com/devops/shell/tilde-expansion-and-named-directories/) 

首先，这个大大的脚本需要一个前置函数 `__vms_reg`。

### `__vms_reg` 函数

这是一个单独的注册片段：

```bash
__vms_reg() {
	hash -d | grep -qE '^vhost.ub20a=' || hash -d vhost.ub20a="$HOME/work/ops.work/ub20a.local"
	hash -d | grep -qE '^vhost.hello=' || hash -d vhost.hello="$HOME/hack/work/hello-1-cxx"

	if [ -f "$HOME/.vagrant.vhosts" ]; then
		local name1 name2
		while IFS=$'\t' read -r name1 name2; do
			if [[ "$name1" != "" ]]; then
				dbg ">> loading pair: $name1 -> $(eval echo -e $name2)"
				# hash -d | grep -qE '^vhost\.'$name1'=' ||
				hash -d vhost.$name1="$(eval echo -e $name2)"
			fi
		done <"$HOME/.vagrant.vhosts"
	fi
}
```

当你在一个文件夹中建立 vagrant 虚拟机的时候，例如 `"$HOME/work/ops.work/ub20a.local"`，就可以给它指定一个助记名“ub20a”，然后在 __vms_reg 中定义一个条目。

你也可以在 `$HOME/.vagrant.vhosts` 中定义这样的关联关系：

```
ub20a	$HOME/work/ops.work/ub20a.local
```

> 中间以制表字符隔开

`__vms_reg` 函数的剩余部分是负责加载这个文件。

单独的一个 __vms_reg 函数可能是有用的，不但保持了灵活性，也提供一个 lazy load 的效果。



### `vagrant_run` 函数

正式的函数比较大（:;），这是因为我想处理很多模糊的情况。

首先跟你讲用法。

#### 运行一个 vagrant 虚拟机

```bash
vagrant_run ub20a
vagrant_run ub20a up
vagrant_run ub20a halt
vagrant_run ub20a destroy -f
```

vagrant_run 就好像 vagrant 本身一样，除了前置一个 `ub20a` 名字之外。这个名字是前面我们为文件夹所起的助记名。

#### 运行 Vagrantfile 中的某一个虚拟机

如果 `Vagrantfile` 中定义了多个 vm 虚拟机也没关系，如同 vagrant up vm_name 那样去调用，但 vm_name 被提前了：

```bash
vagrant_run redis_va redis_001 up
vagrant_run redis_va redis_001
vagrant_run redis_va redis_001 halt
vagrant_run redis_va redis_001 destroy
```

#### 列出已知的虚拟机助记名

此外，还有一个辅助子命令 list（或者 ls）：

```bash
$ vagrant_run ls
VMs in virtualbox:

"armcxxbuilder_arm-cxx_1672653341445_34553" {447f620c-20d6-465d-b6f6-940b15b7cf1d}
"ubuntu20test" {546dd35c-0ef7-4414-b06c-6e0067afb394}

VMs in hash folder:

vhost.hello=~/hack/work/hello-1-cxx
vhost.redis-va=~/work/ops.work/redis-va
vhost.ub20a=~/work/ops.work/ub20a.local

```

#### 运行一个 virtualbox 虚拟机

如果想直接无界面地启动某个 virtualbox 中的虚拟机的话，直接使用它的名字好了：

```bash
vagrant_run ubuntu20test
vagrant_run ubuntu20test up
vagrant_run ubuntu20test run
vagrant_run ubuntu20test halt
vagrant_run ubuntu20test stop
vagrant_run ubuntu20test shutdown
```

### 完整的脚本定义

这个大大的脚本真的是太大了，所以就放在 gist 了：

- <https://gist.github.com/hedzr/a24592879ac90239be6c8b1746feebd4>

请自行按需取用吧。





### 小结

暂时写这么多。