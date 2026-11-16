/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "d2/dialogs/new.file/profile.metadata.properties.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "i18n!d2/dialogs/new.file/create/impl/nls/lang", "css!d2/dialogs/new.file/create/impl/create.metadata.propertypage" ], function(_, $, Backbone, Marionette, ItemMetadataPropertiesView, WizardTabableRegionBehavior, lang) {
  "use strict";
  var CreateMetadataPropertiesView = ItemMetadataPropertiesView.extend({
    className: function() {
      return ItemMetadataPropertiesView.prototype.className.call(this) + " create-metadata-properties";
    },
    constructor: function CreateMetadataPropertiesView(options) {
      this.behaviors = _.extend({
        WizardTabableRegion: {
          behaviorClass: WizardTabableRegionBehavior
        }
      }, this.behaviors);
      options.mode = "spy";
      options.parent = options.wizard;
      ItemMetadataPropertiesView.prototype.constructor.call(this, options);
      this.options.wizard = options.wizard;
      this.isLinkedDoc = options.isLinkedDoc;
    },
    onValidateForm: function(isValid) {
      if (isValid) {
        this.nextButtonDisabled = false;
        this.options.wizard.refreshFooter();
      } else {
        this.nextButtonDisabled = true;
        this.options.wizard.refreshFooter();
      }
    },
    onRenderValidation: function(isValid) {
      this.onValidateForm(isValid);
    },
    validate: function() {
      var deferred = $.Deferred();
      this.validateAllForms(true).done(function(isValid) {
        if (isValid === false) {
          this.onValidateForm(isValid);
        }
        deferred.resolve(isValid);
      }.bind(this));
      return deferred;
    },
    getTitle: function() {
      return this.isLinkedDoc ? lang.propertiesLinkedDocTitle : lang.propertiesTitle;
    },
    onBeforeShow: function() {
      this.refreshForms();
      var tokenId = this.options.node._tokenId;
      if (tokenId) {
        this.options.node._changedFormValuesMap = {
          properties: {},
          signoffInputs: {}
        };
      }
    }
  });
  return CreateMetadataPropertiesView;
});