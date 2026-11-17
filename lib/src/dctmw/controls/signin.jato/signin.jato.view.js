/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Model
} from "nuc/lib/backbone";

import {
  LayoutView
} from "nuc/lib/marionette";

import JatoStatusIcons from "csui/themes/csui.jato.status.icons";

import InputFieldView from "dctmw/controls/signin.jato/impl/signin.input/signin.input.view";

import SigninFooterView from "dctmw/controls/signin.jato/impl/footer/footer.view";

import SigninUtilityMixin from "dctmw/controls/signin/signin.utils.mixin";

import BrandingUtil from "dctmw/utils/dctmw.branding.util";

import template from "hbs!dctmw/controls/signin.jato/impl/signin.template";

import lang from "i18n!dctmw/controls/signin/impl/nls/localized.strings";

import "css!dctmw/controls/signin.jato/impl/signin.view";

class JatoSigninView extends LayoutView {
  #usernameInpField;
  #passwordInpField;
  #domainInpField;
  template = template;
  className() {
    return `dctm-signin-view`;
  }
  ui() {
    return {
      logo: ".logo",
      messageBox: ".message-box",
      messageContainer: ".message-box-container",
      messageIcon: ".message-icon",
      message: ".message-box .message",
      usernameRgn: ".rgn-username",
      passwordRgn: ".rgn-password",
      domain: ".rgn-domain",
      repoField: ".dctmw-repositories",
      applicationField: ".dctmw-application",
      locationField: ".dctmw-location",
      loginButton: ".btn-signin",
      retryButton: ".btn-retry"
    };
  }
  regions() {
    return {
      rgnUsernameField: ".rgn-username",
      rgnPasswordField: ".rgn-password",
      rgnDomainField: ".rgn-domain",
      rgnLangDropdown: ".dctm-sigin-lang-dropdown",
      rgnMessageIcon: ".rgn-message-icon",
      repositoriesRegion: ".dctmw-repositories",
      applicationRegion: ".dctmw-application",
      locationRegion: ".dctmw-location",
      rgnFooter: ".rgn-footer"
    };
  }
  templateHelpers() {
    const brandingModel = BrandingUtil.getBrandingConfigModel().get("brandingSettingCodes");
    let productSuitePlatform, productSuiteCategory;
    if (brandingModel.primaryText?.startsWith("Documentum")) {
      [ productSuitePlatform, ...productSuiteCategory ] = brandingModel.primaryText.split(" ");
    } else {
      productSuitePlatform = brandingModel.primaryText;
    }
    return {
      productSuitePlatform: productSuitePlatform,
      productSuiteCategory: productSuiteCategory?.join(" "),
      productName: brandingModel.secondaryText,
      versionText: brandingModel.versionText,
      buttontext: lang.signinButtonText,
      retrytext: lang.retryButtonText
    };
  }
  triggers() {
    return {
      "click @ui.loginButton": "click:loginButton",
      "click @ui.retryButton": "click:retryButton"
    };
  }
  events() {
    return {
      "change .repository-select": "onRepositoryChange",
      "change .location-select": "onLocationChange",
      "change .application-select": "onApplicationChange"
    };
  }
  modelEvents() {
    return {
      change: "_updateView"
    };
  }
  constructor(options = {}) {
    super(options);
  }
  onRender() {
    this.intializeTextFields();
    this.showDropdownFields();
    this.rgnFooter.show(new SigninFooterView());
    this.updateFieldVisibility();
  }
  setInitalFormState() {
    this.showMessage(this.customMessage);
    this.ui.loginButton.show();
    this.ui.retryButton.hide();
    const showBasicCredField = !this.connector.authenticator.isExternalSignin() || this._isSsoAuthFailure() || this._isSkipSso();
    this.ui.usernameRgn.toggle(showBasicCredField);
    this.ui.passwordRgn.toggle(showBasicCredField);
  }
  setCustomMessage(message) {
    this.customMessage = message;
  }
  intializeTextFields() {
    const usernameModel = new Model({
      attr_placeholder: lang.signinPlaceholderUsername
    }), passwordModel = new Model({
      attr_placeholder: lang.signinPlaceholderPassword,
      attr_type: "password"
    }), domainModel = new Model({
      attr_placeholder: lang.signinPlaceholderDomain
    });
    this.usernameModel = usernameModel;
    this.passwordModel = passwordModel;
    this.domainModel = domainModel;
    this.#usernameInpField = new InputFieldView({
      model: usernameModel
    });
    this.#passwordInpField = new InputFieldView({
      model: passwordModel
    });
    this.#domainInpField = new InputFieldView({
      model: domainModel
    });
    this.rgnUsernameField.show(this.#usernameInpField);
    this.rgnPasswordField.show(this.#passwordInpField);
    this.rgnDomainField.show(this.#domainInpField);
    this.#usernameInpField.ui.inputField.prop("autofocus", true);
    this._reAttachCustomInputEvent(this.#usernameInpField, this.#passwordInpField);
  }
  _reAttachCustomInputEvent(...controls) {
    controls.forEach(control => {
      control.$el.off("input", "input").on("keyup", "input", e => {
        control._onInputChange(e);
        this.onKeyUp(e);
      });
    });
  }
  hideLoginPageFields() {
    this.ui.messageBox.hide();
    this.ui.domain.hide();
    this.ui.applicationField.hide();
    this.ui.locationField.hide();
    this.ui.loginButton.hide();
  }
  validate(event) {
    this._unsetErrorStyle();
    let isExternalSignin = this.isExternalSignin(), bIsUserNameSet = !!this.usernameModel.get("attr_value"), bIsPasswordSet = !!this.passwordModel.get("attr_value"), bIsRepoSelected = !!this.getSelectedRepository(), bIsValidInput = (!isExternalSignin && bIsUserNameSet && bIsPasswordSet || isExternalSignin) && bIsRepoSelected;
    if (this.shouldShowLocation() && !this.getSelectedLocation()) {
      bIsValidInput = false;
    }
    if (this.shouldShowApplication() && !this.getSelectedApplication()) {
      bIsValidInput = false;
    }
    this.ui.loginButton.prop("disabled", !bIsValidInput);
    this.ui.loginButton.toggleClass("login-btn-enabled", bIsValidInput);
    this.updateFieldVisibility();
    if (bIsValidInput && event && event.which === 13) {
      event.preventDefault();
      this.ui.loginButton.trigger("click");
    }
  }
  updateFieldVisibility() {
    let isExternalSignin = this.isExternalSignin();
    this.ui.usernameRgn.toggle(!isExternalSignin);
    this.ui.passwordRgn.toggle(!isExternalSignin);
    this.ui.repoField.toggle(this.repositoriesListView.collection.length >= 2);
    this.ui.applicationField.toggle(this.shouldShowApplication());
    this.ui.domain.toggle(this.shouldShowDomain());
    this.ui.locationField.toggle(this.shouldShowLocation());
  }
  onClickRetryButton() {
    this.ui.retryButton.toggle(false);
    this.resetMessageContainer();
    this.trigger("refresh");
  }
  _successHandler() {
    this._loginInProgress = false;
    this.usernameModel.set("attr_value", "", {
      silent: true
    });
    this.passwordModel.set("attr_value", "", {
      silent: true
    });
    this.#usernameInpField.ui.inputField.val("");
    this.#passwordInpField.ui.inputField.val("");
    this.#passwordInpField.ui.actionBtn.hide();
    this.ui.loginButton.prop("disabled", true);
    this.ui.loginButton.toggleClass("login-btn-enabled", false);
  }
  _onAuthError() {
    if (this.connector.authenticator.supportsBasicFallback()) {
      this.ui.usernameRgn.toggle(true);
      this.ui.passwordRgn.toggle(true);
      this._setErrorStyle(lang.ssoSigninFailed, true);
    } else {
      this._setErrorStyle(lang.signinInvalidUsernameOrPassword, true);
    }
  }
  #clearInputs() {
    this.usernameModel.set("attr_value", "");
    this.passwordModel.set("attr_value", "");
    this.domainModel.set("attr_value", "");
  }
  _setErrorStyle(errorMessage) {
    this.showMessage(errorMessage, "error", JatoStatusIcons.statusErrorSmall);
    this.#clearInputs();
    this.#usernameInpField.trigger("focus");
  }
  _setFatalErrorStyle(errorMessage, keepSigninBtn) {
    this.showMessage(errorMessage, "error", JatoStatusIcons.statusErrorSmall);
    if (keepSigninBtn) {
      this.ui.loginButton.prop("disabled", true);
      this.ui.loginButton.show();
    } else {
      this.ui.loginButton.hide();
      this.ui.retryButton.show();
      this.ui.retryButton.prop("disabled", false);
      this.ui.retryButton.toggleClass("login-btn-enabled", true);
    }
    this.#clearInputs();
  }
  showMessage(message, status = "info", icon = null) {
    this.resetMessageContainer();
    if (message) {
      this.ui.messageBox.removeClass("binf-hidden");
      this.ui.messageContainer.addClass(`${status}-box-container`);
      if (icon) {
        this.attachStatusIcon(icon);
      }
      this.ui.message.text(message);
    }
  }
  resetMessageContainer() {
    let toRemove = [];
    for (let cName of this.ui.messageContainer[0].classList) {
      if (cName.endsWith("-box-container") && cName !== "message-box-container") {
        toRemove.push(cName);
      }
    }
    this.ui.messageContainer.removeClass(toRemove.join(" "));
    this.ui.messageIcon.empty();
    this.ui.message.text("");
    this.ui.messageBox.addClass("binf-hidden");
  }
  _unsetErrorStyle() {
    if (this._isJustLoggedOut()) {
      this.showMessage(_.str.sformat("{0}\n{1}", lang.haveBeenLoggedOut, lang.closeBrowser), "warning", JatoStatusIcons.statusWarning);
    } else {
      this.showMessage(this.customMessage);
    }
  }
  attachStatusIcon(icon) {
    const ic = document.createElement("otc-icon");
    ic.setAttribute("svg", icon);
    ic.setAttribute("type", "status");
    this.ui.messageIcon.empty();
    this.ui.messageIcon.append(ic);
  }
  getUserName() {
    return this.usernameModel.get("attr_value");
  }
  getPassword() {
    return this.passwordModel.get("attr_value");
  }
  getDomain() {
    return this.domainModel.get("attr_value");
  }
}

Object.defineProperty(JatoSigninView.prototype.constructor, "name", {
  value: "DctmSigninView"
});

SigninUtilityMixin.mixin(JatoSigninView.prototype);

export default JatoSigninView;