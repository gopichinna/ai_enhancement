/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/contexts/perspective/perspective.context.plugin", "d2/utils/widgets.utils", "d2/utils/root.perspective.utils", "d2/utils/perspectives/app.scope.perspectives" ], function(_, Backbone, ApplicationScopeModelFactory, PerspectiveContextPlugin, widgetUtils, rootPerspectiveUtils) {
  "use strict";
  return PerspectiveContextPlugin.extend({
    constructor: function D2RootPerspectiveContextPlugin() {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory).on("change:id", this._doFetchPerspective, this);
    },
    _doFetchPerspective: function() {
      var scope = this.applicationScope.id;
      if (!rootPerspectiveUtils.hasScope(scope)) {
        setTimeout(function() {
          rootPerspectiveUtils.notifyDeactivationOfOtherScopes();
        }, 0);
        return;
      } else if (this.context.loadingPerspective) {
        return;
      }
      var widgetConfig = rootPerspectiveUtils.getWidgetConfigForScope(scope, this.context) || rootPerspectiveUtils.getDefaultWidgetConfigForScope(scope, this.context);
      var validationResult = rootPerspectiveUtils.validateConfigForScope(scope, widgetConfig, {
        scope: scope
      });
      if (!validationResult.status) {
        this.context.rejectPerspective(new Backbone.Model(), new Error(validationResult.errorMessage));
      } else {
        var shouldSwitch = rootPerspectiveUtils.notifyActivationForScope(scope);
        if (shouldSwitch !== false) {
          this.context.loadPerspective("json!" + rootPerspectiveUtils.getPerspectiveJsonForScope(scope));
          setTimeout(function() {
            rootPerspectiveUtils.notifyDeactivationOfOtherScopes(scope);
          }, 0);
        }
      }
    }
  });
});