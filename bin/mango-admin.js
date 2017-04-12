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
        reject(new Error('Need to be in a Git repository.'));
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
        reject(new Error('Need to be in a Mango repository.'));
      } else {
        resolve(data);
      }
    });
  });
}

function ensureMangoRepo() {
  return ensureGitRepo()
    .then(getMangoAddress());
}

function setMango(address) {
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

function mangoInit(account) {
  console.log('Creating new Mango repository with maintainer' + account);

  const { host, port } = argv;
  const mangoRepoLib = initLib(host, port, null, account);

  mangoRepoLib.create()
    .then(address => {
      console.log('Mango repository created: ' + address);
      setMango(address);
    }).catch(err => console.error(err));
}

function mangoStatus(address, account) {
  const { host, port } = argv;

  const mangoRepoLib = initLib(host, port, address, account);

  return mangoRepoLib.refs()
    .then(refs => console.log(refs))
    .then(() => mangoRepoLib.snapshots())
    .then(snapshots => console.log(snapshots));
}

function mangoListIssues() {
  const editor = new IssueEditor();

  return editor.list(ISSUES_DIR)
    .then(issues => {
      if (issues.length === 0) {
        console.log('No issues.');
      } else {
        issues.map(issue => console.log(issue));
      }
    });
}

function mangoShowIssue() {
  const editor = new IssueEditor();
  const id = argv.id;

  return editor.read(ISSUES_DIR + id + '.txt')
    .then(content => console.log(content));
}

function mangoCreateIssue() {
  const editor = new IssueEditor();

  return editor.nextId(ISSUES_DIR)
    .then(id => editor.newAndRead(ISSUES_DIR + id + '.txt'))
    .then(content => console.log(content));
}

function mangoEditIssue() {
  const editor = new IssueEditor();
  const id = argv.id;

  return editor.editAndRead(ISSUES_DIR + id + '.txt')
    .then(content => console.log(content));
}

function mangoDeleteIssue() {
  const editor = new IssueEditor();
  const id = argv.id;

  return editor.delete(ISSUES_DIR + id + '.txt')
    .then(file => console.log('Deleted issue #' + id + ' -> ' + file));
}

switch (command) {

  case 'init':
    ensureGitRepo()
      .then(() => getAccount())
      .then(account => mangoInit(account))
      .catch(err => console.error(err));

    break;

  case 'status':
    ensureMangoRepo()
      .then(() => Promise.all([getAccount(), getMangoAddress()]))
      .then(values => mangoStatus(values[0], values[1]))
      .catch(err => console.error(err));

    break;

  case 'list-issues': {
    ensureMangoRepo()
      .then(() => mangoListIssues())
      .catch(err => console.error(err));

    break;
  }

  case 'show-issue': {
    ensureMangoRepo()
      .then(() => mangoShowIssue())
      .catch(err => console.error(err));

    break;
  }

  case 'create-issue':
    ensureMangoRepo()
      .then(() => mangoCreateIssue())
      .catch(err => console.error(err));

    break;

  case 'edit-issue':
    ensureMangoRepo()
      .then(() => mangoEditIssue())
      .catch(err => console.error(err));

    break;

  case 'delete-issue':
    ensureMangoRepo()
      .then(() => mangoDeleteIssue())
      .catch(err => console.error(err));

    break;

  default:
    break;
}
