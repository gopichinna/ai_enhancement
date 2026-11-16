/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette3", "csui/utils/userprofilesessions/userprofilesessions.tabs/userprofilesessions.tabs" ], function($, _, Marionette, userprofilesessionsTabs) {
  "use strict";
  var UserSettingsTabsView = Marionette.CollectionView.extend({
    tagName: "div",
    className: "csui-userprofilesessions csui-normal-scrolling",
    constructor: function UserSettingsTabsView(options) {
      options || (options = {});
      this.options = options;
      this.collection = userprofilesessionsTabs;
      Marionette.CollectionView.prototype.constructor.call(this, options);
    },
    childView: function(userprofilesessionsTabModel) {
      return userprofilesessionsTabModel.get("viewClass");
    },
    childViewOptions: function(userprofilesessionsTabModel) {
      return _.extend({
        context: this.options.context,
        connector: this.options.connector,
        userid: this.options.userid,
        settingsModeChanged: false
      }, userprofilesessionsTabModel.get("viewClassOptions"));
    }
  });
  return UserSettingsTabsView;
});