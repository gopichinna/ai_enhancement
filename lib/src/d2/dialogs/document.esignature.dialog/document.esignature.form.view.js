/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/url", "csui/models/form", "d2/widgets/metadata/utils/form.converter", "d2/controls/form/d2.form.view", "dctmw/utils/rest.resources", "hbs!d2/dialogs/document.esignature.dialog/impl/document.esignature.form", "i18n!d2/dialogs/task.complete/impl/nls/lang" ], function(_, Marionette, Url, FormModel, MetadataConverter, D2FormView, RestResources, formTemplate, lang) {
  "use strict";
  return D2FormView.extend({
    className: function() {
      var classname = D2FormView.prototype.className.call(this);
      classname += " d2-document-esignature-form";
      return classname;
    },
    formTemplate: formTemplate,
    constructor: function DocumentESignatureFormView(options) {
      this.node = options.node;
      if (!options.originatingView) {
        options.originatingView = new Marionette.View();
      }
      if (!options.originatingView.isErrorMode) {
        options.originatingView.isErrorMode = function() {
          return false;
        };
      }
      options.topAlignedLabel = true;
      var dialog = this._createDialogJson(options);
      this.rendered = false;
      this.dialogView = options.dialogView;
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
      var repositories = RestResources.getProductInfo() && RestResources.getProductInfo().repositories, currentRepo = repositories && repositories.find(function(repository) {
        return repository.get("repository").repositoryName === RestResources.getCurrentRepository().get("name");
      }), showDomain = currentRepo && !currentRepo.get("repository").hideDomain, intentionsDictionary = options.intentionsDictionary, intentionsRequired = options.intentionsRequired, exernalEsignRequired = options.externalESignRequired, form = {};
      if (!exernalEsignRequired) {
        form = {
          text: [ {
            id: "signoff_login",
            label: lang.ESignLoginLabel,
            order: 1,
            condition_required: true
          } ],
          password: {
            id: "signoff_password",
            label: lang.ESignPasswordLabel,
            order: 2,
            crypter: true,
            condition_required: true
          }
        };
      }
      if (showDomain && !exernalEsignRequired) {
        form.text.push({
          id: "signoff_domain",
          label: lang.ESignDomainLabel,
          order: 3
        });
      }
      if (intentionsDictionary) {
        _.extend(form, {
          combo: {
            assistance_dictionary: options.dictionary ? options.dictionary : intentionsDictionary.href,
            assistance_type: "dictionary",
            asynchronous: true,
            href: intentionsDictionary.href,
            rel: intentionsDictionary.rel,
            condition_required: intentionsRequired,
            id: "signoff_intentions",
            label: lang.ESignIntentionlabel,
            order: 4,
            dictParams: {
              params: options.propertyPageData,
              documentId: options.model ? options.model.get("id") : options.masterDocumentId
            }
          }
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
        this.validateForm(false, true).done(function(isValid) {
          this.isValid = isValid;
          this.dialogView.isFormValid = isValid;
          this.refreshButtons();
        }.bind(this));
      }.bind(this));
      this.listenTo(this, "render:form", function() {
        this.rendered = true;
        this.validateForm(false, true).done(function(isValid) {
          this.isValid = isValid;
          this.refreshButtons();
        }.bind(this));
      }.bind(this));
      if (this.isRenderFinished()) {
        this.rendered = true;
        if (this.options.intentionsDictionary) {
          this.validateForm(false, true).done(function(isValid) {
            this.isValid = isValid;
            this.refreshButtons();
          }.bind(this));
        } else {
          this.isValid = !this.options.intentionsRequired;
        }
      }
    },
    refreshButtons: function() {
      if (this.dialogView && this.dialogView.options.wizard) {
        this.dialogView.options.wizard.refreshFooter([ "next" ]);
      }
    },
    isValidForm: function() {
      if (this.rendered) {
        return this.isValid;
      }
      return false;
    },
    _modifyModel: function() {
      D2FormView.prototype._modifyModel.call(this);
    }
  });
});