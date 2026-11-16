define([], function(){
  'use strict';

  return Object.freeze({
    MenuTypes: Object.freeze({
      ADMIN_GROUP_CONTEXT: 'PMenuContextAdminGroups'
    }),

    WidgetTypes: Object.freeze({
      ADMIN_GROUPS: 'AdminGroupsWidget'
    }),

    ObjectTypes: Object.freeze({
      USER: 'user',
      GROUP: 'group'
    }),

    LinkrelID: Object.freeze({
      GROUP_MEMBERS: 'http://identifiers.emc.com/linkrel/members'
    })
  });
});