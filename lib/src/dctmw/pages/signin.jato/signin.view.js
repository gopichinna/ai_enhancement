/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  LayoutView
} from "nuc/lib/marionette";

import parseParams from "nuc/lib/jquery.parse.param";

import log from "nuc/utils/log";

import ConnectorFactory from "csui/utils/contexts/factories/connector";

import JatoSigninView from "dctmw/controls/signin.jato/signin.jato.view";

import Session from "dctmw/utils/authenticators/session";

import constants from "dctmw/utils/constants";

import clientLocation from "dctmw/utils/client.location";

import RestResources from "dctmw/utils/rest.resources";

import utils from "dctmw/utils/utils";

import strings from "i18n!dctmw/controls/signin/impl/nls/localized.strings";

import template from "hbs!dctmw/pages/signin.jato/impl/signin";

import "css!dctmw/pages/signin.jato/impl/signin";

class SigninView extends LayoutView {
  #signinView;
  template = template;
  className() {
    return `dctmw-signin-shell-view`;
  }
  regions() {
    return {
      rgnSigninView: ".signin-view-rgn"
    };
  }
  constructor(options = {}) {
    super(options);
  }
  defaultViewState() {
    this.#signinView && this.#signinView._updateView();
  }
  onRender() {
    var session = Session.get(), context = session.getContext(), connector = context.getObject(ConnectorFactory), productInfo = RestResources.getProductInfo(), control = new JatoSigninView({
      model: productInfo,
      context: context,
      connection: connector.connection
    }), fetchOptions = {
      headers: {
        Accept: constants.MediaTypes.DCTM_D2_V1_JSON
      },
      error: function() {
        control._setFatalErrorStyle(strings.repoNotAvailable);
      }
    };
    this.#signinView = control;
    this.listenTo(control, "failure", function(event) {
      log.warn("Login for user {0} failed: {1} ", event.username, event.error.statusText) && console.warn(log.last);
    }).listenTo(control, "success", function(event) {
      log.info("Login succeeded for user: ", event.username) && console.log(log.last);
      const authenticator = context.getObject(ConnectorFactory).authenticator, isExternalSignin = authenticator && authenticator.isExternalSignin();
      if (!isExternalSignin || utils.isAppworks()) {
        const nextUrlRegexp = new RegExp("^#"), hashParamIndex = window.location.hash.indexOf("?"), hashParams = hashParamIndex !== -1 && parseParams(window.location.hash.substr(hashParamIndex)), nextUrl = hashParams && hashParams.nextUrl && decodeURIComponent(hashParams.nextUrl), applicationPageHash = nextUrlRegexp.test(nextUrl) ? nextUrl : connector.authenticator.getAppPageUrl();
        log.info(`Signin redirecting to ${applicationPageHash}`) && console.info(log.last);
        clientLocation.navigate(applicationPageHash, {
          trigger: true,
          replace: true
        });
      } else {
        log.info(`Signin redirection ignored due to external signin`) && console.info(log.last);
      }
    }).listenTo(control, "refresh", function() {
      productInfo.fetch(fetchOptions).done(function() {
        RestResources.setProductInfo(productInfo);
      });
    });
    if (!productInfo.repositories || productInfo.repositories.isEmpty()) {
      productInfo.repositories.fetch().done(() => {
        session.start().done(() => {
          this.rgnSigninView.show(control);
          control._updateView();
        });
      });
      return;
    }
    session.start().done(() => {
      this.rgnSigninView.show(control);
      control._updateView();
    });
  }
}

Object.defineProperty(SigninView.prototype.constructor, "name", {
  value: "SigninView"
});

export default SigninView;