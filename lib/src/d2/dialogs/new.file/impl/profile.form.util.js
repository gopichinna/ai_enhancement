/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "i18n!d2/dialogs/new.file/impl/nls/lang", "d2/widgets/metadata/utils/form.converter", "d2/models/mixins/expressions/expression" ], function(_, Backbone, lang, FormConverter, ExpressionModel) {
  "use strict";
  var DICT_BLUEPRINT = Object.freeze({
    properties: {
      text: lang.labelFormFieldBlueprintSelection_OptionProperties,
      value: "properties",
      modelAttribute: "inherit_properties"
    },
    content: {
      text: lang.labelFormFieldBlueprintSelection_OptionContent,
      value: "content",
      modelAttribute: "inherit_content"
    },
    virtual_doc: {
      text: lang.labelFormFieldBlueprintSelection_OptionVirtualDoc,
      value: "virtual_doc",
      modelAttribute: "inherit_vd_structure"
    }
  }), FORM_ID = Object.freeze({
    FOLDER_SELECTION_FORM: "folderSelectionForm",
    FOLDER_STRUCTURE_FORM: "folderStructureForm",
    PROFILE_NAME_FORM: "profileNameForm",
    VALUE_CONFIG_FORM: "valueConfigForm"
  }), getBlueprintSelectionDataSourceInitial = function(showContentInheritOption, showVDInheritOption) {
    var data = [ DICT_BLUEPRINT.properties ];
    if (showContentInheritOption) {
      data.push(DICT_BLUEPRINT.content);
    }
    if (showVDInheritOption) {
      data.push(DICT_BLUEPRINT.virtual_doc);
    }
    return function(cb) {
      cb(data);
    };
  }, getBlueprintSelectionDataSource = function(options) {
    var showContentInheritOption = false, showVDInheritOption = false, sourceContentNode = options.sourceContentNode;
    if (options.contentMode === "create" && sourceContentNode) {
      if (!sourceContentNode.get("container")) {
        showContentInheritOption = true;
      }
      if (sourceContentNode.get("rIsVirtualDoc") === true || sourceContentNode.get("r_is_virtual_doc") === 1) {
        showVDInheritOption = true;
      }
    }
    var data = [ DICT_BLUEPRINT.properties ];
    if (showContentInheritOption) {
      data.push(DICT_BLUEPRINT.content);
    }
    if (showVDInheritOption) {
      data.push(DICT_BLUEPRINT.virtual_doc);
    }
    return data;
  }, getBlueprintSelectionFieldValues = function(options) {
    var val = [], showContentInheritOption = false, showVDInheritOption = false, sourceContentNode = options.sourceContentNode;
    if (options.contentMode === "create" && sourceContentNode) {
      if (!sourceContentNode.get("container")) {
        showContentInheritOption = true;
      }
      if (sourceContentNode.get("rIsVirtualDoc") === true || sourceContentNode.get("r_is_virtual_doc") === 1) {
        showVDInheritOption = true;
      }
    }
    if (options.inherit_properties) {
      val.push(DICT_BLUEPRINT.properties.value);
    }
    if (options.inherit_content && showContentInheritOption) {
      val.push(DICT_BLUEPRINT.content.value);
    }
    if (options.inherit_content && showVDInheritOption) {
      val.push(DICT_BLUEPRINT.virtual_doc.value);
    }
    return val;
  }, dictionaryModelToComboOptionsMapper = function(models) {
    return _.unique(_.map(models, function(model) {
      return {
        text: model.get("column_label"),
        value: model.get("column_value")
      };
    }), false, function(option) {
      return option.value;
    });
  }, getFieldNameForDictionary = function(dictionaryModel) {
    var retVal = "dictionary_";
    if (dictionaryModel instanceof Backbone.Model) {
      var name = dictionaryModel.get("dictionary_name");
      if (name) {
        name = name.toLowerCase().replace(/\W/g, "_");
      }
      retVal += name || dictionaryModel.get("order");
    }
    return retVal;
  };
  return {
    getBluePrintDictionary: function() {
      return DICT_BLUEPRINT;
    },
    getFormIDs: function() {
      return FORM_ID;
    },
    getProfileNameFormSchema: function(hasCustomNameField, isEditMode) {
      var form = {
        id: FORM_ID.PROFILE_NAME_FORM,
        data: {
          profile: ""
        },
        schema: {
          id: FORM_ID.PROFILE_NAME_FORM,
          initial_invalid: true,
          properties: {
            profile: {
              title: lang.labelFormFieldCategory,
              type: "string",
              required: true
            }
          }
        },
        options: {
          fields: {
            profile: {
              label: lang.labelFormFieldCategory,
              type: "d2combo",
              dataSource: function(cb) {
                cb([ {
                  text: lang.labelSelect,
                  value: ""
                } ]);
              },
              removeDefaultNone: false,
              isEditable: false,
              hideInitValidationError: false,
              useDataSourceAsEnum: true,
              ignoreProgressiveLoad: true
            }
          }
        },
        expressions: {
          profile: {}
        }
      };
      if (hasCustomNameField) {
        form.data["custom_name"] = "";
        form.schema.properties["custom_name"] = {
          title: lang.labelFormFieldCustomName,
          type: "string"
        };
        form.options.fields["custom_name"] = {
          hideInitValidationError: false,
          label: lang.labelFormFieldCustomName,
          type: "text",
          placeholder: lang.placeholderFormFieldCustomName
        };
        form.expressions["custom_name"] = isEditMode ? {} : {
          setVisible: "(getValue(profile).notEquals(''))&&(getValue(profile).notEquals(null))"
        };
      }
      FormConverter.generateFormModelConfig([ form ]);
      return form;
    },
    getFolderStructureFormSchema: function() {
      var form = {
        id: FORM_ID.FOLDER_STRUCTURE_FORM,
        data: {
          folderStructure: ""
        },
        schema: {
          id: FORM_ID.FOLDER_STRUCTURE_FORM,
          initial_invalid: true,
          properties: {
            folderStructure: {
              title: lang.labelFormFolderStructureConfig,
              type: "string",
              required: true
            }
          }
        },
        options: {
          fields: {
            folderStructure: {
              label: lang.labelFormFolderStructureConfig,
              type: "d2combo",
              dataSource: function(cb) {
                cb([ {
                  text: lang.labelSelect,
                  value: ""
                } ]);
              },
              removeDefaultNone: false,
              isEditable: false,
              hideInitValidationError: false,
              useDataSourceAsEnum: true,
              ignoreProgressiveLoad: true
            }
          }
        },
        expressions: {
          folderStructure: {}
        }
      };
      FormConverter.generateFormModelConfig([ form ]);
      return form;
    },
    getFolderSelectionFormSchema: function(disabled) {
      var form = {
        id: FORM_ID.FOLDER_SELECTION_FORM,
        data: {
          folderSelection: ""
        },
        schema: {
          id: FORM_ID.FOLDER_SELECTION_FORM,
          initial_invalid: true,
          properties: {
            folderSelection: {
              title: lang.labelFormFolderSelectionName,
              type: "string",
              required: true,
              disabled: !!disabled
            }
          }
        },
        options: {
          fields: {
            folderSelection: {
              label: lang.labelFormFolderSelectionName,
              type: "d2fileupload",
              hideInitValidationError: false,
              directory: true
            }
          }
        },
        expressions: {
          folderSelection: {}
        }
      };
      FormConverter.generateFormModelConfig([ form ]);
      return form;
    },
    getValueConfigFormSchema: function(configCollection, sourceContentNode, contentMode) {
      var form = {
        id: FORM_ID.VALUE_CONFIG_FORM,
        data: {},
        schema: {
          id: FORM_ID.VALUE_CONFIG_FORM,
          initial_invalid: true,
          properties: {}
        },
        options: {
          fields: {
            dummy_field: {}
          }
        },
        expressions: {}
      }, profileModel = configCollection.profile, hideInheritance = profileModel.get("inheritanceHidden");
      if (!sourceContentNode && !profileModel.get("modifyInheritance")) {
        hideInheritance = true;
      }
      if (configCollection.length > 0) {
        delete form.options.fields["dummy_field"];
        var sampleDictionary = configCollection.at(0).dictionaries;
        if (sampleDictionary.length > 0) {
          var dictionaries = _.groupBy(_.sortBy(_.flatten(configCollection.map(function(configModel) {
            return configModel.dictionaries.models;
          })), function(dModel) {
            return dModel.get("column_label").toLowerCase();
          }), getFieldNameForDictionary);
          dictionaries.selectedCollections = [];
          var exprVis = "", exprReload = "", fieldBefore = null, singleDataBefore = null;
          sampleDictionary.each(function(dictModel) {
            var fieldName = getFieldNameForDictionary(dictModel), fieldTitle = dictModel.get("dictionary_label") || dictModel.get("dictionary_name"), fieldOptions = dictionaryModelToComboOptionsMapper(dictionaries[fieldName]);
            if (_.isEmpty(exprVis) && _.isEmpty(exprReload)) {
              dictionaries.rootFieldName = fieldName;
              form.expressions[fieldName] = null;
            } else {
              form.expressions[fieldName] = {
                setVisible: exprVis,
                doComboReload: exprReload
              };
            }
            form.data[fieldName] = fieldOptions.length === 1 ? fieldOptions[0].value : null;
            form.schema.properties[fieldName] = {
              title: fieldTitle,
              type: "string",
              required: true
            };
            form.options.fields[fieldName] = {
              label: fieldTitle,
              type: "d2combo",
              dataSource: function(fieldOptions) {
                return function(cb) {
                  cb(fieldOptions);
                };
              }(fieldOptions),
              removeDefaultNone: false,
              isEditable: false,
              hideInitValidationError: true,
              useDataSourceAsEnum: true,
              autoSelectIfSingle: true,
              ignoreProgressiveLoad: true
            };
            if (fieldBefore) {
              form.options.fields[fieldName]["ds"] = {
                async: false,
                url: "",
                attrBeforeChange: null !== singleDataBefore ? new ExpressionModel(singleDataBefore, {
                  options: {
                    _type: "d2combo"
                  }
                }) : null,
                assistance_type: "custom",
                getDataSource: function() {
                  return function(fieldBefore, dictionaries, options) {
                    var fieldBeforeValue = options && options.value;
                    if (fieldBeforeValue) {
                      var filteredBeforeFieldCollections = _.map(_.filter(dictionaries[fieldBefore], function(model) {
                        return model.get("column_value") === fieldBeforeValue;
                      }), function(model) {
                        return model.collection.cid;
                      });
                      if (dictionaries.rootFieldName === fieldBefore) {
                        dictionaries.selectedCollections = filteredBeforeFieldCollections;
                      } else {
                        dictionaries.selectedCollections = _.intersection(dictionaries.selectedCollections, filteredBeforeFieldCollections);
                      }
                      var selectedOwnModels = _.filter(dictionaries[this], function(model) {
                        return _.any(dictionaries.selectedCollections, function(cid) {
                          return cid === model.collection.cid;
                        });
                      });
                      return dictionaryModelToComboOptionsMapper(selectedOwnModels);
                    }
                    return dictionaryModelToComboOptionsMapper(dictionaries[this]);
                  }.bind(fieldName, fieldBefore, dictionaries);
                }()
              };
            }
            exprVis = "(getValue(" + fieldName + ").notEquals(''))&&(getValue(" + fieldName + ").notEquals(null))";
            exprReload = "(getValue(" + fieldName + "))";
            singleDataBefore = fieldOptions.length === 1 ? fieldOptions[0].value : null;
            fieldBefore = fieldName;
          });
          if (!hideInheritance) {
            if (!_.isEmpty(exprVis)) {
              form.expressions["source_content"] = {
                setVisible: exprVis
              };
              form.expressions["blueprint_selection"] = {
                setVisible: exprVis + "&&(getValue(source_content).notEquals(''))&&(getValue(source_content).notEquals(null))"
              };
            }
          }
        }
        var showContentInheritOption = contentMode !== "import" && sourceContentNode && !sourceContentNode.get("container"), showVDInheritOption = contentMode !== "import" && sourceContentNode && _.isFunction(sourceContentNode.isVirtualDoc) && sourceContentNode.isVirtualDoc(), expression = "(getValue(source_content))";
        if (!hideInheritance) {
          form.data["source_content"] = sourceContentNode && sourceContentNode.get("id") || "";
          form.schema.properties["source_content"] = {
            title: lang.labelFormFieldSourceContentBrowse,
            type: "string",
            required: false,
            disabled: profileModel.get("modifyInheritance") === false
          };
          form.options.fields["source_content"] = {
            hideInitValidationError: false,
            label: lang.labelFormFieldSourceContentBrowse,
            placeholder: lang.placeholderFormFieldSourceContentBrowse,
            type: "d2nodepicker",
            storeContainer: true,
            restoreContainer: true
          };
          form.data["blueprint_selection"] = [];
          if (profileModel.get("inherit_properties") === true) {
            form.data["blueprint_selection"].push(DICT_BLUEPRINT.properties.value);
          }
          if (profileModel.get("inherit_content") === true && showContentInheritOption) {
            form.data["blueprint_selection"].push(DICT_BLUEPRINT.content.value);
          }
          if (profileModel.get("inherit_vd_structure") === true && showVDInheritOption) {
            form.data["blueprint_selection"].push(DICT_BLUEPRINT.virtual_doc.value);
          }
          form.schema.properties["blueprint_selection"] = {
            title: lang.labelFromFieldBlueprintSelection,
            type: "array",
            items: {
              type: "string"
            },
            required: false
          };
        }
        var options = {
          inherit_properties: profileModel.get("inherit_properties") || false,
          inherit_content: contentMode !== "import" ? profileModel.get("inherit_content") : false,
          inherit_vd_structure: contentMode !== "import" ? profileModel.get("inherit_vd_structure") : false,
          contentMode: contentMode
        };
        form.options.fields["blueprint_selection"] = {
          hideInitValidationError: true,
          label: lang.labelFromFieldBlueprintSelection,
          type: "d2checkbox",
          dataSource: getBlueprintSelectionDataSourceInitial(showContentInheritOption, showVDInheritOption),
          useDataSourceAsEnum: true,
          getDataSource: getBlueprintSelectionDataSource,
          getData: getBlueprintSelectionFieldValues
        };
        _.extend(form.options.fields["blueprint_selection"], options);
        if (expression) {
          _.extend(form.expressions["blueprint_selection"], {
            doFieldReinitialization: expression
          });
        }
      }
      FormConverter.generateFormModelConfig([ form ]);
      return form;
    },
    getFieldNameForDictionary: getFieldNameForDictionary
  };
});