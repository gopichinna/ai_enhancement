/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "i18n!d2/commands/nls/localized.strings", "d2/widgets/metadata/panels/metadata.base.view", "d2/widgets/metadata/panels/locations/metadata.locations.model", "d2/widgets/metadata/panels/locations/metadata.locations.command", "d2/widgets/metadata/panels/locations/metadata.locations.toolbaritems", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/rest.resources", "d2/controls/tab.panel/metadata.export.view", "csui/controls/form/pub.sub", "css!d2/widgets/metadata/panels/locations/impl/metadata.locations.view" ], function(module, $, _, lang, MetadataBaseTableView, MetadataLocationCollection, commands, toolbarItems, constants, widgetConstants, RestResources, MetadataexportView, PubSub) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30,
    defaultPageSizes: [ 30, 50, 100 ]
  });
  return MetadataBaseTableView.extend({
    constructor: function MetadataLocationsTableView(options) {
      _.defaults(options, {
        collectionClass: MetadataLocationCollection,
        commands: commands,
        pageSize: config.defaultPageSize,
        ddItemsList: config.defaultPageSizes,
        toolbarItems: toolbarItems,
        isLocationsTable: true,
        selectColumn: true,
        showInlineActionBarOnHover: !module.config().accessibleTable,
        forceInlineActionBarOnClick: false,
        inlineActionBarStyle: "csui-table-actionbar-bubble"
      });
      MetadataLocationsTableView.__super__.constructor.call(this, options);
    },
    onRender: function() {
      MetadataBaseTableView.prototype.onRender.apply(this, arguments);
      this.$el.addClass("locations-wg");
      this.listenTo(this.tableView, "render", () => {
        PubSub.trigger("adjust:breadcrumb");
        this._createsettingModeView(this.options);
      });
    },
    _createsettingModeView: function(options) {
      options = _.extend({
        parentView: this,
        collection: this.collection,
        blockingParentView: this.options.blockingParentView
      }, options);
      this.exportModeView = new MetadataexportView(options);
      this.exportModeView.render();
      const metadataPanelModel = options.metadataView.metadataTabView.tabContent.collection.findWhere({
        title: lang.PanelNameLocations
      });
      $("#" + metadataPanelModel.changed.uniqueTabId).prepend(this.exportModeView.el);
    }
  }, {
    enabled: function(options) {
      if (options.node.get("isChildViewOfParent")) {
        return false;
      }
      if (options.node.get("type") === constants.DocumentLinkType.RELATION) {
        return false;
      }
      var w = RestResources.getCurrentUser().get("defaultWidgets");
      return w && w[widgetConstants.DEFAULT.LOCATIONS] && options.node.get("type") !== constants.Types.TASK;
    }
  });
});