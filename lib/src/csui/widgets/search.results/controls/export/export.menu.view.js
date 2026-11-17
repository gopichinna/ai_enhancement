/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/url", "csui/utils/node.links/node.links", "smart/themes/theming", "csui/controls/otc.menu/menu.items.view", "csui/controls/globalmessage/globalmessage", "i18n!csui/widgets/search.results/controls/export/impl/nls/localized.strings", "hbs!csui/widgets/search.results/controls/export/impl/export.menu", "csui/lib/binf/js/binf" ], function(module, _, Backbone, Marionette, Url, NodeLinks, theming, MenuItemsView, GlobalMessage, lang, template) {
  var SearchExportView = Marionette.LayoutView.extend({
    className: "cs-export-links",
    template: template,
    templateHelpers: function() {
      return {
        isJatoTheme: theming.isJATOTheme(),
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
      "click #export-csv": "onExportCSV",
      "click #export-json": "onExportJSON"
    },
    regions: {
      selectedMenuRegion: ".csui-search-export-options>otc-menu"
    },
    onRender: function() {
      this.ui.toggle.binf_dropdown();
      this.ui.exportBtn.show();
      this.exportMenuSelectGroupView = new MenuItemsView({
        collection: new Backbone.Collection([ {
          displayName: lang.exportCSV,
          id: "export-csv"
        }, {
          displayName: lang.exportJSON,
          id: "export-json"
        } ]),
        childElm: "otc-menuitem"
      });
      this.selectedMenuRegion.show(this.exportMenuSelectGroupView);
    },
    onExportJSON: function(event) {
      this._exportData(event, "json");
    },
    onExportCSV: function(event) {
      this._exportData(event, "csv");
    },
    _exportData: function(event, exportType) {
      this.trigger("export:status", true);
      event.preventDefault();
      event.stopPropagation();
      this.ui.toggle.binf_dropdown("toggle");
      let exportCollection = this.collection;
      let baseUrl = new Url(exportCollection.connector.connection.url).getApiBase("v2");
      let options = {
        url: Url.combine(baseUrl, "searchexport"),
        method: "POST",
        contentType: "application/x-www-form-urlencoded",
        data: {
          exporttype: exportType,
          where: exportCollection.options.query.get("where"),
          location_id1: exportCollection.options.query.get("location_id1"),
          cache_id: exportCollection.cacheId
        }
      };
      let self = this;
      exportCollection.connector.makeAjaxCall(options).done(function(data) {
        GlobalMessage.showMessage("success", lang.exportSuccessTitle, lang.exportSuccessMessage);
      }).fail(function(error) {
        GlobalMessage.showMessage("error", lang.exportErrorTitle, error.responseJSON.error);
      }).always(function() {
        self.trigger("export:status", false);
      });
    }
  });
  return SearchExportView;
});