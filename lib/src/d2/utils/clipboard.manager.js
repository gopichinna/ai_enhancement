/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  "use strict";
  return {
    storeCopiedItems: function(copiedItems) {
      if (this._storeItems(copiedItems)) {
        this.operation = "copy";
        return true;
      }
      return false;
    },
    storeCutItems: function(cutItems) {
      if (this._storeItems(cutItems)) {
        this.operation = "cut";
        return true;
      }
      return false;
    },
    getOperation: function() {
      return this.operation;
    },
    getStoredItems: function() {
      return this.storedItems;
    },
    clear: function() {
      delete this.storedItems;
      delete this.operation;
    },
    isClipboardEmpty: function() {
      return !this.storedItems;
    },
    _storeItems: function(items) {
      if (!items || items.length === 0) {
        return false;
      }
      this.storedItems = items;
      return true;
    }
  };
});