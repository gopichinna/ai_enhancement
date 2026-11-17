/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "dctmw/utils/rest.resources", "nuc/utils/namedlocalstorage", "csui/models/command", "csui/utils/commandhelper", "d2/utils/node.utils", "dctmw/utils/authenticators/session", "csui/dialogs/modal.alert/modal.alert", "csui/utils/node.links/node.links", "d2/dialogs/document.preview/document.preview.plugins", "d2/commands/open.plugins/impl/iviewer.preview.plugin", "i18n!d2/commands/nls/localized.strings", "css!d2/commands/aviator/impl/launch.aviator.chat" ], function(module, require, $, _, Backbone, RestResources, NamedLocalStorage, CommandModel, CommandHelper, nodeUtils, Session, ModalAlert, nodeLinks, docPreviewPlugins, IViewerPreviewPlugin, lang) {
  "use strict";
  const AVIATOR_CHAT_VIEWER_COMBINE_WIDTH = 1280;
  const namedLocalStorage = new NamedLocalStorage(module.id);
  let viewerClosed = false;
  const LaunchAviatorChatCommand = CommandModel.extend({
    defaults: {
      signature: "Aviator-LaunchChat",
      command_key: "Aviator-LaunchChat",
      name: lang.CommandLaunchAviatorChat,
      scope: "multiple"
    },
    enabled: function(status, options) {
      let enabled = false;
      if (status) {
        if (status.nodes && status.nodes.length > 0) {
          enabled = CommandModel.prototype.enabled.call(this, status, options);
          if (enabled) {
            enabled = this.validateContentTypeOfAllNodes(status.nodes);
          }
        } else if (status.container) {
          enabled = CommandModel.prototype.enabled.call(this, {
            toolItem: status.toolItem,
            nodes: new Backbone.Collection([ status.container ])
          });
        }
      }
      return enabled;
    },
    validateContentTypeOfAllNodes: function(nodeCollection) {
      var valid = false;
      if (nodeCollection.length > 0) {
        valid = !_.some(nodeCollection.models, function(node) {
          return !node.get("a_content_type");
        });
      }
      return valid;
    },
    execute: function(status, options) {
      let dfd = $.Deferred(), context = status.context ?? options?.context;
      status.suppressSuccessMessage = true;
      status.suppressFailMessage = true;
      this.resolveNodesForChat(status, options).done(nodes => {
        this.openAviatorChatDialog(context, nodes).done(dfd.resolve).fail(dfd.reject);
      }).fail(dfd.reject);
      return dfd.promise();
    },
    resolveNodesForChat: function(status) {
      let nodes = CommandHelper.getAtLeastOneNode(status);
      if (nodes && nodes.length > 0) {
        nodes = nodes.models;
      } else if (status.container) {
        nodes = [ status.container ];
      }
      return $.Deferred().resolve(nodes).promise();
    },
    openAviatorChatDialog: function(context, nodes) {
      let dfd = $.Deferred();
      require([ "aie/controls/chat.panel/chat.panel.view", "css!aie/commands/aviator/impl/aviator" ], ChatPanelView => {
        let viewableNodes = this.getViewableNodes(nodes), chatPanel = new ChatPanelView({
          context: context,
          viewableNodes: viewableNodes,
          nodes: nodes,
          referenceActions: true
        }).on("click:action", args => {
          if (args.action == "open") {
            this.openOverviewPage(args.node);
          }
        }).on("click:reference", ({
          nodes,
          event
        }) => {
          if (event.currentTarget && event.currentTarget.className === "aie-chat-reference") {
            this.openReferenceDocument(chatPanel, context, nodes[0]);
          } else {
            this.openStartingDocuments(chatPanel, context, nodes);
          }
          event.preventDefault();
          event.stopPropagation();
        });
        this.enableViewerIfApplicable(chatPanel, viewableNodes, context).done(dfd.resolve.bind(dfd, chatPanel));
        chatPanel.listenTo(Session.get(), "end", chatPanel.hide);
        chatPanel.show();
      });
      return dfd.promise();
    },
    enableViewerIfApplicable: function(chatPanel, viewableNodes, context) {
      let dfd = $.Deferred();
      this.viewerView = null;
      if (viewableNodes && viewableNodes.length > 0 && window.innerWidth >= AVIATOR_CHAT_VIEWER_COMBINE_WIDTH) {
        chatPanel.once("after:show", () => {
          if (this.isDisclaimerNotAgain()) {
            this.showViewerInAviatorPanel.call(this, chatPanel, viewableNodes, context, null).done(dfd.resolve);
          }
          chatPanel.options.content.once("accept:disclaimer", () => {
            this.showViewerInAviatorPanel.call(this, chatPanel, viewableNodes, context, null).done(dfd.resolve);
          });
        });
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    showViewerInAviatorPanel: function(chatPanel, viewableNodes, context, searchTerm) {
      let dfd = $.Deferred();
      let previewNodes, node = viewableNodes[0];
      let oneViewNode = this.getAtleastOneNodeSupportedByViewer(viewableNodes);
      if (viewableNodes.length > 1 && oneViewNode) {
        node = oneViewNode;
      }
      if (viewableNodes.length > 1) {
        previewNodes = new Backbone.Collection(viewableNodes.map(function(node) {
          return node.clone();
        }));
        if (this.isPreviewLimitReached(previewNodes)) {
          viewerClosed = true;
          const msg = _.str.sformat(lang.LimitExceedMultiFileView, RestResources.getD2Options().max_files_allowed_for_multifile_view_iv);
          ModalAlert.showError(msg).always(function() {
            dfd.resolve();
          });
          return dfd.promise();
        }
      }
      require([ "d2/widgets/miniviewer/miniviewer.view" ], ViewerView => {
        let $viewerEl = $("<div>", {
          class: "aie-viewer d2-aie-viewer"
        });
        this.viewerNode = node.clone();
        $viewerEl.insertBefore(chatPanel.$el.find(".csui-sidepanel-container"));
        this.viewerNode.fetched = true;
        this.viewerView = new ViewerView(_.defaults({
          el: $viewerEl[0],
          model: this.viewerNode,
          previewNodes: previewNodes,
          context: context,
          isAnnotationDisable: true,
          searchTerm: searchTerm
        }));
        this.viewerView.render();
        viewerClosed = false;
        this.viewerView.model.trigger("sync");
        this.viewerView.once("destroy", () => {
          $viewerEl.remove();
        });
        this.viewerView.once("viewer:close", () => {
          this.closeViewer();
        });
        chatPanel.once("before:hide", this.viewerView.destroy);
        dfd.resolve();
      });
      return dfd.promise();
    },
    closeViewer: function() {
      viewerClosed = true;
      this.viewerView.destroy();
    },
    openStartingDocuments: function(chatPanel, context, nodes) {
      if (viewerClosed || !this.viewerView) {
        this.showViewerInAviatorPanel(chatPanel, nodes, context, null);
      } else {
        const previewNodes = new Backbone.Collection(nodes);
        this.viewerView.trigger("update:viewer:searchTerm", "");
        this.viewerView.trigger("update:viewer:node", nodes[0], previewNodes);
      }
    },
    openReferenceDocument: function(chatPanel, context, node) {
      const chunks = node.get("chunks") ?? [];
      const chunk = Array.isArray(chunks) ? chunks[0] : chunks;
      if (viewerClosed || !this.viewerView) {
        this.showViewerInAviatorPanel(chatPanel, [ node ], context, chunk);
      } else {
        this.viewerView.trigger("update:viewer:searchTerm", chunk);
        this.viewerView.trigger("update:viewer:node", node, null);
      }
    },
    openOverviewPage: function(node) {
      var nodeUrl = nodeLinks.getUrl(node);
      var link = document.createElement("a");
      link.target = "_blank";
      link.href = nodeUrl;
      link.click();
    },
    getViewableNodes: function(nodes) {
      return nodes.filter(node => nodeUtils._showViewer(node));
    },
    isDisclaimerNotAgain: function() {
      let disclaimerSetting = namedLocalStorage.storage.disclaimer_settings;
      if (disclaimerSetting) {
        const disclaimerSettingsJson = JSON.parse(namedLocalStorage.storage.disclaimer_settings);
        return !!disclaimerSettingsJson?.notAgain;
      }
      return false;
    },
    getAtleastOneNodeSupportedByViewer: function(nodes) {
      var viewableNode;
      for (var i = 0; i < nodes.length; i++) {
        var previewPluginAvailable = docPreviewPlugins.findByNode(nodes[i]);
        if (previewPluginAvailable && previewPluginAvailable instanceof IViewerPreviewPlugin) {
          viewableNode = nodes[i];
          break;
        }
      }
      return viewableNode;
    },
    isPreviewLimitReached: function(nodes) {
      if (nodes && nodes.length > RestResources.getD2Options().max_files_allowed_for_multifile_view_iv) {
        return true;
      }
      return false;
    }
  });
  return LaunchAviatorChatCommand;
});