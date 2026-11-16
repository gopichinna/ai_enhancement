/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/utils/url", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/models/server.adaptors/largefilesettings.mixin" ], function(_, $, Backbone, Url, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";
  var LargeFileSettingsModel = Backbone.Model.extend({
    constructor: function LargeFileSettingsModel(models, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, models, options);
      this.makeConnectable(options).makeFetchable(options).makeServerAdaptor(options);
    }
  });
  ConnectableMixin.mixin(LargeFileSettingsModel.prototype);
  FetchableMixin.mixin(LargeFileSettingsModel.prototype);
  ServerAdaptorMixin.mixin(LargeFileSettingsModel.prototype);
  _.extend(LargeFileSettingsModel.prototype, {
    isFetchable: function() {
      return !this.get("largeFileSettings");
    }
  });
  return LargeFileSettingsModel;
});