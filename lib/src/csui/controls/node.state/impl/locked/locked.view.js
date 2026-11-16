/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette3", "csui/utils/base", "csui/utils/contexts/factories/user", "csui/models/nodes", "csui/utils/commandhelper", "csui/utils/commands", "csui/utils/commands/versions/unlock", "csui/models/version", "csui/utils/contexts/factories/member", "hbs!csui/controls/node.state/impl/locked/impl/locked", "i18n!csui/controls/node.state/impl/locked/impl/nls/lang", "css!csui/controls/node.state/impl/locked/impl/locked" ], function(_, Marionette, base, UserModelFactory, NodeCollection, CommandHelper, commands, UnlockCommandForVersions, VersionModel, MemberModelFactory, template, lang) {
  "use strict";
  var LockedIconView = Marionette.View.extend({
    tagName: "li",
    className: "csui-node-state-locked",
    template: template,
    templateContext: function() {
      var locked = this.model.get("locked"), isLockedByOther = false, noActionCSS, lockedDate, lockedUserExpand, lockedTooltip, lockedUser, lockedAria, lockedTooltipDocOverview, lockedTooltipDocOverviewNonAdmin;
      this.canUnlock = this.unlockCommand?.enabled(this.commandStatus);
      if (locked) {
        lockedUserExpand = this.model.get("locked_user_id_expand");
        isLockedByOther = this.userId !== this.model.get("locked_user_id");
        lockedDate = base.formatExactDate(this.model.get("locked_date"));
        lockedTooltipDocOverview = _.str.sformat(lang.lockedByUnlock, this.lockedUser.get("display_name"));
        lockedTooltipDocOverviewNonAdmin = _.str.sformat(lang.lockedBy, this.lockedUser.get("display_name"));
        if (lockedUserExpand) {
          lockedUser = lockedUserExpand.name;
          lockedTooltip = _.str.sformat(lang.lockedTooltip, lockedUserExpand.name, lockedDate);
          lockedAria = _.str.sformat(lang.lockedAria, lockedUserExpand.name, lockedDate);
        }
      }
      if (!this.canUnlock) {
        noActionCSS = "csui-btn-lock-no-action";
      }
      this.lockedStatus = {
        noActionCSS: noActionCSS,
        locked: locked,
        lockedUser: lockedUser,
        lockedTooltip: this.options?.versionOverview ? !this.canUnlock ? lockedTooltipDocOverviewNonAdmin : lockedTooltipDocOverview : lockedTooltip,
        lockedAria: this.options?.versionOverview ? lang.pressToUnlock : lockedAria,
        canUnlock: this.canUnlock || !isLockedByOther
      };
      return this.lockedStatus;
    },
    triggers: {
      "click button": "remove:lock"
    },
    constructor: function LockedIconView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      var lockedUserId = options.model.get("locked_user_id");
      this.lockedUser = options.context.getModel(MemberModelFactory, {
        attributes: {
          id: lockedUserId
        },
        options: {
          id: lockedUserId,
          connector: this.options.connector
        },
        temporary: true
      });
      this.lockedUser.ensureFetched();
      this.lockedUser.on("change", this.render, this);
    },
    initialize: function() {
      var user = this.options.context.getModel(UserModelFactory);
      this.userId = user.get("id");
      this.commandStatus = {
        nodes: new NodeCollection([ this.model ]),
        context: this.options.context
      };
      if (this.model instanceof VersionModel || this.model.get("versions")) {
        this.unlockCommand = new UnlockCommandForVersions();
      } else {
        this.unlockCommand = commands.get("Unlock");
      }
      var actions = this.model.actions;
      actions && this.listenTo(actions, "update", function() {
        if (!this._isDestroyed) {
          this.render();
        }
      });
    },
    onRemoveLock: function() {
      var promiseFromCommand;
      if (this.lockedStatus.canUnlock) {
        promiseFromCommand = this.unlockCommand?.execute(this.commandStatus);
        CommandHelper.handleExecutionResults(promiseFromCommand, {
          command: this.unlockCommand,
          suppressSuccessMessage: this.commandStatus.suppressSuccessMessage,
          suppressFailMessage: this.commandStatus.suppressFailMessage
        });
      }
    }
  }, {
    enabled: function(status) {
      var model = status.node, isLocked = model.has("locked") && model.get("locked");
      return isLocked;
    },
    getModelExpand: function(options) {
      return {
        properties: [ "locked_user_id" ]
      };
    }
  });
  return LockedIconView;
});