/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  LayoutView
} from "nuc/lib/marionette";

import BlockingView from "smart/controls/progressblocker/blocker";

import LayoutViewEventsPropagationMixin from "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin";

import AviatorConfigModelFactory from "d2/utils/contexts/factories/aviator.config.model.factory";

import HeaderView from "d2/widgets/admin/aviator.config/impl/header.view";

import ContentView from "d2/widgets/admin/aviator.config/impl/content.view";

import template from "hbs!d2/widgets/admin/aviator.config/impl/aviator.config";

import "css!d2/widgets/admin/aviator.config/impl/aviator.config";

class AviatorConfigView extends LayoutView {
  template = template;
  className() {
    return "av4r-config-view";
  }
  regions() {
    return {
      rgnHeader: ".rgn-av4r-config-header",
      rgnContent: ".rgn-av4r-config-content"
    };
  }
  constructor(options = {}) {
    options.config = options.context.getModel(AviatorConfigModelFactory);
    super(options);
    this.propagateEventsToRegions();
    if (this.options.blockingParentView) {
      BlockingView.delegate(this, this.options.blockingParentView);
    } else {
      BlockingView.imbue(this);
    }
  }
  onRender() {
    const {
      context,
      config,
      blockingParentView = this
    } = this.options;
    if (!this.headerView) {
      this.headerView = new HeaderView({
        context: context,
        config: config,
        blockingParentView: blockingParentView
      });
    }
    if (!this.contentView) {
      this.contentView = new ContentView({
        context: context,
        config: config,
        blockingParentView: blockingParentView
      });
    }
    this.rgnHeader.show(this.headerView);
    this.rgnContent.show(this.contentView);
  }
  onBeforeDestroy() {
    this.headerView && this.headerView.destroy();
    this.contentView && this.contentView.destroy();
  }
}

Object.assign(AviatorConfigView.prototype, LayoutViewEventsPropagationMixin);

Object.defineProperty(AviatorConfigView.prototype.constructor, "name", {
  value: "AviatorConfigView"
});

export default AviatorConfigView;