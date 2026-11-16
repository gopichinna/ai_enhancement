/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/lib/backbone", "csui/models/widget/search.results/search.results.model", "csui/controls/table/table.view", "csui/controls/progressblocker/blocker", "dctmw/controls/behaviors/clientside.infinite.scrolling.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/dialogs/modal.alert/modal.alert", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "nuc/utils/base", "d2/models/base.default.action.items", "d2/server.adaptors/models/widget/favorites/favorites.model", "d2/dialogs/target.browse/impl/targetbrowse.columns", "d2/utils/constants", "d2/utils/widgets.utils", "hbs!d2/dialogs/target.browse/impl/select.views", "i18n!d2/dialogs/target.browse/impl/nls/lang", "dctmw/server.adaptors/converters/node", "d2/dialogs/target.browse/impl/select.views/node.selection.mixin", "d2/dialogs/target.browse/start.locations/related.files/impl/related.files.collection", "d2/models/workflow/workflow.templates.collection", "d2/utils/contexts/factories/node.navigation", "nuc/models/ancestor", "i18n!d2/overrides/csui/widgets/nodestable/impl/nls/lang", "csui/lib/binf/js/binf", "csui/lib/jquery.ui/js/jquery-ui", "css!d2/dialogs/target.browse/impl/select.views/slider" ], function($, _, Marionette, Backbone, SearchResultCollection, TableView, BlockingView, InfiniteScrollingBehavior, PerfectScrollingBehavior, LayoutViewEventsPropagationMixin, ModalAlert, TabableRegionBehavior, base, defaultActionItems, FavoriteCollection, TargetBrowseTableColumns, constants, widgetUtils, template, lang, NodeConverter, NodeSelectionMixin, RelatedFilesCollection, WorkflowTemplatesCollection, NodeNavigationFactory, AncestorModel, nodesTableLang) {
  "use strict";
  var InfiniteScrollingTableView = TableView.extend({
    constructor: function InfiniteScrollingTableView() {
      InfiniteScrollingTableView.__super__.constructor.apply(this, arguments);
      this.stopListening(this.collection, "add", this.setFocusToFirstRow);
      this.listenTo(this.collection.node, "request", this.blockActions);
      this.listenTo(this.collection.node, "sync", this.unblockActions);
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: "tbody",
        suppressScrollX: true
      },
      InfiniteScrolling: {
        behaviorClass: InfiniteScrollingBehavior,
        contentParent: "tbody",
        content: "tbody>tr:visible"
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    showOrHideZeroRecordsMessage: function() {
      var classNameToBeAdd = "";
      this.$el.find("div.csui-table-empty").remove();
      if (this.collection.length === 0) {
        this.$el.find("tbody").empty();
        var typeName = !!this.collection.node && !!this.collection.node.get("type_name") ? this.collection.node.get("type_name") : "default", emptyTableText = "", defaultNoResultMsgClass = "csui-no-result-message";
        typeName = typeName.replace(/\s+/g, "-").toLowerCase();
        this.$el.addClass("csui-table-empty");
        if (this._showEmptyViewText) {
          var labels = this.options.customLabels ? this.options.customLabels : this.localizableLabels;
          emptyTableText = !!this.collection.filters && this.collection.filters.name ? labels.emptyTable : labels.zeroRecords;
        }
        if (this.options.collection instanceof SearchResultCollection) {
          if (emptyTableText.length === 0 && this.options.collection.fetching) {
            emptyTableText = lang.searchInProgress;
            defaultNoResultMsgClass = "d2-target-browse-searchInProgressText";
          } else if (emptyTableText.length === 0) {
            emptyTableText = lang.NoSearchPerformed;
            classNameToBeAdd = "empty_no_search_performed";
            defaultNoResultMsgClass = "d2-target-browse-empty-no-search";
          } else {
            emptyTableText = lang.noSearchResultMessage;
          }
        }
        if (this.options.searchView && this._showEmptyViewText) {
          classNameToBeAdd = "csui-table-empty d2-target-browse-searchIcon";
          defaultNoResultMsgClass = "d2-target-browse-noSearchResultText";
        } else {
          classNameToBeAdd += " csui-table-empty csui-table-empty-default csui-table-empty-" + typeName + (this.options.canDragAndDrop ? " csui-can-add-items" : "");
        }
        var emptyEl = $("<div class='" + classNameToBeAdd + "'><p" + " class='" + defaultNoResultMsgClass + "' title='" + emptyTableText + "'>" + emptyTableText + "</p></div>");
        if (!this._showEmptyViewText) {
          emptyEl.addClass("csui-state-loading");
        }
        this.$el.append(emptyEl);
      } else {
        this.$el.removeClass("csui-table-empty");
        if (this._renderedEmptyTable) {
          this._previousViewWidth = 0;
        }
      }
      this._renderedEmptyTable = this.collection.length === 0;
    },
    currentlyFocusedElement: function(event) {
      if (this.collection.length === 0 && this.$el.find(".arrow_back_target_browse").length && this.accFocusedState.focusView === "tableBody") {
        this.accFocusedState.focusView = "tableHeader";
        return this.tableCaptionView.currentlyFocusedElement();
      }
      if (this.collection.length > 0) {
        if (event && event.shiftKey) {
          this.accFocusedState.focusView = "tableBody";
          this.trigger("changed:focus");
          return this.tableBodyView.currentlyFocusedElement();
        }
        if (this.accFocusedState.focusView === "tableBody" && this.tabFromBody) {
          this.accFocusedState.focusView = "tableHeader";
          this.trigger("changed:focus");
          return this.tableCaptionView.currentlyFocusedElement();
        }
        if (this.accFocusedState.focusView === "tableHeader") {
          this.tabFromBody = false;
        }
      }
      return InfiniteScrollingTableView.__super__.currentlyFocusedElement.apply(this, arguments);
    },
    onKeyInView: function(event) {
      if (this.collection.length > 0) {
        if (event.keyCode === 9) {
          if (event.shiftKey) {
            if (this.accFocusedState.focusView === "tableBody") {
              this.bodyToheader = true;
            }
            if (this.accFocusedState.focusView === "tableHeader" && this.bodyToheader) {
              this.bodyToheader = false;
            }
          } else {
            if (this.accFocusedState.focusView === "tableBody" && !this.tabFromBody) {
              this.tabFromBody = true;
            } else if (this.accFocusedState.focusView === "tableHeader") {
              this.tabFromBody = false;
            }
          }
        }
        return InfiniteScrollingTableView.__super__.onKeyInView.apply(this, arguments);
      }
    },
    onRender: function() {
      this.$el.find("thead").find(".csui-checkbox-view").addClass("binf-hidden");
      this.$el.find("thead").find(".csui-checkbox-view .csui-checkbox").remove();
    }
  });
  var SelectViews = Marionette.LayoutView.extend({
    className: "csui-nodestable",
    template: template,
    regions: {
      tableRowSelectionToolbarRegion: ".csui-rowselection-toolbar",
      tableRegion: ".csui-table-view"
    },
    ui: {
      tableView: ".csui-perfect-scrolling",
      childContainer: ".csui-np-selectviewsx"
    },
    constructor: function SelectViews(options) {
      BlockingView.imbue({
        parent: this,
        focus: true
      });
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.tableColumns = this.options.tableColumns || TargetBrowseTableColumns.deepClone();
      this.propagateEventsToRegions();
      this.typeAttrNameMap = {
        virtualType: "rIsVirtualDoc",
        typeName: "type"
      };
      if (options.collection.node) {
        var id = options.collection.node.get("id");
        if (!id) {
          options.collection.node.set("id", "repository");
        }
      }
      this.connector = options.connector;
      this.container = options.collection.node;
      this.children = options.collection;
      this.children.isTargetBrowse = true;
      options.clientObjectTypeFilter ? this.children.clientObjectTypeFilter = true : this.children.clientObjectTypeFilter = false;
      this.children.typeAttrNameMap = this.typeAttrNameMap;
      this.initialFetch = true;
      this.initSelectionMixin(this.options, this.collection);
      var args = _.extend({}, this.options, {
        tableColumns: this.tableColumns,
        connector: this.connector,
        collection: this.collection,
        actionItems: defaultActionItems,
        columnsWithSearch: [ "name" ],
        blockingParentView: this,
        originatingView: this.options.originatingView,
        expanded: true,
        focusView: "tableHeader",
        isTargetBrowse: true,
        inlineBar: this.getInlineActionbarOptions()
      });
      var bbCol;
      this.options.targetBrowseHistory = _.uniq(this.options.targetBrowseHistory);
      args.showBackArrow = this.options.targetBrowseHistory && this.options.targetBrowseHistory.length !== 0;
      if (this.options.collection instanceof SearchResultCollection) {
        bbCol = new Backbone.Collection();
        args.columns = bbCol;
        if (!this.options.collection.options.query || this.options.searchConfig) {
          this.initialFetch = false;
        }
        args.showBackArrow = false;
      }
      this.tableView = new InfiniteScrollingTableView(args);
      this.listenTo(this.container, "change:id", this._handleContainerChange);
      this.listenTo(this.collection, "request", this._handleRequestCollectionEvent);
      this.listenTo(this.collection, "add", this._handleAddCollectionEvent);
      this.listenTo(this.tableView, "execute:defaultAction", this._handleDefaultAction);
      this.listenTo(this.tableView, "render", this._handleOnRender);
      this.listenTo(this.tableView, "tableBodyRendered", this._onTableBodyRendered);
      this.listenTo(this.collection, "sync", () => {
        if (this.options.selectType || this.options.disabledNodeIds) {
          this.enableSelection();
        }
      });
      this._setNodeSelectionEvents();
      this.listenTo(this.tableView, "click", this._handleClick);
      if (this.initialFetch) {
        if (options.searchFacets) {
          this.collection.searchFacets = options.searchFacets;
        }
        this.collection.isTargetBrowse = true;
        this.collection.fetch().done(function() {
          if (bbCol) {
            this.options.searchView ? this.tableView.options.showBackArrow = true : this.tableView.options.showBackArrow = false;
            this.options.showSearchBackArrow = true;
            bbCol.reset(this.collection.clientColumns);
          }
          this.prevOrderBy = this.collection.orderBy;
          if (this.options.searchView) {
            this.trigger("update:searchHeader");
            this.trigger("change:localScope", "search");
          }
          if (this.options.collection instanceof FavoriteCollection) {
            this.unblockActions();
          }
          if (this.options.exitingFromSearch) {
            this.options.exitingFromSearch = false;
            this.trigger("sync:perspective", this.collection.node, this);
          }
          if (this.options.locationName === "Current location" && this.options.localScope === "search") {
            this.trigger("sync:perspective", this.collection.node, this);
            this.trigger("change:localScope", this.container.get("id"));
          }
          if (!this.options.searchView) {
            if (this.collection.node) {
              this.trigger("changed", this.collection.node.get("id"), this.collection.node.get("name"), this.collection.node.get("type"), this.collection.node.get("i_cabinet_id"));
            }
          }
        }.bind(this)).fail(function(message) {
          var error = new base.RequestErrorMessage(message);
          ModalAlert.showError(error.toString());
        });
      }
      this.listenTo(this.tableView, "tableCreated", _.bind(this.handleTableCreated, this));
    },
    getInlineActionbarOptions: function() {
      return {
        options: {
          forceInlineBarOnClick: false
        }
      };
    },
    handleTableCreated: function(obj) {
      obj.sender.table.on("mouseleave", "tr", _.bind(this.handleTableRowMouseLeave, this));
      obj.sender.table.on("focus", "tr", _.bind(this.handleTableRowFocus, this));
      obj.sender.table.on("blur", "tbody tr", this.handleTableRowBlur);
      obj.sender.table.on("click", "tbody tr", _.bind(this.handleTableRowClick, obj));
    },
    handleTableRowFocus: function(args) {
      var $el, tr = $(args.target).parentsUntil("tr");
      $el = tr.length > 0 ? $(tr[tr.length - 1]) : $(args.target);
      if (!this.collection.fetching) {
        $el.parent().find(".csui-checkbox-icon-container").addClass("checkbox-visible");
      }
    },
    handleTableRowMouseLeave: function(args) {
      var row = this.getCheckboxRow(args);
      $(row).find(".csui-checkbox-icon-container").removeClass("checkbox-visible");
    },
    getCheckboxRow: function(args) {
      var isDetailsRow, row = args.currentTarget;
      isDetailsRow = $(row).hasClass("csui-details-row");
      if (isDetailsRow) {
        row = $(row).prev()[0];
      }
      return row;
    },
    handleTableRowBlur: function(args) {
      $(args.target).parentsUntil("tbody").find(".csui-checkbox-icon-container").removeClass("checkbox-visible");
    },
    handleTableRowClick: function(args) {
      if ($(args?.target) && ($(args.target).hasClass("csui-node-type-icon") || $(args?.target).hasClass("csui-checkbox") || $(args.target).hasClass("csui-table-cell-name-link-text") || $(args.target).find("span.csui-node-type-icon").length !== 0 || $(args.target).find("span.csui-table-cell-name-link-text").length !== 0)) {
        return;
      }
      var isDetailsRow, row = args.currentTarget;
      isDetailsRow = $(row).hasClass("csui-details-row");
      if (isDetailsRow) {
        row = $(row).prev()[0];
      }
      if (!$(row).hasClass("row-not-selectable") && $(args.target).not("otc-tristatecheckbox.csui-checkbox").length > 0) {
        if ($(row).find(".csui-checkbox[disabled]").length === 1) {
          return;
        }
        if ($(row).find(".csui-checkbox[checked]").length === 1) {
          this.sender.table.tabletools().fnDeselect(row);
          if (isDetailsRow) {
            $(row).find(".csui-checkbox-icon-container").addClass("checkbox-visible");
          }
        } else {
          this.sender.table.tabletools().fnSelect([ row ]);
        }
      }
    },
    selectRowOnClickNameColumn: function(event) {
      var row = $(event.target).closest("tr");
      if (!$(row).hasClass("row-not-selectable")) {
        if ($(row).find(".csui-checkbox[disabled]").length === 1) {
          return;
        }
        if ($(row).find(".csui-checkbox[checked]").length === 1) {
          this.tableView.table.tabletools().fnDeselect(row);
        } else {
          this.tableView.table.tabletools().fnSelect(row);
        }
      }
    },
    addClassForNotSelectableRows: function() {
      var row, hasDetailsRow, disableItems = this.tableView.$el.find("tbody").find("button.csui-checkbox:disabled");
      for (var i = 0; i < disableItems.length; i++) {
        if (disableItems[i]) {
          row = $(disableItems[i]).closest("tr");
          $(row).addClass("row-not-selectable");
          hasDetailsRow = $(row).hasClass("csui-has-details-row");
          if (hasDetailsRow) {
            var detailsRow = $(row).next()[0];
            $(detailsRow).addClass("row-not-selectable");
          }
        }
      }
    },
    _handleRequestCollectionEvent: function() {
      if (this.prevOrderBy !== this.collection.orderBy) {
        this.collection.setSkip(0, false);
        this.prevOrderBy = this.collection.orderBy;
      }
    },
    _handleClick: function() {
      var self = this, drilldownHistoryLength = this.options.targetBrowseHistory.length;
      this.tableView.options.showBackArrow = this.options.targetBrowseHistory.length > 1;
      this.collection.setSkip(0, false);
      this.clearAllSelectedNodes();
      if (!this.container && this.options.showSearchBackArrow === true && drilldownHistoryLength === 0) {
        self.trigger("change:localScope", "home");
        self.trigger("click:location", this);
      } else if (!this.container && this.options.showSearchBackArrow === true && drilldownHistoryLength >= 1) {
        self.trigger("change:localScope", "node");
        self.trigger("click:location", this);
      } else {
        var prevNodeId = this.options.targetBrowseHistory.pop();
        var nodeNavigationCollection = this.connector.context && this.connector.context.getCollection(NodeNavigationFactory);
        if (nodeNavigationCollection && nodeNavigationCollection.length >= 1) {
          nodeNavigationCollection.remove(nodeNavigationCollection.at(nodeNavigationCollection.length - 1));
        }
        this.container.set("id", prevNodeId, {
          silent: true
        });
        this.container.fetch().done(function() {
          self.container.unset("id", {
            silent: true
          });
          self.container.set("id", prevNodeId);
          var origProps = self.container.get("_orig_properties");
          if (origProps) {
            NodeConverter.setNodeType(origProps);
            self.trigger("changed", prevNodeId, origProps.object_name, origProps.type, origProps.i_cabinet_id);
          } else {
            self.trigger("changed", prevNodeId, self.container.get("name"), self.container.get("type"), self.container.get("i_cabinet_id"));
          }
          self.trigger("sync:perspective", self.container, self);
          self.trigger("change:localScope", self.container.get("id"));
          self.trigger("hide:dropdownAndClearText");
        });
      }
    },
    _handleDefaultAction: function(node) {
      if (node.get("type") === constants.Types.CABINET || node.get("type") === constants.Types.FOLDER) {
        var self = this;
        this.options.targetBrowseHistory.push(self.children.oldNodeId);
        this.tableView.options.targetBrowseHistory.push(self.children.oldNodeId);
        this.options.targetBrowseHistory = _.uniq(this.options.targetBrowseHistory);
        this.tableView.options.showBackArrow = this.options.targetBrowseHistory.length !== 0;
        var nodeNavigationCollection = this.connector.context && this.connector.context.getCollection(NodeNavigationFactory);
        var ancestorNodeModel = new AncestorModel(node.attributes);
        ancestorNodeModel.id = node.get("id");
        nodeNavigationCollection.add(ancestorNodeModel);
        self.trigger("changed", node.get("id"), node.get("name"), node.get("type"), node.get("i_cabinet_id"));
        self.trigger("sync:perspective", node, self);
        this.trigger("change:localScope", node.get("id"));
        self.trigger("hide:dropdownAndClearText");
        if (this.container) {
          this.clearAllSelectedNodes();
          this.container.set(node.toJSON());
        }
      } else {
        this.selectRowOnClickNameColumn(event);
      }
      this.collection.setSkip(0, false);
    },
    _handleContainerChange: function() {
      this.collection.fetch().done(function() {
        if (this.options.selectType || this.options.disabledNodeIds) {
          this.enableSelection();
        }
      }.bind(this));
    },
    _handleOnRender: function() {
      this.addClassForNotSelectableRows();
    },
    _handleAddCollectionEvent: function(model) {
      if (this.options.selectType) {
        var value = model.get(this.typeAttrNameMap[this.options.selectType]);
        if (value !== this.options.selectTypeValue) {
          model.set("selectable", false, {
            silent: true
          });
        }
      }
    },
    onRender: function() {
      var viewportHeight;
      this.tableRegion.show(this.tableView);
      var isLandscape = window.matchMedia("(orientation: landscape)").matches, isPortrait = window.matchMedia("(orientation: portrait)").matches;
      if ((base.isTouchBrowser() || base.isAppleMobile()) && isPortrait) {
        viewportHeight = 790;
        this.$el.css({
          "max-height": viewportHeight - 275,
          "-webkit-overflow-scrolling": "touch",
          "overflow-y": "auto"
        });
      } else if ((this.isTabIPad() || base.isAppleMobile()) && isLandscape) {
        viewportHeight = 450;
        this.$el.css({
          "max-height": viewportHeight - 100,
          "-webkit-overflow-scrolling": "touch",
          "overflow-y": "auto"
        });
      }
      if (this.options.collection instanceof FavoriteCollection || this.options.collection instanceof SearchResultCollection || this.options.collection instanceof RelatedFilesCollection || this.options.collection instanceof WorkflowTemplatesCollection) {
        this.$el.addClass("un-clickable-table-data");
      }
    },
    isTabIPad: function() {
      const ua = navigator.userAgent;
      const isIPad = /iPad/i.test(ua);
      const isAndriod = /Android/i.test(ua);
      return isAndriod || isIPad;
    },
    getSelection: function() {
      return this.getAllSelectedNodes();
    },
    forceClose: function(resp) {
      this._displayAlert(resp).always(this.trigger("close"));
    },
    onClickLocation: function(view) {
      this.trigger("click:location", view);
    },
    getNumberOfSelectItems: function() {
      return _.size(this.selectList);
    },
    _displayAlert: function(resp) {
      var msg = _.str.sformat(lang.serverError, "unknown");
      if (resp) {
        if (resp instanceof SelectViews) {
          msg = _.str.sformat(lang.ViewDenied, resp.node.get("name"));
        } else {
          if (resp.responseJSON) {
            msg = resp.responseJSON.error;
          }
        }
      }
      return ModalAlert.showInformation(msg);
    },
    changeLocation: function(args) {
      var self = this;
      this.options.targetBrowseHistory = [];
      this.tableView.options.showBackArrow = false;
      this.container.set("id", args.get("id"), {
        silent: true
      });
      this.collection.setSkip(0, false);
      self.trigger("changed", args.get("id"), args.get("name"), args.get("type"), args.get("i_cabinet_id"));
      self.trigger("hide:dropdownAndClearText");
      this.clearAllSelectedNodes();
      this.container.fetch().done(function() {
        self.container.unset("id", {
          silent: true
        });
        self.container.set("id", args.get("id"));
        self.trigger("sync:perspective", self.container, self);
        self.trigger("change:localScope", self.container.get("id"));
      });
    },
    enableSelection: function() {
      var self = this;
      _.map(this.collection.allModels, function(entry) {
        var value = entry.get(self.typeAttrNameMap[self.options.selectType]);
        var isDisableId = self.options.disabledNodeIds && _.contains(self.options.disabledNodeIds, entry.get("id"));
        if (isDisableId || value !== self.options.selectTypeValue || self.options.disableContentTypes && self.options.disableContentTypes.length > 0 && _.contains(self.options.disableContentTypes, self.getContentType(entry))) {
          if (isDisableId && self.options.disabledSelectionState === true) {
            entry.set("csuiIsSelected", true, {
              silent: true
            });
          }
          entry.set("selectable", false);
        }
      });
    },
    getContentType: function(node) {
      return node.get("aContentType") || node.get("a_content_type");
    },
    _setNodeSelectionEvents: function() {
      this.listenTo(this.tableView, "tableRowSelected", function(args) {
        var allowMultiple = this.options.commandType.multiSelect;
        if (!allowMultiple) {
          this.clearAllSelectedNodes();
        }
        this.addNodesToSelection(args.nodes);
      }.bind(this));
      this.listenTo(this.tableView, "tableRowUnselected", function(args) {
        this.removeNodesFromSelection(args.nodes);
      }.bind(this));
    },
    _onTableBodyRendered: function() {
      widgetUtils.handleColumnSortRestriction(this.tableView, {
        restrictedColumnDescendingTooltip: nodesTableLang.restrictedColumnDescendingTooltip,
        restrictedColumnAscendingTooltip: nodesTableLang.restrictedColumnAscendingTooltip,
        restrictedColumnAscendingAria: nodesTableLang.restrictedColumnAscendingAria,
        restrictedColumnDescendingAria: nodesTableLang.restrictedColumnDescendingAria
      });
    }
  });
  _.extend(SelectViews.prototype, LayoutViewEventsPropagationMixin);
  _.extend(SelectViews.prototype, NodeSelectionMixin);
  return SelectViews;
});