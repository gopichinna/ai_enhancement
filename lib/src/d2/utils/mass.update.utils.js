/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/types/date", "dctmw/server.adaptors/converters/node", "d2/utils/constants", "d2/utils/types/inputdate", "i18n!d2/utils/impl/nls/lang" ], function(_, Backbone, date, nodeConverter, constants, inputDate, lang) {
  "use strict";
  return {
    getCountData: function(objectValues, options) {
      if (!objectValues) {
        return;
      }
      options = options || {};
      var valuesCount = {}, me = this, totalCount = options.massUpdateFileCount, order = [], updateNoValue = function(valueArr, oValue) {
        valueArr["d2_mass_update_no_value"] = valueArr["d2_mass_update_no_value"] || me.getNoValueCountConfig(totalCount);
        valueArr["d2_mass_update_no_value"].count++;
        valueArr["d2_mass_update_no_value"].objectIds.push(oValue["object-id"]);
      };
      _.each(objectValues, function(objectValue) {
        if (objectValue.value) {
          if (!_.isArray(objectValue.value)) {
            objectValue.value = [ objectValue.value ];
          }
          _.each(objectValue.value, function(value) {
            if (options.isBoolean) {
              value.v = Boolean(value.v);
            }
            if (options.dateFormat) {
              value.v = value.v ? options.dateFormat === "datetime" ? date.serializeDateTime(inputDate.formatExactDateTimeInput(date.deserializeDate(value.v)), inputDate.exactDateTimeInputFormat) : date.serializeDate(inputDate.formatExactDateInput(date.deserializeDate(value.v)), inputDate.exactDateInputFormat) : "";
              value.l = options.dateFormat === "datetime" ? date.formatExactDateTime(date.deserializeDate(value.v)) : date.formatExactDate(date.deserializeDate(value.v));
            }
            if (value.v || value.v === false || value.v === 0 || options.isBoolean) {
              if (!valuesCount[value.v]) {
                valuesCount[value.v] = {
                  count: 0,
                  objectIds: [],
                  totalCount: totalCount,
                  hasValue: true,
                  value: value.v,
                  label: value.l || value.v,
                  isDateValue: options.dateFormat
                };
                order.push(value.v);
              }
              valuesCount[value.v].category = !_.isUndefined(value.c) ? value.c : null;
              valuesCount[value.v].count++;
              valuesCount[value.v].objectIds.push(objectValue["object-id"]);
            } else {
              updateNoValue(valuesCount, objectValue);
            }
          });
        } else {
          updateNoValue(valuesCount, objectValue);
        }
      });
      return {
        valuesCount: valuesCount,
        order: order
      };
    },
    getNoValueCountConfig: function(totalCount) {
      return {
        count: 0,
        objectIds: [],
        totalCount: totalCount,
        value: "d2_mass_update_no_value",
        label: lang.massUpdateNoValue,
        hasValue: false
      };
    },
    addNewValuesToAllFiles: function(multiFileCountData, values, labels, options) {
      if (_.isEmpty(values)) {
        return;
      }
      options = options || {};
      _.each(values, function(value, index) {
        multiFileCountData[value] = {
          count: 0,
          objectIds: [],
          totalCount: options.massUpdateFileCount,
          value: value,
          label: labels[index] || value
        };
      });
    },
    getCountDataModel: function(valueCount, options) {
      if (!valueCount) {
        return new Backbone.Model();
      }
      options = options || {};
      var preRemoved = options.preRemovedValues && _.contains(options.preRemovedValues, valueCount.value), preAdded = options.preAddedValues && _.contains(options.preAddedValues, valueCount.value), model = new Backbone.Model({
        id: _.uniqueId("field_value"),
        name: valueCount.label || valueCount.value,
        value: valueCount.value,
        d2_field_value_count: preRemoved ? 0 : preAdded ? valueCount.totalCount : valueCount.count,
        selectable: !preRemoved || !options.selectRows,
        has_value: valueCount.hasValue !== false,
        objectIds: preRemoved ? [] : preAdded ? _.pluck(valueCount.massUpdateNodes, "r_object_id") : valueCount.objectIds,
        total_count: valueCount.totalCount,
        massUpdateDocumentType: options.massUpdateDocumentType,
        massUpdateNodes: options.massUpdateNodes,
        selectRows: options.selectRows,
        hideInlineMenu: valueCount.hideInlineMenu,
        is_error_value: _.isString(valueCount.category) && /Error/.test(valueCount.category)
      });
      if (preRemoved || preAdded) {
        model.previousFieldValueCount = valueCount.count;
        model.previousObjectIds = valueCount.objectIds;
      }
      return model;
    },
    getCountDataModels: function(multiFileCountData, options) {
      var models = [];
      _.each(options.preOrder ? options.preOrder : Object.keys(multiFileCountData), function(key) {
        if (multiFileCountData[key].hasValue !== false || !options.ignoreNoValue) {
          models.push(this.getCountDataModel(multiFileCountData[key], options));
        }
      }.bind(this));
      return models;
    },
    fieldHasMultipleValues: function(values) {
      if (values === undefined || values === null) {
        return false;
      }
      if (_.isObject(values) || _.isArray(values)) {
        return !!_.find(values, function(value) {
          return value.v && value.v.startsWith && value.v.startsWith(lang.multipleValues) || value && value.startsWith && value.startsWith(lang.multipleValues);
        });
      } else {
        return values && values.startsWith && values.startsWith(lang.multipleValues);
      }
    },
    convertHashValues: function(values, options) {
      if (values === undefined || values === null) {
        return values;
      }
      var newValues, langPrefix = options.massUpdateDocumentType === constants.MassUpdateOptions.FOLDER_PROPERTIES ? "Folder" : options.massUpdateDocumentType === constants.MassUpdateOptions.ITEM_PROPERTIES ? "Item" : "", multiValueString = options && options.hideEnterNew ? lang.multipleValues : options && options.showSelectValue ? lang["multipleValuesSelectNewValue" + langPrefix] : options && options.showSelectDate ? lang["multipleValuesSelectNewDate" + langPrefix] : lang["multipleValuesEnterNew" + langPrefix];
      if (_.isObject(values) || _.isArray(values)) {
        newValues = JSON.parse(JSON.stringify(values));
        _.each(newValues, function(newValue, index) {
          if (newValue.v === "#####") {
            newValue.v = multiValueString;
          } else if (newValue === "#####") {
            newValues[index] = multiValueString;
          }
        });
      } else {
        newValues = values === "#####" ? multiValueString : values;
      }
      return newValues;
    },
    convertMultipleValues: function(values) {
      if (values === undefined || values === null) {
        return values;
      }
      var newValues;
      if (_.isObject(values) || _.isArray(values)) {
        newValues = JSON.parse(JSON.stringify(values));
        _.each(newValues, function(newValue, index) {
          if (newValue && newValue.v && newValue.v.startsWith && newValue.v.startsWith(lang.multipleValues)) {
            newValue.v = "#####";
          } else if (newValue && newValue.startsWith && newValue.startsWith(lang.multipleValues)) {
            newValues[index] = "#####";
          }
        });
      } else {
        newValues = values && values.startsWith && values.startsWith(lang.multipleValues) ? "#####" : values;
      }
      return newValues;
    },
    addVersionInfo: function(nodes) {
      _.chain(nodes).groupBy(function(node) {
        return node["i_chronicle_id"];
      }).filter(function(group) {
        return group.length > 1;
      }).each(function(group) {
        _.each(group, function(node) {
          node.showVersionLabel = true;
        });
      });
    },
    getMassUpdateValidationData: function(response) {
      var validationData = {
        validObjects: []
      };
      if (response) {
        var allNodes = [];
        response["mass_update_applicable"] && response["mass_update_applicable"].objects && (allNodes = allNodes.concat(response["mass_update_applicable"].objects));
        response["mass_update_partial"] && response["mass_update_partial"].objects && (allNodes = allNodes.concat(response["mass_update_partial"].objects));
        response["mass_update_not_applicable"] && response["mass_update_not_applicable"].objects && (allNodes = allNodes.concat(response["mass_update_not_applicable"].objects));
        this.addVersionInfo(allNodes);
        if (response["mass_update_applicable"] && response["mass_update_applicable"].objects) {
          validationData.validObjects = validationData.validObjects.concat(response["mass_update_applicable"].objects);
          validationData.massUpdateApplicableCount = response["mass_update_applicable"].count;
        }
        if (response["mass_update_partial"] && response["mass_update_partial"].objects) {
          validationData.validObjects = validationData.validObjects.concat(response["mass_update_partial"].objects);
          validationData.partialUpdatedNodes = response["mass_update_partial"] && this.getNodesConverterData(JSON.parse(JSON.stringify(response["mass_update_partial"])));
          validationData.massUpdatePartialCount = response["mass_update_partial"].count;
        }
        if (response["mass_update_not_applicable"] && response["mass_update_not_applicable"].objects) {
          validationData.errorNodes = this.getNodesConverterData(response["mass_update_not_applicable"]);
          validationData.massUpdateNotApplicableCount = response["mass_update_not_applicable"].count;
        }
      }
      return validationData;
    },
    getNodesConverterData: function(errorNodes) {
      return errorNodes.objects.map(_.bind(function(errorNode) {
        return this.getErrorNodeObject(errorNode);
      }, this));
    },
    getErrorNodeObject: function(errorNode) {
      nodeConverter.convertNode(errorNode);
      return {
        name: errorNode.name,
        message: errorNode["rest-error"].message,
        id: errorNode.id,
        showVersionLabel: errorNode.showVersionLabel,
        r_version_label: errorNode.r_version_label,
        node: errorNode,
        status: errorNode["rest-error"].status
      };
    }
  };
});