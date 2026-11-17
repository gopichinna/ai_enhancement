/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "d2/models/workflow/tasks.client-side.mixin", "nuc/models/browsable/v2.response.mixin", "nuc/models/mixins/v2.expandable/v2.expandable.mixin", "nuc/models/mixins/state.requestor/state.requestor.mixin", "d2/models/workflow/task", "d2/models/workflow/tasks.client.columns", "d2/models/workflow/tasks.facets", "d2/server.adaptors/converters/servercolumns", "d2/server.adaptors/models/d2.fetchable.mixin", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/sort.utils", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/utils", "d2/utils/facet.utils", "d2/models/workflow/tasks.facets.helper" ], function($, _, Backbone, ConnectableMixin, FetchableMixin, DelayedCommandableV2Mixin, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, ExpandableV2Mixin, StateRequestorMixin, TaskModel, TasksColumnCollection, TaskFacetCollection, serverColumnsConverter, D2FetchableMixin, RestResources, RestLinkrels, serverQueryUtils, sortUtils, constants, widgetConstants, utils, facetUtils, facetsHelper) {
  "use strict";
  var TaskCollection = Backbone.Collection.extend({
    model: TaskModel,
    widgetType: widgetConstants.D2.TASKS,
    constructor: function TaskCollection(attributes, options) {
      options = options || {};
      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.TASKS,
        widgetType: widgetConstants.D2.TASKS
      };
      options.delayedActionsOptions = options.d2ActionsOptions;
      options.nonPromotedActionsOptions = options.d2ActionsOptions;
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      if (options) {
        this.options = _.pick(options, [ "connector", "autoreset", "commands", "expanded", "widgetName", "options" ]);
      }
      this.makeConnectable(options).makeFetchable(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options).makeDelayedCommandableV2(options).makeExpandableV2(options).makeStateRequestor(options).makeD2Fetchable(options);
      this.columns = new TasksColumnCollection(options.columns);
      this.columnTypes = {};
      this.expanded = this.options.expanded;
      this.taskFacets = new TaskFacetCollection();
      this.taskFacets.filters = _.isEmpty(options.facetFilters) ? [] : options.facetFilters;
      this.hasMoreRecords = options.hasMoreRecords;
      this.hadMoreRecords = options.hadMoreRecords;
      this.overrideSortingOrderFromColumnPref = options.overrideSortingOrderFromColumnPref;
      this.listenTo(this, "d2:task:acquired d2:task:read:toggled d2:task:change:priority", function() {
        if (this.expanded) {
          this.applySelectedFilters(this.lastFilteredAndSortedModels, {
            reload: false
          });
        }
      });
      this.listenTo(this, "remove", function(removedModel) {
        var cloneArray = _.clone(this.lastFilteredAndSortedModels);
        cloneArray.splice(_.findIndex(cloneArray, function(model) {
          return model.get("id") === removedModel.get("id");
        }), 1);
        if (this.expanded) {
          this.applySelectedFilters(cloneArray, {
            reload: false
          });
        }
      });
    },
    clone: function() {
      var clone = new this.constructor(this.models, this.options);
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
      clone.expand = _.clone(this.expand);
      clone.includeActions = this.includeActions;
      clone.includeCommands = _.clone(this.includeCommands);
      clone.defaultActionCommands = _.clone(this.defaultActionCommands);
      clone.commands = _.clone(this.commands);
      clone.overrideSortingOrderFromColumnPref = this.overrideSortingOrderFromColumnPref;
      return clone;
    },
    url: function() {
      var links = RestResources.getCurrentRepository().get("links"), url = RestLinkrels.getLink(links, RestLinkrels.D2_INBOX), qParams = !this.expanded ? {} : {
        scope: this,
        widgetName: this.options.widgetName,
        widgetType: this.widgetType,
        clientColumns: this.clientColumns,
        sort: !_.isEmpty(this.orderBy),
        filter: !_.isEmpty(this.serverFilterColumn),
        facetFilter: this.serverFacetFilters && (!_.isEmpty(this.serverFacetFilters.facetFilters) || !_.isEmpty(this.serverFacetFilters.categoryFilters))
      };
      return serverQueryUtils.appendQueryParams(url, qParams);
    },
    sync: function(method, model, options) {
      var me = this, args = arguments, promise = $.Deferred(), widgetConfig;
      if (me.expanded) {
        widgetConfig = serverQueryUtils.getWidgetConfig(me.widgetType, me.options.widgetName);
      }
      me.getCategories(options).done(function(categoriesTree) {
        var categoryTreeFetchedBefore = !!me.categoriesTree;
        me.categoriesTree = categoriesTree;
        if (categoryTreeFetchedBefore === false) {
          me.ensureCategoryServerFilter(options);
        }
        me.fetchColumnPreferences(me.options.widgetName, widgetConfig).done(function(data) {
          me.fetchData(data, args, options).done(function() {
            promise.resolve();
          }).fail(function(err) {
            promise.reject(err);
          });
        }).fail(function(err) {
          promise.reject(err);
        });
      }).fail(function(err) {
        promise.reject(err);
      });
      return promise.promise();
    },
    fetchColumnPreferences: function(wName, widgetConfig) {
      var me = this, promise = $.Deferred(), ignoreFilterColumns = [ "d2_task_priority" ];
      me.widgetName = wName;
      if (me.clientColumns && me.clientColumns.length !== 0 || !me.expanded) {
        promise.resolve();
      } else {
        serverQueryUtils.fetchColumnPreferences({
          scope: this,
          widgetType: me.widgetType,
          widgetName: me.widgetName,
          connector: me.connector,
          columnOptions: {
            reservedColumn: false,
            externalShareColumn: false,
            favoriteColumn: false,
            commentColumn: false,
            inlineRowActions: true,
            typeColumn: !utils.isMobile()
          }
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
          _.each(clientCols, function(col) {
            if (col.sort === true && col.direction && !(me.overrideSortingOrderFromColumnPref === true && !!me.orderBy)) {
              me.orderBy = col.column_key + " " + col.direction.toLowerCase();
            }
            if (col.filter !== false && (col.type === 2 || col.type === -1) && !_.contains(ignoreFilterColumns, col.key)) {
              col.filter = true;
              col.filter_key = col.filter_key || col.column_key;
            }
          });
          var data = {
            clientCols: clientCols
          };
          me.columnTypes = {};
          me.widgetPreference = {
            widgetName: me.widgetName,
            widgetType: me.widgetType,
            columnPreference: me.columnPreference,
            clientColumns: clientCols,
            widgetConfig: widgetConfig
          };
          promise.resolve(data);
        }).fail(function(err) {
          promise.reject(err);
        });
      }
      return promise.promise();
    },
    _prepareModel: function(attrs, options) {
      options || (options = {});
      options.promotedActionCommands = this.promotedActionCommands;
      options.nonPromotedActionCommands = this.nonPromotedActionCommands;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
    },
    _saveColumnPreference: function() {
      var sortarr = _.isString(this.orderBy) ? this.orderBy.split(" ") : [], me = this;
      if (sortarr.length > 1) {
        serverQueryUtils.saveColumnPreferences({
          scope: me,
          widgetType: me.widgetType,
          widgetName: me.options.widgetName,
          connector: me.connector,
          columnPreference: me.columnPreference,
          sortOrder: me.orderBy
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
        });
      }
    },
    fetchData: function(data, args, options) {
      var me = this, deferred = $.Deferred(), success = options.success, error = options.error;
      if (data != null) {
        me.clientColumns = data.clientCols;
      } else {
        me.columns.reset(me.clientColumns);
      }
      options.success = function(results) {
        me.hasMoreRecords = !!results["has-more-records"];
        me.totalFromServer = results["total"];
        me.taskFacets.hasMoreRecords = me.hasMoreRecords;
        me.taskFacets.serverLimit = results.entries && results.entries.length;
        if (me.initialServerSideFilter === true && me.hasMoreRecords === false && serverQueryUtils._isTableFilterApplied(me.filters) === false) {
          me.hadMoreRecords = false;
          me.initialServerSideFilter = false;
        }
        success.call(options.context, results, "success", {});
        deferred.resolve();
      };
      options.error = function() {
        error.apply(options.context, arguments);
        deferred.reject.apply(deferred, arguments);
      };
      Backbone.sync.apply(me, args);
      return deferred.promise();
    },
    parse: function(response) {
      response.columns = this.clientColumns;
      this.columns && this.columns.resetTasksCollection(response, this.options);
      return _.map(response.entries || [], function(item) {
        return item.content;
      });
    },
    setOptionsForConstraintChange: function(options, currentConstraint) {
      this.previousConstraint = this.previousConstraint || {};
      if (JSON.stringify(currentConstraint) !== JSON.stringify(this.previousConstraint) && options.reload !== true) {
        options.reload = !!this.hasMoreRecords || !!this.hadMoreRecords;
      }
      if (this.hasMoreRecords || this.hadMoreRecords) {
        this.serverFacetFilters = facetsHelper.createServerFilters(this.taskFacets.filters, this.categoriesTree);
      }
      this.previousConstraint = currentConstraint;
    },
    ensureCategoryServerFilter: function() {
      var me = this;
      if ((this.hasMoreRecords || this.hadMoreRecords) && this.categoriesTree && this.serverFacetFilters && this.serverFacetFilters.categoryFilters && this.serverFacetFilters.categoryFilters.length === 0 && this.taskFacets && this.taskFacets.filters && this.taskFacets.filters.length > 0) {
        var taskCategory = _.find(this.taskFacets.filters, {
          id: "task_category_id"
        });
        if (taskCategory && taskCategory.values && taskCategory.values.length > 0) {
          var categoriesMap = facetsHelper.flattenCategoriesTree(this.categoriesTree), results = facetsHelper.calculateCategoriestoBefiltered(taskCategory, categoriesMap);
          _.each(results, function(id) {
            me.serverFacetFilters.categoryFilters.push(id);
          });
        }
      }
    },
    getCategories: function(options) {
      var deferred = $.Deferred();
      if (!this.expanded) {
        deferred.resolve();
      } else {
        var links = RestResources.getCurrentRepository().get("links"), url = serverQueryUtils.appendQueryParams(RestLinkrels.getLink(links, RestLinkrels.D2_TASK_CATEGORIES), {
          extraParams: {
            "process-task-categories": false
          }
        }), headers = {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        };
        var ajaxOptions = this.connector.extendAjaxOptions({
          url: url,
          type: "GET",
          headers: headers,
          skipSWCache: options.skipSWCache,
          success: function(response) {
            var entries = response.entries || [];
            var categoriesTree = facetsHelper.buildCategoriesTree(entries);
            deferred.resolve(categoriesTree);
          },
          error: function(request, textStatus, error) {
            if (utils.isMobile() && request.status === 0) {
              return deferred.reject(request);
            }
            deferred.reject(error);
          }
        });
        $.ajax(ajaxOptions);
      }
      return deferred.promise();
    }
  });
  ClientSideBrowsableMixin.mixin(TaskCollection.prototype);
  BrowsableV2ResponseMixin.mixin(TaskCollection.prototype);
  ConnectableMixin.mixin(TaskCollection.prototype);
  FetchableMixin.mixin(TaskCollection.prototype);
  DelayedCommandableV2Mixin.mixin(TaskCollection.prototype);
  ExpandableV2Mixin.mixin(TaskCollection.prototype);
  StateRequestorMixin.mixin(TaskCollection.prototype);
  D2FetchableMixin.mixin(TaskCollection.prototype);
  var originalFetch = TaskCollection.prototype.fetch;
  TaskCollection.prototype.fetch = function(options) {
    options = options || {};
    if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference) {
      options.sortOrderChanged = true;
      this._saveColumnPreference();
    }
    this.serverFilterEnabled = false;
    this.clientFilterWithFacets = false;
    var filter, lastFilter;
    if (this.filters) {
      filter = _.omit(this.filters, function(value) {
        return _.isUndefined(value) || _.isEmpty(value);
      });
    }
    if (this._lastFilterAndSortCriteria && this._lastFilterAndSortCriteria.filters) {
      lastFilter = _.omit(this._lastFilterAndSortCriteria.filters, function(value) {
        return _.isUndefined(value) || _.isEmpty(value);
      });
    }
    var forceServerSideFilter = false;
    if (this.fetched === undefined && filter && _.keys(filter).length === 1) {
      forceServerSideFilter = true;
      this.initialServerSideFilter = true;
    }
    if (this.hasMoreRecords === true || forceServerSideFilter) {
      if (!_.isEqual(filter, lastFilter) || !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy)) {
        options.reload = true;
        this.serverFilterEnabled = true;
      }
      var filterArray = filter && _.keys(filter) || [];
      if (filterArray.length > 0) {
        this.serverFilterColumn = filterArray[0];
        this.serverFilterValue = filter[this.serverFilterColumn];
      } else {
        this.serverFilterColumn = this.serverFilterValue = undefined;
      }
      this.hadMoreRecords = true;
    } else if (this.hadMoreRecords === true && this.serverFilterColumn) {
      var filterValue = filter[this.serverFilterColumn];
      if (filterValue !== this.serverFilterValue) {
        options.reload = true;
        this.filters = _.omit(this.filters, function(value, key) {
          return key !== this.serverFilterColumn;
        }, this);
      }
      this.serverFilterValue = filterValue;
    }
    var currentConstraint = this.getFilterQuery(this.taskFacets.filters) || {};
    this.setOptionsForConstraintChange(options, currentConstraint);
    return originalFetch.call(this, options);
  };
  TaskCollection.prototype.compareObjectsForSort = function(property, left, right) {
    var sortSchema = this.columnTypes[property];
    if (!sortSchema) {
      this.columnTypes[property] = {};
      sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
      this.columnTypes[property] = sortSchema;
    }
    return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, false);
  };
  return TaskCollection;
});