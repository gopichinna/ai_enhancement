/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/models/member", "csui/utils/contexts/factories/connector", "csui/controls/table/cells/templated/templated.view", "csui/controls/node-type.icon/node-type.icon.view", "csui/controls/table/cells/cell.registry", "csui/utils/node.links/node.links", "esoc/controls/userwidget/userwidget.view", "hbs!d2/controls/table/cells/d2userrole/impl/d2userrole.view", "i18n", "d2/utils/user.utils" ], function(Backbone, _, Marionette, Member, ConnectorFactory, TemplatedCellView, NodeTypeIconView, cellViewRegistry, nodeLinks, UserWidgetView, template, lang, userUtils) {
  "use strict";
  var AvartarIconCellView = TemplatedCellView.extend({
    template: template,
    ui: {
      avatar: "avatar-image"
    },
    constructor: function AvartarIconCellView(options) {
      TemplatedCellView.prototype.constructor.apply(this, arguments);
      this.needsAriaLabel = !this.options.column.defaultAction;
      this.context = options.column.attributes.context;
      this.listenTo(this, "render", this._createNodeTypeIcon).listenTo(this, "before:render", this._destroyNodeTypeIcon).listenTo(this, "before:destroy", this._destroyNodeTypeIcon);
    },
    onRender: function() {
      var userId = this.model.get("id");
      var photoUrl = userUtils.getUserPhotoUrl(userId);
      if (this.model.get("type_name") == "user") {
        var member = new Member({
          id: userId,
          name: userId,
          display_name: userId,
          type: 0,
          initials: userId.substr(0, 1).toUpperCase(),
          photo_url: photoUrl,
          connector: this.context.getObject(ConnectorFactory)
        }), userWidgetView = new UserWidgetView({
          userid: userId,
          connector: this.context.getObject(ConnectorFactory),
          context: this.context,
          model: member,
          showMiniProfile: false,
          showUserProfileLink: false,
          showUserWidgetFor: "profilepic",
          userWidgetWrapperClass: "d2-userinfo-profile-pic"
        });
        userWidgetView.render();
        userWidgetView.once("show", function() {
          userWidgetView.$el.find(".d2-userinfo-profile-pic").attr({
            disabled: true,
            tabindex: -1
          });
        });
        this.$el.attr({
          title: this.model.get("type_name"),
          "aria-label": this.model.get("type_name"),
          role: "button"
        });
        this.$el.find(".avatar-image").append(userWidgetView.$el);
      }
    },
    getValueData: function() {
      return {
        isUser: this.model.get("type_name") == "user" ? true : false
      };
    },
    _createNodeTypeIcon: function() {
      if (this.model.get("type_name") != "user") {
        var iconView = new NodeTypeIconView({
          node: this.model
        });
        this.cellRegion = new Marionette.Region({
          el: this.$("> *")
        });
        this.cellRegion.show(iconView);
      }
    },
    _destroyNodeTypeIcon: function() {
      if (this.cellRegion) {
        this.cellRegion.empty();
        this.cellRegion = null;
      }
    },
    getValueText: function() {
      return this.model.get("type_name") || "";
    }
  }, {
    noTitleInHeader: true,
    columnClassName: "csui-table-cell-type",
    hasFixedWidth: true
  });
  cellViewRegistry.registerByColumnKey("avatar", AvartarIconCellView);
  return AvartarIconCellView;
});