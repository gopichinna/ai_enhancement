/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/connector", "dctmw/utils/sw.utils", "dctmw/utils/utils" ], function(_, $, Backbone, connector, serviceWorker, utils) {
  "use strict";
  const oldAssignTo = connector.prototype.assignTo;
  const oldExtendedAjax = connector.prototype.extendAjaxOptions;
  function isPerspectiveWideError(xhr, {
    ignoreHttp403 = false
  }) {
    if (xhr.status === 403 && ignoreHttp403 !== false) {
      return false;
    }
    return [ 0, 403 ].includes(xhr.status);
  }
  connector.prototype.assignTo = function(model) {
    const result = oldAssignTo.call(this, model), oldSync = model.sync, me = this;
    model.sync = function(method, model, options) {
      const syncResult = oldSync.call(this, method, model, options);
      syncResult.fail(function(xhr, txtStatus, error) {
        if (isPerspectiveWideError(xhr, options) && me.applyingErrorPerspective !== true) {
          if (me.context && me.context.rejectPerspective) {
            const perspectiveModel = new Backbone.Model(), listener = function(perspective, sourceModel) {
              if (sourceModel === perspectiveModel) {
                me.applyingErrorPerspective = false;
                me.context.off("change:perspective", listener, me.context);
              }
            };
            me.applyingErrorPerspective = true;
            me.context.listenTo(me.context, "change:perspective", listener);
            me.context.rejectPerspective && me.context.rejectPerspective(perspectiveModel, utils.parseAjaxError(xhr, txtStatus, error, true));
          }
        }
      });
      return syncResult;
    };
    return result;
  };
  connector.prototype.extendAjaxOptions = function(options, restartRequest) {
    var beforeSend = options.beforeSend;
    options.beforeSend = function(xhr, settings) {
      if (settings.skipSWCache === true && serviceWorker.isEnabled()) {
        xhr.setRequestHeader("X-SW-NO-CACHE", true);
      }
      _.isFunction(beforeSend) && beforeSend(xhr, settings);
    };
    oldExtendedAjax.call(this, options, restartRequest);
    if (options && options.headers && options.headers["Accept-Language"] === "pt") {
      options.headers["Accept-Language"] = "pt-BR";
    }
    return options;
  };
});