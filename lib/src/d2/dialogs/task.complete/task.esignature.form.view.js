/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/url", "d2/controls/form/d2.form.view", "d2/dialogs/task.complete/next.tasks.form.view", "dctmw/utils/rest.resources", "i18n!d2/dialogs/task.complete/impl/nls/lang" ], function(_, Marionette, Url, D2FormView, NextTasksFormView, RestResources, lang) {
  "use strict";
  return NextTasksFormView.extend({
    className: function() {
      var classname = D2FormView.prototype.className.call(this);
      classname += " d2-task-esignature-form";
      return classname;
    },
    constructor: function TaskESignatureFormView(options) {
      this.node = options.node;
      if (!options.originatingView) {
        options.originatingView = new Marionette.View();
      }
      if (!options.originatingView.isErrorMode) {
        options.originatingView.isErrorMode = function() {
          return false;
        };
      }
      NextTasksFormView.prototype.constructor.call(this, options);
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
    _modifyModel: function() {
      D2FormView.prototype._modifyModel.call(this);
    }
  });
});