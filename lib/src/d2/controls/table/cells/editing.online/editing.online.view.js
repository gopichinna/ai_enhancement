/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  ItemView
} from "nuc/lib/marionette";

import CommandHelper from "csui/utils/commandhelper";

import commands from "csui/utils/commands";

import constants from "d2/utils/constants";

import template from "hbs!d2/controls/table/cells/editing.online/impl/editing.online";

import lang from "i18n!d2/controls/table/cells/editing.online/impl/nls/lang";

import "css!d2/controls/table/cells/editing.online/impl/editing.online";

class EditingOnlineView extends ItemView {
  constructor(options = {}) {
    super(options);
  }
  onKeyDownEditingOnline(event) {
    switch (event.which) {
     case 13:
     case 32:
      this.onClickEditingOnline(event);
      break;
    }
  }
  onClickEditingOnline(event) {
    event.stopPropagation();
    event.preventDefault();
    var editOnlineCommand = commands.get("D2-EditOnline");
    var status = {
      nodes: [ this.model ],
      originatingView: this.options.tableView
    };
    editOnlineCommand.enabled(status) && CommandHelper.handleExecutionResults(editOnlineCommand.execute(status), _.extend(status, {
      command: editOnlineCommand
    }));
  }
  render() {
    var statusObj = {
      nodes: [ this.model ]
    };
    this.listenTo(this.model.actions, "update", function() {
      const editOnlineCommand = commands.get("D2-EditOnline");
      if (editOnlineCommand?.enabled(statusObj)) {
        ItemView.prototype.render.apply(this);
      }
    });
    const editOnlineCommand = commands.get("D2-EditOnline");
    if (editOnlineCommand?.enabled(statusObj)) {
      ItemView.prototype.render.apply(this);
    }
  }
  static enabled(status) {
    return status.node.get("reserved") === true && status.node.get("reserved_user_id") === constants.OES_USER;
  }
}

Object.assign(EditingOnlineView.prototype, {
  tagName: "li",
  className: "d2-cell-editing-online",
  ui: {
    icon: ".d2-cell-editing-online-wrapper"
  },
  events: {
    "click @ui.icon": "onClickEditingOnline",
    "keydown @ui.icon": "onKeyDownEditingOnline"
  },
  template: template,
  templateHelpers: function() {
    return {
      tooltip: lang.editingOnlineTooltip
    };
  }
});

Object.defineProperty(EditingOnlineView.prototype.constructor, "name", {
  value: "EditingOnlineView"
});

export default EditingOnlineView;