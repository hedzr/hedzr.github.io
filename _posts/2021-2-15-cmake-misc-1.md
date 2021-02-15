---
layout: single
title: 'cmake misc 1'
date: 2021-02-15 05:41:00 +0800
last_modified_at: 2021-02-15 07:07:00 +0800
Author: hedzr
tags: [c++, cmake-hello, cmake, misc, modern cmake, cmake tutorial, cmake examples]
categories: cmake notes
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-11.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Modern CMake Tutorial 相关，misc 1 ...
---





## CMake Miscellaneous

下面有一些被深入研究过，又或是重新研究 CMake 新版本文档后得知的需要更新的知识。

反正陈旧的知识竟然全都落伍了，我要忘记自己会编程的妄想，自认为尚属初哥态。



### About Cleanup

对于 CMake 3.x 来说，以下特性是新增的：

#### `--target clean`

执行一个 cleanup 操作，相当于删除构建文件夹之后重新执行 cmake 配置操作。

```bash
cmake --build cmake-build-release --target clean
```



#### `--clean-first`

对于 CMake 3.0.2+ 来说，新的选项 `--clean-first` 也有相似的作用。这个新选项等价于执行构建操作，但在构建前自动地清理构建文件夹中的配置数据。

```bash
cmake --build cmake-build-release --clean-first
```



上述的两个特性，就是为了帮助你不必删除构建文件夹但又可以重启配置步骤的。





### About `OPTION`

`OPTION` 指令是 CMake 提供的一个开关量。

它的作用在于你可以通过检测这个开关量的值（为 ON 或 OFF）来提供不同的构建配置。例如：

```cmake
option(BUILD_DOCUMENTATION "Create and install the HTML based API documentation (requires Doxygen)" OFF)
find_package(Doxygen)
if (DEBUG OR NOT DOXYGEN_FOUND)
    set(BUILD_DOCUMENTATION OFF)
endif ()


if (BUILD_DOCUMENTATION)
...
endif ()
```

OPTION 之所以有用，在于三点：

1. 它是全局变量
2. 它可以被改变而不必重启完整的配置
3. 多数 IDE 提供了对其的可视化编译操作，cmake-gui, cmake-frontend, qtcreator, kdeveloper 等，clion 虽然没有针对他们提供可视化操作，但也是支持的。

OPTION 变量自动具有全局可见性，它是一个 CACHE 变量。

所以以下命令行是行得通的：

```bash
# modify it
cmake -DBUILD_DOCUMENTATION=OFF --build build/
# remove it from cached value-set
cmake -UBUILD_DOCUMENTATION --build build/
```

当你使用 `-D` 修改它时，cmake 会重新配置，但由于 cache（上次配置的所有内容）的存在，所以这会是一个轻量级的配置重放，只有改变的部分会产生影响。

所以它比 `--target clean` 这类清理操作还要轻量级一点。

OPTION 变量之所以有用，也和 IDE 提供的可视化编辑工具分不开关系，你可以比较方便地修改它们。



#### CMAKE_CONFIGURATION_TYPES

`CMAKE_CONFIGURATION_TYPES` 是给 IDE 提供的接口，它可以列出一系列可选项，IDE 可以据此提供一个下拉列表供用户选择。

一般来说它可以是这样的：

```cmake
set(CMAKE_CONFIGURATION_TYPES "Debug;Release;MinSizeRel;RelWithDebInfo" CACHE STRING "" FORCE)
```

