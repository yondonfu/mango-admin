#!/usr/bin/env node

import yargs from 'yargs';
import mkdirp from 'mkdirp';
import fs from 'fs';
import Web3 from 'Web3';
import { default as initLib } from '../index';
import IssueEditor from '../lib/issueEditor';

const RPC_HOST = 'localhost';
const RPC_PORT = '8545';

const CONTRACT_DIR = '.mango/contract;';
const ISSUES_DIR = '.mango/issues/';

const provider = new Web3.providers.HttpProvider(`http:\/\/${RPC_HOST}:${RPC_PORT}`);
const web3 = new Web3(provider);

const args = yargs
      .option('host', {
        description: 'HTTP host of Ethereum node',
        alias: 'h',
        default: RPC_HOST
      })
      .option('port', {
        description: 'HTTP port of Ethereum node',
        alias: 'p',
        default: RPC_PORT
      })
      .option('account', {
        description: 'Sender account',
        alias: 'a',
        type: 'string'
      })
      .command('init', 'Create a Mango repository')
      .command('status', 'Check the status of a Mango repository')
      .command('list-issues', 'List issues for a Mango repository')
      .command('show-issue <id>', 'Show issue for a Mango repository')
      .command('create-issue', 'Create issue for a Mango repository')
      .command('edit-issue <id>', 'Edit issue for a Mango repository')
      .command('delete-issue <id>', 'Delete issue for a Mango repository')
      .help()
      .usage('Usage: $0 [command]');

const { argv } = args;

if (argv._.length === 0) {
  args.showHelp();
}

const command = argv._[0];


function getAccount() {
  return new Promise((resolve, reject) => {
    web3.eth.getAccounts((err, accounts) => {
      if (err != null) {
        reject(err);
      } else {
        resolve(accounts[0]);
      }
    });
  });
}

function ensureGitRepo() {
  return new Promise((resolve, reject) => {
    fs.stat('.git', (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

function getMangoAddress() {
  return new Promise((resolve, reject) => {
    fs.readFile('.mango/contract', 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function ensureMangoRepo() {
  return ensureGitRepo()
    .then(() => getMangoAddress());
}

function initMango(address) {
  mkdirp('.mango/issues', err => {
    if (err) {
      console.error(err);
      return;
    } else {
      fs.writeFile('.mango/contract', address, err => {
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

switch (command) {

  case 'init':
    ensureGitRepo()
      .then(() => getAccount(), err => console.log('Need to be in a Git repository.'))
      .then(account => {
        console.log('Creating new Mango repository with maintainer ' + account);

        const { host, port } = argv;

        const mangoRepoLib = initLib(host, port, null, account);
        mangoRepoLib.create()
          .then(address => {
            console.log('Mango repository created: ' + address);
            initMango(address);
          });
      });

    break;

  case 'status':
    ensureMangoRepo()
      .then(address => getAccount(), err => console.log('Need to be in a Mango repository.'))
      .then(account => {
        const { host, port } = argv;

        const mangoRepoLib = initLib(host, port, address, account);
        mangoRepoLib.refs().then(refs => {
          console.log(refs);
        }, err => {
          console.log(err);
        });

        mangoRepoLib.snapshots().then(snapshots => {
          console.log(snapshots);
        }, err => {
          console.log(err);
        });
      });

    break;

  case 'list-issues': {
    ensureMangoRepo()
      .then(() => {
        const editor = new IssueEditor();

        editor.list(ISSUES_DIR).then(issues => {
          if (issues.length === 0) {
            console.log('No issues');
          } else {
            issues.map(issue => console.log(issue));
          }
        });
      }, err => {
        console.log('Need to be in an in a Mango repository.');
      });

    break;
  }

  case 'show-issue': {
    ensureMangoRepo()
      .then(() => {
        const editor = new IssueEditor();
        const id = argv.id;

        editor.read(ISSUES_DIR + id + '.txt')
          .then(content => console.log(content));
      });

    break;
  }

  case 'create-issue':
    ensureMangoRepo()
      .then(() => {
        const editor = new IssueEditor();

        editor.nextId(ISSUES_DIR)
          .then(nextId => editor.newAndRead(ISSUES_DIR + nextId + '.txt'))
          .then(content => console.log(content));
      });

    break;

  case 'edit-issue':
    ensureMangoRepo()
      .then(() => {
        const editor = new IssueEditor();
        const id = argv.id;

        editor.editAndRead(ISSUES_DIR + id + '.txt')
          .then(content => console.log(content));
      });

    break;

  case 'delete-issue':
    ensureMangoRepo()
      .then(() => {
        const editor = new IssueEditor();
        const id = argv.id;

        editor.delete(ISSUES_DIR + id + '.txt')
          .then(file => console.log('Deleted issue #' + id + ' -> ' + file));
      });

    break;

  default:
    break;
}
