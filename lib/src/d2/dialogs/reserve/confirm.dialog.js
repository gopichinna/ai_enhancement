/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/controls/dialog/dialog.view", "csui/controls/progressblocker/blocker", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/dialogs/reserve/confirm.view", "hbs!d2/dialogs/reserve/impl/confirm.dialog.header", "i18n!d2/dialogs/reserve/impl/nls/lang", "css!d2/dialogs/reserve/impl/confirm.dialog.css" ], function($, _, Marionette, DialogView, BlockingView, PerfectScrollingBehavior, ConfirmView, headerTemplate, lang) {
  "use strict";
  var ConfirmDialogHeaderView = Marionette.ItemView.extend({
    className: "confirm-dialog-header",
    template: headerTemplate,
    templateHelpers: function() {
      return {
        title: this.title
      };
    },
    constructor: function ConfirmDialogHeaderView(options) {
      this.title = options.title || lang.DialogTitle;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  return DialogView.extend({
    events: _.extend(DialogView.prototype.events, {
      "click button": "onRemoveItem"
    }),
    behaviors: _.extend({}, DialogView.prototype.behaviors, {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".binf-modal-body",
        suppressScrollX: true
      }
    }),
    constructor: function ConfirmDialog(options) {
      options = options || {};
      var hasNonErrorItems = _.some(options.checkoutItems, function(item) {
        return item.status !== "ERROR";
      });
      options = _.extend(options, {
        className: "d2-reserve-confirm-dialog",
        headerView: new ConfirmDialogHeaderView({
          title: options.title
        }),
        buttons: [ {
          id: "continue",
          label: lang.ContinueButton,
          hidden: !hasNonErrorItems,
          default: true,
          click: _.bind(this.onContinueButtonClick, this)
        }, {
          id: "cancel",
          label: lang.CancelButton,
          hidden: !hasNonErrorItems,
          close: true,
          click: _.bind(this.close, this)
        }, {
          id: "close",
          label: lang.CloseButton,
          hidden: hasNonErrorItems,
          default: true,
          close: true,
          click: _.bind(this.close, this)
        } ],
        view: new ConfirmView({
          checkoutItems: options.checkoutItems
        })
      });
      var me = this;
      DialogView.prototype.constructor.call(me, options);
      me.deferred = $.Deferred();
      me.listenTo(me, "hide", _.bind(me.close, me));
      BlockingView.imbue(me);
    },
    confirm: function() {
      var me = this;
      me.$el.addClass("dialog-hidden");
      me.show();
      var resizeFn = _.bind(me._doResize, me);
      $(window).on("resize", resizeFn);
      me.once("before:destroy", function() {
        $(window).off("resize", resizeFn);
      });
      setTimeout(function() {
        resizeFn();
        me.$el.find(".binf-modal-footer button:visible").first().trigger("focus");
      }, 300);
      return me.deferred.promise();
    },
    onRemoveItem: function(event) {
      $(event.target).closest("tr").remove();
      var hasNonErrorItems = false, rows = this.$el.find(".checkout-items tr");
      rows.each(function() {
        if ($(this).attr("data-cs-status") !== "ERROR") {
          hasNonErrorItems = true;
          return false;
        }
      });
      this.updateButton("continue", {
        hidden: !hasNonErrorItems
      });
      this.updateButton("cancel", {
        hidden: !hasNonErrorItems
      });
      this.updateButton("close", {
        hidden: hasNonErrorItems
      });
      if (rows.length === 1) {
        rows.find(".remove-item").hide();
      }
    },
    onContinueButtonClick: function() {
      var me = this, selectedIds = [], output = [];
      me.$el.find(".checkout-items tr").each(function() {
        selectedIds.push($(this).attr("data-cs-id"));
      });
      _.each(me.options.checkoutItems, function(item) {
        if (_.contains(selectedIds, item.id)) {
          output.push(item);
        }
      });
      this.destroy();
      me.deferred.resolve(output);
    },
    close: function() {
      this.destroy();
      this.deferred.reject();
    },
    _doResize: function() {
      var extHeight = this.$el.find(".binf-modal-header").outerHeight(true) + this.$el.find(".binf-modal-footer").outerHeight(true) + 60;
      this.$el.find(".binf-modal-body").css("max-height", this.$el.height() - extHeight + "px");
      var newHeight = this.$el.find(".binf-modal-content").outerHeight(true);
      this.$el.find(".binf-modal-dialog").css("margin-top", (this.$el.height() - newHeight) / 2 + "px");
      this.$el.find("td.message > div").each(function() {
        if (this.scrollHeight <= 32) {
          $(this).find(".fadeout").hide();
        }
      });
      this.$el.removeClass("dialog-hidden");
    }
  });
});