注意分号字符和空格的效果是等效的，参见我们曾经提及的 cmake 的基础语法中有关 字符串 LIST 部分的说明：[字符串列表](https://hedzr.github.io/cmake/notes/cmake-05/#%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%88%97%E8%A1%A8)。

不过，现代 IDEs 通常已经支持更新一些的设置方案，即通过 Properties 元数据来提取值列表：

```cmake
  set_property(CACHE CMAKE_BUILD_TYPE PROPERTY STRINGS
               "Debug" "Release" "MinSizeRel" "RelWithDebInfo")
```

这可以被 cmake-gui 等所支持。

#### cmake-gui

[cmake-gui](https://cmake.org/cmake/help/latest/manual/cmake-gui.1.html) 是 CMake 所提供的一个辅助工具。其它平台可以通过包管理安装，macOS 中则通过 cask 安装：

```bash
# 安装 cmake-gui 以及命令行工具：cmake, cpack, ctest 等等
brew cask install cmake
# or
brew install cmake --cask


# 安装 cmake 本身（注意也包括 cpack, ctest 命令行版本）
brew install cmake
```

注意，cpack，ctest 的命令行版本是随 cmake 一道被分发的。

但通过 cask 安装的 GUI 版本中为了 cmake-gui 能够执行工作，也随附了 cmake, cpack, ctest 命令行版本供 cmake-gui 所调用。





### About `CMAKE_BUILD_TYPE`

按照 CMake 文档，你不应该简单地检查 CMAKE_BUILD_TYPE 是 Release 还是 Debug 来判断使用了哪一种构建模式。

我们惯常了解的是两种构建模式：DEBUG 和 RELEASE。我们会在 DEBUG 模式中打开编译器的调试信息开关，这些调试信息将被 gdb/lldb 等调试器所用，从而帮助我们在开发阶段调试我们的代码，定位正在运行到的源代码行，检查当前运行位置的上下文，栈上变量等等。

但 `CMAKE_BUILD_TYPE` 除了可以有 "Release" 和 "Debug" 这两个典型的值之外，还可以是空值。理论上说，你还可以随意设置它到任何字符串值。设想一个值 `RelWithDebugInfo`，它允许我们在 Release 构建模式中强制添加 `-g` 到编译器选项中，这样我们可以获得 Release 模式下的成品 app，且这个 app 带有调试信息。有的时候，这可能是线上环境中检测故障原因的有力办法：我们可以在一个特定的目标集合中上线这种特别的app，然后通过线上日志等信息来判断故障原因，由于 debug 信息的存在，我们甚至有可能直接定位到源码行。在真实世界中，无论你怎么建立线上环境的模拟区，它终究不是生产环境，有时候你就是会遇到无法重现的故障，只在生产环境才会发生，非常愤怒，但实际上即使如此，也还是可以有办法设法去解决的，RelWithDebugInfo 就是其中的一种。

所以简单地检查 CMAKE_BUILD_TYPE 是 Release 还是 Debug 并不是正确的行为。

在我们的 CMake 脚本中，prerequisites.cmake 提供一个片段来约束上述的自由行为，并将构建模式限制在有限的几种模式中：

```cmake
set(default_build_type "Release")
if (EXISTS "${CMAKE_SOURCE_DIR}/.git")
  set(default_build_type "Debug")
endif ()
if (NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
  message(STATUS "Setting build type to '${default_build_type}' as none was specified.")
  set(CMAKE_BUILD_TYPE "${default_build_type}" CACHE
      STRING "Choose the type of build." FORCE)
endif ()
if (NOT CMAKE_CONFIGURATION_TYPES)
  # Set the possible values of build type for cmake-gui
  set_property(CACHE CMAKE_BUILD_TYPE PROPERTY STRINGS "Debug" "Release" "MinSizeRel" "RelWithDebInfo")
  set_property(CACHE CMAKE_BUILD_TYPE PROPERTY HELPSTRING "Choose the type of build")
  # set(CMAKE_CONFIGURATION_TYPES "Debug;Release;MinSizeRel;RelWithDebInfo" CACHE STRING "" FORCE)
endif ()

if (CMAKE_BUILD_TYPE STREQUAL "Debug" AND NOT WIN32)
  # In non-win32 debug build, debug_malloc is on by default
  option(USE_DEBUG_MALLOC "Building with memory leak detection capability." ON)
  option(DEBUG "Building with DEBUG Mode" ON)
else ()
  # In win32 or non-debug builds, debug_malloc is off by default
  option(USE_DEBUG_MALLOC "Building with memory leak detection capability." OFF)
  option(DEBUG "Building with NON-DEBUG Mode" OFF)
endif ()

```

这一段脚本的含义很清晰，它研究 CMAKE_BUILD_TYPE 并排除非法值（包括空值也被视为非法），并将 CMAKE_BUILD_TYPE 重置为特定的四种值："Debug" "Release" "MinSizeRel" "RelWithDebInfo"。

如果原有的值不合法，那么以下两种情况将被 fallback：

1. 缺省的模式是 Release
2. 如果 source tree 中有 .git 文件夹，则认为处于 Debug 模式

其中 case 2 是值得研究的，至少它并不适合于 GitHub Action 环境。只不过对于其他 CI 环境来说，通常我们都会显式地指定一个确切的 CMAKE_BUILD_TYPE 有效值，所以并不需要上述 fallbacks。

> `CMAKE_BUILD_TYPE` 为 empty 值的情形，也可以衍生别的用法，例如 [CMake and the Default Build Type - Kitware Blog](https://blog.kitware.com/cmake-and-the-default-build-type/) 有一个相应的探讨，不过对于一般的开发案例来说，我们还是在 release/debug 两种 cases 中来展开。
>
> > 这个提示，源于 [David Faure](https://stackoverflow.com/users/758288/david-faure) 于 [SO 上的回答 ](https://stackoverflow.com/a/57154400/6375060)。
> >
> > 我们的片段中，开始部分和上述 Blog 提供的相同。由于这是一段众所周知的公众域脚本，所以研究来源和版权是不适用的。

在约束了 CMAKE_BUILD_TYPE 值的有效性之后，上述脚本继续进一步的处理，然后提供两个 options 变量：

1. DEBUG：在后续的脚本中，`if (DEBUG)` 来检测 Debug/Release 要方便得多（比起 `if (CMAKE_BUILD_TYPE STREQUL "Debug")` 来说的话）
2. USE_DEBUG_MALLOC：这个选项最终会被体现为编译器选项，或者 config.h 中的一个 define。它的作用是为代码编写提供一个宏变量，允许你提供内存泄漏检测方面的一个辅助特性。















🔚