/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette3", "hbs!smart/controls/app.header/panel/groups/impl/groups", "smart/controls/app.header/panel/groups/groups.list/groups.list.view", "smart/controls/app.header/panel/header/header.view", "smart/controls/progressblocker/blocker", "i18n!smart/controls/app.header/impl/nls/lang", "smart/lib/binf/js/binf" ], function($, _, Backbone, Marionette, template, GroupsListView, PanelHeaderView, BlockingView, lang) {
  "use strict";
  let SmartPanelGroupsView = Marionette.View.extend({
    template: template,
    className: "smart-groups-wrapper csui-normal-scrolling",
    ui: {
      header: ".smart-groups-header-wrapper",
      list: ".smart-groups-list-wrapper"
    },
    events: {
      keydown: "onKeyInView"
    },
    constructor: function SmartPanelGroupsView(options = {}) {
      Marionette.View.apply(this, arguments);
      BlockingView.imbue(this);
    },
    templateContext: function() {
      return {
        mainNavigationAria: lang.mainNavigationAria
      };
    },
    onRender: function() {
      this.blockActions();
      let bgColor = this.options.originatingView?.brandingConfig?.attributes?.brandingSettingCodes?.customBrandingBgColor ?? "";
      if (bgColor.length > 1) {
        this.el.style.backgroundColor = bgColor;
      }
      this.panelHeaderView = new PanelHeaderView(this.options);
      let headerRegion = new Marionette.Region({
        el: this.ui.header
      });
      headerRegion.show(this.panelHeaderView);
      this.listenTo(this.panelHeaderView, "toggle", _.bind(function(args) {
        this.trigger("close:panel");
      }, this));
      this.listenTo(this.options.originatingView, "sync:data", _.bind(function(data) {
        this.unblockActions();
        this.options.collection = this._preparePanelCollection(data);
        this.groupListView = new GroupsListView(this.options);
        let region = new Marionette.Region({
          el: this.ui.list
        });
        region.show(this.groupListView);
        this?.el.querySelector(".smart-card-visible")?.focus();
      }, this));
      this.options.originatingView.trigger("request:data");
    },
    _preparePanelCollection: function(data) {
      let groups = data.groups ?? [];
      let items = data.items ?? [];
      let collection = new Backbone.Collection([], {
        comparator: "sequence"
      });
      items.forEach(function(item) {
        if (item?.groupBy?.trim().length > 0) {
          let groupId = item.groupBy;
          let groupItem = collection.findWhere({
            id: groupId
          });
          if (groupItem) {
            groupItem.attributes.groupItems.push(item);
          } else {
            let groupInfo = groups[_.findIndex(groups, {
              id: groupId
            })];
            let newGroup = {
              groupItems: [ item ]
            };
            collection.add({
              ...groupInfo,
              ...newGroup
            });
          }
        } else {
          item.type = "standalone";
          collection.add(item);
        }
      });
      this.collection = collection;
      return this.collection;
    },
    onKeyInView: function(event) {
      let keyCode = event.keyCode, currEle = event.target;
      this.isKeyEvent = true;
      switch (keyCode) {
       case 9:
        var firstCardItem = this.el.querySelector(".smart-card-visible");
        if (!(currEle == firstCardItem && event.shiftKey) && currEle?.classList?.contains("smart-card-visible") || event.shiftKey && currEle?.classList?.contains("smart-app-header-burger-close-btn")) {
          this.trigger("close:panel");
          event.stopPropagation();
          if (event.shiftKey) {
            event.preventDefault();
          }
        }
        break;

       case 27:
        this.trigger("close:panel");
        event.stopPropagation();
        event.preventDefault();
        break;

       default:
        return;
      }
    }
  });
  return SmartPanelGroupsView;
});