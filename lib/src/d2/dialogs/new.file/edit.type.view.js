/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/dialogs/new.file/custom.profile.view", "i18n!d2/dialogs/new.file/impl/nls/lang", "css!d2/dialogs/new.file/impl/edit.type" ], function(_, $, CustomProfileView, lang) {
  "use strict";
  var EditTypeView = CustomProfileView.extend({
    className: "d2-new-content-edit-type",
    constructor: function EditTypeView(options) {
      options = options || {};
      options.preselectFromProfileData = true;
      CustomProfileView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      this.$el.addClass(this.className);
      return CustomProfileView.prototype.onRender.apply(this, arguments);
    },
    isEditMode: function() {
      return true;
    },
    onStepBeforeActive: function() {
      var refProfile = this.getReferenceProfile(), refValueConfig = this.getReferenceValueConfig();
      var refPresetId = refProfile && refProfile.presetModel && refProfile.presetModel.get("id");
      var refProfileId = refProfile && refProfile.get("id");
      var refValueConfigId = refValueConfig && refValueConfig.get("id");
      if (this._isRendered && (!this.lastPresetId || !this.lastProfileId || !this.lastValueConfigId || this.lastPresetId !== refPresetId || this.lastProfileId !== refProfileId || this.lastValueConfigId !== refValueConfigId)) {
        this.onProfileNameViewInitialRender();
      }
      return CustomProfileView.prototype.onStepBeforeActive && CustomProfileView.prototype.onStepBeforeActive.apply(this, arguments);
    },
    onStepBeforeInactive: function() {
      var refProfile = this.getReferenceProfile(), refValueConfig = this.getReferenceValueConfig();
      this.lastPresetId = refProfile && refProfile.presetModel && refProfile.presetModel.get("id");
      this.lastProfileId = refProfile && refProfile.get("id");
      this.lastValueConfigId = refValueConfig && refValueConfig.get("id");
    },
    getTitle: function() {
      return lang.customProfileTitleModeEdit;
    }
  });
  return EditTypeView;
});