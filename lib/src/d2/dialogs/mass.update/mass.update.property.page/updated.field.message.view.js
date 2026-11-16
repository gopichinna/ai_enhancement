/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "nuc/utils/base", "hbs!d2/dialogs/mass.update/mass.update.property.page/impl/updated.field.message", "i18n!d2/dialogs/mass.update/impl/nls/lang", "css!d2/dialogs/mass.update/mass.update.property.page/impl/updated.field.message" ], function(Marionette, base, template, lang) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "d2-updated-field-message",
    template: template,
    ui: {
      undoIcon: ".d2-undo-icon"
    },
    events: {
      "click @ui.undoIcon": "onClickUndo",
      "keydown @ui.undoIcon": "onKeyDownUndo",
      focusin: "onFocusIn"
    },
    templateHelpers: function() {
      return {
        updateMessage: lang.fieldUpdatedLabel,
        undoTooltip: lang.undoTooltip
      };
    },
    constructor: function UpdatedFieldMessageView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onKeyDownUndo: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onClickUndo(event);
        break;
      }
    },
    onClickUndo: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.options.formView.trigger("d2:field:undo", this.options.control);
      this.options.control.fieldView.setFocus();
    },
    onFocusIn: function() {
      base.checkAndScrollElemToViewport(this.$el);
    }
  });
});