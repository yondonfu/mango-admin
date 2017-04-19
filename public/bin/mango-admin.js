#!/usr/bin/env node
'use strict';

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

var _Web = require('Web3');

var _Web2 = _interopRequireDefault(_Web);

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

var _issueEditor = require('../lib/issueEditor');

var _issueEditor2 = _interopRequireDefault(_issueEditor);

var _swarmJs = require('swarm-js');

var _swarmJs2 = _interopRequireDefault(_swarmJs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var swarm = _swarmJs2.default.at('http://swarm-gateways.net');

var RPC_HOST = 'localhost';
var RPC_PORT = '8545';

var CONTRACT_DIR = '.mango/contract/;';
var ISSUES_DIR = '.mango/issues/';

var args = _yargs2.default.option('host', {
  description: 'HTTP host of Ethereum node',
  alias: 'h',
  default: RPC_HOST
}).option('port', {
  description: 'HTTP port of Ethereum node',
  alias: 'p',
  default: RPC_PORT
}).option('account', {
  description: 'Sender account',
  alias: 'a',
  type: 'string'
}).command('init', 'Create a Mango repository').command('status', 'Check the status of a Mango repository').command('issues', 'List issues for a Mango repository').command('get-issue <id>', 'Get a issue for a Mango repository').command('new-issue', 'Create a new issue for a Mango repository').command('edit-issue <id>', 'Edit an issue for a Mango repository').command('delete-issue <id>', 'Delete issue for a Mango repository').command('fork <path>', 'Create a fork of a Mango repository').command('merge-fork <path>', 'Merge a fork into a Mango repository').command('pull-requests', 'List open pull requests for a Mango repository').command('get-pull-request <id>', 'Get a pull request referencing a fork').command('open-pull-request <issueId> <forkAddress>', 'Open a pull request referencing a fork').command('close-pull-request <id>', 'Close a pull request referencing a fork').help().usage('Usage: $0 [command]');

function ensureGitRepo() {
  return new Promise(function (resolve, reject) {
    _fsExtra2.default.stat('.git', function (err, stats) {
      if (err) {
        reject(new Error('Need to be in a Git repository.'));
      } else {
        resolve(true);
      }
    });
  });
}

function getMangoAddress() {
  return new Promise(function (resolve, reject) {
    _fsExtra2.default.readFile('.mango/contract', 'utf-8', function (err, data) {
      if (err) {
        reject(new Error('Need to be in a Mango repository.'));
      } else {
        resolve(data);
      }
    });
  });
}

function ensureMangoRepo() {
  return ensureGitRepo().then(getMangoAddress());
}

function setMango(address) {
  (0, _mkdirp2.default)('.mango/issues', function (err) {
    if (err) {
      console.error(err);
      return;
    } else {
      _fsExtra2.default.writeFile('.mango/contract', address, function (err) {
        if (err) {
          console.error(err);
          return;
        } else {
          console.log('Wrote contract address to .mango/contract');
        }
      });
    }
  });
}

function getAccount() {
  var host = argv.host,
      port = argv.port;


  var provider = new _Web2.default.providers.HttpProvider('http://' + host + ':' + port);
  var web3 = new _Web2.default(provider);

  return new Promise(function (resolve, reject) {
    web3.eth.getAccounts(function (err, accounts) {
      if (err != null) {
        reject(err);
      } else {
        resolve(accounts[0]);
      }
    });
  });
}

function mangoInit(account) {
  console.log('Creating new Mango repository with maintainer: ' + account);

  var host = argv.host,
      port = argv.port;


  var mangoRepoLib = (0, _index2.default)(host, port, null, account);

  return mangoRepoLib.init().then(function (address) {
    console.log('Mango repository created: ' + address);
    setMango(address);
  }).catch(function (err) {
    return console.error(err);
  });
}

function mangoStatus(mangoAddress, account) {
  console.log('Mango repository at ' + mangoAddress);

  var host = argv.host,
      port = argv.port;


  var mangoRepoLib = (0, _index2.default)(host, port, mangoAddress, account);

  return mangoRepoLib.refs().then(function (refs) {
    refs.map(function (ref) {
      console.log('Reference: ' + ref.name + ' -> ' + ref.ref);
    });
  }).then(function () {
    return mangoRepoLib.snapshots();
  }).then(function (snapshots) {
    snapshots.map(function (snapshot, i) {
      console.log('Snapshot #' + i + ' -> ' + snapshot);
    });
  });
}

function mangoIssues(mangoAddress, account) {
  var host = argv.host,
      port = argv.port;


  var mangoRepoLib = (0, _index2.default)(host, port, mangoAddress, account);

  return mangoRepoLib.issues().then(function (issues) {
    issues.map(function (issue, id) {
      if (issue) {
        console.log('Issue #' + id + ' -> ' + issue);
      }
    });
  });
}

function mangoGetIssue(mangoAddress, account) {
  var host = argv.host,
      port = argv.port,
      id = argv.id;


  var mangoRepoLib = (0, _index2.default)(host, port, mangoAddress, account);
  var editor = new _issueEditor2.default();

  return mangoRepoLib.getIssue(id).then(function (hash) {
    return swarm.download(hash);
  }).then(function (buf) {
    return console.log(buf.toString());
  });
}

function mangoNewIssue(mangoAddress, account) {
  var host = argv.host,
      port = argv.port;


  var mangoRepoLib = (0, _index2.default)(host, port, mangoAddress, account);
  var editor = new _issueEditor2.default();

  return mangoRepoLib.issueCount().then(function (count) {
    var id = count.toNumber();

    return editor.edit(ISSUES_DIR + id + '.txt').then(function (buf) {
      return swarm.upload(buf);
    }).then(function (hash) {
      return mangoRepoLib.newIssue(hash);
    }).then(function (hash) {
      return console.log('[new] Issue #' + id + ' -> ' + hash);
    });
  });
}

function mangoEditIssue(mangoAddress, account) {
  var host = argv.host,
      port = argv.port,
      id = argv.id;


  var mangoRepoLib = (0, _index2.default)(host, port, mangoAddress, account);
  var editor = new _issueEditor2.default();

  return mangoRepoLib.getIssue(id).then(function (hash) {
    return swarm.download(hash);
  }).then(function (buf) {
    return editor.edit(ISSUES_DIR + id + '.txt', buf.toString());
  }).then(function (buf) {
    return swarm.upload(buf);
  }).then(function (hash) {
    return mangoRepoLib.setIssue(id, hash);
  }).then(function (hash) {
    return console.log('[edit] Issue #' + id + ' -> ' + hash);
  });
}

function mangoDeleteIssue(mangoAddress, account) {
  var host = argv.host,
      port = argv.port,
      id = argv.id;


  var mangoRepoLib = (0, _index2.default)(host, port, mangoAddress, account);
  var editor = new _issueEditor2.default();

  return mangoRepoLib.deleteIssue(id).then(function (id) {
    return console.log('[delete] Issue #' + id);
  });
}

function mangoFork() {
  console.log('Forking Mango repository...');

  var path = argv.path;


  var forkIgnore = ['.mango', 'node_modules'];

  var filter = function filter(name) {
    return forkIgnore.reduce(function (acc, file) {
      return acc && !~name.indexOf(file);
    }, true);
  };

  _fsExtra2.default.copy('.', path, { filter: filter }, function (err) {
    if (err) {
      console.error(err);
    } else {
      console.log('Mango repository forked to ' + path);

      _shelljs2.default.cd(path);

      if (_shelljs2.default.exec('git remote rm origin').code !== 0) {
        _shelljs2.default.echo('Error: Git remote rm failed');
        _shelljs2.default.exit(1);
      }
    }
  });
}

function mangoMergeFork() {
  console.log('Merging fork into Mango repository...');

  var path = argv.path;


  if (_shelljs2.default.exec('git remote add fork ' + path).code !== 0) {
    _shelljs2.default.echo('Error: Git remote add failed');
    _shelljs2.default.exit(1);
  }

  if (_shelljs2.default.exec('git fetch fork').code !== 0) {
    _shelljs2.default.echo('Error: Git fetch failed');
    _shelljs2.default.exit(1);
  }

  if (_shelljs2.default.exec('git merge --no-ff --no-commit --allow-unrelated-histories fork/master').code !== 0) {
    _shelljs2.default.echo('Error: Git merge failed');
    _shelljs2.default.exit(1);
  }

  if (_shelljs2.default.exec('git reset HEAD .mango').code !== 0) {
    _shelljs2.default.echo('Error: Git reset failed');
    _shelljs2.default.exit(1);
  }

  if (_shelljs2.default.exec('git checkout -- .mango').code !== 0) {
    _shelljs2.default.echo('Error: Git checkout failed');
    _shelljs2.default.exit(1);
  }

  if (_shelljs2.default.exec('git commit -m \"merged fork/master\"').code !== 0) {
    _shelljs2.default.echo('Error: Git commit failed');
    _shelljs2.default.exit(1);
  }

  if (_shelljs2.default.exec('git remote rm fork').code !== 0) {
    _shelljs2.default.echo('Error: Git remote rm failed');
    _shelljs2.default.exit(1);
  }

  console.log('Fork merged into Mango repository.');
}

function mangoPullRequests(mangoAddress, account) {
  var host = argv.host,
      port = argv.port;


  var mangoRepoLib = (0, _index2.default)(host, port, mangoAddress, account);

  return mangoRepoLib.pullRequests().then(function (pullRequests) {
    pullRequests.map(function (pullRequest, i) {
      if (pullRequest != '0x0000000000000000000000000000000000000000') {
        console.log('Pull Request #' + i + ' -> ' + pullRequest);
      }
    });
  });
}

function mangoGetPullRequest(mangoAddress, account) {
  var host = argv.host,
      port = argv.port,
      id = argv.id;


  var mangoRepoLib = (0, _index2.default)(host, port, mangoAddress, account);

  return mangoRepoLib.getPullRequest(id).then(function (forkAddress) {
    return console.log('Pull Request #' + id + ' -> ' + forkAddress);
  });
}

function mangoOpenPullRequest(mangoAddress, account) {
  var host = argv.host,
      port = argv.port,
      issueId = argv.issueId,
      forkAddress = argv.forkAddress;


  var mangoRepoLib = (0, _index2.default)(host, port, mangoAddress, account);

  return mangoRepoLib.openPullRequest(issueId, forkAddress).then(function (id) {
    return console.log('[opened] Pull Request #' + id + ' for issue #' + issueId + ' -> ' + forkAddress);
  });
}

function mangoClosePullRequest(mangoAddress, account) {
  var host = argv.host,
      port = argv.port,
      id = argv.id;


  var mangoRepoLib = (0, _index2.default)(host, port, mangoAddress, account);

  return mangoRepoLib.closePullRequest(id).then(function (id) {
    return console.log('[closed] Pull Request #' + id);
  });
}

// CLI

var argv = args.argv;


if (argv._.length === 0) {
  args.showHelp();
}

var command = argv._[0];

switch (command) {

  case 'init':
    ensureGitRepo().then(function () {
      return getAccount();
    }).then(function (account) {
      return mangoInit(account);
    }).catch(function (err) {
      return console.error(err);
    });

    break;

  case 'status':
    ensureMangoRepo().then(function () {
      return Promise.all([getMangoAddress(), getAccount()]);
    }).then(function (values) {
      return mangoStatus(values[0], values[1]);
    }).catch(function (err) {
      return console.error(err);
    });

    break;

  case 'issues':
    ensureMangoRepo().then(function () {
      return Promise.all([getMangoAddress(), getAccount()]);
    }).then(function (values) {
      return mangoIssues(values[0], values[1]);
    }).catch(function (err) {
      return console.error(err);
    });

    break;

  case 'get-issue':
    {
      ensureMangoRepo().then(function () {
        return Promise.all([getMangoAddress(), getAccount()]);
      }).then(function (values) {
        return mangoGetIssue(values[0], values[1]);
      }).catch(function (err) {
        return console.error(err);
      });

      break;
    }

  case 'new-issue':
    ensureMangoRepo().then(function () {
      return Promise.all([getMangoAddress(), getAccount()]);
    }).then(function (values) {
      return mangoNewIssue(values[0], values[1]);
    }).catch(function (err) {
      return console.error(err);
    });

    break;

  case 'edit-issue':
    ensureMangoRepo().then(function () {
      return Promise.all([getMangoAddress(), getAccount()]);
    }).then(function (values) {
      return mangoEditIssue(values[0], values[1]);
    }).catch(function (err) {
      return console.error(err);
    });

    break;

  case 'delete-issue':
    ensureMangoRepo().then(function () {
      return Promise.all([getMangoAddress(), getAccount()]);
    }).then(function (values) {
      return mangoDeleteIssue(values[0], values[1]);
    }).catch(function (err) {
      return console.error(err);
    });

    break;

  case 'fork':
    ensureMangoRepo().then(function () {
      return mangoFork();
    }).catch(function (err) {
      return console.error(err);
    });

    break;

  case 'merge-fork':
    ensureMangoRepo().then(function () {
      return mangoMergeFork();
    }).catch(function (err) {
      return console.error(err);
    });

    break;

  case 'pull-requests':
    ensureMangoRepo().then(function () {
      return Promise.all([getMangoAddress(), getAccount()]);
    }).then(function (values) {
      return mangoPullRequests(values[0], values[1]);
    }).catch(function (err) {
      return console.error(err);
    });

    break;

  case 'get-pull-request':
    ensureMangoRepo().then(function () {
      return Promise.all([getMangoAddress(), getAccount()]);
    }).then(function (values) {
      return mangoGetPullRequest(values[0], values[1]);
    }).catch(function (err) {
      return console.error(err);
    });

    break;

  case 'open-pull-request':
    ensureMangoRepo().then(function () {
      return Promise.all([getMangoAddress(), getAccount()]);
    }).then(function (values) {
      return mangoOpenPullRequest(values[0], values[1]);
    }).catch(function (err) {
      return console.error(err);
    });

    break;

  case 'close-pull-request':
    ensureMangoRepo().then(function () {
      return Promise.all([getMangoAddress(), getAccount()]);
    }).then(function (values) {
      return mangoClosePullRequest(values[0], values[1]);
    }).catch(function (err) {
      return console.error(err);
    });

    break;

  default:
    break;
}