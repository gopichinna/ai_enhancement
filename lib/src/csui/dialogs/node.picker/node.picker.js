/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/base", "csui/utils/log", "nuc/contexts/factories/connector", "nuc/models/node/node.model", "nuc/models/node.children2/node.children2", "nuc/models/nodeancestors", "smart/controls/node.picker/node.picker", "csui/utils/contexts/factories/node", "csui/utils/contexts/factories/next.node", "csui/controls/multilingual.text.picker/multilingual.popover.mixin", "csui/dialogs/node.picker/start.locations/start.location.collection", "csui/controls/node-type.icon/node-type.icon.view", "csui/utils/node.links/node.links", "csui/models/node/node.addable.type.factory", "csui/controls/tabletoolbar/tabletoolbar.view", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitems.mask", "csui/controls/toolbar/toolbar.command.controller", "csui/utils/commands", "csui/controls/table/inlineforms/inlineform.factory", "csui/dialogs/node.picker/data/node.picker.extra.data", "i18n!csui/dialogs/node.picker/impl/nls/lang", "i18n!csui/dialogs/node.picker/impl/header/apply.properties.selector/impl/nls/lang" ], function(module, $, _, Backbone, Base, log, ConnectorFactory, NodeModel, NodeChildren2Collection, NodeAncestorCollection, SmartNodePicker, NodeModelFactory, NextNodeModelFactory, MultiLingualPopoverMixin, StartLocationCollection, NodeTypeIconView, NodeLinks, AddableTypeCollectionFactory, TableToolbarView, ToolItemsFactory, ToolItemMask, ToolbarCommandController, commands, inlineFormViewFactory, nodeExtraData, lang, applyPropsLang) {
  var config = _.extend({
    initialLocationLookupOrder: [ "csui/dialogs/node.picker/start.locations/recent.containers", "csui/dialogs/node.picker/start.locations/current.location", "csui/dialogs/node.picker/start.locations/favorites" ]
  }, module.config());
  let includeActions = [];
  let excludeActions = [];
  let showNodeIndicatorsAlways = false;
  Object.keys(config.extensions ?? {}).forEach(key => {
    includeActions = _.union(includeActions, config.extensions[key].includes ?? []);
    excludeActions = _.union(excludeActions, config.extensions[key].excludes ?? []);
    if (config.extensions[key].always) {
      showNodeIndicatorsAlways = true;
    }
  });
  includeActions = _.difference(includeActions, excludeActions);
  function setCollection(coll, includeExtraData = false) {
    let extraFields = nodeExtraData.getModelFields();
    if (includeExtraData && coll.setFields) {
      extraFields.properties = extraFields.properties ?? [];
      coll.setFields(extraFields);
    }
    return coll;
  }
  function NodePicker(options = {}) {
    let cmdName = options?.command ?? "";
    let exc = showNodeIndicatorsAlways && excludeActions.indexOf(cmdName) === -1;
    options.nodeIndicators = exc || includeActions.indexOf(cmdName) !== -1;
    let propertiesOptionsMap = {
      id: {
        KEEP_ORIGINAL_PROPERTIES: 1,
        APPLY_DESTINATION_PROPERTIES: 2
      },
      name: {
        KEEP_ORIGINAL_PROPERTIES: applyPropsLang.KeepOriginalProperties,
        APPLY_DESTINATION_PROPERTIES: applyPropsLang.ApplyDestinationProperties
      }
    };
    if (options.includeCombineProperties) {
      propertiesOptionsMap.id.COMBINE_ALL_PROPERTIES = 3;
      propertiesOptionsMap.name.COMBINE_ALL_PROPERTIES = applyPropsLang.CombineAllProperties;
    }
    let applyPropertiesOptions = [ {
      id: propertiesOptionsMap.id.KEEP_ORIGINAL_PROPERTIES,
      name: propertiesOptionsMap.name.KEEP_ORIGINAL_PROPERTIES
    }, {
      id: propertiesOptionsMap.id.APPLY_DESTINATION_PROPERTIES,
      name: propertiesOptionsMap.name.APPLY_DESTINATION_PROPERTIES
    } ];
    if (options.includeCombineProperties) {
      applyPropertiesOptions.push({
        id: propertiesOptionsMap.id.COMBINE_ALL_PROPERTIES,
        name: propertiesOptionsMap.name.COMBINE_ALL_PROPERTIES
      });
    }
    SmartNodePicker.call(this, _.extend({
      multiLingualPopoverMixin: MultiLingualPopoverMixin,
      isMlDataEnabled: Base.getMetadataLanguageInfo().enabled,
      metadataLanguages: options?.metadataLanguagesBase || Base.getMetadataLanguageInfo(),
      initialLocationLookupOrder: config.initialLocationLookupOrder,
      applyPropertiesOptions: options?.applyPropertiesOptions || applyPropertiesOptions,
      getNodeTypeIconView: NodePicker.prototype.getNodeTypeIconView,
      nodeLinks: NodeLinks,
      getLocations: NodePicker.prototype.getLocations,
      getConnector: NodePicker.prototype.getConnector,
      getInitalContainer: NodePicker.prototype.getInitalContainer,
      getAncestorsCollection: NodePicker.prototype.getAncestorsCollection,
      onClickAncestor: NodePicker.prototype.onClickAncestor,
      fetchContainer: NodePicker.prototype.fetchContainer,
      fetchCollection: NodePicker.prototype.fetchCollection,
      synchronizeTreeCollection: NodePicker.prototype.synchronizeTreeCollection,
      getViewOptions: NodePicker.prototype.getViewOptions,
      resetCollStartPosition: NodePicker.prototype.resetCollStartPosition,
      selectViewRefresh: NodePicker.prototype.selectViewRefresh,
      fetchCollectionOnScroll: NodePicker.prototype.fetchCollectionOnScroll,
      getAddableTypes: NodePicker.prototype.getAddableTypes,
      addEventHandlers: NodePicker.prototype.addEventHandlers,
      initializeToolbar: NodePicker.prototype.initializeToolbar
    }, options));
  }
  NodePicker.prototype = Object.create(SmartNodePicker.prototype);
  _.extend(NodePicker.prototype, {
    getLocations: function(opts) {
      let locationsColl = new StartLocationCollection(opts);
      return new Promise(resolve => {
        locationsColl.fetch({
          connector: opts.connector,
          container: opts.initialContainer,
          removeInvalid: false
        }).always(() => {
          resolve(locationsColl);
        });
      });
    },
    getNodeTypeIconView: function(iconViewOptions) {
      return new NodeTypeIconView(iconViewOptions);
    },
    getConnector: function(options) {
      var connector;
      if (options.context) {
        connector = options.context.getObject(ConnectorFactory);
      } else if (options.initialSelection || options.initialContainer) {
        var initalSelection = options.initialSelection, nodes = initalSelection ? _.isArray(initalSelection) ? initalSelection : initalSelection.models : undefined, node = options.initialContainer || nodes[0];
        connector = node && node.connector;
      }
      return connector;
    },
    getInitalContainer: function(options) {
      var container = options.initialContainer;
      if (container == null || _.isEmpty(container)) {
        var node = options.context && options.context.getModel(NodeModelFactory);
        if (node != null && node.parent != null && node.parent.isFetchable()) {
          if (node.parent.get("id") === 1 || node.get("container")) {
            container = node.clone();
          } else {
            container = node.parent.clone();
          }
        } else {
          container = null;
        }
      } else if (!(container instanceof Backbone.Model)) {
        container = new NodeModel(container, {
          connector: options.connector
        });
      }
      return container;
    },
    getAncestorsCollection: function(nodeId) {
      var node = new NodeModel({
        id: nodeId
      }, {
        connector: this.connector
      }), ancestorOptions = {
        node: node,
        autofetch: true
      }, newAncestors = new NodeAncestorCollection(undefined, ancestorOptions), nodeInfo = {
        node: node,
        ancestorColl: newAncestors
      };
      return nodeInfo;
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
    fetchContainer: function(view) {
      if (view.container && view.container.get("id")) {
        view.container.ensureFetched();
      }
      return true;
    },
    fetchCollection: function(view) {
      var deferred = $.Deferred(), self = this;
      if (!view.options.treeView) {
        view.collection = setCollection(view.collection, view.options.nodeIndicators);
        view.collection.setOrder(this.orderBy, false);
        view.collection.setFilter({
          type: view.options?.listTypes
        }, false);
        view.collection.setLimit(0, this.pageSize || view.options.pageSize, false);
        view.collection.includeResources && view.collection.includeResources(this.includeResources);
        if (view.options?.checkPermissions) {
          view.listenTo(view.collection, "sync", function() {
            view.collection.forEach(item => {
              if (NodePicker.prototype._isUnselectable(item, view.options.context)) {
                item.set("unselectable", true);
              }
            });
          });
        }
        var promise = view.collection.fetch({
          reset: false,
          merge: false,
          remove: false
        });
        promise.done(function(result) {
          view.listView.resolveShortcuts(view.collection).always(function() {
            deferred.resolve(view.collection);
          });
        }).fail(function(resp) {
          deferred.reject(resp);
        });
      } else {
        deferred.resolve(view.collection);
      }
      return deferred;
    },
    synchronizeTreeCollection: function(options) {
      this.groupsCollection = options?.groupsCollection;
      var self = this, firstGroup = this.groupsCollection.at(0), filterObj = {
        favorite_name: this.options?.filterValue
      }, groupChildrenCollection = options?.groupChildrenCollection;
      if (this.groupsCollection.length === 1 && firstGroup.get("tab_id") === -1) {
        self.showFlatList = true;
        var flatListCollection = new groupChildrenCollection(undefined, options);
        flatListCollection.reset(firstGroup[options?.groupsLocationName]?.models || []);
        flatListCollection.setFilter(filterObj);
        if (options?.treeViewOptions?.checkPermissions) {
          flatListCollection.forEach(item => {
            if (NodePicker.prototype._isUnselectable(item, options.context)) {
              item.set("unselectable", true);
            }
          });
        }
        if (!self.options?.filterValue || self.options?.filterValue?.length === 0) {
          self.collection.reset(flatListCollection.models);
        } else {
          self.listenTo(flatListCollection, "sync", function() {
            self.collection.reset(flatListCollection.models);
          });
        }
      } else {
        var promises = [];
        self.showFlatList = false;
        var groups = new Backbone.Collection();
        _.each(this.groupsCollection.models, function(group) {
          var childrenCol = new groupChildrenCollection(undefined, options);
          childrenCol.reset(group[options?.groupsLocationName]?.models);
          childrenCol?.setFilter(filterObj);
          if (options?.treeViewOptions?.checkPermissions) {
            childrenCol.forEach(item => {
              if (NodePicker.prototype._isUnselectable(item, options.context)) {
                item.set("unselectable", true);
              }
            });
          }
          var groupModel = new Backbone.Model(group.attributes);
          groupModel.childrenCollection = childrenCol;
          groupModel.get("tab_id") === -1 && groupModel.set("flatten", true);
          groups.add(groupModel);
          if (self.options?.filterValue && self.options?.filterValue?.length > 0) {
            var deferred = $.Deferred();
            promises.push(deferred.promise());
            self.listenTo(childrenCol, "sync", function() {
              if (groupModel.childrenCollection.length === 0) {
                groups.remove(groupModel);
              }
              deferred.resolve();
            });
          }
        });
        if (self.options?.filterValue && self.options?.filterValue.length > 0) {
          $.when.apply($, promises).then(function() {
            self.collection.reset(groups.models);
          });
        } else {
          self.collection.reset(groups.models);
        }
      }
    },
    _isUnselectable: function(item, context) {
      let user = context._user;
      if (!user) return false;
      if (user.get("privilege_system_admin_rights")) return false;
      if (!item.get("container")) return false;
      if (!(item.get("data") && item.get("data").permissions)) return false;
      if (item.get("data").permissions.filter(item => item.type === "public" && item.permissions?.includes("add_items")).length > 0) return false;
      let userId = user.get("id");
      if (item.get("data").permissions.filter(item => item.right_id === userId && item.permissions?.includes("add_items")).length > 0) return false;
      let groups = context._groups;
      if (!groups) return false;
      let groupIdArr = groups.map(g => g.data?.properties?.id);
      if (item.get("data").permissions.filter(item => groupIdArr.includes(item.right_id) && item.permissions?.includes("add_items")).length > 0) return false;
      return true;
    },
    getViewOptions: function(nodeOrId, connector) {
      var isNode = nodeOrId instanceof Backbone.Model, node = isNode ? nodeOrId : new NodeModel({
        id: nodeOrId
      }, {
        connector: connector
      }), collection = new NodeChildren2Collection(undefined, {
        node: node,
        autofetch: true,
        orderBy: this.orderBy,
        commands: "default,open",
        includeResources: [ "show_hidden" ]
      });
      this.collection = setCollection(this.collection);
      return {
        container: node,
        collection: collection,
        fetchContainer: !isNode
      };
    },
    resetCollStartPosition: function(selectView, searchInfo) {
      selectView.collection = setCollection(selectView.collection, selectView.options.nodeIndicators);
      selectView.collection.setLimit(0, selectView.options?.pageSize, false);
      selectView.collection.setFilter(searchInfo, false);
      let self = this;
      selectView.collection.fetch({
        reset: true
      }).done(function(resp) {
        let anouncementText = _.str.sformat(lang.searchFoundAbout, resp?.results?.length);
        self.masterView.trigger("make:anouncement", {
          message: anouncementText
        });
      }).fail(function(resp) {
        selectView.listView.stopBlocker();
        selectView.trigger("search:failed", {
          resp: resp,
          view: selectView
        });
      });
      selectView.listView.reset();
    },
    selectViewRefresh: function(selectView) {
      selectView.collection = setCollection(selectView.collection, selectView.options.nodeIndicators);
      selectView.collection.fetch({
        reset: true
      }).fail(function() {
        selectView.listView.stopBlocker();
      });
    },
    fetchCollectionOnScroll: function(nodeList) {
      nodeList.collection = setCollection(nodeList.collection);
      nodeList.collection.setSkip(nodeList.collection.length, false);
      nodeList.collection.fetch({
        reset: false,
        remove: false,
        merge: false
      });
    },
    getAddableTypes: function(options) {
      var addableTypesCollection = options.context.getCollection(AddableTypeCollectionFactory, {
        options: {
          node: options.container
        },
        attributes: {
          id: options?.container?.get("id")
        },
        temporary: true
      });
      return new Promise(resolve => {
        addableTypesCollection.ensureFetched().then(function() {
          var filterAddables = addableTypesCollection.filter(model => options.addableTypes?.includes(model.get("type")));
          if (filterAddables.length) {
            var addableTypes = [];
            filterAddables.forEach(model => {
              addableTypes.push({
                type: model.get("type"),
                type_name: model.get("type_name")
              });
            });
            resolve(addableTypes);
          }
        });
      });
    },
    addEventHandlers: function(view) {
      view.listenTo(view, "save:form", function(node) {
        NodePicker.prototype._saveForm(node);
      });
    },
    _saveForm: function(node) {
      var method = node.get("id") === undefined ? "_saveNewModel" : "", promise = this[method](node);
      promise.done(_.bind(function() {
        node.trigger("edit:ended", node);
      }, this));
      return promise;
    },
    _saveNewModel: function(node) {
      var MN = "{0}:_saveNewModel {1}";
      var inlineForm = node.inlineFormView;
      delete node.inlineFormView;
      var data = _.clone(node.attributes);
      delete data.smartInlineFormErrorMessage;
      var self = this;
      return node.save(undefined, {
        data: data,
        wait: true,
        silent: true
      }).then(function() {
        node.set("smartInlineFormErrorMessage", "dummy", {
          silent: true
        });
        node.unset("smartInlineFormErrorMessage");
      }).fail(function(err) {
        node.inlineFormView = inlineForm;
        node.trigger("error", self.model);
        var errorMessage = NodePicker.prototype._getErrorMessageFromResponse(err);
        node.set("smartInlineFormErrorMessage", errorMessage);
        log.error("Saving failed. ", errorMessage) && console.error(log.last);
      });
    },
    _getErrorMessageFromResponse: function(err) {
      var errorMessage;
      if (err && err.responseJSON && err.responseJSON.error) {
        errorMessage = err.responseJSON.error;
      } else {
        var errorHtml = base.MessageHelper.toHtml();
        Base.MessageHelper.reset();
        errorMessage = $(errorHtml).text();
      }
      return errorMessage;
    },
    initializeToolbar: function(headerView) {
      function removeTableToolbarAccessibility(tableToolbarView) {
        var tableToolbarEle = tableToolbarView.$el.find(".csui-tabletoolbar");
        if (tableToolbarEle) {
          tableToolbarEle.removeAttr("aria-label role");
        }
      }
      var addableTypes = headerView.options.context.getCollection(AddableTypeCollectionFactory, {
        options: {
          node: headerView.container
        },
        attributes: {
          id: headerView.container.get("id")
        },
        temporary: true
      });
      var that = headerView;
      addableTypes.ensureFetched().then(function() {
        that?.tableToolbarView?.addToolbarView._adjustToFit();
      });
      headerView.commandController = new ToolbarCommandController({
        commands: commands
      });
      var toolbarItems = {
        addToolbar: new ToolItemsFactory({
          add: []
        }, {
          maxItemsShown: headerView.options.addableTypes.length > 1 ? 0 : 1,
          dropDownIconName: "csui_action_add32",
          dropDownText: lang.ToolbarItemAddItem,
          addTrailingDivider: false
        })
      };
      var maskToAllowOnlySelectedTypes = _.map(headerView.options.addableTypes, function(type) {
        return {
          signature: "Add",
          commandData: {
            type: type
          }
        };
      });
      headerView.tableToolbarView = new TableToolbarView({
        context: headerView.options.context,
        toolbarItems: toolbarItems,
        container: headerView.container,
        collection: headerView.options.collection,
        originatingView: headerView,
        blockingParentView: headerView.options.blockingParentView || headerView,
        addableTypes: addableTypes,
        toolbarCommandController: headerView.commandController,
        creationToolItemsMask: headerView.options.creationToolItemsMask || new ToolItemMask({
          whitelist: maskToAllowOnlySelectedTypes
        }, {
          normalize: false
        }),
        updateAddToolItem: _.bind(function(toolItemModel) {
          if (headerView.options.addableTypes.length === 1) {
            toolItemModel.set({
              renderIconAndText: false,
              renderTextOnly: false,
              iconName: "csui_action_add32",
              dropDownIconName: "csui_action_add32"
            });
          }
        }, headerView)
      });
      headerView.tableToolbarView.render();
      removeTableToolbarAccessibility(headerView.tableToolbarView);
      headerView.listenTo(headerView.commandController, "before:execute:command", NodePicker.prototype.beforeExecuteCommand);
      headerView.listenTo(headerView.commandController, "after:execute:command", NodePicker.prototype.toolbarActionTriggered);
      return headerView.tableToolbarView;
    },
    beforeExecuteCommand: function(toolbarActionContext) {
      var inlineForms = this.options.collection.filter(function(model) {
        return !!model.inlineFormView;
      });
      this.options.collection.remove(inlineForms);
    },
    toolbarActionTriggered: function(toolbarActionContext) {
      if (!toolbarActionContext || toolbarActionContext.cancelled) {
        return;
      }
      if (toolbarActionContext.status.forwardToTable) {
        var inlineFormView = inlineFormViewFactory.getInlineFormView(toolbarActionContext.addableType);
        if (inlineFormView) {
          var newNode = toolbarActionContext.newNodes[0];
          if (!newNode.error) {
            newNode.set("parent_id", this.container.get("id"));
            newNode.isLocallyCreated = true;
            newNode.inlineFormView = inlineFormView;
            this.options.collection.add(newNode, {
              at: 0
            });
            this.listenTo(newNode, "destroy", function() {
              this.tableToolbarView.$el.find("a").trigger("focus");
            });
          }
        }
      }
    }
  });
  NodePicker.defaults = _.extend({}, SmartNodePicker.defaults);
  return NodePicker;
});