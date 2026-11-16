/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/base", "csui/controls/toolbar/toolitem.model" ], function(_, Backbone, Marionette, base, ToolItemModel) {
  "use strict";
  var ToolItemsFactory = Marionette.Object.extend({
    constructor: function ToolItemsFactory(toolItemDefinitions, options) {
      this.collection = new Backbone.Collection([], {
        model: ToolItemModel
      });
      this.runsInTouchBrowser = options && options.runsInTouchBrowser !== undefined ? options.runsInTouchBrowser : base.isTouchBrowser();
      if (toolItemDefinitions instanceof ToolItemsFactory) {
        this.collection.reset(toolItemDefinitions.collection.toJSON());
      } else {
        this.set(toolItemDefinitions);
      }
      Marionette.Object.prototype.constructor.call(this, options);
      this.storeSnapshot();
    },
    clone: function() {
      const clone = new ToolItemsFactory(this, this.options);
      if (this._originalCollection) {
        clone.storeSnapshot();
      }
      return clone;
    },
    storeSnapshot() {
      if (snapshotDiffers(this)) {
        this._originalCollection = this.collection.clone();
      }
    },
    restoreSnapshot(options) {
      if (snapshotDiffers(this)) {
        this.collection.reset(this._originalCollection.models, options);
      }
    },
    set: function(tooItemDefinitions) {
      if (_.isArray(tooItemDefinitions)) {
        _.each(tooItemDefinitions, function(toolItemDefinition) {
          this._setToolItemDefinition(toolItemDefinition);
        }, this);
      } else {
        this._setToolItemDefinition(tooItemDefinitions);
      }
    },
    hasItem(signature) {
      return !!this.collection.find(item => item.get("signature") === signature);
    },
    addItem: function(newToolItem, options = {}) {
      var group = newToolItem.get("group");
      var foundGroup = false;
      var prevToolItemIndex;
      if (newToolItem.get("onlyInTouchBrowser")) {
        if (this.runsInTouchBrowser) {
          return;
        }
      }
      this.collection.find(function(toolItem, index) {
        if (toolItem.get("group") === group) {
          foundGroup = true;
        } else {
          if (foundGroup) {
            prevToolItemIndex = index;
            return true;
          }
        }
      });
      const silent = options.silent;
      if (foundGroup && prevToolItemIndex) {
        this.collection.add(newToolItem, {
          at: prevToolItemIndex,
          silent: silent
        });
      } else if (options.index > -1) {
        this.collection.add(newToolItem, {
          at: options.index,
          silent: silent
        });
      } else {
        this.collection.add(newToolItem, {
          silent: silent
        });
      }
    },
    reset: function(models) {
      this.collection.reset(models);
    },
    getCollection: function() {
      return this.collection;
    },
    _setToolItemDefinition: function(toolItemDefinition) {
      var runsInTouchBrowser = this.runsInTouchBrowser;
      if (this.collection.length === 0) {
        var toolItemsFlat = [];
        _.each(toolItemDefinition, function(toolItems, key) {
          toolItemsFlat.push({
            signature: "disabled",
            group: key
          });
          _.each(toolItems, function(toolItem) {
            if (!toolItem.onlyInTouchBrowser || runsInTouchBrowser) {
              if (!toolItem.group) {
                _.extend(toolItem, {
                  group: key
                });
              }
              toolItemsFlat.push(toolItem);
            }
          });
        });
        this.collection.reset(toolItemsFlat);
      } else {}
    }
  }, {
    cloneToolbarItems(toolbarItems) {
      return Object.keys(toolbarItems).reduce((result, toolbarName) => {
        const factory = toolbarItems[toolbarName];
        if (factory instanceof ToolItemsFactory) {
          result[toolbarName] = factory.clone();
        }
        return result;
      }, {});
    },
    storeToolbarItemsSnapshots(toolbarItems) {
      for (const toolbarName in toolbarItems) {
        const factory = toolbarItems[toolbarName];
        if (factory instanceof ToolItemsFactory) {
          toolbarItems[toolbarName].storeSnapshot();
        }
      }
    }
  });
  function snapshotDiffers(factory) {
    const {
      _originalCollection
    } = factory;
    return !_originalCollection || _originalCollection.length === factory.collection.length;
  }
  return ToolItemsFactory;
});