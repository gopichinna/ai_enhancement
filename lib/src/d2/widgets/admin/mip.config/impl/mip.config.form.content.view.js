/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import Url from "nuc/utils/url";

import {
  Collection
} from "nuc/lib/backbone";

import {
  LayoutView
} from "nuc/lib/marionette";

import NodeModel from "nuc/models/node/node.model";

import FormView from "d2/widgets/metadata/metadata.properties.view";

import MetadataConverter from "d2/widgets/metadata/utils/form.converter";

import FormModel from "d2/sdk/controls/form/form.model";

import RestLinkrels from "d2/utils/rest.linkrels";

import constants from "d2/utils/constants";

import GlobalMessage from "d2/controls/globalmessage/globalmessage";

import Session from "dctmw/utils/authenticators/session";

import Utils from "dctmw/utils/utils";

import RestResources from "dctmw/utils/rest.resources";

import BlockingView from "smart/controls/progressblocker/blocker";

import LayoutViewEventsPropagationMixin from "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin";

import ConnectionFactory from "csui/utils/contexts/factories/connector";

import template from "hbs!d2/widgets/admin/mip.config/impl/form.content";

import lang from "i18n!d2/widgets/admin/mip.config/impl/nls/lang";

import i18n from "i18n";

import "css!d2/widgets/admin/mip.config/impl/form.content";

import "smart/lib/binf/js/binf";

class FormCollection extends Collection {
  model = FormModel;
  constructor(models, options) {
    super(models, options);
    this.fetched = true;
  }
}

const BUTTON_TEST_CONNECTION_ID = "test_connection_id", DATA = "data", SEARCH = "SEARCH", THUMBNAIL = "THUMBNAIL", BUTTON_TOGGLE_ID = "glob_enable", FIELD_CLIENT_ID = "client_id", FIELD_TENANT_ID = "tenant_id", FIELD_CLIENT_SECRET_ID = "client_secret", FIELD_IS_MIP_ENABLE = "is_mip_enabled", PROPERTY_APPLICATION_SETTING = "applications_settings", PROPERTY_CLIENT_CREDENTIAL = "client_credentials", PROPERTY_ALLOWED_FEATURE = "allowed_features", PROPERTY_SEARCH_ALLOWED_LABELS = "search_allowed_labels";

class MIPFormView extends FormView {
  contentViewOptions(model) {
    const cvOptions = super.contentViewOptions(model);
    let mode = this.options.formMode || "create";
    return {
      ...cvOptions,
      ...{
        mode: mode,
        layoutMode: this.options.layoutMode
      }
    };
  }
  _allFormsRenderedPromise() {
    const promise = super._allFormsRenderedPromise();
    promise.done(function() {
      this.trigger("mip:form:rendered");
    }.bind(this));
    return promise;
  }
}

