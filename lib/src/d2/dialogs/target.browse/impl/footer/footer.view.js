/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "d2/controls/dialog/impl/footer.view", "hbs!d2/dialogs/target.browse/impl/footer/footer", "hbs!d2/dialogs/target.browse/impl/footer/displayedItems.info", "i18n!d2/dialogs/target.browse/impl/nls/lang", "nuc/lib/handlebars.helpers.xif", "css!d2/dialogs/target.browse/impl/footer/footer" ], function(_, $, Marionette, Backbone, ViewEventsPropagationMixin, TabableRegionBehavior, DialogFooterView, footerTemplate, displayedItemsMessageTemplate, lang) {
  var NodePickerDisplayedItemsMessageView = Marionette.ItemView.extend({
    template: displayedItemsMessageTemplate,
    className: "d2-displayItems-message",
    templateHelpers: function() {
      var displayItems = this.displayItems || this.options.displayItems, hasMoreRecords = this.hasMoreRecords || this.options.hasMoreRecords, displayItemsMessage = "", moreRecordTitle = "";
      if (!displayItems) {
        displayItemsMessage = lang.searchFoundZero;
      } else if (displayItems === 1) {
        displayItemsMessage = _.str.sformat(lang.DisplayCountOneMessage, displayItems);
      } else {
        displayItemsMessage = _.str.sformat(lang.DisplayCountManyMessage, displayItems);
      }
      if (this.options.hasMoreRecords) {
        moreRecordTitle = _.str.sformat(lang.TotalItemNotification, displayItems, this.options.totalItems);
      }
      var data = {
        displayItemsMessage: displayItemsMessage,
        moreRecordTitle: moreRecordTitle,
        hasMoreRecords: hasMoreRecords
      };
      return data;
    },
    constructor: function NodePickerSelectedItemsMessageView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.call(this, options);
    }
  });
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
      displayedItemsInfoRegion: ".d2-displayed-items",
      buttonsRegion: ".d2-footer-buttons"
    },
    ui: {
      maxSelectionExceedMessage: ".d2-max-selection-exceed-message"
    },
    isTabable: function() {
      return this.$("*[tabindex]").length > 0;
    },
    constructor: function NodePickerFooterView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
    },
    initialize: function() {
      var options = this.options, buttons = options.buttons ? options.buttons : [], footerView = this.footerView = new DialogFooterView({
        collection: new Backbone.Collection(buttons)
      });
      this.collection = this.completeCollection = new Backbone.Collection();
      this.messageView = new NodePickerDisplayedItemsMessageView(_.extend({}, {
        displayItems: 0
      }));
      this.listenTo(footerView, "childview:click", this.onClickButton);
      this.listenTo(this, "browserItems:changed", this.updateDisplayedItems);
      this.listenTo(this, "max:selection:exceed", this.maxSelectionExceed);
      this.listenTo(this, "browserItems:clear", this.clearDisplayedItems);
    },
    onRender: function() {
      this.buttonsRegion.show(this.footerView);
    },
    updateButton: function(id, options) {
      var footerView = this.footerView;
      footerView.updateButton(id, options);
    },
    _addChildView: function() {},
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
    updateDisplayedItems: function(collection) {
      if (collection && collection.hasMoreRecords && !collection.searchView) {
        this.messageView = new NodePickerDisplayedItemsMessageView(_.extend({}, {
          displayItems: collection.filteredCount,
          isMultiSelectEnabled: this.options.isMultiSelectEnabled,
          totalItems: collection.totalFromServer,
          hasMoreRecords: collection.hasMoreRecords
        }));
        this.displayedItemsInfoRegion.show(this.messageView);
      } else {
        this.clearDisplayedItems();
      }
    },
    maxSelectionExceed: function(status, exceedBy) {
      var maxSelectionExceedMessage;
      if (status) {
        maxSelectionExceedMessage = exceedBy === 1 ? _.str.sformat(lang.MaxSelectionExceededMessageSingular, exceedBy) : _.str.sformat(lang.MaxSelectionExceededMessagePlural, exceedBy);
        this.ui.maxSelectionExceedMessage.text(maxSelectionExceedMessage);
      } else {
        this.ui.maxSelectionExceedMessage.text("");
      }
    },
    clearDisplayedItems: function() {
      var displayItemMessage = this.$el.find(".d2-displayItems-message");
      if (displayItemMessage) {
        displayItemMessage.empty();
      }
    },
    onBeforeDestroy: function() {
      this.footerView.destroy();
      this.messageView.destroy();
    }
  });
  _.extend(NodePickerFooterView.prototype, ViewEventsPropagationMixin);
  return NodePickerFooterView;
});