---
layout: single
title: 认识 Here Document
date: 2019-05-26 08:00:00 +0800
last_modified_at: 2020-09-16 17:35:00 +0800
author: hedzr
tags: [shell, bash, devops]
categories: devops shell
comments: true
toc: true
header:
  overlay_image: /assets/images/bash-shell.png
  overlay_filter: rgba(255, 255, 255, 0.5)
excerpt: >-
  Here Document in a nutshell
---


## 认识 Here Document

### 基础

HereDoc 全名叫做 `Here Document`，中文可以称之为 `嵌入文档`。对它的叫法实际上很多，here文档，hereis，here-string 等等都是它。

嵌入文档是 Shell I/O 重定向功能的一种替代。我们已经知道 Shell 的 I/O 重定向是一种文件句柄的传输。例如：

```bash
COMMAND 1>/tmp/1.lst 2>&1
```

将命令的标准输出为一个文件，同时也将错误输出到同一个文件中。

而下例：

```bash
cat /etc/passwd | grep '^admin:'
```

则通过管道将前一命令的输出当做后一命令的标准输入。

#### 基本语法

Here Document 就是标准输入的一种替代品。它使得脚本开发人员可以不必使用临时文件来构建输入信息，而是直接就地生产出一个文件并用作命令的标准输入。一般来说其格式是这样的：

```bash
COMMAND <<IDENT
...
IDENT
```

在这里，`<<` 是引导标记，`IDENT` 是一个限定符，由开发人员自行选定，两个 `IDENT` 限定符之间的内容将被当做是一个文件并用作 COMMAND 的标准输入。例如echo大段文本时，我们可以使用 `cat file` 的语法：

```bash
cat <<EOF
SOME TEXT
HERE
!
EOF
```

此例中，我们使用 `EOF` 短语作为限定符。

> Here Document 是可以*嵌套*的，只要双层分别使用不同的 `IDENT` 限定符且保证正确的嵌套关系即可：
>
> ```bash
> ssh user@host <<EOT
> ls -la --color
> cat <<EOF
> from a remote host
> EOF
> [ -f /tmp/1.tmp ] && rm -f /tmp/1.tmp
> EOT
> ```
>
> 看起来有点怪？其实还好啦。

实际上，限定符可以取得非常长，只要是字母开头且只包含字母和数字（通常，下划线和短横线也是有效的，不过根据 bash 的版本不同、宿主实现的不同，可能会有一定的出入）即可。

`abs` 中有一个例子，节选如下：

```bash
wall <<zzz23EndOfMessagezzz23
fdjsldj
fdsjlfdsjfdls
zzz23EndOfMessagezzz23
```

这是正确有效的，不过这个其实更怪一些。



#### Here String

在 bash, ksh 和 zsh 中，还可以使用 Here String：

```bash
$ tr a-z A-Z <<<"Yes it is a string"
YES IT IS A STRING
```

此时也可以使用变量：

```bash
$ tr a-z A-Z <<<"$var"
```





#### 不常见的用法

##### 同时重定向标准输出

有没有可能将HEREDOC存储为一个文件？显然是可以：

```bash
cat << EOF > /tmp/yourfilehere
These contents will be written to the file.
        This line is indented.
EOF
```

你可以注意到这种写法不同于经常性的写法：

```bash
cat >/tmp/1<<EOF
s
EOF
```

但两者都是对的。

###### root

但当需要 root 权限时，'>' 并不能很好地工作，此时需要 `sudo tee` 上场：

```bash
cat <<EOF | sudo tee /opt/1.log
s
EOF
```

###### 子shell

标准输出的重定向，还可以通过子 shell 的方式来构造：

```bash
(echo '# BEGIN OF FILE | FROM'
 cat <<- _EOF_
        LogFile /var/log/clamd.log
        LogTime yes
        DatabaseDirectory /var/lib/clamav
        LocalSocket /tmp/clamd.socket
        TCPAddr 127.0.0.1
        SelfCheck 1020
        ScanPDF yes
        _EOF_
 echo '# END OF FILE'
) > /etc/clamd.conf
```

这个例子只是一个示意，因为实际上该例子用不着那么麻烦，单个 `cat HEREDOC` 足够达到目的了，也不需要开子 shell 那么重。



