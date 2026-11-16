define([
  'nuc/lib/underscore',
  'd2/sdk/models/node.model',
  '<%= namespace %>/utils/constants'
], function (_, NodeModel, constants) {
  'use strict';

  var GroupModel = NodeModel.extend({
    defaults: {
      type: constants.ObjectTypes.GROUP
    },
    constructor: function GroupModel(attributes, options) {
      options = options || {};
      this.options = options;

      GroupModel.__super__.constructor.call(this, attributes, options);
    },

    parse: function (response) {
      return _.extend(response, { name: response['group_display_name'], id: response['r_object_id']});
    }
  });

  var origSetNonPromotedActionOptions = GroupModel.prototype.setNonPromotedActionsOptions;
  GroupModel.prototype.setNonPromotedActionsOptions = function(options) {
    options = options || {};
    return origSetNonPromotedActionOptions.call(this, _.extend(options, {isNonPromoted: true}));
  };

  return GroupModel;
});
