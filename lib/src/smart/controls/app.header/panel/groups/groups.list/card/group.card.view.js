/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette3", "smart/utils/smart.base", "smart/themes/theming", "hbs!smart/controls/app.header/panel/groups/groups.list/card/impl/group.card", "smart/controls/app.header/panel/groups/menu.items.icon.view", "smart/controls/app.header/panel/groups/groups.list/card/list/card.list.items.view", "i18n!smart/controls/app.header/impl/nls/lang", "smart/themes/jato.icons/smart.jato.action.icons", "nuc/utils/namedlocalstorage" ], function(module, $, _, Backbone, Marionette, SmartBase, theming, template, IconView, CardListItemsView, lang, jatoIcons, NamedLocalStorage) {
  "use strict";
  let getKey = () => {
    let key = window.location.hostname + "_" + module.id;
    return key;
  };
  let namedLocalStorage = new NamedLocalStorage(getKey());
  const GROUPS_INFO_STORAGE_KEY = "groupedItemsExpandInfo";
  let GroupCardView = Marionette.View.extend({
    tagName: "li",
    template: template,
    templateContext: function() {
      let iconAppearance = this.options?.originatingView?.brandingConfig?.attributes?.brandingSettingCodes?.iconThemes ?? "light";
      iconAppearance.toLowerCase() === "default" && (iconAppearance = "light");
      const rtlClass = SmartBase.isRTL() ? "smart-left-panel-group-rtl-icon" : "";
      let isJATO = theming.isJATOTheme();
      let jatoIconLength = this?.model?.get("jatoIcon")?.length ?? 0;
      let CFIconLength = this?.model?.get("icon")?.length ?? 0;
      let groupIconLength = isJATO ? jatoIconLength : CFIconLength;
      let hideGroupIcon = this?.model?.get("hideIcon") || groupIconLength == 0;
      let isBrightness = this.options?.panelView?.isBrightness;
      let ItemIconAppearance = isBrightness ? "dark" : "light";
      let caretIconAppearance = ItemIconAppearance;
      return {
        isJATO: isJATO,
        hideGroupIcon: hideGroupIcon,
        iconAppearance: iconAppearance,
        caretIconAppearance: caretIconAppearance,
        ItemIconAppearance: ItemIconAppearance,
        rtlClass: rtlClass,
        expandTooltip: lang.expandTooltip,
        collapseTooltip: lang.collapseTooltip,
        jatoDownArrowIconSvg: jatoIcons.actionChevronSmallDown,
        jatoRightArrowIconSvg: jatoIcons.actionChevronSmallRight
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
    regions: {
      headerIconRegion: ".smart-group-card-header-icon"
    },
    attributes: {
      role: "menuitem"
    },
    constructor: function GroupCardView(options = {}) {
      this.model = options.model;
      Marionette.View.apply(this, arguments);
      let sessionStorage = namedLocalStorage.get(GROUPS_INFO_STORAGE_KEY) ?? {};
      this.expanded = false;
      let expandedKeys = Object.keys(sessionStorage);
      if (expandedKeys.includes(this?.options?.model?.id)) {
        this.expanded = true;
      }
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
        collection: cardItemsCollection,
        parentModel: this.model
      });
      region.show(this.cardListItemsView);
      if (this.expanded) {
        this.ui.list.addClass("binf-in");
        this.ui.list[0].removeAttribute("aria-expanded");
        this.ui.upBtn.removeClass("binf-hidden");
        this.ui.downBtn.addClass("binf-hidden");
        this.ui.header.attr("aria-expanded", true);
        $(this.el.querySelectorAll(".smart-group-cards-list-item")).addClass("smart-card-visible");
      }
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
      this._getIconView();
    },
    _getIconView: function() {
      let options = {};
      options.model = this?.model;
      options.isGroup = true;
      options.panelView = this.options?.panelView;
      let iconview = new IconView(options);
      iconview.render();
      this.showChildView("headerIconRegion", iconview);
    },
    expandGroup: function() {
      this.ui.list.binf_collapse("show");
      this.ui.list[0].removeAttribute("aria-expanded");
      this.ui.upBtn.removeClass("binf-hidden");
      this.ui.downBtn.addClass("binf-hidden");
      this.ui.header.attr("aria-expanded", true);
      $(this.el.querySelectorAll(".smart-group-cards-list-item")).addClass("smart-card-visible");
      let groupId = this.options.model.id;
      let storageObj = namedLocalStorage.get(GROUPS_INFO_STORAGE_KEY) ?? {};
      storageObj[groupId] = true;
      namedLocalStorage.set(GROUPS_INFO_STORAGE_KEY, storageObj);
      this.expanded = !this.expanded;
    },
    collapseGroup: function() {
      this.ui.list.binf_collapse("hide");
      this.ui.list[0].removeAttribute("aria-expanded");
      this.ui.upBtn.addClass("binf-hidden");
      this.ui.downBtn.removeClass("binf-hidden");
      this.ui.header.attr("aria-expanded", false);
      $(this.el.querySelectorAll(".smart-group-cards-list-item")).removeClass("smart-card-visible");
      let groupId = this.options.model.id;
      let storageObj = namedLocalStorage.get(GROUPS_INFO_STORAGE_KEY);
      delete storageObj[groupId];
      namedLocalStorage.set(GROUPS_INFO_STORAGE_KEY, storageObj);
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
  }, {
    storageKey: getKey()
  });
  return GroupCardView;
});