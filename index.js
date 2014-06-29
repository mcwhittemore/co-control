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
	
	if(this.used[key]){
		debug("DUPE!", key);
		throw new Error("You cannot reuse pending keys");
	}
	else{
		debug(key, "starting...");
		this.used[key] = true;
		thunk(function(err, result){
			debug(key, "is ready");
			this.done[key] = {err:err, result:result};
			this.emit(key, this.done[key]);
		}.bind(this));
	}
};

Thunkarator.prototype.get = function(key){
	return thunkify(function(rator, cb){

		function respond(result){
			rator.used[key] = false;
			debug(key, "done");
			cb(result.err, result.result);
		}

		gather(rator, key, function(result){
			respond(result);
		});

		
	})(this);
}

function gather(rator, key, cb){
	var result = rator.done[key];
	if(result){
		cb(result);
	}
	else{
		debug(key, "waiting...");
		rator.on(key, cb);
	}
}

Thunkarator.prototype.all = function(){
	var args = [].slice.call(arguments,0);
	
	var coObj = {};

	for(var i=0; i<args.length; i++){
		var key = args[i];
		coObj[key] = this.get(key);
	}

	return coObj;
}


module.exports = Thunkarator;