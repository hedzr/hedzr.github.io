---
layout: single
title: 'Golang Testing 概览 - 深入篇'
date: 2020-10-17 14:08:00 +0800
last_modified: 2020-10-18 12:21:00 +0800
Author: hedzr
tags: [testing, tests, golang]
categories: golang testing
comments: true
toc: true
header:
  overlay_image: /assets/images/unsplash-image-10.jpg
  overlay_filter: rgba(128, 128, 0, 0.3)
excerpt: >-
  Golang Testing 概览，适合入门级欲进一步者，此乃深入篇 ...

#  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
#  actions:
#    - label: "More Info"
#      url: "https://unsplash.com"
---







本系列文章计划是回顾以下 Golang 中与测试相关的各种话题，并对这些内容进行一个浓缩后的概括，同时也提出一些笔者多年来从事开发的经验。

不过，Tips 或 Tricks 都是术的层面的问题，要想在开发方面技近乎道，仅仅是收集技巧是没有用处的。

当然目前来讲，我还没有可能性去讲述道的问题，所以近期我会做的事都会是技巧层面的内容，时时刻刻都会注意不要越过雷池。也希望阅读者不要期望太高，这里都不会讲什么高深的东西，当然也不可能有什么学了就成为高手的东西。

本系列的话题是 Go Testing，准备分为两块来作一个回顾，一是[基本篇](../golang-testing-1/)，大抵是一线开发天天该要面临的那些内容的一个回顾，我觉得这有助于你的反思，有时候不是我的文章有多好，而是它让你有机会能够去想一想，这就是它了。二来呢是一个[深入篇](../golang-testing-2)，会对一些相对不常见或不常用的例如集成测试等话题作一些浅层次的探讨，敬请期待。





## 深入篇



### 测试用例的几种方式

编写测试用例，可以有几种不同的方式，它们实际上各自有其目的。

#### 包外测试

所谓包外测试，是指你的 yy/xx_test.go 文件采用 `yy_test` 的包名而不是 `yy` 作为其包名。

由于包名命名的不同，在你的测试文件中只能调用待测试包的外部函数（已导出的）。

作为一名已经对测试技术有较多了解的你来讲，采用这种方法主要是为了如下的目的：

- 身为库作者，对自己暴露的API（已导出的函数）进行验证，确保他们的行为符合自己的设计目标。
- 身为高级程序员，对所在的包进行黑盒测试，确认该包的行为如同其描述（通常，请参考 go_doc 文档来了解该包的行为）。



```go
package yy_test

func TestOne(t *testing.T) {
  if yy.Factorial(3) != 6 {
    t.Fatal("bad")
  }
}
```





#### 包内测试

所谓包内测试，是指你的 yy/xx_test.go 文件采用 `yy` 作为其包名，和待测试包处于同一包名字空间中。

这样做的一大好处在于，你可以针对包内的各种具体实现函数们进行覆盖测试，这对于找到问题分支语句块，找到疑似不稳固的代码段是有很大好处的。

对于那些做 coverage 测试有执念的人来说，没有包内测试的话，白盒测试做不了，覆盖率无法超过 90% ，这是绝对不能忍的状况。不过有了包内测试能力的你，这一切就不再是个问题了。



```go
package yy

func TestTwo(t *testing.T) {
  if factorial(1, 3) != 6 {
    t.Fatal("bad")
  }
}
```





#### 混合包内包外测试

对于有执念的人来说，一切包内测试都显得那么的低级。然而此时他们如何解决覆盖率问题呢？单靠代码书写技巧、重整是无法解决分支覆盖的问题的。此时需要一个辅助的手段，例如对于 `yy` 包的测试来说：

1. 建立一个名为 `export_test.go` 的文件，采用相同的包名 `yy`
2. 在该文件中编写中间性的导出函数，为那些包内的函数实现建立一份导出版本
3. 由于 Golang 的编译器设定，这些导出版本的函数并不会出现在给予第三方使用者的接口 API 中
4. 但他们可以被用于 `yy_test` 包中的测试用例。

例如：

```go
package yy

func ExportedFactorial(accumulator, val int) int {
  return factorial(accumulator, val)
}
```

所以：

```go
package yy_test

func TestThree(t *testing.T) {
  if ExportedFactorial(1, 3) != 6 {
    t.Fatal("bad")
  }
}
```



