/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import PostView from "d2/widgets/task.aviator/impl/messages/post.view";

import template from "hbs!d2/widgets/task.aviator/impl/messages/queryspace.question";

import qsimage from "txt!d2/widgets/task.aviator/icons/aviator_help16.svg";

import "css!d2/widgets/task.aviator/impl/messages/queryspace.question";

import "smart/utils/otwc.loader";

import $ from "nuc/lib/jquery";

class QuerySpaceQuestionView extends PostView {
  templateContext() {
    return {
      qsimage: qsimage
    };
  }
}

function faqClick(event) {
  var clickedFaq = $(event.currentTarget).data("query-text");
  this.triggerMethod("click:faq", {
    faq: clickedFaq,
    event: event
  });
}

Object.assign(QuerySpaceQuestionView.prototype, {
  className: `${PostView.prototype.className} aie-chat-qsquestion`,
  template: template,
  ui: {
    faq: ".aie-faq"
  },
  events: {
    "click @ui.faq": faqClick
  }
});

Object.defineProperty(QuerySpaceQuestionView.prototype.constructor, "name", {
  value: "QuerySpaceQuestionView"
});

export default QuerySpaceQuestionView;