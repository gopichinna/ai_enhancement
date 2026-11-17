/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/dialogs/modal.alert/modal.alert", "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/advanced.search/advanced.search.dialog.view", "i18n!d2/dialogs/advanced.search/impl/nls/lang" ], function($, _, Backbone, ModalAlert, StepperWizard, AdvancedSearchDialogView, lang) {
  "use strict";
  var STEPS = Object.freeze({
    ADVANCED_SEARCH_DIALOG_PAGE: "advanced_search_dialog_page"
  });
  function AdvancedSearchDialog(options) {
    options || (options = {});
    this.options = options;
  }
  _.extend(AdvancedSearchDialog.prototype, Backbone.Events, {
    showAdvancedSearchWizard: function() {
      var deferred = $.Deferred(), self = this;
      var stepOptions = {
        steps: [ {
          id: STEPS.ADVANCED_SEARCH_DIALOG_PAGE,
          viewClass: AdvancedSearchDialogView,
          title: function() {
            return this.options && this.options.savedSearchModel && this.options && this.options.savedSearchModel.get("name") || lang.AdvancedSearchDialogTitle;
          },
          buttons: [ {
            id: "next",
            hidden: true
          }, {
            id: "cancel"
          }, {
            id: "save",
            label: lang.SaveButton,
            disabled: function() {
              return !this.validateSaveAction();
            },
            clickHandler: function() {
              this.saveOrUpdateSavedSearch();
            },
            hidden: function() {
              return this.isSaveAsModeEnabled();
            }
          }, {
            id: "saveas",
            label: lang.SaveAsButton,
            disabled: function() {
              return !this.validateSaveAction();
            },
            clickHandler: function() {
              this.saveAdvancedSearch();
            },
            hidden: function() {
              return !this.isSaveAsModeEnabled();
            }
          }, {
            id: "search",
            isPrimary: true,
            label: lang.SearchButton,
            disabled: function() {
              return !this.isValid();
            },
            clickHandler: function() {
              this.executeAdvancedSearch();
            }
          } ],
          onCancel: function() {
            return self.onCancel(this);
          }
        } ],
        className: "d2-advanced-search-wizard",
        data: {
          searchConfig: this.options.searchConfig,
          context: this.options.context,
          connector: this.options.connector,
          savedSearchModel: this.options.savedSearchModel,
          search_in_storeContainer: this.options.search_in_storeContainer
        }
      };
      self.wizard = new StepperWizard(stepOptions);
      self.wizard.show().on("wizard:closed", function(isCancel, success, message) {
        if (isCancel) {
          deferred.reject("close");
        } else {
          if (success) {
            deferred.resolve(message);
          } else {
            if (message) {
              deferred.reject({}, message);
            } else {
              deferred.reject("close");
            }
          }
        }
      });
      return deferred.promise();
    },
    onCancel: function(view) {
      if (view.isValueUpdated([ "save" ])) {
        var deferred = $.Deferred(), buttonOptions = {
          labelYes: lang.SaveButton,
          labelNo: lang.discardButton,
          showNo: true,
          showCancel: true
        };
        var dialog = new ModalAlert(ModalAlert._makeOptions([ function(result) {
          if (_.isUndefined(result)) {
            deferred.reject();
          } else {
            if (result) {
              view.saveOrUpdateSavedSearch(true);
              deferred.reject();
            } else {
              deferred.resolve();
            }
          }
        }, lang.confirmationMessage, lang.confirmationTitle, {
          buttons: buttonOptions
        } ], ModalAlert.defaultOptions.Question, ModalAlert.buttons.YesNo));
        dialog.show();
        dialog.updateButtons({
          disableYes: !(view.isValid() && view.isSaveFieldPopulated())
        });
        return deferred.promise();
      }
      return $.Deferred().resolve().promise();
    }
  });
  AdvancedSearchDialog.extend = Backbone.View.extend;
  return AdvancedSearchDialog;
});