---
layout: single
title: "安装 rancher 和导入 microk8s 集群"
date: 2021-05-22 11:10:00 +0800
last_modified_at: 2021-05-22 18:55:00 +0800
Author: hedzr
tags: [linux, ubuntu, ubuntu 20.04, focal, focal fossa, devops, rancher, k8s, kubernetes, microk8s, k3s]
categories: devops linux
comments: true
toc: true
header:
  overlay_image: /assets/images/ubuntuhero.jpg
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


> **摘要**：  
>
> 下面是针对 rancher 2.5.8 以及 ubuntu 20.04 的 microk8s （kubernetes 1.20）为基准的集群搭建记录，以单节点为搭建的起点，采用的是分离的 rancher 和工作集群。
>
> 稍后，可以将 rancher 放入一个独立的 k8s 集群中以便消除 rancher 的单点缺陷。
>
> <!--MORE-->

下面是针对 rancher 2.5.8 以及 ubuntu 20.04 的 microk8s （kubernetes 1.20）为基准的集群搭建记录，以单节点为搭建的起点，采用的是分离的 rancher 和工作集群。

稍后，可以将 rancher 放入一个独立的 k8s 集群中以便消除 rancher 的单点缺陷。





题图：

![image-20210521120242195](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210521120242195.png)



## Why

一个原因在于，这里并不只是一个拉练记录。

能有多少收获只缘于，你能够发掘出多少东西。



## 记录

### 准备虚拟机

首先准备两台虚拟机，暂时命名为 u20k8s 和 u20microk8s，分别安装 rancher 和 k8s 集群的单节点作为起点。

| host              | usage       | ip            | id   |
| ----------------- | ----------- | ------------- | ---- |
| u20k8s.local      | rancher 2.5 | 172.16.207.61 | A    |
| u20microk8s.local | microk8s    | 172.16.207.62 | B    |
|                   |             |               |      |

在后文中，我们也可能采用 A 或者 B 来称呼上述的虚机。

全部虚拟机都跑 Ubuntu 20.04 Server Minimal，ssh server，docker。

关于 docker 的安装，可以参阅官方文档、或者是自行搜索。但在 Ubuntu 上，一般来说只需要一句话：

```bash
sudo snap install docker
```



为了运维便利，从本机到虚机的 ssh 是免密的，虚机上的 sudo 是免密的，虚机之间的 ssh 是免密的。

