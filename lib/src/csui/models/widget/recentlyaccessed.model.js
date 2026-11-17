/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin", "csui/models/mixins/v2.fields/v2.fields.mixin", "csui/models/mixins/v2.expandable/v2.expandable.mixin", "csui/models/mixins/v2.commandable/v2.commandable.mixin", "csui/models/mixins/state.requestor/state.requestor.mixin", "csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "csui/models/browsable/client-side.mixin", "csui/models/browsable/v2.response.mixin", "csui/models/nodechildrencolumn", "csui/models/nodechildrencolumns", "csui/models/node/node.model", "i18n!csui/models/widget/nls/lang", "csui/models/widget/recentlyaccessed/server.adaptor.mixin", "csui/models/recentlyaccessed2/recentlyaccessed.columns", "csui/utils/deepClone/deepClone" ], function(_, Backbone, ConnectableMixin, FetchableMixin, AdditionalResourcesV2Mixin, FieldsV2Mixin, ExpandableV2Mixin, StateRequestorMixin, CommandableV2Mixin, DelayedCommandableV2Mixin, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, NodeChildrenColumnModel, NodeChildrenColumnCollection, NodeModel, lang, ServerAdaptorMixin, RecentlyAccessedColumnCollection) {
  "use strict";
  var RecentlyAccessedModel = NodeModel.extend({
    parse: function(response, options) {
      var ra, ra_version, ra_propertiesUser, ra_parentIdExpanded;
      if (response.data && response.data.properties) {
        ra = response.data.properties;
        ra_version = response.data.versions;
        ra_propertiesUser = response.data.properties_user;
        ra_parentIdExpanded = response.data.properties.parent_id_expand;
      } else {
        ra = response;
        ra_version = response.versions;
        ra_propertiesUser = response.properties_user;
        ra_parentIdExpanded = response.parent_id_expanded;
      }
      ra.short_name = ra.name;
      if (!ra.size) {
        if (ra.container) {
          ra.size = ra.container_size;
        } else if (ra_version) {
          ra.size = ra_version.file_size;
        }
      }
      if (!ra.mime_type && ra_version && ra_version.mime_type) {
        ra.mime_type = ra_version.mime_type;
      }
      if (!ra.access_date_last && ra_propertiesUser && ra_propertiesUser.access_date_last) {
        ra.access_date_last = ra_propertiesUser.access_date_last;
      }
      ra.parent_name = "";
      if (!ra.parent_name && ra_parentIdExpanded && ra_parentIdExpanded.name) {
        ra.parent_name = ra_parentIdExpanded.name;
      }
      return NodeModel.prototype.parse.call(this, response, options);
    }
  });
  var RecentlyAccessedCollection = Backbone.Collection.extend({
    model: RecentlyAccessedModel,
    constructor: function RecentlyAccessedCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      if (options) {
        this.options = _.pick(options, [ "connector", "autoreset", "includeResources", "fields", "expand", "commands", "recentlyAccessedSubtypes" ]);
      }
      this.makeConnectable(options).makeFetchable(options).makeAdditionalResourcesV2Mixin(options).makeFieldsV2(options).makeExpandableV2(options).makeStateRequestor(options).makeCommandableV2(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options).makeDelayedCommandableV2(options).makeServerAdaptor(options);
      this.columns = new RecentlyAccessedColumnCollection();
    },
    _prepareModel: function(attrs, options) {
      options || (options = {});
      options.promotedActionCommands = this.promotedActionCommands;
      options.nonPromotedActionCommands = this.nonPromotedActionCommands;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
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
      clone.includeActions = this.includeActions;
      clone.includeCommands = _.clone(this.includeCommands);
      clone.defaultActionCommands = _.clone(this.defaultActionCommands);
      clone.commands = _.clone(this.commands);
      return clone;
    },
    getResourceScope: function() {
      return _.deepClone({
        fields: this.fields,
        expand: this.expand,
        includeResources: this._additionalResources,
        commands: this.commands,
        defaultActionCommands: this.defaultActionCommands
      });
    },
    setResourceScope: function(scope) {
      this.excludeResources();
      scope.includeResources && this.includeResources(scope.includeResources);
      this.resetFields();
      scope.fields && this.setFields(scope.fields);
      this.resetExpand();
      scope.expand && this.setExpand(scope.expand);
      this.resetCommands();
      scope.commands && this.setCommands(scope.commands);
      this.resetDefaultActionCommands();
      scope.defaultActionCommands && this.setDefaultActionCommands(scope.defaultActionCommands);
    }
  });
  ClientSideBrowsableMixin.mixin(RecentlyAccessedCollection.prototype);
  BrowsableV2ResponseMixin.mixin(RecentlyAccessedCollection.prototype);
  ConnectableMixin.mixin(RecentlyAccessedCollection.prototype);
  FetchableMixin.mixin(RecentlyAccessedCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(RecentlyAccessedCollection.prototype);
  FieldsV2Mixin.mixin(RecentlyAccessedCollection.prototype);
  ExpandableV2Mixin.mixin(RecentlyAccessedCollection.prototype);
  StateRequestorMixin.mixin(RecentlyAccessedCollection.prototype);
  CommandableV2Mixin.mixin(RecentlyAccessedCollection.prototype);
  DelayedCommandableV2Mixin.mixin(RecentlyAccessedCollection.prototype);
  ServerAdaptorMixin.mixin(RecentlyAccessedCollection.prototype);
  return RecentlyAccessedCollection;
});