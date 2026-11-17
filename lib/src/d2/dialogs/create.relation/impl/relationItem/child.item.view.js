/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/controls/list/simplelist.view", "csui/controls/node-type.icon/node-type.icon.view", "csui/utils/node.links/node.links", "dctmw/utils/rest.resources", "hbs!d2/dialogs/create.relation/impl/relationItem/impl/childItem", "hbs!d2/dialogs/create.relation/impl/relationItem/impl/parentItem", "i18n!d2/dialogs/create.relation/impl/nls/lang" ], function(_, $, Marionette, SimpleListView, NodeTypeIconView, NodeLinks, RestResources, childItemTemplate, parentItemTemplate, lang) {
  var RelationChildItemView = Marionette.ItemView.extend({
    constructor: function RelationChildItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    tagName: "div",
    onRender: function() {
      var removeEl = this.$(".remove-button");
      if (removeEl) {
        removeEl.attr("title", lang.RemoveTooltip);
      }
      var iconView = new NodeTypeIconView({
        el: this.ui.icon.get(0),
        node: this.model
      });
      iconView.render();
    },
    modelEvents: {
      change: "render"
    },
    ui: {
      removeBtn: ".remove-button",
      helpText: ".binf-help-block",
      icon: ".d2-create-relations-item-icon span"
    },
    events: {
      "click @ui.removeBtn": "onClickRemove",
      "focusin @ui.removeBtn": "onFocusRemove",
      "focusout @ui.removeBtn": "onFocusoutRemove",
      "keydown @ui.removeBtn": "keydownOnRemove"
    },
    onClickRemove: function() {
      this._parentLayoutView().options.selectedNodes.remove(this.model);
      this.$el.addClass("binf-hidden");
      this._parent.children.remove(this);
      this._parentLayoutView().trigger("childView:refresh");
    },
    onFocusRemove: function(e) {
      var el = $(e.target);
      e.target.focus();
      el.parent().addClass("active");
    },
    onFocusoutRemove: function(e) {
      var el = $(e.target);
      el.parent().removeClass("active");
    },
    keydownOnRemove: function(e) {
      if (e.keyCode === 32 || e.keyCode === 13) {
        $(e.currentTarget).click();
      }
    },
    findTypesWithAncestors: function(typeName) {
      let typeData = RestResources.getDctmTypeData().superTypes;
      let returnList = [];
      while (typeName !== undefined) {
        returnList.push(typeName);
        typeName = typeData[typeName];
      }
      return returnList;
    },
    validate: function(relationType) {
      var validateFlag = true;
      var typeList = this.findTypesWithAncestors(this.options.model.get("rObjectType") || this.options.model.get("r_object_type"));
      if (!typeList.includes(relationType)) {
        validateFlag = false;
        this.ui.helpText.removeClass("binf-hidden");
      } else {
        this.ui.helpText.addClass("binf-hidden");
      }
      return validateFlag;
    }
  });
  var RelationChildListView = SimpleListView.extend({
    constructor: function RelationChildListView(options) {
      var collection;
      this.options = options || {};
      this.options.collection = undefined;
      if (this.options.isChildCollection) {
        this.options.childViewTemplate = childItemTemplate;
        collection = _.map(this.options.selectedNodes.models, function(node) {
          return node.set("InvalidTypeErrorMsg", lang.InvalidTypeErrorMsg);
        });
      } else {
        this.options.childViewTemplate = parentItemTemplate;
        this.options.node.set("InvalidTypeErrorMsg", lang.InvalidTypeErrorMsg);
        collection = [ this.options.node ];
      }
      this.options.data = {
        items: collection
      };
      SimpleListView.apply(this, arguments);
    },
    validate: function(relationType) {
      var validateFlag = true;
      this.children.each(function(item) {
        if (!item.validate(relationType)) {
          validateFlag = false;
        }
      });
      return validateFlag;
    },
    childView: RelationChildItemView
  });
  return RelationChildListView;
});