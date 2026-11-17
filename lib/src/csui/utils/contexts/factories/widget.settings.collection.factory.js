/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/contexts/factories/factory", "csui/models/widget/settings/impl/widget.settings.collection" ], function(_, ModelFactory, WidgetSettingsCollection) {
  var WidgetSettingsCollectionFactory = ModelFactory.extend({
    propertyPrefix: "widgetSettings",
    constructor: function WidgetSettingsCollectionFactory(context, options) {
      if (options.permanent === undefined) {
        options.permanent = true;
      }
      if (options.detached === undefined) {
        options.detached = true;
      }
      ModelFactory.prototype.constructor.apply(this, arguments);
      this.property = new WidgetSettingsCollection(undefined, {
        context: context
      });
    }
  });
  return WidgetSettingsCollectionFactory;
});