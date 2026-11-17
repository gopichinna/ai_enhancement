/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/server.adaptors/converters/node", "d2/utils/server.query.utils", "d2/utils/advanced.search.utils", "d2/utils/constants", "d2/utils/widget.constants", "nuc/utils/url", "d2/controls/globalmessage/globalmessage", "dctmw/utils/utils", "i18n!d2/utils/impl/nls/lang" ], function($, _, RestResources, RestLinkrels, NodeConverter, serverQueryUtils, AdvancedSearchUtils, constants, widgetConstants, Url, GlobalMessage, utils, lang) {
  "use strict";
  var searchConfig = null;
  function escapeSpecialChar(expression) {
    var specialChars = "*?{}.()[]+";
    var result = expression;
    for (var i = 0; i < specialChars.length; i++) {
      result = result.replace(new RegExp("\\" + specialChars[i], "gi"), "\\" + specialChars[i]);
    }
    return result;
  }
  function highlightSummary(termsArr, summary) {
    var sorted = termsArr.map(function(value) {
      return value.toLowerCase();
    }).sort();
    var uniqueTermsArray = _.unique(sorted);
    uniqueTermsArray.sort(function(a, b) {
      return b.length - a.length;
    });
    var arrSummary = [ summary ];
    for (var termskey in uniqueTermsArray) {
      if (Object.prototype.hasOwnProperty.call(uniqueTermsArray, termskey)) {
        var expression = String(uniqueTermsArray[termskey]);
        var matchexp = new RegExp(escapeSpecialChar(expression), "ig");
        var matches = summary.match(matchexp);
        if (matches) {
          matches = matches.filter(function(item, pos, self) {
            item = escapeSpecialChar(item);
            return self.indexOf(item) === pos;
          });
        }
        if (matches && matches.length > 0) {
          for (var i = 0; i < matches.length; i++) {
            var regex = new RegExp("(" + matches[i] + ")", "g");
            for (var j = 0; j < arrSummary.length; ) {
              if (typeof arrSummary[j] === "string") {
                var items = arrSummary[j].split(regex);
                _.each(items, function(item, index) {
                  if (item === matches[i]) {
                    items[index] = {
                      text: item,
                      type: "highlighted"
                    };
                  }
                });
                arrSummary.splice.apply(arrSummary, [ j ].concat(1, items));
                j += items.length;
              } else {
                j++;
              }
            }
          }
        }
      }
    }
    return summary === "" ? summary : arrSummary;
  }
  return {
    getColumnPref: function(fetchData, isDisableLocationColumn, superSyncMethod, args, ctx, deferred) {
      var columnOptions;
      if (!utils.isMobile()) {
        require([ "d2/server.adaptors/models/esoc/comments.utils" ], function(CommentsUtils) {
          CommentsUtils.setCommentingEnabled(ctx.options.showCommentColumn);
        });
        columnOptions = {
          locationColumn: {
            enabled: !isDisableLocationColumn,
            title: lang.location
          },
          commentColumn: ctx.options.showCommentColumn
        };
      } else {
        columnOptions = {
          typeColumn: false,
          reservedColumn: false,
          externalShareColumn: false,
          commentColumn: false,
          favoriteColumn: false
        };
      }
      if (ctx.isTargetBrowse) {
        columnOptions = {
          reservedColumn: false,
          externalShareColumn: false,
          commentColumn: false,
          favoriteColumn: false
        };
      }
      serverQueryUtils.fetchColumnPreferences({
        scope: this,
        widgetType: widgetConstants.D2.DOCLIST,
        widgetName: ctx.widgetName,
        defaultType: constants.ColTypes.DEFAULT,
        connector: ctx.connector,
        columnOptions: columnOptions
      }).done(function(clientCols, columnPreference) {
        var data = {
          clientCols: clientCols,
          columnPreference: columnPreference
        };
        if (utils.isMobile()) {
          deferred.done(function() {
            if (ctx.options.columns) {
              ctx.options.columns.reset(clientCols);
              ctx.trigger("orderBy:change");
            }
          });
        }
        fetchData(data, superSyncMethod, args, ctx, deferred);
      }).fail(function(error) {
        deferred.reject(error);
      });
    },
    convertSearchNode: function(entry, oldmodel) {
      var props = entry.properties || entry;
      props["search_result_metadata"] = {
        current_version: true,
        version_type: "major"
      };
      if (oldmodel) {
        props["summary"] = oldmodel["summary"];
        props["score"] = oldmodel["score"];
        props["ancestors"] = oldmodel["ancestors"];
      }
      props["stringifiedSummary"] = props["summary"] || "";
      var termsArr = props.keywords;
      if (termsArr) {
        props["summary"] = highlightSummary(termsArr, props["summary"]);
      }
      props["description"] = props["stringifiedSummary"];
      props["summary_formatted"] = props["strigifiedSummary"];
      return entry;
    },
    parseItems: function(response) {
      var result = [];
      for (var entry in response.entries) {
        if (Object.prototype.hasOwnProperty.call(response.entries, entry)) {
          var entryData = response.entries[entry];
          var row = {};
          row["score"] = entryData.score;
          row["ancestors"] = entryData["ancestors"];
          var content = entryData.content;
          row["links"] = content["links"];
          row["base-permissions"] = content["base-permissions"];
          row["favorite"] = content.favorite && content.favorite.favorite;
          var data = content.properties;
          for (var key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
              row[key] = data[key];
            }
          }
          row["search_result_metadata"] = {
            current_version: true,
            version_type: "major"
          };
          row["summary"] = row["summary"] || "";
          row["stringifiedSummary"] = row["summary"];
          var termsArr = entryData.terms, rowSummary = row["summary"];
          if (termsArr) {
            row["summary"] = highlightSummary(termsArr, rowSummary);
          } else if (rowSummary && _.isString(rowSummary)) {
            row["summary"] = [ rowSummary ];
          }
          row["description"] = row["stringifiedSummary"];
          row["summary_formatted"] = row["stringifiedSummary"];
          result.push(row);
        }
      }
      return result;
    },
    getSortField: function(response, orderBy, clientColumns) {
      if (!orderBy) {
        orderBy = response["sorted-by"] + " " + response["sort-direction"].toLowerCase();
      }
      var sortarr = orderBy.split(" ");
      if (sortarr.length > 1) {
        var colname = sortarr[0];
        var col = _.findWhere(clientColumns, {
          column_key: colname
        });
        sortarr[0] = NodeConverter.getClientServerAttrNameMap()[colname] || sortarr[0];
        sortarr.push(col.type);
      }
      return sortarr;
    },
    getDefaultOrderBy: function(sortedBy, sortDirection) {
      if (sortedBy && sortDirection) {
        var sortCol = NodeConverter.getServerClientAttrNameMap()[sortedBy] || sortedBy;
        return sortCol + " " + sortDirection.toLowerCase();
      } else {
        return null;
      }
    },
    parseSortOrder: function(columns, orderBy, defaultOrderBy) {
      var sorting = {};
      var links = {};
      var ignoreColumnKeys = [ "wnd_comments", "parent_id" ];
      for (var columnKey in columns) {
        if (Object.prototype.hasOwnProperty.call(columns, columnKey)) {
          var column = columns[columnKey];
          var name = column.column_key;
          if (ignoreColumnKeys.indexOf(name) < 0) {
            if (column.sort) {
              links["asc" + "_" + name] = {
                name: column.title
              };
              links["desc" + "_" + name] = {
                name: column.title
              };
            }
          }
        }
      }
      sorting.links = links;
      var order;
      if (defaultOrderBy) {
        var defaultOrderByTokens = defaultOrderBy.split(" ");
        order = defaultOrderByTokens[1] + "_" + defaultOrderByTokens[0];
      }
      if (orderBy) {
        var orderByTokens = orderBy.split(" ");
        order = orderByTokens[1] + "_" + orderByTokens[0];
        order = order.trim();
      }
      sorting.sort = order ? [ order ] : [ "" ];
      return {
        orderBy: orderBy ? orderBy : defaultOrderBy,
        sorting: sorting
      };
    },
    highlightSummary: function(termsArr, summary) {
      return highlightSummary(termsArr, summary);
    },
    getSearchConfiguration: function(options) {
      var deferred = $.Deferred();
      if (searchConfig !== null) {
        deferred.resolve(searchConfig);
      } else {
        var links = RestResources.getCurrentRepository().get("links"), url = Url.appendQuery(Url.combine(RestLinkrels.getLink(links, RestLinkrels.D2_CONFIGURATIONS), "search-configuration"), "inline=true"), me = this;
        $.ajax(options.connector.extendAjaxOptions({
          url: url,
          success: function(response) {
            if (response && _.isArray(response.entries)) {
              searchConfig = {
                is_facets_enabled: response["is-facets-enabled"],
                is_full_text_search_enabled: response["is-full-text-search-enabled"],
                is_case_sensitive_option_visible: response["is-case-sensitive-option-visible"],
                canCreatePublicSearch: response["can-create-public-search"],
                root_private_category_id: response["root-private-category-id"],
                root_public_category_id: response["root-public-category-id"],
                property_display_type: response["display-type"]
              };
              var types = {}, types_to_properties_map = {}, types_to_properties_label_map = {}, defaultFacetProperties = {}, search_configuration_properties = [], assistenceEnabledProperties = {};
              _.each(response.entries, function(entry) {
                var searchConfigId = entry.content["r_object_id"];
                entry.content && _.isArray(entry.content.types) && _.each(entry.content.types, function(type) {
                  var typeName = type.name.toLowerCase();
                  if (types[typeName]) {
                    types[typeName].default = types[typeName].default || type.default;
                  } else {
                    types[typeName] = type;
                  }
                });
                entry.content && _.isArray(entry.content["search_properties"]) && _.each(entry.content["search_properties"], function(property) {
                  property["label"] = property["label"] || property["property_name"];
                  var propertyType = property["property_type"].toLowerCase(), propertyName = property["property_name"].toLowerCase(), propertyLabel = property["label"].toLowerCase();
                  types_to_properties_map[propertyType] = types_to_properties_map[propertyType] || {};
                  types_to_properties_label_map[propertyType] = types_to_properties_label_map[propertyType] || {};
                  if (!types_to_properties_map[propertyType][propertyName]) {
                    types_to_properties_label_map[propertyType][propertyLabel] = property;
                    types_to_properties_map[propertyType][propertyName] = property;
                  }
                  if (searchConfig.is_facets_enabled && property["is_default_facet"] === true) {
                    defaultFacetProperties[property["property_name"]] = property;
                  }
                  if (property["has_value_assistance"] === true) {
                    if (assistenceEnabledProperties[property["property_name"]] === undefined) {
                      assistenceEnabledProperties[property["property_name"]] = [];
                    }
                    assistenceEnabledProperties[property["property_name"]].push(propertyType);
                  }
                });
                search_configuration_properties.push({
                  searchConfigId: searchConfigId,
                  searchConfigName: entry.content["object_name"],
                  searchProperties: entry.content["search_properties"],
                  links: entry.content["links"]
                });
              });
              searchConfig["types"] = types;
              searchConfig["types_to_properties_map"] = types_to_properties_map;
              searchConfig["types_to_properties_label_map"] = types_to_properties_label_map;
              searchConfig["defaultFacetProperties"] = defaultFacetProperties;
              searchConfig["search_configuration_properties"] = search_configuration_properties;
              searchConfig["assistenceEnabledProperties"] = assistenceEnabledProperties;
              var promisesArray = [], types_to_all_properties_map = {}, types_to_all_properties_label_map = {};
              promisesArray.push(me.getAttributesSuggestion(options, search_configuration_properties, assistenceEnabledProperties).done(function(data) {
                searchConfig["suggestionList"] = data;
              }));
              promisesArray.push(me.getAllAttributesForTypes(options, types_to_properties_map).done(function(response) {
                types_to_all_properties_map = response.types_to_all_properties_map;
                types_to_all_properties_label_map = response.types_to_all_properties_label_map;
              }));
              Promise.all(promisesArray).then(function() {
                searchConfig["types_to_all_properties_map"] = types_to_all_properties_map;
                searchConfig["types_to_all_properties_label_map"] = types_to_all_properties_label_map;
                searchConfig["parent_info_map"] = me.getParentInfoMap();
                deferred.resolve(searchConfig);
              });
            } else {
              deferred.resolve(null);
            }
          },
          error: function(request) {
            request.responseJSON = request.responseJSON || {};
            GlobalMessage.showMessage("error", request.responseJSON.message, request.responseJSON.details);
            deferred.reject(request);
          }
        }));
      }
      return deferred.promise();
    },
    getAttributesSuggestion: function(options, searchConfigs, assistenceEnabledProperties) {
      var batchPayload = [], deferred = $.Deferred();
      var dqlDictUrl = AdvancedSearchUtils.getDQLDictionaryLinkRel(searchConfigs);
      _.each(assistenceEnabledProperties, function(list, key) {
        var url = Url.appendQuery(dqlDictUrl, Url.combineQueryString({
          filter: "*",
          search_types: list,
          search_type_attribute: key
        }));
        batchPayload.push({
          id: key,
          request: {
            method: "GET",
            uri: url
          }
        });
      });
      if (batchPayload.length > 0) {
        options.skipSWCache = true;
        AdvancedSearchUtils.fetchSuggestionListAsBatch(options, batchPayload).done(function(data) {
          deferred.resolve(data);
        });
      } else {
        deferred.resolve({});
      }
      return deferred.promise();
    },
    getAllAttributesForTypes: function(options, types) {
      var me = this, deferredAttributesBatchAPI = $.Deferred(), currRepoLinks = RestResources.getCurrentRepository().get("links"), batchPayload = [], types_to_all_properties_map = {}, types_to_all_properties_label_map = {};
      _.each(_.keys(types), function(typeName) {
        batchPayload.push({
          id: typeName,
          request: {
            method: "GET",
            uri: Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.D2_TYPES_INFO), typeName)
          }
        });
      });
      utils.makeBatchAjaxCall({
        connector: options.connector,
        operations: batchPayload
      }).done(function(successful, failed) {
        if (failed && failed.length > 0) {
          deferredAttributesBatchAPI.reject();
          return;
        }
        _.each(successful, function(attrResponse) {
          var parsedResponse = me.parseGetAllAttributesForType(attrResponse.output, attrResponse.id);
          types_to_all_properties_map[attrResponse.id] = parsedResponse.all_properties;
          types_to_all_properties_label_map[attrResponse.id] = parsedResponse.all_properties_label;
        });
        deferredAttributesBatchAPI.resolve({
          types_to_all_properties_map: types_to_all_properties_map,
          types_to_all_properties_label_map: types_to_all_properties_label_map
        });
      }).fail(deferredAttributesBatchAPI.reject);
      return deferredAttributesBatchAPI.promise();
    },
    parseGetAllAttributesForType: function(response, type) {
      var all_properties = {}, all_properties_label = {};
      _.each(response.properties, function(attribute) {
        all_properties[attribute.name] = {
          display_label: attribute.label || attribute.name,
          label: attribute.label || attribute.name,
          property_name: attribute.name,
          property_schema_type: attribute.type === "float" ? "double" : attribute.type,
          property_type: type
        };
      });
      all_properties["r_object_id"] = {
        display_label: "r_object_id",
        label: "r_object_id",
        property_name: "r_object_id",
        property_schema_type: "string",
        property_type: type
      };
      _.each(all_properties, function(property) {
        all_properties_label[property.label.toLowerCase()] = property;
      });
      return {
        all_properties: all_properties,
        all_properties_label: all_properties_label
      };
    },
    getParentInfoMap: function() {
      var parent_info_map = {};
      var superTypes = RestResources.getDctmTypeData().superTypes;
      _.each(_.keys(searchConfig.types_to_properties_map), function(type) {
        var array = [];
        if (type !== "dm_sysobject") {
          if (superTypes) {
            var parent = superTypes[type];
            while (parent != "dm_sysobject") {
              array.push(parent);
              parent = superTypes[parent];
            }
          }
          array.push("dm_sysobject");
        }
        parent_info_map[type] = array;
      });
      return parent_info_map;
    }
  };
});