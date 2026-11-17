/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/table/cells/cell.registry", "csui/controls/thumbnail/content/content.registry", "csui/utils/nodesprites", "dctmw/controls/tree/tree.sprites", "dctmw/server.adaptors/converters/node", "d2/utils/graphics/graphics", "d2/utils/graphics/graphics.evaluator" ], function(require, _, $, cellViewRegistry, ContentRegistry, NodeSprite, TreeSprites, NodeConverter, GraphicCollection, GraphicsEvaluator) {
  "use strict";
  return {
    hasConditionAttributes: function() {
      return this.graphics && !!this.graphics.find(function(graphicModel) {
        return !_.isEmpty(graphicModel.get("conditionAttributes"));
      });
    },
    getGraphicsRules: function() {
      return this.graphics || new GraphicCollection();
    },
    setGraphicsRules: function(graphics) {
      graphics = this.parseModelData(graphics);
      let graphicsCollection = new GraphicCollection(graphics);
      if (!this.graphics) {
        this.graphics = graphicsCollection;
      } else {
        this.graphics.add(graphics);
      }
      NodeSprite.add(_.flatten(graphicsCollection.findAllTypesAndFormat(), true));
      TreeSprites.add(_.flatten(graphicsCollection.findAllTypesAndFormat(), true));
    },
    updateCellRegistry: function(columns, keyAttribute) {
      var dfd = $.Deferred();
      var propertyStyles = this.getGraphicsRules().findAllpropertyStyles();
      require([ "d2/controls/table/cells/graphics.generic/graphic.generic.view" ], function(GraphicCellView) {
        columns.each(function(column) {
          var keys = [ column.get(keyAttribute), NodeConverter.getServerClientAttrNameMap()[column.get(keyAttribute).slice(column.get(keyAttribute).lastIndexOf(".") + 1)], GraphicsEvaluator.serverClientAttrNameMap[column.get(keyAttribute).slice(column.get(keyAttribute).lastIndexOf(".") + 1)] ];
          if (propertyStyles.find(style => keys.find(key => key?.slice(key.lastIndexOf(".") + 1) === style.get("value") || key && key.indexOf(".") != -1 && key === style.get("value")))) {
            _.each(keys, function(key) {
              key && cellViewRegistry.registerByColumnKey(key, GraphicCellView);
              key && ContentRegistry.registerByKey(key, GraphicCellView);
            });
          }
        });
        dfd.resolve();
      });
      return dfd.promise();
    },
    parseModelData: function(data) {
      let models = [];
      let conditionAttributes = [], me = this;
      function evaluateGroups(group, entries) {
        _.each(entries, function(entry) {
          _.each(entry.conditions, function(condition) {
            if (!_.isUndefined(entry.value) && !_.isEmpty(entry.value) && (!_.isUndefined(condition.icon) && !_.isEmpty(condition.icon) || group === "propertystyle" && !condition.is_icon_only)) {
              let model = condition;
              model.group = group;
              model.value = entry.value;
              model.title = entry.value;
              model.conditionAttributes = _.clone(conditionAttributes);
              models.push(model);
            }
          });
        });
      }
      _.each(data, function(rule) {
        if (rule?.bwsType === undefined) {
          conditionAttributes = rule?.content["condition_attributes"];
          evaluateGroups("type", rule?.content["type_style"]);
          evaluateGroups("format", rule?.content["format_style"]);
          evaluateGroups("propertystyle", rule?.content["property_style"]);
        } else {
          models.push(me.bwsTransformRule(rule));
        }
      });
      return models;
    },
    bwsTransformRule: function(rule) {
      let model = {};
      model.condition = rule.condition;
      model.group = rule.group;
      model.value = rule.bwsType;
      model.title = rule.bwsType;
      model.className = rule.className;
      model.sequence = rule.sequence;
      return model;
    }
  };
});