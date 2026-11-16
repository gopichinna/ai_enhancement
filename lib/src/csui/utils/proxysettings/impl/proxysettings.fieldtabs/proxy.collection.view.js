/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/base", "csui/lib/backbone", "csui/lib/marionette", "i18n!csui/utils/proxysettings/impl/nls/lang", "csui/utils/proxysettings/impl/proxysettings.fieldtabs/proxy.item.view", "css!csui/utils/proxysettings/impl/proxysettingstab" ], function(_, $, base, Backbone, Marionette, lang, ProxyItem) {
  "use strict";
  var ProxyCollectionView = Marionette.CollectionView.extend({
    constructor: function NodeAuditView(options) {
      this.collection = options.collection;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },
    className: "proxy-collection",
    childView: ProxyItem,
    childViewOptions: function() {
      return {
        parentOptions: this.options
      };
    }
  });
  return ProxyCollectionView;
});