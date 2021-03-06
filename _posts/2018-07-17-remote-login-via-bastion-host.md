---
layout: single
title: "通过堡垒机透明连接到云中任意内网主机"
date: 2018-07-17 08:20:00 +0800
Author: hedzr
tags: [linux, ssh, login, bastion, devops]
categories: devops linux ssh
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



通过堡垒机透明连接到云中任意内网主机，且自由切换到其他主机。

适合于各种公有云环境。

<!--MORE--> 

### 前置条件

你的SSH证书在每一台主机上都有相同的账户名以及控制台登录授权。

这一点其实不怎么容易，比较可行的方法有：

- 通过自定义镜像预先做好账户名，并用该镜像开机
- 通过一套ops脚本集，在每台主机上执行一次特定子功能以便建立相同的账户名以及授权
- 通过ansible或类似的部署工具，执行专用脚本以便建立账户名

关于前置条件的实现，不在本文的讨论范畴，因此这里不再展开细节了。

 

### 本机

你的工作主机需要有一点准备：请修改 ~/.bashrc 追加如下语句：

```
ssh -add -K ~/.ssh/id_rsa
alias ssh='ssh -A'
```

以上我们假定你的主力SSH证书就是当前账户的缺省证书，否则你需要指定正确的证书路径。

上面的语句将会在SSH会话中携带你的证书到任意位置，当然你也并不必担心证书的泄露问题，你的证书只会存在在内存中。

 

### 堡垒机

假定前置条件是满足的，例如已经在某个新的VPC中准备好了自定义镜像，并且新开第一台主机作为堡垒机，并且主机名命名为 cx1ops00，那么

```
ssh cx1ops00
```

应该能顺利登录到该主机。

堡垒机需要开启SSH转发，可以修改堡垒机的 /etc/ssh/ssh_config 加入：

```
Host cc*
    ForwardAgent yes
```

也可以建立 ~/.ssh/config 加入该配置。

 

### 其它内网主机

你可以继续开其它主机，这些主机都命名为 cc1xxxxxx，注意每台主机的主机名和IP地址需要被写入堡垒机的 /etc/hosts 文件中，或者是写入到 内网DNS服务器中。一般来说，我们通过新建主机时的用户自定义启动脚本来完成该工作。

 

### 回到本机

我们现在需要完成通配符配置，修改 ~/.ssh/config 加入如下的配置文本：

```
Host cc*
    PreferredAuthentications publickey
    IdentityFile ~/.ssh/qcloud/tencent-cloud-newEcsDefault.dms
    ProxyCommand ssh cx1ops00 exec nc %h %p
```

> 一样的道理，证书文件的路径你自己修正正确。

通过上面的通配符配置，我们约定凡是ssh到云主机名 cc* 的，一律借助堡垒机 cx1ops00 转发到云端，至于确切的云主机名的正确解释，则交到堡垒机上去完成。因此，现在在本机上通过 ssh cc1web01 可以直接连接到云上的内网主机了。

通过堡垒机的连接，有一张图，暂时没有寻找到原始来源：

[![img](/assets/images/ssh-connection-through-1.png)](http://blog.hedzr.com/wp-content/uploads/2018/07/ssh-connection-through-1.png)

 

### 后记

上面的方法，是用在我工作中的方法。的确它是需要若干条件，不过当我们梳理清楚并且批量应用出去了之后，现在去服务器上溜达一下已经成了享受了，没有什么可抵触的了。

 





## 🔚