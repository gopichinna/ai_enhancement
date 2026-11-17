/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  View
} from "nuc/lib/marionette3";

import {
  uniqueId
} from "nuc/lib/underscore";

import SmartBase from "smart/utils/smart.base";

import NodeTypeIconView from "csui/controls/node-type.icon/node-type.icon.view";

import template from "hbs!d2/widgets/task.aviator/impl/messages/reference";

import lang from "i18n!d2/widgets/task.aviator/nls/lang";

import "css!d2/widgets/task.aviator/impl/messages/reference";

import "smart/utils/otwc.loader";

import {
  isDocumentType,
  isWorkspaceType
} from "d2/widgets/task.aviator/aie/utils/util";

class ReferenceView extends View {
  templateContext() {
    const actionButtonId = uniqueId("actions-");
    let isViewable, actionsMenuView, actionsMenuOpen;
    let enableOpenAction = false;
    const {
      referenceActions
    } = this.options;
    if (referenceActions) {
      isViewable = !!(this.options.viewableNodes && this.options.viewableNodes.length);
      actionsMenuView = isDocumentType(this.model) ? lang.actionsMenuViewDocument : lang.actionsMenuViewWorkspace;
      actionsMenuOpen = isDocumentType(this.model) ? lang.actionsMenuOpenDocument : lang.actionsMenuOpenWorkspace;
      enableOpenAction = isDocumentType(this.model);
    }
    return {
      actionButtonId: actionButtonId,
      isViewable: isViewable,
      actionsMenuView: actionsMenuView,
      actionsMenuOpen: actionsMenuOpen,
      referenceActions: referenceActions,
      enableOpenAction: enableOpenAction,
      lang: lang
    };
  }
  onRender() {
    const iconView = new NodeTypeIconView({
      node: this.model
    });
    this.showChildView("icon", iconView);
  }
  triggerClickReference(event) {
    if (!SmartBase.isControlClick(event)) {
      if (isDocumentType(this.model)) {
        this.trigger("click:reference", {
          nodes: [ this.model ],
          event: event
        });
      } else {}
    }
  }
  triggerClickAction(event) {
    const action = event.target.getAttribute("data-aie-action");
    this.trigger("click:action", {
      node: this.model,
      action: action
    });
  }
  triggerKeydownAction(event) {
    if (event.type === "keydown" && (event.keyCode === 32 || event.keyCode === 13)) {
      const action = event.target.getAttribute("data-aie-action");
      this.trigger("click:action", {
        node: this.model,
        action: action
      });
    }
  }
  triggerKeydownReference(event) {
    if (event.type === "keydown" && (event.keyCode === 32 || event.keyCode === 13)) {
      this.trigger("click:reference", {
        nodes: [ this.model ],
        event: event
      });
    }
  }
}

Object.assign(ReferenceView.prototype, {
  tagName: "li",
  events: {
    "click .aie-chat-reference": "triggerClickReference",
    "click [data-aie-action]": "triggerClickAction",
    "keydown [data-aie-action]": "triggerKeydownAction",
    "keydown .aie-chat-reference": "triggerKeydownReference"
  },
  className() {
    let classes = this.model.get("grouped") ? "aie-grouped" : "";
    if (isWorkspaceType(this.model)) {
      classes += " aie-workspace";
    }
    return classes;
  },
  regions: {
    icon: {
      el: ".aie-icon",
      replaceElement: true
    }
  },
  template: template
});

Object.defineProperty(ReferenceView.prototype.constructor, "name", {
  value: "ReferenceView"
});

export default ReferenceView;