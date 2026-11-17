/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "i18n!d2/commands/nls/localized.strings", "d2/widgets/metadata/panels/metadata.base.view", "d2/widgets/metadata/panels/audit/metadata.audit.collection", "d2/widgets/metadata/panels/audit/metadata.audit.command", "d2/widgets/metadata/panels/audit/metadata.audit.toolbaritems", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/rest.resources", "d2/controls/tab.panel/metadata.setting.view", "d2/controls/tab.panel/metadata.export.view", "css!d2/widgets/metadata/panels/audit/impl/metadata.audit.view" ], function(module, $, _, lang, MetadataBaseTableView, MetadataAuditCollection, commands, toolbarItems, constants, widgetConstants, RestResources, MetadatasettingView, MetadataexportView) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30,
    defaultPageSizes: [ 30, 50, 100 ]
  });
  return MetadataBaseTableView.extend({
    constructor: function MetadataAuditTableView(options) {
      _.defaults(options, {
        collectionClass: MetadataAuditCollection,
        commands: commands,
        pageSize: config.defaultPageSize,
        ddItemsList: config.defaultPageSizes,
        toolbarItems: toolbarItems,
        isLocationsTable: true,
        selectColumn: false
      });
      MetadataAuditTableView.__super__.constructor.call(this, options);
    },
    onRender: function() {
      MetadataBaseTableView.prototype.onRender.apply(this, arguments);
      this.listenTo(this.tableView, "render", () => {
        this.$el.addClass("d2-audit-wdg");
        this.options && this.options.metadataView && this.options.metadataView._parentLayoutView() && this.options.metadataView._parentLayoutView().collection && this.options.metadataView._parentLayoutView().collection.each(function(node) {
          node.set({
            csuiIsSelected: false
          }, {
            silent: true
          });
        });
        this._createsettingModeView(this.options);
      });
    },
    _createsettingModeView: function(options) {
      options = _.extend({
        parentView: this,
        collection: this.collection,
        blockingParentView: this.options.blockingParentView
      }, options);
      this.settingModeView = new MetadatasettingView(options);
      this.exportModeView = new MetadataexportView(options);
      this.settingModeView.render();
      this.exportModeView.render();
      const metadataPanelModel = options.metadataView?.metadataTabView.tabContent.collection.findWhere({
        title: lang.PanelNameAudits
      });
      if (metadataPanelModel && $(".d2-icon-audit-wg").length === 0) {
        $("#" + metadataPanelModel.changed.uniqueTabId).prepend(this.settingModeView.el);
        $("#" + metadataPanelModel.changed.uniqueTabId).prepend(this.exportModeView.el);
      }
    }
  }, {
    enabled: function(options) {
      if (options.node.get("type") === constants.DocumentLinkType.RELATION) {
        return false;
      }
      var w = RestResources.getCurrentUser().get("defaultWidgets");
      return w && w[widgetConstants.DEFAULT.AUDIT];
    }
  });
});