---
layout: single
title: "Windows Server 2019 安装提要 (及 VS 2019 Build Tool)"
date: 2021-08-18 05:15:00 +0800
last_modified_at: 2021-08-18 13:08:00 +0800
Author: hedzr
tags: [windows server, windows server 2019, server core, desktop experience, install, setup, remote desktop, computer name, hostname, file sharing, net use, visual studio 2019 build tool, vs2019 build tool, devops]
categories: devops windows
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/1*Po9vJ6BTPdhvdhO6YuZQHg.png
  overlay_image: /assets/images/windows-server-2019.png
  overlay_filter: rgba(48, 48, 64, 0.86)
excerpt: "Windows Server 2019 (Core, Desktop Expirience, ...) 安装提要，以及 Visual Studio 2019 Build Tool 安装提要..."

---



## The Essentials: After Windows Server 2019 Evaluation Installed



### 试用评估版本

Windows Server 2019 允许试用 180 天，试用到期后还可以重置 5 次以延长评估期，所以这是比较难得的基础工具了。

Windows Server 试用 官网： [这里](https://www.microsoft.com/zh-tw/windows-server/trial)



#### 延长试用期

延长试用期的命令为：

```bash
slmgr.vbs -rearm
```



#### **Windows Server 2019 Evaluation Keys:**

已经知道的用于评估的 Product Key 如下：

Windows Server 2019 Standard

```
N69G4-B89J2-4G8F4-WWYCC-J464C
```

Windows Server 2019 Datacenter

```
WMDGN-G9PQG-XVVXX-R3X43-63DFG
```





### 版本比较：Core 与 Desktop Experience

Windows Server 2019 有多种版本：

首先是大版本的划分：

- Data Center，
- Standard，
- Essentials，（只有 Desktop Experience 小版本）

> 在大版本之外，还有一种 Hyper-V Server 2019 的大版本，只包含 Server Core 小版本），不多提了。

然后是小版本被分为 Server Core 和 With Desktop Exxpirience 两种，其区别在于有没有 GUI 环境。



#### Server Core

对于 Server Core 来说，只有一个命令行盒子的界面：

![image-20210817103618347](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210817103618347.png)

但是，所谓的 no GUI 只是在说没有 GUI 管理工具（例如开始菜单，各种控制面板元素等等），实际上它还是允许你从命令行界面启动 Desktop app 的。例如 Visual Studio 2019 Build Tool 就会被启动和运行在一个独立的窗口界面中：

![image-20210817104553901](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210817104553901.png)

稍后就会有安装管理界面出来。

在 Server Core 中，至少这些应用程序是不兼容的：

- Microsoft Server Virtual Machine Manager 2019 (SCVMM)
- System Center Data Protection Manager 2019
- Sharepoint Server 2019
- Project Server 2019

此外，系统组件中至少这些是不兼容的：Windows Tiff IFilter, Internet Printing Client, RAS Connection Manager Kit, Simple TCP/IP Services, TFTP Client, Windows Search Service, XPS Viewer, 等等.

可以见到不兼容的东西几乎和普通人无关。

除此之外，基本上你可以认为 Core 就是更轻量级一点的版本，它的安装后尺寸大约在 5.1GB 上下，算是比较难得的了。



#### Desktop Experience

而 Desktop Experience 小版本则有完整的 GUI 界面，你可以像操作 Windows 11 或者 Windows NT 那样通过开始菜单进行 GUI 操作，当然也可以打开命令行提示符做工作。

这里有该界面的参考图样：

![img](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/1*Po9vJ6BTPdhvdhO6YuZQHg.png)

> **Windows Server 2019 with Desktop Experience — The Classic Look (e.g. Windows 10 1809)**

安装过程中的截图有这些：

![image-20210817131128654](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210817131128654.png)









#### 小结

所以官方的称呼，在 Windows Server 2019 ISO 的安装界面中能够看到，通常是这样：

1. Windows Server 2019 Standard (Desktop Experience)
2. Windows Server 2019 Standard

所以其中 2 即为 Server Core 版本。



##### 磁盘尺寸占用

Server Core 是更轻量级一点的版本，它的安装后尺寸大约在 5.1GB 上下。

作为参考，一个普通的 Windows 20H2 安装后大约占用 20GB 左右，而一个 Windows Server 2019 Standard (Desktop Expirience) 的安装后尺寸大约为 8.6～9.3GB。



##### 版本比较

官方提供的比较表格在这里：

 [Comparison of Standard and Datacenter editions Windows Server 2019 | Microsoft Docs](https://docs.microsoft.com/en-us/windows-server/get-started/editions-comparison-windows-server-2019) 

如果嫌它太长，那就先看这里：

 [Windows Server 2019 Licensing & Pricing | Microsoft](https://www.microsoft.com/en-us/windows-server/pricing) 







## 安装后提要

### 检查服务器 IP 地址

可以使用 `ipconfig` 或者 `ipconfig /all`

### Enable Remote Desktop on Server Core

在 Server Core 上启用远程桌面

Following are the steps to enable remote desktop on Windows Server core.

按照下面的步骤来启用远程桌面，适用于 Windows Server Core。

Start the Server Configuration Tool, login to your Windows Server ([2016/2019](https://docs.microsoft.com/en-us/windows-server/get-started/sconfig-on-ws2016)) core. Type **SConfig** and press Enter.

登录到你的 Windows Server 2016 或者 2019 core 并运行服务器配置工具：输入 `sconfig` 并回车。

You will find a list of options under Server Configuration. From the list, take a look at option 7 which is for Remote Desktop. Notice that Remote Desktop is currently **Disabled**

你将会看到 sconfig 命令显示了一个选项表。在这个选项表中选择第 7 项，即远程桌面 条目。默认时这一项应该是 “Disabled” 的状态。

![image-20210817100302884](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210817100302884.png)

Press 7 and hit enter. The next line that you see lets you **Enable** or **Disable** remote desktop. To enable the remote desktop, type **E** and press enter key.

按下按键 <kbd>7</kbd> 并 回车(<kbd>Enter</kbd>)。接下来显示行提示你可以启用或者禁用远程桌面。要启用它，按下按键 <kbd>E</kbd> 并回车。

Now you see two options :- 现在你会看到两个子选项

- Allow only clients running Remote Desktop with Network Level Authentication (more secure) 只有启用了增强的网络认证安全的 RDP 客户端才能连接进入（更安全）
- Allow clients running any version of Remote Desktop (less secure) 任何 RDP 客户端都可以连接进入（安全性较低）

Type **1** and press **Enter**. You get a confirmation box for enabling Remote Desktop. Click **OK**.

按下按键 <kbd>1</kbd> 并回车，你会看到一个确认对话框，点击 OK 按钮确认它：

![image-20210817100527299](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210817100527299.png)

Now take a look at option 7, it shows **Remote Desktop Enabled (more secure clients only)**.

现在再来看选项 7，它会显示远程桌面已经启用了（Enabled all clients）。

![image-20210817100546342](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210817100546342.png)

In the next step we will enable the firewall to allow the remote desktop. Type 15 which is an exit to command line.

接下来我们需要在防火墙上允许远程桌面的连接进入。按下按键 <kbd>1</kbd><kbd>5</kbd> 并回车，即选择第 15 选项以便退出 sconfig 的菜单界面，返回到命令行。

Now type the below command and press enter key.

现在输入下面的命令并回车运行它：

```bash
netsh advfirewall firewall set rule group="remote desktop" new enable=Yes
```

You get a line that reads Updated 3 rules.

它会允许远程桌面连接通过。

![image-20210817100720144](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210817100720144.png)



> Original:  [Enable Remote Desktop On Server Core - Prajwal Desai](https://www.prajwaldesai.com/enable-remote-desktop-on-server-core/) 



### 修改服务器的主机名

同样使用 sconfig 命令，第 2 项为修改主机名称（Computer Name）。



### 增加操作员账户

如果不想适用 Administrator 身份登陆，你需要增加自己的操作员账户。还是使用 sconfig 命令，并选择第 3 项（Add Local Administrator）。





### 使能文件共享

下面的命令可以启用文件共享：

```bash
netsh advfirewall firewall set rule group=”File and Printer Sharing” new enable=Yes
```

然后你可以通过管理者共享点的方式连接到 Server Core：

```bash
# in macOS
open 'smb://server-core/admin$'
open 'smb://server-core/c$'
```





### NET USE 命令

 [Net use | Microsoft Docs](https://docs.microsoft.com/zh-cn/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/gg651155(v=ws.11)) 

#### 简单方式

典型的载入 LAN 中的 Samba 资源方式为：

```powershell
net use z: \\hz-pc\downloads password /user:hz
```

用完之后可以删除它：

```bash
net use z: /delete
```

#### /savecred 方式

你可以使用 `/savecred` 来创建盘符，这样今后就无需显式输入 password 和 user 部分了。

```bash
net use z: \\hz-pc\downloads /savecred /persistent:yes
```

一个示例如下：

![image-20210817104138290](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210817104138290.png)

#### 命令行格式

NET USE 命令的标准形式有这几种：

```powershell
net use [{<DeviceName> | *}] \
   [\\<ComputerName>\<ShareName>[\<volume>]] \
   [{<Password> | *}]] \
   [/user:[<DomainName>\]<UserName] >[/user:[<DottedDomainName>\]<UserName>] \
   [/user: [<UserName@DottedDomainName>] \
   [/savecred] [/smartcard] \
   [{/delete | /persistent:{yes | no}}]
net use [<DeviceName> [/home[{<Password> | *}] \
   [/delete:{yes | no}]]
net use [/persistent:{yes | no}]
```

由于我们隐含着上下文为远程连接到一台 windows server 或者 windows server core 服务器，所以 NET USE 命令的持久化形式通常没有意义。在这种上下文中需要用到 NET USE 时一般是因为我们在 LAN 中的下载服务器上预先下载了安装盘，所以需要链接到该下载服务器，然后去安装 Visual Studio 2019 Build Tool 等等。





### Remote Desktop

#### RDP 方式

在 macOS 上可以使用免费的 RDP Client 工具：

 [CoRD: Remote Desktop for Mac OS X](http://cord.sourceforge.net/) 或者

 [Remote Desktop Manager Free](https://remotedesktopmanager.com/home/download) 

> 注意 Remote Desktop Manager Free 需要你登记一个账号才能免费使用，或者也可以干脆买一份它的 Enterprise License

如果你在评估或者正在管理 Azure 服务器，那么可以使用 Azure 管理界面中内嵌的远程管理工具。

#### VNC 方式

如果你正在使用 Windows 11 等 Home Edition 版本（例如笔记本预置 OEM），那么这些工作站上的远程桌面服务是不能激活的，很可耻——所以这时候你需要 VNC 工具：

 [TightVNC: VNC-Compatible Free Remote Control / Remote Desktop Software](https://www.tightvnc.com/) 

#### SSH 方式

还可以使用 OpenSSH 工具，通过 ssh 方式远程连接到服务器：

 [安装 OpenSSH | Microsoft Docs](https://docs.microsoft.com/zh-cn/windows-server/administration/openssh/openssh_install_firstuse) 

#### 其他

从 Windows 工作站发起远程管理会话时，也可以使用 Windows Admin Center 这个工具，这是 Microsoft 官方出的专用工具。









## 安装 Visual Studio 2019 Build Tool



官网： [下载 Windows 版和 Mac 版 Visual Studio 2019](https://visualstudio.microsoft.com/zh-hans/downloads/) 

可以把 Visual Studio 2019 Build Tool 简单地看作是 Visual Studio 的无 GUI 版本就可以了。

### 建立离线安装包

参考：

- [将 Visual Studio 生成工具安装到容器 | Microsoft Docs](https://docs.microsoft.com/zh-cn/visualstudio/install/build-tools-container?view=vs-2019) 
- [创建脱机安装 - Visual Studio (Windows) | Microsoft Docs](https://docs.microsoft.com/zh-cn/visualstudio/install/create-an-offline-installation-of-visual-studio?view=vs-2019) 

首先在官网下载 vs_setup 执行文件，然后使用这样的命令行就能够创建离线包了：

```bash
vs_buildtools__2036376674.1537335944.exe --layout .\vs2019bt_offline  --lang en-US
```

注意查看你下载得到的 vs_setup 执行文件名字，并用它去替换 `vs_buildtools__2036376674.1537335944.exe`  部分。

### 安装

下载离线包 OK 之后，在 Server Core 上可以通过 Samba 文件共享方式连接到离线包的服务器：

```bash
net use z: \\hz-pc\d
```

然后转入子目录中发起安装过程：

```bash
cd /d z:\downloads\vs.2019.build.tool\vs2019bt_offline
vs_setup.exe
```

然后在分离的安装窗口中进行勾选并完成安装即可。

### 磁盘尺寸

安装了 C++（带有 ATL 和 MFC） 以及 .NET 构建工具的 BT 大约需要 17GB 的磁盘空间。所以我们在一台 Server Core 上安装了 VS2019BT 工具之后，整个磁盘空间大约是 22.2GB，非常无语。

这是一个巨大的消耗，在各方面意义上。

所以我对于 GitHub Actions 中的 Windows C++ 构建服务器还是很敬佩的，每次推送伴随着一次构建服务器的下载，启动，调度构建CI命令，直到销毁，这些流程







## 🔚

暂时写这么多。