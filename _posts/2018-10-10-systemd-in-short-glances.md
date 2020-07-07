---
layout: single
title: "简述SYSTEMD的新特性及UNIT常见类型分析"
date: 2018-10-10 09:20:00 +0800
Author: hedzr
tags: [linux, service, systemd, devops]
categories: devops linux systemd
comments: true
toc: true
header:
  overlay_image: /assets/images/whats-devops.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
#excerpt: "BASH 小技巧一小组 [...]"
#header:
#  overlay_image: /assets/images/unsplash-image-1.jpg
#  overlay_filter: rgba(0, 0, 0, 0.15)
#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---



## 关于 Systemd

**systemd**是[Linux](https://zh.wikipedia.org/wiki/Linux)电脑[操作系统](https://zh.wikipedia.org/wiki/作業系統)之下的一套[中央化系统及设置管理程序](https://zh.wikipedia.org/wiki/Init)（init），包括有[守护进程](https://zh.wikipedia.org/wiki/守护进程)、[程序库](https://zh.wikipedia.org/wiki/程式庫)以及应用软件，由[Lennart Poettering](https://zh.wikipedia.org/w/index.php?title=Lennart_Poettering&action=edit&redlink=1)带头开发。其开发目标是提供更优秀的[框架](https://zh.wikipedia.org/wiki/軟體框架)以表示[系统服务](https://zh.wikipedia.org/w/index.php?title=服务_(系统结构)&action=edit&redlink=1)间的依赖关系，并依此实现系统初始化时服务的并行启动，同时达到降低[Shell](https://zh.wikipedia.org/wiki/Shell)的[系统开销](https://zh.wikipedia.org/w/index.php?title=系统开销&action=edit&redlink=1)的效果，最终代替现在常用的[System V](https://zh.wikipedia.org/wiki/System_V)与[BSD](https://zh.wikipedia.org/wiki/BSD)风格init程序。

目前绝大多数的[Linux发行版](https://zh.wikipedia.org/wiki/Linux發行版)都已采用systemd代替原来的[System V](https://zh.wikipedia.org/wiki/UNIX_System_V)。

<!--MORE--> 

### SYSTEMD由来

- Linux一直以来采用init进程但是init有两个缺点：
- 1、启动时间长。Init进程是串行启动，只有前一个进程启动完，才会启动下一个进程。（这也是CentOS5的主要特征）
  2、启动脚本复杂。Init进程只是执行启动脚本，不管其他事情。脚本需要自己处理各种情况，这使得脚本变得很长而且复杂。
- Init：CentOS5: Sys init 是启动速度最慢的，串行启动过程，无论进程相互之间有无依赖关系。
  CentOS6: Upstart init 相对启动速度快一点有所改进。有依赖的进程之间依次启动而其他与之没有依赖关系的则并行同步启动。
  CentOS7: Systemd 与以上都不同。所有进程无论有无依赖关系则都是并行启动（当然很多时候进程没有真正启动而是只有一个信号或者说是标记而已，在真正利用的时候才会真正启动）。

### SYSTEMD新特性

- 系统引导时实现服务并行启动；
- 按需激活进程；
- 系统状态快照；
- 基于依赖关系定义服务控制逻辑；

### UNIT

Systemd可以管理系统中所有资源。不同的资源统称为unit（单位）。Unit表示不同类型的systemd对象，通过配置文件进程标识和配置；文件中主要包含了系统服务、监听socket、保存的系统快照以及其它与init相关的信息。

- unit配置文件

  ```
  /usr/lib/systemd/system
  /run/systemd/system
  /etc/systemd/system
  ```

- unit类型

  Unit一共分为12种。Sysstemctl –t help 查看unit类型，常见类型如下：

  - Service unit：文件扩展名为.service，用于定义系统服务；
  - Target unit：文件扩展为.target，用于模拟实现“运行级别”；
  - Device unit： .device，用于定义内核识别的设备；
  - Mount unit： .mount，定义文件系统挂载点；
  - Socket unit： .socket，用于标识进程间通信用到的socket文件；
  - Snapshot unit： .snapshot， 管理系统快照；
  - Swap unit： .swap, 用于标识swap设备；
  - Automount unit： .automount，文件系统自动点设备；
  - Path unit： .path, 用于定义文件系统中的一文件或目录；

### SYSTEMD关键特性

- 基于socket的激活机制：socket与程序分离；
- 基于bus的激活机制；
- 基于device的激活机制；
- 基于Path的激活机制；
- 系统快照：保存各unit的当前状态信息于持久存储设备中；
- 向后兼容sysv init脚本：/etc/init.d/

### SYSTEMD的不兼容性

- systemctl的命令是固定不变的；
- 非由systemd启动的服务，systemctl无法与之通信；

## SYSTEMCTL命令

systemctl命令是系统服务管理器指令，它实际上将 service 和 chkconfig 这两个命令组合到一起。

**语法**

```
systemctl  [OPTIONS...]  COMMAND  [NAME...]
```

**旧指令和新指令对比**

```
systemctl [ start | stop | restart | stauts ] NAME.service

    启动： service  NAME  start  ==>  systemctl  start  NAME.service
    停止： service  NAME  stop  ==> systemctl  stop  NAME.service
    重启： service  NAME  restart  ==>  systemctl  restart  NAME.service
    状态： service  NAME  status  ==>  systemctl  status  NAME.service

    条件式重启(已启动才重启，否则不做操作）：service  NAME  condrestart  ==>  systemctl  try-restart  NAME.service
    重载或重启服务（先加载，再启动）： systemctl  reload-or-restart  NAME.servcie
    重载或条件式重启服务：systemctl  reload-or-try-restart  NAME.service

systemctl [ enable | disable ] NAME.service

    设置服务开机自启： chkconfig  NAME  on  ==>  systemctl  enable  NAME.service
    禁止服务开机自启： chkconfig  NAME  off  ==>  systemctl  disable  NAME.service 
    查看某服务是否能开机自启： chkconfig  --list  NAME  ==>  systemctl  is-enabled  NAME.service                 
    禁止某服务设定为开机自启： systemctl  mask  NAME.service
    取消此禁止： systemctl  unmask  NAME.servcie      

查看系统上所有的服务：systemctl [command] [-type=TYPE] [-all]

    查看所有的系统服务：  systemctl
    查看所有启动的unit：    systemctl list-units
    查看所有启动文件：       systemctl list-unit-files
    查看所有已启动的服务：systemctl  list-units  --type  service
    查看所有service类型的unit（已启动及未启动）: chkconfig --lsit  ==>  systemctl  list-units  -t service  --all
    查看某服务当前启动与否的状态： systemctl  is-active  NAME.service 

查看服务的依赖关系：systemctl  list-dependencies  NAME.service    
```

**设置运行级别**

语法

```
systemctl [command] [unit.target]
```

命令

```
get-default :取得当前的target
set-default :设置指定的target为默认的运行级别
isolate :切换到指定的运行级别
unit.target :为5.1表中列出的运行级别  
```

运行级别：

```
0  init 0 ==>  runlevel0.target,  poweroff.target
1  init 1 ==>  runlevel1.target,  rescue.target
2  init 2 ==>  runlevel2.tartet,  multi-user.target
3  init 3 ==>  runlevel3.tartet,  multi-user.target
4  init 4 ==>  runlevel4.tartet,  multi-user.target
5  init 5 ==>  runlevel5.target,  graphical.target
6  init 6 ==>  runlevel6.target,  reboot.target
```

实例：

```
systemctl get-default   获得当前的运行级别
systemctl set-default NAME.target 修改默认运行级别
systemctl set-default multi-user.target 设置默认的运行级别为mulit-user
systemctl isolate multi-user.target 在不重启的情况下，切换到运行级别mulit-user下
systemctl isolate graphical.target  在不重启的情况下，切换到图形界面下
systemctl rescue 切换至救援模式
systemctl emergency 强制进入紧急救援模式
```

其他命令

```
systemctl halt 关机
systemctl poweroff 关机
systemctl reboot 重启
systemctl suspend 挂起
systemctl hibernate 快照
systemctl hybrid-sleep 快照并挂起
```

## UNIT 的配置文件

1.配置目录

```
/usr/lib/systemd/system/
```

2.文件组成

```
[Unit]：定义与Unit类型无关的通用选项；用于提供unit的描述信息、unit行为及依赖关系等；
[Service]：与特定类型相关的专用选项；此处为Service类型；
[Install]：定义由“systemctl  enable”以及"systemctl  disable“命令在实现服务启用或禁用时用到的一些选项；
```

3.Unit段的常用选项

```
Description：描述信息； 意义性描述；
After：定义unit的启动次序；表示当前unit应该晚于哪些unit启动；其功能与Before相反；
Requies：依赖到的其它units；强依赖，被依赖的units无法激活时，当前unit即无法激活；
Wants：依赖到的其它units；弱依赖；
Conflicts：定义units间的冲突关系；
```

4.Service段的常用选项

```
Type：用于定义影响ExecStart及相关参数的功能的unit进程启动类型；
    类型：
        simple：默认值，执行ExecStart指定的命令，启动主进程
        forking：以 fork 方式从父进程创建子进程，创建后父进程会立即退出
        oneshot：一次性进程，Systemd 会等当前服务退出，再继续往下执行
        dbus：当前服务通过D-Bus启动
        notify：当前服务启动完毕，会通知Systemd，再继续往下执行
        idle：若有其他任务执行完毕，当前服务才会运行
EnvironmentFile：环境配置文件；
ExecStart：指明启动unit要运行命令或脚本； ExecStartPre, ExecStartPost
ExecStop：指明停止unit要运行的命令或脚本；
Restart：定义何种情况 Systemd 会自动重启当前服务，可能的值包括always（总是重启）、on-success、on-failure、on-abnormal、on-abort、on-watchdog
```

5.Install段的常用选项：

```
Alias：
RequiredBy：被哪些units所依赖；
WantedBy：被哪些units所依赖； 
```

6.新创建、修改unit文件需重载此配置文件

```
systemctl  daemon-reload
```

**实例：编译安装的nginx并通过systemd来管理**

- 安装工具

  ```
  [root@localhost ~]#yum -y install gcc gcc-c++ autoconf automake
  [root@localhost ~]#yum -y install zlib zlib-devel openssl openssl-devel pcre-devel
  ```

- 下载nginx

  ```
  [root@localhost ~]# cd /usr/local/
  [root@localhost local]# wget http://nginx.org/download/nginx-1.13.0.tar.gz 
  ```

- 解压编译

  ```
  [root@localhost local]# tar -zxvf nginx-1.13.0.tar.gz
  
  [root@localhost local]# cd  nginx-1.13.0
  
  [root@localhost nginx-1.13.0]# ./configure
  ```

- 安装

  ```
  [root@localhost nginx-1.13.0]# make && make install
  ```

- 创建nginx.service文件

  ```
  [root@localhost ~]#vim /usr/lib/systemd/system/nginx.service    
  [Unit]
  Description=The NGINX HTTP and reverse proxy server
  After=syslog.target network.target remote-fs.target nss-lookup.target
  
  [Service]
  Type=forking
  PIDFile=/run/nginx.pid
  ExecStartPre=/usr/sbin/nginx -t
  ExecStart=/usr/sbin/nginx
  ExecReload=/usr/sbin/nginx -s reload
  ExecStop=/bin/kill -s QUIT $MAINPID
  PrivateTmp=true
  
  [Install]
  WantedBy=multi-user.target
  ```

- 检查nginx是否启动

  ```
  [root@localhost ~]# ps aux | grep nginx
  root       2278  0.0  0.0 112664   968 pts/0    R+   05:21   0:00 grep --color=auto nginx
  ```

 

## 🔚