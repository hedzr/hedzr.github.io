---
layout: single
title: "BASH TRICKS: 变量及其生存周期"
date: 2018-10-03 21:00:00 +0800
Author: hedzr
tags: [shell, bash, devops]
categories: devops shell
comments: true
toc: true
header:
  overlay_image: /assets/images/bash-shell.png
  overlay_filter: rgba(255, 255, 255, 0.5)
#excerpt: "This post should [...]"
#header:
#  overlay_image: /assets/images/unsplash-image-1.jpg
#  overlay_filter: rgba(0, 0, 0, 0.15)
#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---



Bash 中的变量，在同一个文件中是无所谓作用域的，一个变量的值是依据实际执行进程顺次被覆盖。这里的例外就是 `local` 方式定义的变量有所不同。

此外，多个文件的子Shell方式、source in方式都有很多复杂性。

<!--more-->



本想讲述的清楚一点，然而发觉不够耐心，只好简单顺序地描述一下了

### BASH 变量及其作用域

可以在bash脚本中定义变量。也可以在命令行交互过程中使用变量。在这些情况下，变量的定义方式都是相同的：

```
A=1
echo $A
```

变量在定义之后一直有效，除非你取消它：

```
A=
unset A
```

A= 可以为变量赋以空值。而 unset A 会完全取消该变量的存在性。

如果有必要，你可以使用 export 关键字来导出变量到环境变量中。

> 对于每一个shell实例来说，环境变量池是该shell实例的一个附着的空间，你可以丢入一堆变量。在一个shell中你可以执行多个shell脚本文件，对其中的每个脚本文件的执行实例来说，都有一个环境变量池的副本从当前shell实例复制而来，所以你在一个脚本文件中 export 某个变量A，那么A就被放入了该脚本文件实例的附着的环境变量池副本中。这个道理也适用于子shell的情况，因为调用执行一个脚本文件时就相当于fork了一个新的子shell实例，该新实例分享了当前shell实例的变量池的副本，因此在子shell中对变量的修改不会传递到父shell中。
>
> 那么，使用export有什么用处呢？我们知道，在当前shell环境下，执行一个脚本文件后，其中的变量会无效；source一个脚本的话，变量会继续可用。不过接着进行下一步，假设我们source了一个脚本文件使得变量A可用，然后进一步执行第二个脚本文件，这时在第二个脚本文件中A会是无效的，原因就在于第一步的变量A只是在当前shell环境中可用，但并不在当前的环境变量中，因此执行新脚本时A不会随着环境变量池一同被副本给新脚本。请注意，这时候就是export有用的时候了。
>
> ```
> #!/bin/bash
> A=1
> source A3.sh    # A3.sh 有 A=3 语句
> echo $A         # 会显示 3
> ./echoA.sh      # 会显示空白
> source A3e.sh   # A3e.sh 有 export A=3 语句
> ./echoA.sh      # 会显示 3
> ```
>
>  

按照以上的说法，变量在定义之后除非被取消，又或者超出脚本的执行范围，否则的话它将一直有效。而如果将变量 export 到环境变量中的话，则在整个shell实例的生存周期里，无论经历多少次脚本文件调用该变量都会有效。

要取消一个环境变量，你应该使用 unset 关键字。

即使你将变量export到了环境变量池中，你仍然可以修改该变量：

```
export A=1
echo $A    #1
A=2
echo $A   #2
```

 

#### 局部变量

 

前面讲述的是常规情况下bash变量的使用方法。

在bash语法中，语句块和函数具有一个封闭的子空间，该空间像子shell，不过并不会fork出新的shell实例。

在语句块和函数中，你可以定义局部变量，其唯一的不同点就在于每当执行过程超出该代码块空间之外时局部变量就会被释放。

```
function abc(){
  local A=1
  echo $A
}

A=9
abc       # 1
echo A$   # 9
```

 

以后有精力了系统地结集一下吧，现在就流水地罗列要点。

 

 

## 🔚