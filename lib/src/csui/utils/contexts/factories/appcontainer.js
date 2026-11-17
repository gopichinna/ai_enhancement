/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/utils/contexts/factories/factory", "csui/models/mixins/appcontainer/appcontainer.mixin", "csui/models/mixins/appcontainer/appcontainerv3.mixin", "csui/utils/contexts/factories/ancestors", "csui/utils/url", "csui/lib/jquery", "csui/lib/underscore", "csui/utils/base", "csui/utils/commonconfig.util" ], function(module, Factory, AppContainerMixin, AppContainerv2Mixin, NodeAncestorsFactory, Url, $, _, base, CommonConfigUtil) {
  "use strict";
  let config = Object.assign({
    useV3RestApi: CommonConfigUtil.enableFeatureInSmartView() || false
  }, module.config());
  var AppContainerFactory = Factory.extend({
    propertyPrefix: "appcontainer",
    constructor: function AppContainerFactory(context, options) {
      Factory.prototype.constructor.call(this, context, options);
      var models = this.options.models;
      this.node = models.container;
      this.addableTypes = models.addableTypes;
      this.children = models.children;
      this.connector = this.node.connector;
      this.facetCollection = models.facets;
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
      const isv3AppContainer = config.useV3RestApi;
      var queryparams = this.children.getResourceFieldsUrlQuery();
      var query = Url.combineQueryString(this.children.getBrowsableUrlQuery(), {
        fields: _.without(queryparams.fields, "properties")
      });
      let baseUrl;
      let appUrl;
      let url;
      if (isv3AppContainer) {
        baseUrl = new Url(this.connector.connection.url).getApiBase(3);
        appUrl = `${baseUrl}app/container/${this.node.get("id")}${this.createQueryParams()}`;
        url = appUrl;
      } else {
        baseUrl = new Url(this.connector.connection.url).getApiBase(2);
        appUrl = Url.combine(baseUrl, "app/container", this.node.get("id"));
        url = Url.appendQuery(appUrl, query);
      }
      var prefetchedModels = [ this.children, this.ancestors, this.addableTypes ];
      var self = this;
      updateStateAndRelayEvent(prefetchedModels, "request", {}, options);
      return this.connector.makeAjaxCall({
        url: url
      }).then(function(response, textStatus, request) {
        var results = response.results;
        if (isv3AppContainer) {
          self.createCollection(response);
          results.addable_node_types = self.massageAddableTypes(results.addable_node_types);
        }
        var prefetchOptions = {
          silent: true
        };
        const references = results.references;
        var nodes = results.contents.map(function(props) {
          return self.massageResponse(props, references);
        });
        const originalDefaultActions = self.children.defaultActionCommands;
        self.children.defaultActionCommands = [];
        self.children.once("reset", () => {
          self.children.defaultActionCommands = [];
        });
        self.children.once("sync error", () => {
          self.children.defaultActionCommands = originalDefaultActions;
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
    },
    fetchRawChildren: function() {
      const isv3AppContainer = config.useV3RestApi;
      const queryparams = this.children.getResourceFieldsUrlQuery();
      const query = Url.combineQueryString(this.children.getBrowsableUrlQuery(), {
        fields: _.without(queryparams.fields, "properties")
      });
      let baseUrl = new Url(this.connector.connection.url).getApiBase(2);
      let appUrl = Url.combine(baseUrl, "app/container", this.node.get("id"), "page");
      let url = Url.appendQuery(appUrl, query);
      if (isv3AppContainer) {
        baseUrl = new Url(this.connector.connection.url).getApiBase(3);
        appUrl = `${baseUrl}app/container/${this.node.get("id")}/page${this.createQueryParams()}`;
        url = appUrl;
      }
      return this.connector.makeAjaxCall({
        url: url
      }).then(response => {
        if (isv3AppContainer) {
          this.createCollection(response);
          if (response.results?.references) {
            response.references = response.results?.references;
          }
          if (Array.isArray(response.results?.contents)) {
            response.results = response.results?.contents;
          }
        }
        return response;
      }).catch(e => {
        showError(this.children, e);
        throw this.children.error;
      });
    },
    fetchFacet: function(options) {
      const promise1 = this.fetchRawChildren();
      const promise2 = this.facetCollection.fetch();
      Promise.allSettled([ promise1, promise2 ]).then(([ childResult, facetResult ]) => {
        if (childResult.status === "rejected") {
          showError(this.children, childResult.reason);
          throw this.children.error;
        }
        if (facetResult.status === "rejected") {
          throw this.facetCollection.error;
        }
        const response = childResult.value;
        this.prefetchChildren(response, options);
      });
    },
    fetchChildren: function(options) {
      return this.fetchRawChildren().then(response => {
        this.prefetchChildren(response, options);
      });
    },
    prefetchChildren: function(response, options) {
      const references = response.references;
      const nodes = response.results.map(props => this.massageResponse(props, references));
      this.children.prefetch({
        collection: response.collection,
        links: response.links,
        results: nodes
      }, options);
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
        showError(model, object);
      }
      model.trigger(event, model, object, options);
    });
  }
  function showError(model, object) {
    model.error = new base.Error(object);
    model.fetched = false;
    model.fetching = null;
  }
  AppContainerMixin.mixin(AppContainerFactory.prototype);
  AppContainerv2Mixin.mixin(AppContainerFactory.prototype);
  return AppContainerFactory;
});