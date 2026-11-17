/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/utils/accessibility", "csui/behaviors/default.action/default.action.behavior", "csui/controls/progressblocker/blocker", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitems.mask", "nuc/models/node/node.model", "nuc/models/nodes", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/commands", "d2/controls/mixins/view.state/task.view.state.mixin", "dctmw/controls/split.panel/split.panel.view", "d2/models/workflow/tasks", "d2/models/workflow/task.supporting.files", "d2/models/workflow/task.working.files", "d2/utils/contexts/factories/tasks.factory", "d2/utils/contexts/factories/task", "d2/utils/server.query.utils", "d2/utils/widget.constants", "dctmw/utils/user.preference.storage", "d2/widgets/taskstable/task.toolbaritems", "d2/widgets/taskstable/task.toolbaritems.masks", "d2/widgets/miniviewer/miniviewer.view", "d2/widgets/task.documents/impl/item.title/task.item.title.view", "d2/widgets/task.documents/impl/documents.list/task.documents.list.view", "d2/widgets/task.documents/impl/task.file.metadata.view", "d2/widgets/task.documents/impl/document.versions.list/taskdoc.versions.list.view", "csui/models/nodeversions", "csui/models/version", "d2/models/filtered.node.versions.collection", "dctmw/utils/rest.resources", "csui/controls/form/pub.sub", "d2/widgets/task.details/impl/task.files.list/task.attachments.tabletree/task.attachments.table.tree.view", "i18n!d2/widgets/task.documents/impl/nls/lang", "i18n!d2/widgets/task.details/impl/nls/lang", "hbs!d2/widgets/task.documents/impl/task.documents", "css!d2/widgets/task.documents/impl/task.documents" ], function(_, $, Backbone, Marionette, Accessibility, DefaultActionBehavior, BlockingView, LayoutViewEventsPropagationMixin, ToolItemsFactory, ToolItemsMask, NodeModel, NodeCollection, ApplicationScopeModelFactory, commands, TaskViewStateMixin, SplitPanelView, TaskCollection, TaskSupportingFileCollection, TaskWorkingFileCollection, TaskCollectionFactory, TaskModelFactory, serverQueryUtil, widgetConstants, userPreference, taskToolItems, TaskToolItemsMasks, Miniviewer, TaskItemTitleView, TaskDocumentListView, TaskFileMetadataView, TaskDocumentVersionsListView, NodeVersionCollection, VersionModel, filteredNodeVersionsCollection, RestResources, PubSub, TaskAttachmentsTableTreeView, lang, langTaskDetails, template) {
  "use strict";
  var applyPriorityCollectionFetchOverride = function(clazz) {
    var proto = clazz.prototype, origFetch = proto.fetch;
    _.extend(proto, {
      fetch: function(options) {
        options = options || {};
        var origSuccess = options.success;
        options.success = function(collection, response, options) {
          if (_.isArray(collection.priorityModelIds) && collection.priorityModelIds.length) {
            var priorityModels = _.compact(_.map(collection.priorityModelIds, function(id) {
              var found = _.find(collection.allModels, function(model) {
                return id === model.get("id");
              });
              if (!found) {
                found = _.find(collection.allModels, function(model) {
                  return id === model.get("i_chronicle_id");
                });
              }
              return found;
            }));
            if (collection.keepOnlyPriorityModels === true) {
              var originalAllModels = _.clone(collection.allModels);
              collection.reset(priorityModels);
              collection.allModels = originalAllModels;
            } else {
              collection.remove(priorityModels);
              collection.unshift(priorityModels);
            }
          }
          _.isFunction(origSuccess) && origSuccess(collection, response, options);
        };
        return origFetch.call(this, options);
      }
    });
    return clazz;
  };
  var PriorityOrderingSupportingFileCollection = applyPriorityCollectionFetchOverride(TaskSupportingFileCollection.extend({})), PriorityOrderingWorkingFileCollection = applyPriorityCollectionFetchOverride(TaskWorkingFileCollection.extend({}));
  var TaskDocumentsView = Marionette.LayoutView.extend({
    className: Accessibility.isAccessibleMode() ? "d2-task-document-accessibility d2-task-documents-widget" : "d2-task-documents-widget",
    template: template,
    regions: {
      rgnTitleContainer: ".d2-task-documents-title-container",
      rgnPanels: ".d2-task-documents-panels"
    },
    constructor: function TaskDocumentsView(options) {
      options = options || {};
      this.context = options.context;
      this.connector = options.connector || this.context && this.context.getObject("connector");
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.aboutToBeDestroyed = false;
      this.isGroupedVersionsView = this.context.viewStateModel.get("query_string_params").dropdown === "groupedVersions";
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      this.prepareViewStateApi(options);
      this.addInitialURLParamSupport();
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.context && this.listenToOnce(this.context, "sync", this._onContextTaskSync);
      this.listenTo(this.model, "sync", this._onContextTaskSync).listenTo(this.model, "change:wf_working_documents_count change:wf_supporting_documents_count", this._reEvaluateActiveFilesTab).listenTo(this.getViewStateModel(), "change:state", this._onViewStateChanged);
      this._setupDefaultOptions();
      this._setupTitleView();
      this.isGroupedVersionsView ? this._setupDocVersionsListView() : this._setupDocumentListView();
    },
    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },
    initialize: function(options) {
      options = options || {};
      if (options.container) {
        this.container = options.container;
      } else if (options.data.containerId) {
        this.container = this.context.getModel(TaskModelFactory, {
          task: {
            attributes: {
              id: this.options.data.containerId
            }
          }
        });
      }
      if (!this.model) {
        this.model = this.context.getModel(TaskModelFactory, {
          attributes: options.data.id && {
            id: options.data.id
          },
          temporary: true
        });
        options.model = this.model;
      }
      if (!this.container) {
        this.container = options.model.clone();
      }
      options.container = this.container;
      var collectionOptions = {
        node: this.model,
        autoreset: true,
        fetchRelationsCount: true,
        delayRestCommands: true,
        promoteSomeRestCommands: true,
        commands: commands.getSignatures({
          dropdownMenuListInProperties: taskToolItems.filesMetadataHeaderDropdown
        }),
        toolbarItems: taskToolItems.filesMetadataHeaderDropdown
      };
      this.supportingFileCollection = new PriorityOrderingSupportingFileCollection(undefined, _.extend({}, collectionOptions));
      options.supportingFileCollection = this.supportingFileCollection;
      this.workingFileCollection = new PriorityOrderingWorkingFileCollection(undefined, _.extend({}, collectionOptions));
      options.workingFileCollection = this.workingFileCollection;
    },
    addInitialURLParamSupport: function() {
      this.addUrlParametersSupport(TaskViewStateMixin.PROPERTY_CONSTANTS.DOCUMENTS_PERSPECTIVE_INIT_URL_PARAMS);
    },
    _setupDefaultOptions: function() {
      this.options.originatingView = this;
      this.options.blockingParentView = this;
      this.options.commands = commands;
      this.options.toolbarItems = _.extend({}, taskToolItems);
      this.miniviewerButtonSuppressorMask = new ToolItemsMask({
        blacklist: [ "D2-RestoreMiniviewer" ],
        whitelist: []
      }, {
        normalize: true
      });
      this.miniviewerButtonSuppressorMask.storeMask();
      this.options.toolbarItemsMasks = new TaskToolItemsMasks(this.options);
      this.options.metadataHeaderToolitemMasks = {
        toolbars: {
          rightToolbar: this.miniviewerButtonSuppressorMask,
          relationsInlineActionBar: this.options.toolbarItemsMasks.toolbars.filesRelationTableInlineActionbar,
          relationsTableHeader: this.options.toolbarItemsMasks.toolbars.filesRelationTableSelectionToolbar
        }
      };
      _.defaults(this.options.toolbarItems, {
        dropdownMenuListInProperties: this.options.toolbarItems.filesMetadataHeaderDropdown
      });
    },
    _setupTitleView: function() {
      if (!this.titleView) {
        this.titleView = new TaskItemTitleView(_.defaults({
          model: this.model,
          showBackButton: true,
          tooltipBackButton: this.getBackTitleOfLastRouter(),
          fnCustomNameFormatter: function(model) {
            return _.str.sformat(lang.taskDocumentsTitle, model.get("name"));
          },
          toolItems: new ToolItemsFactory(),
          toolItemsMask: null
        }, this.options));
        this.listenTo(this.titleView, "click:back", this._onClickBack);
      }
    },
    _setupDocVersionsListView: function() {
      let node = this.context.parentContext.viewStateModel.get("selectedNode");
      this.versionCollection = new filteredNodeVersionsCollection(undefined, {
        node: node,
        autoreset: true,
        expand: "user",
        ignoreColumns: true,
        onlyClientSideDefinedColumns: true,
        minorVersionsOf: node?.get("r_version_label").filter(v => /^\d+(\.\d+)?$/.test(v)).map(v => parseInt(v.split(".")[0]))[0],
        majorVersionsOnly: true
      });
      this.listenTo(this.versionCollection, "sync", function() {
        this.versionCollection.each(function(model) {
          model.set("isInGroupedVersions", true);
        });
      });
      let newOptions = _.extend({}, this.options, {
        collection: this.versionCollection,
        data: {
          title: lang.groupedVersionsTitle,
          listAria: lang.groupedVersionsListAria,
          listRole: "menu",
          childRole: "menuitem"
        },
        majorVersionsOnly: true
      });
      this.documentListView = new TaskDocumentVersionsListView(newOptions);
      this.listenTo(this.documentListView, "click:item", this._onDocVersionClickItem);
    },
    _onDocVersionClickItem: function(item) {
      this._createAndRenderMetadataView(item.model);
    },
    _setupDocumentListView: function() {
      if (!this.documentListView) {
        this.setViewStateTaskDocumentsType(TaskDocumentListView.TAB_NAMES.WORKING_FILES, false, false);
        this.addUrlParametersSupport([ "type" ]);
        var typeTabFromViewState = this.getViewStateTaskDocumentsType(), hasWorkingDocuments = this.model.get("wf_working_documents_count") > 0, hasSupportingDocuments = this.model.get("wf_supporting_documents_count") > 0, options = {};
        if (_.contains(_.values(TaskDocumentListView.TAB_NAMES), typeTabFromViewState)) {
          options.selectedTab = typeTabFromViewState;
          options.selectedNodeId = this.getViewStateTaskDocumentsSelectedNodeId();
          if (options.selectedTab === TaskDocumentListView.TAB_NAMES.WORKING_FILES && !hasWorkingDocuments) {
            options.selectedTab = TaskDocumentListView.TAB_NAMES.SUPPORTING_FILES;
            delete options.selectedNodeId;
          }
          if (options.selectedTab === TaskDocumentListView.TAB_NAMES.SUPPORTING_FILES && !hasSupportingDocuments) {
            options.selectedTab = TaskDocumentListView.TAB_NAMES.WORKING_FILES;
            delete options.selectedNodeId;
          }
        }
        const preferences = RestResources.getCurrentUser().get("preferences");
        if (preferences && preferences.task_widget_tab_options) {
          options.isTaskDetailsWithContent = true;
          options.showOnlyNameCol = true;
        }
        this.documentListView = new TaskDocumentListView(_.defaults(options, this.options));
        this.listenTo(PubSub, "refresh:taskPage:metadataView", (view, model) => this._onDocumentListSelectItem(view, model));
        this.listenTo(this.documentListView, "select:item", this._onDocumentListSelectItem).listenToOnce(this.documentListView, "render", function() {
          var tabLinks = this.documentListView.tabLinks;
          if (tabLinks && tabLinks.selected) {
            var typeTabFromViewState = this.getViewStateTaskDocumentsType();
            if (typeTabFromViewState !== tabLinks.selected.get("name")) {
              this._onDocumentListTypeChange(tabLinks.selected);
            }
            this.listenTo(tabLinks.selected, "change", this._onDocumentListTypeChange);
          }
          this._reEvaluateActiveFilesTab();
        }.bind(this));
      }
    },
    onRender: function() {
      if (!this.splitPanel) {
        this.splitPanel = new SplitPanelView({
          type: SplitPanelView.TYPES.THREE_WAY
        });
        this.rgnPanels.show(this.splitPanel);
      }
      if (!this.context) {
        this._renderChildrenViews();
      }
    },
    _renderChildrenViews: function() {
      this.titleView && this.rgnTitleContainer.show(this.titleView);
      var viewerVisiblityPref = this._retreiveMiniViewerPanelVisibilitySetting();
      if (viewerVisiblityPref === false) {
        this.splitPanel.ui.tertiaryPane.css({
          "flex-basis": 0
        });
        this.splitPanel.ui.tertiaryPane.css("min-width", 0);
      }
      this.splitPanel.showPanelViews(this.documentListView, this.mdv);
    },
    _createAndRenderMetadataView: function(node) {
      if (this.mdv) {
        if (this.mdv.model === node) {
          return;
        }
        this.mdv.destroy();
      }
      this.mdv = new TaskFileMetadataView(_.defaults({
        model: node,
        originatingView: this,
        container: this.container,
        collection: this.collection,
        toolbarItems: _.extend({}, this.options.toolbarItems, {
          rightToolbar: this.options.toolbarItems.filesMetadataRightBar,
          relationsInlineActionBar: this.options.toolbarItems.filesRelationTableInlineActionbar,
          relationsTableHeader: this.options.toolbarItems.filesRelationTableSelectionToolbar
        }),
        toolbarItemsMasks: this.options.metadataHeaderToolitemMasks
      }, this.options));
      this.mdv.internal = true;
      this.mdv.on("change:miniviewer:visibiity", this._showHideMiniviewer.bind(this));
      if (this.miniviewerButtonSuppressorMask.passItem({
        signature: "D2-RestoreMiniviewer"
      })) {
        this.mdv.$el.addClass("d2-task-metadata-rightbar-active");
      }
      this._renderChildrenViews();
    },
    _showHideMiniviewer: function(isShown) {
      if (isShown) {
        this.$el.addClass("show-miniviewer");
      } else {
        this.$el.removeClass("show-miniviewer");
      }
    },
    _onContextTaskSync: function() {
      this._renderChildrenViews();
    },
    _onViewStateChanged: function() {
      this._reEvaluateActiveFilesTab();
    },
    _onClickBack: function(e) {
      this.trigger("task:documents:navigation:back", e);
      TaskAttachmentsTableTreeView._selectedObjId = undefined;
      if ((!e || !e.isDefaultPrevented()) && this.aboutToBeDestroyed !== true) {
        var cmdGoBack = commands.get("D2-Back");
        if (cmdGoBack) {
          this.stopListening(this.getViewStateModel(), "change:state");
          this.mdv && this.mdv.prepareForDestroy();
          this.aboutToBeDestroyed = true;
          cmdGoBack.execute({
            context: this.context,
            restoreLastFragment: true
          });
        }
      }
    },
    _reEvaluateActiveFilesTab: function() {
      var hasWorkingDocuments = this.model.get("wf_working_documents_count") > 0, hasSupportingDocuments = !!(this.documentListView && this.documentListView.collection.findWhere({
        name: TaskDocumentListView.TAB_NAMES.SUPPORTING_FILES
      }) && this.model.get("wf_supporting_documents_count") > 0);
      if (hasWorkingDocuments || hasSupportingDocuments) {
        if (this.documentListView && this.documentListView.tabLinks) {
          this.documentListView.trigger("change:dropdown:visibility", hasWorkingDocuments && hasSupportingDocuments);
          var typeTabFromViewState = this.getViewStateTaskDocumentsType(), tabLinks = this.documentListView.tabLinks, selectedTabName = tabLinks.selected.get("name");
          if (selectedTabName === TaskDocumentListView.TAB_NAMES.WORKING_FILES) {
            if (!hasWorkingDocuments) {
              selectedTabName = TaskDocumentListView.TAB_NAMES.SUPPORTING_FILES;
            }
          } else {
            if (!hasSupportingDocuments) {
              selectedTabName = TaskDocumentListView.TAB_NAMES.WORKING_FILES;
            }
          }
          if (selectedTabName !== tabLinks.selected.get("name")) {
            tabLinks.activateDropdownTab(selectedTabName, true);
          }
          if (selectedTabName !== typeTabFromViewState) {
            this._onDocumentListTypeChange(tabLinks.collection.findWhere({
              name: selectedTabName
            }));
          }
        }
      } else {
        this._onClickBack();
      }
    },
    _onDocumentListSelectItem: function(sourceView, selectedModel) {
      if (selectedModel?.collection?.delayedActions?.fetching) {
        selectedModel.collection.delayedActions.fetching.always(this._onDocumentListSelectItem.bind(this, sourceView, selectedModel));
        return;
      }
      if (selectedModel) {
        this._setActiveAttachmentCollection(selectedModel?.collection);
        this.setViewStateTaskDocumentsSelectedNodeId(selectedModel.get("id"), true, false);
        this._createAndRenderMetadataView(selectedModel);
      }
    },
    _setActiveAttachmentCollection: function(collection) {
      if (this.collection !== collection) {
        this.collection && this.stopListening(this.collection, "d2:task:attachments:added");
        this.collection = collection;
        this.listenTo(this.collection, "d2:task:attachments:added", this._onTaskAttachmentsAdded);
      }
    },
    _onTaskAttachmentsAdded: function(newModelsWithinCollection, successfullyAddedModels) {
      if (this.collection !== this.supportingFileCollection && successfullyAddedModels.length) {
        var priorityModelIds = _.map(successfullyAddedModels, function(model) {
          return model.get("i_chronicle_id") || model.get("id");
        });
        this.supportingFileCollection.priorityModelIds = priorityModelIds.concat(_.isArray(this.supportingFileCollection.priorityModelIds) ? this.supportingFileCollection.priorityModelIds : []);
        this.supportingFileCollection.priorityModelsHighlighted = true;
        var supportingDocumentCount = priorityModelIds.length + this.model.get("wf_supporting_documents_count");
        this.model.set("wf_supporting_documents_count", supportingDocumentCount);
        if (!this.supportingFileCollection.fetched) {
          var tabLinksCollection = this.documentListView && this.documentListView.tabLinks && this.documentListView.tabLinks.collection, tabModel = tabLinksCollection && tabLinksCollection.findWhere({
            name: TaskDocumentListView.TAB_NAMES.SUPPORTING_FILES
          });
          tabModel && this.documentListView.trigger("update:tab:header", tabModel, _.str.sformat(langTaskDetails.titleAdditionalPanelSupportingFiles, supportingDocumentCount));
        } else {
          this.supportingFileCollection.fetched = false;
        }
      }
    },
    _onDocumentListTypeChange: function(model) {
      model && this.setViewStateTaskDocumentsType(model.get("name"), false);
    },
    getMetadataRightbarClassName: function() {
      return "d2-task-metadata-rightbar-active";
    },
    _retreiveMiniViewerPanelVisibilitySetting: function() {
      return userPreference.getLocalStorePreference(userPreference.StorageTypes.MINIVIEWER_VISIBLITY, "is_miniview_visible");
    },
    onBeforeDestroy: function() {
      this.aboutToBeDestroyed = true;
      this.clearViewStateTaskDocumentsType();
      this.miniviewerView && this.miniviewerView.destroy();
      this.context.viewStateModel.setViewState("dropdown", "");
    }
  });
  _.extend(TaskDocumentsView.prototype, LayoutViewEventsPropagationMixin);
  TaskViewStateMixin.mixin(TaskDocumentsView.prototype);
  return TaskDocumentsView;
});