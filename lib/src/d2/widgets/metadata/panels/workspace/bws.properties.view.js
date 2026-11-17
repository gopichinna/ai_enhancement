/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import Marionette from "nuc/lib/marionette";

import MetadataFormCollection from "csui/widgets/metadata/impl/metadata.forms";

import CommandHelper from "csui/utils/commandhelper";

import Alert from "csui/dialogs/modal.alert/modal.alert";

import CommandError from "csui/utils/command.error";

import nodeConverter from "dctmw/server.adaptors/converters/node";

import utils from "dctmw/utils/utils";

import D2ESignatureView from "d2/widgets/metadata/tab.contents.esignature/tab.contents.esignature.view";

import MetadataConverter from "d2/widgets/metadata/utils/form.converter";

import D2MetadataPropertiesView from "d2/widgets/metadata/metadata.properties.view";

import D2GeneralFormModel from "d2/widgets/metadata/general.panels/d2/d2.general.form.model";

import ButtonToolbarView from "d2/controls/button.toolbar/button.toolbar.view";

import RestLinkrels from "d2/utils/rest.linkrels";

import constants from "d2/utils/constants";

import lang from "i18n!d2/commands/nls/localized.strings";

import template from "hbs!d2/widgets/metadata/panels/workspace/bws.properties";

import "css!d2/widgets/metadata/panels/workspace/bws.properties";

