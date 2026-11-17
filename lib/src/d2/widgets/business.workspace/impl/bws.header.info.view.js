/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  ItemView
} from "nuc/lib/marionette";

import template from "hbs!d2/widgets/business.workspace/impl/bws.header.info";

import "css!d2/widgets/business.workspace/impl/bws.header.info";

class BwsHeaderInfoView extends ItemView {
  template = template;
  className() {
    return "bws-header-info";
  }
  ui() {
    return {
      favoriteIcon: ".bws-favorite-icon"
    };
  }
  constructor(options) {
    super(options);
  }
  initialize() {
    this.listenTo(this.model, "change", this.render);
  }
  templateHelpers() {
    return {
      workspaceName: this.model.get("name"),
      workspaceSubTitle: this.model.get("bws_type_def_label_name"),
      workspaceDescription: this.model.get("bws_type_def_description")
    };
  }
  onRender() {
    const isFavorite = this.model.get("favorite");
    if (isFavorite) {
      this.ui.favoriteIcon.removeClass("binf-hidden");
    } else {
      this.ui.favoriteIcon.addClass("binf-hidden");
    }
  }
}

Object.defineProperty(BwsHeaderInfoView.prototype.constructor, "name", {
  value: "WorkSpaceHeaderInfoView"
});

export default BwsHeaderInfoView;