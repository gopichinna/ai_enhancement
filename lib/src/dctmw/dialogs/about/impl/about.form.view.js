/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import TabPanelView from "smart/controls/tab.panel/tab.panel.view";

import TabLinkCollectionViewExt from "smart/controls/tab.panel/tab.links.ext.view";

import TabLinksScrollMixin from "smart/controls/tab.panel/tab.links.ext.scroll.mixin";

import TabContentsCollectionView from "smart/controls/tab.panel/tab.contents.view";

import getAboutTabs from "dctmw/dialogs/about/impl/about.tab";

class ScrollableTabContentsCollectionView extends TabContentsCollectionView {
  className() {
    let clazz = _.isFunction(super.className) ? super.className() : _.isString(super.className) ? super.className : "";
    return clazz;
  }
  onRender() {
    super.onRender();
    this.$el.css({
      overflow: "visible",
      height: "auto"
    });
  }
}

class AboutFormView extends TabPanelView {
  className() {
    let clazz = _.isFunction(super.className) ? super.className() : _.isString(super.className) ? super.className : "";
    return `about-content-view ${clazz}`;
  }
  constructor(options = {}) {
    const finalTabs = getAboutTabs(options);
    _.defaults(options, {
      tabType: "binf-nav-tabs",
      delayTabContent: false,
      toolbar: true,
      TabLinkCollectionViewClass: TabLinkCollectionViewExt,
      TabContentCollectionViewClass: ScrollableTabContentsCollectionView
    });
    options.tabs = finalTabs;
    super(options);
  }
  contentViewOptions(model) {
    const {
      context,
      config,
      blockingParentView,
      data
    } = this.options;
    return {
      context: context,
      config: config,
      model: model,
      blockingParentView: blockingParentView,
      data: data
    };
  }
  onRender() {
    this._initializeToolbars();
    this.intializeTabVars();
    this._listenToTabEvent();
  }
}

Object.assign(AboutFormView.prototype, TabLinksScrollMixin);

Object.defineProperty(AboutFormView.prototype.constructor, "name", {
  value: "AboutFormView"
});

export default AboutFormView;