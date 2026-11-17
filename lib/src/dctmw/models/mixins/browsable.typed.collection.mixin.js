/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import ServerSideBrowsableMixin from "dctmw/models/mixins/server-side.mixin";

import ServerTypeModelFactory from "dctmw/contexts/factories/server.type.model.factory";

import TypedCollectionColumns from "dctmw/models/typed.collection.columns";

import DelayedDataMixin from "dctmw/models/mixins/collection.delayed.data.mixin";

import SQUDelayedDataFetcherMixin from "dctmw/models/mixins/squ.delayed.data.fetcher.mixin";

import constants from "dctmw/utils/constants";

import RestResources from "dctmw/utils/rest.resources";

import serverQueryUtils from "dctmw/utils/lw.server.query.utils";

import TypedAttributeMapper from "dctmw/utils/typed.attribute.mapper";

import sortUtils from "dctmw/utils/sort.utils";

import utils from "dctmw/utils/utils";

import Session from "dctmw/utils/authenticators/session";

import persistentStore from "dctmw/utils/persistent.store";

const BrowsableTypedCollectionMixin = {
  mixin(prototype) {
    ServerSideBrowsableMixin.mixin(prototype);
    DelayedDataMixin.mixin(prototype);
    SQUDelayedDataFetcherMixin.mixin(prototype);
    const originalFetch = prototype.fetch, originalUrl = prototype.url, oUrlFetch = prototype.urlFetch, originalSync = prototype.sync, originalParse = prototype.parse, originalPrepareModel = prototype._prepareModel, originalGetServerSideFilters = prototype._getServerSideFilters, originalGetRequiredAttributes = prototype._getRequiredAttributes;
    Object.assign(prototype, {
      makeBrowsableCollection(options = {}) {
        options.context ??= Session.get().getContext();
        this.options ??= options;
        this.makeServerSideBrowsable(options).enableDelayedDataFetch(options);
        this.dataType ??= this.options.dataType;
        if (!this.dataType) {
          throw new Error("Unknown dataType while instantiating browsable.typed.collection");
        }
        this.dataTypeModel = this.options.context.getModel(ServerTypeModelFactory, ServerTypeModelFactory.createModelFactoryOptions({
          name: this.dataType
        }, {
          permanent: true
        }));
        const metaStatePersistenceKey = utils.isNonEmptyString(options.metaStatePersistenceKey) ? options.metaStatePersistenceKey : false;
        if (metaStatePersistenceKey) {
          this.metaStatePersistenceStore = persistentStore.getModelStore(metaStatePersistenceKey, {
            defaultValues: {
              orderBy: this.orderBy
            }
          });
          if (this.metaStatePersistenceStore.has("orderBy")) {
            this.orderBy = this.metaStatePersistenceStore.get("orderBy");
          }
          this.listenTo(this, "orderBy:change orderBy:clear", this.__onOrderByChange);
        }
        const columnPrefPersistenceKey = utils.isNonEmptyString(options.columnPrefPersistenceKey) ? options.columnPrefPersistenceKey : false;
        const showsTypeColumn = _.isBoolean(options.showsTypeColumn) ? options.showsTypeColumn : false;
        this.columns = new TypedCollectionColumns(options.columns || [], {
          ...options,
          prefPersistenceKey: columnPrefPersistenceKey,
          dataTypeModel: this.dataTypeModel,
          showsTypeColumn: showsTypeColumn
        });
        this.listenTo(this.columns, "preferences:reset", this.__onColumnPreferenceReset);
        this.columnTypes = {};
        this.expanded = this?.options?.expanded || false;
        return this;
      },
      url() {
        return _.isFunction(originalUrl) ? originalUrl.call(this) : originalUrl;
      },
      urlFetch() {
        const url = _.isFunction(oUrlFetch) ? oUrlFetch.call(this) : this.url();
        const serverSideFilters = this._getServerSideFilters();
        const requiredAttributes = this._getRequiredAttributes();
        return utils.isNonEmptyString(url) ? serverQueryUtils.appendQueryParams(url, {
          scope: this,
          widgetName: this.options.widgetName,
          clientColumns: this.columns?.hasPreference() ? this.columns.getPreference() : this.clientColumns,
          filter: !_.isEmpty(serverSideFilters),
          sort: !_.isEmpty(this.orderBy),
          fetchesAllServerAttributes: this.options.fetchesAllServerAttributes,
          fetchesOnlyRequiredAttributes: this.options.fetchesOnlyRequiredAttributes,
          requiredAttributes: requiredAttributes
        }) : url;
      },
      _getRequiredAttributes() {
        const extAttributes = _.isFunction(originalGetRequiredAttributes) ? originalGetRequiredAttributes.call(this) : [];
        return [ ..._.isArray(extAttributes) ? extAttributes : [] ];
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
          return this.postTypeResolution();
        }).done(data => {
          if (!utils.isNonEmptyString(options.url)) {
            options.url = this.urlFetch();
          }
          if (!utils.isNonEmptyString(options.url)) {
            if (method === "read" && options.handleMissingURLGracefully === true) {
              const resp = {};
              options.success && options.success.call(options.context, resp, options);
              dfd.resolve();
            } else {
              const statusText = "Aborted";
              const errMsg = `A URL is not set for '${method}' on ${this.constructor.name}[${this.cid}]`;
              const resp = {
                status: 0,
                message: errMsg
              };
              options.error && options.error.call(options.context, {
                status: resp.status,
                statusText: statusText,
                responseJSON: resp,
                responseText: JSON.stringify(resp)
              }, errMsg, statusText);
              dfd.reject(errMsg);
            }
            return;
          }
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
        const success = options.success, error = options.error, self = this;
        options.success = function(results) {
          if (results && !_.isUndefined(results.total)) {
            self.filteredCount = results.total;
            self.totalCount = results.total;
          }
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
      postTypeResolution() {
        return $.Deferred().resolve().promise();
      },
      parse(response, options = {}) {
        if (this.columns instanceof TypedCollectionColumns && (!this.columns.length || options.reload === true)) {
          const columns = this.columns.hasPreference() ? this.columns.getPreference() : this.clientColumns;
          if (_.isArray(columns) && !_.isEmpty(columns)) {
            this._fillInMissingPropertiesOfColumnDefs(columns);
            response.columns = columns;
            this.columns.resetCollection(response, this.options);
          }
        }
        return originalParse.apply(this, arguments);
      },
      _fillInMissingPropertiesOfColumnDefs(colDefs) {
        const isResolvingClientColumnsItself = colDefs === this.clientColumns;
        colDefs.forEach(col => {
          const serverColKey = TypedAttributeMapper.clientToServerAttr(this.dataType, col.column_key || col.key);
          const serverAttrDef = this.dataTypeModel.getAttributeDef(serverColKey);
          if (!isResolvingClientColumnsItself) {
            const clientColDef = _.findWhere(this.clientColumns, {
              column_key: col.column_key || col.key
            });
            if (clientColDef) {
              if (!utils.isNonEmptyString(col.title) && utils.isNonEmptyString(clientColDef?.title)) {
                col.title = clientColDef.title;
              }
              if ((!_.isNumber(col.type) || _.isNaN(col.type)) && (_.isNumber(clientColDef.type) && !_.isNaN(clientColDef.type))) {
                col.type = clientColDef.type;
              }
            }
          }
          if (serverAttrDef) {
            if (!utils.isNonEmptyString(col.title) && utils.isNonEmptyString(serverAttrDef?.label)) {
              col.title = serverAttrDef.label;
            }
            if ((!_.isNumber(col.type) || _.isNaN(col.type)) && (_.isNumber(serverAttrDef.type) && !_.isNaN(serverAttrDef.type))) {
              col.type = serverAttrDef.type;
            }
            col.repeating = serverAttrDef.repeating;
            col.dictionary = serverAttrDef.dictionary;
            col.sort = col.sort === true && (col.sortOnClient === true || !(col.repeating === true || col.dictionary === true));
            col.filter = col.filter === true && (col.filterOnClient || ![ 5, -7 ].includes(serverAttrDef.type));
          }
        });
      },
      __onColumnPreferenceReset() {
        const columns = _.isArray(this.clientColumns) ? this.clientColumns : [];
        const fakeResp = {
          columns: columns
        };
        this._fillInMissingPropertiesOfColumnDefs(fakeResp.columns);
        this.columns && this.columns.resetCollection(fakeResp, this.options);
      },
      __onOrderByChange() {
        if (this.metaStatePersistenceStore) {
          if (this.orderBy) {
            this.metaStatePersistenceStore.set("orderBy", this.orderBy);
          } else {
            this.metaStatePersistenceStore.unset("orderBy");
          }
        }
      },
      _prepareModel(attrs, options = {}) {
        options.dataType = this.dataType;
        options.dataTypeModel = this.dataTypeModel;
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