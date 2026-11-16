/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/pman.panel',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-tab-pannel csui-normal-scrolling\">\n  <div class=\"csui-layout-tab\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"layoutTabTitle") : depth0), depth0))
    + "\">\n    "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"layoutTabTitle") : depth0), depth0))
    + "\n  </div>\n  <div class=\"csui-AddWidget-tab\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"widgetTabTitle") : depth0), depth0))
    + "\">\n    "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"widgetTabTitle") : depth0), depth0))
    + "\n  </div>\n  <div class=\"csui-widget-tab\"></div>\n</div>\n<div class=\"csui-list-pannel csui-normal-scrolling\"></div>\n<div class=\"csui-template-overlay\"></div>\n<div class=\"csui-template-wrapper\">\n  <div class=\"csui-widget-template\">\n    <div class=\"csui-template-header\"></div>\n    <div class=\"csui-template-body\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"templateMessage") : depth0), depth0))
    + "</div>\n  </div>\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_pman.panel', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/impl/pman.panel',[],function(){});

csui.define('csui/perspective.manage/impl/pman.panel.view',['require', 'module', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/underscore', 'csui/lib/marionette',
  "csui/controls/progressblocker/blocker",
  'csui/perspective.manage/impl/widget.list.view',
  'csui/perspective.manage/impl/perspectivelayouts',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/pman.panel',
  'hbs!csui/perspective.manage/impl/list.item',
  'hbs!csui/perspective.manage/impl/list',
  'hbs!csui/perspective.manage/impl/widget.drag.template',
  'css!csui/perspective.manage/impl/pman.panel'

], function (require, module, $, Backbone, _, Marionette, BlockerView,
    WidgetListView, perspectiveLayouts, Lang, template, ListItemTemplate, ListTemplate,
    WidgetDragTemplate) {
  'use strict';

  var PManPanelView = Marionette.ItemView.extend({
    tagName: 'div',

    template: template,

    events: {
      'click @ui.layoutTab': "onTabClicked",
      'keydown @ui.layoutTab': "onKeyDown"
    },

    ui: {
      tabPannel: ".csui-tab-pannel",
      listPannel: ".csui-list-pannel",
      layoutTab: ".csui-layout-tab",
      widgetTab: ".csui-widget-tab",
      template: ".csui-widget-template"
    },

    className: 'csui-pman-panel',

    templateHelpers: function () {
      return {
        layoutTabTitle: Lang.layoutTabTitle,
        widgetTabTitle: Lang.widgetTabTitle,
        templateMessage: Lang.templateMessage
      }
    },

    onPanelOpen: function () {
      this.accordionView.triggerMethod("init:widgets");
    },

    onRender: function () {
      this.ui.widgetTab.hide();
      this.ui.layoutTab.hide();
      this.accordionRegion = new Marionette.Region({
        el: this.ui.widgetTab
      });
      this.accordionView = new WidgetListView(this.options);
      this.accordionRegion.show(this.accordionView);
      this.blockActions();
      this.listenTo(this.accordionView, "items:fetched", function () {
        this.unblockActions();
        this.ui.layoutTab.show();
        this.ui.widgetTab.show();
      });
    },

    constructor: function PManPanelView(options) {
      this.options = options || {};
      this.options.existsWidgetTypes = this._getExistsWidgetTypes() || [];
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      BlockerView.imbue(this);
      this.listenTo(this, 'reset:items', function () {
        this.listView && this.listView.destroy();
      });
    },

    _getExistsWidgetTypes: function () {
      var perspective       = this.options.pmanView.perspective.get('perspective'),
          type              = perspective.type,
          perpeCollection   = {},
          existsWidgetTypes = [];

      //Handling 'flow' and 'LCR' perspectives as these two only support edit page.
      if (type == 'flow') {
        perpeCollection = perspective.options;
        perpeCollection.widgets.forEach(
            _.bind(function (widget) {
              if (!!widget.type) {
                existsWidgetTypes.push(widget.type);
              }
            }, this));
      } else if (type == 'left-center-right') {
        perpeCollection = perspective.options;
        perpeCollection.center && existsWidgetTypes.push(perpeCollection.center.type);
        perpeCollection.right && existsWidgetTypes.push(perpeCollection.right.type);
        perpeCollection.left && existsWidgetTypes.push(perpeCollection.left.type);
      }
      return existsWidgetTypes;
    },

    onTabClicked: function (options) {
      var args = options.data ? options : {
        data: {
          items: perspectiveLayouts
        }
      };
      args.draggable = !!args.data.draggable;
      args.itemClassName = "csui-layout-item";
      args.pmanView = this.options.pmanView;

      this.ui.tabPannel.addClass("binf-hidden");
      this.listregion = new Marionette.Region({
        el: this.ui.listPannel
      });
      this.listView = new ListView(args);
      this.listregion.show(this.listView);
      this.$el.find('.cs-go-back').attr('tabindex', 0);
      var ele = this.$el.find('.csui-layout-item.binf-active');
      $(ele[0]).attr('tabindex', 0);
      ele.focus();
      // Register events on listview to handle back
      this.listenTo(this.listView, "before:destroy", function () {
        this.ui.tabPannel.removeClass("binf-hidden");
      }).listenTo(this.listView, "click:back", function () {
        this.listView.destroy();
      });
    },

    onKeyDown: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.onTabClicked(event);
      }
    }
  });

  var ListItemView = Marionette.ItemView.extend({
    constructor: function ListItemView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    tagName: 'div',
    template: ListItemTemplate,

    templateHelpers: function () {
      return {
        draggable: !!this.options.draggable,
        className: this.options.itemClassName,
        iconClass: this.model.get('icon')
      }
    },

    events: {
      'click .csui-layout-item:not(.binf-active)': _.debounce(function () {
        this.trigger('change:layout');
      }, 200, true),
      'keydown .csui-layout-item': _.debounce(function (event) {
        if (event.keyCode === 13 || event.keyCode === 32) {
          this.trigger('change:layout');
        } else if (event.keyCode === 9 || event.keyCode === 16) {
          this.$el.find('.csui-layout-item').attr('tabindex', -1);
          //this.$el.find('.csui-layout-item').removeClass('binf-active');
          if (event.keyCode === 9 && event.shiftKey) {
            event.preventDefault();
            this.options.pmanView.$el.find('.cs-go-back').focus();
          } else if (event.keyCode === 9) {
            event.preventDefault();
            $(this.options.pmanView.$el.find('.binf-btn.icon-save')).focus();
            $(this.options.pmanView.$el.find('.csui-layout-item.binf-active')[0]).attr('tabindex', 0);
          } else if (!event.shiftKey) {
            $(this.options.pmanView.$el.find('.csui-layout-item.binf-active')[0]).attr('tabindex', 0);
          }
        } else {
          this.handleKeydown(event);
        }
      }, 200, true),
    },

    handleKeydown: function (event) {
        if (event.keyCode === 38 || event.keyCode === 40) {
          this.$el.find('.csui-layout-item').attr('tabindex', -1);
          event.preventDefault();
          event.stopPropagation();
          if (event.keyCode === 38) { // up arrow key
            var previousEle = this.$el.prev().find('.csui-layout-item');
            if (previousEle.length > 0) {
              previousEle.trigger('focus');
            }
          } else if (event.keyCode === 40) { // down arrow key
            var nextEle = this.$el.next().find('.csui-layout-item');
            if (nextEle.length > 0) {
              nextEle.trigger('focus');
            }
          }
        }
    },

    onRender: function () {
      if (this.model.get('type') === this.options.pmanView.perspective.get('perspective').type) {
        this.trigger('set:active');
      }
    }

  });

  var ListView = Marionette.CompositeView.extend({

    constructor: function ListView(options) {
      options || (options = {});
      options.data || (options.data = {});

      Marionette.CompositeView.call(this, options);

      // TODO: Deprecate this, or fix it, so that a collection can be created
      // without breaking the client
      // Passing a collection without knowing its model schema and identifier
      // is not possible in Backbone, where the collections should be indexed
      if (this.options.data && this.options.data.items) {
        if (!this.collection) {
          var ViewCollection = Backbone.Collection.extend({
            model: Backbone.Model.extend({
              idAttribute: null
            })
          });
          this.collection = new ViewCollection();
        }
        this.collection.add(this.options.data.items);
      }
    },

    ui: {
      back: '.cs-go-back'
    },
    className: 'csui-pman-list',

    events: {
      'click @ui.back': 'onClickBack',
      'keydown @ui.back': 'onKeyInView'
    },

    childEvents: {
      'change:layout': 'onChangeLayout',
      'set:active': 'setActive'
    },

    template: ListTemplate,

    templateHelpers: function () {
      return {
        goBackTooltip: Lang.goBackTooltip
      };
    },

    childViewContainer: '.cs-list-group',

    childView: ListItemView,

    childViewOptions: function () {
      return this.options;
    },

    onClickBack: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.trigger('click:back');
    },

    onKeyInView: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.onClickBack(event);
        this.options.pmanView.$el.find('.csui-layout-tab').focus();
      } else if (event.keyCode === 9) {
        if (!event.shiftKey) {
          event.preventDefault();
          this.$el.find('.csui-layout-item.binf-active').focus();
        }
      }
    },

    setActive: function (childView) {
      this.$el.find('.csui-layout-item').removeClass('binf-active');
      childView.$el.find('.csui-layout-item').addClass('binf-active');
    },

    onChangeLayout: function (childView) {
      var self = this,
        newLayout = childView.model.get('type'),
        currentLayout = this.options.pmanView.perspective.get('perspective').type;
      if ((currentLayout === 'sidepanel-right' || currentLayout === 'sidepanel-left')
        && (newLayout === 'sidepanel-right' || newLayout === 'sidepanel-left')) {
        //swapping the layouts without any warning message and also retaining the widgets
        // while switching between sidepanel-left and sidepanel-right
        self.setActive(childView);
        self.options.pmanView.trigger("swap:layout", newLayout);
      }
      else {
        csui.require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlertView) {
          ModalAlertView.confirmWarning(Lang.changePageLayoutConfirmatonText, Lang.layoutTabTitle,
            {
              buttons: {
                showYes: true,
                labelYes: Lang.proceedButton,
                showNo: true,
                labelNo: Lang.changeLayoutCancelButton
              }
            })
            .done(function (labelYes) {
              if (labelYes) {
                self.setActive(childView);
                self.options.pmanView.trigger("change:layout", childView.model.get('type'));
                self.options.pmanView.context.trigger("reset:widget:panel");
              }
            });
        });
      }
    }

  });

  return PManPanelView;
});



csui.define('csui/perspectives/mixins/draganddrop.kn.mixin',["csui/lib/underscore", "csui/lib/jquery",'i18n'], function (_, $, i18n) {
  "use strict";

  var DragAndDropKNMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        moveToRight: function (movableEle, focusableEle, widgetCells) {
          var self = this, isRtl = i18n && i18n.settings.rtl,
              nextEle = movableEle.next();

          function callback() {
            movableEle && movableEle.insertAfter(nextEle);
            focusableEle && focusableEle.trigger("focus");
            self.swapIndexPositions(widgetCells, movableEle.index(), nextEle.index());
          }

          nextEle.length && this.animation(movableEle, nextEle, !isRtl, callback);
        },

        moveToLeft: function (movableEle, focusableEle, widgetCells) {
          var self = this, isRtl = i18n && i18n.settings.rtl,
              prevEle = movableEle.prev();

          function callback() {
            movableEle && movableEle.insertBefore(prevEle);
            focusableEle && focusableEle.trigger("focus");
            self.swapIndexPositions(widgetCells, movableEle.index(), prevEle.index());
          }
          prevEle.length && this.animation(movableEle, prevEle, isRtl, callback);
        },

        animation: function (movableEle, destEle, isMovingRight, callback) {
          var positions = this.findPositions(movableEle, destEle),
              isEleInSameRow = (positions.destEle.top === positions.movableEle.top),
              destEleWidth = destEle.width(),
              movableEleWidth = movableEle.width(),self = this,duration = 400;
          movableEle.css('zIndex', 99999);
          destEle.css('zIndex', 99998);
          if(self.isAnimationInProgress){
            /* stop current running animation*/
            duration = 0;
            this.movableEleAnimate && this.movableEleAnimate.stop();
            this.destEleAnimate && this.destEleAnimate.stop();
          }
          self.isAnimationInProgress = true;
          this.movableEleAnimate =  movableEle.animate(
            {
              left: isEleInSameRow &&
                    isMovingRight ? destEleWidth :
                    positions.destEle.left - positions.movableEle.left,
              top: isEleInSameRow ? 0 : positions.destEle.top - positions.movableEle.top,
            },
            {duration: duration, easing: "easeInOutCubic", queue: false}
          );
          this.destEleAnimate =  destEle.animate(
            {
              left: isEleInSameRow ?
                    isMovingRight ? positions.movableEle.left - positions.destEle.left :
                    movableEleWidth < destEleWidth ? movableEleWidth : destEleWidth :
                    positions.movableEle.left - positions.destEle.left,
              top: isEleInSameRow ? 0 : positions.movableEle.top - positions.destEle.top,
            },
            {duration: duration, easing: "easeInOutCubic", queue: false}
          );
         $.when(
          this.movableEleAnimate , this.destEleAnimate
          ).always(function () {
            self.isAnimationInProgress = false;
            movableEle.css({
              top: 0,
              left: 0,
              zIndex: 'initial'
            });
            destEle.css({
              top: 0,
              left: 0,
              zIndex: 'initial'
            });
            callback();
          });
        },

        swapIndexPositions: function (widgetCells, old_index, new_index) {
          var temp = widgetCells[old_index];
          widgetCells[old_index] = widgetCells[new_index];
          widgetCells[new_index] = temp;
          return widgetCells;
        },

        findPositions: function (movableEle, destEle) {
          return {
            movableEle: movableEle.offset(),
            destEle: destEle.offset()
          };
        }
      });
    },
  };

  return DragAndDropKNMixin;
});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/pman',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <li>\n            <button class=\"binf-btn icon-reset\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"reset") : depth0), depth0))
    + "\"\n                    aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"resetAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"reset") : depth0), depth0))
    + "</button>\n          </li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"pman-backdrop\"></div>\n<div class=\"pman-header\">\n  <div class=\"pman-header-backdrop\"></div>\n  <div class=\"pman-tools-container\">\n    <div class=\"pman-left-tools\">\n      <ul>\n        <li class=\"pman-toolitem icon-help-container\">\n          <button class=\"icon icon-help\" title=\"Help\"></button>\n        </li>\n        <li class=\"pman-toolitem toolbarAddContainer\">\n          <button class=\"icon icon-toolbarAdd\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"addWidget") : depth0), depth0))
    + "\"></button>\n        </li>\n      </ul>\n      <div class=\"pman-pannel-wrapper\"></div>\n    </div>\n    <div class=\"pman-right-tools\">\n      <ul>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"personalizeMode") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":18,"column":8},"end":{"line":23,"column":15}}})) != null ? stack1 : "")
    + "        <li>\n          <button class=\"binf-btn icon-save\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "\"\n                  aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"saveAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "</button>\n        </li>\n        <li>\n          <button class=\"binf-btn cancel-edit\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "\"\n                  aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancelAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "</button>\n        </li>\n      </ul>\n    </div>\n  </div>\n  <div class=\"pman-trash-area\">\n    <div class=\"pman-trash-banner\"></div>\n  </div>\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_pman', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/impl/pman',[],function(){});

csui.define('csui/perspective.manage/behaviours/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/perspective.manage/behaviours/impl/nls/root/lang',{
  deleteConfirmMsg: 'Widget will be removed from the page.',
  deleteConfirmTitle: 'Remove Widget',
  replaceConfirmMsg: 'Do you want to replace this widget?',
  replaceConfirmTitle: 'Replace Widget',
  widgetSizeTitle: 'Widget size',
  widgetSizeDescription: 'Determines how much space the widget occupies. Note that widgets are re-sized automatically to display optimally on smaller screens.',
  removeWidget: 'Remove widget',
  editWidget: 'Widget settings',
  replace: 'Replace',
  remove: 'Remove',
  cancel: 'Cancel',
  configNeeded: 'Configuration needed.',
  hideWidget: 'Hide',
  showWidget: 'Display',
  personalizeModewidgetFocusLabel: '{0} widget. Press Enter to access {1} action. Press Ctrl+ Right or Left Arrow to move the widget to the right or left .',
  personalizeShortcutwidgetFocusLabel: '{0}. Press Enter to access {1} action. Press Ctrl+ Right or Left Arrow to move the widget to the right or left .',
  editModewidgetFocusLabel: '{0} widget. Press Enter to access associated actions. Press Ctrl+ Right or Left  Arrow to move the widget to the right or left.',
  widgetSettings: '{0} widget settings',
  objects: '{0} widget shows {0} objects of the current user',
  delete: 'remove {0} Widget',
  hideWidgetAriaLabel: 'Hide {0} Widget',
  showWidgetriaLabel: 'Display {0} Widget',
  info: 'Info about {0}'
});




