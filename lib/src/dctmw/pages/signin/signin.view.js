/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/jquery.parse.param", "nuc/lib/marionette", "nuc/utils/log", "nuc/utils/base", "csui/utils/non-attaching.region/non-attaching.region", "csui/utils/contexts/factories/connector", "dctmw/controls/signin/unity.signin.view", "dctmw/utils/authenticators/session", "dctmw/utils/theme/theme.config.manager", "dctmw/utils/rest.resources", "dctmw/utils/constants", "dctmw/utils/utils", "dctmw/utils/client.location", "hbs!dctmw/pages/signin/impl/signin", "i18n!dctmw/pages/signin/impl/nls/lang", "i18n!dctmw/controls/signin/impl/nls/localized.strings", "css!dctmw/pages/signin/impl/signin", "css!dctmw/pages/signin/style/signin.ext" ], function(_, $, parseParams, Marionette, log, base, NonAttachingRegion, ConnectorFactory, UnitySignInView, Session, ThemeConfigManager, RestResources, constants, utils, clientLocation, template, lang, strings) {
  var SigninView = Marionette.LayoutView.extend({
    template: template,
    templateHelpers: function() {
      return {
        copyrightMessage: lang.copyrightMessage
      };
    },
    regions: {
      formRegion: ".signin-container"
    },
    constructor: function SignInPageView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
    },
    defaultViewState: function() {
      this.signinControl && this.signinControl._updateView();
    },
    onRender: function() {
      var me = this, session = Session.get(), context = session.getContext(), connector = context.getObject(ConnectorFactory), productInfo = RestResources.getProductInfo(), control = new UnitySignInView({
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
      me.listenTo(control, "failure", function(event) {
        log.warn("Login for user {0} failed: {1} ", event.username, event.error.statusText) && console.warn(log.last);
      });
      me.listenTo(control, "success", function(event) {
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
      });
      me.listenTo(control, "refresh", function() {
        productInfo.fetch(fetchOptions).done(function() {
          RestResources.setProductInfo(productInfo);
        });
      });
      me.signinControl = control;
      var themeLoaderModel = ThemeConfigManager.getDefaultThemeModel(context);
      themeLoaderModel.on("change", function() {
        control.welcomeValue = themeLoaderModel.get("welcome_value") || "";
        control._updateView();
      });
      control.welcomeValue = themeLoaderModel.get("welcome_value") || "";
      control.once("show", themeLoaderModel.fetch.bind(themeLoaderModel));
      if (!productInfo.repositories || productInfo.repositories.isEmpty()) {
        productInfo.repositories.fetch().done(function() {
          session.start().done(function() {
            me.$el.find(".d2-logo").show();
            me.$el.find(".outer-border").remove();
            me.formRegion.show(control);
            control._updateView();
          });
        });
        return;
      }
      session.start().done(function() {
        me.$el.find(".d2-logo").show();
        me.$el.find(".outer-border").remove();
        me.formRegion.show(control);
        control._updateView();
      });
    }
  });
  return SigninView;
});