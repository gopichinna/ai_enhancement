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
            $(this.options.pmanView.$el.find('.pman-icon-save')).focus();
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

  return "          <li>\n            <otc-button type=\"secondary\" class=\"pman-icon-reset\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"reset") : depth0), depth0))
    + "\"\n                    arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"resetAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"reset") : depth0), depth0))
    + "</otc-button>\n          </li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"pman-backdrop\"></div>\n<div class=\"pman-header\">\n  <div class=\"pman-header-backdrop\"></div>\n  <div class=\"pman-tools-container\">\n    <div class=\"pman-left-tools\">\n      <ul>\n        <li class=\"pman-toolitem icon-help-container\">\n          <button class=\"icon icon-help\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"help") : depth0), depth0))
    + "\"></button>\n        </li>\n        <li class=\"pman-toolitem toolbarAddContainer\">\n          <button class=\"icon icon-toolbarAdd\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"addWidget") : depth0), depth0))
    + "\"></button>\n        </li>\n      </ul>\n      <div class=\"pman-pannel-wrapper\"></div>\n    </div>\n    <div class=\"pman-right-tools\">\n      <ul>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"personalizeMode") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":18,"column":8},"end":{"line":23,"column":15}}})) != null ? stack1 : "")
    + "        <li>\n          <otc-button class=\"pman-right-tools-button pman-icon-save\" disabled type=\"primary\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "\" arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"saveAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "</otc-button>\n        </li>\n        <li>\n          <otc-button class=\"pman-right-tools-button pman-cancel-edit\" type=\"secondary\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "\" arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancelAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "</otc-button>\n        </li>\n      </ul>\n    </div>\n  </div>\n  <div class=\"pman-trash-area\">\n    <div class=\"pman-trash-banner\"></div>\n  </div>\n</div>";
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
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-pman-widget-error\">\n      <div class=\"csui-pman-widget-error-heading\"> "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetTitle") || (depth0 != null ? lookupProperty(depth0,"widgetTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetTitle","hash":{},"loc":{"start":{"line":7,"column":51},"end":{"line":7,"column":66}}}) : helper)))
    + "</div>\n      <div class=\"csui-pman-widget-error-body\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"loc":{"start":{"line":9,"column":8},"end":{"line":13,"column":15}}})) != null ? stack1 : "")
    + "        <div class=\"csui-pman-widget-error-message\"> "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"configNeeded") || (depth0 != null ? lookupProperty(depth0,"configNeeded") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"configNeeded","hash":{},"loc":{"start":{"line":14,"column":53},"end":{"line":14,"column":69}}}) : helper)))
    + "</div>\n      </div>\n    </div>\n    <div class=\"csui-pman-perspective-actions\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"loc":{"start":{"line":18,"column":6},"end":{"line":32,"column":13}}})) != null ? stack1 : "")
    + "    </div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <otc-icon class=\"csui-pman-widget-error-jato-icon\" type=\"raw\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"errorIconSVG") || (depth0 != null ? lookupProperty(depth0,"errorIconSVG") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"errorIconSVG","hash":{},"loc":{"start":{"line":10,"column":77},"end":{"line":10,"column":93}}}) : helper)))
    + "\"></otc-icon>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return "          <div class=\"csui-pman-widget-error-icon\"></div>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <otc-button class=\"csui-pman-perspective-btn csui-pman-widget-edit\"\n                title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"editWidget") || (depth0 != null ? lookupProperty(depth0,"editWidget") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"editWidget","hash":{},"loc":{"start":{"line":20,"column":23},"end":{"line":20,"column":37}}}) : helper)))
    + "\" size=\"small\">\n                <otc-icon svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"informationIconSVG") || (depth0 != null ? lookupProperty(depth0,"informationIconSVG") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"informationIconSVG","hash":{},"loc":{"start":{"line":21,"column":31},"end":{"line":21,"column":53}}}) : helper)))
    + "\" ispresentation></otc-icon>\n        </otc-button>\n        <otc-button class=\"csui-pman-perspective-btn csui-pman-widget-close\"\n                title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"removeWidget") || (depth0 != null ? lookupProperty(depth0,"removeWidget") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"removeWidget","hash":{},"loc":{"start":{"line":24,"column":23},"end":{"line":24,"column":39}}}) : helper)))
    + "\" size=\"small\">\n                  <otc-icon class=\"csui-pman-widget-close-icon\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"closeIconSVG") || (depth0 != null ? lookupProperty(depth0,"closeIconSVG") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"closeIconSVG","hash":{},"loc":{"start":{"line":25,"column":69},"end":{"line":25,"column":85}}}) : helper)))
    + "\" ispresentation></otc-icon>\n        </otc-button>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <button class=\"csui-pman-perspective-btn csui-pman-widget-edit icon-edit\"\n              title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"editWidget") || (depth0 != null ? lookupProperty(depth0,"editWidget") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"editWidget","hash":{},"loc":{"start":{"line":29,"column":21},"end":{"line":29,"column":35}}}) : helper)))
    + "\"></button>\n        <button class=\"csui-pman-perspective-btn csui-pman-widget-close clear-icon\"\n                title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"removeWidget") || (depth0 != null ? lookupProperty(depth0,"removeWidget") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"removeWidget","hash":{},"loc":{"start":{"line":31,"column":23},"end":{"line":31,"column":39}}}) : helper)))
    + "\"></button>\n";
},"10":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-pman-widget-personalize-mask text-center\">\n      <otc-button class=\"csui-pman-personalize-btn csui-pman-hide-show-toggle\" type=\"primary\"\n              title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"hideShowToggle") || (depth0 != null ? lookupProperty(depth0,"hideShowToggle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"hideShowToggle","hash":{},"loc":{"start":{"line":37,"column":21},"end":{"line":37,"column":39}}}) : helper)))
    + "\"\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isWidgetHidden") : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.program(13, data, 0),"loc":{"start":{"line":38,"column":8},"end":{"line":42,"column":15}}})) != null ? stack1 : "")
    + "      >"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"hideShowToggle") || (depth0 != null ? lookupProperty(depth0,"hideShowToggle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"hideShowToggle","hash":{},"loc":{"start":{"line":43,"column":7},"end":{"line":43,"column":25}}}) : helper)))
    + "\n      </otc-button>\n    </div>\n";
},"11":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              arialabel=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"showWidgetriaLabel") || (depth0 != null ? lookupProperty(depth0,"showWidgetriaLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"showWidgetriaLabel","hash":{},"loc":{"start":{"line":39,"column":25},"end":{"line":39,"column":47}}}) : helper)))
    + "\"\n";
},"13":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              arialabel=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"hideWidgetAriaLabel") || (depth0 != null ? lookupProperty(depth0,"hideWidgetAriaLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"hideWidgetAriaLabel","hash":{},"loc":{"start":{"line":41,"column":25},"end":{"line":41,"column":48}}}) : helper)))
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
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isEditMode") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(10, data, 0),"loc":{"start":{"line":5,"column":2},"end":{"line":46,"column":9}}})) != null ? stack1 : "")
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
  'smart/themes/theming',
  'csui/themes/csui.jato.action.icons',
  'csui/themes/csui.jato.mime.icons',
  'i18n!csui/perspective.manage/behaviours/impl/nls/lang',
  'hbs!csui/perspective.manage/behaviours/impl/widget.masking',
  'csui/utils/perspective/perspective.util',
  'css!csui/perspective.manage/behaviours/impl/widget.masking',
], function (require, i18n, _, $, Marionette, base, Backbone, log, WidgetModel,
    WidgetOptionsFormView, theming, jatoActionIcons, jatoMimeIcons, lang, maskingTemplate, PerspectiveUtil) {
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
        isJATO: theming.isJATOTheme(),
        closeIconSVG: jatoActionIcons.actionErrorCircle,
        informationIconSVG: jatoActionIcons.actionInformationCircle,
        errorIconSVG: jatoMimeIcons.mimeNotification,
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
      this.isLandingPage = !!this.perspectiveView.options.context?.pmanView?.el.classList.contains('pman-landing-page');
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
          cancelBtn = $('.perspective-editing .pman-header .pman-cancel-edit'),
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
        this.$el.find(theming.isJATOTheme() ? 'otc-button' : 'button' + ':not(.wrapper-button):visible') &&
        this.$el.find(theming.isJATOTheme() ? 'otc-button' : 'button' + ':not(.wrapper-button):visible').first().trigger('focus');
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
        if(theming.isJATOTheme()) {
          manifest.hasConfigForm ? self.ui.edit.find('otc-icon').attr('svg', jatoActionIcons.actionSettings):
          self.ui.edit.find('otc-icon').attr('svg', jatoActionIcons.actionInformationCircle);
        } 
        if (self.options.perspectiveMode === "edit") {
          if (self.$el.parent().find(".cs-no-expanding").length) {
            self.ui.edit
                .attr(
                    theming.isJATOTheme() ? "arialabel" : "aria-label",
                    _.str.sformat(lang.objects, manifest.title)
                ).attr('title', _.str.sformat(lang.info, manifest.title));
          } else {
            self.ui.edit.attr(
                theming.isJATOTheme() ? "arialabel" : "aria-label",
                _.str.sformat(lang.widgetSettings, manifest.title)
            );
          }
          self.ui.delete.attr(
              theming.isJATOTheme() ? "arialabel" : "aria-label",
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

      if(event.target.classList.contains('csui-pman-widget-close') || event.target.classList.contains('csui-pman-widget-close-icon')) {
        // Avoid showing callout on click of remove widget
        return; 
      }

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
        this.perspectiveView.trigger("hide:popover");
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
      this.perspectiveView.trigger("hide:popover");
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
      this.perspectiveView.trigger("show:popover");
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
      this.perspectiveView.trigger("hide:popover");
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
      var saveBtn = $('.perspective-editing .pman-header .pman-icon-save'),
          hasError = $('.perspective-editing').find(".binf-perspective-has-error").length > 0,
          hasServerError = $('.perspective-editing').find(".csui-server-error-perspective").length > 0;
      if(this.isLandingPage){
        const topRibbon = this.perspectiveView.options.context.pmanView.topRibbonView;
        if(topRibbon.children.length > 0){
          const activePerspective = topRibbon.el.querySelector(".csui-top-ribbon-item.binf-active");
          if(activePerspective){
            if(hasError)
              activePerspective.classList.add("csui-error-perspective");
            else{
              activePerspective.classList.remove("csui-error-perspective");
            }
            if(topRibbon.el.querySelectorAll(".csui-error-perspective").length > 0 || topRibbon.collection.modifiedCount==0){
              saveBtn.prop('disabled', true);
              return;
            } 
          }            
        }
      }
      saveBtn.prop('disabled', hasError || hasServerError);
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
      if(this.isLandingPage && !this.isDestroyed) {
        this._validateWidgetConfig(); 
      }
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
  'smart/themes/theming',
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
  'csui/themes/csui.jato.action.icons',
  'css!csui/perspective.manage/impl/pman',
  'csui/perspective.manage/behaviours/pman.widget.config.behaviour',
  'csui/lib/jquery.ui/js/jquery-ui',
], function (_, $, Backbone, Marionette, base, theming, BlockingView, NonEmptyingRegion, PManPanelView, PerspectiveUtil,
  ApplicationScopeModelFactory,
  NodeModelFactory, UserModelFactory, HelpView, PersonalizationModel, DragAndDropKNMixin, lang, template, i18n,
  UpdateSupportAssetBrandingConfigMixin, CommonConfigUtil, jatoActionIcons) {
  const isJato = () => theming.isJATOTheme();
  let themes = ['light', 'dark'];
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
        help: lang.help,
        helpIcon: jatoActionIcons.actionHelpCircle,
        cancel: lang.cancel,
        cancelAriaLabel: lang.cancelAriaLabel,
        reset: lang.reset,
        resetAriaLabel: lang.resetAriaLabel,
        isJATO: isJato(),
        personalizeMode: this.mode === PerspectiveUtil.MODE_PERSONALIZE &&
          (this.options.perspective.has('perspective_id') ||
            this.options.perspective.has('id'))
      };
    },

    ui: {
      "pmanPanel": ".pman-header .pman-pannel-wrapper",
      'cancelEdit': '.pman-header .pman-cancel-edit',
      'addIcon': '.pman-header .icon-toolbarAdd',
      'helpIcon': '.pman-header .icon-help',
      'saveBtn': '.pman-header .pman-icon-save',
      'trashArea': '.pman-header .pman-trash-area',
      'resetBtn': '.pman-header .pman-icon-reset',
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
      if (enableSideBar) {
        this.context.pmanView = this;
      }
      this.mode = options.mode;
      this._prepareForEdit(options.perspective);
      Marionette.ItemView.prototype.constructor.call(this, options);
      this._registerEventHandler();
      this.helpView = new HelpView(options);
    },

    _registerEventHandler: function () {
      this.listenTo(this, 'change:layout', this._changeLayout);
      this.listenTo(this, 'swap:layout', this._swapLayout);
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
        if (self.context.previewBranding?.get('isBrandingChangeTriggered')) {
          this._showMessage("success", lang.LblBrandingChanges);
        } else {
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
      this.displayError(error);
    },

    displayError: function (error) {
      // API error while saving..
      let errorMessage;
      if (error && error.responseJSON && error.responseJSON.error) {
        errorMessage = error.responseJSON.error;
      } else {
        let errorHtml = base.MessageHelper.toHtml();
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

    _swapLayout: function (newLayoutType) {
      this.perspective.setPerspective({
        type: newLayoutType,
        options: this.perspective.attributes.perspective.options
      }, { silent: true });
      this.context.triggerMethod('swap:layout', this.perspective);
    },

    _changeLayout: function (newLayoutType) {
      this.perspective.setPerspective({
        type: newLayoutType,
        options: { perspectiveMode: this.mode }
      }, { silent: true });
      this._triggerEditMode();
      !enableSideBar && this.togglePannel();
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

      if (isJato() && CommonConfigUtil.enableJatoBranding()) {
        let brandLogoUploadPromises = [];
        const cssFileUri = this.changeInJatoBrandingCSS();
        this.getSupportAssetVolumeID()
        .done(response => {
          const supportAssetVolumeDetails = response.data;
          if (!supportAssetVolumeDetails) return deferred.reject({ statusMsg: 'no support asset volume' });
          
            themes.forEach((theme) => {
              const { fileDetails, brandLogoUri } = this.getJatoThemeBrandingLogo(theme, this.context.previewBranding.attributes);
              brandLogoUploadPromises.push(this.uploadBrandingConfigJato(supportAssetVolumeDetails, fileDetails, brandLogoUri, theme));
            });
            $.whenAll.apply($, brandLogoUploadPromises).done((responses) => {
              let requestObject = this.getRequestObjForJatoBrandSettingsUpdate(responses, themes);
              this.uploadBrandingConfigSettings(requestObject)
                .done((response) => {
                  const { fileDetails, brandLogoUri } = this.getJatoThemeBrandingLogo(theming.getTheme(), this.context.previewBranding.attributes);
                  this.applyNavigationCSSJato(cssFileUri, fileDetails, brandLogoUri);
                  this.unblockActions();
                  deferred.resolve();
                }).fail((error) => deferred.reject(error))
            }).fail(errors => {
              errors = errors.filter(error=> !error.statusMsg);
              deferred.reject(errors.length > 0? errors[0]:'');
            });
        }).fail(error => deferred.reject(error));
      } else {
        const { fileDetails, brandLogoUri } = this.context.previewBranding.attributes;
        const cssFileUri = this.changeInBrandingCSS();
        this.uploadBrandingConfig(fileDetails, brandLogoUri)
          .done(() => {
            this.applyNavigationCSS(cssFileUri, fileDetails, brandLogoUri);
            this.unblockActions();
            deferred.resolve();
          })
          .fail((error) => {
            deferred.reject(error);
          });
      }
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
    applyNavigationCSSJato: function (cssFileUri, fileDetails, brandLogoUri) {
      const imgFileURL = fileDetails ? URL.createObjectURL(fileDetails) : brandLogoUri;
      let brandingConfig = this.context.navigationHeaderView?.brandingConfigData ??
        this.context.navigationHeaderView?.options?.brandingConfig ?? {};
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
    changeInJatoBrandingCSS: function () {
      const changedBrandingData = this.context?.previewBranding?.get('brandingSettingCodes') ?? {};
      // "structuredClone" used for deep clone    
      this.tBrandingSettingCodes = structuredClone(changedBrandingData);
      const brandingConfigCSSUri =  changedBrandingData?.themes? this.createStyleSheetForJatoTheme(changedBrandingData): this.createStyleSheet(changedBrandingData);
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
                .fail((error) => {
                  return deferred.reject(error);
                });
            })
            .fail(error => deferred.reject(error))
        }).fail(error => deferred.reject(error));
      return deferred.promise();
    },
    uploadBrandingConfigJato: function (supportAssetVolumeDetails, imgFile, isBrandLogoUriPresent, theme) {
      // const self = this;
      const deferred = $.Deferred();
      this.uploadBrandingLogoForJato(supportAssetVolumeDetails, imgFile, isBrandLogoUriPresent, theme).done((response) => {
        deferred.resolve(response);
      }).fail(error => deferred.reject(error));
      return deferred.promise();
    },
    uploadBrandingLogoForJato: function (supportAssetVolumeDetails, imgFile, isBrandLogoUriPresent, theme) {
      const deferred = $.Deferred();
      this.fetchBrandingConfigFolderDetailsJato(supportAssetVolumeDetails, imgFile, isBrandLogoUriPresent, theme)
        .done(responseFromBrandingConfig => {
          this.uploadConfigInBrandingFolder(imgFile, responseFromBrandingConfig).done((response) => {
            deferred.resolve(response);
          }).fail((error) => {
            deferred.reject(error);
          });
        });
      return deferred.promise();
    },
    uploadInSupportAssetVolume: function (imgFile, responseFromBrandingConfig) {
      // -- start of upload files---
      const deferred = $.Deferred();
      // upload Image
      this.uploadConfigInBrandingFolder(imgFile, responseFromBrandingConfig)
        .done((response) => {
          // upload the config
          this.uploadBrandingConfigData(response)
          .done(() => {
            return deferred.resolve({ statusMsg: "Image updated" });
          })
          .fail((error) => {
            return deferred.reject(error);
          });
        })
        .fail((error) => {
          return deferred.reject(error);
        });
      return deferred.promise();
      // -- end of upload files---
    },

    uploadBrandingConfigData: function (responseFromBrandingConfig) {
      const { brandingSettingCodes } = structuredClone(this.context?.previewBranding?.toJSON() ?? {});
      const deferred = $.Deferred();
      const updatedPreviewObject = this.context.previewBranding?.get('brandingSettingCodes');
      let brandLogoUri = responseFromBrandingConfig?.id ?? this.context.previewBranding?.get('brandLogoUri_id');
      if (!brandLogoUri) {
        brandLogoUri = null;
      }
      let brandingConfig = this.context.navigationHeaderView?.brandingConfigData ??
      this.context.navigationHeaderView?.options?.brandingConfig ?? {};
      brandingConfig?.set('brandLogoUri_id',brandLogoUri);
      if(brandingSettingCodes.themes){
        themes.forEach((theme)=>{
          let brandSettingTheme = brandingSettingCodes?.themes[theme];
          if(brandingSettingCodes?.themes && brandSettingTheme && updatedPreviewObject?.themes[theme]?.brandLogoUri_id){
            brandSettingTheme.brandLogoUri = updatedPreviewObject?.themes[theme]?.brandLogoUri_id;
            delete brandSettingTheme?.fileDetails;
            delete brandSettingTheme?.brandLogoUri_id;
          }
          if(brandSettingTheme && !brandSettingTheme.brandLogoUri){
              brandSettingTheme.brandLogoUri = null;
          }
          if(brandSettingTheme && brandSettingTheme.customBgColor?.indexOf('rgb') > -1){
            brandSettingTheme.customBgColor = '';
          }
        });
      }
      const data = {
        brandLogoUri,
        brandingSettingCodes
      }
      this.uploadBrandingConfigSettings(data)
        .done((response) => {
          return deferred.resolve(response);
        })
        .fail((error) => {
          return deferred.reject(error);
        });
      return deferred.promise();
    },
    getRequestObjForJatoBrandSettingsUpdate: function (responses, themes) {
      let data;
      let savedBrandSettingCodes = this.tBrandingSettingCodes;
      themes.forEach((theme, i) => {
        let brandLogoUri = responses[i]?.id ?? this.context.previewBranding?.get('brandingSettingCodes')?.themes[theme]?.brandLogoUri_id;
        if (!brandLogoUri) {
          brandLogoUri = null;
        }
        let cfthemeLogoId = this.context?.previewBranding.get('brandLogoUri_id');
        let brandingConfig = this.context.navigationHeaderView?.brandingConfigData ??
        this.context.navigationHeaderView?.options?.brandingConfig ?? {};
        if(!cfthemeLogoId){
          brandingConfig?.set('brandLogoUri', null);
        }
        const { brandingSettingCodes } = structuredClone(this.context?.previewBranding?.toJSON() ?? {});
        data = data ? data : { brandLogoUri: !cfthemeLogoId? null: cfthemeLogoId, brandingSettingCodes };
        if (data.brandingSettingCodes?.themes[theme]) {
          let themeObj = data.brandingSettingCodes.themes[theme];
          let iconColor = data.brandingSettingCodes.themes[theme].isInvertIconColor;
          if(iconColor){
            data.brandingSettingCodes.themes[theme].isInvertIconColor = true;
          }else{
            data.brandingSettingCodes.themes[theme].isInvertIconColor = false;
          }
          themeObj.brandLogoUri = brandLogoUri;
          if(savedBrandSettingCodes?.themes[theme]){
            savedBrandSettingCodes.themes[theme].brandLogoUri_id = brandLogoUri;
          }
          if(themeObj?.customBgColor?.indexOf('rgb') > -1){
            themeObj.customBgColor = '';
          }
          delete themeObj.brandLogoUri_id;
          delete themeObj.fileDetails;
        }
      });
      return data;
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
            this._setFocusOnFirstWidget(event);
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
  applicationHeaderBackgroundColor: 'Header background color',
  linkColor: 'Link color',
  breadcrumbs: 'Breadcrumbs',
  icons: 'Icons',
  primaryText: 'Primary text',
  secondaryText: 'Secondary text',
  versionText: 'Version text',
  lightModeBranding: 'Light mode branding',
  invertIconColors : 'Swap colors',
  text: 'Text',
  darkModeBranding: 'Dark mode branding'
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
                    "title": lang.primaryText,
                    "type": "string"
                },
                "secondaryText": {
                    "title": lang.secondaryText,
                    "type": "string"
                },
                "versionText": {
                    "title": lang.versionText,
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

  return "<div class=\"icon-them-container\" data-smart-theme=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"themeCode") : depth0)) != null ? lookupProperty(stack1,"DEFAULT") : stack1), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"defaultLabel") || (depth0 != null ? lookupProperty(depth0,"defaultLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"defaultLabel","hash":{},"loc":{"start":{"line":1,"column":86},"end":{"line":1,"column":102}}}) : helper)))
    + "\">\n    <div class=\"icon-label-container\">\n        <div class=\"icon_theme_input\">\n            <input type=\"radio\" name=\"theme\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"defaultLabel") || (depth0 != null ? lookupProperty(depth0,"defaultLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"defaultLabel","hash":{},"loc":{"start":{"line":4,"column":52},"end":{"line":4,"column":68}}}) : helper)))
    + "\" value=\"\" tabindex=\"0\" id=\"default\" />\n        </div>\n        <label for=\"default\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"defaultLabel") || (depth0 != null ? lookupProperty(depth0,"defaultLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"defaultLabel","hash":{},"loc":{"start":{"line":6,"column":29},"end":{"line":6,"column":45}}}) : helper)))
    + "</label>\n    </div>\n    <div class=\"icon_theme_preview\"></div>\n</div>\n<div class=\"icon-them-container\" data-smart-theme=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"themeCode") : depth0)) != null ? lookupProperty(stack1,"DARK") : stack1), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"darkLabel") || (depth0 != null ? lookupProperty(depth0,"darkLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"darkLabel","hash":{},"loc":{"start":{"line":10,"column":83},"end":{"line":10,"column":96}}}) : helper)))
    + "\">\n    <div class=\"icon-label-container\">\n        <div class=\"icon_theme_input\">\n            <input type=\"radio\" name=\"theme\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"darkLabel") || (depth0 != null ? lookupProperty(depth0,"darkLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"darkLabel","hash":{},"loc":{"start":{"line":13,"column":52},"end":{"line":13,"column":65}}}) : helper)))
    + "\" value=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"themeCode") : depth0)) != null ? lookupProperty(stack1,"DARK") : stack1), depth0))
    + "\" tabindex=\"0\" id=\"dark\" />\n        </div>\n        <label for=\"dark\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"lightLabel") || (depth0 != null ? lookupProperty(depth0,"lightLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"lightLabel","hash":{},"loc":{"start":{"line":15,"column":26},"end":{"line":15,"column":40}}}) : helper)))
    + "</label>\n    </div>\n    <div class=\"icon_theme_preview\"></div>\n</div>\n<div class=\"icon-them-container\" data-smart-theme=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"themeCode") : depth0)) != null ? lookupProperty(stack1,"LIGHT") : stack1), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"lightLabel") || (depth0 != null ? lookupProperty(depth0,"lightLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"lightLabel","hash":{},"loc":{"start":{"line":19,"column":84},"end":{"line":19,"column":98}}}) : helper)))
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
      event.stopPropagation();
      event.preventDefault();
      if (
        event.type === "click" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        this.setTheme($(event.currentTarget).attr("data-smart-theme"), true);
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
      var active = this.ui.icons.filter("[data-smart-theme='" + theme + "']");
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
    'csui/perspective.manage/mixins/update.supportasset.branding.config.mixin',
    'csui/utils/commonconfig.util',
    'css!csui/perspective.manage/settings.panel/impl/settings.panel',
], function (_, $, Backbone, Marionette, base, allSettings, FormView, ModalAlert, lang, template, settingTemplate, 
    UpdateSupportAssetBrandingConfigMixin, CommonConfigUtil) {

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
                expandTab: lang.expand,
                collapseTab: lang.collapse
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
                    self.options.pmanBrandingView.$el.find('button.pman-cancel-edit').focus();
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
            let defaultStyles = this.DEFAULT_BRAND_SETTINGS;
            // set all the brandingSetting codes to empty
            if(!this?.options?.context?.brandingConfigData?.get("brandingSettingCodes")?.themes){
                defaultStyles = {};
                Object.keys(this.options.context.previewBranding?.get('brandingSettingCodes')).forEach(item=>{defaultStyles[item]=''});
            }

            document.querySelector(".binf-widgets.perspective-editing .cs-perspective-panel")?.removeAttribute('style');
            this.options.context.previewBranding.set('brandLogoUri', '');
            this.options.context.previewBranding.set('brandLogoUri_id', '');
            this.options.context.previewBranding.set('brandingSettingCodes', defaultStyles);
            this.options.context.previewBranding.set('fileDetails', '');
            this.options.context.trigger('change:settings');
            this.options.context?.navigationHeaderView?.brandingConfigData?.set({brandingCSS:''});
            this.removePreviewBrandingStyleSheet();
            this.options.context?.navigationHeaderView?.brandingConfigData?.trigger('change:branding');
            this.trigger('change:settings');
            this.children.map(function (c) {
                return c.resetToDefault();
            });
        }

    })
    
    UpdateSupportAssetBrandingConfigMixin.mixin(HeaderSettingsPanel.prototype);
    return HeaderSettingsPanel;
});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/pman.branding',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return " size=\"regular\" ";
},"3":function(container,depth0,helpers,partials,data) {
    return "  icon=\"csui_action:action_help32\"  ";
},"5":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<otc-icon mirrorIfRtl size=\"20\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"helpIcon") || (depth0 != null ? lookupProperty(depth0,"helpIcon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"helpIcon","hash":{},"loc":{"start":{"line":9,"column":69},"end":{"line":9,"column":81}}}) : helper)))
    + "\" ispresentation></otc-icon>";
},"7":function(container,depth0,helpers,partials,data) {
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
},"9":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <li>\n            <otc-button type=\"secondary\" class=\"pman-icon-reset\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"reset") : depth0), depth0))
    + "\"\n                    arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"resetAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"reset") : depth0), depth0))
    + "</otc-button>\n          </li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"pman-backdrop\"></div>\n<div class=\"pman-header\">\n  <div class=\"pman-header-backdrop\"></div>\n  <div class=\"pman-tools-container\">\n    <div class=\"pman-left-tools\">\n      <ul>\n        <li class=\"pman-toolitem icon-help-container\">\n                <otc-button class=\"icon-help\"  type=\"subtle\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"help") : depth0), depth0))
    + "\" arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"help") : depth0), depth0))
    + "\" "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":8,"column":109},"end":{"line":8,"column":190}}})) != null ? stack1 : "")
    + ">\n                  "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"loc":{"start":{"line":9,"column":18},"end":{"line":9,"column":116}}})) != null ? stack1 : "")
    + "\n                </otc-button>        \n        </li>\n        <li class=\"pman-toolitem toolbarAddContainer\">\n          <button class=\"icon icon-toolbarAdd\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"addWidget") : depth0), depth0))
    + "\"></button>\n        </li>\n      </ul>\n      <div class=\"pman-pannel-wrapper\"></div>\n    </div>\n      <div class=\"pman-center-tools\">\n       \n      <ul class=\"pman-tabs-container\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isHomePage") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"loc":{"start":{"line":21,"column":8},"end":{"line":28,"column":15}}})) != null ? stack1 : "")
    + "      </ul>\n    </div>\n    <div class=\"pman-right-tools\">\n      <ul>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"personalizeMode") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"loc":{"start":{"line":33,"column":8},"end":{"line":38,"column":15}}})) != null ? stack1 : "")
    + "        <li>\n          <otc-button class=\"pman-right-tools-button pman-icon-save\" disabled type=\"primary\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "\" arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"saveAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "</otc-button>\n        </li>\n        <li>\n          <otc-button class=\"pman-right-tools-button pman-cancel-edit\" type=\"secondary\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "\" arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancelAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "</otc-button>\n          </li>\n      </ul>\n    </div>\n  </div>\n  <div class=\"pman-trash-area\">\n    <div class=\"pman-trash-banner\"></div>\n  </div>\n</div>\n<div id=\"breadcrumb-wrap\" class=\"pman-header-config breadcrumb-wrap-visible\">\n  <div class=\"pman-header-preview-panel\">\n    <div class=\"pman-header-container pman-container-header-container\">\n      <div class=\"pman-container-header\"></div>\n      <div class=\"breadcrumb-inner breadcrumb-inner-header pman-container-breadcrumb csui-perspective-breadcrumb\">\n      </div>\n    </div>\n  </div>\n  <div class=\"pman-header-settings-container\">\n  </div>\n</div>\n<div class=\"pman-backdrop\"></div>";
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
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/pman.branding',
  'csui/utils/contexts/factories/branding.config.factory',
  'csui/utils/namedsessionstorage',
  'css!csui/perspective.manage/impl/pman.branding',
  'css!csui/perspective.manage/settings.panel/impl/settings.panel',
], function (module, _, $, Backbone, Marionette, CSUIPManView, StartPageView, CSUINavigationHeaderView, SmartNavigationHeaderView, i18n, SettingsPanelView, BreadcrumbsView, ApplicationScopeModelFactory,
  NextNodeModelFactory, TabablesBehavior, CommonConfig, lang, template, BrandingConfigFactory, NamedSessionStorage) {

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
        brandingHeaderOptions: '.pman-header .pman-tools-container',
        centerToolsTab: '.pman-header .pman-center-tools .pman-tab',
        headerContainer: '.pman-container-header-container .pman-container-header',
        breadcrumbContainer: '.pman-container-header-container .pman-container-breadcrumb',
        settingsContainer: '.pman-header-settings-container'
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
      this.ui.centerTools.find('.pman-tab').first().addClass('binf-active');
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
      this.previewHeader?.trigger('render:header');
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
        this.applyCFPreviewBrandingStyleSheet(updatedValue);
        this.breadcrumbs.options.textColor = updatedValue?.brandingSettingCodes?.breadcrumbColor;
        this.breadcrumbs.render();
      });
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
    _setFocusOnFirstElementHeader: function (event) {
      let focusableEles = this.ui.brandingHeaderOptions[0].querySelectorAll('button:not([disabled]), *[tabindex]');
      focusableEles[0]?.focus();
      event.preventDefault();
    }
  })
  return BrandingPManView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/top.ribbon/top.ribbon.item',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "       <div class=\"csui-jato-top-ribbon-edit-container\">\n            <otc-icon class=\"csui-top-ribbon-edit\" size=\"16\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"editDraftSVG") || (depth0 != null ? lookupProperty(depth0,"editDraftSVG") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"editDraftSVG","hash":{},"loc":{"start":{"line":5,"column":66},"end":{"line":5,"column":82}}}) : helper)))
    + "\" ispresentation></otc-icon>\n        </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "        <span class=\"csui-top-ribbon-edit\"></span>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-perspective-layout\">\n    <div class=\"csui-top-ribbon-layout csui-layout-icon csui-layout-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"layout") || (depth0 != null ? lookupProperty(depth0,"layout") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"layout","hash":{},"loc":{"start":{"line":2,"column":68},"end":{"line":2,"column":78}}}) : helper)))
    + "\" tabindex=\"0\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":3,"column":8},"end":{"line":9,"column":15}}})) != null ? stack1 : "")
    + "    </div>\n    <div class=\"csui-perspective-action\"></div>\n    <div class=\"csui-top-ribbon-name\"></div>\n</div>\n";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_top.ribbon_top.ribbon.item', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/controls/perspective.actions/impl/perspective.action.dropdown.items',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"actionName") || (depth0 != null ? lookupProperty(depth0,"actionName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"actionName","hash":{},"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":14}}}) : helper)));
}});
Handlebars.registerPartial('csui_controls_perspective.actions_impl_perspective.action.dropdown.items', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/controls/perspective.actions/impl/perspective.action',[],function(){});

csui.define('csui/controls/perspective.actions/perspective.action.dropdown.items',[
  "nuc/lib/marionette3",
  "hbs!csui/controls/perspective.actions/impl/perspective.action.dropdown.items",
  'css!csui/controls/perspective.actions/impl/perspective.action',
], function (Marionette, template) {
  "use strict";
  const PerspectiveSettingDropdownItems = Marionette.View.extend({
    template: template,
    tagName: "otc-menuitem",

    constructor: function PerspectiveSettingDropdownItems(options) {
      // check mandatory parameters
      if (!options) {
        throw new Error(
          "options object is mandatory for PerspectiveSettingDropdownItems"
        );
      }

      Marionette.View.prototype.constructor.call(this, options);
    },

    events: {
      'click': 'onChanged',
      'keydown': 'onKeyInActionItem'
    },

    onChanged: function () {
      this.trigger("change:selection", this.options);
    },

    onKeyInActionItem: function (event) {
        switch (event.key) {
          case "Enter": // enter
          this.onChanged();
          break;
          case "ArrowUp": //up arrow
          if (this.$el.prev().length) {
            this.$el.prev()[0].focus();
          }
          break;
          case "ArrowDown": //down arrow
          if (this.$el.next().length) {
            this.$el.next()[0].focus();
          }
          break;
          case "Tab": //tab
          if(event.shiftKey && event.key === 'Tab'){
            this._parent.ui.dropdownToggle.trigger('click');
          }
          break;
          case "Escape":  // escape
          this._parent.ui.dropdownToggle.trigger('click');
          this._parent.ui.dropdownToggle[0].focus();
          break;
        }
      }
  });
  return PerspectiveSettingDropdownItems;
});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/perspective.actions/impl/perspective.action.dropdown',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <otc-icon class=\"csui-topribbon-actions-dropdowns-jatoicon\" size=\"16\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"iconSVG") || (depth0 != null ? lookupProperty(depth0,"iconSVG") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"iconSVG","hash":{},"loc":{"start":{"line":14,"column":77},"end":{"line":14,"column":88}}}) : helper)))
    + "\" type=\"subtle\"></otc-icon>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"states":"true","size":"small","iconName":"csui_action_more16"},"loc":{"start":{"line":16,"column":2},"end":{"line":16,"column":72}}})) != null ? stack1 : "")
    + "\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n<a\n  id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"ButtonId") || (depth0 != null ? lookupProperty(depth0,"ButtonId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"ButtonId","hash":{},"loc":{"start":{"line":3,"column":6},"end":{"line":3,"column":18}}}) : helper)))
    + "\"\n  role=\"button\"\n  href=\"#\"\n  class=\"csui-top-ribbon-actions-dropdown-toggle\"\n  data-binf-toggle=\"dropdown\"\n  title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"perspectiveActionsbarLabel") || (depth0 != null ? lookupProperty(depth0,"perspectiveActionsbarLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"perspectiveActionsbarLabel","hash":{},"loc":{"start":{"line":8,"column":9},"end":{"line":8,"column":39}}}) : helper)))
    + "\"\n  arialabel=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"perspectiveActionsbarLabel") || (depth0 != null ? lookupProperty(depth0,"perspectiveActionsbarLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"perspectiveActionsbarLabel","hash":{},"loc":{"start":{"line":9,"column":13},"end":{"line":9,"column":43}}}) : helper)))
    + "\"\n  aria-expanded=\"false\"\n  aria-controls=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"menuId") || (depth0 != null ? lookupProperty(depth0,"menuId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"menuId","hash":{},"loc":{"start":{"line":11,"column":17},"end":{"line":11,"column":27}}}) : helper)))
    + "\"\n>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":13,"column":0},"end":{"line":17,"column":7}}})) != null ? stack1 : "")
    + "</a>\n<ul\n  id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"menuId") || (depth0 != null ? lookupProperty(depth0,"menuId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"menuId","hash":{},"loc":{"start":{"line":20,"column":6},"end":{"line":20,"column":16}}}) : helper)))
    + "\"\n  class=\"csui-top-ribbon-actions-dropdown-menu csui-normal-scrolling\"\n  role=\"menu\"\n  aria-labelledby=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"ButtonId") || (depth0 != null ? lookupProperty(depth0,"ButtonId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"ButtonId","hash":{},"loc":{"start":{"line":23,"column":19},"end":{"line":23,"column":31}}}) : helper)))
    + "\"\n></ul>";
}});
Handlebars.registerPartial('csui_controls_perspective.actions_impl_perspective.action.dropdown', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/perspective.actions/perspective.action.dropdown',[
  "nuc/lib/underscore",
  'nuc/lib/jquery',
  "nuc/lib/backbone",
  "nuc/lib/marionette",
  "nuc/utils/log",
  'csui/utils/base',
  "i18n!csui/controls/perspective.actions/impl/nls/lang",
  "csui/utils/commands",
  "csui/controls/perspective.actions/perspective.action.dropdown.items",
  "hbs!csui/controls/perspective.actions/impl/perspective.action.dropdown",
  'smart/themes/theming',
  'csui/themes/csui.jato.action.icons'
], function (
  _,
  $,
  Backbone,
  Marionette,
  log,
  base,
  lang,
  commands,
  PerspectiveSettingDropdownItems,
  template,
  theming,
  jatoActionIcons
) {
  "use strict";

  const PerspectiveSettingDropdown = Marionette.CompositeView.extend({
    className: "csui-perspective-actions-dropdown-view",
    template: template,
    childViewContainer: "ul.csui-top-ribbon-actions-dropdown-menu",

    constructor: function PerspectiveSettingDropdown(options) {
      // check mandatory parameters
      if (!options) {
        throw new Error(
          "options object is mandatory for PerspectiveSettingDropdown"
        );
      }
      if (!options.view.options.originatingView) {
        throw new Error(
          "options.originatingView is mandatory for PerspectiveSettingDropdown"
        );
      }
      this.dropdownItems = options.view.options.originatingView.options?.dropdownItems;
      Marionette.CompositeView.prototype.constructor.call(this, options);
      this.useIconsForDarkBackground = options.useIconsForDarkBackground;
      this._setViewCollection(this.dropdownItems);
    },

    templateHelpers: function () {
      return {
        perspectiveActionsbarLabel: lang.PerspectiveActionsbarLabel,
        ButtonId: 'csui-top-ribbon-actions-toggle'+_.uniqueId(),
        menuId: 'csui-top-ribbon-actions-menu'+_.uniqueId(),
        isJATO: theming.isJATOTheme(),
        iconSVG: jatoActionIcons.actionMoreHorizontal
      };
    },

    getChildView: function () {
      return PerspectiveSettingDropdownItems;
    },

    childViewOptions: function () {
      return this.options;
    },

    ui: {
      dropdownToggle: '.csui-top-ribbon-actions-dropdown-toggle',
    },

    events: {
      'shown.binf.dropdown': 'onKeyInActionsDropdown',
      'keydown @ui.dropdownToggle': 'onKeyInActionsDropdown',
    },
    
    childEvents: {
      "change:selection": "performOptionChange", // triggered by otc-menuradio when changing the selection
      "selected:menuitem": "performOptionSelected",
    },

    initialize: function(){
      this.listenTo(this, 'finish:serialize:welcomepage', this.onFinishSerializeWelcomePage);
    },

    performOptionChange: async function (itemView, eventData) {
      this.closeMenu();
      this.eventData = eventData;
      const selectionView = eventData.view;
      await this.executeCommandForEvent(selectionView, eventData);
      this._setViewCollection(this.dropdownItems);
    },

    performOptionSelected: async function (itemView, eventData) {
      this.closeMenu();
      await this.executeCommandForEvent(itemView, eventData);
    },

    closeMenu: function () {
      if (this.isRendered) {
        if (this.ui.dropdownToggle.parent().hasClass('binf-open')) {
          this.ui.dropdownToggle.binf_dropdown('toggle');
        }
        this.ui.dropdownToggle.attr('aria-expanded', 'false');
      }
    },

    alignActionDropDown: function (){
      base.alignDropDownMenu({targetEl: $(this.ui.dropdownToggle), dropdownMenu: this.$childViewContainer, width: $(window).width() - 105});
    },

    onFinishSerializeWelcomePage: async function() {
      if(this.eventData.model.get('rerenderAfterSerialization')){
        this.eventData.view.model?.trigger("finish:serialize:welcomepage");
      }
      await this.executeCommand(null, this.eventData);
    },

    executeCommandForEvent: async function (itemView, eventData) {
      if (eventData.model.get('serialize')) {
        const context = eventData.view.options.originatingView.context;
        context.triggerMethod("serialize:welcomepage", eventData.view.options.originatingView.perspective, eventData.model.get('actionName'), this, true);
      } else {
        await this.executeCommand(itemView, eventData)
      }
    },

    executeCommand: async function (itemView, eventData) {
      const signature = eventData.model.get("signature");
      const command = commands.get(signature);
      const status = this.status;
      const options = { eventData };
      try {
        if (typeof command.beforeExecute === 'function') {
          await command.beforeExecute(status, options);
        }
        if (typeof command.execute === 'function') {
          await command.execute(status, options);
        }else {
          throw new Error('Command "' + signature + '" not found.');
        }
      } catch (error) {
        log.warn(
          'Executing the command "{0}" failed.\n{1}',
          command.get("signature"),
          error?.stack
        ) && console.warn(log.last);
      } finally {
        if (typeof command.afterExecute === 'function') {
          await command.afterExecute(status, options);
        }
      }
    },

    _setViewCollection: function (dropdownItems) {
      if (!Array.isArray(dropdownItems) || dropdownItems.length === 0) return;
      const tDropdownItems = dropdownItems.filter((el) => {
        return commands.get(el.signature).enabled(this)
      })
      this.collection = new Backbone.Collection(tDropdownItems);
    },

    onKeyInActionsDropdown: function (event) {
      const originatingView = this.options?.view?.options?.originatingView;
      const dropdownStyles = this.$childViewContainer[0].style;
      // Get the more action dropdown direction
      const direction = Array.from(dropdownStyles).find(prop => ['left', 'right'].includes(prop));

      event.data = { direction };

      if (!originatingView?.isTopRibbonCarouselDisabled) {
        originatingView.trigger("toggle:carousel", event);
      }

      let focusableEle = this.$childViewContainer[0].querySelectorAll('otc-menuitem')[0];
      let nextbutton;
      let currentFocusedElement = this.options.view.model.collection.indexOf(this.options.view.model);
      if(!$(event.target).attr('aria-expanded')){
        focusableEle.focus();
      }
      switch (event.key) {
        case "ArrowLeft": // Left Arrow
        if (currentFocusedElement > 0) {
            this.setFocustoLayout('ArrowLeft', event);
        }
        event.preventDefault();
        break;
        case "ArrowRight": // Right Arrow 
        if (currentFocusedElement < this.options.view.model.collection.length - 1) {
          this.setFocustoLayout('ArrowRight', event);
        } else {
            nextbutton = this.options.view.options.originatingView.ui.nextButton[0];
            if(!nextbutton.disabled) {
                nextbutton.focus();
              }else {
                this.options.view.options.originatingView.ui.addPageBtn[0]?.focus();
              }
        }
        break;
        case "Tab": //TAB
          if (event.shiftKey && event.key === 'Tab' && $(event.target).is(this.ui.dropdownToggle)) { 
            this.options.view.el.querySelectorAll('.csui-top-ribbon-layout')[0].focus();
          }
          event.preventDefault();
        break;
        case "Escape":  // escape
        this.$el.parents('.csui-perspective-layout')[0].querySelector('.csui-top-ribbon-layout').focus();
        break;           
      }
    },
    setFocustoLayout: function (direction, event) {
      this.options.view.options.originatingView.trigger("toggle:carousel", event);
      if(direction === 'ArrowLeft'){
        this.$el.parents('.csui-top-ribbon-item').prev().find('.csui-top-ribbon-layout').focus();
      } else if(direction === 'ArrowRight'){
        this.$el.parents('.csui-top-ribbon-item').next().find('.csui-top-ribbon-layout').focus();
      }
      event.preventDefault();
  }
  });
  return PerspectiveSettingDropdown;
});