/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/behaviours/impl/widget.masking',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-pman-widget-error\">\n      <div class=\"csui-pman-widget-error-heading\"> "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetTitle") || (depth0 != null ? lookupProperty(depth0,"widgetTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetTitle","hash":{},"loc":{"start":{"line":7,"column":51},"end":{"line":7,"column":66}}}) : helper)))
    + "</div>\n      <div class=\"csui-pman-widget-error-body\">\n        <div class=\"csui-pman-widget-error-icon\"></div>\n        <div class=\"csui-pman-widget-error-message\"> "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"configNeeded") || (depth0 != null ? lookupProperty(depth0,"configNeeded") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"configNeeded","hash":{},"loc":{"start":{"line":10,"column":53},"end":{"line":10,"column":69}}}) : helper)))
    + "</div>\n      </div>\n    </div>\n    <div class=\"csui-pman-perspective-actions\">\n      <button class=\"csui-pman-perspective-btn csui-pman-widget-edit icon-edit\"\n              title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"editWidget") || (depth0 != null ? lookupProperty(depth0,"editWidget") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"editWidget","hash":{},"loc":{"start":{"line":15,"column":21},"end":{"line":15,"column":35}}}) : helper)))
    + "\"></button>\n      <button class=\"csui-pman-perspective-btn csui-pman-widget-close clear-icon\"\n              title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"removeWidget") || (depth0 != null ? lookupProperty(depth0,"removeWidget") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"removeWidget","hash":{},"loc":{"start":{"line":17,"column":21},"end":{"line":17,"column":37}}}) : helper)))
    + "\"></button>\n    </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-pman-widget-personalize-mask text-center\">\n      <button class=\"binf-btn csui-pman-personalize-btn csui-pman-hide-show-toggle\"\n              title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"hideShowToggle") || (depth0 != null ? lookupProperty(depth0,"hideShowToggle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"hideShowToggle","hash":{},"loc":{"start":{"line":22,"column":21},"end":{"line":22,"column":39}}}) : helper)))
    + "\"\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isWidgetHidden") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(6, data, 0),"loc":{"start":{"line":23,"column":8},"end":{"line":27,"column":15}}})) != null ? stack1 : "")
    + "      >"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"hideShowToggle") || (depth0 != null ? lookupProperty(depth0,"hideShowToggle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"hideShowToggle","hash":{},"loc":{"start":{"line":28,"column":7},"end":{"line":28,"column":25}}}) : helper)))
    + "\n      </button>\n    </div>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"showWidgetriaLabel") || (depth0 != null ? lookupProperty(depth0,"showWidgetriaLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"showWidgetriaLabel","hash":{},"loc":{"start":{"line":24,"column":26},"end":{"line":24,"column":48}}}) : helper)))
    + "\"\n";
},"6":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"hideWidgetAriaLabel") || (depth0 != null ? lookupProperty(depth0,"hideWidgetAriaLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"hideWidgetAriaLabel","hash":{},"loc":{"start":{"line":26,"column":26},"end":{"line":26,"column":49}}}) : helper)))
    + "\"\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-pman-popover-right csui-pman-popover-holder\"></div>\n<div class=\"csui-pman-popover-left csui-pman-popover-holder\"></div>\n<button class=\"binf-btn wrapper-button\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetName") || (depth0 != null ? lookupProperty(depth0,"widgetName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetName","hash":{},"loc":{"start":{"line":3,"column":52},"end":{"line":3,"column":66}}}) : helper)))
    + "\"></button>\n<div class=\"csui-pman-widget-masking\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isEditMode") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":5,"column":2},"end":{"line":31,"column":9}}})) != null ? stack1 : "")
    + "</div>\n\n";
}});
Handlebars.registerPartial('csui_perspective.manage_behaviours_impl_widget.masking', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/behaviours/impl/widget.masking',[],function(){});

/**
 * Responsibilities:
 *  - Masking the unit level widget of perpsective. In case of grid.view, it will be cell
 *  - Listen and handle DnD of widgets and act accordingly - replace widgets
 *  - Fire "replace:widget" on dropping of any widget
 *  - Deleting a widget from perspective
 *  - Configuration of widget using callouts
 *
 * Usage:
 *  - Should be applied to widgets of perspective to be able to configure them
 *
 * Required Inputs:
 *  - perspectiveView
 *  - widgetView
 *
 * Events:
 *  - replace:widget
 *    - Fires on perspectiveView
 *    - When dropping any widget from tools on perpsective widget
 *  - delete:widget
 *    - Fires on perspectiveView
 *    - When deleting a perspective widget
 *  - update:widget:size
 *    - Firex Fires on perspectiveView
 *    - When change in size of widget
 *  - update:widget:config
 *    - Firex Fires on perspectiveView
 *    - When widget configuration options updated
 */
csui.define('csui/perspective.manage/behaviours/pman.widget.config.behaviour',['require', 'i18n', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/utils/base', 'csui/lib/backbone', 'csui/utils/log',
  'csui/models/widget/widget.model',
  'csui/perspective.manage/impl/options.form.view',
  'i18n!csui/perspective.manage/behaviours/impl/nls/lang',
  'hbs!csui/perspective.manage/behaviours/impl/widget.masking',
  'csui/utils/perspective/perspective.util',
  'css!csui/perspective.manage/behaviours/impl/widget.masking',
], function (require, i18n, _, $, Marionette, base, Backbone, log, WidgetModel,
    WidgetOptionsFormView, lang, maskingTemplate, PerspectiveUtil) {
  'use strict';

  var DEFAULTS = {
    removeConfirmMsg: lang.deleteConfirmMsg,
    removeConfirmTitle: lang.deleteConfirmTitle,
    configNeededMessage: lang.configNeeded,
    confirmOnRemove: true,
    allowReplace: true,
    notifyUpdatesImmediatly: false,
    perspectiveMode: 'edit'
  };

  /**
   * View to mask the perspective widget and handles the widget configuration
   */
  var WidgetMaskingView = Marionette.ItemView.extend({
    template: maskingTemplate,
    className: function () {
      var classNames = [WidgetMaskingView.className, 'csui-widget-focusable'];
      classNames.push('csui-pman-widget-mode-' + this.options.perspectiveMode);
      classNames.push(this._getStateClass());
      return _.unique(classNames).join(' ');
    },

    _getStateClass: function () {
      var isHidden = PerspectiveUtil.isHiddenWidget(this.options.widgetConfig),
          widgetState = isHidden ? 'hidden' : 'shown';
      return 'csui-pman-widget-state-' + widgetState;
    },

    templateHelpers: function () {
      var hideShowToggle = PerspectiveUtil.isHiddenWidget(this.options.widgetConfig) ?
                           lang.showWidget : lang.hideWidget;
      return {
        removeWidget: this.options.removeConfirmTitle,
        editWidget: lang.editWidget,
        widgetTitle: this.manifest && this.manifest.title,
        configNeeded: this.options.configNeededMessage,
        isEditMode: this.isEditPage(),
        isWidgetHidden: PerspectiveUtil.isHiddenWidget(this.options.widgetConfig),
        hideShowToggle: hideShowToggle,
        widgetName: this._getWidgetName(),
        hideWidgetAriaLabel: _.str.sformat(lang.hideWidgetAriaLabel, this._getWidgetName()),
        showWidgetriaLabel: _.str.sformat(lang.showWidgetriaLabel, this._getWidgetName())
      }
    },

    ui: {
      edit: '.csui-pman-widget-edit',
      delete: '.csui-pman-widget-close',
      masking: '.csui-pman-widget-masking',
      widgetTitle: '.csui-pman-widget-error-heading',
      wrapperButton: '.wrapper-button',
      hideShowToggle: '.csui-pman-hide-show-toggle'
    },

    configureEvents: {
      'click @ui.masking': '_showCallout',
      'click @ui.delete': 'onDeleteClick'
    },

    personalizationEvents: {
      'click @ui.hideShowToggle': '_onHideShowWidget'
    },

    events: function () {
      var evts = {
        'keydown': 'onKeyDown',
        'click @ui.wrapperButton': '_onClicked'
      };
      switch (this.options.perspectiveMode) {
      case 'edit':
        evts = _.extend(evts, this.configureEvents);
        if (!!this.options.allowReplace) {
          evts = _.extend(evts, {
            'drop': 'onDrop',
            'dragover': 'onDragOver',
            'dragenter': 'onDragEnter',
            'dragleave': 'onDragLeave'
          });
        }
        break;
      case 'personalize':
        evts = _.extend(evts, this.personalizationEvents);
        if (this.options.personalizable) {
          evts = _.extend(evts, this.configureEvents);
        }
        break;
      }
      return evts;
    },

    constructor: function WidgetMaskingView(options) {
      options = _.defaults(options, DEFAULTS);
      Marionette.ItemView.apply(this, arguments);
      this.dropCounter = 0;
      this.manifest = options.manifest;
      this.perspectiveView = options.perspectiveView;
      this.widgetView = options.widgetView;
      this.widgetConfig = options.widgetConfig;
      this.perspectiveMode = options.perspectiveMode;
      this.listenTo(this.widgetView, 'refresh:mask', this._doRefreshMask);
      this.listenTo(this.widgetView, 'reposition:flyout', function () {
        if (!!this.$popoverEl && this.$popoverEl.data('binf.popover')) {
          this._previousFocusElm = document.activeElement;
          this.$popoverEl.binf_popover('show');
          // restore focus on previous focusing element
          this.options.notifyUpdatesImmediatly && this._previousFocusElm &&
          $(this._previousFocusElm).trigger('focus');
        }
      });
    },

    _onClicked: function (event) {
      var $target = $(event.target);
      if ($target.is(this.$el.find('.wrapper-button'))) {
        this._enterConfiguration(event);
        return false;
      }
      return true;
    },

    handlePopoverClick:  function (event) {
       var self = event.data.view;
       self.writeFieldClicked = true;
    },

    onKeyDown: function (event) {
      var continueEvent = true,
          $target = $(event.target),
          isFormEvent = this.optionsFormView && this.optionsFormView.$el.has($target).length,
          cancelBtn = $('.perspective-editing .pman-header .cancel-edit'),
          perspective = $('.perspective-editing .cs-perspective-panel .cs-perspective'),
          isMac = base.isMacintosh(),
          superKey = isMac && event.metaKey && !event.ctrlKey || !isMac && !event.metaKey && event.ctrlKey;
      if (superKey && ($target.is('input:text') || $target.is('textarea'))) {
        event.stopPropagation();
      }
      //TODO: need to find a check to avoid clearFocuable everytime
      //this logic only happens in edit mode specific to KN, so perfomance wise low impact
      !this.widgetView.$el.find('.binf-popover').length &&
      base.clearFocusables(perspective.find('.tile, .csui-nodestable'));
      switch (event.keyCode) {
      case 13: // ENTER
      case 32: // SPACE
        if ($target.is(this.ui.hideShowToggle)) {
          continueEvent = this._onHideShowWidget();
        } else {
          continueEvent = this._onClicked(event);
        }
        break;
      case 27: // ESCAPE
        if (isFormEvent) {
          this._hideCallout();
          if (!this.options.useEnterToConfigure) {
            this.ui.edit && this.ui.edit.trigger('focus');
            continueEvent = false;
          }
        } else if (!this.options.useEnterToConfigure &&
                   !$target.is(this.$el.find('.wrapper-button'))) {
          this._exitConfiguration();
          continueEvent = false;
        }
        break;
      case 9: // TAB
        if (!isFormEvent && this.perspectiveMode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
          var $target = $(event.target);
          if (!$target.is(this.$el.find('.wrapper-button'))) {
            this.ui.delete.is(":focus") ? this.ui.edit.trigger('focus') :
            this.ui.delete.trigger('focus');
            continueEvent = false;
          }
        } else if (event.shiftKey && $target.is($('.wrapper-button').first())) {
          cancelBtn.trigger('focus');
          continueEvent = false;
        }
        if (event.shiftKey && $target.is($('.wrapper-button'))) {
          var index = $(document.activeElement).closest(
              '.csui-draggable-item.csui-pman-editable-widget').index(),
              widgetEle = $('.csui-dnd-container>.csui-pman-editable-widget'),
              prevWidgetEleTop = widgetEle.eq(index - 1).offset().top,
              isWidgetInSameRow = widgetEle.eq(index).offset().top === prevWidgetEleTop;
          if (!isWidgetInSameRow) {
            var scrollPosition = index < 0 ? 0 : prevWidgetEleTop - $('.pman-header').height();
            // $('html, body') is because of web browser inconsistency.  The browsers Firefox & IE utilize
            // the html portion , Safari and Chrome respond to the body
            $("html, body").animate({
              scrollTop: scrollPosition
            }, 0);
          }
        }
        break;
      default:
        if ($target.is('.csui-pman-perspective-btn') || $target.is('.csui-pman-personalize-btn')) {
          // Cancel all events on buttons - SHOW/HIDE/DELETE/EDIT
          continueEvent = false;
        }
      }
      return continueEvent;
    },

    _enterConfiguration: function (event) {
      this.$el.addClass('csui-pman-widget-active');
      if (this.options.useEnterToConfigure) {
        // For empty placeholder, pressing ENTER when the focus on it, the flyout should open directly
        this._showCallout(event);
      } else {
        this.$el.find('button:not(.wrapper-button):visible') &&
        this.$el.find('button:not(.wrapper-button):visible').first().trigger('focus');
      }
    },

    _exitConfiguration: function () {
      this.$el.removeClass('csui-pman-widget-active');
      this.ui.wrapperButton.trigger('focus');
      this._hideCallout();
    },

    _getWidgetName: function () {
      return this.manifest && this.manifest.title ? this.manifest.title :
             this.options && this.options.widgetConfig &&
             this.options.widgetConfig.type.split("/").pop();
    },

    _clearViewTabIndexes: function () {
      this.widgetView.$el.off();
      var that = this;
      function clearTabIndex() {
        var isHidden = PerspectiveUtil.isHiddenWidget(that.options.widgetConfig);
        !that.widgetView.$el.find('.binf-popover').length &&
        base.clearFocusables(that.widgetView.$el);
        var focusableEle = that.$el.find('.wrapper-button'),
            widgetFocusAriaLabel = that._getWidgetName(),
            notifyUpdatesImmediatly = that.options.notifyUpdatesImmediatly;
        if (that.options.ItemsInGroupAriaLabel) {
          widgetFocusAriaLabel = " " + that.options.ItemsInGroupAriaLabel;
          focusableEle = focusableEle
              .closest(".csui-draggable-item").children('.csui-pman-widget-mode-personalize')
              .find(".wrapper-button");
        }
        if (that.options.perspectiveMode === "edit" && !notifyUpdatesImmediatly) {
          widgetFocusAriaLabel = _.str.sformat(lang.editModewidgetFocusLabel, widgetFocusAriaLabel);
        } else {
          isHidden && focusableEle.attr('data-hidden', isHidden);
          var action = focusableEle.attr('data-hidden') ? lang.showWidget : lang.hideWidget,
              label = notifyUpdatesImmediatly ? lang.personalizeShortcutwidgetFocusLabel :
                      lang.personalizeModewidgetFocusLabel;
          widgetFocusAriaLabel = _.str.sformat(label, widgetFocusAriaLabel, action);
        }
        focusableEle
            .attr("tabindex", 0)
            .attr("aria-label", widgetFocusAriaLabel);
      }

      this.listenTo(this.widgetView, "dom:refresh", clearTabIndex);
      clearTabIndex();
    },

    _isConfigurable: function () {
      return !!this.widgetConfig && !_.isEmpty(this.widgetConfig) &&
             this.widgetConfig.type !== WidgetMaskingView.placeholderWidget &&
             this.widgetConfig.type !== 'csui/widgets/error';
    },

    isEditPage: function () {
      return this.perspectiveMode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE;
    },

    onRender: function () {
      if (!this._isConfigurable()) {
        this._clearViewTabIndexes();
        // Widget configuration not found. Hence cannot show callout
        return;
      }
      var self = this;
      this._loadManifest().done(function (manifest) {
        var configurableWidgetClass = manifest.hasConfigForm ? 'csui-widget-perspective-config' :
                                      'csui-widget-perspective-info';
        self.$el.addClass(configurableWidgetClass);

        if (self.options.perspectiveMode === "edit") {
          if (self.$el.parent().find(".cs-no-expanding").length) {
            self.ui.edit
                .attr(
                    "aria-label",
                    _.str.sformat(lang.objects, manifest.title)
                ).attr('title', _.str.sformat(lang.info, manifest.title));
          } else {
            self.ui.edit.attr(
                "aria-label",
                _.str.sformat(lang.widgetSettings, manifest.title)
            );
          }
          self.ui.delete.attr(
              "aria-label",
              _.str.sformat(lang.delete, manifest.title)
          );
        }
        self.ui.widgetTitle.text(manifest.title);
        if (self.manifest.selfConfigurable) {
          self._adoptToSelfConfigurableWidget();
        } else if (self.isEditPage() || self.options.personalizable) {
          self._clearViewTabIndexes();
          self._createOptionsForm(function () {
            if (this.isDestroyed) {
              // Masking destroyed even before form render. No action required.
              return;
            }
            var openCallout = !!self.widgetConfig.options &&
                              (self.widgetConfig.options.___pman_isdropped ||
                               self.widgetConfig.options.___pman_opencallout);
            var isWidgetReplaced = self._updateWidgetOptions(false, true);
            // Refresh form to remove validation error messages created by default validation (above statement)
            self.optionsFormView.refresh(function () {
              self.$el.addClass('cs-pman-callout-ready');
              self.$el.addClass('cs-pman-config-ready');
              if (openCallout && !isWidgetReplaced) {
                self._showOptionsCallout(manifest, true);
              }
            });
          });
        } else {
          self.$el.addClass('cs-pman-config-ready');
          self._clearViewTabIndexes();
        }
      });
    },

    onDestroy: function () {
      this.optionsFormView && this.optionsFormView.destroy();
    },

    _adoptToSelfConfigurableWidget: function () {
      if (!PerspectiveUtil.isEmptyPlaceholder(this.widgetConfig, this.perspectiveMode)
          && this.perspectiveMode === PerspectiveUtil.MODE_PERSONALIZE &&
          !PerspectiveUtil.isPersonalWidget(this.widgetConfig)) {
        // Though this widget self configurable, only personal widget can be configured in "Personalize Page".
        this._clearViewTabIndexes();
        return;
      }
      this.$el.addClass('csui-has-editing-capability');
      delete this.widgetConfig.options.___pman_isdropped;
      this.listenTo(this.widgetView, 'update:widget:options', function (options) {
        delete this.widgetConfig.options.___pman_isdropped;
        this._notifyConfigChanges(options, options.isValid, false);
      });
      this.listenTo(this.widgetView, 'remove:widget', this._doDeleteWidget);
      this.listenTo(this.widgetView, 'replace:widget', this.onDrop);
    },

    // Instead of re-rendering the whole mask, which would close flyout, just update DOM manually with titles, text changes etc.,
    _doRefreshMask: function (options) {
      this.options = _.extend({}, this.options, DEFAULTS, options);
      this.ui.delete.attr("title", this.options.removeConfirmTitle);
    },

    _showCallout: function (event) {
      if (this.isDestroyed) {
        return;
      }
      if (!this._isConfigurable()) {
        // Widget configuration not found. Hence cannot show callout
        return;
      }
      // To prevent default click action and open fly out
      event.preventDefault();
      event.stopPropagation();
      if (!!this.ui.delete.is(event.target)) {
        // avoid showing popover on click of remove widget icon
        return;
      }
      // open widget configuration callout
      this._loadManifest().done(function (manifest) {
        this._showOptionsCallout(manifest);
      }.bind(this));
      $('.perspective-editing .cs-perspective-panel .cs-field-write').off('click.' + this.cid).on(
        'mousedown.' + this.cid, {
          view: this
        },
        this.handlePopoverClick);
    },

    _showOptionsCallout: function (manifest, forceShow) {
      if (this.isDestroyed) {
        return;
      }
      //To resolve LPAD-73913 defect.
      if (base.isIE11() && !!document.activeElement) {
        document.activeElement.blur();
      }
      if (!!this.$popoverEl && this.$popoverEl.data('binf.popover')) {
        // Currently showing popover. Close it.
        this.$popoverEl.binf_popover('destroy');
        return;
      }
      if (this.$el.closest(".cs-perspective").find(".binf-popover").length) {
        this._closePopover();
        if (!forceShow) {
          // Callee asked to show flyout, hence, continue showing it. Dont return.
          return;
        }
      }
      this._calculatePopoverPlacement();

      if (!!this.optionsFormView) {
        // Toggle. Open popover with existing form.view
        this._showPopover();
      } else {
        this._createOptionsForm();
      }
    },

    _closePopover: function () {
      this.$el.closest(".cs-perspective").find('.' + WidgetMaskingView.className +
                                               ' .csui-pman-popover-holder').binf_popover(
          'destroy');
    },

    _createOptionsForm: function (afterRenderCallback) {
      this.optionsFormView = new WidgetOptionsFormView(_.defaults({
        context: this.perspectiveView.options.context,
        manifest: this.manifest
      }, this.options));
      if (!!afterRenderCallback) {
        this.optionsFormView.listenToOnce(this.optionsFormView, 'render:form', afterRenderCallback);
      }
      this.optionsFormView.render();
      this.optionsFormView.listenTo(this.optionsFormView, 'change:field',
          this._onChangeField.bind(this));
    },

    _calculatePopoverPlacement: function () {
      var adjust = this._determineCalloutPlacement();
      this.$popoverEl = this.$el.find('.csui-pman-popover-' + adjust.placement);
      if (adjust.mirror) {
        adjust.placement = adjust.placement == 'right' ? 'left' : 'right';
      }
      this.placement = adjust.placement;
      this.$popoverContainer = $(
          '<div class="binf-popover pman-widget-popover pman-ms-popover" role="tooltip" tabindex=0><div class="binf-arrow"></div><h3 class="binf-popover-title"></h3><div class="binf-popover-content"></div></div>');
      this.$popoverContainer.css("max-width", adjust.availableSpace + "px");
    },
    _determineLayoutSelector: function(perspectiveView){
      if(perspectiveView.options.type === 'sidepanel-right' || perspectiveView.options.type === 'sidepanel-left'){
        if(perspectiveView.$el.hasClass('cs-bcs-perspective-banner')) {
          return this.options.bannerSelector;
         } else {
         return this.options.mainSelector;
        }
      }else {
        return this.options.perspectiveSelector;
      }
    },

    /**
     * Determite callout position and show widget configuration callout
     */
    _showPopover: function () {
      var popoverOptions = {
        html: true,
        content: this.optionsFormView.el,
        trigger: 'manual',
        viewport: { // Limit popover placement to perspective panel only
          selector: this.options.perspectiveView && this._determineLayoutSelector(this.options.perspectiveView), //this.options.perspectiveSelector,
          padding: 18
        },
        placement: this.placement,
        template: this.$popoverContainer,
        animation: false
      };
      this.$popoverEl.binf_popover(popoverOptions);
      this.$popoverEl.off('hidden.binf.popover')
          .on('hidden.binf.popover', this._handleCalloutHide.bind(this));
      this.$popoverEl.binf_popover('show');
      //To change the border color to red for non supported widgets.
      this.optionsFormView.onPopoverShow(this.$popoverContainer);
      this.optionsFormView.$el.find('.cs-formview-wrapper').trigger('refresh:setcontainer');
      this._registerPopoverEvents();
      // TODO Use title of on formview as labelledBy instead of hidden popover title.
      // Currently empty H tag failed html validation, hence fill it will title.
      var popover = this.$popoverEl.next(".binf-popover"),
          popoverLabelElemId = _.uniqueId('popoverLabelId'),
          popoverHeader = popover.find('>.binf-popover-title');
      if (popoverHeader) {
        popoverHeader.attr('id', popoverLabelElemId);
        popoverHeader.html(this.manifest.title);
        popover.attr('aria-labelledby', popoverLabelElemId);
      }
      $('.perspective-editing .cs-perspective-panel .cs-field-write').on('keydown.' + this.cid).on(
        'mousedown.' + this.cid, {
          view: this
        },
        this.handlePopoverClick);
    },

    _hideCallout: function () {
      this.$popoverEl && this.$popoverEl.binf_popover('destroy');
      $('.perspective-editing .cs-perspective-panel .cs-field-write').off('keydown.' + this.cid).off(
        'mousedown.' + this.cid);
    },

    _registerPopoverEvents: function () {
      $('.perspective-editing .cs-perspective-panel').off('click.' + this.cid).on(
          'click.' + this.cid, {
            view: this
          },
          this._documentClickHandler);
      $('.pman-container').off('click.' + this.cid).on('click.' + this.cid, {
        view: this
      }, this._documentClickHandler);
      $(window).off('click.' + this.cid).on('resize.' + this.cid, {
        view: this
      }, this._windowResizeHandler);
    },

    _windowResizeHandler: function (event) {
      var self = event.data.view;
      // closing opened popover on window resize
      self._hideCallout();
    },

    _unregisterPopoverEvents: function () {
      $('.perspective-editing .cs-perspective-panel').off('click.' + this.cid,
          this._documentClickHandler);
      $('.pman-container').off('click.' + this.cid, this._documentClickHandler);
      $(window).off('resize.' + this.cid, this._windowResizeHandler);
    },

    /**
     * Handle callout data update to widget on hidding of popover
     */
    _handleCalloutHide: function () {
      this._validateWidgetConfig();
      this._unregisterPopoverEvents();
      delete this.widgetConfig.options.___pman_opencallout;
      this._updateWidgetOptions(true);
      this._enableorDisableSaveButton();
    },

    _validateWidgetConfig: function () {
      var options = this.optionsFormView.getValues(),
          isValid = this.optionsFormView.validate();
      if (_.isFunction(this.widgetView.validateConfiguration)) {
        isValid = isValid && this.widgetView.validateConfiguration(options);
      }
      var action = !isValid ? 'addClass' : 'removeClass';
      this.$el[action]('binf-perspective-has-error');
    },

    _enableorDisableSaveButton: function () {
      var saveBtn = $('.perspective-editing .pman-header .icon-save'),
          hasError = $('.perspective-editing').find(".binf-perspective-has-error").length > 0;
      saveBtn.prop('disabled', hasError);
    },

    /**
     * Triggered on changing of any widget's options on form.
     * Recreates the widgets with latest options (only if valid) to make sure widget is showing live data.
     *
     * Parameters:
     *  - reloadForLiveData: widget required to be re-created to get the changes reflected
     *  - softUpdate: Trigger change even without reloading the widget
     *
     */
    _updateWidgetOptions: function (reloadForLiveData, softUpdate) {
      var isValid = this.optionsFormView.validate(),
          options = this.optionsFormView.getValues();
      softUpdate = _.isUndefined(softUpdate) ? !reloadForLiveData : softUpdate
      var isWidgetReplaced = this._notifyConfigChanges(options, isValid, reloadForLiveData,
          softUpdate);
      this._enableorDisableSaveButton();
      return isWidgetReplaced;
    },

    _notifyConfigChanges: function (options, isValid, reloadForLiveData, softUpdate) {
      options = options || {};
      var oldOptions = this.widgetConfig.options || {};
      var isOptionsSame = _.isEqual(oldOptions, options);
      this.perspectiveView.trigger("update:widget:options", {
        widgetView: this.widgetView,
        isValid: isValid,
        options: options,
        softUpdate: softUpdate
      });

      if (isOptionsSame) {
        // Avoid widget recreation when options not changed.
        return;
      }

      if (!!isValid) {
        // Check if widget should be recreated on options change (for live data). 
        if (!this.manifest.callback && (reloadForLiveData || oldOptions.___pman_isdropped)) {
          // Recreate with widget (for live data) for the first time after drop to provde widget the options with default values (from manifest)
          // OR Recreate widget with updated options.
          var widgetType = this.widgetConfig.type;
          if (this._isPreviewWidget()) {
            // Has valid options to initialize origianl widgets now
            var originalWidget = this.widgetConfig.options.widget;
            widgetType = originalWidget.id;
          }
          if (!!oldOptions.___pman_isdropped) {
            options = _.extend({___pman_opencallout: oldOptions.___pman_isdropped}, options);
          }
          var widgetToReplace = {
            type: widgetType,
            kind: this.widgetConfig.kind,
            options: options,
            cid: _.uniqueId('pman')
          };
          this.perspectiveView.trigger('replace:widget', this.widgetView, widgetToReplace);
          return true;
        }
      }
    },

    /**
     * Listen document click to close callouts
     */
    _documentClickHandler: function (event) {
      var self = event.data.view;
      if (!!$(event.target).closest('.binf-popover').length || self.writeFieldClicked) {
        // Click on popover
        self.writeFieldClicked = false;
        return;
      }
      if (!Marionette.isNodeAttached(event.target)) {
        // after click on element in popover, the element not exist in dom
        self.widgetView.trigger('reposition:flyout');
        return;
      }
      if (self.$el.is(event.target) ||
          (!!self.$el.has(event.target).length && !self.ui.delete.is(event.target)) ||
          self.widgetView.$el.is(event.target) || self.widgetView.$el.has(event.target).length) {
        // Click on current widget
        return;
      }
      self._unregisterPopoverEvents();
      self._hideCallout();
    },

    _onChangeField: function (field) {
      if (field.name === WidgetOptionsFormView.widgetSizeProperty) {
        // Notify perspective panel about size change to do respective DOM / style updates
        this.perspectiveView.trigger("update:widget:size", this.options.widgetView, field.value);
        // Close popover for now.
        this.$popoverEl.binf_popover('destroy');
        // TODO Re-position popover as widget size may change
        // this._calculatePopoverPlacement();
        // this._showPopover();
      } else if (this.options.notifyUpdatesImmediatly) {
        this._updateWidgetOptions(false, false);
        this.widgetView.trigger('reposition:flyout');
      }
    },

    _evalRequiredFormWidth: function () {
      // var formContainer = $("<div class='pman-widget-popover'/>");
      // formContainer.appendTo(document.body);

      this.optionsFormView.$el.addClass('pman-prerender-form');
      this.optionsFormView.$el.addClass('pman-widget-popover');
      this.optionsFormView.$el.appendTo(document.body);
      this.optionsFormView.$el.find('.cs-formview-wrapper').trigger('refresh:setcontainer');
      var formWidth = this.optionsFormView.$el.width();
      if (this.optionsFormView.$el.find('.csui-scrollablecols').length > 0) {
        formWidth += this.optionsFormView.$el.find('.csui-scrollablecols')[0].scrollWidth -
                     this.optionsFormView.$el.find('.csui-scrollablecols')[0].offsetWidth;
      }
      this.optionsFormView.$el.removeClass('pman-widget-popover');
      return formWidth;
    },

    _calculateSpaceAroundWidget: function () {
      var elWidth = this.$el.width(),
          elWidth = (elWidth / 2),
          documentWidth = $(document).width(),
          leftOffset = this.$el.find('.csui-pman-popover-left').offset().left,
          rightOffset = documentWidth - this.$el.find('.csui-pman-popover-right').offset().left;

      var aroundSpaces = {
        right: {
          placement: 'right',
          mirror: false,
          availableSpace: rightOffset
        },
        rightFlip: {
          placement: 'right',
          mirror: true,
          availableSpace: (documentWidth - rightOffset)
        },
        left: {
          placement: 'left',
          mirror: false,
          availableSpace: leftOffset
        },
        leftFlip: {
          placement: 'left',
          mirror: true,
          availableSpace: (documentWidth - leftOffset)
        }
      };
      return aroundSpaces;
    },

    _determineCalloutPlacement: function () {
      var isRtl = i18n && i18n.settings.rtl,
          formWidth = this._evalRequiredFormWidth() + 20, // For additional spacing around Form
          allSpaces = this._calculateSpaceAroundWidget(),
          i, perfectSpace, highSpace;

      var spacings = !isRtl ?
          [allSpaces.right, allSpaces.left, allSpaces.leftFlip, allSpaces.rightFlip] :
          [allSpaces.rightFlip, allSpaces.leftFlip, allSpaces.left, allSpaces.right];

      for (i = 0; i < spacings.length; i++) {
        var current = spacings[i];
        if (formWidth < current.availableSpace) {
          perfectSpace = current;
          break;
        }
        if (!highSpace || current.availableSpace > highSpace.availableSpace) {
          highSpace = current;
        }
      }
      if (!perfectSpace) {
        // Widget is not perfect fit in any edge. So take high availability
        perfectSpace = highSpace;
      }
      perfectSpace.availableSpace -= 20; // For additional spacing around popover.

      return perfectSpace;
    },

    _isPreviewWidget: function () {
      return this.widgetConfig.type === WidgetMaskingView.perspectiveWidget;
    },

    _addMoreManifestInfo: function () {
      var hasConfigForm = true;
      if (!this.manifest || !this.manifest.schema || !this.manifest.schema.properties ||
          _.isEmpty(this.manifest.schema.properties)) {
        // No configuration is available for this widget
        hasConfigForm = false;
      }
      this.manifest.hasConfigForm = hasConfigForm;
      return;
    },

    _loadManifest: function () {
      if (this.manifest !== undefined) {
        this._addMoreManifestInfo();
        return $.Deferred().resolve(this.manifest);
      }
      if (this._isPreviewWidget()) {
        // For widgets added using DnD, get manifest from perspective widget's options 
        // since Perspective widget will be added as preview for original widget
        this.manifest = this.widgetConfig.options.widget.get('manifest');
        return this._loadManifest();
      }
      var deferred    = $.Deferred(),
          widgetModel = new WidgetModel({
            id: this.widgetConfig.type
          });
      widgetModel.fetch().then(_.bind(function () {
        this.manifest = widgetModel.get('manifest');
        this._addMoreManifestInfo();
        deferred.resolve(this.manifest);
      }, this), function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },

    onDeleteClick: function (event) {
      this._closePopover();
      event.preventDefault();
      if (!this.options.confirmOnRemove) {
        this._doDeleteWidget();
      } else {
        var self = this;
        var index = this.$el.parents('.csui-draggable-item.csui-pman-editable-widget').index();
        csui.require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
          alertDialog.confirmQuestion(self.options.removeConfirmMsg,
              self.options.removeConfirmTitle,
              {
                buttons: {
                  showYes: true,
                  labelYes: lang.remove,
                  showNo: true,
                  labelNo: lang.cancel
                }
              })
              .always(function (result) {
                if (result) {
                  self._doDeleteWidget();
                  self._doSpecificWidgetFocusble(index);
                } else {
                  self.ui.delete.trigger('focus');
                }
              });
        });
      }
    },

    // accepts the index of widget and make that widget focusable
    _doSpecificWidgetFocusble: function (index) {
      var widgetEle = $('.csui-dnd-container>.csui-pman-editable-widget').eq(index).children(
          '.csui-widget-focusable').find('.wrapper-button');
      widgetEle.trigger('focus');
    },

    _doDeleteWidget: function () {
      this.perspectiveView.trigger("delete:widget", this.widgetView);

      this.perspectiveView.options.context.trigger('update:widget:panel', {
        'action': 'delete',
        'widgetModel': this.widgetView.model.get('widget')
      });

      this._enableorDisableSaveButton();
    },

    _doReplaceWidget: function (widgetToReplace, existingWidget) {
      var manifest = (widgetToReplace.get('manifest') || {}),
          newWidget = { // Widget is able to intialize with default (empty) options.
            type: widgetToReplace.id,
            kind: manifest.kind
          };
      if (!PerspectiveUtil.isEligibleForLiveWidget(manifest)) {
        // Widget has few required options / has callback. Hence create generic "perspective widget preview" widget
        newWidget = {
          type: WidgetMaskingView.perspectiveWidget,
          kind: manifest.kind,
          options: {
            options: {}, // To be used and filled by callout form
            widget: widgetToReplace
          }
        };
      }
      newWidget.options = _.extend({___pman_isdropped: true}, newWidget.options);
      this.perspectiveView.trigger('replace:widget', this.widgetView, newWidget);

      this.perspectiveView.options.context.trigger('update:widget:panel', {
        'action': !!existingWidget ? 'replace' : 'add',
        'widgetModel': newWidget,
        'oldWidgetModel': existingWidget
      });
    },

    onDragOver: function (event) {
      event.preventDefault();
    },

    onDragEnter: function (event) {
      event.preventDefault();
      this.dropCounter++;
      this.$el.siblings(".csui-perspective-placeholder").addClass('csui-widget-drop');
    },

    onDragLeave: function () {
      this.dropCounter--;
      if (this.dropCounter === 0) {
        this.$el.siblings(".csui-perspective-placeholder").removeClass('csui-widget-drop');
      }
    },

    _extractWidgetToDrop: function (event) {
      var dragData = event.originalEvent.dataTransfer.getData("text");
      if (!dragData) {
        return undefined;
      }
      try { // TODO get rid of try catch and handle like non-droppable object
        var widgetToReplace = new WidgetModel(JSON.parse(dragData));
        return widgetToReplace;
      } catch (e) {
        // Unsupported drop
        return false;
      }
    },

    onDrop: function (event) {
      event.preventDefault();
      this.onDragLeave();
      var widgetToReplace = this._extractWidgetToDrop(event);
      if (!widgetToReplace) {
        return;
      }
      if (this.widgetConfig.type === WidgetMaskingView.placeholderWidget) {
        this._doReplaceWidget(widgetToReplace);
      } else {
        var self = this;
        csui.require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
          alertDialog.confirmQuestion(lang.replaceConfirmMsg, lang.replaceConfirmTitle, {
            buttons: {
              showYes: true,
              labelYes: lang.replace,
              showNo: true,
              labelNo: lang.cancel
            }
          })
              .done(function (userConfirmed) {
                if (userConfirmed) {
                  self._doReplaceWidget(widgetToReplace, self.widgetConfig);
                }
              });
        });
      }
    },

    _updateStyles: function () {
      var className = _.result(this, 'className');
      this.$el.attr('class', className);
    },

    _updateConfigChanges: function (isVisible) {
      this.$el.removeClass(this._getStateClass());
      PerspectiveUtil.setWidgetHidden(this.widgetConfig, isVisible);
      this._notifyConfigChanges(this.widgetConfig.options, true, false);
      this.$el.addClass(this._getStateClass());
    },

    _onHideShowWidget: function () {
      var hideShowBtnText;
      if (PerspectiveUtil.isHiddenWidget(this.options.widgetConfig)) {
        this.perspectiveView.trigger('before:show:widget', this.widgetView);
        this._updateConfigChanges(false);
        this.perspectiveView.trigger('show:widget', this.widgetView);
        hideShowBtnText = lang.hideWidget;
        this.ui.hideShowToggle.attr('aria-label',
        _.str.sformat(lang.hideWidgetAriaLabel, this._getWidgetName()))
        .attr('title',
            hideShowBtnText).text(hideShowBtnText);
      } else {
        this.perspectiveView.trigger('before:hide:widget', this.widgetView);
        this._updateConfigChanges(true);
        this.perspectiveView.trigger('hide:widget', this.widgetView);
        hideShowBtnText = lang.showWidget;
        this.ui.hideShowToggle.attr('aria-label',
        _.str.sformat(lang.showWidgetriaLabel, this._getWidgetName()))
        .attr('title',
            hideShowBtnText).text(hideShowBtnText);
      }
      this.$el.find('.wrapper-button').attr('aria-label',
          _.str.sformat(lang.personalizeModewidgetFocusLabel, this._getWidgetName(),
              hideShowBtnText));
      return false;
    }

  }, {
    className: 'csui-configure-perspective-widget',
    perspectiveWidget: 'csui/perspective.manage/widgets/perspective.widget',
    placeholderWidget: 'csui/perspective.manage/widgets/perspective.placeholder',
    widgetSizeProperty: '__widgetSize'
  });

  var PerspectiveWidgetConfigurationBehaviour = Marionette.Behavior.extend({
    defaults: {      
      perspectiveSelector: '.perspective-editing .cs-perspective > div',
      bannerSelector: '.perspective-editing .cs-perspective #banner-region',
      mainSelector: '.perspective-editing .cs-perspective #main'
    },

    constructor: function PerspectiveWidgetConfigurationBehaviour(options, view) {
      options || (options = {});
      options.perspectiveView = options.perspectiveView || view;
      this.perspectiveView = options.perspectiveView;
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.view = view;
      _.extend(this.perspectiveView, {
        getPManPlaceholderWidget: function () {
          return {
            type: WidgetMaskingView.placeholderWidget,
            options: {}
          };
        }
      })
    },

    _ensureWidgetElement: function () {
      if (!_.isObject(this.$widgetEl)) {
        // Consider element to add mask can be provided through options
        this.$widgetEl = this.options.el ? $(this.options.el) : this.view.$el;
      }
      if (!this.$widgetEl || this.$widgetEl.length === 0) {
        throw new Marionette.Error('An "el" ' + this.$widgetEl.selector + ' must exist in DOM');
      }
      return true;
    },

    _checkAndApplyMask: function () {
      this._ensureWidgetElement();
      if (this.$widgetEl.children('.' + WidgetMaskingView.className).length > 0) {
        // Mask exist
        return;
      }

      // Get data configured to widget
      var widgetConfig = this._resolveWidgetConfiguration();
      if (!widgetConfig) {
        throw new Marionette.Error({
          name: 'NoWidgetConfigurationError',
          message: 'A "widgetConfig" must be specified'
        });
      }
      if (this.maskingView && this.$widgetEl.has(this.maskingView.$el).length &&
          _.isEqual(widgetConfig, this.options.widgetConfig)) {
        // No change in configuration. No rerender of mask required.
        return;
      }
      this.maskingView && this.maskingView.destroy();
      this.maskingView = new WidgetMaskingView(
          _.extend(this.options, {
            widgetView: this.view,
            widgetConfig: widgetConfig
          }));
      this.maskingView.render();
      this.$widgetEl.append(this.maskingView.el);
      this.$widgetEl.addClass('csui-pman-editable-widget')
      // To be used perspective.view to show placeholder watermark
      this.$widgetEl.data('pman.widget', {
        attributes: {
          manifest: widgetConfig
        }
      });
      if (widgetConfig.type === WidgetMaskingView.placeholderWidget) {
        // Prevent perspective placeholder to participate in sorting.
        this.$widgetEl.removeClass('csui-draggable-item');
      }
    },

    _resolveWidgetConfiguration: function () {
      if (!!this.view.model && !!this.view.model.get('widget')) {
        // Try model of widget view - Flow, LCR, Grid.. who even using grid control 
        return this.view.model.get('widget');
      }
      if (!!this.view.getPManWidgetConfig && _.isFunction(this.view.getPManWidgetConfig)) {
        // Widget configuration can be provided though a function 
        return this.view.getPManWidgetConfig();
      }
      if (!!this.options.widgetConfig) {
        // Can be provided through behaviour's options
        return _.result(this.options, 'widgetConfig');
      }
    },

    onRender: function () {
      this._checkAndApplyMask();
      this.maskingView && this.maskingView._enableorDisableSaveButton();
    },

    onDestroy: function () {
      this.maskingView && this.maskingView.destroy();
      this.maskingView = undefined;
    }

  });

  return PerspectiveWidgetConfigurationBehaviour;

})
;

