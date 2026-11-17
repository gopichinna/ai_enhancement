/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import module from "module";

import _ from "nuc/lib/underscore";

import ToolItemMask from "csui/controls/toolbar/toolitems.mask";

import GlobalMenuItemsMask from "csui/utils/toolitem.masks/global.toolitems.mask";

import AviatorConfigModelFactory from "d2/utils/contexts/factories/aviator.config.model.factory";

import aviatorAssignmentsToolitems from "d2/widgets/admin/aviator.config/aviator.assignments.toolbaritems";

import AviatorAssignmentsCollectionFactory from "d2/utils/contexts/factories/aviator.assignments.collection.factory";

const aviatorDisabledMenuMask = {
  blacklist: [ "Aviator-AddAssignment", "Aviator-RemoveAssignment" ]
};

const aviatorDisabledRefreshMenuMask = {
  blacklist: [ "D2-RefreshList" ]
};

class AviatorAssignmentsToolbarItemsMasks {
  constructor(options = {}) {
    this.configModel = options.config || options.context.getModel(AviatorConfigModelFactory);
    this.assignmentCollection = options.collection || options.context.getCollection(AviatorAssignmentsCollectionFactory, {
      options: {
        expanded: true
      }
    });
    this.#initializeMasks();
    this.#evaluateAndApplyMask();
    this.configModel.on("change:is_enabled", this.#evaluateAndApplyMask.bind(this));
    this.assignmentCollection.on("update", this.checkAndApplyMaskForRefresh.bind(this));
    this.assignmentCollection.on("reset", this.checkAndApplyMaskForRefresh.bind(this));
  }
  #initializeMasks() {
    const toolbars = _.keys(aviatorAssignmentsToolitems), config = module.config();
    this.toolbars = _.reduce(toolbars, function(toolbars, toolbar) {
      const mask = new ToolItemMask(new GlobalMenuItemsMask(), {
        normalize: false
      });
      _.each(config, function(source) {
        source = source[toolbar];
        if (source) {
          mask.extendMask(source);
        }
      });
      mask.storeMask();
      toolbars[toolbar] = mask;
      return toolbars;
    }, {});
    AviatorAssignmentsToolbarItemsMasks.toolbars = toolbars;
  }
  #evaluateAndApplyMask() {
    const isEnabled = this.configModel.get("is_enabled") === true;
    if (isEnabled) {
      _.values(this.toolbars).forEach(toolBar => {
        toolBar.restoreMask();
      });
    } else {
      _.values(this.toolbars).forEach(toolBar => {
        toolBar.extendMask(aviatorDisabledMenuMask);
      });
    }
    this.checkAndApplyMaskForRefresh();
  }
  checkAndApplyMaskForRefresh() {
    var hideRefresh = this.assignmentCollection.isDirtyCollection;
    if (hideRefresh) {
      this.toolbars.rightToolbar.extendMask(aviatorDisabledRefreshMenuMask);
    } else {
      this.toolbars.rightToolbar.restoreMask();
    }
  }
}

Object.defineProperty(AviatorAssignmentsToolbarItemsMasks.prototype.constructor, "name", {
  value: "AviatorAssignmentsToolbarItemsMasks"
});

export default AviatorAssignmentsToolbarItemsMasks;