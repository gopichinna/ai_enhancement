/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "csui/utils/contexts/factories/connector", "csui/utils/contexts/page/page.context", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/converters/servercolumns", "d2/utils/server.query.utils", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/utils", "i18n!d2/widgets/advanced.search.results/nls/lang" ], function(_, $, Url, ConnectorFactory, PageContext, RestResources, RestLinkrels, nodeConverter, serverColumnsConverter, serverQueryUtils, constants, widgetConstants, utils, lang) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          this.options = this.options || {};
          this.widgetType = widgetConstants.D2.DOCLIST;
          return this;
        },
        getSearchQuery: function(model) {
          var qParams = {};
          var currRepo = RestResources.getCurrentRepository();
          var url = RestLinkrels.getLink(currRepo.get("links"), RestLinkrels.D2_SAVED_SEARCH);
          url = Url.combine(url, this.advSearchId, "results");
          if (model?.savedSearchModel && model?.savedSearchModel.has("parent_id")) {
            qParams["parent-id"] = model.savedSearchModel.get("parent_id");
          }
          url = Url.appendQuery(url, Url.combineQueryString(qParams));
          return serverQueryUtils.appendQueryParams(url, {});
        },
        getQueryFormQuery: function() {
          var qParams = {};
          var currRepo = RestResources.getCurrentRepository();
          var url = RestLinkrels.getLink(currRepo.get("links"), RestLinkrels.D2_SAVED_SEARCH);
          url = Url.combine(url, "query-forms", this.advSearchId, "results");
          if (this.parent_id) {
            qParams["parent-id"] = this.parent_id;
          }
          url = Url.appendQuery(url, Url.combineQueryString(qParams));
          return serverQueryUtils.appendQueryParams(url, {});
        },
        sync: function(method, model, options) {
          var isQueryFormSearch = model.isQueryFormSearch;
          var context = new PageContext();
          this.trigger("request", model, {}, options);
          var me = this, deferred = $.Deferred(), w = RestResources.getCurrentUser().get("defaultWidgets");
          this.widgetName = w[widgetConstants.DEFAULT.SEARCH] || "";
          this.options.widgetName = this.widgetName;
          var connector = context.getObject(ConnectorFactory);
          var facetData = model.searchResultsCollection.getFacetConstraintQuery();
          const queryFormData = _.clone(model.queryformdata);
          var postbody = {};
          if (isQueryFormSearch) {
            if (!_.isEmpty(facetData)) {
              postbody["expression-set"] = facetData["expression-set"];
            }
            if (queryFormData) {
              Object.entries(queryFormData).forEach(([ formKey, formValue ]) => {
                if (!Array.isArray(formValue) && _.isObject(formValue)) {
                  queryFormData[formKey] = formValue.id;
                }
                if (Array.isArray(formValue)) {
                  queryFormData[formKey] = _.isObject(queryFormData[formKey][0]) ? formValue.map(formData => formData.id) : queryFormData[formKey];
                }
              });
              postbody["properties"] = queryFormData;
            }
          } else {
            postbody = facetData;
          }
          if (me.isLastSearch === true) {
            if (me.searchMetadataFetched === true && !postbody["expression-set"]) {
              postbody["clear-facet-expression-set"] = true;
            }
          } else if (me.savedSearchModel && me.savedSearchModel.get("name") === "lastSearch" && !postbody["expression-set"]) {
            postbody["clear-facet-expression-set"] = true;
          }
          $.ajax(connector.extendAjaxOptions({
            url: isQueryFormSearch ? this.getQueryFormQuery() : this.getSearchQuery(model),
            type: "POST",
            data: JSON.stringify(postbody),
            headers: {
              "Content-Type": constants.MediaTypes.DCTM_JSON
            },
            success: function(response) {
              model.searchResultsCollection.fromMetdataData = true;
              model.searchResultsCollection.response = response;
              delete model.parent_id;
              options.success.call(options.context, response, "success", {});
              var fetchOptions = _.pick(options, "addnlOptions");
              model.searchResultsCollection.fetch(fetchOptions);
              me.searchMetadataFetched = true;
              deferred.resolve(response);
            },
            error: function(error) {
              model.searchResultsCollection.trigger("error", model, {}, error.responseJSON);
              options.error && options.error.call(options.context, model, error, {});
              deferred.reject(error);
            }
          }));
          return deferred.promise();
        },
        parse: function(response) {
          var columns = response["column-preference"].columns;
          var columnsArr = [];
          var seq = 10;
          var ignoreColumnKeys = [];
          if (!utils.isMobile()) {
            ignoreColumnKeys = [ "object_name" ];
          }
          columns.forEach(function(col) {
            if (ignoreColumnKeys.indexOf(col["name"]) < 0) {
              serverColumnsConverter.setColumnType(col, col["displaytype"] || col["type"]);
              var columnsObj = {};
              var colLabel = col["label"];
              var name = col["name"];
              var colKey = nodeConverter.getServerClientAttrNameMap()[name] || name;
              columnsObj["name"] = colLabel;
              columnsObj["key"] = colKey;
              columnsObj["column_key"] = colKey;
              columnsObj["column_type"] = col["type_name"].toLowerCase();
              columnsObj["search_index"] = colKey;
              columnsObj["sequence"] = seq;
              columnsArr.push(columnsObj);
              seq = seq + 10;
            }
          });
          columnsArr.push({
            column_key: "score",
            key: "score",
            column_name: lang.ranking,
            column_type: 6,
            sequence: seq
          });
          return columnsArr;
        }
      });
    }
  };
});