/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/models/form", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "d2/utils/user.utils", "css!d2/dialogs/share.collections/impl/share.collection.view" ], function($, _, Backbone, FormModel, WizardTabableRegionBehavior, D2FormView, MetadataConverter, UserUtils) {
  "use strict";
  var ShareCollectionView = D2FormView.extend({
    className: function() {
      return D2FormView.prototype.className.apply(this, arguments) + " share-collection-form";
    },
    constructor: function ShareCollectionView(options) {
      options || (options = {});
      this.setUsersNGroupsData(options.formContent["user-details"]);
      var _self = this, form = MetadataConverter.convertConfig(options.formContent, {
        actionMode: "create",
        layoutMode: "singleCol",
        extendFieldOptions: function(field) {
          field.getDataSourceCallBack = function(_attr, _alpField) {
            var dfd = $.Deferred();
            return dfd.promise();
          };
        }
      });
      options.topAlignedLabel = false;
      options.model = new FormModel(form.propertiesConfig[0]);
      options.model.get("schema")["initial_invalid"] = true;
      options.mode = "create";
      D2FormView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "valid:field", this._raiseValidChangeEvent);
      this.listenTo(this, "invalid:field", this._raiseInvalidChangeEvent);
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    setUsersNGroupsData: function(usersDump) {
      if (!this.userData) {
        this.userData = [];
      }
      this.userData = usersDump;
    },
    getUsersNGroups: function(context) {
      return UserUtils.getUsersNGroups(context);
    }
  });
  return ShareCollectionView;
});