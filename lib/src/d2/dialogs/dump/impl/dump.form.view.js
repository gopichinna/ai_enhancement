/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/form", "d2/widgets/metadata/utils/form.converter", "d2/controls/form/d2.form.view", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/globalmessage/globalmessage", "d2/controls/behaviors/wizard.tabable.region.behavior", "dctmw/utils/utils", "i18n!d2/dialogs/dump/impl/nls/lang" ], function(_, $, FormModel, MetadataConverter, D2FormView, PerfectScrollingBehavior, GlobalMessage, WizardTabableRegionBehavior, Utils, lang) {
  "use strict";
  return D2FormView.extend({
    constructor: function DumpFormView(options) {
      options || (options = {});
      this.init();
      this.formRendered = false;
      this.objectName = this.getObjectname(options.data);
      this.noObject = false;
      var dialog = this._createDialogJson(_.omit(options.data, "name"));
      this.wizard = options.wizard;
      this.wizard.blockActions();
      this.formmodel = MetadataConverter.convertConfig(dialog, {
        actionMode: "read"
      });
      options.model = new FormModel(this.formmodel.propertiesConfig[0]);
      options.topAlignedLabel = false;
      options.mode = "read";
      _.extend(this.behaviors, {
        WizardTabableRegionBehavior: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
      D2FormView.prototype.constructor.call(this, options);
    },
    init: function() {
      this.fieldsetsLang = Object.freeze({
        user_attributes: lang.FieldSetUserAttributes,
        system_attributes: lang.FieldSetSystemAttributes,
        application_attributes: lang.FieldSetApplicationAttributes,
        internal_attributes: lang.FieldSetInternalAttributes
      });
      this.containerIds = Object.freeze({
        fieldset: "dump_form_fieldset",
        tabgroup: "dump_form_tabgroup",
        tab_1: "dump_form_tab_1",
        tab_2: "dump_form_tab_2",
        d2config_fieldset: "dump_form_d2config_fieldset"
      });
    },
    className: function() {
      var classname = "cs-form csui-general-form";
      if (this.noObject) {
        classname += " d2-dump-no-object";
      }
      return classname;
    },
    onRender: function() {
      this.formRendered = true;
      this.wizard.unblockActions();
      this._footerRefresh();
    },
    _footerRefresh: function() {
      this.wizard.footerView.triggerMethod("dom:refresh");
    },
    isFormRendered: function() {
      return this.formRendered;
    },
    getSubTitle: function() {
      return this.objectName;
    },
    getObjectname: function(data) {
      var objectName = lang.D2ConfigObjectName;
      if (data["user_attributes"]) {
        objectName = data.user_attributes.task_subject || data.user_attributes.object_name;
      }
      return objectName;
    },
    _createDialogJson: function(data) {
      var form = {
        order: 1,
        fieldset: {
          id: this.containerIds.fieldset,
          order: 1,
          label: "",
          tabs: {
            id: this.containerIds.tabgroup,
            order: 1,
            tab: [ {
              id: this.containerIds.tab_1,
              order: 1,
              label: lang.TabLabelDctmObject,
              usePerfectScrollbar: true,
              fieldset: []
            }, {
              id: this.containerIds.tab_2,
              order: 2,
              label: lang.TabLabelD2Configuration,
              usePerfectScrollbar: true
            } ]
          }
        }
      }, d2TabFieldList = [], dctmTabFieldList = [], fieldSetOrder = 1;
      _.each(data, function(fieldsetData, fieldset) {
        if (fieldset === "d2_configs") {
          d2TabFieldList = this._createFieldSets(fieldsetData, fieldset);
          form.fieldset.tabs.tab[1]["html-editor"] = d2TabFieldList;
        } else {
          dctmTabFieldList = this._createFieldSets(fieldsetData, fieldset);
          form.fieldset.tabs.tab[0]["fieldset"].push({
            label: this.fieldsetsLang[fieldset],
            order: fieldSetOrder++,
            "html-editor": dctmTabFieldList
          });
        }
      }.bind(this));
      if (form.fieldset.tabs.tab[0]["fieldset"].length === 0) {
        this.noObject = true;
        form = {};
        form.fieldset = {
          id: this.containerIds.d2config_fieldset,
          order: 1
        };
        form.fieldset["html-editor"] = d2TabFieldList;
      }
      return {
        dialog: {
          content: form
        }
      };
    },
    _createFieldSets: function(fieldsetData) {
      var fieldsets = [], order = 1;
      _.each(fieldsetData, function(itemVal, item) {
        if (itemVal && _.isArray(itemVal)) {
          _.each(itemVal, function(subItemVal, index) {
            fieldsets.push(this._createField(item, subItemVal, order, index));
            order++;
          }.bind(this));
        } else {
          fieldsets.push(this._createField(item, itemVal, order));
          order++;
        }
      }.bind(this));
      return fieldsets;
    },
    _createField: function(item, itemVal, order, index) {
      return {
        order: order,
        id: this._generateId(item, index),
        label: this._generateLabel(item, index),
        value: itemVal,
        disable_expand: true
      };
    },
    _generateId: function(str, index) {
      var id = str.replace(/[\]\[ -]/g, "_");
      return !_.isNaN(index) && _.isNumber(index) ? id.concat("_" + index) : id;
    },
    _generateLabel: function(str, index) {
      if (!_.isNaN(index) && _.isNumber(index)) {
        return str + " [" + index + "]";
      }
      return str;
    },
    executeCopy: function() {
      var containerData = {};
      var objectLabel = "";
      if (this.noObject) {
        containerData = this.form.options.fields[this.containerIds.d2config_fieldset];
        objectLabel = lang.D2ConfigObjectName;
      } else {
        var activeTabId = this.getActiveTabId();
        if (activeTabId) {
          containerData = this.form.options.fields[this.containerIds.fieldset]["fields"][this.containerIds.tabgroup]["fields"][activeTabId]["fields"];
        }
        if (activeTabId === this.containerIds.tab_2) {
          containerData = {
            field1: {
              fields: containerData
            }
          };
        }
        objectLabel = this.form.options.fields[this.containerIds.fieldset]["fields"][this.containerIds.tabgroup]["fields"][activeTabId]["containerLabel"];
      }
      if (this._copyToClipboard(containerData)) {
        var msg = _.str.sformat(lang.CopyMessageSuccess, objectLabel);
        GlobalMessage.showMessage("success", msg);
      }
    },
    getActiveTabId: function() {
      var control = this.getAlpacaControlByPath(this.containerIds.fieldset + "." + this.containerIds.tabgroup, ".");
      var activeTabId = control ? control.getCurrentlyActiveTabId() : undefined;
      return activeTabId;
    },
    generateText: function(containerData) {
      var clipboardData = "";
      if (this.noObject) {
        clipboardData += this.getFieldsetText(containerData);
      } else {
        _.each(containerData, function(fieldset) {
          clipboardData += fieldset.containerLabel ? fieldset.containerLabel + "\r\n" : "";
          clipboardData += this.getFieldsetText(fieldset);
          clipboardData += "\r\n";
        }.bind(this));
      }
      return clipboardData;
    },
    getFieldsetText: function(fieldset) {
      var text = "";
      _.each(fieldset.fields, function(field, fieldKey) {
        var fieldVal = this.form.options.initialFieldValueMap[fieldKey];
        if (fieldVal === undefined || fieldVal === null) {
          fieldVal = "";
        }
        text += field.label + "\t";
        text += fieldVal + "\r\n";
      }.bind(this));
      return text;
    },
    _copyToClipboard: function(containerData) {
      var clipboardText = this.generateText(containerData);
      return Utils.copyToClipboard(clipboardText);
    }
  });
});