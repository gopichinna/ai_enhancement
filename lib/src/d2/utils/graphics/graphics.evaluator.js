/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import ExpressionModel from "d2/models/mixins/expressions/expression";

import ExpressionGeneratorMixin from "dctmw/models/mixins/expressions/expression.generator.mixin";

import NodeConverter from "dctmw/server.adaptors/converters/node";

class GraphicsEvaluator {
  static serverClientAttrNameMap = {
    r_object_type: "rObjectType",
    a_content_type: "aContentType",
    r_link_cnt: "rLinkCnt",
    r_assembled_from_id: "rAssembledFromId",
    a_application_type: "aApplicationType",
    r_content_size: "rContentSize",
    r_full_content_size: "rFullContentSize"
  };
  static calculate(node, options) {
    function getValue(attribute, sensitivity) {
      var control = GraphicsEvaluator.evaluateModelControl(attribute, options);
      attribute = NodeConverter.getServerClientAttrNameMap()[attribute] || GraphicsEvaluator.serverClientAttrNameMap[attribute] || attribute;
      var findLoadConditionAttribute = function(node, conditionAttributes) {
        var type = node.get("rObjectType");
        if (!type) {
          type = node.get("r_object_type");
          if (!type) {
            type = node.get("type");
          }
        }
        _.each(conditionAttributes, function(conditionAttribute) {
          if (conditionAttribute.attribute.indexOf(type) > -1) {
            if (!node.get(conditionAttribute.attribute)) {
              var attrName = conditionAttribute.attribute.split(type + ".")[1];
              node.set(conditionAttribute.attribute, node.get(attrName), {
                silent: true
              });
            }
          }
        });
      };
      findLoadConditionAttribute(node, options.conditionAttributes);
      var attributeValue = GraphicsEvaluator.attributeValue(node, attribute, sensitivity);
      return new ExpressionModel(attributeValue, control);
    }
    return GraphicsEvaluator.evaluate(node, GraphicsEvaluator.prototype.parse(options.condition, "").method, getValue);
  }
  static attributeValue(node, attribute, sensitivity) {
    if (sensitivity || _.isNumber(attribute)) return attribute;
    return node.get(attribute);
  }
  static evaluateModelControl(attribute, options) {
    options = options || {};
    var convertedAttributeTypeValue = GraphicsEvaluator.convertAttributeTypeFromServerToClient(options.conditionAttributes?.find(function(conditionAttribute) {
      return conditionAttribute.attribute === attribute;
    })?.attribute_type);
    var optionsObject = {
      _type: options?.conditionAttributes.find(conditionAttribute => conditionAttribute.attribute === attribute)?.is_repeating_attribute ? "array" : convertedAttributeTypeValue,
      _useDefaultFormat: true
    };
    var typeObject = {
      options: optionsObject
    };
    var control = typeObject;
    if (typeObject.options._type === "array") {
      control = [];
      var subType = [];
      subType.options = {
        _type: convertedAttributeTypeValue
      };
      control.push(subType);
    }
    control.options = optionsObject;
    return control;
  }
  static convertAttributeTypeFromServerToClient(attributeType) {
    var clientType = "string";
    switch (attributeType) {
     case 0:
      clientType = "boolean";
      break;

     case 1:
      clientType = "integer";
      break;

     case 2:
      clientType = "string";
      break;

     case 3:
      clientType = "string";
      break;

     case 4:
      clientType = "date";
      break;

     case 5:
      clientType = "double";
      break;

     case 6:
      clientType = "string";
      break;
    }
    return clientType;
  }
  static evaluate(node, condition, valFn) {
    var getValue = valFn;
    var value;
    try {
      value = eval(condition);
    } catch (e) {
      console.error("Error evaluating " + condition, e);
    }
    return value;
  }
  static evaluateColumnGraphics(graphics, node, column) {
    return graphics.find(function(rule) {
      var values = [ rule.get("value"), NodeConverter.getServerClientAttrNameMap()[rule.get("value")], GraphicsEvaluator.serverClientAttrNameMap[rule.get("value")] ];
      if (rule.get("group") === "propertystyle" && values.find(value => column.name.slice(column.name.lastIndexOf(".") + 1) === value || value && value.lastIndexOf(".") != -1 && column.name === value)) {
        return rule.get("condition") === "" ? true : GraphicsEvaluator.calculate(node, {
          condition: !_.isUndefined(rule.get("ui_evaluated_condition")) && !_.isEmpty(rule.get("ui_evaluated_condition")) ? rule.get("ui_evaluated_condition") : rule.get("condition"),
          conditionAttributes: rule.get("conditionAttributes")
        });
      }
    });
  }
}

ExpressionGeneratorMixin.mixin(GraphicsEvaluator.prototype);

Object.assign(GraphicsEvaluator.prototype, {
  defaults: {}
});

Object.defineProperty(GraphicsEvaluator.prototype.constructor, "name", {
  value: "GraphicsEvaluator"
});

export default GraphicsEvaluator;