---
layout: single
title: '对 dotfiles 备份的几种方法'
date: 2025-12-31 01:00:00 +0800
last_modified_at: 2025-12-31 12:25:00 +0800
Author: hedzr
tags: [shell,skills]
categories: devops bash
comments: true
toc: true
header:
  teaser: /assets/images/unsplash-gallery-image-3.jpg
  overlay_image: /assets/images/unsplash-gallery-image-3-th.jpg
  overlay_filter: rgba(32, 32, 0, 0.3)
excerpt: >-
  罗列几种流行的备份 dotfiles 的方法 ...
---



作为全年终结的最后一日，姑且将 dotfiles 备份问题梳理一遍记录下来吧。

## dotfiles 管理

### 配置文件有哪些

对于 macOS/Linux 作为工作环境的人来说，自己惯用的工作环境基本上可以包含如下这些文件：

- Shell 环境文件，例如 .bashrc，.zshrc 等等
- 终端应用的配置，通常在 ~/.config 中，或者 ~/.npmrc 这样，也有的在 ~/.local/share/nvim 这样的文件夹中
- XDG 文件夹，例如 XDG_CONFIG_DIR 和 XDG_DATA_DIR，实际上在大多数 Linux 和 macOS，它们被解释到 `~/.config/<app>` 和 `~/.local/share/<app>` 等位置。

对于 macOS 来说，下面的位置也可能包含 app 的有效配置数据：

- `~/Library/Preferences`
- `~/Library/Application Support`

少数 macOS apps 可能需要系统级别的配置数据如下列位置：

- `/Library/Preferences`
- ...

例如 VMware Fusion 就需要系统级别的关于虚拟网络设置方面的配置数据在 `/Library/Preferences` 中。

### 如何备份它们

对于上面这些位置的配置数据来说，比较流行的备份与恢复方案有以下三种

- GNU Stow - link mode
- mackup - copy mode
- barerepo+alias (裸仓库别名法)

Mackup 其实有两种工作模式：copy 模式和 link 模式。

copy 模式将 dotfilles 复制到另一地点，实现的是一种备份机制；link 模式则是将 dotfiles 移动到另一位置，然后反向链接回到原位置，从而将各种 dotfiles 的原始内容集中到一个统一的地点，以便于纳入 git 管理。

mackup 的 copy 模式不仅仅备份你的 `.config/fish`这样的目录，同时也能够备份你的 macOS apps preferences，且能深入备份诸如 Typora，Brave Browser 等等的专有 preferences（通常存储于 `~/Library/Application Support` 之中）。

Stow 完全实施 link 模式。

### 裸仓库别名法

ArchWiki 推荐的是另一种名为裸仓库别名法的方案，这种方案在 `$HOME/.dotfiles` 建立一个 git bare repository，然后将诸如 `~/.config/fish`，`~/.bashrc` 以及 `~/zshrc` 等配置文件 add 到该仓库中纳入版本化管理体系。为了便于操作，通常你应该像这样初始化：

```bash
$ git init --bare ~/.dotfiles
$ alias dotfiles='/usr/bin/git --git-dir="$HOME/.dotfiles/" --work-tree="$HOME"'
$ dotfiles config status.showUntrackedFiles no
```

其中 alias 命令应该被加入到你的 `~/.bashrc` 以及 `~/zshrc` 文件中以便今后使用。

上面的命令序列完成了 `$HOME/.dotfiles` 的初始化，`showUntrackedFiles=no` 的设定是为了防止 git 尝试去列举 HOME 文件夹下的其它子文件夹，这可能会是相当庞大的和耗费性能与时间的。

然后，例如你需要备份 fish 配置，那么执行：

```bash
dotfiles add ~/.config/fish
dotfiles commit -m 'added fish config files'
```

就可以了。

当你的 fish 配置修改后，使用 `dotfiles` status 能够查看到相应的变更，此时：

```bash
dotfiles add .
dotfiles commit -m 'fish config modified: updated background color'
```

就可以版本化存储上述变更。

无需担忧 `~/.config` 下其它文件夹的干扰，无需额外配置 .gitignore 文件去排除 `~.config`下的其它文件夹。

对于 bash 配置文件也可以同样处理：

```bash
dotfiles add ~/.bashrc ~/.bash_profile ~/.profile
dotfiles commit -m ;added bash config files'
```

你甚至也可以版本化命令历史：

```bash
dotfiles add ~/.bash_history
dotfiles commit -m ;added bash history files'
```

不过，这个文件的变化非常频繁，因为你每输入一条命令它就会储存一次变化（不考虑性能原因的内部缓存的话），所以将其纳入管理需要审慎决定。

#### 参考

