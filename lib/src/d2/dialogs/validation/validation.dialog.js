/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/controls/dialog/dialog.view", "csui/controls/progressblocker/blocker", "csui/controls/form/pub.sub", "dctmw/utils/utils", "d2/dialogs/validation/failed.nodes.view", "d2/dialogs/validation/validation.header.view", "i18n!d2/dialogs/validation/impl/nls/lang", "css!d2/dialogs/validation/impl/validation.dialog.css" ], function($, _, Marionette, DialogView, BlockingView, PubSub, utils, FailedNodesView, DialogHeaderView, lang) {
  "use strict";
  function ValidationDialog(options) {
    this.options = options || {};
    this.deferred = $.Deferred();
  }
  _.extend(ValidationDialog.prototype, {
    show: function() {
      var me = this;
      me.validateDocuments(this.options).done(function(errorNodes, validDocuments) {
        if (errorNodes.length > 0) {
          if (me.options.originatingView) {
            _.isFunction(me.options.originatingView.unblockActions) && me.options.originatingView.unblockActions();
          } else if (me.options.command && me.options.command._unblockActions) {
            me.options.command._unblockActions(me.options.status.originatingView);
          }
          me.options.errorNodes = errorNodes;
          me.options.validDocuments = validDocuments;
          me._dialog = me._createDialog(me.options);
          me._dialog.$el.addClass("dialog-hidden");
          me._dialog.listenToOnce(me._dialog, "after:show", me.onShown());
          me._dialog.show();
          me._dialog.on("hide", function() {
            me._dialog.off();
            me.close();
          }, me);
        } else {
          me.deferred.resolve(validDocuments);
        }
      }).fail(me.deferred.reject);
      return me.deferred;
    },
    onShown: function() {
      var me = this;
      var resizeFn = _.bind(me._doResize, me);
      $(window).on("resize", resizeFn);
      setTimeout(function() {
        resizeFn();
        me._dialog.$el.find(".binf-modal-footer button:visible").first().trigger("focus");
      }, 300);
    },
    _doResize: function() {
      var me = this;
      var extHeight = me._dialog.$el.find(".binf-modal-header").outerHeight(true) + me._dialog.$el.find(".binf-modal-footer").outerHeight(true);
      var height = me._dialog.$el.height() - extHeight;
      if (utils.isMobile()) {
        if (utils.isAppworks()) {
          height = height - ($(".csui-top-header").height() + 52);
        } else {
          height = height - ($(".csmob-app-header").height() + $(".csui-top-header").height() + 52);
        }
      } else {
        height = height - 60;
      }
      me._dialog.$el.find(".binf-modal-body").css("max-height", height + "px");
      var newHeight = me._dialog.$el.find(".binf-modal-content").outerHeight(true);
      var top;
      if (utils.isMobile()) {
        if (utils.isAppworks()) {
          top = me._dialog.$el.height() - 12;
        } else {
          top = me._dialog.$el.height() - ($(".csmob-app-header").height() + 12);
        }
        top = (top - newHeight) / 2;
        if (!utils.isAppworks()) {
          top = top + $(".csmob-app-header").height();
        }
        me._dialog.$el.find(".binf-modal-dialog").css("margin-top", top + "px");
        var elem = me._dialog.options.view.$el;
        if (Math.abs(elem[0].scrollHeight - elem.scrollTop() - elem.outerHeight()) >= 5) {
          elem.find(".error-items").addClass("fade-last-item");
        }
      } else {
        me._dialog.$el.find(".binf-modal-dialog").css("margin-top", (me._dialog.$el.height() - newHeight) / 2 + "px");
      }
      me._dialog.$el.find(".csui-perfect-scrolling").perfectScrollbar("update");
      me._dialog.$el.find("td.message > div").each(function() {
        if (me._dialog.scrollHeight <= 32) {
          $(me._dialog).find(".fadeout").hide();
        }
      });
      me._dialog.$el.removeClass("dialog-hidden");
    },
    validateDocuments: function() {
      throw new Error("Override this method");
    },
    getBodyMessage: function() {
      return lang.DefaultMessage;
    },
    getDialogTitle: function() {
      return lang.DefaultTitle;
    },
    _createDialog: function(options) {
      options = this.options;
      var hasNonErrorItems = options.validDocuments.length > 0, self = this, bodyMessage = self.getBodyMessage(options, hasNonErrorItems);
      var isMultiPck = options.multipck;
      var noValidDocuments = options.validDocuments.length === 0;
      var dialog = new DialogView({
        className: options.className ? "documents-validation-dialog " + options.className : "documents-validation-dialog",
        headerView: new DialogHeaderView({
          message: bodyMessage,
          title: self.getDialogTitle()
        }),
        buttons: [ {
          id: "continue",
          label: lang.ContinueButton,
          hidden: !hasNonErrorItems && !(isMultiPck && noValidDocuments),
          default: true,
          click: _.bind(self.onContinueButtonClick, self)
        }, {
          id: "cancel",
          label: lang.CancelButton,
          hidden: !hasNonErrorItems,
          close: true,
          click: _.bind(self.close, self)
        }, {
          id: "close",
          label: lang.CloseButton,
          hidden: hasNonErrorItems,
          default: true,
          close: true,
          click: _.bind(self.close, self)
        } ],
        view: new FailedNodesView({
          failedNodes: self.options.errorNodes,
          descMessage: bodyMessage
        })
      });
      return dialog;
    },
    onContinueButtonClick: function() {
      this._dialog.destroy();
      if (this.options.originatingView) {
        _.isFunction(this.options.originatingView.blockActions) && this.options.originatingView.blockActions();
      } else if (this.options.command && this.options.command._blockActions) {
        this.options.command._blockActions(this.options.status.originatingView);
      }
      this.deferred.resolve(this.options.validDocuments);
    },
    close: function() {
      this._dialog.destroy();
      this.deferred.reject("close");
    },
    _getValidAndErrorDocuments: function(nodeModels, response) {
      var errorItem = {}, errorDocuments = [], validDocuments = [];
      _.each(nodeModels, function(model) {
        var errorEntry = _.find(response.entries, function(entry) {
          return model.get("id") === entry.content["r_object_id"];
        });
        if (errorEntry && errorEntry.content["rest-errors"]) {
          errorItem = {
            id: model.get("id"),
            name: model.get("name"),
            node: model,
            status: errorEntry.content.status,
            errorMessages: errorEntry.content["rest-errors"],
            links: errorEntry.content["links"] || []
          };
          errorDocuments.push(errorItem);
        } else {
          validDocuments.push(model);
        }
      });
      return {
        errorDocuments: errorDocuments,
        validDocuments: validDocuments
      };
    }
  });
  return ValidationDialog;
});