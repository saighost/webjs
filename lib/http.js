var http = require("http"),
	fs = require("fs"),
	url = require("url"),
	formidable = require('formidable'),
	router = require('./router'),
	mimes = require('./mimes'),
	util = require('./util');
exports.server;
//404 page
exports.page404 = "Page not found.";
var send404 = function (res) {
		res.send(exports.page404);
	};

exports.createHttpServer = function () {
	exports.server = http.createServer(function (req, res) {
			var path = url.parse(req.url).pathname.substring(1);
			//Response
		/*
		 * @description 发送数据到客户端
		 * @param {String} data 发送的数据*
		 * @param {Boolean} last 是否是最后一次发送(建议在最后一次异步发送使用*)
		 */
			res.send = function (data) {
				this.write(data);
				res.end();
				return this;
			};
		/*
		 * @description 发送指定文件到客户端
		 * @param {String} fileName 需要发送的文件的文件名(不包括文件名前端的'/');*
		 */
			res.sendFile = function (fileName) {
				var format = fileName.split('.');
				fs.readFile(fileName, function (err, data) {
					if (err) return send404(res);
					this.charset = mimes[format[format.length - 1]];
					res.writeHead(200, {'Content-Type' : this.charset});
					res.write(data);
					res.end();
				});
			};
		/*
		 * @description 发送JSON数据到客户端
		 * @param {Array} data 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
		 */
			res.sendJSON = function (data) {
				switch (typeof data) {
					case "string":
						this.charset = "application/json";
						res.writeHead(200, {'Content-Type' : this.charset});
						res.write(data);
						res.end();
						break;
				case "array":
					case "object":
						var sJSON = JSON.stringify(data);
						this.charset = "application/json";
						res.writeHead(200, {'Content-Type' : this.charset});
						res.write(sJSON);
						res.end();
						break;
				}
			};
		/*
		 * @description 在客户端设置cookies
		 * @param {String} name cookies的名字*
		 * @param {String} val cookies的数据*
		 * @param {Object} options cookies的详细设置
		 */
			res.cookie = function (name, val, options) {
				options = options || {};
				if ('maxAge' in options) options.expires = new Date(Date.now() + options.maxAge);
				if (undefined === options.path) options.path = this.app.set('home');
				var cookie = utils.serializeCookie(name, val, options);
				this.header('Set-Cookie', cookie);
				return this;
			};
		/*
		 * @decription 清除某指定cookies
		 * @param {String} name 需要清除的cookies的名字*
		 * @param {Object} options 详细设置
		 */
			res.clearCookie = function (name, options) {
				var opts = { expires: new Date(1) };
	
				return this.cookie(name, '', options
					? utils.merge(options, opts)
					: opts);
			};
	
			//Request

		/*
		 * @description 检测请求的MIME类型是否为指定的MIME类型
		 * @param {String} type 需要检测的MIME类型*
		 */
			req.type = function(type) {
				var contentType = this.headers['content-type'];
				if (!contentType) return;
				if (!~type.indexOf('/')) type = mimes[type];
				if (~type.indexOf('*')) {
					type = type.split('/')
					contentType = contentType.split('/');
					if ('*' == type[0] && type[1] == contentType[1]) return true;
					if ('*' == type[1] && type[0] == contentType[0]) return true;
				}
				return !! ~contentType.indexOf(type);
			};
		/*
		 * @description 返回请求头中的指定数据
		 * @param {String} sHeader 需要查询的头数据名*
		 */
			req.header = function (sHeader) {
				if (this.headers[sHeader]) {
					return this.headers[sHeader];
				} else {
					return undefined;
				}
			};
			if (req.method.toLowerCase() == 'post') {
				var form = new formidable.IncomingForm();
				form.parse(req, function (err, fields, files) {
					req.content = fields;
					for (var key in files) {
						if (files[key].path)
							req.content[key] = fs.readFileSync(files[key].path).toString('utf8');
					}
					router.postHandler(req, res, path, server);
				});
			}
			switch (req.method) {
				case "GET":
					router.getHandler(req, res, path, this);
					break;
			}
		});
	exports.server.urlHandlers = {};
	exports.server.getHandlers = {};
	exports.server.postHandlers = {};
	exports.server.erorrHandlers = {};
	exports.server.blockMimes = {};
	return exports.server;
};