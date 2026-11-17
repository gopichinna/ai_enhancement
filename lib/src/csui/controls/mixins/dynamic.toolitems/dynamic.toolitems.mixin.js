/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/utils/log" ], function(module, _, log) {
  "use strict";
  log = log(module.id);
  var DynamicToolItemsMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeDynamicToolItems(options) {
          let {
            model,
            collection
          } = options;
          if (!model) {
            model = collection;
          }
          this._requestUpdateToolbars({
            silent: true,
            ...options
          });
          if (model && model.delayedActions) {
            this.listenTo(model, "sync", () => {
              this._restoreToolbars(options);
              this._requestUpdateToolbars(options);
            });
            this.listenTo(model, "update:actions:delayed", () => this._requestUpdateToolbars(options));
            this.listenTo(model, "update:actions:lazy", () => this._requestUpdateToolbars(options));
          }
        },
        _restoreToolbars({
          toolbarItems,
          toolbarNames,
          silent
        }) {
          for (const toolbarName of toolbarNames) {
            toolbarItems[toolbarName].restoreSnapshot({
              silent: silent
            });
          }
        },
        async _requestUpdateToolbars({
          silent,
          toolbarItems,
          toolbarNames,
          eventArgs
        }) {
          const promises = toolbarNames.map(toolbarName => this._requestUpdateToolbar({
            toolbarName: toolbarName,
            toolItemFactory: toolbarItems[toolbarName],
            eventArgs: eventArgs
          }).then(toolItems => ({
            [toolbarName]: toolItems
          })));
          const toolItemsArray = await Promise.all(promises);
          const toolItemsObject = Object.assign({}, ...toolItemsArray);
          for (const toolbarName in toolItemsObject) {
            const toolItemFactory = toolbarItems[toolbarName];
            const toolItems = toolItemsObject[toolbarName];
            if (toolItems.length) {
              for (const toolItem of toolItems) {
                toolItemFactory.addItem(toolItem, {
                  silent: true
                });
              }
              log.debug("update toolbar {0}: {1}, count: {2}", toolbarName, !silent, toolItems.length) && console.log(log.last);
              if (!silent) {
                toolItemFactory.collection.trigger("update", toolItemFactory.collection);
              }
            } else {
              log.debug("update toolbar {0}: no items", toolbarName) && console.log(log.last);
            }
          }
        },
        async _requestUpdateToolbar({
          toolbarName,
          toolItemFactory,
          eventArgs
        }) {
          const promises = [];
          this.triggerMethod("before:updateToolbar", {
            ...eventArgs,
            toolbarName: toolbarName,
            toolItemFactory: toolItemFactory,
            async() {
              let done, called = 0;
              promises.push(new Promise(resolve => done = resolve));
              return arg => {
                called++;
                called > 1 && log.warn("done was called multiple times: {0}", called) && console.warn(log.last);
                return done(arg);
              };
            }
          });
          const toolItemsArray = await Promise.all(promises);
          const toolItems = toolItemsArray.filter(Boolean).flat();
          return [ ...new Set(toolItems) ];
        }
      });
    }
  };
  return DynamicToolItemsMixin;
});