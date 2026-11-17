/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/log", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "csui/models/server.adaptors/widget.settings.model.mixin" ], function(require, module, _, Backbone, log, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";
  log = log(module.id);
  const WidgetSettingsModel = Backbone.Model.extend({
    idAttribute: "preferencesStorageId",
    constructor: function WidgetSettingsModel(attributes, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.makeConnectable(options).makeFetchable(options).makeServerAdaptor(options);
    }
  });
  ConnectableMixin.mixin(WidgetSettingsModel.prototype);
  FetchableMixin.mixin(WidgetSettingsModel.prototype);
  ServerAdaptorMixin.mixin(WidgetSettingsModel.prototype);
  return WidgetSettingsModel;
});