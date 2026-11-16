define([
  '<%= namespace %>/utils/constants'
], function(constants) {
  'use strict';

  return [{
      applicationScope: '<%= namespace %>',
      widgetType: constants.WidgetTypes.ADMIN_GROUPS,
      perspectiveJson: '<%= namespace %>/utils/perspectives/admin.groups.perspective.json'
  }];
});
