define([
  'nuc/lib/underscore',
  'd2/sdk/models/node.model',
  '<%= namespace %>/utils/constants'
], function (_, NodeModel, constants) {
  'use strict';

  var MemberModel = NodeModel.extend({
    defaults: {
      type: 'user'
    },

    constructor: function MemberModel(attributes, options) {
      options = options || {};
      this.options = options;

      MemberModel.__super__.constructor.call(this, attributes, options);
    },

    parse: function (response) {
      var type = response['r_is_group'] ? constants.ObjectTypes.GROUP : constants.ObjectTypes.USER;
      return _.extend(response, {name: response['user_name'], id: response['r_object_id'], type: type});
    }
  });

  return MemberModel;
});