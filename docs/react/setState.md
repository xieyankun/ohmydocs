# setState状态更新控制机制分析

从开始学习和使用 React 以来，我一直认为setState是异步的，直到我看见这个。。。

![image](https://user-images.githubusercontent.com/18692722/43514947-e9a66810-95b3-11e8-9a51-f8a2b63d6a3d.png)

打印出来的结果，却和我所熟知的不一样。。。 为了弄清楚发生了什么，我读了下 React 关于这一部分的源码；

上面这个例子及我平时的使用，让我有了一个大概的判断：

- 在React 的合成事件中及钩子函数中，setState是异步的；
- 在 setTimeout 中setState是同步的；

经过几次的分析，我发现使用传统方式调用setState 时，传给 Component.setState 的参数 partialState是一个对象，这个对象包含有与组件的 state 中同名的属性，而属性值是更新过的， React只是控制了将这个新的属性值更新到 UI 的过程。

所以，我们就来看一下，不同使用场景下，react是如何控制代码执行顺序从而控制setState的同步异步的。

## 一、合成事件中的setState

借鉴如何阅读大型前端开源项目的源码 - 掘金中介绍的方法，我直接下载react 16.4.1的源码，执行 yarn build本地 build ，之后， 在fixtures/packaging/babel-standalone/中新建一个onClick.html,在里面做修改，打断点一步步查看发生了什么。
fixtures/packaging/babel-standalone/onClick.html 核心代码：

```javascript
<html>
  <body>
    <script src="../../../build/dist/react.development.js"></script>
    <script src="../../../build/dist/react-dom.development.js"></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.js"></script>
    <div id="container"></div>
    <script type="text/babel">
      class Counter extends React.Component{
        constructor(props){
          super(props);
          this.state = {count: 0};
        }
        increment = () => {
          this.setState({
            count: this.state.count + 1
          })
          console.log(this.state.count);
        }
        render(){
          return(
          <div>
            <button onClick={this.increment}>+</button>
            <div>{`Counter is: ${this.state.count}`}</div>
          </div>
          )
        }
      }
      ReactDOM.render(
        <Counter />,
        document.getElementById('container')
      );
    </script>
  </body>
</html>
```
在 `<button onClick={this.increment}>+</button>` 打断点，然后按

使用Chrome的调试工具进行单步调试跟踪React的代码执行过程

![](https://user-images.githubusercontent.com/18692722/43579504-ed711662-9684-11e8-8c7c-6bbf05beb52f.png)

`interactiveUpdates$1` 方法中,有四个控制代码走向的关键变量 `isBatchingInteractiveUpdate=false;`, `isBatchingUpdates=false;`,`isRendering=false;`, `lowestPendingInteractiveExpirationTime=0;`, `NoWork=0;` 两个 `if` 分支的代码未执行，然后改变了其中两个变量的值：`isBatchingInteractiveUpdates = true;`, `isBatchingUpdates = true;`, 之后进入 `try` 代码块去执行 `dispatchEvent;` 相关代码如下：

```javascript
function interactiveUpdates$1(fn, a, b) {
  if (isBatchingInteractiveUpdates) {
    return fn(a, b);
  }
  // If there are any pending interactive updates, synchronously flush them.
  // This needs to happen before we read any handlers, because the effect of
  // the previous event may influence which handlers are called during
  // this event.
  if (!isBatchingUpdates && !isRendering && lowestPendingInteractiveExpirationTime !== NoWork) {
    // Synchronously flush pending interactive updates.
    performWork(lowestPendingInteractiveExpirationTime, null);
    lowestPendingInteractiveExpirationTime = NoWork;
  }
  var previousIsBatchingInteractiveUpdates = isBatchingInteractiveUpdates;
  var previousIsBatchingUpdates = isBatchingUpdates;
  isBatchingInteractiveUpdates = true;
  isBatchingUpdates = true;
  try {
    return fn(a, b);
  } finally {
    isBatchingInteractiveUpdates = previousIsBatchingInteractiveUpdates;
    isBatchingUpdates = previousIsBatchingUpdates;
    if (!isBatchingUpdates && !isRendering) {
      performSyncWork();
    }
  }
}
```

从dispatchEvent到callCallback过程中的方法都是都合成事件的处理，从Component.setState到requestWork是setState的处理逻辑，在requestWork这个函数中，控制if分支的关键值为isRendering=false,isBatchingUpdates=true,isUnbatchingUpdates=false,致使这个函数直接 return 掉了，没有执行任何 React更新 UI 的方法；之后，代码继续执行 Counter._this.increment 中的剩余部分即console.log(this.state.count);所以我们打印出来的state是变化之前的值。之后再次调用 callCallback ，然后依次退出之前一些未执行完的关于合成事件处理的函数。

requestWork 代码如下：

```javascript
// requestWork is called by the scheduler whenever a root receives an update.
// It's up to the renderer to call renderRoot at some point in the future.
function requestWork(root, expirationTime) {
  addRootToSchedule(root, expirationTime);
  if (isRendering) {
    // Prevent reentrancy. Remaining work will be scheduled at the end of
    // the currently rendering batch.
    return;
  }
  if (isBatchingUpdates) {
    // Flush work at the end of the batch.
    if (isUnbatchingUpdates) {
      // ...unless we're inside unbatchedUpdates, in which case we should
      // flush it now.
      nextFlushedRoot = root;
      nextFlushedExpirationTime = Sync;
      performWorkOnRoot(root, Sync, true);
    }
    return;
  }
  // TODO: Get rid of Sync and use current time?
  if (expirationTime === Sync) {
    performSyncWork();
  } else {
    scheduleCallbackWithExpirationTime(expirationTime);
  }
}
```

处理合成事件的函数退出完毕后，代码来到dispatchEvent 中finally的 代码块和interactiveUpdates$1中 finally 的代码块 ,这时，isBatchingInteractiveUpdates,isBatchingUpdates被设置为 false ，从而performSyncWork()得以执行。performWorkOnRoot执行过程中会触发 render 函数，用新的属性值更新 state，生成虚拟 DOM，之后在commitAllHostEffects执行时将虚拟DOM 渲染为真实 DOM 。

## 二、生命周期中的setState

这里我们以 componentDidMount为例进行分析，在fixtures/packaging/babel-standalone/dev.html中添加componentDidMount：

```javascript
<html>
  <body>
    <script src="../../../build/dist/react.development.js"></script>
    <script src="../../../build/dist/react-dom.development.js"></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.js"></script>
    <div id="container"></div>
    <script type="text/babel">
      class Counter extends React.Component{
        constructor(props){
          super(props);
          this.state = {count: 0};
        }
        componentDidMount() {
          this.setState({
            count: this.state.count + 1
          })
          console.log(this.state.count);
        }
        render(){
          return(
            <div>{`Counter is: ${this.state.count}`}</div>
          )
        }
      }
      ReactDOM.render(
        <Counter />,
        document.getElementById('container')
      );
    </script>
  </body>
</html>
```

在componentDidMount处打断点，找到过程中调用的关键函数，然后分别在源码的对应函数打断点，这里我打了Component.prototype.setState、performSyncWork、commitRoot:
componentDidMount中执行 setState 更新 UI 的过程如下：

![](https://user-images.githubusercontent.com/18692722/43384215-ec6b7f86-940f-11e8-935f-6473a27bc855.png)

在第一次渲染完成后，react 进入生命周期函数，执行 Component.prototype.setState ，然后执行enqueueSetState对更新队列进行操作，但并没有把更新后的state 作用到 UI 上（没有更新到当前的实例上）。第一次渲染过程中，执行performWorkOnRoot函数时，会把isRender设置为 true, 所以requestWork在第一个 if 分支直接 return 后退出，enqueueSetState出栈,回到componentDidMount 执行 console.log部分的代码，所以此时拿到的state 还是更新前的值。

之后，回到commitRoot执行performWorkOnRoot，触发 render函数,更新 state，生成虚拟DOM，在commitAllHostEffects执行时将虚拟DOM 渲染为真实 DOM 。

performSyncWork后续函数执行过程中commitRoot是一个很关键的函数，它会先后重复调用commitBeforeMutationLifecycles、commitAllHostEffects、commitAllLifeCycles三个函数，执行commitAllHostEffects会首次渲染或者更新 UI ；commitAllLifeCycles会调用生命周期函数；在首次次渲染完成后，commitRoot调用commitAllLifeCycles执行生命周期函数中的操作，之后会再次调用commitBeforeMutationLifecycles、commitAllHostEffects、commitAllLifeCycles这三个函数。在第二次执行过程中，把更新后的state 作用到当前实例上，然后再次调用commitAllLifeCycles如果未找到实例对生命周期函数的调用，就依次退出滞留在函数调用栈中的函数，完成渲染。

## 三、 setTimeout 中的的setState
在分析之前我们先来明确几点关于事件循环的知识点：

我们知道JavaScript的一大特点就是单线程，而这个线程中拥有唯一的一个事件循环。
JavaScript代码的执行过程中，除了依靠函数调用栈来搞定函数的执行顺序外，还依靠任务队列(task queue)来搞定另外一些代码的执行。
一个线程中，事件循环是唯一的，但是任务队列可以拥有多个。
任务队列又分为macro-task（宏任务）与micro-task（微任务），在最新标准中，它们被分别称为task与jobs。
macro-task大概包括：script(整体代码), setTimeout, setInterval, setImmediate, I/O, UI rendering。
micro-task大概包括: process.nextTick, Promise, Object.observe(已废弃), MutationObserver(html5新特性)
setTimeout/Promise等我们称之为任务源。而进入任务队列的是他们指定的具体执行任务。
来自不同任务源的任务会进入到不同的任务队列。其中setTimeout与setInterval是同源的。
事件循环的顺序，决定了JavaScript代码的执行顺序。它从script(整体代码)开始第一次循环。之后全局上下文进入函数调用栈。直到调用栈清空(只剩全局)，然后执行所有的micro-task。当所有可执行的micro-task执行完毕之后。循环再次从macro-task开始，找到其中一个任务队列执行完毕，然后再执行所有的micro-task，这样一直循环下去。
其中每一个任务的执行，无论是macro-task还是micro-task，都是借助函数调用栈来完成。
结合这些知识我们来分析一下， 在setTimeout中 setState的执行过程：

setTimeout.html

![](https://user-images.githubusercontent.com/18692722/43380421-b970a720-9403-11e8-8346-6e4c7c2e2fb4.png)

如图： 首次渲染页面至componentDidMount执行处于 script的宏任务队列中，当函数执行遇到setTimeout时，setTimeout是一个宏任务源，那么他的作用就是将任务分发到它对应的队列中，但不会执行，等待第一次循环的 script 的宏任务和微任务执行完毕后，开始第二次循环，依然从宏任务开始，这时发现setTimeout里有一个回调函数，便开始执行它。

在setTimeout的任务队列执行过程中，requestWork函数中，isRendering、isBatchingUpdates、的值为 false，expirationTime、Sync为1，因此进入第三个 if 分支执行performSyncWork，执行performWorkOnRoot，触发 render函数,更新 state，生成虚拟 DOM，然后进入commitRoot循环执行commitBeforeMutationLifecycles、commitAllHostEffects、commitAllLifeCycles三个函数，在执行到commitAllHostEffects时将虚拟 DOM 渲染为真实的 DOM，然后进入生命周期调用函数commitAllLifeCycles,没有发现生命周期函数调用，依次退出callCallback、invokeGuardedCallbackDev、invokeGuardedCallback、commitRoot、completeRoot、performWorkOnRoot、performWork、performSyncWork、requestWork、scheduleWork$1、enqueueUpdate,回到 setTimeout 的回调函数，执行 console.log,所以这里打印的 state 为改变后的值。

## 四、原生事件中的setState

```javascript
<html>
  <body>
    <script src="../../../build/dist/react.development.js"></script>
    <script src="../../../build/dist/react-dom.development.js"></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.js"></script>
    <div id="container"></div>
    <script type="text/babel">
      class Counter extends React.Component{
        constructor(props){
          super(props);
          this.state = {count: 0};
        }
        componentDidMount() {
          const btn = document.querySelector('#btn')
          btn.addEventListener('click', this.changeValue, false)
        }
        changeValue = () => {
          this.setState({ count: this.state.count + 1 })
          console.log(this.state.count) // 输出的是更新后的值 --> 1
        }
        render(){
          return(
          <div>
            <button id="btn">+</button>
            <div>{`Counter is: ${this.state.count}`}</div>
          </div>
          )
        }
      }
      ReactDOM.render(
        <Counter />,
        document.getElementById('container')
      );
    </script>
  </body>
</html>
```

执行过程如下：

![](https://user-images.githubusercontent.com/18692722/43383148-b19ef6ce-940c-11e8-8f37-3b4325bf787d.png)

因为没有经过合成事件处理，requestWork函数中，isRendering、isBatchingUpdates、的值为 false，expirationTime、Sync为1，因此进入第三个 if 分支执行performSyncWork，执行performWorkOnRoot，触发 render函数,更新 state，生成虚拟 DOM，然后进入commitRoot函数循环执行commitBeforeMutationLifecycles、commitAllHostEffects、commitAllLifeCycles，在执行到commitAllHostEffects时将虚拟 DOM 渲染为真实的 DOM，然后进入生命周期调用函数commitAllLifeCycles,没有发现生命周期函数调用，依次退出callCallback、invokeGuardedCallbackDev、invokeGuardedCallback、commitRoot、completeRoot、performWorkOnRoot、performWork、performSyncWork、requestWork、scheduleWork$1、enqueueUpdate,回到Counter._this.changeValue函数，执行 console.log,所以这里打印的 state 为改变后的值。

经过对不同场景下调用setState的分析，可以看出react内部代码执行到performWorkOnRoot方法的时候，会触发 render 函数，更新 state ，生成虚拟DOM ，之后在commitAllHostEffects执行时将虚拟 DOM渲染到页面，

## 结论：

setState 只在合成事件和钩子函数中是“异步”的，在原生事件和setTimeout 中都是同步的。
setState 的“异步”并不是说内部由异步代码实现，其实本身执行的过程和代码都是同步的，只是合成事件和钩子函数的调用顺序在更新之前，导致在合成事件和钩子函数中没法立马拿到更新后的值，形成了所谓的“异步”，当然可以通过第二个参数 setState(partialState, callback) 中的callback拿到更新后的结果。
render 函数被调用的时候，this.state才得到更新。