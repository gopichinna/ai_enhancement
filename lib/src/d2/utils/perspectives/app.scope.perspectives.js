/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/perspectives/app.scope.collection", "csui-ext!d2/utils/perspectives/app.scope.perspectives" ], function(_, D2ApplicationScopeCollection, extAppScopes) {
  "use strict";
  var appScopePerspectives = new D2ApplicationScopeCollection();
  var appScopes = [];
  if (extAppScopes) {
    appScopes = appScopes.concat(_.flatten(extAppScopes, true));
  }
  appScopePerspectives.add(appScopes);
  return appScopePerspectives;
});