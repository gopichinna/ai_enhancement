/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "dctmw/utils/rest.resources", "d2/utils/graphics/graphics.resources", "d2/utils/rest.linkrels", "d2/utils/constants" ], function(_, Backbone, Url, ConnectableMixin, RestResources, GraphicsResources, RestLinkrels, constants) {
  var ColumnModel = Backbone.Model.extend({
    idAttribute: "name"
  });
  var ColumnCollection = Backbone.Collection.extend({
    model: ColumnModel
  });
  var ColumnPreferenceModel = Backbone.Model.extend({
    idAttribute: "colType",
    constructor: function ColumnPreferenceModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options);
      this.options = options || {};
      this.columns = new ColumnCollection();
    },
    url: function() {
      var url, user = RestResources.getCurrentUser(), baseUrl = RestLinkrels.getLink(user.get("preferences").links, RestLinkrels.D2_COLUMN_PREFERENCES);
      if (this.get("colType")) {
        url = Url.combine(baseUrl, encodeURIComponent(this.get("colType")));
      } else {
        var parameters = {
          inline: true,
          "widget-type": this.options.widgetType,
          "widget-name": this.options.widgetName
        };
        if (this.options.defaultType) {
          _.extend(parameters, {
            "default-type": this.options.defaultType
          });
        }
        url = Url.appendQuery(baseUrl, Url.combineQueryString(parameters));
      }
      return url;
    },
    parse: function(response) {
      var output = this.get("colType") ? response : response.entries && response.entries[0] ? response.entries[0].content : {};
      if (_.has(output, "columns")) {
        this.columns = new ColumnCollection(output.columns);
        delete output.columns;
      }
      GraphicsResources.updateCellRegistry(this.columns, "name");
      return output;
    },
    sync: function(method, model, options) {
      if (method === "read") {
        options.url = Url.appendQuery(this.url(), Url.combineQueryString({
          "include-widget-info": true
        }));
      }
      if (method === "update") {
        options.headers = _.extend(options.headers || {}, {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        });
        options.url = Url.appendQuery(this.url(), Url.combineQueryString({
          "create-if-absent": true
        }));
        this.unset("links");
        this.set("columns", _.map(this.columns.models, function(model) {
          return _.clone(model.attributes);
        }));
      }
      return Backbone.Model.prototype.sync.apply(this, arguments);
    }
  });
  ConnectableMixin.mixin(ColumnPreferenceModel.prototype);
  return ColumnPreferenceModel;
});