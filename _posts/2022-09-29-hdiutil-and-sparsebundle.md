---
layout: single
title: "hdiutil 和 sparsebundle"
date: 2022-09-29 05:25:00 +0800
last_modified_at: 2022-09-29 15:10:00 +0800
Author: hedzr
tags: [tech,disk]
categories: tech nology
comments: true
toc: true
header:
  teaser: /assets/images/unsplash-gallery-image-1-th.jpg
  overlay_image: /assets/images/unsplash-gallery-image-1-th.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  hdiutil 和 sparsebundle 以及操作 ...
---





## 引子

这次我们要解决一系列问题：

1. 操作 sparsebundle 镜像文件
2. 操作磁盘镜像
3. 操作额外的分区
4. 解决上述问题的工具 mac-sparse-disk.bash

本文要求你有 macOS 系统在手边，因为这一系列内容都是基于 macOS 中的 sparsebundle 磁盘镜像文件来做事的。



## 第一部分

### 什么是 sparsebundle？

sparsebundle 是一种磁盘镜像文件，它可以由 Disk Utilty 这一 app 来创建。sparsebundle 是一种稀疏磁盘镜像文件。稀疏的含义是预先声明一个 size，但并不实际分配磁盘空间，实际使用的磁盘空间为事实上消耗的内容。

也就是说，我们创建一个 sparsebundle 磁盘镜像文件 `aa.sparsebundle`，它本声明为 10GB 大小，然后我们将其 mount 到宿主系统中的 /Volumes/aa 这个位置，并向内拷贝 1GB 的文件和文件夹，接下来我们 umount 这个装载点。回头再看 `aa.sparsebundle` 的文件大小，它应该是大约 1GB 多一点。

所以 sparsebundle 和 .dmg 的区别就在于你放入多少，它就占用多少。而 .dmg 则不管那么多，声明了 10GB 大小的 .dmg 它就会事实上占用 10GB 的宿主文件系统空间，至于你放入多少内容就没有影响。

以 VM Operator 的视角来看，.dmg 就像是固定尺寸的磁盘镜像文件，而 sparsebundle 就像是动态尺寸的磁盘镜像文件。



### 细分类型

sparsebundle 实际上有两种后缀：

1. `.sparseimage` 稀疏磁盘镜像文件
2. `.sparsebundle` 稀疏束磁盘镜像文件

后者 `.sparsebundle` 自 Mac OS X v10.5(Leopard) 起被引入，它实际上是一种磁盘捆绑（Bundle），就好像 .app 文件一样，其本质是一个文件夹，但附带有 bundle 的特殊文件，所以在 Finder 中被视为一个`文件`，除非你使用右键菜单中的 `Show Package Contents` 功能来显示其真实内容。

`.sparsebundle` 对 Time Machine 更为友好，这是因为它将文件系统表述为一系列 hash 后的 blob 对象文件，在迭代递增性上优于 `.sparseimage` ，后者拷贝一个 0 字节大小的文件进入也会导致整个镜像文件内容的整体变化，不利于渐进备份。由于 `.sparsebundle` 是采用动态映射宿主系统的 blob 对象中的一个区块到内里文件系统的一个文件夹中的文件对象，所以它只能在宿主 APFS 分区中被创建，不过这一点基本上不可能是问题。

对 `.sparsebundle` 的操作总体上来说需要用到内置命令行工具 `hdiutil`。



### Using hdiutil

使用 `man hdiutil` 来查看这个工具的使用手册。

hdiutil 可以操作的是各种镜像文件：`.dmg`， `.sparseimage` 和 `.sparsebundle` 等等。这些镜像文件的操作手法是相同的，只是不同格式的镜像文件带有不同的宿主文件系统上的特性而已。我们前面已经提到过，.dmg 如同一个固定尺寸的磁盘镜像文件，镜像中文件系统的尺寸在宿主文件系统中被预先分配，sparseimage 如同一个动态尺寸的磁盘镜像文件，它和 qemu 的 .raw 类型，整个文件模仿了一块物理磁盘，而 sparsebundle 则是使用一个宿主文件夹以及一系列 hash 过后的 blob 对象来映射文件系统的具体内容。



