/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/models/form", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "css!d2/dialogs/export.collection/impl/export.to.collection.view" ], function($, _, Backbone, FormModel, WizardTabableRegionBehavior, D2FormView, MetadataConverter) {
  "use strict";
  const ExpotToCollectionView = D2FormView.extend({
    className: function() {
      return D2FormView.prototype.className.apply(this, arguments) + " export-data-form";
    },
    constructor: function ExpotToCollectionView(options) {
      options || (options = {});
      this.node = options.collection;
      const form = MetadataConverter.convertConfig(options.formContent, {
        actionMode: "create",
        layoutMode: "singleCol"
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
    }
  });
  return ExpotToCollectionView;
});