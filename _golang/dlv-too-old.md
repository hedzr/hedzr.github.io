---
layout: single
title: 'print/println function'
date: 2023-02-25 00:07:11 +0800
last_modified_at: 2023-02-25 00:29:11 +0800
Author: hedzr
tags: [golang]
categories: golfing
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20230301083103776.png
  overlay_image: /assets/images/unsplash-image-1.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Golang builtin functions ...
---



## Version of Delve is too old

在 GoLand 中调试一个 app 或者 test 时，会可能产生一个警告信息：

```
WARNING: undefined behavior - version of Delve is too old for Go version 1.20.1 (maximum supported version 1.19)
```

形如下图所示：

![image-20230301083103776](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20230301083103776.png)

### 表述

事实上，在早期版本的 GoLand 中，这种情况会表现的更糟糕，用户实际得到的不是 warning 而是 panic。

在当前的 GoLand 2023.3.2 中，它是如上图的，表面上看起来是仅仅不过一个警告信息而已，实质上隐含的问题也很糟糕：Step in 有时候会失效。而且问题并不简单，有时候 Step in 还是正常的，你不会知道哪一步，例如是在 caller calling sentense 还是 get into function body from its signature 又或是别的哪一句做 step in 的时候就失效了。

这对我确实造成了困扰。

但 vscode 的 fully test running 功能缺乏一个关键能力：在一个失败的 test 上右键菜单可以立即开启一个新的 running config，此时你要运行或调试这个失败的 test 就无比简单。这也是我最需要的一个能力，在一次冗长的 coverage testing 过程中找到失败的几个 tests 并且去 debug 它们中的每一个，寻找到真实的问题原因，需要仰赖上述的这个关键能力，而不是在大堆 editor tabs 和冗长的代码中 scrolling 去寻找到 TestXXX 函数，然后点击那小小的 debug 文字链接。

vscode 的 Golang 更缺乏另一个功能，在一个 main 函数上为什么就没有 run/debug 快速链接呢？以及增加运行配置指定命令行参数的功能，如同 GoLand 那样。所以这就是 editor 和 IDE 之间的本质的差别吧：vscode 的 launch 特性以及一个分离的侧栏 pane，实在是让人感到深切的不便。



### Known Issues

离题了，言归正传，我寻找了 JetBrains 的有关信息，发现这是一个传统性的 issue，或者应该称作是 issues，因为它以及它衍生出来的 issues 实在是太多了，而且可以追溯到早于 go1.10 以及那时候的 GoLand。

一些 issues 是在这里：

In GoLand earlier versions, this might be a panic. The relevant issues partially are:

-  [undefined behavior - version of Delve is too old for Go version 1.20.0 (maximum supported version 1.19) : GO-14287](https://youtrack.jetbrains.com/issue/GO-14287) 
-  [Cannot step into functions from certain local packages with CFNetwork framework : GO-13786](https://youtrack.jetbrains.com/issue/GO-13786/Cannot-step-into-functions-from-certain-local-packages-with-CFNetwork-framework) 
-  [Update dlv version in GoLand for support go 1.19 (when dlv will be ready) : GO-13234](https://youtrack.jetbrains.com/issue/GO-13234/Update-dlv-version-in-GoLand-for-support-go-1.19-when-dlv-will-be-ready) 
-  [Version of Delve is too old for this version of Go : GO-7670](https://youtrack.jetbrains.com/issue/GO-7670/Version-of-Delve-is-too-old-for-this-version-of-Go) 
   -  [https://youtrack.jetbrains.com/issue/GO-2997/Provide-a-way-to-upgrade-Delve-w-o-upgrading-the-IDE](https://youtrack.jetbrains.com/issue/GO-2997/Provide-a-way-to-upgrade-Delve-w-o-upgrading-the-IDE) 
   -  [https://youtrack.jetbrains.com/issue/GO-8186/Delve-version-too-high-for-Go-1.10](https://youtrack.jetbrains.com/issue/GO-8186/Delve-version-too-high-for-Go-1.10) 

值得大书特书的，可能是开发者团队的那种含蓄的傲慢吧。

对于用户请求是否能够提供一个 setting 界面以便能够自行指定一个具体的 dlv path 从而避免此问题，JB GDT 的某人的答案是 `I'm not sure that we should implementing an additional setting for that case`.

怎么说呢？

我能理解为什么他们不愿意提供一个 dlv path 定制设置能力。这个能力除了能解决上面提到的警告之外，也完全可以造成更新后的新版本 GoLand 无法工作的问题，而问题的根源则会掉转过来，不再是 goland bundled dlv 太旧，而是因为升级之后用户给出的定制 dlv 可能会太旧。

不过该官方回应听起来非常的无语。因为它只是拒绝，却没有理由。而且它还用法国式的顾左右而言他的恶趣味来搞个回应，着实很是含蓄。

### Workaround

很多人，包括 stackoverlow 都给出的解法，当然都是临时性的，一旦你升级到新版本的 GoLand，特别要警惕那些使能 JetBrains Toolbox 自动升级功能的人，一定要注意摘除你的过时的陈旧的 dlv。

一个有效简洁的解法如下：

Workaround steps until this is fixed:

1. Install dlv binary with `go install github.com/go-delve/delve/cmd/dlv@latest`
2. Set the `dlv.path=<path_to_dlv_executable>` under `Help > Edit Custom Properties`
3. Restart GoLand

来自于 Levi Blackstone 在 GO-14287 的回答。





🔚