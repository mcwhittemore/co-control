var co = require("co");
var thunkify = require("thunkify");

//var store = require("./store");
var Thunkarator = require("../");

describe("confirm thunkarator", function(){

	var result = {
		one: {},
		two: {},
		three: {},
		four: {}
	};

	var delayName = thunkify(function(name, time, cb){
		result[name].delay = time;
		setTimeout(function(){
			result[name].ready = Date.now();
			cb(null, name);
		},time);
	});

	before(function(done){
		co(function*(){
			var thunkster = new Thunkarator();

			thunkster.start("one", delayName("one", 400));
			result.one.start = Date.now();
			thunkster.start("two", delayName("two", 500));
			result.two.start = Date.now();
			thunkster.start("three", delayName("three", 300));
			result.three.start = Date.now();

			result.one.called = Date.now();
			result.one.value = yield thunkster.get("one");
			result.one.returned = Date.now();

			thunkster.start("four", delayName("four", 1));
			result.four.start = Date.now();

			result.two.called = Date.now();
			result.two.value = yield thunkster.get("two");
			result.two.returned = Date.now();

			result.three.called = Date.now();
			result.three.value = yield thunkster.get("three");
			result.three.returned = Date.now();

			result.four.called = Date.now();
			result.four.value = yield thunkster.get("four");
			result.four.returned = Date.now();


			done();
		})();
	});

	it("test", function(){
		console.log(result);
	});

});


