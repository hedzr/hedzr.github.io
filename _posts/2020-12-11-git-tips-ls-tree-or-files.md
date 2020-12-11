---
layout: single
title: 'Git Tips - ls-tree 和 ls-files'
date: 2020-12-11 19:23:00 +0800
last_modified_at: 2020-12-11 21:39:00 +0800
Author: hedzr
tags: [git, ls-tree, ls-files]
categories: devops git
comments: true
toc: true
header:
  overlay_image: /assets/images/git-banner.jpeg
  overlay_filter: rgba(32, 32, 0, 0.3)
excerpt: >-
  Git 命令之 ls-tree 以及 ls-files，...
---



> 按：主要是 manpage 简单翻译，但包含我常会用得到的两条命令行。



## PREFACE

以前我总是用 gitk 的，它会显示已跟踪文件的树结构。后来，gitk不能用了，sourcetree 等工具却也不提供这个树，渐渐地也就不管了，因为绝大部分情况下 .gitignore 都是做到位的，所以哪些跟踪了，哪些应该被忽略，基本上也有定数。

但是有一天发觉不能这么懒，就寻找了相应的解决办法。答案就是 ls-tree 和 ls-files。



## DOCUMENTS

### ls-tree

[ls-tree](https://git-scm.com/docs/git-ls-tree) 能列出给定树对象的内容。这个对象指的是 git 所管理的 object。注意你需要 git v2.9.5 以后版本。

```bash
git ls-tree [-d] [-r] [-t] [-l] [-z]
            [--name-only] [--name-status] [--full-name] [--full-tree]
            [--abbrev[=<n>]]
            <tree-ish> [<path>...]
```



#### DESCRIPTION

列出给定树对象的内容，例如“/ bin / ls -a”在当前工作目录中所做的内容。注意：

- 该行为与“/ bin / ls”的行为稍有不同，因为它`<path>`仅表示要匹配的模式列表，例如，指定目录名称（不含`-r`）将具有不同的行为，并且参数的顺序无关紧要。

- 该行为与“/ bin / ls”的行为相似，`<path>`因为相对于当前工作目录而言。例如，当你在一个`sub`具有目录的目录中时`dir`，你可以运行`git ls-tree -r HEAD dir`以列出树的内容（即`sub/dir`在`HEAD`）。你不想给一棵树，是不是在根级别（例如，`git ls-tree -r HEAD:sub dir`在这种情况下），因为这将导致要求`sub/sub/dir`的`HEAD`承诺。但是，通过传递--full-tree 选项可以忽略当前工作目录。

#### OPTIONS

       <tree-ish>
           Id of a tree-ish.
    
       -d
           Show only the named tree entry itself, not its children.
           仅显示已命名的树条目本身，而不是其子节点。
    
       -r
           Recurse into sub-trees.
           递归到子树中。
    
       -t
           Show tree entries even when going to recurse them. Has no effect if -r was not passed.
           -d implies -t.
           在进行递归时也显示树条目。如果`-r`未通过，则无效。`-d`意味着`-t`。
    
       -l, --long
           Show object size of blob (file) entries.
           显示 blob（文件）条目的对象大小。
    
       -z
           \0 line termination on output and do not quote filenames. See OUTPUT FORMAT below for
           more information.
           \0 行输出终止，不要引用文件名。有关更多信息，请参阅下面的 OUTPUT FORMAT。
    
       --name-only, --name-status
           List only filenames (instead of the "long" output), one per line.
           仅列出文件名（而不是“长”输出），每行一个。
    
       --abbrev[=<n>]
           Instead of showing the full 40-byte hexadecimal object lines, show only a partial
           prefix. Non default number of digits can be specified with --abbrev=<n>.
           不显示完整的40字节十六进制对象行，只显示部分前缀。非默认位数可以用--abbrev = <n> 来指定。
    
       --full-name
           Instead of showing the path names relative to the current working directory, show the
           full path names.
           显示相对于当前工作目录的路径名称，而不是显示完整的路径名称。
    
       --full-tree
           Do not limit the listing to the current working directory. Implies --full-name.
           不要将列表限制到当前工作目录。隐含着 --full-name。
    
       [<path>...]
           When paths are given, show them (note that this isn't really raw pathnames, but rather a
           list of patterns to match). Otherwise implicitly uses the root level of the tree as the
           sole path argument.
           当给出路径时，显示它们（请注意，这不是真正的原始路径名，而是一组匹配的模式列表）。否则，隐式使用树的根级作为唯一的路径参数。


上面都是废话，仅供查阅。

实际上还要以实例来说话：

#### 列出已经跟踪的文件

```bash
git ls-tree --full-tree -r --name-only HEAD
```

为了确认是不是把不应该的内容包含在了提交中，用这条命令列出来再 grep 就能检测了。不过这样做并不能改变已经提交和已经跟踪的事实，所以如果已经推送到了远程的话就没意义了。

即使没有推送到远程，在本地做某个或者某一组提交的废弃或者是修订，仍然是麻烦、混淆、不被推荐的选择。

所以提交之前仔细检查，每一提交慎重对待。

提交前的检测，ls-files 是更好的选择。



### ls-files

[ls-files](https://git-scm.com/docs/git-ls-files) 显示有关索引和工作树中文件的信息。但你需要 git v2.1.4 以后版本。

它和 ls-tree 的区别在于处理的对象不同，tree 处理 git objects（已纳入版本跟踪的对象），files 处理工作树（Working tree），所以诸如未跟踪文件，stash 内容，已经缓存到暂存区但尚未提交的文件，统统都能够列举。

```bash
git ls-files [-z] [-t] [-v] [-f]
             (--[cached|deleted|others|ignored|stage|unmerged|killed|modified])*
             (-[c|d|o|i|s|u|k|m])*
             [--eol]
             [-x <pattern>|--exclude=<pattern>]
             [-X <file>|--exclude-from=<file>]
             [--exclude-per-directory=<file>]
             [--exclude-standard]
             [--error-unmatch] [--with-tree=<tree-ish>]
             [--full-name] [--recurse-submodules]
             [--abbrev] [--] [<file>...]
```


#### DESCRIPTION
This merges the file listing in the directory cache index with the actual working directory list, and shows different combinations of the two.

这将目录缓存索引中的文件列表与实际工作目录列表合并，并显示两者的不同组合。

One or more of the options below may be used to determine the files shown:

下面的一个或多个选项可用于确定显示的文件：

#### OPTIONS

       -c, --cached
           Show cached files in the output (default)
           在输出中显示缓存的文件（默认）
    
       -d, --deleted
           Show deleted files in the output
           在输出中显示已删除的文件
    
       -m, --modified
           Show modified files in the output
           在输出中显示已修改的文件
    
       -o, --others
           Show other (i.e. untracked) files in the output
           在输出中显示其他（即未跟踪的）文件
    
       -i, --ignored
           Show only ignored files in the output. When showing files in the index, print only those
           matched by an exclude pattern. When showing "other" files, show only those matched by an
           exclude pattern. Standard ignore rules are not automatically activated, therefore at
           least one of the --exclude* options is required.
           在输出中只显示被忽略的文件。在索引中显示文件时，只打印排除模式匹配的文件。显示“其他”文件时，只显示通过排除模式匹配的文件。
    
       -s, --stage
           Show staged contents' mode bits, object name and stage number in the output.
           在输出中显示暂存内容的模式位，对象名称和阶段编号。
    
       --directory
           If a whole directory is classified as "other", show just its name (with a trailing
           slash) and not its whole contents.
           如果整个目录被分类为“其他”，则只显示其名称（带有斜线）而不是其全部内容。
    
       --no-empty-directory
           Do not list empty directories. Has no effect without --directory.
           不要列出空目录。没有 --directory 则无效。
    
       -u, --unmerged
           Show unmerged files in the output (forces --stage)
           在输出中显示未合并的文件（forces --stage）
    
       -k, --killed
           Show files on the filesystem that need to be removed due to file/directory conflicts for
           checkout-index to succeed.
           在文件系统上显示由于文件/目录冲突而需要删除的文件以使checkout-index成功。
    
           -z
               \0 line termination on output and do not quote filenames. See OUTPUT below for more
               information.
               \0 行输出终止，不要引用文件名。有关更多信息，请参阅下面的 OUTPUT 部分。
    
           -x <pattern>, --exclude=<pattern>
               Skip untracked files matching pattern. Note that pattern is a shell wildcard pattern.
               See EXCLUDE PATTERNS below for more information.
               跳过未匹配的文件匹配模式。请注意，模式是一个外壳通配符模式。有关更多信息，请参阅下面的 EXCLUDE PATTERNS 部分。
    
           -X <file>, --exclude-from=<file>
               Read exclude patterns from <file>; 1 per line.
               从<file>读取排除模式; 每行1个。
    
           --exclude-per-directory=<file>
               Read additional exclude patterns that apply only to the directory and its subdirectories
               in <file>.
               读取仅适用于<file>中的目录及其子目录的其他排除模式。
    
           --exclude-standard
               Add the standard Git exclusions: .git/info/exclude, .gitignore in each directory, and
               the user's global exclusion file.
               在每个目录中添加标准Git排除项：.git/info/exclude，.gitignore和用户的全局排除文件。
    
           --error-unmatch
               If any <file> does not appear in the index, treat this as an error (return 1).
               如果任何<file>没有出现在索引中，则将其视为错误（返回1）。
    
           --with-tree=<tree-ish>
               When using --error-unmatch to expand the user supplied <file> (i.e. path pattern)
               arguments to paths, pretend that paths which were removed in the index since the named
               <tree-ish> are still present. Using this option with -s or -u options does not make any
               sense.
               当使用--error-unmatch将用户提供的<file>（即路径模式）参数展开为路径时，假定自从指定的<tree-ish>后索引中删除的路径仍存在。使用此选项-s或-u选项没有任何意义。
    
           -t
               This feature is semi-deprecated. For scripting purpose, git-status(1) --porcelain and
               git-diff-files(1) --name-status are almost always superior alternatives, and users
               should look at git-status(1) --short or git-diff(1) --name-status for more user-friendly
               alternatives.
               此功能已半弃用。对于编写脚本的目的，git-status [1] --porcelain和git-diff-files [1] --name-status几乎总是优越的选择，用户应该查看git-status [1] --short或git-diff [1] --name-status以获得更多用户友好的选择。
    
               This option identifies the file status with the following tags (followed by a space) at
               the start of each line:
               此选项在每行开始时用以下标记（后跟一个空格）标识文件状态：
    
               H
                   cached 缓存
    
               S
                   skip-worktree
    
               M
                   unmerged
    
               R
                   removed/deleted
    
               C
                   modified/changed
    
               K
                   to be killed
    
               ?
                   other
    
           -v
               Similar to -t, but use lowercase letters for files that are marked as assume unchanged
               (see git-update-index(1)).
               与-t标记为assume unchanged（请参阅git-update-index [1]）的文件类似，但使用小写字母。
    
           -f
               Similar to -t, but use lowercase letters for files that are marked as fsmonitor valid
               (see git-update-index(1)).
    
           --full-name
               When run from a subdirectory, the command usually outputs paths relative to the current
               directory. This option forces paths to be output relative to the project top directory.
               从子目录运行时，该命令通常会输出相对于当前目录的路径。该选项强制相​​对于项目顶部目录输出路径。
    
           --recurse-submodules
               Recursively calls ls-files on each submodule in the repository. Currently there is only
               support for the --cached mode.
               在存储库中的每个子模块上递归调用 ls-files。目前只支持 --cache 模式。
    
           --abbrev[=<n>]
               Instead of showing the full 40-byte hexadecimal object lines, show only a partial
               prefix. Non default number of digits can be specified with --abbrev=<n>.
               不显示完整的40字节十六进制对象行，只显示部分前缀。非默认位数可以用--abbrev = <n>来指定。
    
           --debug
               After each line that describes a file, add more data about its cache entry. This is
               intended to show as much information as possible for manual inspection; the exact format
               may change at any time.
               在描述文件的每一行之后，添加更多关于其缓存条目的数据。这旨在显示尽可能多的手动检查信息; 确切的格式可能会随时更改。
    
           --eol
               Show <eolinfo> and <eolattr> of files. <eolinfo> is the file content identification used
               by Git when the "text" attribute is "auto" (or not set and core.autocrlf is not false).
               <eolinfo> is either "-text", "none", "lf", "crlf", "mixed" or "".
               显示文件的<eolinfo>和<eolattr>。<eolinfo>是当“text”属性为“auto”（或未设置且core.autocrlf不为false）时由Git使用的文件内容标识。<eolinfo>是“文本”，“无”，“lf”，“crlf”，“混合”或“”。
    
               "" means the file is not a regular file, it is not in the index or not accessible in the
               working tree.
               “”表示该文件不是常规文件，它不在索引中或在工作树中无法访问。
    
               <eolattr> is the attribute that is used when checking out or committing, it is either
               "", "-text", "text", "text=auto", "text eol=lf", "text eol=crlf". Since Git 2.10
               "text=auto eol=lf" and "text=auto eol=crlf" are supported.
               它是“”，“ -  text”，“text”，“text = auto”，“text eol = lf”，“text eol = crlf”时检查或提交时使用的属性。由于支持Git 2.10“text = auto eol = lf”和“text = auto eol = crlf”。
    
               Both the <eolinfo> in the index ("i/<eolinfo>") and in the working tree ("w/<eolinfo>")
               are shown for regular files, followed by the ("attr/<eolattr>").
               索引（“i / <eolinfo>”）和工作树（“w / <eolinfo>”）中的<eolinfo>均显示为常规文件，后面跟着（“attr / <eolattr>”）。
    
           --
               Do not interpret any more arguments as options.
               不要将更多的参数解释为选项。
    
           <file>
               Files to show. If no files are given all files which match the other specified criteria
               are shown.
               要显示的文件。如果没有给出文件，则显示与其他指定标准相匹配的所有文件。
    



同样，下面有相关用例：

#### 列出未跟踪的文件

```bash
git ls-files --others
```

#### 列出未跟踪的文件，但不必显示由 .gitignore 所排除的那些

```bash
git ls-files --others --exclude-standard -z
```

-z 的目的是每一行末尾以 \0 结尾，并且文件名从不以引号包围（默认时根据系统的不同，带有空格或特殊字符的文件名会被自动Quoted）

#### 定期自动备份未跟踪内容

上面使用 -z 不是必须的，但有时候是为了后接管道命令：

```bash
git ls-files --others --exclude-standard -z | xargs -0 tar -rf $MY_BACKUP_DIR/$APPNAME/untracked-files.bz2
```

这个定期操作可以保护那些未跟踪内容。

--exclude-standard 会不显示已经被 .gitignore 所忽略的文件，所以你可能并不想要加上这个标识。





## CONSLUSION

没有







🔚