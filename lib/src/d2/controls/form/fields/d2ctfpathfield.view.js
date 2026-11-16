/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "d2/controls/form/fields/base/d2formfield.editable.behavior", "i18n!d2/controls/form/impl/nls/lang", "hbs!d2/controls/form/impl/d2ctfpathfield/d2ctfpathfield", "css!d2/controls/form/impl/d2ctfpathfield/d2ctfpathfield" ], function(_, $, Backbone, Marionette, base, D2FormFieldEditableBehavior, lang, template) {
  "use strict";
  return Marionette.ItemView.extend({
    constructor: function D2CtfPathFieldView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.model = this.options.model;
      this.oldVal = this.model.get("data") || "";
      this.ignoreWriteMouseDownEvent = true;
      this.editableBehavior = this._behaviors[0];
    },
    className: "d2-ctf-path-field cs-formfield",
    template: template,
    behaviors: {
      FormFieldEditable: {
        behaviorClass: D2FormFieldEditableBehavior
      }
    },
    ui: {
      browseButton: ".browse-button",
      writeField: ".cs-field-write input"
    },
    events: {
      "click @ui.browseButton": "_onClickBrowse",
      "keydown @ui.browseButton": "_onKeyDownBrowse",
      "blur @ui.browseButton": "_onFocusOutBrowse",
      "focus @ui.browseButton": "_onFocusInBrowse",
      "input @ui.writeField": "_onInputWriteField",
      "keydown @ui.writeField": "_onKeyDownWriteField"
    },
    templateHelpers: function() {
      var hasData = this.model && this.model.get("data"), data = this.model.get("data"), writeModeAria = _.str.sformat(lang.fieldEditAria, this.options.fieldLabel, data), readModeAria = _.str.sformat(lang.fieldReadOnlyAria, this.options.fieldLabel, data);
      return {
        id: this.options.dataId ? this.options.dataId : _.uniqueId("ctf-path-"),
        data: this.model.get("data"),
        noValue: lang.noValue,
        writeModeAria: writeModeAria,
        readModeAria: readModeAria,
        placeholder: this.options.placeholder,
        isNotWriteOnly: this.mode !== "writeonly",
        hasData: hasData,
        emptyLabel: lang.noValueLabel,
        cancel: lang.cancel,
        save: lang.save,
        edit: lang.edit,
        browseAria: lang.browseAria,
        browseTitle: lang.browseTitle
      };
    },
    saveFieldChanges: function() {
      var self = this, dfd = $.Deferred(), data = this.model.get("data");
      if (this.$el.hasClass("invalid-path")) {
        dfd.reject();
      }
      if (data === this.oldVal) {
        dfd.resolve();
      } else if (_.isFunction(this.options.onSaveFieldChange)) {
        this.options.onSaveFieldChange(data, this).done(function() {
          self.oldVal = data;
          self.render();
          dfd.resolve();
        }).fail(function() {
          dfd.reject();
        });
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    revertFieldChanges: function() {
      this.model.set("data", this.oldVal);
      this.render();
    },
    _onInputWriteField: function(event) {
      var value = $(event.target).val();
      value = value.trim();
      if (this.validatePath(value)) {
        this.model.set("data", value);
        this.trigger("field:changed", value);
        this.$el.removeClass("invalid-path");
      } else {
        this.trigger("field:ctf:path:invalid");
        this.trigger("field:invalid");
        this.$el.addClass("invalid-path");
      }
    },
    validatePath: function(value) {
      if (!value) {
        return true;
      }
      var isValidPath = false, exec, pathRegex = /([\/]|(\$[\w]+|\$\{[^}]+\}))((\$[\w]+|\$\{[^}]+\})|([^\:\\\{\}\$]*))*/, winPathRegex = /(([a-zA-Z]\:[\\|\/])|([\\]{2})|%[^%]+%[\\|\/]?)((%[^%]+%)|([^%\:\*\?\"\|<>]*))*/;
      if (base.isMacintosh()) {
        exec = pathRegex.exec(value);
        isValidPath = exec && exec[0] === value && value.search(/[\/]{2,}/) === -1 && value.search(/\}[^\:\/\\\{\}\$]/) === -1;
      } else {
        exec = winPathRegex.exec(value);
        if (exec && exec[0] === value) {
          if (value.indexOf("\\\\") === 0) {
            value = value.replace("\\\\", "");
          }
          isValidPath = value.search(/[\\\/]{2,}/) === -1 && value.search(/[^\\\/%\:\*\?\"\|<>]%[^\\\/%\:\*\?\"\|<>]/) === -1;
        }
      }
      return isValidPath;
    },
    _onKeyDownWriteField: function(event) {
      var eventKeyCode = event.charCode || event.which;
      if (eventKeyCode === 9) {
        this.editableBehavior.focusNextTabableElement(event);
        event.preventDefault();
        event.stopPropagation();
      }
    },
    _onFocusOutBrowse: function() {
      this.ui.writeField.removeClass("browse-focused");
    },
    _onFocusInBrowse: function() {
      this.ui.writeField.addClass("browse-focused");
    },
    _onClickBrowse: function() {
      var self = this, title = "", startPath = "";
      require([ "d2/ctf/ctfBridge" ], function(ctfBridge) {
        ctfBridge.publishSelectFolder(title, "default", startPath, function(path) {
          self.ui.writeField.val(path).trigger("input").trigger("focus");
        }, function() {
          self.ui.writeField.trigger("focus");
        });
      });
    },
    _onKeyDownBrowse: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        this.ui.browseButton.trigger("click");
        break;

       case 9:
        this.editableBehavior.focusNextTabableElement(event);
        break;

       case 27:
        this.trigger("field:change:revert");
        break;

       default:
        return;
      }
      event.stopPropagation();
      event.preventDefault();
    }
  });
});