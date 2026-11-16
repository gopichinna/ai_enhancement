/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/marionette", "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/commandhelper", "csui/utils/commands/node", "csui/utils/command.error", "nuc/utils/url", "d2/server.adaptors/models/esoc/comments.utils", "d2/utils/constants", "dctmw/server.adaptors/converters/node", "i18n!d2/commands/nls/localized.strings" ], function(require, Marionette, $, _, CommandHelper, NodeCommand, CommandError, Url, CommentsUtils, constants, nodeConverter, lang) {
  "use strict";
  var CommentCommand = NodeCommand.extend({
    constructor: function CommentCommand() {
      NodeCommand.prototype.constructor.call(this, arguments);
      var self = this;
      require([ "esoc/widgets/utils/command/comment/comment.toolitem.view" ], function(CommentToolItemView) {
        self.customView = CommentToolItemView;
      });
    },
    defaults: {
      signature: "Comment",
      command_key: [ "comment", "Comment" ],
      scope: "single",
      name: lang.name,
      verb: lang.verb,
      doneVerb: lang.doneVerb
    },
    enabled: function(status) {
      if (!CommentsUtils.isCommentingEnabled()) {
        return false;
      }
      var nodeModel;
      if (status && status.data) {
        nodeModel = status.data.useContainer ? status.container : CommandHelper.getJustOneNode(status);
        if (nodeModel) {
          if (status.toolItem) {
            status.toolItem.set({
              commandData: _.defaults({
                wnd_comments: nodeModel.get("wnd_comments"),
                id: nodeModel.get("id"),
                currentNodeModel: nodeModel,
                customView: this.customView
              }, status.toolItem.get("commandData"))
            });
          }
        }
      } else {
        nodeModel = CommandHelper.getJustOneNode(status);
      }
      return nodeModel && !nodeConverter.isNonDCTMNode(nodeModel) && !!nodeModel.actions.get("comment");
    },
    execute: function(status) {
      var nodeModel = status.data && status.data.useContainer ? status.container : CommandHelper.getJustOneNode(status), deferred = $.Deferred();
      require([ "esoc/widgets/socialactions/commentscollectionwidget", "esoc/widgets/common/util" ], function(CommentsCollectionWidget) {
        var config = typeof window.require !== "undefined" ? window.require.s.contexts._.config : window.csui.require.s.contexts._.config, commentConfig = _.extend(config, {
          tablecellwidget: true,
          currentNodeModel: nodeModel,
          nodeID: nodeModel.get("id"),
          CSID: nodeModel.get("id"),
          context: status.context,
          baseElement: status.toolItemView.$el,
          connector: nodeModel.connector,
          currentTarget: document.activeElement
        }), responseData;
        responseData = {
          attachementsEnabled: true,
          commentingOpen: true,
          commentsEnabled: true,
          CSID: nodeModel.get("id"),
          likesEnabled: false,
          pulseEnabled: true,
          shortcutsEnabled: true,
          taggingEnabled: false,
          threadingEnabled: true
        };
        nodeModel.attributes.socialactions = responseData;
        commentConfig.socialActions = responseData;
        commentConfig.baseElement.dataset = {
          value: nodeModel.get("id")
        };
        var commentsCollectionWidget = new CommentsCollectionWidget(commentConfig);
        commentsCollectionWidget.show();
        deferred.resolve();
      }, function(error) {
        deferred.reject(new CommandError(error));
      });
    }
  });
  return CommentCommand;
});