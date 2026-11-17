/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabables.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.attachments.panel.view", "d2/models/workflow/task.files", "nuc/models/node/node.model", "hbs!d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.attachments", "css!d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.attachments" ], function(_, Marionette, TabablesBehavior, WizardTabableRegionBehavior, LaunchWorkflowAttachmentsPanelView, TaskFileCollection, NodeModel, template) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-launch-workflow-attachments-dialog",
    template: template,
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    regions: {
      attachmentsContainer: ".d2-launch-workflow-attachments-container"
    },
    constructor: function LaunchWorkflowAttachmentsView(options) {
      options = options || {};
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.currentlyFocusedElement = function(event) {
        var tabElements = this.$(TabablesBehavior.focusablesSelector);
        if (tabElements.length) {
          tabElements.prop("tabindex", 0);
        }
        tabElements = tabElements.filter(":visible:not([disabled])");
        this.attachmentsPanelView.trigger("reset:tabindex");
        if (!!event && event.shiftKey) {
          tabElements = tabElements.filter('[tabindex="0"]');
          return tabElements[tabElements.length - 1];
        } else {
          return tabElements[0];
        }
      };
      this._setupChildView();
    },
    _refreshFooter() {
      this.options.wizard.footerView.triggerMethod("dom:refresh");
    },
    validateView: function() {
      var isValid = true;
      var pcksNodesCollection = this.options.workingFileCollection;
      if (this.options.node.get("multipackage")) {
        pcksNodesCollection.each(function(model) {
          if (!model.get("name") && model.get("package")["is_mandatory"]) {
            isValid = false;
          }
        });
        return isValid;
      } else {
        var files = pcksNodesCollection.filter(function(model) {
          return !model.get("pcknode");
        });
        isValid = files && files.length;
      }
      return isValid;
    },
    _createTaskCollection: function(isWorkingFile) {
      var collection = new TaskFileCollection(undefined, {
        node: this.options.node,
        fetchRelationsCount: true
      });
      var wf = this.options.node.workingFiles;
      var isMultiPackage = this.options.node.get("multipackage");
      if (isWorkingFile && this.options.node) {
        var nodes = [];
        var wfpackages = this.options.status.node.get("wf_packages");
        var validDocuments = this.options.node.get("valid_documents");
        var connector = this.options.status.node.connector;
        if (isMultiPackage) {
          var primaryPcks = wfpackages.filter(function(pck) {
            return pck.is_primary === true;
          });
          if (primaryPcks && primaryPcks[0]) {
            let node = new NodeModel({
              connector: connector
            });
            node.set("multipackage", isMultiPackage);
            primaryPcks[0].is_mandatory = true;
            node.set("package", primaryPcks[0]);
            if (validDocuments && validDocuments.length) {
              node.set(validDocuments[0].toJSON());
            }
            nodes.push(node);
          }
          for (var j = 0; j < wfpackages.length; j++) {
            if (!wfpackages[j].is_primary) {
              let node = new NodeModel({
                connector: connector
              });
              node.set("package", wfpackages[j]);
              node.set("multipackage", isMultiPackage);
              nodes.push(node);
            }
          }
        } else {
          nodes = nodes.concat(wf);
        }
        collection.add(nodes);
      } else {
        isWorkingFile && collection.add(this.options.node.workingFiles);
      }
      collection.lastFilteredAndSortedModels = collection.models;
      collection._lastFilterAndSortCriteria = {
        orderBy: collection.orderBy,
        filters: _.clone(collection.filters)
      };
      collection.fetched = true;
      if (!isMultiPackage) {
        collection.fetch({
          reset: false
        });
      }
      return collection;
    },
    _setupChildView: function() {
      var options = _.extend(this.options, {
        originatingView: this,
        workingFileCollection: this._createTaskCollection(true),
        supportingFileCollection: this._createTaskCollection()
      });
      this.listenTo(this, "refresh:footer", _.bind(this._refreshFooter, this));
      this.attachmentsPanelView = new LaunchWorkflowAttachmentsPanelView(options);
    },
    onShow: function() {
      this.attachmentsContainer.show(this.attachmentsPanelView);
      _.each(this.attachmentsPanelView.tabContent.children._views, function(tabContent) {
        tabContent.content && tabContent.content.trigger("highlight");
        tabContent.content && tabContent.content.collection.fetch({
          reset: false
        });
      });
    },
    isValid: function() {
      return this.validateView() && this.options.node.workingFiles && this.options.node.workingFiles.length;
    },
    updateModelData: function() {
      var isMultiPackage = this.options.node.get("multipackage");
      var singlePck = this.options.node.get("wf_packages")[0];
      var packages = [];
      if (isMultiPackage) {
        this.options.workingFileCollection.map(function(workingFile) {
          var id = workingFile.get("id");
          var pck = isMultiPackage ? workingFile.get("package") : singlePck;
          if (pck && id) {
            var pckName = pck.name;
            var documentids = [ id ];
            var pckObj = {
              name: pckName,
              "component-ids": documentids
            };
            packages.push(pckObj);
          }
        });
      } else {
        var documentids = this.options.workingFileCollection.map(function(workingFile) {
          return workingFile.get("id");
        });
        documentids = documentids.filter(function(id) {
          return id != null;
        });
        var pckObj = {
          name: singlePck.name,
          "component-ids": documentids
        };
        packages.push(pckObj);
      }
      this.options.node.set("wf_packages", packages);
      this.options.node.supportingFiles && this.options.node.supportingFiles.length && this.options.node.set("supporting_document_ids", _.map(this.options.node.supportingFiles, function(supportingFile) {
        return supportingFile.get("id");
      }));
    }
  });
});