/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/log", "csui/models/form", "csui/controls/progressblocker/blocker", "d2/commands/external.esign", "d2/widgets/metadata/utils/form.converter", "d2/dialogs/add.version/file.uploader", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/widgets/metadata/metadata.properties.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/add.version/add.version.utils", "d2/utils/constants", "d2/utils/form.utils", "hbs!d2/dialogs/add.version/impl/add.version", "css!d2/dialogs/add.version/impl/add.version" ], function(_, $, Backbone, log, FormModel, BlockingView, ExternalESignCommand, MetadataConverter, FileUploader, D2GeneralFormModel, D2MetadataPropertiesView, WizardTabableRegionBehavior, AddVersionUtils, constants, FormUtils, formTemplate) {
  "use strict";
  var AddVersionPropertyPageView = D2MetadataPropertiesView.extend({
    formTemplate: formTemplate,
    constructor: function AddVersionPropertyPageView(options) {
      this.options = options || (options = {});
      var form = MetadataConverter.convertConfig(options.propertyPage, {
        actionMode: "edit",
        layoutMode: "singleCol"
      });
      this.isValid = true;
      var formarr = [];
      for (var i = 0; i < form.propertiesConfig.length; i++) {
        form.propertiesConfig[i].node = options.node;
        var model = new D2GeneralFormModel(form.propertiesConfig[i]);
        model.get("schema")["initial_invalid"] = true;
        formarr.push(model);
      }
      this.behaviors = _.extend({
        WizardTabableRegion: {
          behaviorClass: WizardTabableRegionBehavior
        }
      }, this.behaviors);
      var fcollection = new Backbone.Collection(formarr);
      if (form.signOffConfig) {
        fcollection.signOffFormModel = new D2GeneralFormModel(form.signOffConfig);
      }
      fcollection.fetched = true;
      fcollection.cachedData = {
        "page-content": options.propertyPage
      };
      this.form = form;
      options.showSignatureFormPanel = true;
      options.collection = fcollection;
      options.formMode = "create";
      options.action = "addversion";
      D2MetadataPropertiesView.prototype.constructor.call(this, options);
      this.stopListening(this.options.node, "sync");
      if (this.options.wizard) {
        BlockingView.delegate(this, this.options.wizard);
      } else {
        BlockingView.imbue(this);
      }
    },
    onShow: function() {
      var me = this;
      this.listenTo(this, "d2:metadata:formValidation", function(isValid) {
        me.isValid = isValid;
        me.options.wizard.refreshFooter([ "next" ]);
      });
      this.listenTo(this, "render:forms", function() {
        if (me.eSignatureView && me.eSignatureView.signFormView && !me.eSignatureView.signFormView.isRenderFinished()) {
          me.listenTo(me.eSignatureView.signFormView, "render:form", function() {
            me.validateAllForms(false, true).done(function(isValid) {
              me.isValid = isValid;
              me.options.wizard.refreshFooter([ "next" ]);
              me.triggerMethod("step:rendered");
            });
          });
        } else {
          me.validateAllForms(false, true).done(function(isValid) {
            me.isValid = isValid;
            me.options.wizard.refreshFooter([ "next" ]);
            me.triggerMethod("step:rendered");
          });
        }
      });
    },
    isValidForm: function() {
      return this.isValid;
    },
    _updatePropetiesMap: function(map, properties) {
      var me = this;
      _.each(map, function(value, key) {
        if (_.isArray(value)) {
          if (!_.isObject(value[0])) {
            properties[key] = value;
          } else {
            var keys = _.keys(value[0]);
            FormUtils.removeEmptyRowsFromGridField(value);
            _.each(keys, function(k) {
              properties[k] = _.pluck(value, k);
            });
          }
        } else if (!_.isObject(value)) {
          properties[key] = value;
        } else {
          me._updatePropetiesMap(value, properties);
        }
      });
    },
    next: function() {
      var dfd = $.Deferred();
      this.validateAllForms(true).done(function(isValid) {
        this.isValid = isValid;
        this.options.wizard.refreshFooter([ "next" ]);
        if (this.isValid) {
          this._externalEsign().done(function() {
            var map = this.getFormsValues();
            var properties = {};
            this._updatePropetiesMap(map, properties);
            this.options.data = this.options.wizard.data;
            if (!this.options.data.general && this.options.fileInfo && this.options.fileInfo.file) {
              var formatlist = AddVersionUtils.getFormats(this.options.fileInfo.file.name);
              var defaultFormat = AddVersionUtils.getDefaultFormat(formatlist);
              this.options.data = {
                general: {}
              };
              if (defaultFormat) {
                this.options.data.general["a_content_type"] = defaultFormat.value;
              }
              if (this.options.externalShare && this.options.externalShare.core) {
                if (this.options.externalShare.shareMode === constants.ShareIntentType.COLLABORATE && !this.options.shareInfo.stopShare) {
                  this.options.data.general["retain_lock"] = true;
                } else if (this.options.externalShare.shareMode === constants.ShareIntentType.PUBLISH) {
                  this.options.data.general["add_version_to_core"] = true;
                }
              }
            }
            this.options.data.properties = properties;
            this.options.data["signoff-inputs"] = this.options.node._changedFormValuesMap.signoffInputs;
            this.options.wizard.data.properties = properties;
            this.options.wizard.data["signoff-inputs"] = this.options.node._changedFormValuesMap.signoffInputs;
            this.options.file = this.options.fileInfo.file;
            this.options.view = this;
            if (!this.options.isMultipleCheckin) {
              if (this.options.showProcessingStep === true) {
                this.options.wizard.nextStep();
              } else {
                this.options.wizard.close(this.options);
              }
            }
            dfd.resolve();
          }.bind(this)).fail(function() {
            dfd.reject();
          }.bind(this));
        } else {
          dfd.reject();
        }
      }.bind(this));
      return dfd.promise();
    },
    _externalEsign: function() {
      var deferred = $.Deferred();
      if (this._isExternalEsign()) {
        var options = {
          auditParams: {
            action: "CHECKIN",
            "master-document-id": this.options.node.get("id")
          },
          auditUrl: this.options.externalAuditURL,
          externalEsignOff: this.options.externalEsign,
          node: this.options.node
        };
        var self = this;
        var command = new ExternalESignCommand();
        if (command.enabled(status, options)) {
          command.execute(status, options).done(function(token) {
            if (!self.options.node._changedFormValuesMap.signoffInputs) {
              self.options.node._changedFormValuesMap.signoffInputs = {};
            }
            _.extend(self.options.node._changedFormValuesMap.signoffInputs, {
              signoff_login: "",
              signoff_password: token,
              nonce_token: self.options.externalEsign.nonce_token
            });
            deferred.resolve(true);
          }).fail(function() {
            deferred.reject(false);
          });
        }
      } else {
        deferred.resolve(true);
      }
      return deferred.promise();
    },
    _isExternalEsign: function() {
      return !_.isUndefined(this.options.externalEsign);
    }
  });
  return AddVersionPropertyPageView;
});