/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/utils/url", "nuc/lib/backbone", "dctmw/utils/rest.resources", "dctmw/utils/date/date.utils", "d2/utils/rest.linkrels", "d2/utils/format.utils", "nuc/lib/moment", "nuc/utils/types/date", "d2/utils/combo.datasource.utils", "d2/utils/mass.update.utils", "dctmw/utils/utils", "i18n!d2/widgets/metadata/impl/nls/lang" ], function(_, Url, Backbone, RestResources, dateUtils, RestLinkrels, FormatUtils, moment, dateFormat, ComboDataSouceUtils, MassUpdateUtils, utils, lang) {
  "use strict";
  var MAX_LEN = 255;
  var stripScriptsRe = /(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)/gi;
  var fieldContentTypeMap = {
    USER_OR_GROUP: {
      d2combo: "d2usercombo",
      d2list: "d2userlist"
    },
    QUERY_BUILDER: {
      textarea: "d2querybuilder"
    },
    USER_OR_GROUP_SEARCH: {
      d2combo: "d2userorgroupcombosearch"
    }
  };
  var fieldMap = {
    "html-editor": convertHTMLEditor,
    comment: convertComment,
    date: convertDate,
    label: convertLabel,
    empty: convertLabel,
    text: convertText,
    hyperlink: convertHyperLink,
    boolean: convertBoolean,
    memo: convertMemo,
    combo: convertSingleList,
    "combo-std": convertSingleList,
    "list-radio": convertRadioList,
    "combo-editable": convertEditableComboList,
    "list-editable": convertMultiListEdit,
    "list-checkbox": convertCheckboxList,
    list: convertMultiList,
    "dctm-relation": convertDocumentSelect,
    "dctm-document": convertDocumentSelect,
    password: convertPassword,
    fileupload: convertFileUpload,
    "node-picker": convertNodePicker,
    singleSelectTree: convertSingleSelectTree
  };
  var comboDataSourceMap = {
    dictionary: ComboDataSouceUtils.buildDictionaryDS,
    dql: ComboDataSouceUtils.buildDqlDS,
    java: ComboDataSouceUtils.buildJavaDS,
    taxonomy: ComboDataSouceUtils.buildTaxonomyDS,
    custom: ComboDataSouceUtils.buildCustomDS,
    hierarchy: ComboDataSouceUtils.buildHierarchyDS
  };
  function getFieldTypeForContent(fieldContentType, alpacaFieldType) {
    var fieldContents = fieldContentTypeMap && fieldContentTypeMap[fieldContentType];
    return fieldContents && fieldContents[alpacaFieldType];
  }
  function fetchAlpacaControl(field, mode, options, ancestorOptions) {
    var f = {
      data: {},
      schema: {
        properties: {}
      },
      options: {
        fields: {}
      },
      expressions: {}
    };
    var fieldId = field.id;
    if (options && options.isMassUpdate) {
      if (field.o) {
        field.o = MassUpdateUtils.convertHashValues(field.o, options);
      } else {
        field.value = MassUpdateUtils.convertHashValues(field.value, options);
      }
    }
    f["data"][fieldId] = _.isUndefined(field.value) ? null : field.value;
    f["schema"]["properties"][fieldId] = {
      title: field.label,
      type: "string"
    };
    f["options"]["fields"][fieldId] = {};
    _.extend(f["options"]["fields"][fieldId] = {
      _type: field.property_type || "string",
      _repeating: field.repeating || false,
      _reinitValue: null,
      reinitAttributes: field.reinit_attributes
    });
    f["expressions"][fieldId] = {};
    var requiredConditionLabel = "condition_required_" + mode;
    var enabledConditionLabel = "condition_enabled_" + mode;
    var visibleConditionLabel = "condition_visible_" + mode;
    if (_.has(field, visibleConditionLabel) && field[visibleConditionLabel] === false) {
      _.extend(f["options"]["fields"][fieldId], {
        hidden: true,
        hiddenBySelf: true
      });
    } else if (_.has(field, "condition_visible")) {
      f["expressions"][fieldId]["setVisible"] = field["condition_visible"] === "" ? true : field["condition_visible"];
    }
    if (_.has(field, "reinit_visible")) {
      _.extend(f["options"]["fields"][fieldId], {
        _reinit_visible: field["reinit_visible"]
      });
    }
    if (_.has(field, enabledConditionLabel) || ancestorOptions && ancestorOptions.isAncestorDisabled) {
      var disabled = !field[enabledConditionLabel] || !!ancestorOptions.isAncestorDisabled;
      var disabledBySelf = !field[enabledConditionLabel];
      _.extend(f["options"]["fields"][fieldId], {
        disabled: disabled,
        disabledBySelf: disabledBySelf
      });
      _.extend(f["schema"]["properties"][fieldId], {
        disabled: disabled,
        disabledBySelf: disabledBySelf
      });
      if (field[enabledConditionLabel] && _.has(field, "condition_enabled")) {
        f["expressions"][fieldId]["setEnabled"] = field["condition_enabled"] === "" ? true : field["condition_enabled"];
      }
    } else if (_.has(field, "condition_enabled")) {
      f["expressions"][fieldId]["setEnabled"] = field["condition_enabled"] === "" ? true : field["condition_enabled"];
    }
    if (_.has(field, "reinit_enabled")) {
      _.extend(f["options"]["fields"][fieldId], {
        reinit_enabled: field["reinit_enabled"]
      });
    }
    if (_.has(field, requiredConditionLabel)) {
      var required = field[requiredConditionLabel] && (_.has(field, enabledConditionLabel) ? field[enabledConditionLabel] : true) && !(ancestorOptions && ancestorOptions.isAncestorDisabled);
      _.extend(f["schema"]["properties"][fieldId], {
        required: required
      });
      if (required && _.has(field, "condition_required")) {
        f["expressions"][fieldId]["setRequired"] = field["condition_required"];
      }
    } else if (_.has(field, "condition_required") && field["condition_required"] === true && !(_.has(field, "advancedView_required") && field["advancedView_required"] === true)) {
      f["expressions"][fieldId]["setRequired"] = field["condition_required"];
    } else if (_.has(field, "required") && field["required"] === true && !(_.has(field, "advancedView_required") && field["advancedView_required"] === true)) {
      f["expressions"][fieldId]["setRequired"] = field["required"];
    }
    if (_.has(field, "condition_validation")) {
      _.extend(f["options"]["fields"][fieldId], {
        _custom_validator: {
          regEx: true,
          expression: field.condition_validation,
          message: field.validation_message
        }
      });
      f["expressions"][fieldId]["setValid"] = field.condition_validation;
    }
    if (options && options.isMassUpdate) {
      var multiCountData = MassUpdateUtils.getCountData(field["object-values"], options);
      _.extend(f["options"]["fields"][fieldId], {
        multiFileData: field["object-values"],
        multiFileCountData: multiCountData && multiCountData.valuesCount,
        massUpdateFileCount: options.massUpdateFileCount,
        maxObjectThresholdReached: options.maxObjectThresholdReached,
        hasMultipleValues: MassUpdateUtils.fieldHasMultipleValues(field.o || field.value),
        massUpdateDocumentType: options.massUpdateDocumentType,
        massUpdateNodes: options.massUpdateNodes
      });
      if (options.isList && !field.sorted) {
        f["options"]["fields"][fieldId].initialOrder = multiCountData && multiCountData.order;
      }
      f["multiFileData"] = {};
      f["multiFileData"][fieldId] = f["options"]["fields"][fieldId].multiFileCountData && JSON.parse(JSON.stringify(f["options"]["fields"][fieldId].multiFileCountData));
    }
    return f;
  }
  function formatFieldValue(d2field, alpacafield, fieldId) {
    if (alpacafield["options"]["fields"][fieldId].hasMultipleValues) {
      if (FormatUtils.isDateType(d2field.property_type)) {
        alpacafield["options"]["fields"][fieldId].multiFileCountData = MassUpdateUtils.getCountData(d2field["object-values"], {
          dateFormat: d2field.display_time ? "datetime" : "date"
        }).valuesCount;
        alpacafield["multiFileData"][fieldId] = alpacafield["options"]["fields"][fieldId].multiFileCountData && JSON.parse(JSON.stringify(alpacafield["options"]["fields"][fieldId].multiFileCountData));
      }
    } else if (d2field.repeating === true || d2field.property_type !== "string") {
      alpacafield["data"][fieldId] = FormatUtils.isDateType(d2field.property_type) ? FormatUtils.convertToClientFormat(d2field.value, d2field.display_time) : d2field.mapping_value || d2field.value;
      if (d2field.mapping_format && d2field.value_format && d2field.mapping_format !== d2field.value_format) {
        _.extend(alpacafield["schema"]["properties"][fieldId], {
          _value: d2field.value,
          mapping_value: d2field.mapping_value,
          value_format: d2field.value_format
        });
      }
    }
  }
  function stripScripts(v) {
    return !v ? v : v.replace(stripScriptsRe, "");
  }
  function convertLabel(label, mode, options, ancestorOptions) {
    var fieldId = label.id;
    var textField = _.extend(fetchAlpacaControl(label, mode, options && options.isMassUpdate ? _.extend({
      hideEnterNew: true
    }, options) : options, ancestorOptions));
    _.extend(textField["schema"]["properties"][fieldId], {
      maxLength: label.maxlength || MAX_LEN,
      readonly: true,
      type: "dctmwlabel"
    });
    _.extend(textField["options"]["fields"][fieldId], {
      readonly: true,
      type: "dctmwlabel"
    });
    formatFieldValue(label, textField, fieldId);
    if (label.mapping_value) {
      _.extend(textField["schema"]["properties"][fieldId], {
        _value: label.value,
        mapping_value: label.mapping_value
      });
      if (label.assistance_type && label.value !== label.mapping_value) {
        textField["data"][fieldId] = label.value;
      }
    }
    checkAndApplyOverrideValue(label, textField, fieldId, options);
    if (label.repeating && !options.isGridField) {
      updateRepeatingLabelFieldValue(label, textField);
    }
    return textField;
  }
  function updateRepeatingLabelFieldValue(label, textField) {
    var fieldId = label.id;
    if (_.isObject(label.o)) {
      if (_.isArray(label.o)) {
        textField["data"][fieldId] = label.o.map(values => {
          return values.v;
        });
      } else {
        textField["data"][fieldId] = [ label.o.v ];
      }
    } else {
      textField["data"][fieldId] = [];
    }
  }
  function convertDate(date, mode, options, ancestorOptions) {
    var fieldId = date.id, shouldDisplayTime = date.display_time, pickerDefaultDate = FormatUtils.getPickerDefaultDateInISO(date["default_time"]), format = shouldDisplayTime ? "datetime" : "date", dateformat = shouldDisplayTime ? dateFormat.exactDateTimeFormat : dateFormat.exactDateFormat;
    var dateField = _.extend(fetchAlpacaControl(date, mode, options && options.isMassUpdate ? _.extend({
      showSelectDate: true,
      dateFormat: format
    }, options) : options, ancestorOptions));
    if (options && options.isMassUpdate) {
      var multiFileCountData = dateField["options"]["fields"][fieldId].multiFileCountData;
      if (multiFileCountData && Object.keys(multiFileCountData).length === 1) {
        dateField["data"][fieldId] = multiFileCountData[Object.keys(multiFileCountData)[0]].value;
        dateField["options"]["fields"][fieldId].multiFileCountData = undefined;
        dateField["multiFileData"][fieldId] = undefined;
      }
    }
    let currPrefDateTimeFormat = RestResources.getCurrentUser()?.get("preferences")?.date_time_format;
    _.extend(dateField["schema"]["properties"][fieldId], {
      format: options.isOtcForm ? (shouldDisplayTime ? currPrefDateTimeFormat : dateUtils.convertDateTimeFormatToDateFormat(currPrefDateTimeFormat))?.replaceAll("zzzz", "z").replaceAll("'", "&#39;") : format
    });
    _.extend(dateField["options"]["fields"][fieldId], {
      type: options.isOtcForm ? "date" : format,
      dateTime: shouldDisplayTime,
      _type: format,
      dateFormat: dateformat,
      pickerDefaultDate: pickerDefaultDate,
      picker: {
        format: dateformat
      }
    });
    date.property_type = date.property_type || format;
    if (!_.isUndefined(dateField["options"]["fields"][fieldId]["_custom_validator"])) {
      dateField["options"]["fields"][fieldId]["_custom_validator"]["regEx"] = false;
      dateField["options"]["fields"][fieldId]["_custom_validator"]["isDateValidator"] = true;
    }
    checkAndApplyOverrideValue(date, dateField, fieldId, options);
    return dateField;
  }
  function convertText(text, mode, options, ancestorOptions) {
    if (text.repeating && !options.isGridField) {
      return convertMultiListEdit(text, mode, options, ancestorOptions);
    }
    var fieldId = text.id;
    var textField = _.extend(fetchAlpacaControl(text, mode, options, ancestorOptions));
    _.extend(textField["schema"]["properties"][fieldId], {
      maxLength: text.maxlength || MAX_LEN
    });
    var fieldOptions = textField["options"]["fields"][fieldId];
    if (fieldOptions._type === "double" || fieldOptions._type === "integer") {
      _.extend(fieldOptions, {
        type: "d2number"
      });
      _.extend(textField["schema"]["properties"][fieldId], {
        type: "number"
      });
    } else {
      _.extend(fieldOptions, {
        type: "text"
      });
    }
    _.extend(fieldOptions, {
      placeholder: text.placeholder
    });
    formatFieldValue(text, textField, fieldId);
    checkAndApplyOverrideValue(text, textField, fieldId, options);
    return textField;
  }
  function convertHyperLink(url, mode, options, ancestorOptions) {
    var fieldId = url.id;
    var urlField = _.extend(fetchAlpacaControl(url, mode, options, ancestorOptions));
    _.extend(urlField["schema"]["properties"][fieldId], {
      format: "uri"
    });
    _.extend(urlField["options"]["fields"][fieldId], {
      type: options.isOtcForm ? "input" : "d2url",
      inputType: options.isOtcForm && "url"
    });
    checkAndApplyOverrideValue(url, urlField, fieldId, options);
    return urlField;
  }
  function convertBoolean(boolControl, mode, options, ancestorOptions) {
    var fieldId = boolControl.id;
    boolControl.value = boolControl.value ? boolControl.value : false;
    boolControl.property_type = boolControl.property_type ? boolControl.property_type : "boolean";
    var bool = _.extend(fetchAlpacaControl(boolControl, mode, options && options.isMassUpdate ? _.extend({
      isBoolean: true,
      hideEnterNew: true
    }, options) : options, ancestorOptions));
    _.extend(bool["options"]["fields"][fieldId], {
      type: options && options.isMassUpdate ? "d2massupdateboolean" : "checkbox"
    });
    if (options.isOtcForm && mode === "read") {
      bool["options"]["fields"][fieldId].type = "input";
      bool["options"]["fields"][fieldId].inputType = "boolean";
      bool["data"][fieldId] = bool["data"][fieldId] === "false" || bool["data"][fieldId] === "F" ? false : !!bool["data"][fieldId];
      bool["data"][fieldId] = bool["data"][fieldId] ? lang.valueTrue : lang.valueFalse;
    }
    checkAndApplyOverrideValue(boolControl, bool, fieldId, options);
    return bool;
  }
  function convertMemo(memo, mode, options, ancestorOptions) {
    if (memo.repeating && !options.isGridField) {
      return convertMultiListEdit(memo, mode, options, ancestorOptions);
    }
    var fieldId = memo.id;
    var textarea = _.extend(fetchAlpacaControl(memo, mode, options, ancestorOptions)), fieldOptions = textarea["options"]["fields"][fieldId];
    _.extend(fieldOptions, {
      type: "textarea",
      disallowOnlyEmptySpaces: memo.disallowOnlyEmptySpaces,
      rows: memo.rows || 4,
      isTextareaAutoHeight: memo.isTextareaAutoHeight,
      placeholder: memo.placeholder
    });
    if (!memo.ignoreMaxLength) {
      _.extend(textarea["schema"]["properties"][fieldId], {
        maxLength: memo.maxlength || MAX_LEN
      });
    }
    if (!_.isUndefined(textarea["options"]["fields"][fieldId]["_custom_validator"]) && memo.nonRegexValidation) {
      textarea["options"]["fields"][fieldId]["_custom_validator"]["regEx"] = false;
    }
    if (memo["field_content_type"]) {
      fieldOptions.type = getFieldTypeForContent(memo["field_content_type"], fieldOptions.type) || fieldOptions.type;
    }
    if (fieldOptions.type === "d2querybuilder") {
      _.extend(fieldOptions, memo.queryBuilderOptions || {});
    }
    checkAndApplyOverrideValue(memo, textarea, fieldId, options);
    return textarea;
  }
  function convertMultiListEdit(listMulti, mode, options, ancestorOptions) {
    return convertMultiList(listMulti, mode, options, ancestorOptions, true);
  }
  function convertMultiList(listMulti, mode, options, ancestorOptions, isEditable) {
    var fieldId = listMulti.id;
    var selectedValues = [];
    var selectedValueObj = [];
    var dataSourceObjects = [];
    var otcFormDataSourceObjects = {
      values: [],
      enum: []
    };
    var fieldType = "d2list";
    var litSelect = _.extend(fetchAlpacaControl(listMulti, mode, options && options.isMassUpdate ? _.extend({
      hideEnterNew: true,
      isList: true
    }, options) : options, ancestorOptions));
    var values = listMulti.value ? {
      s: true,
      v: listMulti.value
    } : listMulti.o;
    if (_.isObject(values) && !_.isArray(values)) {
      values = [ values ];
    }
    if (options && options.isMassUpdate && litSelect["options"]["fields"][fieldId].hasMultipleValues && !options.maxObjectThresholdReached) {
      var allValuesCommon = true, newValues = [], position = 1;
      _.each(litSelect["options"]["fields"][fieldId].multiFileCountData, function(valueData) {
        if (valueData.hasValue === false) {
          return;
        }
        allValuesCommon = allValuesCommon && valueData.count === valueData.totalCount;
        if (valueData.count === valueData.totalCount) {
          var valuePresent = _.find(values, function(value) {
            return value.v === valueData.value;
          });
          if (!valuePresent) {
            newValues.push({
              v: valueData.value,
              l: valueData.label || valueData.value,
              c: valueData.category,
              s: true,
              p: position++
            });
          } else {
            valuePresent.s = true;
            valuePresent.p = position++;
          }
        } else {
          if (/Error/.test(valueData.category)) {
            values[0].c = valueData.category;
          }
        }
      });
      if (allValuesCommon) {
        values.pop();
        litSelect["options"]["fields"][fieldId].hasMultipleValues = false;
        litSelect["options"]["fields"][fieldId].multiFileCountData = litSelect["options"]["fields"][fieldId].multiFileData = litSelect["multiFileData"][fieldId] = undefined;
      }
      values.push.apply(values, newValues);
    }
    if (listMulti["field_content_type"]) {
      fieldType = getFieldTypeForContent(listMulti["field_content_type"], fieldType) || fieldType;
    }
    if (options && options.extendFieldOptions && _.isFunction(options.extendFieldOptions)) {
      options.extendFieldOptions.call(this, listMulti, litSelect);
    }
    _.extend(litSelect["options"]["fields"][fieldId], {
      type: fieldType,
      _d2type: fieldType,
      hideInitValidationError: true,
      useDataSourceAsEnum: true,
      removeDefaultNone: !!listMulti.removeDefaultNone || false,
      isEditable: isEditable ? true : false,
      isSorted: !!listMulti.sorted || false,
      isAutoSelectSingle: !!listMulti.autoselect_single || false,
      isAutoSelectMulti: !!listMulti.autoselect_multi || false,
      isUpdateOnEdit: !!listMulti.update_upon_edit || false,
      async: !!listMulti.asynchronous || false,
      rows: !_.isUndefined(listMulti.rows) ? listMulti.rows : 8,
      showHorizontal: listMulti.horizontal_display,
      showOptionsInHierarchy: listMulti.showOptionsInHierarchy,
      maxSelection: listMulti.maxSelection,
      retainOptionsOrder: listMulti.retainOptionsOrder,
      d2FormNodeIds: options && options.d2FormNodeIds,
      isMassUpdate: options.isMassUpdate,
      fields: {
        item: {
          type: "select"
        }
      }
    });
    if (listMulti.assistance_type && comboDataSourceMap[listMulti.assistance_type]) {
      litSelect = comboDataSourceMap[listMulti.assistance_type](litSelect, listMulti, options);
    }
    if (listMulti.showOptionsInHierarchy) {
      values = comboDataSourceMap["hierarchy"](values);
    }
    if (_.isArray(values) || _.isObject(values)) {
      for (var i = 0; i < values.length; i++) {
        var value = values[i];
        if (value.s === true) {
          value.options = _.omit(value, "v", "l", "s", "c", "pt");
          selectedValueObj.push(value);
        }
        var text = value.l !== undefined && value.l !== "" ? value.l : value.v;
        if (options.isOtcForm && litSelect.asynchronous !== true) {
          otcFormDataSourceObjects.values.push(value.v);
          otcFormDataSourceObjects.enum.push(i);
        } else {
          dataSourceObjects.push({
            value: value.v,
            text: text.toString(),
            category: value.c,
            selected: value.s,
            preItemText: value.pt,
            options: _.omit(value, "v", "l", "s", "c", "pt")
          });
        }
      }
      selectedValueObj = _.sortBy(selectedValueObj, "p");
      selectedValues = _.pluck(selectedValueObj, "v");
    }
    let selectedValuesFromNodeAttributes = listMulti.selectedValuesFromNodeAttributes || [];
    litSelect["data"][fieldId] = [ ...new Set([ ...selectedValues, ...selectedValuesFromNodeAttributes ]) ] || null;
    _.extend(litSelect["schema"]["properties"][fieldId], {
      type: "array",
      items: {
        type: listMulti.property_type ? listMulti.property_type : "string",
        enum: otcFormDataSourceObjects.enum
      },
      enum: _.map(dataSourceObjects, function(o) {
        return o.value;
      })
    });
    if (options.isOtcForm && mode === "read") {
      litSelect["options"]["fields"][fieldId].type = "input";
      litSelect["schema"]["properties"][fieldId].type = "input";
      litSelect["data"][fieldId] = litSelect["data"][fieldId]?.join(", ");
    }
    if (options.isOtcForm && litSelect.asynchronous !== true) {
      litSelect["options"]["fields"][fieldId]["optionLabels"] = otcFormDataSourceObjects.values;
      litSelect.schema.properties[fieldId]["enum"] = otcFormDataSourceObjects.enum;
    } else {
      litSelect["options"]["fields"][fieldId]["dataSource"] = function(callback) {
        callback(dataSourceObjects);
      };
    }
    if (!_.isUndefined(litSelect["options"]["fields"][fieldId]["_custom_validator"])) {
      litSelect["options"]["fields"][fieldId]["_custom_validator"]["regEx"] = false;
    }
    checkAndApplyOverrideValue(listMulti, litSelect, fieldId, options);
    return litSelect;
  }
  function convertComment(comment, mode, options, ancestorOptions) {
    var fieldId = comment.id || _.uniqueId("comment");
    comment.id = fieldId;
    comment.html_content = comment.html_content === undefined ? false : comment.html_content;
    var commentContainer = "span";
    if (comment.html_content === true) {
      commentContainer = "div";
    }
    var commentLabel = _.extend(fetchAlpacaControl(comment, mode, options, ancestorOptions));
    var label = comment.label || "";
    label = stripScripts(label);
    var styleAttrs = {};
    if (comment.font_bold === true) {
      styleAttrs["font-weight"] = "bold";
    }
    if (comment.font_italic === true) {
      styleAttrs["font-style"] = "italic";
    }
    if (comment.font_underline === true) {
      styleAttrs["text-decoration"] = "underline";
    }
    if (comment.font_color) {
      styleAttrs["color"] = comment.font_color;
    }
    if (comment.font_size) {
      styleAttrs["font-size"] = comment.font_size;
    }
    if (!_.isEmpty(styleAttrs)) {
      var font = "<" + commentContainer + ' style="';
      _.each(styleAttrs, function(val, key) {
        font = font + key + ":" + val + ";";
      });
      font = font + ' ">';
      label = font + label + "</" + commentContainer + ">";
    } else {
      label = "<" + commentContainer + ">" + label + "</" + commentContainer + ">";
    }
    _.extend(commentLabel["schema"]["properties"][fieldId], {
      readonly: true,
      title: ""
    });
    _.extend(commentLabel["options"]["fields"][fieldId], {
      label: comment.html_content === true ? "" : " ",
      type: "richtext",
      stretch: comment.html_content,
      enableHtmlEditor: false,
      disableExpand: true
    });
    commentLabel["data"][fieldId] = label;
    checkAndApplyOverrideValue(comment, commentLabel, fieldId, options);
    return commentLabel;
  }
  function convertHTMLEditor(html, mode, options, ancestorOptions) {
    var fieldId = html.id;
    var htmlEditor = _.extend(fetchAlpacaControl(html, mode, options && options.isMassUpdate ? _.extend({
      hideEnterNew: true
    }, options) : options, ancestorOptions));
    _.extend(htmlEditor["schema"]["properties"][fieldId], {
      maxLength: html.maxlength
    });
    _.extend(htmlEditor["options"]["fields"][fieldId], {
      type: "richtext",
      enableHtmlEditor: true,
      disableExpand: html.disable_expand
    });
    checkAndApplyOverrideValue(html, htmlEditor, fieldId, options);
    return htmlEditor;
  }
  function convertSingleList(combo, mode, options, ancestorOptions, isEditable) {
    var fieldId = combo.id;
    var selectedValue = null;
    var dataSourceObjects = [];
    var otcFormDataSourceObjects = {
      values: [],
      enum: [],
      selectedEnum: null
    };
    var comboSelect = _.extend(fetchAlpacaControl(combo, mode, options && options.isMassUpdate ? _.extend({
      showSelectValue: true
    }, options) : options, ancestorOptions));
    var values = combo.o;
    var fieldType = options.isOtcForm ? "select" : "d2combo";
    if (combo["field_content_type"]) {
      fieldType = getFieldTypeForContent(combo["field_content_type"], fieldType) || fieldType;
    }
    if (options && options.extendFieldOptions && _.isFunction(options.extendFieldOptions)) {
      options.extendFieldOptions.call(this, combo, comboSelect);
    }
    _.extend(comboSelect["options"]["fields"][fieldId], {
      type: fieldType,
      _d2type: fieldType,
      hideInitValidationError: true,
      useDataSourceAsEnum: true,
      removeDefaultNone: !!combo.removeDefaultNone || false,
      isEditable: isEditable ? true : false,
      autoLoad: combo.auto_load || -1,
      noClientFilter: combo.no_client_filter,
      queryDelay: combo.query_delay || 1e3,
      triggerAction: combo.trigger_action,
      dependencies: combo.dependencies,
      autoSelectIfSingle: combo.autoselect_single,
      placeholder: combo.placeholder,
      d2FormNodeIds: options && options.d2FormNodeIds
    });
    if (_.isObject(values)) {
      comboSelect["data"][fieldId] = !_.isUndefined(values.v) ? values.v : null;
    }
    if (combo.assistance_type && comboDataSourceMap[combo.assistance_type]) {
      comboSelect = comboDataSourceMap[combo.assistance_type](comboSelect, combo, options);
    }
    comboSelect.schema.properties[fieldId].format = combo.property_type;
    if (_.isArray(values) || _.isObject(values)) {
      if (!_.isArray(values)) {
        values = [ values ];
      }
      for (var i = 0; i < values.length; i++) {
        var item = values[i];
        if (item.s === true) {
          selectedValue = !_.isUndefined(item.v) ? item.v : item.value;
        }
        var text, value;
        if (item.value) {
          value = item.value;
          text = item.text !== undefined && item.text !== "" ? item.text : item.value;
        } else {
          value = item.v;
          text = item.l !== undefined && item.l !== "" ? item.l : item.v;
        }
        if (options.isOtcForm && combo.asynchronous !== true) {
          otcFormDataSourceObjects.values.push(value);
          otcFormDataSourceObjects.enum.push(i);
          if (item.s) otcFormDataSourceObjects.selectedEnum = i;
        } else {
          dataSourceObjects.push({
            value: value,
            text: text.toString(),
            category: item.c,
            selected: value.s
          });
        }
      }
      comboSelect["options"]["fields"][fieldId]["valueExistsInDB"] = selectedValue === null ? false : true;
      if (combo.autoselect_single === true && values.length === 1 && selectedValue === null) {
        selectedValue = values[0].v;
      }
      if (combo.autoselect_single === true && values.length === 0) {
        selectedValue = null;
      }
      comboSelect["data"][fieldId] = !_.isUndefined(selectedValue) ? selectedValue : null;
    }
    if (options.isOtcForm && combo.asynchronous !== true) {
      comboSelect["options"]["fields"][fieldId]["optionLabels"] = otcFormDataSourceObjects.values;
      comboSelect.schema.properties[fieldId]["enum"] = otcFormDataSourceObjects.enum;
      comboSelect.data[fieldId] = otcFormDataSourceObjects.selectedEnum;
    } else {
      comboSelect["options"]["fields"][fieldId]["dataSource"] = function(callback) {
        callback(dataSourceObjects);
      };
    }
    checkAndApplyOverrideValue(combo, comboSelect, fieldId, options);
    return comboSelect;
  }
  function convertPassword(password, mode, options, ancestorOptions) {
    var fieldId = password.id;
    var passwordField = _.extend(fetchAlpacaControl(password, mode, options, ancestorOptions));
    _.extend(passwordField["schema"]["properties"][fieldId], {
      maxLength: password.maxlength || MAX_LEN
    });
    _.extend(passwordField["options"]["fields"][fieldId], {
      type: options.isOtcForm ? "input" : "d2password",
      inputType: options.isOtcForm && "password"
    });
    checkAndApplyOverrideValue(password, passwordField, fieldId, options);
    return passwordField;
  }
  function convertRadioList(radio, mode, options, ancestorOptions) {
    var fieldId = radio.id, originalValues = radio.o && JSON.parse(JSON.stringify(radio.o)), radioSelect = _.extend(fetchAlpacaControl(radio, mode, options && options.isMassUpdate ? _.extend({
      hideEnterNew: true
    }, options) : options, ancestorOptions)), values = radio.o, lengthToCheck = 5;
    if (_.isObject(values) && !_.isArray(values)) {
      values = [ values ];
    }
    if (options && options.isMassUpdate) {
      var multiFileCountData = radioSelect["options"]["fields"][fieldId].multiFileCountData;
      if (multiFileCountData) {
        _.last(values).c = "multivalue";
        lengthToCheck++;
        _.each(multiFileCountData, function(valueData) {
          if (valueData.hasValue === false) {
            return;
          }
          var valuePresent = _.find(values, function(value) {
            return value.v === valueData.value;
          });
          if (!valuePresent) {
            values.push({
              v: valueData.value,
              l: valueData.label || valueData.value,
              c: valueData.category || "Error"
            });
          }
        });
      }
    }
    if (values !== undefined && (values.length > lengthToCheck || utils.isMobile())) {
      radio.o = originalValues;
      return convertSingleList(radio, mode, options, ancestorOptions);
    }
    var fieldType = options && options.isMassUpdate ? "d2massupdateradio" : "d2radio", selectedValue, dataSourceObjects = [];
    if (_.isArray(values) || _.isObject(values)) {
      for (var i = 0; i < values.length; i++) {
        var item = values[i];
        if (item.s === true) {
          selectedValue = item.v;
        }
        var text = item.l;
        if (!text) {
          if (FormatUtils.isDateType(radio.property_type)) {
            text = FormatUtils.convertToClientFormat(item.v);
          }
          if (!text) {
            text = item.v;
          }
        }
        dataSourceObjects.push({
          value: item.v,
          text: text.toString(),
          category: item.c
        });
      }
    }
    radioSelect["data"][fieldId] = !_.isUndefined(selectedValue) ? selectedValue : null;
    radioSelect["schema"]["properties"][fieldId].format = radio.property_type;
    _.extend(radioSelect["options"]["fields"][fieldId], {
      dataSource: function(callback) {
        callback(dataSourceObjects);
      },
      type: fieldType,
      _d2type: fieldType,
      enum: dataSourceObjects,
      hideInitValidationError: true,
      useDataSourceAsEnum: true,
      removeDefaultNone: true,
      vertical: radio.vertical
    });
    checkAndApplyOverrideValue(radio, radioSelect, fieldId, options);
    return radioSelect;
  }
  function convertCheckboxList(checkbox, mode, options, ancestorOptions) {
    var fieldId = checkbox.id, checkBoxDefinition = _.extend(fetchAlpacaControl(checkbox, mode, options && options.isMassUpdate ? _.extend({
      hideEnterNew: true
    }, options) : options, ancestorOptions)), values = checkbox.o && JSON.parse(JSON.stringify(checkbox.o)), lengthToCheck = 5;
    if (_.isObject(values) && !_.isArray(values)) {
      values = [ values ];
    }
    if (options && options.isMassUpdate) {
      var multiFileCountData = checkBoxDefinition["options"]["fields"][fieldId].multiFileCountData;
      if (multiFileCountData) {
        _.last(values).c = "multivalue";
        lengthToCheck++;
        _.each(multiFileCountData, function(valueData) {
          if (valueData.hasValue === false) {
            return;
          }
          var valuePresent = _.find(values, function(value) {
            return value.v === valueData.value;
          });
          if (!valuePresent) {
            values.push({
              v: valueData.value,
              l: valueData.label || valueData.value,
              c: valueData.category || "Error",
              s: true
            });
          } else {
            valuePresent.s = true;
          }
        });
      }
    }
    let convertToList = !checkbox.forceCheckboxList && values !== undefined && values.length > lengthToCheck;
    if (options.isOtcForm || convertToList) {
      return convertMultiList(checkbox, mode, options, ancestorOptions);
    }
    var fieldType = options && options.isMassUpdate ? "d2massupdatecheckbox" : "d2checkbox", selectedValues = [], dataSourceObjects = [];
    if (_.isArray(values) || _.isObject(values)) {
      for (var i = 0; i < values.length; i++) {
        var item = values[i];
        if (item.s === true) {
          selectedValues.push(item.v);
        }
        var text = item.l;
        if (!text) {
          if (FormatUtils.isDateType(checkbox.property_type)) {
            text = FormatUtils.convertToClientFormat(item.v);
          }
          if (!text) {
            text = item.v;
          }
        }
        dataSourceObjects.push({
          value: item.v,
          text: text.toString(),
          category: item.c
        });
      }
    }
    checkBoxDefinition["data"][fieldId] = selectedValues || null;
    _.extend(checkBoxDefinition["schema"]["properties"][fieldId], {
      type: "array",
      items: {
        type: checkbox.property_type ? checkbox.property_type : "string"
      },
      format: checkbox.property_type,
      enum: _.map(dataSourceObjects, function(o) {
        return o.value;
      })
    });
    _.extend(checkBoxDefinition["options"]["fields"][fieldId], {
      dataSource: function(callback) {
        callback(dataSourceObjects);
      },
      type: fieldType,
      _d2type: fieldType,
      singleSelect: checkbox.singleSelect,
      showOnHover: checkbox.showOnHover,
      hideInitValidationError: true,
      useDataSourceAsEnum: true,
      resetOnDisable: !!checkbox.resetOnDisable,
      removeDefaultNone: true
    });
    if (options.isOtcForm) {
      _.extend(checkBoxDefinition["options"]["fields"][fieldId], {
        fields: {
          item: "select"
        }
      });
    }
    if (!_.isUndefined(checkBoxDefinition["options"]["fields"][fieldId]["_custom_validator"])) {
      checkBoxDefinition["options"]["fields"][fieldId]["_custom_validator"]["regEx"] = false;
    }
    checkAndApplyOverrideValue(checkbox, checkBoxDefinition, fieldId, options);
    return checkBoxDefinition;
  }
  function convertEditableComboList(combo, mode, options, ancestorOptions) {
    return convertSingleList(combo, mode, options, ancestorOptions, true);
  }
  function convertFileUpload(text, mode, options, ancestorOptions) {
    var fieldId = text.id;
    var fileUpload = _.extend(fetchAlpacaControl(text, mode, options, ancestorOptions));
    _.extend(fileUpload["schema"]["properties"][fieldId], {
      maxLength: text.maxlength || MAX_LEN
    });
    _.extend(fileUpload["options"]["fields"][fieldId], {
      type: "d2fileupload"
    });
    return fileUpload;
  }
  function convertNodePicker(nodepicker, mode, options, ancestorOptions) {
    var fieldId = nodepicker.id;
    var nodePickerField = _.extend(fetchAlpacaControl(nodepicker, mode, options, ancestorOptions));
    if (options && options.extendFieldOptions && _.isFunction(options.extendFieldOptions)) {
      options.extendFieldOptions.call(this, nodepicker, nodePickerField);
    }
    _.extend(nodePickerField["options"]["fields"][fieldId], {
      type: "d2nodepicker",
      multiSelect: !!nodepicker.multiSelect,
      isFileOpenDialog: !!nodepicker.isFileOpenDialog,
      retriveFullPath: !!nodepicker.retriveFullPath,
      subTypeFilters: nodepicker.subTypeFilters,
      emptyPlaceHolder: nodepicker.emptyPlaceHolder,
      browseTooltip: nodepicker.browseTooltip,
      storeContainer: nodepicker.storeContainer,
      restoreContainer: nodepicker.restoreContainer
    });
    return nodePickerField;
  }
  function convertDocumentSelect(documentSelect, mode, options, ancestorOptions) {
    var fieldId = documentSelect.id, multiSelect = !!documentSelect["is_multiple"], fieldOptions = {
      type: "d2nodepicker",
      multiSelect: multiSelect
    };
    if (multiSelect) {
      if (documentSelect.o) {
        var selectedDocumentOptions = _.isArray(documentSelect.o) ? documentSelect.o : [ documentSelect.o ], selectedDocuments = _.map(selectedDocumentOptions, function(optionItem) {
          return new Backbone.Model({
            id: optionItem.v,
            name: optionItem.l
          });
        });
        if (selectedDocuments.length > 0) {
          documentSelect.value = selectedDocuments;
        }
      }
    } else {
      fieldOptions.objectId = documentSelect.objectId;
      fieldOptions.objectName = documentSelect.value;
    }
    var documentSelectField = _.extend(fetchAlpacaControl(documentSelect, mode, options, ancestorOptions));
    if (options && options.extendFieldOptions && _.isFunction(options.extendFieldOptions)) {
      options.extendFieldOptions.call(this, documentSelect, documentSelectField);
    }
    fieldOptions.storeContainer = true;
    fieldOptions.restoreContainer = true;
    _.extend(documentSelectField["options"]["fields"][fieldId], fieldOptions);
    return documentSelectField;
  }
  function convertSingleSelectTree(singleSelectTree, mode, options, ancestorOptions) {
    var fieldId = singleSelectTree.id, singleSelectTreeField = _.extend(fetchAlpacaControl(singleSelectTree, mode, options, ancestorOptions));
    _.extend(singleSelectTreeField["options"]["fields"][fieldId], {
      type: "d2singleselecttreefield",
      treeDataSource: singleSelectTree.treeDataSource,
      browseTooltip: singleSelectTree.browseTooltip,
      createAddChildForm: singleSelectTree.createAddChildForm
    });
    return singleSelectTreeField;
  }
  function checkAndApplyOverrideValue(d2field, alpacaField, fieldId, options) {
    if (options) {
      if (!options.initialFieldValueMap) {
        options.initialFieldValueMap = {};
      }
      if (!_.isUndefined(alpacaField["data"][fieldId])) {
        options.initialFieldValueMap[fieldId] = alpacaField["data"][fieldId];
      }
      if (options.isMassUpdate) {
        if (!options.initialFieldMultiValueMap) {
          options.initialFieldMultiValueMap = {};
        }
        if (alpacaField["multiFileData"][fieldId]) {
          options.initialFieldMultiValueMap[fieldId] = alpacaField["multiFileData"][fieldId];
        }
      }
      if (options.overrideIgnoreFields && _.contains(options.overrideIgnoreFields, fieldId)) {
        return;
      }
      var overrideData = getOverrideData(fieldId, options);
      if (overrideData.override) {
        if (overrideData.value) {
          if (FormatUtils.isDateType(d2field.property_type)) {
            var overrideDateFormat = options && options.overrideDateFormat;
            if (_.isArray(overrideData.value) && overrideData.value.length > 0) {
              var values = [];
              for (var index in overrideData.value) {
                if (Object.prototype.hasOwnProperty.call(overrideData.value, index)) {
                  var value = overrideData.value[index];
                  if (value && FormatUtils.isDateValue(value)) {
                    value = FormatUtils.convertToMomentUTC(value, overrideDateFormat).format(overrideDateFormat);
                  }
                  values.push(value);
                }
              }
              alpacaField["data"][fieldId] = values;
            } else {
              var dateValue = overrideData.value;
              if (FormatUtils.isDateValue(dateValue)) {
                dateValue = FormatUtils.convertToMomentUTC(dateValue, overrideDateFormat).format(overrideDateFormat);
              }
              alpacaField["data"][fieldId] = dateValue;
            }
          } else {
            alpacaField["data"][fieldId] = overrideData.value;
          }
          if (d2field.asynchronous && options.asyncFieldDefaultDataSourceObject && _.has(options.asyncFieldDefaultDataSourceObject, fieldId)) {
            var dataSourceObjects = options.asyncFieldDefaultDataSourceObject[fieldId];
            if (dataSourceObjects) {
              alpacaField["options"]["fields"][fieldId]["dataSource"] = function(callback) {
                callback(dataSourceObjects);
              };
            }
          }
        } else {
          alpacaField["data"][fieldId] = null;
        }
      }
    }
  }
  function getOverrideData(fieldId, options) {
    var overrideData = {
      override: false
    };
    if (options && options.overrideValues) {
      overrideData.override = true;
      if (_.has(options.overrideValues, fieldId) && options.overrideValues[fieldId]) {
        overrideData.value = options.overrideValues[fieldId];
      }
    }
    return overrideData;
  }
  var FieldConverter = {
    isField: function(type) {
      return _.has(fieldMap, type);
    },
    fetchAlpacaControl: function(field, mode, options, ancestorOptions) {
      return fetchAlpacaControl(field, mode, options, ancestorOptions);
    },
    convertField: function(type, field, mode, options, ancestorOptions) {
      if (this.isField(type) && _.isObject(field)) {
        var func = fieldMap[type];
        if (_.isFunction(func)) {
          func = _.bind(func, this);
          return func(field, mode, options, ancestorOptions);
        }
      }
    }
  };
  return FieldConverter;
});