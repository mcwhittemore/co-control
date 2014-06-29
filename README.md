# Co-Control

Start async tasks when you want. Get them back as you want.

## Reason

In standard co flow, `yields` dispatch async jobs and issue requests for the resulting data at the same time. This greatly limits your ability to control the async flow. `Co-Control` aims to solve this problem by providing a simple api that `starts` async jobs and later `get` the resulting data. Because only the `get` call needs to be yielded you are able to kick of complex routine flows with little work.

Here is a very simple perf suite to dispay why working the co-control way can make things faster for you.

```
node --harmony ./speed-run.js setTimeout
```

## Install

```
npm install --save co-control
```

## Example

```js
var thunkify = require("thunkify");
var co = require("co");
var CoControl = require("co-control");

var slow = thunkify(function(cb){
	setTimeout(function(){cb(null, 20)}, 20);
});

var fast = thunkify(function(cb){
	setTimeout(function(){cb(null, 2)}, 2);
});

co(function*(cb){

	var controller = new CoControl();

	controller.start("sd", slow());
	controller.start("fd", fast());
	
	var fastData = yield controller.get("fd");

	// do some processing of fastData while we continue
	// to wait for slowData to do its thing

	var slowData = yield controller.get("sd");
});
```

## API

### start(key, yieldable)

* **key** the label used to later `get` the result.
* **yieldable** any of the [co supported yieldables](https://github.com/visionmedia/co#yieldables)

Starts an async opperation and holds the result until you need it.

```js
var thunkify = require("thunkify");
var yieldable = thunkify(function(cb){ setTimeout(function(){cb(null,20)}, 20);});
control.start("key", yieldable);
```

### get(key)

* **key** name of a `start`'d async opperation.

Returns the result of the async opperation. If the async opperation errored, it will throw that error.

```js
var value = control.get("key");
```

### all(keys)

* **keys** an array of names of `start`'d async opperations.

Returns a key value map of the results of all the requested opperations. If any of the async opperations errored, it will throw that error.

```js
var obj = control.all(["a", "b"]);
```

Results in...

```json
{
	"a": "value",
	"b": "value"
}
```



