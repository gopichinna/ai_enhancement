/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "d2/controls/globalmessage/globalmessage", "csui/dialogs/modal.alert/modal.alert", "csui/utils/command.error", "csui/utils/commandhelper", "dctmw/server.adaptors/converters/node", "d2/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/utils/utils", "hbs!d2/controls/tab.panel/impl/metadata.edit.view", "i18n!d2/controls/tab.panel/impl/nls/lang", "css!d2/controls/tab.panel/impl/metadata.edit.view" ], function(require, _, $, Marionette, GlobalMessage, Alert, CommandError, CommandHelper, nodeConverter, constants, RestLinkrels, RestResources, utils, template, lang) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "d2-metadata-edit-properties",
    ui: {
      editButton: ".d2-metadata-edit-properties-edit-button",
      saveButton: ".d2-metadata-edit-properties-save-button",
      cancelButton: ".d2-metadata-edit-properties-cancel-button",
      nextButton: ".d2-metadata-edit-properties-next-button"
    },
    events: {
      "click @ui.editButton": "_editButtonClicked",
      "click @ui.saveButton": "_saveButtonClicked",
      "click @ui.cancelButton": "_cancelButtonClicked",
      "click @ui.nextButton": "_nextButtonClicked"
    },
    template: template,
    constructor: function EditMode() {
      Marionette.ItemView.apply(this, arguments);
      this.listenTo(this.options.tabPanel, "d2:metadata:formValidation", this.updateSaveButton);
      this.node = this.options.node;
    },
    onRender: function() {
      var autoEditInSmartView = this.options.tabPanel.tabContent._getImmediateChildren()[0].content.autoEditInSmartView;
      this.initialMode = autoEditInSmartView ? "create" : "update";
      if (this.options.action === "edit" && this.hasEditPermission()) {
        if (this.options.formMode === "create") {
          this.showButtonsInSaveMode();
          this.options.metadataView && this.options.metadataView.trigger("d2:metadata:edit", true);
          this.options.parentView.triggerMethod("apply:mask", true);
        } else {
          this.showButtonsInEditMode();
          this.options.metadataView && this.options.metadataView.trigger("d2:metadata:edit", false);
          this.options.parentView.triggerMethod("apply:mask", false);
        }
      } else {
        this.hideEditMode();
      }
    },
    hideEditMode: function() {
      this._hideButton(this.ui.saveButton);
      this._hideButton(this.ui.editButton);
      this._hideButton(this.ui.cancelButton);
      this._hideButton(this.ui.nextButton);
    },
    showButtonsInEditMode: function() {
      this._hideButton(this.ui.saveButton);
      this._hideButton(this.ui.cancelButton);
      this._hideButton(this.ui.nextButton);
      this._showButton(this.ui.editButton);
    },
    templateHelpers: function() {
      return {
        edit: lang.labelEdit,
        save: lang.labelSave,
        next: lang.labelNext,
        cancel: lang.labelCancel
      };
    },
    hasEditPermission: function() {
      return !_.isUndefined(RestLinkrels.getLink(this.node.get("links"), RestLinkrels.EDIT)) && RestResources.getCurrentUser().get("properties").client_capability > 1;
    },
    isElectronicSignatureRequired: function() {
      return !_.isUndefined(this.options.signOffFormModel);
    },
    isExternalESignatureRequired: function() {
      return this.options.signOffFormModel && !_.isUndefined(this.options.signOffFormModel.get("options").externalEsignOff);
    },
    validateAllForms: function(refreshState) {
      var deferred = $.Deferred();
      this.options.parentView.validateAllForms(refreshState).done(function(isValid) {
        this.isFormValid = isValid;
        deferred.resolve();
      }.bind(this));
      return deferred;
    },
    _showButton: function(button) {
      button.removeClass("binf-hidden");
      button.attr("data-cstabindex", 0);
    },
    _hideButton: function(button) {
      button.addClass("binf-hidden");
      button.attr("data-cstabindex", -1);
    },
    updateSaveButton: function(args) {
      this.isFormValid = !_.isUndefined(args) ? args : this.isFormValid;
      this.isFormValid ? this.ui.saveButton.removeClass("binf-disabled") : this.ui.saveButton.addClass("binf-disabled");
      this.isFormValid ? this.ui.saveButton.removeAttr("disabled") : this.ui.saveButton.attr("disabled", "disabled");
      this.isFormValid ? this.ui.nextButton.removeClass("binf-disabled") : this.ui.nextButton.addClass("binf-disabled");
      this.isFormValid ? this.ui.nextButton.removeAttr("disabled") : this.ui.nextButton.attr("disabled", "disabled");
    },
    showButtonsInSaveMode: function() {
      this._hideButton(this.ui.editButton);
      if (this.isElectronicSignatureRequired()) {
        this._showButton(this.ui.nextButton);
        this.ui.nextButton.addClass("binf-disabled");
        this.ui.nextButton.attr("disabled", "disabled");
        this._hideButton(this.ui.saveButton);
      } else {
        this._showButton(this.ui.saveButton);
        this.ui.saveButton.addClass("binf-disabled");
        this.ui.saveButton.attr("disabled", "disabled");
        this._hideButton(this.ui.nextButton);
      }
      this._showButton(this.ui.cancelButton);
      var initialInvalid = this.options.parentView.getInitialInvalid();
      if (!initialInvalid) {
        this.validateAllForms(!initialInvalid);
      }
    },
    switchFormMode: function(mode, reloadPropertyPageFromCache) {
      var childrenView = this.options.tabPanel.tabContent._getImmediateChildren();
      this.options.tabPanel.options.formMode = mode;
      _.each(childrenView, function(childView) {
        childView.content.mode = mode === "create" ? "writeonly" : "readonly";
        childView.content.setRequiredFieldsEditable = true;
      });
      this.options.tabPanel.options.ignoreAutoEditConfig = true;
      if (reloadPropertyPageFromCache) {
        this.options.tabPanel.resetToOriginalConfiguration();
      } else {
        this.options.tabPanel.render();
      }
    },
    _editButtonClicked: function() {
      this.options.tabPanel.storeCurrentTabPosition();
      this.options.tabPanel.setGridState();
      this.switchFormMode("create", true);
    },
    _cancelButtonClicked: function() {
      this.options.tabPanel.resetCurrentTabPosition();
      this.options.tabPanel.resetGridState();
      this._showButton(this.ui.editButton);
      this._hideButton(this.ui.saveButton);
      this._hideButton(this.ui.cancelButton);
      this.options.node._changedFormValuesMap = {
        properties: {},
        signoffInputs: {}
      };
      this.switchFormMode("update", true);
    },
    _saveButtonClicked: function() {
      var status = {
        node: this.options.node,
        collection: this.collection,
        parentView: this.options.parentView,
        connector: this.options.node.connector
      };
      var that = this;
      this.validateAllForms(true).done(function() {
        this.updateSaveButton();
        if (this.isValid()) {
          this._executeSave(status).done(function(refetch) {
            that._updateNodeModel(status);
            that.options.parentView.allForms.fetched = !refetch;
            that.options.tabPanel.resetCurrentTabPosition();
            that.switchFormMode("update", false);
          });
        }
      }.bind(this));
    },
    _nextButtonClicked: function() {
      this.validateAllForms(true).done(function() {
        this.updateSaveButton();
        if (this.isValid()) {
          this._hideButton(this.ui.nextButton);
          this._showButton(this.ui.saveButton);
          this.options.parentView.eSignatureView.showSignaturePanel();
          this.options.parentView.tabLinks.triggerMethod("refresh:tabable:elements", this.options.parentView);
          var me = this;
          this.options.parentView.eSignatureView.on("eSign:form:ready", function() {
            me.validateAllForms(false, true).done(function() {
              me.updateSaveButton();
            });
          });
        }
      }.bind(this));
    },
    getData: function(status) {
      var properties = _.clone(status.node._changedFormValuesMap.properties);
      this.removeEmptyGridRows(status, properties);
      return JSON.stringify({
        properties: properties,
        "signoff-inputs": status.node._changedFormValuesMap.signoffInputs
      });
    },
    removeEmptyGridRows: function(status, properties) {
      status.parentView.tabContent.children.forEach(function(tabContentView) {
        var d2FormView = tabContentView.content;
        d2FormView.removeEmptyGridRows(properties);
      });
    },
    isValid: function() {
      return this.isFormValid;
    },
    _executeSave: function(status) {
      var me = this, deferred = $.Deferred();
      if (_.isEmpty(status.node._changedFormValuesMap.properties)) {
        deferred.resolve(false);
      } else {
        this._externalESign(status).done(function() {
          status.parentView.blockActions();
          $.ajax(status.connector.extendAjaxOptions({
            url: RestLinkrels.getLink(status.node.get("links"), RestLinkrels.EDIT),
            type: "POST",
            headers: {
              "Content-Type": constants.MediaTypes.DCTM_JSON
            },
            data: me.getData(status),
            success: function(response) {
              deferred.resolve(true);
              (me.options.context || status.parentView && status.parentView.context).trigger("d2:object:metadataupdated", nodeConverter.convertNode(response));
              status.parentView.unblockActions();
              status.node._changedFormValuesMap = {
                properties: {},
                signoffInputs: {}
              };
            },
            error: function(xhr, textStatus, errorThrown) {
              var errData = utils.parseAjaxError(xhr, textStatus, errorThrown);
              deferred.reject(new CommandError(errData));
              if (utils.isMobile()) {
                var error = new CommandError(xhr);
                if (error.statusCode === 0) {
                  CommandHelper.showOfflineMessage(error);
                } else {
                  Alert.showError(errData);
                }
              } else {
                Alert.showError(errData);
              }
              status.parentView.unblockActions();
            }
          }));
        }).fail(function() {
          deferred.reject(false);
        });
      }
      return deferred.promise();
    },
    _externalESign: function(status) {
      var deferred = $.Deferred();
      if (this.isExternalESignatureRequired()) {
        var options = {
          auditParams: {
            action: "EDIT_PROPERTIES",
            "master-document-id": status.node.get("id")
          },
          auditUrl: this.options.signOffFormModel.get("options").externalAuditURL,
          externalEsignOff: this.options.signOffFormModel.get("options").externalEsignOff,
          node: status.node
        };
        var self = this;
        require([ utils.isAppworks() ? "d2mob/commands/mobile/mobile.external.esign" : "d2/commands/external.esign" ], function(ExternalESignCommand) {
          var command = new ExternalESignCommand();
          if (command.enabled(status, options)) {
            command.execute(status, options).done(function(token) {
              if (!status.node._changedFormValuesMap.signoffInputs) {
                status.node._changedFormValuesMap.signoffInputs = {};
              }
              _.extend(status.node._changedFormValuesMap.signoffInputs, {
                signoff_login: "",
                signoff_password: token,
                nonce_token: self.options.signOffFormModel.get("options").externalEsignOff.nonce_token
              });
              deferred.resolve(true);
            }).fail(function() {
              deferred.reject(false);
            });
          }
        }, deferred.reject);
      } else {
        var data = {
          esign: false
        };
        deferred.resolve(data);
      }
      return deferred.promise();
    },
    _updateNodeModel: function(status) {
      var attribute;
      _.each(status.node._changedFormValuesMap.properties, function(value, key) {
        attribute = key;
        if (nodeConverter.getServerClientAttrNameMap()[key]) {
          attribute = nodeConverter.getServerClientAttrNameMap()[key];
        }
        if (status.node.get(status.node.d2DocumentType + "." + attribute) !== undefined) {
          attribute = status.node.d2DocumentType + "." + attribute;
        }
        if (status.node.get(attribute) !== undefined) {
          status.node.set(attribute, value);
        }
      });
    }
  });
});