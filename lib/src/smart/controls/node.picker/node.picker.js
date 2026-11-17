/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/dialog/dialog.view", "smart/controls/node.picker/impl/node.picker.master.view", "smart/controls/node.picker/impl/node.picker.view", "nuc/models/node/node.model", "smart/controls/bulk.selection/bulk.selection.view", "smart/controls/node.picker/impl/header/header.view", "smart/controls/node.picker/impl/footer/footer.view", "smart/controls/node.picker/impl/command.type", "i18n!smart/controls/node.picker/impl/nls/lang", "nuc/utils/log", "smart/controls/progressblocker/blocker", "css!smart/controls/node.picker/impl/node.picker" ], function(module, _, $, Backbone, Marionette, DialogView, MasterView, NodePickerView, NodeModel, SelectedCountView, HeaderView, FooterView, CommandType, lang, log, BlockingView) {
  "use strict";
  var config = module.config() ?? {};
  config = _.defaults(config, {
    enableGridFeature: false
  });
  var defaultOptions = {
    initialSelection: [],
    selectMultiple: false,
    nodeIndicators: false,
    unselectableNodes: [],
    dialogTitle: lang.dialogTitle,
    orderBy: "name asc"
  };
  function NodePicker(options) {
    options || (options = {});
    this.options = _.defaults(options, defaultOptions, {
      pageSize: 30
    });
    this.options.connector || (this.options.connector = this.options.getConnector(this.options));
    if (!this.options.connector) {
      var msg = "Node Picker: insufficient options";
      log.error(msg) && console.error(msg);
      throw new Error(msg);
    }
    this.options.targetBrowseHistory = [];
    this.options.navigateFromHistory = false;
    this.options.initialContainer = this.options.getInitalContainer(this.options);
    this.options.unselectableNodes = this._getArrayOfNodeIds(options.unselectableNodes);
    this.options.commandType = this?.options?.commandType ?? new CommandType(this.options);
  }
  NodePicker.prototype = Object.create(Object.prototype);
  _.extend(NodePicker.prototype, {
    show: function() {
      if (_.isFunction(this.options?.getLocations)) {
        this.options.getLocations?.call(this, this.options).then(locations => {
          this._locations = locations;
          this._showDialog.call(this);
        }).catch(err => {
          this._showDialog.call(this);
        });
      } else {
        console.error("getLocations is not a function");
      }
      this._deferred = $.Deferred();
      return this._deferred.promise();
    },
    _showDialog: function() {
      if (this.options.commandType.multiSelect) {
        this.selectedCountList = {};
        this.options.selectedCountList = this.selectedCountList;
        this.selectedCountCollection = new Backbone.Collection(_.values(this.selectedCountList));
      }
      this.recentLocations = this._locations.get("csui/dialogs/node.picker/start.locations/recent.containers");
      var invalidLocations = this._locations.where({
        invalid: true
      });
      this._locations.remove(invalidLocations);
      var initialLocation = this._getInitialLocation();
      this.searchLocation = initialLocation;
      _.extend(initialLocation, this.options.selectedCountList);
      this.options.initLocation = initialLocation;
      this.masterView = new MasterView(this.options);
      this.masterView.render();
      this.options.masterView = this.masterView;
      this.options.masterView.enableGridFeature = this.enableGridFeature;
      this.options.masterView.isKeyEvent = this?.options?.isKeyEvent ?? true;
      this._headerControl = this._createHeaderControl(initialLocation);
      this._view = this._createNodePickerView(initialLocation);
      this._footerView = this._createFooterViewControl();
      this._dialog = this._createDialog();
      this.options.masterView._dialog = this._dialog;
      this._dialog.show();
    },
    _createHeaderControl: function(initialLocation) {
      var options = this.options, locationSelector = options.locationSelector == null ? true : options.locationSelector;
      this.options.previousLocation = initialLocation;
      var showSelectedCount = this.options.showSelectedCount ?? true;
      showSelectedCount && this.options.commandType.multiSelect && this._createSelectedCountView();
      var headerView;
      if (this.options.headerView) {
        headerView = this.options.headerView;
      } else {
        headerView = new HeaderView({
          locations: this._locations,
          title: options.dialogTitle,
          initialLocation: initialLocation,
          initialContainer: options.initialContainer,
          propertiesSeletor: options.propertiesSeletor,
          saveFilter: options.saveFilter,
          initialFilter: options.initialFilter,
          locationSelector: locationSelector,
          initialSelection: options.initialSelection,
          globalSearch: options.globalSearch,
          disableSearchFromHere: options.disableSearchFromHere,
          headerInputAria: options.headerInputAria,
          multilingualPopoverMixin: options.multilingualPopoverMixin,
          multiSelect: this.options.commandType.multiSelect,
          selectedCountView: this.options.selectedCountView,
          showSelectedCount: this.options.showSelectedCount,
          selectedCountCollection: this.selectedCountCollection,
          showTargetLocationName: this.options?.showTargetLocationName,
          isMlDataEnabled: this.options?.isMlDataEnabled,
          multiLingualPopoverMixin: this.options?.multiLingualPopoverMixin,
          metadataLanguages: this.options?.metadataLanguages,
          masterView: options?.masterView
        });
        headerView.on("change:filterName", this.onChangeFilterName, this);
        headerView.on("focusout:filterName", this.onFocusOutFilterName, this);
        if (headerView.searchBoxView) {
          headerView.searchBoxView.on("change:searchterm", this.onChangeSearchTerm, this);
        }
      }
      return headerView;
    },
    _createSelectedCountView: function() {
      this.selectedCountView = new SelectedCountView({
        collection: this.selectedCountCollection,
        getNodeTypeIconView: this.options?.getNodeTypeIconView,
        scrollableParent: ".cs-start-locations .csui-np-content .list-content"
      });
      this.selectedCountView.listenTo(this.selectedCountView.collection, "remove", _.bind(function(model) {
        var npViews = this._view.selectViews, modelId = model.get("id");
        delete this.selectedCountList[modelId];
        this._dialog.updateButton("select", {
          disabled: this._view.getNumberOfSelectItems() <= 0
        });
        if (!this.updatedCheckbox) {
          this.masterView?.trigger("update:checkbox", {
            modelId: modelId
          });
        } else {
          this.updatedCheckbox = false;
        }
      }, this));
      this.selectedCountView.listenTo(this.selectedCountView.collection, "reset", _.bind(function() {
        var npViews = this._view.selectViews;
        _.each(this.selectedCountList, _.bind(function(model) {
          var modelId = model.get("id");
          delete this.selectedCountList[modelId];
          this._dialog.updateButton("select", {
            disabled: this._view.getNumberOfSelectItems() <= 0
          });
          this.masterView?.trigger("update:checkbox", {
            modelId: modelId
          });
        }, this));
      }, this));
      this.options.selectedCountView = this.selectedCountView;
    },
    _createNodePickerView: function(location, leftSelection) {
      this.options.searchView = false;
      const locationFactory = location.get("factory"), enableFun = locationFactory?.enable ?? (opts => {
        return false;
      });
      let enabled = this.enableGridFeature && enableFun(this.options);
      var locationParameters = locationFactory.getLocationParameters(this.options), enableGrid = enabled, locationSelector = this.options.locationSelector ?? true;
      _.defaults(locationParameters, {
        leftSelection: leftSelection,
        locations: this._locations,
        title: this.options.dialogTitle,
        saveFilter: this.options.saveFilter,
        initialFilter: this.options.initialFilter,
        locationSelector: locationSelector,
        initialLocation: location,
        getAncestorsCollection: this.options?.getAncestorsCollection,
        onClickAncestor: this.options?.onClickAncestor,
        fetchContainer: this.options?.fetchContainer,
        fetchCollection: this.options?.fetchCollection,
        getViewOptions: this.options?.getViewOptions,
        selectViewRefresh: this.options?.selectViewRefresh,
        fetchCollectionOnScroll: this.options?.fetchCollectionOnScroll,
        getAddableTypes: this.options?.getAddableTypes,
        addEventHandlers: this.options?.addEventHandlers,
        isMlDataEnabled: this.options?.isMlDataEnabled,
        multiLingualPopoverMixin: this.options?.multiLingualPopoverMixin,
        metadataLanguages: this.options?.metadataLanguages,
        requestLazyAddableTpes: this.options?.requestLazyAddableTpes,
        showCustomInlineForm: this.options?.showCustomInlineForm,
        hasTableToolbarView: this.options?.hasTableToolbarView,
        initializeToolbar: this.options.initializeToolbar,
        creationToolItemsMask: this.options.creationToolItemsMask,
        treeView: locationParameters?.isTreeView,
        enableGrid: enableGrid
      }, this.options);
      var view = new NodePickerView(locationParameters);
      this.options?.masterView.off("change:complete", this.onSelectionChange).on("change:complete", this.onSelectionChange, this).off("changing:selection", this._blockDialog).on("changing:selection", this._blockDialog, this).off("back:toSearch", this.onClickBackFromFolderToSearch).on("back:toSearch", this.onClickBackFromFolderToSearch, this).off("change:location:from:back", this.onChangeLocationFromBack).on("change:location:from:back", this.onChangeLocationFromBack, this).off("back:from:search:to:grid", this.onBackFromSearchToGrid).on("back:from:search:to:grid", this.onBackFromSearchToGrid, this).off("close", this.forceClosed).on("close", this.forceClosed, this).off("add:to:collection").on("add:to:collection", _.bind(function(options) {
        this.selectedCountList[options.id] = options.node;
        this.selectedCountCollection.add(_.values(this.selectedCountList));
      }, this)).off("remove:from:collection").on("remove:from:collection", _.bind(function(options) {
        this.updatedCheckbox = true;
        this.selectedCountCollection.remove(options.node);
      }, this));
      view.startLocationView && view.startLocationView.on("change:location", this.onChangeLocation, this);
      view.selectViews.on("drill:up", this.onDrillUp, this);
      return view;
    },
    _createFooterViewControl: function() {
      var options = this.options, footerView = new FooterView({
        propertiesSeletor: this.options.propertiesSeletor,
        applyPropertiesOptions: this.options.applyPropertiesOptions,
        defaultPropertySelector: this.options.defaultPropertySelector,
        hideOpenPropertiesPage: this.options.hideOpenPropertiesPage,
        isMultiSelectEnabled: this.options.commandType.multiSelect,
        masterView: this.options?.masterView,
        buttons: [ {
          id: "select",
          label: options.selectButtonLabel || options.commandType.selectButtonLabel,
          default: true,
          disabled: true,
          click: _.bind(this.onClickSelectButton, this)
        }, {
          id: "cancel",
          label: lang.cancelButtonLabel,
          close: true,
          click: _.bind(this.onClickCancelButton, this)
        } ]
      });
      return footerView;
    },
    _blockDialog: function() {
      this._dialog.blockWithoutIndicator();
      return true;
    },
    dialogClassName: function() {
      var className = "smart-target-browse";
      if (this.options?.view?.options?.saveFilter) {
        className = className + " csui-save-filter-browse";
      }
      return className;
    },
    _createDialog: function() {
      var options = this.options, dialog = new DialogView({
        title: options.dialogTitle + " " + (this.options.initialContainer?.get("name") || ""),
        headerView: this._headerControl,
        view: this._view,
        className: this.dialogClassName,
        attributes: {
          "aria-label": options.dialogTitle + " " + (this.options.initialContainer?.get("name") || "")
        },
        largeSize: true,
        footerView: this._footerView
      });
      dialog.listenTo(dialog, "hide", _.bind(this.onHideDialog, this));
      var self = this;
      dialog.listenTo(dialog, "destroy", _.bind(function() {
        self.masterView.$el.off();
        self.masterView.destroy();
      }), self);
      BlockingView.imbue(dialog);
      return dialog;
    },
    onChangeLocation: function(location) {
      this.masterView.setGrid = false;
      this.options.targetBrowseHistory = [];
      this._view.destroy();
      if (!this._view.options.commandType.multiSelect) {
        this._view.selectViews.clearSelect();
      }
      this._dialog.updateButton("select", {
        disabled: this._view.getNumberOfSelectItems() <= 0
      });
      this.options.previousLocation = location;
      this._view = this._createNodePickerView(location);
      var node = location.get("factory").container;
      this.updateSearch(node, undefined, undefined, !node ? location?.get("name") : "");
      this.masterView.trigger("change:location:properties", location);
      this._dialog.showView(this._view);
    },
    onChangeSearchTerm: function(args) {
      this._headerControl.searchQueryModel = args;
      this._view.destroy();
      this._dialog.updateButton("select", {
        disabled: this._view.getNumberOfSelectItems() <= 0
      });
      var browsedChild = this.rightView?.listView.browsedChild ? this.rightView?.listView.browsedChild : this.leftView?.listView.browsedChild;
      if (this.options.targetBrowseHistory.length === 0) {
        var locationObj = {
          leftId: this.options.previousLocation.id,
          rightId: browsedChild ? browsedChild.model.get("id") : undefined
        };
        this.options.targetBrowseHistory.push([ "location", locationObj ]);
      }
      if (!this._view.options.navigateFromHistory && !this.options.searchView) {
        var leftView = this._view.selectViews?.leftView, rightView = this._view.selectViews?.rightView, page = Math.floor((leftView?.collection?.skipCount || 0) / leftView?.collection?.topCount) + 1, pageSize = parseInt(leftView?.collection?.topCount) * parseInt(page);
        if (this.options.masterView.isGridView() && rightView) {
          var gridNodeObj = {
            leftId: rightView?.container?.get("id") ?? undefined,
            rightId: rightView?.container?.get("id") ?? undefined,
            pageSize: pageSize
          };
          this.options.targetBrowseHistory.push([ "node", gridNodeObj ]);
        } else {
          if (leftView.container && rightView) {
            var nodeObj = {
              leftId: rightView?.container?.parent?.get("id") ?? undefined,
              rightId: rightView?.container?.get("id") ?? undefined,
              pageSize: pageSize
            };
            this.options.targetBrowseHistory.push([ "node", nodeObj ]);
          } else if (leftView.container && rightView === null && [ "csui/dialogs/node.picker/start.locations/current.location", "csui/dialogs/node.picker/start.locations/enterprise.volume" ].indexOf(this.options.previousLocation.get("id")) < 0) {
            var nodeObj1 = {
              leftId: leftView.container.get("id"),
              rightId: undefined,
              pageSize: pageSize
            };
          }
        }
      }
      this.options.locationID = !!this._view.breadcrumbNode ? this._view.breadcrumbNode.get("id") : this.options.locationID;
      this.searchLocation = this.options.previousLocation;
      var location = this._locations.get("csui/dialogs/node.picker/start.locations/search.location");
      this.masterView.trigger("change:location:properties", location);
      this._view = this._createSearchResultsView(location);
      this._dialog.showView(this._view);
    },
    _createSearchResultsView: function(location, isBackClick) {
      if (this._headerControl.searchQueryModel) {
        this.options.query = this._headerControl.searchQueryModel;
      }
      let locationSelector = this.options.locationSelector ?? true, searchInputVal = this._headerControl?.searchBoxView?.el.querySelector(".smart-otc-search-input").value.trim();
      this.options.locations = this._locations, this.options.searchTitleName = searchInputVal;
      var showSelectedCount = this.options.showSelectedCount ?? true;
      showSelectedCount && this.options.commandType.multiSelect && !this.selectedCountView && this._createSelectedCountView();
      this.options.locationSelector = locationSelector;
      this.options.searchView = true;
      var locationFactory = location.get("factory"), locationParameters = locationFactory.getLocationParameters(this.options);
      _.defaults(locationParameters, this.options);
      var view = new NodePickerView(locationParameters);
      this.options?.masterView.off("change:complete", this.onSelectionChange).on("change:complete", this.onSelectionChange, this).off("changing:selection", this._blockDialog).on("changing:selection", this._blockDialog, this).off("open:location", this.onClickLocationFromSearch).on("open:location", this.onClickLocationFromSearch, this).off("change:location:from:back", this.onChangeLocationFromBack).on("change:location:from:back", this.onChangeLocationFromBack, this).off("back:toSearch", this.onClickBackFromFolderToSearch).on("back:toSearch", this.onClickBackFromFolderToSearch, this).off("close", this.forceClosed).on("close", this.forceClosed, this).off("add:to:collection").on("add:to:collection", _.bind(function(options) {
        this.selectedCountList[options.id] = options.node;
        this.selectedCountCollection.add(_.values(this.selectedCountList));
      }, this)).off("remove:from:collection").on("remove:from:collection", _.bind(function(options) {
        this.updatedCheckbox = true;
        this.selectedCountCollection.remove(options.node);
      }, this));
      view.startLocationView && view.startLocationView.on("change:location", this.onChangeLocation, this);
      return view;
    },
    onChangeLocationFromBack: function(args, isGridView) {
      this.options.gridView = this.masterView.isGridView();
      this.options.targetBrowseHistory = [];
      var location = this._locations.get(args[1].leftId), leftSelection = args[1].rightId, locationFactory = location.get("factory");
      locationFactory.options.container = locationFactory.options.container ?? this.options.container;
      this._view.destroy();
      this._dialog.updateButton("select", {
        disabled: this._view.getNumberOfSelectItems() <= 0
      });
      this.options.previousLocation = location;
      if (this.masterView?.setGrid) {
        this.masterView.setGrid = false;
        leftSelection = undefined;
      }
      this.masterView.trigger("change:location:properties", location);
      if (this.masterView.isGridView()) {
        this._view = this._createNodePickerView(location);
      } else {
        this._view = this._createNodePickerView(location, leftSelection);
      }
      var node = location.get("factory").container;
      this.updateSearch(node, undefined, undefined, location?.get("name"));
      this.masterView.trigger("change:location:properties", location);
      this._dialog.showView(this._view);
      this._view.selectViews.options.backBtn = true;
      this._view.hideStartLocationLabel(node);
    },
    onClickBackFromSearch: function() {
      this._view.destroy();
      this._dialog.updateButton("select", {
        disabled: this._view.getNumberOfSelectItems() <= 0
      });
      var locationID = !!this.options.locationID ? this.options.locationID : this.options.container ? this.options.container.get("id") : this.options.nodes.models.length > 0 ? this.options.nodes.models[0].get("id") : null;
      var nodeModel = new NodeModel({
        id: locationID
      }, {
        connector: this.options.connector
      });
      this.updateSearch(nodeModel, undefined, true);
      var location = this._locations.get("csui/dialogs/node.picker/start.locations/search.location");
      if (this.options.locationID === 0) {
        location = this.options.previousLocation;
      }
      if (!!location) {
        var locationFactory = location.get("factory");
        locationFactory.options.container = nodeModel;
        this._view = this._createNodePickerView(location);
        this.masterView.trigger("change:location:properties", location);
        if (this._view) {
          this._dialog.showView(this._view);
        }
      }
      this._view.selectViews.options.backBtn = true;
    },
    onClickLocationFromSearch: function(nodeModel) {
      this._view.destroy();
      this._dialog.updateButton("select", {
        disabled: this._view.getNumberOfSelectItems() <= 0
      });
      var location = this._locations.get("csui/dialogs/node.picker/start.locations/default.location"), locationFactory = location.get("factory");
      locationFactory.options.container = nodeModel;
      this.options.targetBrowseHistory.push([ "search", this.options.query.clone() ]);
      this._view = this._createNodePickerView(location);
      this.masterView.trigger("change:location:properties", location);
      if (this._view) {
        this._dialog.showView(this._view);
        this._view.showBackButton();
      }
    },
    onBackFromSearchToGrid: function({
      leftNode,
      rightNode
    }) {
      var copyHistory = this.options?.targetBrowseHistory, leftSelection = rightNode?.get("id");
      this._view.destroy();
      this._dialog.updateButton("select", {
        disabled: this._view.getNumberOfSelectItems() <= 0
      });
      var location = this._locations.get(this.options.previousLocation.id), locationFactory = location.get("factory");
      locationFactory.options.container = leftNode;
      this._view = this._createNodePickerView(location, leftSelection);
      this.options.targetBrowseHistory = copyHistory;
      this.masterView.trigger("change:location:properties", location);
      if (this._view) {
        this._dialog.showView(this._view);
        this._view.showBackButton();
      }
    },
    onClickBackFromFolderToSearch: function(view) {
      if (this.masterView?.setGrid) {
        this.masterView.setGrid = false;
      }
      this._view.destroy();
      this._headerControl.searchQueryModel = view.requestedQueryModel;
      this.updateSearch(view.options.container, view.requestedQueryModel, true);
      this._dialog.updateButton("select", {
        disabled: this._view.getNumberOfSelectItems() <= 0
      });
      var location = this._locations.get("csui/dialogs/node.picker/start.locations/search.location");
      this._view = this._createSearchResultsView(location, true);
      this._view.options.navigateFromHistory = view.options.navigateFromHistory;
      this.masterView.trigger("change:location:properties", location);
      this._dialog.showView(this._view);
      this._view.selectViews.options.backBtn = true;
    },
    onSelectionChange: function(node, isAdd = true) {
      var disable = this._view.getNumberOfSelectItems() > 0, hasFilterName;
      if (node && node.get("id") && node.get("name")) {
        this.options.locationID = node.get("id");
        this.updateSearch(node, undefined, undefined, undefined, !!isAdd ? false : true);
      }
      this._dialog.destroyBlockingView();
      if (this.options.saveFilter && this._headerControl && this._headerControl.ui.saveFilter) {
        hasFilterName = this._headerControl.ui.saveFilter.val().trim() ? true : false;
        if (hasFilterName && disable) {
          this._dialog.updateButton("select", {
            disabled: false
          });
        } else {
          this._dialog.updateButton("select", {
            disabled: true
          });
        }
      } else {
        this._dialog.updateButton("select", {
          disabled: !disable
        });
      }
      if (!!this._view.selectViews.options.backBtn) {
        this._view.selectViews.options.backBtn = false;
        if (this.options?.masterView?.isKeyEvent) {
          this._view?.el?.querySelector(".list-content li:first-child")?.focus();
        }
      }
    },
    onChangeFilterName: function() {
      var eleLoadContainer = this._dialog.$el.find("div[class='load-container']");
      if (this.options.saveFilter && eleLoadContainer && eleLoadContainer.length === 0) {
        var hasFilterName, disable, isEmpty = true;
        if (this._headerControl.ui.saveFilter) {
          isEmpty = this._headerControl.ui.saveFilter.val().trim().length < 1 ? true : false;
        }
        disable = this._view.getNumberOfSelectItems() > 0;
        if (this._headerControl && this._headerControl.ui.saveFilter) {
          hasFilterName = !isEmpty;
        }
        if (hasFilterName && disable) {
          this._dialog.updateButton("select", {
            disabled: false
          });
        } else {
          this._dialog.updateButton("select", {
            disabled: true
          });
        }
      }
    },
    onFocusOutFilterName: function() {
      this.isValidVirtualFolderName();
    },
    isValidVirtualFolderName: function() {
      var isEmpty = false, isColonExists = false;
      if (this._headerControl.ui.saveFilter && this._headerControl.ui.saveFilter.length === 1 && this._headerControl.ui.saveFilter.val() !== undefined && this._headerControl.ui.saveFilter.val() !== null) {
        isEmpty = this._headerControl.ui.saveFilter.val().trim().length < 1 ? true : false;
        isColonExists = this._headerControl.ui.saveFilter.val().indexOf(":") >= 0 ? true : false;
      }
      if (isEmpty) {
        this._headerControl.showErrorMessage(lang.nameCannotBeEmpty);
      } else if (isColonExists) {
        this._headerControl.showErrorMessage(lang.nameCannotContainColon);
      } else {
        this._headerControl.removeErrorMessage();
      }
      return !isEmpty && !isColonExists;
    },
    updateHeaderStartLocation: function(node) {
      if (this.options.commandType.browseAllowed(node)) {
        this._view?.hideStartLocationLabel(node);
      }
    },
    updateSearch: function(node, queryModel, flag, _locationName, hideLocationName) {
      var locationID = !!node ? node.get("id") : undefined, locationName = node?.get("name") || _locationName || "";
      if (this._headerControl.searchBoxView && this._headerControl.searchboxModel) {
        if (flag) {
          var prevLocation = queryModel ? queryModel.get("location_id1") : this._headerControl.searchBoxView.model.get("location_id1");
          this._headerControl.searchboxModel.nodeId = prevLocation;
        } else {
          this._headerControl.searchboxModel.nodeId = locationID;
        }
        this._headerControl.searchboxModel.nodeName = locationName;
        this._headerControl.searchboxModel.trigger("change");
        const selectable = node && this.options?.commandType?.isSelectable(node) || false;
        if (!node || node && selectable) {
          this._headerControl?.trigger("update:target:location:name", !hideLocationName ? locationName : "");
        }
        this._dialog.el?.setAttribute("aria-label", this.options.dialogTitle + " " + (!hideLocationName ? locationName : ""));
      }
    },
    onClickSelectButton: function() {
      if (this && this._view && this._view.getSelection().length > 0) {
        var nodes = this._view.getSelection(), properties = this._footerView.propertiesView, filterName, multiLingualData;
        if (this._headerControl.searchQueryModel) {
          this._headerControl.searchQueryModel.clear({
            silent: true
          });
        }
        if (this._headerControl.ui && this._headerControl.ui.saveFilter && this.isValidVirtualFolderName()) {
          filterName = this._headerControl.ui.saveFilter.val();
          multiLingualData = this._headerControl.model && this._headerControl.model.get("name_multilingual");
        } else {
          return;
        }
        this._result = {
          nodes: nodes,
          applyProperties: properties && properties.selected,
          openSelectedProperties: properties && properties.openSelectedProperties,
          filterName: filterName,
          multiLingualData: multiLingualData
        };
        if (this.options?.executeCustomCallbackAfterSelection) {
          this.options.executeCustomCallbackAfterSelection(this);
        } else if (this.options.enableCustomDialogDestroy) {
          this.onHideDialog();
        } else {
          this._dialog.destroy();
        }
      } else {
        this._dialog.updateButton("select", {
          disabled: true
        });
      }
    },
    onHideDialog: function() {
      if (this._deferred) {
        if (this._result) {
          this._deferred.resolve(this._result);
        } else if (this._deferred.state() === "pending") {
          this._deferred.reject({
            cancelled: true
          });
        }
      }
      if (this._headerControl.searchQueryModel) {
        this._headerControl.searchQueryModel.clear({
          silent: true
        });
      }
    },
    _getArrayOfNodeIds: function(unselectableNodes) {
      if (unselectableNodes && !_.isEmpty(unselectableNodes)) {
        if (unselectableNodes[0] instanceof Backbone.Model) {
          return _.map(unselectableNodes, function(node) {
            return node.get("id");
          });
        }
      }
      return unselectableNodes;
    },
    _getInitialLocation: function() {
      var locationId = this.options.startLocation, initialLocation;
      if (locationId) {
        var lastSlash = locationId.lastIndexOf("/");
        if (lastSlash < 0) {
          locationId = "csui/dialogs/node.picker/start.locations/" + locationId;
        }
        initialLocation = this._locations.get(locationId);
      }
      if (!initialLocation) {
        initialLocation = !_.isEmpty(this.options.initialContainer) && this._locations.get("csui/dialogs/node.picker/start.locations/current.location");
        if (!initialLocation) {
          _.find(this.options?.initialLocationLookupOrder, function(locationId) {
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
    }
  }, {
    enableGridFeature: config.enableGridFeature ?? false
  });
  NodePicker.defaults = {
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
  return NodePicker;
});