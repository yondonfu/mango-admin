import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { spawn } from 'child_process';

export default class IssueEditor {
  constructor(editor) {
    this.editor = editor || process.env.EDITOR || 'vi';
  }

  ensureDir(file) {
    return new Promise((resolve, reject) => {
      mkdirp(path.dirname(file), err => {
        if (err) {
          reject(err);
        } else {
          resolve(file);
        }
      });
    });
  }

  writeTemplate(file) {
    const id = path.basename(file, '.txt');
    const template = 'Issue #' + id;

    return new Promise((resolve, reject) => {
      fs.writeFile(file, template, err => {
        if (err) {
          reject(err);
        } else {
          resolve(file);
        }
      });
    });
  }

  listDir(dir) {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    });
  }

  nextId(dir) {
    return this.listDir(dir)
      .then(files => files.length === 0 ? 0 : Math.max.apply(Math, files.map(file => path.basename(file, '.txt'))) + 1);
  }

  list(dir) {
    return this.listDir(dir)
      .then(files => files.map(file => 'Issue #' + path.basename(file, '.txt')));
  }

  new(file) {
    return this.ensureDir(file)
      .then(file => this.writeTemplate(file))
      .then(file => this.editFile(file));
  }

  edit(file) {
    return this.ensureDir(file)
      .then(file => this.editFile(file));
  }

  editFile(file) {
    return new Promise((resolve, reject) => {
      spawn(this.editor, [file], {
        stdio: 'inherit'
      }).on('exit', code => {
        if (code !== 0) {
          reject(new Error(`${this.editor} had a non zero exit code: ${code}`));
        } else {
          resolve(file);
        }
      });
    });
  }

  delete(file) {
    return new Promise((resolve, reject) => {
      fs.unlink(file, err => {
        if (err) {
          reject(err);
        } else {
          resolve(file);
        }
      });
    });
  }

  read(file) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf-8', (err, content) => {
        if (err) {
          reject(err);
        } else {
          resolve(content);
        }
      });
    });
  }

  newAndRead(file) {
    return this.new(file)
      .then(file => this.read(file))
      .then(content => content);
  }

  editAndRead(file) {
    return this.edit(file)
      .then(file => this.read(file))
      .then(content => content);
  }
}