const BWSPropertiesView = Marionette.LayoutView.extend({
  template: template,
  constructor: function BWSPropertiesView(options) {
    BWSPropertiesView.__super__.constructor.call(this, options);
    this.listenTo(this.headerView, "close:click", _.bind(function() {
      this.trigger("close:button:clicked");
      this.hide();
    }, this));
  },
  regions: {
    bwsPropertyEdit: ".d2-bws-property-edit",
    bwsPropertyPage: ".d2-bws-property-page-panel",
    bwsButtonToolbar: ".d2-bws-property-page-edit-footer-button"
  },
  ui: {
    expandEditIcon: ".d2-bws-property-edit",
    saveButton: ".d2-metadata-edit-properties-save-button",
    cancelButton: ".d2-metadata-edit-properties-cancel-button"
  },
  events: {
    "click @ui.expandEditIcon": "editPropertiesForm"
  },
  templateHelpers: function() {
    return {
      editTitle: lang.editTitle
    };
  },
  _enableButton: function(button) {
    button.removeClass("binf-hidden");
  },
  _disableButton: function(button) {
    button.addClass("binf-hidden");
  },
  editPropertiesForm() {
    const mode = "create", reloadPropertyPageFromCache = true;
    let childrenView = this.metadataProperties.options.tabPanel.tabContent._getImmediateChildren();
    this.metadataProperties.options.tabPanel.options.formMode = mode;
    _.each(childrenView, function(childView) {
      childView.content.mode = mode === "create" ? "writeonly" : "readonly";
      childView.content.setRequiredFieldsEditable = true;
    });
    this.metadataProperties.options.tabPanel.options.ignoreAutoEditConfig = true;
    if (reloadPropertyPageFromCache) {
      this.metadataProperties.options.tabPanel.resetToOriginalConfiguration();
    } else {
      this.metadataProperties.options.tabPanel.render();
    }
    this._setUpEditMode();
  },
  convertPropertyPageResp() {
    this.options.node && this.options.node.set("isSingleCol", true);
    const propertiesConfig = MetadataConverter.convertConfig(this.options.propertiesContent, {
      actionMode: "edit",
      layoutMode: "singleCol"
    });
    const formModelArray = [];
    _.each(propertiesConfig, function(formResponse) {
      const form = _.extend({
        data: {},
        schema: {},
        options: {}
      }, formResponse);
      const formModel = new D2GeneralFormModel(form);
      formModelArray.push(formModel);
    });
    const formCollection = new MetadataFormCollection(undefined, {
      node: this.options.node
    });
    formModelArray.forEach(model => formCollection.add(model));
    this.formCollection = formCollection;
    this.renderPropertyPageInPanel(formCollection);
  },
  renderPropertyPageInPanel(formCollection) {
    let node = this.options.node;
    if (!_.isUndefined(formCollection) && node.get("type") === constants.Types.BWS) {
      this.metadataProperties = new D2MetadataPropertiesView({
        node: node,
        context: this.options.context,
        collection: formCollection,
        suppressSpyScroll: true,
        tabPanel: this.options.tabPanel
      });
      this.metadataProperties.allForms.layoutMode = "singleCol";
      node.propertiesContent = {
        "page-content": this.options.propertiesContent
      };
    } else {
      this.metadataProperties = new D2MetadataPropertiesView({
        node: node,
        context: this.options.context
      });
      this.metadataProperties.allForms.layoutMode = "singleCol";
    }
    this.listenTo(this.metadataProperties, "d2:metadata:formValidation", isValid => {
      let saveButtonModel = this.toolbarView.getButtonById("save");
      saveButtonModel.set("disabled", !isValid);
    });
    this.$el.find(".d2-bws-property-page-edit-footer-button").hide();
    this.bwsPropertyPage.show(this.metadataProperties);
    this.addListenerForFieldChange();
    const canEdit = RestLinkrels?.getLink(node.get("links"), RestLinkrels.EDIT);
    if (canEdit) {
      this.bwsPropertyPage.show(this.metadataProperties);
      this.addListenerForFieldChange();
      this._enableButton(this.ui.expandEditIcon);
    } else {
      this.bwsPropertyPage.show(this.metadataProperties);
      this._disableButton(this.ui.expandEditIcon);
      this.$(this.ui.expandEditIcon).hide();
      this.$el.find(".d2-bws-property-page-edit-footer-button").hide();
    }
  },
  addListenerForFieldChange: function() {
    this.listenTo(this.metadataProperties, "d2:metadata:formFieldChange", () => {
      this.validateAllForms(true, false).done(function(isValid) {
        this.isFormValid = isValid;
        this.updateSaveButton();
      }.bind(this));
    });
  },
  canEditPermission: function(node, that) {
    const canEdit = RestLinkrels?.getLink(node.get("links"), RestLinkrels.EDIT);
    if (canEdit) {
      that._enableButton(that.ui.expandEditIcon);
    }
  },
  _cancelButtonClicked: function() {
    this.$el.find(".d2-bws-property-page-edit-footer-button").hide();
    this._enableButton(this.ui.expandEditIcon);
    this.switchFormMode("update", false);
  },
  _setUpEditMode: function() {
    this.$el.find(".d2-bws-property-page-edit-footer-button").show();
    let right = [ {
      id: "save",
      className: "d2-otc-btn d2-metadata-edit-properties-save-button primary-btn",
      label: lang.saveProperties,
      tooltip: lang.saveProperties,
      showLabel: true,
      clickHandler: this._saveButtonClicked.bind(this)
    }, {
      id: "cancel",
      className: "d2-otc-btn d2-metadata-edit-properties-cancel-button secondary-btn",
      label: lang.cancel || "Cancel",
      tooltip: lang.cancel || "Cancel",
      showLabel: true,
      clickHandler: this._cancelButtonClicked.bind(this)
    } ];
    this._disableButton(this.ui.expandEditIcon);
    this.toolbarView = new ButtonToolbarView({
      right: right
    });
    let saveButtonModel = this.toolbarView.getButtonById("save");
    saveButtonModel.set("disabled", true);
    this.bwsButtonToolbar.show(this.toolbarView);
  },
  _saveButtonClicked: function() {
    var status = {
      node: this.options.node,
      collection: this.collection,
      parentView: this.options.parentView,
      connector: this.options.node.connector
    };
    var that = this;
    this.validateAllForms(true, false).done(function(isValid) {
      this.isFormValid = isValid;
      this.updateSaveButton();
      this._executeSave(status).done(function(refetch) {
        that._updateNodeModel(status);
        that.metadataProperties.allForms.fetched = !refetch;
        if (status?.node?.propertiesContent) delete status.node.propertiesContent;
        that.switchFormMode("update", false);
        that.listenToOnce(that.metadataProperties.allForms, "sync", () => {
          that.canEditPermission(status.node, that);
        });
      }).fail(() => {
        that.switchFormMode("update", false);
        that.listenToOnce(that.metadataProperties.allForms, "sync", () => {
          that.canEditPermission(status.node, that);
        });
      });
    }.bind(this)).fail(() => {
      that.switchFormMode("update", false);
      that.listenToOnce(that.metadataProperties.allForms, "sync", () => {
        that.canEditPermission(status.node, that);
      });
    });
    this.$el.find(".d2-bws-property-page-edit-footer-button").hide();
  },
  getValidationErrorsList: function() {
    var childrenViews = this.metadataProperties.tabContent._getImmediateChildren();
    return _.reduce(childrenViews, function(validationErrorList, childView) {
      return _.union(validationErrorList, childView.content.validationErrorList);
    }, []);
  },
  validateAllForms: function(refreshState, validateOnlyRequiredFields) {
    var deferred = $.Deferred();
    var childrenViews = this.metadataProperties.tabContent._getImmediateChildren();
    if (this.eSignatureView && this.eSignatureView.signFormView) {
      childrenViews.push(this.eSignatureView);
    }
    var validityPromiseArray = _.map(childrenViews, function(view) {
      return view instanceof D2ESignatureView ? view.signFormView.validateForm(refreshState) : view.content.validateForm(refreshState, validateOnlyRequiredFields);
    });
    $.whenAll.apply($, validityPromiseArray).done(function(validityResultArray) {
      var errs = this.getValidationErrorsList();
      if (!validateOnlyRequiredFields && errs.length > 0) {
        this.metadataProperties.setErrorMode(true, errs);
      }
      deferred.resolve(!_.contains(validityResultArray, false));
    }.bind(this));
    return deferred;
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
      status.node.set(attribute, value);
    });
  },
  getData: function(status) {
    var properties = _.clone(status.node._changedFormValuesMap.properties);
    return JSON.stringify({
      properties: properties,
      "signoff-inputs": status.node._changedFormValuesMap.signoffInputs
    });
  },
  updateSaveButton: function(args) {
    this.isFormValid = !_.isUndefined(args) ? args : this.isFormValid;
    const saveButtonModel = this.toolbarView.getButtonById("save");
    if (saveButtonModel) {
      saveButtonModel.set("disabled", !this.isFormValid);
    }
    const $saveButton = this.$(".d2-metadata-edit-properties-save-button");
    if (this.isFormValid) {
      $saveButton.removeClass("binf-disabled").removeAttr("disabled");
    } else {
      $saveButton.addClass("binf-disabled").attr("disabled", "disabled");
    }
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
  isExternalESignatureRequired: function() {
    return this.options.signOffFormModel && !_.isUndefined(this.options.signOffFormModel.get("options").externalEsignOff);
  },
  _executeSave: function(status) {
    var me = this, deferred = $.Deferred();
    if (_.isEmpty(status.node._changedFormValuesMap.properties)) {
      deferred.resolve(false);
    } else {
      this._externalESign(status).done(function() {
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
          }
        }));
      }).fail(function() {
        deferred.reject(false);
      });
    }
    return deferred.promise();
  },
  switchFormMode: function(mode, reloadPropertyPageFromCache) {
    let childrenView = this.metadataProperties.options.tabPanel.tabContent._getImmediateChildren();
    this.metadataProperties.options.tabPanel.options.formMode = mode;
    _.each(childrenView, function(childView) {
      childView.content.mode = mode === "create" ? "writeonly" : "readonly";
      childView.content.setRequiredFieldsEditable = true;
    });
    this.metadataProperties.options.tabPanel.options.ignoreAutoEditConfig = true;
    if (reloadPropertyPageFromCache) {
      this.metadataProperties.options.tabPanel.resetToOriginalConfiguration();
    } else {
      this.metadataProperties.options.tabPanel.render();
    }
  },
  onRender() {
    this.convertPropertyPageResp();
  }
}, {
  enabled: function() {
    return true;
  }
});

export default BWSPropertiesView;