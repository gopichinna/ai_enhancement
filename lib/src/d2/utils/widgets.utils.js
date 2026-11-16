/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "csui/utils/contexts/factories/widget.settings.collection.factory", "dctmw/utils/authenticators/session", "d2/server.adaptors/converters/servercolumns", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/widgets.utils", "dctmw/utils/utils", "i18n!d2/server.adaptors/models/impl/nls/lang", "i18n!d2/widgets/workflow.timeline/impl/nls/lang" ], function(_, RestResources, RestLinkrels, serverQueryUtils, WidgetSettingsCollectionFactory, Session, ServerColumns, constants, widgetConstants, dctmWidgetUtils, utils, lang, widgetLang) {
  "use strict";
  return {
    performCustomValidationForWidget: function(widgetConfig, options) {
      var validation = {
        status: true
      };
      if (widgetConfig) {
        var widgetType = widgetConfig["widget_type"];
        switch (widgetType) {
         case widgetConstants.D2.MYSHARES:
          var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_MYSHARED_OBJECTS);
          if (!url) {
            validation.status = false;
            validation.errorMessage = lang.sharesWidgetDccMissing;
          }
          break;

         case widgetConstants.D2.WORKFLOWS:
          var nonAllowedWFReportingType = constants.WorkflowsReportingType.ALL;
          if (options && (options.scope === widgetConstants.WIDGET_SCOPE.ALL_WORKFLOWS || options.type === constants.WorkflowsReportingType.ALL)) {
            nonAllowedWFReportingType = constants.WorkflowsReportingType.USER;
          }
          if (widgetConfig && widgetConfig.widgetParams && widgetConfig.widgetParams["wf_report_type_smartview"] && widgetConfig.widgetParams["wf_report_type_smartview"] === nonAllowedWFReportingType) {
            validation.status = false;
            validation.errorMessage = lang.workflowReportingTypeError;
          }
          break;

         case widgetConstants.D2.DOCLIST:
          if (widgetConfig.widgetParams && widgetConfig.widgetParams.start_path_smartview === "invalid_path") {
            validation.status = false;
            validation.errorMessage = lang.doclistWidgetMissing;
          }
          break;

         case widgetConstants.D2.OPENURL:
          if (!widgetConfig.widgetParams && !widgetConfig.widgetParams.open_url) {
            validation.status = false;
            validation.errorMessage = lang.openUrlWidgetMissing;
          }
          break;

         default:
          break;
        }
      }
      return validation;
    },
    performWidgetExistenceValidation: function(widgetConfig, options) {
      var validation = {
        status: true
      };
      if (!widgetConfig) {
        validation.status = false;
        validation.errorMessage = options && options.errMissingWidgetConfig;
      }
      return validation;
    },
    buildTileOptions: function(tile, widgetConfig) {
      tile.options = tile.options || {};
      if (widgetConfig) {
        switch (widgetConfig["widget_type"]) {
         case widgetConstants.D2.DOCLIST:
          if (widgetConfig.widgetParams && widgetConfig.widgetParams.content_type === "DQL") {
            tile.id = constants.DQL_NODE_PREFIX + widgetConfig["object_name"];
          } else {
            tile.id = widgetConfig.widgetParams && widgetConfig.widgetParams.start_path_smartview || constants.NodeId.REPOSITORY;
          }
          break;

         case widgetConstants.D2.OPENURL:
          if (widgetConfig.widgetParams && widgetConfig.widgetParams.open_url) {
            tile.options.url = widgetConfig.widgetParams.open_url;
          }
          break;

         default:
          break;
        }
      }
    },
    getDefaultUrlParamsList: function() {
      return dctmWidgetUtils.getDefaultUrlParamsList();
    },
    getServerWidgetState: function(widgetStateModel) {
      var widgetState = {};
      widgetState["table_mode"] = this.getServerTableModes(widgetStateModel.get("tableMode"));
      if (widgetStateModel.get("isTreeOpen")) {
        widgetState["left_panel"] = widgetConstants.ServerLeftPanelConstants.TREE;
      } else if (widgetStateModel.get("isFacetOpen")) {
        widgetState["left_panel"] = widgetConstants.ServerLeftPanelConstants.FACET;
      } else if (widgetStateModel.get("isQueryFormOpen")) {
        widgetState["left_panel"] = widgetConstants.ServerLeftPanelConstants.QUERYFORM;
      } else {
        widgetState["left_panel"] = widgetConstants.ServerLeftPanelConstants.DEFAULT;
      }
      widgetState["page_size"] = widgetStateModel.get("pageSize") || 50;
      widgetState["show_all_version"] = widgetStateModel.get("showAllVersion") || false;
      widgetState["show_markup_status"] = widgetStateModel.get("showMarkupStatus") || false;
      if (widgetStateModel.get("filter")) {
        widgetState["filter"] = widgetStateModel.get("filter");
      }
      return widgetState;
    },
    prepareServerWidgetSettingsInContext: function(colPref) {
      var widgetType = colPref.options.widgetType, widgetName = colPref.options.widgetName;
      if (!colPref.has("d2sv_widget_state")) {
        var configuredServerTableMode = colPref.options?.widgetConfig?.getParam("widget_view_mode_smartview"), configTableMap = this.getConfigTableModeMap(), configuredTableMode = configuredServerTableMode && configTableMap[configuredServerTableMode], isTreeEnabled = colPref.options?.widgetConfig?.getParam("is_enable_tree_nav_smartview"), defaultWidgetState = this.getDefaultWidgetState();
        if (widgetType === widgetConstants.D2.TASKS) {
          defaultWidgetState["left_panel"] = widgetConstants.ServerLeftPanelConstants.FACET;
        }
        if ([ widgetConstants.D2.WORKFLOWS, widgetConstants.D2.ADMIN_WORKFLOWS ].includes(widgetType)) {
          defaultWidgetState["left_panel"] = widgetConstants.ServerLeftPanelConstants.QUERYFORM;
        }
        if (configuredTableMode) {
          defaultWidgetState["table_mode"] = configuredTableMode;
        }
        if (isTreeEnabled === "true") {
          defaultWidgetState["left_panel"] = widgetConstants.ServerLeftPanelConstants.TREE;
        }
        colPref.set("d2sv_widget_state", defaultWidgetState);
      }
      var widgetState = colPref.get("d2sv_widget_state"), preferencesStorageId = this.getPreferenceStorageId(widgetType, widgetName), columnWidthMap = this.getColumnsWidthObj(colPref), widgetSetting = this.prepareWidgetSettingsInContext(widgetState, preferencesStorageId, columnWidthMap);
      widgetSetting["colPref"] = colPref;
    },
    prepareLocalWidgetSettingsInContext: function(preferencesStorageId) {
      var widgetState = this.getWidgetStateFromLocal(preferencesStorageId);
      if (!widgetState) {
        widgetState = this.getDefaultWidgetState();
      }
      this.prepareWidgetSettingsInContext(widgetState, preferencesStorageId);
    },
    prepareWidgetSettingsInContext: function(widgetState, preferencesStorageId, columnWidthMap) {
      var widgetSettingsCollection = Session.get().getContext().getCollection(WidgetSettingsCollectionFactory), clientWidgetSettings = this.getClientWidgetSettings(widgetState);
      clientWidgetSettings.preferencesStorageId = preferencesStorageId;
      if (columnWidthMap) {
        clientWidgetSettings.columns = columnWidthMap;
      }
      widgetSettingsCollection.add(clientWidgetSettings);
      return widgetSettingsCollection.get(preferencesStorageId);
    },
    getWidgetStateFromLocal: function(preferencesStorageId) {
      var widgetPreferenceStorageId = constants.StorageKey.WIDGET_STATE + ":" + preferencesStorageId, localStorage = utils.getLocalStore(widgetPreferenceStorageId);
      return localStorage.get("d2sv_widget_state");
    },
    getColumnsWidthObj: function(colPref) {
      let columnsWidth = {}, serverSideColumnAttribute = ServerColumns.getColumnConverter(colPref.get("colType")).getServerClientAttrNameMap();
      _.each(colPref.columns.models, model => {
        let columnName = model.get("name"), clientColumnName = serverSideColumnAttribute[columnName];
        if (clientColumnName) {
          columnName = clientColumnName;
        }
        if (!columnsWidth[columnName]) {
          columnsWidth[columnName] = {};
        }
        columnsWidth[columnName].width = model.get("d2sv_width");
      });
      return columnsWidth;
    },
    getPreferenceStorageId: function(param1, param2) {
      let preferenceStorageId = param1;
      if (param2) {
        preferenceStorageId = preferenceStorageId + "_" + param2;
      }
      return widgetConstants.WidgetPreferenceId.NODESTABLE + preferenceStorageId;
    },
    getWidgetPreference: function(widgetType, widgetName) {
      let widgetSettingsCollection = Session.get().getContext().getCollection(WidgetSettingsCollectionFactory);
      return widgetSettingsCollection.get(this.getPreferenceStorageId(widgetType, widgetName));
    },
    getClientWidgetSettings: function(widgetState) {
      var widgetSettingsData = {
        pageSize: widgetState["page_size"] || 30,
        showAllVersion: widgetState["show_all_version"] || false,
        showMarkupStatus: widgetState["show_markup_status"] || false
      };
      if (widgetState["table_mode"] === widgetConstants.ServerTableModesConstants.PINNED) {
        widgetSettingsData["tableMode"] = widgetConstants.TableModes.NOWRAP;
      } else if (widgetState["table_mode"] === widgetConstants.ServerTableModesConstants.GRID) {
        widgetSettingsData["tableMode"] = widgetConstants.TableModes.THUMBNAIL;
      } else {
        widgetSettingsData["tableMode"] = widgetConstants.TableModes.WRAP;
      }
      if (widgetState["left_panel"] === widgetConstants.ServerLeftPanelConstants.TREE) {
        widgetSettingsData["isTreeOpen"] = true;
        widgetSettingsData["isFacetOpen"] = false;
        widgetSettingsData["isQueryFormOpen"] = false;
      } else if (widgetState["left_panel"] === widgetConstants.ServerLeftPanelConstants.FACET) {
        widgetSettingsData["isFacetOpen"] = true;
        widgetSettingsData["isTreeOpen"] = false;
        widgetSettingsData["isQueryFormOpen"] = false;
      } else if (widgetState["left_panel"] === widgetConstants.ServerLeftPanelConstants.QUERYFORM) {
        widgetSettingsData["isQueryFormOpen"] = true;
        widgetSettingsData["isTreeOpen"] = false;
        widgetSettingsData["isFacetOpen"] = false;
      } else {
        widgetSettingsData["isTreeOpen"] = false;
        widgetSettingsData["isFacetOpen"] = false;
        widgetSettingsData["isQueryFormOpen"] = false;
      }
      return widgetSettingsData;
    },
    getServerTableModes: function(tableMode) {
      var serverTableMode = widgetConstants.ServerTableModesConstants.LIST;
      if (tableMode === widgetConstants.TableModes.THUMBNAIL) {
        return widgetConstants.ServerTableModesConstants.GRID;
      } else if (tableMode === widgetConstants.TableModes.NOWRAP) {
        return widgetConstants.ServerTableModesConstants.PINNED;
      }
      return serverTableMode;
    },
    getDefaultWidgetState: function() {
      return {
        page_size: 30,
        show_all_version: false,
        table_mode: widgetConstants.ServerTableModesConstants.LIST,
        left_panel: widgetConstants.ServerLeftPanelConstants.DEFAULT
      };
    },
    saveWidgetStateInLocalStorage: function(widgetState, preferencesStorageId) {
      var widgetPreferenceStorageId = constants.StorageKey.WIDGET_STATE + ":" + preferencesStorageId, localStorage = utils.getLocalStore(widgetPreferenceStorageId);
      localStorage.set("d2sv_widget_state", widgetState);
    },
    getConfigTableModeMap: function() {
      var serverTableModeMap = {
        "table-list-limited-columns": widgetConstants.ServerTableModesConstants.LIST,
        "table-list-pinned-columns": widgetConstants.ServerTableModesConstants.PINNED,
        "table-grid-thumbnail": widgetConstants.ServerTableModesConstants.GRID
      };
      return serverTableModeMap;
    },
    handleColumnSortRestriction: function(tableView, options) {
      if (tableView) {
        if (tableView.collection?.ignoreServerSortOnRestrictedColumns === true) {
          let $tableHeaderRow = tableView.$el.find("table.binf-table > thead > tr > th[data-csui-attribute]");
          if ($tableHeaderRow.length > 0) {
            $tableHeaderRow.removeClass("client-sort-column");
            if (tableView.collection?.hasMoreRecords === true) {
              let isAscSort = true, $sortColumnHeader = $tableHeaderRow.filter(".sorting_asc");
              if ($sortColumnHeader.length === 0) {
                isAscSort = false;
                $sortColumnHeader = $tableHeaderRow.filter(".sorting_desc");
              }
              if ($sortColumnHeader.length === 1) {
                let colname = $sortColumnHeader.attr("data-csui-attribute"), col = tableView?.columns.findWhere({
                  column_key: colname
                });
                if (col && (col.get("repeating") === true || col.get("dictionary") === true)) {
                  if ($sortColumnHeader.length > 0) {
                    let colName = col.get("name");
                    $sortColumnHeader.addClass("client-sort-column");
                    if (isAscSort) {
                      $sortColumnHeader.attr({
                        title: _.str.sformat(options.restrictedColumnDescendingTooltip, colName),
                        "aria-label": (options.restrictedColumnAscendingAria, colName)
                      });
                    } else {
                      $sortColumnHeader.attr({
                        title: _.str.sformat(options.restrictedColumnAscendingTooltip, colName),
                        "aria-label": _.str.sformat(options.restrictedColumnDescendingAria, colName)
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    getRepoUserName: function() {
      return RestResources.getCurrentUser().get("name") + "_" + RestResources.getCurrentRepository().get("name");
    },
    getAncestorInfo: function(widgetName) {
      var cachedData = this.getFolderPathInfo();
      if (cachedData) {
        var ancestorInfo = cachedData[widgetName + constants.StorageKey.ANCESTOR_INFO];
        if (cachedData?.lastNavigated && ancestorInfo) {
          return ancestorInfo;
        }
      }
    },
    setFolderPathInfo: function(lastNavigated, ancestorInfo) {
      var namedLocalStorage = utils.getLocalStore(constants.StorageKey.LAST_NAVIGATED_PATH);
      var lastPageInfo = this.getFolderPathInfo() || {};
      lastPageInfo["lastNavigated"] = lastNavigated;
      lastPageInfo[ancestorInfo?.widgetName + constants.StorageKey.ANCESTOR_INFO] = ancestorInfo;
      namedLocalStorage.set(this.getRepoUserName(), lastPageInfo);
    },
    getFolderPathInfo: function() {
      var namedLocalStorage = utils.getLocalStore(constants.StorageKey.LAST_NAVIGATED_PATH);
      return namedLocalStorage.get(this.getRepoUserName());
    },
    clearFolderPathInfo: function(widgetName) {
      var namedSessionStorage = utils.getSessionStore("navigatedFromDoclist"), isLastNavigatedCacheEnabled = this.getFolderPathInfo().lastNavigated;
      if (isLastNavigatedCacheEnabled) {
        this.setFolderPathInfo(isLastNavigatedCacheEnabled, {
          widgetName: widgetName
        });
        namedSessionStorage && namedSessionStorage.remove("navigatedFromDoclist");
      }
    },
    getFilterOptions: function(workFlowFilters) {
      var filterOptions = [ {
        name: "manual",
        title: widgetLang.labelFilterTypeManual,
        group: "tasks",
        fExpression: {
          activity_type: constants.WorkflowActivityType.MANUAL,
          type: constants.Types.TASK
        }
      }, {
        name: "auto",
        title: widgetLang.labelFilterTypeAutomatic,
        group: "tasks",
        fExpression: {
          activity_type: constants.WorkflowActivityType.AUTOMATIC,
          type: constants.Types.TASK
        }
      }, {
        name: "all",
        title: widgetLang.labelFilterTypeNone,
        group: "tasks",
        fExpression: {
          type: constants.Types.TASK
        }
      }, {
        name: "events",
        title: widgetLang.labelFilterTypeEvents,
        group: "events",
        fExpression: {
          type: constants.Types.WORKFLOW_EVENT
        }
      } ];
      _.each(workFlowFilters, function(filter) {
        filter["name"] = filter.filter_name;
        filter["title"] = filter.filter_label ? filter.filter_label : filter.filter_name;
        filter["group"] = "tasks";
        filter["serverSideFilter"] = true;
        filterOptions.splice(filterOptions.length - 1, 0, filter);
      });
      return filterOptions;
    }
  };
});