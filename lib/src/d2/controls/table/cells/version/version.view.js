/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "csui/controls/table/cells/cell/cell.view", "csui/controls/table/cells/cell.registry", "nuc/models/nodes", "csui/utils/commands", "csui/utils/commandhelper", "i18n!csui/widgets/metadata/impl/nls/lang", "d2/utils/node.version.utils", "hbs!d2/controls/table/cells/version/impl/version.view", "css!d2/controls/table/cells/version/impl/version.view" ], function(_, Backbone, CellView, cellViewRegistry, NodeCollection, commands, CommandHelper, csuiMetaPanelsLang, versionUtil, template) {
  "use strict";
  var D2VersionNumberCellView = CellView.extend({
    template: template,
    className: "csui-nowrap",
    needsAriaLabel: true,
    constructor: function D2VersionNumberCellView() {
      CellView.prototype.constructor.apply(this, arguments);
      var model = this.model, containerNode = model.collection && model.collection.node;
      this.commandStatus = {
        collection: model.collection,
        container: containerNode && containerNode.get("container") === true ? containerNode : null,
        context: this.options.context,
        nodes: new NodeCollection([ model ]),
        selectedTab: new Backbone.Model({
          title: csuiMetaPanelsLang.versions
        }),
        suppressSuccessMessage: true,
        suppressFailMessage: true
      };
      this.command = commands.get("Properties");
      this.isCommandActive = this.command && this.command.enabled(this.commandStatus);
    },
    renderValue: function() {
      var tmplData = {
        data: this.options.column ? CellView.getValue(this.model, this.options.column) : "",
        title: this.getValueText(),
        isCurrentVersion: versionUtil.isCurrentVersion(this.model, this.options.column ? this.options.column.name : "d2_version_label"),
        isActive: this.isCommandActive
      };
      var html = "";
      if (!_.isEmpty(tmplData.data)) {
        tmplData.data = "" + tmplData.data;
        html = this.template(tmplData);
      }
      this.$el.html(html);
      this.uiVersionContaner = this.$el.find(".d2-cell-version-container");
      var eventName = "keyup." + this.cid;
      this.$el.off(eventName).on(eventName, function(event) {
        if (event.keyCode === 13) {
          event.preventDefault();
          event.stopPropagation();
          this.openPropertiesView();
        }
      }.bind(this));
    },
    _attachClickHandler: function() {
      var self = this;
      this.uiVersionContaner && this.uiVersionContaner.on("click." + this.cid, function(event) {
        self.triggerMethod("clicked:cell", event);
      });
    },
    _detachClickHandler: function() {
      this.uiVersionContaner && this.uiVersionContaner.off("click." + this.cid);
    },
    onClickedCell: function() {
      if (!this.options.tableView.collection.isTargetBrowse) {
        this.openPropertiesView();
      }
    },
    openPropertiesView: function() {
      if (this.isCommandActive) {
        this.ensureOriginatingView();
        var oView = this.commandStatus.originatingView;
        oView && oView.blockActions();
        CommandHelper.handleExecutionResults(this.command.execute(this.commandStatus), {
          command: this.command,
          suppressSuccessMessage: this.commandStatus.suppressSuccessMessage,
          suppressFailMessage: this.commandStatus.suppressFailMessage
        }).always(function() {
          oView && oView.unblockActions();
        }.bind(this));
      }
    },
    ensureOriginatingView: function() {
      if (!this.commandStatus.originatingView) {
        this.commandStatus.originatingView = this.options.tableView && this.options.tableView.options && this.options.tableView.options.originatingView;
      }
    }
  }, {
    hasFixedWidth: false,
    columnClassName: "d2-table-cell-version_number"
  });
  cellViewRegistry.registerByColumnKey("d2_version_label", D2VersionNumberCellView);
  return D2VersionNumberCellView;
});