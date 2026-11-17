/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/converters/task", "d2/server.adaptors/converters/workflow", "d2/utils/constants", "d2/utils/widget.constants", "i18n!d2/server.adaptors/nls/lang" ], function(_, nodeConverter, taskConverter, workflowConverter, constants, widgetConstants, lang) {
  "use strict";
  var sortKeyMap = {
    r_content_size: {
      name: "rContentSize",
      type: 2
    },
    r_full_content_size: {
      name: "rFullContentSize",
      type: 2
    },
    full_content_size: {
      name: "fullContentSize",
      type: 2
    }
  };
  var sortClientKeys = {};
  _.mapObject(sortKeyMap, function(val, key) {
    sortClientKeys[val.name] = key;
  });
  function setType(item, type) {
    switch (type) {
     case 0:
      item["type"] = 5;
      item["type_name"] = "Boolean";
      break;

     case 1:
      item["type"] = 2;
      item["type_name"] = "Integer";
      break;

     case 4:
      item["type"] = -7;
      item["type_name"] = "Date";
      break;

     case 5:
      item["type"] = -4;
      item["type_name"] = "Double";
      break;

     default:
      item["type"] = -1;
      item["type_name"] = "String";
    }
  }
  function getColumnConverter(colPrefId) {
    var converter = nodeConverter;
    if (colPrefId) {
      if (colPrefId.indexOf(constants.ColumnPreferenceId.NODE_INBOX_TASKS) > -1) {
        converter = taskConverter;
      } else if (colPrefId.indexOf(constants.ColumnPreferenceId.DETAIL_WORKFLOW_OVERVIEW_SV) > -1) {
        converter = workflowConverter;
      }
    }
    return converter;
  }
  function convertColumn(input, index, typeInfo, colPrefId, isDictionary) {
    var converter = getColumnConverter(colPrefId);
    var colName = input.get("name"), colKey = converter.getServerClientAttrNameMap()[colName] || colName, output = {
      column_key: colKey,
      key: colKey,
      name: input.get("label"),
      definitions_order: index,
      sort: true,
      title: input.get("label"),
      direction: input.get("direction") || "",
      repeating: input.get("repeating") || false,
      customization_width: input.get("d2sv_width"),
      dictionary: isDictionary
    };
    setType(output, input.get("displaytype") || input.get("type"));
    if (output.type === 2 || output.type === -1) {
      var column_key = colName, keys;
      if (column_key.indexOf(".") === -1) {
        column_key = "dm_sysobject." + column_key;
      }
      keys = column_key.split(".");
      if (_.has(typeInfo, keys[1])) {
        var types = typeInfo[keys[1]];
        if (_.contains(types, keys[0])) {
          output.hasMappedDictionary = true;
        }
      }
    }
    return output;
  }
  return {
    setColumnType: function(col, type) {
      setType(col, type);
    },
    convertColumns: function(colPref, options, typeInfo) {
      var output = [];
      options = options || {};
      var index = 501, colPrefId = colPref.id, isNamingSet = false;
      options.showAllVersion = colPref.get("d2sv_widget_state")?.show_all_version || false;
      options.showMarkupWidgetState = colPref.get("d2sv_widget_state")?.show_markup_status || false;
      if (options.typeColumn !== false) {
        output.push({
          column_key: "type",
          key: "type",
          name: lang.typeColumnLabel,
          sort: false,
          filter: false,
          default_action: true,
          definitions_order: index
        });
        index = index + 10;
      }
      if (options.vdmSequenceColumn) {
        output.push({
          column_key: "vdm-number",
          key: "vdm-number",
          d2_sort_key: "vdm-number",
          filter_key: "vdm-number",
          order: true,
          direction: "asc",
          sort: true,
          filter: true,
          name: lang.vdmSequenceColumnLabel,
          title: lang.vdmSequenceColumnLabel,
          type: -1,
          type_name: "String",
          default_action: true,
          definitions_order: index
        });
        index = index + 10;
      }
      colPref.columns.each(function(column) {
        var colName = column.get("name");
        var documentAttrName = colName;
        if (colName.indexOf(".") > 0) {
          var arr = colName.split(".");
          documentAttrName = arr[1];
        }
        var dictionaryAttrName = _.contains(column.get("name"), ".") ? _.last(column.get("name").split(".")) : column.get("name"), idDictionaryColumn = _.has(typeInfo, dictionaryAttrName), cCol = convertColumn(column, index, typeInfo, colPrefId, idDictionaryColumn), sortCol = sortKeyMap[documentAttrName] && sortKeyMap[documentAttrName]["name"];
        if (sortCol) {
          cCol.d2_sort_type = sortKeyMap[documentAttrName]["type"];
        }
        cCol.d2_sort_key = sortCol || cCol.column_key;
        output.push(cCol);
        index = index + 10;
        if ((cCol.type === -1 || cCol.type === 2 || cCol.type === -7) && isNamingSet === false) {
          isNamingSet = true;
          cCol.default_action = true;
          cCol.isNaming = true;
          cCol.customization_min_width = 280;
          cCol.d2ColumnSequence = 4;
          cCol.customization_pinned = true;
          if (options.showAllVersion === true) {
            output.push({
              column_key: "d2_version_label",
              key: "d2_version_label",
              d2_sort_key: "d2_version_label",
              filter_key: "d2_version_label",
              server_filter_key: "r_version_label",
              order: false,
              sort: true,
              filter: true,
              repeating: true,
              direction: "",
              name: lang.d2VersionColumnLabel,
              title: lang.d2VersionColumnLabel,
              type: -1,
              type_name: "String",
              definitions_order: index
            });
            index = index + 10;
          }
          if (options.reservedColumn !== false) {
            output.push({
              column_key: "reserved",
              key: "reserved",
              name: lang.reservedColumnLabel,
              title: lang.reservedColumnLabel,
              noTitleInHeader: true,
              type: -1,
              filter: false,
              definitions_order: index,
              permanentColumn: true
            });
            cCol.customization_resize_span = "reserved";
            index = index + 10;
          }
          if (options.externalShareColumn) {
            output.push({
              column_key: "d2_external_share",
              key: "d2_external_share",
              name: lang.externalShareColumnLabel,
              title: lang.externalShareColumnLabel,
              noTitleInHeader: true,
              type: -1,
              filter: false,
              definitions_order: index,
              permanentColumn: true
            });
            index = index + 10;
          }
          if (options.locationColumn && options.locationColumn.enabled === true) {
            output.push({
              column_key: "parent_id",
              key: "parent_id",
              d2_sort_key: "parent_name",
              type: -1,
              sort: true,
              filter: false,
              title: options.locationColumn.title || lang.locationColumnLabel,
              definitions_order: index,
              customization_resizeable: false,
              customization_min_width: 200,
              d2ColumnSequence: 5
            });
            index = index + 10;
          }
          if (options.isLocationMetadataWidgetView) {
            output.push({
              column_key: "d2_folder_path",
              key: "d2_folder_path",
              d2_sort_key: "d2_folder_path",
              filter_key: "d2_folder_path",
              order: false,
              sort: false,
              filter: false,
              repeating: true,
              direction: "",
              name: lang.d2RFolderPath,
              title: lang.d2RFolderPath,
              type: -1,
              type_name: "String",
              definitions_order: 520
            });
          }
        }
      });
      if (options.commentColumn === true) {
        output.push({
          key: "wnd_comments",
          column_key: "wnd_comments",
          definitions_order: 998,
          name: "Comment",
          filter: false,
          sort: false,
          type: -1,
          type_name: "String"
        });
      }
      if (options.noteColumn === true) {
        output.push({
          key: "d2_workflow_note",
          column_key: "d2_workflow_note",
          definitions_order: 998,
          name: "note",
          filter: false,
          sort: false,
          type: -1,
          permanentColumn: true,
          noTitleInHeader: true
        });
      }
      if (options.favoriteColumn !== false) {
        output.push({
          column_key: "favorite",
          key: "favorite",
          title: lang.favoriteColumnLabel,
          noTitleInHeader: true,
          filter: false,
          sort: false,
          type: 5,
          definitions_order: 999
        });
      }
      if (options.inlineRowActions === true) {
        output.push({
          column_key: "d2_inline_row_actions",
          key: "d2_inline_row_actions",
          title: lang.inlineRowActionsColumnLabel,
          noTitleInHeader: true,
          filter: false,
          sort: false,
          permanentColumn: true,
          type: 5,
          definitions_order: 990
        });
      }
      return output;
    },
    getSortColumnSchema: function(columns, property) {
      var col = _.find(columns, function(col) {
        return col.column_key === property;
      });
      return {
        key: col && col.d2_sort_key || property,
        type: col && col.d2_sort_type || col && col.type || -1
      };
    },
    isSortColumn: function(col, sortKey) {
      var key = sortClientKeys[sortKey];
      if (key) {
        var colName = col.get("name");
        var attrName = colName;
        if (colName.indexOf(".") > 0) {
          var arr = colName.split(".");
          attrName = arr[1];
        }
        return attrName === key;
      }
      return col.get("name") === sortKey;
    },
    getColumnConverter: function(colPrefId) {
      return getColumnConverter(colPrefId);
    }
  };
});