/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/checkout/checkout.model", "nuc/utils/url", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/widget.constants", "nuc/utils/deepClone/deepClone" ], function(_, CheckoutModel, Url, RestResources, RestLinkrels, serverQueryUtils, widgetConstants) {
  "use strict";
  var AdminCheckoutCollection = CheckoutModel.extend({
    widgetType: widgetConstants.D2.ADMIN_CHECKOUT,
    constructor: function AdminCheckoutCollection() {
      CheckoutModel.prototype.constructor.apply(this, arguments);
    },
    url: function() {
      var links = RestResources.getCurrentRepository().get("links");
      var url = RestLinkrels.getLink(links, RestLinkrels.ADMIN_CHECKEDOUT_OBJECTS);
      if (this.expanded) {
        return serverQueryUtils.appendQueryParams(url, {
          scope: this,
          widgetName: this.options.widgetName,
          clientColumns: this.clientColumns,
          sort: !_.isEmpty(this.orderBy)
        });
      }
      return serverQueryUtils.appendQueryParams(url, {
        widgetName: this.options.widgetName
      });
    }
  });
  return AdminCheckoutCollection;
});