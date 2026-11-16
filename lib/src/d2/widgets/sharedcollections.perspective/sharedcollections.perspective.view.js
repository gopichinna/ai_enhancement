/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/widgettable/widgettable.view", "d2/utils/contexts/factories/d2.sharedcollections.factory", "d2/widgets/d2collections.perspective/d2collections.list/d2collections.list.view", "i18n!d2/widgets/d2collections.perspective/impl/nls/lang", "csui/controls/toolbar/toolitems.factory", "d2/utils/constants", "hbs!d2/widgets/d2collections.perspective/impl/d2collections.perspective", "css!d2/widgets/d2collections.perspective/impl/d2collections.perspective" ], function(_, NodesTableViewImpl, SharedcollectionsCollectionFactory, D2CollectionsListsWrapperView, lang, ToolItemsFactory, constants, template) {
  "use strict";
  var SharedcollectionsView = NodesTableViewImpl.extend({
    constructor: function SharedcollectionsView(options) {
      options = options || {};
      this.context = options.context;
      options.d2collectionFactory = SharedcollectionsCollectionFactory;
      options.toolbarItems = {
        inlineActionbar: null,
        leftToolbar: new ToolItemsFactory({
          main: [ {
            signature: "D2-Back",
            name: lang.CommandNameBack,
            icon: "icon arrow_back csui-icon-go-previous-node csui-no-hover-effect"
          }, {
            signature: "D2-split-view",
            name: lang.CommandNameSplit,
            icon: "icon left_panel_open",
            enabled: true
          } ]
        }, {
          maxItemsShown: 2,
          dropDownIcon: "icon icon-toolbar-more",
          dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_more32",
          dropDownText: lang.ToolbarItemMore,
          addTrailingDivider: false
        }),
        rightToolbar: new ToolItemsFactory({
          main: [ {
            signature: "D2-RefreshList",
            name: lang.CommandNameRefreshList,
            iconName: "csui_action_refresh32",
            enabled: true,
            suppressFailMessage: true
          } ]
        }, {
          maxItemsShown: 2
        }),
        clone: function() {
          return ToolItemsFactory.cloneToolbarItems(this);
        }
      };
      options.selectRows = "none";
      this.templateHelpers = _.extend(this.templateHelpers || {}, {
        lang: lang
      });
      this.regions = _.extend(this.regions || {}, {
        rgnPanelContainer: ".d2-widget-collectionwidget",
        listD2CollectionsPanel: ".d2-collections-wrapper",
        rgnCollectionItemsPanel: ".csui-outertablecontainer"
      });
      SharedcollectionsView.__super__.constructor.call(this, options);
    },
    template: template,
    onRender: function() {
      SharedcollectionsView.__super__.onRender.apply(this, arguments);
      this.tableRegion.currentView.checkModelHasAction = () => true;
      this.d2CollectionsListsWrapperView = new D2CollectionsListsWrapperView({
        context: this.options.context,
        collection: this.options.mycollection,
        originatingView: this
      });
      this.collection.fetch({
        reload: true,
        skipSWCache: true
      });
    },
    onShow: function() {
      SharedcollectionsView.__super__.onShow.apply(this, arguments);
      this.listD2CollectionsPanel.show(this.d2CollectionsListsWrapperView);
    },
    getTitle: function() {
      return lang.sharedCollections;
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.SHAREDCOLLECTIONS;
    },
    getExtraIconConfig: function() {
      return {
        type: constants.Types.COLLECTIONS
      };
    }
  });
  return SharedcollectionsView;
});