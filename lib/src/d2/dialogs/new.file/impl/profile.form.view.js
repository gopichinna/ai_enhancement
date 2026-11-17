/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "d2/controls/form/d2.form.view", "hbs!d2/dialogs/new.file/impl/profile.form", "i18n!d2/dialogs/new.file/impl/nls/lang", "css!d2/dialogs/new.file/impl/profile.form" ], function($, _, D2FormView, formTemplate, lang) {
  "use strict";
  var ProfileFormView = D2FormView.extend({
    formTemplate: formTemplate,
    className: function() {
      var zuper = ProfileFormView.__super__;
      var className = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " d2-profile-form";
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    templateWrapperClassName: "d2-profile-form-wrapper",
    constructor: function ProfileFormView(options) {
      options || (options = {});
      options.mode = "create";
      D2FormView.prototype.constructor.call(this, options);
    },
    _getLayout: function() {
      var template = this.getOption("formTemplate"), fields = _.keys(this.model.get("options").fields), html = template.call(this, {
        templateWrapperClassName: this.getOption("templateWrapperClassName"),
        fields: fields,
        lang: lang
      }), bindings = this._getBindings(fields), view = {
        parent: "bootstrap-csui",
        layout: {
          template: html,
          bindings: bindings
        }
      };
      return view;
    },
    _getBindings: function(fields) {
      var bindings = {};
      _.each(fields, function(fieldName) {
        bindings[fieldName] = ".d2-profile-form-field-" + fieldName;
      });
      return bindings;
    },
    updateRenderedForm: function() {
      this.$el.addClass(ProfileFormView.prototype.className.call(this));
      D2FormView.prototype.updateRenderedForm.apply(this, arguments);
    },
    _renderContent: function() {
      D2FormView.prototype._renderContent.apply(this, arguments);
      this.$form.off("field:changed").on("field:changed", _.bind(this._onFieldChanged, this));
      this.$form.off("show:colout").on("show:colout", _.bind(this._onShowColout, this));
      this.$form.off("field:invalid").on("field:invalid", _.bind(this._onFieldInvalid, this));
      this.$form.off("click:applyAll").on("click:applyAll", _.bind(this.onClickApplyAll, this));
      this.$form.off("reset").on("reset", _.bind(this.resetForm, this));
    }
  });
  return ProfileFormView;
});