class MipConfigFormContentView extends LayoutView {
  template = template;
  className() {
    return "mip-config-form-content";
  }
  templateHelpers() {
    return {
      header: lang.labelTabHeader
    };
  }
  constructor(options = {}) {
    super(options);
    this.propagateEventsToRegions();
    if (this.options.blockingParentView) {
      BlockingView.delegate(this, this.options.blockingParentView);
    } else {
      BlockingView.imbue(this);
    }
    this.isValidForm = false;
    this.globEnable = false;
    this.isconfigDirty = false;
    this.isConnectionChecked = false;
    this.isTenantIdChanged = false;
  }
  regions() {
    return {
      rgnFormContent: ".rgn-mip-config-form-content"
    };
  }
  onRender() {
    var self = this;
    this.blockActions();
    this._callLabelApi().done(function(response) {
      self.allLabel = response;
      self.#renderContent();
    });
    this.unblockActions();
  }
  #renderContent() {
    this.formView = new MIPFormView({
      node: new NodeModel(),
      context: this.context,
      topAlignedLabel: true,
      mode: "create",
      formMode: "create",
      layoutMode: "singleCol",
      collection: this.#createFormCollection()
    });
    this.listenToOnce(this.formView, "mip:form:rendered", function() {
      var self = this;
      this.isValidForm = false;
      this.popoverList = [];
      var propertyMipFieldView = this.#findFieldViewObject(0, FIELD_CLIENT_SECRET_ID)?.fieldView;
      this.propertyMipTextPwdFieldView = $(propertyMipFieldView.el).find(".cs-field-write-inner");
      this.tstbtnel = $(this.#findFieldViewObject(0, FIELD_CLIENT_SECRET_ID)?.domEl);
      let globEnable = this.#findFieldViewObject(0, BUTTON_TOGGLE_ID)?.fieldView?.curVal;
      this.#loadPropertiesInfoIcon({
        identifier: FIELD_CLIENT_SECRET_ID,
        content: lang.tooltipInfoMessage,
        wrapperClass: this.propertyMipTextPwdFieldView
      });
      this.#addTestConnectionButton({
        identifier: BUTTON_TEST_CONNECTION_ID,
        btnType: "secondary",
        disabled: !globEnable,
        wrapperClass: this.tstbtnel
      });
      let domEl = this.#findFieldViewObject(0, BUTTON_TOGGLE_ID)?.domEl;
      this.#addSeparator({
        wrapperClass: domEl
      });
      this.listenTo(this.#findFieldViewObject(0, BUTTON_TOGGLE_ID)?.fieldView?.model, "change", function() {
        this.globEnable = this.#findFieldViewObject(0, BUTTON_TOGGLE_ID)?.fieldView.curVal;
        this._handleTestConnectionState({
          identifier: BUTTON_TEST_CONNECTION_ID,
          disabled: !this.globEnable
        });
      });
      this.listenTo(this.formView, "d2:metadata:formValidation", this.#updateModel);
      this.listenTo(this.options.config, "mip:model:reset", function() {
        this.isconfigDirty = false;
        this.isConnectionChecked = false;
        this.isTenantIdChanged = false;
        this.#setTenantIdAndConnectionTestFlag({
          isTenantIdChanged: this.isTenantIdChanged,
          isConnectionChecked: this.isConnectionChecked
        });
        let includedLabels = self.options.config?.get(PROPERTY_APPLICATION_SETTING) ? self.options.config?.get(PROPERTY_APPLICATION_SETTING)[PROPERTY_SEARCH_ALLOWED_LABELS] : [];
        this._updateAllLabels(this.allLabel, includedLabels);
        let collection = this.#createFormCollection();
        this.formView.collection.reset(collection.models, {});
        this.listenToOnce(this.formView, "mip:form:rendered", function() {
          let propertyMipFieldView = this.#findFieldViewObject(0, FIELD_CLIENT_SECRET_ID)?.fieldView;
          this.propertyMipTextPwdFieldView = $(propertyMipFieldView.el).find(".cs-field-write-inner");
          this.tstbtnel = $(this.#findFieldViewObject(0, FIELD_CLIENT_SECRET_ID)?.domEl);
          let domEl = this.#findFieldViewObject(0, BUTTON_TOGGLE_ID)?.domEl;
          this.#addSeparator({
            wrapperClass: domEl
          });
          this.#loadPropertiesInfoIcon({
            identifier: FIELD_CLIENT_SECRET_ID,
            content: lang.tooltipInfoMessage,
            wrapperClass: this.propertyMipTextPwdFieldView
          });
          this.#addTestConnectionButton({
            identifier: BUTTON_TEST_CONNECTION_ID,
            btnType: "secondary",
            disabled: true,
            wrapperClass: this.tstbtnel
          });
        });
      });
      this.listenTo(this.formView, "d2:metadata:formFieldChange", function(event) {
        if (event.name.includes(FIELD_CLIENT_ID) || event.name.includes(FIELD_TENANT_ID) || event.name.includes(FIELD_CLIENT_SECRET_ID)) {
          this.isconfigDirty = true;
          if (this.isConnectionChecked) {
            this.#setDirtyFlag({
              isDirty: true
            });
          } else {
            if (this.#isInValidConfig({
              byLength: false,
              event: event
            })) {
              this.isconfigDirty = false;
              this.isTenantIdChanged = false;
              this.#setDirtyFlag({
                isDirty: false
              });
            } else {
              if (event.name.includes(FIELD_TENANT_ID)) {
                this.isTenantIdChanged = true;
              }
              this.#setDirtyFlag({
                isDirty: false
              });
              this.#setButtonState({
                buttonState: false,
                buttonAttribute: {
                  attrLabel: lang.labelButtonReset,
                  isPartialDirty: true
                }
              });
            }
          }
        } else {
          if (!this.isconfigDirty) {
            if (this.#isInValidConfig({
              isMipTenantAndClientId: true
            })) {
              this.#setButtonState({
                buttonState: false,
                buttonAttribute: {
                  attrLabel: lang.labelButtonReset,
                  isPartialDirty: true
                }
              });
            } else {
              this.#setDirtyFlag({
                isDirty: true
              });
            }
          } else {
            this.#setButtonState({
              buttonState: false,
              buttonAttribute: {
                attrLabel: lang.labelButtonReset,
                isPartialDirty: true
              }
            });
          }
        }
      });
      this.listenToOnce(this.options.config, "sync", function() {
        this.isconfigDirty = false;
        if (this.isConnectionChecked) {
          this.isConnectionChecked = false;
          this.isTenantIdChanged = false;
          this.#setTenantIdAndConnectionTestFlag({
            isTenantIdChanged: this.isTenantIdChanged,
            isConnectionChecked: this.isConnectionChecked
          });
        }
        if (this.options?.config?.get(FIELD_IS_MIP_ENABLE)) {
          this._callLabelApi().done(function(response) {
            self.allLabel = response;
            self.#renderContent();
          });
        } else {
          this.#renderContent();
        }
      });
    }.bind(this));
    this.rgnFormContent.show(this.formView);
  }
  #createFormCollection() {
    let rowForm = this.#formJson(this.options).propertiesConfig;
    const collection = new FormCollection(rowForm, {});
    return collection;
  }
  #updateModel(value) {
    this.isValidForm = value;
    let formFieldSets = this.formView.getFormsValues();
    let tabCount = 0;
    let self = this;
    _.map(formFieldSets, function(data) {
      let formData = {};
      formData = data;
      if (tabCount === 0) {
        self.options.config.set(FIELD_IS_MIP_ENABLE, formData[BUTTON_TOGGLE_ID]);
        self.globEnable = formData[BUTTON_TOGGLE_ID];
        delete formData[BUTTON_TOGGLE_ID];
        self.options.config.set(PROPERTY_CLIENT_CREDENTIAL, formData);
      } else {
        self.options.config.set(PROPERTY_APPLICATION_SETTING, {
          allowed_features: formData["e_search_and_thumbnail"],
          search_allowed_labels: self.options?.config?.getServerAttribute(FIELD_IS_MIP_ENABLE) && self.options?.config?.get(FIELD_IS_MIP_ENABLE) ? formData["e_labels"] : self.options.config.get("applications_settings")["search_allowed_labels"],
          thumbnail_allowed_labels: self.options?.config?.getServerAttribute(FIELD_IS_MIP_ENABLE) && self.options?.config?.get(FIELD_IS_MIP_ENABLE) ? formData["e_labels"] : self.options.config.get("applications_settings")["thumbnail_allowed_labels"]
        });
      }
      tabCount++;
    });
    if (this.globEnable) {
      this._handleTestConnectionState({
        identifier: BUTTON_TEST_CONNECTION_ID,
        disabled: this.#isInValidConfig({
          byLength: true
        })
      });
      if (this.#isInValidConfig({
        isMipTenantAndClientId: true
      })) this.#setButtonState({
        buttonState: false,
        buttonAttribute: {
          attrLabel: lang.labelButtonReset,
          isPartialDirty: true
        }
      });
    } else {
      this._handleTestConnectionState({
        identifier: BUTTON_TEST_CONNECTION_ID,
        disabled: !this.globEnable
      });
    }
  }
  #setTenantIdAndConnectionTestFlag(options) {
    this.trigger("mip:state:tenant:dirty", options);
  }
  #setDirtyFlag(options) {
    this.trigger("mip:form:dirty", options);
  }
  #setButtonState(options) {
    this.trigger("mip:form:state", options);
  }
  #isInValidConfig(options) {
    let mipEnableIdVal = this.#findFieldViewObject(0, BUTTON_TOGGLE_ID)?.fieldView?.model?.get(DATA);
    let tenantIdVal = this.#findFieldViewObject(0, FIELD_TENANT_ID)?.fieldView?.model?.get(DATA);
    let clientIdVal = this.#findFieldViewObject(0, FIELD_CLIENT_ID)?.fieldView?.model?.get(DATA);
    let clientSecretVal = this.#findFieldViewObject(0, FIELD_CLIENT_SECRET_ID)?.fieldView?.model?.get(DATA);
    if (options.byLength) {
      return tenantIdVal <= 0 || clientIdVal <= 0 || clientSecretVal <= 0;
    } else if (options.isMipTenantAndClientId) {
      if (_.isUndefined(tenantIdVal) || tenantIdVal <= 0 || (_.isUndefined(clientIdVal) || clientIdVal <= 0)) {
        if (mipEnableIdVal) {
          return true;
        } else {
          return false;
        }
      }
    } else {
      let compareObj = {
        tenant_id: tenantIdVal,
        client_id: clientIdVal,
        client_secret: clientSecretVal
      };
      return _.isEqual(this.options.config.getServerAttribute("client_credentials"), compareObj);
    }
  }
  #addSeparator(options) {
    options.wrapperClass.parent().css({
      "border-bottom": "1px solid #cccccc"
    });
  }
  #findFieldViewObject(tabNo, fieldId) {
    let fieldObj = {};
    _.map(this.formView?.tabContent?.children?.filter()[tabNo]?.content?.form?.childrenByPropertyId, function(num) {
      fieldObj = num?.childrenByPropertyId[fieldId];
    });
    return fieldObj;
  }
  #addTestConnectionButton(options) {
    const btnTestConnection = '<div  class="mip-component-button"><otc-button id="' + options.identifier + '" className="mip-button-test-connection"  type="' + options.btnType + '">' + lang.buttonLabel + "</otc-button></div>";
    options.wrapperClass.append(btnTestConnection);
    $("#" + options.identifier).off("click").on("click", this.#handleTestConnectionClick.bind(this));
    this._handleTestConnectionState(options);
  }
  _handleTestConnectionState(options) {
    if (options.disabled || !this.isValidForm) {
      $("#" + options.identifier).attr("disabled", "");
    } else {
      $("#" + options.identifier).removeAttr("disabled");
    }
  }
  #handleTestConnectionClick() {
    if (this.isValidForm) {
      let formFieldSet = this.formView.getFormsValues();
      let formTestConnection = {};
      let counter = 0;
      _.map(formFieldSet, function(value) {
        if (counter === 0) {
          formTestConnection = value;
          delete formTestConnection[BUTTON_TOGGLE_ID];
          counter++;
        }
      });
      this.#callForTestConnection(formTestConnection);
    }
  }
  #callForTestConnection(formData) {
    let self = this;
    const connector = this.#getConnector();
    $.ajax(connector.extendAjaxOptions({
      url: this._getUrlEndPoint(RestLinkrels.MIP_ADMIN_CONNECTION_TEST, "/mip-configuration/connection-validator"),
      type: "POST",
      data: JSON.stringify(formData),
      headers: {
        "Content-Type": constants.MediaTypes.DCTM_JSON
      },
      success: function() {
        GlobalMessage.showMessage("success", lang.connectionSuccessMessage);
        self.#setDirtyFlag({
          isDirty: true
        });
        self.isConnectionChecked = true;
        self.#setTenantIdAndConnectionTestFlag({
          isTenantIdChanged: self.isTenantIdChanged,
          isConnectionChecked: self.isConnectionChecked
        });
      },
      error: function(xhr) {
        let errDetails = Utils.parseAjaxError(xhr);
        GlobalMessage.showMessage("error", errDetails.message, errDetails.details);
        self.#setDirtyFlag({
          isDirty: false
        });
        self.#setButtonState({
          buttonState: false,
          buttonAttribute: {
            attrLabel: lang.labelButtonReset,
            isPartialDirty: true
          }
        });
      }
    }));
  }
  _getUrlEndPoint(rel, partialHref) {
    let url = RestLinkrels.getLink(this.options?.config.get("links"), rel);
    if (_.isUndefined(url)) {
      var currRepoLinks = RestResources.getCurrentRepository().get("links");
      url = Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), partialHref);
    }
    let qParams = {};
    return Url.appendQuery(url, Url.combineQueryString(qParams));
  }
  #getConnector() {
    let context = Session.get().getContext(), connector = context.getObject(ConnectionFactory);
    return connector;
  }
  #loadPropertiesInfoIcon(options) {
    options.wrapperClass.append('<div tabindex="0" id="' + options.identifier + '_icon_popover" class="question-info-tip info-icon icon-notification-question"></div>');
    var popOptions = {
      content: options.content,
      identifier: options.identifier,
      htmlHandle: $("#" + options.identifier + "_icon_popover"),
      onPopOverEvents: options.onPopOverEvents
    };
    this.#loadPopOverIcon(popOptions);
  }
  #loadPopOverIcon(options) {
    var popoverOptions = {
      content: options.content,
      html: true,
      container: $.fn.binf_modal.getDefaultContainer(),
      template: '<div class="binf-popover d2-advanced-task-popover" role="tooltip"><div class="binf-arrow"></div><div class="binf-popover-content"></div></div>',
      placement: !i18n.settings.rtl ? "right" : "left"
    };
    options.htmlHandle.binf_popover(popoverOptions);
    this.popoverList.push(options.htmlHandle);
    if (options.onPopOverEvents) {
      options.htmlHandle.on("shown.binf.popover", options.onPopOverEvents);
    }
    $("#" + options.identifier + "_icon_popover").off("keydown").on("keydown", function() {
      options.htmlHandle.binf_popover("toggle");
    }).on("focusout mouseout", function() {
      options.htmlHandle.binf_popover("hide");
    });
  }
  onBeforeDestroy() {
    _.each(this.popoverList, function(htmlHandle) {
      htmlHandle.binf_popover("destroy");
    });
    this.formView && this.formView.destroy();
  }
  #findValueByPropertyId(object, propertyId) {
    return _.get(object, propertyId);
  }
  _updateAllLabels(labelResp, includedLabels) {
    _.each(labelResp, function(option) {
      if (_.contains(includedLabels, option.v)) {
        option.s = true;
      } else {
        option.s = false;
      }
    });
  }
  _callLabelApi() {
    let dfd = $.Deferred();
    let labelResp = [];
    let self = this;
    const connector = this.#getConnector();
    $.ajax(connector.extendAjaxOptions({
      url: this._getUrlEndPoint(RestLinkrels.MIP_ADMIN_CONNECTION_SENSITIVITY_LABELS, "/mip-configuration/sensitivity-labels"),
      type: "GET",
      headers: {
        "Content-Type": constants.MediaTypes.DCTM_JSON
      },
      success: function(response) {
        _.each(response.entries, function(entry) {
          labelResp.push({
            s: false,
            p: entry.content.properties["label_priority"],
            l: entry.content.properties["label_name"],
            v: entry.content.properties["label_id"],
            d: entry.content.properties["label_description"],
            parent: entry.content.properties["parent_label_id"]
          });
        });
        let includedLabels = self.options.config?.get(PROPERTY_APPLICATION_SETTING) ? self.options.config?.get(PROPERTY_APPLICATION_SETTING)["search_allowed_labels"] : [];
        self._updateAllLabels(labelResp, includedLabels);
        dfd.resolve(labelResp);
      },
      error: function() {
        dfd.reject();
      }
    }));
    return dfd.promise();
  }
  _findServerStateValue(key, subkey) {
    return this.options.config?.getServerAttribute(key) ? this.options.config?.getServerAttribute(key)[subkey] : "";
  }
  #formJson(options) {
    const form = MetadataConverter.convertConfig({
      dialog: {
        content: {
          order: 1,
          fieldset: [ {
            name: "tab1",
            label: lang.labelTabHeader,
            order: 1,
            boolean: {
              id: BUTTON_TOGGLE_ID,
              control: true,
              label: lang.labelEnableMip,
              value: options.config.get("is_mip_enabled"),
              order: 1
            },
            text: [ {
              id: FIELD_TENANT_ID,
              control: true,
              advancedView_enabled: true,
              condition_enabled: "(getValue(glob_enable).equals('true'))",
              label: lang.labelTenantId,
              condition_required: true,
              value: this.#findValueByPropertyId(options.config?.get(PROPERTY_CLIENT_CREDENTIAL), FIELD_TENANT_ID),
              order: 2
            }, {
              id: FIELD_CLIENT_ID,
              control: true,
              advancedView_enabled: false,
              condition_enabled: "(getValue(glob_enable).equals('true'))",
              label: lang.labelClientId,
              value: this.#findValueByPropertyId(options.config?.get(PROPERTY_CLIENT_CREDENTIAL), FIELD_CLIENT_ID),
              condition_required: true,
              order: 3
            } ],
            password: {
              id: FIELD_CLIENT_SECRET_ID,
              control: true,
              advancedView_enabled: false,
              condition_enabled: "(getValue(glob_enable).equals('true'))&& ((getValue(tenant_id).notEquals('" + this._findServerStateValue("client_credentials", FIELD_TENANT_ID) + "'))|| (getValue(client_id).notEquals('" + this._findServerStateValue("client_credentials", FIELD_CLIENT_ID) + "')) || (getValue(client_secret).notEquals('" + this._findServerStateValue("client_credentials", FIELD_CLIENT_SECRET_ID) + "')) )",
              label: lang.labelClientSecret,
              value: this.#findValueByPropertyId(options.config?.get(PROPERTY_CLIENT_CREDENTIAL), FIELD_CLIENT_SECRET_ID),
              condition_required: "(getValue(glob_enable).equals('true'))&& ((getValue(tenant_id).notEquals('" + this._findServerStateValue("client_credentials", FIELD_TENANT_ID) + "'))|| (getValue(client_id).notEquals('" + this._findServerStateValue("client_credentials", FIELD_CLIENT_ID) + "')) )",
              reinit_enabled: false,
              condition_required_create: true,
              condition_required_edit: true,
              condition_required_import: true,
              order: 4
            }
          }, {
            name: "tab2",
            advancedView_enabled: false,
            condition_enabled: "((getValue(tenant_id).notEquals('')) && (getValue(glob_enable).equals('true'))) && ((getValue(glob_enable).equals('true')) && ((getValue(tenant_id).equals('" + this._findServerStateValue("client_credentials", FIELD_TENANT_ID) + "')) && (getValue(client_id).equals('" + this._findServerStateValue("client_credentials", FIELD_CLIENT_ID) + "'))))",
            label: lang.labelEnableHeader,
            order: 2,
            "list-checkbox": [ {
              id: "e_search_and_thumbnail",
              control: true,
              assistance_type: "custom",
              label: "",
              order: 2,
              o: [ {
                l: lang.labelEnableSearch,
                v: SEARCH,
                s: _.contains(this.options.config?.get(PROPERTY_APPLICATION_SETTING) ? this.options.config?.get(PROPERTY_APPLICATION_SETTING)[PROPERTY_ALLOWED_FEATURE] : [], SEARCH)
              }, {
                l: lang.labelEnableThumbnails,
                v: THUMBNAIL,
                s: _.contains(this.options.config?.get(PROPERTY_APPLICATION_SETTING) ? this.options.config?.get(PROPERTY_APPLICATION_SETTING)[PROPERTY_ALLOWED_FEATURE] : [], THUMBNAIL)
              } ]
            } ],
            list: {
              id: "e_labels",
              control: true,
              label: lang.labelIncludedLabels,
              order: 3,
              maxlength: 48,
              assistance_type: "custom",
              property_type: "string",
              repeating: true,
              rows: 4,
              sorted: true,
              o: this.allLabel,
              showOptionsInHierarchy: true,
              horizontal_display: true
            }
          } ]
        }
      }
    }, {
      actionMode: "create",
      layoutMode: "singleCol"
    });
    return form;
  }
}

Object.assign(MipConfigFormContentView.prototype, LayoutViewEventsPropagationMixin);

Object.defineProperty(MipConfigFormContentView.prototype.constructor, "name", {
  value: "MipConfigFormContentView"
});

export default MipConfigFormContentView;