csui.define('csui/perspective.manage/pman.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/base',
  'csui/controls/progressblocker/blocker',
  'csui/utils/non-emptying.region/non-emptying.region',
  'csui/perspective.manage/impl/pman.panel.view',
  'csui/utils/perspective/perspective.util',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/user',
  'csui/widgets/navigation.header/controls/help/help.view',
  'csui/models/perspective/personalization.model',
  'csui/perspectives/mixins/draganddrop.kn.mixin',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/pman',
  'i18n',
  'csui/perspective.manage/mixins/update.supportasset.branding.config.mixin',
  'csui/utils/commonconfig.util',
  'css!csui/perspective.manage/impl/pman',
  'csui/perspective.manage/behaviours/pman.widget.config.behaviour',
  'csui/lib/jquery.ui/js/jquery-ui'
], function (_, $, Backbone, Marionette, base, BlockingView, NonEmptyingRegion, PManPanelView, PerspectiveUtil,
  ApplicationScopeModelFactory,
  NodeModelFactory, UserModelFactory, HelpView, PersonalizationModel, DragAndDropKNMixin, lang, template, i18n,
  UpdateSupportAssetBrandingConfigMixin, CommonConfigUtil) {

  var pmanContainer;
  let enableSideBar = CommonConfigUtil.enableSideBar();

  var PManView = Marionette.ItemView.extend({
    className: function () {
      var classNames = ['pman', 'pman-container'];
      classNames.push('pman-mode-' + this.options.mode);
      return _.unique(classNames).join(' ');
    },

    template: template,

    templateHelpers: function () {
      return {
        addWidget: lang.addWidget,
        save: lang.save,
        saveAriaLabel: lang.saveAriaLabel,
        cancel: enableSideBar && this.mode !== PerspectiveUtil.MODE_PERSONALIZE && !this.applicationScope.get('id') ? lang.close : lang.cancel,
        cancelAriaLabel: lang.cancelAriaLabel,
        reset: lang.reset,
        resetAriaLabel: lang.resetAriaLabel,
        personalizeMode: this.mode === PerspectiveUtil.MODE_PERSONALIZE &&
          (this.options.perspective.has('perspective_id') ||
            this.options.perspective.has('id'))
      };
    },

    ui: {
      "pmanPanel": ".pman-header .pman-pannel-wrapper",
      'cancelEdit': '.pman-header .cancel-edit',
      'addIcon': '.pman-header .icon-toolbarAdd',
      'helpIcon': '.pman-header .icon-help',
      'saveBtn': '.pman-header .icon-save',
      'trashArea': '.pman-header .pman-trash-area',
      'resetBtn': '.pman-header .icon-reset',
      'headerContainer': '.pman-container-header-container .pman-container-header'
    },

    events: {
      'click @ui.cancelEdit': "onClickClose",
      'click @ui.addIcon': "togglePannel",
      'click @ui.helpIcon': "onClickHelp",
      'click @ui.saveBtn': "onClickSave",
      'click @ui.resetBtn': "onClickReset",
      'keydown': 'onKeyDown'
    },

    constructor: function PManView(options) {
      options || (options = {});
      _.defaults(options, {
        applyMasking: this.applyMasking.bind(this),
        container: document.body,
        mode: PerspectiveUtil.MODE_EDIT_PERSPECTIVE
      });
      BlockingView.imbue(this);
      this.blockingView.showloadingWheel = true;
      options.container = $(options.container);
      this.context = options.context;
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      if(enableSideBar){
        this.context.pmanView=this;
      }
      this.mode = options.mode;
      this._prepareForEdit(options.perspective);
      Marionette.ItemView.prototype.constructor.call(this, options);
      this._registerEventHandler();
      this.helpView = new HelpView(options);
    },

    _registerEventHandler: function () {
      this.listenTo(this, 'change:layout', function (newLayoutType) {
        this.perspective.setPerspective({
          type: newLayoutType,
          options: { perspectiveMode: this.mode }
        }, { silent: true });
        this._triggerEditMode();
        !enableSideBar && this.togglePannel();
      });
      this.listenTo(this, 'swap:layout', function (newLayoutType) {
        this.perspective.setPerspective({
          type: newLayoutType,
          options: this.perspective.attributes.perspective.options
        }, { silent: true });
        this.context.triggerMethod('swap:layout', this.perspective);
      });
      this.listenTo(this.context, 'save:perspective', this._savePerspective);
      // listen to change perspective and exit from edit mode
      this.listenTo(this.context, 'change:perspective', this._onChangePerspective);
      this.listenTo(this.context, 'retain:perspective', this._doExitPerspective);
      this.listenTo(this.context, 'finish:exit:edit:perspective', this._doCleanup);
    },

    _prepareForEdit: function (originalPerspective) {
      if (!originalPerspective) {
        throw new Error("Missing perspective");
      }
      this.perspective = this._clonePrespective(originalPerspective);
      // var perspectiveOptions = this.perspective.getPerspective().options || {};
      // perspectiveOptions.perspectiveMode = this.mode;
    },

    _clonePrespective: function (original) {
      var perspectiveConfig = original.getPerspective();
      var config = JSON.parse(JSON.stringify(perspectiveConfig));
      original.setPerspective(config);
      return original;
    },

    show: function () {
      var container = this.getContainer(),
        region = new NonEmptyingRegion({
          el: container
        });
      region.show(this);
      return this;
    },

    getContainer: function () {
      if (!pmanContainer || !$.contains(this.options.container, pmanContainer)) {
        pmanContainer = $('<div>', { 'class': 'binf-widgets' }).appendTo(this.options.container)[0]
      }
      return pmanContainer;
    },

    /**
     * Updates / creates perspective
     */
    _savePerspective: function (perspectiveChanges) {
      if (!!perspectiveChanges && !!perspectiveChanges.error) {
        this.ui.saveBtn.prop('disabled', false);
        return;
      }
      this.perspective.update(perspectiveChanges);
      // Save perspective to server
      this.perspective.save().then(_.bind(this._onSaveSuccess, this),
        _.bind(this._onSaveError, this));
    },

    _onSaveSuccess: function () {
      var self = this;
      if (self.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        if(self.context.previewBranding?.get('isBrandingChangeTriggered')){
          this._showMessage("success", lang.LblBrandingChanges);
        }else{
          this._showMessage("success", lang.perspectiveSaveSuccess);
        }
      } else {
        this._showMessage("success", lang.personalizationSaveSuccess);
      }
      // Update context's perspective and exit from inline editing
      var contextPerspectiveMode = self.context.perspective.get('perspectiveMode') ||
        PerspectiveUtil.MODE_EDIT_PERSPECTIVE,
        sourceModel = self._getSourceModel();

      var updatePerspective = self.perspective.getPerspective();
      updatePerspective.id = self.perspective.getPerspectiveId();

      // Keep the perspective / personalization at sourceModel (received from server) up to date.
      if (self.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        // Update only personalization of sourceModel's perspective
        var originalPerspective = sourceModel.get('perspective');
        sourceModel.set('perspective', _.defaults(updatePerspective, originalPerspective));
      } else {
        // Update only personalization of sourceModel's perspective
        var originalPerspective = sourceModel.get('perspective');
        sourceModel.set('perspective',
          _.defaults({ personalizations: self.perspective.toJSON() }, originalPerspective));
      }

      if (contextPerspectiveMode === self.mode) {
        self.context.perspective.set(updatePerspective);
      } else if (self.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        // Original perspective changed. And the current user has personalization of current page.
        // Merge latest perspective updates to personalization
        var personalization = new PersonalizationModel({}, { perspective: updatePerspective });
        personalization.setPerspective(self.context.perspective.toJSON());
        updatePerspective = personalization.getPerspective();
        self.context.perspective.set(updatePerspective);

      } else if (self.mode === PerspectiveUtil.MODE_PERSONALIZE) {
        // Update the personalizations to context. Since content is currently showing admin's perspective.
        // Probablt this is the first time user personalizing the page.
        var personalization = new PersonalizationModel({},
          { perspective: sourceModel.get('perspective') });
        personalization.setPerspective(updatePerspective);
        updatePerspective = personalization.getPerspective();
        self.context.perspective.set(updatePerspective);
      }
      self._doExitPerspective();
    },

    _onSaveError: function (error) {
      this.ui.saveBtn.prop('disabled', false);
      // API error while saving..
      var errorMessage;
      if (error && error.responseJSON && error.responseJSON.error) {
        errorMessage = error.responseJSON.error;
      } else {
        var errorHtml = base.MessageHelper.toHtml();
        base.MessageHelper.reset();
        errorMessage = $(errorHtml).text();
      }
      this._showMessage("error", errorMessage);
    },

    _showMessage: function (type, message) {
      csui.require([
        'csui/controls/globalmessage/globalmessage'
      ], function (GlobalMessage) {
        GlobalMessage.showMessage(type, message);
      });
    },

    onClickSave: function () {
      // apply header config
      this.applyHeaderChanges()
        .done(() => {
          // this.ui.saveBtn.prop('disabled', true);
          //Close collout if any open
          var popoverTarget = this.options.container.find(".binf-popover");
          if (popoverTarget.length) {
            popoverTarget.binf_popover('hide');
            // Added timeout to wait for closing popover, thus widget options will update properly
            setTimeout(_.bind(function () {
              this.context.triggerMethod('serialize:perspective', this.perspective);
            }, this), 1500);
          } else {
            this.context.triggerMethod('serialize:perspective', this.perspective);
          }
        });
    },

    applyHeaderChanges: function () {
      let deferred = $.Deferred()
      // this flag is to determile any update in branding.
      if (!this.context?.previewBranding?.get('isBrandingChangeTriggered')) return deferred.resolve();
      this.blockActions();
      const { fileDetails, brandLogoUri } = this.context.previewBranding.attributes;
      const cssFileUri = this.changeInBrandingCSS();

      this.uploadBrandingConfig(fileDetails, brandLogoUri)
        .done(() => {
          this.applyNavigationCSS(cssFileUri, fileDetails, brandLogoUri);
          this.unblockActions();
          return deferred.resolve();
      });
      return deferred.promise();
    },
    applyNavigationCSS: function (cssFileUri, fileDetails, brandLogoUri) {
      const imgFileURL = fileDetails ? URL.createObjectURL(fileDetails) : brandLogoUri;
      let brandingConfig = this.context.navigationHeaderView?.brandingConfigData ?? 
      this.context.navigationHeaderView?.options?.brandingConfig ?? {};

      brandingConfig.set('brandLogoUri', imgFileURL);
      brandingConfig.set('brandingCSS', cssFileUri);
      brandingConfig.set('tempBrandingCSS', cssFileUri);
      brandingConfig.set('brandingSettingCodes', this.tBrandingSettingCodes);
      this.context.navigationHeaderView.render();
    },

    changeInBrandingCSS: function () {
      const changedBrandingData = this.context?.previewBranding?.get('brandingSettingCodes') ?? {};
      // "structuredClone" used for deep clone    
      this.tBrandingSettingCodes = structuredClone(changedBrandingData);
      const brandingConfigCSSUri = this.createStyleSheet(changedBrandingData);
      return brandingConfigCSSUri;
    },

    // saving branding config
    uploadBrandingConfig: function (imgFile, isBrandLogoUriPresent) {
      const self = this;
      const deferred = $.Deferred();
      this.getSupportAssetVolumeID()
        .done(response => {
          const supportAssetVolumeDetails = response.data;
          if (!supportAssetVolumeDetails) return deferred.reject({ statusMsg: 'no support asset volume' });
          this.fetchBrandingConfigFolderDetails(supportAssetVolumeDetails, imgFile, isBrandLogoUriPresent)
            .done(responseFromBrandingConfig => {
              self.uploadInSupportAssetVolume(imgFile, responseFromBrandingConfig)
                .done(() => deferred.resolve({ statusMsg: 'user has reset the data' }))
                .fail(error => deferred.reject({ statusMsg: error }))
            })
            .fail(error => deferred.reject(error))
        }).fail(error => deferred.reject(error));
      return deferred.promise();
    },

    uploadInSupportAssetVolume: function (imgFile, responseFromBrandingConfig) {
      // -- start of upload files---
      const deferred = $.Deferred();
      // upload Image
      this.uploadConfigInBrandingFolder(imgFile, responseFromBrandingConfig)
        .done((response) => {
          // upload the config
          this.uploadBrandingConfigData(response);
          return deferred.resolve({ statusMsg: 'Image updated' });
        }).fail(error => deferred.reject({ statusMsg: error }));
      return deferred.promise();
      // -- end of upload files---
    },

    uploadBrandingConfigData: function (responseFromBrandingConfig) {
      const brandingSettingCodes = this.tBrandingSettingCodes;
      let brandLogoUri = responseFromBrandingConfig?.id ?? this.context.previewBranding?.get('brandLogoUri_id');
      if(!brandLogoUri){
        brandLogoUri = null;
      }
      const data = {
        brandLogoUri,
        brandingSettingCodes
      }
      this.uploadBrandingConfigSettings(data);
    },

    onClickHelp: function () {
      this.context._applicationScope.set('oldScopeId', this.context._applicationScope.get('id'));
      if (this.options.mode === 'personalize') {
        this.helpView.triggerMethod('click:help', 'editpersonalizepage');
      } else if (this.options.mode === 'editNavigationHeader') {
        this.helpView.triggerMethod('click:help', 'editNavigationHeader');
      } else {
        this.helpView.triggerMethod('click:help', 'editpage');
      }
    },

    onClickReset: function () {
      var self = this;
      csui.require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
        alertDialog.confirmQuestion(lang.resetConfirmMsg,
          lang.reset,
          {
            buttons: {
              showYes: true,
              labelYes: lang.reset,
              showNo: true,
              labelNo: lang.cancel
            }
          })
          .done(function (yes) {
            if (yes) {
              self._doReset();
            }
          });
      });
    },

    _doReset: function () {
      var sourceModel = this._getSourceModel();
      originalPerspective = JSON.parse(JSON.stringify(sourceModel.get('perspective')));
      originalPerspective.options = originalPerspective.options || {};
      originalPerspective.options.perspectiveMode = this.mode;
      var originalConfig = new Backbone.Model(originalPerspective);
      this.context.triggerMethod('enter:edit:perspective', originalConfig);
      this.listenToOnce(this.context, 'finish:enter:edit:perspective', function () {
        this._showMessage("success", lang.resetSuccessful);
      });
    },

    _getSourceModel: function (params) {
      var sourceModel;
      if (this.applicationScope.get('id') === 'node') {
        sourceModel = this.context.getModel(NodeModelFactory);
      } else {
        sourceModel = this.context.getModel(UserModelFactory);
      }
      return sourceModel;
    },

    onClickClose: function () {
      document.querySelector(".binf-widgets.perspective-editing .cs-perspective-panel").removeAttribute('style');
      this._doExitPerspective();
    },

    togglePannel: function (event) {
      if (!this.ui.pmanPanel.hasClass('binf-active')) {
        // Reset before showing panel
        if (!(event.originalEvent.pointerType === 'mouse')) {
          this.$el.find('.csui-layout-tab').attr('tabindex', 0);
          this.$el.find('.csui-layout-tab').focus();
        }
        this._openToolsPanel();
      } else {
        this.$el.find('.csui-layout-tab').attr('tabindex', -1);
        this.$el.find('.cs-go-back').attr('tabindex', -1);
        this._closeToolsPanel();
      }
    },

    _openToolsPanel: function () {
      this.pmanPanelView.trigger('reset:items');
      this.ui.addIcon.addClass('binf-active');
      this.ui.addIcon.attr("title", lang.close);
      this.ui.pmanPanel.addClass('binf-active');
      this.pmanPanelView.triggerMethod("panel:open");
    },

    _closeToolsPanel: function () {
      this.ui.pmanPanel.removeClass('binf-active');
      this.ui.addIcon.attr("title", lang.addWidget);
      this.ui.addIcon.removeClass('binf-active');
    },

    applyMasking: function () {

    },

    _initializeWidgets: function () {
      if (this.mode === PerspectiveUtil.MODE_PERSONALIZE) {
        // Personalize doesn't need to load all available widgets for DnD
        return;
      }
      this.pmanPanelRegion = new Marionette.Region({
        el: this.ui.pmanPanel
      });
      this.pmanPanelView = new PManPanelView({
        pmanView: this
      });
      this.pmanPanelRegion.show(this.pmanPanelView);
      _.isFunction(this.ui.trashArea.droppable) && this.ui.trashArea.droppable({
        tolerance: 'pointer',
        hoverClass: "pman-trash-hover",
        accept: function () {
          return false;
        }
      });
    },

    _triggerEditMode: function () {
      var perspectiveConfig = this.perspective.getPerspective();
      perspectiveConfig.options = perspectiveConfig.options || {};
      perspectiveConfig.options.perspectiveMode = this.mode;
      var perspective = new Backbone.Model(perspectiveConfig);
      this.context.triggerMethod('enter:edit:perspective', perspective);
      this.listenToOnce(this.context, 'finish:enter:edit:perspective', this._setFocusOnFirstWidget);
    },

    _beforeTransition: function () {
      var perspectiveContainer = this.options.container.find('.cs-perspective');
      this.options.container.addClass('perspective-editing-transition');
      base.onTransitionEnd(perspectiveContainer, function () {
        this.options.container.removeClass('perspective-editing-transition');
      }, this);
    },

    onRender: function () {
      var self = this;
      this._beforeTransition();
      this.options.container.addClass('perspective-editing');
      !enableSideBar && this.options.container.find('.cs-perspective-panel')?.addClass('csui-normal-scrolling');
      this.options.applyMasking();
      this._initializeWidgets();
      this._triggerEditMode();
      $(document).on('click.' + this.cid, { view: this }, this._documentClick);
      // applying draganddropmixin for flow perpective, for reordering widgets
      var applyKNMixin = this.perspective.get('type') === 'sidepanel-right' ||
        this.perspective.get('type') === 'sidepanel-left' ||
        this.perspective.get('type') === "flow" ||
        this.perspective.get('perspective').type === 'sidepanel-right' ||
        this.perspective.get('perspective').type === 'sidepanel-left' ||
        this.perspective.get('perspective').type === "flow";
      if (applyKNMixin) {
        $(document).on('keydown', { view: this }, this.onKeyInView);
      }
    },

    onBeforeDestroy: function(){
      if(enableSideBar){
        this.context.pmanView=undefined;
      } 
    },

    onKeyInView: function (event) {
      var isRtl = i18n && i18n.settings.rtl,
        self = event.data && event.data.view,
        continueEvent = true,
        isMac = base.isMacintosh();
      if ($(document.activeElement).parents('#banner').length > 0) {
        return;
      }
      if (isMac && event.metaKey && !event.ctrlKey || !isMac && !event.metaKey &&
        event.ctrlKey) {
        var $target = $(event.target),
          $targetParent = $target.closest('.csui-draggable-item'),
          widgetCells = self.options && self.options.context &&
            self.options.context.widgetCollection &&
            self.options.context.widgetCollection.at(0).columns.models;
        switch (event.keyCode) {
          case 39:
            isRtl ? self.moveToLeft($targetParent, $target, widgetCells) : self.moveToRight($targetParent, $target, widgetCells);
            continueEvent = false;
            break;
          case 37:
            isRtl ? self.moveToRight($targetParent, $target, widgetCells) : self.moveToLeft($targetParent, $target, widgetCells);
            continueEvent = false;
            break;
        }
      }
      return continueEvent;
    },


    _documentClick: function (event) {
      var self = event.data.view;
      if (self.ui.addIcon.is(event.target) || !!self.ui.addIcon.has(event.target).length) {
        // Add Icon
        return;
      }
      if (self.ui.pmanPanel.is(event.target) || !!self.ui.pmanPanel.has(event.target).length) {
        // Pman panel
        return;
      }
      self._closeToolsPanel();
    },

    _onChangePerspective: function () {
      this._doCleanup();
    },

    _doCleanup: function () {
      var popoverTarget = this.options.container.find(".binf-popover");
      this._beforeTransition();
      if (popoverTarget.length) {
        popoverTarget.binf_popover('destroy');
      }
      this.options.container.removeClass('perspective-editing');
      this.options.container.find('.cs-perspective-panel')?.removeClass('csui-normal-scrolling');
      $(document).off('click.' + this.cid, this._documentClick);
      $(document).off('keydown', this.onKeyInView);
      this.trigger('destroy');
    },

    /**
     * Edit from perspective inline editing mode.
     */
    _doExitPerspective: function () {
      this.context.triggerMethod('exit:edit:perspective', this.perspective);
    },

    // Move focus to first widget of Perspective Panel
    _setFocusOnFirstWidget: function () {
      var focusableEle = this.options.container.find(
        '.cs-perspective-panel .cs-perspective .csui-pman-editable-widget').first(),
        shortcutButton = focusableEle.find('.shortcut-group-wrapper');
      if (shortcutButton.attr('tabindex') === '0') {
        shortcutButton[0].focus();
      } else {
        focusableEle.find('.wrapper-button')[0].focus();
      }
    },

    onKeyDown: function (event) {
      switch (event.keyCode) {
        case 9: //TAB
          if (!event.shiftKey && $(event.target).is(this.ui.cancelEdit)) {
            this._setFocusOnFirstWidget();
            return false;
          }
      }
    }

  });
  DragAndDropKNMixin.mixin(PManView.prototype);
  UpdateSupportAssetBrandingConfigMixin.mixin(PManView.prototype);
  return PManView;
});


