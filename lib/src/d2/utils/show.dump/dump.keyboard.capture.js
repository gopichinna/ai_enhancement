/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/backbone", "d2/commands/dump", "nuc/models/nodes" ], function($, Backbone, DumpCommand, NodeCollection) {
  "use strict";
  var DumpKeyboardCapture = {
    wizardOpenedCount: 0,
    init: function(context) {
      var widgetView, panelWidget;
      context.on("d2.close:widget", function(options) {
        if (options.widgetView === widgetView) {
          widgetView = undefined;
        }
      }, this);
      context.on("d2.open:widget", function(options) {
        widgetView = options.widgetView;
      }, this);
      context.on("d2.close:panel", function(options) {
        if (options.widgetView === panelWidget) {
          panelWidget = undefined;
        }
      }, this);
      context.on("d2.open:panel", function(options) {
        panelWidget = options.widgetView;
      }, this);
      this.getStepperWizardEventChannel().vent.on("wizard:shown", this.increaseWizardOpenedCount, this);
      this.getStepperWizardEventChannel().vent.on("wizard:restored", this.increaseWizardOpenedCount, this);
      this.getStepperWizardEventChannel().vent.on("wizard:minimize", this.decreaseWizardOpenedCount, this);
      this.getStepperWizardEventChannel().vent.on("wizard:closed", this.decreaseWizardOpenedCount, this);
      var me = this;
      $("body").on("keyup", function(event) {
        if (event.keyCode === 68 && event.altKey && event.ctrlKey) {
          event.stopPropagation();
          event.preventDefault();
          if (me.wizardOpenedCount > 0) {
            return;
          }
          var viewStateModel = context.viewStateModel;
          var routerInstace = viewStateModel.get("activeRouterInstance"), node = widgetView && widgetView.getD2SelectedNodes && widgetView.getD2SelectedNodes(), selectedNode;
          if (viewStateModel.get("currentRouter") === "D2Root") {
            node = undefined;
          } else if (viewStateModel.get("currentRouter") === "Landing") {
            node = undefined;
          } else if (viewStateModel.get("currentRouter") === "Node") {
            if ((!node || node.length === 0) && routerInstace) {
              node = [ routerInstace.nextNode ];
            }
          } else if (viewStateModel.get("currentRouter") === "Metadata") {
            var metadataInfo = routerInstace.metadataModel && routerInstace.metadataModel.get("metadata_info");
            if (viewStateModel.get("state").dropdown !== "properties" && panelWidget) {
              node = panelWidget.getD2SelectedNodes && panelWidget.getD2SelectedNodes();
              if (!node || node.length === 0) {
                node = [ metadataInfo.model ];
              }
            } else {
              node = [ metadataInfo.model ];
            }
          } else if (viewStateModel.get("currentRouter") === "TaskPerspectivesRouter") {
            if (viewStateModel.get("currentRouterScopeId") === "taskdocuments") {
              selectedNode = viewStateModel.get("d2selectedNode");
              if (viewStateModel.get("state").dropdown !== "properties" && panelWidget) {
                node = panelWidget.getD2SelectedNodes && panelWidget.getD2SelectedNodes();
                if (!node || node.length === 0) {
                  node = [ selectedNode ];
                }
              } else {
                node = [ selectedNode ];
              }
            }
            if (!node && routerInstace) {
              node = [ routerInstace.nextTask.get("task_info").model ];
            }
          } else if (viewStateModel.get("currentRouter") === "VirtualDocumentExplorer") {
            selectedNode = viewStateModel.get("d2selectedNode");
            if (viewStateModel.get("state").dropdown !== "properties" && panelWidget) {
              node = panelWidget.getD2SelectedNodes && panelWidget.getD2SelectedNodes();
              if (!node || node.length === 0) {
                node = [ selectedNode ];
              }
            } else {
              node = [ selectedNode ];
            }
          } else if (viewStateModel.get("currentRouterScopeId") === "search") {
            selectedNode = viewStateModel.get("d2selectedNode");
            if (viewStateModel.get("properties") === true) {
              node = [ selectedNode ];
            } else if (viewStateModel.get("properties") === false && panelWidget) {
              node = panelWidget.getD2SelectedNodes && panelWidget.getD2SelectedNodes();
              if (!node || node.length === 0) {
                node = [ selectedNode ];
              }
            }
          }
          var status = {
            context: context
          };
          var dumpCommand = new DumpCommand();
          if (node && node.length === 1 && node[0]) {
            status.nodes = new NodeCollection(node);
            dumpCommand.execute(status);
          } else if (!node || node.length === 0) {
            dumpCommand.execute(status);
          }
        }
      });
    },
    getStepperWizardEventChannel: function() {
      return Backbone.Wreqr.radio.channel("stepper_wizard");
    },
    increaseWizardOpenedCount: function() {
      this.wizardOpenedCount++;
    },
    decreaseWizardOpenedCount: function() {
      this.wizardOpenedCount--;
    }
  };
  return DumpKeyboardCapture;
});