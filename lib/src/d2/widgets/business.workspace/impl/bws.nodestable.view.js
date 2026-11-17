/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import NodesTableView from "csui/widgets/nodestable/nodestable.view";

import LayoutViewEventsPropagationMixin from "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin";

import constants from "d2/utils/constants";

import lang from "i18n!d2/widgets/business.workspace/impl/nls/lang";

import "css!d2/widgets/business.workspace/impl/business.workspace";

class BWSNodestableView extends NodesTableView {
  constructor(options = {}) {
    super(options);
  }
  getTreeRootNode() {
    return this.options.businessWorkspaceModel.get("id");
  }
  onRender() {
    super.onRender.call(this);
    if (this.tableToolbarView?.captionView) {
      this.listenTo(this.tableToolbarView.captionView, "render", this.#updateTableHeader.bind(this));
      this.listenTo(this.tableToolbarView.captionView.model, "change", this.#updateTableHeader.bind(this));
    }
    this.#updateTableHeader();
  }
  #updateTableHeader() {
    let $staticWSHeader = this.tableToolbarView.$el.find(".bws-static-header");
    if ($staticWSHeader.length > 0) {
      $staticWSHeader.remove();
    }
    if (this.container?.get("type") === constants.Types.BWS) {
      this.tableToolbarView.captionView.$el.addClass("binf-hidden");
      this.tableToolbarView.captionView.$el.after('<div class="bws-static-header">' + lang.bwsTableHeader + "</div>");
    } else {
      this.tableToolbarView.captionView.$el.removeClass("binf-hidden");
    }
  }
}

Object.assign(BWSNodestableView.prototype, {
  className: function() {
    const classNames = NodesTableView.prototype.className.call(this);
    return `${classNames} bw-nodestable`;
  }
});

LayoutViewEventsPropagationMixin.mixin(BWSNodestableView.prototype);

Object.defineProperty(BWSNodestableView.prototype.constructor, "name", {
  value: "BWSNodestableView"
});

export default BWSNodestableView;