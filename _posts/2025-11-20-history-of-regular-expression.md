---
layout: single
title: '正则式简史'
date: 2025-11-20 01:00:00 +0800
last_modified_at: 2025-11-20 07:17:00 +0800
Author: hedzr
tags: [regexp,algorithm]
categories: algorithm regexp
comments: true
toc: true
header:
  teaser: /assets/images/unsplash-gallery-image-3.jpg
  overlay_image: /assets/images/unsplash-gallery-image-3-th.jpg
  overlay_filter: rgba(32, 32, 0, 0.3)
excerpt: >-
  如题，用口水话叙述一下正则式的发展简史 ...
---

## 正则式简史

我在一篇旧文章 [*从 Golang 正则式讲起*](https://hedzr.com/golang/regexp/lets-talk-about-golang-regexp/) 中探寻了正则式的一些粗浅知识，主要是为了罗列语法，以便于个人速查。这是因为有时候搜索不是一个很好办的事情，如何搜索和去伪存真是一种技能，这就不展开说了。

要点是，我那篇旧文章在正则式简史方面没有认真考察整个历史渊源，所以将一些关系张冠李戴了，例如 RE2 的承接关系，PCRE 的发展线索等等。

所以早前某个时刻我修正了旧文章，简单地移除了简史部分。

但这当然就遗留了一个扣子在那儿而没有扣上。

今天，就是为了扣上它。



### 历史渊源

正则表达式，是术语 Regular Expression 的译名，它是描述字符串规律的一种表达式格式。历史上它有多种译名，例如规律表达式，规则表达式，正则表示式，常规表达式，等等。新世纪以来，在一些出版物中出现了正规表达式或其它的“创新型”译名，基本上我们认为这是一种哗众取宠的行为，然而时代的变迁导致一些词汇的演变又属正常，所以这些较新的译名的未来如何，仍需留待未来而定。

正则表达式在一般场所中常常被简称为正则式，这是常见的简略称呼，在英文环境中将其缩写为 regexp，regex，re 等等，均相当常见，另外缩略语 RE 也常常被使用。

正则式本身是随着 [形式化语言](https://zh.wikipedia.org/wiki/%E5%BD%A2%E5%BC%8F%E5%8C%96%E8%AF%AD%E8%A8%80) 理论和 [自动控制](https://zh.wikipedia.org/wiki/%E8%87%AA%E5%8A%A8%E6%8E%A7%E5%88%B6) 理论的发展而形成的，在学术界它通常被归属到*形式化语言与自动机*这样的课程（教材）中并成为一个基本章节，它通常是形式文法（Formal  Grammar）的一种有力的描述手段和实现手段。计算机科学中为了学习和理解编译原理这门课程，通常也有一个章节介绍正则式，并伴随着一系列的求解过程（例如 NFA 和 DFA 等）。

编译器领域中 LEX 和 YACC 所领导的“编译器的编译器”路线，其核心思想即是通过一批正则式所定义的产生式规则来描述一种高级语言的文法，然后通过自动机理论指导将该文法“转换”为编译器的词法分析和语法分析的 parser 部分，然后利用该 parser 来编译源代码并获得抽象语法树（AST），进而生成机器代码。

在编译原理中，将源代码中的关键字、字面量、控制逻辑等词法单位分解后以符号标记（token）代替，就得到了一系列符号的流，进一步的语义分析过程就是吃进这些 tokens，然后从初始状态不断因应 token 而切换到下一状态，直至所有 tokens 被吃完后来到终止状态。这个过程就是状态机的运转过程，它和正则式的匹配过程基本上是等价的，区别在于正则式匹配过程中吃进的是字符，例如 Unicode 字符或者 ASCII 字符，而编译器吃进的是源代码经过词法分析后得到的 tokens 流。但注意其中的要点在于，一个 token 实际上是通过一条正则式分析得到的，例如 `[a-zA-Z_][a-zA-Z0-9_]+` 这条正则式将会从源代码中匹配得到 `identifier` 这个标识符 token。

一个典型的正则式如 `ab*` 能够匹配这些的字符串 `a`, `ab`, `abb` 等等，而 `ab+` 能匹配的是 `ab`, `abb` 等等，区别在于后一个正则式要求 `b` 至少出现 1 次到多次。`[a-zA-Z_]` 代表着一个字符应该为字母和下划线，`[a-zA-Z0-9_]+` 代表着一系列字符应该为字母、数字和下划线。两者组合起来的正则式  `[a-zA-Z_][a-zA-Z0-9_]+` 就代表着标识符 token 应该是首字符为字母和下划线，后续字符为字母、数字和下划线。

正则式的由来已久，最早可以追溯到 1940 年，[沃伦·麦卡洛克 / Warren Sturgis McCulloch](https://zh.wikipedia.org/wiki/沃伦·麦卡洛克) 与 [小沃尔特·皮茨 / Walter Harry Pitts Jr.](https://zh.wikipedia.org/wiki/沃尔特·皮茨) 将 [神经系统](https://zh.wikipedia.org/wiki/神经系统) 中的神经元描述成小而简单的自动控制元。这两位神人是计算神经科学家，实际上我其实不懂这门学科，只知道它是一种跨领域的学科，学成者即典型的复合型人才。

学界基本上认同上两位科学家尽管没有显式提出正则式和 NFA 的有关术语，但他们描述的自动控制元在渊源和行为等各方面都满足 NFA 状态推进的画像。

NFA（非确定性有限自动机）和非确定性概念，是由 迈克尔·拉宾（ [Michael O. Rabin](https://en.wikipedia.org/wiki/Michael_O._Rabin)） 和 达纳·斯科特（[Dana Scott](https://en.wikipedia.org/wiki/Dana_Scott)） 于 1959 年提出并完成了相关证明的，这一证明的关键之处在于确认了每一 DFA（确定性有限自动机） 状态都对应于一组 NFA 状态，换言之，任何一个 NFA 都可以等价转换为一个 DFA。两人因此获得了 1976 年图灵奖。

有限自动机是一种非常关键的概念。它的含义是一个自动机代表着一组状态的变化模式，有限是指总的步数是有限的，即自动机从开始状态起，受到事件的触发而迁移到下一状态，直至最终迁移的结束状态为止，这个过程中的迁移的总步数是有限的。换句话说，一个有限自动机在接收事件后总能在有限的步数内抵达其结束状态。而这一关键的“有限”实际上约束了整个迁移过程是“可计算的”，这在空间上和时间上保证了有限的资源能够使该自动机运转完毕。

非确定性是指给定起始状态，和给定事件的前提下，下一状态是否确定。对于 NFA 来说，同一事件可能导致多选的下一状态，但 DFA 则只有唯一可选的下一状态。如前所述，经过结构性变换之后，NFA 能够无损地转换为 DFA。

> NFAs were introduced in 1959 by [Michael O. Rabin](https://en.wikipedia.org/wiki/Michael_O._Rabin) and [Dana Scott](https://en.wikipedia.org/wiki/Dana_Scott), who also showed their equivalence to DFAs. NFAs are used in the implementation of [regular expressions](https://en.wikipedia.org/wiki/Regular_expression): [Thompson's construction](https://en.wikipedia.org/wiki/Thompson's_construction) is an algorithm for compiling a regular expression to an NFA that can efficiently perform pattern matching on strings. Conversely, [Kleene's algorithm](https://en.wikipedia.org/wiki/Kleene's_algorithm) can be used to convert an NFA into a regular expression (whose size is generally exponential in the input automaton).

在 1950 年代，数学家 [Stephen Cole Kleene](https://en.wikipedia.org/wiki/Stephen_Cole_Kleene) 首次描述了正则式概念并定义了该术语，由于他的贡献，闭包（即 `b*` 这样的子表达式）这一子表达式实际上被称作 Kleene 闭包。

> 一般认为，R. McNaughton 和 H. Yamada 和 Ken Thompson 分别共同提出了将正则表达式转换为 NFA 的构造方法，所以 Thompson 算法在外文学界常被称为 **McNaughton–Yamada–Thompson algorithm**，但这也并非唯一称谓，**Thompson's construction algorithm** 也经常被使用。在中文场所为了简便，大多数刊物都使用 **Thompson 算法** 这一术语。

该理论经过一段时间的发酵之后，在 1968 年前后，[Ken Thompson](https://en.wikipedia.org/wiki/Ken_Thompson) 在实现 QED 编辑器的 IBM 7094 版本时引入了这一符号系统。随后 regexp 被实现到编辑器 ed 中，进一步地被实现到 grep 中，从此时起，Unix 中开始大量使用正则式相关实现，并在晚些时候（二十年后的 1986 年）成为了 POSIX 规范的一部分。实际上，Thompson 对此进行了深入研究，并在 1968 年发表了 [Regular Expression Search Algorithm](http://www.fing.edu.uy/inco/cursos/intropln/material/p419-thompson.pdf) 论文。在正则式引擎的实现步骤中，从 Pattern 构造 NFA 自动机的算法即被称为 Thompson 构造（这一提法在龙书第二版被最后定型）。

稍微后于 Thompson，Dennis Ritchie 实现了另一个 QED。

> [QED (text editor)](https://en.wikipedia.org/wiki/QED_(text_editor)) 是一种命令行环境下的行编辑器（早期的 Berkeley 版本的 QED 是面向字符的），每次针对文本文件中的一行进行编辑。它的继任者包括 Unix 中的 ed，Linux 中的 edline 等等。vi 当然也是其继任者，但 vi 以及后来的 vim 都是控制台全屏幕编辑器，而非命令行模式下的行编辑器。
>
> [GitHub - CharlesHawkins/qed: Re-implementation of Berkley QED, a 1967 text editor ancestral to ed and vim](https://github.com/CharlesHawkins/qed)
>
> Nokia 有一篇文章介绍了 QED 的历史：[History of QED - An incomplete history of the QED Text Editor](https://www.nokia.com/bell-labs/about/dennis-m-ritchie/qed.html)，这是 Ritchie 的一篇回忆录。Ritchie 还提到该版本的 QED 在一份内部技术备忘录中进行了描述，该备忘录可以以略微精简的 [HTML 可浏览格式 ](https://www.nokia.com/bell-labs/about/dennis-m-ritchie/qedman.html) 获取，也可以以扫描的（且很大：1.1MB） [PDF](https://www.nokia.com/bell-labs/about/dennis-m-ritchie/qedman.pdf) 图像形式复制 ，后者是一份宝贵的史料。

注意，Thompson 和 Ritchie 是 C 语言的设计者，Unix 系统的开发者。此外，Thompson 还是 Plan 9 和 Golang 的设计者和开发者。

早期的 Unix 工具如 grep，vi，sed 均只实现了基本型正则式（BRE，Basic Regular Expression），而较晚一点出现的如 egrep，awk 等实现了增强型正则式（ERE，Extended Regular Expression），从而形成了 POSIX 规范中的两大流派。注意 grep 工具现在同时支持 BRE、ERE（`-E`）和 PCRE（`-P`）。

大约 1986 年，Henry Spencer 发布了 C 语言实现的正则式库。该代码的中心思想在后继的各类实现中被参考和重新实现。

几乎同一时间，Larry Wall 开发并发布了 Perl，其中自行实现了正则式引擎，但比较简陋且 bug 较多。大约 1988 年，Perl 2 时代，Larry 采纳了 Henry Spencer 的代码，但直到 1994 年 Perl 5 时重新实现的该正则式包才具有现在的 Perl 正则式的第一形态。

在大约 1997 年，Phili Hazel 开发了 [PCRE](https://en.wikipedia.org/wiki/Perl_Compatible_Regular_Expressions)，PCRE 也是一个 C 语言实现的正则式库，它全面仿制了 Perl 的正则式风味，提供为其它软件提供正则式功能，包括 PHP，Apache 2 等流行软件均集成了 PCRE。

相比较与 Perl 5 之前的版本，PCRE 的引擎质量很高，Perl 反过来与 PCRE v1 协作并共同推进这一流派的正则式语法风味。在 PCRE 7.x 和 Perl 5.9.x 阶段，这两个项目协调开发，功能在它们之间双向移植。

晚些时候，2015年，PCRE 分叉了 v2 版本开发独立演化。旧分支作为 PCRE v1 继续进行有限的更新，并最终停止。当前 PCRE 的活动分支为 v2。

综观 PCRE 的实现，实际上其效率不够高且存在滥用和溢出问题（某些情况下构成了安全 issue）。这是因为，为了支持贪婪重复、断言以及反向引用等高级特性，引擎的搜索算法必需引入回溯机制，这导致复杂度提升和时间内存的双重消耗，并且在某些特殊构型的正则式 Pattern 上会引发极低的性能。旧的实现中，递归的子表达式和反向引用可能导致无限的回溯，新的实现中采用几种方法（记忆历史回溯，限制最大回溯步数等）来解决该问题，并要求程序员应该了解怎么编写良好的正则式 Pattern。尽管在某些临界点 PCRE 会导致问题，它仍然成为了最广泛使用的代码库，形成了最庞大的正则式流派。这大概有两个原因：语法风味方面它相当强大，其次它是开源的，再一个则是它是 C 代码库。探究其后的原因是有趣的，但那将是另一篇文章要做的事。

同样在 80 年代，Rob Pike 在编写文本编辑器 sam 的时候也实现了一个新的引擎，并被 Dave Presotto 提取和收录到了 Unix v8 中。但是这一引擎的能耐长期被忽略了。由于后来 Henry Spencer 重新实现了 Unix v8 中的相关 API，Pike 的实现方案被遮蔽了，其代码思想在很长一段时间都没有得到重视。

如上文所述，Spencer 将他早期的实现发布到了公共领域，并取得了广泛的成就，并在后来演进为 PCRE 1 和 2（PCRE 的核心引擎采用和保留了 Spencer 的设计思想）。

而 Pike 的实现方案不同于该理论，并且很快，但缺乏名声。不过幸运的是它并未消亡，该方案也被引入并成为了 Plan 9 的 [正则表达式库](http://plan9.bell-labs.com/sources/plan9/sys/src/libregexp/)。1999 年，Ville Laurikari 独立发现了 Pike 算法，并建立了理论基础，该算法的思想得以总结。

> Pike 还用递归下降方法实现了一个简单版本，这是他的早年作品，仅支持连接和闭包。

还是在 1986 年，POSIX 标准首次发布，正则式语法被定义为三种风味并收录为其中给一个独立的章节：SRE，BRE 和 ERE。这里 SRE 为 Simple RE，由于过于简单所以我们略过了它。

现代开发语言，例如 C#，C++，Golang 等等均原生实现了正则式算法，将其作为标准库的一部分。

大约 1999 年早期，微软研究员的 [Eric Niebler](mailto:ericne@microsoft.com?subject=greta gripe) 发布了 GRETA 的首个版本。GRETA 采用 C++ 元编程技术并包含了一些魔改，从而将工作性能显著提升。随后几年里陆续发布了一些改进版本，但是注意到此时 VC++ 相对较为主流，基本上 GRETA 是不能跨 C++ 编译器的，这最终导致了 GRETA 的消亡。GRETA 本身实现了大多数 PCRE，并有微小的区别，尽管它的源代码本身由于兼容性原因不再发展，但它所代表的 PCRE 改版的养分被其它新生代开发语言所吸收，在今天，Javascript，C#，Golang 等所实现的 regexp 标准库大体上都属于这一风格，即融合了 POSIX 和 PCRE 两大规范后又有所修改和增强。

2010 左右，Russ Cox 开源了 [RE2](https://github.com/google/re2) 的实现（实际上是由 Google 公司开源的，RE2 原本是一个子系统的支持库，但遵循当时 Google 的开源政策被独立发布了，再后来则被转而在 github 上保持更新），此 RE2 与 GRETA 并不相同，Russ Cox 研究并评估了 Pike 算法以及诸多此前的各种 regexp 引擎实现，并提出了新的方案，即采用虚拟机动作来完成匹配，这有别于 grep 系列的 Thompson NFA 方式，也不同于 PCRE 的基于回溯的匹配方案。最终，该算法被引入 Golang 中，也被用于 Golang 的各种产品中。

> 在 RE2 中采用了相当复杂的评估方案，并非仅有虚拟机方法，它也包含 NFA 方式、仿真 NFA 方式（即 Pike 算法）以及一种改进的三元索引方法，后者面向非内存场景，它也评估 NFA 效能并在可能的情况下编译到 DFA，而后者在一定程度上是速度最快或者次快的方案（但坏处是可能状态爆炸，内存需求超限）。

[Russ Cox](https://swtch.com/~rsc/) 同样也是名人，他是 Plan 9，Golang 的开发者之一。

RE2 也被引入 Microsoft 的某些产品中，此外它也被引入除了 Golang 之外的诸多新兴的编程语言中，例如 Rust，Zig 等等。因此，从大约 2010 年开始，RE2 逐渐形成了正则式流派中的新势力。这样的发展并不奇怪，Russ Cox 的实现既能跟上时代（GRETA 在 C++11 之后就湮灭了，因为其实现采用了早期 C++ 编译器的魔法，无法在 C++11 时代被复制和改进），性能又优于其它实现（指的是 PCRE 和 POSIX ERE 等等），而且剔除了 PCRE2 的大量偏门的技能，再加上它易于集成（C++库，并有 C ABI 接口），所以新兴势力选它而不选 PCRE 是很自然的。

新世纪以来，由于各个流派的 CPU 体系（例如 Intel，AMD，ARM 和 RISCV）都在 SIMD 计算方面加大的支持，所以正则式引擎也有这种专用优化的新实现，Intel 的 Hyperscan 就是其中一种，其生产应用主要在基础设施方面，例如某些邮件过滤系统、防火墙等等。但这种风味的实现仅仅提供了性能优化，对于计算机科学的相关学科理论方面的贡献不大。

但是，像 Hyperscan 这样的引擎实现，有其独特的应用场景和独到之处，在大规模正则式匹配的场景下 RE2 是不能与其竞争的。不过 RE2 也并不专门针对像垃圾邮件分类这样的动辄数百万条正则式的场景。所以并不能说 RE2 不行。反之亦然，Hyperscan 目前只能工作在 Intel CPU 上，这很正常，它采用了 Intel CPU 的 SIMD 加速，但同时它就无法在任何其它 CPU 上移植，此外 Hypersan 具有高昂的编译代价，并需要将编译结果储存为一个数据库，所以它的工作负载较高，不适合轻量级工作环境，例如目前的大多数嵌入式场景，即使 CPU 选型不是问题，也难以支持 Hyperscan 引擎的工作要求。

典型的 Hyperscan 工作机器，可能是像 带有 48GB 的 Intel 志强 8180 CPU 之类的服务器。

但 RE2 引擎所能工作的场景从移动设备、家用设备、工业设备等嵌入式场景，到 PC 机或者工作站和服务器，均可移植和运转。

除了上面讨论的新势力之外，POSIX RE 和 PCRE2 自身也在演进。

现在的流行的正则式实现基本上都支持 ERE 和 PCRE2 的融合增强版本（总的来说是抛弃了 PCRE 的某些走火入魔的东西如某些奇奇怪怪的前瞻或者递归模式之类，但吸收和保留了其简洁明快的部分如 `\d` 等）。并且所有的这些存活的实现大体上都支持 Unicode 字符集（程度深浅不一）。

### 关于正则式引擎实现与优化

如今（2025 年）想要实现一个完整全面的正则式代码库是一桩相当不容易的工作，你需要掌握大量的跨越形式文法的其它知识，尤其是各种字符集以及 Unicode 的各种细节，此外你还将面临回溯与性能之间的权衡与挑战，想要别出机杼地设计出一种全新的实现方案非常困难。

关于正则式引擎的优化，取决于生产场景。例如对于偶尔编译但大量匹配（例如邮件过滤系统），那么尽可能地“过”编译到机器码级别是最佳选择，这样使得 match 运算能够最快，而编译的速度如何、耗费如何并不重要。而对于频繁编译然后匹配的情况，则需要在编译速度和匹配速度之间取得平衡，因为显而易见，编译的粒度更细时耗费的编译时间更长（例如事先编译到 DFA 状态），但却能帮助匹配算法更快（DFA 状态表的匹配基本上是查表）。此外，某些场景要求正则式引擎能够同时运转大批量的正则式，而某些场景只需要少数规则单次运行，或者偶尔定期运行即可。

不同的要求决定了你所设计并实现的正则式引擎应该侧重于哪些方面。

当然，由于现代的高级 regexp 语法并不能全都翻译为 NFA 和 DFA，上述的某些思想并不能完全奏效。应对这一挑战通常采用两种方法：

第一是子自动机。带有零宽断言的正则式无法直接编译为 NFA，但零宽断言重点条件部分，以及正则式的主体分别是两个子自动机。对于这两者来说通常是可以编译到 NFA 的，例如 `(?!ab)cde` 这个正则式，我们可以拆分为 `ab` 和 `cde` 两个子自动机，然后采用一个条件语句来串联两者即可完成整个正则式的匹配。

第二种方法是采用某种虚拟机的变体。这里所谓的虚拟机，是指 Thompson 虚拟机或者 Glushkov 虚拟机，两者各有特点，细节不在这里展开。该种技术的特点是将每个正则式语法规则（运算）映射为一个特殊的虚拟机（我们认为这是一种自动机）的字节码指令，当编译完成之后，我们得到的是该虚拟机的字节码序列。只需运行该虚拟机，并喂给它输入字符串流，就可以完成匹配。这种思路在早年非常典型且经常被用到，而且常常是直接编译到机器指令（例如 Thompson 的 QED），新世纪以来运用这种思路似乎相对较少，v8 引擎是一种。

事实上，在60、70 年代，“编译”当然就是编译到机器指令，只不过在经过 90 年代 CPU 虚拟化和 Java 虚拟机的理论丰富之后，现在我们会首先引入虚拟机这个中间抽象层，将其简单映射到具体 CPU 就得到前面的路线了。

同样地进一步思考，在虚拟机中我们可以设计一条特殊的机器指令如 `xlat <re-index>`，其参数为一个预先编译好的 NFA/DFA 状态机，这样就能将某些特定的子表达式的匹配算法转交给按索引指引的子自动机上，例如 `[0-9]+` 就可以如此处理，专门的自动机可以在 4-8 条底层（例如 Intel 或者 ARM）机器指令的规模下非常优秀地完成数字字符串的识别（如果包括计算累加在内大概在 20-30 条 Intel 机器指令之内，但肯定比虚拟机字节码所映射的机器指令数少）。

~~类似的设计和优化思想，我们会在后续章节的相关部分进行讨论~~。

另一种优化思路，是针对图运算的。在计算机科学的相关理论中，图论与图算法是很重要的一个分支。这个方面的理论性较强，优化算法其本身的实现难度不高，挑战来自于判断：你需要判定何时应该采用何种优化，这个方面关乎你的理论知识的储备。



### 随想

梳理正则式的整个历史发展链条，你会发现一个有趣的视点，即真理一直掌握在 Thompson 手里，无论是 QED，Unix，C 还是 Golang 和 RE2。Thompson 不但至今健在，还在跨越过去 60~70 年的计算机发展历史中始终站在顶端。



### 后记

我还没有决定要如何做，和要做什么。因此本文的正文内容先上。

本文有点草草，所以各种史料以及相应的相关原始网站和出处，我没能罗列出来。

今后某一天或许我会查证后补齐的吧。



🔚