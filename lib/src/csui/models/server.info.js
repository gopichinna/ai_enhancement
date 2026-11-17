/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/utils/url", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/models/server.info/server.adaptor.mixin" ], function(Backbone, Url, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";
  var ServerInfoModel = Backbone.Model.extend({
    constructor: function ServerInfoModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options);
    }
  });
  ConnectableMixin.mixin(ServerInfoModel.prototype);
  FetchableMixin.mixin(ServerInfoModel.prototype);
  ServerAdaptorMixin.mixin(ServerInfoModel.prototype);
  return ServerInfoModel;
});