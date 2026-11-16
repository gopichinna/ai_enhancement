define([
  'd2/sdk/widgets/nodestable/nodestable.view',
  'd2/sdk/utils/server.query.utils',
  '<%= namespace %>/utils/contexts/factories/<%= typedModulePrefix %>.collection.factory',
  'i18n!<%= namespace %>/widgets/<%= srcDir %>/impl/nls/lang',
  'css!<%= namespace %>/widgets/<%= srcDir %>/impl/<%= srcDir %>'
], function(NodesTableViewImpl, serverQueryUtils, <%= typedNamePrefix %>CollectionFactory, lang){
  'use strict';

  var <%= typedNamePrefix %>View = NodesTableViewImpl.extend({
    constructor: function <%= typedNamePrefix %>View(options) {
      options = options || {};
      options.cssClass = 'd2-widget-<%= typedNamePrefix.toLowerCase(); %>';
      options.d2collectionFactory = <%= typedNamePrefix %>CollectionFactory;

      <%= typedNamePrefix %>View.__super__.constructor.call(this, options);
    },

    getTitle: function () {
      var widgetName = this.getViewStateWidgetName();
      var widgetConfig = widgetName && serverQueryUtils.getWidgetConfig('<%= type %>', widgetName);
      return ((widgetConfig && widgetConfig.label_value) || lang.defaultTitle);
    },

    getWidgetTypeId: function () {
      return '_d2_widget_<%= type.toLowerCase(); %>';
    }
  });

  return <%= typedNamePrefix %>View;
});
