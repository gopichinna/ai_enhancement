/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/commands/edit.perspective", "csui/utils/commonconfig.util" ], function(_, $, EditPerspective, CommonConfigUtil) {
  "use strict";
  var EditMultiplePerspectives = EditPerspective.extend({
    defaults: {
      signature: "EditMultiplePerspectives"
    },
    enabled: function(status, options) {
      const enableSideBar = CommonConfigUtil.enableSideBar();
      const context = status.context || options && options.context;
      const applicationScope = context._applicationScope.get("id");
      return context.perspective.get("canEditPerspective") && !applicationScope && !!enableSideBar;
    },
    execute: function(status, options) {
      var deferred = $.Deferred();
      const context = status.context || options && options.context;
      const perspective = context.perspective;
      const enablePersonalization = this._enablePersonalizePage(perspective, options, context);
      if (enablePersonalization) {
        this._promptToChooseEditPage(status, options, context, deferred);
      }
      return deferred.promise();
    },
    _doEditPage: function(status, options, context, deferred) {
      if (context.perspective.has("id")) {
        this._fetchPerspective(context, context.perspective).then(_.bind(function(perspectiveModel) {
          if (perspectiveModel) {
            this._editInline(perspectiveModel, context, deferred);
          }
        }, this), deferred.reject);
      }
    }
  });
  return EditMultiplePerspectives;
});