csui.define('csui/perspective.manage/mixins/top.ribbon.item.mixin',[
  "csui/lib/backbone",
  "csui/controls/form/form.view",
  "smart/controls/globalmessage/globalmessage",
  "i18n!csui/perspective.manage/impl/nls/lang"
], function (Backbone, FormView, GlobalMessage, lang) {
  "use strict";

  let TopRibbonItemMixin = {
    mixin: function (prototype) {
      return Object.assign(prototype, {
        buildPerspectiveNameFormField: function () {
          let self = this;
          const title = this.model.get("title");
          const formModel = new Backbone.Model({
            data: {
              perspectiveName: title,
            },
            options: {
              fields: {
                perspectiveName: {
                  type: "text",
                  events: {
                    "change": this.renamePerspective.bind(self),
                    "focusout": this.onFocusOutWrite.bind(self),
                  }
                },
              },
            },
            schema: {
              type: "object",
              properties: {
                perspectiveName: {
                  readonly: true,
                  type: "string"
                },
              },
            },
          });
          
          //TODO: As the requirement is just to display a text field for the user to input value and we are not submitting any formdata to the server, we may not require FormView.
          // We need to revisit this approach and we may need to implement using NameView.
          return new FormView({
            mode: "update",
            model: formModel,
            context: this.options.context,
          });
        },

        renamePerspective: function (event) {
          const view = event.target;
          let pName = view.value?.trim();
          if (pName === "") {
            view.value = view.defaultValue;
          }else{
            if(this.options.parentView.getPerspectiveByTitle(pName)){
              let errorMsg = lang.perspectiveNameExists.replace("{0}", pName);
              GlobalMessage.showMessage("error", errorMsg);
              view.value = view.defaultValue;
            }else{
              this.model.set('title', pName);
              delete this.options.originatingView.departmentMap[view.defaultValue];
              this.updateDepartmentMap();
            }
          }
        },
        
        markPerspectiveAsModified: async function (model) {
          if (this.model.has('hasOnlybasicPerspectiveInfo')) {
            if(this.model.get('hasOnlybasicPerspectiveInfo')){
              const changedAttributes = model.changedAttributes();
              const perspectiveInfo = await this.fetchPerspective(this.isPersonalizeMode);
              const pModel = new Backbone.Model(perspectiveInfo);
              this.updatePerspectiveModel(pModel);
              //TODO: this is a temporary workaround to handle renaming by clicking alpaca field directly, instead of rename perspective action
              Object.keys(changedAttributes).forEach(key=>this.model.set(key,changedAttributes[key]));
            }
            this.model.unset("hasOnlybasicPerspectiveInfo", { silent: true });
            this.el.classList.add("csui-edited-perspective");
            this.options.originatingView.toggleAddNewPageBtn(++this.model.collection.modifiedCount);
          }
          this.el.classList.remove('csui-server-error-perspective');
          this.options.originatingView.trigger("toggle:save");
        },

        unmarkPerspectiveAsModified: function(){
          if(this.el.classList.contains("csui-edited-perspective")){
            this.el.classList.remove("csui-edited-perspective");
            this.options.originatingView.toggleAddNewPageBtn(--this.model.collection.modifiedCount);
            this.options.originatingView.trigger("toggle:save");
          }
        },

        onFocusOutWrite: function (event) {
          this.setPerspectiveNameFormFieldReadOnly(true);
          this.el.querySelector('.csui-top-ribbon-layout').focus();
        },
        
        setPerspectiveNameFormFieldReadOnly(readonly){
          if(this.perspectiveNameForm?.alpaca?.schema?.properties?.perspectiveName){
            this.perspectiveNameForm.alpaca.schema.properties.perspectiveName.readonly = readonly
          }
        }
      });
    }
  };
  return TopRibbonItemMixin;
});

