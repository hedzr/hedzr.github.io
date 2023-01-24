---
layout: single
title: "谈 C++17 里的 Memento 模式"
date: 2021-10-07 09:02:00 +0800
last_modified_at: 2021-10-17 11:00:00 +0800
Author: hedzr
tags: [c++,c++11,c++17,undo,memento pattern,design patterns,备忘录模式,设计模式]
categories: c++ algorithm
comments: true
toc: true
header:
  teaser: https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/image-20211017164237144.png
  overlay_image: /assets/images/3953273590_704e3899d5_m.jpg
  overlay_filter: rgba(16, 16, 32, 0.73)
excerpt: >-
  介绍备忘录模式及其 C++ 实作，介绍 undo-cxx 的实现...
---





> 备忘录模式：介绍相关概念并实现一个较全面的 Undo Manager 类库。

## Memento Pattern

### 动机

备忘录模式也是一种行为设计模式。它在 Ctrl-Z 或者说 Undo/Redo 场所中时最为重要，这里也是它的最佳应用场所。除此之外，有时候我们也可以称之为存档模式，你可以将其泛化到一切备份、存档、快照的场景里，例如 macOS 的 Time Machine。

Memento 之所以能成为一种 Pattern，就在于它已经将上述场景进行了抽象和掩盖。在这里讨论备忘录模式时一定需要注意到它作为一种设计模式所提供的最强大的能力：不是能够 Undo/Redo，而是能够掩盖细节。

当然要以文字编辑器的 Undo/Redo 场景为例来说明这一点：

Memento 模式会掩盖编辑器编辑命令的实现细节，例如编辑位置、键击事件、修改的文字内容等等，仅仅只是将它们打包为一条编辑记录总体地提供给外部。外部使用者无需了解所谓的实现细节，它只需要发出 Undo 指令，就能从编辑历史中抽出并回退一条编辑记录，从而完成 Undo 动作。

这就是理想中的 Memento 模式应该要达到的效果。

![dp-memento](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/dp-memento-3225977.png)



### 轻量的古典定义

上面提到的字处理器设计是较为丰满的案例。实际上多数古典的如 GoF 的 Memento 模式的定义是比较轻量级的，它们通常涉及到三个对象：

1. **originator :** 创始人通常是指拥有状态快照的对象，状态快照由创始人负责进行创建以便于将来从备忘录中恢复。
2. **memento :** 备忘录储存状态快照，一般来说这是个 POJO 对象。
3. **caretaker :** 负责人对象负责追踪多个 memento 对象。

它的关系图是这样的：

