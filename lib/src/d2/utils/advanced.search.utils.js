/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/moment", "nuc/utils/types/date", "nuc/utils/url", "csui/utils/contexts/factories/connector", "dctmw/utils/utils", "d2/utils/constants", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/types/inputdate", "i18n!d2/utils/impl/nls/lang" ], function($, _, Backbone, moment, date, Url, ConnectorFactory, utils, constants, RestResources, RestLinkrels, inputDate, lang) {
  "use strict";
  var OPERATORS = Object.freeze({
    "=": {
      value: "=",
      displayValue: "= (Equals)",
      label: "="
    },
    "<>": {
      value: "<>",
      displayValue: "≠ (Not equals)",
      label: "≠"
    },
    "!=": {
      value: "<>",
      label: "≠",
      excludeSuggestion: true
    },
    ">": {
      value: ">",
      displayValue: "> (Greater than)",
      label: ">"
    },
    ">=": {
      value: ">=",
      displayValue: ">= (Greater than or equals)",
      label: ">="
    },
    "<": {
      value: "<",
      displayValue: "< (Less than)",
      label: "<"
    },
    "<=": {
      value: "<=",
      displayValue: "<= (Less than or equals)",
      label: "<="
    },
    "begins with": {
      value: "begins with",
      label: "BEGINS WITH"
    },
    "ends with": {
      value: "ends with",
      label: "ENDS WITH"
    },
    contains: {
      value: "contains",
      label: "CONTAINS"
    },
    "does not contain": {
      value: "does not contain",
      label: "DOES NOT CONTAIN"
    },
    "is null": {
      value: "is null",
      label: "IS NULL"
    },
    "is not null": {
      value: "is not null",
      label: "IS NOT NULL"
    }
  });
  var OPERATOR_UI_TO_SERVER_MAP = Object.freeze({
    "=": "EQUAL",
    "<>": "NOT_EQUAL",
    "!=": "NOT_EQUAL",
    ">": "GREATER_THAN",
    ">=": "GREATER_EQUAL",
    "<": "LESS_THAN",
    "<=": "LESS_EQUAL",
    "begins with": "BEGINS_WITH",
    "ends with": "ENDS_WITH",
    contains: "CONTAINS",
    "does not contain": "DOES_NOT_CONTAIN",
    "is null": "IS_NULL",
    "is not null": "IS_NOT_NULL"
  });
  var FULL_TEXT_OPERATON_MAPPING = Object.freeze({
    contains_all_words: "ALLWORDS",
    contains_any_words: "ANYWORDS",
    contains_exact_sentence: "EXACTPHRASE",
    without_any_words: "WITHOUTWORDS"
  });
  var SCHEMA_TO_OPERATORS_MAP = {
    boolean: [ "=", "!=", "<>" ],
    datetime: [ "=", "!=", "<>", ">", ">=", "<", "<=" ],
    double: [ "=", "!=", "<>", ">", ">=", "<", "<=" ],
    integer: [ "=", "!=", "<>", ">", ">=", "<", "<=" ],
    "small integer": [ "=", "!=", "<>", ">", ">=", "<", "<=" ],
    string: [ "=", "!=", "<>", "begins with", "ends with", "contains", "does not contain" ]
  };
  var SCHEMA_TO_BINOMIAL_OPERATORS_MAP = {
    boolean: [ "is null", "is not null" ],
    datetime: [ "is null", "is not null" ],
    double: [ "is null", "is not null" ],
    integer: [ "is null", "is not null" ],
    "small integer": [ "is null", "is not null" ],
    string: [ "is null", "is not null" ]
  };
  var updateSchemaToOperatorsMap = function(values, key, object) {
    object[key] = {
      operators: {},
      operatorsLabel: {}
    };
    _.each(values, function(value) {
      object[key]["operators"][OPERATORS[value].value.toLowerCase()] = OPERATORS[value];
      object[key]["operatorsLabel"][OPERATORS[value].label.toLowerCase()] = OPERATORS[value];
    });
  };
  _.each(SCHEMA_TO_OPERATORS_MAP, updateSchemaToOperatorsMap);
  _.each(SCHEMA_TO_BINOMIAL_OPERATORS_MAP, updateSchemaToOperatorsMap);
  return {
    getCommonProperties: function(typeValues, typesToPropertiesMap, typesToPropertiesLabelMap) {
      if (!typeValues || !typesToPropertiesMap || !typesToPropertiesLabelMap || typeValues.length === 0) {
        return {
          commonProperties: {},
          commonPropertiesLabel: {}
        };
      }
      var propertiesMap, propertiesLabelMap;
      for (var index = 0; index < typeValues.length; index++) {
        var typeValue = typeValues[index];
        if (typesToPropertiesMap[typeValue] && typesToPropertiesLabelMap[typeValue]) {
          propertiesMap = typesToPropertiesMap[typeValue];
          propertiesLabelMap = typesToPropertiesLabelMap[typeValue];
          break;
        }
      }
      if (!propertiesMap) {
        return {
          commonProperties: {},
          commonPropertiesLabel: {}
        };
      }
      var commonProperties = JSON.parse(JSON.stringify(propertiesMap)), commonPropertiesLabel = JSON.parse(JSON.stringify(propertiesLabelMap));
      if (typeValues.length === 1) {
        return {
          commonProperties: commonProperties,
          commonPropertiesLabel: commonPropertiesLabel
        };
      }
      for (var i = 1; i < typeValues.length; i++) {
        var nextTypeProperties = typesToPropertiesMap[typeValues[i]];
        commonProperties = _.pick(commonProperties, function(value, key) {
          if (nextTypeProperties && nextTypeProperties[key] && nextTypeProperties[key]["property_schema_type"] === value["property_schema_type"]) {
            if ((_.isArray(value.label) && !_.contains(value.label, nextTypeProperties[key].label) || !_.isArray(value.label) && value.label !== nextTypeProperties[key].label) && nextTypeProperties[key].label !== key) {
              if (!_.isArray(value.label)) {
                value.label = [ value.label ];
              }
              if (_.isArray(nextTypeProperties[key].label)) {
                _.each(nextTypeProperties[key].label, function(lab) {
                  if (!value.label.includes(lab)) {
                    value.label.push(lab);
                  }
                });
              } else {
                if (!value.label.includes(nextTypeProperties[key].label)) {
                  value.label.push(nextTypeProperties[key].label);
                }
              }
            }
            return true;
          } else {
            return false;
          }
        }.bind(this));
      }
      commonPropertiesLabel = {};
      _.each(commonProperties, function(property) {
        if (_.isArray(property.label)) {
          _.each(property.label, function(label) {
            commonPropertiesLabel[label.toLowerCase()] = property;
          }.bind(this));
        } else if (property.label) {
          commonPropertiesLabel[property.label.toLowerCase()] = property;
        }
      }.bind(this));
      return {
        commonProperties: commonProperties,
        commonPropertiesLabel: commonPropertiesLabel
      };
    },
    replaceNbsps: function(str) {
      var re = new RegExp("[" + String.fromCharCode(194) + "|" + String.fromCharCode(160) + "]", "g");
      return str.replace(re, " ");
    },
    createTokens: function(string, tokenDefinitions) {
      var tokens = [], position = 0;
      tokenDefinitions;
      tokenDefinitions = tokenDefinitions || [ [ /^\s+/, null ], [ /^(["'])(\\\1|.)*?\1/, "QUOTE" ], [ /^[^\s]+/, "EVERYTHING" ] ];
      while (position < string.length) {
        var substring = string.slice(position), previousPosition = position;
        for (var i = 0; i < tokenDefinitions.length; i++) {
          var matched = tokenDefinitions[i][0].exec(substring), start = position;
          if (matched === null) {
            continue;
          }
          position += matched[0].length;
          if (tokenDefinitions[i][1] === null) {
            break;
          }
          tokens.push({
            text: matched[0],
            start: start,
            stop: position - 1
          });
          break;
        }
        if (previousPosition === position) {
          break;
        }
      }
      return tokens;
    },
    getPropertiesSuggestions: function(properties, propertyDisplayType) {
      var me = this, labels = [];
      _.each(properties, function(property) {
        if (property.label) {
          if (_.isArray(property.label)) {
            labels.push({
              name: property.label[0],
              value: property["property_name"],
              displayValue: me.getDisplayLabelForProperty(property, propertyDisplayType, property.label[0])
            });
          } else {
            labels.push({
              name: property.label,
              value: property["property_name"],
              displayValue: me.getDisplayLabelForProperty(property, propertyDisplayType)
            });
          }
        } else {
          labels.push({
            name: property["property_name"],
            value: property["property_name"],
            displayValue: property["display_label"]
          });
        }
      });
      return labels;
    },
    getDisplayLabelForProperty: function(property, propertyDisplayType, label) {
      if (!label) {
        label = property.label;
      }
      return propertyDisplayType && propertyDisplayType === "Name" ? _.str.sformat(lang.propertyNameLabel, property["display_label"], label) : property["display_label"];
    },
    hasQuotes: function(value) {
      value = value.replace(/\\"/g, "_").replace(/\\'/g, "_");
      return /^(["'])(.*)\1$/.test(value);
    },
    removeQuotes: function(value) {
      return this.hasQuotes(value) ? value.replace(/^(["'])(.*)\1$/, "$2") : value;
    },
    addQuotes: function(value, forceQuotes) {
      value = this.removeQuotes(value);
      if (/ /.test(value) || forceQuotes) {
        value = value.replace(/\\"/g, '"').replace(/"/g, '\\"');
        value = value.replace(/\\'/g, "'");
        return '"' + value + '"';
      } else {
        return value;
      }
    },
    validateBoolean: function(value) {
      return /^([01]|true|false|T|F)$/i.test(value);
    },
    convertBoolean: function(value) {
      value = this.removeQuotes(value);
      if (value.match(/^(1|true|T)$/i)) {
        return true;
      } else if (value.match(/^(0|false|F)$/i)) {
        return false;
      }
      return value;
    },
    validateInteger: function(value) {
      return /^[+-]?[0-9]+$/.test(value);
    },
    validateFloatingPoint: function(value) {
      return /^[+-]?([0-9]*[.])?[0-9]+$/.test(value);
    },
    validateDate: function(value) {
      return date.validateDate(value, this.getInputDateFormat());
    },
    getLocaleDateFormat: function() {
      return moment.localeData().longDateFormat("L");
    },
    getInputDateFormat: function() {
      return inputDate.exactDateInputFormat;
    },
    convertDate: function(value) {
      var dateFormat = this.getInputDateFormat();
      return moment(date.serializeDate(date.formatExactDate(moment(value, dateFormat)))).toISOString();
    },
    convertClientSideDate: function(value) {
      var dateFormat = this.getInputDateFormat();
      return moment(value).format(dateFormat);
    },
    validateString: function() {
      return true;
    },
    validateValue: function(value, schema) {
      switch (schema) {
       case "boolean":
        value = this.validateBoolean(value);
        break;

       case "integer":
       case "small integer":
        value = this.validateInteger(value);
        break;

       case "double":
        value = this.validateFloatingPoint(value);
        break;

       case "datetime":
        value = this.validateDate(value);
        break;

       case "string":
       default:
        value = this.validateString(value);
      }
      return value;
    },
    convertValue: function(value, schema) {
      switch (schema) {
       case "boolean":
        value = this.convertBoolean(value);
        break;

       case "datetime":
        value = this.convertDate(value);
        break;

       case "integer":
       case "small integer":
        value = parseInt(value);
        break;

       case "double":
        value = parseFloat(value);
        break;

       case "string":
       default:
        break;
      }
      return value;
    },
    validateBinomialOperator: function(operator, schema) {
      return !!(SCHEMA_TO_BINOMIAL_OPERATORS_MAP[schema || "string"]["operators"][operator.toLowerCase()] || SCHEMA_TO_BINOMIAL_OPERATORS_MAP[schema || "string"]["operatorsLabel"][operator.toLowerCase()]);
    },
    validateOperator: function(operator, schema) {
      return !!(SCHEMA_TO_OPERATORS_MAP[schema || "string"]["operators"][operator.toLowerCase()] || SCHEMA_TO_OPERATORS_MAP[schema || "string"]["operatorsLabel"][operator.toLowerCase()]);
    },
    getOperatorValue: function(operator, schema) {
      var operatorObject = SCHEMA_TO_OPERATORS_MAP[schema || "string"]["operators"][operator.toLowerCase()] || SCHEMA_TO_OPERATORS_MAP[schema || "string"]["operatorsLabel"][operator.toLowerCase()] || SCHEMA_TO_BINOMIAL_OPERATORS_MAP[schema || "string"]["operators"][operator.toLowerCase()] || SCHEMA_TO_BINOMIAL_OPERATORS_MAP[schema || "string"]["operatorsLabel"][operator.toLowerCase()];
      return operatorObject ? operatorObject.value : operator;
    },
    getOperatorServerValue: function(operator) {
      return OPERATOR_UI_TO_SERVER_MAP[operator] || operator;
    },
    getOperatorSuggestions: function(schema) {
      return _.map(_.filter(SCHEMA_TO_OPERATORS_MAP[schema || "string"]["operators"], function(operator) {
        return !operator.excludeSuggestion;
      }), function(operator) {
        return {
          name: operator.label,
          displayValue: operator.displayValue,
          value: operator.value
        };
      }).concat(_.map(_.filter(SCHEMA_TO_BINOMIAL_OPERATORS_MAP[schema || "string"]["operators"], function(operator) {
        return !operator.excludeSuggestion;
      }), function(operator) {
        return {
          name: operator.label,
          displayValue: operator.displayValue,
          value: operator.value
        };
      }));
    },
    getAndOrSuggestions: function() {
      return [ {
        name: "AND",
        value: "AND"
      }, {
        name: "OR",
        value: "OR"
      } ];
    },
    createTreeNode: function(properties) {
      return {
        key: properties["r_object_id"],
        title: properties.label,
        tooltip: properties.tooltip || properties.label,
        category: properties["search-category"] && properties["search-category"].toUpperCase(),
        parentId: properties["parent-id"],
        objectId: properties["r_object_id"],
        icon: false,
        links: properties["links"] || []
      };
    },
    getPrivateSearchRootCategory: function() {
      return this.createTreeNode({
        label: lang.privateSearchLabel,
        r_object_id: constants.AdvancedSearch.CATEGORY_PRIVATE
      });
    },
    getPublicSearchRootCategory: function() {
      return this.createTreeNode({
        label: lang.publicSearchLabel,
        r_object_id: constants.AdvancedSearch.CATEGORY_PUBLIC
      });
    },
    createSearchLocationsTreeStructure: function(options) {
      options = options || {};
      var searchLocationsById = {}, category_private = constants.AdvancedSearch.CATEGORY_PRIVATE, category_public = constants.AdvancedSearch.CATEGORY_PUBLIC;
      searchLocationsById[0] = {};
      searchLocationsById[category_private] = this.getPrivateSearchRootCategory();
      if (options.loadAllGroups || options.searchConfig && options.searchConfig.canCreatePublicSearch) {
        searchLocationsById[category_public] = this.getPublicSearchRootCategory();
      }
      _.each(options.linearSearchLocations, function(searchLocation) {
        var properties = searchLocation.content.properties;
        if (searchLocation.content.links) {
          properties.links = searchLocation.content.links;
        }
        searchLocationsById[properties["r_object_id"]] = this.createTreeNode(properties);
      }.bind(this));
      _.each(searchLocationsById, function(node, key, object) {
        if (key !== "0") {
          var parent = node.parentId ? object[node.parentId] : node.category ? node.category === category_private ? object[category_private] : object[category_public] : object[0];
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(node);
          }
        }
      });
      var addPath = function(node, path) {
        node.path = path ? _.str.sformat(lang.searchLocationPath, path, node.title) : node.title;
        node.children && _.each(node.children, function(child) {
          addPath(child, node.path);
        });
      };
      addPath(searchLocationsById[0]);
      return searchLocationsById;
    },
    getSearchLocationsTreeStructure: function(options) {
      var searchLocationsById = this.createSearchLocationsTreeStructure(options);
      return searchLocationsById[0].children;
    },
    getSearchLocations: function(options) {
      options = options || {};
      var deferred = $.Deferred(), currRepo = RestResources.getCurrentRepository(), url = RestLinkrels.getLink(currRepo.get("links"), RestLinkrels.D2_SAVED_SEARCH_GROUPS), qParams = {};
      if (!options.loadAllGroups) {
        $.extend(qParams, {
          "search-category": !(options.searchConfig && options.searchConfig.canCreatePublicSearch) ? constants.AdvancedSearch.CATEGORY_PRIVATE : undefined
        });
      }
      url = Url.appendQuery(url, Url.combineQueryString(qParams));
      $.ajax(options.connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          deferred.resolve(response && response.entries);
        },
        error: deferred.reject
      }));
      return deferred.promise();
    },
    getStructuredSearchLocation: function(options) {
      options = options || {};
      var me = this, dfd = $.Deferred();
      me.getSearchLocations({
        connector: options.connector,
        searchConfig: options.searchConfig
      }).done(function(linearSearchLocations) {
        dfd.resolve(me.getSearchLocationsTreeStructure({
          linearSearchLocations: linearSearchLocations,
          searchConfig: options.searchConfig
        }));
      }).fail(function(xhr) {
        dfd.reject(utils.parseAjaxError(xhr));
      });
      return dfd.promise();
    },
    saveSavedSearchCategory: function(options) {
      var deferred = $.Deferred(), currRepo = RestResources.getCurrentRepository(), url = RestLinkrels.getLink(currRepo.get("links"), RestLinkrels.D2_SAVED_SEARCH_GROUPS), qParams = {}, postPayload = {}, objectProperties = {
        name: options.name,
        "search-category": options.category
      };
      if (options.parentId) {
        objectProperties["parent-id"] = options.parentId;
        qParams["parent-id"] = options.parentId;
      }
      if (options.title) {
        objectProperties["title"] = options.title;
      }
      postPayload["properties"] = objectProperties;
      if (options.restrictedGroups && options.restrictedGroups.length > 0) {
        postPayload["permitted"] = _.map(options.restrictedGroups, function(restrictedGroup) {
          return {
            accessor: restrictedGroup,
            "basic-permission": "READ"
          };
        });
      }
      url = Url.appendQuery(url, Url.combineQueryString(qParams));
      $.ajax(options.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(postPayload),
        success: function(response) {
          deferred.resolve(response);
        },
        error: function(xhr) {
          deferred.reject(utils.parseAjaxError(xhr));
        }
      }));
      return deferred.promise();
    },
    getGroupsForRestrictedTo: function(options) {
      var deferred = $.Deferred(), connector = options.context.getObject(ConnectorFactory), qParams = {
        inline: true
      }, collection = options.collection, url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.GROUPS);
      let filter = `not(starts-with(group_name, "d2")) and not(starts-with(group_name, "dm"))`;
      if (options.filter) {
        filter = `${filter} and contains(lower(group_name),"${options.filter}")`;
      }
      qParams["filter"] = filter;
      if (_.keys(qParams).length > 0) {
        url = Url.appendQuery(url, Url.combineQueryString(qParams));
      }
      $.ajax(connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          var options = [], nextLink = response && response.links && RestLinkrels.getLink(response.links, RestLinkrels.NEXT);
          if (response && response.entries) {
            _.each(response.entries, function(entry) {
              if (entry && entry.content && entry.content.properties && entry.content.properties["group_name"]) {
                var groupName = entry.content.properties["group_name"];
                options.push({
                  value: groupName,
                  text: groupName
                });
              }
            });
            if (nextLink) {
              collection.hasMoreRecords = true;
            } else {
              collection.hasMoreRecords = false;
            }
          }
          deferred.resolve(options);
        },
        error: deferred.reject
      }));
      return deferred.promise();
    },
    getDQLOrDictionaryDataSource: function(options) {
      var deferred = $.Deferred();
      var url = options.url;
      options.filter = options.filter === "" ? "*" : options.filter;
      url = Url.appendQuery(url, Url.combineQueryString({
        filter: options.filter,
        search_types: options.types,
        search_type_attribute: options.property["property_name"]
      }));
      var me = this;
      $.ajax(options.connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          var d = me.dsTransformer(response);
          deferred.resolve(d);
        },
        error: function() {}
      }));
      return deferred.promise();
    },
    dsTransformer: function(response) {
      var data = response["options_data"] ? response["options_data"]["data_1"] : {};
      var obj = [];
      _.each(data, function(value, key) {
        if (key !== "limited_results") {
          obj.push({
            value: value.v,
            name: value.l || value.v,
            displayValue: value.l || value.v
          });
        }
      });
      return obj;
    },
    fetchSuggestionListAsBatch: function(options, batchPayload) {
      var deferred = $.Deferred();
      var self = this;
      utils.makeBatchAjaxCall({
        connector: options.connector,
        operations: batchPayload,
        skipSWCache: options.skipSWCache
      }).done(function(successful, failed) {
        if (failed && failed.length > 0) {
          deferred.reject();
          return;
        }
        var dataList = {};
        _.each(successful, function(operation) {
          dataList[operation.id] = self.dsTransformer(operation.output);
        });
        deferred.resolve(dataList);
      });
      return deferred.promise();
    },
    getDQLDictionaryLinkRel: function(searchConfigs) {
      var url = null;
      _.each(searchConfigs, function(searchConfig) {
        if (url === null) {
          url = RestLinkrels.getLink(searchConfig.links, RestLinkrels.D2_ADVANCED_SEARCH_ATTRIBUTES_LIST);
        }
      });
      return url;
    },
    getFullTextOperationMapping: function() {
      return FULL_TEXT_OPERATON_MAPPING;
    },
    getOperatorMap: function() {
      return OPERATORS;
    },
    getOperatorServerUiMap: function() {
      return OPERATOR_UI_TO_SERVER_MAP;
    },
    getUnionProperties: function(typeValues, typesToPropertiesMap, typesToPropertiesLabelMap) {
      var propertiesMap = {}, propertiesLabelMap = {};
      if (typeValues && typeValues.length && typesToPropertiesMap && typesToPropertiesLabelMap) {
        propertiesMap = _.clone(typesToPropertiesMap[typeValues[0]]);
        for (var index = 1; index < typeValues.length; index++) {
          var typeValue = typeValues[index], nextTypeProperties = typesToPropertiesMap[typeValue];
          _.each(nextTypeProperties, function(property) {
            if (!propertiesMap[property.property_name] || propertiesMap[property.property_name] && propertiesMap[property.property_name]["label"] === propertiesMap[property.property_name]["property_name"] && propertiesMap[property.property_name]["label"] !== property["label"] && propertiesMap[property.property_name]["display_label"] !== property["display_label"]) {
              propertiesMap[property.property_name] = property;
            }
          });
        }
        _.each(propertiesMap, function(property) {
          propertiesLabelMap[property.label] = property;
        });
      }
      return {
        unionProperties: propertiesMap,
        unionPropertiesLabel: propertiesLabelMap
      };
    },
    getCommonPropertiesForSuggestionList: function(typeValues, options) {
      var properties, commonAllProperties, unionPropertiesFromSearchConfig, reducedTypes = [];
      if (typeValues.length > 1) {
        for (var i = 0; i < typeValues.length; i++) {
          var parentTypePresent = false;
          if (options.parent_info_map) {
            for (var j = 0; j < options.parent_info_map[typeValues[i]].length; j++) {
              if (typeValues.includes(options.parent_info_map[typeValues[i]][j])) {
                parentTypePresent = true;
                break;
              }
            }
          }
          if (!parentTypePresent) {
            reducedTypes.push(typeValues[i]);
          }
        }
        typeValues = reducedTypes;
      }
      if (typeValues.length === 1) {
        properties = this.getCommonProperties(typeValues, options.types_to_properties_map, options.types_to_properties_label_map);
      } else {
        commonAllProperties = this.getCommonProperties(typeValues, options.types_to_all_properties_map, options.types_to_all_properties_label_map);
        unionPropertiesFromSearchConfig = this.getUnionProperties(typeValues, options.types_to_properties_map, options.types_to_properties_label_map);
        properties = this.getCommonProperties([ "unionPropertiesFromSearchConfig", "commonAllProperties" ], {
          unionPropertiesFromSearchConfig: unionPropertiesFromSearchConfig.unionProperties,
          commonAllProperties: commonAllProperties.commonProperties
        }, {
          unionPropertiesFromSearchConfig: unionPropertiesFromSearchConfig.unionPropertiesLabel,
          commonAllProperties: commonAllProperties.commonPropertiesLabel
        });
      }
      return properties;
    }
  };
});