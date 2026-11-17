/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "d2/dialogs/target.browse/target.browse", "d2/dialogs/target.browse/impl/footer/footer.view", "i18n!d2/dialogs/target.browse/impl/nls/lang" ], function($, _, TargetBrowse, FooterView, lang) {
  "use strict";
  var TargetBrowseCompare = function(options) {
    TargetBrowse.prototype.constructor.call(this, options);
  };
  _.extend(TargetBrowseCompare.prototype, TargetBrowse.prototype, {
    _createFooterViewControl: function() {
      var options = this.options;
      var footerView = new FooterView({
        isMultiSelectEnabled: this.options.commandType.multiSelect,
        searchView: this.options.searchView,
        buttons: [ {
          id: "compare-text",
          label: options.compareTextButtonLabel,
          disabled: true,
          default: false,
          click: _.bind(this.onClickTextCompareButton, this)
        }, {
          id: "compare-graphical",
          label: options.compareGraphicalButtonLabel,
          disabled: true,
          default: false,
          click: _.bind(this.onClickGraphicalCompareButton, this)
        }, {
          id: "cancel",
          label: lang.cancelButtonLabel,
          close: true,
          click: _.bind(this.onClickCancelButton, this)
        } ]
      });
      footerView.on("hide:dropdown", this.onClickHideEvent, this);
      return footerView;
    },
    onClickTextCompareButton: function() {
      this.setResultAndCloseDialog("compare-text");
    },
    onClickGraphicalCompareButton: function() {
      this.setResultAndCloseDialog("compare-graphical");
    },
    setResultAndCloseDialog: function(clickedButtonId) {
      if (this && this._view && this._view.getSelection().length > 0) {
        var nodes = this._view.getSelection();
        this._result = {
          nodes: nodes,
          buttonId: clickedButtonId
        };
        this._dialog.destroy();
      } else {
        this._dialog.updateButton("compare-text", {
          disabled: true
        });
        this._dialog.updateButton("compare-graphical", {
          disabled: true
        });
      }
    },
    onSelectionChange: function(selection) {
      if (this.options.onSelectionChange) {
        this.options.onSelectionChange({
          dialog: this._dialog,
          selection: selection
        });
      }
    },
    onCollectionUpdated: function(collection) {
      var selectedNode = collection.findWhere({
        id: this.options.nodeModel.get("id")
      });
      selectedNode && collection.remove([ selectedNode ]);
      TargetBrowse.prototype.onCollectionUpdated.apply(this, arguments);
    },
    disableAddButton: function() {
      this._dialog.updateButton("compare-text", {
        disabled: true
      });
      this._dialog.updateButton("compare-graphical", {
        disabled: true
      });
    }
  });
  return TargetBrowseCompare;
});