/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/lib/alpaca/js/alpaca.lite", "nuc/utils/log", "csui/models/form", "csui/controls/form/pub.sub", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/progressblocker/blocker", "nuc/lib/jsonpath", "d2/widgets/metadata/utils/form.converter", "d2/dialogs/add.version/file.uploader", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/controls/form/d2.form.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/utils/constants", "dctmw/utils/rest.resources", "d2/dialogs/add.version/add.version.utils", "d2/utils/node.version.utils", "d2/utils/creation.utils", "dctmw/utils/utils", "i18n!d2/dialogs/add.version/impl/nls/lang", "hbs!d2/dialogs/add.version/impl/add.version", "css!d2/dialogs/add.version/impl/add.version" ], function(_, $, Backbone, Alpaca, log, FormModel, PubSub, PerfectScrollingBehavior, BlockingView, jsonPath, MetadataConverter, FileUploader, D2GeneralFormModel, D2FormView, WizardTabableRegionBehavior, constants, RestResources, AddVersionUtils, NodeVersionUtils, CreationUtils, utils, lang, formTemplate) {
  "use strict";
  var AddVersionGeneralView = D2FormView.extend({
    formTemplate: formTemplate,
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    constructor: function AddVersionGeneralView(options) {
      options || (options = {});
      this.shareMode = options.externalShare && options.externalShare.core === true && options.externalShare.shareMode ? options.externalShare.shareMode : "";
      this.dialog = this._createDialogFromConfig(options);
      var form = MetadataConverter.convertConfig(this.dialog, {
        actionMode: "create",
        layoutMode: "singleCol"
      });
      this.isValid = true;
      this.node = options.node;
      var model = new FormModel(form.propertiesConfig[0]);
      model.get("schema")["initial_invalid"] = true;
      this.formmodel = form;
      options.topAlignedLabel = true;
      options.model = model;
      options.mode = "create";
      if (options.ctfEnabled) {
        options.clientMode = constants.BrowserPluginMode.WSCTF;
      }
      D2FormView.prototype.constructor.call(this, options);
      this.file = options.fileInfo && options.fileInfo.file;
      this.on("change:field", this._validate, this);
      this.on("invalid:field", this._invalidField, this);
      this.on("valid:field", this._validate, this);
      this.on("render", this._render, this);
      if (utils.isMobile()) {
        this.on("render:form", this._validate, this);
      }
      if (this.options.wizard) {
        BlockingView.delegate(this, this.options.wizard);
      } else {
        BlockingView.imbue(this);
      }
    },
    _render: function() {
      var me = this, addVersionOptionsMetadata = this._getAddVersionOptionsMetadata();
      for (var addVersionOption in addVersionOptionsMetadata) {
        if (Object.prototype.hasOwnProperty.call(addVersionOptionsMetadata, addVersionOption)) {
          this.$el.find('.alpaca-container-item[data-alpaca-container-item-name="' + addVersionOption + '"]').addClass("add-version-option");
          var control = this._getFieldControl(addVersionOption);
          if (control && control.id) {
            var selector = [ "show", control.id ].join(":");
            PubSub.off(selector);
            this.listenTo(PubSub, selector, function() {
              me.$el.find('.add-version-option input[type="checkbox"]').filter(":visible").attr("tabindex", 0);
            });
          }
        }
      }
      var uploadFieldControl = this._getFieldControl("upload");
      if (uploadFieldControl) {
        var messageTemplateDescriptor = uploadFieldControl.view.getTemplateDescriptor("message");
        if (messageTemplateDescriptor) {
          if (this.options.externalShare && this.options.externalShare.core === true && this.options.shareInfo.useCorePath) {
            var messageElement = Alpaca.tmpl(messageTemplateDescriptor, {
              id: "corePathMessage",
              message: lang.coreFilePathMessage,
              view: uploadFieldControl.view
            });
            messageElement.removeClass("alpaca-message").addClass("d2-core-path-message").attr("role", "alert");
            $(uploadFieldControl.getFieldEl()).append(messageElement);
          }
        }
      }
      this._validate();
    },
    _getFieldControl: function(fieldId) {
      var path = this._keyPathMap[fieldId] && this._keyPathMap[fieldId].fieldPath;
      if (path) {
        return this.getAlpacaControlByPath(path);
      }
    },
    _getShareAttribute: function(options) {
      var shareAttribute = "";
      if (options && options.shareInfo && this.shareMode) {
        shareAttribute = "core#" + this.shareMode;
        if (options.shareInfo.useCorePath) {
          shareAttribute = shareAttribute + "#external";
        }
      }
      return shareAttribute;
    },
    _invalidField: function() {
      this.isValid = false;
      if (this.options.wizard) {
        this.options.wizard.refreshFooter([ "next" ]);
      }
    },
    _validate: function() {
      this.validateForm(true, true).done(function(isValid) {
        this.isValid = isValid;
        if (this.options.wizard) {
          this.options.wizard.refreshFooter([ "next" ]);
        }
      }.bind(this));
    },
    isValidForm: function() {
      return this.isValid;
    },
    initialize: function() {
      var fileSelectorSelection = [ "fileselectiondlg", "fileselected", "upload" ].join(":");
      PubSub.off(fileSelectorSelection);
      this.listenTo(PubSub, fileSelectorSelection, this._fileSelectorSelection);
    },
    _fileSelectorSelection: function(data) {
      this.file = data ? data[0] : null;
      this.filename = data ? data[0].name : null;
      this.options.shareInfo.useCorePath = false;
      if (this.options.ctfEnabled && data && data.length > 0) {
        this.options.fileInfo.file = data[0];
      }
      var uploadFieldControl = this._getFieldControl("upload"), formatFieldControl = this._getFieldControl("a_content_type");
      var shareAttributeValue = this._getShareAttribute(this.options);
      if (shareAttributeValue) {
        if (uploadFieldControl) {
          $(uploadFieldControl.getFieldEl()).find(".d2-core-path-message").remove();
        }
        var path = this._keyPathMap["share_attribute"] && this._keyPathMap["share_attribute"].fieldPath;
        if (path) {
          var fieldControl = this.getAlpacaControlByPath(path);
          if (fieldControl && fieldControl.fieldView) {
            fieldControl.fieldView.setValue(shareAttributeValue, true);
          }
        }
      }
      if (formatFieldControl && !uploadFieldControl.isRequired()) {
        if (!_.isUndefined(this.file) || !_.isNull(this.file)) {
          this.setRequired(formatFieldControl, true);
        } else {
          this.setRequired(formatFieldControl, false);
        }
      }
    },
    _getRequiredFieldsIds: function() {
      var formSchema = this.model.get("schema"), reqFields = [], reqFieldIds = [];
      if (formSchema) {
        reqFields = jsonPath(formSchema.properties, "$..[?(@.required===true)]", {
          resultType: "PATH"
        });
      }
      _.each(reqFields, function(reqField) {
        var matches = reqField.toString().match(/(\'[\w]*\')/g);
        if (matches) {
          reqFieldIds.push(matches[matches.length - 1].replace(/'/g, ""));
        }
      });
      return reqFieldIds;
    },
    _createControl: function(type, id, label, order, required, enabled, visible, values) {
      var control = {
        id: id,
        type: type,
        label: label,
        order: order,
        condition_required: required,
        condition_enabled: enabled,
        condition_visible: visible
      };
      if (type === "list-checkbox" || type === "list-radio" || type === "combo") {
        control.o = values;
      }
      if (type === "list-radio") {
        control.vertical = false;
      }
      if (type === "boolean") {
        control.value = values && values[0].s;
        control.label = values && values[0].l;
      }
      return control;
    },
    callback: function() {
      return this._getFormats();
    },
    _setDependancy: function(combo) {
      combo["dependencyOnControl"] = "upload";
      combo["assistance_type"] = "custom";
      combo["getDataSourceCallBack"] = _.bind(this.callback, this);
    },
    _getFormats: function() {
      return AddVersionUtils.getFormats(this.filename);
    },
    _createDialogFromConfig: function(options) {
      var self = this;
      this.reqFields = [];
      this.filename = options.fileInfo && options.fileInfo.file ? options.fileInfo.file.name : "";
      this.file = options.fileInfo && options.fileInfo.file;
      var formatList = this._getFormats();
      var dialog = {
        content: {}
      };
      var form = dialog.content;
      var order = 1;
      var ctrlname = this._createControl("text", "object_name", lang.Name, order++, false, false, true);
      ctrlname.value = options.node.get("name");
      var ctrlversion = this._createControl("text", "versiontxt", lang.Version, order++, false, false, true);
      var versionLabels = options.node.get("r_version_label");
      if (_.isString(versionLabels)) {
        versionLabels = [ versionLabels ];
      }
      ctrlversion.value = versionLabels ? versionLabels.join(",") : "";
      form["text"] = [ ctrlname, ctrlversion ];
      var shareAttribute = this._createControl("text", "share_attribute", "Share attribute", order++, true, true, false);
      shareAttribute.value = this._getShareAttribute(options);
      form["text"].push(shareAttribute);
      if (!options?.fileImportUrl) {
        var ctrlfileupload = this._createControl("fileupload", "upload", lang.UploadFromFile, order++, !!options.checkin_from_file_mandatory && !options.checkinFixedFile, !options.checkinFixedFile, true);
        ctrlfileupload.value = this.file;
        form["fileupload"] = ctrlfileupload;
      }
      if (utils.isMobile() && formatList.length === 1 && formatList[0].value === AddVersionUtils.UNKNOWN) {
        formatList[0].s = true;
      }
      var comboctrl;
      if (!options?.fileImportUrl) {
        comboctrl = this._createControl("combo", "a_content_type", lang.Format, order++, !!options.checkin_from_file_mandatory, true, true, formatList);
        comboctrl.autoselect_single = true;
        this._setDependancy(comboctrl);
      } else {
        comboctrl = this._createControl("combo", "a_content_type", lang.Format, order++, !!options.checkin_from_file_mandatory, !options.checkinFixedFile, true);
        comboctrl.value = options?.type;
      }
      form["combo"] = comboctrl;
      if (!options.config.properties["silent_checkin"]) {
        var selected = _.find(options.config["checkin-version-options"], {
          selected: true
        });
        options.config["checkin-version-options"].map(function(item, index) {
          item.s = !selected && index === 0 ? true : item.selected;
          item.l = item.version;
          if (ctrlversion && ctrlversion.value) {
            var ctrlversions = ctrlversion.value.split(",");
            if (_.contains(ctrlversions, item.version)) {
              item.l = _.str.sformat(lang.Replace, item.version);
            }
          }
          item.v = item["version_policy"];
        });
        form["list-radio"] = this._createControl("list-radio", "checkin_version", lang.UploadVersion, order++, true, true, true, options.config["checkin-version-options"]);
      }
      if (options.config.properties["can_log_entry"]) {
        var req = options.config.properties["log_entry_required"];
        form["memo"] = this._createControl("memo", "log_entry", lang.Description, order++, req, true, true);
        if (options.config.properties["keep_log_entry"]) {
          form["memo"].value = options.config["object-properties"]["log_entry"] || "";
        }
      }
      var alwaysSetAsCurrentVersion = options.config.properties["always_set_as_cur_version"];
      var alwaysUnlockNewVersion = options.config.properties["always_unlock_new_version"];
      var silentCheckin = options.config.properties["silent_checkin"];
      var addVersionOptionsMetadata = this._getAddVersionOptionsMetadata();
      if (utils.isMobile()) {
        addVersionOptionsMetadata.retain_lock.visible = false;
      }
      function createAddVersionOptionControl(id) {
        var item_type = utils.isMobile() ? "boolean" : "list-checkbox";
        if (!form[item_type]) {
          form[item_type] = [];
        }
        var metadata = addVersionOptionsMetadata[id];
        if (metadata) {
          var optionData = {
            l: metadata.label,
            v: id
          };
          if (metadata.selected) {
            optionData["s"] = metadata.selected;
          }
          form[item_type].push(self._createControl(item_type, id, "", order++, false, true, metadata.visible, [ optionData ]));
        }
      }
      if (!silentCheckin) {
        if (!alwaysSetAsCurrentVersion) {
          createAddVersionOptionControl("make_current");
        }
        createAddVersionOptionControl("add_version_to_core");
        createAddVersionOptionControl("continue_old_version_in_core");
        createAddVersionOptionControl("stop_share_from_core");
        if (!alwaysUnlockNewVersion) {
          createAddVersionOptionControl("retain_lock");
        }
      }
      return {
        dialog: dialog
      };
    },
    _getAddVersionOptionsMetadata: function() {
      return {
        make_current: {
          label: lang.SetAsCurrentVersion,
          selected: true,
          visible: true
        },
        retain_lock: {
          label: lang.KeepFileLocked,
          selected: false,
          visible: "((getValue(share_attribute).equals(''))||(getValue(share_attribute).equals('core#publish'))||((getValue(share_attribute).equals('core#collaborate#external'))&&(getValue(stop_share_from_core).equals('stop_share_from_core')))||((getValue(share_attribute).equals('core#collaborate'))&&(getValue(add_version_to_core).notEquals('add_version_to_core'))&&(getValue(continue_old_version_in_core).notEquals('continue_old_version_in_core')))||((getValue(share_attribute).equals('core#collaborate'))&&(getValue(add_version_to_core).notEquals('add_version_to_core'))&&(getValue(checkin_version).notEquals(2))))"
        },
        add_version_to_core: {
          label: lang.AddVersionToCore,
          selected: true,
          visible: "((getValue(share_attribute).equals('core#collaborate'))||(getValue(share_attribute).equals('core#publish')))"
        },
        continue_old_version_in_core: {
          label: lang.ContinueOldVersionInCore,
          selected: true,
          visible: "(((getValue(share_attribute).equals('core#collaborate'))||(getValue(share_attribute).equals('core#publish')))&&(getValue(add_version_to_core).notEquals('add_version_to_core')))"
        },
        stop_share_from_core: {
          label: lang.StopShareFromCore,
          selected: false,
          visible: "(getValue(share_attribute).equals('core#collaborate#external'))"
        }
      };
    },
    next: function() {
      var dfd = $.Deferred();
      this.validateForm(true, false).done(function(isValid) {
        this.isValid = isValid;
        this.options.wizard.refreshFooter([ "next" ]);
        function setAddVersionOptionValue(values, key) {
          var checkBoxState = values[key] && _.isArray(values[key]) && values[key].length > 0 && values[key][0] === key;
          values[key] = checkBoxState;
        }
        if (this.isValid) {
          var general = this.getValues();
          var silentCheckin = this.options.config.properties["silent_checkin"];
          if (general["a_content_type"] === AddVersionUtils.UNKNOWN) {
            general["a_content_type"] = "";
          }
          var addVersionOptionsMetadata = this._getAddVersionOptionsMetadata();
          if (!utils.isMobile()) {
            for (var addVersionOption in addVersionOptionsMetadata) {
              if (Object.prototype.hasOwnProperty.call(addVersionOptionsMetadata, addVersionOption)) {
                setAddVersionOptionValue(general, addVersionOption);
              }
            }
          }
          if (silentCheckin) {
            general["checkin_version"] = this.options.config["checkin-version-options"][0]["version-policy"];
            if (this.options.externalShare && this.options.externalShare.core && !this.options.shareInfo.useCorePath) {
              general["add_version_to_core"] = true;
            }
          } else {
            if (this.options.externalShare && this.options.externalShare.core) {
              if (!this.options.shareInfo.useCorePath && !general["add_version_to_core"] && !general["continue_old_version_in_core"] || this.options.shareInfo.useCorePath && general["stop_share_from_core"]) {
                this.options.shareInfo.stopShare = true;
              } else {
                delete this.options.shareInfo.stopShare;
              }
            }
          }
          if (this.shareMode === constants.ShareIntentType.COLLABORATE) {
            if (this.options.shareInfo.useCorePath) {
              if (!general["stop_share_from_core"]) {
                general["retain_lock"] = true;
              }
            } else {
              if (general["add_version_to_core"] || general["continue_old_version_in_core"] && general["checkin_version"] === 2) {
                general["retain_lock"] = true;
              }
            }
          }
          this.options.fileInfo.file = this.file;
          this.options.wizard.data.general = general;
          this.options.data = {
            general: general
          };
          this.options.view = this;
          if (!this.options.isMultipleCheckin) {
            if (this.options.config.properties["property_page"] || this.options.showProcessingStep === true) {
              this.options.wizard.nextStep();
            } else {
              this.options.wizard.close(this.options);
            }
          }
          dfd.resolve();
        } else {
          dfd.reject();
        }
      }.bind(this));
      return dfd.promise();
    },
    onStepActive: function() {
      if (this.form) {
        this.validateForm(false, true).done(_.bind(function(isValid) {
          this.isValid = isValid;
          this.options.wizard.refreshFooter([ "next" ]);
        }, this));
      }
    }
  });
  return AddVersionGeneralView;
});