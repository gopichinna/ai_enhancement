/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import CSUITableToolbarView from "csui/controls/tabletoolbar/tabletoolbar.view";

import utils from "dctmw/utils/utils";

class TabletoolbarView extends CSUITableToolbarView {
  #selectionToolbarName;
  constructor(options = {}) {
    super(options);
    this.#selectionToolbarName = utils.isNonEmptyString(options.selectionToolbarName) ? options.selectionToolbarName : "";
    this.listenTo(this.selectedNodes, "update reset", this.#updateToolbarVisibility);
  }
  onRender() {
    this.#updateToolbarVisibility();
    super.onRender();
  }
  #updateToolbarVisibility() {
    const hasSelection = this.selectedNodes.length > 0;
    this.toolbarNames.forEach(toolbarName => {
      const showsOnSelection = toolbarName === this.#selectionToolbarName ? hasSelection : !this.#selectionToolbarName || !hasSelection;
      const view = this[toolbarName + "ToolbarView"];
      if (view) {
        view.$el[showsOnSelection ? "removeClass" : "addClass"]("binf-hidden");
      }
    });
  }
}

Object.defineProperty(TabletoolbarView.prototype.constructor, "name", {
  value: "TabletoolbarView"
});

export default TabletoolbarView;