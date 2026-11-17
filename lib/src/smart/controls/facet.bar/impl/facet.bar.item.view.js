/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "hbs!smart/controls/facet.bar/impl/facet.bar.item", "hbs!smart/controls/facet.bar/impl/facet.bar.more.items", "i18n!smart/controls/facet.bar/impl/nls/lang", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "smart/themes/carbonfiber/ot-icons/icons_smart_action_16", "smart/themes/carbonfiber/ot-icons/icons_smart_action" ], function($, _, Marionette, template, moreItemsTemplate, lang, theming, jatoIcons) {
  var FacetBarItemView = Marionette.ItemView.extend({
    className: function() {
      const classes = [ "csui-facet-item" ];
      if (this.options?.moreItemsTemplate) {
        if (this.options?.model?.get("isFacetLabel")) {
          classes.push("csui-facet-label");
        }
        if (this.options?.model?.get("isTopic")) {
          classes.push("csui-facet-topic");
        }
      }
      return classes.join(" ");
    },
    tagName: "li",
    getTemplate: function() {
      return this.options?.moreItemsTemplate ? moreItemsTemplate : template;
    },
    attributes: function() {
      return {
        "aria-hidden": this.options?.moreItemsTemplate && !this.options?.model?.get("isTopic") ? "true" : undefined
      };
    },
    templateHelpers: function() {
      if (this.options?.moreItemsTemplate) {
        return {
          isJATO: theming.isJATOTheme(),
          jatoCloseIconSvg: jatoIcons.actionCloseSmall,
          clearTitle: lang.clearTitle,
          enableCloseIcon: this.enableCloseIcon,
          readOnlyFilter: this?.options?.model?.get("readOnlyFilter"),
          ...this.options?.model?.attributes
        };
      }
      return {
        isJATO: theming.isJATOTheme(),
        downCaretClasses: this.topics?.length === 1 ? "binf-hidden" : "",
        clearIconClasses: this.topics?.length > 1 ? "binf-hidden" : "",
        moreTopics: this.topics?.length > 3,
        count: this.topics?.length,
        clearTitle: lang.clearTitle,
        expandTitle: lang.expandTitle,
        collapseTitle: lang.collapseTitle,
        enableCloseIcon: this.enableCloseIcon,
        facetId: this?.options?.model?.get("facetId"),
        overflowCount: this.overflowCount || 0,
        showOverflowCount: this.showOverflowCount,
        facetExpandedItemAria: _.str.sformat(lang.facetExpandedItemAria, this.options?.model?.get("facetName")),
        expandFacetBtnAria: _.str.sformat(lang.facetItemExpandBtnAria, this.options?.model?.get("facetName")),
        collapseFacetBtnAria: _.str.sformat(lang.facetItemCollapseBtnAria, this.options?.model?.get("facetName")),
        singleValueFacetClearAria: _.str.sformat(lang.clearFacetItemAria, this.topics?.length && this.topics[0]?.topicName, this.options?.model?.get("facetName")),
        isSingleFacetValue: this.topics?.length > 1 ? false : true,
        jatoDownArrowIconSvg: jatoIcons.actionChevronSmallDown,
        jatoUpArrowIconSvg: jatoIcons.actionChevronSmallUp,
        jatoCloseIconSvg: jatoIcons.actionCloseSmall,
        readOnlyFilter: this?.options?.model?.get("readOnlyFilter")
      };
    },
    ui: {
      item: ".csui-facet-item",
      content: ".csui-facet-item-content",
      innerContainer: ".smart-facet-item-inner-container",
      multiValueItemCollapsed: ".smart-facet-item-collapsed",
      multiValueDDBtn: ".smart-facet-more-dd-expand",
      multiValueItemExpanded: ".smart-facet-item-expanded",
      multiValueDDCollapseBtn: ".smart-facet-more-dd-collapse",
      facetItemLabel: ".csui-facet-item-facet-name",
      itemTopicNamesContainer: ".smart-facet-item-collapsed .csui-facet-item-topic",
      overflowCount: ".csui-facet-item-overflow-count",
      multiValueChip: ".smart-facet-item-multi-value .csui-facet-item-content"
    },
    events: {
      "click @ui.item": "cancelClick",
      "click @ui.content": "cancelClick",
      "click @ui.multiValueChip": "expandMultiValueDD",
      "keydown @ui.multiValueDDBtn": "expandKeydown",
      "click @ui.multiValueDDCollapseBtn": "collapseMultiValueDD",
      "keydown @ui.multiValueDDCollapseBtn": "collapseKeydown",
      keydown: "onKeydown"
    },
    onKeydown: function(e) {
      const keyCode = e.keyCode, target = e.target;
      if (keyCode === 46) {
        return;
      } else if (keyCode === 9 || keyCode === 27) {
        if (this.expanded && this.ui?.multiValueItemExpanded[0]?.contains(target)) {
          this.collapseMultiValueDD(e);
        }
        return;
      } else if (keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) {
        if (target.parentNode === this.ui.multiValueItemCollapsed[0]) {
          return;
        }
      } else if (keyCode === 13 || keyCode === 32) {
        if (!this.expanded && target === this.ui?.multiValueItemCollapsed[0]?.querySelector(".csui-facet-item-content")) {
          if (this.topics?.length > 1) {
            e.preventDefault();
            e.stopPropagation();
            this.expandMultiValueDD(e);
          }
        }
        return;
      }
      switch (keyCode) {
       case 39:
       case 40:
        this.currentFocusIndex++;
        this._focusListItem(e);
        break;

       case 37:
       case 38:
        this.currentFocusIndex--;
        this._focusListItem(e);
        break;

       case 35:
        this.currentFocusIndex = this._getListfocusableElements()?.length - 1;
        this._focusListItem(e);
        break;

       case 33:
        this.currentFocusIndex = 0;
        this._focusListItem(e);
        break;

       case 34:
        this.currentFocusIndex = this._getListfocusableElements()?.length - 1;
        this._focusListItem(e);
        break;

       default:
        if (!this.options?.moreItemsTemplate) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
      return true;
    },
    _focusListItem: function(e) {
      if (this.expanded) {
        e.preventDefault();
        e.stopPropagation();
      }
      const listFocusableElements = this._getListfocusableElements();
      listFocusableElements.forEach((listItem, index) => {
        listItem.setAttribute("tabindex", -1);
        if (index === this.currentFocusIndex) {
          listItem.setAttribute("tabindex", 0);
          listItem.focus();
        }
      });
      if (this.currentFocusIndex < 0) {
        this.currentFocusIndex = 0;
      } else if (this.currentFocusIndex >= listFocusableElements.length) {
        this.currentFocusIndex = listFocusableElements.length - 1;
      }
    },
    _getListfocusableElements: function() {
      if (this.isDestroyed || !this.expanded) {
        return [];
      }
      let multiExpandedEle = this.ui.multiValueItemExpanded[0];
      let tababbleEls = multiExpandedEle && Array.from(multiExpandedEle?.querySelectorAll("*[tabindex]"));
      let focusableEls = tababbleEls?.filter(ele => ele.tagName.toLowerCase() !== "otc-button") || [];
      let ddCollapseBtnEle = this.el.querySelector(".smart-facet-more-dd-collapse > otc-button");
      ddCollapseBtnEle && focusableEls.push(ddCollapseBtnEle);
      return focusableEls;
    },
    expandKeydown: function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        this.expandMultiValueDD();
      }
    },
    collapseKeydown: function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        this.collapseMultiValueDD();
      }
    },
    constructor: function FacetBarItemView(options = {}) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.topics = this?.options?.model?.get("topics") || this?.options?.model?.topics;
      this.enableCloseIcon = !!this.options?.moreItemsTemplate ? !this?.options?.model?.get("readOnlyFilter") ?? true : this.topics?.length > 1 ? false : !this?.options?.model?.get("readOnlyFilter") ?? true;
      this.options.model?.on("change", function() {
        this._checkOverflow();
      });
      $(window).on("resize.facetview", _.bind(this.onWinResize, this));
      this.listenTo(this, "set:tab:index", function(tabIndex = 0) {
        if (this.expanded) {
          this.ui?.multiValueItemExpanded[0]?.querySelector(".smart-multi-value-facets .csui-facet-item-topic")?.setAttribute("tabindex", tabIndex);
        } else {
          this.ui?.multiValueItemCollapsed[0]?.querySelector(".csui-facet-item-content")?.setAttribute("tabindex", tabIndex);
        }
      });
      this.currentFocusIndex = 0;
      this.listenTo(this?.options?.parentView, "collapse:normal:facetbar:menu", _.bind(this._handleCollapseMultiValueDD, this));
      this.listenTo(this?.options?.parentView, "updateMaxWidth", _.bind(this._updateMaxWidth, this));
    },
    onWinResize: function() {
      this?.trigger("dom:refresh");
    },
    onDestroy: function() {
      $(window).off("resize.facetview", this.onWinResize);
      this.stopListening(this?.options?.parentView, "collapse:normal:facetbar:menu");
    },
    onDomRefresh: function() {
      this._updateMaxWidth();
      this._checkOverflow();
    },
    _updateMaxWidth: function() {
      let lengthSubstract = 0, clearAllLength = 85;
      lengthSubstract += (this.ui.overflowCount[0]?.offsetWidth || 0) + 25 + 19;
      this.ui.innerContainer?.css("max-width", this.model?.collection?.length > 1 ? `calc(320px - ${lengthSubstract}px)` : `calc(${this._parent?.availableWidth}px - (${clearAllLength}px + ${lengthSubstract}px + 40px))`);
      this.ui.multiValueItemExpanded.find(".smart-multi-value-facets").css("max-width", this.$el.width() - 43 + "px");
    },
    expandMultiValueDD: function(event) {
      this.ui.multiValueItemCollapsed?.parent().addClass("binf-open");
      this.ui.multiValueItemExpanded?.removeClass("binf-visibility-hidden");
      this.expanded = true;
      this.ui?.multiValueItemCollapsed[0]?.querySelector(".csui-facet-item-content")?.setAttribute("tabindex", -1);
      setTimeout(() => {
        this.currentFocusIndex = 0;
        this._focusListItem(event);
      }, 50);
    },
    _handleCollapseMultiValueDD: function({
      event,
      currentFocusedElement
    }) {
      if (this.$el.find(currentFocusedElement)?.length === 0 && this.el.classList.contains("binf-open")) {
        this.collapseMultiValueDD(event);
      }
    },
    collapseMultiValueDD: function(event) {
      this._getListfocusableElements()[this.currentFocusIndex]?.setAttribute("tabindex", -1);
      this.currentFocusIndex = 0;
      this.ui.multiValueItemExpanded?.addClass("binf-visibility-hidden");
      this.ui.multiValueItemCollapsed?.parent().removeClass("binf-open");
      this.expanded = false;
      const facetItem = this.ui?.multiValueItemCollapsed[0]?.querySelector(".csui-facet-item-content");
      facetItem?.setAttribute("tabindex", 0);
      facetItem?.focus();
    },
    cancelClick: function(event) {
      if (!event.target.closest(".smart-facet-close")) {
        event.preventDefault();
      } else {
        let filteredTopics = this.model.get("topics");
        filteredTopics.splice(filteredTopics.findIndex(topic => topic.topicName === $(event.target).parent().text().trim()), 1);
      }
    },
    _checkOverflow: function() {
      let itemWidth = 0;
      let checkAfterFirstvisit = false;
      let checkFirstoverflow = false;
      let prevWidth = 0;
      this.overflowCount = 0;
      let FirstofValue = 0;
      let facetWidth = this.ui.facetItemLabel[0]?.offsetWidth;
      let innerContainerWidth = this.ui.innerContainer[0]?.offsetWidth;
      if (facetWidth > innerContainerWidth / 2 && innerContainerWidth > 274) {
        this.ui.facetItemLabel[0]?.classList.add("smart-overflowing-name");
      }
      let itemsContainer = this.ui.itemTopicNamesContainer[0]?.offsetWidth;
      if (this.ui.itemTopicNamesContainer?.is(":visible")) {
        const topicNames = this.ui.itemTopicNamesContainer[0]?.querySelectorAll(".csui-facet-item-topic-name");
        if (topicNames.length > 1) {
          topicNames.forEach(item => {
            prevWidth = itemWidth;
            itemWidth += item.offsetWidth;
            if (itemWidth > itemsContainer) {
              if (!checkFirstoverflow) {
                if (this.overflowCount == 0 && prevWidth + 38 > itemsContainer) {
                  this.overflowCount++;
                }
              } else {
                this.overflowCount++;
              }
              if (this.overflowCount == 1 && !checkFirstoverflow) {
                FirstofValue = prevWidth;
                checkAfterFirstvisit = true;
              } else if (this.overflowCount > 1) {
                checkAfterFirstvisit = false;
              }
              checkFirstoverflow = true;
            }
          });
        }
      }
      if (this.overflowCount > 0) {
        if (!this.showOverflowCount) {
          this.showOverflowCount = true;
          this.ui.overflowCount?.removeClass("binf-hidden");
          if (checkAfterFirstvisit) {
            if (FirstofValue + 24 < itemsContainer) {
              this.ui.overflowCount?.addClass("binf-hidden");
            }
          }
        }
      } else {
        if (this.showOverflowCount) {
          this.showOverflowCount = false;
          this.ui.overflowCount?.addClass("binf-hidden");
        }
      }
      this.ui.overflowCount?.html("; +" + this.overflowCount);
      this._updateMaxWidth();
      this.trigger("dom:refresh");
    }
  });
  return FacetBarItemView;
});