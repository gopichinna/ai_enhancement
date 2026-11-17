/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "dctmw/widgets/user.info/user.info.view", "i18n!d2/dialogs/digital.signature/signee.list/impl/nls/lang", "hbs!d2/dialogs/digital.signature/signee.list/impl/signee.item.view", "css!d2/dialogs/digital.signature/signee.list/impl/signee.item.view" ], function(_, Backbone, Marionette, UserInfoView, lang, SigneeTemplate) {
  "use strict";
  return Marionette.ItemView.extend({
    template: SigneeTemplate,
    className: "signature-signee",
    ui: {
      item: ".signee-item",
      remove: ".d2-remove-signee"
    },
    events: {
      "click @ui.remove": "onClickRemove",
      "keyup @ui.remove": "onRemoveKeyUp",
      keyup: "onKeyUp",
      "focus @ui.item": "onFocusItem",
      "focusout @ui.item": "onFocusOutItem"
    },
    templateHelpers: function() {
      return {
        removeTooltip: lang.removeTooltip,
        groupIndex: this.options.groupIndex,
        allowDragAndDrop: this.options.allowDragAndDrop
      };
    },
    constructor: function SigneeItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      if (!this.userInfoView) {
        this.userInfoView = new UserInfoView({
          model: this.model,
          context: this.options.context
        });
        this.userInfoView.render();
      }
      this.$el.find(".user-info-container").append(this.userInfoView.$el);
      if (this.options.allowDragAndDrop) {
        this.$el.data("model", this.model);
        this.$el.draggable({
          appendTo: ".signers",
          cursor: "move",
          helper: "clone",
          revert: false,
          zIndex: 2,
          start: function(event, ui) {
            ui.helper.addClass("helper");
            this.$el.addClass("dragging");
          }.bind(this),
          stop: function() {
            this.$el.removeClass("dragging");
          }.bind(this)
        });
      }
    },
    onShow: function() {
      !this.options.removeTabIndex && this.options.signeeListView.children.each(function(view, index) {
        index === 0 ? view.$el.find(".signee-item").prop("tabindex", "0") : view.$el.find(".signee-item").removeAttr("tabindex");
      });
    },
    onKeyUp: function(event) {
      switch (event.keyCode) {
       case 46:
        this.onClickRemove(event);
        break;
      }
    },
    onRemoveKeyUp: function(event) {
      switch (event.keyCode) {
       case 32:
       case 13:
        this.onClickRemove(event);
        break;
      }
    },
    onClickRemove: function(event) {
      event.stopPropagation();
      event.preventDefault();
      var index = this.options.signeeListView.getIndexByElement(this.$el.find(".signee-item")), itemCount = this.options.signeeListView.collection.length, nextIndex = itemCount >= 2 ? index + 1 === itemCount ? 0 : index + 1 : null;
      if (nextIndex !== null) {
        this.options.signeeListView._changeFocus(this.options.signeeListView.getElementByIndex(nextIndex), this.$el.find(".signee-item"));
      } else {
        this.options.signeeListView.triggerMethod("signee:list:empty");
      }
      this.options.signeeListView.triggerMethod("remove:user", this.model);
    },
    onFocusItem: function() {
      this.ui.remove.prop("tabindex", 0);
    },
    onFocusOutItem: function() {
      var me = this;
      setTimeout(function() {
        if (me.$el.has(document.activeElement).length === 0) {
          me.ui.remove.removeAttr && me.ui.remove.removeAttr("tabindex");
        }
      });
    }
  });
});