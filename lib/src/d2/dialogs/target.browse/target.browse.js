/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/node/node.model", "csui/controls/dialog/dialog.view", "csui/controls/mixins/view.state/node.view.state.mixin", "csui/dialogs/modal.alert/modal.alert", "nuc/utils/log", "d2/dialogs/target.browse/start.locations/start.location.collection", "d2/dialogs/target.browse/impl/target.browse.view", "d2/dialogs/target.browse/impl/header/header.view", "d2/dialogs/target.browse/impl/footer/footer.view", "d2/dialogs/target.browse/impl/command.type", "d2/utils/constants", "i18n!d2/dialogs/target.browse/impl/nls/lang", "d2/utils/contexts/factories/node.navigation", "d2/utils/content.assist", "d2/utils/widget.constants", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "css!d2/dialogs/target.browse/impl/target.browse" ], function(module, _, $, Backbone, Marionette, NodeModel, DialogView, NodeViewStateMixin, ModalAlert, log, StartLocationCollection, TargetBrowseView, HeaderView, FooterView, CommandType, constants, lang, NodeNavigationFactory, ContentAssist, widgetConstants, RestResources, serverQueryUtils) {
  "use strict";
  var config = _.extend({
    initialLocationLookupOrder: [ "d2/dialogs/target.browse/start.locations/current.location", "d2/dialogs/target.browse/start.locations/favorites" ]
  }, module.config());
  var defaultOptions = {
    initialSelection: [],
    dialogTitle: lang.dialogTitle,
    orderBy: "name asc"
  };
  function TargetBrowse(options) {
    options || (options = {});
    this.options = _.defaults(options, defaultOptions, {
      pageSize: 30
    });
    this.options.favoritesView = false;
    this.options.relatedFilesView = false;
    this.options.workflowTemplatesView = false;
    this.options.localScope = "home";
    this.options.connector = this.options.connector || this.options.container.connector || this.options.collection.connector;
    this.options.selectType = options.selectType || null;
    this.options.url_filter = options.url_filter || null;
    if (this.options.context.viewStateModel.getViewState("order_by")) {
      this.options.orderBy = NodeViewStateMixin._formatOrderBy(this.options.context.viewStateModel.getViewState("order_by"));
      this.options.origOrderBy = this.options.orderBy;
    }
    if (!this.options.connector) {
      var msg = "Node Picker: insufficient options";
      log.error(msg) && console.error(msg);
      throw new Error(msg);
    }
    this.options.targetBrowseHistory = [];
    this.options.navigateFromHistory = false;
    var doclistWidgetConfig = this._getDoclistWidgetConfig(), doclistStartingPath = doclistWidgetConfig.getParam("start_path_smartview") || constants.NodeId.REPOSITORY;
    if ((!this.options.container.get("id") || this.options.container.get("id") === constants.NodeId.REPOSITORY) && doclistStartingPath !== constants.NodeId.REPOSITORY) {
      this.options.container = new NodeModel({
        id: doclistStartingPath
      }, {
        connector: this.options.connector,
        autoFetch: true
      });
      this.options.initialContainer = this.options.container;
    }
    var ancestorInfoObject = this.checkAndRetrieveAncestorInfo();
    if (ancestorInfoObject) {
      if (ancestorInfoObject.isFavorites) {
        this.options.favoritesView = true;
        this.options.startLocation = "favorites";
      } else {
        if (typeof ancestorInfoObject.parentContainer !== Backbone.Model) {
          this.options.container = new NodeModel({
            id: ancestorInfoObject.parentContainer?.id
          }, {
            connector: this.options.connector,
            autoFetch: true
          });
        } else {
          this.options.container.set(ancestorInfoObject.parentContainer);
        }
        this.options.initialContainer = this.options.container;
        this.options.ancestors = ancestorInfoObject.ancestors;
      }
    }
    this.options.initialContainer = this._getInitalContainer(this.options);
    this.options.commandType = new CommandType(this.options);
    this.options.selectMultiple = this.options.commandType.multiSelect;
    if (this.options.subTypeFilters && !_.contains(this.options.subTypeFilters, "dm_sysobject") && !_.contains(this.options.subTypeFilters, "dm_folder") && !_.contains(this.options.subTypeFilters, "dm_cabinet")) {
      this.options.selectType = "typeName";
      this.options.selectTypeValue = constants.Types.DOCUMENT;
    }
    this.options.excludeTypes = this.options.excludeTypes || [];
    this.options.excludeTypes.push("d2c_workflow_tracker");
  }
  _.extend(TargetBrowse.prototype, {
    show: function() {
      this._locations = new StartLocationCollection(this.options);
      this._locations.fetch({
        connector: this.options.connector,
        container: this.options.initialContainer,
        removeInvalid: false
      }).always(_.bind(this._showDialog, this));
      this._deferred = $.Deferred();
      this.tempNodeNavFactory = this.options.context.getCollection(NodeNavigationFactory);
      this.tempNodeNavFactoryModels = this.tempNodeNavFactory?.models;
      return this._deferred.promise();
    },
    _showDialog: function() {
      this.recentLocations = this._locations.get("csui/dialogs/node.picker/start.locations/recent.containers");
      var initialLocation = this._getInitialLocation();
      this.searchLocation = initialLocation;
      this._headerControl = this._createHeaderControl(initialLocation);
      var me = this;
      if (this._getInitalContainer().get("id") && this._getInitalContainer().get("id") !== constants.NodeId.REPOSITORY) {
        this._getInitalContainer()?.ensureFetched().then(function() {
          me._createAndShowDialog(initialLocation);
        });
      } else {
        me._createAndShowDialog(initialLocation);
      }
    },
    _createAndShowDialog: function(initialLocation) {
      this._view = this._createTargetBrowseView(initialLocation);
      this._footerView = this._createFooterViewControl();
      this._dialog = this._createDialog();
      this._dialog.show();
    },
    _createHeaderControl: function(initialLocation) {
      var options = this.options, locationSelector = options.locationSelector == null ? true : options.locationSelector;
      if (!options.includeBrowse && !options.includeFavorites && !options.includeRelatedFiles && !options.includeWorkflowTemplates) {
        locationSelector = false;
      }
      if (this.options.initialContainer.get("id") && this.options.includeBrowse) {
        if (this.options.initialContainer.get("id") !== constants.NodeId.REPOSITORY) {
          this.options.localScope = "node";
        } else {
          this.options.localScope = "home";
        }
      } else {
        this.options.localScope = "home";
      }
      this.options.previousLocation = initialLocation;
      var headerView = new HeaderView({
        locations: this._locations,
        title: options.dialogTitle,
        initialLocation: initialLocation,
        includeCombineProperties: options.includeCombineProperties,
        propertiesSeletor: options.propertiesSeletor,
        saveFilter: options.saveFilter,
        locationSelector: locationSelector,
        initialSelection: options.initialSelection,
        globalSearch: options.globalSearch,
        connector: this.options.connector,
        localScope: this.options.localScope
      });
      if (headerView.startLocationView) {
        headerView.startLocationView.on("change:location", this.onChangeLocation, this);
      }
      if (headerView.searchBoxView) {
        headerView.searchBoxView.on("change:searchterm", this.onChangeSearchTerm, this);
      }
      headerView.on("hide:dropdown", this.onClickHideEvent, this);
      return headerView;
    },
    _createTargetBrowseView: function(location) {
      this.options.searchView = false;
      this.options.exitingFromSearch = false;
      var locationParameters;
      try {
        var locationFactory = location.get("factory");
        locationParameters = locationFactory.getLocationParameters(this.options);
      } catch (msg) {
        log.error(msg);
        this._displayAlert(msg);
      }
      if (!this.options.includeBrowse) {
        if (this.options.includeFavorites) {
          locationParameters.favoritesView = true;
        } else if (this.options.includeRelatedFiles) {
          locationParameters.relatedFilesView = true;
        } else if (this.options.includeWorkflowTemplates) {
          locationParameters.workflowTemplatesView = true;
        } else {
          locationParameters.searchView = true;
        }
      }
      _.defaults(locationParameters, this.options);
      locationParameters.collection.url_filter = this.options.url_filter;
      locationParameters.ancestors = this.options.ancestors;
      var view = this.getTargetBrowseViewInstance(locationParameters);
      view.on("change:complete", this.onSelectionChange, this).on("changing:selection", this._blockDialog, this).on("sync:perspective", this.onPerspectiveChange, this).on("change:localScope", this.onChangeLocalScope, this).on("hide:dropdown", this.onClickHideEvent, this).on("hide:dropdownAndClearText", this.onClickHideAndClearEvent, this).on("close", this.forceClosed, this).on("collection:updated", this.onCollectionUpdated, this);
      return view;
    },
    getTargetBrowseViewInstance(locationParameters) {
      return new TargetBrowseView(locationParameters);
    },
    _createFooterViewControl: function() {
      var options = this.options, footerView = new FooterView({
        isMultiSelectEnabled: this.options.commandType.multiSelect,
        maxItemCanSelect: this.options.maxItemCanSelect,
        searchView: this.options.searchView,
        buttons: [ {
          id: "Add",
          label: options.selectButtonLabel || options.commandType.selectButtonLabel,
          default: true,
          disabled: true,
          click: _.bind(this.onClickAddButton, this)
        }, {
          id: "cancel",
          label: lang.cancelButtonLabel,
          close: true,
          click: _.bind(this.onClickCancelButton, this)
        } ]
      });
      footerView.on("hide:dropdown", this.onClickHideEvent, this);
      return footerView;
    },
    _blockDialog: function() {
      this._dialog.blockWithoutIndicator();
      return true;
    },
    dialogClassName: function() {
      var className = "d2-target-browse";
      if (this.options && this.options.view && this.options.view.options && this.options.view.options.saveFilter) {
        className = className + " csui-save-filter-browse";
      }
      return className;
    },
    _createDialog: function() {
      var options = this.options, dialog = new DialogView({
        title: options.dialogTitle,
        headerView: this._headerControl,
        view: this._view,
        className: this.dialogClassName,
        attributes: {
          "aria-label": options.dialogTitle
        },
        largeSize: true,
        footerView: this._footerView
      });
      dialog.listenTo(dialog, "hide", _.bind(this.onHideDialog, this));
      return dialog;
    },
    onChangeLocation: function(location) {
      this._footerView.trigger("browserItems:clear");
      this.options.targetBrowseHistory = [];
      this.options.favoritesView = null;
      location.get("name") === "Favorites" ? this.options.favoritesView = true : this.options.favoritesView = false;
      this._view.destroy();
      this.disableAddButton();
      this.options.previousLocation = location;
      this._view = this._createTargetBrowseView(location);
      this._dialog.showView(this._view);
      this._view.trigger("hide:dropdown");
    },
    onChangeLocationFromBack: function() {
      var location = this.options.previousLocation;
      var locationID = location.get("id").substr(location.get("id").lastIndexOf("/") + 1);
      if (locationID === "search.location") {
        this.options.searchConfig = true;
      }
      this._view.destroy();
      if (this.options.searchConfig) {
        var initialLocation = this._getInitialLocation();
        this.searchLocation = initialLocation;
        this._footerView.trigger("browserItems:clear");
        this._view = this._createTargetBrowseView(initialLocation);
      } else {
        this.disableAddButton();
        this.options.previousLocation = location;
        this._view = this._createTargetBrowseView(location);
      }
      this._dialog.showView(this._view);
      this._view.trigger("hide:dropdown");
      this.options.searchConfig = false;
    },
    onSelectionChange: function(selection) {
      var enableAddButton = false;
      if (selection.length !== 0) {
        enableAddButton = true;
      }
      if (this.options.maxItemCanSelect !== undefined) {
        if (selection.length > this.options.maxItemCanSelect) {
          enableAddButton = false;
          this._footerView.trigger("max:selection:exceed", true, selection.length - this.options.maxItemCanSelect);
        } else {
          this._footerView.trigger("max:selection:exceed", false);
        }
      }
      if (enableAddButton) {
        this._dialog.updateButton("Add", {
          disabled: false
        });
      } else {
        this._dialog.updateButton("Add", {
          disabled: true
        });
      }
    },
    onCollectionUpdated: function(collection) {
      collection.searchView = this.options.searchView;
      this._footerView.trigger("browserItems:changed", collection);
      if (this._view && this._view.searchHeaderView) {
        this._view.searchHeaderView.trigger("browserItems:changed", collection);
      }
    },
    updateHeaderStartLocation: function(node) {
      if (this.options.commandType.browseAllowed(node)) {
        this._headerControl.hideStartLocationLabel(node);
      }
    },
    onClickAddButton: function() {
      if (this && this._view && this._view.getSelection().length > 0) {
        var nodes = this._view.getSelection();
        this._result = {
          nodes: nodes
        };
        this._dialog.destroy();
      } else {
        this.disableAddButton();
      }
    },
    onHideDialog: function() {
      this.options.orderBy = this.options.origOrderBy;
      if (this._deferred) {
        var ancestors, parentContainer, isFavorites;
        if (this._view.breadcrumbs && this._view.breadcrumbs.collection && this._view.breadcrumbs.collection.length > 0) {
          ancestors = this._view.breadcrumbs.collection;
          parentContainer = {
            id: ancestors.at(ancestors.length - 1).get("id")
          };
        } else {
          if (this._previousViewState?.breadcrumbs?.collection) {
            ancestors = this._previousViewState.breadcrumbs.collection;
            parentContainer = {
              id: ancestors.at(ancestors.length - 1).get("id")
            };
          }
        }
        if (this.options.favoritesView) {
          isFavorites = true;
        }
        var lastUsedLocationInfo = {
          ancestors: ancestors,
          parentContainer: parentContainer,
          isFavorites: isFavorites
        };
        this.checkAndSaveAncestorInfo(lastUsedLocationInfo);
        if (this._result) {
          this._deferred.resolve(_.extend(this._result, {
            ancestors: ancestors,
            parentContainer: parentContainer
          }));
        } else if (this._deferred.state() === "pending") {
          this._deferred.reject({
            cancelled: true,
            ancestors: ancestors,
            parentContainer: parentContainer
          });
        }
      }
      this.tempNodeNavFactory.reset(this.tempNodeNavFactoryModels);
    },
    _getInitalContainer: function() {
      return this.options.initialContainer;
    },
    _getInitialLocation: function() {
      var locationId = this.options.startLocation, initialLocation;
      if (locationId) {
        var lastSlash = locationId.lastIndexOf("/");
        if (lastSlash < 0) {
          locationId = "d2/dialogs/target.browse/start.locations/" + locationId;
        }
        initialLocation = this._locations.get(locationId);
      }
      if (!initialLocation) {
        initialLocation = !_.isEmpty(this.options.initialContainer) && this._locations.get("d2/dialogs/target.browse/start.locations/current.location");
        if (!initialLocation) {
          _.find(config.initialLocationLookupOrder, function(locationId) {
            initialLocation = this._locations.get(locationId);
            return initialLocation;
          }, this);
          initialLocation || (initialLocation = this._locations.first());
        }
      }
      return initialLocation;
    },
    onClickCancelButton: function() {
      this._dialog.destroy();
    },
    onPerspectiveChange: function(args) {
      if (this._headerControl.searchBoxView) {
        this._headerControl.searchBoxView.options.selectedNodeId = args.get("id");
        this._headerControl.searchBoxView.options.locationID = args.get("id");
      }
    },
    onChangeLocalScope: function(id) {
      if (id === "search") {
        this.options.localScope = "search";
      } else if (id !== constants.NodeId.REPOSITORY && this.options.includeBrowse && id !== "home") {
        this.options.localScope = "node";
      } else {
        this.options.localScope = "home";
      }
      if (this._headerControl.searchBoxView) {
        this._headerControl.searchBoxView.options.localScope = this.options.localScope;
      }
    },
    _displayAlert: function(resp) {
      var msg = _.str.sformat(resp.message);
      ModalAlert.showInformation(msg);
    },
    onChangeSearchTerm: function(args) {
      if (args?.attributes?.where) {
        this._footerView.trigger("browserItems:clear");
        this._headerControl.searchQueryModel = args;
        this._previousViewState = this._view.breadcrumbs?.collection ? {
          breadcrumbs: this._view.breadcrumbs
        } : this._previousViewState;
        var location = this._locations.get("d2/dialogs/target.browse/start.locations/search.location");
        this._view = this._createSearchResultsView(location);
        this._dialog.showView(this._view);
      }
    },
    onClickHideEvent: function() {
      if (this._headerControl.searchBoxView) {
        if (this._headerControl.searchBoxView.$el.find(".d2-search-options-dropdown").length) {
          this._headerControl.searchBoxView._hideDropdownOptions();
        }
      }
    },
    onClickHideAndClearEvent: function() {
      if (this._headerControl.searchBoxView) {
        if (this._headerControl.searchBoxView.$el.find(".d2-search-options-dropdown").length) {
          this._headerControl.searchBoxView._hideDropdownOptionsAndClearText();
        }
      }
    },
    _createSearchResultsView: function(location) {
      if (this._headerControl.searchQueryModel) {
        this.options.query = this._headerControl.searchQueryModel;
      }
      this.options.searchView = true;
      this.options.localScope = "search";
      var locationFactory = location.get("factory"), locationParameters = locationFactory.getLocationParameters(this.options);
      _.defaults(locationParameters, this.options);
      var view = this.getSearchViewInstance(locationParameters);
      view.on("change:complete", this.onSelectionChange, this).on("changing:selection", this._blockDialog, this).on("open:location", this.onChangeLocationFromBack, this).on("sync:perspective", this.onPerspectiveChange, this).on("change:localScope", this.onChangeLocalScope, this).on("hide:dropdown", this.onClickHideEvent, this).on("hide:dropdownAndClearText", this.onClickHideAndClearEvent, this).on("collection:updated", this.onCollectionUpdated, this).on("close", this.forceClosed, this);
      return view;
    },
    getSearchViewInstance(locationParameters) {
      return new TargetBrowseView(locationParameters);
    },
    disableAddButton: function() {
      this._dialog.updateButton("Add", {
        disabled: true
      });
    },
    checkAndRetrieveAncestorInfo: function() {
      var args = {
        restoreContainer: this.options.restoreContainer,
        dataId: this.options.dataId
      };
      return ContentAssist.checkAndRetrieveAncestorInfo(args);
    },
    checkAndSaveAncestorInfo: function(info) {
      var args = {
        storeContainer: this.options.storeContainer,
        dataId: this.options.dataId,
        parentContainer: info.parentContainer,
        ancestors: info.ancestors,
        isFavorites: info.isFavorites
      };
      ContentAssist.checkAndSaveAncestorInfo(args);
    },
    _getDoclistWidgetConfig: function() {
      var wType = widgetConstants.D2.DOCLIST, wName = RestResources.getCurrentUser().get("defaultWidgets")[widgetConstants.DEFAULT.DOCLIST], widgetConfig = serverQueryUtils.getWidgetConfig(wType, wName);
      return widgetConfig || {};
    }
  });
  TargetBrowse.defaults = {
    containers: {
      selectableTypes: [ -1 ],
      dialogTitle: lang.dialogTitleForContainers
    },
    documents: {
      selectableTypes: [ 144 ],
      dialogTitle: lang.dialogTitleForDocuments
    },
    categories: {
      initialContainer: {
        id: "volume",
        type: 133
      },
      selectableTypes: [ 131 ],
      dialogTitle: lang.dialogTitleForCategories
    }
  };
  return TargetBrowse;
});