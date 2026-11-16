/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "hbs!csui/controls/version.control.dialog/impl/add.version.update", "i18n!csui/controls/version.control.dialog/nls/lang", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/version.control.dialog/behaviors/version.control.dialog.keyboard.navigation.behavior", "csui/controls/form/fields/textareafield.view", "css!csui/controls/version.control.dialog/impl/version.control.dialog" ], function(_, $, Backbone, Marionette, template, lang, TabableRegion, VersionControlDialogKeyboardNavigationBehavior, TextAreaFieldView) {
  "use strict";
  var AddVersionControlView = Marionette.ItemView.extend({
    constructor: function AddVersionControlView(options) {
      this.options = options || (options = {});
      this.fileName = options.fileName;
      this.latestMinor = options.latestVersion.get("version_number_major") + "." + (options.latestVersion.get("version_number_minor") + 1);
      this.latestMajor = (options.latestVersion.get("version_number_major") + 1).toFixed(1);
      this.reserved = options.reserved;
      this.selectVersion = options.selectVersion;
      this.descriptionLabelId = _.uniqueId("version-description-label");
      this.descriptionFieldId = _.uniqueId("version-description-field");
      this.warningMessageId = _.uniqueId("version-unreserved-warning");
      this.warningMessage = options.warningMessage;
      this.hideWarningMessage = options.hideWarningMessage;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    className: "csui-add-version-update",
    template: template,
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      },
      VersionControlDialogKeyboardNavigationBehavior: {
        behaviorClass: VersionControlDialogKeyboardNavigationBehavior
      }
    },
    ui: {
      description: ".version-description"
    },
    templateHelpers: function() {
      const majorVersionlabel = _.str.sformat(lang.majorVersionAria, this.latestMajor), minorVersionlabel = _.str.sformat(lang.minorVersionAria, this.latestMinor);
      return {
        minorVersion: this.latestMinor,
        majorVersion: this.latestMajor,
        keepDocumentReserved: lang.keepDocumentReserved,
        selectVersionlabel: lang.selectVersionlabel,
        isNotReserved: !this.reserved,
        hideSelectVersion: !this.selectVersion,
        majorVersionlabel: majorVersionlabel,
        minorVersionlabel: minorVersionlabel,
        descriptionLabelId: this.descriptionLabelId,
        descriptionFieldId: this.descriptionFieldId,
        description: lang.description,
        warningMessage: this.warningMessage,
        hideWarningMessage: this.hideWarningMessage,
        warningMessageId: this.warningMessageId
      };
    },
    onRender: function() {
      const descriptionFieldModel = new Backbone.Model({
        id: this.descriptionFieldId,
        options: {
          placeholder: lang.addDescription
        }
      });
      const descriptionField = new TextAreaFieldView({
        model: descriptionFieldModel,
        mode: "writeonly",
        labelId: this.descriptionLabelId,
        maxLength: 255
      });
      this.descriptionField = descriptionField;
      const contentRegion = new Marionette.Region({
        el: this.ui.description
      });
      contentRegion.show(descriptionField);
    },
    onAfterShow: function() {
      this.$el.find("*[tabindex]").prop("tabindex", 0);
      this.keyboardBehavior.setFocusInView();
    },
    onDomRefresh: function() {
      this.keyboardBehavior.refreshFocusEngage();
    },
    currentlyFocusedElement: function(shiftTab) {
      return this.keyboardBehavior.getCurrentlyFocusedElement(shiftTab);
    },
    onLastTabElement: function(shiftTab, event) {
      return this.keyboardBehavior.isOnLastTabElement(shiftTab, event);
    },
    getValue: function() {
      return {
        promoteToMajor: document.querySelector('input[name="version"]').checked ? false : true,
        reserved: this.reserved && !document.querySelector('input[name="reserve"]').checked ? true : false,
        description: this.descriptionField.getValue()
      };
    }
  });
  return AddVersionControlView;
});