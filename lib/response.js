var fs = require("fs");
var url = require("url");
var mimes = require('./mimes').mimes;
var util = require('util');
var utils = require('./utils');
var dataStream = require('./dataStream');
var async = process.nextTick;
var httpStatus = require('./httpstatus').status;
var pathmo = require('path');
var http = require('http');
var expires = {
    maxAge: 60*60*24*365
};
var filesBuffers = {};
function sendfile (_fileName, res, found, _charset) {
    if (!found) if (/^\//.test(_fileName)) _fileName = _fileName.substr(1);
    fs.stat(_fileName, function (err, stats) {
        if (err) return res.sendError(404);
        var size = stats.size;
        var format = pathmo.extname(_fileName);
        var lastModified = stats.mtime.toUTCString();
        format = format ? format.slice(1) : 'unknown';
        var charset = mimes[format] || 'text/plain; charset=UTF-8';
        if (_charset) charset = _charset;
        var expires1 = new Date();
        if (res.reqHeaders['range']) {
            var range = utils.parseRange(res.reqHeaders['range'], size);
            if (range) {
                res.header('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + stats.size);
                res.header('Content-Length', (range.end - range.start + 1));
                var fileStream = fs.createReadStream(_fileName, range);
                res.status(206);
            } else {
                res.status(200);
                res.header('Content-Length', size);
                var fileStream = fs.createReadStream(_fileName);
            }
        } else {
            res.status(200);
            res.header('Content-Length', size);
            var fileStream = fs.createReadStream(_fileName);
        }
        expires1.setTime(expires1.getTime() + expires.maxAge * 1000);
        res.header("Expires", expires1.toUTCString());
        res.header("Cache-Control", "max-age=" + expires.maxAge);
        res.header('Content-Type' , charset);
        res.header('Last-Modified', lastModified);
        fileStream.pipe(res.dataStream);
        fileStream.on('end', function () {
            res.send(null, charset);
        });
    });
}
//res
/*
 * @description Send a data to client. 发送数据到客户端 
 * @param {String} data Data to send(require) 发送的数据* 
 */
http.ServerResponse.prototype.long = function () {
    http.ServerResponse.prototype.send = function (data, _charset) {
        this.status(200);
        var charset = _charset || 'text/html';
        this.header('Content-Type', charset);
        if (data) this.dataStream.write(data);
        this.emit('beforeSend');
        this.dataStream.pipe(this);
        this.dataStream.ok();
    };
    return this;
};
http.ServerResponse.prototype.status = function (code) {
    this.statusCode = code;
    return this;
};
http.ServerResponse.prototype.cache = function (type, options) {
    var val = type;
    options = options || {};
    if (options.maxAge) val += ', max-age=' + (options.maxAge / 1000);
    return this.header('Cache-Control', val);
};
http.ServerResponse.prototype.attachment = function(filename){
    if (filename) this.type(filename);
    this.header('Content-Disposition', filename
        ? 'attachment; filename="' + basename(filename) + '"'
        : 'attachment');
    return this;
};
http.ServerResponse.prototype.download = http.ServerResponse.prototype.attachment;
http.ServerResponse.prototype.send = function (data, _charset) {
    this.status(200);
    var charset = _charset || 'text/html; charset=UTF-8';
    this.header('Content-Type', charset);
    if (data) this.dataStream.write(data);
    this.emit('beforeSend');
    this.dataStream.pipe(this);
    this.dataStream.ok();
};
http.ServerResponse.prototype.pipelining = function (cb) {
    this.on('beforeSend', cb);
    return this;
};
http.ServerResponse.prototype.use = http.ServerResponse.prototype.pipelining;
http.ServerResponse.prototype.__defineGetter__('dataStream', function () {
    if (this._dataStream) {
        return this._dataStream;
    } else {
        var data = new dataStream();
        this._dataStream = data;
        return data;
    }
});
http.ServerResponse.prototype.render = function (tmlp, view) {
    view = view || {};
    var engine_name = global.web.set('view engine') || 'jade';
    var engine = require(engine_name);
    var views = global.web.set('views');
    var self = this;
    var ext = '.' + engine_name;
    var root = view.root ? view.root + '/' : views + '/';
    if (tmlp !== pathmo.basename(tmlp)) {
        if (pathmo.extname(tmlp) !== '') {
            return fs.readFile(tmlp, function (err, file) {
                if (engine_name !== 'mustache') {
                    engine.render(file, view, function (err1, data) {
                        if (err || err1) return self.sendError(500);
                        self.send(data);
                    });
                } else {
                    if (err) return self.sendError(500);
                    self.send(engine.to_html(file, view));
                }
            });
        } else {
            return fs.readFile(tmlp + ext, function (err, file) {
                if (engine_name !== 'mustache') {
                    engine.render(file, view, function (err1, data) {
                        if (err || err1) return self.sendError(500);
                        self.send(data);
                    });
                } else {
                    if (err) return self.sendError(500);
                    self.send(engine.to_html(file, view));
                }
            });
        }
    } else {
        if (pathmo.extname(root + tmlp) !== '') {
            return fs.readFile(root + tmlp, function (err, file) {
                if (engine_name !== 'mustache') {
                    engine.render(file, view, function (err1, data) {
                        if (err || err1) return self.sendError(500);
                        self.send(data);
                    });
                } else {
                    if (err) return self.sendError(500);
                    self.send(engine.to_html(file, view));
                }
            })
        } else {
            return fs.readFile(root + tmlp + ext, function (err, file) {
                if (engine_name !== 'mustache') {
                    engine.render(file, view, function (err1, data) {
                        if (err || err1) return self.sendError(500);
                        self.send(data);
                    });
                } else {
                    if (err) return self.sendError(500);
                    self.send(engine.to_html(file, view));
                }
            })
        }
    }
};
http.ServerResponse.prototype.sendError = function (statu) {
    var data = global.web.ErrorPage[statu] ? global.web.ErrorPage[statu] : httpStatus[String(statu)];
    var c = global.server ? global.server : global.web;
    var handler = c.lookup('error', String(statu));
    var self = this;
    if (handler) {
        handler(this.req, this, function () {
            self.status(statu);
            self.header('Content-Type', 'text/html');
            self.end(data);
        });
    } else {
        self.status(statu);
        self.header('Content-Type', 'text/html');
        self.end(data);
    }
    return this;
};
/*
 * @description Send a file to client. 发送指定文件到客户端
 * @param {String} fileName Specify file name to send.(require) 需要发送的文件的文件名(不包括文件名前端的'/');*
 */
http.ServerResponse.prototype.sendFile = function (fileName, found, _charset) {
    if (!found) {
        var _server = typeof server == 'object' ? server : global.web.server;
        var _server = _server ? _server : global.web.httpsServer;
        if ('/' in _server.handlers) {
            if (new RegExp(_server.handlers.url['/'], 'i').test(fileName)) {
                return sendfile(fileName, this, false, _charset);
            } else if (/\/$/i.test(_server.handlers.url['/']) && !/^\//i.test(fileName)) {
                return sendfile(_server.handlers.url['/'] + fileName, this, false, _charset);
            } else {
                return sendfile(_server.handlers.url['/'] + '/' + fileName, this, false, _charset);
            }
        }
    } else {
        sendfile(fileName, this, true, _charset);
    }
    return this;
};
/*
 * @description Send a JSON String to client. 发送JSON数据到客户端
 * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
 */
http.ServerResponse.prototype.sendJSON = function (data) {
    switch (typeof data) {
        case "string":
            this.send(data, 'application/json');
            break;
        case "array":
        case "object":
            this.send(JSON.stringify(data), 'application/json');
            break;
    }
    return this;
};
/*
 * @description Send a JSON String to client, and then run the callback. 发送JSONP数据到客户端，然后让客户端执行回调函数。
 * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
 */
http.ServerResponse.prototype.sendJSONP = function (data) {
    var callback = this.callback;
    switch (typeof data) {
        case "string":
            this.send(callback + '(' + data + ')', 'application/json');
            break;
        case "array":
        case "object":
            this.send(callback + '(' + JSON.stringify(data) + ')', 'application/json');
            break;
    }
    return this;
};
/*
 * @description Redirect the client to specify url ,home, back or refresh. 使客户端重定向到指定域名，或者重定向到首页，返回上一页，刷新。
 * @param {String} url Specify url ,home, back or refresh.(require) 指定的域名，首页，返回或刷新。*
 */
http.ServerResponse.prototype.redirect = function (url) {
    this.status(302);
    this.header('Location', url);
    this.end();
    console.log('Refresh to ' + url);
    return this;
};
/*
 * @description Set a cookies on the client. 在客户端设置cookies
 * @param {String} name name of the cookies.(require) cookies的名字*
 * @param {String} val content of the cookies.(require) cookies的数据*
 * @param {Object} options Detail options of the cookies. cookies的详细设置
 */
http.ServerResponse.prototype.setCookie = function (name, val, options) {
    if (typeof options != 'object')
        options = {};
    if (typeof options.path != 'string')
        options.path = '/';
    if (!(options.expires instanceof Date))
        options.expires = new Date();
    if (isNaN(options.maxAge))
        options.maxAge = 0;
    options.expires.setTime(options.expires.getTime() + options.maxAge * 1000);
    var cookie = utils.serializeCookie(name, val, options);
    var oldcookie = this.getHeader('Set-Cookie');
    if (typeof oldcookie != 'undefined')
        cookie = oldcookie + '\r\nSet-Cookie: ' + cookie;
    this.header('Set-Cookie', cookie);
    return this;
};
http.ServerResponse.prototype.cookie = http.ServerResponse.prototype.setCookie;
/*
 * @decription Claer the specify cookies. 清除某指定cookies
 * @param {String} name Name of the cookies to clear.(require) 需要清除的cookies的名字*
 * @param {Object} options Detail options of the cookies. cookies的详细设置
 */
http.ServerResponse.prototype.clearCookie = function (name, options) {
    this.cookie(name, '', options);
    return this;
};
http.ServerResponse.prototype.header = function (header, value) {
    if (value && !this._headerSent) this.setHeader(header, value);
    return this;
};