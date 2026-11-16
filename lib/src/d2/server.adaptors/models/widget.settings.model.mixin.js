/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery" ], function(require, _, $) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          options || (options = {});
          return this;
        },
        sync: function(method, model, options) {
          options || (options = {});
          const deferred = $.Deferred();
          switch (method) {
           case "read":
            deferred.reject(new Error(`Cannot get widget settings for one widget only`));
            break;

           case "create":
           case "update":
            this.updateTableSettings(method, model, options).then(() => {
              deferred.resolve();
            });
            break;

           case "patch":
            {
              deferred.resolve(model);
              break;
            }

           default:
            deferred.reject(new Error(`unknown method ${method} specified`));
          }
          return deferred.promise();
        },
        updateTableSettings: function() {
          var dfd = $.Deferred(), colPref = this.colPref, self = this;
          require([ "d2/utils/widgets.utils", "d2/server.adaptors/converters/servercolumns" ], function(widgetUtils, serverColumns) {
            var columns = self.get("columns");
            if (columns && colPref) {
              var colNameClientServerMap = serverColumns.getColumnConverter(colPref.get("colType")).getClientServerAttrNameMap();
              _.each(_.keys(columns), function(colName) {
                var d2svColWidth = columns[colName].width, matchingCol = colPref.columns.find(function(col) {
                  return col.get("name") === colName || col.get("name") === colNameClientServerMap[colName];
                });
                matchingCol.set("d2sv_width", Math.round(d2svColWidth));
              });
            }
            var widgetState = widgetUtils.getServerWidgetState(self);
            if (colPref) {
              colPref.set("d2sv_widget_state", widgetState);
              colPref.save().done(dfd.resolve).fail(dfd.reject);
            } else {
              var preferencesStorageId = self.get("preferencesStorageId");
              if (columns) {
                widgetState["column_width_customization"] = columns;
              }
              widgetUtils.saveWidgetStateInLocalStorage(widgetState, preferencesStorageId);
            }
          });
          return dfd.promise();
        }
      });
    }
  };
});