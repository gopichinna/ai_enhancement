/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/controls/form/fields/base/csformfield.view", "i18n!d2/controls/form/impl/nls/lang", "hbs!d2/controls/form/impl/d2richtext/d2richtextfield", "css!d2/controls/form/impl/d2richtext/d2richtextfield" ], function(_, $, Backbone, FormFieldView, lang, template) {
  "use strict";
  var D2RichTextFieldView = FormFieldView.extend({
    constructor: function D2RichTextFieldView() {
      FormFieldView.apply(this, arguments);
    },
    ui: {
      readField: ".cs-field-read .cs-field-richtext-data"
    },
    events: {
      "click @ui.readField": "onClickLink"
    },
    className: "cs-formfield cs-richtextfield",
    template: template,
    templateHelpers: function() {
      var templateHelper = FormFieldView.prototype.templateHelpers.apply(this);
      templateHelper.tooltip = "";
      var pseudoElem = $("<div></div>");
      pseudoElem.html(this.model.get("data"));
      _.extend(templateHelper, {
        readModeAria: _.str.sformat(lang.fieldReadOnlyAria, this.model.get("options").label, pseudoElem.text())
      });
      return templateHelper;
    },
    onClickLink: function(e) {
      e.stopPropagation();
    },
    onRender: function() {
      this.$el.parent().removeClass("cs-field-text-nospace");
      if (this.options.alpaca.options.stretch === true) {
        this.$el.closest(".binf-col-sm-9").addClass("d2-richtext-field-width");
      }
    },
    allowEditOnEnter: function() {
      return false;
    },
    allowEditOnClickReadArea: function() {
      return false;
    },
    getDisplayValue: function() {
      return this.getValue();
    }
  });
  return D2RichTextFieldView;
});