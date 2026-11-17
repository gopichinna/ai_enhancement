/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "esoc/widgets/userwidget/view/simple.userwidget.form.view", "i18n!esoc/widgets/userwidget/nls/lang" ], function(UserProfileForm, lang) {
  "use strict";
  return [ {
    tabName: "userprofile",
    tabDisplayName: lang.profile,
    tabContentView: UserProfileForm,
    showTab: function(model, options) {
      return true;
    }
  } ];
});