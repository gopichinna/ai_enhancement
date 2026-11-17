/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import TabableRegionBehavior from "csui/behaviors/keyboard.navigation/tabable.region.behavior";

import LayoutViewEventsPropagationMixin from "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin";

import DialogFooterView from "d2/controls/dialog/impl/footer.view";

import template from "hbs!d2/dialogs/facet.dialog/impl/footer/footer";

import {
  Collection
} from "nuc/lib/backbone";

import {
  LayoutView
} from "nuc/lib/marionette";

class FacetFooterView extends LayoutView {
  template = template;
  constructor(options = {}) {
    super(options);
  }
  regions() {
    return {
      rgnFooterButtons: ".d2-footer-buttons"
    };
  }
  behaviors() {
    return {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    };
  }
  isTabable() {
    return this.$("*[tabindex]").length > 0;
  }
  initialize() {
    this.footerView = new DialogFooterView({
      collection: new Collection(this.options.buttons || [])
    });
    this.listenTo(this.footerView, "childview:click", this.onClickButton);
    this.propagateEventsToRegions();
  }
  onRender() {
    this.rgnFooterButtons.show(this.footerView);
  }
  onClickButton(view) {
    let fnClick = view.model?.get("click"), close = view.model?.get("close");
    if (fnClick) {
      fnClick({
        dialog: this,
        button: this.$el
      });
    }
    if (close) {
      this.destroy();
    }
  }
}

LayoutViewEventsPropagationMixin.mixin(FacetFooterView.prototype);

Object.defineProperty(FacetFooterView.prototype.constructor, "name", {
  value: "FacetFooterView"
});

export default FacetFooterView;