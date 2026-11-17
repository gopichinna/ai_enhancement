/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import MultiItemView from "d2/controls/multi.item/multi.item.view";

import CreateRelationPropertiesView from "d2/dialogs/create.relation/properties/create.relation.properties.view";

import ImportMetadataPropertiesView from "d2/dialogs/new.file/import/import.metadata.properties.view";

class CreateRelationMultiPropertiesView extends ImportMetadataPropertiesView {
  constructor(options = {}) {
    super(options);
  }
  initViews() {
    return $.Deferred().resolve({
      MultiItemView: MultiItemView,
      PropertiesView: CreateRelationPropertiesView
    });
  }
  onRender() {
    var me = this;
    this.initWizardAttributes();
    this.initViews().done(views => {
      var options = _.extend({
        itemDetailsViewClass: views.PropertiesView,
        parent: this,
        modelKey: "node",
        enableReorder: this.enableReorder,
        itemOptions: {
          operationType: "create",
          formMode: "create",
          action: "create",
          parent: this,
          wizard: this.wizard
        }
      }, this.options);
      this.multiItemView = new views.MultiItemView(options);
      this.importMetadataRegion.show(this.multiItemView);
      this.listenTo(this.multiItemView, "item:reorder", function() {
        this.updateApplyToRemainingBtnAsUnChecked();
        this.updateFooterButtons();
      });
      me.enableFooter();
    });
  }
}

Object.defineProperty(CreateRelationMultiPropertiesView.prototype.constructor, "name", {
  value: "CreateRelationMultiPropertiesView"
});

export default CreateRelationMultiPropertiesView;