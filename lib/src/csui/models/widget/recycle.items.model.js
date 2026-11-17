/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/models/mixins/connectable/connectable.mixin", "csui/models/browsable/browsable.mixin", "csui/models/browsable/v1.request.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin", "csui/models/mixins/v2.fields/v2.fields.mixin", "csui/models/mixins/v2.expandable/v2.expandable.mixin", "csui/models/mixins/v2.commandable/v2.commandable.mixin", "csui/models/mixins/state.requestor/state.requestor.mixin", "csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "csui/models/browsable/v2.response.mixin", "csui/models/nodechildrencolumn", "csui/models/nodechildrencolumns", "csui/models/node/node.model", "i18n!csui/models/widget/nls/lang", "csui/models/widget/recycle.items/server.adaptor.mixin", "csui/themes/csui.jato.action.icons", "csui/utils/deepClone/deepClone" ], function(_, Backbone, ConnectableMixin, BrowsableMixin, BrowsableV1RequestMixin, FetchableMixin, AdditionalResourcesV2Mixin, FieldsV2Mixin, ExpandableV2Mixin, StateRequestorMixin, CommandableV2Mixin, DelayedCommandableV2Mixin, BrowsableV2ResponseMixin, NodeChildrenColumnModel, NodeChildrenColumnCollection, NodeModel, lang, ServerAdaptorMixin, jatoIcons) {
  "use strict";
  const RecycleDocumentsColumnModel = NodeChildrenColumnModel.extend({
    constructor: function RecycleDocumentsColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var columnKey = "rcb_" + attributes.column_key;
        attributes.title = lang[columnKey];
      }
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }
  });
  var RecycleDocumentsColumnCollection = NodeChildrenColumnCollection.extend({
    model: RecycleDocumentsColumnModel,
    constructor: function RecycleDocumentsColumnCollection(models, options) {
      if (!models) {
        models = [ {
          key: "type",
          type: 2,
          sort: true,
          titleIconInHeader: "mime_type",
          titleSvgInHeader: jatoIcons.actionDocument,
          default_action: false,
          name: lang.rcb_type
        }, {
          key: "name",
          type: 2,
          sort: true,
          default_action: false,
          contextual_menu: false,
          editable: true,
          filter_key: "name",
          name: lang.rcb_name
        }, {
          key: "deleted_date",
          type: -7,
          sort: true,
          name: lang.rcb_deleted_date
        }, {
          key: "deleted_user_name",
          type: -1,
          name: lang.rcb_deleted_user_name
        }, {
          key: "created_by_user_name",
          type: -1,
          name: lang.rcb_created_by_user_name
        }, {
          key: "size",
          type: 2,
          sort: true,
          name: lang.rcb_size
        }, {
          key: "parent_id",
          type: 2,
          contextual_menu: false,
          editable: true,
          filter_key: "name",
          name: lang.rcb_parent_id
        }, {
          key: "purged_date",
          type: -7,
          sort: true,
          name: lang.rcb_purged_date
        } ];
        models.forEach(function(column, index) {
          column.definitions_order = index + 100;
          column.column_key = column.key;
        });
      }
      NodeChildrenColumnCollection.prototype.constructor.call(this, models, options);
    }
  });
  const RecycleBinModel = NodeModel.extend({
    parse: function(response, options) {
      if (!response.data?.properties) return;
      return NodeModel.prototype.parse.call(this, response, options);
    }
  });
  const RecycleDocumentsCollection = Backbone.Collection.extend({
    model: RecycleBinModel,
    constructor: function RecycleDocumentsCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      if (options) {
        this.options = _.pick(options, []);
      }
      this.makeConnectable(options).makeBrowsable(options).makeBrowsableV1Request(options).makeFetchable(options).makeAdditionalResourcesV2Mixin(options).makeFieldsV2(options).makeExpandableV2(options).makeStateRequestor(options).makeCommandableV2(options).makeBrowsableV2Response(options).makeDelayedCommandableV2(options).makeServerAdaptor(options);
      this.columns = new RecycleDocumentsColumnCollection();
      this.typeOfCollection = "recyclebin";
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
      clone.commands = _.clone(this.commands);
      return clone;
    },
    setDefaultPageNum: function() {
      this.skipCount = 0;
    },
    getResourceScope: function() {
      return _.deepClone({
        fields: this.fields,
        expand: this.expand,
        includeResources: this._additionalResources,
        commands: this.commands
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
  BrowsableMixin.mixin(RecycleDocumentsCollection.prototype);
  BrowsableV1RequestMixin.mixin(RecycleDocumentsCollection.prototype);
  BrowsableV2ResponseMixin.mixin(RecycleDocumentsCollection.prototype);
  ConnectableMixin.mixin(RecycleDocumentsCollection.prototype);
  FetchableMixin.mixin(RecycleDocumentsCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(RecycleDocumentsCollection.prototype);
  FieldsV2Mixin.mixin(RecycleDocumentsCollection.prototype);
  ExpandableV2Mixin.mixin(RecycleDocumentsCollection.prototype);
  StateRequestorMixin.mixin(RecycleDocumentsCollection.prototype);
  CommandableV2Mixin.mixin(RecycleDocumentsCollection.prototype);
  DelayedCommandableV2Mixin.mixin(RecycleDocumentsCollection.prototype);
  ServerAdaptorMixin.mixin(RecycleDocumentsCollection.prototype);
  return RecycleDocumentsCollection;
});