/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "i18n!csui/models/widget/nls/lang" ], function(_, Backbone, lang) {
  "use strict";
  var TasksFilesColumnModel = Backbone.Model.extend({
    idAttribute: null,
    constructor: function TasksFilesColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        attributes.title = lang[attributes.column_key];
      }
      Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });
  return Backbone.Collection.extend({
    model: TasksFilesColumnModel,
    resetTasksFilesCollection: function(response, options) {
      var columns;
      if (response && response.columns) {
        columns = _.map(response.columns, function(column) {
          return new TasksFilesColumnModel(column);
        });
      }
      this.reset(columns, options);
      this.fetched = true;
    }
  });
});