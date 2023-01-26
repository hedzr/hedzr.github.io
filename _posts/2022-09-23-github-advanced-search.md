---
layout: single
title: "GitHub 高级搜索"
date: 2022-09-23 05:25:00 +0800
last_modified_at: 2022-09-23 15:10:00 +0800
Author: hedzr
tags: [tech,github,search]
categories: tech nology
comments: true
toc: true
header:
  teaser: /assets/images/unsplash-gallery-image-1-th.jpg
  overlay_image: /assets/images/unsplash-gallery-image-1-th.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  搜索与hack...
---



> 按：  
>
> 本文一半是摘编，且未必全数翻译。一部分则是应用，拓宽思路。

GitHub 支持一套很强大到搜索语法，虽然不一定能像 Google 的高级搜索语法那么普适，但在面对本专业的代码内容进行搜索时是很具备领域权威能力的。

## 语法描述

GitHub 提供一个主题入口 [GitHub Search Cheat Sheet](https://github.com/search#search_cheatsheet_pane) ，你可以从这个入口开始你的搜索之旅，而不是直接在左上角的搜索框中搜索。因为在这个主题入口中给出的帮助信息：For an [advanced search](https://github.com/search/advanced), use some of our prefixes. 其中 `prefixes` 是可以点击的，然后会得到一个页面内的弹出对话框，大概像这样子：

![image-20220918075935077](https://github.com/hzimg/blog-pics/blob/master/Picsee/github-advanced-search/image-20220918075935077.png?raw=true)

换句话说，它有助于你从一无所知开始进行 GitHub 中的高级搜索。

你可以直接使用  [advanced search](https://github.com/search/advanced) 这一入口。这一入口将高级搜索语法转变为一系列的输入框，让你可以以填空的方式进行搜索，适合于不知道高级搜索语法能力的人群，并且能够给他们充分的提示以掌握搜索语法。

![image-20220918080311727](https://github.com/hzimg/blog-pics/blob/master/Picsee/github-advanced-search/image-20220918080311727.png?raw=true)

对于已经掌握搜索语法的人群来说，就可以直接使用 [GitHub Search Cheat Sheet](https://github.com/search#search_cheatsheet_pane) 或者是页面左上角的搜索框来开始搜索。

## 搜索语法



以下内容摘编于 GitHub 上的各种官方资源，例如 [Understanding the search syntax - GitHub Docs](https://docs.github.com/en/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax) 等等。



### 查询大于或小于另一个值的值

可以使用 `>`、`>=`、`<` 和 `<=` 搜索大于、大于或等于、小于以及小于或等于另一个值的值。

| 查询  | 示例                                                         |
| :---- | :----------------------------------------------------------- |
| `>n`  | **[cats stars:>1000](https://github.com/search?utf8=✓&q=cats+stars%3A>1000&type=Repositories)** 匹配有超过 1000 个星的具有“cats”一词的存储库。 |
| `>=n` | **[cats topics:>=5](https://github.com/search?utf8=✓&q=cats+topics%3A>%3D5&type=Repositories)** 匹配有 5 个或以上主题的具有“cats”一词的存储库。 |
| `<n`  | **[cats size:<10000](https://github.com/search?utf8=✓&q=cats+size%3A<10000&type=Code)** 匹配尺寸小于 10 KB 的文件中的具有“cats”一词的代码。 |
| `<=n` | **[cats stars:<=50](https://github.com/search?utf8=✓&q=cats+stars%3A<%3D50&type=Repositories)** 匹配有 50 或更少个星的具有“cats”一词的存储库。 |

还可以使用[范围查询](https://docs.github.com/cn/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax#query-for-values-between-a-range)搜索大于或等于或者小于或等于其他值的值。

| 查询   | 示例                                                         |
| :----- | :----------------------------------------------------------- |
| `n..*` | **[cats stars:10..\*](https://github.com/search?utf8=✓&q=cats+stars%3A10..\*&type=Repositories)** 等效于 `stars:>=10` 并匹配有 10 或更多个星的具有“cats”一词的存储库。 |
| `*..n` | **[cats stars:\*..10](https://github.com/search?utf8=✓&q=cats+stars%3A"\*..10"&type=Repositories)** 等效于 `stars:<=10` 并匹配有 10 或更少个星的具有“cats”一词的存储库。 |



### 查询范围之间的值

使用范围语法 `n..n` 搜索范围内的值，其中第一个数字 n 是最低值，第二个是最高值。

| 查询   | 示例                                                         |
| :----- | :----------------------------------------------------------- |
| `n..n` | **[cats stars:10..50](https://github.com/search?utf8=✓&q=cats+stars%3A10..50&type=Repositories)** 匹配有 10 到 50 个星之间的具有“cats”一词的存储库。 |



### 查询日期

可以使用 `>`、`>=`、`<`、`<=` 和[范围查询](https://docs.github.com/cn/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax#query-for-values-between-a-range)搜索早于或晚于另一个日期或属于某个日期范围内的日期。 日期格式必须遵循 [ISO8601](http://en.wikipedia.org/wiki/ISO_8601) 标准，即 `YYYY-MM-DD`（年-月-日）。

| 查询                     | 示例                                                         |
| :----------------------- | :----------------------------------------------------------- |
| `>YYYY-MM-DD`            | **[cats created:>2016-04-29](https://github.com/search?utf8=✓&q=cats+created%3A>2016-04-29&type=Issues)** 匹配具有 2016 年 4 月 29 日后创建的“cats”一词的问题。 |
| `>=YYYY-MM-DD`           | **[cats created:>=2017-04-01](https://github.com/search?utf8=✓&q=cats+created%3A>%3D2017-04-01&type=Issues)** 匹配具有 2017 年 4 月 1 日或之后创建的“cats”一词的问题。 |
| `<YYYY-MM-DD`            | **[cats pushed:<2012-07-05](https://github.com/search?q=cats+pushed%3A<2012-07-05&type=Code&utf8=✓)** 匹配具有在 2012 年 7 月 5 日之前推送到存储库中的“cats”一词的代码。 |
| `<=YYYY-MM-DD`           | **[cats created:<=2012-07-04](https://github.com/search?utf8=✓&q=cats+created%3A<%3D2012-07-04&type=Issues)** 匹配具有 2012 年 7 月 4 日或之前创建的“cats”一词的问题。 |
| `YYYY-MM-DD..YYYY-MM-DD` | **[cats pushed:2016-04-30..2016-07-04](https://github.com/search?utf8=✓&q=cats+pushed%3A2016-04-30..2016-07-04&type=Repositories)** 匹配具有在 2016 年 4 月末和 7 月之间推送到其中的“cats”一词的存储库。 |
| `YYYY-MM-DD..*`          | **[cats created:2012-04-30..\*](https://github.com/search?utf8=✓&q=cats+created%3A2012-04-30..\*&type=Issues)** 匹配 2012 年 4 月 30 日之后创建的包含“cats”一词的问题。 |
| `*..YYYY-MM-DD`          | **[cats created:\*..2012-07-04](https://github.com/search?utf8=✓&q=cats+created%3A\*..2012-07-04&type=Issues)** 匹配 2012 年 7 月 4 日之前创建的包含“cats”一词的问题。 |

也可以在日期后添加可选的时间信息 `THH:MM:SS+00:00`，以按小时、分钟和秒进行搜索。 即 `T`，随后是 `HH:MM:SS`（时-分-秒）和 UTC 时差 (`+00:00`)。

| 查询                        | 示例                                                         |
| :-------------------------- | :----------------------------------------------------------- |
| `YYYY-MM-DDTHH:MM:SS+00:00` | **[cats created:2017-01-01T01:00:00+07:00..2017-03-01T15:30:15+07:00](https://github.com/search?utf8=✓&q=cats+created%3A2017-01-01T01%3A00%3A00%2B07%3A00..2017-03-01T15%3A30%3A15%2B07%3A00&type=Issues)** 匹配 2017 年 1 月 1 日凌晨 1 点 （UTC 时差为 `07:00`）和 2017 年 3 月 1 日下午 3 点 （UTC 时差为 `07:00`）之间创建的问题。 |
| `YYYY-MM-DDTHH:MM:SSZ`      | **[cats created:2016-03-21T14:11:00Z..2016-04-07T20:45:00Z](https://github.com/search?utf8=✓&q=cats+created%3A2016-03-21T14%3A11%3A00Z..2016-04-07T20%3A45%3A00Z&type=Issues)** 匹配 2016 年 3 月 21 日下午 2:11 和 2016 年 4 月 7 日晚上 8:45 之间创建的问题。 |



### 排除特定结果

可以使用 `NOT` 语法排除包含特定字词的结果。 `NOT` 运算符只能用于字符串关键字。 不适用于数字或日期。

| 查询  | 示例                                                         |
| :---- | :----------------------------------------------------------- |
| `NOT` | **[hello NOT world](https://github.com/search?q=hello+NOT+world&type=Repositories)** 与包含字词“hello”但不包含字词“world”的存储库匹配。 |

缩小搜索结果范围的另一种途径是排除特定的子集。 可以为任何搜索限定符添加 `-` 前缀，以排除该限定符匹配的所有结果。

| 查询                                                         | 示例                                                         |
| :----------------------------------------------------------- | :----------------------------------------------------------- |
| `-QUALIFIER`                                                 | **[`cats stars:>10 -language:javascript`](https://github.com/search?q=cats+stars%3A>10+-language%3Ajavascript&type=Repositories)** 匹配有多于 10 个星但不是用 JavaScript 编写的具有“cats”一词的存储库。 |
| **[`mentions:defunkt -org:github`](https://github.com/search?utf8=✓&q=mentions%3Adefunkt+-org%3Agithub&type=Issues)** 匹配提到未在 GitHub 组织中的存储库的 @defunkt 的问题 |                                                              |



### 对带有空格的查询使用引号

如果搜索含有空格的查询，您需要用引号将其括起来。 例如：

- [cats NOT "hello world"](https://github.com/search?utf8=✓&q=cats+NOT+"hello+world"&type=Repositories) 匹配具有“cats”一词但没有“hello world”一词的存储库。
- [build label:"bug fix"](https://github.com/search?utf8=✓&q=build+label%3A"bug+fix"&type=Issues) 匹配具有标签“bug fix”的包含“build”一词的问题。

某些非字母数字符号（例如空格）会从引号内的代码搜索查询中删除，因此结果可能出乎意料。



### 使用用户名的查询

如果搜索查询包含需要用户名的限定符（例如 `user`、`actor` 或 `assignee`），可以使用任何 GitHub 用户名指定特定的人，或使用 `@me` 指定当前用户。

| 查询                 | 示例                                                         |
| :------------------- | :----------------------------------------------------------- |
| `QUALIFIER:USERNAME` | [`author:nat`](https://github.com/search?q=author%3Anat&type=Commits) 匹配由 @nat 创建的提交 |
| `QUALIFIER:@me`      | [`is:issue assignee:@me`](https://github.com/search?q=is%3Aissue+assignee%3A%40me&type=Issues) 匹配分配给查看结果的人员的问题 |

只能使用带有限定符的 `@me` 且不能用作搜索词，例如 `@me main.workflow`。



## 运用

### Basic search

| This search                      | Finds repositories with…                                  |
| -------------------------------- | --------------------------------------------------------- |
| cat stars:>100                   | Find cat repositories with greater than 100 stars.        |
| user:defunkt                     | Get all repositories from the user defunkt.               |
| tom location:"San Francisco, CA" | Find all tom users in "San Francisco, CA".                |
| join extension:coffee            | Find all instances of join in code with coffee extension. |
| NOT cat                          | Excludes all results containing cat.                      |

------



### Repository search 

Repository search looks through the projects you have access to on GitHub. You can also filter the results:

| This search             | Finds repositories with…                                     |
| ----------------------- | ------------------------------------------------------------ |
| cat stars:>100          | Find cat repositories with greater than 100 stars.           |
| user:defunkt            | Get all repositories from the user defunkt.                  |
| pugs pushed:>2013-01-28 | Pugs repositories pushed to since Jan 28, 2013.              |
| node.js forks:<200      | Find all node.js repositories with less than 200 forks.      |
| jquery size:1024..4089  | Find jquery repositories between the sizes 1024 and 4089 kB. |
| gitx fork:true          | Repository search includes forks of gitx.                    |
| gitx fork:only          | Repository search returns only forks of gitx.                |

------



### Code search 

Code search looks through the files hosted on GitHub. You can also filter the results:

| This search                      | Finds repositories with…                                     |
| -------------------------------- | ------------------------------------------------------------ |
| install repo:charles/privaterepo | Find all instances of install in code from the repository charles/privaterepo. |
| shogun user:heroku               | Find references to shogun from all public heroku repositories. |
| join extension:coffee            | Find all instances of join in code with coffee extension.    |
| system size:>1000                | Find all instances of system in code of file size greater than 1000kbs. |
| examples path:/docs/             | Find all examples in the path /docs/.                        |
| replace fork:true                | Search replace in the source code of forks.                  |

------



### Issue search 

Issue search looks through issues and pull requests on GitHub. You can also filter the results:

| This search                   | Finds issues…                                   |
| ----------------------------- | ----------------------------------------------- |
| encoding user:heroku          | Encoding issues across the Heroku organization. |
| cat is:open                   | Find cat issues that are open.                  |
| strange comments:>42          | Issues with more than 42 comments.              |
| hard label:bug                | Hard issues labeled as a bug.                   |
| author:mojombo                | All issues authored by mojombo.                 |
| mentions:tpope                | All issues mentioning tpope.                    |
| assignee:rtomayko             | All issues assigned to rtomayko.                |
| exception created:>2012-12-31 | Created since the beginning of 2013.            |
| exception updated:<2013-01-01 | Last updated before 2013.                       |

------



### User search 

User search finds users with an account on GitHub. You can also filter the results:

| This search                      | Finds repositories with…                                 |
| -------------------------------- | -------------------------------------------------------- |
| fullname:"Linus Torvalds"        | Find users with the full name "Linus Torvalds".          |
| tom location:"San Francisco, CA" | Find all tom users in "San Francisco, CA".               |
| chris followers:100..200         | Find all chris users with followers between 100 and 200. |
| ryan repos:>10                   | Find all ryan users with more than 10 repositories.      |



## 示例



### Private Key

可以直接搜索出大量的私钥，方法是采用关键字 `BEGIN RSA PRIVATE KEY` 来搜索纯文本内容，可能的结果类似于：

![image-20220919143857845](https://github.com/hzimg/blog-pics/blob/master/Picsee/github-advanced-search/image-20220919143857845.png?raw=true)

接下来就是评估工作了。



### Password

直接搜索可用的密码，这本身不怎么靠谱。但是与密码操作有关系的可以有很多内容：

![image-20220919144034472](https://github.com/hzimg/blog-pics/blob/master/Picsee/github-advanced-search/image-20220919144034472.png?raw=true)

很难说这些内容能够起到什么样的作用。

但是运用这些信息的能力属于你的个人创造力和想象力了。



### 针对 PHP：代码审计

针对 PHP 网站的后段代码做代码审计，可以审查 `$_GET` 误用，`eval` 调用滥用等等情况，例如搜索词：`extension:php mysql_query $_GET`:

![image-20220920105911944](https://github.com/hzimg/blog-pics/blob/master/Picsee/github-advanced-search/image-20220920105911944.png?raw=true)

这些后端代码是否滥用误用相应的 query 参数，导致潜在的 SQL 注入漏洞，shell 反弹注入漏洞等等，可以通过上面的代码审计来作出评估。



### MySQL Password / History

可以试试 `extension:mysql PASSWORD`，结果可能出人意料：

![image-20220920110212215](https://github.com/hzimg/blog-pics/blob/master/Picsee/github-advanced-search/image-20220920110212215.png?raw=true)

尽管图例中的两个结果可能不是漏洞，但是……





### MySQL Dump file

可以搜索 mysql 备份文件，这些备份文件可能包含有价值的基础信息，甚至是包含 weak accounts 信息。

搜索的方法是使用 GitHub 的 extension 语法，查找：`extension:mysqldump sql`

可能的结果如同这样：

![image-20220920105454060](https://github.com/hzimg/blog-pics/blob/master/Picsee/github-advanced-search/image-20220920105454060.png?raw=true)

你需要在这个基础上进行进一步的过滤。





### Dork

用 GitHub 搜索来寻找 0-day 漏洞，后门？这其实是可能的，红黑方都乐意这么做。

不过如果你不是业内人士，可能并不能有效滴下手。

作为一个例子，我们探究一下 PHP 代码中潜在的远程代码执行的漏洞，这种漏洞的根源在于没有进行注入的代码的验证（抑或是无法进行合规性验证）就直接执行它们，这就导致非法代码能够在 server side 以合法的身份被执行。

解决问题的首要手段是让 PHP 的守护进程（例如 PHP-FPM）运行在低、无权限的 linux 帐户身份之下。这样一来，即使非法代码被意外执行，其破坏力也不足以打破 linux server 的 sudo 屏障，例如修改 `/etc/shadow`、`/etc/profile.d`、`/etc/sudoers.d` 等等敏感环境。

其次则是罗列出代码中的 eval 调用，这是 PHP 将一个字符串当作 PHP 代码执行的关键性调用，所以在 GitHub 上我们可以以寻找它为第一线索，罗列出所有开源代码中可能的脆弱位置：

```
stars:>1000 forks:>100 extension:php "eval(preg_replace("
```

这个搜索语法能够将热门 PHP 仓库的源代码中的 eval 指令罗列出来，然后攻击者/红客可以 review 相关代码来评估对应代码的牢固性。

当然，由于开发者对这样的问题已经具有了足够的敏感度，上面的搜索将会一无所获。取而代之的，作为一个研究，你可以使用如下的搜索串来谋求一个搜索结果供理解高级搜索语法的效果：

```
"preg_replace" extension:php language:PHP
```

它可能会返回这样的结果：

![image-20220918075402094](https://github.com/hzimg/blog-pics/blob/master/Picsee/github-advanced-search/image-20220918075402094.png?raw=true)







## REFs

参考

- GitHub-hack topic: https://github.com/topics/github-hack
- google-hacking topic: https://github.com/topics/google-hacking

以上





:end:

