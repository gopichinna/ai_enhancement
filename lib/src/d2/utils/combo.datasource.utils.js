/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "d2/utils/taxonomy.utils", "dctmw/utils/utils", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels" ], function(_, $, Url, TaxonomyUtils, Utils, RestResources, RestLinkrels) {
  "use strict";
  var taxonomyMasterCache = {};
  var dictionaryMasterCache = {};
  var listAssistance = Object.freeze({
    TAXONOMY: "taxonomy",
    JAVA: "java",
    DICTIONARY: "dictionary",
    DQL: "dql",
    CUSTOM: "custom"
  });
  function dsTransformer(response) {
    var data = response["options_data"] ? response["options_data"]["data_1"] : {};
    var obj = [];
    _.each(data, function(value, key) {
      if (key !== "limited_results") {
        obj.push({
          value: value.v,
          text: value.l || value.v,
          category: value.c
        });
      }
    });
    return obj;
  }
  function getUniqueTaxonomyKey(combo) {
    var propertyPageName;
    if (combo.href.split("?").length === 2) {
      if (combo.href.split("?")[1].split("=").length === 2) {
        propertyPageName = combo.href.split("?")[1].split("=")[1];
        propertyPageName = propertyPageName.replace(new RegExp("%20", "g"), "_");
      }
    }
    return propertyPageName ? combo.assistance_taxonomy + "_" + propertyPageName : combo.assistance_taxonomy;
  }
  function getUniqueDictionaryKey(combo) {
    return combo.assistance_dictionary_alias ? combo.assistance_dictionary + "_" + combo.assistance_dictionary_alias : combo.assistance_dictionary;
  }
  function getUrlForDataAssistance(field, options) {
    var url = Utils.buildLinkUrl(field);
    if (options && options.dialogName && _.isUndefined(url)) {
      var dependencies = field.dependencies && field.dependencies.split(","), queryParams = {
        dialog_name: options.dialogName,
        field_name: field.id,
        limit: false
      };
      if (field.assistance_type === "dictionary" && field.assistance_dictionary) {
        queryParams["dictionary_name"] = field.assistance_dictionary;
        if (field.assistance_dictionary_alias) {
          queryParams["dictionary_key"] = field.assistance_dictionary_alias;
        }
      }
      url = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), "dialog-options", field.assistance_type);
      url = Url.appendQuery(url, Url.makeMultivalueParameter("dependencies", dependencies));
      url = Url.appendQuery(url, Url.combineQueryString(queryParams));
    }
    return url;
  }
  return {
    getData: function(field) {
      switch (field.options.ds.assistance_type) {
       case listAssistance.TAXONOMY:
        return this.getTaxonomy(field);

       case listAssistance.DICTIONARY:
        return this.getDictionaryData(field);

       case listAssistance.DQL:
        return this.getDQL(field);

       case listAssistance.JAVA:
        return this.getJAVA(field);

       default:
        return this.getCustomData(field);
      }
    },
    getTaxonomy: function(field) {
      var deferred = $.Deferred(), options = field.options.ds;
      var taxonomyKey = options.taxonomyKey;
      if (!taxonomyKey) {
        deferred.reject(new Error("taxonomyKey must be provided as part of options"));
      } else if (taxonomyMasterCache[taxonomyKey]) {
        deferred.resolve(this.getValues(field));
      } else {
        var me = this;
        $.ajax(options.connector.extendAjaxOptions({
          url: options.url,
          success: function(response) {
            taxonomyMasterCache[taxonomyKey] = response;
            taxonomyMasterCache[taxonomyKey]["normalizedMap"] = me.normalizeTaxonomy(response);
            deferred.resolve(me.getValues(field));
          },
          error: function(request, textStatus, error) {
            deferred.reject(error);
          }
        }));
      }
      return deferred.promise();
    },
    normalizeTaxonomy: function(response) {
      var normalizedTaxMap = {};
      var normalize = function(nodes, parentNode) {
        _.each(nodes, function(node) {
          node.parent = parentNode;
          if (normalizedTaxMap[node.level]) {
            normalizedTaxMap[node.level].push(node);
          } else {
            normalizedTaxMap[node.level] = [ node ];
          }
          normalize(node.taxnomy_nodes, node);
        });
      };
      normalize(response.taxnomy_nodes, null);
      return normalizedTaxMap;
    },
    getValues: function(field) {
      var options = field.options.ds;
      if (options.assistance_type === "dictionary") {
        var dictionaryKey = options.dictionaryKey, dependentAttributes = options.dependencies;
        return dictionaryMasterCache[dictionaryKey] && !dependentAttributes?.length ? dictionaryMasterCache[dictionaryKey] : [];
      } else {
        var resultList = [];
        var taxoKey = field.options.ds.taxonomyKey;
        if (taxonomyMasterCache[taxoKey]) {
          resultList = TaxonomyUtils.getTaxonomyOptions(taxonomyMasterCache[taxoKey], field);
        }
        return resultList;
      }
    },
    _clearCaches: function() {
      taxonomyMasterCache = {};
    },
    getDictionaryData: function(field) {
      var options = field.options.ds, deferred = $.Deferred(), fullUrl = options.url, filterDependency, dependentAttributes = options.dependencies, dictionaryKey = options.dictionaryKey, that = this;
      if (options.valueDependencies || dependentAttributes.length && options.reload) {
        dictionaryMasterCache[dictionaryKey] = null;
      }
      if (!dictionaryKey) {
        deferred.reject(new Error("dictionaryKey must be provided as part of options"));
      } else if (dictionaryMasterCache[dictionaryKey] && !dependentAttributes?.length) {
        deferred.resolve(this.getValues(field));
      } else {
        if (!options.noClientFilter) {
          dependentAttributes = _.without(options.dependencies, "filter");
          filterDependency = Url.combineQueryString({
            filter: options.filter
          });
        }
        if (options.dependencies.length && options.view) {
          var dependenciesAsQueryStringMap = that.fetchDependencyMap(dependentAttributes, options);
          fullUrl = Url.appendQuery(fullUrl, Url.combineQueryString(filterDependency, dependenciesAsQueryStringMap.join("&")));
        }
        if (field.options.d2FormNodeIds && field.options.d2FormNodeIds.length > 0) {
          fullUrl = Url.appendQuery(fullUrl, Url.combineQueryString({
            object_ids: field.options.d2FormNodeIds.join("|")
          }));
        }
        fullUrl = that.buildValueDependencyUrl(fullUrl, options);
        options.dataSourceLoading = true;
        $.ajax(options.connector.extendAjaxOptions({
          url: fullUrl,
          type: "get",
          dataType: "json",
          success: function(jsonDocument) {
            var ds = jsonDocument;
            options.view.collection.hasMoreRecords = jsonDocument["has-more-records"] ? true : false;
            if (options.dsTransformer && _.isFunction(options.dsTransformer)) {
              ds = options.dsTransformer(ds);
            }
            dictionaryMasterCache[dictionaryKey] = ds;
            deferred.resolve(ds);
          },
          error: function(request, textStatus, error) {
            deferred.reject(error);
          }
        }));
      }
      return deferred.promise();
    },
    addRepeatQueryParameter: function(dependentAttribute, data) {
      var repObject = {};
      repObject["repeat_" + dependentAttribute] = true;
      return Url.combineQueryString(Url.makeMultivalueParameter(dependentAttribute, data), repObject);
    },
    fetchDependencyMap: function(dependentAttributes, options) {
      var self = this;
      var dependenciesAsQueryStringMap = _.map(dependentAttributes, function(dependentAttribute) {
        var alpacaField = options.view.alpacaField, dependentControl = self.findDependentControl(alpacaField.connector.config.formView, dependentAttribute), resolvedDependentAttribute = "", attr = {};
        if (dependentControl) {
          if (_.isArray(dependentControl) && dependentControl.length > 0) {
            if (alpacaField.options.isGridField) {
              var index = _.last(alpacaField.parent.path.split("[")).split("]")[0];
              attr[dependentAttribute] = dependentControl[index].data;
              resolvedDependentAttribute = Url.combineQueryString(attr);
            } else {
              resolvedDependentAttribute = self.addRepeatQueryParameter(dependentAttribute, _.pluck(dependentControl, "data"));
            }
          } else if (dependentControl._repeating || dependentControl.type === "d2checkbox" || dependentControl.type === "d2list" || dependentControl.type === "d2userlist" || dependentControl.type === "d2massupdatecheckbox") {
            resolvedDependentAttribute = self.addRepeatQueryParameter(dependentAttribute, dependentControl.getValue());
          } else {
            attr[dependentAttribute] = dependentControl.data;
            resolvedDependentAttribute = Url.combineQueryString(attr);
          }
        }
        return resolvedDependentAttribute;
      });
      return dependenciesAsQueryStringMap;
    },
    findDependentControl: function(formView, selectedId) {
      var controlPathObj = formView._keyPathMap[selectedId];
      var sourceForm = formView.getParentFormForControl(selectedId);
      return sourceForm ? sourceForm.getAlpacaControlByPath(controlPathObj.fieldPath) : undefined;
    },
    getDQL: function(field) {
      var options = field.options.ds, deferred = $.Deferred(), fullUrl = options.url, filterDependency, dependentAttributes = options.dependencies, that = this;
      if (options.dependencies.length && options.view) {
        if (_.contains(options.dependencies, "filter")) {
          dependentAttributes = _.without(options.dependencies, "filter");
          filterDependency = Url.combineQueryString({
            filter: options.filter
          });
        }
        if (options.dependencies.length && options.view) {
          var dependenciesAsQueryStringMap = that.fetchDependencyMap(dependentAttributes, options);
          fullUrl = Url.appendQuery(fullUrl, Url.combineQueryString(filterDependency, dependenciesAsQueryStringMap.join("&")));
        }
      }
      if (field.options.d2FormNodeIds && field.options.d2FormNodeIds.length > 0) {
        fullUrl = Url.appendQuery(fullUrl, Url.combineQueryString({
          object_ids: field.options.d2FormNodeIds.join("|")
        }));
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
          }
          deferred.resolve(ds);
        },
        error: function(request, textStatus, error) {
          deferred.reject(error);
        }
      }));
      return deferred.promise();
    },
    getJAVA: function(field) {
      var options = field.options.ds, deferred = $.Deferred(), fullUrl = options.url, filterDependency, dependentAttributes = options.dependencies, that = this;
      if (options.dependencies.length && options.view) {
        if (_.contains(options.dependencies, "filter")) {
          dependentAttributes = _.without(options.dependencies, "filter");
          filterDependency = Url.combineQueryString({
            filter: options.filter
          });
        }
        if (options.dependencies.length && options.view) {
          var dependenciesAsQueryStringMap = that.fetchDependencyMap(dependentAttributes, options);
          fullUrl = Url.appendQuery(fullUrl, Url.combineQueryString(filterDependency, dependenciesAsQueryStringMap.join("&")));
        }
      }
      if (field.options.d2FormNodeIds && field.options.d2FormNodeIds.length > 0) {
        fullUrl = Url.appendQuery(fullUrl, Url.makeMultivalueParameter("object_ids", field.options.d2FormNodeIds));
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
          }
          deferred.resolve(ds);
        },
        error: function(request, textStatus, error) {
          deferred.reject(error);
        }
      }));
      return deferred.promise();
    },
    getCustomData: function(field) {
      var options = field.options.ds, deferred = $.Deferred();
      setTimeout(function() {
        if (_.isFunction(options["getDataSource"])) {
          var func = options["getDataSource"];
          var returnValue = func.call(this, options.attrBeforeChange, field);
          if (Utils.isJqueryPromise(returnValue)) {
            returnValue.done(deferred.resolve).fail(deferred.reject);
          } else {
            deferred.resolve(returnValue);
          }
        } else {
          deferred.resolve();
        }
      });
      return deferred.promise();
    },
    buildDictionaryDS: function(comboSelect, combo, options) {
      var valueDependencies;
      if (combo.assistance_dictionary) {
        var dictionaryName = combo.assistance_dictionary;
        var patternRegex = /\$value\((.*?)\)/gm;
        var match;
        do {
          match = patternRegex.exec(dictionaryName);
          if (match) {
            valueDependencies = valueDependencies ? valueDependencies : [];
            valueDependencies.push(match[1]);
          }
        } while (match);
      }
      if (!!combo.asynchronous || combo.dependencies) {
        comboSelect["options"]["fields"][combo.id]["ds"] = {
          async: combo.asynchronous,
          url: getUrlForDataAssistance(combo, options),
          assistance_type: combo.assistance_type,
          dsTransformer: dsTransformer,
          dictionaryName: combo.assistance_dictionary,
          dictionaryKey: getUniqueDictionaryKey(combo),
          dependencies: combo.dependencies && combo.dependencies.split(",") || [],
          dictParams: combo.dictParams,
          valueDependencies: valueDependencies
        };
      }
      if (comboSelect["options"]["fields"][combo.id]["ds"] && comboSelect["options"]["fields"][combo.id]["ds"].dependencies) {
        var doComboReload = [];
        _.each(comboSelect["options"]["fields"][combo.id]["ds"].dependencies, function(dependency) {
          if (dependency !== "filter") {
            doComboReload.push("(getValue(" + dependency + "))");
          }
        });
        if (doComboReload.length > 0) {
          comboSelect["expressions"][combo.id]["doComboReload"] = doComboReload.length === 1 ? doComboReload[0] : doComboReload;
        }
      }
      return comboSelect;
    },
    buildDqlDS: function(comboSelect, combo, options) {
      if (combo.asynchronous || combo.dependencies) {
        comboSelect["options"]["fields"][combo.id]["ds"] = {
          async: combo.asynchronous,
          url: getUrlForDataAssistance(combo, options),
          assistance_type: combo.assistance_type,
          dsTransformer: dsTransformer,
          dependencies: combo.dependencies && combo.dependencies.split(",") || []
        };
        if (comboSelect["options"]["fields"][combo.id]["ds"].dependencies) {
          var doComboReload = [];
          _.each(comboSelect["options"]["fields"][combo.id]["ds"].dependencies, function(dependency) {
            if (dependency !== "filter") {
              doComboReload.push("(getValue(" + dependency + "))");
              comboSelect["expressions"][combo.id]["doComboReload"] = "(getValue(" + dependency + "))";
            }
          });
          if (doComboReload.length > 0) {
            comboSelect["expressions"][combo.id]["doComboReload"] = doComboReload.length === 1 ? doComboReload[0] : doComboReload;
          }
        }
      }
      return comboSelect;
    },
    buildJavaDS: function(comboSelect, combo, options) {
      if (combo.asynchronous || combo.dependencies) {
        comboSelect["options"]["fields"][combo.id]["ds"] = {
          async: combo.asynchronous,
          url: getUrlForDataAssistance(combo, options),
          assistance_type: combo.assistance_type,
          dsTransformer: dsTransformer,
          dependencies: combo.dependencies && combo.dependencies.split(",") || []
        };
        if (comboSelect["options"]["fields"][combo.id]["ds"].dependencies) {
          var doComboReload = [];
          _.each(comboSelect["options"]["fields"][combo.id]["ds"].dependencies, function(dependency) {
            if (dependency !== "filter") {
              doComboReload.push("(getValue(" + dependency + "))");
              comboSelect["expressions"][combo.id]["doComboReload"] = "(getValue(" + dependency + "))";
            }
          });
          if (doComboReload.length > 0) {
            comboSelect["expressions"][combo.id]["doComboReload"] = doComboReload.length === 1 ? doComboReload[0] : doComboReload;
          }
        }
      }
      return comboSelect;
    },
    buildTaxonomyDS: function(comboSelect, combo) {
      comboSelect["options"]["fields"][combo.id]["ds"] = {
        async: combo.asynchronous,
        url: Utils.buildLinkUrl(combo),
        assistance_type: combo.assistance_type,
        assistanceTaxoAttrAfter: combo.assistance_taxo_attrib_after,
        assistanceTaxoAttrBefore: combo.assistance_taxo_attrib_before,
        taxonomyName: combo.assistance_taxonomy,
        taxonomyLevel: combo.taxo_level,
        taxonomyKey: getUniqueTaxonomyKey(combo)
      };
      return comboSelect;
    },
    buildCustomDS: function(comboSelect, combo) {
      if (combo.dependencyOnControl) {
        combo.dependencyOnControl = _.isArray(combo.dependencyOnControl) ? combo.dependencyOnControl : [ combo.dependencyOnControl ];
      } else {
        combo.dependencyOnControl = _.without(combo.dependencies && combo.dependencies.split(","), "filter");
      }
      comboSelect["options"]["fields"][combo.id]["ds"] = {
        assistance_type: combo.assistance_type,
        dependencyOnControl: combo.dependencyOnControl || [],
        getDataSource: combo.getDataSourceCallBack,
        async: combo.asynchronous,
        dependencies: combo.dependencies && combo.dependencies.split(",") || [],
        url: combo.href && Utils.buildLinkUrl(combo)
      };
      if (comboSelect["options"]["fields"][combo.id]["ds"].dependencyOnControl) {
        _.each(comboSelect["options"]["fields"][combo.id]["ds"].dependencyOnControl, function(dependency) {
          if (comboSelect["options"]["fields"][combo.id]["type"] !== "d2list") {
            comboSelect["expressions"][combo.id]["doComboReload"] = "(getValue(" + dependency + "))";
          }
        });
      }
      return comboSelect;
    },
    getTaxonomySelection: function(args) {
      var field = args.field;
      var resultList = [];
      var taxoKey = field.options.ds.taxonomyKey;
      if (taxonomyMasterCache[taxoKey]) {
        resultList = TaxonomyUtils.getTaxonomySelection(taxonomyMasterCache[taxoKey], field);
      }
      return resultList;
    },
    buildValueDependencyUrl: function(url, options) {
      if (options.valueDependencies) {
        var params = {};
        if (!options.dictParams) {
          options.dictParams = {
            params: options.view.alpacaField.connector.config.formView && options.view.alpacaField.connector.config.formView.node ? options.view.alpacaField.connector.config.formView.node._changedFormValuesMap.properties : {},
            documentId: options.view.alpacaField.connector.config.formView.node.get("id")
          };
        }
        var dependencies = [];
        params["document-id"] = options.dictParams.documentId;
        _.each(options.valueDependencies, function(field) {
          if (options.dictParams && options.dictParams.params && options.dictParams.params[field]) {
            dependencies.push(field);
            params[field] = options.dictParams.params[field];
          }
        });
        params["dependencies"] = dependencies;
        url = Url.appendQuery(url, Url.combineQueryString(params));
      }
      return url;
    },
    isAsynchronousDataSourceField: function(field) {
      var asynchronousDataSourceField = !!(field && field.options && field.options.ds);
      if (field && field.options && field.options.ds && field.connector && field.connector.config && field.connector.config.formView) {
        var fieldDataSource = field.options.ds, formView = field.connector.config.formView, dependentAttributes = fieldDataSource.dependencies, dependencyAttributesInForm = dependentAttributes && _.filter(dependentAttributes, dependentAttribute => {
          return !!this.findDependentControl(formView, dependentAttribute);
        });
        if (!fieldDataSource.async && dependentAttributes && dependentAttributes.length > 0 && !_.contains(dependentAttributes, "filter") && dependencyAttributesInForm && dependencyAttributesInForm.length === 0 && fieldDataSource.assistance_type !== "taxonomy") {
          asynchronousDataSourceField = false;
        }
      }
      return asynchronousDataSourceField;
    },
    buildHierarchyDS: function(arr, options) {
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
      return DFSArray;
    }
  };
});