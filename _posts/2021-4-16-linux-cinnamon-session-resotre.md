---
layout: single
title: "cinnamon session save and restore"
date: 2021-04-16 10:48:00 +0800
last_modified_at: 2021-04-16 10:48:00 +0800
Author: hedzr
tags: [linux, cinnamon, session, save, restore, gnome, dconf-editor, auto-save-session]
categories: devops linux
comments: true
toc: true
header:
  teaser: /assets/images/ubuntuhero.jpg
  overlay_image: /assets/images/ubuntuhero.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
excerpt: "as title said, how to enable desktop session save and restore in cinnamon GUI environment"
---



## For Linux Cinnamon GUI

Here is the steps:

1. Install `dconf-editor` if not exists

   ```bash
   sudo apt-get install dconf-editor
   ```

   **NOTE** that the package name has been changed to `dconf-editor` in newest cinnamon environment.

2. Run `dconf-editor`

3. For Cinnamon:

   1. Navigate into `/org/cinnamon/cinnamon-session/` by clicking on list item
   2. Check `auto-save-session` on the config window
   3. After checked, it looks like:

![image-20210416104021937](https://i.loli.net/2021/04/16/QqlyFe5ZHTsBjur.png)

要在 cinnamon 中启用桌面 session 的保存和自动恢复能力，需要用到 `dconf-editor`，这个工具需要小心谨慎使用：

1. 安装 `dconf-editor`

   ```bash
   sudo apt-get install dconf-editor
   ```

2. 运行 `dconf-editor`

3. 选择条目，以便定位到 `/org/cinnamon/cinnamon-session/` 位置

4. 勾选 `auto-save-session` 选项



## For Gnome

Same as cinnamon, you can enable this feature in gnome environment:

1. Install `dconf-editor` if not exists

   ```bash
   sudo apt-get install dconf-editor
   ```

   **NOTE** that the package name has been changed to `dconf-editor` in newest cinnamon environment.

2. Run `dconf-editor`

3. For Gnome: 

   1. Navigate into `/org/gnome/gnome-session/` by clicking on list item
   2. Check `auto-save-session` on the config window



## CANNOT Work for Newest Ubuntu

It mentioned at https://askubuntu.com/questions/1084389/automatically-remember-current-running-applications

> Ubuntu [dropped session saving](https://lists.ubuntu.com/archives/ubuntu-desktop/2011-January/002734.html) long ago because it never worked well. Gnome Shell, the desktop environment that Ubuntu 18.04 uses, apparently does not support it as such.
>
> - **Sleep** (computer stays on in very low power use mode) and **hibernate** (computer fully shuts down after saving memory to the hard disk, and reloads the memory content on the next startup) to turn off your computer functionally allow the same, i.e. continue later where you left off. Unfortunately, sleep and hibernate may not work well on your hardware. Sleep works in many cases, but hibernate represents issues on many hardware, to the extent that on Ubuntu, the possibility to hibernate is not enabled by default.
> - Alternatively, you may try the well maintained **Gnome Shell extension** [Window Session Manager](https://extensions.gnome.org/extension/1323/window-session-manager/).