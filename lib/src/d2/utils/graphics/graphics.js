/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Model,
  Collection
} from "nuc/lib/backbone";

import _ from "nuc/lib/underscore";

import Backbone from "nuc/lib/backbone";

import GraphicsEvaluator from "d2/utils/graphics/graphics.evaluator";

import RestResources from "dctmw/utils/rest.resources";

import vdUtils from "d2/utils/vdoc.utils";

class Graphics extends Model {
  #getValidationMethod(group, conditionAttributes) {
    return function(node, options) {
      if (node instanceof Backbone.Model && !vdUtils.isVirtualDoc(node) && !vdUtils.isVDSnapshot(node)) {
        var valuesToMatch = group === "type" ? [ options.value ].concat(RestResources.getDctmTypeData().subTypes[options.value] || []) : group === "format" ? [ options.value ] : [], attributesToMatch = group === "type" ? [ "r_object_type", "rObjectType", "type" ] : group === "format" ? [ "a_content_type", "aContentType" ] : [], matchFound = attributesToMatch.find(function(attribute) {
          return valuesToMatch.find(function(value) {
            return node.get(attribute) === value;
          });
        });
        if (matchFound) {
          var returnVal = options.condition === "" ? true : GraphicsEvaluator.calculate(node, _.extend({
            conditionAttributes: conditionAttributes
          }, options));
          if (returnVal) {
            node.set("image_url", options.icon, {
              silent: true
            });
          }
          return returnVal;
        }
      }
      return false;
    };
  }
  getRule() {
    let ruleObj = {
      decides: this.#getValidationMethod(this.get("group"), this.get("conditionAttributes")),
      sequence: this.get("sequence") ? this.get("sequence") : 1,
      condition: !_.isUndefined(this.get("ui_evaluated_condition")) && !_.isEmpty(this.get("ui_evaluated_condition")) ? this.get("ui_evaluated_condition") : this.get("condition"),
      value: this.get("value"),
      group: this.get("group")
    };
    if (this.get("icon")) {
      ruleObj.icon = this.get("icon");
    } else {
      ruleObj.className = this.get("className") ? "csui-icon d2-bws-icons " + this.get("className") : "csui-icon d2-icon-type-contentless";
    }
    return ruleObj;
  }
}

class GraphicCollection extends Collection {
  constructor(models, options = {}) {
    super(models, options);
  }
  findAllTypesAndFormat() {
    var filteredModels = [];
    this.each(function(item) {
      if (_.contains([ "type", "format" ], item.get("group"))) {
        filteredModels.push(item.getRule());
      }
    });
    return filteredModels;
  }
  findAllpropertyStyles() {
    var filteredModels = [];
    this.each(function(item) {
      if (_.contains([ "propertystyle" ], item.get("group"))) {
        filteredModels.push(item);
      }
    });
    return filteredModels;
  }
}

Object.assign(GraphicCollection.prototype, {
  defaults: {
    sequence: 1e4
  }
});

Object.assign(GraphicCollection.prototype, {
  model: Graphics,
  comparator: "sequence"
});

Object.defineProperty(Graphics.prototype.constructor, "name", {
  value: "GraphicModel"
});

Object.defineProperty(GraphicCollection.prototype.constructor, "name", {
  value: "GraphicCollection"
});

export default GraphicCollection;