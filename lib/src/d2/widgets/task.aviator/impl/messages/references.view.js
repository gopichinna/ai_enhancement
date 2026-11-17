/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  CollectionView
} from "nuc/lib/marionette3";

import ReferenceView from "d2/widgets/task.aviator/impl/messages/reference.view";

import "css!d2/widgets/task.aviator/impl/messages/references";

class ReferencesView extends CollectionView {}

Object.assign(ReferencesView.prototype, {
  tagName: "ul",
  className: "aie-chat-reference-list",
  attributes: {
    style: "display: none"
  },
  childView: ReferenceView,
  childViewOptions() {
    return {
      viewableNodes: this.options.viewableNodes,
      referenceActions: this.options.referenceActions
    };
  }
});

Object.defineProperty(ReferencesView.prototype.constructor, "name", {
  value: "ReferencesView"
});

export default ReferencesView;