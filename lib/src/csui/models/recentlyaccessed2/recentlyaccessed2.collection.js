/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/defaultactionitems", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin", "csui/models/mixins/v2.fields/v2.fields.mixin", "csui/models/mixins/v2.expandable/v2.expandable.mixin", "csui/models/mixins/state.requestor/state.requestor.mixin", "csui/models/mixins/v2.commandable/v2.commandable.mixin", "csui/models/browsable/browsable.mixin", "csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "csui/models/recentlyaccessed2/recentlyaccessed2", "csui/models/recentlyaccessed2/recentlyaccessed.columns", "csui/models/recentlyaccessed2/collection.server.adaptor.mixin", "csui/utils/deepClone/deepClone" ], function(module, _, Backbone, defaultActionItems, ConnectableMixin, FetchableMixin, AdditionalResourcesV2Mixin, FieldsV2Mixin, ExpandableV2Mixin, StateRequestorMixin, CommandableV2Mixin, BrowsableMixin, DelayedCommandableV2Mixin, RecentlyAccessed2Model, RecentlyAccessedColumnCollection, ServerAdaptorMixin) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 25
  });
  var RecentlyAccessed2Collection = Backbone.Collection.extend({
    model: RecentlyAccessed2Model,
    constructor: function RecentlyAccessed2Collection(attributes, options) {
      options = _.defaults({}, options, {
        top: config.defaultPageSize
      }, options);
      Backbone.Collection.prototype.constructor.apply(this, arguments, options);
      if (options) {
        this.options = _.pick(options, [ "connector", "autoreset", "limit", "includeResources", "fields", "expand", "commands", "recentlyAccessedSubtypes" ]);
      }
      this.filters = options.filters || [];
      this.makeConnectable(options).makeBrowsable(options).makeBrowsableV1Request(options).makeFetchable(options).makeAdditionalResourcesV2Mixin(options).makeFieldsV2(options).makeExpandableV2(options).makeStateRequestor(options).makeCommandableV2(options).makeBrowsableV2Response(options).makeDelayedCommandableV2(options).makeServerAdaptor(options);
      this.columns = new RecentlyAccessedColumnCollection();
    },
    _prepareModel: function(attrs, options) {
      options || (options = {});
      options.promotedActionCommands = this.promotedActionCommands;
      options.nonPromotedActionCommands = this.nonPromotedActionCommands;
      options.limit = this.limit;
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
  BrowsableMixin.mixin(RecentlyAccessed2Collection.prototype);
  ConnectableMixin.mixin(RecentlyAccessed2Collection.prototype);
  FetchableMixin.mixin(RecentlyAccessed2Collection.prototype);
  AdditionalResourcesV2Mixin.mixin(RecentlyAccessed2Collection.prototype);
  FieldsV2Mixin.mixin(RecentlyAccessed2Collection.prototype);
  ExpandableV2Mixin.mixin(RecentlyAccessed2Collection.prototype);
  StateRequestorMixin.mixin(RecentlyAccessed2Collection.prototype);
  CommandableV2Mixin.mixin(RecentlyAccessed2Collection.prototype);
  DelayedCommandableV2Mixin.mixin(RecentlyAccessed2Collection.prototype);
  ServerAdaptorMixin.mixin(RecentlyAccessed2Collection.prototype);
  return RecentlyAccessed2Collection;
});