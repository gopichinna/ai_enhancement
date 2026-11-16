/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui-ext!csui/utils/proxysettings/proxysettings.tabs/proxysettings.tabs" ], function(_, Backbone, extraProxySettingTabs) {
  "use strict";
  var proxySettingsTab = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      viewClass: null,
      viewClassOptions: null,
      viewModel: null,
      enabled: function() {
        return true;
      }
    },
    constructor: function proxySettingsTab(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  var ProxySettingsTabCollection = Backbone.Collection.extend({
    model: proxySettingsTab,
    comparator: "sequence",
    constructor: function ProxySettingsTabCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });
  var proxySettingsTabs = new ProxySettingsTabCollection();
  addExtensions(extraProxySettingTabs);
  function addExtensions(extensions) {
    if (extensions) {
      var tabsToAdd = _.filter(_.flatten(extensions, true), function(tabToAdd) {
        return tabToAdd.enabled && _.isFunction(tabToAdd.enabled) ? tabToAdd.enabled() : tabToAdd.enabled === undefined ? true : tabToAdd.enabled;
      });
      proxySettingsTabs.add(tabsToAdd);
    }
  }
  return proxySettingsTabs;
});