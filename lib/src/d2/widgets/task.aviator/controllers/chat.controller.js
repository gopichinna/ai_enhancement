/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Object as Controller
} from "nuc/lib/marionette3";

import {
  sformat
} from "nuc/lib/underscore.string";

import NodeModel from "nuc/models/node/node.model";

import nodeLinks from "csui/utils/node.links/node.links";

import RequestError from "nuc/utils/errors/request";

import callChat from "d2/widgets/task.aviator/controllers/chat.caller";

import {
  IntroModel,
  QuestionModel,
  AnswerModel,
  FailureModel,
  WaitModel
} from "d2/widgets/task.aviator/models/chat/chat.models";

import {
  getNodeList,
  getLocalizableStrings
} from "d2/widgets/task.aviator/server.adaptors/chat.node.adapter";

import ManyNodesCollection from "d2/widgets/task.aviator/models/many.nodes/many.nodes";

import ChatServerAdapter from "d2/widgets/task.aviator/server.adaptors/chat.server.adapter";

import botSvg from "txt!d2/widgets/task.aviator/aie/icons/mime_aviator_chatbot18.svg";

import lang from "i18n!d2/widgets/task.aviator/nls/lang";

import {
  QuerySpaceQuestionsModel
} from "../models/chat/chat.models";

import qsimage from "txt!d2/widgets/task.aviator/icons/aviator_help16.svg";

const aviatorAvatar = `data:image/svg+xml,${encodeURIComponent(botSvg)}`;

