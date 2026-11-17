/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "dctmw/controls/signin/application.view" ], function(Marionette, ApplicationItemView) {
  "use strict";
  var ApplicationListView = Marionette.CollectionView.extend({
    tagName: "select",
    tabindex: "0",
    childView: ApplicationItemView,
    className: "application-select",
    attributes: {
      "aria-label": "Select an application",
      required: "required"
    },
    getApplicationByName: function(param) {
      var application;
      this.collection.models.some(function(model) {
        var modelApp = model.get("applicationName");
        if (modelApp === param) {
          application = modelApp;
          return true;
        }
      });
      return application;
    },
    getApplicationByParam: function(param) {
      var application;
      this.collection.models.some(function(model) {
        var modelApp = model.get("applicationParameter");
        if (modelApp === param) {
          application = model.get("applicationName");
          return true;
        }
      });
      return application;
    }
  });
  return ApplicationListView;
});