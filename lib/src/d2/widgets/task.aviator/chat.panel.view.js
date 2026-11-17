/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Collection
} from "nuc/lib/backbone";

import ChatController from "d2/widgets/task.aviator/controllers/chat.controller";

import SidePanelView from "smart/controls/side.panel/side.panel.view";

import ChatView from "d2/widgets/task.aviator/chat.view";

import "css!d2/widgets/task.aviator/impl/chat.panel";

import lang from "i18n!d2/widgets/task.aviator/nls/lang";

class ChatPanelView extends SidePanelView {
  constructor(options) {
    var chat = new Collection();
    var chatController = new ChatController({
      context: options.context,
      node: options.node,
      nodes: options.nodes,
      chat: chat,
      qsdata: options.qsdata
    });
    super({
      title: lang.chatPanelTitle,
      sidePanelClassName: "aie-chat-panel task-aviator-panel",
      layout: {
        size: "custom",
        header: false,
        footer: false
      },
      content: new ChatView({
        context: options.context,
        node: options.node,
        nodes: options.nodes,
        viewableNodes: options.viewableNodes,
        referenceActions: options.referenceActions,
        chat: chat,
        chatController: chatController,
        qsdata: options.qsdata
      }),
      focus: false
    });
    this.listenTo(this, "render", this.#onRender);
    this.listenTo(this.options.content, "close", this.#onContentClose);
    this.listenTo(this.options.content, "click:reference", args => this.trigger("click:reference", args));
    this.listenTo(this.options.content, "click:action", args => this.trigger("click:action", args));
  }
  changeSelection(args) {
    this.options.content.changeSelection(args);
  }
  #onRender() {
    this.once("after:show", () => this.options.content.focus());
  }
  #onContentClose() {
    this.hide();
  }
}

Object.assign(ChatPanelView.prototype, {
  className: function() {
    const classNames = SidePanelView.prototype.className.call(this);
    return `aie-chat-panel ${classNames}`;
  }
});

Object.defineProperty(ChatPanelView.prototype.constructor, "name", {
  value: "ChatPanelView"
});

export default ChatPanelView;