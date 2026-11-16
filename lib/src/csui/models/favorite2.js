/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/utils/url", "csui/models/node/node.model", "csui/models/server.adaptors/favorite2.mixin", "csui/utils/deepClone/deepClone" ], function(_, Backbone, Url, NodeModel, ServerAdaptorMixin) {
  "use strict";
  var Favorite2Model = NodeModel.extend({
    mustRefreshAfterPut: false,
    idAttribute: "id",
    constructor: function Favorite2Model(attributes, options) {
      NodeModel.prototype.constructor.apply(this, arguments);
      this.makeServerAdaptor(options);
    }
  });
  ServerAdaptorMixin.mixin(Favorite2Model.prototype);
  return Favorite2Model;
});