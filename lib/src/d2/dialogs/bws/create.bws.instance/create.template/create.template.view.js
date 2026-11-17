/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Collection,
  Model
} from "nuc/lib/backbone";

import {
  LayoutView
} from "nuc/lib/marionette";

import TemplateListView from "d2/dialogs/bws/create.bws.instance/create.template/template.list.view";

import template from "hbs!d2/dialogs/bws/create.bws.instance/create.template/impl/create.template.layout";

import "css!d2/dialogs/bws/create.bws.instance/create.template/impl/create.template.layout";

class CreateTemplateView extends LayoutView {
  constructor(options) {
    super(options);
    this.fullCollection = options.fullCollection;
    this.collection = new Collection();
    this.#addTemplateInstanceItem(false);
    this.listenTo(this.fullCollection, "remove", this.#updateFileCount);
    this.listenTo(this.fullCollection, "reorder", this.#updateFileCount);
    this.listenTo(this.fullCollection, "change", this.#updateFileCount);
  }
  template = template;
  className() {
    return "d2-create-template";
  }
  regions() {
    return {
      TemplateListRegion: ".template-list-container"
    };
  }
  ui() {
    return {
      addWorkspace: ".add-workspace",
      header: ".header",
      workspaceCount: ".header .item-count"
    };
  }
  events() {
    return {
      "click @ui.addWorkspace": "onAddWSItem"
    };
  }
  templateHelpers() {
    return {
      addFileLabel: "Add Workspaces",
      filesTitle: "Workspaces",
      addFileToolTip: "Workspaces",
      addFileAria: "Add workspaces",
      iconName: "csui_action_add32"
    };
  }
  onRender() {
    this.#updateFileCount();
    let options = _.extend({
      templateSelectionView: this
    }, this.options);
    options.collection = this.fullCollection;
    this.templateListView = new TemplateListView(options);
    this.TemplateListRegion.show(this.templateListView);
  }
  #addTemplateInstanceItem(removable) {
    this.fullCollection.each(model => {
      model.set({
        is_new_entry: false,
        removable: true,
        canCancel: true
      });
    });
    this.fullCollection.add(new Model({
      name: "",
      removable: removable,
      is_ws_type: true,
      is_new_entry: true,
      type: this.options.data["bws-type-def"],
      isSaved: false,
      canCancel: removable
    }), {
      at: 0
    });
  }
  onAddWSItem() {
    this.#addTemplateInstanceItem(true);
    this.#updateFileCount();
    this.options.wizard.refreshFooter();
  }
  setWorkspaceCount(count) {
    if (count) {
      this.ui.workspaceCount.text("(" + count + ")");
    } else {
      this.ui.workspaceCount.text("");
    }
  }
  _refreshFooter(count) {
    count === this.collection.length ? this.enableFooter() : this.disableFooter();
  }
  #updateFileCount() {
    let count = 0;
    this.collection.reset(null);
    this.fullCollection.each(function(node) {
      if (node.get("isSaved")) this.collection.add(node);
      count++;
    }, this);
    this.setWorkspaceCount(count);
    this._refreshFooter(count);
    setTimeout(this.resetTabIndex.bind(this), 500);
  }
  resetTabIndex() {
    let tabElements = this.$("*[tabindex]");
    if (tabElements.length) {
      tabElements.prop("tabindex", 0);
    }
  }
  enableFooter() {
    this.footerDisabled = false;
    this.options.wizard.refreshFooter();
  }
  disableFooter() {
    this.footerDisabled = true;
    this.options.wizard.refreshFooter();
  }
  isValid() {
    const templateCollection = this.fullCollection.filter(model => {
      return model.get("isSaved");
    });
    return templateCollection.length === this.fullCollection.length;
  }
}

Object.defineProperty(CreateTemplateView.prototype.constructor, "name", {
  value: "CreateTemplateView"
});

export default CreateTemplateView;