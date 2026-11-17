/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "d2/utils/constants", "d2/widgets/metadata/metadata.properties.view", "csui/controls/mixins/view.events.propagation/view.events.propagation.mixin" ], function(_, Marionette, constants, MetadataPropertiesView, ViewEventsPropagationMixin) {
  var MetadataPropertiesContentView = Marionette.ItemView.extend({
    className: "metadata-inner-wrapper",
    constructor: function MetadataPropertiesContentView(options) {
      this.options = options;
      Marionette.ItemView.prototype.constructor.call(this, options);
      var tabOptions = {
        context: this.options.context,
        node: this.options.node || this.options.model,
        containerCollection: this.options.containerCollection,
        metadataView: this.options.metadataView,
        blockingParentView: this.options.blockingParentView,
        selectedProperty: this.options.selectedProperty,
        notTabableRegion: true
      };
      this.childTabPanelView = new MetadataPropertiesView(tabOptions);
      this.propagateEventsToViews(this.childTabPanelView);
    },
    render: function() {
      this._ensureViewIsIntact();
      this.triggerMethod("before:render", this);
      var mdv = this.childTabPanelView.render();
      Marionette.triggerMethodOn(mdv, "before:show", mdv, this);
      this.$el.append(mdv.el);
      Marionette.triggerMethodOn(mdv, "show", mdv, this);
      this.triggerMethod("render", this);
      return this;
    },
    onBeforeDestroy: function() {
      this.childTabPanelView.destroy();
    },
    onPanelActivated: function() {
      this.childTabPanelView && this.childTabPanelView.triggerMethod("panel:activated");
    }
  }, {
    enabled: function(options) {
      return !(options.node.get("id") === constants.NodeId.FAVORITES);
    }
  });
  _.extend(MetadataPropertiesContentView.prototype, ViewEventsPropagationMixin);
  return MetadataPropertiesContentView;
});