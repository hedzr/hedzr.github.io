---
layout: single
title: '好像解决了，Big Sur频繁崩溃问题'
date: 2021-1-6 02:33:00 +0800
last_modified_at: 2021-1-6 15:29:00 +0800
Author: hedzr
tags: [macOS, big sur, crash]
categories: lifestyle review
comments: true
toc: true
header:
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(255, 255, 255, 0.5)
excerpt: >-
  最近一个多月，饱受崩溃之苦，...

---



## At This Time

### 悲催的 Big Sur

之前收到了推送之后，因为忙于别的事情，随手就升了。然后一个多月以来饱受了 Big Sur 的摧残。

很多软件迟迟没有更新版来适配，有的干脆没有更新了，这些问题算是小事。

整体反应变得有点笨重，这也罢了。

不能忍的是总是毫无征兆地莫名地死了，然后重启，然后嘭的一声开机声，夜半三更会吓skr。吓skr也就算了，问题是一旦重启，往往在45分钟内会连续不断地崩溃重启5、6次甚至更多。

我不必向你强调挂着TM盘工作已经成为了我的常态。我也不必向你强调能过得过我一直没有决定降级回去。因为降级意味着我工作内容的更新部分就会丢失，对于一个工作内容可能到处都是的人来说，这是根本不可能靠TM+回忆来重建的。

### 无限重装失败中

昨天，是令人难忘的一天。

因为昨天崩溃后，我决定进恢复模式重装 big sur，因为网传重置重装能够解决 crash 问题。于是我开始了重装过程，然后安装进程提示我发生了个错误，不能安装了。我重启，cmd+R 想要去重新再来安装。在恢复模式的登录屏我的密码验证失败，那一瞬间冷汗都出来了。

原来安装失败时，别试着进恢复模式了，只需要令其重启，回头安装进程会接管任务继续进行没有成功的安装。

好吧，再试试。连续试了5、6次还是7、8次？全都无一例外地再次弹出那个错误，没有任何帮助信息，反正就是不能安装了。

MD还是只有出冷汗了。这特么就是无解的死锁啊。折腾到了凌晨3点，我开始构思去天才吧报修的问题了，眼睛都睁不开了，准备放弃了。自从开始使用 MBP 以来，换了两台了，也有好多年了，从未有今次这么衰的时候。我最惨的时候也就是15年版的 MBP 电池鼓包，于是买了第三方电池自己换。这一次莫名其妙地升级遇到最终开不了机，安装不下去，也是没谁了。

话说准备睡了，最后一次关机，冷启，回到安装循环，结果它走下去了。OMG！又30分钟后，完成了登录进入我的工作区时，还是很激动的——哪怕接着又crash了又reboot了，也仍然很激动。

### 解决问题

重复了两次reboot之后，我继续点击按钮发送崩溃报告给Apple，刚刚点击 send，又TM崩了！

这样不行。

于是我耐下性子，认真寻找解决办法。提前汇报，我最终解决了问题，进入到了稳定的状态。

#### 排查顺序

下面是我解决问题所依赖的排查顺序：

