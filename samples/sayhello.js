var web = require('webjs');

var getRouter = {
	'name\/(.*)': function (req, res, path, qs) {
		res.send('Hey! Mr. ' + decodeURI(path[0]) + '! Nice to meet you.');
	}
};
web.run({}, 45678)
	.get(getRouter);