var debug = require("debug")("co-control");
var thunkify = require("thunkify");

function CoControl(){
	this.done = {};
	this.used = {};

	var EventEmitter = require('events').EventEmitter;
	var events = new EventEmitter();

	this.on = events.on;
	this.emit = events.emit;

}

CoControl.prototype.start = function(key, thunk) {
	
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

CoControl.prototype.get = function(key){
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

CoControl.prototype.all = function(keys){
	
	var coObj = {};

	for(var i=0; i<keys.length; i++){
		var key = keys[i];
		coObj[key] = this.get(key);
	}

	return coObj;
}


module.exports = CoControl;