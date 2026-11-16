/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/url", "smart/controls/breadcrumbs/breadcrumbs.view", "csui/utils/contexts/factories/next.node", "csui/utils/node.links/node.links", "csui/behaviors/keyboard.navigation/tabable.region.behavior" ], function(_, $, Backbone, Marionette, ApplicationScopeModelFactory, Url, SmartBreadcrumbsView, NextNodeModelFactory, nodeLinks, TabableRegionBehavior) {
  var BreadCrumbCollectionView = SmartBreadcrumbsView.extend({
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    constructor: function BreadcrumbCollectionView(options) {
      SmartBreadcrumbsView.prototype.constructor.call(this, options);
      this.listenTo(this, "before:synchronized", _.bind(this.updateCollection, this));
      this.listenTo(this, "childview:click:ancestor", _.bind(this.onClickAncestor, this));
      this.listenTo(this, "childview:click:home:ancestor", this.onClickHomeAncestor);
      this.applicationScope = options?.context?.getModel(ApplicationScopeModelFactory);
    },
    onClickAncestor: function(model, node) {
      var context = this.context = this.options.context;
      this._nextNode = this.options.node || context.getModel(NextNodeModelFactory);
      var args = {
        node: node
      };
      this.trigger("before:defaultAction", args);
      if (!args.cancel) {
        var nodeId = node.get("id");
        if (this._nextNode.get("id") === nodeId) {
          this._nextNode.unset("id", {
            silent: true
          });
        }
        var viewStateModel = this.context && this.context.viewStateModel;
        var viewState = viewStateModel && viewStateModel.get("state");
        if (viewState) {
          this.context.viewStateModel.set("state", _.omit(viewState, "filter"), {
            silent: true
          });
        }
        this._nextNode.trigger("before:change:id", node, this);
        this._nextNode.set("id", nodeId);
      }
      this.$el.trigger("setCurrentTabFocus");
    },
    onClickHomeAncestor: function() {
      this.applicationScope.set("id", "");
    },
    updateCollection: function() {
      this.completeCollection.forEach(function(model) {
        var connector = model.connector || model.collection.connector, hrefSrc = "";
        const serverUrl = new Url(connector && connector.connection.url || location.href);
        hrefSrc = model.get("id") > 0 && connector && nodeLinks.getUrl(model, {
          connector: connector
        }) || model.get("id") === "home" && nodeLinks.getHomeUrl(serverUrl) || "#";
        model.set("hrefSrc", hrefSrc, {
          silent: true
        });
      });
    }
  });
  return BreadCrumbCollectionView;
});