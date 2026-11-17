/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui-ext!csui/perspectives/tabbed/tab.index/tab.index.preferences" ], function(_, Backbone, extensions) {
  "use strict";
  var TabIndexPreferenceModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      getPreferredTabIndex: null
    },
    constructor: function TabIndexPreferenceModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  var TabIndexPreferenceCollection = Backbone.Collection.extend({
    model: TabIndexPreferenceModel,
    comparator: "sequence",
    constructor: function TabIndexPreferenceCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },
    getPreferredTabIndex: function(options) {
      var tabIndex;
      this.some(function(extension) {
        tabIndex = extension.get("getPreferredTabIndex")(options);
        return tabIndex !== undefined;
      });
      return tabIndex;
    }
  });
  var tabIndexPreferences = new TabIndexPreferenceCollection();
  if (extensions) {
    tabIndexPreferences.add(_.chain(extensions).flatten().value());
  }
  return tabIndexPreferences;
});