var web = require('../index');
var getRouter = {
	'add\/(.*)\/(.*)': function (req, res, path, qs) {
		res.send(Number(path[0]) + Number(path[1]) + '');
	},
	'sub\/(.*)\/(.*)': function (req, res, path, qs) {
		res.send(Number(path[0]) - Number(path[1]) + '');
	},
	'mul\/(.*)\/(.*)': function (req, res, path, qs) {
		res.send(Number(path[0]) * Number(path[1]) + '');
	},
	'div\/(.*)\/(.*)': function (req, res, path, qs) {
		res.send(Number(path[0]) / Number(path[1]) + '');
	}
};
web.run({}, 8888)
	.get(getRouter);