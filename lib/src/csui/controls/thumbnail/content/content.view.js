/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "hbs!csui/controls/thumbnail/content/impl/content" ], function($, _, Backbone, Marionette, template) {
  "use strict";
  var ContentView = Marionette.ItemView.extend({
    template: template,
    className: "csui-thumbnail-content-item",
    templateHelpers: function() {
      var model = this.options.contentModel, columnName = model.get("name"), key = model.get("key"), value = this.model.get(key);
      return {
        value: value,
        displayLabel: this.options.displayLabel,
        label: this.options.displayLabel ? columnName : "",
        cid: this.model.cid
      };
    },
    constructor: function ContentView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  return ContentView;
});