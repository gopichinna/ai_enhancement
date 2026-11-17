/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/browsable/client-side.mixin", "d2/controls/form/fields/models/field.option" ], function($, _, Backbone, ClientSideBrowsableMixin, FieldOptionModel) {
  "use strict";
  var BaseFieldOptionCollection = Backbone.Collection.extend({
    model: FieldOptionModel,
    constructor: function BaseFieldOptionCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeClientSideBrowsable(options);
    }
  });
  ClientSideBrowsableMixin.mixin(BaseFieldOptionCollection.prototype);
  return BaseFieldOptionCollection;
});