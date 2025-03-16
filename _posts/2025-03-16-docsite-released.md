---
layout: single
title: Docsite Released
date: 2025-03-15 09:58:00 +0800
last_modified_at: 2025-03-16 09:58:00 +0800
Author: hedzr
tags: [nextjs]
categories: devops react
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20211226010348217.png
  overlay_image: /assets/images/ubuntuhero.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
excerpt: >-
  docs.hedzr.com released [...]
---



## docs.hedzr.com

如题，[docs.hedzr.com](https://docs.hedzr.com) 总算是释出了。

当前主要的成果是初步完成了我所满意的运行框架，然后是初步完成了 cmdr.v2 的文档撰写。
其次是为一些其他的我的开源项目也定下了基本的撰写框架。

因此，未免继续自我拖延，还是先释放出来比较好，自己会更没借口。

> 当前只是先行 public，文档撰写并未彻底完成。
>
> 按照计划，撰写工作将会在余生中保持，也没有 final ending 的时候。
>
> 当然，至少阶段性的内容我仍会保持进度尽快完成。

## 内幕

经过大量时间的调查、研究和尝试，最终还是自行搭起架子，使用 Nextjs 和 Fumadocs 为基础建立了 docs 框架结构。

我想要的文档、手册撰写框架，其实也未必很私有，还是应该很有代表性的。

1. 支持 Markdown 或者类似的简单标记语言
2. Dark 模式自适应
3. 面向各类终端的响应式布局
4. 章节结构灵活，支持分部（Parts）
5. 支持多语种
6. 支持软件手册多版本

在页面章节结构上，我希望要有：

1. 左侧 sidebar 的分部、分章节
2. 右侧（或者页内）的当前页 headings 结构
3. headings 自动编号

在 Markdown 支持上，我希望要有：

1. 通用 Markdown 标准或/和Github扩展
2. 上下标，删除线，脚注
3. 公式支持
4. LaTeX 支持
5. mermaid 支持
6. Tabs 代码块支持
7. 代码块行号，高亮。

然而这样的要求基本上不可得。也许是我太吹毛求疵了。

### 做选择题

最为接近要求的是 Sphinx。

事实上，我花费了大量精力来架构一个完整的基于 Sphinx 的撰写框架，它也确实能够很好地工作，上面提到的各种特性也通过各类插件集成和整合的七七八八了。

然后用起来就是不对劲。

可能是我看不上 python，或者 ruby，这些引擎驱动的前端都太莽拙了，无论是反应、细节调整，还是部署，全都差一点点，从而整个效果就差了一个大档次。

然后是 Nodejs 系列的什么 vuepress，vitepress 等等了，挺省事的。cmdr-docs v1 就是使用 vuepress 做的，省心省力。缺点就是功能缺失，结构调整起来基本不可能。

这和我近年来放弃前端开发有关。另一方面，即使我不放弃前端的具体开发，vue 的设计理念也是我看不上的，我是比较喜欢 react 或者 angular 风格的。

其他的工具，包括 MkDocs 等等，我也都有深入实作和研究过。但最终还是一个不满意就终结了。

但是优秀的 docsite 成品很多，很多都能令人眼前一亮，它们基本都是 nodejs 基础上的。

这也很好理解，我所说的 docsite 应该具备的种种特性，大部分都需要优秀的前端界面效果来呈现，需要良好设计的 css module 来予以约束。所以基于后端方式的静态页面 generators 往往难以满足精细要求。

基于 nodejs 的 docsite 工具的典型缺点是稍有编辑活动时，就大量的各种 live 更新以便反应到开发时的 web page 上，消耗大量资源。

这些缺点，在去年我花费精力再度学习 react 时基本得到了改善，谈解决还不至于，nodejs 解决不了虚耗资源的问题。但至少是可以接受了。

### 选定离手

所以这些年来对 docsite tool 持续不断的研究结果，就是唯有自行建立一套满足个人各种要求的框架。

在进一步地在琳琅满目的前端框架中筛选、比较，冗长的试用、体验，放弃或者进一步深入，之后，我个人的决定是 NextJS 和 MDX 来做自行整合。为了省点力气，又从大批 NextJS templates 中选出了 Fumadocs 来当中间层基础，以免从零开始累死人。

这就是 [cmdr-docs-dev](https://github.com/hedzr/cmdr-docs-dev) 了。

> 目前分为两个阶段，一是 dev preview 阶段，会发布到 [preview.hedzr.com](https://preview.hedzr.com)，在稳定后在合并到 master 上，即 [docs.hedzr.com](https://docs.hedzr.com)。
>
> 你可以访问 preview 网站，但需要经过 vercel 认证，这也很简单，用你的 Github 帐户身份授权一下就行了。

在选定了 NextJS + MDX + Fumadocs 之后，又有大量的周折，倒也不必提起了。总之，rollback 掉所有周折之后，我想要的 docsite 基本上算是有了，就在 [这里](https://docs.hedzr.com)。

## 后记

所以我会考虑经常性地在 [这里](https://docs.hedzr.com) 做更新。

一方面是组织我的开源项目的文档。

另一方面，是考虑是否要做一些结集工作，相应地 blog 主站就不会怎么更新了，或许。

实际上在 docs.hedzr.com 中我已经整合了 blog 这一模块。但没有真正启用它。因为，一旦我灌入 200 篇 posts，无论是 pnpm build 还是 vercel build 都会陷入难堪的境地。如果是上推到 repo 等待 vercel 的构建，那么结果一定是构建时间超过 45min 而异常终止。

解决问题的方法，一是买 vercel 服务，二是别灌入那么多 posts。

所以，这里就是单纯的 docs，而 blog 继续保持在 Github Pages 中单独发行吧。

🔚