> 本机到虚机可通过 ssh-copy-id 方式做 ssh login 免密；
>
> 虚机 sudo 免密可以参阅 [Ubuntu Server 安装提要](https://hedzr.github.io/devops/linux/ubuntu-20.04-setup-essentials)

ip 地址是由我的虚拟机网段所决定的，但采用了 reservations over dhcp 方式为上述两台虚机的 mac 地址做了到 ip 地址到绑定，这样每次启动它们的 ip 就不会变了。

> 我没有采用 static ip 或者 bridged network 等方式去固定虚机 IP，因为这些方法有点费事，而且有可能当我换到其他工作场所时就不能用了。

为了便于操作 docker，我们可以加入 docker 组，从而避免 sudo docker ... 的用法，直接以 docker ... 来发出指令：

```bash
sudo usermod -aG docker $USER
```

这需要你重新 SSH 登录到虚机才会生效。



### 准备证书

证书将被用于 rancher 服务器，这样就可以避免 rancher 自动证书可能存在的问题：在单一网络结构中，自动证书能够很好地工作，但在多网段的复杂网络中，rancher 的自动证书有可能不能满足被信任的需要。

解决各种各样证书问题的关键性基准在于所有人拥有一个公共的 RootCA，然后在该 Root 下下辖若干中间 CAs：用于基础设施的 InfImmCA，用于职员身份的 StaffImmCA，用于公共 API 服务的 PublicAPIImmCA，等等。

我们使用 InfImmCA 颁发一个 TLS-server 证书，用于 rancher 服务器，由于 k8s 默认不介意所谓的 insecure 证书（自签名证书由于不再内建受信任的 CAs 列表中，所以是不安全的），所以该 TLS-server 证书将会是有效的。

采用 openssl 颁发和维护一整套 CA 证书链条，稍微有点复杂，这种方案仅在你拥有一个证书颁发机构和团队的情况下才应该被采用。此时该团队不但需要负责管理证书链条以及吊销列表，也要负责在公网上维护该证书体系，处理各种泄漏、过期、侵入风险。

在本文中只是想要提供一套用于开发、测试乃至于生产的可用 k8s 集群的起点，所以我们不必涉及到公共可信权威问题，因此我们简单地维持一套私有自签证书链就足够了。

因此我们采用 xca 建立一套基本链条：

![image-20210521111609443](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210521111609443.png)

需要提及的是，对于 u20k8s.local 的 TLS-server 服务器证书来说，为了预留一定的余地，因此我们设置了这些 common names 给它：

- u20k8s.local
- u20k8s
- localhost
- *.local

实际上我们可能会为其预留更多的标准名。

但是这一做法仅仅应该被用在受限场所之中，例如你自己想要做 rancher 或者 k8s 方面的研究，或者你正在尝试做运维方面的探索，或者你正在计划某些上一定规模的架构设计，等等。

在生产环境中，你需要有一个专门的团队来负责证书管理，且保证一事一证，绝不滥发。这个话题就太远了，这里只再重复提这么一次。



### 可选：建立 DNS 集群

一个比较有价值的 VPC 架构，一定有两到三台 DNS 服务器集群，以一主多备的方式运行。

在 AWS 云环境中，自建的 DNS 集群可以被指定到 VPC 的总体环境中，所以对于新主机来说没有任何额外的 DevOps 需要。

但在不支持自定义 DNS 的某些国内云中，你需要在新主机模版中自行写入自己的 nameservers 记录并令其生效。

一旦自己的 DNS 集群有了，那么一套 domain 命名体系将被建立起来，这将会有利于整体网络规划。

如果有必要，你可以考虑将外部 DNS 和 K8s 的 coredns 融合起来，这样做的好处是即使你需要构建多个 k8s 集群，也能够很好地融合集群间互访问题。

如果你的微服务采用 consul 进行服务治理，那么你还可以考虑将 consul 集群配置为 DNS 集群的辅助域，通常为 `consul.local`，那么所有的微服务将会自动获得 ms.consul.local 的域名，且在 DNS 集群覆盖范围内是相互可达的。

这些属于高级架构话题，所以此处仅仅做一个方向性的介绍。



### 安装和配置 rancher

这里以 rancher 单节点为起始点。

在虚拟机 A 中安装 docker 之后，配置 docker 的科学镜像（参考 [https://github.com/hedzr/mirror-list](https://github.com/hedzr/mirror-list)），然后就可以立即启动 rancher 了：

```bash
sudo docker run -d --privileged --restart=unless-stopped -p 80:80 -p 443:443 rancher/rancher
```

对于生产环境来说，你需要先建立一个微型 k8s，然后将 rancher 运行到这个 k8s 集群中，从而消除 rancher 集群的单点问题。但对于个人研究甚至与 staging 环境来说，单节点的 rancher 并无大碍。

为了能够更好地运维操作，我们使用 docker-compose 方式来启动。因此我们需要准备一个 my-rancher 目录以及 docker-compose.yaml 文件：

```yaml
# my-rancher/docker-compose.yaml
version: "3.7"

services:
  rancher:
    image: "rancher/rancher"
    container_name: "rancher"
    privileged: true
    restart: always    # unless-stopped
    volumes:
      - "/opt/my-rancher/rancher:/var/lib/rancher"
      - "/opt/my-rancher/kubelet:/var/lib/kubelet"
      - "./certs/cert.pem:/etc/rancher/ssl/cert.pem"
      - "./certs/key.pem:/etc/rancher/ssl/key.pem"
      - "./certs/cacerts.pem:/etc/rancher/ssl/cacerts.pem"
    ports:
      - "80:80"
      - "443:443"
    networks:
        - default
        - voxr_app_net

networks:
  voxr_app_net:
    external: true
```

在这里，我们添加了一条外部网络，请在虚机中事先用以下命令创建它：

```bash
docker network create voxr_app_net
```

> 为了能够和其他应用相互通信，我们提前准备了这条网络用于特殊情况下的互通。对于你的个人应用，它不是必须的——所以你可以依次注释掉 yaml 中的相关行，又或者是替换为你所规划的名字。

在 my-rancher/certs/ 下需要提前准备证书文件：

- cacerts.pem: root-ca 的证书
- cert.pem: rancher 服务器的证书，包含完整的到 root-ca 的证书链
- key.pem:   rancher 服务器的证书私钥

它们都是 RSA 证书文件格式，这意味着它们都是 `-----BEGIN CERTIFICATE-----` 或者 `-----BEGIN RSA PRIVATE KEY-----` 开头的。使用 xca 的导出功能可以做出这些准备，这里就不再细数了。

这些目录准备就绪之后请上传到虚机 A 的 `$HOME` 之中。一种方法是利用 rsync：

```bash
rsync-short ./my-rancher u20k8s.local:~/

# alias rsync-short='rsync -avz --partial --force -rtopg --progress '
```

在启动之前，请首先在虚机中建立 /opt/my-rancher 目录，以便用于容器存储的持久化。必要时你需要调整该目录的所有者以及权限。

现在可以启动了：

```bash
sudo mkdir -p /opt/my-rancher
sudo chown -R $USER:docker /opt/my-rancher
cd ~/my-rancher
docker network create voxr_app_net
docker-compose up -d && docker-compose logs -f
```

由于上述命令打开了日志的连续显示，所以你的 ssh 终端中会连续不断地输出日志，你可以随时 CTRL-C 终止它，但不会破坏容器的运行，因为容器是以 daemon 方式启动的（`docker-compose up -d`）。

首次发出 `docker-compose up -d` 时，必要的容器镜像会被自动从 hub.docker.com 上拉取。如果你做好了 docker 的镜像加速，那么这个过程不会花费太多的时间。



#### 初始化 rancher

现在，你可以在浏览器中查看它了。请使用 HTTPS 方式浏览 [https://u20k8s.local/](https://u20k8s.local/)。一开始会有安全警告，这是因为我们只提供了自签名的 HTTPS 证书。有的 chrome 版本或许会拒绝该证书，这时你可以换用 Firefox 进行浏览。

首次登录时需要创建管理员账户：

![image-20210522165748133](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210522165748133.png)

指定一个管理员密码之后 Continue。

> 对于研究僧来讲，请选择第一个选项：I want to create or manager multiple clusters。因为我们想要研究很多东西。

然后会有下一画面：

![image-20210522170042825](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210522170042825.png)

这里也需要确认服务器的ip地址又或者是domain名字，如果你准备采用自建的 dns 服务的话，则跟随相应的 IP 地址分配策略而采取 domain 名字，否则的话，大多数自测目的下还是使用 IP 地址。

这是为了在做三方集成时能够互访。

但是当你使用域名时，不可以采用 .local 结尾的域名，也就是说，你自己规划的域名体系可能并不能很好地被用在这里。此问题可以解决，但不是必需，一般来说可以先采用 IP 地址完成初始化再说。

当初始化结束后，就可以看到集群页面了。如果想要更换显示语种，请在右下方自行调整。

![image-20210522170527427](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210522170527427.png)

那么现在可以看到，一个预建的 k3s 集群 local 已经在工作状态了。

作为开发人员来讲，到此为止，他已经得到了一个 k8s 的轻量级单节点集群（h3s），用来做个人开发和测试已经足够了。

出于多种目的我们将会继续准备一个单独的 k8s 集群，然后在 rancher 中引入该集群，以便透过 rancher 来管理外部集群。



### 安装和配置 k8s master 节点

我们从单节点 k8s 开始。

在虚机 B 上，需要这样安装 microk8s：

首先确认 docker 环境就绪。

然后安装 microk8s：

```bash
sudo snap install microk8s --classic
```

检查基本状态：

```bash
$ microk8s status
microk8s is running
high-availability: no
  datastore master nodes: 127.0.0.1:19001
  datastore standby nodes: none
addons:
  enabled:
    dashboard            # The Kubernetes dashboard
    dns                  # CoreDNS
    ha-cluster           # Configure high availability on the current node
    ingress              # Ingress controller for external access
    metallb              # Loadbalancer for your Kubernetes cluster
    metrics-server       # K8s Metrics Server for API access to service metrics
    storage              # Storage class; allocates storage from host directory
  disabled:
    ambassador           # Ambassador API Gateway and Ingress
    cilium               # SDN, fast with full network policy
    fluentd              # Elasticsearch-Fluentd-Kibana logging and monitoring
    gpu                  # Automatic enablement of Nvidia CUDA
    helm                 # Helm 2 - the package manager for Kubernetes
    helm3                # Helm 3 - Kubernetes package manager
    host-access          # Allow Pods connecting to Host services smoothly
    istio                # Core Istio service mesh services
    jaeger               # Kubernetes Jaeger operator with its simple config
    keda                 # Kubernetes-based Event Driven Autoscaling
    knative              # The Knative framework on Kubernetes.
    kubeflow             # Kubeflow for easy ML deployments
    linkerd              # Linkerd is a service mesh for Kubernetes and other frameworks
    multus               # Multus CNI enables attaching multiple network interfaces to pods
    portainer            # Portainer UI for your Kubernetes cluster
    prometheus           # Prometheus operator for monitoring and logging
    rbac                 # Role-Based Access Control for authorisation
    registry             # Private image registry exposed on localhost:32000
    traefik              # traefik Ingress controller for external access
```

#### 解决 pause:3.1 镜像问题

由于周知的 gcr.io 引用问题，尽管 microk8s 已经安装就绪，但其第一阶段初始化仍不能完成，原因就在于 `k8s.gcr.io/pause:3.1` 拿不到。

表现出来的现象是 calico-node pending 问题：

```bash
$ microk8s.kubectl get pods -A
NAMESPACE            NAME                                         READY   STATUS             RESTARTS   AGE
kube-system          calico-kube-controllers-c9784d67d-b6xkk      1/1     1/1 Running        2          3m
kube-system          calico-node-6fm9g                            1/1     0/1 Init:0/3       2          3m
```

所以我们现在要在虚机 B 中执行：

```bash
for i in pause:3.1; do
  docker pull mirrorgooglecontainers/$i
  docker tag mirrorgooglecontainers/$i k8s.gcr.io/$i
  docker rmi mirrorgooglecontainers/$i
  docker save k8s.gcr.io/$i >"${i//:*}.tar"
  microk8s.ctr i import "${i//:*}.tar"
done
microk8s.stop && microk8s.start
```

等待几分钟后再检查：

```bash
$ microk8s.kubectl get pods -A
NAMESPACE            NAME                                         READY   STATUS             RESTARTS   AGE
kube-system          calico-kube-controllers-c9784d67d-b6xkk      1/1     Running        1          2m
kube-system          calico-node-6fm9g                            1/1     Init:0/3       1          2m

```

此问题非常容易解决，不过由于时效性已经中文网的特色，很多文档的参考价值比较有限。因此这里专门辟出章节进行介绍。由于你被期望是一个 Bash 精通者，所以我不解释上面的脚本的含义。



#### 准备更多镜像备用

只要 pause:3.1 搞定，接下来的很多 kube-system 相关镜像都能够被拉回来。

但是也有的可能不行，那么你可能需要如下的序列来解决问题：

```bash
for i in metrics-server-amd64:v0.3.6; do
  docker pull mirrorgooglecontainers/$i
  docker tag mirrorgooglecontainers/$i k8s.gcr.io/$i
  docker rmi mirrorgooglecontainers/$i
  docker save k8s.gcr.io/$i >"${i//:*}.tar"
  microk8s.ctr i import "${i//:*}.tar"
done
```

其用意在于，首先从某个镜像源处取得所需的镜像，然后拉取到本机，改名其 tag 为原始名称（例如：`k8s.gcr.io/metrics-server-amd64:v0.3.6`），然后推入 microk8s 的私有容器注册表中。这么做了之后，稍后 microk8s retry 相应的 pod 时，就不必再去拉取远程的容器镜像了。

实际上，你也可以直接借助于 microk8s.ctr 命令来拉取 mirrorgooglecontainers 的同名镜像，然后直接做 tag 改名即可，这就避免了 docker save 到一个 tar 文件的过程：

```bash
for i in metrics-server-amd64:v0.3.6; do
  docker pull mirrorgooglecontainers/$i
  microk8s.ctr i tag mirrorgooglecontainers/$i k8s.gcr.io/$i
done
```

这很简练。

但我们给出两种解法，你可以根据自己的网络规划来选用。



#### 通用：解决镜像拉取问题

为了解决各式各样的 pending，ErrorImagePull 等等等等的错误问题，下面是解法：

通过命令

```bash
microk8s.kubectl get pods -A -n kube-system
```

我们可以列出 k8s 核心 pods 的运行状态。

你也可以用：

```bash
microk8s.kubectl describe pods -A -n kube-system
```

来查看具体的错误原因。在错误原因中找到哪一个容器镜像无法被拉取，则采用前述的方案解决该镜像，直到全部依赖就绪，pods 运行状态正常（全部为 Running 状态）。

到此，k8s 就已经安装就绪了。



确认 k8s 状态 ok 的方法需要依次检查下面两条命令：

```bash
# 1. 检查总体状态
microk8s.status

# 2. 确认所有系统 pods 都处于 running 状态
microk8s.kubectl get pods -A -n kube-system
```



#### kubectl 别名

microk8s 提供一个 kubectl 的等效命令：`microk8s.kubectl`，但我们想要缩短它：

```bash
sudo snap alias microk8s.kubectl kubectl
```

这样，我们就可以直接使用 kubectl 了。



#### 准备 addons

一般来说，至少这些 addons 是有必要被启用的：

```bash
microk8s.enable dns dashboard metrics-server rbac registry storage ingress
```

其中，registry 可以提供一个内建的 Docker Registry 服务，你可以将待部署的镜像推入该注册表，然后使用 pods/services 部署指令就不比联网了，这对于 private VPC 环境非常有用。

在遇到某个 pod 不能完成初始化时，参考前面提及的手工拉取容器镜像然后推入 microk8s 的方法进行解决。

由于 dashboard 可以采用两种认证方法，所以你可以选择使用简单认证或者 rabc 认证方案。

#### dashboard 简单认证

此时不可以启用 rbac 模块：

```bash
microk8s.enable dns dashboard
```

没有 rabc 支持，那么需要找到登录所用的 token：

```bash
$ microk8s.config
```

为了得到更精炼的 token，可以使用下面的惯用法：

```bash
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep admin-user | awk '{print $1}')
```

由于 dashboard 跑在 k8s 子网中，所以外界是不能直接访问的。解决的办法有多种：

1. 采用标准的 pod 暴露策略：NodePort，LoadBalancer，Ingress 网络 等等

   请参考 kubernetes 文档：[访问集群中的应用程序 | Kubernetes](https://kubernetes.io/zh/docs/tasks/access-application-cluster/) 

2. 采用 dashboard-proxy

这些方法稍后会予以介绍。



#### dashboard 和 rabc 认证

此时需要加载 rabc：

```bash
microk8s.enable dns dashboard rabc
```

此方法要求你建立一个服务账户（ [create a service account](https://github.com/kubernetes/dashboard/wiki/Creating-sample-user)）来访问 dashboard。简单地摘要如下：

```bash
$ kubectl create serviceaccount admin-user -n kube-system
serviceaccount/admin-user created

$ kubectl create clusterrolebinding admin-user --clusterrole cluster-admin --serviceaccount kube-system:admin-user
clusterrolebinding.rbac.authorization.k8s.io/admin-user created

$ kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep admin-user | awk '{print $1}')
Name:         admin-user-token-r547b
Namespace:    kube-system
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: admin-user
              kubernetes.io/service-account.uid: fa28e658-0f3b-4c69-af42-6ee35b00e148

Type:  kubernetes.io/service-account-token

Data
====
ca.crt:     1094 bytes
namespace:  11 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhYN0tReallyMyTokenlbSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJhZG1pbi11c2VyLXRva2VuLXI1NDdiIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImFkbWluLXVzZXIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudsomeRandomTextTI4ZTY1OC0wZjNiLTRjNjktYWY0Mi02ZWUzNWIwMGUxNDgiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6a3ViZS1zeXN0ZW06YWRtaW4tdXNlciJ9.Jss9zraaIn-nusPX52HH3mzaVY0dm_doJRM1M9OPjSo56EVK-OeGkYkt2GbYVU2DD7VeHCzuScqVTrf6kWV5MCSs1E1w5aS3XnRe-riW7k0wafwKNn2DbLczpSaSpwMGCIGqF1PLG4RIMzG9n_B0ftMUZb2rrUeYjvgLQPZo8Db0KOsGounri2fUrL1krHOKB8lBb2CyEJ141kR-fLyGVCvin5BcZeRcRfshKCbxWvoYxtDuGCIT3CLBAgFfawS1f4ytEqbPAuP6M0D2TKdZD7Dy01Tgz8Y1V2aTYw_obQgPieDGOgdnnsESH7f6XF7YtKMSXQuSwfFCS7nusXiTqA
```

限于篇幅，就不多解释了，这种方法有点累，只对生产环境和大型运维团队有意义。



#### 使用 dashboard-proxy

microk8s 提供一个名为 dashboard-proxy 的转接服务，这是相当简单的快捷方式：

```bash
$ microk8s dashboard-proxy
Checking if Dashboard is running.
Dashboard will be available at https://127.0.0.1:10443
Use the following token to login:
eyJhbGciOiJSUzI1NiIsImtpZCI6IkthRlVHdnh6SGotc1RfOUMzYUJLNzlrNWRwQ0JZOEthXzhqWHp5eEJPVlUifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlLXN5c3RlbSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJkZWZhdWx0LXRva2VuLXhucXE2Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImRlZmF1bHQiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiJlNzY1ODA4Mi1hY2Y2LTQ2M2YtOTVlYS0zMzY3YzM1N2NkNDkiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6a3ViZS1zeXN0ZW06ZGVmYXVsdCJ9.sBkdw4AS0qVNhPrknvXXJqF7g4xuUTUgi4oJtDDp5_MGzvnAwHl3fYwxiI3ydvwoDtxC0hc7RHtmEI0y2IRwY1sTwp_BDU3jdXAGhjTMm0rAHm8lsq5HS2gKhRFX6vgleQR3Cs_PXpxmM-CkL0q9u0CzEY8QKIatOv-r0gcM9Ged0OIrU_8glAjIYKyCOT7fl9Lff4-hM3lqf_JGaqsZcZLOgtMFayAolWjST2Hh8CkHaXnbCCr-Khliw7cb7bkC8QkVSQB6L4WClohQkhmXak6h7szwewcGD_HpGvqF5C4OenUTR7qWVoXnMpJT49735UbDwWyytSmosF9i9O2IOA
```

由于他是在虚拟机 B 中，所以我们需要从本机上做一条 SSH Tunnel 之后，就可以愉快地打开该 10443 端口和访问 dashboard 界面了。

![image-20210522181251608](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210522181251608.png)



#### 补充：修改 dashboard 为 NodePort

这是不使用 dashboard-proxy 时的首选策略，因为简便：

```bash
microk8s.kubectl edit svc kubernetes-dashboard -n kube-system
```

如果不喜欢 vim 作为编辑器，可以加上前缀：

```bash
EDITOR=nano microk8s.kubectl edit svc kubernetes-dashboard -n kube-system
```

编辑的重点在于 spec.type 字段，然后是加上 ports.nodePort 字段。

修改后的一个片段如下：

```yaml
spec:
  clusterIP: 10.152.183.70
  clusterIPs:
  - 10.152.183.70
  externalTrafficPolicy: Cluster
  ports:
  - nodePort: 30443
    port: 443
    protocol: TCP
    targetPort: 8443
  selector:
    k8s-app: kubernetes-dashboard
  sessionAffinity: None
  type: NodePort
status:
  loadBalancer: {}
```



#### 小节

至此，microk8s 基本上已经就绪了。



### 注册 k8s 集群到 rancher 中

在 rancher 的 web 界面中，选择 Global：

![image-20210522183011533](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210522183011533.png)

在 Clusters 列表的右侧点击 Add Cluster 按钮：

![image-20210522183102085](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210522183102085.png)

选择 Other Cluster

![image-20210522183138183](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210522183138183.png)

命名后点击 Create

![image-20210522183241835](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210522183241835.png)

此时会显示一个说明页面：

![image-20210522190403880](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210522190403880.png)

> 图示中的 DOMAIN 地址存在不匹配的问题，你也许需要自行纠正为 IP 地址。

它向你介绍了如何在 microk8s 集群中导入一个 rancher-agent，从而完成反向登记的方法。

简单地说，在 microk8s 所在的虚机上运行指令：

```bash
curl --insecure -sfL https://172.16.207.61/v3/import/rvzcvgkxm6wklvgnxjhm7qht6v4htsxzt6vxxvc7nfkxpxdxmntl69_c-4kq5v.yaml | kubectl apply -f -
```

就可以了。

然而，你需要解决一些集群间互访的问题，也即两个子网之间可能不能互访、需要中间桥接。

不过对于我们所指定的虚拟机环境来说，这个问题目前不存在。

如果发现 rancher-agent 不能成功运行，可以检查它的 pod log，确定直到解决子网通讯无异常后，注册将会成功。

如果有必要，可以清理该 pod 及其部署之后，重新登记。

```bash
kubectl delete -n cattle-system deployment --all
kubectl delete -n cattle-system pods --all
```

需要提及的是，不要试图将一个 k8s 集群同时注册到多个 rancher 服务器，那会让 k8s 中的 rancher-agent 工作不正常。

成功登记之后，查看 rancher 界面：

![image-20210522184747150](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210522184747150.png)

点击进入，可以检查该集群的工作状态了：



![image-20210521120242195](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210521120242195.png)







## 结尾

这次拉练，没有涉及到 k8s 方面的运维或开发问题——这些内容会篇幅更多，也难以以单篇 post 讲述。所以我们这里主要是以搭建步骤为基准，介绍一些基础设施架构思路。

即使如此，所谓思路或者说思考模式，也只能点到为止。





## 🔚

- [Rancher文档 | K8S文档 | Rancher | Rancher文档](https://docs.rancher.cn/)

- [Kubernetes 文档 | Kubernetes](https://kubernetes.io/zh/docs/home/) 

- [**How to setup MicroK8s with RBAC and Storage**](https://igy.cx/posts/setup-microk8s-rbac-storage/#create-an-admin-user-service-account-to-access-the-dashboard-optional) 

- [MicroK8s - Registry images](https://microk8s.io/docs/registry-images) - 直接使用本机(microk8s.local)上的镜像

- [MicroK8s - Using the built-in registry](https://microk8s.io/docs/registry-built-in) - 提供内建的 docker registry，可以接收外界 push 镜像到 microk8s.local 然后供 k8s 集群引用。

- [Configuring your Linux host to resolve a local Kubernetes cluster’s service URLs | by Andy Goldstein | Heptio](https://blog.heptio.com/configuring-your-linux-host-to-resolve-a-local-kubernetes-clusters-service-urls-a8c7bdb212a7) 

- [Custom DNS Entries For Kubernetes](https://coredns.io/2017/05/08/custom-dns-entries-for-kubernetes/) 

- kubernetes官方维护的 [https://github.com/kubernetes/minikube](https://link.zhihu.com/?target=https%3A//github.com/kubernetes/minikube)

- rancher公司的 [https://github.com/rancher/k3s](https://link.zhihu.com/?target=https%3A//github.com/rancher/k3s)

- ubuntu 维护的 [https://github.com/ubuntu/micro](https://link.zhihu.com/?target=https%3A//github.com/ubuntu/microk8s)

-  [Istio / MicroK8s](https://istio.io/latest/zh/docs/setup/platform-setup/microk8s/) 

  









