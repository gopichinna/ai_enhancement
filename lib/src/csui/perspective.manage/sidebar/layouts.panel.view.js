/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/lib/underscore", "csui/lib/marionette3", "csui/perspective.manage/sidebar/layouts.panel.item.view", "i18n!csui/perspective.manage/impl/nls/lang", "hbs!csui/perspective.manage/impl/list" ], function(Backbone, _, Marionette, ListItemView, Lang, ListTemplate) {
  "use strict";
  const LayoutsPanelView = Marionette.CollectionView.extend({
    constructor: function LayoutsPanelView(options) {
      options || (options = {});
      options.data || (options.data = {});
      Marionette.CollectionView.call(this, options);
      if (this.options.data?.items) {
        if (!this.collection) {
          const ViewCollection = Backbone.Collection.extend({
            model: Backbone.Model.extend({
              idAttribute: null
            })
          });
          this.collection = new ViewCollection();
        }
        this.collection.add(this.options.data.items);
      }
    },
    className: "csui-pman-list csui-normal-scrolling",
    childViewTriggers: {
      "change:layout": "child:Change:Layout",
      "set:active": "child:set:active"
    },
    onChildChangeLayout(childView) {
      this.onChangeLayout(childView);
    },
    onChildSetActive(childView) {
      this.setActive(childView);
    },
    template: ListTemplate,
    childViewContainer: ".cs-list-group",
    childView: ListItemView,
    childViewOptions: function() {
      return this.options;
    },
    setActive: function(childView) {
      this.el.querySelectorAll(".csui-layout-item").forEach(ele => ele.classList.remove("binf-active"));
      childView.el.querySelector(".csui-layout-item").classList.add("binf-active");
    },
    onChangeLayout: function(childView) {
      let self = this, newLayout = childView.model.get("type"), currentLayout = this.options.context.pmanView.perspective.get("perspective").type;
      if ((currentLayout === "sidepanel-right" || currentLayout === "sidepanel-left") && (newLayout === "sidepanel-right" || newLayout === "sidepanel-left")) {
        self.setActive(childView);
        self.options.context.pmanView.trigger("swap:layout", newLayout);
      } else {
        require([ "csui/dialogs/modal.alert/modal.alert" ], function(ModalAlertView) {
          ModalAlertView.confirmWarning(Lang.changePageLayoutConfirmatonText, Lang.layouts, {
            buttons: {
              showYes: true,
              labelYes: Lang.proceedButton,
              showNo: true,
              labelNo: Lang.changeLayoutCancelButton
            }
          }).done(function(labelYes) {
            if (labelYes) {
              self.setActive(childView);
              self.options.context.pmanView.trigger("change:layout", childView.model.get("type"));
              self.options.context.pmanView.context.trigger("reset:widget:panel");
            }
          });
        });
      }
    }
  });
  return LayoutsPanelView;
});