![img](https://raw.githubusercontent.com/hzimg/blog-pics/master/uPic/W3sDesign_Memento_Design_Pattern_UML.jpg)

> FROM: [Here](https://upload.wikimedia.org/wikipedia/commons/3/38/W3sDesign_Memento_Design_Pattern_UML.jpg)

一个略有调整的 C++ 实现是这样的：

```cpp
namespace dp { namespace undo { namespace basic {

  template<typename State>
  class memento_t {
    public:
    ~memento_t() = default;

    void push(State &&s) {
      _saved_states.emplace_back(s);
      dbg_print("  . save memento state : %s", undo_cxx::to_string(s).c_str());
    }
    std::optional<State> pop() {
      std::optional<State> ret;
      if (_saved_states.empty()) {
        return ret;
      }
      ret.emplace(_saved_states.back());
      _saved_states.pop_back();
      dbg_print("  . restore memento state : %s", undo_cxx::to_string(*ret).c_str());
      return ret;
    }
    auto size() const { return _saved_states.size(); }
    bool empty() const { return _saved_states.empty(); }
    bool can_pop() const { return !empty(); }

    private:
    std::list<State> _saved_states;
  };

  template<typename State, typename Memento = memento_t<State>>
  class originator_t {
    public:
    originator_t() = default;
    ~originator_t() = default;

    void set(State &&s) {
      _state = std::move(s);
      dbg_print("originator_t: set state (%s)", undo_cxx::to_string(_state).c_str());
    }
    void save_to_memento() {
      dbg_print("originator_t: save state (%s) to memento", undo_cxx::to_string(_state).c_str());
      _history.push(std::move(_state));
    }
    void restore_from_memento() {
      _state = *_history.pop();
      dbg_print("originator_t: restore state (%s) from memento", undo_cxx::to_string(_state).c_str());
    }

    private:
    State _state;
    Memento _history;
  };

  template<typename State>
  class caretaker {
    public:
    caretaker() = default;
    ~caretaker() = default;
    void run() {
      originator_t<State> o;
      o.set("state1");
      o.set("state2");
      o.save_to_memento();
      o.set("state3");
      o.save_to_memento();
      o.set("state4");

      o.restore_from_memento();
    }
  };

}}} // namespace dp::undo::basic

void test_undo_basic() {
    using namespace dp::undo::basic;
    caretaker<std::string> c;
    c.run();
}

int main() {
    test_undo_basic();
    return 0;
}
```

这个实现代码中对于负责人部分的职责进行了简化，将相当多的任务交给其他人去完成，目的是在于让使用者的编码能够更简单。使用者只需要像 `caretaker` 那样去操作 `originator_t<State>` 就能够完成 memento 模式的运用。





### 应用场景

简单的场景可以直接复用上面的 `memento_t<State>` 和 `originator_t<State>` 模板，它们虽然简易，但足以应付一般场景了。

抽象地看待 memento 模式，于一开始我们就提到了一切备份、存档、快照的场景里都可以应用 Memento 模式，所以总是不免会用复杂或者说通用的场景需求。这些复杂的需求就不是 memento_t 所能应付的了。

除了那些备份存档快照场景之外，有时候有的场景或许你并为意识到它们也可以以 memory history 的方式来看待。例如博客日志的时间线展示，实际上就是一个 memento list。

实际上，为了给你加深印象，在以类库开发为已任的生活中我们一般会用 undo_manager 这种东西来表达和实现通用型的 Memento 模式。所以顺理成章地，下面我们将尝试用 Memento 的理论来指导实作一个 undoable 通用型模板类。

Memento 模式通常并不能独立存在，它多半是作为 Command Pattern 的一个子系统（又或是并立而协作的模块）而存在的。

所以典型的编辑器架构设计里，总是将文字操作设计为 Command 模式，例如前进一个 word，键入几个字符，移动插入点到某个位置，粘贴一段剪贴板内容，等等，都是由一系列的 Commands 来具体实施的。在此基础上，Memento 模式才有工作空间，它将能够利用 EditCommand 来实现编辑状态的存储和重播——通过反向播放与重播一条（组）Edit Commands 的方式。



### Undo Manager

UndoRedo 模型原本是一种交互性技术，为用户提供反悔的能力，后来逐渐演变为一种计算模型。通常 Undo 模型被区分为两种类型：

1. 线性的
2. 非线性的

线性 Undo 是以 Stack 的方式实现的，一条新的命令被执行后就会被添加到栈顶。也因此 Undo 系统能够反序回退已经执行过的命令，且只能是依次反序回退的，所以这种方式实现的 Undo 系统被称作为线性的。

在线性 Undo 系统中还有严格线性模式一说，通常这种提法是指 undo 历史是有尺寸上限的，正如 CPU 体系中的 Stack 也是有尺寸限制的一个道理。在很多矢量绘图软件中，Undo 历史被要求设定为一个初值，例如 1 到 99 之间，如果回退历史表过大，则最陈旧的 undo 历史条目会被抛弃。

#### 非线性 Undo

非线性 Undo 系统和线性模型大体上是相似的，也会在某处持有一个已经执行的命令的历史列表。但不同之处在于，用户在使用 Undo 系统进行反悔时，他可以挑选历史列表中的某一命令甚至是某一组命令进行 undo，彷佛他并非执行过这些命令一样。

> Adobe Photoshop 在向操作员提供绘图能力的同时，就维护了一个几乎接近于非线性的历史记录操作表，并且用户能够从该列表中挑选一部分予以撤销/悔改。但 PS 平时在撤销某一条操作记录历史时，其后的更新的操作记录将被一并回退，从这个角度来看，它还只能算是线性的，只不过运行批处理 undo 罢了。
>
> 如果想要得到非线性撤销能力，你需要去 PS 的选项中启用“允许非线性历史记录”，这就不再提了。

事实上在交互界面上向用户提供非线性级别的 Undo/Redo 操作能力的应用，通常并没有谁能很**好**地支持。一个原因在于从历史表中抽取一条条目并摘除它，非常容易。但要将这条条目在文档上的效用抽出来摘除，那就可能是完全办不到。想象一下，如果你对 pos10..20 做了字体加粗，然后对 pos15..30 做了斜体，然后删除了 pos16..20 的文字，然后对 pos 13..17 做了字体加大，现在要摘掉对 pos15..30 做的斜体操作。请问，你能够 Undo 斜体操作这一步吗？显然这是相当有难度的：可以有很多中解释方法来做这笔摘除交易，它们或许都符合编辑者的预期。那个“**好**”，是个非常主观的评价级别。

当然啰，这也未必就是不能够实现，从逻辑上来说，单纯点，不就是倒退三步，放弃一条操作，然后重播（回放）后继的两条操作么，可能执行起来略有点费内存之外，也不见得一定会是多么难。

那么还得要有另外一个原因在于，很多交互性系统做非线性 Undo 的效果可能是用户难于脑力预判的，就如我们刚才举例的撤销斜体操作一样，用户既然无法预测单独撤销一条记录的后果，那么这个交互功能提供给他就事实上欠缺了意义——还不如让他逐步回退呢，这样他将能精确地把握自己的编辑效用的回退效力。

无论是谁最后有道理，都不重要，它们都不会影响到我们做出具备这样功能的软件实现。所以实际上有很多类库能够提供非线性 Undo 的能力，尽管它们可能并不会被用到某个真实的交互系统上。

此外，关于非线性 Undo 系统的论文也有一大把。充分地证明了论文这种东西，往往都是垃圾——人从出生以来到死去不就是以制造垃圾为己业的么。人类认为多么灿烂辉煌的文化，对于自然界和宇宙来说，恐怕真的是毫无意义的——直到未来某一天，人类或许能打破壁垒穿行到更高级别的宇宙，脱离与生俱来的本宇宙的藩篱的桎梏，那时候可能过往的一切才会体现出可能的意义吧。

好，无论宇宙怎么看，我，仍然认为现在我制造的新的 memento pattern 的 Non-linear Undo Subsystem 是有意义的，而且将会在下面给你做出展示来。:)



#### 进一步的分类

作为一个附加的思考，还可以对分类进一步做出组织。在前文的基本划分之上，还可以进一步做区分：

1. 有选择的 Undo
2. 可分组的 Undo

大体上，可选的 Undo 是非线性 Undo 的一种增强的操作体现，它允许用户在回退历史操作记录中勾选某些记录予以撤销。而可分租的 Undo 是指命令可以被分组，于是用户可能必需在已经被分组的操作记录上整体回退，但这会是 Command Pattern 要去负责管理的事情，只是在 Undo 系统上被体现出来而已。







### C++ 实现

Undo Manager 实现中，可以有一些典型的实现方案：

1. 将命令模式的每一条命令脚本化。这种方式会设立若干的检查点，而 Undo 时首先是退到某个检查点，然后将剩余的脚本重播一遍，从而完成撤销某条命令脚本的功能
2. 精简的检查点。上面的方法，检查点可能会非常消耗资源，所以有时候需要借助精致的命令系统设计来削减检查点的规模。
3. 反向播放。这种方式通常只能实现线性回退，其关键思想在于反向执行一条命令从而省去建立检查点的必要。例如最后一步是加粗了 8 个字符，那么 Undo 时就为这 8 个字符去掉粗体就行了。

但是，对于一个元编程实现的通用 Undo 子系统来说，上面提到的方案并不归属于 Undo Manager 来管理，它们是划归 Command Pattern 去管理的，并且事实上其具体实现由开发者自行完成。Undo Manager 只是负责 states 的存储、定位和回放等等事务。



#### 主要设计

下面开始真正介绍 [undo-cxx](https://github.com/hedzr/undo-cxx) 开源库的实现思路。



##### undoable_cmd_system_t

首先还是说主体 `undoable_cmd_system_t`，它需要你提供一个主要的模板参数 State。秉承 memento 模式的基本理论，State 指的是你的 Command 所需要保存的状态包，例如对于编辑器软件来讲，Command 是 FontStyleCmd，表示对选择文字设定字体样式，而相应的状态包可能就包含了对字体样式的最小描述信息（粗体、斜体等等）。

undoable_cmd_system_t 的宣告大致如下：

```cpp
template<typename State,
typename Context = context_t<State>,
typename BaseCmdT = base_cmd_t,
template<class S, class B> typename RefCmdT = cmd_t,
typename Cmd = RefCmdT<State, BaseCmdT>>
  class undoable_cmd_system_t;

template<typename State,
typename Context,
typename BaseCmdT,
template<class S, class B> typename RefCmdT,
typename Cmd>
  class undoable_cmd_system_t {
    public:
    ~undoable_cmd_system_t() = default;

    using StateT = State;
    using ContextT = Context;
    using CmdT = Cmd;
    using CmdSP = std::shared_ptr<CmdT>;
    using Memento = typename CmdT::Memento;
    using MementoPtr = typename std::unique_ptr<Memento>;
    // using Container = Stack;
    using Container = std::list<MementoPtr>;
    using Iterator = typename Container::iterator;

    using size_type = typename Container::size_type;
    
    // ...
  };

template<typename State,
typename Context = context_t<State>,
typename BaseCmdT = base_cmd_t,
template<class S, class B> typename RefCmdT = cmd_t,
typename Cmd = RefCmdT<State, BaseCmdT>>
  using MgrT = undoable_cmd_system_t<State, Context, BaseCmdT, RefCmdT, Cmd>;
```

可以看到，你所提供的 `State` 将被模板参数 Cmd 所使用：`typename Cmd = RefCmdT<State, BaseCmdT>`。

##### `cmd_t`

而 cmd_t 的宣告是这样的：

```cpp
template<typename State, typename Base>
class cmd_t : public Base {
  public:
  virtual ~cmd_t() {}

  using Self = cmd_t<State, Base>;
  using CmdSP = std::shared_ptr<Self>;
  using CmdSPC = std::shared_ptr<Self const>;
  using CmdId = std::string_view;
  CmdId id() const { return debug::type_name<Self>(); }

  using ContextT = context_t<State>;
  void execute(CmdSP &sender, ContextT &ctx) { do_execute(sender, ctx); }

  using StateT = State;
  using StateUniPtr = std::unique_ptr<StateT>;
  using Memento = state_t<StateT>;
  using MementoPtr = typename std::unique_ptr<Memento>;
  MementoPtr save_state(CmdSP &sender, ContextT &ctx) { return save_state_impl(sender, ctx); }
  void undo(CmdSP &sender, ContextT &ctx, Memento &memento) { undo_impl(sender, ctx, memento); }
  void redo(CmdSP &sender, ContextT &ctx, Memento &memento) { redo_impl(sender, ctx, memento); }
  virtual bool can_be_memento() const { return true; }

  protected:
  virtual void do_execute(CmdSP &sender, ContextT &ctx) = 0;
  virtual MementoPtr save_state_impl(CmdSP &sender, ContextT &ctx) = 0;
  virtual void undo_impl(CmdSP &sender, ContextT &ctx, Memento &memento) = 0;
  virtual void redo_impl(CmdSP &sender, ContextT &ctx, Memento &memento) = 0;
};
```

也就是说，State 将被我们包装之后在 undo 系统内部使用。

而你应该提供的 Command 类则应该从 cmd_t 派生并实现必要的纯虚函数（do_execute, save_state_impl, undo_impl, redo_impl 等等）。

##### 使用：提供你的命令

按照上面的宣告，我们可以实现一个演示目的的 Command：

```cpp
namespace word_processor {

  template<typename State>
  class FontStyleCmd : public undo_cxx::cmd_t<State> {
    public:
    ~FontStyleCmd() {}
    FontStyleCmd() {}
    explicit FontStyleCmd(std::string const &default_state_info)
      : _info(default_state_info) {}
    UNDO_CXX_DEFINE_DEFAULT_CMD_TYPES(FontStyleCmd, undo_cxx::cmd_t);

    protected:
    virtual void do_execute(CmdSP &sender, ContextT &) override {
      UNUSED(sender);
      // ... do sth to add/remove font style to/from
      // current selection in current editor ...
      std::cout << "<<" << _info << ">>" << '\n';
    }
    virtual MementoPtr save_state_impl(CmdSP &sender, ContextT &ctx) override {
      return std::make_unique<Memento>(sender, _info);
    }
    virtual void undo_impl(CmdSP &sender, ContextT &, Memento &memento) override {
      memento = _info;
      memento.command(sender);
    }
    virtual void redo_impl(CmdSP &sender, ContextT &, Memento &memento) override {
      memento = _info;
      memento.command(sender);
    }

    private:
    std::string _info{"make italic"};
  };
}
```

在真实的编辑器中，我们相信你有一个所有编辑器窗口的容器并且能跟踪到当前具有输入焦点的编辑器。

基于此，do_execute 应该是对当前编辑器中的选择文字做字体样式设置（如粗体），save_state_impl 应该是将选择文字的元信息以及 Command 的元信息打包到 `State` 中，undo 应该是反向设置字体样式（如去掉粗体），redo 应该是依据 memento 的 `State` 信息再次设置字体样式（粗体）。

> 但在本例中，出于演示目的，这些具体细节都被一个 _info 字符串所代表了。
>
> 尽管 FontStyleCmd 保留了 State 模板参数，但演示代码中 State 只会等于 std::string。



##### 使用：提供 UndoCmd 和 RedoCmd

为了定制你的 Undo/Redo 行为，你可以实现自己的 UndoCmd/RedoCmd。它们需要不同于 cmd_t 的特别的基类：

```cpp
namespace word_processor {
  template<typename State>
  class UndoCmd : public undo_cxx::base_undo_cmd_t<State> {
    public:
    ~UndoCmd() {}
    using undo_cxx::base_undo_cmd_t<State>::base_undo_cmd_t;
    explicit UndoCmd(std::string const &default_state_info)
      : _info(default_state_info) {}
    UNDO_CXX_DEFINE_DEFAULT_CMD_TYPES(UndoCmd, undo_cxx::base_undo_cmd_t);

    protected:
    void do_execute(CmdSP &sender, ContextT &ctx) override {
      std::cout << "<<" << _info << ">>" << '\n';
      Base::do_execute(sender, ctx);
    }
  };

  template<typename State>
  class RedoCmd : public undo_cxx::base_redo_cmd_t<State> {
    public:
    ~RedoCmd() {}
    using undo_cxx::base_redo_cmd_t<State>::base_redo_cmd_t;
    explicit RedoCmd(std::string const &default_state_info)
      : _info(default_state_info) {}
    UNDO_CXX_DEFINE_DEFAULT_CMD_TYPES(RedoCmd, undo_cxx::base_redo_cmd_t);

    protected:
    void do_execute(CmdSP &sender, ContextT &ctx) override {
      std::cout << "<<" << _info << ">>" << '\n';
      Base::do_execute(sender, ctx);
    }
  };
}
```

注意对于它们来说，相应的基类被限制为 base_(undo/redo)_cmd_t ，并且你必需在 do_execute 实现中包含到基类方法的调用，如同这样：

```cpp
    void do_execute(CmdSP &sender, ContextT &ctx) override {
      // std::cout << "<<" << _info << ">>" << '\n';
      Base::do_execute(sender, ctx);
    }
```

基类中有默认的实现，形如这样：

```cpp
    template<typename State, typename BaseCmdT,
             template<class S, class B> typename RefCmdT>
    inline void base_redo_cmd_t<State, BaseCmdT, RefCmdT>::
            do_execute(CmdSP &sender, ContextT &ctx) {
        ctx.mgr.redo(sender, Base::_delta);
    }
```

它实际上具体地调用 ctx.mgr，也就是 undoable_cmd_system_t 的 redo() 去完成具体的内务，类似的，undo 方面也有相似的语句。

---

undo/redo 的特殊之处在于它们的基类有特别的重载函数：

```cpp
	virtual bool can_be_memento() const override { return false; }
```

其目的在于不会考虑该命令的 memento 存档问题。

所以同时也注意 save_state_impl/undo_impl/redo_impl 是不必要的。



##### actions_controller

我们现在假定字处理器软件具有一个命令管理器，它同时也是命令动作的 controller，它将会负责在具体的编辑器窗口中执行一条编辑命令：

```cpp
namespace word_processor {

  namespace fct = undo_cxx::util::factory;

  class actions_controller {
    public:
    using State = std::string;
    using M = undo_cxx::undoable_cmd_system_t<State>;

    using UndoCmdT = UndoCmd<State>;
    using RedoCmdT = RedoCmd<State>;
    using FontStyleCmdT = FontStyleCmd<State>;

    using Factory = fct::factory<M::CmdT, UndoCmdT, RedoCmdT, FontStyleCmdT>;

    actions_controller() {}
    ~actions_controller() {}

    template<typename Cmd, typename... Args>
    void invoke(Args &&...args) {
      auto cmd = Factory::make_shared(undo_cxx::id_name<Cmd>(), args...);
      _undoable_cmd_system.invoke(cmd);
    }

    template<typename... Args>
    void invoke(char const *const cmd_id_name, Args &&...args) {
      auto cmd = Factory::make_shared(cmd_id_name, args...);
      _undoable_cmd_system.invoke(cmd);
    }

    void invoke(typename M::CmdSP &cmd) {
      _undoable_cmd_system.invoke(cmd);
    }

    private:
    M _undoable_cmd_system;
  };

} // namespace word_processor
```



##### 最后是测试函数

借助于改进过的工厂模式，controller 可以调用编辑命令，注意使用者在发出 undo/redo 时，controller 同样地通过调用 UndoCmd/RedoCmd 的方式来完成相应的业务逻辑。

```cpp
void test_undo_sys() {
  using namespace word_processor;
  actions_controller controller;

  using FontStyleCmd = actions_controller::FontStyleCmdT;
  using UndoCmd = actions_controller::UndoCmdT;
  using RedoCmd = actions_controller::RedoCmdT;

  // do some stuffs

  controller.invoke<FontStyleCmd>("italic state1");
  controller.invoke<FontStyleCmd>("italic-bold state2");
  controller.invoke<FontStyleCmd>("underline state3");
  controller.invoke<FontStyleCmd>("italic state4");

  // and try to undo or redo

  controller.invoke<UndoCmd>("undo 1");
  controller.invoke<UndoCmd>("undo 2");

  controller.invoke<RedoCmd>("redo 1");

  controller.invoke<UndoCmd>("undo 3");
  controller.invoke<UndoCmd>("undo 4");

  controller.invoke("word_processor::RedoCmd", "redo 2 redo");
}
```



#### 特性

在 undoable_cmd_system_t 的实现中，包含了基本的 Undo/Redo 能力：

- 无限制的 Undo/Redo
- 受限制的：通过 `undoable_cmd_system_t::max_size(n)` 限制历史记录条数

此外，它是全可定制的：

- 定制你自己的 State 状态包
- 定制你的 context_t 扩展版本以容纳自定义对象引用
- 如果有必要，你可以定制 base_cmd_t 或 cmd_t 来达到你的特别目的



##### 分组命令

通过基类 `class composite_cmd_t` 你可以对命令分组，它们在 Undo 历史记录中被视为单条记录，这允许你批量 Undo/Redo。

除了在构造时立即建立组合式命令之外，可以在 composite_cmd_t 的基础上构造一个 `class GroupableCmd`，很容易通过这个类提供运行时就地组合数条命令的能力，这样，你可以获得更灵活的命令组。



##### 受限制的非线性

通过批量 Undo/Redo 可以实现受限制的非线性 undo 功能。

`undoable_cmd_system_t::erase(n = 1)` 能够删除当前位置的历史记录。

你可以认为 undo i - erase j - redo k 是一种受限制的非线性 undo/redo 实现方式，注意这需要你进一步包装后再运用（通过为 UndoCmd/RedoCmd 增加 `_erased_count` 成员并执行 `ctx.mgr.erase(_erased_count)` 的方式）。

更全功能的非线性 undo 可能需要一个更复杂的 tree 状历史记录而不是当前的 list，尚须留待将来实现。



#### 小结

限于篇幅，不能完整介绍 [undo-cxx](https;//github.com/hedzr/undo-cxx) 的能力，所以感兴趣的小伙伴直接检阅 Github 源码好了。



## 后记

这一次的 Undo Manager 实现的尚未尽善尽美，以后再找机会改进吧。

参考：

- [Memento Pattern - Wiki](https://en.wikipedia.org/wiki/Memento_pattern)

过段时间再 review，就这么定了先。



:end:

