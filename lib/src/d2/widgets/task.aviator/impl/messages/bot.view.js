/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Collection
} from "nuc/lib/backbone";

import {
  sformat
} from "nuc/lib/underscore.string";

import NodeModel from "nuc/models/node/node.model";

import GlobalMessage from "smart/controls/globalmessage/globalmessage";

import PostView from "d2/widgets/task.aviator/impl/messages/post.view";

import ReferencesView from "d2/widgets/task.aviator/impl/messages/references.view";

import {
  safeHtmlSliceIndex,
  text2html
} from "d2/widgets/task.aviator/aie/utils/text2html/text2html";

import {
  copyElementContent
} from "d2/widgets/task.aviator/aie/utils/clipboard/clipboard";

import {
  getPluralMessageForCardinal
} from "d2/widgets/task.aviator/aie/utils/plurals/plurals";

import {
  makeTablesScrollable
} from "d2/widgets/task.aviator/aie/utils/scrollable.table/scrollable.table";

import template from "hbs!d2/widgets/task.aviator/impl/messages/bot";

import lang from "i18n!d2/widgets/task.aviator/nls/lang";

import caretDown from "txt!d2/widgets/task.aviator/aie/icons/utility_caret_down16.svg";

import caretUp from "txt!d2/widgets/task.aviator/aie/icons/utility_caret_up16.svg";

import "css!d2/widgets/task.aviator/impl/messages/bot";

import "d2/widgets/task.aviator/aie/icons/icons_aie_action";

import "smart/utils/otwc.loader";

const minTypingSpeed = 1;

const maxTypingTime = 100;

const copiedIconDuration = 2e3;

class BotView extends PostView {
  templateContext() {
    let referenceCount;
    const references = this.model.get("references");
    if (references && references.length) {
      const referenceCountFormat = getPluralMessageForCardinal(lang, "referenceCount", references.length);
      referenceCount = sformat(referenceCountFormat, references.length);
    }
    return {
      lang: lang,
      referenceCount: referenceCount,
      caretDown: caretDown,
      caretUp: caretUp
    };
  }
  onRender() {
    if (this.ui.references.length) {
      this.ui.references[0].style.display = "none";
    }
    if (this.ui.copy.length) {
      this.ui.copy[0].style.display = "none";
    }
    setTimeout(() => this.#type(), 1);
  }
  async #type() {
    let html = text2html(this.model.get("text"), {
      richStyle: true
    });
    const maxWidth = this.ui.text.innerWidth() || 375;
    html = makeTablesScrollable(html, {
      maxWidth: maxWidth
    });
    const {
      length
    } = html;
    const textEl = this.ui.text[0];
    if (length > 60 && this.el.parentElement.scrollHeight - 1 > this.el.parentElement.offsetHeight) {
      textEl.innerHTML = html;
    } else {
      const speed = minTypingSpeed * length < maxTypingTime ? minTypingSpeed : maxTypingTime / length;
      const delay = speed < 1 ? 1 : Math.trunc(speed);
      const step = speed < 1 ? Math.trunc(1 / speed + 1) : 1;
      for (let i = 0; i < length; 0) {
        const sliceLen = safeHtmlSliceIndex(html, i + step);
        textEl.innerHTML = html.substring(0, sliceLen);
        await new Promise(resolve => setTimeout(resolve, delay));
        i = sliceLen;
      }
    }
    if (this.ui.copy.length) {
      this.ui.copy[0].style.display = "";
    }
    if (this.ui.references.length) {
      this.ui.references[0].style.display = "";
      this.#maybeExpandReferences();
    }
    this.triggerMethod("type:text", this);
  }
  #maybeExpandReferences() {
    const {
      parentElement
    } = this.el;
    if (!parentElement) return;
    const {
      offsetHeight
    } = parentElement;
    const {
      length
    } = this.model.get("references");
    if (offsetHeight < 295) return; else if (offsetHeight < 450 && length > 1) return; else if (offsetHeight < 600 && length > 2) return; else if (length > 3) return;
    createReferences.call(this);
    showOrHideReferences.call(this, true);
  }
}