csui.define('csui/perspective.manage/impl/top.ribbon/top.ribbon.item.view',["csui/lib/backbone", 'csui/lib/marionette3',
    'csui/models/perspective/perspective.template.model',
    'csui/utils/contexts/factories/connector',
    'csui/models/perspective/personalization.model',
    'csui/utils/perspective/perspective.util',
    'hbs!csui/perspective.manage/impl/top.ribbon/top.ribbon.item',
    'csui/controls/perspective.actions/perspective.action.dropdown',
    'csui/perspective.manage/mixins/top.ribbon.item.mixin',
    'smart/themes/theming',
    'csui/themes/csui.jato.action.icons'
], function (Backbone, Marionette, PerspectiveTemplateModel, ConnectorFactory, PersonalizationModel, PerspectiveUtil, TopRibbonTemplate, PerspectiveSettingDropdown, TopRibbonItemMixin, theming, jatoActionIcons) {
    'use strict';
    let TopRibbonItemView = Marionette.View.extend({
        className: function(){
            let classNames =  "csui-top-ribbon-item";
            if(this.model.isNew()){
                classNames += " csui-edited-perspective";
            }
            return classNames;
        },
        template: TopRibbonTemplate,
        tagName: 'li',
        regions: {
            perspectiveAction: ".csui-perspective-action",
            csuiPerspectiveName: ".csui-top-ribbon-name",
        },
        templateContext: function () {
            return {
                name: this.model.getTitle(),
                layout: this.model.getType(),
                isJATO: theming.isJATOTheme(),
                editDraftSVG: jatoActionIcons.actionEditLayout
            }
        },
        ui:{
            csuiTopRibbonLayout: '.csui-top-ribbon-layout',
            csuiPerspectiveLayout: '.csui-perspective-layout'
        },

        events: {
            'click @ui.csuiTopRibbonLayout': 'serializePerspective',
            'mouseenter @ui.csuiPerspectiveLayout': 'onHoverEnter',
            'mouseleave @ui.csuiPerspectiveLayout': 'onHoverLeave',
            'keydown @ui.csuiTopRibbonLayout': 'onkeydownLayout'
        },

        constructor: function TopRibbonItemView(options = {}) {
            this.options = options;
            Marionette.View.prototype.constructor.call(this, options);
            this.isPersonalizeMode = this.options.originatingView.mode === PerspectiveUtil.MODE_PERSONALIZE;
            this.perspectiveActionView = new PerspectiveSettingDropdown({view : this});
        },

        initialize: function(){
            this.model.on({
                "finish:serialize:welcomepage": this.onFinishSerializeWelcomePage.bind(this),
                "change:title": this.markPerspectiveAsModified.bind(this),
                "change:rules": this.markPerspectiveAsModified.bind(this),
                "change:departmentId": this.markPerspectiveAsModified.bind(this),
            });
            this.listenTo(this.model, 'change:default', this.render);
            this.listenTo(this.model, 'change:enabled', this.render);
            this.listenTo(this.model, "perspective:modified", this.markPerspectiveAsModified.bind(this));
        },

        onRender: async function(){
            this.model.get('default') ? this.el.classList.add("csui-default-perspective") : this.el.classList.remove("csui-default-perspective");
            this.updateDepartmentMap();
            if(this.isActiveChild(this.isPersonalizeMode)){
                let pModel = this.options.originatingView?.perspective;
                if(!(pModel?.get("id")) && (!!this.model.getPerspectiveId())){
                    pModel = new Backbone.Model(await this.fetchPerspective(this.isPersonalizeMode));
                }
                if (this.isPersonalizeMode) 
                    await this.updatePersonalizeModel(pModel);
                else
                    this.updatePerspectiveModel(pModel);
                this.trigger("perspective:rendered", this);
            }
            if(!this.perspectiveActionView || this.perspectiveActionView.isDestroyed){
                this.perspectiveActionView = new PerspectiveSettingDropdown({view : this});
            }
            this.showChildView("perspectiveAction", this.perspectiveActionView);

            this.perspectiveNameForm = this.buildPerspectiveNameFormField();
            this.showChildView("csuiPerspectiveName", this.perspectiveNameForm);
           
            if(this.model.has('enabled') && !this.model.get('enabled')) {
                this.ui.csuiTopRibbonLayout.addClass('csui-perspective-disabled');
            }
        },

        onFinishSerializeWelcomePage: function(){
            this.updatePerspective();
        },

        serializePerspective: async function () {
            if(this.el.classList.contains("binf-active")) return;
            const context = this.options.originatingView.context;
            context.triggerMethod("serialize:welcomepage", this.options.originatingView.perspective, null, this.model, true);
        },

        updatePerspective: async function () {
            if (this.model.get('hasOnlybasicPerspectiveInfo')) {
                const perspectiveInfo = await this.fetchPerspective(this.isPersonalizeMode);
                const pModel = new Backbone.Model(perspectiveInfo); // TODO: model is required only for personalize usecase. response needs to be stored in a model conditionally
                if (this.isPersonalizeMode) {
                    await this.updatePersonalizeModel(pModel);
                }
                else {
                    this.updatePerspectiveModel(pModel);
                }
            }
            if (this.model.has("perspective") || this.isPersonalizeMode)
                this.loadPerspective();
        },

        updatePerspectiveModel: function(pModel){
            this.model.set(pModel.toJSON(), {silent: true});
            if (this.model.has("hasOnlybasicPerspectiveInfo")) {
                this.model.set("hasOnlybasicPerspectiveInfo", false, { silent: true });
            }
        },

        updatePersonalizeModel: async function (pModel) {
            let filteredPerspective = {};
            let perspective = pModel.get('perspective');
            perspective.id = this.model.getPerspectiveId();
            pModel.set('perspective', perspective);
            filteredPerspective.perspective_id = this.model.getPerspectiveId();
            Object.keys(perspective).map(function (key) {
                if (['type', 'options'].includes(key)) filteredPerspective[key] = perspective[key];
            });
            this.model.options.perspective = filteredPerspective;
            this.model.setPerspective(filteredPerspective);
            let peronalize = await PersonalizationModel.loadPersonalization(pModel);
            if(!!peronalize)
                this.model.setPerspective(peronalize);
            this.model.set("hasOnlybasicPerspectiveInfo", false, { silent: true });
        },

        isActiveChild: function(){
            if(this.isPersonalizeMode){
                return (this.model.getPerspectiveId() && this.model.getPerspectiveId() === this.options.originatingView?.perspective?.getPerspectiveId())
            }else{
                return (this.model.get("title") === this.options.originatingView?.perspective?.get("title"))
            }
        },


        loadPerspective: function () {
            const context = this.options.originatingView.context;
            let perspectiveConfig = this.model.getPerspective();
            perspectiveConfig.options.perspectiveMode = this.options.originatingView.mode
            let perspectiveModel = new Backbone.Model(perspectiveConfig);
            perspectiveModel && context.triggerMethod('enter:edit:perspective', perspectiveModel);
            this.listenToOnce(context, 'finish:enter:edit:perspective', function () {
                this.trigger("perspective:rendered", this);
            });
        },

        fetchPerspective: async function (getPersonalizeInfo = false) {
            const perspectiveTemplate = new PerspectiveTemplateModel(
                { id: this.model.getPerspectiveId(), personalize: getPersonalizeInfo },
                { connector: this.options.originatingView.context.getObject(ConnectorFactory) });
            const model = await perspectiveTemplate.fetch();
            if(model?.perspectives.length){
                let perspective = model.perspectives[0];
                if(this.isPersonalizeMode){
                    perspective.perspective.id = perspective.av_id;
                 }
                return model.perspectives[0];
            }
        },

        onHoverEnter: function () {
            this.perspectiveActionView.alignActionDropDown();
        },

        onHoverLeave: function () {
            this.perspectiveActionView.closeMenu();
        },

        onClickPerspectiveName: function(options) {
            this.setPerspectiveNameFormFieldReadOnly(false);
            this.perspectiveNameForm?.el.querySelector(".cs-field-read")?.click();
        },

        updateDepartmentMap: function(){
            const departmentId = this.model.get("departmentId");
            departmentId?.length && (this.options.originatingView.departmentMap[this.model.get("title")]=departmentId);
        },

        onkeydownLayout: function(event) {
            let toolButtons;
            switch (event.key) {  
                case "Enter": // enter
                this.serializePerspective();
                break;      
                case "ArrowLeft": // Left Arrow
                break;
                case "ArrowRight": // Right Arrow 
                event.preventDefault();
                this.perspectiveActionView.ui.dropdownToggle[0]?.focus();
                break;        
                case "Tab": //TAB
                if (event.shiftKey && event.key === 'Tab') {
                    toolButtons = document.querySelectorAll('.pman-right-tools button');
                    toolButtons[toolButtons.length - 1].focus();
                } else {                    
                    if(this.isPersonalizeMode) {
                        this.options.originatingView._setFocusOnFirstWidget(event);
                    } else {
                        document.querySelectorAll('.csui-pman-sidebar-ribbon otc-button')[0]?.focus();
                    }                    
                    event.preventDefault(); 
                  }
              }
        }
    });
    TopRibbonItemMixin.mixin(TopRibbonItemView.prototype)
    return TopRibbonItemView;
});


