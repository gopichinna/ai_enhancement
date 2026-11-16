/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/utils/commandhelper", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitems.filtered.model", "dctmw/utils/utils" ], function(_, CommandHelper, ToolItemsFactory, FilteredToolItemsCollection, utils) {
  "use strict";
  var proto = FilteredToolItemsCollection.prototype, oldFilterToolitems = proto._filterToolItems, oldRefilter = proto.refilter, oldSet = proto.set;
  proto.comparator = function() {
    return 0;
  };
  proto.refilter = function() {
    if (utils.isMobile()) {
      this.options || (this.options = {});
      this.options.isRefiltering = true;
    }
    oldRefilter.apply(this, arguments);
  };
  proto.set = function(models, options) {
    options.sort = false;
    return oldSet.apply(this, arguments);
  };
  proto._filterToolItems = function(models) {
    var nodes = this.status && this.status.nodes, dynamicActions = [], showDynamicActions = !this.mask ? true : !_.findWhere(this.mask.blacklist, {
      dynamic: true
    }), onlyDynamicActions = !this.mask ? false : _.findWhere(this.mask.whitelist, {
      dynamic: true
    });
    if (utils.isMobile()) {
      if (nodes && nodes.models) {
        _.each(models, function(action) {
          _.find(nodes.models, function(model) {
            var actionModel = CommandHelper.getOriginalAction(model, action.get("signature"), action.get("commandData"));
            var actionProperties = actionModel && actionModel.get("actionProperties");
            if (actionProperties && actionProperties.name) {
              action.set("name", actionProperties.name);
              return true;
            }
          });
        });
      }
    }
    if (nodes && showDynamicActions) {
      nodes.each(function(node) {
        node.actions && node.actions.each(function(action) {
          if (action.get("dynamic")) {
            var existing = _.find(dynamicActions, function(dynamicAction) {
              return isSameAction(action, dynamicAction);
            });
            if (!existing) {
              dynamicActions.push(action);
            }
          }
        });
      });
      if (utils.isMobile()) {
        var options = this.options || {};
        if (dynamicActions.length && (_.isUndefined(options.maxItemsShown) || options.isRefiltering)) {
          _.each(dynamicActions, function(dynamicAction) {
            dynamicAction.set("icon", "icon " + dynamicAction.get("iconName"), {
              silent: true
            });
            dynamicAction.set("menuIcon", "icon " + dynamicAction.get("iconName"), {
              silent: true
            });
          });
          models = addDynamicActions(_.clone(models), dynamicActions, onlyDynamicActions);
        }
        options.isRefiltering = false;
      } else {
        if (dynamicActions.length) {
          models = addDynamicActions(_.clone(models), dynamicActions, onlyDynamicActions);
        }
      }
    }
    function isSameAction(action1, action2) {
      if (action1 === undefined && action2 === undefined) {
        return true;
      } else if (action1 === undefined || action2 === undefined) {
        return false;
      }
      if (action1.get("signature") === action2.get("signature")) {
        if (action1.get("commandData") && action1.get("commandData").menuId) {
          var id = (action2.get("commandData") || {}).menuId;
          return id === action1.get("commandData").menuId;
        } else {
          return true;
        }
      }
      return false;
    }
    function addDynamicActions(toolbarModels, actions, onlyDynamicActions) {
      var groups = _.groupBy(actions, function(action) {
        var commandData = action.get("commandData"), relatedMenuId = commandData && commandData["related-menu-id"];
        return relatedMenuId;
      });
      if (onlyDynamicActions) {
        toolbarModels = [];
      }
      _.each(groups, function(group, key) {
        var groupIndex = _.findIndex(toolbarModels, function(toolbarModel) {
          var commandData = toolbarModel.get("commandData");
          return commandData && commandData.menuId === key;
        });
        if (groupIndex > -1) {
          var placeholderAction = toolbarModels[groupIndex], groupId = placeholderAction.get("group") || _.uniqueId("menu_group_"), placeholderActionProperties = placeholderAction.get("actionProperties"), iconLessIcon = placeholderActionProperties && placeholderActionProperties.iconLessAction, groupedActions = {};
          groupedActions[groupId] = JSON.parse(JSON.stringify(group));
          var toolItems = new ToolItemsFactory(groupedActions);
          if (onlyDynamicActions && toolbarModels.length === 0) {
            toolbarModels.push(toolItems.getCollection().at(0));
          }
          toolItems.getCollection().remove(toolItems.getCollection().at(0));
          if (iconLessIcon) {
            _.each(toolItems.getCollection().models, function(toolItem) {
              toolItem.unset("icon");
              toolItem.unset("iconName");
            });
          }
          if (onlyDynamicActions) {
            groupIndex = 0;
          }
          toolbarModels.splice.apply(toolbarModels, [ groupIndex, 1 ].concat(toolItems.getCollection().models));
        }
      });
      return toolbarModels;
    }
    _.each(models, function(model) {
      if (model && model.get("dynamic") === "true" && model.get("subItemOf")) {
        var parentActionItem = _.find(models, function(item) {
          var commandData = item && item.get("commandData");
          return commandData && commandData.menuId === model.get("subItemOf");
        });
        if (parentActionItem && parentActionItem.get("flyout")) {
          model.set("flyout", parentActionItem.get("flyout"));
        }
      }
    });
    models = _.filter(models, function(item) {
      var commandData = item && item.get("commandData") || {};
      return commandData.type !== "placeholder";
    });
    return oldFilterToolitems.call(this, models);
  };
});