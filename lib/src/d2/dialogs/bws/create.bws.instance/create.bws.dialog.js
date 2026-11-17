/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import {
  Collection
} from "nuc/lib/backbone";

import Url from "nuc/utils/url";

import AlertDialog from "csui/dialogs/modal.alert/modal.alert";

import StepperWizard from "d2/controls/stepper.wizard/stepper.wizard.view";

import CreateTemplateView from "d2/dialogs/bws/create.bws.instance/create.template/create.template.view";

import ImportMetadataPropertiesView from "d2/dialogs/bws/create.bws.instance/properties/bws.multi.properties.view";

import MetadataConverter from "d2/widgets/metadata/utils/form.converter";

import FormModel from "d2/sdk/controls/form/form.model";

import RestLinkrels from "d2/utils/rest.linkrels";

import utils from "d2/utils/form.utils";

import lang from "i18n!d2/dialogs/bws/create.bws.instance/impl/nls/lang";

class FormCollection extends Collection {
  model = FormModel;
  constructor(models, options) {
    super(models, options);
    this.fetched = true;
  }
}

class CreateBwsDialog {
  constructor(options = {}) {
    options || (options = {});
    this.options = options;
    this.options.fullCollection = new Collection();
  }
  show() {
    let deferred = $.Deferred();
    this.#fetchPropertyPage().done(data => {
      data.fetched = true;
      this.options.propertyFormCollection = data;
      this.showWizard().done(deferred.resolve).fail(deferred.reject);
    }).fail(deferred.reject);
    return deferred.promise();
  }
  #fetchPropertyPage() {
    let deferred = $.Deferred(), url = RestLinkrels.getLink(this.options.container.get("links"), RestLinkrels.D2_FOLDER_CREATION_PROPERTY_PAGE);
    url = Url.appendQuery(url, Url.combineQueryString({
      type: this.options?.data["bws-type-def"]
    }));
    $.ajax(this.options.container.connector.extendAjaxOptions({
      url: url,
      success: function(response) {
        let data = MetadataConverter.convertConfig(response["page-content"], {
          actionMode: "create",
          layoutMode: "singleCol"
        }).propertiesConfig;
        deferred.resolve(new FormCollection(data, {}));
      },
      error: function(xhr, textStatus, errorThrown) {
        deferred.reject(utils.parseAjaxError(xhr, textStatus, errorThrown));
      }
    }));
    return deferred.promise();
  }
  showWizard() {
    let deferred = $.Deferred(), wizard = this._getWizard();
    this.options.wizard = wizard;
    wizard.show().on("wizard:closed", function(isCancel) {
      deferred.resolve({
        isCancel: isCancel,
        collection: this.options.fullCollection
      });
    }.bind(this));
    return deferred.promise();
  }
  _getWizard() {
    this._steps = this._getWizardSteps();
    return new StepperWizard({
      steps: this._steps,
      className: "d2-addversion-modal",
      data: {}
    });
  }
  _getWizardSteps() {
    let steps = [];
    let me = this;
    steps.push({
      id: "CreateTemplateView",
      title: _.str.sformat(lang.CreateTemplateHeaderTitle, this?.options?.addableTypeName),
      viewClass: CreateTemplateView,
      viewOptions: me.options,
      onCancel: me._launchConfirmationDialog,
      buttons: [ {
        id: "next",
        disabled: function() {
          return !this.isValid();
        },
        label: lang.ContinueButtonLabel,
        clickHandler: function() {
          let wizard = me.options.wizard;
          wizard && wizard.nextStep();
        }
      } ]
    });
    steps.push({
      id: "properties",
      viewClass: ImportMetadataPropertiesView,
      title: function() {
        return this.getTitle();
      },
      subTitle: function() {
        return this.getSubTitle();
      },
      viewOptions: {
        multiItemSelect: true,
        collection: this.options.fullCollection,
        propertyFormCollection: this.options.propertyFormCollection,
        hideMultiItemView: () => {
          return this.options.fullCollection.length === 1;
        },
        showBannerForSingleItem: true
      },
      nextStepId: function() {
        return "finish";
      },
      buttons: [ {
        id: "nextFile",
        className: "nextFileBtn",
        isPrimary: true,
        label: function() {
          return lang.NextInstance;
        },
        disabled: function() {
          return this.nextFileButtonDisabled;
        },
        hidden: function() {
          if (this.multiItemView) {
            if (this.collection.models.indexOf(this.getCurrentItemModel()) + 1 === this.collection.models.length) {
              return true;
            }
            return false;
          } else {
            if (this.collection.length > 1) {
              return false;
            } else {
              return true;
            }
          }
        },
        clickHandler: function() {
          this.nextItem();
        }
      }, {
        id: "next",
        className: "nextBtn",
        hidden: function() {
          if (this.multiItemView) {
            if (this.collection.models.indexOf(this.getCurrentItemModel()) + 1 === this.collection.models.length) {
              return false;
            }
            return true;
          } else {
            if (this.collection.length > 1) {
              return true;
            } else {
              return false;
            }
          }
        },
        label: function() {
          return _.str.sformat(lang.CreateTemplateHeaderTitle, me?.options?.addableTypeName);
        },
        disabled: function() {
          if (this.multiItemView) {
            if (this.collection.models.indexOf(this.getCurrentItemModel()) + 1 === this.collection.models.length) {
              return false;
            }
            return true;
          } else {
            if (this.collection.length > 1) {
              return true;
            } else {
              return false;
            }
          }
        }
      } ],
      onCancel: me._launchConfirmationDialog
    });
    return steps;
  }
  _launchConfirmationDialog() {
    let dfd = $.Deferred();
    AlertDialog.confirmQuestion(function(result) {
      if (result) {
        dfd.resolve(result);
      } else {
        dfd.reject(result);
      }
    }, lang.ConfirmationText, lang.ConfirmationTitle, {
      buttons: {
        showYes: true,
        labelYes: lang.confirmDialogLabelYes,
        showNo: false,
        showCancel: true
      }
    });
    return dfd.promise();
  }
}

Object.defineProperty(CreateBwsDialog.prototype.constructor, "name", {
  value: "CreateBwsDialog"
});

export default CreateBwsDialog;