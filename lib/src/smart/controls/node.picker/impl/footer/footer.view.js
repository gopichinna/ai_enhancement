/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "smart/controls/node.picker/impl/footer/apply.properties.selector/apply.properties.selector.view", "smart/controls/dialog/footer.view", "hbs!smart/controls/node.picker/impl/footer/footer", "i18n!smart/controls/node.picker/impl/nls/lang", "nuc/lib/handlebars.helpers.xif", "css!smart/controls/node.picker/impl/footer/footer" ], function(_, $, Marionette, Backbone, ViewEventsPropagationMixin, TabableRegionBehavior, ApplyPropertiesSelectorView, DialogFooterView, footerTemplate, lang) {
  var NodePickerFooterView = Marionette.LayoutView.extend({
    template: footerTemplate,
    className: "cs-footer-control",
    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabableRegionBehavior,
        recursiveNavigation: true,
        containTabFocus: true
      }
    },
    regions: {
      selectedItemsInfoRegion: ".csui-selected-items",
      buttonsRegion: ".csui-footer-buttons",
      properties: ".apply-properties-selector"
    },
    templateHelpers: function() {
      return {
        propertiesSeletor: this.propertiesSeletor
      };
    },
    isTabable: function() {
      return this.$("*[tabindex]").length > 0;
    },
    constructor: function NodePickerFooterView(options) {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
    },
    initialize: function() {
      var options = this.options, buttons = options.buttons ? options.buttons : [], footerView = this.footerView = new DialogFooterView({
        collection: new Backbone.Collection(buttons)
      });
      this.propertiesSeletor = !options.applyPropertiesOptions && options.hideOpenPropertiesPage === true ? false : options.applyPropertiesOptions?.length === 0 && options.hideOpenPropertiesPage === true ? false : options.propertiesSeletor ?? false;
      var defaultApplyPropertiesOption = this.options.defaultPropertySelector || this.options?.applyPropertiesOptions?.[0]?.id;
      if (this.propertiesSeletor) {
        this.propertiesView = new ApplyPropertiesSelectorView({
          selected: defaultApplyPropertiesOption,
          applyPropertiesOptions: this.options?.applyPropertiesOptions,
          defaultPropertySelector: this.options?.defaultPropertySelector,
          hideOpenPropertiesPage: this.options.hideOpenPropertiesPage
        });
      }
      this.listenTo(footerView, "childview:click", this.onClickButton);
      this.listenTo(this, "selectedItems:updateCount", this.updateSelectedItems);
    },
    onRender: function() {
      if (this.propertiesView) {
        this.properties.show(this.propertiesView);
      }
      this.buttonsRegion.show(this.footerView);
    },
    updateButton: function(id, options) {
      var footerView = this.footerView;
      footerView.updateButton(id, options);
    },
    onClickButton: function(view) {
      var attributes = view.model.attributes;
      if (attributes.click) {
        attributes.click({
          dialog: this,
          button: this.$el
        });
      }
      if (attributes.close) {
        this.destroy();
      }
    },
    onDomRefresh: function() {
      if (this.propertiesView) {
        this.propertiesView.trigger("dom:refresh");
      }
    },
    onBeforeDestroy: function() {
      this.footerView.destroy();
    }
  });
  _.extend(NodePickerFooterView.prototype, ViewEventsPropagationMixin);
  return NodePickerFooterView;
});