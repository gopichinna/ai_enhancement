/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import ClientSideBrowsableMixin from "nuc/models/browsable/client-side.mixin";

import ServerTypeModelFactory from "dctmw/contexts/factories/server.type.model.factory";

import CollectionColumns from "dctmw/models/collection.columns";

import DelayedDataMixin from "dctmw/models/mixins/collection.delayed.data.mixin";

import constants from "dctmw/utils/constants";

import RestResources from "dctmw/utils/rest.resources";

import serverQueryUtils from "dctmw/utils/lw.server.query.utils";

import sortUtils from "dctmw/utils/sort.utils";

import utils from "dctmw/utils/utils";

import Session from "dctmw/utils/authenticators/session";

const BrowsableTypedCollectionMixin = {
  mixin(prototype) {
    ClientSideBrowsableMixin.mixin(prototype);
    DelayedDataMixin.mixin(prototype);
    const originalFetch = prototype.fetch, originalUrl = prototype.url, originalSync = prototype.sync, originalParse = prototype.parse, originalFetchDelayedData = prototype.fetchDelayedData, originalPrepareModel = prototype._prepareModel, originalGetServerSideFilters = prototype._getServerSideFilters, origAddOperationsToDelayedDataRequest = prototype.addOperationToDelayedDataRequest, origCollateOperationIntoDelayedDataResponse = prototype.collateOperationIntoDelayedDataResponse, origPrepareObjectPropertiesFromDelayedDataResponse = prototype.prepareObjectPropertiesFromDelayedDataResponse;
    Object.assign(prototype, {
      makeBrowsableCollection(options = {}) {
        options.context ??= Session.get().getContext();
        this.options ??= options;
        this.makeClientSideBrowsable(options).enableDelayedDataFetch(options);
        this.dataType ??= this.options.dataType;
        if (!this.dataType) {
          throw new Error("Unknown dataType while instantiating browsable.typed.collection");
        }
        this.dataTypeModel = this.options.context.getModel(ServerTypeModelFactory, ServerTypeModelFactory.createModelFactoryOptions({
          name: this.dataType
        }, {
          permanent: true
        }));
        this.columns = new CollectionColumns(options.columns || []);
        this.columnTypes = {};
        this.expanded = this?.options?.expanded || false;
        return this;
      },
      url(baseUrl) {
        const url = utils.isNonEmptyString(baseUrl) ? baseUrl : _.isFunction(originalUrl) ? originalUrl.call(this) : originalUrl;
        const serverSideFilters = this._getServerSideFilters();
        return serverQueryUtils.appendQueryParams(url, {
          scope: this,
          widgetName: this.options.widgetName,
          clientColumns: this.clientColumns,
          filter: !_.isEmpty(serverSideFilters),
          sort: !_.isEmpty(this.orderBy),
          fetchesAllServerAttributes: this.options.fetchesAllServerAttributes,
          fetchesOnlyRequiredAttributes: this.options.fetchesOnlyRequiredAttributes
        });
      },
      _getServerSideFilters() {
        const extFilters = _.isFunction(originalGetServerSideFilters) ? originalGetServerSideFilters.call(this) : {};
        return Object.assign({}, this.filters ?? {}, extFilters);
      },
      fetch(options) {
        return originalFetch.call(this, options);
      },
      sync(method, model, options) {
        const dfd = $.Deferred();
        const args = arguments;
        this.dataTypeModel.ensureFetched().then(() => {
          return this.resolveColumnPreferences();
        }).done(data => {
          this.fetchData(data, args, options).done(function() {
            dfd.resolve();
          }).fail(function() {
            dfd.reject.apply(dfd, arguments);
          });
        }).fail(function() {
          dfd.reject.apply(dfd, arguments);
        });
        return dfd.promise();
      },
      fetchData(data, args, options) {
        const dfd = $.Deferred();
        if (data != null && _.isArray(data.clientCols) && !_.isEmpty(data.clientCols)) {
          this.clientColumns = data.clientCols;
        }
        const success = options.success, error = options.error;
        options.success = function(results) {
          success && success.call(options.context, results, "success", {});
          dfd.resolve();
        };
        options.error = function() {
          error && error.apply(options.context, arguments);
          dfd.reject.apply(dfd, arguments);
        };
        const beforesend = options.beforeSend, me = this;
        options.beforeSend = function(request, settings) {
          options.request = request;
          request.settings = settings;
          request.setRequestHeader("Accept", me?.options?.responseMediaType || constants.MediaTypes.DCTM_JSON);
          if (beforesend) {
            beforesend.apply(this, arguments);
          }
        };
        originalSync.apply(this, args);
        return dfd.promise();
      },
      fetchDelayedData(options = {}) {
        const dfd = $.Deferred();
        const parameters = {
          ids: options.nodes,
          connector: this.connector,
          handleZeroBatchGracefully: true
        };
        this.trigger("before:delayed:data:send", parameters);
        serverQueryUtils.fetchDataAsPropertiesForObjects(parameters).done((objectsProperties = {}) => {
          const finishDelayedDataFetch = () => {
            this.trigger("after:delayed:data:receive", options.nodes, objectsProperties);
            dfd.resolve(objectsProperties);
          };
          if (_.isFunction(originalFetchDelayedData)) {
            originalFetchDelayedData.call(this, options).done((otherProperties = {}) => {
              _.extend(objectsProperties, otherProperties);
              finishDelayedDataFetch();
            }).fail(dfd.reject);
          } else {
            finishDelayedDataFetch();
          }
        }).fail(dfd.reject);
        return dfd.promise();
      },
      addOperationToDelayedDataRequest(options = {}) {
        if (_.isFunction(origAddOperationsToDelayedDataRequest)) {
          return origAddOperationsToDelayedDataRequest.call(this, options);
        }
      },
      collateOperationIntoDelayedDataResponse(id, response, output) {
        _.isFunction(origCollateOperationIntoDelayedDataResponse) && origCollateOperationIntoDelayedDataResponse.call(this, id, response, output);
      },
      prepareObjectPropertiesFromDelayedDataResponse(output, objectsProperties) {
        _.isFunction(origPrepareObjectPropertiesFromDelayedDataResponse) && origPrepareObjectPropertiesFromDelayedDataResponse.call(this, output, objectsProperties);
      },
      resolveColumnPreferences() {
        return $.Deferred().resolve().promise();
      },
      parse(response) {
        if (_.isArray(this.clientColumns) && this.clientColumns.length !== this.columns.length) {
          response.columns = this.clientColumns;
          this.columns && this.columns.resetCollection(response, this.options);
        }
        return originalParse.apply(this, arguments);
      },
      _prepareModel(attrs, options = {}) {
        options.dataType = this.dataType;
        return originalPrepareModel.call(this, attrs, options);
      },
      compareObjectsForSort(property, left, right) {
        let sortSchema = this.columnTypes[property];
        if (!sortSchema) {
          this.columnTypes[property] = {};
          sortSchema = sortUtils.getSortColumnSchema(this.clientColumns, property);
          this.columnTypes[property] = sortSchema;
        }
        return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, RestResources.getCurrentUser().get("preferences").order_folder_before !== false, this.orderBy);
      },
      clone() {
        const clone = new this.constructor(this.models, this.options);
        if (this.columns) {
          clone.columns.reset(this.columns.toJSON());
        }
        clone.actualSkipCount = this.actualSkipCount;
        clone.skipCount = this.skipCount;
        clone.topCount = this.topCount;
        clone.totalCount = this.totalCount;
        clone.filteredCount = this.filteredCount;
        clone.filters = _.deepClone(this.filters);
        clone.orderBy = this.orderBy;
        clone.expanded = _.clone(this.expanded);
        clone.includeActions = this.includeActions;
        clone.includeCommands = _.clone(this.includeCommands);
        clone.defaultActionCommands = _.clone(this.defaultActionCommands);
        clone.commands = _.clone(this.commands);
        return clone;
      }
    });
  }
};

export default BrowsableTypedCollectionMixin;