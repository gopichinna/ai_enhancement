/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "i18n!d2/commands/nls/localized.strings", "csui-ext!d2/widgets/tasktable/task.toolbaritems" ], function(_, ToolItemsFactory, TooItemModel, csuiLang, lang, extraToolItems) {
  "use strict";
  var toolbarItems = {
    inlineActionbar: new ToolItemsFactory({}),
    inlineRowActionbar: new ToolItemsFactory({}),
    tileViewInlineActionbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-OpenWorkflow",
        name: lang.CommandNameOpenWorkflowFromTile,
        iconName: "d2_action_go_to_location",
        enabled: true
      } ]
    }, {
      maxItemsShown: 1,
      dropDownText: csuiLang.ToolbarItemMore,
      dropDownIconName: "csui_action_more32"
    }),
    tableHeaderToolbar: new ToolItemsFactory({}),
    tableViewfilterToolbar: new ToolItemsFactory({
      filter: [ {
        signature: "D2-Back",
        name: lang.CommandNameBack,
        className: "task-toolbar-back-button",
        iconName: "csui_action_back32",
        enabled: true
      }, {
        signature: "D2-WidgetTableQueryForm",
        name: lang.queryformExpandTooltip,
        iconName: "csui_action_search32",
        toolItemAria: lang.queryformExpandAria,
        toolItemAriaExpand: false,
        _expanded: true
      } ]
    }),
    tableViewRightToolbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-RefreshList",
        name: lang.CommandNameRefreshList,
        iconName: "csui_action_refresh32",
        enabled: true
      } ]
    }, {
      maxItemsShown: 2
    }),
    detailViewActionBar: new ToolItemsFactory({}, {
      maxItemsShown: 0,
      dropDownIconName: "csui_action_more32",
      dropDownText: csuiLang.ToolbarItemMore,
      lazyActions: false
    }),
    detailViewHeaderDropdown: new ToolItemsFactory({}),
    timelineInlineActionBar: new ToolItemsFactory({
      main: []
    }, {
      notOccupiedSpace: 0,
      maxItemsShown: 1,
      dropDownIconName: "csui_action_more32",
      dropDownText: csuiLang.ToolbarItemMore,
      lazyActions: true
    }),
    attachmentsFileTableRightbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-TableSettings",
        name: lang.CommandNameTableSettings,
        iconName: "d2_action_settings",
        enabled: true,
        allowTableModeChange: true,
        manageWorkflowStatus: true,
        useAdditionalViewContainer: true,
        manageVersions: false
      }, {
        signature: "D2-TableViewClose",
        name: lang.CommandVDocTableViewClose,
        iconName: "d2_action_panel_close",
        className: "task-panel-close-icon",
        enabled: true
      } ]
    }, {
      maxItemsShown: 2
    }),
    workingFileListInlineActionbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-OpenWorkflowFiles",
        iconName: "csui_action_properties32",
        name: csuiLang.ToolbarItemInfo,
        enabled: true,
        promoted: true
      } ]
    }, {
      maxItemsShown: 4,
      dropDownIconName: "csui_action_more32",
      dropDownText: csuiLang.ToolbarItemMore,
      lazyActions: true
    }),
    workingFileTableInlineActionbar: new ToolItemsFactory({
      preview: [ {
        signature: "DocPreview",
        name: csuiLang.ToolbarItemDocPreview,
        iconName: "csui_action_preview32",
        promoted: true
      } ],
      main: [ {
        signature: "D2-OpenWorkflowFiles",
        iconName: "csui_action_properties32",
        name: csuiLang.ToolbarItemInfo,
        enabled: true,
        promoted: true
      } ]
    }, {
      maxItemsShown: 5,
      dropDownIconName: "csui_action_more32",
      dropDownText: csuiLang.ToolbarItemMore,
      lazyActions: true
    }),
    workingFileTableHeaderToolbar: new ToolItemsFactory({
      preview: [ {
        signature: "DocPreview",
        name: csuiLang.ToolbarItemDocPreview,
        iconName: "csui_action_preview32",
        promoted: true
      } ],
      main: [ {
        signature: "D2-OpenWorkflowFiles",
        iconName: "csui_action_properties32",
        name: csuiLang.ToolbarItemInfo,
        enabled: true,
        promoted: true
      } ]
    }, {
      maxItemsShown: 15,
      dropDownIconName: "csui_action_more32",
      dropDownText: csuiLang.ToolbarItemMore,
      lazyActions: true
    }),
    supportingFileListInlineActionbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-OpenWorkflowFiles",
        iconName: "csui_action_properties32",
        name: csuiLang.ToolbarItemInfo,
        enabled: true,
        promoted: true
      }, {
        signature: "D2-WorkflowRemoveAttachment",
        iconName: "d2_action_remove_supporting_file",
        name: lang.CommandNameRemoveAttachment,
        promoted: true
      } ]
    }, {
      maxItemsShown: 4,
      dropDownIconName: "csui_action_more32",
      dropDownText: csuiLang.ToolbarItemMore,
      lazyActions: true
    }),
    supportingFileTableInlineActionbar: new ToolItemsFactory({
      preview: [ {
        signature: "DocPreview",
        name: csuiLang.ToolbarItemDocPreview,
        iconName: "csui_action_preview32",
        promoted: true
      } ],
      main: [ {
        signature: "D2-OpenWorkflowFiles",
        iconName: "csui_action_properties32",
        name: csuiLang.ToolbarItemInfo,
        enabled: true,
        promoted: true
      }, {
        signature: "D2-WorkflowRemoveAttachment",
        iconName: "d2_action_remove_supporting_file",
        name: lang.CommandNameRemoveAttachment,
        promoted: true
      } ]
    }, {
      maxItemsShown: 5,
      dropDownIconName: "csui_action_more32",
      dropDownText: csuiLang.ToolbarItemMore,
      lazyActions: true
    }),
    supportingFileTableHeaderToolbar: new ToolItemsFactory({
      preview: [ {
        signature: "DocPreview",
        name: csuiLang.ToolbarItemDocPreview,
        iconName: "csui_action_preview32",
        promoted: true
      } ],
      main: [ {
        signature: "D2-OpenWorkflowFiles",
        iconName: "csui_action_properties32",
        name: csuiLang.ToolbarItemInfo,
        enabled: true,
        promoted: true
      } ]
    }, {
      maxItemsShown: 15,
      dropDownIconName: "csui_action_more32",
      dropDownText: csuiLang.ToolbarItemMore,
      lazyActions: true
    }),
    clone: function() {
      return ToolItemsFactory.cloneToolbarItems(this);
    }
  };
  if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }
  function addExtraToolItems(extraToolItems) {
    _.each(extraToolItems, function(moduleToolItems) {
      _.each(moduleToolItems, function(toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error("Invalid target toolbar: " + key);
        }
        _.each(toolItems, function(toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }
  return toolbarItems;
});