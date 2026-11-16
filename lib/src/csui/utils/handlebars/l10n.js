/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/handlebars", "csui/utils/base" ], function(Handlebars, base) {
  Handlebars.registerHelper("csui-l10n", function(value) {
    return base.getClosestLocalizedString(value);
  });
  Handlebars.registerHelper("with", function(context, options) {
    return options.fn(context);
  });
  return Handlebars.helpers["csui-l10n", "with"];
});