csui.define('csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/root/lang',{
  defaultLabel: 'Default background',
  darkLabel: 'Dark background',
  lightLabel: 'Light background',
  branding: 'Branding',
  logo: 'Logo',
  backgroundColor: 'Background color',
  linkColor: 'Link color',
  breadcrumbs: 'Breadcrumbs',
  icons: 'Icons'
});




csui.define('csui/perspective.manage/settings.panel/settings/branding.form',['i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang',
], function (lang) {
    return {
        "title": lang.branding,
        "schema": {
            "type": "object",
            "properties": {
                "imgData": {
                    "title": lang.logo,
                    "type": "object"
                },
                "backgroundColor": {
                    "title": lang.backgroundColor,
                    "type": "string"
                },
                "primaryText": {
                    "title": "Primary text",
                    "type": "string"
                },
                "secondaryText": {
                    "title": "Secondary text",
                    "type": "string"
                },
                "versionText": {
                    "title": "Version text",
                    "type": "string"
                }
            }
        },
        "options": {
            "fields": {
                "imgData": {
                    "type": "csui-image-picker"
                },
                "backgroundColor": {
                    "type": "csui-color-picker"
                },
                "primaryText": {
                    "type": "text"
                },
                "secondaryText": {
                    "type": "text"
                },
                "versionText": {
                    "type": "text"
                }
            }
        },

        getConfigFromFormData: function ({backgroundColor, imgData, primaryText, secondaryText, versionText}) {
            let retObj = {
                brandingSettingCodes:{
                    customBrandingBgColor: backgroundColor,
                    primaryText,
                    secondaryText,
                    versionText,
                },
                brandLogoUri: imgData?.logo,
                fileDetails: imgData?.fileDetails,
            };
            return retObj;
        },

        getFormDataFromConfig: function ({brandingSettingCodes, brandLogoUri}) {
            let retObj = {
                backgroundColor: brandingSettingCodes?.customBrandingBgColor,
                imgData: {brandLogoUri},
                primaryText: brandingSettingCodes?.primaryText,
                secondaryText: brandingSettingCodes?.secondaryText,
                versionText: brandingSettingCodes?.versionText,
            }
            return retObj;
        },
        getDefaultConfig: function () {
            let retObj = {
                backgroundColor: "",
                imgData: "",
                primaryText: "",
                secondaryText: "",
                versionText: "",
            };
            return retObj;
        }

    };
});

