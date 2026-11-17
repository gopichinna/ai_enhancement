/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "i18n!csui/controls/form/impl/fields/arraybuttonsfield/nls/lang", "hbs!csui/controls/form/impl/fields/arraybuttonsfield/arraybuttonsfield", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "css!csui/controls/form/impl/fields/arraybuttonsfield/arraybuttonsfield" ], function(_, $, Backbone, Marionette, lang, template, theming, jatoIcons) {
  "use strict";
  var ArrayButtonsFieldView = Marionette.ItemView.extend({
    constructor: function ArrayButtonsFieldView(options) {
      Marionette.ItemView.apply(this, arguments);
    },
    className: "cs-formfield cs-arraybuttonsfield",
    template: template,
    templateHelpers: function() {
      return {
        title: lang.title,
        isJATO: theming.isJATOTheme(),
        removeButtonSVG: jatoIcons.actionClearCircleFilled
      };
    },
    ui: {
      addButton: ".addbtn",
      removeButton: ".removebtn"
    },
    events: {
      "click @ui.addButton": "onAddButtonClicked",
      "click @ui.removeButton": "onRemoveButtonClicked"
    },
    onAddButtonClicked: function() {},
    onRemoveButtonClicked: function() {
      this.$el.closest(".cs-pull-left").parent().find(".cs-pull-right .circle_delete").parent().trigger("click");
      return;
    }
  });
  return ArrayButtonsFieldView;
});