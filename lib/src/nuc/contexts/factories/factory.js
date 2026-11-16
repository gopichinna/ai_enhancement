/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/marionette'], function (Marionette) {
  // These class is usually consumed under names ObjectFactory, ModelFactory or CollectionFactory,
  // depending on the descendant object (see Context.getObject for more information)
  var Factory = Marionette.Controller.extend({
    constructor: function Factory(context, options) {
      this.context = context;
      this.options = options || {};
    },

    // Descendants must set a string ID, which will uniquely identify the model in the context
    propertyPrefix: null
  });

  return Factory;
});