csui.define('css!csui/perspective.manage/impl/top.ribbon/top.ribbon',[],function(){});

csui.define('csui/perspective.manage/impl/top.ribbon/top.ribbon.view',['csui/lib/marionette3',
    'csui/models/perspective/perspective.model',
    'csui/perspective.manage/impl/top.ribbon/top.ribbon.item.view',
    'csui/controls/globalmessage/globalmessage',
    'csui/utils/perspective/perspective.util',
    'i18n!csui/perspective.manage/impl/nls/lang',
    'css!csui/perspective.manage/impl/top.ribbon/top.ribbon',
], function (Marionette, PerspectiveModel, TopRibbonItemView, GlobalMessage, PerspectiveUtil, lang) {
    'use strict';
    const DEFAULT_PERSPECTIVE_LAYOUT = "sidepanel-right";
    let TopRibbonView = Marionette.CollectionView.extend({
        className: 'csui-top-ribbon',
        tagName: 'ul',
        childView: TopRibbonItemView,

        childViewOptions: function () {
            return {
                originatingView: this.options.parentView,
                parentView: this
            };
        },

        childViewTriggers: {
            "perspective:rendered": "child:perspective:rendered"
        },

        onChildPerspectiveRendered(child) {
            this.options.parentView.perspective = child.model;
            this.setActive(child);
            this.options.parentView.trigger("perspective:rendered");
            if(child.model.isNew()) {
                child.onClickPerspectiveName();
            }
        },

        constructor: function TopRibbonView(options = {}) {
            this.options = options;
            this.collection = this.options.parentView?.options?.collection;
            this.isPersonalizeMode = this.options.parentView.options.mode === PerspectiveUtil.MODE_PERSONALIZE;
            Marionette.CollectionView.prototype.constructor.call(this, options);
            this.onCollectionSync();
            this.listenTo(this, 'add:new:perspective', this.addNewPerspective);
            this.collection.on({
                "add": this.onAddToCollection.bind(this),
                "remove": this.onRemoveFromCollection.bind(this),
                "sync": this.onCollectionSync.bind(this)
            });
        },

        onShow: function () {
            if(this.isPersonalizeMode)
                return;
            try{
                this.addPerspectiveIfNotExists();
            }catch(err){
                GlobalMessage.showMessage('error', lang.errLoadingPerspectives);
            }
        },

        onCollectionSync: function(){
            this.collection.modifiedCount = 0;
            this.options.parentView.toggleAddNewPageBtn(0);
        },

        onAddToCollection: function(){
            this.options.parentView.toggleAddNewPageBtn(++this.collection.modifiedCount);
        },

        onRemoveFromCollection: function(model){
            if(!model.has("hasOnlybasicPerspectiveInfo"))
                this.options.parentView.toggleAddNewPageBtn(--this.collection.modifiedCount);
        },

        setActive: function (childView) {
            this.clearActive();
            childView.el.classList.add("binf-active");
            if (!this.options.parentView.isTopRibbonCarouselDisabled) {
                this.options.parentView.trigger("toggle:carousel");
            }
        },

        clearActive: function () {
            this.el.querySelectorAll(".csui-top-ribbon-item").forEach(ele => ele.classList.remove("binf-active"));
        },

        addNewPerspective: function(perspective, title){
            let pModel = this.createNewPerspectiveModel(perspective, title);
            this.addPerspective(pModel);
        },

        createNewPerspectiveModel: function(perspective, title){
            return new PerspectiveModel(this.preparePerspectiveConfig(perspective ?? { type: DEFAULT_PERSPECTIVE_LAYOUT, options: {} }, title));
        },

        addPerspectiveIfNotExists: function(){
            let currentPerspective = this.options.parentView.perspective;
            if(!this.getPerspectiveByTitle(currentPerspective.get("title"))){
                currentPerspective.set("title",this.getNextPerspectiveName())
                this.addPerspective(currentPerspective, true);
            }
        },

        addPerspective: function(pModel, existing=false){
            this.collection.add(pModel);
            const cView = this.children.last();
            const items = this.el.querySelectorAll(".csui-top-ribbon-item");
            existing ? cView.loadPerspective() : cView.updatePerspective();
            this.options.parentView.trigger("enable:carousel", items);
        },

        navigateToErrorPerspective: function(errorPerspective) {
            const cView = this.children.find(view => view.model?.get('title') == errorPerspective);
            cView?.loadPerspective();
        },

        preparePerspectiveConfig: function(pAttrs, title){
            let perspectiveConfig = {
                cascading: 'false',
                overrideType: "landingpage",
                scope: "global",
                node: null,
                nodepath: "",
                title: title ?? this.getNextPerspectiveName(),
                perspective: pAttrs
            }
            delete perspectiveConfig.perspective.canEditPerspective;
            return perspectiveConfig;
        },

        getNextPerspectiveName: function(title="Home page 1", isDuplicate){
            while (this.getPerspectiveByTitle(title)) {
                title = this.incPageNumber(title, isDuplicate)
            }
            return title;
        },

        getPerspectiveByTitle: function(title){
            return this.collection?.find(model => model.get("title") === title);
        },

        incPageNumber: function(pageName, isDuplicate){
            let title;
            try {
                title = isDuplicate ? this.incForDuplicatePage(pageName) : this.incForAddPage(pageName);
            } catch (err) {
                title = pageName + ' ' + new Date().getTime();
            }
            return title;
        },
        
        incForAddPage: function(pageName) {
            return pageName.replace(/(\d+)/, (match, num) => parseInt(num) + 1);
        },

        incForDuplicatePage: function(pageName) {
            return pageName.replace(/_(\d+)$/, (match, num) => "_" + (parseInt(num) + 1));
        } 
    });
    return TopRibbonView;
});

