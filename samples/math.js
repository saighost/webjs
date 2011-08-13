var web = require('../index');
var getRouter = {
	'add/:a/:b': function (req, res, path, qs) {
		res.send(Number(path.a) + Number(path.b) + '');
	},
	'sub/:a/:b': function (req, res, path, qs) {
		res.send(Number(path.a) - Number(path.b) + '');
	},
	'mul/:a/:b': function (req, res, path, qs) {
		res.send(Number(path.a) * Number(path.b) + '');
	},
	'div/:a/:b': function (req, res, path, qs) {
		res.send(Number(path.a) / Number(path.b) + '');
	},
	'/:path/:path/:id': function (req, res, path, qs) {
		res.send(path.id);
	}
};
web.run({'abc': 'math.js'}, 8888)
	.get(getRouter);
console.log('running');