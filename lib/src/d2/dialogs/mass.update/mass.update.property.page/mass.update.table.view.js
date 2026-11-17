/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/lib/backbone", "nuc/models/nodes", "csui/controls/icon/icon.view", "csui/controls/table/inlineforms/base/inline.edit.view", "csui/controls/table/table.view", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/utils/commands", "d2/models/mass.update.field.values", "d2/utils/mass.update.utils", "i18n!d2/dialogs/mass.update/impl/nls/lang", "css!d2/dialogs/mass.update/mass.update.property.page/impl/mass.update.table" ], function($, _, Marionette, Backbone, NodeCollection, IconView, InlineEditView, TableView, TabableRegionBehavior, commands, MassUpdateFieldValueCollection, MassUpdateUtils, lang) {
  "use strict";
  var CustomInlineFormView = InlineEditView.extend({
    saveClicked: function(event) {
      event.stopPropagation();
      event.preventDefault();
      var fieldModel = this.baseInlineFormView && this.baseInlineFormView.collection.findWhere({
        fieldName: "name"
      }), inputName = fieldModel && fieldModel.get("value");
      delete this.model.inlineFormView;
      this.destroy();
      if (this.options.originatingView.fieldType === "d2combo") {
        this.model.collection.each(function(m) {
          m.set({
            csuiIsSelected: false,
            selectable: false
          }, {
            silent: true
          });
        });
        this.model.collection.trigger("d2:remove:field:value", _.rest(this.model.collection.models));
        this.options.originatingView.tableView.newRowhasAdded = true;
        this.options.originatingView.selectedNodes = [ this.model ];
        this.options.originatingView.updateRegion.$el.addClass("binf-hidden");
        this.options.originatingView.isUpdateFormValid = false;
        this.model.newNode = true;
      }
      var applyToAllFilesCmd = commands.get("D2-ApplyPropertyToAllFiles");
      applyToAllFilesCmd.execute({
        nodes: new NodeCollection([ this.model ])
      }, {
        silent: true,
        totalCount: this.model.collection.at(1).get("total_count")
      });
      this.model.previousFieldValueCount = 0;
      this.model.set({
        id: _.uniqueId("field_value"),
        name: inputName,
        value: inputName,
        csuiIsSelected: true,
        has_value: true,
        total_count: this.options.originatingView.control.options.massUpdateFileCount,
        objectIds: _.pluck(this.options.originatingView.control.options.massUpdateNodes, "r_object_id"),
        massUpdateNodes: this.options.originatingView.control.options.massUpdateNodes
      });
      delete this.model.isLocallyCreated;
      if (this.options.originatingView.fieldType === "d2combo") {
        this.options.originatingView.tableView._selectAllCheckboxRegion.currentView.setChecked(false);
        this.options.originatingView.tableView._selectAllCheckboxRegion.currentView.setDisabled(true);
      }
      this.options.originatingView.refreshButtons();
    }
  });
  return TableView.extend({
    className: function() {
      return TableView.prototype.className.call(this) + " d2-mass-update-table";
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior,
        initialActivationWeight: 100
      }
    },
    constructor: function MassUpdateTableView(options) {
      options = options || {};
      this.control = options.control;
      this.mode = options.mode || (this.control.schema.disabled || this.control.schema.readonly ? "view" : "update");
      this.fieldType = this.control.type;
      this.supportsReorder = this.mode !== "view" && this.fieldType === "d2list" && !(this.control.options && this.control.options.isSorted);
      if (this.mode === "view" || this.fieldType === "d2list") {
        options.selectRows = "none";
      }
      options.collection = options.collection || this._createCollection(options);
      options.orderBy = this.supportsReorder ? null : options.orderBy || "d2_field_value_count desc";
      options.columnsWithSearch = [ "name" ];
      options.columns = this._createColumns();
      options.tableColumns = new Backbone.Collection();
      options.allSelectedNodes = options.selectRows !== "none" ? new Backbone.Collection(options.collection.filter(function(model) {
        return _.find(options.control.preSelected, function(preSelectedNode) {
          return preSelectedNode.get("value") === model.get("value");
        });
      })) : new Backbone.Collection();
      TableView.prototype.constructor.apply(this, arguments);
      this.$el.prepend('<div class = "table-message-section"></div>');
      this.addMultiSelectModeToggle();
      this.collection.fetched = true;
      this.collection.setAllModels(this.collection.models);
      this.collection.fetch({
        reset: true
      });
      this.collection.orderBy = options.orderBy;
      this.listenTo(this.collection, "d2:undo:field:value", this.handleUndoFieldValue);
      this.listenTo(this.collection, "d2:remove:field:value", this.handleRemoveFieldValue);
      this.listenTo(this, "tableRowRendered", this.onTableRowRendered);
      this.listenTo(this.collection, "change:selectable", function(model, value) {
        if (value) {
          this.options.originatingView.refreshButtons();
        } else {
          this.options.originatingView.onUnselectTableRows({
            nodes: [ model ]
          });
        }
        var selection = this.collection.filter(function(model) {
          return model.get("csuiIsSelected");
        }), checkboxView = this._selectAllCheckboxRegion && this._selectAllCheckboxRegion.currentView;
        checkboxView && checkboxView.setChecked(selection.length > 0);
      });
    },
    _renderTable: function() {
      TableView.prototype._renderTable.apply(this, arguments);
      !this.multiSelectMode && this._allSelectedNodes && this._allSelectedNodes.length && this.options.originatingView.onSelectTableRows({
        nodes: this._allSelectedNodes.models
      });
      this._allSelectedNodes = new Backbone.Collection();
      this.applyReorder();
      this.showErrorLabel();
      this.table.on("draw", this.applyReorder.bind(this));
    },
    addMultiSelectModeToggle: function() {
      if (this.fieldType !== "d2list" || this.mode !== "update") {
        return;
      }
      this.$el.addClass("list-table");
      var multiSelectSwitch = $('<input type="checkbox" class="multi-select-switch"></input>');
      this.$el.find(".table-message-section").prepend(multiSelectSwitch);
      multiSelectSwitch.wrap($('<div class="multi-select-switch-area">' + lang.selectNewValues + "</div>"));
      multiSelectSwitch[0].checked = true;
      multiSelectSwitch.binfSwitch({
        state: true,
        size: "mini",
        onText: "&nbsp;",
        offText: "&nbsp;",
        labelText: "&nbsp;",
        disabled: false,
        readonly: false,
        isValidChange: function() {
          return true;
        },
        onSwitchChange: function(event) {
          if (this.multiSelectMode) {
            this._onClickBackMultiSelect();
          } else {
            this._onClickMultiSelect(event);
          }
        }.bind(this)
      });
    },
    applyReorder: function() {
      var sortableItems = this.$el.find("table tbody"), me = this, updateCollection = function(itemMoved, moveat) {
        me.collection.remove(itemMoved, {
          silent: true
        });
        me.collection.add(itemMoved, {
          at: moveat,
          silent: true
        });
        me.collection.allModels = me.collection.models;
        me.orderChanged = !_.isEqual(me.control.initialOrder, me.collection.pluck("value"));
        me.options.originatingView.refreshButtons();
        me._drawTable();
      }, onKeyDownSortList = function(event) {
        var position = me.table.row($(this)).index(), itemMoved = me.table.row(position).data(), moveat;
        if (event.shiftKey) {
          if (event.which === 38 && position !== 0) {
            $(this).insertBefore($(this).prev());
            moveat = position - 1;
          } else if (event.which === 40 && position !== me.collection.length - 1) {
            $(this).insertAfter($(this).next());
            moveat = position + 1;
          }
        }
        _.isNumber(moveat) && updateCollection(itemMoved, moveat);
      };
      this.removeWarningLabel();
      if (sortableItems.is(":ui-sortable")) {
        sortableItems.sortable("destroy");
        sortableItems.find("tr").off("keydown", onKeyDownSortList);
      }
      if (this.supportsReorder && !this.multiSelectMode && (_.isEmpty(this.collection.filters) || _.isEmpty(this.collection.filters.name))) {
        if (me.collection.length) {
          this.showWarningLabel();
          sortableItems.sortable({
            placeholder: "d2-table-sort-placeholder",
            opacity: .5,
            helper: "clone",
            cancel: ".ui-sortable-disabled",
            containment: "parent",
            start: function(event, ui) {
              ui.helper.addClass("dragged-item");
              ui.item.addClass("draggedoptions").show();
            },
            stop: function(event, ui) {
              ui.item.removeClass("draggedoptions");
              var position = me.table.row(ui.item).index();
              var itemMoved = me.table.row(position).data();
              updateCollection(itemMoved, ui.item.index());
            }
          });
          sortableItems.find("tr").on("keydown", onKeyDownSortList);
        }
      } else if (this.multiSelectMode && this.supportsReorder && (_.isEmpty(this.collection.filters) || _.isEmpty(this.collection.filters.name))) {
        this.showWarningLabel();
      }
    },
    showErrorLabel: function() {
      if (this.mode === "view" && !this.control.isValid()) {
        var invalidEntries = [];
        _.each(this.control.options.multiFileCountData, function(objectValue) {
          if (objectValue.count > 0 && _.isString(objectValue.category) && /Error/.test(objectValue.category)) {
            invalidEntries.push(objectValue.value);
          }
        });
        this.$el.addClass("error-table");
        this.$el.find(".table-message-section").prepend('<div class="validation-error">' + '<div class="error-icon"></div>' + '<div class="label">' + _.str.sformat(lang.validationErrorLabel, invalidEntries.length) + "</div>" + "</div>");
      }
    },
    showWarningLabel: function() {
      this.$el.addClass("reorder-table");
      this.$el.find(".table-message-section").prepend('<div class="reorder-warning">' + '<div class="info-icon"></div>' + '<div class="label">' + lang.reorderWarningLabel + "</div>" + "</div>");
    },
    removeWarningLabel: function() {
      this.$el.removeClass("reorder-table");
      this.$el.find(".reorder-warning").remove();
    },
    handleRemoveFieldValue: function(models) {
      var removeFromFilesCmd = commands.get("D2-RemovePropertyFromFiles");
      removeFromFilesCmd.execute({
        nodes: new NodeCollection(models)
      }, {
        silent: true
      });
    },
    handleUndoFieldValue: function(model) {
      if (model.newNode) {
        _.each(_.rest(model.collection.models), function(m) {
          this._performUndo(m, {
            silent: true
          });
        }.bind(this));
        this.newRowhasAdded = false;
        model.collection.remove(model.collection.at(0));
        this.options.originatingView.refreshButtons();
      } else {
        this._performUndo(model);
      }
    },
    _performUndo: function(model, options) {
      options = options || {};
      var previousCount = model.previousFieldValueCount, previousObjectIds = model.previousObjectIds;
      delete model.previousFieldValueCount;
      delete model.previousObjectIds;
      previousCount === 0 ? model.collection.remove(model) : model.set({
        d2_field_value_count: previousCount,
        selectable: true,
        objectIds: previousObjectIds
      }, {
        silent: options.silent
      });
    },
    _initializeLocalizableLabels: function() {
      TableView.prototype._initializeLocalizableLabels.apply(this, arguments);
      this.listenTo(this, "tableHeaderRendered", this.onTableHeaderRendered);
    },
    onTableHeaderRendered: function(options) {
      var $trEl = $(options.target), inlineHeader = $trEl.find("th.d2-inline-mass-update-actions > div");
      if (inlineHeader.length) {
        if (this.multiSelectMode || this.fieldType === "d2combo") {
          if (this.control.options.isEditable) {
            this.addIconView = new IconView({
              iconName: "csui_action_add32",
              states: !this.activeInlineForm && !this.newRowhasAdded
            });
            this.addIconView.render();
            inlineHeader.append(this.addIconView.el);
            if (this.activeInlineForm || this.newRowhasAdded || !_.isEmpty(this.collection.filters["name"])) {
              this.addIconView.$el.addClass("disabled");
            } else {
              this.addIconView.$el.attr("title", lang.addTooltip);
              this.addIconView.$el.on("click", function(event) {
                if (!this.addIconView.$el.hasClass("disabled")) {
                  this._onClickAddNewValue(event);
                }
              }.bind(this));
              this.addIconView.$el.parent().on("keydown", function(event) {
                if (!this.addIconView.$el.hasClass("disabled") && (event.keyCode === 13 || event.keyCode === 32)) {
                  this._onClickAddNewValue(event);
                }
              }.bind(this));
            }
          }
        }
      }
      if (this.multiSelectMode) {
        var selectColumn = $trEl.find("th:first-child");
        selectColumn.text("");
      }
    },
    onTableRowRendered: function(options) {
      if (options.node && options.node.get("has_value") === false) {
        $(options.target).addClass("d2-mass-update-no-value");
      }
      if (this.mode === "view" && options.node && options.node.get("is_error_value") === true) {
        $(options.target).addClass("d2-mass-update-error-value");
        if (options.target) {
          $(options.target).find(".csui-table-cell-name-justify-div").append('<div class="binf-help-block alpaca-message alpaca-message-custom" role="alert">' + lang.invalidValueMessage + "</div>");
        }
      }
    },
    _onClickAddNewValue: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.cancelAnyExistingInlineForm();
      var newNode = new Backbone.Model({});
      newNode.isLocallyCreated = true;
      newNode.inlineFormView = CustomInlineFormView;
      var oldOnRender = newNode.inlineFormView.prototype.onRender;
      newNode.inlineFormView.prototype.onRender = function() {
        this.options.node.attributes.form.fields.name.namePlaceholder = lang.addNewValuePlaceholder;
        oldOnRender.apply(this, arguments);
      };
      this.collection.add(newNode, {
        at: 0
      });
      this.collection.allModels.pop();
      this.collection.allModels.splice(0, 0, newNode);
    },
    _onClickMultiSelect: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (!_.isEmpty(this.collection.filters) && !_.isEmpty(this.collection.filters.name)) {
        this.$el.find(".csui-table-cell-name .csui-table-search-icon").trigger("click");
      }
      setTimeout(function() {
        this.multiSelectMode = true;
        this.options.selectRows = "multiple";
        this.options.selectAllColumnHeader = false;
        this.options.selectColumn = true;
        this._allSelectedNodes = new Backbone.Collection(this.collection.filter(function(model) {
          if (model.get("d2_field_value_count") !== 0) {
            return true;
          } else {
            model.set("csuiIsSelected", false, {
              silent: true
            });
            return false;
          }
        }));
        this.columns = this._createColumns();
        this._getColumns();
        var restValues = _.map(this.control.fieldView.collection.filter(function(model) {
          return !(this.collection.findWhere({
            value: model.get("id")
          }) || MassUpdateUtils.fieldHasMultipleValues(model.get("id")));
        }.bind(this)), function(value) {
          return {
            value: value.get("id"),
            label: value.get("name"),
            count: 0,
            objectIds: [],
            totalCount: this.control.options.massUpdateFileCount
          };
        }.bind(this));
        _.each(MassUpdateUtils.getCountDataModels(restValues, this.control.options), function(newModel) {
          this.collection.add(newModel, {
            silent: true
          });
          this.collection._modelAdded(newModel, this.collection);
        }.bind(this));
        _.isUndefined(this.collection.lastFilteredAndSortedModels) && (this.collection.lastFilteredAndSortedModels = this.collection.models);
        this.collection.fetch({
          silent: true
        }).always(function() {
          this.render();
        }.bind(this));
      }.bind(this));
    },
    _onClickBackMultiSelect: function() {
      if (!_.isEmpty(this.collection.filters) && !_.isEmpty(this.collection.filters.name)) {
        this.$el.find(".csui-table-cell-name .csui-table-search-icon").trigger("click");
      }
      setTimeout(function() {
        this.multiSelectMode = false;
        this.options.selectRows = "none";
        this.options.selectAllColumnHeader = false;
        this.options.selectColumn = false;
        this.columns = this._createColumns();
        this._getColumns();
        var removeModels = [];
        this.collection.each(function(model) {
          model && model.inlineFormView && removeModels.push(model);
          model && model.get("d2_field_value_count") === 0 && (_.isUndefined(model.previousFieldValueCount) || model.previousFieldValueCount === 0) && removeModels.push(model);
          model && model.set("csuiIsSelected", false, {
            silent: true
          });
        });
        _.each(removeModels, function(model) {
          this.collection.remove(model, {
            silent: true
          });
          this.collection._modelRemoved(model, this.collection);
        }.bind(this));
        this.render();
      }.bind(this));
    },
    _createColumns: function() {
      var columns = [];
      columns.push({
        column_key: "name",
        d2_sort_key: "name",
        default_action: false,
        definitions_order: 1,
        direction: "",
        filter: true,
        filter_key: "name",
        isNaming: true,
        key: "name",
        name: "Name",
        repeating: false,
        sort: !this.supportsReorder,
        title: this.control.options.label,
        type: -1,
        type_name: "String"
      });
      columns.push({
        column_key: "d2_field_value_count",
        definitions_order: 2,
        name: "Count",
        repeating: false,
        sort: !this.supportsReorder,
        title: lang.countTitle,
        type: -1,
        permanentColumn: true
      });
      if (this.mode === "update" && (!this.multiSelectMode || this.control.options.isEditable)) {
        columns.push({
          column_key: "d2_inline_mass_update_actions",
          definitions_order: 999,
          repeating: false,
          sort: false,
          type: -1,
          permanentColumn: true
        });
      }
      return new Backbone.Collection(columns);
    },
    _createCollection: function(options) {
      var multiFileCountData = this.mode === "update" ? this.control.options.errorMultiFileCountData || options.formModel.get("options").initialFieldMultiValueMap[this.control.propertyId] : this.control.options.multiFileCountData;
      multiFileCountData = JSON.parse(JSON.stringify(multiFileCountData));
      MassUpdateUtils.addNewValuesToAllFiles(multiFileCountData, this.control.preAddedNew, this.control.preAddedNewLabels, this.control.options);
      return new MassUpdateFieldValueCollection(MassUpdateUtils.getCountDataModels(multiFileCountData, _.extend({
        ignoreNoValue: this.fieldType === "d2list",
        preRemovedValues: this.control.preRemoved,
        preAddedValues: this.control.preAdded,
        selectRows: options.selectRows !== "none",
        preOrder: this.control.preOrder || this.control.options.initialOrder
      }, this.control.options)), {
        orderBy: options.orderBy,
        autoreset: true
      });
    },
    updateRow: function(model) {
      var changedKeys = _.keys(model.changedAttributes());
      if (changedKeys.length === 1 && changedKeys[0] === "d2_field_value_count" || changedKeys.length === 1 && changedKeys[0] === "objectIds" || changedKeys.length === 2 && _.contains(changedKeys, "d2_field_value_count") && _.contains(changedKeys, "objectIds")) {
        this.options.originatingView.refreshButtons();
        return;
      }
      TableView.prototype.updateRow.apply(this, arguments);
    },
    applyFilter: function(data) {
      if (this.control.fieldView.optionsView && _.isFunction(this.control.fieldView.optionsView.currentView.pullData) && this.multiSelectMode) {
        var previousValue = this.collection.filters && this.collection.filters[data.column];
        this.control.fieldView.optionsView.currentView.pullData({
          filter: data.keywords
        }).done(function() {
          var removeModels = [];
          _.each(this.collection.allModels, function(model) {
            model && model.inlineFormView && removeModels.push(model);
            model && model.get("d2_field_value_count") === 0 && (_.isUndefined(model.previousFieldValueCount) || model.previousFieldValueCount === 0) && removeModels.push(model);
            model && model.set("csuiIsSelected", false, {
              silent: true
            });
          });
          _.each(removeModels, function(model) {
            this.collection.remove(model, {
              silent: true
            });
            this.collection._modelRemoved(model, this.collection);
          }.bind(this));
          var restValues = _.map(this.control.fieldView.collection.filter(function(model) {
            return !(_.find(this.collection.allModels, function(collectionModel) {
              return collectionModel.get("value") === model.get("id");
            }) || MassUpdateUtils.fieldHasMultipleValues(model.get("id")));
          }.bind(this)), function(value) {
            return {
              value: value.get("id"),
              label: value.get("name"),
              count: 0,
              objectIds: [],
              totalCount: this.control.options.massUpdateFileCount
            };
          }.bind(this));
          _.each(MassUpdateUtils.getCountDataModels(restValues, this.control.options), function(newModel) {
            this.collection.add(newModel, {
              silent: true
            });
            this.collection._modelAdded(newModel, this.collection);
          }.bind(this));
          _.isUndefined(this.collection.lastFilteredAndSortedModels) && (this.collection.lastFilteredAndSortedModels = this.collection.models);
          this._allSelectedNodes = new Backbone.Collection(this.collection.allModels.filter(function(model) {
            if (model.get("d2_field_value_count") !== 0) {
              return true;
            } else {
              model.set("csuiIsSelected", false, {
                silent: true
              });
              return false;
            }
          }));
          this.collection.fetch({
            silent: true
          }).always(function() {
            this.collection.filters[data.column] = previousValue;
            TableView.prototype.applyFilter.call(this, data);
          }.bind(this));
        }.bind(this));
      } else {
        TableView.prototype.applyFilter.call(this, data);
      }
    },
    _handleModelsReset: function(collection) {
      TableView.prototype._handleModelsReset.apply(this, arguments);
      var hasNewNode = false, addIcon = this.$el.find("th.d2-inline-mass-update-actions .csui-icon-v2-view");
      if (this.fieldType === "d2combo") {
        hasNewNode = _.any(collection.models, function(model) {
          return model.newNode;
        });
      }
      if (collection.filters["name"] || this.fieldType === "d2combo" && hasNewNode) {
        this.addIconView && this.addIconView.model.set("states", false);
        addIcon.addClass("disabled");
      } else {
        this.addIconView && this.addIconView.model.set("states", true);
        addIcon.removeClass("disabled");
      }
      this.options.originatingView.refreshButtons();
    }
  });
});