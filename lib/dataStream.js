var EventEmitter = require('events').EventEmitter;
var BufferHelper = require('bufferhelper');
var util = require('util');

function dataStream (req) {
    var self = this;
    self.headers = req.headers || {};
    self.buffer = new BufferHelper();
    req
        .on('data', function (chunk) {
            self.buffer.concat(chunk);
        })
        .on('end', function () {
            self.finished = true;
        });
}
util.inherits(dataStream, EventEmitter);
dataStream.prototype.ok = function () {
    if (this.finished) {
        this.emit('data', this.buffer.toBuffer());
        this.emit('end');
    }
    return this;
};
dataStream.prototype.pipe = function (obj, opt) {
    this.on('data', function (chunk) {
        obj.write(chunk);
    });
    if (opt.end !== undefined && opt.end !== false) this.on('end', function () {
        obj.end();
    });
    return this.ok();
}
module.exports = dataStream;