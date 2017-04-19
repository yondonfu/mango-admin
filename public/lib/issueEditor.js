'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var IssueEditor = function () {
  function IssueEditor(editor) {
    _classCallCheck(this, IssueEditor);

    this.editor = editor || process.env.EDITOR || 'vi';
  }

  _createClass(IssueEditor, [{
    key: 'ensureDir',
    value: function ensureDir(file) {
      return new Promise(function (resolve, reject) {
        (0, _mkdirp2.default)(_path2.default.dirname(file), function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(file);
          }
        });
      });
    }
  }, {
    key: 'writeFile',
    value: function writeFile(file) {
      var content = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      var id = _path2.default.basename(file, '.txt');

      if (!content) {
        content = 'Issue #' + id + '\n\n';
      }

      return new Promise(function (resolve, reject) {
        _fs2.default.writeFile(file, content, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(file);
          }
        });
      });
    }
  }, {
    key: 'deleteFile',
    value: function deleteFile(file) {
      return new Promise(function (resolve, reject) {
        _fs2.default.unlink(file, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(file);
          }
        });
      });
    }
  }, {
    key: 'readFile',
    value: function readFile(file) {
      return new Promise(function (resolve, reject) {
        _fs2.default.readFile(file, function (err, content) {
          if (err) {
            reject(err);
          } else {
            resolve({ file: file, content: content });
          }
        });
      });
    }
  }, {
    key: 'editFile',
    value: function editFile(file) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        (0, _child_process.spawn)(_this.editor, [file], {
          stdio: 'inherit'
        }).on('exit', function (code) {
          if (code !== 0) {
            reject(new Error(_this.editor + ' had a non zero exit code: ' + code));
          } else {
            resolve(file);
          }
        });
      });
    }
  }, {
    key: 'edit',
    value: function edit(file) {
      var _this2 = this;

      var content = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      return this.ensureDir(file).then(function (file) {
        return _this2.writeFile(file, content);
      }).then(function (file) {
        return _this2.editFile(file);
      }).then(function (file) {
        return _this2.readFile(file);
      }).then(function (_ref) {
        var file = _ref.file,
            content = _ref.content;
        return _this2.deleteFile(file).then(function () {
          return content;
        });
      });
    }
  }]);

  return IssueEditor;
}();

exports.default = IssueEditor;