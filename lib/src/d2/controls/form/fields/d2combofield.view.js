/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/controls/form/pub.sub", "dctmw/controls/form/fields/dctmwcombofield.view", "d2/utils/combo.datasource.utils", "d2/utils/mass.update.utils", "d2/controls/form/fields/massupdatefields/mass.update.field.mixin", "i18n!d2/controls/form/impl/nls/lang" ], function(_, $, Backbone, PubSub, DctmwComboFieldView, ComboDataSourceUtils, MassUpdateUtils, MassUpdateFieldMixin, Lang) {
  "use strict";
  const DctmwComboItemView = DctmwComboFieldView.ComboItemView, ItemView = DctmwComboFieldView.ComboItemView.extend({
    constructor: function D2ComboFieldItemView(options) {
      DctmwComboItemView.prototype.constructor.call(this, options);
    },
    onRender: function() {
      DctmwComboItemView.prototype.onRender.call(this);
      if (this.options.originatingView.options.model.get("options").massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.model.get("id"))) {
        this.$el.hide();
      }
    }
  });
  const D2ComboFieldView = DctmwComboFieldView.extend({
    childView: ItemView,
    constructor: function D2ComboFieldView() {
      DctmwComboFieldView.prototype.constructor.apply(this, arguments);
    },
    dctmwPostConstruction: function() {
      this.metadataView = this.alpacaField.connector.config.formView.options.originatingView;
      this.listenTo(this.metadataView, "taxo:upChangeEvent", this.doComboReset);
      this.listenTo(this.metadataView, "taxo:downChangeEvent", this.doComboReload);
      if (this.curVal.id !== null) {
        this.listenToOnce(this, "after:visible", function() {
          if (this.alpacaField.options.ds && this.alpacaField.options.ds.assistance_type === "taxonomy") {
            this.alpacaField.loadTaxonomyChildren();
            this.raiseTaxonomyEvents(true, true);
          }
        });
      }
      if (!this.options.valueExistsInDB) {
        this.listenToOnce(this, "after:visible", function() {
          if (this.alpacaField.options?.autoSelectIfSingle === true && this.optionsCollection.length === 1) {
            this.raiseValueChangedExplicitly = true;
            this.setValue(this.optionsCollection.first(), true);
          }
        });
        if (this.mode === "read") {
          this.setValue(this.optionsCollection.first().get("id"), true);
        }
      }
      var self = this;
      this.errorList = [];
      _.map(this.optionsCollection.models, function(options) {
        if (_.isString(options.get("category")) && /Error/.test(options.get("category"))) {
          self.errorList.push(options.id);
        }
      });
    },
    fetchDataFromSource: function(options) {
      options.taxonomyType = options.taxonomyType ? options.taxonomyType : 0;
      return DctmwComboFieldView.prototype.fetchDataFromSource.apply(this, arguments);
    },
    _updateDataOnFetch: function(response, options) {
      const curValue = this.getValue(), present = _.find(response, model => model.get("id") === curValue.get("id"));
      if (curValue.get("id") && !present) {
        this.setValue(null, true, false);
      } else if (options.ignoreDependencyEvents !== true && options.firstLoad !== true) {
        this.raiseTaxonomyEvents();
      }
    },
    _getPlaceHolder: function() {
      var options = this.options.model.get("options");
      if (options.massUpdateFileCount) {
        if (options.ds && options.ds.assistance_type === "taxonomy") {
          return Lang.selectNewValueForAllFiles;
        } else {
          return MassUpdateUtils.fieldHasMultipleValues(this.getEditValue().get("id")) ? this.getEditValue().get("id") : Lang.selectFieldEmptyFieldLabel;
        }
      } else {
        return DctmwComboFieldView.prototype._getPlaceHolder.call(this);
      }
    },
    _prepareModelData: function(model, silent, eventArgs) {
      const value = DctmwComboFieldView.prototype._prepareModelData.call(this, model);
      if (value.id && this.model.get("id") === value.id && this.raiseValueChangedExplicitly) {
        this.raiseValueChangedExplicitly = false;
        this._raiseValueChanged(eventArgs);
      }
      return value;
    },
    _raiseValueChanged: function(eventArgs) {
      this.oldVal = this.curVal;
      const data = this._getValueChangeEventData();
      this.trigger("field:changed", data);
      PubSub.trigger(this.options.dataId + "dependentattrchanged", this);
      var event = $.Event("field:changed");
      _.extend(event, data);
      event.fieldChain = eventArgs?.fieldChain;
      this.$el.trigger(event);
      this.raiseTaxonomyEvents();
    },
    raiseTaxonomyEvents: function(retainCurrentValue, firstLoad) {
      this._raiseDownwardTaxonomy(retainCurrentValue, firstLoad);
      this._raiseUpwardTaxonomyEvent(retainCurrentValue, firstLoad);
    },
    _raiseDownwardTaxonomy: function(retainCurrentValue, firstLoad) {
      if (this.alpacaField.options.ds) {
        var args, index;
        var taxoFieldAfter = this.alpacaField.options.ds.assistanceTaxoAttrAfter;
        if (taxoFieldAfter) {
          if (taxoFieldAfter !== this.eventSource) {
            args = _.extend({}, {
              control: taxoFieldAfter,
              value: this.getValue().get("id"),
              source: this.alpacaField.propertyId,
              retainCurrentValue: retainCurrentValue,
              firstLoad: firstLoad
            });
            if (this.alpacaField.options.isGridField) {
              index = _.first(_.last(this.alpacaField.parent.path.split("[")).split("]"));
              _.extend(args, {
                index: index
              });
            }
            args.taxonomy = true;
            this.metadataView.trigger("taxo:downChangeEvent", args);
          }
        }
        if (this.alpacaField.forward && !this.alpacaField.backward) {
          if (this.alpacaField.options.massUpdateFileCount && !retainCurrentValue && !MassUpdateUtils.fieldHasMultipleValues(this.getValue())) {
            var found = _.find(this.alpacaField.taxonomyAncestors, function(ancestor) {
              return ancestor.propertyId === this.eventSource;
            }, this);
            if (!found) {
              _.each(this.alpacaField.taxonomyAncestors, function(ancestor) {
                if (MassUpdateUtils.fieldHasMultipleValues(ancestor.fieldView.getValue())) {
                  ancestor.fieldView.setDefaultValue(null, true);
                  ancestor.updatedFieldView.$el.removeClass("binf-hidden");
                }
              }, this);
            }
          }
        }
      }
    },
    _raiseUpwardTaxonomyEvent: function(retainCurrentValue, firstLoad) {
      if (this.alpacaField.options.ds) {
        var args, index;
        var taxoFieldBefore = this.alpacaField.options.ds.assistanceTaxoAttrBefore;
        if (taxoFieldBefore) {
          if (taxoFieldBefore !== this.eventSource) {
            args = _.extend({}, {
              control: taxoFieldBefore,
              value: this.getValue().get("id"),
              source: this.alpacaField.propertyId,
              taxonomyName: this.alpacaField.options.ds.taxonomyName,
              taxonomyLevel: this.alpacaField.options.ds.taxonomyLevel,
              taxonomyKey: this.alpacaField.options.ds.taxonomyKey,
              retainCurrentValue: retainCurrentValue,
              firstLoad: firstLoad
            });
            if (this.alpacaField.options.isGridField) {
              index = _.first(_.last(this.alpacaField.parent.path.split("[")).split("]"));
              _.extend(args, {
                index: index
              });
            }
            args.taxonomy = true;
            this.metadataView.trigger("taxo:upChangeEvent", args);
          }
        }
        if (this.alpacaField.backward && !this.alpacaField.forward) {
          if (this.alpacaField.options.massUpdateFileCount && !retainCurrentValue && !MassUpdateUtils.fieldHasMultipleValues(this.getValue())) {
            var found = _.find(this.alpacaField.taxonomyChildren, function(ancestor) {
              return ancestor.propertyId === this.eventSource;
            }, this);
            if (!found) {
              _.each(this.alpacaField.taxonomyChildren, function(child) {
                if (MassUpdateUtils.fieldHasMultipleValues(child.fieldView.getValue())) {
                  child.fieldView.setDefaultValue(null, true);
                  child.updatedFieldView.$el.removeClass("binf-hidden");
                }
              }, this);
            }
          }
        }
      }
    },
    setStateWrite: function(validate) {
      if (this.options.model.get("options").massUpdateFileCount && !(this.childTKLViews.length || this.parentViews.length)) {
        this.setValue(this.curVal, validate);
      }
      return DctmwComboFieldView.prototype.setStateWrite.call(this, validate);
    },
    setDefaultValue: function(args, silent) {
      DctmwComboFieldView.prototype.setDefaultValue.apply(this, arguments);
      if (this.alpacaField.options.hasMultipleValues && this.alpacaField.options.ds && this.alpacaField.options.ds.assistance_type === "taxonomy" && silent) {
        this.ui.writeField.attr("placeholder", Lang.selectNewValueForAllFiles);
      }
    },
    canReloadFieldData: function(args) {
      let canReload = DctmwComboFieldView.prototype.canReloadFieldData.apply(this, arguments);
      if (!(args instanceof Backbone.Model) && canReload) {
        if (args.index) {
          if (this.alpacaField.options.isGridField) {
            let index = _.last(this.alpacaField.parent.path.split("[")).split("]")[0];
            if (args.index !== index) {
              return false;
            }
          }
        }
      }
      return canReload;
    },
    canResetFieldData: function(args) {
      let canReset = DctmwComboFieldView.prototype.canResetFieldData.apply(this, arguments);
      if (canReset && args.index) {
        if (this.alpacaField.options.isGridField) {
          let index = _.last(this.alpacaField.parent.path.split("[")).split("]")[0];
          if (args.index !== index) {
            return false;
          }
        }
      }
      return canReset;
    },
    beforeComboReload: function(args, options) {
      this.alpacaField.loadTaxonomyChildren();
      args.taxonomyName = this.alpacaField.options.ds.taxonomyName;
      args.taxonomyLevel = this.alpacaField.options.ds.taxonomyLevel;
      args.taxonomyKey = this.alpacaField.options.ds.taxonomyKey;
      args.upwardFlag = false;
      options.taxonomyType = 1;
    },
    beforeComboReset: function(args, options) {
      if (this.alpacaField.options.isGridField) {
        this.alpacaField.loadTaxonomyChildren();
      }
      options.taxonomyType = -1;
    },
    populateReloadedData: function(existingValue, args, options, eventArgs) {
      if (args.value === "" && this.alpacaField.forward) {
        this.setValue(null, this.getInitialInvalid());
        this.resetSelection();
        this.raiseTaxonomyEvents(args.retainCurrentValue);
      } else {
        if (this.alpacaField.backward) {
          args.field = this.alpacaField;
          var selectedOptions = ComboDataSourceUtils.getTaxonomySelection(args);
          if (selectedOptions.length && selectedOptions.length === 1) {
            this.forceUpdate = true;
            var selectedModel = this.collection.get(selectedOptions[0].value);
            this.setValue(selectedModel, true);
          } else {
            var exists = _.find(selectedOptions, function(options) {
              if (options.value === existingValue) {
                return options;
              }
            });
            if (!exists && !args.retainCurrentValue) {
              this.setDefaultValue();
            } else {
              if (!args.retainCurrentValue) {
                this.setDefaultValue(args);
                var currValue = this.getValue().id;
                if (existingValue === currValue) {
                  this._raiseDownwardTaxonomy(args.retainCurrentValue);
                }
              }
            }
          }
        } else {
          if (!args.retainCurrentValue) {
            this.setDefaultValue(args, undefined, eventArgs);
            var curValue = this.getValue().id;
            if (existingValue === curValue) {
              this._raiseDownwardTaxonomy(args.retainCurrentValue);
            }
          }
        }
      }
      if (!this.options.valueExistsInDB) {
        if (this.alpacaField.options?.autoSelectIfSingle === true && this.optionsCollection.length === 1) {
          this.raiseValueChangedExplicitly = true;
          this.setValue(this.optionsCollection.first(), true, undefined, eventArgs);
        }
      }
    },
    populateResetData: function(args) {
      if (args.value === "") {
        this.setValue(null, true);
      } else if (!args.retainCurrentValue) {
        this.setDefaultValue(args);
      }
    },
    getInitialInvalid: function() {
      if (!_.isUndefined(this.metadataView.initialInvalid)) {
        return !this.metadataView.initialInvalid;
      } else {
        return !this.metadataView.getInitialInvalid();
      }
    },
    doComboReset: function(args, eventArgs) {
      if (args.control !== this.alpacaField.propertyId) {
        return;
      }
      if (this.mode === "readonly") {
        return;
      }
      if (args.index) {
        if (this.alpacaField.options.isGridField) {
          var index = _.last(this.alpacaField.parent.path.split("[")).split("]")[0];
          if (args.index !== index) {
            return;
          }
        }
      }
      this.eventSource = args.source;
      if (this.alpacaField.options.isGridField) {
        this.alpacaField.loadTaxonomyChildren();
      }
      var context = this.alpacaField.connector.config.context;
      var connector = context && context.getObject("connector") || this.alpacaField.connector.config.formView.node.connector;
      this.alpacaField.options.ds.connector = connector;
      var options = {};
      options.taxonomyType = -1;
      var self = this;
      this.fetchDataFromSource(options).done(function() {
        if (args.value === "" && !self.alpacaField.forward) {
          this.setValue(null, this.getInitialInvalid());
        } else {
          args.field = self.alpacaField;
          var selectedOptions = ComboDataSourceUtils.getTaxonomySelection(args);
          if (selectedOptions.length > 0) {
            if (selectedOptions.length > 1) {
              var exists = _.find(selectedOptions, function(options) {
                if (options.value === self.getValue().id) {
                  return options;
                }
              });
              if (exists) {
                this._raiseUpwardTaxonomyEvent(true, args.firstLoad);
              } else {
                if (MassUpdateUtils.fieldHasMultipleValues(this.model.get("id")) && args.firstLoad) {
                  this._raiseUpwardTaxonomyEvent(true, args.firstLoad);
                } else {
                  this.setDefaultValue();
                }
              }
            } else {
              this.forceUpdate = true;
              var selectedModel = this.collection.get(selectedOptions[0].value);
              this.setValue(selectedModel, true);
            }
          } else {
            if (!args.retainCurrentValue) {
              this.setDefaultValue(args);
            }
          }
        }
        if (!this.options.valueExistsInDB) {
          if (this.alpacaField.options?.autoSelectIfSingle === true && this.optionsCollection.length === 1) {
            this.raiseValueChangedExplicitly = true;
            this.setValue(this.optionsCollection.first(), true, undefined, eventArgs);
          }
        }
      }.bind(this));
    },
    validateOptions: function() {
      let valid = DctmwComboFieldView.prototype.validateOptions.call(this);
      if (this.alpacaField.options.massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.alpacaField.getValue())) {
        var error = _.some(this.alpacaField.options.multiFileCountData, function(objectValue) {
          return objectValue.count > 0 && _.isString(objectValue.category) && /Error/.test(objectValue.category);
        });
        valid = !error;
      }
      return valid;
    },
    isDuplicate: function() {
      var hasDuplicate = false;
      if (this.alpacaField.options.isGridField && this.alpacaField.schema.uniqueItems) {
        var me = this;
        hasDuplicate = _.some(this.alpacaField.parent.parent.children, function(child) {
          if (me.alpacaField.name !== child.childrenByPropertyId[me.alpacaField.propertyId].name || me.alpacaField.parent.name !== child.name) {
            var data = child.childrenByPropertyId[me.alpacaField.propertyId].data;
            if (!_.isEmpty(data) && me.alpacaField.data === data) {
              return true;
            }
          }
        });
      }
      return hasDuplicate;
    },
    hideOptionsSelectedByOtherRow: function() {
      if (this.alpacaField.options.isGridField && this.alpacaField.schema.uniqueItems) {
        var me = this;
        _.each(this.alpacaField.parent.parent.children, function(child) {
          if (me.alpacaField.name !== child.childrenByPropertyId[me.alpacaField.propertyId].name || me.alpacaField.parent.name !== child.name) {
            var data = child.childrenByPropertyId[me.alpacaField.propertyId].data;
            if (!_.isEmpty(data)) {
              me.ui.comboOptions.find("li[ id='" + data + "']").addClass("selectedByAnotherRow").addClass("binf-hidden");
            }
          }
        });
      }
    }
  });
  MassUpdateFieldMixin.mixin(D2ComboFieldView.prototype);
  return D2ComboFieldView;
});