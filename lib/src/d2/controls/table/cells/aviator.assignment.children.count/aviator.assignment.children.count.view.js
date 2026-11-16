/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import i18n from "i18n";

import CellView from "csui/controls/table/cells/cell/cell.view";

import cellViewRegistry from "csui/controls/table/cells/cell.registry";

import AviatorConfigModelFactory from "d2/utils/contexts/factories/aviator.config.model.factory";

import lang from "i18n!d2/controls/table/cells/aviator.assignment.children.count/impl/nls/lang";

import template from "hbs!d2/controls/table/cells/aviator.assignment.children.count/impl/aviator.assignment.children.count";

import "css!d2/controls/table/cells/aviator.assignment.children.count/impl/aviator.assignment.children.count";

import "smart/lib/binf/js/binf";

class AviatorChildrenCountCellView extends CellView {
  template = template;
  className() {
    return "csui-nowrap";
  }
  ui() {
    return {
      popoverHandle: ".count-value"
    };
  }
  events() {
    return {
      focusout: "_onFocusOut",
      "keyup @ui.popoverHandle": "_handleKeyupOnPopover"
    };
  }
  constructor(options = {}) {
    super(options);
    this.configModel = options.config || options.context.getModel(AviatorConfigModelFactory);
  }
  renderValue() {
    const cellValue = this.#getCellValue();
    const pct = cellValue / this.configModel.get("av4r_max_documents_per_assignment") * 100;
    const tmplData = {
      data: cellValue,
      title: this.getValueText(),
      percentage: pct,
      addlContainerClassname: pct > 100 ? "overflow" : ""
    };
    let html = "";
    if (_.isNumber(tmplData.data) && !_.isNaN(tmplData.data)) {
      tmplData.data = "" + tmplData.data;
      html = this.template(tmplData);
    }
    this.$el.html(html);
  }
  render() {
    const retVal = super.render();
    const maxChildrenCount = this.configModel.get("av4r_max_documents_per_assignment");
    let childrenCount = this.#getCellValue();
    if (childrenCount === "") {
      childrenCount = 0;
    }
    let langKey;
    if (childrenCount < maxChildrenCount) {
      langKey = lang.childrenCountTooltipBelowLimit;
    } else if (childrenCount === maxChildrenCount) {
      langKey = lang.childrenCountTooltipAtLimit;
    } else {
      langKey = lang.childrenCountTooltipBeyondLimit;
    }
    $(this.ui.popoverHandle).binf_popover({
      content: `<span>${_.str.sformat(langKey, Math.abs(maxChildrenCount - childrenCount), lang.assignmentType)}</span>`,
      html: true,
      container: $.fn.binf_modal.getDefaultContainer(),
      template: '<div class="binf-popover bordered-popover av4r-children-count-popover" role="tooltip"><div class="binf-arrow"></div><div class="binf-popover-content"></div></div>',
      placement: i18n.settings.rtl ? "right" : "left"
    });
    return retVal;
  }
  #getCellValue() {
    return this.options.column ? CellView.getValue(this.model, this.options.column) : "";
  }
  _onFocusOut() {
    this.#triggerMethodOnPopover("hide");
  }
  _handleKeyupOnPopover(event) {
    if (event?.keyCode === 13 || event?.keyCode === 32) {
      this.#triggerMethodOnPopover("toggle");
    }
  }
  #triggerMethodOnPopover(method) {
    this.ui.popoverHandle.length && this.ui.popoverHandle.binf_popover(method);
  }
  onBeforeDestroy() {
    this.#triggerMethodOnPopover("destroy");
  }
}

Object.assign(AviatorChildrenCountCellView, {
  hasFixedWidth: false,
  columnClassName: "table-cell-av4r_assignment_children_count"
});

Object.defineProperty(AviatorChildrenCountCellView.prototype.constructor, "name", {
  value: "AviatorChildrenCountCellView"
});

cellViewRegistry.registerByColumnKey("av4r_children_count", AviatorChildrenCountCellView);

export default AviatorChildrenCountCellView;