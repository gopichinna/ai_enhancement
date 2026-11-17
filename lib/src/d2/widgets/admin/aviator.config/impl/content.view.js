/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import TabPanelView from "smart/controls/tab.panel/tab.panel.view";

import TabLinkCollectionViewExt from "smart/controls/tab.panel/tab.links.ext.view";

import TabLinksScrollMixin from "smart/controls/tab.panel/tab.links.ext.scroll.mixin";

import TabContentsCollectionView from "smart/controls/tab.panel/tab.contents.view";

import AviatorConfigFormView from "d2/widgets/admin/aviator.config/aviator.config.form.view";

import AviatorConfigAssignmentsView from "d2/widgets/admin/aviator.config/impl/aviator.config.assignments.view";

import lang from "i18n!d2/widgets/admin/aviator.config/impl/nls/lang";

import "css!d2/widgets/admin/aviator.config/impl/content";

class ScrollableTabContentsCollectionView extends TabContentsCollectionView {
  className() {
    let clazz = _.isFunction(super.className) ? super.className() : _.isString(super.className) ? super.className : "";
    return `csui-normal-scrolling ${clazz}`;
  }
}

class AviatorContentView extends TabPanelView {
  className() {
    let clazz = _.isFunction(super.className) ? super.className() : _.isString(super.className) ? super.className : "";
    return `av4r-content-view ${clazz}`;
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
        title: lang.labelTabAviator,
        name: "aviator_config",
        contentView: AviatorConfigFormView
      }, {
        title: lang.labelTabAssignments,
        name: "aviator_assignments",
        contentView: AviatorConfigAssignmentsView
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
    this.intializeTabVars();
    this._listenToTabEvent();
  }
}

Object.assign(AviatorContentView.prototype, TabLinksScrollMixin);

Object.defineProperty(AviatorContentView.prototype.constructor, "name", {
  value: "AviatorContentView"
});

export default AviatorContentView;