define([
  'nuc/lib/underscore',
  'nuc/models/mixins/rules.matching/rules.matching.mixin',
  'nuc/utils/promoted.actionitems',
  'd2/sdk/commands/node.actions.rules',
  'd2/sdk/controls/toolbar/toolitems.factory',
  '<%= namespace %>/widgets/admin.groups/toolitems',
  'i18n!<%= namespace %>/commands/nls/lang'
], function(_, RulesMatchingMixin, promotedActions, nodeActionRules, ToolItemsFactory, adminGroupToolItems, lang){
  'use strict';

  var actionMatcher = RulesMatchingMixin.mixin({});
  actionMatcher.findRule = function (query) {
    var me = this;
    return _.find(nodeActionRules, function (rule) {
      return me.matchRules(query, rule);
    });
  };

  function loadActionsForGroupContextMenu(actionItems) {
    var adminGroupActions = [];

    _.each(actionItems, function(item){
      /*var menuType = item.properties && item.properties.menuType;*/
      var rule = actionMatcher.findRule(item);

      if (rule) {
        var action = {
          signature: item.properties && item.properties.subMenuType ? item.id : rule.command_key,
          name: item.properties.name,
          icon: rule.icon,
          iconName: rule.iconName,
          commandData: _.extend({}, item.actionParameters, {menuId: item.id}),
          subItemOf: item["parent-id"],
          actionProperties: item.properties,
          promoted: item.promoted,
          type: rule.type,
          dynamic: item.actionParameters && item.actionParameters.dynamic
        };

        /*var submenuAction = false;*/
        if (item.properties && item.properties.subMenuType) {
          //submenuAction = true;
          /* csuiNonPromotedItem is set for actions with valid commands only by csui.
          as sub-menu is not associated with a command, set the attribute , csuiNonPromotedItem here itself */
          _.extend(action, {csuiNonPromotedItem: (item.promoted === false)});
        } else if (action.subItemOf !== undefined) {
          //submenuAction = true;
          //For submenus, we do not need icon. If we pass ICON, CSUI renders ICON only. Hence, do it programatically
          delete action.icon;
          delete action.iconName;
        }

        adminGroupActions.push(action);
        if (action.promoted === true) {
          promotedActions.push(action);
        }
      }
    });

    adminGroupToolItems['inlineActionbar'] = new ToolItemsFactory({main: adminGroupActions}, {
      maxItemsShown: 1,
      dropDownText: lang.ToolbarItemMore,
      dropDownIconName: 'csui_action_more32'
    });
  }

  return {
    loadActionsForGroupContextMenu: loadActionsForGroupContextMenu
  };
});