csui.define('csui/perspective.manage/settings.panel/settings/breadcrumb.form',['csui/lib/underscore',
    'i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang'
], function (_, lang) {
    return {
        "title": lang.breadcrumbs,
        "schema": {
            "type": "object",
            "properties": {
                "linkColor": {
                    "title": lang.linkColor,
                    "type": "string"
                }
            }
        },
        "options": {
            "fields": {
                "linkColor": {
                    "type": "csui-color-picker"
                }
            }
        },
        getConfigFromFormData: function (formData) {
            return {
                brandingSettingCodes:{
                    breadcrumbColor: formData.linkColor
                }
            };
        },

        getFormDataFromConfig: function (headerConfig) {
            return {
                linkColor: _.get(headerConfig.brandingSettingCodes, ['breadcrumbColor'])
            }
        },
        getDefaultConfig: function () {
            return {
                linkColor: ""
            };
        }
    }
});

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/settings.panel/settings/icons.setting/impl/icons.setting.view',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"icon-them-container\" data-theme=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"themeCode") : depth0)) != null ? lookupProperty(stack1,"DEFAULT") : stack1), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"defaultLabel") || (depth0 != null ? lookupProperty(depth0,"defaultLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"defaultLabel","hash":{},"loc":{"start":{"line":1,"column":80},"end":{"line":1,"column":96}}}) : helper)))
    + "\">\n    <div class=\"icon-label-container\">\n        <div class=\"icon_theme_input\">\n            <input type=\"radio\" name=\"theme\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"defaultLabel") || (depth0 != null ? lookupProperty(depth0,"defaultLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"defaultLabel","hash":{},"loc":{"start":{"line":4,"column":52},"end":{"line":4,"column":68}}}) : helper)))
    + "\" value=\"\" tabindex=\"0\" id=\"default\" />\n        </div>\n        <label for=\"default\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"defaultLabel") || (depth0 != null ? lookupProperty(depth0,"defaultLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"defaultLabel","hash":{},"loc":{"start":{"line":6,"column":29},"end":{"line":6,"column":45}}}) : helper)))
    + "</label>\n    </div>\n    <div class=\"icon_theme_preview\"></div>\n</div>\n<div class=\"icon-them-container\" data-theme=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"themeCode") : depth0)) != null ? lookupProperty(stack1,"DARK") : stack1), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"darkLabel") || (depth0 != null ? lookupProperty(depth0,"darkLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"darkLabel","hash":{},"loc":{"start":{"line":10,"column":77},"end":{"line":10,"column":90}}}) : helper)))
    + "\">\n    <div class=\"icon-label-container\">\n        <div class=\"icon_theme_input\">\n            <input type=\"radio\" name=\"theme\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"darkLabel") || (depth0 != null ? lookupProperty(depth0,"darkLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"darkLabel","hash":{},"loc":{"start":{"line":13,"column":52},"end":{"line":13,"column":65}}}) : helper)))
    + "\" value=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"themeCode") : depth0)) != null ? lookupProperty(stack1,"DARK") : stack1), depth0))
    + "\" tabindex=\"0\" id=\"dark\" />\n        </div>\n        <label for=\"dark\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"lightLabel") || (depth0 != null ? lookupProperty(depth0,"lightLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"lightLabel","hash":{},"loc":{"start":{"line":15,"column":26},"end":{"line":15,"column":40}}}) : helper)))
    + "</label>\n    </div>\n    <div class=\"icon_theme_preview\"></div>\n</div>\n<div class=\"icon-them-container\" data-theme=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"themeCode") : depth0)) != null ? lookupProperty(stack1,"LIGHT") : stack1), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"lightLabel") || (depth0 != null ? lookupProperty(depth0,"lightLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"lightLabel","hash":{},"loc":{"start":{"line":19,"column":78},"end":{"line":19,"column":92}}}) : helper)))
    + "\">\n    <div class=\"icon-label-container\">\n        <div class=\"icon_theme_input\">\n            <input type=\"radio\" name=\"theme\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"lightLabel") || (depth0 != null ? lookupProperty(depth0,"lightLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"lightLabel","hash":{},"loc":{"start":{"line":22,"column":52},"end":{"line":22,"column":66}}}) : helper)))
    + "\" value=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"themeCode") : depth0)) != null ? lookupProperty(stack1,"LIGHT") : stack1), depth0))
    + "\" id=\"light\"\n                tabindex=\"0\" />\n        </div>\n        <label for=\"light\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"darkLabel") || (depth0 != null ? lookupProperty(depth0,"darkLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"darkLabel","hash":{},"loc":{"start":{"line":25,"column":27},"end":{"line":25,"column":40}}}) : helper)))
    + "</label>\n    </div>\n    <div class=\"icon_theme_preview\"></div>\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_settings.panel_settings_icons.setting_impl_icons.setting.view', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/settings.panel/settings/icons.setting/impl/icons.setting.view',[],function(){});

