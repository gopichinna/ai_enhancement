/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/url", "d2/commands/external.esign", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/mass.update/mass.update.property.page/mass.update.field.view", "d2/dialogs/mass.update/mass.update.property.page/mass.update.form.view", "d2/dialogs/mass.update/mass.update.property.page/mass.update.field.correction.view", "d2/widgets/metadata/metadata.properties.view", "i18n!d2/dialogs/mass.update/impl/nls/lang", "css!d2/dialogs/mass.update/mass.update.property.page/impl/mass.update.metadata.properties" ], function($, _, Marionette, Url, ExternalESignCommand, WizardTabableRegionBehavior, MassUpdateFieldView, MassUpdateFormView, MassUpdateCorrectionView, D2MetadataPropertiesView, lang) {
  "use strict";
  return D2MetadataPropertiesView.extend({
    className: function() {
      return D2MetadataPropertiesView.prototype.className.call(this) + " mass-update-metadata-properties";
    },
    constructor: function MassUpdateMetadataPropertiesView(options) {
      options = options || {};
      this.node = options.node;
      options.mode = "spy";
      options.action = "edit";
      options.formMode = "create";
      options.eSignMessage = lang.eSignMessage;
      options.showExpandESign = true;
      options.setEsignRequired = true;
      this.behaviors = _.extend({}, this.behaviors, {
        WizardTabableRegionBehavior: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
      D2MetadataPropertiesView.prototype.constructor.call(this, options);
      var oldCurrentlyFocusedElement = this.currentlyFocusedElement;
      this.currentlyFocusedElement = function(event) {
        if (this.massUpdateFieldView) {
          return this.massUpdateFieldView.tableView.$el.find('[TabIndex*="0"]');
        } else if (this.focusControl) {
          return this.focusControl.fieldView.ui.writeField;
        } else {
          return oldCurrentlyFocusedElement.call(this, event);
        }
      };
      this.allForms.layoutMode = this.getLayoutMode(this.options?.wizard?.options?.size);
      this._updatePropertiesSource();
      this.listenTo(this, "render:forms", this.onRenderValidation).listenTo(this, "d2:metadata:formValidation", this.refreshButtons).listenTo(this, "d2:expand:field", this.onExpandFieldClick);
      this.options.wizard && this.options.wizard.blockActions();
      this.options.tabContentAccSelectors = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex]:not(.list-options-item), *[data-cstabindex], *[contenteditable]";
    },
    contentView: function() {
      return MassUpdateFormView;
    },
    render: function() {
      if (this.allForms.fetched && this.allForms.signOffFormModel && this.allForms.signOffFormModel.get("options").externalEsignOff) {
        this.options.setEsignRequired = this.allForms.cachedData["page-content"].dialog.signoff_intention_required;
        this.options.eSignMessage = lang.externalEsignMessage;
      }
      return D2MetadataPropertiesView.prototype.render.apply(this, arguments);
    },
    onExpandFieldClick: function(options) {
      if (!this.expandFieldRegion) {
        this.expandFieldRegion = new Marionette.Region({
          el: $('<div class="expand-field-region"></div>').insertAfter(this.el)
        });
      } else {
        this.expandFieldRegion.$el.removeClass("binf-hidden");
      }
      var isDisabled = options.control.schema.disabled || options.control.schema.readonly;
      if ((options.control.type === "d2combo" || options.control.type === "d2list") && !isDisabled && !options.control.isValid()) {
        this.showUpdateFieldErrorCorrectionForm(options);
      } else {
        this.showUpdateFieldTableView(options);
      }
    },
    showUpdateFieldErrorCorrectionForm: function(options) {
      if (!this.massUpdateCorrectionView) {
        this.massUpdateCorrectionView = new MassUpdateCorrectionView({
          control: options.control,
          context: this.options.context,
          pageContent: this.allForms.cachedData && this.allForms.cachedData["page-content"],
          originatingView: this,
          wizard: this.options.wizard,
          formModel: options.formModel
        });
      }
      this.expandFieldRegion.show(this.massUpdateCorrectionView);
      this.$el.addClass("binf-hidden");
      this.options.originatingView && this.options.originatingView.ui.infoArea && this.options.originatingView.ui.infoArea.addClass("binf-hidden");
      this.options.wizard.refreshFooter();
      this.options.wizard.refreshHeader();
    },
    showUpdateFieldTableView: function(options) {
      var type = options.control.type;
      if (type === "d2list") {
        var fieldView = options.control.fieldView;
        if (!fieldView.optionsView.currentView) {
          fieldView.optionsView.show(fieldView.getOptionView(fieldView.childViewOptions));
          fieldView.bindUIElements();
        }
        fieldView.optionsView.currentView.pullData();
      } else if (type === "d2combo") {
        options.control.fieldView.fetchDataFromSource({
          filter: undefined
        }).always(function() {
          options.control.fieldView.hideOptions();
        });
      }
      this.massUpdateFieldView = new MassUpdateFieldView({
        control: options.control,
        context: this.options.context,
        pageContent: this.allForms.cachedData && this.allForms.cachedData["page-content"],
        orderBy: this.orderBy,
        originatingView: this,
        wizard: this.options.wizard,
        formModel: options.formModel
      });
      this.expandFieldRegion.show(this.massUpdateFieldView, options);
      this.$el.addClass("binf-hidden");
      this.options.originatingView && this.options.originatingView.ui.infoArea && this.options.originatingView.ui.infoArea.addClass("binf-hidden");
      this.options.wizard.refreshFooter();
      this.options.wizard.refreshHeader();
    },
    onWizardBackClick: function(options) {
      options = options || {};
      if (this.massUpdateFieldView && this.expandFieldRegion.currentView === this.massUpdateFieldView) {
        if (this.massUpdateCorrectionView && !options.afterUpdate) {
          this.massUpdateFieldView && this.massUpdateFieldView.destroy();
          delete this.massUpdateFieldView;
          this.showUpdateFieldErrorCorrectionForm();
        } else if (this.massUpdateFieldView.summaryView && !options.afterUpdate) {
          this.massUpdateFieldView.onClickBackSummaryPage();
        } else {
          this.expandFieldRegion.$el.addClass("binf-hidden");
          this.orderBy = this.massUpdateFieldView.tableView.collection.orderBy || this.orderBy;
          this.focusControl = this.massUpdateFieldView.control;
          this.massUpdateFieldView && this.massUpdateFieldView.destroy();
          this.massUpdateCorrectionView && this.massUpdateCorrectionView.destroy();
          delete this.massUpdateFieldView;
          delete this.massUpdateCorrectionView;
          this.$el.removeClass("binf-hidden");
          this.focusControl.fieldView.setFocus();
          delete this.focusControl;
          this.options.originatingView && this.options.originatingView.ui.infoArea && this.options.originatingView.ui.infoArea.removeClass("binf-hidden");
        }
      } else if (this.massUpdateCorrectionView && this.expandFieldRegion.currentView === this.massUpdateCorrectionView) {
        this.focusControl = this.massUpdateCorrectionView.options.control;
        this.massUpdateCorrectionView && this.massUpdateCorrectionView.destroy();
        delete this.massUpdateCorrectionView;
        this.focusControl.fieldView.setFocus();
        delete this.focusControl;
        this.$el.removeClass("binf-hidden");
        this.options.originatingView && this.options.originatingView.ui.infoArea && this.options.originatingView.ui.infoArea.removeClass("binf-hidden");
      }
      this.options.wizard.refreshFooter();
      this.options.wizard.refreshHeader();
    },
    _updatePropertiesSource: function() {
      var queryMap = {
        inline: true
      };
      if (!this.node) {
        return;
      }
      this.node.propertiesSource = {
        url: Url.appendQuery(this.options.propertyPage, Url.combineQueryString(queryMap)),
        body: this.options.propertyPageBody
      };
      this.node.isMassUpdate = true;
      this.node.massUpdateDocumentType = this.options.massUpdateOptions["update-types"];
      this.node.massUpdateNodes = this.options.massUpdateValidationData.validObjects;
    },
    _externalESign: function() {
      var deferred = $.Deferred();
      if (this.options.signOffFormModel && this.options.signOffFormModel.get("options").externalEsignOff) {
        var options = {
          externalEsignOff: this.options.signOffFormModel.get("options").externalEsignOff,
          node: this.node
        };
        var command = new ExternalESignCommand();
        if (command.enabled({}, options)) {
          command.execute({}, options).done(function(token) {
            if (!this.node._changedFormValuesMap.signoffInputs) {
              this.node._changedFormValuesMap.signoffInputs = {};
            }
            _.extend(this.node._changedFormValuesMap.signoffInputs, {
              signoff_login: "",
              signoff_password: token,
              nonce_token: this.options.signOffFormModel.get("options").externalEsignOff.nonce_token
            });
            deferred.resolve(true);
          }.bind(this)).fail(deferred.reject);
        }
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    refreshButtons: function(isValid) {
      this.isFormValid = isValid;
      this.options.wizard.refreshFooter([ "next" ]);
    },
    validateAllChildren: function(initialInvalid) {
      var isValid = true, validateNonRequiredFields = function(children) {
        return _.some(children, function(child) {
          if (child.children) {
            return validateNonRequiredFields(child.children);
          } else if (child.isValidationParticipant() && child.validation) {
            child.validation["notOptional"] && child.validation["notOptional"].status !== false && child.refreshValidationState();
          }
        });
      }, childrenViews = this.options.tabPanel.tabContent._getImmediateChildren();
      _.each(childrenViews, function(view) {
        view.content.form.hideInitValidationError = true;
        view.content.form.refreshValidationState(true);
        isValid = isValid && view.content.form.isValid(true);
        !initialInvalid && validateNonRequiredFields(view.content.form.children);
      });
      this.isFormValid = isValid;
      return isValid;
    },
    onRenderValidation: function() {
      this.options.wizard && this.options.wizard.unblockActions();
      this.refreshButtons(this.validateAllChildren(this.getInitialInvalid()));
    },
    onRenderForms: function() {
      D2MetadataPropertiesView.prototype.onRenderForms.apply(this, arguments);
      this.node.maxObjectThresholdReached && this.reLayoutPanels();
    },
    isValid: function() {
      return this.isFormValid;
    },
    onPropertiesPageFetchError: function(error) {
      var errorMsg;
      if (error && (error["code"] === "E_RESOURCE_NOT_FOUND" || error["code"] === "E_SYSOBJECT_NOT_FOUND")) {
        errorMsg = lang[this.options.langPrefix + "ObjectsNoLongerExistError"];
      } else if (error && error["message"]) {
        errorMsg = error["message"];
      } else {
        errorMsg = lang.propertiesPageFetchError;
      }
      this.options.wizard && this.options.wizard.close({
        error: errorMsg
      });
    }
  });
});