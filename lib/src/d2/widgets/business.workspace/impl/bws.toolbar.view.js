/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  LayoutView
} from "nuc/lib/marionette";

import TableActionBarView from "csui/controls/tableactionbar/tableactionbar.view";

import DefaultActionBehavior from "csui/behaviors/default.action/default.action.behavior";

import template from "hbs!d2/widgets/business.workspace/impl/bws.toolbar";

import BWSToolbarItems from "d2/widgets/business.workspace/toolbar/toolbaritems";

import BWSToolbarItemsMask from "d2/widgets/business.workspace/toolbar/toolbaritems.masks";

class BWSToolBarView extends LayoutView {
  constructor(options = {}) {
    super(options);
  }
  onRender() {
    let defaultActionController = this.defaultActionController, toolbarCollection = BWSToolbarItems.perspectiveToolbar, toolbarItemsMasks = new BWSToolbarItemsMask(), toolBarOptions = {
      dropDownIconName: "csui_action_more32",
      maxItemsShown: 1,
      addGroupSeparators: true,
      context: this.options.context,
      originatingView: this.options.originatingView,
      model: this.options.businessWorkspaceModel,
      collection: toolbarCollection,
      container: this.options.businessWorkspaceModel,
      commands: defaultActionController.commands,
      toolItemsMask: toolbarItemsMasks.toolbars.perspectiveToolbar
    }, inlineToolBarView = new TableActionBarView(toolBarOptions);
    this.inlineActionRegion.show(inlineToolBarView);
  }
}

Object.assign(BWSToolBarView.prototype, {
  template: template,
  className: "ws-toolbar-container",
  behaviors: {
    DefaultAction: {
      behaviorClass: DefaultActionBehavior
    }
  },
  regions: {
    headerActionRegion: ".ws-header-action",
    inlineActionRegion: ".ws-inline-action"
  }
});

Object.defineProperty(BWSToolBarView.prototype.constructor, "name", {
  value: "BWSToolBarView"
});

export default BWSToolBarView;