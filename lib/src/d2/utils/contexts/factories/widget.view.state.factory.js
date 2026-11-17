/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory" ], function(module, _, Backbone, ModelFactory) {
  "use strict";
  var WidgetViewStateModel = Backbone.Model.extend(), WidgetViewStateModelFactory = ModelFactory.extend({
    propertyPrefix: "widgetviewstate",
    constructor: function WidgetViewStateModelFactory() {
      ModelFactory.prototype.constructor.apply(this, arguments);
      this.options.permanent = true;
      var widgetViewStateModel = this.options.widgetViewStateModel || {};
      if (!(widgetViewStateModel instanceof Backbone.Model)) {
        widgetViewStateModel = new WidgetViewStateModel();
      }
      this.property = widgetViewStateModel;
    }
  });
  WidgetViewStateModelFactory.defaultModel = WidgetViewStateModel;
  return WidgetViewStateModelFactory;
});