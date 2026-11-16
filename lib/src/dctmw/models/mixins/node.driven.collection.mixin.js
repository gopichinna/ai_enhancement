/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Model
} from "nuc/lib/backbone";

function nodeChangeListener() {
  this._driverNodeChange = true;
  this.reset([]);
  _.isFunction(this.invalidateFetch) && this.invalidateFetch();
}

const NodeDrivenCollectionMixin = {
  mixin(prototype) {
    const originalFetch = prototype.fetch;
    Object.assign(prototype, {
      makeNodeDriven(options = {}) {
        this.node ??= options.node;
        if (!this.node) {
          throw new Error(`Driver node missing in instance of ${this.constructor.name}[cid=${this.cid}]`);
        }
        this.listenTo(this.node, "change:id", nodeChangeListener).listenTo(this, "sync", () => {
          this._driverNodeChange = false;
        });
        return this;
      },
      resetDriverNode(node) {
        if (node instanceof Model && this.node !== node) {
          this.stopListening(this.node);
          this.node = node;
          this.listenTo(this.node, "change:id", nodeChangeListener);
          nodeChangeListener.call(this);
        }
      },
      fetch(options = {}) {
        if (this._driverNodeChange === true) {
          Object.assign(options, {
            reload: true,
            skipSWCache: true
          });
        }
        return originalFetch && originalFetch.call(this, options);
      }
    });
  }
};

export default NodeDrivenCollectionMixin;