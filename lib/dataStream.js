var Stream = require('stream').Stream;
var bufferhelper = require('bufferhelper');
var util = require('util');

function dataStream (req) {
    var self = this;
    self.writable = true;
    self.readable = true;
    self.buffer = new bufferhelper();
    if (req) {
        self.headers = req.headers || {};
        req.on('data', function (chunk) {
            self.buffer.concat(chunk);
        });
    }
}
util.inherits(dataStream, Stream);
dataStream.prototype.ok = function () {
    var data = this.buffer.toBuffer();
    this.empty();
    this.emit('data', data);
    this.emit('end');
    return this;
};
dataStream.prototype.setup = function (dest) {
    this.headers = dest.headers;
    return this;
};
dataStream.prototype.write = function (chunk) {
    if (typeof chunk == 'string') {
         var buffer = new Buffer(chunk.length);
         buffer.write(chunk);
         chunk = buffer;
    }
    this.buffer.concat(chunk);
    return this;
};
dataStream.prototype.empty = function () {
    this.buffer = new bufferhelper();
    return this;
};
dataStream.prototype.end = function () {
    this.finished = true;
};
dataStream.prototype.out = function () {
    if (this.finished) return this.buffer.toBuffer();
};
module.exports = dataStream;