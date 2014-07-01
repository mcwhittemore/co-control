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
	})
}