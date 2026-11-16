define([
  'd2/sdk/utils/widget.constants',
  '<%= namespace %>/utils/constants'
], function(widgetConstants, constants) {
  'use strict';

  return [{
      type: constants.WidgetTypes.ADMIN_GROUPS,
      icon: 'd2-icon-tile-admingroups',
      tileConfigType: widgetConstants.TileConfigTypes.WIDGET,
      tileView: '<%= namespace %>/widgets/admin.groups',
      applicationScope: '<%= namespace %>'
  }];
});