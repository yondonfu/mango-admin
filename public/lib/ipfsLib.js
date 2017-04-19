'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ipfs = require('ipfs');

var _ipfs2 = _interopRequireDefault(_ipfs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var IPFSLib = function () {
  function IPFSLib() {
    _classCallCheck(this, IPFSLib);

    var repo = String(Math.random());

    this.node = new _ipfs2.default({
      repo: repo,
      init: false,
      start: false,
      EXPERIMENTAL: {
        pubsub: false
      }
    });
  }

  _createClass(IPFSLib, [{
    key: 'init',
    value: function init() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this.node.init({ emptyRepo: true, bits: 2048 }, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }, {
    key: 'start',
    value: function start() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.node.start(function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }, {
    key: 'put',
    value: function put(buf) {
      var _this3 = this;

      return this.init().then(function () {
        return _this3.start();
      }).then(function () {
        return _this3.node.object.put(buf);
      }).then(function (node) {
        return node.toJSON().multihash;
      });
    }
  }, {
    key: 'get',
    value: function get(multihash) {
      var _this4 = this;

      console.log(multihash);
      return this.init().then(function () {
        return _this4.start();
      }).then(function () {
        console.log("here");
        _this4.node.object.get(new Buffer(multihash), { enc: 'base58' }, function (err, data) {
          console.log('cb');
          if (err) {
            console.log(err);
          } else {
            console.log(data);
          }
        });
        // return this.node.object.get(multihash, { enc: 'base58' });
      }); // .then(() => this.node.object.get(multihash, { enc: 'base58' }))
      // .then(node => node.toJSON());
    }
  }]);

  return IPFSLib;
}();

exports.default = IPFSLib;