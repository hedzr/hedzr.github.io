---
layout: single
title: "cinnamon Fractional Scaling in HiDPI Mode"
date: 2021-04-17 05:40:00 +0800
last_modified_at: 2021-04-17 06:40:00 +0800
Author: hedzr
tags: [linux, cinnamon, hidpi, font scaling, fractional scaling, dconf-editor]
categories: devops linux
comments: true
toc: true
header:
  teaser: /assets/images/ubuntuhero.jpg
  overlay_image: /assets/images/ubuntuhero.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
excerpt: "as title said, how to enable font fractional scaling in cinnamon GUI environment"
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

   1. Navigate into `/org/cinnamon/desktop/interface/text-scaling-factor` by clicking on list item
   2. Uncheck `Use default value` on the config window, and type the number what you want into `Custom value` box, such as 1.25, or others value between 0.5 and 3.
   3. After modified, it looks like:

![image-20210416105506698](https://i.loli.net/2021/04/16/LTdnlfAXgEIRx45.png)



方法如下：

打开 dconf-editor，定位到：`/org/cinnamon/desktop/interface/text-scaling-factor`，将其修改为 1.25，立即就能看到效果，但谨慎地设置 1..2 之间的值，不要设置其他值以免无法恢复可能的错乱显示状态。



## For Gnome

Same as cinnamon, you can enable this feature in gnome environment:

1. Install `dconf-editor` if not exists

   ```bash
   sudo apt-get install dconf-editor
   ```

   **NOTE** that the package name has been changed to `dconf-editor` in newest cinnamon environment.

2. Run `dconf-editor`

3. For Gnome: 

   1. Navigate into `/org/gnome/desktop/interface/text-scaling-factor` by clicking on list item
   2. Uncheck `Use default value` on the config window, and type the number what you want into `Custom value` box, such as 1.25, or others value between 0.5 and 3.