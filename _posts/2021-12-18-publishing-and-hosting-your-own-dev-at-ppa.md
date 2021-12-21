---
layout: single
title: "发布你的开源软件到 Ubuntu PPA"
date: 2021-12-17 05:00:00 +0800
last_modified_at: 2021-12-17 07:13:00 +0800
Author: hedzr
tags: [packaging,deb,source package,c++]
categories: packaging deb
comments: true
toc: true
header:
  teaser: /assets/images/unsplash-gallery-image-1-th.jpg
  overlay_image: /assets/images/unsplash-gallery-image-1-th.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  发布 C/C++ 开源软件到 Launchpad，从源码构建 deb 分发包 ...
---




> For an individual, here is a simple guide to show you howto publish and host your own deb to Ubuntu PPA.



## Checklist

1. An Ubuntu Machine

2. SSH Keys Ready

   参考：[ssh-short-guide] （略）

3. Preparing your GPG Keys

   参考：[gpg-short-guide](https://hedzr.com/security/gpg/gpg-short-guide/)

4. Setting up a Launchpad Account (aka: Ubuntu One Account)

5. Creating your own PPA

6. Publishing a first test package

   1. Backstaging Information

      参考：[creating deb from scratch]

      参考：[creating deb from source tree]

   2. Preparing the source code

   3. Preparing the Debian package control files

   4. Building the source package

   5. Uploading the package

7. Using a PPA

   1. Installing the package
   2. Deleting a package



## 写在前面

在 Linux 发行版中，包管理几乎可以划为两大流派：rpm 和 deb。

> pacman 与 archlinux 只是小众就不提了。
>
> zypper 只不过是 rpm 的上层，和 yum、dnf 并无本质的差别。

本文以及近来相似的文章都聚焦在 deb 发行方面。在 [从零开始制作 deb 包] 中我们已经介绍了 binary package 的构建，这样构建的 deb 包能够被用户直接下载并通过命令 `dpkg -i package.deb` 的方式安装，可以说是大大提高了用户取用的方便性。但这种 deb 包不那么容易被公开发行到包管理体系中——也不是绝对不行，但你需要为其准备太多的辅助文件才可以。

而在本文中我们将会讲述 source package 的入门。这种方式前提在于你是源码构建人员，对于源代码的构建流程很熟悉，那么通过 [Debian 新维护者手册](https://www.debian.org/doc/manuals/maint-guide/) 的指导你就能非常容易地构建出包管理系统满意的发行包。此发行包（Bundle）中除了 deb 安装包之外，通常还包括源代码 tarball，以及具备版本跟踪记录的辅助文件。使用 Debian 提供的工具 dput，你可以将该发行包（Bundle）推送到公共服务器，用户能够使用 apt install package 的方式安装它，这也是 Debian 系发行版的最佳发行方案。

发行包（Bundle）可以被发布到 Debian/Unubtu 官方认证并维护的公共服务器，但这需要若干前提，你需要提出申请并获得维护团队的许可。

> 如果你有心想要提供足够正式而官方的 ppa 发行，使用 ppa 官网的注册入口：
>
> - [Register a project](https://launchpad.net/projects/+new)
> - [Register a team](https://launchpad.net/people/+newteam)
>
> 但是什么代开发漂的还是别去搞污染吧。



### In PPA Way

对于独立开发者来说，被核心源（main，restrited，universe）所接纳，并不是一件容易的事。然而，开源的世界并不会关门，所以 ppa 可能是独立开发者的最佳选择。

PPA 是 Personal Package Archive 的缩写，顾名思义，ppa 代表着一个供个人开发者发布软件包的环境、平台，或者说基础架构。

PPA 是由 launchpad.net 承载的。而 launchpad.net 是 Canonical 公司维护的网站，他允许软件开发者在这里自由地发行软件，通过 launchpad 发行的软件包，在 Ubuntu apt 体系中通过 ppa 的方式能够享有核心软件包的几乎同等的待遇。你可以这样安装来自于某个 ppa 所提供的软件包：

```bash
$ sudo add-apt-repository ppa:hedzr/test-ppa
$ sudo apt update
$ sudo apt install testpackage
```

> Canonical 是 Ubuntu.com 的拥有者和运营者。
>
> 值得一提的是，ppa 是反哺的一个好的例证，现在（至少从 Debian 7 起）我们也可以在 Debian 原生操作系统中直接使用 ppa 安装软件，不再是 Ubuntu 系独有。

使用 ppa 做软件包分发的比较典型的例子是关于 Oracle Java SDK 的安装，有好事者为其建立了 ppa 分发点，避免了去 Oracle 官网注册帐号，手动确认 license，手动下载，手动执行安装包完成 Java SDK 包的不文明方式。不过严格地说，这样做有侵权的嫌疑，所以我早就不采用 Java 开发转而搞 Golang 开发了，实在不行了我就去 C++，犯得着弄 Java 这种蠢笨的东西吗。







## 发布前准备



### 前提

为了发布到 PPA，你需要一台 Ubuntu 系统。幸运的是，在 Windows 中，你可以使用 WSL 环境，它就是 Ubuntu 的。而在 macOS 中，利用 VirtualBox，可选地使用 vagrant，你可以轻易地得到 Ubuntu Server 环境，非常轻量，基本上没有什么额外的负担。

具体如何准备你的 Ubuntu 环境，如何与其连接，如同传输代码到该环境（rsync YYDS），本文就不予描述了，这算是基础知识吧，你都在打算向 Ubuntu 社区贡献个人的力量了，搞不懂我说的这些东西，未免很是说不过去。

一个辅助的参考在 [Ubuntu Server 安装提要](https://hedzr.com/devops/linux/ubuntu-20.04-setup-essentials/) ，在这里我介绍了一些让你的 VM 更好用的 tips。

在这台 Ubuntu 系统中，安装必须的软件包：

```bash
sudo apt install gnupg dput dh-make devscripts lintian gpg fakeroot
sudo apt install git make build-essentials
```

由于我们的案例是以 C++ 代码为例，所以也安装 build-essential。



### SSH Key Ready

在 Ubuntu 中，你已经有 SSH 环境，你已经有一个 SSH Key。

你可能也已经准备好了免密码 sudo，这不是必须的，但可能是最好做到的，否则输入密码有可能很是烦恼。



### GPG Key Ready

为了发布到 PPA，你需要有 GPG Key，而且你要将其发布到 keyserver.ubuntu.com 上去。

和 GPG 相关的一个速查表可以查阅 [GPG Short Guide](https://hedzr.com/security/gpg/gpg-short-guide/) 。如果感觉需要更系统地了解 GPG 有关知识，你需要去搜索一下了，这不是什么高难问题——它的门槛在于：GPG 是一个和加密体系密切相关的概念，所以你需要大量的背景知识才能深入理解和用好它——但这并不妨碍普通人也能很容易地使用 GPG 做日常的签名、签署、加解密文档或邮件等工作。

GPG 标定一个身份，此身份与一个（或者多个）Email 邮箱地址相关联以证实该身份。你需要使用一个稳定的邮箱来创建一个 GPG Key（包含公钥和私钥）。我们建议你创建一个 4096 bits 的密钥。

一个重要的细节是，ppa 只能使用你的主密钥来完成发包，或者精确地说，你只有用主密钥来签署要分发的软件包，上传之后 ppa 才能正确鉴定该包的有效性。因为 ppa 在登记你的 GPG 公钥时，不接受 subkey。

> 或许，这并不是真的，也许只是因为网络环境的原因，因为由于众所周知的原因，在 launchpad 上各个页面之间的行走有很多问题，我不确定网络丢包、阻塞等会不会对登记 GPG Key 造成了影响。
>
> 但我也不想为此消耗更多精力了。
>
> 作为一个 Workaround，你在自己的宿主机上创建了 GPG 密钥，你可以继续创建子密钥。然后你会导出自己的主密钥（私钥+公钥），注意此时不要导出子密钥，然后将导出的密钥导入到 Ubuntu 系统上就可以很好地完成签名了。



### 环境变量

对于 deb 构建来说，我们在 .bashrc 中添加环境变量：

```bash
DEBEMAIL="your-email@gmail.com"
DEBFULLNAME="your fullname"
export DEBEMAIL DEBFULLNAME
#DEBUILD_DPKG_BUILDPACKAGE_OPTS="-i -I -us -uc"
#DEBUILD_LINTIAN_OPTS="-i -I --show-overrides"
DEBSIGN_KEYID="Your_GPG_keyID"
export DEBSIGN_KEYID
```

请自行修正变量值。



### Launchpad 账户

PPA 是由 launchpad.net 提供的一种软件包发行途径。所以你必须首先访问 [launchpad.net/+login](https://launchpad.net/+login) 申请一个 launchpad 账户。

你需要知道的是 launchpad.net 是由 Canonical 公司运营的，而且 Ubuntu.com 也是他们家运营的，所以 launchpad 账户实际上也就是 Ubuntu One 账户，这一组站点是一家人。

因而申请链接将会跳转到 Ubuntu One 注册页面。

在这里需要注意的是，申请账户使用的 email 地址必须和 GPG Key 使用同样的地址。

话不多说，申请了账户之后，首先确认 email 地址有效，然后添加你的 SSH，GPG Key 到你的用户中心页面里。假设你使用用户名 hedzr 注册了账户，那么你的页面就在 [https://launchpad.net/~hedzr](https://launchpad.net/~hedzr)，在这个页面里，依次添加 SSH Key，GPG Key 到相应的条目中，然后你的页面看起来和下图比较像：

![image-20211218095834885](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20211218095834885.png)

其中，添加 **OpenPGP keys** 的链接为：[https://launchpad.net/~hedzr/+editpgpkeys](https://launchpad.net/~hedzr/+editpgpkeys)

添加 **SSH keys** 的链接为 [https://launchpad.net/~hedzr/+editsshkeys](https://launchpad.net/~hedzr/+editsshkeys)



### 创建 PPA

现在可以使用链接 [Create a new PPA](https://launchpad.net/~hedzr/+activate-ppa) 创建你的第一个 ppa 了。

这一步非常简单，不会有国产特色，直接明了就能搞定。

你可以创建的 ppa 数量没有明显的限制，每个 ppa 通常有 2GB 的容量。所以我们*要求*你首先创建一个名为 test-ppa 的 PPA，来进行下面的工作。

创建好的 ppa 具有 `ppa:<用户名>/<ppa-name>` 这样的唯一标识，用户将会使用这样的语法来添加你的 ppa：

```bash
sudo apt-add-repository ppa:hedzr/test-ppa
```

请自行替换必要的字段。

## 发布你的第一个软件包

我们已经知道 deb 的构建有两种方式：

1. 从 binary package 构建 deb：
   - 参考：[从零开始制作 deb 文件 - Create .deb From Scratch](https://hedzr.com/packaging/deb/creating-deb-file-from-scratch/)

2. 从 source package 构建 deb：
   - 发布到 ppa 要求你必须提交源代码，并且你的源码一定是可以编译的。这个话题延展开会很巨大。

本文以 C/C++ 源码为例对后者（Source Package 方式）进行讲解。



### 准备源代码

在 Ubuntu 里，我们在 `$HOME` 开始发布工作。

首先是建立工作目录 `testpackage` 并添加源代码包（source package）。所谓的 source package 一般来说包含了源程序代码和构建所需的脚本，通常是 Makefile，或者 CMakeLists.txt 等等。



#### 工作目录

首先是创建工作目录：

```basj
mkdir -pv ~/deb/testpackage.work/testpackage
cd ~/deb/testpackage.work/testpackage
```

> 1. 我们会做多个工作，所以总的来说是 deb/；
> 2. .deb 的构建都是输出到 source package 的上一级目录，所以我们使用 testpackage.work/testpackage 两级目录结构来放置源码文件
> 3. 将来 .deb 文件就能输出到 testpackage.work/ 之中。



#### C 源代码 main.c

并且就地创建一个 main.c：

```bash
cat > main.c <<EOF
#include <stdio.h>

int main()
{
  printf("Hello world!\n");
}
EOF
```



#### C 项目构建 Makefile

然后是 Makefile，这个 Makefile 必须有 all 和 install 两个 Targets。

> 实际上只有 install 是必须的，此外 `make` 的默认 target 必须能够构建出相应的二进制结果，并且能够被 install 正确使用。

Makefile 的相关知识也很难简明讲解。所以你首先需要这样一个 Makefile：

```makefile
BINDIR := /usr/bin

all:
	gcc main.c -o my_hello_world

install:
	mkdir -p ${DESTDIR}${BINDIR}
	cp my_hello_world ${DESTDIR}${BINDIR}/

```

我们使用命令行直接创建它：

```bash
echo -e 'BINDIR := /usr/bin

all:
\tgcc main.c -o my_hello_world

install:
\tmkdir -p ${DESTDIR}${BINDIR}
\tcp my_hello_world ${DESTDIR}${BINDIR}/
' > Makefile
```

注意为了保证 Makefile 格式正确（每个 target 的命令序列必须用 TAB 制表符进行缩进），所以我们使用 `echo -e` 并明确地使用 `\t` 转义字符来表达缩进。

你可以在工作目录下尝试构建：

```bash
make all
```

我们已经知道 ppa 服务器会使用构建服务器来构建我们上传的 source package ，此时 `${DESTDIR}` 会由构建服务器设置一个本地值。但对我们本机构建或者用户通过 apt install构建时，它通常没有指定值。

`${BINDIR}` 则被预设为值 `/usr/bin`，这也是我们安装软件包可执行文件的默认目的地。



### 基于源码包创建软件包的源信息和控制文件

C 源码很简单，现在我们要创建 debian 文件夹和一系列控制文件了：

```bash
dh_make -p testpackage_0.0.0.1 --single --native --copyright apache --email $DEBEMAIL
```

你可以选择其它版权协议，例如 mit 等等。

版本号：应该是 4 节，通常用到前三节，最后一节是发布紧急补丁时才会用到，也参考 semver 以及 debian 新维护者手册的说明。

对于 deb 的 source package 构建方式来说，它使用一个 `debian` 文件夹来放置 deb 打包所需的控制文件。

这和 binary package 的 `DEBIAN` 文件夹是不同的。

`dh_make` 将会询问你若干问题，回答完毕后 debian 文件夹中会有一系列的文件。其中名为 *.ex 的文件是可选的，例如 postinst.ex，如果你想要编写 postinst 脚本的话，可以将它重命名为 postinst，这个文件中已经带有必须的骨架，你聚焦在你的逻辑上即可。但如果你不需要编写 postinst 脚本，那么 postinst.ex 是可以安全地删除掉的：

```bash
rm debian/*.{ex,EX}
```

在 dh_make 运行之后，所生成的文件都在 debian/ 之中：

![image-20211218104317092](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/146779565-123e23f4-69b5-4253-9088-aae09f6ce4ab.png)





#### 复查控制文件

##### debian/README*

这些文件提供文档描述，你可以修改它们以表述你的软件包的用途。

##### debian/changelog

最重要的一个文件，每当升级时，你需要在其中添加新版本的描述信息。没有正确的新版本描述信息的小节的话，上传和发布不能成功完成。

我们需要修订一下该文件：

```bash
perl -i -pe "s/unstable/$(lsb_release -cs)/" debian/changelog
```

因为我们需要的是一个针对具体 Ubuntu 版本（案例中为 20.04）的安装包，暂时不会涉及到 multiarch 或者 any 模式。

现在它的内容像这样，其中 `unstable` 已经被替换为 `focal`：

```bash
testpackage (0.0.0.1) focal; urgency=medium

  * Initial Release.

 -- hedzr <hedzrz@gmail.com>  Tue, 07 Dec 2021 09:36:35 +0000
```

后文有关升级部分的描述会进一步阐述此文档。



##### debian/control

同样很重要的文件，这个文件会在 debuild 时分被重构为 DEBIAN/control。

control 包含了软件包的描述信息，它的关键信息基本来自于dh_make 时你的回答。

对刚刚生成的 control 我们还需要一点点修订，通常涉及到 Section，Homepage，Vcs-Browser，Vcs-git，Description 等字段。你需要根据自己的具体情况来设定这些值。

修订过的 control 长的这样：

```bash
Source: testpackage
Section: utils
Priority: optional
Maintainer: hedzr (hz, hedzr) <hedzrz@gmail.com>
Build-Depends: debhelper-compat (= 12)
Standards-Version: 4.4.1
Homepage: https://testpackage.foobar.org
Vcs-Browser: https://github.com/foobar/testpackage
Vcs-Git: https://github.com/foobar/testpackage.git

Package: testpackage
Architecture: any
Depends: ${shlibs:Depends}, ${misc:Depends}
Description: A short description
  A long description,
  very long indeed!
```

其中 Description 字段可以多行，必须是最后一个字段，多行文本的行首需要至少一个空格的缩进。



##### debian/rules

在 source package 构建中，rules 可能是最重要的一个文件，因为它为你提供了定制、修改标准编译构建行为的机会。

在本文中不对 rules 进行详细描述，因为这是一个挑战个人能力的庞大的话题。我们使用默认生成的版本而不做任何改变：

```bash
#!/usr/bin/make -f
# See debhelper(7) (uncomment to enable)
# output every command that modifies files on the build system.
#export DH_VERBOSE = 1


# see FEATURE AREAS in dpkg-buildflags(1)
#export DEB_BUILD_MAINT_OPTIONS = hardening=+all

# see ENVIRONMENT in dpkg-buildflags(1)
# package maintainers to append CFLAGS
#export DEB_CFLAGS_MAINT_APPEND  = -Wall -pedantic
# package maintainers to append LDFLAGS
#export DEB_LDFLAGS_MAINT_APPEND = -Wl,--as-needed


%:
	dh $@


# dh_make generated override targets
# This is example for Cmake (See https://bugs.debian.org/641051 )
#override_dh_auto_configure:
#	dh_auto_configure -- #	-DCMAKE_LIBRARY_PATH=$(DEB_HOST_MULTIARCH)

```

在下一篇专题文章中，我们会对这个文件有节制地进行调整，届时将会介绍一部分相关情况。如果你对此有浓厚的兴趣，那么不必等待我们的入门级别的系列文章发布，径直可往 [Debian 新维护者手册](https://www.debian.org/doc/manuals/maint-guide/) 尝试研究。





##### More...

其它文件你可以依次浏览，根据需要进行修订。但作为第一个试验目的的软件包，就这么就可以了。

> 你可以添加 postinst, postrm 等等脚本，这方面没有什么额外的不同，所以你可以参考 [从零开始制作 deb 文件 - Create .deb From Scratch](https://hedzr.com/packaging/deb/creating-deb-file-from-scratch/)，也可以查阅 [MaintainerScripts](https://wiki.debian.org/MaintainerScripts)。
>
> 注意 dh_make 已经替我们生成了这些文件的完整模板，只是它们以 .ex 后缀名结尾，所以当你想要自己的版本时，简单地重命名这些 skeleton 文件即可。
>
> 有时候你需要复查这些脚本文件的可执行权限是否在场，确保它们至少是 0755。

让我们推进到下一步吧。



### 构建可分发包

构建 deb，并用我们的专用 subkey 签署它们。

```bash
debuild -S -k$DEBSIGN_KEYID | tee /tmp/debuild.log 2>&1
```

-S 表示从源码编译构建；

-us -uc 指定了签署的选项；

结果是生成一组文件 deb 包

```
testpackage_0.0.0.1.dsc
testpackage_0.0.0.1.tar.xz
testpackage_0.0.0.1_source.build
testpackage_0.0.0.1_source.buildinfo
testpackage_0.0.0.1_source.changes
```



### 上传到我们的 ppa

`testpackage_0.0.0.1_source.changes` 是上传所需要的信息文件，我们刚刚生成的 `testpackage_0.0.0.1.*` 现在可以被上传到我们的 ppa 了：

```bash
Z="$(perl -ne 'print $1 if /dpkg-genchanges --build=source >(.*)/' /tmp/debuild.log)"
dput ppa:hedzr/testppa $Z
```

它等价于：

```bash
dput ppa:hedzr/testppa testpackage_0.0.0.1_source.changes
```



## 可能发生的问题



### gpg.errors.BadSignatures

如果你的 GPG Key 有若干 subkey，此签署将会不够正确，dput 上传前校验 package 文件会失败。

```bash
$ dput ppa:hedzr/test-ppa ../testpackage_0.0.0.1_source.changes
Checking signature on .changes
Traceback (most recent call last):
  File "/usr/bin/dput", line 11, in <module>
    load_entry_point('dput===1.0.3ubuntu1', 'console_scripts', 'execute-dput')()
  File "/usr/share/dput/dput/dput.py", line 1030, in main
    files_to_upload = verify_files(
  File "/usr/share/dput/dput/dput.py", line 374, in verify_files
    verify_signature(
  File "/usr/share/dput/dput/dput.py", line 274, in verify_signature
    assert_good_signature_or_exit(changes_file_path)
  File "/usr/share/dput/dput/dput.py", line 258, in assert_good_signature_or_exit
    crypto.check_file_signature(infile)
  File "/usr/share/dput/dput/crypto.py", line 93, in check_file_signature
    (_, verify_result) = context.verify(infile)
  File "/usr/lib/python3/dist-packages/gpg/core.py", line 541, in verify
    raise errors.BadSignatures(results[1], results=results)
gpg.errors.BadSignatures: DA3963683E1153984E7FBE218D9B6C4242615E10: General error
```

此时上传没有被完成。



###### 忽略签名看看更多

如果你想，可以加上 --unchecked 重试

```bash
dput --unchecked ppa:hedzr/testppa testpackage_0.0.0.1_source.changes
```

> https://askubuntu.com/questions/818010/attempting-to-upload-to-my-ppa-the-signature-could-not-be-verified

此时会显示剩余的上传过程：

```bash
$ dput -f -u  ppa:hedzr/test-ppa ../testpackage_0.0.0.1_source.changes
Uploading to ppa (via ftp to ppa.launchpad.net):
  Uploading testpackage_0.0.0.1.dsc: done.
  Uploading testpackage_0.0.0.1.tar.xz: done.
  Uploading testpackage_0.0.0.1_source.buildinfo: done.
  Uploading testpackage_0.0.0.1_source.changes: done.
Successfully uploaded packages.
```

不过，这并不是真的。因为此时 dput 工作在 dry-run 模式。



###### 解决问题

解决的办法是编辑你的 GPG Key，删除所有 subkeys 仅保留主 key：

```bash
$ gpg --edit-key 17AFB9B1
key 2
delkey
key 1
delkey
save
```

假设你有两个 subkeys，上面的命令序列依次定位每个 subkey，删除之，最后存盘退出。

这是为了顺应 launchpad 的限制，它们家只能登记你的主 key 只能以主 key 进行 verify。

现在删除错误的包后重新打包：

```bash
$ rm ../testpackage_*
$ debuild -S -k$DEBSIGN_KEYID | tee /tmp/debuild.log 2>&1
$ dput ppa:hedzr/test-ppa ../testpackage_0.0.0.1_source.changes
Uploading to ppa (via ftp to ppa.launchpad.net):
  Uploading testpackage_0.0.0.1.dsc: done.
  Uploading testpackage_0.0.0.1.tar.xz: done.
  Uploading testpackage_0.0.0.1_source.buildinfo: done.
  Uploading testpackage_0.0.0.1_source.changes: done.
Successfully uploaded packages.
```

几分钟之后，你会收到 Launchpad 的通知邮件，表明它们已经接受了我们刚刚上传的软件包，

现在可以从你的私人 ppa 安装它了：

```bash
sudo add-apt-repository ppa:hedzr/test-ppa
sudo apt update
sudo apt install testpackage
```

可以注意到我们构建的是一个 xz 格式的 tarball，并非 deb 文件。不过这点区别并不很重要，因为性质是一样的。此外，还记得我们前文介绍过的 deb 的格式吗，它只不过是控制文件 xz 包和内容文件 xz 包的捆绑组合（用 ar 格式），所以实际上并无分别。



##### 从源头解决问题

打包所使用的服务器往往并非你的主力工作机，所以这台服务器上的 gpg keyrings 实际上也是通过导入你的 gpg 私钥文件的方式构建起来的。

当你在主力工作机上导出私钥时，可以使用 `!` 后缀来要求仅导出指定密钥，不对 subkeys 进行导出：

```bash
gpg --armor --output user.gpg.private.key.asc --export-secret-keys MASTER-KEYID!
```

这样做，在服务器导入之后就只有主密钥了。

类似地在其它一些场所也有同样的需要精确指定而不是最佳匹配的情况，均可使用 `!` 后缀大法。





### Error: signing key fingerprint does not exist

当首次试验 testpackage 时，我可以理解你的急迫心情，因为当初我也是那样的。但事实是，你要有耐心，从本地成功上传之后，你不会立即看到 launchpad ppa 的状态更新，你不会立即收到邮件，如果你的软件包庞大且构建耗时，那么这个情况会更严重。放心，会的。

此外，如果你收到邮件，很快就想尝试安装测试，那么你可能收到 key 不存在的错误：

```bash
$ sudo add-apt-repository ppa:hedzr/test-ppa
 for testing
 More info: https://launchpad.net/~hedzr/+archive/ubuntu/test-ppa
Press [ENTER] to continue or Ctrl-c to cancel adding it.

Error: signing key fingerprint does not exist
Failed to add key.
```

BE PATIENT。launchpad 实际上需要为你的 ppa 创建一个新的 GPG Key，这个 GPG Key 需要一点点时间才能上传到 keyserver.ubuntu.com 并需要一点点时间才能在 pool 中完成同步和分发，所以，等一等，retry，你不会在这里困扰太久的。



## 其它信息



### Launchpad PPA for *You*

如果你对这个新 key 有一点点好奇的话，可以看看它：

```bash
$ apt-key list <Your_launchpad_username>
```

例如：

```bash
$ apt-key list hedzr
pub   rsa4096 2021-12-07 [SC]
      4AE7 90DF 4985 3D9E 55DE  41F9 A6E8 3CC2 BF06 44DD
uid           [ unknown] Launchpad PPA for Hedzr Yeh
```



### 确认 testpackage 信息

```bash
# 查看 包信息 
apt info testpackage

# 显示包中文件
dpkg -L testpackage

```



## 作为使用者安装 testpackage

在使用者的操作界面，他需要做这些事来安装你的 testpackage：

```bash
$ sudo add-apt-repository ppa:hedzr/test-ppa
$ sudo apt update    # optional
$ sudo apt install testpackage
```





## 升级到新版本

当你准备好发布下一个版本时，对于 debian 控制文件来说，仅仅只需要修订 debian/changelog 即可。一个样本看起来就像这样：

```bash
testpackage (0.0.0.2) focal; urgency=medium

  * Updated: fixed build error in source codes

 -- hedzr <hedzrz@gmail.com>  Tue, 08 Dec 2021 09:28:35 +0000

testpackage (0.0.0.1) focal; urgency=medium

  * Initial Release.

 -- hedzr <hedzrz@gmail.com>  Tue, 07 Dec 2021 09:36:35 +0000
```

你可以用 `dch -i` 或者 `dch -v version-revision` 来修改 changelog 文件。

接下来是重新构建：

```bash
debuild -S -k$DEBSIGN_KEYID | tee /tmp/debuild.log 2>&1
```

现在就会是有新版本生成：

```
-rw-r--r-- 1 hz hz 1569 Dec  8 01:29 ../testpackage_0.0.0.2.dsc
-rw-r--r-- 1 hz hz 7472 Dec  8 01:29 ../testpackage_0.0.0.2.tar.xz
-rw-r--r-- 1 hz hz 2354 Dec  8 01:29 ../testpackage_0.0.0.2_source.build
-rw-r--r-- 1 hz hz 6199 Dec  8 01:29 ../testpackage_0.0.0.2_source.buildinfo
-rw-r--r-- 1 hz hz 2033 Dec  8 01:29 ../testpackage_0.0.0.2_source.changes
```

于是你将上传它到 ppa：

```bash
$ dput ppa:hedzr/test-ppa ../testpackage_0.0.0.2_source.changes
Checking signature on .changes
gpg: ../testpackage_0.0.0.2_source.changes: Valid signature from 2E6F77F217AFB9B1
Checking signature on .dsc
gpg: ../testpackage_0.0.0.2.dsc: Valid signature from 2E6F77F217AFB9B1
Uploading to ppa (via ftp to ppa.launchpad.net):
  Uploading testpackage_0.0.0.2.dsc: done.
  Uploading testpackage_0.0.0.2.tar.xz: done.
  Uploading testpackage_0.0.0.2_source.buildinfo: done.
  Uploading testpackage_0.0.0.2_source.changes: done.
Successfully uploaded packages.

```

耐心等待，新版本将会发布。



## 查看 PPA 上的发布状态

对于 hedzr/test-ppa 来说，看这里：[https://launchpad.net/~hedzr/+archive/ubuntu/test-ppa/+packages](https://launchpad.net/~hedzr/+archive/ubuntu/test-ppa/+packages)

每个包名字可以展开，发布不成功的包的 Builds 有失败的 buildlog 链接，进去可以查看到为何失败。

一个 ppa 只有 2GB 大小，所以友善地利用公共开源空间可能不仅仅只是一个礼貌问题。



## Bonus

当你的软件包足够稳定，足够有用并进入了官方 ppa 时，甚至于进入了官方源时，在个人的 ppa 中所安装的同名软件包就有点不合时宜了。

ppa-purge 则可以让用户很简单地清理从你的个人 ppa 中安装的软件包，并且以官方源或官方 ppa 源的同名软件包来安装和代替之。当然，如果尚未有同名正式版本在官方源中的话，这个软件包将保持不变。

```bash
sudo ppa-purge ppa:<lp-name>/<ppa-name>
```





## 结束

这篇文章从下文中抽取了用例：

- [Building a Debian (`.deb`) source package, and publishing it on an Ubuntu PPA – Saverio Miroddi](https://saveriomiroddi.github.io/Building-a-debian-deb-source-package-and-publishing-it-on-an-ubuntu-ppa/) 

事实上，本文早期的学习来源之一在很大程度上就是这篇文章。

当然我的更大的老师是 [Debian 新维护者手册](https://www.debian.org/doc/manuals/maint-guide/)，你应该首先耐心将其通读一遍，因为这个手册里讲述了所有的关键概念，你必须至少有个印象才能理解 source package 构建中的各类细节，诸如 Depends 应该如何设定等等。

然而，通读它，不必急着精读它，而是借助本文直接上手跑一遍，自己跑一个实例出来，再回头去精读比较适当。

然后 [Debian Policy Manual](https://www.debian.org/doc/debian-policy/) 是非常重要的参考手册，对于国人来说你需要面对没有中文翻译版本的它，但其语法是很简单的，阅读起来估计是5、6岁小孩的难度，你只需要有一定的计算机方向词汇量就行。我们提到的，包括新维护者说册提到的所有 debian/* 文件在 Policy 手册中有精细的描述，你想要编写自己的进一步的控制文件将必须参考该手册。

我发觉下定决心要做一件事，那就当然做得到。一直以来我都避免做 Packaging 方面进一步的研究或者说学习，而是借助于更简便的途径来做分发（比如放在 GitHub Releases 你下载就好了），但简便或许就意味着用户的不简便，这就是最终我必须面对专业 Packaging 途径的原因。但既然做了一些研究，那很容易就能发现一些资源就在那里，但没有人会刻意提示你某些东西在哪里。怎么办呢？一般来说找到 usnet 这样的专业的新闻组，提出问题时得到有用指示的概率比较大。但面向消费者的例如 quora 不见得是好选择。我必须提示的是，Discord 或者 dev.to 在面对我所介绍的这些有关 Packaging 的细碎问题也没有太多帮助。当然，终究你得借助于 Google 才能找到我所说的那些渠道，也包括那些有用的博文。同样地，我的，我想，对于有的人来说，这样的真正介绍到要点的文章也理应是会很有用的。



### 参考

- [Debian 新维护者手册](https://www.debian.org/doc/manuals/maint-guide/)
- [Debian Policy Manual](https://www.debian.org/doc/debian-policy/)
- [Debian FAQ](https://www.debian.org/doc/manuals/debian-faq/ch-pkg_basics.en.html)
- [Building a Debian (`.deb`) source package, and publishing it on an Ubuntu PPA – Saverio Miroddi](https://saveriomiroddi.github.io/Building-a-debian-deb-source-package-and-publishing-it-on-an-ubuntu-ppa/) 
- [Creating and hosting your own deb packages and apt repo](https://earthly.dev/blog/creating-and-hosting-your-own-deb-packages-and-apt-repo/)
- [gpg-short-guide](https://hedzr.com/security/gpg/gpg-short-guide/)
- [从零开始制作 deb 文件](https://hedzr.com/packaging/deb/creating-deb-file-from-scratch/)






:end:

