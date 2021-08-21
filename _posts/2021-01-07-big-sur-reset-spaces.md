---
layout: single
title: 'macOS重置虚拟桌面'
date: 2021-1-7 09:36:00 +0800
last_modified_at: 2021-1-7 09:36:00 +0800
Author: hedzr
tags: [macOS, big sur, crash, reset, spaces, virtual desktops]
categories: lifestyle review
comments: true
toc: true
header:
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(255, 255, 255, 0.5)
excerpt: >-
  无效的虚拟桌面，big-sur 的后遗症，...

---



## 引子

有时候，尤其在意外崩溃后，在 Mission Control 中会看到无法关闭的虚拟桌面，这些桌面没有关闭按钮，完全黑屏，无法去掉。

![Screen Shot 2021-01-07 at 09.38.44](https://i.loli.net/2021/01/07/YcgnqZFeC5bhwpA.png)

在上图中最右侧的 iTerm 是完全黑屏的，鼠标放上去也不会有关闭按钮，你将完全无法处理这个桌面。

为了将它们去除，需要如下的办法。





### 清理虚拟桌面

1. In terminal

   ```bash
   rm ~/Library/Preferences/com.apple.spaces.plist
   ```

1. Restart os

立即重启非常重要，不要犹豫

> [macos - Easy way to delete all virutal desktops in OS X - Super User](https://superuser.com/questions/1024639/easy-way-to-delete-all-virutal-desktops-in-os-x) 





### 更无理的办法

有的时候，上面的办法不能生效，你仍然会看到无法关闭的虚拟桌面顽固地出现在 misson control 的上方列表里。

此时你需要增加一条指令，然后再重启：

```bash
rm ~/Library/Preferences/com.apple.spaces.plist
rm ~/Library/Preferences/com.apple.dock.plist
```

注意，重启后你的 Dock 会被重置为初始状态，自动隐藏或者Dock尺寸等等将会复原，你移动的、增删的 apps 都会复原到原始状态。这是强行重置虚拟桌面所付出的代价。



## :end:

我尚未遇到上述两个方法仍不能消弭的不可 reset 的虚拟桌面。







