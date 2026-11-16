define([
  'nuc/lib/underscore',
  'd2/sdk/widgets/list.tile/list.tile.view',
  'd2/sdk/utils/server.query.utils',
  '<%= namespace %>/utils/constants',
  '<%= namespace %>/utils/contexts/factories/admin.groups.collection.factory',
  '<%= namespace %>/utils/contexts/factories/next.group.factory',
  '<%= namespace %>/widgets/admin.groups/toolitems',
  'i18n!<%= namespace %>/widgets/admin.groups/impl/nls/lang',
  'css!<%= namespace %>/widgets/admin.groups/impl/admin.groups'
], function (_, ListTileViewImpl, serverQueryUtils, constants, AdminGroupsCollectionFactory,
             NextGroupModelFactory, toolItems, lang) {
  'use strict';

  var AdminGroupsView = ListTileViewImpl.extend({
    constructor: function AdminGroupsView(options) {
      options = options || {};
      options.data = options.data || {};
      options.lang = lang;
      options.cssClass = 'd2-tile-admingroups';
      options.collectionFactory = AdminGroupsCollectionFactory;
      options.toolbarItems = toolItems;

      this.context = options.context;
      this.nextGroupModel = this.context.getModel(NextGroupModelFactory);
      if (!options.data.title) {
        var wName = this.getViewStateWidgetName();
        if (wName) {
          var wConfig = serverQueryUtils.getWidgetConfig(constants.WidgetTypes.ADMIN_GROUPS, wName);
          if (wConfig) {
            options.title = wConfig['label_value'];
          }
        }
      }

      this.enableSelectionHighlight = _.isBoolean(options.data.enableSelectionHighlight) ? options.data.enableSelectionHighlight : false;

      AdminGroupsView.__super__.constructor.call(this, options);
    },

    childViewOptions: function () {
      var retVal = AdminGroupsView.__super__.childViewOptions.apply(this, arguments);

      retVal = retVal || {};
      retVal.checkDefaultAction = false;

      return retVal;
    },

    onClickItem: function (targetView) {
      if(this.selectedChild) {
        this.selectedChild.$el.removeClass('binf-active');
        this.stopListening(this.selectedChild.model, 'members:changed');
      }
      this.selectedChild = targetView;
      if(this.enableSelectionHighlight) {
        this.selectedChild.$el.addClass('binf-active');
      }
      this.listenTo(this.selectedChild.model, 'members:changed', function(model){
        if(this.nextGroupModel && this.nextGroupModel.get('id') === model.get('id')) {
          setTimeout(function(){
            this._syncNextGroupModel(model);
          }.bind(this), 1000);
        }
      });

      this._syncNextGroupModel(this.selectedChild.model);
    },

    _syncNextGroupModel: function(model) {
      if(this.nextGroupModel) {
        this.nextGroupModel.clear({silent: true});
        this.nextGroupModel.set(model.attributes);
      }
    },

    onBeforeDestroy: function() {
      delete this.selectedChild;
    }
  });

  return AdminGroupsView;
});
