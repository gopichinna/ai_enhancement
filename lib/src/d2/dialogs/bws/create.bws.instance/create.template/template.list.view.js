/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  ItemView
} from "nuc/lib/marionette";

import SmartListView from "smart/controls/list/list.view";

import NodeTypeIconView from "csui/controls/node-type.icon/node-type.icon.view";

import lang from "i18n!d2/dialogs/bws/create.bws.instance/create.template/impl/nls/lang";

import templateItem from "hbs!d2/dialogs/bws/create.bws.instance/create.template/impl/template.list.item";

import template from "hbs!d2/dialogs/bws/create.bws.instance/create.template/impl/template.list";

import "css!d2/dialogs/bws/create.bws.instance/create.template/impl/template.list";

class TemplateItemView extends ItemView {
  template = templateItem;
  templateHelpers() {
    return {
      WSPlaceholderLabel: lang.WSPlaceholderLabel,
      name: this.model.get("name"),
      removable: this.model.get("removable"),
      is_new_entry: this.model.get("is_new_entry"),
      isSaved: this.model.get("isSaved"),
      canCancel: this.model.get("canCancel"),
      errorMessage: lang.emptyErrorMessage
    };
  }
  ui() {
    return {
      wsIcon: ".ws-icon",
      deleteIcon: ".icon-delete",
      renameIcon: ".icon-rename",
      renameContainer: ".rename-container",
      wsName: ".ws-name",
      templateIcons: ".template-icons",
      cancelEdit: ".icon-cancel",
      renameButton: ".icon-approve",
      renameInput: ".rename-input",
      errorContainer: ".csui-inlineform-group-error"
    };
  }
  events() {
    return {
      "click @ui.deleteIcon": "deleteWsInstance",
      "click @ui.renameIcon": "renameWsInstance",
      "click @ui.cancelEdit": "cancelRename",
      "click @ui.renameButton": "renameTemplate",
      "change @ui.renameInput": "changeInTemplateName"
    };
  }
  constructor(options) {
    options = options || {};
    super(options);
    this.listenTo(this.model, "change", this.render);
    this.listenTo(this, "new:template:added", this.render);
  }
  onRender() {
    this.iconView = new NodeTypeIconView({
      el: this.ui.wsIcon.get(0),
      node: this.model
    });
    this.iconView.render();
  }
  onShow() {
    this.ui.renameInput.trigger("focus");
  }
  changeInTemplateName() {
    this.model.set({
      oldVal: this.model.get("name"),
      name: this.ui.renameInput.val()
    }, {
      silent: true
    });
  }
  deleteWsInstance() {
    this.options.parentCollection.remove(this.model);
    if (this.options.parentCollection.length === 1) {
      this.options.parentCollection.first().set({
        removable: false,
        canCancel: false
      });
    }
  }
  renameWsInstance() {
    this.model.set({
      isSaved: false
    });
    this.ui.wsName.addClass("binf-hidden");
    this.ui.renameContainer.removeClass("binf-hidden");
    this.ui.templateIcons.addClass("binf-hidden");
    this.ui.renameInput.val(this.model.get("name"));
  }
  cancelRename() {
    let shouldDeleteWSInstance = this.model.get("is_new_entry");
    if (shouldDeleteWSInstance || !this.model.get("oldVal")) {
      this.deleteWsInstance();
    } else {
      this.model.get("oldVal") && this.model.set({
        name: this.model.get("oldVal")
      });
      this.model.set({
        isSaved: true
      });
      this.ui.wsName.removeClass("binf-hidden");
      this.ui.renameContainer.addClass("binf-hidden");
      this.ui.templateIcons.removeClass("binf-hidden");
    }
  }
  validateWSInstance() {
    if (!this.model.get("name")) {
      this.ui.errorContainer.removeClass("binf-hidden");
    } else {
      this.ui.errorContainer.addClass("binf-hidden");
    }
  }
  renameTemplate() {
    if (this.model.get("name")) {
      this.model.set({
        isSaved: true,
        is_new_entry: false,
        oldVal: null
      });
      this.trigger("new:template:added");
    }
    this.validateWSInstance();
  }
}

Object.defineProperty(TemplateItemView.prototype.constructor, "name", {
  value: "TemplateItemView"
});

class TemplateListView extends SmartListView {
  childView = TemplateItemView;
  template = template;
  childViewContainer = "> .cs-content > .cs-list-group";
  constructor(options) {
    options = options || {};
    super(options);
  }
  childEvents() {
    return {
      "new:template:added": this.refreshDialogFooter
    };
  }
  refreshDialogFooter() {
    this.options.wizard.refreshFooter();
  }
  childViewOptions(model) {
    return {
      itemView: this.options.itemView,
      itemIndex: this.collection.indexOf(model),
      parentCollection: this.collection,
      parentView: this.options.parentView,
      listView: this
    };
  }
}

Object.defineProperty(TemplateListView.prototype.constructor, "name", {
  value: "TemplateListView"
});

export default TemplateListView;