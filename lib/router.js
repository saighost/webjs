var fs = require('fs'),
	url = require('url'),
	mimes = require('./mimes');
exports.page404 = "Page not found.";
var send404 = function (res) {
		res.send(exports.page404);
	};
exports.getHandler = function (req, res, getpath, server) {
		switch (getpath) {
			case "":
				if ("/" in server.urlHandlers) {
					res.sendFile(server.urlHandlers["/"]);
				} else if ("/" in server.getHandlers) {
					server.getHandlers["/"](req, res);
				} else {
					res.sendFile("index.html");
				}
				break;
			case "favicon.ico":
				res.sendFile("favicon.ico");
				break;
			default:
				for (var key in server.getHandlers) {
					var uhReg = new RegExp(key, "i");
					var querystrings = url.parse(req.url, true).query;
					if (uhReg.test(getpath)) {
						try {
							var pathReg = [];
							for (var i = 1;i < 10;i++)
								if (RegExp['$' + i] !== '') pathReg.push(RegExp['$' + i]);
								res.writeHead(200, {'Content-type' : 'text/html'});
							server.getHandlers[key](req, res, pathReg, querystrings);
						} catch(ex) {
								if (server.errorHandler.get) {
									return server.erorrHandlers.get(req, res);
								} else {
									return send404(res);
								}
							}
						return;
					}
				}
				exports.urlHandler(req, res, getpath, server);
		}
	},
	exports.urlHandler = function (req, res, getpath, server) {
		var scriptfile;
		for (var key in server.urlHandlers) {
			var uhReg = new RegExp(key, "i");
			if (uhReg.test(getpath)) {
				scriptfile = server.urlHandlers[key];
				var keys = [];
				for (var i = 1; i < 10;i++)
					keys.push(RegExp['$' + i]);
				for (var j = 1; j < 10; j++)
						if (keys[j - 1]) 
							scriptfile = scriptfile.replace('$' + j, keys[j - 1]);
				break;
			}
		}
		if (/^http/.test(scriptfile)) {
			res.writeHead(302, {'Location':scriptfile});
			res.end();
			console.log('Redirected to ' + scriptfile);
			return;
		}
		if (scriptfile !== undefined) {
			fs.readFile(scriptfile, function (err, data) {
				if (err) return send404(res);
				var format = scriptfile.split(".");
				res.writeHead(200, {'Content-Type': mimes[format[format.length -1]]});
				res.write(data, 'utf8');
				res.end();
			});
		} else {
			exports.fileHandler(req, res, getpath, server);
		}
	},
	exports.postHandler = function (req, res, postpath, server) {
		for (var key in server.postHandlers) {
			var uhReg = new RegExp(key, "i");
			if (uhReg.test(postpath)) {
				try {
					res.writeHead(200, {'Content-type':'text/plain'});
					server.postHandlers[key](req, res, req.content);
				} catch(ex) {
					if (server.erorrHandlers.post) {
						return server.erorrHandlers.post(req, res);
					} else {
						return send404(res);
					}
				}
			}
		}
	},
	exports.fileHandler = function (req, res, getpath, server) {
		var format = getpath.split('.');
		if (format[format.length - 1] in server.blockMimes) {
			server.blockMimes[format[format.length - 1]](req, res);
		} else {
			res.sendFile(getpath);
		}
	};