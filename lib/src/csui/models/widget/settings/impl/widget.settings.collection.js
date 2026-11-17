/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/log", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "csui/models/widget/settings/impl/widget.settings.model", "csui/models/server.adaptors/widget.settings.collection.mixin" ], function(require, module, _, Backbone, log, ConnectableMixin, FetchableMixin, WidgetSettingsModel, ServerAdaptorMixin) {
  "use strict";
  log = log(module.id);
  const WidgetSettingsCollection = Backbone.Collection.extend({
    model: WidgetSettingsModel,
    constructor: function WidgetSettingsCollection(models, options) {
      options = _.pick(options || {}, "context");
      if (!options.context) {
        throw new Error("WidgetSettingsCollection needs context in constructor options");
      }
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options).makeServerAdaptor(options);
    }
  });
  ConnectableMixin.mixin(WidgetSettingsCollection.prototype);
  FetchableMixin.mixin(WidgetSettingsCollection.prototype);
  ServerAdaptorMixin.mixin(WidgetSettingsCollection.prototype);
  return WidgetSettingsCollection;
});