/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/server.adaptors/converters/node", "d2/utils/server.query.utils", "d2/utils/constants", "d2/utils/widget.constants", "i18n!d2/widgets/search.results/nls/lang", "csui/utils/contexts/factories/connector", "csui/utils/contexts/page/page.context" ], function(_, $, Backbone, RestResources, RestLinkrels, NodeConverter, serverQueryUtils, constants, widgetConstants, lang, ConnectorFactory, PageContext) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          this.options = this.options || {};
          this.widgetType = widgetConstants.D2.DOCLIST;
          return this;
        },
        sync: function(method, model, options) {
          var me = this, deferred = $.Deferred(), w = RestResources.getCurrentUser().get("defaultWidgets");
          this.widgetName = w[widgetConstants.DEFAULT.SEARCH] || "";
          this.options.widgetName = this.widgetName;
          if (!me.clientColumns || me.clientColumns.length === 0) {
            var context = new PageContext();
            serverQueryUtils.fetchColumnPreferences({
              scope: this,
              widgetType: this.widgetType,
              widgetName: this.widgetName,
              defaultType: constants.ColTypes.DEFAULT,
              connector: context.getObject(ConnectorFactory)
            }).done(function(clientCols) {
              me.clientColumns = clientCols;
              options.success.call(options.context, clientCols, "success", {});
              deferred.resolve();
            }).fail(function(err) {
              deferred.reject(err);
            });
            return deferred.promise();
          } else {
            options.success.call(options.context, me.clientColumns, "success", {});
          }
        },
        parse: function(columns) {
          var columnsArr = [];
          var seq = 10;
          var ignoreColumnKeys = [ "type", "reserved", "favorite", "name", "d2_external_share" ];
          columns.forEach(function(data) {
            var columnsObj = {};
            if (ignoreColumnKeys.indexOf(data["column_key"]) < 0) {
              var key = data["key_with_type"] || data["key"];
              columnsObj["key"] = key;
              columnsObj["column_key"] = key;
              columnsObj["name"] = data["name"];
              columnsObj["column_type"] = data["type_name"].toLowerCase();
              columnsObj["search_index"] = key;
              columnsObj["sequence"] = seq;
              columnsArr.push(columnsObj);
              seq = seq + 10;
            }
          });
          columnsArr.push({
            column_key: "score",
            key: "score",
            column_name: lang.columnTitleRanking,
            column_type: 6,
            sequence: seq
          });
          return columnsArr;
        }
      });
    }
  };
});