##### `cat <<EOF` 的少见的变形

```bash
let() {
    res=$(cat)
}

let <<'EOF'
...
EOF
```

元芳，你怎么看？

还可以写作这样：

```bash
let() {
    eval "$1"'=$(cat)'
}

let res<<'EOF'
...
EOF
```

当然，其实它和单行指令是等效的：

```bash
{ res=$(cat); } <<'EOF'
...
EOF
```

`{}` 是语句块，而不是子shell，因而更省力。根据具体情况来使用它，有时候你希望子 shell 的变量无污染的效果，或者别的期待，那你就使用 `()`。





##### 在参数展开语法中使用 HEREDOC

```bash
variable=$(cat <<SETVAR
This variable
runs over multiple lines.
SETVAR
)

echo "$variable"
```

示例展示了在 `$()` 语法中可以随意地嵌入 HEREDOC。

如果你只是需要为变量用 HEREDOC 赋值，`read var` 通常是更好的主意：

```bash
read i <<!
Hi
!
echo $i  # Hi
```



##### 对函数使用 HEREDOC

```bash
GetPersonalData () {
  read firstname
  read lastname
  read address
  read city 
  read state 
  read zipcode
} # This certainly appears to be an interactive function, but . . .


# Supply input to the above function.
GetPersonalData <<RECORD001
Bozo
Bozeman
2726 Nondescript Dr.
Bozeman
MT
21226
RECORD001


echo
echo "$firstname $lastname"
echo "$address"
echo "$city, $state $zipcode"
echo
```

可以看到，只要函数能够接收标准输入，那就可以将 HEREDOC 套用上去。



##### 匿名的 HEREDOC

```echo
#!/bin/bash
# filename: aa.sh

: <<TESTVARIABLES
${UX?}, ${HOSTNAME?} | ${USER?} | ${MAIL?}  # Print error message if one of the variables not set.
TESTVARIABLES

exit $?
```

这个示例中，如果变量没有被设置，则会产生一条错误消息，而该 HEREDOC 的用处实际上是用来展开要确认的变量，HEREDOC产生的结果作为 `:` 的标准输入，实际上被忽略了，最后只有 HEREDOC 展开的状态码被返回，用以确认是不是有某个变量尚未被设置：

```bash
$ ./aa; echo $?
./aa: line 3: UX: parameter null or not set
1
```

由于 UX 变量缺失，因此调用的结果是一行错误输出，以及调用的退出码为 1，也就是 false 的意思。

> `:` 是 `true` 命令的同义词。就好像 `.` 是 `source` 命令的同义词一样。

###### 进一步

除了用来一次性检测一大批变量有否被赋值的效果之外，匿名的 HEREDOC 也常常被用作大段的注释。

```bash
cat >/dev/null<<COMMENT
...
COMMENT
: <<COMMENT
...
COMMENT
```

这些写法都可以，看你的个人喜好。Bash 程序员的一般风格是能省键盘就省键盘。但有时候他们也喜欢能炫就炫：

