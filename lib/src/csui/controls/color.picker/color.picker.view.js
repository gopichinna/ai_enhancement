/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "i18n!csui/controls/color.picker/impl/nls/lang", "hbs!csui/controls/color.picker/impl/color.picker.view", "css!csui/controls/color.picker/impl/color.picker.view" ], function(require, _, $, Marionette, lang, template) {
  const DEFAULT_LINK_COLOR = "#0D69D4";
  var ColorPickerView = Marionette.ItemView.extend({
    className: "csui-color-picker-ctrl",
    template: template,
    attributes: {
      role: "button",
      tabindex: "0"
    },
    templateHelpers: function() {
      let defaultColor;
      if (this.options?.defaultColor) {
        defaultColor = this.options.defaultColor.toUpperCase();
      } else {
        if (this.options?.field === "linkColor") defaultColor = DEFAULT_LINK_COLOR; else defaultColor = "";
      }
      var defaultColorLabel = defaultColor || lang.noColorLabel;
      if (defaultColor && _.str.include(defaultColor, "RGB")) {
        defaultColor = defaultColor.slice(defaultColor.indexOf("RGB"), defaultColor.indexOf(")") + 1);
        defaultColor = this.convertRgbToHex(defaultColor);
        defaultColorLabel = defaultColor === "#00000000" ? lang.defaultColorLabel : defaultColor;
      }
      return {
        defaultColor: defaultColor,
        defaultColorLabel: defaultColorLabel,
        noDefaultColor: !!!defaultColor,
        selectColorAria: lang.selectColorAria
      };
    },
    ui: {
      colorPicker: "input.csui-color-picker",
      colorLabel: "label.csui-color-label",
      colorPickerWrapper: "div.csui-color-picker-wrapper"
    },
    events: {
      "change @ui.colorPicker": "onChangeColor",
      keydown: "onKeydown"
    },
    onChangeColor: function() {
      var color = this.ui.colorPicker.val().toUpperCase();
      this.ui.colorPickerWrapper.css("background", color);
      this.ui.colorPickerWrapper.removeClass("no-color-overlay");
      this.ui.colorLabel.text(color);
      this.ui.colorLabel.attr("title", color);
      this.ui.colorPicker.attr("title", color);
      this.ui.colorPicker.attr("value", color);
      this.trigger("change", color);
    },
    convertRgbToHex: function(color) {
      return "#" + color.replaceAll(" ", "").match(/\d+/g).map(function(val) {
        val = parseInt(val).toString(16);
        return val.length === 1 ? "0" + val : val;
      }).join("").toUpperCase();
    },
    onKeydown: function(event) {
      if (event.keyCode === 9) {
        event.stopPropagation();
      } else {
        (event.keyCode === 13 || event.keyCode === 32) && this.$el.find(".csui-color-picker").trigger("click");
      }
    }
  });
  return ColorPickerView;
});