csui.define('csui/perspective.manage/mixins/landing.page.pman.mixin',[
  'nuc/utils/url',
  'nuc/lib/backbone',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/perspective.manage/impl/landing.page.pman.constants',
  'csui/utils/perspective/perspective.util',
  'csui/models/perspective/personalization.model',
  'i18n!csui/perspective.manage/impl/nls/lang'
], function (URL, Backbone, ModalAlert, PmanConstants, PerspectiveUtil, PersonalizationModel, lang) {
  "use strict";

  let LandingPagePmanMixin = {
    mixin: function (prototype) {
      return Object.assign(prototype, {

        onFinishSerializeWelcomePage: async function (currentPModel, action, nextPModel) {
          switch (action) {
            case "save":
              this.saveAllPerspectives();
              break;
            case "close":
              this.closeAllPerspectives(currentPModel);
              break;
            case "add":
              this.addNewPerspective(nextPModel);
              break;
            default:
              if (this.shouldShowSavePrompt(currentPModel, action, nextPModel)) {
                await this.promptToSaveModifiedPerspectives(currentPModel);
                return false;
              }
              nextPModel?.trigger("finish:serialize:welcomepage");
          }
        },

        saveAllPerspectives: function (modifiedPerspectives = this.getAllModifiedPerspectives(), exitAfterSave = false) {
          if (modifiedPerspectives.length === 0) return;
          let url = this.connector.getConnectionUrl().getApiBase('v2');
          let ajaxOptions = {
            url: URL.combine(url, `${this.options.requestUrl}`),
            type: 'POST',
            data: `${this.options.body}=${encodeURIComponent(JSON.stringify(modifiedPerspectives))}`
          };

          this.connector.makeAjaxCall(ajaxOptions)
            .then(this._onSaveSuccess.bind(this, exitAfterSave), this._onSaveError.bind(this));
        },

        closeAllPerspectives: async function (currentPModel, modifiedPerspectives = this.getAllModifiedPerspectives()) {
          if (modifiedPerspectives.length === 0) {
            this._doExitPerspective();
            return;
          }
          try {
            await ModalAlert.confirmQuestion(lang.closeConfirmation, lang.close, {
              buttons: {
                showYes: true,
                labelYes: lang.save,
                showNo: true,
                labelNo: lang.close,
                showCancel: true,
                labelCancel: lang.cancel,
                disableYes: this.ui.saveBtn[0].disabled
              },
            });
            this.saveAllPerspectives(modifiedPerspectives, true);
          }
          catch (result) {
            if (result === false) {
              this._doExitPerspective();
            } else {
              currentPModel?.trigger("finish:serialize:welcomepage");
            }
          }
        },

        getAllModifiedPerspectives: function () {
          let modifiedPerspectives = [];
          this.topRibbonView.collection.map((pModel) => pModel.has("hasOnlybasicPerspectiveInfo") || modifiedPerspectives.push(pModel.toJSON()));
          return modifiedPerspectives;
        },

        promptToSaveModifiedPerspectives: async function(pModel){
            await ModalAlert.confirmQuestion(lang.promptToSaveMsg.replace("{0}",pModel.collection.modifiedCount), lang.promptToSaveTitle, {
              buttons: {
                showYes: true,
                labelYes: lang.saveAll,
                showNo: false,
                showCancel: true,
                disableYes: this.ui.saveBtn[0].disabled
              },
            });
            this.saveAllPerspectives();
        },
  
        addNewPerspective: function(pModel){
          this.topRibbonView.addPerspective(pModel);
        },
        
        shouldShowSavePrompt: function(currentPModel, action, nextPModel){
          return (
            currentPModel.collection.modifiedCount >= PmanConstants.MAX_THRESHOLD 
            && !action
            && nextPModel.has("hasOnlybasicPerspectiveInfo")
          )
        },

        toggleAddNewPageBtn: function(modifiedCount){
          let addPageBtn = this.el.querySelector(".csui-top-ribbon-actions .csui-add-new-page");
          if(addPageBtn){
            addPageBtn.disabled = modifiedCount >= PmanConstants.MAX_THRESHOLD ;
          }
        },

        _onSaveSuccess: async function (exitAfterSave) {
          this._showMessage("success", lang.personalizationSaveSuccess);
          try {
            if (this.mode === PerspectiveUtil.MODE_PERSONALIZE) {
              let activePModel = this.topRibbonView.collection.findWhere({
                perspective_id: this.context.perspective.get('id')
              });
              this.context.perspective.set(activePModel.getPerspective());
            }
          }
          catch (err) {
            console.error(err);
          }
          exitAfterSave ? this._doExitPerspective() : this.topRibbonView.collection.fetch({ reset: true });
          this.el.querySelector(".pman-icon-save").setAttribute("disabled", true);
          this.context.trigger("perspective:save:success");
        },

        _onSaveError: function (error) {
          const errorMessages = error.responseJSON?.errorDetail && JSON.parse(error.responseJSON.errorDetail);
          if (errorMessages) {
            let errorMessageMap = {};
            errorMessages.forEach((errorMessage) => {
              const message = JSON.stringify(errorMessage).slice(1, -1);
              const title = message.split(':')[0].slice(1, -1);
              errorMessageMap[title] = message;
            });
            const perspectiveArray = this.topRibbonView.children.toArray();
            for(let i = perspectiveArray.length-1; i >= 0; i--){
              const child = perspectiveArray[i];
              let message = errorMessageMap[child.model.getTitle()];
              if (message) {
                //formatting error
                message = message.split(":");
                child.el.classList.add("csui-server-error-perspective");
                this._showMessage("error", `${message[0]}: ${message[1]}`);
              }
            };
            this.toggleSave();
            if(errorMessages) this.topRibbonView.navigateToErrorPerspective(Object.keys(errorMessages[0])[0]); // fetching the title of the first perspective with an error
          }
          else {
            this.displayError(error);
          }  
        },

        loadDefaultPerspective: async function () {
          let perspectiveChanges = await this.getDefaultPerspective();
          let pModel = new Backbone.Model();
          pModel.set("perspective", perspectiveChanges);
          let peronalize = await PersonalizationModel.loadPersonalization(pModel);
          this.context.perspective.clear();
          this.context.perspective.set(peronalize ?? perspectiveChanges);
        },
        
        getDefaultPerspective: async function () {
          let url = this.connector.getConnectionUrl().getApiBase('v2');
          let ajaxOptions = {
            url: URL.combine(url, "/perspectives/defaultperspective"),
            type: 'GET',
          };
          let resp = await this.connector.makeAjaxCall(ajaxOptions);
          return resp.results;
        }
      });
    }
  };
  return LandingPagePmanMixin;
});

csui.define('csui/perspective.manage/mixins/landing.page.pman.carousel.mixin',[
  'i18n',
], function (i18n) {
  "use strict";

  let LandingPagePmanMixin = {
    mixin: function (prototype) {
      return Object.assign(prototype, {
        slide: function (event) {
          let isRtl          = i18n && i18n.settings.rtl;
          const direction = this.getSlideDirection(event);
          const topRibbonWidth = this.topRibbonRegion.el.clientWidth;
          const track = this.topRibbonView.el;
          const items = track.querySelectorAll(".csui-top-ribbon-item");
		  const moreActionItems = track.querySelectorAll(".csui-perspective-actions-dropdown-view");
          const itemWidth = items[0].clientWidth;
          const slidesPerPage = 1;
          const visibleSlides = Math.round((topRibbonWidth / itemWidth)* 100) / 100;
          let activeSlide;
          let moreOptionDropdownPosition;
          if (event === undefined) {
            activeSlide = this.onClickPerspective(items);
          } else if (event.type === "shown") {
            moreOptionDropdownPosition = this.onClickMoreActions(event, moreActionItems, visibleSlides);
          }
          this.currentSlide = activeSlide ? activeSlide : this.currentSlide ? this.currentSlide : 0;
          
          const newSlide = this.currentSlide + (direction === "left" ? -slidesPerPage : slidesPerPage);
          const lastSlide = newSlide + visibleSlides;
    
          // Handle reaching the beginning or end
          if (newSlide <= 0) {
            this.currentSlide = 0;
            this.slideControlsdisabled("prev");
          } else if (lastSlide >= items.length) {
            this.currentSlide = items.length - visibleSlides;
            this.slideControlsdisabled("next");
          } else {
            this.slideControlsdisabled();
            this.currentSlide = newSlide;
          }
          this.currentSlide = this.isTopRibbonCarouselDisabled ? 0 : this.currentSlide;
          moreOptionDropdownPosition = Math.min(moreOptionDropdownPosition, this.currentSlide);
          if(isRtl){
            if(event?.type === "shown"){
              track.style.transform = `translateX(${moreOptionDropdownPosition * itemWidth}px)`;
            }else {
              track.style.transform = `translateX(${this.currentSlide * itemWidth}px)`;
            }            
          }else {
            if(event?.type === "shown"){
              track.style.transform = `translateX(-${moreOptionDropdownPosition * itemWidth}px)`;
            }else {
              track.style.transform = `translateX(-${this.currentSlide * itemWidth}px)`;
            }            
          }
        },

        getSlideDirection: function (event) {
          let direction;
          if(event === undefined) {
            direction = "left";
          } else if(event.type === "click") {
            direction = event.currentTarget?.id;
          } else if(event.type === "shown") {
            direction = event.data?.direction;
          } else if (event.type === "keydown") {
            if (event.key === 'ArrowLeft') {
              direction = "left";
            } else if (event.key === 'ArrowRight') {
              direction = "right";
            } else if (event.key === 'Tab'){
              direction = "left";
            }
          }
          return direction;
        },

        slideControlsdisabled: function (button) {
          if (this.isTopRibbonCarouselDisabled) {
            this.ui.nextButton[0].disabled = true;
            this.ui.prevButton[0].disabled = true;
          } else if (button === "prev") {
            this.ui.prevButton[0].disabled = true;
            this.ui.nextButton[0].disabled = false;
          } else if(button === "next") {
            this.ui.nextButton[0].disabled = true;
            this.ui.prevButton[0].disabled = false;
          } else {
            this.ui.nextButton[0].disabled = false;
            this.ui.prevButton[0].disabled = false;
          }
        },
    
        toggleCarousel: function (event) {
          const items = this.topRibbonView.el.querySelectorAll(
            ".csui-top-ribbon-item"
          );
          const  topRibbonCarousel = this.ui.topRibbonCarousel[0];
          if(items.length==0) return;
          const className = "csui-top-ribbon-carousel-disabled";
          this.enableCarousel(items);
          if (this.isTopRibbonCarouselDisabled) {
            topRibbonCarousel.classList?.add(className);
            this.currentSlide = 0;
            this.slide(event);
          } else {
              topRibbonCarousel.classList?.remove(className);
              if (event?.type === "shown" && event.data?.direction === "left") return;
              this.slide(event);
          }
        },

        enableCarousel: function (items) {
          const topRibbonWidth = this.topRibbonRegion.el.clientWidth;
          const itemWidth = items[0].clientWidth;
          this.isTopRibbonCarouselDisabled = false;
          if (!!(items.length * itemWidth <= topRibbonWidth)) {
            this.isTopRibbonCarouselDisabled = true;
          };
        },

        onClickPerspective: function (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].classList.contains("binf-active")) {
              return i + 1;
            }
          }
        },

        onClickMoreActions(event, moreActionItems, visibleSlides) {
          const index = [...moreActionItems].indexOf(event.currentTarget);
          const isLastItem = index + 1 === moreActionItems.length;
          return isLastItem ? moreActionItems.length - visibleSlides : this.currentSlide + 1;
        }
      });
    },
  };
  return LandingPagePmanMixin;
});

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/landing.page.pman',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"pman-left-tools\">\n        <ul>\n          <li class=\"pman-toolitem icon-help-container\">\n                <otc-button class=\"icon-help\"  type=\"subtle\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"help") : depth0), depth0))
    + "\" arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"help") : depth0), depth0))
    + "\" "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"loc":{"start":{"line":9,"column":109},"end":{"line":9,"column":190}}})) != null ? stack1 : "")
    + ">\n                  "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"loc":{"start":{"line":10,"column":18},"end":{"line":10,"column":115}}})) != null ? stack1 : "")
    + "\n                </otc-button>\n          </li>\n        </ul>\n        <div class=\"pman-pannel-wrapper\"></div>\n      </div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return " size=\"regular\" ";
},"4":function(container,depth0,helpers,partials,data) {
    return "  icon=\"csui_action:action_help32\"  ";
},"6":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<otc-icon mirrorIfRtl size=\"20\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"helpSVG") || (depth0 != null ? lookupProperty(depth0,"helpSVG") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"helpSVG","hash":{},"loc":{"start":{"line":10,"column":69},"end":{"line":10,"column":80}}}) : helper)))
    + "\" ispresentation></otc-icon>";
},"8":function(container,depth0,helpers,partials,data) {
    return "csui-has-actions ";
},"10":function(container,depth0,helpers,partials,data) {
    return " size=\"small\" ";
},"12":function(container,depth0,helpers,partials,data) {
    return "  icon=\"csui_action:action_caret_left32\"  ";
},"14":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<otc-icon mirrorIfRtl size=\"16\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"carouselLeftSVG") || (depth0 != null ? lookupProperty(depth0,"carouselLeftSVG") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"carouselLeftSVG","hash":{},"loc":{"start":{"line":32,"column":57},"end":{"line":32,"column":76}}}) : helper)))
    + "\" ispresentation></otc-icon>";
},"16":function(container,depth0,helpers,partials,data) {
    return " icon=\"csui_action:action_caret_right32\" ";
},"18":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<otc-icon mirrorIfRtl size=\"16\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"carouselRightSVG") || (depth0 != null ? lookupProperty(depth0,"carouselRightSVG") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"carouselRightSVG","hash":{},"loc":{"start":{"line":38,"column":57},"end":{"line":38,"column":77}}}) : helper)))
    + "\" ispresentation></otc-icon>";
},"20":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-top-ribbon-actions\">\n      <otc-button class=\"csui-add-new-page\" type=\"subtle\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"addPageTitle") || (depth0 != null ? lookupProperty(depth0,"addPageTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"addPageTitle","hash":{},"loc":{"start":{"line":44,"column":65},"end":{"line":44,"column":81}}}) : helper)))
    + "\" arialabel=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"addPageTitle") || (depth0 != null ? lookupProperty(depth0,"addPageTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"addPageTitle","hash":{},"loc":{"start":{"line":44,"column":94},"end":{"line":44,"column":110}}}) : helper)))
    + "\" "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(21, data, 0),"loc":{"start":{"line":44,"column":112},"end":{"line":44,"column":188}}})) != null ? stack1 : "")
    + ">\n      "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(23, data, 0),"inverse":container.noop,"loc":{"start":{"line":45,"column":6},"end":{"line":45,"column":97}}})) != null ? stack1 : "")
    + "\n      </otc-button>\n    </div>\n";
},"21":function(container,depth0,helpers,partials,data) {
    return " icon=\"csui_action:action_add32\" ";
},"23":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<otc-icon size=\"16\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"iconActionAdd") || (depth0 != null ? lookupProperty(depth0,"iconActionAdd") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"iconActionAdd","hash":{},"loc":{"start":{"line":45,"column":45},"end":{"line":45,"column":62}}}) : helper)))
    + "\" ispresentation></otc-icon>";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"pman-backdrop\"></div>\n<div class=\"pman-header\">\n  <div class=\"pman-header-backdrop\"></div>\n  <div class=\"pman-tools-container\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"personalizeMode") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":5,"column":2},"end":{"line":16,"column":11}}})) != null ? stack1 : "")
    + "    <div class=\"pman-right-tools\">\n      <ul>\n        <li>\n          <otc-button class=\"pman-right-tools-button pman-icon-save\" disabled type=\"primary\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "\" arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"saveAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "</otc-button>\n        </li>\n        <li>\n          <otc-button class=\"pman-right-tools-button pman-cancel-edit\" type=\"secondary\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "\" arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancelAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "</otc-button>\n        </li>\n      </ul>\n    </div>\n  </div>\n  <div class=\"csui-top-ribbon-container "
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"personalizeMode") : depth0),{"name":"unless","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"loc":{"start":{"line":28,"column":40},"end":{"line":28,"column":95}}})) != null ? stack1 : "")
    + "\">\n  <div class=\"csui-top-ribbon-carousel\">\n    <div class=\"csui-top-ribbon-carousel-icons\">\n      <otc-button  id=\"left\"  class=\"csui-prev-button csui-carousel-control\"  type=\"subtle\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"previousTitle") || (depth0 != null ? lookupProperty(depth0,"previousTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"previousTitle","hash":{},"loc":{"start":{"line":31,"column":99},"end":{"line":31,"column":116}}}) : helper)))
    + "\" arialabel=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"previousTitle") || (depth0 != null ? lookupProperty(depth0,"previousTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"previousTitle","hash":{},"loc":{"start":{"line":31,"column":129},"end":{"line":31,"column":146}}}) : helper)))
    + "\" "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"loc":{"start":{"line":31,"column":148},"end":{"line":31,"column":233}}})) != null ? stack1 : "")
    + " disabled>\n      "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(14, data, 0),"inverse":container.noop,"loc":{"start":{"line":32,"column":6},"end":{"line":32,"column":111}}})) != null ? stack1 : "")
    + "\n      </otc-button>\n    </div>\n    <div class=\"pman-top-ribbon\" role=\"listbox\"></div>\n    <div class=\"csui-top-ribbon-carousel-icons\">\n      <otc-button  id=\"right\"  class=\"csui-next-button csui-carousel-control\" type=\"subtle\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"nextTitle") || (depth0 != null ? lookupProperty(depth0,"nextTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"nextTitle","hash":{},"loc":{"start":{"line":37,"column":99},"end":{"line":37,"column":112}}}) : helper)))
    + "\" arialabel=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"nextTitle") || (depth0 != null ? lookupProperty(depth0,"nextTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"nextTitle","hash":{},"loc":{"start":{"line":37,"column":125},"end":{"line":37,"column":138}}}) : helper)))
    + "\" "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(16, data, 0),"loc":{"start":{"line":37,"column":140},"end":{"line":37,"column":224}}})) != null ? stack1 : "")
    + ">\n      "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(18, data, 0),"inverse":container.noop,"loc":{"start":{"line":38,"column":6},"end":{"line":38,"column":112}}})) != null ? stack1 : "")
    + "\n      </otc-button>\n    </div>\n</div>\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"personalizeMode") : depth0),{"name":"unless","hash":{},"fn":container.program(20, data, 0),"inverse":container.noop,"loc":{"start":{"line":42,"column":4},"end":{"line":48,"column":15}}})) != null ? stack1 : "")
    + "  </div>\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_landing.page.pman', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/impl/landing.page.pman',[],function(){});

