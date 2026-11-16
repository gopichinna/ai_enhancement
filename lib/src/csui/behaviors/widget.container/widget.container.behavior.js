/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/widgets/error/error.view", "csui/utils/log", "i18n!csui/behaviors/widget.container/impl/nls/lang", "csui/utils/exp.widget.config", "csui/lib/jquery.when.all" ], function(require, _, $, Marionette, ErrorView, log, lang, ExpWidgetConfig) {
  "use strict";
  var WidgetContainerBehavior = Marionette.Behavior.extend({
    constructor: function WidgetContainerBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.view = view;
      this.view.widgetsResolved = this._resolveWidgets();
    },
    _resolveWidgets: function() {
      var promises = [];
      if (!this.view.enumerateWidgets) {
        throw new Marionette.Error({
          name: "UndefinedEnumerateWidgets",
          message: "Undefined enumerateWidgets method"
        });
      }
      this.view.enumerateWidgets(_.bind(function(widget) {
        promises.push($.when(widget).then(WidgetContainerBehavior.resolveWidget));
      }, this));
      return $.whenAll.apply($, promises);
    }
  }, {
    getErrorWidget: function(widget, error) {
      return {
        type: "csui/widgets/error",
        options: {
          message: _.str.sformat(lang.loadingWidgetFailedMessage, widget.type),
          suggestion: lang.loadingWidgetFailedSuggestion,
          originalWidget: _.extend({}, widget)
        },
        view: ErrorView,
        error: error
      };
    },
    resolveWidget: function(widget) {
      if (!widget.view) {
        WidgetContainerBehavior._isExpWidgetEnable(widget);
        var promise = WidgetContainerBehavior._loadWidget(widget.type).then(function(Widget) {
          widget.view = Widget;
          widget["class"] = Widget;
          return widget;
        }, function(error) {
          log.warn('Loading widget "{0}" failed. {1}', widget.type, error) && console.warn(log.last);
          log.warn("Occurred " + log.getStackTrace()) && console.warn(log.last);
          _.extend(widget, WidgetContainerBehavior.getErrorWidget(widget, error));
        });
        return promise;
      }
      return $.Deferred().resolve().promise();
    },
    _isExpWidgetEnable: function(widget) {
      if (!widget || !ExpWidgetConfig) return;
      const {
        expWidgetConfig
      } = ExpWidgetConfig[widget.type] || {};
      if (expWidgetConfig && !expWidgetConfig.isBothEnable) {
        widget.type = expWidgetConfig.newWidget;
      }
    },
    _loadWidget: function(name) {
      var deferred = $.Deferred(), path, lastSlash = name.lastIndexOf("/");
      if (lastSlash < 0) {
        path = "csui/widgets/" + name;
      } else {
        path = name;
        name = name.substring(lastSlash + 1);
      }
      require([ path + "/" + name + ".view" ], function(Widget) {
        deferred.resolve(Widget);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }
  });
  return WidgetContainerBehavior;
});