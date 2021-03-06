var mimes = require('./mimes').mimes;
var url = require('url');
var http = require('http');
var util = require('util');
var dataStream = require('./dataStream');
var async = process.nextTick;
//Request
/*
 * @description Check the Request's MIME type is same to specify MIME type or not. 检测请求的MIME类型是否为指定的MIME类型
 * @param {String} type The MIME type to check.(require) 需要检测的MIME类型*
 */
http.IncomingMessage.prototype.type = function (type1, cb) {
    var contentType = this.headers['content-type1'];
    if (!contentType) return;
    if (!~type1.indexOf('/')) type1 = mimes[type1];
    if (~type1.indexOf('*')) {
        type1 = type1.split('/');
        contentType = contentType.split('/');
        if ('*' == type1[0] && type1[1] == contentType[1]) return true;
        if ('*' == type1[1] && type1[0] == contentType[0]) return true;
    }
    async(function () {
        cb(!! ~contentType.indexOf(type1));
    });
    return this;
};
http.IncomingMessage.prototype.__defineGetter__('dataStream', function () {
    if (this._dataStream) {
        return this._dataStream;
    } else {
        var data = new dataStream();
        this._dataStream = data;
        return data;
    }
});
/*
 * @description Get the specify header in the request. 返回请求头中的指定数据
 * @param {String} sHeader Name of the header to get.(require) 需要查询的头数据名*
 */
http.IncomingMessage.prototype.getHeader = function (sHeader) {
    if (this.headers[sHeader]) {
        return this.headers[sHeader];
    } else {
        return undefined;
    }
};
http.IncomingMessage.prototype.__defineGetter__('qs', function () {
    if (this._qs) {
        return this._qs;
    } else {
        this._qs = url.parse(this.url, true).query;
        return this._qs;
    }
});
http.IncomingMessage.prototype.__defineGetter__('reqPath', function () {
    if (this._reqPath) {
        return this._reqPath;
    } else {
        this._reqPath = url.parse(this.url).pathname;
        return this._reqPath;
    }
});
http.IncomingMessage.prototype.log = {
    log: function (msg) {
        console.log('\x1b[36m' + msg);
        global.web.logFile.write(msg + '\r\n');
        return this;
    },
    info: function (msg) {
        console.log('\x1b[33m[Info] \x1b[0m' + msg);
        global.web.logFile.write('[Info] ' + msg + '\r\n');
        return this;
    },
    err: function (msg) {
        console.log('\x1b[31m[Error] \x1b[0m' + msg);
        global.web.logFile.write('[Error] ' + msg + '\r\n');
        return this;
    },
    dbg: function (msg) {
        console.log('\x1b[34m[Debug] \x1b[0m' + msg);
        global.web.logFile.write('[Debug] ' + msg + '\r\n');
        return this;
    }
};