csui.define('csui/perspective.manage/landing.page.pman.view',['csui/lib/marionette',
  'csui/lib/jquery', 
  'csui/perspective.manage/pman.view',
  'csui/utils/non-emptying.region/non-emptying.region',
  'csui/utils/contexts/factories/connector',
  'csui/perspective.manage/impl/top.ribbon/top.ribbon.view',
  'csui/perspective.manage/mixins/landing.page.pman.mixin',
  'csui/perspective.manage/mixins/landing.page.pman.carousel.mixin',
  'csui/utils/perspective/perspective.util',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/landing.page.pman',
  'smart/themes/theming',
  'csui/themes/csui.jato.action.icons',
  'css!csui/perspective.manage/impl/landing.page.pman',
], function ( Marionette, $, PManView, NonEmptyingRegion, ConnectorFactory, TopRibbonView, LandingPagePmanMixin, LandingPagePmanCarouselMixin, PerspectiveUtil, lang, template, theming, jatoActionIcons) {

  let LandingPagePManView = PManView.extend({

    className: function () {
      return `${PManView.prototype.className.call(this)} pman-landing-page`;
    },

    ui: Object.assign({
      topRibbonCarousel: ".csui-top-ribbon-carousel",
      topRibbon: '.pman-top-ribbon',
      topRibbonControlButton: ".csui-carousel-control",
      prevButton: ".csui-prev-button",
      nextButton: ".csui-next-button",
      addPageBtn: ".csui-add-new-page"
    }, PManView.prototype.ui),

    events: Object.assign({
      "click @ui.topRibbonControlButton": "onClickSlide",
      "click @ui.addPageBtn": "onClickAdd",      
      "keydown @ui.topRibbonControlButton": "onClickSlide",
      'keydown @ui.addPageBtn': 'onKeyInAddPageBtn',
      'keydown @ui.prevButton': 'onKeyInprevButton',
    }, PManView.prototype.events),

    template: template,

    templateHelpers: function () {
      let helpers = PManView.prototype.templateHelpers.call(this);
      return {...helpers,...{
        cancel: lang.close,
        previousTitle: lang.previousTitle,
        nextTitle: lang.nextTitle,
        addPageTitle: lang.addPerspective,
        isJATO: theming.isJATOTheme(),
        carouselLeftSVG: jatoActionIcons.actionChevronLargeLeft,
        carouselRightSVG: jatoActionIcons.actionChevronLargeRight,
        iconActionAdd: jatoActionIcons.actionAdd,
        helpSVG: jatoActionIcons.actionHelpCircle,
      }}
    },
 
    constructor: function LandingPagePManView(options) {
      let self = this;
      PManView.prototype.constructor.call(this, options);
      this.connector = this.options.context.getObject(ConnectorFactory);
      this.departmentMap = {};
      this.listenTo(this, "toggle:carousel", function (e) {
        this.toggleCarousel(e);
      })
        .listenTo(this, "enable:carousel", this.enableCarousel)
        .listenTo(this, "toggle:save", this.toggleSave)
        .listenTo(this.context, "finish:serialize:welcomepage", this.onFinishSerializeWelcomePage)
        .listenTo(this.context, 'finish:enter:edit:perspective', this.onFinishEnterEditPerspective);
      $(window).on("resize.landingpagepmanview",this.toggleCarousel.bind(this));
    },
    onShow: function () {
      this.options.container.addClass('csui-top-ribbon-enabled');
      this.toggleCarousel();
    },
    onFinishEnterEditPerspective: function(){
      !this._isShown && this.show();
      this.context.trigger("unblock:actions");
    },

    show: function () {
      var container = this.getContainer(),
        region = new NonEmptyingRegion({
          el: container
        });
      region.show(this, {render:false});
      return this;
    },
 
    _initializeWidgets: function () {
        this.topRibbonRegion = new Marionette.Region({
          el: this.ui.topRibbon
        });
        this.topRibbonView = new TopRibbonView({
          context: this.context,
          parentView: this
        });
        this.topRibbonRegion.show(this.topRibbonView);
    },

    _doCleanup: function () {
      this.options.container.removeClass('csui-top-ribbon-enabled');
      PManView.prototype._doCleanup.apply(this, arguments);
    },

    _doExitPerspective: async function () {
      try {
        if (this.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
          await this.loadDefaultPerspective();
        }
      }
      catch (err) {
        console.error(err);
      }
      finally{
        PManView.prototype._doExitPerspective.apply(this, arguments);
      }
    },

    onBeforeDestroy: function() {
      $(window).off("resize.landingpagepmanview");
      this.context.pmanView=undefined;
    },

    _changeLayout: function(newLayoutType){
      PManView.prototype._changeLayout.call(this, newLayoutType);
      let cView = this.topRibbonView.children.find(c=>c.model===this.perspective);
      cView?.render();
      cView?.markPerspectiveAsModified();
    },

    _swapLayout: function (newLayoutType) {
      PManView.prototype._swapLayout.call(this, newLayoutType);
      let cView = this.topRibbonView.children.find(c=>c.model===this.perspective);
      cView?.render();
      cView?.markPerspectiveAsModified();
    },
  
    onClickAdd: function(){
      let nextPerspectiveModel = this.topRibbonView.createNewPerspectiveModel();
      this.options.context.triggerMethod("serialize:welcomepage", this.perspective, "add", nextPerspectiveModel, true);
    },
    
    onClickSlide: function (event) {
      let topRibbonActionDropdown = document.querySelectorAll('.csui-top-ribbon-actions-dropdown-toggle');
      if(event.type === 'keydown') {
        switch (event.key) {        
          case "ArrowLeft": // Left Arrow
          if (!$(event.target).is(this.ui.prevButton)) {
            topRibbonActionDropdown[topRibbonActionDropdown.length - 1].focus();
          }
          break;
          case "ArrowRight": // Right Arrow
          if ($(event.target).is(this.ui.prevButton)) {
            topRibbonActionDropdown[0].focus();
          } else {
            document.querySelectorAll('.csui-top-ribbon-actions otc-button')[0]?.focus();
          }          
          break;
          case "Tab": //TAB
          document.querySelectorAll('.csui-pman-sidebar-ribbon otc-button')[0]?.focus();
          event.preventDefault(); 
        } 
      } else {
        this.slide(event);
        event.preventDefault();
      }
    },

    onClickSave: function () {
      this.options.context.triggerMethod("serialize:welcomepage", this.perspective, "save", null, false);
    },

    onClickClose: async function () {
      this.options.context.triggerMethod("serialize:welcomepage", this.perspective, "close", null, true);
    },

    toggleSave: function() {
      if (this.el.querySelectorAll('.csui-server-error-perspective').length > 0 || this.el.querySelectorAll('.csui-error-perspective').length > 0
        || this.topRibbonView.collection.modifiedCount==0)
        this.ui.saveBtn[0].disabled = true;
      else
        this.ui.saveBtn[0].disabled = false;
    },

    onKeyInAddPageBtn: function(event) {
      let toolButtons = document.querySelectorAll('.pman-right-tools button'); 
      let topRibbonlayouts;
      switch (event.key) {    
        case "ArrowLeft": // Left Arrow
        topRibbonlayouts = this.topRibbonView.el.querySelectorAll(".csui-top-ribbon-layout");
        topRibbonlayouts[topRibbonlayouts.length - 1].focus();
        break;
        case "Tab": //TAB
        if (event.shiftKey && event.key === 'Tab' && $(event.target).is(this.ui.addPageBtn)) {
          toolButtons[toolButtons.length - 1].focus();
          event.preventDefault();
        } else {
          document.querySelectorAll('.csui-pman-sidebar-ribbon otc-button')[0].focus();
          event.preventDefault(); 
        }
      }  
    },
    onKeyInprevButton: function (event) {
      let toolButtons;
      switch (event.key) {    
        case "ArrowLeft": // Left Arrow
        topRibbonPerspectiveActions[topRibbonPerspectiveActions.length - 1].focus();
        break;
        case "Tab": //TAB
        if (event.shiftKey && event.key === 'Tab' && $(event.target).is(this.ui.prevButton)) {
          toolButtons = document.querySelectorAll('.pman-right-tools button');
          toolButtons[toolButtons.length - 1].focus();
          event.preventDefault();
        } else {
          this.trigger("toggle:carousel", event);
          this.topRibbonView.el.querySelectorAll(".csui-top-ribbon-layout")[0].focus();          
          event.preventDefault(); 
        }
      } 
    },
    // Move focus to active pespective thumbnail of top ribbon
    _setFocusOnFirstWidget: function (event) {
      if(event?.target.classList.contains('pman-cancel-edit')) {
        if(!this.ui.prevButton[0].disabled) {
          this.ui.prevButton[0].focus();
        }else {
          this.topRibbonView.el.querySelectorAll(".csui-top-ribbon-layout")[0].focus();
        }
        } else if (!!event && this.mode === 'personalize') {
          PManView.prototype._setFocusOnFirstWidget.call(this);
        }
        else {
          let activePerspective = this.topRibbonView.el.querySelector(".binf-active .csui-top-ribbon-layout");
          activePerspective.focus();
      }
    }

  });

  LandingPagePmanMixin.mixin(LandingPagePManView.prototype);
  LandingPagePmanCarouselMixin.mixin(LandingPagePManView.prototype);
  return LandingPagePManView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/branding',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"pman-backdrop\"></div>\n<div class=\"pman-header\">\n  <div class=\"pman-header-backdrop\"></div>\n  <div class=\"pman-tools-container\">\n    <div class=\"pman-left-tools\">\n      <ul>\n        <li class=\"pman-toolitem icon-help-container\">\n        <otc-button class=\"icon-help\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"help") : depth0), depth0))
    + "\" icon=\"csui_action:action_help32\" iconappearance=\"\" image=\"\">\n        </otc-button>\n        </li>\n      </ul>\n    </div>\n    <div class=\"pman-right-tools\">\n      <ul>\n        <li>\n          <otc-button type=\"primary\" arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"saveAriaLabel") : depth0), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "\" disabled class=\"pman-right-tools-button pman-icon-save\">\n            "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "\n          </otc-button>\n        </li>\n        <li>\n          <otc-button arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancelAriaLabel") : depth0), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "\"  class=\"pman-right-tools-button pman-cancel-edit\" type=\"secondary\">\n              "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "\n          </otc-button>\n        </li>\n      </ul>\n    </div>\n  </div>\n</div>\n<div id=\"breadcrumb-wrap\" class=\"pman-header-config breadcrumb-wrap-visible\">\n  <div class=\"pman-header-preview-panel\">\n    <div class=\"pman-header-container pman-container-header-container\">\n      <div class=\"pman-container-header\"></div>\n      <div class=\"breadcrumb-inner breadcrumb-inner-header pman-container-breadcrumb csui-perspective-breadcrumb\">\n      </div>\n    </div>\n  </div>\n  <div class=\"pman-header-settings-container\">\n  </div>\n</div>\n<div class=\"pman-backdrop\"></div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_branding', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspective.manage/branding.view',[
  'csui/utils/base',
  'csui/perspective.manage/pman.view.branding',
  'hbs!csui/perspective.manage/impl/branding',
  'i18n!csui/perspective.manage/impl/nls/lang',
], function (base, PmanBrandingView, template, lang) {

  let BrandingView = PmanBrandingView.extend({
    template,

    onClickSave: function () {
      this.applyHeaderChanges()
        .done(() => {
          this.removePreviewBrandingStyleSheet();
          this._showMessage("success", lang.LblBrandingChanges);
          this._doCleanup();
        })
        .fail((error) => {
            const err = new base.Error(error);
            this._showMessage("error", err.message);
            this.el.querySelector(".pman-icon-save").setAttribute("disabled", true);
            this.unblockActions();
        });
    },

    onClickClose: function () {
      this.options?.container[0]?.querySelector('.cs-perspective-panel').removeAttribute('style');
      this.removePreviewBrandingStyleSheet();
      //This is to remove background color on returning back to perspective view.
      this._doCleanup();
    },

    _triggerEditMode: function () {
      this.context.triggerMethod('enter:edit:perspective');
    },

    onRender: function () {
      const self = this;
      this.options.mode = 'editNavigationHeader';
      document.body.classList.add('csui-pman-header-config', 'perspective-editing');
      this._showHeader();
      this.listenTo(this.settingsRegion?.currentView, 'change:settings', function () {
        self.el.querySelector('.pman-icon-save').removeAttribute('disabled');
      });
    },

    onShow: function () {
      this._setFocusOnFirstWidgetHeader();
    },

    onKeyDown: function (event) {
      let resetButton = event.target.classList?.contains('csui-header-config-reset-btn');
      if (!event.shiftKey && event.keyCode === 9 && resetButton) {
        this._setFocusOnFirstElementHeader(event);
      }
      if (!event.shiftKey && event.target.classList.contains('pman-cancel-edit') && event.keyCode === 9) {
        this._setFocusOnFirstWidgetHeader();
        return false;
      }
    },

    //below methods are used to load perspective in edit mode. As its not needed in this case, overriding them
    _prepareForEdit: function () { },
    _registerEventHandler: function () { },
    _onPmanRender: function () { },
    _getExistsWidgetTypes: function () { },
    _initializeWidgets: function () { },
    _savePerspective: function () { },
  })
  return BrandingView;
});

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/jato/branding',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"pman-backdrop\"></div>\n<div class=\"pman-header\">\n  <div class=\"pman-header-backdrop\"></div>\n  <div class=\"pman-tools-container\">\n    <div class=\"pman-left-tools\">\n      <otc-button class=\"icon-help\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"help") : depth0), depth0))
    + "\">\n        <otc-icon type='raw' svg='"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"helpIcon") : depth0), depth0))
    + "'></otc-icon>\n      </otc-button>\n    </div>\n    <div class=\"pman-right-tools\">\n      <otc-button type=\"primary\" arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"saveAriaLabel") : depth0), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "\" disabled class=\"pman-icon-save\">\n          "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "\n      </otc-button>\n      <otc-button type=\"secondary\" arialabel=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancelAriaLabel") : depth0), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "\"  class=\"pman-cancel-edit\">\n          "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "\n      </otc-button>\n    </div>\n  </div>\n</div>\n<div id=\"breadcrumb-wrap\" class=\"pman-header-config breadcrumb-wrap-visible\">\n  <div class=\"pman-header-preview-panel\">\n    <div class=\"pman-header-container pman-container-header-container\">\n      <div class=\"pman-header-preview\">\n        <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"lightModeBranding") || (depth0 != null ? lookupProperty(depth0,"lightModeBranding") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"lightModeBranding","hash":{},"loc":{"start":{"line":24,"column":14},"end":{"line":24,"column":35}}}) : helper)))
    + "</span>\n        <div data-smart-theme='light' branding-theme='light' class=\"pman-jato-header-container pman-light-header-container\"></div>\n      </div>\n      <div class=\"pman-header-preview\">\n        <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"darkModeBranding") || (depth0 != null ? lookupProperty(depth0,"darkModeBranding") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"darkModeBranding","hash":{},"loc":{"start":{"line":28,"column":14},"end":{"line":28,"column":34}}}) : helper)))
    + "</span>\n        <div data-smart-theme='dark' branding-theme='dark' class=\"pman-jato-header-container pman-dark-header-container\"></div>\n      </div>\n    </div>\n  </div>\n  <div class=\"pman-header-settings-edit-branding\">\n      <div class=\"csui-header-settings-list-title\" >"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"headerSettings") || (depth0 != null ? lookupProperty(depth0,"headerSettings") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"headerSettings","hash":{},"loc":{"start":{"line":34,"column":52},"end":{"line":34,"column":70}}}) : helper)))
    + "</div>\n      <div class=\"csui-header-settings-list-lg\"></div>\n      <div class=\"pman-header-jato-settings-container\">\n    </div>\n  </div>\n</div>\n<div class=\"pman-backdrop\"></div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_jato_branding', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspective.manage/jato/settings.panel/settings/light.mode.icon.backgroundcolor.setting',['i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang',
], function (lang) {
    return {
        className: 'csui-light-settings-panel-branding',
        "title": lang.lightModeBranding,
        "schema": {
            "type": "object",
            "properties": {
                "imgData": {
                    "title": lang.logo,
                    "type": "object"
                },
                "backgroundColor": {
                    "title": lang.applicationHeaderBackgroundColor,
                    "type": "string"
                },
                "isInvertIconColor":{
                    "title": lang.invertIconColors,
                    "type": "checkboxV2"
                }
            }
        },
        "options": {
            "fields": {
                "imgData": {
                    "type": "csui-image-picker",
                    "theme": "light",
                },
                "backgroundColor": {
                    "type": "csui-color-picker"
                },
                "isInvertIconColor":{
                    "type": "checkboxV2"
                }
            }
        },

        getConfigFromFormData: function ({backgroundColor, imgData, isInvertIconColor}) {
            let retObj = {
                brandingSettingCodes:{
                    themes:{
                        light:{
                            customBrandingBgColor: backgroundColor,
                            brandLogoUri: imgData?.logo,
                            isInvertIconColor,
                            fileDetails: imgData?.fileDetails
                        }
                    }
                },
            };
            return retObj;
        },

        getFormDataFromConfig: function ({brandingSettingCodes}) {
            let themes = brandingSettingCodes?.themes;
            let retObj = {
                backgroundColor: themes?.light?.customBgColor || 'rgb(255, 255, 255)',
                isInvertIconColor: themes?.light?.isInvertIconColor,
                imgData: {brandLogoUri: themes?.light?.brandLogoUri},
            }
            return retObj;
        },
        getDefaultConfig: function () {
            let retObj = {
                backgroundColor: 'rgb(255, 255, 255)',
                imgData: "",
                isInvertIconColor: false
            };
            return retObj;
        }

    };
});