csui.define('csui/perspective.manage/settings.panel/settings/icons.setting/icons.setting.view',[
  "csui/lib/underscore",
  "csui/lib/jquery",
  "csui/lib/marionette",
  "csui/lib/handlebars",
  "csui/pages/start/start.page.view",
  "i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang",
  "hbs!csui/perspective.manage/settings.panel/settings/icons.setting/impl/icons.setting.view",
  "css!csui/perspective.manage/settings.panel/settings/icons.setting/impl/icons.setting.view",
], function (_, $, Marionette, Handlebars, StartPageView, lang, template) {
  "use strict";

  const THEMECODE = {
    DEFAULT: "default",
    DARK: "dark",
    LIGHT: "light",
  };

  var IconsSettingView = Marionette.ItemView.extend({
    className: "icon-settings-view",
    template: template,
    constructor: function IconsSettingView(options) {
      options = _.defaults(options, {
        theme: "",
      });
      this.options = options;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    ui: {
      icons: ".icon-them-container",
    },
    events: {
      "change input": "onChangeTheme",
      "click @ui.icons": "onClickContainer",
      "keydown @ui.icons": "onClickContainer",
    },
    templateHelpers: function () {
      return {
        defaultLabel: lang.defaultLabel,
        darkLabel: lang.darkLabel,
        lightLabel: lang.lightLabel,
        themeCode: THEMECODE,
      };
    },
    onShow: function () {
      let activeTheme = Object.keys(this.options?.linkColor).length
        ? this.options?.linkColor
        : this.options?.brandingSettingCodes?.iconThemes;
      this.setTheme(activeTheme);
    },

    onClickContainer: function (event) {
      if (
        event.type === "click" ||
        event.keyCode === 13 ||
        event.keyCode === 32
      ) {
        this.setTheme($(event.currentTarget).attr("data-theme"), true);
      }
    },

    getValue: function () {
      return {
        theme: this.$el.find("input:checked").val(),
      };
    },
    setTheme: function (theme, triggerEvent) {
      theme = theme || THEMECODE.DEFAULT;
      this.ui.icons.removeClass("binf-active");
      this.ui.icons.find("input").prop("checked", false);
      var active = this.ui.icons.filter("[data-theme='" + theme + "']");
      active.addClass("binf-active");
      active.find("input").prop("checked", true);

      triggerEvent &&
        this.trigger("change", {
          theme: theme,
        });
    },

    resetToDefault: function () {
      this.setTheme("", true);
      return $.Deferred().resolve(this.getValue());
    },
  });

  Handlebars.registerHelper("toLowerCase", function (str) {
    return str.toLowerCase();
  });

  return IconsSettingView;
});


csui.define('csui/perspective.manage/settings.panel/settings/icon.settings',['csui/lib/underscore',
    'csui/perspective.manage/settings.panel/settings/icons.setting/icons.setting.view',
    'i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang',
],
    function (_, IconSettingsView, lang) {
        return {
            "title": lang.icons,
            "view": IconSettingsView,
            getConfigFromFormData: function (iconData) {
                return {
                    brandingSettingCodes:{
                        iconThemes: iconData.theme || 'default'
                    }                
                };
            },

            getFormDataFromConfig: function (headerConfig) {
                return {
                    linkColor: _.get(headerConfig.brandingSettingCodes, ['iconThemes']) || {}
                }
            },

            getDefaultConfig: function () {
                return {
                    brandingSettingCodes:{
                        iconThemes: "default"
                    } 
                };
            }
        };
    });



csui.define('csui/perspective.manage/settings.panel/setting.items',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/perspective.manage/settings.panel/settings/branding.form',
  'csui/perspective.manage/settings.panel/settings/breadcrumb.form',
  'csui/perspective.manage/settings.panel/settings/icon.settings',
  'csui-ext!csui/perspective.manage/settings.panel/setting.items'
], function (_, Backbone, 
  brandingForm, breadcrumbForm, iconSettings, extraAccordions) {

  var BrandingAccordionModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      title: null,
      name: '',
      contentView: null,
      contentViewOptions: null
    },

    constructor: function BrandingAccordionModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var BrandingAccordionCollection = Backbone.Collection.extend({

    model: BrandingAccordionModel,
    comparator: "sequence",

    constructor: function BrandingAccordionCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }

  });

  var BrandingAccordions = new BrandingAccordionCollection([
    {
      sequence: 10,
      contentView: brandingForm
    },
    {
      sequence: 20,
      contentView: breadcrumbForm
    },
    {
      sequence: 30,
      contentView: iconSettings
    }
  ]);

  if (extraAccordions) {
    BrandingAccordions.add(_.flatten(extraAccordions, true));
  }
  return BrandingAccordions;

});


csui.define('csui/perspective.manage/settings.panel/settings/settings',['csui/lib/underscore', 'csui/lib/jquery',
    'csui/lib/backbone',
    'csui/perspective.manage/settings.panel/setting.items',
], function (_, $, Backbone, accordionItems) {
    let settings = [];
    accordionItems.each(function (item) {
       settings.push(item.get("contentView"));
      });

    var SettingModel = Backbone.Model.extend({
        constructor: function SettingModel(attributes, options) {
            Backbone.Model.prototype.constructor.call(this, attributes, options);
            this._getConfigFromFormData = attributes.getConfigFromFormData;
            this._getFormDataFromConfig = attributes.getFormDataFromConfig;
            this._getDefaultConfig = attributes.getDefaultConfig;
        },

        getConfigFromFormData: function (formData, headerConfig) {
            var configVal = this._getConfigFromFormData.apply(this, arguments);
            if (this.get('widgetId')) {
                var widgets = headerConfig.options.header.widgets;
                var wIndex = _.findIndex(widgets, function (w) {
                    return w.view === this.get('widgetId')
                }, this);
                var widgetConfig = widgets[wIndex];
                widgetConfig.options = $.extend(true, {}, widgetConfig.options, configVal);
                var changeWidgets = [];
                changeWidgets[wIndex] = widgetConfig;
                configVal = {
                    options: {
                        header: {
                            widgets: changeWidgets
                        }
                    }
                };
            }
            return configVal;
        },

        getFormDataFromConfig: function (headerConfig) {
            if (this.get('widgetId')) {
                var widgetConfig = _.findWhere(headerConfig.options.header.widgets,
                    { view: this.get('widgetId') });
                headerConfig = widgetConfig.options;
            }
            return (this._getFormDataFromConfig && this._getFormDataFromConfig(headerConfig)) || {};
        },

        getDefaultConfig: function () {
            return _.isFunction(this._getDefaultConfig) ? this._getDefaultConfig() : {};
        },

        getData: function (headerConfig) {
            var formData = this.getFormDataFromConfig(headerConfig),
                defaultData = this.getDefaultConfig(),
                data = $.extend(true, {}, defaultData, formData);
            return data;
        },

        hasOwnView: function () {
            return !!this.get('view');
        }
    });

    var SettingsCollection = Backbone.Collection.extend({
        model: SettingModel
    })
    return new SettingsCollection(settings);
});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/settings.panel/impl/settings.panel',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-header-settings-list\" role=\"tablist\">\n</div>\n\n<div class=\"csui-header-settings-footer\">\n   <button role=\"button\" class=\"binf-btn csui-header-config-reset-btn\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"resetTitle") || (depth0 != null ? lookupProperty(depth0,"resetTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"resetTitle","hash":{},"loc":{"start":{"line":5,"column":83},"end":{"line":5,"column":97}}}) : helper)))
    + "\">\n      "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"resetLabel") || (depth0 != null ? lookupProperty(depth0,"resetLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"resetLabel","hash":{},"loc":{"start":{"line":6,"column":6},"end":{"line":6,"column":20}}}) : helper)))
    + "\n    </button>\n</div>\n";
}});
Handlebars.registerPartial('csui_perspective.manage_settings.panel_impl_settings.panel', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/settings.panel/impl/setting',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"pman-setting-header csui-accordion-header\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"expandTab") || (depth0 != null ? lookupProperty(depth0,"expandTab") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"expandTab","hash":{},"loc":{"start":{"line":1,"column":67},"end":{"line":1,"column":80}}}) : helper)))
    + " "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"settingTitle") || (depth0 != null ? lookupProperty(depth0,"settingTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"settingTitle","hash":{},"loc":{"start":{"line":1,"column":81},"end":{"line":1,"column":97}}}) : helper)))
    + "\" role=\"tab\" tabindex=\"0\">\n    <div class=\"csui-accordion-header-title\" aria-hidden=\"true\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"settingTitle") || (depth0 != null ? lookupProperty(depth0,"settingTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"settingTitle","hash":{},"loc":{"start":{"line":2,"column":64},"end":{"line":2,"column":80}}}) : helper)))
    + "</div>\n    <span class=\"csui-button-icon cs-icon icon-expandArrowDown\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"expandTab") || (depth0 != null ? lookupProperty(depth0,"expandTab") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"expandTab","hash":{},"loc":{"start":{"line":3,"column":71},"end":{"line":3,"column":84}}}) : helper)))
    + " "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"settingTitle") || (depth0 != null ? lookupProperty(depth0,"settingTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"settingTitle","hash":{},"loc":{"start":{"line":3,"column":85},"end":{"line":3,"column":101}}}) : helper)))
    + "\"></span>\n    <span class=\"csui-button-icon cs-icon icon-expandArrowUp\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"collapseTab") || (depth0 != null ? lookupProperty(depth0,"collapseTab") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"collapseTab","hash":{},"loc":{"start":{"line":4,"column":69},"end":{"line":4,"column":84}}}) : helper)))
    + " "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"settingTitle") || (depth0 != null ? lookupProperty(depth0,"settingTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"settingTitle","hash":{},"loc":{"start":{"line":4,"column":85},"end":{"line":4,"column":101}}}) : helper)))
    + "\"></span>\n</div>\n<div class=\"pman-setting-content csui-accordion-content perspective-widget-form csui-pman-form-wrapper binf-hidden\"></div>";
}});
Handlebars.registerPartial('csui_perspective.manage_settings.panel_impl_setting', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/settings.panel/impl/settings.panel',[],function(){});

csui.define('csui/perspective.manage/settings.panel/settings.panel.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
    'csui/utils/base', 'csui/perspective.manage/settings.panel/settings/settings',
    'csui/controls/form/form.view',
    'csui/dialogs/modal.alert/modal.alert',
    'i18n!csui/perspective.manage/impl/nls/lang',
    'hbs!csui/perspective.manage/settings.panel/impl/settings.panel',
    'hbs!csui/perspective.manage/settings.panel/impl/setting',
    'css!csui/perspective.manage/settings.panel/impl/settings.panel',
], function (_, $, Backbone, Marionette, base, allSettings, FormView, ModalAlert, lang, template, settingTemplate) {

    var SettingView = Marionette.LayoutView.extend({
        template: settingTemplate,
        className: 'pman-header-setting-container',

        ui: {
            accordionHeader: '.csui-accordion-header',
            accordionContent: '.csui-accordion-content',
            accordionHeaderIcon: '.csui-accordion-header .cs-icon',
        },

        regions: {
            contentRegion: '@ui.accordionContent'
        },

        events: {
            'click @ui.accordionHeader': "toggle",
            'keydown @ui.accordionHeader': "toggle",
        },


        templateHelpers: function () {
            return {
                settingTitle: this.model.get('title'),
                expandTab: lang.expandTab,
                collapseTab: lang.collapseTab
            }
        },

        initialize: function () {
            this.defaultbrandingSettingCodes = [];
            const data = this.model.getData(this.options.previewBranding.toJSON());
            if (this.model.hasOwnView()) {
                var options = _.defaults({
                    context: this.options.context
                }, data);
                this.settingsView = new (this.model.get('view'))(options);
                this.settingsView.on('change', this._onChange, this);
            } else {
                var formModel = new Backbone.Model({
                    schema: this.model.get('schema'),
                    options: this.model.get('options'),
                    data: data
                })
                this.formView = new FormView({
                    // layoutMode: "singleCol",
                    mode: "create",
                    model: formModel,
                    context: this.options.context
                });
                this.formView.on('change:field', this._onChange, this);
            }
        },

        _onChange: function () {
            this.triggerMethod('change:setting', this.getSettingChange());
        },

        resetToDefault: function () {
            var self = this, deferred = $.Deferred();
            if (this.model.hasOwnView() && _.isFunction(this.settingsView.resetToDefault)) {
                this.settingsView.resetToDefault().then(deferred.resolve, deferred.reject)
            } else if (this.formView) {
                var defaultConfig = this.model.getDefaultConfig();
                this.formView.on('render:form', function () {
                    deferred.resolve(self.getSettingChange());
                });
                this.formView.model.set('data', defaultConfig);
                this.formView.updateForm();
            } else {
                deferred.resolve({});
            }
            return deferred.promise();
        },
        onRender: function () {
            if (this.model.hasOwnView()) {
                this.contentRegion.show(this.settingsView);
            } else if (this.model.has('schema')) {
                this.contentRegion.show(this.formView);
            }
        },

        getSettingChange: function () {
            settingData = {},
                settingChange = {};
            if (this.model.hasOwnView()) {
                settingData = this.settingsView.getValue();
            } else {
                settingData = this.formView.getValues();
            }
            settingChange = this.model.getConfigFromFormData(settingData);
            //this.defaultbrandingSettingCodes.push(settingChange.brandingSettingCodes);
            //console.log(this.defaultbrandingSettingCodes);
            return settingChange;
        },

        toggle: function (event) {
            if (event.type === 'click' || (event.keyCode === 13 || event.keyCode === 32)) {
                var isClosed = this.ui.accordionHeader.hasClass('csui-accordion-expand');
                this.ui.accordionHeader.toggleClass("csui-accordion-expand");
                var actionClass = !isClosed ? 'addClass' : 'removeClass';
                if (!isClosed) {
                    this.ui.accordionContent.removeClass('binf-hidden');
                    this.ui.accordionHeader[0].setAttribute("aria-label", `${lang.collapseTab} ${this.model.get('title')}`);
                } else {
                    base.onTransitionEnd(this.ui.accordionContent, function () {
                        if (!this.ui.accordionHeader.hasClass("csui-accordion-expand")) {
                            this.ui.accordionContent.addClass('binf-hidden');
                            this.ui.accordionHeader[0].setAttribute("aria-label", `${lang.expandTab} ${this.model.get('title')}`);
                        }
                    }, this);
                }
                setTimeout(_.bind(function () {
                    this.$el[actionClass]("csui-accordion-visible");
                    this.ui.accordionHeader[actionClass]("csui-accordion-expand");
                    this.ui.accordionHeader[0].setAttribute("aria-label", `${lang.collapseTab} ${this.model.get('title')}`);
                }, this));
            } else if (event.type === "keydown" && event.keyCode === 9 && event.shiftKey && $(event.currentTarget).parent().index() === 0) {// Tab & shift
                let self = this;
                setTimeout(function(){
                    self.options.pmanBrandingView.$el.find('button.cancel-edit').focus();
                  }, 0);
            }
        }
    });

    var HeaderSettingsPanel = Marionette.CompositeView.extend({
        className: 'pman-header-settings-panel csui-pman-panel csui-normal-scrolling csui-no-scroll-x',
        childView: SettingView,
        childViewContainer: '.csui-header-settings-list',
        childViewOptions: function () {
            return {
                context: this.options.context,
                previewBranding: this.options.previewBranding,
                pmanBrandingView: this.pmanBrandingView
            };
        },
        templateHelpers: function () {
            return {
                resetLabel: lang.resetToOriginalSettingLabel,
                resetTitle: lang.resetToOriginalSettingLabel
            }
        },

        template: template,

        childEvents: {
            'change:setting': 'onChangeSetting',
        },

        events: {
            'click .csui-header-config-reset-btn': "onResetToDefault",
        },

        constructor: function HeaderSettingsPanel(options) {
            options.collection = allSettings;
            this.pmanBrandingView = options?.pmanBrandingView;
            Marionette.CompositeView.prototype.constructor.apply(this, arguments);
        },

        onChangeSetting: function (child, headerSettings) {
            this.trigger('change:settings', headerSettings, child.model.get('widgetId'));
        },
        onResetToDefault: function () {
            var self = this;
            ModalAlert.showWarning(function (confirmed) {
                confirmed && self.resetToDefaultSettings();
            }, lang.resetToDefaultAlertMessage, lang.resetToOriginalSettingLabel, {
                buttons: {
                    showYes: true,
                    labelYes: lang.resetLabel,
                    showNo: false,
                    showCancel: true
                }
            });
        },
        resetToDefaultSettings: function () {
            const defaultStyles = {};
            // set all the brandingSetting codes to empty
            Object.keys(this.options.context.previewBranding?.get('brandingSettingCodes')).forEach(item=>{defaultStyles[item]=''});
            document.querySelector(".binf-widgets.perspective-editing .cs-perspective-panel").removeAttribute('style');
            this.options.context.previewBranding.set('brandLogoUri', '');
            this.options.context.previewBranding.set('brandLogoUri_id', '');
            this.options.context.previewBranding.set('brandingSettingCodes', defaultStyles);
            this.options.context.previewBranding.set('fileDetails', '');
            this.options.context.trigger('change:settings');
            this.options.context?.navigationHeaderView?.brandingConfigData?.set({brandingCSS:''});
            this.options.context?.navigationHeaderView?.brandingConfigData?.trigger('change:branding');
            this.trigger('change:settings');
            this.children.map(function (c) {
                return c.resetToDefault();
            });
        }

    })
    return HeaderSettingsPanel;
});


