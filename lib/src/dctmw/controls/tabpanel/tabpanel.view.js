/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import NonEmptyingRegion from "csui/utils/non-emptying.region/non-emptying.region";

import SmartTabPanelView from "smart/controls/tab.panel/tab.panel.view";

import TabLinkCollectionViewExt from "smart/controls/tab.panel/tab.links.ext.view";

import TabLinksScrollMixin from "smart/controls/tab.panel/tab.links.ext.scroll.mixin";

import TabContentsCollectionView from "smart/controls/tab.panel/tab.contents.view";

import TabContentView from "smart/controls/tab.panel/tab.content.view";

import TabContentHeaderView from "dctmw/controls/tabpanel/tab.content.header.view";

import "css!dctmw/controls/tabpanel/impl/tabpanel";

class HeaderfulTabContentView extends TabContentView {
  constructor(options = {}) {
    super(options);
    this.contentRegion.destroy();
    this.contentRegion = new NonEmptyingRegion({
      el: this.el,
      prependChild: true
    });
  }
  _createContent(options = {}) {
    if (options.drawTabHeader === true && !this.headerView) {
      this.headerView = new TabContentHeaderView(this.options);
    }
    const ContentView = this._getContentView(), contentViewOptions = this._getContentViewOptions(), fullOptions = Object.assign({
      model: this.model
    }, contentViewOptions);
    this.content = new ContentView(fullOptions);
    this.propagateEventsToViews(this.content);
  }
  _renderContent() {
    super._renderContent();
    if (this.headerView) {
      this.contentRegion.show(this.headerView, {
        preventDestroy: true
      });
    }
  }
  _destroyContent() {
    if (this.content) {
      this.cancelEventsToViewsPropagation(this.content);
      this.contentRegion.reset();
      this.content.destroy();
      this.content = undefined;
    }
    this.headerView?.destroy();
  }
}

class ScrollableTabContentsCollectionView extends TabContentsCollectionView {
  childView = HeaderfulTabContentView;
  className() {
    let clazz = _.isFunction(super.className) ? super.className() : _.isString(super.className) ? super.className : "";
    return `csui-normal-scrolling ${clazz}`;
  }
  childViewOptions(model, index) {
    const opts = super.childViewOptions(model, index);
    return Object.assign(opts, {
      model: model
    });
  }
}

class CustomTabLinksCollectionView extends TabLinkCollectionViewExt {
  childViewOptions(model, index) {
    const opts = super.childViewOptions(model, index);
    return Object.assign(opts, {
      model: model
    });
  }
}

class TabpanelView extends SmartTabPanelView {
  static TabLinkCollectionViewClass = CustomTabLinksCollectionView;
  static TabContentCollectionViewClass = ScrollableTabContentsCollectionView;
  static TabContentView = HeaderfulTabContentView;
  className() {
    let clazz = _.isFunction(super.className) ? super.className() : _.isString(super.className) ? super.className : "";
    return `d4-tabpanel-view ${clazz}`;
  }
  constructor(options = {}) {
    _.defaults(options, {
      mode: "spy",
      tabType: "binf-nav-tabs",
      delayTabContent: false,
      toolbar: true,
      TabLinkCollectionViewClass: CustomTabLinksCollectionView,
      TabContentCollectionViewClass: ScrollableTabContentsCollectionView
    });
    if (!_.isArray(options.tabs) || !options.tabs.length) {
      throw new Error("TabpanelView cannot be instatiated without constructor option tabs");
    }
    super(options);
  }
  contentViewOptions(model) {
    const {
      context,
      blockingParentView
    } = this.options;
    return {
      context: context,
      model: model,
      blockingParentView: blockingParentView
    };
  }
  onRender() {
    this._initializeToolbars();
    this.intializeTabVars();
    this._listenToTabEvent();
  }
  _destroyContent() {
    super._destroyContent();
    if (this.tabLinks && this.tabContent && !this.tabContent._isDestroyed) {
      this?.contentWrapperRegion?.empty();
    }
  }
}

Object.assign(TabpanelView.prototype, TabLinksScrollMixin);

Object.defineProperty(TabpanelView.prototype.constructor, "name", {
  value: "TabpanelView"
});

export default TabpanelView;