/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "hbs!csui/widgets/permissions/impl/edit/apply.permission/impl/header/apply.permission.header", "i18n!csui/widgets/permissions/impl/edit/apply.permission/impl/nls/lang", "smart/themes/theming", "csui/themes/csui.jato.status.icons", "css!csui/widgets/permissions/impl/permissions" ], function(_, $, Marionette, applyPermissionHeaderTemplate, lang, theming, csuiStatusIcons) {
  "use strict";
  var ApplyPermissionHeaderView = Marionette.ItemView.extend({
    template: applyPermissionHeaderTemplate,
    templateHelpers: function() {
      var headerTitle = "";
      if (this.options.removePermission) {
        var memberName = this.options.permissionModel && this.options.permissionModel.get("right_id_expand") && this.options.permissionModel.get("right_id_expand").name_formatted;
        memberName = this.options.permissionModel && this.options.permissionModel.get("type") === "public" ? lang.publicAccess : memberName;
        headerTitle = _.str.sformat(lang.removePermissionHeaderTitle, memberName);
      } else if (this.options.restorePublicAccess) {
        headerTitle = lang.restorePublicAccessHeaderTitle;
      } else {
        headerTitle = lang.applyPermissionHeaderTitle;
      }
      return {
        title: headerTitle,
        isJATO: theming.isJATOTheme(),
        statusInfo: csuiStatusIcons.statusInfo
      };
    },
    constructor: function ApplyPermissionHeaderView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  return ApplyPermissionHeaderView;
});