'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (host, port, mangoAddress, fromAddress) {
  var provider = new _web2.default.providers.HttpProvider('http://' + host + ':' + port);
  var MangoRepo = (0, _truffleContract2.default)(_MangoRepo2.default);

  return new _mangoRepoLib2.default(MangoRepo, mangoAddress, provider, fromAddress);
};

var _mangoRepoLib = require('./lib/mangoRepoLib');

var _mangoRepoLib2 = _interopRequireDefault(_mangoRepoLib);

var _web = require('web3');

var _web2 = _interopRequireDefault(_web);

var _truffleContract = require('truffle-contract');

var _truffleContract2 = _interopRequireDefault(_truffleContract);

var _MangoRepo = require('./build/contracts/MangoRepo.json');

var _MangoRepo2 = _interopRequireDefault(_MangoRepo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }