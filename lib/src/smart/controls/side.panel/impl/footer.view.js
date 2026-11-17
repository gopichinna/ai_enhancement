/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "hbs!smart/controls/side.panel/impl/footer", "hbs!smart/controls/side.panel/impl/button", "smart/mixins/generic.utilities/footerview.responsiveness.mixin", "i18n!smart/controls/side.panel/impl/nls/lang", "smart/dialogs/impl/button/button.view", "smart/themes/jato.icons/smart.jato.action.icons", "css!smart/controls/side.panel/impl/side.panel" ], function(_, $, Backbone, Marionette, TabableRegion, template, btnTemplate, FooterViewResponsiveMixin, lang, SmartButtonView, jatoIcons) {
  var ButtonView = SmartButtonView.extend({
    onLastTabElement: function(shiftTab, event) {
      var last = this.$el.parents(".cs-footer-control").find("otc-button").last();
      return last.is(this.$el) && !shiftTab && last.is($(event.target));
    }
  });
  var ButtonsGroup = Marionette.CollectionView.extend({
    childView: ButtonView,
    className: "cs-sidepanel-btngroup smart-footer-btns-invisible",
    constructor: function ButtonsGroup(options = {}) {
      Marionette.CollectionView.apply(this, arguments);
      this.listenTo(this, "button:click", this.delegateEvent);
    },
    onDomRefresh: function() {
      this.children.each(function(SmartButtonView) {
        SmartButtonView.trigger("dom:refresh");
      });
    },
    delegateEvent: function(ele) {
      this.options.footerView.trigger("button:click button:click:" + ele.type, ele);
    },
    setResizer: function(e) {
      return this.options.footerView.checkResizer(e);
    }
  });
  var SidePanelFooterView = Marionette.LayoutView.extend({
    template: template,
    className: "cs-footer-control",
    regions: {
      leftContainer: ".cs-footer-left",
      rightContainer: ".cs-footer-right"
    },
    templateHelpers: function() {
      return {};
    },
    constructor: function SidePanelFooterView(options = {}) {
      Marionette.LayoutView.apply(this, arguments);
      this.leftCollection = new Backbone.Collection();
      this.rightCollection = new Backbone.Collection();
      this.listenTo(this, "update:footer", this.updateFooter);
    },
    checkResizer: function(e) {
      var parent = this._parent._parent;
      var tabResizer = e.shiftKey && parent._parent.options.layout.resize && parent._parent.ui.resizer.is(document.activeElement) && parent._parent.flag;
      var shiftTabResizer = !e.shiftKey && !parent._parent.options.layout.header && parent._parent.options.layout.resize && parent._parent.ui.resizer.is(document.activeElement) && parent._parent.flag;
      if (tabResizer || shiftTabResizer) {
        return parent._parent.ui.resizer;
      }
      return 0;
    },
    onRender: function() {
      var options = {
        sidePanelView: this.options.parentView,
        footerView: this
      };
      this.leftGroup = new ButtonsGroup(_.extend(options, {
        collection: this.leftCollection
      }));
      this.rightGroup = new ButtonsGroup(_.extend(options, {
        collection: this.rightCollection
      }));
      this.rightGroup.completeCollection = new Backbone.Collection();
      this.rightGroup.completeCollection.add(this.rightCollection.toJSON(), {
        silent: true
      });
      this.leftContainer.show(this.leftGroup);
      this.rightContainer.show(this.rightGroup);
      this.listenTo(this.rightGroup.completeCollection, "reset", _.bind(function() {
        this.rightGroup.flag = true;
      }, this));
      this.listenTo(this.rightGroup.completeCollection, "change update", _.bind(function() {
        this.rightGroup.flag = true;
        this.expand();
        this.options.parentView.trigger("update:footerview");
      }, this));
      this.listenTo(this.leftGroup, "childview:click", this._onButtonClick);
      this.listenTo(this.rightGroup, "childview:click", this._onButtonClick);
    },
    _onButtonClick: async function(btnView) {
      var btn = btnView.model;
      if (!btn) {
        return;
      }
      const eventArgs = {
        cancel: false
      };
      this.trigger("before:button:click before:button:click:" + btn.get("type"), btn.attributes, eventArgs);
      if (eventArgs.wait) {
        await eventArgs.wait;
      }
      if (eventArgs.cancel) {
        return;
      }
      this.trigger("button:click button:click:" + btn.get("type"), btn.attributes, eventArgs);
    },
    update: function(options) {
      var footerOptions = options.slide.footer || _.pick(options.slide, "buttons", "leftButtons", "rightButtons"), leftButtons = footerOptions.leftButtons || [], rightButtons = footerOptions.rightButtons || [];
      if (footerOptions.hide) {
        this.$el.addClass("binf-hidden");
      } else {
        this.$el.removeClass("binf-hidden");
      }
      if (_.isArray(footerOptions.buttons)) {
        rightButtons = Array.prototype.concat(rightButtons, footerOptions.buttons);
      }
      if (options.slideIndex > 0 && !options.hideBackButton) {
        this._addButtonIfNotFound(leftButtons, 0, {
          toolTip: lang.btnBack,
          type: SmartButtonView.BTN_TYPE_BACK,
          arialabel: _.str.sformat(lang.backBtnAria, options.prevSlide?.title),
          classes: "cs-go-back",
          icon: "smart_action:action_back32",
          jatoIcon: jatoIcons.actionArrowLeft
        });
      }
      if (options.slideIndex + 1 < options.totalSlides && !options.hideNextButton) {
        this._addButtonIfNotFound(rightButtons, rightButtons.length, {
          variant: "primary",
          type: SmartButtonView.BTN_TYPE_NEXT,
          label: lang.btnNext
        });
      }
      if (!options.hideCancelButton) {
        this._addButtonIfNotFound(rightButtons, rightButtons.length, {
          variant: "secondary",
          type: SmartButtonView.BTN_TYPE_CANCEL,
          id: "csui-side-panel-cancel",
          label: this.options.footerButtonLabel ? this.options.footerButtonLabel : lang.btnCancel
        });
      }
      this.leftCollection.reset(leftButtons);
      this.rightCollection.reset(rightButtons);
      this.rightGroup.completeCollection.reset(this.rightCollection.models);
      this.options.parentView.trigger("update:footerview");
    },
    _addButtonIfNotFound: function(buttons, index, options) {
      var found = _.find(buttons, function(btn) {
        return btn.type === options.type;
      });
      if (!found) {
        buttons.splice(index, 0, options);
      }
    },
    updateButton: function(id, attributes) {
      var button = this.leftCollection.get(id) || this.rightCollection.get(id);
      var activeElement = $(document.activeElement);
      if (button) {
        button.set(attributes);
        activeElement.attr("type") === "text" && !!activeElement.val() && activeElement.trigger("focus");
      }
    },
    onDomRefresh: function() {
      this.leftGroup.triggerMethod("dom:refresh");
      this.rightGroup.triggerMethod("dom:refresh");
      this.options.parentView.trigger("update:footerview");
    },
    updateFooter: function() {
      this.rightGroup.$el.find("otc-button").each(async otcBtn => {
        await otcBtn.updateComplete;
      });
      var availableWidth = this.$el.width() - this.leftGroup.$el.width() - 40;
      if (this.$el.is(":visible")) {
        this.updateFooterView(this.rightGroup, availableWidth);
      }
      this.trigger("focusin:footer");
    }
  });
  _.extend(SidePanelFooterView.prototype, FooterViewResponsiveMixin);
  return SidePanelFooterView;
});