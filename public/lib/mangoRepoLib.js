'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MangoRepoLib = function () {
  function MangoRepoLib(MangoRepo, mangoAddress, provider, fromAddress) {
    _classCallCheck(this, MangoRepoLib);

    this.provider = provider;
    this.fromAddress = fromAddress;

    MangoRepo.setProvider(this.provider);

    this.mangoRepoArtifact = MangoRepo;

    if (mangoAddress) {
      this.mangoRepo = this.mangoRepoArtifact.at(mangoAddress);
    }
  }

  _createClass(MangoRepoLib, [{
    key: 'init',
    value: function init() {
      var _this = this;

      return this.mangoRepoArtifact.new({ from: this.fromAddress, gas: 10000000 }).then(function (instance) {
        _this.mangoRepo = instance;
        return _this.mangoRepo.address;
      });
    }
  }, {
    key: 'refNames',
    value: function refNames() {
      var _this2 = this;

      return this.mangoRepo.refCount().then(function (count) {
        var names = [].concat(_toConsumableArray(Array(count.toNumber()).keys())).map(function (i) {
          return _this2.mangoRepo.refName(i);
        });

        return Promise.all(names);
      });
    }
  }, {
    key: 'refs',
    value: function refs() {
      var _this3 = this;

      return this.refNames().then(function (names) {
        var refs = names.map(function (name) {
          return _this3.mangoRepo.getRef(name);
        });

        return Promise.all(refs).then(function (refs) {
          return names.map(function (name, i) {
            return {
              name: name,
              ref: refs[i]
            };
          });
        });
      });
    }
  }, {
    key: 'snapshots',
    value: function snapshots() {
      var _this4 = this;

      return this.mangoRepo.snapshotCount().then(function (count) {
        var snapshots = [].concat(_toConsumableArray(Array(count.toNumber()).keys())).map(function (i) {
          return _this4.mangoRepo.getSnapshot(i);
        });

        return Promise.all(snapshots);
      });
    }
  }, {
    key: 'issueCount',
    value: function issueCount() {
      return this.mangoRepo.issueCount();
    }
  }, {
    key: 'issues',
    value: function issues() {
      var _this5 = this;

      return this.issueCount().then(function (count) {
        var issues = [].concat(_toConsumableArray(Array(count.toNumber()).keys())).map(function (i) {
          return _this5.mangoRepo.getIssue(i);
        });

        return Promise.all(issues);
      });
    }
  }, {
    key: 'getIssue',
    value: function getIssue(id) {
      return this.mangoRepo.getIssue(id);
    }
  }, {
    key: 'newIssue',
    value: function newIssue(hash) {
      return this.mangoRepo.newIssue(hash, { from: this.fromAddress, gas: 500000 }).then(function (result) {
        if (result.receipt['gasUsed'] == 500000) {
          throw new Error('Create issue transaction failed.');
        } else {
          return hash;
        }
      });
    }
  }, {
    key: 'setIssue',
    value: function setIssue(id, hash) {
      return this.mangoRepo.setIssue(id, hash, { from: this.fromAddress, gas: 500000 }).then(function (result) {
        if (result.receipt['gasUsed'] == 500000) {
          throw new Error('Set issue transaction failed.');
        } else {
          return hash;
        }
      });
    }
  }, {
    key: 'deleteIssue',
    value: function deleteIssue(id) {
      return this.mangoRepo.deleteIssue(id, { from: this.fromAddress, gas: 500000 }).then(function (result) {
        if (result.receipt['gasUsed'] == 500000) {
          throw new Error('Delete issue transaction failed.');
        } else {
          return id;
        }
      });
    }
  }, {
    key: 'pullRequests',
    value: function pullRequests() {
      var _this6 = this;

      return this.mangoRepo.pullRequestCount().then(function (count) {
        var pullRequests = [].concat(_toConsumableArray(Array(count.toNumber()).keys())).map(function (i) {
          return _this6.mangoRepo.getPullRequest(i);
        });

        return Promise.all(pullRequests);
      });
    }
  }, {
    key: 'getPullRequest',
    value: function getPullRequest(id) {
      return this.mangoRepo.getPullRequest(id);
    }
  }, {
    key: 'openPullRequest',
    value: function openPullRequest(issueId, forkAddress) {
      var _this7 = this;

      return this.mangoRepo.openPullRequest(issueId, forkAddress, { from: this.fromAddress, gas: 500000 }).then(function (result) {
        if (result.receipt['gasUsed'] == 500000) {
          throw new Error('Open PR transaction failed.');
        } else {
          return issueId;
        }
      }).then(function () {
        return _this7.mangoRepo.pullRequestCount().then(function (count) {
          return count.toNumber() - 1;
        });
      });
    }
  }, {
    key: 'closePullRequest',
    value: function closePullRequest(issueId) {
      return this.mangoRepo.closePullRequest(issueId, { from: this.fromAddress, gas: 500000 }).then(function (result) {
        if (result.receipt['gasUsed'] == 500000) {
          throw new Error('Close PR transaction failed.');
        } else {
          return issueId;
        }
      });
    }
  }]);

  return MangoRepoLib;
}();

exports.default = MangoRepoLib;