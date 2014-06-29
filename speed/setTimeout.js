var thunkify = require("thunkify");
var co = require("co");
var CoControl = require("../");

var slow = thunkify(function(cb){
	setTimeout(function(){cb(null)}, 20);
});

var fast = thunkify(function(cb){
	setTimeout(function(){cb(null)}, 2);
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
	"co-obj": co(function*(cb){
		yield {
			s: slow(),
			f: fast()
		}

		cb()
	}),
	"control-obj": co(function*(cb){
		var controller = new CoControl();

		controller.start("sd", slow());
		controller.start("fd", fast());

		yield controller.all("sd", "fd");

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