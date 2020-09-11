---
layout: single
title: '开发环境中的技巧'
date: 2020-09-07 00:07:11 +0800
last_modified: 2020-09-07 00:27:11 +0800
Author: hedzr
tags: [development, skills, tricks]
categories: develop tricks
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-9.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  对于个人的开发环境，有时候一些小的技巧很难再被记住了，所以只好收录在某处 ...

#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---



# 开发环境中的技巧

> 对于个人的开发环境，有时候一些小的技巧很难再被记住了，所以只好收录在某处

>
>
>
>
> 





## Install golang 1.12 on ubuntu 18

https://gophp.io/how-to-install-go-1-12-on-ubuntu-18/

```bash
sudo add-apt-repository ppa:longsleep/golang-backports -y
sudo apt-get install -y software-properties-common
sudo apt-get update 
sudo apt-get install -y golang-1.12
echo 'PATH="$PATH:/usr/lib/go-1.12/bin"' >> ~/.profile
source ~/.profile
go version
```



## ssh to windows x linux sub-system

https://www.illuminiastudios.com/dev-diaries/ssh-on-windows-subsystem-for-linux/



## Install zsh and ohmyzsh - WSL

```bash
sudo apt install -y zsh zsh-doc
chsh -s /bin/bash
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

https://github.com/ohmyzsh/ohmyzsh/wiki/Installing-ZSH

https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins

在 [Oh-My-ZSH wiki](https://github.com/robbyrussell/oh-my-zsh/wiki/Plugins)[27](https://www.zcfy.cc/article/become-a-command-line-power-user-with-oh-my-zsh-and-z#27) 上可以看到完整的插件列表。

Z 高级命令的完整列表，可以访问这个 [GitHub 仓库](https://github.com/rupa/z)[29](https://www.zcfy.cc/article/become-a-command-line-power-user-with-oh-my-zsh-and-z#29)，或者观看关于 Z 的命令行高手视频。

https://www.zcfy.cc/article/become-a-command-line-power-user-with-oh-my-zsh-and-z







## Convert Newline to LF, From CRLF



```bash
brew install dos2unix
find . -type f -print0 | xargs -0 dos2unix
```



## Disable word-wrap in a Terminal



### macOS

lifted directly from https://apple.stackexchange.com/a/210666/115119

Props to [@michid](https://apple.stackexchange.com/users/13158/michid)

**Disable line wrapping:**

```bash
tput rmam
```

**Enable line wrapping:**

```bash
tput smam
```



### Linux

Found a [good answer from superuser](https://superuser.com/a/600694/134634), that works out of the box for `gnome-terminal`, and probably for other terminals as well:

```bash
setterm -linewrap off
```



You can disable line wrapping for `less`, `tail` and every other command under the Linux sun with:

```bash
tput rmam
```

To restore line wrapping use:

```bash
tput smam
```









## Uninstalling Visual Studio for Mac

https://docs.microsoft.com/en-us/visualstudio/mac/uninstall?view=vsmac-2019

卸载 Visual Studio for Mac







## macos delete old days in time machine

### How to delete older Time Machine backups

[Delete a file from your Time Machine backup disk - Apple ...](https://support.apple.com/guide/mac-help/delete-a-file-time-machine-backup-disk-mh26863/mac)

[How to delete older Time Machine backups | iMorewww](https://www.imore.com/how-delete-older-time-machine-backups)

[How can I manually delete old backups to free space for Time Machine?](https://apple.stackexchange.com/questions/39287/how-can-i-manually-delete-old-backups-to-free-space-for-time-machine)

Be careful with sudo and making sure you pick the correct Mac's files since there is no undo or confirmation of the following command:

```
sudo tmutil delete /Volumes/drive_name/Backups.backupdb/old_mac_name
```

The sudo command needs your password (and it won't echo to the screen, so just type it and pause to be sure you're dating the correct files before pressing enter). If you want to be safer, you can pick one snapshot to delete first to be sure the command works as intended. This is nice since it could take hours to clean up some larger backup sets and you want to leave the Mac confident it's deleting the correct information store.

You can use the `tmutil` tool to delete backups one by one.

```
sudo tmutil delete /Volumes/drive_name/Backups.backupdb/mac_name/YYYY-MM-DD-hhmmss
```

Since `tmutil` was introduced with Lion, this will not work on earlier OS versions.

If you want to get the current directory of backups (there can be multiple destinations defined and only one will be "current")

```
sudo tmutil machinedirectory
```



### [Fastest way to delete all Timemachine Backups for a machine](https://apple.stackexchange.com/questions/33314/fastest-way-to-delete-all-timemachine-backups-for-a-machine)

If you've got:

> Operation Not Permitted

after executing

```
sudo rm -rf Backups.backupdb
```

you should follow this [approach](https://superuser.com/questions/162690/how-can-i-delete-time-machine-files-using-the-commandline/387464#387464), which is adding `bypass` before the remove command:

```
sudo /System/Library/Extensions/TMSafetyNet.kext/Contents/Helpers/bypass rm -rfv Backups.backupdb
```



[How to delete old Time Machine backups on a Mac computer in 2 ways, to free up storage space](https://www.businessinsider.com/how-to-delete-backups-on-mac)

[How to delete (tmutil delete) all old backups from TimeMachine - keep only current full backup](https://apple.stackexchange.com/questions/281614/how-to-delete-tmutil-delete-all-old-backups-from-timemachine-keep-only-curre)







🔚