- [dotfiles - Arch Linux 中文维基](https://wiki.archlinuxcn.org/zh-hk/Dotfiles)

- [Ask Hacker News: What do you use to manage your dotfiles?](https://news.ycombinator.com/item?id=11071754)

- [Derek Taylor / Dotfiles · GitLab](https://gitlab.com/dwt1/dotfiles)

  DT 介绍了裸仓库别名法的一种实作方法，并且提供了他自己的 dotfiles 仓库供你验证。

- [How to Store Dotfiles - A Bare Git Repository | Atlassian Git Tutorial](https://www.atlassian.com/git/tutorials/dotfiles)

- [Managing dotfiles with style with rcm](https://distrotube.com/guest-articles/managing-dotfiles-with-rcm.html) (Ronnie Nissan)

- [Interactive dotfile management with dotbare](https://distrotube.com/guest-articles/interactive-dotfile-management-dotbare.html) (Kevin Zhuang)



### Stow 方法 - link 模式

按照 GNU Stow 自己的想法，它是一个软件包发布时刻的符号链接管理器，它是为了便于在按照 GNU 软件包如 GNU emacs 等的时候方便地建立符号链接的工具。对于 emacs 而言，其所有的 released files 通常被安装到 `/usr/local/emacs` 之下，并构成如下的目录结构：

```bash
/usr/local/emacs
  bin
  include
  share
    man
```

而在安装时刻，stow 可以帮助建立 `/usr/local/emacs/bin/emacs` 到 `/usr/bin/emacs` 的符号连接，类似地，`/usr/local/emacs/share/man/man1` 也被链接到 `/usr/man/man1/emacs`  以便于系统能够搜索到 emacs 所提供的 macpages。

但是同时，stow 也能被拓展应用到管理 dotfiles。

前面也扼要介绍过，可以通过 `stow --adopt fish` 将 `$HOMNE/.config/fish` 的相关配置文件移动到 target dir，对于 target dir = `$HOME/dotfiles` 来说，该命令将会移动 fish 文件夹中的文件到 `$HOME/dotfiles/fish/` 之下，然后逐一反向符号链接到原来的位置。例如 `$HOME/.config/fisg/config.fish` 会被移动为 `$HOME/dotfiles/fish/config.fish`，然后新的符号链接文件 `$HOME/.config/fisg/config.fish`  将被建立为指向到 `$HOME/dotfiles/fish/config.fish`，从而完成转换过程。

你可以将 fish，bash，zsh，nvim，mc 等软件的配置文件一一 adopt 到自己的 target dir 之下。当这一过程全部完成之后，你的 dotfiles 文件的内容实体就全部被移入了 `$HOME/dotfiles` 之下了。现在，你无需再去做其它的工作了，只需要将 `$HOME/dotfiles` 建立为一个 git repo，就可以集中管理这些配置文件的变更了。

[gnu.org/software/stow](https://www.gnu.org/software/stow/) 也有一系列辅助命令来帮助进行相应的管理工作。例如：

- `-d` 指定 stow 文件夹，通常为 `$HOME`
- `-t` 指定 target 文件夹，取决你的需要，但常常为 `$HOME/dotfiles`
- `-D` 移除已创建的文件树
- `-S` 创建指定的文件树
- `-R` 移除并重新创建指定的文件树
- `--ignore=regexp` 忽略`stow dir`下指定匹配模式的文件
- `--defer=regexp` 跳过`target dir`下指定匹配模式的文件
- `--override=regexp` 强制替换`target dir`下指定匹配模式的文件
- `--no-folding` stow 默认创建最少的符号链接。这一选项会使 stow 逐一创建每一个文件的符号链接，而不是创建一整个文件夹的链接。
- `--dotfiles` 在 stow dir 下的文件名如果有`dot-`前缀，在创建链接时，链接名字会替换为以`.`为前缀， 比如：`～/.zshrc -> dotfiles/zsh/dot-zshrc`

GNU Stow 有一定的破坏性，你需要小心解决冲突，并记住不要重复 adopt 某个配置文件夹。

### Mackup 方法 - copy 模式

Mackup 是专门进行配置文件备份与恢复的工作的工具。

我们已经提及 Mackup 有两种备份逻辑，即 copy 模式和 link 模式。

Link 模式工作类似于 Stow 所做的那样，将配置文件移入 target file 然后符号链接回去。这种模式通常使用如下一组命令：

- `mackup backup`

  进行备份操作

- `mackup restore`

  进行数据的恢复

- `mackup list`

  查看支持的软件列表

- `mackup -h`

  查看帮助命令

- `mackup uninstall`

  将配置文件拷贝回原来的系统目录并放弃备份副本

此外，你需要在 `~/.mackup.cfg` 中指定 target dir，当然也可以在命令行参数中指定。

Copy 模式则不会修改你的原始 dotfiles，而是将它们复制到目的地（除了指定本地文件夹之外，也可以指定 iCloud，Google Drive，Dropbox 等等网络存储位置）。

Mackup 作为专门备份配置文件的工作，有一套自己的逻辑，即通过建立 `~/mackup/app.cfg` 的方式来自定义你的 app 应该有哪些文件被收集和备份。例如 Kitty 终端的配置文件 kitty.cfg 可以这样自定义：

```bash
[application]
name = kitty

[configuration_files]
# .config/kitty

[xdg_configuration_files]
kitty
```

而 ssh 的配置文件可以定义如下：

```bash
[application]
name = SSH

[configuration_files]
.ssh
```

如此一来，无论你的 apps 有什么样奇葩的位置，都可以被纳入 mackup 的管理范畴中。

更为友好的消息是，mackup 有庞大的社区贡献的配置集合，多数都被整合到了 mackup 的安装包中，安装后即可得。所以大多数常见的软件的配置文件在哪里，如何被收集都已经设定好了，无需你再来自行重定义了。

当然如果你有一个小众软件，就可能需要上面的方法来自行定义一个了。

另外一个特色是，例如你在使用 macOS，那么 GUI apps，例如 Google Chrome，Brave Browser，Typora，VSCode，VSCode Insider，VSCodium，Sublime Text，TextMate 等等均能够被自动备份。Mackup 能够深入到 `$HOME/Library/Preferences` 和 `$HOME/Library/Application Support` 中去收集这些 apps 的配置文件并加以备份，而不是仅仅限于 `$HOME/.config` 之下。

对于 Copy 模式来说，通常你需要执行命令：

```bash
mackup --verbose --force backup
```

它将会收集上述的各种配置数据，然后备份到指定的 target，无论你指定了什么样的 provider。



## 比较

Mackup 适用于如下场景：

- 需要全面备份各类 apps（terminal or gui）的 macOS 配置数据
  - 实际上也适合于 windows 或者 linux
- 具有多态 macOS 设备并希望共享配置数据，或者希望实时同步变更
- Linux 工作环境

Mackup 可以向多种 storage providers 实施备份工作，包括 iCloud，S3，Dropbox 等等，同时它支持自动识别相当一部分 gui apps（例如 Chrome 的 settings）的配置数据，而且社区贡献了大量的 apps 的配置文件提取方案（这些方案被整合到 Mackup 中，所以才能自动识别出不同 apps 的配置文件在哪里能被找到），实际上你也往往会需要对个人的特殊数据编辑方案来提示 Mackup 对其进行备份。

由于这些原因，Mackup 成为独一无二的备份软件。

然而， Mackup 像云存储备份的时候，存在一些边界性的问题。

> 在向 iCloud、Dropbox、Google Drive 等公网同步存储备份时，需要特别注意不要连续发布 mackup backup 命令，因为过于密集的 mackup backup 命令可能会导致将相同的文件在 iCloud Storage 的本地映射文件夹中重复创建数个副本（例如重复拷贝 config 可能导致 config 2 新文件被创建）。
>
> 这是因为 iCloud Storage 可能尚未实施该文件（例如 config）的上传任务，所以该文件在本地映射文件夹中可能是一个名为 .config.xS6dhkZQ 的占位符文件，这就导致第二次 mackup backup 指令判定需要重复复制一份到 iCloud Storage 中，此时 iCloud Storage 接收到新请求的同时发现 config 是存在的（存在于上传队列中和虚拟视图中），于是就是创建一个副本文件 config 2。
>
> 这不是仅有 iCloud 的错误或者存在的问题，所有的远程存储都难免发生这样的时间差因素的错误或者问题。当你越过本地文件系统和远程存储的本地映射盘边界进行大批量文件复制操作时，上述问题较为容易发生，因为文件系统的拦截器将会拦住你的请求，重新解释为远程存储的推送请求，中间的时间差问题是导致错误的根源，且这样的根源性问题基本上是无解的。
>
> 解决的办法是降低你的手动行为的频次。
>
> 而对于由系统管理的正常的修改和更新，iCloud 等远程存储并不会出错，因为通过 File System 的变更日志报告，它们并不会获得不正确的请求。
>
> 上述错误的技术性探讨涉及到 File System，FUSE，inode 等操作系统中的特定子系统的 hook 与实现细节，本文不再加以展开。

Mackup 主要的 copy mode 的能力，从技术上存在如下问题：

1. 无法实时备份
2. 借助于云存储实现的全自动备份可能存在重名隐患
3. 你可能需要设置 crontab 计划任务来自动化备份
4. 采用类似于 inotify 的技术进行准实时备份，存在不稳定或通知事件丢失的问题

对于 Stow 的 link 方式，存在一定的风险，你需要时刻谨记自己的原始文件在何处，当前出于何种状态，以防止某些误操作将原始文件清除：

1. app 不能正确识别 linked file 而发生错误
2. app 无法正确识别 linked directory 从而产生较为严重的错误
3. 意外的操作导致 links 覆盖 originals，从而带来 contents 丢失





### 后记

如果你希望做 macOS 中配置文件的全面备份，则 Mackup copy 模式是优胜选项。备份的内容可以很方便地在你的多台 macOS 设备之间进行同步，并且非常安全。

如果你只有有限的配置文件和文件夹需要被集中管理，也 可以考虑采用 GNU Stow，简便易用，只需要牢记这些文件被集中的状态即可。

如果你的 dotfiles 可能有一定的规模，而且有时候你需要在各种设备之间共享一部分或全部这些配置文件时，那么裸仓库别名法可能是比较好的选择。

此外，我们还没有提及敏感信息的问题。

[git-crypt](https://github.com/AGWA/git-crypt) 提供一种透明加密的能力，可以让你的公开 repo 中的敏感信息不至于泄露。





🔚