/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/mixins/rules.matching/rules.matching.mixin", "dctmw/utils/constants", "csui-ext!dctmw/controls/tree/tree.sprites" ], function(_, Backbone, RulesMatchingMixin, constants, extraIcons) {
  var TreeSpriteModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      className: null
    },
    constructor: function TreeSpriteModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });
  RulesMatchingMixin.mixin(TreeSpriteModel.prototype);
  var TreeSpriteCollection = Backbone.Collection.extend({
    model: TreeSpriteModel,
    comparator: "sequence",
    constructor: function TreeSpriteCollection() {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },
    findClassByNode: function(node) {
      return this.findClassByData(node);
    },
    findClassByTreeNode: function(treeNode) {
      return this.findClassByData(treeNode);
    },
    findClassByData: function(data) {
      var nodeSprite = this.findByNode(data);
      return nodeSprite && _.result(nodeSprite.attributes, "className") || undefined;
    },
    findByNode: function(node) {
      return this.find(function(rule) {
        return rule.matchRules(node, rule.attributes);
      });
    }
  });
  var treeSprites = new TreeSpriteCollection([ {
    equals: {
      id: constants.NodeId.REPOSITORY
    },
    className: "d2-tree-icon-repository",
    sequence: 51
  }, {
    equals: {
      id: constants.NodeId.FAVORITES
    },
    className: "d2-tree-icon-favorites",
    sequence: 52
  }, {
    equals: {
      _is_home_cabinet: true
    },
    className: "d2-tree-icon-home-cabinet",
    sequence: 53
  }, {
    equals: {
      type: constants.Types.CABINET
    },
    className: "d2-tree-icon-cabinet",
    sequence: 54
  }, {
    equals: {
      type: constants.Types.FOLDER
    },
    className: "d2-tree-icon-folder",
    sequence: 55
  }, {
    equals: {
      statusNodeType: "error"
    },
    className: "d2-tree-icon-error",
    sequence: 56
  } ]);
  if (extraIcons) {
    treeSprites.add(_.flatten(extraIcons, true));
  }
  return treeSprites;
});