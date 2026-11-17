/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette", "csui/utils/base", "csui/utils/contexts/factories/user", "csui/models/nodes", "csui/utils/commands", "csui/models/node.actions", "csui/utils/commandhelper", "hbs!csui/controls/node.state/impl/reservation/reservation", "smart/themes/theming", "csui/themes/csui.jato.status.icons", "i18n!csui/controls/node.state/nls/lang", "css!csui/controls/node.state/impl/reservation/reservation" ], function(_, Marionette, base, UserModelFactory, NodeCollection, commands, NodeActionCollection, CommandHelper, template, theming, jatoIcons, publicLang) {
  "use strict";
  var ReservationIconView = Marionette.ItemView.extend({
    tagName: "li",
    className: "csui-node-state-reservation",
    template: template,
    templateHelpers: function() {
      var reservedStatus = this._getReservedStatus(), isReserved = reservedStatus.isReserved, isSharedCollaboration = reservedStatus.isSharedCollaboration, reservedBy = reservedStatus.reservedBy, reservedTooltip, reservedAria, canUnreserveAria, canRequestAria, canUnRequestAria, iconPrefix;
      if (isReserved) {
        var reservedDate = base.formatExactDate(this.model.get("reserved_date")), reservedUser = base.formatMemberName(reservedBy), canRequestReservation = this.requestReserveCommand && this.requestReserveCommand.enabled(this.commandStatus, this.options);
        if (isSharedCollaboration) {
          reservedTooltip = publicLang.reservedSharedCollaborationTooltip;
          reservedAria = publicLang.reservedSharedCollaborationAria;
        } else {
          reservedTooltip = publicLang.reservedTooltip;
          reservedAria = publicLang.reservedAria;
          canUnreserveAria = publicLang.canUnreserveAria;
          canRequestAria = publicLang.canRequestAria;
          canUnRequestAria = publicLang.canUnRequestAria;
        }
        if (this.options.reservedByLabel) {
          if (reservedStatus.canUnreserve === false) {
            reservedTooltip = "";
          } else {
            reservedTooltip = this.options.reservedByLabel;
          }
        }
        if (reservedTooltip) {
          reservedTooltip = _.str.sformat(reservedTooltip, reservedUser, reservedDate);
        }
        if (reservedAria) {
          reservedAria = _.str.sformat(reservedAria, reservedUser, reservedDate);
        }
        if (canUnreserveAria) {
          canUnreserveAria = _.str.sformat(canUnreserveAria, reservedUser, reservedDate);
        }
        if (canRequestAria) {
          canRequestAria = _.str.sformat(canRequestAria, reservedUser, reservedDate);
        }
        if (canUnRequestAria) {
          canUnRequestAria = _.str.sformat(canUnRequestAria, reservedUser, reservedDate);
        }
        iconPrefix = isSharedCollaboration ? "icon-shared_collaborate" : "icon-reserved";
      }
      this._reservedStatus = {
        isReserved: isReserved,
        isSharedCollaboration: isSharedCollaboration,
        isReservedByOther: reservedBy && this.userId !== reservedBy.id,
        canUnreserve: reservedStatus.canUnreserve,
        ariaLabel: reservedStatus.canUnreserve ? canUnreserveAria : canRequestReservation ? canRequestAria : canUnRequestAria,
        reservedTooltip: reservedTooltip,
        reservedAria: reservedAria,
        iconPrefix: iconPrefix,
        isJATO: theming.isJATOTheme(),
        iconSVG: reservedBy && this.userId !== reservedBy.id ? jatoIcons.statusReservedLocked : jatoIcons.statusReservedOwner
      };
      return this._reservedStatus;
    },
    triggers: {
      "click button": {
        event: "remove:reservation",
        stopPropagation: false
      },
      "click .csui-jato-reserve-state": {
        event: "remove:reservation",
        stopPropagation: false
      }
    },
    constructor: function ReservationIconView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      var user = this.options.context.getModel(UserModelFactory);
      this.userId = user.get("id");
      if (this.userId === undefined) {
        this.listenToOnce(user, "sync", function() {
          this.userId = user.get("id");
          this.render();
        });
      }
      this.unreserveCommand = commands.get("UnreserveDoc");
      this.requestReserveCommand = commands.get("RequestReservation");
      this.unRequestReserveCommand = commands.get("UnrequestReservation");
      this.commandStatus = {
        nodes: new NodeCollection([ this.model ]),
        context: this.options.context
      };
      var actions = this.model.actions;
      actions && this.listenTo(actions, "update", function() {
        if (!this._isDestroyed) {
          this.render();
        }
      });
    },
    onRemoveReservation: function() {
      if (this._reservedStatus.canUnreserve) {
        let command = this.unreserveCommand;
        let promise = command.execute(this.commandStatus);
        CommandHelper.handleExecutionResults(promise, {
          command: command,
          suppressSuccessMessage: this.commandStatus.suppressSuccessMessage,
          suppressFailMessage: this.commandStatus.suppressFailMessage
        });
      } else if (this.model.get("is_request_in_queue") !== undefined) {
        this.onRequestReservation();
      } else {
        this._getRequestStatus();
      }
    },
    onRequestReservation: function() {
      let command, runCommand = false;
      if (this.requestReserveCommand && this.requestReserveCommand.enabled(this.commandStatus, this.options)) {
        command = this.requestReserveCommand;
        runCommand = true;
      } else if (this.unRequestReserveCommand && this.unRequestReserveCommand.enabled(this.commandStatus, this.options)) {
        command = this.unRequestReserveCommand;
        runCommand = true;
      }
      if (runCommand) {
        let promise = command.execute(this.commandStatus);
        CommandHelper.handleExecutionResults(promise, {
          command: command,
          suppressSuccessMessage: this.commandStatus.suppressSuccessMessage,
          suppressFailMessage: this.commandStatus.suppressFailMessage
        });
      }
    },
    _getRequestStatus: function() {
      if (this.isFetchingActions) {
        return;
      }
      this.isFetchingActions = true;
      this.options.tableView.blockActions();
      let self = this;
      var openables = new NodeActionCollection(undefined, {
        connector: this.model.connector,
        nodes: [ this.model.get("id") ],
        commands: [ "UnrequestReservation", "RequestReservation" ]
      });
      openables.fetch().then(function() {
        this.isFetchingActions = false;
        self.options.tableView.unblockActions();
        var openable = openables.get(self.model.get("id"));
        self.model.actions.add(openable.actions.models);
        self.onRequestReservation();
      });
    },
    _getReservedStatus: function() {
      var isReserved = this.model.get("reserved"), isSharedCollaboration = this.model.get("reserved_shared_collaboration"), reservedBy = this.model.get("reserved_user_id_expand"), canUnreserve = this.unreserveCommand.enabled(this.commandStatus);
      if (!reservedBy) {
        reservedBy = this.model.get("reserved_user_id");
        if (reservedBy && typeof reservedBy === "number") {
          reservedBy = {
            id: reservedBy
          };
        }
      }
      return {
        isReserved: isReserved && reservedBy !== undefined || isSharedCollaboration,
        isSharedCollaboration: isSharedCollaboration,
        reservedBy: reservedBy,
        canUnreserve: canUnreserve
      };
    },
    getAttributes: function() {
      var data = this.templateHelpers(), label, name;
      if (data.isSharedCollaboration) {
        label = publicLang.reserved_shared_collaboration_attribute_title;
        name = publicLang.reserved_shared_collaboration_attribute_name;
      } else {
        label = publicLang.reserved_attribute_title;
        name = publicLang.reserved_attribute_name;
      }
      return [ {
        label: label,
        value: data.isReserved,
        name: name,
        tooltip: data.reservedTooltip,
        aria: data.reservedAria
      } ];
    }
  }, {
    enabled: function(status) {
      var model = status.node, isReserved = model.get("reserved"), isSharedCollaboration = model.get("reserved_shared_collaboration"), reservedBy = model.get("reserved_user_id");
      return isReserved && reservedBy && (!model.has("versions") || model.get("versions").current_version !== false) || isSharedCollaboration;
    },
    getModelExpand: function(options) {
      return {
        properties: [ "reserved_user_id" ]
      };
    }
  });
  return ReservationIconView;
});