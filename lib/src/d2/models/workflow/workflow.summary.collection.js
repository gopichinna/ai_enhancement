/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/utils/url", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/widget.constants" ], function(_, $, Backbone, ConnectableMixin, FetchableMixin, Url, RestLinkrels, RestResources, widgetConstants) {
  "use strict";
  var WFSummaryModel = Backbone.Model.extend({
    idAttribute: "category",
    defaults: {
      count: 0
    },
    constructor: function WFSummaryModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  var WFSummaryCollection = Backbone.Collection.extend({
    model: WFSummaryModel,
    widgetType: widgetConstants.D2.WORKFLOWS,
    constructor: function WFSummaryCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.widgetName = options && options.widgetName;
      this.makeConnectable(options).makeFetchable(options);
    },
    getHref: function() {
      return Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_MY_WORKFLOWS_STATUS_SUMMARY));
    },
    url: function() {
      var href = this.getHref(), qParams = {};
      if (this.widgetName) {
        qParams["widget-name"] = this.widgetName;
      }
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      return href;
    },
    parse: function(response) {
      return response && response.status_summary;
    }
  });
  ConnectableMixin.mixin(WFSummaryCollection.prototype);
  FetchableMixin.mixin(WFSummaryCollection.prototype);
  return WFSummaryCollection;
});