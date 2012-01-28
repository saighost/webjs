var session = require('../session');
module.exports = function () {
    return function (req, res, next) {
        session.start(req, res);
        next();
    };
}