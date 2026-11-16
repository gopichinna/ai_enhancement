/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/utils/promoted.actionitems", "nuc/models/mixins/rules.matching/rules.matching.mixin", "csui/controls/toolbar/toolitem.model", "csui/controls/toolbar/toolitems.factory", "csui/widgets/search.results/toolbaritems", "csui/widgets/nodestable/headermenuitems", "csui/widgets/metadata/header.dropdown.menu.items", "csui/widgets/navigation.header/profile.menuitems", "d2/widgets/d2collections.perspective/impl/d2collections.toolbaritems", "d2/widgets/nodestable/toolbaritems", "d2/widgets/widgettile/tileview.toolbaritems", "d2/widgets/tasks/tileview.toolbaritems", "d2/widgets/taskstable/task.toolbaritems", "d2/widgets/workflowstable/workflow.toolbaritems", "d2/widgets/metadata/panels/renditions/metadata.renditions.toolbaritems", "d2/widgets/metadata/panels/locations/metadata.locations.toolbaritems", "d2/widgets/metadata/panels/audit/metadata.audit.toolbaritems", "d2/widgets/metadata/panels/relations/metadata.relations.toolbaritems", "d2/widgets/metadata/panels/versions/metadata.versions.toolbaritems", "d2/widgets/savedsearchestable/impl/savedsearch.toolbaritems", "d2/commands/node.actions.rules", "d2/server.adaptors/models/impl/user.actions.rules", "d2/server.adaptors/models/impl/vdoc.actions.rules", "dctmw/utils/utils", "d2/utils/constants", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "i18n!d2/commands/nls/localized.strings" ], function(require, _, promotedActions, RulesMatchingMixin, ToolItemModel, ToolItemsFactory, searchResultToolItems, nodesTableHeaderToolItems, metadataHeaderToolItems, profileItems, d2collectionsToolbaritems, nodesTableToolItems, tileToolItems, tasksTileToolItems, tasksTableToolItems, workflowsTableToolItems, renditionToolItems, locationsToolItems, AuditsToolItems, relationToolItems, versionToolItems, savedSearchToolItems, nodeActionRules, userActionRules, vDocActionRules, utils, constants, lang, langD2Commands) {
  "use strict";
  var actionPreview = {
    signature: "DocPreview",
    name: "View",
    iconName: "csui_action_preview32",
    promoted: true
  }, actionProperties = {
    signature: "Properties",
    name: lang.ToolbarItemInfo,
    iconName: "csui_action_properties32",
    promoted: true
  }, actionPropertiesWOIcon = {
    signature: "Properties",
    name: lang.ToolbarItemInfo,
    promoted: true
  }, iconOnlyActions = [ {
    signature: "Aviator-LaunchChat",
    iconName: "aie_action_aviator32"
  } ];
  function getGroupedActionsForMenuType(actionItems) {
    var groupedActions = {};
    function groupActions() {
      if (actionItems && actionItems.length > 0) {
        var separatorIndex = _.indexOf(_.pluck(actionItems, "signature"), "separator");
        if (separatorIndex > -1) {
          var groupActionItems = actionItems.splice(0, separatorIndex + 1);
          groupActionItems.pop();
          if (groupActionItems.length > 0) {
            groupedActions[_.uniqueId("menu_group_")] = groupActionItems;
          }
          groupActions();
        } else {
          groupedActions[_.uniqueId("menu_group_")] = actionItems;
        }
      }
    }
    groupActions();
    return groupedActions;
  }
  function getGroupedActions(key, actionItems, defaultAction, clone) {
    var groupedActions = {};
    if (clone !== false || defaultAction && defaultAction.prependActions) {
      actionItems = _.deepClone(actionItems);
    }
    if (defaultAction) {
      if (defaultAction.actionItemGroups && _.keys(defaultAction.actionItemGroups).length > 0) {
        _.extend(groupedActions, defaultAction.actionItemGroups);
      } else if (defaultAction.prependActions && defaultAction.prependActions.length > 0) {
        var menuType = actionItems && actionItems[0] && actionItems[0].actionProperties && actionItems[0].actionProperties.menuType, i;
        for (i = defaultAction.prependActions.length - 1; i >= 0; i--) {
          var prependActionItem = defaultAction.prependActions[i];
          prependActionItem = _.deepClone(prependActionItem);
          if (prependActionItem) {
            prependActionItem.actionProperties = prependActionItem.actionProperties || {};
            if (!prependActionItem.actionProperties.menuType && menuType) {
              prependActionItem.actionProperties.menuType = menuType;
            }
            actionItems.unshift(prependActionItem);
          }
        }
      }
    }
    var actionItemWithSeperator = actionItems && _.isArray(actionItems) && actionItems.length > 0 && _.findWhere(actionItems, {
      signature: "separator"
    });
    if (actionItemWithSeperator) {
      var actionsByMenuType = _.groupBy(actionItems, function(actionItem) {
        return actionItem && actionItem.actionProperties && actionItem.actionProperties.menuType;
      });
      if (actionsByMenuType && _.keys(actionsByMenuType).length > 0) {
        _.each(actionsByMenuType, function(actionByMenuType) {
          _.extend(groupedActions, getGroupedActionsForMenuType(actionByMenuType));
        });
      }
    } else {
      groupedActions[key] = actionItems;
    }
    return groupedActions;
  }
  function setClassForIconOnlyAction(toolBarItems, iconOnlyActionList) {
    if (toolBarItems && iconOnlyActionList) {
      _.each(iconOnlyActionList, iconOnlyAction => {
        if (iconOnlyAction && iconOnlyAction.signature && iconOnlyAction.iconName) {
          let toolItem = toolBarItems.collection.findWhere({
            signature: iconOnlyAction.signature
          });
          if (toolItem) {
            toolItem.set("iconName", iconOnlyAction.iconName);
          }
        }
      });
    }
  }
  function sortMenuActions(menuActions) {
    var sortedActions = [];
    while (menuActions.length > 0) {
      var action = menuActions.shift();
      if (action.flyout !== undefined && action.subItemOf !== undefined) {
        var flyout = action.flyout;
        var index = _.findIndex(menuActions, function(ac) {
          return ac.flyout === flyout && ac.subItemOf === undefined;
        });
        if (index !== -1) {
          sortedActions.push(menuActions[index]);
          menuActions.splice(index, 1);
        }
      }
      sortedActions.push(action);
    }
    return sortedActions;
  }
  function removeIconFromAction(action) {
    if (action) {
      if (!action.actionProperties) {
        action.actionProperties = {};
      }
      action.actionProperties.iconLessAction = true;
      delete action.icon;
      delete action.iconName;
    }
  }
  function setFlyoutForActionItems(actionItems) {
    var actionFlyoutMap = [];
    function setFlyoutForActionItem(parentActionItem) {
      if (parentActionItem && parentActionItem.properties && parentActionItem.properties.flyout) {
        var childActionItems = _.filter(actionItems, function(item) {
          return parentActionItem.id === item["parent-id"];
        });
        if (childActionItems && childActionItems.length > 0) {
          _.each(childActionItems, function(childActionItem) {
            if (childActionItem && childActionItem.properties && childActionItem.id !== "separator") {
              childActionItem.properties.flyout = parentActionItem.properties.flyout;
              if (childActionItem.properties.subMenuType) {
                setFlyoutForActionItem(childActionItem);
              }
            }
          });
        }
      }
    }
    if (actionItems && actionItems.length > 0) {
      _.each(actionItems, function(actionItem) {
        if (actionItem && actionItem.properties && actionItem.properties.subMenuType && !actionItem["parent-id"]) {
          actionItem.properties.flyout = actionFlyoutMap[actionItem.id] || _.uniqueId("flyout_");
          actionFlyoutMap[actionItem.id] = actionItem.properties.flyout;
          setFlyoutForActionItem(actionItem);
        }
      });
    }
  }
  return {
    loadUserMenu: function(masterActionsList) {
      profileItems["profileMenu"] = new ToolItemsFactory(getGroupedActions("main", masterActionsList), {
        maxItemsShown: 0,
        dropDownIcon: "icon icon-expandArrowDown",
        dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_caret_down32"
      });
    },
    loadVersionsMenu: function(masterActionsList) {
      masterActionsList = _.reject(masterActionsList, function(action) {
        return action.signature === "D2-Paste" || action.signature === "D2-PasteAsLink";
      });
      var tableHeaderItems = [ {
        signature: "VersionProperties",
        iconName: "csui_action_properties32",
        name: lang.ToolbarItemViewProperties
      } ], defaultAction = {
        actionItemGroups: {
          preview: [ actionPreview ]
        }
      };
      var inlineActionsList = [ {
        signature: "VersionProperties",
        iconName: "csui_action_properties32",
        name: lang.ToolbarItemViewProperties
      } ];
      _.each(masterActionsList, function(action) {
        action = _.deepClone(action);
        if (action.signature === "Delete") {
          action.signature = "VersionDelete";
        }
        inlineActionsList.push(action);
        removeIconFromAction(action);
        tableHeaderItems.push(action);
      });
      versionToolItems["tableHeaderToolbar"] = new ToolItemsFactory(getGroupedActions("main", tableHeaderItems, defaultAction), {
        maxItemsShown: 10,
        dropDownIconName: "csui_action_more32"
      });
      setClassForIconOnlyAction(versionToolItems["tableHeaderToolbar"], iconOnlyActions);
      versionToolItems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", inlineActionsList, defaultAction), {
        maxItemsShown: 5,
        dropDownIconName: "csui_action_more32"
      });
      setClassForIconOnlyAction(versionToolItems["inlineActionbar"], iconOnlyActions);
      versionToolItems["dropdownMenuList"] = new ToolItemsFactory(getGroupedActions("main", tableHeaderItems), {
        maxItemsShown: 0,
        dropDownIcon: "icon icon-expandArrowDown",
        dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_caret_down32"
      });
      metadataHeaderToolItems["versionDropdownMenuList"] = new ToolItemsFactory(getGroupedActions("main", tableHeaderItems), {
        maxItemsShown: 0,
        dropDownIcon: "icon icon-expandArrowDown",
        dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_caret_down32"
      });
      if (utils.isMobile()) {
        var self = this;
        require([ "d2mob/widgets/mobile.versions/mobile.versions.toolbar.items" ], function(mobileVersionsToolbar) {
          self.loadMobileSupportedMenuItems([ mobileVersionsToolbar ], masterActionsList);
        });
      }
    },
    loadRenditionsMenu: function(masterActionsList) {
      var defaultAction = {
        actionItemGroups: {
          preview: [ actionPreview ]
        }
      };
      var inlineActionsList = _.deepClone(masterActionsList);
      masterActionsList = _.clone(masterActionsList);
      _.each(masterActionsList, function(action) {
        removeIconFromAction(action);
      });
      renditionToolItems["tableHeaderToolbar"] = new ToolItemsFactory(getGroupedActions("main", masterActionsList, defaultAction), {
        maxItemsShown: 5,
        dropDownIconName: "csui_action_more32"
      });
      renditionToolItems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", inlineActionsList, defaultAction), {
        maxItemsShown: 5,
        dropDownIconName: "csui_action_more32"
      });
    },
    loadRelationsMenu: function(masterActionsList) {
      var inlineActionsLists = _.deepClone(masterActionsList);
      var tableActionsList = [], defaultAction = {
        prependActions: [ actionPreview, actionProperties ]
      };
      _.each(masterActionsList, function(action) {
        action = _.deepClone(action);
        if (action.signature === "Delete") {
          action.signature = "D2-RelationDelete";
        }
        removeIconFromAction(action);
        tableActionsList.push(action);
      });
      relationToolItems["tableHeaderToolbar"] = new ToolItemsFactory(getGroupedActions("main", tableActionsList, defaultAction), {
        maxItemsShown: 10,
        dropDownIconName: "csui_action_more32"
      });
      setClassForIconOnlyAction(relationToolItems["tableHeaderToolbar"], iconOnlyActions);
      relationToolItems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", inlineActionsLists, defaultAction), {
        maxItemsShown: 5,
        dropDownIconName: "csui_action_more32"
      });
      setClassForIconOnlyAction(relationToolItems["inlineActionbar"], iconOnlyActions);
      var taskFilesRelationTableInlineActionbar = new ToolItemsFactory(getGroupedActions("other", masterActionsList)), taskFilesRelationTableSelectionToolbar = new ToolItemsFactory(getGroupedActions("other", tableActionsList));
      taskFilesRelationTableInlineActionbar.collection.each(function(toolitem) {
        tasksTableToolItems.filesRelationTableInlineActionbar.addItem(toolitem);
      });
      taskFilesRelationTableSelectionToolbar.collection.each(function(toolitem) {
        tasksTableToolItems.filesRelationTableSelectionToolbar.addItem(toolitem);
      });
      if (utils.isMobile()) {
        var self = this;
        require([ "d2mob/widgets/mobile.relations/relations.toolbar.items" ], function(mobileRelationsToolbar) {
          self.loadMobileSupportedMenuItems([ mobileRelationsToolbar ], masterActionsList);
        });
      }
    },
    loadLocationsMenu: function(masterActionsList) {
      var tableHeaderItems = [], inlineActionsList = [], defaultAction = {
        prependActions: [ {
          signature: "D2-metadataProperties",
          iconName: "csui_action_properties32",
          name: lang.ToolbarItemViewProperties
        } ]
      };
      _.each(masterActionsList, function(action) {
        action = _.deepClone(action);
        inlineActionsList.push(action);
        removeIconFromAction(action);
        tableHeaderItems.push(action);
      });
      locationsToolItems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", inlineActionsList, defaultAction), {
        maxItemsShown: 5,
        dropDownIconName: "csui_action_more32"
      });
      locationsToolItems["tableHeaderToolbar"] = new ToolItemsFactory(getGroupedActions("main", tableHeaderItems, defaultAction), {
        maxItemsShown: 10,
        dropDownIconName: "csui_action_more32"
      });
    },
    loadAuditsActionMenu: function(masterActionsList) {
      var tableHeaderItems = [], defaultAction = {
        prependActions: []
      };
      var inlineActionsList = [];
      _.each(masterActionsList, function(action) {
        action = _.deepClone(action);
        inlineActionsList.push(action);
        removeIconFromAction(action);
        tableHeaderItems.push(action);
      });
      AuditsToolItems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", inlineActionsList, defaultAction), {
        maxItemsShown: 5,
        dropDownIconName: "csui_action_more32"
      });
      AuditsToolItems["tableHeaderToolbar"] = new ToolItemsFactory(getGroupedActions("main", tableHeaderItems, defaultAction), {
        maxItemsShown: 10,
        dropDownIconName: "csui_action_more32"
      });
    },
    loadNodesMenu: function(masterActionsList) {
      var defaultAction = {
        prependActions: [ actionPreview, actionProperties ]
      }, defaultTileAction = {
        prependActions: [ actionProperties ]
      }, defaultHeaderAction = {
        prependActions: [ actionPropertiesWOIcon ]
      }, inlineActionsList = _.clone(masterActionsList);
      inlineActionsList = _.reject(inlineActionsList, function(action) {
        return action.signature === "D2-Paste" || action.signature === "D2-PasteAsLink";
      });
      var tableHeaderItems = [];
      _.each(inlineActionsList, function(action) {
        action = _.deepClone(action);
        removeIconFromAction(action);
        tableHeaderItems.push(action);
      });
      var headerMenuToolbar = [];
      _.each(masterActionsList, function(action) {
        action = _.deepClone(action);
        removeIconFromAction(action);
        headerMenuToolbar.push(action);
      });
      nodesTableToolItems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", inlineActionsList, defaultAction), {
        maxItemsShown: 5,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      nodesTableToolItems["tableHeaderToolbar"] = new ToolItemsFactory(getGroupedActions("main", tableHeaderItems, defaultAction), {
        maxItemsShown: 15,
        dropDownIconName: "csui_action_more32",
        dropDownText: lang.ToolbarItemMore,
        lazyActions: true
      });
      setClassForIconOnlyAction(nodesTableToolItems["tableHeaderToolbar"], iconOnlyActions);
      nodesTableHeaderToolItems["headerMenuToolbar"] = new ToolItemsFactory(getGroupedActions("other", headerMenuToolbar, defaultHeaderAction), {
        maxItemsShown: 0,
        dropDownIcon: "icon icon-expandArrowDown",
        dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_caret_down32"
      });
      metadataHeaderToolItems["dropdownMenuList"] = new ToolItemsFactory(getGroupedActions("main", tableHeaderItems), {
        maxItemsShown: 0,
        dropDownIcon: "icon icon-expandArrowDown",
        dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_caret_down32"
      });
      metadataHeaderToolItems["nodeDropdownMenuList"] = new ToolItemsFactory(getGroupedActions("main", tableHeaderItems), {
        maxItemsShown: 0,
        dropDownIcon: "icon icon-expandArrowDown",
        dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_caret_down32"
      });
      searchResultToolItems["otherToolbar"] = new ToolItemsFactory(getGroupedActions("main", tableHeaderItems, defaultAction), {
        maxItemsShown: 15,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32",
        lazyActions: true
      });
      setClassForIconOnlyAction(searchResultToolItems["otherToolbar"], iconOnlyActions);
      searchResultToolItems["inlineToolbar"] = new ToolItemsFactory(getGroupedActions("main", inlineActionsList, defaultAction), {
        maxItemsShown: 5,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      tileToolItems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("other", inlineActionsList, defaultTileAction), {
        maxItemsShown: 1,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      _.each(masterActionsList, function(action) {
        if (action.promoted === true) {
          promotedActions.push(action);
        }
      });
      if (utils.isMobile()) {
        var self = this;
        require([ "mobile/widgets/nodestable/toolbar.items", "mobile/widgets/search.list/toolbar.items", "d2mob/widgets/mobile.recentlyaccessed/toolbar.items", "d2mob/widgets/mobile.favorites/toolbar.items", "d2mob/overrides/mobile/widgets/document.overview/toolbar.items", "d2mob/widgets/mobile.collection.document.list/collection.toolbar.items" ], function(mobileNodeToolbar, mobileSearchToolbar, mobileRecentToolbar, mobileFavoriteToolbar, mobileDocOverviewToolbar, mobileCollectionToolbar) {
          self.loadMobileSupportedMenuItems([ mobileNodeToolbar, mobileSearchToolbar, mobileRecentToolbar, mobileFavoriteToolbar, mobileDocOverviewToolbar, mobileCollectionToolbar ], masterActionsList);
        });
      }
    },
    loadNewObjectMenu: function(masterActionsList) {
      masterActionsList = _.clone(masterActionsList);
      _.each(masterActionsList, function(action) {
        removeIconFromAction(action);
      });
      nodesTableToolItems["addToolbar"] = new ToolItemsFactory(getGroupedActions("create", masterActionsList, {}, false), {
        maxItemsShown: 0,
        dropDownIconName: "csui_action_add32",
        dropDownText: lang.ToolbarItemAddItem,
        addTrailingDivider: true
      });
    },
    loadTasksMenu: function(masterActionsList) {
      var iconLessActionList = _.deepClone(masterActionsList);
      _.each(iconLessActionList, function(action) {
        removeIconFromAction(action);
      });
      workflowsTableToolItems["timelineInlineActionBar"] = new ToolItemsFactory(getGroupedActions("main", masterActionsList), {
        notOccupiedSpace: 0,
        maxItemsShown: 1,
        dropDownIconName: "csui_action_more32",
        dropDownText: lang.ToolbarItemMore,
        lazyActions: true
      });
      tasksTableToolItems["auditInlineActionbar"] = new ToolItemsFactory(getGroupedActions("other", masterActionsList), {
        maxItemsShown: 4,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      tasksTileToolItems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("other", masterActionsList), {
        maxItemsShown: 1,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      tasksTableToolItems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", masterActionsList), {
        maxItemsShown: 4,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      tasksTableToolItems["inlineRowActionbar"] = new ToolItemsFactory(getGroupedActions("main", masterActionsList), {
        maxItemsShown: 1,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      var detailsViewActionsList = _.map(_.deepClone(iconLessActionList), function(ti) {
        var className = "d2-overflow-tooltip binf-btn";
        if (_.contains([ "D2-AcquireTask", "D2-ForwardTask" ], ti.signature)) {
          className += " binf-btn-primary";
        }
        ti.className = className;
        return ti;
      });
      tasksTableToolItems["detailViewActionBar"] = new ToolItemsFactory(getGroupedActions("main", detailsViewActionsList), {
        maxItemsShown: 3,
        dropDownIconName: "csui_action_more32",
        dropDownText: lang.ToolbarItemMore,
        lazyActions: false,
        className: "csui-toolbar binf-nav binf-nav-pills csui-align-left d2-task-details-actionbar"
      });
      var primaryActions = [], secondaryActions = _.reject(_.deepClone(iconLessActionList), function(ti) {
        if (_.contains([ "D2-AcquireTask", "D2-ForwardTask", "D2-RejectTask" ], ti.signature)) {
          primaryActions.push(ti);
          return true;
        }
        return false;
      });
      tasksTableToolItems["detailViewHeaderDropdown"] = new ToolItemsFactory(getGroupedActions("main", primaryActions.concat(secondaryActions), {}, false), {
        maxItemsShown: 0,
        dropDownIconName: "csui_action_more32",
        dropDownText: lang.ToolbarItemMore,
        lazyActions: true,
        className: "csui-toolbar binf-nav binf-nav-pills csui-align-left d2-task-details-header-dropdown"
      });
      _.each(masterActionsList, function(action) {
        if (action.promoted === true) {
          promotedActions.push(action);
        }
      });
      if (utils.isMobile()) {
        var mobileInlineToolbarTaskActionsList = _.deepClone(masterActionsList);
        _.each(mobileInlineToolbarTaskActionsList, function(action) {
          action.icon = "icon " + action.iconName;
          action.menuIcon = "icon " + action.iconName;
          action.suppressProgress = true;
        });
        var mobileContainerToolbarTaskActionsList = _.reject(_.deepClone(mobileInlineToolbarTaskActionsList), {
          signature: "D2-WorkflowManageAttachment"
        });
        require([ "d2mob/widgets/mobile.tasks/task.toolbaritems", "d2mob/widgets/mobile.task.details/task.toolbaritems" ], function(mobileTasksToolItems, mobileTaskDetailsToolItems) {
          var taskPerformers = {
            signature: "D2-TaskPerformers",
            command_key: "D2-TaskPerformers",
            name: langD2Commands.MobileTaskPerformers,
            icon: "icon d2_action_update_performer",
            menuIcon: "icon d2_action_update_performer"
          };
          mobileInlineToolbarTaskActionsList.push(taskPerformers);
          mobileContainerToolbarTaskActionsList.push(taskPerformers);
          mobileTasksToolItems["inlineToolbar"] = new ToolItemsFactory({
            singleSelect: mobileInlineToolbarTaskActionsList
          }, {
            maxItemsShown: 0,
            dropDownIcon: "icon icon-toolbar-more",
            runsInTouchBrowser: true,
            suppressGroupSeparators: [ "notShownAsRow" ]
          });
          mobileTaskDetailsToolItems["containerToolbar"] = new ToolItemsFactory({
            singleSelect: mobileContainerToolbarTaskActionsList
          }, {
            suppressGroupSeparators: [ "notShownAsRow" ]
          });
        });
      }
    },
    loadWorkflowsMenu: function(masterActionsList) {
      var iconLessActionList = _.deepClone(masterActionsList);
      _.each(iconLessActionList, function(action) {
        removeIconFromAction(action);
      });
      workflowsTableToolItems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", masterActionsList), {
        maxItemsShown: 4,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      workflowsTableToolItems["thumbnailInlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", masterActionsList), {
        maxItemsShown: 1,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      workflowsTableToolItems["tableHeaderToolbar"] = new ToolItemsFactory(getGroupedActions("main", iconLessActionList), {
        maxItemsShown: 15,
        dropDownIconName: "csui_action_more32",
        dropDownText: lang.ToolbarItemMore,
        lazyActions: true
      });
      workflowsTableToolItems["detailViewHeaderDropdown"] = new ToolItemsFactory(getGroupedActions("main", iconLessActionList), {
        maxItemsShown: 0,
        dropDownIconName: "csui_action_more32",
        dropDownText: lang.ToolbarItemMore,
        lazyActions: true,
        className: "csui-toolbar binf-nav binf-nav-pills csui-align-left d2-task-details-header-dropdown"
      });
    },
    loadTaskDocumentsMenu: function(masterActionsList) {
      var inlineActionsList = _.clone(masterActionsList);
      inlineActionsList = _.reject(inlineActionsList, function(action) {
        return action.signature === "D2-Paste" || action.signature === "D2-PasteAsLink";
      });
      var tableHeaderItems = [], removeItem = {
        signature: "D2-WorkflowRemoveAttachment",
        name: langD2Commands.CommandNameRemoveAttachment,
        promoted: true
      };
      _.each(inlineActionsList, function(action) {
        action = _.deepClone(action);
        removeIconFromAction(action);
        tableHeaderItems.push(action);
      });
      tableHeaderItems.push(removeItem);
      var taskFilesToolitems = new ToolItemsFactory(getGroupedActions("other", inlineActionsList)), taskFilesMetadataHeaderDropDown = new ToolItemsFactory(getGroupedActions("other", tableHeaderItems));
      taskFilesToolitems.collection.each(function(toolitem) {
        tasksTableToolItems.workingFileListInlineActionbar.addItem(toolitem);
        tasksTableToolItems.workingFileTableInlineActionbar.addItem(toolitem);
        tasksTableToolItems.supportingFileListInlineActionbar.addItem(toolitem);
        tasksTableToolItems.supportingFileTableInlineActionbar.addItem(toolitem);
        workflowsTableToolItems.workingFileListInlineActionbar.addItem(toolitem);
        workflowsTableToolItems.workingFileTableInlineActionbar.addItem(toolitem);
        workflowsTableToolItems.supportingFileListInlineActionbar.addItem(toolitem);
        workflowsTableToolItems.supportingFileTableInlineActionbar.addItem(toolitem);
      });
      taskFilesMetadataHeaderDropDown.collection.each(function(toolitem) {
        tasksTableToolItems.filesMetadataHeaderDropdown.addItem(toolitem);
        tasksTableToolItems.supportingFileTableHeaderToolbar.addItem(toolitem);
        tasksTableToolItems.workingFileTableHeaderToolbar.addItem(toolitem);
        workflowsTableToolItems.supportingFileTableHeaderToolbar.addItem(toolitem);
        workflowsTableToolItems.workingFileTableHeaderToolbar.addItem(toolitem);
      });
      setClassForIconOnlyAction(tasksTableToolItems.workingFileTableHeaderToolbar, iconOnlyActions);
      setClassForIconOnlyAction(tasksTableToolItems.supportingFileTableHeaderToolbar, iconOnlyActions);
      setClassForIconOnlyAction(workflowsTableToolItems.workingFileTableHeaderToolbar, iconOnlyActions);
      setClassForIconOnlyAction(workflowsTableToolItems.workingFileTableHeaderToolbar, iconOnlyActions);
      _.each(masterActionsList, function(action) {
        if (action.promoted === true) {
          promotedActions.push(action);
        }
      });
      if (utils.isMobile()) {
        var self = this;
        require([ "d2mob/widgets/mobile.task.working.files/mobile.task.files.toolbar.items", "d2mob/widgets/mobile.task.supporting.files/impl/toolbar.items" ], function(mobileWorkingFilesToolItems, mobileSupportingFilesToolItems) {
          self.loadMobileSupportedMenuItems([ mobileWorkingFilesToolItems.workingFilesToolbar, mobileSupportingFilesToolItems ], masterActionsList);
        });
      }
    },
    loadVDocMenu: function(masterActionsList) {
      if (!utils.isMobile() && !utils.isAppworks()) {
        require([ "d2/utils/vdoc.toolbaritems" ], function(vDocToolItems) {
          var iconLessMenuItems = [ {
            signature: "D2-ViewVDoc",
            name: langD2Commands.CommandViewVDocName
          } ], menuItems = [].concat(iconLessMenuItems);
          _.each(masterActionsList, function(action) {
            menuItems.push(action);
            action = _.deepClone(action);
            removeIconFromAction(action);
            iconLessMenuItems.push(action);
          });
          var clientSideVDSnapshotDownload = {
            signature: "Download",
            name: langD2Commands.CommandNameDownload,
            icon: "icon icon-toolbar-download",
            commandData: {
              menuId: "clientSideVDSnapshotDownload"
            },
            actionProperties: {
              name: langD2Commands.CommandNameDownload,
              toolTip: langD2Commands.CommandNameDownload,
              isDefault: false,
              isDisabled: false
            },
            promoted: true
          }, defaultAction = {
            actionItemGroups: {
              preview: [ actionPreview ]
            }
          };
          menuItems.push(clientSideVDSnapshotDownload);
          clientSideVDSnapshotDownload = _.clone(clientSideVDSnapshotDownload);
          delete clientSideVDSnapshotDownload.icon;
          iconLessMenuItems.push(clientSideVDSnapshotDownload);
          vDocToolItems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", iconLessMenuItems), {
            maxItemsShown: 1,
            dropDownIconName: "csui_action_more32",
            dropDownText: lang.ToolbarItemMore
          });
          vDocToolItems["editVDInlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", iconLessMenuItems), {
            maxItemsShown: 1,
            dropDownIconName: "csui_action_more32",
            dropDownText: lang.ToolbarItemMore
          });
          vDocToolItems["headerToolbar"] = new ToolItemsFactory(getGroupedActions("main", iconLessMenuItems), {
            maxItemsShown: 15,
            dropDownText: lang.ToolbarItemMore,
            dropDownIconName: "csui_action_more32",
            lazyActions: true
          });
          vDocToolItems["metadataDropdown"] = new ToolItemsFactory(getGroupedActions("other", iconLessMenuItems), {
            maxItemsShown: 0,
            dropDownIcon: "icon icon-expandArrowDown",
            dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_caret_down32",
            dropDownText: lang.ToolbarItemMore,
            lazyActions: true
          });
          vDocToolItems["tableViewHeaderToolbar"] = new ToolItemsFactory(getGroupedActions("main", iconLessMenuItems, defaultAction), {
            maxItemsShown: 15,
            dropDownIconName: "csui_action_more32",
            dropDownText: lang.ToolbarItemMore,
            lazyActions: true
          });
          var tableViewInlineMenus = _.deepClone(menuItems);
          _.each(tableViewInlineMenus, function(menu) {
            if (menu.subItemOf) {
              delete menu.icon;
            }
          });
          vDocToolItems["tableViewInlineActionBar"] = new ToolItemsFactory(getGroupedActions("other", tableViewInlineMenus, defaultAction), {
            maxItemsShown: 5,
            dropDownIconName: "csui_action_more32",
            dropDownText: lang.ToolbarItemMore,
            lazyActions: true
          });
        });
      }
    },
    loadSavedSearchObjectsMenu: function(masterActionsList) {
      var renameActionIdx = _.findIndex(masterActionsList, {
        signature: "Rename"
      }), renameAction = renameActionIdx !== -1 && masterActionsList[renameActionIdx];
      renameAction && (masterActionsList[renameActionIdx] = _.defaults({
        signature: "D2-RenameSearchCategory"
      }, renameAction));
      var inlineActionsList = _.reject(masterActionsList, function(action) {
        return _.contains([ "D2-CreateSearchCategory", "D2-PasteSavedSearch" ], action.signature);
      });
      savedSearchToolItems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", _.deepClone(inlineActionsList)), {
        maxItemsShown: 4,
        dropDownIconName: "csui_action_more32",
        dropDownText: lang.ToolbarItemMore
      });
      _.each(inlineActionsList, removeIconFromAction);
      savedSearchToolItems["tableHeaderToolbar"] = new ToolItemsFactory(getGroupedActions("main", inlineActionsList), {
        maxItemsShown: 4,
        dropDownIconName: "csui_action_more32",
        dropDownText: lang.ToolbarItemMore
      });
      renameAction && (masterActionsList[renameActionIdx] = renameAction);
      var iconLessActionList = _.deepClone(masterActionsList);
      _.each(iconLessActionList, removeIconFromAction);
      savedSearchToolItems["headerMenuToolbar"] = new ToolItemsFactory(getGroupedActions("main", iconLessActionList), {
        maxItemsShown: 4,
        dropDownIconName: "csui_action_more32",
        dropDownText: lang.ToolbarItemMore
      });
      _.each(masterActionsList, function(action) {
        if (action.promoted === true) {
          promotedActions.push(action);
        }
      });
    },
    loadCollectionsMenu: function(collectionList, collectionItemList) {
      var defaultAction = {
        prependActions: [ actionPreview, actionProperties ]
      }, defaultHeaderAction = {
        prependActions: [ actionPropertiesWOIcon ]
      }, inlineActionsList = _.clone(collectionItemList);
      inlineActionsList = _.reject(inlineActionsList, function(action) {
        return action.signature === "D2-Paste" || action.signature === "D2-PasteAsLink";
      });
      var tableHeaderItems = [];
      _.each(inlineActionsList, function(action) {
        action = _.deepClone(action);
        removeIconFromAction(action);
        tableHeaderItems.push(action);
      });
      var headerMenuToolbar = [];
      _.each(collectionList, function(action) {
        action = _.deepClone(action);
        removeIconFromAction(action);
        headerMenuToolbar.push(action);
      });
      var collectionMenuToolbar = [];
      _.each(collectionList, function(action) {
        action = _.deepClone(action);
        collectionMenuToolbar.push(action);
      });
      d2collectionsToolbaritems["inlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", inlineActionsList, defaultAction), {
        maxItemsShown: 5,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      d2collectionsToolbaritems["tileInlineActionbar"] = new ToolItemsFactory(getGroupedActions("main", inlineActionsList, defaultAction), {
        maxItemsShown: 1,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      d2collectionsToolbaritems["tableHeaderToolbar"] = new ToolItemsFactory(getGroupedActions("main", tableHeaderItems, defaultAction), {
        maxItemsShown: 15,
        dropDownIconName: "csui_action_more32",
        dropDownText: lang.ToolbarItemMore,
        lazyActions: true
      });
      setClassForIconOnlyAction(d2collectionsToolbaritems["tableHeaderToolbar"], iconOnlyActions);
      d2collectionsToolbaritems["collectionsInlineToolBar"] = new ToolItemsFactory(getGroupedActions("main", collectionMenuToolbar, defaultHeaderAction), {
        maxItemsShown: 5,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      d2collectionsToolbaritems["collectionsInlineActionBar"] = new ToolItemsFactory(getGroupedActions("main", headerMenuToolbar, defaultHeaderAction), {
        maxItemsShown: 1,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      d2collectionsToolbaritems["headerMenuToolbar"] = new ToolItemsFactory(getGroupedActions("other", headerMenuToolbar, defaultHeaderAction), {
        maxItemsShown: 0,
        dropDownIcon: "icon icon-expandArrowDown",
        dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_caret_down32"
      });
      d2collectionsToolbaritems["dropdownMenuList"] = new ToolItemsFactory(getGroupedActions("main", tableHeaderItems), {
        maxItemsShown: 0,
        dropDownIcon: "icon icon-expandArrowDown",
        dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_caret_down32"
      });
      d2collectionsToolbaritems["nodeDropdownMenuList"] = new ToolItemsFactory(getGroupedActions("main", tableHeaderItems), {
        maxItemsShown: 0,
        dropDownIcon: "icon icon-expandArrowDown",
        dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_caret_down32"
      });
      d2collectionsToolbaritems["inlineToolbar"] = new ToolItemsFactory(getGroupedActions("main", inlineActionsList, defaultAction), {
        maxItemsShown: 5,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: "csui_action_more32"
      });
      _.each(collectionList, function(action) {
        if (action.promoted === true) {
          promotedActions.push(action);
        }
      });
      _.each(collectionItemList, function(action) {
        if (action.promoted === true) {
          promotedActions.push(action);
        }
      });
    },
    loadMobileSupportedMenuItems: function(toolbars, masterActionsList) {
      function addToToolbar(command, toolbar) {
        _.each([ "inlineToolbar", "multiSelectToolbar", "containerToolbar" ], function(toolbarType) {
          toolbar[toolbarType] && toolbar[toolbarType].addItem(command);
        });
      }
      var mobileSupportedMenuTypes = [ constants.MenuTypes.SUBMENU_DOCUMENT_D2_LIFECYCLE_ATTACH, constants.MenuTypes.SUBMENU_DOCUMENT_LIFECYCLE, constants.MenuTypes.SUBMENU_LAUNCH_WORKFLOW ];
      var actionList = _.deepClone(masterActionsList), filteredItems = _.filter(actionList, function(actionItem) {
        var menuType = (actionItem.actionProperties || {}).menuType, subMenuType = (actionItem.actionProperties || {}).subMenuType, doAttach = false;
        if (menuType && _.contains(mobileSupportedMenuTypes, menuType) || subMenuType && _.contains(mobileSupportedMenuTypes, subMenuType)) {
          doAttach = true;
        } else if (actionItem.signature === "D2-LifeCycleStateChange" || actionItem.signature === "D2-LaunchWorkflow" || actionItem.signature === "placeholder") {
          doAttach = true;
        }
        if (doAttach) {
          var iconName = actionItem.iconName || "";
          actionItem.icon = "icon " + iconName;
          actionItem.menuIcon = "icon " + iconName;
        }
        return doAttach;
      });
      var groupedActions = new ToolItemsFactory(getGroupedActions("other", filteredItems));
      _.each(toolbars, function(toolbar) {
        groupedActions.collection.each(function(lifecycleCommand) {
          addToToolbar(lifecycleCommand, toolbar);
        });
      });
    },
    loadActionsForMenuContext: function(actionItems) {
      var self = this;
      actionItems = actionItems || [];
      var actionMatcher = RulesMatchingMixin.mixin({});
      actionMatcher.findRule = function(query, rulesType) {
        var me = this, actionRules = rulesType === constants.MenuTypes.USER ? userActionRules : _.contains([ constants.MenuTypes.VDOC, constants.MenuTypes.VDOC_SNAPSHOT, constants.MenuTypes.SUBMENU_VD_ADD_CHILD, constants.MenuTypes.SUBMENU_VD_REPLACE_CHILD ], rulesType) ? vDocActionRules : nodeActionRules;
        return _.find(actionRules, function(rule) {
          return me.matchRules(query, rule);
        });
      };
      var nodeActions = [], vDocActions = [], newObjectActions = [], tasksActions = [], workflowsActions = [], taskDocumentsActions = [], versionActions = [], userActions = [], relationActions = [], renditionActions = [], savedSearchObjectActions = [], d2CollectionsActions = [], d2CollectionItemsActions = [], locationsActions = [], auditActions = [];
      setFlyoutForActionItems(actionItems);
      _.each(actionItems, function(item) {
        var menuType = item.properties && item.properties.menuType;
        var rule = actionMatcher.findRule(item, menuType);
        if (rule) {
          var action = {
            signature: item.properties && item.properties.subMenuType ? item.id : rule.command_key,
            name: item.properties.name,
            icon: rule.icon,
            iconName: rule.iconName,
            commandData: _.extend({}, item.actionParameters, {
              menuId: item.id
            }),
            subItemOf: item["parent-id"],
            actionProperties: item.properties,
            promoted: item.promoted,
            type: rule.type,
            dynamic: item.actionParameters && item.actionParameters.dynamic
          };
          if (item.properties && item.properties.flyout) {
            action.flyout = item.properties.flyout;
          }
          var submenuAction = false;
          if (item.properties && item.properties.subMenuType) {
            submenuAction = true;
            _.extend(action, {
              csuiNonPromotedItem: item.promoted === false
            });
          } else if (action.subItemOf !== undefined) {
            submenuAction = true;
            delete action.icon;
            delete action.iconName;
          }
          if (submenuAction === true && action.actionProperties && !!action.actionProperties.rootMenuType) {
            menuType = action.actionProperties.rootMenuType;
          }
          switch (menuType) {
           case constants.MenuTypes.CONTEXT:
            nodeActions.push(action);
            if (action.signature === "D2-OpenVDoc") {
              var actionOpenVD = _.deepClone(action);
              delete actionOpenVD.commandData["menuId"];
              vDocActions.push(actionOpenVD);
            }
            break;

           case constants.MenuTypes.VDOC:
           case constants.MenuTypes.VDOC_SNAPSHOT:
           case constants.MenuTypes.SUBMENU_VD_ADD_CHILD:
           case constants.MenuTypes.SUBMENU_VD_REPLACE_CHILD:
            vDocActions.push(action);
            break;

           case constants.MenuTypes.NEW_OBJECT:
            newObjectActions.push(action);
            break;

           case constants.MenuTypes.SAVED_SEARCH:
            savedSearchObjectActions.push(action);
            break;

           case constants.MenuTypes.TASKS:
            tasksActions.push(action);
            break;

           case constants.MenuTypes.TASK_DOCUMENTS:
            taskDocumentsActions.push(action);
            break;

           case constants.MenuTypes.WORKFLOWS:
            workflowsActions.push(action);
            break;

           case constants.MenuTypes.DETAIL_RELATIONS:
            relationActions.push(action);
            break;

           case constants.MenuTypes.DETAIL_LOCATIONS:
            locationsActions.push(action);
            break;

           case constants.MenuTypes.DETAIL_AUDIT:
            auditActions.push(action);
            break;

           case constants.MenuTypes.DETAIL_RENDITIONS:
            renditionActions.push(action);
            break;

           case constants.MenuTypes.DETAIL_VERSIONS:
            versionActions.push(action);
            break;

           case constants.MenuTypes.USER:
            userActions.push(action);
            break;

           case constants.MenuTypes.COLLECTIONS:
            d2CollectionsActions.push(action);
            break;

           case constants.MenuTypes.COLLECTION_ITEMS:
            d2CollectionItemsActions.push(action);
            break;
          }
        }
      }.bind(actionItems));
      nodeActions = sortMenuActions(nodeActions);
      tasksActions = sortMenuActions(tasksActions);
      taskDocumentsActions = sortMenuActions(taskDocumentsActions);
      vDocActions = sortMenuActions(vDocActions);
      versionActions = sortMenuActions(versionActions);
      renditionActions = sortMenuActions(renditionActions);
      relationActions = sortMenuActions(relationActions);
      d2CollectionsActions = sortMenuActions(d2CollectionsActions);
      d2CollectionItemsActions = sortMenuActions(d2CollectionItemsActions);
      auditActions = sortMenuActions(auditActions);
      locationsActions = sortMenuActions(locationsActions);
      self.loadNodesMenu(nodeActions);
      self.loadNewObjectMenu(newObjectActions);
      self.loadTasksMenu(tasksActions);
      self.loadTaskDocumentsMenu(taskDocumentsActions);
      self.loadWorkflowsMenu(workflowsActions);
      self.loadRelationsMenu(relationActions);
      self.loadLocationsMenu(locationsActions);
      self.loadRenditionsMenu(renditionActions);
      self.loadVersionsMenu(versionActions);
      self.loadUserMenu(userActions);
      self.loadVDocMenu(vDocActions);
      self.loadSavedSearchObjectsMenu(savedSearchObjectActions);
      self.loadCollectionsMenu(d2CollectionsActions, d2CollectionItemsActions);
      self.loadAuditsActionMenu(auditActions);
    }
  };
});