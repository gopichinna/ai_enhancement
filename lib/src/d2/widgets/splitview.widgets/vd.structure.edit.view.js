/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  LayoutView
} from "nuc/lib/marionette";

import VDocEditView from "d2/widgets/splitview.widgets/virtual.document.edit.view";

import VDocChildrenFactory from "d2/utils/contexts/factories/virtual.document.children.factory";

import vDocDefaultActionCommands from "d2/utils/commands/vdoc.default.actions";

import vDocDefaultActionItems from "d2/utils/vdoc.default.actionitems";

import VDocToolbarItems from "d2/utils/vdoc.toolbaritems";

import VDocToolbarItemsMask from "d2/widgets/splitview.widgets/impl/vdoc.edit.toolbaritems.mask";

import vdStructureTemplate from "hbs!d2/widgets/splitview.widgets/impl/vd.structure.edit";

import ConnectorFactory from "csui/utils/contexts/factories/connector";

import CmdGoBack from "d2/commands/go.back";

import "css!d2/widgets/splitview.widgets/impl/vd.structure.edit";

import PubSub from "csui/controls/form/pub.sub";

class VdStructureEditView extends LayoutView {
  template = vdStructureTemplate;
  vdocStructure = null;
  vdCollection = null;
  titleView = null;
  className() {
    let classname = "vd-structure-edit";
    classname += this.options.isForComparing ? " vd-structure-compare-block" : "";
    return classname;
  }
  ui() {
    return {
      title: ".vd-edit--title",
      closeBtn: ".vd-edit--header .vd-edit--close",
      vdStructureUiContainer: ".vd-structure--container"
    };
  }
  regions() {
    return {
      titleContainer: "@ui.title",
      vdStructureContainer: "@ui.vdStructureUiContainer"
    };
  }
  events() {
    return {
      "click @ui.closeBtn": "onClickClose"
    };
  }
  templateHelpers() {
    return {
      modelName: this.options.model.get("name")
    };
  }
  onClickClose(e) {
    if (!this.options.isForComparing) {
      this.trigger("vdoc:navigation:back", e);
      if (!e.isDefaultPrevented()) {
        new CmdGoBack().execute({
          context: this.options.context,
          restoreLastFragment: true
        });
      }
    } else {
      this.trigger("close:vdoc:compare:block", this);
    }
  }
  constructor(options) {
    super(options);
    this.options = options || {};
  }
  onRender() {
    let me = this;
    this.vdocStructure = this.createVDocEditView();
    this.vdStructureContainer.show(this.vdocStructure);
    this.vdCollection.fetch();
    PubSub.on("compareVd:scroll:up", () => {
      let $tbody = me.$el.find(".d2-vd-structure table tbody");
      $tbody.scrollTop($tbody.scrollTop() - 24);
    });
    PubSub.on("compareVd:scroll:down", () => {
      let $tbody = me.$el.find(".d2-vd-structure table tbody");
      $tbody.scrollTop($tbody.scrollTop() + 24);
    });
  }
  createVDocEditView() {
    this.vdCollection = this.options.context.getCollection(VDocChildrenFactory, {
      attributes: {
        id: this.options.model.get("id")
      },
      options: {
        node: this.options.model,
        exploreAsSnapshot: false
      }
    });
    let toolbarItems = _.clone(VDocToolbarItems);
    toolbarItems.inlineActionbar = toolbarItems.editVDInlineActionbar;
    toolbarItems.inlineActionbar.options = _.extend({
      toolItemsMask: new VDocToolbarItemsMask().toolbars.editVDInlineActionbar
    }, toolbarItems.inlineActionbar.options);
    let toolbarItemsMask = {
      toolbars: {
        inlineActionbar: new VDocToolbarItemsMask(this.options).toolbars.editVDInlineActionbar
      }
    };
    let args = {
      context: this.options.context,
      connector: this.options.context.getObject(ConnectorFactory),
      model: this.options.model,
      collection: this.vdCollection,
      originatingView: this.options.originatingView,
      parentView: this,
      snapshotView: false,
      container: this.options.model.clone(),
      isVDEditView: true,
      defaultActionItems: this.options.defaultActionItems || vDocDefaultActionItems,
      defaultActionCommands: this.options.defaultActionCommands || vDocDefaultActionCommands,
      toolItemFactory: toolbarItems,
      toolbarItemsMask: toolbarItemsMask,
      isForComparing: this.options.isForComparing
    };
    return new VDocEditView(args);
  }
}

export default VdStructureEditView;