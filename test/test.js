var co = require("co");
var thunkify = require("thunkify");

//var store = require("./store");
var Thunkarator = require("../");

describe("co-control should", function(){

	var result = {
		one: {},
		two: {},
		three: {},
		four: {},
		a: {},
		b: {},
		c: {}, 
		dupe: null,
		notDupe: null,
		thrown: {},
		multi: {}
	};

	var tasks = ["one", "two", "three", "four"];

	var orderOfOpp = 0;

	var delayName = thunkify(function(name, time, cb){
		result[name].delay = time;
		result[name].start = orderOfOpp++;
		setTimeout(function(){
			result[name].ready = orderOfOpp++;
			cb(null, name);
		},time);
	});

	var noop = thunkify(function(cb){cb()});

	var fail = thunkify(function(cb){ 
		cb(new Error("always"));
	});

	before(function(done){

		var thunkster = new Thunkarator();

		function enqueue(name, time){
			thunkster.start(name, delayName(name, time));
			result[name].queued = orderOfOpp++;
		}

		function gather(name){
			return function*(){
				result[name].called = orderOfOpp++;
				result[name].value = yield thunkster.get(name);
				result[name].returned = orderOfOpp++;
			}
		}

		co(function*(){
			thunkster.start("a", delayName("a", 30));
			thunkster.start("b", delayName("b", 40));
			thunkster.start("c", delayName("c", 100));

			enqueue("one", 400);
			enqueue("two", 300);
			enqueue("three", 200);

			try{
				thunkster.start("one", noop());
			}
			catch(err){
				result.dupe = err;
			}

			yield gather("one");

			enqueue("four", 1);

			yield gather("two");
			yield gather("three");
			yield gather("four");

			try{
				thunkster.start("one", noop);
				result.notDupe = yield thunkster.get("one");
			}
			catch(err){
				result.notDupe = err;
			}

			try{
				thunkster.start("thrown", fail());
				result.thrown.afterStart = orderOfOpp++;
				result.thrown.value = yield thunkster.get("thrown");
				result.thrown.never = orderOfOpp++;
			}
			catch(err){
				result.thrown.err = err;
			}

			result.multi = yield thunkster.all("a", "b", "c");

			done();
		})();
	});

	it("not yield a result until the async is done", function(){
		tasks.forEach(function(task){
			result[task].ready.should.be.lessThan(result[task].returned);
		});
	});

	it("start a co-routinue asap", function(){
		tasks.forEach(function(task){
			result[task].start.should.be.lessThan(result[task].queued);
		});
	});

	it("throw an error when enqueueing a task of the same name as one pending", function(){
		if(result.dupe){
			result.dupe.message.should.equal("You cannot reuse pending keys");
		}
		else{
			throw new Error("No error thrown when it should have been");
		}
	});

	it("yield the correct co-routinues value", function(){
		tasks.forEach(function(task){
			result[task].value.should.equal(task);
		});
	});

	it("let multiple co-routinues run at once", function(){
		result.two.start.should.be.lessThan(result.one.ready);
		result.three.start.should.be.lessThan(result.one.ready);
	});

	it("let you resuse a name after its been returned", function(){
		result.notDupe.should.not.be.an.instanceof(Error);
		result.notDupe.should.equal("one");
	});

	it("throw an error on async failure", function(){
		if(result.thrown.afterStart===undefined){
			throw new Error("Error thrown at thunkster.start not thunkster.get");
		}
		else if(result.thrown.never!==undefined){
			console.log(result.thrown);
			throw new Error("Error not thrown on get");
		}
		else{
			result.thrown.err.should.be.an.instanceof(Error);
		}
	});

	it("allow you to wait for multiple co-routinues to finish", function(){
		result.multi.should.have.property("a", "a");
		result.multi.should.have.property("b", "b");
		result.multi.should.have.property("c", "c");
	});

});


