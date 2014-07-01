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
	"co-one": co(function*(cb){
		yield fast();
		cb();
	}),
	"control-one": co(function*(cb){
		var controller = new CoControl();
		controller.start("fd", fast());
		yield controller.get("fd");
		cb();
	})
}