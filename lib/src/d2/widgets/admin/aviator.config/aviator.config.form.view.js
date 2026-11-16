/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import {
  Model
} from "nuc/lib/backbone";

import {
  LayoutView
} from "nuc/lib/marionette";

import BlockingView from "smart/controls/progressblocker/blocker";

import ModalAlert from "smart/dialogs/modal.alert/modal.alert";

import LayoutViewEventsPropagationMixin from "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin";

import UserModelFactory from "dctmw/contexts/factories/user.model.factory";

import CheckboxView from "dctmw/controls/otwc/otwc.checkbox.view";

import Session from "dctmw/utils/authenticators/session";

import RestResources from "dctmw/utils/rest.resources";

import FormModel from "d2/sdk/controls/form/form.model";

import FormView from "d2/controls/form/d2.form.view";

import AviatorConfigModelFactory from "d2/utils/contexts/factories/aviator.config.model.factory";

import AviatorAssignmentsCollectionFactory from "d2/utils/contexts/factories/aviator.assignments.collection.factory";

import MetadataConverter from "d2/widgets/metadata/utils/form.converter";

import AviatorTncDialogView from "d2/widgets/admin/aviator.config/aviator.tnc.dialog.view";

import template from "hbs!d2/widgets/admin/aviator.config/impl/aviator.config.form";

import lang from "i18n!d2/widgets/admin/aviator.config/impl/nls/lang";

import "css!d2/widgets/admin/aviator.config/impl/aviator.config.form";

