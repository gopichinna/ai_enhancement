/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import {
  CollectionView
} from "nuc/lib/marionette3";

import {
  IntroModel,
  QuestionModel,
  AnswerModel,
  FailureModel,
  QuerySpaceSelectionModel,
  QuerySpaceQuestionsModel
} from "d2/widgets/task.aviator/models/chat/chat.models";

import IntroView from "d2/widgets/task.aviator/impl/messages/intro.view";

import BotView from "d2/widgets/task.aviator/impl/messages/bot.view";

import UserView from "d2/widgets/task.aviator/impl/messages/user.view";

import WaitView from "d2/widgets/task.aviator/impl/messages/wait.view";

import FailureView from "d2/widgets/task.aviator/impl/messages/failure.view";

import QuerySpaceQuestionView from "d2/widgets/task.aviator/impl/messages/queryspace.question.view";

import "css!d2/widgets/task.aviator/impl/messages/messages";

import "csui/lib/jquery.scrollbarwidth";

class MessagesView extends CollectionView {
  #introTop;
  constructor(options) {
    super(options);
    ensureScrollbarWidth();
    this.listenTo(this, "add:child childview:type:text", this.#scrollToLastQuestion);
    this.listenTo(this, "childview:click:reference", args => this.trigger("click:reference", args));
    this.listenTo(this, "childview:click:action", args => this.trigger("click:action", args));
    this.listenTo(this, "childview:click:qs", args => this.trigger("click:qs", args));
    this.listenTo(this, "childview:click:faq", args => this.trigger("click:faq", args));
  }
  childView(model) {
    if (model instanceof QuestionModel) return UserView;
    if (model instanceof AnswerModel) return BotView;
    if (model instanceof IntroModel) return IntroView;
    if (model instanceof FailureModel) return FailureView;
    if (model instanceof QuerySpaceSelectionModel) return UserView;
    if (model instanceof QuerySpaceQuestionsModel) return QuerySpaceQuestionView;
    return WaitView;
  }
  childViewOptions() {
    return {
      nodes: this.options.nodes,
      viewableNodes: this.options.viewableNodes,
      referenceActions: this.options.referenceActions
    };
  }
  #scrollToLastQuestion() {
    if (this.children.length >= 3 && (this.children.length - 1) % 2 === 0 && this.el.scrollHeight - 1 > this.el.offsetHeight) {
      const [ question ] = this.children.rest(this.children.length - 2);
      const top = question.el.offsetTop - this.#getIntroTop() - 24;
      this.el.scrollTo({
        top: top,
        left: 0,
        behavior: "smooth"
      });
    }
  }
  #getIntroTop() {
    if (this.#introTop === undefined) {
      this.#introTop = this.children.first().el.offsetTop;
    }
    return this.#introTop;
  }
}

function ensureScrollbarWidth() {
  if (document.body.style.getPropertyValue("--aie-scrollbar-width")) return;
  document.body.style.setProperty("--aie-scrollbar-width", `${$.scrollbarWidth()}px`);
}

Object.assign(MessagesView.prototype, {
  className: "aie-chat-messages csui-normal-scrolling",
  tagName: "ul",
  attributes: {
    role: "log",
    tabindex: "0"
  }
});

Object.defineProperty(MessagesView.prototype.constructor, "name", {
  value: "MessagesView"
});

export default MessagesView;