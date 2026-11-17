/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/controls/dialog/dialog.view", "d2/dialogs/single.selection.tree/impl/single.select.view", "i18n!d2/dialogs/single.selection.tree/impl/nls/lang" ], function($, _, Backbone, DialogView, SingleSelectView, lang) {
  "use strict";
  function SingleSelectTree(options) {
    options = options || {};
    if (!options.data) {
      throw new Error("Data is mandatory in the constructor options");
    }
    this.options = options;
  }
  _.extend(SingleSelectTree.prototype, Backbone.Events, {
    show: function() {
      this._deferred = $.Deferred();
      this._showDialog();
      return this._deferred.promise();
    },
    _showDialog: function() {
      this._createSelectView();
      this._createDialog();
      this._dialog.show();
      this.listenTo(this._selectView, "d2:update:select:button", this._updateSelectButton.bind(this));
    },
    _createSelectView: function() {
      this._selectView = new SingleSelectView(_.extend({}, this.options));
    },
    _createDialog: function() {
      this._dialog = new DialogView({
        title: this.options.dialogTitle || lang.dialogTitle,
        view: this._selectView,
        className: "d2-single-select-tree",
        midSize: true,
        buttons: [ {
          id: "select",
          label: lang.selectButtonLabel,
          default: true,
          disabled: true,
          click: this._addSelection.bind(this),
          close: true
        }, {
          id: "cancel",
          label: lang.cancelButtonLabel,
          close: true
        } ]
      });
      this._dialog.listenTo(this._dialog, "hide", _.bind(this._onHideDialog, this));
    },
    _updateSelectButton: function(enable) {
      var footerView = this._dialog.footerView, buttonModel = footerView.collection.get("select"), buttonView = footerView.children.findByModel(buttonModel);
      if (enable) {
        buttonView.$el.removeAttr("disabled");
      } else {
        buttonView.$el.attr("disabled", true);
      }
    },
    _addSelection: function() {
      this.selectedNode = this._selectView.selectedNode;
    },
    _onHideDialog: function() {
      this.selectedNode ? this._deferred.resolve(this.selectedNode) : this._deferred.reject({
        cancelled: true
      });
    }
  });
  return SingleSelectTree;
});