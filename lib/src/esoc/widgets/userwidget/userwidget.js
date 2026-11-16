/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/utils/connector", "esoc/controls/userwidget/userwidget.view", "csui/utils/contexts/factories/connector" ], function(module, _require, $, _, Marionette, Connector, UserWidgetView, ConnectorFactory) {
  var UserWidget = {
    getUser: function(options) {
      $(options.placeholder).ready(function() {
        var userWidgetView, contentRegion = new Marionette.Region({
          el: $(options.placeholder)
        });
        if (!options.connector) {
          options.connector = options.context.getObject(ConnectorFactory);
        }
        var userOptions = _.extend({}, options);
        UserWidgetView = !!UserWidgetView ? UserWidgetView : _require("esoc/controls/userwidget/userwidget.view");
        userWidgetView = new UserWidgetView(userOptions);
        contentRegion.show(userWidgetView);
      });
    }
  };
  return UserWidget;
});