class AviatorConfigFormView extends LayoutView {
  template = template;
  #isShown = false;
  className() {
    return "av4r-config-form";
  }
  templateHelpers() {
    return {
      header: lang.headerTabAviator,
      tncLinkText: lang.labelShowTnC
    };
  }
  regions() {
    return {
      rgnFormState: ".rgn-av4r-config-form-state",
      rgnFormContent: "@ui.formContent"
    };
  }
  ui() {
    return {
      formContent: ".rgn-av4r-config-form-content",
      tncLink: ".av4r-config-form-tnc-link"
    };
  }
  events() {
    return {
      "click @ui.tncLink": "showTnCDialog",
      "keyup @ui.tncLink": "_onTnCLinkKeyup"
    };
  }
  constructor(options = {}) {
    super(options);
    this.propagateEventsToRegions();
    if (this.options.blockingParentView) {
      BlockingView.delegate(this, this.options.blockingParentView);
    } else {
      BlockingView.imbue(this);
    }
    this.context = options.context || Session.get().getContext();
    this.configModel = options.config || this.context.getModel(AviatorConfigModelFactory);
    this.collection = options.collection || this.context.getCollection(AviatorAssignmentsCollectionFactory, {
      options: {
        expanded: true
      }
    });
    this.listenTo(this, "show", () => {
      this.#isShown = true;
    }).listenTo(this.configModel, "sync", this.#renderContent).listenTo(this.configModel, "request", this.blockActions).listenTo(this.configModel, "sync error", this.unblockActions);
  }
  onRender() {
    this.#renderContent();
  }
  #renderContent() {
    const configModel = this.configModel;
    if (!configModel.fetched || configModel.fetching) {
      return;
    }
    if (!this.#isShown) {
      this.listenToOnce(this, "show", this.#renderContent);
      return;
    }
    if (!this.stateView) {
      this.stateView = new CheckboxView({
        model: new Model({
          attr_checked: configModel.get("is_enabled"),
          attr_label: lang.labelEnableAviator
        })
      });
      this.listenTo(this.stateView.getModel(), "change:attr_checked", this._onCheckboxStateChanged);
    } else {
      this.stateView.getModel().set("attr_checked", configModel.get("is_enabled"));
    }
    if (!this.formView) {
      this.formView = new FormView({
        context: this.context,
        topAlignedLabel: true,
        mode: "update",
        layoutMode: "singleCol",
        model: this.#createFormModel({
          enabledBy: configModel.get("modified_by"),
          enabledOn: configModel.get("modified_on")
        })
      });
      this.listenTo(this.formView, "render:form", this.trigger.bind(this, "render:complete"));
    } else {
      const model = this.#createFormModel({
        enabledBy: configModel.get("modified_by"),
        enabledOn: configModel.get("modified_on")
      });
      this.formView.model.set(model.attributes);
    }
    this.rgnFormState.show(this.stateView);
    this.#fetchUserData(configModel.get("modified_by")).always(userData => {
      this.formView.userData = userData;
      this.rgnFormContent.show(this.formView);
      this.#toggleAviatorConfigForm(configModel.get("is_enabled"));
    });
  }
  #createFormModel({
    enabledBy,
    enabledOn
  }) {
    const form = MetadataConverter.convertConfig({
      dialog: {
        content: {
          order: 1,
          list: {
            id: "modified_by",
            label: lang.labelEnabledBy,
            field_content_type: "USER_OR_GROUP",
            assistance_type: "custom",
            asynchronous: true,
            o: [ {
              v: enabledBy,
              s: true,
              p: 0
            } ],
            order: 1
          },
          date: {
            id: "modified_on",
            display_time: true,
            label: lang.labelEnabledOn,
            mapping_format: "yyyy-MM-dd'T'HH:mm:ss.SSSZZ",
            value_format: "yyyy-MM-dd'T'HH:mm:ss.SSSZZ",
            value: enabledOn,
            mapping_value: enabledOn,
            property_type: "date",
            repeating: false,
            order: 2
          }
        }
      }
    }, {
      actionMode: "update",
      layoutMode: "singleCol"
    });
    const model = new FormModel(form.propertiesConfig[0]);
    model.get("schema")["initial_invalid"] = false;
    return model;
  }
  #fetchUserData(userName) {
    const dfd = $.Deferred();
    const userModel = this.context.getModel(UserModelFactory, {
      detached: true,
      permanent: true,
      user: {
        attributes: {
          id: userName
        }
      }
    });
    userModel.ensureFetched().always(function() {
      const id = userModel.get("id"), userData = {};
      userData[id] = _.extend({
        id: id,
        links: userModel.get("links")
      }, userModel.get("properties"));
      dfd.resolve(userData);
    }.bind(this));
    return dfd.promise();
  }
  showTnCDialog(event, dlgOptions) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    return new AviatorTncDialogView(dlgOptions).show();
  }
  showPreDisableWarning() {
    return this.collection.length ? ModalAlert.confirmWarning(lang.aviatorDisableWarningAlertMessage, lang.aviatorDisableWarningAlertTitle, {
      buttons: ModalAlert.buttons.OkCancel
    }) : $.Deferred().resolve().promise();
  }
  _onTnCLinkKeyup(event) {
    if (event.type === "keyup" && (event.keycode === 13 || event.keycode === 32)) {
      this.showTnCDialog(event);
    }
  }
  _onCheckboxStateChanged(model, value) {
    let serverStatus = this.configModel.getServerAttribute("is_enabled");
    if (serverStatus === true && value === false) {
      this.showPreDisableWarning().done(() => {
        this.#toggleAviatorConfigForm(value);
        this.configModel.set("is_enabled", value);
      }).fail(() => {
        this.stateView.getModel().set("attr_checked", true);
      });
    } else if (serverStatus === false && value === true) {
      this.showTnCDialog(null, {
        mode: AviatorTncDialogView.MODES.ACCEPTANCE
      }).getResolutionPromise().done(() => {
        this.configModel.set({
          is_enabled: true,
          modified_by: RestResources.getCurrentUser().get("name"),
          modified_on: new Date()
        });
        this.#renderContent();
      }).fail(() => {
        this.stateView.getModel().set("attr_checked", false);
      });
    } else {
      this.#toggleAviatorConfigForm(value);
      this.configModel.set("is_enabled", value);
    }
  }
  #toggleAviatorConfigForm(state) {
    if (state === false) {
      this.ui.formContent.addClass("binf-hidden");
      this.ui.tncLink.addClass("binf-hidden");
    } else {
      this.ui.formContent.removeClass("binf-hidden");
      this.ui.tncLink.removeClass("binf-hidden");
    }
  }
  onBeforeDestroy() {
    this.stateView && this.stateView.destroy();
    this.formView && this.formView.destroy();
  }
}

Object.assign(AviatorConfigFormView.prototype, LayoutViewEventsPropagationMixin);

Object.defineProperty(AviatorConfigFormView.prototype.constructor, "name", {
  value: "AviatorConfigFormView"
});

export default AviatorConfigFormView;