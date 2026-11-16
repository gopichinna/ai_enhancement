// Expands the limited view by showing the full one in a modal dialog
csui.define('csui/behaviors/expanding/expanding.behavior',['require', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/marionette'
], function (require, _, Backbone, Marionette) {

  var ExpandingBehavior = Marionette.Behavior.extend({

    constructor: function ExpandingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      // The perspective begins to change with an animation before the
      // previous one is destroyed; the expanded view should be hidden
      // previous one is.
      var destroyWithAnimation = _.bind(this._destroyExpandedView, this, false),
          destroyImmediately   = _.bind(this._destroyExpandedView, this, true),
          context              = view.options && view.options.context;
      this.boundHistoryBack = _.bind(this.historyBack, this);
      this.listenTo(this, 'before:destroy', destroyWithAnimation);
      if (context) {
        // The hiding animation finishes before the context is fetched
        // and the page is re-rendered.  If it becomes problem, use
        // destroyImmediately here.
        this.listenTo(context, 'request', destroyWithAnimation)
            .listenTo(context, 'request:perspective', destroyWithAnimation);
      }
    },

    onExpand: function () {
      // If the expanding event is triggered multiple times, it should be
      // handled just once by showing the expanded view; it is likely, that
      // the expanding button was clicked quickly twice
      if (this.expanded) {
        return;
      }
      // Do not use the later initialized this.dialog property; loading
      // the modules with the expanded view below may take some time.
      this.expanded = true;

      var self = this;
      // TODO: remove completeCollection and limiting behavior.  Both
      // client- and server-side browsable collections should provide
      // the same interface and use the according mixins.
      var collection = this.view.completeCollection ?
                       this.view.completeCollection.clone() :
                       this.view.collection.clone();

      // pass filter from the collapsed tile to the expanded table
      if (this.view.currentFilter !== undefined) {
        collection.setFilter(this.view.currentFilter, {fetch: false});
      }
      // close and clear the filter in the collapsed tile
      this.view.isSearchOpen() && this.view.searchClicked();

      var expandedViewValue = self.getOption('expandedView');
      var expandedViewClass = expandedViewValue;
      if (_.isString(expandedViewValue) !== true) {
        expandedViewClass = expandedViewValue.prototype instanceof Backbone.View ?
                            expandedViewValue :
                            expandedViewValue.call(self.view);
      }
      var requiredModules = ['csui/controls/dialog/dialog.view'];
      if (_.isString(expandedViewClass)) {
        requiredModules.push(expandedViewClass);
      }
      require(requiredModules, function (DialogView) {
        if (_.isString(expandedViewClass)) {
          expandedViewClass = arguments[1];
        }
        var expandedViewOptions = getOption(self.options, 'expandedViewOptions', self.view);
        self.expandedView = new expandedViewClass(_.extend({
          context: self.view.options.context,
          collection: collection,
          orderBy: getOption(self.options, 'orderBy', self.view),
          filterBy: self.view.currentFilter,
          limited: false,
          isExpandedView: true
        }, expandedViewOptions));
        // todo: remove old icon* attributes (without 'Name' in name) when SmartUI has been
        //  migrated completely to icons-v2
        self.dialog = new DialogView({
          iconLeft: getOption(self.options, 'titleBarIcon', self.view) ||
                    getOption(self.view.options, 'titleBarIcon', self.view),
          iconNameLeft: getOption(self.options, 'titleBarIconName', self.view) ||
                    getOption(self.view.options, 'titleBarIconName', self.view),
          actionIconLeft: getOption(self.options, 'actionTitleBarIcon', self.view) ||
                          getOption(self.view.options, 'actionTitleBarIcon', self.view),
          actionIconNameLeft: getOption(self.options, 'actionTitleBarIconName', self.view) ||
                          getOption(self.view.options, 'actionTitleBarIconName', self.view),
          imageLeftUrl: getOption(self.options, 'titleBarImageUrl', self.view),
          imageLeftClass: getOption(self.options, 'titleBarImageClass', self.view),
          title: getOption(self.options, 'dialogTitle', self.view),
          iconRight: getOption(self.options, 'dialogTitleIconRight', self.view),  // legacy
          iconNameRight: getOption(self.options, 'dialogTitleIconNameRight', self.view),
          className: getClassName(self.options, 'dialogClassName', self.view),
          largeSize: true,
          view: self.expandedView,
          headerView: getOption(self.options, 'headerView', self.view),
          notabablesBehavior: getOption(self.options, 'notabablesBehavior', self.view),
        });
        //bind history back event
        self.bindHistoryBack();
        self.listenTo(self.dialog, 'before:hide', self._expandOtherView)
            .listenTo(self.dialog, 'destroy', self._enableExpandingAgain);
        self._expandOtherView(false);
        self.dialog.show();
      }, function (error) {
        // If the module from the csui base cannot be loaded, something is so
        // rotten, that it does not make sense trying to load other module to
        // show the error message.
        // There will be more information on the browser console.
        self.expanded = false;
      });
    },
    
    bindHistoryBack: function(){
      window.addEventListener('popstate', this.boundHistoryBack);
    },
    historyBack:function(e) {
      if(this.dialog){
        this.dialog.destroy();
      }
    },

    _destroyExpandedView: function (immediately) {
      if (this.dialog) {
        var method = immediately ? 'kill' : 'destroy';
        this.dialog[method]();
        this.dialog = undefined;
        window.removeEventListener('popstate', this.boundHistoryBack);
      }
    },

    _expandOtherView: function (expand) {
      this.options.collapsedView && this.options.collapsedView.triggerMethod(
          expand === false ? 'go:away' : 'go:back');
    },

    _enableExpandingAgain: function () {
      this.expanded = false;
      if (this.view.tabableRegionBehavior) {
        var navigationBehavior = this.view.tabableRegionBehavior,
            targetElement      = this.view.ui.tileExpand;
        navigationBehavior.currentlyFocusedElement &&
        navigationBehavior.currentlyFocusedElement.prop('tabindex', -1);
        targetElement && targetElement.prop('tabindex', 0);
        targetElement.trigger('focus');
        navigationBehavior.setInitialTabIndex();
        this.view.currentTabPosition = 2;
      }
    }

  });

  // TODO: Expose this functionality and make it generic for functiona objects too.
  function getOption(object, property, context) {
    if (object == null) {
      return void 0;
    }
    var value = object[property];
    return _.isFunction(value) ? object[property].call(context) : value;
  }

  function getClassName(options, property, context) {
    var className = getOption(options, property, context);
    if (className) {
      className += ' csui-expanded';
    } else {
      className = 'csui-expanded';
    }
    return className;
  }

  return ExpandingBehavior;

});


csui.define('csui/behaviors/item.error/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/behaviors/item.error/impl/nls/root/lang',{
  itemCannotBeAccessed : 'Item cannot be accessed.'
});




csui.define('csui/behaviors/item.error/item.error.behavior',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/error/error.view',
  'i18n!csui/behaviors/item.error/impl/nls/lang',
  'csui/lib/binf/js/binf'
], function (_, Backbone, Marionette, ErrorView, lang) {
  'use strict';

  var ItemErrorBehavior = Marionette.Behavior.extend({

    constructor: function ItemErrorBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      this.view = view;

      // Behaviors are created before the model is stored in the view
      var model = getBehaviorOption.call(this, 'model') ||
                  view.model || view.options.model;
      this._setupErrorHandling(model);

      var errorView = this.getOption('errorView');
      if (_.isFunction(errorView) &&
          !(errorView.prototype instanceof Backbone.View)) {
        errorView = errorView.call(view);
      }
      errorView || (errorView = ErrorView);

      // Disable the view's template and content, if fetching the model
      // failed and the error should not be placed in part of the view
      var getTemplate = view.getTemplate,
          self        = this;
      view.getTemplate = function () {
        if (this.model && this.model.error) {
          // A string selector would point to a part of the view's content
          // rendered using the view's template
          var el = getBehaviorOption.call(self, 'el');
          if (typeof el !== 'string') {
            if (!getBehaviorOption.call(self, 'region')) {
              return false;
            }
          }
        }
        return getTemplate.apply(view, arguments);
      };

      var errorRegion;
      this.listenTo(view, 'render', function () {
        // Render an inner error control, if fetching the data failed
        var error = this.model && this.model.error;
        if (error) {
          if (errorRegion) {
            errorRegion.empty();
          }
          errorRegion = getBehaviorOption.call(this, 'region');
          if (!errorRegion) {
            var el = getBehaviorOption.call(this, 'el') || view.el;
            if (typeof el === 'string') {
              el = view.$(el);
            }
            errorRegion = new Marionette.Region({el: el});
          }
          errorRegion.show(new errorView(
              _.extend({
                model: new Backbone.Model({
                  message: lang.itemCannotBeAccessed,
                  title: error.message
                })
              }, getBehaviorOption.call(this, 'errorViewOptions'))
          ));
        }
      })
          .listenTo(view, 'before:destroy', function () {
            // Destroy the inner error control
            if (errorRegion) {
              errorRegion.empty();
            }
          })
          .listenTo(view, 'update:model', this._setupErrorHandling);
    },

    _setupErrorHandling: function (model) {
      this.model && this.stopListening(this.model);
      this.model = model;
      this.listenTo(this.model, 'error', function () {
        // Re-render the view, if fetching the data failed
        this.view.render();
      });
    }

  });

  function getBehaviorOption(property) {
    var value = this.getOption(property);
    return (_.isFunction(value) ? value.call(this.view) : value);
  }

  return ItemErrorBehavior;
});


/* START_TEMPLATE */
csui.define('hbs!csui/behaviors/item.state/impl/item.state',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":11}}}) : helper)))
    + "\n";
}});
Handlebars.registerPartial('csui_behaviors_item.state_impl_item.state', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/behaviors/item.state/item.state.view',[
  'csui/lib/underscore', 'csui/lib/marionette',
  'hbs!csui/behaviors/item.state/impl/item.state'
], function (_, Marionette, template) {
  'use strict';

  var ItemStateView = Marionette.ItemView.extend({

    className: 'csui-item-state',

    template: template,

    constructor: function ItemStateView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, 'change:state', this.render)
          .listenTo(this, 'render', this._updateClasses);
    },

    serializeData: function () {
      return _.extend(this.model.toJSON(), {
        // empty, loading, failed
        message: this.options.stateMessages[this.model.get('state')]
      });
    },

    _updateClasses: function () {
      this.$el
          .removeClass('csui-state-loading csui-state-failed')
          .addClass('csui-state-' + this.model.get('state'));
    }

  });

  return ItemStateView;
});


csui.define('csui/behaviors/item.state/item.state.behavior',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/behaviors/item.state/item.state.view'
], function (_, Backbone, Marionette, ItemStateView) {
  'use strict';

  var ItemStateBehavior = Marionette.Behavior.extend({

    constructor: function ItemStateBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      this.view = view;

      // Behaviors are created before the model is stored in the view
      var model = getBehaviorOption.call(this, 'model') ||
                  view.model || view.options.model;
      this.listenTo(model, 'request', this._fetchingCollectionStarted)
          .listenTo(model, 'sync', this._fetchingCollectionSucceeded)
          .listenTo(model, 'error', this._fetchingCollectionFailed);

      this.itemState = new Backbone.Model({
        state: model.fetching ? 'loading' :
               model.error ? 'failed' : 'loaded'
      });

      var stateView = this.getOption('stateView');
      if (_.isFunction(stateView) &&
          !(stateView.prototype instanceof Backbone.View)) {
        stateView = stateView.call(view);
      }
      this.stateView = stateView || ItemStateView;

      // Disable the view's template and content, if fetching the model
      // failed and the error should not be placed in part of the view
      var getTemplate = view.getTemplate,
          self = this;
      view.getTemplate = function () {
        if (!model.fetched) {
          // A string selector would point to a part of the view's content
          // rendered using the view's template
          var el = getBehaviorOption.call(self, 'el');
          if (typeof el !== 'string') {
            if (!getBehaviorOption.call(self, 'region')) {
              return false;
            }
          }
        }
        return getTemplate.apply(view, arguments);
      };

      var stateRegion;
      this.listenTo(view, 'render', function () {
            if (!model.fetched) {
              if (stateRegion) {
                stateRegion.empty();
              }
              stateRegion = getBehaviorOption.call(this, 'region');
              if (!stateRegion) {
                var el = getBehaviorOption.call(this, 'el') || view.el;
                if (typeof el === 'string') {
                  el = view.$(el);
                }
                stateRegion = new Marionette.Region({el: el});
              }
              stateRegion.show(new this.stateView(
                  _.extend({
                    model: this.itemState,
                    stateMessages: getBehaviorOption.call(this, 'stateMessages') || {}
                  }, getBehaviorOption.call(this, 'stateViewOptions'))
              ));
            }
          })
          .listenTo(view, 'before:destroy', function () {
            // Destroy the inner error control
            if (stateRegion) {
              stateRegion.empty();
            }
          });
    },

    _fetchingCollectionStarted: function () {
      this.itemState.set('state', 'loading');
      this.view.render();
      this.view.blockWithoutIndicator && this.view.blockWithoutIndicator();
    },

    _fetchingCollectionSucceeded: function (model) {
      this.itemState.set('state', 'loaded');
      this.view.unblockActions && this.view.unblockActions();
    },

    _fetchingCollectionFailed: function () {
      this.itemState.set('state', 'failed');
      this.view.unblockActions && this.view.unblockActions();
    }

  });

  function getBehaviorOption(property) {
    var value = this.getOption(property);
    return (_.isFunction(value) ? value.call(this.view) : value);
  }

  return ItemStateBehavior;
});


// Limits the rendered collection length with a More link to expand it
csui.define('csui/behaviors/limiting/limiting.behavior',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette'
], function (_, Backbone, Marionette) {
  "use strict";

  var LimitingBehavior = Marionette.Behavior.extend({
    defaults: {
      limit: 6,
      filterByProperty: 'name'
    },

    collectionEvents: {'reset': 'enableMoreLink'},

    events: {
      'click .cs-more': 'onMoreLinkClick',
      'click .tile-expand': 'onMoreLinkClick',
    },

    ui: {moreLink: '.cs-more'},

    constructor: function LimitingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
    },

    // Initialize is called after the constructor of the parent view, which
    // assigns the collection and which we need here.  The collection
    // assignment cannot be delayed till the before:render is triggered.
    initialize: function (options, view) {
      if (view.options.limited !== false) {
        var completeCollection = view.collection,
            completeCollectionOptions;
        if (!completeCollection) {
          completeCollection = this.getOption('completeCollection');
          if (!(completeCollection instanceof Backbone.Collection)) {
            completeCollectionOptions = this.getOption('completeCollectionOptions');
            if (completeCollection.prototype instanceof Backbone.Collection) {
              completeCollection = new completeCollection(undefined, completeCollectionOptions);
            } else {
              completeCollection = completeCollection.call(view);
              if (!(completeCollection instanceof Backbone.Collection)) {
                completeCollection = new completeCollection(undefined, completeCollectionOptions);
              }
            }
          }
        }
        if (view.options.orderBy) {
          completeCollection.setOrder(view.options.orderBy, false);
        }

        this.listenTo(completeCollection, 'add', this._addItem)
            .listenTo(completeCollection, 'remove', this._removeItem)
            .listenTo(completeCollection, 'reset', this.enableMoreLink)
            .listenTo(completeCollection, 'sync', function (object) {
              if (object instanceof Backbone.Collection) {
                this.synchronizeCollections();
              }
            });
        view.completeCollection = completeCollection;
        var ViewCollection = Backbone.Collection.extend(
            completeCollection ? {model: completeCollection.model} : {}
        );
        view.collection = new ViewCollection();
        this.synchronizeCollections();
        this.listenTo(view, 'change:filterValue', this.synchronizeCollections);
      }
    },

    synchronizeCollections: function () {
      // no need to synchronize if collections are one and the same object.
      if (this.view.collection===this.view.completeCollection) {
        return;
      }
      var models;
      // search has value
      if (this.view.options.filterValue && this.view.options.filterValue.length > 0) {
        var keywords = this.view.options.filterValue.toLowerCase().split(' ');
        var filterByProperty = getOption(this.options, 'filterByProperty', this.view);

        this.view.currentFilter = {};
        this.view.currentFilter[filterByProperty] = this.view.options.filterValue.toLowerCase();

        models = this.view.completeCollection.filter(function (item) {
          var name = item.get(filterByProperty),
              isMatch;
          if (name) {
            // FIXME: Apply collation rules
            name = name.trim().toLowerCase();
            isMatch = _.reduce(keywords, function (result, keyword) {
              return result && name.indexOf(keyword) >= 0;
            }, true);
          }
          return isMatch;
        });
      } else {
        // no filtering
        this.view.currentFilter = undefined;
        models = this.view.completeCollection.models;
      }
      this.view.collection.reset(models);
    },

    enableMoreLink: function () {
      var limit  = getOption(this.options, 'limit', this.view),
          enable = this.view.completeCollection &&
                   this.view.completeCollection.length > limit;
      if (this.ui.moreLink instanceof Object) {
        this.ui.moreLink[enable ? 'removeClass' : 'addClass']('binf-hidden');
      }
    },

    onMoreLinkClick: function (event) {
      event.preventDefault();
      event.stopPropagation();
      // TODO this is actually required to make the expanding behaviour work!?
      this.view.triggerMethod('expand');
    },

    _addItem: function (model) {
      var index = this.view.completeCollection.indexOf(model);
      this.view.collection.add(model, { at: index });
    },

    _removeItem: function (model) {
      this.view.collection.remove(model);
    }
  });

  // TODO: Expose this functionality and make it generic for functional objects too.
  function getOption(object, property, context) {
    if (object == null) {
      return void 0;
    }
    var value = object[property];
    return _.isFunction(value) ? object[property].call(context) : value;
  }

  return LimitingBehavior;
});


csui.define('css!csui/behaviors/resizable/resizable',[],function(){});

csui.define('csui/behaviors/resizable/resizable.behavior',['csui/lib/marionette',  'module', 'i18n',
  'css!csui/behaviors/resizable/resizable'
], function (Marionette, module, i18n) {
  let config = module.config();
  config = { ...config, ...config?.csui };
  var ResizableBehavior = Marionette.Behavior.extend({
    constructor: function ResizableBehavior(options = {}, view) {
      if (!config.enablePanelResize) return;
        this.listenTo(view,{'dynamicDomLoaded':this.initializeResizeBehaviour});
        this.options = options;
    },
    initializeResizeBehaviour:function(element, view){
      const parent = element.parent();
      parent[0]?.classList.add('csui-resizable');
      element.resizable({
        'minWidth': this.options?.minWidth ? Math.max(this.options.minWidth , 240) : 248,
        'maxWidth': "50%",
        handles: i18n.settings.rtl ? 'w' : 'e',
        start: function (/*event, ui*/) {
          element[0]?.classList.add('csui-no-transition');
        },
        stop: function (/*event, ui*/) {
          element[0]?.classList.remove('csui-no-transition');
          view.triggerMethod('dom:refresh');
        }
      });
    }
  });
  ResizableBehavior.config = config;
  return ResizableBehavior;

});



/* START_TEMPLATE */
csui.define('hbs!csui/controls/tile/behaviors/impl/expanding.behavior',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"cs-more tile-expand\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"expandIconTitle") || (depth0 != null ? lookupProperty(depth0,"expandIconTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"expandIconTitle","hash":{},"loc":{"start":{"line":1,"column":40},"end":{"line":1,"column":59}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"expandIconAria") || (depth0 != null ? lookupProperty(depth0,"expandIconAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"expandIconAria","hash":{},"loc":{"start":{"line":1,"column":73},"end":{"line":1,"column":91}}}) : helper)))
    + "\"\n     role=\"button\">\n  "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"states":"true","iconName":"csui_action_expand32"},"loc":{"start":{"line":3,"column":2},"end":{"line":3,"column":61}}})) != null ? stack1 : "")
    + "\n</div>\n";
}});
Handlebars.registerPartial('csui_controls_tile_behaviors_impl_expanding.behavior', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/tile/behaviors/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/controls/tile/behaviors/impl/nls/root/lang',{
  expandIconTooltip: 'Expand',
  expandIconAria: 'Expand {0} widget'

});




csui.define('csui/controls/tile/behaviors/expanding.behavior',['require', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/marionette',
  'hbs!csui/controls/tile/behaviors/impl/expanding.behavior',
  'i18n!csui/controls/tile/behaviors/impl/nls/lang',
  'csui/controls/icons.v2'
], function (require, _, Backbone, Marionette, template, lang, iconRegistry) {
  "use strict";

  var ExpandingBehavior = Marionette.Behavior.extend({

    defaults: {
      expandButton: '.tile-footer'
    },

    triggers: {
      'click .cs-more': 'expand',
      'click .tile-header': 'expand'
    },

    lastActiveElm: [],
    constructor: function ExpandingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.listenTo(view, 'render', this._renderExpandButton);
      this.listenTo(view, 'expand', this._expand);
      // The perspective begins to change with an animation before the
      // previous one is destroyed; the expanded view should be hidden
      // previous one is.
      var destroyWithAnimation = _.bind(this._destroyExpandedView, this, false),
          destroyImmediately = _.bind(this._destroyExpandedView, this, true),
          context = view.options && view.options.context;
      this.listenTo(this, 'before:destroy', destroyWithAnimation);
      if (context) {
        // The hiding animation finishes before the context is fetched
        // and the page is re-rendered.  If it becomes problem, use
        // destroyImmediately here.
        this.listenTo(context, 'request', destroyWithAnimation)
            .listenTo(context, 'request:perspective', destroyWithAnimation);
      }
    },

    _renderExpandButton: function () {
      var expandButtonSelector = getOption.call(this, 'expandButton'),
          expandButton = this.view.$(expandButtonSelector),
          iconTitle = getOption.call(this, 'expandIconTitle'),
          expandIconTitle = iconTitle ? iconTitle : lang.expandIconTooltip,
          dialogTitle = getOption.call(this, 'dialogTitle'),
          iconAria = getOption.call(this, 'expandIconAria'),
          expandIconAria = iconAria ? iconAria : _.str.sformat(lang.expandIconAria, dialogTitle),
          data = {
            expandIconTitle: expandIconTitle,
            expandIconAria: expandIconAria
          };
      expandButton.html(template(data));
    },

    _expand: function () {
      if (this.expanded || (this.view && !!this.view.errorExists)) {
        return;
      }
      this.expanded = true;
      this.lastActiveElm.push(document.activeElement);
      var expandedViewValue = this.getOption('expandedView'),
          expandedViewClass = expandedViewValue.prototype instanceof Backbone.View ?
                              expandedViewValue : expandedViewValue.call(this.view),
          requiredModules = ['csui/controls/dialog/dialog.view'],
          self = this;
      if (_.isString(expandedViewClass)) {
        requiredModules.push(expandedViewClass);
      }
      require(requiredModules, function (DialogView) {
        if (_.isString(expandedViewClass)) {
          expandedViewClass = arguments[1];
        }
        var expandedViewOptions = getOption.call(self, 'expandedViewOptions'),
            expandedView = new expandedViewClass(expandedViewOptions);
        self._dialog = new DialogView({
          iconLeft: getOption.call(self, 'titleBarIcon'),
          imageLeftUrl: getOption.call(self, 'titleBarImageUrl'),
          imageLeftClass: getOption.call(self, 'titleBarImageClass'),
          title: getOption.call(self, 'dialogTitle'),
          iconRight: getOption.call(self, 'dialogTitleIconRight'),
          className: 'cs-expanded ' + (getOption.call(self, 'dialogClassName') || ''),
          largeSize: true,
          view: expandedView
        });
        self.listenTo(self._dialog, 'hide', function () {
          self.triggerMethod('collapse');
        }).listenTo(self._dialog, 'destroy', self._enableExpandingAgain);
        self._dialog.show();
      });
    },

    _enableExpandingAgain: function () {
      this.expanded = false;
      const lastActiveElm = this.lastActiveElm.length>0 && this.lastActiveElm.pop();
      lastActiveElm?.focus();
    },

    _destroyExpandedView: function () {
      if (this._dialog) {
        this._dialog.destroy();
        this._dialog = undefined;
      }
    }

  });

  // TODO: Expose this functionality and make it generic for other behaviors
  function getOption(property) {
    var options = this.options || {};
    var value = options[property];
    return _.isFunction(value) ? options[property].call(this.view) : value;
  }

  return ExpandingBehavior;

});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/tile/impl/tile',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"tile-type-icon\">\n      <span class=\"icon title-icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"icon") || (depth0 != null ? lookupProperty(depth0,"icon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon","hash":{},"loc":{"start":{"line":5,"column":35},"end":{"line":5,"column":43}}}) : helper)))
    + "\" aria-hidden=\"true\"></span>\n    </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"imageUrl") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"loc":{"start":{"line":8,"column":4},"end":{"line":12,"column":11}}})) != null ? stack1 : "");
},"4":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"tile-type-image "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imageClass") || (depth0 != null ? lookupProperty(depth0,"imageClass") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imageClass","hash":{},"loc":{"start":{"line":9,"column":34},"end":{"line":9,"column":48}}}) : helper)))
    + "\">\n        <span class=\"tile-type-icon tile-type-icon-img\"><img src=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imageUrl") || (depth0 != null ? lookupProperty(depth0,"imageUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imageUrl","hash":{},"loc":{"start":{"line":10,"column":66},"end":{"line":10,"column":78}}}) : helper)))
    + "\" alt=\"\" aria-hidden=\"true\"></span>\n      </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"tile-header\">\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"icon") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":3,"column":2},"end":{"line":13,"column":9}}})) != null ? stack1 : "")
    + "\n  <div class=\"tile-title\" >\n    <h2 class=\"csui-heading\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":16,"column":29},"end":{"line":16,"column":38}}}) : helper)))
    + "</h2>\n  </div>\n\n  <div class=\"tile-controls\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":19,"column":36},"end":{"line":19,"column":45}}}) : helper)))
    + "\"></div>\n\n</div>\n\n<div class=\"tile-content\"></div>\n\n<div class=\"tile-footer\"></div>\n";
}});
Handlebars.registerPartial('csui_controls_tile_impl_tile', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/controls/tile/impl/tile',[],function(){});

csui.define('csui/controls/tile/tile.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'hbs!csui/controls/tile/impl/tile',
  /* FIXME: Merge this with the list control */
  'css!csui/controls/list/impl/list',
  'css!csui/controls/tile/impl/tile'
], function (_, $, Backbone, Marionette, ViewEventsPropagationMixin, template) {

  var TileView = Marionette.LayoutView.extend({

    className: 'cs-tile cs-list tile content-tile initialLoading',

    template: template,

    regions: {
      headerControls: '.tile-controls',
      content: '.tile-content',
      footer: '.tile-footer'
    },

    ui: {
      footer: '.tile-footer',
      headerControls: '.tile-controls'
    },

    constructor: function TileView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, 'render', this._renderContentView);
      this.listenToOnce(this.collection, "sync", function () {
        this.$el.removeClass("initialLoading");
      });
      this.listenToOnce(this.collection, "error", _.bind(this.handleError, this));
      this.listenToOnce(this.model, "error", _.bind(this.handleError, this));
    },

    /**
     * The handleError method provides default error handling for tile.view.
     * Can be overridden in custom tiles for different error handling.
     */

    handleError: function () {
      this.errorExists = true;
      this.ui.headerControls.addClass('binf-hidden');
      this.ui.footer.addClass('binf-hidden');
    },

    serializeData: function () {
      return _.reduce(['icon', 'imageUrl', 'imageClass', 'title'],
          function (result, property) {
            result[property] = getOption.call(this, property);
            return result;
          }, {}, this);
    },

    _renderContentView: function () {
      var ContentView = getOption.call(this, 'contentView');
      if (!ContentView) {
        throw new Marionette.Error({
          name: 'NoContentViewError',
          message: 'A "contentView" must be specified'
        });
      }
      var contentViewOptions = getOption.call(this, 'contentViewOptions');
      this.contentView = new ContentView(contentViewOptions);
      this.propagateEventsToViews(this.contentView);
      this.content.show(this.contentView);
    }

  });

  _.extend(TileView.prototype, ViewEventsPropagationMixin);

  // TODO: Expose this functionality and make it generic for other views too
  function getOption(property, source) {
    var value;
    if (source) {
      value = source[property];
    } else {
      value = getOption.call(this, property, this.options || {});
      if (value === undefined) {
        value = this[property];
      }
    }
    return _.isFunction(value) && !(value.prototype instanceof Backbone.View) ?
           value.call(this) : value;
  }

  return TileView;

});


csui.define('csui/controls/iconpreload/icon.preload.view',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/non-emptying.region/non-emptying.region', 'csui/lib/binf/js/binf'
], function (module, _, $, Marionette, NonEmptyingRegion) {
  'use strict';

  var iconClasses = module.config().iconClasses || {};
  iconClasses = Array.prototype.concat.apply([], _.values(iconClasses));

  var IconPreloadView = Marionette.ItemView.extend({
    id: 'csui-icon-preload',
    template: false,

    onRender: function () {
      this._preloadIcons();
    },

    constructor: function IconPreloadView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    _preloadIcons: function () {
      _.each(iconClasses, function (icon) {
        this.$el.append('<span class="csui-icon ' + icon +
                        '" style="position:fixed;top:-100px;left:-100px;"></span>');
      }, this);
    }
  });

  IconPreloadView.ensureOnThePage = function () {
    //if (base.isIE11()) {
      if (!$("#csui-icon-preload").length) {
        var iconPreloadView = new IconPreloadView(),
            binfContainer   = $.fn.binf_modal.getDefaultContainer(),
            region          = new NonEmptyingRegion({el: binfContainer});
        region.show(iconPreloadView);
      }
    //}
  };

  return IconPreloadView;
});

csui.define('csui/widgets/html.editor/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/html.editor/impl/nls/root/lang',{
  ConfirmQuestionMessage: 'Are you sure to leave this page?',
  ConfirmQuestionTitle: 'Cancel edits?',
  CancelConfirmMessage: 'Are you sure you want to cancel?',
  cancelTitle: "Cancel",
  cancelAria: "Cancel edit",
  saveTitle: "Save",
  saveAria: "Save contents",
  okTitle: "OK",
  sourceDialogTitle: "Source",
  moreActionsAria: "{0} actions menu",
  PageDefaultContent: 'your content goes here',
  noWikiPageFound: 'Item cannot be accessed.',
  RestoreDialogMessage: "You have unsaved changes. Do you want to restore changes and continue" +
                        " editing?",
  RestoreDiaglogTitle: "Restore changes",
  reservedBy: 'Reserved by {0}\n{1}',
  more: 'more',
  properties: 'Properties',
  permissions: 'View permissions',
  Edit: 'Edit',
  unreserve: 'Unreserve',
  Continue: 'Continue',
  Discard: 'Discard',
  Yes: 'Yes',
  No: 'No',
  insertContentServerLink: 'Insert Content Management Link',
  openCodeView: 'Source',
  contentServerLink: 'Content Management Link',
  versionDifferenceConfirmMessage: 'Another user has saved an alternate version of this' +
                                   ' page. Do you still want to add a new version?',
  versionDifferenceConfirmTitle: 'Intermediate version added',
  brokenLinkMessage: "Sorry, the item you requested could not be accessed. Either it does not" +
                     " exist, or you do not have permission to access it. If you were sent a" +
                     " link to this item, please contact the sender for assistance.",
  goToTooltip: "go to {0}",
  previewUnavailable: "Preview Unavailable",
  cannotFindObject: "Cannot find object"
});



csui.define('csui/controls/rich.text.editor/impl/rich.text.util',["csui/lib/underscore", "csui/lib/jquery", "csui/utils/url", 'csui/models/node/node.model',
  'csui/utils/base', 'csui/utils/commands', 'i18n!csui/widgets/html.editor/impl/nls/lang',
  'csui/utils/log'
], function (_, $, Url, NodeModel, base, commands, lang, log) {

  var RichTextEditorUtils = {
    isEmptyContentElement: function (el) {
      return $.trim($(el).text());
    },

    checkDomain: function (view, event) {

      var domainUrl = view.connector.connection.url,
          link      = event.target.href;
      //checks the similarity of links after the domain name.
      view.options.isSameDomain = link.search(new RegExp(domainUrl.split('/api')[0], 'i')) !== -1;
      return view.options.isSameDomain;
    },

    getUrl: function (view, event) {
      var deferred = $.Deferred();
      if (!!event.target.href) {
        var smartLink    = event.target.href.match(/^.*\/app\/(.+)$/i),
            absolute     = new Url(event.target.href).isAbsolute(),
            isSameDomain = absolute ? this.checkDomain(view, event) : true,
            wikiUrl      = event.target.href.match(/^.*\/wiki\/(.+)$/i),
            nodeUrl      = event.target.href.match(/^.*\/open\/(.+)$/i) ||
                           event.target.href.match(/^.*\/nodes\/(.+)$/i),
            objid        = event.target.href.match(/^.*objId\=(.+)$/i), id,
            self         = this;
        if (!smartLink && isSameDomain) { // classic urls of same domain
          if (wikiUrl || objid) { //  urls containing "wiki" or "objId" words
            self.renderLinks({
              event: event,
              connector: view.connector,
              callingViewInstance: view
            }).done(function () {
              deferred.resolve();
            });
          } else if (nodeUrl) { // classic url containing open or nodes of samedomain
            id = nodeUrl[1];
            this.updateLink(event, id);
            deferred.resolve();
          }
          else { // classic url of samedomain that doesnt contain  wiki or nodes or objid or not proper
            deferred.resolve();
          }
        } else {  // smart url or (or) and different domain url
          deferred.resolve();
        }

      }
      return deferred.promise();
    },

    renderLinks: function (args) {
      var node, deferred = $.Deferred();
      var target = !!args.event.target.href ? $(args.event.target) :
                   $(args.event.target).parents('a'),
          that   = args.callingViewInstance,
          self   = this;
      args.event.target = target[0];
      if (!!args.event.target.href.match(/^.*\/wiki\/[0-9]+\/(.+)$/i) ||
          !!args.event.target.href.match(/^.*\/wiki\/[0-9]+$/i)) {
        args.event.stopPropagation();
        args.event.preventDefault();
        if (!!args.event.target.href.match(/^.*\/wiki\/[0-9]+\/(.+)$/i)) {
          node = args.event.target.href.match(/^.*\/wiki\/(.+)\/(.+)$/i);
          node = parseInt(node[1]);
          self._getWikiPageId(args, node, args.event.target.href).done(function (res, node) {
            self.id = res;
            if (!!node) {
              self.updateLink(args.event, node.id);
            } else {
              log.info(lang.brokenLinkMessage);
            }
            deferred.resolve();
          });
        } else if (!!args.event.target.href.match(/^.*\/wiki\/[0-9]+$/i)) {
          node = args.event.target.href.match(/^.*\/wiki\/(.+)$/i);
          node = parseInt(node[1]);
          self.updateLink(args.event, node);
          deferred.resolve();
        }

      }
      else if (!!args.event.target.href.match(/^.*objId\=(.+)$/)) {
        args.event.stopPropagation();
        args.event.preventDefault();
        var objIdIndex = args.event.target.href.match(/^.*objId\=(.+)$/)[1];
        if (objIdIndex !== -1) {
          node = this.getNewNodeModel({
            attributes: {
              id: parseInt(objIdIndex)
            },
            connector: args.connector
          });
          self.updateLink(args.event, node.attributes.id);
        }
        deferred.resolve();
      }
      return deferred.promise();
    },

    getNewNodeModel: function (options) {
      return new NodeModel(options.attributes, {
        connector: options.connector,
        commands: commands.getAllSignatures(),
        fields: options.fields || {},
        expand: options.expand || {}
      });
    },

    updateLink: function (el, nodeId) {
      var cslinkPattern = /^.*\/(cs\.\w{3}|livelink\.\w{3}|llisapi\.\w{3}|llisapi|cs|livelink).*$/,
          id            = !!nodeId && nodeId,
          cslink        = el.target.href.match(cslinkPattern),
          newHref       = !!cslink && cslink.length && el.target.href.substring(0,
              el.target.href.indexOf("/".concat(cslink[1])) + "/".concat(cslink[1]).length);
      el.target.href = !!newHref && newHref.length ?
                       newHref.concat("/app/nodes/", id) : el.target.href;
    },

    _getWikiPageId: function (self, wikiId, targetHref) {
      var $wikiPageName  = decodeURIComponent(targetHref.substring(
          targetHref.lastIndexOf("/") + 1, targetHref.length)),
          dfd            = $.Deferred(),
          connector      = self.connector,
          collectOptions = {
            url: this._getWikiContainerUrl(self, wikiId),
            type: 'GET'
          };

      connector.makeAjaxCall(collectOptions).done(function (resp) {
        resp.targetWikiPageNode = resp.results.find(function (element) {
          if (element.name === $wikiPageName) {
            return element;
          }
        });
        if (!!resp.targetWikiPageNode && !!resp.targetWikiPageNode.id) {
          dfd.resolve(resp.targetWikiPageNode.id, resp.targetWikiPageNode);
        } else {
          dfd.resolve(-1);
        }
      }).fail(function (resp) {
        dfd.reject(resp);
      });
      return dfd.promise();
    },

    _getWikiContainerUrl: function (self, wikiContainerId) {
      return Url.combine(self.connector.getConnectionUrl().getApiBase('v2') , '/wiki/' + wikiContainerId +
             "/wikipages");
    },

    _getNicknameId: function (self, nickName) {
      var deferred       = $.Deferred(),
          collectOptions = {
            url: Url.combine(self.connector.getConnectionUrl().getApiBase('v2') ,
                 "/wiki/nickname/" + nickName + "?actions=open"),
            requestType: "nickname",
            view: this,
            type: "GET"
          };
      nickName && self.connector.makeAjaxCall(collectOptions).done(function (response) {
        deferred.resolve(response);
      }).fail(function(){
        deferred.reject();
      });
      return deferred.promise();
    }
  };
  return RichTextEditorUtils;

});


csui.define('css!csui/widgets/html.editor/impl/html.editor',[],function(){});

csui.define('csui/controls/rich.text.editor/rich.text.editor',['csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
      'csui/controls/rich.text.editor/impl/rich.text.util',
      'css!csui/widgets/html.editor/impl/html.editor'
    ],
    function ($, _, Backbone, RichTextEditorUtils) {
      'use strict';

      var getRichTextEditorUtils = function getRichTextEditorUtils() {
        return RichTextEditorUtils;
      };

      var isEmptyContent = function (content) {
        // as there are only three entermode in ckeditor DIV, P, BR. checking for them, along with the any empty spaces.
        return !!content &&
        content.html.get().trim().replace(/<\/div>|<div>|<\/p>|<p>|&nbsp;|<br \/>|\s/g, '');
      };

      return {
        getRichTextEditorUtils: getRichTextEditorUtils,
        isEmptyContent: isEmptyContent
      };
    });

/* START_TEMPLATE */
csui.define('hbs!csui/controls/selected.count/impl/selected.count',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-selected-counter-region\">\n  <button type=\"button\" class=\"binf-btn binf-btn-primary\"\n          aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedButtonAria") || (depth0 != null ? lookupProperty(depth0,"selectedButtonAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedButtonAria","hash":{},"loc":{"start":{"line":3,"column":22},"end":{"line":3,"column":44}}}) : helper)))
    + "\" aria-haspopup=\"true\"\n          title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedButtonTitle") || (depth0 != null ? lookupProperty(depth0,"selectedButtonTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedButtonTitle","hash":{},"loc":{"start":{"line":4,"column":17},"end":{"line":4,"column":40}}}) : helper)))
    + "\"><span\n      class=\"csui-selected-counter-label\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedLabel") || (depth0 != null ? lookupProperty(depth0,"selectedLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedLabel","hash":{},"loc":{"start":{"line":5,"column":42},"end":{"line":5,"column":59}}}) : helper)))
    + "</span><span\n      class=\"binf-badge binf-badge-light csui-selected-counter-value\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedCount") || (depth0 != null ? lookupProperty(depth0,"selectedCount") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedCount","hash":{},"loc":{"start":{"line":6,"column":70},"end":{"line":6,"column":87}}}) : helper)))
    + "</span>\n  </button>\n</div>\n<div class=\"csui-dropmenu-container binf-hidden\">\n  <span class=\"csui-selected-count-clearall binf-hidden\"><span\n      class=\"csui-selected-count-clearall-label\"\n      role=\"button\" tabindex=\"0\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"clearAllAria") || (depth0 != null ? lookupProperty(depth0,"clearAllAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"clearAllAria","hash":{},"loc":{"start":{"line":12,"column":45},"end":{"line":12,"column":61}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"clearAll") || (depth0 != null ? lookupProperty(depth0,"clearAll") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"clearAll","hash":{},"loc":{"start":{"line":12,"column":63},"end":{"line":12,"column":75}}}) : helper)))
    + "</span></span>\n\n  <ul class=\"csui-selected-items-dropdown csui-normal-scrolling\" role=\"menu\"></ul>\n</div>\n";
}});
Handlebars.registerPartial('csui_controls_selected.count_impl_selected.count', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/controls/selected.count/impl/selected.list.item',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<span class=\"csui-selected-list-item-icon csui-type-icon\"></span>\n<div class=\"csui-selected-list-item-name-wrapper\">\n    <span class=\"csui-selected-list-item-name\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":47},"end":{"line":3,"column":55}}}) : helper)))
    + "</span>\n  <span class=\"csui-icon formfield_clear csui-deselected-icon\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"clearItem") || (depth0 != null ? lookupProperty(depth0,"clearItem") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"clearItem","hash":{},"loc":{"start":{"line":4,"column":75},"end":{"line":4,"column":88}}}) : helper)))
    + "\"\n        title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"clearItem") || (depth0 != null ? lookupProperty(depth0,"clearItem") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"clearItem","hash":{},"loc":{"start":{"line":5,"column":15},"end":{"line":5,"column":28}}}) : helper)))
    + "\">\n  </span>\n</div>";
}});
Handlebars.registerPartial('csui_controls_selected.count_impl_selected.list.item', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/selected.count/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/controls/selected.count/impl/nls/root/lang',{
  clearAll: "Clear all",
  clearAllAria: "Clear all selections",
  selectedLabel: "Selected",
  selectedButtonTitle: "Selected {0}",
  selectedButtonAria: "Selected {0} items",
  unselectAria: "Unselect {0} {1}",// {0} - "name" {1} - "mime-type"
  clearItem: "Clear item",
  dialogTitle: "Clear all",
  dialogTemplate: "Do you want to clear your selection?",
  parentName: "/{0}"
});




csui.define('css!csui/controls/selected.count/impl/selected.count',[],function(){});

csui.define('csui/controls/selected.count/selected.count.view',[
  'module',
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/dialogs/modal.alert/modal.alert',
  "csui/utils/base",
  'nuc/utils/log',
  'hbs!csui/controls/selected.count/impl/selected.count',
  'hbs!csui/controls/selected.count/impl/selected.list.item',
  'i18n!csui/controls/selected.count/impl/nls/lang',
  'css!csui/controls/selected.count/impl/selected.count'
], function (module, _, $, Backbone, Marionette, NodeTypeIconView,
    TabableRegionBehavior, ModalAlert,
    base, log, selectedCountTemplate, selectedListItemTemplate, lang) {
  'use strict';
  log = log(module.id);
  log.deprecate('Selected count view "csui/controls/selected.count/selected.count.view" is deprecated, please migrate to selected.count.control.view.js "csui/controls/selected.count/selected.count.control.view"');
 
  var SelectedNodeItemView = Marionette.ItemView.extend({
    className: 'csui-selected-item',
    template: selectedListItemTemplate,
    tagName: 'li',
    events: {
      'keydown': 'onKeyInView'
    },

    modelEvents: {
      'change': 'onModelChange'
    },

    triggers: {
      'click .csui-deselected-icon': 'remove:selected:item'
    },

    templateHelpers: function () {
      return {
        name: this.options.model.get('name'),
        clearItem: lang.clearItem
      };
    },

    constructor: function SelectedNodeItemView(options) {
      this.model = options.model;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    onRender: function () {
      this._nodeIconView = new NodeTypeIconView({
        el: this.$('.csui-type-icon').get(0),
        node: this.model,
        size: 'contain'
      });
      this._nodeIconView.render();
      this.$el.attr('tabindex', "-1");
      this.$el.attr('role', 'menuitem');
      this.$el.attr('aria-label', _.str.sformat(lang.unselectAria, this.model.get('name'), this._nodeIconView.$el.attr('aria-label')));
    },

    onModelChange: function () {
      this.render();
    },

    onKeyInView: function (event) {
      this.trigger('keydown:item', event);
    }
  });

  var SelectedCountView = Marionette.CompositeView.extend({

    className: 'csui-selected-count',
    template: selectedCountTemplate,
    templateHelpers: function () {
      var selectedCount = this.collection && this.collection.length;
      return {
        selectedCount: selectedCount,
        clearAll: lang.clearAll,
        clearAllAria: lang.clearAllAria,
        selectedLabel: lang.selectedLabel,
        selectedButtonTitle: _.str.sformat(lang.selectedButtonTitle, selectedCount),
        selectedButtonAria: _.str.sformat(lang.selectedButtonAria, selectedCount),
      };
    },
    childViewContainer: ".csui-selected-items-dropdown",
    childView: SelectedNodeItemView,
    childEvents: {
      'remove:selected:item': 'onRemoveSelectedItem',
      'keydown:item': 'onKeydownItem'
    },

    ui: {
      selectedCountButton: '.csui-selected-counter-region button',
      selectedCountValue: '.csui-selected-counter-region .csui-selected-counter-value',
      dropdownContainer: '.csui-dropmenu-container',
      clearAll: '.csui-selected-count-clearall',
      ClearAllButton: '.csui-selected-count-clearall > span'
    },
    events: {
      'click @ui.selectedCountButton': 'onClickSelectedCount',
      'click @ui.ClearAllButton': 'onClickClearAll',
      'mouseenter @ui.selectedCountButton': 'onMouseEnterSelectedCounterView',
      'mouseleave @ui.selectedCountButton': 'onMouseLeaveSelectedCounterView',
      'mouseenter @ui.dropdownContainer': 'onMouseEnterSelectedCounterView',
      'mouseleave @ui.dropdownContainer': 'onMouseLeaveSelectedCounterView',
      'mouseup @ui.clearAll': 'onMouseUpClearAll',
      'blur  @ui.selectedCountButton': 'onBlurSelectedCountButton',
      'blur @ui.dropdownContainer': 'onBlurSelectedCounterView',
      'keydown': 'onKeydownSelectedCount',
      'keyup': 'onKeyupItem'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function () {
      return this.ui.selectedCountButton;
    },

    constructor: function SelectedCountView(options) {
      options = _.defaults(options, {showOnlyOnSelection: true});
      this.collection = options.collection;
      SelectedCountView.__super__.constructor.apply(this, arguments);
      this.currentlyFocusedIndex = 0;
      this.showClearAll = false;
      this.selectedItemInFocus = false;
      this.scrollableParent = options.scrollableParent;
      this.listenTo(this.collection, "reset remove add", function () {
        !this.isDestroyed && this.onCollectionUpdate();
      });
      this.selectedCount = this.collection.length;
      if (!!this.scrollableParent) {
        this.windowResizeHandler = _.bind(this.setDropdownCss, this);
        $(window).on('resize', this.windowResizeHandler);
      }
    },

    onRender: function () {
      if (!this.selectedCount) {
        this.options.showOnlyOnSelection && this.$el.addClass('binf-hidden');
      } else {
        this.ui.dropdownContainer.addClass('binf-hidden');
        $(document).off("mouseup.csui.select.count");
      }
    },

    onDestroy: function () {
      // stopListening is needed here, because only the event listeners on this (view) are stopped
      // automatically during destroying of the view
      this.stopListening(this.collection, 'reset remove add');
      if (!!this.windowResizeHandler) {
        $(window).off('resize', this.windowResizeHandler);
      }
    },

    onClickClearAll: function (event) {
      this.selectedItemInFocus = true;
      ModalAlert.confirmQuestion(
          _.str.sformat(lang.dialogTemplate, lang.dialogTitle), lang.dialogTitle, {})
          .always(_.bind(function (result) {
            if (result) {
              this.collection.reset([]);
            } else {
              // setFocus back to Clear all(Keyboard)
              this.ui.ClearAllButton.trigger('focus');
              this._moveTabindexToFocusedElement();
            }
            this.selectedItemInFocus = false;
          }, this));
          this.currentlyFocusedIndex = 0;
    },

    onMouseUpClearAll: function (event) {
      //On clicking clearall parent, we should set focus to the clear all button.
      event.preventDefault();
      event.stopPropagation();
      this.ui.ClearAllButton.trigger('focus');
    },

    isDDOpen: function () {
      return !this.ui.dropdownContainer[0].classList.contains("binf-hidden") &&
             !this.el.classList.contains("binf-hidden");
    },

    _focusOnSelectedCountButton: function () {
      this.ui.selectedCountButton.trigger('focus');
      this.selectedCountViewInFocus = true;
    },

    onMouseEnterSelectedCounterView: function () {
      this.selectedCountViewInFocus = true;
    },

    onMouseLeaveSelectedCounterView: function () {
      //Don't update this.selectedCountViewInFocus if any item in view has focus
      if (this.selectedItemInFocus === false) {
        this.selectedCountViewInFocus = false;
      }
    },

    onClickSelectedCount: function (event) {
      event.preventDefault();
      event.stopPropagation();
      // close all the open dropdowns with 'binf-open' class, before opening select counter view.
      var toggleDropdown = this.$el.find('.binf-open>.binf-dropdown-toggle');
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown('toggle');
      }
      if (this.ui.dropdownContainer.hasClass('binf-hidden')) {
        this._showItemView();
      } else {
        this._hideItemView();
      }
    },

    resetState: function () {
      var toggleDropdown = this.$el.find('.binf-open>.binf-dropdown-toggle');
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown('toggle');
      }
      this._hideItemView();
    },

    _showItemView: function () {
      this.selectedCountViewInFocus = true;
      this.ui.dropdownContainer.removeClass('binf-hidden');
      this.ui.selectedCountButton.addClass('binf-open');
      this.ui.selectedCountButton.attr('aria-expanded', 'true');
      if (this.selectedCount > 4) {
        this.showClearAll = true;
        this.ui.clearAll.removeClass('binf-hidden');
      }
      if (!!this.scrollableParent) {
        this.setDropdownCss();
      }
      if (this.ui.clearAll.hasClass('binf-hidden')) {
        this.ui.dropdownContainer.find('.csui-selected-item:first').trigger('focus');
      } else {
        this.ui.clearAll.find('.csui-selected-count-clearall-label').trigger('focus');
      }
      $(document).on("mouseup.csui.select.count", _.bind(this.onDocumentClick, this));
    },

    onDocumentClick: function (event) {
      //Check the target element lies inside or outside of Dropdown
      //When click on clear all and press 'no' drop-down menu should not close
      if (this.$el[0] !== event.target && !(this.$el).has(event.target).length &&
          !this.selectedItemInFocus) {
        this._hideItemView();
      }
    },

    setDropdownCss: function () {
      var dropdownEle = this.ui.dropdownContainer.find(".csui-selected-items-dropdown"),
          scrollableParent = $(this.scrollableParent),
          offsetDiff, scrollableParentHeight, elementSetBacks;
      if (!!scrollableParent && scrollableParent.length > 0) {
        scrollableParentHeight = scrollableParent.height();
        elementSetBacks = parseInt(scrollableParent.css("margin-top")) +
                          parseInt(scrollableParent.css("margin-bottom"));
        offsetDiff = dropdownEle.offset().top - scrollableParent.offset().top;
        // check whether dropdown menu overlaps on it's parent scrollable element.
        // reducing 24px to set some gap between scrollable parent's bottom and dropdown height.
        // dropdownEle.offset().top should be same as scrollableparent.offset().top then only we can compare the height of dropdown.
        // offsetDiff -> difference between two elements start (top) position.
        var heightOfDD = Math.abs(scrollableParentHeight - elementSetBacks);
        dropdownEle.css({
          "max-height": heightOfDD - (24 + offsetDiff) + "px"
        });
      }
    },

    _hideItemView: function (event) {
      this.selectedCountViewInFocus = false;
      _.isFunction(this.ui.dropdownContainer.addClass) && this.ui.dropdownContainer.addClass('binf-hidden');
      this.ui.selectedCountButton.removeClass('binf-open');
      this.ui.selectedCountButton.attr('aria-expanded', 'false');
      $(document).off("mouseup.csui.select.count");
    },

    onRemoveSelectedItem: function (view) {
      //maintaining index value as view getting changed after removing the model
      var currentIndex = view._index, itemViews;
      this.selectedCountViewInFocus = true;
      this.collection.remove(view.model);
      itemViews = _.sortBy(this.children.toArray(), 'cid'); //IE11, returns wrong index and view in each loop;
      if (currentIndex === this.selectedCount) { //if last element
        itemViews[currentIndex - 1] &&
        itemViews[currentIndex - 1].$el.trigger('focus');
      } else {
        itemViews[currentIndex] &&
        itemViews[currentIndex].$el.trigger('focus');
      }
      if (this.collection.length === 0) {
        this.ui.dropdownContainer.addClass('binf-hidden');
      }
    },

    onCollectionUpdate: function () {
      //update selected Counter
      this.selectedCount = this.collection.length;
      if (this.selectedCount && !this.isDDOpen()) {
        this.options.showOnlyOnSelection && this.$el.removeClass('binf-hidden');
        _.isFunction(this.ui.dropdownContainer.addClass) && this.ui.dropdownContainer.addClass('binf-hidden');
        this.trigger('show:counter', true);
      } else if (!this.selectedCount) {
        this.ui.selectedCountButton.removeClass('binf-open');
        this.options.showOnlyOnSelection && this.$el.addClass('binf-hidden');
        $(document).off("mouseup.csui.select.count");
        this.trigger('show:counter', false);
      }
      //dont rerender entire view, update dom elements
      this.ui.selectedCountValue.text(this.selectedCount);
      this.ui.selectedCountButton.attr('aria-label', _.str.sformat(lang.selectedButtonAria, this.selectedCount));
      this.ui.selectedCountButton.attr('title', _.str.sformat(lang.selectedButtonTitle, this.selectedCount));
      //showing clear all based on selected count
      if (!this.showClearAll && this.selectedCount > 4) {
        this.showClearAll = true;
        this.ui.clearAll.removeClass('binf-hidden');
      } else if (this.selectedCount <= 4 && this.showClearAll) {
        this.showClearAll = false;
        this.ui.clearAll.addClass('binf-hidden');
      }
      if (this.selectedCount > 0) {
        this._moveTabindexToFocusedElement();
      }
    },

    _moveTabindexToFocusedElement: function () {
      this._focusableElements = base.findFocusables(this.el);
      for (var i = 0; i < this._focusableElements.length; i++) {
        this._focusableElements[i].setAttribute('tabindex', '0');
      }
    },

    onBlurSelectedCountButton: function (event) {
      if (!this.selectedCountViewInFocus) {
        this._hideItemView();
      }
    },

    onBlurSelectedCounterView: function (event) {
      if (!this.selectedCountViewInFocus) {
        this._hideItemView();
      }
    },

    onKeydownSelectedCount: function (event) {
      switch (event.keyCode) {
      case 9:  //tab
      if(event.shiftKey && !(this.ui.dropdownContainer.hasClass('binf-hidden'))) {   
        event.preventDefault();
        event.stopPropagation();
        this.ui.ClearAllButton.trigger('focus');
      }
      else {
        var itemViews = _.sortBy(this.children.toArray(), 'cid'); //IE11, returns wrong index and view in each loop;
        this.selectedCountViewInFocus = true;
        if (this.ui.ClearAllButton.is(':focus')) {
        itemViews[this.currentlyFocusedIndex].$el.trigger('focus');
        event.stopPropagation();
        event.preventDefault();
        }
      }
        break;
      case 13: //Enter
        if(this.ui.ClearAllButton.is(':focus')) {
          this.onClickClearAll(event);
        }
        break;
      case 32: //Space
        if (this.ui.selectedCountButton.is(':focus')) {
          this.selectedCountViewInFocus = true;
          this.onClickSelectedCount(event);
        }
        break;
      case 46: //Delete
        if (this.ui.ClearAllButton.is(':focus')) {
          this.selectedCountViewInFocus = true;
          this.onClickClearAll(event);
        }
        break;
      case 37: //arrow left
        event.stopPropagation();
        break;
      case 39: //arrow right
        event.stopPropagation();
        break;
      }
    },

    onKeydownItem: function (view, event) {
      //other than these keys are handled in the onKeydownSelectedCount as event is propagated.
      var itemViews = _.sortBy(this.children.toArray(), 'cid'); //IE11, returns wrong index and view in each loop;
      event.preventDefault();
      switch (event.keyCode) {
      case 46: //Delete
      case 13: //Enter
      case 32: //Space
        this.onRemoveSelectedItem(view);
        event.stopPropagation();
        break;
      case 40: //arrow down
        this.selectedCountViewInFocus = true;
        if (view._index !== (this.selectedCount - 1)) {
          itemViews[view._index + 1].$el.trigger('focus');
          this.currentlyFocusedIndex = view._index + 1;
        }
        event.stopPropagation();
        break;
      case 38: //arrow up
        this.selectedCountViewInFocus = true;
        if (view._index > 0) {
          itemViews[view._index - 1].$el.trigger('focus');
          this.currentlyFocusedIndex = view._index - 1;
        }
        event.stopPropagation();
        break;
      case 37: //arrow left
        event.stopPropagation();
        break;
      case 39: //arrow right
        event.stopPropagation();
        break;
      }
    },

    onKeyupItem: function (event) {
      if (event.keyCode === 27 && this.isDDOpen()) { //Esc on select counter view should close Drop-down first
        this.currentlyFocusedIndex = 0;
        event.preventDefault();
        event.stopPropagation();
        this._hideItemView();
        this._focusOnSelectedCountButton();
      }
    }

  });
  return SelectedCountView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/selected.count/impl/selected.count.label',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<span class=\"csui-selected-counter-label\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedLabel") || (depth0 != null ? lookupProperty(depth0,"selectedLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedLabel","hash":{},"loc":{"start":{"line":1,"column":42},"end":{"line":1,"column":59}}}) : helper)))
    + "</span><span class=\"binf-badge binf-badge-light csui-selected-counter-value\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedCount") || (depth0 != null ? lookupProperty(depth0,"selectedCount") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedCount","hash":{},"loc":{"start":{"line":1,"column":136},"end":{"line":1,"column":153}}}) : helper)))
    + "</span>";
}});
Handlebars.registerPartial('csui_controls_selected.count_impl_selected.count.label', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/selected.count/impl/selected.count.label.view',['csui/lib/underscore', 'csui/lib/marionette3',
  'hbs!csui/controls/selected.count/impl/selected.count.label',
  'i18n!csui/controls/selected.count/impl/nls/lang',
  'css!csui/controls/selected.count/impl/selected.count'
], function ( _, Marionette, template, lang) {
  'use strict';
  let SelectedLabelView = Marionette.View.extend({
    tagName : 'button',

    className: function () {
      let className = "binf-btn binf-btn-primary";
      if (this.options.showOnlyOnSelection && this.options.collection.length === 0) {
        //in few cases, view is rendered even before selecting any item. It is toggled based on this flag
        //Hence adding binf-hidden for backward compatibility
        className = ' binf-hidden';
      }
      return className;
    },

    template: template,

    templateContext: function () {
      return {
        selectedCount: this.selectedCount,
        selectedLabel: lang.selectedLabel,
      };
    },

    ui: {
      selectedCountValue: '.csui-selected-counter-value',
    },

    events:{
      'click': 'toggleSelectedCount',
    },

    attributes: function () {
      return {
        title: _.str.sformat(lang.selectedButtonTitle, this.selectedCount),
        'aria-label': _.str.sformat(lang.selectedButtonAria, this.selectedCount),
        'aria-haspopup': true
      };
    },

    constructor: function SelectedLabelView(options) {
      options = _.defaults(options.parentView.options, {showOnlyOnSelection: true});
      this.options = options;
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.selectedCount = this.options.collection.length;
      this.listenTo(this.options.collection, "reset remove add", function () {
         this.updateCounter();
      });
    },

    updateCounter: function(){
      //update select counter on toolbar
      const updatedCount = this.options.collection.length;
      if(updatedCount === 0){
        this.el.classList.add('binf-hidden');
        return;
      }
      this.el.classList.contains('binf-hidden') && this.el.classList.remove('binf-hidden');
      typeof(this.ui.selectedCountValue?.text) === 'function' && this.ui.selectedCountValue?.text(updatedCount);
      this.el.ariaLabel = _.str.sformat(lang.selectedButtonAria, updatedCount);
      this.el.title =  _.str.sformat(lang.selectedButtonTitle, updatedCount);
    },

    toggleSelectedCount: function () {
      if(this.options.parentView?.selectedItemsCollectionView?.isRendered){
        this.options.parentView.selectedItemsCollectionView._hideItemView();
      }
      else{
        this.el.ariaExpanded = true;
        this.options.parentView.showSelectedDropdown();
      }
    },

    onDestroy: function () {
      // stopListening is needed here, because only the event listeners on this (view) are stopped
      // automatically during destroying of the view
      this.stopListening(this.options.collection, 'reset remove add');
    }

  });
  return SelectedLabelView;
});

/* START_TEMPLATE */
csui.define('hbs!csui/controls/selected.count/impl/selected.items.collection',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-dropmenu-container binf-hidden\">\n  <span class=\"csui-selected-count-clearall binf-hidden\"><span\n      class=\"csui-selected-count-clearall-label\"\n      role=\"button\" tabindex=\"0\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"clearAllAria") || (depth0 != null ? lookupProperty(depth0,"clearAllAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"clearAllAria","hash":{},"loc":{"start":{"line":4,"column":45},"end":{"line":4,"column":61}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"clearAll") || (depth0 != null ? lookupProperty(depth0,"clearAll") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"clearAll","hash":{},"loc":{"start":{"line":4,"column":63},"end":{"line":4,"column":75}}}) : helper)))
    + "</span></span>\n\n  <ul class=\"csui-selected-items-dropdown csui-normal-scrolling\" role=\"menu\"></ul>\n</div>";
}});
Handlebars.registerPartial('csui_controls_selected.count_impl_selected.items.collection', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/selected.count/impl/selected.items.collection.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/dialogs/modal.alert/modal.alert',
  'hbs!csui/controls/selected.count/impl/selected.items.collection',
  'hbs!csui/controls/selected.count/impl/selected.list.item',
  'i18n!csui/controls/selected.count/impl/nls/lang',
  'css!csui/controls/selected.count/impl/selected.count'
], function (_, $, Marionette, NodeTypeIconView,
    ModalAlert,
    selectedCountTemplate, selectedListItemTemplate, lang) {
  'use strict';

  var SelectedNodeItemView = Marionette.ItemView.extend({
    className: 'csui-selected-item',
    template: selectedListItemTemplate,
    tagName: 'li',
    events: {
      'keydown': 'onKeyInView'
    },

    modelEvents: {
      'change': 'onModelChange'
    },

    triggers: {
      'click .csui-deselected-icon': 'remove:selected:item'
    },

    templateHelpers: function () {
      return {
        name: this.options.model.get('name'),
        clearItem: lang.clearItem
      };
    },

    constructor: function SelectedNodeItemView(options) {
      this.model = options.model;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, 'show', this.applyCSS);
    },

    onRender: function () {
      this._nodeIconView = new NodeTypeIconView({
        el: this.$('.csui-type-icon').get(0),
        node: this.model,
        size: 'contain'
      });
      this._nodeIconView.render();
      this.$el.attr('tabindex', "-1");
      this.$el.attr('role', 'menuitem');
      this.$el.attr('aria-label', _.str.sformat(lang.unselectAria, this.model.get('name'), this._nodeIconView.$el.attr('aria-label')));
    },

    applyCSS: function () {
      const itemNameWrapper = this.$el.find('.csui-selected-list-item-name-wrapper');
        const elWidth = this.$el.innerWidth();
        const iconWidth = this.$el.find('.csui-icon-group').innerWidth();
        const itemNameWidth = itemNameWrapper.innerWidth();
        if (itemNameWidth && itemNameWidth + iconWidth + 16 > elWidth) itemNameWrapper.css('max-width', 'calc(100% - 20px)'); //16px left padding
    },

    onModelChange: function () {
      this.render();
    },

    onKeyInView: function (event) {
      this.trigger('keydown:item', event);
    }
  });

  var SelectedItemsCollectionView = Marionette.CompositeView.extend({

    className: 'csui-selected-count',
    template: selectedCountTemplate,
    templateHelpers: function () {
      return {
        clearAll: lang.clearAll,
        clearAllAria: lang.clearAllAria,
      };
    },
    childViewContainer: ".csui-selected-items-dropdown",
    childView: SelectedNodeItemView,
    childEvents: {
      'remove:selected:item': 'onRemoveSelectedItem',
      'keydown:item': 'onKeydownItem'
    },

    ui: {
      dropdownContainer: '.csui-dropmenu-container',
      clearAll: '.csui-selected-count-clearall',
      ClearAllButton: '.csui-selected-count-clearall > span'
    },
    events: {
      'click @ui.ClearAllButton': 'onClickClearAll',
      'mouseenter @ui.dropdownContainer': 'onMouseEnterSelectedCounterView',
      'mouseleave @ui.dropdownContainer': 'onMouseLeaveSelectedCounterView',
      'mouseup @ui.clearAll': 'onMouseUpClearAll',
      'blur @ui.dropdownContainer': 'onBlurSelectedCounterView',
      'keydown': 'onKeydownSelectedCount',
      'keyup': 'onKeyupItem'
    },

    constructor: function SelectedItemsCollectionView(options) {
      this.options = options;
      this.collection = options.collection;
      this.selectCountView = options.selectCountView;
      SelectedItemsCollectionView.__super__.constructor.apply(this, arguments);
      this.currentlyFocusedIndex = 0;
      this.showClearAll = false;
      this.selectedItemInFocus = false;
      this.scrollableParent = this.options.parentView?.options?.scrollableParent;
      this.listenTo(this.collection, "reset remove add", function () {
        !this.isDestroyed && this.onCollectionUpdate();
      });
      this.selectedCount = this.collection.length;
      if (!!this.scrollableParent) {
        this.windowResizeHandler = _.bind(this.setDropdownCss, this);
        window.addEventListener('resize', this.windowResizeHandler);
      }
    },

    onRender: function () {
      this.onClickSelectedCount();
    },

    onDestroy: function () {
      // stopListening is needed here, because only the event listeners on this (view) are stopped
      // automatically during destroying of the view
      this.stopListening(this.options.collection, 'reset remove add');
      if (!!this.windowResizeHandler) {
        window.removeEventListener('resize', this.windowResizeHandler);
      }
    },

    onClickClearAll: function () {
      this.selectedItemInFocus = true;
      ModalAlert.confirmQuestion(
          _.str.sformat(lang.dialogTemplate, lang.dialogTitle), lang.dialogTitle, {})
          .always(_.bind(function (result) {
            if (result) {
              this.collection.reset([]);
              this._hideItemView();
            } else {
              // setFocus back to Clear all(Keyboard)
              this.ui.ClearAllButton.trigger('focus');
              this._moveTabindexToFocusedElement && this._moveTabindexToFocusedElement();
            }
            this.selectedItemInFocus = false;
          }, this));
          this.currentlyFocusedIndex = 0;
    },

    onMouseUpClearAll: function (event) {
      //On clicking clearall parent, we should set focus to the clear all button.
      event.preventDefault();
      event.stopPropagation();
      this.ui.ClearAllButton.trigger('focus');
    },

    isDDOpen: function () {
      return !this.ui.dropdownContainer[0].classList.contains("binf-hidden") &&
             !this.el.classList.contains("binf-hidden");
    },

    onClickSelectedCount: function () {
      // close all the open dropdowns with 'binf-open' class, before opening select counter view.
      var toggleDropdown = this.$el.find('.binf-open>.binf-dropdown-toggle');
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown('toggle');
      }
      if (this.ui.dropdownContainer.hasClass('binf-hidden')) {
        this._showItemView();
      }
    },

    resetState: function () {
      var toggleDropdown = this.$el.find('.binf-open>.binf-dropdown-toggle');
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown('toggle');
      }
      this._hideItemView();
    },

    _showItemView: function () {
      this.selectedCountViewInFocus = true;
      this.ui.dropdownContainer.removeClass('binf-hidden');
      if (this.selectedCount > 4) {
        this.showClearAll = true;
        this.ui.clearAll.removeClass('binf-hidden');
      }
      if (!!this.scrollableParent) {
        this.setDropdownCss();
      }
      $(document).on("mouseup.csui.select.count", _.bind(this.onDocumentClick, this));
    },

    onShow: function(){
      if (this.ui.clearAll?.[0].classList?.contains('binf-hidden')) {
        this.ui.dropdownContainer?.[0].querySelector('.csui-selected-item')?.focus();
      } else {
        typeof this.ui.clearAll?.[0]?.querySelector === 'function' && this.ui.clearAll?.[0]?.querySelector('.csui-selected-count-clearall-label')?.focus();
      }
    },

    onDocumentClick: function (event) {
      //Check the target element lies inside or outside of Dropdown
      //When click on clear all and press 'no' drop-down menu should not close
    
      if (!event.target.closest(".csui-selected-counter-region>button") && this.$el[0] !== event.target && !(this.$el).has(event.target).length &&
          !this.selectedItemInFocus) {
        this._hideItemView();
      }
    },

    setDropdownCss: function () {
      const dropdownEle = this.ui.dropdownContainer.find(".csui-selected-items-dropdown");
      const scrollableParent = $(this.scrollableParent);
      if (!!scrollableParent && scrollableParent.length > 0) {
        const scrollableParentHeight = scrollableParent.height();
        const elementSetBacks = parseInt(scrollableParent.css("margin-top")) + parseInt(scrollableParent.css("margin-bottom"));
        const offsetDiff = dropdownEle.offset().top - scrollableParent.offset().top;
        const heightOfDD = Math.abs(scrollableParentHeight - elementSetBacks - 200);
        dropdownEle.css({
          "max-height": heightOfDD - (24 + offsetDiff) + "px"
        });
      }
    },

    _hideItemView: function () {
      this.options.parentView.destroySelectedDropdown();
      $(document).off("mouseup.csui.select.count");
    },

    onRemoveSelectedItem: function (view) {
      //maintaining index value as view getting changed after removing the model
      var currentIndex = view._index, itemViews;
      this.selectedCountViewInFocus = true;
      this.collection.remove(view.model);
      itemViews = _.sortBy(this.children.toArray(), 'cid'); //IE11, returns wrong index and view in each loop;
      if (currentIndex === this.collection.length) { //if last element
        itemViews[currentIndex - 1] &&
        itemViews[currentIndex - 1].$el.trigger('focus');
      } else {
        itemViews[currentIndex] &&
        itemViews[currentIndex].$el.trigger('focus');
      }
      if (this.collection.length === 0) {
        this._hideItemView();
      }
    },

    onBlurSelectedCounterView: function (event) {
      if (!this.selectedCountViewInFocus) {
        this._hideItemView();
      }
    },

    onKeydownSelectedCount: function (event) {
      switch (event.keyCode) {
      case 9:  //tab
      if(event.shiftKey && !(this.ui.dropdownContainer.hasClass('binf-hidden'))) {   
        event.preventDefault();
        event.stopPropagation();
        this.ui.ClearAllButton.trigger('focus');
      }
      else {
        var itemViews = _.sortBy(this.children.toArray(), 'cid'); //IE11, returns wrong index and view in each loop;
        this.selectedCountViewInFocus = true;
        if (this.ui.ClearAllButton.is(':focus')) {
        itemViews[this.currentlyFocusedIndex]?.$el?.trigger('focus');
        event.stopPropagation();
        event.preventDefault();
        }
      }
        break;
      case 13: //Enter
        if(this.ui.ClearAllButton.is(':focus')) {
          this.onClickClearAll(event);
        }
        break;
      case 46: //Delete
        if (this.ui.ClearAllButton.is(':focus')) {
          this.selectedCountViewInFocus = true;
          this.onClickClearAll(event);
        }
        break;
      case 37: //arrow left
      case 39: //arrow right
        event.stopPropagation();
        break;
      }
    },

    onKeydownItem: function (view, event) {
      //other than these keys are handled in the onKeydownSelectedCount as event is propagated.
      var itemViews = _.sortBy(this.children.toArray(), 'cid'); //IE11, returns wrong index and view in each loop;
      event.preventDefault();
      switch (event.keyCode) {
      case 46: //Delete
      case 13: //Enter
      case 32: //Space
        this.onRemoveSelectedItem(view);
        event.stopPropagation();
        break;
      case 40: //arrow down
        this.selectedCountViewInFocus = true;
        if (view._index !== (this.selectedCount - 1)) {
          itemViews[view._index + 1]?.$el?.trigger('focus');
          this.currentlyFocusedIndex = view._index + 1;
        }
        event.stopPropagation();
        break;
      case 38: //arrow up
        this.selectedCountViewInFocus = true;
        if (view._index > 0) {
          itemViews[view._index - 1]?.$el?.trigger('focus');
          this.currentlyFocusedIndex = view._index - 1;
        }
        event.stopPropagation();
        break;
      case 37: //arrow left
        event.stopPropagation();
        break;
      case 39: //arrow right
        event.stopPropagation();
        break;
      }
    },

    onKeyupItem: function (event) {
      if (event.keyCode === 27 && this.isDDOpen()) { //Esc on select counter view should close Drop-down first
        this.currentlyFocusedIndex = 0;
        event.preventDefault();
        event.stopPropagation();
        this._hideItemView();
        this.options.parentView?.selectedLabel.el.focus();
        this.selectedCountViewInFocus = true;
      }
    },

    onCollectionUpdate: function () {
      if (this.collection.length <= 4) {
        this.ui.clearAll[0].classList.add('binf-hidden');
      }
    }

  });
  return SelectedItemsCollectionView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/selected.count/impl/selected.count.control',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"csui-selected-counter-region\"></div>\n<div class=\"csui-selected-dropdown\"></div>";
}});
Handlebars.registerPartial('csui_controls_selected.count_impl_selected.count.control', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/selected.count/selected.count.control.view',['csui/lib/underscore', 'csui/lib/marionette3',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/selected.count/impl/selected.count.label.view',
  'csui/controls/selected.count/impl/selected.items.collection.view',
  'hbs!csui/controls/selected.count/impl/selected.count.control',
  'css!csui/controls/selected.count/impl/selected.count'
], function (_, Marionette, TabableRegionBehavior,SelectedCountLabelView, SelectedItemsCollectionView, template) {
  'use strict';
  let SelectedCounterView = Marionette.View.extend({

    className: 'csui-selected-count',

    template: template,

    regions: {
      selectedLabel: '.csui-selected-counter-region',
      selectedItemsDropdown: '.csui-selected-dropdown'
    },

    constructor: function SelectedCounterView(options) {
      options || (options = {});
      this.options = options;
      this.options.collection = this.options.collection;
      Marionette.View.prototype.constructor.apply(this, arguments);
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    onRender: function () {
      this.selectedLabel = new SelectedCountLabelView({
        collection: this.options.collection,
        parentView: this
      });
      this._regions.selectedLabel.show(this.selectedLabel);
    },

    showSelectedDropdown: function () {
      this.selectedItemsCollectionView = new SelectedItemsCollectionView({
        collection: this.options.collection,
        parentView: this
      });
      this._regions.selectedItemsDropdown.show(this.selectedItemsCollectionView);
    },

    destroySelectedDropdown: function () {
      if(this.selectedLabel?.el?.ariaExpanded === "true")
        this.selectedLabel.el.ariaExpanded = false;
      this.selectedItemsCollectionView?.destroy();
    },

    currentlyFocusedElement: function () {
      return this.selectedLabel?.el;
    },

    resetState: function(){
      this.selectedItemsCollectionView?.resetState();
    }

  });

  return SelectedCounterView;
});

/**
 * @preserve
 * jQuery Simulate v0.0.1 - simulate browser mouse and keyboard events
 * https://github.com/jquery/jquery-simulate
 *
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * Date: Sun Dec 9 12:15:33 2012 -0500
 */

csui.define('csui/lib/jquery.simulate',['module', 'csui/lib/jquery'
], function (module, jQuery) {


    ;
    (function ($, undefined) {
        "use strict";

        var rkeyEvent = /^key/,
            rmouseEvent = /^(?:mouse|contextmenu)|click/,
            rdocument = /\[object (?:HTML)?Document\]/;

        function isDocument(ele) {
            return rdocument.test(Object.prototype.toString.call(ele));
        }

        function windowOfDocument(doc) {
            for (var i = 0; i < window.frames.length; i += 1) {
                if (window.frames[i] && window.frames[i].document === doc) {
                    return window.frames[i];
                }
            }
            return window;
        }

        $.fn.simulate = function (type, options) {
            return this.each(function () {
                new $.simulate(this, type, options);
            });
        };

        $.simulate = function (elem, type, options) {
            var method = $.camelCase("simulate-" + type);

            this.target = elem;
            this.options = options || {};

            if (this[method]) {
                this[method]();
            } else {
                this.simulateEvent(elem, type, this.options);
            }
        };

        $.extend($.simulate, {

            keyCode: {
                BACKSPACE: 8,
                COMMA: 188,
                DELETE: 46,
                DOWN: 40,
                END: 35,
                ENTER: 13,
                ESCAPE: 27,
                HOME: 36,
                LEFT: 37,
                NUMPAD_ADD: 107,
                NUMPAD_DECIMAL: 110,
                NUMPAD_DIVIDE: 111,
                NUMPAD_ENTER: 108,
                NUMPAD_MULTIPLY: 106,
                NUMPAD_SUBTRACT: 109,
                PAGE_DOWN: 34,
                PAGE_UP: 33,
                PERIOD: 190,
                RIGHT: 39,
                SPACE: 32,
                TAB: 9,
                UP: 38
            },

            buttonCode: {
                LEFT: 0,
                MIDDLE: 1,
                RIGHT: 2
            }
        });

        $.extend($.simulate.prototype, {

            simulateEvent: function (elem, type, options) {
                var event = this.createEvent(type, options);
                this.dispatchEvent(elem, type, event, options);
            },

            createEvent: function (type, options) {
                if (rkeyEvent.test(type)) {
                    return this.keyEvent(type, options);
                }

                if (rmouseEvent.test(type)) {
                    return this.mouseEvent(type, options);
                }
            },

            mouseEvent: function (type, options) {
                var event,
                    eventDoc,
                    doc = isDocument(this.target) ? this.target : (this.target.ownerDocument || document),
                    docEle,
                    body;


                options = $.extend({
                    bubbles: true,
                    cancelable: (type !== "mousemove"),
                    view: windowOfDocument(doc),
                    detail: 0,
                    screenX: 0,
                    screenY: 0,
                    clientX: 1,
                    clientY: 1,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    button: 0,
                    relatedTarget: undefined
                }, options);


                if (doc.createEvent) {
                    event = doc.createEvent("MouseEvents");
                    event.initMouseEvent(type, options.bubbles, options.cancelable,
                        options.view, options.detail,
                        options.screenX, options.screenY, options.clientX, options.clientY,
                        options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
                        options.button, options.relatedTarget || doc.body.parentNode);

                    // IE 9+ creates events with pageX and pageY set to 0.
                    // Trying to modify the properties throws an error,
                    // so we define getters to return the correct values.
                    if (event.pageX === 0 && event.pageY === 0 && Object.defineProperty) {
                        eventDoc = isDocument(event.relatedTarget) ? event.relatedTarget : (event.relatedTarget.ownerDocument || document);
                        docEle = eventDoc.documentElement;
                        body = eventDoc.body;

                        Object.defineProperty(event, "pageX", {
                            get: function () {
                                return options.clientX +
                                    ( docEle && docEle.scrollLeft || body && body.scrollLeft || 0 ) -
                                    ( docEle && docEle.clientLeft || body && body.clientLeft || 0 );
                            }
                        });
                        Object.defineProperty(event, "pageY", {
                            get: function () {
                                return options.clientY +
                                    ( docEle && docEle.scrollTop || body && body.scrollTop || 0 ) -
                                    ( docEle && docEle.clientTop || body && body.clientTop || 0 );
                            }
                        });
                    }
                } else if (doc.createEventObject) {
                    event = doc.createEventObject();
                    $.extend(event, options);
                    // standards event.button uses constants defined here: http://msdn.microsoft.com/en-us/library/ie/ff974877(v=vs.85).aspx
                    // old IE event.button uses constants defined here: http://msdn.microsoft.com/en-us/library/ie/ms533544(v=vs.85).aspx
                    // so we actually need to map the standard back to oldIE
                    event.button = {
                            0: 1,
                            1: 4,
                            2: 2
                        }[event.button] || event.button;
                }

                return event;
            },

            keyEvent: function (type, options) {
                var event, doc;
                options = $.extend({
                    bubbles: true,
                    cancelable: true,
                    view: windowOfDocument(doc),
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    keyCode: 0,
                    charCode: undefined
                }, options);

                doc = isDocument(this.target) ? this.target : (this.target.ownerDocument || document);
                if (doc.createEvent) {
                    try {
                        event = doc.createEvent("KeyEvents");
                        event.initKeyEvent(type, options.bubbles, options.cancelable, options.view,
                            options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
                            options.keyCode, options.charCode);
                        // initKeyEvent throws an exception in WebKit
                        // see: http://stackoverflow.com/questions/6406784/initkeyevent-keypress-only-works-in-firefox-need-a-cross-browser-solution
                        // and also https://bugs.webkit.org/show_bug.cgi?id=13368
                        // fall back to a generic event until we decide to implement initKeyboardEvent
                    } catch (err) {
                        event = doc.createEvent("Events");
                        event.initEvent(type, options.bubbles, options.cancelable);
                        $.extend(event, {
                            view: options.view,
                            ctrlKey: options.ctrlKey,
                            altKey: options.altKey,
                            shiftKey: options.shiftKey,
                            metaKey: options.metaKey,
                            keyCode: options.keyCode,
                            charCode: options.charCode
                        });
                    }
                } else if (doc.createEventObject) {
                    event = doc.createEventObject();
                    $.extend(event, options);
                }

                if (!!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase()) || (({}).toString.call(window.opera) === "[object Opera]")) {
                    event.keyCode = (options.charCode > 0) ? options.charCode : options.keyCode;
                    event.charCode = undefined;
                }

                return event;
            },

            dispatchEvent: function (elem, type, event, options) {
                if (options.jQueryTrigger === true) {
                    $(elem).trigger($.extend({}, event, options, {type: type}));
                }
                else if (elem.dispatchEvent) {
                    elem.dispatchEvent(event);
                } else if (elem.fireEvent) {
                    elem.fireEvent("on" + type, event);
                }
            },

            simulateFocus: function () {
                var focusinEvent,
                    triggered = false,
                    $element = $(this.target);

                function trigger() {
                    triggered = true;
                }

                $element.on('focus', trigger);
                $element.first().trigger('focus');

                if (!triggered) {
                    focusinEvent = $.Event("focusin");
                    focusinEvent.preventDefault();
                    $element.trigger(focusinEvent);
                    $element.triggerHandler("focus");
                }
                $element.unbind("focus", trigger);
            },

            simulateBlur: function () {
                var focusoutEvent,
                    triggered = false,
                    $element = $(this.target);

                function trigger() {
                    triggered = true;
                }

                $element.on('blur', trigger);
                $element.first().trigger('blur');

                // blur events are async in IE
                setTimeout(function () {
                    // IE won't let the blur occur if the window is inactive
                    if ($element[0].ownerDocument.activeElement === $element[0]) {
                        $($element[0].ownerDocument.body).trigger('focus');
                    }

                    // Firefox won't trigger events if the window is inactive
                    // IE doesn't trigger events if we had to manually focus the body
                    if (!triggered) {
                        focusoutEvent = $.Event("focusout");
                        focusoutEvent.preventDefault();
                        $element.trigger(focusoutEvent);
                        $element.triggerHandler("blur");
                    }
                    $element.off("blur", trigger);
                }, 1);
            }
        });


        /** complex events **/

        function findCenter(elem) {
            var offset,
                $document,
                $elem = $(elem);

            if (isDocument($elem[0])) {
                $document = $elem;
                offset = {left: 0, top: 0};
            }
            else {
                $document = $($elem[0].ownerDocument || document);
                offset = $elem.offset();
            }

            return {
                x: offset.left + $elem.outerWidth() / 2 - $document.scrollLeft(),
                y: offset.top + $elem.outerHeight() / 2 - $document.scrollTop()
            };
        }

        function findCorner(elem) {
            var offset,
                $document,
                $elem = $(elem);

            if (isDocument($elem[0])) {
                $document = $elem;
                offset = {left: 0, top: 0};
            }
            else {
                $document = $($elem[0].ownerDocument || document);
                offset = $elem.offset();
            }

            return {
                x: offset.left - document.scrollLeft(),
                y: offset.top - document.scrollTop()
            };
        }

        $.extend($.simulate.prototype, {
            simulateDrag: function () {
                var i = 0,
                    target = this.target,
                    options = this.options,
                    center = options.handle === "corner" ? findCorner(target) : findCenter(target),
                    x = Math.floor(center.x),
                    y = Math.floor(center.y),
                    coord = {clientX: x, clientY: y},
                    dx = options.dx || ( options.x !== undefined ? options.x - x : 0 ),
                    dy = options.dy || ( options.y !== undefined ? options.y - y : 0 ),
                    moves = options.moves || 3;

                this.simulateEvent(target, "mousedown", coord);

                for (; i < moves; i++) {
                    x += dx / moves;
                    y += dy / moves;

                    coord = {
                        clientX: Math.round(x),
                        clientY: Math.round(y)
                    };

                    this.simulateEvent(target.ownerDocument, "mousemove", coord);
                }

                if ($.contains(document, target)) {
                    this.simulateEvent(target, "mouseup", coord);
                    this.simulateEvent(target, "click", coord);
                } else {
                    this.simulateEvent(document, "mouseup", coord);
                }
            }
        });

    })(jQuery);

});


/**
 * @preserve
 * CryptoJS 3.2.1
 * Copyright (c) 2009-2013 Jeff Mott
 * Copyright (c) 2013-2016 Evan Vosberg
 * https://github.com/brix/crypto-js
 * Available under MIT license
 */

csui.define('csui/lib/othelp',[],function () {
  let CryptoJS;
  function localDefine(deps, factory) {
    CryptoJS = factory();
  }
  localDefine.amd = true;
  function localRequire() {
    throw new Error ('Not imlemented');
  }
  (function(a,b){if(typeof exports==="object"){module.exports=exports=b()}else{if(typeof localDefine==="function"&&localDefine.amd){localDefine([],b)}else{a.CryptoJS=b()}}}(this,function(){var a=a||(function(h,j){var d;if(typeof window!=="undefined"&&window.crypto){d=window.crypto}if(!d&&typeof window!=="undefined"&&window.msCrypto){d=window.msCrypto}if(!d&&typeof global!=="undefined"&&global.crypto){d=global.crypto}if(!d&&typeof localRequire==="function"){try{d=localRequire("crypto")}catch(l){}}var b=function(){if(d){if(typeof d.getRandomValues==="function"){try{return d.getRandomValues(new Uint32Array(1))[0]}catch(s){}}if(typeof d.randomBytes==="function"){try{return d.randomBytes(4).readInt32LE()}catch(s){}}}throw new Error("Native crypto module could not be used to get secure random number.")};var o=Object.create||(function(){function s(){}return function(u){var t;s.prototype=u;t=new s();s.prototype=null;return t}}());var c={};var e=c.lib={};var n=e.Base=(function(){return{extend:function(t){var s=o(this);if(t){s.mixIn(t)}if(!s.hasOwnProperty("init")||this.init===s.init){s.init=function(){s.$super.init.apply(this,arguments)}}s.init.prototype=s;s.$super=this;return s},create:function(){var s=this.extend();s.init.apply(s,arguments);return s},init:function(){},mixIn:function(t){for(var s in t){if(t.hasOwnProperty(s)){this[s]=t[s]}}if(t.hasOwnProperty("toString")){this.toString=t.toString}},clone:function(){return this.init.prototype.extend(this)}}}());var q=e.WordArray=n.extend({init:function(t,s){t=this.words=t||[];if(s!=j){this.sigBytes=s}else{this.sigBytes=t.length*4}},toString:function(s){return(s||k).stringify(this)},concat:function(y){var v=this.words;var u=y.words;var s=this.sigBytes;var x=y.sigBytes;this.clamp();if(s%4){for(var w=0;w<x;w++){var t=(u[w>>>2]>>>(24-(w%4)*8))&255;v[(s+w)>>>2]|=t<<(24-((s+w)%4)*8)}}else{for(var w=0;w<x;w+=4){v[(s+w)>>>2]=u[w>>>2]}}this.sigBytes+=x;return this},clamp:function(){var t=this.words;var s=this.sigBytes;t[s>>>2]&=4294967295<<(32-(s%4)*8);t.length=h.ceil(s/4)},clone:function(){var s=n.clone.call(this);s.words=this.words.slice(0);return s},random:function(u){var t=[];for(var s=0;s<u;s+=4){t.push(b())}return new q.init(t,u)}});var r=c.enc={};var k=r.Hex={stringify:function(u){var w=u.words;var t=u.sigBytes;var v=[];for(var s=0;s<t;s++){var x=(w[s>>>2]>>>(24-(s%4)*8))&255;v.push((x>>>4).toString(16));v.push((x&15).toString(16))}return v.join("")},parse:function(u){var s=u.length;var v=[];for(var t=0;t<s;t+=2){v[t>>>3]|=parseInt(u.substr(t,2),16)<<(24-(t%8)*4)}return new q.init(v,s/2)}};var g=r.Latin1={stringify:function(v){var w=v.words;var u=v.sigBytes;var s=[];for(var t=0;t<u;t++){var x=(w[t>>>2]>>>(24-(t%4)*8))&255;s.push(String.fromCharCode(x))}return s.join("")},parse:function(u){var s=u.length;var v=[];for(var t=0;t<s;t++){v[t>>>2]|=(u.charCodeAt(t)&255)<<(24-(t%4)*8)}return new q.init(v,s)}};var f=r.Utf8={stringify:function(s){try{return decodeURIComponent(escape(g.stringify(s)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function(s){return g.parse(unescape(encodeURIComponent(s)))}};var m=e.BufferedBlockAlgorithm=n.extend({reset:function(){this._data=new q.init();this._nDataBytes=0},_append:function(s){if(typeof s=="string"){s=f.parse(s)}this._data.concat(s);this._nDataBytes+=s.sigBytes},_process:function(B){var t;var v=this._data;var C=v.words;var s=v.sigBytes;var y=this.blockSize;var A=y*4;var z=s/A;if(B){z=h.ceil(z)}else{z=h.max((z|0)-this._minBufferSize,0)}var x=z*y;var w=h.min(x*4,s);if(x){for(var u=0;u<x;u+=y){this._doProcessBlock(C,u)}t=C.splice(0,x);v.sigBytes-=w}return new q.init(t,w)},clone:function(){var s=n.clone.call(this);s._data=this._data.clone();return s},_minBufferSize:0});var i=e.Hasher=m.extend({cfg:n.extend(),init:function(s){this.cfg=this.cfg.extend(s);this.reset()},reset:function(){m.reset.call(this);this._doReset()},update:function(s){this._append(s);this._process();return this},finalize:function(s){if(s){this._append(s)}var t=this._doFinalize();return t},blockSize:512/32,_createHelper:function(s){return function(u,t){return new s.init(t).finalize(u)}},_createHmacHelper:function(s){return function(u,t){return new p.HMAC.init(s,t).finalize(u)}}});var p=c.algo={};return c}(Math));(function(){var g=a;var b=g.lib;var c=b.WordArray;var f=g.enc;var e=f.Base64={stringify:function(n){var p=n.words;var r=n.sigBytes;var k=this._map;n.clamp();var o=[];for(var m=0;m<r;m+=3){var u=(p[m>>>2]>>>(24-(m%4)*8))&255;var s=(p[(m+1)>>>2]>>>(24-((m+1)%4)*8))&255;var q=(p[(m+2)>>>2]>>>(24-((m+2)%4)*8))&255;var t=(u<<16)|(s<<8)|q;for(var l=0;(l<4)&&(m+l*0.75<r);l++){o.push(k.charAt((t>>>(6*(3-l)))&63))}}var h=k.charAt(64);if(h){while(o.length%4){o.push(h)}}return o.join("")},parse:function(o){var k=o.length;var l=this._map;var i=this._reverseMap;if(!i){i=this._reverseMap=[];for(var h=0;h<l.length;h++){i[l.charCodeAt(h)]=h}}var n=l.charAt(64);if(n){var m=o.indexOf(n);if(m!==-1){k=m}}return d(o,k,i)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="};function d(q,m,p){var n=[];var l=0;for(var k=0;k<m;k++){if(k%4){var j=p[q.charCodeAt(k-1)]<<((k%4)*2);var h=p[q.charCodeAt(k)]>>>(6-(k%4)*2);var o=j|h;n[l>>>2]|=o<<(24-(l%4)*8);l++}}return c.create(n,l)}}());(function(d){var b=a;var c=b.lib;var j=c.WordArray;var f=c.Hasher;var k=b.algo;var g=[];(function(){for(var n=0;n<64;n++){g[n]=(d.abs(d.sin(n+1))*4294967296)|0}}());var l=k.MD5=f.extend({_doReset:function(){this._hash=new j.init([1732584193,4023233417,2562383102,271733878])},_doProcessBlock:function(t,o){for(var J=0;J<16;J++){var n=o+J;var p=t[n];t[n]=((((p<<8)|(p>>>24))&16711935)|(((p<<24)|(p>>>8))&4278255360))}var y=this._hash.words;var B=t[o+0];var A=t[o+1];var z=t[o+2];var x=t[o+3];var w=t[o+4];var v=t[o+5];var u=t[o+6];var s=t[o+7];var r=t[o+8];var q=t[o+9];var I=t[o+10];var G=t[o+11];var F=t[o+12];var E=t[o+13];var D=t[o+14];var C=t[o+15];var O=y[0];var N=y[1];var L=y[2];var K=y[3];O=i(O,N,L,K,B,7,g[0]);K=i(K,O,N,L,A,12,g[1]);L=i(L,K,O,N,z,17,g[2]);N=i(N,L,K,O,x,22,g[3]);O=i(O,N,L,K,w,7,g[4]);K=i(K,O,N,L,v,12,g[5]);L=i(L,K,O,N,u,17,g[6]);N=i(N,L,K,O,s,22,g[7]);O=i(O,N,L,K,r,7,g[8]);K=i(K,O,N,L,q,12,g[9]);L=i(L,K,O,N,I,17,g[10]);N=i(N,L,K,O,G,22,g[11]);O=i(O,N,L,K,F,7,g[12]);K=i(K,O,N,L,E,12,g[13]);L=i(L,K,O,N,D,17,g[14]);N=i(N,L,K,O,C,22,g[15]);O=e(O,N,L,K,A,5,g[16]);K=e(K,O,N,L,u,9,g[17]);L=e(L,K,O,N,G,14,g[18]);N=e(N,L,K,O,B,20,g[19]);O=e(O,N,L,K,v,5,g[20]);K=e(K,O,N,L,I,9,g[21]);L=e(L,K,O,N,C,14,g[22]);N=e(N,L,K,O,w,20,g[23]);O=e(O,N,L,K,q,5,g[24]);K=e(K,O,N,L,D,9,g[25]);L=e(L,K,O,N,x,14,g[26]);N=e(N,L,K,O,r,20,g[27]);O=e(O,N,L,K,E,5,g[28]);K=e(K,O,N,L,z,9,g[29]);L=e(L,K,O,N,s,14,g[30]);N=e(N,L,K,O,F,20,g[31]);O=m(O,N,L,K,v,4,g[32]);K=m(K,O,N,L,r,11,g[33]);L=m(L,K,O,N,G,16,g[34]);N=m(N,L,K,O,D,23,g[35]);O=m(O,N,L,K,A,4,g[36]);K=m(K,O,N,L,w,11,g[37]);L=m(L,K,O,N,s,16,g[38]);N=m(N,L,K,O,I,23,g[39]);O=m(O,N,L,K,E,4,g[40]);K=m(K,O,N,L,B,11,g[41]);L=m(L,K,O,N,x,16,g[42]);N=m(N,L,K,O,u,23,g[43]);O=m(O,N,L,K,q,4,g[44]);K=m(K,O,N,L,F,11,g[45]);L=m(L,K,O,N,C,16,g[46]);N=m(N,L,K,O,z,23,g[47]);O=h(O,N,L,K,B,6,g[48]);K=h(K,O,N,L,s,10,g[49]);L=h(L,K,O,N,D,15,g[50]);N=h(N,L,K,O,v,21,g[51]);O=h(O,N,L,K,F,6,g[52]);K=h(K,O,N,L,x,10,g[53]);L=h(L,K,O,N,I,15,g[54]);N=h(N,L,K,O,A,21,g[55]);O=h(O,N,L,K,r,6,g[56]);K=h(K,O,N,L,C,10,g[57]);L=h(L,K,O,N,u,15,g[58]);N=h(N,L,K,O,E,21,g[59]);O=h(O,N,L,K,w,6,g[60]);K=h(K,O,N,L,G,10,g[61]);L=h(L,K,O,N,z,15,g[62]);N=h(N,L,K,O,q,21,g[63]);y[0]=(y[0]+O)|0;y[1]=(y[1]+N)|0;y[2]=(y[2]+L)|0;y[3]=(y[3]+K)|0},_doFinalize:function(){var r=this._data;var w=r.words;var t=this._nDataBytes*8;var u=r.sigBytes*8;w[u>>>5]|=128<<(24-u%32);var s=d.floor(t/4294967296);var o=t;w[(((u+64)>>>9)<<4)+15]=((((s<<8)|(s>>>24))&16711935)|(((s<<24)|(s>>>8))&4278255360));w[(((u+64)>>>9)<<4)+14]=((((o<<8)|(o>>>24))&16711935)|(((o<<24)|(o>>>8))&4278255360));r.sigBytes=(w.length+1)*4;this._process();var q=this._hash;var v=q.words;for(var p=0;p<4;p++){var n=v[p];v[p]=(((n<<8)|(n>>>24))&16711935)|(((n<<24)|(n>>>8))&4278255360)}return q},clone:function(){var n=f.clone.call(this);n._hash=this._hash.clone();return n}});function i(q,p,y,v,o,u,r){var w=q+((p&y)|(~p&v))+o+r;return((w<<u)|(w>>>(32-u)))+p}function e(q,p,y,v,o,u,r){var w=q+((p&v)|(y&~v))+o+r;return((w<<u)|(w>>>(32-u)))+p}function m(q,p,y,v,o,u,r){var w=q+(p^y^v)+o+r;return((w<<u)|(w>>>(32-u)))+p}function h(q,p,y,v,o,u,r){var w=q+(y^(p|~v))+o+r;return((w<<u)|(w>>>(32-u)))+p}b.MD5=f._createHelper(l);b.HmacMD5=f._createHmacHelper(l)}(Math));(function(){var h=a;var e=h.lib;var g=e.WordArray;var c=e.Hasher;var f=h.algo;var b=[];var d=f.SHA1=c.extend({_doReset:function(){this._hash=new g.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(o,k){var u=this._hash.words;var s=u[0];var r=u[1];var q=u[2];var p=u[3];var m=u[4];for(var l=0;l<80;l++){if(l<16){b[l]=o[k+l]|0}else{var j=b[l-3]^b[l-8]^b[l-14]^b[l-16];b[l]=(j<<1)|(j>>>31)}var v=((s<<5)|(s>>>27))+m+b[l];if(l<20){v+=((r&q)|(~r&p))+1518500249}else{if(l<40){v+=(r^q^p)+1859775393}else{if(l<60){v+=((r&q)|(r&p)|(q&p))-1894007588}else{v+=(r^q^p)-899497514}}}m=p;p=q;q=(r<<30)|(r>>>2);r=s;s=v}u[0]=(u[0]+s)|0;u[1]=(u[1]+r)|0;u[2]=(u[2]+q)|0;u[3]=(u[3]+p)|0;u[4]=(u[4]+m)|0},_doFinalize:function(){var k=this._data;var l=k.words;var i=this._nDataBytes*8;var j=k.sigBytes*8;l[j>>>5]|=128<<(24-j%32);l[(((j+64)>>>9)<<4)+14]=Math.floor(i/4294967296);l[(((j+64)>>>9)<<4)+15]=i;k.sigBytes=l.length*4;this._process();return this._hash},clone:function(){var i=c.clone.call(this);i._hash=this._hash.clone();return i}});h.SHA1=c._createHelper(d);h.HmacSHA1=c._createHmacHelper(d)}());(function(d){var b=a;var c=b.lib;var h=c.WordArray;var f=c.Hasher;var i=b.algo;var k=[];var j=[];(function(){function o(s){var r=d.sqrt(s);for(var q=2;q<=r;q++){if(!(s%q)){return false}}return true}function m(q){return((q-(q|0))*4294967296)|0}var p=2;var l=0;while(l<64){if(o(p)){if(l<8){k[l]=m(d.pow(p,1/2))}j[l]=m(d.pow(p,1/3));l++}p++}}());var e=[];var g=i.SHA256=f.extend({_doReset:function(){this._hash=new h.init(k.slice(0))},_doProcessBlock:function(o,n){var r=this._hash.words;var E=r[0];var D=r[1];var C=r[2];var B=r[3];var A=r[4];var z=r[5];var y=r[6];var x=r[7];for(var w=0;w<64;w++){if(w<16){e[w]=o[n+w]|0}else{var m=e[w-15];var G=((m<<25)|(m>>>7))^((m<<14)|(m>>>18))^(m>>>3);var s=e[w-2];var F=((s<<15)|(s>>>17))^((s<<13)|(s>>>19))^(s>>>10);e[w]=G+e[w-7]+F+e[w-16]}var t=(A&z)^(~A&y);var l=(E&D)^(E&C)^(D&C);var v=((E<<30)|(E>>>2))^((E<<19)|(E>>>13))^((E<<10)|(E>>>22));var u=((A<<26)|(A>>>6))^((A<<21)|(A>>>11))^((A<<7)|(A>>>25));var q=x+u+t+j[w]+e[w];var p=v+l;x=y;y=z;z=A;A=(B+q)|0;B=C;C=D;D=E;E=(q+p)|0}r[0]=(r[0]+E)|0;r[1]=(r[1]+D)|0;r[2]=(r[2]+C)|0;r[3]=(r[3]+B)|0;r[4]=(r[4]+A)|0;r[5]=(r[5]+z)|0;r[6]=(r[6]+y)|0;r[7]=(r[7]+x)|0},_doFinalize:function(){var n=this._data;var o=n.words;var l=this._nDataBytes*8;var m=n.sigBytes*8;o[m>>>5]|=128<<(24-m%32);o[(((m+64)>>>9)<<4)+14]=d.floor(l/4294967296);o[(((m+64)>>>9)<<4)+15]=l;n.sigBytes=o.length*4;this._process();return this._hash},clone:function(){var l=f.clone.call(this);l._hash=this._hash.clone();return l}});b.SHA256=f._createHelper(g);b.HmacSHA256=f._createHmacHelper(g)}(Math));(function(){var g=a;var b=g.lib;var d=b.WordArray;var f=g.enc;var e=f.Utf16=f.Utf16BE={stringify:function(l){var n=l.words;var k=l.sigBytes;var m=[];for(var j=0;j<k;j+=2){var h=(n[j>>>2]>>>(16-(j%4)*8))&65535;m.push(String.fromCharCode(h))}return m.join("")},parse:function(h){var k=h.length;var l=[];for(var j=0;j<k;j++){l[j>>>1]|=h.charCodeAt(j)<<(16-(j%2)*16)}return d.create(l,k*2)}};f.Utf16LE={stringify:function(l){var n=l.words;var k=l.sigBytes;var m=[];for(var j=0;j<k;j+=2){var h=c((n[j>>>2]>>>(16-(j%4)*8))&65535);m.push(String.fromCharCode(h))}return m.join("")},parse:function(h){var k=h.length;var l=[];for(var j=0;j<k;j++){l[j>>>1]|=c(h.charCodeAt(j)<<(16-(j%2)*16))}return d.create(l,k*2)}};function c(h){return((h<<8)&4278255360)|((h>>>8)&16711935)}}());(function(){if(typeof ArrayBuffer!="function"){return}var f=a;var d=f.lib;var e=d.WordArray;var c=e.init;var b=e.init=function(j){if(j instanceof ArrayBuffer){j=new Uint8Array(j)}if(j instanceof Int8Array||(typeof Uint8ClampedArray!=="undefined"&&j instanceof Uint8ClampedArray)||j instanceof Int16Array||j instanceof Uint16Array||j instanceof Int32Array||j instanceof Uint32Array||j instanceof Float32Array||j instanceof Float64Array){j=new Uint8Array(j.buffer,j.byteOffset,j.byteLength)}if(j instanceof Uint8Array){var g=j.byteLength;var k=[];for(var h=0;h<g;h++){k[h>>>2]|=j[h]<<(24-(h%4)*8)}c.call(this,k,g)}else{c.apply(this,arguments)}};b.prototype=e}());(function(g){var j=a;var t=j.lib;var r=t.WordArray;var d=t.Hasher;var b=j.algo;var s=r.create([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13]);var p=r.create([5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11]);var f=r.create([11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6]);var e=r.create([8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]);var n=r.create([0,1518500249,1859775393,2400959708,2840853838]);var h=r.create([1352829926,1548603684,1836072691,2053994217,0]);var c=b.RIPEMD160=d.extend({_doReset:function(){this._hash=r.create([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(D,B){for(var O=0;O<16;O++){var w=B+O;var C=D[w];D[w]=((((C<<8)|(C>>>24))&16711935)|(((C<<24)|(C>>>8))&4278255360))}var F=this._hash.words;var y=n.words;var S=h.words;var z=s.words;var x=p.words;var P=f.words;var L=e.words;var K,u,E,N,v;var I,Q,A,J,R;I=K=F[0];Q=u=F[1];A=E=F[2];J=N=F[3];R=v=F[4];var G;for(var O=0;O<80;O+=1){G=(K+D[B+z[O]])|0;if(O<16){G+=q(u,E,N)+y[0]}else{if(O<32){G+=o(u,E,N)+y[1]}else{if(O<48){G+=m(u,E,N)+y[2]}else{if(O<64){G+=l(u,E,N)+y[3]}else{G+=k(u,E,N)+y[4]}}}}G=G|0;G=i(G,P[O]);G=(G+v)|0;K=v;v=N;N=i(E,10);E=u;u=G;G=(I+D[B+x[O]])|0;if(O<16){G+=k(Q,A,J)+S[0]}else{if(O<32){G+=l(Q,A,J)+S[1]}else{if(O<48){G+=m(Q,A,J)+S[2]}else{if(O<64){G+=o(Q,A,J)+S[3]}else{G+=q(Q,A,J)+S[4]}}}}G=G|0;G=i(G,L[O]);G=(G+R)|0;I=R;R=J;J=i(A,10);A=Q;Q=G}G=(F[1]+E+J)|0;F[1]=(F[2]+N+R)|0;F[2]=(F[3]+v+I)|0;F[3]=(F[4]+K+Q)|0;F[4]=(F[0]+u+A)|0;F[0]=G},_doFinalize:function(){var z=this._data;var B=z.words;var u=this._nDataBytes*8;var y=z.sigBytes*8;B[y>>>5]|=128<<(24-y%32);B[(((y+64)>>>9)<<4)+14]=((((u<<8)|(u>>>24))&16711935)|(((u<<24)|(u>>>8))&4278255360));z.sigBytes=(B.length+1)*4;this._process();var A=this._hash;var w=A.words;for(var v=0;v<5;v++){var x=w[v];w[v]=(((x<<8)|(x>>>24))&16711935)|(((x<<24)|(x>>>8))&4278255360)}return A},clone:function(){var u=d.clone.call(this);u._hash=this._hash.clone();return u}});function q(u,w,v){return((u)^(w)^(v))}function o(u,w,v){return(((u)&(w))|((~u)&(v)))}function m(u,w,v){return(((u)|(~(w)))^(v))}function l(u,w,v){return(((u)&(v))|((w)&(~(v))))}function k(u,w,v){return((u)^((w)|(~(v))))}function i(u,v){return(u<<v)|(u>>>(32-v))}j.RIPEMD160=d._createHelper(c);j.HmacRIPEMD160=d._createHmacHelper(c)}(Math));(function(){var h=a;var e=h.lib;var d=e.Base;var g=h.enc;var c=g.Utf8;var f=h.algo;var b=f.HMAC=d.extend({init:function(r,o){r=this._hasher=new r.init();if(typeof o=="string"){o=c.parse(o)}var l=r.blockSize;var j=l*4;if(o.sigBytes>j){o=r.finalize(o)}o.clamp();var q=this._oKey=o.clone();var n=this._iKey=o.clone();var p=q.words;var k=n.words;for(var m=0;m<l;m++){p[m]^=1549556828;k[m]^=909522486}q.sigBytes=n.sigBytes=j;this.reset()},reset:function(){var i=this._hasher;i.reset();i.update(this._iKey)},update:function(i){this._hasher.update(i);return this},finalize:function(i){var j=this._hasher;var l=j.finalize(i);j.reset();var k=j.finalize(this._oKey.clone().concat(l));return k}})}());(function(){var i=a;var e=i.lib;var c=e.Base;var g=e.WordArray;var f=i.algo;var d=f.SHA1;var b=f.HMAC;var h=f.PBKDF2=c.extend({cfg:c.extend({keySize:128/32,hasher:d,iterations:1}),init:function(j){this.cfg=this.cfg.extend(j)},compute:function(z,s){var v=this.cfg;var t=b.create(v.hasher,z);var u=g.create();var A=g.create([1]);var x=u.words;var m=A.words;var w=v.keySize;var l=v.iterations;while(x.length<w){var n=t.update(s).finalize(A);t.reset();var k=n.words;var y=k.length;var p=n;for(var r=1;r<l;r++){p=t.finalize(p);t.reset();var q=p.words;for(var o=0;o<y;o++){k[o]^=q[o]}}u.concat(n);m[0]++}u.sigBytes=w*4;return u}});i.PBKDF2=function(k,l,j){return h.create(j).compute(k,l)}}());(function(){var h=a;var e=h.lib;var c=e.Base;var g=e.WordArray;var f=h.algo;var d=f.MD5;var b=f.EvpKDF=c.extend({cfg:c.extend({keySize:128/32,hasher:d,iterations:1}),init:function(i){this.cfg=this.cfg.extend(i)},compute:function(r,m){var k;var o=this.cfg;var s=o.hasher.create();var n=g.create();var q=n.words;var p=o.keySize;var j=o.iterations;while(q.length<p){if(k){s.update(k)}k=s.update(r).finalize(m);s.reset();for(var l=1;l<j;l++){k=s.finalize(k);s.reset()}n.concat(k)}n.sigBytes=p*4;return n}});h.EvpKDF=function(j,k,i){return b.create(i).compute(j,k)}}());(function(){var g=a;var c=g.lib;var f=c.WordArray;var d=g.algo;var e=d.SHA256;var b=d.SHA224=e.extend({_doReset:function(){this._hash=new f.init([3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428])},_doFinalize:function(){var h=e._doFinalize.call(this);h.sigBytes-=4;return h}});g.SHA224=e._createHelper(b);g.HmacSHA224=e._createHmacHelper(b)}());(function(i){var h=a;var d=h.lib;var c=d.Base;var g=d.WordArray;var b=h.x64={};var e=b.Word=c.extend({init:function(k,j){this.high=k;this.low=j}});var f=b.WordArray=c.extend({init:function(k,j){k=this.words=k||[];if(j!=i){this.sigBytes=j}else{this.sigBytes=k.length*8}},toX32:function(){var l=this.words;var k=l.length;var n=[];for(var j=0;j<k;j++){var m=l[j];n.push(m.high);n.push(m.low)}return g.create(n,this.sigBytes)},clone:function(){var m=c.clone.call(this);var l=m.words=this.words.slice(0);var k=l.length;for(var j=0;j<k;j++){l[j]=l[j].clone()}return m}})}());(function(e){var c=a;var d=c.lib;var m=d.WordArray;var h=d.Hasher;var j=c.x64;var g=j.Word;var n=c.algo;var b=[];var k=[];var l=[];(function(){var v=1,u=0;for(var z=0;z<24;z++){b[v+5*u]=((z+1)*(z+2)/2)%64;var o=u%5;var B=(2*v+3*u)%5;v=o;u=B}for(var v=0;v<5;v++){for(var u=0;u<5;u++){k[v+5*u]=u+((2*v+3*u)%5)*5}}var A=1;for(var r=0;r<24;r++){var s=0;var p=0;for(var q=0;q<7;q++){if(A&1){var w=(1<<q)-1;if(w<32){p^=1<<w}else{s^=1<<(w-32)}}if(A&128){A=(A<<1)^113}else{A<<=1}}l[r]=g.create(s,p)}}());var i=[];(function(){for(var o=0;o<25;o++){i[o]=g.create()}}());var f=n.SHA3=h.extend({cfg:h.cfg.extend({outputLength:512}),_doReset:function(){var p=this._state=[];for(var o=0;o<25;o++){p[o]=new g.init()}this.blockSize=(1600-2*this.cfg.outputLength)/32},_doProcessBlock:function(D,z){var w=this._state;var r=this.blockSize/2;for(var O=0;O<r;O++){var E=D[z+2*O];var Q=D[z+2*O+1];E=((((E<<8)|(E>>>24))&16711935)|(((E<<24)|(E>>>8))&4278255360));Q=((((Q<<8)|(Q>>>24))&16711935)|(((Q<<24)|(Q>>>8))&4278255360));var q=w[O];q.high^=Q;q.low^=E}for(var R=0;R<24;R++){for(var H=0;H<5;H++){var J=0,S=0;for(var G=0;G<5;G++){var q=w[H+5*G];J^=q.high;S^=q.low}var p=i[H];p.high=J;p.low=S}for(var H=0;H<5;H++){var v=i[(H+4)%5];var A=i[(H+1)%5];var N=A.high;var t=A.low;var J=v.high^((N<<1)|(t>>>31));var S=v.low^((t<<1)|(N>>>31));for(var G=0;G<5;G++){var q=w[H+5*G];q.high^=J;q.low^=S}}for(var u=1;u<25;u++){var J;var S;var q=w[u];var o=q.high;var I=q.low;var P=b[u];if(P<32){J=(o<<P)|(I>>>(32-P));S=(I<<P)|(o>>>(32-P))}else{J=(I<<(P-32))|(o>>>(64-P));S=(o<<(P-32))|(I>>>(64-P))}var C=i[k[u]];C.high=J;C.low=S}var K=i[0];var L=w[0];K.high=L.high;K.low=L.low;for(var H=0;H<5;H++){for(var G=0;G<5;G++){var u=H+5*G;var q=w[u];var s=i[u];var B=i[((H+1)%5)+5*G];var T=i[((H+2)%5)+5*G];q.high=s.high^(~B.high&T.high);q.low=s.low^(~B.low&T.low)}}var q=w[0];var F=l[R];q.high^=F.high;q.low^=F.low}},_doFinalize:function(){var t=this._data;var A=t.words;var w=this._nDataBytes*8;var x=t.sigBytes*8;var z=this.blockSize*32;A[x>>>5]|=1<<(24-x%32);A[((e.ceil((x+1)/z)*z)>>>5)-1]|=128;t.sigBytes=A.length*4;this._process();var o=this._state;var q=this.cfg.outputLength/8;var u=q/8;var s=[];for(var r=0;r<u;r++){var p=o[r];var y=p.high;var v=p.low;y=((((y<<8)|(y>>>24))&16711935)|(((y<<24)|(y>>>8))&4278255360));v=((((v<<8)|(v>>>24))&16711935)|(((v<<24)|(v>>>8))&4278255360));s.push(v);s.push(y)}return new m.init(s,q)},clone:function(){var q=h.clone.call(this);var p=q._state=this._state.slice(0);for(var o=0;o<25;o++){p[o]=p[o].clone()}return q}});c.SHA3=h._createHelper(f);c.HmacSHA3=h._createHmacHelper(f)}(Math));(function(){var b=a;var c=b.lib;var f=c.Hasher;var g=b.x64;var e=g.Word;var k=g.WordArray;var j=b.algo;function h(){return e.create.apply(e,arguments)}var l=[h(1116352408,3609767458),h(1899447441,602891725),h(3049323471,3964484399),h(3921009573,2173295548),h(961987163,4081628472),h(1508970993,3053834265),h(2453635748,2937671579),h(2870763221,3664609560),h(3624381080,2734883394),h(310598401,1164996542),h(607225278,1323610764),h(1426881987,3590304994),h(1925078388,4068182383),h(2162078206,991336113),h(2614888103,633803317),h(3248222580,3479774868),h(3835390401,2666613458),h(4022224774,944711139),h(264347078,2341262773),h(604807628,2007800933),h(770255983,1495990901),h(1249150122,1856431235),h(1555081692,3175218132),h(1996064986,2198950837),h(2554220882,3999719339),h(2821834349,766784016),h(2952996808,2566594879),h(3210313671,3203337956),h(3336571891,1034457026),h(3584528711,2466948901),h(113926993,3758326383),h(338241895,168717936),h(666307205,1188179964),h(773529912,1546045734),h(1294757372,1522805485),h(1396182291,2643833823),h(1695183700,2343527390),h(1986661051,1014477480),h(2177026350,1206759142),h(2456956037,344077627),h(2730485921,1290863460),h(2820302411,3158454273),h(3259730800,3505952657),h(3345764771,106217008),h(3516065817,3606008344),h(3600352804,1432725776),h(4094571909,1467031594),h(275423344,851169720),h(430227734,3100823752),h(506948616,1363258195),h(659060556,3750685593),h(883997877,3785050280),h(958139571,3318307427),h(1322822218,3812723403),h(1537002063,2003034995),h(1747873779,3602036899),h(1955562222,1575990012),h(2024104815,1125592928),h(2227730452,2716904306),h(2361852424,442776044),h(2428436474,593698344),h(2756734187,3733110249),h(3204031479,2999351573),h(3329325298,3815920427),h(3391569614,3928383900),h(3515267271,566280711),h(3940187606,3454069534),h(4118630271,4000239992),h(116418474,1914138554),h(174292421,2731055270),h(289380356,3203993006),h(460393269,320620315),h(685471733,587496836),h(852142971,1086792851),h(1017036298,365543100),h(1126000580,2618297676),h(1288033470,3409855158),h(1501505948,4234509866),h(1607167915,987167468),h(1816402316,1246189591)];var d=[];(function(){for(var m=0;m<80;m++){d[m]=h()}}());var i=j.SHA512=f.extend({_doReset:function(){this._hash=new k.init([new e.init(1779033703,4089235720),new e.init(3144134277,2227873595),new e.init(1013904242,4271175723),new e.init(2773480762,1595750129),new e.init(1359893119,2917565137),new e.init(2600822924,725511199),new e.init(528734635,4215389547),new e.init(1541459225,327033209)])},_doProcessBlock:function(ap,D){var aq=this._hash.words;var z=aq[0];var w=aq[1];var u=aq[2];var t=aq[3];var r=aq[4];var p=aq[5];var n=aq[6];var m=aq[7];var U=z.high;var S=z.low;var L=w.high;var J=w.low;var B=u.high;var y=u.low;var aN=t.high;var aL=t.low;var aF=r.high;var aC=r.low;var ao=p.high;var am=p.low;var W=n.high;var V=n.low;var O=m.high;var N=m.low;var az=U;var aw=S;var ai=L;var af=J;var T=B;var R=y;var K=aN;var I=aL;var A=aF;var s=aC;var aM=ao;var aK=am;var aD=W;var aA=V;var an=O;var aj=N;for(var Y=0;Y<80;Y++){var at;var av;var Q=d[Y];if(Y<16){av=Q.high=ap[D+Y*2]|0;at=Q.low=ap[D+Y*2+1]|0}else{var ar=d[Y-15];var G=ar.high;var F=ar.low;var aB=((G>>>1)|(F<<31))^((G>>>8)|(F<<24))^(G>>>7);var ay=((F>>>1)|(G<<31))^((F>>>8)|(G<<24))^((F>>>7)|(G<<25));var ab=d[Y-2];var E=ab.high;var C=ab.low;var ak=((E>>>19)|(C<<13))^((E<<3)|(C>>>29))^(E>>>6);var ag=((C>>>19)|(E<<13))^((C<<3)|(E>>>29))^((C>>>6)|(E<<26));var aO=d[Y-7];var ae=aO.high;var ac=aO.low;var aE=d[Y-16];var ad=aE.high;var aa=aE.low;at=ay+ac;av=aB+ae+((at>>>0)<(ay>>>0)?1:0);at=at+ag;av=av+ak+((at>>>0)<(ag>>>0)?1:0);at=at+aa;av=av+ad+((at>>>0)<(aa>>>0)?1:0);Q.high=av;Q.low=at}var Z=(A&aM)^(~A&aD);var X=(s&aK)^(~s&aA);var x=(az&ai)^(az&T)^(ai&T);var q=(aw&af)^(aw&R)^(af&R);var aQ=((az>>>28)|(aw<<4))^((az<<30)|(aw>>>2))^((az<<25)|(aw>>>7));var aP=((aw>>>28)|(az<<4))^((aw<<30)|(az>>>2))^((aw<<25)|(az>>>7));var aH=((A>>>14)|(s<<18))^((A>>>18)|(s<<14))^((A<<23)|(s>>>9));var aG=((s>>>14)|(A<<18))^((s>>>18)|(A<<14))^((s<<23)|(A>>>9));var P=l[Y];var v=P.high;var o=P.low;var aI=aj+aG;var aJ=an+aH+((aI>>>0)<(aj>>>0)?1:0);var aI=aI+X;var aJ=aJ+Z+((aI>>>0)<(X>>>0)?1:0);var aI=aI+o;var aJ=aJ+v+((aI>>>0)<(o>>>0)?1:0);var aI=aI+at;var aJ=aJ+av+((aI>>>0)<(at>>>0)?1:0);var au=aP+q;var ax=aQ+x+((au>>>0)<(aP>>>0)?1:0);an=aD;aj=aA;aD=aM;aA=aK;aM=A;aK=s;s=(I+aI)|0;A=(K+aJ+((s>>>0)<(I>>>0)?1:0))|0;K=T;I=R;T=ai;R=af;ai=az;af=aw;aw=(aI+au)|0;az=(aJ+ax+((aw>>>0)<(aI>>>0)?1:0))|0}S=z.low=(S+aw);z.high=(U+az+((S>>>0)<(aw>>>0)?1:0));J=w.low=(J+af);w.high=(L+ai+((J>>>0)<(af>>>0)?1:0));y=u.low=(y+R);u.high=(B+T+((y>>>0)<(R>>>0)?1:0));aL=t.low=(aL+I);t.high=(aN+K+((aL>>>0)<(I>>>0)?1:0));aC=r.low=(aC+s);r.high=(aF+A+((aC>>>0)<(s>>>0)?1:0));am=p.low=(am+aK);p.high=(ao+aM+((am>>>0)<(aK>>>0)?1:0));V=n.low=(V+aA);n.high=(W+aD+((V>>>0)<(aA>>>0)?1:0));N=m.low=(N+aj);m.high=(O+an+((N>>>0)<(aj>>>0)?1:0))},_doFinalize:function(){var o=this._data;var q=o.words;var m=this._nDataBytes*8;var n=o.sigBytes*8;q[n>>>5]|=128<<(24-n%32);q[(((n+128)>>>10)<<5)+30]=Math.floor(m/4294967296);q[(((n+128)>>>10)<<5)+31]=m;o.sigBytes=q.length*4;this._process();var p=this._hash.toX32();return p},clone:function(){var m=f.clone.call(this);m._hash=this._hash.clone();return m},blockSize:1024/32});b.SHA512=f._createHelper(i);b.HmacSHA512=f._createHmacHelper(i)}());(function(){var h=a;var c=h.x64;var f=c.Word;var g=c.WordArray;var e=h.algo;var d=e.SHA512;var b=e.SHA384=d.extend({_doReset:function(){this._hash=new g.init([new f.init(3418070365,3238371032),new f.init(1654270250,914150663),new f.init(2438529370,812702999),new f.init(355462360,4144912697),new f.init(1731405415,4290775857),new f.init(2394180231,1750603025),new f.init(3675008525,1694076839),new f.init(1203062813,3204075428)])},_doFinalize:function(){var i=d._doFinalize.call(this);i.sigBytes-=16;return i}});h.SHA384=d._createHelper(b);h.HmacSHA384=d._createHmacHelper(b)}());a.lib.Cipher||(function(e){var n=a;var x=n.lib;var j=x.Base;var u=x.WordArray;var w=x.BufferedBlockAlgorithm;var s=n.enc;var g=s.Utf8;var m=s.Base64;var c=n.algo;var i=c.EvpKDF;var k=x.Cipher=w.extend({cfg:j.extend(),createEncryptor:function(C,B){return this.create(this._ENC_XFORM_MODE,C,B)},createDecryptor:function(C,B){return this.create(this._DEC_XFORM_MODE,C,B)},init:function(D,C,B){this.cfg=this.cfg.extend(B);this._xformMode=D;this._key=C;this.reset()},reset:function(){w.reset.call(this);this._doReset()},process:function(B){this._append(B);return this._process()},finalize:function(C){if(C){this._append(C)}var B=this._doFinalize();return B},keySize:128/32,ivSize:128/32,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:(function(){function B(C){if(typeof C=="string"){return h}else{return A}}return function(C){return{encrypt:function(F,E,D){return B(E).encrypt(C,F,E,D)},decrypt:function(F,E,D){return B(E).decrypt(C,F,E,D)}}}}())});var q=x.StreamCipher=k.extend({_doFinalize:function(){var B=this._process(!!"flush");return B},blockSize:1});var t=n.mode={};var z=x.BlockCipherMode=j.extend({createEncryptor:function(B,C){return this.Encryptor.create(B,C)},createDecryptor:function(B,C){return this.Decryptor.create(B,C)},init:function(B,C){this._cipher=B;this._iv=C}});var d=t.CBC=(function(){var B=z.extend();B.Encryptor=B.extend({processBlock:function(G,F){var D=this._cipher;var E=D.blockSize;C.call(this,G,F,E);D.encryptBlock(G,F);this._prevBlock=G.slice(F,F+E)}});B.Decryptor=B.extend({processBlock:function(H,G){var D=this._cipher;var F=D.blockSize;var E=H.slice(G,G+F);D.decryptBlock(H,G);C.call(this,H,G,F);this._prevBlock=E}});function C(I,H,F){var G;var D=this._iv;if(D){G=D;this._iv=e}else{G=this._prevBlock}for(var E=0;E<F;E++){I[H+E]^=G[E]}}return B}());var f=n.pad={};var b=f.Pkcs7={pad:function(G,E){var F=E*4;var I=F-G.sigBytes%F;var B=(I<<24)|(I<<16)|(I<<8)|I;var D=[];for(var C=0;C<I;C+=4){D.push(B)}var H=u.create(D,I);G.concat(H)},unpad:function(B){var C=B.words[(B.sigBytes-1)>>>2]&255;B.sigBytes-=C}};var r=x.BlockCipher=k.extend({cfg:k.cfg.extend({mode:d,padding:b}),reset:function(){var D;k.reset.call(this);var B=this.cfg;var C=B.iv;var E=B.mode;if(this._xformMode==this._ENC_XFORM_MODE){D=E.createEncryptor}else{D=E.createDecryptor;this._minBufferSize=1}if(this._mode&&this._mode.__creator==D){this._mode.init(this,C&&C.words)}else{this._mode=D.call(E,this,C&&C.words);this._mode.__creator=D}},_doProcessBlock:function(C,B){this._mode.processBlock(C,B)},_doFinalize:function(){var B;var C=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){C.pad(this._data,this.blockSize);B=this._process(!!"flush")}else{B=this._process(!!"flush");C.unpad(B)}return B},blockSize:128/32});var p=x.CipherParams=j.extend({init:function(B){this.mixIn(B)},toString:function(B){return(B||this.formatter).stringify(this)}});var o=n.format={};var v=o.OpenSSL={stringify:function(B){var E;var D=B.ciphertext;var C=B.salt;if(C){E=u.create([1398893684,1701076831]).concat(C).concat(D)}else{E=D}return E.toString(m)},parse:function(D){var B;var C=m.parse(D);var E=C.words;if(E[0]==1398893684&&E[1]==1701076831){B=u.create(E.slice(2,4));E.splice(0,4);C.sigBytes-=16}return p.create({ciphertext:C,salt:B})}};var A=x.SerializableCipher=j.extend({cfg:j.extend({format:v}),encrypt:function(B,G,E,C){C=this.cfg.extend(C);var D=B.createEncryptor(E,C);var H=D.finalize(G);var F=D.cfg;return p.create({ciphertext:H,key:E,iv:F.iv,algorithm:B,mode:F.mode,padding:F.padding,blockSize:B.blockSize,formatter:C.format})},decrypt:function(B,F,D,C){C=this.cfg.extend(C);F=this._parse(F,C.format);var E=B.createDecryptor(D,C).finalize(F.ciphertext);return E},_parse:function(B,C){if(typeof B=="string"){return C.parse(B,this)}else{return B}}});var l=n.kdf={};var y=l.OpenSSL={execute:function(D,G,B,F){if(!F){F=u.random(64/8)}var E=i.create({keySize:G+B}).compute(D,F);var C=u.create(E.words.slice(G),B*4);E.sigBytes=G*4;return p.create({key:E,iv:C,salt:F})}};var h=x.PasswordBasedCipher=A.extend({cfg:A.cfg.extend({kdf:y}),encrypt:function(B,E,D,C){C=this.cfg.extend(C);var G=C.kdf.execute(D,B.keySize,B.ivSize);C.iv=G.iv;var F=A.encrypt.call(this,B,E,G.key,C);F.mixIn(G);return F},decrypt:function(B,F,D,C){C=this.cfg.extend(C);F=this._parse(F,C.format);var G=C.kdf.execute(D,B.keySize,B.ivSize,F.salt);C.iv=G.iv;var E=A.decrypt.call(this,B,F,G.key,C);return E}})}());a.mode.CFB=(function(){var c=a.lib.BlockCipherMode.extend();c.Encryptor=c.extend({processBlock:function(g,f){var d=this._cipher;var e=d.blockSize;b.call(this,g,f,e,d);this._prevBlock=g.slice(f,f+e)}});c.Decryptor=c.extend({processBlock:function(h,g){var d=this._cipher;var f=d.blockSize;var e=h.slice(g,g+f);b.call(this,h,g,f,d);this._prevBlock=e}});function b(k,j,g,d){var h;var e=this._iv;if(e){h=e.slice(0);this._iv=undefined}else{h=this._prevBlock}d.encryptBlock(h,0);for(var f=0;f<g;f++){k[j+f]^=h[f]}}return c}());a.mode.ECB=(function(){var b=a.lib.BlockCipherMode.extend();b.Encryptor=b.extend({processBlock:function(d,c){this._cipher.encryptBlock(d,c)}});b.Decryptor=b.extend({processBlock:function(d,c){this._cipher.decryptBlock(d,c)}});return b}());a.pad.AnsiX923={pad:function(e,c){var g=e.sigBytes;var d=c*4;var f=d-g%d;var b=g+f-1;e.clamp();e.words[b>>>2]|=f<<(24-(b%4)*8);e.sigBytes+=f},unpad:function(b){var c=b.words[(b.sigBytes-1)>>>2]&255;b.sigBytes-=c}};a.pad.Iso10126={pad:function(d,b){var c=b*4;var e=c-d.sigBytes%c;d.concat(a.lib.WordArray.random(e-1)).concat(a.lib.WordArray.create([e<<24],1))},unpad:function(b){var c=b.words[(b.sigBytes-1)>>>2]&255;b.sigBytes-=c}};a.pad.Iso97971={pad:function(c,b){c.concat(a.lib.WordArray.create([2147483648],1));a.pad.ZeroPadding.pad(c,b)},unpad:function(b){a.pad.ZeroPadding.unpad(b);b.sigBytes--}};a.mode.OFB=(function(){var c=a.lib.BlockCipherMode.extend();var b=c.Encryptor=c.extend({processBlock:function(k,j){var d=this._cipher;var g=d.blockSize;var e=this._iv;var h=this._keystream;if(e){h=this._keystream=e.slice(0);this._iv=undefined}d.encryptBlock(h,0);for(var f=0;f<g;f++){k[j+f]^=h[f]}}});c.Decryptor=b;return c}());a.pad.NoPadding={pad:function(){},unpad:function(){}};(function(h){var g=a;var d=g.lib;var c=d.CipherParams;var f=g.enc;var b=f.Hex;var i=g.format;var e=i.Hex={stringify:function(j){return j.ciphertext.toString(b)},parse:function(j){var k=b.parse(j);return c.create({ciphertext:k})}}}());(function(){var b=a;var c=b.lib;var q=c.BlockCipher;var l=b.algo;var e=[];var m=[];var p=[];var o=[];var n=[];var k=[];var j=[];var i=[];var h=[];var g=[];(function(){var u=[];for(var s=0;s<256;s++){if(s<128){u[s]=s<<1}else{u[s]=(s<<1)^283}}var y=0;var v=0;for(var s=0;s<256;s++){var w=v^(v<<1)^(v<<2)^(v<<3)^(v<<4);w=(w>>>8)^(w&255)^99;e[y]=w;m[w]=y;var r=u[y];var B=u[r];var z=u[B];var A=(u[w]*257)^(w*16843008);p[y]=(A<<24)|(A>>>8);o[y]=(A<<16)|(A>>>16);n[y]=(A<<8)|(A>>>24);k[y]=A;var A=(z*16843009)^(B*65537)^(r*257)^(y*16843008);j[w]=(A<<24)|(A>>>8);i[w]=(A<<16)|(A>>>16);h[w]=(A<<8)|(A>>>24);g[w]=A;if(!y){y=v=1}else{y=r^u[u[u[z^r]]];v^=u[u[v]]}}}());var d=[0,1,2,4,8,16,32,64,128,27,54];var f=l.AES=q.extend({_doReset:function(){var B;if(this._nRounds&&this._keyPriorReset===this._key){return}var A=this._keyPriorReset=this._key;var s=A.words;var z=A.sigBytes/4;var y=this._nRounds=z+6;var r=(y+1)*4;var u=this._keySchedule=[];for(var x=0;x<r;x++){if(x<z){u[x]=s[x]}else{B=u[x-1];if(!(x%z)){B=(B<<8)|(B>>>24);B=(e[B>>>24]<<24)|(e[(B>>>16)&255]<<16)|(e[(B>>>8)&255]<<8)|e[B&255];B^=d[(x/z)|0]<<24}else{if(z>6&&x%z==4){B=(e[B>>>24]<<24)|(e[(B>>>16)&255]<<16)|(e[(B>>>8)&255]<<8)|e[B&255]}}u[x]=u[x-z]^B}}var v=this._invKeySchedule=[];for(var w=0;w<r;w++){var x=r-w;if(w%4){var B=u[x]}else{var B=u[x-4]}if(w<4||x<=4){v[w]=B}else{v[w]=j[e[B>>>24]]^i[e[(B>>>16)&255]]^h[e[(B>>>8)&255]]^g[e[B&255]]}}},encryptBlock:function(s,r){this._doCryptBlock(s,r,this._keySchedule,p,o,n,k,e)},decryptBlock:function(u,s){var r=u[s+1];u[s+1]=u[s+3];u[s+3]=r;this._doCryptBlock(u,s,this._invKeySchedule,j,i,h,g,m);var r=u[s+1];u[s+1]=u[s+3];u[s+3]=r},_doCryptBlock:function(A,z,I,w,u,s,r,H){var F=this._nRounds;var y=A[z]^I[0];var x=A[z+1]^I[1];var v=A[z+2]^I[2];var t=A[z+3]^I[3];var G=4;for(var J=1;J<F;J++){var E=w[y>>>24]^u[(x>>>16)&255]^s[(v>>>8)&255]^r[t&255]^I[G++];var D=w[x>>>24]^u[(v>>>16)&255]^s[(t>>>8)&255]^r[y&255]^I[G++];var C=w[v>>>24]^u[(t>>>16)&255]^s[(y>>>8)&255]^r[x&255]^I[G++];var B=w[t>>>24]^u[(y>>>16)&255]^s[(x>>>8)&255]^r[v&255]^I[G++];y=E;x=D;v=C;t=B}var E=((H[y>>>24]<<24)|(H[(x>>>16)&255]<<16)|(H[(v>>>8)&255]<<8)|H[t&255])^I[G++];var D=((H[x>>>24]<<24)|(H[(v>>>16)&255]<<16)|(H[(t>>>8)&255]<<8)|H[y&255])^I[G++];var C=((H[v>>>24]<<24)|(H[(t>>>16)&255]<<16)|(H[(y>>>8)&255]<<8)|H[x&255])^I[G++];var B=((H[t>>>24]<<24)|(H[(y>>>16)&255]<<16)|(H[(x>>>8)&255]<<8)|H[v&255])^I[G++];A[z]=E;A[z+1]=D;A[z+2]=C;A[z+3]=B},keySize:256/32});b.AES=q._createHelper(f)}());(function(){var b=a;var c=b.lib;var i=c.WordArray;var n=c.BlockCipher;var j=b.algo;var o=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4];var m=[14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32];var l=[1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28];var k=[{0:8421888,268435456:32768,536870912:8421378,805306368:2,1073741824:512,1342177280:8421890,1610612736:8389122,1879048192:8388608,2147483648:514,2415919104:8389120,2684354560:33280,2952790016:8421376,3221225472:32770,3489660928:8388610,3758096384:0,4026531840:33282,134217728:0,402653184:8421890,671088640:33282,939524096:32768,1207959552:8421888,1476395008:512,1744830464:8421378,2013265920:2,2281701376:8389120,2550136832:33280,2818572288:8421376,3087007744:8389122,3355443200:8388610,3623878656:32770,3892314112:514,4160749568:8388608,1:32768,268435457:2,536870913:8421888,805306369:8388608,1073741825:8421378,1342177281:33280,1610612737:512,1879048193:8389122,2147483649:8421890,2415919105:8421376,2684354561:8388610,2952790017:33282,3221225473:514,3489660929:8389120,3758096385:32770,4026531841:0,134217729:8421890,402653185:8421376,671088641:8388608,939524097:512,1207959553:32768,1476395009:8388610,1744830465:2,2013265921:33282,2281701377:32770,2550136833:8389122,2818572289:514,3087007745:8421888,3355443201:8389120,3623878657:0,3892314113:33280,4160749569:8421378},{0:1074282512,16777216:16384,33554432:524288,50331648:1074266128,67108864:1073741840,83886080:1074282496,100663296:1073758208,117440512:16,134217728:540672,150994944:1073758224,167772160:1073741824,184549376:540688,201326592:524304,218103808:0,234881024:16400,251658240:1074266112,8388608:1073758208,25165824:540688,41943040:16,58720256:1073758224,75497472:1074282512,92274688:1073741824,109051904:524288,125829120:1074266128,142606336:524304,159383552:0,176160768:16384,192937984:1074266112,209715200:1073741840,226492416:540672,243269632:1074282496,260046848:16400,268435456:0,285212672:1074266128,301989888:1073758224,318767104:1074282496,335544320:1074266112,352321536:16,369098752:540688,385875968:16384,402653184:16400,419430400:524288,436207616:524304,452984832:1073741840,469762048:540672,486539264:1073758208,503316480:1073741824,520093696:1074282512,276824064:540688,293601280:524288,310378496:1074266112,327155712:16384,343932928:1073758208,360710144:1074282512,377487360:16,394264576:1073741824,411041792:1074282496,427819008:1073741840,444596224:1073758224,461373440:524304,478150656:0,494927872:16400,511705088:1074266128,528482304:540672},{0:260,1048576:0,2097152:67109120,3145728:65796,4194304:65540,5242880:67108868,6291456:67174660,7340032:67174400,8388608:67108864,9437184:67174656,10485760:65792,11534336:67174404,12582912:67109124,13631488:65536,14680064:4,15728640:256,524288:67174656,1572864:67174404,2621440:0,3670016:67109120,4718592:67108868,5767168:65536,6815744:65540,7864320:260,8912896:4,9961472:256,11010048:67174400,12058624:65796,13107200:65792,14155776:67109124,15204352:67174660,16252928:67108864,16777216:67174656,17825792:65540,18874368:65536,19922944:67109120,20971520:256,22020096:67174660,23068672:67108868,24117248:0,25165824:67109124,26214400:67108864,27262976:4,28311552:65792,29360128:67174400,30408704:260,31457280:65796,32505856:67174404,17301504:67108864,18350080:260,19398656:67174656,20447232:0,21495808:65540,22544384:67109120,23592960:256,24641536:67174404,25690112:65536,26738688:67174660,27787264:65796,28835840:67108868,29884416:67109124,30932992:67174400,31981568:4,33030144:65792},{0:2151682048,65536:2147487808,131072:4198464,196608:2151677952,262144:0,327680:4198400,393216:2147483712,458752:4194368,524288:2147483648,589824:4194304,655360:64,720896:2147487744,786432:2151678016,851968:4160,917504:4096,983040:2151682112,32768:2147487808,98304:64,163840:2151678016,229376:2147487744,294912:4198400,360448:2151682112,425984:0,491520:2151677952,557056:4096,622592:2151682048,688128:4194304,753664:4160,819200:2147483648,884736:4194368,950272:4198464,1015808:2147483712,1048576:4194368,1114112:4198400,1179648:2147483712,1245184:0,1310720:4160,1376256:2151678016,1441792:2151682048,1507328:2147487808,1572864:2151682112,1638400:2147483648,1703936:2151677952,1769472:4198464,1835008:2147487744,1900544:4194304,1966080:64,2031616:4096,1081344:2151677952,1146880:2151682112,1212416:0,1277952:4198400,1343488:4194368,1409024:2147483648,1474560:2147487808,1540096:64,1605632:2147483712,1671168:4096,1736704:2147487744,1802240:2151678016,1867776:4160,1933312:2151682048,1998848:4194304,2064384:4198464},{0:128,4096:17039360,8192:262144,12288:536870912,16384:537133184,20480:16777344,24576:553648256,28672:262272,32768:16777216,36864:537133056,40960:536871040,45056:553910400,49152:553910272,53248:0,57344:17039488,61440:553648128,2048:17039488,6144:553648256,10240:128,14336:17039360,18432:262144,22528:537133184,26624:553910272,30720:536870912,34816:537133056,38912:0,43008:553910400,47104:16777344,51200:536871040,55296:553648128,59392:16777216,63488:262272,65536:262144,69632:128,73728:536870912,77824:553648256,81920:16777344,86016:553910272,90112:537133184,94208:16777216,98304:553910400,102400:553648128,106496:17039360,110592:537133056,114688:262272,118784:536871040,122880:0,126976:17039488,67584:553648256,71680:16777216,75776:17039360,79872:537133184,83968:536870912,88064:17039488,92160:128,96256:553910272,100352:262272,104448:553910400,108544:0,112640:553648128,116736:16777344,120832:262144,124928:537133056,129024:536871040},{0:268435464,256:8192,512:270532608,768:270540808,1024:268443648,1280:2097152,1536:2097160,1792:268435456,2048:0,2304:268443656,2560:2105344,2816:8,3072:270532616,3328:2105352,3584:8200,3840:270540800,128:270532608,384:270540808,640:8,896:2097152,1152:2105352,1408:268435464,1664:268443648,1920:8200,2176:2097160,2432:8192,2688:268443656,2944:270532616,3200:0,3456:270540800,3712:2105344,3968:268435456,4096:268443648,4352:270532616,4608:270540808,4864:8200,5120:2097152,5376:268435456,5632:268435464,5888:2105344,6144:2105352,6400:0,6656:8,6912:270532608,7168:8192,7424:268443656,7680:270540800,7936:2097160,4224:8,4480:2105344,4736:2097152,4992:268435464,5248:268443648,5504:8200,5760:270540808,6016:270532608,6272:270540800,6528:270532616,6784:8192,7040:2105352,7296:2097160,7552:0,7808:268435456,8064:268443656},{0:1048576,16:33555457,32:1024,48:1049601,64:34604033,80:0,96:1,112:34603009,128:33555456,144:1048577,160:33554433,176:34604032,192:34603008,208:1025,224:1049600,240:33554432,8:34603009,24:0,40:33555457,56:34604032,72:1048576,88:33554433,104:33554432,120:1025,136:1049601,152:33555456,168:34603008,184:1048577,200:1024,216:34604033,232:1,248:1049600,256:33554432,272:1048576,288:33555457,304:34603009,320:1048577,336:33555456,352:34604032,368:1049601,384:1025,400:34604033,416:1049600,432:1,448:0,464:34603008,480:33554433,496:1024,264:1049600,280:33555457,296:34603009,312:1,328:33554432,344:1048576,360:1025,376:34604032,392:33554433,408:34603008,424:0,440:34604033,456:1049601,472:1024,488:33555456,504:1048577},{0:134219808,1:131072,2:134217728,3:32,4:131104,5:134350880,6:134350848,7:2048,8:134348800,9:134219776,10:133120,11:134348832,12:2080,13:0,14:134217760,15:133152,2147483648:2048,2147483649:134350880,2147483650:134219808,2147483651:134217728,2147483652:134348800,2147483653:133120,2147483654:133152,2147483655:32,2147483656:134217760,2147483657:2080,2147483658:131104,2147483659:134350848,2147483660:0,2147483661:134348832,2147483662:134219776,2147483663:131072,16:133152,17:134350848,18:32,19:2048,20:134219776,21:134217760,22:134348832,23:131072,24:0,25:131104,26:134348800,27:134219808,28:134350880,29:133120,30:2080,31:134217728,2147483664:131072,2147483665:2048,2147483666:134348832,2147483667:133152,2147483668:32,2147483669:134348800,2147483670:134217728,2147483671:134219808,2147483672:134350880,2147483673:134217760,2147483674:134219776,2147483675:0,2147483676:133120,2147483677:2080,2147483678:131104,2147483679:134350848}];var g=[4160749569,528482304,33030144,2064384,129024,8064,504,2147483679];var d=j.DES=n.extend({_doReset:function(){var x=this._key;var r=x.words;var w=[];for(var v=0;v<56;v++){var t=o[v]-1;w[v]=(r[t>>>5]>>>(31-t%32))&1}var p=this._subKeys=[];for(var s=0;s<16;s++){var u=p[s]=[];var y=l[s];for(var v=0;v<24;v++){u[(v/6)|0]|=w[((m[v]-1)+y)%28]<<(31-v%6);u[4+((v/6)|0)]|=w[28+(((m[v+24]-1)+y)%28)]<<(31-v%6)}u[0]=(u[0]<<1)|(u[0]>>>31);for(var v=1;v<7;v++){u[v]=u[v]>>>((v-1)*4+3)}u[7]=(u[7]<<5)|(u[7]>>>27)}var q=this._invSubKeys=[];for(var v=0;v<16;v++){q[v]=p[15-v]}},encryptBlock:function(q,p){this._doCryptBlock(q,p,this._subKeys)},decryptBlock:function(q,p){this._doCryptBlock(q,p,this._invSubKeys)},_doCryptBlock:function(x,s,q){this._lBlock=x[s];this._rBlock=x[s+1];e.call(this,4,252645135);e.call(this,16,65535);f.call(this,2,858993459);f.call(this,8,16711935);e.call(this,1,1431655765);for(var z=0;z<16;z++){var v=q[z];var r=this._lBlock;var p=this._rBlock;var w=0;for(var u=0;u<8;u++){w|=k[u][((p^v[u])&g[u])>>>0]}this._lBlock=p;this._rBlock=r^w}var y=this._lBlock;this._lBlock=this._rBlock;this._rBlock=y;e.call(this,1,1431655765);f.call(this,8,16711935);f.call(this,2,858993459);e.call(this,16,65535);e.call(this,4,252645135);x[s]=this._lBlock;x[s+1]=this._rBlock},keySize:64/32,ivSize:64/32,blockSize:64/32});function e(r,p){var q=((this._lBlock>>>r)^this._rBlock)&p;this._rBlock^=q;this._lBlock^=q<<r}function f(r,p){var q=((this._rBlock>>>r)^this._lBlock)&p;this._lBlock^=q;this._rBlock^=q<<r}b.DES=n._createHelper(d);var h=j.TripleDES=n.extend({_doReset:function(){var q=this._key;var t=q.words;if(t.length!==2&&t.length!==4&&t.length<6){throw new Error("Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.")}var s=t.slice(0,2);var r=t.length<4?t.slice(0,2):t.slice(2,4);var p=t.length<6?t.slice(0,2):t.slice(4,6);this._des1=d.createEncryptor(i.create(s));this._des2=d.createEncryptor(i.create(r));this._des3=d.createEncryptor(i.create(p))},encryptBlock:function(q,p){this._des1.encryptBlock(q,p);this._des2.decryptBlock(q,p);this._des3.encryptBlock(q,p)},decryptBlock:function(q,p){this._des3.decryptBlock(q,p);this._des2.encryptBlock(q,p);this._des1.decryptBlock(q,p)},keySize:192/32,ivSize:64/32,blockSize:64/32});b.TripleDES=n._createHelper(h)}());(function(){var g=a;var c=g.lib;var h=c.StreamCipher;var e=g.algo;var d=e.RC4=h.extend({_doReset:function(){var q=this._key;var k=q.words;var l=q.sigBytes;var m=this._S=[];for(var o=0;o<256;o++){m[o]=o}for(var o=0,n=0;o<256;o++){var s=o%l;var p=(k[s>>>2]>>>(24-(s%4)*8))&255;n=(n+m[o]+p)%256;var r=m[o];m[o]=m[n];m[n]=r}this._i=this._j=0},_doProcessBlock:function(j,i){j[i]^=f.call(this)},keySize:256/32,ivSize:0});function f(){var o=this._S;var m=this._i;var k=this._j;var p=0;for(var q=0;q<4;q++){m=(m+1)%256;k=(k+o[m])%256;var l=o[m];o[m]=o[k];o[k]=l;p|=o[(o[m]+o[k])%256]<<(24-q*8)}this._i=m;this._j=k;return p}g.RC4=h._createHelper(d);var b=e.RC4Drop=d.extend({cfg:d.cfg.extend({drop:192}),_doReset:function(){d._doReset.call(this);for(var j=this.cfg.drop;j>0;j--){f.call(this)}}});g.RC4Drop=h._createHelper(b)}());a.mode.CTRGladman=(function(){var b=a.lib.BlockCipherMode.extend();function e(i){if(((i>>24)&255)===255){var h=(i>>16)&255;var g=(i>>8)&255;var f=i&255;if(h===255){h=0;if(g===255){g=0;if(f===255){f=0}else{++f}}else{++g}}else{++h}i=0;i+=(h<<16);i+=(g<<8);i+=f}else{i+=(1<<24)}return i}function d(f){if((f[0]=e(f[0]))===0){f[1]=e(f[1])}return f}var c=b.Encryptor=b.extend({processBlock:function(n,m){var f=this._cipher;var k=f.blockSize;var h=this._iv;var g=this._counter;if(h){g=this._counter=h.slice(0);this._iv=undefined}d(g);var l=g.slice(0);f.encryptBlock(l,0);for(var j=0;j<k;j++){n[m+j]^=l[j]}}});b.Decryptor=c;return b}());(function(){var b=a;var c=b.lib;var d=c.StreamCipher;var g=b.algo;var e=[];var f=[];var h=[];var i=g.Rabbit=d.extend({_doReset:function(){var u=this._key.words;var p=this.cfg.iv;for(var r=0;r<4;r++){u[r]=(((u[r]<<8)|(u[r]>>>24))&16711935)|(((u[r]<<24)|(u[r]>>>8))&4278255360)}var l=this._X=[u[0],(u[3]<<16)|(u[2]>>>16),u[1],(u[0]<<16)|(u[3]>>>16),u[2],(u[1]<<16)|(u[0]>>>16),u[3],(u[2]<<16)|(u[1]>>>16)];var k=this._C=[(u[2]<<16)|(u[2]>>>16),(u[0]&4294901760)|(u[1]&65535),(u[3]<<16)|(u[3]>>>16),(u[1]&4294901760)|(u[2]&65535),(u[0]<<16)|(u[0]>>>16),(u[2]&4294901760)|(u[3]&65535),(u[1]<<16)|(u[1]>>>16),(u[3]&4294901760)|(u[0]&65535)];this._b=0;for(var r=0;r<4;r++){j.call(this)}for(var r=0;r<8;r++){k[r]^=l[(r+4)&7]}if(p){var v=p.words;var t=v[0];var s=v[1];var q=(((t<<8)|(t>>>24))&16711935)|(((t<<24)|(t>>>8))&4278255360);var n=(((s<<8)|(s>>>24))&16711935)|(((s<<24)|(s>>>8))&4278255360);var o=(q>>>16)|(n&4294901760);var m=(n<<16)|(q&65535);k[0]^=q;k[1]^=o;k[2]^=n;k[3]^=m;k[4]^=q;k[5]^=o;k[6]^=n;k[7]^=m;for(var r=0;r<4;r++){j.call(this)}}},_doProcessBlock:function(n,l){var m=this._X;j.call(this);e[0]=m[0]^(m[5]>>>16)^(m[3]<<16);e[1]=m[2]^(m[7]>>>16)^(m[5]<<16);e[2]=m[4]^(m[1]>>>16)^(m[7]<<16);e[3]=m[6]^(m[3]>>>16)^(m[1]<<16);for(var k=0;k<4;k++){e[k]=(((e[k]<<8)|(e[k]>>>24))&16711935)|(((e[k]<<24)|(e[k]>>>8))&4278255360);n[l+k]^=e[k]}},blockSize:128/32,ivSize:64/32});function j(){var r=this._X;var q=this._C;for(var l=0;l<8;l++){f[l]=q[l]}q[0]=(q[0]+1295307597+this._b)|0;q[1]=(q[1]+3545052371+((q[0]>>>0)<(f[0]>>>0)?1:0))|0;q[2]=(q[2]+886263092+((q[1]>>>0)<(f[1]>>>0)?1:0))|0;q[3]=(q[3]+1295307597+((q[2]>>>0)<(f[2]>>>0)?1:0))|0;q[4]=(q[4]+3545052371+((q[3]>>>0)<(f[3]>>>0)?1:0))|0;q[5]=(q[5]+886263092+((q[4]>>>0)<(f[4]>>>0)?1:0))|0;q[6]=(q[6]+1295307597+((q[5]>>>0)<(f[5]>>>0)?1:0))|0;q[7]=(q[7]+3545052371+((q[6]>>>0)<(f[6]>>>0)?1:0))|0;this._b=(q[7]>>>0)<(f[7]>>>0)?1:0;for(var l=0;l<8;l++){var n=r[l]+q[l];var p=n&65535;var m=n>>>16;var k=((((p*p)>>>17)+p*m)>>>15)+m*m;var o=(((n&4294901760)*n)|0)+(((n&65535)*n)|0);h[l]=k^o}r[0]=(h[0]+((h[7]<<16)|(h[7]>>>16))+((h[6]<<16)|(h[6]>>>16)))|0;r[1]=(h[1]+((h[0]<<8)|(h[0]>>>24))+h[7])|0;r[2]=(h[2]+((h[1]<<16)|(h[1]>>>16))+((h[0]<<16)|(h[0]>>>16)))|0;r[3]=(h[3]+((h[2]<<8)|(h[2]>>>24))+h[1])|0;r[4]=(h[4]+((h[3]<<16)|(h[3]>>>16))+((h[2]<<16)|(h[2]>>>16)))|0;r[5]=(h[5]+((h[4]<<8)|(h[4]>>>24))+h[3])|0;r[6]=(h[6]+((h[5]<<16)|(h[5]>>>16))+((h[4]<<16)|(h[4]>>>16)))|0;r[7]=(h[7]+((h[6]<<8)|(h[6]>>>24))+h[5])|0}b.Rabbit=d._createHelper(i)}());a.mode.CTR=(function(){var c=a.lib.BlockCipherMode.extend();var b=c.Encryptor=c.extend({processBlock:function(l,k){var d=this._cipher;var h=d.blockSize;var f=this._iv;var e=this._counter;if(f){e=this._counter=f.slice(0);this._iv=undefined}var j=e.slice(0);d.encryptBlock(j,0);e[h-1]=(e[h-1]+1)|0;for(var g=0;g<h;g++){l[k+g]^=j[g]}}});c.Decryptor=b;return c}());(function(){var b=a;var c=b.lib;var d=c.StreamCipher;var g=b.algo;var e=[];var f=[];var h=[];var i=g.RabbitLegacy=d.extend({_doReset:function(){var u=this._key.words;var p=this.cfg.iv;var l=this._X=[u[0],(u[3]<<16)|(u[2]>>>16),u[1],(u[0]<<16)|(u[3]>>>16),u[2],(u[1]<<16)|(u[0]>>>16),u[3],(u[2]<<16)|(u[1]>>>16)];var k=this._C=[(u[2]<<16)|(u[2]>>>16),(u[0]&4294901760)|(u[1]&65535),(u[3]<<16)|(u[3]>>>16),(u[1]&4294901760)|(u[2]&65535),(u[0]<<16)|(u[0]>>>16),(u[2]&4294901760)|(u[3]&65535),(u[1]<<16)|(u[1]>>>16),(u[3]&4294901760)|(u[0]&65535)];this._b=0;for(var r=0;r<4;r++){j.call(this)}for(var r=0;r<8;r++){k[r]^=l[(r+4)&7]}if(p){var v=p.words;var t=v[0];var s=v[1];var q=(((t<<8)|(t>>>24))&16711935)|(((t<<24)|(t>>>8))&4278255360);var n=(((s<<8)|(s>>>24))&16711935)|(((s<<24)|(s>>>8))&4278255360);var o=(q>>>16)|(n&4294901760);var m=(n<<16)|(q&65535);k[0]^=q;k[1]^=o;k[2]^=n;k[3]^=m;k[4]^=q;k[5]^=o;k[6]^=n;k[7]^=m;for(var r=0;r<4;r++){j.call(this)}}},_doProcessBlock:function(n,l){var m=this._X;j.call(this);e[0]=m[0]^(m[5]>>>16)^(m[3]<<16);e[1]=m[2]^(m[7]>>>16)^(m[5]<<16);e[2]=m[4]^(m[1]>>>16)^(m[7]<<16);e[3]=m[6]^(m[3]>>>16)^(m[1]<<16);for(var k=0;k<4;k++){e[k]=(((e[k]<<8)|(e[k]>>>24))&16711935)|(((e[k]<<24)|(e[k]>>>8))&4278255360);n[l+k]^=e[k]}},blockSize:128/32,ivSize:64/32});function j(){var r=this._X;var q=this._C;for(var l=0;l<8;l++){f[l]=q[l]}q[0]=(q[0]+1295307597+this._b)|0;q[1]=(q[1]+3545052371+((q[0]>>>0)<(f[0]>>>0)?1:0))|0;q[2]=(q[2]+886263092+((q[1]>>>0)<(f[1]>>>0)?1:0))|0;q[3]=(q[3]+1295307597+((q[2]>>>0)<(f[2]>>>0)?1:0))|0;q[4]=(q[4]+3545052371+((q[3]>>>0)<(f[3]>>>0)?1:0))|0;q[5]=(q[5]+886263092+((q[4]>>>0)<(f[4]>>>0)?1:0))|0;q[6]=(q[6]+1295307597+((q[5]>>>0)<(f[5]>>>0)?1:0))|0;q[7]=(q[7]+3545052371+((q[6]>>>0)<(f[6]>>>0)?1:0))|0;this._b=(q[7]>>>0)<(f[7]>>>0)?1:0;for(var l=0;l<8;l++){var n=r[l]+q[l];var p=n&65535;var m=n>>>16;var k=((((p*p)>>>17)+p*m)>>>15)+m*m;var o=(((n&4294901760)*n)|0)+(((n&65535)*n)|0);h[l]=k^o}r[0]=(h[0]+((h[7]<<16)|(h[7]>>>16))+((h[6]<<16)|(h[6]>>>16)))|0;r[1]=(h[1]+((h[0]<<8)|(h[0]>>>24))+h[7])|0;r[2]=(h[2]+((h[1]<<16)|(h[1]>>>16))+((h[0]<<16)|(h[0]>>>16)))|0;r[3]=(h[3]+((h[2]<<8)|(h[2]>>>24))+h[1])|0;r[4]=(h[4]+((h[3]<<16)|(h[3]>>>16))+((h[2]<<16)|(h[2]>>>16)))|0;r[5]=(h[5]+((h[4]<<8)|(h[4]>>>24))+h[3])|0;r[6]=(h[6]+((h[5]<<16)|(h[5]>>>16))+((h[4]<<16)|(h[4]>>>16)))|0;r[7]=(h[7]+((h[6]<<8)|(h[6]>>>24))+h[5])|0}b.RabbitLegacy=d._createHelper(i)}());a.pad.ZeroPadding={pad:function(d,b){var c=b*4;d.clamp();d.sigBytes+=c-((d.sigBytes%c)||c)},unpad:function(c){var d=c.words;var b=c.sigBytes-1;for(var b=c.sigBytes-1;b>=0;b--){if(((d[b>>>2]>>>(24-(b%4)*8))&255)){c.sigBytes=b+1;break}}}};return a}));/* (c) Copyright Open Text Corporation 2016. Version 23.2.0.10 */ 
var OTHHUrlBuilder=function(t){var u="product",v="version",x="https://docsapi.opentext.com/mapperpi",z={tboolean:"touch bookmarks toc bookmarkEntries sectionNumbers caseSensitive highContrast autoHideToc".split(" "),nameValuePair:{find:["anyWord","allWords","exactWord"],search:["allModules","document","section","page"],sort:["match","divisions"]},tstring:"query"};Array.isArray||(Array.isArray=function(a){return a instanceof Array});"undefined"==typeof String.prototype.endsWith&&(String.prototype.endsWith=
function(a){return this.lastIndexOf(a)==this.length-a.length});"undefined"==typeof debug&&(debug=!1);"undefined"==typeof trace&&(trace=!1);t&&(u=t.product||u,v=t.version||v,x=t.urlRoot||x);try{console||(console={error:function(){},log:function(){},warn:function(){}})}catch(a){console={error:function(){},log:function(){},warn:function(){}}}return{buildHelpUrl:function(a,b,c){if(!a||!b)return console.error("Please specify 'locale' and 'context'"),"";if("string"==typeof a&&0>a.indexOf(",")&&"string"==
typeof b)return this._.generateSixParam(a,b,c);var d=null,d="string"==typeof a&&-1<a.indexOf(",")?a.split(","):"string"==typeof a?[a]:a;return this._.generateComplexParam(d,b,c)},optionConstants:z,_:{generateComplexParam:function(a,b,c){var d,f=[],p,m,g=[],e=null,e=!1,n=[],l=[],h,q,t,u,v,k,A,r,w,y;if(!a||!b)return console.error("Missing parameter!, Please specify 'locale', and 'context', not:",a,b,c),"";if("object"!=typeof a||"object"!=typeof b||c&&"object"!=typeof c)return console.error("Invalid parameter!:",
a,b,c,"are not objects. Parameter order should be ([],{},{})"),"";q=c?c.tenant:null;t=c?c.condition:null;u=c?c.type||"ofh1":"ofh1";v=function(a,b){if(a){A=!1;for(r in b)A|=b[r]==a;A||b.push(a)}};d="";for(h in b.documents)k=b.documents[h],k.active&&!0===k.active&&(e&&delete k.active,e=!0),!0===k.exclude&&f.push(k),this.fixApp(k),v(k.version,l),k.err||n.push(k);if("object"==typeof c&&c.options){debug&&console.log("Complex params options: ",c.options);e={find:1,search:10,sort:100};k=0;w=1;for(h in z.tboolean)r=
z.tboolean[h],r=c.options[r],"boolean"==typeof r&&(k+=r?w:0),w*=2;k=k.toString(16);"0"!=k&&(d+=2>k.length?"0"+k:k);k=0;for(h in c.options)if(r=z.nameValuePair[h])for(w=c.options[h],y=0;y<r.length;y++)if(r[y]==w){k+=(y+1)*e[h];break}0<k&&121!=k&&(k=k.toString(16),d+=(0===d.length?"00":"")+(2>k.length?"0"+k:k));"string"==typeof c.options.query&&(d+="S"+encodeURI(c.options.query));c.options.flags&&(p=(""+c.options.flags).replace(/[^a-zA-Z0-9]/g,""));if(c.options.custom)for(k in m="",c.options.custom)0<=
",ml,t,o,f,key,type,".indexOf(","+k+",")||(r=""+k.replace(/[^a-zA-Z0-9]/g,"")+"="+encodeURIComponent(c.options.custom[k]),m+="&"+r)}debug&&console.log("Complex params: ",q,t,u,JSON.stringify(n),d);c=x+"?ml=";c+=this.altArray(a);1==l.length&&(c=c+","+l[0]);for(h=0;h<n.length;h++)e=n[h].module,n[h].version&&(e+=n[h].version),n[h].release&&(e+="-"+n[h].release),n[h].help&&(e+="-"+n[h].help),n[h].docType&&(e+="-"+n[h].docType),n[h].locale&&(e+="-"+n[h].locale),n[h].PageID&&(e+="."+n[h].PageID),n[h].exclude&&
(e+="_"),n[h].active&&(e+="~"),v(e,g);debug&&(console.log("Complex params: ",l,c,JSON.stringify(f)),console.log("Compressable: ",JSON.stringify(g)));e=this.compress({docs:g,preserve:b.preserve,locale:a},a[0]);debug&&console.log("Compressed:",e);q&&(e+="&t="+encodeURIComponent(q));t&&(e+="&c="+encodeURIComponent(t));d&&(0<parseInt(d,16)||0<=d.indexOf("S"))&&(e+="&o="+d);p&&(e+="&f="+p);m&&(e+=m);a=this.generateKey();return x+"?type="+u+"&ml="+(e+("&key="+a))},compress:function(a,b){var c=a.locale,
d,f;d=null;var p=[],m,g="NotAPossibleValue",e=g,n=!0,l=g,h=!0,q;c||(c=b);c&&null!==c||(c="en");d=a.docs;!0!==a.preserve&&(d=d.sort());f=this.altArray(c);p=[];m=null;e=g="NotAPossibleValue";n=!0;l=g;h=!0;for(q in d)m=this.parseRevnum(d[q]),p.push(m),n&&e!=m.help&&(e==g?e=m.help:e!=m.help&&(n=!1)),h&&l!=m.release&&(l==g?l=m.release:l!=m.release&&(h=!1));2>d.length&&(h=n=!1);h&&null!==l&&(f=f+"-"+l.toUpperCase());n&&null!==e&&(f+="-",f+=e);e=g=q=null;for(m in p){d=p[m];null===q||q!=d.product?(f+="$",
q=d.product,g=e=null,f+=q):f+=",";l=d.version;h||null===d.release||d.release&&(l+="-"+d.release.toUpperCase());if(null===g||g!=l)f+=l,g=l,e=null;l="";d.docType&&(l+=d.docType);null!==d.locale&&c!=d.locale&&(l+="-",l+=d.locale);null!==d.PageID&&0<d.PageID.length&&(l+=".",l+=window.encodeURIComponent(d.PageID));if(null===e||e!=l)null!==e&&","!=f.substring(f.length-1)&&(f+=","),e=l,n||null===d.help||(f+=d.help,f+="-"),f+=e;null!==d.flag&&(f+=d.flag)}return f},fixApp:function(a){var b=null,c;if(a){a.version||
(b=this.parseRevnum(a.module),a.module=b.product,a.version=b.version&&0<b.version.length?b.version:"0",a.release=b.release&&0<b.release.length?b.release:null,a.docType=b.docType,a.help=b.help,a.err=b.err);"v"==a.version[0]&&(a.version=a.version.substring(1));if(-1<a.module.indexOf("-")){b=a.module.split(/(?=-)/);b[0]=b[0].split(/\d+$/)[0];a.module=b[0]+a.version;for(c=1;c<b.length;c++)a.module+=b[c];b=this.parseRevnum(a.module);a.module=b.product;a.version=b.version;a.release=b.release;a.docType=
b.docType;a.help=b.help;a.err=b.err}b||(b=this.parseRevnum(a.module));a.locale=b.locale&&0<b.locale.length&&!a.locale?b.locale:a.locale;a.PageID=b.PageID&&0<b.PageID.length&&!a.topic?b.PageID:a.topic;a.module=a.module.split(/\d+$/)[0]}},generateKeyAES:function(a,b){return CryptoJS.PBKDF2(b,CryptoJS.enc.Hex.parse(a),{keySize:this.keySize,iterations:this.iterationCount})},encrypt:function(a,b,c,d){a=this.generateKeyAES(a,c);return CryptoJS.AES.encrypt(d,a,{iv:CryptoJS.enc.Hex.parse(b)}).ciphertext.toString(CryptoJS.enc.Base64)},
AesUtil:function(a,b){this.keySize=a/32;this.iterationCount=b},generateSixParam:function(a,b,c){var d=null,f=null,p=null,m=null,g;c&&(d=c.product,f=c.version,p=c.module,m=c.type);"string"==typeof m&&0===m.length&&(m=null);c=this.generateKey();d=d||u;f=f||v;g=x;"string"!=typeof p&&"string"!=typeof m&&0<g.indexOf("mapperpi")&&(g=g.substring(0,g.length-2));g=g+"?"+("product="+encodeURIComponent(d));g+="&version="+encodeURIComponent(f);g+="&locale="+encodeURIComponent(a);g+="&context="+encodeURIComponent(b);
if("string"==typeof p&&"string"==typeof m)g+="&module="+encodeURIComponent(p),g+="&type="+encodeURIComponent(m);else if(!p&&m||!m&&p)return console.error("'module' and 'type' need to be either BOTH or NEITHER defined"),"";g+="&key="+c;debug&&console.log(g);return g},generateKey:function(){var a=this.generatePassPhrase();return this.encryptByAES("Vignette",a)},parseRevnum:function(a){var b=null,c;if(b=a.match(/^([a-zA-Z]+)(\d+(-\d+\w*)?)((-[a-z])?)(-[a-z]+)?(-[_a-z]+)?(-\d+)?(\.([a-zA-Z0-9#.\_\-]+))?([\_\~])?$/i)){a=
b[2];b[3]&&"-"==b[3][0]&&(a=a.substring(0,a.length-b[3].length));b={product:b[1],version:a,release:b[3],help:b[4],docType:b[6],locale:b[7],revision:b[8],PageID:b[10],flag:b[11]};for(c in b)b[c]&&"-"==b[c][0]?b[c]=b[c].substring(1):b[c]||(b[c]=null);null!==b.PageID&&null===b.flag&&b.PageID.endsWith("_")&&(b.flag="_",b.PageID=b.PageID.substring(0,b.PageID.length-1))}else b={product:a,version:null,release:null,help:null,docType:null,locale:null,revision:null,PageID:null,flag:null,err:!0};return b},generatePassPhrase:function(){var a=
new Date,b=a.getFullYear(),c=a.getMonth(),a=a.getDate(),d=""+c,f=""+a;10>c&&(d="0"+d);10>a&&(f="0"+f);return b+d+f},encryptByAES:function(a,b){var c,d=CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex),f=CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);CryptoJS.enc.Utf8.parse(b);this.AesUtil(256,1E3);c=this.encrypt(d,f,b,a);trace&&(console.log(CryptoJS.enc.Utf8.stringify(c),CryptoJS.enc.Hex.stringify(c)),console.log(CryptoJS.enc.Hex.parse(CryptoJS.enc.Utf8.parse(b).toString(CryptoJS.enc.Hex))));
trace&&(console.log("encrypted.toString()  -> base64(ciphertext)  :",c.toString()),console.log("base64(ciphertext)    <- encrypted.toString():",c.ciphertext.toString(CryptoJS.enc.Base64)),console.log("ciphertext.toString() -> ciphertext hex      :",c.ciphertext.toString()));return f.toString()+"~"+c.toString()+"~"+d.toString()},altArray:function(a){var b="",c,d;if(Array.isArray(a)){for(c=0;c<a.length;c++)d=a[c].replace(/-/g,"_"),b=0===c%2?b+d.toLowerCase():b+d.toUpperCase();return b}return a}}}};

  return OTHHUrlBuilder;
});

csui.define('json!csui/utils/froala/localization.mappings.json',{
  "en-us": "",
  "ru-ru": "ru",
  "pt": "pt_br",
  "zh-cn": "zh_cn",
  "zh-tw": "zh_tw",
  "uk-ua": "uk",
  "fi-fi": "fi",
  "nb-no": "nb",
  "pl-pl": "pl",
  "tr-tr": "tr",
  "cs-cz": "cs",
  "da-dk": "da",
  "ko-kr": "ko",
  "ca-es": "ca",
  "kk-kz": "kk"
});


csui.define('csui/lib/froala_editor/js/plugins/custcsuiImage',['csui/lib/froala_editor/js/froala_editor.pkgd.min'], function (
  FroalaEditor
) {
  'use strict';

  FroalaEditor.PLUGINS.customAttachmentsPlugin = function (editor) {
    // The start point for your plugin.
    function _init() {
      editor.events.on('image.beforeUpload', function (files, img) {
        const { getImageId, connectionUrl } = editor.opts.externalParams;
        const fileObj = files[0];
        //const connector = JSON.parse(context);
        var reader = new FileReader();
        var randomString = Math.random().toString(36).substring(2, 15);
        var filename = randomString + '_' + files[0].name;
        editor.opts.imageUploadParams.name = filename;

        // Set the reader to insert images when they are loaded.
        reader.onload = async function (e) {
          //const result = e.target.result;
          const imageId = await getImageId(fileObj);

          const imgURL = `${connectionUrl}?func=doc.fetch&nodeId=${imageId}&viewType=1`;
          editor.image.insert(imgURL, false, {}, img);
          editor.events.trigger('contentChanged'); // Trigger content change event
        };

        // Read image as base64.
        reader.readAsDataURL(files[0]);
        return false;
      });

      editor.events.on('popups.show.image.edit', function () {
        const image = editor.image.get()[0],
              popup = editor.popups.get('image.edit')[0],
              scrollContainer = editor.opts.iframe ? 
                editor.$iframe.closest(".csui-normal-scrolling")[0] : 
                  editor.$el[0].closest(".csui-normal-scrolling");
        repositionPopup(image, popup, scrollContainer); //To place the popup above/below the image
      });
 
      // Handle cleanup when popup is closed
      editor.events.on('popups.hide.image.edit', function () {
        editor.toolbar.enable();
        editor.shared.$image_resizer.removeClass('fr-active');
      });
      
      function closeEditPopup(){
        editor.popups.hide('image.edit');
      }

      function repositionPopup(image, popup, scrollContainer){
        let top = 0;
        const imageRect = image.getBoundingClientRect(),
            popupRect = popup.getBoundingClientRect(),
            scrollContRect = scrollContainer?.getBoundingClientRect(),
            iframeTop = editor.opts.iframe ? editor.$iframe[0].getBoundingClientRect().top : 0,
            combinedTop = imageRect.top + iframeTop,            //To get exact top value of the image if it is inside an iframe.
            combinedBottom = combinedTop + imageRect.height,    //To get exact bottom of the image
            containerTop = Math.max(combinedTop, scrollContRect.top),
            containerBottom = Math.min(combinedBottom, scrollContRect.bottom);
       
        if (popupRect.height < containerTop){
          top = containerTop - popupRect.height + window.scrollY; //To place the popup above the image
        } else if (window.innerHeight - containerBottom > popupRect.height){
          top = containerBottom + window.scrollY; //To place the popup below the image
        } else {
          top = containerTop > 0 ? containerTop + window.scrollY : containerBottom - popupRect.height + window.scrollY; //If popup can't be displayed above/below img, display it on the image
        }
        popup.style.top = `${top}px`;
      }
    }
    return {
      _init: _init,
    };
  };
});

csui.define('csui/lib/froala_editor/js/plugins/cslink',[
  'csui/lib/jquery',
  'csui/lib/froala_editor/js/froala_editor.pkgd.min',
  'i18n!csui/widgets/html.editor/impl/nls/lang',
], function ($, FroalaEditor, lang) {
  'use strict';

  FroalaEditor.DefineIconTemplate(
    'cslink',
    '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M13,10H11l-1,1L9,10H7a3,3,0,0,0,0,6H9l1-1,1,1h2a3,3,0,0,0,0-6ZM7,15a2,2,0,0,1,0-4H9v1H7a1,1,0,0,0,0,2H9v1Zm5.5-2.5a.5.5,0,0,1,0,1h-5a.5.5,0,0,1,0-1ZM13,15H11V14h2a1,1,0,0,0,0-2H11V11h2a2,2,0,0,1,0,4Z" style="fill:#333"/><path d="M7,5.435A1.465,1.465,0,1,0,8.465,6.9h0A1.466,1.466,0,0,0,7,5.435Z" style="fill:#333"/><path d="M10.237,2.09a1.8,1.8,0,0,0,.028-.273,1.816,1.816,0,0,0-3.483-.722,5.83,5.83,0,0,0-5.62,5.392A1.815,1.815,0,0,0,1.817,10a1.783,1.783,0,0,0,.194-.02,5.861,5.861,0,0,0,.835,1.063c.1.1.208.2.317.291a4.251,4.251,0,0,1,.205-.408l.059-.1a4.227,4.227,0,0,1,.3-.431,4.851,4.851,0,0,1-.718-.857,1.8,1.8,0,0,0-.768-3.12A4.685,4.685,0,0,1,6.666,2.171a1.811,1.811,0,0,0,3.1.894,4.766,4.766,0,0,1,1.982,3.851A4.625,4.625,0,0,1,11.335,8.8h1.143a5.786,5.786,0,0,0-2.24-6.709Z" style="fill:#333"/></svg>'
  );

  FroalaEditor.DefineIcon('cslink', {
    NAME: 'cslink',
    template: 'cslink',
  });

  FroalaEditor.RegisterCommand('cslink', {
    title: lang.insertContentServerLink,
    icon: 'cslink',
    undo: true,
    focus: true,
    showOnMobile: true,
    callback: function () {
      const editor = this;
      editor.toolbar.disable();
      let selectedText;
      if (!editor.selection.isCollapsed()) {
        selectedText = editor.selection.get();
      }
      editor.selection.save();
      editor.$tb.hide();
      $('.froala-save-cancel').hide();
      editor.opts.csLink.nodePicker().show()
        .done(function (args) {
          const node = args.nodes[0],
            url =
              !!editor.opts.csLink.getUrl &&
              typeof editor.opts.csLink.getUrl === 'function'
                ? editor.opts.csLink.getUrl(node)
                : editor.opts.csLink.nodeLink.getUrl(args.nodes[0]);
          if (
            typeof editor.opts.externalParams.enableSaveButton === 'function'
          ) {
            editor.opts.externalParams.enableSaveButton();
          }
          editor.selection.restore();
          if (selectedText) {
            editor.format.apply('a', { href: url }, editor.selection.text());
          } else {
            editor.link.insert(url, node.get('name'));
          }
        })
        .fail(function (args) {
          //TODO handle fail case
        })
        .always(function (args) {
          editor.$tb.show();
          $('.froala-save-cancel').show();
          editor.toolbar.enable();
        });
    },
  });
});


csui.define('csui/controls/source.dialog/source.dialog.textarea.field.view',[
  'csui/controls/form/fields/textareafield.view',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
], function (TextAreaFieldView, TabableRegionBehavior) {
  'use strict';

  var SourceDialogTextAreaFieldView = TextAreaFieldView.extend({

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },

    onAfterShow: function () {
      this.$el.find('*[tabindex]').prop('tabindex', 0);
      this.currentlyFocusedElement().focus();
    },

    onDomRefresh: function () {
      this.refreshFocusEngage();
    },

    currentlyFocusedElement: function () {
      return this.focusables[0];
    },

    refreshFocusEngage: function () {
      this.focusables = this.$el.find('textarea').filter(function (index, elem) {
        //Check whether textareafield is visible or not
        return elem.offsetWidth && elem.offsetHeight;
      });
    },
  
    onLastTabElement: function () {
      this.refreshFocusEngage();
      return this.currentlyFocusedElement();
    }
  });
  return SourceDialogTextAreaFieldView;
});

csui.define('css!csui/controls/source.dialog/impl/source.dialog',[],function(){});

csui.define('csui/controls/source.dialog/source.dialog.view',[
  "csui/lib/underscore",
  "csui/lib/backbone",
  "csui/controls/dialog/dialog.view",
  "csui/controls/source.dialog/source.dialog.textarea.field.view",
  'i18n!csui/widgets/html.editor/impl/nls/lang',
  "css!csui/controls/source.dialog/impl/source.dialog"
], function (_, Backbone, DialogView, TextAreaFieldView, lang) {
  var SourceDialog = DialogView.extend({

  className: 'fr-source-code-view',

  constructor: function SourceDialog(options = {}) {

    _.defaults(options, {
      buttons: [{
        id: 'froalaOkButton',
        default: true,
        label: lang.okTitle,
        click: _.bind(this._okAction, this),
        enabled: true
      },
      {
        id: 'froalaCancelButton',
        label: lang.cancelTitle,
        close: true,
        enabled: true
      }],
      title: lang.sourceDialogTitle,
      view: new TextAreaFieldView({
        model: new Backbone.Model({
          data: options.data,
          options: options,
        }),
        mode: 'writeonly'
      })
    });
    
    DialogView.prototype.constructor.call(this, options);
  },

  _okAction: function () {
    const model = this.options.view.model;
    this.trigger("toggle:content", {data: model.get("data"), enableSaveButton: !!model.changed.data});
    this.destroy();
  },

  destroy: function () {
    DialogView.prototype.destroy.call(this);
    this.trigger('show:froala-toolbar');
  }
});
return SourceDialog;
});

csui.define('css!csui/lib/froala_editor/css/plugins/source.dialog',[],function(){});

csui.define('csui/lib/froala_editor/js/plugins/sourcecode',["csui/lib/froala_editor/js/froala_editor.pkgd.min",
"csui/controls/source.dialog/source.dialog.view",
'i18n!csui/widgets/html.editor/impl/nls/lang',
'css!csui/lib/froala_editor/css/plugins/source.dialog'
], function (
  FroalaEditor, SourceDialogView, lang
) {
  "use strict";

  FroalaEditor.DefineIconTemplate(
    "codeView",
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="fr-source"></svg>'
  );

  FroalaEditor.DefineIcon("codeView", {
    NAME: "codeView",
    template: "codeView",
  });

  FroalaEditor.RegisterCommand("codeCustomView", {
    title: lang.openCodeView,
    icon: "codeView",

    callback: function () {
        let content = this.html.get(false, true);
        content = (this.codeBeautifier && !content.includes("fr-embedly") && this.codeBeautifier.run(content, this.opts.codeBeautifierOptions)) || content;

        //send the appropriate options to the dialogView
        const options = {data: content, largeSize: true};
        var dialogView = new SourceDialogView(options);
        dialogView.show();

        this.$tb.hide();
        this.$sc.find('.csui-html-editor-action-buttons').hide();
        
        dialogView.on("toggle:content", function (params) {
            this.html.set(params.data);
            params.enableSaveButton && this.opts.externalParams.enableSaveButton();
        }.bind(this));

        dialogView.on('show:froala-toolbar', function() {
            this.$tb.show();
            this.$sc.find('.csui-html-editor-action-buttons').show();
            this.el.focus();
        }.bind(this));
    }
  });
});

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/html.editor.action.buttons',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "froala-save-cancel";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isFroala") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":12},"end":{"line":1,"column":53}}})) != null ? stack1 : "")
    + " csui-html-editor-action-buttons\">\n  <button type=\"button\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"saveLabel") || (depth0 != null ? lookupProperty(depth0,"saveLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"saveLabel","hash":{},"loc":{"start":{"line":2,"column":31},"end":{"line":2,"column":44}}}) : helper)))
    + "\" role=\"button\" data-cstabindex=\"-1\" tabindex=\"-1\"\n          aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"saveAria") || (depth0 != null ? lookupProperty(depth0,"saveAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"saveAria","hash":{},"loc":{"start":{"line":3,"column":22},"end":{"line":3,"column":34}}}) : helper)))
    + "\"\n          class=\"icon circular csui-html-edit-icon csui-html-edit-save\"></button>\n  <button type=\"button\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cancelLabel") || (depth0 != null ? lookupProperty(depth0,"cancelLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cancelLabel","hash":{},"loc":{"start":{"line":5,"column":31},"end":{"line":5,"column":46}}}) : helper)))
    + "\" role=\"button\" data-cstabindex=\"-1\" tabindex=\"-1\"\n          aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cancelAria") || (depth0 != null ? lookupProperty(depth0,"cancelAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cancelAria","hash":{},"loc":{"start":{"line":6,"column":22},"end":{"line":6,"column":36}}}) : helper)))
    + "\"\n          class=\"icon circular csui-html-edit-icon csui-html-edit-cancel\"></button>\n</div>\n</div>";
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_html.editor.action.buttons', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/lib/froala_editor/js/plugins/floatingspace',['csui/lib/jquery', 'csui/lib/froala_editor/js/froala_editor.pkgd.min', 'hbs!csui/widgets/html.editor/impl/html.editor.action.buttons',
  'i18n!csui/widgets/html.editor/impl/nls/lang', 'csui/lib/underscore', 'i18n'], function ($, FroalaEditor, htmlEditorButtonsTemplate, lang, _, i18n) {
    "use strict";

    FroalaEditor.PLUGINS.customFloatingspace = function (editor) {
      let editorElement;
      let cachedToolbarWidth;

      function appendActionButtons() {
        const body = $("body"),
          data = {
            'saveLabel': lang.saveTitle,
            'cancelLabel': lang.cancelTitle,
            'cancelAria': lang.cancelAria,
            'saveAria': lang.saveAria,
            'isFroala': true
          };
        body.append(htmlEditorButtonsTemplate(data));
        body.find(".csui-html-edit-save").on("click", _.bind(function () {
          editor.opts.externalParams.disableSaveButton();
          this.events.trigger('onSave');
        }, editor));

        body.find(".csui-html-edit-cancel").on("click", _.bind(function () {
          this.events.trigger('cancel');
        }, editor));
      }

      function calculateToolbarWidth(actionButtonsWidth) {
        const viewportWidth = window.innerWidth;
        const editorBox = editor.$box[0].getBoundingClientRect();
        const spaceRight = viewportWidth - editorBox.right;
        const spaceLeft = editorBox.left;
        let maxToolbarWidth = editorBox.width + Math.max(spaceRight, spaceLeft);

        let widthFactor = (maxToolbarWidth - actionButtonsWidth) / maxToolbarWidth;
        if (editorBox.width / viewportWidth > 0.8) {
          widthFactor = 1;
          maxToolbarWidth = Math.min(editorBox.width, maxToolbarWidth);
        }
        return maxToolbarWidth * widthFactor;
      }

      function positionToolbar() {
        const isModalOpen = $('body.binf-modal-open').length !== 0;
        if (isModalOpen) return;

        const toolbar = editor.$tb;
        const actionButtons = $(".csui-html-editor-action-buttons");
        const buttonsWidth = actionButtons.outerWidth();
        const buttonsHeight = actionButtons.outerHeight();
        let toolbarCSS = {};

        if (!editorElement) {
          editorElement = editor.$box.parents().closest(editor.opts.externalParams.widgetSelector)[0];
        }
        let toolbarWidth = cachedToolbarWidth || calculateToolbarWidth(buttonsWidth);

        const editorBox = editorElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const scrollY = document.documentElement.scrollTop;
        let toolbarHeight = toolbar.outerHeight();
        let top;
        let isTopPositioned = false;

        if (editorBox.top > toolbarHeight + buttonsHeight) {
          top = editorBox.top + scrollY - toolbarHeight;
          isTopPositioned = true;
        } else {
          top = editorBox.top + scrollY + editorBox.height;
        }

        const computedStyle = window.getComputedStyle(editorElement);
        const paddingRight = parseFloat(computedStyle.paddingRight);
        let left = editorBox.left;
        let right = viewportWidth - editorBox.right;
        const rtl = i18n.settings.rtl;
        const popupActive = editor.$sc[0].querySelector(".fr-popup.fr-active");

        toolbarCSS.position = 'absolute';
        toolbarCSS.zIndex = popupActive ? 1070 : 1069;
        toolbarCSS.top = `${top}px`;
        toolbarCSS.borderRadius = '1px';
        toolbarCSS.display = 'none';
        toolbarCSS['max-width'] = `${toolbarWidth}px`;
        toolbarCSS.width = 'max-content';
        toolbar.css(toolbarCSS);

        if(!cachedToolbarWidth) {
          toolbarWidth = toolbar.outerWidth();
          cachedToolbarWidth = toolbarWidth;
        }

        if (right < left) {
          left = editorBox.right - toolbarWidth - paddingRight;
        } else if (left === right) {
          left = editorBox.left + (editorBox.width - toolbarWidth) / 2;
        }
        left = Math.max(left, 0);

        if (rtl) {
          toolbarCSS.right = `${Math.max(viewportWidth - left - toolbarWidth, 0)}px`;
          toolbarCSS.left = 'auto';
        } else {
          toolbarCSS.left = `${left}px`;
          toolbarCSS.right = 'auto';
        }
        toolbarCSS.display = 'block';
        toolbar.css(toolbarCSS);

        toolbarHeight = toolbar.outerHeight();

        //Re-calculate the top with updated toolbar height
        if (editorBox.top > toolbarHeight + buttonsHeight) {
          top = editorBox.top + scrollY - toolbarHeight;
          isTopPositioned = true;
        } else {
          top = editorBox.top + scrollY + editorBox.height;
        }

        toolbar.css('top', `${top}px`);

        let actionButtonsTop, actionButtonsLeft;

        function calculateCenteredTopPosition() {
          return top + (toolbarHeight - buttonsHeight) / 2;
        }

        function setActionButtonsPosition(top, left, right) {
          actionButtons.css({
            position: 'absolute',
            'margin-top': '0px',
            width: 'max-content',
            top: `${top}px`,
            left: left !== null ? `${left}px` : 'auto',
            right: right !== null ? `${right}px` : 'auto',
            zIndex: 1069
          });
        }

        if (rtl) {
          if (left - buttonsWidth >= 5) {
            actionButtonsTop = calculateCenteredTopPosition();
            actionButtonsLeft = left-buttonsWidth -5;
            if (actionButtonsLeft < 0) {
              actionButtonsLeft = 5;
            }
            setActionButtonsPosition(actionButtonsTop, actionButtonsLeft, null);
          } else if (viewportWidth - (left + toolbarWidth + buttonsWidth) >= 5) {
            actionButtonsTop = calculateCenteredTopPosition();
            actionButtonsLeft = viewportWidth - (left + toolbarWidth + buttonsWidth + 5);
            setActionButtonsPosition(actionButtonsTop, null, actionButtonsLeft);
          } else if (isTopPositioned) {
            actionButtonsTop = top + toolbarHeight - 20;
            toolbar.css('top', `${top - buttonsHeight}px`);
            actionButtonsLeft = viewportWidth - (left + toolbarWidth);
            setActionButtonsPosition(actionButtonsTop, null, actionButtonsLeft);
          } else {
            actionButtonsTop = top + toolbarHeight + 5;
            actionButtonsLeft = viewportWidth - (left + toolbarWidth);
            setActionButtonsPosition(actionButtonsTop, null, actionButtonsLeft);
          }
        } else {
          if (viewportWidth - left >= toolbarWidth + buttonsWidth + 5) {
            actionButtonsTop = calculateCenteredTopPosition();
            actionButtonsLeft = left + toolbarWidth + 5;
            setActionButtonsPosition(actionButtonsTop, actionButtonsLeft, null);
          } else if (left >= buttonsWidth + 5) {
            actionButtonsTop = calculateCenteredTopPosition();
            actionButtonsLeft = left - buttonsWidth - 5;
            setActionButtonsPosition(actionButtonsTop, actionButtonsLeft, null);
          } else if (!isTopPositioned) {
            actionButtonsTop = top + toolbarHeight + 5;
            actionButtonsLeft = 0;
            setActionButtonsPosition(actionButtonsTop, actionButtonsLeft, null);
          } else {
            toolbar.css('top', `${top - buttonsHeight}px`);
            actionButtonsTop = top + toolbarHeight - 20;
            actionButtonsLeft = left;
            setActionButtonsPosition(actionButtonsTop, actionButtonsLeft, null);
          }
        }
      }

      function resetToolbarZIndex() {
        const newZIndex = editor.$tb[0].querySelector(".fr-dropdown.fr-active") || editor.$sc[0].querySelector(".fr-popup.fr-active") && 1070; //increase z-index of toolbar if popup/dropdown is active     
        editor.$tb.css('zIndex', newZIndex || 1069);
      }

      function setToolTipCSS() {
        const toolTip = $('.fr-tooltip');
        if (toolTip.length) {
          toolTip.css({
              right: 'auto'
          });
          editor.$tb.off('mouseenter', '.fr-command');
        }
      }

      function initialize() {
        $('body').append(editor.$tb);
        appendActionButtons();
        positionToolbar();
        const debouncedPositionToolbar = _.debounce(() => {
          cachedToolbarWidth = null;
          positionToolbar();
        }, 110);
        editor.$box.closest('.csui-normal-scrolling').on('scroll wheel', function () {
          editor.popups.hideAll();
        });
        $(window).on('resize.customFloatingspace', debouncedPositionToolbar);
        $(window).on('scroll.customFloatingspace', positionToolbar);
        $('.fr-toolbar').on('mouseenter', '.fr-command', setToolTipCSS);
        $('.fr-dropdown').on('blur click', editor.button.bulkRefresh);
        editor.events.on('buttons.refresh', resetToolbarZIndex);
        editor.events.on('destroy', destroy);
        window.addEventListener('popstate', destroy);
      }

      function destroy() {
        $(window).off('resize.customFloatingspace');
        $(window).off('scroll.customFloatingspace');
        $('.fr-toolbar').remove();
        $(".csui-html-editor-action-buttons").remove();
        $('.csui-rich-text-mask').remove();
        editor.popups.hideAll();
        window.removeEventListener('popstate', destroy);
      }

      return {
        _init: initialize
      };
    };
  });

csui.define('csui/lib/froala_editor/js/plugins/video',['csui/lib/froala_editor/js/froala_editor.pkgd.min'], function (
    FroalaEditor
  ) {
    'use strict';
  
    FroalaEditor.PLUGINS.customVideoPlugin = function (editor) {
      function isValidVideoUrl(url) {
        return !!url.match(/\.(mp4|mkv|ogg|webm|m4v|ogv|mov).*/ig);
      }

      function insertVideoByUrl(url, editor) {
        const videoTag = `<video width="640" controls>
                            <source src="${url}" type="video/mp4">
                            Your browser does not support the video tag.
                          </video>`;

        editor.video.insert(videoTag);
      }
      function _init() {
        editor.events.on('commands.after', function (cmd) {
            if (cmd === 'videoInsertByURL') {
              const inputField = document.querySelector('.fr-video-by-url-layer input[type="text"]');
              if (inputField) {
                const url = inputField.value;
                if (isValidVideoUrl(url)) {
                  insertVideoByUrl(url, this);
                  this.popups.hide('video.insert');
                }
              }
            }
          })
      }
      return {
        _init: _init,
      };
    };
  });
  

csui.define('csui/utils/froala/bootstrap',[
  'require',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'i18n',
  'json!csui/utils/froala/localization.mappings.json',
  'csui/lib/froala_editor/js/plugins/custcsuiImage',
  'csui/lib/froala_editor/js/plugins/cslink',
  'csui/lib/froala_editor/js/plugins/sourcecode',
  'csui/lib/froala_editor/js/plugins/floatingspace',
  'csui/lib/froala_editor/js/plugins/video'
], function (require, $, _, i18n, LocalizationMappings) {
  'use strict';
  const _froalaKey = 'PYC4mA3B12C11A8E7D6D3eMRPYa1c1REe1BGQOQIc1CDBREJImD6F5F4D4E1B9A5C3F5E4==';
  let bootstrapFroalaEditor = function (selector, options) {
    let froalaDefaultConfig = {
      key: _froalaKey,
      attribution: false,
      toolbarSticky: false,
      toolbarButtons: [
        'bold',
        'italic',
        'underline',
        'strikeThrough',
        'subscript',
        'superscript',
        'fontSize',
        'textColor',
        'backgroundColor',
        'inlineClass',
        'inlineStyle',
        'clearFormatting',
        'alignLeft',
        'alignCenter',
        'alignRight',
        'alignJustify',
        'formatOL',
        'formatUL',
        'paragraphFormat',
        'paragraphStyle',
        'lineHeight',
        'outdent',
        'indent',
        'quote',
        'trackChanges',
        'markdown',
        'insertLink',
        'cslink',
        'insertImage',
        'insertTable',
        'fontAwesome',
        'specialCharacters',
        'undo',
        'redo',
        'customText',
        'spellChecker',
        'codeCustomView',
      ],
      imageInsertButtons: ['imageUpload'],
      imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif'],
      imageResize: true,
      imageEditButtons: [
        'imageReplace',
        'imageAlign',
        'imageRemove',
        '|',
        'imageLink',
        'linkEdit',
        'linkRemove',
        '-',
        'imageDisplay',
        'imageStyle',
        'imageAlt',
        'imageSize',
      ],
      imageDefaultAlign: 'left',
      scrollableContainer: 'body',
      pluginsEnabled: [
        'align',
        'charCounter',
        'codeBeautifier',
        'colors',
        'entities',
        'file',
        'fontAwesome',
        'fontFamily',
        'fontSize',
        'resize',
        'inlineStyle',
        'link',
        'lists',
        'paragraphFormat',
        'paragraphStyle',
        'quote',
        'save',
        'specialCharacters',
        'table',
        'tableDragStart',
        'wordPaste',
        'spellChecker',
        'customAttachmentsPlugin',
        'customFloatingspace',
      ],
      saveInterval: 60000,
      linkInsertButtons: ['linkBack'],
      linkEditButtons: ['linkOpen', 'linkEdit', 'linkRemove'],
      autofocus: true,
      useClasses: false,
      zIndex: 1069,
      direction: i18n.settings.rtl ? 'rtl' : 'auto',
      fontSize: ['8', '9', '10', '11', '12', '14', '16', '18', '24', '30', '36', '48', '60', '72', '96'],
      fontSizeSelection: true,
      fontSizeDefaultSelection: '16',
      dontConvertExternalCss: true
    };

    /*TODO: This is a workaround, because froala is converting all style sheets to inline styles.
            It needs to be removed after we get support from froala regarding this issue*/
    options.customHtmlGet = function (keep_markers, keep_classes) {
      const editor = this;
      if (!editor.$wp) {
        return editor.$oel.clone().removeClass('fr-view').removeAttr('contenteditable').get(0).outerHTML;
      }
      var html = '';
      editor.events.trigger('html.beforeGet');

      // Convert STYLE from CSS files to inline style.
      var updated_elms = [];
      var elms_info = {};
      var i;
      var j;
      var elems_specs = [];
      editor.html.syncInputs();
      if (!editor.opts.useClasses && !keep_classes) {
        var ignoreRegEx = new RegExp("^".concat(editor.opts.htmlIgnoreCSSProperties.join('$|^'), "$"), 'gi');
        for (i = 0; i < editor.doc.styleSheets.length; i++) {
          // [OT] Improved conversion from class based to inline style (for classes external to froala).
          // This code prevents unnecessary inline styles from being applied and overridden
          // due to potential issues with Froala's specificity calculations.
          if(editor.opts.dontConvertExternalCss){
            const froalaInternalCssFiles = /lib\/froala_editor\/css\/.*\.css/;
            const href = editor.doc.styleSheets[i]?.href;
            if (!(href && froalaInternalCssFiles.test(href))){
              continue;
            }
          }
          // [OT] Modifications ends here

            // Rule.
          var rules = void 0;
          var head_style = 0;
          try {
            rules = editor.doc.styleSheets[i].cssRules;
            if (editor.doc.styleSheets[i].ownerNode && editor.doc.styleSheets[i].ownerNode.nodeType === 'STYLE') {
              head_style = 1;
            }
          } catch (ex) {
            // keep empty.
          }
          function _specifity(selector) {
            var idRegex = /(#[^\s+>~.[:]+)/g;
            var attributeRegex = /(\[[^]]+\])/g;
            var classRegex = /(\.[^\s+>~.[:]+)/g;
            var pseudoElementRegex = /(::[^\s+>~.[:]+|:first-line|:first-letter|:before|:after)/gi;
            var pseudoClassWithBracketsRegex = /(:[\w-]+\([^)]*\))/gi;
      
            // A regex for other pseudo classes, which don't have brackets
            var pseudoClassRegex = /(:[^\s+>~.[:]+)/g;
            var elementRegex = /([^\s+>~.[:]+)/g;
      
            // Remove the negation psuedo-class (:not) but leave its argument because specificity is calculated on its argument
            (function () {
              var regex = /:not\(([^)]*)\)/g;
              if (regex.test(selector)) {
                selector = selector.replace(regex, '     $1 ');
              }
            })();
            var s = (selector.match(idRegex) || []).length * 100 + (selector.match(attributeRegex) || []).length * 10 + (selector.match(classRegex) || []).length * 10 + (selector.match(pseudoClassWithBracketsRegex) || []).length * 10 + (selector.match(pseudoClassRegex) || []).length * 10 + (selector.match(pseudoElementRegex) || []).length;
      
            // Remove universal selector and separator characters
            selector = selector.replace(/[*\s+>~]/g, ' ');
      
            // Remove any stray dots or hashes which aren't attached to words
            // These may be present if the user is live-editing this selector
            selector = selector.replace(/[#.]/g, ' ');
            s += (selector.match(elementRegex) || []).length;
            return s;
          }
          if (rules) {
            for (var idx = 0, len = rules.length; idx < len; idx++) {
              if (rules[idx].selectorText) {
                if (rules[idx].style.cssText.length > 0) {
                  var selector = rules[idx].selectorText.replace(/body \s tbody \.fr-view /g, '').replace(/::/g, ':');
                  var elms = void 0;
                  try {
                    elms = editor.el.querySelectorAll(selector);
                  } catch (ex) {
                    elms = [];
                  }
                  for (j = 0; j < elms.length; j++) {
                    // Save original style.
                    if (!elms[j].getAttribute('fr-original-style') && elms[j].getAttribute('style')) {
                      elms[j].setAttribute('fr-original-style', elms[j].getAttribute('style'));
                      updated_elms.push(elms[j]);
                    } else if (!elms[j].getAttribute('fr-original-style')) {
                      elms[j].setAttribute('fr-original-style', '');
                      updated_elms.push(elms[j]);
                    }
                    if (!elms_info[elms[j]]) {
                      elms_info[elms[j]] = {};
                    }


                    // Compute specification.
                    var spec = head_style * 1000 + _specifity(rules[idx].selectorText);

                    // Get CSS text of the rule.
                    var css_text = rules[idx].style.cssText.split(';');

                    // Get each rule.
                    for (var k = 0; k < css_text.length; k++) {
                      var rule = css_text[k].trim().split(':')[0];
                      if (!rule) {
                        continue;
                      }

                      // Ignore the CSS rules we don't need.
                      if (rule.match(ignoreRegEx)) {
                        continue;
                      }
                      if (!elms_info[elms[j]][rule] || elms_info[elms[j]][rule] && elms[j].getAttribute('fr-original-style') == '') {
                        elms_info[elms[j]][rule] = 0;
                        if ((elms[j].getAttribute('fr-original-style') || '').indexOf("".concat(rule, ":")) >= 0) {
                          elms_info[elms[j]][rule] = 10000;
                        }
                      }

                      // Current spec is higher than the existing one.
                      if (spec >= elms_info[elms[j]][rule]) {
                        elms_info[elms[j]][rule] = spec;
                        if (css_text[k].trim().length) {
                          var info = css_text[k].trim().split(':');
                          info.splice(0, 1);

                          //https://github.com/froala-labs/froala-editor-js-2/issues/4281
                          var cssVal = info.join(':').trim();
                          if (cssVal.indexOf('!important') > -1) {
                            spec = spec + 1;
                          }
                          // Add elements with css values and spec. This will be sorted later.
                          elems_specs.push([elms[j], rule.trim(), cssVal, spec]);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // Sort elements by spec.
        function _sortElementsBySpec(a, b) {
          return a[3] - b[3];
        }

        

        elems_specs.sort(_sortElementsBySpec);

        // Add style to elements in the order of specification.
        for (i = 0; i < elems_specs.length; i++) {
          var specs_elem = elems_specs[i];
          specs_elem[0].style[specs_elem[1]] = specs_elem[2].replace(/!important/, '');
        }

        // Save original class.
        for (i = 0; i < updated_elms.length; i++) {
          if (updated_elms[i].getAttribute('class')) {
            updated_elms[i].setAttribute('fr-original-class', updated_elms[i].getAttribute('class'));
            updated_elms[i].removeAttribute('class');
          }

          // Make sure that we have the inline style first.
          if ((updated_elms[i].getAttribute('fr-original-style') || '').trim().length > 0) {
            var original_rules = updated_elms[i].getAttribute('fr-original-style').split(';');
            for (j = 0; j < original_rules.length; j++) {
              if (original_rules[j].indexOf(':') > 0) {
                var splits = original_rules[j].split(':');
                var original_rule = splits[0];
                splits.splice(0, 1);
                updated_elms[i].style[original_rule.trim()] = splits.join(':').trim();
              }
            }
          }
        }
      }

      // If editor is not empty.
      if (!editor.node.isEmpty(editor.el)) {
        if (typeof keep_markers === 'undefined') {
          keep_markers = false;
        }
        if (!editor.opts.fullPage) {
          html = editor.$el.html();
          if (editor.opts.iframe && editor.$html && editor.$html.find('.fr-element').length > 0) {
            html = editor.$html.find('.fr-element').html();
          }
        } else {
          html = getDoctype(editor.iframe_document);
          editor.$el.removeClass('fr-view');
          var heightMin = editor.opts.heightMin;
          var height = editor.opts.height;
          var heightMax = editor.opts.heightMax;
          editor.opts.heightMin = null;
          editor.opts.height = null;
          editor.opts.heightMax = null;
          editor.size.refresh();
          html += "<html".concat(editor.node.attributes(editor.$html.get(0)), ">").concat(editor.$html.html(), "</html>");
          if (editor.opts.iframe && editor.$html && editor.$html.find('.fr-element').length > 0) {
            html = editor.$html.find('.fr-element').html();
          }
          editor.opts.heightMin = heightMin;
          editor.opts.height = height;
          editor.opts.heightMax = heightMax;
          editor.size.refresh();
          editor.$el.addClass('fr-view');
        }
      } else if (editor.opts.fullPage) {
        html = getDoctype(editor.iframe_document);
        html += "<html".concat(editor.node.attributes(editor.$html.get(0)), ">").concat(editor.$html.find('head').get(0).outerHTML, "<body></body></html>");
      }

      // Remove unwanted attributes.
      if (!editor.opts.useClasses && !keep_classes) {
        for (i = 0; i < updated_elms.length; i++) {
          if (updated_elms[i].getAttribute('fr-original-class')) {
            updated_elms[i].setAttribute('class', updated_elms[i].getAttribute('fr-original-class'));
            updated_elms[i].removeAttribute('fr-original-class');
          }
          if (updated_elms[i].getAttribute('fr-original-style') !== null && typeof updated_elms[i].getAttribute('fr-original-style') !== 'undefined') {
            if (updated_elms[i].getAttribute('fr-original-style').length !== 0) {
              updated_elms[i].setAttribute('style', updated_elms[i].getAttribute('fr-original-style'));
            } else {
              updated_elms[i].removeAttribute('style');
            }
            updated_elms[i].removeAttribute('fr-original-style');
          } else {
            updated_elms[i].removeAttribute('style');
          }
        }
      }

      // Clean helpers.
      if (editor.opts.fullPage) {
        html = html.replace(/<style data-fr-style="true">(?:[\w\W]*?)<\/style>/g, '');
        html = html.replace(/<link([^>]*)data-fr-style="true"([^>]*)>/g, '');
        html = html.replace(/<style(?:[\w\W]*?)class="firebugResetStyles"(?:[\w\W]*?)>(?:[\w\W]*?)<\/style>/g, '');
        html = html.replace(/<body((?:[\w\W]*?)) spellcheck="true"((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, '<body$1$2>$3</body>');
        html = html.replace(/<body((?:[\w\W]*?)) contenteditable="(true|false)"((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, '<body$1$3>$4</body>');
        html = html.replace(/<body((?:[\w\W]*?)) dir="([\w]*)"((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, '<body$1$3>$4</body>');
        html = html.replace(/<body((?:[\w\W]*?))class="([\w\W]*?)(fr-rtl|fr-ltr)([\w\W]*?)"((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, '<body$1class="$2$4"$5>$6</body>');
        html = html.replace(/<body((?:[\w\W]*?)) class=""((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, '<body$1$2>$3</body>');
      }

      // Ampersand fix.
      if (editor.opts.htmlSimpleAmpersand) {
        html = html.replace(/&amp;/gi, '&');
      }
      editor.events.trigger('html.afterGet');

      // Remove markers.
      if (!keep_markers) {
        html = html.replace(/<span[^>]*? class\s*=\s*["']?fr-marker["']?[^>]+>\u200b<\/span>/gi, '');
      }
      html = editor.clean.invisibleSpaces(html);
      function _processBR(br) {
        var parent_node = br.parentNode;
        if (parent_node && (editor.node.isBlock(parent_node) || editor.node.isElement(parent_node)) && ['TD', 'TH'].indexOf(parent_node.tagName) < 0) {
          var prev_node = br.previousSibling;
          var next_node = br.nextSibling;
  
          // Ignore non characters.
          while (prev_node && (prev_node.nodeType === Node.TEXT_NODE && prev_node.textContent.replace(/\n|\r/g, '').length === 0 || editor.node.hasClass(prev_node, 'fr-tmp'))) {
            prev_node = prev_node.previousSibling;
          }
          if (next_node) {
            return false;
          }
  
          // Previous node.
          // Previous node is not BR.
          // Previoues node is not block tag.
          // No next node.
          // Parent node has text.
          // Previous node has text.
          if (prev_node && parent_node && prev_node.tagName !== 'BR' && !editor.node.isBlock(prev_node) && !next_node && parent_node.textContent.replace(/\u200B/g, '').length > 0 && prev_node.textContent.length > 0 && !editor.node.hasClass(prev_node, 'fr-marker')) {
            // Fix for https://github.com/froala/wysiwyg-editor/issues/1166#issuecomment-204549406.
            if (!(editor.el === parent_node && !next_node && editor.opts.enter === FroalaEditor.ENTER_BR && editor.browser.msie)) {
              br.parentNode.removeChild(br);
            }
          }
        }
  
        // Regular node.
        else if (parent_node && !(editor.node.isBlock(parent_node) || editor.node.isElement(parent_node))) {
          // Check if we have something else than BR.
          if (!br.previousSibling && !br.nextSibling && editor.node.isDeletable(br.parentNode)) {
            _processBR(br.parentNode);
          }
        }
      }
      function _processOnGet(el) {
        editor.events.trigger('html.processGet', [el]);
  
        // Remove class attribute when empty.
        if (el && el.getAttribute && el.getAttribute('class') === '') {
          el.removeAttribute('class');
        }
        if (el && el.getAttribute && el.getAttribute('style') === '') {
          el.removeAttribute('style');
        }
  
        // Look at inner nodes that have no class set.
        if (el && el.nodeType === Node.ELEMENT_NODE) {
          var els = el.querySelectorAll('[class=""],[style=""]');
          var i;
          for (i = 0; i < els.length; i++) {
            var _el = els[i];
            if (_el.getAttribute('class') === '') {
              _el.removeAttribute('class');
            }
            if (_el.getAttribute('style') === '') {
              _el.removeAttribute('style');
            }
          }
          function _processBR(br) {
            var parent_node = br.parentNode;
            if (
              parent_node &&
              (editor.node.isBlock(parent_node) ||
                editor.node.isElement(parent_node)) &&
              ['TD', 'TH'].indexOf(parent_node.tagName) < 0
            ) {
              var prev_node = br.previousSibling;
              var next_node = br.nextSibling;

              // Ignore non characters.
              while (
                prev_node &&
                ((prev_node.nodeType === Node.TEXT_NODE &&
                  prev_node.textContent.replace(/\n|\r/g, '').length === 0) ||
                  editor.node.hasClass(prev_node, 'fr-tmp'))
              ) {
                prev_node = prev_node.previousSibling;
              }
              if (next_node) {
                return false;
              }

              // Previous node.
              // Previous node is not BR.
              // Previoues node is not block tag.
              // No next node.
              // Parent node has text.
              // Previous node has text.
              if (
                prev_node &&
                parent_node &&
                prev_node.tagName !== 'BR' &&
                !editor.node.isBlock(prev_node) &&
                !next_node &&
                parent_node.textContent.replace(/\u200B/g, '').length > 0 &&
                prev_node.textContent.length > 0 &&
                !editor.node.hasClass(prev_node, 'fr-marker')
              ) {
                // Fix for https://github.com/froala/wysiwyg-editor/issues/1166#issuecomment-204549406.
                if (
                  !(
                    editor.el === parent_node &&
                    !next_node &&
                    editor.opts.enter === FroalaEditor.ENTER_BR &&
                    editor.browser.msie
                  )
                ) {
                  br.parentNode.removeChild(br);
                }
              }
            }

            // Regular node.
            else if (
              parent_node &&
              !(
                editor.node.isBlock(parent_node) ||
                editor.node.isElement(parent_node)
              )
            ) {
              // Check if we have something else than BR.
              if (
                !br.previousSibling &&
                !br.nextSibling &&
                editor.node.isDeletable(br.parentNode)
              ) {
                _processBR(br.parentNode);
              }
            }
          }
          if (el.tagName === 'BR') {
            _processBR(el);
          } else {
            var brs = el.querySelectorAll('br');
            for (i = 0; i < brs.length; i++) {
              _processBR(brs[i]);
            }
          }
        }
      }
      html = editor.clean.exec(html, _processOnGet);
      var new_html = editor.events.chainTrigger('html.get', html);
      if (typeof new_html === 'string') {
        html = new_html;
      }

      // Deal with pre.
      html = html.replace(/<pre(?:[\w\W]*?)>(?:[\w\W]*?)<\/pre>/g, function (str) {
        return str.replace(/<br>/g, '\n');
      });

      // Keep META.
      html = html.replace(/<meta((?:[\w\W]*?)) data-fr-http-equiv="/g, '<meta$1 http-equiv="');
      return html;
    }

    options = options || {};
    const imagePlugins = ['image', 'insertImage'];
    if (options.externalParams.imageBrowseEnabled) {
      froalaDefaultConfig.pluginsEnabled.push(...imagePlugins);
    }

    options = $.extend({}, froalaDefaultConfig, options);

    const initializefroala = function (resolve) {
      csui.require(['csui/lib/froala_editor/js/froala_editor.pkgd.min',
      'css!csui/lib/froala_editor/css/froala_editor.pkgd.min'
      ], function (
        FroalaEditor
      ) {
        return resolve(new FroalaEditor(selector, options));
      });
    };

    return new Promise(function (resolve, reject) {
      let froalaLocale = i18n.settings.locale;
      if (LocalizationMappings.hasOwnProperty(froalaLocale)) {
        froalaLocale = LocalizationMappings[froalaLocale];
      }
      if (!froalaLocale) {
        initializefroala(resolve);
        return;
      }
      const languagePackPath = `csui/lib/froala_editor/js/languages/${froalaLocale}`;
      require([languagePackPath], function (lang) {
        options.language = froalaLocale;
        initializefroala(resolve);
      }, function (error) {
        initializefroala(resolve);
      });
    });
  };
  return bootstrapFroalaEditor;
});




csui.define('css!csui/widgets/navigation.header/impl/navigation.header.controls',[],function(){});

csui.define('csui/widgets/navigation.header/navigation.header.controls',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui-ext!csui/widgets/navigation.header/navigation.header.controls',
  'css!csui/widgets/navigation.header/impl/navigation.header.controls'
], function (module, _, Backbone, extraNavIcons) {
  'use strict';

  var config = module.config();

  var logo = new Backbone.Model(_.extend({
    location: 'left'
  }, config.logo));
// TODO Remove later
  var leftSide = new Backbone.Collection([]);
  var rightSide = new Backbone.Collection([
    {
      id: 'csui/widgets/navigation.header/controls/progressbar.maximize/progressbar.maximize.view',
      sequence: 100,
      // show progressbar-maximize only while uploading any item.
      parentClassName: 'csui-progressbar-maximize binf-hidden csui-icons'
    },
    {
      id: 'csui/widgets/navigation.header/controls/search/search.view',
      sequence: 100,
      parentClassName: 'csui-search csui-icons'
    },
    {
      id: 'csui/widgets/navigation.header/controls/help/help.view',
      sequence: 200,
      parentClassName: 'csui-help csui-icons'
    },
    {
      id: 'csui/widgets/navigation.header/controls/favorites/favorites.view',
      sequence: 300,
      parentClassName: 'csui-favorites csui-icons'
    },
    {
      id: 'csui/widgets/navigation.header/controls/user.profile/user.profile.view',
      sequence: 400,
      parentClassName: 'csui-profile csui-icons'
    }
  ], {
    comparator: 'sequence'
  });

  if (extraNavIcons) {
    _.filter(extraNavIcons, function (toolItem) {
      // allowing only “iwatch” module’s icon in navigation header controls as per LPAD-55595
      // allowing "conws" module's add workspace icon in navigation header controls as per LPAD-97464
      return (toolItem.id.indexOf('iwatch/') === 0 || toolItem.id.indexOf('conws/') === 0)  && rightSide.add(toolItem);
    });
  }

  var masks = _.reduce(_.values(config.masks || {}), function (result, mask) {
    return {
      blacklist: result.blacklist.concat(mask.blacklist || []),
      whitelist: result.whitelist.concat(mask.whitelist || [])
    };
  }, {
    blacklist: [],
    whitelist: []
  });
  masks = {
    blacklist: _.unique(masks.blacklist),
    whitelist: _.unique(masks.whitelist)
  };

  function filterComponentByMask(component) {
    return !_.contains(masks.blacklist, component.id) &&
           (!masks.whitelist.length ||
            _.contains(masks.whitelist, component.id));
  }

  leftSide.remove(leftSide.reject(filterComponentByMask));
  rightSide.remove(rightSide.reject(filterComponentByMask));

  return {
    logo: logo,
    leftSide: leftSide,
    rightSide: rightSide
  };
});


/* START_TEMPLATE */
csui.define('hbs!csui/pages/start/impl/navigationheader/impl/navigationheader',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-global-message\"></div>\n<nav class=\"csui-navbar binf-navbar binf-navbar-default zero-gutter\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mainNavigationAria") || (depth0 != null ? lookupProperty(depth0,"mainNavigationAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mainNavigationAria","hash":{},"loc":{"start":{"line":2,"column":81},"end":{"line":2,"column":103}}}) : helper)))
    + "\">\n  <div class=\"binf-container-fluid\">\n    <span class=\"binf-navbar-brand binf-collapse binf-navbar-collapse\">        \n      <span class=\"csui-logo\">\n        <span class=\"csui-logo-image\" role=\"img\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"productLogoAria") || (depth0 != null ? lookupProperty(depth0,"productLogoAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"productLogoAria","hash":{},"loc":{"start":{"line":6,"column":61},"end":{"line":6,"column":80}}}) : helper)))
    + "\"></span>\n      </span>\n    </span>\n    <div class=\"binf-nav binf-navbar-nav binf-navbar-left\"></div>\n    <div class=\"binf-nav binf-navbar-nav binf-navbar-right\" ></div>\n    <div class=\"binf-nav binf-navbar-nav csui-navbar-message\"></div>\n  </div>\n</nav>\n";
}});
Handlebars.registerPartial('csui_pages_start_impl_navigationheader_impl_navigationheader', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspective.manage/mixins/update.supportasset.branding.config.mixin',[
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/contexts/factories/connector',
  'csui/models/node/node.model',
  'csui/utils/url',
], function (_, $, ConnectorFactory, NodeModel, Url) {
  'use strict'

  const UpdateSupportAssetBrandingConfigMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        output: {},
        BRANDING_CONFIG_STYLESHEET_NAME: 'BRANDINGCONFIG_CSS_FILE.css',
        BRANDING_CONFIG: {
          FOLDER_NAME: 'Branding Config',
          FOLDER_TYPE_NAME: 'Support Asset Image Folder',
          FOLDER_TYPE: 1306
        },
        SUB_TYPE: 1309, // Support Asset volume subtype is 1309
        IMG_NO_UPLOAD: 'No Img Uploaded',
        CSS_NO_UPLOAD: 'No style modified',
        SUCCESS: 'success',
        ERROR: 'error',
        SUCCESS_WITHOUT_CSS: 'success without CSS',
        NO_RESULT_FOUND: 'no result found',
        brandingStylesheet: `
            .binf-widgets,
            .binf-widgets .csui-navbar.binf-navbar, 
            .binf-widgets.csui-pman-header-config .pman-header-preview-panel,
            .binf-widgets #breadcrumb-wrap .csui-perspective-breadcrumb,
            .binf-widgets #breadcrumb-wrap .breadcrumb-inner.breadcrumb-inner-header,        
            .binf-widgets .csui-perspective-breadcrumb,
            .binf-widgets .csui-image-picker .csui-brand-image-logo {
              background: [CUSTOM_BRANDING_BGCOLOR];
            }
            .binf-widgets .csui-perspective-view .banner-content-sidebar-perspective.cs-perspective #content-region, .binf-widgets .csui-perspective-view .banner-content-sidebar-perspective.cs-perspective #sidebar-region{
              background: [LANDING_PAGE_BGCOLOR];
            }
            .binf-widgets .csui-perspective-view .banner-content-sidebar-perspective.cs-perspective #main{
              background-color: [LANDING_PAGE_BGCOLOR];
            }
        `,
        getSupportAssetVolumeID: function () {
          const context = this.context || this.options.context
          const connector = context.getObject(ConnectorFactory)
          // method : GET
          const data = {
            url: `${connector.getConnectionUrl().getApiBase()}volumes/${this.SUB_TYPE
              }`,
          }
          return connector.makeAjaxCall(data)
        },
        // it fetches the Branding folderID if missing it will create the folder
        fetchBrandingConfigFolderDetails: function (supportasset, imgFile, isBrandLogoUriPresent) {
          let deferred = $.Deferred()
          const context = this.context || this.options.context
          const connector = context.getObject(ConnectorFactory);
          // method : GET
          const data = {
            url: `${connector
              .getConnectionUrl()
              .getApiBase('v2')}app/container/${supportasset.id}`,
          }
          connector
            .makeAjaxCall(data)
            .then((response) => {
              const brandingConfig = Array.isArray(response.results.contents) && response.results.contents.filter(items => items.name === this.BRANDING_CONFIG.FOLDER_NAME)
              if (brandingConfig.length > 0) {
                const { size, id } = brandingConfig[0]
                if (size > 0) {
                  // remove the items so that new items can be uploaded
                  this.getItemsFromNode(id)
                    .done((response) => {
                      const contents = response.results?.contents // list the ID only
                      this.deleteItemsFromBranding(contents, imgFile, isBrandLogoUriPresent)
                        .done(() => {
                          return deferred.resolve(brandingConfig[0])
                        })
                        .fail((error) => {
                          return deferred.reject(error)
                        })
                    })
                    .fail((error) => {
                      return deferred.reject(error)
                    })
                } else {
                  return deferred.resolve(brandingConfig[0])
                }
              } else {
                this.createBrandingConfigFolder(supportasset)
                  .done(response => {
                    return deferred.resolve(response)
                  },
                  )
              }
            })
            .fail(function (error) {
              return deferred.reject(error)
            })
          return deferred.promise();
        },
        // getItems from the node ID
        getItemsFromNode: function (nodeID) {
          const context = this.context || this.options.context
          const connector = context.getObject(ConnectorFactory)
          const data = {
            url: `${connector
              .getConnectionUrl()
              .getApiBase('v2')}app/container/${nodeID}`,
          }
          return connector.makeAjaxCall(data)
        },
        // getItems from the node ID
        getDetailsForBrandingConfig: function () {
          let deferred = $.Deferred();
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          const data = {
            url: `${connector
              .getConnectionUrl()
              .getApiBase('v2')}server/settings/branding`,
          }
          connector.makeAjaxCall(data)
            .then(response => {
              if (response?.results?.value) {
                try {
                  const brandingData = response.results.value;
                  if (brandingData.brandLogoUri) {
                    brandingData.brandLogoUri = `${connector.getConnectionUrl().getOrigin()}${brandingData.brandLogoUri}`
                  }
                  return deferred.resolve({ statusMsg: this.SUCCESS, data: brandingData })
                } catch (error) {
                  return deferred.reject({ statusMsg: this.ERROR })
                }
              } else {
                return deferred.reject({ statusMsg: this.ERROR })
              }

            })
            .fail(function (error) {
              return deferred.reject(error)
            })
          return deferred.promise();
        },

        // delete the items from Branding folder
        deleteItemsFromBranding: function (contents, imgFile, isBrandLogoUriPresent) {
          let deferred = $.Deferred();
          if ((contents.length === 0 || isBrandLogoUriPresent) && !imgFile) return deferred.resolve({ statusMsg: 'Nothing to be deleted' });
          let deferreds = [];
          let IDs = [];
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          IDs = contents.map(item => item.id); // reset all the ID's          
          IDs.forEach((id) => {
            deferreds.push(deferred);
            const data = {
              method: 'DELETE',
              url: `${connector.getConnectionUrl().getApiBase()}nodes/${id}`,
            }
            connector
              .makeAjaxCall(data)
              .then((response) => {
                return deferred.resolve(response)
              })
              .fail(function (error) {
                return deferred.reject(error)
              })
          })
          return $.whenAll.apply($, deferreds)
        },
        // creating Branding folder if Branding folder is missing
        createBrandingConfigFolder: function ({ id, container }) {
          const context = this.context || this.options.context
          const connector = context.getObject(ConnectorFactory)
          let deferred = $.Deferred();
          const postData = {
            type: this.BRANDING_CONFIG.FOLDER_TYPE, // SubType
            type_name: this.BRANDING_CONFIG.FOLDER_TYPE_NAME,
            container: container,
            name: this.BRANDING_CONFIG.FOLDER_NAME,
            parent_id: id,
          };
          const data = {
            method: 'POST',
            url: `${connector.getConnectionUrl().getApiBase()}nodes`,
            data: postData,
          };
          connector
            .makeAjaxCall(data)
            .then((response) => {
              return deferred.resolve(response)
            })
            .fail(function (error) {
              return deferred.reject(error)
            })
          return deferred.promise()
        },
        // upload branding logo
        uploadConfigInBrandingFolder: function (imgFile, res) {
          let deferred = $.Deferred();
          const context = this.context || this.options.context
          const connector = context.getObject(ConnectorFactory)
          if (!imgFile || !res || !imgFile instanceof File)
            return deferred.resolve({ statusMsg: this.IMG_NO_UPLOAD });
          const node = new NodeModel({ type: 144 }, { connector: connector })
          return node.save(
            {
              name: imgFile.name,
              type: 1305, // subType for support asset image type.
              parent_id: res.id,
              advanced_versioning: false,
            },
            {
              files: {
                file: imgFile,
              },
            },
          )
        },

        getBlodURL: function (blob) {
          if (!blob || !blob instanceof Blob) return
          const blobImgUrl = URL.createObjectURL(blob)
          return blobImgUrl
        },

        uploadBrandingConfigSettings: function (postData) {
          const context = this.context || this.options.context
          const connector = context.getObject(ConnectorFactory);
          const data = {
            method: 'POST',
            url: `${connector
              .getConnectionUrl()
              .getApiBase('v2')}server/settings/branding`,
            data: { value: JSON.stringify(postData) }
          }
          return connector.makeAjaxCall(data)
        },

        getNodeDetails: function (nodeID) {
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          const data = {
            url: `${connector
              .getConnectionUrl()
              .getApiBase('v2')}/nodes/${nodeID}/nodes?fields=properties`,
          }
          return connector.makeAjaxCall(data);
        },
        getFileDetails: function (id) {
          const context = this.context || this.options.context
          const connector = context.getObject(ConnectorFactory)
          var cgiUrl = new Url(connector.connection.url).getCgiScript()
          const url = `${cgiUrl}?func=doc.fetchcsui&nodeid=${id}`
          const data = {
            url: url,
            dataType: 'binary',
          }
          return connector.makeAjaxCall(data)
        },
        createStyleSheet: function(brandingSettingCodes){
          if(!brandingSettingCodes) return;

          const {customBrandingBgColor, breadcrumbColor} = brandingSettingCodes;
          let tempbrandingStylesheet = this.brandingStylesheet.trim();

          // check for hexa-color-code
          const regex = new RegExp(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
          
          if(regex.test(customBrandingBgColor)) {
            tempbrandingStylesheet = tempbrandingStylesheet.replaceAll('[CUSTOM_BRANDING_BGCOLOR]',customBrandingBgColor);
            tempbrandingStylesheet = tempbrandingStylesheet.replaceAll('[LANDING_PAGE_BGCOLOR]', customBrandingBgColor);
          }

          if(regex.test(customBrandingBgColor)) {
            tempbrandingStylesheet = tempbrandingStylesheet.replaceAll('[BREADCRUMB_COLOR]', breadcrumbColor);
          }

          const brandingConfigCSSUri = URL.createObjectURL(new Blob([tempbrandingStylesheet],{
            type: 'text/css',
            name: this.BRANDING_CONFIG_STYLESHEET_NAME                      
          }));

          //reset to default when user in high constrast mode
          let highContrast = matchMedia('(forced-colors: active)');
          if(!(highContrast?.matches)) return brandingConfigCSSUri;          
        },
      })
    },
  }
  return UpdateSupportAssetBrandingConfigMixin
})
;



csui.define('csui/utils/cache.assets/cache.assets',[
  'csui/lib/underscore',
  // Load and register external perspectives
  'csui-ext!csui/utils/cache.assets/cache.assets'
], function (_, extraCacheAssets) {
  let cacheAssetsList = [{
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/icons.setting/images/theme_unchecked.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/icons.setting/images/theme_checked.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/icons.setting/images/icon_theme_default.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/icons.setting/images/icon_theme_light.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/icons.setting/images/icon_theme_dark.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/navigationheader/images/light_favorites_icon.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/navigationheader/images/dark_favorites_icon.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/navigationheader/images/light_help_icon.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/navigationheader/images/dark_help_icon.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/navigationheader/images/light_search_icon.svg"
  }, {
    as: "image",
    href: "csui/themes/carbonfiber/image/branding/navigationheader/images/dark_search_icon.svg"
  }
];

  if(extraCacheAssets) {
    extraCacheAssets = _.flatten(extraCacheAssets);
    cacheAssetsList.push(...extraCacheAssets);
  }
  return cacheAssetsList;
});

csui.define('css!csui/pages/start/impl/navigationheader/impl/navigationheader',[],function(){});

csui.define('csui/pages/start/impl/navigationheader/navigationheader.view',[
  'require', 'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/controls/globalmessage/globalmessage',
  'csui/utils/contexts/factories/user',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/widgets/navigation.header/navigation.header.controls',
  'hbs!csui/pages/start/impl/navigationheader/impl/navigationheader',
  'i18n!csui/pages/start/impl/nls/lang',
  'i18n!csui/pages/start/nls/lang',
  'csui/utils/high.contrast/detector!',
  'csui/lib/radio',
  'csui/utils/url',
  'csui/utils/node.links/node.links',
  'csui/utils/base',
  'csui/utils/contexts/factories/branding.config.factory',
  'csui/perspective.manage/mixins/update.supportasset.branding.config.mixin',
  'csui/utils/commonconfig.util',
  'csui/utils/cache.assets/cache.assets',
  'css!csui/pages/start/impl/navigationheader/impl/navigationheader',
  'csui/lib/jquery.when.all'
], function (require, module, _, $, Backbone, Marionette, GlobalMessage, UserModelFactory,
  LayoutViewEventsPropagationMixin, ApplicationScopeModelFactory, controls, template, lang, titleLang, highContrast, Radio, Url,
  NodeLinks, base, BrandingConfigFactory, UpdateSupportAssetBrandingConfigMixin, CommonConfigUtil,CacheAssets) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    enableMinimiseButtonOnProgressPanel: true
  });

  var NavigationHeaderView = Marionette.LayoutView.extend({
    template: template,

    regions: {
      messageRegion: '.csui-navbar-message'
    },

    ui: {
      navbar: '.csui-navbar',
      branding: '.binf-navbar-brand',
      logo: '.csui-logo-image',
      left: '.binf-navbar-left',
      right: '.binf-navbar-right',
      csuiLogo: '.csui-logo'
    },

    events: {
      'click @ui.csuiLogo': 'onClickHomeIcon',
      'keydown @ui.csuiLogo': 'onKeydownHomeIcon'
    },

    templateHelpers: function () {
      return {
        mainNavigationAria: lang.mainNavigationAria,
        productLogoAria: _.str.sformat(lang.productLogoAria, titleLang.ProductName),
      };
    },

    constructor: function NavigationHeaderView(options) {
      console.warn('DEPRECATED: Instead use "smart/controls/app.header/app.header.view".');
      Marionette.LayoutView.call(this, options);
      this.propagateEventsToRegions();
      this.headerConfig = null;
      this.user = options.user || this.options.context.getModel(UserModelFactory);
      this.applicationScope = options.applicationScope || this.options.context.getModel(ApplicationScopeModelFactory);
      this.brandingConfigData = this.options.context.getModel(BrandingConfigFactory);
      this.listenTo(this.brandingConfigData, 'change:branding', this._applyBrandingStyles);
      this.listenTo(this, 'render:controls', this._adjustControls.bind(this));
      this.listenTo(this, 'processbar:minimize processbar:maximize',
        this._adjustControlsWithAnimation.bind(this));
      this.listenTo(this, 'before:destroy', _.bind(function () {
        $(window).off('resize.' + this.cid, this._adjustControls.bind(this));
      }, this));
      $(window).on('resize.' + this.cid, this._adjustControls.bind(this));
      this.listenTo(this.options.context?.previewBranding, 'change', this._onRenderPage);
      this.listenTo(this.options.context?.previewBranding, 'exit:edit:perspective', this._applyBrandingStyles);
      this.listenTo(this.options.context, 'sync error', this._toggleVisibility);
      this.listenTo(this, 'before:destroy', _.bind(function () {

      }, this));
      this.listenTo(this.brandingConfigData, 'change:branding' , this._applyBrandingStyles);
      Array.isArray(CacheAssets) && CacheAssets.length > 0 && this._cacheAssets();
    },

    _onRenderPage: function () {
      if (this.options.isPerspectiveEdit) {
        const newConfig = this.user?.get('headerconfig');
        if (this.headerConfig?.options?.header?.widgets) {
          var widgetObjs = [];
          _.each(this.headerConfig.options.header.widgets, function (view) {
            var obj = {
              options: view.options,
              view: view.view
            }
            widgetObjs.push(obj);
          });
          this.headerConfig.options.header.widgets = widgetObjs;
        }
        this.headerConfig = _.clone(newConfig);
        this.render();
      }
    },

    _applyBrandingStyles: function () {
      this.applyIconTheme();
      if (this.options.isPerspectiveEdit) {   
        const tempBrandingStylesheet = this._addBrandingStyling(this.options.context?.previewBranding, true);
        // logo logic
        const logoLink = this.options.context?.previewBranding?.get('brandLogoUri');
        this.loadLogo(logoLink); 
        const stylesheetID = 'edit-branding-stylesheet';
        document.getElementById(stylesheetID)?.remove();
        const link = document.createElement('link');
        link.id = stylesheetID;
        link.rel = 'stylesheet';
        link.href = tempBrandingStylesheet;
        $('.pman-mode-edit').append(link);
      }else{
        const logoLink = this.brandingConfigData?.get('brandLogoUri');
        const cssUri = this.brandingConfigData?.get('brandingCSS');
        this.loadLogo(logoLink); 
        this.loadBrandingCSSFile(cssUri)
      }
    },
    _addBrandingStyling: function (config, hardApply) {
      if(!config) return;
      const brandingSettingCodes = config.get('brandingSettingCodes')
      const brandingConfigCSSUri = this.createStyleSheet(brandingSettingCodes, hardApply);
      
      return brandingConfigCSSUri;
    },

    applyIconTheme: function () {
      const ct = this.options.context;
      const iconTheme = ct?.previewBranding?.get('brandingSettingCodes')?.iconThemes ?? ct?.navigationHeaderView?.brandingConfigData?.get('brandingSettingCodes')?.iconThemes;
      this.themeCode = iconTheme;
      if (!iconTheme || iconTheme === 'default') {
        this.$el.removeClass('icon_theme_dark');
        this.$el.removeClass('icon_theme_light');
      } else if (iconTheme === 'dark') {
        this.$el.removeClass('icon_theme_light');
        this.$el.addClass('icon_theme_' + iconTheme);
      } else {
        // light
        this.$el.removeClass('icon_theme_dark');
        this.$el.addClass('icon_theme_' + iconTheme);
      }

      //reset to default when user in high constrast mode
      let highContrast = matchMedia('(forced-colors: active)');
      if (highContrast.matches) this.$el.removeClass('icon_theme_dark').removeClass('icon_theme_light');
    },

    _adjustControls: function () {
      var totalWidth = this.el.offsetWidth,
        leftToolbarEle = this.el.getElementsByClassName('binf-navbar-left')[0],
        leftToolbarWidth = 0,
        rightToolbarEle = this.el.getElementsByClassName('binf-navbar-right')[0],
        rightToolbarWidth = 0,
        logoEle = this.el.getElementsByClassName('csui-logo')[0],
        logoLocation = controls.logo.get('location'),
        logoWrapper = this.el.getElementsByClassName('csui-logo-' + logoLocation)[0],
        isLogoInAbsolutePos = logoWrapper && window.getComputedStyle(logoWrapper).position === 'absolute',
        bufferForLogo = logoLocation==="left" ? 53 : -240,
        logoEleWidth = logoEle.offsetWidth + bufferForLogo;

      for (var i = 0; i < rightToolbarEle.childElementCount; i++) {
        rightToolbarWidth += (rightToolbarEle.children[i].offsetWidth || 0);
      }
      for (i = 0; i < leftToolbarEle.childElementCount; i++) {
        leftToolbarWidth += (leftToolbarEle.children[i].offsetWidth || 0);
      }

      // if the logo's wrapper has relative position, then obtain logo element overlapping by
      // calculating all the elements against total width.
      // Not required as logo is moved to left
      var isLogoOverlapped = !(isLogoInAbsolutePos && "left"!==logoLocation ?
        ((leftToolbarWidth + logoEleWidth / 2 < totalWidth / 2) &&
          (rightToolbarWidth + logoEleWidth / 2 < totalWidth / 2)) :
        totalWidth > (leftToolbarWidth + rightToolbarWidth + logoEleWidth));

      if (isLogoOverlapped) {
        logoEle.classList.add('binf-logo-hide');
      } else {
        if (logoEleWidth > 40) {
          logoEle.classList.remove('binf-logo-hide');
        }
      }
      this.listenTo(this, "header:control:clicked", _.bind(function () {
        this.trigger("control:clicked");
      }, this));
      if (this.options.isPerspectiveEdit) {
        let tabindexElements = this.$el[0].querySelectorAll('[tabindex="0"]');
        this.$el.find(tabindexElements).attr("tabindex", "-1");
      }
    },

    _adjustControlsWithAnimation: function () {
      // considering progress panel's maximize and minimize animation effects.
      setTimeout(_.bind(function () {
        this._adjustControls();
      }, this), 301);
    },

    onRender: function () {
      var context = this.options.context,
        self = this;

      GlobalMessage.setProgresspanelMessageRegionView(this, {
        classes: "csui-global-message",
        enableMinimiseButtonOnProgressPanel: config.enableMinimiseButtonOnProgressPanel
      });

      var logoLocation = controls.logo.get('location');
      if (logoLocation === 'none') {
        this.ui.logo.addClass('binf-hidden');
      } else {
        this.ui.branding.addClass('csui-logo-' + logoLocation);
      }
      self.breadCrumbStyles && self.breadCrumbStyles.remove();
      //if (this.user.get("headerconfig")) {
      //should not show background colour while login, should show only once page loaded
      //if (this.options.isPerspectiveEdit || !_.isEmpty(this.applicationScope.get("id"))) {
      this._applyBrandingStyles();
      //}
      //}
      this._resolveComponents()
        .done(function () {
          self.trigger('before:render:controls', self);
          controls.leftSide.each(createControls.bind(self, self.ui.left));
          controls.rightSide.each(createControls.bind(self, self.ui.right));
          self.trigger('render:controls', self);
          self._showSystemMessage();
        });

      function createControls(target, control) {
        var View = control.get('view');
        if (View) {
          var el = $('<div>').addClass(control.get('parentClassName'))
            .appendTo(target),
            region = self.addRegion(_.uniqueId('csui:navigation.header.control'), { selector: el }),
            view = new View({
              context: context,
              parentView: self,
              themeCode: self.themeCode,
              highContrast: highContrast   // highContrast is 1 for white on dark and 2 for dark on white background
            });
          region.show(view);
        }
      }
      Radio.channel("branding:logo").trigger("update:logo");
    },

    loadBrandingCSSFile: function (brandingCSSURL) {
      const styleID = 'csuiBrandingCSSURL'
      document.getElementById(styleID)?.remove();
      if (!brandingCSSURL) return;
      const link = document.createElement('link');
      link.id = styleID;
      link.rel = 'stylesheet';
      link.href = brandingCSSURL;
      document.body.appendChild(link); // to set the highest priority to branding
    },
    loadLogo: function (imgURL) {
      if (!imgURL) {
        this.ui.logo.removeAttr('style');
        return;
      }
      const backgroundImageStyle = `background-image: url(${imgURL}); background-size: contain`;
      this.ui.logo.attr('style', backgroundImageStyle);
    },

    _resolveComponents: function () {
      if (this._controlsResolved) {
        return this._controlsResolved;
      }

      function resolveControl(name) {
        var deferred = $.Deferred();
        require([name], deferred.resolve, deferred.reject);
        return deferred.promise();
      }

      var allComponents = controls.leftSide.models.concat(controls.rightSide.models),
        promises = allComponents.map(function (control) {
          return resolveControl(control.id);
        }),
        deferred = $.Deferred();
      $.whenAll.apply($, promises)
        .always(function (views) {
          views.forEach(function (view, index) {
            allComponents[index].set('view', view);
          });
          deferred.resolve();
        });
      this._controlsResolved = deferred.promise();
      return this._controlsResolved;
    },
    _showSystemMessage: function () {
      const shownSystemMsg = localStorage.getItem('shownSystemMsg');
      var self = this;
      if (!shownSystemMsg) {
        localStorage.setItem('shownSystemMsg', true);
        if (CommonConfigUtil.enableFeatureInSmartView()) {
          csui.require(['csui/models/system.messages/system.message.server.adaptor.mixin'], function (Mix) {
            Mix.mixin(NavigationHeaderView.prototype);
            const server = self.constructor.prototype.makeServerAdaptor(self.options.context?._factories?.connector?.property);
            server.parseResponse(lang);
          });
        }
      }
    },
    addLinkToIcon: function () {
      var connector = this.options && this.options.context && this.options.context._user && this.options.context._user.connector,
        serverUrl = new Url(connector && connector.connection.url || location.href),
        link = NodeLinks.getHomeUrl(serverUrl);
      return link;
    },
    onClickHomeIcon: function (e) {
      if (base.isControlClick(e)) {
        // do nothing, let's execute browser's default behaviour as it is in both ctrl+click and
        // command+click in mac.
      } else {
        e.preventDefault();
        this.applicationScope.set('id', '');
      }
    },

    onKeydownHomeIcon: function (e) {
      if (e.keyCode === 32 || e.keyCode === 13) {
        this.onClickHomeIcon(e);
      }
    },

    _toggleVisibility: function () {
      if (!this._isRendered) return;
      // Detect the user landing page.
      const csuiLogo = this.ui.csuiLogo;
      if (!this.applicationScope.id) {
        // home page
        csuiLogo.removeAttr('role');
        csuiLogo.removeAttr('data-href');
        this.ui.csuiLogo.css('cursor', 'auto');
        csuiLogo.removeAttr('title');
        csuiLogo.removeAttr('aria-label');
        csuiLogo.attr('tabindex', '-1');
      } else {
        csuiLogo.attr('role', 'link')
        csuiLogo.attr('data-href', this.addLinkToIcon());
        this.ui.csuiLogo.css('cursor', 'pointer');
        csuiLogo.attr('title', lang.Home);
        csuiLogo.attr('aria-label', lang.HomeIconAria);
        csuiLogo.attr('tabindex', '0');
      }
    },

    _cacheAssets : function() {
      const origin = this.user.connector?.getConnectionUrl()?.getOrigin(),
      supportPath = this.user.connector?.connection?.supportPath,
      concatenatedPath = supportPath ? origin.concat(supportPath) : origin;
      CacheAssets.forEach(element => {        
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = element.as;
        link.href = `${concatenatedPath}/${element.href}`;
        $('head').append(link);
      });
    }
  });

  _.extend(NavigationHeaderView.prototype, LayoutViewEventsPropagationMixin);
  // LPAD-117164: As Mixin is moved to CSSVUI and Other D2 are extending NavigationHeader, loading it on demand
  // SystemMessageAdaptorMixin.mixin(NavigationHeaderView.prototype);
  UpdateSupportAssetBrandingConfigMixin.mixin(NavigationHeaderView.prototype);

  return NavigationHeaderView;
});


csui.define('csui/controls/app.header/app.header.view',[
  "smart/controls/app.header/app.header.view",
  "i18n!csui/pages/start/impl/nls/lang",
  "csui/utils/commonconfig.util",
], function (AppHeaderView, lang, CommonConfigUtil) {
  "use strict";

  const CSUIAppHeaderView = AppHeaderView.extend({
    onBeforeAttach: function () {
      this._showSystemMessage();
    },
    _showSystemMessage: function () {
      const shownSystemMsg = localStorage.getItem("shownSystemMsg");
      const self = this;
      if (!shownSystemMsg) {
        localStorage.setItem("shownSystemMsg", true);
        if (CommonConfigUtil.enableFeatureInSmartView()) {
          csui.require([
            "csui/models/system.messages/system.message.server.adaptor.mixin",
          ], function (Mix) {
            Mix.mixin(AppHeaderView.prototype);
            const server = AppHeaderView.prototype.makeServerAdaptor(
              self.options.context?._factories?.connector?.property
            );
            server.parseResponse(lang);
          });
        }
      }
    },
  });

  return CSUIAppHeaderView;
});




csui.define('csui/controls/app.header/burger.menu/burger.menu',[
  'module',
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'csui-ext!csui/controls/app.header/burger.menu/burger.menu'
], function (module, $, _, extraMenuItems) {
  'use strict';

  const config = {
    allowedModules: [], // default to empty array
    ...module.config()
  }

  const __filterMenuItems = (items=[]) =>{
    const allowedModules = config.allowedModules;
    if(allowedModules.length>0){
      items = items.filter(item=>allowedModules.indexOf(item.moduleName)>-1);
    }
    return items;
  }

  let burgerMenuItems = {
    getAllMenuItems: function (args) {
      let deferred = $.Deferred();
      let promises = [];
      let allMenuItems = [];
      let finalMenuItems = {
        groups: [],
        items: []
      };

      if (extraMenuItems?.length) {
        extraMenuItems.forEach(getMenuItems => {
          // TODO: handle error scenario
          promises.push($.when(getMenuItems(args)).then(function (res) {
            if(res.items.length>0){
              res.items = __filterMenuItems(res.items);
              allMenuItems.push(res);
            }else{
              console.debug('No items are found')
            }
            
          }));
        });
      }
      $.whenAll.apply($, promises).then(() => {
        if (allMenuItems?.length) {
          allMenuItems.forEach(__menuItem => {
            if (__menuItem?.groups?.length) {
              let groups = __menuItem.groups;
              groups.forEach(function (group) {
                if (finalMenuItems.groups.some((group1) => group1.id === group.id)) {
                } else {
                  finalMenuItems.groups.push(group);
                }
              });
            }
            let items = __menuItem.items;
            items.forEach(function (item) {
              if (finalMenuItems.items.some((item1) => item1.signature === item.signature)) {
              } else {
                finalMenuItems.items.push(item);
              }
            });
          });
        }
        deferred.resolve(finalMenuItems);
      });

      return deferred.promise();
    }
  };

  return burgerMenuItems;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/error.global/impl/error.global',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return " aria-describedby=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"msgId") || (depth0 != null ? lookupProperty(depth0,"msgId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"msgId","hash":{},"loc":{"start":{"line":5,"column":92},"end":{"line":5,"column":101}}}) : helper)))
    + "\" ";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class='server-error-message-wrapper'>\n          <div class='server-error-message horizontal-center-align'>\n            <span id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"msgId") || (depth0 != null ? lookupProperty(depth0,"msgId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"msgId","hash":{},"loc":{"start":{"line":12,"column":22},"end":{"line":12,"column":31}}}) : helper)))
    + "\" class='csui-acc-focusable'>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":12,"column":60},"end":{"line":12,"column":71}}}) : helper)))
    + "</span>\n          </div>\n        </div>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class='navigation-control-container' "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"noHistory") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"loc":{"start":{"line":20,"column":50},"end":{"line":20,"column":97}}})) != null ? stack1 : "")
    + ">\n          <a class='go-back-button circle-border horizontal-center-align' href=\"#\"\n            title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTooltip") || (depth0 != null ? lookupProperty(depth0,"backTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTooltip","hash":{},"loc":{"start":{"line":22,"column":19},"end":{"line":22,"column":34}}}) : helper)))
    + "' aria-label='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTooltip") || (depth0 != null ? lookupProperty(depth0,"backTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTooltip","hash":{},"loc":{"start":{"line":22,"column":48},"end":{"line":22,"column":63}}}) : helper)))
    + "' class='csui-acc-focusable'>\n              <span class='icon icon-back'></span>\n          </a>\n          <div class='go-back-text button-text horizontal-center-align' title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTooltip") || (depth0 != null ? lookupProperty(depth0,"backTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTooltip","hash":{},"loc":{"start":{"line":25,"column":79},"end":{"line":25,"column":94}}}) : helper)))
    + "'>\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backText") || (depth0 != null ? lookupProperty(depth0,"backText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backText","hash":{},"loc":{"start":{"line":26,"column":20},"end":{"line":26,"column":32}}}) : helper)))
    + "</span>\n          </div>\n        </div>\n        <div class='navigation-control-container'>\n          <a class='go-home-button circle-border horizontal-center-align' href=\"#\"\n            title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"homeTooltip") || (depth0 != null ? lookupProperty(depth0,"homeTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"homeTooltip","hash":{},"loc":{"start":{"line":31,"column":19},"end":{"line":31,"column":34}}}) : helper)))
    + "' aria-label='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"homeTooltip") || (depth0 != null ? lookupProperty(depth0,"homeTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"homeTooltip","hash":{},"loc":{"start":{"line":31,"column":48},"end":{"line":31,"column":63}}}) : helper)))
    + "' class='csui-acc-focusable'>\n              <span class='icon icon-home'></span>\n          </a>\n          <div class='go-home-text button-text horizontal-center-align' title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"homeTooltip") || (depth0 != null ? lookupProperty(depth0,"homeTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"homeTooltip","hash":{},"loc":{"start":{"line":34,"column":79},"end":{"line":34,"column":94}}}) : helper)))
    + "'>\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"homeText") || (depth0 != null ? lookupProperty(depth0,"homeText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"homeText","hash":{},"loc":{"start":{"line":35,"column":20},"end":{"line":35,"column":32}}}) : helper)))
    + "</span>\n          </div>\n        </div>\n";
},"6":function(container,depth0,helpers,partials,data) {
    return " style='display:none;' ";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showCloseButton") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"loc":{"start":{"line":39,"column":8},"end":{"line":43,"column":15}}})) != null ? stack1 : "");
},"9":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <div class='navigation-control-container'>\n            <button type=\"submit\" class=\"close-button highlighted-btn\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"closeText") || (depth0 != null ? lookupProperty(depth0,"closeText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"closeText","hash":{},"loc":{"start":{"line":41,"column":71},"end":{"line":41,"column":84}}}) : helper)))
    + "</button>\n          </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='main-area-container' role='region' aria-label='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"regionAria") || (depth0 != null ? lookupProperty(depth0,"regionAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"regionAria","hash":{},"loc":{"start":{"line":1,"column":59},"end":{"line":1,"column":73}}}) : helper)))
    + "'>\n  <div class='main-area-group'>\n    <div class='error-message-area'>\n      <div class='error-message-wrapper'>\n        <h2 class='error-message horizontal-center-align' "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"message") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":5,"column":58},"end":{"line":5,"column":110}}})) != null ? stack1 : "")
    + " >\n          <span class='csui-acc-focusable'>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"errorMessage") || (depth0 != null ? lookupProperty(depth0,"errorMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"errorMessage","hash":{},"loc":{"start":{"line":6,"column":43},"end":{"line":6,"column":59}}}) : helper)))
    + "</span>\n        </h2>\n      </div>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"message") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":9,"column":6},"end":{"line":15,"column":13}}})) != null ? stack1 : "")
    + "    </div>\n\n    <div class='navigation-area horizontal-center-align'>\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"hideNavigationButtons") : depth0),{"name":"unless","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(8, data, 0),"loc":{"start":{"line":19,"column":6},"end":{"line":44,"column":17}}})) != null ? stack1 : "")
    + "    </div>\n  </div>\n</div>\n";
}});
Handlebars.registerPartial('csui_widgets_error.global_impl_error.global', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/widgets/error.global/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/error.global/impl/nls/root/lang',{

  errorMessage: 'There was a problem serving the requested page.',
  backText: 'Go back',
  backTooltip: 'Navigate back to previous URL',
  homeText: 'Home',
  homeTooltip: 'Navigate to landing page',
  closeText: 'Close',
  closeTooltip: 'Close the error page',
  globalErrorRegionAria: 'Global error'

});




csui.define('css!csui/widgets/error.global/impl/error.global',[],function(){});

csui.define('csui/widgets/error.global/error.global.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/base',
  'csui/utils/contexts/factories/global.error', 'csui/utils/contexts/factories/application.scope.factory',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'hbs!csui/widgets/error.global/impl/error.global',
  'i18n!csui/widgets/error.global/impl/nls/lang',
  'csui/utils/log',
  'module',
  'css!csui/widgets/error.global/impl/error.global'
], function (_, $, Marionette, base, GlobalErrorModelFactory,
    ApplicationScopeModelFactory, TabableRegionBehavior, template, lang, log, module) {
  'use strict';
  log = log(module.id);

  var GlobalErrorView = Marionette.ItemView.extend({
    className: 'csui-global-error',

    template: template,
    templateHelpers: function () {
      return {
        errorMessage: lang.errorMessage,
        backText: lang.backText,
        backTooltip: lang.backTooltip,
        homeText: lang.homeText,
        homeTooltip: lang.homeTooltip,
        closeText: lang.closeText,
        closeTooltip: lang.closeTooltip,
        msgId: _.uniqueId('msg'),
        regionAria: lang.globalErrorRegionAria,
        noHistory: this.noHistory
      };
    },

    TabableRegion: {
      behaviorClass: TabableRegionBehavior,
      initialActivationWeight: 100
    },

    ui: {
      errorMessage: '.error-message > span',
      closebutton: '.close-button'
    },

    events: {
      'keydown': 'onKeyInView',
      'click .go-home-button': 'onClickHome',
      'click .go-home-text': 'onClickHome',
      'click .go-back-button': 'onClickBack',
      'click .go-back-text': 'onClickBack',
      'click @ui.closebutton': 'onClickClose'
    },

    constructor: function GlobalErrorView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      if (!this.model) {
        this.model = options.context.getModel(GlobalErrorModelFactory, options);
      }

      this.noHistory = options.context &&
                       options.context.viewStateModel &&
                       options.context.viewStateModel.getHistory().length < 1;

      // IE11 fails to update CSS center styling correctly on window resize
      if (base.isIE11()) {
        var self = this;
        var resizeHandler = function () {
          self.render();
        };
        $(window).on('resize', resizeHandler);
        this.once('before:destroy', function () {
          $(window).off('resize', resizeHandler);
        });
      }
    },

    currentlyFocusedElement: function (event) {
      return this.ui.errorMessage;
    },

    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        // space(32) or enter(13)
        event.preventDefault();
        event.stopPropagation();
        $(event.target).trigger('click');
      }
    },

    onClickHome: function (event) {
      event.preventDefault();
      event.stopPropagation();
      var context = this.options.context,
          viewStateModel = context && context.viewStateModel,
          start_id = viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.START_ID);
      if (start_id) {
        var nextNode = context.getModel('nextNode');
        nextNode.set('id', start_id);
      } else {
        var applicationScope = context.getModel(ApplicationScopeModelFactory);
        applicationScope.set('id', '');
      }
    },

    onClickBack: function (event) {
      event.preventDefault();
      event.stopPropagation();
      window.history.back();
    },

    onClickClose: function(event) {
      event.preventDefault();
      event.stopPropagation();
      // destroy view, the caller should listen to 'destroy' and 'childview:destroy'
      // to get informed about closing this view
      this.destroy();
    }

  });

  return GlobalErrorView;
});


csui.define('css!csui/pages/error.page/impl/error.page',[],function(){});

// Places the error page view to the page body
csui.define('csui/pages/error.page/error.page.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/widgets/error.global/error.global.view',
  'csui/utils/url',
  'csui/utils/non-attaching.region/non-attaching.region',
  'css!csui/pages/error.page/impl/error.page'
], function (_, $, Marionette, PageContext, ApplicationScopeModelFactory,
    GlobalErrorView, Url, NonAttachingRegion) {

  var ErrorPageView = Marionette.ItemView.extend({

    template: false,

    constructor: function ErrorPageView(options) {
      options || (options = {});
      options.el = document.body;

      Marionette.ItemView.prototype.constructor.call(this, options);

      // Namespace for binf widgets
      this.$el.addClass('binf-widgets csui-error-page-container');

      this.context = new PageContext();
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(this.applicationScope, 'change:id', this._onChangeId);
      this.globalErrorView = new GlobalErrorView({
        model: options.model,
        context: this.context
      });
    },

    onRender: function () {
      this.globalErrorView.render();
      this.$el.empty().append(this.globalErrorView.el);

      // Do not send showing events before triggering the first render event
      setTimeout(_.bind(function () {
        var bodyRegion = new NonAttachingRegion({el: this.el});
        bodyRegion.show(this, {render: false});
      }, this));
    },

    _onChangeId: function () {
	    location.href = Url.combine(new Url(new Url(location.pathname).getCgiScript()), 'app');
    }

  });

  return ErrorPageView;
});


csui.define('css!csui/pages/start/impl/start.page',[],function(){});

// Places navigation bar and the perspective pane to the page body
csui.define('csui/pages/start/start.page.view',['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/lib/marionette', 'csui/utils/routing',
  'csui/utils/contexts/perspective/perspective.context',
  'csui/utils/contexts/factories/connector',
  'csui/pages/start/perspective.routing', 'csui/utils/base',
  'csui/pages/start/impl/navigationheader/navigationheader.view',
  'csui/controls/app.header/app.header.view', 'i18n',
  'csui/controls/app.header/burger.menu/burger.menu',
  'csui/controls/perspective.panel/perspective.panel.view',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/utils/non-emptying.region/non-emptying.region',
  'csui/utils/non-attaching.region/non-attaching.region',
  'csui/utils/page.leaving.blocker', 'csui/controls/iconpreload/icon.preload.view',
  'csui/pages/error.page/error.page.view',
  'csui/perspective.manage/mixins/update.supportasset.branding.config.mixin',
  'csui/utils/contexts/factories/branding.config.factory',
  'csui/utils/namedsessionstorage',
  'i18n!csui/pages/start/impl/nls/lang',
  'csui/utils/commonconfig.util',
  'css!csui/pages/start/impl/start.page'
], function (module, _, $, Backbone, Marionette, routing, PerspectiveContext, ConnectorFactory,
  PerspectiveRouting, base, CSUINavigationHeaderView, CSUINavHeaderView, i18n, BurgerMenuItems, PerspectivePanelView,
  ViewEventsPropagationMixin, TabablesBehavior, TabableRegionBehavior, NonEmptyingRegion,
  NonAttachingRegion, PageLeavingBlocker, IconPreloadView, ErrorPageView, UpdateSupportAssetBrandingConfigMixin, BrandingConfigFactory, NamedSessionStorage, lang, CommonConfigUtil) {
  'use strict';


  let NavigationHeaderView = CSUINavigationHeaderView;

  var config = _.extend({
    useV2AppHeader: true,
    enableHamburger: true,
    signInPageUrl: 'signin.html',
    redirectToSignInPage: !routing.routesWithSlashes()
  }, module.config());

  config.useV2AppHeader && (NavigationHeaderView = CSUINavHeaderView);

  var StartPageView = Marionette.ItemView.extend({
    template: false,

    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior
      }
    },

    constructor: function StartPageView(options) {
      options || (options = {});
      options.el = document.body;

      Marionette.View.prototype.constructor.call(this, options);

      // Create application context for this page
      var context = options.context || new PerspectiveContext();
      var connector = context.getObject(ConnectorFactory);
      this.context = context;

      // Check if the page has authentication information
      // Use Basic Authentication (known credentials)
      if (!connector.connection.credentials &&
        // Use pre-authenticated session (session.ticket)
        !connector.authenticator.isAuthenticated() &&
        // Try pre-authenticated session from session storage
        !connector.authenticator.syncStorage().isAuthenticated() &&
        // Try pre-authenticated session from session storage
        !(connector.authenticator.interactive && connector.authenticator.interactive())) {
        if (!config.redirectToSignInPage) {
          // we are in app-mode and we have no credentials provided => show error
          this._showMissingCredentialsError();
        } else {
          this._navigateToSignIn();
        }
        return;
      }

      // If some call fails with an expired session, redirect to sign-in
      connector.authenticator.on('loggedOut', function (args) {
        // User's intentional logging out is followed by a redirect to the
        // logout page; do not change the location here too.
        if (args.reason === 'failed') {
          this._navigateToSignIn();
        }
        localStorage.removeItem('shownSystemMsg');
        (args.reason === 'logged-out') && context.viewStateModel && context.viewStateModel.clean();
      }, this);
      this.brandingConfig = context.getModel(BrandingConfigFactory);
      //this.loadSupportAssetID().then(_.bind(function() {
      //  this.navigationHeader.trigger("config:changed", this.brandingConfig);
      //}, this));
      this.loadSupportAssetID();
      let navHeaderViewOpts = {
        context: context,
        signInPageUrl: this.options.signInPageUrl,
        transparent: true,
        rtl: i18n.settings.rtl,
        brandingConfig: this.brandingConfig,
        skipLinks: [
          {
            attributes: {
              arialabel: lang.skipLinkAria,
              title: lang.skipLinkAria,
              href: "#content",
              target: "_self",
              id: "skipHeader",
            },
            execute: _.bind(function () {
              const headerBar = this.navigationHeader?.el?.querySelector(
                ".smart-application-header"
              );
              headerBar?.setAttribute("inert", "");
              const focusablesSelectors =
                "a[href]:not([tabindex='-1']), area[href]:not([tabindex='-1']), input:not([tabindex='-1']), select:not([tabindex='-1']), textarea:not([tabindex='-1']), otc-button:not([tabindex='-1']), button:not([tabindex='-1']), *[tabindex='0']," +
                " iframe:not([tabindex='-1']), object:not([tabindex='-1']), embed:not([tabindex='-1'])";
              const tabableElements =
                this.perspectivePanel.el?.querySelectorAll(focusablesSelectors);
              const tabableElementsArray = Array.from(tabableElements)
              const focusablesElements = tabableElementsArray.filter(
                function (element) {
                  return $(element).is(":visible");
                }
              );
              (focusablesElements.length > 0) && $(focusablesElements[0]).trigger("focus");
            }, this),
          },
        ],
        enableHamburger: config.enableHamburger
      };
      this.navigationHeader = new NavigationHeaderView(navHeaderViewOpts);

      context.brandingConfigData = this.brandingConfig;

      this.navigationHeader.on("render", _.bind(function () {
        if (config.useV2AppHeader) {
          this.navigationHeader.brandingConfig = this.brandingConfig;
          this.navigationHeader.brandingConfigData = this.brandingConfig;
          this.listenTo(
            this.brandingConfig,
            "change:branding",
            _.bind(this._applyBrandingStyles, this),
          );

          this.listenTo(this.navigationHeader, 'request:data', function () {
            BurgerMenuItems.getAllMenuItems({ context, connector }).then(_.bind(function (panel) {
              this.navigationHeader.trigger("sync:data", panel);
            }, this));
          });

          let skipLink = this.navigationHeader?.skipLinksCollectionView?.el?.querySelector('#skipHeader');

          !!skipLink && skipLink?.addEventListener('blur', _.bind(function (e) {
            let headerBar = this.navigationHeader?.el?.querySelector('.smart-application-header');
            headerBar?.removeAttribute('inert');
          }, this));

          // this.listenTo(
          //   this.options.context?.previewBranding,
          //   "change",
          //   this._onRenderPage,
          // );
          // this.listenTo(
          //   this.options.context?.previewBranding,
          //   "exit:edit:perspective",
          //   this._applyBrandingStyles,
          // );
          // this.listenTo(
          //   this.options.context,
          //   "sync error",
          //   this._toggleVisibility,
          // );
          // this.navigationHeader.listenTo(
          //   this.navigationHeader,
          //   "before:destroy",
          //   _.bind(function () {}, this),
          // );

          this.listenTo(this.navigationHeader, 'process:left:menu:item', _.bind(function (model) {
            let executeFun = model.get('execute');
            if (_.isFunction(executeFun)) {
              executeFun({ context: this.context, menuItem: model });
            }
          }, this));
        }
      }, this));

      this.context = context;
      this.context.navigationHeaderView = this.navigationHeader;

      this.perspectivePanel = new PerspectivePanelView({
        context: context
      });

      // .mouse-blocked {
      // pointer-events: none;
      // }
      this.listenTo(this.perspectivePanel, 'before:start:perspective:loading', function () {
        // Block whole start page view from mouse clicks
        this.el.classList.add('mouse-blocked');
      })
        .listenTo(this.perspectivePanel, 'after:finish:perspective:loading', function () {
          // Unblock whole start page view for mouse clicks
          this.el.classList.remove('mouse-blocked');
          this.navigationHeader.el.classList.remove("smart-app-header-hide");
        });

      // if applyFastTheme flag is enabled, then...
      // 1) hide the navigation header while starting the perspective loading
      // 2) show the navigation header as soon the perspective finishes loading
      if (this.options.applyFastTheme && this.perspectivePanel) {
        document.body.classList.add('csui-pre-loading');
        CommonConfigUtil.enableSideBar() && document.body.classList.add('csui-sidebar-enabled');
        this.listenToOnce(this.perspectivePanel, 'before:start:perspective:loading', function () {
          // nothing to do at this moment.
        });

        this.listenToOnce(this.perspectivePanel, 'after:finish:perspective:loading', function () {
          var preLoaderElement = this.options.preLoaderEle || '#csui-pre-loader';
          $('body > ' + preLoaderElement).remove();
          document.body.classList.remove('csui-pre-loading');
          if (this.context?._applicationScope?.get('id') === '') {
            if (!(this.navigationHeader.el.querySelector("otc-skiplinks"))) {
              let tabableElements = this.navigationHeader.el.querySelectorAll("[tabindex='0']");
              let focusablesSelectors = _.filter(tabableElements, function (selector) {
                return $(selector).is(':visible');
              });
              $(focusablesSelectors[0]).trigger('focus');
            }
          }
        });
      };

      this.propagateEventsToViews(this.navigationHeader, this.perspectivePanel);

      var routing = PerspectiveRouting.getInstance({
        context: context,
        urlCanChange: true
      });
      // Initialize URL routing and fetch the first perspective
      routing.start();

      // Namespace for binf widgets
      this.$el.addClass('binf-widgets');

      // Enable styling workarounds for Safari on iPad.  We might want to
      // put them to a separate CSS file loaded dynamically, instead of
      // having them in the same file identified by this class, if the size
      // of the workaround styles grows too much.
      if (base.isAppleMobile()) {
        this.$el.addClass('csui-on-ipad');
      }

      if (base.isIOSBrowser()) {
        this.$el.addClass('csui-on-macintosh');
      }

      csui.require(['csui/utils/accessibility'
      ], function (Accessibility) {
        Accessibility.isAccessibleMode() && this.$el.addClass('accessibility');
      }.bind(this));

      // Workaround for the back-forward cache in Safari, which ignores the
      // no-store cache control flag and loads the page from cache, when the
      // back button is clicked.  As long as logging out does not invalidate
      // the LLCookie/OTCSTicket and we write the ticket to the /app, going
      // back would allow the logged-out user working with the REST API again.
      //
      // http://madhatted.com/2013/6/16/you-do-not-understand-browser-history
      // http://www.mobify.com/blog/beginners-guide-to-http-cache-headers/
      $(window).on('unload', function () { });
    },


    _applyBrandingStyles: function () {
      let navigationHeaderView = this.navigationHeader;
      if (navigationHeaderView.options.isPerspectiveEdit) {
        const tempBrandingStylesheet = this._addBrandingStyling(navigationHeaderView.options.context?.previewBranding, true);
        const stylesheetID = 'edit-branding-stylesheet';
        document.getElementById(stylesheetID)?.remove();
        const link = document.createElement('link');
        link.id = stylesheetID;
        link.rel = 'stylesheet';
        link.href = tempBrandingStylesheet;
        $('.pman-mode-edit').append(link);
      } else {
        const cssUri = navigationHeaderView.brandingConfigData?.get('brandingCSS');
        this.loadBrandingCSSFile(cssUri)
      }
    },

    loadBrandingCSSFile: function (brandingCSSURL) {
      const styleID = 'csuiBrandingCSSURL'
      document.getElementById(styleID)?.remove();
      if (!brandingCSSURL) return;
      const link = document.createElement('link');
      link.id = styleID;
      link.rel = 'stylesheet';
      link.href = brandingCSSURL;
      document.body.appendChild(link); // to set the highest priority to branding
    },


    _addBrandingStyling: function (config, hardApply) {
      if (!config) return;
      const brandingSettingCodes = config.get('brandingSettingCodes')
      const brandingConfigCSSUri = this.createStyleSheet(brandingSettingCodes, hardApply);

      return brandingConfigCSSUri;
    },

    loadSupportAssetID: function () {
      const deferred = $.Deferred();
      this.getDetailsForBrandingConfig()
        .done(response => {
          const brandingSettingCodes = response?.data?.brandingSettingCodes;
          if (brandingSettingCodes) {
            const brandingConfigCSSUri = this.createStyleSheet(brandingSettingCodes);
            response.data.brandingCSS = brandingConfigCSSUri ?? '';
            response.data.tempBrandingCSS = brandingConfigCSSUri ?? '';
          }
          response.data.logoSrc = response.data.brandLogoUri;
          this.brandingConfig.set(response.data);
          this.brandingConfig.trigger('change:branding');

          return deferred.resolve("Success");
        })
        .fail(error => {
          return deferred.reject(error);
        });
      return deferred.promise();
    },

    onRender: function () {
      if (this._redirecting) {
        return this;
      }

      IconPreloadView.ensureOnThePage();

      config?.useV2AppHeader && this.navigationHeader.el.classList.add("smart-app-header-hide");
      this._appendView(this.navigationHeader);
      this._appendView(this.perspectivePanel);
      this.$el.children('.cs-perspective-panel').attr('role', 'main');

      // Do not send showing events before triggering the first render event
      setTimeout(_.bind(function () {
        var bodyRegion = new NonAttachingRegion({ el: this.el });
        bodyRegion.show(this, { render: false });
      }, this));

      // Listen to global message show event to make it tababable.
      // Note: Doing it from here since messagepanel.view is bundled with csui-data
      this.$el.on('globalmessage.shown', function (event, view) {
        var messageTabable = new TabableRegionBehavior(view.options, view);
      });
    },

    onBeforeDestroy: function () {
      this.navigationHeader && this.navigationHeader.destroy();
      this.perspectivePanel && this.perspectivePanel.destroy();
    },

    _appendView: function (view) {
      var region = new NonEmptyingRegion({ el: this.el });
      region.show(view);
    },

    _navigateToSignIn: function () {
      // The development HTML pages do not use OTDS login page
      if (!config.redirectToSignInPage) {
        // If the session expires or is not available, reload the /app page;
        // authentication should be performed by the server redirecting to
        // the OTDS login page
        PageLeavingBlocker.forceDisable();
        location.reload();
      } else {
        var signInPageUrl = this.options.signInPageUrl || config.signInPageUrl,
          query = location.search;
        query += query ? '&' : '?';
        query += 'nextUrl=' + encodeURIComponent(location.pathname);
        location.href = signInPageUrl + query + location.hash;
      }
      // The REST of the view rendering continues, until the context
      // is switched, and the page would quickly show its content
      // before the location change finally kicks in.
      // before the location change finally kicks in.
      this._redirecting = true;
    },

    _showMissingCredentialsError: function () {
      // show error page;
      // missing credentials is a programmer error and we must not translate this message
      var errorModel = new Backbone.Model({
        message: 'The StartPageView was created without providing valid authentication data.',
        hideNavigationButtons: true,
        errorCode: 401,
        showLogout: false
      }),
        errorPageView = new ErrorPageView({
          model: errorModel
        });
      errorPageView.render();
    }

  }, {
    useV2AppHeader: config.useV2AppHeader ?? false,
    enableHamburger: config.enableHamburger ?? false,
  });

  _.extend(StartPageView.prototype, ViewEventsPropagationMixin);
  UpdateSupportAssetBrandingConfigMixin.mixin(StartPageView.prototype);

  return StartPageView;
});


csui.define('csui/widgets/navigation.header/controls/help/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/navigation.header/controls/help/impl/nls/root/localized.strings',{
  HelpIconTitle: 'Help',
  HelpIconAria: 'Help pages, opens in new window'
});






csui.define('csui/utils/context.help/context.help.ids',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external perspectives
  'csui-ext!csui/utils/context.help/context.help.ids'
], function (_, Backbone, RulesMatchingMixin, extraHelpIds) {

  var ContextHelpIdModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      important: false,
      module: null
    },

    constructor: function ContextHelpIdModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }

  });
  
  RulesMatchingMixin.mixin(ContextHelpIdModel.prototype);

  var ContextHelpIdCollection = Backbone.Collection.extend({

    model: ContextHelpIdModel,
    comparator: "sequence",

    constructor: function ContextHelpIdCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findByApplicationScope: function (options) {
      return this.find(function (item) {
        return item.matchRules(options, item.attributes);
      });
    }

  });

  var helpIds = new ContextHelpIdCollection([
    { // versions page : properties dropdown
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'properties' &&
        options.context.viewStateModel && options.context.viewStateModel.get('state').dropdown === 'versions';
      },
      contextHelpId: 'qs-versionpg-bg'
     
    },
    { // audit page : properties dropdown
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'properties' &&
        options.context.viewStateModel && options.context.viewStateModel.get('state').dropdown === 'audit';
      },
      contextHelpId: 'qs-audithistory-bg'
    },
    { // Collection
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'node' &&
          options.context.getModel('node').get('type') === 298;
      },
      contextHelpId: 'qs-addtocollection-bg'
    },
    { // Compound documents
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'node' &&
          options.context.getModel('node').get('type') === 136;
      },
      contextHelpId: 'compound-documents-so'
    },
    { // email folder
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'node' &&
          options.context.getModel('node').get('type') === 751;
      },
      contextHelpId: 'qs-itemtypes-bg'
    },
    { // permissions dialog
      sequence: 50,
      decides: function (options) {
        return options.context.viewStateModel.get('session_state') && options.context.viewStateModel.get('session_state').permissions;
      },
      contextHelpId: 'qs-permissions-bg'
    }
  ]);
  helpIds.map(model => model.helpDocId = "cssui240400-h-ugd");
  if (extraHelpIds) {
    helpIds.add(_.flatten(extraHelpIds, true));
  }
  

  return helpIds;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/navigation.header/controls/help/impl/help',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "icon-help-black";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"icon-help "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"highContrast") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":22},"end":{"line":1,"column":64}}})) != null ? stack1 : "")
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":1,"column":73},"end":{"line":1,"column":82}}}) : helper)))
    + "\"></div>";
}});
Handlebars.registerPartial('csui_widgets_navigation.header_controls_help_impl_help', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/widgets/navigation.header/controls/help/help.view',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/base',
  'i18n!csui/widgets/navigation.header/controls/help/impl/nls/localized.strings',
  'i18n', 'csui/behaviors/keyboard.navigation/tabable.region.behavior', 'csui/utils/context.help/context.help.ids',
  'csui/models/server.module/server.module.collection', 'csui/lib/othelp',
  'hbs!csui/widgets/navigation.header/controls/help/impl/help'
], function (module, _, $, Marionette, base, localizedStrings, i18n, TabableRegionBehavior, contextHelpIds,
  ServerModuleCollection, OTHHUrlBuilder, template) {
  'use strict';

  // Read configuration from the original place for compatibility.
  var config = window.csui.requirejs.s.contexts._.config
    .config['csui/pages/start/impl/navigationheader/navigationheader.view'] || {};
  _.extend(config, module.config());
  config.help || (config.help = {});
  _.defaults(config.help, {
    language: i18n.settings.locale.replace(/[-_]\w+$/, ''),
    preserve: true
  });

  //Make sure the value provide by CS is not an empty string.
  //The othhURLBuilder does not account for empty strings, only
  //undefined values.
  if (config.help.urlRoot === '') {
    config.help.urlRoot = undefined;
  }
  if (config.help.tenant === '') {
    config.help.tenant = undefined;
  }
  if (config.help.type === '') {
    config.help.type = undefined;
  }

  var HelpView = Marionette.ItemView.extend({
    tagName: 'a',

    attributes: {
      href: '#',
      title: localizedStrings.HelpIconTitle,
      'aria-label': localizedStrings.HelpIconAria
    },

    template: template,

    templateHelpers: function () {
      return {
        title: localizedStrings.HelpIconTitle,
        highContrast: this.options.highContrast === 2
      };
    },

    // behaviors: {
    //   TabableRegion: {
    //     // behaviorClass: TabableRegionBehavior,
    //     // initialActivationWeight: 50
    //   }
    // },

    currentlyFocusedElement: function () {
      return this.$el;
    },

    constructor: function HelpView(options) {
      Marionette.ItemView.call(this, options);
      this.listenTo(this, 'click:help', this._onClick);
    },

    onShow: function(){
      var self = this;
      this.$el.on('click', function (event) {
        if (base.isControlClick(event)) {
          // do nothing, let's execute browser's default behaviour as it is in both ctrl+click and
          // command+click in mac.
        } else {
          self.triggerMethod('click:help');
        }
      });
      this.$el.on('keydown', function (event) {
        if (event.keyCode === 32) {
          event.preventDefault();
          self.triggerMethod('click:help');
        }
      });
    },

    _onClick: function (scope) {
      const serverModules = new ServerModuleCollection();
      const context = this.options.context;
      const appScopeId = (typeof(scope) === "string" || scope instanceof String) ? scope : context._applicationScope.get('id');
      var contextHelpModel = contextHelpIds.findByApplicationScope({ context: context });
      let contextHelpId, contextHelpDocId;
      if (contextHelpModel) {
         contextHelpId = contextHelpModel.get('contextHelpId');
         contextHelpDocId = contextHelpModel.get('helpDocId');
        contextHelpId = typeof contextHelpId === 'function' ? contextHelpId({ context: context }) : contextHelpId;
      }

      serverModules
        .fetch()
        .then(
          function () {
            var modulesWithHelp, urlBuilder, documentsOptions, helpURL, browserTab, 
              modulesHelpDocIdArr = [];
            modulesWithHelp = serverModules.filter(function (serverModule) {
              return !!serverModule.get('helpDocId');
            });

            urlBuilder = new OTHHUrlBuilder({
              urlRoot: config.help.urlRoot
            });

            documentsOptions = {
              preserve: config.help.preserve,
              documents: []
            };
            // grouping the available helpmodules
            _.each(modulesWithHelp, function (serverModule) {
              var currmoduleId = serverModule.get('helpDocId');
              //splitting helpdocid and fetching the prenumeric part as below
              // cseng200200-h-uxe -> cseng, cssui160210 - > cssui to group the modules with same name
              if (modulesHelpDocIdArr[currmoduleId.match(/[^\d]+|\d+/g)[0]]) {
                modulesHelpDocIdArr[currmoduleId.match(/[^\d]+|\d+/g)[0]].push(serverModule);
              }
              else {
                modulesHelpDocIdArr[currmoduleId.match(/[^\d]+|\d+/g)[0]] = [];
                modulesHelpDocIdArr[currmoduleId.match(/[^\d]+|\d+/g)[0]][0] = serverModule;
              }

            });

            //[csels:[{serverModule}],cseng:[{serverModule,serverModule,serverModule}],cssui:[{serverModule,serverModule,serverModule}]]
            // creating document options and adding context page to buildurl based on availability in each group
            Object.keys(modulesHelpDocIdArr).forEach(function (key) {
              var contextualHelp, sortedObjs = [], modulesHelpDocIdArrLastMatch = [];
              // splitting each prenumeric group and grouping based on post numeric and post hyphen string
              _.each(modulesHelpDocIdArr[key], function (serverModule) {
                let topicId;
                if (serverModule.get('contextualHelp')) {
                  contextualHelp = serverModule.get('contextualHelp');
                }
                if(contextHelpModel && contextHelpId && !contextHelpDocId) {
                  topicId = contextHelpId;
                }
                else  if (!topicId && contextualHelp && !!appScopeId && !contextHelpId) {
                  topicId = contextualHelp[appScopeId];
                }
                var helpDocId = serverModule.get('helpDocId');
                var lastHiphenIndex = serverModule.get('helpDocId').lastIndexOf('-');
                var everythingAfterTheFinalHiphen = serverModule.get('helpDocId').substring(lastHiphenIndex + 1);
                //splitting helpdocid and fetching the prenumeric part as below
                // cseng200200-h-uxe -> uxe,  cseng200200-h-axe - > axe to group the modules with same last name
                //{ugd:[serverModule,serverModule],axe:[serverModule,serverModule,serverModule],axe:[serverModule,serverModule]}
                if (modulesHelpDocIdArrLastMatch[everythingAfterTheFinalHiphen]) {
                  modulesHelpDocIdArrLastMatch[everythingAfterTheFinalHiphen].push({ "helpDocId": helpDocId, "topicId": topicId });
                }
                else {
                  modulesHelpDocIdArrLastMatch[everythingAfterTheFinalHiphen] = [];
                  modulesHelpDocIdArrLastMatch[everythingAfterTheFinalHiphen][0] = { "helpDocId": helpDocId, "topicId": topicId };
                }
              });
              var index = 0;
              // sorting to descending order in the available group array for each group based on helpdocid
              Object.keys(modulesHelpDocIdArrLastMatch).forEach(function (key) {
                sortedObjs[key] = _.sortBy(modulesHelpDocIdArrLastMatch[key], function (module) {
                  return parseInt(module['helpDocId'].match(/[^\d]+|\d+/g)[1]);
                }).reverse();
              });
              // creating document options to send helpdocid and topicid to url builder

              /*    0: {helpDocId: "cssui210400-h-ugd", topicId: undefined}
                    1: {helpDocId: "cssui210400-h-ugd", topicId: undefined}
                    2: {helpDocId: "cssui210400-h-ugd", topicId: "permexp-so"}
                    3: {helpDocId: "cssui210400-h-ugd", topicId: "csui-permexp-so"} 
              */
              Object.keys(sortedObjs).forEach(function (key) {

                for (var i = 0; i < sortedObjs[key].length; i++) {
                  if (sortedObjs[key][i]['topicId']) {
                    index = i;
                    break;
                  }
                }

                documentsOptions.documents.push({
                  module: sortedObjs[key][index]['helpDocId'],
                  topic: sortedObjs[key][index]['topicId']
                });
              });
            });
            _.each(documentsOptions.documents, function (option,index) {
              if(option['module'] === contextHelpDocId) { 
                option['topic'] = contextHelpId;
                option['active'] = true;
              }
              else if(option['topic']) { 
                option['active'] = true;
                
              }
              if(option['module'].match(/[^\d]+|\d+/g)[0] === 'cssui' && option['topic'] === undefined) { 
                option['topic'] = 'sui-overview-bg';
              }
            });
            helpURL = urlBuilder.buildHelpUrl(config.help.language,
              documentsOptions, {
              tenant: config.help.tenant,
              type: config.help.type,
              options: { search: 'allModules' }
            });
            browserTab = window.open(helpURL, '_blank');
            browserTab.focus();
          }), function (error) {
            console.error(error);
          };
    }
  });

  return HelpView;
});


csui.define('csui/widgets/navigation.header/controls/home/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/navigation.header/controls/home/impl/nls/root/localized.strings',{
  HomeIconTitle: 'Home',
  HomeIconAria: 'Home page'
});




/* START_TEMPLATE */
csui.define('hbs!csui/widgets/navigation.header/controls/home/impl/home',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "csui-icon-home-black";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-icon-home "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"highContrast") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":27},"end":{"line":1,"column":74}}})) != null ? stack1 : "")
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":1,"column":83},"end":{"line":1,"column":92}}}) : helper)))
    + "\"></div>";
}});
Handlebars.registerPartial('csui_widgets_navigation.header_controls_home_impl_home', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/widgets/navigation.header/controls/home/home.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/url', 'csui/utils/base',
  'i18n!csui/widgets/navigation.header/controls/home/impl/nls/localized.strings',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/utils/contexts/factories/application.scope.factory', 'csui/utils/node.links/node.links',
  'hbs!csui/widgets/navigation.header/controls/home/impl/home'
], function (_, $, Marionette, Url, base, localizedStrings, TabableRegionBehavior,
    ApplicationScopeModelFactory, NodeLinks, template) {
  'use strict';

  var HomeView = Marionette.ItemView.extend({
    tagName: 'a',

    className: 'csui-home binf-hidden',

    attributes: {
      href: '',
      title: localizedStrings.HomeIconTitle,
      'aria-label': localizedStrings.HomeIconAria
    },

    events: {
      'click': 'onClickHomeIcon',
      'keydown': 'onKeydownHomeIcon'
    },

    template: template,

    templateHelpers: function () {
      return {
        title: localizedStrings.HomeIconTitle,
        highContrast: this.options.highContrast === 2
      };
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function () {
      return this.$el;
    },

    constructor: function HomeView(options) {
      Marionette.ItemView.call(this, options);
      this.listenTo(options.context, 'sync error', this._toggleVisibility);
      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
    },

    onRender: function () {
      var connector = this.options && this.options.context && this.options.context._user && this.options.context._user.connector,
          serverUrl = new Url(connector && connector.connection.url || location.href),
          link      = NodeLinks.getHomeUrl(serverUrl);
      this.$el.attr('href', link);
    },

    onClickHomeIcon: function (e) {
      if (base.isControlClick(e)) {
        // do nothing, let's execute browser's default behaviour as it is in both ctrl+click and
        // command+click in mac.
      } else {
      e.preventDefault();
      this.applicationScope.set('id', '');
      }
    },

    onKeydownHomeIcon: function (e) {
      if (e.keyCode === 32) {
        this.onClickHomeIcon(e);
      }
    },

    _toggleVisibility: function () {
      if (this._isRendered) {
        // Detect the user landing page.
        if (!this.applicationScope.id) {
          this.$el.addClass('binf-hidden');
        } else {
          this.$el.removeClass('binf-hidden');
        }
      }
    }
  });

  return HomeView;
});


csui.define('csui/widgets/navigation.header/controls/breadcrumbs/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/navigation.header/controls/breadcrumbs/impl/nls/root/localized.strings',{
  ShowBreadcrumbs: 'Show Breadcrumbs',
  HideBreadcrumbs: 'Hide Breadcrumbs'
});




/* START_TEMPLATE */
csui.define('hbs!csui/widgets/navigation.header/controls/breadcrumbs/impl/breadcrumbs',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<span class=\"csui-button-icon csui-breadcrumb-caret-type "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"breadcrumbsCaretName") || (depth0 != null ? lookupProperty(depth0,"breadcrumbsCaretName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"breadcrumbsCaretName","hash":{},"loc":{"start":{"line":1,"column":57},"end":{"line":1,"column":81}}}) : helper)))
    + "\"></span>\n<span class=\"csui-breadcrumb-btn-innertext\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"breadcrumbsText") || (depth0 != null ? lookupProperty(depth0,"breadcrumbsText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"breadcrumbsText","hash":{},"loc":{"start":{"line":2,"column":44},"end":{"line":2,"column":63}}}) : helper)))
    + "</span>";
}});
Handlebars.registerPartial('csui_widgets_navigation.header_controls_breadcrumbs_impl_breadcrumbs', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/navigation.header/controls/breadcrumbs/impl/breadcrumbs',[],function(){});

csui.define('csui/widgets/navigation.header/controls/breadcrumbs/breadcrumbs.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'i18n!csui/widgets/navigation.header/controls/breadcrumbs/impl/nls/localized.strings',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/utils/contexts/factories/ancestors',
  'csui/utils/contexts/factories/application.scope.factory',
  'hbs!csui/widgets/navigation.header/controls/breadcrumbs/impl/breadcrumbs',
  'css!csui/widgets/navigation.header/controls/breadcrumbs/impl/breadcrumbs'
], function (_, $, Marionette, localizedStrings, TabableRegionBehavior,
    AncestorCollectionFactory, ApplicationScopeModelFactory,
    template) {
  'use strict';

  var BreadcrumbsView = Marionette.ItemView.extend({
    tagName: 'button',

    attributes: {
      'type': 'button'
    },

    className: 'breadcrumbs-handle binf-btn',

    ui: {
      breadcrumbsTextContainer: '.csui-breadcrumb-btn-innertext',
      breadcrumbsCaretContainer: '.csui-breadcrumb-caret-type'
    },

    serializeData: function () {
      var flag = !!this.applicationScope.get('breadcrumbsVisible'),
          data = {
            breadcrumbsText: localizedStrings.ShowBreadcrumbs,
            breadcrumbsCaretName: this.options.highContrast === 2? 'icon-expandArrowDownWhite-black' : 'icon-expandArrowDownWhite'
          };

      if (flag) {
        data = {
          breadcrumbsText: localizedStrings.HideBreadcrumbs,
          breadcrumbsCaretName: this.options.highContrast === 2? 'icon-expandArrowUpWhite-black' : 'icon-expandArrowUpWhite'
        };
      }
      return data;
    },

    template: template,

    events: {
      'keydown': 'onKeyInView',
      'click': '_toggleBreadCrumbs'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function () {
      return this.$el;
    },

    onRender: function () {
      if (matchMedia) {
        this._mq = window.matchMedia("(max-width: 1124px)");
        this._mq.addListener(_.bind(this._windowsWidthChange, this));
        this._windowsWidthChange(this._mq);
      }
    },

    constructor: function BreadcrumbsView(options) {
      Marionette.ItemView.call(this, options);

      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
      this.stopListening(this.applicationScope, 'change:breadcrumbsVisible')
          .listenTo(this.applicationScope, 'change:breadcrumbsVisible',
              this._breadcrumbVisibilityChanged)
          .listenTo(this.applicationScope, 'change:breadcrumbsVisible',
              this._breadcrumbUpdateText);

      this.stopListening(this.applicationScope, 'change:breadcrumbsAvailable')
          .listenTo(this.applicationScope, 'change:breadcrumbsAvailable',
              this._breadcrumbAvailabilityChanged);

      this.stopListening(this.applicationScope, 'change:hideToggleButton')
          .listenTo(this.applicationScope, 'change:hideToggleButton',
              this._hideToggleButton);

      this._breadcrumbVisibilityChanged();
      this._breadcrumbAvailabilityChanged();
    },

    _breadcrumbVisibilityChanged: function () {
      this._breadcrumbsVisible = this.applicationScope.get('breadcrumbsVisible');
      if (this._breadcrumbsVisible) {
        this.$el.removeClass('csui-breadcrumbs-hidden');
        this.triggerMethod('refresh:tabindexes');
      } else {
        this.$el.addClass('csui-breadcrumbs-hidden');
      }
    },

    _hideToggleButton: function (bcNode) {
      var hideBtn = !!bcNode.get('hideToggleButton');
      var btnElement = this.$el.closest('.tile-breadcrumb');
      if (btnElement.length) {
        btnElement[!!hideBtn ? 'addClass' : 'removeClass']('binf-hidden');
      }
    },

    _breadcrumbAvailabilityChanged: function () {
      this._breadcrumbsAvailable = this.applicationScope.get('breadcrumbsAvailable');
      if (this._breadcrumbsAvailable) {
        this.$el.removeClass('csui-breadcrumbs-not-available');
        this.triggerMethod('refresh:tabindexes');
      } else {
        this.$el.addClass('csui-breadcrumbs-not-available');
      }
    },
    _breadcrumbUpdateText: function () {
      if (!!this.applicationScope.get('breadcrumbsVisible')) {
        this.$el.attr('aria-label', localizedStrings.HideBreadcrumbs);
        if(this.options.highContrast === 2){
          this.ui.breadcrumbsCaretContainer.removeClass('icon-expandArrowDownWhite-black').addClass(
            'icon-expandArrowUpWhite-black');
        }else{
          this.ui.breadcrumbsCaretContainer.removeClass('icon-expandArrowDownWhite').addClass(
            'icon-expandArrowUpWhite');
        }
        
        this.ui.breadcrumbsTextContainer.text(localizedStrings.HideBreadcrumbs);
      } else {
        this.$el.attr('aria-label', localizedStrings.ShowBreadcrumbs);
        if(this.options.highContrast === 2){
          this.ui.breadcrumbsCaretContainer.removeClass('icon-expandArrowUpWhite-black').addClass(
            'icon-expandArrowDownWhite-black');
        }else{
          this.ui.breadcrumbsCaretContainer.removeClass('icon-expandArrowUpWhite').addClass(
              'icon-expandArrowDownWhite');
        }
        this.ui.breadcrumbsTextContainer.text(localizedStrings.ShowBreadcrumbs);
      }
    },

    _showBreadcrumbs: function () {
      this.applicationScope.set('breadcrumbsVisible', true);
    },

    _hideBreadcrumbs: function () {
      this.applicationScope.set('breadcrumbsVisible', false);
    },
    _toggleBreadCrumbs: function () {
      this.applicationScope.set('breadcrumbsVisible', !this._breadcrumbsVisible);
    },

    _windowsWidthChange: function (mq) {
      if (mq.matches) {
        this._previousBreadcrumbState = this.applicationScope.get('breadcrumbsVisible');
        this.applicationScope.set('breadcrumbsVisible', true);
      } else {
        this.applicationScope.set('breadcrumbsVisible', this._previousBreadcrumbState);
      }
    },

    onKeyInView: function (event) {
      switch (event.keyCode) {
      case 9:
        // tab
        this.ignoreFocusBlur = false;
        break;
      case 13:
      case 32:
        // enter or space key
        this.ignoreFocusBlur = false;
        event.preventDefault();
        this.applicationScope.set('breadcrumbsVisible', !this._breadcrumbsVisible);
        break;
      }
    }

  });

  return BreadcrumbsView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.slices/impl/search.slices',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<label class=\"csui-search-popover-row-body\" data-sliceid=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sliceId") || (depth0 != null ? lookupProperty(depth0,"sliceId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sliceId","hash":{},"loc":{"start":{"line":1,"column":58},"end":{"line":1,"column":69}}}) : helper)))
    + "\">\n    <input type=\"radio\" class=\"csui-slice-option\" data-sliceid=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sliceId") || (depth0 != null ? lookupProperty(depth0,"sliceId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sliceId","hash":{},"loc":{"start":{"line":2,"column":64},"end":{"line":2,"column":75}}}) : helper)))
    + "\" name=\"slice\" value=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sliceDisplayName") || (depth0 != null ? lookupProperty(depth0,"sliceDisplayName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sliceDisplayName","hash":{},"loc":{"start":{"line":2,"column":97},"end":{"line":2,"column":119}}}) : helper)))
    + "\">\n        <span class=\"csui-search-popover-checked\" data-sliceid=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sliceId") || (depth0 != null ? lookupProperty(depth0,"sliceId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sliceId","hash":{},"loc":{"start":{"line":3,"column":64},"end":{"line":3,"column":75}}}) : helper)))
    + "\"></span>\n        <span class=\"csui-search-popover-label\" data-sliceid=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sliceId") || (depth0 != null ? lookupProperty(depth0,"sliceId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sliceId","hash":{},"loc":{"start":{"line":4,"column":62},"end":{"line":4,"column":73}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sliceDisplayName") || (depth0 != null ? lookupProperty(depth0,"sliceDisplayName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sliceDisplayName","hash":{},"loc":{"start":{"line":4,"column":75},"end":{"line":4,"column":97}}}) : helper)))
    + "</span>\n</label>";
}});
Handlebars.registerPartial('csui_widgets_search.slices_impl_search.slices', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/widgets/search.slices/search.slices.item.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette3',
  'hbs!csui/widgets/search.slices/impl/search.slices'
], function (_, $, Marionette, SearchSlicesTemplate) {
  'use strict';
  var SearchSlicesItemView = Marionette.View.extend({
    className: 'csui-search-popover-row',
    template: SearchSlicesTemplate,
    attributes: function () {
      return {
        id: this.model.get('sliceId'),
        title: this.model.get('sliceTooltip'),
        'aria-label': this.model.get('sliceDisplayName'),
        tabindex: "-1",
      };
    },

    templateContext: function () {
      var sliceDisplayName = this.model && this.model.get('sliceDisplayName'),
        sliceId = this.model && this.model.get('sliceId');
      return {
        sliceDisplayName: sliceDisplayName,
        sliceId: sliceId
      };
    },

    events: {
      'click .csui-search-popover-row-body': 'setSlices',
      'keydown .csui-search-popover-row-body': 'accessibility',
      'keyup .csui-search-popover-row-body': 'keyUpHandler',
    },

    constructor: function SearchSlicesItemView(options) {
      options || (options = {});
      this.options = options;
      Marionette.View.prototype.constructor.call(this, options);
    },

    setSlices: function (event) {
      event.preventDefault();
      event.stopPropagation();
      var sliceId = this.model.get('sliceId'),
        _currentEleChecked = this.$el.find('.icon-listview-checkmark').length;
      this.options.originatingView.options.sliceString = "";
      this.options.parentView.removePreviousSelection();
      if (!_currentEleChecked) {
        this.$el.find('.csui-search-popover-checked').addClass("icon-listview-checkmark");
        this.options.originatingView.options.sliceString = "{" + sliceId + "}";
        this.$el.find('.csui-slice-option').prop("checked", true);
      }
      else{
        this.$el.find('.csui-slice-option').prop("checked", false);
      }
      this.options.originatingView.namedLocalStorage.set('selectedSlice',  this.options.originatingView.options.sliceString);
      this.options.originatingView.options.model.attributes.slice = this.options.originatingView.options.sliceString;
    },

    accessibility: function (event) {
      switch (event.keyCode) {
        case 9:
          if (event.shiftKey) {
            if (this.options.originatingView.$el.find('.csui-selected-checkbox').length) {
              this.options.originatingView.$el.find('.csui-selected-checkbox').addClass('active');
              this.options.originatingView.$el.find('.csui-selected-checkbox input[type="checkbox"]')[0].focus();
            }
            else {
              this.options.originatingView.ui.input[0].focus();
            }
          } else {
            if (this.options.originatingView.$el.find('.csui-slices-more').hasClass('binf-hidden') || !this.options.originatingView.$el.find('.csui-slices-more').length) {
              if (this.options.originatingView.searchFormsContainerView.$el.find('.csui-searchforms-popover-row').length) {
                this.options.originatingView.searchFormsContainerView.$el.find('.csui-searchforms-popover-row')[0].focus();
              }
              else {
                $(this.options.originatingView.searchFormsContainerView.$el.find('.csui-searchforms-show-more')[0]).focus();
              }
            } else {
              this.options.originatingView.$el.find('.csui-slices-more')[0].focus();
            }
          }
          this.$el.find('.csui-search-popover-row-body').removeClass('active');
          break;
        case 38:
          this.$el.find('.csui-search-popover-row-body').removeClass('active');
          if (this.$el.prev().length) {
            this.$el.prev().find('.csui-search-popover-row-body').addClass('active');
            this.$el.prev().find('.csui-search-popover-row-body input[type="radio"]')[0].focus();
          } else {
            var el = this.options.parentView.$el.find('.csui-search-popover-row-body');
            $(el[el.length - 1]).addClass('active');
            $(el[el.length - 1]).find('input[type="radio"]')[0].focus();
          }
          break;
        case 40:
          this.$el.find('.csui-search-popover-row-body').removeClass('active');
          if (this.$el.next().length) {
            this.$el.next().find('.csui-search-popover-row-body').addClass('active');
            this.$el.next().find('.csui-search-popover-row-body input[type="radio"]')[0].focus();
          } else {
            $(this.options.parentView.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
            $(this.options.parentView.$el.find('.csui-search-popover-row-body input[type="radio"]')[0])[0].focus();
          }
          break;
        case 32:
          this.setSlices(event);
          this.$el.find('.csui-search-popover-row-body').addClass('active');
          this.$el.find('.csui-search-popover-row-body input[type="radio"]')[0].focus();
          break;
        case 27:
          this.$el.removeClass('active');
          if (this.options.originatingView.options.data.showOptionsDropDown) {
            this.options.originatingView.hideSearchOptionsDropDown();
          }
          break;
        case 13:
          this.setSlices(event);
          this.$el.find('.csui-search-popover-row-body').addClass('active');
          this.$el.find('.csui-search-popover-row-body input[type="radio"]')[0].focus();
          break;
      }
      event.preventDefault();
    },

     // supress bubbling of keyup space  event to document when tried to  toggle radiobutton on firefox browser
     keyUpHandler: function (event) {
      var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      if (event.keyCode == 32 && isFirefox) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
  });
  return SearchSlicesItemView;
});

csui.define('csui/widgets/search.slices/search.slices.list.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette3',
  'csui/widgets/search.slices/search.slices.item.view'
], function (_, $, Marionette, SearchSlicesItemView) {
  'use strict';
  var SearchSlicesListView = Marionette.CollectionView.extend({
    className: 'csui-search-slice-container',
    childView: SearchSlicesItemView,
    childViewOptions: function () {
      return {
        collection: this.options.collection,
        originatingView: this.options.originatingView,
        parentView: this
      };
    },

    constructor: function SearchSlicesListView(options) {
      options || (options = {});
      this.options = options;
      this.collection = options.collection;
      this.originatingView = options.originatingView;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },

    removePreviousSelection: function () {
      var _checkedEle = this.$el.find(".csui-search-popover-checked");
      $(_checkedEle).removeClass("icon-listview-checkmark");
     this.$el.find('.active').removeClass('active');
      return;
    },

    getSelectedSlice: function () {
      if (!this.options.originatingView.options.sliceString && this.options.originatingView.options.model && this.options.originatingView.options.model.get("slice")) {
        this.options.originatingView.options.sliceString = this.options.originatingView.options.model.get("slice");
      }
      this.$el.find(".csui-search-popover-checked").removeClass('icon-listview-checkmark');
      this._setSliceValue(this.options.originatingView.options.sliceString);
    },

    _setSliceValue: function (sliceVal) {
      sliceVal = sliceVal ? sliceVal : this.options.originatingView.namedLocalStorage.get('selectedSlice');
      if (!!sliceVal && sliceVal !== "{}") {
        this.$el.find("#" + sliceVal.substring(1, sliceVal.length - 1)).find('.csui-search-popover-checked').addClass(
          "icon-listview-checkmark");
        this.$el.find("#" + sliceVal.substring(1, sliceVal.length - 1)).find('.csui-slice-option').prop('checked', true);
      }
    },
  });
  return SearchSlicesListView;
});

csui.define('csui/widgets/search.forms/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/search.forms/impl/nls/root/lang',{
  personalSearchFormsLabel: 'My search forms',
  systemSearchFormsLabel: 'Shared search forms',
  recentSearchFormsLabel: 'Recent search forms',
  searchFormLabel :'Search forms',
  search: "Search",
  loading:"Loading...",
  showMore: "More search forms",
  openSearchFormsAria: "Open search forms dialog",
  showMoreSearchFormsAria : "Open more search forms dialog",
  searchFormTooltip: "Open: {0}",
  btnBack: 'Back',
  btnBackAriaLabel : 'Back to search forms',
  btnSearch: 'Search'
});




csui.define('css!csui/widgets/search.forms/impl/search.forms',[],function(){});

csui.define('csui/widgets/search.forms/search.forms',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/lib/backbone',
    'csui/utils/non-emptying.region/non-emptying.region',
    'i18n!csui/widgets/search.forms/impl/nls/lang',
    'css!csui/widgets/search.forms/impl/search.forms'
], function (_, $, Marionette, Backbone, NonEmptyingRegion, lang) {
    "use strict";
    var SearchForm = Marionette.View.extend({

        className: 'csui-search-form-container',
        constructor: function SearchForm(options) {
            options || (options = {});
            this.models = new Backbone.Collection();
            Marionette.View.prototype.constructor.call(this, options);
        },

        findButton: function (ele, btnType, value) {
            var button = _.find(ele, function (item) {
                return item.get("btnType") === btnType;
            });
            button && button.set("hidden", value);
        },

        openFormInSidepanel: function (searchFormCollectionOrModel, searchFormId) {
            var deferred = $.Deferred();
            var self = this;
            csui.require(
                ['csui/controls/side.panel/side.panel.view',
                    'csui/widgets/search.forms/search.form.view',
                    'csui/widgets/search.forms/search.forms.container.view',
                    'i18n'
                ],
                function (SidePanelView, SearchFormView, SearchFormsContainerView, i18n) {
                    var title;
                    const isRtl = i18n && i18n.settings?.rtl;
                    if (searchFormId) {
                        var schema = searchFormCollectionOrModel.get('schema');
                        title = schema.title ? schema.title : searchFormCollectionOrModel.get('name');
                        self.customSearchForm = new SearchFormView({
                            model: searchFormCollectionOrModel,
                            searchFormId: searchFormId,
                            hideSearchButton: true,
                            showInSearchResultsNewPerspective: true,
                            context: self.options.options.context
                        });
                        self.sidePanel ? self.sidePanel.options.slides[0].content = self.customSearchForm : '';
                    } else {
                        if (!self.searchFormsContainerView) {
                            self.searchFormsContainerView = new SearchFormsContainerView({
                                searchFormsList: searchFormCollectionOrModel,
                                originatingView: self
                            });
                        }
                        title = lang.searchFormLabel;
                        self.sidePanel ? self.sidePanel.options.slides[0].content = self.searchFormsContainerView : '';
                        self.searchFormsContainerView.$el.removeClass('binf-hidden');
                    }
                    if (!self.sidePanel || self.sidePanel && self.sidePanel.isDestroyed) {
                        var sidePanel = new SidePanelView({
                            slides: [{
                                title: title,
                                content: searchFormId ? self.customSearchForm : self.searchFormsContainerView,
                                footer: {
                                    leftButtons: [{
                                        type: 'action',
                                        v2Icon: {
                                            iconName: isRtl? 'csui_action_back_rtl32' : 'csui_action_back32',
                                            states: true
                                        },
                                        btnType: 'back',
                                        className: 'cs-go-back arrow_back csui-has-v2icon',
                                        attributes: {
                                            'title': lang.btnBack,
                                            'aria-label': lang.btnBackAriaLabel
                                        },
                                        disabled: !!self.options.originatingView.hideBackButton
                                    }],
                                    rightButtons: [{
                                        label: lang.search,
                                        type: 'action',
                                        id: 'search-btn',
                                        btnType: 'search',
                                        attributes: {
                                            'title': lang.btnSearch,
                                            'aria-label': lang.btnSearch
                                        },
                                        className: 'binf-btn binf-btn-primary csui-custom-search-form-submit cs-search',
                                        disabled: false
                                    }]
                                }
                            }],
                            sidePanelClassName: 'cvs-in-sidepanel'
                        });
                        self.sidePanel = sidePanel;
                        sidePanel.show();

                    } else if (self.sidePanel.$el.is(':visible')) {
                        var bodyRegion = new NonEmptyingRegion({
                            el: self.sidePanel.ui.body
                        });
                        self.sidePanel.slides[0].title = title;
                        if (searchFormId) {
                            bodyRegion.$el.find('.csui-search-forms-list').addClass('binf-hidden');
                            bodyRegion.$el.find('.csui-search-form-collection').addClass('binf-hidden');
                            bodyRegion.$el.find('.csui-custom-view-search').removeClass('binf-hidden');

                        } else {
                            bodyRegion.$el.find('.csui-search-forms-list').removeClass('binf-hidden');
                            bodyRegion.$el.find('.csui-search-form-collection').removeClass('binf-hidden');
                            bodyRegion.$el.find('.csui-custom-view-search').remove();
                            self.sidePanel.trigger('after:show');
                        }
                        self.sidePanel.headerView.update(self.sidePanel.options.slides[0]);
                        if (searchFormId) {
                            bodyRegion.show(self.sidePanel.options.slides[0].content);
                        }
                    }
                    
                    self.sidePanel.listenTo(self.customSearchForm, 'enable:search', function (isSearchEnabled) {
                        self.sidePanel.trigger("update:button", "search-btn", {
                            disabled: !isSearchEnabled
                        });
                    });

                    var defaultValues = _.filter(_.flatten(_.map(self.customSearchForm && self.customSearchForm.model.get("data"), _.values)),
                    function (val) {return val; });
                    /* defaultValues sample output.
                        [6004881, { "Category_6004178_22_value1": "", "Category_6004178__value1": "" }, 'ss']
                        Previous code: var disableSearch = !!defaultValues && defaultValues.length === 0;
                        Previous code checks if the array size is 0 and disables the search.
                        If the array has only an object with empty or null values then the search is enabled as array size is > 0.
                        Hence, check if the object has any not null/empty value.
                    */
                    let disableSearch = true;
                    if (!!defaultValues && defaultValues.length > 0) {
                        for (let value of defaultValues) {
                            if (typeof value === "number" || (typeof value === "string" && !/^(anydate|anyvalue)/i.test(value))) {
                                disableSearch = false;
                                break;
                            } else if (typeof value === "object") {
                                if (Object.values(value).some(x => x && !/^(anydate|anyvalue)/i.test(x))) {
                                    disableSearch = false;
                                    break;
                                }
                            }
                        }
                    }
                    if (!disableSearch) {
                        $(".cs-search").removeClass("binf-disabled").removeClass(
                            "csui-search-form-submit-disabled");
                        self.customSearchForm?.trigger('enable:search', true);
                    } else {
                        $(".cs-search").addClass("binf-disabled").addClass(
                            "csui-search-form-submit-disabled");
                        self.customSearchForm?.trigger('enable:search', false);
                    }
                    if (!searchFormId) {
                        self.findButton(self.sidePanel.footerView.leftCollection.models, 'back', true);
                        self.findButton(self.sidePanel.footerView.rightCollection.models, 'search', true);
                    } else {
                        if (!self.options.originatingView.hideBackButton) {
                            self.findButton(self.sidePanel.footerView.leftCollection.models, 'back', false);
                        } else {
                            self.findButton(self.sidePanel.footerView.leftCollection.models, 'back', true);
                        }
                        self.customSearchForm.listenTo(self.customSearchForm, 'render:form', function () {
                            self.sidePanel.triggerMethod('set:focus');
                        });
                        self.findButton(self.sidePanel.footerView.rightCollection.models, 'search', false);
                    }
                    self.sidePanel && self.sidePanel.footerView.trigger('update:footer');
                    self.options.originatingView.$el.find('.csui-searchforms-popover-row').removeClass('binf-disabled');
                    self.sidePanel && self.sidePanel.$el.find('.csui-searchforms-popover-row').removeClass('binf-disabled');
                    self.sidePanel.listenTo(self.customSearchForm, "button:click", function (actionButton) {
                        if (actionButton.btnType === 'search') {
                            self.customSearchForm.options.query = self.options.options.model;
                            self.customSearchForm.loadCustomSearch();
                        } else if (actionButton.btnType === 'back') {
                            self.openFormInSidepanel(
                                self.options.originatingView.searchboxModel.get('search_forms'));
                            return;
                        }
                        self.sidePanel.hide();
                    });
                    self.sidePanel.listenTo(self.sidePanel, 'after:show', function () {
                        if (self.isNewForm) {
                            self.customSearchForm.customFormView.formView.isFormChanged = undefined;
                        }
                       if (this.$el.find('.csui-searchforms-popover-row').length && self.isKeyPress) {
                        this.$el.find('.csui-searchforms-popover-row')[0].focus();
                        self.isKeyPress = false;
                       }
                       var cid = self.options.originatingView.cid;
                       $(document).off('click.' + cid + ' keydown.' + cid);
                    });
                    self.sidePanel.listenTo(self.sidePanel, 'before:hide', function () {
                        var searchBoxView = self.options.originatingView;
                        if (!searchBoxView?.options?.otcEl) {
                            $(document).on('click.' + searchBoxView.cid + ' keydown.' + searchBoxView.cid,
                                searchBoxView, searchBoxView._hideSearchBar);
                        }
                        self.options.originatingView?.ui?.input?.attr('tabindex', 0);
                    });
                    

                    self.sidePanel.listenTo(self.sidePanel, 'keydown', function (event) {
                       if (event.keyCode === 9) {
                        if (event.shiftKey && $(event.target)[0].id ==='csui-side-panel-cancel') {
                            var that = self;
                            if(!!that.searchFormsContainerView){
                                setTimeout(function () {
                                    that.searchFormsContainerView.systemSearchForms.$el
                                    .find('.csui-searchforms-popover-row')[0].focus();
                                },0);
                            }
                        }
                       }
                    });

                    self.sidePanel.listenTo(self.customSearchForm, 'click:search', function () {
                        // Close Side panel when search triggered from CVS as it would navigate to search result.
                        self.sidePanel.hide();
                    });

                    deferred.resolve();
                }, deferred.reject);
            return deferred.promise();
        },

        isModelFetched: function (searchFormId) {
            this.isNewForm = true;
            if (this.models && this.models.length && this.models.get(searchFormId)) {
                var data = JSON.parse(JSON.stringify(this.models.get(searchFormId).originalAttributesData));
                this.models.get(searchFormId).set('data', data);
                this.openFormInSidepanel(this.models.get(searchFormId), searchFormId);
            } else {
                var self = this;
                csui.require(
                    [
                        'csui/widgets/search.forms/search.form.model'
                    ],
                    function (SearchFormModel) {
                        var searchFormModel = new SearchFormModel({
                            id: searchFormId
                        }, {
                            connector: self.options.connector,
                            options: self.options
                        });
                        searchFormModel.fetch().then(function (result) {
                            var data = JSON.parse(JSON.stringify(searchFormModel.attributes.data));
                            searchFormModel.originalAttributesData = data;
                            self.models.push(searchFormModel);
                            self.openFormInSidepanel(searchFormModel, searchFormId);
                        });
                    });
            }

        },

    });
    return SearchForm;
});

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.forms/impl/search.forms',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "    <span class=\"csui-icon-standard-search\"></span>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "    <span class=\"csui-icon-query-form-search\"></span>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<a href=\"javascript:void(0)\" class=\"csui-searchforms-popover-row\"\n   data-searchformid=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchFormId") || (depth0 != null ? lookupProperty(depth0,"searchFormId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchFormId","hash":{},"loc":{"start":{"line":2,"column":22},"end":{"line":2,"column":39}}}) : helper)))
    + "\" id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchFormId") || (depth0 != null ? lookupProperty(depth0,"searchFormId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchFormId","hash":{},"loc":{"start":{"line":2,"column":45},"end":{"line":2,"column":62}}}) : helper)))
    + "\" title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchFormTooltip") || (depth0 != null ? lookupProperty(depth0,"searchFormTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchFormTooltip","hash":{},"loc":{"start":{"line":2,"column":71},"end":{"line":2,"column":94}}}) : helper)))
    + "'\n   aria-label='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchFormName") || (depth0 != null ? lookupProperty(depth0,"searchFormName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchFormName","hash":{},"loc":{"start":{"line":3,"column":15},"end":{"line":3,"column":35}}}) : helper)))
    + "'>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"quickLink") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":4,"column":2},"end":{"line":8,"column":9}}})) != null ? stack1 : "")
    + "  <span class=\"cs-label\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchFormName") || (depth0 != null ? lookupProperty(depth0,"searchFormName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchFormName","hash":{},"loc":{"start":{"line":9,"column":25},"end":{"line":9,"column":45}}}) : helper)))
    + "</span>\n</a>";
}});
Handlebars.registerPartial('csui_widgets_search.forms_impl_search.forms', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/widgets/search.forms/search.forms.item.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette3',
  'hbs!csui/widgets/search.forms/impl/search.forms',
  'i18n!csui/widgets/search.forms/impl/nls/lang',
  'css!csui/widgets/search.forms/impl/search.forms'
], function (_, $, Marionette, SearchFormsTemplate, lang) {
  'use strict';
  var SearchFormsItemView = Marionette.View.extend({
    className: 'csui-search-form-item',
    template: SearchFormsTemplate,
    attributes: {
      'role': 'listitem'
    },

    templateContext: function () {
      var searchFormName = this.model && this.model.has('name') && this.model.get('name'),
        searchFormId = this.model && this.model.has('id') && this.model.get('id'),
        cId = this.model && this.model.cid;
      return {
        quickLink: this.model.get('type') === 'quick',
        searchFormName: searchFormName,
        searchFormId: `${cId}_${searchFormId}`,
        searchFormTooltip: _.str.sformat(lang.searchFormTooltip, searchFormName)
      };
    },

    events: {
      'click .csui-searchforms-popover-row': 'openFormView',
      'keydown .csui-searchforms-popover-row': 'openFormView'
    },

    constructor: function SearchFormsItemView(options) {
      options || (options = {});
      this.options = options;
      Marionette.View.prototype.constructor.call(this, options);
    },

    openFormView: function (event) {
      event.preventDefault();
      event.stopPropagation();

      var model = this.model,
          params = model.get('params') || {};
      if (event.keyCode === 13 || event.keyCode === 32 || event.type === 'click') {
        if (model.get('type') === 'quick') {
          // SVF-557 Include the search from here nodeId in query based on the
          // searchFromHere option
          params.location_id1 = "";
          var originatingView = this.options.originatingView;
          if (originatingView.options && originatingView.options.data) {
            // The search from here checkbox state is in the options.data
            if (originatingView.options.data.searchFromHere) {
              if (originatingView.searchOptions) {
                // Current folder is in the nodeId
                if (originatingView.searchOptions.nodeId) {
                  params.location_id1 = originatingView.searchOptions.nodeId;
                }
              }
            }
          }
          params.where = params.where || '*';
          this.options.originatingView.trigger('refine:search', event, params);
          // SVF-559 Do not show the search form for quick search
          return;
        } else if (this.model.get('type') === 'direct' && !!this.options.parentView &&
                   !!this.options.parentView.options && !!this.options.parentView.options.options &&
                   !!this.options.parentView.options.options.fromSearchBox) {
          //TODO: remove the above conditional logic later.
          _.extend(params, {
            forcePerspectiveChange: true,
            enableSearchForm: true
          });
          this.options.originatingView.trigger('refine:search', event, params);
          // SVF-559 Do not show the search form for quick search
          return;
        }
        if (this.$el.find('.csui-searchforms-popover-row').hasClass('binf-disabled')) {
          return;
        }
        this.$el.find('.csui-searchforms-popover-row').addClass('binf-disabled');
        var id = this.model.get('params') && this.model.get('params').query_id ?
                 this.model.get('params').query_id : this.model.get('id');

        if (!!this.options.originatingView.isModelFetched) {
          this.options.originatingView.isModelFetched(id);
        } else {
          this.options.originatingView.hideSearchOptionsDropDown(event);
          this.options.originatingView.searchForms.isModelFetched(id);
        }
        this.options.originatingView.searchFormsContainerView.$el.addClass('binf-hidden');
      } else if (event.type === 'keydown') {
        this._handleKeyEvents(event);
      }
    },

    _handleKeyEvents: function (event) {
      event.preventDefault();
      switch (event.keyCode) {
        case 9: //tab
          var searchFormContainerView = this.options.parentView.options.parentView,
              parentView = this.options.parentView;
          if (!event.shiftKey) {
            if (this.options.originatingView.$el.find('.csui-searchforms-show-more').length) {
              this.options.originatingView.$el.find('.csui-searchforms-show-more').focus();
            } else if (!!searchFormContainerView.personalSearchForms &&
              parentView.options.listName !== 'system_search_forms' &&
              (parentView.options.listName !== 'personal_search_forms')) {
              searchFormContainerView.personalSearchForms.$el.find('.csui-searchforms-popover-row')[0].focus();
            } else if (!!searchFormContainerView.systemSearchForms && (parentView.options.listName !== 'system_search_forms')) {
              searchFormContainerView.systemSearchForms.$el.find('.csui-searchforms-popover-row')[0].focus();
            } else {
              var cancel = searchFormContainerView.options.originatingView.sidePanel.$el.find('[id = "csui-side-panel-cancel"]');
              cancel.addClass('active');
              setTimeout(function () {
                cancel.trigger('focus');
              },0);
            }
          } else if (event.shiftKey) {
            if (!!searchFormContainerView.personalSearchForms && (parentView.options.listName !== 'personal_search_forms') && (parentView.options.listName !== "recent_search_forms")) {
              searchFormContainerView.personalSearchForms.$el.find('.csui-searchforms-popover-row')[0].focus();
            } else if (!!searchFormContainerView.recentSearchForms && (parentView.options.listName !== 'recent_search_forms')) {
              searchFormContainerView.recentSearchForms.$el.find('.csui-searchforms-popover-row')[0].focus();
            } else if (!!searchFormContainerView.recentSearchForms && (parentView.options.listName === 'recent_search_forms') ||
              !!searchFormContainerView.personalSearchForms && (parentView.options.listName === 'personal_search_forms') ||
              !!searchFormContainerView.systemSearchForms && (parentView.options.listName === 'system_search_forms')) {
              if (this.options.originatingView.sidePanel) {
                this.options.originatingView.sidePanel.$el.find('.csui-sidepanel-close').trigger('focus');
              } else {
                if (this.options.originatingView.$el.find('.csui-slices-more').length>0 && !this.options.originatingView.$el.find('.csui-slices-more').hasClass('binf-hidden')) {
                  this.options.originatingView.$el.find('.csui-slices-more')[0].focus();
                } else {
                  $(this.options.originatingView.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
                  $(this.options.originatingView.$el.find('.csui-search-popover-row-body input[type="radio"]')[0])[0].focus();
                }
              }
            } else if (this.options.originatingView.$el.find('.csui-selected-checkbox').length) {
                this.options.originatingView.$el.find('.csui-selected-checkbox').addClass('active');
                this.options.originatingView.$el.find('.csui-selected-checkbox input[type="checkbox"]').trigger('focus');
            } else {
              $(this.options.originatingView.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
              $(this.options.originatingView.$el.find('.csui-search-popover-row-body input[type="radio"]')[0])[0].focus();
            }
          }
          break;
        case 38: //up arrow
          if (this.$el.prev().length) {
            this.$el.removeClass('active');
            (this.$el.prev().addClass('active')).find('.csui-searchforms-popover-row')[0].focus();
          } else {
             var el = this.options.parentView.$el.find('.csui-searchforms-popover-row');
             el[el.length -1].focus();
          }
          break;
        case 40: //down arrow
          if (this.$el.next().length) {
            this.$el.removeClass('active');
            (this.$el.next().addClass('active')).find('.csui-searchforms-popover-row')[0].focus();
          } else {
            this.options.parentView.$el.find('.csui-searchforms-popover-row')[0].focus();
          }
          break;
        case 27: //escape
          var originatingViewOptions = this.options.originatingView &&
                                       this.options.originatingView.options,
              originatingView = originatingViewOptions && originatingViewOptions.originatingView;
          this.$el.removeClass('active');
          originatingView &&
          originatingViewOptions.options &&
          originatingViewOptions.options.data &&
          originatingViewOptions.options.data.showOptionsDropDown &&
          originatingView.hideSearchOptionsDropDown(event);
          break;
      }
    } 
  });
  return SearchFormsItemView;
});


csui.define('csui/widgets/search.forms/search.forms.list.view',['csui/lib/underscore', 'csui/lib/marionette3',
  'csui/widgets/search.forms/search.forms.item.view',
  'css!csui/widgets/search.forms/impl/search.forms'
], function (_, Marionette, SearchFormsItemView) {
  'use strict';
  var SearchFormsListView = Marionette.CollectionView.extend({
    className: 'csui-search-form-list',
    childView: SearchFormsItemView,
    attributes: {
      'role': 'list'
    },
    childViewOptions: function () {
      return {
        collection: this.options.collection,
        originatingView: this.options.originatingView,
        parentView: this,
      };
    },
    constructor: function SearchFormsListView(options) {
      options || (options = {});
      this.options = options;
      this.collection = options.collection;
      this.originatingView = options.originatingView;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },
  });
  return SearchFormsListView;
});

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.forms/impl/search.forms.container',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div aria-labelledby='recent_search_forms_header_"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cId") || (depth0 != null ? lookupProperty(depth0,"cId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cId","hash":{},"loc":{"start":{"line":2,"column":51},"end":{"line":2,"column":58}}}) : helper)))
    + "' "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"fromSearchBox") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"loc":{"start":{"line":2,"column":60},"end":{"line":2,"column":107}}})) != null ? stack1 : "")
    + ">\n    <h2 id='recent_search_forms_header_"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cId") || (depth0 != null ? lookupProperty(depth0,"cId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cId","hash":{},"loc":{"start":{"line":3,"column":39},"end":{"line":3,"column":46}}}) : helper)))
    + "'\n        class='csui-search-label "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"skipHeading") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"loc":{"start":{"line":4,"column":33},"end":{"line":4,"column":72}}})) != null ? stack1 : "")
    + "'>\n      "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"labels") : depth0)) != null ? lookupProperty(stack1,"recentSearchFormsLabel") : stack1), depth0))
    + "\n    </h2>\n    <div id='recent_search_forms' class=\"csui-recent-search-form-container\"></div>\n  </div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return " role=\"navigation\" ";
},"4":function(container,depth0,helpers,partials,data) {
    return " binf-hidden ";
},"6":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"csui-more-forms\">\n    <a href=\"javascript:void(0)\" role=\"button\" class=\"csui-searchforms-show-more\"\n       data-searchformid=\"loadAllForms\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"showMoreAria") || (depth0 != null ? lookupProperty(depth0,"showMoreAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"showMoreAria","hash":{},"loc":{"start":{"line":14,"column":52},"end":{"line":14,"column":68}}}) : helper)))
    + "\">\n      "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"showMorelabel") || (depth0 != null ? lookupProperty(depth0,"showMorelabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"showMorelabel","hash":{},"loc":{"start":{"line":15,"column":6},"end":{"line":15,"column":23}}}) : helper)))
    + "</a>\n  </div>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div aria-labelledby='personal_search_forms_header'>\n    <h2 id='personal_search_forms_header'\n        class='csui-search-label'>"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"labels") : depth0)) != null ? lookupProperty(stack1,"personalSearchFormsLabel") : stack1), depth0))
    + "</h2>\n    <div id='personal_search_forms' class=\"csui-personal-search-form-container\"></div>\n  </div>\n";
},"10":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div aria-labelledby='system_search_forms_header'>\n    <h2 id='system_search_forms_header'\n        class='csui-search-label'>"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"labels") : depth0)) != null ? lookupProperty(stack1,"systemSearchFormsLabel") : stack1), depth0))
    + "</h2>\n    <div id='system_search_forms' class=\"csui-system-search-form-container\"></div>\n  </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"searchForms") : depth0)) != null ? lookupProperty(stack1,"recent_search_forms") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":9,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showMore") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"loc":{"start":{"line":11,"column":0},"end":{"line":17,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"searchForms") : depth0)) != null ? lookupProperty(stack1,"personal_search_forms") : stack1),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"loc":{"start":{"line":19,"column":0},"end":{"line":25,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"searchForms") : depth0)) != null ? lookupProperty(stack1,"system_search_forms") : stack1),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.noop,"loc":{"start":{"line":27,"column":0},"end":{"line":33,"column":7}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('csui_widgets_search.forms_impl_search.forms.container', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/widgets/search.forms/search.forms.container.view',['csui/lib/backbone', 'csui/lib/underscore', 'csui/lib/marionette3',
  'csui/widgets/search.forms/search.forms.list.view',
  'hbs!csui/widgets/search.forms/impl/search.forms.container',
  'i18n!csui/widgets/search.forms/impl/nls/lang',
  'css!csui/widgets/search.forms/impl/search.forms'
], function (Backbone, _, Marionette, SearchFormsListView, SearchFormsContainerTemplate, lang) {
  'use strict';
  var SearchFormsContainerView = Marionette.View.extend({
    className: 'csui-search-form-collection',
    template: SearchFormsContainerTemplate,
    templateContext: function () {
      return {
        searchForms: this.options.searchFormsList,
        fromSearchBox: this.options.fromSearchBox,
        labels: lang,
        showMore: !!this.options.showMore,
        skipHeading: !!this.options.hasQuickSearches && !!this.options.fromSearchBox,
        showMorelabel: this.options.searchFormsList.recent_search_forms.length ? lang.showMore :
                       lang.searchFormLabel,
        showMoreAria: this.options.searchFormsList.recent_search_forms.length ?
                      lang.showMoreSearchFormsAria : lang.openSearchFormsAria,
        cId: this.cid
      };
    },

    regions: function () {
      var regions = {};
      _.each(this.options.searchFormsList, function (list, searchFormId) {
        regions[searchFormId] = '#' + searchFormId;
      });
      return regions;
    },

    constructor: function SearchFormsContainerView(options) {
      options || (options = {});
      this.options = options;
      Marionette.View.prototype.constructor.apply(this, arguments);
    },

    onRender: function () {
      _.each(this.options.searchFormsList, _.bind(function (list, region) {
        var collection = this._createCollection(list);
        if (collection.length) {
          if (region === 'recent_search_forms') {
            collection = !!this.options.hasQuickSearches ? collection :
                         new Backbone.Collection(collection.filter(function (model) {
                           return model.get('type') !== 'quick';
                         }));
            this.recentSearchForms = this._createListView(collection, region);
            this.showChildView(region, this.recentSearchForms);
          } else if (region === 'system_search_forms') {
            this.systemSearchForms = this._createListView(collection, region);
            this.showChildView(region, this.systemSearchForms);
          } else if (region === 'personal_search_forms') {
            this.personalSearchForms = this._createListView(collection, region);
            this.showChildView(region, this.personalSearchForms);
          }
        }
      }, this));
      if (this.options.fromSearchBox) {
        let cId = this.cid;
        this.$el.find('#recent_search_forms').attr('id', `recent_search_forms_${cId}`);
      }      
    },

    _createListView: function (collection, region) {
      var listView =new SearchFormsListView({
                          options: this.options,
                          originatingView: this.options.originatingView,
                          collection: collection,
                          listName: region,
                          parentView: this
                        });
      return listView;
    },

    _createCollection: function (list) {
      var model,
          collection = new Backbone.Collection();
      _.each(list, function (item) {
        model = new Backbone.Model(item);
        collection.add(model);
      });
      return collection;
    },
  });
  return SearchFormsContainerView;
});

csui.define('csui/widgets/search.box/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/search.box/impl/nls/root/lang',{
  placeholder: 'Search',
  clearerTitle: 'Clear keywords',
  searchBoxTitle: 'Enter your search term',
  searchOptionsTitle: 'Show search options',
  searchOptionsHideTitle: 'Hide search options',
  searchFromHere: 'Search from here',
  searchIconTitle: 'Search',
  searchIconAria: 'Search in OpenText Content Management',
  searchOptionTooltip: 'Select: {0}',
  startSearch: 'Start search',
  searchLandmarkAria: 'Global content search',
  searchWithinLabel : 'Search within',
  showMore:'Show more',
  showMoreAria:'Show more slices',
  closeSearch: 'Close search'
});




/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.box/impl/search.box',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "        <div class=\"csui-search-options-dropdown binf-hidden\" >\n        <div class=\"csui-search-options-wrapper csui-normal-scrolling\"></div>\n        </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "icon-header-search-black";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"search-bar\" role=\"dialog\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchLandmarkAria") : stack1), depth0))
    + "\" aria-expanded=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"showOptionsDropDown") : stack1), depth0))
    + "\">\n  <div class=\"search-bar-content\">\n    <div class=\"csui-search-input-container\">\n      <input type=\"search\" class=\"csui-input\" placeholder=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"placeholder") : stack1), depth0))
    + "\"\n             title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchBoxTitle") : stack1), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchBoxTitle") : stack1), depth0))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"showOptionsDropDown") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":6,"column":6},"end":{"line":10,"column":13}}})) != null ? stack1 : "")
    + "    </div>\n    <span class=\"csui-clearer formfield_clear\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"clearerTitle") : stack1), depth0))
    + "\"\n          aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"clearerTitle") : stack1), depth0))
    + "\" role=\"button\"></span>\n    <span class=\"csui-separator\"></span>\n    <span class=\"csui-formfield-search formfield_search\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"startSearchTitle") : stack1), depth0))
    + "\"\n          aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"startSearchTitle") : stack1), depth0))
    + "\" role=\"button\"></span>\n  </div>\n</div>\n<div role=\"search\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchLandmarkAria") : stack1), depth0))
    + "\" class=\"search-icon\">\n  <a href=\"javascript:void(0);\"\n     class=\"icon icon-global-search icon-header-search "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"highContrast") : stack1),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":21,"column":55},"end":{"line":21,"column":115}}})) != null ? stack1 : "")
    + " csui-header-search-icon csui-acc-focusable\"\n     title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchIconTitle") : stack1), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchIconAria") : stack1), depth0))
    + "\"\n     aria-expanded=\"false\"></a>\n</div>";
}});
Handlebars.registerPartial('csui_widgets_search.box_impl_search.box', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.box/impl/search.slices.popover',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-search-popover-row\" data-sliceid=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceId") : depth0), depth0))
    + "\"\n         title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceTooltip") : depth0), depth0))
    + "\" role=\"radio\" aria-checked=\"false\" tabindex=\"-1\">\n      <div class=\"csui-search-popover-row-body\" data-sliceid=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceId") : depth0), depth0))
    + "\">\n        <div class=\"csui-search-popover-checked\" data-sliceid=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceId") : depth0), depth0))
    + "\" id=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceId") : depth0), depth0))
    + "\"></div>\n        <div class=\"csui-search-popover-label\" data-sliceid=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceId") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceDisplayName") : depth0), depth0))
    + "</div>\n      </div>\n    </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-search-slice-container\" role=\"radiogroup\">\n  <div class=\"csui-search-slice-container-first\" role=\"presentation\"></div>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"slices") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":3,"column":2},"end":{"line":11,"column":11}}})) != null ? stack1 : "")
    + "  <div class=\"csui-search-slice-container-last\" role=\"presentation\"></div>\n</div>\n";
}});
Handlebars.registerPartial('csui_widgets_search.box_impl_search.slices.popover', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.box/impl/search.slice.dropdown',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"csui-selected-checkbox csui-slice-checkbox csui-checkbox-primary csui-searchbox-dd-panel\" >\n  <label class=\"csui-search-slice-name csui-selectlabel\" for=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"nodeIdSO") : depth0), depth0))
    + "\"\n          title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"fromHere") : depth0), depth0))
    + " "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"nodeName") : depth0), depth0))
    + "\">\n    <input type=\"checkbox\" "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"checked") || (depth0 != null ? lookupProperty(depth0,"checked") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"checked","hash":{},"loc":{"start":{"line":5,"column":27},"end":{"line":5,"column":38}}}) : helper)))
    + " aria-checked=\"true\"  class=\"csui-searchbox-option\" name=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"nodeId") : depth0), depth0))
    + "\" id=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"nodeIdSO") : depth0), depth0))
    + "\"\n           tabindex=\"-1\" value=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"nodeId") : depth0), depth0))
    + "\">\n      <span class=\"csui-icon\"></span>\n      <span class=\"csui-ellipsis\" aria-hidden=\"true\" >"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"fromHere") : depth0), depth0))
    + " "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"nodeName") : depth0), depth0))
    + "</span>\n  </label>\n  </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"csui-searchbox-slices-wrapper csui-searchbox-dd-panel\">\n    <fieldset>\n      <legend class=\"csui-search-label\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"slices") : depth0)) != null ? lookupProperty(stack1,"searchWithinLabel") : stack1), depth0))
    + "</legend>\n      <div class=\"csui-search-slice-region\" ></div>\n    </fieldset>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"slices") : depth0)) != null ? lookupProperty(stack1,"more") : stack1),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"loc":{"start":{"line":19,"column":4},"end":{"line":24,"column":11}}})) != null ? stack1 : "")
    + "  </div>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button class=\"csui-slices-more\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"slices") : depth0)) != null ? lookupProperty(stack1,"showMoreAria") : stack1), depth0))
    + "\" tabindex=\"-1\" >\n        <span  class=\"csui-more-text\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"slices") : depth0)) != null ? lookupProperty(stack1,"showMore") : stack1), depth0))
    + "</span>\n       <span class=\"csui-button-icon icon-caret-down\"></span>\n    </button>\n";
},"6":function(container,depth0,helpers,partials,data) {
    return "  <div class=\"csui-searchbox-searchform-wrapper csui-searchbox-dd-panel\">\n    <div class=\"csui-recent-searchforms-container\" >\n    </div>\n  </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"nodeId") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":11,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"slices") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":13,"column":0},"end":{"line":26,"column":7}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"search_forms") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"loc":{"start":{"line":27,"column":0},"end":{"line":32,"column":7}}})) != null ? stack1 : "")
    + "\n";
}});
Handlebars.registerPartial('csui_widgets_search.box_impl_search.slice.dropdown', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/search.box/impl/search.box',[],function(){});

csui.define('csui/widgets/search.box/search.box.view',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/lib/backbone',
  'csui/models/node/node.model', 'csui/utils/contexts/factories/search.box.factory',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/namedlocalstorage',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/search.slices/search.slices.list.view',
  'csui/widgets/search.forms/search.forms',
  'csui/widgets/search.forms/search.forms.container.view',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/contexts/factories/search.formquery.factory',
  'i18n!csui/widgets/search.box/impl/nls/lang',
  'csui/utils/namedsessionstorage',
  'hbs!csui/widgets/search.box/impl/search.box',
  'hbs!csui/widgets/search.box/impl/search.slices.popover',
  'hbs!csui/widgets/search.box/impl/search.slice.dropdown', 'i18n', 'csui/utils/base',
  'css!csui/widgets/search.box/impl/search.box',
  'csui/lib/jquery.ui/js/jquery-ui', 'csui/lib/binf/js/binf'
], function (module, _, $, Marionette, Backbone, NodeModel, SearchBoxFactory,
  SearchQueryModelFactory, ApplicationScopeModelFactory, NamedLocalStorage,
  TabableRegionBehavior, SearchSlicesListView,  SearchForms, SearchFormsContainerView,NextNodeModelFactory, SearchFormQueryModelFactory,
  lang, NamedSessionStorage, template,
  SlicePopOverTemplate, SliceDropDownTemplate, i18n, base) {
  "use strict";

  var config = _.defaults({}, module.config(), {
    showOptionsDropDown: true,
    showSearchInput: false,
    showInput: false,
    inputValue: '',
    slice: '',
    nodeId: '',
    nodeName: '',
    searchFromHere: true,
    enableSearchBarSettings: true,
    customSearchIconClass: "icon-header-search",
    customSearchIconNoHoverClass: "icon-header-search-nohover",
    customSearchIconCloseClass: "icon-header-search_close"
  });

  var SearchBoxView = Marionette.ItemView.extend({
    className: 'csui-search-box',
    template: template,
    templateHelpers: function () {
      var messages = {
        showOptionsDropDown: this.options.data.showOptionsDropDown,
        placeholder: this.options.data.placeholder || lang.placeholder,
        clearerTitle: lang.clearerTitle,
        startSearchTitle:  lang.startSearch,
        searchIconTitle: lang.searchIconTitle,
        searchIconAria: lang.searchIconAria,
        searchBoxTitle: lang.searchBoxTitle,
        searchOptionsTitle: lang.searchOptionsTitle,
        startSearch: lang.startSearch,
        searchLandmarkAria: lang.searchLandmarkAria,
        highContrast: this.options.highContrast === 2
      };
      return {
        messages: messages
      };
    },
    slicePopOverTemplate: SlicePopOverTemplate,
    sliceDropDownTemplate: SliceDropDownTemplate,
    namedSessionStorage: new NamedSessionStorage(),
    ui: {
      input: '.csui-input',
      clearer: '.csui-clearer',
      formfieldSearch: '.csui-formfield-search',
      innerSeparator: '.csui-separator',
      searchIcon: '.csui-header-search-icon',
      dropDown: '.csui-search-options-dropdown',
      dropDownWrapperClass : '.csui-search-options-wrapper'
    },
    events: {
      'click @ui.searchIcon': 'searchHeaderIconClicked',
      'keydown .csui-header-search-icon': 'searchIconKeyPressed',
      'click @ui.input': 'inputClicked',
      'keydown @ui.input': 'inputTyped',
      'keyup @ui.input': 'inputChanged',
      'paste @ui.input': 'inputChanged',
      'change @ui.input': 'inputChanged',
      'click @ui.clearer': 'clearerClicked',
      'click @ui.formfieldSearch': 'formfieldSearchClicked',
      'click .csui-searchbox-option': 'selectSearchOption',
      'keydown @ui.clearer': 'keyDownOnClear',
      'keydown @ui.formfieldSearch': 'keyDownOnFormfieldSearch',
      'keydown .csui-selected-checkbox': 'accessibility',
      'keyup .csui-selected-checkbox': 'keyUpHandler',
      'keyup .csui-slices-more': 'keyUpHandler',
      'keydown .csui-slices-more': '_handleSlicesShowMore',
      'click .csui-slices-more': 'showMore',
      'click .csui-searchforms-show-more': 'openSearchForm',
      'keydown .csui-searchforms-show-more': 'openSearchForm',
      'focus @ui.input': 'focusedOnSearchInput'
    },

    currentlyFocusedElement: function (arg) {
      if (this.$el) {
        var focusables = this.$el.find('*[data-cstabindex=-1]');
        if (focusables.length) {
          focusables.prop('tabindex', 0);
        }
        var shiftKey = !!arg && arg.shiftKey;
        if (!shiftKey && this.$el.find(".search-bar").length &&
            this.$el.find(".search-bar").is(":visible")) {
          this.focusElement = this.$el.find('.csui-input');
          this.skipShowingDropdown = true;
        } else if (this.$el.find('a.csui-acc-focusable').length) {
          this.focusElement = this.$el.find('a.csui-acc-focusable');
        }
      }
      return this.focusElement;
    },
     
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    namedLocalStorage: new NamedLocalStorage('search_bar_settings'),

    constructor: function SearchBoxView(options) {
      options || (options = {});
      options.data = _.defaults({}, options.data, config);
      this.direction = i18n.settings.rtl ? 'left' : 'right';

      var context = options.context;
      if (!options.model) {
        options.model = context.getModel(SearchQueryModelFactory);
      }
      this.applicationScope = context.getModel(ApplicationScopeModelFactory);

      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.listenTo(this.model, 'change:where', this._updateInput);

      // Enable pre-fetching from /app, which sets the initial
      // response via the context model factory.
      this.searchBoxFactory = context.getFactory(SearchBoxFactory);
      this.searchboxModel = this.searchBoxFactory.property;

      if (this.options.data.showOptionsDropDown) {
        this.listenTo(context, 'sync:perspective', this._perspectiveSynced);
        this.listenTo(context, 'change:current:node', this._currentNodeChanged);
        this.listenTo(this.searchboxModel, "change", this.prepareOptionsdropdown);
        this.listenTo(this.searchboxModel, "change", this.prepareSlicePopover);
        this.listenTo(this.searchboxModel, "change", this.prepareSearchFormsPopover);
        this.listenTo(this, "refine:search", this._refineSearch);
      }

      if (this.options.data.enableSearchBarSettings) {
        this.listenTo(this.searchboxModel, "change", this.updateSearchBarSettings);
      }

      if (!!this.model.get("where") || this.options.data.showSearchInput) {
        $(document).on('click.' + this.cid + ' keydown.' + this.cid, this, this._hideSearchBar);
      }
      $(document).on('keydown.' + this.cid, this, this._shortcutToQuery);

      this.searchForms = new SearchForms({
        options: this.options,
        connector: this.searchboxModel && this.searchboxModel.connector,
        originatingView: this
      });
    },

    _refineSearch: function(event, params) {
      this.model.clear({silent: true});
      this.model.set(params);
      this.hideSearchOptionsDropDown(event);
    },

    updateSearchBarSettings: function () {
      this.search_bar_settings = this.searchboxModel.get('search_bar_settings');
      if (this.search_bar_settings && this.search_bar_settings.full_text) {
        this.namedLocalStorage.set('full_text', this.search_bar_settings.full_text);
        if (!!this.model) {
          var full_text = this.search_bar_settings && this.search_bar_settings.full_text;
          this.model.set('modifier', full_text.modifier, {silent: true});
          this.model.set('lookfor', full_text.lookfor, {silent: true});
        }
      }
    },

    _shortcutToQuery: function (event) {
      // CTRL+F3: shortcut to Query/Search
      if (event.ctrlKey && event.keyCode == 114) {
        var self = event.data;
        if (self.isSearchInputVisible()) {
          self.ui.input.trigger('focus');
        } else {
          self.searchIconClicked(event);
        }
      }
    },

    onBeforeDestroy: function () {
      $(document).off('click.' + this.cid).off('keydown.' + this.cid);
    },

    isSearchbarVisible: function () {
      return this.$('.search-bar').is(':visible');
    },

    isSearchInputVisible: function () {
      return this.$('.csui-input').is(':visible');
    },

    handleKeydownNavbar: function (event) {
      var allFocusableElements = $('.csui-navbar.binf-navbar .binf-container-fluid')
        .find("*[tabindex]:visible").toArray();
      var elements = allFocusableElements.unshift(this.$el);
      if (document.activeElement === allFocusableElements[elements - 1]) {
        $(document).find('.csui-help .csui-acc-tab-region').trigger('focus');
      }
      // TODO: check why focus is not going on help 
    },

    _perspectiveSynced: function (context, perspectiveSource) {
      this._currentNodeChanged(perspectiveSource);
    },

    _currentNodeChanged: function (currentNode) {
      if (currentNode instanceof NodeModel &&
        (currentNode.get('container') || currentNode.get('type')===5574)) {
        this.searchboxModel.nodeId = currentNode.get('id');
        this.searchboxModel.nodeName = currentNode.get('name');
        this.namedSessionStorage.set(this.searchboxModel.nodeId, this.searchboxModel.nodeName);
        this.searchboxModel.trigger("change");
      } else {
        this.searchboxModel.nodeId = undefined;
        this.searchboxModel.nodeName = undefined;
        this.searchboxModel.trigger("change");
      }
    },

    _dataSynced: function (context, perspectiveSource) {
      if (this.searchboxModel) {
        if ((this.options.data && this.options.data.alwaysFetchDropdown) || !(this.searchboxModel && this.searchboxModel.fetched)) {
          this.searchBoxFactory.fetch();
        }
      }
    },

    onRender: function (event) {
      if (this.options.data.showSearchInput) {
        this.$el.find(".search-bar").show();
        this.searchIconToClose();
      }
      var value = this.options.data.inputValue || this.model.get('where');
      this.slice = this.options.data.slice || this.model.get('slice');
      if (value) {
        this._setInputValue(value);
        this.$el.find(".search-bar").show();
      }
      if (this.options.data.showInput || value) {
        this.triggerMethod('before:show:input', this);
        this.ui.input.show();
        this.triggerMethod('show:input', this);
      }

      if (event && event.data) {
        this.$el.find('.csui-search-box .csui-header-search-icon').removeClass(
          event.data.options.data.customSearchIconCloseClass).addClass(
            event.data.options.data.customSearchIconClass);
      }

    },

    _createSliceCollection: function (list) {
      var model,
        collection = new Backbone.Collection();
      _.each(list, function (item) {
          model = new Backbone.Model({
            sliceId: item.sliceId,
            sliceDisplayName: item.sliceDisplayName,
            sliceTooltip: item.sliceTooltip
          });
          collection.add(model);
      });
      return collection;
    },

    prepareSlicePopover: function (e) {
      var slices = this.searchboxModel.get('slices'),
        collection = slices && slices.length > 3 ? this._createSliceCollection(slices.slice(0, 3)) : this._createSliceCollection(slices);
      if (this.options.data.showOptionsDropDown) {
        if (slices) {
          _.each(slices, function (slice) {
            var sliceDisplayName = slice.sliceDisplayName;
            slice.sliceTooltip = _.str.sformat(lang.searchOptionTooltip, sliceDisplayName);
          });
          if (!this.searchSlicesListView) {
            this.searchSlicesListView = new SearchSlicesListView({
              originatingView: this,
              collection: collection
            });
          }
        }
        if ($('.search-bar').is(':visible')) {
          $(".binf-navbar-brand").removeClass("binf-navbar-collapse");
        }
      }
    },

    showSlices: function () {
      if (!!this.searchSlicesListView) {
        this.searchSlicesRegion = new Marionette.Region({ el: '.csui-search-slice-region' });
        //TODO: need to remove  this.searchFormsRegion.$el.length null check once the jasmine testcases are refactored
        this.searchSlicesRegion.$el.length && this.searchSlicesRegion.show(this.searchSlicesListView);
        this.searchSlicesListView.getSelectedSlice();
      }
    },

    prepareSearchFormsPopover: function () {
      var searchForms       = this.searchboxModel.get('search_forms'),
          recentSearchForms = searchForms && searchForms.recent_search_forms || [];

      var hasQuickSearches = _.findIndex(recentSearchForms, {type: 'quick'}) !== -1;
      this.searchFormsContainerView = new SearchFormsContainerView({
        searchFormsList: {
          recent_search_forms: recentSearchForms.slice(0, 5)
        },
        originatingView: this,
        showMore: true,
        hasQuickSearches: hasQuickSearches,
        fromSearchBox: true
      });
    },

    showSearchForms: function () {
      if (this.$el.hasClass('csui-search-expanded') && this.searchFormsContainerView && !this.searchFormsContainerView._isRendered) {
        this.searchFormsRegion = new Marionette.Region({el: '.csui-recent-searchforms-container'});
        this.searchFormsRegion.$el.length  && this.searchFormsRegion.show(this.searchFormsContainerView);
      }
    },

    accessibility: function (event) {
      this.$el.find('.csui-selected-checkbox')
        .attr('tabindex', '0').removeClass('active');
      switch(event.keyCode){
        case 13: this.selectSearchOption(event);
        event.preventDefault();
        break;
        case 32: this.selectSearchOption(event);
        event.preventDefault();
        break;
        case 27:  this.$el.find('.csui-selected-checkbox').attr('tabindex', '-1');
        this.$el.find('.active').removeClass('active');
        if (this.options.data.showOptionsDropDown) {
          this.hideSearchOptionsDropDown(event);
        }
        break;
        case 9:  if (event.shiftKey) {
          this.ui.input[0].focus();
         } else {
          var slices = this.$el.find('.csui-search-popover-row-body');
          $(slices[0]).addClass('active');
          $(slices[0]).find('input[type="radio"]')[0].focus();
         }
         event.preventDefault();
         break;
      }
    },

    // supress bubbling of keyup space  event to document when tried to  toggle  checkbox on firefox browser
    keyUpHandler: function (event) {
      var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      if (event.keyCode == 32 && isFirefox) {
        event.stopPropagation();
        event.preventDefault();
      }
    },

    hidePopover: function (event) {
      if (this.options.data.showOptionsDropDown) {
        this.$el.find('.csui-selected-checkbox').attr('tabindex', '-1');
        this.$el.find('.active').removeClass('active');
        this.showOptionsDropdown(event);
      }
    },

    resetPageDefaults: function (event) {
      this.model.resetDefaults = true;
    },

    searchIconKeyPressed: function (event) {
      if (event.keyCode === 32) {
        event.preventDefault();
        this.searchIconToClose(); // Added this as part of LPAD-101864, this functionality was misssing for spacebar keydown
        this.searchIconClicked(event);
      }
    },

    searchHeaderIconClicked: function (event) {
      if ($('.search-bar').is(':visible')) {
        this._hideSearchBar(event);
        this._hideSearchPanel(event);
      } else {
        this.searchIconToClose();
        this.searchIconClicked(event);
      }
      var parentView = this.options && this.options.parentView;
      parentView && parentView.listenToOnce(parentView, "control:clicked", _.bind(function() {
        if ($('.search-bar').is(':visible')) {
          this._hideSearchBar(event);
          this._hideSearchPanel(event);
        }
      }, this));
    },

    /**
     * This method executes when the focus is set within search input field.
     * In general, search input field opens when user clicks on search icon, then it opens the
     * search input field and showing drop-down is happening from this point, not when the focus
     * is set in search input field which is already in open state. This method shows the
     * dropdown if explict focus event happened on this search input field.
     *
     * @param event
     * @param skip
     */
    focusedOnSearchInput: function (event) {
      if (this.skipShowingDropdown || this._isDropdownVisible()) {
        this.skipShowingDropdown = false;
        return;
      } else {
        event.preventDefault();
        this._dataSynced();
        this.$el.addClass('csui-search-expanded');
        this.ui.input.prop('tabindex', 0);
        this.$el.addClass('csui-searchbox-ready');
        if (!(this.searchboxModel && this.searchboxModel.fetched)) {
          this.listenTo(this.searchboxModel, "change", function () {
            this.showSearchForms();
            this.showSlices();
            if (document.querySelector('.csui-search.search-input-open') &&
                this.applicationScope.get('id') !== 'search'
                && $(document.activeElement)[0] === this.ui.input[0]) {
              this.options.data.showOptionsDropDown && this.showOptionsDropdown(event);
            }
          });

          this._updateInput();

          if (this.options.data.showOptionsDropDown) {
            if (!this.searchboxModel.get('slices')) {
              this.prepareSlicePopover();
            }
            if (!this.searchboxModel.get('search_forms_slice')) {
              this.prepareSearchFormsPopover();
            }
          }
        } else {
          this.showSearchForms();
          this.showSlices();
          this.closeDropdown = false;
          if ($(document.activeElement)[0] === this.ui.input[0]) {
            this.options.data.showOptionsDropDown && this.showOptionsDropdown(event);
          }
        }
      }
    },

    searchIconClicked: function (event) {
      this._dataSynced();
      this.$el.parent().addClass("search-input-open");
      this.ui.searchIcon.attr('aria-expanded', 'true');
      // TODO: Need to handle click events on csui controls.
      var searchBoxOptions = this.$el.find('.csui-searchbox-option')[0];
      $(document).on('click.' + this.cid + ' keydown.' + this.cid, this, this._hideSearchBar);
      this.resetPageDefaults(event);
      if (this.options.data.showOptionsDropDown && !!searchBoxOptions) {
        this.searchboxModel.nodeId !== undefined ?
          (this.$el.find('.csui-searchbox-option')[0].checked = this.options.data.searchFromHere) :
          "";
      }
      if ($('.search-bar').is(':visible')) {
        var value = this.ui.input.val().trim();
        if (!!value) {
          this._setInputValue(value);
          $(event.currentTarget).attr("title", lang.startSearch);
          $(event.currentTarget).attr("aria-label", lang.startSearch);
          this.trigger("hide:breadcrumbspanel");
        }
        var searchOption = "",
          _selOption = this.$el.find(".csui-searchbox-option.selected");
        if (this.options.data.showOptionsDropDown) {
          if (!!_selOption) {
            searchOption = _selOption.val();
          }
        } else {
          searchOption = this.options.data.nodeId;
        }

        if (!!history.state && !!history.state.search) {
          this.previousState = history.state.search;
        }
        if (!!value) {
          this._setSearchQuery(value, this.options.sliceString, searchOption, event);
          this._updateInput();
          if (!this.options.data.searchFromHere) {
            $(this.ui.dropDown).addClass('csui-selected-checkbox-hidden');
          }
          if (this.options.data.showOptionsDropDown) {
            this.hideSearchOptionsDropDown(event);
          }
          this.options.data.searchFromHere = true;

        }
        if (!!this.previousState) {
          this.model["prevSearchState"] = this.previousState;
        }
      } else {
        this.$el.addClass('csui-search-expanded');
        base.onTransitionEnd(this.$el.parent(), function () {
          if (this.isDestroyed) {
            return;
          }
          this.skipShowingDropdown = true;
          this.ui.input.trigger('focus');
          this.ui.input.prop('tabindex', 0);
          this.$el.addClass('csui-searchbox-ready');
          if (!(this.searchboxModel && this.searchboxModel.fetched)) {
            this.listenTo(this.searchboxModel, "change",function () {
              this.showSearchForms();
              this.showSlices();
              if (document.querySelector('.csui-search.search-input-open') &&
                  this.applicationScope.get('id') !== 'search'
                  && $(document.activeElement)[0] === this.ui.input[0]) {
                this.options.data.showOptionsDropDown && this.showOptionsDropdown(event);
              }
            });
          } else {
            this.showSearchForms();
            this.showSlices();
            this.closeDropdown = false;
            if ($(document.activeElement)[0] === this.ui.input[0]) {
              this.options.data.showOptionsDropDown && this.showOptionsDropdown(event);
            }
          }
        }, this);
        this._updateInput();
        $(".binf-navbar-brand").removeClass("binf-navbar-collapse");
        if (this.options.data.showOptionsDropDown) {
          if (!this.searchboxModel.get('slices')) {
            this.prepareSlicePopover();
          }
          if (!this.searchboxModel.get('search_forms_slice')) {
            this.prepareSearchFormsPopover();
          }
        }
        if (this.model.attributes.where === "") {
          event.currentTarget.title = "";
          $(event.currentTarget).addClass(this.options.data.customSearchIconNoHoverClass);
        }
      }
    },

    inputTyped: function (event) {
      var value = this.ui.input.val().trim();
      if (event.which === 13) {
        event.preventDefault();
        event.stopPropagation();
        this._setInputValue(value);
        if (!!value) {
          this.closeDropdown = true;
          this.searchIconClicked(event);
        } else {
          this.closeDropdown = false;
        }
        if (this.previousValue != value) {
          this.previousValue = value;
        }
      } else if (event.which === 27) {
        event.preventDefault();
        event.stopPropagation();
        this._hideSearchPanel(event);        
      } else {
        this.closeDropdown = false;
        if (event.which === 9 && this._isDropdownVisible() && !event.shiftKey) {
          if (this.$el.find('.csui-selected-checkbox').is(':visible')) {
            this.$el.find('.csui-selected-checkbox').attr('tabindex', '0').addClass('active');
            this.$el.find('.csui-selected-checkbox input[type="checkbox"]')[0].focus();
          } else {
            var slices = this.$el.find('.csui-search-popover-row-body');
            $(slices[0]).addClass('active');
            $(slices[0]).find('input[type="radio"]').trigger('focus');
          }
          event.preventDefault();
        }
        else if (event.shiftKey && event.key === 'Tab') {
          this.$el.find('.active').removeClass('active');
          if (this.options.data.showOptionsDropDown) {
            this.hideSearchOptionsDropDown(event);
          }
        }
        else {
          this.inputChanged(event);
        }
      }
    },

    inputChanged: function (event) {
      var value = this.ui.input.val();
      this.ui.clearer.prop('tabindex', value !== '' ? 0 : -1);
      this.ui.formfieldSearch.prop('tabindex', value !== '' ? 0 : -1);
      this.ui.clearer.toggle(!!value.length);
      this.ui.innerSeparator.toggle(!!value.length);
      this.ui.formfieldSearch.toggle(!!value.length);
      if (event.keyCode === 13 && !!value) {
        if (!!value) {
          this.closeDropdown = true;
        } else {
          this.closeDropdown = false;
        }
      }
      if (this.options.data.showOptionsDropDown) {
        this.showOptionsDropdown(event);
      }
    },

    inputClicked: function (event) {
      if (!!this.closeDropdown) {
        this.closeDropdown = false;
      }
      this.hidePopover(event);
    },

    showOptionsDropdown: function (event) {
      this.hideBackButton = true;
      if (!this._isDropdownVisible()) {
        if (this.options.data.showOptionsDropDown) {
          var _e = event || window.event,
            slices = this.getSlices(),
            collection = slices && slices.length > 3 ? this._createSliceCollection(slices.slice(0, 3)) : this._createSliceCollection(slices);
          // If node is available, then show "search from here" dropdown.
          // If searching inside a container, show dropdown.
          if (!this.searchboxModel.nodeId || (this.applicationScope.get('id') === 'search' &&
            $(this.ui.dropDown).hasClass('csui-selected-checkbox-hidden'))) {
            this.$el.find('.csui-selected-checkbox').addClass('binf-hidden');
            $(this.ui.dropDown).addClass('csui-selected-checkbox-hidden');
          } else {
            $(this.ui.dropDown).removeClass('csui-selected-checkbox-hidden');
          }
          if (_e.keyCode !== 27 && (!this.closeDropdown)) {
            $(this.ui.dropDown).removeClass('binf-hidden');
            if (this.$el.find('.csui-selected-checkbox').is(':visible')) {
              this.$el.find('.csui-searchbox-option')[0].checked = this.options.data.searchFromHere;
            }
            if (!$(document.body).hasClass('binf-modal-open')) {
              $(document.body).addClass('binf-search-box-open');
              $(document).find('.csui-navbar.binf-navbar').addClass('masked');
              if (!$(document).find('.search-box-widget-mask').length) {
                var compositeMask =  document.createElement('div');
                compositeMask.className = 'search-box-widget-mask';
                $(document.body).find('.binf-widgets').append(compositeMask);
              }
              $(document).find('.csui-navbar.binf-navbar').on(' keydown.',this.handleKeydownNavbar);
            }
          }
          if (this.options.data.searchFromHere) {
            this.$el.find('.csui-searchbox-option').addClass('selected');
            this.$el.find('.csui-icon').addClass('icon-listview-checkmark');
            this.$el.find('.csui-icon').addClass('icon-checkbox-selected');
          }
          if (slices) {
            if (this.searchboxModel.get('slices').more) {
              this.$el.find('.csui-slices-more').removeClass('binf-hidden');
            }
            this.searchSlicesListView = new SearchSlicesListView({
              originatingView: this,
              collection: collection
            });
          }
          if (this.$el.find('.csui-search-form-collection').length) {
            this.$el.find('.csui-search-form-collection').removeClass('binf-hidden');
          }
          this.showSearchForms();
          this.showSlices();
        }
      }
    },

    prepareOptionsdropdown: function (e) {
      if (this.options.data.showOptionsDropDown) {
        // Fetch nodeid when _perspectiveSynced() is not called
        if (!this.searchboxModel.nodeId) {
          var currentNode = _.has(this.options, 'context') && this.options.context.getModel(NextNodeModelFactory);
          if (currentNode && currentNode instanceof NodeModel &&
            (currentNode.get('container') || currentNode.get('type')===5574)) {
            this.searchboxModel.nodeId = currentNode.get('id');
            this.searchboxModel.nodeName = currentNode.get('name');
            this.namedSessionStorage.set(this.searchboxModel.nodeId, this.searchboxModel.nodeName);
          }
        }
        if (!this.searchboxModel.nodeId && this.model.get('location_id1')) {
          this.searchboxModel.nodeId = this.model.get('location_id1');
          if (!!this.namedSessionStorage.get(this.searchboxModel.nodeId)) {
            this.searchboxModel.nodeName = this.namedSessionStorage.get(this.searchboxModel.nodeId);
          }
        }
        this.searchOptions = {};
        if (this.searchboxModel.nodeId) {
          this.searchOptions.nodeId = this.searchboxModel.nodeId;
          this.searchOptions.nodeIdSO = _.uniqueId('csui-so-' + this.searchboxModel.nodeId);
          if (!this.searchboxModel.nodeName && this.options.data.nodeName) {
            this.searchboxModel.nodeName = this.options.data.nodeName;
          }
          if (this.searchboxModel.nodeName) {
            this.searchOptions.nodeName = " (" + this.searchboxModel.nodeName + ")";
          }
          this.searchOptions.select = lang.searchOptionsSelect;
          this.searchOptions.fromHere = lang.searchFromHere;
          this.searchOptions.checked = this.options.data.searchFromHere ? 'checked' : '';
        }
        if (!!this.searchboxModel.get('slices')) {
          this.searchOptions = _.extend(this.searchOptions, this.searchboxModel.attributes);
          this.searchOptions.slices.searchWithinLabel = lang.searchWithinLabel;
          this.searchOptions.slices.showMore = lang.showMore;
          this.searchOptions.slices.showMoreAria = lang.showMoreAria;
          this.searchOptions.slices.more = this.searchOptions.slices.length > 3 ? true : false;
        }
        // The dropdown should be available even if there are no slices
        var content = this.sliceDropDownTemplate(this.searchOptions);
        this.ui.dropDownWrapperClass.html(content);
        if (this.searchOptions.fromHere) {
          this.$el.find('.csui-searchbox-option').addClass('selected');
          this.$el.find('.csui-icon').addClass('icon-listview-checkmark icon-checkbox-selected');
          this.$el.find('.csui-selected-checkbox input[type="checkbox"]').attr('aria-checked', true);
        }
      }
    },

    destroyOptionspopover: function (e) {
      // if node is not available destroy the search options dropdown
      this.ui.dropDown.html("");
      this.ui.dropDown.addClass('binf-hidden');
    },

    selectSearchOption: function (e) {
      if (e.type === "keydown" && (e.keyCode === 13 || event.keyCode === 32)) {
        this.$el.find('.csui-selected-checkbox').attr('tabindex', '0').addClass('active');
        this.$el.find('.csui-selected-checkbox input[type="checkbox"]').trigger('focus');
      } else if (e.type === "click") {
        this.$el.find('.active').removeClass('active');
        this.$el.find('.csui-selected-checkbox')
          .attr('tabindex', '0').removeClass('active').trigger('focus');
      }
      if (!this.options.data.searchFromHere) {
        this.options.data.searchFromHere = true;
        this.$el.find('.csui-searchbox-option').addClass('selected');
        this.$el.find('.csui-icon').addClass('icon-listview-checkmark');
        this.$el.find('.csui-icon').addClass('icon-checkbox-selected');
        this.$el.find('.csui-selected-checkbox input[type="checkbox"]').attr('aria-checked', true);
      } else {
        this.options.data.searchFromHere = false;
        this.$el.find('.csui-searchbox-option').removeClass('selected');
        this.$el.find('.csui-icon').removeClass('icon-listview-checkmark');
        this.$el.find('.csui-icon').removeClass('icon-checkbox-selected');
        this.$el.find('.csui-selected-checkbox input[type="checkbox"]').attr('aria-checked', false);
      }
    },


    handleSelectCheckbox: function (e) {
      if (e.keyCode === 40) {
        var elms = this.$el.find('.csui-search-popover-row-body'),
          index = elms.index(elms.filter('.active'));
        index = (index >= 0) ? index : 0;
        $(elms[index]).attr('tabindex', 0);
        $(elms[index]).addClass('active');
        $(elms[index]).find('input[type="radio"]')[0].focus();
      }
    },

    hideSearchOptionsDropDown: function (event) {
      var that = this;
      if (that.$el.find('.csui-searchbox-option')[0] === document.activeElement) {
        return false;
      } else if (that.options.data.showOptionsDropDown) {
        var self = that;
        self.showSearchOptionDropDown(event);
        return true;
      }
    },

    showSearchOptionDropDown: function (event) {
      if (this.options.data.showOptionsDropDown) {
        if (!(this.ui.dropDown.is(":hover")) || event.type === 'click') {
          this.ui.dropDown && this.ui.dropDown.addClass('binf-hidden');
          if ($(document.body).hasClass('binf-search-box-open')) {
            $(document.body).removeClass('binf-search-box-open');
            $(document).find('.csui-navbar.binf-navbar').removeClass('masked');
            $(document.body).find('.search-box-widget-mask').remove();
            $(document).find('.csui-navbar.binf-navbar').off(' keydown.', this.handleKeydownNavbar);
          }
        } else if (this.popoverTimer) {
          clearTimeout(this.popoverTimer);
        }
      }
    },

    keyDownOnClear: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.clearerClicked(event);
      }
    },
    clearerClicked: function (event) {
      event.preventDefault();
      event.stopPropagation();

      this._setInputValue('');
      this.hidePopover(event);
      this.ui.input.trigger('focus');
    },

    keyDownOnFormfieldSearch: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.formfieldSearchClicked(event);
      }
    },
    formfieldSearchClicked: function (event) {
      this.searchIconClicked(event);
    },

    _setSearchQuery: function (value, sliceString, searchOption, event) {
      this.model.clear({ silent: true });
      this.options.context.getModel(SearchFormQueryModelFactory).clear({ silent : true });
      var params = {};
      if (!!sliceString) {
        params['slice'] = sliceString;
      }
      if (!!searchOption) {
        params['location_id1'] = searchOption;
      }
      if (value) {
        params['where'] = value;
      }
      //update search_bar_settings
      var full_text = this.search_bar_settings && this.search_bar_settings.full_text;
      if (full_text && (full_text.modifier || full_text.lookfor)) {
        params['modifier'] = full_text.modifier;
        params['lookfor'] = full_text.lookfor;
      }
      this.model.set(params);
      //this.hidePopover(event);
    },

    getSlices: function () {
      var selectedSlice, slices,
          selectedSliceId = this.options.model && this.options.model.get("slice") ? this.options.model.get("slice") :
                            this.namedLocalStorage.get('selectedSlice');
      this.options.sliceString = selectedSliceId;
      if (selectedSliceId) {
        slices = _.filter(this.searchboxModel.get('slices'), function (item) {
          if (item.sliceId != selectedSliceId.substring(1, selectedSliceId.length - 1)) {
            return true;
          } else {
            selectedSlice = item;
          }
        });
      }
      else {
        slices = this.searchboxModel.get('slices');
      }
      selectedSlice && slices.unshift(selectedSlice);
      return slices;
    },

    showMore: function () {
      var collection = this._createSliceCollection(this.getSlices());
      this.searchSlicesListView = new SearchSlicesListView({
        originatingView: this,
        collection: collection
      });
      this.$el.find('.csui-slices-more').addClass('binf-hidden');
      this.showSlices();
      $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body input[type="radio"]')[3])[0].focus();
    },

    _handleSlicesShowMore: function (event) {
      switch (event.keyCode) {
        case 27:
          if (this.options.data.showOptionsDropDown) {
            this.hideSearchOptionsDropDown();
          }
          break;
        case 32: this.showMore();
          $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body')[3]).addClass('active');
          break;
        case 13: this.showMore();
          $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body')[3]).addClass('active');
          break;
        case 9: if (event.shiftKey) {
          $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
          $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body input[type="radio"]')[0])[0].focus();
        } else {
          if (this.searchFormsContainerView.$el.find('.csui-searchforms-popover-row').length) {
            this.searchFormsContainerView.$el.find('.csui-searchforms-popover-row')[0].focus();
          }
          else {
            this.searchFormsContainerView.$el.find('.csui-searchforms-show-more')[0].focus();
          }
        }
          break;
      }
      event.preventDefault();
    },

    openSearchForm: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32 || event.type === 'click') {
        if (this.$el.find('.csui-searchforms-popover-row').hasClass('binf-disabled')) {
          return;
        }
        this.$el.find('.csui-searchforms-popover-row').addClass('binf-disabled');
        this.hideSearchOptionsDropDown(event);
        var id = $(event.currentTarget).data("searchformid");
        if (id === "loadAllForms") {
          this.hideBackButton = false;
          this.searchForms.isKeyPress = event.keyCode === 13 || event.keyCode === 32;
          this.searchForms.openFormInSidepanel(this.searchboxModel.get('search_forms'));
        }
      } else if (event.keyCode === 9) {
        event.preventDefault();
        if (event.shiftKey) {
          if (this.$el.find('.csui-searchforms-popover-row').length) {
            var self = this;
            setTimeout(function () {
              self.$el.find('.csui-searchforms-popover-row')[0].focus();
            }, 0);
          } else if (!this.$el.find('.csui-slices-more').hasClass('binf-hidden')) {
            this.$el.find('.csui-slices-more').focus();
          } else if (this.$el.find('.csui-search-popover-row-body').length) {
            $(this.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
            $(this.$el.find('.csui-search-popover-row-body input[type="radio"]')[0]).focus();
          } else if (this.ui.input) {
            this.ui.input.trigger('focus');
          }
        }
        else{
          this.hideSearchOptionsDropDown();
          if(this.$el.find('.csui-clearer').is(':visible'))
          {
            this.$el.find('.csui-clearer').focus();
          }else{
            this.$el.find('.csui-header-search-icon').focus();
          }
        }
      }
     else if(event.keyCode === 27 && this.options.data.showOptionsDropDown){
        this.hideSearchOptionsDropDown();
     }
    },

    _hideSearchPanel: function (event) {
      event.data = event.data || this;
      var _e              = event || window.event,
          ele             = $('.search-bar'),
          self            = event.data,
          searchContainer = self.$el.parent();
      $(document).find("." + event.data.options.data.customSearchIconNoHoverClass).removeClass(
          event.data.options.data.customSearchIconNoHoverClass);
      $(document).find('.csui-input').val('');
      searchContainer.removeClass('search-input-open');
      base.onTransitionEnd(searchContainer, function () {
        self.options.parentView && self.options.parentView.trigger("render:controls");
        if (this.isDestroyed) {
          return;
        }
        $(".binf-navbar-brand").addClass("binf-navbar-collapse");
        self.$el.removeClass('csui-searchbox-ready').removeClass('csui-search-expanded');
      }, this);

      $(document).find('.csui-search-box .csui-header-search-icon')[0].title = lang.searchIconTitle;
      $($(document).find('.csui-search-box .csui-header-search-icon')[0]).attr("aria-label",
          lang.searchIconTitle);
      $($(document).find('.csui-search-box .csui-header-search-icon')[0]).attr("aria-expanded",
          'false');
      event.data.slice = event.data.model.get('slice');
      event.data.ui.dropDown.addClass('binf-hidden');
      if ($(document.body).hasClass('binf-search-box-open')) {
        $(document.body).removeClass('binf-search-box-open');
        $(document).find('.csui-navbar.binf-navbar').removeClass('masked');
        $(document.body).find('.search-box-widget-mask').remove();
        $(document).find('.csui-navbar.binf-navbar').off(' keydown.', this.handleKeydownNavbar);
      }
      $(document).find('.csui-search-box .csui-header-search-icon').removeClass(
          event.data.options.data.customSearchIconCloseClass).addClass(
          event.data.options.data.customSearchIconClass);

      $(document).off('click.' + this.cid + ' keydown.' + this.cid);

      var view = event.data;
      view.trigger("hide:searchbar");
      $('.csui-input').prop('tabindex', -1);
      self.$el.find('.active').removeClass('active');
      _.isObject(self.ui.searchIcon) && self.ui.searchIcon.trigger('focus');
    },

    /**
     * This private method returns whether search form's drop-down is already opened or not.
     *
     * @returns boolean
     * @private
     */
    _isDropdownVisible: function () {
      return this.ui.dropDown.is(':visible');
    },

    _hideSearchBar: function (event) {
      event.data = event.data || this;
      var _e = event || window.event,
        ele = $('.search-bar'),
        self = event.data,
        searchContainer = self.$el.parent(),
        value = self.ui.input.val().trim(),
        searchOptionsDropdown = ele.find('.csui-search-options-dropdown');
      // Allow dropdown to close even after value is cleared
      if (searchContainer.hasClass('search-input-open') &&
        (value) &&
        !$(event.target).is('.csui-input') &&
        self._isDropdownVisible() &&
        searchOptionsDropdown.find(event.target).length === 0) {
        searchOptionsDropdown.addClass('binf-hidden');
        //Remove masked class from navbar
        $(document).find('.csui-navbar.binf-navbar').removeClass('masked');
        $(document.body).find('.search-box-widget-mask').remove();
      } else {
        if (self.applicationScope.get('id') !== "search" && ele.is(':visible') || $(event.target).find('.search-input-open').length ||
            $(event.target).siblings().find('.search-input-open').length || $(event.target).hasClass('search-input-open')) {
          if ((_e.type === 'keydown' && (_e.keyCode === 27 || _e.which === 27) &&
            !$('.search-bar-content .binf-popover').is(":visible")) ||
            (!$(_e.target).closest(ele).length &&
              _e.type === 'click') && (!$(_e.target).closest('.csui-header-search-icon').length) &&
            !$(_e.target).closest('.esoc-activityfeed-invisiblebutton').length) {
              self._hideSearchPanel(event);
          }
        }
      }
    },

    _updateInput: function () {
      if (this._isRendered) {
        var value = this.model.get('where') || '';
        this._setInputValue(value);
      }
    },

    _setInputValue: function (value) {
      this.ui.input.val(value);
      this.ui.clearer.toggle(!!value.length);
      this.ui.innerSeparator.toggle(!!value.length);
      this.ui.formfieldSearch.toggle(!!value.length);
      if (this.options.data.showOptionsDropDown) {
        this.options.data.nodeName = this.searchboxModel.nodeName;
      }
    },

    searchIconToClose: function () {
      _.isObject(this.ui.searchIcon) && this.ui.searchIcon.hasClass(this.options.data.customSearchIconClass) && this.ui.searchIcon.removeClass(this.options.data.customSearchIconClass).addClass(
        this.options.data.customSearchIconCloseClass);
      this.ui.input.addClass("csui-input-focus");
      $(this.ui.searchIcon).attr("title", lang.closeSearch);
      $(this.ui.searchIcon).attr("aria-label", lang.closeSearch);
      $(this.ui.searchIcon).removeClass(this.options.data.customSearchIconNoHoverClass);
    },

    isTabIPad: function(){
      // only possible in tabs
      const ua = navigator.userAgent;
      const isIPad = /iPad/i.test(ua);
      const isAndriod = /Android/i.test(ua);
      return (isAndriod || isIPad);
    },

    showHideTabIPad: function(showLogo){
      if(!this.isTabIPad()) return;

      if(!showLogo){        
        // hide logo for ipad
        $('.binf-widgets .csui-logo-left .csui-logo').hide();
      }else{        
        //  show logo for ipad
        $('.binf-widgets .csui-logo-left .csui-logo').show();
      }
     
    }
  });

  return SearchBoxView;

});


csui.define('csui/widgets/navigation.header/controls/search/search.view',[
  'csui/widgets/search.box/search.box.view',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/controls/globalmessage/globalmessage'
], function (SearchBoxView, SearchQueryModelFactory, GlobalMessage) {
  'use strict';

  var SearchView = SearchBoxView.extend({
    constructor: function SearchView(options) {
      SearchBoxView.call(this, options);
      this.searchQuery = options.context.getModel(SearchQueryModelFactory);
    },

    onRender: function () {
      var resizetrigger = function () { GlobalMessage.trigger('resize'); };
      this.listenTo(this, 'hide:input', resizetrigger);
      this.listenTo(this, 'show:input', resizetrigger);
    }

  });

  return SearchView;
});


csui.define('csui/widgets/navigation.header/controls/favorites/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/navigation.header/controls/favorites/impl/nls/root/localized.strings',{
  FavoritesIconTitle: 'Favorites',
  FavoritesTitleAria: 'OpenText Content Management Favorites'
});




/* START_TEMPLATE */
csui.define('hbs!csui/widgets/navigation.header/controls/favorites/impl/favorites',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "favorite_header_icon-black";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-favorites-icon-container\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":1,"column":50},"end":{"line":1,"column":59}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"favoritesTitleAria") || (depth0 != null ? lookupProperty(depth0,"favoritesTitleAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"favoritesTitleAria","hash":{},"loc":{"start":{"line":1,"column":73},"end":{"line":1,"column":95}}}) : helper)))
    + "\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">\n  <span class=\"csui-icon-favorites favorite_header_icon "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"highContrast") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":2,"column":56},"end":{"line":2,"column":109}}})) != null ? stack1 : "")
    + "\"></span>\n</div>\n<div class=\"csui-favorites-view-container\"></div>\n";
}});
Handlebars.registerPartial('csui_widgets_navigation.header_controls_favorites_impl_favorites', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/tabletoolbar/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/controls/tabletoolbar/impl/nls/root/localized.strings',{

  ToolbarAria: 'Table toolbar',

  // controls/tabletoolbar
  ToolbarItemFilter: 'Show filters',
  ToolbarItemFilterAria: 'Show filter panel',
  ToolbarItemOpen: 'Open',
  ToolbarItemDownload: 'Download',
  ToolbarItemBrowse: 'Browse',
  ToolbarItemCopy: 'Copy',
  ToolbarItemEmailLink: 'Mail as link',
  ToolbarItemEmailLinkShort: 'Mail as link',
  ToolbarItemPaste: 'Paste',
  ToolbarItemMove: 'Move',
  ToolbarItemShare: 'Share',
  ToolbarItemSendTo: 'Send to',
  ToolbarItemView: 'Open',
  ToolbarItemNavigate: 'Visit',
  ToolbarItemViewProperties: 'Properties',
  ToolbarItemVersionHistory: 'Version history',
  ToolbarItemDelete: 'Delete',
  ToolbarItemReserve: 'Reserve',
  ToolbarItemUnreserve: 'Unreserve',
  ToolbarItemRequestReservation: 'Request reservation',
  ToolbarItemUnrequestReservation: 'Cancel request reservation',
  ToolbarItemEdit: 'Edit',
  ToolbarItemRename: 'Rename',
  ToolbarItemRenameFavorite: 'Rename favorite',
  ToolbarItemOpenSavedQuery: 'Open',
  ToolbarItemExecuteSavedQuery: 'Execute',
  ToolbarItemInfo: 'Properties',
  ToolbarItemTimeline: 'Timeline',
  ToolbarItemToggleTableLayout: 'Toggle layout',
  ToolbarItemSettings: 'Settings',
  ToolbarItemAddFolder: 'Folder',
  ToolbarItemAddDocument: 'Document',
  ToolbarItemAdd: 'Add',
  ToolbarItemAddItem: 'Add item',
  ToolbarItemAddVersion: 'Add version',
  ToolbarItemAddCategories: 'Add categories',
  ToolbarItemMore: 'More actions',
  ToolbarItemMoreAria: 'More actions of {0}',
  ToolbarItemPrint: 'Print',
  ToolbarItemOriginalEdit: 'Edit original',
  ToolbarItemOriginalShare: 'Share original',
  ToolbarItemOriginalReserve: 'Reserve original',
  ToolbarItemOriginalUnreserve: 'Unreserve original',
  ToolbarItemOriginalCopy: 'Copy original',
  ToolbarItemOriginalMove: 'Move original',
  ToolbarItemOriginalDownload: 'Download original',
  ToolbarItemOriginalDelete: 'Delete original',
  ToolbarItemCopyLink: 'Copy link',
  ToolbarItemOriginalCopyLink: 'Copy link original',
  ToolbarItemPermissions: 'View permissions',
  ToolbarItemDeletePermission: 'Remove from list',
  ToolbarItemEditPermission: 'Edit permissions',
  ToolbarItemApplyPermission: 'Apply permissions to sub-items',
  ToolbarItemChangeOwnerPermission: 'Change owner',
  ToolbarItemRemoveCollectionItems: 'Remove from collection',
  ToolbarItemInformation: 'Properties',
  ToolbarGoToLocation:'Go to location',
  ToolbarCollect:'Collect',
  ToolbarItemZipAndDownload: 'Download',
  ToolbarItemGoBack: 'Go back',
  ToolbarItemTreeBrowse: 'Show navigation tree',
  ToolbarItemRestructure: 'Restructure',

  // dropdown menu in table header caption
  MenuItemUploadFile: 'Upload file',
  MenuItemAddNewFolder: 'Add new Folder',
  MenuItemZipAndDownload: 'Download',
  MenuItemCopy: 'Copy',
  MenuItemMove: 'Move',
  MenuItemEmailLink: 'Email link',
  MenuItemShare: 'Share',
  MenuItemReserve: 'Reserve',
  MenuItemUnreserve: 'Unreserve',
  MenuItemDelete: 'Delete',
  MenuItemSendToDevice: 'Send to device',
  MenuItemRename: 'Rename',
  MenuItemTimeline: 'Timeline',
  MenuItemInformation: 'Properties',
  MenuItemCopyLink: 'Copy link',
  MenuItemRestructure: 'Restructure',

  // right toolbar
  ToolbarItemComment: 'Comment',
  ToolbarItemShowDescription: 'Show description',
  ToolbarItemConfiguration: 'Configuration',
  ToolbarItemMaximizeWidgetView: 'Maximize widget view',
  ToolbarItemRestoreWidgetViewSize: 'Restore widget view size',

  // permission dropdown command names

  AddUserOrGroups: 'Add user or group',
  AddOwnerOrGroup: 'Add owner or owner group',
  RestorePublicAccess: 'Restore public access',

  //Title for add toolbar items as 'add folder'
  AddToolbarItemsTitle: 'Add {0}',
  ToolbarItemThumbnail: "Grid view",
  ToolbarItemListView: "List view",
  ThumbnailTitle: "Grid view",
  ListViewTitle: "List view",

   //Document preview
   ToolbarItemDocPreview: 'Intelligent Viewer',
});






csui.define('csui/widgets/favorites/tileview.toolbaritems',['csui/lib/underscore',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  // Load extra tool items to be added to this collection
  'csui-ext!csui/widgets/recentlyaccessed/tileview.toolbaritems'
], function (_, lang, ToolItemsFactory, TooItemModel, extraToolItems) {
  'use strict';
  var toolbarItems = {

    // inline action bar
    inlineActionbar: new ToolItemsFactory({
          inspect: [
            {
              signature: "Properties",
              name: lang.ToolbarItemInfo,
              commandData: {dialogView: true},
              iconName: "csui_action_properties32"
            }
          ],
          info: [
            {
              signature: "View", 
              name: lang.ToolbarItemView,
              iconName: "csui_action_preview32",
              flyout: 'view'
            }
          ],
          share: [
            {
              signature: "CopyLink", name: lang.ToolbarItemCopyLink,
              iconName: "csui_action_copy_link32"
            }
          ],
          edit: [
            {
              signature: "Edit", name: lang.ToolbarItemEdit,
              iconName: "csui_action_edit32"
            }
          ],
          other: [
            {
              signature: "Download", name: lang.ToolbarItemDownload,
              iconName: "csui_action_download32"
            },
            {
              signature: "goToLocation", name: lang.ToolbarGoToLocation
            }
          ]
        },
        {
          maxItemsShown: 1,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        })
  };

  if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }

  function addExtraToolItems(extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(toolItems, function (toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return toolbarItems;

});


csui.define('csui/widgets/favorites/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/favorites/impl/nls/root/lang',{
  dialogTitle: 'Favorites',
  searchTitle: 'Search Favorites',
  searchPlaceholder: 'Favorites',
  searchAria: 'Search for favorites',
  expandAria: 'Expand the Favorites widget',
  emptyGroupDefaultText: 'This group is empty.',
  emptyListText: 'There are no items to display.',
  loadingListText: 'Loading results...',
  failedListText: 'Loading results failed.',
  loadingText: "Loading favorites",
  favoritesGroupAria: '{0}, Favorites Group',
  favoritesEmptyGroupAria: '{0}, Empty Favorites Group',
  addFav: 'Add Favorite',
  addFavAria: '{0} Add Favorite',
  removeFav: 'Remove Favorite',
  removeFavAria: '{0} Remove Favorite',
  addFavoriteNameLabel: 'Favorite name',
  addFavoriteNamePlaceHolder: 'Enter name',
  addFavoriteGroupLabel: 'Group',
  addFavoriteAddButtonLabel: 'Add',
  addFavoriteCancelButtonLabel: 'Cancel',
  nameErrorMaxLengthExceed: 'Name cannot be longer than 248 characters.',
  nameErrorContainSemiColon: 'Name cannot contain a colon.',
  updateFavoriteFailMessage: 'Failed to update Favorite for node "{0}". \n\n{1}',
  openFavoritesView: 'Open favorites view'
});






csui.define('css!csui/widgets/favorites/impl/favorites.view',[],function(){});

// Shows a list of links to favorite nodes
csui.define('csui/widgets/favorites/favorites.view',['module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/utils/contexts/factories/favorites2',
  'csui/controls/list/list.view',
  'csui/controls/listitem/listitemstandard.view',
  'csui/controls/listitem/simpletreelistitem.view',
  'csui/behaviors/expanding/expanding.behavior',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/list/behaviors/list.view.keyboard.behavior',
  'csui/behaviors/collection.state/collection.state.behavior',
  'csui/controls/list/list.state.view',
  'csui/utils/contexts/factories/favorite2groups',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/models/favorites2', 'csui/controls/node-type.icon/node-type.icon.view',
  'csui/controls/progressblocker/blocker',
  'csui/widgets/favorites/tileview.toolbaritems',
  'csui/utils/commands',
  'i18n!csui/widgets/favorites/impl/nls/lang',
  'i18n!csui/controls/listitem/impl/nls/lang',
  'css!csui/widgets/favorites/impl/favorites.view'
], function (module, $, _, Backbone, Marionette,
    Favorite2CollectionFactory, ListView, StandardListItem, SimpleTreeListView,
    ExpandingBehavior, DefaultActionBehavior, TabableRegionBehavior,
    ListViewKeyboardBehavior, CollectionStateBehavior, ListStateView,
    Favorite2GroupsCollectionFactory, ApplicationScopeModelFactory,
    Favorite2Collection, NodeTypeIconView, BlockingView, tileViewToolbarItems, commands,
    lang, listItemLang) {
  'use strict';

  var config = _.defaults({}, module.config(), {
    openInPerspective: true
  });

  //
  // Constructor options:
  // - showTitleIcon: boolean to show or hide the icon in the title bar
  //
  var FavoritesView = ListView.extend({

    templateHelpers: function () {
      return {
        title: this.options.data.title || lang.dialogTitle,
        icon: this.options.data.titleBarIcon,
        searchPlaceholder: lang.searchPlaceholder,
        searchTitle: lang.searchTitle,
        searchAria: lang.searchAria,
        expandAria: lang.expandAria,
        openPerspectiveAria: lang.openFavoritesView,
        openPerspectiveTooltip: lang.openFavoritesView,
        enableOpenPerspective: this._enableOpenPerspective
        // "hideSearch: true" could be used to get get rid of the search option
      };
    },

    events: {
      'click .tile-expand': 'onMoreLinkClick'
    },

    behaviors: {
      ExpandableList: {
        behaviorClass: ExpandingBehavior,
        expandedView: 'csui/widgets/favorites2.table/favorites2.table.view',
        orderBy: function () { return this.options.orderBy; },
        titleBarIcon: function () { return this.options.data.titleBarIcon; },
        dialogTitle: lang.dialogTitle,
        dialogTitleIconNameRight: 'csui_action_minimize32',
        dialogClassName: 'favorites'
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      ListViewKeyboardBehavior: {
        behaviorClass: ListViewKeyboardBehavior
      },
      CollectionState: {
        behaviorClass: CollectionStateBehavior,
        collection: function () {
          return this.completeCollection;
        },
        stateView: ListStateView,
        stateMessages: {
          empty: lang.emptyListText,
          loading: lang.loadingListText,
          failed: lang.failedListText
        }
      }
    },

    getChildView: function (item) {
      if (this.showFlatList) {
        return StandardListItem;
      } else {
        return SimpleTreeListView;
      }
    },

    childViewOptions: function () {
      return {
        templateHelpers: function () {
          if (this instanceof StandardListItem) {
            return {
              name: this.model.get('favorite_name'),
              enableIcon: true,
              showInlineActionBar: this.showInlineActionBar,
              itemLabel: _.str.sformat(listItemLang.itemTitleLabel, this.model.get('favorite_name'))
            };
          } else {
            var ariaName;
            var name = this.model.get('name');
            if (this.model.childrenCollection && this.model.childrenCollection.length === 0) {
              ariaName = _.str.sformat(lang.favoritesEmptyGroupAria, name);
            } else {
              ariaName = _.str.sformat(lang.favoritesGroupAria, name);
            }
            return {
              icon: 'mime_fav_group32',
              name: name,
              ariaName: ariaName,
              expand: this.model.searchMode
            };
          }
        },

        childViewTemplateHelpers: function () {
          return {
            icon: this.model.get('icon'),
            name: this.model.get('favorite_name'),
            text: lang.emptyGroupDefaultText,
            showInlineActionBar: this.showInlineActionBar,
            itemLabel: _.str.sformat(listItemLang.itemTitleLabel, this.model.get('favorite_name'))
          };
        },
        checkDefaultAction: true,
        context: this.context,
        iconSize: this.options.iconSize,
        //Set these values inorder to disaply Inline Actions
        toolbarData: this.toolbarData,
        refetchNodeActions: this.options.refetchNodeActions

      };
    },

    childEvents: {
      'click:item': '_onClickItem',  // event for flat list
      'click:tree:item': '_onClickTreeItem',
      'render': 'onRenderItem',
      'before:destroy': 'onBeforeDestroyItem',
      'changed:focus': 'onChangedfocus'
    },

    constructor: function FavoritesView(options) {
      options || (options = {});
      _.defaults(options, {
          orderBy: 'favorite_name asc',
          iconSize: 'contain',
          refetchNodeActions: true
        });
      options.data || (options.data = {});
      options.data.titleBarIcon = options.data.showTitleIcon === false ?
                                  undefined : 'title-icon title-favourites';

      var nonPromotedActionCommands = commands.getSignatures(tileViewToolbarItems);

      this.completeCollection = options.collection ||
                                options.context.getCollection(
                                    Favorite2GroupsCollectionFactory,
                                    {
                                      detached: true,
                                      permanent: true,
                                      favorites: {
                                        options: {
                                          promotedActionCommands: [],
                                          nonPromotedActionCommands: nonPromotedActionCommands
                                        }
                                      }
                                    }
                                );
      var limitedRS = Favorite2CollectionFactory.getLimitedResourceScope();
      limitedRS.commands?.push('editpermissions');
      this.completeCollection.favorites.setResourceScope(limitedRS);

      var ViewCollection = Backbone.Collection.extend({
        model: this.completeCollection.model
      });
      options.collection = new ViewCollection();
      this.showInlineActionBar = options.showInlineActionBar === false ?
                                 options.showInlineActionBar : true;

      var context        = options.context,
          viewStateModel = context && context.viewStateModel;
      this._enableOpenPerspective = config.openInPerspective &&
                                    viewStateModel && viewStateModel.get('history');

      ListView.prototype.constructor.apply(this, arguments);
      this.loadingText = lang.loadingText;
      BlockingView.imbue(this);

      // TODO: Set up collection parameters here to get the best performance;
      // set up both this.completeCollection and this.completeCollection.favorites
      // Node: must listen for sync to update when new model was successfully saved, otherwise
      // it would show up empty.
      this.listenTo(this.completeCollection, 'update sync',
          _.bind(this._synchronizeCollections, this));

      this._synchronizeCollections();

      this.listenTo(this, 'render', this._onRender);
      this.listenTo(this, 'change:filterValue', this._synchronizeCollections);

      if (this.showInlineActionBar) {
        options.tileViewToolbarItems = tileViewToolbarItems;
        this.context = context;
        this.toolbarData = {
          toolbaritems: tileViewToolbarItems,
          collection: this.completeCollection.favorites
        };
      }

      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(this, 'doc:preview:generic:actions', this._highlightRow);
    },

     /**
     * This method highlight's the row for which document is getting to be previewed.
     *
     * @param targetRow
     * @private
     */
      _highlightRow: function (targetNode, HIGHLIGHT_CLASS_NAME) {
        $('.' + HIGHLIGHT_CLASS_NAME).removeClass(HIGHLIGHT_CLASS_NAME);
        var groupIndex,rowIndex;
         groupIndex= _.findIndex(this.collection.models, function (node) {
           rowIndex= _.findIndex(node.get("favorites"), function (childnode) {
                    return childnode.id === targetNode.get("id");
                  });
                    return rowIndex!=-1;
                  });
        // ensure current viewing document exists in current page, then only high-light the row.
        // if the document exists in previous or next pages, let's do nothing for now.
        if (rowIndex !== -1) {
          var child = this.$childViewContainer.find(_.str.sformat("div:nth-child({0})", groupIndex+1));
          var target = child && child.find(".cs-list-group a");
          var targetRow = target && target.eq(rowIndex);
          targetRow && targetRow.addClass(HIGHLIGHT_CLASS_NAME);
        }
      },

    _onRender: function () {
      this.$el.addClass('cs-favorites');
      this.completeCollection.ensureFetched();
      this.$el.on('keydown', _.bind(this.onKeyDown, this));
      // the parent view is always rendered first with its current collection
      this._updateAccAttributes();
    },

    _updateAccAttributes: function () {
      // remove existing attributes first, shifting the aria-labelledby
      var tileContent = this.$el.find('.tile-content');
      var labelledBy = tileContent.attr('aria-labelledby');
      tileContent.removeAttr('role aria-expanded aria-labelledby');

      // set attributes
      if (this.showFlatList) {  // flat list
        this.$el.find('.tile-content > .binf-list-group').attr({'role': 'listbox', 'aria-labelledby': labelledBy});
      } else {  // tree list
        this.$el.find('.tile-content > .binf-list-group').attr({'role': 'tree', 'aria-labelledby': labelledBy});
      }
    },

    onRenderCollection: function () {
      // the collection can optionally be synced later, needs to update accessibility attributes
      this._updateAccAttributes();
    },

    onRenderItem: function (childView) {
      if (this.showFlatList) {
        childView._nodeIconView = new NodeTypeIconView({
          el: childView.$('.csui-type-icon').get(0),
          node: childView.model,
          size: this.options.iconSize
        });
        childView._nodeIconView.render();
        if(this.completeCollection && this.completeCollection.favorites && this.completeCollection.favorites.length) {
          childView.$el.attr('role', 'option');
        }
        childView.$el.attr('aria-label',
            _.str.sformat(listItemLang.typeAndNameAria, childView._nodeIconView.model.get('title'),
                childView.model.get('favorite_name')));
      } // for tree view the role is set in the simpletreelistitem
    },

    onBeforeDestroyItem: function (childView) {
      if (this.showFlatList && childView._nodeIconView) {
        childView._nodeIconView.destroy();
      }
    },

    onChangedfocus: function () {
      this.trigger('changed:focus');
    },

    _onClickItem: function (target) {
      this.triggerMethod('execute:defaultAction', target.model);
    },

    _onClickTreeItem: function (target, src) {
      this.triggerMethod('execute:defaultAction', src.model);
    },

    onClickHeader: function (target) {
      if (this.options.avoidOpenPerspectiveOnHeader) {
        return;
      }
      this.onClickOpenPerspective(target);
    },

    onClickOpenPerspective: function (target) {
      this.applicationScope.set('id', 'favorites');
      this.trigger('open:favorites:perspective');
    },

    onMoreLinkClick: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.triggerMethod('expand');
    },

    _synchronizeCollections: function () {
      var favoritesCollection,
          self = this,
          firstGroup = this.completeCollection.at(0),
          options = {
            connector: this.completeCollection.connector
          },
          filterObj = {
            favorite_name: this.options.filterValue
          };

      if (this.completeCollection.length === 1 && firstGroup.get('tab_id') === -1) {

        // there is only the Unsorted group (tab_id = -1), show a flat list as UX requested
        this.showFlatList = true;
        favoritesCollection = new Favorite2Collection(undefined, options);
        favoritesCollection.reset(firstGroup.favorites && firstGroup.favorites.models || []);
        favoritesCollection.setFilter(filterObj);
        // if not searching or search still has empty value, set it to all models
        if (!self.options.filterValue || self.options.filterValue.length === 0) {
          self.collection.reset(favoritesCollection.models);
        } else {
          // setFilter is now asynchronous, listen to sync event to update the collection
          self.listenTo(favoritesCollection, 'sync', function () {
            self.collection.reset(favoritesCollection.models);
          });
        }

      } else {

        // show favorite groups and items in a tree list
        self.showFlatList = false;
        var searchMode = this.isSearchOpen();
        var groups = new Backbone.Collection();
        var promises = [];

        _.each(this.completeCollection.models, function (group) {
          favoritesCollection = new Favorite2Collection(undefined, options);
          favoritesCollection.reset(group.favorites.models);
          favoritesCollection.setFilter(filterObj);

          var groupModel = new Backbone.Model(group.attributes);
          groupModel.childrenCollection = favoritesCollection;
          groupModel.searchMode = searchMode;
          // flatten the unsorted Favorites group
          (groupModel.get('tab_id') === -1) && groupModel.set('flatten', true);
          groups.add(groupModel);

          // searching with some non-empty string, wait for the setFilter() asynchronous call
          if (self.options.filterValue && self.options.filterValue.length > 0) {
            var deferred = $.Deferred();
            promises.push(deferred.promise());
            // setFilter is now asynchronous, listen to sync event to update the collection
            self.listenTo(favoritesCollection, 'sync', function () {
              // UX specs: don't show empty groups during search
              if (groupModel.childrenCollection.length === 0) {
                groups.remove(groupModel);
              }
              deferred.resolve();
            });
          }

        });

        // searching with some non-empty string, wait for all promises done then set collection
        if (self.options.filterValue && self.options.filterValue.length > 0) {
          $.when.apply($, promises).then(function () {
            self.collection.reset(groups.models);
          });
        } else {
          // set models to collection when not in the progress of searching or empty string search
          self.collection.reset(groups.models);
        }

      }
    },

    // Override the ListView::getElementByIndex method.
    // Return the jQuery list item element by index for keyboard navigation use
    getElementByIndex: function (index, event) {
      if (this.showFlatList) {
        return ListView.prototype.getElementByIndex.call(this, index);
      }

      if (isNaN(index) || (index < 0)) {
        return null;
      }
      var childView = this.children.findByIndex(index);
      if (childView && childView.currentlyFocusedElement) {
        return childView.currentlyFocusedElement(event);
      } else {
        return null;
      }
    }

  });

  return FavoritesView;

});


csui.define('css!csui/widgets/navigation.header/controls/favorites/impl/favorites',[],function(){});

csui.define('csui/widgets/navigation.header/controls/favorites/favorites.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'i18n!csui/widgets/navigation.header/controls/favorites/impl/nls/localized.strings',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'hbs!csui/widgets/navigation.header/controls/favorites/impl/favorites',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/widgets/favorites/favorites.view', 'csui/utils/contexts/factories/favorites2',
  'css!csui/widgets/navigation.header/controls/favorites/impl/favorites'
], function (_, $, Marionette, localizedStrings, TabableRegionBehavior, template,
    LayoutViewEventsPropagationMixin, FavoritesView) {
  'use strict';

  var FavoritesButtonView = Marionette.LayoutView.extend({
    className: 'csui-favorites-view initialLoading',

    template: template,

    templateHelpers: function () {
      return {
        title: localizedStrings.FavoritesIconTitle,
        favoritesTitleAria: localizedStrings.FavoritesTitleAria,
        highContrast: this.options.highContrast === 2
      };
    },

    regions: {
      favoritesViewContainerRegion: '.csui-favorites-view-container'
    },

    ui: {
      favoritesButtonContainer: '.csui-favorites-icon-container',
      favoritesViewContainer: '.csui-favorites-view-container'
    },

    events: {
      'dragenter': '_hideFavoritesView',
      'keydown': 'onKeyInView',
      'mouseenter .csui-favorites-view-container': 'onMouseEnterFavoritesView',
      'mouseenter .csui-favorites-icon-container': 'onMouseEnterFavoritesView',
      'mouseleave .csui-favorites-view-container': 'onMouseLeaveFavoritesView',
      'mouseleave .csui-favorites-icon-container': 'onMouseLeaveFavoritesView',
      'mouseenter .clicked-no-hover': 'onMouseEnterClickedNoHoverItem',
      'focus .csui-favorites-icon-container': 'onFocusButton',
      'blur .csui-favorites-icon-container': 'onBlurButton',
      'blur .csui-favorites-view-container': 'onBlurFavoritesViewContainer',
      'click .csui-favorites-icon-container': 'onClickFavoritesIcon'
    },

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function (event) {
      var $favoriteSearch = this.ui.favoritesViewContainer.find(
        '.content-tile .cs-search-button');
      if (event.shiftKey && $favoriteSearch .length > 0) {
        return this.favoritesView._focusSearchButton();
      } else {
        return this.ui.favoritesButtonContainer;
      }
    },

    constructor: function FavoritesButtonView(options) {
      Marionette.LayoutView.call(this, options);
      
      this.propagateEventsToRegions();
      this.listenTo(options.context, 'change:perspective', this._hideFavoritesView);
    },

    onBeforeDestroy: function () {
      this.favoritesView && this.favoritesView.destroy();
    },

    onRender: function () {
      this.ui.favoritesViewContainer.addClass('binf-hidden');
    },

    onFocusButton: function () {
      if(this.options.highContrast === 2){
        this.$el.find('.csui-icon-favorites').addClass('fav_header42_mo_black');
      }else{
        this.$el.find('.csui-icon-favorites').addClass('fav_header42_mo');
      }
    },

    onBlurButton: function () {
      if(this.options.highContrast === 2){
        this.$el.find('.csui-icon-favorites').removeClass('fav_header42_mo_black');
      }else{
        this.$el.find('.csui-icon-favorites').removeClass('fav_header42_mo');
      }
      if (this.favoritesViewInFocus !== true &&
          document.activeElement !== this.ui.favoritesButtonContainer[0]) {
        this._hideFavoritesView();
      }
    },

    onBlurFavoritesViewContainer: function (event) {
      if (this.favoritesViewInFocus !== true && this.keyboardAction !== true) {
        this._hideFavoritesView();
      }
    },

    onMouseEnterFavoritesView: function () {
      this.favoritesViewInFocus = true;
    },

    onMouseLeaveFavoritesView: function () {
      this.favoritesViewInFocus = false;
    },

    onMouseEnterClickedNoHoverItem: function (event) {
      event && event.target && $(event.target).removeClass('clicked-no-hover');
    },

    onKeyInView: function (event) {
      switch (event.keyCode) {
      case 9:  // tab
        var favoritesButtonInFocus = this.ui.favoritesButtonContainer.is(':focus');
        if (favoritesButtonInFocus && event.shiftKey !== true &&
            !this.ui.favoritesViewContainer.hasClass('binf-hidden')) {
          // move to the favorites list
          this._focusOnFavoriteSearch(event);
        } else if (!favoritesButtonInFocus && event.shiftKey) {
          // move to the favorites button
          event.preventDefault();
          event.stopPropagation();
          this._focusOnFavoriteButton();
        } else if (!$(event.target).closest('.tile-header').length){
          this._hideFavoritesView();
        }
        break;
      case 13:  // enter
      case 32:  // space
        if (!$(event.target).closest('.tile-header').length) {
        this.triggerMethod('click:favorites:icon', event);
          if (!this.ui.favoritesViewContainer.hasClass('binf-hidden')) {
            this._focusOnFavoriteSearch(event);
          }
        }
        break;
      case 40:  // arrow down
        if (!this.favoritesView || this.ui.favoritesViewContainer.hasClass('binf-hidden')) {
          this.triggerMethod('click:favorites:icon', event);
          this._focusOnFavoriteSearch(event);
        } else if (this.favoritesViewInFocus !== true) {
          this._focusOnFavoriteSearch(event);
        }
        break;
      case 27:  // escape
        this._focusOnFavoriteButton();
        this._hideFavoritesView();
        break;
      }
    },

    _focusOnFavoriteButton: function () {
      this.ui.favoritesButtonContainer.trigger('focus');
      this.favoritesViewInFocus = false;
    },

    _focusOnFavoriteSearch: function (event) {
      var $favoriteSearch = this.ui.favoritesViewContainer.find(
        '.content-tile .cs-search-button');
      if ($favoriteSearch.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        this.favoritesViewInFocus = true;
        this.favoritesView._moveTo(event, this.favoritesView._focusSearchButton());
      }
    },

    _focusOnFavoriteList: function (event) {
      var $favorites     = this.ui.favoritesViewContainer.find(
          '> .content-tile > .tile-content > .binf-list-group'),
          $favoriteItems = this.favoritesView.showFlatList ?
                           $favorites.find('> .binf-list-group-item') :
                           $favorites.find('> .cs-simpletreelistitem');
      if ($favoriteItems.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        this.favoritesViewInFocus = true;
        this.favoritesView._moveTo(event, this.favoritesView._focusList());
      }
    },

    _handleClickEvent: function (event) {
      // check to see if the click is NOT on the popover
      if (!$(event.target).parents('.csui-favorites-view-container').length &&
          !$(event.target).parents('.csui-favorites-icon-container').length) {
        this._hideFavoritesView();
      }
    },

    _toggleFavoritesView: function () {
      if (this.ui.favoritesViewContainer.hasClass('binf-hidden')) {
        this._showFavoritesView();
      } else {
        this._hideFavoritesView();
      }
    },

    _showFavoritesView: function () {
      this.ui.favoritesViewContainer.removeClass('binf-hidden');
      this.ui.favoritesButtonContainer.attr('aria-expanded', 'true');
      this.$el.addClass('showing-favorites-view');
      this.favoritesViewContainerRegion.show(this.favoritesView);
      $(document).off('click.' + this.cid).on('click.' + this.cid,
          _.bind(this._handleClickEvent, this));
    },

    _hideFavoritesView: function () {
      $(document).off('click.' + this.cid);
      if (this.favoritesView && this.favoritesView.isSearchOpen()) {
        this.favoritesView.searchClicked(event); // reset search to default
      }
      this.favoritesViewInFocus = false;
      this.ui.favoritesViewContainer.addClass('binf-hidden');
      this.ui.favoritesButtonContainer.attr('aria-expanded', 'false');
      this.$el.removeClass('showing-favorites-view');
    },

    onClickFavoritesIcon: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.options && this.options.parentView && 
      this.options.parentView.trigger("header:control:clicked");
      var toggleDropdown = $('.binf-open>.binf-dropdown-toggle');
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown('toggle');
      }
      this._ensureFavoritesView();
      this._toggleFavoritesView();
      this._focusOnFavoriteSearch(event);
    },

    _ensureFavoritesView: function () {
      if (!this.favoritesView) {
        var self = this;
        var options = _.extend(this.options, {showInlineActionBar: true, avoidOpenPerspectiveOnHeader: true});
        this.favoritesView = new FavoritesView(options);
        this.favoritesView.listenToOnce(this.favoritesView.completeCollection, "request", this.favoritesView.blockActions);
        this.favoritesView.listenToOnce(this.favoritesView.completeCollection, "sync error", this.favoritesView.unblockActions);
        this.listenToOnce(this.favoritesView.completeCollection, "sync", function () {
          this.$el.removeClass("initialLoading");
        });
        this.favoritesView.blockingView.showloadingWheel = false;
        this.listenTo(this.favoritesView, 'childview:click:tree:item', function (target, src) {
          src.$el && src.$el.addClass('clicked-no-hover');
          self._hideFavoritesView();
          self._focusOnFavoriteButton();
        });
        this.listenTo(this.favoritesView, 'childview:click:item', function (src) {
          src.$el && src.$el.addClass('clicked-no-hover');
          self._hideFavoritesView();
          self._focusOnFavoriteButton();
        });
        this.listenTo(this.favoritesView, 'childview:before:execute:command', function (src) {
          self._hideFavoritesView();
          self._focusOnFavoriteButton();
        });
        this.listenTo(this.favoritesView,
            'before:keyboard:change:focus childview:before:keyboard:change:focus', function () {
              self.keyboardAction = true;
            });
        this.listenTo(this.favoritesView,
            'after:keyboard:change:focus childview:after:keyboard:change:focus', function () {
              self.keyboardAction = false;
            });

        this.listenTo(this.favoritesView, 'open:favorites:perspective', function() {
          this._hideFavoritesView();
        });
      }
    }
  });

  _.extend(FavoritesButtonView.prototype, LayoutViewEventsPropagationMixin);

  return FavoritesButtonView;
});


csui.define('csui/widgets/navigation.header/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/navigation.header/impl/nls/root/lang',{
  profileMenuItemLabel: 'Profile',
  switchToClassicMenuItemLabel: 'Classic view',
  signOutMenuItemLabel: 'Sign out',
  EditPerspective: "Edit page",
  editMultiplePerspectives: "Edit home pages",
  CreatePerspective: "Edit page",
  personalizePage: "Personalize page",
  ContentServerAdministrationMenuItemLabel: 'Administration',
  AboutBox: 'About',
  RecycleBin: 'Recycle bin'
});






csui.define('csui/widgets/navigation.header/profile.menuitems',['csui/lib/underscore',
  'i18n!csui/widgets/navigation.header/impl/nls/lang',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  // Load extra tool items from the previous module location
  'csui-ext!csui/widgets/navigation.header/profile.menuitems'
], function (_, lang, ToolItemsFactory, TooItemModel, extraToolItems) {
  'use strict';

  var menuItems = {
    profileMenu: new ToolItemsFactory({
        profile: [
          {signature: 'UserProfile', name: lang.profileMenuItemLabel}
        ],
        others: [
          {signature: 'SwitchToClassic', name: lang.switchToClassicMenuItemLabel},
          {signature: 'EditPerspective', name: lang.EditPerspective},
          {signature: 'EditMultiplePerspectives', name: lang.editMultiplePerspectives},
          {signature: 'ContentServerAdministration', name: lang.ContentServerAdministrationMenuItemLabel},
          {signature: 'AboutBox', name: lang.AboutBox},
          {signature: 'RecycleBin', name: lang.RecycleBin}
        ],
        proxy: [

        ],
        signout: [
          {signature: 'SignOut', name: lang.signOutMenuItemLabel}
        ]
      },
      {
        maxItemsShown: 0, // force toolbar to immediately start with a drop-down list
        dropDownIconName: "csui_action_caret_down32"
      }
    )
  };

  if (extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = menuItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(toolItems, function (toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return menuItems;
});


csui.define('csui/widgets/navigation.header/profile.menuitems.mask',[
  'module', 'csui/lib/underscore',
  'csui/controls/toolbar/toolitems.mask',
  'csui/utils/toolitem.masks/global.toolitems.mask'
], function (module, _, ToolItemMask, GlobalMenuItemsMask) {
  'use strict';

  var ProfileMenuItemsMask = ToolItemMask.extend({

    constructor: function ProfileMenuItemsMask() {
      var config = module.config(),
          globalMask = new GlobalMenuItemsMask();
      ToolItemMask.prototype.constructor.call(this, globalMask, {normalize: false});
      // Masks passed in by separate require.config calls are sub-objects
      // stored in the outer object be different keys
      _.each(config, function (source, key) {
        this.extendMask(source);
      }, this);
      // Enable restoring the mask to its initial state
      this.storeMask();
    }

  });

  return ProfileMenuItemsMask;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/navigation.header/controls/user.profile/impl/user.profile',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<a href=\"#\" data-binf-toggle=\"dropdown\" role=\"button\" aria-expanded=\"false\" aria-haspopup=\"true\"\n   class=\"binf-dropdown-toggle nav-profile csui-navbar-icons csui-acc-focusable\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"profileMenuTitle") || (depth0 != null ? lookupProperty(depth0,"profileMenuTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"profileMenuTitle","hash":{},"loc":{"start":{"line":2,"column":88},"end":{"line":2,"column":108}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"profileMenuAria") || (depth0 != null ? lookupProperty(depth0,"profileMenuAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"profileMenuAria","hash":{},"loc":{"start":{"line":2,"column":122},"end":{"line":2,"column":141}}}) : helper)))
    + "\">\n  <span class=\"csui-profile-default-image image_user_placeholder\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"initials") || (depth0 != null ? lookupProperty(depth0,"initials") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"initials","hash":{},"loc":{"start":{"line":3,"column":66},"end":{"line":3,"column":78}}}) : helper)))
    + "</span>\n  <img class=\"csui-profile-image binf-img-circle binf-hidden\" alt=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"profileImageAlt") || (depth0 != null ? lookupProperty(depth0,"profileImageAlt") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"profileImageAlt","hash":{},"loc":{"start":{"line":4,"column":67},"end":{"line":4,"column":86}}}) : helper)))
    + "\" src=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imgSrc") || (depth0 != null ? lookupProperty(depth0,"imgSrc") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imgSrc","hash":{},"loc":{"start":{"line":4,"column":93},"end":{"line":4,"column":103}}}) : helper)))
    + "\">\n</a>\n<ul class=\"binf-dropdown-menu csui-profile-dropdown\" role=\"menu\"></ul>";
}});
Handlebars.registerPartial('csui_widgets_navigation.header_controls_user.profile_impl_user.profile', t);
return t;
});
/* END_TEMPLATE */
;



csui.define('css!csui/widgets/navigation.header/controls/user.profile/impl/user.profile',[],function(){});

csui.define('csui/widgets/navigation.header/controls/user.profile/user.profile.view',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/lib/marionette', 'csui/utils/url',
  'csui/utils/log', 'csui/utils/base', 'csui/utils/commands',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/user',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/toolbar/toolitems.filtered.model',
  'csui/controls/toolbar/toolitem.view',
  'csui/widgets/navigation.header/profile.menuitems',
  'csui/widgets/navigation.header/profile.menuitems.mask',
  'csui/utils/user.avatar.color',
  'csui/controls/globalmessage/globalmessage',
  'hbs!csui/widgets/navigation.header/controls/user.profile/impl/user.profile',
  'csui-ext!csui/widgets/navigation.header/controls/user.profile/user.profile.view',
  'i18n!csui/pages/start/impl/nls/lang',
  'css!csui/widgets/navigation.header/controls/user.profile/impl/user.profile',
  'csui/lib/jquery.binary.ajax'
], function (module, _, $, Backbone, Marionette, Url, log, base,
    commands, ConnectorFactory, UserModelFactory, TabableRegionBehavior,
    FilteredToolItemsCollection, ToolItemView, menuItems, MenuItemsMask, UserAvatarColor,
    GlobalMessage, template, menuHandlers, lang) {
  'use strict';
  var config = window.csui.requirejs.s.contexts._.config
                   .config['csui/utils/contexts/factories/user'] || {};
  log = log(module.id);

  var ProfileView = Marionette.CompositeView.extend({
    classname: 'binf-dropdown',

    template: template,

    templateHelpers: function () {
      var username = base.formatMemberName(this.model);

      return {
        profileMenuTitle: lang.profileMenuTitle,
        profileMenuAria: _.str.sformat(lang.profileMenuAria, username),
        profileImageAlt: _.str.sformat(lang.profileImageAlt, username),
        // a 1x1 transparent gif, to avoid an empty src tag
        imgSrc: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
        initials: this.options.model.attributes.initials
      };
    },

    serializeData: function () {
      return {
        items: this.collection.toJSON()
      };
    },

    childView: ToolItemView,

    childViewContainer: '> .csui-profile-dropdown',

    ui: {
      userProfileMenu: '> .csui-profile-dropdown',
      userProfileMenuHandle: '> a',
      personalizedImage: '.csui-profile-image',
      defaultImage: '.csui-profile-default-image',
      profileDropdownToggler: '> .nav-profile'
    },

    events: {
      'keydown @ui.profileDropdownToggler': '_showDropdown',
      'keydown @ui.userProfileMenu': '_showDropdown',
      'focusout @ui.profileDropdownToggler': '_toggleDropdown',
      'focusout @ui.userProfileMenu': '_toggleDropdown'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: '> .csui-acc-focusable',

    constructor: function ProfileView(options) {
      options || (options = {});
      this.options = options;
      this._ensureModels(options);
      this._getUserGroups();

      Marionette.CompositeView.prototype.constructor.call(this, options);

      this.connector = this.options.context.getModel(ConnectorFactory);
      this.listenTo(this.model, 'change', this._refreshUser)
          .listenTo(options.context, 'sync error', this._refreshActions)
          .listenTo(this, 'render', this._displayUser)
          .listenTo(this, 'destroy', this._releasePhotoUrl)
          .listenTo(this, 'childview:toolitem:action', this._triggerMenuItemAction)
          .listenTo(Backbone, 'closeToggleAction', this._closeToggle);
    },

    
    _getUserGroups: function () {
      let groupsUrl = this._getGroupsUrl();
      if (groupsUrl) {
        this.options.connector.makeAjaxCall({
          type: "GET",
          url: groupsUrl
        }).always(_.bind(function (response, statusText, jqxhr) {
              if (jqxhr && jqxhr.status === 200) {
                let groups = response.results;

                //setting authenticated user groups in the context
                this.options.context._groups = groups;

                let businessAdministrator = false;
                _.each(groups,function(group){
                  businessAdministrator = !businessAdministrator ? group?.data?.properties?.name?.indexOf('Business Administrators') > -1 : businessAdministrator;
                })
                if(businessAdministrator && config?.initialResponse?.data){
                  config.initialResponse.data.businessAdministrator = businessAdministrator;
                  //update the config and reload the models from user porfile popup if User is business administrator
                  this._ensureModels(this.options);
                }
              }
            }, this));
      }
    },

    _getGroupsUrl: function () {
      let user = this.options?.context?.getModel(UserModelFactory);
      if(user){
        let connector = user.connector ? user.connector : this.options.connector;
        this.options.connector = this.options.connector? this.options.connector: connector;
        let fullUrl = Url.combine( connector.getConnectionUrl().getApiBase("v2"), 'members/memberof');
        return fullUrl;
      }
    },

    _ensureModels: function (options) {
      var context = options.context,
          user    = context.getModel(UserModelFactory);

      this.username = "ensured";

      this.staticMenuItems = menuItems.profileMenu.collection.toJSON();
      options.model = user;

      options.collection = new FilteredToolItemsCollection(
          menuItems.profileMenu, {
            status: {context: context},
            commands: commands,
            mask: new MenuItemsMask()
          });
    },

    _refreshUser: function () {
      // Properties is being destroyed on changing the context node. Both destroyer
      // and a sub-view refreshed are listening on node changes. Although listening
      // is stopped during the destruction, already registered handlers will be
      // triggered nevertheless.
      if (this._isRendered && !this.isDestroyed) {
        this.render();
      }
    },

    _refreshActions: function () {
      // Properties is being destroyed on changing the context node. Both destroyer
      // and a sub-view refreshed are listening on node changes. Although listening
      // is stopped during the destruction, already registered handlers will be
      // triggered nevertheless.
      if (this._isRendered && !this.isDestroyed) {
        if (menuHandlers) {
          var options  = this.options,
              promises = _.chain(menuHandlers)
                  .flatten(true)
                  .map(function (menuHandler) {
                    return menuHandler(options);
                  })
                  .value(),
              self     = this;
          $.whenAll
              .apply($, promises)
              .always(function (dynamicMenuItems) {
                var mask = new MenuItemsMask();
                dynamicMenuItems = _.chain(dynamicMenuItems)
                    .flatten()
                    .pluck('profileMenu')
                    .flatten()
                    .value();
                //insert dynamic menu items at end of it's group
                _.each(dynamicMenuItems, function(menuItem){
                  if(!!menuItem && !!self.staticMenuItems) {
                    var found = false;
                    for (var i = 0; i < self.staticMenuItems.length; i++) {
                      if (self.staticMenuItems[i].group === menuItem.group) {
                        found = true;
                      } else if (found) {
                        self.staticMenuItems.splice(i + 1, 0, menuItem);
                        break;
                      }
                    }
                    if (!found) {
                      self.staticMenuItems.splice(self.staticMenuItems.length - 1, 0, menuItem);
                    }
                  }
                });
                dynamicMenuItems = self.staticMenuItems.concat([]);
                dynamicMenuItems = mask.maskItems(dynamicMenuItems);
                menuItems.profileMenu.reset(dynamicMenuItems);
              });
        } else {
          this.collection.refilter();
        }
      }
    },

    _triggerMenuItemAction: function (toolItemView, args) {
      // close the dropdown menu before triggering the event
      this.ui.profileDropdownToggler.binf_dropdown('toggle');
      this._executeAction(args.toolItem);
    },

    _executeAction: function (toolItem) {
      var signature = toolItem.get('signature'),
          command   = commands.findWhere({signature: signature}),
          context   = this.options.context,
          status    = {
            context: context,
            toolItem: toolItem,
            data: toolItem.get('commandData')
          },
          self      = this;
      try {
        // If the command was not found and the toolitem is executable, it is
        // a developer's mistake.
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        }

        this.$el.addClass('binf-disabled');
        command.execute(status)
            .done(function (item) {
              // TODO: Add success reporting; do not build the sentence
              // from separate verbs and subjects; the command has to
              // return the full sentence
            })
            .fail(function (error) {
              if (error) {
                error = new base.Error(error);
                GlobalMessage.showMessage('error', error.message,
                    error.errorDetails);
              }
            })
            .always(function () {
              self.$el.removeClass('binf-disabled');
            });
      } catch (error) {
        log.warn('Executing the command "{0}" failed.\n{1}',
            command.get('signature'), error.stack) && console.warn(log.last);
      }
    },

    _displayUser: function () {
      if (this.model.get('id')) {
        this._displayProfileImage();
        this._assignUserColor();
      }
    },

    _displayProfileImage: function () {
      var photoUrl = this._getUserPhotoUrl();
      if (photoUrl) {
        var getPhotoOptions = {
          url: photoUrl,
          dataType: 'binary'
        };
        this.connector.makeAjaxCall(getPhotoOptions)
            .always(_.bind(function (response, statusText, jqxhr) {
              // during execution of this ajax call, by the time, if the actual view got destroyed
              // then let's not execute the remaining functionality.
              if (!this.isDestroyed) {
                if (jqxhr.status === 200) {
                  this._showPersonalizedImage(response);
                } else {
                  this._showDefaultImage();
                }
              }
            }, this));
      } else {
        this._showDefaultImage();
      }
    },

    _getUserPhotoUrl: function () {
      var connection = this.connector.connection,
          cgiUrl     = new Url(connection.url).getCgiScript(),
          photoPath  = this.model.get('photo_url');
      // If the URL does not contain the cache-busting parameter derived from
      // the picture's latest change, there was a problem retrieving it.  It
      // does not make sense to try it once more from the client side, waste
      // time and server resources and litter the log by 404 errors.
      if (photoPath && photoPath.indexOf('?') > 0) {
        return Url.combine(cgiUrl, photoPath);
      }
    },

    _showPersonalizedImage: function (imageContent) {
      this._releasePhotoUrl();
      this._photoUrl = URL.createObjectURL(imageContent);
      this.ui.defaultImage.addClass('binf-hidden');
      this.ui.personalizedImage.attr('src', this._photoUrl)
          .removeClass('binf-hidden');
      // after coming from keyboard once update the profile put focus to the resp. image.
      this.$el.parents().find('.esoc-userprofile-pic-actions img').length &&
      this.$el.parents().find('.esoc-userprofile-pic-actions img').trigger('focus');
    },

    _showDefaultImage: function (imageContent) {
      this._releasePhotoUrl();
      this.ui.personalizedImage.addClass('binf-hidden');
      this.ui.defaultImage[0].innerText = this.options.model.attributes.initials;
      this.ui.defaultImage.removeClass('binf-hidden');
      this.$el.parents().find(' span.esoc-full-profile-avatar-cursor').length &&
      this.$el.parents().find(' span.esoc-full-profile-avatar-cursor').trigger('focus');
    },

    _releasePhotoUrl: function () {
      if (this._photoUrl) {
        URL.revokeObjectURL(this._photoUrl);
        this._photoUrl = undefined;
      }
    },

    _closeToggle: function () {
      if (this.$el.hasClass('binf-open')) {
        this.ui.userProfileMenuHandle.trigger('click');
      }
    },

    _showDropdown: function (event) {
      var elms          = this.ui.userProfileMenu.find('> li > a'),
          index         = 0,
          activeElement = this.$el.find(document.activeElement);
      if (activeElement.length > 0) {
        index = elms.index(activeElement[0]);
        if (event.keyCode === 38 || event.keyCode === 40) {
          event.preventDefault();
          if (event.keyCode === 38) { // up arrow key
            index = index === -1 ? (elms.length - 1) : index - 1;
          }
          if (event.keyCode === 40) { // down arrow key
            index = index === (elms.length - 1) ? -1 : index + 1;
          }
          if (index === -1) {
            this.ui.profileDropdownToggler.trigger('focus');
          } else {
            $(elms[index]).trigger('focus');
          }
        } else if (event.keyCode === 27 &&
                   $(activeElement).closest('ul').is('.csui-profile-dropdown')) {
          event.stopPropagation();
          this.ui.profileDropdownToggler.trigger('click').trigger('focus');
        } else if (event.keyCode === 32 || event.keyCode === 13) {
          event.preventDefault();
          event.stopPropagation();
          $(activeElement).trigger('click');
        }
      }
    },

    _toggleDropdown: function (event) {
      var that = this;
      setTimeout(function () {
        if (!!document.activeElement.offsetParent &&
            !document.activeElement.offsetParent.classList.contains(
                'csui-profile-dropdown') &&
            document.activeElement !== that.ui.profileDropdownToggler[0] &&
            that.ui.userProfileMenu.is(':visible')) {
          // closes the menu when keyboard moves focus out of the profile area
          $(that.ui.profileDropdownToggler).trigger('click');
        }
      }, 100);
    },

    _assignUserColor: function () {
      var userbackgroundcolor = UserAvatarColor.getUserAvatarColor(this.model.attributes);
      this.ui.defaultImage.css("background", userbackgroundcolor);
    }
  });

  return ProfileView;
});


csui.define('csui/widgets/navigation.header/controls/progressbar.maximize/progressbar.maximize.view',['smart/controls/progresspanel/progressbar.maximize/progressbar.maximize.view'
], function (SmartProgressbarMaximizeView) {

  var ProgressbarMaximizeView = SmartProgressbarMaximizeView.extend({

    constructor: function ProgressbarMaximizeView(options) {
        SmartProgressbarMaximizeView.prototype.constructor.call(this, options);
    }

  });
  
  return ProgressbarMaximizeView;
});

csui.define('csui/controls/app.header/app.header.controls/logo/logo.view',[
  "nuc/lib/underscore",
  "nuc/lib/marionette3",
  "csui/utils/contexts/factories/branding.config.factory",
  "csui/utils/url",
  "csui/utils/node.links/node.links",
  "csui/utils/contexts/factories/application.scope.factory",
  "i18n!csui/pages/start/nls/lang",
], function (
  _,
  Marionette,
  BrandingConfigFactory,
  Url,
  NodeLinks,
  ApplicationScopeModelFactory,
  lang
) {
  "use strict";

  const DEFAULT_LOGO_SRC =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIyIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMTIyIDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTYuMTQ3MiAxMC42MTQ4QzE2LjE0NzIgMTQuNDEyNyAxMy45NjMyIDE4LjUzMTkgOC4xMTc3NyAxOC41MzE5QzMuODU0MTMgMTguNTQ3OSAtMS44Mzc3OWUtMDcgMTYuMTM5MSAtMS44Mzc3OWUtMDcgMTAuNjE0OEMtMS44Mzc3OWUtMDcgNi4wMTM5NSAyLjkwNjY2IDIuNDcyOTcgOC42NjM3NyAyLjc4NjEyQzE0Ljc5MDIgMy4xMzEzOSAxNi4xNDcyIDcuODc2NzggMTYuMTQ3MiAxMC42MTQ4Wk01LjIxMTExIDcuNzI0MjNDNC42OTA1NyA4LjU4NzU2IDQuNDMxMjEgOS41ODMxNyA0LjQ2NDM3IDEwLjU5MDdDNC40NjQzNyAxMi45MTkzIDUuNjEyNTggMTUuMDMxIDguMDkzNjggMTUuMDMxQzEwLjU3NDggMTUuMDMxIDExLjY1ODcgMTMuMDg3OSAxMS42NTg3IDEwLjc4MzRDMTEuNzE0NCAxMC4xMTg1IDExLjYzMzUgOS40NDkyNiAxMS40MjA4IDguODE2ODJDMTEuMjA4MiA4LjE4NDM3IDEwLjg2ODMgNy42MDIxNCAxMC40MjIyIDcuMTA1OTZDMTAuMDcyNyA2Ljc5NDA3IDkuNjYwMjYgNi41NjA5NSA5LjIxMjc5IDYuNDIyNDFDOC43NjUzMiA2LjI4Mzg4IDguMjkzMjkgNi4yNDMxNiA3LjgyODcxIDYuMzAzMDFDNy4zMDY0NyA2LjI5MTc5IDYuNzkwMzQgNi40MTY5OCA2LjMzMTI5IDYuNjY2MjJDNS44NzIyMyA2LjkxNTQ2IDUuNDg2MTMgNy4yODAxNCA1LjIxMTExIDcuNzI0MjNWNy43MjQyM1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik01NS40MjczIDQuNDgwMkM1NS44MzAzIDMuOTc3NjggNTYuMzQwNSAzLjU3MTY2IDU2LjkyMDcgMy4yOTE4NEM1Ny43ODk3IDIuOTQ4MzEgNTguNzE2MyAyLjc3Mzg5IDU5LjY1MDcgMi43Nzc5NkM2MC41NzU4IDIuNzUwMTUgNjEuNDkzNiAyLjk0ODYgNjIuMzI0NiAzLjM1NjA4QzYzLjkzMDQgNC4xNTkwMiA2NC4zMDc4IDUuNTQwMDggNjQuMzA3OCA3Ljg3NjY1VjE4LjE1NDNINTkuOTE1N1Y5LjcxNTM5QzU5Ljk5MTMgOC45NjAwMyA1OS45MjMyIDguMTk3MTggNTkuNzE1IDcuNDY3MTVDNTkuNTQwMSA3LjA5Njk4IDU5LjI1NjcgNi43ODg4NCA1OC45MDI0IDYuNTgzNzJDNTguNTQ4MSA2LjM3ODYxIDU4LjEzOTggNi4yODYyNSA1Ny43MzE3IDYuMzE4OTRDNTUuNDAzMiA2LjMxODk0IDU1LjQwMzIgOC4xODk4IDU1LjQwMzIgMTAuMDYwN1YxOC4xNTQzSDUwLjk2MjlWMy4xNjMzN0g1NS40MjczVjQuNDgwMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00OC44NTkxIDE0LjI3NjNDNDguNDQ5NiAxNS4xMzU0IDQ3LjE0ODggMTguNTMxOSA0MS4zNzU2IDE4LjUzMTlDMzYuOTExMyAxOC41MzE5IDMzLjc3OTggMTUuODAxOSAzMy43Nzk4IDEwLjg3OThDMzMuNzc5OCA3LjI1MDUxIDM1LjU2MjMgMi43ODYxNCA0MS40OTYxIDIuNzg2MTRDNDIuNDg1OSAyLjcwNTMzIDQzLjQ4MTUgMi44Mzg0NyA0NC40MTUzIDMuMTc2NTJDNDUuMzQ5MSAzLjUxNDU3IDQ2LjE5OTIgNC4wNDk2MiA0Ni45MDc5IDQuNzQ1MzJDNDguODY3MSA2Ljg0OTAzIDQ4Ljk3OTUgOS43Nzk3OCA0OS4wMzU3IDExLjQ4MkgzOC4zMDA0QzM4LjMwMDQgMTMuMzUyOSAzOS4zMzYyIDE1LjIyMzcgNDEuNzIwOSAxNS4yMjM3QzQ0LjEwNTYgMTUuMjIzNyA0NC45MzI3IDEzLjYxNzkgNDUuNTE4OCAxMi41NzRMNDguODU5MSAxNC4yNzYzWk00NC40NTg5IDguNzE5ODlDNDQuNDMwMiA3Ljk0MjExIDQ0LjE0ODMgNy4xOTQ5OCA0My42NTYgNi41OTIwOUM0My4wNjQ3IDYuMDU4OTQgNDIuMjkyMSA1Ljc3MTczIDQxLjQ5NjEgNS43ODkxNUM0MS4wNzM5IDUuNzg3NTQgNDAuNjU2IDUuODczOCA0MC4yNjg5IDYuMDQyNDRDMzkuODgxOSA2LjIxMTA5IDM5LjUzNDEgNi40NTg0MyAzOS4yNDc4IDYuNzY4NzRDMzguNzcgNy4zMzI3NSAzOC40NjEgOC4wMjAyIDM4LjM1NjYgOC43NTIwMUw0NC40NTg5IDguNzE5ODlaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTEwLjQ3NyA2LjI3MDk5SDExMy40MjRWMy4xNjM2SDExMC41MTdWLTMuMDYyOTllLTA3SDEwNi4xMTdWMy4xNTU1N0gxMDUuMzk0TDEwMy4zNzkgNi4yNzA5OUgxMDYuMDkzVjEzLjQwOTJDMTA2LjA5MyAxNC44NDY0IDEwNi4wOTMgMTUuOTE0NCAxMDYuNzI3IDE2LjgwNTZDMTA3LjY3NSAxOC4xODY3IDEwOS4zNDUgMTguMjc1IDExMC44NyAxOC4yNzVDMTExLjY1MiAxOC4yNjE4IDExMi40MyAxOC4xODM5IDExMy4xOTkgMTguMDQyMlYxNC41ODk1TDExMS41OTMgMTQuNjQ1N0MxMTAuNDEzIDE0LjY0NTcgMTEwLjQxMyAxMy44NDI4IDExMC40NDUgMTIuOTUxNUwxMTAuNDc3IDYuMjcwOTlaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNjYuNTIzNyAtMy4wNjI5OWUtMDdINzAuOTIzOFYzLjE1NTU3SDc1LjUwMDZMNzMuNDg1MiA2LjI3MDk5SDcwLjg2NzZWMTIuOTI3NEM3MC44Njc2IDEzLjg1MDggNzAuODY3NiAxNC42MjE2IDcyLjAxNTggMTQuNjIxNkw3My42MjE3IDE0LjU2NTRWMTguMDE4MUM3Mi44NTMzIDE4LjE1OTggNzIuMDc0NCAxOC4yMzc3IDcxLjI5MzEgMTguMjUwOUM2OS43Njc1IDE4LjI1MDkgNjguMDgxNCAxOC4xNjI2IDY3LjE1IDE2Ljc4MTVDNjYuNTQ3NyAxNS44OTAzIDY2LjUxNTYgMTQuODIyMyA2Ni41MTU2IDEzLjM4NTFMNjYuNTIzNyAtMy4wNjI5OWUtMDdaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTE3LjQ5NSA2LjI3MDk3SDExNi45NDlWMy42MjEyNUgxMTUuOTQ1VjMuMTYzNTdIMTE4LjQ3NVYzLjYyMTI1SDExNy40ODdMMTE3LjQ5NSA2LjI3MDk3Wk0xMjEuNzU5IDYuMjcwOTdIMTIxLjIyMVY0LjM1MTkzVjMuNzE3NjFMMTIxLjA2OCA0LjIzOTUyTDEyMC40MzQgNi4yNzA5N0gxMTkuOTQ0TDExOS4zMTggNC4yMzk1MkwxMTkuMTU3IDMuNzI1NjRWNC4zNTE5M1Y2LjI3MDk3SDExOC42MzVWMy4xNjM1N0gxMTkuMzc0TDEyMC4xNzcgNS42MjA1OEwxMjAuOTQgMy4xNjM1N0gxMjEuNjc4TDEyMS43NTkgNi4yNzA5N1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik04OS4zMzU2IDE0LjI4NDNMODguNTMyNyAxNS41ODVDODcuNzI5OCAxNi43NDEzIDg2LjI2MDQgMTguNTIzOCA4Mi4wMDQ4IDE4LjUyMzhDNzcuNTQwNCAxOC41MjM4IDc0LjU0NTQgMTUuNzkzOCA3NC41NDU0IDEwLjg3MThDNzQuNTQ1NCA3LjI0MjQ1IDc2LjMyNzkgMi43NzgwOCA4Mi4yNjE3IDIuNzc4MDhDODMuMjUxNSAyLjY5NzI3IDg0LjI0NzEgMi44MzA0MSA4NS4xODA5IDMuMTY4NDZDODYuMTE0NyAzLjUwNjUyIDg2Ljk2NDggNC4wNDE1NiA4Ny42NzM1IDQuNzM3MjZDODkuNjMyNyA2Ljg0MDk4IDg5Ljc0NTEgOS43NzE3MiA4OS44MDE0IDExLjQ3NEg3OS4wNjZDNzkuMDY2IDEzLjM0NDggNzkuOTY1MyAxNS4yMTU3IDgyLjM1IDE1LjIxNTdDODQuNzM0OCAxNS4yMTU3IDg1LjQ2NTUgMTMuNjA5OCA4Ni4wMTE1IDEyLjU2Nkw4OS4zMzU2IDE0LjI4NDNaTTg1LjE4NDQgOC43MTk4N0M4NS4xNTU3IDcuOTQyMDggODQuODczNyA3LjE5NDk1IDg0LjM4MTUgNi41OTIwN0M4My43OTAyIDYuMDU4OTEgODMuMDE3NiA1Ljc3MTcgODIuMjIxNiA1Ljc4OTEyQzgxLjc5OTQgNS43ODc1MSA4MS4zODE0IDUuODczNzcgODAuOTk0NCA2LjA0MjQyQzgwLjYwNzMgNi4yMTEwNiA4MC4yNTk2IDYuNDU4NCA3OS45NzMzIDYuNzY4NzFDNzkuNDk1NCA3LjMzMjcyIDc5LjE4NjUgOC4wMjAxNyA3OS4wODIgOC43NTE5OEw4NS4xODQ0IDguNzE5ODdaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTA0LjQ2MyAxOC4xNTQ1TDk4Ljk1NDcgMTAuMjYxNkwxMDMuNTQ4IDMuMTU1NTJIOTguNTA1TDk2LjMzNzEgNi41MTE4Mkw5NC4wMDA1IDMuMTU1NTJIODguOTU4TDkzLjkxMjIgMTAuMjYxNkw4OC44MTM1IDE4LjE1NDVIOTMuODU2TDk2LjUyOTggMTQuMDExM0w5OS40MjA0IDE4LjE1NDVIMTA0LjQ2M1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMi4yMzM3IDQuNDgwNDlDMjIuNzE1MiAzLjkxMjY2IDIzLjMyMTggMy40NjQxNiAyNC4wMDU5IDMuMTcwMjFDMjQuNjg5OSAyLjg3NjI1IDI1LjQzMjggMi43NDQ4NCAyNi4xNzYxIDIuNzg2MjhDMjkuODYxNyAyLjc4NjI4IDMyLjQ0NzEgNS41ODA1MiAzMi40NDcxIDEwLjU4MjlDMzIuNDQ3MSAxMy42NTgxIDMxLjMyMyAxOC41MjQgMjYuMDIzNiAxOC41MjRDMjUuMzA2OSAxOC41NDA4IDI0LjU5NTQgMTguMzk3NCAyMy45NDEyIDE4LjEwNDNDMjMuMjg2OSAxNy44MTEyIDIyLjcwNjMgMTcuMzc1OCAyMi4yNDE3IDE2LjgyOThWMjMuMTE2OEgxNy43NzczVjMuMTYzNjZIMjIuMjQxN0wyMi4yMzM3IDQuNDgwNDlaTTI1LjIyODcgNi4yMzg5NEMyNC43ODg2IDYuMjM3MDcgMjQuMzU0MiA2LjMzNzY3IDIzLjk1OTggNi41MzI3OEMyMy41NjU0IDYuNzI3OSAyMy4yMjE4IDcuMDEyMTYgMjIuOTU2MyA3LjM2MzA2QzIyLjI5MjIgOC4zMjc3NCAyMS45NjczIDkuNDg1NzYgMjIuMDMyOSAxMC42NTUxQzIxLjk1MDEgMTEuODk4NCAyMi4zMzA1IDEzLjEyODQgMjMuMTAwOSAxNC4xMDc4QzIzLjM1MTEgMTQuMzkyOSAyMy42NTgzIDE0LjYyMjMgMjQuMDAyNyAxNC43ODE0QzI0LjM0NyAxNC45NDA0IDI0LjcyMDkgMTUuMDI1NSAyNS4xMDAyIDE1LjAzMTJDMjcuMjYwMSAxNS4wMzEyIDI4LjIwNzYgMTIuNzU4OCAyOC4yMDc2IDEwLjU1ODhDMjguMjA3NiA4LjcxMiAyNy42NjE2IDYuNzUyODIgMjUuODQ2OSA2LjMyNzI2QzI1LjY0NTMgNi4yNzMwOSAyNS40Mzc0IDYuMjQ2MDkgMjUuMjI4NyA2LjI0Njk3VjYuMjM4OTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K";

  let LogoView = Marionette.View.extend({
    tagName: "otc-brand",

    attributes: function () {},

    template: false,

    constructor: function LogoView(options = {}) {
      Marionette.View.apply(this, arguments);

      this.brandingConfigData = this.options.context.getModel(
        BrandingConfigFactory
      );

      var connector = this.options?.context?._user?.connector;
      this.logoUrl = "/";

      if (connector) {
        let serverUrl = new Url(connector?.connection?.url ?? location.href);
        this.logoUrl = NodeLinks.getHomeUrl(serverUrl);
      }

      this.otcData = {
        logosrc: DEFAULT_LOGO_SRC,
        logourl: this.logoUrl,
        tooltipbrand: "",
        primarytext: "",
        secondarytext: "",
        versiontext: "",
      };
      this.updateData();

      this.listenTo(
        this.brandingConfigData,
        "change:branding",
        this.updateData
      );

      this.listenTo(this.options.context, "sync:perspective", this.updateData);

      // let's execute the defaul action which is taking care in the parent view (ie., LogoView)
      this.performClickAction = false;
    },

    onShow: function () {
      this.options?.otcEl?.addEventListener(
        "click",
        _.bind(this._onClick, this)
      );
    },

    _onClick: function (event) {
      // clicking on logo reset application scope to default.
      this.applicationScope.set("id", "");
    },

    updateData: function () {
      let fromCtx = this.options?.context?.previewBranding?.get(
        "brandingSettingCodes"
      );
      let fromData = this?.options?.context?.brandingConfigData?.get(
        "brandingSettingCodes"
      );

      let iconTheme = fromCtx?.iconThemes ?? fromData?.iconThemes ?? "default";
      let backgroundColor = fromCtx?.customBrandingBgColor ?? fromData?.customBrandingBgColor ?? "";
      let primaryText = fromCtx?.primaryText ?? fromData?.primaryText ?? "";
      let secondaryText =
        fromCtx?.secondaryText ?? fromData?.secondaryText ?? "";
      let versionText = fromCtx?.versionText ?? fromData?.versionText ?? "";

      let logoSrc =
        this?.options?.context?.previewBranding?.get("brandLogoUri") ??
        this?.options?.context?.brandingConfigData?.get("brandLogoUri");

      logoSrc = logoSrc?.length ? logoSrc : DEFAULT_LOGO_SRC;

      this.applicationScope =
        this.options?.applicationScope ??
        this.options.context.getModel(ApplicationScopeModelFactory);
      let logoUrl = !!this?.applicationScope?.id?.length ? this.logoUrl : "";
      let tooltipbrand = !!this?.applicationScope?.id?.length
        ? lang.LandingPageBackTo
        : "";

      this.otcData = {
        logosrc: logoSrc,
        logourl: logoUrl,
        tooltipbrand: tooltipbrand,
        primarytext: primaryText,
        secondarytext: secondaryText,
        versiontext: versionText,
        iconappearance: iconTheme,
        backgroundColor,
      };
      this.trigger("data:synced");
    },
  });

  return LogoView;
});


csui.define('csui/controls/app.header/app.header.controls/search.box/impl/nls/lang',{
    // Always load the root bundle for the default locale (en-us)
    "root": true,
    // Do not load English locale bundle provided by the root bundle
    "en-us": false,
    "en": false
  });

csui.define('csui/controls/app.header/app.header.controls/search.box/impl/nls/root/lang',{
  placeholder: 'Search',
  clearerTitle: 'Clear keywords',
  searchBoxTitle: 'Enter your search term',
  searchOptionsTitle: 'Show search options',
  searchOptionsHideTitle: 'Hide search options',
  searchFromHere: 'Search from here',
  searchIconTitle: 'Search',
  searchIconAria: 'Search in OpenText Content Management',
  searchOptionTooltip: 'Select: {0}',
  startSearch: 'Start search',
  searchLandmarkAria: 'Global content search',
  searchWithinLabel : 'Search within',
  showMore:'Show more',
  showMoreAria:'Show more slices',
  closeSearch: 'Close search',
  tooltipstartsearch: 'Start search',
  tooltipclearkeywords: 'Clear keywords',
  tooltipsearchbutton: 'Search',
  tooltipsearchbuttonopen: 'Close search',
  arialabelsearchbutton: 'Global search'
});




csui.define('css!csui/controls/app.header/app.header.controls/search.box/impl/search.box',[],function(){});

csui.define('csui/controls/app.header/app.header.controls/search.box/search.box.view',[
  "module",
  "csui/lib/underscore",
  "csui/lib/jquery",
  "csui/lib/marionette3",
  "csui/lib/backbone",
  "csui/models/node/node.model",
  "csui/utils/contexts/factories/search.query.factory",
  "csui/utils/contexts/factories/application.scope.factory",
  "csui/utils/contexts/factories/search.box.factory",
  "csui/utils/contexts/factories/next.node",
  "csui/utils/namedsessionstorage",
  "csui/widgets/search.forms/search.forms",
  "csui/utils/namedlocalstorage",
  "csui/utils/contexts/factories/branding.config.factory",
  "csui/utils/contexts/factories/search.formquery.factory",
  "i18n!csui/controls/app.header/app.header.controls/search.box/impl/nls/lang",
  "css!csui/controls/app.header/app.header.controls/search.box/impl/search.box",
], function (
  module,
  _,
  $,
  Marionette,
  Backbone,
  NodeModel,
  SearchQueryModelFactory,
  ApplicationScopeModelFactory,
  SearchBoxFactory,
  NextNodeModelFactory,
  NamedSessionStorage,
  SearchForms,
  NamedLocalStorage,
  BrandingConfigFactory,
  SearchFormQueryModelFactory,
  lang
) {
  var config = _.defaults({}, module.config() ?? {}, {
    enableSearchBarSettings: true,
  });

  let SearchBoxView = Marionette.View.extend({
    template: false,
    namedSessionStorage: new NamedSessionStorage(),
    namedLocalStorage: new NamedLocalStorage("search_bar_settings"),
    performClickAction: false, // TODO: analyse it more...

    constructor: function SearchBoxView(options = {}) {
      options.data = _.defaults({}, options.data ?? {}, config);
      Marionette.View.prototype.constructor.apply(this, arguments);
      var context = this.options.context;
      if (!this.options.model) {
        let modelFactory = context.getModel(SearchQueryModelFactory);
        this.options.model = modelFactory;
        this.model = modelFactory;
      }
      this.applicationScope = context.getModel(ApplicationScopeModelFactory);
      this.searchBoxFactory = context.getFactory(SearchBoxFactory);
      this.searchboxModel = this.searchBoxFactory.property;

      //TODO: move it to first time click on loop icon...
      this.searchForms = new SearchForms({
        options: this.options,
        connector: this.searchboxModel && this.searchboxModel.connector,
        originatingView: this,
      });

      this.brandingConfigData = this.options.context.getModel(
        BrandingConfigFactory
      );

      this.otcData = {
        query: "",
        showFromHere: false,
        isFetched: true,
      };

      this.deferred = $.Deferred();

      this.updateData();

      this.listenTo(
        this.brandingConfigData,
        "change:branding",
        this.updateData
      );

      this.listenTo(context, "sync:perspective", this._perspectiveSynced);
      this.listenTo(context, "change:current:node", this._currentNodeChanged);
      this.listenTo(this.searchboxModel, "change", this.setOTCData);
      this.listenTo(
        this.searchboxModel,
        "change",
        this.updateSearchBarSettings
      );

      this.nextmodel = this.options.context.getModel(NextNodeModelFactory);

      this.listenTo(this, "form:click", this._formClick);
      this.listenTo(this, "slice:click", this._sliceClick);
      this.listenToOnce(this, "fetch:data", this._dataSynced);
      this.listenTo(this, "perform:search", this.performSearch);
      this.listenTo(this, "more:forms:click", this._moreFormsCicked);
      this.stopListening(this.nextmodel, 'change:id').listenTo(this.nextmodel, 'change:id', this._changeLocation);
      this.options.otcEl.addEventListener('open', _.bind(this._onOpen, this));
      this.firstOpen = true;
    },

    _onOpen: function () {
      if (this.firstOpen) {
        this._updateInput();
        this.trigger('data:synced');
        this.firstOpen = false;
      }
    },

    onDestroy: function () {
      this.options.otcEl.removeEventListener('open', _.bind(this._onOpen, this));
    },

    performSearch: function (event, searchOption) {
      let value = event.detail.searchstring;
      if (!!value) {
        this._setSearchQuery(
          value,
          searchOption,
          event
        );
        this._updateInput();
        this.trigger("data:synced");
      }
    },

    _changeLocation: function () {
      this.trigger('collapse:search');
    },

    _updateInput: function () {
      var value = this.model.get('where') || '';
      this.otcData.query = value;
    },

    updateData: function () {
      let iconTheme =
        this.options?.context?.previewBranding?.get("brandingSettingCodes")
          ?.iconThemes ??
        this.brandingConfigData?.get("brandingSettingCodes")?.iconThemes ??
        "default";

      this.otcData = _.extend(this.otcData, {
        iconappearance: iconTheme,
        tooltipstartsearch: lang.tooltipstartsearch,
        tooltipclearkeywords: lang.tooltipclearkeywords,
        tooltipsearchbutton: lang.tooltipsearchbutton,
        tooltipsearchbuttonopen: lang.tooltipsearchbuttonopen,
        arialabelsearchbutton: lang.arialabelsearchbutton
      });

      this.trigger("data:synced");
    },

    updateSearchBarSettings: function () {
      this.search_bar_settings = this.searchboxModel.get("search_bar_settings");
      if (this.search_bar_settings && this.search_bar_settings.full_text) {
        this.namedLocalStorage.set(
          "full_text",
          this.search_bar_settings.full_text
        );
        if (!!this.model) {
          var full_text =
            this.search_bar_settings && this.search_bar_settings.full_text;
          this.model.set("modifier", full_text.modifier, { silent: true });
          this.model.set("lookfor", full_text.lookfor, { silent: true });
        }
      }
    },

    _formClick: function (event) {
      this.hideBackButton = true;
      this.searchForms.isModelFetched($(event.target).attr("formId"));
    },

    _moreFormsCicked: function (event) {
      this.hideBackButton = false;
      this.searchForms.isKeyPress =
        event.keyCode === 13 || event.keyCode === 32;
      this.searchForms.openFormInSidepanel(
        this.searchboxModel.get("search_forms")
      );
    },

    _sliceClick: function (event) {
      if ($(event.target).attr("checked")) {
        let sliceID = $(event.target).attr("sliceId");
        let sliceTxt = "{" + sliceID + "}";
        this.namedLocalStorage.set("selectedSlice", sliceTxt);
      } else {
        this.namedLocalStorage.remove("selectedSlice");
      }
    },

    _perspectiveSynced: function (context, perspectiveSource) {
      this._currentNodeChanged(perspectiveSource);
    },

    _currentNodeChanged: function (currentNode) {
      if (
        currentNode instanceof NodeModel &&
        (currentNode.get("container") || currentNode.get("type") === 5574)
      ) {
        this.searchboxModel.nodeId = currentNode.get("id");
        this.searchboxModel.nodeName = currentNode.get("name");
        this.namedSessionStorage.set(
          this.searchboxModel.nodeId,
          this.searchboxModel.nodeName
        );
        this.searchboxModel.trigger("change");
      } else {
        this.searchboxModel.nodeId = undefined;
        this.searchboxModel.nodeName = undefined;
        this.searchboxModel.trigger("change");
      }
    },

    _getSliceString: function() {
      let sliceString = "";
      if (this?.namedLocalStorage?.get("selectedSlice")) {
        sliceString = this?.namedLocalStorage?.get("selectedSlice");
      }
      return sliceString;
    },

    _setSearchQuery: function (value, searchOption, event) {
      let sliceString = this._getSliceString();
      this.model.clear({ silent: true });
      this.options.context
        .getModel(SearchFormQueryModelFactory)
        .clear({ silent: true });
      var params = {};
      if (!!sliceString) {
        params["slice"] = sliceString;
      }
      if (!!searchOption) {
        params["location_id1"] = searchOption;
      }
      if (value) {
        params["where"] = value;
      }
      //update search_bar_settings
      var full_text =
        this.search_bar_settings && this.search_bar_settings.full_text;
      if (full_text && (full_text.modifier || full_text.lookfor)) {
        params["modifier"] = full_text.modifier;
        params["lookfor"] = full_text.lookfor;
      }
      this.model.set(params);
    },

    _dataSynced: function (context, perspectiveSource) {
      var self = this;
      if (this.searchboxModel) {
        if (
          (this.options.data && this.options.data.alwaysFetchDropdown) ||
          !(this.searchboxModel && this.searchboxModel.fetched)
        ) {
          this.searchBoxFactory.fetch().then(
            () => {
              self.deferred.resolve();
            },
            () => {
              self.deferred.reject();
            }
          );
        }
      }

      self.deferred.promise().then(
        () => {
          self.otcData.isFetched = true;
        },
        () => {
          self.otcData.isFetched = false;
          self.trigger("data:synced");
        }
      );
    },

    setOTCData: function (e) {
      if (this.otcData.isFetched) {
        if (!this.searchboxModel.nodeId) {
          var currentNode =
            _.has(this.options, "context") &&
            this.options.context.getModel(NextNodeModelFactory);
          if (
            currentNode &&
            currentNode instanceof NodeModel &&
            (currentNode.get("container") || currentNode.get("type") === 5574)
          ) {
            this.searchboxModel.nodeId = currentNode.get("id");
            this.searchboxModel.nodeName = currentNode.get("name");
            this.namedSessionStorage.set(
              this.searchboxModel.nodeId,
              this.searchboxModel.nodeName
            );
          }
        }
        if (!this.searchboxModel.nodeId && this.model.get("location_id1")) {
          this.searchboxModel.nodeId = this.model.get("location_id1");
          if (!!this.namedSessionStorage.get(this.searchboxModel.nodeId)) {
            this.searchboxModel.nodeName = this.namedSessionStorage.get(
              this.searchboxModel.nodeId
            );
          }
        }
        this.searchOptions = {};
        if (this.searchboxModel.nodeId) {
          this.searchOptions.nodeId = this.searchboxModel.nodeId;
          if (!this.searchboxModel.nodeName && this.options.data.nodeName) {
            this.searchboxModel.nodeName = this.options.data.nodeName;
          }
          if (this.searchboxModel.nodeName) {
            this.searchOptions.nodeName = this.searchboxModel.nodeName;
          }
        }
        if (!!this.searchboxModel.get("slices")) {
          this.searchOptions = _.extend(
            this.searchOptions,
            this.searchboxModel.attributes
          );
        }

        this.otcData.slices = this.searchOptions?.slices;

        if (this.searchOptions?.nodeName) {
          this.otcData.location = {
            locationId: this.searchOptions?.nodeId,
            locationName: this.searchOptions?.nodeName,
          };
        } else {
          this.otcData.location = undefined;
        }

        this.otcData.forms =
          this.searchOptions?.search_forms?.recent_search_forms ?? [];

        if (this.namedLocalStorage.get("selectedSlice")) {
          let selectedSlice = this.namedLocalStorage.get("selectedSlice");
          selectedSliceID = selectedSlice.substring(
            1,
            selectedSlice.length - 1
          );
          this.otcData.selectedSlice = selectedSliceID;
        }

        this.trigger("data:synced");
      }
    },

    onRender: function () {},
  });

  return SearchBoxView;
});


csui.define('csui/controls/app.header/app.header.controls/progresspanel/progressbar.maximize.view',[
  "csui/lib/jquery",
  "csui/lib/underscore",
  "csui/lib/marionette3",
  "csui/utils/contexts/factories/branding.config.factory",
], function ($, _, Marionette, BrandingConfigFactory) {
  "use strict";

  let ProgressPanelView = Marionette.View.extend({
    template: false,

    constructor: function ProgressPanelView(options = {}) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.from = 0;
      this.to = 0;
      this.listenTo(this, "get:progress", this._setProgress);
      this.listenTo(this, "processbar:minimize", this._minimizeProgressbar);
      this.otcData = {
        slot: 'unknown',
        state: "default",
      };

      this.progressValues = {
        from: 0,
        to: 1,
      };

      this.brandingConfigData = this.options.context.getModel(
        BrandingConfigFactory
      );

      this.updateData();

      this.listenTo(
        this.brandingConfigData,
        "change:branding",
        this.updateData
      );
    },

    updateData: function () {
      let iconTheme =
        this.options?.context?.previewBranding?.get("brandingSettingCodes")
          ?.iconThemes ??
        this.brandingConfigData?.get("brandingSettingCodes")?.iconThemes ??
        "default";

      this.otcData = _.extend(this.otcData, {
        iconappearance: iconTheme,
      });
      this.trigger("data:synced");
      this.trigger("update:progress:values", this.progressValues);
    },

    onShow: function () {
      this.options.otcEl.addEventListener(
        "click",
        _.bind(this._maximizeProgressbar, this)
      );

      this.options.otcEl.addEventListener(
        "keydown",
        _.bind(this._maximizeProgressbar, this)
      );
    },

    _setProgress: function (percentage, state) {
      if (state === "rejected") {
        this.otcData.state = "error";
        this._progressComplete();
      } else if (state === "resolved") {
        this.otcData.state = "finished";
        this.progressValues.to = 100;
        this._progressComplete();
      } else if (percentage !== this.progressValues.to) {
        this.progressValues.from = this.progressValues.to;
        this.progressValues.to = percentage;
        if (percentage === 100) {
          this.otcData.state = "finished";
          this._progressComplete();
        } else {
          this.otcData.state = "default";
          this.trigger("update:progress:values", this.progressValues);
        }
      }
    },

    _minimizeProgressbar: function () {
      this.otcData.slot = "beforeOverflow";
      this.trigger("data:synced");
      this.trigger("update:progress:values", this.progressValues);
    },

    _progressComplete: function () {
      this.trigger("data:synced");
      this.trigger("update:progress:values", this.progressValues);
      setTimeout(() => {
        this.otcData.slot = "unknown";
        this.otcData.state = "default";
        this.trigger("data:synced");
        this.progressValues.from = 0;
        this.progressValues.to = 1;
        this.trigger("update:progress:values", this.progressValues);
        this.trigger("processbar:maximize");
      }, 1000);
    },

    _maximizeProgressbar: function (event) {
      if (
        event.type === "click" ||
        event.keyCode === 13 ||
        event.keyCode === 32
      ) {
        this.otcData.slot = "unknown";
        this.trigger("data:synced");
        this.trigger("processbar:maximize");
      }
    },
  });

  return ProgressPanelView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/app.header/app.header.controls/favorites/impl/favorites',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"csui-favorites-view-container\"></div>";
}});
Handlebars.registerPartial('csui_controls_app.header_app.header.controls_favorites_impl_favorites', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/app.header/app.header.controls/favorites/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/controls/app.header/app.header.controls/favorites/impl/nls/root/localized.strings',{
  FavoritesIconTitle: 'Favorites',
  FavoritesTitleAria: 'OpenText Content Management Favorites'
});




csui.define('css!csui/controls/app.header/app.header.controls/favorites/impl/favorites',[],function(){});

csui.define('csui/controls/app.header/app.header.controls/favorites/favorites.view',[
  "csui/lib/jquery",
  "csui/lib/underscore",
  "csui/utils/contexts/factories/branding.config.factory",
  "csui/widgets/navigation.header/controls/favorites/favorites.view",
  "hbs!csui/controls/app.header/app.header.controls/favorites/impl/favorites",
  'i18n!csui/controls/app.header/app.header.controls/favorites/impl/nls/localized.strings',
  "css!csui/controls/app.header/app.header.controls/favorites/impl/favorites",
], function ($, _, BrandingConfigFactory, CSUIFavoritesView, favTemplate, localizedStrings) {
  "use strict";

  var FavoritesButtonView = CSUIFavoritesView.extend({
    template: favTemplate,

    constructor: function FavoritesButtonView(options) {
      CSUIFavoritesView.call(this, options);

      this.brandingConfigData = this.options.context.getModel(
        BrandingConfigFactory,
      );

      this.otcData = {
        icon: "csui_header:csui_li_header_fav42",
        className: 'csui-favorites',
        arialabel: localizedStrings.FavoritesTitleAria,
        title: localizedStrings.FavoritesIconTitle,
        overflowValue: localizedStrings.FavoritesIconTitle
      };
      this.updateData();
      this.listenTo(
        this.brandingConfigData,
        "change:branding",
        this.updateData,
      );
    },

    updateData: function () {
      let iconTheme =
        this.options?.context?.previewBranding?.get("brandingSettingCodes")
          ?.iconThemes ??
        this.brandingConfigData?.get("brandingSettingCodes")?.iconThemes ??
        "default";

      this.otcData = _.extend(this.otcData, {
        iconappearance: iconTheme,
      });
      this.trigger("data:synced");
    },

    onRender: function () {
      $(this.ui.favoritesViewContainer)[0].classList.add('binf-hidden');
      $(this?.options?.otcEl)
        .unbind("click")
        .bind("click", _.bind(this.onClickFavoritesIcon, this));
      $(this?.options?.otcEl)
        .unbind("blur")
        .bind("blur", _.bind(this.onBlurButton, this));

      $(this?.options?.otcEl).on('mouseenter', _.bind(this._mouseEnterButton, this));

      $(this?.options?.otcEl).on('mouseleave', _.bind(this._mouseLeaveButton, this));

      let overflowButton = $(this?.options?.otcEl).closest('otc-overflow-container');

      overflowButton[0].addEventListener('blur', _.bind(this._onBlurOverflowButton, this));
    },

    _onBlurOverflowButton: function () {
      this._hideFavoritesView();
    },

    _mouseEnterButton: function () {
      this.favoritesViewInFocus = true;
    },

    _mouseLeaveButton: function () {
      this.favoritesViewInFocus = false;
    },

    documentClick: function (event) {
      if (!$(event.target).parents('.csui-favorites-view-container').length &&
          !$(event.target).parents('.csui-favorites-icon-container').length &&
          (event.target !== this?.el)) {
            this._hideFavoritesView();
         }
    },

    _showFavoritesView: function () {
      this.ui.favoritesViewContainer.removeClass('binf-hidden');
      this.ui.favoritesButtonContainer.attr('aria-expanded', 'true');
      this.$el.addClass('showing-favorites-view');
      this.favoritesViewContainerRegion.show(this.favoritesView);
      this.favoritesViewContainerRegion.el.classList.remove("binf-hidden");
      $(document).off('click.' + this.cid).on('click.' + this.cid,
          _.bind(this.documentClick, this));
      this?.options?.otcEl?.setAttribute("menuopen", "");
    },

    _hideFavoritesView: function () {
      $(document).off('click.' + this.cid);
      if (this.favoritesView && this.favoritesView.isSearchOpen()) {
        this.favoritesView.searchClicked(event); // reset search to default
      }
      this.favoritesViewInFocus = false;
      this.ui.favoritesViewContainer.addClass('binf-hidden');
      this.ui.favoritesButtonContainer.attr('aria-expanded', 'false');
      this.$el.removeClass('showing-favorites-view');
      this?.options?.otcEl?.removeAttribute("menuopen");
    },

    onClickFavoritesIcon: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.options && this.options.parentView && 
      this.options.parentView.trigger("header:control:clicked");
      var toggleDropdown = $('.binf-open>.binf-dropdown-toggle');
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown('toggle');
      }
      this._ensureFavoritesView();
      this._toggleFavoritesView();
      this._focusOnFavoriteSearch(event);
    },

    _focusOnNextElement: function () {
      let appHeader = document.getElementsByTagName('otc-header-bar');
      var appHeaderButtons = appHeader[0].querySelectorAll('otc-toolbaritem');
      let overflowContainer = appHeader[0].querySelector('otc-overflow-container');
      let nextToFavButton = appHeaderButtons[0].nextSibling;
      (nextToFavButton?.getAttribute('slot') !== 'otc-overflow-slot') ? nextToFavButton.focus() : overflowContainer.focus();
    },

    onKeyInView: function (event) {
      let appHeader = document.getElementsByTagName('otc-header-bar');
      var appHeaderButtons = appHeader[0].querySelectorAll('otc-toolbaritem');
      let afterOverflowEle = appHeader[0].querySelectorAll("[slot='afterOverflow']");
      switch (event.keyCode) {
      case 9:  // tab
        var favoritesButtonInFocus = $(this?.options?.otcEl).is(':focus');
        if (favoritesButtonInFocus && event.shiftKey !== true &&
            !this.ui.favoritesViewContainer.hasClass('binf-hidden')) {
          // move to the favorites list
          this._focusOnFavoriteSearch(event);
        } else if (!favoritesButtonInFocus && event.shiftKey) {
          // move to the favorites button
          event.preventDefault();
          event.stopPropagation();
          (this?.options?.otcEl?.getAttribute('slot') !== 'otc-overflow-slot')? this._focusOnFavoriteButton() : this._focusOnOverflowButton();
        } else if (!$(event.target).closest('.tile-header').length && !!this.favoritesViewInFocus){
          this._hideFavoritesView();
          (this?.options?.otcEl?.getAttribute('slot') !== 'otc-overflow-slot')? this._focusOnNextElement() : afterOverflowEle[0].focus();
          event.preventDefault();
        }
        break;
      case 13:  // enter
      case 32:  // space
        if (this?.options?.otcEl?.getAttribute('slot') === '') {
          if (!$(event.target).closest('.tile-header').length) {
            this.triggerMethod('click:favorites:icon', event);
            if (!this.ui.favoritesViewContainer.hasClass('binf-hidden')) {
              this._focusOnFavoriteSearch(event);
            }
          }
        }

        else {
          if (!$(event.target).closest('.tile-header').length) {
            this.onClickFavoritesIcon(event);
            if (!this.ui.favoritesViewContainer.hasClass('binf-hidden')) {
              this._focusOnFavoriteSearch(event);
            }
          }
        }
        break;
      case 40:  // arrow down
        if (this?.options?.otcEl?.getAttribute('slot') === '') {
          if (!this.favoritesView || this.ui.favoritesViewContainer.hasClass('binf-hidden')) {
            this.triggerMethod('click:favorites:icon', event);
            this._focusOnFavoriteSearch(event);
          } else if (this.favoritesViewInFocus !== true) {
            this._focusOnFavoriteSearch(event);
          }
        }
        break;
      case 27:  // escape
        (this?.options?.otcEl?.getAttribute('slot') !== 'otc-overflow-slot')? this._focusOnFavoriteButton() : this._focusOnOverflowButton();
        this._hideFavoritesView();
        break;
      }
    },

    _focusOnFavoriteButton: function () {
      this.options?.otcEl?.focus();
      this.favoritesViewInFocus = false;
    },

    _focusOnOverflowButton: function () {
      this.options?.otcEl?.closest('otc-overflow-container')?.focus();
      this.favoritesViewInFocus = false;
    },

    onBlurButton: function () {
      if (this.favoritesViewInFocus !== true &&
          document.activeElement !== this?.options?.otcEl) {
        this._hideFavoritesView();
      }
    },
  });

  return FavoritesButtonView;
});


csui.define('csui/controls/app.header/app.header.controls/help/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/controls/app.header/app.header.controls/help/impl/nls/root/localized.strings',{
  HelpIconTitle: 'Help',
  HelpIconAria: 'Help pages, opens in new window'
});




csui.define('csui/controls/app.header/app.header.controls/help/help.view',[
  "csui/lib/underscore",
  'csui/lib/jquery',
  "csui/widgets/navigation.header/controls/help/help.view",
  "csui/utils/contexts/factories/branding.config.factory",
  "i18n!csui/controls/app.header/app.header.controls/help/impl/nls/localized.strings",
], function (_, $, HelpView, BrandingConfigFactory, localizedStrings) {
  "use strict";

  var HelpViewV2 = HelpView.extend({
    template: false,

    constructor: function HelpViewV2(options) {
      HelpView.call(this, options);
      this.brandingConfigData = this.options.context.getModel(
        BrandingConfigFactory,
      );

      this.otcData = {
        icon: "csui_header:csui_li_header_help42",
        title: localizedStrings.HelpIconTitle,
        arialabel: localizedStrings.HelpIconAria,
        overflowValue: localizedStrings.HelpIconTitle
      };
      this.updateData();
      this.listenTo(
        this.brandingConfigData,
        "change:branding",
        this.updateData,
      );
    },

    onShow: function () {
      var self = this;
      this.el.setAttribute("tabindex", -1);

      this.options?.otcEl?.addEventListener(
        "click",
        _.bind(this._onClick, this),
      );

      $(this.options.otcEl).on('keydown', function (event) {
        if (event.keyCode === 32 || event.keyCode === 13) {
          event.preventDefault();
          self.triggerMethod('click:help');
        }
      });
    },

    updateData: function () {
      let iconTheme =
        this.options?.context?.previewBranding?.get("brandingSettingCodes")
          ?.iconThemes ??
        this.brandingConfigData?.get("brandingSettingCodes")?.iconThemes ??
        "default";

      this.otcData = _.extend(this.otcData, {
        iconappearance: iconTheme,
      });
      this.trigger("data:synced");
    },
  });

  return HelpViewV2;
});


csui.define('css!csui/controls/app.header/app.header.controls/user.profile/impl/user.profile',[],function(){});

csui.define('csui/controls/app.header/app.header.controls/user.profile/user.profile.view',[
  "module",
  "csui/lib/underscore",
  "csui/lib/jquery",
  "csui/lib/marionette",
  "csui/utils/url",
  "csui/utils/log",
  "csui/utils/base",
  "csui/utils/commands",
  "csui/utils/contexts/factories/member",
  "csui/utils/contexts/factories/user",
  'csui/utils/contexts/factories/recycle.bin',
  "csui/controls/toolbar/toolitems.filtered.model",
  "csui/widgets/navigation.header/profile.menuitems",
  "csui/widgets/navigation.header/profile.menuitems.mask",
  "csui/controls/globalmessage/globalmessage",
  "csui-ext!csui/widgets/navigation.header/controls/user.profile/user.profile.view",
  "i18n!csui/pages/start/impl/nls/lang",
  "css!csui/controls/app.header/app.header.controls/user.profile/impl/user.profile",
  "csui/lib/jquery.binary.ajax",
], function (
  module,
  _,
  $,
  Marionette,
  Url,
  log,
  base,
  commands,
  MemberModelFactory,
  UserModelFactory,
  RecycleBinVolumeFactory,
  FilteredToolItemsCollection,
  menuItems,
  MenuItemsMask,
  GlobalMessage,
  menuHandlers,
  lang,
) {
  "use strict";
  var config =
    window.csui.requirejs.s.contexts._.config.config[
      "csui/utils/contexts/factories/user"
    ] || {};
  log = log(module.id);

  var ProfileView = Marionette.ItemView.extend({
    template: false,
    serializeData: function () {
      return {
        items: this.collection.toJSON(),
      };
    },

    constructor: function ProfileView(options) {
      options || (options = {});

      Marionette.ItemView.prototype.constructor.call(this, options);

      this.model = this.options.context.getModel(MemberModelFactory);
      this.userModel = this.options.context.getModel(UserModelFactory);
      this.options.context.getModel(RecycleBinVolumeFactory, {permanent: true,  detached: true}).ensureFetched();
      this.connector = this.options.connector = this.model.connector ?? this.userModel.connector ?? this.options.connector;
      this._ensureModels(true);
      this.otcData = {
        initials: this.model?.attributes?.initials ?? '',
        interactive: "",
        image: "",
        arialabel: lang.profileMenuTitle,
        title: lang.profileMenuTitle,
        collection: this.collection,
      };

      this.model.ensureFetched().then(_.bind(function() {
        this._setUserData();
        this._getUserGroups();
      }, this));

      this.listenTo(this.model, "change", this._setUserData)
        .listenTo(this.userModel, "change", this._setUserMeberData)
        .listenTo(options.context, "sync error", this._refreshActions)
        .listenTo(this, "destroy", this._releasePhotoUrl)
        .listenTo(
          this,
          "childview:toolitem:action",
          this._triggerMenuItemAction,
        );

      this.listenTo(
        this,
        "execute:action",
        _.bind(function (toolItemModel) {
          this._executeAction(toolItemModel);
        }, this),
      );

      this.listenTo(
        this,
        "set:focus",
        _.bind(function () {
          this.options?.otcEl?.focus();
        }, this),
      );
    },

    _executeAction: function (toolItem) {
      var signature = toolItem.get("signature"),
        command = commands.findWhere({ signature: signature }),
        context = this.options.context,
        status = {
          context: context,
          toolItem: toolItem,
          originatingView: this,
          data: toolItem.get("commandData"),
        },
        self = this;
      try {
        // If the command was not found and the toolitem is executable, it is
        // a developer's mistake.
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        }

        command
          .execute(status)
          .done(function (item) {
            // TODO: Add success reporting; do not build the sentence
            // from separate verbs and subjects; the command has to
            // return the full sentence
          })
          .fail(function (error) {
            if (error) {
              error = new base.Error(error);
              GlobalMessage.showMessage(
                "error",
                error.message,
                error.errorDetails,
              );
            }
          })
          .always(function () {});
      } catch (error) {
        log.warn(
          'Executing the command "{0}" failed.\n{1}',
          command.get("signature"),
          error.stack,
        ) && console.warn(log.last);
      }
    },

    _getUserGroups: function () {
      let groupsUrl = this._getGroupsUrl();
      if (groupsUrl) {
        this.options.connector
          .makeAjaxCall({
            type: "GET",
            url: groupsUrl,
          })
          .always(
            _.bind(function (response, statusText, jqxhr) {
              if (jqxhr && jqxhr.status === 200) {
                let groups = response.results;
                this.options.context._groups = groups;
                let businessAdministrator = false;
                _.each(groups, function (group) {
                  businessAdministrator = !businessAdministrator
                    ? group?.data?.properties?.name?.indexOf(
                        "Business Administrators",
                      ) > -1
                    : businessAdministrator;
                });
                if (businessAdministrator && config?.initialResponse?.data) {
                  config.initialResponse.data.businessAdministrator =
                    businessAdministrator;
                  //update the config and reload the models from user porfile popup if User is business administrator
                  this._ensureModels(this.options);
                }
              }
            }, this),
          );
      }
    },

    _ensureModels: function (useBlank = false) {
      this.staticMenuItems = menuItems.profileMenu.collection.toJSON();

      this.collection = useBlank ? new FilteredToolItemsCollection([]) : new FilteredToolItemsCollection(menuItems.profileMenu, {
        status: { context: this.options.context },
        commands: commands,
        mask: new MenuItemsMask(),
      });
    },

    _getGroupsUrl: function () {
      let user = this.model;
      if (user) {
        let fullUrl = Url.combine(
          this.connector.getConnectionUrl().getApiBase("v2"),
          "members/memberof",
        );
        return fullUrl;
      }
    },

    _refreshActions: function () {
      // Properties is being destroyed on changing the context node. Both destroyer
      // and a sub-view refreshed are listening on node changes. Although listening
      // is stopped during the destruction, already registered handlers will be
      // triggered nevertheless.
      if (this._isRendered && !this.isDestroyed) {
        if (menuHandlers) {
          var options = this.options,
            promises = _.chain(menuHandlers)
              .flatten(true)
              .map(function (menuHandler) {
                return menuHandler(options);
              })
              .value(),
            self = this;
          $.whenAll.apply($, promises).always(function (dynamicMenuItems) {
            var mask = new MenuItemsMask();
            self.staticMenuItems = menuItems.profileMenu.collection.toJSON();
            dynamicMenuItems = _.chain(dynamicMenuItems)
              .flatten()
              .pluck("profileMenu")
              .flatten()
              .value();
            //insert dynamic menu items at end of it's group
            _.each(dynamicMenuItems, function (menuItem) {
              if (!!menuItem && !!self.staticMenuItems) {
                var found = false;
                for (var i = 0; i < self.staticMenuItems.length; i++) {
                  if (self.staticMenuItems[i].group === menuItem.group) {
                    found = true;
                  } else if (found) {
                    self.staticMenuItems.splice(i + 1, 0, menuItem);
                    break;
                  }
                }
                if (!found) {
                  self.staticMenuItems.splice(
                    self.staticMenuItems.length - 1,
                    0,
                    menuItem,
                  );
                }
              }
            });

            dynamicMenuItems = self.staticMenuItems.concat([]);
            dynamicMenuItems = mask.maskItems(dynamicMenuItems);
            menuItems.profileMenu.reset(dynamicMenuItems);

            self.collection = new FilteredToolItemsCollection(
              menuItems.profileMenu,
              {
                status: { context: self.options.context },
                commands: commands,
                mask: new MenuItemsMask(),
              },
            );

            self.otcData.collection = self.collection;
            self._setOtcData();
          });
        } else {
          this.collection.refilter();
        }
      }
    },

    _setUserMeberData: function() {
      this.model.attributes = _.extend(this.model.attributes, this.userModel.attributes);
      this._setUserData();
    },

    //_displayProfileImage: function () {
    _setUserData: function () {
      var photoUrl = this._getUserPhotoUrl();
      if (photoUrl) {
        var getPhotoOptions = {
          url: photoUrl,
          dataType: "binary",
        };
        this.connector.makeAjaxCall(getPhotoOptions).always(
          _.bind(function (response, statusText, jqxhr) {
            // during execution of this ajax call, by the time, if the actual view got destroyed
            // then let's not execute the remaining functionality.
            if (!this.isDestroyed) {
              if (jqxhr.status === 200) {
                this._setPersonalizedImage(response);
              } else {
                this.otcData.image = "";
                this._setOtcData();
              }
            }
          }, this),
        );
      } else {
        this.otcData.image = "";
        this._setOtcData();
      }
    },

    _getUserPhotoUrl: function () {
      var connection = this.connector.connection,
        cgiUrl = new Url(connection.url).getCgiScript(),
        photoPath = this.model.get("photo_url");
      // If the URL does not contain the cache-busting parameter derived from
      // the picture's latest change, there was a problem retrieving it.  It
      // does not make sense to try it once more from the client side, waste
      // time and server resources and litter the log by 404 errors.
      if (photoPath && photoPath.indexOf("?") > 0) {
        return Url.combine(cgiUrl, photoPath);
      }
    },

    _setPersonalizedImage: function (imageContent) {
      this._releasePhotoUrl();
      this._photoUrl = URL.createObjectURL(imageContent);
      //let blob = new Blob(this._photoUrl);
      let blob = imageContent;
      // The full Blob Object can be seen
      // in the Console of the Browser

      var reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = _.bind(function () {
        var base64String = reader.result;

        this.otcData.image = base64String;

        this._setOtcData();
      }, this);
    },

    _setOtcData: function () {
      this.otcData = _.extend(this.otcData, {
        image: this.otcData.image ?? "",
        initials: this.model.attributes.initials,
        arialabel: _.str.sformat(lang.profileMenuAria, this.model.get('initials'), this.model.get('display_name')),
        collection: this.collection,
      });
      this.trigger("data:synced");
    },

    _releasePhotoUrl: function () {
      if (this._photoUrl) {
        URL.revokeObjectURL(this._photoUrl);
        this._photoUrl = undefined;
      }
    },
  });

  return ProfileView;
});


csui.define('csui/themes/carbonfiber/ot-icons/icons_csui_header',[], function () {
if (typeof otIconsRepository === 'undefined') {
  window.otIconsRepository = {};
}
window.otIconsRepository['csui_header'] = {
'csui_li_header_fav42': { category: 'header', svg: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 42 42" xml:space="preserve" class="ot-svg ot-svg--header"> <circle class="ot-state" fill="none" stroke="none" cx="21" cy="21" r="20.0" /><style type="text/css"> .st0--header-li_header_fav42{fill:#333333;} </style> <path class="st0--header-li_header_fav42 ot-metaphor" d="M21.475,12.142l2.561,5.188c0.077,0.156,0.226,0.265,0.399,0.29l5.726,0.832  c0.435,0.063,0.608,0.598,0.294,0.904l-4.143,4.039c-0.125,0.122-0.182,0.297-0.152,0.469l0.978,5.703  c0.074,0.433-0.38,0.763-0.769,0.559l-5.121-2.692c-0.154-0.081-0.339-0.081-0.493,0l-5.121,2.692  c-0.389,0.204-0.843-0.126-0.769-0.559l0.978-5.703c0.029-0.172-0.028-0.347-0.152-0.469l-4.143-4.039  c-0.315-0.307-0.141-0.841,0.294-0.904l5.726-0.832c0.173-0.025,0.322-0.134,0.399-0.29l2.561-5.188  C20.719,11.748,21.281,11.748,21.475,12.142z" /> <circle class="ot-focus" fill="none" stroke="none" cx="21" cy="21" r="20.5" /></svg>'},
'csui_li_header_help42': { category: 'header', svg: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 42 42" xml:space="preserve" class="ot-svg ot-svg--header"> <circle class="ot-state" fill="none" stroke="none" cx="21" cy="21" r="20.0" /><style type="text/css"> .st0--header-li_header_help42{fill:#333333;} </style> <path class="st0--header-li_header_help42 ot-metaphor" d="M22.15,18.903c1.5-1,2.8-1.9,2.8-3.6c0-1.6-1.3-3.1-3.9-3.1  c-1.669-0.079-3.211,0.599-4.377,1.734c-0.497,0.485-1.311,0.421-1.774-0.096l0,0c-0.442-0.494-0.436-1.258,0.037-1.723  c1.686-1.657,4.013-2.6,6.414-2.515c4,0,6.5,2.3,6.5,5.1s-1.9,4.1-3.7,5.3c-1.4,1-2.7,1.8-2.7,3.3c0,0.229,0.058,0.458,0.158,0.675  c0.261,0.57,0.04,1.24-0.531,1.498l0,0c-0.457,0.206-1.015,0.094-1.312-0.31c-0.451-0.611-0.714-1.337-0.714-2.063  C19.05,21.003,20.65,20.003,22.15,18.903z M20.95,28.803c1,0,1.8,0.8,1.8,1.8s-0.8,1.8-1.8,1.8s-1.8-0.8-1.8-1.8  S19.95,28.803,20.95,28.803C20.95,28.703,20.95,28.703,20.95,28.803z" /> <circle class="ot-focus" fill="none" stroke="none" cx="21" cy="21" r="20.5" /></svg>'},
'csui_li_header_search42': { category: 'header', svg: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 42 42" xml:space="preserve" class="ot-svg ot-svg--header"> <circle class="ot-state" fill="none" stroke="none" cx="21" cy="21" r="20.0" /><style type="text/css"> .st0--header-li_header_search42{fill:#333333;} </style> <path class="st0--header-li_header_search42 ot-metaphor" d="M30.71,29.29l-5.04-5.04c1.08-1.4,1.73-3.15,1.73-5.05c0-4.52-3.68-8.2-8.2-8.2S11,14.68,11,19.2  s3.68,8.2,8.2,8.2c1.9,0,3.65-0.65,5.05-1.73l5.04,5.04C29.49,30.9,29.74,31,30,31s0.51-0.1,0.71-0.29  C31.1,30.32,31.1,29.68,30.71,29.29z M19.2,25.4c-3.42,0-6.2-2.78-6.2-6.2s2.78-6.2,6.2-6.2s6.2,2.78,6.2,6.2  C25.4,22.62,22.62,25.4,19.2,25.4z" /> <circle class="ot-focus" fill="none" stroke="none" cx="21" cy="21" r="20.5" /></svg>'},
'csui_li_header_searchOpen42': { category: 'header', svg: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 42 42" xml:space="preserve" class="ot-svg ot-svg--header"> <circle class="ot-state" fill="none" stroke="none" cx="21" cy="21" r="20.0" /><style type="text/css"> .st0--header-li_header_searchOpen42{fill:#333333;} </style> <path class="st0--header-li_header_searchOpen42 ot-metaphor" d="M17,29.5c-0.3,0-0.5-0.1-0.7-0.3c-0.4-0.4-0.4-1,0-1.4l6.8-6.8l-6.8-6.8c-0.4-0.4-0.4-1,0-1.4  s1-0.4,1.4,0L26,21l-8.2,8.2C17.6,29.4,17.3,29.5,17,29.5z" /> <circle class="ot-focus" fill="none" stroke="none" cx="21" cy="21" r="20.5" /></svg>'},
'csui_li_header_user42': { category: 'header', svg: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 42 42" xml:space="preserve" class="ot-svg ot-svg--header"> <defs> <clipPath id="circleView"> <circle cx="21" cy="21" r="21" fill="#FFFFFF" /> </clipPath> </defs> <image x="0" y="0" width="42" height="42" clip-path="url(#circleView)" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAYAAADFw8lbAAAAAXNSR0IArs4c6QAAAIRlWElmTU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABIAAAAAQAAAEgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAACqgAwAEAAAAAQAAACoAAAAAJyDICAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAVlpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDYuMC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KGV7hBwAABvVJREFUWAndWWlMVFcU/t6bGbZWBZGgKFiNotVWRAvV1CpqKg7FLXFBSJtqiP2h1FGjadOYoL8MoqDWpj8a11ZbtdJSNjfUWI0WrdaqaN1lEREB2Zlh3uu5M/PKm+XNvBlMf/Qkh3fvPcv95t5zz13g0FPSZ/QGx08mjoIgRoAjBh9G31qIXDVEsRo8nqDVeBZnvm7xtTvOJ8PZK8PRhbkAN5/spxLzxCZikVhLrCE2E3cRsz78iE0kLSWVnwDhZxTveE5tqsk7oHMNwTDiC/K+ipjZMoCM1ZJAiuzHmOnvZvpkEeAmNcbqgCZkahHU+Bk5zCQOJGaj5pIC/LSI7BeCiroGdBjZgCoSE7bSz12PuOCdyMxkP0KRPANlo2jijlCsJZAXNqV2pNXw+Hh6HGbFj8bowf0xtH8oNDwPsyDg/tMXuPmkBvkXb2B/6WVLm52xtSJQPJdA45+C/KxmF3JLk3ugSaujKZ6KSTOSWOfoZPa7byE7fTaGR4Q5ipzqdyprsebbX1BYdstJRg0svh+C4/QozHngSkEZqD5jFDjNRTJyOdXLZk7ENysWkG9lF44dCqKI9G0/YPeJ3x1FrM5CoQW8EI+C7XcdFZym0qIwb3kozNpzVO5L7BSPaVPHY5chxSuQzC/7UWwWyiueWUKCtcmILUotpbRkDJ6yFw/Od8pkLlbs+GU6dOqOktIAi6Fcm8p+Wg02fZLsNUjJDQO7aUkyWGy7IDYoUfDrPIwFC+wG0Vk7POhLUn6P2CkmmePFU8ZhUL9gVvSZhoSHYuH7Y5XsWb/T0DporVzBHmiigY3i58R2v0ZuED9isLzqczlueJQ7W+pfXI9Za/pJSvZANdhIAvs2SdP2jR7oeYU7mLisqvCjo3y2XjLuBmVJRVhKApdTLhmwPPkqaOiAfwdLyR3hEJdjpuENptANVBTTqO52K2EGIqWYV0Fms9uNSOpCAM+lsEo3UE5YSHV2eHBLTW12WcOtrjvhy7Z2d2JJRqNqwWUDOmvFEMpyIyWpu29dk88nNTu3dU2tdnXlChcLWuTWERV0elI0KSt3S3oHBXRXelDqFajaTxcNp9429cJQ6lNV8EWG9SyHSr8tUn0uNtPuMsQKVOToVO5+tUsd3Kn06rwrmTl9b1c+c2pTaGA53Tb14FgWV3W6yD5aii51K1ahX8DYZcbWvDOKcgcBbatilG3qxf4OQsVqUVk5luQcVJSrEaRm7cfp6/fUqFp1OETYph6N6q2AH89dRW2jb6u/sq4ReReue9MdWz310og+9sbSRFPHTuy+0N5TZXRZVbVuJfe0M3CPbUC5SmpVlZ4k610nLklF1V+2qykcmt35IFxitRUoL1aRplc/8xbdhQ6c+cNdB06yPSfL6B5V59TuoYEwilVWoGZ23/a8fTo6XJp7EOdvPXRsdlkv/fMuPv3qkEuZh0YdXf5KrUAnhFwhZa8TZKepCxsOHPPQj1W88eAxsNj2gSpQuP2mFSi7U3M4Qk68itPpY6Oxb02aqr4PrPsICW8PU6UrUzJS+TCx2J3kkw0JEHBapuRUZFeQD2KjMT0mGlNjhiGibx8nHU8NVS9egoXBqWt/4yQxq7slkZ+I4q0Xu4GynSnJcJaMJhKzSxb8dVpMixmOGbEjkDh+JN6MDGfNr5RuPq7B8at3cOzKbdoE7lp2LVsHbHZPoyg3kdXlQIGkVe/QKJcxwZghEThI0zUqSvWmxcx6RH89eorFWfvAwBOJ4IQxFJ83XDtNWnWISzIY6WWD0t5/T9fuV4k0s0boDXvkAK2LSd6iFTIoodZNWJ1jbuv0am3JvfhUbmrvwOR121lqeIoA0xq5E2eg+dvY+SupoaW9a1xG9iu7I8k7dVVm2+rY5ZvFpvZOI0SzHnk7X8j1nIEyaVHuNYre1DtVtZiwOlfpFU7up0dlll/ZoDx8Vk9XJH4+vZk6vaTZLybH7vQrF9Hpen9Yn9c1F7as5Id5vuI6evBYL6+owaS1O8z1za0m8HwqCnLyXBkpvohYlO9duono+KK2DtO8rwt+8/fTafhJo4e68uNTW+b3JUjZtM9E/um9Hwk0kyw9uiT3IyqZsKceHrspHBIHhvYRtqTP4RdNjpWkXn/ZEXHdrnxzTUMzG6hf0aVNx/HsWneO1AGVPFh3rxyqxvQK9Bc+jBulyUxLxIhBnjeCG5QbNxwoQfHlcnNrh5EBLKNRXIXi3POSe3df74BaPXGU4+ZQ7KZSTk6mpsAAndYU0itIFx7cy/LSN6Bvb1TXv0TF80Y8b2xGfUu7iQ4w9JhAb/ZAAdl9h6JthVRWfbT0BSj5t5E+wx+cdiot1Rm0yQ22Mvs/E4IJQgOFSjWVnxA/IkwleC3kLA5nsoPG/5f+AYHJnCJAa4aaAAAAAElFTkSuQmCC" /> <circle class="ot-top-state" fill="none" stroke="none" cx="21" cy="21" r="20.0" /><circle class="ot-focus" fill="none" stroke="none" cx="21" cy="21" r="20.5" /></svg>'},
};
});


csui.define('csui/controls/app.header/app.header.controls/csui.app.header.controls',["csui/themes/carbonfiber/ot-icons/icons_csui_header"], function () {
  return [
    {
      id: "csui/controls/app.header/app.header.controls/logo/logo.view",
      type: "logo",
    },
    {
      id: "csui/controls/app.header/app.header.controls/progresspanel/progressbar.maximize.view",
      sequence: 50,
      type: "progress",
    },
    {
      id: "csui/controls/app.header/app.header.controls/search.box/search.box.view",
      sequence: 100,
      type: "search",
    },
    {
      id: "csui/controls/app.header/app.header.controls/favorites/favorites.view",
      sequence: 200,
      type: "button",
    },
    {
      id: "csui/controls/app.header/app.header.controls/help/help.view",
      sequence: 300,
      type: "button",
    },
    {
      id: "csui/controls/app.header/app.header.controls/user.profile/user.profile.view",
      sequence: 999,
      type: "menu",
    },
  ];
});


csui.define('csui/utils/proxysettings/impl/nls/proxydynamic.lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/utils/proxysettings/impl/nls/root/proxydynamic.lang',{
  workAs: "Work as:",
  endWorkAs: "End working as {0}",
  workingAs: "Working as {0}",
  workingAsMessage: "You are working as {0}",
});



csui.define('csui/utils/proxysettings/proxy.dynamic.menu',['module', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/controls/globalmessage/globalmessage',
  'csui/utils/proxy',
  'csui/utils/command.error',
  'csui/utils/contexts/factories/user',
  'i18n!csui/utils/proxysettings/impl/nls/proxydynamic.lang'
], function (module,$, _,  GlobalMessage, Proxy, CommandError, UserModelFactory, lang) {
  'use strict';

  var menuSet;
  function ProxyDynamicMenu(options) {
    if(menuSet || !Proxy.enabled()){
      return $.Deferred().resolve([]);
    }
    var deferred = $.Deferred(),
    url = options.connector.getConnectionUrl().getApiBase('v2') + "members/proxies/targets";

    var getOptions = {
      url: url,
      method: 'GET'
    };
    var menuItems = [];
    var user = options.context.getModel(UserModelFactory);
    if(!!user.get("proxy_proxy_user_id")){
      menuSet = true;
      menuItems.push({
        profileMenu:{signature: 'SwitchToNonProxyUser', name: _.str.sformat(lang.endWorkAs, user.get("display_name")) , group: "proxy"}
      });
      GlobalMessage.showMessage('warning', _.str.sformat(lang.workingAs, user.get("display_name")), _.str.sformat(lang.workingAsMessage, user.get("display_name")));
      deferred.resolve(menuItems);
    }else{
      options.connector.makeAjaxCall(getOptions)
          .then(function (response) {
            menuSet = true;
            _.each(response.results.data, function(user){
              menuItems.push({
                profileMenu:{groupBy: "proxy", signature: 'SwitchToProxyUser', name: user.display_name, userid: user.id, group: "proxy", isSubItem: true}
              });
            });
            if(response.results.data.length > 0){
              menuItems.push({
                profileMenu:{groupBy: "proxy", signature: 'SwitchToProxyUser', name: lang.workAs, group: "proxy", isLabel: true}
              });
            }
            deferred.resolve(menuItems);
          }).catch(function (error) {
        deferred.resolve(menuItems);
      });
    }
    return deferred.promise();
  }

  return ProxyDynamicMenu;

});


csui.define('csui/utils/usersettings/cm.dynamic.menu',['module', 'csui/lib/jquery',
  'csui/controls/globalmessage/globalmessage',
  'csui/utils/contexts/factories/user',
  'i18n!csui/utils/usersettings/impl/nls/lang'
], function (module,$, GlobalMessage, UserModelFactory, lang) {
  'use strict';

  var menuSet;
  function ProxyDynamicMenu(options) {
    if(menuSet){
      return $.Deferred().resolve([]);
    }
    menuSet = true;
    let deferred = $.Deferred(),
        menuItems = [],
        user = options.context.getModel(UserModelFactory);
    //Content Manager user type only
    if(user.get("type") === 10){
      menuItems.push({
        profileMenu:{signature: 'SwitchToNonCMUser', name: lang.endWorkAsCM , group: "proxy"}
      });
      GlobalMessage.showMessage('warning', lang.cmMode, lang.workingAsMessage);
    }
    deferred.resolve(menuItems);
    return deferred.promise();
  }

  return ProxyDynamicMenu;

});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/sidebar/impl/pman.sidebar.item',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<button type=\"button\" class=\"csui-acc-focusable csui-sidebar-item "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"iconClass") || (depth0 != null ? lookupProperty(depth0,"iconClass") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"iconClass","hash":{},"loc":{"start":{"line":1,"column":66},"end":{"line":1,"column":79}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"tooltip") || (depth0 != null ? lookupProperty(depth0,"tooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"tooltip","hash":{},"loc":{"start":{"line":1,"column":88},"end":{"line":1,"column":99}}}) : helper)))
    + "\"> \n</button>";
}});
Handlebars.registerPartial('csui_perspective.manage_sidebar_impl_pman.sidebar.item', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspective.manage/sidebar/pman.sidebar.item.view',['csui/lib/marionette3',
  'hbs!csui/perspective.manage/sidebar/impl/pman.sidebar.item',
  "csui/controls/icons.v2"

], function (Marionette, SideBarItemTemplate) {
  'use strict';

  let PmanSideNavItemView = Marionette.View.extend({

    constructor: function PmanSideNavItemView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    },

    tagName: 'li',
    template: SideBarItemTemplate,
    templateContext: function () {
      return {
        iconClass: this.model.get("iconClass"),
        tooltip: this.model.get("name")
      }
    },

    events: {
      'click .csui-sidebar-item:not(.binf-active)': function () {
        this.showPanel();
      },
      'keydown .csui-sidebar-item:not(.binf-active)': function (event) {  
        if (event.key === "Enter" || event.key === " ") {
          this.showPanel();
        }
      },
    },

    showPanel: function(){
      const targetView = this.model.getPanelView(this.options);
      const title = this.model.getPanelTitle();
      this.trigger("show:panel",this, targetView, title);
    },

  });

  return PmanSideNavItemView;
});



csui.define('csui/models/sidebar.items',['csui/lib/backbone', 'csui/models/sidebar.item'
], function (Backbone, SideBarItemModel) {
  'use strict';

  var SidebarItemCollection = Backbone.Collection.extend({

    model: SideBarItemModel,

    constructor: function SidebarItemCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });

  return SidebarItemCollection;

});




csui.define('csui/perspective.manage/sidebar/sidebar.items',[
    'csui/lib/underscore',
    'csui/models/sidebar.items',
    'csui-ext!csui/perspective.manage/sidebar/sidebar.items'
], function (_, SidebarItemCollection, extraItems) {
    'use strict';

    let sidebarItems = new SidebarItemCollection();

    if (extraItems) {
        sidebarItems.add(
            
            _.chain(extraItems)
                .flatten(true)
                .map(function (Item) {
                    return new Item();
                })
                .sortBy(item => item.get("sequence"))
                .value()
        );
    }

    return sidebarItems;


});

csui.define('csui/perspective.manage/sidebar/impl/nls/lang',{
    // Always load the root bundle for the default locale (en-us)
    "root": true,
    // Do not load English locale bundle provided by the root bundle
    "en-us": false,
    "en": false
  });
  

csui.define('csui/perspective.manage/sidebar/impl/nls/root/lang',{
    layouts: 'Layouts',
    widgets: 'Widgets',
    titleClearIcon: 'Clear',
    sideBarCloseIcon: 'Close'
  });
  



/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/sidebar/impl/pman.sidebar.container',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-ribbon-panel csui-normal-scrolling\">\n    <ul class=\"csui-pman-sidebar-ribbon\"></ul>\n    <button class=\"icon icon-help\" title=\"Help\"></button>\n</div>\n\n<div class=\"csui-sidebar-slide-container\">\n    <div class=\"csui-sidebar-slide-main\">\n        <div class=\"csui-sidebar-slide-header\">\n			<h3 class=\"csui-sidebar-slide-title\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":9,"column":40},"end":{"line":9,"column":49}}}) : helper)))
    + "</h3>\n			<div class=\"csui-sidebar-slide-close\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sideBarCloseIcon") : depth0), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sideBarCloseIcon") : depth0), depth0))
    + "\"> \n			</div>\n		</div>\n		<div class=\"csui-sidebar-slide-body\"></div>\n	</div>\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_sidebar_impl_pman.sidebar.container', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/sidebar/impl/pman.sidebar.container',[],function(){});

csui.define('csui/perspective.manage/sidebar/pman.sidebar.container.view',['csui/lib/marionette3',
  'csui/widgets/navigation.header/controls/help/help.view',
  'csui/perspective.manage/sidebar/pman.sidebar.item.view',
  'csui/models/sidebar.items',
  'csui/perspective.manage/sidebar/sidebar.items',
  'i18n!csui/perspective.manage/sidebar/impl/nls/lang',
  'hbs!csui/perspective.manage/sidebar/impl/pman.sidebar.container',
  'css!csui/perspective.manage/sidebar/impl/pman.sidebar.container',
  "csui/controls/icons.v2"

], function (Marionette, HelpView, PmanSidebarItemView, SidebarItemCollection, SidebarMenuItems, lang, template ) {
  'use strict';


  let PManSideBarContainerView = Marionette.CompositeView.extend({
    tagName: 'div',
    template: template,
    templateContext: function() {
      return {
        sideBarCloseIcon: lang.sideBarCloseIcon
      }
    },
    ui: {
      slideTitle: ".csui-sidebar-slide-title",
      slideBody: ".csui-sidebar-slide-body",
      closeIcon: ".csui-sidebar-slide-close",
      helpIcon: '.csui-ribbon-panel .icon-help',
    },
    className: 'csui-sidebar-panel',
    events: {
      'keydown': 'onOpenPanelKeyDown',
      'click @ui.closeIcon': 'closeSlidePanel',
      'click @ui.helpIcon': 'onClickHelp'
    },
    childViewContainer: 'ul.csui-pman-sidebar-ribbon',
    childView: PmanSidebarItemView,
    childViewOptions: function () {
      return this.options;
    },

    childViewTriggers: {
      "set:active": "child:set:active",
      "show:panel":"child:show:panel"
    },

    onRender: function () {
      this.el.closest('.csui-sidebar')?.classList.remove('csui-sidebar-open');
      this.slideRegion = new Marionette.Region({
        el: this.ui.slideBody
      });
    },

    constructor: function PManSideBarContainerView(options) {
      this.options = options || {};
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      let self = this;
      let sidebarItems = new SidebarItemCollection();
      SidebarMenuItems.filter(item=>item.isEnabled(self.options)&&sidebarItems.add(item));
      this.collection = sidebarItems;
      this.helpView = new HelpView(options);
    },

    onChildShowPanel(childView, View, name){
      this.openSlidePanel(View, name);
      this.setActive(childView);
    },

    onChildSetActive(childView){
      this.setActive(childView);
    },

    openSlidePanel: function (view, text) {
      this.slideRegion.show(view);
      this.el.closest('.csui-sidebar')?.classList.add('csui-sidebar-open');
      this.ui.slideTitle.text(text);
      this.ui.slideTitle.attr({
        'aria-label': text,
        'title': text
      });
    },

    closeSlidePanel: function () {
      this.el.closest('.csui-sidebar')?.classList.remove('csui-sidebar-open');
      this.clearActive();
    },

    onClickHelp: function () {
      this.helpView.triggerMethod('click:help', 'editpage');
    },

    onOpenPanelKeyDown: function (event) {
      if (event.key === "Escape") {
        this.closeSlidePanel();
      }
    },
    
    setActive: function (childView) {
      this.clearActive();
      childView.el.querySelector('.csui-sidebar-item').classList.add('binf-active');
    },

    clearActive: function(){
      this.el.querySelectorAll('.csui-sidebar-item').forEach(ele=>ele.classList.remove("binf-active"));
    }

  });

  return PManSideBarContainerView;
});



/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/list.item',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "binf-active";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"className") : depth0), depth0))
    + " "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"active") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":31},"end":{"line":1,"column":68}}})) != null ? stack1 : "")
    + "\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "\"\n     draggable=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"draggable") : depth0), depth0))
    + "\" tabindex= \"-1\">\n  <span>"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "</span>\n  <div class=\"csui-layout-icon "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"iconClass") : depth0), depth0))
    + "\"></div>\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_list.item', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspective.manage/sidebar/layouts.panel.item.view',[
  'csui/lib/underscore', 'csui/lib/marionette3',
  'hbs!csui/perspective.manage/impl/list.item'
], function (_, Marionette, ListItemTemplate) {
  'use strict';
  
  const LayoutsPanelItemView = Marionette.View.extend({
    constructor: function LayoutsPanelItemView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    },

    tagName: 'div',
    template: ListItemTemplate,

    templateContext: function () {
      return {
        draggable: !!this.options.draggable,
        className: this.options.itemClassName,
        iconClass: this.model.get('icon'),
        active: this.model.get("type")===this.options?.perspectiveType
      }
    },

    events: {
      'click .csui-layout-item:not(.binf-active)': _.debounce(function () {
        this.trigger('change:layout', this);
      }, 200, true),
      'keydown .csui-layout-item': _.debounce(function (event) {  
        if (event.key === "Enter" || event.key === " ") {
          this.trigger('change:layout');
          document.querySelector(".binf-widgets.perspective-editing .cs-perspective-with-breadcrumb-view .csui-sidebar .csui-layout-item.binf-active").attr('tabindex', 0);
        }
      }, 200, true),
    }

  });

  return LayoutsPanelItemView;

});

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/list',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"cs-header binf-panel-heading cs-header-with-go-back\" role=\"link\"\n     aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackAria") || (depth0 != null ? lookupProperty(depth0,"goBackAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackAria","hash":{},"loc":{"start":{"line":2,"column":17},"end":{"line":2,"column":31}}}) : helper)))
    + "\">\n  <span class=\"icon circular arrow_back cs-go-back\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackTooltip") || (depth0 != null ? lookupProperty(depth0,"goBackTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackTooltip","hash":{},"loc":{"start":{"line":3,"column":59},"end":{"line":3,"column":76}}}) : helper)))
    + "\"></span>\n</div>\n<div class=\"cs-content\">\n  <div class=\"cs-list-group\"></div>\n</div>\n";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_list', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspective.manage/sidebar/layouts.panel.view',['csui/lib/backbone',
  'csui/lib/underscore', 'csui/lib/marionette3',
  'csui/perspective.manage/sidebar/layouts.panel.item.view',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/list'
], function (Backbone, _, Marionette, ListItemView, Lang, ListTemplate) {
  'use strict';
  
  const LayoutsPanelView = Marionette.CollectionView.extend({

    constructor: function LayoutsPanelView(options) {
      options || (options = {});
      options.data || (options.data = {});

      Marionette.CollectionView.call(this, options);

      // TODO: Deprecate this, or fix it, so that a collection can be created
      // without breaking the client
      // Passing a collection without knowing its model schema and identifier
      // is not possible in Backbone, where the collections should be indexed
      if (this.options.data?.items) {
        if (!this.collection) {
          const ViewCollection = Backbone.Collection.extend({
            model: Backbone.Model.extend({
              idAttribute: null
            })
          });
          this.collection = new ViewCollection();
        }
        this.collection.add(this.options.data.items);
      }
    },

    className: 'csui-pman-list csui-normal-scrolling',

    childViewTriggers: {
      'change:layout': 'child:Change:Layout',
      'set:active': 'child:set:active'
    },

    
    onChildChangeLayout(childView){
      this.onChangeLayout(childView);
    },
    
    onChildSetActive(childView){
      this.setActive(childView);
    },

    template: ListTemplate,

    childViewContainer: '.cs-list-group',

    childView: ListItemView,

    childViewOptions: function () {
      return this.options;
    },

    setActive: function (childView) {
      this.el.querySelectorAll('.csui-layout-item').forEach(ele=>ele.classList.remove("binf-active"));
      childView.el.querySelector('.csui-layout-item').classList.add('binf-active');
    },
    
    onChangeLayout: function (childView) {
      let self = this,
        newLayout = childView.model.get('type'),
        currentLayout = this.options.context.pmanView.perspective.get('perspective').type;
      if ((currentLayout === 'sidepanel-right' || currentLayout === 'sidepanel-left')
        && (newLayout === 'sidepanel-right' || newLayout === 'sidepanel-left')) {
        //swapping the layouts without any warning message and also retaining the widgets
        // while switching between sidepanel-left and sidepanel-right
        self.setActive(childView);
        self.options.context.pmanView.trigger("swap:layout", newLayout);
      }
      else {
        csui.require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlertView) {
          ModalAlertView.confirmWarning(Lang.changePageLayoutConfirmatonText, Lang.layouts,
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
                self.options.context.pmanView.trigger("change:layout", childView.model.get('type'));
                self.options.context.pmanView.context.trigger("reset:widget:panel");
              }
            });
        });
      }
    }
  })
  
  return LayoutsPanelView;

});



csui.define('csui/perspective.manage/impl/perspectivelayouts',['module',
    'csui/lib/underscore',
    'i18n',
    'i18n!csui/perspective.manage/impl/nls/lang',
    // Load extra layout items to be added
    'csui-ext!perspective.manage/impl/perspectivelayouts'
], function(module,_, i18n, Lang, extraPerspectiveLayouts) {
    var config = _.extend({       
        enableNewlayoutOption: false,
      }, module.config());
    const isRtl = i18n?.settings.rtl;
    var perspectivelayouts = [
        {
            title: Lang.LcrLayoutTitle,
            type: "left-center-right",
            icon: "csui-layout-lcr"
        },
        {
            title: Lang.FlowLayoutTitle,
            type: "flow",
            icon: "csui-layout-flow"
        }
    ];
    if (config.enableNewlayoutOption) {
        perspectivelayouts.push(
            {
                title: Lang.RSPLayoutTitle,
                type: "sidepanel-right",
                icon: isRtl ? "csui-layout-sidepanel-left" : "csui-layout-sidepanel-right"
            },
            {
                title: Lang.LSPLayoutTitle,
                type: "sidepanel-left",
                icon: isRtl ? "csui-layout-sidepanel-right" : "csui-layout-sidepanel-left"
            }
        );
    }


    if(extraPerspectiveLayouts) {
        perspectivelayouts = _.union(perspectivelayouts, extraPerspectiveLayouts);
    }

    return perspectivelayouts;
});

csui.define('csui/perspective.manage/sidebar/layouts',['csui/models/sidebar.item',
'csui/perspective.manage/sidebar/layouts.panel.view',
'csui/perspective.manage/impl/perspectivelayouts',
'i18n!csui/perspective.manage/sidebar/impl/nls/lang'
], function (SidebarItemModel, LayoutsPanelView, perspectiveLayouts,Lang) {
  'use strict';

  let LayoutsModel = SidebarItemModel.extend({

    defaults: {
      signature: "Layouts",
      sequence: 1,
      name: Lang.layouts,
      iconClass: "csui-sidebar-layouts-btn",
      panelTitle: Lang.layouts,
    },

    getPanelView: function (options) {
      let args = options?.data ? options : {
        data: {
          items: perspectiveLayouts
        }
      };
      args.draggable = !!args.data.draggable;
      args.itemClassName = "csui-layout-item";
      args.context = options.context;
      args.perspectiveType = options.perspectiveType;
      return new LayoutsPanelView(args);
    }

  });

  return LayoutsModel;

});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/sidebar/impl/search.widget',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"cs-item-picker\" role=\"combobox\"\n     aria-expanded=\"false\" aria-haspopup=\"listbox\">\n     <input id=\"search-input\" type=\"text\" class=\"search-widget binf-form-control cs-search\" autocomplete=\"off\"\n          aria-autocomplete=\"list\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"ariaLabel") || (depth0 != null ? lookupProperty(depth0,"ariaLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"ariaLabel","hash":{},"loc":{"start":{"line":4,"column":47},"end":{"line":4,"column":60}}}) : helper)))
    + "\"\n          placeholder=\"Search widgets\" />\n     <div class=\"search-widget cs-search-clear csui-icon formfield_clear\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"titleClearIcon") : depth0), depth0))
    + "\"\n          role=\"button\" aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"titleClearIcon") : depth0), depth0))
    + "\" tabindex=\"0\"></div>\n     <div class=\"search-widget cs-search-icon\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"titleSearchIcon") || (depth0 != null ? lookupProperty(depth0,"titleSearchIcon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"titleSearchIcon","hash":{},"loc":{"start":{"line":8,"column":54},"end":{"line":8,"column":73}}}) : helper)))
    + "\"\n          role=\"button\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"titleSearchIcon") || (depth0 != null ? lookupProperty(depth0,"titleSearchIcon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"titleSearchIcon","hash":{},"loc":{"start":{"line":9,"column":36},"end":{"line":9,"column":55}}}) : helper)))
    + "\">\n     </div>\n</div>\n";
}});
Handlebars.registerPartial('csui_perspective.manage_sidebar_impl_search.widget', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/sidebar/impl/search.widget',[],function(){});

csui.define('csui/perspective.manage/sidebar/search.widget.view',['csui/lib/jquery',
    'csui/lib/underscore', 'csui/lib/marionette3',
    'i18n!csui/perspective.manage/sidebar/impl/nls/lang',
    'hbs!csui/perspective.manage/sidebar/impl/search.widget',
    'css!csui/perspective.manage/sidebar/impl/search.widget'],
    function ($, _, Marionette, lang, template) {
        'use strict';

        let SearchWidgetView = Marionette.View.extend({

            template: template,

            templateContext: function() {
                return {
                    titleClearIcon : lang.titleClearIcon
                }
            },

            tagName: 'div',

            ui: {
                searchInput: '.search-widget.cs-search',
                searchclear: '.search-widget.cs-search-clear',
            },

            events: {
                'keyup @ui.searchInput': 'onKeyUp',
                'keydown @ui.searchInput': 'onKeyDown',
                'click @ui.searchclear': 'onClickClear',
                'keydown @ui.searchclear': 'onClickClear',
                'input @ui.searchInput': 'onSearchInput'
            },

            constructor: function SearchWidgetView(options) {
                this.options = options || {};
                Marionette.View.prototype.constructor.apply(this, arguments);
            },

            onRender: function () {
                this.ui.searchInput.show();
                this.updateClearStyle();
            },

            updateClearStyle: function () {
                let clear = this.ui.searchInput.val()?.length > 0;
                this.ui.searchclear.toggleClass('binf-hidden', !clear);
            },

            onClickClear: function (event) {
                if (event.type === "click" || event.key === 'Enter') {
                    this.ui.searchInput.val('');
                    this.updateClearStyle();
                    this.ui.searchInput[0].focus();
                    this.trigger('search:closed');
                }
            },

            onKeyUp: function (e) {
                // update styles
                this.updateClearStyle();
                if (this.ui.searchInput.val() === "") {
                    /* 9: tab, 13: enter, 16: shift, 38: arrow up, 40: arrow down */
                    const nonClearKeys = ['Tab', 'Enter', 'Shift', 'ArrowUp', 'ArrowDown'];
                    if (!nonClearKeys.includes(e.key)) {
                        this.trigger('item:clear');
                        this.ui.searchInput.removeAttr('aria-activedescendant');
                    }
                }
            },

            onKeyDown: function (e) {
                if (e.key === 'Tab' && $(this.ui.searchclear).is(":visible")) {
                    if (e.shiftKey) {
                        this.updateClearStyle();
                    } else {
                        e.preventDefault();
                        e.stopPropagation();
                        this.ui.searchclear[0].focus();
                    }
                }
            },

            onSearchInput: function (event) {
                let query = $(event.target).val().split(" ").join("").trim().toLowerCase();

                if (this.searchTimeout) {
                    clearTimeout(this.searchTimeout);
                }

                this.searchTimeout = setTimeout(() => {
                    this.trigger('search:performed', query);
                    if (query.length === 0) {
                        this.trigger('search:closed');
                    }
                }, 200);
            },

        })

        return SearchWidgetView;
    })
;

csui.define('csui/perspective.manage/mixins/manifest.edit.mixin',["csui/lib/underscore", "csui/lib/jquery"], function (_, $) {
  "use strict";

  var ManifestEditMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        objectToPrimitive: function (fieldKey) {

          var manifestOrig = $.extend(true, {}, this.manifest),
              field = this.manifest.schema.properties[fieldKey],
              fieldOption = this.manifest.options.fields[fieldKey],
              fieldOptionItems = fieldOption && fieldOption.items.fields,
              itemKey = _.keys(field.items.properties)[0];

          //maintain manifest before modifying to use while conversion to object
          this.manifest.modifiedItems = manifestOrig;

          //updating filed data
          var fieldItem = field.items.properties[itemKey];
          delete field.items.properties;
          field.items.type = fieldItem.type;
          field.title = fieldItem.title;
          field.required = (field.items.required && field.items.required.length > 0);
          field.itemKey = itemKey;

          //updating field schema
          if (fieldOptionItems) {
            delete fieldOption.items.fields;
            fieldOption.items = _.values(fieldOptionItems)[0];
          }
        },

        updateDataToPrimitive: function (data, modifiedKey) {
          var arrvalues = [],
              key = this.manifest.schema.properties[modifiedKey].itemKey;
          data[modifiedKey].length == 0 && arrvalues.push("");
          data[modifiedKey].forEach(function (item) {
            arrvalues.push(item[key]);
          });
          data[modifiedKey] = arrvalues;
        },

        getPrimitiveToObjectvalues: function (modifiedKey, formValues) {
          var itemKey = this.manifest.schema.properties[modifiedKey].itemKey;
          if (itemKey) {
            // update manifest to original inline with values
            if (this.manifest.modifiedItems) {
              this.manifest.options.fields[modifiedKey].items =
                  this.manifest.modifiedItems.options.fields[modifiedKey].items;

              this.manifest.schema.properties[modifiedKey].items =
                  this.manifest.modifiedItems.schema.properties[modifiedKey].items;
            }

            for (var fieldKeyOne in formValues[modifiedKey]) {
              var sortListArray = {};
              sortListArray[itemKey] = formValues[modifiedKey][fieldKeyOne];
              formValues[modifiedKey][fieldKeyOne] = sortListArray;
            }
            return formValues;
          }
          return formValues;

        }
      });
    },
  };
  return ManifestEditMixin;
});

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/options.form.wrapper',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-pman-form-header\">\n    <div class=\"csui-pman-form-title\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":2,"column":38},"end":{"line":2,"column":49}}}) : helper)))
    + "</div>\n    <div class=\"csui-pman-form-description\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"description") || (depth0 != null ? lookupProperty(depth0,"description") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"description","hash":{},"loc":{"start":{"line":3,"column":44},"end":{"line":3,"column":61}}}) : helper)))
    + "</div>\n    <div class=\"csui-pman-config-unsupported\">\n        <div class=\"csui-state\">\n            <span class=\"csui-state-icon csui-icon csui-icon-notification-error-white\"></span>\n        </div>\n        <div class=\"csui-error-message\">\n            <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"configNotSupported") || (depth0 != null ? lookupProperty(depth0,"configNotSupported") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"configNotSupported","hash":{},"loc":{"start":{"line":9,"column":18},"end":{"line":9,"column":42}}}) : helper)))
    + "</span>\n        </div>\n    </div>\n</div>\n<div class=\"csui-pman-form-content cs-formview-wrapper\"></div>\n";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_options.form.wrapper', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/impl/options.form',[],function(){});

csui.define('csui/perspective.manage/impl/options.form.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/lib/alpaca/js/alpaca.lite',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/perspective.manage/mixins/manifest.edit.mixin',
  'csui/controls/form/form.view',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/options.form.wrapper',
  'csui/utils/perspective/perspective.util',
  'css!csui/perspective.manage/impl/options.form',
], function (_, $, Backbone, Marionette, Alpaca, LayoutViewEventsPropagationMixin,
    ManifestEditMixin,
    FormView, lang, template, PerspectiveUtil) {

  var WidgetOptionsFormWrapperView = Marionette.LayoutView.extend({

    template: template,

    className: 'csui-pman-form-wrapper csui-normal-scrolling',

    regions: {
      bodyRegion: '.csui-pman-form-content'
    },

    templateHelpers: function () {
      return {
        title: this.options.manifest.title,
        description: this.options.manifest.description,
        configNotSupported: lang.configNotSupported
      }
    },

    ui: {
      unSupportedConfig: '.csui-pman-config-unsupported',
      description: '.csui-pman-form-description'
    },

    events: {
      'keydown': '_onKeyDown'
    },

    constructor: function WidgetOptionsFormHeaderView(options) {
      this.options = options || {};
      this.manifest = this.options.manifest;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },

    _createForm: function (formModel) {
      this.widgetOptionsFormView = new WidgetOptionsFormView({
        context: this.options.context,
        model: formModel,
        mode: 'create'
      });

      this.listenToOnce(this.widgetOptionsFormView, 'render:form', function () {
        this.trigger('render:form');
      }.bind(this))

      this.listenTo(this.widgetOptionsFormView, 'change:field', function (field) {
        this.trigger('change:field', field);
      }.bind(this))
    },

    _hasSchema: function () {
      return this.manifest && this.manifest.hasConfigForm;
    },

    refresh: function (callback) {
      if (!!this.widgetOptionsFormView) {
        this.widgetOptionsFormView.refresh(callback);
      } else {
        callback();
      }
    },

    onRender: function () {
      this.ui.unSupportedConfig.hide();
      var hasSchema = this._hasSchema();
      if (!hasSchema) {
        // No schema defined for widget
        this.trigger('render:form');
        return;
      }
      var formModel = this._prepareFormModel();
      this.hasValidSchema = WidgetOptionsFormWrapperView._normalizeOptions(
          formModel.attributes.schema.properties, formModel.attributes.options.fields,
          formModel.attributes.data);
      if (this.hasValidSchema) {
        this._createForm(formModel);
        this.bodyRegion.show(this.widgetOptionsFormView);
      } else {
        // Widget configuration schema has unsupported alpaca fields
        this.ui.description.hide();
        this.ui.unSupportedConfig.show();
        this.trigger('render:form');
      }
    },
    //To change the border color to red for non supported widgets.
    onPopoverShow: function (popover) {
      if (this._hasSchema() && !this.hasValidSchema) {
        popover.find('.binf-popover-content').addClass("invalid-options");
        popover.find('.binf-arrow').addClass("invalid-options");
      }
      this._focusField('.alpaca-container-item-first');
    },

    _focusField: function (fieldSelector) {
      var itemFirst = this.$el.find(fieldSelector);
      if (itemFirst.length) {
        itemFirst = itemFirst.first();
        var ele = itemFirst.find(
            'input:visible, textarea:visible, button.binf-dropdown-toggle:visible'),
            browseIcon = itemFirst.find('.cs-browse-icon');
        if (ele.length) {
          if (browseIcon.length) {
            browseIcon.trigger('focus');
          } else {
            ele.first().trigger('focus');
          }
        }
      }
    },

    _onKeyDown: function (event) {
      var continueEvent = true,
          $target = $(event.target);
      switch (event.keyCode) {
      case 9:
        if (!event.shiftKey && $target.parents('.alpaca-container-item-last').length) {
          this._focusField('.alpaca-container-item-first');
          continueEvent = false;
        } else if (event.shiftKey && $target.parents('.alpaca-container-item-first').length) {
          this._focusField('.alpaca-container-item-last');
          continueEvent = false;
        }
        break;
      }
      return continueEvent;
    },

    getValues: function () {
      if (!this._hasSchema()) {
        return undefined;
      }
      if (this.hasValidSchema) {
        var formValues = this.widgetOptionsFormView.getValues();
        if (this.manifest.modifiedProperties) {
          for (var modKey in _.keys(formValues)) {
            if (this.manifest.modifiedProperties.indexOf(_.keys(formValues)[modKey]) >= 0) {
              formValues = this.getPrimitiveToObjectvalues(_.keys(formValues)[modKey], formValues);
            }
          }
        }
        return formValues;
      } else {
        return this._getOptionsData();
      }
    },

    validate: function () {
      if (!this._hasSchema()) {
        return true;
      }
      // Widget configuration schema has unsupported alpaca fields
      if (!this.hasValidSchema) {
        var reqVal = true;
        //Has required fields
        //TODO to handle required fields of recursive schema
        if (PerspectiveUtil.hasRequiredFields(this.manifest)) {
          var data = this._getOptionsData();
          var reqFields = this.manifest.schema.required;
          _.each(reqFields, function (fieldName) {
            if (!data[fieldName]) {
              reqVal = false;
            }
          });
        }
        return reqVal;
      }
      // Widget configuration schema has supported alpaca fields
      return this.widgetOptionsFormView.validate();
    },

    _isPreviewWidget: function () {
      return this.options.widgetConfig.type ===
             'csui/perspective.manage/widgets/perspective.widget';
    },

    _prepareFormModel: function () {
      var data = this._getOptionsData();
      var modifiedProperties = [];
      //iterate manifest and update fields to primitive type if it has only one item
      for (var fieldKey in this.manifest.schema.properties) {
        //TODO: Need to expect the falg from respective manifest file to render multivalue block as set.
        //something like field.alwaysSet : true
        //until then hardcoded with the key name.
        if (fieldKey !== 'businessobjecttypes') {
          break;
        }
        var filed = this.manifest.schema.properties[fieldKey];
        if (filed.type === 'array' && filed.items.type === 'object' &&
            _.keys(filed.items.properties).length === 1) {
          modifiedProperties.push(fieldKey);
          this.objectToPrimitive(fieldKey);
          data[fieldKey] && this.updateDataToPrimitive(data, fieldKey);
        } else {
          // update only data to inline with modified manifest
          this.manifest.modifiedProperties && data[fieldKey] &&
          this.updateDataToPrimitive(data, fieldKey);
        }
      }

      if (modifiedProperties.length > 0) {
        this.manifest.modifiedProperties = modifiedProperties;
      }

      // Clone schema and options from manifest as they would change by form.view
      var schema = JSON.parse(JSON.stringify(this.manifest.schema)),
          formOptions = JSON.parse(JSON.stringify(this.manifest.options || {}));
      if (!formOptions) {
        formOptions = {};
      }
      if (!formOptions.fields) {
        formOptions.fields = {};
      }
      this._addWidgetSizePropertyIfSupported(schema, formOptions, data);

      var model = new Backbone.Model({
        schema: schema,
        options: formOptions,
        data: data
      });
      return model;
    },

    //Common method to get widget config data
    _getOptionsData: function () {
      var data = this.options.widgetConfig.options || {};
      if (this._isPreviewWidget()) {
        // For widgets added using DnD, widget will be added as preview for original widget
        // Resolve original widget options from preview widget's options
        data = data.options || {};
      }
      return data;
    },

    /**
     * Add a new properties to form to change "Size" if widgets.
     * Size that can be configured depends on perspective's supported sizes as well as supported sizes of widget
     *
     */
    _addWidgetSizePropertyIfSupported: function (schema, options, data) {
      if (!this.options.perspectiveView.getSupportedWidgetSizes) {
        // Perspective view doesn't support configuring widget sizes
        return;
      }
      var supportedKinds = this.options.perspectiveView.getSupportedWidgetSizes(this.manifest,
        this.options.widgetView);
      if (this.options.context && this.options.context.perspective) {
        if (!((this.options.context.perspective.type == 'sidepanel-right') ||
          (this.options.context.perspective.type == 'sidepanel-left'))) {
          supportedKinds = _.filter(supportedKinds, function (supportedItem) {
            return supportedItem.kind !== 'heroTile';
          });
        } else {
          if (this.options.perspectiveView.$el.hasClass('cs-bcs-perspective-banner')) {
            delete schema.properties['titlefield'];
          }
        }
      }
      if (!supportedKinds || supportedKinds.length === 0) {
        // No supported sizes found for widget
        return;
      }
      var kindSchema = {
        title: lang.widgetSizeTitle,
        description: lang.widgetSizeDescription,
        type: 'string',
        enum: _.map(supportedKinds, function (sk) {
          return sk.kind;
        })
      };
      var kindOption = {
        type: 'select',
        optionLabels: _.map(supportedKinds, function (sk) {
          return sk.label;
        }),
        removeDefaultNone: true
      };
      var selectedKind = _.find(supportedKinds, function (size) {return size.selected;});
      if (!!selectedKind) {
        data[WidgetOptionsFormWrapperView.widgetSizeProperty] = selectedKind.kind;
      }
      var sizeSchema = {};
      sizeSchema[WidgetOptionsFormWrapperView.widgetSizeProperty] = kindSchema;
      schema.properties = _.extend(sizeSchema, schema.properties);

      var sizeOptions = {};
      sizeOptions[WidgetOptionsFormWrapperView.widgetSizeProperty] = kindOption;
      options.fields = _.extend(sizeOptions, options.fields);

      schema.required = schema.required || [];
      schema.required.push(WidgetOptionsFormWrapperView.widgetSizeProperty);
    },

  }, {
    widgetSizeProperty: '__widgetSize',

    /**
     * NOTE: Duplicate of Alpaca.createFieldInstance since this code is not exposed as function
     */
    _resolveOptionsType: function (schema, data) {
      var type = schema.type;
      if (!type) {
        type = Alpaca.getSchemaType(data);
      }
      if (!type) {
        if (data && Alpaca.isArray(data)) {
          type = "array";
        } else {
          type = "object"; // fallback
        }
      }
      if (schema && schema["enum"]) {
        if (schema["enum"].length > 3) {
          return "select";
        } else {
          return "radio";
        }
      } else {
        return Alpaca.defaultSchemaFieldMapping[type];
      }
    },

    /**
     * Recursively fill options for all respective schemas
     */
    _normalizeOptions: function (schemaProperies, optionFields, data) {
      var hasValidTypes = true;
      _.each(schemaProperies, function (field, fieldId) {
        var fieldOpts = optionFields[fieldId];
        var fieldData = data[fieldId];
        if (!fieldOpts) {
          optionFields[fieldId] = fieldOpts = {}
        }

        var optType = fieldOpts.type;
        if (!optType && !!field.type) {
          // Options not defined.. So resolve option type from Alp JSON schema type
          optType = WidgetOptionsFormWrapperView._resolveOptionsType(field, fieldData);
        }

        if (!Alpaca.getFieldClass(optType)) {
          hasValidTypes = false;
        }

        switch (field.type) {
        case 'array':
          if (!fieldOpts.fields) {
            _.defaults(fieldOpts, {
              fields: {
                item: {}
              }
            });
          }
          if (!!fieldOpts.items) {
            fieldOpts.fields.item = fieldOpts.items;
          }
          if (field.items.type === 'object') {
            if (!!fieldOpts.fields.item.type && !Alpaca.getFieldClass(fieldOpts.fields.item.type)) {
              hasValidTypes = false;
            }
            fieldOpts.fields.item.fields || (fieldOpts.fields.item.fields = {});
            if (!fieldData || fieldData.length === 0) {
              data[fieldId] = fieldData = [{}];
            }
            var hasValidArrayType = WidgetOptionsFormWrapperView._normalizeOptions(
                field.items.properties, fieldOpts.fields.item.fields,
                fieldData[0]);
            if (!hasValidArrayType) {
              hasValidTypes = false;
            }
          }
          if (!fieldData) {
            data[fieldId] = [null];
          }
          break;
        case 'object':
          if (!fieldData) {
            data[fieldId] = fieldData = {};
          }
          if (!fieldOpts.fields) {
            fieldOpts.fields = {};
          }
          var hasValidObjectType = WidgetOptionsFormWrapperView._normalizeOptions(field.properties,
              fieldOpts.fields, fieldData);
          if (!hasValidObjectType) {
            hasValidTypes = false;
          }
          break;
        default:
          if (_.isUndefined(fieldData)) {
            // Consider default value specified in schema if set
            data[fieldId] = field.default || null;
          }
          break;
        }
      });
      return hasValidTypes;
    }
  });

  var WidgetOptionsFormView = FormView.extend({
    className: function () {
      var className = FormView.prototype.className.call(this);
      return className + ' perspective-widget-form';
    },
    constructor: function WidgetOptionsFormView(options) {
      FormView.apply(this, arguments);
    },
    popover : false,
    refresh: function (callback) {
      this.form && this.form.refresh(callback);
    },

    _modifyModel: function () {
      FormView.prototype._modifyModel.apply(this, arguments);
      // Dont hide initial validation since there is an issue in alpaca with  alpaca.refresh()
      this.alpaca.options.hideInitValidationError = false;
    }
  });

  _.extend(WidgetOptionsFormView.prototype, LayoutViewEventsPropagationMixin);
  ManifestEditMixin.mixin(WidgetOptionsFormWrapperView.prototype);
  return WidgetOptionsFormWrapperView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/widget.drag.template',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-widget-template\">\n  <div class=\"csui-template-header\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"header") : depth0), depth0))
    + "</div>\n  <div class=\"csui-template-body\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"body") : depth0), depth0))
    + "</div>\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_widget.drag.template', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspective.manage/impl/widget.drag.template.view',[
  'csui/lib/underscore',
  'csui/lib/marionette',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/widget.drag.template'
], function (_, Marionette,
    Lang,
    WidgetDragTemplate) {
  'use strict';

  var WidgetDragTemplateView = Marionette.ItemView.extend({
    constructor: function WidgetItemView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    className: 'csui-template-wrapper',

    template: WidgetDragTemplate,

    templateHelpers: function () {
      return {
        header: this.options && this.options.title,
        body: Lang.templateMessage

      }
    },
    onRender: function () {
      this.$el.data('pman.widget', this.options.newWidget);
    }
  });

  return WidgetDragTemplateView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/widget.item',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n        <div class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"draggable") : stack1),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"loc":{"start":{"line":11,"column":20},"end":{"line":11,"column":76}}})) != null ? stack1 : "")
    + "\"\n             data-widget-type=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"dataAttr") : stack1), depth0))
    + "\"\n             data-widget-allow-multiple=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"allowMultiple") : stack1), depth0))
    + "\">\n          <div class=\"csui-widget-item icon-draggable-handle csui-draggable-widget-item\"\n               data-widget-index=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"index") : stack1), depth0))
    + "\" draggable=\"true\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "\">\n            <span>"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "</span>\n            <div class=\"csui-layout-icon "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"icon") : stack1), depth0))
    + "\"></div>\n          </div>\n        </div>\n\n        <div class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"draggable") : stack1),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(2, data, 0),"loc":{"start":{"line":21,"column":20},"end":{"line":21,"column":76}}})) != null ? stack1 : "")
    + "\" data-widget-type=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"dataAttr") : stack1), depth0))
    + "\"\n             data-widget-allow-multiple=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"allowMultiple") : stack1), depth0))
    + "\">\n          <div class=\"csui-widget-item icon-draggable-handle\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"disableTitle") : stack1), depth0))
    + "\">\n            <span>"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "</span>\n            <div class=\"csui-layout-icon "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"icon") : stack1), depth0))
    + "\"></div>\n          </div>\n        </div>\n\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "";
},"4":function(container,depth0,helpers,partials,data) {
    return " binf-hidden ";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-accordion-header\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "\">\n  <div class=\"csui-accordion-header-title\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "</div>\n  <div class=\"csui-button-icon cs-icon icon-expandArrowDown\"></div>\n  <div class=\"csui-button-icon cs-icon icon-expandArrowUp\"></div>\n</div>\n<div class=\"csui-accordion-content\">\n  <div class=\"cs-content csui-list-pannel\">\n    <div class=\"cs-list-group\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"widgets") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":9,"column":6},"end":{"line":29,"column":15}}})) != null ? stack1 : "")
    + "    </div>\n  </div>\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_widget.item', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspective.manage/impl/widget.item.view',['require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/perspective.manage/impl/widget.drag.template.view',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/widget.item',
], function (require, _, $, Backbone, Marionette, base,
    widgetDragTemplateView,
    Lang,
    WidgetItemTemplate) {
  'use strict';

  var config = Object.assign({
    dragImageOffsetTop: 50,
    dragImageOffsetLeft: 50
  }, require.moduleConfig('csui/perspective.manage/impl/widget.list.view'));

  var WidgetItemView = Marionette.ItemView.extend({

    constructor: function WidgetItemView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    className: 'csui-module-group',

    template: WidgetItemTemplate,

    templateHelpers: function () {
      var widgetCollection = new Backbone.Collection(this.model.attributes.widgets),
          disableTitle     = Lang.disableTitle,
          idx              = 0;

      widgetCollection.models.forEach(function (model) {
        model.set({
          'draggable': !!model.get('canDragAndDrop'),
          'disableTitle': disableTitle,
          'dataAttr': model.get('id').replace(/\//g, "-"),
          'allowMultiple': !!model.get('allowMultiple'),
          'index': idx++
        }, {'silent': true});
      });
      return {
        widgets: widgetCollection.models
      }
    },

    ui: {
      accordionHeader: '.csui-accordion-header',
      accordionContent: '.csui-accordion-content',
      accordionHeaderIcon: '.csui-accordion-header .cs-icon',
      widget: '.csui-draggable-widget-item'
    },

    events: {
      'click @ui.accordionHeader': "toggle",
      'keydown @ui.accordionHeader': 'toggle',
      'dragstart @ui.widget': 'onDragStart',
      'dragend @ui.widget': 'onDragEnd'
    },

    toggle: function () {
      var isClosed = this.ui.accordionHeader.hasClass('csui-accordion-expand');
      this.ui.accordionHeader.toggleClass("csui-accordion-expand");
      this.options.parentView.$el.find(".csui-module-group").removeClass('csui-accordion-visible')
          .find('.csui-accordion-header').removeClass('csui-accordion-expand');
      if (!isClosed) {
        this.$el.addClass("csui-accordion-visible");
        this.ui.accordionHeader.addClass("csui-accordion-expand");
      }

      base.onTransitionEnd(this.ui.accordionContent, function () {
        this.trigger('widgets:expanded');
      }, this);
    },

    onRender: function () {
      var dndContainer = $('.perspective-editing .csui-dnd-container');
      if (dndContainer.length) {
        // Current perspective using sortable plugin for DnD. Get ready for it.
        this._makeWidgetSortable();
      }
    },

    _makeWidgetSortable: function () {
      var self              = this,
          draggableChildren = this.$el.find('.csui-widget-item.csui-draggable-widget-item'),
          widgetEls         = draggableChildren.parent();
      widgetEls.data('pman.widget', this.model.get('widgets'));
      widgetEls.sortable({
        connectWith: [".perspective-editing .csui-dnd-container",
          ".perspective-editing .pman-trash-area"],
        containment: ".perspective-editing ",
        helper: function (event, ui) {
          // Drag Image
          var widgetModel = ui.data('widget-index');
          self.widgetDragTemplate = new widgetDragTemplateView({
            title: self.model.get("widgets")[widgetModel].get('title'),
            newWidget: self.model.get("widgets")[widgetModel]
          });
          self.widgetDragTemplate.render();
          //Set width and height to prevent jquery ui overriding Drag item width and height
          self.widgetDragTemplate.$el.width('220px');
          self.widgetDragTemplate.$el.height('220px');
          self.widgetDragTemplate.$el.css({opacity: 0.75});
          self.widgetDragTemplate.$el.appendTo(
              self.options.parentView.$el.closest('.pman-pannel-wrapper'));
          return self.widgetDragTemplate.$el;
        },
        tolerance: 'pointer',
        cursorAt: {top: config.dragImageOffsetTop, left: config.dragImageOffsetLeft},
        start: function (event, ui) {
          ui.item.css('display', 'block');
          ui.placeholder.css('display', 'block');
          self.dragStart();
        },
        stop: function () {
          self.dragEnd();
        }
      });
    },

    onDragStart: function (event) {
      var idx          = $(event.currentTarget).data('widget-index'),
          widget       = this.model.get("widgets")[idx],
          dataTransfer = event.originalEvent.dataTransfer;
      var template = $('.csui-template-wrapper');
      template.find(".csui-template-header").text(widget.get("title"));
      if (this._hasNativeDragImageSupport()) {
        dataTransfer.setData("text", JSON.stringify(widget.toJSON()));
        // IE11 doesn't support 'setDragImage'. See `_handleDragImageForIE` function for Drag Image handling in IE.
        dataTransfer.setDragImage(template[0], config.dragImageOffsetLeft,
            config.dragImageOffsetTop);
      }
      this.dragStart();
    },

    _hasNativeDragImageSupport: function () {
      var dataTransfer = window.DataTransfer || window.Clipboard;
      return ("setDragImage" in dataTransfer.prototype);
    },

    onDragEnd: function (event) {
      this.dragEnd();
    },

    dragStart: function () {
      this.$el.closest(".csui-pman-panel").addClass("csui-pman-drag-start");
      $(document.body).addClass('csui-pman-dnd-active');
    },

    dragEnd: function () {
      this.$el.closest(".csui-pman-panel").removeClass("csui-pman-drag-start");
      $(document.body).removeClass('csui-pman-dnd-active');
    }

  });

  return WidgetItemView;

});


csui.define('csui/perspective.manage/impl/widget.list.view',['module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/perspective.manage/impl/options.form.view',
  'csui/perspective.manage/impl/widget.item.view',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'csui/models/widget/widget.collection',
  'hbs!csui/perspective.manage/impl/widget.item',
], function (module, _, $, Backbone, Marionette, 
    WidgetOptionsFormView, WidgetItemView, Lang,
    WidgetCollection,
    WidgetItemTemplate) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    dragImageOffsetTop: 50,
    dragImageOffsetLeft: 50
  });

  var WidgetListView = Marionette.ItemView.extend({
    tagName: 'div',

    template: WidgetItemTemplate,

    constructor: function WidgetListView(options) {
      options || (options = {});
      options.data || (options.data = {});

      options.existsWidgetTypes || (options.existsWidgetTypes = []);
      Marionette.ItemView.call(this, options);
      this.context = this.options.pmanView.context;
      var self = this;
      self.widegtsUpdated = false;
      this.allWidgets = new WidgetCollection();
      this.allWidgets.fetch().done(function () {
        self.collection = self._groupWidgetsByModule();
        // self._sanitiseWidgetLibrary();
        self.render();
        self.trigger("items:fetched");
      });

      // TODO: need to render using collection view instead of rendering all items within item view.
      // By that  events can handle through model instead-of DOM elements.
      this.listenTo(this.context, 'update:widget:panel', _.bind(function (opts) {
        this.widegtsUpdated = true;
        var newEleToBeProcess = opts.widgetModel && opts.widgetModel.type ? opts.widgetModel.type :
                                undefined,
            oldEleToBeProcess = opts.oldWidgetModel && opts.oldWidgetModel.type ?
                                opts.oldWidgetModel.type : undefined;

        if (!!newEleToBeProcess) {
          var nodeIndex = _.indexOf(this.options.existsWidgetTypes, newEleToBeProcess);
          if (nodeIndex >= 0) {
            this.options.existsWidgetTypes.splice(nodeIndex, 1);
          }
          else {
            this.options.existsWidgetTypes.push(newEleToBeProcess);
          }
          newEleToBeProcess = newEleToBeProcess.replace(/\//g, "-");
          var toggleElements = this.$el.find('div[data-widget-type="' + newEleToBeProcess +
                                             '"][data-widget-allow-multiple="false"]');
          toggleElements.length ? toggleElements.toggleClass('binf-hidden') : '';
        }
        if (!!oldEleToBeProcess) {
          var nodeIndex = _.indexOf(this.options.existsWidgetTypes, oldEleToBeProcess);
          if (nodeIndex >= 0) {
            this.options.existsWidgetTypes.splice(nodeIndex, 1);
          }
          oldEleToBeProcess = oldEleToBeProcess.replace(/\//g, "-");
          var toggleElements = this.$el.find('div[data-widget-type="' + oldEleToBeProcess +
                                             '"][data-widget-allow-multiple="false"]');
          toggleElements.length ? toggleElements.toggleClass('binf-hidden') : '';
        }
      }, this));

      this.listenTo(this.context, 'reset:widget:panel', _.bind(function (opts) {
        this.options.existsWidgetTypes = [];
        this.widegtsUpdated = true;
      }, this));
    },

    initialize: function () {
      _.bindAll(this, "renderItem");
    },

    className: 'cs-module-list',

    render: function () {
      this.collection && this.collection.each(this.renderItem);
    },

    renderItem: function (model) {
      var parentView = this;
      var itemView = new WidgetItemView({
        model: model,
        parentView: parentView,
        context: this.context
      });
      itemView.render();
      this.listenTo(itemView, 'widgets:expanded', _.bind(this.trigger, this, 'dom:refresh', this));
      $(this.el).append(itemView.el);
    },

    _groupWidgetsByModule: function () {
      // creates a data model where widgets are grouped according to their module
      var moduleCollection = new Backbone.Collection();
      var widgets = this.allWidgets.filter(function (widget) {
        var manifest = widget.get('manifest');
        if (!manifest || !_.has(manifest, 'title') || !_.has(manifest, 'description') ||
            manifest.deprecated) {
          return false;
        }
        var schema        = JSON.parse(JSON.stringify(manifest.schema || {})),
            options       = JSON.parse(JSON.stringify(manifest.options || {})),
            isValidSchema = WidgetOptionsFormView._normalizeOptions(
                schema.properties, options.fields || {}, {});
        if (!isValidSchema) {
          // Found unknown properties.. hence widget unsupported.
          return false;
        }
        return true;
      });

      _.each(widgets, _.bind(function (widget) {
        var manifest       = _.defaults(widget.get('manifest'), {
              'allowMultiple': true,
              'title': Lang.noTitle
            }),
            canDragAndDrop = manifest.allowMultiple;

        if (!canDragAndDrop) {
          canDragAndDrop = $.inArray(widget.get('id'), this.options.existsWidgetTypes) === -1;
        }

        widget.set({
          'allowMultiple': manifest.allowMultiple,
          'canDragAndDrop': canDragAndDrop,
          'title': manifest.title
        });
      }, this));

      _.each(_.groupBy(widgets, function (widget) {
        return widget.serverModule.id;
      }), function (val, key) {
        var title = _.first(val).serverModule.get('title');
        // remove superfluous OpenText prefix.
        title = title ? title.replace(/OpenText /, '') :
                _.first(val).serverModule.get('id').toUpperCase();
        moduleCollection.add({
          id: key,
          title: title,
          widgets: val
        })
      });
      return moduleCollection;
    },

    _sanitiseWidgetLibrary: function () {
      // checks to see if any widget groups or widgets have been whitelisted or blacklisted
      // alpha-sorts the groups and the widgets within them.
    },

    onInitWidgets: function () {
      this.$el.empty(); // FIXME Make this ItemView as CollectionView
       if(this.widegtsUpdated){
        this.collection = this._groupWidgetsByModule();
        this.widegtsUpdated = false;
      }
      this.render();
    },

  });

  return WidgetListView;

});


csui.define('csui/perspective.manage/sidebar/widget.panel.item.view',[
'csui/utils/base',
'csui/perspective.manage/impl/widget.item.view',
],function ( base, WidgetItemView) {
'use strict'


const WidgetPanelItemView = WidgetItemView.extend({

    constructor: function WidgetPanelItemView(options) {
      options || (options = {});
      WidgetItemView.prototype.constructor.apply(this, arguments);
    },

    initialize: function(options) {
      this.listenTo(this, 'expand:header', this.expandHeader);
    },

    expandHeader: function() {
      this.ui.accordionHeader.addClass("csui-accordion-expand");
      this.$el.addClass("csui-accordion-visible");
      base.onTransitionEnd(this.ui.accordionContent, function () {
          this.trigger('widgets:expanded');
      }, this);
  },

    toggle: function () {
      let isExpanded = this.ui.accordionHeader.hasClass('csui-accordion-expand');

      if(!isExpanded){
        this.options.parentView.el.querySelectorAll(".csui-module-group").forEach(ele=>ele.classList.remove("csui-accordion-visible"));
        this.options.parentView.el.querySelectorAll('.csui-accordion-header').forEach(ele=>ele.classList.remove("csui-accordion-expand"));
      }
      this.el.querySelector(".csui-accordion-header").classList.toggle("csui-accordion-expand");
      this.el.classList.toggle("csui-accordion-visible")

      base.onTransitionEnd(this.ui.accordionContent, function () {
        this.trigger('widgets:expanded');
      }, this);
    },

  });

return WidgetPanelItemView;

});

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/sidebar/impl/search.widget.item',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                <div class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"draggable") : stack1),{"name":"if","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.program(4, data, 0, blockParams, depths),"loc":{"start":{"line":5,"column":28},"end":{"line":5,"column":84}}})) != null ? stack1 : "")
    + "\"\n                     data-widget-type=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"dataAttr") : stack1), depth0))
    + "\"\n                     data-widget-allow-multiple=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"allowMultiple") : stack1), depth0))
    + "\">\n                    <div class=\"csui-widget-item csui-search-widget-item icon-draggable-handle csui-draggable-widget-item\"\n                         data-widget-index=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"index") : stack1), depth0))
    + "\" draggable=\"true\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "\">\n                        <div class=\"csui-search-result-widget\">\n                            <div>\n                                "
    + container.escapeExpression((lookupProperty(helpers,"splitTitle")||(depth0 && lookupProperty(depth0,"splitTitle"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"title") : stack1),(depths[1] != null ? lookupProperty(depths[1],"query") : depths[1]),{"name":"splitTitle","hash":{},"loc":{"start":{"line":12,"column":32},"end":{"line":12,"column":72}}}))
    + "\n                            </div>\n                            <span class=\"csui-search-result-group-title\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"widgetGroupTitle") : stack1), depth0))
    + "</span>\n                        </div>\n                        <div class=\"csui-layout-icon "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"icon") : stack1), depth0))
    + "\"></div>\n                    </div>\n                </div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "";
},"4":function(container,depth0,helpers,partials,data) {
    return " binf-hidden ";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-search-widget-content\">\n    <div class=\"cs-content csui-list-pannel\">\n        <div class=\"cs-list-group\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"widgets") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"loc":{"start":{"line":4,"column":12},"end":{"line":19,"column":21}}})) != null ? stack1 : "")
    + "        </div>\n    </div>\n</div>\n";
},"useDepths":true});
Handlebars.registerPartial('csui_perspective.manage_sidebar_impl_search.widget.item', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/sidebar/impl/search.widget.item',[],function(){});

csui.define('csui/perspective.manage/sidebar/search.widget.item.view',[
  'csui/lib/backbone',
  "csui/lib/handlebars",
  'csui/perspective.manage/impl/widget.item.view',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/sidebar/impl/search.widget.item',
  'css!csui/perspective.manage/sidebar/impl/search.widget.item'
], function (Backbone, Handlebars, WidgetItemView, Lang,
  SearchWidgetItemTemplate) {
  'use strict';

  Handlebars.registerHelper('splitTitle', function (title, query) {
    if (query.length) {
      let html = '';
      let remainingQuery = query;
      const words = title.split(' ');

      words.forEach(function (word, index) {
        let wordHtml = '';

        // If no remaining query, append the word without highlighting
        if (remainingQuery.length === 0) {
          wordHtml += `<span>${word}</span>`;
        } else {
          const wordLower = word.toLowerCase();
          const queryIndex = wordLower.indexOf(remainingQuery);

          // Check if the word contains the remaining query as a substring
          if (queryIndex !== -1) {
            wordHtml += `<span>${word.substring(0, queryIndex)}</span>`;
            wordHtml += `<span class="csui-search-bold-character">${word.substring(queryIndex, queryIndex + remainingQuery.length)}</span>`;
            wordHtml += `<span>${word.substring(queryIndex + remainingQuery.length)}</span>`;
          } else {
            const wordIndex = query.indexOf(wordLower);

            // Check if the remaining query is a combination of multiple words
            if (wordIndex !== -1) {
              const matchedQuery = remainingQuery.substring(0, word.length);
              const matchedQueryIndex = wordLower.indexOf(matchedQuery);
              
              if (matchedQueryIndex !== -1) {
                wordHtml += `<span>${word.substring(0, matchedQueryIndex)}</span>`;
                wordHtml += `<span class="csui-search-bold-character">${word.substring(matchedQueryIndex, matchedQueryIndex + remainingQuery.length)}</span>`;
                wordHtml += `<span>${word.substring(matchedQueryIndex + remainingQuery.length, word.length)}</span>`;
              }
              remainingQuery = remainingQuery.substring(word.length);
            } else {
              wordHtml += `<span>${word}</span>`;
            }
          }
        }
        // Add a space after each word except the last one
        if (index < words.length - 1) {
          wordHtml += ' ';
        }
        html += wordHtml;
      });

      return new Handlebars.SafeString(html);
    }
  });

  const SearchWidgetItemView = WidgetItemView.extend({

    constructor: function SearchWidgetItemView(options) {
      options || (options = {});
      WidgetItemView.prototype.constructor.apply(this, arguments);
    },

    className: 'csui-widget-module-group',

    template: SearchWidgetItemTemplate,

    templateHelpers: function () {
      let widgetCollection = new Backbone.Collection(this.model.attributes.widgets);
      let disableTitle = Lang.disableTitle;
      let idx = 0;
      let widgetGroupTitle = this.model.get('title');

      widgetCollection.models.forEach(function (model) {
        model.set({
          'draggable': !!model.get('canDragAndDrop'),
          'disableTitle': disableTitle,
          'dataAttr': model.get('id').replace(/\//g, "-"),
          'allowMultiple': !!model.get('allowMultiple'),
          'index': idx++,
          'widgetGroupTitle': widgetGroupTitle,
        }, { 'silent': true });
      });
      return {
        widgets: widgetCollection.models,
        query: this.options?.query || "",
      }
    },

  });

  return SearchWidgetItemView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/sidebar/impl/search.no.results',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-empty-search-results\">\n<p class=\"csui-no-search-result-message\" role=\"status\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"noWidgetsFound") || (depth0 != null ? lookupProperty(depth0,"noWidgetsFound") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"noWidgetsFound","hash":{},"loc":{"start":{"line":2,"column":55},"end":{"line":2,"column":73}}}) : helper)))
    + "</p>\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_sidebar_impl_search.no.results', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspective.manage/sidebar/search.no.results.view',[
    'csui/lib/underscore',
    'csui/lib/marionette3',
    'i18n!csui/perspective.manage/impl/nls/lang',
    'hbs!csui/perspective.manage/sidebar/impl/search.no.results'
], function (_, Marionette, lang, template) {
    'use strict';

    const NoSearchResultsView = Marionette.View.extend({
        className: 'csui-empty-search-results',

        template: template,

        templateContext: function () {
            return { noWidgetsFound: lang.noWidgetsFound };
        },

        onRender: function () {
            const noSearchResultsParent = document.querySelector('.csui-sidebar-slide-body .cs-module-list');
            noSearchResultsParent.appendChild(this.el);
        }
    });

    return NoSearchResultsView;
});


csui.define('css!csui/perspective.manage/sidebar/impl/widget.panel.list',[],function(){});

csui.define('csui/perspective.manage/sidebar/widget.panel.list.view',[
'csui/lib/underscore',
'csui/lib/jquery',
'csui/lib/backbone',
'csui/perspective.manage/impl/options.form.view',
'i18n!csui/perspective.manage/impl/nls/lang',
'csui/perspective.manage/impl/widget.list.view',
'csui/perspective.manage/sidebar/widget.panel.item.view',
'csui/perspective.manage/sidebar/search.widget.item.view',
'csui/perspective.manage/sidebar/search.no.results.view',
'css!csui/perspective.manage/sidebar/impl/widget.panel.list.css',
],function (_, $, Backbone, WidgetOptionsFormView, Lang, WidgetListView, WidgetPanelItemView, SearchWidgetItemView, NoSearchResultsView) {
'use strict'

const WidgetPanelListView = WidgetListView.extend({

    constructor: function WidgetPanelListView(options){
        this.options = options || {};
        this.options.data || (options.data = {});
        WidgetListView.prototype.constructor.apply(this, arguments);
        this.noSearchResultsView = new NoSearchResultsView();
    },   
  
    filterWidgetsBySearch: function (allWidgets, query) {
        let widgetNames = this.extractWidgetNames(allWidgets.models);
        let filteredWidgetNames = widgetNames.filter(function(widgetName) {
            return widgetName?.split(" ").join("").toLowerCase().includes(query);
        });
        return allWidgets.filter(function (widget) {
            return filteredWidgetNames.some(function (name) {
                return widget.get('manifest').title?.includes(name);
            });
        });
    },
  
      extractWidgetNames: function (WidgetModels) {
        return WidgetModels.map(function (widgetModel) {
          let widgetName = widgetModel.get('manifest').title?.trim();
          return widgetName;
        });
      },

      _groupWidgetsByModule: function () {
        // creates a data model where widgets are grouped according to their module
        let moduleCollection = new Backbone.Collection();
        if (this.options?.query?.length) {
          let filteredWidgets = this.filterWidgetsBySearch(this.allWidgets, this.options.query);
          if(!filteredWidgets.length){
            this.renderNoSearchResults();
          }
          this.allWidgets = filteredWidgets;
        }
        let widgets = this.allWidgets.filter(function (widget) {
          let manifest = widget.get('manifest');
          if (!manifest || !_.has(manifest, 'title') || !_.has(manifest, 'description') ||
            manifest.deprecated) {
            return false;
          }
          let schema = JSON.parse(JSON.stringify(manifest.schema || {})),
            options = JSON.parse(JSON.stringify(manifest.options || {})),
            isValidSchema = WidgetOptionsFormView._normalizeOptions(
              schema.properties, options.fields || {}, {});
          if (!isValidSchema) {
            // Found unknown properties.. hence widget unsupported.
            return false;
          }
          return true;
        });

        _.each(widgets, _.bind(function (widget) {
          let manifest = _.defaults(widget.get('manifest'), {
            'allowMultiple': true,
            'title': Lang.noTitle
          }),
            canDragAndDrop = manifest.allowMultiple;
  
          if (!canDragAndDrop) {
            canDragAndDrop = $.inArray(widget.get('id'), this.options.existsWidgetTypes) === -1;
          }
  
          widget.set({
            'allowMultiple': manifest.allowMultiple,
            'canDragAndDrop': canDragAndDrop,
            'title': manifest.title
          });
        }, this));
  
        _.each(_.groupBy(widgets, function (widget) {
          return widget.serverModule.id;
        }), function (val, key) {
          let title = _.first(val).serverModule.get('title');
          // remove superfluous OpenText prefix.
          title = title ? title.replace(/OpenText /, '') :
            _.first(val).serverModule.get('id').toUpperCase();
          moduleCollection.add({
            id: key,
            title: title,
            widgets: val
          })
        });
        return moduleCollection;
      },

      renderItem: function (model) {
        let parentView = this;
        const itemView = this.options.query?.length
        ? new SearchWidgetItemView({ model, parentView, context: this.context, query: this.options.query })
        : new WidgetPanelItemView({ model, parentView, context: this.context });
        itemView.render();
        this.listenTo(itemView, 'widgets:expanded', _.bind(this.trigger, this, 'dom:refresh', this));
        if (this.options?.query) {
          itemView.trigger('expand:header');
      }
        $(this.el).append(itemView.el);
      },

      renderNoSearchResults: function () {
        return  this.noSearchResultsView.render();
      }
  
})

return WidgetPanelListView;

});

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/sidebar/impl/widget.panel',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"csui-search-widget-view\"></div>\n<div class=\"csui-widget-list-panel csui-normal-scrolling\"></div>\n\n";
}});
Handlebars.registerPartial('csui_perspective.manage_sidebar_impl_widget.panel', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/sidebar/impl/widget.panel',[],function(){});

csui.define('csui/perspective.manage/sidebar/widget.panel.view',['csui/lib/underscore', 'csui/lib/marionette3',
    'csui/perspective.manage/sidebar/search.widget.view',
    'csui/perspective.manage/sidebar/widget.panel.list.view',
    'hbs!csui/perspective.manage/sidebar/impl/widget.panel',
    'css!csui/perspective.manage/sidebar/impl/widget.panel',
],
    function ( _, Marionette, SearchWidgetView, WidgetPanelListView , template) {
        'use strict';

        let WidgetPanelView = Marionette.View.extend({

            template: template,

            className: "csui-new-widget-panel",

            ui: {
                widgetTab: ".csui-widget-list-panel",
            },

            regions: {
                searchRegion: ".csui-search-widget-view",
                accordionRegion: ".csui-widget-list-panel"
            },

            constructor: function WidgetPanelView(options) {
                this.options = options || {};
                this.options.data || (options.data = {});
                this.options.pmanView = options.context.pmanView;
                this.options.existsWidgetTypes = this._getExistsWidgetTypes() || [];
                Marionette.View.prototype.constructor.apply(this, arguments);
            },

            onRender: function () {
                this.showChildView('searchRegion', new SearchWidgetView(this.options));
                let accordionView = new WidgetPanelListView(this.options);
                this.showChildView('accordionRegion', accordionView);
    
                this.listenTo(this.getChildView('searchRegion'), 'search:performed', function (query) {
                    // TODO: Create a new collection view for search results view
                    let widgetSearchResultsView = new WidgetPanelListView(_.extend({
                        query: query,
                    }, this.options));
                    this.showChildView('accordionRegion', widgetSearchResultsView);
                });
    
                this.listenTo(this.getChildView('searchRegion'), 'search:closed', function () {
                    let accordionView = new WidgetPanelListView(this.options);
                    this.showChildView('accordionRegion', accordionView);
                })
            },
    

            _getExistsWidgetTypes: function () {
                let perspective = this.options.context.perspective;
                let type = perspective.get('type');
                let perpeCollection = {};
                let existsWidgetTypes = [];

                if (type == 'flow') {
                    perpeCollection = perspective.get('options');
                    perpeCollection.widgets.forEach(
                        _.bind(function (widget) {
                            if (!!widget.type) {
                                existsWidgetTypes.push(widget.type);
                            }
                        }, this));
                } else if (type == 'left-center-right') {
                    perpeCollection = perspective.get('options');
                    perpeCollection.center && existsWidgetTypes.push(perpeCollection.center.type);
                    perpeCollection.right && existsWidgetTypes.push(perpeCollection.right.type);
                    perpeCollection.left && existsWidgetTypes.push(perpeCollection.left.type);
                }
                return existsWidgetTypes;
            },
        })

        return WidgetPanelView;
    })
;

csui.define('csui/perspective.manage/sidebar/widgets',['csui/models/sidebar.item',
  'csui/perspective.manage/sidebar/widget.panel.view',
  'i18n!csui/perspective.manage/sidebar/impl/nls/lang'
], function (SidebarItemModel, WidgetPanelView, Lang) {
  'use strict';

  let WidgetsModel = SidebarItemModel.extend({

    defaults: {
      signature: "Widgets",
      sequence: 2,
      name: Lang.widgets,
      iconClass: "csui-sidebar-widget-btn",
      panelTitle: Lang.widgets,
    },

    getPanelView: function (options) {
      return new WidgetPanelView(options);
    }

  });

  return WidgetsModel;

});


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/error.global.json',{
  "type": "left-center-right",
  "options": {
    "center": {
      "type": "csui/widgets/error.global"
    }
  }
}
);


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/placeholder/impl/placeholder',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"label") || (depth0 != null ? lookupProperty(depth0,"label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"label","hash":{},"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":9}}}) : helper)))
    + "\n";
}});
Handlebars.registerPartial('csui_widgets_placeholder_impl_placeholder', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/placeholder/impl/placeholder',[],function(){});

csui.define('csui/widgets/placeholder/placeholder.view',['csui/lib/backbone', 'csui/lib/marionette',
  'hbs!./impl/placeholder', 'css!./impl/placeholder'
], function (Backbone, Marionette, placeholderTemplate) {

  var PlaceholderView = Marionette.ItemView.extend({

    className: 'cs-placeholder tile',
    template: placeholderTemplate,

    constructor: function PlaceholderView(options) {
      options || (options = {});
      options.data || (options.data = {});
      if (!options.model) {
        options.model = new Backbone.Model({
          label: options.data.label,
          bgcolor: options.data.bgcolor,
          color: options.data.color
        });
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
    },

    onRender: function () {
      this.$el.css({
        color: this.model.get('color'),
        backgroundColor: this.model.get('bgcolor')
      });
    }

  });

  return PlaceholderView;
});


csui.define('csui/widgets/recentlyaccessed/recentlyaccessed.columns',["csui/lib/backbone"], function (Backbone) {

  var TableColumnModel = Backbone.Model.extend({

    idAttribute: "key",

    defaults: {
      key: null,  // key from the resource definitions
      sequence: 0 // smaller number moves the column to the front
    }

  });

  var TableColumnCollection = Backbone.Collection.extend({

    model: TableColumnModel,
    comparator: "sequence",

    getColumnKeys: function () {
      return this.pluck('key');
    },

    deepClone: function () {
      return new TableColumnCollection(
          this.map(function (column) {
            return column.attributes;
          }));
    }

  });

  // Fixed (system) columns have sequence number < 100, dynamic columns
  // have sequence number > 1000

  var RecentlyAccessedTableColumns = new TableColumnCollection([
    {
      key: 'type',
      titleIconInHeader: 'mime_type',
      sequence: 10
    },
    {
      key: 'name',
      sequence: 20
    },
    {
      key: 'reserved',
      title: 'State',
      sequence: 30,
      noTitleInHeader: true // don't display a column header
    },
    {
      key: 'parent_id',
      sequence: 40
    },
    {
      key: 'access_date_last',
      sequence: 50
    },
    {
      key: 'size',
      sequence: 60
    },
    {
      key: 'modify_date',
      sequence: 70
    },
    {
      key: 'favorite',
      sequence: 910,
      noTitleInHeader: true, // don't display a column header
      permanentColumn: true // don't wrap column due to responsiveness into details row
    }
  ]);

  return RecentlyAccessedTableColumns;

});


csui.define('csui/widgets/recentlyaccessed/tileview.toolbaritems',['csui/lib/underscore',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  // Load extra tool items to be added to this collection
  'csui-ext!csui/widgets/recentlyaccessed/tileview.toolbaritems'
], function (_, lang, ToolItemsFactory, TooItemModel, extraToolItems) {
  'use strict';
  var toolbarItems = {

    // inline action bar
    inlineActionbar: new ToolItemsFactory({
          inspect: [
            {
              signature: "Properties",
              name: lang.ToolbarItemInfo,
              commandData: {dialogView: true},
              iconName: "csui_action_properties32"
            }
          ],
          info: [
            {
              signature: "View", 
              name: lang.ToolbarItemView,
              iconName: "csui_action_preview32",
              flyout: 'view'
            },
          ],
          share: [
            {
              signature: "CopyLink", name: lang.ToolbarItemCopyLink,
              iconName: "csui_action_copy_link32"
            }
          ],
          edit: [
            {
              signature: "Edit", name: lang.ToolbarItemEdit,
              iconName: "csui_action_edit32"
            }
          ],
          other: [
            {
              signature: "Download", name: lang.ToolbarItemDownload,
              iconName: "csui_action_download32"
            },
            {
              signature: "goToLocation", name: lang.ToolbarGoToLocation
            }
          ]
        },
        {
          maxItemsShown: 1,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        })
  };

  if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }

  function addExtraToolItems(extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(toolItems, function (toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return toolbarItems;

});


csui.define('csui/widgets/recentlyaccessed/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/recentlyaccessed/impl/nls/root/lang',{
  dialogTitle: 'Recently Accessed',
  searchTitle: 'Search Recently Accessed',
  searchPlaceholder: 'Recently Accessed',
  searchAria: 'Search for recently accessed objects',
  expandAria: 'Expand the Recently Accessed widget',
  emptyListText: 'There are no items to display.',
  loadingListText: 'Loading results...',
  loadingText: "Loading recently accessed",
  failedListText: 'Loading results failed.',
  // Note: use the exact 'column_key' for the client-side column titles
  access_date_last: 'Last Accessed',
  parent_id: 'Location',
  openRecentlyAccessedView: 'Open recently accessed view'
});




csui.define('css!csui/widgets/recentlyaccessed/impl/recentlyaccessed',[],function(){});

// Shows a list of links to current user's recently accessed nodes
csui.define('csui/widgets/recentlyaccessed/recentlyaccessed.view',['require', 'module', 'csui/lib/underscore', 'csui/lib/marionette',
  'csui/controls/list/list.view',
  'csui/controls/listitem/listitemstandard.view',
  'csui/behaviors/expanding/expanding.behavior',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/list/behaviors/list.view.keyboard.behavior',
  'csui/behaviors/collection.state/collection.state.behavior',
  'csui/controls/list/list.state.view',
  'csui/utils/contexts/factories/recentlyaccessed',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/controls/progressblocker/blocker',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/commands',
  'csui/widgets/recentlyaccessed/tileview.toolbaritems',
  'csui/controls/globalmessage/globalmessage',
  'csui/controls/tile/behaviors/infinite.scrolling.behavior',
  'csui/behaviors/limiting/limiting.behavior',
  'csui/behaviors/collection.error/collection.error.behavior',
  'csui/utils/base',
  'i18n!csui/widgets/recentlyaccessed/impl/nls/lang',
  'i18n!csui/controls/listitem/impl/nls/lang',
  'css!csui/widgets/recentlyaccessed/impl/recentlyaccessed'
], function (require, module, _, Marionette, ListView, ListItemStandard,
    ExpandingBehavior, DefaultActionBehavior, TabableRegionBehavior,
    ListViewKeyboardBehavior, CollectionStateBehavior, ListStateView,
    RecentlyAccessedCollectionFactory, NodeTypeIconView, BlockingView, ApplicationScopeModelFactory,
    commands, tileViewToolbarItems, GlobalMessage, InfiniteScrollingBehavior, LimitingBehavior,
    CollectionErrorBehavior, base, lang, listItemLang) {
  'use strict';
  var limitingConfig = require.moduleConfig('csui/behaviors/limiting/limiting.behavior');
  var config = _.defaults({}, module.config(), limitingConfig, {
      openInPerspective: true,
      limit: 25,
      filterByProperty : "name"
    });

  //
  // Constructor options:
  // - showTitleIcon: boolean to show or hide the icon in the title bar
  //
  var infiniteScrollFlag = RecentlyAccessedCollectionFactory.getInfiniteScrollFlag();
  var RecentlyAccessedView = ListView.extend({

    constructor: function RecentlyAccessedView(options) {
      options || (options = {});
      _.defaults(options, {
        orderBy: 'access_date_last desc',
        refetchNodeActions: true
      });
      options.data || (options.data = {});
      options.data.titleBarIcon = options.data.showTitleIcon === false ?
                                  undefined : 'title-icon title-recentlyaccessed';

      options.tileViewToolbarItems = tileViewToolbarItems;
      this.context = options.context;
      this.showInlineActionBar = options.showInlineActionBar === false ?
                                 options.showInlineActionBar : true;

      var context        = options.context,
          viewStateModel = context && context.viewStateModel;
      this._enableOpenPerspective = config.openInPerspective &&
                                    viewStateModel && viewStateModel.get('history');
      var nonPromotedActionCommands = commands.getSignatures(tileViewToolbarItems);
      var collection = options.collection ||
                       options.context.getCollection(RecentlyAccessedCollectionFactory, {
                         options: {
                           promotedActionCommands: [],
                           nonPromotedActionCommands: nonPromotedActionCommands
                         }
                       });
      var limitedRS = RecentlyAccessedCollectionFactory.getLimitedResourceScope();
      //add editpermissions command action to fetch node level edit permissions - LPAD-72260
      limitedRS && limitedRS.commands && limitedRS.commands.push('editpermissions');
      collection.setResourceScope(limitedRS);
      collection.setEnabledDelayRestCommands(false);
      collection.setEnabledLazyActionCommands(false); 
      this.collection = collection;
      ListView.prototype.constructor.call(this, options);
      if(infiniteScrollFlag){
        this.listenTo(this, 'change:filterValue', this.applyFilter);
      }
      this.listenTo((this.completeCollection || this.collection), 'error',
      function (collection, request, options) {
        var error = new base.Error(request);
        GlobalMessage.showMessage('error', error.message);
      });
      this.loadingText = lang.loadingText;
      BlockingView.imbue(this);
      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
    },
    childEvents: {
      'click:item': 'onClickItem',
      'render': 'onRenderItem',
      'before:destroy': 'onBeforeDestroyItem'
    },

    templateHelpers: function () {
      return {
        title: this.options.data.title || lang.dialogTitle,
        icon: this.options.data.titleBarIcon,
        searchPlaceholder: lang.searchPlaceholder,
        searchTitle: lang.searchTitle,
        searchAria: lang.searchAria,
        expandAria: lang.expandAria,
        openPerspectiveAria: lang.openRecentlyAccessedView,
        openPerspectiveTooltip: lang.openRecentlyAccessedView,
        enableOpenPerspective: this._enableOpenPerspective
      };
    },

    childView: ListItemStandard,
    childViewOptions: function () {
      var toolbarData = this.showInlineActionBar ? {
        toolbaritems: this.options.tileViewToolbarItems,
        collection: this.completeCollection
      } : undefined;

      return {
        templateHelpers: function () {
          return {
            name: this.model.get('short_name'),
            enableIcon: true,
            showInlineActionBar: this.showInlineActionBar,
            itemLabel: _.str.sformat(listItemLang.itemTitleLabel, this.model.get('short_name'))
          };
        },
        context: this.context,
        checkDefaultAction: true,
        // Set these values in order to display Inline Actions
        toolbarData: toolbarData,
        refetchNodeActions: this.options.refetchNodeActions
      };
    },
    behaviors: {
      LimitedList: {
        // the object is merged from properties of two behaviour, which do not conflict with each other.
        behaviorClass: infiniteScrollFlag ? InfiniteScrollingBehavior:LimitingBehavior,
        contentParent: ".tile-content",
        completeCollection: function () {
          //add edit permissions Action
          var nonPromotedActionCommands = commands.getSignatures(tileViewToolbarItems);
          var collection = this.options.collection ||
                           this.options.context.getCollection(RecentlyAccessedCollectionFactory, {
                             options: {
                               promotedActionCommands: [],
                               nonPromotedActionCommands: nonPromotedActionCommands
                             }
                           });
          var limitedRS = RecentlyAccessedCollectionFactory.getLimitedResourceScope();
          //add editpermissions command action to fetch node level edit permissions - LPAD-72260
          limitedRS && limitedRS.commands && limitedRS.commands.push('editpermissions');
          collection.setResourceScope(limitedRS);
          collection.setEnabledDelayRestCommands(false);
          collection.setEnabledLazyActionCommands(false);
          return collection;
        },
        limit: 0
      },
      ExpandableList: {
        behaviorClass: ExpandingBehavior,
        expandedView: 'csui/widgets/recentlyaccessedtable/recentlyaccessedtable.view',
        orderBy: function () { return this.options.orderBy; },
        titleBarIcon: function () { return this.options.data.titleBarIcon; },
        dialogTitle: lang.dialogTitle,
        dialogTitleIconNameRight: "csui_action_minimize32",
        dialogClassName: 'recentlyaccessed'
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      ListViewKeyboardBehavior: {
        behaviorClass: ListViewKeyboardBehavior
      },
      CollectionState: {
        behaviorClass: CollectionStateBehavior,
        collection: function () {
          return this.completeCollection;
        },
        stateView: ListStateView,
        stateMessages: {
          empty: lang.emptyListText,
          loading: lang.loadingListText,
          failed: lang.failedListText
        }
      }
    },

    filterChanged: function () {
      var filterValue = this.ui.searchInput.val();

      if (this.lastFilterValue !== filterValue) {
        this.lastFilterValue = filterValue;
        var self = this;
        if (this.filterTimeout) {
          clearTimeout(this.filterTimeout);
        }
        this.filterTimeout = setTimeout(function () {
          self.filterTimeout = undefined;
          ListView.prototype.filterChanged.apply(self, arguments);
        }, 1000);
      }
    },

    applyFilter : function () {
      var keywords = this.options.filterValue.toLowerCase().split(' ');
      var filterByProperty = config.filterByProperty;

      // server side filtering
      var filterObj = {};
      filterObj[filterByProperty] = this.options.filterValue.toLowerCase();
      if (this.collection.fetching) {
        this.filterValuePending = filterObj;
      } else {
        this.collection.resetLimit(false);
        this.collection.setFilter(filterObj);
      }
    },
    onRender: function () {
      ListView.prototype.onRender.apply(this, arguments);
      this.$el.addClass('cs-recentlyaccessed');
    },
    onRenderItem: function (childView) {
      childView._nodeIconView = new NodeTypeIconView({
        el: childView.$('.csui-type-icon').get(0),
        node: childView.model
      });
      childView._nodeIconView.render();

      if(this.completeCollection && this.completeCollection.length) {
        childView.$el.attr('role', 'option');
      }
      childView.$el.attr('aria-label',
          _.str.sformat(listItemLang.typeAndNameAria, childView._nodeIconView.model.get('title'),
              childView.model.get('short_name')));
    },

    onBeforeDestroyItem: function (childView) {
      if (childView._nodeIconView) {
        childView._nodeIconView.destroy();
      }
    },

    onClickItem: function (target) {
      this.triggerMethod('execute:defaultAction', target.model);
    },

    onClickHeader: function (target) {
      this.onClickOpenPerspective(target);
    },

    onClickOpenPerspective: function (target) {
      this.applicationScope.set('id', 'recentlyaccessed');
      this.trigger('open:recentlyaccessed:perspective');
    }

  });

  return RecentlyAccessedView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/shortcut/impl/shortcut',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"tile-header\">\n  <div class=\"tile-title\">\n    <h2 class=\"csui-heading\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"short_name") || (depth0 != null ? lookupProperty(depth0,"short_name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"short_name","hash":{},"loc":{"start":{"line":3,"column":29},"end":{"line":3,"column":43}}}) : helper)))
    + "</h2>\n  </div>\n</div>\n\n<div class=\"tile-icon\">\n  <div class=\"icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"icon") || (depth0 != null ? lookupProperty(depth0,"icon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon","hash":{},"loc":{"start":{"line":8,"column":19},"end":{"line":8,"column":27}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":8,"column":36},"end":{"line":8,"column":45}}}) : helper)))
    + "\"></div>\n</div>\n";
}});
Handlebars.registerPartial('csui_widgets_shortcut_impl_shortcut', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/widgets/shortcut/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/shortcut/impl/nls/root/lang',{
  loadingText: 'Loading...'
});




csui.define('css!csui/widgets/shortcut/impl/shortcut',[],function(){});

// Shows the Shortcut widget of a specific node
csui.define('csui/widgets/shortcut/shortcut.view',[
  'csui/lib/backbone', 'csui/lib/marionette',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/behaviors/item.error/item.error.behavior',
  'csui/utils/contexts/factories/node', 'csui/utils/node.links/node.links',
  'csui/utils/defaultactionitems', 'csui/utils/commands',
  'hbs!csui/widgets/shortcut/impl/shortcut',
  'i18n!csui/widgets/shortcut/impl/nls/lang',
  'css!csui/widgets/shortcut/impl/shortcut',
], function (Backbone, Marionette, DefaultActionBehavior, TabableRegionBehavior,
    ItemErrorBehavior, NodeModelFactory, nodeLinks, defaultActionItems, commands,
    shortcutTemplate, lang) {
  'use strict';

  //
  // Constructor options:
  // - node.id: The object (node) ID.  Either node.id or node.type is mandatory.
  // - node.type: The object type for known volumes (e.g. type=141 for Enterprise Workspace)
  // - icon: css icon class
  // - background: css background class
  //
  var ShortcutView = Marionette.ItemView.extend({
    tagName: 'a',

    attributes: {
      href: '#'
    },

    className: function () {
      var background = this.options.data.background || 'cs-tile-background-default';
      return 'cs-shortcut tile ' + background;
    },

    modelEvents: {
      'change': 'render'
    },

    triggers: {
      'click': 'click:link'
    },

    template: shortcutTemplate,

    templateHelpers: function () {
      var name, short_name, first_space;
      if (this.model.fetched) {
        name = this.getName();
        short_name = name.length > 38 ? name.substr(0, 38) + '...' : name;
        first_space = short_name.indexOf(' ');
        if (short_name.length >= 20 && (first_space < 0 || first_space > 20)) {
          short_name = short_name.substr(0, 18) + '...';
        }
      } else {
        short_name = lang.loadingText;
      }
      return {
        short_name: short_name,
        icon: this.options.data.icon || "icon-folder",
        title: name
      };
    },

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },

      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },

      ItemError: {
        behaviorClass: ItemErrorBehavior
      }
    },

    events: {"keydown": "onKeyInView"},

    currentlyFocusedElement: function () {
      return this.$el;
    },

    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        // space(32) or enter(13)
        event.preventDefault();
        event.stopPropagation();
        this.triggerMethod("click:link");
      }
    },

    constructor: function ShortcutView(options) {
      options || (options = {});
      options.data || (options.data = {});
      if (!options.model) {
        options.model = options.context.getModel(NodeModelFactory, {
          attributes: {
            id: options.data.id || 'volume',
            type: options.data.type
          }
        });
      }

      Marionette.ItemView.prototype.constructor.call(this, options);

      // Limit the scope of the response
      this.model.excludeResources();
      this.model.resetFields();
      this.model.setFields({
        'properties': ['container', 'id', 'name', 'original_id', 'type'],
        'versions.element(0)': ['mime_type']
      });
      this.model.resetExpand();
      this.model.setExpand({
        properties: ['original_id']
      });
      this.model.resetCommands();
      this.model.setCommands(defaultActionItems.getAllCommandSignatures(commands));
    },

    onRender: function () {
      var disabled = !this.model.fetched ||
                     !this.defaultActionController.hasAction(this.model);
      this.$el[disabled ? 'addClass' : 'removeClass']('csui-disabled');
      this.$el.attr('href', nodeLinks.getUrl(this.model) || '#');
    },

    getName: function() {
      if(( this.options.data.displayName || "" ).trim().length > 0) {
        return this.options.data.displayName;
      } else {
        return this.model.get('name') || '';
      }
    },

    onClickLink: function () {
      this.triggerMethod('execute:defaultAction', this.model);
    }
  });

  return ShortcutView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/shortcuts/impl/shortcut/impl/small.shortcut',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-details\">\n    <div class=\"tile-icon\">\n        <div class=\"icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"icon") || (depth0 != null ? lookupProperty(depth0,"icon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon","hash":{},"loc":{"start":{"line":3,"column":25},"end":{"line":3,"column":33}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":42},"end":{"line":3,"column":50}}}) : helper)))
    + "\" aria-hidden=\"true\"></div>\n    </div>\n\n    <div class=\"tile-title\">\n        <span class=\"csui-heading binf-line-clamp\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":7,"column":51},"end":{"line":7,"column":59}}}) : helper)))
    + "</span>\n    </div>\n</div>\n";
}});
Handlebars.registerPartial('csui_widgets_shortcuts_impl_shortcut_impl_small.shortcut', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/shortcuts/impl/shortcut/impl/medium.shortcut',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-details\">\n    <div class=\"tile-icon\">\n        <div class=\"icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"icon") || (depth0 != null ? lookupProperty(depth0,"icon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon","hash":{},"loc":{"start":{"line":3,"column":25},"end":{"line":3,"column":33}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":42},"end":{"line":3,"column":50}}}) : helper)))
    + "\" aria-hidden=\"true\"></div>\n    </div>\n\n    <div class=\"tile-title\">\n        <span class=\"csui-heading binf-line-clamp\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"shortcutAria") || (depth0 != null ? lookupProperty(depth0,"shortcutAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"shortcutAria","hash":{},"loc":{"start":{"line":7,"column":63},"end":{"line":7,"column":79}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":7,"column":81},"end":{"line":7,"column":89}}}) : helper)))
    + "</span>\n    </div>\n</div>\n";
}});
Handlebars.registerPartial('csui_widgets_shortcuts_impl_shortcut_impl_medium.shortcut', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/shortcuts/impl/shortcut/impl/large.shortcut',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"tile-group\">\n    <div class=\"tile-icon\">\n        <div class=\"icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"icon") || (depth0 != null ? lookupProperty(depth0,"icon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon","hash":{},"loc":{"start":{"line":3,"column":25},"end":{"line":3,"column":33}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":42},"end":{"line":3,"column":50}}}) : helper)))
    + "\" aria-hidden=\"true\"></div>\n    </div>\n    <div class=\"tile-title\">\n        <span class=\"csui-heading binf-line-clamp\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"shortcutAria") || (depth0 != null ? lookupProperty(depth0,"shortcutAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"shortcutAria","hash":{},"loc":{"start":{"line":6,"column":63},"end":{"line":6,"column":79}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":6,"column":81},"end":{"line":6,"column":89}}}) : helper)))
    + "</span>\n    </div>\n</div>\n";
}});
Handlebars.registerPartial('csui_widgets_shortcuts_impl_shortcut_impl_large.shortcut', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/widgets/shortcuts/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/shortcuts/impl/nls/root/lang',{
  loadingText: 'Loading shortcuts...',
  shortcutPrefixAria: 'Shortcut to {0}',
  addShortcut: 'Add shortcut',
  removeShortcut: 'Remove shortcut',
  removeShortcutCnfrmMsg: 'Shortcut will be removed from the group.',
  groupAria: 'Shortcut Group',
  emptyGroup: 'Add a shortcut to the group. Max. 4 shortcuts can be added',
  maxItemsGroup: 'Shortcut group, 4 shortcuts added. Press "Enter" to access the list of shortcuts. Press "Ctrl+ Right or Left Arrow" to move the shortcut group to the right or left.',
  addShortcutToGroup: 'Add shortcut to the group',
  shortcutSettings: '{0} shortcut settings',
  accessShortcutActions: 'Shortcut {0}, press ENTER to access its actions',
  shortcutGroupWithOneItem: 'Shortcut Group. {0} shortcut added. {1} more can be added. Press Enter to access the list of shortcuts. Press Ctrl+ Right or Left Arrow to move the shortcut group to the right or left.',
  shortcutGroupWithMixedItems: 'Shortcut Group. {0} shortcuts added. {1} more can be added. Press Enter to access the list of shortcuts. Press Ctrl+ Right or Left Arrow to move the shortcut group to the right or left.',
  removeShortcutItem: 'Remove {0} Shortcut'
});




csui.define('csui/controls/mixins/shortcuts.view/shortcuts.view.mixin',['csui/lib/underscore', 'csui/utils/contexts/factories/node'
], function (_, NodeModel) {
    'use strict';

    var ShortcutsViewMixin = {

        createDetailListForShortcuts: function (shortcutItems) {
            const backgroundImagePromiseList = []
            Array.isArray(shortcutItems) && shortcutItems.forEach(shortcutItem => {
                const node = this.createMainNode(shortcutItem);
                shortcutItem.node = node;
                const backgroundImageNode = this.createNode4BackgroundImage(shortcutItem.customBackgroundImage);                
                backgroundImageNode && backgroundImagePromiseList.push(backgroundImageNode.fetch({suppressError: true}));
            });
            return backgroundImagePromiseList;
        },
        createMainNode: function(shortcutItem){
            return this.options.context.getModel(NodeModel, {
                attributes: {
                    id: shortcutItem.id || shortcutItem.launchButtonID || 'volume',
                    type: shortcutItem.type
                },
                options: {
                    fields: {
                        'properties': ['container', 'id', 'name', 'original_id', 'type', 'custom_view_search','image_url'],
                        'versions.element(0)': ['mime_type']
                    }
                }
            });
        },
        createNode4BackgroundImage: function(backgroundImageNodeId){
            if(!backgroundImageNodeId) return;
            return this.options.context.getModel(NodeModel, {
                attributes: { id: backgroundImageNodeId },
                options: {
                    fields: {
                        properties: ['deploy_url','mime_type','modify_date','name','id'],
                            'versions.element(0)': ['owner_id','version_number'],
                            nicknames: ['nickname']                    
                    }
                }
            });
        }
    };

    return ShortcutsViewMixin;

});


csui.define('css!csui/widgets/shortcuts/impl/shortcut/impl/shortcut',[],function(){});

csui.define('css!csui/widgets/shortcuts/impl/shortcut/impl/small.shortcut',[],function(){});

csui.define('css!csui/widgets/shortcuts/impl/shortcut/impl/medium.shortcut',[],function(){});

csui.define('css!csui/widgets/shortcuts/impl/shortcut/impl/large.shortcut',[],function(){});

// Shows the Shortcuts widget of specific nodes
csui.define('csui/widgets/shortcuts/impl/shortcut/shortcut.view',[
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/lib/backbone',
    'csui/lib/marionette',
    'csui/utils/base',
    'csui/behaviors/default.action/default.action.behavior',
    'csui/behaviors/item.error/item.error.behavior',
    'csui/utils/url',
    'csui/utils/contexts/factories/node',
    'csui/utils/defaultactionitems',
    'csui/utils/commands',
    'csui/utils/node.links/node.links',
    'hbs!csui/widgets/shortcuts/impl/shortcut/impl/small.shortcut',
    'hbs!csui/widgets/shortcuts/impl/shortcut/impl/medium.shortcut',
    'hbs!csui/widgets/shortcuts/impl/shortcut/impl/large.shortcut',
    'i18n!csui/widgets/shortcuts/impl/nls/lang',
    'csui/utils/high.contrast/detector!',
    'csui/controls/mixins/shortcuts.view/shortcuts.view.mixin',
    'csui/utils/contexts/factories/connector',
    'csui/controls/node-type.icon/node-type.icon.item.view.mixin',
    'css!csui/widgets/shortcuts/impl/shortcut/impl/shortcut',
    'css!csui/widgets/shortcuts/impl/shortcut/impl/small.shortcut',
    'css!csui/widgets/shortcuts/impl/shortcut/impl/medium.shortcut',
    'css!csui/widgets/shortcuts/impl/shortcut/impl/large.shortcut'
], function (
    _,
    $,
    Backbone,
    Marionette,
    base,
    DefaultActionBehavior,
    ItemErrorBehavior,
    Url,
    NodeModelFactory,
    defaultActionItems,
    commands,
    nodeLinks,
    smallShortcutTemplate,
    mediumShortcutTemplate,
    largeShortcutTemplate,
    lang,
    highContrast,
    ShortcutsViewMixin,
    ConnectorFactory,
    NodeTypeIconItemViewMixin) {

    'use strict';

    //
    // Constructor options:
    // - node.id: The object (node) ID.  Either node.id or node.type is mandatory.
    // - node.type: The object type for known volumes (e.g. type=141 for Enterprise Workspace)
    // - icon: css icon class
    // - theme: css theme class
    //
    var ShortcutView = Marionette.ItemView.extend({

        constructor: function MiniShortcutView(options) {
            options || (options = {});
            options.model = options.model || new Backbone.Model();
            options.model.set(_.defaults(options.model.attributes, {
                icon: ShortcutView.DEFAULT_ICON,
                theme: 'csui-shortcut-theme-grey-shade1',
                layout: 'small',
                id: '',
                displayName: '',
                customBackgroundColor: '',
                customBackgroundImage: ''
            }));

            if (highContrast === 2) {
                options.model.set('icon', ShortcutView.BLACK_FOLDER_ICON)
            }

            Marionette.ItemView.prototype.constructor.call(this, options);
            this.node = this.model.get('node');
            if (!this.node) {
                this._ensureNode();
            }
            this._ensureNodeFetched();
        },

        tagName: 'a',

        className: function () {
            var classArr = [],
                customBackgroundImage = this.model.get('customBackgroundImage'),
                customBackgroundColor = this.model.get('customBackgroundColor');

            classArr.push('csui-shortcut-item');
            classArr.push('csui-acc-focusable');
            classArr.push(this.model.get('theme'));
            classArr.push('csui-' + this.model.get('layout'));

            // add classes needed for custom background
            if (customBackgroundColor || customBackgroundImage) {
                classArr.push('cs-background-custom');
            }
            if (customBackgroundImage) {
                classArr.push('cs-background-image');
            }

            return classArr.join(' ');
        },

        getTemplate: function () {
            switch (this.model.get('layout')) {
                case 'small':
                    return smallShortcutTemplate;
                case 'medium':
                    return mediumShortcutTemplate;
                default:
                    return largeShortcutTemplate;
            }
        },

        templateHelpers: function () {
            var scName = this.getName();
            return {
                icon: this.model.get('icon') || ShortcutView.DEFAULT_ICON,
                name: scName,
            };
        },

        behaviors: {
            DefaultAction: {
                behaviorClass: DefaultActionBehavior
            },
            ItemError: {
                behaviorClass: ItemErrorBehavior,
                model: function () {
                    return this.options.model.get('node');
                },
                errorViewOptions: function () {
                    return {
                        low: this.model.get('layout') === 'small'
                    };
                }
            }
        },

        modelEvents: {
            change: 'render',
            'change:shortcutTheme': '_onThemeChange',
            'change:customBackgroundColor': '_onCustomBackgroundColorChange',
            'change:customBackgroundImage': '_onCustomBackgroundImageChange',
            'change:id': '_ensureNode',
            'change:type': '_ensureNode'
        },

        events: {
            'click': 'onClicked',
            'keydown': 'onKeyInView'
        },

        onRender: function () {
            this._updateElement();
            this._ensureBackgroundImageNodeThenApplyBackground();
            this._updateNodeState();
        },

        onKeyInView: function (event) {
            if (event.keyCode === 32 || event.keyCode === 13) {
                this.trigger('click');
            }
        },
        _generateImageUrlFromBWSNode: function () {
            const layout = this.model.get('layout') || 'large';
            const elementForShortCutIcon = this.$el.find('.tile-icon>.icon');
            elementForShortCutIcon.removeClass(highContrast === 2 ? ShortcutView.BLACK_FOLDER_ICON : ShortcutView.DEFAULT_ICON);
            this.renderNodeTypeIconView(this.model.get('node'), elementForShortCutIcon,'','',{size:layout,title:this.getName()});
            this.model.set('icon','');
        },
        _updateElement: function () {
            var scName = this.getName();
            if (!!this.node) {
                this.$el.attr('href', nodeLinks.getUrl(this.node));
            }
            if (this.model.get('node')?.get('image_url')) {
                this._generateImageUrlFromBWSNode();
            }
            this.$el.attr("class", _.result(this, 'className')).attr("title", this.getName());
            this.$el.attr("aria-label",  _.str.sformat(lang.shortcutPrefixAria, scName));
        },

        _onThemeChange: function () {
            this.trigger('change:shortcutTheme');
        },

        _onCustomBackgroundColorChange: function() {
            this.trigger('change:customBackgroundColor');
        },

        _onCustomBackgroundImageChange: function() {
            this.trigger('change:customBackgroundImage');
        },
        _ensureBackgroundImageNodeThenApplyBackground: function(){
            const backgroundImageNodeId = this.model.get('customBackgroundImage');
            if(!backgroundImageNodeId){
                this.model.set('deploy_url', '')
            }
            if(this.options.perspectiveMode === 'edit' && this.isUpdating && backgroundImageNodeId){
                const self = this;
                const backgroundImageNode = this.createNode4BackgroundImage(backgroundImageNodeId);
                backgroundImageNode.fetch().done(function(node) {
                    const {deploy_url} = node;
                    self.model.set('deploy_url', deploy_url)
                    self._applyBackgroundStyle(self.model.attributes);
                });
                return;
            }
            this._applyBackgroundStyle(this.model.attributes);
        },

        _applyBackgroundStyle: function ({deploy_url, version_number, modify_date, customBackgroundColor}) {
            const modifiedStamp = encodeURIComponent(modify_date);
            const connector =  this.options.context.getObject(ConnectorFactory);
            const url = connector.getConnectionUrl().getOrigin();
            const supportAssetImagePath = deploy_url? `${url}${deploy_url}?m=${modifiedStamp}&v=${version_number}`: '';
            this.el.style.backgroundImage = `url(${supportAssetImagePath})`;
            this.el.style.backgroundColor = customBackgroundColor || '';
            this.el.style.backgroundBlendMode = customBackgroundColor && supportAssetImagePath?'soft-light':'normal';
        },

        onClicked: function (event) {
            if (base.isControlClick(event)) {
                // do nothing, let's execute browser's default behaviour as it is in both ctrl+click and
                // command+click in mac.
            } else {
                event.preventDefault();
                this.triggerMethod('execute:defaultAction', this.node);
            }
        },

        getName: function () {
            if ((this.model.get('displayName') || "").trim().length > 0) {
                return this.model.get('displayName');
            } else {
                return this.node.fetched ? this.node.get('name') : lang.loadingText;
            }
        },

        _ensureNode: function () {
            this.node = this.options.context.getModel(NodeModelFactory, {
                attributes: {
                    id: this.options.model.get('id') || 'volume',
                    type: this.options.model.get('type') || 141
                }
            });
            ShortcutView.prepareModelToFetch(this.node);
            this.model.set('node', this.node, {silent: true});
            this.trigger('update:model', this.node);
            this._ensureNodeFetched();
        },

        _ensureNodeFetched: function () {
            this.listenToOnce(this.node, 'change', this.render);
            this.node.ensureFetched({suppressError: true});
        },
        _updateErrorState: function () {
            if (this.node.error) {
                this.$el.addClass('csui-failed');
                this.$el.removeAttr("title");
            } else {
                this.$el.removeClass('csui-failed');
            }
        },
        _updateNodeState: function () {
            if (this.node.fetched && this.defaultActionController.hasAction(this.node)) {
                this.$el.removeClass('csui-disabled');
            } else {
                this.$el.addClass('csui-disabled');
            }
            this._updateErrorState();
        },

        focus: function () {
            this.$el.trigger('focus');
        }

    }, {
        // TODO: remove this prepareModelToFetch function
        prepareModelToFetch: function (model) {
            // Limit the scope of the response
            model.excludeResources();
            model.resetFields();
            model.setFields({
                'properties': ['container', 'id', 'name', 'original_id', 'type', 'custom_view_search', 'image_url'],
                'versions.element(0)': ['mime_type']
            });
            model.resetExpand();
            model.setExpand({
                properties: ['original_id']
            });
            model.resetCommands();
            model.setCommands(defaultActionItems.getAllCommandSignatures(commands));
        },
        DEFAULT_ICON: 'icon-folder',
        BLACK_FOLDER_ICON: 'icon-folder-black'
    });
    _.extend(ShortcutView.prototype, ShortcutsViewMixin);
    NodeTypeIconItemViewMixin.mixin(ShortcutView.prototype);
    return ShortcutView;

});


csui.define('csui/widgets/shortcuts/impl/nls/shortcuts.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/shortcuts/impl/nls/root/shortcuts.manifest',{
  "widgetTitle": "Shortcut Group",
  "shortcutWidgetTitle": "Shortcut",
  "widgetDescription": "Tile representing a hyperlink to an object; it navigates to its page when clicked",
  "shortcutItemsTitle": "Shortcut Items",
  "shortcutItemsDescription": "Shortcut Items description",
  "idTitle": "Target object",
  "idDescription": "An object to open by this shortcut",
  "typeTitle": "Volume",
  "typeDescription": "Sub-type number of a global volume to open by this shortcut if no object has been selected",
  "displayNameTitle": "Display name",
  "shortcutThemeTitle": "Theme",
  "shortcutThemeDescription": "Styling of the shortcuts",
  "typeEnterpriseVolume": "Enterprise",
  "typePersonalVolume": "Personal",
  "typeCategoryVolume": "Categories",
  "shortcutThemeStone1": "Stone Group 1",
  "shortcutThemeStone2": "Stone Group 2",
  "shortcutThemeTeal1": "Teal Group 1",
  "shortcutThemeTeal2": "Teal Group 2",
  "shortcutThemePink1": "Pink Group 1",
  "shortcutThemePink2": "Pink Group 2",
  "shortcutThemeIndigo1": "Indigo Group 1",
  "shortcutThemeIndigo2": "Indigo Group 2",
  "customBackgroundColorTitle": "Custom background color",
  "customBackgroundColorDescription": "A custom background color for the tile",
  "customBackgroundImageTitle": "Custom background image",
  "customBackgroundImageDescription": "A custom background image for the tile",
  "customBackgroundBlendModeTitle": "Blend background color",
  "customBackgroundBlendModeDescription": "Blends the background image with the theme color, or the individual shortcut color (if one is set)",
  "none": "None"
});




csui.define('json!csui/widgets/shortcuts/impl/shortcut/shortcut.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{shortcutWidgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {
      "id": {
        "title": "{{idTitle}}",
        "description": "{{idDescription}}",
        "type": "integer"
      },
      "displayName": {
        "title": "{{displayNameTitle}}",
        "type": "string"
      },
      "type": {
        "title": "{{typeTitle}}",
        "description": "{{typeDescription}}",
        "type": "integer",
        "enum": [
          141,
          142,
          133
        ]
      },
      "shortcutTheme": {
        "title": "{{shortcutThemeTitle}}",
        "description": "{{shortcutThemeDescription}}",
        "type": "string",
        "enum": [
          "csui-shortcut-theme-stone1",
          "csui-shortcut-theme-stone2",
          "csui-shortcut-theme-teal1",
          "csui-shortcut-theme-teal2",
          "csui-shortcut-theme-pink1",
          "csui-shortcut-theme-pink2",
          "csui-shortcut-theme-indigo1",
          "csui-shortcut-theme-indigo2"
        ]
      },
      "customBackgroundImage": {
        "title": "{{customBackgroundImageTitle}}",
        "description": "{{customBackgroundImageDescription}}",
        "type": "integer"
      },
      "customBackgroundColor": {
        "title": "{{customBackgroundColorTitle}}",
        "description": "{{customBackgroundColorDescription}}",
        "type": "string",
        "enum": [
          "",
          "Aqua",
          "Aquamarine",
          "Blue",
          "BlueViolet",
          "Brown",
          "BurlyWood",
          "CadetBlue",
          "Chartreuse",
          "Chocolate",
          "Coral",
          "CornflowerBlue",
          "Crimson",
          "DarkBlue",
          "DarkCyan",
          "DarkGoldenRod",
          "DarkGray",
          "DarkGreen",
          "DarkKhaki",
          "DarkMagenta",
          "DarkOliveGreen",
          "DarkOrange",
          "DarkOrchid",
          "DarkRed",
          "DarkSalmon",
          "DarkSeaGreen",
          "DarkSlateBlue",
          "DarkSlateGray",
          "DarkTurquoise",
          "DarkViolet",
          "DeepPink",
          "DeepSkyBlue",
          "DimGray",
          "DodgerBlue",
          "FireBrick",
          "ForestGreen",
          "Fuchsia",
          "Gainsboro",
          "Gold",
          "GoldenRod",
          "Gray",
          "Green",
          "GreenYellow",
          "HotPink",
          "IndianRed",
          "Indigo",
          "Khaki",
          "LawnGreen",
          "LightBlue",
          "LightCoral",
          "LightGray",
          "LightGreen",
          "LightPink",
          "LightSalmon",
          "LightSeaGreen",
          "LightSkyBlue",
          "LightSlateGray",
          "LightSteelBlue",
          "Lime",
          "LimeGreen",
          "Maroon",
          "MediumAquaMarine",
          "MediumBlue",
          "MediumOrchid",
          "MediumPurple",
          "MediumSeaGreen",
          "MediumSlateBlue",
          "MediumSpringGreen",
          "MediumTurquoise",
          "MediumVioletRed",
          "MidnightBlue",
          "Moccasin",
          "NavajoWhite",
          "Navy",
          "Olive",
          "OliveDrab",
          "Orange",
          "OrangeRed",
          "Orchid",
          "PaleGoldenRod",
          "PaleGreen",
          "PaleTurquoise",
          "PaleVioletRed",
          "PeachPuff",
          "Peru",
          "Pink",
          "Plum",
          "PowderBlue",
          "Purple",
          "RebeccaPurple",
          "Red",
          "RosyBrown",
          "RoyalBlue",
          "SaddleBrown",
          "Salmon",
          "SandyBrown",
          "SeaGreen",
          "Sienna",
          "Silver",
          "SkyBlue",
          "SlateBlue",
          "SlateGray",
          "SpringGreen",
          "SteelBlue",
          "Tan",
          "Teal",
          "Thistle",
          "Tomato",
          "Turquoise",
          "Violet",
          "Wheat",
          "Yellow",
          "YellowGreen"
        ],
        "default": ""
      }
    }
  },
  "options": {
    "fields": {
      "shortcutTheme": {
        "type": "select",
        "optionLabels": [
          "{{shortcutThemeStone1}}",
          "{{shortcutThemeStone2}}",
          "{{shortcutThemeTeal1}}",
          "{{shortcutThemeTeal2}}",
          "{{shortcutThemePink1}}",
          "{{shortcutThemePink2}}",
          "{{shortcutThemeIndigo1}}",
          "{{shortcutThemeIndigo2}}"
        ]
      },
      "id": {
        "type": "otcs_node_picker",
        "type_control": {
          "parameters": {
            "select_types": [],
            "startLocations": [
             "csui/dialogs/node.picker/start.locations/enterprise.volume",
             "csui/dialogs/node.picker/start.locations/personal.volume",
             "csui/dialogs/node.picker/start.locations/favorites",
             "csui/dialogs/node.picker/start.locations/recent.containers"
           ]
          }
        }
      },
      "type": {
        "type": "select",
        "optionLabels": [
          "{{typeEnterpriseVolume}}",
          "{{typePersonalVolume}}",
          "{{typeCategoryVolume}}"
        ]
      },
      "customBackgroundColor": {
        "type": "select",
        "optionLabels": [
          "{{none}}",
          "Aqua",
          "Aquamarine",
          "Blue",
          "BlueViolet",
          "Brown",
          "BurlyWood",
          "CadetBlue",
          "Chartreuse",
          "Chocolate",
          "Coral",
          "CornflowerBlue",
          "Crimson",
          "DarkBlue",
          "DarkCyan",
          "DarkGoldenRod",
          "DarkGray",
          "DarkGreen",
          "DarkKhaki",
          "DarkMagenta",
          "DarkOliveGreen",
          "DarkOrange",
          "DarkOrchid",
          "DarkRed",
          "DarkSalmon",
          "DarkSeaGreen",
          "DarkSlateBlue",
          "DarkSlateGray",
          "DarkTurquoise",
          "DarkViolet",
          "DeepPink",
          "DeepSkyBlue",
          "DimGray",
          "DodgerBlue",
          "FireBrick",
          "ForestGreen",
          "Fuchsia",
          "Gainsboro",
          "Gold",
          "GoldenRod",
          "Gray",
          "Green",
          "GreenYellow",
          "HotPink",
          "IndianRed",
          "Indigo",
          "Khaki",
          "LawnGreen",
          "LightBlue",
          "LightCoral",
          "LightGray",
          "LightGreen",
          "LightPink",
          "LightSalmon",
          "LightSeaGreen",
          "LightSkyBlue",
          "LightSlateGray",
          "LightSteelBlue",
          "Lime",
          "LimeGreen",
          "Maroon",
          "MediumAquaMarine",
          "MediumBlue",
          "MediumOrchid",
          "MediumPurple",
          "MediumSeaGreen",
          "MediumSlateBlue",
          "MediumSpringGreen",
          "MediumTurquoise",
          "MediumVioletRed",
          "MidnightBlue",
          "Moccasin",
          "NavajoWhite",
          "Navy",
          "Olive",
          "OliveDrab",
          "Orange",
          "OrangeRed",
          "Orchid",
          "PaleGoldenRod",
          "PaleGreen",
          "PaleTurquoise",
          "PaleVioletRed",
          "PeachPuff",
          "Peru",
          "Pink",
          "Plum",
          "PowderBlue",
          "Purple",
          "RebeccaPurple",
          "Red",
          "RosyBrown",
          "RoyalBlue",
          "SaddleBrown",
          "Salmon",
          "SandyBrown",
          "SeaGreen",
          "Sienna",
          "Silver",
          "SkyBlue",
          "SlateBlue",
          "SlateGray",
          "SpringGreen",
          "SteelBlue",
          "Tan",
          "Teal",
          "Thistle",
          "Tomato",
          "Turquoise",
          "Violet",
          "Wheat",
          "Yellow",
          "YellowGreen"
        ]
      },
      "customBackgroundImage": {
        "type": "otcs_node_picker",
        "type_control": {
          "parameters": {
            "select_types": [1305],
            "startLocations": ["csui/dialogs/node.picker/start.locations/support.assets.volume"],
            "startLocation": "csui/dialogs/node.picker/start.locations/support.assets.volume"
          }
        }
      }
    }
  }
});


// Shows the Shortcuts widget of specific nodes
csui.define('csui/widgets/shortcuts/impl/shortcut/editable.shortcut.view',[
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/widgets/shortcuts/impl/shortcut/shortcut.view',
  'csui/models/widget/widget.model',
  'csui/utils/base',
  'i18n!csui/widgets/shortcuts/impl/nls/lang',
  'i18n!csui/widgets/shortcuts/impl/nls/shortcuts.manifest',
  'json!csui/widgets/shortcuts/impl/shortcut/shortcut.manifest.json',
], function (require, _, $, Backbone,
    MiniShortcutView, WidgetModel, base, lang, manifestLang, shortcutManifest) {

  'use strict';

  // Resolve translations.
  shortcutManifest = WidgetModel.resolveLocalizedManifest('shortcut.manifest', shortcutManifest,
      manifestLang);

  /**
   * To be used when shortcutview in editmode to provide configuration capability
   */
  var EditableMiniShortcutView = MiniShortcutView.extend({

    constructor: function EditableMiniShortcutView(options) {
      options || (options = {});
      options.model = options.model || new Backbone.Model();
      this._injectConfigurationBehaviour(options);
      if (options.container.options.data.___pman_isdropped &&
          options.collection.getShortcuts().length === 0) {
        options.model.set('___pman_opencallout', true, {silent: true});
      }
      if(options.context && options.context.perspective){
        options.type = options.context.perspective.type;
      }
      MiniShortcutView.prototype.constructor.apply(this, arguments);
      this._registerEventHandlers();
    },

    // Use DIV as container, since Anchor shouldn't have focusable elements childrens.
    // Also In EditMode, this shortcut item container, is not required to be a link
    tagName: 'div',

    modelEvents: _.defaults({
      'refresh:mask': 'onRefreshMask',
    }, _.result(MiniShortcutView.prototype, 'modelEvents')),

    onRefreshMask: function () {
      var configOptions = this._getDefaultWidgetConfig();
      this.trigger('refresh:mask', configOptions);
    },

    /**
     *  Keep the masking element attached to the DOM to keep flyout open if the shortcut has a popover flyout
     */
    attachElContent: function (html) {
      var flyoutConfig = this.$el.find('.csui-configure-perspective-widget .pman-widget-popover');
      if (flyoutConfig.length) {
        this.$el.children().not('.csui-configure-perspective-widget').remove();
        this.$el.prepend($(html));
      } else {
        this.$el.html(html);
      }
      return true;
    },

    _getDefaultWidgetConfig: function (options) {
      options || (options = this.options);
      var shortcutItemsInGroup = lang.groupAria + ' ';
      options.collection.getShortcuts().forEach(function (shortcut, index) {
        if (index > 0) {
          shortcutItemsInGroup += ', ';
        }
        shortcutItemsInGroup += (shortcut.get('displayName') || (shortcut.get('node')).get('name'));
      });
      var configOptions = {
        allowReplace: false,
        notifyUpdatesImmediatly: true,
        useEnterToConfigure: this._isNewPlaceholder(options),
        ItemsInGroupAriaLabel: shortcutItemsInGroup
      };
      if (options.collection.getShortcuts().length > 1) {
        configOptions = _.extend(configOptions, {
          removeConfirmTitle: lang.removeShortcut,
          removeConfirmMsg: lang.removeShortcutCnfrmMsg,
          confirmOnRemove: false
        });
      }
      return configOptions;
    },

    _injectConfigurationBehaviour: function (options) {
      var configOptions = this._getDefaultWidgetConfig(options);
      let manifest;
      let hasSysAdminRights = !!options.context._user?.get('privilege_system_admin_rights');
      if (options.perspectiveMode === "personalize" || !hasSysAdminRights) {
        manifest = structuredClone(shortcutManifest);
        delete manifest.options.fields["customBackgroundColor"];
        delete manifest.options.fields["customBackgroundImage"];
        delete manifest.schema.properties["customBackgroundColor"];
        delete manifest.schema.properties["customBackgroundImage"];
      }
      else {
        manifest = shortcutManifest;
      }
      this.behaviors = _.defaults({
        PerspectiveWidgetConfig: _.extend({ // For widget editing
          behaviorClass: require(
            'csui/perspective.manage/behaviours/pman.widget.config.behaviour'),
          widgetConfig: function () {
            return {
              options: options.model.attributes
            };
          },
          manifest: manifest
        }, configOptions)
      }, this.behaviors);
    },

    isShortcutValid: function (options) {
      var isValid = true;
      if (this.collection.getShortcuts().length === 0 && this.options.perspectiveMode === "edit") {
        isValid = this.isOptionsValid(options);
      }
      return isValid;
    },

    validateConfiguration: function (options) {
      var isValid = this.isShortcutValid(options);
      var action = !isValid ? 'addClass' : 'removeClass';
      this.$el.find(".tile-group")[action]('binf-hidden');
      this.$el[action]('csui-pman-shortcut-error');
      return isValid;
    },

    isOptionsValid: function (options) {
      return (!!options.id || !!options.type);
    },

    _updateShortcut: function (args) {
      if (this.isShortcutValid(args.options)) {
        this.$el.find('.csui-configure-perspective-widget').removeClass(
            'binf-perspective-has-error');
      }
    },

    _registerEventHandlers: function () {
      this.listenTo(this, 'delete:widget', function () {
        delete this.options.container.options.data.___pman_opencallout;
      });
      this.listenTo(this, 'update:widget:options', this._updateShortcut);
    },

    // START of Overriden functions from MiniShortcutView
    _updateElement: function () {
      // Since DIV is being used as container, this doesn't need HREF attribute
      this.$el.attr("class", _.result(this, 'className'));
      if (this.model.get('node')?.get('image_url')) {
        this._generateImageUrlFromBWSNode();
    }
    },

    _ensureNode: function () {
      if (!this._isNewPlaceholder()) {
        MiniShortcutView.prototype._ensureNode.apply(this, arguments);
      } else {
        // Dummy placeholder node
        this.node = new Backbone.Model();
      }
    },

    _ensureNodeFetched: function () {
      if (!this._isNewPlaceholder()) {
        this.isUpdating = true;
        MiniShortcutView.prototype._ensureNodeFetched.apply(this, arguments);
        delete this.isUpdating;
      }
    },

    _updateNodeState: function () {
      if (!this._isNewPlaceholder()) {
        MiniShortcutView.prototype._updateErrorState.apply(this, arguments);
      }
    },

    getName: function () {
      if (!this._isNewPlaceholder()) {
        return MiniShortcutView.prototype.getName.apply(this, arguments);
      } else {
        return lang.addShortcut;
      }
    },

    onRender: function () {
      MiniShortcutView.prototype.onRender.apply(this, arguments);
      if (this._isNewPlaceholder()) {
        this.$el.addClass('csui-pman-shortcut-new');
      }
      this.$el.addClass('csui-pman-editable-widget');
      if (!this.$el.find('.binf-popover').length) {
        base.clearFocusables(this.$el);
      }
    },

    onDomRefresh: function () {
      var wrapperBtn = this.$el.find('.wrapper-button');
      if (!this.$el.find('.binf-popover').length) {
        base.clearFocusables(this.$el);
      }
      if (this._isNewPlaceholder()) {
        wrapperBtn.attr('aria-label', lang.addShortcutToGroup);
      } else {
        var shortcutName = this.model.get('displayName') || this.model.get('node').get('name');
        wrapperBtn.attr('aria-label', _.str.sformat(lang.accessShortcutActions, shortcutName));
        this.$el.find('.icon-edit').attr('aria-label',
            _.str.sformat(lang.shortcutSettings, shortcutName));
        this.$el.find('.clear-icon').attr('aria-label',
            _.str.sformat(lang.removeShortcutItem, shortcutName));
      }
    },

    onClicked: function (event) {
      event.preventDefault();
      if (!this.$el.find('.pman-widget-popover').has(event.target).length) {
        event.stopPropagation();
      }
    },

    _isNewPlaceholder: function (options) {
      return (options || this.options).model.isAddShortcut();
    },

    focus: function () {
      this.$el.find('.csui-configure-perspective-widget .wrapper-button').trigger('focus');
    }
  });

  return EditableMiniShortcutView;

});


csui.define('css!csui/widgets/shortcuts/impl/shortcuts',[],function(){});

// Shows the Shortcuts widget of specific nodes
csui.define('csui/widgets/shortcuts/shortcuts.view',[
  'module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/shortcuts/impl/shortcut/shortcut.view',
  'csui/widgets/shortcuts/impl/shortcut/editable.shortcut.view',
  'csui/utils/contexts/factories/node',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/controls/mixins/shortcuts.view/shortcuts.view.mixin',
  'csui/utils/perspective/perspective.util',
  'smart/controls/progressblocker/blocker',
  'i18n!csui/widgets/shortcuts/impl/nls/lang',
  "css!csui/widgets/shortcuts/impl/shortcuts"
], function (module, _,
    $,
    Backbone,
    Marionette,
    base,
    TabableRegionBehavior,
    MiniShortcutView,
    EditableShortcutView,
    NodeModelFactory,
    ViewEventsPropagationMixin,
    ShortcutsViewMixin,
    PerspectiveUtil,
    BlockingView,
    lang) {

  'use strict';

  var config = _.defaults({}, (module.config() || {}), {
    // loading state will be rendered based on this config flag ("isPageHasDarkTheme"), by
    // default it is true, if any leading application changes it to false, loading state will be
    // rendered accordingly.
    isPageHasDarkTheme: true
  });

  var THEME_SUFFIX = ["shade1", "shade2", "shade3", "shade4"];

  var ShortcutModel = Backbone.Model.extend({
    idAttribute: 'shortcutItemId',

    isAddShortcut: function () {
      return this.get('isAddNew') === true;
    }
  });

  var ShortcutsCollection = Backbone.Collection.extend({

    constructor: function (models, options) {
      options || (options = {});
      _.defaults(options, {
        model: ShortcutModel,
        comparator: function (a, b) {
          if (b.get('isAddNew')) {
            return -1;
          }
          return 0;
        }
      });
      this.options = options;
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    getShortcuts: function () {
      return this.filter(function (model) {
        return !model.isAddShortcut();
      });
    },

    evaluateAddNewExistence: function () {
      var widgetId = this.options[PerspectiveUtil.KEY_WIDGET_ID];
      if (this.options.perspectiveMode === PerspectiveUtil.MODE_PERSONALIZE &&
          (widgetId && !PerspectiveUtil.isPersonalWidgetId(widgetId))) {
        return;
      }
      var newItem = this.where(function (model) {
        return model.isAddShortcut();
      });
      if (this.length < 4 && newItem.length === 0) {
        this.add({
          id: '',
          isAddNew: true,
          icon: 'icon-new',
          displayName: '',
          customBackgroundColor: '', // not 'transparent' as that would disable theme too
          customBackgroundImage: ''
        });
        return true;
      } else if (this.length > 4 && newItem.length > 0) {
        this.remove(newItem);
        return true;
      }
      return false;
    }
  });

  //
  // Constructor options:
  // - shortcutItems: Array
  //    - 
  // - node.id: The object (node) ID.  Either node.id or node.type is mandatory.
  // - node.type: The object type for known volumes (e.g. type=141 for Enterprise Workspace)
  // - icon: css icon class
  // - shortcutTheme: css theme class
  //
  var ShortcutsView = Marionette.CollectionView.extend({

    constructor: function ShortcutsView(options) {
      options || (options = {});
      options.data || (options.data = {});
      options = _.defaults(options, {
        reorderOnSort: true,
        widgetContainer: this
      });
      options.data = this._normalizeData(options.data);

      options.collection = options.collection || new ShortcutsCollection([],
          _.pick(options, 'perspectiveMode', PerspectiveUtil.KEY_WIDGET_ID));
      Marionette.CollectionView.prototype.constructor.call(this, options);
    },

    tagName: 'div',

    className: "csui-shortcut-container tile initialLoading csui-shortcut-group-container csui-widget-focusable",

    attributes: function () {
      var attrs = {};
      if (!this._isInlineEditMode()) {
        attrs = _.extend({
          role: 'navigation',
          "aria-label": lang.groupAria
        }, attrs);
      }
      return attrs;
    },

    regions: {
      "shortcut0": ".shortcut-region-0",
      "shortcut1": ".shortcut-region-1",
      "shortcut2": ".shortcut-region-2",
      "shortcut3": ".shortcut-region-3"
    },

    behaviors: function () {
      if (!this._isInlineEditMode()) {
        return {
          TabableRegion: {
            behaviorClass: TabableRegionBehavior
          }
        };
      }
    },

    events: function () {
      var evts = {};

      if (this._isInlineEditMode()) {
        evts = _.extend(evts, {
          "drop": "onDrop",
          "dragover": "onDragOver",
          "dragenter": "onDragEnter",
          "keydown": "_onEditKeyDown"
        });
      } else {
        evts = _.extend(evts, {
          "keydown": "onKeyInView"
        });
      }

      return evts;
    },

    // childView: this.getChildView(),
    childEvents: {
      'change:shortcutTheme': '_onChangeTheme',
      'change:customBackgroundColor': '_onChangeCustomBackgroundColor',
      'change:customBackgroundImage': '_onChangeCustomBackgroundImage',
      'add:shortcut': '_onAddShortcut',
      'delete:widget': '_onRemoveShortcut',
      'update:widget:options': '_updateShortcutOptions'
    },
    childViewOptions: function (model, index) {
      return {
        context: this.options.context,
        collection: this.options.collection,
        container: this,
        perspectiveMode: this.options.perspectiveMode
      };
    },
    getChildView: function(){
      return this._isInlineEditMode()? EditableShortcutView: MiniShortcutView;
    },

    _normalizeData: function (data) {
      data || (data = {shortcutItems: []});
      data.shortcutTheme || (data.shortcutTheme = '');
      return data;
    },

    initialize: function () {
      this.loadingText = lang.loadingText;
      this.darkBackground = config.isPageHasDarkTheme;
      BlockingView.imbue(this);

      this.listenTo(this.collection, 'add', this._onCollectionChange)
          .listenTo(this.collection, 'remove', this._onCollectionChange)
          .listenTo(this.collection, 'reset', this._onCollectionChange);

      if (this._isInlineEditMode()) {
        this.listenTo(this.collection, 'add', this._onCollectionInlineAdd)
            .listenTo(this.collection, 'remove', this._onCollectionInlineRemove);
      }

      var shortcutItems = _.map(_.first(this.options.data.shortcutItems || [], 4), _.clone);
      // Fetch all models before rendering tiles.
      this._fetchModels(shortcutItems).always(_.bind(function () {
        this._setupCollection(shortcutItems);
      }, this));
      this._currentShortcutIndex = 0;
      this.listenTo(this, 'add:child', this.propagateEventsToViews);
    },

    _fetchModels: function (shortcutItems) {
      this.blockActions();
      // Creating Detail List
      const backgroundImagePromiseList = this.createDetailListForShortcuts(shortcutItems);  

      const result = $.whenAll.apply($, backgroundImagePromiseList);
      const self = this;      
      result.always(function (bgImgs) {
        bgImgs.forEach(item =>{
          const bgImg = item[0];
          const bgImgId = bgImg?.id;
          const shortcutItemsIndex = shortcutItems.findIndex( shortcutItem => shortcutItem?.customBackgroundImage === bgImgId);
           shortcutItems[shortcutItemsIndex].deploy_url = bgImg?.deploy_url;
           shortcutItems[shortcutItemsIndex].modify_date =bgImg?.modify_date;
           shortcutItems[shortcutItemsIndex].mime_type = bgImg?.mime_type;
           shortcutItems[shortcutItemsIndex].version_number = bgImg?.version_number;
        })
        self.unblockActions();
      });
      return result;
    },

    _setupCollection: function (shortcutItems) {
      if (!this._isInlineEditMode()) {
        // Remove invalid / unknow nodes.
        var validShortcuts = _.filter(shortcutItems, function (item) {
          return !item.node.error;
        });
        if (validShortcuts.length > 0) {
          shortcutItems = validShortcuts;
        } else {
          // When all nodes are invalid, keep first to show "error" message / tile.
          shortcutItems = _.first(shortcutItems, 1);
        }
      }
      shortcutItems = shortcutItems || [];
      this.collection.reset(shortcutItems);
    },

    _isInlineEditMode: function () {
      return !!this.options.perspectiveMode;
    },

    _onCollectionChange: function () {
      if (this._isInlineEditMode()) {
        this.collection.evaluateAddNewExistence();
      }
      this._updateShortcutStyles();
    },

    _onCollectionInlineAdd: function () {
      this.collection.each(function (model) {
        model.trigger('refresh:mask');
      });
    },

    _onCollectionInlineRemove: function () {
      this.collection.each(function (model) {
        model.trigger('refresh:mask');
      });
    },

    _getLayout: function (size) {
      var layout = "small";
      if (size === 1) {
        layout = "large";
      } else if (size === 2) {
        layout = "medium";
      }
      return layout;
    },

    _getShortcutTheme: function (itemIndex, numberOfItems) {
      var theme = this.options.data.shortcutTheme ? this.options.data.shortcutTheme :
                  "csui-shortcut-theme-grey";
      if (numberOfItems > 1) {
        itemIndex += (4 - numberOfItems);
        theme += "-" + THEME_SUFFIX[itemIndex];
      }

      return theme;
    },

    _updateShortcutOptions: function (shortcutItemView, args) {
      var itemModel = shortcutItemView.model,
          updatedOptions = args.options;
      if (itemModel.get('isAddNew')) {
        if (args.softUpdate) {
          return;
        }
        if (!args.isValid || !shortcutItemView.isOptionsValid(updatedOptions)) {
          if (this.options.perspectiveMode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
            this._notifyOptionsChange(!shortcutItemView.isShortcutValid(updatedOptions));
          }
          return;
        }
        itemModel.set({'isAddNew': undefined, displayName: undefined, icon: undefined, customBackgroundColor: undefined, customBackgroundImage: undefined},
            {silent: true, unset: true});
      }
      shortcutItemView.isUpdating = true;
      this._setDefaultOptions(updatedOptions);
      itemModel.set(updatedOptions);
      this._notifyOptionsChange();
      var isCollChanged = this.collection.evaluateAddNewExistence();
      delete shortcutItemView.isUpdating;
      if (!isCollChanged) {
        this._updateShortcutStyles();
        shortcutItemView.model.trigger('refresh:mask');
      }
      this.triggerMethod('dom:refresh');
    },

    /**
     * Since "Enterprise volume" as default value removed from manifest
     * to avoid creating shortcuts for empty placeholder, handle / fill default values manually.
     *
     * @param {JSONObject} updatedOptions
     */
    _setDefaultOptions: function (updatedOptions) {
      updatedOptions.type = updatedOptions.type || 141;
    },

    _onRemoveShortcut: function (shortcutItemView) {
      var getNextItemToFocus = this.collection.indexOf(shortcutItemView.model);
      this.collection.remove(shortcutItemView.model);
      var shortcutItems = this.collection.getShortcuts();
      if (shortcutItems.length === 0) {
        // No shortcuts left in the group. Hence remove widget
        this.options.widgetContainer.trigger('remove:widget');
      } else {
        // Otherwise, notify to update options
        this._notifyOptionsChange();
        this.children.findByIndex(getNextItemToFocus).focus();
      }
    },

    _notifyOptionsChange: function (isInvalid) {
      var shortcutItems = this.collection.getShortcuts().map(function (model) {
        return {
          id: model.get('id'),
          type: model.get('type'),
          displayName: model.get('displayName'),
          icon: model.has('icon') ? model.get('icon') : '',
          customBackgroundColor: model.has('customBackgroundColor') && model.get('customBackgroundColor') || '',
          customBackgroundImage: model.has('customBackgroundImage') && model.get('customBackgroundImage') || '',
          // customBackgroundBlendMode: model.has('customBackgroundBlendMode') ? model.get('customBackgroundBlendMode') : 'normal'
        };
      });
      this.options.widgetContainer.trigger('update:widget:options', {
        shortcutTheme: this.collection.first().get('shortcutTheme'),
        shortcutItems: shortcutItems,
        isValid: !isInvalid
      });
    },

    _onChangeTheme: function (childView) {
      this.options.data.shortcutTheme = childView.model.get('shortcutTheme');
      this._updateShortcutStyles();
    },

    _onChangeBackgroundColor: function (childView) {
      this.options.data.customBackgroundColor = childView.model.get('customBackgroundColor');
    },

    _onChangeBackgroundImage: function (childView) {
      this.options.data.customBackgroundImage = childView.model.get('customBackgroundImage');
    },

    _onAddShortcut: function (childView, model) {
      this.collection.add({
        id: '',
        icon: '',
        displayName: '',
        customBackgroundColor: '',
        type: 141,
        shortcutTheme: this.options.data.shortcutTheme,
        customBackgroundImage: ''
      }, {at: this.collection.length - 1});
      this.collection.sort();
      this._notifyOptionsChange();
    },

    _updateShortcutStyles: function () {
      var shortcutTheme = this.options.data.shortcutTheme,
          layout = this._getLayout(this.collection.length);
      this.collection.each(function (model, index) {
        var totalShortcuts = !this._isInlineEditMode() ? this.collection.length :
                             this.collection.getShortcuts().length,
            theme = this._getShortcutTheme(index, totalShortcuts);
        model.set({
          layout: layout,
          theme: theme,
          shortcutTheme: shortcutTheme
        });
      }, this);
    },

    onDrop: function (event) {
      this.options.widgetContainer.trigger('replace:widget', event);
    },

    onDragOver: function (event) {
      event.preventDefault();
    },

    onDragEnter: function (event) {
      event.preventDefault();
    },

    onRender: function () {
      this._clearShortcutTabIndexes();
    },

    onDomRefresh: function () {
      if (this._isInlineEditMode()) {
        var btnRequired = true,
            shortcutGroup = lang.groupAria,
            shortcutCount = this.collection.getShortcuts().length,
            shortcutAriaLabel = '',
            wrapperEle = this.$el.parent().find('.shortcut-group-wrapper');
        if (wrapperEle.length > 0) {
          btnRequired = false;
        }
        btnRequired && this.$el.before(
            "<div class='shortcut-group-button-wrapper'><button class='shortcut-group-wrapper binf-btn' tabindex='0'></button></div>");
        this.$el.parent().off('click', '.shortcut-group-wrapper', this._onEditEnterPress).on(
            'click', '.shortcut-group-wrapper', this._onEditEnterPress.bind(this));
        this.$el.parent().off('keydown', '.shortcut-group-wrapper',
            this._onKeyInEmptyPlaceHolder).on(
            'keydown', '.shortcut-group-wrapper', _.bind(this._onKeyInEmptyPlaceHolder, this));

        switch (shortcutCount) {
        case 0:
          // shortcut group with 0 items
          shortcutAriaLabel = lang.emptyGroup;
          break;
        case 1:
          // shortcut group with 1 item
          shortcutAriaLabel = _.str.sformat(lang.shortcutGroupWithOneItem, shortcutCount,
              4 - shortcutCount);
          break;
        case 4:
          // shortcut group with max items 4
          shortcutAriaLabel = lang.maxItemsGroup;
          break;
        default:
          // shortcut group with 1 or more items and a empty placeholder
          shortcutAriaLabel = _.str.sformat(lang.shortcutGroupWithMixedItems, shortcutCount,
              4 - shortcutCount);
        }
        this.$el.parent().find('.shortcut-group-wrapper').attr('aria-label', shortcutAriaLabel);
      }
    },

    _clearShortcutTabIndexes: function () {
      if (!this.$el.find('.binf-popover').length) {
        base.clearFocusables(this.$el);
      }
    },

    /** START: KN handling */
    currentlyFocusedElement: function () {
      var currentItem = this._currentlyFocusedShortcut();
      return currentItem && currentItem.$el;
    },

    _currentlyFocusedShortcut: function () {
      return this.children.findByIndex(this._currentShortcutIndex);
    },

    _onEditEnterPress: function (event) {
      var $target = $(event.target);
      if (this.collection.getShortcuts().length === 0 && this.$el.has($target).length === 0) {
        this.$el.find('.csui-pman-widget-masking').trigger('click');
        return false;
      } else if ($target.is(this.$el.parent().find('.shortcut-group-wrapper'))) {
        this._enterConfiguration();
        return false;
      }
      return true;
    },

    _onEditKeyDown: function (event) {
      var continueEvent = true,
        $target = $(event.target);
      switch (event.keyCode) {
        case 13: // ENTER
        case 32: // SPACE
          continueEvent = this._onEditEnterPress(event);
          break;
        case 27: // ESCAPE
          if (this.collection.getShortcuts().length > 0) {
            if ($target.is(this.$el.find('.wrapper-button'))) {
              this.$el.parent().find('.shortcut-group-wrapper').trigger(
                'focus');
            } else {
              this.$el.find('.csui-pman-shortcut-new .wrapper-button').trigger(
                'focus');
            }
            continueEvent = false;
          } else if (this.collection.getShortcuts().length === 0) {
            // Exit from configuration, focus back to widget
            this._exitConfiguration();
            continueEvent = false;
          }
          break;
        case 38: // UP
          this._selectPreviousShortcut();
          break;
        case 40: // DOWN
          this._selectNextShortcut();
          break;
      }
      return continueEvent;
    },

    _enterConfiguration: function () {
      this._currentShortcutIndex = -1;
      this._selectShortcut(0);
    },

    _exitConfiguration: function () {
      this.$el.parent().find('.shortcut-group-wrapper').trigger('focus');
      this._clearShortcutTabIndexes(this.$el);
    },

    onKeyInView: function (event) {
      switch (event.keyCode) {
      case 13: // ENTER
      case 32:
        this.currentlyFocusedElement().trigger('click');
        break;
      case 38:
        this._selectPreviousShortcut();
        break;
      case 40:
        this._selectNextShortcut();
        break;
      }
    },

    _onKeyInEmptyPlaceHolder: function (event) {
      switch (event.keyCode) {
      case 9:
        if (event.shiftKey && $(event.target).is($('.shortcut-group-wrapper'))) {
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
      }
    },

    _selectNextShortcut: function () {
      var index = Math.min(this._currentShortcutIndex + 1, this.collection.length - 1);
      this._selectShortcut(index);
    },

    _selectPreviousShortcut: function () {
      var index = Math.max(this._currentShortcutIndex - 1, 0);
      this._selectShortcut(index);
    },

    _selectShortcut: function (index) {
      if (index !== this._currentShortcutIndex) {
        this._currentShortcutIndex = index;
        this.trigger('changed:focus', this);
        this._currentlyFocusedShortcut().focus();
      }
    }
    /** END: KN handling */
  }, {
    migrateSingleShortcut: function (options) {
      var shortcutTheme;
      switch (options.background) {
      case 'cs-tile-background1':
        shortcutTheme = 'csui-shortcut-theme-stone1';
        break;
      case 'cs-tile-background2':
        shortcutTheme = 'csui-shortcut-theme-teal2';
        break;
      case 'cs-tile-background3':
        shortcutTheme = 'csui-shortcut-theme-pink1';
        break;
      }
      return {shortcutItems: [options], shortcutTheme: shortcutTheme};
    },

    migrateData: function (widgetType, options) {
      switch (widgetType) {
      case 'shortcut':
      case 'csui/widgets/shortcut':
        return ShortcutsView.migrateSingleShortcut(options);
      default:
        return options;
      }
    }
  });

  _.extend(ShortcutsView.prototype, ViewEventsPropagationMixin);
  _.extend(ShortcutsView.prototype, ShortcutsViewMixin);

  return ShortcutsView;

});


csui.define('csui/widgets/welcome.placeholder/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/welcome.placeholder/impl/nls/root/lang',{
  greetingWithName: 'Hello {0}',
  greetingWithoutName: 'Hello',
  greetingMorning: 'Good morning, {0}!',
  greetingAfternoon: 'Good afternoon, {0}!',
  greetingEvening: 'Good evening, {0}!',
  greetingMorningNoName: 'Good morning!',
  greetingAfternoonNoName: 'Good afternoon!',
  greetingEveningNoName: 'Good evening!',
  videoLabel: 'Smart UI introduction video',
  withVideoWrapperAria: `{0} {1}`, // greeting videoLabel
  videoSrc: '//sunnyside.vidavee.com/opentext/rest/file/GetFileAsset/EBC85A92D0C5DE3A272CC1C165E85A78/introVideo_2020.mp4',
  videoPoster: '//sunnyside.vidavee.com/opentext/rest/file/GetFileThumbnail/EBC85A92D0C5DE3A272CC1C165E85A78/thumbnail.jpg',
  message: 'As a foundational technology in the Digital Workplace, OpenText Content Management will pave the way to personal productivity, seamless collaboration, and integration with business processes.'
});




/* START_TEMPLATE */
csui.define('hbs!csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n  <div class=\"binf-modal-dialog\">\n    <div class=\"binf-modal-content csui-video\">\n      <video  preload=\"none\"\n             poster=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"videoPoster") || (depth0 != null ? lookupProperty(depth0,"videoPoster") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"videoPoster","hash":{},"loc":{"start":{"line":5,"column":21},"end":{"line":5,"column":36}}}) : helper)))
    + "\"\n             controls=\"controls\">\n        <source\n          src=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"videoSrc") || (depth0 != null ? lookupProperty(depth0,"videoSrc") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"videoSrc","hash":{},"loc":{"start":{"line":8,"column":15},"end":{"line":8,"column":27}}}) : helper)))
    + "\"\n          type=\"video/mp4\">\n        </source>\n      </video>\n\n    </div>\n  </div>\n";
}});
Handlebars.registerPartial('csui_widgets_welcome.placeholder_impl_welcome.video_welcome.video', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video',[],function(){});

csui.define('csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/base', "csui/utils/url", 'csui/utils/contexts/factories/node',
  'i18n!csui/widgets/welcome.placeholder/impl/nls/lang',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'hbs!csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video',
  'css!csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video',
  'csui/lib/binf/js/binf'
], function (_, $, Marionette, base, Url, NodeModelFactory, lang,
  TabablesBehavior, TabableRegionBehavior, template) {

  var WelcomeVideo = Marionette.ItemView.extend({

    _dataDefaults:{
      videoSrc: lang.videoSrc,
      videoPoster: lang.videoPoster
    },

    className: 'cs-dialog welcome-video binf-modal binf-fade',

    template: template,

    events: {
      'hide.binf.modal': 'onDestroy',
      'hidden.binf.modal': 'onDestroy',
      'keydown video' : 'onKeyDown',
      'shown.binf.modal': 'onShown'
    },

    templateHelpers: function(){
      var optionsData = this.options.data;
      return {
        videoSrc: optionsData.videoSrc,
        videoPoster: optionsData.videoPoster
      };
    },

    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior,
        recursiveNavigation: true,
        containTabFocus: true
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function () {
      return this.$el;
    },

    constructor: function WelcomeVideo(options) {
      options || (options = {});
      options.data || (options.data = {});
      _.each(this._dataDefaults, function(value,key){
        var serverValue = options.data[key];
        if (!serverValue){
          options.data[key] = value;
        }
      });
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.connection = options.context.getModel(NodeModelFactory).connector.connection;
    },

    onKeyDown: function(event) {
      if(event.keyCode === 27) {
        this.destroy();
      }
    },

    onDestroy: function(){
      TabablesBehavior.popTabableHandler();
      this.$el.remove();
    },


    show: function () {
      this.render();
      if (base.isAppleMobile()){
        this.$el.addClass('mobile');
      }
      this.$el.binf_modal('show');
    },

    onShown: function () {
    this.$('video').trigger('focus');
   }



  });

  return WelcomeVideo;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/welcome.placeholder/impl/welcome.placeholder',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button class=\"csui-videoButton\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"videoLabel") || (depth0 != null ? lookupProperty(depth0,"videoLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"videoLabel","hash":{},"loc":{"start":{"line":9,"column":49},"end":{"line":9,"column":63}}}) : helper)))
    + "\"></button>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-message\">\n      <p title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":13,"column":16},"end":{"line":13,"column":27}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":13,"column":29},"end":{"line":13,"column":40}}}) : helper)))
    + "</p>\n    </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n<div class=\"csui-hero-tile\">\n  <div class=\"csui-hero-left\">\n    <div role=\"heading\" aria-level=\"2\" class=\"csui-greeting\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"greeting") || (depth0 != null ? lookupProperty(depth0,"greeting") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"greeting","hash":{},"loc":{"start":{"line":4,"column":61},"end":{"line":4,"column":73}}}) : helper)))
    + "</div>\n    <span class=\"csui-date\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"date") || (depth0 != null ? lookupProperty(depth0,"date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"date","hash":{},"loc":{"start":{"line":5,"column":28},"end":{"line":5,"column":36}}}) : helper)))
    + "</span>\n  </div>\n    <div class=\"csui-hero-right\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"includeVideo") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":8,"column":4},"end":{"line":10,"column":11}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"includeMessage") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":11,"column":4},"end":{"line":15,"column":11}}})) != null ? stack1 : "")
    + "  </div>\n\n</div>";
}});
Handlebars.registerPartial('csui_widgets_welcome.placeholder_impl_welcome.placeholder', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/welcome.placeholder/impl/welcome.placeholder',[],function(){});

csui.define('csui/widgets/welcome.placeholder/welcome.placeholder.view',[
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/utils/contexts/factories/user',
  'csui/utils/types/date',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video.view',
  'i18n!csui/widgets/welcome.placeholder/impl/nls/lang',
  'hbs!csui/widgets/welcome.placeholder/impl/welcome.placeholder',
  'css!csui/widgets/welcome.placeholder/impl/welcome.placeholder'
], function ($,
    _,
    Marionette,
    base,
    UserModelFactory,
    DateType,
    TabableRegionBehavior,
    WelcomeVideo,
    lang,
    placeholderTemplate) {

  var WelcomeView = Marionette.ItemView.extend({

    _dataDefaults: {
      includeMessage: true,
      includeVideo: true,
      message: lang.message
    },

    className: 'tile hero',

    template: placeholderTemplate,

    ui: {
      welcomeMessageContainer: '> .csui-hero-tile .csui-message',
      welcomeMessage: '> .csui-hero-tile .csui-message > p',
      greetingsMessage: '> .csui-hero-tile .csui-hero-left .csui-greeting'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    triggers: {
      'click .csui-hero-tile': 'show:video'
    },

    templateHelpers: function () {
      var optionsData = this.options.data,
          firstName   = this.user.get('first_name'),
          date        = new Date(),
          hour        = date.getHours(),
          greeting    = this._getGreeting(firstName, hour);

      return {
        videoSrc: optionsData.videoSrc,
        videoPoster: optionsData.videoPoster,
        includeMessage: optionsData.includeMessage,
        includeVideo: optionsData.includeVideo,
        greeting: greeting,
        message: optionsData.message,
        videoLabel: lang.videoLabel,
        date: DateType.formatExactDate(DateType.deserializeDate(date))
      };
    },

    events: {"keydown": "onKeyInView"},

    currentlyFocusedElement: function () {
      return this.$el;
    },

    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        // space(32) or enter(13)
        event.preventDefault();
        event.stopPropagation();
        this.triggerMethod("show:video");
      }
    },

    constructor: function WelcomeView(options) {
      options || (options = {});
      options.data || (options.data = {});
      _.each(this._dataDefaults, function(value,key){
        var serverValue = options.data[key];
        if (serverValue == null || serverValue === ''){
          options.data[key] = value;
        }
      });
      Marionette.ItemView.call(this, options);
      this.user = options.context.getModel(UserModelFactory);
      this.listenTo(this.user, 'change', this._updateGreeting);
      $(window).on("resize.app", this.render);
      this.listenTo(this, 'dom:refresh', this._setTextEllipse);
    },

    onRender: function() {
      var helpers = this.templateHelpers();
      if (helpers.includeVideo) {
        this.$el.attr('aria-label', _.str.sformat(lang.withVideoWrapperAria, helpers.greeting, helpers.videoLabel));
      }
    },

    onDestroy: function () {
      $(window).off("resize.app", this.render);
    },

    onShowVideo: function () {
      var welcomeVideo = new WelcomeVideo(this.options);
      welcomeVideo.show();
    },

    _setTextEllipse: function () {
      var welcomeMessage  = this.ui.welcomeMessage,
          containerHeight = this.ui.welcomeMessageContainer.height(),
          lineHeight      = parseInt(welcomeMessage.css('line-height'), 10);

      if (lineHeight <= containerHeight) {
        while (welcomeMessage.outerHeight() > containerHeight) {
          var text = welcomeMessage.text();
          var shortenedText = text.replace(/\W*\s(\S)*$/, '...');
          if (shortenedText.length < text.length) {
            welcomeMessage.text(shortenedText);
          } else {
            break;
          }
        }
        this.ui.welcomeMessageContainer.removeClass('binf-hidden');
      }
      else {
        this.ui.welcomeMessageContainer.addClass('binf-hidden');
      }
    },

    _getGreeting: function(firstName, hour){
      return this._generateGreetingMessage(firstName, hour);
    },

    _updateGreeting: function(){
      $(this.ui.greetingsMessage).text(this._generateGreetingMessage(this.user.get('first_name'), new Date().getHours()));
    },

    _generateGreetingMessage: function(firstName, hour){
      var greeting;
      if(firstName){
        var greetingTemplate = hour < 12 ? lang.greetingMorning : hour < 18 ? lang.greetingAfternoon : lang.greetingEvening;
        greeting = _.str.sformat(greetingTemplate, firstName);
      }else{
        greeting = hour < 12 ? lang.greetingMorningNoName : hour < 18 ? lang.greetingAfternoonNoName : lang.greetingEveningNoName;
      }
      return greeting;
    }
  });

  return WelcomeView;

});

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/cslink.preview/cslink.preview',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "      <div id=\"cs-link-content\" class=\"cs-link-content\"></div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div id=\"cs-link-image\" class=\"cs-link-image\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"LinkPreviewImage") || (depth0 != null ? lookupProperty(depth0,"LinkPreviewImage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"LinkPreviewImage","hash":{},"loc":{"start":{"line":11,"column":52},"end":{"line":11,"column":74}}}) : helper))) != null ? stack1 : "")
    + "</div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id=\"cs-link\" class=\"cs-link\">\n  <div class=\"cs-link-popoverhead\">\n    <div id=\"cs-link-heading\" class=\"cs-link-heading\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"LinkHeading") || (depth0 != null ? lookupProperty(depth0,"LinkHeading") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"LinkHeading","hash":{},"loc":{"start":{"line":3,"column":54},"end":{"line":3,"column":69}}}) : helper)))
    + "</div>\n    <div id=\"cs-link-expand\" class=\"cs-link-expand cs-link-expand-icon\"></div>\n  </div>\n  <div class=\"cs-link-preview-content\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isPreviewContent") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":7,"column":4},"end":{"line":9,"column":11}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isLinkPreviewImage") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":10,"column":4},"end":{"line":12,"column":11}}})) != null ? stack1 : "")
    + "  </div>\n</div>";
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_cslink.preview_cslink.preview', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/html.editor/impl/cslink.preview/cslink.preview',[],function(){});

csui.define(
    'csui/widgets/html.editor/impl/cslink.preview/cslink.preview.view',['csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
      'csui/behaviors/default.action/default.action.behavior',
      'csui/controls/rich.text.editor/impl/rich.text.util',
      'csui/models/node/node.model', 'csui/utils/commands', 'csui/utils/url',
      'hbs!csui/widgets/html.editor/impl/cslink.preview/cslink.preview',
      'i18n!csui/widgets/html.editor/impl/nls/lang',
      'css!csui/widgets/html.editor/impl/cslink.preview/cslink.preview'
    ], function ($, _, Backbone, Marionette, DefaultActionBehavior, Utils, NodeModel,
        commands, Url, linkTemplate, lang) {

      var CSLinkPreview = Marionette.ItemView.extend({
        template: linkTemplate,
        className: 'cs-link',
        behaviors: {
          DefaultAction: {
            behaviorClass: DefaultActionBehavior
          }
        },
        subTypeName: 'wiki',
        constructor: function CSLinkPreview(options) {
          options || (options = {});
          Marionette.ItemView.prototype.constructor.call(this, options);
          this.options = options;
          this.subTypeName = options.subTypeName || this.subTypeName;
          this.modelFetched = false;
          this.linkPreviewContent = null;
          this.linkPreviewImage = null;
          this.model = this.options.previewModel;
          var that = this;
          if (!this.model) {
            this._obtainId().done(function () {
              that._executeProcess();
            });
          }
        },

        _obtainId: function () {
          this.id = this.options.objId || -1;
          var targetEle  = this.options.targetEle,
              targetHref = targetEle.href || targetEle.closest('a').href;
          var hrefMatcher = targetHref.match(/^.*\/open\/(.+)$/i) ||
                            targetHref.match(/^.*\/nodes\/(.+)$/i),
              deferred    = $.Deferred(),
              that        = this,
              canResolve  = true;

          if (this.options.isSameDomain) {  // if link is of same domain
            if (!!hrefMatcher) {  // if the links contain nodes
              if (isNaN(parseInt(hrefMatcher[1]))) {    // if nodeid in link is not a number
                canResolve = false;
                var nickName = this.options.targetEle.href &&
                               this.options.targetEle.href.substring(
                                   this.options.targetEle.href.lastIndexOf("/") + 1,
                                   this.options.targetEle.href.length),
                    node;
                Utils._getNicknameId(that.options, nickName).done(function (response) {
                  node = Utils.getNewNodeModel({}, {connector: that.options.connector});
                  node.attributes = node.parse(response);
                  node = Utils.getNewNodeModel({attributes: node.attributes},
                      {connector: that.options.connector});
                  that.model = node;
                  that.id = that.model.get("id");
                  deferred.resolve();
                }).fail(function(){
                  $(that.options.targetEle).attr("title", lang.cannotFindObject);
                });
              } else {   // if nodeid is a number
                this.id = hrefMatcher[1];
              }
            }
          }
          if (!!canResolve) {
            deferred.resolve();
          }
          return deferred.promise();
        },

        _executeProcess: function () {
          if (this.id !== -1) {
            this.model = new NodeModel({
              id: this.id
            }, {
              connector: this.options.connector,
              commands: commands.getAllSignatures(),
              fields: this.options.fields || {},
              expand: this.options.expand || {}
            });

            this.model.fetch().fail(_.bind(function () {
              $(this.options.targetEle).attr("title", lang.cannotFindObject);
            }, this));
            this.listenTo(this.model, 'sync', function (e) {
              // trigger to parent content view to cache the model and avoid re-fetch.
              this.trigger('model:fetched', this.model);
              this.linkHeading = this.model.attributes.name;
              var that    = this,
                  promise = this._getContent();
              promise.done(function (res) {
                if (that.model.get('type') === 5574) {
                  that._callbackExecuteProcess(res);
                }
                else {
                  $(that.options.targetEle).attr("title",
                      _.str.sformat(lang.goToTooltip, that.model.get("name")));
                }
              });
            });
          }
          else {
            $(this.options.targetEle).attr("title", lang.previewUnavailable);
          }
        },

        _getContent: function () {
          var deferred       = $.Deferred(),
              connector      = this.options.connector,
              collectOptions = {
                url: this._getUrl(),
                type: 'GET'
              };

          connector.makeAjaxCall(collectOptions).done(function (resp) {
            deferred.resolve(resp);
          }).fail(function (resp) {
            deferred.reject(resp);
          });
          return deferred.promise();
        },

        _getUrl: function () {
          return Url.combine(this.options.connector.getConnectionUrl().getApiBase('v2'), '/' +
                 this.subTypeName +
                 '/' + this.id + "/previewcontent");
        },

        _callbackExecuteProcess: function (res) {
          this.modelFetched = true;
          this.linkPreviewImage = res.results.data.firstImage;
          this.linkPreviewContent = res.results.data.previewContent;
          var content = $("<div>" + this.linkPreviewContent + "</div>").find("*").text().trim();
          this.isEmptyContent = (content === "" || content === lang.pageDefaultContent);
          if (!this.isDestroyed) {
            $(this.options.targetEle).attr({"title":"","data-binf-original-title":""});
            if ((this.linkPreviewContent !== null && !this.isEmptyContent) ||
                this.linkPreviewImage !== null) {
              this.render();
              $(this.options.targetEle).binf_popover('show');
              if (this.linkPreviewContent !== null && !this.isEmptyContent) {
                $('.cs-link-content').html(this.linkPreviewContent);
              }
              else {
                $('.cs-link-preview-content').addClass('cs-link-image-only');
              }
              this.eventHandlers();
            } else {
              $(this.options.targetEle).attr("title",
                  _.str.sformat(lang.goToTooltip, this.model.get("name")));
            }
          }
        },

        onDestroy: function () {
          this.hidePopover();
        },
        eventHandlers: function () {
          var that = this;
          $('.cs-link-popover').on("mouseleave", function (e) {
            if ($("#" + e.target.id).attr("aria-describedby") !==
                $(that.options.targetEle).attr("aria-describedby")) {
              that.hidePopover();
            }
          });
          $('.cs-link-expand').on('click', function (e) {
            that.expandLinkView();
          });
        },
        hidePopover: function () {
          $(this.options.targetEle).binf_popover('hide');
          $(this.options.targetEle).binf_popover('destroy');
        },
        expandLinkView: function () {
          this.triggerMethod("execute:defaultAction", this.model);
        },
        onRender: function () {
          var that = this, targetEle = this.options.targetEle;
          if (this.modelFetched) {

            var contentparams = {
                  "LinkHeading": this.linkHeading,
                  "isLinkPreviewImage": this.linkPreviewImage !== null ? true : false,
                  "LinkPreviewImage": this.linkPreviewImage,
                  "isPreviewContent": !this.isEmptyContent,
                  "linkPreviewContent": this.linkPreviewContent
                },
                content       = this.template(contentparams);

            $(targetEle).binf_popover({
              html: true,
              trigger: "manual",
              content: content,
              container: $.fn.binf_modal.getDefaultContainer(),
              placement: function (context) {
                $(context).addClass("cs-link-popover");
                var _tempElement = $('<div/>')
                    .attr("style", "display:none")
                    .addClass("cs-link-popover binf-popover cs-link-popover-temp-div")
                    .append(linkTemplate);
                $(targetEle).append(_tempElement);
                if (that.linkPreviewImage === null ||
                    (that.linkPreviewContent === null || that.isEmptyContent)) {
                  $(context).addClass('cs-link-preview-width');
                }
                var popOverMaxHeight = $(".cs-link-popover-temp-div").height() + 40,
                    popOverMaxWidth  = $(".cs-link-popover-temp-div").width() + 40;
                _tempElement.remove();
                var popOverSource = $(targetEle),
                    offset        = popOverSource.offset(),
                    window_left   = offset.left,
                    window_top    = offset.top,
                    window_right  = (($(window).width()) -
                                     (window_left + popOverSource.outerWidth())),
                    window_bottom = (($(window).height()) -
                                     (window_top + popOverSource.outerHeight(true)));
                if (window_bottom > popOverMaxHeight) {
                  that.popoverPosition = "bottom";
                  return "bottom";
                } else if (window_top > popOverMaxHeight) {
                  that.popoverPosition = "top";
                  return "top";
                } else if (window_right > popOverMaxWidth) {
                  that.popoverPosition = "right";
                  return "right";
                } else if (window_left > popOverMaxWidth) {
                  that.popoverPosition = "left";
                  return "left";
                } else {
                  that.popoverPosition = "auto";
                  return "auto";
                }
              }
            });
          } else if (this.model && !this.model.fetching) {
            $(targetEle).attr("title",
                _.str.sformat(lang.goToTooltip, this.model.get("name")));
          }

          $("*").one('scroll', function () {
            that.destroy();
          });
          $(this.options.targetEle).one("remove", function () {
            that.destroy();
          });
          // hide the popover on mouseleave of target element
          $(this.options.targetEle).off("mouseleave").on("mouseleave", function (e) {
            setTimeout(function () {
              if ($(".cs-link-popover:hover").length === 0) {
                that.destroy();
              }
            }, 10);
          });
        }
      });
      return CSLinkPreview;
    });


csui.define('csui/widgets/html.editor/impl/html.editor.model',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/node/node.model'
], function (_, $, Backbone, Url, NodeModel) {
  "use strict";

  var HtmlEditorModel = NodeModel.extend({

    constructor: function HtmlEditorModel(options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, options);
      //this.options.connector.assignTo(this);
      this.makeConnectable(options).makeFetchable(options);
    }
  });

  _.extend(HtmlEditorModel.prototype, {

    isFetchable: function () {
      return !!this.options;
    },

    url: function () {
      var url = Url.combine(this.options.connector.connection.url,
          "nodes/" + this.options.id + "/content");
      return url;
    },

    parse: function (response) {
      return {
        'data': response,
        'oldData': response //old Data required on cancel after updating data with autosaved
      };
    }
  });

  return HtmlEditorModel;

});



/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/html.editor',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='csui-richtext-message-wrapper'>\n  <div id=\"csui-richtext-content-body-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"loc":{"start":{"line":2,"column":38},"end":{"line":2,"column":46}}}) : helper)))
    + "\" class=\"csui-richtext-message\" data-placeholder = \""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"placeholder") || (depth0 != null ? lookupProperty(depth0,"placeholder") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"placeholder","hash":{},"loc":{"start":{"line":2,"column":98},"end":{"line":2,"column":113}}}) : helper)))
    + "\">\n    "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"data") || (depth0 != null ? lookupProperty(depth0,"data") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"data","hash":{},"loc":{"start":{"line":3,"column":4},"end":{"line":3,"column":16}}}) : helper))) != null ? stack1 : "")
    + "\n  </div>\n</div>\n";
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_html.editor', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/dropdown.menu/dropdown.menu',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"binf-dropdown\">\n    <a title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"tooltip") || (depth0 != null ? lookupProperty(depth0,"tooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"tooltip","hash":{},"loc":{"start":{"line":3,"column":14},"end":{"line":3,"column":25}}}) : helper)))
    + "\" class=\"binf-dropdown-toggle csui-html-editor-control\"\n       href=\"#\" data-binf-toggle=\"dropdown\" role=\"button\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"moreActionsAria") || (depth0 != null ? lookupProperty(depth0,"moreActionsAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"moreActionsAria","hash":{},"loc":{"start":{"line":4,"column":70},"end":{"line":4,"column":89}}}) : helper)))
    + "\"\n       aria-expanded=\"false\">\n      <span class=\"csui-icon "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"reserved") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"loc":{"start":{"line":6,"column":29},"end":{"line":6,"column":84}}})) != null ? stack1 : "")
    + " "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"iconClass") || (depth0 != null ? lookupProperty(depth0,"iconClass") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"iconClass","hash":{},"loc":{"start":{"line":6,"column":85},"end":{"line":6,"column":98}}}) : helper)))
    + "\">\n      </span>\n    </a>\n    <ul class=\"binf-dropdown-menu\" role=\"menu\"></ul>\n  </div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return " csui-html-editor-reserved-icon ";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"reserved") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"loc":{"start":{"line":12,"column":2},"end":{"line":15,"column":9}}})) != null ? stack1 : "");
},"5":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"csui-icon csui-html-editor-reserved-readonly "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"iconClass") || (depth0 != null ? lookupProperty(depth0,"iconClass") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"iconClass","hash":{},"loc":{"start":{"line":13,"column":62},"end":{"line":13,"column":75}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"tooltip") || (depth0 != null ? lookupProperty(depth0,"tooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"tooltip","hash":{},"loc":{"start":{"line":13,"column":84},"end":{"line":13,"column":95}}}) : helper)))
    + "\">\n    </span>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"haveEditPermission") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(4, data, 0),"loc":{"start":{"line":1,"column":0},"end":{"line":16,"column":7}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_dropdown.menu_dropdown.menu', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/dropdown.menu/dropdown.option',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<a tabindex=\"-1\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"actionName") || (depth0 != null ? lookupProperty(depth0,"actionName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"actionName","hash":{},"loc":{"start":{"line":1,"column":24},"end":{"line":1,"column":38}}}) : helper)))
    + "\">\n  "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"actionName") || (depth0 != null ? lookupProperty(depth0,"actionName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"actionName","hash":{},"loc":{"start":{"line":2,"column":2},"end":{"line":2,"column":16}}}) : helper)))
    + "\n</a>";
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_dropdown.menu_dropdown.option', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/widgets/html.editor/impl/dropdown.menu/dropdown.menu.view',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
      'csui/lib/marionette', 'csui/models/nodes', 'csui/utils/commands',
      'csui/utils/contexts/factories/member',
      'csui/utils/base',
      'i18n!csui/widgets/html.editor/impl/nls/lang',
      'hbs!csui/widgets/html.editor/impl/dropdown.menu/dropdown.menu',
      'hbs!csui/widgets/html.editor/impl/dropdown.menu/dropdown.option'],
    function (module, _, $, Backbone, Marionette, NodeCollection, commands,
        MemberModelFactory, base, lang, TemplateDropdownMenu, TemplateDropdownOption) {
      'use strict';

      var DropdownOption = Marionette.ItemView.extend({
        tagName: 'li',
        template: TemplateDropdownOption,
        events: {
          'click a': '_executeAction',
          'keyup a': 'onKeyUp'
        },
        templateHelpers: function () {
          return {
            actionName: lang[this.model.get('signature') || this.model.get('name')]
          };
        },
        constructor: function (options) {
          Marionette.ItemView.prototype.constructor.apply(this, arguments);
        },
        _executeAction: function () {
          if (this.options.openForEdit) {
            this.options.openForEdit();
          } else {
            var cmdExe = this.options.command.execute(this.options.status);
            cmdExe.always(_.bind(function () {
              this.trigger('csui.command.executed', cmdExe);
            }, this));
          }
        },

        onKeyUp: function (event) {
          if ([13, 32].indexOf(event.keyCode) !== -1) { // enter, space
            this._executeAction();
          }
        }
      });

      var DropdownMenuView = Marionette.CompositeView.extend({
        className: "csui-html-editor-dropdown",
        template: TemplateDropdownMenu,
        childView: DropdownOption,
        childViewContainer: "ul.binf-dropdown-menu",
        childEvents: {
          'csui.command.executed': 'afterCommandExecution'
        },
        ui: {
          'dropdownMenu': '.binf-dropdown-menu'
        },
        childViewOptions: function (actionModel) {
          var signature = !!actionModel.get('openForEdit') ? 'HTMLEdit' :
                          actionModel.get('signature');
          //from restapi actionModel getting all small
          //but command signature is first cap in actual
          //signature = signature.charAt(0).toUpperCase() + signature.substring(1);
          var options = {
            status: this.status,
            node: this.options.node
          };
          if (signature === 'HTMLEdit') {
            options.openForEdit = this.options.openForEdit;
          } else {
            if (signature === 'properties') {
              //signature of properties command starts with Capital char
              //deviation from other this.model signature.
              signature = "Properties";
            } else if (['reserve', 'unreserve'].indexOf(signature) !== -1) {
              if (signature === 'unreserve') {
                signature = "Unreserve";
              } else {
                signature = "Reserve";
              }
              signature += 'Doc';
            }
            options.command = commands.get(signature);
          }
        
        
          return options;
        },
        templateHelpers: function () {
          var helpers = {
            haveEditPermission: this.haveEditPermissions,
            tooltip: lang.more,
            iconClass: 'icon-html-edit-toolbar-more',
            reserved: this.node.get('reserved'),
            moreActionsAria: _.str.sformat(lang.moreActionsAria,
                !!this.parentView.options.title ? this.parentView.options.title : '')
          };
          if (helpers.reserved) {
            var selfReserved = this.node.get('reserved_user_id') === this.user.get(
                    'id');
            if (!selfReserved) {
              helpers.tooltip = _.str.sformat(lang.reservedBy, this.node.get('reserved_user_id'),
                  base.formatExactDate((
                      this.node.get('reserved_date'))));
            }
            helpers.iconClass = selfReserved ? 'icon-html-editor-reserved-owned' :
                                'icon-html-editor-reserved_other';
          }
          return helpers;
        },

        constructor: function DropdownMenuView(options) {
          this.parentView = options.parentView;
          this.node = options.node;
          this.user = options.user;
          this.haveEditPermissions = !!(options.node.actions.get('reserve') || options.node.actions
              .get('unreserve'));
          options.collection = this.buildCollection();
          Marionette.CompositeView.prototype.constructor.apply(this, arguments);
          this.listenTo(this.options.node, 'change', this.updateActionCollection);
          this.status = {
            context: this.options.context,
            container: this.options.node,
            nodes: new NodeCollection([this.options.node])
          };
          if (this.node.get('reserved') &&
              this.node.get('reserved_user_id') !== this.user.get('id')) {
            this.reservedByUserModel = this.options.context.getModel(MemberModelFactory, {
              attributes: {
                id: this.node.get('reserved_user_id')
              }
            });
          }
        },

        buildCollection: function () {
          // it should be better if we manipulate the collection rather than creating new
          // but for now let it be this way
          var collection = new Backbone.Collection();
          if (this.haveEditPermissions) {
            if (!this.node.get('reserved') ||
                this.node.get('reserved_user_id') === this.user.get('id')) {
              collection.add(new Backbone.Model({
                openForEdit: true,
                name: 'Edit'
              }));
            }
            var action, supportedActions = ['properties', 'permissions', 'unreserve'],
                self                     = this;
            supportedActions.map(function (action) {
              action = self.node.actions.get(action);
              action && collection.add(action);
            });
          }
          return collection;
        },

        updateActionCollection: function () {
          this.haveEditPermissions = !!(this.options.node.actions.get('reserve') ||
                                        this.options.node.actions.get('unreserve'));
          this.collection = this.buildCollection();
          this.render();
        },

        afterCommandExecution: function (childView, promise) {
          promise.fail(_.bind(function () {
            // add fail callbacks here
            if (childView.model.get('name') === 'Unreserve') {
              // concurrent scenerio where unreserve is shown
              // but item has been unreserved already
              this.node.fetch();
            }
          }, this));
        },
        adjustDropdownMenu: function () {
          if (document.dir === 'rtl') {
            return false;
          }
          this.ui.dropdownMenu.removeClass("csui-html-editor-floating-dd-menu");
          var dropdownLeftOffset   = this.ui.dropdownMenu.offset().left,
              dropdownWidth        = this.ui.dropdownMenu.outerWidth(),
              originatingViewWidth = document.body.scrollWidth,
              ddMenuOverlaps       = dropdownLeftOffset + (2 * dropdownWidth) <=
                                     originatingViewWidth;
          if (ddMenuOverlaps) {
            this.ui.dropdownMenu.addClass("csui-html-editor-floating-dd-menu");
          }
        },
        onRender: function () {
          var dropDown = this.$el.find('.binf-dropdown');
          dropDown.on('binf.dropdown.before.show', _.bind(function () {
            dropDown.on('binf.dropdown.after.show', this.adjustDropdownMenu.bind(this));
            $(window).on('resize.html.editor.dropdown.menu', this.adjustDropdownMenu.bind(
                this));
          }, this));
          dropDown.on('hide.binf.dropdown', _.bind(function () {
            dropDown.off('binf.dropdown.after.show');
            $(window).off('resize.html.editor.dropdown.menu');
          }));
          if (!!this.reservedByUserModel && !this.reservedByUserModel.fetched) {
            this.reservedByUserModel.fetch().done(_.bind(function (response) {
              this.$el.find('.binf-dropdown-toggle.csui-html-editor-control,' +
                            ' .csui-html-editor-reserved-readonly').attr('title',
                  _.str.sformat(lang.reservedBy, response.data.display_name,
                      base.formatExactDate((
                          this.node.get('reserved_date')))));
            }, this));
          }
        }
      });
      return DropdownMenuView;
    });


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/edit.icon',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<span class=\"csui-rich-text-edit-icon-wrapper csui-rich-text-edit-icon-wrapper-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"loc":{"start":{"line":1,"column":79},"end":{"line":1,"column":87}}}) : helper)))
    + "\">\n  <span title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"editLable") || (depth0 != null ? lookupProperty(depth0,"editLable") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"editLable","hash":{},"loc":{"start":{"line":2,"column":15},"end":{"line":2,"column":30}}}) : helper)))
    + "\" class=\"icon icon-edit icon-edit-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"loc":{"start":{"line":2,"column":64},"end":{"line":2,"column":72}}}) : helper)))
    + "\"></span>\n</span>";
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_edit.icon', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/widgets/html.editor/impl/html.editor.content.view',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  "csui/lib/radio",
  'csui/utils/contexts/factories/connector',
  'csui/utils/url',
  'csui/utils/base',
  'csui/utils/froala/bootstrap',
  'csui/models/node/node.model',
  'csui/utils/contexts/factories/user',
  'csui/widgets/html.editor/impl/html.editor.model',
  'hbs!csui/widgets/html.editor/impl/html.editor', 'csui/dialogs/modal.alert/modal.alert',
  'csui/controls/progressblocker/blocker',
  'csui/controls/error/error.view',
  'csui/widgets/html.editor/impl/cslink.preview/cslink.preview.view',
  'csui/controls/rich.text.editor/rich.text.editor',
  'csui/widgets/html.editor/impl/dropdown.menu/dropdown.menu.view',
  'csui/controls/globalmessage/globalmessage',
  'csui/utils/node.links/node.links',
  'i18n!csui/widgets/html.editor/impl/nls/lang',
  'hbs!csui/widgets/html.editor/impl/edit.icon',
  'hbs!csui/widgets/html.editor/impl/html.editor.action.buttons',
  'css!csui/widgets/html.editor/impl/html.editor',
], function ($, _, Backbone, Marionette, Radio, ConnectorFactory, Url, base, BootstrapFroalaEditor, NodeModel, UserModelFactory,
  HtmlEditorModel, htmlEditorTemplate, ModalAlert,
  BlockingView, ErrorView,
  LinkPreview, RichTextEditor, DropdownMenu, GlobalMessage, NodeLinks, lang, template,
  htmlEditorButtonsTemplate) {

  'use strict';
  var HtmlEditorContentView = Marionette.ItemView.extend({

    className: 'csui-html-editor-wrapper',

    modelEvents: {
      'change': 'render',
      'error': 'render'
    },

    ui: {
      richText: '.csui-richtext-message'
    },

    events: {
      'mouseenter .csui-richtext-message[contenteditable="false"] a': '_showPreview',
      'focusin .csui-richtext-message[contenteditable="true"]': '_actionButtonsPositionInEdge',
      'focusin .csui-richtext-message[contenteditable="false"] a': '_updateUrl'
    },

    getTemplate: function () {
      return this.model.error ? false : htmlEditorTemplate;
    },

    templateHelpers: function () {
      return {
        'placeholder': lang.PageDefaultContent,
        'id': this.model.get('id'),
        'data': this.model.get('data')
      };
    },

    constructor: function HtmlEditorContentView(options) {
      options || (options = {});
      options.id = options.wikiPageId;
      options = _.extend(options, (options.data = {}));
      this.parentView = options.parentView;
      this.ui.richTextEle = '#csui-richtext-content-body' + options.id;
      BlockingView.imbue(this);
      this.context = options.context;
      this.connector = this.context.getObject(ConnectorFactory);
      //wiki page node model
      this.node = new NodeModel({
        id: options.id
      }, {
        connector: this.connector,
        expand: {
          properties: ['original_id', 'parent_id'], //parent_id -> we need image_folder_id
        },
        commands: ['permissions', 'properties', 'reserve', 'unreserve',
          'addcategory', 'editpermissions']
      });
      this.user = this.context.getModel(UserModelFactory);
      if (!options.model) {
        //model for html content
        options.model = new HtmlEditorModel({
          connector: this.connector,
          context: this.context,
          id: options.id
        });
        var url = Url.combine(this.connector.connection.url,
          "nodes/" + options.id + "/content");
        options.model.fetch({
          url: url,
          success: options.model.fetchSuccess,
          error: options.model.fetchError,
          dataType: "text"
        }).done(_.bind(function (htmlContent) {
          //fetch the latest version
          Radio.channel("quicklink:Tiles").trigger("transparent:background");
          this._getLatestVersion().done(_.bind(function () {
            this.oldVersion = this.model.get('version');
          }, this));
        }, this));
      }

      options.richTextElementId = 'csui-richtext-content-body-' + options.id;

      Marionette.ItemView.prototype.constructor.call(this, options);

      this._errorRegion = new Marionette.Region({
        el: this.el
      });

      this.listenTo(this.model, 'sync', _.bind(function () {
        if (!this.model.error) {
          this.user.ensureFetched().done(this._renderActionsDropdown.bind(this));
        }
      }, this));

      this.mode = 'read';
      //RichText Util class That contain utility methods
      this.utils = RichTextEditor.getRichTextEditorUtils();
      this.enableSaveButton = false;

      // store all the preview link views to avoid re-fetch on every hover.
      this.previewLinkViews = {};
    },

    onRender: function () {
      var error = this.model.error;
      this.$el[error ? 'addClass' : 'removeClass']('csui-disabled');
      error ? this.$el.parent().addClass('csui-html-editor-error') : this.$el.parent().removeClass('csui-html-editor-error');
      // If fetching the node failed, render error widget over this one.
      if (error) {
        this._errorRegion.show(new ErrorView({
          model: new Backbone.Model({
            message: lang.noWikiPageFound,
            title: error.message
          })
        }));
      }
      this.$el.addClass(this.options.header ? '' : 'csui-html-editor-no-header');
      this.$el.parent().addClass(this.options.header || error ? '' : 'tile');
      this.filterHtmlContent();
      this.refreshTabableElements();
    },

    /**
     * This method filters below obsolete data from html content.
     * Attributes:
     *  border, cellspacing, cellpadding from table element.
     * Elements:
     *  big.
     */
    filterHtmlContent: function () {
      this.$el.find('table').each(function (index, table) {
        $(table).css({
          'border': table.getAttribute('border') + 'px solid',
          'borderSpacing': table.getAttribute('cellspacing') + 'px',
          'text-align': table.getAttribute('align')
        }).removeAttr('cellpadding cellspacing border align');
        $(table).find('th,td').css('padding', table.getAttribute('cellpadding') + 'px');
      });
      this.$el.find('big').each(function (index, bigEle) {
        //TODO: add attributes if any.
        $(bigEle).replaceWith('<span class="csui-big">' + $(bigEle).html() + '</span>');
      });
    },

    refreshTabableElements: function () {
      if (this.mode === 'read') {
        this.tabableElements = this.$el.find('a').toArray();
      } else {
        this.tabableElements = [];
        this.tabableElements.push(this.editorInstance.$el[0]);
        this.tabableElements = this.tabableElements.concat(
          $('.froala-save-cancel' +
            '.csui-html-editor-action-buttons > button:not([disabled])').toArray());
      }
      this.currentlyFocusedElementIndex = -1;
    },

    moveTab: function (event) {
      this.currentlyFocusedElementIndex = this.tabableElements.indexOf(event.target);
      var currentFocus = $(this.tabableElements[this.currentlyFocusedElementIndex]),
        resetTabIndex = false;
      if (event.keyCode === 9) {
        if (event.shiftKey) {
          if (this.currentlyFocusedElementIndex > 0) {
            this.currentlyFocusedElementIndex -= 1;
            $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            event.stopPropagation();
            event.preventDefault();
          } else {
            resetTabIndex = true;
          }
        } else {
          if (this.currentlyFocusedElementIndex < this.tabableElements.length - 1) {
            this.currentlyFocusedElementIndex += 1;
            $(this.tabableElements[this.currentlyFocusedElementIndex]).prop('tabindex', 0).trigger('focus');
            event.stopPropagation();
            event.preventDefault();
          } else {
            resetTabIndex = true;
          }
        }
        if (resetTabIndex) {
          if (this.mode === 'write') {
            if (event.shiftKey) {
              this.currentlyFocusedElementIndex = this.tabableElements.length - 1;
            } else {
              this.currentlyFocusedElementIndex = 0;
            }
            $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
          } else {
            currentFocus.on('focusout', _.bind(function () {
              currentFocus.off('focusout');
              this.currentlyFocusedElementIndex = -1;
            }, this));
          }
        }
        if (this.mode === 'write') {
          event.stopPropagation();
          event.preventDefault();
        }
      }
    },

    _showPreview: function (event) {
      var linkPreview, options;
      this.utils.getUrl(this, event).done(_.bind(function () {
        options = _.extend({
          targetEle: event.target,
          connector: this.connector
        }, this.options);
        if (!this.previewLinkViews[event.target.href]) {
          linkPreview = new LinkPreview(options);
          // store the model once the linkPreview view fetches it.
          this.listenTo(linkPreview, 'model:fetched', function (model) {
            this.previewLinkViews[event.target.href] = model;
          });
        } else {
          // pass the model to the view if already fetched.
          options.previewModel = this.previewLinkViews[event.target.href];
          linkPreview = new LinkPreview(options);
        }
        linkPreview.render();
      }, this));

    },

    _updateUrl: function (event) {
      this.utils.getUrl(this, event);
    },

    _renderActionsDropdown: function () {
      this.node.fetch().done(_.bind(function (response) {
        this.dropdownMenu = new DropdownMenu({
          openForEdit: this._openForEdit.bind(this),
          node: this.node,
          user: this.user,
          context: this.options.context,
          parentView: this
        });
        new Marionette.Region({
          el: this.parentView.$el.find(".tile-controls")
        }).show(this.dropdownMenu);

        this.grandParentEle = this.$el.closest('.csui-html-editor-grand-parent');

        this.listenTo(this.dropdownMenu, 'render', _.bind(function () {
          this.refreshTabableElements();
          this.trigger('refresh:tabindexes');
        }, this));

        this.editIconEle = this.parentView.$el.find(".tile-controls");
        if (!!this.options.header) {
          var tileHeaderEleTitle = this.options.titlefield || '';
          this.editIconEle.closest('.tile-header').attr({
            'title': tileHeaderEleTitle,
            'aria-label': tileHeaderEleTitle
          });
        }
      }, this));
    },

    editModeAccessibility: function () {
      $(document).on('keydown.html.editor', _.bind(function (event) {
        const element = $('.fr-toolbar')[0];
        if (element && element.style.display != 'none' && !$.contains(element, event.target)) {
          if (event.keyCode === 9) {
            this.moveTab(event);
          } else if ([13, 32].indexOf(event.keyCode) !== -1 &&
            $(event.target).hasClass('csui-html-edit-icon')) {
            $(event.target).trigger('click');
            event.preventDefault();
          }
        }
      }, this));
    },

    removeEditModeAccessibility: function () {
      $(document).off('keydown.html.editor');
    },

    _openForEdit: function () {
      this.editModeAccessibility();
      this.blockActions();
      this._getLatestVersion().done(_.bind(function () {
        this._toggleReserve(true).done(_.bind(function () {
          if (this.oldVersion === this.model.get('version')) {
            this._getLatestContent().done(_.bind(function () {
              this._editContent();
            }, this));

          } else {
            //Mean while new version get added, inform same to user through modal dialog
            ModalAlert.confirmQuestion(_.bind(function (result) {

              if (result) {
                //dontGetLatestcontent
                this._editContent();
                this.enableSaveButton = true;
              } else {
                //GetTheLatestContent
                this._getLatestContent().done(_.bind(function () {
                  this._editContent();
                  this.oldVersion = this.model.get('version');
                  this.enableSaveButton = false;
                }, this));
              }

              this.alreadyTriggered = true;

            }, this), lang.versionDifferenceConfirmMessage, lang.versionDifferenceConfirmTitle);

          }
        }, this)).fail(this.unblockActions.bind(this));
      }, this)).fail(this.unblockActions.bind(this));
      if (base.isAppleMobile()) {
        this.$el.find(".csui-richtext-message").attr("contenteditable", true).trigger('focus');
      }
    },

    destroyFREditor: function (FREditor) {
      $(".csui-rich-text-mask").remove();
      $(".csui-html-editor-zindex").removeClass('csui-html-editor-zindex');
      $("#csui-richtext-sharedspace").remove();
      $(".cui-rich-editor-widget-wrapper").removeAttr('style');
      this.editIconEle.removeClass('binf-hidden');
      this.unblockActions();
      this._unbindEvents();
      $("body").find(".csui-html-editor-action-buttons").remove();
      window.removeEventListener('resize', this._positionActionButtonsInstance, true);
      this.removeEditModeAccessibility();
      this.mode = 'read';
      this.refreshTabableElements();
      $('.csui-html-editor-zero-zindex').removeClass('csui-html-editor-zero-zindex');
      FREditor.destroy();
    },

    
    extractSelectionData: function(selection) {
      if (!selection) {
          return null;
      }
      return {
          // Extract and save necessary properties from the selection object
          anchorNode: selection.anchorNode,
          anchorOffset: selection.anchorOffset,
          focusNode: selection.focusNode,
          focusOffset: selection.focusOffset,
      };
  },

    _editContent: async function () {
      var self = this;
      self.contentChanged = !!self.autoSaved;
      const imageFolderId = self.node.get('parent_id_expand').image_folder_id;
      async function getImageId(file) {
        try {
          var formData = new FormData();
          formData.append("parent_id", imageFolderId),
          formData.append("type", 144);
          formData.append("name", self.editorInstance.opts.imageUploadParams.name);
          formData.append('file', file);
            var saveParams = {
                url: self.connector.connection.url + '/nodes',
                type: 'POST',
                data: formData,
                connector: self.connector
            };
    
            var response = await self.updateAjaxCall(saveParams);
    
            return response.id;
        } catch (error) {
            console.error('Error fetching image ID:', error);
            throw error; // Rethrow the error to be caught by the caller
        }
    }
    var connectionUrl = new Url(this.connector.connection.url),
      cgiUrl = connectionUrl.getCgiScript();
      // Froala Editor configuration
      var froalaConfig = {
        placeholderText: lang.PageDefaultContent,//placeholder for default page content
        externalParams: {
          getImageId: getImageId.bind(this),
          connectionUrl: cgiUrl,
          imageBrowseEnabled: self.node.get('parent_id_expand').imagebrowseenabled,
          enableSaveButton: self._enableSaveButton,
          disableSaveButton: self._disableSaveButton,
          widgetSelector: 'div[data-csui-widget_type]'
        },

        requestHeaders: {
          otcsticket: self.connector.connection.session.ticket
        },

        events:{
          'cancel': function(){
              var e = this;
              self.blockActions();
              if (self.contentChanged) {
                this.$tb.hide();
                this.opts.externalParams.actionButtons.hide();
                ModalAlert.confirmQuestion(function (result) {
                  if (result) {
                    self._getLatestVersion().done(function () {
                      if (self.oldVersion !== self.model.get('version')) {
                        self._getLatestContent().done(_.bind(function () {
                          self.oldVersion = this.model.get('version');
                          e.html.set(self.model.get('oldData'));
                        }, self)).fail(function (xhr) {
                          self.editorInstance.events.trigger('onFailure', [xhr]);
                        });
                      } else {
                        e.html.set(self.model.get('oldData'));
                      }
                      self.trigger('updateScrollbar');
                      self.destroyFREditor(e);
                      self.autoSaved && self.deleteAutoSavedContent({
                        connector: self.connector,
                        wikiId: self.node.get('parent_id'),
                        pageId: self.model.get('id')
                      });
                      self._toggleReserve();
                    }).fail(function (xhr) {
                      self.editorInstance.events.trigger('onFailure', [xhr]);
                    });
                  } else {
                    this.$tb.show();
                    this.opts.externalParams.actionButtons.show();
                    $(self.options.richTextElementId).trigger('focus');
                    self.unblockActions();
                  }
                }.bind(this), lang.CancelConfirmMessage, lang.cancelTitle,
                  ModalAlert.buttonData.Yes = {
                    label: lang.Yes,
                    tooltip: lang.Yes,
                    aria: ''
                  },
                  ModalAlert.buttonData.No = {
                    label: lang.No,
                    tooltip: lang.No,
                    aria: ''
                  });
              } else {
                self._getLatestVersion().done(function () {
                  if (self.oldVersion !== self.model.get('version')) {
                    self._getLatestContent().done(_.bind(function () {
                      self.oldVersion = this.model.get('version');
                      e.html.set(self.model.get('oldData'));
                    }, self)).fail(function (xhr) {
                      self.editorInstance.events.trigger('onFailure', [xhr]);
                    });
                  } else {
                    e.html.set(self.model.get('oldData'));
                  }
                  self.destroyFREditor(e);
                  self._toggleReserve();
                }).fail(function (xhr) {
                  self.editorInstance.events.trigger('onFailure', [xhr]);
                });
              }
          },

          'save.before': function () {
            self._autoSaveContent();
          },

          'onSave': function () {
            self.blockActions();
            self._getLatestVersion().done(function () {
              if (!!self.alreadyTriggered || self.oldVersion === self.model.get('version')) {
                self.enableSaveButton = false;
                self._saveContent().done(() => {
                  self.editorInstance.events.trigger('onSuccess');
                }).fail((xhr) => {
                  self.editorInstance.events.trigger('onFailure', [xhr]);
                });
              } else {
                ModalAlert.confirmQuestion(function (result) {
                  if (result) {
                    self.enableSaveButton = false;
                    self._saveContent().done(() => {
                      self.editorInstance.events.trigger('onSuccess');
                    }).fail((xhr) => {
                      self.editorInstance.events.trigger('onFailure', [xhr]);
                    });
                  } else {
                    $(self.options.richTextElementId).trigger('focus');
                    self._enableSaveButton();
                    self.unblockActions();
                  }
                }, lang.versionDifferenceConfirmMessage, lang.versionDifferenceConfirmTitle);
              }
            }).fail(function (xhr) {
              self.editorInstance.events.trigger('onFailure', [xhr]);
            });
          },

          'onSuccess': function () {
            self.model.set({
              'data': self.editorInstance.html.get(),
              'oldData': self.editorInstance.html.get()
            });
            self._getLatestVersion().done(function () {
              self.oldVersion = self.model.get('version');
              self.destroyFREditor(self.editorInstance);
              self.node.fetch(); // to fetch latest actions
              self.unblockActions();
            }).fail(function (xhr) {
              self.editorInstance.events.trigger('onFailure', [xhr]);
            });
          },
  
          'onFailure': function (xhr) {
            let error = new base.RequestErrorMessage(xhr);
            GlobalMessage.showMessage('error', error.toString() || xhr?.message);
            self.trigger('updateScrollbar');
            self.unblockActions();
            self._enableSaveButton();
          },

          'click': function (event) {
            const clickedElement = event.target;
            //Avoiding opening of link on click in edit mode
            if (clickedElement.nodeName === 'A' && clickedElement.href && !this.edit.isDisabled()) {
              event.preventDefault();
            }
          },

          initialized: function () {
            $(self.options.richTextElementId).addClass(
                'csui-rich-text-editor-toolbar');
            self.mode = 'write';
            self.unblockActions();
            self.$el.find('.csui-richtext-message').trigger('focus');
            self.editorInstance.opts.externalParams.actionButtons = $('.froala-save-cancel');
            //Save editor text initially in editorInstance, it can be used for dirty checking.
            self.editorInstance.initialEditorText = self.editorInstance.html.get().trim();
            self._actionButtonsPosition();
            self.refreshTabableElements();
            resetMasking(); // reset the masking after froala editor is initialized
            this.html.get = this.opts.customHtmlGet.bind(this);
          },

          contentChanged: function () {
            self._validateState();
          }
        }
      };

      self.editorInstance = await BootstrapFroalaEditor('#' + this.options.richTextElementId, froalaConfig);
      window.onbeforeunload = function () {
        return false;
      };
      csui.require(["csui/dialogs/node.picker/node.picker"], function (
        NodePicker
      ) {
        self.editorInstance.opts.csLink = {
          nodeLink: NodeLinks,
          nodePicker: function () {
            return new NodePicker({
              connector: self.connector,
              dialogTitle: lang.contentServerLink,
              context: self.options.context,
              resolveShortcuts: true,
              resultOriginalNode: false,
              currentUser:
                self.options.context.getModel(UserModelFactory),
            });
          }
        };
      });
      var $rteEle = self.$("#" + this.options.richTextElementId);
      var froalaWrapper = $rteEle.find('.fr-wrapper');
      froalaWrapper.attr("contenteditable", true);
      this.editIconEle.addClass('binf-hidden');
      var rteMask          = document.createElement('div'),
          rteBodyMask      = document.createElement('div'),
          defaultContainer = $.fn.binf_modal.getDefaultContainer();

      rteMask.className = 'csui-rich-text-mask';
      rteBodyMask.className = 'csui-rich-text-mask csui-rich-text-body-mask';

      self.grandParentEle.before(rteMask);
      $(defaultContainer).append(rteBodyMask);

      if (base.isMSBrowser()) {
        // breadcrumb's z-index is more than the perspective container, so let's degrade it's z-index.
        !!$('#breadcrumb-wrap') &&
        $('#breadcrumb-wrap').addClass('csui-html-editor-zero-zindex');
      }

      var $rteMask     = $(rteMask),
          $rteBodyMask = $(rteBodyMask),
          // tile view with header, tile-header height is 70px, and it's padding-top is 10px, so reduce it.
          $maskOfffset = this.grandParentEle.find('.csui-html-editor-no-header').length > 0 ?
                         5 :
                         80,
          resetMasking = function () {
            $rteBodyMask.css("height", "0px");
            $rteMask.css("top", "0px");

            var rteMaskTop        = ($rteEle.offset().top - $(rteMask).offset().top -
                                     $maskOfffset),
                rteBodyMaskHeight = $rteEle.offset().top - $maskOfffset;

            rteBodyMaskHeight = rteMaskTop < 0 ? rteBodyMaskHeight + -rteMaskTop :
                                rteBodyMaskHeight;
            rteMaskTop = rteMaskTop < 0 ? 0 : rteMaskTop;

            $rteBodyMask.css("height", rteBodyMaskHeight + "px");
            $rteMask.css({
              "height": document.body.scrollHeight - rteBodyMask.offsetHeight,
              "top": rteMaskTop
            });

            $(rteMask).parent().addClass('csui-html-editor-zindex');
          };

      resetMasking();
      $(window).on('resize', resetMasking);
      $('.csui-richtext-message').on('change', resetMasking);
    },

    _saveContent: function () {
      var self = this;
      var deferred = $.Deferred();
  
      var formData = new FormData();
      formData.append("TextField", self.editorInstance.html.get() === "" ? "<p></p>" : self.editorInstance.html.get());
  
      var saveParams = {
          url: self.connector.connection.url + '/nodes/' + self.options.id,
          type: 'PUT',
          data: formData,
          dataType: 'json',
          processData: false,
          contentType: false,
          connector: self.connector,
          view: self,
          requestType: 'saveContent'
      };
  
      var updatePromise = self.updateAjaxCall(saveParams);
        var deleteAutoSavedPromise = function() {
          if (self.autoSaved) {
            const apiUrl = self.connector.getConnectionUrl().getApiBase('v2');
            const wikiId = self.node.get('parent_id');
            const pageId = self.model.get('id');
            
            const args = {
              type: 'DELETE',
              connector: self.connector,
              wikiId: wikiId,
              pageId: pageId,
              url: Url.combine(apiUrl, '/wiki/' + wikiId + '/autosave/' + pageId)
            };
            return self.updateAjaxCall(args);
          } else {
            return $.Deferred().resolve().promise();
          }
        };
        var toggleReservePromise = function() {
          return self._toggleReserve(true);
      };
  
      Promise.all([updatePromise, deleteAutoSavedPromise(), toggleReservePromise()])
          .then(function() {
              deferred.resolve();
          })
          .catch(function(error) {
              deferred.reject(error);
          });
        return deferred.promise();
    },

    _disableSaveButton: function () {
      var saveButton = $('body').find(".csui-html-edit-save");
      if (saveButton.length) {
        saveButton[0].disabled = true;
      }

    },
    _enableSaveButton: function () {
      var saveButton = $('body').find(".csui-html-edit-save");
      if (saveButton.length) {
        saveButton[0].disabled = false;
      }

    },

    _toggleReserve: function (toEditMode) {
      let deferred = $.Deferred(), formData = new FormData();
      if (!!toEditMode) {
        if (this.node.get('reserved') && this.node.get('reserved_user_id') === this.user.get('id')) { // no need to reserve again if current user has reserved
          deferred.resolve(); 
          return deferred;
        } else {
          formData.append('reserved_user_id', this.user.get('id'));
        }
      } else {
        if (this.node.get('reserved')) { 
          formData.append('reserved_user_id', null);
        } else {
          this.node.fetch(); // for fetching the latest actions
          deferred.resolve();
          return deferred;
        }
      }
      let contentUrl = this.connector.connection.url + '/nodes/' + this.node.get('id'), self = this;
      this.updateAjaxCall({
        url: contentUrl,
        connector: this.connector,
        data: formData,
        type: 'PUT'
      }).done(function () {
        deferred.resolve();
      }).fail(function (xhr) {
        GlobalMessage.showMessage("error", xhr.responseJSON.errorDetail);
        deferred.reject();
      }).always(function () {
        // refreshing node actions for concurrent case
        self.node.fetch();
      });
      return deferred;
    },

    _autoSaveContent: function () {
      let contentDiv = this.editorInstance;
      if (!!contentDiv && contentDiv.html.get().trim() !== this.model.get('data').trim()) {
        let source = contentDiv.html.get(),
          formData = new FormData();
        formData.append("wikiId", this.node.get('parent_id'));
        formData.append("pageId", this.model.get('id'));
        formData.append("source", source);

        this.updateAjaxCall({
          connector: this.connector,
          url: Url.combine(this.connector.getConnectionUrl().getApiBase('v2'),
            "/wiki/autosave"),
          type: "POST",
          data: formData,
          view: this
        });
        this.autoSaved = true;
      }
    },

    _getLatestContent: function () {
      var ajaxParams = {
        "url": Url.combine(this.connector.getConnectionUrl().getApiBase('v2'), "/wiki/" +
          this.model.get('id') + "/autosave"),
        "type": "GET",
        "requestType": "getContent",
        "connector": this.connector,
        "view": this
      };
      return this.updateAjaxCall(ajaxParams);
    },

    _getLatestVersion: function () {
      var ajaxParams = {
        "url": Url.combine(this.connector.getConnectionUrl().getApiBase('v2'), "/nodes/" +
          this.model.get('id')),
        "type": "GET",
        "requestType": "versions-reserve",
        "connector": this.connector,
        "view": this
      };
      return this.updateAjaxCall(ajaxParams);
    },

    _validateState: function () {
      this.utils = this.utils || RichTextEditor.getRichTextEditorUtils();

      if (!!this.editorInstance && this.editorInstance.html.get().trim() !== this.editorInstance.initialEditorText) {
        // TODO Froala: currently froala is modifying the content when we go in edit mode (appending unlicensed warning etc) causing save button to be enabled unexpectedly
        this.contentChanged = true;
        this._enableSaveButton();
        this.refreshTabableElements();
      } else {
        this.contentChanged = false;
        this._disableSaveButton();
        this.refreshTabableElements();
      }
    },

    /**
     * this method adds action buttons (save and cancel) to html editor view.
     *
     * @private
     */
    _appendActionButtons: function () {
      var toolbar = $("body"),
        data = {
          'saveLabel': lang.saveTitle,
          'cancelLabel': lang.cancelTitle,
          'cancelAria': lang.cancelAria,
          'saveAria': lang.saveAria,
          'isFroala': true /*TODO Froala: Remove specific stylings for save and cancel and make it generic*/
        };
      this.scrollbarWidth = window.innerWidth - document.body.clientWidth;
      toolbar.append(htmlEditorButtonsTemplate(data));
      toolbar.find(".csui-html-edit-save").on("click", _.bind(function () {
        this.editorInstance.events.trigger('onSave');
      }, this));

      toolbar.find(".csui-html-edit-cancel").on("click", _.bind(function () {
        this.editorInstance.events.trigger('cancel');
      }, this));
    },

    _actionButtonsPosition: function () {
      if (!!this.enableSaveButton) {
        this._enableSaveButton();
        this.refreshTabableElements();
      } else {
        this._disableSaveButton();
        this.refreshTabableElements();
      }
    },

    _unbindEvents: function () {
      window.onbeforeunload = null;
    },

    updateAjaxCall: function (args) {
      var deferred = $.Deferred(),
        url = args.url,
        data = args.data,
        type = args.type,
        connector = args.connector,
        self = args.view,
        requestType = args.requestType;
      connector.makeAjaxCall({
        url: url,
        type: type,
        data: data,
        contentType: false,
        crossDomain: true,
        processData: false,
        success: function (response, status, jXHR) {
          switch (requestType) {
            case "getContent":
              if (!!response.results.data.autoSaved) {
                self.autoSaved = true;
                ModalAlert.confirmQuestion(function (result) {
                  var content = response.results.data.content;
                  if (result) {
                    content = response.results.data.autoSaved;
                    self.enableSaveButton = true;
                  } else {
                    self.enableSaveButton = false;
                    // Delete Autosaved data on clicking discard button
                    self.deleteAutoSavedContent({
                      connector: self.connector,
                      wikiId: self.node.get('parent_id'),
                      pageId: self.model.get('id')
                    });
                    self._toggleReserve();
                  }
                  self.model.set({
                    'data': content
                  });
                  deferred.resolve();
                }, lang.RestoreDialogMessage, lang.RestoreDiaglogTitle,
                  ModalAlert.buttonData.Yes = {
                    label: lang.Continue,
                    tooltip: lang.Continue,
                    aria: ''
                  },
                  ModalAlert.buttonData.No = {
                    label: lang.Discard,
                    tooltip: lang.Discard,
                    aria: ''
                  });
              } else {
                self.model.set({
                  'data': response.results.data.content,
                  'oldData': response.results.data.content
                });
                deferred.resolve();
              }
              break;
            case 'versions-reserve':
              self.model.attributes.version = response.results.data.versions.length;
              self.node.set({
                'reserved': response.results.data.properties.reserved,
                'reserved_user_id': response.results.data.properties.reserved_user_id
              });

              deferred.resolve();
              break;
            default:
              deferred.resolve(response);
          }
        },
        error: function (xhr, status, text) {
          deferred.reject(xhr);
        }
      });
      return deferred.promise();
    },

    deleteAutoSavedContent: function (args) {
      if (this.autoSaved) {
        args.type = "DELETE";
        args.url = Url.combine(args.connector.getConnectionUrl().getApiBase('v2'), "/wiki/" +
          args.wikiId + "/autosave/" + args.pageId);
        this.updateAjaxCall(args);
        this.autoSaved = false;
      }
    }
  });

  return HtmlEditorContentView;

});

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/html.editor.wrapper.template',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-html-editor-tile-controls tile-controls\"></div>\n<div class=\"csui-html-editor-wrapper-parent cui-rich-editor-widget-wrapper\ncsui-html-editor-wrapper-parent-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"loc":{"start":{"line":3,"column":32},"end":{"line":3,"column":40}}}) : helper)))
    + "\">\n</div>";
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_html.editor.wrapper.template', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/widgets/html.editor/html.editor.view',[
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  "csui/lib/radio",
  'csui/models/node/node.model',
  'csui/models/node.children2/node.children2',
  'csui/utils/contexts/factories/node',
  'csui/utils/commands',
  'csui/controls/tile/tile.view',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/widgets/html.editor/impl/html.editor.content.view',
  'hbs!csui/widgets/html.editor/impl/html.editor.wrapper.template'
], function (_, $, Marionette, Radio, NodeModel, NodeChildren2Collection, NodeModelFactory, commands, TileView,
    TabableRegionBehavior, DefaultActionBehavior, HtmlEditorContentView, template) {

  var HtmlEditorTileView = TileView.extend({

    constructor: function HtmlEditorTileView(options) {
      options || (options = {});
      options.icon = 'cs-wiki-icon-wiki';
      this.context = options.context;
      options.id = 'csui-html-tile-wrapper-' + options.wikiPageId;

      TileView.prototype.constructor.call(this, options);

      options = options.data ? _.extend(options, options.data) : options;
      this.options = options;
      this.options.parentView = this;
      this.contentViewOptions = this.options;
    },

    contentView: HtmlEditorContentView,
    contentViewOptions: function () {
      _.extend(this.options, {parentView: this});
    },

    onShow: function () {
      this.$el.addClass(
          'cui-rich-editor-widget-wrapper cui-rich-editor-widget-wrapper-' +
          this.options.wikiPageId);
    }

  });

  var HtmlEditorWidgetView = Marionette.CompositeView.extend({
    tagName: 'div',

    className: 'csui-html-editor-grand-parent',

    templateHelpers: function () {
      return {};
    },

    template: template,

    ui: {
      editIcon: '.tile-controls',
      contentAreaLinks: '.csui-html-editor-wrapper a'
    },

    events: {
      'keydown': 'onKeyInView',
      'click @ui.contentAreaLinks': 'onClickLink',
      'click @ui.editIcon': 'onClickEditIcon'
    },

    constructor: function HtmlEditorWidgetView(options) {
      options = options || {};
      options.data || (options.data = {});
      _.extend(options, options.data);
      options.wikiPageId = options.wikipageid || options.id;
      options.id = "csui-html-editor-grand-parent-" + options.wikiPageId;
      options.title = options.titlefield || options.title;
      options.header = !!options.title;
      options.scrollableParent = !!options.header ? '.tile-content' :
                                 '.csui-html-editor-wrapper-parent';
      this.context = options.context;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    },

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
    },

    onClickEditIcon: function (event) {
      Radio.channel("dropdown:open").trigger("align:dropDown:menu", this);
    },

    onClickLink: function(event){
      var target = !!$(event.target).attr('href') ? $(event.target) : $(event.target).parents('a');
      if (!!target[0] && !!target.attr('href')) {
        this._handleClickLink({
          event: event,
          connector: this.options.model.connector,
          callingViewInstance: this
        });
      }
    },
    _handleClickLink: function (args) {
      var node;
      var target = !!$(args.event.target).attr("href") ? $(args.event.target) :
                   $(args.event.target).parents('a'),
          that = args.callingViewInstance,
          self = this,
          hrefValue = target.attr("href") ? target.attr("href") : "";
        if(this.htmlEditorContentView && this.htmlEditorContentView.mode === 'read'){
           if (!!hrefValue.match(/^.*\/open|Open\/(.+)$/)) {
            args.event.stopPropagation();
            args.event.preventDefault();
            if (hrefValue.indexOf("open/") !== -1 || hrefValue.indexOf("Open/") !== -1) {
              var nodeId = hrefValue.substring(
                  hrefValue.lastIndexOf("/") + 1,
                  hrefValue.length);
              if(nodeId.match(/^[0-9]+$/)) {
                node = this.getNewNodeModel({
                  attributes: {
                    id: parseInt(hrefValue.substring(
                        hrefValue.lastIndexOf("/") + 1,
                        hrefValue.length), 10)
                  },
                  connector: args.connector
                });
                node.fetch()
                    .done(function () {
                      that.triggerMethod("execute:defaultAction", node);
                    }).fail(function (xhr, status, text) {
                  window.location.href = hrefValue;
                });
              } else {
                this.updateAjaxCall({
                  url: args.connector.getConnectionUrl().getApiBase("v2")+"/wiki/nickname/"+nodeId+"?actions=open&fields=properties",
                  connector: args.connector,
                  view: args.callingViewInstance,
                  type: "GET"
                }).done(function(response){
                  node = self.getNewNodeModel({},{connector: args.connector});
                  node.attributes = node.parse(response);
                  node = self.getNewNodeModel({attributes: node.attributes},{connector: args.connector});
                  that.triggerMethod("execute:defaultAction", node);
                }).fail(function(){
                  window.location.href = hrefValue;
                });
              }
            }
          } else if (!!hrefValue.match(/^.*\/wiki\/[0-9]+\/(.+)$/) ||
                    !!hrefValue.match(/^.*\/wiki\/[0-9]+$/)) {
            var wikipage;
            args.event.stopPropagation();
            args.event.preventDefault();
          if (!!hrefValue.match(/^.*\/wiki\/[0-9]+\/(.+)$/)) {
              wikipage = decodeURIComponent(hrefValue.substring(
                  hrefValue.lastIndexOf("/") + 1,
                  hrefValue.length));
            } else if (!!hrefValue.match(/^.*\/wiki\/[0-9]+$/)) {
              var url = decodeURIComponent(hrefValue.substring(0,
                  hrefValue.lastIndexOf("/") - 5));
              wikipage = decodeURIComponent(url.substring(
                  url.lastIndexOf("/") + 1,
                  url.length));
            }
            this.updateAjaxCall({
              url:  args.connector.getConnectionUrl().getApiBase("v2")+"/wiki/"+this.options.wikiid+"/wikipages",
              connector: args.connector,
              view: args.callingViewInstance,
              type: "GET"
            }).done(function(response){
              node = response.results.find(function (element) {
                if (element.name === wikipage) {
                  return element;
                }
              });
              if (!!node) {
                node = self.getNewNodeModel({
                  attributes: node,
                  connector: args.connector
                });
                node.fetch()
                    .done(function () {
                      args.callingViewInstance.triggerMethod("execute:defaultAction", node);
                    }).fail(function (xhr, status, text) {
                      window.location.href = hrefValue;
                });
              } else {
                window.location.href = hrefValue;
              }
            }).fail(function(){
              window.location.href = hrefValue;
            });

          } else if (!!hrefValue.match(/^.*objId\=(.+)$/)) {
            args.event.stopPropagation();
            args.event.preventDefault();
            var objIdIndex = hrefValue.indexOf("objId=");
            if (objIdIndex !== -1) {
              node = this.getNewNodeModel({
                attributes: {
                  id: parseInt(hrefValue.substring(objIdIndex + 6,
                      (hrefValue.substring(objIdIndex + 1,
                          hrefValue.length).indexOf('&') + objIdIndex + 1)), 10)
                },
                connector: args.connector
              });
              node.fetch()
                  .done(function () {
                    args.callingViewInstance.triggerMethod("execute:defaultAction", node);
                  }).fail(function (xhr, status, text) {
                window.location.href = hrefValue;
              });
            }
          } else if (!!hrefValue.match(/^.*\/app\/nodes\/(.+)$/)) {
            args.event.stopPropagation();
            args.event.preventDefault();
            if (hrefValue.indexOf("nodes/") !== -1) {
              node = this.getNewNodeModel({
                attributes: {
                  id: parseInt(hrefValue.substring(
                      hrefValue.lastIndexOf("/") + 1,
                      hrefValue.length), 10)
                },
                connector: args.connector
              });
              node.fetch().done(function () {
                that.triggerMethod("execute:defaultAction", node);
              }).fail(function (xhr, status, text) {
                window.location.href = hrefValue;
              });
            }
          }
        }
    },
    updateAjaxCall: function (args) {
      var deferred    = $.Deferred(),
          url         = args.url,
          data        = args.data,
          type        = args.type,
          connector   = args.connector;
      this.ajaxRequest = $.ajax(connector.extendAjaxOptions({
        url: url,
        type: type,
        data: data,
        contentType: false,
        crossDomain: true,
        processData: false,
        success: function (response, status, jXHR) {
          deferred.resolve(response);
        },
        error: function (xhr, status, text) {
          deferred.reject();
        }
      }));
      return deferred.promise();
    },
    currentlyFocusedElement: function () {
      if (!!this.htmlEditorContentView.dropdownMenu &&
          !this.htmlEditorContentView.dropdownMenu.haveEditPermissions) {
        return this.htmlEditorContentView.$el.find('a:first');
      } else {
        return this.$el.find('.csui-html-editor-dropdown .csui-html-editor-control');
      }
    },
    getNewNodeModel: function (options) {
      return new NodeModel(options.attributes, {
        connector: options.connector,
        commands: commands.getAllSignatures(),
        fields: options.fields || {},
        expand: options.expand || {}
      });
    },

    onKeyInView: function (event) {
      if (this.htmlEditorContentView.mode === 'read') {
        this.htmlEditorContentView.moveTab(event);
      }
    },

    onRender: function (e) {
      var that = this;
      this.getWikiDetails().done(function() {
        var _htmlView;
        that.options.autosaveInterval = 60000;
        if (that.options.header === undefined || that.options.header) { // with header
          _htmlView = new HtmlEditorTileView(that.options);
          that.listenToOnce(_htmlView, 'show', _.bind(function () {
            that.htmlEditorContentView = _htmlView.getChildView('content');
          }, that));
        } else { // without header
          that.options.parentView = that;
          _htmlView = new HtmlEditorContentView(that.options);
          that.htmlEditorContentView = _htmlView;
        }
  
        new Marionette.Region({
          el: that.$el.find(".csui-html-editor-wrapper-parent")
        }).show(_htmlView);
        that._triggerView = that;
  
        that
            .listenTo(that.htmlEditorContentView, 'refresh:tabindexes', _.bind(function () {
              that.trigger('refresh:tabindexes');
            }, that));
      });
    },

    onShow: function () {
      this.options.scrollableParent && this.$el.find(this.options.scrollableParent).addClass('csui-normal-scrolling');
    },

    getWikiDetails: function() {    
      var model = this.options.context.getModel(NodeModelFactory),
      isInBws = !!model.get('data') && !!model.get('data').bwsinfo && !!model.get('data').bwsinfo.id, 
      that = this,
      deferred = $.Deferred(),
      wiki, wikiPage, mainPageId; 

      // If the Widget is not in a BWS object or Wiki/Wiki page is configured in the HTML tile perspective, 
      // then go ahead with the default behaviour.  
      if ( !isInBws || !!this.options.data.wikicontainerid || !!this.options.data.wikitemplateid ) { 
        deferred.resolve();
      }
      else {
        // If model is not the bws object, then set it to the parent BWS object
        model = model.get('type') === 848 ? model : new NodeModel({id: model.get('data').bwsinfo.id}, {connector: model.connector});
        // If the Widget is inside the BWS, then fetch the first created Wiki object 
        var children = this.getChildren( model, 5573, ['id', 'main_page_id'] );
        children.fetch().done(function () {  
          // Check that the wiki object exists and get the main page id
          wiki = children.length > 0 ? children.models[0] : undefined;
          if( !!wiki ) {
            mainPageId = wiki.get('main_page_id');
            if( !!mainPageId ) {
              // If main page is configured, then set the main page of the wiki as the tile content  
              that.options.wikiid = wiki.get('id');
              that.options.wikiPageid = mainPageId;
              that.options.wikiPageId = mainPageId;
              deferred.resolve();
            }
            else {
              // If main page is not configured, then get the first created wiki page 
              var wikiChildren = that.getChildren( wiki, 5574, ['id'] );
              wikiChildren.fetch().done(function () {
                wikiPage = wikiChildren.length > 0 ? wikiChildren.models[0] : undefined;
                if( !!wikiPage ) {
                  // If wiki page exists, set the first created wiki page as the tile content
                  that.options.wikiid = wiki.get('id');
                  that.options.wikiPageid = wikiPage.get('id');
                  that.options.wikiPageId = wikiPage.get('id');
                }
                deferred.resolve();
              });
            }  
          }
          else {
            // Do nothing
            deferred.resolve(); 
          }
        });           
      }
      return deferred.promise();
    },

    getChildren: function( parentNode, childType, properties ) {
      var children = new NodeChildren2Collection({}, _.defaults({
        // Fetch the TOP first object only
        top: 1,
        // Prefer refreshing the entire table to render one row after another.
        autoreset: true,
        // Minimize the response information;
        fields: {
          properties: properties
        },
        delayRestCommands: false,
        // Sort the objects by create date
        orderBy: "create_date",
        // Get the children of type specified
        filter: {type: childType}
      },
      // Parent node for the children to be fetched
      {node: parentNode}
      ));

      return children;
    }

  });
  return HtmlEditorWidgetView;
});


csui.define('csui/widgets/document.overview/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/document.overview/impl/nls/root/lang',{
  ToolbarItemOpen: 'Open',
  ToolbarItemDownload: 'Download',
  ToolbarItemEdit: 'Edit',
  ToolbarItemProperties: 'Properties',
  location: "Location",
  docPreviewImgAlt: 'Document Preview',
  name: "Name",
  description: "Description",
  created: "Created",
  createdBy: "Created by",
  modifiedBy: "Modified by",
  type: "Type",
  modified: "Modified",
  ownedBy: "Owned by",
  size: "Size",
  reservedBy: 'Reserved by',
  noValue: 'No value',
  reservedByUnreserve: 'Reserved by {0}, Press to unreserve',
  goBackTitle: 'Go back',
  goBackAria: 'Go back'
});




/* START_TEMPLATE */
csui.define('hbs!csui/widgets/document.overview/impl/document.overview',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"overview-page-backbutton icon arrow_back cs-go-back csui-acc-focusable-active\"\n           aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackAria") || (depth0 != null ? lookupProperty(depth0,"goBackAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackAria","hash":{},"loc":{"start":{"line":6,"column":23},"end":{"line":6,"column":37}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackTitle") || (depth0 != null ? lookupProperty(depth0,"goBackTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackTitle","hash":{},"loc":{"start":{"line":6,"column":46},"end":{"line":6,"column":61}}}) : helper)))
    + "\" role=\"link\" tabindex=\"0\"></div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class=\"description_section doc-overview-general-information\">\n          <div class=\"doc-overview-form-group\">\n            <label class=\"doc-overview-control-label\" for=\"desc"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":109,"column":63},"end":{"line":109,"column":73}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_label") || (depth0 != null ? lookupProperty(depth0,"desc_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_label","hash":{},"loc":{"start":{"line":109,"column":82},"end":{"line":109,"column":96}}}) : helper)))
    + "\">\n              "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_label") || (depth0 != null ? lookupProperty(depth0,"desc_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_label","hash":{},"loc":{"start":{"line":110,"column":14},"end":{"line":110,"column":28}}}) : helper)))
    + "\n            </label>\n            <div class=\"binf-col-sm-9\">\n              <button disabled id=\"desc"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":113,"column":39},"end":{"line":113,"column":49}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_label") || (depth0 != null ? lookupProperty(depth0,"desc_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_label","hash":{},"loc":{"start":{"line":113,"column":63},"end":{"line":113,"column":77}}}) : helper)))
    + ":\n              "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_value") || (depth0 != null ? lookupProperty(depth0,"desc_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_value","hash":{},"loc":{"start":{"line":114,"column":14},"end":{"line":114,"column":28}}}) : helper)))
    + "\"><span class=\"csui-ellipsis-area no-ellipsis\"><span><span\n                  class=\"cs-field-textarea-data\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_value") || (depth0 != null ? lookupProperty(depth0,"desc_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_value","hash":{},"loc":{"start":{"line":115,"column":49},"end":{"line":115,"column":63}}}) : helper)))
    + "</span></span>\n                </span>\n              </button>\n            </div>\n            <div style=\"clear:both;\"></div>\n          </div>\n        </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"cs-content-wrapper cs-content-overlay-wrapper\">\n\n  <div class=\"cs-content-header\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"back_button") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":4,"column":4},"end":{"line":7,"column":11}}})) != null ? stack1 : "")
    + "    <div class=\"title-container\"></div>\n    <div class=\"actions-container\">\n      <div class=\"commentRegion\"></div>\n      <div class=\"favoriteRegion\"></div>\n    </div>\n  </div>\n  <div class=\"cs-content-container csui-normal-scrolling\">\n    <div class=\"description-container cs-content\">\n\n      <div class=\"created_by_section doc-overview-general-information\">\n        <div class=\"doc-overview-form-group\">\n          <label class=\"doc-overview-control-label\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"createdBy") : stack1), depth0))
    + "\">\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"createdBy") : stack1), depth0))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <div class=\"csui-doc-overview-created-by-pic\"></div>\n            <div class=\"csui-doc-overview-created-by-user\"></div>\n          </div>\n        </div>\n      </div>\n\n      <div class=\"modified_section doc-overview-general-information\">\n        <div class=\"doc-overview-form-group\">\n          <label class=\"doc-overview-control-label\" for=\"modi"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":31,"column":61},"end":{"line":31,"column":71}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_label") || (depth0 != null ? lookupProperty(depth0,"modify_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_label","hash":{},"loc":{"start":{"line":31,"column":80},"end":{"line":31,"column":96}}}) : helper)))
    + "\">\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_label") || (depth0 != null ? lookupProperty(depth0,"modify_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_label","hash":{},"loc":{"start":{"line":32,"column":12},"end":{"line":32,"column":28}}}) : helper)))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <button disabled id=\"modi"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":35,"column":37},"end":{"line":35,"column":47}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_label") || (depth0 != null ? lookupProperty(depth0,"modify_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_label","hash":{},"loc":{"start":{"line":35,"column":61},"end":{"line":35,"column":77}}}) : helper)))
    + ": "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_date") || (depth0 != null ? lookupProperty(depth0,"modify_date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_date","hash":{},"loc":{"start":{"line":35,"column":79},"end":{"line":35,"column":94}}}) : helper)))
    + "\">\n              <span title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_date") || (depth0 != null ? lookupProperty(depth0,"modify_date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_date","hash":{},"loc":{"start":{"line":36,"column":27},"end":{"line":36,"column":42}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_date") || (depth0 != null ? lookupProperty(depth0,"modify_date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_date","hash":{},"loc":{"start":{"line":36,"column":44},"end":{"line":36,"column":59}}}) : helper)))
    + "</span>\n            </button>\n          </div>\n          <div style=\"clear:both;\"></div>\n        </div>\n      </div>\n      <div class=\"modified_by_section doc-overview-general-information\">\n        <div class=\"doc-overview-form-group\">\n          <label class=\"doc-overview-control-label\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"modifiedBy") : stack1), depth0))
    + "\">\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"modifiedBy") : stack1), depth0))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <div class=\"csui-doc-overview-modified-by-pic\"></div>\n            <div class=\"csui-doc-overview-modified-by-user\"></div>\n          </div>\n        </div>\n      </div>\n      <div class=\"type_section doc-overview-general-information\">\n        <div class=\"doc-overview-form-group\">\n          <label class=\"doc-overview-control-label\" for=\"type"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":55,"column":61},"end":{"line":55,"column":71}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type_label") || (depth0 != null ? lookupProperty(depth0,"type_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"type_label","hash":{},"loc":{"start":{"line":55,"column":80},"end":{"line":55,"column":94}}}) : helper)))
    + "\">\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type_label") || (depth0 != null ? lookupProperty(depth0,"type_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"type_label","hash":{},"loc":{"start":{"line":56,"column":12},"end":{"line":56,"column":26}}}) : helper)))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <button title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mime_type") || (depth0 != null ? lookupProperty(depth0,"mime_type") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mime_type","hash":{},"loc":{"start":{"line":59,"column":27},"end":{"line":59,"column":40}}}) : helper)))
    + "\" id=\"type"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":59,"column":50},"end":{"line":59,"column":60}}}) : helper)))
    + "\" disabled\n                    aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type_label") || (depth0 != null ? lookupProperty(depth0,"type_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"type_label","hash":{},"loc":{"start":{"line":60,"column":32},"end":{"line":60,"column":46}}}) : helper)))
    + ": "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mime_type") || (depth0 != null ? lookupProperty(depth0,"mime_type") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mime_type","hash":{},"loc":{"start":{"line":60,"column":48},"end":{"line":60,"column":61}}}) : helper)))
    + "\">\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mime_type") || (depth0 != null ? lookupProperty(depth0,"mime_type") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mime_type","hash":{},"loc":{"start":{"line":61,"column":20},"end":{"line":61,"column":33}}}) : helper)))
    + "</span>\n            </button>\n          </div>\n          <div style=\"clear:both;\"></div>\n        </div>\n      </div>\n\n      <div class=\"size_section doc-overview-general-information\">\n        <div class=\"doc-overview-form-group\">\n          <label class=\"doc-overview-control-label\" for=\"size"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":70,"column":61},"end":{"line":70,"column":71}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_label") || (depth0 != null ? lookupProperty(depth0,"size_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_label","hash":{},"loc":{"start":{"line":70,"column":80},"end":{"line":70,"column":94}}}) : helper)))
    + "\">\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_label") || (depth0 != null ? lookupProperty(depth0,"size_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_label","hash":{},"loc":{"start":{"line":71,"column":12},"end":{"line":71,"column":26}}}) : helper)))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <button title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_full_value") || (depth0 != null ? lookupProperty(depth0,"size_full_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_full_value","hash":{},"loc":{"start":{"line":74,"column":27},"end":{"line":74,"column":46}}}) : helper)))
    + "\" id=\"size"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":74,"column":56},"end":{"line":74,"column":66}}}) : helper)))
    + "\" disabled\n                    aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_label") || (depth0 != null ? lookupProperty(depth0,"size_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_label","hash":{},"loc":{"start":{"line":75,"column":32},"end":{"line":75,"column":46}}}) : helper)))
    + ": "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_value") || (depth0 != null ? lookupProperty(depth0,"size_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_value","hash":{},"loc":{"start":{"line":75,"column":48},"end":{"line":75,"column":62}}}) : helper)))
    + "\">\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_value") || (depth0 != null ? lookupProperty(depth0,"size_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_value","hash":{},"loc":{"start":{"line":76,"column":20},"end":{"line":76,"column":34}}}) : helper)))
    + "</span>\n            </button>\n          </div>\n          <div style=\"clear:both;\"></div>\n        </div>\n      </div>\n\n      <div class=\"reserve_info doc-overview-general-information binf-hidden\">\n        <div class=\"doc-overview-form-group\">\n          <label class=\"doc-overview-control-label\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"reservedBy") : stack1), depth0))
    + "\">\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"reservedBy") : stack1), depth0))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <div class=\"doc-overview-reserve\">\n              <div class=\"csui-doc-overview-reserve-btn\"></div>\n              <div class=\"csui-doc-overview-reserve-user\"></div>\n            </div>\n          </div>\n        </div>\n      </div>\n\n      <div class=\"location-container doc-overview-general-information\">\n        <div class=\"doc-overview-form-group\">\n          <label class=\"doc-overview-control-label\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"location") : stack1), depth0))
    + "\">\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"location") : stack1), depth0))
    + "\n          </label>\n          <div class=\"binf-col-sm-9 location-view\"></div>\n        </div>\n      </div>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"has_description") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":106,"column":6},"end":{"line":122,"column":13}}})) != null ? stack1 : "")
    + "\n    </div>\n\n    <div class=\"binf-col-md-4 thumbnail-container binf-hidden binf-text-left cs-content\">\n      <div class=\"metadata-tab\">\n        <div class=\"thumbnail_section metadata-preview preview-section\"\n             title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemOpen") : stack1), depth0))
    + "\">\n          <img role=\"link\" src=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imgSrc") || (depth0 != null ? lookupProperty(depth0,"imgSrc") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imgSrc","hash":{},"loc":{"start":{"line":130,"column":32},"end":{"line":130,"column":42}}}) : helper)))
    + "\" class=\"img-doc-preview binf-hidden\" alt=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imgAlt") || (depth0 != null ? lookupProperty(depth0,"imgAlt") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imgAlt","hash":{},"loc":{"start":{"line":130,"column":85},"end":{"line":130,"column":95}}}) : helper)))
    + "\" />\n        </div>\n      </div>\n    </div>\n  </div>\n  <div class=\"cs-fadeout-container\"></div>\n  <div class=\"cs-content-footer\">\n    <button class=\"binf-btn primary-btn command-btn open-btn\" type=\"button\"\n            data-signature=\"OpenDocument\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemOpen") : stack1), depth0))
    + "</button>\n    <button class=\"binf-btn default-btn command-btn csui-doc-overview-download-btn\" type=\"button\"\n            data-signature=\"Download\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemDownload") : stack1), depth0))
    + "</button>\n    <button class=\"binf-btn default-btn command-btn edit-btn\" type=\"button\"\n            data-signature=\"Edit\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemEdit") : stack1), depth0))
    + "</button>\n    <button class=\"binf-btn default-btn command-btn properties-btn\" type=\"button\"\n            data-signature=\"Properties\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemProperties") : stack1), depth0))
    + "</button>\n  </div>\n</div>";
}});
Handlebars.registerPartial('csui_widgets_document.overview_impl_document.overview', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/document.overview/impl/document.overview',[],function(){});

csui.define('csui/widgets/document.overview/document.overview.view',['require',
  'module', 'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/lib/jquery',
  'csui/utils/log',
  'csui/utils/url',
  'csui/utils/types/date',
  'csui/utils/nodesprites',
  'csui/utils/contexts/factories/node',
  'csui/utils/thumbnail/thumbnail.object',
  'csui/controls/toolbar/toolbar.command.controller',
  'csui/models/nodes',
  'csui/utils/commands',
  'csui/utils/commandhelper',
  'csui/controls/progressblocker/blocker',
  'i18n!csui/widgets/document.overview/impl/nls/lang',
  'csui/utils/contexts/factories/largefilesettings.factory',
  'csui/utils/contexts/factories/next.node',
  'hbs!csui/widgets/document.overview/impl/document.overview',
  'css!csui/widgets/document.overview/impl/document.overview'
], function (require, module, _, Marionette, $, log,
    Url,
    DateType,
    NodeSpriteCollection,
    NodeModelFactory, Thumbnail,
    ToolbarCommandController,
    NodeCollection,
    commands, CommandHelper,
    BlockingView, lang, LargeFileSettingsFactory,
    NextNodeModelFactory, documentOverviewTemplate) {
  'use strict';

  log = log(module.id);
  var config = _.extend({
    fileActionSettings: []
  }, require.moduleConfig('csui/utils/commands/open.document/delegates/open.document.delegates'));

  var DocumentOverviewView = Marionette.ItemView.extend({
    className: 'cs-form csui-general-form cs-document-overview-wrapper',
    template: documentOverviewTemplate,
    templateHelpers: function () {
      var back_button    = true,
          mimeType       = NodeSpriteCollection.findTypeByNode(this.options.node),
          sizeValue      = this.options.node.get("size_formatted"),
          sizeFullValue  = this.options.node.get("size"),
          modifyDate     = DateType.formatExactDateTime(
              DateType.deserializeDate(this.options.node.get("modify_date"))),
          descValue      = this.options.node.get("description"),
          hasDescription = !!descValue,
          messages       = {
            unique: _.uniqueId('_doc'),
            lang: lang,
            back_button: back_button,
            mime_type: mimeType,
            has_description: hasDescription,
            size_value: sizeValue,
            size_full_value: sizeFullValue,
            modify_date: modifyDate,
            desc_value: descValue,
            type_label: lang.type,
            size_label: lang.size,
            modify_label: lang.modified,
            desc_label: lang.description,
            // a 1x1 transparent gif, to avoid an empty src tag
            imgSrc: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
            imgAlt: lang.docPreviewImgAlt,
            goBackTitle: lang.goBackTitle,
            goBackAria: lang.goBackAria
          };
      return messages;
    },

    ui: {
      location: '.location-view',
      back: '.cs-go-back',
      titleContainer: '.title-container',
      commentButtonRegion: '.commentRegion',
      favoriteStarRegion: '.favoriteRegion',
      thumbnailContainer: '.thumbnail-container',
      modifySectionBtn: '.modified_section button',
      mimeTypeBtn: '.type_section button',
      sizeSectionBtn: '.size_section button',
      thumbnailImg: '.img-doc-preview',
      reserveInfo: '.reserve_info',
      reserveUser: '.csui-doc-overview-reserve-user',
      reserverBtn: '.csui-doc-overview-reserve-btn',
      createdBy: '.created_by_section .binf-col-sm-9',
      modifiedBy : '.modified_by_section .binf-col-sm-9',
      creadyByUser: '.csui-doc-overview-created-by-user',
      createdByPic: '.csui-doc-overview-created-by-pic',
      modifiedByUser: '.csui-doc-overview-modified-by-user',
      modifiedByPic: '.csui-doc-overview-modified-by-pic',
      openBtn: '.open-btn',
      editBtn: '.edit-btn',
      downloadBtn: '.csui-doc-overview-download-btn',
      propertiesBtn: '.properties-btn',
      thumbnailSection: '.thumbnail_section'
    },

    events: {
      "click .command-btn": "_handleClickButton",
      'click @ui.back': 'onBackButton',
      'keydown': 'onKeyInView'
    },

    constructor: function DocumentOverviewView(options) {
      options || (options = {});
      BlockingView.imbue(this);
      options.data || (options.data = {});
      if (!options.node) {
        options.node = options.context.getModel(NodeModelFactory, {
          attributes: options.data.id && {id: options.data.id},
          temporary: true
        });
      }
      this.previewInFullMode = true;
      this.options = options;
      var viewStateModel = options.context && options.context.viewStateModel;
      this.back_button = viewStateModel && viewStateModel.hasRouted();
      this.largeFileSettingsFactory = this.options.context.getFactory(LargeFileSettingsFactory);
      this.largeFileSettingsModel = this.largeFileSettingsFactory && this.largeFileSettingsFactory.property;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.commandController = new ToolbarCommandController({
        commands: options.commands || commands
      });

      this.commands = this.commandController.commands;
      this.reloadWidget = false;
      this.parentNode = undefined;
      this.supportOriginatingView = true;

      this.listenTo(this.options.node, 'change', _.bind(this._handleNodeChange, this));
      this.listenTo(this, 'new:version:added', _.bind(this._handleVersionChange, this));
      this.listenTo(this.options.node, 'delete',  _.bind(this._navigateToParent, this));
      this.listenTo(this, 'disable:blocking', this._currentlyFocusedElement);
      viewStateModel && this.listenTo(viewStateModel, "navigate", function (historyEntry) {
        if (historyEntry && !this.back_button) {
          this.ui.back.show();
        }
      });

      this.blockActions();
    },

    onRender: function () {
      this._showMetadataItemName();
      this._addCommentView();
      this._addFavoriteView();
      this._showThumbnail();
      this._addLocationView();
      this._showCreatedByUserName();
      this._showModifiedByUserName();
      this._showReserveRow();
      this._checkPermissions();
      if (!this.back_button) {
        this.ui.back.hide();
      }
    },

    _currentlyFocusedElement: function () {
      this.tabableElements = this.$el.find("[tabindex='0']:not([disabled]):not(.csui-disabled):visible");
      if (this.tabableElements.length > 0) {
        const currentElement = _.find(this.tabableElements, function(el) {
          return el.className.includes("title");
        }) || this.tabableElements[0];
        currentElement.focus();
      }
    },
    
    _unblockActions: function () {
      this.unblockActions();
      this.$el.find('.cs-content-wrapper').removeClass('cs-content-overlay-wrapper');
    },

    onShow: function () {
      this.$el.addClass("adjust-scroll");
    },

    onDomRefresh: function () {
      this.metadataItemNameView && this.metadataItemNameView.triggerMethod('dom:refresh');
    },

    _isReserved: function () {
      return this.options.node.get('reserved') === true;
    },

    _showMetadataItemName: function () {
      csui.require(['csui/widgets/metadata/impl/header/item.name/metadata.item.name.view'],
          _.bind(function (MetadataItemNameView) {

            if (this.metadataItemNameView) {
              this.metadataItemNameView.destroy();
            }

            this.metadataItemNameView = new MetadataItemNameView({
              model: this.options.node,
              container: this.options.node.parent,
              containerCollection: this.options.containerCollection,
              collection: this.options.collection,
              context: this.options.context,
              nameSchema: {},
              commands: this.commands,
              originatingView: this,
              showDropdownMenu: true,
              showPropertiesCommand: true,
              noMetadataNavigation: true
            });

            this.listenTo(this.metadataItemNameView, "metadata:item:name:save", this._saveItemName);
            var inv = this.metadataItemNameView.render();
            Marionette.triggerMethodOn(inv, "before:show", inv, this);
            this.ui.titleContainer.append(inv.el);
            Marionette.triggerMethodOn(inv, "show", inv, this);
            }, this));

    },

    _saveItemName: function (args) {
      var self = this,
          itemName = args.sender.getValue(),
          name = {name: itemName},
          model = args.sender && args.sender.model,
          node = this.options.model || this.options.node;

      model && model.changed.name_multilingual && _.extend(name, {
        name_multilingual: model.changed.name_multilingual,
      });

      node.setFields("versions.element(0)", "owner_id");
      var data = _.clone(node.attributes);
      return node
          .save(data, {
            data: name,
            wait: true,
            silent: true
          })
          .then(function () {
            node.fetch({silent: true}).done(function () {
              self._updateModifyDateAndTimeStamp();
              args.success();
              node.trigger('change:name', node, name);
            });
          })
          .fail(function (error) {
            args.error(error);
          });
    },

    _addCommentView: function () {
      csui.require(['csui/controls/tableheader/comment/comment.button.view',
            'esoc/widgets/utils/commentdialog/commentdialog.view'],
          _.bind(function (CommentView) {
            var commentOptions = this.options;
            commentOptions.originatingView = this;
            commentOptions.model = this.options.node || this.options.model;
            var commentView = new CommentView(commentOptions);

            var commentRegion = new Marionette.Region({
              el: this.ui.commentButtonRegion
            });
            commentRegion.show(commentView);
            this._unblockActions();
          }, this));
    },

    _addFavoriteView: function () {
      csui.require(['csui/widgets/favorites/favorite.star.view'],
          _.bind(function (FavoriteStarView) {
            var favoriteOptions = this.options;
            favoriteOptions.model = this.options.node || this.options.model;
            favoriteOptions.popoverAtBodyElement = true;
            var favoriteView = new FavoriteStarView(favoriteOptions);

            var favoriteRegion = new Marionette.Region({
              el: this.ui.favoriteStarRegion
            });
            favoriteRegion.show(favoriteView);
          }, this));
    },

    _handleNodeChange: function () {
      if (!!this.options.node.isReservedClicked || this.options.node.isUnreservedClicked) {
        this._updateReserveField();
        this._updateModifyDateAndTimeStamp();
        this.options.node.isReservedClicked = false;
        this.options.node.isUnreservedClicked = false;
      } else if (this.options.node.changed.csuiDelayedActionsRetrieved) {
        this.isReserved = false;
        this._updateReserveField();
        this._checkPermissions();
      }
      else {
        //Actions that require updating only specific fields should be addressed before this else block.
        this.render();
      }
    },

    _handleVersionChange: function () {
      this.ui.thumbnailContainer.addClass("binf-hidden");
      this.$el.removeClass("cs-document-overview-wrapper-with-thumbnail");
    },

    _updateModifyDateAndTimeStamp: function () {
      var modifyBtnEle  = this.ui.modifySectionBtn,
          modifySpanEle = modifyBtnEle.find('span'),
          modifyDate    = DateType.formatExactDateTime(
              DateType.deserializeDate(this.options.node.get("modify_date")));

      if (modifySpanEle.text() != modifyDate) {
        modifyBtnEle.attr('aria-label', lang.modified + ':' + modifyDate);
        modifySpanEle.attr('title', modifyDate).text(modifyDate);
      }
    },

    _showThumbnail: function () {
      this.thumbnail =
          this.options.thumbnail ||
          new Thumbnail({
            node: this.options.node
          });
      this.listenTo(this.thumbnail, "loadUrl", this._showImage);
      this.listenTo(this.thumbnail, "error", this._showDefaultImage);
      this.listenTo(this, "destroy", _.bind(this._destroyThumbnail, this));

      if (!this.thumbnailSet) {
        var self = this;
        this.thumbnailSet = true;
        //Just show image if url is available,otherwise load thumbnail
        if (this.thumbnail.hasOwnProperty("imgUrl") && !!this.thumbnail.imgUrl) {
          this._showImage();
        } else {
          this.thumbnail.loadUrl();
        }
      }
    },

    _showImage: function () {
      this.$el.addClass("cs-document-overview-wrapper-with-thumbnail");
      this.ui.thumbnailContainer.removeClass("binf-hidden");
      this.trigger("thumbnail:show:image");
      var self = this,
          img  = this.ui.thumbnailImg;
      img.attr("src", this.thumbnail.imgUrl);
      img.prop("tabindex", "0");
      img.one("load", function (evt) {
        if (evt.target.clientHeight >= evt.target.clientWidth) {
          img.addClass("cs-form-img-vertical");
        } else {
          img.addClass("cs-form-img-horizontal");
        }
        img.addClass("cs-form-img-border");
        img.removeClass("binf-hidden");

        // event for keyboard navigation
        var event = $.Event("tab:content:render");
        self.$el.trigger(event);
      });
    },

    _showDefaultImage: function (thumbnail, error) {
      log.warn(error.message);
    },

    _destroyThumbnail: function () {
      if (this.thumbnail) {
        this.thumbnail.destroy();
        this.thumbnail = undefined;
      }
      this.thumbnailSet = false;
    },

    _addLocationView: function () {
      var self           = this,
          renderLocation = function () {
            csui.require(['csui/controls/table/cells/parent/parent.view'],
                _.bind(function (ParentCellView) {
                  var field = new ParentCellView({
                    model: self.options.node,
                    context: self.options.context,
                    nameEdit: false,
                    iconSize: 'contain',
                    el: self.$el.find(self.ui.location)
                  });
                  field.render();
                }, this));
          };

      if (!this.options.node.get("parent_id_expand")) {
        var node        = this.options.node,
            parent_id   = node.get('parent_id'),
            connector   = node.connector,
            fullUrl     = Url.combine(connector.getConnectionUrl().getApiBase('v2'),
                '/nodes/' + parent_id +
                '/properties'),
            ajaxOptions = {
              type: 'GET',
              url: fullUrl
            };

        connector
            .makeAjaxCall(ajaxOptions)
            .done(_.bind(function (resp) {
              node.set('parent_id_expand', resp.results.data.properties, {silent: true});
              renderLocation();
            }, this));
      } else {
        renderLocation();
      }
    },

    _showReserveRow: function () {
      this._updateReserveField();
    },

    _cleanAndInitReserveRow: function () {
      this.ui.reserveInfo.addClass('binf-hidden');
      this.reserveFieldView.$el.html();
      this.ui.reserveUser.html();
    },

    _updateReserveField: function () {
      var isNodeReserved = this._isReserved();
      if (isNodeReserved && !this.isReserved) {
        this.ui.reserveInfo.removeClass('binf-hidden');
        var opts = {
              context: this.options.context,
              tableView: this,
              model: this.options.node || this.options.model,
              reservedByLabel: lang.reservedByUnreserve
            },
            self = this;

        csui.require(['csui/controls/node.state/impl/reservation/reservation.view'],
            function (ReserveFieldView) {
              self.reserveFieldView = new ReserveFieldView(opts);
              var reserveFieldRegion = new Marionette.Region({
                el: self.ui.reserverBtn
              });

              self.reserveFieldView.tagName = 'span';

              reserveFieldRegion.show(self.reserveFieldView);
              // this mitigates the isolated li of the reservation icon and makes the button usable per keyboard
              self.$el.find('li.csui-node-state-reservation').attr('role','none').find('button').removeAttr('tabindex');

              self._getUserField({
                userid: self.options.node.get('reserved_user_id'),
                placeholder: self.ui.reserveUser,
                showUserProfileLink: true
              });
              self.isReserved = true;
            });
      } else if (!isNodeReserved && !!this.isReserved) {
        this.reserveFieldView && this.reserveFieldView.destroy();
        this._cleanAndInitReserveRow();
        this.isReserved = false;
      }
    },

    _showCreatedByUserName: function () {
      var userOptions = {
        baseElement: this.ui.createdBy,
        userId: this.options.node.get("create_user_id")
      };
      this._showUserName(userOptions);
    },

    _showUserName: function (userOptions) {

      this._getUserField({
        userid: userOptions.userId,
        placeholder: this.ui.creadyByUser,
        showUserProfileLink: true
      });

      this._getUserField({
        userid: userOptions.userId,
        placeholder: this.ui.createdByPic,
        userWidgetWrapperClass: "",
        showUserWidgetFor: 'profilepic',
        showUserProfileLink: true,
        disableTabForProfilePic: true
      });
    },

    _showModifiedByUserName: function () {
      const userOptions = {
        baseElement: this.ui.modifiedBy,
        userId: this.options.node.get("modify_user_id")
      };
      this._showModifiedUserName(userOptions);
    },

    _showModifiedUserName: function (userOptions) {

      this._getUserField({
        userid: userOptions.userId,
        placeholder: this.ui.modifiedByUser,
        showUserProfileLink: true
      });

      this._getUserField({
        userid: userOptions.userId,
        placeholder: this.ui.modifiedByPic,
        userWidgetWrapperClass: "",
        showUserWidgetFor: 'profilepic',
        showUserProfileLink: true,
        disableTabForProfilePic: true
      });
    },

    _getUserField: function (userOptions) {
      csui.require(['esoc/controls/userwidget/userwidget.view'],
          _.bind(function (UserWidgetView) {

            var userWidgetOptions = _.extend({
              context: this.options.context,
              showMiniProfile: true,
              connector: this.options.node.connector,
              imgSrc: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
            }, userOptions);

            var userwidgetview = new UserWidgetView(userWidgetOptions),
                contentRegion  = new Marionette.Region({
                  el: $(userOptions.placeholder)
                });
            contentRegion.show(userwidgetview);
          }, this));
    },

    /**
     * This method define specific action's options and invokes the checkPermissionFor method
     * for that specific action.
     *
     * @private
     */
    _checkPermissions: function () {
      var editCmdOptions     = {
            'signature': 'Edit',
            'actionBtnEle': this.ui.editBtn
          },
          downloadCmdOptions = {
            'signature': 'Download',
            'actionBtnEle': this.ui.downloadBtn
          },
          openCmdOptions = {
            'signature': 'OpenDocument',
            'actionBtnEle': this.ui.openBtn
          },
          propertiesCmdOptions = {
            'signature': 'Properties',
            'actionBtnEle': this.ui.propertiesBtn
          },
          cmdData = { exclude: ['OpenSpecificNodePerspective', 'Download'] };
          let self = this,
              excludeBrowserCommand = config.fileActionSettings.filter(function(command) {
                                        if (command.Action === 'Download') {
                                          self.orderOfDownload = command.order;
                                        }
                                        if (self.orderOfDownload && command.Action === 'OpenInBrowser' && 
                                          self.orderOfDownload < command.order) {
                                            return true;
                                        }
                                      });
      if (excludeBrowserCommand && excludeBrowserCommand.length) {
        cmdData.exclude.push('OpenInBrowser');
      }
      this._checkPermForSpecificAction(openCmdOptions, cmdData);
      this._checkPermForSpecificAction(editCmdOptions);
      this._checkPermForSpecificAction(downloadCmdOptions);
      this._checkPermForSpecificAction(propertiesCmdOptions);
    },

    _checkPermForOpenAction: function (cmdOptions) {
      // the open command provides a separate public method 'checkPermission'.
      var command = this.commands.findWhere({signature: cmdOptions.signature});
      command.checkPermission(this.options.node).then(function (permitted) {
        if(!permitted) {
          cmdOptions.actionBtnEle.addClass('binf-hidden');
        } else {
          cmdOptions.actionBtnEle.removeClass('binf-hidden');
        }
      });
    },

    /**
     * This method checks whether the given action signature is permitted or not, and based on
     * the output it handles the respective view element.
     *
     * @param cmdOptions, Object which contains command options.
     * @private
     */
    _checkPermForSpecificAction: function (cmdOptions, commandData = {}) {
      var command = this.commands.findWhere({signature: cmdOptions.signature}),
          status  = {
            nodes: new NodeCollection([this.options.node]),
            container: this.options.node.parent,
            commandData
          },
          options = {
            context: this.options.context
          };

      if (!(command && command.enabled(status, options))) {
        if (command && command.get('signature') === 'OpenDocument') {
          this.ui.thumbnailSection.css('cursor', 'default');
        }
        cmdOptions.actionBtnEle.addClass("binf-hidden");
      } else {
        if (command && command.get('signature') === 'OpenDocument') {
          var self = this;
          $(this.ui.thumbnailSection).on('click', function (event) {
            self._handleClickThumbnail(event);
          });
        }
        cmdOptions.actionBtnEle.removeClass("binf-hidden");
      }
    },

    onKeyInView: function (e) {
      var event = e || window.event;
      var target = event.target || event.srcElement;
      if (event.keyCode === 13 || event.keyCode === 32) {
        if (!(this.$el.find('.title-input').is(event.target))) {
           // enter key(13) or space(32)
          event.preventDefault();
          event.stopPropagation();
          $(target).trigger('click');
        }
      }
    },

    onBackButton: function () {
      if (!this.backButtonClicked) {
        var options = this.options,
            context = options && options.context,
            viewStateModel = context && context.viewStateModel;
        viewStateModel && viewStateModel.restoreLastFragment();
        this.backButtonClicked = true;
      }
    },

    _handleClickThumbnail: function (event) {
      event.stopImmediatePropagation();
      this._executeCommand("OpenDocument");
    },

    _handleClickButton: function (event) {
      event.stopImmediatePropagation();
      var signature = $(event.target).data("signature");
      this._executeCommand(signature);
    },

    _executeCommand: function (signature) {
      var command = this.commands.get(signature);
      var originatingView = this;
      originatingView.collection = new NodeCollection([this.options.node]);

      var status = {
        nodes: new NodeCollection([this.options.node]),
        container: this.options.node,
        originatingView: originatingView
      };
      var options = {
        context: this.options.context
      };

      try {
        // If the command was not found and the toolitem is executable, it is
        // a developer's mistake.
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        }

        var promise = command.execute(status, options);
        CommandHelper.handleExecutionResults(
            promise, {
              command: command,
              suppressSuccessMessage: status.suppressSuccessMessage,
              suppressFailMessage: status.suppressFailMessage
            });
      } catch (error) {
        log.warn(
            'Executing the command "{0}" failed.\n{1}',
            command.get("signature"),
            error.message
        ) && console.warn(log.last);
      }
    },

    _navigateToParent: function () {
      var parentId = this.options.model.get('parent_id');
      if (parentId) {
        this._setNextNodeModelFactory(parentId);
      } 
    },

    _setNextNodeModelFactory: function (id) {
      if (this.options.context && id !== undefined) {
        var nextNode = this.options.context.getModel(NextNodeModelFactory);
        if (nextNode) {
          if (nextNode.get('id') === id) {
            // when id is same as nextNode's id, nextNode.set(id) event is not triggered
            nextNode.unset('id', {silent: true});
          }
          nextNode.set('id', id);
        }
      }
    }

  });

  return DocumentOverviewView;

});


csui.define('csui/widgets/version.overview/impl/nls/lang',{
    // Always load the root bundle for the default locale (en-us)
    "root": true,
    // Do not load English locale bundle provided by the root bundle
    "en-us": false,
    "en": false
});


csui.define('csui/widgets/version.overview/impl/nls/root/lang',{
    ToolbarItemOpen: 'Open',
    ToolbarItemDownload: 'Download',
    ToolbarItemProperties: 'Properties',
    location: "Location",
    docPreviewImgAlt: 'Version Preview',
    name: "Name",
    description: "Description",
    created: "Created",
    createdBy: "Created by",
    type: "Type",
    modified: "Modified",
    ownedBy: "Owned by",
    size: "Size",
    noValue: 'No value',
    goBackTitle: 'Go back',
    goBackAria: 'Go back',
    versionText: 'v {0}',
    versionAria: 'version {0}',
    lockedBy: 'Locked by'
  });



/* START_TEMPLATE */
csui.define('hbs!csui/widgets/version.overview/impl/version.overview',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"overview-page-backbutton icon arrow_back cs-go-back csui-acc-focusable-active\"\n           aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackAria") || (depth0 != null ? lookupProperty(depth0,"goBackAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackAria","hash":{},"loc":{"start":{"line":6,"column":23},"end":{"line":6,"column":37}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackTitle") || (depth0 != null ? lookupProperty(depth0,"goBackTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackTitle","hash":{},"loc":{"start":{"line":6,"column":46},"end":{"line":6,"column":61}}}) : helper)))
    + "\" role=\"link\" tabindex=\"0\"></div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"lock_info  version-overview-general-information\">\n        <div class=\"version-overview-form-group\">\n          <label class=\"version-overview-control-label\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"lockedBy") || (depth0 != null ? lookupProperty(depth0,"lockedBy") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"lockedBy","hash":{},"loc":{"start":{"line":88,"column":63},"end":{"line":88,"column":75}}}) : helper)))
    + "\">\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"lockedBy") || (depth0 != null ? lookupProperty(depth0,"lockedBy") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"lockedBy","hash":{},"loc":{"start":{"line":89,"column":12},"end":{"line":89,"column":24}}}) : helper)))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <div class=\"version-overview-lock\">\n              <div class=\"csui-version-overview-lock-btn\"></div>\n              <div class=\"csui-version-overview-lock-user\"></div>\n            </div>\n          </div>\n        </div>\n      </div>\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "binf-hidden";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"cs-content-wrapper cs-content-overlay-wrapper\">\n\n  <div class=\"cs-content-header\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"back_button") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":4,"column":4},"end":{"line":7,"column":11}}})) != null ? stack1 : "")
    + "    <div class=\"title-container\"></div>\n    <div class=\"overview-page-version-label\">\n      <span class=\"csui-overview-version-label\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"versionAria") || (depth0 != null ? lookupProperty(depth0,"versionAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"versionAria","hash":{},"loc":{"start":{"line":10,"column":60},"end":{"line":10,"column":75}}}) : helper)))
    + "\">\n        "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"versionText") || (depth0 != null ? lookupProperty(depth0,"versionText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"versionText","hash":{},"loc":{"start":{"line":11,"column":8},"end":{"line":11,"column":23}}}) : helper)))
    + "\n      </span>\n    </div>\n  </div>\n  <div class=\"cs-content-container\">\n    <div class=\"description-container cs-content\">\n\n      <div class=\"created_by_section version-overview-general-information\">\n        <div class=\"version-overview-form-group\">\n          <label class=\"version-overview-control-label\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"createdBy") : stack1), depth0))
    + "\">\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"createdBy") : stack1), depth0))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <div class=\"csui-version-overview-created-by-pic\"></div>\n            <div class=\"csui-version-overview-created-by-user\"></div>\n          </div>\n        </div>\n      </div>\n\n      <div class=\"modified_section version-overview-general-information\">\n        <div class=\"version-overview-form-group\">\n          <label class=\"version-overview-control-label\" for=\"modi"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":32,"column":65},"end":{"line":32,"column":75}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_label") || (depth0 != null ? lookupProperty(depth0,"modify_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_label","hash":{},"loc":{"start":{"line":32,"column":84},"end":{"line":32,"column":100}}}) : helper)))
    + "\">\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_label") || (depth0 != null ? lookupProperty(depth0,"modify_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_label","hash":{},"loc":{"start":{"line":33,"column":12},"end":{"line":33,"column":28}}}) : helper)))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <button disabled id=\"modi"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":36,"column":37},"end":{"line":36,"column":47}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_label") || (depth0 != null ? lookupProperty(depth0,"modify_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_label","hash":{},"loc":{"start":{"line":36,"column":61},"end":{"line":36,"column":77}}}) : helper)))
    + ": "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_date") || (depth0 != null ? lookupProperty(depth0,"modify_date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_date","hash":{},"loc":{"start":{"line":36,"column":79},"end":{"line":36,"column":94}}}) : helper)))
    + "\">\n              <span title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_date") || (depth0 != null ? lookupProperty(depth0,"modify_date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_date","hash":{},"loc":{"start":{"line":37,"column":27},"end":{"line":37,"column":42}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_date") || (depth0 != null ? lookupProperty(depth0,"modify_date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_date","hash":{},"loc":{"start":{"line":37,"column":44},"end":{"line":37,"column":59}}}) : helper)))
    + "</span>\n            </button>\n          </div>\n          <div style=\"clear:both;\"></div>\n        </div>\n      </div>\n\n      <div class=\"modified_by_section version-overview-general-information\">\n        <div class=\"version-overview-form-group\">\n          <label class=\"version-overview-control-label\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"modifiedBy") : stack1), depth0))
    + "\">\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"modifiedBy") : stack1), depth0))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <div class=\"csui-version-overview-modified-by-pic\"></div>\n            <div class=\"csui-version-overview-modified-by-user\"></div>\n          </div>\n        </div>\n      </div>\n\n      <div class=\"type_section version-overview-general-information\">\n        <div class=\"version-overview-form-group\">\n          <label class=\"version-overview-control-label\" for=\"type"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":58,"column":65},"end":{"line":58,"column":75}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type_label") || (depth0 != null ? lookupProperty(depth0,"type_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"type_label","hash":{},"loc":{"start":{"line":58,"column":84},"end":{"line":58,"column":98}}}) : helper)))
    + "\">\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type_label") || (depth0 != null ? lookupProperty(depth0,"type_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"type_label","hash":{},"loc":{"start":{"line":59,"column":12},"end":{"line":59,"column":26}}}) : helper)))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <button title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mime_type") || (depth0 != null ? lookupProperty(depth0,"mime_type") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mime_type","hash":{},"loc":{"start":{"line":62,"column":27},"end":{"line":62,"column":40}}}) : helper)))
    + "\" id=\"type"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":62,"column":50},"end":{"line":62,"column":60}}}) : helper)))
    + "\" disabled\n                    aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type_label") || (depth0 != null ? lookupProperty(depth0,"type_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"type_label","hash":{},"loc":{"start":{"line":63,"column":32},"end":{"line":63,"column":46}}}) : helper)))
    + ": "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mime_type") || (depth0 != null ? lookupProperty(depth0,"mime_type") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mime_type","hash":{},"loc":{"start":{"line":63,"column":48},"end":{"line":63,"column":61}}}) : helper)))
    + "\">\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mime_type") || (depth0 != null ? lookupProperty(depth0,"mime_type") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mime_type","hash":{},"loc":{"start":{"line":64,"column":20},"end":{"line":64,"column":33}}}) : helper)))
    + "</span>\n            </button>\n          </div>\n          <div style=\"clear:both;\"></div>\n        </div>\n      </div>\n\n      <div class=\"size_section version-overview-general-information\">\n        <div class=\"version-overview-form-group\">\n          <label class=\"version-overview-control-label\" for=\"size"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":73,"column":65},"end":{"line":73,"column":75}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_label") || (depth0 != null ? lookupProperty(depth0,"size_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_label","hash":{},"loc":{"start":{"line":73,"column":84},"end":{"line":73,"column":98}}}) : helper)))
    + "\">\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_label") || (depth0 != null ? lookupProperty(depth0,"size_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_label","hash":{},"loc":{"start":{"line":74,"column":12},"end":{"line":74,"column":26}}}) : helper)))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <button title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_full_value") || (depth0 != null ? lookupProperty(depth0,"size_full_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_full_value","hash":{},"loc":{"start":{"line":77,"column":27},"end":{"line":77,"column":46}}}) : helper)))
    + "\" id=\"size"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":77,"column":56},"end":{"line":77,"column":66}}}) : helper)))
    + "\" disabled\n                    aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_label") || (depth0 != null ? lookupProperty(depth0,"size_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_label","hash":{},"loc":{"start":{"line":78,"column":32},"end":{"line":78,"column":46}}}) : helper)))
    + ": "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_value") || (depth0 != null ? lookupProperty(depth0,"size_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_value","hash":{},"loc":{"start":{"line":78,"column":48},"end":{"line":78,"column":62}}}) : helper)))
    + "\">\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_value") || (depth0 != null ? lookupProperty(depth0,"size_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_value","hash":{},"loc":{"start":{"line":79,"column":20},"end":{"line":79,"column":34}}}) : helper)))
    + "</span>\n            </button>\n          </div>\n          <div style=\"clear:both;\"></div>\n        </div>\n      </div>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"locked") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":85,"column":6},"end":{"line":99,"column":13}}})) != null ? stack1 : "")
    + "\n      <div class=\"location-container version-overview-general-information\">\n        <div class=\"version-overview-form-group\">\n          <label class=\"version-overview-control-label\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"location") : stack1), depth0))
    + "\">\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"location") : stack1), depth0))
    + "\n          </label>\n          <div class=\"binf-col-sm-9 location-view\"></div>\n        </div>\n      </div>\n\n      <div class=\"description_section version-overview-general-information "
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"has_description") : depth0),{"name":"unless","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"loc":{"start":{"line":110,"column":75},"end":{"line":110,"column":124}}})) != null ? stack1 : "")
    + "\">\n        <div class=\"version-overview-form-group\">\n          <label class=\"version-overview-control-label\" for=\"desc"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":112,"column":65},"end":{"line":112,"column":75}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_label") || (depth0 != null ? lookupProperty(depth0,"desc_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_label","hash":{},"loc":{"start":{"line":112,"column":84},"end":{"line":112,"column":98}}}) : helper)))
    + "\">\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_label") || (depth0 != null ? lookupProperty(depth0,"desc_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_label","hash":{},"loc":{"start":{"line":113,"column":12},"end":{"line":113,"column":26}}}) : helper)))
    + "\n          </label>\n          <div class=\"binf-col-sm-9\">\n            <button disabled id=\"desc"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":116,"column":37},"end":{"line":116,"column":47}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_label") || (depth0 != null ? lookupProperty(depth0,"desc_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_label","hash":{},"loc":{"start":{"line":116,"column":61},"end":{"line":116,"column":75}}}) : helper)))
    + ":\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_value") || (depth0 != null ? lookupProperty(depth0,"desc_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_value","hash":{},"loc":{"start":{"line":117,"column":12},"end":{"line":117,"column":26}}}) : helper)))
    + "\"><span class=\"csui-ellipsis-area no-ellipsis\"><span><span\n                class=\"cs-field-textarea-data\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_value") || (depth0 != null ? lookupProperty(depth0,"desc_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_value","hash":{},"loc":{"start":{"line":118,"column":47},"end":{"line":118,"column":61}}}) : helper)))
    + "</span></span>\n              </span>\n            </button>\n          </div>\n          <div style=\"clear:both;\"></div>\n        </div>\n      </div>\n\n    </div>\n\n    <div class=\"binf-col-md-4 thumbnail-container binf-hidden binf-text-left cs-content\">\n      <div class=\"metadata-tab\">\n        <div class=\"thumbnail_section metadata-preview preview-section\"\n             title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemOpen") : stack1), depth0))
    + "\">\n          <img role=\"link\" src=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imgSrc") || (depth0 != null ? lookupProperty(depth0,"imgSrc") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imgSrc","hash":{},"loc":{"start":{"line":132,"column":32},"end":{"line":132,"column":42}}}) : helper)))
    + "\" class=\"img-doc-preview binf-hidden\" alt=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imgAlt") || (depth0 != null ? lookupProperty(depth0,"imgAlt") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imgAlt","hash":{},"loc":{"start":{"line":132,"column":85},"end":{"line":132,"column":95}}}) : helper)))
    + "\" />\n        </div>\n      </div>\n    </div>\n  </div>\n  <div class=\"cs-fadeout-container\"></div>\n  <div class=\"cs-content-footer\">\n    <button class=\"binf-btn primary-btn command-btn open-btn\" type=\"button\"\n            data-signature=\"OpenVersionDelegate\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemOpen") : stack1), depth0))
    + "</button>\n    <button class=\"binf-btn default-btn command-btn csui-version-overview-download-btn\" type=\"button\"\n            data-signature=\"VersionDownload\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemDownload") : stack1), depth0))
    + "</button>\n    <button class=\"binf-btn default-btn command-btn\" type=\"button\"\n            data-signature=\"VersionProperties\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemProperties") : stack1), depth0))
    + "</button>\n  </div>\n</div>";
}});
Handlebars.registerPartial('csui_widgets_version.overview_impl_version.overview', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/version.overview/impl/version.overview',[],function(){});

csui.define('csui/widgets/version.overview/version.overview.view',[
    'require', 'module', 'csui/lib/underscore',
    'csui/lib/marionette',
    'csui/lib/jquery',
    'csui/utils/log',
    'csui/utils/contexts/factories/version',
    'csui/utils/commands/versions',
    'csui/utils/base',
    'csui/utils/thumbnail/thumbnail.object',
    'csui/models/node.actions',
    'csui/widgets/document.overview/document.overview.view',
    'csui/controls/progressblocker/blocker',
    'i18n!csui/widgets/version.overview/impl/nls/lang',
    'hbs!csui/widgets/version.overview/impl/version.overview',
    'css!csui/widgets/version.overview/impl/version.overview'
  ], function (require, module, _, Marionette, $, log,
      VersionModelFactory,
      VersionCommands,
      base,
      Thumbnail,
      NodeActionCollection,
      DocumentOverviewView,
      BlockingView, lang,
      VersionOverviewTemplate) {
    'use strict';

    log = log(module.id);
    var config = _.extend({
      fileActionSettings: []
    }, require.moduleConfig('csui/utils/commands/open.document/delegates/open.document.delegates'));

    var VersionOverviewView = DocumentOverviewView.extend({
      className: 'cs-form csui-general-form cs-version-overview-wrapper',
      template: VersionOverviewTemplate,
      templateHelpers: function () {

        var sizeFullValue  = this.options.node.get("file_size"),
            sizeValue      = this.getFormattedSizeValue(sizeFullValue),
            versionName    = this.options.node.get('version_number_name'),
            locked         = this.options.node.get('locked');
        var messages = DocumentOverviewView.prototype.templateHelpers.call(this);
        _.extend(messages, {
          size_value: sizeValue,
          size_full_value: sizeFullValue,
          versionText: _.str.sformat(lang.versionText, versionName),
          versionAria: _.str.sformat(lang.versionAria, versionName),
          locked:locked,
          lockedBy: lang.lockedBy,
          back_button: this.back_button
        });
        return messages;
      },

      ui: function () {
        return _.extend({}, DocumentOverviewView.prototype.ui, {
          creadyByUser: '.csui-version-overview-created-by-user',
          createdByPic: '.csui-version-overview-created-by-pic',
          modifiedByUser: '.csui-version-overview-modified-by-user',
          modifiedByPic: '.csui-version-overview-modified-by-pic',
          downloadBtn: '.csui-version-overview-download-btn',
          lockInfo: '.lock_info',
          lockUser: '.csui-version-overview-lock-user',
          lockBtn: '.csui-version-overview-lock-btn',
          locationContainer: '.location-container',
          descriptionSection: '.description_section',
          descriptionSectionBtn: '.description_section button',
          descriptionField: '.description_section span.cs-field-textarea-data'
        });
      },

      constructor: function VersionOverviewView(options) {
        options || (options = {});
        BlockingView.imbue(this);
        options.data || (options.data = {});

        if (!options.node) {
          options.node = options.context.getModel(VersionModelFactory);
        }

        this.options = options;

        var viewStateModel = options.context && options.context.viewStateModel;
        this.back_button = viewStateModel && viewStateModel.hasRouted();

        Marionette.ItemView.prototype.constructor.apply(this, arguments);

        this.commands = VersionCommands;
        this.isReloading = false;
        this.parentNode = undefined;
        this.supportOriginatingView = true;

        this.listenTo(this.options.node, 'change:id change:version_number',  _.bind(this.handleFetch, this));
        this.listenTo(this.options.node.actions, 'reset', _.bind(this._checkPermissions, this));
        this.listenTo(this.options.node, 'change', _.bind(this.render, this));
        // listen to possible changes in the node.
        this.listenTo(this.options.node, 'change:modify_date', _.bind(this._updateModifyDateAndTimeStamp, this));
        this.listenTo(this.options.node, 'change:description', _.bind(this._updateDescription, this));

        this.listenTo(this.options.node, 'delete',  _.bind(this._navigateToParent, this));
        this.blockActions();

      },

      onRender: function () {
        if(!this.options.node.fetched) {
          return;
        }
        this._showMetadataItemName();
        this._showThumbnail();
        this._addLocationView();
        this._showCreatedByUserName();
        this._showModifiedByUserName();
        this._checkPermissions();
        this._showLockRow();
        setTimeout(() => {
          this._currentlyFocusedElement();
        }, 1000);
      },


      handleFetch: function () {
        if(this.isReloading) {
          return;
        }
        this.isReloading = true;
        // unset the thumbnail so that it will be set again after the widget re-renders.
        this.thumbnailSet = false;
        this.backButtonClicked = false;
        this.render();
      },

      _showMetadataItemName: function () {

        csui.require(['csui/widgets/metadata/impl/header/item.name/metadata.item.name.view'],
            _.bind(function (MetadataItemNameView) {

              if (this.metadataItemNameView) {
                this.metadataItemNameView.destroy();
              }

              this.metadataItemNameView = new MetadataItemNameView({
                model: this.options.node,
                container: this.options.node.parent,
                containerCollection: this.options.containerCollection,
                collection: this.options.collection,
                context: this.options.context,
                nameSchema: {},
                commands: this.commands,
                originatingView: this,
                showDropdownMenu: true,
                showPropertiesCommand: true,
                noMetadataNavigation: true
              });

              var inv = this.metadataItemNameView.render();
              Marionette.triggerMethodOn(inv, "before:show", inv, this);
              this.ui.titleContainer.append(inv.el);
              Marionette.triggerMethodOn(inv, "show", inv, this);

              this._unblockActions();
              if(this.isReloading) {
                this.isReloading = false;
              }

            }, this));

      },

      _updateDescription: function () {
        var newDescription = this.options.node.get('description');

        if(!newDescription) {
          this.ui.descriptionSectionBtn.removeAttr('aria-label');
          this.ui.descriptionField.text(null);
          this.ui.descriptionSection.addClass('binf-hidden');
        }
        else {
          this.ui.descriptionSectionBtn.attr('aria-label', lang.description + ':' + newDescription);
          this.ui.descriptionField.text(newDescription);
          this.ui.descriptionSection.removeClass('binf-hidden');
        }

      },

      _showThumbnail: function () {
        // the thumbnail subview fetches the new thumbnail and re-renders on node:id change.
        // so do not create a new object again if it is reloading to avoid memory leaks.
        if(!this.isReloading) {
          this.thumbnail =
            this.options.thumbnail ||
            new Thumbnail({
              node: this.options.node
            });
          this.listenTo(this.thumbnail, "loadUrl", this._showImage);
          this.listenTo(this.thumbnail, "error", this._showDefaultImage);
          this.listenTo(this, "destroy", _.bind(this._destroyThumbnail, this));
        }

        if (!this.thumbnailSet) {
          var self = this;
          this.thumbnailSet = true;
          //Just show image if url is available,otherwise load thumbnail
          if (this.thumbnail.hasOwnProperty("imgUrl") && !!this.thumbnail.imgUrl) {
            this._showImage();
          } else {
            this.thumbnail.loadUrl();
          }
        }
      },

      _showImage: function () {
        this.$el.addClass("cs-version-overview-wrapper-with-thumbnail");
        this.ui.thumbnailContainer.removeClass("binf-hidden");
        this.trigger("thumbnail:show:image");
        var self = this,
            img  = this.ui.thumbnailImg;
        img.attr("src", this.thumbnail.imgUrl);
        img.prop("tabindex", "0");
        img.one("load", function (evt) {
          if (evt.target.clientHeight >= evt.target.clientWidth) {
            img.addClass("cs-form-img-vertical");
          } else {
            img.addClass("cs-form-img-horizontal");
          }
          img.addClass("cs-form-img-border");
          img.removeClass("binf-hidden");

          // event for keyboard navigation
          var event = $.Event("tab:content:render");
          self.$el.trigger(event);
        });
      },

      _addLocationView: function () {
        var self           = this,
            renderLocation = function () {
              csui.require(['csui/controls/table/cells/parent/parent.view'],
                  _.bind(function (ParentCellView) {
                    self.parentContainer = self.ancestors.at(self.ancestors.length - 2);
                    if(self.parentContainer && self.parentContainer.attributes) {
                      var field = new ParentCellView({
                        parent: self.parentContainer.attributes,
                        context: self.options.context,
                        nameEdit: false,
                        iconSize: 'contain',
                        el: self.$el.find(self.ui.location),
                        connector: self.options.node.connector
                      });
                      field.render();
                    }
                  }, this));
            };
        this.ancestors = this.options.context.getCollection('ancestors');
        if(!this.ancestors) {
          this._hideLocationField();
          return;
        }

        this.listenTo(this.ancestors, 'sync', function () {
          renderLocation();
        });
        this.listenTo(this.ancestors, 'error', this._hideLocationField);
        renderLocation();
      },
      
      _hideLocationField: function () {
        this.ui.locationContainer.addClass('binf-hidden');
      },

      _showCreatedByUserName: function () {
        var userOptions = {
          baseElement: this.ui.createdBy,
          userId: this.options.node.get("owner_id")
        };
        this._showUserName(userOptions);
      },
      _showModifiedByUserName: function () {
        const userOptions = {
          baseElement: this.ui.modifiedBy,
          userId: this.options.node?.get("id_expand")?.modify_user_id
        };
        this._showModifiedUserName(userOptions);
      },
      /**
       * This method define specific action's options and invokes the checkPermissionFor method
       * for that specific action.
       *
       * @private
       */
      _checkPermissions: function () {
        var downloadCmdOptions = {
              'signature': 'VersionDownload',
              'actionBtnEle': this.ui.downloadBtn
            },
            openCmdOptions = {
              'signature': 'OpenVersionDelegate',
              'actionBtnEle': this.ui.openBtn
            },
            cmdData = { exclude: ['OpenVersionPerspective', 'Download'] };
            let self = this,
            excludeBrowserCommand = config.fileActionSettings.filter(function(command) {
                                      if (command.Action === 'Download') {
                                        self.orderOfDownload = command.order;
                                      }
                                      if (self.orderOfDownload && command.Action === 'OpenInBrowser' &&
                                        self.orderOfDownload < command.order) {
                                          return true;
                                      }
                                    });
        if (excludeBrowserCommand && excludeBrowserCommand.length) {
          cmdData.exclude.push('OpenInBrowser');
        }
        this._checkPermForSpecificAction(openCmdOptions, cmdData);
        this._checkPermForSpecificAction(downloadCmdOptions);
      },

      getFormattedSizeValue: function (value) {
        return base.formatFriendlyFileSize(value);
      },

      _showLockRow: function () {
        this._updatelockField();
      },

      _updatelockField: function () {
        var isNodeLocked = this.options.node.get('locked');
        if (isNodeLocked && !this.isLocked) {
          this.ui.lockInfo.removeClass('binf-hidden');
          var opts = {
            context: this.options.context,
            tableView: this,
            versionOverview: true,
            model: this.options.node || this.options.model,
          },
            self = this;
          csui.require(['csui/controls/node.state/impl/locked/locked.view'],
            function (LockButtonFieldView) {
              self.lockFieldView = new LockButtonFieldView(_.extend(opts));
              var lockFieldRegion = new Marionette.Region({
                el: self.ui.lockBtn
              });

              lockFieldRegion.show(self.lockFieldView);
              self.$el.find('li.csui-node-state-locked').attr('role', 'none').find('button').removeAttr('tabindex');

              self._getUserField({
                userid: self.options.node.get('locked_user_id'),
                placeholder: self.ui.lockUser,
                showUserProfileLink: true
              });
              self.isLocked = true;
            });
        } else if (!isNodeLocked && !!this.isLocked) {
          this.lockFieldView && this.lockFieldView.destroy();
          this._cleanAndInitLockRow();
          this.isLocked = false;
        }
      },
      _cleanAndInitLockRow: function () {
        this.ui.lockInfo.addClass('binf-hidden');
        this.lockFieldView.$el.html();
        this.ui.lockUser.html();
      },
      _handleClickThumbnail: function (event) {
        event.stopImmediatePropagation();
        this._executeCommand("OpenVersionDelegate");
      },

      _navigateToParent: function () {
        var parentId = this.parentContainer.get('id') || (this.options.node.get('id_expand') && this.options.node.get('id_expand').parent_id);
        if (parentId) {
          this._setNextNodeModelFactory(parentId);
        }
      }

    });

    return VersionOverviewView;

  });


csui.define('json!csui/widgets/error.global/error.global.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "fullpage",
  "schema": {
    "type": "object",
    "properties": {
      "serverError": {
        "title": "{{serverErrorTitle}}",
        "description": "{{serverErrorDescription}}",
        "type": "string"
      }
    }
  },
  "options": {
  }
}
);


csui.define('json!csui/widgets/favorites/favorites.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{title}}",
  "description": "{{description}}",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {}
  },
  "actions": [
    {
      "toolItems": "csui/widgets/favorites2.table/toolbaritems",
      "toolItemMasks": "csui/widgets/favorites2.table/toolbaritems.masks",
      "toolbars": [
        {
          "id": "tableHeaderToolbar",
          "title": "{{tableHeaderToolbarTitle}}",
          "description": "{{tableHeaderToolbarDescription}}"
        },
        {
          "id": "inlineActionbar",
          "title": "{{inlineActionbarTitle}}",
          "description": "{{inlineActionbarDescription}}"
        }
      ]
    }
  ]
}
);


csui.define('json!csui/widgets/placeholder/placeholder.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "tile",
  "supportedKinds": ["tile", "header", "fullpage"],
  "schema": {
    "type": "object",
    "properties": {
      "label": {
        "title": "{{labelTitle}}",
        "description": "{{labelDescription}}",
        "type": "string"
      },
      "color": {
        "title": "{{foregroundColorTitle}}",
        "description": "{{foregroundColorDescription}}",
        "type": "string"
      },
      "bgcolor": {
        "title": "{{backgroundColorTitle}}",
        "description": "{{backgroundColorDescription}}",
        "type": "string"
      }
    }
  }
}
);


csui.define('json!csui/widgets/recentlyaccessed/recentlyaccessed.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{title}}",
  "description": "{{description}}",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {}
  },
  "actions": [
    {
      "toolItems": "csui/widgets/recentlyaccessedtable/toolbaritems",
      "toolItemMasks": "csui/widgets/recentlyaccessedtable/toolbaritems.masks",
      "toolbars": [
        {
          "id": "tableHeaderToolbar",
          "title": "{{tableHeaderToolbarTitle}}",
          "description": "{{tableHeaderToolbarDescription}}"
        },
        {
          "id": "inlineActionbar",
          "title": "{{inlineActionbarTitle}}",
          "description": "{{inlineActionbarDescription}}"
        }
      ]
    }
  ]
}
);


csui.define('json!csui/widgets/shortcut/shortcut.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "tile",
  "deprecated": true,
  "useInstead": "csui/widgets/shortcuts",
  "schema": {
    "type": "object",
    "properties": {
      "id": {
        "title": "{{idTitle}}",
        "description": "{{idDescription}}",
        "type": "integer"
      },
      "type": {
        "title": "{{typeTitle}}",
        "description": "{{typeDescription}}",
        "type": "integer",
        "enum": [141, 142, 133],
        "default": 141
      },
      "background": {
        "title": "{{backgroundTitle}}",
        "description": "{{backgroundDescription}}",
        "type": "string",
        "enum": [
          "cs-tile-background1",
          "cs-tile-background2",
          "cs-tile-background3"
        ]
      },
      "displayName": {
        "title": "{{displayNameTitle}}",
        "type": "string"
      }
    },
    "oneOf": [{
      "required": ["id"]
    }, {
      "required": ["type"]
    }]
  },
  "options": {
    "fields": {
      "id": {
        "type": "otcs_node_picker",
        "type_control": {
          "parameters": {
            "select_types": []
          }
        }
      },
      "type": {
        "type": "select",
        "optionLabels": [
          "{{typeEnterpriseVolume}}",
          "{{typePersonalVolume}}",
          "{{typeCategoryVolume}}"
        ]
      },
      "background": {
        "type": "select",
        "optionLabels": [
          "{{backgroundGrey}}",
          "{{backgroundGreen}}",
          "{{backgroundOrange}}"
        ]
      }
    }
  }
}
);


csui.define('json!csui/widgets/shortcuts/shortcuts.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "tile",
  "selfConfigurable": true,
  "schema": {
    "type": "object",
    "properties": {
      "shortcutTheme": {
        "title": "{{shortcutThemeTitle}}",
        "description": "{{shortcutThemeDescription}}",
        "type": "string",
        "enum": [
          "csui-shortcut-theme-stone1",
          "csui-shortcut-theme-stone2",
          "csui-shortcut-theme-teal1",
          "csui-shortcut-theme-teal2",
          "csui-shortcut-theme-pink1",
          "csui-shortcut-theme-pink2",
          "csui-shortcut-theme-indigo1",
          "csui-shortcut-theme-indigo2"
        ],
        "default": "csui-shortcut-theme-stone1"
      },
      "shortcutItems": {
        "title": "{{shortcutItemsTitle}}",
        "description": "{{shortcutItemsDescription}}",
        "type": "array",
        "minItems": 1,
        "maxItems": 4,
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "title": "{{idTitle}}",
              "description": "{{idDescription}}",
              "type": "integer"
            },
            "type": {
              "title": "{{typeTitle}}",
              "description": "{{typeDescription}}",
              "type": "integer",
              "enum": [141, 142, 133]
            },
            "displayName": {
              "title": "{{displayNameTitle}}",
              "type": "string"
            },
            "customBackgroundImage": {
              "title": "{{customBackgroundImageTitle}}",
              "description": "{{customBackgroundImageDescription}}",
              "type": "integer"
            },
            "customBackgroundColor": {
              "title": "{{customBackgroundColorTitle}}",
              "description": "{{customBackgroundColorDescription}}",
              "type": "string",
              "enum": [
                "",
                "Aqua",
                "Aquamarine",
                "Blue",
                "BlueViolet",
                "Brown",
                "BurlyWood",
                "CadetBlue",
                "Chartreuse",
                "Chocolate",
                "Coral",
                "CornflowerBlue",
                "Crimson",
                "DarkBlue",
                "DarkCyan",
                "DarkGoldenRod",
                "DarkGray",
                "DarkGreen",
                "DarkKhaki",
                "DarkMagenta",
                "DarkOliveGreen",
                "DarkOrange",
                "DarkOrchid",
                "DarkRed",
                "DarkSalmon",
                "DarkSeaGreen",
                "DarkSlateBlue",
                "DarkSlateGray",
                "DarkTurquoise",
                "DarkViolet",
                "DeepPink",
                "DeepSkyBlue",
                "DimGray",
                "DodgerBlue",
                "FireBrick",
                "ForestGreen",
                "Fuchsia",
                "Gainsboro",
                "Gold",
                "GoldenRod",
                "Gray",
                "Green",
                "GreenYellow",
                "HotPink",
                "IndianRed",
                "Indigo",
                "Khaki",
                "LawnGreen",
                "LightBlue",
                "LightCoral",
                "LightGray",
                "LightGreen",
                "LightPink",
                "LightSalmon",
                "LightSeaGreen",
                "LightSkyBlue",
                "LightSlateGray",
                "LightSteelBlue",
                "Lime",
                "LimeGreen",
                "Maroon",
                "MediumAquaMarine",
                "MediumBlue",
                "MediumOrchid",
                "MediumPurple",
                "MediumSeaGreen",
                "MediumSlateBlue",
                "MediumSpringGreen",
                "MediumTurquoise",
                "MediumVioletRed",
                "MidnightBlue",
                "Moccasin",
                "NavajoWhite",
                "Navy",
                "Olive",
                "OliveDrab",
                "Orange",
                "OrangeRed",
                "Orchid",
                "PaleGoldenRod",
                "PaleGreen",
                "PaleTurquoise",
                "PaleVioletRed",
                "PeachPuff",
                "Peru",
                "Pink",
                "Plum",
                "PowderBlue",
                "Purple",
                "RebeccaPurple",
                "Red",
                "RosyBrown",
                "RoyalBlue",
                "SaddleBrown",
                "Salmon",
                "SandyBrown",
                "SeaGreen",
                "Sienna",
                "Silver",
                "SkyBlue",
                "SlateBlue",
                "SlateGray",
                "SpringGreen",
                "SteelBlue",
                "Tan",
                "Teal",
                "Thistle",
                "Tomato",
                "Turquoise",
                "Violet",
                "Wheat",
                "Yellow",
                "YellowGreen"
              ],
              "default": ""
            }
          },
          "oneOf": [{
            "required": ["id"]
          }, {
            "required": ["type"]
          }]
        }
      }
    }
  },
  "options": {
    "fields": {
      "shortcutTheme": {
        "type": "select",
        "optionLabels": [
          "{{shortcutThemeStone1}}",
          "{{shortcutThemeStone2}}",
          "{{shortcutThemeTeal1}}",
          "{{shortcutThemeTeal2}}",
          "{{shortcutThemePink1}}",
          "{{shortcutThemePink2}}",
          "{{shortcutThemeIndigo1}}",
          "{{shortcutThemeIndigo2}}"
        ]
      },
      "shortcutItems": {
        "items": {
          "fields": {
            "id": {
              "type": "otcs_node_picker",
              "type_control": {
                "parameters": {
                  "select_types": []
                }
              }
            },
            "type": {
              "type": "select",
              "optionLabels": [
                "{{typeEnterpriseVolume}}",
                "{{typePersonalVolume}}",
                "{{typeCategoryVolume}}"
              ]
            },
            "customBackgroundImage": {
              "type": "otcs_node_picker",
              "hidden": true,
              "type_control": {
                "parameters": {
                  "select_types": [1305],
                  "startLocations": ["csui/dialogs/node.picker/start.locations/support.assets.volume"],
                  "startLocation": "csui/dialogs/node.picker/start.locations/support.assets.volume"
                }
              }
            },
            "customBackgroundColor": {
              "type": "select",
              "optionLabels": [
                "{{none}}",
                "Aqua",
                "Aquamarine",
                "Blue",
                "BlueViolet",
                "Brown",
                "BurlyWood",
                "CadetBlue",
                "Chartreuse",
                "Chocolate",
                "Coral",
                "CornflowerBlue",
                "Crimson",
                "DarkBlue",
                "DarkCyan",
                "DarkGoldenRod",
                "DarkGray",
                "DarkGreen",
                "DarkKhaki",
                "DarkMagenta",
                "DarkOliveGreen",
                "DarkOrange",
                "DarkOrchid",
                "DarkRed",
                "DarkSalmon",
                "DarkSeaGreen",
                "DarkSlateBlue",
                "DarkSlateGray",
                "DarkTurquoise",
                "DarkViolet",
                "DeepPink",
                "DeepSkyBlue",
                "DimGray",
                "DodgerBlue",
                "FireBrick",
                "ForestGreen",
                "Fuchsia",
                "Gainsboro",
                "Gold",
                "GoldenRod",
                "Gray",
                "Green",
                "GreenYellow",
                "HotPink",
                "IndianRed",
                "Indigo",
                "Khaki",
                "LawnGreen",
                "LightBlue",
                "LightCoral",
                "LightGray",
                "LightGreen",
                "LightPink",
                "LightSalmon",
                "LightSeaGreen",
                "LightSkyBlue",
                "LightSlateGray",
                "LightSteelBlue",
                "Lime",
                "LimeGreen",
                "Maroon",
                "MediumAquaMarine",
                "MediumBlue",
                "MediumOrchid",
                "MediumPurple",
                "MediumSeaGreen",
                "MediumSlateBlue",
                "MediumSpringGreen",
                "MediumTurquoise",
                "MediumVioletRed",
                "MidnightBlue",
                "Moccasin",
                "NavajoWhite",
                "Navy",
                "Olive",
                "OliveDrab",
                "Orange",
                "OrangeRed",
                "Orchid",
                "PaleGoldenRod",
                "PaleGreen",
                "PaleTurquoise",
                "PaleVioletRed",
                "PeachPuff",
                "Peru",
                "Pink",
                "Plum",
                "PowderBlue",
                "Purple",
                "RebeccaPurple",
                "Red",
                "RosyBrown",
                "RoyalBlue",
                "SaddleBrown",
                "Salmon",
                "SandyBrown",
                "SeaGreen",
                "Sienna",
                "Silver",
                "SkyBlue",
                "SlateBlue",
                "SlateGray",
                "SpringGreen",
                "SteelBlue",
                "Tan",
                "Teal",
                "Thistle",
                "Tomato",
                "Turquoise",
                "Violet",
                "Wheat",
                "Yellow",
                "YellowGreen"
              ]
            }
          }
        }
      }
    }
  }
}
);


csui.define('json!csui/widgets/welcome.placeholder/welcome.placeholder.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "header",
  "schema": {
    "type": "object",
    "properties": {
      "message": {
        "title": "{{messageTitle}}",
        "description": "{{messageDescription}}",
        "type": "string"
      },
      "videoPoster": {
        "title": "{{videoPosterTitle}}",
        "description": "{{videoPosterDescription}}",
        "type": "string"
      },
      "videoSrc": {
        "title": "{{videoSourceTitle}}",
        "description": "{{videoSourceDescription}}",
        "type": "string"
      }
    }
  }
}
);


csui.define('json!csui/widgets/recycle.items.table/recycle.items.table.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{title}}",
  "description": "{{description}}",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {}
  },
  "actions": [
    {
      "toolItems": "csui/widgets/recycle.items.table/recycle.toolbaritems",
      "toolItemMasks": "csui/widgets/recycle.items.table/recycle.toolbaritems.masks",
      "toolbars": [
        {
          "id": "tableHeaderToolbar",
          "title": "{{tableHeaderToolbarTitle}}",
          "description": "{{tableHeaderToolbarDescription}}"
        },
        {
          "id": "inlineActionbar",
          "title": "{{inlineActionbarTitle}}",
          "description": "{{inlineActionbarDescription}}"
        }
      ]
    }
  ]
});


csui.define('json!csui/widgets/html.editor/html.editor.manifest.json',{
	"$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
	"title": "{{title}}",
	"description": "{{description}}",
	"kind": "tile",
	"supportedKinds": ["tile", "header", "heroTile", "fullpage"],
	"schema": {
		"type": "object",
		"properties": {
			"titlefield": {
				"title": "{{titleLabel}}",
				"description": "{{titleDesc}}",
				"type": "string",
				"default": ""
			},
			"wikicontainerid": {
				"title": "{{wikiContainerID}}",
				"description": "{{wikiContainerIDDesc}}",
				"type": "integer"
			},
			"wikitemplateid": {
				"title": "{{wikiTemplateID}}",
				"description": "{{wikiTemplateIDDesc}}",
				"type": "integer"
			},
			"wikiid": {
				"title": "{{wikiContainerID}}",
				"description": "{{wikiContainerIDDesc}}",
				"type": "integer"
			},
			"wikipageid": {
				"title": "{{wikiTemplateID}}",
				"description": "{{wikiTemplateIDDesc}}",
				"type": "integer"
			}
		}
	},
	"options": {
		"fields": {
			"wikicontainerid": {
				"type": "otcs_node_picker",
				"type_control": {
					"parameters": {
						"select_types": [
							5573
						],
						"startLocations": [
						   "csui/dialogs/node.picker/start.locations/enterprise.volume",
						   "csui/dialogs/node.picker/start.locations/personal.volume",
						   "csui/dialogs/node.picker/start.locations/favorites",
						   "csui/dialogs/node.picker/start.locations/recent.containers",
						   "csui/dialogs/node.picker/start.locations/perspective.assets.volume"
						 ]
					}
				}
			},
			"wikitemplateid": {
				"type": "otcs_node_picker",
				"type_control": {
					"parameters": {
						"select_types": [
							5574
						],
						"startLocation": "csui/dialogs/node.picker/start.locations/perspective.assets.volume",
						"startLocations": [
						   "csui/dialogs/node.picker/start.locations/enterprise.volume",
						   "csui/dialogs/node.picker/start.locations/personal.volume",
						   "csui/dialogs/node.picker/start.locations/favorites",
						   "csui/dialogs/node.picker/start.locations/recent.containers",
						   "csui/dialogs/node.picker/start.locations/perspective.assets.volume"
						 ]
					}
				}
			},
			"wikipageid": {
				"type": "otcs_node_picker",
				"hidden": true,
				"type_control": {
					"parameters": {
						"select_types": [
							5574
						]
					}
				}
			},
			"wikiid": {
				"type": "otcs_node_picker",
				"hidden": true,
				"type_control": {
					"parameters": {
						"select_types": [
							5573
						]
					}
				}
			},
			"width": {
				"type": "select",
				"optionLabels": [
					"{{default}}",
					"{{full}}",
					"{{half}}",
					"{{quarter}}"
				]
			}
		}
	},
	"callback": "wiki/callbacks/wikiHookCallback"
}
);


csui.define('json!csui/widgets/document.overview/document.overview.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "fullpage",
  "schema": {
    "type": "object",
    "properties": {
      "id": {
        "title": "{{idTitle}}",
        "description": "{{idDescription}}",
        "type": "integer"
      }
    },
    "required": ["id"]
  },
  "options": {
    "fields": {
      "id": {
        "type": "otcs_node_picker",
        "type_control": {
          "parameters": {
            "select_types": [144]
          }
        }
      }
    }
  }
}
);


csui.define('csui/widgets/favorites/impl/nls/favorites.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/favorites/impl/nls/root/favorites.manifest',{
  "title": "Favorites",
  "description": "Shows favorite objects of the current user.",
  "tableHeaderToolbarTitle": "Table Header Toolbar",
  "tableHeaderToolbarDescription": "Toolbar, which is activated in the table header, once a table row is selected.",
  "inlineActionbarTitle": "Inline Action Bar",
  "inlineActionbarDescription": "Toolbar, which is displayed inside a table row, when the mouse cursor is moving above it."
});



csui.define('csui/widgets/placeholder/impl/nls/placeholder.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/placeholder/impl/nls/root/placeholder.manifest',{
  "widgetTitle": "Placeholder",
  "widgetDescription": "Shows a colorful tile taking the space instead of a real widget.",
  "labelTitle": "Label",
  "labelDescription": "Label of the tile",
  "foregroundColorTitle": "Foreground color",
  "foregroundColorDescription": "Color for the label of the tile",
  "backgroundColorTitle": "Background color",
  "backgroundColorDescription": "Color for the background of the tile"
});




csui.define('csui/widgets/recentlyaccessed/impl/nls/recentlyaccessed.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/recentlyaccessed/impl/nls/root/recentlyaccessed.manifest',{
  "title": "Recently Accessed",
  "description": "Shows documents accessed recently by the current user.",
  "tableHeaderToolbarTitle": "Table Header Toolbar",
  "tableHeaderToolbarDescription": "Toolbar, which is activated in the table header, once a table row is selected.",
  "inlineActionbarTitle": "Inline Action Bar",
  "inlineActionbarDescription": "Toolbar, which is displayed inside a table row, when the mouse cursor is moving above it."
});




csui.define('csui/widgets/shortcut/impl/nls/shortcut.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/shortcut/impl/nls/root/shortcut.manifest',{
  "widgetTitle": "Single Shortcut",
  "widgetDescription": "Tile representing a hyperlink to an object; it navigates to its page when clicked",
  "idTitle": "Target object",
  "idDescription": "An object to open by this shortcut",
  "typeTitle": "Volume",
  "typeDescription": "Sub-type number of a global volume to open by this shortcut if no object has been selected",
  "backgroundTitle": "Background",
  "backgroundDescription": "Styling of the background below the shortcut tile",
  "typeEnterpriseVolume": "Enterprise",
  "typePersonalVolume": "Personal",
  "typeCategoryVolume": "Categories",
  "displayNameTitle": "Display name",
  "backgroundGrey": "Grey",
  "backgroundGreen": "Green",
  "backgroundOrange": "Orange"
});




csui.define('csui/widgets/welcome.placeholder/impl/nls/welcome.placeholder.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/welcome.placeholder/impl/nls/root/welcome.placeholder.manifest',{
  "widgetTitle": "Welcome Header",
  "widgetDescription": "Shows a wide widget with initial information for the user home page.",
  "messageTitle": "Display message",
  "messageDescription": "Message to be displayed at the bottom of the tile",
  "videoPosterTitle": "Video thumbnail",
  "videoPosterDescription": "Web address of the poster to show when the video is not playing",
  "videoSourceTitle": "Video location",
  "videoSourceDescription": "Web address of the video to play"
});




csui.define('csui/widgets/recycle.items.table/impl/nls/recycle.items.table.manifest',{
    // Always load the root bundle for the default locale (en-us)
    "root": true,
    // Do not load English locale bundle provided by the root bundle
    "en-us": false,
    "en": false
});

csui.define('csui/widgets/recycle.items.table/impl/nls/root/recycle.items.table.manifest',{
  "title": "Recycle bin",
  "description": "Shows items deleted by the current user.",
  "tableHeaderToolbarTitle": "Table Header Toolbar",
  "tableHeaderToolbarDescription": "Toolbar, which is activated in the table header, once a table row is selected.",
  "inlineActionbarTitle": "Inline Action Bar",
  "inlineActionbarDescription": "Toolbar, which is displayed inside a table row, when the mouse cursor is moving above it."
});



csui.define('csui/widgets/html.editor/impl/nls/html.editor.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/html.editor/impl/nls/root/html.editor.manifest',{
	'title': 'HTML Tile',
	'description': 'Returns the HTML output of an object and inserts it into a tile.',
	'widthLabel': 'Width',
	'widthDesc': 'The maximum width on the largest screen-size.',
	'default': 'Default',
	'full': 'Full',
	'half': 'Half',
	'quarter': 'Quarter',
	'titleLabel': 'Title',
	'titleDesc': 'Title for the tile',
	'objIdLabel': 'Object ID',
	'objIdDesc': 'Object ID for which we have to render and allow users to edit rich text content.',
	'wikiContainerID': 'Target wiki for HTML Content (optional)',
	'wikiTemplateID': 'Template wiki page (optional)',
	'wikiContainerIDDesc': 'If not specified, a target wiki will be created automatically in perspective asset volume',
	'wikiTemplateIDDesc': 'If not specified, a target wiki template will be pointed automatically from perspective asset folder'
});




csui.define('csui/widgets/document.overview/impl/nls/document.overview.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/document.overview/impl/nls/root/document.overview.manifest',{
  "widgetTitle": "Document Overview",
  "widgetDescription": "Shows basic information about a document and offers the most often actions for it.",
  "idTitle": "Document",
  "idDescription": "A document to show the overview for"
});




csui.define('bundles/csui-app',[
  // Behaviours
  'csui/behaviors/expanding/expanding.behavior',
  'csui/behaviors/item.error/item.error.behavior',
  'csui/behaviors/item.state/item.state.behavior',
  'csui/behaviors/item.state/item.state.view',
  'csui/behaviors/limiting/limiting.behavior',
  'csui/behaviors/resizable/resizable.behavior',

  // Controls
  'csui/controls/tile/behaviors/expanding.behavior',
  'csui/controls/tile/tile.view',
  'csui/controls/iconpreload/icon.preload.view',
  'csui/controls/rich.text.editor/rich.text.editor',
  'csui/controls/selected.count/selected.count.view',
  'csui/controls/selected.count/selected.count.control.view',

  // Control behaviours

  // 3rd-party libraries

  // TODO: Remove this as long as we mock only for testing purposes;
  // currently we do it a lot to present our features and we need
  // the mockjax in the production output
  'csui/lib/jquery.simulate',
  'csui/lib/othelp',

  // Froala Bootstrap

  'csui/utils/froala/bootstrap',

  // Pages
  'csui/pages/start/start.page.view',

  // Navigation Header
  'csui/widgets/navigation.header/controls/help/help.view',
  'csui/widgets/navigation.header/controls/home/home.view',
  'csui/widgets/navigation.header/controls/breadcrumbs/breadcrumbs.view',
  'csui/widgets/navigation.header/controls/search/search.view',
  'csui/widgets/navigation.header/controls/favorites/favorites.view',
  'csui/widgets/navigation.header/controls/user.profile/user.profile.view',
  'csui/widgets/navigation.header/controls/progressbar.maximize/progressbar.maximize.view',
  'csui/widgets/navigation.header/navigation.header.controls',

  // Navigation Header V2 Controls
  "csui/controls/app.header/app.header.controls/logo/logo.view",
  "csui/controls/app.header/app.header.controls/search.box/search.box.view",
  "csui/controls/app.header/app.header.controls/progresspanel/progressbar.maximize.view",
  "csui/controls/app.header/app.header.controls/favorites/favorites.view",
  "csui/controls/app.header/app.header.controls/help/help.view",
  "csui/controls/app.header/app.header.controls/user.profile/user.profile.view",
  "csui/controls/app.header/app.header.controls/csui.app.header.controls",
  "csui/controls/app.header/burger.menu/burger.menu",

  // Routers

  // Utilities
  'csui/utils/proxysettings/proxy.dynamic.menu',
  "csui/utils/usersettings/cm.dynamic.menu",

    'csui/perspective.manage/sidebar/pman.sidebar.container.view',
    'csui/perspective.manage/sidebar/layouts',
    'csui/perspective.manage/sidebar/widgets',

  // Commands
  // FIXME: Create a public module instead of this private one.
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/tabletoolbar/impl/nls/localized.strings',

  // Contexts and factories
  // Client-side perspectives
  'json!csui/utils/contexts/perspective/impl/perspectives/error.global.json',

  // Application widgets
  'csui/widgets/error.global/error.global.view',
  'csui/widgets/favorites/favorites.view',
  'csui/widgets/favorites/tileview.toolbaritems',
  'csui/widgets/navigation.header/profile.menuitems',
  'csui/widgets/navigation.header/profile.menuitems.mask',
  'csui/widgets/placeholder/placeholder.view',
  'csui/widgets/recentlyaccessed/recentlyaccessed.columns',
  'csui/widgets/recentlyaccessed/recentlyaccessed.view',
  'csui/widgets/recentlyaccessed/tileview.toolbaritems',
  'csui/widgets/search.box/search.box.view',
  'csui/widgets/shortcut/shortcut.view',
  'csui/widgets/shortcuts/shortcuts.view',
  'csui/widgets/welcome.placeholder/welcome.placeholder.view',

  'csui/widgets/html.editor/impl/cslink.preview/cslink.preview.view',
  'csui/widgets/html.editor/html.editor.view',
  'csui/widgets/document.overview/document.overview.view',
  'csui/widgets/version.overview/version.overview.view',


  // Application widgets manifests
  'json!csui/widgets/error.global/error.global.manifest.json',
  'json!csui/widgets/favorites/favorites.manifest.json',
  'json!csui/widgets/placeholder/placeholder.manifest.json',
  'json!csui/widgets/recentlyaccessed/recentlyaccessed.manifest.json',
  'json!csui/widgets/shortcut/shortcut.manifest.json',
  'json!csui/widgets/shortcuts/shortcuts.manifest.json',
  'json!csui/widgets/welcome.placeholder/welcome.placeholder.manifest.json',
  'json!csui/widgets/recycle.items.table/recycle.items.table.manifest.json',
  'json!csui/widgets/html.editor/html.editor.manifest.json',
  'json!csui/widgets/document.overview/document.overview.manifest.json',

  'i18n!csui/widgets/favorites/impl/nls/favorites.manifest',
  'i18n!csui/widgets/placeholder/impl/nls/placeholder.manifest',
  'i18n!csui/widgets/recentlyaccessed/impl/nls/recentlyaccessed.manifest',
  'i18n!csui/widgets/shortcut/impl/nls/shortcut.manifest',
  'i18n!csui/widgets/shortcuts/impl/nls/shortcuts.manifest',
  'i18n!csui/widgets/welcome.placeholder/impl/nls/welcome.placeholder.manifest',
  'i18n!csui/widgets/recycle.items.table/impl/nls/recycle.items.table.manifest',
  'i18n!csui/widgets/html.editor/impl/nls/html.editor.manifest',
  'i18n!csui/widgets/document.overview/impl/nls/document.overview.manifest',

  // Shared for favoritestable from csui-browse
  'i18n!csui/widgets/favorites/impl/nls/lang',
  // Shared for recentlyaccessedtable from csui-browse
  'i18n!csui/widgets/recentlyaccessed/impl/nls/lang',
  // shared for searchformview from csui-search
  'i18n!csui/widgets/search.forms/impl/nls/lang',
], {});

csui.require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-app', true);
});

//# sourceMappingURL=csui-app.js.map