csui.define('csui/perspective.manage/jato/settings.panel/settings/dark.mode.icon.backgroundcolor.setting',['i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang',
], function (lang) {
    return {
        className: 'csui-dark-settings-panel-branding',
        "title": lang.darkModeBranding,
        "schema": {
            "type": "object",
            "properties": {
                "imgData": {
                    "title": lang.logo,
                    "type": "object"
                },
                "backgroundColor": {
                    "title": lang.applicationHeaderBackgroundColor,
                    "type": "string"
                },
                "isInvertIconColor":{
                    "title": lang.invertIconColors,
                    "type": "checkboxV2"
                }
            }
        },
        "options": {
            "fields": {
                "imgData": {
                    "type": "csui-image-picker",
                    "theme": "dark",
                },
                "backgroundColor": {
                    "type": "csui-color-picker"
                },
                "isInvertIconColor":{
                    "type": "checkboxV2"
                }
            }
        },

        getConfigFromFormData: function ({backgroundColor, imgData, isInvertIconColor}) {
            let retObj = {
                brandingSettingCodes:{
                    themes:{
                        dark:{
                            customBrandingBgColor: backgroundColor,
                            brandLogoUri: imgData?.logo,
                            isInvertIconColor,
                            fileDetails: imgData?.fileDetails
                        }
                    }
                },
            };
            return retObj;
        },

        getFormDataFromConfig: function ({brandingSettingCodes}) {
            let themes = brandingSettingCodes?.themes;
            let retObj = {
                backgroundColor: themes?.dark?.customBgColor || 'rgb(20, 27, 46)',
                imgData: {brandLogoUri: themes?.dark?.brandLogoUri},
                isInvertIconColor: themes?.dark?.isInvertIconColor
            }
            return retObj;
        },
        getDefaultConfig: function () {
            let retObj = {
                backgroundColor: 'rgb(20, 27, 46)',
                isInvertIconColor: false,
                imgData: "",
            };
            return retObj;
        }

    };
});

csui.define('csui/perspective.manage/jato/settings.panel/settings/branding.text',['i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang',
], function (lang) {
    return {
        className: 'csui-settings-panel-branding-product-name',
        "title": lang.text,
        "schema": {
            "type": "object",
            "properties": {
                "primaryText": {
                    "title": lang.primaryText,
                    "type": "string"
                },
                "secondaryText": {
                    "title": lang.secondaryText,
                    "type": "string"
                },
                "versionText": {
                    "title": lang.versionText,
                    "type": "string"
                }
            }
        },
        "options": {
            "fields": {
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
        getConfigFromFormData: function ({primaryText, secondaryText, versionText}) {
            let retObj = {
                brandingSettingCodes:{
                    primaryText,
                    secondaryText,
                    versionText,
                }
            };
            return retObj;
        },
        getFormDataFromConfig: function ({brandingSettingCodes}) {
            let retObj = {
                primaryText: brandingSettingCodes?.primaryText,
                secondaryText: brandingSettingCodes?.secondaryText,
                versionText: brandingSettingCodes?.versionText,
            }
            return retObj;
        },
        getDefaultConfig: function () {
            let retObj = {
                primaryText: "",
                secondaryText: "",
                versionText: "",
            };
            return retObj;
        }
    }
});

csui.define('csui/perspective.manage/jato/settings.panel/setting.items',[
    'csui/lib/underscore', 'csui/lib/backbone',
    'csui/perspective.manage/jato/settings.panel/settings/light.mode.icon.backgroundcolor.setting',
    'csui/perspective.manage/jato/settings.panel/settings/dark.mode.icon.backgroundcolor.setting',
    'csui/perspective.manage/jato/settings.panel/settings/branding.text',
    'csui-ext!csui/perspective.manage/settings.panel/setting.items'
  ], function (_, Backbone, 
    lightBrandingForm, darkBrandingForm, textSettingsForm, extraAccordions) {
  
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
        contentView: lightBrandingForm
      },
      {
        sequence: 20,
        contentView: darkBrandingForm
      },
      {
        sequence: 30,
        contentView: textSettingsForm
      }
    ]);
  
    if (extraAccordions) {
      BrandingAccordions.add(_.flatten(extraAccordions, true));
    }
    return BrandingAccordions;
  
  });
  

csui.define('csui/perspective.manage/jato/settings.panel/settings/settings',['csui/lib/underscore', 'csui/lib/jquery',
    'csui/lib/backbone',
    'csui/perspective.manage/jato/settings.panel/setting.items',
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
        }

    });

    var SettingsCollection = Backbone.Collection.extend({
        model: SettingModel
    })
    return new SettingsCollection(settings);
});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/jato/settings.panel/impl/settings.panel',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-header-settings-list csui-pman-panel csui-normal-scrolling csui-no-scroll-x\" role=\"tablist\">\n</div>\n\n<div class=\"csui-header-settings-footer\">\n   <otc-button type=\"primary\" arialabel=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"resetTitle") || (depth0 != null ? lookupProperty(depth0,"resetTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"resetTitle","hash":{},"loc":{"start":{"line":5,"column":41},"end":{"line":5,"column":55}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"resetTitle") || (depth0 != null ? lookupProperty(depth0,"resetTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"resetTitle","hash":{},"loc":{"start":{"line":5,"column":64},"end":{"line":5,"column":78}}}) : helper)))
    + "\" class=\"csui-header-config-reset-btn\">\n         "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"resetTitle") : depth0), depth0))
    + "\n   </otc-button>\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_jato_settings.panel_impl_settings.panel', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/jato/settings.panel/impl/setting',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <otc-button type=\"subtle\" size=\"small\" class=\"icon-expandArrowDown\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"expandTab") || (depth0 != null ? lookupProperty(depth0,"expandTab") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"expandTab","hash":{},"loc":{"start":{"line":4,"column":79},"end":{"line":4,"column":92}}}) : helper)))
    + "  "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"settingTitle") || (depth0 != null ? lookupProperty(depth0,"settingTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"settingTitle","hash":{},"loc":{"start":{"line":4,"column":94},"end":{"line":4,"column":110}}}) : helper)))
    + "\"\n        arialabel=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"expandTab") || (depth0 != null ? lookupProperty(depth0,"expandTab") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"expandTab","hash":{},"loc":{"start":{"line":5,"column":19},"end":{"line":5,"column":32}}}) : helper)))
    + "  "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"settingTitle") || (depth0 != null ? lookupProperty(depth0,"settingTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"settingTitle","hash":{},"loc":{"start":{"line":5,"column":34},"end":{"line":5,"column":50}}}) : helper)))
    + "\">\n            <otc-icon type=\"raw\" size=\"16\" svg='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"chevoronDown") || (depth0 != null ? lookupProperty(depth0,"chevoronDown") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"chevoronDown","hash":{},"loc":{"start":{"line":6,"column":48},"end":{"line":6,"column":64}}}) : helper)))
    + "'></otc-icon>\n    </otc-button>\n    <otc-button type=\"subtle\" size=\"small\" class=\"icon-expandArrowUp\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"collapseTab") || (depth0 != null ? lookupProperty(depth0,"collapseTab") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"collapseTab","hash":{},"loc":{"start":{"line":8,"column":77},"end":{"line":8,"column":92}}}) : helper)))
    + "  "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"settingTitle") || (depth0 != null ? lookupProperty(depth0,"settingTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"settingTitle","hash":{},"loc":{"start":{"line":8,"column":94},"end":{"line":8,"column":110}}}) : helper)))
    + "\"\n        arialabel=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"collapseTab") || (depth0 != null ? lookupProperty(depth0,"collapseTab") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"collapseTab","hash":{},"loc":{"start":{"line":9,"column":19},"end":{"line":9,"column":34}}}) : helper)))
    + "  "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"settingTitle") || (depth0 != null ? lookupProperty(depth0,"settingTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"settingTitle","hash":{},"loc":{"start":{"line":9,"column":36},"end":{"line":9,"column":52}}}) : helper)))
    + "\">\n            <otc-icon type=\"raw\"  size=\"16\" svg='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"chevoronUp") || (depth0 != null ? lookupProperty(depth0,"chevoronUp") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"chevoronUp","hash":{},"loc":{"start":{"line":10,"column":49},"end":{"line":10,"column":63}}}) : helper)))
    + "'></otc-icon>\n    </otc-button>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"csui-button-icon cs-icon icon-expandArrowDown\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"expandTab") || (depth0 != null ? lookupProperty(depth0,"expandTab") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"expandTab","hash":{},"loc":{"start":{"line":13,"column":71},"end":{"line":13,"column":84}}}) : helper)))
    + " "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"settingTitle") || (depth0 != null ? lookupProperty(depth0,"settingTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"settingTitle","hash":{},"loc":{"start":{"line":13,"column":85},"end":{"line":13,"column":101}}}) : helper)))
    + "\"></span>\n    <span class=\"csui-button-icon cs-icon icon-expandArrowUp\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"collapseTab") || (depth0 != null ? lookupProperty(depth0,"collapseTab") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"collapseTab","hash":{},"loc":{"start":{"line":14,"column":69},"end":{"line":14,"column":84}}}) : helper)))
    + " "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"settingTitle") || (depth0 != null ? lookupProperty(depth0,"settingTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"settingTitle","hash":{},"loc":{"start":{"line":14,"column":85},"end":{"line":14,"column":101}}}) : helper)))
    + "\"></span>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
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
    + "</div>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJatoTheme") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":3,"column":0},"end":{"line":15,"column":11}}})) != null ? stack1 : "")
    + "</div>\n<div class=\"pman-setting-content csui-accordion-content perspective-widget-form csui-pman-form-wrapper binf-hidden\"></div>";
}});
Handlebars.registerPartial('csui_perspective.manage_jato_settings.panel_impl_setting', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspective.manage/jato/settings.panel/settings.panel.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
    'csui/utils/base', 'csui/perspective.manage/jato/settings.panel/settings/settings',
    'csui/controls/form/form.view',
    'csui/dialogs/modal.alert/modal.alert',
    'i18n!csui/perspective.manage/impl/nls/lang',
    'hbs!csui/perspective.manage/jato/settings.panel/impl/settings.panel',
    'hbs!csui/perspective.manage/jato/settings.panel/impl/setting',
    'csui/perspective.manage/mixins/update.supportasset.branding.config.mixin',
    'csui/themes/csui.jato.action.icons',
    'smart/themes/theming',
    'css!csui/perspective.manage/settings.panel/impl/settings.panel',
], function (_, $, Backbone, Marionette, base, allSettings, FormView, ModalAlert, lang, template, settingTemplate, UpdateSupportAssetBrandingConfigMixin, jatoActionIcons, theming) {

    var SettingView = Marionette.LayoutView.extend({
        template: settingTemplate,
        className: function () {
            return this.model.get('className');
        },

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
            'keydown @ui.accordionHeader otc-button': "stopKeyEventPropagation",
        },

        stopKeyEventPropagation: function(event){
            event.stopPropagation();
            const focusFieldClassName = {
                'icon-expandArrowUp' : 'icon-expandArrowDown',
                'icon-expandArrowDown':'icon-expandArrowUp'
            }
            if(event.keyCode == 13 || event.keyCode == 32){
                const element = $(event.currentTarget.parentElement).find(`otc-button.${focusFieldClassName[event.currentTarget.className]}`);
                setTimeout(function(){
                    element.focus();
                }, 300);
            }
        },
        templateHelpers: function () {
            return {
                settingTitle: this.model.get('title'),
                expandTab: lang.expand,
                collapseTab: lang.collapse,
                isJatoTheme: theming.isJATOTheme(),
                chevoronUp: jatoActionIcons.actionChevronSmallUp,
                chevoronDown: jatoActionIcons.actionChevronSmallDown
            }
        },

        initialize: function () {
            this.defaultbrandingSettingCodes = [];
            const data = this.model.getData(this.options.previewBranding.toJSON());
            var formModel = new Backbone.Model({
                schema: this.model.get('schema'),
                options: this.model.get('options'),
                data: data
            })
            this.formView = new FormView({
                mode: "create",
                model: formModel,
                context: this.options.context
            });
            this.formView.on('change:field', this._onChange, this);
        },

        _onChange: function () {
            this.triggerMethod('change:setting', this.getSettingChange());
        },

        resetToDefault: function () {
            var self = this, deferred = $.Deferred();
            var defaultConfig = this.model.getDefaultConfig();
            this.formView.on('render:form', function () {
                deferred.resolve(self.getSettingChange());
            });
            this.formView.model.set('data', defaultConfig);
            this.formView.updateForm();
            return deferred.promise();
        },
        onRender: function () {
            if(this.model.has('schema')){
                this.contentRegion.show(this.formView);
            }
        },

        getSettingChange: function () {
            settingData = this.formView.getValues() || {},
                settingChange = {};
            settingChange = this.model.getConfigFromFormData(settingData);
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
                    self.options.pmanBrandingView.$el.find('button.pman-cancel-edit').focus();
                  }, 0);
            }
        }
    });

    var JatoHeaderSettingsPanel = Marionette.CompositeView.extend({
        className: 'pman-header-settings-panel',
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
                resetLabel: lang.resetToOriginalSettingLabelJato,
                resetTitle: lang.resetToOriginalSettingLabelJato
            }
        },

        template: template,

        childEvents: {
            'change:setting': 'onChangeSetting',
        },

        events: {
            'click .csui-header-config-reset-btn': "onResetToDefault",
        },

        constructor: function JatoHeaderSettingsPanel(options) {
            options.collection = allSettings;
            this.pmanBrandingView = options?.pmanBrandingView;
            Marionette.CompositeView.prototype.constructor.apply(this, arguments);
        },

        onChangeSetting: function (child, headerSettings) {
            this.trigger('change:jato:settings', headerSettings, child.model.get('widgetId'));
        },
        onResetToDefault: function () {
            var self = this;
            ModalAlert.showWarning(function (confirmed) {
                confirmed && self.resetToDefaultSettings();
            }, lang.resetToDefaultAlertMessage, lang.resetToOriginalSettingLabelJato, {
                buttons: {
                    showYes: true,
                    labelYes: lang.resetLabel,
                    showNo: false,
                    showCancel: true
                }
            });
        },
        resetToDefaultSettings: function () {
            const defaultStyles = this.DEFAULT_BRAND_SETTINGS;
            // set all the brandingSetting codes to empty
            document.querySelector(".binf-widgets.perspective-editing .cs-perspective-panel")?.removeAttribute('style');
            this.options.context.previewBranding.set('brandLogoUri', '');
            this.options.context.previewBranding.set('brandLogoUri_id', '');
            this.options.context.previewBranding.set('brandingSettingCodes', defaultStyles);
            this.options.context.previewBranding.set('fileDetails', '');
            // this flag is to determile any update in branding.
            this.options?.context.previewBranding.set("isBrandingChangeTriggered", true);
            this.options.context?.navigationHeaderView?.brandingConfigData?.set({brandingCSS:''});
            this.options.context?.navigationHeaderView?.brandingConfigData?.trigger('change:branding');
            this.trigger('change:jato:settings',"resetBranding");
            this.children.map(function (c) {
                return c.resetToDefault();
            });
        }

    })
    UpdateSupportAssetBrandingConfigMixin.mixin(JatoHeaderSettingsPanel.prototype);
    return JatoHeaderSettingsPanel;
});


