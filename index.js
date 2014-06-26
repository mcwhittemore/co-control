var debug = require("debug")("thunkarator");
var thunkify = require("thunkify");

function Thunkarator(){
	this.done = {};
	this.used = {};

	var EventEmitter = require('events').EventEmitter;
	var events = new EventEmitter();

	this.on = events.on;
	this.emit = events.emit;

}

Thunkarator.prototype.start = function(key, thunk) {
	debug("starting a thunk", key);
	
	if(this.used[key]){
		throw new Error("You cannot reuse pending keys");
	}
	else{
		this.used[key] = true;
		thunk(function(err, result){
			debug("thunk is done", result, key);
			this.done[key] = {err:err, result:result};
			this.emit(key, this.done[key]);
		}.bind(this));
	}
};

Thunkarator.prototype.get = function(key){
	return thunkify(function(rator, cb){
		var result = rator.done[key];
		debug("waiter", result, key);
		if(result){
			rator.used[key] = false;
			cb(result.error, result.result);
		}
		else{
			debug("wait for event to be emitted", key);
			rator.on(key, function(result){
				rator.used[key] = false;
				debug("we've been waiting for you", key, result);
				cb(result.error, result.result);
			});
		}
	})(this);
}


module.exports = Thunkarator;