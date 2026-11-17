/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette3", "csui/utils/proxysettings/proxysettings.tabs/proxysettings.tabs" ], function($, _, Marionette, ProxysetingsTabs) {
  "use strict";
  var ProxySettingsTabsView = Marionette.CollectionView.extend({
    tagName: "div",
    className: "csui-proxysettings",
    constructor: function ProxySettingsTabsView(options) {
      options || (options = {});
      this.options = options;
      this.collection = ProxysetingsTabs;
      Marionette.CollectionView.prototype.constructor.call(this, options);
    },
    childView: function(proxysettingTabModel) {
      return proxysettingTabModel.get("viewClass");
    },
    childViewOptions: function(proxysettingTabModel) {
      return _.extend({
        context: this.options.context,
        connector: this.options.connector,
        userid: this.options.userid
      }, proxysettingTabModel.get("viewClassOptions"));
    },
    onRender: function() {
      var allFormsRendered = [];
      this.children.each(_.bind(function(childView) {
        var formRendered = $.Deferred();
        allFormsRendered.push(formRendered.promise());
        this.listenTo(childView, "childview:rendered", function() {
          formRendered.resolve();
        });
      }, this));
    }
  });
  return ProxySettingsTabsView;
});