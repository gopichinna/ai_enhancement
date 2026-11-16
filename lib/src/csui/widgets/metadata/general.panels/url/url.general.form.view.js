/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/widgets/metadata/general.panels/node/node.general.form.view", "hbs!csui/widgets/metadata/general.panels/url/impl/url.general.form", "css!csui/widgets/metadata/general.panels/url/impl/url.general.form" ], function(_, NodeGeneralFormView, formTemplate) {
  "use strict";
  var UrlGeneralFormView = NodeGeneralFormView.extend({
    constructor: function UrlGeneralFormView(options) {
      NodeGeneralFormView.prototype.constructor.call(this, options);
    },
    formTemplate: formTemplate,
    _getBindings: function() {
      var bindings = NodeGeneralFormView.prototype._getBindings.apply(this, arguments);
      return _.extend(bindings, {
        url: ".url_section"
      });
    }
  });
  return UrlGeneralFormView;
});