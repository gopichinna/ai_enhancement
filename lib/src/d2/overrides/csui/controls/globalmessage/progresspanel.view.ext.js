/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/controls/globalmessage/progresspanel.view.ext", "css!d2/overrides/csui/controls/globalmessage/impl/progresspanel" ], function(require, $, _, ProgressPanelView) {
  "use strict";
  var proto = ProgressPanelView.prototype, progressBarProto = proto.childView.prototype, origProgBarInitialize = progressBarProto.initialize, origProgBarEvents = progressBarProto.events, origProgBarUpdateItem = progressBarProto._updateItem, origShowProgressBar = proto.showProgressBar, origAutoHideSuccessBanner = proto.autoHideSuccessBanner, origUpdateHeader = proto._updateHeader;
  _.extend(progressBarProto, {
    initialize: function() {
      origProgBarInitialize.apply(this, arguments);
      if (this.model.node) {
        this.listenTo(this.model.node, "sync", this._updateItem);
      }
      this.listenTo(this, "render", this._handleDoneCommand);
    },
    events: _.extend(origProgBarEvents, {
      "click .d2-done-command-link": "_executeDoneCommand"
    }),
    _handleDoneCommand: function() {
      var doneCmd = this.model.get("doneCommand") || {};
      if (doneCmd.signature) {
        var linkEl = $('<a class="d2-done-command-link" data-command-signature="' + doneCmd.signature + '" title="' + (doneCmd.tooltip || doneCmd.label) + '">' + doneCmd.label + "</a>");
        this.$el.find(".csui-name").append(linkEl);
        if (this.model.node && this.model.node._hasOverview) {
          linkEl.addClass("link-active");
        }
      }
    },
    _updateItem: function() {
      origProgBarUpdateItem.apply(this, arguments);
      var info = this.computeProgress(), elem = this.$el, node = this.model.node;
      if (info.state === "processing") {
        elem.find(".csui-stateaction-processing").addClass("binf-hidden");
      }
      if (info.state === "resolved") {
        var commandLink = elem.find(".d2-done-command-link"), container = this.model.get("commandContainer"), nodeParents = node && node.get("i_folder_id") || [];
        if (this.model.get("doneCommand") === undefined) {
          delete node._hasOverview;
          commandLink.removeClass("link-active");
        } else {
          if (container && _.contains(nodeParents, container.get("id"))) {
            delete node._hasOverview;
            commandLink.removeClass("link-active");
          } else {
            if (this.model.reEvaluateDoneLink) {
              let doneCmd = this.model.get("doneCommand") || {};
              commandLink.attr("title", doneCmd.tooltip || doneCmd.label);
              commandLink.html(doneCmd.label);
            }
            node._hasOverview = true;
            commandLink.addClass("link-active");
          }
        }
      }
    },
    _executeDoneCommand: function(event) {
      event.preventDefault();
      event.stopPropagation();
      require([ "csui/utils/commands", "nuc/models/nodes", "csui/controls/globalmessage/globalmessage" ], function(commands, NodeCollection, GlobalMessage) {
        var doneCmdSignature = (this.model.get("doneCommand") || {}).signature, command = commands.get(doneCmdSignature);
        if (command) {
          var node = this.model.node;
          var status = {
            nodes: new NodeCollection([ node ]),
            context: node.context || this.model.get("context"),
            originatingView: this.model.get("originatingView")
          };
          command.execute(status).done(GlobalMessage._cleanupPreviousMessageRegion);
        }
      }.bind(this));
    }
  });
  _.extend(proto, {
    showProgressBar: function() {
      var showProgressBar = true;
      if (this.options.hideProgressBar === true) {
        showProgressBar = false;
      }
      return origShowProgressBar.call(this, showProgressBar);
    },
    _updateHeader: function() {
      this.collection.some(function(model) {
        if (model.get("state") === "processing") {
          return true;
        }
        if (model.get("state") === "pending") {
          model.set("state", "processing");
          return true;
        }
      });
      origUpdateHeader.apply(this, arguments);
      var hasPending = this.collection.any(function(item) {
        return item.get("state") === "pending";
      });
      if (!hasPending) {
        this.ui.header.find(".csui-stateaction-processing").addClass("binf-hidden");
      }
    },
    autoHideSuccessBanner: function() {
      var hasLinks = _.find(this.collection.models, function(model) {
        return !!model.node._hasOverview;
      });
      if (!hasLinks) {
        origAutoHideSuccessBanner.apply(this, arguments);
      }
    },
    doCancel: function() {
      this.collection.forEach(function(item) {
        if (item.get("state") === "pending") {
          item.abort();
        }
      });
      this.ui.processingAction.addClass("binf-hidden");
    }
  });
});