---
layout: single
title: Rust string(s) 初学之二
date: 2025-05-03 09:58:00 +0800
last_modified_at: 2025-05-03 09:58:00 +0800
Author: hedzr
tags: [rust, string]
categories: rust study
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/upgit/2025/05/20250502_1746142520.jpg
  overlay_image: /assets/images/rust-string.jpg
  overlay_filter: rgba(32, 32, 0, 0.5)
excerpt: >-
  Rust 初学笔记，关于字符串之二 [...]
---



## 前言

接续上一篇 [Rust string(s) 初学](https://hedzr.com/rust/study/rust-study-about-string/) 继续整理字符串。



## Rust 字符串管理以及操作

### 针对字符串的操作

#### 取得字符串长度

```rust
let characters_count = "Hi 世界".to_string().chars().count();
// = 5
```

上一篇提到过，字符计数需要用 `chars()`。



#### 取得片段

有多种方式取出字符串的一个片段。

一个典型的方法是在 `chars()` 上使用 `take, skip` 等操作之后再做搜集（`collect`）。

```rust
    #[test]
    fn test_string_extract() {
        println!("\n");

        let text = "The quick brown fox jumps over the lazy dog";
        let iter = text.chars();
        let result = iter.skip(4).take(5).collect::<String>();
        println!("{}", result);
    }
```

这个方法也适用于 `Vec<char>` 表示的字符串，尽管那实际上是字符数组，但例如 `Vec<char>::iter()` 获得迭代器之后可以同样方式地操作。

在迭代器上还可以使用诸如 `skip_while(predicate)` 等等谓词。



#### 比较两个字符串的相等性

直接使用 `==` 进行比较，即使左右操作数分别是 `String` 和 `&str` 也可以。所以 `a_string == "hi"` 的表达式合法。

但是如果想要不区分大小写地比较相等性呢？

没有办法，只能笨操作：

```rust
let needle = "μτς";
let haystack = "ΜΤΣ";

let needle = needle.to_lowercase();
let haystack = haystack.to_lowercase();

for i in haystack.matches(&needle) {
    println!("{:?}", i);
}
```

或者使用正则式方案：

```rust
use regex::RegexBuilder;

fn main() {
    let needle = "μτς";
    let haystack = "ΜΤΣ";

    let needle = RegexBuilder::new(needle)
        .case_insensitive(true)
        .build()
        .expect("Invalid Regex");

    for i in needle.find_iter(haystack) {
        println!("{:?}", i);
    }
}
```

使用高级正则式语法的话，还可以简化：

```rust
let re = Regex::new("(?i)μτς").unwrap();
let mat = re.find("ΜΤΣ").unwrap();
```

其中 `(?i)` 表示构造正则式时使用大小写不敏感的方式。

一般来说，不必担心 regex 的 UTF-8 适配性。



#### 查找子串

```rust
fn main() {
    let text = "The quick brown fox jumps over the lazy dog";

    // Check if the string contains a word
    if text.contains("fox") {
        println!("Found the word 'fox'!");
    }
}
```

and

```rust
fn main() {
    let text = "The quick brown fox jumps over the lazy dog";

    // Find the index of the word "brown"
    if let Some(index) = text.find("brown") {
        println!("'brown' starts at index: {}", index); // Output: 10
    }
}
```



#### 追加字符串

`push_str` 可以用于追加字符串，而 `push` 用于追加单个字符。

```rust
let mut s = String::from("abç");
s.push_str("123");
s.push('4');
assert_eq!(s, "abç1234");
```



#### 插入字符串

String 可以插入单个字符，也可以插入子串：

```rust
#[test]
fn test_string_insert() {
    println!("\n");

    let mut s = String::from("abç");
    s.insert(2, 'c');
    assert_eq!(s, "abcç");
    s.insert_str(3, "def");
    assert_eq!(s, "abcdefç");
}
```



#### 移除子串

String 可以直接移除单个字符。例如：

```rust
let mut s = String::from("abç");
assert_eq!(s.remove(0), 'a');
assert_eq!(s.remove(1), 'ç');
assert_eq!(s.remove(0), 'b');
```

但没有简单直接的方式移除一个子串，除非你使用替代子串的方法。

如果是想移除字符串首尾的白空格，直接使用 `trim()`。



#### 替代子串

替代一个子串的方法是 `replace()`：

```rust
    #[test]
    fn test_string_replace() {
        println!("\n");

        let name1 = "Hello Free Wills, 
This is a new world!
It is a real world."
            .to_string();
        let name2 = name1.replace("world", "YOU");
        println!("{}", name2);
    }
```

如果想做模式匹配，见后面的 regex 节。

如果想要移除一个子串，也可以使用 replace，只要给出替代品为 "" 就好。



#### 切分字符串

通过 `split()` 来切分字符串。

```rust
    #[test]
    fn test_string_split() {
        println!("\n");

        let fruits = "apple,banana,orange";
        for token in fruits.split(",") {
            println!("fruit is {}", token);
        }

        //store in a vec
        let tokens: Vec<&str> = fruits.split(",").collect();
        println!("apple  is {}", tokens[0]);
        println!("banana is {}", tokens[1]);
        println!("orange is {}", tokens[2]);
    }
```

如果是想按照白空格切分，则可以直接使用 `split_whitespace()`。



##### 使用迭代器 `chars`

前文有提到过如果想要针对 String 中的 UTF-8 字符进行操作，唯一的方法是透过迭代器 `chars()` 来进行。

```rust
let n1 = "long long ago there lived a king".to_string();
for ch in n1.chars() {
  println!("{}", ch);
}
println!("{} characters printed.", n1.chars().count());
```

然后可以用迭代器上的 `collect()` 来搜集字符，抽出其中的 slice 片段重组一个 vec 乃至于 string。





### 正则式

需要添加额外的依赖库 regex。首先修改 `Cargo.toml` 加入：

```toml
[dependencies]
regex = "1"
```

然后在代码中可以引用 `regex::Regex`：

```rust
use regex::Regex;
```

一个例子是：

```rust
use regex::Regex;

fn main() {
    let pattern = Regex::new(r"^\d{4}-\d{2}-\d{2}$").unwrap(); // A pattern for a date in YYYY-MM-DD format
    let date = "2024-09-14";

    if pattern.is_match(date) {
        println!("The date is in the correct format.");
    } else {
        println!("The date is in an incorrect format.");
    }
}
```

进一步的用法请参考正则式语法，以及 regex 库的文档。这里不做展开了。



### 正确的字符串连接方式

前面在追加字符串部分已经展示了特定的追加操作在增长一个字符串。

更通用的字符串连接操作，一般来说首选两种方式：

```rust
let datetime = &format!("{}{}{}", DATE, T, TIME);

let mut datetime = String::new();
datetime.push_str(DATE);
datetime.push_str(T);
datetime.push_str(TIME);
```

其中，`format!` 宏是最为推荐的方式，灵活且性能优秀。如果场景更单纯则直接使用 `push(ch)` 和 `push_str(str)` 方法。

> 对此，本文并非性能调优专题，所以仅给出结论。

如果你要使用 `+` 连接字符串，也不是不行，性能上没有太多劣势，但语法上有：

```rust
fn main(){
   let n1 = "Tutorials".to_string();
   let n2 = "Point".to_string();

   let n3 = n1 + &n2; // n2 reference is passed
   println!("{}",n3);
}
```

这挺反直觉的。但 拜rust教 信徒则觉得美极了。



如果对性能有关注，不妨看看 [String concatenation best practices/performance?](https://users.rust-lang.org/t/string-concatenation-best-practices-performance/65876) 和 [hoodie/concatenation_benchmarks-rs](https://github.com/hoodie/concatenation_benchmarks-rs)，这里做了一些 benchmarks，而且罗列了各种各样的字符串连接方法，全面但冗余。

总的来说，rust 缺乏一个 `StringBuilder`，但是利用 reserved spaces 和 `format!` 宏的方式也算是很灵活了，甚至有时候还很有优势。

```rust
fn main() {
    let mut s = String::with_capacity(50); // Preallocate space for 50 characters
    s.push_str("Hello, ");
    s.push_str("world!");

    println!("{}", s); // "Hello, world!"
}
```





## 后记

有关 Rust 字符串的操作的更多内容，敬请期待下一篇（但我不确定什么时候继续字符串话题）。

图片直接取自网络，此致。

上一篇 [Rust string(s) 初学](https://hedzr.com/rust/study/rust-study-about-string/) 中介绍了 Rust 字符串的几种数据类型表示法，但那是面向通用编程的，针对系统编程和互操作性方面的实际上还有 OsString，OsStr，以及 CString 和 CStr，这些类型的特殊性不多，暂不具体介绍，或者留待异日吧。



🔚
