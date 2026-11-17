/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "hbs!d2/dialogs/new.file/edit/impl/button.icon", "css!d2/dialogs/new.file/edit/impl/button.icon.layout" ], function(Marionette, template) {
  "use strict";
  var ButtonIconView = Marionette.ItemView.extend({
    className: "d2-button-icon",
    template: template,
    ui: {
      button: ".d2-otc-btn",
      buttonIcon: ".button-icon"
    },
    events: {
      "click @ui.button": "onClickButton"
    },
    templateHelpers: function() {
      return {
        iconClass: this.model.get("iconClass"),
        label: this.model.get("label")
      };
    },
    constructor: function ButtonIconView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onClickButton: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.trigger("button:click", this.model);
    },
    disable: function() {
      this.ui.button.prop("disabled", true);
      this.ui.buttonIcon.attr("disabled", true);
    }
  });
  return Marionette.CollectionView.extend({
    className: "d2-button-icon-layout",
    childView: ButtonIconView,
    childEvents: {
      "button:click": "onChildButtonClick"
    },
    constructor: function ButtonIconLayoutView(options) {
      this.collection = options.collection;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },
    onChildButtonClick: function(childView, model) {
      this.trigger("button:click", model);
    }
  });
});