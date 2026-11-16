/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "nuc/models/browsable/client-side.mixin", "nuc/models/browsable/v2.response.mixin", "nuc/models/mixins/v2.expandable/v2.expandable.mixin", "nuc/models/mixins/state.requestor/state.requestor.mixin", "nuc/utils/url", "nuc/utils/log", "csui/dialogs/modal.alert/modal.alert", "d2/models/workflow/workflow", "d2/models/workflow/workflows.client.columns", "d2/server.adaptors/converters/servercolumns", "d2/server.adaptors/models/d2.fetchable.mixin", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/sort.utils", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, Backbone, ConnectableMixin, FetchableMixin, DelayedCommandableV2Mixin, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, ExpandableV2Mixin, StateRequestorMixin, Url, log, ModalAlert, WorkflowModel, WorkflowsColumnCollection, serverColumnsConverter, D2FetchableMixin, RestResources, RestLinkrels, serverQueryUtils, sortUtils, constants, widgetConstants, utils, lang) {
  "use strict";
  var WorkflowCollection = Backbone.Collection.extend({
    model: WorkflowModel,
    widgetType: widgetConstants.D2.WORKFLOWS,
    constructor: function WorkflowCollection(attributes, options) {
      options = options || {};
      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.WORKFLOWS,
        widgetType: options.widgetType || widgetConstants.D2.WORKFLOWS
      };
      options.delayedActionsOptions = _.extend({
        isNonPromoted: true
      }, options.d2ActionsOptions);
      options.nonPromotedActionsOptions = options.d2ActionsOptions;
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.workflowsReportingType = options.workflowsReportingType || constants.WorkflowsReportingType.USER;
      if (options) {
        this.options = _.pick(options, [ "context", "connector", "autoreset", "commands", "expanded", "widgetName", "detailsView", "options" ]);
      }
      options.widgetType && (this.widgetType = options.widgetType);
      this.makeConnectable(options).makeFetchable(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options).makeDelayedCommandableV2(options).makeExpandableV2(options).makeStateRequestor(options).makeD2Fetchable(options);
      this.context = this.options.context;
      this.columns = new WorkflowsColumnCollection(options.columns);
      this.columnTypes = {};
      this.expanded = this.options.expanded;
      this.hasMoreRecords = options.hasMoreRecords;
      this.hadMoreRecords = options.hadMoreRecords;
      this.overrideSortingOrderFromColumnPref = options.overrideSortingOrderFromColumnPref;
      this.listenToOnce(this.context, "change:perspective", this.onChangePerspective);
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
    getExtraParams: function() {
      var extraParam = {};
      if (this.serverQueryFormFilters && !_.isEmpty(this.serverQueryFormFilters)) {
        if (this.serverQueryFormFilters["wf-user-type"] && this.serverQueryFormFilters["wf-users"]) {
          if (this.serverQueryFormFilters["wf-user-type"] === constants.WorkflowUserType.SUPERVISOR) {
            this.serverQueryFormFilters["supervisor-name"] = this.serverQueryFormFilters["wf-users"];
          } else if (this.serverQueryFormFilters["wf-user-type"] === constants.WorkflowUserType.PERFORMER) {
            this.serverQueryFormFilters["performer-name"] = this.serverQueryFormFilters["wf-users"];
          }
          this.wfUser = this.serverQueryFormFilters["wf-users"];
        } else {
          delete this.wfUser;
        }
        if (this.serverQueryFormFilters["overdue"] && _.isArray(this.serverQueryFormFilters["overdue"]) && this.serverQueryFormFilters["overdue"].length === 1 && this.serverQueryFormFilters["overdue"][0] === "overdue_workflows") {
          this.serverQueryFormFilters["overdue"] = true;
        }
        this.serverQueryFormFilters = _.pick(this.serverQueryFormFilters, "document-id", "template-ids", "supervisor-name", "performer-name", "wf-states", "overdue", "wf-start-date-range-from", "wf-start-date-range-to");
        _.extend(extraParam, this.serverQueryFormFilters);
      }
      if (_.has(extraParam, "wf-states")) {
        this.wfStates = extraParam["wf-states"];
      } else {
        delete this.wfStates;
      }
      return extraParam;
    },
    url: function() {
      var url, qParams = !this.expanded ? {} : {
        scope: this,
        widgetName: this.options.widgetName,
        widgetType: this.widgetType,
        clientColumns: this.clientColumns,
        sort: !_.isEmpty(this.orderBy),
        filter: !_.isEmpty(this.serverFilterColumn),
        extraParams: this.getExtraParams.call(this)
      };
      if (this.workflowsReportingType === constants.WorkflowsReportingType.ALL) {
        url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_WORKFLOWS);
      } else {
        url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_MY_WORKFLOWS);
      }
      this.previousQparams = qParams;
      url = serverQueryUtils.appendQueryParams(url, qParams);
      return url;
    },
    sync: function(method, model, options) {
      var me = this, args = arguments, promise = $.Deferred(), widgetConfig;
      if (me.expanded) {
        widgetConfig = serverQueryUtils.getWidgetConfig(me.widgetType, me.options.widgetName);
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
      return promise.promise();
    },
    fetchColumnPreferences: function(wName, widgetConfig) {
      var me = this, promise = $.Deferred(), ignoreFilterColumns = [ "supervisor_name", "d2_workflow_state" ];
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
            favoriteColumn: true,
            commentColumn: false,
            noteColumn: true,
            inlineRowActions: true,
            typeColumn: !utils.isMobile()
          }
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
          if (columnPreference.columns.length === 0) {
            clientCols = [];
          }
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
        me.columns.reset(me.getUpdatedClientColumns(me.clientColumns));
      }
      me.requestAborted = false;
      options.success = function(results) {
        me.lastSuccesfulServerResponse = _.clone(results);
        clearTimeout(me.searchTimeout);
        me.hasMoreRecords = !!results["has-more-records"];
        me.totalFromServer = results["total"];
        if (me.initialServerSideFilter === true && me.hasMoreRecords === false && serverQueryUtils._isTableFilterApplied(me.filters) === false) {
          me.hadMoreRecords = false;
          me.initialServerSideFilter = false;
        }
        if (me.hasMoreRecords) {
          var serverTotalCountUrl = RestLinkrels.getLink(results.links, RestLinkrels.D2_WORKFLOWS_COUNT);
          if (serverTotalCountUrl) {
            me.serverTotalCountUrl = serverQueryUtils.appendQueryParams(serverTotalCountUrl, me.previousQparams);
          }
        } else {
          delete me.serverTotalCountUrl;
        }
        if (results.entries && results.entries.length > 0) {
          me.fetchDataForObjects(results).then(function(mergedData) {
            success.call(options.context, mergedData, "success", {});
            deferred.resolve();
          }).catch(function() {
            error.apply(options.context, arguments);
            deferred.reject.apply(deferred, arguments);
          });
        } else {
          success.call(options.context, results, "success", {});
          deferred.resolve();
        }
      };
      options.error = function(xhr, textStatus) {
        clearTimeout(me.searchTimeout);
        if (textStatus === "CLIENT_ABORT") {
          me.requestAborted = true;
          success.call(options.context, [], "success", {});
          deferred.resolve();
        } else {
          error.apply(options.context, arguments);
          deferred.reject.apply(deferred, arguments);
        }
      };
      var xhr = Backbone.sync.apply(me, args), d2Options = RestResources.getD2Options(), wfReportingTimeout = d2Options && d2Options["workflowReportingTimeout"] * 1e3 || 6e4;
      me.searchTimeout = setTimeout(function() {
        if (xhr && xhr.state() === "pending") {
          me.showModalAlert(xhr);
        }
      }, wfReportingTimeout);
      return deferred.promise();
    },
    onChangePerspective: function() {
      clearTimeout(this.searchTimeout);
    },
    showModalAlert: function(xhr) {
      ModalAlert.confirmQuestion(function(result) {
        if (result) {
          xhr.abort("CLIENT_ABORT");
        }
      }, lang.StopSearchConfirmAlertMessage, lang.StopSearchConfirmAlertTitle, {
        buttons: {
          showYes: true,
          labelYes: lang.StopSearchConfirmationYesButtonLabel,
          showNo: true,
          labelNo: lang.StopSearchConfirmationNoButtonLabel
        }
      });
    },
    parse: function(response) {
      response.columns = this.getUpdatedClientColumns(this.clientColumns);
      this.columns && this.columns.resetWorkflowsCollection(response, this.options);
      if (this.columns.length > 0 && this.columns.find({
        column_key: "d2_workflow_note"
      })) {
        return _.map(response.entries || [], function(item) {
          return item.content;
        });
      }
    },
    setQueryFormFilters: function() {
      this.serverQueryFormFilters = {};
      if (this.context) {
        try {
          var qformParam = this.context.viewStateModel.getViewState("qform-param", true);
          qformParam = JSON.parse(qformParam);
          if (qformParam) {
            this.serverQueryFormFilters = qformParam;
          }
        } catch (err) {
          log.error("Error while getting query form param from view state model", err);
        }
      }
    },
    fetchDataForObjects: function(results) {
      if (this.options.detailsView) {
        return $.Deferred().resolve(results).promise();
      }
      var currRepoLinks = RestResources.getCurrentRepository().get("links"), index = _.findIndex(results.links, function(link) {
        return link.rel === RestLinkrels.D2_WORKFLOW_NOTES_CONFIG;
      });
      index !== -1 && !RestLinkrels.getLink(currRepoLinks, RestLinkrels.D2_WORKFLOW_NOTES_CONFIG) && currRepoLinks.push(results.links[index]);
      var deferred = $.Deferred(), queryUtilOptions = {
        ids: _.map(results.entries, function(entry) {
          return entry.content.properties.r_object_id;
        }),
        connector: this.connector,
        favorites: true,
        wfNotesConfig: true
      };
      serverQueryUtils.fetchDataForObjects(queryUtilOptions).done(function(output) {
        _.each(results.entries, function(item) {
          var favorite = output.favorites && output.favorites[item.content.properties.r_object_id];
          item.content["favorite"] = {
            favorite: favorite ? favorite.favorite : false
          };
          if (output.wfNotesConfig && output.wfNotesConfig[item.content.properties.r_object_id]) {
            item.content.properties.show_notes = !output.wfNotesConfig[item.content.properties.r_object_id].wf_notes_disabled;
          }
          deferred.resolve(results);
        });
      }).fail(deferred.reject);
      return deferred.promise();
    },
    fetchTotalNotes: function(modelArray) {
      if (this.options.detailsView) {
        return $.Deferred().resolve(modelArray).promise();
      }
      var me = this, batchPayload = [], deferred = $.Deferred(), workflowsIdMap = _.chain(modelArray).filter(function(entry) {
        return !entry.has("has_notes") && entry.get("show_notes");
      }).reduce(function(result, e) {
        result[e.get("id")] = e;
        return result;
      }, {}).value();
      _.each(_.values(workflowsIdMap), function(workflow) {
        var qParams = {
          "wf-overview-widget-name": me.widgetName,
          inline: true
        }, wfNotesCountURI = RestLinkrels.getLink(workflow.get("links") || [], RestLinkrels.D2_NOTES_COUNT);
        wfNotesCountURI = Url.appendQuery(wfNotesCountURI, Url.combineQueryString(qParams));
        batchPayload.push({
          id: workflow.get("id"),
          request: {
            method: "GET",
            uri: wfNotesCountURI,
            headers: [ {
              name: "Content-Type",
              value: constants.MediaTypes.DCTM_JSON
            } ]
          }
        });
      });
      if (batchPayload.length) {
        utils.makeBatchAjaxCall({
          connector: me.connector,
          operations: batchPayload,
          continueOnError: true,
          sequential: true
        }).done(function(notesCountData) {
          _.each(notesCountData, function(noteCountData) {
            var entry = workflowsIdMap[noteCountData.id];
            entry.set("has_notes", noteCountData.output.count > 0, {
              silent: true
            });
          });
          deferred.resolve(modelArray);
        }).fail(function(error) {
          deferred.reject(error);
        });
      } else {
        deferred.resolve(modelArray);
      }
      return deferred.promise();
    },
    getUpdatedClientColumns: function(clientColumns) {
      var ignoredColumns = [], updatedClientColumns;
      if (this.wfStates && this.wfStates.length > 0 && !_.contains(this.wfStates, constants.WorkflowState.FINISHED) && !_.contains(this.wfStates, constants.WorkflowState.ABORTED)) {
        ignoredColumns.push("wf_end_date");
      }
      if (this.wfUser || this.workflowsReportingType === constants.WorkflowsReportingType.USER) {
        ignoredColumns.push("supervisor_name");
      }
      if (clientColumns && ignoredColumns.length > 0) {
        updatedClientColumns = _.filter(clientColumns, function(column) {
          return !_.contains(ignoredColumns, column["key"]);
        });
        var sortColumn = _.find(updatedClientColumns, function(column) {
          return column.sort === true && !!column.direction;
        });
        if (!sortColumn) {
          var startDateColumn = _.findWhere(updatedClientColumns, {
            key: "r_start_date"
          });
          if (startDateColumn) {
            startDateColumn.direction = "Desc";
            this.orderBy = startDateColumn.key + " " + startDateColumn.direction.toLowerCase();
          }
        }
      }
      return updatedClientColumns || clientColumns;
    },
    updateTableColumns: function() {
      if (this.clientColumns && this.columns) {
        this.columns.reset(this.getUpdatedClientColumns(this.clientColumns), {
          silent: true
        });
      }
    }
  });
  ClientSideBrowsableMixin.mixin(WorkflowCollection.prototype);
  BrowsableV2ResponseMixin.mixin(WorkflowCollection.prototype);
  ConnectableMixin.mixin(WorkflowCollection.prototype);
  FetchableMixin.mixin(WorkflowCollection.prototype);
  DelayedCommandableV2Mixin.mixin(WorkflowCollection.prototype);
  ExpandableV2Mixin.mixin(WorkflowCollection.prototype);
  StateRequestorMixin.mixin(WorkflowCollection.prototype);
  D2FetchableMixin.mixin(WorkflowCollection.prototype);
  var originalFetch = WorkflowCollection.prototype.fetch;
  WorkflowCollection.prototype.fetch = function(options) {
    var me = this;
    options = options || {};
    if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference) {
      options.sortOrderChanged = true;
      this._saveColumnPreference();
    }
    this.serverFilterEnabled = false;
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
    this.setQueryFormFilters();
    return originalFetch.call(this, options).done(function(modelArray) {
      return me.fetchTotalNotes(modelArray);
    });
  };
  WorkflowCollection.prototype.compareObjectsForSort = function(property, left, right) {
    var sortSchema = this.columnTypes[property];
    if (!sortSchema) {
      this.columnTypes[property] = {};
      sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
      this.columnTypes[property] = sortSchema;
    }
    var sortResult, sortKey = sortSchema.key, sortType = sortSchema.type;
    if (sortKey === "d2_workflow_state") {
      sortKey = "r_runtime_state";
      sortType = 2;
    }
    sortResult = sortUtils.compare(sortKey, left, right, sortType, false);
    if (sortResult === 0) {
      sortResult = sortUtils.compare("id", left, right, -1, false);
    }
    return sortResult;
  };
  return WorkflowCollection;
});