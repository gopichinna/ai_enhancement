/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/form/fields/textfield.view" ], function(_, $, Backbone, Marionette, TextFieldView) {
  "use strict";
  var URLFieldView = TextFieldView.extend({
    constructor: function DctmwURLFieldView() {
      this.ui = _.extend(this.ui, {
        readFieldLink: ".cs-field-read a"
      });
      TextFieldView.apply(this, arguments);
    },
    events: {
      "keypress @ui.readField": "onKeyPressRead",
      "click @ui.readField": "onClickLink",
      "keypress @ui.readFieldLink": "onKeyPressRead",
      "click @ui.readFieldLink": "onClickLink"
    },
    templateHelpers: function() {
      var options = this.model.get("options");
      options.type = "url";
      var templateHelper = TextFieldView.prototype.templateHelpers.apply(this);
      options.type = "dctmwurl";
      return templateHelper;
    },
    getUrlForField: function() {
      var pattern = /^((http||https||ftp):\/\/)/, dstr = this.model.get("data");
      if ((this.mode === "read" || this.mode === "readonly") && !_.isEmpty(dstr)) {
        if (!pattern.test(dstr)) {
          dstr = "http://" + dstr;
        }
      }
      return dstr || "";
    },
    getAbsoluteUrl: function() {
      return this.getUrlForField();
    },
    getDisplayValue: function() {
      return this.getEditValue();
    },
    onKeyPressRead: function(event) {
      if (event.keyCode === 13) {
        this.onClickLink(event);
      }
    },
    onClickLink: function(event) {
      var dstr = $(event.currentTarget).attr("href") || this.getUrlForField();
      if (dstr) {
        window.open(dstr, "_blank");
      }
    },
    allowEditOnEnter: function() {
      return false;
    },
    allowEditOnClickReadArea: function() {
      return false;
    },
    getEditValue: function() {
      return this.ui.writeField.val();
    }
  });
  return URLFieldView;
});