---
layout: single
title: '使用 CMake Presets'
date: 2024-01-05 03:00:00 +0800
last_modified_at: 2023-01-05 05:50:00 +0800
Author: hedzr
tags: [c++, cmake, presets]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/Screenshot%202024-01-04%20at%2012.40.01.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  关于 CMakePresets.json 文件的编写方法 ...
---

> 使用 CMake Presets

## 基本知识

> 按：
>
> 一直需要 CMake 具有自动 import 某个脚本的能力。但它并没有。
>
> 最为接近的能力有两个：
>
> - [CMAKE_TOOLCHAIN_FILE](https://cmake.org/cmake/help/latest/variable/CMAKE_TOOLCHAIN_FILE.html)
> - [CMake Presets](https://cmake.org/cmake/help/latest/manual/cmake-presets.7.html)
>
> 其中 CMAKE_TOOLCHAIN_FILE 顾名思义是早期辅助设定 toolchain 用的（一般是用于交叉编译场景，vcpkg 也采用了该机制），这意味着它的加载时机和作用时机都非常早，早到不适合给针对具体项目进行必要的初始化设定。同时它的问题是它是破坏性的，你必须明确地在命令行中指定要加载的脚本，这不是自动的。所以它不行。
>
> 尽管像 vscode 等允许你提前设置一个文件，这样就不必显式带上命令行参数了，但你只能指定一个！如果你同时使用 vcpkg 而且自定义了一个脚本，怎么办呢？没有办法，我猜你的选择是放弃 vcpkg，是吗？
>
> 我不是，我两个都放弃。vcpkg 这个引用 --toolchain 的用法我一点也不喜欢。其实应该怪的是 CMake 真的很垃圾，各种的奇形怪状的设定。
>
> 至于 CMake Presets 嘛。
>
> 嗯，一言难尽！
>
> 它不是我原本希望想要的那个东西。但它的确有点用。本文试图将其用法展现出来……

### 什么是 CMake Presets

编写 CMake 脚本的过程中，我们不断重复着自己：我们一遍又一遍地为一个 executable 或者一个 library 编写着相似甚至于完全相同的设定，尤其是 CMAKE_CXX_FLAGS 这样的东西。

所以我们渴求某种机制能够解决这样的烦恼。

比较容易想到的方法是 macro 和 function。它们可以把某些固定的序列抽出来固化，然后用不同的名字调用就可以了。一种可能的范本大致是像这样子的：

```cmake
macro(new_executable taget_name)
  # ... extract target_name and rest args by ARGN
  add_executable(${target_name} ${ne_ARG_SOURCES})
  add_cxx_standard_to(${target_name} 20)
  target_compile_options(${target_name} PRIVATE
      -pedantic -Wall -Wextra -Wshadow -Werror -pthread
      -Wdeprecated-declarations
  )
  # ...
endmacro()

new_executable(test_simple simple.cc)
new_executable(test_decimal decimal.cc)
```

如上所示，现在定义一个可执行文件的 target 就简单多了。

它的问题在于如果对于 test_simple 需要同时应用几套配置，例如 clang-debug，gcc-debug，那么 macro 和 function 都不是合适的手段。

CMake 本身提供了 Debug，Release 这样的 CMAKE_BUILD_TYPE，但还有一点僵硬。因为使用不同的 Build Type 时你仍然需要在脚本中进行判断，并应用不同的编译选项。就如同这样：

```cmake
if(("${CMAKE_BUILD_TYPE}" STREQUAL "Debug") AND(NOT(${WIN32})))
	# In non-win32 debug build, debug_malloc is on by default
	option(USE_DEBUG_MALLOC "Building with memory leak detection capability." ON)
	option(USE_DEBUG "Building with DEBUG Mode" ON)
	set(CMAKE_BUILD_NAME "dbg" CACHE STRING "" FORCE)
else()
	# In win32 or non-debug builds, debug_malloc is off by default
	option(USE_DEBUG_MALLOC "Building with memory leak detection capability." OFF)
	option(USE_DEBUG "Building with NON-DEBUG Mode" OFF)

	if("${CMAKE_BUILD_TYPE}" STREQUAL "Debug")
		set(CMAKE_BUILD_NAME "dbg" CACHE STRING "" FORCE)
		set(CMAKE_DEBUG_POSTFIX "d" CACHE STRING "" FORCE)
	elseif("${CMAKE_BUILD_TYPE}" STREQUAL "Release")
		set(CMAKE_BUILD_NAME "rel" CACHE STRING "release mode" FORCE)
		set(CMAKE_RELEASE_POSTFIX "" CACHE STRING "" FORCE)
	elseif("${CMAKE_BUILD_TYPE}" STREQUAL "MinSizeRel")
		set(CMAKE_BUILD_NAME "rms" CACHE STRING "min-size release mode" FORCE)
		set(CMAKE_MINSIZEREL_POSTFIX "ms" CACHE STRING "" FORCE)
	elseif("${CMAKE_BUILD_TYPE}" STREQUAL "RelWithDebInfo")
		set(CMAKE_BUILD_NAME "rwd" CACHE STRING "release mode with debug info" FORCE)
		set(CMAKE_RELWITHDEBINFO_POSTFIX "" CACHE STRING "" FORCE)
	elseif("${CMAKE_BUILD_TYPE}" STREQUAL "Asan")
		set(CMAKE_BUILD_NAME "asan" CACHE STRING "debug mode with sanitizer" FORCE)
		set(CMAKE_ASAN_POSTFIX "" CACHE STRING "" FORCE)
	endif()
endif()
```

在上面的分支中，你还可以加上 CMAKE_CXX_FLAGS 的设置，例如给 Debug 加上 `-g -O0`，给 Release 加上 `-O3`，等等。这些都是题中应有之义。但是考虑到不同的编译器：clang, gcc, llvm, msvc, mccv clang-cl, ...，这样的分支也并不是那么容易编写。即使你终于写定了，也难以维护。即使你努力维护了，下一个项目可能需求根本不同，这些编译选项还得重新设计编写一套。

这肯定也是不舒适的。

如此，就要提到 CMake 还有一种机制可以处理这样的情形：Presets。

CMake Presets 是这样一种特性，每个 Preset 包含一套预设的选项：

- 关于配置的：例如 CMake 环境变量，搜索路径，文件夹，generator，等等
- 关于构建的：环境，关联的 configurePreset，构建线程相关设定，等等
- 关于测试的：环境，关联的 configurePreset，测试执行、筛选、输出相关设定，等等
- 关于打包的：环境，关联的 configurePreset，打包相关设定，等等
- 关于工作流的：工作流步骤相关设定，等等。

通常大多数 Presets 首先聚焦在 configurePreset 这个部分，因为这里涉及到各种构建环境前提条件的控制，例如 build-host 的处理器架构，关联到的 CMAKE_BUILD_TYPE 等等。

CMake 将会在 root CMakeLists.txt 这一级寻找 `CMakePresets.json` 或 `CMakeUserPresets.json` 文件，加载其中定义的各种预设值形成一套构建配置 Matrix，并以这个 Matrix 替代原始的 CMAKE_BUILD_TYPE 方案，从而提供更强的配置能力。原始的 CMAKE_BUILD_TYPE 毕竟只有 4 种标准类型，虽然也能扩充你的类型，但那也只能构成单级选择，无法形成多重选择的交叉矩阵。

想象一下，假设有 cpu arch（x86/amd64/arm64/aarch64/riscv...) - generators (ninja/virsual studio) - toolchains (clang/gcc/llvm/msvc/msvc-clang-cl/.../cross-compilers) - build-types (debug/release/relminsize/relwithdebug) - package-types (deb/rpm/msi) 这样的选择器形成的构建配置矩阵，那么你就能管理大型复杂的构建需求，这是采用 CMAKE_BUILD_TYPE 所无法达到的能力。

CMake Presets 就是为此而服务的。

### 基本结构

一个 `CMakePresets.json` 文件，大致有如下的格式：

```json
{
    "version": 3,
    "cmakeMinimumRequired": {
        "major": 3,
        "minor": 21,
        "patch": 0
    },
    "configurePresets": [
        {
            // ...
        },
        {
            // ...
        },
        // Add more presets here
    ],
    "buildPresets": [
        {
         // ...
        },
        // ...
    ],
    "testPresets": [
        {
           //  ...
        },
        // ...
    ]
}
```

你可以使用 CMake 命令行方式来添加上面框架结构中的 sections。

例如：

```bash
# 添加一个 configurePreset section
cmake --preset <preset-name>

# 添加一个 buildPreset section
cmake --build --preset <preset-name>

# 添加一个 testPreset section
cmake --build --preset <preset-name> --target test

# 添加一个 packagePreset section
cmake --build --preset <preset-name> --target package
```

关于每个 sections 的细节，以及命令的解说，请在官方文档中搜索：[official CMake documentation](https://cmake.org/cmake/help/latest/manual/cmake-presets.7.html)。



## 入门

### 最小的 CMakePresets.json

最小能有多小？只有版本号宣告：

```json
{
  "version": 6
}
```

和

```json
{
  "version": 8,
  "$schema": "https://cmake.org/cmake/help/latest/_downloads/3e2d73bff478d88a7de0de736ba5e361/schema.json"
}
```

> [`This file`](https://cmake.org/cmake/help/latest/_downloads/3e2d73bff478d88a7de0de736ba5e361/schema.json) provides a machine-readable JSON schema for the `CMakePresets.json` format.

### 官方示例

官方文档给出了一个比较真实的样例：

```json
{
  "version": 6,
  "cmakeMinimumRequired": {
    "major": 3,
    "minor": 23,
    "patch": 0
  },
  "include": [
    "otherThings.json",
    "moreThings.json"
  ],
  "configurePresets": [
    {
      "name": "default",
      "displayName": "Default Config",
      "description": "Default build using Ninja generator",
      "generator": "Ninja",
      "binaryDir": "${sourceDir}/build/default",
      "cacheVariables": {
        "FIRST_CACHE_VARIABLE": {
          "type": "BOOL",
          "value": "OFF"
        },
        "SECOND_CACHE_VARIABLE": "ON"
      },
      "environment": {
        "MY_ENVIRONMENT_VARIABLE": "Test",
        "PATH": "$env{HOME}/ninja/bin:$penv{PATH}"
      },
      "vendor": {
        "example.com/ExampleIDE/1.0": {
          "autoFormat": true
        }
      }
    },
    {
      "name": "ninja-multi",
      "inherits": "default",
      "displayName": "Ninja Multi-Config",
      "description": "Default build using Ninja Multi-Config generator",
      "generator": "Ninja Multi-Config"
    },
    {
      "name": "windows-only",
      "inherits": "default",
      "displayName": "Windows-only configuration",
      "description": "This build is only available on Windows",
      "condition": {
        "type": "equals",
        "lhs": "${hostSystemName}",
        "rhs": "Windows"
      }
    }
  ],
  "buildPresets": [
    {
      "name": "default",
      "configurePreset": "default"
    }
  ],
  "testPresets": [
    {
      "name": "default",
      "configurePreset": "default",
      "output": {"outputOnFailure": true},
      "execution": {"noTestsAction": "error", "stopOnFailure": true}
    }
  ],
  "packagePresets": [
    {
      "name": "default",
      "configurePreset": "default",
      "generators": [
        "TGZ"
      ]
    }
  ],
  "workflowPresets": [
    {
      "name": "default",
      "steps": [
        {
          "type": "configure",
          "name": "default"
        },
        {
          "type": "build",
          "name": "default"
        },
        {
          "type": "test",
          "name": "default"
        },
        {
          "type": "package",
          "name": "default"
        }
      ]
    }
  ],
  "vendor": {
    "example.com/ExampleIDE/1.0": {
      "autoFormat": false
    }
  }
}
```

这个样例基本上说明了 Presets 可以做些什么事。配合我们的“什么是 CMake Presets” 小节应该能够足以令你理解到你能用 Presets 去干点啥。

### 写一个 Preset

如前所述，编写一个 CMakePresets.json 文件的大部分任务是编制 configurePresets，然后在此基础上再追加其他如 buildPresets 等等。

一个 configurePreset section 可以是这样：

```json
{
  "version": 6,
  "configurePresets": [
    {
      "name": "debug",
      "displayName": "Debug",
      "generator": "Ninja",
      "binaryDir": "${sourceDir}/build/debug",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "Debug",
        "CMAKE_CXX_FLAGS": "-DDEBUG=1"
      }
    }
  ]
}
```

它指定了一个名为 Debug（displayName） 的 configurePreset，并和 CMAKE_BUILD_TYPE=Debug 勾连起来，所以能够继承该构建类型下辖的一系列默认设定和扩展方案（例如 CMAKE_DEBUG_CXX_FLAGS 等等）。此外，它还自动关联了 C++ 宏定义 DEBUG=1，这往往是 C++ 源代码开发中所需要的关键宏。

### 写更多的

顺理成章地，可以追加一个 Release preset：

```json
{
  "version": 6,
  "configurePresets": [
    {
      "name": "debug",
      "displayName": "Debug",
      "generator": "Ninja",
      "binaryDir": "${sourceDir}/build/debug",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "Debug",
        "CMAKE_CXX_FLAGS": "-DDEBUG=1"
      }
    },
    {
      "name": "release",
      "displayName": "Release",
      "generator": "Ninja",
      "binaryDir": "${sourceDir}/build/release",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "Release",
        "CMAKE_CXX_FLAGS": "-DNDEBUG=1"
      }
    }
  ]
}
```

这里 NDEBUG 是源自 MSVC 传统定义，但分配了一个数值，以便有时候能够编写这样的 C++ 代码：

```c++
#if NDEBUG
#else
#endif
```

而不是：

```c++
#ifdef NDEBUG
#else
#endif

#if defined(NDEBUG)
#else
#endif
```

事实上，一个完整的跨平台的 C++ 类库可能会有类似于下面的代码来容错：

```c++
#if defined(NDEBUG)
#define _NDEBUG 1
#else
#define _NDEBUG 0
#endif

#if defined(NDEBUG)
#undef NDEBUG
#endif

#define NDEBUG _NDEBUG

#if NDEBUG
// ...
#endif
```

但如果你的类库使用了我们这里的 CMakePresets.json 的话，上面的防错代码就是多余的了，你就可以直接使用 `#if NDEBUG`。

这一思考也同样作用于 DEBUG 和 _DEBUG 宏定义上。



### 完整的 “Default” Presets

你还可以继续添加 RelWithDebug，RelMinSize presets。这样的一套最简单的 presets，实际上就是 vscode cmake-tools 自动为你准备的默认 presets。如下图所示，一个 cmake c++ 项目在 vscode 中可以选择当前活动的配置集，此时就会弹出选择框自动向你提供 4 个标准的 presets：

![image-20240104174106037](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20240104174106037.png)

和

![image-20240104174132645](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/image-20240104174132645.png)

我们写这么一个 “Default” 的预设集 json 文件：

```json
{
    "version": 6,
    "configurePresets": [
      {
        "name": "debug",
        "displayName": "Debug",
        "generator": "Ninja",
        "binaryDir": "${sourceDir}/build/debug",
        "cacheVariables": {
          "CMAKE_BUILD_TYPE": "Debug",
          "CMAKE_CXX_FLAGS": "-DDEBUG=1 -g -O0"
        }
      },
      {
        "name": "release",
        "displayName": "Release",
        "generator": "Ninja",
        "binaryDir": "${sourceDir}/build/release",
        "cacheVariables": {
          "CMAKE_BUILD_TYPE": "Release",
          "CMAKE_CXX_FLAGS": "-DNDEBUG=1 -O3"
        }
      },
      {
        "name": "rel-with-dbg-info",
        "displayName": "Release with debug information",
        "generator": "Ninja",
        "binaryDir": "${sourceDir}/build/relwithdbginfo",
        "cacheVariables": {
          "CMAKE_BUILD_TYPE": "RelWithDebInfo",
          "CMAKE_CXX_FLAGS": "-DNDEBUG=1 -DWITH_DEBUG_INFO -g -O1"
        }
      },
      {
        "name": "rel-with-min-size",
        "displayName": "Release with minimal size",
        "generator": "Ninja",
        "binaryDir": "${sourceDir}/build/relwithminsize",
        "cacheVariables": {
          "CMAKE_BUILD_TYPE": "MinSizeRel",
          "CMAKE_CXX_FLAGS": "-DNDEBUG=1 -DWITH_MIN_SIZE -O0"
        }
      }
    ],
    "buildPresets": [
        {
            "name": "debug",
            "configurePreset": "debug"
        },
        {
            "name": "release",
            "configurePreset": "release"
        },
        {
            "name": "rel-with-dbg-info",
            "configurePreset": "rel-with-dbg-info"
        },
        {
            "name": "rel-with-min-size",
            "configurePreset": "rel-with-min-size"
        }
    ]
}
```

它和 vscode cmake-tools extension 的默认设定非常相似，并在此基础上增加了一些宏定义来帮助你更好地编写代码。







## 高级使用

### 使用预设子集

如果你正在开发一个广泛适配的项目（例如你正在管理一个 Debian 源项目，或者你准备开发一个项目申请放入 Debian 标准源中），比方说你需要你的项目能够在多种平台上以多种不同的设定来进行编译，很容易想到，反复编写那些相似却又似是而非的 json entries 着实是一种折磨，而且如果有一点变动的话，数十个 config set 可能都要同步修订。基本上这是一种灾难。

类似地，前文中我们提出了这样的假设：假设有 cpu arch（x86/amd64/arm64/aarch64/riscv...) - generators (ninja/virsual studio) - toolchains (clang/gcc/llvm/msvc/msvc-clang-cl/.../cross-compilers) - build-types (debug/release/relminsize/relwithdebug) - package-types (deb/rpm/msi) 这样的选择器形成的构建配置矩阵。此时我们也需要在哪怕 configurePreset section 之中也能有进一步的模组化能力，才能设计出上面的不同的配置风味。

对于这些要求，解决的办法是利用 `hidden: true` 来建立能够被重用的子集，然后利用 inherit include 来组合这些子集。

例如我们可以预设 use-clang 和 use-gcc 两个子集：

```json
{
    "version": 6,
    "cmakeMinimumRequired": {
        "major": 3,
        "minor": 25,
        "patch": 0
    },
    "configurePresets": [
        {
            "name": "debug-build",
            "hidden": true,
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Debug",
                "USE_DEBUG_OUTPUT": "ON",
                "USE_LOG": "ON",
                "USE_LOG_SEVERITY": "0"
            }
        },
        {
            "name": "release-build",
            "hidden": true,
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Release",
                "USE_DEBUG_OUTPUT": "OFF",
                "USE_LOG": "OFF"
            }
        },
      // ...
    }],
    // ...
}
```

注意到它们都设定了 `"hidden": true`，这样就不会在各种 UI 列表中出现了。例如 Clion 的 Run Configurations 列表中，就不会有 “debug-build”，“release-build” 条目供选择，取而代之的将是引用这些子集的那些 sections。如果你实在使用 vscode cmake-tools Extension，那里也有类似的关于 cmake Configurations 选择列表（前文的图示中已经有所体现）。

然后在稍后的 configurePresets section 中，我们可以这样利用它们：

```json
{
    "version": 8,
    "cmakeMinimumRequired": {
        "major": 3,
        "minor": 25,
        "patch": 0
    },
    "configurePresets": [
        {
            "name": "debug-build",
            "hidden": true,
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Debug",
                "USE_DEBUG_OUTPUT": "ON",
                "USE_LOG": "ON",
                "USE_LOG_SEVERITY": "0"
            }
        },
        {
            "name": "release-build",
            "hidden": true,
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Release",
                "USE_DEBUG_OUTPUT": "OFF",
                "USE_LOG": "OFF"
            }
        },
        {
            "name": "use-clang",
            "hidden": true,
            "cacheVariables": {
                "CMAKE_C_COMPILER": "clang",
                "CMAKE_CXX_COMPILER": "clang++",
                "CMAKE_CXX_FLAGS": "-stdlib=libc++",
                "CMAKE_EXE_LINKER_FLAGS": "-stdlib=libc++",
                "CMAKE_SHARED_LINKER_FLAGS": "-stdlib=libc++"
            }
        },
        {
            "name": "use-gcc",
            "hidden": true,
            "cacheVariables": {
                "CMAKE_C_COMPILER": "gcc",
                "CMAKE_CXX_COMPILER": "g++"
            }
        },

        {
            "name": "linux-clang-debug",
            "displayName": "Linux clang debug",
            "inherits": [
                "use-clang",
                "debug-build"
            ]
        },
      // ...
    }],
    // ...
}
```

如例所示，我们继续定义了 use-clang, use-gcc 两个子集，然后定义了 linux-clang-debug 这个真正的配置项目，它的 inherits section 中引用了 use-clang 和 debug-build  这两个子集，这就形成了两级维度的风味矩阵。所以当我们在 vscode 中点击状态栏中的 No Configure Preset Selected （如下图）

![Screenshot 2024-01-04 at 12.37.45](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/Screenshot%202024-01-04%20at%2012.37.45.png)

时，弹出的列表会是这样：

![Screenshot 2024-01-04 at 12.40.01](https://cdn.jsdelivr.net/gh/hzimg/blog-pics@master/uPic/Screenshot%202024-01-04%20at%2012.40.01.png)

你能看到 linux clang debug 出现在列表中。

而它的具体配置细节则由 use-clang 和 debug-build  这两个子集中的设定项来决定。

#### Full source

注意到图示中有更多的配置集出现在列表对话框zhong，那是因为我们还一股脑儿地添加了更多的配置。

所以完整的示例（`CMakePresets.json`）可以是这样：

```json
{
    "version": 6,
    "cmakeMinimumRequired": {
        "major": 3,
        "minor": 25,
        "patch": 0
    },
    "configurePresets": [
        {
            "name": "use-ninja",
            "hidden": true,
            "generator": "Ninja",
            "cacheVariables": {
                "CMAKE_EXPORT_COMPILE_COMMANDS": "ON"
            }
        },
        {
            "name": "default-build-dir",
            "hidden": true,
            "binaryDir": "${sourceDir}/build"
        },

        {
            "name": "debug-build",
            "hidden": true,
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Debug",
                "USE_DEBUG_OUTPUT": "ON",
                "USE_LOG": "ON",
                "USE_LOG_SEVERITY": "0"
            }
        },
        {
            "name": "release-build",
            "hidden": true,
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Release",
                "USE_DEBUG_OUTPUT": "OFF",
                "USE_LOG": "OFF"
            }
        },
        {
            "name": "release-with-min-size-build",
            "hidden": true,
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "MinSizeRel",
                "USE_DEBUG_OUTPUT": "OFF",
                "USE_LOG": "OFF"
            }
        },
        {
            "name": "release-with-debug-build",
            "hidden": true,
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "RelWithDebInfo",
                "USE_DEBUG_OUTPUT": "OFF",
                "USE_LOG": "OFF"
            }
        },

        {
            "name": "use-clang",
            "hidden": true,
            "inherits": [
                "default-build-dir",
                "use-ninja"
            ],
            "cacheVariables": {
                "CMAKE_C_COMPILER": "clang",
                "CMAKE_CXX_COMPILER": "clang++",
                "CMAKE_CXX_FLAGS": "-stdlib=libc++",
                "CMAKE_EXE_LINKER_FLAGS": "-stdlib=libc++",
                "CMAKE_SHARED_LINKER_FLAGS": "-stdlib=libc++"
            }
        },
        {
            "name": "use-gcc",
            "hidden": true,
            "inherits": [
                "default-build-dir",
                "use-ninja"
            ],
            "cacheVariables": {
                "CMAKE_C_COMPILER": "gcc",
                "CMAKE_CXX_COMPILER": "g++"
            }
        },
        {
            "name": "use-msvc-cl",
            "hidden": true,
            "inherits": [
                "default-build-dir",
                "use-ninja"
            ],
            "cacheVariables": {
                "CMAKE_C_COMPILER": "cl",
                "CMAKE_CXX_COMPILER": "cl"
            }
        },
        {
            "name": "use-msvc-clang-cl",
            "hidden": true,
            "inherits": [
                "default-build-dir",
                "use-ninja"
            ],
            "cacheVariables": {
                "CMAKE_C_COMPILER": "clang-cl",
                "CMAKE_CXX_COMPILER": "clang-cl"
            }
        },
        {
            "name": "linux-clang-debug",
            "displayName": "Linux clang debug",
            "inherits": [
                "use-clang",
                "debug-build"
            ]
        },
        {
            "name": "linux-clang-release",
            "displayName": "Linux clang release",
            "inherits": [
                "use-clang",
                "release-build"
            ]
        },
        {
            "name": "linux-gcc-debug",
            "displayName": "Linux gcc debug",
            "inherits": [
                "use-gcc",
                "debug-build"
            ]
        },
        {
            "name": "linux-gcc-release",
            "displayName": "Linux gcc release",
            "inherits": [
                "use-gcc",
                "release-build"
            ]
        },
        {
            "name": "windows-arch-x64",
            "hidden": true,
            "architecture": {
                "value": "x64",
                "strategy": "external"
            },
            "toolset": {
                "value": "host=x64",
                "strategy": "external"
            }
        },
        {
            "name": "windows-default",
            "displayName": "Windows x64 Debug",
            "hidden": true,
            "inherits": [
                "use-msvc-cl",
                "windows-arch-x64"
            ],
            "vendor": {
                "microsoft.com/VisualStudioSettings/CMake/1.0": {
                    "hostOS": [
                        "Windows"
                    ]
                }
            }
        },
        {
            "name": "windows-debug",
            "displayName": "Windows x64 Debug",
            "inherits": [
                "windows-default",
                "debug-build"
            ]
        },
        {
            "name": "windows-release",
            "displayName": "Windows x64 Release",
            "inherits": [
                "windows-default",
                "release-build"
            ]
        },
        {
            "name": "ci-options",
            "hidden": true,
            "cacheVariables": {
                "BUILD_TESTING": "ON",
                "BUILD_DEMO_VIEWER": "OFF",
                "DISABLE_OPTIMIZING": "ON"
            },
            // "toolchainFile": "vcpkg/scripts/buildsystems/vcpkg.cmake"
        },
        {
            "name": "windows-ci",
            "description": "used by the ci pipeline",
            "inherits": [
                "windows-release",
                "ci-options"
            ],
            "cacheVariables": {
                "INSTALL_DEPENDENCIES": "ON",
                "ADDITIONAL_LIBARIES_PATHS": "${sourceDir}/build/vcpkg_installed/x64-windows/bin"
            },
            "environment": {
                "PROJ_LIB": "${sourceDir}/build/vcpkg_installed/x64-windows/share/proj"
            }
        },
        {
            "name": "linux-ci",
            "description": "used by the ci pipeline",
            "inherits": [
                "release-with-debug-build",
                "use-gcc",
                "ci-options"
            ],
            "cacheVariables": {
                "CMAKE_CXX_FLAGS": "--coverage"
            },
            "environment": {
                "PROJ_LIB": "${sourceDir}/build/vcpkg_installed/x64-linux/share/proj"
            }
        },
        {
            "name": "linux-ci-release",
            "description": "used by the ci pipeline for releasing",
            "inherits": [
                "release-build",
                "linux-gcc-release"
            ],
            "cacheVariables": {
                "BUILD_TESTING": "OFF",
                "BUILD_DEMO_VIEWER": "OFF",
                "USE_MEMORY_MAPPED_FILE": "ON"
            }
        },
        {
            "name": "macos-ci",
            "description": "used by the ci pipeline",
            "inherits": [
                "use-ninja",
                "default-build-dir",
                "debug-build",
                // "release-with-debug-build",
                "ci-options"
            ],
            "cacheVariables": {
                "CMAKE_CXX_FLAGS": "-fprofile-arcs -ftest-coverage"
            },
            "environment": {
                "PROJ_LIB": "${sourceDir}/build/vcpkg_installed/x64-osx/share/proj"
            }
        },

        {
            "name": "Debug",
            "description": "general debug building",
            "inherits": [
                "use-ninja",
                "debug-build",
                "default-build-dir",
                "ci-options"
            ],
            "cacheVariables": {
            },
            "environment": {
                "PROJ_LIB": "${sourceDir}/build/vcpkg_installed/x64-osx/share/proj"
            }
        }
    ],
    "buildPresets": [
        {
            "name": "windows-debug",
            "configurePreset": "windows-debug"
        },
        {
            "name": "windows-release",
            "configurePreset": "windows-release"
        },
        {
            "name": "linux-clang-debug",
            "configurePreset": "linux-clang-debug"
        },
        {
            "name": "linux-clang-release",
            "configurePreset": "linux-clang-release"
        },
        {
            "name": "linux-gcc-debug",
            "configurePreset": "linux-gcc-debug"
        },
        {
            "name": "linux-gcc-release",
            "configurePreset": "linux-gcc-release"
        },
        {
            "name": "windows-ci",
            "configurePreset": "windows-ci"
        },
        {
            "name": "linux-ci",
            "configurePreset": "linux-ci"
        },
        {
            "name": "linux-ci-release",
            "configurePreset": "linux-ci-release"
        },
        {
            "name": "macos-ci",
            "configurePreset": "macos-ci"
        },
        {
            "name": "Debug",
            "configurePreset": "Debug"
        }
    ],
    "testPresets": [
        {
            "name": "test-default",
            "hidden": true,
            "output": {
                "outputOnFailure": true
            },
            "execution": {
                "noTestsAction": "error",
                "stopOnFailure": false
            }
        },
        {
            "name": "windows-ci",
            "configurePreset": "windows-ci",
            "inherits": [
                "test-default"
            ]
        },
        {
            "name": "linux-ci",
            "configurePreset": "linux-ci",
            "inherits": [
                "test-default"
            ]
        },
        {
            "name": "macos-ci",
            "configurePreset": "macos-ci",
            "inherits": [
                "test-default"
            ]
        },
        {
            "name": "Debug",
            "configurePreset": "Debug",
            "inherits": [
                "test-default"
            ]
        }
    ]
}
```

这是一个充分完整的实例。

你可以注意到实际上每个 sections（configurePresets，buildPresets，...），都支持利用 hidden 的方式来定义子集，然后通过组合子集的方式来构成多维度的风味矩阵。

通过这种方式，我们可以设计出超级复杂的构建配置集合。尽管复杂的构建配置总归是一种灾难，但事实就是越是疯狂离谱的需求，越是会在你的职业生涯中出现。所以我们寻找工具时总是应该是“无论我要不要，你得要有”，或者我们设计工具时也都应该是“无论 somebody 要不要，我总是要有”。







## 后记

放飞自我时间到！

新年了，又老了一岁。以下省略万多字……



### REFs

- [cmake-presets(7) — CMake 3.28.1 Documentation](https://cmake.org/cmake/help/latest/manual/cmake-presets.7.html) 



🔚