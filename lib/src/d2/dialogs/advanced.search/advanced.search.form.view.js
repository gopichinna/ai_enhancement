/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/node/node.model", "csui/controls/form/pub.sub", "csui/models/form", "csui/utils/contexts/factories/connector", "d2/utils/documentation.utils", "d2/utils/constants", "d2/utils/advanced.search.utils", "d2/controls/form/d2.form.view", "d2/dialogs/advanced.search/impl/property.search.tree.visitor", "d2/dialogs/advanced.search/impl/property.search.error.listener", "d2/utils/antlr/scripts/property.search/PropertySearchLexer", "d2/utils/antlr/scripts/property.search/PropertySearchParser", "d2/utils/antlr/scripts/property.search/PropertySearchListener", "d2/widgets/metadata/utils/form.converter", "d2/dialogs/advanced.search/impl/add.search.category.view", "hbs!d2/dialogs/advanced.search/impl/advanced.search.form", "i18n!d2/dialogs/advanced.search/impl/nls/lang", "i18n!d2/utils/impl/nls/lang", "css!d2/dialogs/advanced.search/impl/advanced.search.form" ], function(i18n, _, $, Backbone, NodeModel, PubSub, FormModel, ConnectorFactory, DocumentationUtils, constants, AdvancedSearchUtils, D2FormView, PropertySearchTreeVisitor, PropertySearchErrorListener, PropertySearchLexer, PropertySearchParser, PropertySearchListener, MetadataConverter, AddSearchCategoryView, formTemplate, lang, utilsLang) {
  "use strict";
  var fixedSetOfColumns = [ {
    value: "score",
    text: lang.rankingLabel
  } ], hiddenFields = [ "save_hidden" ];
  return D2FormView.extend({
    className: function() {
      var classname = D2FormView.prototype.className.call(this);
      classname += " d2-advanced-search-form";
      if (this.options.formType === "display") {
        classname += " d2-advance-search-display";
      }
      return classname;
    },
    events: {
      focusout: "onFocusOut"
    },
    formTemplate: formTemplate,
    constructor: function AdvancedSearchFormView(options) {
      options || (options = {});
      options.originatingView ? options.originatingView.isErrorMode = function() {
        return false;
      } : options.originatingView = {
        isErrorMode: function() {
          return false;
        }
      };
      this.groupPanelView = options.groupPanelView;
      options.searchConfig = options.groupPanelView.options.searchConfig;
      options.savedSearchModel = options.groupPanelView.options.savedSearchModel && options.groupPanelView.options.savedSearchModel;
      options.isSavedSearchUpdatable = options.groupPanelView.options.isSavedSearchUpdatable;
      options.topAlignedLabel = true;
      this.propertyDisplayType = options.searchConfig["property_display_type"];
      var dialog = this._createDialogJson(options);
      this.rendered = false;
      var self = this;
      this.formmodel = MetadataConverter.convertConfig(dialog, {
        actionMode: "create",
        layoutMode: "singleCol",
        extendFieldOptions: function(field) {
          field.getDataSourceCallBack = function(attr, alpField) {
            var dfd = $.Deferred();
            var optionData;
            if (alpField.propertyId === "columns") {
              optionData = self.getColumns();
            } else if (alpField.propertyId === "default_order") {
              optionData = self.getColumnsForOrder();
            }
            return dfd.resolve(optionData).promise();
          };
        }
      });
      var form = _.extend({
        data: {},
        schema: {},
        options: {}
      }, this.formmodel.propertiesConfig[0]);
      options.model = new FormModel(form);
      options.mode = "create";
      D2FormView.prototype.constructor.call(this, options);
      this.listenTo(this, "valid:field", this._raiseValidChangeEvent);
      this.listenTo(this, "invalid:field", this._raiseInvalidChangeEvent);
      this.listenTo(this, "form:value:changed", this.formValueChanged.bind(this));
      this.listenTo(this.groupPanelView, "advanced:search:saved", this.onAdvancedSearchSaved.bind(this));
      this.popoverList = [];
      var me = this;
      this.groupPanelView.$el.on("scroll", _.debounce(function() {
        me.onFocusOut();
      }, 500));
    },
    onFocusOut: function() {
      _.each(this.popoverList, function(htmlHandle) {
        htmlHandle.binf_popover("hide");
      });
    },
    _getTypesField: function() {
      return this.groupPanelView.getContentViewByType("type").form.children[0].fieldView;
    },
    _createDialogJson: function(options) {
      var form = {}, formData = this._getFormDataForSavedSearch(options);
      if (formData) {
        options.formData = formData;
      }
      switch (options.formType) {
       case "save":
        form = this._getSaveDialogJson(options);
        break;

       case "type":
        form = this._getTypeDialogJson(options);
        break;

       case "search":
        form = this._getSearchDialogJson(options);
        break;

       case "display":
        form = this._getDisplayDialogJson(options);
        break;
      }
      return {
        dialog: {
          content: form
        }
      };
    },
    _getFormDataForSavedSearch: function(options) {
      var savedSearchModel = options.savedSearchModel;
      var savedSearchFormData = savedSearchModel && savedSearchModel.get("search-object-form-data");
      if (savedSearchModel) {
        var formData = {};
        if (savedSearchModel.get("name")) {
          formData["search_name"] = savedSearchModel.get("name");
        }
        formData["display_advanced_search_form"] = savedSearchModel.get("r_object_type") === "d2c_query_wizard" ? true : false;
        if (savedSearchFormData["link_id"] && savedSearchFormData["link_name"] && savedSearchFormData["link_path"]) {
          var linkPath = savedSearchFormData["link_path"], linkPathList = linkPath.split("/"), uiLinkPathList = linkPathList.slice(4, linkPathList.length);
          if (uiLinkPathList.length > 0) {
            var uiLinkedPath = "";
            if (savedSearchModel.get("search-category") === constants.AdvancedSearch.CATEGORY_PUBLIC) {
              uiLinkPathList.unshift(utilsLang.publicSearchLabel);
            } else if (savedSearchModel.get("search-category") === constants.AdvancedSearch.CATEGORY_PRIVATE) {
              uiLinkPathList.unshift(utilsLang.privateSearchLabel);
            }
            _.each(uiLinkPathList, function(pathItem) {
              uiLinkedPath = uiLinkedPath ? _.str.sformat(utilsLang.searchLocationPath, uiLinkedPath, pathItem) : pathItem;
            });
            formData["search_save"] = {
              link_id: savedSearchFormData["link_id"],
              link_name: savedSearchFormData["link_name"],
              link_path: uiLinkedPath,
              category: savedSearchModel.get("search-category")
            };
          }
        }
        if (savedSearchFormData["search_types"]) {
          formData["types"] = savedSearchFormData["search_types"];
        }
        if (savedSearchFormData.fulltext && savedSearchFormData.fulltext["fulltext_operator"]) {
          var operator = savedSearchFormData.fulltext["fulltext_operator"], fullTextOperationMapping = AdvancedSearchUtils.getFullTextOperationMapping();
          fullTextOperationMapping = _.invert(fullTextOperationMapping);
          formData["full_text_search_type"] = fullTextOperationMapping[operator];
        }
        if (savedSearchFormData.fulltext && savedSearchFormData.fulltext["fulltext_words"]) {
          formData["full_text_search_input"] = savedSearchFormData.fulltext["fulltext_words"];
        }
        if (savedSearchFormData["search_in_folders"]) {
          var searchInFolders = savedSearchFormData["search_in_folders"];
          if (searchInFolders["folder_path_ids"]) {
            formData["search_in"] = {
              path_ids: searchInFolders["folder_path_ids"],
              path_names: searchInFolders["folder_paths"]
            };
          }
          if (searchInFolders["folder_descend"]) {
            formData["include_sub_folders"] = searchInFolders["folder_descend"];
          }
        }
        if (savedSearchFormData["all_version"]) {
          formData["include_all_versions"] = savedSearchFormData["all_version"];
        }
        if (savedSearchFormData["case_sensitive"]) {
          formData["case_sensitive"] = savedSearchFormData["case_sensitive"];
        }
        if (savedSearchFormData["search_columns"]) {
          var searchColumns = savedSearchFormData["search_columns"];
          if (searchColumns["display_columns"]) {
            formData["columns"] = searchColumns["display_columns"];
          }
          if (searchColumns["order_by_column"]) {
            formData["default_order"] = searchColumns["order_by_column"];
          }
          if (searchColumns["order_by_direction"]) {
            formData["sort"] = searchColumns["order_by_direction"];
          }
        }
        if (savedSearchFormData["facets"]) {
          formData["facets"] = savedSearchFormData["facets"];
        }
        if (savedSearchFormData["expression-set"]) {
          formData["property_search"] = savedSearchFormData["expression-set"];
        }
        return formData;
      }
    },
    _getSaveDialogJson: function(options) {
      var searchCategory = options.savedSearchModel && options.savedSearchModel.get("search-category"), popupulateSaveInFields = options.isSavedSearchUpdatable && options && options.formData && options.formData["search_name"] !== "lastSearch" && searchCategory && (searchCategory === constants.AdvancedSearch.CATEGORY_PRIVATE || searchCategory === constants.AdvancedSearch.CATEGORY_PUBLIC && options.searchConfig.canCreatePublicSearch), searchName, saveInFieldValue, showWizardValue = !!(popupulateSaveInFields && options.formData && options.formData["display_advanced_search_form"]);
      if (popupulateSaveInFields && options && options.formData && options.formData["search_name"]) {
        searchName = options.formData["search_name"];
      }
      if (popupulateSaveInFields && options && options.formData && options.formData["search_save"]) {
        var saveInData = options.formData["search_save"];
        saveInFieldValue = AdvancedSearchUtils.createTreeNode({
          label: saveInData["link_name"],
          tooltip: saveInData["link_path"],
          r_object_id: saveInData["link_id"],
          "search-category": saveInData["category"]
        });
      } else {
        if (searchCategory && searchCategory === constants.AdvancedSearch.CATEGORY_PUBLIC && options.searchConfig.canCreatePublicSearch) {
          saveInFieldValue = AdvancedSearchUtils.getPublicSearchRootCategory();
        } else {
          saveInFieldValue = AdvancedSearchUtils.getPrivateSearchRootCategory();
        }
      }
      return {
        text: [ {
          order: 1,
          id: "search_name",
          label: lang.searchNameLabel,
          value: searchName,
          condition_validation: "(?! *lastSearch *$).*",
          validation_message: lang.errorTxt
        }, {
          order: 4,
          id: "save_hidden",
          label: "save_hidden",
          condition_visible: false,
          value: this.groupPanelView.previouslySavedSearch && this.groupPanelView.previouslySavedSearch.name ? "DISABLE_WIZARD" : ""
        } ],
        singleSelectTree: {
          order: 2,
          id: "search_save",
          label: lang.saveInLabel,
          value: saveInFieldValue,
          browseTooltip: lang.browseSearchLocationsTooltip,
          treeDataSource: function() {
            return AdvancedSearchUtils.getStructuredSearchLocation({
              connector: options.context.getObject(ConnectorFactory),
              searchConfig: options.searchConfig
            });
          },
          createAddChildForm: function(treeOptions) {
            var treeNodeData = treeOptions.treeNodeData, parentId = treeNodeData.node.parent.data.objectId, rootCategory = treeNodeData.node.parent.data.category || treeNodeData.node.parent.data.objectId;
            rootCategory = rootCategory.toUpperCase();
            var categoryType = rootCategory === constants.AdvancedSearch.CATEGORY_PUBLIC ? "public" : "private";
            if (parentId === constants.AdvancedSearch.CATEGORY_PUBLIC || parentId === constants.AdvancedSearch.CATEGORY_PRIVATE) {
              parentId = undefined;
            }
            return new AddSearchCategoryView({
              treeNodeData: treeNodeData,
              context: treeOptions.context,
              model: new Backbone.Model({
                type: 0
              }),
              category: rootCategory.toLowerCase(),
              categoryType: categoryType,
              parentId: parentId
            });
          }
        },
        "list-checkbox": {
          order: 3,
          id: "display_advanced_search_form",
          o: [ {
            v: "display_advanced_search_form",
            l: lang.displayAdvancedSearchBeforeLabel,
            s: showWizardValue
          } ],
          condition_enabled: "(getValue(save_hidden).notEquals('DISABLE_WIZARD'))"
        }
      };
    },
    _modifyModel: function() {
      D2FormView.prototype._modifyModel.call(this);
      if (this.options.formType === "type") {
        if (this.alpaca.options.fields["types"] && this.alpaca.options.fields["types"].type === "d2list" && _.size(this.options.types) === 1) {
          _.extend(this.alpaca.options.fields["types"], {
            readonly: true,
            mode: "readonly"
          });
          this.alpaca.schema.properties["types"].readonly = true;
        }
      }
    },
    _getTypeDialogJson: function(options) {
      return {
        list: {
          order: 1,
          rows: 5,
          condition_required: true,
          sorted: true,
          id: "types",
          label: lang.typesLabel,
          o: this.getOptionsforTypesField(options)
        }
      };
    },
    _getSearchDialogJson: function(options) {
      var searchOptions = options.searchOptions, preselectedNodes = this.getPreSelectedNodes(options), searchOption = searchOptions && searchOptions.searchOption, form = {
        combo: {
          order: 1,
          removeDefaultNone: true,
          condition_visible: options.is_full_text_search_enabled,
          id: "full_text_search_type",
          label: lang.fulltextSearchlabel,
          o: this.getFullTextSearchTypeOptions(options)
        },
        text: {
          order: 2,
          id: "full_text_search_input",
          condition_visible: options.is_full_text_search_enabled,
          value: options.formData && options.formData["full_text_search_input"] || searchOptions && searchOptions.searchTerm
        },
        memo: {
          order: 3,
          id: "property_search",
          label: lang.propertySearchLabel,
          field_content_type: "QUERY_BUILDER",
          rows: 1,
          isTextareaAutoHeight: true,
          ignoreMaxLength: true,
          placeholder: lang.propertySearchPlaceholder,
          value: this.buildPropertiesSearchExpression(options),
          queryBuilderOptions: {
            dependingFields: [ "types" ],
            showSuggestions: true,
            lexerClass: PropertySearchLexer,
            parserClass: PropertySearchParser,
            listenerClass: PropertySearchListener,
            visitorClass: PropertySearchTreeVisitor,
            errorListenerClass: PropertySearchErrorListener,
            tokenDefinitions: [ [ /^\s+/, null ], [ /^\(/, null ], [ /^\)/, null ], [ /^begins with/i, "OPERATOR" ], [ /^ends with/i, "OPERATOR" ], [ /^does not contain/i, "OPERATOR" ], [ /^is null/i, "OPERATOR" ], [ /^is not null/i, "OPERATOR" ], [ /^(["'])(\\\1|.)*?\1/, "QUOTE" ], [ /^(["']).*$/, "ENDITEM" ], [ /^[^\s()]+/, "EVERYTHING" ] ],
            startRule: "query",
            visitorOptions: {
              typesField: this._getTypesField.bind(this),
              typesToPropertiesMap: options.types_to_properties_map,
              typesToPropertiesLabelMap: options.types_to_properties_label_map,
              assistenceEnabledProperties: options.assistenceEnabledProperties,
              searchConfigs: options.search_configuration_properties,
              suggestionList: options.suggestionList,
              propertyDisplayType: this.propertyDisplayType,
              typesToAllPropertiesMap: options.types_to_all_properties_map,
              typesToAllPropertiesLabelMap: options.types_to_all_properties_label_map,
              parentInfoMap: options.parent_info_map
            }
          }
        },
        "node-picker": [ {
          order: 5,
          id: "search_in",
          label: lang.searchInLabel,
          multiSelect: true,
          retriveFullPath: true,
          emptyPlaceHolder: lang.selectFieldAnywhereLabel,
          browseTooltip: lang.browseMultiSelectLocationsTooltip,
          subTypeFilters: [ "dm_folder" ],
          value: preselectedNodes,
          storeContainer: options["search_in_storeContainer"],
          restoreContainer: options["search_in_restoreContainer"]
        } ],
        "list-checkbox": [ {
          order: 6,
          id: "include_sub_folders",
          o: [ {
            v: "include_sub_folders",
            l: lang.includeSubFoldersLabel,
            s: preselectedNodes && options.formData && options.formData["include_sub_folders"] || searchOption === "folder_and_subfolder"
          } ],
          condition_enabled: "(getValue(search_in).notEquals(''))",
          resetOnDisable: true
        }, {
          order: 7,
          id: "include_all_versions",
          o: [ {
            v: "include_all_versions",
            l: lang.includeAllVersionsLabel,
            s: options.formData && options.formData["include_all_versions"]
          } ]
        } ]
      };
      if (options.is_case_sensitive_option_visible) {
        form["list-checkbox"].push({
          order: 4,
          id: "case_sensitive",
          o: [ {
            v: "case_sensitive",
            l: lang.caseSensitiveLabel,
            s: options.formData && options.formData["case_sensitive"]
          } ]
        });
      }
      return form;
    },
    formValueChanged: function() {
      if (this.options.formType === "display") {
        this.setDefaultOrder();
        this.validateColumns();
      }
    },
    onChangeField: function(args) {
      var changeFieldName = args.name;
      if (this.options.formType === "save") {
        if (changeFieldName === "search_name") {
          this.handleDisplayWizardCheckbox();
        }
      }
      if (this.options.formType === "search" || this.options.formType === "type") {
        if (changeFieldName === "full_text_search_input" || changeFieldName === "types") {
          this.groupPanelView.trigger("group:form:value:changed", this);
        }
      }
      if (this.options.formType === "display") {
        this.onChangeFieldFormDisplay(args);
      }
      PubSub.trigger("d2:field:value:change", args);
    },
    onChangeFieldFormDisplay: function(args) {
      var me = this, allFormValues = this.form.getValue(), changeFieldName = args.name;
      if (allFormValues["order_direction"].length > 0) {
        this.orderDirectionFieldView.attr("title", lang.orderDirectionAscending);
      } else {
        this.orderDirectionFieldView.attr("title", lang.orderDirectionDescending);
      }
      if (changeFieldName === "default_order") {
        this.defaultOrderChangedByUser = true;
      }
      if (changeFieldName === "columns") {
        this.setDefaultOrder().done(function() {
          if (allFormValues["columns"].length === 0) {
            me.defaultOrderFieldViewInput && me.defaultOrderFieldViewInput.attr("placeholder", lang.defaultOptionLabel);
          }
        });
        if (allFormValues["columns"].length > 0) {
          this.columnsFieldViewInput && this.columnsFieldViewInput.attr("placeholder", this.columnsFieldPlaceholder);
        } else {
          this.columnsFieldViewInput && this.columnsFieldViewInput.attr("placeholder", lang.defaultOptionLabel);
        }
      }
      if (allFormValues["default_order"] === "") {
        this.defaultOrderFieldViewInput && this.defaultOrderFieldViewInput.attr("placeholder", lang.defaultOptionLabel);
      }
    },
    setDefaultOrder: function() {
      var me = this, dfd = $.Deferred();
      this.form.childrenByPropertyId["default_order"].pullData().done(function(response) {
        var collectionData = _.map(response, function(model) {
          return model.attributes;
        }), rankingColumn = fixedSetOfColumns[0]["value"], columnsFieldView = me.form.childrenByPropertyId["columns"].fieldView, defaultOrderFieldView = me.form.childrenByPropertyId["default_order"].fieldView, orderDirectionFieldView = me.form.childrenByPropertyId["order_direction"].fieldView, selectedColumns = columnsFieldView.getValue() || [], initialColumns = columnsFieldView.initialValue || [], addColumns = _.difference(selectedColumns, initialColumns), selectedDefaultOrderModel = defaultOrderFieldView.getValue(), selectedDefaultOrderColumn = selectedDefaultOrderModel && selectedDefaultOrderModel.get("id") || "", isColumnSetHasSortColumn = _.contains(selectedColumns, selectedDefaultOrderColumn), rankingModel = _.find(response, function(data) {
          return data.get("id") === rankingColumn;
        });
        defaultOrderFieldView.populateCollection(collectionData).done(function() {
          var sortColumnModel;
          if (!me.defaultOrderChangedByUser && _.contains(addColumns, rankingColumn)) {
            sortColumnModel = rankingModel;
          } else if (!isColumnSetHasSortColumn || !selectedDefaultOrderColumn) {
            sortColumnModel = response[0] || new Backbone.Model({
              id: "",
              name: ""
            });
          }
          orderDirectionFieldView.ui.writeField.attr("tabindex", 0);
          if (sortColumnModel && sortColumnModel.get("id") !== selectedDefaultOrderColumn) {
            defaultOrderFieldView.setValue(sortColumnModel, true, true);
            if (sortColumnModel.get("id") === rankingColumn || selectedDefaultOrderColumn === rankingColumn) {
              me.triggerMethod("change:field:default_order", _.extend({
                view: me
              }, defaultOrderFieldView._getValueChangeEventData()));
            }
          }
          dfd.resolve();
        });
      });
      return dfd.promise();
    },
    validateColumns: function() {
      var me = this;
      this.form.childrenByPropertyId["columns"].pullData().done(function(response) {
        var selectItems = me.form.childrenByPropertyId["columns"].fieldView.selectedCollection.clone();
        selectItems.each(function(model) {
          var foundValue = _.find(response, function(data) {
            return data.get("id") === model.get("id");
          });
          if (!foundValue) {
            me.form.childrenByPropertyId["columns"].fieldView.selectedCollection.remove(model);
          }
        });
        if (me.form.childrenByPropertyId["columns"].fieldView.selectedCollection.length === 0) {
          me.form.childrenByPropertyId["columns"].fieldView.selectionView.currentView.render();
        }
      }.bind(this));
    },
    _getDisplayDialogJson: function(options) {
      var selectedColumns = this.getSelectedForColumns(options), sortColumnOptions = this.getSelectedSortColumn(options, selectedColumns), sortOrderOptions = this.getSelectedSortOrder(options, sortColumnOptions), facetOptions = this.getFacetsOptions(options);
      return {
        list: [ {
          order: 1,
          rows: 5,
          id: "columns",
          assistance_type: "custom",
          asynchronous: true,
          label: lang.columnsLabel,
          o: selectedColumns
        }, {
          order: 4,
          rows: 5,
          id: "facets",
          condition_visible: options.is_facets_enabled && facetOptions.length > 0,
          label: lang.facetsLabel,
          o: facetOptions,
          retainOptionsOrder: true
        } ],
        "list-checkbox": [ {
          order: 3,
          id: "order_direction",
          o: sortOrderOptions,
          condition_enabled: "(getValue(default_order).notEquals('" + fixedSetOfColumns[0].value + "'))",
          condition_visible: "(getValue(columns).notEquals(''))",
          resetOnDisable: true
        } ],
        combo: {
          order: 2,
          id: "default_order",
          assistance_type: "custom",
          asynchronous: true,
          removeDefaultNone: true,
          label: lang.defaultOrderLabel,
          condition_enabled: "(getValue(columns).notEquals(''))",
          o: sortColumnOptions
        }
      };
    },
    onShow: function() {
      this.listenTo(this, "d2:change:formValidation", function() {
        this.validateForm(false, false).done(function(isValid) {
          this.validForm = isValid;
          this.refreshButtons();
        }.bind(this));
      }.bind(this));
      this.listenTo(this, "render:form", function() {
        this.rendered = true;
        this.form.hideInitValidationError = true;
        this.initialValue = this.getValues();
        this.form.refreshValidationState(true, function() {
          this.validateForm(false, false).done(function(isValid) {
            this.validForm = isValid;
            this.refreshButtons();
          }.bind(this));
        }.bind(this));
      }.bind(this));
      if (this.isRenderFinished()) {
        this.rendered = true;
        this.initialValue = this.getValues();
        this.validateForm(false, false).done(function(isValid) {
          this.validForm = isValid;
          this.refreshButtons();
        }.bind(this));
      }
    },
    refreshButtons: function() {
      this.options.groupPanelView.trigger("update:footer");
    },
    onRender: function() {
      var self = this;
      if (this.options.formType === "display") {
        var allFormValues = this.form.getValue();
        this.orderDirectionFieldView = $(this.form.childrenByPropertyId["order_direction"].fieldView.el).find(".d2-checkbox-container");
        if (allFormValues["order_direction"].length > 0) {
          this.orderDirectionFieldView.attr("title", lang.orderDirectionAscending);
        } else {
          this.orderDirectionFieldView.attr("title", lang.orderDirectionDescending);
        }
        this.columnsFieldViewInput = $(this.form.childrenByPropertyId.columns.fieldView.el).find(".d2-listfield-search > input");
        this.columnsFieldPlaceholder = this.columnsFieldViewInput.attr("placeholder");
        if (allFormValues["columns"].length > 0) {
          this.columnsFieldViewInput && this.columnsFieldViewInput.attr("placeholder", this.columnsFieldPlaceholder);
        } else {
          this.columnsFieldViewInput && this.columnsFieldViewInput.attr("placeholder", lang.defaultOptionLabel);
        }
        this.displayColumnsFieldView = $(this.form.childrenByPropertyId["columns"].fieldView.el);
        this.displayColumnsFieldView.find(".cs-field-write").css({
          width: "calc(100% - 28px)",
          float: this.getPopoverPlacement()
        });
        this.loadPropertiesInfoIcon({
          identifier: "columns",
          content: lang.displayColumnInfoLabel + ' <a id="displayColumnsInfoIcon" style="cursor:pointer">' + lang.displayColumnInfoLabelLink + "</a>",
          wrapperClass: this.displayColumnsFieldView,
          onPopOverEvents: function() {
            $("#displayColumnsInfoIcon").click(function() {
              self.openHelpDoc({
                helpTopic: "search"
              });
            });
          }
        });
        this.defaultOrderFieldViewInput = $(this.form.childrenByPropertyId["default_order"].fieldView.el).find(".cs-field-write-inner > input");
        if (allFormValues["default_order"] === "") {
          this.defaultOrderFieldViewInput && this.defaultOrderFieldViewInput.attr("placeholder", lang.defaultOptionLabel);
        }
        this.defaultOrderFieldViewInput.on("focusout", function() {
          setTimeout(function() {
            this.defaultOrderFieldViewInput && this.defaultOrderFieldViewInput.attr("placeholder", lang.defaultOptionLabel);
          }.bind(this), 0);
        }.bind(this));
      }
      if (this.options.formType === "search") {
        var propertySearchFieldView = this.form.childrenByPropertyId["property_search"].fieldView, clientHeight = propertySearchFieldView.ui.writeField[0].clientHeight, scrollHeight = propertySearchFieldView.ui.writeField[0].scrollHeight;
        if (scrollHeight > clientHeight) {
          propertySearchFieldView.ui.writeField.trigger("input");
        }
        this.propertySearchTextAreaFieldView = $(propertySearchFieldView.el).find(".cs-field-write-inner");
        this.loadPropertiesInfoIcon({
          identifier: "property_search",
          content: lang.propertySearchInfoLabel + ' <a id="propertySearchInfoIcon" style="cursor:pointer">' + lang.propertySearchInfoLabelLink + "</a>",
          wrapperClass: this.propertySearchTextAreaFieldView,
          onPopOverEvents: function() {
            $("#propertySearchInfoIcon").click(function() {
              self.openHelpDoc({
                helpTopic: "search"
              });
            });
          }
        });
      }
    },
    isValidForm: function() {
      if (this.rendered) {
        return this.validForm;
      }
      return false;
    },
    isUpdated: function() {
      if (this.initialValue) {
        var initialValue = _.omit(this.initialValue, hiddenFields), formValue = _.omit(this.getValues(), hiddenFields);
        return !_.isEqual(initialValue, formValue);
      }
      return false;
    },
    updateInitialValue: function() {
      this.initialValue = this.getValues();
    },
    getColumns: function() {
      var self = this, listOptions = [];
      var allFormValues = this.groupPanelView.getAllValues();
      if (allFormValues["types"] && allFormValues["types"].length > 0) {
        var commonPropertiesData = self.getCommonPropertiesForSuggestionList(allFormValues["types"], self.options);
        _.each(commonPropertiesData.commonProperties, function(property) {
          var value = property["property_name"], text = AdvancedSearchUtils.getDisplayLabelForProperty(property, self.propertyDisplayType);
          listOptions.push({
            value: value,
            text: text
          });
        });
        listOptions.sort((a, b) => {
          var textA = a.text.toLowerCase();
          var textB = b.text.toLowerCase();
          if (textA < textB) {
            return -1;
          }
          if (textA > textB) {
            return 1;
          }
          return 0;
        });
        if (self.options.is_full_text_search_enabled) {
          listOptions.push({
            value: fixedSetOfColumns[0].value,
            text: lang.rankingLabelWithInstruction
          });
        }
      }
      return listOptions;
    },
    getColumnsForOrder: function() {
      var self = this, listOptions = [], allFormValues = this.groupPanelView.getAllValues();
      if (allFormValues["types"] && allFormValues["types"].length > 0 && allFormValues["columns"] && allFormValues["columns"].length > 0) {
        var commonPropertiesData = self.getCommonPropertiesForSuggestionList(allFormValues["types"], self.options);
        _.each(allFormValues["columns"], function(column) {
          if (column === "score" && self.options.is_full_text_search_enabled) {
            listOptions.push({
              value: fixedSetOfColumns[0]["value"],
              text: fixedSetOfColumns[0]["text"]
            });
            return;
          }
          if (commonPropertiesData.commonProperties[column]) {
            var property = commonPropertiesData.commonProperties[column], value = property["property_name"], text = AdvancedSearchUtils.getDisplayLabelForProperty(property, self.propertyDisplayType);
            listOptions.push({
              value: value,
              text: text
            });
          }
        });
      }
      return listOptions;
    },
    getHierarchicalFacetProperties: function(searchConfig) {
      var self = this, rootFacetsPropertiesList = [];
      if (searchConfig.search_configuration_properties) {
        _.each(searchConfig.search_configuration_properties, function(configurationProperties) {
          if (configurationProperties && configurationProperties.searchProperties && configurationProperties.searchProperties.length > 0) {
            var facetsPropertiesList = _.filter(configurationProperties.searchProperties, function(property) {
              return property["is_facet"] === true;
            });
            if (facetsPropertiesList && facetsPropertiesList.length > 0) {
              facetsPropertiesList = _.sortBy(facetsPropertiesList, "facet_position");
              _.each(facetsPropertiesList, function(property, index) {
                if (property["facet_indent"] === 0) {
                  var getNextlevelFacet = function(parentProperty, position) {
                    var nextFacetProperty = facetsPropertiesList[position], facetLabel = AdvancedSearchUtils.getDisplayLabelForProperty(parentProperty, self.propertyDisplayType);
                    if (nextFacetProperty && nextFacetProperty["facet_indent"] !== 0) {
                      parentProperty.childFacetProperty = nextFacetProperty;
                      getNextlevelFacet(nextFacetProperty, position + 1);
                      parentProperty["hierarichical_label"] = _.str.sformat(utilsLang.searchLocationPath, facetLabel, nextFacetProperty["hierarichical_label"]);
                    } else {
                      parentProperty["hierarichical_label"] = facetLabel;
                    }
                  };
                  getNextlevelFacet(property, index + 1);
                  if (!_.findWhere(rootFacetsPropertiesList, {
                    property_name: property["property_name"]
                  })) {
                    rootFacetsPropertiesList.push(property);
                  }
                }
              });
            }
          }
        });
      }
      return rootFacetsPropertiesList;
    },
    buildPropertiesSearchExpression: function(options) {
      var propertySearchText, propertiesMap = {}, operatorMap, invertedServerOperatorMap;
      function parseExpressionSet(expression) {
        var currentExpressionString;
        if (expression["expression-type"] === "expression-set") {
          var childExpressions = expression["expressions"], childExpressionOperator = expression["operator"], childExpressionList = [];
          _.each(childExpressions, function(childExpression) {
            var expressionString = parseExpressionSet(childExpression);
            if (expressionString) {
              childExpressionList.push(expressionString);
            }
          });
          if (childExpressionList.length > 0) {
            var childExpStr = childExpressionList.join(" " + childExpressionOperator + " ");
            currentExpressionString = _.str.sformat(lang.childExpressionWrapper, childExpStr);
          }
        } else if (expression["expression-type"] === "property") {
          var propertyName = expression["name"], operator = expression["operator"], clientOperator = invertedServerOperatorMap[operator], clientOperatorLabel = operatorMap[clientOperator].label, propertyValue = expression["value"];
          if (propertiesMap[propertyName]) {
            var propertiesData = propertiesMap[propertyName], propertySchemaType = propertiesData["property_schema_type"], propertiesLabel = propertiesData.label;
            currentExpressionString = '"' + propertiesLabel + '" ' + clientOperatorLabel;
            propertyValue = propertyValue && propertyValue.trim();
            if (propertyValue) {
              switch (propertySchemaType) {
               case "datetime":
                propertyValue = AdvancedSearchUtils.convertClientSideDate(propertyValue);
                break;

               case "string":
                if (options.suggestionList && options.suggestionList[propertyName]) {
                  _.each(options.suggestionList[propertyName], function(item) {
                    if (item.value === propertyValue) {
                      propertyValue = item.name;
                    }
                  });
                }
                if (propertyValue.indexOf(" ") >= 0) {
                  propertyValue = '"' + propertyValue + '"';
                }
                break;
              }
              currentExpressionString = currentExpressionString + " " + propertyValue;
            }
          }
        }
        return currentExpressionString;
      }
      if (options.formData && options.formData["property_search"]) {
        var expressionSet = options.formData["property_search"];
        invertedServerOperatorMap = _.invert(AdvancedSearchUtils.getOperatorServerUiMap());
        operatorMap = AdvancedSearchUtils.getOperatorMap();
        _.each(options.searchConfig.types_to_properties_map, function(value) {
          propertiesMap = _.extend(propertiesMap, value);
        });
        propertySearchText = parseExpressionSet(expressionSet);
        if (propertySearchText) {
          propertySearchText = propertySearchText.substr(1, propertySearchText.length - 2).trim();
        }
      }
      return propertySearchText;
    },
    getPreSelectedNodes: function(options) {
      var selectedNodes, searchOptions = options.searchOptions, searchOption = searchOptions && searchOptions.searchOption;
      if (options.formData && options.formData.search_in && options.formData.search_in.path_ids) {
        var pathIds = options.formData.search_in.path_ids, pathNames = options.formData.search_in.path_names;
        selectedNodes = _.map(pathIds, function(ids, index) {
          var id = ids[ids.length - 1], objectPathNames = pathNames[index], nameList = objectPathNames.split("/"), name = nameList[nameList.length - 1];
          return new NodeModel({
            id: id,
            name: name,
            pathIds: ids,
            pathNames: objectPathNames
          }, {
            context: options.context,
            connector: options.context.getObject(ConnectorFactory)
          });
        });
      } else if ((searchOption === "folder" || searchOption === "folder_and_subfolder") && searchOptions.currentNode) {
        var currentNode = searchOptions.currentNode, selectedNode = new NodeModel({
          id: currentNode.get("id"),
          name: currentNode.get("name"),
          pathIds: currentNode.get("ancestors") && currentNode.get("ancestors").length > 0 ? "/" + currentNode.get("ancestors").reverse().join("/") : "/" + currentNode.get("id"),
          pathNames: currentNode.get("r_folder_path") ? currentNode.get("r_folder_path")[0] : "/" + currentNode.get("name")
        }, {
          context: options.context,
          connector: options.context.getObject(ConnectorFactory)
        });
        selectedNodes = [ selectedNode ];
      }
      return selectedNodes;
    },
    getFullTextSearchTypeOptions: function(options) {
      var fullTextSearchTypeOptions = [ {
        v: "contains_all_words",
        l: lang.allWordsLabel
      }, {
        v: "contains_any_words",
        l: lang.anyWordsLabel
      }, {
        v: "contains_exact_sentence",
        l: lang.exactSentenceLabel
      }, {
        v: "without_any_words",
        l: lang.noWordsLabel
      } ], selectedType = options.formData && options.formData["full_text_search_type"] || "contains_any_words", preSelectedType = _.find(fullTextSearchTypeOptions, function(item) {
        return item.v === selectedType;
      });
      preSelectedType.s = true;
      return fullTextSearchTypeOptions;
    },
    getOptionsforTypesField: function(options) {
      return _.map(options.types, function(type) {
        var isSelected = false;
        if (options.formData && options.formData["types"] && options.formData["types"].length > 0) {
          if (_.contains(options.formData["types"], type.name)) {
            isSelected = true;
          }
        } else if (type.default || _.size(options.types) === 1) {
          isSelected = true;
        }
        return {
          v: type.name,
          l: type.label || type.name,
          s: isSelected
        };
      });
    },
    handleDisplayWizardCheckbox: function() {
      var saveHiddenData = !this.groupPanelView.getPreviouslySavedSearch() || this.groupPanelView.isSaveAsModeEnabled() ? "" : "DISABLE_WIZARD", saveHiddenPath = this._keyPathMap["save_hidden"] && this._keyPathMap["save_hidden"].fieldPath, saveHiddenFieldControl = this.getAlpacaControlByPath(saveHiddenPath), displayWizardPath = this._keyPathMap["display_advanced_search_form"] && this._keyPathMap["display_advanced_search_form"].fieldPath, displayWizardFieldControl = this.getAlpacaControlByPath(displayWizardPath);
      if (saveHiddenFieldControl && saveHiddenFieldControl.fieldView) {
        saveHiddenFieldControl.fieldView.setValue(saveHiddenData, true);
      }
      if (this.groupPanelView.previouslySavedSearch && displayWizardFieldControl && displayWizardFieldControl.fieldView && saveHiddenData === "DISABLE_WIZARD") {
        var checkboxSelectionModel = displayWizardFieldControl.fieldView.collection.at(0), checkedValues = displayWizardFieldControl.fieldView.getValue();
        if (this.groupPanelView.previouslySavedSearch.type === "d2c_query_wizard" && !_.contains(checkedValues, "display_advanced_search_form")) {
          checkboxSelectionModel.set("checked", "checked='checked'");
          displayWizardFieldControl.fieldView.model.set("data", [ "display_advanced_search_form" ]);
          displayWizardFieldControl.fieldView.render();
        } else if (this.groupPanelView.previouslySavedSearch.type === "d2c_query" && _.contains(checkedValues, "display_advanced_search_form")) {
          checkboxSelectionModel.unset("checked");
          displayWizardFieldControl.fieldView.model.set("data", []);
          displayWizardFieldControl.fieldView.render();
        }
      }
    },
    onAdvancedSearchSaved: function() {
      if (this._keyPathMap["save_hidden"]) {
        var saveHiddenPath = this._keyPathMap["save_hidden"] && this._keyPathMap["save_hidden"].fieldPath, saveHiddenFieldControl = this.getAlpacaControlByPath(saveHiddenPath);
        saveHiddenFieldControl.fieldView.setValue("DISABLE_WIZARD", true);
      }
    },
    loadPropertiesInfoIcon: function(options) {
      options.wrapperClass.append('<div tabindex="0" id="' + options.identifier + '_icon_popover" class="info-icon"></div>');
      var popOptions = {
        content: options.content,
        identifier: options.identifier,
        htmlHandle: $("#" + options.identifier + "_icon_popover"),
        onPopOverEvents: options.onPopOverEvents
      };
      this.loadPopOverIcon(popOptions);
    },
    loadPopOverIcon: function(options) {
      var popoverOptions = {
        content: options.content,
        html: true,
        container: $.fn.binf_modal.getDefaultContainer(),
        template: '<div class="binf-popover d2-advanced-task-popover" role="tooltip"><div class="binf-arrow"></div><div class="binf-popover-content"></div></div>',
        placement: this.getPopoverPlacement()
      };
      options.htmlHandle.binf_popover(popoverOptions);
      this.popoverList.push(options.htmlHandle);
      if (options.onPopOverEvents) {
        options.htmlHandle.on("shown.binf.popover", options.onPopOverEvents);
      }
      $("#" + options.identifier + "_icon_popover").on("keydown", function() {
        options.htmlHandle.binf_popover("toggle");
      });
    },
    getPopoverPlacement: function() {
      if (i18n.settings.rtl) {
        return "right";
      } else {
        return "left";
      }
    },
    onBeforeDestroy: function() {
      _.each(this.popoverList, function(htmlHandle) {
        htmlHandle.binf_popover("destroy");
      });
    },
    openHelpDoc: function(options) {
      DocumentationUtils.getHelpUrl({
        moduleNamePattern: "^d2",
        helpTopic: options.helpTopic
      }).done(function(helpURL) {
        var browserTab = window.open(helpURL, "D2HELP");
        browserTab && browserTab.focus();
      }).fail(function() {});
    },
    getSelectedForColumns: function(options) {
      var self = this, selectedColumns = [];
      if (options.formData && options.formData["types"] && options.formData["columns"]) {
        var selectedTypes = options.formData["types"], commonPropertiesData = self.getCommonPropertiesForSuggestionList(selectedTypes, options.searchConfig);
        _.each(options.formData["columns"], function(column, index) {
          var optionLabel;
          if (column === "score" && options.searchConfig["is_full_text_search_enabled"] === true) {
            optionLabel = lang.rankingLabelWithInstruction;
          } else {
            var property = commonPropertiesData.commonProperties[column];
            if (property) {
              optionLabel = AdvancedSearchUtils.getDisplayLabelForProperty(property, self.propertyDisplayType);
            }
          }
          if (optionLabel) {
            selectedColumns.push({
              s: true,
              p: index,
              v: column,
              l: optionLabel
            });
          }
        });
      }
      return selectedColumns;
    },
    getSelectedSortColumn: function(options, selectedColumns) {
      var sortColumnOption;
      if (selectedColumns && selectedColumns.length > 0) {
        if (options.formData && options.formData["default_order"]) {
          var sortColumn = options.formData["default_order"][0];
          sortColumnOption = _.findWhere(selectedColumns, {
            v: sortColumn
          });
        }
        if (!sortColumnOption) {
          var scoreColumnOption = _.findWhere(selectedColumns, {
            v: "score"
          });
          if (scoreColumnOption) {
            sortColumnOption = scoreColumnOption;
          } else {
            sortColumnOption = selectedColumns[0];
          }
        }
        sortColumnOption = _.clone(sortColumnOption);
        if (sortColumn === "score") {
          sortColumnOption.l = fixedSetOfColumns[0].text;
        }
        sortColumnOption.s = true;
        delete sortColumnOption.p;
        return [ sortColumnOption ];
      }
      return [ {
        v: "",
        l: ""
      } ];
    },
    getSelectedSortOrder: function(options, sortColumn) {
      var sortOrderOption = {
        v: "asc",
        l: "",
        s: true
      };
      if (sortColumn && sortColumn[0] && sortColumn[0].v === "score" || options.formData && options.formData.sort && options.formData.sort[0] === "Desc") {
        sortOrderOption.s = false;
      }
      return [ sortOrderOption ];
    },
    getFacetsOptions: function(options) {
      var facetOptions = [], hierarichicalFacetProperties = this.getHierarchicalFacetProperties(options.searchConfig), selectedFacets = options.formData && options.formData["facets"];
      if (hierarichicalFacetProperties && hierarichicalFacetProperties.length > 0) {
        var selectedIndex = 0;
        _.each(hierarichicalFacetProperties, function(property) {
          var propertyName = property["property_name"], facetOption = {
            v: propertyName,
            l: property["hierarichical_label"]
          };
          if (selectedFacets && selectedFacets.length > 0) {
            if (_.contains(selectedFacets, propertyName)) {
              facetOption.s = true;
              facetOption.p = _.indexOf(selectedFacets, propertyName);
            }
          } else if (property["is_default_facet"] === true) {
            facetOption.s = true;
            facetOption.p = selectedIndex;
            selectedIndex++;
          }
          facetOptions.push(facetOption);
        });
      }
      return facetOptions;
    },
    getCommonPropertiesForSuggestionList: function(typeValues, options) {
      var opts = {
        parent_info_map: options.parent_info_map,
        types_to_properties_map: options.types_to_properties_map,
        types_to_properties_label_map: options.types_to_properties_label_map,
        types_to_all_properties_map: options.types_to_all_properties_map,
        types_to_all_properties_label_map: options.types_to_all_properties_label_map
      };
      return AdvancedSearchUtils.getCommonPropertiesForSuggestionList(typeValues, opts);
    }
  });
});