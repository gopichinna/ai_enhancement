/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/models/server.adaptors/recycle.bin.mixin" ], function(_, Backbone, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";
  const RecycleBinVolumeModel = Backbone.Model.extend({
    constructor: function RecycleBinVolumeModel(models, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, models, options);
      this.makeConnectable(options).makeFetchable(options).makeServerAdaptor(options);
    }
  });
  ConnectableMixin.mixin(RecycleBinVolumeModel.prototype);
  FetchableMixin.mixin(RecycleBinVolumeModel.prototype);
  ServerAdaptorMixin.mixin(RecycleBinVolumeModel.prototype);
  return RecycleBinVolumeModel;
});