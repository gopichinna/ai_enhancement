/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/list/list.view", "csui/controls/progressblocker/blocker", "csui/controls/list/behaviors/list.view.keyboard.behavior", "csui/behaviors/limiting/limiting.behavior", "csui/behaviors/default.action/default.action.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/behaviors/collection.state/collection.state.behavior", "csui/utils/accessibility", "csui/utils/commands", "csui/utils/commandhelper", "dctmw/controls/list/listitem.type.node.view", "dctmw/controls/list/list.state.view", "dctmw/controls/mixins/tileview.action.mixin", "dctmw/controls/mixins/view.state/widget.view.state.mixin", "dctmw/controls/behaviors/open.app.scope.behavior", "dctmw/controls/behaviors/defer.dataload.until.visible.behavior", "dctmw/widgets/widgettile/tileview.toolbaritems", "dctmw/utils/constants", "dctmw/utils/perspectives/app.scope.perspectives", "i18n!dctmw/widgets/widgettile/impl/nls/lang", "css!dctmw/widgets/widgettile/impl/tile", "css!dctmw/utils/icons/impl/icons" ], function(_, ListView, BlockingView, ListViewKeyboardBehavior, LimitingBehavior, DefaultActionBehavior, TabableRegionBehavior, CollectionStateBehavior, Accessibility, commands, CommandHelper, ListItemTypeNodeView, ListStateView, TileViewActionMixin, WidgetViewStateMixin, OpenAppScopeBehavior, DeferredDataLoadBehavior, tileViewToolbarItems, constants, appScopePerspectives, lang) {
  "use strict";
  var accessibleTable = Accessibility.isAccessibleTable();
  var WidgetTileView = ListView.extend({
    constructor: function WidgetTileView(options) {
      options = options || {};
      options.data = options.data || {};
      if (!(options.collectionFactory || options.collection)) {
        throw new Error("CollectionFactory or Collection is required");
      }
      if (!options.lang) {
        console.warn("It's good to have a lang file else generic text/tooltip will be shown");
      }
      options.tileLang = options.lang || lang;
      if (!options.orderBy) {
        options.orderBy = "name asc";
      }
      _.defaults(options, {
        icon: options.showTitleIcon === false ? undefined : options.data.icon ? "title-icon " + options.data.icon : undefined,
        title: options.data.title || options.tileLang.tileTitle || options.tileLang.dialogTitle
      }, _.omit(options.data, "icon", "title"));
      this.context = options.context;
      this.showInlineActionBar = !(accessibleTable || options.showInlineActionBar === false);
      this.toolbarItems = options.toolbarItems || tileViewToolbarItems;
      this._enableOpenPerspective = !options.hideOpenPerspective && !!appScopePerspectives.getModelForScope(options.applicationScope);
      this.hideSearch = options.hideSearch ? options.hideSearch : false;
      if (this._enableOpenPerspective) {
        this.behaviors = _.extend(this.behaviors || {}, {
          OpenAppScope: _.defaults({
            behaviorClass: OpenAppScopeBehavior,
            registerClickEventListener: false
          }, options)
        });
      }
      ListView.prototype.constructor.call(this, options);
      BlockingView.imbue(this);
      this.blockingView.showloadingWheel = false;
      this.listenTo(this.options.context, "d2.minimize:widget", function() {
        this.completeCollection.fetch({
          reload: true
        });
      });
      this.listenTo(this.completeCollection, "delayed:data:sync", this.render);
    },
    childEvents: {
      "click:item": "onClickItem",
      "before:execute:command": "onBeforeExecuteCommand"
    },
    templateHelpers: function() {
      return {
        title: this.options.title,
        icon: this.options.icon,
        searchPlaceholder: this.options.tileLang.searchPlaceholder,
        searchTitle: this.options.tileLang.searchTitle,
        searchAria: this.options.tileLang.searchAria,
        expandAria: this.options.tileLang.expandAria,
        openPerspectiveAria: this.options.tileLang.openView,
        openPerspectiveTooltip: this.options.tileLang.openView,
        enableOpenPerspective: this._enableOpenPerspective,
        hideSearch: this.hideSearch
      };
    },
    childView: ListItemTypeNodeView,
    childViewOptions: function(model) {
      if (model.get("type") === constants.Types.WORKFLOW) {
        model.set("csuiLazyActionsRetrieved", true, {
          silent: true
        });
      }
      var toolbarData = this.showInlineActionBar ? {
        toolbaritems: this.toolbarItems,
        collection: this.completeCollection
      } : undefined;
      return {
        templateHelpers: function() {
          return {
            name: this.model.get("name"),
            enableIcon: true,
            showInlineActionBar: this.showInlineActionBar
          };
        },
        context: this.context,
        checkDefaultAction: true,
        toolbarData: toolbarData,
        containerCheck: true
      };
    },
    behaviors: {
      LimitedList: {
        behaviorClass: LimitingBehavior,
        completeCollection: function() {
          var opt = this.options, collection = opt.collection;
          if (!collection) {
            var param = this.getFactoryParam() || "widget";
            opt[param] = opt[param] || {};
            opt[param].options = opt.data;
            opt.attributes = opt.data.widgetName && {
              id: _.uniqueId(opt.data.widgetName.replace(/ /g, ""))
            };
            opt[param].options.nonPromotedActionCommands = commands.getSignatures(this.toolbarItems);
            collection = opt.context.getCollection(this.options.collectionFactory, opt);
          }
          collection.expanded = false;
          collection.limitedCollection = true;
          collection.setEnabledDelayRestCommands(false);
          collection.setEnabledLazyActionCommands(false);
          return collection;
        },
        limit: 0
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      ListViewKeyboardBehavior: {
        behaviorClass: ListViewKeyboardBehavior
      },
      CollectionState: {
        behaviorClass: CollectionStateBehavior,
        collection: function() {
          return this.completeCollection;
        },
        stateView: ListStateView,
        stateMessages: {
          empty: lang.emptyListText,
          failed: lang.failedListText,
          zeroResults: lang.zeroResults
        }
      },
      DeferredDataLoadBehavior: {
        behaviorClass: DeferredDataLoadBehavior,
        containerSelector: ".module-d2-view",
        dataSource: function() {
          return this.completeCollection;
        }
      }
    },
    getFactoryParam: function() {
      return this.options.applicationScope;
    },
    onRender: function() {
      ListView.prototype.onRender.apply(this, arguments);
      this.$el.addClass("d2-tile " + (this.options.cssClass || ""));
    },
    onClickItem: function(target) {
      this.triggerMethod("execute:defaultAction", target.model);
    },
    onClickHeader: function() {
      if (this.options.avoidOpenPerspectiveOnHeader || !this._enableOpenPerspective) {
        return;
      }
      this.triggerMethod("click:open:perspective");
    },
    onBeforeExecuteCommand: function(childView, options) {
      if (options && options.commandSignature === "Properties" && options.status) {
        var node = CommandHelper.getJustOneNode(options.status);
        if (node && node.get("csuiLazyActionsRetrieved") === true) {
          node.unset("csuiLazyActionsRetrieved");
          node.actions.reset();
        }
      }
    }
  });
  TileViewActionMixin.mixin(WidgetTileView.prototype);
  _.extend(WidgetTileView.prototype, WidgetViewStateMixin);
  return WidgetTileView;
});