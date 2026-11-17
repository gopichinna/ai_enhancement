/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "dctmw/utils/utils", "dctmw/utils/form.utils" ], function(_, $, Url, Utils, FormUtils) {
  "use strict";
  const REPEATING_ATTR_SET = new Set([ "dctmwlist" ]);
  const DataSourceUtil = {
    mixin: function(extras) {
      return _.extend(this, extras);
    },
    getData: function(field) {
      return this.getCustomData(field);
    },
    defaultDsTransformer: function(ds) {
      if (ds?.entries && _.isArray(ds.entries)) {
        return ds.entries.map(item => {
          let value = item.content?.properties?.option_value || "", text = item.content?.properties?.option_label || "";
          return {
            value: value,
            text: text
          };
        });
      } else {
        console.warn("unsupported form-values schema");
        return ds;
      }
    },
    addRepeatQueryParameter: function(dependentAttribute, data) {
      var repObject = {};
      repObject["repeat_" + dependentAttribute] = true;
      return Url.combineQueryString(Url.makeMultivalueParameter(dependentAttribute, data), repObject);
    },
    fetchDependencyMap: function(dependentAttributes, options, mutableDepAttrMap) {
      var dependenciesAsQueryStringArr = _.map(dependentAttributes, dependentAttribute => {
        var alpacaField = options.view.alpacaField, dependentControl = this.findDependentControl(alpacaField.connector.config.formView, dependentAttribute), resolvedDependentAttribute = "";
        if (dependentControl) {
          const {
            attrValues,
            resolvedAttribute
          } = this.getDependentControlData(dependentAttribute, dependentControl, alpacaField);
          resolvedDependentAttribute = resolvedAttribute;
          mutableDepAttrMap && _.extend(mutableDepAttrMap, attrValues);
        }
        return resolvedDependentAttribute;
      });
      return dependenciesAsQueryStringArr;
    },
    findDependentControl: function(formView, selectedId) {
      if (!formView._keyPathMap) {
        throw new Error("_keyPathMap is required to find the dependent fields. Use FormUtils#buildKeyPathMap to build the map");
      }
      const controlPathObj = formView._keyPathMap[selectedId], sourceForm = _.isFunction(formView.getParentFormForControl) ? formView.getParentFormForControl(selectedId) : formView;
      if (sourceForm && controlPathObj) {
        let res;
        if (_.isFunction(sourceForm.getAlpacaControlByPath)) {
          res = sourceForm.getAlpacaControlByPath(controlPathObj.fieldPath);
        } else {
          res = FormUtils.getAlpacaControlByPath(formView.form, controlPathObj.fieldPath);
        }
        return res;
      }
    },
    getDependentControlData: function(dependentAttribute, dependentControl) {
      let resolvedAttribute, fieldVal, attrValues = {};
      if (dependentControl._repeating || this._isRepatingAttribute(dependentControl.type)) {
        fieldVal = dependentControl.getValue();
        attrValues[`repeat_${dependentAttribute}`] = true;
        resolvedAttribute = this.addRepeatQueryParameter(dependentAttribute, fieldVal);
      } else {
        fieldVal = dependentControl.data;
        resolvedAttribute = Url.combineQueryString({
          [dependentAttribute]: fieldVal
        });
      }
      attrValues[dependentAttribute] = fieldVal;
      return {
        resolvedAttribute: resolvedAttribute,
        attrValues: attrValues
      };
    },
    _isRepatingAttribute: function(type) {
      return REPEATING_ATTR_SET.has(type);
    },
    registerRepeatingAttribute: function(fieldTypes) {
      fieldTypes = _.isArray(fieldTypes) ? fieldTypes : [ fieldTypes ];
      fieldTypes.forEach(REPEATING_ATTR_SET.add, REPEATING_ATTR_SET);
    },
    getCustomData: function(field) {
      const deferred = $.Deferred(), me = this, options = field.options.ds, url = options.url, depAttrMap = {};
      let dependentAttributes = this._getDependenciesFromField(field), filterDependency, fullUrl;
      if (dependentAttributes?.length && options.view) {
        if (_.contains(dependentAttributes, "filter")) {
          dependentAttributes = _.without(dependentAttributes, "filter");
          filterDependency = Url.combineQueryString({
            filter: options.filter
          });
        }
        let dependenciesAsQueryStringArr = me.fetchDependencyMap(dependentAttributes, options, depAttrMap);
        if (url) {
          if (_.isFunction(url)) {
            fullUrl = url(field, filterDependency, dependenciesAsQueryStringArr, depAttrMap);
          } else {
            fullUrl = Url.appendQuery(url, Url.combineQueryString(filterDependency, dependenciesAsQueryStringArr.join("&")));
          }
        }
      } else {
        fullUrl = _.isFunction(url) ? url(field, "", [], {}) : url;
      }
      if (field.options.formNodeIds && field.options.formNodeIds.length > 0) {
        fullUrl = Url.appendQuery(fullUrl, Url.combineQueryString({
          object_ids: field.options.formNodeIds.join("|")
        }));
      }
      if (_.isFunction(options["getDataSource"])) {
        setTimeout(() => {
          var func = options["getDataSource"];
          var returnValue = func.call(this, options.attrBeforeChange, field, depAttrMap);
          if (Utils.isJqueryPromise(returnValue)) {
            returnValue.done(deferred.resolve).fail(deferred.reject);
          } else {
            deferred.resolve(returnValue);
          }
        });
      } else if (options.url) {
        if (!options.connector) {
          throw new Error(`connector is required in ${field.options.label} field-options to load the data from url`);
        }
        $.ajax(options.connector.extendAjaxOptions({
          url: fullUrl,
          type: "get",
          dataType: "json",
          success: function(jsonDocument) {
            var ds = jsonDocument;
            options.view.collection.hasMoreRecords = jsonDocument["has-more-records"] ? true : false;
            if (options.dsTransformer && _.isFunction(options.dsTransformer)) {
              ds = options.dsTransformer(ds);
            } else {
              ds = me.defaultDsTransformer(ds);
            }
            deferred.resolve(ds);
          },
          error: function(request, textStatus, error) {
            deferred.reject(error);
          }
        }));
      } else {
        throw new Error(`getDataSource or url has to be provided in options of ${field.options.label} to load the data`);
      }
      return deferred.promise();
    },
    _getDependenciesFromField: function(field) {
      return field.options.dependencies || field.options.ds?.dependencies;
    },
    isAsynchronousDataSourceField: function(field) {
      var asynchronousDataSourceField = !!(field && field.options && field.options.ds);
      if (field && field.options && field.options.ds && field.connector && field.connector.config && field.connector.config.formView) {
        var fieldDataSource = field.options.ds, formView = field.connector.config.formView, dependentAttributes = this._getDependenciesFromField(field), dependencyAttributesInForm = dependentAttributes && _.filter(dependentAttributes, dependentAttribute => {
          return !!this.findDependentControl(formView, dependentAttribute);
        });
        if (!fieldDataSource.async && dependentAttributes && dependentAttributes.length > 0 && !_.contains(dependentAttributes, "filter") && dependencyAttributesInForm && dependencyAttributesInForm.length === 0) {
          asynchronousDataSourceField = false;
        }
      }
      return asynchronousDataSourceField;
    },
    buildHierarchyDS: function(arr, options) {
      arr.map(entry => entry.visited = false);
      let hasChildren = function(node) {
        return node.children.length > 0;
      };
      let parentAttribute = options?.parentAttribute || "parent", isDisabled = options?.isDisabled || hasChildren, enableAllOptions = options?.enableAllOptions;
      let DFSRecurssive = function(node, options, adjacencyList, DFSArray) {
        node.level = options.level;
        node.labelPathString = options.labelPathString + "›" + node.l;
        DFSArray.push(node);
        if (adjacencyList[node.v]) {
          let level = options.level, labelPathString = options.labelPathString, childOptions = {
            level: ++level,
            labelPathString: !labelPathString ? node.l : labelPathString + "›" + node.l
          };
          for (let i = 0; i < adjacencyList[node.v].length; i++) {
            if (!adjacencyList[node.v][i]["visited"]) {
              adjacencyList[node.v][i]["visited"] = true;
              DFSRecurssive(adjacencyList[node.v][i], childOptions, adjacencyList, DFSArray);
            }
          }
        }
      };
      let DFSTraverse = function(adjacencyList, DFSArray) {
        let root = {
          v: "root",
          l: ""
        };
        return DFSRecurssive(root, {
          level: -1,
          labelPathString: ""
        }, adjacencyList, DFSArray);
      };
      let adjacencyList = {}, DFSArray = [];
      for (let i = 0; i < arr.length; i++) {
        let parent = arr[i][parentAttribute] || "root";
        if (adjacencyList[parent]) {
          adjacencyList[parent].push(arr[i]);
        } else {
          adjacencyList[parent] = [ arr[i] ];
        }
      }
      DFSTraverse(adjacencyList, DFSArray);
      for (let i = 0; i < DFSArray.length; i++) {
        DFSArray[i]["children"] = adjacencyList[DFSArray[i]["v"]] || [];
        if (!enableAllOptions) {
          DFSArray[i]["disabled"] = isDisabled(DFSArray[i]);
        }
        DFSArray[i]["labelPathString"] = (DFSArray[i]["labelPathString"] || "").trim();
        delete DFSArray[i]["visited"];
      }
      DFSArray.shift();
      if (DFSArray.length < arr.length) {
        let unVisitedEntries = arr.filter(entry => entry.visited === false);
        unVisitedEntries.forEach(entry => delete entry.visited);
        DFSArray.push(...unVisitedEntries);
      }
      return DFSArray;
    }
  };
  return DataSourceUtil;
});