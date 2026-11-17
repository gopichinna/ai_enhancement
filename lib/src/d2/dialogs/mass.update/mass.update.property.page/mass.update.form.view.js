/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/utils/base", "csui/controls/icon/icon.view", "d2/dialogs/mass.update/mass.update.property.page/updated.field.message.view", "d2/widgets/metadata/general.panels/d2/d2.general.form.view", "d2/utils/constants", "d2/utils/format.utils", "d2/utils/mass.update.utils", "i18n!d2/dialogs/mass.update/impl/nls/lang", "i18n!d2/utils/impl/nls/lang", "css!d2/dialogs/mass.update/mass.update.property.page/impl/mass.update.form", "d2/controls/form/fields/alpaca/alpd2massupdatecheckboxfield", "d2/controls/form/fields/alpaca/alpd2massupdateradiofield", "d2/controls/form/fields/alpaca/alpd2massupdatebooleanfield" ], function(_, base, IconView, UpdatedFieldMessageView, D2GeneralFormView, constants, FormatUtils, MassUpdateUtils, lang, MassUpdateLang) {
  "use strict";
  var EXLUDE_FIELDS_FROM_EXPANSION = [ "d2password", "d2massupdatecheckbox", "d2massupdateradio", "d2massupdateboolean" ], EXCLUDE_FIELDS_FROM_UPDATING_VALUES_ON_DISABLE = [ "d2list", "d2massupdateboolean", "d2massupdateradio", "d2massupdatecheckbox" ];
  return D2GeneralFormView.extend({
    className: function() {
      return D2GeneralFormView.prototype.className.apply(this, arguments) + " d2-mass-update-properties-form";
    },
    constructor: function MassUpdateGeneralFormView() {
      D2GeneralFormView.prototype.constructor.apply(this, arguments);
      if (this.node && !this.node._massUpdateFormValuesMap) {
        this.node._massUpdateFormValuesMap = {
          "properties-list": []
        };
      }
      this.listenTo(this, "d2:field:undo", this.onUndoField);
    },
    updateRenderedForm: function() {
      D2GeneralFormView.prototype.updateRenderedForm.apply(this, arguments);
      var alpacaForm = this.$el.alpaca("get");
      if (alpacaForm) {
        var children = alpacaForm.children;
        _.each(children, function(control) {
          this.destroyAndAddExpandIcon(control);
          this.destroyAndAddUpdatedMessage(control);
          control.schema["disabled"] && this.changeFieldMultipleValue(control, control.schema["disabled"]);
        }, this);
      }
    },
    destroyAndAddExpandIcon: function(control) {
      control.expandIconView && control.expandIconView.destroy();
      delete control.expandIconView;
      this.addExpandIcon(control);
    },
    destroyAndAddUpdatedMessage: function(control) {
      control.updatedFieldView && control.updatedFieldView.destroy();
      delete control.updatedFieldView;
      this.addUpdatedMessage(control);
    },
    updateMultipleValue: function(control, values, disabled, clone) {
      var langPrefix = control.options.massUpdateDocumentType === constants.MassUpdateOptions.FOLDER_PROPERTIES ? "Folder" : control.options.massUpdateDocumentType === constants.MassUpdateOptions.ITEM_PROPERTIES ? "Item" : "", updateTo = disabled ? MassUpdateLang.multipleValues : control.type === "date" || control.type === "datetime" ? MassUpdateLang["multipleValuesSelectNewDate" + langPrefix] : control.type === "d2combo" ? MassUpdateLang["multipleValuesSelectNewValue" + langPrefix] : MassUpdateLang["multipleValuesEnterNew" + langPrefix];
      if (clone) {
        values = _.isArray(values) || _.isObject(values) ? JSON.stringify(JSON.parse(values)) : values;
      }
      if (_.isArray(values)) {
        _.each(values, function(value, index) {
          if (MassUpdateUtils.fieldHasMultipleValues(value)) {
            values[index] = updateTo;
          }
        });
      } else {
        values = MassUpdateUtils.fieldHasMultipleValues(values) ? updateTo : values;
      }
      return values;
    },
    changeFieldMultipleValue: function(control, disabled) {
      if (control.isContainerField || _.contains(EXCLUDE_FIELDS_FROM_UPDATING_VALUES_ON_DISABLE, control.type)) {
        return;
      }
      var originalValue = this.model.get("options").initialFieldValueMap[control.propertyId], updateData = MassUpdateUtils.fieldHasMultipleValues(originalValue), updateValue = MassUpdateUtils.fieldHasMultipleValues(control.getValue());
      if (updateData) {
        if (_.isArray(originalValue)) {
          this.updateMultipleValue(control, originalValue, disabled);
        } else {
          this.model.get("options").initialFieldValueMap[control.propertyId] = this.updateMultipleValue(control, originalValue, disabled);
        }
      }
      if (updateValue) {
        var value = this.updateMultipleValue(control, control.getValue(), disabled, true);
        control.fieldView.setValue(value, true);
      }
      if (updateData || updateValue) {
        if (control.type === "d2combo") {
          control.options.validator = control.customValidation;
        }
        var updateHidden = control.updatedFieldView && control.updatedFieldView.$el.hasClass("binf-hidden"), hasExpandIcon = !!control.expandIconView;
        this.refreshControl(control);
        control.updatedFieldView && control.updatedFieldView.$el[updateHidden ? "addClass" : "removeClass"]("binf-hidden");
        if (!hasExpandIcon) {
          control.expandIconView && control.expandIconView.destroy();
          delete control.expandIconView;
        }
      }
    },
    setEnabled: function(control) {
      D2GeneralFormView.prototype.setEnabled.apply(this, arguments);
      var disabled = control.schema["disabled"];
      this.changeFieldMultipleValue(control, disabled);
      control.expandIconView && this.destroyAndAddExpandIcon(control);
    },
    addExpandIcon: function(control) {
      if (control.options.mode === "create" && !_.contains(EXLUDE_FIELDS_FROM_EXPANSION, control.type) && (control.type !== "richtext" || control.schema.title !== "")) {
        if (control.isControlField) {
          if (this.model.get("options").initialFieldMultiValueMap[control.propertyId] && !this.model.get("options").maxObjectThresholdReached) {
            var $field = control.fieldView.$el;
            control.expandIconView = new IconView({
              iconName: "d2_action_expand_field",
              states: true
            });
            control.expandIconView.render();
            control.expandIconView.$el.attr("tabindex", "0");
            control.expandIconView.$el.attr("title", _.str.sformat(control.type === "d2combo" && control.options.ds && control.options.ds.assistance_type === "taxonomy" || control.schema.readonly || control.schema.disabled ? lang.viewField : lang.updateField, control.schema.title));
            var me = this, onClickExpandIcon = function(event) {
              event.stopPropagation();
              event.preventDefault();
              me.options.originatingView && me.options.originatingView.trigger("d2:expand:field", {
                control: control,
                formModel: me.model
              });
            };
            control.expandIconView.$el.on("click", onClickExpandIcon);
            control.expandIconView.$el.on("keyup", function(event) {
              if (event.which === 13 || event.which === 32) {
                onClickExpandIcon(event);
              }
            });
            control.expandIconView.$el.on("keydown", function(event) {
              if (event.which === 13 || event.which === 32) {
                event.stopPropagation();
                event.preventDefault();
              }
            });
            control.expandIconView.$el.on("focus", function(event) {
              base.checkAndScrollElemToViewport(event.currentTarget);
            });
            $field.append(control.expandIconView.el);
          }
        } else if (control.children && control.children.length) {
          _.each(control.children, this.addExpandIcon, this);
        }
      }
    },
    addUpdatedMessage: function(control) {
      if (control.isControlField) {
        control.updatedFieldView = new UpdatedFieldMessageView({
          control: control,
          formView: this
        });
        control.updatedFieldView.render();
        control.updatedFieldView.$el.addClass("binf-hidden");
        control.field.append(control.updatedFieldView.el);
      } else if (control.children && control.children.length) {
        _.each(control.children, this.addUpdatedMessage, this);
      }
    },
    onChangeField: function(args) {
      if (this._undoInProcess || args.fieldView.alpacaField.silentMultiFileChanges) {
        return;
      }
      var control = args.fieldView && args.fieldView.alpacaField, updatedFieldView = control.updatedFieldView, model = args.model, newValue = args.value, oldValue = model.get("options").initialFieldValueMap[control.propertyId], method;
      newValue = newValue === null || newValue === undefined ? "" : newValue;
      oldValue = oldValue === null || oldValue === undefined ? "" : oldValue;
      if ((control.options._type === "integer" || control.options._type === "double") && newValue !== "" && !MassUpdateUtils.fieldHasMultipleValues(newValue)) {
        newValue = control.options._type === "integer" ? parseInt(newValue) : parseFloat(newValue);
      }
      control.options && control.options.isSorted && newValue.sort() && oldValue.sort();
      if (MassUpdateUtils.fieldHasMultipleValues(newValue) && MassUpdateUtils.fieldHasMultipleValues(oldValue)) {
        method = "addClass";
      } else if (control.type === "date" || control.type === "datetime") {
        method = _.isEqual(args.fieldView._convertFromInputToModel(args.fieldView._convertFromModelToInput(oldValue)), newValue) ? "addClass" : "removeClass";
      } else if (control.type === "d2massupdateboolean") {
        method = Boolean(newValue) === Boolean(oldValue) ? "addClass" : "removeClass";
      } else {
        method = _.isEqual(newValue, oldValue) ? "addClass" : "removeClass";
      }
      if (method === "addClass") {
        if (model.get("options").initialFieldMultiValueMap[control.propertyId]) {
          var changedMultiData = control.options.multiFileCountData, originalMultiData = model.get("options").initialFieldMultiValueMap[control.propertyId];
          method = JSON.stringify(changedMultiData) === JSON.stringify(originalMultiData) ? "addClass" : "removeClass";
          method = control.preOrder && !_.isEqual(control.preOrder, control.options.initialOrder) ? "removeClass" : method;
        } else if (control.options.maxObjectThresholdReached) {
          method = _.isEqual(newValue, oldValue) ? "addClass" : "removeClass";
        }
      }
      updatedFieldView.$el[method]("binf-hidden");
      if (MassUpdateUtils.fieldHasMultipleValues(newValue) || newValue && _.isArray(newValue) && _.find(newValue, function(value) {
        return MassUpdateUtils.fieldHasMultipleValues(value);
      })) {
        !control.options.maxObjectThresholdReached && control.type === "d2list" && control.fieldView.searchInput.$el.hide();
        !control.expandIconView && this.addExpandIcon(control);
      } else {
        if (control.expandIconView) {
          control.expandIconView.destroy();
          delete control.expandIconView;
        }
        if (!control.options.maxObjectThresholdReached && control.type === "d2list" && control.fieldView.searchInput.$el.is(":hidden")) {
          control.fieldView.searchInput.$el.show();
          setTimeout(function() {
            control.fieldView.setFocus();
          }, 200);
        }
      }
      method === "addClass" && this.deletePreData(control);
      this.updateChangeValueMap(newValue, method, changedMultiData, originalMultiData, args);
    },
    sortListValues: function(mapValues) {
      _.each(mapValues, function(values, key) {
        mapValues[key] = _.sortBy(values, function(value) {
          return value === "#####" ? String.fromCharCode(0) : value.toLowerCase();
        });
      });
      return mapValues;
    },
    createMultiValueMap: function(multiFileData) {
      var newValueMap = {};
      _.each(multiFileData, function(data, key) {
        if (data.hasValue !== false) {
          _.each(data["objectIds"], function(objectId) {
            if (!newValueMap[objectId]) {
              newValueMap[objectId] = [ key ];
            } else {
              newValueMap[objectId].push(key);
            }
          });
        }
      });
      return newValueMap;
    },
    createNewValueListMap: function(multiFileCountData, control) {
      var newValueMap = {}, preOrder = control.preOrder || control.options.initialOrder;
      if (preOrder) {
        _.each(preOrder, function(preOrderKey) {
          _.each(multiFileCountData[preOrderKey]["objectIds"], function(objectId) {
            if (!newValueMap[objectId]) {
              newValueMap[objectId] = [ preOrderKey ];
            } else {
              newValueMap[objectId].push(preOrderKey);
            }
          });
        });
      } else {
        newValueMap = this.createMultiValueMap(multiFileCountData);
      }
      if (control.options.isSorted) {
        newValueMap = this.sortListValues(newValueMap);
      }
      return newValueMap;
    },
    filterUpdatedListMap: function(newValueMap, initialValueMap) {
      var propertiesMap = {};
      _.each(initialValueMap, function(data, key) {
        if (!newValueMap[key]) {
          propertiesMap[key] = [];
        } else if (JSON.stringify(data) !== JSON.stringify(newValueMap[key])) {
          propertiesMap[key] = !_.isUndefined(newValueMap[key]) ? newValueMap[key] : [];
        }
      });
      _.each(newValueMap, function(data, key) {
        if (!initialValueMap[key]) {
          propertiesMap[key] = newValueMap[key];
        }
      });
      return propertiesMap;
    },
    createMultiValueFieldObjectIdsMap: function(control, args) {
      var multiFileCountData = control.options.multiFileCountData, model = args.model, initialMultiFileCountData = model.get("options").initialFieldMultiValueMap[control.propertyId], propertiesMap = {}, me = this;
      if (MassUpdateUtils.fieldHasMultipleValues(control.getValue()) && !control.options.maxObjectThresholdReached) {
        propertiesMap = me.filterUpdatedListMap(me.createNewValueListMap(multiFileCountData, control), me.createMultiValueMap(initialMultiFileCountData));
      } else {
        var massUpdateNodes = _.pluck(control.options.massUpdateNodes, "r_object_id"), massUpdateNodesValueMap = {};
        if (JSON.stringify(args.value) !== JSON.stringify(model.get("options").initialFieldValueMap[control.propertyId])) {
          _.each(massUpdateNodes, function(objectId) {
            massUpdateNodesValueMap[objectId] = MassUpdateUtils.convertMultipleValues(args.value);
          });
        }
        if (control.options.isSorted) {
          massUpdateNodesValueMap = me.sortListValues(massUpdateNodesValueMap);
        }
        propertiesMap = me.filterUpdatedListMap(massUpdateNodesValueMap, me.createMultiValueMap(initialMultiFileCountData));
      }
      return propertiesMap;
    },
    objectIdsWithUpdatedProperties: function(newValue, control, changedMultiData, originalMultiData) {
      var massUpdateNodes = control.options.massUpdateNodes;
      var ids = [];
      if (changedMultiData) {
        _.each(changedMultiData, function(obj, key) {
          if (obj["count"] === 0 && originalMultiData[key]["count"] > 0) {
            ids = ids.concat(originalMultiData[key]["objectIds"]);
          } else if (JSON.stringify(obj) !== JSON.stringify(originalMultiData[key])) {
            ids = ids.concat(obj["objectIds"]);
          }
        });
      } else {
        var initialMultivalueMap = this.model.get("options").initialFieldMultiValueMap[control.propertyId], excludedObjIds = [];
        if (!_.isUndefined(newValue) && !_.isNull(newValue) && initialMultivalueMap) {
          if (_.isEmpty(newValue) && initialMultivalueMap["d2_mass_update_no_value"]) {
            excludedObjIds = excludedObjIds.concat(initialMultivalueMap["d2_mass_update_no_value"]["objectIds"]);
          } else if (initialMultivalueMap[newValue]) {
            excludedObjIds = excludedObjIds.concat(initialMultivalueMap[newValue]["objectIds"]);
          }
        }
        ids = _.pluck(massUpdateNodes, "r_object_id");
        if (excludedObjIds.length > 0) {
          ids = _.filter(ids, function(objId) {
            return !_.contains(excludedObjIds, objId);
          });
        }
      }
      return ids;
    },
    refreshPropertiesMap: function(name, updatedObjectIds) {
      var me = this, propertiesList = me.node._massUpdateFormValuesMap["properties-list"];
      _.each(propertiesList, function(obj) {
        if (!_.isUndefined(updatedObjectIds) && updatedObjectIds.length > 0 && updatedObjectIds.indexOf(obj["properties"]["r_object_id"]) < 0 && !_.isUndefined(obj["properties"][name])) {
          delete obj["properties"][name];
        } else if (!_.isUndefined(obj["properties"][name])) {
          delete obj["properties"][name];
        }
      });
      var filteredPropertiesMap = _.filter(me.node._massUpdateFormValuesMap["properties-list"], function(obj) {
        return _.keys(obj["properties"]).length > 1;
      });
      me.node._massUpdateFormValuesMap["properties-list"] = filteredPropertiesMap;
    },
    updateMapProperties: function(objectId, updatedValue, model, index, args) {
      var propertiesObj = {
        properties: {}
      }, me = this, name = args.path.split("/")[args.path.split("/").length - 1];
      if (!_.isUndefined(index)) {
        me.node._massUpdateFormValuesMap["properties-list"][index]["properties"][name] = FormatUtils.isDateType(model.format) ? FormatUtils.convertToServerFormat(updatedValue) : updatedValue;
      } else {
        propertiesObj["properties"]["r_object_id"] = objectId;
        propertiesObj["properties"][name] = FormatUtils.isDateType(model.format) ? FormatUtils.convertToServerFormat(updatedValue) : updatedValue;
        me.node._massUpdateFormValuesMap["properties-list"].push(propertiesObj);
      }
    },
    updateChangeValueMap: function(newValue, method, changedMultiData, originalMultiData, args) {
      var name = args.path.split("/")[args.path.split("/").length - 1];
      var control = args.fieldView && args.fieldView.alpacaField;
      var fieldPath = args.path.substr(1);
      var me = this;
      var otherFieldsObjectIdsMap = {};
      if (control.type === "d2list" || control.type === "d2massupdatecheckbox") {
        otherFieldsObjectIdsMap = me.createMultiValueFieldObjectIdsMap(control, args);
      }
      if (args.parentField && args.parentField.path && args.path.indexOf("[") > -1 && args.path.indexOf("]") > -1) {
        fieldPath = args.path.split("[")[0].substr(1);
      }
      var updatedObjectIds = control.type === "d2list" || control.type === "d2massupdatecheckbox" ? _.keys(otherFieldsObjectIdsMap) : me.objectIdsWithUpdatedProperties(newValue, control, changedMultiData, originalMultiData);
      var model = this.getFieldForPath(args.model.get("schema"), "properties", "/", fieldPath);
      me.refreshPropertiesMap(name, updatedObjectIds);
      if (this.node._massUpdateFormValuesMap && !!model) {
        if (method === "removeClass") {
          _.each(updatedObjectIds, function(objectId) {
            var index = me.checkObjectPresent(objectId), updatedValue = FormatUtils.isDateType(model.format) ? null : "";
            if (control.type === "d2list" || control.type === "d2massupdatecheckbox") {
              updatedValue = otherFieldsObjectIdsMap[objectId];
            } else if (changedMultiData) {
              _.each(changedMultiData, function(obj) {
                if (obj["count"] > 0 && obj["objectIds"].indexOf(objectId) > -1) {
                  updatedValue = obj.hasValue !== false ? obj["value"] : "";
                }
              });
            } else {
              updatedValue = args.value;
            }
            if (index > -1) {
              me.updateMapProperties(objectId, updatedValue, model, index, args);
            } else {
              me.updateMapProperties(objectId, updatedValue, model, undefined, args);
            }
          });
        } else {
          me.refreshPropertiesMap(name);
        }
        me.options.originatingView.options.wizard.refreshFooter([ "next" ]);
      }
    },
    checkObjectPresent: function(objectId) {
      if (this.node._massUpdateFormValuesMap["properties-list"].length === 0) {
        return -1;
      } else {
        var index = _.findIndex(this.node._massUpdateFormValuesMap["properties-list"], function(obj) {
          return obj["properties"]["r_object_id"] === objectId;
        });
        return index;
      }
    },
    onUndoField: function(control, stopEventPropogation) {
      var origValue = this.model.get("options").initialFieldValueMap[control.propertyId] || null;
      this._undoInProcess = true;
      if (control.type === "d2list") {
        control.fieldView.selectedCollection.reset(_.map(origValue, function(value) {
          return {
            id: value
          };
        }), {
          silent: true
        });
      }
      if (control.type === "d2list" || control.type === "d2combo") {
        control.options.validator = control.customValidation;
      }
      control.fieldView.setValue(origValue, true, stopEventPropogation);
      control.options.multiFileCountData = this.model.get("options").initialFieldMultiValueMap[control.propertyId] && JSON.parse(JSON.stringify(this.model.get("options").initialFieldMultiValueMap[control.propertyId]));
      this.deletePreData(control);
      this.refreshControl(control);
      this.refreshPropertiesMap(control.propertyId);
      this.options.originatingView.options.wizard.refreshFooter([ "next" ]);
      if (!stopEventPropogation && control.type === "d2combo" && control.options.ds && control.options.ds.assistance_type === "taxonomy") {
        _.each(control.taxonomyAncestors, function(ancestor) {
          this.trigger("d2:field:undo", ancestor, true);
        }, this);
        _.each(control.taxonomyChildren, function(child) {
          this.trigger("d2:field:undo", child, true);
        }, this);
      }
      this._undoInProcess = false;
    },
    deletePreData: function(control) {
      delete control.preSelected;
      delete control.replaceWithValue;
      delete control.replaceWithLabel;
      delete control.preRemoved;
      delete control.preAdded;
      delete control.preAddedNew;
      delete control.preAddedNewLabels;
      delete control.preOrder;
    },
    refreshControl: function(control) {
      var previousHideInitValidationError = control.hideInitValidationError;
      control.refresh();
      control.hideInitValidationError = previousHideInitValidationError;
      control.refreshValidationState();
      this.setTooltipsForLabels();
      this.destroyAndAddUpdatedMessage(control);
      this.destroyAndAddExpandIcon(control);
    }
  });
});