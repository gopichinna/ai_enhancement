/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette3", "csui/utils/nodesprites", "csui/controls/node-type.icon/node-type.icon.item.view.mixin", "smart/themes/theming", "hbs!csui/controls/node.state/impl/generation/impl/generation", "i18n!csui/controls/node.state/impl/generation/impl/nls/localized.strings", "css!csui/controls/node.state/impl/generation/impl/generation", "csui/controls/icons.v2" ], function(_, Marionette, NodeSpriteCollection, NodeTypeIconItemViewMixin, theming, template, lang) {
  "use strict";
  var VersionIconView = Marionette.View.extend({
    tagName: "li",
    className: "csui-node-state-generation",
    template: template,
    templateContext: function() {
      var generation = this.model.get("has_generation");
      let nodeSprite = NodeSpriteCollection.findByNode(this.model);
      this.generationStatus = {
        generation: generation,
        generationTooltip: lang.Generation,
        generationAria: lang.Generation,
        iconTheme: this.options.useIconsForDarkBackground ? "dark" : "",
        isJATO: theming.isJATOTheme(),
        iconName: nodeSprite.get("iconName"),
        className: nodeSprite.get("className"),
        size: "small"
      };
      return this.generationStatus;
    },
    constructor: function VersionIconView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      if (theming.isJATOTheme()) {
        this.renderNodeTypeIconView(this.model, this.$el.find(".csui-node-type-icon"), "", "", {
          title: lang.Generation
        });
      }
    }
  }, {
    enabled: function(status) {
      var model = status.node, generation = model.has("has_generation") && model.get("has_generation");
      return generation;
    }
  });
  NodeTypeIconItemViewMixin.mixin(VersionIconView.prototype);
  return VersionIconView;
});