function getGroupedReferences(references, selection) {
  const connector = selection[0].connector;
  const docs = references.map(ref => new NodeModel(ref, {
    connector: connector
  }));
  if (selection.length === 1 && selection[0].get("type") === 848) {
    return docs;
  }
  let workspaceIds = {};
  const workspaces = [];
  for (const reference of references) {
    const {
      workspace
    } = reference;
    if (workspace) {
      const {
        id: workspaceId
      } = workspace;
      if (workspaceIds[workspaceId]) continue;
      workspaceIds[workspaceId] = true;
      workspaces.push(new NodeModel(workspace, {
        connector: connector
      }));
    }
  }
  const nodes = [];
  workspaceIds = {};
  for (const doc of docs) {
    const workspace = doc.get("workspace");
    if (workspace) {
      const {
        id: workspaceId
      } = workspace;
      if (workspaceIds[workspaceId]) continue;
      workspaceIds[workspaceId] = true;
      const workspaceModel = workspaces.find(node => node.get("id") === workspaceId);
      nodes.push(workspaceModel);
      for (const doc of docs) {
        const workspace = doc.get("workspace");
        if (workspace) {
          const {
            id: docWorkspaceId
          } = workspace;
          if (docWorkspaceId === workspaceId) {
            doc.set("grouped", true);
            nodes.push(doc);
          }
        }
      }
    } else {
      nodes.push(doc);
    }
  }
  return nodes;
}

function createReferences() {
  const nodes = getGroupedReferences(this.model.get("references"), this.options.nodes);
  const referencesView = new ReferencesView({
    collection: new Collection(nodes),
    viewableNodes: this.options.viewableNodes,
    referenceActions: this.options.referenceActions
  });
  this.showChildView("references", referencesView);
  this.listenTo(referencesView, "childview:click:reference", args => this.trigger("click:reference", args));
  this.listenTo(referencesView, "childview:click:action", args => this.trigger("click:action", args));
  this.ui.referenceList = referencesView.$el;
}

function showOrHideReferences(show) {
  const [ referenceList ] = this.ui.referenceList;
  let expanded;
  if (show) {
    referenceList.style.display = "";
    referenceList.offsetHeight;
    referenceList.classList.add("aie-shown");
    expanded = "true";
  } else {
    referenceList.style.display = "none";
    referenceList.classList.remove("aie-shown");
    expanded = "false";
  }
  this.ui.referencesToggle[0].setAttribute("aria-expanded", expanded);
}

async function toggleReferences() {
  const [ referenceList ] = this.ui.referenceList;
  const expand = referenceList.style.display === "none";
  if (expand && !referenceList.children.length) {
    createReferences.call(this);
  }
  showOrHideReferences.call(this, expand);
}

function triggerCopyWithKeyboard() {
  this._copiedWithKeyboard = true;
}

function triggerCopyWithPointer() {
  this._copiedWithKeyboard = false;
}

async function triggerCopy() {
  const [ copy ] = this.ui.copy;
  const [ copied ] = this.ui.copied;
  const copyToCopied = () => {
    copy.disabled = true;
    copy.icon = "aie_action:action_copied32";
    copied.style.display = "";
    copied.offsetHeight;
    copied.classList.add("aie-shown");
  };
  const copiedToCopy = () => {
    copy.disabled = false;
    copy.icon = "aie_action:action_copy32";
    copied.style.display = "none";
    copied.classList.remove("aie-shown");
  };
  try {
    await copyElementContent(this.ui.text[0], this.model.get("text"));
    const keyboardUsed = this._copiedWithKeyboard;
    const focusedElement = document.activeElement;
    copyToCopied();
    setTimeout(() => {
      if (this.isDestroyed()) return;
      copiedToCopy();
      if (keyboardUsed && (focusedElement === document.activeElement || document.body === document.activeElement)) {
        copy.focus();
      }
      this._copiedWithKeyboard = undefined;
    }, copiedIconDuration);
    this.triggerMethod("copy", this);
  } catch (err) {
    console.error(err);
    GlobalMessage.showMessage("error", err.message);
  }
}

Object.assign(BotView.prototype, {
  className: `${PostView.prototype.className} aie-chat-bot`,
  template: template,
  regions: {
    references: {
      el: ".aie-chat-reference-list",
      replaceElement: true,
      allowMissingEl: true
    }
  },
  ui: {
    text: ".aie-chat-text",
    references: ".aie-chat-references",
    referencesToggle: ".aie-chat-references-toggle",
    referenceList: ".aie-chat-reference-list",
    copy: ".aie-copy-button",
    copied: ".aie-chat-copied"
  },
  events: {
    "click @ui.referencesToggle": toggleReferences,
    "click @ui.copy": triggerCopy,
    "keydown @ui.copy": triggerCopyWithKeyboard,
    "pointerdown @ui.copy": triggerCopyWithPointer
  }
});

Object.defineProperty(BotView.prototype.constructor, "name", {
  value: "BotView"
});

export default BotView;