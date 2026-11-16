/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/models/creation.presets.value.config", "d2/models/creation.preset" ], function(_, $, Backbone, Url, ConnectableMixin, FetchableMixin, RestResources, RestLinkrels, PresetValueConfigModel, PresetProfileModel) {
  "use strict";
  var PresetValueConfigCollection = Backbone.Collection.extend({
    model: PresetValueConfigModel,
    constructor: function PresetValueConfigCollection(models, options) {
      options = options || {};
      this.mode = options.mode || "";
      this.preset = options.preset;
      this.inheritableSourceNode = options.inheritableSourceNode;
      this.isOperatingModePreset = _.isBoolean(options.isOperatingModePreset) ? options.isOperatingModePreset : true;
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options);
    },
    url: function() {
      var url;
      if (this.isOperatingModePreset) {
        if (!(this.preset instanceof PresetProfileModel)) {
          throw Error("Preset model is not set");
        }
        this.preset["presetProfileCollection"] = this;
        url = RestLinkrels.getLink(this.preset.get("links"), RestLinkrels.D2_CREATION_PRESET_VALUE_CONFIGS);
      } else {
        this.preset = this.preset ? this.preset.clone() : new PresetProfileModel({
          links: []
        }, {
          connector: this.connector
        });
        this.preset.get("links").push(RestLinkrels._getLinkMeta(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_CREATION_PRESET_RECENTLY_USED));
        this.preset["recentProfileCollection"] = this;
        url = RestLinkrels.getLink(this.preset.get("links"), RestLinkrels.D2_CREATION_PRESET_RECENTLY_USED);
      }
      var queryParams = {};
      if (this.inheritableSourceNode) {
        queryParams["inherited-id"] = this.inheritableSourceNode.get("id");
      }
      queryParams["mode"] = this.mode === "" ? [ "create", "import" ] : this.mode;
      queryParams["inline"] = true;
      return Url.appendQuery(url, Url.combineQueryString(queryParams));
    },
    parse: function(response) {
      var entries = _.isArray(response.entries) ? response.entries : [];
      if (!this.isOperatingModePreset) {
        var numEntries = Math.min(5, entries.length);
        entries = _.first(entries, numEntries);
      }
      return entries;
    }
  });
  ConnectableMixin.mixin(PresetValueConfigCollection.prototype);
  FetchableMixin.mixin(PresetValueConfigCollection.prototype);
  var origFetch = PresetValueConfigCollection.prototype.fetch;
  PresetValueConfigCollection.prototype.fetch = function() {
    var dfd = $.Deferred(), doneArgs, promises = [];
    origFetch.apply(this, arguments).done(function() {
      doneArgs = arguments;
      this.each(function(model) {
        promises.push(model.fetchAll());
      }.bind(this));
      $.whenAll.apply($, promises).done(function() {
        dfd.resolve.apply(dfd, Array.prototype.slice.call(doneArgs));
      }).fail(dfd.reject);
    }.bind(this)).fail(dfd.reject);
    return dfd.promise();
  };
  var origPrepareModel = PresetValueConfigCollection.prototype._prepareModel;
  PresetValueConfigCollection.prototype._prepareModel = function(attrs, options) {
    options = options || {};
    options.mode = this.mode;
    options.inheritableSourceNode = this.inheritableSourceNode;
    options.isOperatingModePreset = this.isOperatingModePreset;
    options.preset = this.preset;
    return origPrepareModel.call(this, attrs, options);
  };
  return PresetValueConfigCollection;
});