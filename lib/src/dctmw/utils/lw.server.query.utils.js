/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import Url from "nuc/utils/url";

import ServerTypeModelFactory from "dctmw/contexts/factories/server.type.model.factory";

import nodeConverter from "dctmw/server.adaptors/converters/node";

import constants from "dctmw/utils/constants";

import RestLinkrels from "dctmw/utils/rest.linkrels";

import RestResources from "dctmw/utils/rest.resources";

import TypedAttributeMapper from "dctmw/utils/typed.attribute.mapper";

import utils from "dctmw/utils/utils";

import Session from "dctmw/utils/authenticators/session";

function _fetchDataForObjects(options = {}) {
  const dfd = $.Deferred(), currRepoLinks = RestResources.getCurrentRepository().get("links"), batchPayload = [], skippedBatches = [], output = {}, handleZeroBatchGracefully = _.isBoolean(options.handleZeroBatchGracefully) ? options.handleZeroBatchGracefully : false;
  let idMap, url;
  function addToBatch(batchId, url, rulesType, skipIdCheck = false) {
    let ids = options.ids;
    if (batchId === "permissions") {
      ids = _.filter(ids, function(id) {
        const node = {
          id: id
        };
        nodeConverter.setNodeType(node);
        return node.type !== constants.Types.CABINET && node.type !== constants.Types.FOLDER;
      });
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
  function _parsePermissions(response) {
    const output = {};
    _.each(response.entries || [], function(entry) {
      output[entry.content.id] = entry.content;
    });
    return output;
  }
  function parseResponse(id, response, output) {
    switch (id) {
     case "permissions":
      output.permissions = remapId(_parsePermissions(response));
      break;
    }
    if (_.isFunction(options.cbCollateOperationIntoBatchResponse)) {
      options.cbCollateOperationIntoBatchResponse(id, response, output);
    }
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
  if (_.isFunction(options.cbAddOperationsToBatchRequestPayload)) {
    const payload = options.cbAddOperationsToBatchRequestPayload(options);
    _.keys(payload).forEach(opId => {
      addToBatch(opId, payload[opId], null, true);
    });
  }
  if (batchPayload.length === 0 && skippedBatches.length === 0) {
    if (handleZeroBatchGracefully) {
      parseResponse(null, null, output);
      dfd.resolve(output);
    } else {
      dfd.reject("At least one of the following attributes are mandatory: permissions");
    }
  } else if (batchPayload.length === 1 && !options.useBatch) {
    $.ajax(options.connector.extendAjaxOptions({
      url: batchPayload[0].request.uri,
      skipSWCache: options.skipSWCache,
      success: function(response) {
        parseResponse(batchPayload[0].id, response, output);
        dfd.resolve(output);
      },
      error: function(request) {
        dfd.reject(request);
      }
    }));
  } else if (batchPayload.length > 1 || options.useBatch) {
    utils.makeBatchAjaxCall({
      connector: options.connector,
      operations: batchPayload,
      skipSWCache: options.skipSWCache
    }).done(function(successful, failed) {
      if (failed && failed.length > 0) {
        dfd.reject();
        return;
      }
      _.each(successful, function(operation) {
        parseResponse(operation.id, operation.output, output);
      });
      dfd.resolve(output);
    }).fail(function(error) {
      dfd.reject(error);
    });
  } else {
    dfd.resolve(output);
  }
  return dfd.promise();
}

class LightWeightServerQueryUtils {
  static appendQueryParams(url = "", options = {}) {
    const context = options.context ?? Session.get().getContext();
    const queryMap = {};
    let colname, col, serverAttributes = [ TypedAttributeMapper.constants.SERVER_ATTR_ID ];
    if (!url.includes("inline=true")) {
      queryMap["inline"] = true;
    }
    if (options.paginate === true) {
      queryMap["page"] = (options.scope.skipCount || 0) / (options.scope.topCount || 25) + 1;
      queryMap["items-per-page"] = options.scope.topCount;
      queryMap["include-total"] = true;
    }
    if (options.sort === true) {
      let sortarr = options.scope.orderBy.split(" "), sort = "", skipServerSort = false;
      if (sortarr.length > 1) {
        colname = sortarr[0];
        col = _.findWhere(options.clientColumns, {
          column_key: colname
        });
        if (options.ignoreServerSortOnRestrictedColumns === true && (col && (col["repeating"] === true || col["dictionary"] === true))) {
          skipServerSort = true;
        }
        sortarr[0] = TypedAttributeMapper.clientToServerAttr(options.scope.dataType, sortarr[0]);
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
      let filterObject, serverFilters = _.isFunction(options.scope._getServerSideFilters) ? options.scope._getServerSideFilters() : options.scope.filters;
      if (serverFilters) {
        filterObject = _.omit(serverFilters, function(value) {
          return value === undefined || value === null || value === "";
        });
      }
      let filterArray = _.keys(filterObject);
      filterArray.forEach(filterKey => {
        let filterKeyType = options.scope.dataType, filter = filterKey, val = filterObject[filterKey], type;
        colname = filterKey;
        if (colname.indexOf(".") > 0) {
          let filters = colname.split(".");
          filter = filters[1];
          type = filters[0];
          filterKeyType = type;
        }
        filter = TypedAttributeMapper.clientToServerAttr(filterKeyType, filter);
        col = _.findWhere(options.clientColumns, {
          column_key: filterKey
        });
        if (!col) {
          col = context.getModel(ServerTypeModelFactory, ServerTypeModelFactory.createModelFactoryOptions({
            name: filterKeyType
          })).getAttributeDef(filter);
        }
        if (col.server_filter_key) {
          filter = col.server_filter_key;
        }
        function addFilter(nextClause) {
          queryMap["filter"] = `${queryMap["filter"] ? `${queryMap["filter"]} and ` : ""}${nextClause}`;
        }
        if (col.repeating === true) {
          val = val ? val.toLowerCase() : "";
          addFilter(`contains(lower(${filter}/item),'${val}')`);
          serverAttributes.push(filter);
        } else if (col.type === TypedAttributeMapper.getNumericAttrType("String") || col.type === TypedAttributeMapper.getNumericAttrType("Date")) {
          val = val ? val.toLowerCase() : "";
          if (filter === TypedAttributeMapper.constants.SERVER_ATTR_ID) {
            addFilter(`${filter}='${val}'`);
          } else {
            addFilter(`contains(lower(${filter}),'${val}')`);
            serverAttributes.push(filter);
          }
        } else {
          addFilter(`${filter}=${val}`);
          serverAttributes.push(filter);
        }
        if (type !== undefined) {
          queryMap["custom-filter-property-name"] = filter;
        }
      });
    }
    if (options.subTypeFilters) {
      var filterStringArray = [];
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
    if (options.fetchesAllServerAttributes === true) {
      queryMap["view"] = ":all";
    } else if (options.fetchesOnlyRequiredAttributes === true && serverAttributes.length) {
      _.each(options.clientColumns, cCol => {
        let cKey = cCol["column_key"] || cCol["key"], cType = options.scope.dataType;
        if (cKey.indexOf(".") > 0) {
          let cKParts = colname.split(".");
          cKey = cKParts[1];
          cType = cKParts[0];
          cKey = `${cType}.${TypedAttributeMapper.clientToServerAttr(cType, cKey)}`;
        } else {
          cKey = TypedAttributeMapper.clientToServerAttr(cType, cKey);
        }
        serverAttributes.push(cKey);
      });
      serverAttributes = _.uniq(_.compact(serverAttributes));
      if (serverAttributes.length) {
        queryMap["view"] = serverAttributes.join(",");
      }
    }
    return Url.appendQuery(url, Url.combineQueryString(queryMap));
  }
  static fetchDataForObjects(options = {}) {
    const promises = [], dfd = $.Deferred();
    if (_.size(options.ids) > constants.MAX_OBJECTIDS_ALLOWED) {
      const objectIdChunks = _.chunk(options.ids, constants.MAX_OBJECTIDS_ALLOWED);
      _.each(objectIdChunks, objectIdChunk => {
        const opt = _.extend({}, options);
        _.extend(opt, {
          ids: objectIdChunk,
          useBatch: true
        });
        promises.push(_fetchDataForObjects(opt));
      });
    } else {
      promises.push(_fetchDataForObjects(options));
    }
    $.whenAll.apply($, promises).done(function(results) {
      const mergedResults = {};
      if (results && results.length) {
        _.each(results, function(res) {
          _.each(res, function(object, key) {
            mergedResults[key] = object;
          });
        });
      }
      return dfd.resolve(mergedResults);
    }).fail(function(error) {
      error = $.isArray(error) ? error[0] : error;
      dfd.reject(error);
    });
    return dfd.promise();
  }
  static fetchDataAsPropertiesForObjects(options = {}) {
    const dfd = $.Deferred();
    this.fetchDataForObjects(options).done(output => {
      const objectsProperties = {};
      (options.ids ?? []).forEach(nodeId => {
        const properties = {};
        if (output.permissions) {
          const permission = output.permissions[nodeId];
          properties["basePermissions"] = permission ? permission["base-permission"] : {};
        }
        objectsProperties[nodeId] = properties;
      });
      if (_.isFunction(options.cbPrepareObjectsPropertiesFromBatchResponse)) {
        options.cbPrepareObjectsPropertiesFromBatchResponse(output, objectsProperties);
      }
      dfd.resolve(objectsProperties);
    }).fail(dfd.reject);
    return dfd.promise();
  }
}

export default LightWeightServerQueryUtils;