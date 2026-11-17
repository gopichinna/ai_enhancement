/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabables.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/mass.update/mass.update.property.page/mass.update.metadata.properties.view", "d2/dialogs/mass.update/mass.update.flyout/mass.update.flyout.view", "d2/utils/constants", "hbs!d2/dialogs/mass.update/mass.update.property.page/impl/mass.update.property", "i18n!d2/dialogs/mass.update/impl/nls/lang", "i18n!d2/commands/nls/localized.strings", "css!d2/dialogs/mass.update/mass.update.property.page/impl/mass.update.property" ], function(i18n, $, _, Marionette, TabablesBehavior, WizardTabableRegionBehavior, MassUpdateMetadataPropertiesView, MassUpdateFlyoutView, constants, template, lang, commandLang) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-mass-update-property-page",
    template: template,
    regions: {
      metadataRegion: ".d2-mass-update-metadata-wrapper"
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    ui: {
      infoArea: ".d2-mass-update-info",
      infoIcon: ".d2-mass-update-info .info-flyout"
    },
    events: {
      "click @ui.infoIcon": "onClickInfoIcon",
      "keyup @ui.infoIcon": "onKeyupInfoIcon"
    },
    templateHelpers: function() {
      return {
        showInfoIcon: this.options.massUpdateOptions["include-options"] && this.options.massUpdateOptions["include-options"].length,
        infoMessage: lang["updateCommon" + this.options.langPrefix + "Properties"]
      };
    },
    constructor: function MassUpdatePropertyView(options) {
      options = options || {};
      if (options.massUpdateData) {
        _.extend(options, options.massUpdateData);
      }
      if (options.massUpdateOptions["update-types"] === constants.MassUpdateOptions.ITEM_PROPERTIES && (options.massUpdateOptions["sv_file_option"] === "Do not update selected files" || options.massUpdateOptions["sv_folder_option"] === "Do not update folders or sub-folders")) {
        options.massUpdateOptions["update-types"] = options.massUpdateOptions["sv_file_option"] !== "Do not update selected files" ? constants.MassUpdateOptions.FILE_PROPERTIES : options.massUpdateOptions["sv_folder_option"] !== "Do not update folders or sub-folders" ? constants.MassUpdateOptions.FOLDER_PROPERTIES : constants.MassUpdateOptions.ITEM_PROPERTIES;
      }
      options.langPrefix = options.massUpdateOptions["update-types"] === constants.MassUpdateOptions.FOLDER_PROPERTIES ? "Folder" : options.massUpdateOptions["update-types"] === constants.MassUpdateOptions.FILE_PROPERTIES ? "File" : "Item";
      this.createMetadataView(options);
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.currentlyFocusedElement = function(event) {
        var tabElements = this.$(TabablesBehavior.focusablesSelector).filter(":visible:not([disabled])");
        tabElements = tabElements.filter(function(index, tabElement) {
          return !$(tabElement).parents(".d2-mass-update-field").length;
        });
        if (tabElements.length) {
          tabElements.prop("tabindex", 0);
        } else if (this.metadataView.massUpdateFieldView && !event.shiftKey) {
          return this.metadataView.massUpdateFieldView.tableView.$el.find('[TabIndex*="0"]');
        }
        if (!!event && event.shiftKey) {
          return tabElements[tabElements.length - 1];
        } else {
          return tabElements[0];
        }
      };
      this.listenTo(this, "hide-popover", this.hidePopover);
    },
    createMetadataView: function(options) {
      this.metadataView = new MassUpdateMetadataPropertiesView(_.extend({
        originatingView: this
      }, options));
      this.listenTo(this.metadataView.collection, "reset", this.onMetadataFormsSync);
    },
    onRender: function() {
      this.showMetadataView();
    },
    onMetadataFormsSync: function() {
      if (this.metadataView.node.maxObjectThresholdReached) {
        this.ui.infoArea.after('<div class="d2-mass-update-exceed-message" tabindex="0">' + _.str.sformat(lang["exceedMessage" + this.options.langPrefix], this.metadataView.node.maxObjectsForMassUpdatePropertyFetch) + "</div>");
        this.listenTo(this.metadataView, "metadataView:relayout", function() {
          if (this.metadataView.tabContent && this.metadataView.tabContent.$el.is(":visible")) {
            this.metadataView.tabContent.$el.outerHeight(this.metadataView.tabContent.$el.outerHeight() - 50);
          }
        }.bind(this));
      }
    },
    showMetadataView: function() {
      this.metadataView && this.metadataRegion.show(this.metadataView);
    },
    onKeyupInfoIcon: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onClickInfoIcon(event);
        break;

       case 27:
        if (this.preventEscape) {
          event.stopPropagation();
          event.preventDefault();
          this.preventEscape = false;
        }
        break;
      }
    },
    onClickInfoIcon: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (this.flyout && !this.preventToggle) {
        if (!this.ui.infoIcon.data("binf.popover") || !this.ui.infoIcon.data("binf.popover").options.content) {
          this.ui.infoIcon.binf_popover("destroy");
          this.ui.infoIcon.binf_popover(this.popoverOptions);
        }
        this.ui.infoIcon.binf_popover("toggle");
        this.ui.infoIcon.data("binf.popover").tip().hasClass("binf-in") && this.flyout.setFocus();
      } else if (!this.preventToggle) {
        this.showPopover(event);
      }
    },
    showPopover: function() {
      if (!this.flyout) {
        this.flyout = new MassUpdateFlyoutView({
          massUpdateOptions: this.options.massUpdateOptions,
          langPrefix: this.options.langPrefix,
          originatingView: this
        });
        this.flyout.render();
        this.popoverOptions = {
          content: this.flyout.$el,
          html: true,
          container: $.fn.binf_modal.getDefaultContainer(),
          template: '<div class="binf-popover d2-mass-update-info-flyout" role="tooltip"><div class="binf-arrow"></div><div class="binf-popover-content"></div></div>',
          placement: this._getPopoverPlacement(),
          trigger: "manual"
        };
        this.ui.infoIcon.binf_popover(this.popoverOptions);
        this.ui.infoIcon.binf_popover("show");
        this.flyout.setFocus();
        this.flyout.trigger("ensure:scrollbar");
      } else {
        if (!this.ui.infoIcon.data("binf.popover") || !this.ui.infoIcon.data("binf.popover").options.content) {
          this.ui.infoIcon.binf_popover("destroy");
          this.ui.infoIcon.binf_popover(this.popoverOptions);
        }
        this.ui.infoIcon.binf_popover("toggle");
        this.ui.infoIcon.data("binf.popover").tip().hasClass("binf-in") && this.flyout.setFocus();
      }
    },
    hidePopover: function(event) {
      event.stopPropagation();
      event.preventDefault();
      event.type !== "focusout" && this.ui.infoIcon.data("binf.popover") && this.ui.infoIcon.data("binf.popover").tip().hasClass("binf-in") && this.ui.infoIcon.trigger("focus");
      this.ui.infoIcon.binf_popover("hide");
      event.type === "keydown" && (this.preventEscape = true);
    },
    _getPopoverPlacement: function() {
      var offset = this.ui.infoIcon.offset(), infoWidth = this.ui.infoIcon.outerWidth(), calc_width = $(window).width() - (offset.left + infoWidth);
      return i18n.settings.rtl ? offset.left > 260 ? "left" : "right" : calc_width > 260 ? "right" : "left";
    },
    isValid: function() {
      if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
        return this.metadataView.expandFieldRegion.currentView.isValid();
      } else {
        return this.metadataView.isValid() && this.metadataView.options.node._massUpdateFormValuesMap && this.metadataView.options.node._massUpdateFormValuesMap["properties-list"].length > 0;
      }
    },
    onWizardBackClick: function() {
      this.metadataView && this.metadataView.onWizardBackClick();
    },
    getTitle: function() {
      if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
        return this.metadataView.expandFieldRegion.currentView.getTitle();
      }
      return _.str.sformat(commandLang.MassUpdatePropertyPageTitle, this.options.massUpdateOptions.massUpdateConfigName);
    },
    getSubTitle: function() {
      var validObjects = this.options.massUpdateValidationData.validObjects, str = commandLang["MassUpdatePropertyPage" + this.options.langPrefix + "sSubtitle"];
      return validObjects.length > 1 ? _.str.sformat(str, validObjects.length) : validObjects[0]["object_name"];
    },
    getNextButtonLabel: function() {
      if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
        return this.metadataView.expandFieldRegion.currentView.getNextButtonLabel();
      } else {
        return this.metadataView.options.signOffFormModel && this.metadataView.options.signOffFormModel.get("options").externalEsignOff ? lang.nextLabel : commandLang.MassUpdateSubmitLabel;
      }
    },
    isNextButtonHidden: function() {
      if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
        return this.metadataView.expandFieldRegion.currentView.isNextButtonHidden();
      }
      return false;
    },
    isPreviousButtonHidden: function() {
      if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
        return false;
      }
      var massUpdateValidationData = this.options.massUpdateValidationData;
      return !(this.options.massUpdateOptions["is_warning_message_enabled"] && (massUpdateValidationData.errorNodes || massUpdateValidationData.partialUpdatedNodes));
    },
    getBackButtonTooltip: function() {
      if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
        return this.metadataView.expandFieldRegion.currentView.getBackButtonTooltip();
      }
      return lang.validationStepBackTooltip;
    }
  });
});