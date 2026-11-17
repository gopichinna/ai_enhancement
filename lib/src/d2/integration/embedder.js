/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/jquery.parse.param", "d2/integration/impl/embedder.utils", "i18n!d2/integration/impl/nls/lang", "css!d2/integration/impl/embedder" ], function(require, _, $, parseParams, embedderUtils, lang) {
  "use strict";
  function handleError(err) {
    $(".d2-embed-error").remove();
    var errorHtml = '<div class="d2-embed-error">' + '<div class="error-img"></div>' + '<div class="error-message">' + err + "</div>" + "</div>";
    var errEl = $(errorHtml);
    $("body").append(errEl);
  }
  return {
    init: function() {
      var me = this, deferred = $.Deferred();
      $("body").addClass("d2-embed");
      $(".d2-embed-error").remove();
      require([ "csui/utils/contexts/factories/connector", "nuc/models/mixins/rules.matching/rules.matching.mixin", "dctmw/utils/authenticators/session", "d2/utils/constants", "dctmw/utils/geolocation.utils", "d2/integration/embed.mode.rules" ], function(ConnectorFactory, RulesMatchingMixin, Session, constants, GeolocationUtils, embedRules) {
        var params;
        try {
          params = embedderUtils.getHashParams();
          embedderUtils.getQueryParams();
        } catch (err) {
          handleError(lang.InvalidQueryParamsError);
          deferred.reject();
          return;
        }
        if (GeolocationUtils.setClientLocationForEmbedMode() === false) {
          handleError(lang.clientLocationError);
          deferred.reject();
          return;
        }
        var rulesMatcher = RulesMatchingMixin.mixin({}), ruleOutput = _.find(embedRules, function(rule) {
          return rulesMatcher.matchRules(params, rule);
        });
        if (!ruleOutput || !ruleOutput.handlerClass) {
          handleError(lang.InvalidQueryParamsError);
          deferred.reject();
          return;
        }
        me.context = Session.get().getContext();
        me.context.clear();
        me.connector = me.context.getObject(ConnectorFactory);
        me.connector.connection.headers = me.connector.connection.headers || {};
        me.connector.connection.headers[constants.Headers.EMBED_MODE] = ruleOutput.headerKey;
        if (params && params.id_source) {
          GeolocationUtils.updateApplicationDetails(params.id_source);
          me.connector.connection.headers[constants.Headers.CLIENT_APPLICATION] = params.id_source;
        }
        me.context.isEmbeddedMode = true;
        me.handler = new ruleOutput.handlerClass({
          context: me.context,
          connector: me.connector,
          adapterClass: ruleOutput.adapterClass
        });
        if (me.handler && me.handler.preProcess && _.isFunction(me.handler.preProcess)) {
          me.handler.preProcess(params).done(function() {
            deferred.resolve();
          }).fail(function(err) {
            if (err && _.isObject(err)) {
              handleError(err.message);
              if (err.ignorePromise) {
                return;
              }
            } else if (err && _.isString(err)) {
              handleError(err);
            }
            deferred.reject();
          });
        } else {
          deferred.resolve();
        }
      }, function(err) {
        handleError(err);
        deferred.reject();
      });
      return deferred.promise();
    },
    embed: function() {
      var me = this;
      require([ "nuc/lib/marionette", "d2/utils/contexts/context.controller", "dctmw/utils/utils" ], function(Marionette, D2ContextController, utils) {
        var params = embedderUtils.getHashParams();
        D2ContextController.init(me.context);
        me.handler.execute(params).fail(function(error) {
          var msg = error;
          if (error.responseText) {
            msg = utils.parseAjaxErrorAsString(error);
          }
          handleError(msg);
        });
      }, function(err) {
        handleError(err);
      });
    },
    handleError: function(err) {
      var errMsgs = _.isString(err) ? err : lang.appLoadingError;
      $(".d2-init-loader-container").remove();
      handleError(errMsgs);
    },
    reload: function() {
      if (this.handler && this.handler.destroy) {
        this.handler.destroy();
      }
      this.init().done(this.embed.bind(this));
    }
  };
});