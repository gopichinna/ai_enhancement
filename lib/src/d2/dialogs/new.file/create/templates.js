/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/models/browsable/client-side.mixin", "nuc/models/browsable/v2.response.mixin", "d2/dialogs/new.file/create/template", "i18n!d2/dialogs/new.file/create/impl/nls/lang", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/sort.utils", "d2/dialogs/new.file/create/table.columns", "nuc/utils/deepClone/deepClone" ], function(_, $, Backbone, Url, ConnectableMixin, FetchableMixin, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, TemplateModel, lang, RestLinkrels, serverQueryUtils, sortUtils, TemplatesColumnCollection) {
  "use strict";
  var superSyncMethod = Backbone.sync;
  var TemplateCollection = Backbone.Collection.extend({
    model: TemplateModel,
    constructor: function TemplateCollection(attributes, options) {
      options = options || {};
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.options = _.pick(options, [ "connector", "node", "orderBy", "recentlyUsed" ]);
      this.makeConnectable(options).makeFetchable(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options);
      this.columns = TemplatesColumnCollection;
    },
    clone: function() {
      var clone = new this.constructor(this.models, this.options);
      if (this.columns) {
        clone.columns.reset(this.columns.toJSON());
      }
      clone.actualSkipCount = this.actualSkipCount;
      clone.skipCount = this.skipCount;
      clone.topCount = this.topCount;
      clone.totalCount = this.totalCount;
      clone.filteredCount = this.filteredCount;
      clone.filters = _.deepClone(this.filters);
      clone.orderBy = this.orderBy;
      clone.expand = _.clone(this.expand);
      return clone;
    },
    url: function() {
      var url;
      if (this.options.recentlyUsed === true) {
        url = RestLinkrels.getLink(this.options.node.get("links"), RestLinkrels.D2_RECENTLY_USED_TEMPLATES);
      } else {
        url = RestLinkrels.getLink(this.options.node.get("links"), RestLinkrels.D2_DOCUMENT_TEMPLATES);
      }
      var params = {
        scope: this,
        sort: _.isEmpty(this.orderBy) ? false : true
      };
      if (this.options.recentlyUsed === true && params.sort) {
        delete params.sort;
      }
      return serverQueryUtils.appendQueryParams(url, params);
    },
    sync: function(method, model, options) {
      var promise = $.Deferred();
      var me = this;
      var args = arguments;
      $.when(me.fetchData(superSyncMethod, args, options)).done(function() {
        promise.resolve();
      }).fail(function(err) {
        promise.reject(err);
      });
      return promise.promise();
    },
    fetchData: function(superSyncMethod, args, options) {
      var me = this, deferred = $.Deferred();
      var success = options.success;
      options.skipSort = false;
      options.success = function(response) {
        if (response.entries) {
          if (me.options.recentlyUsed === true && response.entries.length > 5) {
            response.entries = _.first(response.entries, 5);
          }
          me.getDataForObjects(response).done(function(results) {
            success.call(options, results, "success", {});
            deferred.resolve();
          });
        } else {
          success.call(options, response, "success", {});
          deferred.resolve();
        }
      };
      options.error = function(request) {
        deferred.reject(request);
      };
      superSyncMethod.apply(me, args);
      return deferred.promise();
    },
    getDataForObjects: function(results) {
      var me = this, deferred = $.Deferred();
      var objectIDs = results.entries.map(function(model) {
        return model.content["r_object_id"];
      });
      var parameters = {
        ids: objectIDs,
        connector: me.options.connector,
        permissions: {
          permissionLevel: "read"
        }
      };
      serverQueryUtils.fetchDataForObjects(parameters).done(function(output) {
        _.each(results.entries, function(item) {
          var id = item.content["r_object_id"];
          item.content["base-permissions"] = output.permissions[id] ? output.permissions[id]["base-permission"] : {};
        });
        deferred.resolve(results);
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    parse: function(response) {
      response.entries = response.entries || [];
      if (response["contentless-object-allowed"] === true) {
        response.entries.push({
          content: {
            "base-permissions": {
              read: true
            },
            description: "",
            object_name: lang.defaultContentlessTemplate,
            preview_mime: "",
            preview_url: "",
            r_object_id: "",
            isContentless: true,
            title: lang.defaultContentlessTemplate,
            type: "d2_template"
          }
        });
      }
      var obj = response.entries.map(function(entry) {
        return entry;
      });
      obj.totalCount = response.entries.length;
      if (response["contentless-object-allowed"] === true) {
        obj.hasContentlessTemplate = true;
      }
      return obj;
    }
  });
  ClientSideBrowsableMixin.mixin(TemplateCollection.prototype);
  BrowsableV2ResponseMixin.mixin(TemplateCollection.prototype);
  ConnectableMixin.mixin(TemplateCollection.prototype);
  FetchableMixin.mixin(TemplateCollection.prototype);
  TemplateCollection.prototype.compareObjectsForSort = function(property, left, right) {
    return sortUtils.compare(property, left, right, undefined, false, this.orderBy);
  };
  TemplateCollection.prototype._filter = function(models) {
    var self = this;
    var keys = _.keys(self.filters);
    if (keys.length > 0) {
      models = _.filter(models, function(node) {
        return _.some(keys, function(name) {
          var hay = self._parseValue(name, node.get(name));
          var value = self.filters[name];
          if (!value) {
            return true;
          }
          var needle = self._parseValue(name, value);
          return self._containsValue(name, hay, needle);
        });
      });
    }
    return models;
  };
  return TemplateCollection;
});