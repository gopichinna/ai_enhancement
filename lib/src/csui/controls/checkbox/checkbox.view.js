/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "i18n!csui/controls/checkbox/impl/nls/lang", "hbs!csui/controls/checkbox/impl/checkbox.view", "css!csui/controls/control/impl/control", "css!csui/controls/checkbox/impl/checkbox.view" ], function($, _, Backbone, Marionette, lang, template) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "csui-control-view csui-checkbox-view",
    template: template,
    templateHelpers: function() {
      const disabledState = this.model.get("disabled") ? "disabled" : "";
      const checkedState = this.model.get("checked") === "true" ? "checked" : "";
      const indeterminate = this.model.get("checked") === "mixed" ? "indeterminate" : "";
      const isInteractiveOnly = !this.label;
      const interactiveOnly = isInteractiveOnly ? "interactiveonly" : "";
      const titleValue = this.title ? this.title : "";
      const labelValue = isInteractiveOnly ? "" : this.label;
      const arialabelValue = this.ariaLabel;
      const infoMessage = this.infoMessage ? this.infoMessage : "";
      return {
        disabled: disabledState,
        checked: checkedState,
        indeterminate: indeterminate,
        interactiveOnly: interactiveOnly,
        title: titleValue,
        ariaLabel: arialabelValue,
        label: labelValue,
        infoMessage: infoMessage
      };
    },
    ui: {
      cb: "otc-checkbox.csui-control.csui-checkbox"
    },
    constructor: function Checkbox(options) {
      options || (options = {});
      this.label = options.label;
      this.ariaLabel = options.ariaLabel;
      this.title = options.title;
      this.infoMessage = options.infoMessage;
      if (!options.model) {
        options.model = new Backbone.Model({
          disabled: options.disabled === undefined ? false : options.disabled
        });
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
      this._setChecked(options.checked, {
        silent: true
      });
      this._undelegateModelAndCollectionEvents();
      this.listenTo(this.model, "change:disabled", this._handleDisableChanged);
      this.listenTo(this.model, "change:checked", this._handleCheckedChanged);
    },
    onRender: function() {
      this.ui.cb[0].addEventListener("change", () => this._toggleChecked());
    },
    setChecked: function(state) {
      var options = {
        silent: false
      };
      if (this.model.get("disabled")) {
        options.silent = true;
      }
      this._setChecked(state, options);
    },
    setDisabled: function(state) {
      this.model.set("disabled", !!state);
    },
    _handleDisableChanged: function() {
      var disabled = this.model.get("disabled");
      this.ui.cb.prop("disabled", disabled);
    },
    _handleCheckedChanged: function() {
      var modelChecked = this.model.get("checked");
      const cbType = this.model.get("schema")?.type;
      if (cbType === "checkboxV2") {
        let data = {
          fieldvalue: modelChecked === "true",
          fieldid: this.options.dataId,
          fieldpath: this.options.path,
          targetfieldpath: this.options.path,
          fieldView: this
        };
        this.options.alpacaField.setValue(data.fieldvalue);
        const event = $.Event("field:changed");
        _.extend(event, data);
        this.$el.trigger(event);
      }
      this.ui.cb.prop("checked", modelChecked === "true");
      if (modelChecked === "mixed") {
        this.ui.cb.attr("indeterminate", "");
      } else {
        this.ui.cb.removeAttr("indeterminate");
      }
    },
    _setChecked: function(state, options) {
      switch (state) {
       case "true":
       case true:
        this.model.set("checked", "true", options);
        break;

       case "mixed":
        this.model.set("checked", "mixed", options);
        break;

       default:
        this.model.set("checked", "false", options);
        break;
      }
    },
    _toggleChecked: function() {
      if (this.model.get("disabled")) {
        return;
      }
      var modelChecked = this.model.get("checked");
      var args = {
        sender: this,
        model: this.model
      };
      this.triggerMethod("clicked", args);
      if (!args.cancel) {
        if (!modelChecked || modelChecked === "false" || modelChecked === "mixed") {
          this.model.set("checked", "true");
        } else {
          this.model.set("checked", "false");
        }
      }
    }
  });
});