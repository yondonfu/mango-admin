/*
 * Mango Repository
 * Copyright (C) 2016 Alex Beregszaszi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License only.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
pragma solidity ^0.4.8;

import "./MangoRepoInterface.sol";

contract MangoRepo is MangoRepoInterface {
    mapping (address => bool) maintainers;

    string[] refKeys;
    mapping (string => string) refs;

    string[] snapshots;

    string[] issues;
    mapping (uint => address) issueCreators;

    modifier maintainerOnly {
      if (!maintainers[msg.sender]) throw;
      _;
    }

    modifier creatorOrMaintainerOnly(uint id) {
      if (issueCreators[id] != msg.sender && !maintainers[msg.sender]) throw;
      _;
    }

    function MangoRepo() {
      maintainers[msg.sender] = true;
    }

    function repoInterfaceVersion() constant returns (uint version) {
      version = 1;
    }

    function refCount() constant returns (uint) {
      return refKeys.length;
    }

    function refName(uint index) constant returns (string ref) {
      ref = refKeys[index];
    }

    function getRef(string ref) constant returns (string hash) {
      hash = refs[ref];
    }

    fun
      ction __findRef(string ref) private returns (int) {
      /* Horrible way to add a new key to the list */

      for (var i = 0; i < refKeys.length; i++)
        if (strEqual(refKeys[i], ref))
          return i;

      return -1;
    }

    function setRef(string ref, string hash) committerOnly {
      if (__findRef(ref) == -1)
        refKeys.push(ref);

      refs[ref] = hash;
    }

    function deleteRef(string ref) committerOnly {
      int pos = __findRef(ref);
      if (pos != -1) {
        // FIXME: shrink the array?
        refKeys[uint(pos)] = "";
      }

      // FIXME: null? string(0)?
      refs[ref] = "";
    }

    function strEqual(string a, string b) private returns (bool) {
      return sha3(a) == sha3(b);
    }

    function snapshotCount() constant returns (uint) {
      return snapshots.length;
    }

    function getSnapshot(uint index) constant returns (string) {
      return snapshots[index];
    }

    function addSnapshot(string hash) committerOnly {
      snapshots.push(hash);
    }

    function issueCount() constant returns (uint count) {
      return issues.length;
    }

    function getIssue(uint id) constant returns (string hash) {
      if (id >= issues.length || id < 0) throw;
      if (bytes(issues[id]).length == 0) throw;

      return issues[id];
    }

    function createIssue(string hash) {
      issues.push(hash);
      issueCreators[issues.length - 1] = msg.sender;
    }

    function deleteIssue(uint id) creatorOrMaintainerOnly(id) {
      if (id >= issues.length || id < 0) throw;
      if (bytes(issues[id]).length == 0) throw;

      issues[id] = "";
    }
}
