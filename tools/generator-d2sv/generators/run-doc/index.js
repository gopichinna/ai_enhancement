/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
const Generator = require("yeoman-generator");

const chalk = require("chalk");

const fs = require("fs");

const path = require("path");

const yosay = require("yosay");

const _ = require("../../shared/lodash-complete");

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }
  end() {
    this.spawnCommand("npm", [ "run", "documentation" ]);
  }
};