/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/commands", "csui/utils/commandhelper", "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "d2/controls/globalmessage/globalmessage", "hbs!d2/controls/table/cells/external.share/impl/external.share.view", "i18n!d2/controls/table/cells/external.share/impl/nls/lang", "css!d2/controls/table/cells/external.share/impl/external.share.view" ], function($, _, Backbone, commands, CommandHelper, TemplatedCellView, cellViewRegistry, GlobalMessage, template, lang) {
  "use strict";
  var ShareToCoreManageCommand = "D2-ShareToCoreManage";
  var D2ExternalShareCellView = TemplatedCellView.extend({
    template: template,
    getValueData: function() {
      var data = {
        externalShare: this.model.get("externalShare"),
        externalSharetitle: lang.externalsharetitle
      };
      return data;
    },
    renderValue: function() {
      TemplatedCellView.prototype.renderValue.apply(this, arguments);
      var eventName = "keyup." + this.cid;
      if (this.isShared()) {
        this.$el.off(eventName).on(eventName, function(event) {
          if (event.keyCode === 32 || event.keyCode === 13) {
            event.preventDefault();
            event.stopPropagation();
            this.openManageShareCommand();
          }
        }.bind(this));
      } else {
        this.$el.off(eventName);
      }
    },
    onClickedCell: function() {
      if (this.isShared()) {
        this.openManageShareCommand();
      }
    },
    isShared: function() {
      var externalShareConfig = this.model.get("externalShare");
      return !!(externalShareConfig && externalShareConfig.core);
    },
    refreshNodeForActions: function() {
      var dfd = $.Deferred(), node = CommandHelper.getJustOneNode(this.status), widgetConfig = {};
      if (node.actions && node.actions.findWhere({
        signature: ShareToCoreManageCommand
      })) {
        dfd.resolve();
      } else {
        if (this.status.collection && this.status.collection.options) {
          widgetConfig.widgetType = this.status.collection.widgetType;
          widgetConfig.widgetName = this.status.collection.options.widgetName;
          widgetConfig.isDisableLocationColumn = this.status.collection.options.isDisableLocationColumn;
        }
        CommandHelper.refreshNode(node, widgetConfig).done(function() {
          dfd.resolve();
        }).fail(function(error) {
          dfd.reject(error);
        });
      }
      return dfd.promise();
    },
    refreshStatusObject: function() {
      if (this.model && this.options && this.options.tableView && this.options.tableView.options) {
        var tableView = this.options.tableView, tableViewOptions = tableView.options;
        this.status = {
          collection: tableView.collection,
          context: tableView.context,
          nodes: new Backbone.Collection([ this.model ]),
          originatingView: tableViewOptions.originatingView
        };
      }
    },
    openManageShareCommand: function() {
      var self = this;
      this.refreshStatusObject();
      this.refreshNodeForActions().done(function() {
        self.executeManageShareCommand();
      });
    },
    executeManageShareCommand: function() {
      var command = commands.get(ShareToCoreManageCommand);
      if (command.enabled(this.status)) {
        command.execute(this.status, {});
      } else {
        GlobalMessage.showMessage("error", lang.manageShareIsNotEnabled);
      }
    }
  }, {
    hasFixedWidth: true,
    columnClassName: "d2-table-cell-shared"
  });
  cellViewRegistry.registerByColumnKey("d2_external_share", D2ExternalShareCellView);
  return D2ExternalShareCellView;
});