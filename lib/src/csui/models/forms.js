/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/models/form" ], function(Backbone, FormModel) {
  "use strict";
  var FormCollection = Backbone.Collection.extend({
    model: FormModel,
    constructor: function FormCollection(models, options) {
      this.options = options || (options = {});
      Backbone.Collection.prototype.constructor.call(this, models, options);
    }
  });
  return FormCollection;
});