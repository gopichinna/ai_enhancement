/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/form/pub.sub", "nuc/utils/base", "csui/behaviors/keyboard.navigation/tabables.behavior", "d2/controls/form/fields/base/d2formfield.editable.behavior", "hbs!d2/controls/form/impl/d2selectfield/d2selectfield.item", "hbs!d2/controls/form/impl/d2selectfield/d2selectfield", "i18n!d2/controls/form/impl/nls/lang", "css!d2/controls/form/impl/d2selectfield/d2selectfield", "csui/lib/binf/js/binf" ], function(_, $, Backbone, Marionette, PubSub, base, TabablesBehavior, D2FormFieldEditableBehavior, itemTemplate, collectionTemplate, lang) {
  "use strict";
  var D2SelectFieldItemView = Marionette.ItemView.extend({
    tagName: "li",
    template: itemTemplate,
    events: {
      "click >a": "onClicked",
      "keydown >a": "onKeyInView",
      "keyup >a": "onKeyUp",
      "mouseenter >a": "showTitle",
      "mouseover >a": "showTitle"
    },
    constructor: function D2SelectFieldItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "change", this.render);
      this.dropdownMenuVisible = false;
    },
    showTitle: function(event) {
      event.preventDefault();
      event.stopPropagation();
      var anchorEleWidth = this.$(event.target).closest("a").width(), spanEle = this.$(event.target).width();
      if (spanEle > anchorEleWidth) {
        this.$(event.target).attr("title", this.model.get("name"));
      }
    },
    activate: function(event) {
      var eventKeyCode = event.charCode || event.which;
      this.triggerMethod("click:link", eventKeyCode);
    },
    onClicked: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.activate(event);
    },
    onKeyInView: function(event) {
      var eventKeyCode = event.charCode || event.which;
      if (eventKeyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
      } else if (eventKeyCode === 27) {
        event.preventDefault();
        event.stopPropagation();
      } else if (eventKeyCode === 32 || eventKeyCode === 9) {
        event.preventDefault();
        event.stopPropagation();
        setTimeout(_.bind(function() {
          this.onClicked(event);
        }, this), 200);
      } else {
        this.triggerMethod("dropdown:scroll", event);
      }
    },
    onKeyUp: function(event) {
      var eventKeyCode = event.charCode || event.which;
      if (eventKeyCode === 27) {
        this._parent.escapePressed = true;
        event.preventDefault();
        event.stopPropagation();
        this.triggerMethod("keypress:escape");
      } else if (eventKeyCode === 13) {
        event.preventDefault();
        this.activate(event);
      }
    }
  });
  var D2SelectFieldView = Marionette.CompositeView.extend({
    constructor: function D2SelectFieldView(options) {
      if (!options.mode) {
        options.mode = "writeonly";
      }
      if (options.mode !== "writeonly") {
        this.behaviors = _.extend({
          FormFieldEditable: {
            behaviorClass: D2FormFieldEditableBehavior
          }
        }, this.behaviors);
      }
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.mode = this.options.mode;
      this.model = new Backbone.Model();
      this.oldVal = new Backbone.Model();
      this.isNotWriteOnly = this.mode !== "writeonly";
      if (this.options.selected) {
        this.oldVal.set(this.options.selected.attributes);
      }
      this._setSelection(this.options.selected);
      this.listenTo(this.model, "change", this._updateSelection);
      this.listenTo(this.model, "change", this.render);
      this.listenTo(this, "dropdown:scroll", this._dropdownScroll);
      if (!this.options.dataId) {
        this.options.dataId = this.options.id;
      }
    },
    className: "d2-select binf-dropdown cs-formfield",
    template: collectionTemplate,
    childView: D2SelectFieldItemView,
    childViewContainer: "ul",
    ui: {
      toggle: ".binf-dropdown-toggle",
      dropdown: ".binf-dropdown-menu",
      selectedLabel: ".binf-dropdown-toggle >.cs-label",
      caret: ".icon-caret-down",
      writeField: ".cs-field-write button.d2-select"
    },
    events: {
      "keydown @ui.writeField": "onKeyInView",
      "keyup @ui.writeField": "onKeyUp",
      "shown.binf.dropdown": "onShowDropDown",
      "show.binf.dropdown": "onBeforeShowDropDown",
      "hidden.binf.dropdown": "onHideDropDown",
      "click @ui.toggle": "openDropdown",
      "keydown @ui.toggle": "onKeyInToggle"
    },
    templateHelpers: function() {
      var idBtn = _.uniqueId("button"), writeModeAria = _.str.sformat(lang.selectedItemAria, this.model.get("name")), readModeAria = _.str.sformat(lang.selectedItemAria, this.model.get("name")), hasData = this.options.selected;
      return {
        idBtn: idBtn,
        idValueDiv: idBtn + "ValueDiv",
        noValue: lang.noValue,
        writeModeAria: writeModeAria,
        readModeAria: readModeAria,
        isNotWriteOnly: this.isNotWriteOnly,
        hasData: hasData,
        emptyLabel: lang.selectValueLabel,
        cancel: lang.cancel,
        save: lang.save,
        edit: lang.edit
      };
    },
    onRender: function() {
      this.ui.selectedLabel.text(this.model.get("title"));
      this.ui.toggle.off("click");
      setTimeout(_.bind(function() {
        var event = $.Event("tab:content:field:changed");
        this.$el.trigger(event);
      }, this), 100);
    },
    onBeforeShowDropDown: function() {
      if (base.isMSBrowser() || base.isTouchBrowser() && base.i18n && base.i18n.settings.rtl) {
        var inputEle = this.$el.find(".cs-drop-down > button");
        base.adjustDropDownField(inputEle, this.ui.dropdown, true, this, this.hideDropdown, this.ui.dropdown);
      }
    },
    onShowDropDown: function() {
      var scrollableCols = this.$el.closest(".csui-scrollable-writemode");
      if (!!scrollableCols && !scrollableCols.hasClass("csui-dropdown-open")) {
        scrollableCols.addClass("csui-dropdown-open");
      }
      this.ui.dropdown.removeClass("dropup-menu");
      this.ui.dropdown.css({
        overflow: "hidden",
        "max-height": "auto"
      });
      this.ui.dropdown.perfectScrollbar({
        suppressScrollX: true,
        scrollYMarginOffset: 15
      });
      if (!base.isMSBrowser() || !(base.isTouchBrowser() && base.i18n && base.i18n.settings.rtl)) {
        var inputEle = this.$el.find(".cs-drop-down > button");
        base.adjustDropDownField(inputEle, this.ui.dropdown, true, this, this.hideDropdown, this.ui.dropdown);
      }
      this.options.isDropDownOpen = true;
      var self = this;
      setTimeout(function() {
        self.ui.dropdown.perfectScrollbar && self.ui.dropdown.perfectScrollbar("update");
      }, 1);
    },
    openDropdown: function() {
      if (this.options.datasource && !this.options.collectionUpdated) {
        this.collection.reset(this.options.datasource.call().models);
        this.options.collectionUpdated = true;
      }
    },
    onKeyInToggle: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.openDropdown();
      }
      if (this.isNotWriteOnly && event.keyCode === 9) {
        if (event.keyCode === 9) {
          var editableBehavior = this._behaviors[0];
          editableBehavior.focusNextTabableElement(event);
        }
      }
    },
    getFocusableElementInWriteArea: function($targetEl) {
      return $targetEl.find(TabablesBehavior.focusablesSelector).filter(":visible:not([disabled])").filter(':not(a[role="menuitem"])');
    },
    onHideDropDown: function() {
      this.ui.dropdown.off("focusout");
      this.options.isDropDownOpen = false;
      var scrollableCols = this.$el.closest(".csui-scrollable-writemode");
      if (!!scrollableCols && scrollableCols.hasClass("csui-dropdown-open")) {
        scrollableCols.removeClass("csui-dropdown-open");
      }
    },
    onKeyUp: function(event) {
      if (event.keyCode === 27) {
        if (this.dropdownMenuVisible) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
      this.dropdownMenuVisible = false;
    },
    onKeyInView: function(event) {
      var eventKeyCode = event.charCode || event.which;
      if (eventKeyCode === 27) {
        if (this.isDropdownOpen()) {
          this.dropdownMenuVisible = this.isDropdownOpen();
          event.preventDefault();
          event.stopPropagation();
          this.hideDropdown(this);
        }
      } else if (eventKeyCode === 9) {
        if (this.options.mode !== "writeonly") {
          event.stopPropagation();
          event.preventDefault();
        } else {
          if (this.isDropdownOpen()) {
            this.dropdownMenuVisible = this.isDropdownOpen();
            event.preventDefault();
            event.stopPropagation();
            this.hideDropdown(this);
          }
        }
      } else if (eventKeyCode === 13) {
        if (this.options.mode !== "writeonly") {
          event.preventDefault();
        }
      } else {
        this.trigger("dropdown:scroll", event);
      }
    },
    onChildviewKeypressEscape: function() {
      if (this.isDropdownOpen()) {
        this.hideDropdown(this);
        this.ui.toggle.trigger("focus");
      }
    },
    onChildviewClickLink: function(childView) {
      if (this.model.get("id") === childView.model.get("id")) {
        this.options.isDropDownOpen = false;
        this.hideDropdown(this);
        this.ui.toggle.trigger("focus");
      } else {
        this._setSelection(childView.model);
        this.trigger("field:changed", childView.model);
        this.ui.writeField.trigger("focus");
      }
    },
    onChildviewDropdownScroll: function(childView, event) {
      this._dropdownScroll(event);
    },
    isDropdownOpen: function() {
      return !this.ui.dropdown.is(":hidden");
    },
    hideDropdown: function(view) {
      view = view.originalEvent instanceof Event ? this : view;
      if (view.isDropdownOpen()) {
        view.ui.writeField.trigger("focus");
        view.ui.toggle.binf_dropdown("toggle");
        view.options.isDropDownOpen = false;
        var scrollableCols = view.$el.closest(".csui-scrollable-writemode");
        if (!!scrollableCols && scrollableCols.hasClass("csui-dropdown-open")) {
          scrollableCols.removeClass("csui-dropdown-open");
        }
      }
    },
    saveFieldChanges: function() {
      var self = this, dfd = $.Deferred();
      if (this.oldVal.get("id") === this.model.get("id")) {
        dfd.resolve();
      } else if (_.isFunction(this.options.onSaveFieldChange)) {
        this.options.onSaveFieldChange(this.model, this).done(function() {
          self.oldVal.set(self.model.attributes);
          dfd.resolve();
        }).fail(function() {
          dfd.reject();
        });
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    revertFieldChanges: function() {
      this.model.set(this.oldVal.attributes);
      this.render();
    },
    _setSelection: function(model) {
      this.model.set(model.attributes);
    },
    _updateSelection: function() {
      this.ui.selectedLabel.text(this.model.get("name"));
      this.trigger("selection:changed");
      this.options.hasValue = true;
    },
    _dropdownScroll: function(event) {
      var desiredElement = [], typedChar = "", shiftKeyPressed = false, matchItemsValues = [], matchItemsIndex = [];
      if (event.constructor.name === "D2SelectFieldItemView") {
        event = arguments[1];
      }
      typedChar = event.key;
      shiftKeyPressed = event.shiftKey;
      this.$el.find("li").each(function(idx, item) {
        var itemVal = "";
        if (shiftKeyPressed) {
          itemVal = item.textContent.trim().charAt(0).toUpperCase();
        } else {
          itemVal = item.textContent.trim().charAt(0).toLowerCase();
        }
        if (itemVal === typedChar) {
          matchItemsValues.push(item.textContent.trim());
          matchItemsIndex.push(idx);
        }
      });
      var previousActivElement = this.$el.find("li.binf-active").text().trim();
      this.$el.find("li.binf-active").removeClass();
      var position = $.inArray(previousActivElement, matchItemsValues);
      if (position !== -1) {
        desiredElement = this.$el.find("li").eq(matchItemsIndex[position + 1]);
      } else {
        desiredElement = this.$el.find("li").eq(matchItemsIndex[0]);
      }
      if (desiredElement.length > 0) {
        this.ui.dropdown.scrollTop(0);
        this.ui.dropdown.scrollTop(desiredElement.position().top);
        desiredElement.find("a").trigger("focus");
        desiredElement.addClass("binf-active");
        this.ui.dropdown.perfectScrollbar("update");
      }
    }
  });
  return D2SelectFieldView;
});