csui.define('csui/models/perspective/perspective.collection/perspective.collection.mixin',[
  'csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  const PerspectiveCollectionMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function () {
          return this;
        },

        url: function () {
          const apiUrl = new Url(this.connector.connection.url).getApiBase(2);
          let url;
          url = Url.combine(apiUrl, 'perspectives/list');
          return url;
        },

        parse: function (response) {
          let perspectiveCollection = []
          for(let perspective of response.results){
            perspectiveCollection.push({
              av_id: perspective.dataid,
              title: perspective.name,
              perspective: {type:perspective.layoutType},
              hasOnlybasicPerspectiveInfo: true //flag used to fetch complete perspective information
            });
          }
          return perspectiveCollection;
        }
      });
    }
  };
  return PerspectiveCollectionMixin;
});

csui.define('csui/models/perspective/perspective.collection/perspective.collection',['csui/lib/underscore',
  'csui/lib/backbone',
  'csui/models/perspective/perspective.model',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/perspective/perspective.collection/perspective.collection.mixin',
], function (_, Backbone, PerspectiveModel, ConnectableMixin, PerspectiveCollectionMixin) {

  const PerspectiveCollection = Backbone.Collection.extend({
    model: PerspectiveModel,
    constructor: function PerspectiveCollection( options = {}, models ) {
      this.options = options;
      Backbone.Collection.prototype.constructor.call(this, models, options);
      this.makeConnectable(options)
        .makeServerAdaptor(options);
    }
  });

  ConnectableMixin.mixin(PerspectiveCollection.prototype);
  PerspectiveCollectionMixin.mixin(PerspectiveCollection.prototype);

  return PerspectiveCollection;
});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/top.ribbon/top.ribbon.item',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-top-ribbon-layout\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"layout") || (depth0 != null ? lookupProperty(depth0,"layout") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"layout","hash":{},"loc":{"start":{"line":1,"column":36},"end":{"line":1,"column":46}}}) : helper)))
    + "</div>\n<div class=\"csui-top-ribbon-name\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":2,"column":34},"end":{"line":2,"column":42}}}) : helper)))
    + "</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_top.ribbon_top.ribbon.item', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspective.manage/impl/top.ribbon/top.ribbon.item.view',["csui/lib/backbone", 'csui/lib/marionette3',
    'csui/models/perspective/perspective.template.model',
    'csui/utils/contexts/factories/connector',
    'hbs!csui/perspective.manage/impl/top.ribbon/top.ribbon.item'
], function (Backbone, Marionette, PerspectiveTemplateModel, ConnectorFactory, TopRibbonTemplate) {
    'use strict';
    let TopRibbonItemView = Marionette.View.extend({
        className: 'csui-top-ribbon-item',
        template: TopRibbonTemplate,
        tagName: 'li',

        templateContext: function () {
            return {
                name: this.options.model.get('title'),
                layout: this.options.model.get('perspective').type
            }
        },

        events: {
            'click .csui-top-ribbon-layout': 'updatePerspective',
        },

        constructor: function TopRibbonItemView(options = {}) {
            this.options = options;
            Marionette.View.prototype.constructor.call(this, options);
        },

        updatePerspective: async function () {
            const perspectiveId = this.options.model.get('av_id');
            const context = this.options.originatingView.context;
            let perspectiveModel;
            if (this.options.model.get('hasOnlybasicPerspectiveInfo')) {
                this.options.model = new Backbone.Model(await this.fetchPerspective(perspectiveId));
            }
            if(this.options.model.has('perspective')){
                let perspectiveConfig = this.options.model.get('perspective');
                perspectiveConfig.options.perspectiveMode = this.options.originatingView.mode 
                perspectiveModel = new Backbone.Model(perspectiveConfig);
                perspectiveModel && context.triggerMethod('enter:edit:perspective', perspectiveModel);
            }
        },

        fetchPerspective: async function (perspectiveId) {
            const perspectiveTemplate = new PerspectiveTemplateModel(
                { id: perspectiveId },
                { connector: this.options.originatingView.context.getObject(ConnectorFactory) });
            const model = await perspectiveTemplate.fetch();
            if(model?.perspectives.length){
                return model.perspectives[0];
            }
        }
    });
    return TopRibbonItemView;
});


csui.define('css!csui/perspective.manage/impl/top.ribbon/top.ribbon',[],function(){});

csui.define('csui/perspective.manage/impl/top.ribbon/top.ribbon.view',['csui/lib/marionette3',
    'csui/utils/contexts/factories/connector',
    'csui/models/perspective/perspective.collection/perspective.collection',
    'csui/perspective.manage/impl/top.ribbon/top.ribbon.item.view',
    'css!csui/perspective.manage/impl/top.ribbon/top.ribbon',
], function (Marionette, ConnectorFactory, PerspectiveCollection, TopRibbonItemView) {
    'use strict';
    let TopRibbonView = Marionette.CollectionView.extend({
        className: 'csui-top-ribbon',
        tagName: 'ul',
        childView: TopRibbonItemView,

        childViewOptions: function () {
            return {
                originatingView: this.options.parentView
            };
        },

        constructor: function TopRibbonView(options = {}) {
            this.options = options;
            Marionette.CollectionView.prototype.constructor.call(this, options);
        },

        initialize: function () {
            this.collection = new PerspectiveCollection({
                connector: this.options.context.getObject(ConnectorFactory)
            });
        },

        onRender: function () {
            this.collection.fetch();
        }

    });
    return TopRibbonView;
});

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/pman.branding',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <li>\n          <a class=\"pman-tab\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"pageContent") : depth0), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"pageContentAriaLabel") : depth0), depth0))
    + "\" role=\"button\" tabindex=\"0\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"pageContent") : depth0), depth0))
    + "</a>\n        </li>\n        <li>\n          <a class=\"pman-tab pman-header-tab\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"header") : depth0), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"headerAriaLabel") : depth0), depth0))
    + "\" role=\"button\" tabindex=\"0\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"header") : depth0), depth0))
    + "</a>\n        </li>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <li>\n            <button class=\"binf-btn icon-reset\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"reset") : depth0), depth0))
    + "\"\n                    aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"resetAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"reset") : depth0), depth0))
    + "</button>\n          </li>\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "  <div class=\"pman-top-ribbon\"></div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"pman-backdrop\"></div>\n<div class=\"pman-header\">\n  <div class=\"pman-header-backdrop\"></div>\n  <div class=\"pman-tools-container\">\n    <div class=\"pman-left-tools\">\n      <ul>\n        <li class=\"pman-toolitem icon-help-container\">\n          <button class=\"icon icon-help\" title=\"Help\"></button>\n        </li>\n        <li class=\"pman-toolitem toolbarAddContainer\">\n          <button class=\"icon icon-toolbarAdd\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"addWidget") : depth0), depth0))
    + "\"></button>\n        </li>\n      </ul>\n      <div class=\"pman-pannel-wrapper\"></div>\n    </div>\n      <div class=\"pman-center-tools\">\n       \n      <ul class=\"pman-tabs-container\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isHomePage") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":19,"column":8},"end":{"line":26,"column":15}}})) != null ? stack1 : "")
    + "      </ul>\n    </div>\n    <div class=\"pman-right-tools\">\n      <ul>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"personalizeMode") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":31,"column":8},"end":{"line":36,"column":15}}})) != null ? stack1 : "")
    + "        <li>\n          <button class=\"binf-btn icon-save\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "\"\n                  aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"saveAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "</button>\n        </li>\n        <li>\n          <button class=\"binf-btn cancel-edit\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "\"\n                  aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancelAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "</button>\n        </li>\n      </ul>\n    </div>\n  </div>\n  <div class=\"pman-trash-area\">\n    <div class=\"pman-trash-banner\"></div>\n  </div>\n</div>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"enableTopRibbon") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"loc":{"start":{"line":52,"column":0},"end":{"line":54,"column":7}}})) != null ? stack1 : "")
    + "<div id=\"breadcrumb-wrap\" class=\"pman-header-config breadcrumb-wrap-visible\">\n  <div class=\"pman-header-preview-panel\">\n    <div class=\"pman-header-container pman-container-header-container\">\n      <div class=\"pman-container-header\"></div>\n      <div class=\"breadcrumb-inner breadcrumb-inner-header pman-container-breadcrumb csui-perspective-breadcrumb\">\n      </div>\n    </div>\n  </div>\n  <div class=\"pman-header-settings-container\">\n  </div>\n</div>\n<div class=\"pman-backdrop\"></div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_pman.branding', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/impl/pman.branding',[],function(){});

