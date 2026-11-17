/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/models/form", "d2/widgets/metadata/utils/form.converter", "d2/controls/form/d2.form.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/commands/open.plugins/impl/publish/publish.fields.constant", "i18n!d2/commands/open.plugins/nls/localized.strings", "i18n!d2/dialogs/add.version/impl/nls/lang" ], function($, _, Marionette, FormModel, MetadataConverter, D2FormView, WizardTabableRegionBehavior, PerfectScrollingBehavior, PublishFieldsConstant, lang, addVersionLang) {
  "use strict";
  return D2FormView.extend({
    constructor: function PublishDialogBodyView(options) {
      this.options = options || {};
      this.formRendered = false;
      var dialog = this._createDialogJson();
      var me = this;
      this.formmodel = MetadataConverter.convertConfig(dialog, {
        actionMode: "create",
        layoutMode: "singleCol",
        extendFieldOptions: function(field, alpControl) {
          if (field && alpControl) {
            var fieldId = field.id;
            if (fieldId === "folder-id") {
              _.extend(alpControl["options"]["fields"][fieldId], {
                subTypeFilters: [ "dm_folder" ],
                container: me.options.container
              });
            }
          }
        }
      });
      options.model = new FormModel(this.formmodel.propertiesConfig[0]);
      this._setExpressions();
      options.topAlignedLabel = true;
      options.mode = "create";
      _.extend(this.behaviors, {
        PerfectScrolling: {
          behaviorClass: PerfectScrollingBehavior,
          suppressScrollX: true,
          scrollYMarginOffset: 15
        },
        WizardTabableRegionBehavior: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
      D2FormView.prototype.constructor.call(this, options);
    },
    className: function() {
      var parentClassName = D2FormView.prototype.className || "";
      if (_.isFunction(parentClassName)) {
        parentClassName = parentClassName.apply(this, arguments);
      }
      return parentClassName + " d2-publish-dialog-body";
    },
    _setExpressions: function() {
      if (this.options.checkinConfig && this.options.addExtraOptions && _.contains(this.options.addExtraOptions, PublishFieldsConstant.publishOptions.VERSION)) {
        this.options.model.attributes.expressions["checkin_version"]["setVisible"] = "(getValue(publish_options).equals('version'))";
      }
      if (!this.options.checkinConfig && this.options.addExtraOptions && _.contains(this.options.addExtraOptions, PublishFieldsConstant.publishOptions.VERSION)) {
        this.options.model.attributes.expressions["version_error_field"]["setVisible"] = "(getValue(publish_options).equals('version'))";
      }
      this.options.model.attributes.expressions["folder-id"]["setVisible"] = "(getValue(publish_options).equals('browse'))";
      this.options.model.attributes.expressions["input-file-name"]["setVisible"] = "(getValue(publish_options).equals('browse') || getValue(publish_options).equals('home-cabinet') || getValue(publish_options).equals('current-location'))";
    },
    _createDialogJson: function() {
      var form = {
        order: 1,
        combo: {
          id: PublishFieldsConstant.publishFields.OPTIONS,
          type: "combo",
          label: lang.PublishDialogFieldsOptionsLabel,
          order: "1.1",
          isEditable: false,
          removeDefaultNone: true,
          condition_required: true,
          condition_enabled: true,
          condition_visible: true,
          o: [ {
            "is-default": false,
            value: PublishFieldsConstant.publishOptions.BROWSE,
            text: lang.PublishDialogOptionsBrowseText
          }, {
            "is-default": false,
            value: PublishFieldsConstant.publishOptions.HOME_CABINET,
            text: lang.PublishDialogOptionsHomeCabinetText
          } ]
        },
        "node-picker": [ {
          order: "1.2",
          id: PublishFieldsConstant.publishFields.FOLDER,
          label: lang.PublishDialogFieldsFolderLabel,
          condition_required: true,
          property_type: "string",
          subTypeFilters: [ "dm_folder" ],
          repeating: false
        } ],
        text: [ {
          id: PublishFieldsConstant.publishFields.FILE_NAME,
          type: "text",
          label: lang.PublishDialogFieldsFileNameLabel,
          order: 1.3,
          condition_required: true,
          value: this.options.defaultFileName
        } ]
      };
      if (this.options.addExtraOptions && _.contains(this.options.addExtraOptions, PublishFieldsConstant.publishOptions.CURRENT_LOCATION)) {
        form.combo.o.splice(0, 0, {
          "is-default": false,
          value: PublishFieldsConstant.publishOptions.CURRENT_LOCATION,
          text: lang.PublishDialogOptionsCurrentLocationText
        });
      }
      if (this.options.addExtraOptions && _.contains(this.options.addExtraOptions, PublishFieldsConstant.publishOptions.RENDITION)) {
        form.combo.o.push({
          "is-default": false,
          value: PublishFieldsConstant.publishOptions.RENDITION,
          text: lang.PublishDialogOptionsRenditionText
        });
      }
      if (this.options.addExtraOptions && _.contains(this.options.addExtraOptions, PublishFieldsConstant.publishOptions.VERSION)) {
        form.combo.o.push({
          "is-default": false,
          value: PublishFieldsConstant.publishOptions.VERSION,
          text: lang.PublishDialogOptionsVersionText
        });
      }
      form.combo.o.push({
        "is-default": false,
        value: PublishFieldsConstant.publishOptions.DOWNLOAD,
        text: lang.PublishDialogOptionsDownloadText
      });
      form.combo.o[0]["s"] = true;
      if (this.options.checkinConfig && this.options.addExtraOptions && _.contains(this.options.addExtraOptions, PublishFieldsConstant.publishOptions.VERSION)) {
        var selected = _.find(this.options.checkinConfig["checkin-version-options"], {
          selected: true
        });
        var versionLabels = this.options.node.get("r_version_label");
        this.options.checkinConfig["checkin-version-options"].map(function(item, index) {
          item.s = !selected && index === 0 ? true : item.selected;
          item.l = item.version;
          if (_.contains(versionLabels, item.version)) {
            item.l = _.str.sformat(addVersionLang.Replace, item.version);
          }
          item.v = item["version_policy"];
        });
        form["list-radio"] = {
          id: PublishFieldsConstant.publishFields.VERSION,
          type: "list-radio",
          label: lang.PublishDialogFieldsVersionLabel,
          order: "1.4",
          visible: false,
          condition_required: false,
          vertical: true,
          o: this.options.checkinConfig["checkin-version-options"]
        };
      }
      if (!this.options.checkinConfig) {
        form["html-editor"] = {
          id: "version_error_field",
          type: "html-editor",
          label: "",
          condition_visible: false,
          condition_required: false,
          order: 1.5,
          value: this.options.reserveFileError,
          disable_expand: true
        };
      }
      return {
        dialog: {
          content: form
        }
      };
    },
    onRender: function() {
      this.formRendered = true;
    },
    isFormRendered: function() {
      return this.formRendered;
    }
  });
});