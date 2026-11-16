/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "d2/widgets/metadata/utils/field.converter", "d2/utils/format.utils", "i18n!d2/controls/form/impl/nls/lang" ], function($, _, Backbone, FieldConverter, FormatUtils, lang) {
  "use strict";
  var containerMap = {
    tabs: convertContainer,
    tab: convertContainer,
    fieldset: convertContainer,
    columns: convertContainer,
    grid: convertGrid,
    header: "header",
    col: "col"
  };
  function fetchAlpacaContainer(field, mode, options) {
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
    var visibleConditionLabel = "condition_visible_" + mode;
    var fieldId = field.id;
    f["expressions"][fieldId] = {};
    if (_.has(field, visibleConditionLabel) && field[visibleConditionLabel] === false) {
      f["options"]["fields"][fieldId] = f["options"]["fields"][fieldId] || {};
      _.extend(f["options"]["fields"][fieldId], {
        hidden: true
      });
    } else if (_.has(field, "condition_visible")) {
      f["expressions"][fieldId]["setVisible"] = field["condition_visible"] === "" ? true : field["condition_visible"];
      if (_.has(field, "reinit_visible")) {
        f["options"]["fields"][fieldId] = f["options"]["fields"][fieldId] || {};
        _.extend(f["options"]["fields"][fieldId], {
          _reinit_visible: field["reinit_visible"]
        });
      }
    }
    var enableConditionLabel = "condition_enabled_" + mode;
    if (_.has(field, enableConditionLabel) && field[enableConditionLabel] === false) {
      f["options"]["fields"][fieldId] = f["options"]["fields"][fieldId] || {};
      _.extend(f["options"]["fields"][fieldId], {
        disabled: true
      });
      f["schema"]["properties"][fieldId] = f["schema"]["properties"][fieldId] || {};
      _.extend(f["schema"]["properties"][fieldId], {
        disabled: true
      });
    } else if (_.has(field, "condition_enabled")) {
      f["expressions"][fieldId]["setEnabled"] = field["condition_enabled"] === "" ? true : field["condition_enabled"];
    }
    if (options && options.isMassUpdate) {
      f["multiFileData"] = {};
    }
    return f;
  }
  function getDefaultLabel(key, param) {
    return _.str.sformat(lang[key] || "{0}", param) || "";
  }
  function getLabelForContainer(container, d2ContainerTypeConfig, parentContainer) {
    var result = "";
    if (!parentContainer) {
      result = getDefaultLabel(d2ContainerTypeConfig.defaultLabelKey, container.order);
    }
    var labels = _.isArray(container.label) ? container.label : [ container.label ];
    _.some(labels, function(label) {
      if (!_.isUndefined(label) && !_.isNull(label) && !_.isObject(label)) {
        result = label.toString();
        return true;
      }
    });
    return result;
  }
  function getLabelForTabContainer(container, d2ContainerTypeConfig) {
    if (d2ContainerTypeConfig.type === "d2tabgroup") {
      return undefined;
    }
    var tabContainerLabel = getDefaultLabel(d2ContainerTypeConfig.defaultLabelKey, d2ContainerTypeConfig.tabLevel + "." + container.order);
    var labels = [];
    if (!_.isUndefined(container.label)) {
      labels = _.isArray(container.label) ? container.label : [ _.isObject(container.label) ? tabContainerLabel : container.label + "" ];
    }
    _.some(labels, function(label) {
      return _.isString(label) && (tabContainerLabel = label);
    });
    return tabContainerLabel;
  }
  function convertContainer(container, options, ancestorOptions, type, rootExpressions, tabLevel, parentContainer) {
    var typemap = {
      columns: {
        type: "d2column",
        getLabel: function() {
          return "";
        }
      },
      fieldset: {
        type: "d2fieldset",
        defaultLabelKey: "defaultFieldSetLabel",
        getLabel: getLabelForContainer
      },
      tabs: {
        type: "d2tabgroup",
        getLabel: getLabelForTabContainer
      },
      tab: {
        type: options.layoutMode === "singleCol" && tabLevel > 0 ? "d2singleTab" : "d2tab",
        defaultLabelKey: "defaultTabLabel",
        getLabel: getLabelForTabContainer,
        tabLevel: tabLevel
      }
    };
    var d2ContainerTypeConfig = typemap[type];
    var id = container.id = container.id || _.uniqueId(d2ContainerTypeConfig.type + "_");
    var d2Container = _.extend(fetchAlpacaContainer(container, options.actionMode, options));
    var ids = {};
    d2Container["options"]["fields"][id] = _.extend({
      fields: {},
      label: "",
      containerLabel: d2ContainerTypeConfig.getLabel(container, d2ContainerTypeConfig, parentContainer),
      type: d2ContainerTypeConfig.type,
      toolbarSticky: true,
      isSpyScrollContainer: parentContainer == null && (d2ContainerTypeConfig.type === "d2fieldset" || d2ContainerTypeConfig.type === "d2tabgroup"),
      tabLevel: tabLevel,
      _d2Containertype: d2ContainerTypeConfig.type,
      layoutMode: options.layoutMode,
      usePerfectScrollbar: container.usePerfectScrollbar
    }, d2Container["options"]["fields"][id]);
    d2Container["schema"]["properties"][id] = {
      properties: {},
      type: "object"
    };
    if (d2ContainerTypeConfig.type === "d2column" && container.count === 1) {
      d2Container["options"]["fields"][id].singleColumn = true;
    }
    d2Container["data"][id] = d2Container["data"][id] || {};
    var data = d2Container["data"][id];
    var containerOptions = d2Container["options"]["fields"][id]["fields"];
    var schema = d2Container["schema"]["properties"][id]["properties"];
    if (options && options.isMassUpdate) {
      d2Container["multiFileData"][id] = d2Container["multiFileData"][id] || {};
      var multiFileData = d2Container["multiFileData"][id];
    }
    d2Container["parent"] = parentContainer;
    var containerCtx = {};
    containerCtx._root = containerCtx._root ? !rootExpressions ? id : containerCtx._root + "." + id : id;
    if (!rootExpressions) {
      rootExpressions = d2Container.expressions;
      rootExpressions._path = id;
    } else {
      rootExpressions._path = rootExpressions._path + "." + id;
      rootExpressions[rootExpressions._path] = d2Container.expressions[id];
    }
    _.each(container, function(nestedField, type) {
      var fieldArray = _.isArray(nestedField) ? nestedField : [ nestedField ];
      var fieldCtx = {
        _type: type,
        _root: this._root
      };
      _.each(fieldArray, function(field) {
        var type = this._type;
        var fieldId = field.id;
        ids[field.order] = fieldId;
        if (!FieldConverter.isField(type) && !ContainerConverter.isContainer(type) || typeof field !== "object") {
          return;
        }
        var alpacaField = null;
        if (d2Container.options.fields[container.id].disabled) {
          ancestorOptions.isAncestorDisabled = d2Container.options.fields[container.id].disabled && true;
        }
        if (ContainerConverter.isContainer(type)) {
          if (ContainerConverter.shouldConvertContainer(type, field)) {
            if (type === "tabs") {
              tabLevel = (tabLevel || 0) + 1;
            }
            parentContainer = d2Container;
            alpacaField = ContainerConverter.convertContainer(type, field, options, ancestorOptions, rootExpressions, tabLevel, parentContainer);
          }
        } else {
          alpacaField = FieldConverter.convertField(type, field, options.actionMode, options, ancestorOptions);
        }
        fieldId = field.id;
        rootExpressions._path = rootExpressions._path.indexOf("." + fieldId) > -1 ? rootExpressions._path.substr(0, rootExpressions._path.indexOf(fieldId) - 1) : rootExpressions._path;
        containerOptions[fieldId] = alpacaField.options.fields[fieldId];
        containerOptions[fieldId]["order"] = field.order;
        containerOptions[fieldId]["tabLevel"] = containerOptions[fieldId]["tabLevel"] || tabLevel;
        schema[fieldId] = alpacaField.schema.properties[fieldId];
        data[fieldId] = alpacaField["data"][fieldId];
        options && options.isMassUpdate && alpacaField["multiFileData"] && (multiFileData[fieldId] = alpacaField["multiFileData"][fieldId]);
        rootExpressions[rootExpressions._path + "." + fieldId] = alpacaField["expressions"][fieldId];
      }, fieldCtx);
    }, containerCtx);
    if (rootExpressions._path.indexOf(".") === -1) {
      delete rootExpressions._path;
    }
    return d2Container;
  }
  function convertGrid(grid, options, ancestorOptions, type, rootExpressions) {
    var id = grid.id = grid.id || _.uniqueId("grid_");
    var setContainer = _.extend(fetchAlpacaContainer(grid, options.actionMode));
    var columnsInfo = [];
    var colSchema = grid.header && grid.header.col || [];
    if (!_.isArray(colSchema)) {
      colSchema = [ colSchema ];
    }
    setContainer["options"]["fields"][id] = _.extend({
      fields: {
        item: {
          fields: {}
        }
      },
      label: grid.label,
      toolbarSticky: true,
      _d2Containertype: "d2grid",
      rows_to_display: grid.grid_height,
      showExpanded: false,
      firstColId: colSchema[0] && colSchema[0].id,
      isSetType: true,
      type: options.layoutMode === "singleCol" ? "d2singlearray" : "array",
      row_based_condition: grid.row_based_condition
    }, setContainer["options"]["fields"][id]);
    setContainer["schema"]["properties"][id] = _.extend({
      items: {
        maxItems: 20,
        minItems: 1,
        defaultItems: 1,
        firstColId: colSchema[0] && colSchema[0].id,
        type: "object",
        properties: {}
      },
      type: "array",
      _d2Containertype: "d2grid"
    }, setContainer["schema"]["properties"][id]);
    var rowObj = setContainer["options"]["fields"][id]["fields"]["item"];
    var op = setContainer["options"]["fields"][id]["fields"]["item"]["fields"];
    var schema = setContainer["schema"]["properties"][id]["items"]["properties"];
    var expressions = setContainer["expressions"];
    if (setContainer.options.fields[grid.id].disabled) {
      ancestorOptions.isAncestorDisabled = setContainer.options.fields[grid.id].disabled && true;
    }
    if (rootExpressions) {
      rootExpressions._path = rootExpressions._path + "." + id;
      rootExpressions[rootExpressions._path] = expressions;
    }
    if (grid.no_empty_row) {
      _.extend(rowObj, {
        validator: function(callback) {
          var hasEmptyCell = true;
          for (var i = 0; i < this.children.length; i++) {
            var exp = this.children[i].data instanceof Backbone.Model ? this.children[i].data.get("id") : this.children[i].data;
            if (exp && !_.isEmpty(exp.toString())) {
              hasEmptyCell = false;
              break;
            }
          }
          if (hasEmptyCell !== undefined && hasEmptyCell) {
            this.getFieldEl().addClass("d2-grid-row-invalid");
            callback({
              status: false
            });
            return;
          }
          this.getFieldEl().removeClass("d2-grid-row-invalid");
          callback({
            status: true
          });
        },
        showMessages: false
      });
    }
    var noEmptyCellFields = _.find(colSchema, {
      no_empty_cell: true
    }), noEmptyCellValidation = !!noEmptyCellFields;
    _.each(colSchema, function(col) {
      var fieldId = col.id;
      var colInfo = {};
      _.extend(colInfo, {
        order: col.order,
        type: col.type,
        fieldId: fieldId,
        hidden: col["condition_visible_" + options.actionMode] === false
      });
      if (!FieldConverter.isField(col.type)) {
        col.type = "label";
      }
      if (FormatUtils.isDateType(col.type)) {
        _.extend(colInfo, {
          format: col.value_format
        });
      }
      columnsInfo.push(colInfo);
      if (colInfo.hidden !== true) {
        options = _.extend(_.clone(options), {
          isGridField: true
        });
        var alpacaField = FieldConverter.convertField(col.type, col, options.actionMode, options, ancestorOptions);
        op[fieldId] = alpacaField.options.fields[fieldId];
        schema[fieldId] = alpacaField.schema.properties[fieldId];
        if (op[fieldId]["type"] === "checkbox") {
          schema[fieldId].required = false;
        } else {
          schema[fieldId].no_empty_cell = col.no_empty_cell;
          if (noEmptyCellValidation) {
            _.extend(op[fieldId], {
              validator: function(callback) {
                var fieldFocusOut = this.focusout;
                this.focusout && (this.focusout = false);
                if (this.schema.no_empty_cell) {
                  var hasEmptyCell = false;
                  var data = this.data instanceof Backbone.Model ? this.data.get("id") : this.data;
                  data = data === null ? "" : data;
                  var rows = this.parent.parent.children;
                  var rowIndex = _.findIndex(rows, this.parent);
                  if (_.isEmpty(data.toString())) {
                    if (rowIndex === rows.length - 1) {
                      for (var i = 0; i < this.parent.children.length; i++) {
                        var exp = this.parent.children[i].data instanceof Backbone.Model ? this.parent.children[i].data.get("id") : this.parent.children[i].data;
                        if (exp && !_.isEmpty(exp.toString())) {
                          hasEmptyCell = true;
                          break;
                        }
                      }
                    } else {
                      hasEmptyCell = true;
                    }
                  }
                  if (hasEmptyCell) {
                    if (!$.contains(this.parent.container[0], document.activeElement) || this.validation.custom.status === false || fieldFocusOut === true) {
                      callback({
                        status: false,
                        message: lang.emptyCellInGrid
                      });
                    } else {
                      callback({
                        status: true
                      });
                    }
                    return;
                  }
                } else {
                  for (var index = 0; index < this.parent.children.length; index++) {
                    var child = this.parent.children[index];
                    if (child.schema.no_empty_cell) {
                      if (child.validate()) {
                        child.refreshValidationState(false);
                      }
                    }
                  }
                }
                callback({
                  status: true
                });
              },
              showMessages: true
            });
          }
        }
        schema[fieldId].uniqueItems = col.uniqueness_check;
        var gridField = rootExpressions ? fieldId : id + "." + fieldId;
        expressions[gridField] = alpacaField.expressions[fieldId];
        if (rootExpressions) {
          rootExpressions[rootExpressions._path + "." + fieldId] = alpacaField["expressions"][fieldId];
        }
        op[fieldId].isGridField = true;
        op[fieldId].row_based_condition = grid.row_based_condition;
      }
    }, this);
    var rowData = grid.content && grid.content.row || [];
    if (!_.isArray(rowData)) {
      rowData = [ rowData ];
    }
    setContainer["data"][id] = [];
    if (rowData.length > 0) {
      _.each(rowData, function(row) {
        var cellData = _.isArray(row.cell) ? row.cell : [ row.cell ];
        var obj = {};
        _.each(cellData, function(cell) {
          var colInfo = _.findWhere(columnsInfo, {
            order: cell.order
          });
          if (!colInfo) {
            _.extend(colInfo, {
              order: cell.order,
              fieldId: _.uniqueId("column_")
            });
            columnsInfo.push(colInfo);
          } else {
            if (colInfo.hidden !== true) {
              obj[colInfo.fieldId] = cell.value;
            }
          }
        }, this);
        setContainer["data"][id].push(obj);
      }, this);
    } else {
      var obj = {};
      _.each(_.pluck(columnsInfo, "fieldId"), function(idVal) {
        obj[idVal] = null;
      });
      setContainer["data"][id].push(obj);
    }
    if (options && options.overrideValues) {
      setContainer["data"][id] = [];
      var columns = grid.header.col;
      if (columns) {
        if (!_.isArray(columns)) {
          columns = [ columns ];
        }
        var overrideValues = options.overrideValues, propertyKey = columns[0].id, rowCount = options.overrideValues[propertyKey] && _.isArray(options.overrideValues[propertyKey]) ? options.overrideValues[propertyKey].length : 0, colCount = columns.length;
        if (rowCount > 0 && colCount > 0) {
          for (var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            var row = {};
            for (var colIndex in columns) {
              if (Object.prototype.hasOwnProperty.call(columns, colIndex)) {
                var col = columns[colIndex];
                if (overrideValues[col.id] && _.isArray(overrideValues[col.id]) && overrideValues[col.id].length > 0) {
                  var propertyValue = overrideValues[col.id][rowIndex];
                  if (FormatUtils.isDateType(col.type)) {
                    var overrideDateFormat = options && options.overrideDateFormat;
                    if (propertyValue && FormatUtils.isDateValue(propertyValue)) {
                      propertyValue = FormatUtils.convertToMomentUTC(propertyValue, overrideDateFormat).format(overrideDateFormat);
                    }
                  }
                  row[col.id] = propertyValue;
                }
              }
            }
            setContainer["data"][id].push(row);
          }
        }
        if (rowCount === 0 && colCount > 0) {
          var info = {};
          _.each(_.pluck(columnsInfo, "fieldId"), function(idVal) {
            info[idVal] = null;
          });
          setContainer["data"][id].push(info);
        }
      }
    }
    if (grid.no_empty_row) {
      _.extend(setContainer["options"]["fields"][id], {
        validator: function(callback) {
          var childArr = this.children.length > 0 ? this.children : [];
          var hasEmptyCell;
          var emptyRowArr = [];
          for (var j = 0; j < childArr.length; j++) {
            var cellChildren = childArr[j].children;
            var emptyRowIndex = j;
            hasEmptyCell = true;
            for (var i = 0; i < cellChildren.length; i++) {
              var exp = cellChildren[i].data instanceof Backbone.Model ? cellChildren[i].data.get("id") : cellChildren[i].data;
              if (exp && !_.isEmpty(exp.toString())) {
                hasEmptyCell = false;
                break;
              }
            }
            if (hasEmptyCell !== undefined && hasEmptyCell) {
              emptyRowArr.push(emptyRowIndex + 1);
              break;
            }
          }
          if (emptyRowArr.length > 0) {
            callback({
              status: false,
              message: lang.emptyRowInGrid
            });
            return;
          }
          callback({
            status: true
          });
        }
      });
    }
    return setContainer;
  }
  var ContainerConverter = {
    isContainer: function(type) {
      return _.has(containerMap, type);
    },
    shouldConvertContainer: function(type, container) {
      return this.isContainer(type) && _.isFunction(containerMap[type]) && _.isObject(container);
    },
    convertContainer: function(type, container, options, ancestorOptions, root, tabLevel, parentContainer) {
      if (this.shouldConvertContainer(type, container)) {
        var func = containerMap[type];
        ancestorOptions = ancestorOptions ? _.clone(ancestorOptions) : {};
        func = _.bind(func, this);
        return func(container, options, ancestorOptions, type, root, tabLevel || 0, parentContainer);
      }
    }
  };
  return ContainerConverter;
});