/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/utils/contexts/factories/application.scope.factory", "dctmw/controls/behaviors/delegated.click.behavior" ], function(_, ApplicationScopeModelFactory, DelegatedClickBehavior) {
  "use strict";
  var OpenAppScopeBehavior = DelegatedClickBehavior.extend({
    constructor: function OpenAppScopeBehavior(options, view) {
      options = options || {};
      OpenAppScopeBehavior.__super__.constructor.call(this, options, view);
      options.data = options.data || {};
      this.options = _.defaults(options, {
        applicationScope: options.data.applicationScope,
        widgetName: options.data.widgetName,
        orderBy: options.data.orderBy
      });
      this.applicationScopeModel = this.context && this.context.getModel(ApplicationScopeModelFactory);
      if (this.applicationScopeModel && this.view) {
        this.view.applicationScopeModel = this.applicationScopeModel;
      }
    },
    onClick: function() {
      this.onClickOpenPerspective();
    },
    onClickOpenPerspective: function() {
      if (!this.view || this.view.disableAppScopeBehavior !== true) {
        if (this.context && this.options.applicationScope) {
          if (this.view && _.isFunction(this.view.setViewStateWidgetName)) {
            this.view.setViewStateWidgetName(this.options.widgetName);
          } else {
            this.context.viewStateModel.setViewState("widget_name", this.options.widgetName);
          }
          this.context.viewStateModel.setViewState("order_by", this.options.orderBy);
          this.context.viewStateModel.setViewState("filter", "{}");
          this.context.viewStateModel.set("enabled", true);
          this.applicationScopeModel.set("id", this.options.applicationScope);
          this.view && this.view.trigger("open:" + this.options.applicationScope + ":perspective");
        }
      }
    }
  });
  return OpenAppScopeBehavior;
});