/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/base", "csui/controls/globalmessage/globalmessage", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/toolbar/toolitems.filtered.model", "csui/controls/toolbar/toolbar.view", "csui/controls/toolbar/delayed.toolbar.view", "csui/controls/table/table.view", "csui/controls/pagination/nodespagination.view", "csui/utils/versions.default.action.items", "csui/utils/commands/versions", "csui/utils/commandhelper", "csui/utils/accessibility", "csui/controls/table.rowselection.toolbar/table.rowselection.toolbar.view", "csui/controls/tableactionbar/tableactionbar.view", "csui/controls/toolbar/toolbar.command.controller", "csui/models/nodes", "csui/models/node.actions", "csui/models/columns", "csui/models/nodeversions", "csui/models/version", "csui/widgets/metadata/impl/versions/metadata.versions.columns", "csui/widgets/metadata/versions.toolbaritems", "csui/widgets/metadata/versions.toolbaritems.mask", "csui/utils/log", "csui/utils/url", "hbs!csui/widgets/metadata/impl/versions/metadata.versions", "i18n!csui/widgets/metadata/impl/nls/lang", "csui/controls/icon/icon.view", "csui/controls/table/rows/description/description.view", "csui/utils/contexts/factories/user", "nuc/utils/namedlocalstorage", "css!csui/widgets/metadata/impl/versions/metadata.versions" ], function(module, $, _, Backbone, Marionette, base, GlobalMessage, LayoutViewEventsPropagationMixin, FilteredToolItemsCollection, ToolbarView, DelayedToolbarView, TableView, PaginationView, defaultActionItems, commands, CommandHelper, Accessibility, TableRowSelectionToolbarView, TableActionBarView, ToolbarCommandController, NodeCollection, NodeActionCollection, NodeColumnCollection, NodeVersionCollection, VersionModel, metadataVersionsColumns, toolbarItems, VersionsToolbarItemsMask, Log, Url, template, metadataLang, IconView, DescriptionRowView, UserModelFactory, NamedLocalStorage) {
  "use strict";
  var accessibleTable = Accessibility.isAccessibleTable();
  const enforceDescriptionColumnInAccessibleMode = Accessibility.shouldEnforceDescriptionColumn();
  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30,
    defaultPageSizes: [ 30, 50, 100 ],
    showInlineActionBarOnHover: !accessibleTable,
    forceInlineActionBarOnClick: false,
    inlineActionBarStyle: "csui-table-actionbar-bubble",
    enabled: true,
    useV2RestApi: false
  });
  var MetadataVersionsTableView = Marionette.LayoutView.extend({
    className: function() {
      var className = "metadata-inner-wrapper";
      if (accessibleTable) {
        className += " csui-no-animation";
      }
      return className;
    },
    template: template,
    ui: {
      tableRowSelectionToolbarView: ".csui-metadata-versions-rowselection-toolbar-view",
      tableView: ".csui-table-view",
      childContainer: ".csui-table-view",
      paginationView: ".csui-pagination-view",
      toggleDescription: ".csui-description-toggle"
    },
    regions: {
      tableRowSelectionToolbarRegion: "@ui.tableRowSelectionToolbarView",
      tableRegion: "@ui.tableView",
      paginationRegion: "@ui.paginationView"
    },
    events: {
      "click @ui.toggleDescription": "onToggleDescriptionClick",
      "keypress @ui.toggleDescription": "onToggleDescriptionClick"
    },
    constructor: function MetadataVersionsTableView(options) {
      this.commands = commands;
      _.defaults(options, {
        pageSize: config.defaultPageSize,
        ddItemsList: config.defaultPageSizes,
        showInlineActionBarOnHover: config.showInlineActionBarOnHover,
        forceInlineActionBarOnClick: config.forceInlineActionBarOnClick,
        inlineActionBarStyle: config.inlineActionBarStyle,
        toolbarItems: toolbarItems,
        originatingView: options.originatingView || options.metadataView
      });
      MetadataVersionsTableView.__super__.constructor.call(this, options);
      this.namedLocalStorage = new NamedLocalStorage("metadata_versions_cache");
      this.currentUserId = this.options.context && this.options.context.getModel(UserModelFactory).get("id");
      this.selectedNodes = new NodeCollection();
      this.collection = new NodeVersionCollection(undefined, {
        node: this.options.model,
        autoreset: true,
        expand: "user",
        commands: commands.getAllSignatures(),
        useV2RestApi: config.useV2RestApi,
        onlyClientSideDefinedColumns: true
      });
      this._ensureNodeAdvanceInfo();
      this.options.model.versions = this.collection;
      this.commandController = new ToolbarCommandController({
        commands: this.commands
      });
      if (this.collection.delayedActions) {
        this.listenTo(this.collection.delayedActions, "error", function(collection, request, options) {
          var error = new base.Error(request);
          GlobalMessage.showMessage("error", error.message);
        });
      }
      this.defaultActionItems = defaultActionItems;
      if (!this.options.toolbarItemsMasks) {
        this.options.toolbarItemsMasks = new VersionsToolbarItemsMask(this.options);
      }
      this._setTableView();
      this._setTableRowSelectionToolbar({
        toolItemFactory: this.options.toolbarItems.tableHeaderToolbar,
        toolbarItemsMask: this.options.toolbarItemsMasks,
        commands: this.options.commands || commands
      });
      this._setTableRowSelectionToolbarEventListeners();
      this._setPagination();
      this._updateCollection();
      this.propagateEventsToRegions();
      this.listenTo(this.collection, "add", this._updateCollection).listenTo(this.collection, "remove", this._updateCollection);
    },
    onRender: function() {
      this.tableRowSelectionToolbarRegion.show(this._tableRowSelectionToolbarView);
      this.tableRegion.show(this.tableView);
      this.paginationRegion.show(this.paginationView);
      this.listenTo(this.collection, "reset change:description", () => this.updateDescriptionToggleIcon());
      this.renderDescriptionToggleIcon();
      this.listenTo(this.tableView, "creatingTable", () => {
        if (this.tableView.displayedColumns && this.tableView.displayedColumns.length > 0) {
          const indexOfNameColumn = this.tableView.displayedColumns.findIndex(column => column.name === "name");
          this.tableView.options.descriptionRowViewOptions.firstColumnIndex = indexOfNameColumn;
          this.tableView.options.descriptionRowViewOptions.lastColumnIndex = indexOfNameColumn;
          this.tableView.options.descriptionRowViewOptions.showDescriptions = !accessibleTable && this.showDescription;
        }
      });
      this.listenTo(this, "dom:refresh", () => {
        if (!this.ui.toggleDescription.hasClass("binf-hidden")) this.ui.toggleDescription.attr("tabindex", 0);
      });
    },
    renderDescriptionToggleIcon() {
      this.showDescription = this.namedLocalStorage.get(`isDescriptionShown:${this.currentUserId}`);
      this.toggleDescriptionIconView = new IconView({
        iconName: "csui_action_reveal_description32",
        states: true,
        on: this.showDescription,
        theme: this._useIconsForDarkBackground ? "dark" : ""
      });
      this.toggleDescriptionIconRegion = new Marionette.Region({
        el: this.ui.toggleDescription
      });
      this.toggleDescriptionIconRegion.show(this.toggleDescriptionIconView);
      if (this.showDescription) {
        this.tableView.showDetailRowDescriptions(true);
        this.ui.toggleDescription.attr("title", metadataLang.hideDescription);
        this.ui.toggleDescription.attr("aria-label", metadataLang.hideDescription);
      } else {
        this.ui.toggleDescription.attr("title", metadataLang.showDescription);
        this.ui.toggleDescription.attr("aria-label", metadataLang.showDescription);
      }
    },
    updateDescriptionToggleIcon() {
      const models = this.collection.models;
      const descriptionAvailable = models.some(model => model.get("description") && model.get("description").length > 0);
      if (descriptionAvailable && !accessibleTable) {
        this.ui.toggleDescription.removeClass("binf-hidden");
        this.ui.toggleDescription.attr("tabindex", 0);
      } else {
        this.ui.toggleDescription.toggleClass("binf-hidden", true);
      }
    },
    _addActionToCollection: function(action) {
      this.collection.forEach(function(versionModel) {
        versionModel.actions.add(action);
      });
    },
    _updateCollection: function() {
      var deferred = $.Deferred();
      var errorMessage;
      this.collection.fetch().then(function(res) {
        deferred.resolve();
      }, function(err) {
        if (err && err.responseJSON && err.responseJSON.error) {
          errorMessage = err.responseJSON.error;
        } else {
          var errorHtml = base.MessageHelper.toHtml();
          base.MessageHelper.reset();
          errorMessage = $(errorHtml).text();
        }
        GlobalMessage.showMessage("error", errorMessage);
        deferred.reject();
      });
    },
    _setTableView: function() {
      this.options || (this.options = {});
      var args = _.extend({
        tableColumns: metadataVersionsColumns,
        connector: this.model.connector,
        collection: this.collection,
        columns: this.collection.columns,
        columnsWithSearch: [],
        orderBy: "version_number_name desc",
        actionItems: defaultActionItems,
        commands: commands,
        descriptionRowView: DescriptionRowView,
        descriptionRowViewOptions: {
          firstColumnIndex: 2,
          lastColumnIndex: 2,
          showDescriptions: !accessibleTable && this.showDescription,
          collapsedHeightIsOneLine: true,
          displayInEntireRow: true
        },
        enforceDescriptionColumnInAccessibleMode: enforceDescriptionColumnInAccessibleMode,
        inlineBar: {
          viewClass: TableActionBarView,
          options: _.extend({
            collection: this.options.toolbarItems.inlineActionbar,
            toolItemsMask: this.options.toolbarItemsMasks,
            container: this.collection.node,
            containerCollection: this.collection
          }, this.options.toolbarItems.inlineActionbar.options, {
            inlineBarStyle: this.options.inlineActionBarStyle,
            forceInlineBarOnClick: this.options.forceInlineActionBarOnClick,
            showInlineBarOnHover: this.options.showInlineActionBarOnHover
          })
        },
        originatingView: this.options.originatingView,
        focusView: "tableHeader",
        tableAria: _.str.sformat(metadataLang.versionTableAria, this.collection.node.get("name"))
      }, this.options);
      delete args.blockingParentView;
      if (!_.contains(this.options.ddItemsList, this.options.pageSize)) {
        this.options.ddItemsList.push(this.options.pageSize);
        this.options.ddItemsList.sort();
      }
      this.tableView = new TableView(args);
      var cmdOption = {
        context: this.options.context,
        originatingView: this
      };
      this.listenTo(this.tableView, "execute:defaultAction", function(node) {
        var action = this.defaultActionItems.find(function(actionItem) {
          if (actionItem.get("type") === node.get("type")) {
            return true;
          }
        }, this);
        var status = {
          nodes: new NodeVersionCollection([ node ])
        }, cmd = this.options?.originatingView?.ensureSidePanel ? commands.get("DocPreview") : commands.get(action.get("signature"));
        var promise = cmd.execute(status, cmdOption);
        CommandHelper.handleExecutionResults(promise, {
          command: cmd,
          suppressSuccessMessage: status.suppressSuccessMessage,
          suppressFailMessage: status.suppressFailMessage
        });
      });
    },
    _setTableRowSelectionToolbar: function(options) {
      this._tableRowSelectionToolbarView = new TableRowSelectionToolbarView({
        toolItemFactory: options.toolItemFactory,
        toolbarItemsMask: options.toolbarItemsMask,
        toolbarCommandController: this.commandController,
        commands: commands,
        selectedChildren: this.tableView.selectedChildren,
        container: this.collection.node,
        context: this.options.context,
        originatingView: this.options.originatingView,
        collection: this.collection
      });
    },
    _setTableRowSelectionToolbarEventListeners: function() {
      this.listenTo(this.tableView.selectedChildren, "reset", function() {
        if (this.tableView.selectedChildren.length > 0) {
          this.tableRowSelectionToolbarRegion.$el.addClass("csui-metadata-versions-rowselection-toolbar-visible");
        } else {
          this.tableRowSelectionToolbarRegion.$el.removeClass("csui-metadata-versions-rowselection-toolbar-visible");
        }
      });
    },
    _setPagination: function() {
      this.paginationView = new PaginationView({
        collection: this.collection,
        pageSize: this.options.pageSize,
        defaultDDList: this.options.ddItemsList,
        skipPaginationUpdateRequest: true
      });
    },
    onToggleDescriptionClick: function(e) {
      if (e.type === "keypress" && (e.keyCode === 13 || e.keyCode === 32) || e.type === "click") {
        e.preventDefault();
        if (!this.showDescription) {
          this.namedLocalStorage.set(`isDescriptionShown:${this.currentUserId}`, true);
          this.ui.toggleDescription.attr("title", metadataLang.hideDescription);
          this.ui.toggleDescription.attr("aria-label", metadataLang.hideDescription);
          this._setShowDescription(true);
        } else {
          this.namedLocalStorage.set(`isDescriptionShown:${this.currentUserId}`, false);
          this.ui.toggleDescription.attr("title", metadataLang.showDescription);
          this.ui.toggleDescription.attr("aria-label", metadataLang.showDescription);
          this._setShowDescription(false);
        }
        this.ui.toggleDescription.attr("tabindex", 0);
        if (e.type === "keypress") this.ui.toggleDescription.trigger("focus");
      }
    },
    _setShowDescription: function(show) {
      this.showDescription = show;
      this.tableView.showDetailRowDescriptions(show);
      this.toggleDescriptionIconView && this.toggleDescriptionIconView.setIconStateIsOn(show);
    },
    _ensureNodeAdvanceInfo: function() {
      var versionNode = this.options.model;
      if (versionNode.get("advanced_versioning") === undefined) {
        var id = versionNode.get("id"), connector = versionNode.connector ? versionNode.connector : this.options.connector, fullUrl = Url.combine(connector.getConnectionUrl().getApiBase("v2"), "/nodes/" + id + "/properties"), ajaxOptions = {
          type: "GET",
          url: fullUrl
        };
        connector.makeAjaxCall(ajaxOptions).done(_.bind(function(resp) {
          var response = resp.results.data && resp.results.data.properties;
          response && versionNode.set({
            advanced_versioning: response.advanced_versioning
          }, {
            silent: true
          });
        }, this)).fail(function(request) {
          var error = new base.Error(request);
          Log.warn("fetching node properties failed.\n{0}", error.stack) && console.warn(Log.last);
        });
      }
    }
  });
  _.extend(MetadataVersionsTableView.prototype, LayoutViewEventsPropagationMixin);
  return MetadataVersionsTableView;
});