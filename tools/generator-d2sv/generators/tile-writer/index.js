/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseTileGenerator = require("../../shared/base.tile.generator"), _ = require("../../shared/lodash-complete");

module.exports = class extends BaseTileGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.prompts = _.clone(opts.prompts || {});
  }
  async initializing() {
    await super.initializing();
  }
  writing() {
    this._addTileDefinition(this.prompts);
  }
};