/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Model
} from "nuc/lib/backbone";

class PostModel extends Model {
  constructor(attributes = {}, options) {
    super(attributes, options);
    if (!this.attributes.date) {
      this.attributes.date = new Date().toISOString();
    }
  }
}

Object.defineProperty(PostModel.prototype.constructor, "name", {
  value: "PostModel"
});

class IntroModel extends PostModel {}

Object.defineProperty(IntroModel.prototype.constructor, "name", {
  value: "IntroModel"
});

class QuestionModel extends PostModel {}

Object.defineProperty(QuestionModel.prototype.constructor, "name", {
  value: "QuestionModel"
});

class AnswerModel extends PostModel {}

Object.defineProperty(AnswerModel.prototype.constructor, "name", {
  value: "AnswerModel"
});

class FailureModel extends PostModel {}

Object.defineProperty(FailureModel.prototype.constructor, "name", {
  value: "FailureModel"
});

class WaitModel extends PostModel {}

Object.defineProperty(WaitModel.prototype.constructor, "name", {
  value: "WaitModel"
});

class QuerySpaceSelectionModel extends PostModel {}

Object.defineProperty(QuerySpaceSelectionModel.prototype.constructor, "name", {
  value: "QuerySpaceSelectionModel"
});

class QuerySpaceQuestionsModel extends PostModel {}

Object.defineProperty(QuerySpaceQuestionsModel.prototype.constructor, "name", {
  value: "QuerySpaceQuestionsModel"
});

export {
  IntroModel,
  QuestionModel,
  AnswerModel,
  FailureModel,
  WaitModel,
  QuerySpaceSelectionModel,
  QuerySpaceQuestionsModel
};