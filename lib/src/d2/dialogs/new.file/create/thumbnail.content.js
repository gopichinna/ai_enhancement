/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "i18n!d2/controls/thumbnail/content/attribute/nls/lang" ], function(_, Backbone, lang) {
  var ThumbnailContentModel = Backbone.Model.extend({
    idAttribute: "key",
    defaults: {
      key: null,
      sequence: 0
    }
  });
  var ThumbnailContentCollection = Backbone.Collection.extend({
    model: ThumbnailContentModel,
    comparator: "sequence",
    getColumnKeys: function() {
      return this.pluck("key");
    },
    deepClone: function() {
      return new ThumbnailContentCollection(this.map(function(column) {
        return column.attributes;
      }));
    }
  });
  var thumbnailContent = [ {
    key: "template_object_name",
    column_key: "template_object_name",
    sequence: 4,
    definitions_order: 4,
    title: lang.nameLabel,
    type: -1
  }, {
    key: "template_title",
    column_key: "template_title",
    sequence: 5,
    sort: true,
    definitions_order: 5,
    title: lang.titleLabel,
    type: -1
  }, {
    key: "template_subject",
    column_key: "template_subject",
    sort: true,
    sequence: 6,
    definitions_order: 6,
    title: lang.subjectLabel,
    type: -1
  } ];
  var thumbnailContentCollection = new ThumbnailContentCollection(thumbnailContent);
  return thumbnailContentCollection;
});