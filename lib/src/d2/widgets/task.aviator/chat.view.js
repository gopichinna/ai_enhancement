/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  View
} from "nuc/lib/marionette3";

import {
  getNodeList
} from "d2/widgets/task.aviator/server.adaptors/chat.node.adapter";

import HeaderView from "d2/widgets/task.aviator/impl/header/header.view";

import DisclaimerView from "d2/widgets/task.aviator/impl/disclaimer/disclaimer.view";

import MessagesView from "d2/widgets/task.aviator/impl/messages/messages.view";

import PromptView from "d2/widgets/task.aviator/impl/prompt/prompt.view";

import template from "hbs!d2/widgets/task.aviator/impl/chat";

import lang from "i18n!d2/widgets/task.aviator/nls/lang";

import "css!d2/widgets/task.aviator/impl/chat";

const headerView = Symbol("headerView");

const disclaimerView = Symbol("disclaimerView");

const messagesView = Symbol("messagesView");

const promptView = Symbol("promptView");

class ChatView extends View {
  constructor(options) {
    options.nodes = getNodeList(options);
    super(options);
    this.listenTo(this, "before:render", this.#onBeforeRender);
    this.listenTo(this, "render", this.#onRender);
  }
  #onBeforeRender() {
    this[headerView] = this[disclaimerView] = this[messagesView] = this[promptView] = undefined;
  }
  #onRender() {
    this[headerView] = new HeaderView({
      nodes: this.options.nodes
    });
    this.showChildView("header", this[headerView]);
    if (this.options.showDisclaimer || this.options.showDisclaimer !== false && DisclaimerView.displayRequired()) {
      this.#renderDisclaimer();
    } else {
      this.#renderMeaningful();
    }
  }
  #renderDisclaimer() {
    this[disclaimerView] = new DisclaimerView();
    this.listenTo(this[disclaimerView], "accept", () => {
      this.triggerMethod("accept:disclaimer");
      this.getRegion("disclaimer").empty();
      this.#renderMeaningful();
      this[disclaimerView] = undefined;
      this[promptView].focus();
    });
    this.listenTo(this[disclaimerView], "reject", () => {
      this.triggerMethod("reject:disclaimer");
      this.onChildviewClose();
    });
    this.showChildView("disclaimer", this[disclaimerView]);
  }
  #renderMeaningful() {
    this[messagesView] = new MessagesView({
      collection: this.options.chat,
      nodes: this.options.nodes,
      viewableNodes: this.options.viewableNodes,
      referenceActions: this.options.referenceActions,
      qsdata: this.options.qsdata
    });
    this.showChildView("messages", this[messagesView]);
    this.listenTo(this[messagesView], "click:reference", args => this.trigger("click:reference", args));
    this.listenTo(this[messagesView], "click:qs", args => this.querySpaceClicked(args));
    this.listenTo(this[messagesView], "click:faq", args => this.faqClicked(args));
    this.listenTo(this[messagesView], "click:action", args => this.trigger("click:action", args));
    this.listenTo(this[headerView], "close:panel", args => this.trigger("close:panel", args));
    this[promptView] = new PromptView({
      chat: this.options.chat,
      nodes: this.options.nodes,
      localizableStrings: this.options.chatController.localizableStrings
    });
    this.showChildView("prompt", this[promptView]);
  }
  changeSelection({
    nodes,
    viewableNodes
  }) {
    this.options.showDisclaimer = false;
    this.options.nodes = nodes;
    this.options.viewableNodes = viewableNodes;
    this.options.chatController.reinitialize({
      nodes: nodes
    });
    this.render();
    this.focus();
  }
  querySpaceClicked(args) {
    this.options.chatController.resetQuerySpace(args.qs);
  }
  faqClicked(args) {
    this.options.chatController.ask(args.faq);
  }
  focus() {
    const innerView = this[promptView] || this[disclaimerView];
    innerView.focus();
  }
  onChildviewClose() {
    this.triggerMethod("close");
  }
  onChildviewSummarize() {
    const summarizeQuestion = this.options.chatController.localizableStrings.summarizeQuestion || this.#getSummarizeQuestion();
    this.#askQuestion(summarizeQuestion);
  }
  onChildviewTellMore() {
    this.#askQuestion(lang.tellMoreQuestion);
  }
  onChildviewAsk(text) {
    this.#askQuestion(text);
  }
  onChildviewClearDiscussion() {
    this.options.chatController.clearDiscussion();
  }
  #getSummarizeQuestion() {
    const {
      nodes
    } = this.options;
    let summarizeQuestion;
    if (nodes.length > 1) {
      if (nodes[0].get("type") === 848) {
        summarizeQuestion = lang.summarizeWorkspacesQuestion;
      } else {
        summarizeQuestion = lang.summarizeDocumentsQuestion;
      }
    } else if (nodes[0].get("type") === 848) {
      summarizeQuestion = lang.summarizeWorkspaceQuestion;
    } else {
      summarizeQuestion = lang.summarizeDocumentQuestion;
    }
    return summarizeQuestion;
  }
  async #askQuestion(text) {
    try {
      this.el.classList.add("aie-in-progress");
      this[messagesView].el.setAttribute("aria-busy", "true");
      await this.options.chatController.ask(text);
    } catch (err) {
      console.error(err);
    } finally {
      this[messagesView].el.removeAttribute("aria-busy");
      this.el.classList.remove("aie-in-progress");
    }
  }
}

function onKeyDown(event) {
  if (this.options.trapKeyboard === false || event.metaKey || event.altKey || event.ctrlKey || event.key !== "Tab") {
    return;
  }
  if (event.shiftKey) {
    if (this[headerView].firstFocused()) {
      event.preventDefault();
      this[promptView] && this[promptView].focus(true) || this[disclaimerView] && this[disclaimerView].focus(true);
    }
  } else {
    if (this[promptView] && this[promptView].lastFocused() || this[disclaimerView] && this[disclaimerView].lastFocused()) {
      event.preventDefault();
      this[headerView].focus();
    }
  }
}

Object.assign(ChatView.prototype, {
  className: "aie-chat",
  template: template,
  regions: {
    header: {
      el: ".aie-chat-header-region",
      replaceElement: true
    },
    disclaimer: {
      el: ".aie-chat-disclaimer-region",
      replaceElement: true
    },
    messages: {
      el: ".aie-chat-messages-region",
      replaceElement: true
    },
    prompt: {
      el: ".aie-chat-prompt-region",
      replaceElement: true
    }
  },
  events: {
    keydown: onKeyDown
  }
});

Object.defineProperty(ChatView.prototype.constructor, "name", {
  value: "ChatView"
});

export default ChatView;