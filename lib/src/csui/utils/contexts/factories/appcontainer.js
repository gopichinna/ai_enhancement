/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/contexts/factories/factory", "csui/models/mixins/appcontainer/appcontainer.mixin", "csui/utils/contexts/factories/ancestors", "csui/utils/url", "csui/lib/jquery", "csui/lib/underscore", "csui/utils/base" ], function(Factory, AppContainerMixin, NodeAncestorsFactory, Url, $, _, base) {
  "use strict";
  var AppContainerFactory = Factory.extend({
    propertyPrefix: "appcontainer",
    constructor: function AppContainerFactory(context, options) {
      Factory.prototype.constructor.call(this, context, options);
      var models = this.options.models;
      this.node = models.container;
      this.addableTypes = models.addableTypes;
      this.children = models.children;
      this.connector = this.node.connector;
      var ancestorFactory = context.getFactory(NodeAncestorsFactory);
      this.ancestors = ancestorFactory.property;
      this.listenTo(context, "request", function() {
        ancestorFactory.options.detached = true;
      });
      this.property = {};
      this.makeAppContainer(options);
    },
    isFetchable: function() {
      return this.node.isFetchable();
    },
    fetch: function(options) {
      var queryparams = this.children.getResourceFieldsUrlQuery();
      var query = Url.combineQueryString(this.children.getBrowsableUrlQuery(), {
        fields: _.without(queryparams.fields, "properties")
      });
      var baseUrl = new Url(this.connector.connection.url).getApiBase(2);
      var appUrl = Url.combine(baseUrl, "app/container", this.node.get("id"));
      var url = Url.appendQuery(appUrl, query);
      var prefetchedModels = [ this.children, this.ancestors, this.addableTypes ];
      var self = this;
      updateStateAndRelayEvent(prefetchedModels, "request", {}, options);
      return this.connector.makeAjaxCall({
        url: url
      }).then(function(response, textStatus, request) {
        var results = response.results;
        var prefetchOptions = {
          silent: true
        };
        var nodes = results.contents.map(function(props) {
          return self.massageResponse(props);
        });
        var childrenPromise = self.children.prefetch({
          collection: response.collection,
          links: response.links,
          results: nodes
        }, prefetchOptions);
        var ancestorsPromise = self.ancestors.prefetch({
          ancestors: results.ancestors
        }, prefetchOptions);
        var addableTypesPromise;
        var addMenu = results.add_menu;
        if (addMenu) {
          addMenu = results.add_menu.map(adaptAddableType);
          addableTypesPromise = self.addableTypes.prefetch(addMenu, {
            parse: false,
            silent: true
          });
        } else {
          var addableTypes = results.addable_node_types;
          if (addableTypes) {
            addableTypesPromise = self.addableTypes.prefetch(addableTypes, prefetchOptions);
          }
        }
        return $.when(ancestorsPromise, addableTypesPromise, childrenPromise).then(function() {
          updateStateAndRelayEvent(prefetchedModels, "reset", response, options);
          updateStateAndRelayEvent(prefetchedModels, "sync", response, options);
          return $.Deferred().resolve(response, textStatus, request);
        });
      }, function(request, textStatus, errorThrown) {
        updateStateAndRelayEvent(prefetchedModels, "error", request, options);
        return $.Deferred().reject(request, textStatus, errorThrown);
      });
    }
  });
  function adaptAddableType(ancestor) {
    ancestor.type_name = ancestor.name;
    delete ancestor.name;
    return ancestor;
  }
  function updateStateAndRelayEvent(models, event, object, options) {
    models.forEach(function(model) {
      if (event === "error") {
        model.error = new base.Error(object);
        model.fetched = false;
        model.fetching = null;
      }
      model.trigger(event, model, object, options);
    });
  }
  AppContainerMixin.mixin(AppContainerFactory.prototype);
  return AppContainerFactory;
});