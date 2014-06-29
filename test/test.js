var co = require("co");
var thunkify = require("thunkify");

//var store = require("./store");
var Thunkarator = require("../");

describe("co-control should", function(){

	var result = {
		one: {},
		two: {},
		three: {},
		four: {}
	};

	var errors = {
		dupe: null,
		notDupe: null,
		thrown: {}
	}

	var tasks = Object.keys(result);

	var delayName = thunkify(function(name, time, cb){
		result[name].delay = time;
		result[name].start = process.hrtime()[1];
		setTimeout(function(){
			result[name].ready = process.hrtime()[1];
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
			result[name].queued = process.hrtime()[1];
		}

		function gather(name){
			return function*(){
				result[name].called = process.hrtime()[1];
				result[name].value = yield thunkster.get(name);
				result[name].returned = process.hrtime()[1];
			}
		}

		co(function*(){
			enqueue("one");
			enqueue("two");
			enqueue("three");

			try{
				thunkster.start("one", noop());
			}
			catch(err){
				errors.dupe = err;
			}

			yield gather("one");

			enqueue("four");

			yield gather("two");
			yield gather("three");
			yield gather("four");

			try{
				thunkster.start("one", noop);
				errors.notDupe = yield thunkster.get("one");
			}
			catch(err){
				errors.notDupe = err;
			}

			try{
				thunkster.start("thrown", fail());
				errors.thrown.afterStart = process.hrtime()[1];
				errors.thrown.value = yield thunkster.get("thrown");
				errors.thrown.never = process.hrtime()[1];
			}
			catch(err){
				errors.thrown.err = err;
			}

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
		if(errors.dupe){
			errors.dupe.message.should.equal("You cannot reuse pending keys");
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
		errors.notDupe.should.not.be.an.instanceof(Error);
		errors.notDupe.should.equal("one");
	});

	it("throw an error on async failure", function(){
		if(errors.thrown.afterStart===undefined){
			throw new Error("Error thrown at thunkster.start not thunkster.get");
		}
		else if(errors.thrown.never!==undefined){
			console.log(errors.thrown);
			throw new Error("Error not thrown on get");
		}
		else{
			errors.thrown.err.should.be.an.instanceof(Error);
		}
	});

	//request feature by test
	it("allow you to wait for multiple co-routinues to finish");

});