csui.define('csui/perspective.manage/jato/branding.view',[
  'csui/lib/marionette',
  'csui/lib/underscore',
  'csui/utils/base',
  'smart/themes/theming',
  "csui/pages/start/start.page.view",
  'csui/perspective.manage/pman.view.branding',
  'hbs!csui/perspective.manage/impl/jato/branding',
  'csui/perspective.manage/jato/settings.panel/settings.panel.view',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/next.node',
  'smart/controls/app.header/app.header.view',
  'i18n',
  'i18n!csui/perspective.manage/impl/nls/lang',
], function (Marionette, _, base, theming, StartPageView, PmanBrandingView, template, SettingsPanelView,
  ApplicationScopeModelFactory,
  NextNodeModelFactory, 
  SmartNavigationHeaderView,
  i18n,
  lang) {
  let JATO_THEMES_INVERSION = {
    light:'dark',
    dark:'light'
  }
  let BrandingView = PmanBrandingView.extend({
    template,
    className: function(){
      return PmanBrandingView.prototype.className.call(this) + ' csui-jato-manage-branding';
    },
    templateHelpers: function(){
      
      const {lightModeBranding, darkModeBranding, headerSettings} = lang;
      return _.extend(PmanBrandingView.prototype.templateHelpers.call(this), {lightModeBranding, darkModeBranding, headerSettings});
    },
    constructor: function BrandingView(options) {
      PmanBrandingView.prototype.constructor.apply(this, arguments);
    },
    onClickSave: function () {
      this.applyHeaderChanges()
        .done(() => {
          this.removePreviewBrandingStyleSheet();
          this._showMessage("success", lang.LblBrandingChanges);
          this._doCleanup();
        })
        .fail((error) => {
            const err = new base.Error(error);
            this._showMessage("error", err.message);
            this.el.querySelector(".pman-icon-save").setAttribute("disabled", true);
            this.unblockActions();
        });
    },
    onClickClose: function () {
      this.options?.container[0]?.querySelector('.cs-perspective-panel').removeAttribute('style');
      this.removePreviewBrandingStyleSheet();
      this._doCleanup();
    },
    ui: function () {
      return _.extend({},PmanBrandingView.prototype.ui,{
        lightHeaderContainer: '.pman-light-header-container',
        darkHeaderContainer: '.pman-dark-header-container',
        settingsContainer: '.pman-header-jato-settings-container'
      },);
    },
    _triggerEditMode: function () {
      this.context.triggerMethod('enter:edit:perspective');
    },
    _initHeaderPreview: function () {
      this._initExtendedHeaderPreview('light');// for light application header
      this._initExtendedHeaderPreview('dark');// for dark application header
    },
    _getPreviewHeader: function(panel){
      return panel === 'dark' ? this.darkPreviewHeader: this.lightPreviewHeader;
    },
    _initExtendedHeaderPreview: function (panel) {
      
      var nextNode = this.context.getModel(NextNodeModelFactory, { unique: true });
      var applicationScope = this.context.getModel(ApplicationScopeModelFactory, { unique: true });
      this.useV2AppHeader = StartPageView.useV2AppHeader;
      applicationScope.set("id", "");
      // duplicate is required to avoid complete re-render and avoid destroying of navigation bar
      let header = this._getPreviewHeader(panel);
      header = new SmartNavigationHeaderView({
        context: this.context,
        previewBranding: this.context.previewBranding,
        nextNode: nextNode,
        applicationScope: applicationScope,
        isPerspectiveEdit: true,
        transparent: true,
        rtl: i18n.settings.rtl,
        brandingConfig: this.context.previewBranding,
        enableHamburger: StartPageView.enableHamburger,
      });
      this.containerHeaderRegion = new Marionette.Region({
        el: panel === 'dark' ? this.ui.darkHeaderContainer: this.ui.lightHeaderContainer
      });
      if(panel == 'dark'){
        this.darkPreviewHeader = header;
      }else{
        this.lightPreviewHeader = header;
      }
      this.containerHeaderRegion.show(header);
      header?.trigger('render:header');
      header.on("render", this._preventDefaultFocusables, header);
      if(this.context.previewBranding.get('brandingSettingCodes')?.themes[panel].isInvertIconColor){
        this.$el.find(`.pman-${panel}-header-container.pman-jato-header-container`).addClass('csui-app-header-invert');
      }
    },
    onRender: function () {
      const self = this;
      this.options.mode = 'editNavigationHeader';
      document.body.classList.add('csui-pman-header-config', 'perspective-editing');
      this._showHeader();
      this.listenTo(this.settingsRegion?.currentView, 'change:jato:settings', function () {
        self.el.querySelector('.pman-icon-save').removeAttribute('disabled');
      });
    },

    onShow: function () {
      this._setFocusOnFirstWidgetHeader();
    },

    onKeyDown: function (event) {
      let resetButton = event.target.classList?.contains('csui-header-config-reset-btn');
      if (!event.shiftKey && event.keyCode === 9 && resetButton) {
        this._setFocusOnFirstElementHeader(event);
      }
      if (!event.shiftKey && event.target.classList.contains('pman-cancel-edit') && event.keyCode === 9) {
        this._setFocusOnFirstWidgetHeader();
        return false;
      }
    },
    _initSettingsPanel: function () {
      var settingsPanel = new SettingsPanelView({ context: this.context, previewBranding: this.context.previewBranding, pmanBrandingView: this });
      this.settingsRegion = new Marionette.Region({
        el: this.ui.settingsContainer
      });
      this.settingsRegion.show(settingsPanel);

      this.listenTo(settingsPanel, 'change:jato:settings', function (updatedConfig) {
        if(updatedConfig === 'resetBranding'){
          this.darkPreviewHeader?.options?.brandingConfig.trigger('change:branding');
          this.lightPreviewHeader?.options?.brandingConfig.trigger('change:branding');
          let bgColor = 'var(--jato-background-elevation-level-1, transparent)';
          this.darkPreviewHeader.$el.find('otc-header-bar').css('background', bgColor);
          this.lightPreviewHeader.$el.find('otc-header-bar').css('background', bgColor);
          this.$el.find('.pman-jato-header-container').removeClass('csui-app-header-invert')
          this.removePreviewBrandingStyleSheet();
          return;
        }
        if (!updatedConfig || Object.keys(updatedConfig).length === 0) return;
        let updatedValue = {
          brandingSettingCodes: {},
        };
        const currentTheme = theming.getTheme();
        let brandingSettingCodes = this.context.previewBranding.get('brandingSettingCodes');
        let currentBrandingSettingCodes = brandingSettingCodes?.themes[currentTheme];
        let tempBrandingSettingCodes = updatedConfig.brandingSettingCodes || {};
        
        // // checking for default color for header bar element.
        const darkHeaderBarEle = this._getPreviewHeader('dark')?.el?.querySelector("otc-header-bar");
        const lightHeaderBarEle = this._getPreviewHeader('light')?.el?.querySelector("otc-header-bar");
        const darkThemeBgColorUnConverted = getComputedStyle(darkHeaderBarEle)?.backgroundColor;
        const lightThemeBgColorUnConverted = getComputedStyle(lightHeaderBarEle)?.backgroundColor;

        const darkThemeBgColor = darkHeaderBarEle
        ? this.rgbStringToHex(darkThemeBgColorUnConverted) || darkThemeBgColorUnConverted
        : "#FFFFFF";
        const lightThemeBgColor = lightHeaderBarEle
        ? this.rgbStringToHex(lightThemeBgColorUnConverted) || lightThemeBgColorUnConverted
        : "#FFFFFF";
        const isInvertIconColorCurrentTheme = currentBrandingSettingCodes?.isInvertIconColor;
        //Update current themes data first
        //Update other themes data next
        //Update branding text later
        let themeUpdated;
        const isThemesUpdated = updatedConfig?.brandingSettingCodes?.themes;
        if(isThemesUpdated){
          themeUpdated = Object.keys(updatedConfig.brandingSettingCodes?.themes)[0];
          let updatedBrandingSettingCodes = updatedConfig.brandingSettingCodes?.themes[currentTheme];
          //if user has updated branding text then themes section would not be updated i.e., updatedConfig?.brandingSettingCodes?.themes will be undefined
          if(themeUpdated !== currentTheme){
            updatedBrandingSettingCodes = updatedConfig.brandingSettingCodes?.themes[themeUpdated];
          }
          tempBrandingSettingCodes = structuredClone(brandingSettingCodes);
          if (updatedBrandingSettingCodes?.customBrandingBgColor && (
            (themeUpdated == 'dark' &&  updatedBrandingSettingCodes?.customBrandingBgColor?.toLowerCase() !== darkThemeBgColor) || 
            (themeUpdated == 'light' &&  updatedBrandingSettingCodes?.customBrandingBgColor?.toLowerCase() !== lightThemeBgColor)
          )) {
            //if current theme color got changed or other theme color got changed
            tempBrandingSettingCodes.themes[themeUpdated].customBgColor = updatedBrandingSettingCodes?.customBrandingBgColor;
            updatedValue.brandingSettingCodes = tempBrandingSettingCodes;
          }
         if (updatedBrandingSettingCodes.brandLogoUri) {
            updatedValue.brandingSettingCodes = tempBrandingSettingCodes;
            updatedValue.brandingSettingCodes.themes[themeUpdated].brandLogoUri = updatedBrandingSettingCodes.brandLogoUri;
            updatedValue.brandingSettingCodes.themes[themeUpdated].fileDetails = updatedBrandingSettingCodes.fileDetails;
          }
          if (updatedBrandingSettingCodes?.isInvertIconColor !== undefined && ((themeUpdated == currentTheme && updatedBrandingSettingCodes?.isInvertIconColor !== isInvertIconColorCurrentTheme) || (themeUpdated !== currentTheme))) {
            updatedValue.brandingSettingCodes = tempBrandingSettingCodes;
            updatedValue.brandingSettingCodes.themes[themeUpdated].isInvertIconColor = updatedBrandingSettingCodes.isInvertIconColor;
          }
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

        updateTextValue("primaryText");
        updateTextValue("secondaryText");
        updateTextValue("versionText");



        updatedValue.brandingSettingCodes = {
          ...(this.context.previewBranding?.attributes.brandingSettingCodes ||
            {}),
          ...updatedValue.brandingSettingCodes,
        };
        
        updatedValue = { ...this.context.previewBranding?.attributes || {}, ...updatedValue };
        this.context.previewBranding.set(updatedValue);
        if(themeUpdated == 'dark'){
          this.darkPreviewHeader?.options?.brandingConfig.trigger('change:branding');
        }else if((themeUpdated == 'light')){
          this.lightPreviewHeader?.options?.brandingConfig.trigger('change:branding');
        }else{
          this.darkPreviewHeader?.options?.brandingConfig.trigger('change:branding');
          this.lightPreviewHeader?.options?.brandingConfig.trigger('change:branding');
        }
        // // this flag is to determile any update in branding.
        this.context.previewBranding.set("isBrandingChangeTriggered", true);
        this.options.context.trigger('change');
        this.applyJatoPreviewBrandingStyleSheet(updatedValue);
        this.applyInvertColor(updatedValue);
      });
    },
    applyInvertColor: function(brandConfig){
      
      let themes = brandConfig.brandingSettingCodes.themes;
      for (theme in themes) {
        let themeObj = themes[theme];
        if(themeObj.isInvertIconColor !== undefined){
          let themeHeader = this.$el.find(`.pman-${theme}-header-container.pman-jato-header-container`), invertClass = 'csui-app-header-invert';
          themeObj.isInvertIconColor == true ?  themeHeader.addClass(invertClass) : themeHeader.removeClass(invertClass);
        }
      }
    },
    //No need for breadcrumb in JATO theme
    _initBreadcrumb: function () { },
    //below methods are used to load perspective in edit mode. As its not needed in this case, overriding them
    _prepareForEdit: function () { },
    _registerEventHandler: function () { },
    _onPmanRender: function () { },
    _getExistsWidgetTypes: function () { },
    _initializeWidgets: function () { },
    _savePerspective: function () { },
  })
  return BrandingView;
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
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <otc-icon class=\"csui-placeholder-jato-icon\" type=\"raw\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dndPlaceholderSVG") || (depth0 != null ? lookupProperty(depth0,"dndPlaceholderSVG") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dndPlaceholderSVG","hash":{},"loc":{"start":{"line":3,"column":65},"end":{"line":3,"column":86}}}) : helper)))
    + "\" ispresentation></otc-icon>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "    <div class=\"csui-placeholder-icon\"></div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-placeholder-title\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dndWidgetsHere") || (depth0 != null ? lookupProperty(depth0,"dndWidgetsHere") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dndWidgetsHere","hash":{},"loc":{"start":{"line":1,"column":43},"end":{"line":1,"column":61}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":2,"column":2},"end":{"line":6,"column":9}}})) != null ? stack1 : "")
    + "  <div>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dndWidgetsHere") || (depth0 != null ? lookupProperty(depth0,"dndWidgetsHere") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dndWidgetsHere","hash":{},"loc":{"start":{"line":7,"column":7},"end":{"line":7,"column":25}}}) : helper)))
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
  'smart/themes/theming',
  'csui/themes/csui.jato.mime.illustrations',
  'i18n!csui/perspective.manage/widgets/perspective.placeholder/impl/nls/lang',
  'hbs!csui/perspective.manage/widgets/perspective.placeholder/impl/perspective.placeholder',
  'css!csui/perspective.manage/widgets/perspective.placeholder/impl/perspective.placeholder'
], function (_, Backbone, Marionette, theming, jatoMimeIllustrations, lang, template) {
  var PerspectivePlaceholderView = Marionette.ItemView.extend({
    className: 'csui-perspective-placeholder',
    template: template,
    templateHelpers: function () {
      return {
        isJATO: theming.isJATOTheme(),
        dndWidgetsHere: this.options.widgetContainer && this.options.widgetContainer.options.grid.allowHTMLTilesOnly ?
                          lang.dndHTMLWidgetsHere : lang.dndWidgetsHere,
        dndPlaceholderSVG: jatoMimeIllustrations.illustrationsDragDropSmall
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
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <otc-icon class=\"csui-pman-widget-jato-icon\" type=\"raw\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"configureWidgetPaceholderSVG") || (depth0 != null ? lookupProperty(depth0,"configureWidgetPaceholderSVG") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"configureWidgetPaceholderSVG","hash":{},"loc":{"start":{"line":9,"column":65},"end":{"line":9,"column":97}}}) : helper)))
    + "\" ispresentation></otc-icon>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "    <div class=\"csui-pman-widget-icon\"></div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
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
    + "\" class=\"csui-pman-widget-msg\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJATO") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":8,"column":2},"end":{"line":12,"column":9}}})) != null ? stack1 : "")
    + "    <div>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetMessage") || (depth0 != null ? lookupProperty(depth0,"widgetMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetMessage","hash":{},"loc":{"start":{"line":13,"column":9},"end":{"line":13,"column":26}}}) : helper)))
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
  'smart/themes/theming',
  'csui/themes/csui.jato.mime.illustrations',
  'i18n!csui/perspective.manage/widgets/perspective.widget/impl/nls/lang',
  'hbs!csui/perspective.manage/widgets/perspective.widget/impl/perspective.widget',
  'css!csui/perspective.manage/widgets/perspective.widget/impl/perspective.widget'
], function (_, Backbone, Marionette, theming, jatoMimeIllustrations, lang, template) {
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
        widgetMessage: noConfig ? lang.noConfig : lang.clickToConfig,
        isJATO: theming.isJATOTheme(),
        configureWidgetPaceholderSVG: jatoMimeIllustrations.illustrationsConfigureWidgetSmall,
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
    'csui/perspective.manage/landing.page.pman.view',
    'csui/perspective.manage/branding.view',
    'csui/perspective.manage/jato/branding.view',
    'csui/perspective.manage/settings.panel/settings.panel.view',
    'csui/perspective.manage/jato/settings.panel/settings.panel.view',
    'csui/perspective.manage/behaviours/pman.widget.config.behaviour',
    'csui/perspective.manage/widgets/perspective.placeholder/perspective.placeholder.view',
    'csui/perspective.manage/widgets/perspective.widget/perspective.widget.view',
    'csui/perspective.manage/settings.panel/settings/icons.setting/icons.setting.view',
    'csui/perspective.manage/settings.panel/settings/icon.settings',
    
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