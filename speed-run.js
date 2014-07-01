var co = require("co");
var CoControl = require("./");
var thunkify = require("thunkify");

var testSuite = require("./speed/"+process.argv[2]);
var iterations = 100;

function tester(fn, cb){
	var start = process.hrtime();
	
	var done = function(err){
		var laps = process.hrtime(start);
		var time = laps[0] * 1e9 + laps[1]
		cb(err, time);
	}

	fn(done, "a");
}

co(function*(){

	var controller = new CoControl();

	var tests = Object.keys(testSuite);
	var numTests = tests.length;

	for(var i=0; i<numTests; i++){
		var test = tests[i];
		var fn = thunkify(function(cb){
			tester(testSuite[test], cb);
		});
		for(var j=0; j<iterations; j++){
			controller.start(test+"-"+j, fn());
		}
	}

	var results = {};

	var headToHead = {};
	var wins = {};

	for(var i=0; i<numTests; i++){
		var test = tests[i];
		for(var j=0; j<iterations; j++){
			results[test] = results[test] || 0;
			results[test] += yield controller.get(test+"-"+j);
		}

		for(var k=0; k<i; k++){
			var compare = tests[k];
			
			heads(compare, test);
			heads(test, compare);
		}
	}

	tests.sort(function(a, b){
		return wins[b] - wins[a];
	});

	for(var i=0; i<numTests; i++){
		var test = tests[i];
		console.log(test, "won", wins[test], "times out of", numTests-1, "tests");
		for(var j=0; j<numTests; j++){
			var compare = tests[j];
			if(compare!=test){
				var mark = headToHead[test][compare] < 0 ? "WIN" : "LOSS";
				var rate = headToHead[test][compare] < 0 ? headToHead[test][compare]*-1 : headToHead[test][compare];
				var dir =  headToHead[test][compare] < 0 ? "faster" : "slower"
				console.log("\t", mark, test, "vs", compare, "by running", rate, "nano seconds", dir);
			}
		}
	}


	function heads(a, b){
		if(headToHead[a]===undefined){
			headToHead[a] = {};
			wins[a] = 0;
		}

		headToHead[a][b] = results[a] - results[b];
		wins[a] = headToHead[a][b] < 0 ? wins[a]+1 : wins[a];
	}
	
})();

