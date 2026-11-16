/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/perspectives/app.scope.collection", "dctm-ext!dctmw/utils/perspectives/app.scope.perspectives" ], function(_, D2ApplicationScopeCollection, extAppScopes) {
  "use strict";
  var appScopePerspectives = new D2ApplicationScopeCollection();
  var appScopes = [];
  if (extAppScopes) {
    appScopes = appScopes.concat(_.flatten(extAppScopes, true));
  }
  appScopePerspectives.add(appScopes);
  return appScopePerspectives;
});