---
layout: single
title: "GPG Short Guide"
date: 2021-12-08 05:00:00 +0800
last_modified_at: 2021-12-08 07:13:00 +0800
Author: hedzr
tags: [security,gpg]
categories: security gpg
comments: true
toc: true
header:
  teaser: /assets/images/unsplash-gallery-image-1-th.jpg
  overlay_image: /assets/images/unsplash-gallery-image-1-th.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  GPG 简短快查表...
---



本文对常见的 GPG 操作进行实例示例，以阐释 gpg 命令行的编写方法。

但对于 GPG/PGP 的原理、使用场景，公钥体系、证书与签名等的使用方法不做深入探讨，因为那是很冗长的，而我这里只是打算提供一份快查表（Cheatsheet），省掉少许记忆负担。

> 本文有时候会更新内容。更新的细节将会记录。
>
> 

## GPG 是什么

GPG，即 **GNU Privacy Guard**（**GnuPG**或**GPG**）是一个[密码学](https://zh.wikipedia.org/wiki/密码学)软件，用于[加密](https://zh.wikipedia.org/wiki/加密)、[签名](https://zh.wikipedia.org/wiki/數位簽章)通信内容及管理[非对称密码学](https://zh.wikipedia.org/wiki/公开密钥加密)的密钥。



### 和 PGP 的关系

**PGP**（英语：Pretty Good Privacy，直译：**优良保密协议**）是一套用于[讯息](https://zh.wikipedia.org/wiki/讯息)加密、验证的应用程序。

PGP的主要开发者是[菲尔·齐默曼](https://zh.wikipedia.org/wiki/菲尔·齐默曼)。齐默曼于1991年将PGP在互联网上免费发布。

PGP 曾经有过一段传奇的历史。不管怎么样，PGP 最终成为了开源、免费，可以自由使用，不受美国出口管理法案限制的自由软件。一定程度上，尽管 PGP 是“开源”的产品，但它毕竟是植根于 齐默曼 的个人实现，并由 PGP Inc 这家商业公司维护和运营，尚且有些不够纯正。因此，1997年7月，PGP Inc.与 齐默曼 同意 [IETF](https://zh.wikipedia.org/wiki/IETF) 制定一项公开的[互联网标准](https://zh.wikipedia.org/wiki/互联网标准)，称作 OpenPGP，任何支持这一标准的程序也被允许称作OpenPGP。经过这一变化后，OpenPGP 作为一项公开标准，继续替代和延续 PGP 技术，以纯正开源的身份。

[自由软件基金会](https://zh.wikipedia.org/wiki/自由軟件基金會) 依据 [OpenPGP](https://zh.wikipedia.org/wiki/OpenPGP) 技术标准实现了 [GnuPG](https://zh.wikipedia.org/wiki/GnuPG)（GPG），它与 PGP，OpenPGP 标准保持着兼容性，可被看作是它们的开源替代品。

GPG 的核心是 GPG 密钥对，分为公钥和私钥。在密码学技术上，GPG 可以使用若干不同的加密算法来向外提供加密解密服务。

以 v2.2 为例，GnuPG 支持如下的密码学算法：

- [Public key](https://en.wikipedia.org/wiki/Public-key_cryptography)

  [RSA](https://en.wikipedia.org/wiki/RSA_(cryptosystem)), [ElGamal](https://en.wikipedia.org/wiki/ElGamal_encryption), [DSA](https://en.wikipedia.org/wiki/Digital_Signature_Algorithm), [ECDH](https://en.wikipedia.org/wiki/Elliptic-curve_Diffie–Hellman), [ECDSA](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm), [EdDSA](https://en.wikipedia.org/wiki/EdDSA)

- [Cipher](https://en.wikipedia.org/wiki/Symmetric-key_algorithm)

  [3DES](https://en.wikipedia.org/wiki/Triple_DES), [IDEA](https://en.wikipedia.org/wiki/International_Data_Encryption_Algorithm) (since versions 1.4.13 and 2.0.20), [CAST5](https://en.wikipedia.org/wiki/CAST-128), [Blowfish](https://en.wikipedia.org/wiki/Blowfish_(cipher)), [Twofish](https://en.wikipedia.org/wiki/Twofish), [AES-128, AES-192, AES-256](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard), [Camellia-128, -192 and -256](https://en.wikipedia.org/wiki/Camellia_(cipher)) (since versions 1.4.10 and 2.0.12)

- [Hash](https://en.wikipedia.org/wiki/Cryptographic_hash_function)

  [MD5](https://en.wikipedia.org/wiki/MD5), [SHA-1](https://en.wikipedia.org/wiki/SHA-1), [RIPEMD-160](https://en.wikipedia.org/wiki/RIPEMD), [SHA-256, SHA-384, SHA-512, SHA-224](https://en.wikipedia.org/wiki/SHA-2)

- [Compression](https://en.wikipedia.org/wiki/Data_compression)

  Uncompressed, [ZIP](https://en.wikipedia.org/wiki/Zip_(file_format)), [ZLIB](https://en.wikipedia.org/wiki/Zlib), [BZIP2](https://en.wikipedia.org/wiki/Bzip2)



目前，已经进入 RFC 规范的相关标准有：

- PGP
  - [RFC 1991](https://tools.ietf.org/html/rfc1991) PGP Message Exchange Formats (obsolete)[[8\]](https://zh.wikipedia.org/wiki/PGP#cite_note-tools.ietf.org-8)
- OpenPGP
  - [RFC 2440](https://tools.ietf.org/html/rfc2440) OpenPGP Message Format (obsolete)[[8\]](https://zh.wikipedia.org/wiki/PGP#cite_note-tools.ietf.org-8)
  - [RFC 4880](https://tools.ietf.org/html/rfc4880) OpenPGP Message Format
  - [RFC 5581](https://tools.ietf.org/html/rfc5581) The Camellia Cipher in OpenPGP
  - [RFC 6637](https://tools.ietf.org/html/rfc6637) Elliptic Curve Cryptography (ECC) in OpenPGP
  - [draft-koch-eddsa-for-openpgp](https://tools.ietf.org/html/draft-koch-eddsa-for-openpgp) EdDSA for OpenPGP
- PGP/MIME
  - [RFC 2015](https://tools.ietf.org/html/rfc2015) MIME Security with Pretty Good Privacy (PGP)
  - [RFC 3156](https://tools.ietf.org/html/rfc3156) MIME Security with OpenPGP





### 和 SSH 的关系

SSH 全称为 **Secure Shell**（安全外壳协议，简称**SSH**）是一种加密的[网络传输协议](https://zh.wikipedia.org/wiki/网络传输协议)，可在不安全的网络中为网络服务提供安全的传输环境。SSH通过在网络中创建[安全隧道](https://zh.wikipedia.org/w/index.php?title=安全隧道&action=edit&redlink=1)来实现SSH客户端与服务器之间的连接。SSH最常见的用途是远程登录系统，人们通常利用SSH来传输[命令行界面](https://zh.wikipedia.org/wiki/命令行界面)和远程执行命令。

SSH 在技术上可以使用多种不同的密码算法，并以特定的数字签名向外提供服务，例如 RSA，DSA 等。不过，一般情况下，我们都是创建 RSA 签名来为 SSH 提供低层的密码算法。

SSH 并不能直接使用 GPG 密钥对，但理论上由于密码算法、签名算法是共通的，因此两者的密钥文件实际上可以相互转换。此外，你也可以在 SSH 上使用你已有的 GPG 密钥和签名。



## 安装 GPG

在 macOS 中，你可以使用一个 GUI app：[GPG Suite](https://gpgtools.org/)。

在 Ununtu 或其它 Debian 系 OS 中，可以使用 GUI 工具 *Passwords and Encryption Keys* 管理你的 GPG 密钥对以及发布到 [Ubuntu keyserver](https://launchpad.net/+help-registry/openpgp-keys.html#publish)。

在 Windows 中，[WinGPG](https://gnupg.org/software/swlist.html#wingpg)，[Gpg4win](https://www.gpg4win.org/) 等 GUI 应用也能做类似的事情。

但在大多数情况下，命令行是使用 GPG 的最佳途径，你可以通过这种方式创建自己的密钥，向世人公开。



### 安装 gpg 命令行工具

Ubuntu/Debian 系统预置了 gpg 软件包，无需安装。你可以确认这一点：

```bash
$ gpg --version
```

也可以安装它：

```bash
sudo apt install gnupg
```

macOS 可以通过 Homebrew 安装：

```bash
brew install gnupg
```



## 使用 GPG



### Cheatsheets



#### 生成密钥

```bash
gpg --gen-key
```

按照交互提示就可以创建密钥了。



##### 提示

1. gpg 密钥是与一个有效可用的 email 绑定的，它首先是一个身份证明。
2. 算法应该选择默认值 RSA，其用途是完整的。如果选择其它如 DSA 等则你的密钥只能用于给信息签名。
3. 密钥强度首先选择 4096 bits。
4. 首先生成一个不过期的根密钥，然后在该密钥之下建立若干子密钥，子密钥能够被分别用于不同的用途，且你可以自行决定过期时间。





##### KEYID 是什么？

KEYID 就是你的 GPG Key 的指纹的短版本：

1. 长的 KEYID：Fingerprint 的末尾 16 位数字
2. 短的 KEYID：Fingerprint 的末尾 8 位数字

在很多命令中，`--keyid-format [none|short|0xshort|long|0xlong]` 可以决定 KEYID 的显示格式。



##### USER-ID 是什么？

USER-ID 通常是指你为邮箱地址所关联的姓名字段，有时候也指所关联的注释文本。在很多场景中，并不会严格区分究竟是姓名还是注释。





#### 列出密钥

```bash
# 列出公钥和指纹（Fingerprint）
gpg --list-keys
gpg -k
gpg -k [names]


# 列出私钥
gpg --list-secret-keys
```

例如：

```bash
❯ gpg --list-keys
/Users/hz/.gnupg/pubring.kbx
----------------------------
pub   dsa2048 2010-08-19 [SC] [expires: 2024-05-11]
      85E38F69046B44C1EC9FB07B76D78F0500D026C4
uid           [ unknown] GPGTools Team <team@gpgtools.org>
uid           [ unknown] [jpeg image of size 6329]
sub   rsa4096 2014-04-08 [S] [expires: 2024-05-11]
sub   rsa4096 2020-05-11 [E] [expires: 2024-05-11]

pub   rsa4096 2020-05-04 [SC] [expires: 2024-05-03]
      B97E9964ACAD1907970D37CC8A9E3745558E41AF
uid           [ unknown] GPGTools Support <support@gpgtools.org>
sub   rsa4096 2020-05-04 [E] [expires: 2024-05-03]

```



#### 列出指纹

```bash
gpg --fingerprint [names]
```

可以指明一个乃至多个邮箱进行限定。



#### 删除密钥

删除公钥

```bash
gpg --delete-key [USER-ID or KEYID]
```

删除私钥

```bash
gpg --delete-secret-key [USER-ID or KEYID]
```



#### 编辑密钥

```bash
gpg --edit-key [USER-ID or KEYID]
```

这条命令是交互式的，比较复杂。

在它的交互式提示符下，help\quit\save 是最重要的命令：help 显示可用的命令，quit 将不保存退出交互状态，save 保存变更后退出交互状态。

后文会有一些实际案例演示。



#### 导出密钥并备份

导出公钥：

```bash
gpg --armor --output user.gpg.public.asc --export MASTER-KEYID
```

导出私钥：

```bash
gpg --armor --output user.gpg.private.key.asc --export-secret-keys MASTER-KEYID
```

导出公钥之后，你可以将公钥文件通过邮件发送给朋友。你的朋友能够采用该公钥向你发送加密的邮件。



#### 导入密钥文件

```bash
gpg --import user.gpg.public.pem
gpg --import user.gpg.private.key
```





#### 发布公钥

一旦密钥创建就绪，你就可以将其发表到 GPG 公共服务器，并完成邮箱确认。经过这一流程，你就向 GPG 公共服务器证明了自己是某邮箱以及 GPG 指纹的有效拥有者。

其他人通过指纹或者邮箱地址能够检索到你的公钥。

他们可以依据你的公钥向你发送加密的消息、文本、安全邮件（S-MIME）等等。而你则使用自己在本机上保存的私钥完成内容解密，查阅对方发来的讯息。



发布公钥的命令行像这样：

```bash
gpg --keyserver hkps://keyserver.ubuntu.com --send-keys 17AFB9B1
```

在这里，`--send-keys` 后接参数 KEYID。

发送成功之后，你应该在邮箱中检查来自公共服务器的确认邮件，并完成其中的链接提示以确认个人的身份。



##### 有效的公钥服务器

目前至少这些服务器是有效运转的：

- hkps://keys.openpgp.org
- pgp.mit.edu
- hkps://keyserver.ubuntu.com

但请注意，keyserver.ubuntu.com 通常不是普通大众所使用的 keyserver，它主要用于开发目的，开发者会藉此做代码签名，软件包签名等行为。

对于普通场景，例如加密解密、签名认证、安全邮件等场景，通常都会使用 hkps://keys.openpgp.org，这是目前活跃的一个 OpenPGP keyserver pool。





#### 检索公钥

在发布了公钥之后，你可以从其它计算机搜索该公钥：

```bash
gpg --search-keys [Long-KEYID or Fingerprint]
```

注意，在 Ubuntu 中，该命令查询 `hkps://keyserver.ubuntu.com` 服务器。

你可以指明特定服务器。

例如：

```bash
$ gpg --search-keys 2E6F77F217AFB9B1
gpg: data source: https://keys.openpgp.org:443
(1)	hedzr (hz, hedzr) <hedzrz@gmail.com>
	  4096 bit RSA key 2E6F77F217AFB9B1, created: 2021-12-04
Keys 1-1 of 1 for "2E6F77F217AFB9B1".  Enter number(s), N)ext, or Q)uit > q
gpg: error searching keyserver: Operation cancelled
gpg: keyserver search failed: Operation cancelled
```

搜索邮箱地址：

```bash
❯ gpg --keyserver hkps://keyserver.ubuntu.com --search-keys cdimage@ubuntu.com
gpg: data source: https://162.213.33.8:443
(1)     Ubuntu CD Image Automatic Signing Key <cdimage@ubuntu.com>
          3072 bit RSA key A6AD0893499AA841, created: 2021-04-25
(2)     Ubuntu CD Image Automatic Signing Key <cdimage@ubuntu.com>
          1024 bit DSA key 46181433FBB75451, created: 2004-12-30
(3)     UEC Image Automatic Signing Key <cdimage@ubuntu.com>
          4096 bit RSA key 1A5D6C4C7DB87C81, created: 2009-09-15
(4)     Ubuntu CD Image Automatic Signing Key (2012) <cdimage@ubuntu.com>
          4096 bit RSA key D94AA3F0EFE21092, created: 2012-05-11
(5)       1024 bit DSA key DED63A68C3D373C7, created: 2009-01-12
Keys 1-5 of 5 for "cdimage@ubuntu.com".  Enter number(s), N)ext, or Q)uit > Q
```



同样道理，这个功能也被用于检索他人的邮箱地址，从而获知该人的 GPG 公钥。





##### 定制默认 keyserver

请编辑 `$HOME/.gnupg/gpg.conf` 文件并添加下面的文本：

```bash
keyserver hkps://keyserver.ubuntu.com
```

请确保该文件中仅指定了一个 keyserver 地址。

你可以指定为：

```bash
keyserver hkps://keys.openpgp.org
```

> Updated: 这个服务器现在已经是 Ubuntu 的默认配置了。

一个更完整的 gpg.conf 样本：

[https://github.com/drduh/config/blob/master/gpg.conf](https://github.com/drduh/config/blob/master/gpg.conf)



##### 用邮箱地址检索他人公钥

除了采用 `--search-keys` 之外，也可以：

```bash
gpg --auto-key-locate keyserver --locate-keys user@example.net
```

gpg 较旧的版本可能不能支持该指令。



#### 接收他人的公钥

可以使用长 KEYID 或者完整的 Fingerprint 来接收别人的公钥：

```bash
gpg --keyserver hkps://keyserver.ubuntu.com --recv-keys "2E6F77F217AFB9B1" "C598 6B4F 1257 FFA8 6632 CBA7 4618 1433 FBB7 5451"
```

你可以在 keyserver 服务器上检索某人的邮箱地址，然后获得他的公钥指纹，接着用该指纹进行接收。



#### 信任他人的公钥

接收了他人公钥之后，它会被显示为 unknown 状态，如果你能够确信此人身份与密钥是可信的，那么可以为其授予信任级别，例如 ultimate 级别：

```bash
$ gpg --edit-key 17AFB9B1
gpg (GnuPG) 2.2.19; Copyright (C) 2019 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Secret key is available.

gpg: checking the trustdb
gpg: marginals needed: 3  completes needed: 1  trust model: pgp
gpg: depth: 0  valid:   2  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 2u
gpg: next trustdb check due at 2031-12-02
sec  rsa4096/2E6F77F217AFB9B1
     created: 2021-12-04  expires: never       usage: SC  
     trust: full          validity: unknown
[ unknown] (1). hedzr (hz, hedzr) <hedzrz@gmail.com>

gpg> trust
sec  rsa4096/2E6F77F217AFB9B1
     created: 2021-12-04  expires: never       usage: SC  
     trust: full          validity: unknown
[ unknown] (1). hedzr (hz, hedzr) <hedzrz@gmail.com>

Please decide how far you trust this user to correctly verify other users' keys
(by looking at passports, checking fingerprints from different sources, etc.)

  1 = I don't know or won't say
  2 = I do NOT trust
  3 = I trust marginally
  4 = I trust fully
  5 = I trust ultimately
  m = back to the main menu

Your decision? 5
Do you really want to set this key to ultimate trust? (y/N) y

sec  rsa4096/2E6F77F217AFB9B1
     created: 2021-12-04  expires: never       usage: SC  
     trust: ultimate      validity: unknown
[ unknown] (1). hedzr (hz, hedzr) <hedzrz@gmail.com>
Please note that the shown key validity is not necessarily correct
unless you restart the program.

gpg> save
Key not changed so no update needed.
$
```

使用 `trust` 命令来授信，可以有 5 个级别。

- 1: unknown 或者说 undefined 是未曾关注过可信度。
- 2: never 是不可信。
- 3: marginally 是有点可信，不过是不是非常值得信任，可能尚未进行过相应的背景调查。
- 4: fully 完全可信。key 的来源渠道是清清白白的。
- 5: ultimate，究极版，这个家伙跟我是哥们。

如果好哥们通知我说 key 泄漏了，那么应该编辑可信度到 never 状态。这个 key 将不再会被自动选中和被用于加密、签署等动作。

信任级别是 per machine 的，其用途是让你自己管理一个信任程度列表。



#### 签名他人公钥

如果这个哥们真的是好哥们，除了调高可信级别之外，还可以用你的私钥为他的 GPG key 做签名。签名的行为是可以传播的，你对某人的公钥做了签名，在同步之后，他能看到你的动作，而反过来他也可以这么做，从而彼此建立了一个互信交互。这个交互构成的互信网实际上就是你的 gpg 通信录。

```bash
gpg --import someone@example.com
gpg --ask-cert-level --sign-key someone@example.com
gpg --list-sigs someone@example.com
```

但不应该在签名他人公钥之后做同步。正确的步骤应该是：

1. 接收他的 key

   ```bash
   gpg --import someone@example.com
   ```

2. 签名这个 key

   ```bash
   gpg --ask-cert-level --sign-key someone@example.com
   ```

3. 导出

   ```bash
   gpg -a --export someone@example.com | gpg -se -r someone@example.com > ~/tmp/someone_at_example.com.asc.pgp
   ```

4. 邮件这个 .asc.pgp 给 someone@example.com，告诉他你已经签名过了。

5. someone 拿到 .asc.pgp，decrypt 它，verify 它

   ```bash
   gpg --decrypt someone_at_example.com.asc.pgp > someone_at_example.com.asc
   ```

   导入它（同时也就验证了它）

   ```bash
   gpg --import someone_at_example.com.asc
   ```

6. someone 推送这个新的状态

   ```bash
   gpg --send-keys someone@example.com
   ```

这样做，最大的不同在于通过对 .asc.gpg 的解密、校验签名，你们两人完成了公钥、私钥对的交互协作，从而证明了两人的公钥私钥对是确实完成了互信通道的。





#### 加密文件

```bash
gpg --encrypt -r 17AFB9B1 original.file
```

加密后生成一个新文件 `original.file.gpg`。

`--encrypt` 缩写为 `-e`。

`-o encrypted.file.gpg` 可用于指明输出文件。



#### 解密文件

```bash
gpg --decrypt -r 17AFB8B1 encrypted.file.gpg
```

对已加密文件的反向操作。



#### 签名文件

##### 签名文件

```bash
gpg --sign original.file
```

这会生成一个加密文件 `original.file.gpg`，同时它也是被签名的。你可以单独分发这个加密文件就可以了。

可以用 `--local-user KEYID/USER-ID` 指明 KEYID 或者用户名别名。其同义词为 `-u`：

```bash
gpg --local-user 17AFB9B1 --sign original.file
```

此时，会使用指明的 KEYID 来完成签名算法，这对于你有多个 GPG Keys 或者 GPG SubKeys 的情况非常有用。



##### 验证文件完整性

```bash
❯ gpg --local-user 17AFB9B1 --verify 1.html.gpg
gpg: Signature made Tue Dec  7 11:10:21 2021 CST
gpg:                using RSA key 362622A43CC67D533FFBD33F2E6F77F217AFB9B1
gpg: Good signature from "hedzr (hz, hedzr) <hedzrz@gmail.com>" [ultimate]
```



##### 仅签名文件，但不加密

带上 `--armor`/`-a` 选项，为了让签名被写入分离的文件，还要带上 `--detach-sign`/`-b` 选项：

```bash
gpg --local-user 17AFB9B1 -a -b --sign original.file
```

签名后生成一个纯文本的签名文件 `original.file.asc`，你应该将它和原始文件一同分发。

同样地，校验签名完整性：

```bash
gpg --local-user 17AFB9B1 --verify original.file.asc
```

注意他人需要先接收你的公钥之后才能做此校验。



##### 仅签名文件，但不加密，使用清晰签名方式

```bash
gpg --clear-sign original.file
gpg --verify original.file.asc
```

和上一种方式的区别在于，original.file.asc 中包含了原始文件的内容。

对于原始文件为文本文件的情况，这是很好的方式，并且你也无需同时分发 `original.file` 了。



##### 对签名输出另一文件却没有做分离的文件进行完整性验证

前面提到了 armor detached 签名方式，该方式中，签名信息被写入独立的 asc 文件，验证时相对简单。

但也可以不加 detach 选项对其签名：

```bash
gpg -a --sign original.file
```

此时验证命令需要加上原始文件名：

```bash
gpg --verify original.file.asc original.file
```







### 从 keyserver 吊销

一旦发布到 keyserver 上，你的 GPG Key 就不能被真正删除了。

要放弃一个不好的、失效的、过时的、可能已经泄漏的密钥，你要使用吊销功能。



#### 提前准备

在生成你的密钥（参看 --gen-key 部分）的同时，你应该立即为其生成一张吊销用证书。

未来的某一天当你需要放弃这个密钥时，你可以通过上传吊销证书到 keyserver 来删除/吊销它，这样其他人只要更新了吊销列表，就不会再使用你已经放弃了的过时密钥了。

实际上，gpg 可能已经为你自动创建了一张用于吊销的证书，不过这张证书是在某个隐含的位置。无论你有否找出它，再次地、显式地创建一张吊销证书并不会有额外多少代价。



##### 准备撤销密钥用的吊销证书

现在，您需要使用以下命令撤销密钥：

```
gpg --output revoke.asc --gen-revoke key-ID 
```

您的吊销密钥证书存储在名为“revoke.asc”的文件中。



#### 吊销它！

某一天你想要吊销它的话，按照下面的流程去做。

##### 将吊销证书导入您的钥匙环

如果你本机上的 gpg keyring 中还有这个密钥，您需要将吊销证书导入 keyring 公共密钥环：

```
gpg --import revoke.asc 
```

这样本机中的密钥就被吊销了。

注意吊销并不删除密钥本身，它是标记该密钥被作废了。



##### 在密钥服务器上搜索密钥

假设您已将公共密钥上传到在线密钥服务器中。例如 `hkps://keys.openpgp.org` 中。

您可以使用以下命令在 密钥服务器 中检查/搜索密钥：

```
gpg --keyserver hkps://keys.openpgp.org --search-keys key-ID 
```



##### 撤销密钥服务器上的密钥

要撤消密钥服务器中的公钥，您需要运行以下命令。我正在使用pgp.mit.edu密钥服务器。

```
gpg --keyserver hkps://keys.openpgp.org --send-keys key-ID 
```

您已经撤消了钥匙圈中的钥匙。因此，此已撤销的密钥将发送到密钥服务器。因此，您在线密钥服务器中的密钥也将被吊销。





### 批处理方式创建新密钥

有时候我们喜欢一次性搞定全部事情，所以可以采用 gpg 的批处理模式，此时就不会进入交互模式了。但这时候我们需要提前准备一个描述文件，向 gen-key 提供那些原本应该在交互模式下应答的内容。

这种方法适合于运维人员。

如果你对无监督描述文件感兴趣，请查阅 [Unattended GPG key generation (Using the GNU Privacy Guard)](https://www.gnupg.org/documentation/manuals/gnupg/Unattended-GPG-key-generation.html) 。

```bash
$ cat >keydetails <<EOF
    %echo Generating a basic OpenPGP key
    %dry-run
    Key-Type: RSA
    Key-Length: 4096
    Key-Usage: encrypt,sign,auth
    Subkey-Type: RSA
    Subkey-Length: 4096
    Name-Real: Miranda Red
    Name-Comment: miranda
    Name-Email: miranda@gmail.com
    Expire-Date: 0
    %no-ask-passphrase
    %no-protection
    #%pubring pubring.kbx
    #%secring trustdb.gpg
    # Do a commit here, so that we can later print "done" :-)
    %commit
    %echo done
EOF

$ gpg --verbose --batch --default-new-key-algo rsa4096 --passphrase='' --gen-key keydetails
gpg: Generating a basic OpenPGP key
gpg: writing self signature
gpg: RSA/SHA512 signature from: "74AB712A74E7E380 [?]"
gpg: writing key binding signature
gpg: RSA/SHA512 signature from: "74AB712A74E7E380 [?]"
gpg: RSA/SHA512 signature from: "BFBB1015A3CA6D83 [?]"
gpg: writing public key to '/home/hz/.gnupg/pubring.kbx'
gpg: using pgp trust model
gpg: key 74AB712A74E7E380 marked as ultimately trusted
gpg: writing to '/home/hz/.gnupg/openpgp-revocs.d/DB00428501403DD8E354BE5974AB712A74E7E380.rev'
gpg: RSA/SHA512 signature from: "74AB712A74E7E380 Miranda Red (miranda) <miranda@gmail.com>"
gpg: revocation certificate stored as '/home/hz/.gnupg/openpgp-revocs.d/DB00428501403DD8E354BE5974AB712A74E7E380.rev'
gpg: done

$ gpg --fingerprint red
pub   rsa4096 2021-12-07 [SCEA]
      DB00 4285 0140 3DD8 E354  BE59 74AB 712A 74E7 E380
uid           [ultimate] Miranda Red (miranda) <miranda@gmail.com>
sub   rsa4096 2021-12-07 [SEA]

```





### 子密钥

采用 `--edit-key`，可以以交互方式在主密钥之下创建 subkey，方式是执行 `addkey` 交互命令：

```bash
$ gpg --expert --edit-key 74E7E380
gpg (GnuPG) 2.2.19; Copyright (C) 2019 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Secret key is available.

sec  rsa4096/74AB712A74E7E380
     created: 2021-12-07  expires: never       usage: SCEA
     trust: ultimate      validity: ultimate
ssb  rsa4096/BFBB1015A3CA6D83
     created: 2021-12-07  expires: never       usage: SEA 
[ultimate] (1). Miranda Red (miranda) <miranda@gmail.com>

gpg> addkey
Please select what kind of key you want:
   (3) DSA (sign only)
   (4) RSA (sign only)
   (5) Elgamal (encrypt only)
   (6) RSA (encrypt only)
   (7) DSA (set your own capabilities)
   (8) RSA (set your own capabilities)
  (10) ECC (sign only)
  (11) ECC (set your own capabilities)
  (12) ECC (encrypt only)
  (13) Existing key
  (14) Existing key from card
Your selection? 4
RSA keys may be between 1024 and 4096 bits long.
What keysize do you want? (3072) 4096
Requested keysize is 4096 bits
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0) 10y
Key expires at Fri Dec  5 08:01:39 2031 UTC
Is this correct? (y/N) y
Really create? (y/N) y
We need to generate a lot of random bytes. It is a good idea to perform
some other action (type on the keyboard, move the mouse, utilize the
disks) during the prime generation; this gives the random number
generator a better chance to gain enough entropy.

sec  rsa4096/74AB712A74E7E380
     created: 2021-12-07  expires: never       usage: SCEA
     trust: ultimate      validity: ultimate
ssb  rsa4096/BFBB1015A3CA6D83
     created: 2021-12-07  expires: never       usage: SEA 
ssb  rsa4096/E932ABCFEE23EE66
     created: 2021-12-07  expires: 2031-12-05  usage: S   
[ultimate] (1). Miranda Red (miranda) <miranda@gmail.com>

gpg> save
$
```

这里建立了一个专用于签名的子密钥，位长为4096，有效期为 10 年，KEYID 为 `E932ABCFEE23EE66`，或者短格式 `EE23EE66`。在完成了 addkey 之后，用 save 命令保存变更，并退出交互模式。



#### 导出/导入

导出主密钥的同时，将会连同其全部子密钥一起导出：

```bash
gpg --armor --output 74E7E380.priv.key.asc --export-secret-keys 74E7E380
```

但你也可以仅导出主密钥本身，这是通过在 KEYID 的末尾添加 `!` 的方式实现的：

```bash
gpg --armor --output 74E7E380.private.asc --export-secret-keys 74E7E380!
```

有必要提及的是：按照非对称密钥体系的原理来讲，导出私钥就代表着同时也导出了公钥，因为从私钥是能够推导出公钥的。

导出子密钥公钥的方式是直接使用其公钥KEYID进行导出，例如对于我们刚刚创建的 subkey：

```bash
gpg --armor --output EE23EE66.pub.asc --export EE23EE66
```

导入的方式是使用 `--import`，和此前的主密钥的方式没有什么区别。

```bash
gpg --import gpg-key.pub.asc
gpg --import gpg-key.priv.key.asc
```



#### 修改子密钥的用途

```bash
$ gpg --edit-key miranda
gpg (GnuPG) 2.2.19; Copyright (C) 2019 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Secret key is available.

sec  rsa4096/74AB712A74E7E380
     created: 2021-12-07  expires: never       usage: SCEA
     trust: ultimate      validity: ultimate
ssb  rsa4096/BFBB1015A3CA6D83
     created: 2021-12-07  expires: never       usage: SEA 
ssb  rsa4096/E932ABCFEE23EE66
     created: 2021-12-07  expires: 2031-12-05  usage: S   
[ultimate] (1). Miranda Red (miranda) <miranda@gmail.com>

gpg> key 2

sec  rsa4096/74AB712A74E7E380
     created: 2021-12-07  expires: never       usage: SCEA
     trust: ultimate      validity: ultimate
ssb  rsa4096/BFBB1015A3CA6D83
     created: 2021-12-07  expires: never       usage: SEA 
ssb* rsa4096/E932ABCFEE23EE66
     created: 2021-12-07  expires: 2031-12-05  usage: S   
[ultimate] (1). Miranda Red (miranda) <miranda@gmail.com>

gpg> change-usage
Changing usage of a subkey.

Possible actions for a RSA key: Sign Encrypt Authenticate 
Current allowed actions: Sign 

   (S) Toggle the sign capability
   (E) Toggle the encrypt capability
   (A) Toggle the authenticate capability
   (Q) Finished

Your selection? e

Possible actions for a RSA key: Sign Encrypt Authenticate 
Current allowed actions: Sign Encrypt 

   (S) Toggle the sign capability
   (E) Toggle the encrypt capability
   (A) Toggle the authenticate capability
   (Q) Finished

Your selection? q

sec  rsa4096/74AB712A74E7E380
     created: 2021-12-07  expires: never       usage: SCEA
     trust: ultimate      validity: ultimate
ssb  rsa4096/BFBB1015A3CA6D83
     created: 2021-12-07  expires: never       usage: SEA 
ssb* rsa4096/E932ABCFEE23EE66
     created: 2021-12-07  expires: 2031-12-05  usage: SE  
[ultimate] (1). Miranda Red (miranda) <miranda@gmail.com>

gpg> save
$
```

- key 2 表示选中第二个 key，即 `E932ABCFEE23EE66` 这个 subkey
- change-usage 给出一个菜单，你可以切换某个用途的使能与禁用状态
- 在显示的密钥信息中，用途 usage 的字母含义为：
  - S：用于签名与验签
  - E：用于加密与解密
  - A：用于身份认证
  - C：认证其他子密钥或UID
- 在显示的密钥信息中，首先是私钥，然后是主密钥的公钥，然后是各个子密钥；
  - sec：主私钥
  - ssb：子私钥
  - pub：主公钥
  - sub：子公钥

```bash
$ gpg --keyid-format long --list-keys miranda
pub   rsa4096/74AB712A74E7E380 2021-12-07 [SCEA]
      DB00428501403DD8E354BE5974AB712A74E7E380
uid                 [ultimate] Miranda Red (miranda) <miranda@gmail.com>
sub   rsa4096/BFBB1015A3CA6D83 2021-12-07 [SEA]
sub   rsa4096/E932ABCFEE23EE66 2021-12-07 [SE] [expires: 2031-12-05]

$ gpg --keyid-format long --list-secret-keys miranda
sec   rsa4096/74AB712A74E7E380 2021-12-07 [SCEA]
      DB00428501403DD8E354BE5974AB712A74E7E380
uid                 [ultimate] Miranda Red (miranda) <miranda@gmail.com>
ssb   rsa4096/BFBB1015A3CA6D83 2021-12-07 [SEA]
ssb   rsa4096/E932ABCFEE23EE66 2021-12-07 [SE] [expires: 2031-12-05]
```



## REFs

- [Pretty Good Privacy - Wikipedia](https://en.wikipedia.org/wiki/Pretty_Good_Privacy) 
- [GNU Privacy Guard - Wikipedia](https://en.wikipedia.org/wiki/GNU_Privacy_Guard) 
- [Secure Shell - Wikipedia](https://en.wikipedia.org/wiki/Secure_Shell)
-  [Gnu 隐私卫士 (GnuPG) 袖珍 HOWTO (中文版)](https://www.gnupg.org/howtos/zh/) 
-  [Signing PGP Keys | Jeff Carouth](https://carouth.com/articles/signing-pgp-keys/) 
- 

## 🔚



