/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette" ], function(_, Marionette) {
  "use strict";
  var DelegatedClickBehavior = Marionette.Behavior.extend({
    constructor: function DelegatedClickBehavior(options, view) {
      options = options || {};
      options.data = options.data || {};
      if (options.registerClickEventListener !== false) {
        this.events = _.defaults(this.events || {}, {
          click: _.debounce(function() {
            this.triggerMethod("click");
          }, 500, true)
        });
      }
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      options = options || {};
      options.data = options.data || {};
      this.options = _.defaults(options, {
        widgetName: options.data.widgetName,
        widgetParams: options.data.widgetParams
      });
      this.view = view;
      this.context = this.options.context || this.view && (this.view.context || this.view.options && this.view.options.context);
      this.clickHandler = this.options.clickHandler || this.view && (this.view.clickHandler || this.view.options && this.view.options.clickHandler);
      this.viewModel = this.options.viewModel || this.view && (this.view.model || this.view.options && this.view.options.model);
    },
    onClick: function() {
      _.isFunction(this.clickHandler) && this.clickHandler.call(this.view, {
        context: this.context,
        widgetName: this.options.widgetName,
        widgetParams: this.options.widgetParams
      });
    },
    onRender: function() {
      return;
    }
  });
  return DelegatedClickBehavior;
});