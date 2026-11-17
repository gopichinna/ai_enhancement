/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "nuc/utils/log", "dctmw/utils/dctmw.datasource.utils", "d2/utils/taxonomy.utils", "dctmw/utils/utils", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/constants", "i18n!nuc/utils/impl/nls/lang" ], function(_, $, Url, log, DctmwDataSourceUtils, TaxonomyUtils, Utils, RestResources, RestLinkrels, Constants, lang) {
  "use strict";
  DctmwDataSourceUtils.registerRepeatingAttribute([ "d2checkbox", "d2list", "d2userlist", "d2massupdatecheckbox" ]);
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
      if (key !== "limited_results" && !key.startsWith("truncatedResultSetSize")) {
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
  const dctmwGetCustomData = DctmwDataSourceUtils.getCustomData, dctmwGetDependentControlData = DctmwDataSourceUtils.getDependentControlData;
  const ComboDataSourceUtils = {
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
    getCustomData: function(field) {
      if (field.options.d2FormNodeIds) {
        field.options.formNodeIds = field.options.d2FormNodeIds;
      }
      return dctmwGetCustomData.call(this, field);
    },
    fetchDataUsingWorker: function(field, fullUrl, data) {
      var deferred = $.Deferred(), options = field.options.ds, self = this, workerOptions = {
        success: function(jsonDocument) {
          var ds = jsonDocument;
          options.view.collection.hasMoreRecords = jsonDocument["has-more-records"] ? true : false;
          if (options.dsTransformer && _.isFunction(options.dsTransformer)) {
            ds = options.dsTransformer(ds);
          }
          deferred.resolve(ds);
        },
        error: function(errMessage) {
          if (!self.confirmingReload) {
            self.confirmingReload = true;
            var dialogTitle = self._succeeded ? lang.SessionExpiredDialogTitle : lang.AuthenticationFailureDialogTitle;
            log.warn(errMessage) && console.warn(log.last);
            require([ "smart/dialogs/modal.alert/modal.alert" ], function(alertDialog) {
              alertDialog.showWarning(lang.AuthenticationFailureDialogText, dialogTitle, {
                buttons: alertDialog.buttons.Ok
              }).always(function() {
                options.connector.authenticator.unauthenticate({
                  reason: "failed"
                });
              });
            });
          }
        }
      };
      require([ "d2/utils/workerInstance" ], function(workerInstance) {
        var deferred = $.Deferred();
        var workerBlob = new Blob([ "(" + workerInstance.workerFunction.toString() + ")()" ], {
          type: "text/javascript"
        });
        var blobUrl = URL.createObjectURL(workerBlob);
        var worker = new Worker(blobUrl, {
          type: "module"
        });
        var connectorOptions = {};
        connectorOptions = options.connector.extendAjaxOptions({
          url: fullUrl,
          type: "POST",
          dataType: "json",
          headers: {
            "content-Type": "application/json"
          }
        });
        if (data) {
          worker.postMessage({
            url: fullUrl,
            method: "POST",
            dataType: "json",
            type: "post",
            "content-Type": "application/json",
            options: {
              headers: connectorOptions.headers,
              method: "POST",
              dataType: "json",
              type: "post",
              "content-Type": "application/json",
              body: JSON.stringify(data),
              credentials: "include"
            },
            data: JSON.stringify(data)
          });
        } else {
          worker.postMessage({
            url: fullUrl,
            method: "GET",
            options: {
              headers: connectorOptions.headers,
              credentials: "include"
            }
          });
        }
        worker.onmessage = function(event) {
          var {
            status,
            data,
            error
          } = event.data;
          if (status === "success") {
            workerOptions.success(data);
          } else if (status === "unauthorized") {
            workerOptions.error(error);
          } else {
            deferred.reject(error);
          }
        };
      });
      return deferred.promise();
    },
    populateCollection: function(collectionData) {
      var dfd = $.Deferred();
      if (!collectionData && this.optionsCollection && this.optionsCollection.length > 0) {
        collectionData = this.optionsCollection.map(function(model) {
          return model.attributes;
        });
      }
      if (collectionData) {
        if (this.alpacaField && this.alpacaField.options && this.alpacaField.options.ignoreProgressiveLoad === true) {
          this.collection.reset(collectionData);
          dfd.resolve();
        } else {
          this.collection.populate(collectionData, {
            reset: true
          }).done(dfd.resolve).fail(dfd.reject);
        }
      }
      return dfd.promise();
    },
    getTaxonomy: function(field) {
      var deferred = $.Deferred(), options = field.options.ds, fullUrl = options.url;
      var taxonomyKey = options.taxonomyKey;
      if (!taxonomyKey) {
        deferred.reject(new Error("taxonomyKey must be provided as part of options"));
      } else if (taxonomyMasterCache[taxonomyKey]) {
        deferred.resolve(this.getValues(field));
      } else {
        var me = this;
        if (!Utils.isAppworks() && field.options.ds.async && field.taxonomyChildren.length > 4) {
          this.fetchDataUsingWorker(field, fullUrl).done(function(data) {
            deferred.resolve(me.getValues(data));
          }).fail(function(error) {
            deferred.reject(error);
          });
        } else {
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
        if (this.isWorkerRequestOrNot(field)) {
          this.fetchDataUsingWorker(field, fullUrl).done(function(data) {
            deferred.resolve(data);
          }).fail(function(error) {
            deferred.reject(error);
          });
        } else {
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
      }
      return deferred.promise();
    },
    getDependentControlData: function(dependentAttribute, dependentControl, alpacaField) {
      if (_.isArray(dependentControl) && dependentControl.length > 0) {
        const attrValues = {};
        let resolvedAttribute;
        if (alpacaField.options.isGridField) {
          var index = _.last(alpacaField.parent.path.split("[")).split("]")[0];
          attrValues[dependentAttribute] = dependentControl[index].data;
          resolvedAttribute = Url.combineQueryString(attrValues);
        } else {
          resolvedAttribute = this.addRepeatQueryParameter(dependentAttribute, _.pluck(dependentControl, "data"));
          attrValues[dependentAttribute] = _.pluck(dependentControl, "data");
        }
        return {
          resolvedAttribute: resolvedAttribute,
          attrValues: attrValues
        };
      } else {
        return dctmwGetDependentControlData.call(this, dependentAttribute, dependentControl, alpacaField);
      }
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
      if (this.isWorkerRequestOrNot(field)) {
        this.fetchDataUsingWorker(field, fullUrl, {
          dql: options.assistance_dql
        }).done(function(data) {
          deferred.resolve(data);
        }).fail(function(error) {
          deferred.reject(error);
        });
      } else {
        $.ajax(options.connector.extendAjaxOptions({
          url: fullUrl,
          type: "post",
          dataType: "json",
          contentType: Constants.MediaTypes.JSON,
          data: JSON.stringify({
            dql: options.assistance_dql
          }),
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
      }
      return deferred.promise();
    },
    isWorkerRequestOrNot: function(field) {
      return Utils.isAppworks() ? false : field.options.ds.async || field.options.ds.assistance_type === "dql";
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
        type: "post",
        dataType: "json",
        contentType: Constants.MediaTypes.JSON,
        data: JSON.stringify({
          java: options.assistance_java
        }),
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
          dependencies: combo.dependencies && combo.dependencies.split(",") || [],
          assistance_dql: combo.assistance_dql
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
          dependencies: combo.dependencies && combo.dependencies.split(",") || [],
          assistance_java: combo.assistance_java
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
    }
  };
  return DctmwDataSourceUtils.mixin(ComboDataSourceUtils);
});