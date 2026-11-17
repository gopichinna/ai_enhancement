/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/models/form", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "css!d2/dialogs/add.rendition/impl/add.rendition.view" ], function($, _, Backbone, FormModel, WizardTabableRegionBehavior, D2FormView, MetadataConverter) {
  "use strict";
  var AddRenditionView = D2FormView.extend({
    className: function() {
      return D2FormView.prototype.className.apply(this, arguments) + " add-rendition-form";
    },
    constructor: function AddRenditionView(options) {
      options || (options = {});
      options.node = options.collection;
      var form = MetadataConverter.convertConfig(options.formContent(), {
        actionMode: "create",
        layoutMode: "singleCol",
        extendFieldOptions: function(field) {
          field.getDataSourceCallBack = function() {
            return options.getDataSourceCallbackForCombo();
          };
        }
      });
      options.topAlignedLabel = false;
      options.model = new FormModel(form.propertiesConfig[0]);
      options.mode = "create";
      D2FormView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "valid:field", this._raiseValidChangeEvent);
      this.listenTo(this, "invalid:field", this._raiseInvalidChangeEvent);
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    }
  });
  return AddRenditionView;
});