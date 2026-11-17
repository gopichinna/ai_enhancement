/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import TabPanelView from "smart/controls/tab.panel/tab.panel.view";

import TabLinkCollectionViewExt from "smart/controls/tab.panel/tab.links.ext.view";

import wsMetadataPanels from "d2/extensions/bws.metadata.panels";

import BWSPropertiesView from "d2/widgets/metadata/panels/workspace/bws.properties.view";

function getTabPanels(options) {
  return _.chain(wsMetadataPanels).filter(function(panel) {
    let contentView = panel.contentView, enabled = contentView.enabled;
    return !enabled || enabled({
      context: options.context,
      node: options.node
    });
  }).value();
}

class BWSMetadataTabsView extends TabPanelView {
  constructor(options = {}) {
    const tabPanels = getTabPanels(options);
    _.defaults(options, {
      tabType: "binf-nav-tabs",
      delayTabContent: false,
      toolbar: true,
      TabLinkCollectionViewClass: TabLinkCollectionViewExt,
      contentViewOptions: {
        context: options.context,
        node: options.node,
        propertiesContent: options.propertiesContent
      }
    });
    options.tabs = tabPanels;
    super(options);
    this.bwsPropertiesView = new BWSPropertiesView({
      context: options.context,
      node: options.node,
      propertiesContent: options.propertiesContent,
      tabPanel: this,
      suppressSpyScroll: true
    });
  }
  className() {
    return (_.isString(super.className) ? super.className : _.isFunction(super.className) ? super.className.call(this, this.options) : "") + " bws-metadata-tab-panel";
  }
  contentViewOptions() {
    return {
      context: this.options.context
    };
  }
  getPropertiesView() {
    return this.bwsPropertiesView;
  }
  isDirty() {
    const node = this.options?.node;
    return node?._changedFormValuesMap?.properties && !_.isEmpty(node._changedFormValuesMap.properties);
  }
}

Object.defineProperty(BWSMetadataTabsView.prototype.constructor, "name", {
  value: "BWSMetadataTabsView"
});

export default BWSMetadataTabsView;