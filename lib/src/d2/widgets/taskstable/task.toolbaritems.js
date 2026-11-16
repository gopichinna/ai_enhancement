/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "i18n!d2/commands/nls/localized.strings", "csui-ext!d2/widgets/tasktable/task.toolbaritems" ], function(_, ToolItemsFactory, TooItemModel, csuiLang, lang, extraToolItems) {
  "use strict";
  var toolbarItems = {
    inlineActionbar: new ToolItemsFactory({}),
    inlineRowActionbar: new ToolItemsFactory({}),
    auditInlineActionbar: new ToolItemsFactory({}),
    tableViewfilterToolbar: new ToolItemsFactory({
      filter: [ {
        signature: "D2-Back",
        name: lang.CommandNameBack,
        className: "task-toolbar-back-button",
        iconName: "csui_action_back32",
        enabled: true
      }, {
        signature: "Filter",
        name: csuiLang.ToolbarItemFilter,
        iconName: "csui_action_filter32",
        toolItemAria: csuiLang.ToolbarItemFilterAria,
        toolItemAriaExpand: false,
        tasksFilter: true,
        _expanded: true
      } ]
    }),
    tableViewLeftToolbar: new ToolItemsFactory({
      main: []
    }, {
      maxItemsShown: 1
    }),
    tableViewRightToolbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-RefreshList",
        name: lang.CommandNameRefreshList,
        iconName: "csui_action_refresh32",
        enabled: true
      }, {
        signature: "D2-TableSettings",
        name: lang.CommandNameTableSettings,
        iconName: "d2_action_settings",
        enabled: true,
        allowTableModeChange: true,
        useAdditionalViewContainer: false,
        manageVersions: false,
        fixedColumns: [ "task_subject", "sent_by", "date_sent", "due_date", "priority", "supervisor_name" ]
      } ]
    }, {
      maxItemsShown: 2
    }),
    taskPerformersActionbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-WorkflowUpdatePerformers",
        name: lang.CommandNameUpdatePerformer,
        iconName: "d2_action_update_performer"
      } ]
    }, {
      maxItemsShown: 1
    }),
    detailViewActionBar: new ToolItemsFactory({}),
    detailViewHeaderDropdown: new ToolItemsFactory({}),
    attachmentsFileTableRightbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-TableSettings",
        name: lang.CommandNameTableSettings,
        iconName: "d2_action_settings",
        enabled: true,
        allowTableModeChange: true,
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
        signature: "D2-OpenTaskFiles",
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
        signature: "D2-OpenTaskFiles",
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
        signature: "D2-OpenTaskFiles",
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
        signature: "D2-OpenTaskFiles",
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
        signature: "D2-OpenTaskFiles",
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
        signature: "D2-OpenTaskFiles",
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
    filesMetadataHeaderDropdown: new ToolItemsFactory({
      main: [ {
        signature: "D2-WorkflowRemoveAttachment",
        name: lang.CommandNameRemoveAttachment,
        promoted: true
      } ]
    }),
    filesMetadataRightBar: new ToolItemsFactory({
      main: [ {
        signature: "D2-RestoreMiniviewer",
        name: lang.CommandRestoreMiniviewer,
        enabled: true,
        icon: "icon d2-icon-restore-miniviewer"
      } ]
    }, {
      maxItemsShown: 1
    }),
    filesRelationTableInlineActionbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-WorkflowAddFileRelationsAsAttachments",
        name: lang.CommandNameAddFileRelationsAsAttachments,
        iconName: "d2_action_add_as_task_supporting_file"
      } ]
    }, {
      maxItemsShown: 5,
      dropDownIconName: "csui_action_more32",
      lazyActions: false
    }),
    filesRelationTableSelectionToolbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-WorkflowAddFileRelationsAsAttachments",
        name: lang.CommandNameAddFileRelationsAsAttachments
      } ]
    }, {
      maxItemsShown: 5,
      dropDownIconName: "csui_action_more32",
      lazyActions: false
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