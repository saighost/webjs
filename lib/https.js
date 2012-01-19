/*
 * @class HTTPS exports
 */
var https = require('https');
var fs = require('fs');
var urlmo = require('url');
var util = require('util');
var formidable = require('formidable');
var eventproxy = require('eventproxy').EventProxy;
var router = require('./router');
var mimes = require('./mimes').mimes;
var utils = require('./utils');
var asynclist = require('asynclist');
var httpStatus = require('./httpstatus');
var method = require('./method');
/*
 * @function Create a HTTP Server
 */
require('./response');
require('./request');
exports.createHttpsServer = function (opt) {
    var currentServer = exports.currentServer = http.createServer(opt, function (req, res) {
        exports.req = req;
        exports.res = res;
        exports.req.reqPath = urlmo.parse(req.url).pathname;
        exports.req.qs = urlmo.parse(req.url, true).query;
        if (exports.req.qs.callback !== undefined) exports.res.callback;
        exports.res.header('X-Powered-By', 'webjs');
        var tasks = events('route', req, res, global.web, currentServer);
        tasks.assign(route).run();
    });
    method.ext(currentServer);
    currentServer.use = function (event, handle) {
        if (handle) {
            return this.on(event, handle);
        } else {
            return this.on('route', event);
        }
    };
    currentServer.httpMethodHelper = function (method, handlers, server) {
        var _server = typeof server == 'object' ? server : global.web.server;
        _server = _server ? _server : global.web.httpsServer;
        _server = _server ? _server : this;
        switch (typeof handlers) {
            case 'object':
                for(var key in handlers) {
                    if (this.handlers[method] === undefined && this.handlers[method] === undefined) {
                        this.handlers[method] = {};
                        this.rules[method] = {};
                    }
                    this.handlers[method][key] = handlers[key];
                    this.rules[method][key] = new RegExp('^' + key.replace(/:([a-zA-Z0-9-_$]*)/g, '(.*)').replace(/\(\(\.\*\)\)/, '(.*)') + '$', 'i');
                }
                break;
            case 'string':
                if (this.handlers[method] === undefined && this.handlers[method] === undefined) {
                    this.handlers[method] = {};
                    this.rules[method] = {};
                }
                this.handlers[method][handlers] = server;
                this.rules[method][handlers] = new RegExp('^' + handlers.replace(/:([a-zA-Z0-9-_$]*)/g, '(.*)').replace(/\(\(\.\*\)\)/, '(.*)') + '$', 'i');
        }
        return this;
    };
    currentServer.handlers = {};
    currentServer.rules = {};
    return currentServer;
};
function events (event, req, res, web, server) {
    var handlers = global.web.listeners(event),
        _handlers = server.listeners(event);
    for (var i = 0;i < _handlers.length;i++) handlers.push(_handlers[i]);
    var list = handlers.map(function (handler) {
            return function () {
                handler(req, res, function () {
                    tasks.trigger(true);
                });
            }
        });
    var tasks = new asynclist(list);
    return tasks;
}
function post () {
    var req = exports.req;
    var res = exports.res;
    var currentServer = exports.currentServer;
    if (!global.web.set('bodyParse')) {
        if (~global.web.set('bodyParse')) {
            var form1 = new formidable.IncomingForm();
            form1.parse(req, function (err, fields, files) {
                req.data = fields;
                var j = 0,
                    y = 0;
                for (var key in files) {
                    y++;
                    if (files[key].path) {
                        fs.readFile(files[key].path, function (err, data) {
                            i++;
                            if (!err) req.data[key] = data;
                            if (i == y)
                                router.handler('post', req, res, req.reqPath, currentServer);
                        });
                    }
                }
                if (JSON.stringify(files) === '{}') router.handler('post', req, res, req.reqPath, currentServer);
            });
        } else {
            router.handler('post', req, res, req.reqPath, currentServer);
        }
    } else {
        router.handler('post', req, res, req.reqPath, currentServer);
    }
}
function put () {
    var req = exports.req;
    var res = exports.res;
    var currentServer = exports.currentServer;
    if (!global.web.set('bodyParse')) {
        if (~global.web.set('bodyParse')) {
            var form1 = new formidable.IncomingForm();
            form1.parse(req, function (err, fields, files) {
                req.data = fields;
                var j = 0,
                    y = 0;
                for (var key in files) {
                    y++;
                    if (files[key].path) {
                        fs.readFile(files[key].path, function (err, data) {
                            i++;
                            if (!err) req.data[key] = data;
                            if (i == y)
                                router.handler('put', req, res, req.reqPath, currentServer);
                        });
                    }
                }
                if (JSON.stringify(files) === '{}') router.handler('put', req, res, req.reqPath, currentServer);
            });
        } else {
            router.handler('put', req, res, req.reqPath, currentServer);
        }
    } else {
        router.handler('put', req, res, req.reqPath, currentServer);
    }
}
function get () {
    var req = exports.req;
    var res = exports.res;
    var currentServer = exports.currentServer;
    for (var key in currentServer.handlers.get)
        if (currentServer.rules.get[key].test(req.reqPath)) {
            req.params = utils.restParser(key, currentServer.rules.get[key], req.reqPath);
            return currentServer.handlers.get[key](req, res, function () {
                router.urlHandler(req, res, key, req.reqPath, currentServer, global.web);
            });
        }
    for (var key in currentServer.handlers.url)
        if (currentServer.rules.url[key].test(req.reqPath))
            return router.urlHandler(req, res, key, req.reqPath, currentServer, global.web);
    fs.stat(req.reqPath.substr(1), function (err, stat) {
        if (err) return res.sendError(404);
        if (stat.isFile()) {
            router.fileHandler(req, res, req.reqPath, currentServer, global.web);
        } else {
            if (/\/$/i.test(req.reqPath)) {
                fs.stat(req.reqPath.substr(1) + 'index.html', function (err, stat) {
                    if (err) return res.sendError(404);
                    req.reqPath = req.reqPath + 'index.html';
                    router.fileHandler(req, res, req.reqPath, currentServer, global.web);
                });
            } else {
                fs.stat(req.reqPath.substr(1) + '/index.html', function (err, stat) {
                    if (err) return res.sendError(404);
                    req.reqPath = req.reqPath + '/index.html';
                    router.fileHandler(req, res, req.reqPath, currentServer, global.web);
                });
            }
        }
    });
}
function deleteHandler () {
    var req = exports.req;
    var res = exports.res;
    var currentServer = exports.currentServer;
    if (global.web.config('readonly')) {
        return false;
    } else {
        var tasks = events("delete", req, res, global.web, currentServer)
        tasks.assign(function () {
            router.handler('delete', req, res, req.reqPath, currentServer);
        }).run();
    }
}
function head () {
    var req = exports.req;
    var res = exports.res;
    if (global.web.config('readonly')) {
        return false;
    } else {
        var tasks = events("head", req, res, global.web, currentServer)
        tasks.assign(function () {
            router.handler('head', req, res, req.reqPath, currentServer);
        }).run();
    }
}
function trace () {
    if (global.web.config('readonly')) {
        return false;
    } else {
        var tasks = events("trace", exports.req, exports.res, global.web, currentServer)
        tasks.assign(function () {
            exports.res.sendJSON(req.headers);
        }).run();
    }
}
function route () {
    var req = exports.req;
    var res = exports.res;
    var currentServer = exports.currentServer;
    switch (exports.req.method) {
        case "POST":
            var tasks = events('route', req, res, global.web, currentServer);
            tasks.assign(post).run();
            break;
        case "PUT":
            if (currentServer.config('readonly')) {
                return false;
            } else {
                var tasks = events('put', req, res, global.web, currentServer)
                tasks.assign(put).run();
            }
            break;
        case "GET":
            get();
            break;
        case "DELETE":
            deleteHandler();
            break;
        case "HEAD":
            head();
            break;
        case "TRACE":
            trace();
            break;
    }
}