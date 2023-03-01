---
title: "Bash Function: safety()"
excerpt: "I create safety() to avoid $USER leaking."
last_modified_at: 2023-02-22
toc: true
sidebar:
  nav: sidebar-meta
header:
  image: /assets/images/foo-bar-identity.jpg
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20230301144642758.png
---



## 功能

`safety()` 的功能首先是将 Username 从输出中剔除，这通常是通过将 `$HOME` 替换为 `~` 来达到效果的。

进一步地，由于我喜爱 named folder（有时候我会将其称作 `zsh tilde folder, hashed folder` 等等），所以我也设法从 zsh 环境中抽取出一个映射表，并据此完成相应的替换。

所以在我的电脑上，`/Volumes/VolWork/ops.work/bash.sh-dev` 在调试输出文字时总是被显示为 `~vol/ops.work/bash.sh-dev`，当然，基本功能也不会出错：`/Users/hz/Music` 会显示为 `~/Music`。

进一步地，那就也参考一个列表文件 `$HOME/.safety.list` 中的条目做类似的替换。这个文件的内容可以像这样：

```bash
/Volumes/VolWork  ~vol
```

`safety()` 也会尝试从这个文件中提取替换表来完成字符串替代。

safety 函数被定义在 [bash.sh](https://github.com/hedzr/bash.sh) 中，所以可以直接从命令行测试它：

```bash
$ ./bash.sh safety $HOME/Music $HOME/Videos
~/Music ~/Videos
```

在你的脚本中使用它遵循 Shell 函数调用语法：

```bash
echo "$(safety $HOME/Music)"
```

此外也有一个衍生函数 `safetypipe()`:

```bash
echo $HOME/Music | safetypipe
```

使用效果如下

![image-20230301144642758](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20230301144642758.png)

## 实现

所以上面这一切是如何实现的呢。

![image-20230301111131990](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20230301111131990.png)

源代码如下：

```bash
safety() {
	local input="${@//$HOME/~}" from to list
	# dbg "Got input: $input" 1>&2
	for list in $HOME/.safety.list; do
		if [ -f $list ]; then
			while read from to; do
				input="$(printf "$input" | sed -E "s,$from,$to,g")"
			done <$list
		fi
	done
	if is_zsh_strict; then
		# if running under zsh mode
		if command -v hash >/dev/null; then
			hash -d | while IFS=$'=' read to from; do
				from="$(echo $from | tr -d "\042")"
				input="$(printf "$input" | sed -E "s,$from,~$to,g")"
			done
		fi
	elif command -v zsh >/dev/null; then
		# in bash/sh mode
		[ -f /tmp/hash.list ] || zsh -c "hash -d|sed 's/=/:/'|tr -d \"'\"|IFS=\$':' sort -k2 -r" >/tmp/hash.list
		while IFS=$':' read to from; do
			from="$(eval printf '%s' $from)"
			to="$(eval printf '%s' $to)"
			input="$(printf "$input" | sed -E 's,'"$from"',~'"$to"',g')"
		done </tmp/hash.list
	fi
	printf "$input"
}

safetypipe() { while read line; do printf "$(safety $line)"; done; }
```

`is_zsh_strict` 采用严格限定条件来测试是否在真正的 zsh 运行环境中，否则 Line 19-26 会接管到控制，尝试从 zsh 运行环境中提取 named folder 的列表并存入 /tmp/hash.list 中，然后再提取其中的内容完成相应的替换。

由于 safety 函数检测这些磁盘文件的内容，因此它的效率偏低，只不过在使用 Shell Script 的场合这点损失可以忽略不计。如果你不需要 zsh named folder 的转换，实际上 safety 只不过一个表达式足矣：

```bash
STRING="$HOME/Music"
echo "$(STRING//$HOME/~)"
```

不过，抽出并创建一个函数，本就是为了满足实际需要，所以 safety 现在会是这个样子。





:end:

