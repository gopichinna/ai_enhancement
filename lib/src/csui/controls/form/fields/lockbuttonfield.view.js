/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/models/nodes", "csui/utils/commands", "csui/utils/commands/versions/unlock", "csui/controls/form/fields/reservebuttonfield.view", "csui/utils/commandhelper", "csui/utils/contexts/factories/user", "csui/utils/contexts/factories/member", "i18n!csui/controls/form/impl/fields/lockbuttonfield/nls/lang", "hbs!csui/controls/form/impl/fields/lockbuttonfield/lockbuttonfield", "css!csui/controls/form/impl/fields/lockbuttonfield/lockbuttonfield" ], function(require, _, $, Backbone, Marionette, NodeCollection, commands, UnlockCommandForVersions, ReserveButtonFieldView, CommandHelper, UserModelFactory, MemberModelFactory, lang, template) {
  "use strict";
  var LockButtonFieldView = ReserveButtonFieldView.extend({
    constructor: function LockButtonFieldView(options) {
      if (!!options.data) {
        var node = options.data.node;
        this.connector = options.data ? options.data.connector : undefined;
        if (node.get("type") === 138 || node.get("type") === 139) {
          this.UnlockCommand = commands.get("Unlock");
        } else {
          this.UnlockCommand = new UnlockCommandForVersions();
        }
        this.commandStatus = {
          nodes: new NodeCollection([ options.data.node ])
        };
        this.canUnlock = this.UnlockCommand?.enabled(this.commandStatus);
        node && this.listenTo(node, "sync", this._checkEnabledAction);
      }
      Marionette.ItemView.apply(this, arguments);
      if (!!this.options.data) {
        this.locked = this.options.data.node.get("locked");
        if (this.options.data.options.context) {
          var user = this.options.data.options.context.getModel(UserModelFactory);
          this.userId = user.get("id");
        }
        var lockedUserId = this.options.data.node.get("locked_user_id");
        this.lockedUser = this.options.connector.config.context.getModel(MemberModelFactory, {
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
      } else {
        this.locked = false;
      }
    },
    _checkEnabledAction: function() {
      this.canUnlock = this.UnlockCommand?.enabled(this.commandStatus);
      this.render();
    },
    ui: {
      btnLockAction: ".csui-btn-lock-status-action"
    },
    events: {
      "click @ui.btnLockAction": "lockAction"
    },
    lockAction: function(event) {
      if (this.canUnlock) {
        if (!!this.options.data.beforeAction) {
          if (_.isFunction(this.options.data.beforeAction)) {
            this.options.data.beforeAction();
          }
        }
        this.locked ? this.unlock() : this.lock();
        if (this.canUnlock) {
          if (!!this.options.data.afterAction) {
            if (_.isFunction(this.options.data.afterAction)) {
              this.options.data.afterAction();
            }
          }
        }
      }
    },
    onChange: function() {
      if (!!this.options.data.actionOnce) {
        this.$el.off("click", ".csui-btn-lock-status");
      }
    },
    unlock: function() {
      var promiseFromCommand;
      if (this.canUnlock) {
        promiseFromCommand = this.UnlockCommand?.execute(this.commandStatus);
        CommandHelper.handleExecutionResults(promiseFromCommand, {
          command: this.UnlockCommand,
          suppressSuccessMessage: this.commandStatus.suppressSuccessMessage,
          suppressFailMessage: this.commandStatus.suppressFailMessage
        });
      }
    },
    template: template,
    templateHelpers: function() {
      var tooltip = "", noActionCSS = "", tabIndex = 0;
      if (this.canUnlock && this.locked) {
        tooltip = lang.unlocked;
        if (!!this.lockedUser) {
          tooltip = _.str.sformat(lang.lockedByUnlock, this.lockedUser.get("display_name"));
        }
      } else {
        tabIndex = -1;
      }
      if (!this.canUnlock) {
        noActionCSS = "csui-btn-lock-no-action";
      }
      var _canUnlock = this.canUnlock && this.locked;
      return {
        noActionCSS: noActionCSS,
        locked: this.locked,
        tabIndex: tabIndex,
        canUnlock: _canUnlock,
        tooltip: _canUnlock ? tooltip : this.getLockBy(),
        pressToUnlock: _canUnlock ? lang.pressToUnlock : this.getLockBy()
      };
    },
    getLockBy: function() {
      var lockedUser = "";
      if (this.lockedUser) {
        lockedUser = _.str.sformat(lang.lockedBy, this.lockedUser.get("display_name"));
      }
      return lockedUser;
    },
    onRender: function() {
      if (this.locked) {
        var that = this;
        var $placeholder = this.$el.find(".csui-lockby-status");
        require([ "esoc/controls/userwidget/userwidget.view" ], function(UserWidgetView) {
          var userWidgetOptions = {
            userid: that.options.data.node.attributes.locked_user_id,
            context: that.options.connector.config.context,
            baseElement: $placeholder,
            showUserProfileLink: true,
            showMiniProfile: true,
            loggedUserId: that.userId,
            connector: that.connector,
            prettyScrolling: true,
            source: "extendedInfoText",
            parentView: that
          };
          that.region = new Marionette.Region({
            el: $placeholder
          });
          var setUserWidgetAria = function() {
            if (!!that.lockedUser) {
              $placeholder.find("a.esoc-user-container").attr("aria-label", _.str.sformat(lang.lockedBy, that.lockedUser.get("display_name")));
            }
          };
          that.listenToOnce(that, "view:shown", function() {
            setUserWidgetAria();
          });
          var userWidget = new UserWidgetView(userWidgetOptions);
          userWidget.listenToOnce(userWidget, "attach", function() {
            var event = $.Event("tab:content:field:changed");
            that.$el.trigger(event);
            setUserWidgetAria();
          });
          that.region.show(userWidget);
        });
      }
    }
  });
  return LockButtonFieldView;
});