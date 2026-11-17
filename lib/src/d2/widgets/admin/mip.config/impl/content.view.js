/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import TabPanelView from "smart/controls/tab.panel/tab.panel.view";

import TabLinkCollectionViewExt from "smart/controls/tab.panel/tab.links.ext.view";

import TabLinksScrollMixin from "smart/controls/tab.panel/tab.links.ext.scroll.mixin";

import TabContentsCollectionView from "smart/controls/tab.panel/tab.contents.view";

import MipConfigFormContentView from "d2/widgets/admin/mip.config/impl/mip.config.form.content.view";

import lang from "i18n!d2/widgets/admin/mip.config/impl/nls/lang";

import "css!d2/widgets/admin/mip.config/impl/content";

class ScrollableTabContentsCollectionView extends TabContentsCollectionView {
  className() {
    let clazz = _.isFunction(super.className) ? super.className() : _.isString(super.className) ? super.className : "";
    return `csui-normal-scrolling ${clazz}`;
  }
}

class MipContentView extends TabPanelView {
  className() {
    let clazz = _.isFunction(super.className) ? super.className() : _.isString(super.className) ? super.className : "";
    return `mip-content-view ${clazz}`;
  }
  constructor(options = {}) {
    _.defaults(options, {
      mode: "spy",
      tabType: "binf-nav-tabs",
      delayTabContent: false,
      toolbar: true,
      TabLinkCollectionViewClass: TabLinkCollectionViewExt,
      TabContentCollectionViewClass: ScrollableTabContentsCollectionView,
      tabs: [ {
        title: lang.labelTabHeader,
        name: "mip_config",
        contentView: MipConfigFormContentView
      } ]
    });
    super(options);
  }
  contentViewOptions(model) {
    const {
      context,
      config,
      blockingParentView
    } = this.options;
    return {
      context: context,
      config: config,
      model: model,
      blockingParentView: blockingParentView
    };
  }
  onRender() {
    this._initializeToolbars();
    this.listenTo(this.tabContent?.children?.filter()[0]?.content, "mip:form:dirty", this.#relayChildDirtyEvent).listenTo(this.tabContent?.children?.filter()[0]?.content, "mip:form:state", this.#relayChildPartialEvent).listenTo(this.tabContent?.children?.filter()[0]?.content, "mip:state:tenant:dirty", this.#relayTenantAndConnectionTestEvent);
  }
  #relayChildDirtyEvent(options) {
    this.trigger("mip:form:dirty", options);
  }
  #relayChildPartialEvent(options) {
    this.trigger("mip:form:state", options);
  }
  #relayTenantAndConnectionTestEvent(options) {
    this.trigger("mip:state:tenant:dirty", options);
  }
}

Object.assign(MipContentView.prototype, TabLinksScrollMixin);

Object.defineProperty(MipContentView.prototype.constructor, "name", {
  value: "MipContentView"
});

export default MipContentView;