```bash
:<<-!
  ____                 _    ____                 _
 / ___| ___   ___   __| |  / ___| ___   ___   __| |
| |  _ / _ \ / _ \ / _` | | |  _ / _ \ / _ \ / _` |
| |_| | (_) | (_) | (_| | | |_| | (_) | (_) | (_| |
 \____|\___/ \___/ \__,_|  \____|\___/ \___/ \__,_|

 ____  _             _
/ ___|| |_ _   _  __| |_   _
\___ \| __| | | |/ _` | | | |
 ___) | |_| |_| | (_| | |_| |
|____/ \__|\__,_|\__,_|\__, |
                       |___/
!
```









##### while read

当我们需要读一个csv文件时，我们会用到 while read 结构。

将 csv 文件改为 HEREDOC：

```bash
while read pass port user ip files directs; do
    sshpass -p$pass scp -o 'StrictHostKeyChecking no' -P $port $files $user@$ip:$directs
done <<____HERE
    PASS    PORT    USER    IP    FILES    DIRECTS
      .      .       .       .      .         .
      .      .       .       .      .         .
      .      .       .       .      .         .
    PASS    PORT    USER    IP    FILES    DIRECTS
____HERE
```

由于不同格式的 CSV 的处理并非本文的主题，因此这里不再展开讨论具体情况了。



##### 补充：循环的重定向

对于 `while … done` 来说，标准输入的重定向应该写在 `done` 之后。同样的，`for … do … done` 也是如此，`until … done` 也是如此。

while

```bash
while [ "$name" != Smith ]  # Why is variable $name in quotes?
do
  read name                 # Reads from $Filename, rather than stdin.
  echo $name
  let "count += 1"
done <"$Filename"           # Redirects stdin to file $Filename. 

```

until

```bash
until [ "$name" = Smith ]     # Change  !=  to =.
do
  read name                   # Reads from $Filename, rather than stdin.
  echo $name
done <"$Filename"             # Redirects stdin to file $Filename. 
```

for

```bash
for name in `seq $line_count`  # Recall that "seq" prints sequence of numbers.
# while [ "$name" != Smith ]   --   more complicated than a "while" loop   --
do
  read name                    # Reads from $Filename, rather than stdin.
  echo $name
  if [ "$name" = Smith ]       # Need all this extra baggage here.
  then
    break
  fi  
done <"$Filename"              # Redirects stdin to file $Filename. 
```









#### 新的缩进和对齐语法

##### 删除 TAB 缩进字符

`<<-IDENT` 是新的语法，市面上的 Bash 均已支持这种写法。它的特殊之处就在于 HEREDOC 正文内容中的所有前缀 TAB 字符都会被删除。

这种语法往往被用在脚本的 if 分支，case 分支或者其他的代码有缩进的场所，这样 HEREDOC 的结束标记不必非要在新的一行的开始之处不可。一方面视觉效果上 HEREDOC 跟随了所在代码块的缩进层次，可读性被提升，另一方面对于许多懒惰的编辑器来说，不会发生面对 HEREDOC 时语法分析出错、代码折叠的区块判断不正确的情况。

```bash
function a () {
    if ((DEBUG)); then
        cat <<-EOF
        French
        American
          - Uses UTF-8
        Helvetica
          - Uses RTL
          
        EOF
    fi
}
```

如上的脚本段落中，结束标记EOF可以不必处于行首第一个字母，只要EOF以及其上的HEREDOC正文都以TAB字符进行缩进就可以了。

注意如果TAB字符缩进在这里没有被严格遵守的话，Bash解释器可能会报出错误。

像在正文中的 `- Uses UTF-8` 除开行首的 TAB字符缩进之外，还包含两个空格字符，这不会受到 `<<-` 的影响而被删除。

##### 禁止变量展开

一般情况下，HEREDOC 中的 `${VAR}`，`$(pwd)`，`$((1+1))` 等语句会被展开，当你想要编写 ssh 指令时，可能你希望的是不要展开 `$` 标记。

这可以用 `<<"EOF"` 来实现。

只需要在 `IDENT` 标记上加上引号包围就可以达到效果，结束标记则无需引号。

```bash
cat <<"EOF"
Command is:
  $ lookup fantasy
EOF
# 如果不想展开，则你需要对 $ 字符进行转义
cat <<EOF
  \$ lookup fantasy
EOF
```

这个例子中，请注意单个的 `$` 字符其实是不会展开也不会报错的，所以我们只是为了编写一个示例而已。

引号包围呢，单引号、双引号都可以，都会同样地生效。

甚至，你可以使用转义语法，也就是说：

```bash
cat <<\EOF
Command is:
  $ lookup fantasy
EOF
```

也能禁止参数展开。



##### 同时应用上两者

上面两个新的语法特性，是可以被同时组合和运用的：

```bash
    cat <<-"EOF"
		Command is:
  		  $ lookup fantasy
    EOF
```

虽然你可能根本不需要遇到这样的情形。







### 参考

- [**Advanced Bash-Scripting Guide** - Chapter 19. Here Documents](http://tldp.org/LDP/abs/html/here-docs.html)
- [维基：Here文档](<https://zh.wikipedia.org/wiki/Here%E6%96%87%E6%A1%A3>)
- 



























