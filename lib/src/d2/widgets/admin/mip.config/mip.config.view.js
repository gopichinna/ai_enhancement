/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  LayoutView
} from "nuc/lib/marionette";

import BlockingView from "smart/controls/progressblocker/blocker";

import LayoutViewEventsPropagationMixin from "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin";

import HeaderView from "d2/widgets/admin/mip.config/impl/header.view";

import ContentView from "d2/widgets/admin/mip.config/impl/content.view";

import template from "hbs!d2/widgets/admin/mip.config/impl/mip.config";

import MipConfigModelFactory from "d2/utils/contexts/factories/mip.config.model.factory";

import "css!d2/widgets/admin/mip.config/impl/mip.config";

const STATUS_NOT_FOUND = 404;

class MipAdminConfigView extends LayoutView {
  template = template;
  className() {
    return "mip-config-view";
  }
  regions() {
    return {
      rgnHeader: ".rgn-mip-config-header",
      rgnContent: ".rgn-mip-config-content"
    };
  }
  constructor(options = {}) {
    options.config = options.context.getModel(MipConfigModelFactory);
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
    this.rgnHeader.show(this.headerView);
    this.listenToOnce(this.options.config, "sync", () => {
      this.#renderContent({
        context: context,
        config: config,
        blockingParentView: blockingParentView
      });
    }).listenToOnce(this.options.config, "error", (model, xhr) => {
      if (xhr.status === STATUS_NOT_FOUND) {
        this.#renderContent({
          context: context,
          config: config,
          blockingParentView: blockingParentView
        });
      }
    });
  }
  #renderContent(options) {
    if (!this.contentView) {
      this.contentView = new ContentView(options);
      this.listenTo(this.contentView, "mip:form:dirty", this.#setHeaderDirty).listenTo(this.contentView, "mip:form:state", this.#setHeaderPartialDirty).listenTo(this.contentView, "mip:state:tenant:dirty", this.#setTenantAndConntectinTestDirty);
    }
    this.rgnContent.show(this.contentView);
  }
  #setHeaderDirty(options) {
    this.headerView.setDirtyFlag(options.isDirty);
  }
  #setHeaderPartialDirty(options) {
    this.headerView.setDisabledState(options.buttonState, options.buttonAttribute);
  }
  #setTenantAndConntectinTestDirty(options) {
    this.headerView.updateTenantAndConnectionCheckedFlag(options);
  }
  onBeforeDestroy() {
    this.headerView && this.headerView.destroy();
    this.contentView && this.contentView.destroy();
  }
}

Object.assign(MipAdminConfigView.prototype, LayoutViewEventsPropagationMixin);

Object.defineProperty(MipAdminConfigView.prototype.constructor, "name", {
  value: "MipAdminConfigView"
});

export default MipAdminConfigView;