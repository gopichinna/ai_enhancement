/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import ClientSideBrowsableMixin from "nuc/models/browsable/client-side.mixin";

import _ from "nuc/lib/underscore";

import serverQueryUtils from "dctmw/utils/lw.server.query.utils";

import utils from "dctmw/utils/utils";

const ServerSideBrowsableMixin = {
  mixin(prototype) {
    ClientSideBrowsableMixin.mixin(prototype);
    const oUrlFetch = prototype.urlFetch, originalFetch = prototype.fetch;
    Object.assign(prototype, {
      makeServerSideBrowsable: function(options) {
        this.serversidepagination = options.serversidepagination;
        return this.makeClientSideBrowsable(options);
      },
      urlFetch() {
        const url = _.isFunction(oUrlFetch) ? oUrlFetch.call(this) : this.url();
        return utils.isNonEmptyString(url) ? serverQueryUtils.appendQueryParams(url, {
          paginate: this.serversidepagination,
          scope: this
        }) : url;
      },
      _fill: function(options) {
        var filterAndSortCriteria = {
          orderBy: this.orderBy,
          filters: _.clone(this.filters)
        }, models;
        if (this._lastFilterAndSortCriteria && _.isEqual(this._lastFilterAndSortCriteria, filterAndSortCriteria)) {
          models = this.lastFilteredAndSortedModels;
        } else {
          models = _.clone(this.allModels);
          models = this._filter(models);
          this.sorting && !this.sorting.links && (this.sorting = undefined);
          if (!options.skipSort) {
            models = this._sort(models);
            if (this.orderBy && this.sorting === undefined) {
              var orderBy = this.orderBy.split(" ");
              this.sorting = {
                sort: []
              };
              this.sorting.sort.push({
                key: "sort",
                value: (orderBy[1] || "asc") + "_" + orderBy[0]
              });
            }
          }
          this.lastFilteredAndSortedModels = models;
          this._lastFilterAndSortCriteria = filterAndSortCriteria;
        }
        if (!this.isServerSidePaginated()) {
          this.totalCount = this.allModels.length;
          this.filteredCount = models.length;
          models = this._limit(models);
        }
        var reset = options.reset;
        if (reset === undefined) {
          reset = this.autoreset;
        }
        var method = reset ? "reset" : "set";
        ++this._filling;
        this[method](models, options);
        --this._filling;
        return models;
      },
      fetch(options) {
        options = options ? _.clone(options) : {};
        if (this.isServerSidePaginated()) {
          options.reload = true;
        }
        return originalFetch.call(this, options);
      },
      isServerSidePaginated() {
        return this.serversidepagination;
      }
    });
  }
};

export default ServerSideBrowsableMixin;