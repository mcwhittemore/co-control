var co = require("co");
var thunkify = require("thunkify");

//var store = require("./store");
var CoControl = require("../");

describe("co-control should", function(){

	/**
	 * This is a bunch of prep.
	 * To keep tests simple and fast we
	 * are running a program that should
	 * in a before all and testing it later
	 */

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

	// these results all track their order so we can
	// loop over them to confirm a few things
	var orderTests = ["one", "two", "three", "four"];

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

		var controller = new CoControl();

		function enqueue(name, time){
			controller.start(name, delayName(name, time));
			result[name].queued = orderOfOpp++;
		}

		function gather(name){
			return function*(){
				result[name].called = orderOfOpp++;
				result[name].value = yield controller.get(name);
				result[name].returned = orderOfOpp++;
			}
		}

		co(function*(){
			controller.start("a", delayName("a", 30));
			controller.start("b", delayName("b", 40));
			controller.start("c", delayName("c", 100));

			enqueue("one", 400);
			enqueue("two", 300);
			enqueue("three", 200);

			try{
				controller.start("one", noop());
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
				controller.start("one", noop);
				result.notDupe = yield controller.get("one");
			}
			catch(err){
				result.notDupe = err;
			}

			try{
				controller.start("thrown", fail());
				result.thrown.afterStart = orderOfOpp++;
				result.thrown.value = yield controller.get("thrown");
				result.thrown.never = orderOfOpp++;
			}
			catch(err){
				result.thrown.err = err;
			}

			result.multi = yield controller.all(["a", "b", "c"]);

			done();
		})();
	});

	/**
	 * Here is where the tests really begin
	 */

	it("not yield a result until the async is done", function(){
		orderTests.forEach(function(task){
			result[task].ready.should.be.lessThan(result[task].returned);
		});
	});

	it("start a co-routinue asap", function(){
		orderTests.forEach(function(task){
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
		orderTests.forEach(function(task){
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
			throw new Error("Error thrown at controller.start not controller.get");
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


