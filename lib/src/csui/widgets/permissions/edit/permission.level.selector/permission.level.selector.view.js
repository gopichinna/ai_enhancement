/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/models/permission/nodepermission.model", "hbs!csui/widgets/permissions/impl/edit/permission.level.selector/impl/permission.level.selector", "i18n!csui/widgets/permissions/impl/nls/lang", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "css!csui/widgets/permissions/impl/permissions", "csui/lib/binf/js/binf" ], function(_, $, Marionette, TabableRegion, NodePermissionModel, selectorTemplate, lang, theming, jatoIcons) {
  "use strict";
  var PermissionLevelSelectorView = Marionette.ItemView.extend({
    _permissionLevelOptions: undefined,
    selected: undefined,
    openSelectedProperties: false,
    className: "cs-permission-level-selector",
    template: selectorTemplate,
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    events: {
      "click li[data-optionid]": "onClickOption",
      keydown: "onKeyInView"
    },
    constructor: function PermissionLevelSelectorView(options = {}) {
      this.options = options;
      this.options.permissionModel = this.options.permissionModel || NodePermissionModel;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    initialize: function() {
      this.focusIndex = 0;
      this._setupPermissionLevelOptions();
      var selectedLevel = this.options.selected || this.options.permissionModel.getPermissionLevel();
      if (-1 !== _.indexOf(_.pluck(this._permissionLevelOptions, "id"), selectedLevel)) {
        this._setSelected(selectedLevel);
      } else {
        this._setSelected(this.options.permissionModel.PERMISSION_LEVEL_NONE);
      }
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode, focusables = this.$el.find("a[tabindex]");
      if (focusables.length) {
        if (event.keyCode === 13) {
          $(focusables[this.focusIndex]).parent().trigger("click", {
            isEnterKey: true
          });
          event.stopPropagation();
          event.preventDefault();
        } else if (keyCode === 38 || keyCode === 40) {
          if (keyCode === 38) {
            this.focusIndex > 0 && --this.focusIndex;
          } else {
            this.focusIndex < focusables.length - 1 && ++this.focusIndex;
          }
          $(focusables[this.focusIndex]).trigger("focus");
          event.stopPropagation();
          event.preventDefault();
        } else if (keyCode === 9) {
          var popoverTarget = this.$el.parents("body").find(".csui-edit-permission-popover-container" + " .binf-popover");
          popoverTarget.binf_popover("destroy");
        }
      }
    },
    onClickOption: function(e, args) {
      e.preventDefault();
      e.stopPropagation();
      this._setSelected(parseInt($(e.currentTarget).attr("data-optionid")));
      this._showSelected();
      this.trigger("permission:level:selected");
      if (!args?.isEnterKey) this.$el.trigger("setCurrentTabFocus");
    },
    templateHelpers: function() {
      return {
        permissionLevelOptions: this._permissionLevelOptions,
        isJATO: theming.isJATOTheme(),
        jatoCheckMarkSelect: jatoIcons.actionCheckmarkSelect
      };
    },
    currentlyFocusedElement: function() {
      var focusables = this.$el.find("a[tabindex]");
      if (focusables.length) {
        return $(focusables[this.focusIndex]);
      }
    },
    accDeactivateTabableRegion: function() {},
    onRender: function() {
      this._showSelected();
    },
    _getOptionName: function(opt) {
      var i;
      var name;
      i = _.indexOf(_.pluck(this._permissionLevelOptions, "id"), opt);
      name = i === -1 ? "" : this._permissionLevelOptions[i].name;
      return name;
    },
    _setupPermissionLevelOptions: function() {
      this._permissionLevelOptions = [];
      if (typeof this.options.permissionModel.PERMISSION_LEVEL_NONE !== "undefined") {
        this._permissionLevelOptions.push({
          id: this.options.permissionModel.PERMISSION_LEVEL_NONE,
          name: lang.permissionLevelNone,
          isJATO: theming.isJATOTheme()
        });
      }
      if (typeof this.options.permissionModel.PERMISSION_LEVEL_READ !== "undefined") {
        this._permissionLevelOptions.push({
          id: this.options.permissionModel.PERMISSION_LEVEL_READ,
          name: lang.permissionLevelRead,
          isJATO: theming.isJATOTheme()
        });
      }
      if (typeof this.options.permissionModel.PERMISSION_LEVEL_WRITE !== "undefined") {
        this._permissionLevelOptions.push({
          id: this.options.permissionModel.PERMISSION_LEVEL_WRITE,
          name: lang.permissionLevelWrite,
          isJATO: theming.isJATOTheme()
        });
      }
      if (typeof this.options.permissionModel.PERMISSION_LEVEL_FULL_CONTROL !== "undefined") {
        this._permissionLevelOptions.push({
          id: this.options.permissionModel.PERMISSION_LEVEL_FULL_CONTROL,
          name: lang.permissionLevelFullControl,
          isJATO: theming.isJATOTheme()
        });
      }
      if (this.options.nodeModel.get("permissions_model") !== "simple") {
        if (typeof this.options.permissionModel.PERMISSION_LEVEL_CUSTOM !== "undefined") {
          this._permissionLevelOptions.push({
            id: this.options.permissionModel.PERMISSION_LEVEL_CUSTOM,
            name: lang.permissionLevelCustom,
            showActionIcon: true,
            isJATO: theming.isJATOTheme()
          });
        }
      }
    },
    _setSelected: function(selectedOption) {
      this.selected = selectedOption;
    },
    _showSelected: function() {
      var allOptions = this.$el.find("li[data-optionid]");
      allOptions.find(".cs-icon").removeClass("select");
      allOptions.removeAttr("aria-selected");
      var selectedItem = this.$el.find("li[data-optionid=" + this.selected + "]");
      selectedItem.find(".cs-icon").addClass("select");
      selectedItem.attr("aria-selected", "true");
    },
    _showOpenSelectedProperties: function() {
      if (this.openSelectedProperties === true) {
        this.ui.toggle.attr("aria-expanded", "true");
        this.ui.iconOpenSelectedProperties.removeClass("icon-checkbox").addClass("icon-checkbox-selected");
      } else {
        this.ui.toggle.attr("aria-expanded", "false");
        this.ui.iconOpenSelectedProperties.removeClass("icon-checkbox-selected").addClass("icon-checkbox");
      }
    },
    getSelectedPermissions: function() {
      var nodeModel = this.options.nodeModel;
      return this.options.permissionModel.getPermissionsByLevelExceptCustom(this.selected, this.options.isContainer, nodeModel && nodeModel.get("advanced_versioning"), nodeModel && nodeModel.get("advancedVersioningEnabled"));
    }
  });
  return PermissionLevelSelectorView;
});