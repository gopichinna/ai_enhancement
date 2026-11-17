/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/utils/namedsessionstorage", "hbs!csui/widgets/favorites/impl/favorite.star/favorite.add.form", "hbs!csui/widgets/favorites/impl/favorite.star/favorite.add.form.group", "i18n!csui/widgets/favorites/impl/nls/lang", "smart/themes/theming" ], function(_, $, Marionette, LayoutViewEventsPropagationMixin, NamedSessionStorage, template, templateGroup, lang, theming) {
  var csuiSessionStorage = new NamedSessionStorage();
  var constCSUIFavoriteTabID = "csuiFavoriteTabID";
  var FavoriteGroupView = Marionette.ItemView.extend({
    tagName: "otc-selectitem",
    template: templateGroup,
    className: "csui-favorite-dropdown-item",
    triggers: {
      click: "click:item"
    },
    events: {
      keydown: "_onKeydown"
    },
    _onKeydown: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.trigger("click:item", this);
      }
    },
    attributes: function() {
      return {
        value: this.model.get("name")
      };
    },
    constructor: function FavoriteGroupView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  var FavoriteGroupsView = Marionette.CollectionView.extend({
    className: "favorite-groups-select-container",
    tagName: "otc-select",
    template: false,
    attributes: {
      label: lang.addFavoriteGroupLabel,
      disablenoneoption: ""
    },
    childView: FavoriteGroupView,
    childEvents: {
      "click:item": "onClickItem",
      render: "_onChildRender"
    },
    events: {
      click: "_onClickDropdown",
      keydown: "_onClickDropdown"
    },
    _onClickDropdown: function(event) {
      if (event?.keyCode !== 27) {
        event.stopPropagation();
      } else {
        if (event.target.classList.contains("csui-favorite-dropdown-item")) {
          event.stopPropagation();
        }
      }
    },
    constructor: function FavoriteGroupsView(options) {
      Marionette.CollectionView.call(this, options);
    },
    onRender: function() {
      var selectedModel = this.options.collection.findWhere({
        tab_id: this.options.favModel.get("tab_id")
      });
      var groupName = selectedModel.get("name");
      this.el.setAttribute("value", groupName);
      this.$el.attr("arialabel", lang.addFavoriteGroupLabel + " - " + groupName);
      this.$el.attr("title", groupName);
    },
    onClickItem: function(src) {
      var tabId = src.model.get("tab_id");
      this.options.favModel.set("tab_id", tabId);
      var groupName = src.model.get("name");
      this.$el.attr("arialabel", lang.addFavoriteGroupLabel + " - " + groupName);
      this.$el.attr("title", groupName);
      this.el?.removeAttribute("menuopen");
      csuiSessionStorage.set(constCSUIFavoriteTabID, tabId);
    }
  });
  var FavoriteAddFormView = Marionette.LayoutView.extend({
    template: template,
    attributes: {
      slot: "main"
    },
    templateHelpers: function() {
      return {
        isJATO: theming.isJATOTheme(),
        name_label: lang.addFavoriteNameLabel,
        name_place_holder: lang.addFavoriteNamePlaceHolder,
        name_input_id: _.uniqueId("nameInp"),
        favorite_name: this.options.favModel.get("name"),
        groups: this.showGroups,
        group_label: lang.addFavoriteGroupLabel
      };
    },
    regions: {
      favGroupsRegion: ".favorite-groups-container"
    },
    ui: {
      nameInput: ".favorite-field",
      nameInputError: ".favorite-name-input-error"
    },
    events: {
      "click @ui.nameInput": "onClickNameInput",
      keyup: "onKeyupEvent",
      "keyup @ui.nameInput": "onNameInputEvent",
      "blur @ui.nameInput": "onNameInputEvent",
      "keydown @ui.nameInput": "controlsOnKeydownEvent"
    },
    constructor: function FavoriteAddFormView(options) {
      Marionette.LayoutView.call(this, options);
      this.showGroups = true;
      if (this.options.collection.length === 1 && this.options.collection.at(0).get("tab_id") === -1) {
        this.showGroups = false;
      }
      if (this.showGroups) {
        this.groupsView = new FavoriteGroupsView(options);
        var storedTabId = csuiSessionStorage.get(constCSUIFavoriteTabID);
        var storedGroup = this.options.collection.findWhere({
          tab_id: storedTabId
        });
        if (!storedGroup) {
          storedTabId = -1;
          csuiSessionStorage.set(constCSUIFavoriteTabID, storedTabId);
        }
        storedTabId && this.options.favModel && this.options.favModel.set("tab_id", storedTabId);
      }
      this.propagateEventsToRegions();
    },
    onRender: function() {
      if (this.showGroups) {
        this.groupsView.render();
        this.favGroupsRegion.show(this.groupsView);
      }
    },
    currentlyFocusedElement: function(event) {
      return this.ui.nameInput;
    },
    showInlineError: function(error) {
      this.ui.nameInput[0].setCustomValidity(error);
    },
    clearInlineError: function() {
      this.ui.nameInput[0].setCustomValidity("");
    },
    validateNameInputAndSetAddButtonState: function(suppressError) {
      var valid = false;
      var name = this.ui.nameInput[0].getAttribute("value");
      name = name.trim();
      if (name.length < 1) {
        valid = false;
      } else if (name.length > 248) {
        suppressError !== true && this.showInlineError(lang.nameErrorMaxLengthExceed);
        this.ui.nameInput[0].reportValidity();
      } else if (name.indexOf(":") >= 0) {
        suppressError !== true && this.showInlineError(lang.nameErrorContainSemiColon);
        this.ui.nameInput[0].reportValidity();
      } else {
        this.clearInlineError();
        this.ui.nameInput[0].reportValidity();
        valid = true;
      }
      if (valid) {
        this.options.favModel.set("name", name);
        this.options.parentView.el.querySelector(".csui-add-fav-btn")?.removeAttribute("disabled");
      } else {
        this.options.parentView.el.querySelector(".csui-add-fav-btn").setAttribute("disabled", "");
      }
      return valid;
    },
    controlsOnKeydownEvent: function(event) {
      if (event.keyCode !== 27) {
        event.stopPropagation();
      }
      if (event && event.keyCode === 13) {
        this.validateNameInputAndSetAddButtonState() && this.options?.parentView?.formFooter?.trigger("click:add:button");
      }
    },
    onNameInputEvent: function(event) {
      if (event && event.keyCode === 27) {
        return;
      }
      var valid = this.validateNameInputAndSetAddButtonState();
    },
    onClickNameInput: function(event) {
      event && event.stopPropagation();
    }
  });
  _.extend(FavoriteAddFormView.prototype, LayoutViewEventsPropagationMixin);
  return FavoriteAddFormView;
});