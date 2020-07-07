---
layout: single
title: "BASH TRICKS: String"
date: 2018-11-06 09:00:00 +0800
Author: hedzr
tags: [shell, bash, devops]
categories: devops shell
comments: true
toc: true
header:
  overlay_image: /assets/images/backslashes.png
  overlay_filter: rgba(0, 170, 255, 0.5)
#excerpt: "BASH 小技巧一小组 [...]"
#header:
#  overlay_image: /assets/images/unsplash-image-1.jpg
#  overlay_filter: rgba(0, 0, 0, 0.15)
#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---





Bash 字符串操作极其强大，尽管还无法和高级语言的能力相比肩，但在bash中你已经几乎可以完全操纵任何文本、任何字符串了。

<!--MORE--> 

字符串操作和变量有密切关联性，所以先介绍变量及其表达式的使用惯例：

| `${var}`          | 变量var的值, 与$var相同                                      |
| ----------------- | ------------------------------------------------------------ |
| `${var-DEFAULT}`  | 如果var没有被声明, 那么就以$DEFAULT作为其值；*否则其值为 $var* |
| `${var:-DEFAULT}` | 如果var没有被声明, 或者其值为空, 那么就以$DEFAULT作为其值；*否则其值为 $var* |
| `${var=DEFAULT}`  | 如果var没有被声明, 那么就以$DEFAULT作为其值；*否则其值为 $var* |
| `${var:=DEFAULT}` | 如果var没有被声明, 或者其值为空, 那么就以$DEFAULT作为其值；*否则其值为 $var* |
| `${var+OTHER}`    | 如果var声明了, 那么其值就是$OTHER；*否则就为null字符串*      |
| `${var:+OTHER}`   | 如果var被设置了, 那么其值就是$OTHER；*否则就为null字符串*    |
| `${var?ERR_MSG}`  | 如果var没被声明, 那么就打印$ERR_MSG；*否则其值为 $var*       |
| `${var:?ERR_MSG}` | 如果var没被设置, 那么就打印$ERR_MSG；*否则其值为 $var*       |
| `${!varprefix*}`  | 匹配之前所有以varprefix开头进行声明的变量                    |
| `${!varprefix@}`  | 匹配之前所有以varprefix开头进行声明的变量                    |

 

### 一系列基本操作

| `${#string}`                       | $string 的长度                                               |
| ---------------------------------- | ------------------------------------------------------------ |
| `${string:position}`               | 在$string中, 从位置$position开始提取子串                     |
| `${string:position:length}`        | 在$string中, 从位置$position开始提取长度为$length的子串。如果 position 带有负号（形如`${string:(-3):2}`），则抽取方向为反向。 |
| `${string#substring}`              | 从变量$string的开头, 删除最短匹配$substring的子串            |
| `${string##substring}`             | 从变量$string的开头, 删除最长匹配$substring的子串            |
| `${string%substring}`              | 从变量$string的结尾, 删除最短匹配$substring的子串            |
| `${string%%substring}`             | 从变量$string的结尾, 删除最长匹配$substring的子串            |
| `${string/substring/replacement}`  | 使用$replacement, 来代替第一个匹配的$substring               |
| `${string//substring/replacement}` | 使用$replacement, 代替所有匹配的$substring                   |
| `${string/#substring/replacement}` | 如果$string的前缀匹配$substring, 那么就用$replacement来代替匹配到的$substring |
| `${string/%substring/replacement}` | 如果$string的*后缀*匹配$substring, 那么就用$replacement来代替匹配到的$substring |

备注：上表中所有的substring均为正则表达式。

下面有扼要示例：

```bash
# 长度
str="fhakjfhaj"
echo ${#str}
expr length $str
expr "$str" : ".*"

# 查找子串的位置
expr index $str "a"

# 抽出子串
expr substr $str 1 3   # extract 3 characters
echo ${str:1:3}        # extract 3 characters
echo ${str:2}
echo ${str:(-6):2}     # 从第6个字符起，倒数抽取2个字符
echo ${str:(-4):3}     # 从第4个字符起，倒数抽取3个字符

# 比较
[[ "a.txt" == a* ]]        # 逻辑真 (pattern matching)
[[ "a.txt" =~ .*\.txt ]]   # 逻辑真 (regex matching)
[[ "abc" == "abc" ]]       # 逻辑真 (string comparison) 
[[ "11" < "2" ]]           # 逻辑真 (string comparison), 按ascii值比较
[[ "a.txt" == *darwin* ]]
```

 

### 正则式替换

```bash
echo ${DATE/2018/18}    # 替换首次匹配的
echo ${DATE//2018/18}   # 替换所有的 “2018” 为 “18”
echo ${DATE//\//.}      # 替换所有的日期斜线('/') 为 '.': Aug/9/2018 -> Aug.9.2018

MYVAR="ho02123ware38384you443d34o3434ingtod38384day"
MYVAR=${MYVAR//[a-zA-Z]/X} 
echo ${MYVAR//[0-9]/N}

MYVAR=ho02123ware38384you443d34o3434ingtod38384day
MYVAR=${MYVAR//[[:alpha:]]/X} 
echo ${MYVAR//[[:digit:]]/N}

echo ${MYVAR//\d+/N}
```

 

### 删除前缀/后缀

```bash
foo=${string#"$prefix"}    # prefix是一个正则表达式，所以：echo ${string#a*c} 删除 “a*c” 模式的前缀
foo=${foo%"$suffix"}       # suffix是一个正则表达式
echo "$foo"

foo=${string##"$prefix"}   # 和${string#"$prefix"} 的区别在于，这里会尝试最长匹配（贪婪式）
foo=${foo%%"$suffix"}      # 和${string%"$suffix"} 的区别在于，这里会尝试最长匹配（贪婪式）
```

或者：

```sh
echo $string | sed -e s/^$prefix// -e s/$suffix$//
```

 

### 字符串的数组化操作

对于带有空白的字符串，可以很容易地切分为多个单词的字符串数据，然后针对每个单词进行操作。这种操作类似于sed/cut/awk，然而省去了调用磁盘命令的开销。

```bash
string="split string to array in bash"
for word in $string; do echo $word; done

# 或者
SAVEDIFS=IFS; IFS=-;
string="split-string-to-array-in-bash"
for word in $string; do echo $word; done
IFS=SAVEDIFS
```

也可以借助read命令来切开字符串，处理csv文件，等等。

同样地，sed/awk/cut都能达到相同的目的，某些方面比较纯粹的 bash 字符串功能来的更强，特别是当你需要较强的可编程能力时。

 

 

## 🔚