#### 小结

你可能会想到，既然包内测试能够将一切函数（无论有否导出）都给测试了，我全都写 `yy` 的包名就好了，为什么要分来分去的呢？

我们首先应该强调，不论你是不是在开源一个三方库，也不论这段实现需不需要被考核KPI，也不论考核它还能检查到我的包名字不成，作为一种良好的习惯来说，对于你实现的一组代码，你还是有必要从内外不同的途径去观察它的。这就是包内和包外测试代码编写的必要性。

当你认真研究过自己导出的 API 的使用方法之后，也即调用者怎么运用你的 API，你才会发现自己的 API 原来是那么笨拙、不好用，调用语法罗嗦难看。实际上，包外测试方式可以让你自己吃下这坨 shit，然后自己自觉地去擦干净，所以它真的是有用的。

作为库作者，我往往是先做出外部测试代码，然后再去研究实现问题，我认为这种思考顺序有助于你向同伴们提供良好的接口。





### 综合测试

在 Golang 中对于综合测试的支持[^30] 相对较少。

综合测试在其他开发语言支持中多半被称作集成测试（Integration testing）[^31]。

[^30]: [Understanding Unit and Integration Testing in Golang. / by victor steven / Medium](https://medium.com/@victorsteven/understanding-unit-and-integrationtesting-in-golang-ba60becb778d) 
[^31]: [Integration testing - Wikipedia](https://en.wikipedia.org/wiki/Integration_testing) 



#### 如何展开自己的集成测试

##### 使用 TestMain

Golang 的测试工具提供了一套测试机制，其中有一点，一个名为 TestMain 的用户代码将会被首先执行于整个测试流程中。通过这一机制，你可以为集成测试做数据集准备或者类似的其它准备，诸如依赖服务的 mock，上下文的建立等等。

值得注意的是，如果你声明了 TestMain 函数，你必须在 TestMain 中明确地调用 m.Run，它保证了你的包中的所有测试用例将被依次进行调用。

```go
func TestMain(m *testing.M) {
  // setup codes ...

  // call flag.Parse() here if TestMain uses flags
	
  exitCode := m.Run()
  
  // tear-down codes ...
  
  os.Exit(exitCode)
}
```



##### 其它的工程中方案

在真实的场景中，我们可能会并不真的采用 TestMain 这样的机制：

1. 使用测试工作区

   大型业务系统往往会切分 生产环境、预配置和测试环境（Staging）和开发环境，所以集成测试是通过在 Staging 工作区中运行来实施的，这往往需要你针对 Staging 工作区进行必要的控制或为其编写一定的脚本，但由于它通常与具体场景有关，所以你需要和相应的 DevOps 管理员对接，至于在 Golang 层面的适配工作反而已经是次要问题了。

2. 使用 Docker 以及 Docker Compose[^40]

   通过 Docker Service Stack 层或者 Docker Compose 脚本，我们可以很容易地搭建一整套服务栈，对于使用本地服务器甚至是开发机的开发员可以借助这个方式建立自己的集成测试服务栈，在跑 Golang 的测试之前运行该服务栈即可。

   这个方式可以通过 docker compose 方式运行一个专用的数据集初始化容器，从而自动创建所需的测试数据集，而且很容易复原测试数据集，尤其便于反复测试。[^41]

   由于该方式涉及到的是 Docker 相应的开发方向，故而此处不再给出实例、也不做深入探讨。如果想要进一步研究，可以参考 [Golang Integration Testing Made Easy](https://blog.gojekengineering.com/golang-integration-testing-made-easy-a834e754fa4c) [^42] 或 [Understanding Unit and Integration Testing in Golang.](https://medium.com/@victorsteven/understanding-unit-and-integrationtesting-in-golang-ba60becb778d) [^43]，它们给出了 Docker 方面的实例。

   > 至于我这边，很少采用这种方式，因为使用 Docker 方案避免不了虚拟机对磁盘空间的浪费，每天自动构建数百遍甚至数千遍时有时候可能是比较可怕的，无论是在工作机上还是服务器上，我并不喜欢这种方案，我也讨厌定时回收空间的提案，不是简明舒适的路子。

3. 使用子测试 - 详见下一节



[^40]: [Integration Testing in Go: Part I - Executing Tests with Docker](https://www.ardanlabs.com/blog/2019/03/integration-testing-in-go-executing-tests-with-docker.html) 
[^41]: [Integration Testing in Go: Part II - Set-up and Writing Tests](https://www.ardanlabs.com/blog/2019/10/integration-testing-in-go-set-up-and-writing-tests.html) 
[^42]: [Golang Integration Testing Made Easy / by Arie Ardaya Lizuardi / Sep, 2020 / Gojek Product + Tech](https://blog.gojekengineering.com/golang-integration-testing-made-easy-a834e754fa4c) 
[^43]: [Understanding Unit and Integration Testing in Golang. / by victor steven / Medium](https://medium.com/@victorsteven/understanding-unit-and-integrationtesting-in-golang-ba60becb778d) 



#### 子测试

自从 Go 1.7 起，go testing 支持子测试以及子基准测试。

```go
func TestFoo(t *testing.T) {
    // <setup code>
    t.Run("A=1", func(t *testing.T) { ... })
    t.Run("A=2", func(t *testing.T) { ... })
    t.Run("B=1", func(t *testing.T) { ... })
    // <tear-down code>
}
```

如示例代码，你可以通过 t.Run 启动一个子测试。你可以定义若干 `func testSub1(t *testing.T)` 这样的测试子用例，并在总控入口中以特定的命名（例如 `"A=1"`）来启动它们。命名的作用是为了便于筛选这些子测试用例：

```bash
$ go test -run ''      # 执行所有测试。
$ go test -run Foo     # 执行匹配 "Foo" 的顶层测试，例如 "TestFooBar"。
$ go test -run Foo/A=  # 对于匹配 "Foo" 的顶层测试，且其匹配 "A=" 的子测试。
$ go test -run /A=1    # 执行所有匹配 "A=1" 的子测试。
```

所以，示例中给出了一种筛选方案，但你可以使用别的方式来构造该名字。

注意仅当所有子测试运行完毕之后，父测试中的 t.Run 才会返回。所以上面的例子中，三个子测试将被依次执行 。



值得一提的是，子测试是可以继续嵌套的。所以你完全可以进一步地进行包装，使得多级的子测试能够符合业务逻辑组织地被组合起来用于测试。



此外，子测试也可以被用于并行场景：

```go
func TestGroupedParallel(t *testing.T) {
    for _, tc := range tests {
        tc := tc // capture range variable
        t.Run(tc.Name, func(t *testing.T) {
            t.Parallel()
            ...
        })
    }
}

func TestTeardownParallel(t *testing.T) {
    // This Run will not return until the parallel tests finish.
    t.Run("group", func(t *testing.T) {
        t.Run("Test1", parallelTest1)
        t.Run("Test2", parallelTest2)
        t.Run("Test3", parallelTest3)
    })
    // <tear-down code>
}
```

在这些例子中，所有子测试（特别是对第二个例子）之间是并行的，这种并行是由 t.Parallel() 宣告的。由于所有子测试都具有此宣告，所以 t.Run 是立即返回的。

但第二个例子向你演示来如何构造一个双层的子测试组，这个测试组的上层没有被并行，因此你可以顺理成章地加入 setup 以及 tear-down 代码，但该测试组的下层中多个子测试之间是并行的。





### 数据集准备

#### 手工准备

有时候我们需要编写必要的代码来建立数据集。例如对于典型的数据库操作包来说，下面的函数能够为其准备必要的基础数据。

SeedLists [^50]

```go
func SeedLists(dbc *sqlx.DB) ([]list.List, error) {
    now := time.Now().Truncate(time.Microsecond)

    lists := []list.List{
        {
            Name:     "Grocery",
            Created:  now,
            Modified: now,
        },
        {
            Name:     "To-do",
            Created:  now,
            Modified: now,
        },
        {
            Name:     "Employees",
            Created:  now,
            Modified: now,
        },
    }

    for i := range lists {
        stmt, err := dbc.Prepare("INSERT INTO list (name, created, modified) VALUES ($1, $2, $3) RETURNING list_id;")
        if err != nil {
            return nil, errors.Wrap(err, "prepare list insertion")
        }

        row := stmt.QueryRow(lists[i].Name, lists[i].Created, lists[i].Modified)

        if err = row.Scan(&lists[i].ID); err != nil {
            if err := stmt.Close(); err != nil {
                return nil, errors.Wrap(err, "close psql statement")
            }

            return nil, errors.Wrap(err, "capture list id")
        }

        if err := stmt.Close(); err != nil {
            return nil, errors.Wrap(err, "close psql statement")
        }
    }

    return lists, nil
}
```

SeedItems

```go
func SeedItems(dbc *sqlx.DB, lists []list.List) ([]item.Item, error) {
    now := time.Now().Truncate(time.Microsecond)

    items := []item.Item{
        {
            ListID:   lists[0].ID, // Grocery
            Name:     "Chocolate Milk",
            Quantity: 1,
            Created:  now,
            Modified: now,
        },
        {
            ListID:   lists[0].ID, // Grocery
            Name:     "Mac and Cheese",
            Quantity: 2,
            Created:  now,
            Modified: now,
        },
        {
            ListID:   lists[1].ID, // To-do
            Name:     "Write Integration Tests",
            Quantity: 1,
            Created:  now,
            Modified: now,
        },
    }

    for i := range items {
        stmt, err := dbc.Prepare("INSERT INTO item (list_id, name, quantity, created, modified) VALUES ($1, $2, $3, $4, $5) RETURNING item_id;")
        if err != nil {
            return nil, errors.Wrap(err, "prepare item insertion")
        }

        row := stmt.QueryRow(items[i].ListID, items[i].Name, items[i].Quantity, items[i].Created, items[i].Modified)

        if err = row.Scan(&items[i].ID); err != nil {
            if err := stmt.Close(); err != nil {
                return nil, errors.Wrap(err, "close psql statement")
            }

            return nil, errors.Wrap(err, "capture list id")
        }

        if err := stmt.Close(); err != nil {
            return nil, errors.Wrap(err, "close psql statement")
        }
    }

    return items, nil
}
```

Truncate

```go
func Truncate(dbc *sqlx.DB) error {
    stmt := "TRUNCATE TABLE list, item;"

    if _, err := dbc.Exec(stmt); err != nil {
        return errors.Wrap(err, "truncate test database tables")
    }

    return nil
}
```



[^50]:  [Integration Testing in Go: Part II - Set-up and Writing Tests](https://www.ardanlabs.com/blog/2019/10/integration-testing-in-go-set-up-and-writing-tests.html) 



#### 第三方库

有时候，何必自行手写呢？下面介绍一些第三方开源的 seeding 库，都可以用于数据集准备……（排名不分先后，自行鉴别）

##### nguyendangminh/seed

<https://github.com/nguyendangminh/seed>

提供数种数据库的数据集准备，例如 MySQL 的：

```go
package mytest

import (
	"testing"
    "database/sql"

	seedsql "github.com/nguyendangminh/seed/sql"
    _ "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
)

func InitMySQLDB() (*sql.DB, error) {
    return db, err := sql.Open("mysql", "user:password@tcp(localhost:3306)/dbname?multiStatements=true")
}

func TestDatabaseIntegration(t *testing.T) {
	db, err := InitMySQLDB()
	defer db.Close()

	// Seeding
	err = seedsql.SeedByFile(db, "/path/to/seed-file.sql")
	assert.NoError(t, err)

	// Your other tests belows

    seedsql.CleanByFile(db, "/path/to/cleanup-file.sql")
}
```



##### brianvoe/gofakeit

<https://github.com/brianvoe/gofakeit>

提供 fake 数据集，诸如 英文姓名、邮箱地址、电话、公司名称、邮政地址、信用卡号、职位名称、食品、颜色、小车车型、水果、啤酒、游戏、动物、……，当然，这些数据大都是伪造的，只是看起来和真的没有两样，用于压测或者早期原型开发实在是好用的不得了。

除了 golang 版本的 fake dataset 之外，也有一众的公共RESTful API接口提供相似的内容，这些就请自行寻找了。



##### Pallinder/go-randomdata

<https://github.com/Pallinder/go-randomdata>

和 gofakeit 类似，提供一大堆基础数据模拟值。

结构简单，很容易重用。



##### seed-data/seed-data

<https://github.com/seed-data/seed-data>

Seed-data 项目提供一整套前后端实现，并且提供 Docker 整合模式，因此很易于重用和部署。你完全可以藉此建立自己的 Fake Dataset Public API，所需的工作也只是收集数据集原始文本加上少量的代码适配工作。



##### Sendhil-Vel/Go_SeedDatabase_Website

<https://github.com/Sendhil-Vel/Go_SeedDatabase_Website>

这个项目和 seed-data 相似，但完成度不高。其优势在于只有 Go 后端，前端是通过 Golang 的 template/html 方式直接构造输出的，因而对于仅会 Go 后端开发的人来说不必研究太多的前端开发了。



##### seanbhart/seed

<https://github.com/seanbhart/seed>

太老了，现在看来不适用了，但其思路值得参考，所以列出来。







### 使用 Mock

暂略



### Web 测试（httptest）

相当多来自于 C++/Java 的程序员都会不由自主地感叹 Go 中的 http 包，它让我们在实现一个 http/http2 server 时前所未有地简便，并且具备了极高的定制特性。同样地，对于 http 库来讲，也有一个配套的 [httptest](https://golang.org/pkg/net/http/httptest/) [^60] 包，专用于 web server 的测试。

首先来讲，你要了解如何开发 Golang 中的 Web Server。通常这有两种选择，第一是纯标准库方式，直接使用 http 包提供的原生支持，缺点在于没有动态或者高级路由能力，需要自行展开，此外所有外围的实用特性都需要自行开发，无论是图片上传下载也好，Gzip 也好，还是 JWT 鉴权特性也好。第二种方法是采用第三方库，例如 Echo，Gin，Gorilla，httprouter 等等，这些三方库解决了原生标准库没有处理的问题，让你大多数情况下只需考虑直接实现 RESTful API 接口即可。

所以无论采用哪种方案，你的主要焦点在于 Handler，或者 Handler 的一些变形。

也因此上，我们进行相应测试的重点就在于测试这些 Handlers/HandlerFunc 。这些情况下，如果将整个 web 服务启动起来并编写一个 http client 的遍历器针对所有 API 的 urls 进行调用和检查结果，是一种方法，但却是一种有点沉重的方案。原因在于，业务系统的这样一个服务想要启动往往需要若干上下游公共设施的支持，或者是数据库、消息队列、Redis 服务，其它依赖微服务等等。所以，“干净”地、有效率地对 Handlers 们作单元测试是一种重要的手段，此时 httptest 就可以派上用场了。

对于 httptest 而言，它提供的接口无外乎 NewRequest，NewRecorder 等有限的几个。其用法可以在下面的例子中查证和利用。

假设我们有一个 RESTful API 服务器，提供了基本的健康检查接口：

```go
// handlers.go
package handlers

// e.g. http.HandleFunc("/health-check", HealthCheckHandler)
func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
    // A very simple health check.
    w.WriteHeader(http.StatusOK)
    w.Header().Set("Content-Type", "application/json")

    // In the future we could report back on the status of 
    // our DB, or our cache (e.g. Redis) by performing a 
    // simple PING, and include them in the response.
    io.WriteString(w, `{"alive": true}`)
}

// main.go
package main

import (
	"fmt"
	"github.com/hedzr/pools/ww/handlers"
	"log"
	"net/http"
)

func main() {
	http.Handle("/", &indexHandler{content: "hello world!"})
	http.HandleFunc("/health-check", handlers.HealthCheckHandler)
	log.Fatal(http.ListenAndServe(":8111", nil))
}

type indexHandler struct {
	content string
}

func (ih *indexHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	_, _ = fmt.Fprintf(w, ih.content)
}
```

对于上面这个简单的服务，我们的测试用例是这样的：

```go
// handlers_test.go
package handlers

import (
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestHealthCheckHandler(t *testing.T) {
    // Create a request to pass to our handler. We don't have any query parameters for now, so we'll
    // pass 'nil' as the third parameter.
    req, err := http.NewRequest("GET", "/health-check", nil)
    if err != nil {
        t.Fatal(err)
    }

    // We create a ResponseRecorder (which satisfies http.ResponseWriter) to record the response.
    rr := httptest.NewRecorder()
    handler := http.HandlerFunc(HealthCheckHandler)

    // Our handlers satisfy http.Handler, so we can call their ServeHTTP method 
    // directly and pass in our Request and ResponseRecorder.
    handler.ServeHTTP(rr, req)

    // Check the status code is what we expect.
    if status := rr.Code; status != http.StatusOK {
        t.Errorf("handler returned wrong status code: got %v want %v",
            status, http.StatusOK)
    }

    // Check the response body is what we expect.
    expected := `{"alive": true}`
    if rr.Body.String() != expected {
        t.Errorf("handler returned unexpected body: got %v want %v",
            rr.Body.String(), expected)
    }
}
```

这里的源码和测试用例来源于 <https://blog.questionable.services/article/testing-http-handlers-go/> [^61]，但也做了一点点完善。

实际上无需更多解释，你可以通过 `NewRequest` 构造自己的 HTTP 请求包，然后将已经实现的 HandlerFunc（即 `HealthCheckHandler`）用 httptest.NewRecorder 包装一下，以便能够压入所构造的请求包，从而取得相应的响应包，然后检查响应包的内容是否符合预期。

整个过程无需启动 Web Server，无需启动主程序，甚至根本就没有启动任何端口监听，所以这种方法相当有效地提高了测试效率。





[^60]: https://golang.org/pkg/net/http/httptest/
[^61]: <https://blog.questionable.services/article/testing-http-handlers-go/>





### 使用 go testing 的其它特性

#### 使用 t.Helper

`t.Helper()` 的作用是标记一个函数为测试辅助函数，这样的话，该函数将不会在测试日志输出文件名和行号信息时出现。当 go testing 系统在查找调用栈帧的时候，通过 Helper 标记过的函数将被略过，因此这有助于找到更确切的调用者及其相关信息。

这个函数的用途在于削减日志输出中（尤其是在打印调用栈帧信息时）的杂音。



#### 使用 t.Skip(...), t.Skipf(fmt, ...), t.SkipNow()

t.SkipNow() 标记当前测试函数已经被跳过了。

SkipNow 不但做了跳过标记，同时也通过 runtime.Goexit() 立即终止了当前测试用例的执行。





### 性能测试

性能测试也被称作基准测试，大体上包含着对特定目标进行性能评估的用意。

一个 Benchmark 测试用例总是具有如下的函数签名：

```go
func BenchmarkXxx(*testing.B)
```

所以，我们可以写一些简单的用例例如：

```go
func BenchmarkRandInt(b *testing.B) {
    for i := 0; i < b.N; i++ {
        rand.Int()
    }
}
```

运行结果通常像这样：

```bash
❯ go test -v -test.run '^Bench.*$' -test.bench '^Bench.*$' ./yy/
goos: darwin
goarch: amd64
pkg: github.com/hedzr/pools/yy
BenchmarkRandInt
BenchmarkRandInt-16     81169230                14.7 ns/op
PASS
ok      github.com/hedzr/pools/yy       2.198s

```

请注意，为了专跑这一个测试，我们需要将正则式同时赋给 -test.run 以及 -test.bench。

#### 进一步

编写一个性能测试的要点就在于 b.N 会随机地得到一个较大的整数值，我们需要利用这个数值来跑 N 遍目标测试，从而求得单独跑一遍目标测试的平均值。

你可以将目标测试初始化部分切割出来在循环外执行：

```go
func BenchmarkBigLen(b *testing.B) {
    big := NewBig()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        big.Len()
    }
}
```

如果这个初始化部分耗时可观的话，将其排除在性能测试循环体之外是符合我们的测试标的的。完成了初始化之后，我们可以通过 `b.ResetTimer()` 扣除掉这段时间，避免它影响测试结果。

#### 并行环境

你也可以为性能测试引入并行执行环境：

```go
func BenchmarkTemplateParallel(b *testing.B) {
    templ := template.Must(template.New("test").Parse("Hello, {{.}}!"))
    b.RunParallel(func(pb *testing.PB) {
        var buf bytes.Buffer
        for pb.Next() {
            buf.Reset()
            templ.Execute(&buf, "World")
        }
    })
}
```

这对于 `go test -cpu` 的场景是有用的，它可能模拟来真实的多核 CPU 运行环境以及 Go 协程调度场景，有助于你评估实践中的 CPU 消耗。



### 高级性能测试

go pprof 命令，可以帮助我们快速分析和定位诸如 CPU 消耗、内存分配以及阻塞问题。

不过这条命令已经超出了一般性的 go 测试的范畴了，所以笔者拟另文具述，如感兴趣不妨期待一下。







🔚