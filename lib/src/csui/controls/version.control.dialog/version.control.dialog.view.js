/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/controls/dialog/dialog.view", "csui/controls/version.control.dialog/impl/version.control.dialog.header.view", "css!csui/controls/version.control.dialog/impl/version.control.dialog" ], function(_, $, Backbone, DialogView, VersionControlHeaderView) {
  "use strict";
  function VersionControlDialog(options) {
    this.options = options || {};
    this.deferred = $.Deferred();
    this.deferred.then(_.bind(this.destroy, this), _.bind(this.destroy, this));
  }
  _.extend(VersionControlDialog.prototype, Backbone.Events, {
    destroy: function() {
      this.options._view && this.options._view.destroy();
      this.options._view && this.options._view.off();
      this._dialog.destroy();
    },
    show: function() {
      this._dialog = this._createDialog();
      return this.deferred;
    },
    _createDialog: function() {
      var options = this.options, self = this, headerView = new VersionControlHeaderView(options), dialog = new DialogView({
        headerView: headerView,
        midSize: true,
        title: options.title,
        view: options._view,
        className: "csui-version-control-dialog ",
        attributes: {
          "data-backdrop": "static"
        },
        buttons: [ {
          id: "add",
          label: options.actionBtnLabel,
          default: true,
          click: function() {
            dialog.destroy();
            self._resolutionComplete(options._view && options._view.getValue());
          }
        }, {
          id: "cancel",
          close: true,
          label: options.cancelBtnLabel,
          click: function() {
            dialog.destroy();
            self.cancel();
          }
        } ],
        dialogTxtAria: options.title
      });
      dialog.on("hide", function() {
        dialog.off();
        this.cancel();
      }, this);
      dialog.show();
      dialog.$el.find(".binf-modal-dialog").attr("aria-describedby", options._view.warningMessageId);
      return dialog;
    },
    cancel: function() {
      this.deferred.reject();
      return true;
    },
    _resolutionComplete: function(result) {
      this.deferred.resolve(result);
      return true;
    }
  });
  return VersionControlDialog;
});