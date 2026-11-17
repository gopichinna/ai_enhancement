/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette3", "csui/utils/usersettings/usersettings.tabs/usersettings.tabs" ], function($, _, Marionette, usersetingsTabs) {
  "use strict";
  var UserSettingsTabsView = Marionette.CollectionView.extend({
    tagName: "div",
    className: "csui-usersettings csui-normal-scrolling",
    constructor: function UserSettingsTabsView(options) {
      options || (options = {});
      this.options = options;
      this.collection = usersetingsTabs;
      Marionette.CollectionView.prototype.constructor.call(this, options);
    },
    childView: function(usersettingTabModel) {
      return usersettingTabModel.get("viewClass");
    },
    childViewOptions: function(usersettingTabModel) {
      return _.extend({
        context: this.options.context,
        connector: this.options.connector,
        userid: this.options.userid
      }, usersettingTabModel.get("viewClassOptions"));
    },
    onRender: function() {
      var allFormsRendered = [];
      this.children.each(_.bind(function(childView) {
        var formRendered = $.Deferred();
        allFormsRendered.push(formRendered.promise());
        this.listenTo(childView, "childview:rendered", function() {
          formRendered.resolve();
        });
      }, this));
    }
  });
  return UserSettingsTabsView;
});