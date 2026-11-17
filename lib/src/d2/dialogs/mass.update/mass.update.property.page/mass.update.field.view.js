/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/nodes", "nuc/utils/types/date", "csui/models/form", "csui/utils/commands", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/form/d2.form.view", "d2/dialogs/mass.update/mass.update.property.page/mass.update.summary.view", "d2/dialogs/mass.update/mass.update.property.page/mass.update.table.view", "d2/models/mass.update.field.values", "d2/widgets/metadata/utils/form.converter", "d2/utils/mass.update.utils", "d2/utils/types/inputdate", "hbs!d2/dialogs/mass.update/mass.update.property.page/impl/mass.update.field", "i18n!d2/dialogs/mass.update/impl/nls/lang", "css!d2/dialogs/mass.update/mass.update.property.page/impl/mass.update.field" ], function($, _, Backbone, Marionette, NodeCollection, date, FormModel, commands, WizardTabableRegionBehavior, D2FormView, MassUpdateSummaryView, MassUpdateTableView, MassUpdateFieldValueCollection, MetadataConverter, MassUpdateUtils, inputDate, template, lang) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-mass-update-field",
    template: template,
    regions: {
      tableRegion: ".d2-mass-update-table-wrapper",
      updateRegion: ".d2-mass-update-update-form-wrapper",
      summaryRegion: ".d2-mass-update-summary-wrapper"
    },
    constructor: function MassUpdateFieldView(options) {
      options = options || {};
      this.control = options.control;
      this.fieldType = this.control.type;
      if (this.control.schema.disabled || this.control.schema.readonly || this.control.type === "d2combo" && this.control.options.ds && this.control.options.ds.assistance_type === "taxonomy") {
        options.mode = "view";
      }
      this.setupTableView(options);
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.tableView, "tableRowSelected", this.onSelectTableRows);
      this.listenTo(this.tableView, "tableRowUnselected", this.onUnselectTableRows);
    },
    setupTableView: function(options) {
      this.tableView = new MassUpdateTableView(_.defaults({
        originatingView: this
      }, options));
    },
    setupSummaryView: function(options) {
      this.summaryView = new MassUpdateSummaryView(_.defaults({
        originatingView: this
      }, options));
    },
    onRender: function() {
      this.showTableView();
      this.summaryRegion.$el = this.$el.find(this.summaryRegion.el);
      this.summaryRegion.$el.addClass("binf-hidden");
    },
    showTableView: function() {
      this.tableView && this.tableRegion.show(this.tableView);
    },
    showSummaryView: function() {
      this.summaryView && this.summaryRegion.show(this.summaryView);
    },
    setupUpdateFormView: function() {
      var pageContent = this.options.pageContent, fieldSchema = this._findFieldSchema(pageContent.dialog.content, this.control);
      if (fieldSchema.type === "combo-editable") {
        fieldSchema["combo"] = fieldSchema[fieldSchema.type];
        delete fieldSchema[fieldSchema.type];
        fieldSchema.type = "combo";
      }
      fieldSchema[fieldSchema.type] = _.omit(fieldSchema[fieldSchema.type], function(prop, key) {
        return key.startsWith("condition_") || key.startsWith("advancedView_");
      });
      fieldSchema[fieldSchema.type]["condition_required"] = true;
      fieldSchema[fieldSchema.type]["label"] = lang.updateFormFieldLabel;
      if (fieldSchema[fieldSchema.type].o) {
        if (_.isObject(fieldSchema[fieldSchema.type].o) && !_.isArray(fieldSchema[fieldSchema.type].o)) {
          if (!_.isEmpty(this.control.replaceWithValue)) {
            fieldSchema[fieldSchema.type].o.v = this.control.replaceWithValue;
            fieldSchema[fieldSchema.type].o.l = this.control.replaceWithLabel || this.control.replaceWithValue;
          }
          fieldSchema[fieldSchema.type].o.s = !_.isEmpty(this.control.replaceWithValue);
        } else {
          fieldSchema[fieldSchema.type].o = _.filter(fieldSchema[fieldSchema.type].o, function(value) {
            return !MassUpdateUtils.fieldHasMultipleValues(value.v);
          });
          _.each(fieldSchema[fieldSchema.type].o, function(value) {
            value.s && (value.s = false);
            value.v === this.control.replaceWithValue && (value.s = true);
          }.bind(this));
        }
      } else if (fieldSchema[fieldSchema.type].value) {
        fieldSchema[fieldSchema.type].value = this.control.replaceWithValue || "";
      }
      delete fieldSchema.type;
      this.updateFormView = new D2FormView({
        model: new FormModel(MetadataConverter.convertConfig({
          dialog: {
            content: fieldSchema
          }
        }, {
          actionMode: "create",
          layoutMode: "singleCol"
        }).propertiesConfig[0]),
        topAlignedLabel: true,
        originatingView: this.options.originatingView || new (Marionette.View.extend({
          isErrorMode: function() {
            return false;
          }
        }))(),
        mode: "create",
        context: this.options.context
      });
      this.updateFormView._behaviors.push(new WizardTabableRegionBehavior({
        initialActivationWeight: 100
      }, this.updateFormView));
      _.last(this.updateFormView._behaviors).$el = this.updateFormView.$el;
      this.updateFormView.listenTo(this.updateFormView, "valid:field", this.updateFormView._raiseValidChangeEvent);
      this.updateFormView.listenTo(this.updateFormView, "invalid:field", this.updateFormView._raiseInvalidChangeEvent);
      this.listenTo(this.updateFormView, "d2:change:formValidation", function(options) {
        this.isUpdateFormValid = options && options.status;
        this.refreshButtons();
      }.bind(this));
      this.listenTo(this.updateFormView, "render:form", function() {
        this.updateFormRendered = true;
        this.updateFormView.validateForm(false, true).done(function(isValid) {
          this.isUpdateFormValid = isValid;
          this.refreshButtons();
        }.bind(this));
      }.bind(this));
    },
    onSelectTableRows: function(options) {
      this.tableView.cancelAnyExistingInlineForm.call(this.tableView);
      if (this.tableView.multiSelectMode) {
        if (!this.tableView._startTableRendering) {
          var applyToAllFilesCmd = commands.get("D2-ApplyPropertyToAllFiles");
          _.each(options.nodes, function(node) {
            applyToAllFilesCmd.execute({
              nodes: new NodeCollection([ node ])
            });
          });
          this.refreshButtons();
        }
      } else {
        this.selectedNodes = this.selectedNodes || [];
        _.each(options.nodes, function(node) {
          !_.contains(this.selectedNodes, node) && this.selectedNodes.push(node);
        }.bind(this));
        if (!this.updateFormView) {
          this.setupUpdateFormView();
          this.updateRegion.show(this.updateFormView);
        } else {
          this.updateRegion.$el.removeClass("binf-hidden");
        }
      }
      this.refreshButtons();
    },
    onUnselectTableRows: function(options) {
      this.tableView.cancelAnyExistingInlineForm.call(this.tableView);
      if (this.tableView.multiSelectMode) {
        if (!this.tableView._startTableRendering) {
          var removeFromFilesCmd = commands.get("D2-RemovePropertyFromFiles");
          removeFromFilesCmd.execute({
            nodes: new NodeCollection(options.nodes)
          }, {
            ignoreSelectionUpdate: true
          });
        }
        this.refreshButtons();
      } else {
        this.selectedNodes = _.without.apply(_, [ this.selectedNodes ].concat(options.nodes));
        if (!this.selectedNodes.length) {
          this.updateRegion.$el.addClass("binf-hidden");
        }
      }
      this.refreshButtons();
    },
    _findFieldSchema: function(content, control) {
      if (content && content.id === control.propertyId) {
        return content;
      } else if (_.isObject(content) || _.isArray(content)) {
        var matchField = null;
        _.find(content, function(field, key) {
          matchField = this._findFieldSchema(field, control);
          if (matchField && !matchField.type && _.isString(key)) {
            var object = {};
            object[key] = matchField;
            matchField = JSON.parse(JSON.stringify(object));
            matchField.type = key;
          }
          return matchField;
        }.bind(this));
        return matchField;
      }
      return false;
    },
    replaceValues: function() {
      var selectedNodes = this.selectedNodes;
      this.updateFieldValue = null;
      if (selectedNodes && selectedNodes.length && this.updateFormView && this.updateFormRendered && this.isUpdateFormValid) {
        var value = this.control.type === "d2combo" ? this.updateFormView.form.children[0].fieldView.getValue().get("id") : this.updateFormView.getValues()[this.control.propertyId], allNodesSelected = selectedNodes && selectedNodes.length === Object.keys(this.control.options.multiFileCountData).length, unSelectedNodes = _.filter(this.tableView.collection.allModels, function(model) {
          return !_.contains(selectedNodes, model);
        });
        value = this.control.type === "datetime" ? date.serializeDateTime(inputDate.formatExactDateTimeInput(date.deserializeDate(value)), inputDate.exactDateTimeInputFormat) : this.control.type === "date" ? date.serializeDate(inputDate.formatExactDateInput(date.deserializeDate(value)), inputDate.exactDateInputFormat) : value;
        var label = this.control.type === "d2combo" ? this.updateFormView.form.children[0].fieldView.getValue().get("name") : this.control.type === "datetime" ? date.formatExactDateTime(date.deserializeDate(value)) : this.control.type === "date" ? date.formatExactDate(date.deserializeDate(value)) : value;
        if (allNodesSelected || unSelectedNodes.length === 1 && unSelectedNodes[0].get("value") === value && unSelectedNodes[0].get("d2_field_value_count") !== 0) {
          this.updateFieldValue = this.control.type === "d2combo" ? this.updateFormView.form.children[0].fieldView.getValue() : this.control.type === "datetime" ? inputDate.formatExactDateTimeInput(date.deserializeDate(value)) : this.control.type === "date" ? inputDate.formatExactDateInput(date.deserializeDate(value)) : value;
        } else {
          _.each(selectedNodes, function(node) {
            var singleCountData = _.find(this.control.options.multiFileCountData, function(countData) {
              return countData.value === node.get("value");
            });
            if (singleCountData.value === value && singleCountData.hasValue !== false) {
              selectedNodes = _.without(selectedNodes, node);
            } else {
              singleCountData.value = value;
              singleCountData.label = label || value;
              singleCountData.hasValue === false && (singleCountData.hasValue = true);
              node.get("has_value") === false && node.set("has_value", true, {
                silent: true
              });
            }
          }.bind(this));
          if (selectedNodes.length) {
            this.control.preSelected = selectedNodes;
            this.control.replaceWithValue = value;
            this.control.replaceWithLabel = label || value;
          }
        }
      } else {
        delete this.control.preSelected;
        delete this.control.replaceWithValue;
        delete this.control.replaceWithLabel;
      }
    },
    updateValues: function() {
      var removedValues = [], addedValues = [], excludeNoValue = this.tableView.collection.allModels.filter(function(model) {
        return model.get("has_value") !== false && !(model.get("d2_field_value_count") === 0 && (_.isUndefined(model.previousFieldValueCount) || model.previousFieldValueCount === 0));
      });
      _.each(this.tableView.collection.allModels, function(model) {
        if (!_.isUndefined(model.previousFieldValueCount) && model.get("has_value") && model.previousFieldValueCount !== model.get("d2_field_value_count")) {
          model.get("d2_field_value_count") === 0 && removedValues.push(model);
          model.get("d2_field_value_count") === model.get("total_count") && addedValues.push(model);
        }
      });
      delete this.control.preRemoved;
      delete this.control.preAdded;
      delete this.control.preAddedNew;
      delete this.control.preAddedNewLabels;
      this.emptyFieldValue = null;
      this.addedValues = null;
      this.removedValues = null;
      if (removedValues.length === excludeNoValue.length && this.control.type !== "d2list") {
        this.emptyFieldValue = true;
        this.removedValues = removedValues;
      } else if (removedValues.length || addedValues.length) {
        _.each(removedValues, function(removedValue) {
          var singleCountData = _.find(this.control.options.multiFileCountData, function(countData) {
            return countData.value === removedValue.get("value");
          });
          singleCountData.objectIds = [];
          singleCountData.count = 0;
        }.bind(this));
        _.each(addedValues, function(addedValue) {
          var singleCountData = _.find(this.control.options.multiFileCountData, function(countData) {
            return countData.value === addedValue.get("value");
          });
          if (singleCountData) {
            singleCountData.objectIds = _.pluck(this.control.options.massUpdateNodes, "r_object_id");
            singleCountData.count = singleCountData.totalCount;
          } else {
            if (this.control.type === "d2combo" && this.control.options.isEditable) {
              var value = addedValue.get("value"), newModel = new Backbone.Model({
                id: value,
                name: value
              });
              this.control.fieldView.collection.add(newModel);
              this.control.fieldView.suggestions.push(newModel);
              this.control.fieldView.setValue(newModel, true);
              this.control.fieldView.options.collection.add(newModel);
            }
            this.control.options.multiFileCountData[addedValue.get("value")] = {
              count: this.control.options.massUpdateFileCount,
              objectIds: _.pluck(this.control.options.massUpdateNodes, "r_object_id"),
              totalCount: this.control.options.massUpdateFileCount,
              value: addedValue.get("value"),
              label: addedValue.get("name") || addedValue.get("value")
            };
            this.control.preAddedNew = this.control.preAddedNew || [];
            this.control.preAddedNew.push(addedValue.get("value"));
            this.control.preAddedNewLabels = this.control.preAddedNewLabels || [];
            this.control.preAddedNewLabels.push(addedValue.get("name") || addedValue.get("value"));
          }
        }.bind(this));
        if (removedValues.length) {
          this.control.preRemoved = _.chain(removedValues).pluck("attributes").pluck("value").value();
          this.removedValues = removedValues;
        }
        if (addedValues.length) {
          this.control.preAdded = _.chain(addedValues).pluck("attributes").pluck("value").value();
          this.addedValues = addedValues;
        }
      }
    },
    reorderValues: function() {
      var newOrder = _.chain(this.tableView.collection.allModels).filter(function(model) {
        return model.get("d2_field_value_count") !== 0 || !_.isUndefined(model.previousFieldValueCount) && model.previousFieldValueCount !== 0;
      }.bind(this)).pluck("attributes").pluck("value").value();
      if (!_.isEqual(this.control.initialOrder, newOrder)) {
        this.control.preOrder = newOrder;
      } else {
        delete this.control.preOrder;
      }
    },
    updateListField: function() {
      if (this.control.type !== "d2list") {
        return;
      }
      this.control.silentMultiFileChanges = true;
      var setValues = this.tableView.collection.allModels.filter(function(model) {
        return model.get("d2_field_value_count") === 0 || model.get("d2_field_value_count") === model.get("total_count");
      }).length === this.tableView.collection.allModels.length ? [] : [ this.control.fieldView.getValue()[0] ];
      setValues.push.apply(setValues, _.chain(this.tableView.collection.allModels).filter(function(model) {
        return model.get("d2_field_value_count") === model.get("total_count");
      }.bind(this)).pluck("attributes").pluck("value").value());
      this.control.fieldView.collection.each(function(model) {
        model.get("selected") && model.set("selected", false, {
          silentMultiFileChanges: true
        });
      }.bind(this));
      _.each(setValues, function(value) {
        var model = this.control.fieldView.collection.find(function(model) {
          return model.get("id") === value;
        });
        if (!model) {
          model = new Backbone.Model({
            id: value,
            name: _.find(this.tableView.collection.allModels, function(model) {
              return model.get("value") === value;
            }).get("name") || value
          });
          this.control.fieldView.collection.add(model);
        }
        model.set("selected", true, {
          silentMultiFileChanges: true
        });
      }.bind(this));
      !(this.control.options && this.control.options.isSorted) && this.control.fieldView.selectionView.currentView.ui.selectedValues.is(":ui-sortable") && this.control.fieldView.selectionView.currentView.ui.selectedValues.sortable("destroy");
      this.control.silentMultiFileChanges = false;
    },
    onUpdateClick: function() {
      if (this.summaryView) {
        this.onContinueClick();
        return;
      }
      this.savePreviousData();
      if (this.control.options.errorMultiFileCountData) {
        this.control.options.multiFileCountData = JSON.parse(JSON.stringify(this.control.options.errorMultiFileCountData));
      } else {
        this.control.options.multiFileCountData = JSON.parse(JSON.stringify(this.options.formModel.get("options").initialFieldMultiValueMap[this.control.propertyId]));
      }
      this.replaceValues();
      this.updateValues();
      this.reorderValues();
      var updateCount = this.control.preSelected || this.updateFieldValue ? 1 : 0;
      updateCount = this.removedValues ? updateCount + this.removedValues.length : updateCount;
      updateCount = this.addedValues ? updateCount + this.addedValues.length : updateCount;
      if (updateCount > 7 || this.tableView.collection.filters && !_.isEmpty(this.tableView.collection.filters.name)) {
        var changedValue = this.control.preSelected || this.updateFieldValue ? new Backbone.Model(_.extend({}, this.tableView.collection.models[0].attributes, {
          d2_field_value_count: this.updateFieldValue ? this.control.options.massUpdateFileCount : _.chain(this.control.preSelected).pluck("attributes").pluck("d2_field_value_count").value().reduce(function(total, value) {
            return total + value;
          }),
          objectIds: this.updateFieldValue ? _.pluck(this.control.options.massUpdateNodes, "r_object_id") : _.chain(this.control.preSelected).pluck("attributes").pluck("objectIds").value().reduce(function(total, value) {
            return total.concat(value);
          }),
          has_value: true,
          name: (this.updateFieldValue instanceof Backbone.Model ? this.updateFieldValue.get("name") : this.updateFieldValue) || this.control.replaceWithLabel,
          value: (this.updateFieldValue instanceof Backbone.Model ? this.updateFieldValue.get("id") : this.updateFieldValue) || this.control.replaceWithValue
        })) : null;
        this.setupSummaryView({
          added: this.addedValues ? new MassUpdateFieldValueCollection(this.addedValues) : null,
          removed: this.removedValues ? new MassUpdateFieldValueCollection(this.removedValues) : null,
          changed: changedValue ? new MassUpdateFieldValueCollection([ changedValue ]) : null,
          control: this.control,
          context: this.options.context
        });
        this.tableRegion && this.tableRegion.$el.addClass("binf-hidden");
        this.updateFormVisible = !this.updateRegion.$el.hasClass("binf-hidden");
        this.updateRegion && this.updateFormVisible && this.updateRegion.$el.addClass("binf-hidden");
        this.summaryRegion.$el.removeClass("binf-hidden");
        this.showSummaryView();
        this.refreshButtons();
      } else {
        this.onContinueClick();
      }
    },
    onContinueClick: function() {
      if (this.updateFieldValue) {
        if (this.control.type === "d2combo") {
          this.control.fieldView.setValue(this.updateFieldValue, true);
        } else {
          this.control.fieldView.ui.writeField.val(this.updateFieldValue);
          this.control.fieldView.ui.writeField.trigger("input");
          this.control.fieldView.ui.writeField.trigger("focusout");
        }
      }
      if (this.emptyFieldValue) {
        if (this.control.type === "d2combo") {
          this.control.fieldView.onClickNoneOption($.Event());
        } else {
          this.control.fieldView.ui.writeField.val("");
          this.control.fieldView.ui.writeField.trigger("input");
          this.control.fieldView.ui.writeField.trigger("focusout");
        }
      }
      this.updateListField();
      this.control.refreshValidationState(false);
      this.control.fieldView._raiseValueChanged();
      this.options.originatingView.onWizardBackClick({
        afterUpdate: true
      });
    },
    onClickBackSummaryPage: function() {
      this.populatePreviousData();
      this.summaryView.destroy();
      delete this.summaryView;
      this.summaryRegion.$el.addClass("binf-hidden");
      this.tableRegion.$el.removeClass("binf-hidden");
      this.updateFormVisible && this.updateRegion.$el.removeClass("binf-hidden");
      this.refreshButtons();
    },
    savePreviousData: function() {
      this.previousData = {
        previousMultiData: JSON.parse(JSON.stringify(this.control.options.multiFileCountData)),
        preSelected: this.control.preSelected,
        replaceWithValue: this.control.replaceWithValue,
        replaceWithLabel: this.control.replaceWithLabel,
        preRemoved: this.control.preRemoved,
        preAdded: this.control.preAdded,
        preAddedNew: this.control.preAddedNew,
        preAddedNewLabels: this.control.preAddedNewLabels,
        preOrder: this.control.preOrder
      };
    },
    populatePreviousData: function() {
      this.control.options.multiFileCountData = JSON.parse(JSON.stringify(this.previousData.previousMultiData));
      this.control.preSelected = this.previousData.preSelected;
      this.control.replaceWithValue = this.previousData.replaceWithValue;
      this.control.replaceWithLabel = this.previousData.replaceWithLabel;
      this.control.preRemoved = this.previousData.preRemoved;
      this.control.preAdded = this.previousData.preAdded;
      this.control.preAddedNew = this.previousData.preAddedNew;
      this.control.preAddedNewLabels = this.previousData.preAddedNewLabels;
      this.control.preOrder = this.previousData.preOrder;
    },
    refreshButtons: function() {
      if (this.options.wizard) {
        this.options.wizard.refreshFooter();
      }
    },
    getTitle: function() {
      var mode = this.tableView.mode;
      return mode === "view" ? _.str.sformat(lang.viewFieldTitle, this.control.options.label) : _.str.sformat(lang.updateFieldTitle, this.control.options.label);
    },
    isNextButtonHidden: function() {
      var mode = this.tableView.mode;
      return mode === "view";
    },
    getNextButtonLabel: function() {
      return this.summaryView ? lang.continueLabel : lang.updateLabel;
    },
    isValid: function() {
      var modifiedNodes = _.filter(this.tableView.collection.allModels, function(model) {
        return !_.isUndefined(model.previousFieldValueCount) && model.previousFieldValueCount !== model.get("d2_field_value_count");
      });
      return this.selectedNodes && this.selectedNodes.length && this.updateFormView && this.updateFormRendered && this.isUpdateFormValid || !(this.selectedNodes && this.selectedNodes.length) && this.control.preSelected || modifiedNodes.length || !modifiedNodes.length && (this.control.preRemoved || this.control.preAdded) || this.tableView.orderChanged || !this.tableView.orderChanged && this.control.preOrder || this.options.originatingView.massUpdateCorrectionView;
    },
    getBackButtonTooltip: function() {
      if (this.options.originatingView.massUpdateCorrectionView) {
        return lang.backToErrorCorrectionView;
      }
      return this.summaryView ? null : this.options.originatingView.options.massUpdateOptions.massUpdateConfigName;
    }
  });
});