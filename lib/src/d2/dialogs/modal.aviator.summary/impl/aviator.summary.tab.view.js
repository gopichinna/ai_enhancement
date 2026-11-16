/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Collection
} from "nuc/lib/backbone";

import _ from "nuc/lib/underscore";

import TabLinksScrollMixin from "smart/controls/tab.panel/tab.links.ext.scroll.mixin";

import TabLinkCollectionViewExt from "smart/controls/tab.panel/tab.links.ext.view";

import TabPanelView from "smart/controls/tab.panel/tab.panel.view";

import D2ListView from "dctmw/controls/list/list.view";

import lang from "i18n!d2/dialogs/modal.aviator.summary/impl/nls/lang";

class ListView extends D2ListView {
  constructor(options = {}) {
    options = _.omit(options, "model");
    super(options);
  }
}

class Av4rTabPanelView extends TabPanelView {
  constructor(options = {}) {
    let assignmentsCollection = options.assignmentsCollection, locallyAddedAssignments = assignmentsCollection.locallyAddedAssignments, locallyRemovedAssignments = assignmentsCollection.locallyRemovedAssignments, tabs = [];
    if (locallyAddedAssignments.length) {
      tabs.push({
        title: _.str.sformat(lang.newAssignments, locallyAddedAssignments.length),
        name: "aviator_added_assignments",
        contentView: ListView,
        collection: new Collection(locallyAddedAssignments)
      });
    }
    if (locallyRemovedAssignments.length) {
      tabs.push({
        title: _.str.sformat(lang.removedAssignments, locallyRemovedAssignments.length),
        name: "aviator_removed_assignments",
        contentView: ListView,
        collection: new Collection(locallyRemovedAssignments)
      });
    }
    _.defaults(options, {
      tabType: "binf-nav-tabs",
      delayTabContent: false,
      toolbar: true,
      TabLinkCollectionViewClass: TabLinkCollectionViewExt,
      tabs: tabs
    });
    super(options);
  }
  contentViewOptions(model) {
    const {
      context,
      configModel,
      assignmentsCollection
    } = this.options;
    return {
      context: context,
      configModel: configModel,
      assignmentsCollection: assignmentsCollection,
      collection: model.get("collection")
    };
  }
  onRender() {
    this._initializeToolbars();
  }
  onDomRefresh() {
    this._enableToolbarState();
  }
}

Object.assign(Av4rTabPanelView.prototype, TabLinksScrollMixin);

Object.defineProperty(Av4rTabPanelView.prototype.constructor, "name", {
  value: "Av4rTabPanelView"
});

export default Av4rTabPanelView;