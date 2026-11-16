/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui-ext!csui/utils/userprofilesessions/userprofilesessions.tabs/userprofilesessions.tabs" ], function(_, Backbone, extraUserProfileSessionsTabs) {
  "use strict";
  var userProfileSessionsTab = Backbone.Model.extend({
    defaults: {
      viewClass: extraUserProfileSessionsTabs,
      viewClassOptions: null,
      viewModel: null,
      enabled: function() {
        return true;
      }
    },
    constructor: function userProfileSessionsTab(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  var userProfileSessionsTabCollection = Backbone.Collection.extend({
    model: userProfileSessionsTab,
    comparator: "sequence",
    constructor: function userProfileSessionsTabCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });
  var userProfileSessionsTabs = new userProfileSessionsTabCollection();
  addExtensions(extraUserProfileSessionsTabs);
  function addExtensions(extensions) {
    if (extensions) {
      var tabsToAdd = _.filter(_.flatten(extensions, true), function(tabToAdd) {
        return tabToAdd.enabled && _.isFunction(tabToAdd.enabled) ? tabToAdd.enabled() : tabToAdd.enabled === undefined ? true : tabToAdd.enabled;
      });
      userProfileSessionsTabs.add(tabsToAdd);
    }
  }
  return userProfileSessionsTabs;
});