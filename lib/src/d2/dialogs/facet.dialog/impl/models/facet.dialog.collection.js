/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import {
  Collection
} from "nuc/lib/backbone";

import ClientSideMixin from "nuc/models/browsable/client-side.mixin";

const BATCH_SIZE = 5e3, BATCH_TIMEOUT = 0;

class FacetDialogCollection extends Collection {
  filterText = "";
  #previousFilterText = "";
  #previousResult = null;
  get filteredOn() {
    return this.#previousFilterText;
  }
  constructor(models = [], options = {}) {
    super(models, options);
    this.completeData = [ ...options.nodes ];
    this.makeClientSideBrowsable(options);
  }
  sync(method, collection, options) {
    let deferred = $.Deferred();
    if (method === "read") {
      if (!this.filterText) {
        this.#previousFilterText = null;
        this.#previousResult = null;
        options.success.call(options.context, this.completeData, "success", {});
        deferred.resolve();
      } else if (this.filterText) {
        let _filterText = this.filterText;
        this.performFilter().then(result => {
          if (this.filterText === _filterText || this.filterText?.startsWith(_filterText) && this.#previousFilterText !== this.filterText) {
            this.#previousFilterText = _filterText;
            this.#previousResult = result;
            this._lastFilterAndSortCriteria = null;
            options.success.call(options.context, result, "success", {});
            deferred.resolve();
          } else {
            options.error.call(options.context, null, "error");
            deferred.reject();
          }
        }, () => {
          options.error.call(options.context, null, "error");
          deferred.reject();
        });
      }
    } else {
      throw new Error("Operation not supported");
    }
    return deferred.promise();
  }
  async performFilter() {
    let currentFilter = this.filterText;
    let data = this.completeData;
    if (currentFilter.startsWith(this.#previousFilterText)) {
      data = this.#previousResult;
    }
    return await this.#runBatchedFilter(data, currentFilter);
  }
  #runBatchedFilter(data, _filterText) {
    data = data || this.completeData;
    let size = data.length;
    return new Promise(resolve => {
      let res = [];
      function fnFilter(start, end) {
        end = Math.min(end, size);
        let topics = [];
        for (let i = start; i < end; i++) {
          let topic = data[i];
          if (topic.get("name")?.toLowerCase().includes(_filterText)) {
            topics.push(topic);
          }
        }
        res = res.concat(topics);
        if (end === size) {
          resolve(res);
        } else {
          setTimeout(() => fnFilter(end, end + BATCH_SIZE), BATCH_TIMEOUT);
        }
      }
      fnFilter(0, BATCH_SIZE);
    });
  }
  setTopicFilter(filter) {
    this.filterText = filter?.toLowerCase();
    if (this.filterText === this.#previousFilterText) {
      return $.Deferred().resolve();
    } else {
      this.resetLimit();
      this.trigger("filter:start");
      return this.fetch({
        reload: true
      }).always(() => this.trigger("filter:end"));
    }
  }
}

ClientSideMixin.mixin(FacetDialogCollection.prototype);

Object.defineProperty(FacetDialogCollection.prototype.constructor, "name", {
  value: "FacetDialogCollection"
});

export default FacetDialogCollection;