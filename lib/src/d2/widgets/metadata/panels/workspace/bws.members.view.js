/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/contexts/factories/connector", "nuc/utils/url", "smart/controls/progressblocker/blocker", "dctmw/controls/otwc/otwc.input.search.view", "d2/controls/globalmessage/globalmessage", "d2/models/bws/bws.role.collection", "d2/widgets/metadata/panels/workspace/impl/members/bws.members.card.view", "d2/utils/rest.linkrels", "hbs!d2/widgets/metadata/panels/workspace/impl/members/bws.members", "i18n!d2/widgets/metadata/panels/workspace/impl/nls/lang", "css!d2/widgets/metadata/panels/workspace/impl/members/bws.members" ], function($, _, Backbone, Marionette, ConnectorFactory, Url, BlockingView, OTWCInputSearchView, GlobalMessage, BWSRoleCollection, BWSMembersCardView, RestLinkrels, template, lang) {
  "use strict";
  var BWSMembersView = Marionette.CompositeView.extend({
    template: template,
    className: "d2-bws-members",
    childView: BWSMembersCardView,
    childViewContainer: ".d2-bws-members-cards",
    childViewOptions: function(model, index) {
      return {
        context: this.options.context,
        originatingView: this,
        addTabIndex: index === 0,
        isFirst: index === 0,
        expanded: index === this.collection.findIndex(m => m.members.length),
        blockingParentView: this,
        adminRoleUsers: this.adminRoleUsers
      };
    },
    ui: {
      inputSearch: ".d2-bws-members-search",
      splashScreen: ".d2-bws-members-empty"
    },
    events: {
      keydown: "onKeyDown"
    },
    constructor: function BWSMembersView(options) {
      options.collection = options.collection || new BWSRoleCollection(undefined, {
        node: options.node,
        connector: options.context.getObject(ConnectorFactory)
      });
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this._setupChildrenViews();
      this.listenTo(this, "d2:bws:update:member:search", this._renderSearchView);
      this.listenTo(this.inputSearchModel, "change:attr_value", (model, searchValue) => {
        this.children.each(childView => {
          childView.triggerMethod("members:search:change", searchValue);
        });
      });
      BlockingView.imbue(this);
    },
    _setupChildrenViews: function() {
      this._setupSearchView();
    },
    _setupSearchView: function() {
      this.inputSearchModel = new Backbone.Model({
        attr_placeholder: lang.searchPlaceholder
      });
      this.inputSearchView = new OTWCInputSearchView({
        model: this.inputSearchModel
      });
    },
    onShow: function() {
      this._renderChildrenViews();
    },
    _renderChildrenViews: function() {
      this.blockActions();
      let me = this;
      this.adminRoleUsers = $.Deferred();
      this.collection.fetch({
        includeMembers: true
      }).done(() => {
        me.unblockActions();
        me._fetchAdminRoleUsers(this.adminRoleUsers);
        me._renderSearchView();
        me.ui.splashScreen[me.collection.length ? "addClass" : "removeClass"]("binf-hidden");
      }).fail(xhr => {
        me.unblockActions();
        me._renderSearchView();
        me.ui.splashScreen["removeClass"]("binf-hidden");
        !_.isEmpty(xhr?.responseJSON?.message) && GlobalMessage.showMessage("error", xhr.responseJSON.message);
      });
    },
    _renderSearchView: function() {
      var membersCount = 0;
      this.children.each(childView => membersCount += childView.collection?.allModels?.length || 0);
      if (membersCount > 10) {
        this.inputSearchView && this.ui.inputSearch?.length && new Marionette.Region({
          el: this.ui.inputSearch
        }).show(this.inputSearchView);
        this.ui.inputSearch?.removeClass("binf-hidden");
      } else {
        this.ui.inputSearch?.addClass("binf-hidden");
      }
    },
    onKeyDown: function(event) {
      var cardList = this.$el.find(".d2-bws-members-card");
      switch (event.which) {
       case 33:
       case 36:
        event.stopPropagation();
        event.preventDefault();
        $(event.target).closest(".d2-bws-role-name").attr("tabindex", "-1");
        $(cardList[0]).find(".d2-bws-role-name").focus();
        $(cardList[0]).find(".d2-bws-role-name").attr("tabindex", "0");
        break;

       case 34:
       case 35:
        event.stopPropagation();
        event.preventDefault();
        $(event.target).closest(".d2-bws-role-name").attr("tabindex", "-1");
        $(cardList[cardList.length - 1]).find(".d2-bws-role-name").focus();
        $(cardList[cardList.length - 1]).find(".d2-bws-role-name").attr("tabindex", "0");
        break;

       case 37:
        event.stopPropagation();
        event.preventDefault();
        if ($(event.target).prev().length) {
          $(event.target).prev().focus();
        } else if ($(event.target).hasClass("d2-bws-members-list")) {
          if ($(event.target).find(".d2-bws-add-member").hasClass("binf-hidden")) {
            $(event.target).find(".d2-bws-role-name").focus();
          } else {
            $(event.target).find(".d2-bws-add-member").focus();
          }
        }
        break;

       case 39:
        event.stopPropagation();
        event.preventDefault();
        if ($(event.target).next().length && !$(event.target).next().hasClass("binf-hidden")) {
          $(event.target).next().focus();
        } else if ($(event.target).closest(".d2-bws-members-card-header").length) {
          $($(event.target).closest(".d2-bws-members-list")[0].shadowRoot).find("otc-button").focus();
        }
        break;

       case 38:
        event.stopPropagation();
        event.preventDefault();
        $(event.target).closest(".d2-bws-members-card").prev().find(".d2-bws-role-name").length && $(event.target).closest(".d2-bws-role-name").attr("tabindex", "-1");
        $(event.target).closest(".d2-bws-members-card").prev().find(".d2-bws-role-name").focus();
        $(event.target).closest(".d2-bws-members-card").prev().find(".d2-bws-role-name").attr("tabindex", "0");
        break;

       case 40:
        event.stopPropagation();
        event.preventDefault();
        $(event.target).closest(".d2-bws-members-card").next().find(".d2-bws-role-name").length && $(event.target).closest(".d2-bws-role-name").attr("tabindex", "-1");
        $(event.target).closest(".d2-bws-members-card").next().find(".d2-bws-role-name").focus();
        $(event.target).closest(".d2-bws-members-card").next().find(".d2-bws-role-name").attr("tabindex", "0");
        break;
      }
    },
    _fetchAdminRoleUsers(dfd) {
      let adminRoleModel = this.collection?.find({
        group_name: this.collection.at(0)?.get("group_admin")
      }), me = this;
      if (!adminRoleModel) {
        me.adminRoleUsers = [];
        return dfd.reject([]).promise();
      }
      $.ajax(adminRoleModel.connector.extendAjaxOptions({
        url: Url.appendQuery(RestLinkrels.getLink(adminRoleModel.get("links"), RestLinkrels.USERS), Url.combineQueryString({
          inline: true,
          recursive: true
        })),
        success: response => {
          me.adminRoleUsers = response?.entries?.map(entry => entry?.content?.properties?.user_name || "");
          dfd.resolve(me.adminRoleUsers);
        },
        error: () => {
          me.adminRoleUsers = [];
          dfd.reject([]);
        }
      }));
      return dfd.promise();
    }
  }, {
    enabled: function() {
      return true;
    }
  });
  return BWSMembersView;
});