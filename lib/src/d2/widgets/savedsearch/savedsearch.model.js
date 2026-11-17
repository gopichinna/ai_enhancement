/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/utils/base", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/models/browsable/client-side.mixin", "nuc/models/node/node.model", "i18n", "d2/server.adaptors/converters/savedsearch", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "i18n!d2/widgets/savedsearch/impl/nls/lang", "nuc/utils/deepClone/deepClone" ], function($, _, Backbone, Url, base, ConnectableMixin, FetchableMixin, ClientSideBrowsableMixin, NodeModel, i18n, SavedSearchConverter, RestResources, RestLinkrels, lang) {
  "use strict";
  function getAncestors(pid, tabnames, entries) {
    var entry = entries.filter(function(entry) {
      return entry.id === pid;
    });
    if (entry.length > 0) {
      var val = entry[0];
      tabnames.push(val.content.properties["object_name"]);
      var parentid = val.content.properties["parent-id"];
      if (parentid) {
        getAncestors(parentid, tabnames, entries);
      } else {
        return;
      }
    }
  }
  function getParentFolderName(pid, entries) {
    var parentFolderName = "";
    var entry = entries.filter(function(entry) {
      return entry.id === pid;
    });
    if (entry.length > 0) {
      parentFolderName = entry[0].content.properties["object_name"];
    }
    return parentFolderName;
  }
  function getCompleteTabName(searchCategory) {
    var map = {
      private_search: lang.privatesearch,
      public_search: 0,
      last_search: -1
    };
    return map[searchCategory];
  }
  function concat(arr) {
    var rtl = i18n.settings.rtl;
    var result = arr;
    var sep = " > ";
    if (rtl) {
      result = result.reverse();
      sep = " < ";
    }
    return result.join(sep);
  }
  var SavedSearchCollection = Backbone.Collection.extend({
    constructor: function SavedSearchCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.callCounter = 0;
      if (options) {
        this.options = _.pick(options, [ "connector", "autoreset", "includeResources", "fields", "expand", "commands" ]);
      }
      this.makeConnectable(options).makeFetchable(options).makeClientSideBrowsable(options);
    },
    clone: function() {
      var clone = new this.constructor(this.models, {
        connector: this.connector,
        fields: _.deepClone(this.fields),
        includeResources: _.clone(this._additionalResources),
        skip: this.skipCount,
        top: this.topCount,
        filter: _.deepClone(this.filters),
        orderBy: this.orderBy
      });
      return clone;
    },
    url: function() {
      var currRepo = RestResources.getCurrentRepository();
      return Url.appendQuery(RestLinkrels.getLink(currRepo.get("links"), RestLinkrels.D2_SAVED_SEARCH), "inline=true");
    },
    parse: function(response) {
      var entries = response.entries;
      var mapGroupNames = {};
      var results = [];
      _.each(entries, function(entry) {
        var props = entry.content.properties;
        var newentry = props;
        newentry["id"] = props["r_object_id"];
        newentry["name"] = props.r_object_type === "d2_queryform_config" ? props["label"] : props["object_name"];
        newentry["label"] = props["label"];
        newentry["type"] = 258;
        newentry["type_name"] = SavedSearchConverter.getObjectTypeName(props.r_object_type);
        newentry["links"] = entry.content.links;
        newentry["r_object_type"] = props.r_object_type;
        var parentId = props["parent-id"];
        if (parentId) {
          var tabname = mapGroupNames[parentId];
          if (!tabname) {
            tabname = getParentFolderName(parentId, entries);
            mapGroupNames[parentId] = tabname;
          }
          var ancestors = [];
          getAncestors(parentId, ancestors, entries);
          ancestors.reverse();
          newentry["grouptooltip"] = ancestors.length > 1 ? concat(ancestors) : ancestors[0];
          newentry["tooltip"] = concat([ newentry["grouptooltip"], newentry["name"] ]);
          if (newentry["search-category"] === "private_search") {
            newentry["tab_id"] = getCompleteTabName(newentry["search-category"]);
            newentry["tooltip"] = concat([ lang.privatesearch, newentry["grouptooltip"], newentry["name"] ]);
          } else {
            newentry["tab_id"] = tabname;
          }
        } else {
          newentry["tab_id"] = getCompleteTabName(newentry["search-category"]);
          if (newentry["tab_id"] === -1 || newentry["tab_id"] === 0) {
            newentry["tooltip"] = newentry["name"];
          } else if (newentry["tab_id"] === lang.privatesearch) {
            newentry["tooltip"] = concat([ newentry["tab_id"], newentry["name"] ]);
            newentry["grouptooltip"] = lang.privatesearch;
          }
        }
        if (entry.content.links && entry.content.properties["r_object_type"] !== "d2c_query_category") {
          results.push(newentry);
        }
      });
      return results;
    }
  });
  ClientSideBrowsableMixin.mixin(SavedSearchCollection.prototype);
  ConnectableMixin.mixin(SavedSearchCollection.prototype);
  FetchableMixin.mixin(SavedSearchCollection.prototype);
  return SavedSearchCollection;
});