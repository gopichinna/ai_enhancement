/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/controls/form/pub.sub", "csui/widgets/navigation.header/controls/user.profile/user.profile.view" ], function(require, $, _, PubSub, UserProfileView) {
  "use strict";
  UserProfileView.prototype._getUserPhotoUrl = function() {
    return this.model.has("photo_url") && this.model.get("photo_url");
  };
  UserProfileView.prototype._getUserGroups = function() {
    return;
  };
});