/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/form/fields/textfield.view", "hbs!dctmw/controls/form/impl/textfield/textfield", "i18n!csui/controls/form/impl/nls/lang", "css!dctmw/controls/form/impl/textfield/textfield" ], function(TextFieldView, template, lang) {
  "use strict";
  var originalOnRender = TextFieldView.prototype.onRender;
  TextFieldView.prototype.template = template;
  TextFieldView.prototype.onRender = function() {
    originalOnRender && originalOnRender.apply(this, arguments);
    this.listenTo(this, "disable:field", function() {
      _setOrRemoveToolTipOnField.call(this);
    });
  };
  function _setOrRemoveToolTipOnField() {
    let inputTextWrapper = this.$el.find(".cs-field-write-inner");
    if (this.options?.alpaca?.schema?.disabled) {
      let inputText = this.$el.find(".cs-field-write-inner input"), inputTextValue = inputText.val(), title = inputTextValue || lang.noValue;
      inputTextWrapper.attr("title", title);
    } else {
      inputTextWrapper.removeAttr("title");
    }
  }
  TextFieldView.prototype.preSetValue = function(value) {
    return value;
  };
});