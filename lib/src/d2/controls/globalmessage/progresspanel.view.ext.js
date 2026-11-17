/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/form/pub.sub", "smart/controls/progresspanel/progresspanel.view.ext", "d2/utils/concurrency.manager", "dctmw/utils/utils", "hbs!d2/controls/globalmessage/impl/progresspanel/impl/progresspanel.ext" ], function(_, PubSub, SmartProgressPanelViewExt, ConcurrencyManager, Utils, PanelTemplate) {
  var ProgressPanelViewExt = SmartProgressPanelViewExt.extend({
    constructor: function ProgressPanelViewExt(options) {
      if (options.context && options.nextNodeModelFactory) {
        this._nextNode = options.context.getModel(options.nextNodeModelFactory);
      }
      this.listenTo(this, "navigate:to:location", _.bind(this.onNavigateToLocation, this));
      this.listenTo(this, "abort:progress", _.bind(this.onAbortProgress, this));
      this.listenTo(this, "abort:model:progress", _.bind(this.onAbortModelProgress, this));
      this.addListenerForInprogressObjects(options);
      SmartProgressPanelViewExt.prototype.constructor.call(this, options);
      this.listenTo(this.collection, "change", _.bind(function() {
        if (this.collection.length === 1 && !this.options.disableExpand) {
          if (_.isEmpty(this.collection.at(0).get("errorMessage"))) {
            this.ui.expandIcon.addClass("binf-hidden");
          }
          return;
        }
        if (!this.options.disableExpand) {
          this.ui.expandIcon.removeClass("binf-hidden");
          this.ui.closeAction.removeClass("binf-hidden");
        }
      }, this));
      this.$el.on("globalmessage.shown", this.onGlobalMessageShown.bind(this));
    },
    template: PanelTemplate,
    ui: {
      ...SmartProgressPanelViewExt.prototype.ui,
      targetLocation: ".csui-gotolocation-url"
    },
    events: {
      ...SmartProgressPanelViewExt.prototype.events,
      "click @ui.targetLocation": "onTargetLocationClick"
    },
    addListenerForInprogressObjects: function(options) {
      var finishStates = [ "resolved", "rejected", "aborted", "stopped" ], inProgressNodeIds = options.collection.reduce(function(nodeIds, fileUploadModel) {
        if (fileUploadModel && fileUploadModel.node) {
          nodeIds.push(fileUploadModel.node.get("id"));
        }
        return nodeIds;
      }, []);
      if (inProgressNodeIds.length > 0) {
        ConcurrencyManager.push(inProgressNodeIds);
        this.listenTo(options.collection, "change:state", function(fileUploadModel) {
          if (_.contains(finishStates, fileUploadModel.get("state"))) {
            ConcurrencyManager.pop(fileUploadModel.node.get("id"));
          }
        }.bind(this));
      }
    },
    doShow: function(relatedView, parentView) {
      SmartProgressPanelViewExt.prototype.doShow.call(this, relatedView, parentView);
      this.parentView && this.parentView.$el.find(".csui-minimize").addClass("d2-minimize");
      this.listenTo(this.parentView, "processbar:minimize", this.onMinimizeProgressPanel);
      if (this.parentView && this.parentView.$el.closest(".smart-progresspanel-wrapper").is(":hidden")) {
        setTimeout(() => {
          this.onMinimizeProgressPanel();
        }, 100);
      }
    },
    onTargetLocationClick: function() {
      require([ "csui/utils/commands", "nuc/models/nodes" ], function(commands, NodeCollection) {
        var command = commands.get(this.options["link_command_signature"]);
        if (command) {
          var node = this.collection.at(0).node;
          var status = {
            nodes: new NodeCollection([ node ]),
            context: this.options.context || node.context,
            originatingView: this
          };
          if (Utils.isMobile() && status.context) {
            status.originatingView || (status.originatingView = this);
            status.context.data || (status.context.data = {});
            status.context.data.originatingNodeId = node.get("id");
          }
          command.execute(status, this.options.linkCommandOptions);
          this.doClose();
        }
      }.bind(this));
    },
    handleProgressComplete: function(allFailures) {
      SmartProgressPanelViewExt.prototype.handleProgressComplete.apply(this, arguments);
      if (allFailures) {
        this.ui.gotoLocationElem.addClass("csui-gotolocation-url-hidden");
        return;
      }
      if (this.collection.length === 1) {
        if (this.collection.at(0).reEvaluateDoneLink) {
          let doneCmd = this.collection.at(0).get("doneCommand") || {};
          this.ui.gotoLocationElem.html(doneCmd.label);
          this.options["link_command_signature"] = doneCmd.signature;
        }
        if (this.collection.at(0).get("targetLocation")) {
          this.ui.gotoLocationElem.removeClass("csui-gotolocation-url-hidden");
        } else {
          this.ui.gotoLocationElem.addClass("csui-gotolocation-url-hidden");
        }
      }
    },
    _updateHeader: function() {
      SmartProgressPanelViewExt.prototype._updateHeader.apply(this, arguments);
      var firstModel = this.collection.at(0);
      if (firstModel.get("state") === "resolved") {
        var resolvedToastMessage = firstModel.get("resolvedToastMessage"), isShowSuccessAsWarning = firstModel.get("showSuccessAsWarning");
        if (resolvedToastMessage) {
          this.ui.header.find(".csui-title").text(resolvedToastMessage);
          this.collection.at(0).unset("resolvedToastMessage", {
            silent: true
          });
        }
        if (isShowSuccessAsWarning === true && this.$el.hasClass("csui-global-success")) {
          this.$el.removeClass("csui-global-success").addClass("csui-global-warning");
          this.collection.at(0).unset("showSuccessAsWarning", {
            silent: true
          });
        }
      }
    },
    onMinimizeProgressPanel: function() {
      PubSub.trigger("d2-process-minimized");
    },
    onGlobalMessageShown: function(event, progressPanel) {
      this.options.d2ShowPanelHandler && this.options.d2ShowPanelHandler.trigger("d2:progress:panel:shown", progressPanel);
    },
    onNavigateToLocation: function(childView) {
      var model = childView ? childView.model : this.collection.models[0], node = model.node;
      var targetLocation = model.get("targetLocation");
      if (targetLocation && this._nextNode) {
        if (node) {
          this._gotoLocation(node);
        } else {
          this._nextNode.set("id", targetLocation.id);
        }
      }
    },
    _gotoLocation: function(node) {
      require([ "csui/lib/backbone", "csui/utils/commands", "csui/utils/commandhelper" ], function(Backbone, commands, CommandHelper) {
        var command = commands.get("goToLocation");
        if (!command) {
          throw new Error("Invalid command: goToLocation");
        }
        var status = {
          nodes: new Backbone.Collection([ node ]),
          model: node,
          context: this.options.context,
          originatingView: this
        }, options = {
          context: this.options.context,
          originatingView: this
        };
        CommandHelper.handleExecutionResults(command.execute(status, options));
      }.bind(this));
    },
    onAbortProgress: function() {
      this.collection.abort("stopped");
    },
    onAbortModelProgress: function(childView) {
      childView && childView.model.abort();
    },
    _isNodeInContainer: function(node, container) {
      if (node && container) {
        var parentIds = node.get("i_folder_id") || [];
        return _.contains(parentIds, container.get("id"));
      }
      return true;
    },
    autoHideSuccessBanner: function() {
      var me = this, hasLocationChanged = this.collection.length > 1 && this.collection.find(function(model) {
        var node = model.node || model.get("node"), commandContainer = model.get("commandContainer") || me.options.commandContainer;
        return commandContainer === undefined || !me._isNodeInContainer(node, commandContainer);
      });
      if (hasLocationChanged) {
        this.options.doAutoClose = false;
      } else {
        this.options.disableExpand = true;
      }
      SmartProgressPanelViewExt.prototype.autoHideSuccessBanner.apply(this, arguments);
    },
    d2ProgressPanelClose: function() {
      const panel = _.extend({
        csuiAfterHide: _.bind(function() {
          this.destroy();
          this.parentView.trigger("csui:after:hide", {
            panel: this,
            prevEle: prevEle
          });
          if (this.isProgressFailed()) {
            this.trigger("escaped:focus");
          }
        }, this)
      }, this);
      var prevEle = this.el.previousElementSibling;
      this.options.messageHelper.fadeoutPanel(panel);
      panel.csuiAfterHide();
    }
  });
  return ProgressPanelViewExt;
});