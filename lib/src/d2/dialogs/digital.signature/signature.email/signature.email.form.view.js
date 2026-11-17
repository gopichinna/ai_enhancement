/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/models/form", "d2/widgets/metadata/utils/form.converter", "d2/controls/form/d2.form.view", "hbs!d2/dialogs/digital.signature/signature.email/impl/signature.email.form", "i18n!d2/dialogs/digital.signature/signature.email/impl/nls/lang" ], function(_, FormModel, MetadataConverter, D2FormView, formTemplate, lang) {
  "use strict";
  return D2FormView.extend({
    className: function() {
      var classname = D2FormView.prototype.className.call(this);
      classname += " d2-signature-email-form";
      return classname;
    },
    formTemplate: formTemplate,
    constructor: function SignatureEmailFormView(options) {
      options || (options = {});
      options.originatingView || (options.originatingView = {
        isErrorMode: function() {
          return false;
        }
      });
      options.topAlignedLabel = true;
      var dialog = this._createDialogJson(options);
      this.rendered = false;
      this.formmodel = MetadataConverter.convertConfig(dialog, {
        actionMode: "create",
        layoutMode: "singleCol"
      });
      var form = _.extend({
        data: {},
        schema: {},
        options: {}
      }, this.formmodel.propertiesConfig[0]);
      options.model = new FormModel(form);
      options.mode = "create";
      D2FormView.prototype.constructor.call(this, options);
      this.listenTo(this, "valid:field", this._raiseValidChangeEvent);
      this.listenTo(this, "invalid:field", this._raiseInvalidChangeEvent);
    },
    _createDialogJson: function(options) {
      var form = {
        text: {
          order: 1,
          id: "email_subject",
          label: lang.EmailSubjectLabel,
          value: options.digitalSignatureModel.get("digital_signature_email_subject") || "",
          maxlength: options.digitalSignatureModel.get("email_subject_char_limit") || 230,
          placeholder: _.str.sformat(lang.SubjectPlaceholder, lang[options.digitalSignatureModel.get("signature_provider") + "Label"] ? lang[options.digitalSignatureModel.get("signature_provider") + "Label"] : options.digitalSignatureModel.get("signature_provider"))
        },
        memo: {
          order: 2,
          id: "email_message",
          label: lang.EmailMessageLabel,
          value: options.digitalSignatureModel.get("digital_signature_email_message") || "",
          rows: 4,
          isTextareaAutoHeight: true,
          maxlength: options.digitalSignatureModel.get("email_message_char_limit") || 5e3,
          nonRegexValidation: true,
          placeholder: _.str.sformat(lang.MessagePlaceholder, lang[options.digitalSignatureModel.get("signature_provider") + "Label"] ? lang[options.digitalSignatureModel.get("signature_provider") + "Label"] : options.digitalSignatureModel.get("signature_provider"))
        }
      };
      if (options.digitalSignatureModel.get("html_tags_allowed") === "none" || options.digitalSignatureModel.get("html_tags_allowed") === "restrict") {
        var reg = "", validationMessage = "";
        if (options.digitalSignatureModel.get("html_tags_allowed") === "restrict") {
          _.each(options.digitalSignatureModel.get("allowed_email_message_html_tags"), function(tag, index) {
            reg += "(?!<" + tag + " )" + "(?!<" + tag + ">)" + "(?!<" + tag + "/)" + "(?!<" + tag + "/>)" + "(?!</" + tag + ">)";
            index === options.digitalSignatureModel.get("allowed_email_message_html_tags").length - 1 ? validationMessage += lang.EmailMessageValidationAnd + tag : validationMessage += " " + tag + ",";
          });
          validationMessage = _.str.sformat(lang.EmailMessageValidationRestrict, validationMessage);
        } else {
          validationMessage = lang.EmailMessageValidationAll;
        }
        reg += '(<("[^"]*"|[^">])*>)';
        _.extend(form.memo, {
          condition_validation: '!getValue("email_message").value.match(\'' + reg + "')",
          validation_message: validationMessage
        });
      }
      return {
        dialog: {
          content: form
        }
      };
    },
    onShow: function() {
      this.listenTo(this, "d2:change:formValidation", function() {
        this.validateForm(false, false).done(function(isValid) {
          this.isValid = isValid;
          this.refreshButtons();
        }.bind(this));
      }.bind(this));
      this.listenTo(this, "render:form", function() {
        this.rendered = true;
        this.form.hideInitValidationError = true;
        this.form.refreshValidationState(true, function() {
          this.validateForm(true, false).done(function(isValid) {
            this.isValid = isValid;
            this.refreshButtons();
          }.bind(this));
        }.bind(this));
      }.bind(this));
      if (this.isRenderFinished()) {
        this.rendered = true;
        this.validateForm(false, false).done(function(isValid) {
          this.isValid = isValid;
          this.refreshButtons();
        }.bind(this));
      }
    },
    refreshButtons: function() {
      this.options && this.options.wizard && this.options.wizard.refreshFooter([ "next" ]);
    },
    isValidForm: function() {
      if (this.rendered) {
        return this.isValid;
      }
      return false;
    }
  });
});