/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/node/node.model", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/utils/url", "d2/models/creation.profile", "d2/models/creation.profile.value.config", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels" ], function(_, $, Backbone, NodeModel, ConnectableMixin, FetchableMixin, Url, CreationProfileModel, ValueConfigModel, RestResources, RestLinkrels) {
  "use strict";
  function isNonEmptyString(str) {
    return _.isString(str) && !_.isEmpty(str);
  }
  var cloneableProperties = [ "mode", "isOperatingModePreset", "inheritableSourceNode", "connector", "preset", "profile", "valueConfig", "sourceContent" ];
  var PresetValueConfigModel = Backbone.Model.extend({
    idAttribute: "id",
    constructor: function PresetValueConfigModel(attrs, options) {
      options = options || {};
      this.mode = options.mode;
      this.isOperatingModePreset = _.isBoolean(options.isOperatingModePreset) ? options.isOperatingModePreset : true;
      this.inheritableSourceNode = options.inheritableSourceNode;
      this.preset = options.preset;
      this.profile = new CreationProfileModel(undefined, {
        connector: options.connector
      });
      this.profile.presetModel = this;
      this.valueConfig = new ValueConfigModel(undefined, {
        connector: options.connector
      });
      this.sourceContent = new NodeModel(undefined, {
        connector: options.connector
      });
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options);
    },
    url: function() {
      var url = RestLinkrels.getLink(this.get("links"), RestLinkrels.SELF);
      var queryParams = {};
      if (this.inheritableSourceNode) {
        queryParams["inherited-id"] = this.inheritableSourceNode.get("id");
      }
      queryParams["mode"] = this.mode === "" ? [ "create", "import" ] : this.mode;
      queryParams["inline"] = true;
      return Url.appendQuery(url, Url.combineQueryString(queryParams));
    },
    parse: function(response) {
      var content = response.content || response, links = _.isArray(response.links) ? response.links : [];
      if (response !== content) {
        links = links.concat(content.links);
      }
      if (!this.isOperatingModePreset) {
        content["label"] = content["object_name"];
        content["object_name"] = content["preset_profile_value_name"];
      }
      var properties = _.extend({}, _.omit(response, "content"), content, {
        id: content["r_object_id"],
        name: content["label"] || (this.isOperatingModePreset ? content["object_name"] : content["label"]),
        links: links
      });
      return properties;
    },
    _updateLinks: function(model) {
      model.clear({
        silent: true
      });
      model.set({
        links: this.get("links")
      }, {
        silent: true
      });
    },
    _syncCreationProfileAndSelf: function() {
      if (!this.isInvalid() && this.get("name") === this.profile.get("name") && !this.get("object_name")) {
        this.set({
          name: "",
          label: ""
        }, {
          silent: true
        });
      }
      this.profile.set({
        inherit_content: this.get("inheritance_content"),
        inherit_properties: this.get("inheritance_properties"),
        inherit_vd_structure: this.get("inheritance_vd"),
        isforPasteMulti: false,
        isforPasteSingle: false,
        linked_document_profile: false,
        creation_profile: this.get("mode") === "0",
        import_profile: this.get("mode") === "1"
      }, {
        silent: true
      });
    },
    fetchAll: function() {
      if (this.has("links")) {
        var dfd = $.Deferred(), promises = [];
        this._updateLinks(this.profile);
        this._updateLinks(this.valueConfig);
        if (!this.isInvalid()) {
          promises.push(this.profile.fetch());
          promises.push(this.valueConfig.fetch());
          if (this.has("source_content")) {
            if (this.get("source_content")) {
              if (!this.inheritableSourceNode || this.inheritableSourceNode.get("id") !== this.get("source_content")) {
                this.sourceContent.set({
                  id: this.get("source_content")
                });
                this.sourceContent._expanded = false;
                promises.push(this.sourceContent.fetch({
                  force: true
                }));
              } else {
                this.sourceContent.set(this.inheritableSourceNode.attributes);
              }
            }
          } else {
            this.sourceContent.set(this.inheritableSourceNode ? this.inheritableSourceNode.attributes : {});
          }
        }
        $.whenAll.apply($, promises).done(function() {
          if (!this.isOperatingModePreset) {
            this._syncCreationProfileAndSelf();
          }
          dfd.resolve.apply(dfd, Array.prototype.slice.call(arguments));
        }.bind(this)).fail(function(status) {
          var statProfile = status[0][1], statValueConfig = status[1][1], statNode = status[2] && status[2][1];
          if (!this.isOperatingModePreset && statNode === "error" && statProfile !== "error" && statValueConfig !== "error") {
            this.sourceContent.clear();
            this.set("inheritance_content", false);
            this._syncCreationProfileAndSelf();
            dfd.resolve.apply(dfd, Array.prototype.slice.call(arguments));
          } else {
            dfd.reject.apply(dfd, Array.prototype.slice.call(arguments));
          }
        }.bind(this));
        return dfd.promise();
      }
      throw new Error("Preset value config is not populated yet");
    },
    isEditable: function() {
      return this.has("allow_edit") ? this.get("allow_edit") : false;
    },
    isInvalid: function() {
      return this.has("is_invalid") ? this.get("is_invalid") : false;
    },
    clone: function() {
      var clonedModel = Backbone.Model.prototype.clone.apply(this, arguments);
      _.each(cloneableProperties, function(prop) {
        clonedModel[prop] = this[prop];
      }.bind(this));
      return clonedModel;
    }
  }, {
    create: function(presetConfigName, presetUniqueID, options) {
      if (isNonEmptyString(presetConfigName) && isNonEmptyString(presetUniqueID)) {
        var presetProfilesLinkMeta = RestLinkrels._getLinkMeta(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_CREATION_PRESET_PROFILES);
        if (presetProfilesLinkMeta && presetProfilesLinkMeta.href) {
          var selfLink = {
            rel: RestLinkrels.SELF,
            href: Url.combine(presetProfilesLinkMeta.href, encodeURIComponent(presetConfigName), "value-configs", encodeURIComponent(presetUniqueID))
          };
          return new PresetValueConfigModel({
            links: [ selfLink ]
          }, options);
        }
      }
    }
  });
  ConnectableMixin.mixin(PresetValueConfigModel.prototype);
  FetchableMixin.mixin(PresetValueConfigModel.prototype);
  var origFetch = PresetValueConfigModel.prototype.fetch;
  PresetValueConfigModel.prototype.fetch = function() {
    var dfd = $.Deferred();
    origFetch.apply(this, arguments).done(function() {
      this.fetchAll().done(dfd.resolve).fail(dfd.reject);
    }.bind(this)).fail(dfd.reject);
    return dfd.promise();
  };
  return PresetValueConfigModel;
});