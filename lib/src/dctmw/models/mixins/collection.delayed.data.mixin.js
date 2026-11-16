/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "dctmw/utils/utils" ], function(_, $, utils) {
  "use strict";
  return {
    mixin: function(prototype) {
      const colMap = new Map(), fetchedIds = new Map();
      let mergeSilently;
      _.extend(prototype, {
        enableDelayedDataFetch: function(options) {
          options = options || {};
          mergeSilently = _.isBoolean(options.mergeDelayedDataSilently) ? options.mergeDelayedDataSilently : true;
          this.listenTo(this, "sync", this._syncDelayedData);
          this.listenTo(this, "reset", (col, opts) => {
            if (opts.reload === true || _.isEmpty(col.allModels)) {
              (colMap.get(col.cid) ?? []).forEach(tuple => {
                fetchedIds.delete(tuple);
                colMap.delete(col.cid);
              });
            }
          });
          colMap.set(this.cid, []);
          return this;
        },
        _syncDelayedData: function() {
          const me = this, nodesMap = {}, nodeIds = [];
          me.each(function(model) {
            const id = model.get(model.idAttribute || "id"), idTuple = id + "_" + model.cid;
            if (fetchedIds.get(idTuple) !== true) {
              if (colMap.get(me.cid)) {
                colMap.get(me.cid).push(idTuple);
              } else {
                colMap.set(me.cid, [ idTuple ]);
              }
              nodesMap[id] = model;
              nodeIds.push(id);
              model.once("destroy", function() {
                fetchedIds.delete(this);
              }.bind(idTuple));
            }
          });
          if (nodeIds.length) {
            const options = {
              nodes: [].concat(nodeIds)
            };
            const fetchDelayedData = _.isFunction(me.fetchDelayedData) ? me.fetchDelayedData : _.noop;
            me.trigger("delayed:data:request");
            fetchDelayedData.call(me, options).done(function(delayedData) {
              _.each(nodeIds, function(nodeId) {
                fetchedIds.set(nodeId + "_" + nodesMap[nodeId].cid, true);
              });
              me.mergeDelayedData(nodeIds, delayedData);
              me.trigger("delayed:data:sync", _.values(nodesMap));
            }).fail(function(error) {
              if (error.responseJSON) {
                error = utils.parseAjaxError(error);
              }
              error = error.message || error.details || error.errorDetails || error;
              console.error("Failed while fetching additional data : " + error);
              me.trigger("delayed:data:error", error);
            });
          } else {
            me.trigger("delayed:data:skip");
          }
        }
      });
      _.defaults(prototype, {
        fetchDelayedData: function() {
          return $.Deferred().resolve().promise();
        },
        mergeDelayedData: function(nodes, delayedData) {
          if (_.isObject(delayedData)) {
            _.each(nodes, function(objId) {
              const node = this.findWhere({
                id: objId
              });
              if (node) {
                const delayedNodeData = delayedData[objId];
                if (delayedNodeData && _.isFunction(node.canBeOpened) && node.canBeOpened(delayedNodeData)) {
                  const openActionModel = node.actions && node.actions.find(function(actionModel) {
                    return actionModel && actionModel.get("signature") === "open";
                  });
                  if (node.actions && !openActionModel) {
                    const actions = node.get("actions") || [];
                    actions.unshift({
                      signature: "open"
                    });
                    node.attributes.actions ??= actions;
                    node.actions.unshift({
                      signature: "open"
                    });
                  }
                }
                node.set(delayedNodeData, {
                  silent: mergeSilently
                });
                node.trigger("delayed:data:update", delayedNodeData);
              }
            }.bind(this));
          }
        }
      });
      return prototype;
    }
  };
});