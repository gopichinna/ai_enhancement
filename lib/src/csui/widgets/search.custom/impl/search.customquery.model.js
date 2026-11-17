/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/utils/url" ], function(_, $, Backbone, ConnectableMixin, FetchableMixin, Url) {
  var SearchCustomModel = Backbone.Model.extend({
    constructor: function SearchCustomModel(attributes, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.makeConnectable(options).makeFetchable(options);
    }
  });
  ConnectableMixin.mixin(SearchCustomModel.prototype);
  FetchableMixin.mixin(SearchCustomModel.prototype);
  _.extend(SearchCustomModel.prototype, {
    isFetchable: function() {
      return this.options.node.isFetchable();
    },
    url: function() {
      return Url.combine(this.connector.connection.url, "searchqueries/" + this.get("id"));
    },
    updateLablesForCategoryFields: function(schema, options) {
      let categoryIds = [];
      let subCategoryTitles = {};
      Object.entries(schema?.properties?.Category?.properties ?? {}).forEach(([ categoryId, categorySchema ]) => {
        Object.entries(categorySchema?.properties ?? {}).forEach(([ subCategoryId, subCategorySchema ]) => {
          if (subCategorySchema?.type === "object" && subCategorySchema?.title) {
            if (!categoryIds.includes(categoryId)) {
              categoryIds.push(categoryId);
            }
            subCategoryTitles[subCategoryId] = subCategorySchema.title;
          }
        });
      });
      categoryIds.forEach(categoryId => {
        Object.entries(options?.fields?.Category?.fields?.[categoryId]?.fields ?? {}).forEach(([ subCategoryId, subCategorySchema ]) => {
          if (subCategorySchema?.fields) {
            Object.values(subCategorySchema.fields).forEach(field => {
              field.label += ` (${subCategoryTitles[subCategoryId]})`;
            });
          }
        });
      });
    },
    parse: function(response, options) {
      response.name = response.text;
      if (response.schema?.properties?.Category) {
        this.updateLablesForCategoryFields(response.schema, response.options);
      }
      return response;
    }
  });
  return SearchCustomModel;
});