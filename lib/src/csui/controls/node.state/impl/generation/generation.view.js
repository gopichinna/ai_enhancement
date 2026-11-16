/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette3", "csui/utils/nodesprites", "hbs!csui/controls/node.state/impl/generation/impl/generation", "i18n!csui/controls/node.state/impl/generation/impl/nls/localized.strings", "css!csui/controls/node.state/impl/generation/impl/generation", "csui/controls/icons.v2" ], function(_, Marionette, NodeSpriteCollection, template, lang) {
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
        iconName: nodeSprite.get("iconName"),
        className: nodeSprite.get("className"),
        size: "small"
      };
      return this.generationStatus;
    },
    constructor: function VersionIconView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    }
  }, {
    enabled: function(status) {
      var model = status.node, generation = model.has("has_generation") && model.get("has_generation");
      return generation;
    }
  });
  return VersionIconView;
});