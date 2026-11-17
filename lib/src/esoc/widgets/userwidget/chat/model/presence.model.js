/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "i18n!esoc/widgets/userwidget/nls/lang" ], function($, _, Backbone, Lang) {
  var PresenceModel = Backbone.Model.extend({
    defaults: {
      status: "Unknown",
      tooltipText: Lang.presenceUnknownTooltipText
    },
    constructor: function PresenceModel(options) {
      this.options = options;
      Backbone.Model.prototype.constructor.apply(this, arguments);
      if (options && options.connector) {
        options.connector.assignTo(this);
      }
    }
  });
  return PresenceModel;
});