csui.define('csui/perspective.manage/pman.view.branding',['module','csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/perspective.manage/pman.view',
  "csui/pages/start/start.page.view",
  'csui/pages/start/impl/navigationheader/navigationheader.view',
  'smart/controls/app.header/app.header.view', 'i18n',
  'csui/perspective.manage/settings.panel/settings.panel.view',
  'csui/controls/breadcrumbs/breadcrumbs.view',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/next.node',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'csui/utils/commonconfig.util',
  'csui/perspective.manage/impl/top.ribbon/top.ribbon.view',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/pman.branding',
  'csui/utils/contexts/factories/branding.config.factory',
  'csui/utils/namedsessionstorage',
  'css!csui/perspective.manage/impl/pman.branding',
  'css!csui/perspective.manage/settings.panel/impl/settings.panel',
], function (module, _, $, Backbone, Marionette, CSUIPManView, StartPageView, CSUINavigationHeaderView, SmartNavigationHeaderView, i18n, SettingsPanelView, BreadcrumbsView, ApplicationScopeModelFactory,
  NextNodeModelFactory, TabablesBehavior, CommonConfig, TopRibbonView, lang, template, BrandingConfigFactory, NamedSessionStorage) {

  var pmanContainer;

  let config = module.config();
  _.defaults(config, {
    enableHome: CommonConfig.enableFeatureInSmartView() || false
  });

  var BrandingPManView = CSUIPManView.extend({
    className: function () {
      return CSUIPManView.prototype.className.call(this) + " branding-pman";
    },
    ui: _.extend(
      {
        centerTools: '.pman-header .pman-center-tools',
        centerToolsTab: '.pman-header .pman-center-tools .pman-tab',
        headerContainer: '.pman-container-header-container .pman-container-header',
        breadcrumbContainer: '.pman-container-header-container .pman-container-breadcrumb',
        settingsContainer: '.pman-header-settings-container',
        topRibbon : '.pman-top-ribbon'
      }, CSUIPManView.prototype.ui
    ),
    events: _.extend(
      {
        'click @ui.centerToolsTab': 'onTabClick'
      }, CSUIPManView.prototype.events
    ),
    template: template,
    templateHelpers: function () {
      var csuiHelpers = CSUIPManView.prototype.templateHelpers.call(this);
      return _.extend(csuiHelpers, {
        pageContent: lang.pageContent,
        pageContentAriaLabel: lang.pageContentAriaLabel,
        header: lang.header,
        headerAriaLabel: lang.headerAriaLabel,
        labelHomepageHeader: lang.homePageHeader,
        labelPageHeader: lang.pageHeader,
        isHomePage: this.isHomePage,
        enableTopRibbon: this.isHomePage && CommonConfig.enableSideBar()
      })
    },
    constructor: function BrandingPManView(options) {
      CSUIPManView.prototype.constructor.apply(this, arguments);
      this.on('render', this._onPmanRender);
      this.brandingSettingsModel = new Backbone.Model();
      this.context.previewBranding = this.context.getModel(BrandingConfigFactory);
      this.isHomePage = !this.context.getModel(ApplicationScopeModelFactory).get('id');
      let brandingConfig = this.context.navigationHeaderView?.brandingConfigData ?? 
      this.context.navigationHeaderView?.options?.brandingConfig ?? {};
      const brandLogoUri = brandingConfig?.get('brandLogoUri');
      const brandLogoUri_id = brandingConfig?.get('brandLogoUri_id');
      const brandingSettingCodes = brandingConfig?.get('brandingSettingCodes');
      brandLogoUri && this.context.previewBranding.set({brandLogoUri});    
      brandLogoUri_id && this.context.previewBranding.set({brandLogoUri_id});    
      brandingSettingCodes && this.context.previewBranding.set({brandingSettingCodes});
    },
    _doCleanup: function () {
      BrandingPManView.__super__._doCleanup.apply(this, arguments);
      $(document.body).removeClass('csui-pman-header-config');
      this.isHomePage && this.options.container.removeClass('csui-top-ribbon-enabled');
      this.originalLogoUrl && URL.revokeObjectURL(this.originalLogoUrl);
      // removing all the data
      this.context.previewBranding?.set({brandingSettingCodes: undefined, brandLogoUri: undefined});
      const tempBrandingCSS =  this.context.navigationHeaderView?.brandingConfigData?.get('tempBrandingCSS');
      tempBrandingCSS && this.context.navigationHeaderView?.brandingConfigData?.set({brandingCSS: tempBrandingCSS});
      this.context?.navigationHeaderView?.brandingConfigData?.trigger('change:branding');
      this.landingHeader?.destroy();
      this.containerHeader?.destroy();
      this.previewHeader?.render();
    },

    getContainer: function () {
      if (!pmanContainer || !$.contains(this.options.container, pmanContainer)) {
        pmanContainer = $('<div>').appendTo(this.options.container)[0]
      }
      return pmanContainer;
    },
    _onPmanRender: function () {
      this.isHomePage && this.options.container.addClass('csui-top-ribbon-enabled');
      this.ui.centerTools.find('.pman-tab').first().addClass('binf-active');
      if (this.ui.topRibbon.length > 0) {
        this.topRibbonRegion = new Marionette.Region({
          el: this.ui.topRibbon
        });
        this.topRibbonView = new TopRibbonView({
          context: this.context,
          parentView: this
        });
        this.topRibbonRegion.show(this.topRibbonView);
      }
    },
    onTabClick: function (event) {
      this.ui.centerTools.find('.pman-tab').removeClass('binf-active');
      $(event.target).addClass('binf-active');
      if ($(event.target).hasClass('pman-header-tab')) {
        this.options.mode = 'editNavigationHeader';
        $(document.body).addClass('csui-pman-header-config');
        if (!this.$el.find('.csui-header-settings-list').length) {
          this._showHeader();
        }
      } else {
        this.options.mode = 'edit';
        $(document.body).removeClass('csui-pman-header-config');
      }
    },
    _showHeader: function () {
      this._initHeaderPreview();
      this._initSettingsPanel();
    },
    _initHeaderPreview: function () {
      this._initExtendedHeaderPreview();
      this._initBreadcrumb();
    },
    _initExtendedHeaderPreview: function () {
      var nextNode = this.context.getModel(NextNodeModelFactory, { unique: true });
      var applicationScope = this.context.getModel(ApplicationScopeModelFactory, { unique: true });
      applicationScope.set("id", "");
      // duplicate is required to avoid complete re-render and avoid destroying of navigation bar
      this.useV2AppHeader = StartPageView.useV2AppHeader;
      let NavigationHeaderView = this.useV2AppHeader
        ? SmartNavigationHeaderView
        : CSUINavigationHeaderView;
      this.previewHeader = new NavigationHeaderView({
        context: this.context,
        previewBranding: this.context.previewBranding,
        nextNode: nextNode,
        applicationScope: applicationScope,
        isPerspectiveEdit: true,
        transparent: true,
        enableHamburger: StartPageView.enableHamburger,
        rtl: i18n.settings.rtl,
        brandingConfig: this.context.previewBranding
      });

      this.containerHeaderRegion = new Marionette.Region({
        el: this.ui.headerContainer
      });
      this.containerHeaderRegion.show(this.previewHeader);
      this.previewHeader?.options?.brandingConfig.trigger('change:branding');
      this.previewHeader.on("render", this._preventDefaultFocusables, this.previewHeader);
    },
    _initBreadcrumb: function () {
      var breadcrumbCollection = new Backbone.Collection([
        { container: true, name: lang.enterprise },
        { container: true, name: lang.productManagement },
        { container: true, name: lang.images }
      ]);
      this.breadcrumbs = new BreadcrumbsView({
        context: this.context,
        collection: breadcrumbCollection,
        fetchOnCollectionUpdate: false,
        enableHome: config.enableHome,
        theme: 'dark',
        honorCustomizations: true,
        textColor: this.context?.previewBranding?.get("brandingSettingCodes")?.breadcrumbColor
      });

      this.breadcrumbRegion = new Marionette.Region({
        el: this.ui.breadcrumbContainer
      });

      this.breadcrumbRegion.show(this.breadcrumbs);
      this.breadcrumbs.listenTo(this.breadcrumbs, 'render', this._preventDefaultFocusables, this.breadcrumbs);
      this.breadcrumbs.synchronizeCollections();
    },
    _initSettingsPanel: function () {
      var settingsPanel = new SettingsPanelView({ context: this.context, previewBranding: this.context.previewBranding, pmanBrandingView: this });
      this.settingsRegion = new Marionette.Region({
        el: this.ui.settingsContainer
      });
      this.settingsRegion.show(settingsPanel);

      this.listenTo(settingsPanel, 'change:settings', function (updatedConfig) {
        if (!updatedConfig || Object.keys(updatedConfig).length === 0) return;
        let updatedValue = {
          brandingSettingCodes: {},
        };
       
        let brandingSettingCodes = this.context.previewBranding.get('brandingSettingCodes');
        let tempBrandingSettingCodes = updatedConfig.brandingSettingCodes || {};
        
        // checking for default color for header bar element.
        const headerBarEle = this.useV2AppHeader
          ? this.previewHeader?.el?.querySelector("otc-header-bar")
          : this.previewHeader?.el?.querySelector(
              ".binf-widgets .csui-navbar.binf-navbar",
            );
        const color = headerBarEle
          ? getComputedStyle(headerBarEle)?.backgroundColor
          : "#FFFFFF";

        if (updatedConfig.brandingSettingCodes?.customBrandingBgColor && updatedConfig.brandingSettingCodes?.customBrandingBgColor !== color) {
          tempBrandingSettingCodes = { ...brandingSettingCodes, customBrandingBgColor:  updatedConfig.brandingSettingCodes.customBrandingBgColor };
          updatedValue.brandingSettingCodes = tempBrandingSettingCodes;
        }

        const updateTextValue = (textKey) => {
          if (updatedConfig.brandingSettingCodes[textKey]) {
            tempBrandingSettingCodes = {
              ...brandingSettingCodes,
              ...tempBrandingSettingCodes,
              [textKey]: updatedConfig.brandingSettingCodes[textKey],
            };
            updatedValue.brandingSettingCodes = tempBrandingSettingCodes;
          } else if (updatedConfig.brandingSettingCodes[textKey] === "") {
            updatedValue.brandingSettingCodes[textKey] = "";
          }
        };

        updateTextValue("breadcrumbColor");
        updateTextValue("iconThemes");
        updateTextValue("primaryText");
        updateTextValue("secondaryText");
        updateTextValue("versionText");

        if (updatedConfig.brandLogoUri) {
          updatedValue.brandLogoUri = updatedConfig.brandLogoUri;
          updatedValue.fileDetails = updatedConfig.fileDetails;
        }

        updatedValue.brandingSettingCodes = {
          ...(this.context.previewBranding?.attributes.brandingSettingCodes ||
            {}),
          ...updatedValue.brandingSettingCodes,
        };
        updatedValue = { ...this.context.previewBranding?.attributes || {}, ...updatedValue };
        this.context.previewBranding.set(updatedValue);
        this.previewHeader?.options?.brandingConfig.trigger('change:branding');
        // this flag is to determile any update in branding.
        this.context.previewBranding.set("isBrandingChangeTriggered", true);
        this.options.context.trigger('change');
        this._updateStyling(updatedValue);
        this.breadcrumbs.options.textColor = updatedValue?.brandingSettingCodes?.breadcrumbColor;
        this.breadcrumbs.render();
      });
    },

    _updateStyling: function (brandConfig) {
      const DEFAULT_COLOR = "transparent";
      let CUSTOM_BG_COLOR_ELEMENTS = [
        ".binf-widgets.csui-pman-header-config .pman-header-preview-panel"
      ];

      let CUSTOM_BG_COLOR_EXTERNAL_ELEMENTS = [];

      if(this.useV2AppHeader) {
        CUSTOM_BG_COLOR_ELEMENTS = [...CUSTOM_BG_COLOR_ELEMENTS, 
          ".binf-widgets #breadcrumb-wrap .csui-perspective-breadcrumb",
          ".binf-widgets #breadcrumb-wrap .breadcrumb-inner.breadcrumb-inner-header",
          ".binf-widgets .csui-perspective-breadcrumb",
        ];
      }

      if(this.useV2AppHeader && brandConfig?.brandingSettingCodes?.customBrandingBgColor?.length > 0) {
        CUSTOM_BG_COLOR_ELEMENTS = [...CUSTOM_BG_COLOR_ELEMENTS,
          ".binf-widgets .csui-image-picker .csui-brand-image-logo",
        ];
        CUSTOM_BG_COLOR_EXTERNAL_ELEMENTS = [
          ".binf-widgets.perspective-editing .cs-perspective-panel"
        ];
      }

      const APPLY_STYLING = (ele, rootEle) => {
        let targetEle = rootEle.querySelector(ele);
        if (targetEle) {
          let bgColor =
            brandConfig.brandingSettingCodes.customBrandingBgColor ??
            DEFAULT_COLOR;
          bgColor = bgColor.trim().length > 0 ? bgColor : DEFAULT_COLOR;
          targetEle.style["background-color"] = bgColor;
          targetEle.style["background"] = bgColor;
        }
      
      }
      
      CUSTOM_BG_COLOR_ELEMENTS.forEach((ele) => {
        APPLY_STYLING(ele, this.el);
      });

      CUSTOM_BG_COLOR_EXTERNAL_ELEMENTS.forEach((ele) => {
        APPLY_STYLING(ele, document);
      });

     
      //document.querySelector('.cs-perspective-panel').style.backgroundColor = brandConfig.brandingSettingCodes.customBrandingBgColor;

    },

    _preventDefaultFocusables: function () {
      this.$el.find(TabablesBehavior.focusablesSelector).attr("tabindex", "-1");
    },

    onKeyDown: function (event) {
      switch (event.keyCode) {
        case 13: //ENTER
        if (event.target.className.includes("pman-tab")) {
            this.onTabClick(event);
          }
          event.stopPropagation();
          break;
        case 9: //TAB
          if (!event.shiftKey && $(event.target).is(this.ui.cancelEdit)) {
            const isHeaderConfigActive = this.$el.find('.pman-header-tab').hasClass('binf-active');
            if(isHeaderConfigActive){
              this._setFocusOnFirstWidgetHeader();
            }else{
              // for page content section
              this._setFocusOnFirstWidgetPageContent();
            }
            return false;
          }
      }
    },

    _setFocusOnFirstWidgetHeader: function () {
      let focusableEle = this.options.container.find('.csui-header-settings-list [tabindex=0]')?.first();
      focusableEle?.focus();
    },
    _setFocusOnFirstWidgetPageContent: function () {
      var focusableEle = this.options.container.find(
          '.cs-perspective-panel .cs-perspective .csui-pman-editable-widget')?.first(),
          shortcutButton = focusableEle.find('.shortcut-group-wrapper');
      if (shortcutButton.attr('tabindex') === '0') {
        shortcutButton[0].focus();
      } else {
        focusableEle.find('.wrapper-button')?.[0]?.focus();
      }
    },
  })
  return BrandingPManView;
});


csui.define('csui/perspective.manage/widgets/perspective.placeholder/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});
  

csui.define('csui/perspective.manage/widgets/perspective.placeholder/impl/nls/root/lang',{
  dndWidgetsHere: 'Drag and Drop widgets here',
  dndHTMLWidgetsHere: 'Drag and Drop HTML tiles only',
});
  



/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/widgets/perspective.placeholder/impl/perspective.placeholder',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-placeholder-title\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dndWidgetsHere") || (depth0 != null ? lookupProperty(depth0,"dndWidgetsHere") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dndWidgetsHere","hash":{},"loc":{"start":{"line":1,"column":43},"end":{"line":1,"column":61}}}) : helper)))
    + "\">\n  <div class=\"csui-placeholder-icon\"></div>\n  <div>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dndWidgetsHere") || (depth0 != null ? lookupProperty(depth0,"dndWidgetsHere") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dndWidgetsHere","hash":{},"loc":{"start":{"line":3,"column":7},"end":{"line":3,"column":25}}}) : helper)))
    + "</div>\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_widgets_perspective.placeholder_impl_perspective.placeholder', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/widgets/perspective.placeholder/impl/perspective.placeholder',[],function(){});

/**
 * Placeholder view to represent an empty widget in perpsective.
 * This will be replaces by perspective.widget (preview) on dropping of widgets on this
 */
csui.define('csui/perspective.manage/widgets/perspective.placeholder/perspective.placeholder.view',['csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'i18n!csui/perspective.manage/widgets/perspective.placeholder/impl/nls/lang',
  'hbs!csui/perspective.manage/widgets/perspective.placeholder/impl/perspective.placeholder',
  'css!csui/perspective.manage/widgets/perspective.placeholder/impl/perspective.placeholder'
], function (_, Backbone, Marionette, lang, template) {
  var PerspectivePlaceholderView = Marionette.ItemView.extend({
    className: 'csui-perspective-placeholder',
    template: template,
    templateHelpers: function () {
      return {
        dndWidgetsHere: this.options.widgetContainer && this.options.widgetContainer.options.grid.allowHTMLTilesOnly ?
                          lang.dndHTMLWidgetsHere : lang.dndWidgetsHere
      }
    },

    constructor: function (options) {
      Marionette.ItemView.apply(this, arguments);
    },

    onShow: function() {
      this.$el.parent().addClass('csui-pman-placeholder-container');
    },

    onDestroy: function() {
      this.$el.parent().removeClass('csui-pman-placeholder-container');
    }

  });
  return PerspectivePlaceholderView;
});

csui.define('csui/perspective.manage/widgets/perspective.widget/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});
  

csui.define('csui/perspective.manage/widgets/perspective.widget/impl/nls/root/lang',{
  noConfig: 'No configuration needed',
  clickToConfig: 'Configuration needed'
});
  



/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/widgets/perspective.widget/impl/perspective.widget',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"tile-header\">\n  <div class=\"tile-title\">\n    <h2 class=\"csui-heading\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetTitle") || (depth0 != null ? lookupProperty(depth0,"widgetTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetTitle","hash":{},"loc":{"start":{"line":3,"column":36},"end":{"line":3,"column":51}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetTitle") || (depth0 != null ? lookupProperty(depth0,"widgetTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetTitle","hash":{},"loc":{"start":{"line":3,"column":53},"end":{"line":3,"column":68}}}) : helper)))
    + "</h2>\n  </div>\n</div>\n<div>\n  <div title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetMessage") || (depth0 != null ? lookupProperty(depth0,"widgetMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetMessage","hash":{},"loc":{"start":{"line":7,"column":14},"end":{"line":7,"column":31}}}) : helper)))
    + "\" class=\"csui-pman-widget-msg\">\n    <div class=\"csui-pman-widget-icon\"></div>\n    <div>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetMessage") || (depth0 != null ? lookupProperty(depth0,"widgetMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetMessage","hash":{},"loc":{"start":{"line":9,"column":9},"end":{"line":9,"column":26}}}) : helper)))
    + "</div>\n  </div>\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_widgets_perspective.widget_impl_perspective.widget', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/widgets/perspective.widget/impl/perspective.widget',[],function(){});

/**
 * Preview view of any widget
 */
csui.define('csui/perspective.manage/widgets/perspective.widget/perspective.widget.view',['csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'i18n!csui/perspective.manage/widgets/perspective.widget/impl/nls/lang',
  'hbs!csui/perspective.manage/widgets/perspective.widget/impl/perspective.widget',
  'css!csui/perspective.manage/widgets/perspective.widget/impl/perspective.widget'
], function (_, Backbone, Marionette, lang, template) {
  var PerspectiveWidgetView = Marionette.ItemView.extend({
    className: 'csui-pman-widget',
    template: template,
    templateHelpers: function () {
      var wConfig  = this.widget && this.widget.get("manifest"),
          wTitle   = this.widget && this.widget.get('title'),
          noConfig = !wConfig || !wConfig.schema || !wConfig.schema.properties ||
                     _.isEmpty(wConfig.schema.properties);
      return {
        widgetTitle: wTitle || lang.noTitle,
        widgetMessage: noConfig ? lang.noConfig : lang.clickToConfig
      }
    },

    constructor: function (options) {
      options || (options = {});
      options = _.defaults(options, {
        data: {},
      });
      Marionette.ItemView.apply(this, arguments);
      this.widget = options.data.widget;
    }
  });
  return PerspectiveWidgetView;
});

csui.define('json!csui/perspective.manage/widgets/perspective.placeholder/perspective.placeholder.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{title}}",
  "description": "{{description}}",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {}
  }
}
  
);


csui.define('json!csui/perspective.manage/widgets/perspective.widget/perspective.widget.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{title}}",
  "description": "{{description}}",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {}
  }
}
);


csui.define('csui/perspective.manage/widgets/perspective.placeholder/impl/nls/perspective.placeholder.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/perspective.manage/widgets/perspective.placeholder/impl/nls/root/perspective.placeholder.manifest',{
  dndWidgetsHere: 'Drag and Drop widgets here'
});




csui.define('csui/perspective.manage/widgets/perspective.widget/impl/nls/perspective.widget.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/perspective.manage/widgets/perspective.widget/impl/nls/root/perspective.widget.manifest',{
  noConfig: 'No configuration needed',
  clickToConfig: 'Configuration needed'
});




csui.define('bundles/csui-perspective',[
    'csui/perspective.manage/pman.view',
    'csui/perspective.manage/pman.view.branding',
    'csui/perspective.manage/settings.panel/settings.panel.view',
    'csui/perspective.manage/behaviours/pman.widget.config.behaviour',
    'csui/perspective.manage/widgets/perspective.placeholder/perspective.placeholder.view',
    'csui/perspective.manage/widgets/perspective.widget/perspective.widget.view',
    
    // widgets manifests
    'json!csui/perspective.manage/widgets/perspective.placeholder/perspective.placeholder.manifest.json',
    'json!csui/perspective.manage/widgets/perspective.widget/perspective.widget.manifest.json',

    'i18n!csui/perspective.manage/widgets/perspective.placeholder/impl/nls/perspective.placeholder.manifest',
    'i18n!csui/perspective.manage/widgets/perspective.widget/impl/nls/perspective.widget.manifest'
], {});
  
csui.require(['require', 'css'], function (require, css) {
    css.styleLoad(require, 'csui/bundles/csui-perspective', true);
});
  
//# sourceMappingURL=csui-perspective.js.map