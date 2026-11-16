/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/utils/url", "csui/utils/base" ], function(_, $, Backbone, Url, base) {
  function MetadataController(status, options, attributes) {
    this.status = status || {};
    this.options = options || {};
    this.attributes = attributes || {};
  }
  _.extend(MetadataController.prototype, Backbone.Events, {
    save: function(model, data) {
      return model.save(data, {
        wait: true,
        patch: true
      });
    },
    createItem: function(model, formsValues) {
      return model.save(undefined, {
        data: formsValues,
        wait: true
      });
    }
  });
  MetadataController.prototype.get = Backbone.Model.prototype.get;
  _.extend(MetadataController, {
    version: "1.0"
  });
  return MetadataController;
});