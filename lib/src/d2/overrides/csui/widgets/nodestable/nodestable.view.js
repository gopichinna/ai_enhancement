/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/base", "nuc/models/node/node.model", "csui/controls/form/pub.sub", "csui/controls/table/table.view", "csui/controls/thumbnail/thumbnail.view", "csui/widgets/nodestable/nodestable.view", "csui/utils/accessibility", "csui/utils/contexts/factories/next.node", "csui/controls/table/cells/select/select.view", "csui/utils/contexts/factories/ancestors", "d2/controls/tree/node.tree.view", "d2/dialogs/document.preview/document.preview.view", "d2/models/workflow/tasks", "dctmw/server.adaptors/converters/node", "d2/widgets/workflowstable/workflow.toolbaritems", "d2/widgets/workflowstable/workflow.toolbaritems.masks", "d2/utils/constants", "d2/utils/widget.constants", "d2/utils/contexts/context.controller", "d2/utils/event.utils", "d2/utils/node.utils", "d2/utils/server.query.utils", "dctmw/utils/utils", "d2/utils/filter.utils", "d2/utils/widgets.utils", "csui/controls/pagination/nodespagination.view", "dctmw/utils/user.preference.storage", "dctmw/events/oah/dctm.oah.handler", "dctmw/events/oah/events.constants", "i18n!d2/overrides/csui/widgets/nodestable/impl/nls/lang", "i18n!d2/commands/nls/localized.strings", "i18n!csui/widgets/nodestable/impl/nls/lang" ], function(i18n, $, _, Marionette, base, NodeModel, PubSub, TableView, ThumbnailView, NodesTableView, Accessibility, NextNodeModelFactory, SelectCellView, AncestorCollectionFactory, NodeTreeView, DocumentPreview, TaskCollection, nodeConverter, WorkflowToolItems, WorkflowToolItemsMasks, constants, widgetConstants, D2ContextController, eventUtils, nodeUtils, serverQueryUtils, utils, FilterUtils, widgetUtils, PaginationView, userPreference, DctmOahHandler, eventsConstants, lang, toolsLang, nodestableLang) {
  "use strict";
  var accessibleTable = Accessibility.isAccessibleTable(), singleSelectNodeTypes = [ constants.Types.WORKFLOW ];
  var proto = NodesTableView.prototype, oldFacetPanelView = proto._setFacetPanelView, oldFacetBarView = proto._setFacetBarView, oldCompleteFilterCommand = proto._completeFilterCommand, oldtoolbarActionTriggered = proto._toolbarActionTriggered, oldInitialize = proto.initialize, oldOnDestroy = proto.onDestroy, oldUpdateZeroRecordsMessage = proto._updateZeroRecordsMessage, oldChangingContainer = proto._changingContainer, facetPanelToggleIconSelector = '.csui-filterToolbar li[data-csui-command="filter"] svg.csui-icon-v2', facetPanelToggleIconActiveStateClassName = "csui-icon-v2-on", oldOnBeforeRender = proto.onBeforeRender, oldShowFacetPanelView = proto._showFacetPanelView, oldHideFacetPanelView = proto._hideFacetPanelView, oldSetTableViewEvents = proto._setTableViewEvents, oldShowRowSelectionToolbar = proto._showRowSelectionToolbar, oldSetTableRowSelectionToolbar = proto.setTableRowSelectionToolbar, oldSetThumbnailView = proto._setThumbnailView, oldEnableThumbnailView = proto.enableThumbnailView, oldResetAllSelectedItems = proto.resetAllSelectedItems, oldCanAddItems = proto.canAddItems, oldInitPreferences = proto._initPreferences, oldGetContainerPrefs = proto.getContainerPrefs, oldSetPreference = proto.setPreference, oldSetTableMode = proto.setTableMode;
  function toggleFilterToolbar(view, model) {
    if (model && model.node && (nodeConverter.isRepositoryNode(model.node) || nodeConverter.isFavoritesNode(model.node))) {
      if (!view.ui.facetView.hasClass("csui-facetview-visibility") && !view.ui.facetView.hasClass("csui-facetview-hidden")) {
        view._ignoreSavingStateForNextFacetPanelToggle = true;
        view._completeFilterCommand.call(view);
        view.facetBarView && view.facetBarView.$el.addClass("d2-facet-bar-hidden");
      }
    }
  }
  function restoreInitTreeState(view) {
    var widgetInfo = view.getWidgetDetails();
    if (widgetInfo) {
      var widgetConfig = serverQueryUtils.getWidgetConfig(widgetInfo.widgetType, widgetInfo.widgetName), treePanelState = view.getPreference("isTreeOpen");
      if (view.context.isFolderBrowser !== true && widgetConfig.getParam("is_enable_tree_nav_smartview") === "true" && treePanelState !== false) {
        setTimeout(() => {
          view._completeTreeCommand();
        });
      }
    }
  }
  function setTreeActiveState(view) {
    var title = view.showTree ? toolsLang.NodeTreeCollapse : toolsLang.CommandNameNodeTree;
    view.$('.csui-filterToolbar li[data-csui-command="d2-nodetree"] .csui-toolitem').attr({
      title: title,
      "aria-label": title
    });
    if (view.showTree) {
      view.$('.csui-filterToolbar li[data-csui-command="d2-nodetree"] svg.csui-icon-v2').addClass("csui-icon-v2-on");
    } else {
      view.$('.csui-filterToolbar li[data-csui-command="d2-nodetree"] svg.csui-icon-v2').removeClass("csui-icon-v2-on");
    }
  }
  function setFilterActiveState(view) {
    view._setFilterActiveState(view.showFilter);
  }
  function updateSelectableState(models, enable, thumbnail) {
    _.each(models, function(model) {
      model.originalSelectable = _.has(model, "originalSelectable") ? model.originalSelectable : model.get("selectable");
      if (model.originalSelectable !== false) {
        model.set("selectable", enable, {
          silent: true
        });
        model.trigger("change:selectable", model, enable);
        thumbnail && model.trigger("change:" + SelectCellView.isSelectedModelAttributeName, model, false);
      }
    });
  }
  function onRowSelection(args) {
    var updatedNodes = [], isTable = args.sender instanceof TableView, isThumbnail = args.targets instanceof ThumbnailView, selectAllRegion = isTable ? this.tableView && this.tableView._selectAllCheckboxRegion : isThumbnail ? this.thumbnail && this.thumbnail.headerRegion && this.thumbnail.headerRegion.currentView.selectAllRegion : null, selectAllToggled = isTable ? this.tableView && selectAllRegion && selectAllRegion.currentView && selectAllRegion.currentView.model.changed && selectAllRegion.currentView.model.changed.checked === "true" : isThumbnail ? args.nodes.length === this.collection.length : false;
    var updateSelectAll = function() {
      var selectAllRegion = isTable ? this.tableView && this.tableView._selectAllCheckboxRegion : isThumbnail ? this.thumbnail && this.thumbnail.headerRegion && this.thumbnail.headerRegion.currentView.selectAllRegion : null;
      if (selectAllRegion) {
        if (isSingleNodeSelected) {
          selectAllRegion.currentView.setChecked(false);
          selectAllRegion.currentView.setDisabled(true);
        } else {
          selectAllRegion.currentView.setChecked(true);
        }
        this.tableView && this.tableView.off("render", updateSelectAll, this);
        this.thumbnail && this.thumbnail.off("render", updateSelectAll, this);
      } else if (selectAllRegion === null) {
        this.tableView && this.tableView.off("render", updateSelectAll, this);
        this.thumbnail && this.thumbnail.off("render", updateSelectAll, this);
      }
    };
    if (selectAllToggled) {
      var singleSelectModels = _.chain(_.filter(this.collection.allModels, function(model) {
        return _.contains(singleSelectNodeTypes, model.get("type"));
      })).each(function(singleSelectModel) {
        if (singleSelectModel.get(SelectCellView.isSelectedModelAttributeName) !== false) {
          updatedNodes.push(singleSelectModel);
          singleSelectModel.set(SelectCellView.isSelectedModelAttributeName, false);
        }
      }).value();
      singleSelectModels.length && updateSelectableState(singleSelectModels, false, isThumbnail);
    } else if (args.nodes.length) {
      var isSingleNodeSelected = _.find(args.nodes, function(selectedNode) {
        return _.contains(singleSelectNodeTypes, selectedNode.get("type"));
      });
      if (isSingleNodeSelected) {
        var restNodes = _.chain(_.filter(this.collection.allModels, function(model) {
          return isSingleNodeSelected.get("id") !== model.get("id") && model.get("selectable") !== false;
        })).each(function(model) {
          if (model.get(SelectCellView.isSelectedModelAttributeName) !== false) {
            updatedNodes.push(model);
            model.set(SelectCellView.isSelectedModelAttributeName, false);
          }
        }).value();
        restNodes.length && updateSelectableState(restNodes, false, isThumbnail);
        if (selectAllRegion && selectAllRegion.currentView) {
          selectAllRegion.currentView.setChecked("false");
          selectAllRegion.currentView.setDisabled(true);
        } else {
          if (isThumbnail) {
            this.listenTo(this.thumbnail, "render", updateSelectAll);
          } else if (isTable) {
            this.listenTo(this.tableView, "render", updateSelectAll);
          }
        }
      } else {
        var singleSelectNodes = _.chain(_.filter(this.collection.allModels, function(model) {
          return _.contains(singleSelectNodeTypes, model.get("type"));
        })).each(function(model) {
          if (model.get(SelectCellView.isSelectedModelAttributeName) !== false) {
            updatedNodes.push(model);
            model.set(SelectCellView.isSelectedModelAttributeName, false);
          }
        }).value();
        singleSelectNodes.length && updateSelectableState(singleSelectNodes, false, isThumbnail);
        var allSelectedNodes = isThumbnail ? this.thumbnail._allSelectedNodes : isTable ? this.tableView && this.tableView._allSelectedNodes : {};
        if (this.collection.length - singleSelectNodes.length === allSelectedNodes.length) {
          if (selectAllRegion) {
            selectAllRegion.currentView && selectAllRegion.currentView.setChecked("true");
          } else {
            if (isThumbnail) {
              this.listenTo(this.thumbnail, "render", updateSelectAll);
            } else if (isTable) {
              this.listenTo(this.tableView, "render", updateSelectAll);
            }
          }
        }
      }
    }
    if (isThumbnail) {
      this.collection.origModels = _.clone(this.collection.models);
      this.collection.origAllModels = _.clone(this.collection.allModels);
    }
    updatedNodes.length && _.each(updatedNodes, function(updatedNode) {
      var index = args.nodes.indexOf(updatedNode);
      index !== -1 && args.nodes.splice(index, 1);
    });
  }
  function updateSelectAllCheckboxState(resultsView) {
    var isTable = resultsView instanceof TableView, isThumbnail = resultsView && resultsView.options && resultsView.options.thumbnailView instanceof ThumbnailView;
    if (this.collection.fetched && this.collection.filter(function(model) {
      return _.contains(singleSelectNodeTypes, model.get("type"));
    }).length === this.collection.length) {
      var selectAllRegion = isThumbnail ? resultsView && resultsView.selectAllRegion : isTable ? resultsView && resultsView._selectAllCheckboxRegion : null;
      if (selectAllRegion) {
        selectAllRegion.currentView && selectAllRegion.currentView.destroy();
        if (isTable) {
          resultsView._selectAllCheckboxRegion = null;
        }
      }
    }
  }
  function updateSelectAllOnPageChange() {
    var enabledNodes = _.filter(this.collection.allModels, function(model) {
      return model.get("selectable") !== false;
    });
    if (enabledNodes && enabledNodes.length === 1 && _.contains(singleSelectNodeTypes, enabledNodes[0].get("type")) && enabledNodes[0].get(SelectCellView.isSelectedModelAttributeName)) {
      var selectAllRegion = this.thumbnail && this.thumbnail.headerRegion && this.thumbnail.headerRegion.currentView && this.thumbnail.headerRegion.currentView.selectAllRegion || this.tableView && this.tableView._selectAllCheckboxRegion;
      if (selectAllRegion) {
        selectAllRegion.currentView.setChecked("false");
        selectAllRegion.currentView.setDisabled(true);
      }
    }
    var selectedItems = this.getD2SelectedNodes();
    if (selectedItems.length > 0) {
      var widgetInfo = this.getWidgetDetails();
      if (widgetInfo === undefined) return;
      var options = {
        widgetType: widgetInfo.widgetType,
        config: widgetInfo.widgetName
      };
      if (selectedItems.length === 1) {
        options["type"] = selectedItems[0].get("type");
        options["aContentType"] = selectedItems[0].get("aContentType");
        options[eventsConstants.OAM.PARAM_ID] = selectedItems[0].get("id");
        DctmOahHandler.publishMessage("D2_EVENT_SELECT_OBJECT", options);
      }
      var ids = [];
      _.each(selectedItems, function(item) {
        ids.push(item.get("id"));
      });
      options[eventsConstants.OAM.PARAM_ID] = ids.join(eventsConstants.OAM.PARAM_SEPARATOR);
      DctmOahHandler.publishMessage("D2_EVENT_SELECT_OBJECTS", options);
    }
  }
  _.extend(proto, {
    constants: {
      DEFAULT_SORT: "_d2_sample_column asc"
    },
    initialize: function() {
      this.enforceDescriptionColumnInAccessibleMode = false;
      oldInitialize.apply(this, arguments);
      if (window.sv.config.embedMode && base.isIE11()) {
        this.collection.on("sync", function() {
          if (!this.collection.length && document.activeElement && !document.activeElement.classList) {
            document.activeElement.classList = {
              contains: function() {
                return false;
              }
            };
          }
        }.bind(this));
      }
      this.context && this.context.trigger("d2.open:widget", {
        widgetView: this
      });
      this.listenTo(this.collection, "filter:change filter:clear orderBy:change orderBy:clear paging:change limits:change", DocumentPreview.hide);
      this.listenTo(this.collection, "sync", function(model) {
        var filterElement = this.$(".csui-filterToolbar");
        if (filterElement.length === 0) {
          this.filterTogglePending = true;
        } else {
          if (model && model.node && model.node.get("id") === constants.NodeId.REPOSITORY) {
            this._ignoreSavingStateForNextFacetPanelToggle = true;
          } else {
            toggleFilterToolbar(this, model);
          }
        }
        if (this.ui.facetView) {
          if (!this.showTree && !this.showFilter && this._shouldShowFacetPanel() === true) {
            this._completeFilterCommand();
          } else {
            this._setFilterActiveState((!this.ui.facetView.hasClass || !this.ui.facetView.hasClass("csui-facetview-visibility")) && this.showFilter);
          }
        }
        if (this.treeView) {
          setTreeActiveState(this);
        }
        this.updateSelectedNodes();
      });
      this.listenTo(this, "refresh:list:data", function() {
        this.refreshPaging();
        if (this.treeView && this.showTree) {
          var currentFtNode = this.treeView.treeView && this.treeView.treeView.tree && this.treeView.treeView.tree.getNodeByKey(this.container.get("id"));
          currentFtNode && currentFtNode.isExpanded() && currentFtNode.load(true);
        }
        if (this.ui.facetView && !this.showTree && this.showFilter && this._shouldShowFacetPanel() === true) {
          this.showFilter = false;
          this.collection.facetsfetched = undefined;
          this.collection.fetch({
            fetchFacetsInit: true
          });
        }
      });
      if (this.collection.delayedActions) {
        this.listenTo(this.collection.delayedActions, "sync", function() {
          setTreeActiveState(this);
          setFilterActiveState(this);
        }.bind(this));
      }
      this.listenToOnce(this, "render", function() {
        if (this.filterTogglePending) {
          toggleFilterToolbar(this, this.container);
          delete this.filterTogglePending;
        }
        this.ui.sidePanel.parent().prepend(this.ui.sidePanel.children());
        this.ui.sidePanel.remove();
        this.ui.treeView.remove();
        var treeEl = $('<div class="d2-table-treeview d2-table-treeview-hidden">');
        this.ui.facetView.after(treeEl);
        this.treeRegion = new Marionette.Region({
          el: treeEl
        });
        this.showTree = false;
        if (this.thumbnail) {
          setTimeout(function() {
            restoreInitTreeState(this);
          }.bind(this), 300);
        }
      });
      this.listenTo(PubSub, "d2:highlight:node", function() {
        var highlightClassName = "csui-new-item", node = this.filterHighlightedNode();
        if (this.collection && this.collection?.allModels) {
          this.collection?.allModels?.map(function(node) {
            if (node.isLocallyCreated) {
              node.isLocallyCreated = false;
            }
          });
        }
        if (node) {
          $("." + highlightClassName).removeClass(highlightClassName);
          var rowIndex = this.getRowIndex(node), pageNumber = this.checkPageNumber(node);
          if (rowIndex !== -1) {
            this.highlightSpecificItem(rowIndex, highlightClassName);
            nodeUtils.removeHighlightNode();
          } else {
            this.getCollectionSync(node, highlightClassName);
            this.paginationView.goToPageHandler(pageNumber);
          }
        } else {
          this.addNewRecord();
        }
      }.bind(this));
      this.listenTo(this.tableView, "dom:refresh", function() {
        this.loadHighlightedItem();
      }.bind(this));
      this.listenTo(this.collection, "sync", function() {
        this.loadHighlightedItem();
        this._setFilterDefaultValue();
      }.bind(this));
      this.listenToOnce(this, "destroy", function() {
        if (this.treeView) {
          this.treeView.destroy();
        }
      });
      this.listenToOnce(this.context, "request", function() {
        this.facetFilters = this.collection.nodeFacets;
        this.d2Filters = this.collection.nodeD2FilterConfig;
      });
      this.listenTo(this.collection.nodeFacets, "sync", function() {
        var filter = this.collection.nodeFacets.find({
          id: "filter"
        });
        if (!filter) {
          this.collection.nodeFacets.add(this.collection.avaliableD2FilterConfigFacets);
        }
      }.bind(this));
      this.listenToOnce(this.tableView, "tableFrameRendered", function() {
        this.listenToOnce(this.tableView, "render", function() {
          var isFacetPanelVisible = this._retreiveFilterPanelVisibilitySetting();
          if (_.isBoolean(isFacetPanelVisible) && !isFacetPanelVisible || _.isUndefined(isFacetPanelVisible)) {
            restoreInitTreeState(this);
            setTimeout(function() {
              this.tableView.trigger("update:scrollbar");
            }.bind(this), 500);
          }
        }.bind(this));
      }.bind(this));
      this._showOrHideLocationColumn();
      this.listenTo(this.collection, "d2:clearSelection", function(args) {
        if (this.options.showSelectionCounter && _.isFunction(this.allSelectedNodes)) {
          var unselectedNodes = args.nodes;
          this.allSelectedNodes().remove(unselectedNodes, {
            silent: true
          });
          this.allSelectedNodes().reset(_.clone(this.allSelectedNodes().models));
        }
      });
      if (widgetUtils.getFolderPathInfo()?.lastNavigated) {
        this.saveAncestorInfo();
      }
    },
    getAncestorDetails: function(ancestorModel) {
      var nodePathId = [];
      ancestorModel?.forEach(function(node) {
        nodePathId.push({
          id: node.get("id")
        });
      });
      return nodePathId;
    },
    saveAncestorInfo: function() {
      this.ancestors = this.options.context.getCollection(AncestorCollectionFactory);
      this.listenTo(this.ancestors, "reset", () => {
        var widgetInfo = this.getWidgetDetails(), parentContainer = {
          id: this.ancestors.at(this.ancestors.length - 1).get("id")
        }, ancestorsArray = this.getAncestorDetails(this.ancestors?.models);
        var args = {
          widgetName: widgetInfo.widgetName,
          parentContainer: parentContainer,
          ancestors: ancestorsArray
        };
        if (widgetInfo.widgetType == widgetConstants.D2.DOCLIST) {
          widgetUtils.setFolderPathInfo(widgetUtils.getFolderPathInfo()?.lastNavigated, args);
        }
      });
    },
    filterHighlightedNode: function() {
      var data = nodeUtils.getHighlightNode();
      if (data !== undefined) {
        var filterNode = this.collection?.allModels?.filter(function(node) {
          return node.get("id") === data.id;
        });
        if (filterNode !== null && filterNode?.length > 0) {
          return filterNode[0];
        } else {
          return null;
        }
      } else {
        return null;
      }
    },
    checkPageNumber: function(node) {
      var pageSize = this.getPageSize(), index = this.collection?.lastFilteredAndSortedModels ? this.collection?.lastFilteredAndSortedModels?.indexOf(node) : -1;
      return Math.floor(index / pageSize);
    },
    getCollectionSync: function(node, highlightClassName) {
      this.listenToOnce(this.collection, "sync", function() {
        this._highlightNode(node, highlightClassName);
      }.bind(this));
    },
    getRowIndex: function(targetNode) {
      return _.findIndex(this.collection.models, function(node) {
        return node.get("id") === targetNode.get("id");
      });
    },
    _applyD2CustomCssStyles: function() {
      var me = this;
      _.each(this.$el.find("tbody tr"), (rowElem, index) => {
        me.getModelAttribute(index, "d2CssClassName") && $(rowElem).addClass(me.getModelAttribute(index, "d2CssClassName"));
      });
    },
    getModelAttribute: function(indexToFind, attribute) {
      if (this.collection.models.at) {
        return this.collection.models.at(indexToFind) && this.collection.models.at(indexToFind).get(attribute);
      } else {
        return this.collection.models[indexToFind] && this.collection.models[indexToFind].get(attribute);
      }
    },
    addNewRecord: function() {
      let data = nodeUtils.getHighlightNode();
      if (data && data.parent_id == this.collection.node.attributes.id && this.collection.hasMoreRecords) {
        let node = new NodeModel(data);
        node.isLocallyCreated = true;
        nodeUtils.removeHighlightNode();
        this.collection.unshift(node);
      }
    },
    highlightSpecificItem: function(rowIndex, highlightClassName) {
      var view = this.tableView || this.targetView, table = view && view.table ? view.table : undefined, targetRow = table === undefined ? table : $(table.row(rowIndex).node());
      targetRow && targetRow.addClass(highlightClassName);
      targetRow && targetRow.get(0).scrollIntoView();
    },
    loadHighlightedItem: function() {
      var highlightClassName = "csui-new-item";
      var node = this.filterHighlightedNode();
      if (node !== null) {
        node.isLocallyCreated = true;
        var pageNumber = this.checkPageNumber(node);
        if (pageNumber === 0) {
          this.getCollectionSync(node, highlightClassName);
        } else {
          this.getCollectionSync(node, highlightClassName);
          this.paginationView.goToPageHandler(pageNumber);
        }
      } else {
        this.addNewRecord();
      }
    },
    _highlightNode: function(targetNode, highlightClassName) {
      if (this.thumbnailView) {
        this._highlightThumbnail(targetNode, highlightClassName);
      } else {
        this._highlightTargetRow(targetNode, highlightClassName);
      }
      nodeUtils.removeHighlightNode();
    },
    _highlightTargetRow: function(targetNode, highlightClassName) {
      $("." + highlightClassName).removeClass(highlightClassName);
      var rowIndex = this.getRowIndex(targetNode);
      if (rowIndex !== -1) {
        this.highlightSpecificItem(rowIndex, highlightClassName);
      }
    },
    _highlightThumbnail: function(targetNode, highlightClassName) {
      var view = this.thumbnail || this.targetView;
      $("." + highlightClassName).removeClass(highlightClassName);
      view.$el.find(".csui-thumbnail-item-" + targetNode.cid).find(".csui-thumbnail-content-container").addClass(highlightClassName);
    },
    refreshPaging: function() {
      if (this.collection.allModels.length <= this.paginationView.selectedPageSize * (this.paginationView.currentPageNum - 1)) {
        this.paginationView.currentPageNum = Math.ceil(this.paginationView.collection.allModels.length / this.paginationView.selectedPageSize);
        if (this.paginationView.currentPageNum > 0) {
          this.paginationView.changePage(this.paginationView.currentPageNum - 1);
        }
      }
      this.paginationView.render();
    },
    setPagination: function() {
      this.paginationView = new PaginationView({
        collection: this.collection,
        pageSize: this.getPageSize(),
        pageNumber: this.options.data.pageNumber || this.options.pageNumber,
        defaultDDList: this.options.ddItemsList,
        setPageInfoFromViewState: this.enableViewState && this.setPageInfoFromViewState.bind(this)
      });
      this.listenTo(this.paginationView, "pagesize:updated", function() {
        this.setPreference("pageSize", this.paginationView.selectedPageSize);
      });
      return true;
    },
    updateSelectedNodes: function() {
      var selectedNodes = this.getAllSelectedNodes();
      selectedNodes.each(function(node, index) {
        var findNode = _.find(this.collection.allModels, function(model) {
          return model.get("id") === node.get("id");
        });
        if (findNode && findNode.cid !== node.cid) {
          selectedNodes.remove(node, {
            silent: true
          });
          selectedNodes.add(findNode, {
            at: index
          });
          this.tableRowSelectionToolbarRegion.currentView.selectedItemsCounterRegion.currentView.render();
        }
      }.bind(this));
    },
    _toolbarActionTriggered: function(toolbarActionContext) {
      oldtoolbarActionTriggered.apply(this, arguments);
      if (toolbarActionContext.commandSignature === "D2-NodeTree") {
        this._completeTreeCommand();
      }
    },
    _completeTreeCommand: function() {
      var me = this;
      me.showTree = !me.showTree;
      if (me.showTree) {
        if (me.treeView === undefined) {
          me.treeView = new NodeTreeView({
            originatingView: me
          });
          me.treeRegion.show(me.treeView);
          me.treeView.$el.closest(".d2-table-treeview").resizable({
            alsoResize: ".d2-tree-panel",
            handles: i18n && i18n.settings.rtl ? "w" : "e",
            minWidth: 240,
            stop: function() {
              me.triggerMethod("dom:refresh");
            }
          });
          eventUtils.enableTouchEventsByClass(".d2-table-treeview .ui-resizable-handle");
        }
        var promises = [];
        if (me.showFilter === true || _.isUndefined(me.showFilter)) {
          promises.push(me._toggleSidePanel("facet", false));
          me.showFilter = false;
          me._saveFilterPanelVisibilitySetting(me.showFilter);
        }
        promises.push(me._toggleSidePanel("tree", true));
        $.whenAll.apply($, promises).done(function() {
          me.triggerMethod("dom:refresh");
        });
      } else {
        me._toggleSidePanel("tree", false).done(function() {
          me.triggerMethod("dom:refresh");
        });
      }
      this.setPreference("isTreeOpen", me.showTree);
    },
    _hideTreePanelView: function() {},
    _completeFilterCommand: function() {
      oldCompleteFilterCommand.apply(this, arguments);
      this._setFacetBarView();
      if (this.showFilter === true) {
        if (this.showTree === true) {
          this._toggleSidePanel("tree", false).done(function() {
            this.triggerMethod("dom:refresh");
          }.bind(this));
          this.showTree = false;
          this.setPreference("isTreeOpen", this.showTree);
        }
        if (this.isFilterEnabledWidget()) {
          this.collection.fetch({
            fetchFacetsInit: true
          });
        }
      }
      this._setFilterActiveState(this.showFilter);
    },
    _setFilterActiveState: function(active) {
      var title = active ? nodestableLang.filterCollapseTooltip : nodestableLang.filterExpandTooltip;
      this.$('.csui-filterToolbar li[data-csui-command="filter"] .csui-toolitem').attr({
        title: title,
        "aria-label": title
      });
      if (active) {
        this.$(facetPanelToggleIconSelector).addClass(facetPanelToggleIconActiveStateClassName);
      } else {
        this.$(facetPanelToggleIconSelector).removeClass(facetPanelToggleIconActiveStateClassName);
      }
    },
    _toggleSidePanel: function(panelName, flag) {
      var me = this, deferred = $.Deferred(), view, className, iconEl, activeCls, isViewHidden;
      if (panelName === "facet") {
        view = me.ui.facetView;
        className = "csui-facetview-hidden";
        iconEl = me.$(facetPanelToggleIconSelector);
        activeCls = facetPanelToggleIconActiveStateClassName;
      } else if (panelName === "tree") {
        view = me.treeView.$el.closest(".d2-table-treeview");
        className = "d2-table-treeview-hidden";
        iconEl = me.$('.csui-filterToolbar li[data-csui-command="d2-nodetree"] svg.csui-icon-v2');
        activeCls = "csui-icon-v2-on";
      } else {
        return deferred.reject();
      }
      isViewHidden = view.hasClass(className);
      function afterTransition() {
        iconEl[flag ? "addClass" : "removeClass"](activeCls);
        deferred.resolve();
      }
      if (panelName === "tree" || accessibleTable) {
        view[flag ? "removeClass" : "addClass"](className);
        var title = flag ? toolsLang.NodeTreeCollapse : toolsLang.CommandNameNodeTree;
        iconEl.closest(".csui-toolitem").attr({
          title: title,
          "aria-label": title
        });
        afterTransition();
      } else if (isViewHidden) {
        view[flag ? "removeClass" : "addClass"](className);
        afterTransition();
      } else {
        view.one(me._transitionEnd(), function() {
          afterTransition();
          !!me.thumbnailViewState && me.thumbnail._adjustThumbnailWidth();
        })[flag ? "removeClass" : "addClass"](className);
      }
      return deferred.promise();
    },
    _setFacetPanelView: function() {
      oldFacetPanelView.apply(this, arguments);
      var me = this;
      me.listenTo(me.facetView, "modify:filters", proto._modifyFacetFilter);
      me.listenTo(me.facetView, "modify:d2:filters", proto._modifyD2Filter);
      me.facetView.once("show", function() {
        if (_.isEmpty(me.collection?.node?.columnPreference?.get("d2sv_widget_state")?.filter)) {
          if (me.collection.avaliableD2FilterConfigFacets) {
            var defaultFilter = _.filter(me.collection.avaliableD2FilterConfigFacets.topics, function(topic) {
              return topic.default === true;
            });
            if (defaultFilter.length > 0) {
              me.collection.nodeD2FilterConfig = defaultFilter[0];
              me._saveFilterPreferences();
            }
          }
        }
        me.facetView.$el.closest(".ui-resizable").resizable({
          stop: function() {
            me.triggerMethod("dom:refresh");
          }
        });
      });
    },
    _setFacetBarView: function() {
      if (this.facetView) {
        oldFacetBarView.apply(this, arguments);
        this.facetBarRegion.show(this.facetBarView);
      }
    },
    _modifyFacetFilter: function(addfilters, removefilters) {
      var that = this;
      _.each(addfilters, function(filter) {
        that.facetFilters.addFilter(filter);
      });
      _.each(removefilters, function(filter) {
        that.facetFilters.removeFilter(filter);
      });
      this.tableView.setCustomLabels({
        zeroRecords: lang.NodeTableNoItems
      });
      this.collection.resetLimit();
      this.collection.fetch();
    },
    _modifyD2Filter: function(addFilter) {
      var that = this;
      _.each(addFilter, function(filter) {
        that.collection.nodeD2FilterConfig = filter;
      });
      this.tableView.setCustomLabels({
        zeroRecords: lang.NodeTableNoItems
      });
      this._saveFilterPreferences(true);
    },
    _saveFilterPreferences: function(fetchCollection) {
      var that = this;
      FilterUtils.resetFilterChecked({
        d2FilterConfigs: that.collection.avaliableD2FilterConfigFacets
      });
      this._nodesTableSettings.set("showAllVersion", this.collection.nodeD2FilterConfig.all_versions);
      this._nodesTableSettings.set("filter", this.collection.nodeD2FilterConfig.facetvalue ? this.collection.nodeD2FilterConfig.facetvalue : this.collection.nodeD2FilterConfig.value);
      this._nodesTableSettings.save().always(() => {
        if (this.collection.node) {
          that.collection.node.resetWidgetPreference().then(() => {
            that._fetchCollectionWithFilter(fetchCollection);
          });
        } else {
          delete that.collection.clientColumns;
          that._fetchCollectionWithFilter(fetchCollection);
        }
      });
      this._setFilterActiveState(this.showFilter);
    },
    _fetchCollectionWithFilter: function(fetchCollection) {
      if (fetchCollection) {
        this.collection.resetLimit();
        this.collection.fetch({
          d2filterApplied: true
        });
      }
    },
    _setFilterDefaultValue: function() {
      var widgetState = this.collection?.node?.columnPreference || this.collection?.columnPreference;
      if (!widgetState) {
        this._applyDefaultFilter();
      } else {
        this._nodesTableSettings.set("showAllVersion", widgetState.get("d2sv_widget_state")["show_all_version"]);
        this._nodesTableSettings.set("filter", widgetState.get("d2sv_widget_state")?.filter);
        var selectedFilter = _.filter(this.collection.avaliableD2FilterConfigFacets.topics, function(topic) {
          return topic.value === widgetState.get("d2sv_widget_state")?.filter;
        });
        if (selectedFilter.length === 0) {
          this._applyDefaultFilter();
        }
      }
    },
    _applyDefaultFilter: function() {
      if (this.collection.node && !nodeConverter.isFavoritesNode(this.collection.node) && !nodeConverter.isRepositoryNode(this.collection.node)) {
        var defaultFilter = _.filter(this.collection.avaliableD2FilterConfigFacets.topics, function(topic) {
          return topic.default === true;
        });
        if (defaultFilter.length > 0) {
          this.collection.nodeD2FilterConfig = defaultFilter[0];
          this._saveFilterPreferences(false);
        } else {
          this.collection.nodeD2FilterConfig = this.collection.avaliableD2FilterConfigFacets.topics[0];
          this._saveFilterPreferences(false);
        }
      }
    },
    _removeFacetFilter: function(filter) {
      this.facetFilters.removeFilter(filter);
      this.collection.resetLimit();
      this.collection.fetch();
    },
    _removeAll: function() {
      this.facetFilters.clearFilter();
      this.collection.resetLimit();
      this.collection.setFilter({
        facet: []
      });
      this._showOrHideLocationColumn(false);
      this.collection.fetch();
    },
    _updateZeroRecordsMessage: function() {
      if (nodeConverter.isFavoritesNode(this.container)) {
        this.tableView.addItemsPermissions = true;
        this.tableView.$el.addClass("d2-no-favorites");
        this.tableView.setCustomLabels({
          zeroRecords: lang.NodeTableNoFavorites
        });
      } else {
        this.tableView.$el.removeClass("d2-no-favorites");
        oldUpdateZeroRecordsMessage.apply(this, arguments);
      }
    },
    getD2SelectedNodes: function() {
      return this.getSelectedNodes().models;
    },
    onDestroy: function() {
      oldOnDestroy.apply(this, arguments);
      this.context && this.context.trigger("d2.close:widget", {
        widgetView: this
      });
      this.options.toolbarItems.tableHeaderToolbar = this.options.origTableHeaderToolbar ? this.options.origTableHeaderToolbar.clone() : this.options.toolbarItems.tableHeaderToolbar;
      this.options.toolbarItemsMasks.toolbars.tableHeaderToolbar = this.options.origTableHeaderToolbarMask ? this.options.origTableHeaderToolbarMask.clone() : this.options.toolbarItemsMasks.toolbars.tableHeaderToolbar;
    },
    _changingContainer: function() {
      oldChangingContainer.apply(this, arguments);
      if (this.collection.filters) {
        this.collection.filters = _.omit(this.collection.filters, function(value) {
          return _.isUndefined(value) || _.isEmpty(value);
        });
      }
    },
    _collectionFilterChanged: function() {},
    getContainerPrefs: function(prop) {
      if (prop === "orderBy" && this.collection) {
        return this.collection.orderBy;
      } else {
        return oldGetContainerPrefs.apply(this, arguments);
      }
    },
    _saveFilterPanelVisibilitySetting: function(value) {
      this.setPreference("isFacetOpen", value);
    },
    _retreiveFilterPanelVisibilitySetting: function() {
      return this.getPreference("isFacetOpen");
    },
    _shouldShowFacetPanel: function() {
      var shouldShowFacetPanel = this.collection instanceof TaskCollection || this.collection.node && !nodeConverter.isRepositoryNode(this.collection.node) && !nodeConverter.isFavoritesNode(this.collection.node), isFacetPanelVisible = shouldShowFacetPanel ? this._retreiveFilterPanelVisibilitySetting() : undefined;
      return isFacetPanelVisible;
    },
    onBeforeRender: function() {
      var isFacetPanelVisible = this._shouldShowFacetPanel();
      if (_.isBoolean(isFacetPanelVisible)) {
        this.options.showFacetPanelOnLoad = isFacetPanelVisible;
      }
      oldOnBeforeRender && oldOnBeforeRender.apply(this, arguments);
    },
    excludeContainerTypes: function() {
      if (this.container && nodeConverter.isNonDCTMNode(this.container)) {
        return [ this.container.get("type") ];
      } else {
        return [];
      }
    },
    _showFacetPanelView: function() {
      var retVal = oldShowFacetPanelView.apply(this, arguments);
      if (this._ignoreSavingStateForNextFacetPanelToggle !== true) {
        this._saveFilterPanelVisibilitySetting(this.showFilter);
      } else {
        this._ignoreSavingStateForNextFacetPanelToggle = false;
      }
      return retVal;
    },
    _hideFacetPanelView: function() {
      var retVal = oldHideFacetPanelView.apply(this, arguments);
      if (this._ignoreSavingStateForNextFacetPanelToggle !== true) {
        this._saveFilterPanelVisibilitySetting(this.showFilter);
      } else {
        this._ignoreSavingStateForNextFacetPanelToggle = false;
      }
      return retVal;
    },
    _afterFetchingAllSelectedNodes: function(allSelectedNodes, nodesInCollection) {
      var context = this.getContext(), viewStateModel = context && context.viewStateModel, sessionState = viewStateModel.get("session_state"), state = viewStateModel.get("state");
      if (allSelectedNodes && sessionState && (sessionState.id === undefined || state && state.filter && state.filter.length || allSelectedNodes[0] && allSelectedNodes[0].get("parent_id") === this.getKey() || this.getKey() === "key") || this.collection && this.collection.node && this.collection.node.get("type_name") === "DQL") {
        if (viewStateModel.getSessionViewState("selected_nodes")) {
          this._resetSelectedNodeCollections(allSelectedNodes, nodesInCollection);
        }
      }
      this.restoringSelection = false;
      var selectedNodes = this.getAllSelectedNodes();
      selectedNodes.length && this.thumbnailViewState && this.thumbnail.trigger("thumbnailSelected", {
        nodes: selectedNodes.models,
        targets: this.thumbnail
      });
      selectedNodes.length && !this.thumbnailViewState && this.tableView.trigger("tableRowSelected", {
        nodes: selectedNodes.models,
        sender: this.tableView
      });
    },
    _setThumbnailView: function(options) {
      oldSetThumbnailView.call(this, options);
      this.thumbnail.off("thumbnailSelected");
      this.listenTo(this.thumbnail.thumbnailHeaderView, "render", updateSelectAllCheckboxState);
      this.listenTo(this.thumbnail, "thumbnailSelected", onRowSelection);
      this.listenTo(this.thumbnail, "thumbnailSelected", function(args) {
        this.thumbnail.$el.find(".csui-thumbnail-select").addClass("csui-checkbox");
        this.addNodesToSelection(args.nodes);
      });
      this.collection.off("reset change", updateSelectAllOnPageChange, this);
      this.listenTo(this.collection, "reset change", updateSelectAllOnPageChange);
    },
    enableThumbnailView: function() {
      oldEnableThumbnailView.call(this);
      this.thumbnail && this.listenTo(this.thumbnail.thumbnailHeaderView, "selectOrUnselect.all", function() {
        this.collection.models = this.collection.origModels;
        this.collection.allModels = this.collection.origAllModels;
      });
    },
    _setTableViewEvents: function() {
      this.listenTo(this.tableView, "render", updateSelectAllCheckboxState);
      this.listenTo(this.tableView, "tableRowSelected", onRowSelection);
      oldSetTableViewEvents.call(this);
      this.listenTo(this.collection, "reset change", updateSelectAllOnPageChange);
      this.listenTo(this.tableView, "tableBodyRendered", this._onTableBodyRendered);
    },
    setTableRowSelectionToolbar: function(options) {
      oldSetTableRowSelectionToolbar.call(this, options);
      var me = this, setInitialCheckboxState = function(nodes, collection) {
        if (nodes && nodes.length === 0 || collection && collection.length === 0) {
          var disabledNodes = _.filter(me.collection.allModels, function(model) {
            return model.get("selectable") === false;
          });
          disabledNodes.length && updateSelectableState(disabledNodes, true, me.thumbnail);
          var selectAllRegion = this.thumbnail && this.thumbnail.headerRegion && this.thumbnail.headerRegion.currentView && this.thumbnail.headerRegion.currentView.selectAllRegion || this.tableView && this.tableView._selectAllCheckboxRegion;
          selectAllRegion && selectAllRegion.currentView && selectAllRegion.currentView.setDisabled(false);
          if (me._tableRowSelectionToolbarView) {
            me._tableRowSelectionToolbarView._filteredToolItemsCollection.destroy();
            me._tableRowSelectionToolbarView.destroy();
            me._tableRowSelectionToolbarView = null;
            me.getAllSelectedNodes().off("reset remove", setInitialCheckboxState, me);
          }
        }
        me.thumbnailViewState && me.thumbnail && me.thumbnail.updateSelectAllCheckbox.call(me);
      };
      this.listenToOnce(this._tableRowSelectionToolbarView, "render", function() {
        me.listenTo(me.getAllSelectedNodes(), "reset remove", setInitialCheckboxState);
      });
    },
    _showRowSelectionToolbar: function() {
      this.options.origTableHeaderToolbar = this.options.origTableHeaderToolbar || this.options.toolbarItems.tableHeaderToolbar.clone();
      this.options.origTableHeaderToolbarMask = this.options.origTableHeaderToolbarMask || this.options.toolbarItemsMasks.toolbars.tableHeaderToolbar && this.options.toolbarItemsMasks.toolbars.tableHeaderToolbar.clone();
      if (this.getAllSelectedNodes().filter(function(model) {
        return model.get("type") === constants.Types.WORKFLOW;
      }).length === this.getAllSelectedNodes().length) {
        this.options.toolbarItems.tableHeaderToolbar = WorkflowToolItems["tableHeaderToolbar"];
        this.options.toolbarItemsMasks.toolbars.tableHeaderToolbar = new WorkflowToolItemsMasks().toolbars.tableHeaderToolbar;
      } else {
        this.options.toolbarItems.tableHeaderToolbar = this.options.origTableHeaderToolbar.clone();
        this.options.toolbarItemsMasks.toolbars.tableHeaderToolbar = this.options.origTableHeaderToolbarMask && this.options.origTableHeaderToolbarMask.clone();
      }
      oldShowRowSelectionToolbar.call(this);
      var lazyActionsRetrieved = true;
      _.each(this.getAllSelectedNodes() && this.getAllSelectedNodes().models, function(model) {
        lazyActionsRetrieved = lazyActionsRetrieved && model.get("csuiLazyActionsRetrieved");
      });
      if (lazyActionsRetrieved && this._tableRowSelectionToolbarView) {
        this._tableRowSelectionToolbarView.setActive(false);
        this.getAllSelectedNodes().trigger("reset");
      }
    },
    resetAllSelectedItems: function() {
      oldResetAllSelectedItems.call(this);
      var allSelectedNodes = this.getAllSelectedNodes();
      _.each(this.collection.allModels, _.bind(function(node) {
        var selectedNode = allSelectedNodes.get(node);
        node.set("csuiIsSelected", selectedNode !== undefined);
      }, this));
    },
    canAddItems: function() {
      if (!this.container) {
        return;
      }
      return oldCanAddItems.apply(this, arguments);
    },
    _initPreferences: function() {
      if (!this.options.preferencesStorageId) {
        var widgetInfo = this.getWidgetDetails();
        if (widgetInfo) {
          this.options.preferencesStorageId = widgetInfo.widgetType + "_" + widgetInfo.widgetName;
        }
      }
      oldInitPreferences.apply(this, arguments);
    },
    getWidgetDetails: function() {
      var widgetPref = this.collection && this.collection.node && this.collection.node.get("widgetPreference") || this.collection && this.collection["widgetPreference"], widgetType = widgetPref && widgetPref.widgetType || this.collection.widgetType, widgetName = widgetPref && widgetPref.widgetName || this.collection.options && this.collection.options.widgetName;
      if (widgetType && widgetName) {
        return {
          widgetType: widgetType,
          widgetName: widgetName
        };
      }
    },
    isFilterEnabledWidget: function() {
      return this.getWidgetDetails().widgetType === widgetConstants.D2.DOCLIST || this.getWidgetDetails().widgetType === widgetConstants.D2.COLLECTIONS;
    },
    setTableMode: function() {
      oldSetTableMode.apply(this, arguments);
      this._applyD2CustomCssStyles();
    },
    getAvailableTableModes: function() {
      var availableTableModes = [ {
        key: widgetConstants.TableModes.WRAP,
        configKey: "table-list-limited-columns",
        label: lang.tableModeWrap
      }, {
        key: widgetConstants.TableModes.NOWRAP,
        configKey: "table-list-pinned-columns",
        label: lang.tableModeNoWrap
      }, {
        key: widgetConstants.TableModes.THUMBNAIL,
        configKey: "table-grid-thumbnail",
        label: lang.tableModeThumbnail
      } ];
      return availableTableModes;
    },
    setPreference: function(prefName, value) {
      if (!_.isObject(value)) {
        var currentValue = this.getPreference(prefName);
        if (currentValue === value) {
          return;
        }
        oldSetPreference.apply(this, arguments);
      } else {
        oldSetPreference.apply(this, arguments);
      }
    },
    onViewStateChanged: function(skipFetchingIfNeeded) {
      var nextNode = this.context.getModel(NextNodeModelFactory);
      if (!this.enableViewState || this._originalId !== nextNode.get("id")) {
        this.tableView && !this.retainPerspectiveCalled && (this.tableView.enableViewState = false);
        return;
      }
      if (skipFetchingIfNeeded instanceof Object) {
        skipFetchingIfNeeded = false;
      }
      var viewStateModel = this.context.viewStateModel, orderBy = this.getViewStateOrderBy() || this.getDefaultViewStateOrderBy(), filterString = viewStateModel.getViewState("filter", true), currentFacetFilters, collectionFilter, facetFilter, fetch = false;
      try {
        collectionFilter = JSON.parse(filterString);
        facetFilter = collectionFilter && collectionFilter.facet ? collectionFilter.facet : [];
        if (this.collection.setFilter(collectionFilter, false)) {
          fetch = true;
        }
      } catch (e) {
        facetFilter = [];
      }
      currentFacetFilters = this.facetFilters && this.facetFilters.filters;
      if (currentFacetFilters && !_.isEqual(currentFacetFilters, facetFilter.facet)) {
        this.facetFilters.setFilter(currentFacetFilters, true);
      }
      if (this.setPageInfoFromViewState()) {
        fetch = true;
      }
      if (this.collection.setOrder(orderBy, false)) {
        fetch = true;
      }
      if (!skipFetchingIfNeeded && fetch) {}
    },
    _onTableBodyRendered: function() {
      this._applyD2CustomCssStyles();
      widgetUtils.handleColumnSortRestriction(this.tableView, {
        restrictedColumnDescendingTooltip: lang.restrictedColumnDescendingTooltip,
        restrictedColumnAscendingTooltip: lang.restrictedColumnAscendingTooltip,
        restrictedColumnAscendingAria: lang.restrictedColumnAscendingAria,
        restrictedColumnDescendingAria: lang.restrictedColumnDescendingAria
      });
    }
  });
  return NodesTableView;
});