/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/models/command", "csui/utils/commandhelper", "d2/utils/node.utils", "dctmw/utils/authenticators/session", "i18n!d2/commands/nls/localized.strings", "css!d2/commands/aviator/impl/launch.aviator.chat" ], function(require, $, _, Backbone, CommandModel, CommandHelper, nodeUtils, Session, lang) {
  "use strict";
  const AVIATOR_CHAT_VIEWER_COMBINE_WIDTH = 1280;
  const LaunchAviatorChatCommand = CommandModel.extend({
    defaults: {
      signature: "Aviator-LaunchChat",
      command_key: "Aviator-LaunchChat",
      name: lang.CommandLaunchAviatorChat,
      scope: "single"
    },
    enabled: function(status, options) {
      let enabled = false;
      if (status) {
        if (status.nodes && status.nodes.length > 0) {
          enabled = CommandModel.prototype.enabled.call(this, status, options);
        } else if (status.container) {
          enabled = CommandModel.prototype.enabled.call(this, {
            toolItem: status.toolItem,
            nodes: new Backbone.Collection([ status.container ])
          });
        }
      }
      return enabled;
    },
    execute: function(status, options) {
      let dfd = $.Deferred(), context = status.context ?? options?.context, node = CommandHelper.getJustOneNode(status);
      if (!node && status.container) {
        node = status.container;
      }
      status.suppressSuccessMessage = true;
      status.suppressFailMessage = true;
      this.openAviatorChatDialog(context, node).done(dfd.resolve);
      return dfd.promise();
    },
    openAviatorChatDialog: function(context, node) {
      let dfd = $.Deferred();
      require([ "aie/controls/chat.panel/chat.panel.view", "css!aie/commands/aviator/impl/aviator" ], ChatPanelView => {
        let chatPanel = new ChatPanelView({
          context: context,
          node: node
        });
        this.enableViewerIfApplicable(chatPanel, node, context).done(dfd.resolve.bind(dfd, chatPanel));
        chatPanel.listenTo(Session.get(), "end", chatPanel.hide);
        chatPanel.show();
      });
      return dfd.promise();
    },
    enableViewerIfApplicable: function(chatPanel, node, context) {
      let dfd = $.Deferred();
      if (nodeUtils._showViewer(node)) {
        chatPanel.once("after:show", () => {
          if (window.innerWidth >= AVIATOR_CHAT_VIEWER_COMBINE_WIDTH) {
            this.showViewerInAviatorPanel.call(this, chatPanel, node, context).done(dfd.resolve);
          } else {
            dfd.resolve();
          }
        });
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    showViewerInAviatorPanel: function(chatPanel, node, context) {
      let dfd = $.Deferred();
      require([ "d2/widgets/miniviewer/miniviewer.view" ], ViewerView => {
        let $viewerEl = $("<div>", {
          class: "aie-viewer d2-aie-viewer"
        }), viewerNode = node.clone();
        $viewerEl.insertBefore(chatPanel.$el.find(".csui-sidepanel-container"));
        viewerNode.fetched = true;
        let viewerView = new ViewerView(_.defaults({
          el: $viewerEl[0],
          model: viewerNode,
          context: context,
          isAnnotationDisable: true
        }));
        viewerView.render();
        viewerView.model.trigger("sync");
        viewerView.once("destroy", () => {
          $viewerEl.remove();
        });
        viewerView.once("viewer:close", viewerView.destroy);
        chatPanel.once("before:hide", viewerView.destroy);
        dfd.resolve();
      });
      return dfd.promise();
    }
  });
  return LaunchAviatorChatCommand;
});