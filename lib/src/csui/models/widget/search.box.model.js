/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/utils/url", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/models/widget/search.box/server.adaptor.mixin" ], function(_, $, Backbone, Url, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";
  var SearchBoxModel = Backbone.Model.extend({
    constructor: function SearchBoxModel(models, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, models, options);
      this.makeConnectable(options).makeFetchable(options).makeServerAdaptor(options);
    }
  });
  ConnectableMixin.mixin(SearchBoxModel.prototype);
  FetchableMixin.mixin(SearchBoxModel.prototype);
  ServerAdaptorMixin.mixin(SearchBoxModel.prototype);
  _.extend(SearchBoxModel.prototype, {
    isFetchable: function() {
      return !!this.options;
    }
  });
  return SearchBoxModel;
});