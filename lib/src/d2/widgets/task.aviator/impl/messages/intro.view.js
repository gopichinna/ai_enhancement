/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  uniqueId
} from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import {
  sformat
} from "nuc/lib/underscore.string";

import SmartBase from "smart/utils/smart.base";

import PostView from "d2/widgets/task.aviator/impl/messages/post.view";

import {
  text2html
} from "d2/widgets/task.aviator/aie/utils/text2html/text2html";

import template from "hbs!d2/widgets/task.aviator/impl/messages/intro";

import lang from "i18n!d2/widgets/task.aviator/nls/lang";

import "css!d2/widgets/task.aviator/impl/messages/intro";

import "smart/utils/otwc.loader";

import {
  isDocumentType
} from "d2/widgets/task.aviator/aie/utils/util";

class IntroView extends PostView {
  templateContext() {
    const text = this.model.get("text");
    const text1 = this.model.get("text1");
    const text2 = this.model.get("text2");
    const qs = this.model.get("queryspace");
    const qsimage = this.model.get("qsimage");
    if (qs) {
      qs.map(function(queryspace) {
        queryspace.qsimage = qsimage;
      });
    }
    const {
      viewableNodes
    } = this.options;
    const openViewer = viewableNodes?.length && isDocumentType(viewableNodes[0]) && (viewableNodes.length === 1 ? lang.viewDocument : lang.viewAllDocuments) || false;
    return {
      text: text2html(text, {
        richStyle: true
      }),
      text1: text1 ? text2html(text1, {
        richStyle: true
      }) : "",
      text2: text2 ? text2html(text2, {
        richStyle: true
      }) : "",
      qs: qs,
      selectionId: uniqueId("selection-"),
      selection: [],
      qsimage: qsimage,
      openViewer: openViewer,
      lang: lang
    };
  }
  #getNodeNames() {
    const {
      nodes
    } = this.options;
    if (nodes.length === 1) return;
    const result = nodes.map((node, i) => ({
      name: node.get("name"),
      beforeRest: i === 1,
      extra: i >= 2,
      oneButLast: i === nodes.length - 2,
      last: i === nodes.length - 1
    }));
    if (result.length > 2) {
      result.splice(2, undefined, {
        name: sformat(lang.expandNames, result.length - 2),
        more: true
      });
      result.push({
        name: lang.collapseNames,
        less: true
      });
    }
    return result;
  }
}

function expandNames() {
  const [ names ] = this.ui.names;
  const rest = names.querySelectorAll(".aie-selection-more ~ span");
  for (const el of rest) {
    el.classList.remove("binf-hidden");
  }
  this.ui.beforeRest[0].classList.remove("binf-hidden");
  this.ui.beforeMore[0].classList.add("binf-hidden");
  this.ui.more[0].classList.add("binf-hidden");
  this.ui.less[0].classList.remove("binf-hidden");
  this.ui.less[0].focus();
  names.offsetHeight;
  names.classList.add("aie-shown");
}

function collapseNames() {
  const [ names ] = this.ui.names;
  const rest = names.querySelectorAll(".aie-selection-more ~ span");
  for (const el of rest) {
    el.classList.add("binf-hidden");
  }
  this.ui.beforeRest[0].classList.add("binf-hidden");
  this.ui.beforeMore[0].classList.remove("binf-hidden");
  this.ui.less[0].classList.add("binf-hidden");
  this.ui.more[0].classList.remove("binf-hidden");
  this.ui.more[0].focus();
  names.offsetHeight;
  names.classList.remove("aie-shown");
}

function viewAllDocuments(event) {
  if (!SmartBase.isControlClick(event)) {
    this.triggerMethod("click:reference", {
      nodes: this.options.viewableNodes,
      event: event
    });
  }
}

function qsClick(event) {
  var clickedQuerySpace = $(event.currentTarget).text();
  this.triggerMethod("click:qs", {
    qs: clickedQuerySpace,
    event: event
  });
}

Object.assign(IntroView.prototype, {
  className: `${PostView.prototype.className} aie-chat-intro`,
  template: template,
  ui: {
    names: ".aie-selection",
    beforeRest: ".aie-before-rest",
    beforeMore: ".aie-before-more",
    more: ".aie-selection-more",
    less: ".aie-selection-less",
    qs: ".aie-qs"
  },
  events: {
    "click @ui.more": expandNames,
    "click @ui.less": collapseNames,
    "click .aie-open": viewAllDocuments,
    "click @ui.qs": qsClick
  }
});

Object.defineProperty(IntroView.prototype.constructor, "name", {
  value: "IntroView"
});

export default IntroView;