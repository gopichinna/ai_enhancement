/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "hbs!csui/controls/conflict.resolver/impl/collection.conflicts/collection.conflicts", "hbs!csui/controls/conflict.resolver/impl/collection.conflicts/collection.conflict.item", "csui/controls/node-type.icon/node-type.icon.view", "i18n!csui/controls/conflict.resolver/impl/nls/lang", "css!csui/controls/conflict.resolver/impl/collection.conflicts/conflicts.dialog" ], function(_, $, Marionette, template, conflictItemTemplate, NodeTypeIconView, lang) {
  "use strict";
  var CollectionConflictItemView = Marionette.ItemView.extend({
    tagName: "li",
    template: conflictItemTemplate,
    className: "csui-conflict-item",
    templateHelpers: function() {
      var data = {
        conflictsItemsName: this.model.get("name")
      };
      return data;
    },
    constructor: function CollectionConflictItemView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    onRender: function() {
      this._nodeIconView = new NodeTypeIconView({
        el: this.$(".csui-type-icon").get(0),
        node: this.model.node
      });
      this._nodeIconView.render();
    }
  });
  var CollectionConflictsView = Marionette.CompositeView.extend({
    template: template,
    className: "csui-conflicts-items-data",
    childView: CollectionConflictItemView,
    childViewContainer: "#csui-collection-conflict-items",
    ui: {
      conflictItems: "#csui-collection-conflict-items"
    },
    templateHelpers: function() {
      var data = {
        conflictsItemsTitle: lang.conflictsItemsHeader
      };
      return data;
    },
    constructor: function CollectionConflictsView(options) {
      options || (options = {});
      this.collection = options.collection || {};
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this._onSetContaintListHeight = _.bind(this._setContainerListHeight, this);
      $(window).on("resize.app", this._onSetContaintListHeight);
    },
    onDomRefresh: function() {
      this._setContainerListHeight();
    },
    _setContainerListHeight: function() {
      var winHeight = $(window).height() * .9 - 100 - 60 - 112 + "px";
      $(".csui-collection-conflict-items").css("max-height", winHeight);
    },
    onDestroy: function() {
      $(window).off("resize.app", this._onSetContaintListHeight);
    }
  });
  return CollectionConflictsView;
});