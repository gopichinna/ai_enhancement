/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette3", "smart/utils/smart.base", "hbs!smart/controls/app.header/panel/groups/groups.list/card/impl/group.card", "smart/controls/app.header/panel/groups/groups.list/card/list/card.list.items.view", "i18n!smart/controls/app.header/impl/nls/lang", "smart/themes/carbonfiber/ot-icons/icons_smart_action_16" ], function($, _, Backbone, Marionette, SmartBase, template, CardListItemsView, lang) {
  "use strict";
  let GroupCardView = Marionette.View.extend({
    tagName: "li",
    template: template,
    templateContext: function() {
      let iconAppearance = this.options?.originatingView?.brandingConfig?.attributes?.brandingSettingCodes?.iconThemes ?? "light";
      iconAppearance.toLowerCase() === "default" && (iconAppearance = "light");
      const rtlClass = SmartBase.isRTL() ? "smart-left-panel-group-rtl-icon" : "";
      return {
        iconAppearance: iconAppearance,
        rtlClass: rtlClass,
        expandTooltip: lang.expandTooltip,
        collapseTooltip: lang.collapseTooltip
      };
    },
    className: "smart-group-menu-item-wrapper smart-group-menu-item-card",
    ui: {
      header: ".smart-group-card-header",
      list: ".smart-group-card-list",
      upBtn: ".smart-left-panel-group-icon-up",
      downBtn: ".smart-left-panel-group-icon-down"
    },
    events: {
      keydown: "onKeyInView"
    },
    attributes: {
      role: "menuitem"
    },
    constructor: function GroupCardView(options = {}) {
      this.model = options.model;
      Marionette.View.apply(this, arguments);
      this.expanded = true;
    },
    onRender: function() {
      let cardItemsCollection = new Backbone.Collection(this.model.get("groupItems"), {
        comparator: "sequence"
      });
      let region = new Marionette.Region({
        el: this.ui.list
      });
      this.cardListItemsView = new CardListItemsView({
        ...this.options,
        collection: cardItemsCollection
      });
      region.show(this.cardListItemsView);
      this.ui.header.on("click", _.bind(this._toggleGroup, this));
      const _toggleCard = _.bind(function(show = true) {
        let methodName = show ? "removeClass" : "addClass";
        this.$el[methodName]("binf-hidden");
      }, this);
      this.listenTo(this.options.parentView, "apply:filter", _.bind(function(searchString) {
        if (!this.expanded) {
          this.ui.list.binf_collapse("show");
        }
        let newCollection = cardItemsCollection;
        if (searchString === "") {
          this.cardListItemsView.collection = newCollection;
          this.cardListItemsView.trigger("collection:updated");
          _toggleCard(true);
        } else {
          let allModels = [ ...cardItemsCollection.models ];
          allModels = allModels.filter(_.bind(function(model) {
            let name = model.get("name").toLowerCase();
            return name.indexOf(searchString) > -1;
          }, this));
          if (allModels.length) {
            _toggleCard(true);
            this.cardListItemsView.collection.models = allModels;
            this.cardListItemsView.trigger("collection:updated");
          } else {
            _toggleCard(false);
          }
        }
      }, this));
    },
    expandGroup: function() {
      this.ui.list.binf_collapse("show");
      this.ui.upBtn.removeClass("binf-hidden");
      this.ui.downBtn.addClass("binf-hidden");
      this.ui.header.attr("aria-expanded", true);
      $(this.el.querySelectorAll(".smart-group-cards-list-item")).addClass("smart-card-visible");
      this.expanded = !this.expanded;
    },
    collapseGroup: function() {
      this.ui.list.binf_collapse("hide");
      this.ui.upBtn.addClass("binf-hidden");
      this.ui.downBtn.removeClass("binf-hidden");
      this.ui.header.attr("aria-expanded", false);
      $(this.el.querySelectorAll(".smart-group-cards-list-item")).removeClass("smart-card-visible");
      this.expanded = !this.expanded;
    },
    _toggleGroup: function() {
      if (this.expanded) {
        this.collapseGroup();
      } else {
        this.expandGroup();
      }
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode;
      var currEle = event.target;
      var retVal = false;
      switch (keyCode) {
       case 37:
        if (this.expanded) {
          this.collapseGroup();
        }
        if (currEle.classList.contains("smart-group-cards-list-item")) {
          var childItems = this.el.querySelectorAll(".smart-group-cards-list-item");
          var childItemIndex = _.findIndex(childItems, function(ele) {
            return ele == currEle;
          });
          this.options.parentView.activeCardIndex = this.options.parentView?.activeCardIndex - childItemIndex - 1;
          this.el.querySelector(".smart-group-card-header").focus();
        }
        break;

       case 39:
        if (!this.expanded) {
          this.expandGroup();
        }
        if (currEle.classList.contains("smart-group-card-header")) {
          var firstChildItem = this.el.querySelector(".smart-group-cards-list-item");
          this.options.parentView.activeCardIndex = this.options.parentView?.activeCardIndex + 1;
          firstChildItem.focus();
        }
        break;

       default:
        return true;
      }
      return retVal;
    }
  });
  return GroupCardView;
});