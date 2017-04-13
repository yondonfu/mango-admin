#!/usr/bin/env node

import yargs from 'yargs';
import mkdirp from 'mkdirp';
import fs from 'fs';
import Web3 from 'Web3';

import { default as initLib } from '../index';
import IssueEditor from '../lib/issueEditor';
import Swarm from 'swarm-js';

const swarm = Swarm.at('http://swarm-gateways.net');

const RPC_HOST = 'localhost';
const RPC_PORT = '8545';

const CONTRACT_DIR = '.mango/contract/;';
const ISSUES_DIR = '.mango/issues/';

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
      .command('issues', 'List issues for a Mango repository')
      .command('get-issue <id>', 'Get a issue for a Mango repository')
      .command('new-issue', 'Create a new issue for a Mango repository')
      .command('edit-issue <id>', 'Edit an issue for a Mango repository')
      .command('delete-issue <id>', 'Delete issue for a Mango repository')
      .help()
      .usage('Usage: $0 [command]');



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

function getAccount() {
  const { host, port } = argv;

  const provider = new Web3.providers.HttpProvider(`http:\/\/${host}:${port}`);
  const web3 = new Web3(provider);

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

function mangoInit(account) {
  console.log('Creating new Mango repository with maintainer: ' + account);

  const { host, port } = argv;

  const mangoRepoLib = initLib(host, port, null, account);

  return mangoRepoLib.init()
    .then(address => {
      console.log('Mango repository created: ' + address);
      setMango(address);
    }).catch(err => console.error(err));
}

function mangoStatus(mangoAddress, account) {
  console.log('Mango repostitory status:');

  const { host, port } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);

  return mangoRepoLib.refs()
    .then(refs => console.log(refs))
    .then(() => mangoRepoLib.snapshots())
    .then(snapshots => console.log(snapshots));
}

function mangoIssues(mangoAddress, account) {
  const { host, port } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);

  return mangoRepoLib.issues().then(issues => {
    issues.map((issue, id) => console.log('Issue #' + id + ' -> ' + issue));
  });
}

function mangoGetIssue(mangoAddress, account) {
  const { host, port, id } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);
  const editor = new IssueEditor();

  return mangoRepoLib.getIssue(id)
    .then(hash => swarm.download(hash))
    .then(buf => console.log(buf.toString()));
  }

function mangoNewIssue(mangoAddress, account) {
  const { host, port } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);
  const editor = new IssueEditor();

  return mangoRepoLib.issueCount()
    .then(count => {
      const id = count.toNumber();

      return editor.edit(ISSUES_DIR + id + '.txt')
        .then(buf => swarm.upload(buf))
        .then(hash => mangoRepoLib.newIssue(hash))
        .then(hash => console.log('[new] Issue #' + id + ' -> ' + hash));
      });
}

function mangoEditIssue(mangoAddress, account) {
  const { host, port, id } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);
  const editor = new IssueEditor();

  return mangoRepoLib.getIssue(id)
    .then(hash => swarm.download(hash))
    .then(buf => editor.edit(ISSUES_DIR + id + '.txt', buf.toString()))
    .then(buf => swarm.upload(buf))
    .then(hash => mangoRepoLib.setIssue(id, hash))
    .then(hash => console.log('[edit] Issue #' + id + ' -> ' + hash));
}

function mangoDeleteIssue(mangoAddress, account) {
  const { host, port, id } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);
  const editor = new IssueEditor();

  return mangoRepoLib.deleteIssue(id)
    .then(id => console.log('[delete] Issue #' + id));
}

// CLI

const { argv } = args;

if (argv._.length === 0) {
  args.showHelp();
}

const command = argv._[0];

switch (command) {

  case 'init':
    ensureGitRepo()
      .then(() => getAccount())
      .then(account => mangoInit(account))
      .catch(err => console.error(err));

    break;

  case 'status':
    ensureMangoRepo()
      .then(() => Promise.all([getMangoAddress(), getAccount()]))
      .then(values => mangoStatus(values[0], values[1]))
      .catch(err => console.error(err));

    break;

  case 'issues':
    ensureMangoRepo()
      .then(() => Promise.all([getMangoAddress(), getAccount()]))
      .then(values => mangoIssues(values[0], values[1]))
      .catch(err => console.error(err));

    break;

  case 'get-issue': {
    ensureMangoRepo()
      .then(() => Promise.all([getMangoAddress(), getAccount()]))
      .then(values => mangoGetIssue(values[0], values[1]))
      .catch(err => console.error(err));

    break;
  }

  case 'new-issue':
    ensureMangoRepo()
      .then(() => Promise.all([getMangoAddress(), getAccount()]))
      .then(values => mangoNewIssue(values[0], values[1]))
      .catch(err => console.error(err));

    break;

  case 'edit-issue':
    ensureMangoRepo()
      .then(() => Promise.all([getMangoAddress(), getAccount()]))
      .then(values => mangoEditIssue(values[0], values[1]))
      .catch(err => console.error(err));

    break;

  case 'delete-issue':
    ensureMangoRepo()
      .then(() => Promise.all([getMangoAddress(), getAccount()]))
      .then(values => mangoDeleteIssue(values[0], values[1]))
      .catch(err => console.error(err));

    break;

  default:
    break;
}