1. 在 Mac 上[使用“Apple 诊断”](https://support.apple.com/zh-cn/HT202731)查看是否存在硬件问题。

2. 断开所有外围设备（例如，硬盘驱动器和打印机等）的连接。

3. 确保 Mac [安装所有可用的软件更新](https://support.apple.com/zh-cn/HT201541)。（重要：在更新前，请[备份您的 Mac](https://support.apple.com/zh-cn/mac-backup)。）

4. 确保您安装的所有 App 均来源于 App Store 或软件官网，并已更新至最新版本。

5. 确保 Mac 拥有足够的[储存空间](https://support.apple.com/zh-cn/HT206996)。

6. 尝试[使用“活动监视器”检查 CPU 活动](https://support.apple.com/zh-cn/HT201464)，并退出所有存在故障的进程（如果有的话）。

7. 如果可能，尝试卸载意外退出的 App 并重新安装，查看问题是否依然出现。（重要：卸载前请备份好 App 内的数据。）

8. 尝试[重置 Mac 上的系统管理控制器(SMC)](https://support.apple.com/zh-cn/HT201295)。

9. 尝试[重置非易失的随机访问存储器(NVRAM)](https://support.apple.com/zh-cn/HT204063)。

10. [以安全模式启动](https://support.apple.com/zh-cn/HT201262)以查看问题是否与非 Apple 启动项、登录项或内核扩展有关。

11. 尝试

    创建一个新的管理员帐户

    ，使用新建的管理员帐户登录以便查看问题是否仍然存在：

    1. 选取屏幕左上角的“苹果菜单”()>“系统偏好设置”>“用户与群组”。
    2. 点按左下角的锁形图标，输入现有管理员名称和密码将其解锁。
    3. 点按用户列表下方的添加(+)按钮，在“新帐户”弹出式菜单中选择“管理员”。
    4. 输入新管理员用户的全名和密码，然后点按“创建用户”。



#### 参考材料

您可以参考以下知识文章：

[如果 Mac 上的 App 停止响应或意外退出](https://support.apple.com/zh-cn/guide/mac-help/mchlp2579/mac)



若前面的排查操作未能解决您的问题，请联系 Apple 支持来获得更多协助。请点击以下链接，选择“Mac”：[﻿](https://getsupport.apple.com/)[https://getsupport.apple.com](https://getsupport.apple.com/)[ ﻿](



##### More

- [如何重置 Mac 的 SMC - Apple 支持](https://support.apple.com/zh-cn/HT201295)

-  [重置 Mac 上的 NVRAM 或 PRAM - Apple 支持](https://support.apple.com/zh-cn/HT204063) 

-  [如何在 Mac 上使用安全模式 - Apple 支持](https://support.apple.com/zh-cn/HT201262) 

-   [使用“Apple 诊断”测试您的 Mac - Apple 支持](https://support.apple.com/zh-cn/HT202731) 

-  [升级big sur之后非常多的软件闪退 - Apple 社区](https://discussionschinese.apple.com/thread/252099740) 

-  [Big Sur系统回退降级。哪里下载Catal… - Apple 社区](https://discussionschinese.apple.com/thread/252144677) 

   可以通过以下连接下载

   [如何获取旧版 macOS - Apple 支持](https://support.apple.com/zh-cn/HT211683)

   以下来自 App Store 的安装器会在您下载后自动打开：

   - [macOS Catalina 10.15](https://itunes.apple.com/cn/app/macos-catalina/id1466841314?ls=1&mt=12) 
   - [macOS Mojave 10.14](https://itunes.apple.com/cn/app/macos-mojave/id1398502828?ls=1&mt=12) 
   - [macOS High Sierra 10.13](https://itunes.apple.com/cn/app/macos-high-sierra/id1246284741?ls=1&mt=12) 

   也可以通过网络恢复系统

   [如何通过 macOS 恢复功能重新安装 macOS - Apple 支持](https://support.apple.com/zh-cn/HT204904)

-  [如何重新安装 macOS - Apple 支持](https://support.apple.com/zh-cn/HT204904) 

-  [big sur如何回滚到之前？ - Apple 社区](https://discussionschinese.apple.com/thread/252062303) 

   只能备份数据恢复系统

   - 可以通过网络恢复[如何通过 macOS 恢复功能重新安装 macOS - Apple 支持](https://support.apple.com/zh-cn/HT204904)

   直接时间机器恢复，如果没有的话，开机的时候同时按住shift+option+command+R进入网络地球，选择网络，过一段时间就能进工具，然后就可以抹盘，安装Catalina了。

   以上的办法可以回滚，但需要**抹盘**

-  [Big Sur版本回退到Mojave - Apple 社区](https://discussionschinese.apple.com/thread/252048771) 

   可尝试备份数据可通过网络恢复系统

   通过网络恢复[如何通过 macOS 恢复功能重新安装 macOS - Apple 支持](https://support.apple.com/zh-cn/HT204904)

   

#### 我遇到的问题的原因

我排查了 VirtualBox，上网工具，Todoist，uPic，nextcloud，各种驱动，FUSE，等等等等。过程一言难尽，采用的方法是：

先做了重置，借助恢复模式中的磁盘工具做了 First Aid 修复；

然后建立了新管理员，发现那边不会崩溃（IINA拖拽视频进度条会很容易复现崩溃现象），于是开始两个账号之间频繁地注销、登录、比较启动项。

所有的同步盘客户端，上网工具都被去掉，启动项清空了也没能解决问题。

然后我痛下决心，开始手工检查全部系统项目：

```bash
~/Library/Application Support
~/Library/ApplicationSupport/ChrashReporter
~/Library/ApplicationSupport/System Preferences
~/Library/Caches
~/Library/LaunchAgents
~/Library/PreferencePanes
~/Library/Preferences
/Library/Application Support
/Library/Caches
/Library/Contextual Menu Items
/Library/DirectoryServices/Plugins
/Library/DriverExtensions
/Library/Extensions
/Library/FileSystems
/Library/Input Methods
/Library/LaunchAgents
/Library/LaunchDaemons
/Library/PreferencePanes
/Library/Preferences
/Library/Printers
/Library/PrivilegedHelperTools
/Library/QuickLook
/Library/Screen Savers
/Library/ScriptingAdditions
/Library/Scripts
/Library/Security
/Library/StartupItems
/Library/SystemExtensions
```

经过了一番不必赘述有多么痛苦的过程，我最终认为找到了罪魁祸首：

鼠须管输入法。

这个输入法是我在不敢使用大陆商业公司的任何输入法，却又想在内置输入法之外有一个后备选项的目的下安装的。实际上它的优点就在于干净卫生且支持 shift。但因为培养习惯的原因其实我并不怎么用它，也几乎忘记了我还安装了这么一个输入法。

所以我新建的管理员呢账户中为什么没有发生崩溃现象？就是因为输入法里面预置的只有 Apple 拼音和英文。

确认祸首的过程也并不容易，因为实际上并不知道什么情况下一定会发生崩溃，IINA那个拖拽并不是一定会崩，也不是任何视频都会崩，只是概率较大而已。

所以现在我能确定系统很稳定了，因为到现在为止我已经蹂躏了数个小时了，各种地。所以我确实认为已经找到了原因：只要把鼠须管加到账户中的输入法列表中，哪怕你不激活它做输入，你甚至无需按键盘，只是鼠标动，也有极大概率会崩，而如果从输入法列表中删除它，reboot去掉其影响后，无论怎么操办，我都还好好滴活着。

## 后记

我无意研究为何鼠须管在 Big Sur 中竟然会导致停机反应。这已经不重要了。

所以什么事都惹不起认真，在一堆文件夹中挨个寻找、查证疑犯，真的是需要认真二字的。

我终于可以恢复到正常工作状态了，这个多月来，代码、文章全数停滞——随时不知道崩不崩的时候实在是没法专心做技术。

> 还要提一提的是，我的TM盘也在无数次（我觉得这个多月来我经历了300次突然死机崩溃自动重启）重启的过程中坏了，但没钱买新的了：只有WD才有TypeC的移动硬盘，但WD的移动盘质量不行，我已经坏了三块盘了，丢数据丢的心痛，若非习惯性地做多个不同盘的备份的话我还会更心痛。
>
> 这是另一个故事了，我也不打算写了。
>
> 真是很歹势了。





## 🔚



