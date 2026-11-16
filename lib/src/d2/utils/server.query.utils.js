/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "nuc/models/mixins/rules.matching/rules.matching.mixin", "csui/utils/contexts/factories/widget.settings.collection.factory", "d2/controls/globalmessage/globalmessage", "d2/models/table/column.preference", "d2/utils/contexts/factories/display.types.factory", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/converters/task", "d2/server.adaptors/converters/workflow", "d2/server.adaptors/converters/servercolumns", "d2/commands/node.actions.rules", "d2/server.adaptors/models/impl/user.actions.rules", "d2/server.adaptors/models/impl/vdoc.actions.rules", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/utils", "d2/utils/vdoc.utils", "d2/utils/widgets.utils", "d2/utils/clipboard.manager", "dctmw/utils/authenticators/session", "d2/commands/open.plugins/impl/iviewer/utils", "i18n!d2/utils/impl/nls/lang" ], function(_, $, Url, RulesMatchingMixin, WidgetSettingsCollectionFactory, GlobalMessage, ColumnPreferenceModel, DisplayTypesFactory, nodeConverter, taskConverter, workflowConverter, serverColumnsConverter, nodeActionRules, userActionRules, vdocActionRules, RestResources, RestLinkrels, constants, widgetConstants, utils, vdUtil, widgetUtils, ClipboardManager, Session, iviewerUtils, lang) {
  "use strict";
  var columnPreferences = {}, dictionaryInfo = null;
  var ActionRulesMatcher = RulesMatchingMixin.mixin({});
  ActionRulesMatcher.findRule = function(query, rulesType) {
    var me = this, actionRules = rulesType === "user" ? userActionRules : rulesType === "vdoc" ? vdocActionRules : nodeActionRules;
    return _.find(actionRules, function(rule) {
      return me.matchRules(query, rule);
    });
  };
  function getDisplayTypesCollection() {
    const context = Session.get().getContext();
    return context.getCollection(DisplayTypesFactory, {
      permanent: true,
      detached: true
    });
  }
  return {
    appendQueryParams: function(url, options) {
      var queryMap = {}, colname, col, converter = nodeConverter;
      if (!url.includes("inline=true")) {
        queryMap = {
          inline: true
        };
      }
      if (options.widgetType === widgetConstants.D2.TASKS) {
        converter = taskConverter;
      } else if ([ widgetConstants.D2.WORKFLOWS, widgetConstants.D2.ADMIN_WORKFLOWS ].includes(options.widgetType)) {
        converter = workflowConverter;
      }
      if (options.paginate === true) {
        queryMap["page"] = (options.scope.skipCount || 0) / (options.scope.topCount || 25) + 1;
        queryMap["items-per-page"] = options.scope.topCount;
        queryMap["include-total"] = true;
      }
      if (options.sort === true) {
        var sortarr = options.scope.orderBy.split(" "), sort = "", skipServerSort = false;
        if (sortarr.length > 1) {
          colname = sortarr[0];
          col = _.findWhere(options.clientColumns, {
            column_key: colname
          });
          if (options.ignoreServerSortOnRestrictedColumns === true && (col && (col["repeating"] === true || col["dictionary"] === true))) {
            skipServerSort = true;
          }
          sortarr[0] = converter.getClientServerAttrNameMap()[colname] || sortarr[0];
          if (col && sortarr[0] && skipServerSort !== true) {
            if (col.type === -1) {
              sortarr.push("no-case");
            }
            sort = sortarr.join(" ");
          }
        }
        if (skipServerSort !== true) {
          queryMap["sort"] = sort;
        }
      }
      if (options.filter === true) {
        var filterObject;
        if (options.scope.filters) {
          filterObject = _.omit(options.scope.filters, function(value) {
            return value === undefined || value === null || value === "";
          });
        }
        var filterArray = _.keys(filterObject);
        if (filterArray.length > 0) {
          colname = converter.getClientServerAttrNameMap()[filterArray[0]] || filterArray[0];
          col = _.findWhere(options.clientColumns, {
            column_key: filterArray[0]
          });
          var val = filterObject[filterArray[0]];
          var filter = colname, type;
          if (col.server_filter_key) {
            filter = col.server_filter_key;
          }
          if (colname.indexOf(".") > 0) {
            var filters = colname.split(".");
            filter = filters[1];
            type = filters[0];
          }
          if (col.repeating === true) {
            val = val ? val.toLowerCase() : "";
            queryMap["filter"] = "contains(lower(" + filter + "/item),'" + val + "')";
          } else if (col.type === 2) {
            queryMap["filter"] = filter + "=" + val;
          } else {
            val = val ? val.toLowerCase() : "";
            queryMap["filter"] = "contains(lower(" + filter + "),'" + val + "')";
          }
          if (type !== undefined) {
            queryMap["custom-filter-property-name"] = colname;
          }
        }
      }
      if (options.facetFilter === true) {
        if (queryMap["filter"]) {
          options.scope.serverFacetFilters.facetFilters.push(queryMap["filter"]);
          queryMap["filter"] = undefined;
        }
        _.each(options.scope.serverFacetFilters.facetFilters, function(filter) {
          if (!queryMap["filter"]) {
            queryMap["filter"] = "( " + filter + " ) ";
          } else {
            queryMap["filter"] = queryMap["filter"] + " and ( " + filter + " )";
          }
        });
        if (!_.isEmpty(options.scope.serverFacetFilters.categoryFilters)) {
          queryMap["task-category-ids"] = options.scope.serverFacetFilters.categoryFilters;
        }
      }
      if (options.subTypeFilters) {
        var filterStringArray = [ "type(dm_folder)" ];
        _.each(options.subTypeFilters, function(filter) {
          filterStringArray.push("type(" + filter + ")");
        });
        if (queryMap["filter"]) {
          queryMap["filter"] = queryMap["filter"] + " and (" + filterStringArray.join(" or ") + ")";
        } else {
          queryMap["filter"] = "(" + filterStringArray.join(" or ") + ")";
        }
      }
      if (options.widgetName) {
        queryMap["widget-name"] = options.widgetName;
      }
      if (options.urlFilter) {
        queryMap["filter"] = options.urlFilter;
      }
      if (options.extraParams) {
        _.extend(queryMap, options.extraParams);
      }
      if (options.parent_id) {
        queryMap["parent_id"] = options.parent_id;
      }
      return Url.appendQuery(url, Url.combineQueryString(queryMap));
    },
    parseResponse: function(response, options) {
      if (options.paginate === true) {
        var pageIndex = response.page, pageSize = response["items-per-page"];
        options.scope.actualSkipCount = (pageIndex - 1) * pageSize;
        options.scope.totalCount = options.scope.filteredCount = response.total;
      }
      var propertiesFn = options.propertiesFn || function(entry) {
        return nodeConverter.convertNode(entry.content);
      };
      return (response.entries || []).map(propertiesFn);
    },
    fetchColumnPreferences: function(options) {
      var deferred = $.Deferred(), wType = options.widgetType, wName = options.widgetName, defaultType = options.defaultType, cacheKey = wName + "~" + wType + "~" + defaultType;
      if (!wType || !wName) {
        deferred.reject(new Error("widgetName and widgetType must be provided as part of options"));
      } else {
        var me = this;
        this._fetchColumnDisplayInfo({
          connector: options.connector
        }).done(function(typeInfo) {
          var cachedColPref = columnPreferences[cacheKey];
          if (cachedColPref) {
            widgetUtils.prepareServerWidgetSettingsInContext(cachedColPref);
            var clientColumns = serverColumnsConverter.convertColumns(cachedColPref, options.columnOptions, typeInfo);
            setTimeout(function() {
              deferred.resolve(clientColumns, cachedColPref);
            }, 0);
          } else {
            var colPref = new ColumnPreferenceModel({}, {
              connector: options.connector,
              widgetType: wType,
              widgetName: wName,
              defaultType: defaultType,
              widgetConfig: me.getWidgetConfig(wType, wName)
            });
            colPref.fetch().done(function() {
              var clientColumns;
              columnPreferences[cacheKey] = colPref;
              widgetUtils.prepareServerWidgetSettingsInContext(colPref);
              clientColumns = serverColumnsConverter.convertColumns(colPref, options.columnOptions, typeInfo);
              deferred.resolve(clientColumns, colPref);
            }).fail(function(error) {
              deferred.reject(error);
            });
          }
        }).fail(function(err) {
          deferred.reject(err);
        });
      }
      return deferred.promise();
    },
    saveColumnPreferences: function(options) {
      var deferred = $.Deferred(), wType = options.widgetType, wName = options.widgetName, defaultType = options.defaultType, cacheKey = wName + "~" + wType + "~" + defaultType, colPref = options.columnPreference, converter = nodeConverter;
      if (wType === widgetConstants.D2.TASKS) {
        converter = taskConverter;
      } else if ([ widgetConstants.D2.WORKFLOWS, widgetConstants.D2.ADMIN_WORKFLOWS ].includes(wType)) {
        converter = workflowConverter;
      }
      if (!wType || !wName || !colPref) {
        deferred.reject(new Error("widgetName, widgetType and columnPreference must be provided as part of options"));
      } else {
        var sortarr = options.sortOrder && options.sortOrder.split(" ") || [];
        if (sortarr.length > 1) {
          var colname = sortarr[0];
          sortarr[0] = converter.getClientServerAttrNameMap()[colname] || colname;
          colPref.columns.each(function(pref) {
            if (serverColumnsConverter.isSortColumn(pref, sortarr[0])) {
              pref.set("direction", sortarr[1] === "desc" ? "Desc" : "Asc");
            } else if (!_.isEmpty(pref.get("direction"))) {
              pref.unset("direction");
            }
          });
        }
        colPref.save().done(function() {
          var clientColumns;
          columnPreferences[cacheKey] = colPref;
          clientColumns = serverColumnsConverter.convertColumns(colPref, options.columnOptions);
          deferred.resolve(clientColumns, colPref);
        }).fail(function(xhr, status, err) {
          GlobalMessage.showMessage("error", lang.SettingsSavePrefFailed, err);
          deferred.reject(err);
        });
      }
      return deferred.promise();
    },
    getWidgetConfig: function(widgetType, widgetName) {
      if (!widgetType || !widgetName) {
        throw new Error("widgetType and widgetName must be provided in the arguments");
      }
      var widgetConfigs = RestResources.getWigetConfigs();
      if (widgetConfigs[widgetType] && widgetConfigs[widgetType][widgetName]) {
        return widgetConfigs[widgetType][widgetName];
      }
    },
    fetchPermissions: function(options) {
      var deferred = $.Deferred();
      this.fetchDataForObjects({
        ids: options.ids,
        connector: options.connector,
        permissions: {
          permissionLevel: options.permissionLevel
        }
      }).done(function(response) {
        deferred.resolve(response.permissions);
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    fetchFavorites: function(options) {
      var deferred = $.Deferred();
      this.fetchDataForObjects({
        ids: options.ids,
        connector: options.connector,
        favorites: true
      }).done(function(response) {
        deferred.resolve(response.favorites);
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    fetchActions: function(options) {
      var deferred = $.Deferred();
      this.fetchDataForObjects({
        ids: options.ids,
        connector: options.connector,
        deferred: options.deferred,
        actions: {
          menuType: options.menuType,
          widgetType: options.widgetType,
          queryAction: options.queryAction,
          parentIds: options.parentIds,
          associateIds: options.associateIds,
          rulesType: options.rulesType
        }
      }).done(function(response) {
        deferred.resolve(response.actions);
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    fetchLocations: function(options) {
      var deferred = $.Deferred();
      this.fetchDataForObjects({
        ids: options.ids,
        connector: options.connector,
        locations: {
          fullPath: options.fullPath
        }
      }).done(function(response) {
        deferred.resolve(response.locations);
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    fetchThumbnailURLs: function(ids, connector) {
      var deferred = $.Deferred(), currRepoLinks = RestResources.getCurrentRepository().get("links"), url = RestLinkrels.getLink(currRepoLinks, RestLinkrels.OBJECTS_THUMBNAIL_URL);
      url = Url.appendQuery(url, Url.makeMultivalueParameter("object-ids", ids));
      url = Url.appendQuery(url, Url.combineQueryString({
        inline: true
      }));
      $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "GET",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function(response) {
          var results = [];
          _.each(response.entries, function(item) {
            if (item.content.properties["thumbnail_url"]) {
              results.push({
                id: item.content.properties["r_object_id"],
                thumbnailURL: item.content.properties["thumbnail_url"]
              });
            }
          });
          deferred.resolve(results);
        },
        error: function(request) {
          deferred.reject(request);
        }
      }));
      return deferred.promise();
    },
    fetchDataForObjects: function(options) {
      var promises = [], deferred = $.Deferred();
      if (_.size(options.ids) > constants.MAX_OBJECTIDS_ALLOWED) {
        var objectIdChunks = _.chunk(options.ids, constants.MAX_OBJECTIDS_ALLOWED);
        _.each(objectIdChunks, function(objectIdChunk) {
          var opt = _.extend({}, options);
          _.extend(opt, {
            ids: objectIdChunk,
            useBatch: true
          });
          promises.push(this._fetchDataForObjects(opt));
        }, this);
      } else {
        promises.push(this._fetchDataForObjects(options));
      }
      if (options.ivMarkupCounts) {
        promises.push(iviewerUtils.getMarkupCounts(options.connector, options.ids));
      }
      $.whenAll.apply($, promises).done(function(results) {
        var mergedResults = {};
        if (results && results.length) {
          _.each(results, function(res) {
            _.each(res, function(object, key) {
              mergedResults[key] = object;
            });
          });
        }
        return deferred.resolve(mergedResults);
      }).fail(function(error) {
        error = $.isArray(error) ? error[0] : error;
        deferred.reject(error);
      });
      return deferred.promise();
    },
    fetchDataAsPropertiesForObjects: function(options) {
      var dfd = $.Deferred();
      this.fetchDataForObjects(options).done(function(output) {
        var objectsProperties = {};
        _.each(options.ids, function(nodeId) {
          var properties = {};
          if (output.permissions) {
            var permission = output.permissions[nodeId];
            properties["basePermissions"] = permission ? permission["base-permission"] : {};
          }
          if (output.locations && output.locations[nodeId]) {
            properties["parent_id_expand"] = output.locations[nodeId];
            properties["parent_name"] = output.locations[nodeId].name;
          }
          if (output.favorites) {
            var favorite = output.favorites[nodeId];
            properties["favorite"] = favorite ? favorite.favorite : false;
          }
          if (output.externalShare && output.externalShare[nodeId]) {
            properties["externalShare"] = output.externalShare[nodeId];
          }
          if (output.previewFormats && output.previewFormats[nodeId]) {
            properties["d2_preview_format"] = output.previewFormats[nodeId]["preview-format"];
          }
          if (output.relationsCount && output.relationsCount[nodeId]) {
            properties["relations_count"] = output.relationsCount[nodeId]["relations_count"];
          }
          if (output.commentsCount && output.commentsCount[nodeId]) {
            properties["wnd_comments"] = output.commentsCount[nodeId]["comments_count"];
          }
          if (output.markupCount && output.markupCount[nodeId]) {
            properties["viewer_markup_count"] = output.markupCount[nodeId]["markup_count"];
          }
          objectsProperties[nodeId] = properties;
        });
        if (_.isFunction(options.cbPrepareObjectsPropertiesFromBatchResponse)) {
          options.cbPrepareObjectsPropertiesFromBatchResponse(output, objectsProperties);
        }
        dfd.resolve(objectsProperties);
      }).fail(dfd.reject);
      return dfd.promise();
    },
    _fetchDataForObjects: function(options) {
      var me = this, deferred = $.Deferred(), currRepoLinks = RestResources.getCurrentRepository().get("links"), url, batchPayload = [], skippedBatches = [], idMap, output = {};
      function addToBatch(batchId, url, rulesType, skipIdCheck = false) {
        var ids = options.ids;
        if (batchId === "permissions") {
          ids = _.filter(ids, function(id) {
            var node = {
              id: id
            };
            nodeConverter.setNodeType(node);
            return node.type !== constants.Types.CABINET && node.type !== constants.Types.FOLDER;
          });
        }
        if (batchId === "actions" && rulesType === "user") {
          skipIdCheck = true;
        }
        if ((!ids || ids.length === 0) && !skipIdCheck) {
          skippedBatches.push(batchId);
          output[batchId] = {};
          return;
        }
        if (!skipIdCheck) {
          url = Url.appendQuery(url, Url.makeMultivalueParameter("object-ids", ids));
        }
        batchPayload.push({
          id: batchId,
          request: {
            method: "GET",
            uri: url
          }
        });
      }
      function remapId(output) {
        var mappedOutput = {};
        _.each(output, function(value, id) {
          mappedOutput[idMap ? idMap[id] : id] = value;
        });
        return mappedOutput;
      }
      function parseResponse(id, response, output) {
        switch (id) {
         case "permissions":
          output.permissions = remapId(me._parsePermissions(response));
          break;

         case "favorites":
          output.favorites = remapId(me._parseFavorites(response));
          break;

         case "actions":
          output.actions = me._parseActions(response, options.actions && options.actions.rulesType);
          var defaultActions = me._parseDefaultActions(response, options.actions && options.actions.rulesType);
          if (options.actions && options.actions.rulesType !== "vdoc") {
            output.actions = remapId(output.actions);
            defaultActions = remapId(defaultActions);
          }
          _.each(defaultActions, function(values, key) {
            _.each(values, function(value) {
              output.actions[key].push(value);
            });
          });
          break;

         case "locations":
          output.locations = remapId(me._parseLocations(options.ids, response, options.locations && options.locations.fullPath));
          break;

         case "externalShare":
          output.externalShare = remapId(me._parseExternalShare(response));
          break;

         case "relationsCount":
          output.relationsCount = remapId(me._parseRelationsCount(response));
          break;

         case "previewFormats":
          output.previewFormats = remapId(me._parsePreviewFormats(response));
          break;

         case "wfNotesConfig":
          output.wfNotesConfig = remapId(me._parseWfNotesConfig(response));
          break;

         case "commentsCount":
          output.commentsCount = remapId(me._parseCommentsCount(response));
          break;
        }
        if (_.isFunction(options.cbCollateOperationIntoBatchResponse)) {
          options.cbCollateOperationIntoBatchResponse(id, response, output);
        }
      }
      function isClipboardContentValid() {
        var widgetType = options.actions.widgetType;
        return !_.find(ClipboardManager.getStoredItems(), function(item) {
          return item.widgetScope && item.widgetScope !== widgetType;
        });
      }
      if (options.ids) {
        idMap = {};
        options.ids = _.compact(_.map(options.ids, function(id) {
          if (!nodeConverter.isNonDCTMNode(id)) {
            idMap[id] = id;
            return id;
          }
          return null;
        }));
      }
      if (options.permissions) {
        url = Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "objects-specific-permission");
        url = Url.appendQuery(url, Url.combineQueryString({
          "permission-level": options.permissions.permissionLevel
        }));
        addToBatch("permissions", url);
      }
      if (options.favorites) {
        url = Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "favorites-checker");
        addToBatch("favorites", url);
      }
      if (options.actions) {
        url = RestLinkrels.getLink(currRepoLinks, RestLinkrels.ACTIONS);
        var params = {
          type: options.actions.menuType,
          widgetType: options.actions.widgetType
        };
        if (options.actions.rulesType === "vdoc" && !!options.actions[vdUtil.QUERY_PARAM_VD_FRAME_ID]) {
          params[vdUtil.QUERY_PARAM_VD_FRAME_ID] = options.actions[vdUtil.QUERY_PARAM_VD_FRAME_ID];
          if (options.actions[vdUtil.QUERY_VD_RELATION_IDS]) {
            params[vdUtil.QUERY_VD_RELATION_IDS] = options.actions[vdUtil.QUERY_VD_RELATION_IDS];
          }
          if (options.actions[vdUtil.QUERY_VDM_NUMBERS]) {
            params[vdUtil.QUERY_VDM_NUMBERS] = options.actions[vdUtil.QUERY_VDM_NUMBERS];
          }
        } else if (options.actions.rulesType === "vdoc" && !!options.actions["vdFrameIds"]) {
          params[vdUtil.QUERY_PARAM_VD_FRAME_ID] = options.actions["vdFrameIds"];
          if (options.actions["vdRelationIds"]) {
            params[vdUtil.QUERY_VD_RELATION_IDS] = options.actions["vdRelationIds"];
          }
          if (options.actions["vdmNumbers"]) {
            params[vdUtil.QUERY_VDM_NUMBERS] = options.actions["vdmNumbers"];
          }
        }
        if (!ClipboardManager.isClipboardEmpty() && isClipboardContentValid()) {
          switch (ClipboardManager.getOperation()) {
           case "cut":
            params["clipboard-operation"] = "D2_ACTION_CUT";
            break;

           case "copy":
            params["clipboard-operation"] = "D2_ACTION_COPY";
            break;
          }
          params["clipboard-contains-reference"] = false;
          params["clipboard-value"] = _.map(ClipboardManager.getStoredItems(), function(item) {
            return item.nodeId;
          });
        }
        if (options.actions.queryAction) {
          params["include-actions"] = options.actions.queryAction;
        }
        if (options.actions.contentPathId) {
          params["contentPathId"] = options.actions.contentPathId;
        }
        params["include-subtype"] = true;
        url = Url.appendQuery(url, Url.combineQueryString(params));
        if (options.actions.parentIds && options.actions.parentIds.length >= 0) {
          url = Url.appendQuery(url, Url.makeMultivalueParameter("parent-ids", options.actions.parentIds));
        }
        if (options.actions.associateIds && options.actions.associateIds.length >= 0) {
          url = Url.appendQuery(url, Url.makeMultivalueParameter("associate_id", options.actions.associateIds));
        }
        addToBatch("actions", url, options.actions.rulesType);
      }
      if (options.locations) {
        url = RestLinkrels.getLink(currRepoLinks, RestLinkrels.OBJECTS_LOCATIONS);
        addToBatch("locations", url);
      }
      if (options.externalShare) {
        url = RestLinkrels.getLink(currRepoLinks, RestLinkrels.D2_EXTERNAL_SHARE_CHECKER);
        if (url) {
          addToBatch("externalShare", url);
        }
      }
      if (options.relationsCount) {
        url = RestLinkrels.getLink(currRepoLinks, RestLinkrels.D2_OBJECTS_RELATIONS_COUNT);
        url = this.appendQueryParams(url, {});
        addToBatch("relationsCount", url);
      }
      if (options.previewFormats) {
        url = RestLinkrels.getLink(currRepoLinks, RestLinkrels.D2_PREVIEW_FORMATS);
        url && addToBatch("previewFormats", url);
      }
      if (options.wfNotesConfig) {
        url = RestLinkrels.getLink(currRepoLinks, RestLinkrels.D2_WORKFLOW_NOTES_CONFIG);
        addToBatch("wfNotesConfig", url);
      }
      if (options.commentsCount) {
        url = Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "comments-count");
        addToBatch("commentsCount", url);
      }
      if (_.isFunction(options.cbAddOperationsToBatchRequestPayload)) {
        const payload = options.cbAddOperationsToBatchRequestPayload(options);
        _.keys(payload).forEach(opId => {
          addToBatch(opId, payload[opId], null, true);
        });
      }
      if (batchPayload.length === 0 && skippedBatches.length === 0) {
        deferred.reject("At least one of the following attributes are mandatory: permissions, favorites, actions, locations, externalShare, relationsCount, previewFormats, wfNotesConfig.");
      } else if (batchPayload.length === 1 && !options.useBatch) {
        $.ajax(options.connector.extendAjaxOptions({
          url: batchPayload[0].request.uri,
          skipSWCache: options.skipSWCache,
          success: function(response) {
            parseResponse(batchPayload[0].id, response, output);
            deferred.resolve(output);
          },
          error: function(request) {
            deferred.reject(request);
          }
        }));
      } else if (batchPayload.length > 1 || options.useBatch) {
        utils.makeBatchAjaxCall({
          connector: options.connector,
          operations: batchPayload,
          skipSWCache: options.skipSWCache
        }).done(function(successful, failed) {
          if (failed && failed.length > 0) {
            deferred.reject();
            return;
          }
          _.each(successful, function(operation) {
            parseResponse(operation.id, operation.output, output);
          });
          deferred.resolve(output);
        }).fail(function(error) {
          deferred.reject(error);
        });
      } else {
        deferred.resolve(output);
      }
      return deferred.promise();
    },
    _fetchColumnDisplayInfo: function() {
      var deferred = $.Deferred();
      if (dictionaryInfo !== null) {
        deferred.resolve(dictionaryInfo);
      } else {
        var displayTypes = getDisplayTypesCollection(), dctmTypeData = RestResources.getDctmTypeData();
        displayTypes.ensureFetched().done(function() {
          dictionaryInfo = {};
          displayTypes.each(function(type) {
            var attributes = type.get("properties");
            var dictionaryAttrs = _.where(attributes, {
              "has-dictionary": true
            });
            if (!_.isEmpty(dictionaryAttrs)) {
              var typeName = type.get("name"), subTypes = _.pluck(dctmTypeData.getAllSubTypes(typeName), "name"), superTypes = _.pluck(dctmTypeData.getSuperTypes(typeName), "name"), typeHierarchy = subTypes.concat(superTypes).concat(typeName);
              _.each(dictionaryAttrs, function(attr) {
                if (!_.has(dictionaryInfo, attr.name)) {
                  dictionaryInfo[attr.name] = [];
                }
                dictionaryInfo[attr.name] = dictionaryInfo[attr.name].concat(typeHierarchy);
                dictionaryInfo[attr.name] = _.uniq(dictionaryInfo[attr.name], false);
              });
            }
          });
          deferred.resolve(dictionaryInfo);
        }).fail(function(err) {
          deferred.reject(err);
        });
      }
      return deferred.promise();
    },
    _parsePermissions: function(response) {
      var output = {};
      _.each(response.entries || [], function(entry) {
        output[entry.content.id] = entry.content;
      });
      return output;
    },
    _parseFavorites: function(response) {
      var output = {};
      _.each(response.entries || [], function(entry) {
        output[entry.content.id] = entry.content;
      });
      return output;
    },
    _parseActions: function(response, rulesType) {
      var output = {};
      _.each(response.entries || [], function(entry) {
        var actionItems = entry.content.actionItems || [], relationId = entry.content[vdUtil.PROP_VD_RELATION_ID], vdmNumber = entry.content[vdUtil.PROP_VDM_NUMBER];
        var actions = actionItems.map(function(item) {
          if (item.properties && !item.properties.isDisabled && !item.properties.isHidden) {
            item.nodeId = entry.id;
            var rule = ActionRulesMatcher.findRule(item, rulesType);
            if (rule) {
              var action = {
                signature: item.properties && item.properties.subMenuType ? item.id : rule.command_key,
                commandData: _.extend({}, item.actionParameters, {
                  menuId: item.id
                }),
                links: item.links,
                actionProperties: item.properties,
                csuiNonPromotedAction: item.promoted === false,
                csuiNonPromotedItem: item.promoted === false,
                subItemOf: item["parent-id"],
                dynamic: item.actionParameters && item.actionParameters.dynamic
              };
              if (action.dynamic) {
                _.extend(action, {
                  name: item.properties.name,
                  icon: rule.icon,
                  iconName: rule.iconName,
                  promoted: item.promoted,
                  type: rule.type
                });
                if (item.properties && item.properties.subMenuType) {
                  _.extend(action, {
                    csuiNonPromotedItem: item.promoted === false
                  });
                } else if (action.subItemOf !== undefined) {
                  delete action.icon;
                  delete action.iconName;
                }
                if (rule.dynamicIdAttribute) {
                  var idAttributes = _.isString(rule.dynamicIdAttribute) ? [ rule.dynamicIdAttribute ] : rule.dynamicIdAttribute;
                  if (idAttributes.length > 0) {
                    var idValues = [];
                    _.each(idAttributes, function(idAttribute) {
                      var idValue = item[idAttribute] || item.properties[idAttribute] || item.actionParameters[idAttribute];
                      if (idValue) {
                        idValues.push(idValue);
                      }
                    });
                    if (idValues.length > 0) {
                      var id = idValues.join("_");
                      if (action.subItemOf !== undefined) {
                        id += "_" + action.subItemOf;
                      }
                      action.commandData.menuId = id;
                    }
                  }
                }
              }
              return action;
            }
          }
        });
        output[rulesType === "vdoc" ? vdUtil.createVDActionKey(entry.id, relationId, vdmNumber) : entry.id] = _.compact(actions);
      });
      return output;
    },
    _parseDefaultActions: function(response, rulesType) {
      var output = {};
      _.each(response.entries || [], function(entry) {
        var actionItems = entry.content.defaultActionItems || [], relationId = entry.content[vdUtil.PROP_VD_RELATION_ID], vdmNumber = entry.content[vdUtil.PROP_VDM_NUMBER];
        var actions = actionItems.map(function(item) {
          item.nodeId = entry.id;
          var rule = ActionRulesMatcher.findRule(item);
          if (rule) {
            return {
              signature: rule.command_key,
              actionProperties: item.properties || {},
              type: rule.type,
              commandData: _.extend({}, item.actionParameters, {
                menuId: item.id
              }),
              links: item.links,
              equals: {
                type: [ 144, 736, 2, 801 ]
              },
              defaultAction: true,
              isMiniView: rule.isMiniView
            };
          }
        });
        output[rulesType === "vdoc" ? vdUtil.createVDActionKey(entry.id, relationId, vdmNumber) : entry.id] = _.compact(actions);
      });
      return output;
    },
    _parseLocations: function(ids, response, fullPath) {
      var output = {}, currRepo;
      _.each(ids, function(nodeId) {
        var node, entry = _.find(response.entries, function(item) {
          return nodeId === item.content.id;
        });
        if (!entry) {
          if (nodeId.indexOf("0c") === 0) {
            currRepo = RestResources.getCurrentRepository();
            node = {
              id: constants.NodeId.REPOSITORY,
              name: currRepo.get("description") || currRepo.get("name")
            };
            nodeConverter.setNodeType(node);
            output[nodeId] = node;
          }
        } else {
          if (entry.content.properties) {
            var locationProperty = entry.content.properties[entry.content.properties.length - 1];
            var path = locationProperty.r_folder_path.substring(1).split("/");
            var id = locationProperty.ancestor_id_path.substring(1).split("/");
            var rObjectType = locationProperty.ancestor_object_type;
            path = path.map(function(item) {
              return item === constants.HiddenItems.ID ? constants.HiddenItems.NAME : item;
            });
            node = {
              name: fullPath === true ? path : path[path.length - 1],
              id: fullPath === true ? id : id[id.length - 1],
              rObjectType: rObjectType,
              idPath: locationProperty.ancestor_id_path,
              namePath: locationProperty.r_folder_path
            };
            nodeConverter.setNodeType(node);
            output[nodeId] = node;
          } else {
            var name, nodeid;
            if (nodeId.indexOf("0c") === 0) {
              currRepo = RestResources.getCurrentRepository();
              name = currRepo.get("description") || currRepo.get("name");
              nodeid = constants.NodeId.REPOSITORY;
            } else {
              name = [ constants.HiddenItems.NAME ];
              nodeid = [ constants.HiddenItems.ID ];
            }
            node = {
              name: name,
              id: nodeid
            };
            nodeConverter.setNodeType(node);
            output[nodeId] = node;
          }
        }
      });
      return output;
    },
    _parseExternalShare: function(response) {
      var output = {};
      _.each(response.entries || [], function(entry) {
        output[entry.content.id] = {
          core: entry.content["shared-to-core"],
          shareMode: entry.content.share_mode
        };
      });
      return output;
    },
    _parseRelationsCount: function(response) {
      var output = {};
      _.each(response.entries || [], function(entry) {
        output[entry.content.id] = {
          relations_count: entry.content.count
        };
      });
      return output;
    },
    _parseWfNotesConfig: function(response) {
      var output = {};
      _.each(response.entries || [], function(entry) {
        output[entry.content.id] = {
          wf_notes_disabled: entry.content.disable_notes
        };
      });
      return output;
    },
    _parsePreviewFormats: function(response) {
      var output = {};
      _.each(response.entries || [], function(entry) {
        output[entry.content.id] = {
          "preview-format": entry.content["preview-format"]
        };
      });
      return output;
    },
    _parseCommentsCount: function(response) {
      var output = {};
      _.each(response.entries || [], function(entry) {
        output[entry.content.r_object_id] = {
          comments_count: entry.content["comments_count"]
        };
      });
      return output;
    },
    _clearCaches: function() {
      columnPreferences = {};
      dictionaryInfo = null;
    },
    _isTableFilterApplied: function(filters) {
      var filterApplied = false;
      if (filters) {
        filters = _.omit(filters, function(value) {
          return _.isUndefined(value) || _.isEmpty(value);
        });
        filterApplied = _.values(filters).length > 0;
      }
      return filterApplied;
    }
  };
});