#### 创建镜像文件

> 以下只介绍命令行操作，如果你关心 Disk Utilty 如何操作，请自行搜索。
>
> See:  [Create a disk image using Disk Utility on Mac - Apple Tugi (EE)](https://support.apple.com/et-ee/guide/disk-utility/dskutl11888/mac) 

从宿主 FS 的某个文件夹创建一个 .dmg

```bash
hdiutil create test.dmg -srcfolder /path/to/folder/
hdiutil create _assets.dmg -srcfolder _assets/
```

创建一个 200MB 的 .dmg

```bash
hdiutil create test.dmg -size 200M
```

创建一个 200GB 的 .sparseimage

```bash
hdiutil create test.sparseimage -size 200G
...
-rw-r--r--  1 hz  admin   7.0M Sep 29 11:38 test.sparseimage
...
```

创建一个 200GB 的 .sparseimage

```bash
hdiutil create test.sparsebundle -size 200G
...
drwxr-xr-x@ 6 hz  admin   192B Sep 29 11:38 test.sparsebundle/
...
```



一旦创建了一个磁盘镜像文件，然后我们就可以装载它、然后如同宿主 FS 那样使用它，事后再卸载它，整体地复制这个镜像到另一个位置。



#### 调整镜像系统的尺寸

Resize 一个镜像文件：

```bash
> hdiutil resize -limits test.sparsebundle
 min 	 cur 	 max
419168256	419430400	18014398509481983

> hdiutil resize -size 500G test.sparsebundle

> hdiutil compact test.sparsebundle
```

第一条命令显示当前的上下限。

第二条命令重新调整内部 FS 的大小到大约 500GB。但这可能不是恰当的，如果内部 FS 并非 macOS 所支持的 FS 的话。我们不建议你在 sparsebundle 或者其他磁盘镜像上进行 resize，取而代之的更好的办法是在初始创建时就声明一个足够的大小，例如，1TB？既然它是动态尺寸的，为什么不事先准备好足够大呢？

第三条命令是压缩镜像内的文件系统。此命令同样并不是总能如预期般地工作，你可以尝试，但不要抱有最高希望。



#### 删除磁盘镜像

磁盘镜像文件可以被 rm 所删除：

```bash
rm -rf test.sparsebundle
rm test.sparseimage
```

其中 `.sparsebundle` 事实上是一个文件夹，所以需要 `-r` 标志。





### 大小写敏感分区

可以有两种方法在你的系统中启用大小写敏感分区。

首先我们需要知道的是，当你需要 checkout 某些源代码例如 linux kernel 时，你首先需要一个大小写敏感分区，因为源码中某些文件是同名的、除了大小写的区别之外。这些文件被存储到你的正常分区时（macOS 默认使用大小写不敏感分区），将会导致存储失败、或者是旧文件内容被替代。

其次一点，一定不要将你的主分区修改为大小写敏感分区。你的宿主环境必须是大小写不敏感分区。这一限制并不是因为 macOS 核心系统不能良好支持敏感分区，而是因为太多常用软件在敏感分区上无法正常工作（包括大多数 Adobe 大型设计软件）。此外，很多小型实用工具软件也不能在敏感分区上良好工作。



#### 第一种方法

在 macOS 上，启用大小写敏感分区的最佳方法是使用 Disk Utilty 工具在主分区上直接 `切割` 一个新的分区，并将其格式化为大小写敏感分区即可。

macOS 允许你在主分区上动态地切割出一个新的分区，无需像 Windows 那样首先resize 主分区以便腾空出 free space，然后分配建立新分区。macOS 可以直接切割，一般来说，根据你的需要，例如 20GB，你可以在 Disk Utilty 中无损地就地完成这一工作。



例如一台 256GB 硬盘的 MBP：

![Open Disk Utility](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/partition-1.png)

首先点击 Partition 按钮，得到如下对话框：

![Partition](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/partition-2.png)

在分区的饼图下方点击加号按钮，给出一个分区名字 `Projects`，选择敏感分区，日志式，然后指定尺寸为 20GB：

![Settings](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/partition-3.png)

> 对于新的 macOS 操作系统来说，现在不在有 Mac OS Extended 分区类型了，取而代之的是 APFS：
>
> - *APFS:* Uses the APFS format. Choose this option if you don’t need an encrypted or case-sensitive format.
> - *APFS (Encrypted):* Uses the APFS format and encrypts the volume.
> - *APFS (Case-sensitive):* Uses the APFS format and is case-sensitive to file and folder names. For example, folders named “Homework” and “HOMEWORK” are two different folders.
> - *APFS (Case-sensitive, Encrypted):* Uses the APFS format, is case-sensitive to file and folder names, and encrypts the volume. For example, folders named “Homework” and “HOMEWORK” are two different folders.
>
>  [File system formats available in Disk Utility on Mac - Apple Tugi (EE)](https://support.apple.com/et-ee/guide/disk-utility/dsku19ed921c/mac) 

接下来，点击 Apply 按钮，确认，然后就可以得到新的大小写敏感分区了。

![Done](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/partition-5.png)

它将被自动装载到 `/Volumes/Projects` 之下。

![Proof](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/partition-7.png)

这种方法最被推荐。

但它有一个问题，你能指定的新分区的大小不能大于物理 SSD 的大小。事实上，由于macOS 系统文件以及用户已使用的空间的原因，新分区大小还要小的多。





#### 第二种方法

使用 sparsebundle 镜像，也可以同样地捆绑一个新的分区进来，同样也可以被装载到 `/Volumes` 之下。

它的优势在于你可以宣告一个足够大的尺寸，甚至超出物理 SSD 的尺寸，例如 500GB。

创建

```bash
hdiutil create -size 500G -type SPARSEBUNDLE -fs 'Case-sensitive Journaled HFS+' -autostretch -volname Projects Projects.sparsebundle
```

装载

```bash
hdiutil attach Projects.sparsebundle
[ -d ./Projects/ ] || mkdir ./Projects
[ -L ./Projects ] || ln -s /Volumes/Projects ./Projects
```

卸载

```bash
hdiutil detach /Volumes/Projects
```

它的问题在于，这个稀疏磁盘镜像文件并不会在下一次启动后被自动装载，而是需要你双击 `.sparsebundle` 文件来手动装载它。当然也可以使用上面的装载命令。

一个可能的办法是使用 launchctl 来新增一条登录后运行命令，将 hdiutil attach 命令写入。或者使用 .zshrc 等机制。

它并不是我的问题，我更喜欢是在要从事 osdev 开发的时候打开 vscode workspace，然后键入 attach 命令行来显式地装载工作区，并开展工作。所以我不在文中提供进一步操作的具体步骤，请自行搜索。





## 第二部分：hdiutl 的其他可能用法

hdiutil 能够操作 .dmg，.sparseXXX，也能操作 .iso 文件。



### 一些用法实例

##### 装载一个 .iso 文件

```bash
> hdiutil attach mydisk.iso
> ls /Volumes
MyDisk
```

##### 你可以建立加密的文件系统：

```bash
> hdiutil create -encryption -size 500m -volname encdata test.dmg -fs HFS+J
```

##### 如果你有刻录机，那么可以将磁盘镜像烧录到光盘上。首先插入可写光盘，然后：

```bash
hdiutil burn test.dmg
hdiutil burn mudisk.iso
```

##### 查看镜像文件的信息：

```bash
hdiutil imageinfo test.dmg
```

##### 当前已装载文件系统信息：

```bash
hdiutil info
```

##### 转换到不同的格式：

```bash
hdiutil convert test.dmg -format UDSB -tgtimagekey sparse-band-size=2048 -o "test-100Mb.sparsebundle"
```



##### 更多信息参考 hdiutil 的帮助手册：

```bash
man hdiutil
```



### -format 取值

UDSB 等等魔术缩写，实际上对应着下表：

```
UDRW - UDIF read/write image
UDRO - UDIF read-only image
UDCO - UDIF ADC-compressed image
UDZO - UDIF zlib-compressed image
ULFO - UDIF lzfse-compressed image (OS X 10.11+ only)
ULMO - UDIF lzma-compressed image (macOS 10.15+ only)
UDBZ - UDIF bzip2-compressed image (Mac OS X 10.4+ only)
UDTO - DVD/CD-R master for export
UDSP - SPARSE (grows with content)
UDSB - SPARSEBUNDLE (grows with content; bundle-backed)
UFBI - UDIF entire image with MD5 checksum
UDRo - UDIF read-only (obsolete format)
UDCo - UDIF compressed (obsolete format)
RdWr - NDIF read/write image (deprecated)
Rdxx - NDIF read-only image (Disk Copy 6.3.3 format; deprecated)
ROCo - NDIF compressed image (deprecated)
Rken - NDIF compressed (obsolete format)
DC42 - Disk Copy 4.2 image (obsolete format)
```







### 小结

限于篇幅，不能对 hdiutil 进行充分的解说，其使用方法一如大多数 macOS 内置命令那样含混不清，模凌两可，所以你需要做更多搜索。







## 第三部分：`mac-sparse-disk.sh`

`mac-sparse-disk.sh` 是一个开源的 repo：[HERE](https://github.com/hedzr/mac-sparse-disk.sh)。它提供一个工具脚本 `mac-sparse-disk.bash`，你可以用它来简化 sparsebundle 镜像文件的操作和管理。

 `mac-sparse-disk.bash` 是基于 [bash.sh](https://github.com/hedzr/bash.sh) 模板开发的工具脚本，包含了针对稀疏镜像文件操作的一系列功能，其主要能力有：

```bash
❯ mac-sparse-disk.bash
mac-sparse-disk.bash <commands>

Commands:
    mac-sparse-disk.bash create [namespace [size [workspace]]]
    mac-sparse-disk.bash mount [namespace]
    mac-sparse-disk.bash umount [namespace]
    mac-sparse-disk.bash attach [workspace]
    mac-sparse-disk.bash detach [namespace]
    mac-sparse-disk.bash compact [namespace [workspace]]
    mac-sparse-disk.bash info [namespace]
        mac-sparse-disk.bash to_image_path|to-image-path [namespace]

Parameters:
    workspace: in general, it's the filename of sparsebundle.
    namespace: the mount point name, the Volume name.
      By default, 'workspace' will be the value of 'namespace' when it missed.

Examples:
    $ mac-sparse-disk.bash create good-test 1g
      create a file named as good-test.sparsebundle, and its size is 1g.
    $ mac-sparse-disk.bash attach good-test
    $ mac-sparse-disk.bash detach good-test
    $ rm -rf good-test.sparsebundle good-test/
    $ mac-sparse-disk.bash info aa              # print info of 'aa', assumed /Volumes/aa has been mounted
    $ mac-sparse-disk.bash to-image-path aa     # print the image-path of volume 'aa' if it's mounted

```



### 基本操作

正常情况下，你需要的是 create, attach, detach 命令。

##### 创建大小写敏感文件系统

``` bash
$ mac-sparse-disk.bash create good-test 1g
```

##### 装载

```bash
$ mac-sparse-disk.bash attach good-test
```

装载镜像文件之后，/Volumes 下会有一个装载点，同时当前文件夹下会有一个链接文件夹指向该装载点，你可以在当前文件夹下直接开始工作。

##### 卸载

```bash
$ mac-sparse-disk.bash detach good-test
```



mount和umount 是 attach、detach 的同义词。



### 从装载点找到源镜像文件

这个功能需要内置命令 `hditutil` 和 `plutil` 的支持，另外还需要一个实用工具 `jq`（可以通过 `brew install jq` 来安装）。

它的功能是反向寻找源头的镜像文件，有时候也许会是有用的。

```bash
❯ mac-sparse-disk.bash to-image-path good-test
/Users/hgjv/Downloads/good-test.sparsebundle
```



## 结尾

更完整的整理没有做了，就是上面这么多了。



:end:

