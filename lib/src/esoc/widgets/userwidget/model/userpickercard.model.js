/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/models/resource", "esoc/widgets/userwidget/util" ], function(_, Backbone, ResourceModel, Util) {
  var UserPickerCardModel = Backbone.Model.extend(_.extend({}, ResourceModel(Backbone.Model), {
    defaults: {
      className: "esoc-picker-view csui-userpicker-item"
    },
    constructor: function UserPickerCardModel(options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },
    parse: function(data, options) {
      var memberData = data.data.properties;
      memberData.display_name = memberData.name_formatted;
      memberData.department_name = memberData.group_id_expand ? memberData.group_id_expand.name : "";
      Util.setRelationModel(memberData, {
        following: memberData.following,
        selfUser: memberData.self
      });
      return memberData;
    }
  }));
  return UserPickerCardModel;
});