class ChatController extends Controller {
  #serverAdapter;
  #chatContext;
  #querySpace;
  #selQuerySpace;
  constructor(options) {
    options.nodes = getNodeList(options);
    super(options);
    this.#initialize();
  }
  #initialize() {
    this.#serverAdapter = this.options.serverAdapter || new ChatServerAdapter(this.options);
    this.localizableStrings = getLocalizableStrings(this.options);
    this.#addIntro();
  }
  #addIntro() {
    if (this.options.qsdata.queryspace && this.options.qsdata.queryspace.length) {
      return this.options.chat.add(new IntroModel({
        text: this.localizableStrings.introMessage || this.#getIntroMessage(),
        text1: this.localizableStrings.introMessageQuerySpace,
        text2: this.localizableStrings.introMessageQuerySpaceSelection,
        queryspace: this.options.qsdata.queryspace,
        image: aviatorAvatar,
        qsimage: qsimage
      }));
    } else {
      return this.options.chat.add(new IntroModel({
        text: this.localizableStrings.introMessage || this.#getIntroMessage(),
        image: aviatorAvatar
      }));
    }
  }
  #getIntroMessage() {
    const {
      nodes
    } = this.options;
    let introMessage;
    if (nodes.length > 1) {
      if (nodes[0].get("type") === 848) {
        introMessage = lang.askMeOnWorkspaces;
      } else {
        introMessage = lang.askMeOnDocuments;
      }
    } else if (nodes[0].get("type") === 848) {
      introMessage = lang.askMeOnWorkspace;
    } else {
      introMessage = lang.askMeOnDocument;
    }
    return introMessage;
  }
  #addQuestion(text) {
    return this.options.chat.add(new QuestionModel({
      text: text
    }));
  }
  #addAnswer(text, references, empty) {
    return this.options.chat.add(new AnswerModel({
      text: text,
      image: aviatorAvatar,
      references: references,
      empty: empty
    }));
  }
  #addFailure(text) {
    return this.options.chat.add(new FailureModel({
      text: text,
      failed: true
    }));
  }
  #addSelectedQuerySpace(text, text1) {
    const waitModel = new WaitModel();
    const {
      chat
    } = this.options;
    chat.add(new QuestionModel({
      text: text,
      text1: text1,
      ignore: true
    }));
    chat.add(waitModel);
    let selQuerySpace = this.options.qsdata.queryspace.filter(function(qs) {
      return qs.name === text1;
    });
    let faq = [];
    if (selQuerySpace && selQuerySpace.length) {
      this.#selQuerySpace = selQuerySpace[0];
      faq = selQuerySpace[0].faq;
    }
    let querySpaceTxt = lang.querySpace;
    chat.remove(waitModel);
    chat.add(new QuerySpaceQuestionsModel({
      text: querySpaceTxt,
      text1: text1,
      image: aviatorAvatar,
      faq: faq
    }));
  }
  clearDiscussion() {
    while (this.options.chat.length > 1) {
      this.options.chat.pop();
    }
    this.#chatContext = "";
  }
  reinitialize(options) {
    this.options.nodes = getNodeList(options);
    this.options.chat.reset([], {
      silent: true
    });
    this.#chatContext = "";
    this.#initialize();
  }
  resetQuerySpace(querySpaceName) {
    this.#chatContext = "";
    this.#querySpace = querySpaceName;
    this.#addSelectedQuerySpace(this.localizableStrings.querySpaceSelectedMessage, querySpaceName);
  }
  async ask(question) {
    const waitModel = new WaitModel();
    const {
      chat
    } = this.options;
    const questionModel = this.#addQuestion(question);
    try {
      chat.add(waitModel);
      const {
        result,
        references,
        empty
      } = await this.#getAnswer();
      chat.remove(waitModel);
      this.#addAnswer(result, references, empty);
      if (empty) {
        questionModel.set("empty", true);
      }
    } catch (err) {
      questionModel.set("failed", true);
      this.#addFailure(err.message);
      throw err;
    } finally {
      chat.remove(waitModel);
    }
  }
  async #getAnswer() {
    const {
      connector
    } = this.options.nodes[0];
    const where = this.#prepareWhereClause();
    const messages = this.#prepareMessages();
    const params = {
      where: where,
      context: this.#chatContext || "",
      messages: messages
    };
    let result, chatContext, references;
    try {
      const promiseForAnswer = this.#serverAdapter.makeChatRequest ? this.#serverAdapter.makeChatRequest(params) : this.#makeChatRequest(params);
      ({
        result,
        context: chatContext,
        references
      } = await promiseForAnswer);
    } catch (err) {
      throw extendError(err, lang.fetchingAnswerFailed);
    }
    if (!result) {
      return {
        result: lang.emptyAnswer,
        empty: true
      };
    }
    if (chatContext) {
      this.#chatContext = chatContext;
    }
    if (references?.length) {
      references = await this.#convertReferences(references, connector);
    }
    return {
      result: result,
      references: references
    };
  }
  #prepareWhereClause() {
    var me = this;
    let documents;
    if (this.#querySpace) {
      let qs = this.options.qsdata.queryspace.filter(function(qsitem) {
        return qsitem.name === me.#selQuerySpace.name;
      });
      if (qs && qs[0]) {
        documents = qs[0].documents;
      }
    } else {
      documents = this.options.nodes.map(function(node) {
        return node.get("id");
      });
    }
    let where = this.prepareWhereClauseInternal(documents);
    return where;
  }
  prepareWhereClauseInternal(documents) {
    let where;
    if (documents.length === 1) {
      where = this._getExpressionForObject(documents[0]);
    } else {
      let expressions = [];
      for (var i = 0; i < documents.length; i++) {
        expressions.push(this._getExpressionForObject(documents[i]));
      }
      where = {
        "expression-type": "expression-set",
        operator: "OR",
        expressions: expressions
      };
    }
    return where;
  }
  _getExpressionForObject(id) {
    return {
      "expression-type": "expression-set",
      operator: "AND",
      expressions: [ {
        "expression-type": "property",
        name: "r_object_id",
        operator: "EQUAL",
        value: id
      } ]
    };
  }
  #prepareMessages() {
    return this.options.chat.filter(model => model instanceof AnswerModel && !model.get("empty") || model instanceof QuestionModel && !model.get("empty") && !model.get("failed") && !model.get("ignore")).map(model => ({
      author: model instanceof AnswerModel ? "ai" : "user",
      content: model.get("text")
    }));
  }
  #makeChatRequest(body) {
    const {
      connector
    } = this.options.nodes[0];
    return callChat(connector, body);
  }
  async #convertReferences(references, connector) {
    const ids = references.map(({
      metadata
    }) => convertID(metadata.documentID));
    let workspaceIds = references.map(({
      metadata
    }) => convertID(metadata.workspaceID));
    workspaceIds = workspaceIds.filter((id, index, ids) => id && ids.indexOf(id) === index);
    const nodes = new ManyNodesCollection(undefined, {
      ids: ids.concat(workspaceIds),
      connector: connector
    });
    try {
      await nodes.fetch({
        context: this.options.context,
        contextNodes: this.options.nodes,
        documentReferences: references
      });
    } catch (err) {
      throw extendError(err, lang.fetchingReferencesFailed);
    }
    return references.map(({
      metadata
    }) => {
      const documentId = convertID(metadata.documentID);
      const workspaceId = convertID(metadata.workspaceID);
      const node = nodes.findWhere({
        id: documentId
      });
      const workspace = workspaceId && nodes.findWhere({
        id: workspaceId
      });
      return {
        ...node.attributes,
        openable: true,
        url: nodeLinks.getUrl(node, {
          connector: connector,
          context: this.options.context
        }),
        workspace: workspace && {
          ...workspace.attributes,
          openable: true,
          url: nodeLinks.getUrl(workspace, {
            connector: connector,
            context: this.options.context
          })
        },
        chunks: metadata?.content?.chunks ?? []
      };
    });
  }
}

function convertID(id) {
  return id && NodeModel.usesIntegerId ? +id : id;
}

function extendError(err, message) {
  let extendedErr;
  if (err instanceof Error) {
    extendedErr = err;
  } else {
    extendedErr = new RequestError(err);
    if (!extendedErr.message || err.getResponseHeader && err.getResponseHeader("content-type") === "text/html") {
      extendedErr.message = lang.networkRequestFailed;
    }
  }
  extendedErr.message = sformat(message, extendedErr.message);
  return extendedErr;
}

Object.defineProperty(ChatController.prototype.constructor, "name", {
  value: "ChatController"
});

export default ChatController;