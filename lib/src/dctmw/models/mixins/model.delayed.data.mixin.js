/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import utils from "dctmw/utils/utils";

const modelMap = new Map();

const ModelDelayedDataMixin = {
  mixin(prototype) {
    let mergeSilently;
    const oFetchDelayedData = prototype.fetchDelayedData;
    Object.assign(prototype, {
      enableDelayedDataFetch(options = {}) {
        mergeSilently = _.isBoolean(options.mergeDelayedDataSilently) ? options.mergeDelayedDataSilently : true;
        modelMap.set(this.cid, true);
        this.listenTo(this, "sync", this._syncDelayedData);
        return this;
      },
      hasDelayedDataBehavior() {
        return modelMap.get(this.cid) === true;
      },
      _syncDelayedData() {
        const id = this.get(this.idAttribute || "id");
        const options = {
          nodes: [ id ]
        };
        const nodesMap = {};
        nodesMap[id] = this;
        const fetchDelayedData = _.isFunction(this.fetchDelayedData) ? this.fetchDelayedData : _.noop;
        this.trigger("delayed:data:request");
        fetchDelayedData.call(this, options).done(delayedData => {
          this.mergeDelayedData([ id ], delayedData);
          this.trigger("delayed:data:sync", _.values(nodesMap));
        }).fail(error => {
          if (error.responseJSON) {
            error = utils.parseAjaxError(error);
          }
          error = error.message || error.details || error.errorDetails || error;
          console.error("Failed while fetching additional data : " + error);
          this.trigger("delayed:data:error", error);
        });
      },
      fetchDelayedData(options = {}) {
        if (_.isFunction(oFetchDelayedData)) {
          return oFetchDelayedData.call(this, options);
        }
        return $.Deferred().resolve().promise();
      },
      mergeDelayedData(nodes, delayedData) {
        const node = this;
        const delayedNodeData = delayedData[this.get(this.idAttribute || "id")];
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
    });
    return prototype;
  }
};

export default ModelDelayedDataMixin;