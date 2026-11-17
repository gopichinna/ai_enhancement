/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  View
} from "nuc/lib/marionette3";

import {
  AnswerModel,
  FailureModel
} from "d2/widgets/task.aviator/models/chat/chat.models";

import template from "hbs!d2/widgets/task.aviator/impl/prompt/prompt";

import lang from "i18n!d2/widgets/task.aviator/nls/lang";

import "css!d2/widgets/task.aviator/impl/prompt/prompt";

import "d2/widgets/task.aviator/aie/icons/icons_aie_action";

import "smart/utils/otwc.loader";

const maxQuestionLength = 2e3;

class PromptView extends View {
  constructor(options = {}) {
    super(options);
    this.enableTellMore = this.options.enableTellMore ?? false;
    this.listenTo(this.options.chat, "update", () => this.#updateButtons());
    this.listenTo(this, "summarize tell:more clear:discussion", () => this.focus());
  }
  templateContext() {
    return {
      enableTellMore: this.enableTellMore,
      promptPlaceholder: this.options.localizableStrings?.promptPlaceholder || this.#getPromptPlaceholder(),
      summarizeLabel: this.options.localizableStrings?.summarizeLabel || this.#getSummarizeLabel(),
      maxQuestionLength: maxQuestionLength,
      lang: lang
    };
  }
  focus(fromBottom) {
    const el = fromBottom && isVisible.call(this, "ask") && this.ui.ask[0] || this.ui.text[0];
    if (el === document.activeElement) return false;
    el.focus();
    return true;
  }
  lastFocused() {
    const el = isVisible.call(this, "ask") && this.ui.ask[0] || this.ui.text[0];
    return el === document.activeElement;
  }
  #getPromptPlaceholder() {
    const {
      nodes
    } = this.options;
    let promptPlaceholder;
    if (nodes.length > 1) {
      if (nodes[0].get("type") === 848) {
        promptPlaceholder = lang.promptPlaceholderForWorkspaces;
      } else {
        promptPlaceholder = lang.promptPlaceholderForDocuments;
      }
    } else if (nodes[0].get("type") === 848) {
      promptPlaceholder = lang.promptPlaceholderForWorkspace;
    } else {
      promptPlaceholder = lang.promptPlaceholderForDocument;
    }
    return promptPlaceholder;
  }
  #getSummarizeLabel() {
    const {
      nodes
    } = this.options;
    let summarizeLabel;
    if (nodes.length > 1) {
      if (nodes[0].get("type") === 848) {
        summarizeLabel = lang.summarizeWorkspacesLabel;
      } else {
        summarizeLabel = lang.summarizeDocumentsLabel;
      }
    } else if (nodes[0].get("type") === 848) {
      summarizeLabel = lang.summarizeWorkspaceLabel;
    } else {
      summarizeLabel = lang.summarizeDocumentLabel;
    }
    return summarizeLabel;
  }
  #updateButtons() {
    if (!this.isRendered()) return;
    const receivedAnswer = this.#hasReceivedAnswer();
    const failedAnswering = this.#hasFailedAnswering();
    if (this.enableTellMore) {
      showEl.call(this, "tellMore", receivedAnswer);
    }
    showEl.call(this, "clear", receivedAnswer || failedAnswering);
  }
  #hasReceivedAnswer() {
    return this.options.chat.some(msg => msg instanceof AnswerModel);
  }
  #hasFailedAnswering() {
    return this.options.chat.some(msg => msg instanceof FailureModel);
  }
}

function isVisible(el) {
  return this.ui[el][0].style.display !== "none";
}

function showEl(el, show) {
  this.ui[el][0].style.display = show ? "" : "none";
}

function textChanged() {
  const text = this.ui.text[0].value;
  const {
    length
  } = text;
  if (length) {
    showEl.call(this, "ask", true);
  } else {
    showEl.call(this, "ask", false);
  }
  this.ui.typed[0].innerText = length.toString();
}

function keyDown(event) {
  if (!event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey && event.key === "Enter") {
    event.preventDefault();
    askTriggered.call(this);
  }
  if (this.ui.text[0].value.length === maxQuestionLength && !event.metaKey && !event.altKey && !event.ctrlKey && event.key && (event.key === "Enter" || event.key.length === 1)) {
    event.preventDefault();
  }
}

function askTriggered() {
  const text = this.ui.text[0];
  if (!text.value) return;
  showEl.call(this, "ask", false);
  this.triggerMethod("ask", text.value);
  text.value = "";
  this.ui.typed[0].innerText = "0";
  text.focus();
}

Object.assign(PromptView.prototype, {
  className: "aie-chat-prompt",
  template: template,
  ui: {
    tellMore: ".aie-tell-more",
    text: "otc-textarea",
    typed: ".aie-typed",
    clear: ".aie-clear",
    ask: ".aie-ask"
  },
  events: {
    "keydown @ui.text": keyDown,
    "input @ui.text": textChanged,
    "click @ui.ask": askTriggered
  },
  triggers: {
    "click .aie-summarize": "summarize",
    "click .aie-tell-more": "tell:more",
    "click .aie-clear": "clear:discussion"
  }
});

Object.defineProperty(PromptView.prototype.constructor, "name", {
  value: "PromptView"
});

export default PromptView;