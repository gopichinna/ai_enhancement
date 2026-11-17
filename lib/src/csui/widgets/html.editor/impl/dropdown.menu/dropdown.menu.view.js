/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/models/nodes", "csui/utils/commands", "csui/utils/contexts/factories/member", "csui/utils/base", "csui/themes/csui.jato.action.icons", "csui/themes/csui.jato.status.icons", "smart/themes/theming", "i18n!csui/widgets/html.editor/impl/nls/lang", "hbs!csui/widgets/html.editor/impl/dropdown.menu/dropdown.menu", "hbs!csui/widgets/html.editor/impl/dropdown.menu/dropdown.option" ], function(module, _, $, Backbone, Marionette, NodeCollection, commands, MemberModelFactory, base, jatoActionIcons, jatoStatusIcons, theming, lang, TemplateDropdownMenu, TemplateDropdownOption) {
  "use strict";
  const DropdownOption = Marionette.ItemView.extend({
    tagName: "otc-menuitem",
    template: TemplateDropdownOption,
    events: {
      "item-click": "_executeAction"
    },
    templateHelpers: function() {
      return {
        actionName: lang[this.model.get("signature") || this.model.get("name")]
      };
    },
    attributes: function() {
      return {
        title: lang[this.model.get("signature") || this.model.get("name")]
      };
    },
    constructor: function(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    _executeAction: function() {
      if (this.options.openForEdit) {
        this.options.openForEdit();
      } else {
        var cmdExe = this.options.command.execute(this.options.status);
        cmdExe.always(_.bind(function() {
          this.trigger("csui.command.executed", cmdExe);
        }, this));
      }
    }
  });
  var DropdownMenuView = Marionette.CompositeView.extend({
    className: "csui-html-editor-dropdown",
    template: TemplateDropdownMenu,
    childView: DropdownOption,
    childViewContainer: "otc-menu",
    childEvents: {
      "csui.command.executed": "afterCommandExecution"
    },
    ui: {
      dropdownMenu: "otc-menu"
    },
    childViewOptions: function(actionModel) {
      var signature = !!actionModel.get("openForEdit") ? "HTMLEdit" : actionModel.get("signature");
      var options = {
        status: this.status,
        node: this.options.node
      };
      if (signature === "HTMLEdit") {
        options.openForEdit = this.options.openForEdit;
      } else {
        if (signature === "properties") {
          signature = "Properties";
        } else if ([ "reserve", "unreserve" ].indexOf(signature) !== -1) {
          if (signature === "unreserve") {
            signature = "Unreserve";
          } else {
            signature = "Reserve";
          }
          signature += "Doc";
        }
        options.command = commands.get(signature);
      }
      return options;
    },
    templateHelpers: function() {
      var helpers = {
        haveEditPermission: this.haveEditPermissions,
        isJATO: theming.isJATOTheme(),
        moreIconSVG: jatoActionIcons.actionMoreHorizontal,
        buttonID: _.uniqueId("htmlActionsButton"),
        tooltip: lang.more,
        iconClass: "icon-html-edit-toolbar-more",
        reserved: this.node.get("reserved"),
        moreActionsAria: _.str.sformat(lang.moreActionsAria, !!this.parentView.options.title ? this.parentView.options.title : "")
      };
      if (helpers.reserved) {
        var selfReserved = this.node.get("reserved_user_id") === this.user.get("id");
        if (!selfReserved) {
          helpers.tooltip = _.str.sformat(lang.reservedBy, this.node.get("reserved_user_id"), base.formatExactDate(this.node.get("reserved_date")));
        }
        if (theming.isJATOTheme()) {
          helpers.reservedIconSVG = selfReserved ? jatoStatusIcons.statusReservedOwner : jatoStatusIcons.statusReservedLocked;
        } else {
          helpers.iconClass = selfReserved ? "icon-html-editor-reserved-owned" : "icon-html-editor-reserved_other";
        }
      }
      return helpers;
    },
    constructor: function DropdownMenuView(options) {
      this.parentView = options.parentView;
      this.node = options.node;
      this.user = options.user;
      this.haveEditPermissions = !!(options.node.actions.get("reserve") || options.node.actions.get("unreserve"));
      options.collection = this.buildCollection();
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.options.node, "change", this.updateActionCollection);
      this.status = {
        context: this.options.context,
        container: this.options.node,
        nodes: new NodeCollection([ this.options.node ])
      };
      if (this.node.get("reserved") && this.node.get("reserved_user_id") !== this.user.get("id")) {
        this.reservedByUserModel = this.options.context.getModel(MemberModelFactory, {
          attributes: {
            id: this.node.get("reserved_user_id")
          }
        });
      }
    },
    buildCollection: function() {
      var collection = new Backbone.Collection();
      if (this.haveEditPermissions) {
        if (!this.node.get("reserved") || this.node.get("reserved_user_id") === this.user.get("id")) {
          collection.add(new Backbone.Model({
            openForEdit: true,
            name: "Edit"
          }));
        }
        var action, supportedActions = [ "properties", "permissions", "unreserve" ], self = this;
        supportedActions.map(function(action) {
          action = self.node.actions.get(action);
          action && collection.add(action);
        });
      }
      return collection;
    },
    updateActionCollection: function() {
      this.haveEditPermissions = !!(this.options.node.actions.get("reserve") || this.options.node.actions.get("unreserve"));
      this.collection = this.buildCollection();
      this.render();
    },
    afterCommandExecution: function(childView, promise) {
      promise.fail(_.bind(function() {
        if (childView.model.get("name") === "Unreserve") {
          this.node.fetch();
        }
      }, this));
    },
    onRender: function() {
      if (!!this.reservedByUserModel && !this.reservedByUserModel.fetched) {
        this.reservedByUserModel.fetch().done(_.bind(function(response) {
          this.$el.find(".csui-html-editor-control," + " .csui-html-editor-reserved-readonly").attr("title", _.str.sformat(lang.reservedBy, response.data.display_name, base.formatExactDate(this.node.get("reserved_date"))));
        }, this));
      }
    }
  });
  return DropdownMenuView;
});