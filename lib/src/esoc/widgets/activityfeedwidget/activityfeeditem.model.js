/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/backbone" ], function($, Backbone, config) {
  var ActivityFeedItemModel = Backbone.Model.extend({
    defaults: {
      id: 0,
      data_id: 0,
      created_at: "-",
      text: "-",
      feed_event_type: 0,
      user: {
        name: "-",
        screen_name: "-",
        profile_image_url: "-"
      },
      noMoreData: true
    },
    constructor: function ActivityFeedItemModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  return ActivityFeedItemModel;
});