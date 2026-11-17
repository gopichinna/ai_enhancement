/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui-ext!csui/controls/thumbnail/content/overview/overview.content" ], function(_, Backbone, extraOverviewContent) {
  var OverviewContentModel = Backbone.Model.extend({
    idAttribute: "key",
    defaults: {
      key: null,
      sequence: 0
    }
  });
  var OverviewContentCollection = Backbone.Collection.extend({
    model: OverviewContentModel,
    comparator: "sequence",
    getColumnKeys: function() {
      return this.pluck("key");
    },
    deepClone: function() {
      return new OverviewContentCollection(this.map(function(column) {
        return column.attributes;
      }));
    }
  });
  var overviewContent = [ {
    key: "type",
    sequence: 2,
    defaultAction: false
  }, {
    key: "properties",
    title: "properties",
    sequence: 7
  }, {
    key: "reserved",
    sequence: 100,
    title: "State"
  } ];
  var fixedOrRemovedOverviewContent = [ "type", "properties", "reserved", "wnd_comments" ];
  if (extraOverviewContent) {
    _.each(extraOverviewContent, function(moduleOverviewContent) {
      _.each(moduleOverviewContent, function(contentData, key) {
        overviewContent.push(contentData);
      });
    });
  }
  var overviewContentCollection = new OverviewContentCollection(overviewContent);
  overviewContentCollection.fixedOrRemovedOverviewContent = fixedOrRemovedOverviewContent;
  return overviewContentCollection;
});