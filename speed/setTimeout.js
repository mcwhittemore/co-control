var thunkify = require("thunkify");
var co = require("co");
var CoControl = require("../");

var slow = thunkify(function(cb){
	setTimeout(function(){cb(null)}, 30);
});

var fast = thunkify(function(cb){
	setTimeout(function(){cb(null)}, 1);
});

module.exports = {
	co: co(function*(cb){
		
		yield slow();
		yield fast();

		cb()
	}),
	"co-array": co(function*(cb){
		var s = slow();
		var f = fast();
		yield [s, f];
		cb();
	}),
	control: co(function*(cb){

		var controller = new CoControl();

		controller.start("sd", slow());
		controller.start("fd", fast());
		
		yield controller.get("fd");
		yield controller.get("sd");
		
		cb();
	})
}