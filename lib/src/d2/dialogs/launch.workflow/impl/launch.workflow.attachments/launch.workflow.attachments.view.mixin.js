/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "d2/controls/globalmessage/globalmessage", "nuc/utils/base", "d2/controls/button.toolbar/button.toolbar.view", "d2/widgets/task.details/impl/task.files.list/task.attachments.view", "d2/widgets/task.details/impl/task.files.list/task.files.list.view", "d2/widgets/task.details/impl/task.files.list/task.files.list.item.view", "d2/utils/server.query.utils", "dctmw/utils/utils", "d2/utils/constants", "nuc/models/node/node.model", "d2/utils/content.assist", "d2/dialogs/launch.workflow/impl/documents.validation/launch.workflow.validation.dialog", "hbs!d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.attachment", "hbs!d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.attachments.empty.list", "i18n!d2/dialogs/launch.workflow/impl/nls/lang" ], function(require, $, _, Marionette, GlobalMessage, base, ButtonToolbarView, TaskAttachmentsView, TaskFilesListView, TaskFilesListItemView, serverQueryUtils, utils, constants, NodeModel, ContentAssist, WfDocumentValidationDialog, listItemTemplate, emptyListTemplate, lang) {
  "use strict";
  var CustomFilesListItemView = TaskFilesListItemView.extend({
    template: listItemTemplate,
    constructor: function CustomFilesListItemView(options) {
      this._setupInlineToolbar(options);
      TaskFilesListItemView.prototype.constructor.apply(this, arguments);
      _.extend(this.ui, {
        inlineToolbarContainer: ".inline-toolbar-container"
      });
      this.options.hideListItemViewCheckbox = true;
      this.listenTo(this.originatingView.additionalPanelsView, "d2:launch:workflow:attachment:toolbar:update", this._updateInlineToolbar.bind(this));
      this.listenTo(this.originatingView.additionalPanelsView, "reset:tabindex", this._resetTabIndex.bind(this));
    },
    _resetTabIndex: function() {
      if (this.filesListView.selectedIndex === -1 && this.filesListView.collection.indexOf(this.model) === 0) {
        this.$el.prop("tabindex", "0");
      } else if (this.filesListView.selectedIndex === this.filesListView.collection.indexOf(this.model)) {
        this.$el.prop("tabindex", "0");
      } else {
        this.$el.prop("tabindex", "-1");
      }
    },
    _setupInlineToolbar: function(options) {
      var me = this;
      var buttonsConfig = {
        right: [ {
          id: "addRelatedFilesAsAttachment",
          className: "icon icon-launch-workflow-add-related-files-as-attachments",
          tooltip: options.originatingView.addRelatedButtonTooltip,
          clickHandler: this._onAddRelatedFilesAsAttachmentsClick.bind(this)
        }, {
          id: "removeAttachment",
          className: "icon icon-launch-workflow-remove-attachment",
          tooltip: lang.removeButtonTooltip,
          clickHandler: this._onRemoveAttachmentClick.bind(this)
        } ]
      };
      var addAttachment = {
        id: "addFiles",
        className: "icon icon-launch-workflow-add-attachments",
        tooltip: lang.AddPackageDocTooltip,
        clickHandler: function(e) {
          var packageSpan = me.$el.find(".package-info");
          var packageName = packageSpan?.attr("data-package-name") || "";
          var packageType = packageSpan?.attr("data-package-type") || "";
          options.filesListView.trigger("add", e, {
            packageName: packageName,
            packageType: packageType
          });
        }
      };
      buttonsConfig.right.push(addAttachment);
      this.inlineToolbarView = new ButtonToolbarView(buttonsConfig);
      if (!base.isTouchBrowser()) {
        this.events = _.extend(this.events, {
          mouseenter: "onShowInlineToolbar",
          mouseleave: "onHideInlineToolbar",
          focus: "_onFocus",
          focusout: "_onFocusOut"
        });
      }
    },
    _onFocus: function() {
      this.onShowInlineToolbar($.Event());
    },
    _onFocusOut: function() {
      var me = this;
      setTimeout(function() {
        if (me.$el.has(document.activeElement).length === 0 && me.el !== document.activeElement) {
          me.onHideInlineToolbar($.Event());
        }
      });
    },
    _updateInlineToolbarMultiPackage: function() {
      if (!this.model.get("multipackage")) {
        if (this.model.get("pckNode")) {
          this.$el.find(".icon-launch-workflow-add-attachments").removeClass("binf-hidden");
          this.$el.find(".icon-launch-workflow-remove-attachment").addClass("binf-hidden");
        } else {
          this.$el.find(".icon-launch-workflow-add-attachments").addClass("binf-hidden");
        }
      } else {
        this.$el.find(".icon-launch-workflow-add-related-files-as-attachments").addClass("binf-hidden");
        if (this.model.get("name")) {
          this.$el.find(".icon-launch-workflow-remove-attachment").removeClass("binf-hidden");
        } else {
          this.$el.find(".icon-launch-workflow-remove-attachment").addClass("binf-hidden");
        }
      }
    },
    _updateInlineToolbar: function() {
      if (!this.model.get("relations-count")) {
        this.$el.find(".icon-launch-workflow-add-related-files-as-attachments").addClass("binf-hidden");
      } else {
        this.$el.find(".icon-launch-workflow-add-related-files-as-attachments").removeClass("binf-hidden");
      }
      this._updateInlineToolbarMultiPackage();
    },
    onRender: function() {
      TaskFilesListItemView.prototype.onRender.apply(this, arguments);
      var inlineToolbarRegion = new Marionette.Region({
        el: this.ui.inlineToolbarContainer
      });
      inlineToolbarRegion.show(this.inlineToolbarView);
      if (base.isTouchBrowser()) {
        this.onShowInlineToolbar($.Event());
      }
      this._updateInlineToolbar();
    },
    onShowInlineToolbar: function(e) {
      e.stopPropagation();
      e.preventDefault();
      if (this.model.get("relations-count") || this.originatingView.collection.length > 1 || this.originatingView.collection.length <= 1 && !this.originatingView.showAtLeastOneDocument) {
        this.ui.inlineToolbarContainer.removeClass("binf-hidden");
      } else {
        this.ui.inlineToolbarContainer.addClass("binf-hidden");
      }
    },
    onHideInlineToolbar: function(e) {
      if (base.isTouchBrowser()) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      this.ui.inlineToolbarContainer.addClass("binf-hidden");
    },
    _onAddRelatedFilesAsAttachmentsClick: function(e) {
      e.stopPropagation();
      e.preventDefault();
      this.blockActions();
      var me = this, status = {
        context: this.context
      }, container = new NodeModel(undefined, {
        connector: this.model.connector,
        autofetch: true
      });
      var subTypeFilters = this.originatingView.ignoreSubTypeFilters !== true && [ this.originatingView.node.workflow_start_activity_package_type ];
      attachment.displayContentAssist(status, this.model, this, "", false, false, true, false, subTypeFilters, container).then(function(nodes) {
        var uniqueFileNodes = {};
        _.each(nodes, function(node) {
          node.set("id", node.get("file_object_id"), {
            slient: true
          });
          uniqueFileNodes[node.get("file_object_id")] = node;
        });
        return attachment.add(_.values(uniqueFileNodes), me.originatingView);
      }).catch(function(xhr, message, statusText) {
        if (xhr !== "close") {
          this.unblockActions();
          var errorMessage = xhr && xhr.responseText ? utils.parseAjaxErrorAsString(xhr, statusText, message) : typeof xhr === "string" ? xhr : "";
          GlobalMessage.showMessage("error", errorMessage);
        }
      }.bind(this));
      setTimeout(_.bind(function() {
        this.originatingView.trigger("highlight", false);
        this.originatingView.collection.fetch({
          reset: false
        });
      }, this), 1e3);
    },
    _onRemoveAttachmentClick: function(e) {
      e.stopPropagation();
      e.preventDefault();
      if (!this.model.get("multipackage")) {
        this.originatingView.collection.trigger("d2:task:attachments:removed", [ this.model ]);
      } else {
        var name = this.model.get("package").name;
        var modelToUpdate = this.originatingView.collection.find(function(model) {
          return model.get("package")["name"] === name;
        });
        if (modelToUpdate) {
          const index = this.originatingView.collection.indexOf(modelToUpdate);
          var pcknode = new NodeModel({
            connector: this.model.get("connector")
          });
          pcknode.set("package", modelToUpdate.get("package"));
          pcknode.set("multipackage", modelToUpdate.get("multipackage"));
          this.originatingView.collection.at(index).set(pcknode);
          this.originatingView.collection.remove(modelToUpdate);
          this.originatingView.collection.add(pcknode, {
            at: index
          });
        }
        this.originatingView.collection.trigger("d2:task:package:unmapped");
      }
      this.originatingView.additionalPanelsView.options.originatingView.trigger("refresh:footer");
      var additionalPanelsView = this.originatingView.additionalPanelsView;
      if (this.originatingView.showAtLeastOneDocument) {
        additionalPanelsView.options.node.workingFiles = this.originatingView.collection.models;
        additionalPanelsView.options.wizard.refreshHeader();
      } else {
        additionalPanelsView.options.node.supportingFiles = this.originatingView.collection.models;
      }
      this.originatingView.additionalPanelsView.trigger("d2:launch:workflow:attachment:toolbar:update");
      this.filesListView.selectedIndex === -1 && (this.filesListView.selectedIndex = 0);
    },
    _setInlineActions: function() {
      this.showInlineActionBar = false;
    },
    onShowInlineMenu: function() {},
    onHideInlineMenu: function() {}
  });
  var attachment = {
    add: function(nodes, workflowFilesView, data) {
      var fileType = workflowFilesView.showAtLeastOneDocument ? "working" : "supporting", collectionIds = workflowFilesView.collection.pluck("id"), nodesToBeAdded = _.reject(nodes, function(node) {
        return _.contains(collectionIds, node.get("id"));
      }), deferred = $.Deferred();
      if (!(nodesToBeAdded && nodesToBeAdded.length)) {
        if (!(nodes && nodes.length)) {
          return deferred.reject("Atleast one document is required to add as attachment.").promise();
        } else {
          return deferred.reject("close").promise();
        }
      }
      var isMultiPackage = workflowFilesView.node.get("multipackage");
      var dialog = new WfDocumentValidationDialog({
        status: workflowFilesView.options.originatingView.options.status,
        command: workflowFilesView.options.originatingView.options.command,
        node: workflowFilesView.node,
        fileType: fileType,
        nodeModels: nodesToBeAdded,
        originatingView: workflowFilesView
      });
      workflowFilesView.blockActions();
      function addDocuments(validDocuments) {
        nodesToBeAdded = validDocuments && validDocuments.length ? validDocuments : nodesToBeAdded;
        if (fileType === "supporting" && !_.isUndefined(workflowFilesView.node.max_supporting_documents_allowed) && nodesToBeAdded.length + workflowFilesView.collection.length > workflowFilesView.node.max_supporting_documents_allowed) {
          return deferred.reject(workflowFilesView.node.max_supporting_documents_allowed === 1 ? lang.OneSupportingFileAlloedMessage : _.str.sformat(lang.ExceedMaxSupportingCountMessage, workflowFilesView.node.max_supporting_documents_allowed)).promise();
        }
        var objectIDs = _.map(nodesToBeAdded, function(node) {
          return node.get("id");
        }), parameters = {
          ids: objectIDs,
          connector: workflowFilesView.additionalPanelsView.options.node.connector,
          relationsCount: true
        };
        serverQueryUtils.fetchDataForObjects(parameters).always(function(result) {
          if (result && result.relationsCount) {
            _.each(nodesToBeAdded, function(model) {
              var id = model.get("id");
              result.relationsCount && result.relationsCount[id] && model.set("relations-count", result.relationsCount[id]["relations_count"], {
                silent: true
              });
            });
          }
          if (fileType === "working") {
            if (isMultiPackage) {
              var node = nodesToBeAdded[0];
              var modelToUpdate = workflowFilesView.collection.find(function(model) {
                return model.get("package")["name"] === data["packageName"];
              });
              const pck = modelToUpdate.get("package");
              const index = workflowFilesView.collection.indexOf(modelToUpdate);
              workflowFilesView.collection.remove(modelToUpdate);
              modelToUpdate.set(node.toJSON());
              modelToUpdate.set("package", pck);
              const adjustedIndex = index > workflowFilesView.collection.length ? workflowFilesView.collection.length : index;
              workflowFilesView.collection.add(modelToUpdate, {
                at: adjustedIndex
              });
            } else {
              workflowFilesView.collection.add(nodesToBeAdded);
            }
            workflowFilesView.additionalPanelsView.options.originatingView.trigger("refresh:footer");
            workflowFilesView.collection.trigger("d2:task:package:mapped");
          } else {
            workflowFilesView.collection.add(nodesToBeAdded);
            workflowFilesView.collection.trigger("d2:task:attachments:added", nodesToBeAdded);
            if (workflowFilesView.filesListView.selectedIndex === -1 || workflowFilesView.filesListView.selectedIndex >= workflowFilesView.collection.length) {
              workflowFilesView.filesListView.getElementByIndex(nodesToBeAdded.length) && workflowFilesView.filesListView.getElementByIndex(nodesToBeAdded.length).prop("tabindex", "-1");
              workflowFilesView.filesListView.selectedIndex = 0;
            }
            workflowFilesView.updateCountAttribute(workflowFilesView.collection.totalCount);
            workflowFilesView.additionalPanelsView.trigger("d2:launch:workflow:attachment:toolbar:update");
          }
          if (workflowFilesView.showAtLeastOneDocument) {
            workflowFilesView.additionalPanelsView.options.node.workingFiles = workflowFilesView.collection.models;
            workflowFilesView.additionalPanelsView.options.wizard.refreshHeader();
          } else {
            workflowFilesView.additionalPanelsView.options.node.supportingFiles = workflowFilesView.collection.models;
          }
          workflowFilesView.unblockActions();
          workflowFilesView._updateToolbar();
          deferred.resolve();
        });
      }
      dialog.show().done(function(validDocuments) {
        addDocuments(validDocuments);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    displayContentAssist: function(status, nodeModel, actionView, title, includeBrowse, includeFavorites, includeRelatedFiles, globalSearch, subTypeFilters, container) {
      var deferred = $.Deferred();
      require([ "d2/dialogs/target.browse/target.browse" ], function(NodePicker) {
        var pickerOptions = {
          dialogTitle: title,
          connector: nodeModel.connector,
          container: container,
          initialContainer: container,
          context: status.context,
          selectMultiple: true,
          includeBrowse: includeBrowse,
          globalSearch: globalSearch,
          includeFavorites: includeFavorites,
          includeRelatedFiles: includeRelatedFiles,
          nodeModel: nodeModel
        };
        pickerOptions.storeContainer = true;
        pickerOptions.restoreContainer = true;
        pickerOptions.dataId = constants.StorageKey.LAUNCH_WORKFLOW_ATTACHMENTS_VIEW_MIXIN + constants.StorageKey.ANCESTOR_INFO;
        if (!pickerOptions.dialogTitle || pickerOptions.dialogTitle.length === 0) {
          pickerOptions.dialogTitle = lang.contentAssistDialogTitle;
        }
        pickerOptions.startLocations = [];
        if (pickerOptions.includeBrowse) {
          pickerOptions.startLocations.push("current.location");
        }
        if (pickerOptions.includeFavorites) {
          pickerOptions.startLocations.push("favorites");
        }
        if (pickerOptions.includeRelatedFiles) {
          pickerOptions.startLocations.push("related.files");
        }
        if (subTypeFilters) {
          pickerOptions.subTypeFilters = subTypeFilters;
        }
        var nodePicker = new NodePicker(pickerOptions);
        actionView.unblockActions();
        nodePicker.show().done(function(selectedNodes) {
          deferred.resolve(selectedNodes.nodes);
        }).fail(function() {
          deferred.reject("close");
        });
      }, deferred.reject);
      return deferred.promise();
    }
  };
  var EmptyListView = Marionette.ItemView.extend({
    className: "launch-workflow-empty-attachments-list",
    template: emptyListTemplate,
    constructor: function EmptyListView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    ui: {
      emptyAddFile: ".launch-workflow-empty-add-attachments"
    },
    events: {
      "click @ui.emptyAddFile": "onEmptyAddFileClick",
      "keydown @ui.emptyAddFile": "onEmptyAddFileKeyPress"
    },
    templateHelpers: function() {
      return {
        emptyAttachmentsMessage: lang.emptyAttachmentsMessage,
        addFileToolTip: this.options.originatingView.showAtLeastOneDocument ? lang.addWorkingFilesTooltip : lang.addSupportingFilesTooltip,
        addFileAria: this.options.originatingView.showAtLeastOneDocument ? lang.addWorkingFilesTooltip : lang.addSupportingFilesTooltip
      };
    },
    onEmptyAddFileClick: function(event) {
      this.options.originatingView._onAddAttachmentsClick(event);
    },
    onEmptyAddFileKeyPress: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onEmptyAddFileClick(event);
        break;

       default:
        return;
      }
    },
    onShow: function() {
      this.ui.emptyAddFile.trigger("focus");
      setTimeout(function() {
        this.options.parentView.trigger("ensure:scrollbar");
      }.bind(this));
    }
  });
  var CustomFilesListView = TaskFilesListView.extend({
    childView: CustomFilesListItemView,
    emptyView: EmptyListView,
    emptyViewOptions: function() {
      return {
        parentView: this,
        originatingView: this.originatingView
      };
    },
    onClickItem: function() {}
  });
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        className: function() {
          return "d2-launch-workflow-attachments " + TaskAttachmentsView.prototype.className;
        },
        _setupFilesListView: function() {
          this.filesListView = new CustomFilesListView({
            collection: this.collection,
            additionalPanelsView: this.additionalPanelsView,
            originatingView: this,
            context: this.context,
            toolbarItems: this.toolbarItems,
            toolbarItemsMasks: this.toolbarItemsMasks
          });
          this.listenTo(this.filesListView, "add", this._onAddAttachmentsClick.bind(this));
        },
        _showFilesListView: function() {
          this.collection.setLimit(0, 0, false);
          var me = this, objectIDs = me.collection.pluck("id"), parameters = {
            ids: objectIDs,
            connector: this.additionalPanelsView.options.node.connector,
            relationsCount: true
          };
          me.blockActions();
          serverQueryUtils.fetchDataForObjects(parameters).always(function(result) {
            if (result && result.relationsCount) {
              _.each(me.collection.models, function(model) {
                var id = model.get("id");
                result.relationsCount && result.relationsCount[id] && model.set("relations-count", result.relationsCount[id]["relations_count"], {
                  silent: true
                });
              });
            }
            me.filesListRegion.show(me.filesListView);
            if (me.model.get("name") === "working") {
              var cntworkingfiles = me.collection.filter(function(model) {
                return model.get("name") && model.get("name").length;
              });
              me._updateHeaderTitle(cntworkingfiles.length);
            } else {
              me._updateHeaderTitle(me.collection.length);
            }
            me._updateToolbar();
            me.unblockActions();
          });
        },
        _checkManageAttachment: function() {
          this.manageAttachmentEnabled = true;
        },
        _setupToolbarView: function() {
          var buttonsConfig = {
            left: [ {
              id: "fileLabel",
              className: "d2-launch-workflow-attachments-label",
              label: lang.fileLabel,
              showLabel: true
            } ],
            right: []
          };
          var right = {
            id: "addAttachment",
            className: "icon icon-launch-workflow-add-attachments",
            tooltip: this.addButtonTooltip,
            clickHandler: this._onAddAttachmentsClick.bind(this)
          };
          buttonsConfig.right.push(right);
          this.toolbarView = new ButtonToolbarView(buttonsConfig);
        },
        _updateToolbar: function() {
          TaskAttachmentsView.prototype._updateToolbar.apply(this, arguments);
          if (this.model.get("name") === "working") {
            if (this.node.get("multipackage")) {
              this.toolbarRegion.$el.addClass("binf-hidden");
              return;
            }
          }
          if (!this.collection.length) {
            this.toolbarRegion.$el.addClass("binf-hidden");
          } else {
            this.toolbarRegion.$el.removeClass("binf-hidden");
          }
        },
        _onAddAttachmentsClick: function(e, data) {
          e.stopPropagation();
          e.preventDefault();
          this.blockActions();
          var isMultiPackage = this.node.get("multipackage");
          var pckType;
          if (data && data.packageType) {
            pckType = data.packageType;
          } else if (!isMultiPackage) {
            var pcks = this.node.get("wf_packages");
            if (pcks && pcks[0]) {
              pckType = pcks[0]["type"];
            }
          } else {
            pckType = "dm_document";
          }
          this._fetchContentAssistOptions({
            context: this.context
          }, pckType).then(function(nodes) {
            return attachment.add(nodes, this, data);
          }.bind(this)).catch(function(xhr, message, statusText) {
            if (xhr !== "close") {
              this.unblockActions();
              var errorMessage = xhr && xhr.responseText ? utils.parseAjaxErrorAsString(xhr, statusText, message) : typeof xhr === "string" ? xhr : "";
              GlobalMessage.showMessage("error", errorMessage);
            }
          }.bind(this));
          setTimeout(_.bind(function() {
            this.trigger("highlight", false);
            if (!isMultiPackage) {
              this.collection.fetch({
                reset: false
              });
            }
          }, this), 1e3);
        },
        _fetchContentAssistOptions: function(status, packageType) {
          var deferred = $.Deferred(), container = new NodeModel(undefined, {
            connector: this.node.connector,
            autofetch: true
          }), me = this;
          if (this.additionalPanelsView && this.additionalPanelsView.options && this.additionalPanelsView.options.status && this.additionalPanelsView.options.status.container) {
            var parentContainerType = this.additionalPanelsView.options.status.container.get("type");
            if (parentContainerType === constants.Types.FOLDER || parentContainerType === constants.Types.CABINET) {
              container.set(this.additionalPanelsView.options.status.container.attributes, {
                silent: true
              });
            }
          }
          var pckType = packageType ? packageType : me.node.workflow_start_activity_package_type;
          ContentAssist.getContentAssistOptions(status).done(function(config) {
            var title = config ? config.label_value : "", includeBrowse = config && config.properties ? config.properties.has_browse_assist : true, includeFavorites = config && config.properties ? config.properties.has_favorites_assist : false, globalSearch = config && config.properties ? config.properties.has_search_assist : false, subTypeFilters = me.ignoreSubTypeFilters !== true && [ pckType ];
            attachment.displayContentAssist(status, me.node, me, title, includeBrowse, includeFavorites, false, globalSearch, subTypeFilters, container).done(deferred.resolve).fail(deferred.reject);
          }).fail(deferred.reject);
          return deferred.promise();
        }
      });
    }
  };
});