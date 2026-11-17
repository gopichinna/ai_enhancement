/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/utils/smart.base", "smart/controls/listitem/listitemstandard.view", "hbs!smart/controls/node.picker/impl/node.list/list.item", "smart/controls/node.picker/indicator/node.indicator.icons.view", "i18n!smart/controls/node.picker/impl/nls/lang", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "smart/utils/otwc.loader", "smart/themes/carbonfiber/ot-icons/icons_smart_action" ], function(_, $, Marionette, SmartBase, StandardListItem, itemTemplate, NodeIndicatorsView, npLang, theming, jatoIcons) {
  var ListItem = StandardListItem.extend({
    template: itemTemplate,
    templateHelpers: function() {
      var isSelectableNode = this.options.commandType.isSelectable(this.getResolvedModel()), isBrowsable = this._isBrowsable(this.model);
      return {
        name: this.model?.get(this?.nameAttribute),
        secText: this.model?.get(this?.secTextAttribute),
        showOnHover: isSelectableNode ? "csui-selectable" : "",
        selected: this.selected ? "smart-icon-checkbox-selected" : "",
        isBrowsed: this.browsed,
        notBrowsable: !isBrowsable,
        checkboxAria: _.str.sformat(npLang.checkboxSelectAria, this.model.get("name")),
        ariaChecked: this.selected,
        inlineForm: this.model.inlineFormView !== undefined,
        hasTableToolbarView: this.options.hasTableToolbarView,
        disableCheckbox: !isSelectableNode,
        isSingleSelect: !this.options.isMultiSelect,
        isSearchView: this.options.searchView,
        showInlineActionBar: this.options.showInlineActionBar,
        locationName: this.model?.parent?.get("name") ?? npLang.noValue,
        isJATO: theming.isJATOTheme(),
        jatoCaretIcon: jatoIcons.actionChevronLargeRight,
        jatoActionCheckmarkSelect: jatoIcons.actionCheckmarkSelect,
        secTextId: "secTextId" + this.model.cid
      };
    },
    tagName: "li",
    attributes: function() {
      if (this.model?.get(this?.secTextAttribute) && !this.options?.masterView?.isGridView()) {
        return {
          "aria-describedby": "secTextId" + this.model.cid
        };
      }
    },
    events: function() {
      var events = {
        keydown: "onKeyInView",
        "click .csui-list-item-title": "onTitleClick",
        "click .smart-location-title": "onLocationClick"
      };
      var node = this?.getResolvedModel();
      if (!node.get("container") || this._isBrowsable()) {
        _.extend(events, {
          click: "onSelectClick"
        });
      }
      return events;
    },
    ui: {
      link: ".csui-list-group-item",
      inlineFormContainer: ".csui-inlineform-container",
      itemTitle: ".csui-list-item-title",
      locationTitle: ".smart-location-title",
      nodeIndicator: ".smart-indicator-wrapper",
      nodeTypeIconInfo: ".smart-np-thumb-info"
    },
    constructor: function ListItem(options = {}) {
      this.options = options;
      this.nameAttribute = this?.options?.nameAttribute ?? "name";
      this.secTextAttribute = this?.options?.secTextAttribute;
      this.showInlineActionBar = this.options?.showInlineActionBar;
      this.toolbarData = this.options?.toolbarData;
      this._toggleInlineActionsDisplay();
      var childEvents = _.bind(this.events, this);
      StandardListItem.apply(this, arguments);
      if (this.options.showInlineActionBar) {
        this._delegateEventsOnShowInlineActions(childEvents);
      }
      this.selected = this._updateSelection(false);
      this.browsed = false;
      this.model?.get(this?.secTextAttribute) ? this?.el?.classList.add("smart-secondary-text-list-item") : "";
      if (this.model.newlyAddedNode) {
        this.el?.classList?.add("smart-new-item");
      } else {
        this.el?.classList?.remove("smart-new-item");
      }
    },
    _toggleInlineActionsDisplay: function() {
      if (this.options?.searchView || this.options.model?.inlineFormView !== undefined || this.options?.masterView?.isGridView()) {
        this.options.showInlineActionBar = false;
        this.options.toolbarData = false;
      } else {
        this.showInlineActionBar = this?.showInlineActionBar;
        this.toolbarData = this?.toolbarData;
        this.getInlinMenuView = this?.options?.getInlinMenuView;
      }
    },
    _delegateEventsOnShowInlineActions: function(childEvents) {
      var parentEvents = this?.events;
      this.events = function() {
        return _.extend({}, _.isFunction(parentEvents) ? parentEvents.call(this) : parentEvents, _.isFunction(childEvents) ? childEvents.call(this) : childEvents);
      };
      this.undelegateEvents();
      this.delegateEvents();
    },
    _updateSelection: function(selected) {
      this.selected = selected;
      this.$el.attr("aria-selected", this.selected);
    },
    toggleSelect: function() {
      if (!this.isDestroyed) {
        this._updateSelection(!this.selected);
        this.render();
      }
    },
    toggleBrowse: function() {
      if (!this.isDestroyed) {
        this.browsed = !this.browsed;
        this.render();
      }
    },
    assignedSelect: function() {
      if (!this.isDestroyed) {
        this._updateSelection(true);
        this.render();
      }
    },
    assignedBrowse: function() {
      if (!this.isDestroyed && !this.browsed) {
        this.browsed = true;
        this.render();
        if (this.options?.searchView) {
          let locationGroup = this.el?.querySelector(".smart-location-group")?.classList;
          !locationGroup?.contains("binf-hidden") && locationGroup?.add("binf-hidden");
        }
      }
    },
    unassignSelect: function() {
      if (!this.isDestroyed) {
        this._updateSelection(false);
        this.render();
      }
    },
    unassignBrowse: function() {
      if (!this.isDestroyed) {
        this.browsed = false;
        this.render();
      }
    },
    isSelected: function() {
      return this.selected;
    },
    isBrowsed: function() {
      return this.browsed;
    },
    setValidity: function(valid) {
      this.valid = valid;
    },
    setEnable: function(enable) {
      var node = this?.getResolvedModel(), browsable = this._isBrowsable(), selectable = this.options.commandType.isSelectable(node), searchView = this.options.searchView, typeName = this.model?.get("type_name"), name = this.model?.get("name"), parent = this.model?.parent?.get("name");
      if (enable) {
        this.$el.removeClass("csui-disabled");
        this.el?.setAttribute("aria-disabled", false);
        var elementNamePlus = _.str.sformat(npLang.itemTypeNameAria, typeName, name);
        if (!this.valid) {
          elementNamePlus = _.str.sformat(npLang.itemTypeNameAria, typeName, name);
        }
        if (selectable && browsable) {
          elementNamePlus = _.str.sformat(npLang.selectNBrowseAria, typeName, name);
        } else if (selectable) {
          elementNamePlus = _.str.sformat(npLang.selectAria, typeName, name);
        } else if (browsable) {
          elementNamePlus = _.str.sformat(npLang.browseAria, typeName, name);
        }
        if (searchView) {
          elementNamePlus = _.str.sformat(npLang.searchViewselectAria, typeName, name, parent);
          var searchItemAria = _.str.sformat(npLang.searchItemAria, typeName, name, parent);
          this.el.querySelector(".csui-list-item-title").setAttribute("aria-label", searchItemAria);
          var searchLocationAria = _.str.sformat(npLang.searchLocationAria, parent, name);
          if (!browsable) {
            searchLocationAria = _.str.sformat(npLang.disabledSearchLocationAria, parent);
          }
          this.el.querySelector(".smart-location-title").setAttribute("aria-label", searchLocationAria);
        }
        if (!this.nodeIndicatorAria) {
          this.$el.attr("aria-label", elementNamePlus);
        }
        if (this.options?.showInlineActionBar) {
          elementNamePlus += npLang.deleteAria;
          this.$el.attr("aria-label", elementNamePlus);
        }
      } else {
        this.$el.addClass("csui-disabled");
        this.el?.setAttribute("aria-disabled", true);
        var disabledTitle = _.str.sformat(npLang.itemTypeNameAria, typeName, name);
        if (searchView) {
          disabledTitle = _.str.sformat(npLang.disabledItemTypeParentNameAria, typeName, name, parent);
          var disableItemAria = _.str.sformat(npLang.disabledSearchItemTypeNameAria, typeName, name, parent);
          this.el.querySelector(".csui-list-item-title").setAttribute("aria-label", disableItemAria);
          var disableLocationAria = _.str.sformat(npLang.disabledSearchLocationAria, parent);
          this.el.querySelector(".smart-location-title").setAttribute("aria-label", disableLocationAria);
        }
        if (!this.nodeIndicatorAria) {
          this.$el.attr("aria-label", disabledTitle);
        } else {
          disabledTitle = `${disabledTitle} (${this.nodeIndicatorAria})`;
          this.$el.attr("aria-label", disabledTitle);
        }
      }
      if (node.get("container") && !browsable) {
        this.$el.addClass("csui-browse-disabled");
      } else {
        this.$el.removeClass("csui-browse-disabled");
      }
      if (!selectable) {
        this.el?.classList?.add("csui-select-disabled");
      }
    },
    onSelectClick: function(e) {
      if (this.model.inlineFormView !== undefined || e?.target?.classList?.contains("smart-input-edit-container") || e?.target?.classList?.contains("smart-input-edit-text-box")) {
        return;
      }
      this.trigger("select:item");
    },
    onTitleClick: function(e) {
      e.stopPropagation();
      if (this.model.inlineFormView !== undefined || e?.target?.classList?.contains("smart-input-edit-container") || e?.target?.classList?.contains("smart-input-edit-text-box")) {
        return;
      }
      if (!this.options?.commandType?.multiSelect && !this.isSelected() || this._isSelectable() && !this._isBrowsable()) {
        this.onSelectClick(e);
      }
      this.trigger("browse:item");
    },
    onLocationClick: function() {
      this.trigger("click:location", this.model?.parent);
    },
    onDomRefresh: function() {
      if (this.activeInlineForm) {
        this.activeInlineForm.triggerMethod("dom:refresh", this.activeInlineForm);
      }
    },
    onRender: function() {
      if (this.model.inlineFormView !== undefined) {
        this.options?.masterView?.isGridView() ? this.$el.addClass("csui-has-grid-inlineform csui-has-inlineform") : this.$el.addClass("csui-has-inlineform");
        this.activeInlineForm = new this.model.inlineFormView({
          model: this.model,
          originatingView: this,
          context: this.context,
          cancelTitle: "",
          isMlDataEnabled: this.options?.isMlDataEnabled,
          multiLingualPopoverMixin: this.options?.multiLingualPopoverMixin,
          metadataLanguages: this.options?.metadataLanguages,
          masterView: this.options?.masterView
        });
        this.listenTo(this.model, "edit:ended", function() {
          this.model.unset("smartInlineFormErrorMessage", {
            silent: true
          });
          delete this.model.inlineFormView;
          this._parent?.options?.selectView?.unblockActions();
          if (!!this.model.get("id")) {
            this.$el.removeClass("csui-has-error");
            this.el?.classList?.add("smart-new-item");
            this.model.newlyAddedNode = true;
            this.options?.masterView?.isGridView() ? this.$el.removeClass("csui-has-grid-inlineform") : "";
            !this.selected && this.onSelectClick();
          }
          delete this.activeInlineForm;
          this._toggleInlineActionsDisplay();
          this._delegateEventsOnShowInlineActions();
          this.render();
          this.el?.classList?.remove("csui-has-inlineform");
        });
        var inlineFormRegion = new Marionette.Region({
          el: this.ui.inlineFormContainer
        });
        inlineFormRegion.show(this.activeInlineForm);
        this.activeInlineForm.$el.find(".csui-btn-cancel").attr("title", npLang.cancelButtonLabel);
        if (!!this.model.get("smartInlineFormErrorMessage")) {
          this._parent?.options?.selectView?.unblockActions();
          this.$el.addClass("csui-has-error");
        }
      }
      this.$el.addClass("cs-left-item-" + this.model.get("id"));
      this.$el.removeClass("select");
      this.$el.removeClass("browse");
      if (this?.options?.treeView) {
        this.$el.attr("role", "treeitem");
      } else {
        this.$el.attr("role", "option");
      }
      this.$el.removeAttr("aria-label");
      this.setEnable(true);
      if (!this.options?.searchView) {
        $(".binf-list-group").removeClass("search-left-item");
        if ($(".csui-np-content .csui-search-item-left-panel").is(":visible")) {
          $(".binf-list-group").addClass("search-left-folder-right");
        } else if ($(".cs-start-locations .binf-search-location-group").is(":visible")) {
          $(".binf-list-group").removeClass("search-left-folder-right");
        }
        if (this._nodeLocationIconView) {
          this._nodeLocationIconView.destroy();
        }
      }
      if (this.options?.searchView && this.model?.parent) {
        if (this.options?.getNodeTypeIconView) {
          var locationIconViewOptions = {
            el: this.el.querySelector(".smart-type-location-icon"),
            node: this.model.parent,
            searchView: this.options?.searchView,
            gridView: this.options?.masterView?.isGridView()
          };
          this._nodeIconViewLocation = this.options?.getNodeTypeIconView(locationIconViewOptions);
          this._nodeIconViewLocation.render();
        }
      }
      var browsable = this._isBrowsable();
      if (this.selected) {
        this.$el.addClass("select");
        this.$el.attr("aria-label", _.str.sformat(npLang.checkboxSelectAria, this.model.get("type_name"), this.model.get("name")));
        this.el.querySelector(".smart-np-list-checkbox")?.setAttribute("checked", this.selected);
      } else if (this.browsed) {
        this.$el.addClass("browse");
        this.$el.attr("aria-label", _.str.sformat(npLang.checkboxBrowsedAria, this.model.get("type_name"), this.model.get("name")));
      }
      if (this.selected && this.browsed) {
        this.$el.attr("aria-label", _.str.sformat(npLang.checkboxAriaSelectNBrowse, this.model.get("type_name"), this.model.get("name")));
      }
      if (this.model?.isSelected && !this.options.isMultiSelect) {
        this.el?.classList?.add("select");
      }
      var selectable = this.options.commandType.isSelectable(this.getResolvedModel());
      var iconViewOptions = {
        el: this.el.querySelector(".smart-type-icon"),
        node: this.model,
        gridView: this.options?.masterView?.isGridView(),
        searchView: this.options?.searchView
      };
      !browsable && !selectable && _.extend(iconViewOptions, {
        filter: "grayscale",
        selectable: false
      });
      if (this.options?.getNodeTypeIconView) {
        iconViewOptions.size = "small";
        this._nodeIconView = this.options?.getNodeTypeIconView(iconViewOptions);
        if (this._nodeIconView.el) {
          this._nodeIconView?.render();
        } else {
          this.el.querySelector(".csui-type-icon")?.classList?.add("smart-custom-mimeicon-wrapper");
          this.$el.find(".smart-type-icon").append(this._nodeIconView);
        }
      }
      if (this.options?.getNodeTypeIconInfo) {
        let nodeIconInfo = this.options?.getNodeTypeIconInfo(iconViewOptions) ?? "";
        if (nodeIconInfo.length) {
          this.ui.nodeTypeIconInfo.removeClass("binf-hidden");
          this.ui.nodeTypeIconInfo.html(nodeIconInfo);
        }
      }
      this._renderNodeIndicatorView();
    },
    _renderNodeIndicatorView: function() {
      let self = this;
      if (this.options?.nodeIndicators) {
        let nodeIndicatorViewOptions = {
          model: this.model,
          ...this.options
        };
        let nodeIndicatorCollection = NodeIndicatorsView.getEnabledNodeIndicatorIcons(nodeIndicatorViewOptions);
        if (nodeIndicatorCollection.length && this.ui.nodeIndicator.length) {
          this.ui.nodeIndicator.removeClass("binf-hidden");
          this.nodeIndicatorView = new NodeIndicatorsView({
            collection: nodeIndicatorCollection,
            nodeModel: this.options.model
          });
          new Marionette.Region({
            el: this.ui.nodeIndicator
          }).show(this.nodeIndicatorView);
          let ariaLabels = [];
          nodeIndicatorCollection.models.forEach(function(model) {
            var ariaLabel = model.get("ariaLabel");
            if (_.isFunction(ariaLabel)) {
              ariaLabels.push(ariaLabel(self?.nodeIndicatorView?.options));
            } else {
              ariaLabels.push(ariaLabel);
            }
          });
          let indicatorAriaLabels = _.str.sformat(npLang.indicatedAsLabel, ariaLabels.join(","));
          let oldAriaLabel = this.$el.attr("aria-label");
          let newAriaLabel = `${oldAriaLabel} (${indicatorAriaLabels})`;
          this.$el[0].setAttribute("aria-label", newAriaLabel);
          this.nodeIndicatorAria = indicatorAriaLabels;
        }
      }
    },
    _hideIcons: function() {
      let filtered = !this.model.collection.findWhere({
        type: this.model.get("type")
      });
      if (this.options.hideIcons && this.filtered) {
        this._nodeIconView.$el.addClass("binf-hidden");
      }
    },
    onBeforeDestroy: function() {
      if (this._nodeIconView?.el) {
        this._nodeIconView.destroy();
      }
    },
    _openSearchLocation: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this._parent.triggerMethod("click:location", this.model.parent);
    },
    _isBrowsable: function() {
      return this.options.commandType.browseAllowed(this.model);
    },
    _isSelectable: function() {
      return this.options.commandType.isSelectable(this.model);
    },
    getResolvedModel: function() {
      var model = this.model;
      if (this.options.resolveShortcuts && model.get("type") === 1 && model.original !== undefined) {
        model = model.original;
      }
      return model;
    },
    onKeyInView: function(event) {
      if (this.model.inlineFormView !== undefined) {
        return;
      }
      let retVal = true;
      if (!this.options.searchView) {
        switch (event.keyCode) {
         case 9:
          break;

         case 46:
          if (this.options?.showInlineActionBar) {
            this._inlineMenuView?.trigger("delete:item", event);
          }
          retVal = false;
          break;

         case 13:
          event.preventDefault();
          event.stopPropagation();
          this.onTitleClick(event);
          this.el?.focus();
          retVal = false;
          break;

         case 32:
          event.preventDefault();
          event.stopPropagation();
          this.onSelectClick();
          if (this.options?.showInlineActionBar) {
            this.$el.trigger("mouseenter");
          }
          retVal = false;
        }
        return retVal;
      } else {
        this.onKeyInSearchView(event);
      }
    },
    onKeyInSearchView: function(event) {
      var continueEvent = true, target = event.target;
      switch (event.keyCode) {
       case 13:
        if (target === this.el) {
          this._getFocusables()[0].focus();
          this.el?.setAttribute("aria-disabled", false);
          this.currentFocusIndex = 0;
          continueEvent = false;
        }
        if (target === this.ui.locationTitle[0]) {
          this.onLocationClick();
          continueEvent = false;
        }
        if (target === this.ui.itemTitle[0]) {
          this.onTitleClick(event);
          continueEvent = false;
        }
        break;

       case 27:
        if (target === this.ui.itemTitle[0] || target === this.ui.locationTitle[0]) {
          if (this.el?.classList?.contains("csui-disabled")) {
            this.el?.setAttribute("aria-disabled", true);
          }
          this.el.focus();
          event.preventDefault();
          continueEvent = false;
        }
        break;

       case 32:
        if (target === this.el) {
          event.preventDefault();
          event.stopPropagation();
          this.onSelectClick();
          continueEvent = false;
        }
        break;

       case 37:
        if (target !== this.el) {
          SmartBase.isRTL() ? this.currentFocusIndex++ : this.currentFocusIndex--;
          this._focusListItemElements(event);
          continueEvent = false;
        }
        break;

       case 39:
        if (target !== this.el) {
          SmartBase.isRTL() ? this.currentFocusIndex-- : this.currentFocusIndex++;
          this._focusListItemElements(event);
          continueEvent = false;
        }
        break;
      }
      return continueEvent;
    },
    _getFocusables: function() {
      return Array.from(this.el.querySelectorAll("*[tabindex]:not(.smart-disabled-list-item):not(.smart-np-list-checkbox)"));
    },
    _focusListItemElements: function(e) {
      const listItemFocusableElements = this._getFocusables();
      listItemFocusableElements.forEach((ele, index) => {
        ele.setAttribute("tabindex", -1);
        if (index === this.currentFocusIndex) {
          ele.setAttribute("tabindex", 0);
          ele.focus();
        }
      });
      if (this.currentFocusIndex < 0) {
        this.currentFocusIndex = 0;
      } else if (this.currentFocusIndex >= listItemFocusableElements.length) {
        this.currentFocusIndex = listItemFocusableElements.length - 1;
      }
    }
  });
  return ListItem;
});