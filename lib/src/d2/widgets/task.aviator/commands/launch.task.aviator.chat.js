/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/models/command", "csui/utils/commandhelper", "d2/utils/node.utils", "d2/models/workflow/task.working.files", "dctmw/utils/authenticators/session", "d2/widgets/task.aviator/chat.panel.view", "i18n!d2/widgets/task.aviator/nls/lang", "css!d2/widgets/task.aviator/impl/launch.task.aviator.chat" ], function(require, $, _, Backbone, CommandModel, CommandHelper, nodeUtils, TaskWorkingFileCollection, Session, ChatPanelView, lang) {
  "use strict";
  const LaunchAviatorChatCommand = CommandModel.extend({
    defaults: {
      signature: "TaskAviator-LaunchChat",
      command_key: "TaskAviator-LaunchChat",
      name: lang.CommandLaunchAviatorChat,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status, options) {
      let dfd = $.Deferred(), node = CommandHelper.getJustOneNode(status);
      if (!node && status.container) {
        node = status.container;
      }
      options = options || {};
      options.node = node;
      options.context = status.context;
      status.suppressSuccessMessage = true;
      status.suppressFailMessage = true;
      var me = this;
      const filteredWorkingFileModels = status.workingFilesData?.allModels?.filter(model => {
        const aspects = model.get("r_aspect_name");
        return Array.isArray(aspects) && aspects.includes("dcis_document_aspect");
      }) ?? [];
      if (filteredWorkingFileModels.length == 1) {
        options.node = filteredWorkingFileModels[0];
      } else {
        options.nodes = filteredWorkingFileModels;
      }
      options.qsdata = status.qsData;
      me.openAviatorChatDialog(options).done(dfd.resolve);
      return dfd.promise();
    },
    fetchWorkingFiles: function(options) {
      var deferred = $.Deferred();
      var workingFileCollection = new TaskWorkingFileCollection(undefined, {
        node: options.node
      });
      workingFileCollection.fetch({}).done(function() {
        deferred.resolve(workingFileCollection);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    openAviatorChatDialog: function(options) {
      let dfd = $.Deferred();
      let chatPanel = new ChatPanelView(options);
      chatPanel.listenTo(Session.get(), "end", chatPanel.hide);
      chatPanel.show();
      return dfd.resolve().promise();
    }
  });
  return LaunchAviatorChatCommand;
});