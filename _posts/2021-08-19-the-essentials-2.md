---
layout: single
title: "Windows Server 2019 安装提要 (及 VS 2019 Build Tool) - Part 2"
date: 2021-08-19 05:15:00 +0800
last_modified_at: 2021-08-19 20:00:00 +0800
Author: hedzr
tags: [windows server, windows server 2019, server core, desktop experience, install, setup, remote desktop, computer name, hostname, file sharing, net use, visual studio 2019 build tool, vs2019 build tool, devops]
categories: devops windows
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/1*Po9vJ6BTPdhvdhO6YuZQHg.png
  overlay_image: /assets/images/windows-server-2019.png
  overlay_filter: rgba(48, 48, 64, 0.86)
excerpt: "Windows Server 2019 (Core, Desktop Expirience, ...) 安装提要，以及 Visual Studio 2019 Build Tool 安装提要..."

---



## The Essentials: After Windows Server 2019 Evaluation Installed - PART II

上一次写了 [Windows Server 2019 安装提要 (及 VS 2019 Build Tool)](https://hedzr.com/devops/windows/the-essentials/)，然后描述了基本的安装后配置工作。不过这离我的目标——一个轻量级（22GB之轻）的 MSVC 构建环境——还差得远。

所以继续追加配置过程中遇到的问题。如下。







## 安装后提要



### 安装 Chocolatey

安装 Chocolatey：

```
powershell Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1')) 
```

chocolatey 是一个命令行的包管理器。像 apt。

在 choco 官方的软件仓库页面可以查找特定的软件包：[https://chocolatey.org/packages](https://chocolatey.org/packages) 。



### 安装 nano 编辑器

用惯了命令行中的简易编辑器，nano 可以满足多数的轻量级编辑需求。

安装它：

```powershell
choco install -y nano
```

然后可以在命令行中直接 `nano 1.txt`。





### 修订环境变量

在 Server Core 的命令行界面中，你默认处于 cmd 提示符下，可以输入命令 “powershell” 来进入到 PowerShell 提示符模式。

在 cmd 提示符中，`set` 和 `set PATH` 依旧有效，可以用来显示全部或指定的环境变量，`set PATH="%PATH%;xxx"` 可以设置环境变量。

官方对此有说明：[关于环境变量 - PowerShell - Microsoft Docs](https://docs.microsoft.com/zh-cn/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.1) 



#### 永久修订环境变量

为了永久性地修改环境变量，需要利用 PowerShell 中提供的 `Set-ItemProperty` 接口。

> 如果你真的对 cmd 提示符下的永久修改环境变量感兴趣，查看 SETX 命令的参考：
>
> ```powershell
> setx /?
> ```
>
> 有时候，你会发现，万能的重启非常有用：`shutdown -r -f`。
>
> 幸好 server core 的重启往往非常快，至少是足够快了。



##### 辅助函数

在 powershell 环境中，可以添加一组函数来简化环境变量的修订工作。首先进入到 PowerShell 提示符，然后粘贴下面的脚本：

```powershell
function get_path () {
  $val = Get-ItemProperty -Path HKCU:\Environment -Name Path
  $val.path.Split(';')
  # Write-Host $val.Replace(";","`n") -ForegroundColor Green
}
function set_path ($new_path) {
  Set-ItemProperty -Path HKCU:\Environment -Name path -Value $new_path
  Write-Host "The operation completed successfully.`n" -ForegroundColor Green
}
function add_path ($path) {
  $val = Get-ItemProperty -Path HKCU:\Environment -Name path
  $new_path = $val.path + ";" + $path.Trim()
  Set-ItemProperty -Path HKCU:\Environment -Name path -Value $new_path
  Write-Host "The operation completed successfully.`n" -ForegroundColor Green
}
function del_path ($path) {
  $path = ';' + ($path.Trim() -replace "\\","\\")
  $val = Get-ItemProperty -Path HKCU:\Environment -Name Path
  $old_path = $val.path
  $flag = 0
  
  # if the argument $path ends with a slash
  if ($path.endswith("\\")) {
  	# if the path in the registry ends with a slash
	  if ($old_path -match $path) {
  		$new_path = $old_path -replace $path,""
		  Set-ItemProperty -Path HKCU:\Environment -Name Path -Value $new_path
		  $flag = 1
  	}
  	# if the path in the registry does not end with a slash
	  else {
  		$path = $path.Substring(0,$path.LastIndexOf('\') - 1)
		  if ($old_path -match $path) {
			  $new_path = $old_path -replace $path,""
			  Set-ItemProperty -Path HKCU:\Environment -Name Path -Value $new_path
			  $flag = 1
		  }
  	}
  }
  # if the argument $path does not end with a slash
  else {
	  # if the path in the registry ends with a slash
  	$path += "\\"
	  if ($old_path -match $path) {
  		$new_path = $old_path -replace $path,""
		  Set-ItemProperty -Path HKCU:\Environment -Name Path -Value $new_path
		  $flag = 1
	  }
  	else {
		  # if the path in the registry does not end with a slash
		  $path = $path.Substring(0,$path.LastIndexOf('\') - 1)
		  if ($old_path -match $path) {
			  $new_path = $old_path -replace $path,""
			  Set-ItemProperty -Path HKCU:\Environment -Name Path -Value $new_path
			  $flag = 1
  		}
  	}
  }

  if ($flag) {
	  Write-Host "The operation completed successfully.`n" -ForegroundColor Green
  }
  else {
  	Write-Host "The operation failed.`n" -ForegroundColor Red
  }
}
```

就可以得到四个辅助函数。

- `Get_path` 可以显示 PATH 的当前值；
- `set_path "new_path_value"` 和 `add_path "append_text"` 可以设置 PATH 值；
- `del_path "a_path_part"` 可以删除一个 PATH 片段，PATH 变量的值是用分号分隔的多个片段。



##### 将上述辅助函数永久化

在 cmd 提示符环境中，通过 nano 编辑文件 `%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`，并将上面的代码追加到该文件中，以后每次启动 PowerShell，这几个辅助函数都将会自动生效了。





### 安装 vscode

一般来说，nano 可以满足我们的大量幻想。不过我们还可以有更神奇的选择，在 Server Core 中安装 Visual Studio Code，它不香吗！

去[官网下载](https://code.visualstudio.com/docs/?dv=win64user)安装包，然后在服务器上执行该安装包。

例如：

```powershell
curl -UseBasicParsing -Uri "https://code.visualstudio.com/sha/download?build=stable&os=win32-x64-user" -OutFile "vscode-user-setup-x64.exe"
.\vscode-user-setup-x64.exe
```

注意在 powershell 环境中，curl 实际上是 Invoke-WebRequest 的别名。如果你想查阅可用的命令行参数的话，使用“Invoke-WebRequest -?”。

> 如果你想要使用 GNU 的 curl 或者 wget，可以通过 chocolatey 方式安装它们。

如果你想要为所有用户安装 Visual Studio Code，下载安装包时注意选择 System Installer。

> 参考（仅用做记录）：
>
> `$Env:Path += "$Env:UserProfile\AppData\Local\Programs\Microsoft VS Code"`
>
> "c:\Program Files (x86)\Microsoft Visual Studio\Installer"

#### GUI？

在 server core 环境中，的的确确是可以安装 Visual Studio Code 的，它的运行有一点点仿佛的不同，但你应该是觉察不到的，

你可能会像我一样遇到没有文件对话框的问题。也就是说，在 vscode 窗口里 File Open 菜单命令是无响应的。但这难不倒我们，在 cmd 提示符中用 `code 1.txt` 发起 vscode 编辑器就可以了。

例如这里：

![image-20210819195640123](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210819195640123.png)

康康，它确实能够工作，对于长期在 bash 环境中的人来说，这特么真的不合理，但又合理的很，不是吗？



### 安装 git

首先你需要下载 git for win 的安装包：[这里](https://git-scm.com/download/win)。

在 Server Core 中可以直接运行安装包，有点违和（对于 SSH 惯了的人）但是行得通：

![image-20210819155813960](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20210819155813960.png)

#### posh-git

posh-git 是一组整合脚本，帮助你在 powershell 环境中更好滴使用 git 命令行，例如自动补全什么的。

可以通过 PowerShell 来安装 posh-git 模块，它的背后是通过 nuget 方式达成的：

```powershell
Install-Module posh-git -Scope AllUsers -Force

```

如果只是想安装到当前用户，将 `AllUsers` 改为 `CurrentUser` 即可。

以上方式来自于  [Git - Git in PowerShell](https://git-scm.com/book/en/v2/Appendix-A%3A-Git-in-Other-Environments-Git-in-PowerShell) 





## 和 Visual Studio 2019 Build Tool 有关的

首先，在 Server Core 中安装了 VSBT 工具之后，环境变量并不会得到更新。你需要执行 VS 的 LaunchDevCmd.bat 来进入到 VSBT 的工作环境。

在工作环境中，什么 cmake，cl，dotnet，nmake，msbuild 等等等才会有效。

问题在于，LaunchDevCmd.bat 是隐藏的非常深的。它在 `C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\Common7\Tools` 之中，这对于命令行环境来说，绝对是超级崩溃的长文件名了。

所以你可以考虑在 PATH 环境变量中追加该路径，例如：`SETX PATH "%PATH%;C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\Common7\Tools"`

然后就可以直接键入 `LaunchDevCmd.bat` 来进入到 VSBT 的构建环境了。

### vcpkg

为了安装一些公开的源码包，还需要 vcpkg 就绪。它的安装很简单（参考其[官网](https://vcpkg.io/en/getting-started.html)）：

```powershell
cd %USERPROFILE%\
mkdir work
cd work
git clone https://github.com/Microsoft/vcpkg.git
.\vcpkg\bootstrap-vcpkg.sh
```

等到它构建完了，就可以运行它了：

```powershell
%USERPROFILE%\work\vcpkg\vcpkg list
%USERPROFILE%\work\vcpkg\vcpkg install yaml-cpp
```

在我们的源码开发中，cmake 构建流程需要注入 vcpkg 控制文件：

```bash
# configure
cmake -DENABLE_AUTOMATE_TESTS=OFF -S . -B build/ -DCMAKE_TOOLCHAIN_FILE=%USERPROFILE%/work/vcpkg/scripts/buildsystems/vcpkg.cmake

# build
cmake --build build/
# install
cmake --build build/ --target install
```

默认时，vcpkg 下载并安装代码库的 x86 版本，为了编译和安装 64 位的二进制版本，需要设置如下的系统环境变量：

```bash
VCPKG_DEFAULT_TRIPLET=x64-windows
```



如上



## 🔚

暂时写这么多。

