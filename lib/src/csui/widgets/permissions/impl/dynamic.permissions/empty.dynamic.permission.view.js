/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "i18n!csui/widgets/permissions/impl/nls/lang", "hbs!csui/widgets/permissions/impl/permissions.list/permissions.empty" ], function(Marionette, lang, emptyTemplate) {
  let NoPermissionsResultView = Marionette.ItemView.extend({
    className: "csui-table-empty",
    template: emptyTemplate,
    templateHelpers: function() {
      return {
        message: lang.emptyTableMsg
      };
    },
    constructor: function NoPermissionsResultView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  return NoPermissionsResultView;
});