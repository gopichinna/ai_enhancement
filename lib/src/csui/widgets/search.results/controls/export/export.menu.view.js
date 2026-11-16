/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/url", "csui/utils/node.links/node.links", "i18n!csui/widgets/search.results/controls/export/impl/nls/localized.strings", "hbs!csui/widgets/search.results/controls/export/impl/export.menu", "csui/lib/binf/js/binf" ], function(module, _, Backbone, Marionette, Url, NodeLinks, lang, template) {
  var config = _.extend({
    exportSizeLimit: 100,
    nameSuffix: "_export",
    csvFileExt: ".csv",
    jsonFileExt: ".txt"
  }, module.config());
  var SearchExportView = Marionette.ItemView.extend({
    className: "cs-export-links",
    template: template,
    templateHelpers: function() {
      return {
        exportCSV: lang.exportCSV,
        exportJSON: lang.exportJSON,
        title: lang.exportTitle,
        exportButtonAria: lang.exportButtonAria,
        listAria: lang.listAria
      };
    },
    ui: {
      toggle: ">.csui-search-export-options>.binf-dropdown-toggle",
      exportBtn: "a.search-export-btn"
    },
    events: {
      "click .export-csv": "onExportCSV",
      "click .export-json": "onExportJSON"
    },
    onRender: function() {
      this.ui.toggle.binf_dropdown();
      this.ui.exportBtn.show();
    },
    onExportJSON: function(event) {
      this._exportData(event, config.jsonFileExt, "text/plain", false);
    },
    onExportCSV: function(event) {
      this._exportData(event, config.csvFileExt, "text/csv", true);
    },
    _exportData: function(event, fileExt, contentType, isCSV) {
      this.trigger("export:status", true);
      event.preventDefault();
      event.stopPropagation();
      this.ui.toggle.binf_dropdown("toggle");
      let dataExport = "", arrayItem, usedColumnKeys, urlOptions = {
        context: this.context
      }, self = this;
      const sortedColumns = _.sortBy(self.collection.columns.models, column => {
        if (!!column) {
          return column.get("definitions_order");
        }
      });
      let exportCollection = this.collection.clone();
      exportCollection.cacheId = this.collection.cacheId;
      const filename = exportCollection.options.query.get("where") + config.nameSuffix + fileExt;
      exportCollection.setLimit(0, config.exportSizeLimit, false);
      exportCollection.fetch().then(function() {
        self.trigger("export:status", false);
        if (isCSV) {
          usedColumnKeys = [];
          for (let i = 0; i < sortedColumns.length; i++) {
            if (!!sortedColumns[i].get("name")) {
              dataExport += sortedColumns[i].get("name") + ",";
              usedColumnKeys.push(sortedColumns[i].get("column_key"));
            }
          }
          dataExport += "\n";
          for (let j = 0; j < exportCollection.models.length; j++) {
            let rowData = exportCollection.models[j];
            for (let i = 0; i < usedColumnKeys.length; i++) {
              if (rowData.get(usedColumnKeys[i]) !== undefined) {
                if (usedColumnKeys[i] === "OTLocation") {
                  dataExport += NodeLinks.getUrl(rowData.parent, urlOptions) + ",";
                } else {
                  dataExport += !!rowData.get(usedColumnKeys[i] + "_formatted") ? rowData.get(usedColumnKeys[i] + "_formatted") + "," : !!rowData.get(usedColumnKeys[i]) ? rowData.get(usedColumnKeys[i]) + "," : ",";
                }
              } else {
                dataExport += ",";
              }
            }
            dataExport += "\n";
          }
        } else {
          usedColumnKeys = {};
          for (let i = 0; i < sortedColumns.length; i++) {
            if (!!sortedColumns[i].get("name")) {
              usedColumnKeys[sortedColumns[i].get("column_key")] = sortedColumns[i].get("name");
            }
          }
          for (let j = 0; j < exportCollection.models.length; j++) {
            let rowData = exportCollection.models[j];
            arrayItem = {};
            Object.keys(usedColumnKeys).forEach(key => {
              if (key === "OTLocation") {
                arrayItem[usedColumnKeys[key]] = NodeLinks.getUrl(rowData.parent, urlOptions);
              } else {
                arrayItem[usedColumnKeys[key]] = rowData.get(key) || "";
              }
            });
            dataExport += JSON.stringify(arrayItem);
          }
          dataExport = "[" + dataExport + "]";
        }
        const blob = new Blob([ dataExport ], {
          type: contentType
        });
        const link = window.URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.setAttribute("href", link);
        a.setAttribute("download", filename);
        a.click();
      });
    }
  });
  return SearchExportView;
});