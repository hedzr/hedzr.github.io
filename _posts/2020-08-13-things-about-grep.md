---
layout: single
title: 'Things about grep'
date: 2020-08-13 22:15:11 +0800
last_modified_at: 2020-08-15 13:00:00 +0800
Author: hedzr
tags: [grep, awk, linux, unix, shell, bash]
categories: bash utilities
comments: true
toc: true
header:
  overlay_image: /assets/images/cmdr/help-screen.png
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  We have the words to say, about grep ...

#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---



# grep 工具实用页

这次讲的是 bash 命令行中的外部命令 `grep` 的一些事情。

> 这是以前的旧文档了，不过陆续地我会回顾和订正一下，然后全数搬移到这边来，慢慢做，有的没意思的就扔了。



## 历史 [^1]

**grep**是一个最初用于 [Unix](https://zh.wikipedia.org/wiki/Unix) 操作系统的 [命令行](https://zh.wikipedia.org/wiki/%E5%91%BD%E4%BB%A4%E8%A1%8C) 工具。在给出文件列表或 [标准输入](https://zh.wikipedia.org/wiki/%E6%A0%87%E5%87%86%E8%BE%93%E5%85%A5) 后，grep会对匹配一个或多个 [正则表达式](https://zh.wikipedia.org/wiki/%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F) 的文本进行搜索，并只输出匹配（或者不匹配）的行或文本。

grep这个应用程序最早由 [肯·汤普逊](https://zh.wikipedia.org/wiki/%E8%82%AF%C2%B7%E6%B1%A4%E6%99%AE%E9%80%8A) 写成。grep原先是ed下的一个应用程序，名称来自于g/re/p（globally search a regular expression and print，以正规表示法进行全局查找以及打印）。在ed下，输入g/re/p这个命令后，会将所有匹配先定义样式的字符串，以行为单位打印出来。

在1973年，Unix第四版中，grep首次出现在man页面中。

> 这一年，是个很重要的年份！

以上主要来自维基中。



## 功能

grep 使用正则表达式搜索文本，并把匹配的行打印出来。作为输入的文本，可以来自标准输入，也可以来自（任意多个、通配符表示的）文件，新版本的 grep 也支持面向当前目录的子文件夹遍历所有文件进行正则式匹配和搜索。

grep 的典型选项包括有：

### 模式选择和解释：

  -E 将范本样式为延伸的普通表示法来使用，意味着使用能使用扩展正则表达式。(extended regular expression)
  -F 将范本样式视为固定字符串的列表。(newline-separated strings)
  -G 将范本样式视为基本正则式来使用。(basic regular expression)
  -P 将范本样式视为Perl的表示法来使用。(Perl regular expression)
  -e<范本样式> 指定字符串作为查找文件内容的范本样式。
  -f<范本文件> 指定范本文件，其内容有一个或多个范本样式，让grep查找符合范本条件的文件内容，格式为每一列的范本样式。
  -i 忽略字符大小写的差别。
  -w 只显示全字符合的列。
  -x 只显示全列符合的列。

### 杂类：

  -v 反转查找。
  -s 不显示错误信息。

### 输出控制：

  -b 显示输出行的从文件开始起的字节偏移量。
  -c 计算符合范本样式的列数。
  -h 在显示符合范本样式的那一列之前，不标示该列所属的文件名称。
  -H 在显示符合范本样式的那一列之前，标示该列的文件名称。
  -l 列出文件内容符合指定的范本样式的文件名称。
  -L 列出文件内容不符合指定的范本样式的文件名称。
  -n 在显示符合范本样式的那一列之前，标示出该列的编号。
  -o 只输出文件中匹配到的部分。
  -q 不显示任何信息。
  -R/-r 此参数的效果和指定“-d recurse”参数相同。

### 内容控制：

  -B<显示列数> 除了显示符合范本样式的那一行之外，并显示该行之前的内容。
  -A<显示列数> 除了显示符合范本样式的那一行之外，并显示该行之后的内容。
  -C<显示列数>或-<显示列数>  除了显示符合范本样式的那一列之外，并显示该列之前后的内容。



详细的选项请参考 `grep --help` 的输出。

```bash
Usage: grep [OPTION]... PATTERN [FILE]...
Search for PATTERN in each FILE.
Example: grep -i 'hello world' menu.h main.c
```



完整的参考手册请通过命令行 `man grep` 和 `info grep` 来检索。



## 基本用法 [^2]



在文件中搜索一个单词，命令会返回一个包含**“match_pattern”**的文本行：

```bash
grep match_pattern file_name
grep 'match_pattern' file_name
grep "match_pattern" file_name
```

> 上面三个命令对于grep来说是等效的。其区别在于，单引号可以防止 match_pattern 中出现空格的情况，且禁止bash嵌套计算（例如 $var 变量嵌入），而双引号在具备单引号的效果的同时也支持 bash 变量展开、bash 命令嵌套计算、bash 算术表达式计算和展开等等。

在多个文件中查找：

```bash
grep "match_pattern" file_1 file_2 file_3 ...
```

输出除之外的所有行 **-v** 选项：

```bash
grep -v "match_pattern" file_name
```

再如 

```bash
ps -auxef|grep java|grep -v grep
```

这里的 `grep -v grep` 表示从前面的结果（所有的java运行实例）中排除 带有grep文字的实例。实际上，这是为了将 `grep java` 这条命令的实例给排除掉，这样我们就会获得纯粹的 java 运行实例了。



标记匹配颜色 **--color=auto** 选项：

```bash
grep "match_pattern" file_name --color=auto
```

使用正则表达式 **-E** 选项：

```bash
grep -E "[1-9]+"
# 或
egrep "[1-9]+"
```

> egrep 表示使用 Extended 正则表达式语法。

只输出文件中匹配到的部分 **-o** 选项：

```bash
echo this is a test line. | grep -o -E "[a-z]+\."
line.

echo this is a test line. | egrep -o "[a-z]+\."
line.
```

统计文件或者文本中包含匹配字符串的行数 **-c** 选项：

```bash
grep -c "text" file_name
```

输出包含匹配字符串的行数 **-n** 选项：

```bash
grep "text" -n file_name
或
cat file_name | grep "text" -n

#多个文件
grep "text" -n file_1 file_2
```

打印样式匹配所位于的字符或字节偏移：

```bash
echo gun is not unix | grep -b -o "not"
7:not

#一行中字符串的字符便宜是从该行的第一个字符开始计算，起始值为0。选项 -b -o 一般总是配合使用。
```

搜索多个文件并查找匹配文本在哪些文件中：

```bash
grep -l "text" file1 file2 file3...
```

忽略匹配样式中的字符大小写：

```bash
echo "hello world" | grep -i "HELLO"
hello
```

选项 **-e** 指定多个匹配样式：

```bash
echo this is a text line | grep -e "is" -e "line" -o
is
line

#也可以使用-f选项来匹配多个样式，在样式文件中逐行写出需要匹配的字符。
cat patfile
aaa
bbb

echo aaa bbb ccc ddd eee | grep -f patfile -o
```

### grep递归搜索文件

在多级目录中对文本进行递归搜索：

```bash
grep "text" . -r -n
# .表示当前目录。
```

在grep搜索结果中包括或者排除指定文件：

```bash
#只在目录中所有的.php和.html文件中递归搜索字符"main()"
grep "main()" . -r --include *.{php,html}

#在搜索结果中排除所有README文件
grep "main()" . -r --exclude "README"

#在搜索结果中排除filelist文件列表里的文件
grep "main()" . -r --exclude-from filelist
```

使用0值字节后缀的 grep 与 [xargs](http://man.linuxde.net/xargs)：

```bash
#测试文件：
echo "aaa" > file1
echo "bbb" > file2
echo "aaa" > file3

grep "aaa" file* -lZ | xargs -0 rm
#执行后会删除file1和file3，grep输出用-Z选项来指定以0值字节作为终结符文件名（\0），xargs -0 读取输入并用0值字节终结符分隔文件名，然后删除匹配文件，-Z通常和-l结合使用。
```

grep静默输出：

```bash
grep -q "test" filename
#不会输出任何信息，如果命令运行成功返回0，失败则返回非0值。一般用于条件测试。
```

打印出匹配文本之前或者之后的行：

```bash
#显示匹配某个结果之后的3行，使用 -A 选项：
seq 10 | grep "5" -A 3
5
6
7
8

#显示匹配某个结果之前的3行，使用 -B 选项：
seq 10 | grep "5" -B 3
2
3
4
5

#显示匹配某个结果的前三行和后三行，使用 -C 选项：
seq 10 | grep "5" -C 3
2
3
4
5
6
7
8

#如果匹配结果有多个，会用“--”作为各匹配结果之间的分隔符：
echo -e "a\nb\nc\na\nb\nc" | grep a -A 1
a
b
--
a
b
```



`grep -P` 表示启用perl语法规则。此时你可以使用 Perl 正则式语法来编写规则。

> Perl 正则式语法，又被称作 PCRE表达式，可以参考 [Wiki 的PCRE表达式全集](<https://zh.wikipedia.org/wiki/%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F>)。



## 常见的惯用法

### find text string recursively

在一个文件夹中，我不知道哪些文件包含了 fantasy 文字描述，可以这样找：

```bash
grep -PHni 'fantasy' * -r
```

这条命令会列举当前文件夹中所有内容包含fantasy的文件，将它们的文件名和包含fantasy文字的行及其行号都列举出来。

如果你还需要看看匹配文字的前后上下文，可以用：

```bash
grep -PHni 'fantasy' * -r -C 3
```

`-P` 表示使用 Perl 正则式语法

`-H` 表示打印出匹配行所在的文件名

`-n` 表示打印出匹配行的行号

`-i` 表示忽略大小写

`-C 3` 表示前后三行都列举出来。

`-B 3` 表示前面三行也被列举出来。

`-A 3` 表示后面三行也被列举出来。



### find ip address

使用 `-o` 参数时，grep 常常被用于抽取特定模式的文字内容，而不是将整个匹配行进行输出。

例如：

```
$ ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: ens3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether 56:00:01:c6:ab:01 brd ff:ff:ff:ff:ff:ff
    inet 217.179.87.159/23 brd 217.179.87.255 scope global dynamic ens3
       valid_lft 63125sec preferred_lft 63125sec
3: ens7: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 5a:00:01:c6:ab:01 brd ff:ff:ff:ff:ff:ff

$ ip addr | grep -Po 'inet \d+\.\d+\.\d+\.\d+' | grep -v 'inet 127' | grep -Po '\d+.+'
217.179.87.159
```

在这里其中表达式一会抽出 'inet xxxxxx' 的两行内容，形如：

```bash
inet 127.0.0.1
inet 217.179.87.159
```

表达式二会将 127.0.0.1 行排除掉，表达式三去掉inet前缀，最后就得到了我们想要的IP地址了。

想要抽取 IPv6 的地址也可以用相似的办法。

当然，表达式三针对 'inet 217.179.87.159' 进行抽取是比较累的方法，实际上这里我们会采用 awk来切掉前半部分：`awk '{print $2}'`。这个短语按照空格将输入文本切分成 n 个小段，`$2` 表示的是第二段也就是我们想要的 IP 地址了。



### ports

如果想要找出当前主机中监听端口的服务，可以利用 lsof 命令的输出：

```bash
$ sudo lsof -Pni|grep LISTEN
sshd        858              root    3u  IPv4    19572      0t0  TCP *:22 (LISTEN)
sshd        858              root    4u  IPv6    19582      0t0  TCP *:22 (LISTEN)
nginx      6170              root    9u  IPv4 53951827      0t0  TCP *:443 (LISTEN)
nginx      6170              root   10u  IPv4 53951828      0t0  TCP *:8060 (LISTEN)
nginx      6170              root   11u  IPv4 53951829      0t0  TCP *:80 (LISTEN)
```

据此，我们可以写出一个常用命令函数 ports，并将其放在 .bashrc 文件中，于是我们可以简便地检视端口号了。这个函数可以这么写：

```bash
ports () {
    local x=$1
    if [ "$x" == "" ]; then
        sudo lsof -Pni|grep -P 'LISTEN|UDP'
    else
        sudo lsof -Pni|grep -P 'LISTEN|UDP'|grep ":$x"
    fi
}
```

然后我们可以这么使用它：

```bash
ports
ports 443
ports 22
```

> 注意，你最好将自己的 Linux 账户调整为免密码sudo的，否则使用 ports 时可能需要输入自己的密码来获得 sudo 身份。当然，如果只想检查自己启动的服务的端口号的话，可以去掉sudo指令。

### has-user, has-group

如何检测一个linux账户有否存在呢？

Linux中没有通用的命令专门用于此项检测。通常像useradd之类的命令会在用户存在时返回失败，但这并非恰当的检测方法。

为了达到目的，我们只能自行解释 /etc/passwd 文件。这个文件会罗列系统中所有的账户，其格式形如这样：

```bash
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
...
```

所以，判断一个用户是否存在，只需判断第一项字段就可以了。

很明显，awk适合做这事：

```bash
$ cat /etc/passwd|awk -F: '{print $1}'
root
daemon
bin
sys
sync
```

不过本文中还是要用grep来解决问题：

```bash
has-user() {
    local name=${1:-root}
    cat /etc/passwd|grep -q "^$name"
}

has-user 'joe' && echo 'joe exists' || 'joe not exists'
```

类似的，我们还可以定义相似的函数 has-group：

```bash
has-group () {
    local name=${1:-root}
    cat /etc/group|grep -q "^$name"
}

has-group staff && echo 'staff group exists' || echo 'staff group not exists'
```



### 更多

下面，我们给出一些实用的例子：

```bash
function find_ip () { ip addr|grep -Poi "inet ((192.168.\d+.\d+)|(172.\d+.\d+.\d+)|(10.\d+.\d+.\d+))"|grep -Poi "\d+.\d+.\d+.\d+"; }

function find_ip_uniq () { ip addr|grep -Poi "inet ((192.168.\d+.\d+)|(172.\d+.\d+.\d+)|(10.\d+.\d+.\d+))"|grep -Poi "\d+.\d+.\d+.\d+"|grep -v '\.255'|head -n1; }

genpasswd(){ strings /dev/urandom|grep -oP '[[:alnum:]]|[\#\%\@\&\^]'|head -n "${1:-16}"|tr -d '\n';echo;}


```



## 结束语

grep 和 awk，sed 是 Linux 的三大工具，很大程度上代表的 Linux 的设计哲学，即小巧、专注、组合。使用 grep 这样的工具最大的技巧就在于对目标行为进行分解：拿到源文本，筛选源文本，构造结果输出。

本文也只是讲解到了基本的用法部分，打开思路还是要看你自己的聪明才智。

## 参考

[^1]: <https://zh.wikipedia.org/wiki/Grep>
[^2]: <http://man.linuxde.net/grep>
[^3]: <https://linux.die.net/man/1/grep>
[^4]: <https://en.wikipedia.org/wiki/Grep>







🔚