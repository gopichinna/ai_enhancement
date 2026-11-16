/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "esoc/controls/userwidget/userwidget.view" ], function(require, $, _, UserWidgetView) {
  "use strict";
  UserWidgetView.prototype.onRender = function() {
    require([ "esoc/widgets/userwidget/util" ], _.bind(function(userwidgetUtil) {
      if (this.options.model.get("photo_url")) {
        var userProfilePicOptions = {
          userModel: this.options.model,
          context: this.options.context,
          userid: this.options.userid,
          viewShownEvent: this.options.viewShownEvent,
          parentView: this.options.parentView,
          photoElement: this.$el.find('[class*="esoc-userprofile-img-' + userwidgetUtil.escapeSelector(this.options.userid) + '"]'),
          defaultPhotElement: this.$el.find('[class*="esoc-user-default-avatar-' + userwidgetUtil.escapeSelector(this.options.userid) + '"]')
        };
        userwidgetUtil.commonUtil.setProfilePic(userProfilePicOptions);
      }
    }, this));
  };
});