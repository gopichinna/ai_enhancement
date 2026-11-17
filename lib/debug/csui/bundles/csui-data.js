/**
 * This class has to be remove once SVF-1020 got resolved.
 */

csui.define('csui/controls/icons.v2',[
  'nuc/lib/underscore',
  'smart/controls/icons.v2/icons.v2',
  'csui-ext!csui/controls/icons.v2'
], function (_, SmartIconsV2, otherIcons) {

  if (otherIcons) {
    // otherIcons has array of objects with key for each extension
    if (_.isArray(otherIcons)) {
      for (var i = 0; i < otherIcons.length; i++) {
        var iconsMap = otherIcons[i];
        SmartIconsV2.registerIcons(iconsMap);
      }
    } else {
      SmartIconsV2.registerIcons(otherIcons);
    }
  }

  return SmartIconsV2;
});


/**
 * This class will be removed as soon as SVF-1020 got resolved.
 */

csui.define('csui/controls/icon/icon.view',['smart/controls/icon/icon.view'
], function (SmartIconView) {
  'use strict';

  return SmartIconView;
});

csui.define('csui/utils/contexts/factories/next.node',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/connector', 'csui/models/node/node.model',
  'csui/utils/commands'
], function (module, _, $, Backbone, ModelFactory, ConnectorFactory,
    NodeModel, commands) {
  'use strict';

  var prefetch = /\bprefetch(?:=([^&]*)?)/i.exec(location.search);
  prefetch = !prefetch || prefetch[1] !== 'false';

  var initialResourceFetched;

  var NextNodeModelFactory = ModelFactory.extend({
    propertyPrefix: 'nextNode',

    constructor: function NextNodeModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var nextNode = this.options.nextNode || {},
          config   = module.config();
      if (prefetch) {
        this.initialResponse = nextNode.initialResponse || config.initialResponse;
      }
      if (!(nextNode instanceof Backbone.Model)) {
        var fields  = {
              properties: [],
              'versions.element(0)': ['owner_id']
            },
            expands = {
              properties: ['original_id', 'locked_user_id']
            };
        if (nextNode.options) {
          // merge 'fields'
          _.mapObject(nextNode.options.fields, function (val, key) {
            fields[key] = _.union(fields[key], val);
          });
          // merge 'expand'
          _.mapObject(nextNode.options.expand, function (val, key) {
            expands[key] = _.union(expands[key], val);
          });
        }

        var connector       = context.getObject(ConnectorFactory, options),
            creationOptions = $.extend(true, {
              connector: connector,
              // Do not waste server resources; it returns all it can by default
              fields: fields,
              // Command enabling for shortcuts needs the original node info
              expand: expands,
              // Make sure, that the metadata token is returned for nodes
              // requesated via this factory, because they are supposed to
              // be shared and may be the subject of changes.
              stateEnabled: true,
              // Command enabling needs permitted actions
              commands: commands.getAllSignatures()
            }, config.options, nextNode.options);
        // Next node can be fetched just like node; keep their defaults in sync
        nextNode = new NodeModel(nextNode.attributes || config.attributes,
            creationOptions);
      }
      this.property = nextNode;
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      if (this.initialResponse && !initialResourceFetched) {
        var promise = this.property.prefetch(this.initialResponse, options);
        initialResourceFetched = true;
        return promise;
      } else {
        return this.property.fetch(options);
      }
    }
  });

  return NextNodeModelFactory;
});


csui.define('csui/utils/contexts/factories/search.query.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory'
], function (module, _, Backbone, ModelFactory) {

  var SearchQueryModel = Backbone.Model.extend({

    constructor: function SearchQueryModel(attributes, options) {
      SearchQueryModel.__super__.constructor.apply(this, arguments);
    },

    toJSON: function () {
      return SearchQueryModel.__super__.toJSON.apply(this, arguments);
    }

  });

  var SearchQueryModelFactory = ModelFactory.extend({

    propertyPrefix: 'searchQuery',

    constructor: function SearchQueryModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var searchQuery = this.options.searchQuery || {};
      if (!(searchQuery instanceof Backbone.Model)) {
        var config = module.config();
        searchQuery = new SearchQueryModel(searchQuery.models, _.extend({},
            searchQuery.options, config.options));
      }
      this.property = searchQuery;
    }

  });

  return SearchQueryModelFactory;

});


csui.define('csui/utils/contexts/factories/search.formquery.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory'
], function (module, _, Backbone, ModelFactory) {

  var SearchQueryModel = Backbone.Model.extend({

    constructor: function SearchQueryModel(attributes, options) {
      SearchQueryModel.__super__.constructor.apply(this, arguments);
    },

    toJSON: function () {
      return SearchQueryModel.__super__.toJSON.apply(this, arguments);
    }

  });

  var SearchQueryModelFactory = ModelFactory.extend({

    propertyPrefix: 'searchTemplate',

    constructor: function SearchQueryModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var searchQuery = this.options.searchQuery || {};
      if (!(searchQuery instanceof Backbone.Model)) {
        var config = module.config();
        searchQuery = new SearchQueryModel(searchQuery.models, _.extend({},
            searchQuery.options, config.options));
      }
      this.property = searchQuery;
    }

  });

  return SearchQueryModelFactory;

});


csui.define('csui/themes/csui.jato.status.icons',[], function () {
let icons = {
'statusWarning': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-status-id-6)"><path fill="var(--jato-status-rating-03, #e86100ff)" d="M8.951 2.325a1.096 1.096 0 0 0-1.902 0L.17 14.36c-.417.73.11 1.639.951 1.639h13.756c.84 0 1.368-.909.95-1.64z" fill-opacity="1"/><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-rule="evenodd" d="M8.9 10.25c0 .414-.358.75-.8.75s-.8-.336-.8-.75v-4.5c0-.414.358-.75.8-.75s.8.336.8.75z" clip-rule="evenodd" fill-opacity="1"/><circle cx="8.1" cy="13.088" r=".9" fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-opacity="1"/></g><defs><clipPath id="jato-status-id-6"><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'statusInfo': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><rect width="16" height="16" fill="var(--jato-qualitative-10, #3382ffff)" rx="4" fill-opacity="1"/><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-rule="evenodd" d="M8.9 7c0-.414-.358-.75-.8-.75s-.8.336-.8.75v4.5c0 .414.358.75.8.75s.8-.336.8-.75z" clip-rule="evenodd" fill-opacity="1"/><circle cx="8.1" cy="4.3" r=".8" fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-opacity="1"/></svg>`,
'statusQuestion': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><rect width="16" height="16" fill="var(--jato-qualitative-03, #5407b3ff)" rx="4" fill-opacity="1"/><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-rule="evenodd" d="M7.908 4.4c-.943 0-1.708.765-1.708 1.708a.6.6 0 0 1-1.2 0 2.908 2.908 0 0 1 5.815 0v.03l-.003.03c-.097.97-.62 1.446-1.068 1.853q-.137.123-.258.242c-.106.105-.216.21-.315.303l-.119.112a4 4 0 0 0-.32.334c-.146.179-.215.33-.223.519l-.001 1.038a.6.6 0 1 1-1.2 0V9.531c.01-.542.226-.949.496-1.279.132-.162.28-.309.42-.442l.14-.132c.092-.088.18-.17.273-.264.148-.147.275-.266.384-.368.382-.357.542-.507.594-.968A1.71 1.71 0 0 0 7.908 4.4m0 8.65a.625.625 0 1 0 0-1.25.625.625 0 0 0 0 1.25" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'statusReservedLocked': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><rect width="16" height="16" fill="var(--jato-qualitative-07, #00399cff)" rx="4" fill-opacity="1"/><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-rule="evenodd" d="M11 5.5v1.525c.57.116 1 .62 1 1.225v3.25a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 11.5V8.25c0-.605.43-1.11 1-1.225V5.5c0-1.485 1.191-3 3-3s3 1.515 3 3m-5 0c0-1 .809-2 2-2s2 1 2 2V7H6z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'statusReservedOwner': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><rect width="16" height="16" fill="var(--jato-qualitative-08, #52960eff)" rx="4" fill-opacity="1"/><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-rule="evenodd" d="M11 5.5v1.525c.57.116 1 .62 1 1.225v3.25a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 11.5V8.25c0-.605.43-1.11 1-1.225V5.5c0-1.485 1.191-3 3-3s3 1.515 3 3m-5 0c0-1 .809-2 2-2s2 1 2 2V7H6zm2.5 5.059a.75.75 0 1 0-1 0V11a.5.5 0 0 0 1 0z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'statusSuccess': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-status-id-0)"><circle cx="8" cy="8" r="8" fill="var(--jato-status-rating-06, #009952ff)" fill-opacity="1"/><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-rule="evenodd" d="M12.043 4.961a.72.72 0 0 1 0 1.02L6.774 11.25 3.957 8.433a.721.721 0 0 1 1.02-1.02L6.774 9.21l4.25-4.249a.72.72 0 0 1 1.02 0" clip-rule="evenodd" fill-opacity="1"/></g><defs><clipPath id="jato-status-id-0"><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'statusError': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-status-id-11)"><circle cx="8" cy="8" r="8" fill="var(--jato-status-rating-02, #e60054ff)" fill-opacity="1"/><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-rule="evenodd" d="M11.03 4.97a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06l5-5a.75.75 0 0 1 1.06 0" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-rule="evenodd" d="M4.97 4.97a.75.75 0 0 1 1.06 0l5 5a.75.75 0 1 1-1.06 1.06l-5-5a.75.75 0 0 1 0-1.06" clip-rule="evenodd" fill-opacity="1"/></g><defs><clipPath id="jato-status-id-11"><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'statusErrorSmall': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-status-id-10)"><circle cx="8" cy="8" r="6" fill="var(--jato-status-rating-02, #e60054ff)" fill-opacity="1"/></g><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-rule="evenodd" d="M5.518 5.518a.59.59 0 0 1 .834 0l4.13 4.13a.59.59 0 1 1-.834.834l-4.13-4.13a.59.59 0 0 1 0-.834" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-rule="evenodd" d="M10.583 5.417a.59.59 0 0 1 0 .834L6.25 10.583a.59.59 0 0 1-.834-.834l4.331-4.332a.59.59 0 0 1 .835 0" clip-rule="evenodd" fill-opacity="1"/><defs><clipPath id="jato-status-id-10"><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" d="M0 0h12v12H0z" transform="translate(2 2)" fill-opacity="1"/></clipPath></defs></svg>`,
'statusLocked': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><rect width="16" height="16" fill="var(--jato-qualitative-11, #35006eff)" rx="4" fill-opacity="1"/><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-rule="evenodd" d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5a2 2 0 0 0 1.732-1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5.72l-.12-.2A2 2 0 0 0 8 2z" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-graph-typography-overlay-figures, #ffff)" fill-rule="evenodd" d="M12 6v1h-2V6a1 1 0 1 1 2 0M9 7V6a2 2 0 1 1 4 0v1a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1m4 1H9v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
};
return icons;
});


/**
 * This mixin is for CSUI specific and provides methods to be executed for message dialog view
 *
 */
csui.define('csui/controls/globalmessage/message.dialog.mixin',['nuc/lib/underscore'
], function (_) {

    'use strict';

    var CommonViewMixin = {
        mixin: function (prototype) {
            return _.extend(prototype, {

                executeGotoLocation: function (node) {
                    csui.require(['csui/lib/backbone',
                        'csui/utils/commands', 'csui/utils/commandhelper'
                    ], function (Backbone, commands, CommandHelper) {
                        var command = commands.get('goToLocation');
                        if (!command) {
                            throw new Error('Invalid command: goToLocation');
                        }
                        var status = {
                            nodes: new Backbone.Collection([node]),
                            model: node,
                            context: this.options.context,
                            originatingView: this
                        },
                            options = {
                                context: this.options.context,
                                originatingView: this
                            };
                        CommandHelper.handleExecutionResults(command.execute(status, options));
                    }.bind(this));
                },

                onClickLink: function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.doClose();
                    if (this.options.targetFolder && this._nextNode) {
                        this._nextNode.set('id', this.options.targetFolder.get('id'));
                    }
                },

                onClickGotoLocation: function(e) { //customizing the function to correctly navigate to the respective location. 
                    e.preventDefault();
                    e.stopPropagation();
                    this.doClose();
                    const targetLocation = this.options.targetLocation;
                    if (targetLocation && this._nextNode) {
                        let node = this.options.currentNode; //The node on which gotolocation is clicked 
                        if (node) {
                            node.set({parent_id: targetLocation.id}, {silent: true});
                            this.executeGotoLocation(node);
                        } else {
                            this._nextNode.set('id', targetLocation.id);
                        }
                    }
                }
            });
        }
    };

    return CommonViewMixin;
});

csui.define('css!csui/controls/globalmessage/impl/progresspanel/progresspanel-warning-styles',[],function(){});

csui.define('csui/controls/globalmessage/progresspanel.view.ext',['nuc/lib/underscore',
  'smart/controls/progresspanel/progresspanel.view.ext',
  "smart/themes/theming",
  'csui/themes/csui.jato.status.icons',
  'csui/controls/globalmessage/message.dialog.mixin',
  'css!csui/controls/globalmessage/impl/progresspanel/progresspanel-warning-styles.css'
], function (_, SmartProgressPanelViewExt, theming, jatoStatusIcon, MessageDialogMixin) {

  var ProgressPanelViewExt = SmartProgressPanelViewExt.extend({

    constructor: function ProgressPanelViewExt(options) {
      if (options.context && options.nextNodeModelFactory) {
        this._nextNode = options.context.getModel(options.nextNodeModelFactory);
      }
      this.listenTo(this, 'navigate:to:location', _.bind(this.onNavigateToLocation, this));
      this.listenTo(this, 'abort:progress', _.bind(this.onAbortProgress, this));
      this.listenTo(this, 'abort:model:progress', _.bind(this.onAbortModelProgress, this));
      SmartProgressPanelViewExt.prototype.constructor.call(this, options);
    },

    onNavigateToLocation: function (childView) {
      var model = childView ? childView.model : this.collection.models[0],
          node  = model.node;
      var targetLocation = model.get('targetLocation');
      if (targetLocation && this._nextNode) {
        if (node) {
          node.set({parent_id: targetLocation.id}, {silent: true});
          this.executeGotoLocation(node);
        } else {
          this._nextNode.set('id', targetLocation.id);
        }
      }
    },

    onAbortProgress: function () {
      this.collection.abort('stopped');
    },

    onAbortModelProgress: function (childView) {
      childView && childView.model.abort();
    },

    updateProgressPanel: function (failedCount) {
      var notificationIcon, allFailures;
      let statusIcon = this.el?.querySelector('.smart-progresspanel-icon');
      if (this.isProgressFailed()) {
        this.$el.removeClass("processing-update");
        this.$el.addClass("processing-error");
        notificationIcon = "csui-global-error";
        allFailures = failedCount === this.collection.length;
      } else {
        let hasContainer = false;
        if (this.options.actionType === 'copy') { 
          hasContainer = this.collection.models.some(attr => attr.get("container"));
        }
        notificationIcon = hasContainer ? "csui-global-warning" : "csui-global-success";
        if(hasContainer && statusIcon){
          theming.isJATOTheme()
        ? statusIcon.innerHTML = jatoStatusIcon.statusWarning
        : statusIcon.setAttribute('icon', "smart_notification:notification_warning24");
        }
        if (!this.parentView?.$el.find(".smart-progresspanel-wrapper")?.hasClass('binf-hidden')) {
          this.autoHideSuccessBanner();
        }
      }
      this.ui.processingAction.addClass("binf-hidden");
      this.ui.closeAction.parent(".csui-close").removeClass("binf-hidden");
      this.ui.header.find(".csui-minimize").addClass("binf-hidden");
      this.ui.header.find(".csui-progress").addClass("binf-hidden");
      this._isRendered && this.collection.sort();
      this.handleProgressComplete(allFailures);
      this.showretryAll();
      if (
        this.options.actionType &&
        this.options.actionType === "ADD_VERSION"
      ) {
        return;
      }
      this.$el.addClass(notificationIcon);
      if (this.options.actionType === 'move' && notificationIcon === "csui-global-success" && this.options.hideGotoLocationSingleSet) { // navigate in case of success & context menu of folder/doc is clicked
        this.onNavigateToLocation();
      }
    }

  });

  MessageDialogMixin.mixin(ProgressPanelViewExt.prototype);

  return ProgressPanelViewExt;
});



csui.define('csui/controls/node-type.icon/node-type.icon.view.ext',[
  'csui/utils/url'
], function (
  Url
) {
  'use strict';

  /**
   * Check if ajax call is needed to get the image (i.e. url contains the cgi script).
   * @this calling context is set to the node type icon view.
   * @param {url} the image url to check.
   * @returns true if ajax call is needed, false otherwise.
   */
  function needsAjax(url) {
    var connector = this.options.node.connector;
    var connectUrl = connector && connector.getConnectionUrl();
    if (connector && connectUrl) {
      var absoluteUrl = url;
      if (!new Url(url).isAbsolute()) {
        if (url.startsWith('/')) {
          absoluteUrl = Url.combine(connectUrl.getOrigin(), url);
        } else {
          absoluteUrl = Url.combine(connectUrl.getCgiScript(), url);
        }
      }
      if (absoluteUrl.startsWith(connectUrl.getCgiScript())) {
        return true;
      }
    }
  }

  return {
    needsAjax: needsAjax
  };
});


csui.define('csui/controls/node-type.icon/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/controls/node-type.icon/impl/nls/root/lang',{

  shortcutTypeLabel: 'Shortcut to {0}',
  nodeTypeUnknown: 'Unknown',
  generationTypeLabel: 'Generation to {0}',

});




/* START_TEMPLATE */
csui.define('hbs!csui/controls/node-type.icon/node-type.icon',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "  <img class=\"csui-icon csui-node-type-image\" alt=\"\" aria-hidden=\"true\">\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <otc-icon size=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"jatoIconSize") || (depth0 != null ? lookupProperty(depth0,"jatoIconSize") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"jatoIconSize","hash":{},"loc":{"start":{"line":6,"column":18},"end":{"line":6,"column":34}}}) : helper)))
    + "\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"jatoIcon") || (depth0 != null ? lookupProperty(depth0,"jatoIcon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"jatoIcon","hash":{},"loc":{"start":{"line":6,"column":41},"end":{"line":6,"column":53}}}) : helper)))
    + "\" class=\"csui-node-type-icon csui-node-type-jato-icon\" type=\"raw\"></otc-icon>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"mainIconName") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"loc":{"start":{"line":8,"column":0},"end":{"line":14,"column":7}}})) != null ? stack1 : "");
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"colorTheme":(depth0 != null ? lookupProperty(depth0,"colorTheme") : depth0),"size":(depth0 != null ? lookupProperty(depth0,"size") : depth0),"iconName":(depth0 != null ? lookupProperty(depth0,"mainIconName") : depth0)},"loc":{"start":{"line":9,"column":2},"end":{"line":9,"column":70}}})) != null ? stack1 : "")
    + "\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"mainClassName") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"loc":{"start":{"line":11,"column":2},"end":{"line":13,"column":9}}})) != null ? stack1 : "");
},"9":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"csui-node-type-icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mainClassName") || (depth0 != null ? lookupProperty(depth0,"mainClassName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mainClassName","hash":{},"loc":{"start":{"line":12,"column":37},"end":{"line":12,"column":54}}}) : helper)))
    + "\"></span>\n";
},"11":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"overlayIconNames") : depth0),{"name":"each","hash":{},"fn":container.program(12, data, 0, blockParams, depths),"inverse":container.noop,"loc":{"start":{"line":17,"column":2},"end":{"line":19,"column":11}}})) != null ? stack1 : "");
},"12":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"size":(depths[1] != null ? lookupProperty(depths[1],"size") : depths[1]),"iconName":depth0},"loc":{"start":{"line":18,"column":4},"end":{"line":18,"column":45}}})) != null ? stack1 : "")
    + "\n";
},"14":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"overlayClassNames") : depth0),{"name":"each","hash":{},"fn":container.program(15, data, 0),"inverse":container.noop,"loc":{"start":{"line":21,"column":2},"end":{"line":23,"column":11}}})) != null ? stack1 : "");
},"15":function(container,depth0,helpers,partials,data) {
    return "    <span class=\""
    + container.escapeExpression(container.lambda(depth0, depth0))
    + "\"></span>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"imageUrl") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":4,"column":7}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"jatoIcon") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.program(5, data, 0, blockParams, depths),"loc":{"start":{"line":5,"column":0},"end":{"line":15,"column":7}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"overlayIconNames") : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0, blockParams, depths),"inverse":container.program(14, data, 0, blockParams, depths),"loc":{"start":{"line":16,"column":0},"end":{"line":24,"column":7}}})) != null ? stack1 : "");
},"useDepths":true});
Handlebars.registerPartial('csui_controls_node-type.icon_node-type.icon', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/controls/node-type.icon/impl/node-type.icon.view',[],function(){});

csui.define('csui/controls/node-type.icon/node-type.icon.view',['module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/log',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/nodesprites',
  'csui/utils/url',
  'csui/controls/node-type.icon/node-type.icon.view.ext',
  'smart/themes/theming',
  'i18n!csui/controls/node-type.icon/impl/nls/lang',
  'hbs!csui/controls/node-type.icon/node-type.icon',
  'csui/controls/icons.v2',
  'css!csui/controls/node-type.icon/impl/node-type.icon.view',
  'csui/lib/jquery.binary.ajax',
  'csui/lib/handlebars.helpers.xif'
], function (module, _, $, Log, Backbone, Marionette,
    nodeSpriteCollection,
    Url,
    NodeTypeIconViewExtension,
    theming,
    lang,
    template,
    iconRegistry
) {
  'use strict';

  var log = new Log(module.id);

  function startsWith(text,start) {
    return text ? text.lastIndexOf(start,0)===0 : false;
  }

  // transparent gif for use as placeholder
  var dummySrc = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";

  var config = module.config() || {};
  var excludedShortcutTypes = config.excludedShortcutTypes || [];
  if (!_.isArray(excludedShortcutTypes)) {
    excludedShortcutTypes = Array.prototype.concat.apply([], _.values(excludedShortcutTypes));
  }

  var NodeTypeIconModel = Backbone.Model.extend({
    constructor: function NodeTypeIconModel(attributes, options) {
      options || (options = {});
      this.node = options.node;
      this.options = options;

      this._useIconwithColorSchema = !!options.colorTheme;

      attributes || (attributes = {});
      _.extend(attributes, this._getAttributes());

      NodeTypeIconModel.__super__.constructor.call(this, attributes, options);

      this.listenTo(this.node, 'change:id', this._updateModelFromNode)
          .listenTo(this.node, 'change:type', this._updateModelFromNode)
          .listenTo(this.node, 'change:size', this._updateModelFromNode)
          .listenTo(this.node, 'change:image_url', this._updateModelFromNode);
      if (this.node.imageAttribute && this.node.imageAttribute!=='image_url') {
        this.listenTo(this.node, 'change:'+this.node.imageAttribute, this._updateModelFromNode);
      }

      if(this?.options?.originatingView?.collection) {
        // Support for rendering node type icon view based on size.
        // when the current collection size has updates, re-render the node type icon view as it
        // may have different visual icons to render based on the size.
        this.listenTo(this.options.originatingView.collection, "change update", _.bind(function () {
          let coll     = this.options.originatingView.collection,
              nodeSize = 0;
          if (coll.length > 0) {
            // in case, while adding a new item, by default it won't have id as we create dummy
            // model at front end, and in this case collection length will be there but actually
            // there will be no actual models exists with-in it.
            if (coll.length > 1 || (coll.length === 1 && coll.models[0].get('id'))) {
              nodeSize = coll.length;
            }
          }
          this.node.set("size", nodeSize);
        }, this));
      }
    },

    _getAttributes: function () {
      var node = this.node,
          original = node.original,
          exactNodeSprite = this.options.nodeSprite || nodeSpriteCollection.findByNode(node) || {},
          exactClassName = exactNodeSprite.get('className'),
          withColorSchemaIconName = exactNodeSprite.get('withColorSchemaIconName'),
          exactIconName = this._useIconwithColorSchema ?
                          (withColorSchemaIconName ? withColorSchemaIconName :
                           exactNodeSprite.get('iconName')) :
                          exactNodeSprite.get('iconName'),
          mainClassName = exactClassName,
          mainIconName = exactIconName,
          jatoIcon,
          displayThumbnail = this.options.displayThumbnailIcon !== false,
          overlayClassNames = [],
          overlayIconNames = [];
      var mimeTypeFromNodeSprite;
      if (theming.isJATOTheme() && exactNodeSprite.get('jatoIcon')) {
        jatoIcon = exactNodeSprite.get('jatoIcon');
      }
      if (exactNodeSprite.attributes) {
        mimeTypeFromNodeSprite = exactNodeSprite.get('mimeType');
      }
      // prefer the title mapped by mimetype entries in nodeSpriteCollection
      var title = this.options.title || mimeTypeFromNodeSprite || node.get("type_name") || node.get("type");

      // If the node is shortcut, find the icon data for the original node
      // and add append an overlay CSS class for a small arrow icon.

      // Note: For MicroPost(Comments and Replies), do not consider
      // original node, show their respective icon

      // Note2: since the RestAPI at the moment does not return the document version, showing the
      // latest document mime-type icon with the shortcut overlay is incorrect.  Use the
      // generation icon  for now.  When the RestAPI and UI supports Generation, switch this to
      // generation-overlay.

      if (original && original.get('id') && _.indexOf(excludedShortcutTypes, node.get("type")) ===
          -1) {
        var originalNodeSprite = nodeSpriteCollection.findByNode(original) || {};
        mainClassName = originalNodeSprite.get('className');
        withColorSchemaIconName = originalNodeSprite.get('withColorSchemaIconName');
        mainIconName = this._useIconwithColorSchema ?
                       (withColorSchemaIconName ? withColorSchemaIconName :
                        originalNodeSprite.get('iconName')) :
                       originalNodeSprite.get('iconName');
        //Sets the original mime type icon for a shortcut in JATO Theme.
        const jatoIconFromSprite = originalNodeSprite.get('jatoIcon');
        jatoIcon = theming.isJATOTheme() && jatoIconFromSprite ? jatoIconFromSprite : undefined;
        overlayClassNames.push('csui-icon');
        title = _.str.sformat(lang.shortcutTypeLabel,
          originalNodeSprite.get('mimeType') || original.get("type_name") ||
          lang.nodeTypeUnknown);
        if(node.get("type") === 2){
        //for generation
          title = _.str.sformat(lang.generationTypeLabel,
            originalNodeSprite.get('mimeType') || original.get("type_name") ||
            lang.nodeTypeUnknown);
          overlayClassNames.push('csui-icon csui-icon-generation-overlay');
          overlayIconNames.push('csui_generation-overlay');
        }else if (this._useIconwithColorSchema) {
          overlayClassNames.push('csui-icon csui-icon-shortcut-overlay');
          overlayIconNames.push('csui_colorschema_shortcut-overlay');
        } else {
          overlayClassNames.push('csui-icon csui-icon-shortcut-overlay');
          overlayIconNames.push('csui_shortcut-overlay');
        }
      }

      var attributes = {
        imageUrl: displayThumbnail && makeAbsolute(node.get(node.imageAttribute||"image_url"),node.connector),
        title: title
      };
      if(original?.get('image_url')){
        const imageUrl = original.get('image_url');
        attributes.imageUrl =  displayThumbnail && makeAbsolute(imageUrl,node.connector);
      }  
      // add attributes from options
      _.extend(attributes, _.pick(this.options, ['size', 'jatoIconSize']));
      if (this._useIconwithColorSchema) {
        _.extend(attributes, _.pick(this.options, 'colorTheme'));
      } else {
        _.extend(attributes, _.pick(this.options, 'filter'));
      }
      if (this.options.selectable === false) {
        !this.options?.hideUnselectableOverlay && overlayIconNames.push('csui_nonselectable-overlay');
      }

      // prefer SVGs
      if (exactIconName) {
        attributes.iconName = exactIconName;
        if (mainIconName) {
          attributes.mainIconName = mainIconName;
        } else {
          attributes.mainClassName = mainClassName;
        }
        if (overlayIconNames.length > 0) {
          attributes.overlayIconNames = overlayIconNames;
        } else {
          attributes.overlayClassNames = overlayClassNames;
        }
      } else {
        attributes.className = exactClassName;
        attributes.mainClassName = mainClassName;
        attributes.overlayClassNames = overlayClassNames;
      }

      if (jatoIcon) {
        attributes.jatoIcon = jatoIcon;
        attributes.jatoIconSize = this.options.jatoIconSize ?? 24;
      }

      return attributes;
    },

    _updateModelFromNode: function () {
      this.clear({silent: true});
      this.set(this._getAttributes());
    }
  });

  var NodeTypeIconView = Marionette.ItemView.extend({
    tagName: 'span',

    attributes: function () {
      var title = this.model.get('title');
      var cssClass = 'csui-icon-group';
      var size = this.model.get('size');
      if (size) {
        var sizeClass = iconRegistry.getClassForSize({size: size});
        cssClass += ' ' + sizeClass;
      }
      return {
        'class': cssClass,
        'title': title
      };
    },

    template: template,

    ui: {
      imageElement: '.csui-node-type-image',
      iconElement: '.csui-node-type-icon'
    },

    constructor: function NodeTypeIconView(options) {
      options || (options = {});
      if (!options.model) {
        this.ownModel = true;
        options.model = new NodeTypeIconModel(undefined, options);
      }

      NodeTypeIconView.__super__.constructor.call(this, options);

      // Passing the el to the ctor prevents creating an own el, including
      // setting its attributes.  The caller must ensure the right tag.
      if (options.el) {
        $(options.el).attr(_.result(this, 'attributes'));
      }

      this.listenTo(this.model, 'change', this.render);
    },

    attachElContent: function() {
      var result = Marionette.ItemView.prototype.attachElContent.apply(this,arguments);
      if (this.model.attributes.mainIconName) {
        this.$(".csui-icon-v2__"+this.model.attributes.mainIconName).addClass("csui-node-type-icon");
      }
      return result;
    },

    onRender: function () {
      this._updateTitle();
      var imageElement = this.ui.imageElement;
      if (imageElement.length > 0) {
        var imageUrl = this.model.get("imageUrl");
        if (imageUrl) {
          var absoluteUrl = this.ownModel ? imageUrl : makeAbsolute(imageUrl, this.options.node.connector);
          imageElement.on("load", imageDone.bind(this, absoluteUrl)).on("error", imageDone.bind(this, null));
          if (setImgUrl.call(this, imageElement[0], absoluteUrl, this.options.node.connector)) {
            // to reduce flickering make image visible immediately, regardless of cache state.
            // but don't remove icon now to be able to switch to icon later in error case.
            switchToImage.call(this);
          } else {
            // an ajax call is initiated. while image data is not yet available show icon or dummy url.
            if (this.ui.iconElement.length > 0) {
              switchToIcon.call(this);
            } else {
              imageElement[0].src = dummySrc;
            }
          }
        }
      }
    },

    onDestroy: function () {
      if (this.ownModel) {
        this.model.stopListening();
      }
      if (this.objUrl) {
        URL.revokeObjectURL(this.objUrl);
      }
    },

    _updateTitle: function () {
      var title = this.model.get('title');
      this.$el
          .attr('title', title);
    }
  });

  /**
   * Make absolute url using connection in connector.
   *
   * @param {*} imageUrl the image url to set as src for the img element.
   * @param {*} connector the connector to get the cgi script.
   * @returns absolute url
   */
  function makeAbsolute(imageUrl,connector) {
    if (imageUrl && connector) {
      if (!startsWith(imageUrl,'data:') && !startsWith(imageUrl,'blob:') && !new Url(imageUrl).isAbsolute()) {
        var connectUrl = connector.getConnectionUrl();
        if (startsWith(imageUrl,'/')) {
          return Url.combine(connectUrl.getOrigin(), imageUrl);
        } else {
          return Url.combine(connectUrl.getCgiScript(), imageUrl);
        }
      }
    }
    return imageUrl;
  }

  /**
   * Check if ajax call is needed to get the image (i.e. url contains the cgi script).
   * @param {*} absoluteUrl the image url to check.
   * @param {*} connector the connector to get the cgi script.
   * @returns true if ajax call is needed, false otherwise.
   */
  function needsAjax(absoluteUrl, connector) {
    if (absoluteUrl && connector) {
      if (startsWith(absoluteUrl, 'data:') || startsWith(absoluteUrl, 'blob:')) {
        return false;
      }
      return NodeTypeIconViewExtension.needsAjax.call(this, absoluteUrl);
    }
  }

  function callAjax(absoluteUrl,connector,callback) {
    connector.makeAjaxCall({
      url: absoluteUrl,
      dataType: 'binary',
      connection: connector.connection
    }).always(function (response, statusText, jqxhr) {
      if (jqxhr.status === 200) {
        callback(true,response);
      } else{
        callback(false);
      }
    });
  }

  function imageDone(url) {
    if (this.ui.imageElement.length>0) {
      var img = this.ui.imageElement[0];
      if (url) {
        // show image and remove icon if image is the final one.
        switchToImage.call(this,img.src!==dummySrc||url===dummySrc);
      } else {
        // switch to icon in error case.
        switchToIcon.call(this);
      }
    }
  }

  function switchToImage(removeIcon) {
    if (this.ui.imageElement.length>0) {
      this.ui.imageElement.removeClass('binf-hidden');
      if (removeIcon) {
        this.ui.iconElement.remove();
        this.ui.iconElement = $();
      } else {
        this.ui.iconElement.addClass('binf-hidden');
      }
    }
  }

  function switchToIcon() {
    if (this.ui.iconElement.length>0) {
      this.ui.iconElement.removeClass('binf-hidden');
      this.ui.imageElement.addClass('binf-hidden');
    }
  }

  function setImgUrl(img, url, connector) {
    $(img).on('error', function () {
      var logurl = img.src.length > 200 ? img.src.substring(0, 200) + "..." : img.src;
      log.error("error loading image: {0}", logurl) && console.log(log.last);
    });
    if (needsAjax.call(this, url, connector)) {
      // url needs an ajax call to get the image data. do the call.
      callAjax(url, connector, (ok, response) => {
        if (ok) {
          this.objUrl && URL.revokeObjectURL(this.objUrl);
          this.objUrl = URL.createObjectURL(response);
          img.src = this.objUrl;
        } else {
          $(img).trigger("error");
        }
      });
    } else {
      // url can be loaded by browser itself. just set it.
      img.src = url;
      return {
        //cached: img.complete || startsWith(img.src,'data:') || startsWith(img.src,'blob:'),
        url: img.src
      };
    }
  }

  return NodeTypeIconView;
});


csui.define('csui/controls/globalmessage/globalmessage',['module', 'nuc/lib/underscore', 'smart/controls/globalmessage/globalmessage',
  'smart/controls/progresspanel/progresspanel',
  'csui/controls/globalmessage/progresspanel.view.ext',
  'csui/controls/globalmessage/message.dialog.mixin',
  'csui/utils/nodesprites',
  'csui/controls/node-type.icon/node-type.icon.view',
], function (module, _, SmartGlobalMessage, SmartProgressPanel, csuiProgressPanelView,
    MessageDialogMixin, NodeSprites, NodeTypeIconView) {
  'use strict';
  var panelConfig = window.csui.require.s.contexts._.config.config["csui/controls/globalmessage/progresspanel.view.ext"] ||
      {},
      progressbarConfig = window.csui.require.s.contexts._.config.config["csui/controls/globalmessage/progressbar.view.ext"] ||
          {},

      config = _.defaults(module.config(), panelConfig.csui, progressbarConfig.csui, {
        // To show gotoLocation & progress bar for each item), make 'enhance panel' true.(LPAD-84852)
        enhancePanel: false
      });
  var collectionUpdate = function (col) {
        col.forEach(function (model) {
          if (!!model.node && model.node.get('mime_type') === undefined) {
            model.node.set({
              container: false,
              type: model.node.get('type') !== undefined ?
                    model.node.get('type') : model.get('type') !== undefined ?
                                             model.get('type') : 144,
              mime_type: model.get('mime_type') || model.get('type')
            }, {silent: true});
          }
          // Sending iconView to SmartControl's global message using NodeTypeIconView.
          // Having both NodeTypeIconView and NodeSprites is not required but as a safer side,
          // setting both of them in model attributes as anyway SmartControl's global message
          // considers only iconView (NodeTypeIconView) and typeIconClass can be used as fallback.
          model?.node &&  model.set({
            'typeIconClass': NodeSprites.findClassByNode(model?.node),
            'iconView': new NodeTypeIconView({node: model?.node, size: 'small'}),
          }, {silent: true});
        });
      },
      GlobalMessage = _.extend({...SmartGlobalMessage}, {
        setProgresspanelMessageRegionView: _.bind(
            SmartProgressPanel.setProgresspanelMessageRegionView, SmartProgressPanel),
        setFileUploadCollection: _.bind(SmartProgressPanel.setFileUploadCollection,
            SmartProgressPanel),
        showFileUploadProgress: _.bind(SmartProgressPanel.showFileUploadProgress,
            SmartProgressPanel),
        hideFileUploadProgress: _.bind(SmartProgressPanel.hideFileUploadProgress,
            SmartProgressPanel),
        showProgressPanel: function (collection, opts) {
          var optns = _.extend(opts,
              {ProgressPanelview: csuiProgressPanelView, configOptions: config});
          collectionUpdate(collection);
          _.bind(SmartProgressPanel.showProgressPanel, SmartProgressPanel, collection, optns)();
        },
        isActionInProgress: _.bind(SmartProgressPanel.isActionInProgress, SmartProgressPanel),
        showPermissionApplyingProgress: _.bind(SmartProgressPanel.showPermissionApplyingProgress,
            SmartProgressPanel),
        showLoader: _.bind(SmartProgressPanel.showLoader, SmartProgressPanel),
        changeLoaderMessage: _.bind(SmartProgressPanel.changeLoaderMessage, SmartProgressPanel),
        showMessage: function (info, text, details, options) {
          var optns = _.extend(options || {},
              {configOptions: config, MessageDialogMixin});
          _.bind(SmartGlobalMessage.showMessage, SmartGlobalMessage, info, text, details, optns)();
        }
      });

  return GlobalMessage;

});


csui.define('csui/behaviors/default.action/impl/command',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/log', 'csui/utils/commands', 'csui/controls/globalmessage/globalmessage',
  'csui/utils/commandhelper'
], function (module, _, $, Backbone, log, commands, GlobalMessage, CommandHelper) {
  'use strict';

  log = log(module.id);

  function CommandController(options) {
    options || (options = {});
    this.commands = options.commands || commands;
  }

  _.extend(CommandController.prototype, {

    executeAction: function (action, status, options) {
      var signature = action.get("signature"),
          command   = this.commands.findWhere({signature: signature});
      try {
        if (!command) {
          throw new Error('Invalid command: ' + signature);
        }
        var promises = command.execute(status, options);
        if (!_.isArray(promises)) {
          promises = [promises];
        }
        return $.when
            .apply($, promises)
            .fail(function (error) {
              if (error) {
                if (!CommandHelper.showOfflineMessage(error)) {
                  if (!error.message) {
                    // The developer of the command has to fix this
                    log.warn('Command ' + signature + ' did not throw error as object.' );
                  }
                  GlobalMessage.showMessage('error', error.message ? error.message : error);
                }
              }
            });
      } catch (error) {
        log.warn('Executing the command "{0}" failed.\n{1}',
        !!command && command.get('signature'), error.stack) && console.warn(log.last);
      }
    }
  });

  CommandController.extend = Backbone.View.extend;

  return CommandController;

});


csui.define('csui/behaviors/default.action/impl/defaultaction',[
  'module', 'csui/lib/underscore', 'csui/behaviors/default.action/impl/command',
  'csui/models/nodes', 'csui/utils/defaultactionitems', 'csui/utils/log'
], function (module, _, CommandController, NodeCollection, defaultActionItems, log) {
  'use strict';

  log = log(module.id);

  var DefaultActionController = CommandController.extend({

    constructor: function DefaultActionController(options) {
      CommandController.prototype.constructor.apply(this, arguments);
      options || (options = {});
      this.actionItems = options.actionItems || defaultActionItems;
    },

    executeAction: function (node, options) {
      // Apply the default action always to the shortcut target;
      // the original node reference must be expanded.
      var shortcut, fakedActions;
      const isGeneration = (node.get('type') === 2);
      if (node.original && node.original.get('id') > 0) {
        shortcut = node;
        fakedActions = this._fakeActions(node.original);
        // Do not switch to original for generations. Commands have to
        // handle them themselves, until we support them properly.
        if (isGeneration || (node.get('type') === 1)) {
          node = node.original;
        }
        if(isGeneration){
          node.get('version_number') ?? node.set('version_number',(shortcut.get('version_number') || shortcut.get('data')?.generation?.version_number));
        }
      }
      var action = this.getAction(node),
          status = {
            nodes: new NodeCollection([node]),
            shortcut: shortcut,
            collection: options?.collection,
            isGeneration
          };
      if (fakedActions) {
        this._resetFakedActions(node);
      }
      return action && CommandController.prototype.executeAction.call(
              this, action, status, options);
    },

    getAction: function (node) {
      // Check the default action always against the shortcut or generation
      // target; the original node reference must be expanded.
      var type = node.get('type'),
          shortcut, fakedActions;
      if ((type === 1 || type === 2) && node.original && node.original.isFetchable()) {
        shortcut = node;
        node = node.original;
        fakedActions = this._fakeActions(node);
      }
      var status = {
            nodes: new NodeCollection([node]),
            shortcut: shortcut
          },
          // Do not search for the first action, which is assigned
          // to the object and its command is enabled; as soon as
          // the first action for the object is found, the result
          // of its command enabling is returned.
          // TODO: Reconsider using the first enabled command again.
          // Disabling a node shoudl be done by a special feature
          // and not by disabling all default actions.
          enabled = false,
          action = this.actionItems.find(function (actionItem) {
            if (actionItem.enabled(node)) {
              var command = this.commands.findWhere({
                signature: actionItem.get("signature")
              });
              try {
                enabled = command && command.enabled(status);
              } catch (error) {
                log.warn('Evaluating the command "{0}" failed.\n{1}',
                    command.get('signature'), error.stack) && console.warn(log.last);
              }
              // Stop enumeration after the first action was found,
              // which can handle the specified node
              return true;
            }
          }, this);
      if (fakedActions) {
        this._resetFakedActions(node);
      }
      return enabled && action;
    },

    hasAction: function (node) {
      return !!this.getAction(node);
    },

    // Core REST API does not provide permitted actions for shortcut
    // originals. We always allow clicks on them and let the user
    // watch how the operation fails, when they have no permission.

    _fakeActions: function (node) {
      if (!node.actions.length) {
        var actions = _.map(
            this.actionItems.getAllCommandSignatures(this.commands),
            function (signature) {
              return {signature: signature};
            });
        node.actions.reset(actions, {silent: true});
        return true;
      }
    },

    _resetFakedActions: function (node) {
      node.actions.reset([], {silent: true});
    }

  });

  DefaultActionController.version = "1.0";

  return DefaultActionController;

});


// Loads widgets and exposes a promise with the result status on the view
csui.define('csui/behaviors/default.action/default.action.behavior',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/utils/url', 'csui/utils/log',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/search.formquery.factory',
  'csui/behaviors/default.action/impl/defaultaction',
  'csui/utils/node.links/node.links'
], function (module, _, $, Backbone, Marionette, Url, log,
    NextNodeModelFactory, SearchQueryModelFactory, SearchFormModelFactory, DefaultActionController,
    nodeLinks) {
  'use strict';

  log = log(module.id);

  var DefaultActionBehavior = Marionette.Behavior.extend({
    constructor: function DefaultActionBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      var context = view.options.context;
      this.view = view;
      this._nextNode = context && context.getModel(NextNodeModelFactory);
      this._searchQuery = context && context.getModel(SearchQueryModelFactory);
      this._searchForm = context && context.getModel(SearchFormModelFactory);
      view.defaultActionController = this.options.defaultActionController ||
                                     new DefaultActionController();
    },

    onExecuteDefaultAction: function (node, options = {}) {
      // Support triggering by the `triggers` object, where the view is
      // passed by Marionette as the first parameter and there are no options
      if (node instanceof Backbone.View) {
        node = node.model;
      }
      var action = this.view.defaultActionController.getAction(node);
      if (action) {
        this.view.defaultActionController.executeAction(node, {
          context: this.view.options.context,
          // sometimes current view may not be the originating view,
          // so let's obtain it from options, if not consider current view as originating view.
          originatingView: options.originatingView || this.view
        });
      } else {
        log.can('WARN') && log.warn('No default action was enabled for {0}.',
            JSON.stringify(_.pick(node.attributes, 'name', 'id', 'type'))) &&
        console.warn(log.last);
      }
    }
  }, {
    // TODO: Deprecate this method.
    getDefaultActionNodeUrl: function (node) {
      var url = nodeLinks.getUrl(node),
          hash = url.lastIndexOf('#');
      // This disallows using the hash part, when the slash-based routing is enabled.
      // But it shoudl be no problem, because this method is not used in new scenaros
      // any more and it didn't offer such contract forn the older ones.
      if (hash >= 0) {
        return url.substr(hash);
      }
      return url;
    }
  });

  return DefaultActionBehavior;
});


csui.define('csui/behaviors/dropdown.menu/dropdown.menu.behavior',['csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/marionette', 'csui/utils/base'
], function ($, _, Marionette, base) {
  'use strict';

  var DropdownMenuBehavior = Marionette.Behavior.extend({

    ui: {
      dropdownMenu: '.binf-dropdown',
    },

    events: {
      'show.binf.dropdown': 'onShowDropdownRefilterMenuItems',
      'keydown': 'onKeyInMenuView',
      'keyup': 'onKeyUpMenuView'
    },

    constructor: function DropdownMenuBehavior(options, view) {
      options = _.defaults(options, {refilterOnShow: true});
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.view = view;
      this.view.dropdownMenuBehavior = this;
      this.listenTo(this, 'refresh:dropdown', this.onDomRefresh);
    },

    onRender: function() {
      this.onDomRefresh();
    },

    onDomRefresh: function() {
      this.$dropdown = this.$el;
      if (this.options.dropdownSelector) {
        this.$dropdown = this.$el.find(this.options.dropdownSelector);
      }
      this.$dropdownToggle = this.$dropdown.find('.binf-dropdown-toggle');
    },

    onShowDropdownRefilterMenuItems: function () {
      this.options.refilterOnShow && this.view.options.collection.refilter && this.view.options.collection.refilter();
    },

    onKeyUpMenuView: function (event) {
      // Firefox: a known issue that Space key may not work correctly.
      // Our Bootstrap version is old. Link below discusses the problem and suggests moving to v4:
      //  https://github.com/twbs/bootstrap/issues/20303
      // Bootstrap v4 fix: https://github.com/twbs/bootstrap/issues/21159
      // Fix link: https://github.com/twbs/bootstrap/pull/21535
      // Code diff link: https://github.com/twbs/bootstrap/pull/21535/files
      // V4 dropdown code is too different to backport the fix.
      if (base.isFirefox()) {
        // We are still using the older Bootstrap code in our Binf.
        // Suppress extra event on Space keyup for Firefox (Chrome and IE11 don't fire extra event).
        if (event.keyCode === 32) {
          event.preventDefault();
          event.stopPropagation();
        }
      }

      // Modal dialog view is listening to 'keyup' event, close the menu but not Modal dialog
      if (event.keyCode === 27) {
        this._closeMenu(event);
      }
    },

    onKeyInMenuView: function (event) {
      const originEventType = event?.type;
      // note: arrow up/down is handled by Bootstrap dropdown::keydown() with role=menu
      switch (event.keyCode) {
      case 9: // tab
        this._closeMenu();  // just close menu and don't pass in event so that focus can move on
        break;
      case 13:  // enter
        event.stopPropagation();
        //LPAD-87935 - when we trigger click in FF manually, it enforces limitations on some features
        //due to security risks. To make the features accessible atleast through ENTER key , letting the
        //browser run default handling on ENTER key down.
        if(!base.isFirefox()) {
          event.preventDefault();
          $(event.target).trigger('click', originEventType);
        }
        break;
      case 32:  // space
        event.preventDefault();
        event.stopPropagation();
        $(event.target).trigger('click', originEventType);
        break;
      case 27:  // escape
        // menu is checked for open and will be closed in the 'keyup' event method above
        if (this.$dropdown.hasClass('binf-open') || this.ui.dropdownMenu.hasClass('binf-open')) {
          // if menu is open, stop the event so that parent views do not get this keydown event
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      }
    },

    _closeMenu: function (event) {
      if (this.$dropdown.hasClass('binf-open') || this.ui.dropdownMenu.hasClass('binf-open')) {
        // the event is handled here for closing the menu, prevent default and stop propagating the
        // event to parents
        event && event.preventDefault();
        event && event.stopPropagation();
        this.$dropdownToggle.binf_dropdown('toggle');
        this.$dropdownToggle.trigger('focus');
      }
    }

  });

  return DropdownMenuBehavior;

});


csui.define('csui/behaviors/keyboard.navigation/retainfocus.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/utils/log',
  'csui/lib/marionette'
], function (module, _, $,
    log,
    Marionette) {
  'use strict';

  var RetainFocusBehavior = Marionette.Behavior.extend({

        ui: {
          control: '.csui-control'
        },

        events: {
          'mousedown @ui.control': '_startActive',
          'focusout @ui.control': '_stopActive',
          'keydown @ui.control': '_stopActive'
        },

        constructor: function RetainFocusBehavior(options, view) {
          Marionette.Behavior.prototype.constructor.apply(this, arguments);

          this._isFocused = false;

          this.listenTo(view, 'before:render', function () {
            this._isRendering = true;
            if (view.isRendered) {
              // check focus only when re-rendered
              var controlEl = this.ui.control[0];
              this._isFocused = document.activeElement === controlEl;
            }
          });

          this.listenTo(view, 'render', function () {
            this._isRendering = false;
          });

          this.listenTo(view, 'dom:refresh', function () {
            this._reApplyFocus();
          });

        },

        _reApplyFocus: function () {
          if (this._isActive) {
            this.ui.control.addClass('csui-control-active');
          } else {
            this.ui.control.removeClass('csui-control-active');
          }
          if (this._isFocused) {
            this.ui.control.trigger('focus');
          }
        },

        _startActive: function () {
          this._isActive = true;
          this.ui.control.addClass('csui-control-active');
        },

        _stopActive: function () {
          if (!this._isRendering) {
            this.ui.control.removeClass('csui-control-active');
            this._isActive = false;
          }
        }

      },
      {
        // static methods:
      }
  );

  return RetainFocusBehavior;
});


csui.define('csui/behaviors/keyboard.navigation/tabables.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/utils/log', 'csui/utils/base'
], function (module, _, $, Marionette, log, base) {
  'use strict';

  log = log(module.id);

  // Default static options for the behaviour object
  var config = module.config();

  var accessibilityRegionClass = 'csui-acc-tab-region';
  var accessibilityActiveRegionClass = 'csui-acc-tab-region-active';

  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.

  // This behavior implements a controller for one or more views with the tabable.region.behavior
  // applied.
  var TabablesBehavior = Marionette.Behavior.extend({

        constructor: function TabablesBehavior(options, view) {
          Marionette.Behavior.prototype.constructor.apply(this, arguments);

          var self = this;

          this.view = view;
          this._pushTabableHandler();

          this.tabableRegions = [];
          this.mustSortTabableRegions = false;

          // Backbone/Marionette events (are removed in destroy)
          this.listenTo(view, 'render', this._registerEventHandlers);
          this.listenTo(view, 'destroy', this._popTabableHandler);
          this.listenTo(view, 'dom:refresh', this.setFocusInActiveTabableRegion);

          //In order to prevent tab from going outside a contained area (i.e. dialog),
          //keydown is monitored on the behavioral view. The event listener will only prevent
          //tab outside the behavior view if parameter "containTabFocus' is set to true.
          // LPAD-54770, Make sure that keydown event is registered only once after view creation
          setTimeout(function () {
            view.$el.on('keydown.csui-tabables', function (event) {
              if (event.keyCode === 9 && getOption.call(self, 'containTabFocus')) {
                return self._maintainTabFocus(event);
              }
            });
          });

          //Used for cases where focus should be removed from the active behavior region
          //and placed in the text focusable region. For example when 'escape' is used to
          //to move focus outside of a textbox area to the next tabable region.
          this.listenTo(view, 'changed:focus', this._setFocusToNextRegion);
          this.listenTo(view, 'switch:view', function () {
            TabablesBehavior.switchViewDialog();
          });
        }, // constructor

        registerTabableRegion: function (tabableRegion) {
          if ($.contains(this.view.el, tabableRegion.view.el)) {
            this.unregisterTabableRegionBehavior(tabableRegion);
            this.tabableRegions.push(tabableRegion);
            this.mustSortTabableRegions = true;
            return true;
          } else {
            log.debug('registerTabableRegion: not registering non descendant view ' +
                      tabableRegion.view.constructor.name) &&
            console.log(log.last);
            return false;
          }
        },

        unregisterTabableRegionBehavior: function (tabableRegion) {
          if (tabableRegion) {
            if (_.contains(this.tabableRegions, tabableRegion)) {
              // remove that tabableRegionBehavior from the tabableRegions array
              log.debug('unregisterTabableRegion for view' + tabableRegion.view.constructor.name) &&
              console.log(log.last);

              this.tabableRegions = _.reject(this.tabableRegions,
                  function (trb) { return trb === tabableRegion; });

              // log.debug("Unsorted tabable regions:") && console.log(log.last);
              // _.each(this.tabableRegions, function (tabableRegionBehavior) {
              //   log.debug(" " + tabableRegionBehavior.view.constructor.name) &&
              //   console.log(log.last);
              // });

            }
          }
        },

        _pushTabableHandler: function () {
          log.debug('_pushTabableHandler in view ' + this.view.constructor.name) &&
          console.log(log.last);
          if (TabablesBehavior.tabablesHandlers.length > 0) {
            var topTabablesHandler = _.last(TabablesBehavior.tabablesHandlers);

            /*
                        var activeIdx = this._getActiveIndex();
                        if (activeIdx !== undefined) {
                          this.activeTabableRegionIndexBeforePush = activeIdx;
                          var activeTabableRegion = this.tabableRegions[activeIdx];
                          this.focusedElementBeforePush = activeTabableRegion.getCurrentlyFocusedElementFromView();
                        } else {
                          delete this.focusedElementBeforePush;
                          delete this.activeTabableRegionIndexBeforePush;
                        }
            */

            // invalidate all tabindexes in the current tabable regions before adding the new
            // "layer" of tabable regions at the top of the stack.
            // This prevents navigating by tab to any of this tabable regions.
            _.each(topTabablesHandler.tabableRegions, function (tabableRegion) {
              tabableRegion._unregisterEventHandlers.call(tabableRegion);
              topTabablesHandler._clearTabIndexes.call(topTabablesHandler, tabableRegion.view);
            }, this);

          }
          TabablesBehavior.tabablesHandlers.push(this);

          // log.debug("Tabables after Push:");
          // _.each(TabablesBehavior.tabablesHandlers, function (tabableHandler) {
          //   log.debug("    TabablesBehavior of view " + tabableHandler.view.constructor.name);
          // });
        },

        _popTabableHandler: function () {
          if (TabablesBehavior.tabablesHandlers.length > 0) {

            var tabableHandlerToPop = _.last(TabablesBehavior.tabablesHandlers);

            log.debug('_popTabableHandler in view ' + tabableHandlerToPop.view.constructor.name) &&
            console.log(log.last);

            _.each(tabableHandlerToPop.tabableRegions, function (tabableRegion) {
              tabableRegion._unregisterEventHandlers.call(tabableRegion);
            });

            // LPAD-54770. Remove keydown listener
            tabableHandlerToPop.view.$el.off('keydown.csui-tabables');

            tabableHandlerToPop.stopListening(tabableHandlerToPop.view);
            TabablesBehavior.tabablesHandlers.pop();

            // after removing the tabables handler from the stack let the tabable regions, that
            // are now on top of the stack re-set its tabindex values to make it keyboard
            // navigable again
            if (TabablesBehavior.tabablesHandlers.length > 0) {
              var topTabableHandler = _.last(TabablesBehavior.tabablesHandlers);
              _.each(topTabableHandler.tabableRegions, function (tabableRegion) {
                tabableRegion.setInitialTabIndex.call(tabableRegion);
                tabableRegion._registerEventHandlers.call(tabableRegion);
              });

              topTabableHandler._setFocusInActiveTabableRegion();
            }
          }
          // log.debug("Tabables after Pop:") && console.log(log.last);
          // _.each(TabablesBehavior.tabablesHandlers, function (tabableHandler) {
          //   log.debug("    TabablesBehavior of view " + tabableHandler.view.constructor.name) &&
          //   console.log(log.last);
          // });
        },

        _sortTabableRegions: function () {
          var tabableRegions = this.tabableRegions;
          var sortedTabableRegions = [];
          var tabableRegionElements = this.view.$el.find('.' + accessibilityRegionClass);
          tabableRegionElements.each(function (index, el) {
            var trb = _.find(tabableRegions, function (tabableRegion) {
              return tabableRegion.view.el === el;
            });
            if (trb) {
              sortedTabableRegions.push(trb);
            }
          });
          this.tabableRegions = sortedTabableRegions;
          this.mustSortTabableRegions = false;

          // log.debug("Sorted tabable regions:") && console.log(log.last);
          // _.each(this.tabableRegions, function (tabableRegion) {
          //   log.debug("    " + tabableRegion.view.constructor.name) && console.log(log.last);
          // });
        },

        //Get the next tabable region with an accessible focusable element.
        _getNextActiveRegion: function (shiftTab, recursiveNavigate) {
          var regions = this.tabableRegions, i, tabableRegion;

          // don't select regions for tabable which are hidden.
          regions = _.filter(regions, function (region) {
            return !region.$el.hasClass('binf-hidden');
          });

          var lastIndex   = regions.length - 1,
              activeIndex = this._getActiveIndex(regions);

          if (recursiveNavigate) {
            i = shiftTab ? (activeIndex === 0 ? lastIndex : activeIndex - 1) :
                (activeIndex === lastIndex ? 0 : activeIndex + 1);
          } else {
            i = shiftTab ? (activeIndex === 0 ? 0 : activeIndex - 1) :
                (activeIndex === lastIndex ? lastIndex : activeIndex + 1);
          }

          // return tabableRegion if it has only one tabable element.
          if (regions.length === 1) {
            tabableRegion = regions[0];
            return tabableRegion;
          }

          while (i != activeIndex) {
            tabableRegion = regions[i];
            var elToFocus = tabableRegion.getCurrentlyFocusedElementFromView(shiftTab);
            if (tabableRegion.view.isTabable() && elToFocus &&
                base.isVisibleInWindowViewport(elToFocus)) {
              // Do not focus elements out of the visible viewport rectangle;
              // it brings them to the visible screen, ignoring the absolute
              // positioning or transforms, if they were applied earlier
              return tabableRegion;
            }

            if (shiftTab) {
              if (i === 0) {
                i = recursiveNavigate ? lastIndex : activeIndex;
              }
              else if (i > 0) {
                --i;
              }
            }
            else {
              if (i === lastIndex) {
                i = recursiveNavigate ? 0 : activeIndex;
              }
              else if (i < lastIndex) {
                ++i;
              }
            }
          }
        },
        //Due to cases (like the target browser where regions are added and removed throughout a dialog
        //display) where regions may be placed out of order due to views being dynamically added and removed
        //throughout the life cycle of the parent container, sort order is reset on every index request.
        _getActiveIndex: function (regions) {
          if (this.currentlyActiveTabableRegion) {
            this._sortTabableRegions();
            var currentlyActive = this.currentlyActiveTabableRegion,
              tabableRegions  = this.tabableRegions;
            if (!!regions) {
              tabableRegions = regions;
            }
            for (var i = 0; i < tabableRegions.length; i++) {
              if (currentlyActive.view.cid === tabableRegions[i].view.cid) {
                return i;
              }
            }
          }
        },

        _deactivateCurrentActiveTabableRegion: function () {
          var activeIdx = this._getActiveIndex();

          if (activeIdx !== undefined && !!this.tabableRegions[activeIdx]) {
            this._setCurrentlyActiveTabableRegionInactive(this.tabableRegions[activeIdx]);
          }
          return activeIdx;
        },

        _setCurrentlyActiveTabableRegionInactive: function (tabableRegion) {
            var activeView = tabableRegion.view;
            var tabRegionEl = activeView.$el;

            tabRegionEl.removeClass(accessibilityActiveRegionClass);
            delete this.currentlyActiveTabableRegion;
            if (activeView.accDeactivateTabableRegion) {
              log.debug('deactivating tabable region ' + activeView.constructor.name) &&
              console.log(log.last);

              tabableRegion.ignoreFocusEvents = true;
              activeView.accDeactivateTabableRegion.call(activeView);
              tabableRegion.ignoreFocusEvents = false;
            }
        },

        _setTabableRegionActive: function (tabableRegion, shiftTab) {
          log.debug('activating ' + tabableRegion.view.constructor.name + ' as active tabable' +
                    ' region') && console.log(log.last);

          this._deactivateCurrentActiveTabableRegion();
          tabableRegion.view.$el.addClass(accessibilityActiveRegionClass);
          this.currentlyActiveTabableRegion = tabableRegion;
          if (tabableRegion.view.accActivateTabableRegion) {
            tabableRegion.ignoreFocusEvents = true;
            tabableRegion.view.accActivateTabableRegion.call(tabableRegion.view, shiftTab);
            tabableRegion.ignoreFocusEvents = false;
          }
        },

        _setFocusInActiveTabableRegion: function (shiftTab) {
          if (this.currentlyActiveTabableRegion && 
                document.body.contains(this.currentlyActiveTabableRegion.el)) {
            // this._setTabableRegionActive(this.currentlyActiveTabableRegion);
            this.currentlyActiveTabableRegion.setFocus(shiftTab);
          } else {
            // try to focus on a preferred region if no one is known as the active region, but
            // don't store it as the currently active one. This must be actively done by a
            // tabable region.
            var tabableRegionsByWeight = _.sortBy(this.tabableRegions, function (tabableRegion) {
              return tabableRegion.view.options.initialActivationWeight;
            });
            //var preferredRegion = _.last(tabableRegionsByWeight);

            var preferredRegion;
            tabableRegionsByWeight.reverse().some(function(region) {
              if (!region.options.notSetFocus) {
                preferredRegion = region;
                return true;
              }
            });

            if (preferredRegion && preferredRegion.view.options.initialActivationWeight > 0) {
              log.debug("setFocus: " + preferredRegion.view.constructor.name) && console.log(log.last);
              var didFocus = preferredRegion.setFocus(shiftTab);

              if (didFocus && document.activeElement) {
                if (document.activeElement.tagName === 'BODY') {
                  log.debug("setFocus Failed: " + preferredRegion.view.constructor.name) && console.log(log.last);
                }
                log.debug("document.activeElement: " + document.activeElement.tagName) && console.log(log.last);
              }
            }
          }
        },

        _clearTabIndexes: function (view) {
          // log.debug('_clearTabIndexes in view ' + view.constructor.name) && console.log(log.last);
          // find tabable/focusable elements including the view.$el element
          var focusables = view.$el.find(TabablesBehavior.focusablesSelector).addBack(
              TabablesBehavior.focusablesSelector);
          if (focusables.length) {
            // log.debug('set tabindex=-1 on ' + focusables.length + ' elements') && console.log(log.last);
            focusables.prop('tabindex', -1);
          } else {
            log.debug('_clearTabIndexes: no focusables found in ' + view.constructor.name) &&
            console.log(log.last);
          }
        },

        _maintainTabFocus: function (event) {
          var shiftTab    = event.shiftKey,
              activeIndex = this._getActiveIndex();
          //If an activeIndex is not available it is because regional focus has not
          //been set yet and this is the first tab request.
          if (activeIndex !== undefined) {
            var activeRegion = this.tabableRegions[activeIndex];
            var recursiveNavigate = getOption.call(this, 'recursiveNavigation');
            if (!!activeRegion && activeRegion.onLastTabElement(shiftTab, event)) {
              var nextActiveRegion = this._getNextActiveRegion(shiftTab, false);
              if (!nextActiveRegion) {
                nextActiveRegion = this._getNextActiveRegion(shiftTab, recursiveNavigate);

              }
              if (nextActiveRegion) {
                this._setTabableRegionActive(nextActiveRegion, shiftTab);
                this._setFocusInActiveTabableRegion(shiftTab);
              }
              return false;
            }
          }
          return true;
        },

        _setFocusToNextRegion: function setFocusToNextRegion(shiftTab) {
          var recursiveNavigate = getOption.call(this, 'recursiveNavigation');
          var nextActiveRegion = this._getNextActiveRegion(shiftTab, recursiveNavigate);
          if (nextActiveRegion) {
            this._setTabableRegionActive(nextActiveRegion);
            this._setFocusInActiveTabableRegion();
          }
        }
      },
      {
        // array with all TabablesBehavior instances
        tabablesHandlers: [],

        focusablesSelector: 'a[href], area[href], input, select, textarea, button,' +
                            ' iframe, object, embed, *[tabindex], *[contenteditable]',

        clearTabIndexes: function (view) {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior && $.contains(tabablesBehavior.view.el, view.el)) {
            if (view.clearTabIndexes) {
              view.clearTabIndexes();
            } else {
              tabablesBehavior._clearTabIndexes.call(tabablesBehavior, view);
            }
          }
        },

        setTabableRegionActive: function (tabableRegion) {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior && $.contains(tabablesBehavior.view.el, tabableRegion.view.el)) {
            tabablesBehavior._setTabableRegionActive.call(tabablesBehavior, tabableRegion);
          }
        },

        isTabableRegionActive: function (tabableRegion) {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            return tabablesBehavior.currentlyActiveTabableRegion?.view.cid === tabableRegion.view.cid;
          }
        },

        setTabableRegionInactive: function (tabableRegion) {
          _.each(TabablesBehavior.tabablesHandlers, function (tabablesBehavior) {
            if (tabablesBehavior.currentlyActiveTabableRegion?.view.cid === tabableRegion.view.cid) {
              TabablesBehavior.prototype._setCurrentlyActiveTabableRegionInactive.call(tabablesBehavior, tabableRegion);
            }
          });
        },

        registerTabableRegion: function (tabableRegion) {
          log.debug('registerTabableRegion for view ' + tabableRegion.view.constructor.name) &&
          console.log(log.last);

          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            return tabablesBehavior.registerTabableRegion.call(tabablesBehavior, tabableRegion);
          }
        },

        unregisterTabableRegion: function (tabableRegion) {
          if (tabableRegion) {
            // make it simple: don't search for the tabables behavior instance. Just remove it
            // from everyone.
            _.each(TabablesBehavior.tabablesHandlers, function (tabablesBehavior) {
              tabablesBehavior.unregisterTabableRegionBehavior.call(tabablesBehavior,
                  tabableRegion);
            });
          }
        },

        // Activate (set focus) of the region that has the highest weight value in the tabable
        // region behavior options.
        //  This should be called when regions are actually shown in the dom.
        //  If a region is already active, skip initial activation.

        setFocusInActiveTabableRegion: function activateInitialTabableRegion() {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            tabablesBehavior._setFocusInActiveTabableRegion.call(tabablesBehavior);
          }
        },

        popTabableHandler: function () {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            tabablesBehavior._popTabableHandler();
          }
        },
        switchViewDialog: function(){
        

        var self = this;
        var tabablesBehaviorRemove = 
        self.tabablesHandlers[TabablesBehavior.tabablesHandlers.length-1];
       
        
        tabablesBehaviorRemove.view.$el.off('keydown.csui-tabables');

        tabablesBehaviorRemove.stopListening(tabablesBehaviorRemove.view);

        if(TabablesBehavior.tabablesHandlers.length>1){ // to avoid the removal of parent of dialog
          TabablesBehavior.tabablesHandlers.pop();
        }



          // re-register
          var tabablesBehavior = 
          this.tabablesHandlers[this.tabablesHandlers.length-1];

         tabablesBehavior._setFocusInActiveTabableRegion.call(tabablesBehavior);
          _.each(tabablesBehavior.tabableRegions, function (tabableRegion) {
           
            tabableRegion.setInitialTabIndex.call(tabableRegion);
            tabableRegion._registerEventHandlers.call(tabableRegion);
            setTimeout(function () {
              tabableRegion.view.$el.on('keydown.csui-tabables', function (event) {
                if (event.keyCode === 9 && getOption.call(tabablesBehavior, 'containTabFocus')) {
                  return tabablesBehavior._maintainTabFocus(event);
                }
              });
            });
          });
         
        }

      });

  // TODO: Expose this functionality and make it generic for other behaviors
  function getOption(property, source) {
    var options = source || this.options || {};
    var value = options[property];
    return _.isFunction(value) ? options[property].call(this.view) : value;
  }

  return TabablesBehavior;
});


csui.define('csui/behaviors/keyboard.navigation/tabkey.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/utils/log',
  'csui/lib/marionette',
  'csui/behaviors/keyboard.navigation/tabables.behavior'
], function (module, _, $,
    log,
    Marionette,
    TabablesBehavior) {
  'use strict';

  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.

  var TabKeyBehavior = TabablesBehavior.extend({

        constructor: function TabKeyBehavior(options, view) {
          TabablesBehavior.prototype.constructor.apply(this, arguments);

        },
    
        _clearTabIndexes: function (view) {
          log.debug('_clearTabIndexes of TabKeyBehavior for view ' + view.constructor.name) &&
          console.log(log.last);
        }

      },
      {}
  );

  return TabKeyBehavior;
});


/**
 * This is CSUI specific error view.
 * If any module/products want different implementation, please point
 * directly to "smart/controls/error/error.view" instead-of
 * pointing to this class.
 */
csui.define('csui/controls/error/error.view',[
  'nuc/utils/log',
  'smart/controls/error/error.view'
], function (log, SmartErrorView) {
  'use strict';
  log.warn("Use error view from smart controls instead of depending on csui error view");
  return SmartErrorView;
});


csui.define('csui/widgets/error/error.view',[
  'csui/lib/underscore','csui/lib/backbone', 'csui/controls/error/error.view'
], function (_, Backbone, ErrorControlView) {
  'use strict';

  var ErrorWidgetView = ErrorControlView.extend({

    className: function () {
      var cvclass = ErrorControlView.prototype.className;
      if( _.isFunction(cvclass)) {
        cvclass = cvclass.call(this);
      }
      return 'csui-error-widget ' + cvclass;
    },

    constructor: function ErrorWidgetView(options) {
      options || (options = {});
      options.data || (options.data = {});
      if (!options.model) {
        options.model = new Backbone.Model({
          message: options.data.message,
          suggestion: options.data.suggestion
        });
      }

      ErrorControlView.prototype.constructor.call(this, options);
    }

  });

  return ErrorWidgetView;

});


csui.define('csui/behaviors/widget.container/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/behaviors/widget.container/impl/nls/root/lang',{

  loadingWidgetFailedMessage: '"{0}" failed to load.',
  loadingWidgetFailedSuggestion: 'Please try again later or contact support.'

});




// Loads widgets and exposes a promise with the result status on the view
csui.define('csui/behaviors/widget.container/widget.container.behavior',['require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/widgets/error/error.view',
  'csui/utils/log', 'i18n!csui/behaviors/widget.container/impl/nls/lang',
  'csui/utils/exp.widget.config',
  'csui/lib/jquery.when.all'
], function (require, _, $, Marionette, ErrorView, log, lang, ExpWidgetConfig) {
  'use strict';

  var WidgetContainerBehavior = Marionette.Behavior.extend({

    constructor: function WidgetContainerBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.view = view;
      this.view.widgetsResolved = this._resolveWidgets();
    },

    _resolveWidgets: function () {
      var promises = [];
      if (!this.view.enumerateWidgets) {
        throw new Marionette.Error({
          name: 'UndefinedEnumerateWidgets',
          message: 'Undefined enumerateWidgets method'
        });
      }
      this.view.enumerateWidgets(_.bind(function (widget) {
        promises.push($.when(widget).then(WidgetContainerBehavior.resolveWidget));
      }, this));
      return $.whenAll.apply($, promises);
    }
  }, {

    getErrorWidget: function (widget, error) {
      return {
        type: 'csui/widgets/error',
        options: {
          message: _.str.sformat(lang.loadingWidgetFailedMessage, widget.type),
          suggestion: lang.loadingWidgetFailedSuggestion,
          originalWidget: _.extend({}, widget)
        },
        view: ErrorView,
        error: error
      };
    },

    resolveWidget: function (widget) {
      if (!widget.view) {
        WidgetContainerBehavior._isExpWidgetEnable(widget);
        var promise = WidgetContainerBehavior._loadWidget(widget.type)
            .then(function (Widget) {
              widget.view = Widget;
              // TODO: Remove the deprecated property
              widget['class'] = Widget;
              return widget;
            }, function (error) {
              log.warn('Loading widget "{0}" failed. {1}', widget.type, error)
              && console.warn(log.last);
              log.warn('Occurred ' + log.getStackTrace()) && console.warn(log.last);
              _.extend(widget, WidgetContainerBehavior.getErrorWidget(widget, error));
            });
        return promise;
      }
      return $.Deferred().resolve().promise();
    },

    _isExpWidgetEnable: function(widget){
      if(!widget || !ExpWidgetConfig) return;
      const { expWidgetConfig } = ExpWidgetConfig[widget.type] || {};
      if(expWidgetConfig && !expWidgetConfig.isBothEnable){
        widget.type = expWidgetConfig.newWidget;
      }
    },

    _loadWidget: function (name) {
      var deferred  = $.Deferred(),
          path,
          lastSlash = name.lastIndexOf('/');
      // Enable widget names without the module path for the core widgets;
      // compatibility for early perspectives, which did not use full paths
      if (lastSlash < 0) {
        path = 'csui/widgets/' + name;
      } else {
        path = name;
        name = name.substring(lastSlash + 1);
      }
      require([path + '/' + name + '.view'],
          function (Widget) {
            deferred.resolve(Widget);
          }, function (error) {
            deferred.reject(error);
          });
      return deferred.promise();
    }

  });

  return WidgetContainerBehavior;

});


csui.define('css!csui/controls/globalmessage/globalmessage_icons',[],function(){});

csui.define('csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',['csui/lib/underscore', 'csui/lib/marionette'
], function (_, Marionette) {
  'use strict';

  var ViewEventsPropagationMixin = {

    propagateEventsToViews: function () {
      var views = Array.prototype.slice.call(arguments);
      _.each(this._eventsToPropagateToViews,
          _.bind(this._propagateEventToViews, this, views));
    },

    cancelEventsToViewsPropagation: function () {
      var views = Array.prototype.slice.call(arguments);
      _.each(this._eventsToPropagateToViews,
          _.bind(this._cancelEventToViewsPropagation, this, views));
    },

    _propagateEventToViews: function (views, name) {
      _.each(views, function (view) {
        //console.log('Propagating', name,
        //    'from', Object.getPrototypeOf(this).constructor.name,
        //    'to', Object.getPrototypeOf(view).constructor.name);
        //var parentView = this;
        var childView = view;
        view.listenTo(this, name, function () {
          //console.log('Triggering', name,
          //    'from', Object.getPrototypeOf(parentView).constructor.name,
          //    'to', Object.getPrototypeOf(childView).constructor.name);
          // Check if the view has already triggered render and show events
          // and if the view element has been added to the document.
          if ((childView._isShown || childView._isAttached) && childView._isRendered &&
              Marionette.isNodeAttached(childView.el)) {
            var parameters = Array.prototype.slice.call(arguments);
            parameters.unshift(childView, name);
            Marionette.triggerMethodOn.apply(Marionette, parameters);
          }
          // context provided to be able to stop listening
        }, this);
      }, this);
    },

    _cancelEventToViewsPropagation: function (views, name) {
      _.each(views, function (view) {
        //console.log('Cancelling propagation', name,
        //    'from', Object.getPrototypeOf(this).constructor.name,
        //    'to', Object.getPrototypeOf(view).constructor.name);
        // context provided to identify this origin as registrator
        view.stopListening(this, name, undefined, this);
      }, this);
    },

    _eventsToPropagateToViews: ['dom:refresh']

  };

  return ViewEventsPropagationMixin;

});


csui.define('csui/controls/grid/grid.view',['require', 'module', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin', 'csui/utils/log'
], function (require, module, _, Backbone, Marionette, ViewEventsPropagationMixin, log) {

  log = log(module.id);

  var ColumnView = Marionette.ItemView.extend({

    className: function () {
      var classNames = [];
      if (!!this.model.get('className')) {
        // Apply additional classes from model
        classNames.push(this.model.get('className'));
      }
      this._addSizeClasses(classNames);
      // TODO: Decide if we need it or not.  Or if we want just moves=pushes+pulls.
      // Experimental features for testing: you can define offsets, pulls and pushes
      // together with sizes for a grid column.  They will convert to binf-col-offset-*,
      // binf-col-push-* and binf-col-pull classes respectively.
      this._addOffsetClasses(classNames);
      this._addPullClasses(classNames);
      this._addPushClasses(classNames);
      this._addHeightClasses(classNames);
      return _.unique(classNames).join(' ');
    },

    attributes: function () {
      var tmpAttributes;

      if (this.model.get('widget') !== undefined) {
        var widgetType = this.model.get('widget').type;
        var lastSlash = widgetType.lastIndexOf('/');
        if (lastSlash > 0) {
          widgetType = widgetType.substring(lastSlash + 1);
        }
        // FIXME: use full path for widget type

        tmpAttributes = {
          'data-csui-widget_type': widgetType,
          'data-csui-cell_address': this.model.get('widget').cellAddress
        };
      }
      else {
        tmpAttributes = {};
      }

      return tmpAttributes;
    },

    constructor: function ColumnView(options) {
      if (!!options.cellBehaviours) {
        this.behaviors = _.extend(options.cellBehaviours, this.behaviors);
      }
      this._init(options);
    },

    _init: function (options) {
      Marionette.ItemView.prototype.constructor.call(this, _.extend({template: false}, options));
      if (this.collection) {
        this._createRows();
      } else {
        this._registerModelEvents();
        this._createCell();
      }
      this.propagateEventsToViews(this.cell || this.rows);
    },

    _registerModelEvents: function () {
      this.listenTo(this.model, 'change:widget', this._updateWidget);
      this.listenTo(this.model, 'change:sizes', this._updateSizes);
      this.listenTo(this.model, 'change:heights', this._updateSizes);
    },

    _updateSizes: function () {
      var className = _.result(this, 'className');
      this.$el.attr('class', className);
    },

    /**
     * Replace and re-render cell with new widget
     */
    _updateWidget: function (newWidget) {
      newWidget.cellAddress = this.model.get('widget').cellAddress;

      // Create Cell for new widget
      this._createCell();

      // Update Attributes
      var attrs = _.result(this, 'attributes');
      if (this.id) { attrs.id = _.result(this, 'id'); }
      if (this.className) { attrs['class'] = _.result(this, 'className');}
      this.$el.attr(attrs);

      // Finally, render
      this.render();
    },

    onRender: function () {
      try {
        this._renderContent();
      } catch (error) {
        log.warn('Widget render failed.\n{0}', error.stack) && console.warn(log.last);
        var cellConstructionFailed = this.options.grid.getOption('cellConstructionFailed');
        _.isFunction(cellConstructionFailed) &&
        cellConstructionFailed.call(this.options.grid, this.model, error);
      }
    },

    onBeforeDestroy: function () {
      this._destroyContent();
    },

    _addSizeClasses: function (classNames) {
      var sizes = this.model.get('sizes');
      if (sizes) {
        sizes.xs != null && classNames.push('binf-col-xs-' + sizes.xs);
        sizes.sm != null && classNames.push('binf-col-sm-' + sizes.sm);
        sizes.md != null && classNames.push('binf-col-md-' + sizes.md);
        sizes.lg != null && classNames.push('binf-col-lg-' + sizes.lg);
        sizes.xl != null && classNames.push('binf-col-xl-' + sizes.xl);
        sizes.xxl != null && classNames.push('binf-col-xxl-' + sizes.xxl);
      }
    },

    _addOffsetClasses: function (classNames) {
      var offset = this.model.get('offsets');
      if (offset) {
        offset.xs != null && classNames.push('binf-col-xs-offset-' + offset.xs);
        offset.sm != null && classNames.push('binf-col-sm-offset-' + offset.sm);
        offset.md != null && classNames.push('binf-col-md-offset-' + offset.md);
        offset.lg != null && classNames.push('binf-col-lg-offset-' + offset.lg);
        offset.xl != null && classNames.push('binf-col-xl-offset-' + offset.xl);
        offset.xxl != null && classNames.push('binf-col-xxl-offset-' + offset.xxl);
      }
    },

    _addPullClasses: function (classNames) {
      var pulls = this.model.get('pulls');
      if (pulls) {
        pulls.xs != null && classNames.push('binf-col-xs-pull-' + pulls.xs);
        pulls.sm != null && classNames.push('binf-col-sm-pull-' + pulls.sm);
        pulls.md != null && classNames.push('binf-col-md-pull-' + pulls.md);
        pulls.lg != null && classNames.push('binf-col-lg-pull-' + pulls.lg);
        pulls.xl != null && classNames.push('binf-col-xl-pull-' + pulls.xl);
        pulls.xxl != null && classNames.push('binf-col-xxl-pull-' + pulls.xxl);
      }
    },

    _addPushClasses: function (classNames) {
      var pushes = this.model.get('pushes');
      if (pushes) {
        pushes.xs != null && classNames.push('binf-col-xs-push-' + pushes.xs);
        pushes.sm != null && classNames.push('binf-col-sm-push-' + pushes.sm);
        pushes.md != null && classNames.push('binf-col-md-push-' + pushes.md);
        pushes.lg != null && classNames.push('binf-col-lg-push-' + pushes.lg);
        pushes.xl != null && classNames.push('binf-col-xl-push-' + pushes.xl);
        pushes.xxl != null && classNames.push('binf-col-xxl-push-' + pushes.xxl);
      }
    },

    _addHeightClasses: function (classNames) {
      var heights = this.model.get('heights');
      if (heights) {
        heights.xs != null && classNames.push('row-xs-' + heights.xs);
        heights.sm != null && classNames.push('row-sm-' + heights.sm);
        heights.md != null && classNames.push('row-md-' + heights.md);
        heights.lg != null && classNames.push('row-lg-' + heights.lg);
        heights.xl != null && classNames.push('row-xl-' + heights.xl);
        heights.xxl != null && classNames.push('row-xxl-' + heights.xxl);
      }
    },

    _createRows: function () {
      this.rows = new RowsView({
        el: this.el,
        grid: this.options.grid,
        collection: this.collection
      });
    },

    _createCell: function () {
      var CellView        = this._getCellView(),
          cellViewOptions = this._getCellViewOptions(),
          fullOptions     = _.extend({model: this.model}, cellViewOptions);
      if (!!this.cell) {
        // Destroy existing cell (if any)
        this.cell.destroy();
      }

      try {
        this.cell = new CellView(fullOptions);
      } catch (error) {
        log.warn('Widget initialization failed.\n{0}', error.stack) && console.warn(log.last);
        var cellConstructionFailed = this.options.grid.getOption('cellConstructionFailed');
        _.isFunction(cellConstructionFailed) &&
        cellConstructionFailed.call(this.options.grid, this.model, error);
      }
    },

    _getCellView: function () {
      var cellView = this.options.grid.getOption('cellView');
      if (cellView && !(cellView.prototype instanceof Backbone.View)) {
        cellView = cellView.call(this.options.grid, this.model);
      }
      if (!cellView) {
        throw new Marionette.Error({
          name: 'NoCellViewError',
          message: 'A "cellView" must be specified'
        });
      }
      return cellView;
    },

    _getCellViewOptions: function () {
      var cellViewOptions = this.options.grid.getOption('cellViewOptions');
      if (_.isFunction(cellViewOptions)) {
        cellViewOptions = cellViewOptions.call(this.options.grid, this.model, this);
      }
      return cellViewOptions;
    },

    _renderContent: function () {
      if (this.cell) {
        var region = new Marionette.Region({el: this.el});
        region.show(this.cell);
      } else {
        // If the grid is nested, nest also the height setting container class
        if (this.options.grid.$el.hasClass('grid-rows')) {
          this.$el.addClass('grid-rows');
        }
        this.rows.render();
      }
    },

    _destroyContent: function () {
      this.cell && this.cell.destroy();
      this.rows && this.rows.destroy();
    }

  });

  _.extend(ColumnView.prototype, ViewEventsPropagationMixin);

  var RowView = Marionette.CollectionView.extend({

    className: 'binf-row',

    childView: ColumnView,
    childViewOptions: function (child) {
      return {
        grid: this.options.grid,
        collection: child.rows,
        cellBehaviours: this.options.cellBehaviours,
        rowBehaviours: this.options.rowBehaviours
      };
    },

    constructor: function RowView(options) {
      if (!!options.rowBehaviours) {
        this.behaviors = _.extend(options.rowBehaviours, this.behaviors);
      }
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, 'add:child', this.propagateEventsToViews);
      // FIXME: implement stopListening in ViewEventsPropagationMixin on 'remove:child'
    }

  });

  _.extend(RowView.prototype, ViewEventsPropagationMixin);

  var RowsView = Marionette.CollectionView.extend({

    childView: RowView,
    childViewOptions: function (child) {
      return {
        grid: this.options.grid,
        collection: child.columns,
        cellBehaviours: this.options.cellBehaviours,
        rowBehaviours: this.options.rowBehaviours,
        reorderOnSort: this.options.reorderOnSort
      };
    },

    constructor: function RowsView() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, 'add:child', this.propagateEventsToViews);
      // FIXME: implement stopListening in ViewEventsPropagationMixin on 'remove:child'
    }

  });

  _.extend(RowsView.prototype, ViewEventsPropagationMixin);

  var GridRowView = RowView.extend({

    childView: ColumnView,
    childViewOptions: function (child) {
      return {
        grid: this.options.grid,
        cellBehaviours: this.options.cellBehaviours,
        rowBehaviours: this.options.rowBehaviours
      };
    },

    constructor: function GridRowView(options) {
      options || (options = {});
      options.grid = this;
      if (!options.collection) {
        options.collection = this._convertCollection(options);
      }
      RowView.prototype.constructor.call(this, options);
    },

    _convertCollection: function (options) {
      return new Backbone.Collection(options.columns);
    }

  });

  var GridView = RowsView.extend({

    className: 'cs-grid binf-container-fluid',

    constructor: function GridView(options) {
      options || (options = {});
      options.grid = this;
      if (!options.collection) {
        options.collection = this._convertCollection(options);
      }
      RowsView.prototype.constructor.call(this, options);
    },

    _convertCollection: function (options) {
      return this._convertRows(options.rows, 'grid0');
    },

    _convertRows: function (rows, addressPrefix) {
      rows = new Backbone.Collection(rows);
      rows.each(function (row, rowIndex) {
        var columns = row.get('columns');
        row.cellAddress = addressPrefix + ':r' + rowIndex;
        row.columns = this._convertColumns(columns, row.cellAddress);
      }, this);
      return rows;
    },

    _convertColumns: function (columns, addressPrefix) {
      columns = new Backbone.Collection(columns);
      columns.each(function (column, colIndex) {
        var rows = column.get('rows');
        column.cellAddress = addressPrefix + ':c' + colIndex;
        if (column.get('widget') !== undefined) {
          column.get('widget').cellAddress = column.cellAddress;
        }
        if (rows) {
          column.rows = this._convertRows(rows, column.cellAddress);
        }
      }, this);
      return columns;
    }

  }, {

    RowView: GridRowView,
    CellView: ColumnView

  });

  return GridView;

});


csui.define('csui/controls/doc.preview/active.plugin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'require'
], function ($, _, require) {
  'use strict';

  var getActivePluginView = function (options) {
    var dfd = $.Deferred(),
        model = options.model,
        context = options.context,
        viewerView;

    if (!!model && !!context) {

      csui.require(['csui/utils/commands/preview.plugins/preview.plugins'], function (plugins) {
        var plugin       = plugins.findByNode(model, {context: context}),
            viewerModule = plugin && plugin.widgetView ? plugin.widgetView : '';

        if(!!viewerModule) {
          if (typeof viewerModule === 'function') {
            viewerModule = viewerModule.call(plugin, model, {context: context});
          }
          require([viewerModule], _.bind(function (Viewer) {
            var viewerOptions = plugin.widgetViewOptions;
            if (typeof viewerOptions === 'function') {
              viewerOptions = viewerOptions.call(plugin, model, {context: context});
            }

            viewerView = new Viewer(_.extend(options, viewerOptions));

            dfd.resolve({
              viewer: viewerView,
              plugin: plugin,
              response: {
                status: 'SUCCESS'
              }
            });

          }, this));
        } else {
          dfd.reject({
            viewer: undefined,
            response: {
              status: 'ERROR',
              errorCode: 'ERR_UN_SUPPORTED',
              errorMessage: 'Neither supported plugin nor supported document exists!'
            }
          });
        }
      });

    } else {
      dfd.reject({
        viewer: undefined,
        response: {
          status: 'ERROR',
          errorCode: 'ERR_MISSING_REQ_DATA',
          errorMessage: 'Either model or context is missing!'
        }
      });
    }

    return dfd.promise();
  };

  return {
    getActivePluginView: getActivePluginView
  };
});

csui.define('css!csui/controls/doc.preview/impl/doc.preview',[],function(){});

csui.define('csui/controls/doc.preview/doc.preview.view',[
  'csui/lib/jquery', 'require', "csui/lib/underscore", 'csui/lib/marionette', 'csui/lib/backbone',
  'csui/utils/contexts/factories/next.node', 'csui/controls/doc.preview/active.plugin',
  'nuc/models/node/node.model', 'css!csui/controls/doc.preview/impl/doc.preview'
], function ($, require, _, Marionette, Backbone, NextNodeModelFactory, ActivePlugin, NodeModel) {
  'use strict';

  var HIGHLIGHT_CLASS_NAME = 'csui-doc-preview-state';
  var responseObject = {
    status: '',
    errorCode: '',
    errorMessage: ''
  };

  var DocPreviewView = Marionette.ItemView.extend({
    className: 'csui-doc-preview-wrapper',
    template: false,

    constructor: function DocPreviewView(options) {
      options || (options = {});
      var defaultOptions = {
        skipDestroyUponCollectionRequest: false
      };
      options = _.defaults(options, defaultOptions);
      Marionette.ItemView.apply(this, arguments);

      this.model = this._getNodeModel(this.model);

      this.listenTo(this, 'open:new:doc:preview',
          _.bind(function (model, originatingView) {
            if (this.plugin && this.plugin.constructor.isSupported(model)) {
              if (!!originatingView) {
                this.options.originatingView = originatingView;
              }
              this.options.originatingView && this._setSelectedNodes();

              this.model = this._getNodeModel(model);

              if (this.selectedNodes.length < 2) {
                this.viewerView.trigger('update:model', this.model);
              } else {
                this.viewerView.trigger('update:collection', this.selectedNodes);
              }

              this.options.originatingView.trigger('doc:preview:generic:actions', this.model,
                  HIGHLIGHT_CLASS_NAME);
            } else {
              this.trigger("error:doc:preview", _.defaults({
                status: 'ERROR',
                errorCode: 'ERR_UN_SUPPORTED',
                errorMessage: 'Neither supported plugin nor supported document exists!'
              }, responseObject));
            }
          }, this));

      // listen context changes and destroy the view.
      this.listenToOnce(this.options.context.getModel(NextNodeModelFactory), 'change:id',
          this._doCleanUp);

      this.listenToOnce(this.options.context, 'change:perspective retain:perspective',
        this._doCleanUp);

      this.listenToOnce(this.options.originatingView, 'close:doc:preview destroy:doc:preview',
          this._doCleanUp);

      this.listenToOnce(this, 'before:destroy', this._doCleanUp);

      if (this.options.originatingView) {

        this._setSelectedNodes();

        this.options.originatingView.collection &&
        this.listenToOnce(this.options.originatingView.collection, 'request', _.bind(function () {
          if (!this.options.skipDestroyUponCollectionRequest) {
            this._doCleanUp();
          }
        }, this));

        this.options.originatingView.commandController &&
        this.listenToOnce(this.options.originatingView.commandController,
            'before:execute:command', _.bind(function (eventArgs) {
              if(eventArgs.commandSignature !== "DocPreview"){
              this._doCleanUp();
              }
            }, this));
      }

      this._renderViewerView();

      this.listenTo(this, 'panel:expand', this._expandPanel);
      this.listenTo(this, 'panel:collapse', this._collapsePanel);
    },

    _getNodeModel: function (model) {
      return new NodeModel(model.attributes, {connector: model.connector});
    },

    _setSelectedNodes: function () {
      this.selectedNodes = _.isFunction(this.options.originatingView.allSelectedNodes) ?
                           this.options.originatingView.allSelectedNodes() :
                           (this.options.originatingView.collection &&
                            this.options.originatingView.collection.selectedItems ||
                            new Backbone.Collection());

      if(_.isFunction(this.options.getUpdatedNodes) && this.selectedNodes?.length) {
        this.selectedNodes = this.options.getUpdatedNodes(this.selectedNodes);
      }
    },

    layoutState: {},
    _expandPanel: function () {
      this.viewerView && this.viewerView.trigger('expand:view');
    },

    _collapsePanel: function () {
      this.viewerView && this.viewerView.trigger('collapse:view');
    },

    /**
     * This method is going to create and render viewer's view (from `viewx` module)
     *
     * @private
     */
    _renderViewerView: function () {
      this.options.originatingView.trigger('doc:preview:generic:actions', this.model, HIGHLIGHT_CLASS_NAME);

      var viewerOpts = {
        model: this.model,
        context: this.options.context,
        selectedNodes: this.selectedNodes
      };

      ActivePlugin.getActivePluginView(viewerOpts)
          .then(_.bind(function (args) {
            this.viewerView = args.viewer;
            this.plugin = args.plugin;
            var viewerRegion = new Marionette.Region({
              el: this.$el
            });

            viewerRegion.show(this.viewerView);
            $(".binf-widgets.csui-sidepanel-open").addClass("csui-doc-preview");
            this.listenTo(this.viewerView, 'destroy', _.bind(function () {
              this.destroy();
            }, this));

            this.listenTo(this.viewerView, 'highlight:row', _.bind(function (model) {
              model && this.trigger('highlight:row', model);
            }, this));
            if (this.options.resizableWrapperClass) {
              var resizableEle = this.$el.closest(this.options.resizableWrapperClass);
              this.listenTo(this.viewerView, "expand:click", function () {
                resizableEle[0].style.width = "100%";
              });

              this.listenTo(this.viewerView, "collapse:click", function () {
                if (!!this.layoutState.width) {
                  resizableEle[0].style.width = this.layoutState.width + 'px';
                } else {
                  resizableEle.removeAttr('style');
                }
              });
            }

          this.listenTo(this.viewerView, 'close', function(){
            this.options.originatingView.triggerMethod('doc:preview:view:close');
          });

          }, this))
          .fail(_.bind(function (args) {
            this.trigger("error:doc:preview", _.defaults({
              status: 'ERROR',
              errorCode: 'ERR_UN_SUPPORTED',
              errorMessage: 'Neither supported plugin nor supported document exists!'
            }, responseObject));
          }, this));
    },

    /**
     * This method cleans all the garbage created as part of this preview veiw.
     *
     * @param event
     * @private
     */
    _doCleanUp: function (event) {
        this.viewerView && this.viewerView.destroy();
        $(".binf-widgets").removeClass("csui-doc-preview");
    }
  });

  return DocPreviewView;
});


csui.define('csui/utils/commands/open.plugins/impl/brava.plugin',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/models/version'
], function (_, $, VersionModel) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
                   .config['csui/utils/commands/open'] || {};

  config = _.extend({
    isBravaViewerAvailable: false,
    supportedBravaViewerMimeTypes: [],
    bravaView: 'brava/widgets/bravaviewer/bravaviewer.view',
    widgetView: 'brava/widgets/bravaviewer/bravaviewer.view'
  }, config);

  config.supportedBravaViewerMimeTypes = _.invoke(
      config.supportedBravaViewerMimeTypes, 'toLowerCase');

  function BravaPlugin() {
  }

  BravaPlugin.prototype.widgetView = config.bravaView;

  BravaPlugin.prototype.getUrlQuery = function (node) {
    var query = {
      func: 'doc.ViewDoc',
      nodeid: node.get('id')
    };
    if (node instanceof VersionModel) {
      query.vernum = node.get('version_number');
    }
    return $.Deferred()
            .resolve(query)
            .promise();
  };

  BravaPlugin.prototype.needsAuthentication = function (node) {
    return true;
  };

  BravaPlugin.isSupported = function (node) {
    var mimeType = 'view:' + (node.get('mime_type') || '');
    return mimeType && config.isBravaViewerAvailable &&
           config.supportedBravaViewerMimeTypes.indexOf(mimeType.toLowerCase()) >= 0;
  };

  return BravaPlugin;
});


csui.define('csui/controls/doc.preview/preview.plugins/preview.plugins',[
  'csui/utils/commands/open.plugins/impl/brava.plugin'
], function (BravaPlugin) {
  'use strict';

  return [
    {
      sequence: 200,
      plugin: BravaPlugin,
      decides: BravaPlugin.isSupported
    }
  ];
});


/**
* This control will be depricated once SVF-1020 resolved, in which
* smart control's mappings will be included with global mappings.
* Once this solution is ready, then create a direct mapping for this
* control as shown below.
*
* "csui/controls/progressblocker/blocker": "smart/controls/progressblocker/blocker"
*/

csui.define('csui/controls/progressblocker/blocker',[
  'module', 'csui/lib/underscore',
  'smart/controls/progressblocker/blocker'
], function (module, _, SmartBlocker) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    delay: 10,
    disableDelay: 10,
    globalOnly: false
  });

  SmartBlocker.setModuleConfigs(config);

  return SmartBlocker;
});

csui.define('csui/controls/globalmessage/impl/progresspanel/progresspanel.view',['smart/controls/progresspanel/progresspanel/progresspanel.view'],
    function (_, SmartProgressPanelView) {
      var ProgressPanelView = SmartProgressPanelView.extend({

        constructor: function ProgressPanelView(options) {
          SmartProgressPanelView.prototype.constructor.call(this, options);
        },

      });

      return ProgressPanelView;
    });

csui.define('csui/controls/globalmessage/impl/progresspanel/progressbar.view',['smart/controls/progresspanel/progresspanel/progressbar.view'
], function (SmartProgressBarView) {

  var ProgressBarView = SmartProgressBarView.extend({

    constructor: function ProgressBarView(options) {
      SmartProgressBarView.prototype.constructor.call(this, options);
    }

  });
  
  return ProgressBarView;
});

csui.define('csui/controls/globalmessage/progressbar.view.ext',['smart/controls/progresspanel/progressbar.view.ext'
], function (SmartProgressBarViewExt) {

  var ProgressBarViewExt = SmartProgressBarViewExt.extend({

    constructor: function ProgressBarViewExt(options) {
      SmartProgressBarViewExt.prototype.constructor.call(this, options);
    }

  });
  
  return ProgressBarViewExt;
});



// Lists explicit locale mappings and fallbacks

csui.define('csui/controls/globalmessage/impl/nls/globalmessage.lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/controls/globalmessage/impl/nls/root/globalmessage.lang',{
  FewerDetails: "Fewer details",
  MoreDetails: "More details...",
  GotoLocationLinkLabel: "Go to location",
  CloseDialog: "Close",
  closeDialogAria: "Close message dialog"
});




csui.define('csui/controls/perspective.panel/perspective.animator',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery'
], function (module, _, $) {
  'use strict';

  var config = _.extend({
    effect: 'none'
  }, module.config());
  var effect = config;

  function PerspectiveAnimator(perspectivePanelView) {
    this.perspectivePanelView = perspectivePanelView;
  }

  PerspectiveAnimator.prototype = {
    startAnimation: function (perspectiveView) {
      if (effect === 'slide') {
        var perspectivePanel = this.perspectivePanelView;

        perspectivePanel.$el
        // Flush the DOM redraw to separate hiding of the
        // blocking view from the perspective change animation
          .redraw()
          .addClass('csui-in-transition');

        perspectiveView.$el.addClass('cs-on-stage-right');
        perspectiveView.triggerMethod('before:show');
        this.perspectivePanelView.$el.append(perspectiveView.el);
      } else if (effect === 'fade') {
        perspectiveView.$el.addClass('csui-fading');
      }
    },

    swapPerspective: function (currentPerspectiveView, upcomingPerspectiveView) {
      var deferred = $.Deferred();
      if (effect === 'slide') {
        currentPerspectiveView.$el.addClass('cs-on-stage-left');
      } else {
        currentPerspectiveView.remove();
      }

      if (effect === 'fade') {
        this.perspectivePanelView.$el.addClass('csui-in-transition');
      }
      this._insertPerspective(upcomingPerspectiveView);

      if (effect === 'slide' || effect === 'fade') {
        upcomingPerspectiveView.$el
            .one(this._transitionEnd(), deferred.resolve)
            // Do not let the browser "optimize away" the transition
            // after appending by accessing some DOM property which
            // needs the element rendered.
            .redraw()
            .removeClass(effect === 'slide' ? 'cs-on-stage-right' : 'csui-faded-out');
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },

    showPerspective: function (perspectiveView) {
      var deferred = $.Deferred();
      this._insertPerspective(perspectiveView);
      if (effect === 'slide' || effect === 'fade') {
        perspectiveView.$el
            .one(this._transitionEnd(), deferred.resolve)
            // Do not let the browser "optimize away" the transition
            // after appending by accessing some DOM property which
            // needs the element rendered.
            .redraw()
            .removeClass(effect === 'slide' ? 'cs-on-stage-right' : 'csui-faded-out');
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },

    finishAnimation: function () {
      if (effect === 'slide' || effect === 'fade') {
        this.perspectivePanelView.$el.removeClass('csui-in-transition');
      }
    },

    _insertPerspective: function (perspectiveView) {
      if (effect === 'fade') {
        perspectiveView.$el.addClass('csui-faded-out');
      }
      perspectiveView.triggerMethod('before:show');
      this.perspectivePanelView.$el.append(perspectiveView.el);
      perspectiveView.triggerMethod('show');
    },

    _transitionEnd: _.once(
      function () {
        var transitions = {
              transition: 'transitionend',
              WebkitTransition: 'webkitTransitionEnd',
              MozTransition: 'transitionend',
              OTransition: 'oTransitionEnd otransitionend'
            },
            element = document.createElement('div'),
            transition;
        for (transition in transitions) {
          if (typeof element.style[transition] !== 'undefined') {
            return transitions[transition];
          }
        }
      }
    )
  };

  return PerspectiveAnimator;
});



csui.define('csui/controls/perspective.panel/perspective.factory',['require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone'
], function (require, _, $, Backbone) {

  function PerspectiveFactory(options) {
    this.options = options || {};
  }

  _.extend(PerspectiveFactory.prototype, {

    createPerspective: function (model) {
      var self = this;
      return this
          ._loadPerspective(model.get('type'))
        .then(function (PerspectiveView) {
          return new PerspectiveView(
            _.extend({
              context: self.options.context,
              type: model.get('type'),
            }, model.get('options'))
          );
        });
    },

    _loadPerspective: function (type) {

      var deferred  = $.Deferred(),
          path,
          lastSlash = type.lastIndexOf('/');
      // Enable perspective types without the module path for the core perspectives;
      // compatibility for early perspectives, which did not use the full paths
      if (lastSlash < 0) {
        path = 'csui/perspectives/' + type;
      } else {
        path = type;
        type = type.substring(lastSlash + 1);
      }
      require([path + '/' + type + '.perspective.view'],
          function (PerspectiveView) {
            deferred.resolve(PerspectiveView);
          }, function (error) {
            deferred.reject(error);
          });
      return deferred.promise();
    }

  });

  PerspectiveFactory.extend = Backbone.View.extend;

  return PerspectiveFactory;
});


csui.define('csui/utils/contexts/factories/user',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/connector', 'csui/models/authenticated.user'
], function (module, _, $, Backbone, ModelFactory, ConnectorFactory,
    AuthenticatedUserModel) {
  'use strict';

  var prefetch = /\bprefetch(?:=([^&]*)?)/i.exec(location.search);
  prefetch = !prefetch || prefetch[1] !== 'false';

  var initialResourceFetched;

  var UserModelFactory = ModelFactory.extend({
    propertyPrefix: 'user',

    constructor: function UserModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var user = this.options.authentication || this.options.user || {},
          config = module.config();
      if (prefetch) {
        this.initialResponse = user.initialResponse || config.initialResponse;
      }
      if (!(user instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options);
        user = new AuthenticatedUserModel(user.attributes || config.attributes,
            _.defaults({
              connector: connector
            }, user.options, config.options));
      }
      this.property = user;
    },

    fetch: function (options) {
      var promise;
      if (this.initialResponse && !initialResourceFetched) {
        promise = this.property.prefetch(this.initialResponse, options);
        initialResourceFetched = true;
      } else {
        promise = this.property.fetch(options);
      }

      // set the userId on the authenticator
      promise.done(_.bind(function() {
        this.property.connector.authenticator.setUserId(this.property.get('id'));
      }, this));

      return promise;
    }
  });

  return UserModelFactory;
});


csui.define('csui/utils/contexts/factories/application.scope.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory'
], function (module, _, Backbone, ModelFactory) {

  var ApplicationScopeModel = Backbone.Model.extend({});

  var ApplicationScopeModelFactory = ModelFactory.extend({

    propertyPrefix: 'applicationScope',

    constructor: function ApplicationScopeModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var applicationScope = this.options.applicationScope || {};
      if (!(applicationScope instanceof Backbone.Model)) {
        var config = module.config();
        applicationScope = new ApplicationScopeModel(applicationScope.models, _.extend({},
            applicationScope.options, config.options));
      }
      this.property = applicationScope;
    }

  });

  return ApplicationScopeModelFactory;

});


csui.define('csui/utils/contexts/factories/node',[
  'module', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'csui/utils/contexts/mixins/clone.and.fetch.mixin',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/connector',
  'nuc/models/node/node.model',
  'csui/utils/commands'
], function (module, $, Backbone, CloneAndFetchMixin, ModelFactory,
    ConnectorFactory, NodeModel, commands) {
  'use strict';

  var NodeModelFactory = ModelFactory.extend({
    propertyPrefix: 'node',

    constructor: function NodeModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var node = this.options.node || {},
          config = module.config();
      if (!(node instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options),
            creationOptions = $.extend(true, {
              connector: connector,
              // Do not waste server resources and request only common
              // properties at start; it returns all what it can by default.
              fields: {
                properties: [],
                'versions.element(0)': ['owner_id']
              },
              // Command enabling for shortcuts needs the original node info
              expand: {
                properties: ['original_id']
              },
              // Make sure, that the metadata token is returned for nodes
              // requesated via this factory, because they are supposed to
              // be shared and may be the subject of changes.
              stateEnabled: true,
              // Command enabling needs permitted actions
              commands: commands.getAllSignatures()
            }, config.options, node.options);
        // Next node can be fetshed just like node; keep their defaults in sync
        node = new NodeModel(node.attributes || config.attributes,
            creationOptions);
      }
      this.property = node;

      this.makeCloneAndFetch(options);
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  CloneAndFetchMixin.mixin(NodeModelFactory.prototype);

  return NodeModelFactory;
});


csui.define('csui/utils/contexts/factories/ancestors',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/node',
  'csui/models/nodeancestors'
], function (module, _, Backbone, CollectionFactory, NodeModelFactory, NodeAncestorCollection) {
  'use strict';

  var prefetch = /\bprefetch(?:=([^&]*)?)/i.exec(location.search);
  prefetch = !prefetch || prefetch[1] !== 'false';

  var initialResourceFetched;

  var AncestorCollectionFactory = CollectionFactory.extend({
    propertyPrefix: 'ancestors',

    constructor: function AncestorsCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var config = module.config();
      var ancestors = this.options.ancestors || {};
      if (prefetch) {
        this.initialResponse = ancestors.initialResponse || config.initialResponse;
      }
      if (!(ancestors instanceof Backbone.Collection)) {
        var node = context.getModel(NodeModelFactory);
        ancestors = new NodeAncestorCollection(ancestors.models,
          _.defaults({
            // Breadcrumb panel listens only to the 'reset' event.
            autoreset: true,
            node: node
          }, ancestors.options, config.options));
      }
      this.property = ancestors;

      // Listen to renaming of the contextual node, which we assume to be
      // the last ancestor, as the collection is constructed by default.
      this.listenTo(this.property.node, 'change:name', function () {
        if (this.property.length > 0) {
          this.property.last().set('name', node.get('name'));
        }
      });

      this.listenTo(this.property.node, 'change:parent_id', function () {
        // When navigating through bradcrumbs, avoid fetching of ancestors
        // as ancestors are already fetched and updated through /api/v2/app/container/node? network call
        if (this.property.length > 0 && this.property.last().get('parent_id') !== node.get('parent_id')) {
          this.fetch();
        }
      });
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      if (this.initialResponse && !initialResourceFetched) {
        var promise = this.property.prefetch(this.initialResponse, options);
        initialResourceFetched = true;
        return promise;
      } else {
        // If you want to avoid the server call by updating the ancestors
        // only on the client side, inspect the earlier code in Perforce.
        return this.property.fetch(options);
      }
    }
  });

  return AncestorCollectionFactory;
});


csui.define('csui/behaviors/keyboard.navigation/tabable.region.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/utils/log', 'csui/utils/base',
  'csui/behaviors/keyboard.navigation/tabables.behavior'
], function (module, _, $, Marionette, log, base, TabablesBehavior) {
  'use strict';


  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.

  var TabableRegionBehavior = Marionette.Behavior.extend({

      defaults: {
        initialActivationWeight: 0
      },

      constructor: function TabableRegionBehavior(options, view) {
        Marionette.Behavior.prototype.constructor.apply(this, arguments);

        this.view = view;
        view.tabableRegionBehavior = this;

        // merge behavior defaults into view
        _.extend(view, this.defaults);

        // add default implementation to view if it does not have one
        _.defaults(view, {
            // TODO remove use of isTabable because there is no code that gets called when the user
            // presses the tab key
            isTabable: function () {
              return true;  // default: this view can be reached by tab
            },
            onLastTabElement: function () {
              return true;  //most regions will only have one tab, with further navigation handled through arrow keys
            }
          }
        );

        if (view.options && !view.options.initialActivationWeight) {
          view.options.initialActivationWeight = this.options.initialActivationWeight;
        }

        this._registerEventHandlers();

      },

      _registerEventHandlers: function () {
        if (!this._eventsRegistered) {
          var view = this.view;
          var self = this;

          // log.debug('_registerEventHandlers ' + view.constructor.name) && console.log(log.last);

          this.listenTo(view, 'render', this._applyClasses);
          this.listenTo(view, 'dom:refresh', function () {
            TabablesBehavior.clearTabIndexes(view);
            if (TabablesBehavior.registerTabableRegion(this)) {
              self.isRegistered = true;
              this.setInitialTabIndex();
              TabablesBehavior.setFocusInActiveTabableRegion();
            }
          });
          this.listenTo(view, 'refresh:tabindexes', function () {
            TabablesBehavior.clearTabIndexes(view);
            if (self.isRegistered) {
              this.setInitialTabIndex();
              TabablesBehavior.setFocusInActiveTabableRegion();
            }
          });

          this.listenTo(view, 'destroy', function () {
            this.currentlyFocusedElement?.off('focus.' + this.view.cid);
            TabablesBehavior.setTabableRegionInactive(this);
            TabablesBehavior.unregisterTabableRegion(this);
            TabablesBehavior.clearTabIndexes(view);
            self.isRegistered = false;
          });
          this.listenTo(view, 'tabable', function () {
            TabablesBehavior.clearTabIndexes(view);
            if (TabablesBehavior.registerTabableRegion(this)) {
              this.setInitialTabIndex();
              TabablesBehavior.setFocusInActiveTabableRegion();
            }
          });
          this.listenTo(view, 'tabable:not', function () {
            TabablesBehavior.unregisterTabableRegion(this);
            TabablesBehavior.clearTabIndexes(view);
            this.isRegistered = false;
          });

          this.listenTo(view, 'changed:focus', function () {
            if (self.isRegistered) {
              this.moveTabIndex();
            }
          });

          this.listenTo(view, 'escaped:focus', function () {
            TabablesBehavior.setFocusInActiveTabableRegion();
          });
          this._eventsRegistered = true;
        }
      },

      _unregisterEventHandlers: function () {
        var view = this.view;
        // log.debug('_unregisterEventHandlers ' + view.constructor.name) && console.log(log.last);

        this.stopListening(view);
        this._eventsRegistered = false;
      },

      getCurrentlyFocusedElementFromView: function (shiftTab) {
        if (_.isFunction(this.view.currentlyFocusedElement)) {
          var focusEl = this.view.currentlyFocusedElement({shiftKey: shiftTab});
          return (focusEl instanceof $ ? focusEl : $(focusEl));
        } else {
          if (_.isString(this.view.currentlyFocusedElement)) {
            return this.view.$(this.view.currentlyFocusedElement);
          } else {
            log.debug('setInitialTabIndex: ' + this.view.constructor.name + ' does not have' +
              ' currentlyFocusedElement -> not setting tabindex in that view ') &&
            console.log(log.last);
            return $();
          }
        }
      },

      onLastTabElement: function (shiftTab, event) {
        return this.view.onLastTabElement(shiftTab, event);
      },

      setFocus: function (shiftTab) {
        // Not set focus if the view is requested so that the behavior is not stealing the focus.
        // After rendering, the view is setting focus on element at same location by itself.
        if (this.options.notSetFocus) {
          return;
        }

        var elToFocus = this.getCurrentlyFocusedElementFromView(shiftTab);
        // Do not focus elements out of the visible viewport rectangle;
        // it brings them to the visible screen, ignoring the absolute
        // positioning or transforms, if they were applied earlier
        if (elToFocus && base.isVisibleInWindowViewport(elToFocus)) {
          this.ignoreFocusEvents = true;
          elToFocus[0].focus();
          this.ignoreFocusEvents = false;
          return true;
        }
      },

      setInitialTabIndex: function () {
        // TabablesBehavior.clearTabIndexes(this.view);
        if (this.currentlyFocusedElement) {
          this.currentlyFocusedElement.off('focus.' + this.view.cid);
        }
        if (this.view.isTabable()) {
          try {
            this.currentlyFocusedElement = this.getCurrentlyFocusedElementFromView();
            if (this.currentlyFocusedElement && this.currentlyFocusedElement.length > 0) {
              var self = this;
              this.currentlyFocusedElement.prop('tabindex', 0);
              this.currentlyFocusedElement.addClass(
                TabableRegionBehavior.accessibilityActiveElementClass);
              this.currentlyFocusedElement.on('focus.' + this.view.cid, function () {
                if (!self.ignoreFocusEvents) {
                  TabablesBehavior.setTabableRegionActive(self);
                }
              });
            }
          } catch (e) {
            console.warn('Could not set as active element: ', this.view.cid, e.message);
          }

        } else {
          this.currentlyFocusedElement = $();
        }
      },

      moveTabIndex: function () {
        var self = this;
        if (this.currentlyFocusedElement) {
          this.currentlyFocusedElement.off('focus.' + this.view.cid);
          this.currentlyFocusedElement.prop('tabindex', -1);
          this.currentlyFocusedElement.removeClass(
            TabableRegionBehavior.accessibilityActiveElementClass);
          this.currentlyFocusedElement = $();

        }
        var newlyFocusedElement = this.getCurrentlyFocusedElementFromView();
        newlyFocusedElement.prop('tabindex', 0);
        this.currentlyFocusedElement = newlyFocusedElement;
        this.currentlyFocusedElement.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
        this.currentlyFocusedElement.on('focus.' + this.view.cid, function () {
          if (!self.ignoreFocusEvents) {
            TabablesBehavior.setTabableRegionActive(self);
          }
        });
      },

      isActive: function() {
        return TabablesBehavior.isTabableRegionActive(this);
      },

      _applyClasses: function () {
        this.$el.addClass(TabableRegionBehavior.accessibilityRegionClass);
      }
    },
    {
      accessibilityRegionClass: 'csui-acc-tab-region',
      accessibilityActiveRegionClass: 'csui-acc-tab-region-active',
      accessibilityFocusableClass: 'csui-acc-focusable',
      accessibilityActiveElementClass: 'csui-acc-focusable-active'
    }
  );

  return TabableRegionBehavior;
});


/**
 * This is CSUI specific breadcrumbs view.
 * If any module/products want different implementation, please point
 * directly to "smart/controls/breadcrumbs/breadcrumbs.view" instead-of
 * pointing to this class.
 */

csui.define('csui/controls/breadcrumbs/breadcrumbs.view',[
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/url',
  'smart/controls/breadcrumbs/breadcrumbs.view',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/node.links/node.links',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior'
], function (_,
    $,
    Backbone,
    Marionette,
    ApplicationScopeModelFactory, Url,
    SmartBreadcrumbsView,
    NextNodeModelFactory,
    nodeLinks,
    TabableRegionBehavior) {

  var BreadCrumbCollectionView = SmartBreadcrumbsView.extend({

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function BreadcrumbCollectionView(options) {
      SmartBreadcrumbsView.prototype.constructor.call(this, options);

      // listening events provided by SmartControls
      this.listenTo(this, 'before:synchronized', _.bind(this.updateCollection, this));
      this.listenTo(this, 'childview:click:ancestor', _.bind(this.onClickAncestor, this));
      this.listenTo(this, 'childview:click:home:ancestor', this.onClickHomeAncestor);

      this.applicationScope = options?.context?.getModel(ApplicationScopeModelFactory);
    },

    /**
     * This method has custom logic specific to content server.
     * Clicking upon each link (ancestor) within breadcrumbs should execute default action based
     * on that model type.
     *
     * @param model
     * @param node
     */
    onClickAncestor: function (model, node) {
      var context = this.context = this.options.context;
      this._nextNode = this.options.node || context.getModel(NextNodeModelFactory);

      var args = {node: node};
      this.trigger('before:defaultAction', args);
      if (!args.cancel) {
        var nodeId = node.get('id');
        if (this._nextNode.get('id') === nodeId) {
          // when id is same as nextNode's id, nextNode.set(id) event is not triggered
          this._nextNode.unset('id', {silent: true});
        }

        var viewStateModel = this.context && this.context.viewStateModel;
        var viewState = viewStateModel && viewStateModel.get('state');
        if (viewState) {
          this.context.viewStateModel.set('state', _.omit(viewState, 'filter'), {silent: true});
        }

        this._nextNode.trigger('before:change:id', node, this);
        this._nextNode.set('id', nodeId);
      }

      this.$el.trigger('setCurrentTabFocus');
    },

    //Clicking upon home icon in breadcrumb should navigate to landing/home page
    onClickHomeAncestor: function () {
      this.applicationScope.set('id', '');
    },

    /**
     * This method updates collection (model's data) as per content server. For example, giving
     * hyper link for each crumb. It could be vary for one sub-type of object to another
     * sub-type of object. It helps to open such crumb's link in new tab or in new window.
     */
    updateCollection: function () {
      this.completeCollection.forEach(function (model) {
        var connector = model.connector || model.collection.connector, hrefSrc = '';
        const serverUrl = new Url(connector && connector.connection.url || location.href);
        hrefSrc = model.get('id') > 0 && (connector) &&
                  nodeLinks.getUrl(model, {connector: connector}) || 
                  (model.get('id') === 'home' && nodeLinks.getHomeUrl(serverUrl)) || '#';
        model.set('hrefSrc', hrefSrc, {silent: true});
      });
    }

  });

  return BreadCrumbCollectionView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/breadcrumbspanel/impl/breadcrumbspanel',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"binf-row\">\n  <div class=\"binf-item binf-col-xs-12\">\n    <div class=\"breadcrumb-inner breadcrumb-inner-header\" role=\"navigation\"\n         aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"breadcrumbAria") || (depth0 != null ? lookupProperty(depth0,"breadcrumbAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"breadcrumbAria","hash":{},"loc":{"start":{"line":4,"column":21},"end":{"line":4,"column":39}}}) : helper)))
    + "\"></div>\n  </div>\n</div>\n";
}});
Handlebars.registerPartial('csui_controls_breadcrumbspanel_impl_breadcrumbspanel', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/breadcrumbs/impl/breadcrumb/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/controls/breadcrumbs/impl/breadcrumb/impl/nls/root/lang',{
  subcrumbTooltip: 'Show full path',
  subcrumbAria: 'Show full path',
  breadcrumbAria: 'Breadcrumb'

});






csui.define('css!csui/controls/breadcrumbspanel/impl/breadcrumbspanel',[],function(){});

csui.define('csui/controls/breadcrumbspanel/breadcrumbspanel.view',['module', 'csui/lib/underscore', 'csui/lib/marionette', 'csui/utils/contexts/factories/ancestors',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/commonconfig.util',
  'csui/controls/breadcrumbs/breadcrumbs.view',
  'hbs!csui/controls/breadcrumbspanel/impl/breadcrumbspanel',
  'i18n!csui/controls/breadcrumbs/impl/breadcrumb/impl/nls/lang',
  'csui-ext!csui/controls/breadcrumbspanel/breadcrumbspanel.view',
  'css!csui/controls/breadcrumbspanel/impl/breadcrumbspanel'
], function (module, _, Marionette, AncestorCollectionFactory, ApplicationScopeModelFactory, CommonConfig,
    BreadcrumbsView,
    BreadcrumbsPanelTemplate, lang, extns) {
  'use strict';

  let config = module.config();
  _.defaults(config, {
    enableHome: CommonConfig.enableFeatureInSmartView() || false
  });

  var BreadcrumbsPanelView = Marionette.LayoutView.extend({

    attributes: {id: 'breadcrumb-wrap'},

    className: 'binf-container-fluid',

    template: BreadcrumbsPanelTemplate,

    ui: {
      tileBreadcrumb: '.tile-breadcrumb',
      breadcrumbsWrap: '#breadcrumb-wrap'
    },

    regions: {
      breadcrumbsInner: '.breadcrumb-inner'
    },

    templateHelpers: function () {
      return {
        breadcrumbAria: lang.breadcrumbAria
      };
    },

    constructor: function BreadcrumbsPanelView(options) {

      Marionette.LayoutView.apply(this, arguments);

      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(this.applicationScope, 'change:breadcrumbsVisible',
          this._showOrHideBreadcrumbs);

      this.ancestors = this.options.context.getCollection(AncestorCollectionFactory);

      this.listenTo(this, 'dom:refresh', function () {
        if (this.breadcrumbs) {
          this.breadcrumbs.refresh(); // calls _adjustToFit
        }
      });

      var viewStateModel = this.options.context.viewStateModel;
      viewStateModel &&
      this.listenTo(viewStateModel, 'change:' + viewStateModel.CONSTANTS.START_ID,
          this.updateStopIdFromViewState.bind(this)).listenTo(viewStateModel,
          'change:' + viewStateModel.CONSTANTS.BREADCRUMB, this._showOrHideBreadcrumbs.bind(this));
    },

    onRender: function () {
      this._showOrHideBreadcrumbs();
    },

    _showOrHideBreadcrumbs: function () {
      if (this.ancestors.blockId !== undefined) {
        this.$el.removeClass('csui-hide-breadcrumbs');
      }
      var context = this.options.context,
        viewStateModel = context && context.viewStateModel,
        viewStateBreadcrumbs = viewStateModel &&
          viewStateModel.get(viewStateModel.CONSTANTS.BREADCRUMB),
        opts = {
          context: context,
          node: this.ancestors && this.ancestors.node,
          connector: this.ancestors && this.ancestors.connector
        },
        self = this,
        availableExtensions = _.filter(_.flatten(extns, true), function (extn) {
          var hideBreadcrumbs = extn.hideBreadcrumbs && _.isFunction(extn.hideBreadcrumbs) ?
            extn.hideBreadcrumbs(opts) : !!extn.hideBreadcrumbs;
          if (hideBreadcrumbs && self.applicationScope.get("previousBreadcrumbVisibility") === undefined) {
            self.$el.addClass('csui-hide-breadcrumbs');
            var previousBreadcrumbVisibility = self.applicationScope.get('breadcrumbsVisible');
            self.applicationScope.set('previousBreadcrumbVisibility', previousBreadcrumbVisibility, { silent: true });
          }
          return hideBreadcrumbs;
        });

      if (availableExtensions.length) {
        if (this.applicationScope.get('breadcrumbsVisible')) {
          this.applicationScope.set('breadcrumbsVisible', false);
        }
        this.applicationScope.set({ 'hiddenByExtension': true, 'hideToggleButton': true });
      } else {
        this.applicationScope.set({ 'hideToggleButton': false, 'hiddenByExtension': false });
        // to retain breadcrumb visibility state of previous container
        if (this.applicationScope.get("previousBreadcrumbVisibility") !== undefined) {
          this.ancestors.blockId = this.ancestors.node.get('id');
          this.$el.addClass('csui-hide-breadcrumbs');
          this.applicationScope.set('breadcrumbsVisible', this.applicationScope.get("previousBreadcrumbVisibility"));
          this.applicationScope.set('previousBreadcrumbVisibility', undefined, { silent: true });
        }
      }

      if (viewStateBreadcrumbs !== undefined) {
        this._breadcrumbsVisible = viewStateBreadcrumbs;
      } else {
        this._breadcrumbsVisible = this.applicationScope.get('breadcrumbsVisible');
      }
      const brandingSettingCodes = this.options?.context?.navigationHeaderView?.brandingConfigData?.get("brandingSettingCodes");
      this._breadcrumbsAvailable = this.ancestors.isFetchable();
      if (this._breadcrumbsVisible && this._breadcrumbsAvailable) {
        if (!this.breadcrumbs) {
          this.breadcrumbs = new BreadcrumbsView({
            context: this.options.context,
            collection: this.ancestors,
            fetchOnCollectionUpdate: false,
            enableHome: config.enableHome,
            theme: 'dark',
            honorCustomizations: true,
            textColor: brandingSettingCodes?.breadcrumbColor,
          });
          this.$el.removeClass('binf-hidden');
          this.breadcrumbsInner.show(this.breadcrumbs);
          //calling synchronization method to fix LPAD-117249, regressed due to LPAD-113765
          this.breadcrumbs.synchronizeCollections();
          this.$el.addClass('breadcrumb-wrap-visible');
          this.triggerMethod("tabable", this);
          this.breadcrumbs.triggerMethod("refresh:tabindexes");
          this.updateStopIdFromViewState();
        }
      } else {
        if (this.breadcrumbs) {
          this.$el.removeClass('breadcrumb-wrap-visible').addClass('binf-hidden');
          this.breadcrumbsInner.empty();
          delete this.breadcrumbs;
        }
      }
    },

    updateStopIdFromViewState: function () {
      var viewStateModel = this.options.context.viewStateModel;
      var start_id = viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.START_ID);
      start_id && this.breadcrumbs &&
      this.breadcrumbs.updateStopId(viewStateModel.get(viewStateModel.CONSTANTS.START_ID));
    },
    // TODO is this hide and show pair still used?
    hideBreadcrumbs: function () {
      if (this.breadcrumbs) {
        this.breadcrumbs.hideSubCrumbs();
      }
      this.$el.removeClass('breadcrumb-wrap-visible');
      this.triggerMethod("tabable:not", this);
      // the tabable region reacts to the isVisible state, so we use an explicit hide to prevent it from still being tabable
      this.$el.hide();
    },

    showBreadcrumbs: function () {
      this.$el.addClass('breadcrumb-wrap-visible');
      this.triggerMethod("tabable", this);
      this.$el.show();
      this.breadcrumbs && this.breadcrumbs.triggerMethod("refresh:tabindexes");
    },

    isTabable: function () {
      if (this.breadcrumbs) {
        return this.ancestors.size() > 1;
      } else {
        return false;
      }
    }

  });

  return BreadcrumbsPanelView;
});


csui.define('csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',['smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
], function (SmartLayoutViewEventsPropagationMixin) {
  'use strict';

  return SmartLayoutViewEventsPropagationMixin;

});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/perspective.panel/impl/perspective.with.breadcrumb',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-perspective-view-container "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"editperspectiveMode") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"loc":{"start":{"line":3,"column":44},"end":{"line":3,"column":119}}})) != null ? stack1 : "")
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"editperspectiveMode") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"loc":{"start":{"line":4,"column":4},"end":{"line":6,"column":11}}})) != null ? stack1 : "")
    + "    <div class=\"csui-perspective-view csui-normal-scrolling\"></div>\n</div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "csui-perspective-dynamic-layout-container";
},"4":function(container,depth0,helpers,partials,data) {
    return "    <div class=\"csui-sidebar cs-sticky-ribbon\"></div>\n";
},"6":function(container,depth0,helpers,partials,data) {
    return "<div class=\"csui-perspective-view\"></div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-perspective-breadcrumb\"></div>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"enableSideBar") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(6, data, 0),"loc":{"start":{"line":2,"column":0},"end":{"line":11,"column":7}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('csui_controls_perspective.panel_impl_perspective.with.breadcrumb', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/perspective.panel/impl/perspective.with.breadcrumb.view',[
  'csui/lib/underscore', 'csui/lib/marionette',
  'csui/utils/namedsessionstorage',
  'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/controls/breadcrumbspanel/breadcrumbspanel.view',
  'csui/utils/contexts/factories/ancestors',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/utils/commonconfig.util',
  'hbs!csui/controls/perspective.panel/impl/perspective.with.breadcrumb'
], function (_, Marionette,
    NamedSessionStorage,
    UserModelFactory,
    ApplicationScopeModelFactory,
    BreadcrumbsPanelView,
    AncestorCollectionFactory,
    LayoutViewEventsPropagationMixin,
    CommonConfigUtil,
    template) {
  'use strict';

  
  const enableSideBar = CommonConfigUtil.enableSideBar();

  var PerspectiveWithBreadcrumbView = Marionette.LayoutView.extend({
    className: 'cs-perspective-with-breadcrumb-view',

    template: template,
    templateHelpers: function () {
      return {
        enableSideBar: enableSideBar && this.options.perspectiveView?.options?.perspectiveMode,
        editperspectiveMode: this.options.perspectiveView?.options?.perspectiveMode==="edit"
      };
    },
    regions: {
      sidebarRegion: '.csui-sidebar',
      breadcrumbRegion: '.csui-perspective-breadcrumb',
      perspectiveRegion: '.csui-perspective-view'
    },

    constructor: function PerspectiveWithBreadcrumbView(options) {
      options || (options = {});
      this.perspectiveView = options.perspectiveView;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);

      this.propagateEventsToRegions(); // propagate dom:refresh to child views

      // "proxy" some attributes/functions from the perspectiveView to this wrapper view
      this._supportMaximizeWidget = this.perspectiveView._supportMaximizeWidget;
      this._supportMaximizeWidgetOnDisplay = this.perspectiveView._supportMaximizeWidgetOnDisplay;
      if (_.isFunction(this.perspectiveView.serializePerspective)) {
        this.serializePerspective = function (perspectiveModel) {
          return this.perspectiveView.serializePerspective.apply(
              this.perspectiveView, arguments);
        };
      }
      if (_.isFunction(this.perspectiveView.swapLayout)) {
        this.swapLayout = function (perspectiveModel) {
          return this.perspectiveView.swapLayout.apply(
            this.perspectiveView, arguments);
        };
      }
      this.widgetsResolved = this.perspectiveView.widgetsResolved;

      var perspectiveType = this.options.context.perspective.get('type');
      var perspectiveMarginClass;

      switch (perspectiveType) {
        case 'left-center-right':
        case 'sidepanel-right':
        case 'sidepanel-left':
        case 'tabbed':
          perspectiveMarginClass = 'cs_perspective_no_left_right_margin';
          break;
        default:
          perspectiveMarginClass = 'cs_perspective_with_left_right_margin';
      }

      this.$el.addClass(perspectiveMarginClass);

      this.user = this.options.context.getModel(UserModelFactory);
      var context = this.options.context,
          viewStateModel = context && context.viewStateModel;
      if (viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.BREADCRUMB) === undefined) {
        this.listenTo(this.user, 'change', this.updateUserPreferences);
      }
      this.applicationScope = this.options.context.getModel(ApplicationScopeModelFactory);

      this.listenTo(this.applicationScope, 'change:breadcrumbsVisible',
          this._showOrHideBreadcrumbs);

      if (enableSideBar && !this.sidebarView) {
        let that = this;
          csui.require(['csui/perspective.manage/sidebar/pman.sidebar.container.view'], function (PManSideBarContainerView) {
            that.sidebarView = new PManSideBarContainerView(Object.assign(that.options, {
              context: that.options.context,
              targetView: "edit",
              perspectiveType: that.perspectiveView?.options?.type
            }));
            
          });
      }
    },

    onRender: function () {
      var ancestors = this.options.context.getCollection(AncestorCollectionFactory);
      var breadcrumbsAvailable = ancestors.isFetchable();
      
      // inform the whole application that there are no breadcrumbs available
      this.applicationScope.set('breadcrumbsAvailable', breadcrumbsAvailable);

      // only if breadcrumbs are available, render and show the breadcrumbs
      if (breadcrumbsAvailable) {
        var breadcrumbsPanel = new BreadcrumbsPanelView({
          context: this.options.context
        });
        this.breadcrumbRegion.show(breadcrumbsPanel);
      }

      this.perspectiveRegion.show(this.perspectiveView);

      const mode = this.options.perspectiveView?.options?.perspectiveMode;
      if (enableSideBar && (mode === "edit" || mode === "personalize")) {
        this.el.classList.remove("cs_perspective_with_left_right_margin");
        this.el.classList.add("cs_perspective_no_left_right_margin");
        mode === "edit" && this.sidebarView && this.sidebarRegion.show(this.sidebarView);
      }

    },
    
    onDomRefresh: function () {
      var context = this.options.context,
          viewStateModel = context && context.viewStateModel;
      // if the viewStateModel defines how the breadcrumbs should behave, then we will follow it
      // and ignore the user preferences. the folderbrowser2.widget expects the breadcrumbs to follow
      // the viewStateModel flag.
      if (viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.BREADCRUMB) !== undefined) {
        this._setBreadcrumbsVisibility(viewStateModel.get(viewStateModel.CONSTANTS.BREADCRUMB));
        return;
      }
      this.updateUserPreferences();
    },

    updateUserPreferences: function () {
      var userId = this.user.get('id');
      this.userPreferences = userId ? new NamedSessionStorage(
          'userPreferences:' + userId) : undefined;
      if (this._isRendered && this.userPreferences) {
        this._setBreadcrumbsVisibility(true);
      } else {
        this._setBreadcrumbsVisibility(false);
      }
    },

    _showOrHideBreadcrumbs: function (args1, args2) {
      var breadcrumbsVisible = this.applicationScope.get('breadcrumbsVisible');
      this._setBreadcrumbsVisibility(breadcrumbsVisible);
    },

    _setBreadcrumbsVisibility: function (visible) {
      var breadcrumbsAvailable = this.applicationScope.get('breadcrumbsAvailable');
      if (visible && breadcrumbsAvailable) {
        this.$el.addClass('csui-breadcrumbs-visible');
        this.perspectiveView.$el.addClass('csui-breadcrumbs-visible');
      } else {
        this.$el.removeClass('csui-breadcrumbs-visible');
        this.perspectiveView.$el.removeClass('csui-breadcrumbs-visible');
      }
      if (this.userPreferences) {
        this.userPreferences.set('breadcrumbs-visible', visible);
        // to retain breadcrumb visibility state of previous container
        if (this.applicationScope.get("hiddenByExtension") && this.applicationScope.get("previousBreadcrumbVisibility") !== undefined) {
          this.userPreferences.set('previousBreadcrumbVisibility', this.applicationScope.get("previousBreadcrumbVisibility"));
        }
        if (this.applicationScope.get("hiddenByExtension") && this.applicationScope.get("previousBreadcrumbVisibility") === undefined) {
          this.applicationScope.set("previousBreadcrumbVisibility", this.userPreferences.get("previousBreadcrumbVisibility"));
        }
      }
      this.applicationScope.set('breadcrumbsVisible', visible);
    }
  });

  _.extend(PerspectiveWithBreadcrumbView.prototype, LayoutViewEventsPropagationMixin);

  return PerspectiveWithBreadcrumbView;
});


csui.define('csui/controls/perspective.panel/perspective.with.breadcrumb.factory',['require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/controls/perspective.panel/perspective.factory',
  'csui/controls/perspective.panel/impl/perspective.with.breadcrumb.view'
], function (require, _, $, PerspectiveFactory, PerspectiveWithBreadcrumbView) {

  var PerspectiveWithBreadcrumbFactory = PerspectiveFactory.extend({

    constructor: function PerspectiveWithBreadcrumbFactory(options) {
      PerspectiveWithBreadcrumbFactory.__super__.constructor.apply(this, arguments);
      this.options = options || {};
    },

    createPerspective: function (model) {
      var self = this;
      return PerspectiveFactory.prototype.createPerspective.call(this, model)
          .then(function (perspectiveView) {

            return new PerspectiveWithBreadcrumbView({
              context: self.options.context,
              perspectiveView: perspectiveView,
              supportMaximizeWidget: perspectiveView._supportMaximizeWidget
            });
          });
    }

  });

  return PerspectiveWithBreadcrumbFactory;
});


csui.define('css!csui/controls/perspective.panel/impl/perspective.panel',[],function(){});

csui.define('csui/controls/perspective.panel/perspective.panel.view',['require', 'module', 'csui/lib/jquery',
  'csui/lib/underscore', 'csui/lib/marionette',
  'csui/controls/perspective.panel/perspective.with.breadcrumb.factory',
  'csui/controls/progressblocker/blocker',
  'csui/utils/commandhelper',
  'csui/controls/perspective.panel/perspective.animator',
  'css!csui/controls/perspective.panel/impl/perspective.panel',
  'csui/lib/jquery.redraw', 'csui/lib/jquery.scrollbarwidth'
], function (require, module, $, _, Marionette, PerspectiveWithBreadcrumbFactory,
    BlockingView, CommandHelper, PerspectiveAnimator) {
  'use strict';

  var config = _.defaults({}, module.config(), {
    progressWheel: true,
    waitForData: true,
    // May improve smoothness of animation, if some widgets render asynchronously
    perspectiveShowDelay: 0,
    limitTimeToWaitForData: true,
    maximumTimeToWaitForData: 1000,
    detachableBlockingView: true
  });

  if (!config.waitForData) {
    config.perspectiveShowDelay = 0;
  }

  var pageUnloading = false;
  $(window).on('beforeunload.' + module.id, function (event) {
    pageUnloading = true;
  });

  var PerspectivePanelView = Marionette.ItemView.extend({
    className: 'cs-perspective-panel',

    template: false,

    constructor: function PerspectivePanelView() {
      Marionette.View.prototype.constructor.apply(this, arguments);
      _.defaults(this.options, {
        progressWheel: config.progressWheel,
        waitForData: config.waitForData,
        perspectiveShowDelay: config.perspectiveShowDelay,
        limitTimeToWaitForData: config.limitTimeToWaitForData,
        maximumTimeToWaitForData: config.maximumTimeToWaitForData,
        detachableBlockingView: config.detachableBlockingView
      });
      var context = this.options.context;
      this.perspectiveFactory = this.options.perspectiveFactory ||
                                new PerspectiveWithBreadcrumbFactory({
                                  context: context
                                });
      this.perspectiveAnimator = new PerspectiveAnimator(this);
      BlockingView.imbue(this);
      this.blockingView.showloadingWheel = true;
      this.blockingView.makeGlobal(this.options.detachableBlockingView);

      this.listenTo(context, "maximize:widget", this._addMaximizedWidget);
      this.listenTo(context, "restore:widget:size", this._removeMaximizedWidget);

      this.listenTo(context, 'change:perspective', this.onChangePerspective);

      this.listenTo(context, 'enter:edit:perspective', this.onEnterEditPerspective)
          .listenTo(context, 'exit:edit:perspective', this.onExitEditPerspective)
          .listenTo(context, 'reload:perspective', this.handlePerspectiveReload)
          .listenTo(context, 'serialize:perspective', this.onSerializePerspective)
          .listenTo(context, "serialize:welcomepage", this.serializeWelcomepage)
          .listenTo(context, "unblock:actions", this.unblockActions)
        .listenTo(context, 'header:change', function (brandingChanges) {
          this.brandingSettingsModel = brandingChanges;
        })
          .listenTo(context, 'swap:layout', function(perspectiveModel){
            this.currentPerspectiveView.swapLayout(perspectiveModel);
          });

      // Context change start with requesting the perspective and then
      // either by changing it and rebuilding the context, or just by re-fetching
      // the context, of the perspective does not change.  Use the
      // perspective request for blocking and context sync, which comes always
      // at last, for unblocking.
      if (this.options.progressWheel) {
        var fetchTimeout;
        this
            // Perspective is fetched at the beginning of navigation. It may
            // happen twice, if the perspective target is overridden. It may
            // not happen at all, if the perspective is fixed on the client.
            .listenTo(context, 'request:perspective', this._startPerspectiveLoading)
            .listenTo(context, 'error:perspective', this._finishPerspectiveLoading)
            // Data is fetched after the perspective has been fetched or become
            // known to the client. It can also be fetched without loading a
            // new perspective; the perspective can be reused.
            .listenTo(context, 'request', function () {
              // Do not block the perspective panel if the perspective will
              // be shown right away without waiting for the data.
              if (this.options.waitForData) {
                this._startPerspectiveLoading();
              }
              // If the data were not loaded quickly enough, unblock the
              // perspective panel and let the user start with ready widgets.
              if (this.options.limitTimeToWaitForData) {
                fetchTimeout = setTimeout(function () {
                  fetchTimeout = undefined;
                  this._finishPerspectiveLoading();
                }.bind(this), this.options.maximumTimeToWaitForData);
              }
            })
            .listenTo(context, 'sync error', function () {
              if (fetchTimeout) {
                clearTimeout(fetchTimeout);
                fetchTimeout = undefined;
              }
              this._finishPerspectiveLoading();
            });
      }
      this.listenTo(this, 'render', this.onRendered);

      this._maximizedWidgets = {};
      this._currentPespectiveStack = [];
      this._currentPerspectiveSignature = undefined;
    },

    _startPerspectiveLoading: function () {
      this.trigger('before:start:perspective:loading');

      // If actions were blocked when "request:perspective" was caught,
      // do not do it again when another "request:perspective" was caught, or
      // when eventually "request" was caught. Blocking view were disabled and
      // enabled in a short time, which would cause its flickering on the page.
      if (!this.actionsBlocked) {
        this.actionsBlocked = true;
        this.blockActions();
      }
    },

    _finishPerspectiveLoading: function () {
      // This method mey be called twice if the perspective showing handler
      // timed out and the perspective was shown before the data were loaded.
      if (this.actionsBlocked) {
        this.actionsBlocked = false;
        this.unblockActions();
      }
      this.trigger('after:finish:perspective:loading');
    },

    onEnterEditPerspective: function (perspectiveToEdit) {
      this.blockActions();
      this.isSwitchingEditMode = true; // To bypass animation
      this.doChangePerspective(perspectiveToEdit)
          .always(function () {
            this.isSwitchingEditMode = false;
            this.unblockActions();
            this.options.context.trigger('finish:enter:edit:perspective');
          }.bind(this));
    },

    /**
     * Serialize perspective configuration and Trigger back to save perspective
     */
    onSerializePerspective: function (perspectiveModel) {
      this.blockActions();
      if (this.brandingSettingsModel) {
        this.options.context.trigger('save:header', this.brandingSettingsModel);
      }
      if (_.isFunction(this.currentPerspectiveView.serializePerspective)) {
        let previousType;
        const previousPerspectiveView = this.currentPerspectiveView?.user?.get('perspective');
        if(previousPerspectiveView && previousPerspectiveView.type){
          previousType =  previousPerspectiveView.type;
        }
        var self = this;
        this.currentPerspectiveView.serializePerspective(perspectiveModel)
            .done(function (perspective) {             
              perspective.perspective.previousType = previousType; // adding pervious layout
              self.options.context.trigger('save:perspective', perspective);
            })
            .fail(function (error) {
              self.options.context.trigger('save:perspective', {error: error});
              self._showModalError({message: error});
            })
            .always(function () {
              self.unblockActions();
            });
      } 
    },

    /**
     * Serialize perspective configuration for saving multiple welcome pages from SmartView
     * @param {*} currentPModel, Object, this contains the current perspective model which needs to be serialized
     * @param {*} action, boolean, whether to perform any action once serialization is completed
     * @param {*} nextPModel, Object, this contains the next perspective model which should be loaded once serialization is completed
     * @param {*} ignoreErrors, boolean, all widgets even which contains errors needs to be persisted when switching between perspectives in top ribbon.
     */
    serializeWelcomepage: async function (currentPModel, action, nextPModel, ignoreErrors = false) {
      this.blockActions();
      if (typeof (this.currentPerspectiveView.serializePerspective) === 'function') {
        try {
          const perspective = await this.currentPerspectiveView.serializePerspective(currentPModel, ignoreErrors);
          delete currentPModel.getPerspective().options?.perspectiveMode;
          currentPModel.update(perspective);
          this.options.context.trigger("finish:serialize:welcomepage", currentPModel, action, nextPModel);
        }
        catch (error) {
          this._showModalError({ message: error });
        }
        finally {
          this.unblockActions();
        }
      }
    },

    onExitEditPerspective: function (perspectiveToEdit) {
      this.blockActions();
      this.isSwitchingEditMode = true; // To bypass animation
      this.doChangePerspective(this.options.context.perspective)
          .always(function () {
            this.isSwitchingEditMode = false;
            this.unblockActions();
            this.options.context.trigger('finish:exit:edit:perspective');
          }.bind(this));
    },

    handlePerspectiveReload: function () {
      this.onExitEditPerspective();
    },

    onRendered: function () {
      //Check if the perspective model is populated when the view rendered
      // for he first time. If it is, load the perspective and show it.
      if (this.options.context.perspective.get('type')) {
        this.onChangePerspective();
      }
    },

    onChangePerspective: function (targetPerspective, sourceModel) {
      this.doChangePerspective(targetPerspective, sourceModel);
    },

    doChangePerspective: function (targetPerspective, sourceModel) {
      if (this._isRendered) {
        var context     = this.options.context,
            self        = this,
            perspective = targetPerspective || this.options.context.perspective,
            deferred    = $.Deferred();
        // If we caught unload event earlier and now we change to another
        // perspective, let's assume, that page unloading was cancelled
        pageUnloading = false;
        // Actions will be unblocked in _swapPerspective to cover loading
        // of perspective view and widgets and their initial rendering.
        if (this.options.progressWheel) {
          this.blockActions();
        }
        this.triggerMethod('before:create:perspective', this, {
          perspective: perspective
        });
        this.perspectiveFactory.createPerspective(perspective)
            .done(function (perspectiveView) {
              self.triggerMethod('create:perspective', this, {
                perspective: perspective,
                perspectiveView: perspectiveView
              });
              self._currentPespectiveStack.push(perspectiveView);
              perspectiveView.widgetsResolved.always(function (res) {
                self.triggerMethod('resolve:widgets', this, {
                  perspective: perspective,
                  perspectiveView: perspectiveView
                });
                context.clear();
                // Prevent failed widgets to be slided to the perspective
                if (!pageUnloading) {
                  var enableMaximizeButton = res.length > 1;
                  self._setSupportMaximizeWidget(perspectiveView, perspective,
                      enableMaximizeButton);
                  self._swapPerspective(perspectiveView, perspective, sourceModel)
                      .always(function () {
                        deferred.resolve(perspectiveView);
                      });
                } else {
                  deferred.resolve(perspectiveView);
                }
                self._currentPespectiveStack.splice(0,
                    self._currentPespectiveStack.indexOf(perspectiveView));
              });
              self._currentPespectiveStack.splice(0,
                  self._currentPespectiveStack.indexOf(perspectiveView));
            })
            .fail(function (error) {
              if (self.options.progressWheel) {
                self.unblockActions();
              }
              // Prevent error box about perspective failure showing up
              if (!pageUnloading) {
                self._showError(error);
              }
              deferred.reject(error);
            });
        return deferred.promise();
      }
      return $.Deferred().resolve().promise();
    },

    _isInPerspectiveEditMode: function (perspective) {
      var perspectiveOptions = perspective && perspective.get('options') ?
                               perspective.get('options') : {};
      return perspectiveOptions.perspectiveMode === 'edit';
    },

    _setSupportMaximizeWidget: function (perspectiveView, perspective, enableMaximizeButton) {
      if (this._isInPerspectiveEditMode(perspective) ||  // Maximize not allowed in Edit Perspective
          // mode
          perspectiveView._supportMaximizeWidget !== true || !enableMaximizeButton) {
        $("body").removeClass("csui-support-maximize-widget");
      } else {
        $("body").addClass("csui-support-maximize-widget");
      }
    },

    _triggerDomRefreshOnCurrentPerspective: function () {
      if (this.currentPerspectiveView) {
        this.currentPerspectiveView.triggerMethod('dom:refresh');
      }
    },

    _setShowingMaximizedWidget: function (showingMaximizedWidget) {
      if (showingMaximizedWidget) {
        $("body").addClass("csui-maximized-widget-mode");
      } else {
        $("body").removeClass("csui-maximized-widget-mode");
      }
    },

    _addMaximizedWidget: function (ev) {
      if (this._isInPerspectiveEditMode(this.currentPerspective)) {
        // Maximize not allowed in Edit Perspective mode
        return;
      }
      ev.widgetView.$el.addClass('csui-expand-view');
      if (this._maximizedWidgets[this._getCurrentPerspectiveSignature()] === undefined) {
        var maximizedWidgetInfo = {
          perspectiveSignature: this._getCurrentPerspectiveSignature(),
          cellAddress: this.getCellAddress(ev)
        };
        this._maximizedWidgets[maximizedWidgetInfo.perspectiveSignature] = maximizedWidgetInfo;
        this._maximizeWidgetView(maximizedWidgetInfo.cellAddress);
      }
      this._triggerDomRefreshOnCurrentPerspective();
    },

    getCellAddress: function (ev) {
      return (ev.widgetView ? ev.widgetView.$el.parent().attr("data-csui-cell_address") :
              ev.currentPerspectiveView.$el.find(".binf-row").children().attr(
                  "data-csui-cell_address"));
    },

    _removeMaximizedWidget: function (ev) {
      ev.widgetView.$el.removeClass('csui-expand-view');
      delete this._maximizedWidgets[this._getCurrentPerspectiveSignature()];
      this._restoreWidgetViewSize(ev.widgetView);
      this._triggerDomRefreshOnCurrentPerspective();
    },

    _getPerspectiveViewEl: function () {
      var perspectiveViewEl;
      if (this.currentPerspectiveView.$el.hasClass('csui-perspective-view')) {
        perspectiveViewEl = this.currentPerspectiveView.$el;
      } else {
        perspectiveViewEl = this.currentPerspectiveView.$el.find('.csui-perspective-view');
      }
      return perspectiveViewEl;
    },

    _maximizeWidgetView: function (cellAddress) {
      var perspectiveViewEl = this._getPerspectiveViewEl();
      perspectiveViewEl.find(".binf-row > div").each(function () {
        $(this).attr("data-csui-mwv-old-class", $(this).attr("class"));
        if ($(this).attr("data-csui-cell_address") === cellAddress && $(this).find('.csui-expand-view').length) {
          $(this).parent().addClass("csui-maximized-row");
          $(this).attr("class", "binf-col-xs-12 csui-maximized-column");
        } else {
          $(this).attr("class", "binf-hidden-xs binf-hidden-sm binf-hidden-md binf-hidden-lg");
        }
      });
      this._setShowingMaximizedWidget(true);
      this.currentPerspectiveView.perspectiveView.trigger('expand:view');
    },

    _restoreWidgetViewSize: function (widgetView) {
      var $widgetRow = widgetView.$el.parent().parent();

      $widgetRow.removeClass("csui-maximized-row");
      var perspectiveViewEl = this._getPerspectiveViewEl();
      perspectiveViewEl.find(".binf-row > div").each(function () {
        $(this).attr("class", $(this).attr("data-csui-mwv-old-class"));
      });

      this._setShowingMaximizedWidget(false);
      this.currentPerspectiveView.perspectiveView.trigger('expand:view');
    },

    _getCurrentPerspectiveSignature: function () {
      if (this._currentPerspectiveSignature === undefined) {
        var cellSignatures = [];
        !!this.currentPerspectiveView &&
        this.currentPerspectiveView.$el.find(".binf-row > div").each(function () {
          var address = $(this).attr("data-csui-cell_address");
          var widgetType = $(this).attr("data-csui-widget_type");
          var classNames = $(this).attr("class");

          if (address === undefined) {
            address = "";
          }

          cellSignatures.push([address, widgetType, classNames].join(","));
        });

        this._currentPerspectiveSignature = cellSignatures.join("|");
      }

      return this._currentPerspectiveSignature;
    },

    _resetWidgetMaximization: function () {
      this._setShowingMaximizedWidget(false);
      this._maximizedWidgets = {};
    },

    _swapPerspective: function (perspectiveView, perspective, sourceModel) {
      var deferred = $.Deferred();
      var self = this;
      var showTimeout;
      var perspectiveShown;

      var scopeId = window.location.href;
      scopeId = scopeId.substr(scopeId.indexOf('#'));

      function showPerspective() {
        if (showTimeout) {
          clearTimeout(showTimeout);
        }
        // If the perspective-loading timeout called this callback, the
        // context fetch will follow, once its models have all been done.
        if (perspectiveShown) {
          return;
        }
        perspectiveShown = true;
        // Generic waiting until the widgets and other components
        // re-render their contents after they received fresh data
        // would be complicated.
        _.delay(function () {
          // Prevent widgets showing errors to be slided to the perspective
          if (!pageUnloading) {
            self._showPerspective(perspectiveView, perspective, deferred);
          }
        }, self.options.perspectiveShowDelay);
      }

      function fetchData() {
        self.options.context
            .fetch()
            .fail(function (error) {
              // Prevent error box about context failure showing up, if the
              // current action has been aborted and other page gets loaded
              if (!pageUnloading) {
                if (window.csui && window.csui.mobile) {
                  // LPAD-59873: (this code is only run in mobile and doesn't affect smart UI) On mobile, we would like to
                  // render the perspective upon error code 500. We do this because we would still like to use the app even
                  // if we don't have access to certain shortcut tile widgets on the home page
                  if (error.statusCode === 500 && (window.location.href.indexOf('#') === -1 ||
                                                   window.location.href.indexOf('#home') !== -1)) {
                    showPerspective();
                    return;
                  } else if (error.statusCode === 0) {
                    CommandHelper.showOfflineMessage(error);
                  } else {
                    self._showModalError(error);
                    self.options.context.trigger('reject:perspective', error);
                  }

                  perspectiveView.destroy();
                } else {
                  showPerspective();
                }
              }
            })
            .done(showPerspective);
      }

      this._resetWidgetMaximization();

      // make rendering of perspective view asynchronous
      // this speeds up fetch of node children in node.perspective.plugin
      setTimeout(function () {
        perspectiveView.render();
        // Actions were blocked in doChangePerspective, where the process
        // of loading the perspective view and widgets has started.
        if (this.options.progressWheel) {
          this.unblockActions();
        }
        if (this.options.waitForData) {
          fetchData();
          if (this.options.limitTimeToWaitForData) {
            showTimeout = setTimeout(showPerspective, this.options.maximumTimeToWaitForData);
          }
        } else {
          var eventName = this.currentPerspectiveView ?
                          'swap:perspective' : 'show:perspective';
          this.once(eventName, fetchData);
          showPerspective();
        }
      }.bind(this));

      return deferred;
    },

    /**
     * Perspective show / transition for enter, exit from edit mode
     */
    _showPerspectiveForEditMode: function (perspectiveView, perspective) {
      this.currentPerspectiveView.destroy();

      this.currentPerspectiveView = perspectiveView;
      this.currentPerspective = perspective;
      this._currentPerspectiveSignature = undefined;

      perspectiveView.triggerMethod('before:show');
      this.$el.append(perspectiveView.el);
      perspectiveView.triggerMethod('show');
    },

    _showPerspective: function (perspectiveView, perspective, deferred) {
      var body = $(document.body),
          self = this;
      var perViewIndex = this._currentPespectiveStack.indexOf(perspectiveView);
      if (perViewIndex === -1) {
        // this perspectiveView is no longer required to show, since perspective(s) after this are displayed.
        return;
      }
      // Invalidate all perspective before current perspective to stop them from displaying.
      this._currentPespectiveStack.splice(0, perViewIndex);

      function finishShowingPerspective(perspectiveView) {
        body.scrollTop(0);
        self.perspectiveAnimator.finishAnimation();
        self.currentPerspectiveView = perspectiveView;
        self.currentPerspectiveView.triggerMethod('dom:refresh');
        self.currentPerspective = perspective;
        deferred.resolve(perspectiveView);

        //Clicking upon home icon in breadcrumb set focus to the first accessible element.
        if (self.currentPerspectiveView?.applicationScope?.get('id') === '') {
          if(!(self.currentPerspectiveView?.options?.context?.navigationHeaderView?.el.querySelector("otc-skiplinks"))){
            let tabableElements = self.currentPerspectiveView?.options?.context?.navigationHeaderView?.el.querySelectorAll("[tabindex='0']");
            let focusablesSelectors = _.filter(tabableElements, function (selector) {
              return $(selector).is(':visible') && !$(selector).hasClass('csui-logo');
            });
            $(focusablesSelectors[0]).trigger('focus');
          }
        }
      }

      if (!!this.isSwitchingEditMode) {
        // Switching in / out of Edit mode, no swap animation required.
        this._showPerspectiveForEditMode(perspectiveView, perspective);
        deferred.resolve(perspectiveView);
        if(this.options.context.pmanView?.foundDeprecatedWidgets) {
          this.options.context.pmanView?.perspective.trigger("perspective:modified", this);
          delete this.options.context.pmanView.foundDeprecatedWidgets;
        }
        return;
      }

      // Setting a fixed size to the perspective panel solves two
      // problems, which cause disturbance in the transition:
      //
      // * Scrollbar appears on the page, when the old perspective is still
      //   visible, if the new perspective is taller than the viewport and
      //   the old one was not.
      //
      // * Safari on on iOS 9 zooms out, when the new perspective is added
      //   to the perspective panel, so that both perspectives can be seen
      //   anz zooms in again, when the old perspective is destroyed.
      // Suppress the scrollbar only if the current perspective
      // did not need it
      this.perspectiveAnimator.startAnimation(perspectiveView);

      if (this.currentPerspectiveView) {
        this.triggerMethod('before:swap:perspective', this, {
          oldPerspectiveView: this.currentPerspectiveView,
          newPerspectiveView: perspectiveView
        });
        this.perspectiveAnimator.swapPerspective(this.currentPerspectiveView, perspectiveView)
            .done(function () {
              var oldPerspectiveView = self.currentPerspectiveView;
              self.currentPerspectiveView.destroy();
              finishShowingPerspective(perspectiveView);
              self.triggerMethod('swap:perspective', self, {
                oldPerspectiveView: oldPerspectiveView,
                newPerspectiveView: perspectiveView
              });
            });
      } else {
        this.triggerMethod('before:show:perspective', this, {
          newPerspectiveView: perspectiveView
        });
        this.perspectiveAnimator.showPerspective(perspectiveView)
            .done(function () {
              finishShowingPerspective(perspectiveView);
              self.triggerMethod('show:perspective', self, {
                newPerspectiveView: perspectiveView
              });
            });

      }
    },

    _showError: function (error) {
      csui.require(['csui/controls/globalmessage/globalmessage'
      ], function (GlobalMessage) {
        GlobalMessage.showMessage('error', error.message);
      });
    },

    _showModalError: function (error, options) {
      csui.require(['csui/dialogs/modal.alert/modal.alert'
      ], function (ModalAlert) {
        ModalAlert.showError(error.message, options);
      });
    }
  });

  return PerspectivePanelView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/breadcrumbs/impl/breadcrumb/impl/breadcrumb',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <a href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"url") || (depth0 != null ? lookupProperty(depth0,"url") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"url","hash":{},"loc":{"start":{"line":2,"column":11},"end":{"line":2,"column":18}}}) : helper)))
    + "\" class=\"binf-dropdown-toggle csui-subcrumb csui-acc-focusable\" role=\"button\"\n     data-binf-toggle=\"dropdown\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"subcrumbAria") || (depth0 != null ? lookupProperty(depth0,"subcrumbAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"subcrumbAria","hash":{},"loc":{"start":{"line":3,"column":45},"end":{"line":3,"column":61}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"subcrumbTooltip") || (depth0 != null ? lookupProperty(depth0,"subcrumbTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"subcrumbTooltip","hash":{},"loc":{"start":{"line":3,"column":70},"end":{"line":3,"column":89}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":91},"end":{"line":3,"column":99}}}) : helper)))
    + "</a>\n  <ul class=\"binf-dropdown-menu\" role=\"menu\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"subcrumbs") : depth0),{"name":"each","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"loc":{"start":{"line":5,"column":4},"end":{"line":12,"column":13}}})) != null ? stack1 : "")
    + "  </ul>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"inactive") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"loc":{"start":{"line":6,"column":6},"end":{"line":11,"column":13}}})) != null ? stack1 : "");
},"3":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <li role=\"menuitem\"><a data-id=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"name") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"name") : depth0), depth0))
    + "</a>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <li role=\"menuitem\"><a class='csui-breadcrumb csui-acc-focusable' href=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"url") : depth0), depth0))
    + "\"\n               data-id=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"name") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"name") : depth0), depth0))
    + "</a>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"inactive") : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.program(10, data, 0),"loc":{"start":{"line":15,"column":2},"end":{"line":20,"column":9}}})) != null ? stack1 : "");
},"8":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":16,"column":4},"end":{"line":16,"column":12}}}) : helper)))
    + "\n";
},"10":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <a class='csui-breadcrumb csui-acc-focusable' href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"url") || (depth0 != null ? lookupProperty(depth0,"url") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"url","hash":{},"loc":{"start":{"line":18,"column":56},"end":{"line":18,"column":63}}}) : helper)))
    + "\" data-id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"loc":{"start":{"line":18,"column":74},"end":{"line":18,"column":80}}}) : helper)))
    + "\"\n       title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":19,"column":14},"end":{"line":19,"column":22}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":19,"column":24},"end":{"line":19,"column":32}}}) : helper)))
    + "</a>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"hasSubCrumbs") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(7, data, 0),"loc":{"start":{"line":1,"column":0},"end":{"line":21,"column":7}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('csui_controls_breadcrumbs_impl_breadcrumb_impl_breadcrumb', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/breadcrumbs/breadcrumb.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/node.links/node.links', 'csui/utils/base',
  'hbs!csui/controls/breadcrumbs/impl/breadcrumb/impl/breadcrumb',
  'i18n!csui/controls/breadcrumbs/impl/breadcrumb/impl/nls/lang'
], function (_, $, Marionette, nodeLinks, base, template, lang) {
  'use strict';

  var BreadcrumbItemView = Marionette.ItemView.extend({
    tagName: 'li',

    template: template,

    modelEvents: {
      change: 'render'
    },

    events: {
      'click a.csui-breadcrumb': 'onClickLink'
    },

    onClickLink: function (e) {
      if (base.isControlClick(e)) {
        // do nothing, let's execute browser's default behaviour as it is in both ctrl+click and
        // command+click in mac.
      } else {
        e.preventDefault();
        e.stopPropagation();

        var model = this.model;
        if (model.get('subcrumbs').length > 0) {
          var id = $(e.target).data('id');
          model = this._getModel(id);
        }
        this.triggerMethod('click:ancestor', model);
      }
    },

    className: function () {
      var cname,
          // Constructor of this object has not been finished yet;
          // subcrumbs as an array have not been ensured yet
          subCrumbs = this.model.get('subcrumbs');

      if (this.options.isLastChild) {
        cname = 'binf-active';
      } else if (subCrumbs && subCrumbs.length > 0) {
        cname = 'binf-dropdown';
      } else {
        cname = 'tail';
      }

      return cname;
    },

    /**
     * If the ancestor points to a real node, which is connected to a server, set href of the link
     * to the open the container perspective of the ancestor
     *
     * @param crumb
     * @returns {string}
     */
    getAncestorUrl: function (crumb) {
      var connector = crumb.connector || crumb.collection.connector;
      return crumb.get('id') > 0 && (connector) &&
             nodeLinks.getUrl(crumb, {connector: connector}) || '#';
    },

    /**
     * It returns the actual display name based on the availablity of suitable parameter
     * existance in the model.
     *
     * @returns {string}
     */
    getDisplayName: function () {
      return this.model.attributes.displayName || this.model.attributes.name_formatted ||
             this.model.attributes.name;
    },

    templateHelpers: function () {
      var options   = this.options,
          subCrumbs = _.map(this.model.get('subcrumbs'), _.bind(function (crumb) {
            return _.extend(crumb.toJSON(), {url: this.getAncestorUrl(crumb)});
          }, this));
      return {
        inactive: this.model.get('inactive') || options.isLastChild,
        hasSubCrumbs: subCrumbs.length > 0,
        subcrumbs: subCrumbs,
        name: this.getDisplayName(),
        url: this.getAncestorUrl(this.model),
        subcrumbTooltip: lang.subcrumbTooltip,
        subcrumbAria: lang.subcrumbAria
      };
    },

    onRender: function () {
      // aria-current can not be set on the last/active element as that is not a link. html validity issue.
      // TODO the inactive/informational last element is counted by the screenreader but can not be reached
    },

    constructor: function BreadcrumbItemView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      // Make using the view-model easier in this view
      if (!this.model.has('subcrumbs')) {
        this.model.set('subcrumbs', [], {silent: true});
      }
    },

    _getModel: function (id) {
      var subCrumbs = this.model.get('subcrumbs'),
          model     = null;

      for (var i = 0; i < subCrumbs.length; i++) {
        if (subCrumbs[i].get('id') === id) {
          model = subCrumbs[i];
          break;
        }
      }
      return model;
    }
  });

  return BreadcrumbItemView;
});

csui.define('csui/controls/breadcrumbs/impl/breadcrumb/breadcrumb.view',[
  'csui/controls/breadcrumbs/breadcrumb.view'
], function (BreadcrumbItemView) {
  'use strict';

  //console.warn(
  //    'DEPRECATED: depend on the module "csui/controls/breadcrumbs/breadcrumb.view" instead.');

  return BreadcrumbItemView;
});

csui.define('csui/controls/form/pub.sub',['csui/lib/underscore', 'csui/lib/backbone'], function (_, Backbone) {
  'use strict';
  //const PubSub = _.extend({}, Backbone.Events);
  return _.extend({}, Backbone.Events);
});

csui.define('csui/controls/mixins/dynamic.toolitems/dynamic.toolitems.mixin',[
  'module',
  'nuc/lib/underscore',
  'nuc/utils/log',
], function (module, _, log) {
  'use strict';

  log = log(module.id);

  var DynamicToolItemsMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeDynamicToolItems(options) {
          // Allow both for convenience, similar to Backbone.
          let { model, collection } = options
          if (!model) {
            model = collection;
          }
          // Ask for initial dynamic tool items.
          this._requestUpdateToolbars({ silent: true, ...options });
          // Actions on toolbars can be loaded later.
          if (model && model.delayedActions) {
            // Once the model gets refreshed, remove previously added dynamic
            // tool items and let the new ones be appended.
            this.listenTo(model, 'sync', () => {
              this._restoreToolbars(options);
              this._requestUpdateToolbars(options);
            });
            // Update the toolbars after promoted.
            this.listenTo(model, 'update:actions:delayed',
              () => this._requestUpdateToolbars(options));
            this.listenTo(model, 'update:actions:lazy',
              () => this._requestUpdateToolbars(options));
          }
        },

        _restoreToolbars({ toolbarItems, toolbarNames, silent }) {
          for (const toolbarName of toolbarNames) {
            // If tool items are going to be added, trigger only the update event.
            toolbarItems[toolbarName].restoreSnapshot({ silent });
          }
        },

        async _requestUpdateToolbars({ silent, toolbarItems, toolbarNames, eventArgs }) {
          const promises = toolbarNames.map(toolbarName =>
            this
              ._requestUpdateToolbar({ toolbarName, toolItemFactory: toolbarItems[toolbarName], eventArgs })
              .then(toolItems => ({ [toolbarName]: toolItems })));
          // [ { toolbar1: [ { button1 }, { button2 } ] }, { toolbar2: [ { button2 }, { button3 } ] } ]
          const toolItemsArray = await Promise.all(promises);
          // { toolbar1: [ { button1 }, { button2 } ], toolbar2: [ { button2 }, { button3 } ] }
          const toolItemsObject = Object.assign({}, ...toolItemsArray);
          for (const toolbarName in toolItemsObject) {
            const toolItemFactory = toolbarItems[toolbarName];
            const toolItems = toolItemsObject[toolbarName];
            if (toolItems.length) {
              for (const toolItem of toolItems) {
                toolItemFactory.addItem(toolItem, { silent: true });
              }
              log.debug('update toolbar {0}: {1}, count: {2}', toolbarName, !silent, toolItems.length) && console.log(log.last);
              if (!silent) {
                toolItemFactory.collection.trigger('update', toolItemFactory.collection);
              }
            } else {
              log.debug('update toolbar {0}: no items', toolbarName) && console.log(log.last);
            }
          }
        },

        async _requestUpdateToolbar({ toolbarName, toolItemFactory, eventArgs }) {
          const promises = [];
          this.triggerMethod('before:updateToolbar', {
            ...eventArgs, toolbarName, toolItemFactory,
            async() {
              let done, called = 0;
              promises.push(new Promise(resolve => done = resolve));
              return arg => {
                called++;
                called > 1 && log.warn('done was called multiple times: {0}', called) && console.warn(log.last);
                return done(arg);
              };
            }
          });
          // [ [ { button1 }, { button2 } ], undefined, [ { button2 }, { button3 } ]]
          const toolItemsArray = await Promise.all(promises);
          // [ { button1 }, { button2 }, { button2 }, { button3 } ]
          const toolItems = toolItemsArray.filter(Boolean).flat();
          // [ { button1 }, { button2 }, { button3 } ]
          return [...new Set(toolItems)];
        }
      });
    }
  };

  return DynamicToolItemsMixin;
});


csui.define('csui/controls/mixins/keyboard.navigation/modal.keyboard.navigation.mixin',['csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/base'], function (_, $, base) {
  'use strict';

  //
  // Mixin for a modal View to trap keyboard navigation.
  //
  // Note: for completeness, also do the following in your View code
  // - capture the in-focus element before opening your modal view
  // - set focus on the first focusable element after your modal is shown after animation
  // - set focus back to the prior in-focus element after closing your modal view
  //
  var ModalKeyboardNavigationMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {

        _rebuildFocusableElements: function () {
          this.focusableElements = base.findFocusables(this._focusHolder);
        },

        /**
         * Calling this on DOM changes will allow re-building of focusable elements
         */
        refreshFocusEngage: function () {
          this._rebuildFocusableElements();
        },

        /**
         * Maintains the tab focus on the provided element to trap KN
         */
        _maintainTabFocus: function (modalElement) {
          this._focusHolder = modalElement;
          this._rebuildFocusableElements();

          var self = this;
          modalElement.on('keydown', function (e) {
            var currentIndex   = self.focusableElements.index(e.target),
                focusableCount = self.focusableElements.length,
                cancelEvent    = false;
            if (currentIndex === -1) {
              // Unknown element. Element could be created after engage.
              // Calling 'dom:refresh' is recommended on DOM changes 
              return;
            }
            if (e.keyCode === 9) {
              if (!e.shiftKey && currentIndex === focusableCount - 1) {
                // Tab on last focusable element
                self.focusableElements.first().trigger('focus');
                cancelEvent = true;
              } else if (e.shiftKey && currentIndex === 0) {
                // Shift tab on first focusable element
                self.focusableElements.last().trigger('focus');
                cancelEvent = true;
              }
            }
            cancelEvent && e.preventDefault();
            e.stopPropagation();
          });

          this.listenTo(this, 'dom:refresh', function () {
            this.refreshFocusEngage();
          });

          var disengage = function disengage() {
            modalElement.off('keydown');
          };
          return {
            disengage: disengage
          };
        },

        // Params:
        // - modalElement : optional; the modal element. Default is the view's el.
        engageModalKeyboardFocusOnOpen: function (modalElement) {
          this._allyHandles || (this._allyHandles = []);
          modalElement = $(modalElement || this.el);

          // make sure Tab key (also Shift-Tab) controlled focus is trapped within tabsequence
          this._allyHandles.push(this._maintainTabFocus(modalElement));
        },

        disengageModalKeyboardFocusOnClose: function () {
          if (this._allyHandles) {
            while (this._allyHandles.length > 0) {
              // ally handles have a common API method disengage()
              this._allyHandles.pop().disengage();
            }
          }
        },

        hasEngagedModalKeyboardFocus: function () {
          return this._allyHandles && this._allyHandles.length;
        }
      });
    }
  };

  return ModalKeyboardNavigationMixin;
});

csui.define('csui/controls/tab.panel/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/controls/tab.panel/impl/nls/root/lang',{
  deleteTooltip: 'Delete',
  deleteTabAria: 'Delete {0}',
  gotoNextTooltip: 'Show next tab',
  gotoPreviousTooltip: 'Show previous tab',
  requiredTooltip: 'Required',
  dropdownButtonTitle: 'More options',
  dropdownButtonAria: 'Select properties page, currently {0}',
  onlyRequiredFieldsLabel: 'Only required fields (*)'
});




/* START_TEMPLATE */
csui.define('hbs!csui/controls/tab.panel/requiredfield/impl/tab.contents.header.requiredfield',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"required-field-switch binf-hidden\">\n  <span\n    id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"requiredFieldsLabelId") || (depth0 != null ? lookupProperty(depth0,"requiredFieldsLabelId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"requiredFieldsLabelId","hash":{},"loc":{"start":{"line":3,"column":8},"end":{"line":3,"column":33}}}) : helper)))
    + "\"\n    class=\"only-required-fields-label\"\n    title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"onlyRequiredFieldsLabel") || (depth0 != null ? lookupProperty(depth0,"onlyRequiredFieldsLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"onlyRequiredFieldsLabel","hash":{},"loc":{"start":{"line":5,"column":11},"end":{"line":5,"column":38}}}) : helper)))
    + "\"\n  >"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"onlyRequiredFieldsLabel") || (depth0 != null ? lookupProperty(depth0,"onlyRequiredFieldsLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"onlyRequiredFieldsLabel","hash":{},"loc":{"start":{"line":6,"column":3},"end":{"line":6,"column":30}}}) : helper)))
    + "</span>\n  <div class=\"required-fields-switch\"></div>\n</div>";
}});
Handlebars.registerPartial('csui_controls_tab.panel_requiredfield_impl_tab.contents.header.requiredfield', t);
return t;
});
/* END_TEMPLATE */
;



csui.define('csui/widgets/metadata/impl/metadata.persistencereqswitchflow',['csui/lib/underscore','csui-ext!csui/widgets/metadata/impl/metadata.persistencereqswitchflow'], function (_,extraFlows) {
    'use strict';
    /*action in each object is needed to store state in local storage as action:requiredSwitch.
    Also priority need to be given so that while validating if we get two flows ,a possible 
    use case where the priority with lowest numerical value is given as highest priroty.If we get same
    highest priority flows then latest added flow will be taken into consideration.
    */
    const customFlows = [
      {
        action: 'create',
        priority: 2,
        decides: function(options){
            return options.action === this.action;
        }
      },
      {
        action: 'copy',
        priority: 1,
        decides: function(options){
            return options.action === this.action;
        }
      },
      {
        action: 'move',
        priority: 1,
        decides: function(options){
            return options.action === this.action;
        }
      },
      {
        action: 'properties',
        priority: 2,
        decides: function(options){
            return options.context?.getModel('applicationScope').id === this.action;
        }
      },
      {
        type: 848,
        priority: 1,
        action: "businessworkspace",
        decides: function(options){
          return options.node.attributes.type === this.type;
        }
      }
    ];

    let allFlows;
    if(!extraFlows) {
      allFlows = customFlows
    } else {
    allFlows = _.extend(customFlows, extraFlows);
    }

    return {
      getPersistanceFlow : function(options){
        const allAppliedFlows = allFlows.filter((obj)=>  {
          try{ 
          return obj.decides(options) === true;
          } catch(err){
            return false;
          }});
        let highPriority = Infinity;
        let highPriorityObject = null;
        for(const flow of allAppliedFlows){
          if(flow.priority <= highPriority){
            highPriority = flow.priority;
            highPriorityObject = flow;
          }
        }
        return highPriorityObject;
      }

    }

  });

csui.define('css!csui/controls/tab.panel/requiredfield/impl/tab.contents.header.requiredfield',[],function(){});

csui.define('csui/controls/tab.panel/requiredfield/tab.contents.header.requiredfield.view',[
  "module",
  "csui/utils/commonconfig.util",
  "require",
  "csui/lib/jquery",
  "csui/lib/underscore",
  "csui/lib/backbone",
  "csui/lib/marionette",
  "csui/controls/form/pub.sub",
  "csui/models/version",
  "csui/utils/contexts/factories/user",
  "csui/utils/namedlocalstorage",
  'i18n!csui/controls/tab.panel/impl/nls/lang',
  "hbs!csui/controls/tab.panel/requiredfield/impl/tab.contents.header.requiredfield",
  "csui/widgets/metadata/impl/metadata.persistencereqswitchflow",
  "css!csui/controls/tab.panel/requiredfield/impl/tab.contents.header.requiredfield",
  "csui/lib/binf/js/binf",
], function (
  module,
  CommonConfig,
  require,
  $,
  _,
  Backbone,
  Marionette,
  PubSub,
  VersionModel,
  UserModelFactory,
  NamedLocalStorage,
  lang,
  tabContentsHeaderTemplate,
  MetaDataPersistenceReqSwitchFlow
) {
  "use strict";

  let config = module.config();
  _.defaults(config, {
    enablePersistanceForRequiredToggle:
      CommonConfig.enableFeatureInSmartView() || false,
  });

  var TabContentsHeaderView = Marionette.ItemView.extend({
    template: tabContentsHeaderTemplate,

    ui: {
      requiredSwitchEle: ".required-field-switch", //container of required field switch
      requiredSwitchIcon: ".required-field-switch > div.required-fields-switch",
    },

    events: {
      "click @ui.requiredSwitchIcon": "onClickRequiredIconDiv",
      keydown: "onKeyInView",
    },

    constructor: function TabContentsHeaderView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.pubsubPostFix =
        (this.options.node instanceof VersionModel ? "v" : "p") +
        this.options.node.get("id");
      const currentUserId = this.options.context
        .getModel(UserModelFactory)
        .get("id");
      (this.namedLocalStorage = new NamedLocalStorage(
        `metadataPreferences:${currentUserId}`
      )),
        (this.requiredFieldsLabelId = _.uniqueId("requiredFields"));

      var objPubSubId =
        "pubsub:tab:contents:header:view:change:tab:title:" +
        this.pubsubPostFix;
      PubSub.off(objPubSubId);

      this.listenTo(PubSub, objPubSubId, this._changeTabTitle);

      this.listenTo(this.options?.collection, "add", function (model) {
        !!model.get("required") && this._showRequiredSwitch();
      });
      this.listenTo(this.options?.collection, "remove", function (model) {
        if (!this.isRequiredCatPresent()) {
          this._hideRequiredSwitch();
        }
      });

      this.listenTo(
        this,
        "metadata:schema:updated",
        function (model) {
          if (!this.isRequiredCatPresent()) {
            this._hideRequiredSwitch();
          } else {
            this._showRequiredSwitch();
          }
        },
        this
      );
    },

    templateHelpers: function () {
      return {
        onlyRequiredFieldsLabel: lang.onlyRequiredFieldsLabel,
        requiredFieldsLabelId: this.requiredFieldsLabelId,
      };
    },

    onRender: function () {
      this.requiredFieldSwitchModel = new Backbone.Model({
        data: !!this._persistRequiredSwitch(),
      });
      var self = this;

      //fix for grunt out-release
      csui.require(["csui/controls/form/fields/booleanfield.view"], function (
        BooleanFieldView
      ) {
        self.requiredFieldSwitchView = new BooleanFieldView({
          mode: "writeonly",
          model: self.requiredFieldSwitchModel,
          labelId: self.requiredFieldsLabelId,
        });
        self.requiredFieldSwitchView.render();
        self.listenTo(
          self.requiredFieldSwitchView,
          "field:changed",
          function (event) {
            //toggle
            // required fields
            var objPubSubId =
              "pubsub:tab:contents:header:view:switch:" + self.pubsubPostFix;

            PubSub.trigger(objPubSubId, { on: event.fieldvalue });
            const reqSwitchObj =
              MetaDataPersistenceReqSwitchFlow.getPersistanceFlow(self.options);
            if (
              config.enablePersistanceForRequiredToggle &&
              reqSwitchObj?.action
            ) {
              this.namedLocalStorage.set(
                `${reqSwitchObj?.action}:requireSwitched`,
                event.fieldvalue
              );
            } else if (!!self.options.node.collection) {
              self.options.node.collection.requireSwitched = event.fieldvalue;
            }
          }
        );
        self
          .$(".required-fields-switch")
          .append(self.requiredFieldSwitchView.$el);
        if (self.isRequiredCatPresent()) {
          self._showRequiredSwitch();
        }

        PubSub.off("pubsub:header:rightbar:view:change:switch:status");
        self.listenTo(
          PubSub,
          "pubsub:header:rightbar:view:change:switch:status",
          function (reset) {
            if (!!reset) {
              if (!!self.requiredFieldSwitchView.curVal) {
                self.requiredFieldSwitchView.$el.trigger("click");
              }
            } else if (
              !!self.requiredFieldSwitchModel &&
              self.requiredFieldSwitchModel.get("data") !== undefined &&
              !self.requiredFieldSwitchModel.get("data")
            ) {
              if (!!this._persistRequiredSwitch()) {
                self.requiredFieldSwitchView.$el.trigger("click");
              }
            }
          }
        );
      });
    },

    currentlyFocusedElement: function (event) {
      if (
        !this.ui.requiredSwitchEle.hasClass("binf-hidden") &&
        this.requiredFieldSwitchView
      ) {
        return $(this.ui.requiredSwitchIcon.find(":input"));
      } else {
        return undefined;
      }
    },

    onKeyInView: function (e) {
      var event = e || window.event;
      var target = event.target || event.srcElement;
      if (event.keyCode === 32 || event.keyCode === 13) {
        // space key(32) or enter key(13)
        if (
          !this.ui.requiredSwitchEle.hasClass("binf-hidden") &&
          this.requiredFieldSwitchView
        ) {
          event.preventDefault();
          event.stopPropagation();
          // need timeout to overcome FireFox space press
          setTimeout(
            _.bind(function () {
              $(target).trigger("click");
            }, this),
            200
          );
        }
      }
      return undefined;
    },

    // this method is triggered by keyboard
    onClickRequiredIconDiv: function (event) {
      this.requiredFieldSwitchView.onClickWriteField(event);
    },

    _persistRequiredSwitch: function () {
      const reqSwitchObj = MetaDataPersistenceReqSwitchFlow.getPersistanceFlow(
        this.options
      );
      const shouldOverrideRequireSwitched =
        config.enablePersistanceForRequiredToggle && reqSwitchObj?.action;
      return shouldOverrideRequireSwitched
        ? this.namedLocalStorage.get(`${reqSwitchObj?.action}:requireSwitched`)
        : this.options.node.collection?.requireSwitched;
    },

    _hideRequiredSwitch: function () {
      this.ui.requiredSwitchEle.addClass("binf-hidden");
      //turn off if no required cat is present
      !!this.requiredFieldSwitchView &&
        !!this.requiredFieldSwitchView.getValue() &&
        this.requiredFieldSwitchView.ui.flagWriteField.trigger("click");
    },

    _showRequiredSwitch: function () {
      this.ui.requiredSwitchEle.removeClass("binf-hidden");
    },

    isRequiredCatPresent: function () {
      if (!!this.options.hideRequiredFieldsSwitch) {
        // Permanently hide "required" switch
        return false;
      }
      var isRequiredCatPresent = false,
        i = 0;
      for (; !isRequiredCatPresent && i < this.collection.models.length; i++) {
        isRequiredCatPresent =
          this.collection.models[i].get("required") === true;
      }
      return isRequiredCatPresent;
    },
  });

  return TabContentsHeaderView;
});


// Renders tab panel made of links and content
csui.define('csui/controls/tab.panel/tab.panel.view',['csui/models/version',
  'smart/controls/tab.panel/tab.panel.view',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/tab.panel/requiredfield/tab.contents.header.requiredfield.view',
  'csui/controls/form/pub.sub',
], function (VersionModel, SmartTabPanelView, TabableRegionBehavior, TabContentHeaderRequiredFieldView, PubSub) {
  'use strict';

  var TabPanelView = SmartTabPanelView.extend({

    constructor: function TabPanelView(options) {
      options || (options = {});
      options.regionBehavior =  {
        behaviorClass: TabableRegionBehavior,
        notSetFocus: true,
        initialActivationWeight: 100,
      };
      SmartTabPanelView.prototype.constructor.call(this, options);
      this.listenTo(this, "render:content:header:right:view", this._initializeContentHeaderRequiredFieldView);
    },

    _initializeContentHeaderRequiredFieldView: function (contentsView, resolve) {
      contentsView.contentHeaderRequiredFieldView = new TabContentHeaderRequiredFieldView (contentsView.options);
      resolve();
    }

  });

  return TabPanelView;

});


// Renders tab panel made of links and content
csui.define('csui/controls/tab.panel/tab.panel.view.v2',['csui/utils/log', 'csui/controls/tab.panel/tab.panel.view',
], function (log,TabPanelView) {
  "use strict";
  log.warn('DEPRECATED: depend on the module "csui/controls/tab.panel/tab.panel.view" instead.');
  return TabPanelView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/otc.menu/impl/menu',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"displayName") || (depth0 != null ? lookupProperty(depth0,"displayName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"displayName","hash":{},"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":15}}}) : helper)));
}});
Handlebars.registerPartial('csui_controls_otc.menu_impl_menu', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/otc.menu/menu.item.view',[
  'nuc/lib/marionette3',
  'hbs!csui/controls/otc.menu/impl/menu',
], function (Marionette, template) {
  'use strict';
  const MenuItemView = Marionette.View.extend({
    template: template,
    tagName: function () {
      return this.model.get('overrideChildElm') ?? this.options.childElm ?? "otc-menuitem";
    },
    attributes: function () {
      return {
        checked: this.model.get('checked'),
        id: this.model.get('id')
      };
    },
    constructor: function MenuItemView(options) {
      Marionette.View.prototype.constructor.call(this, options);
    },
    events: {
      change: 'onChanged',
      'item-click': 'onChanged'
    },
    onChanged: function (event) {
      this.trigger('change:selection', { itemValue: this.model, event });
    },
  });
  return MenuItemView;
});


csui.define('csui/controls/otc.menu/menu.items.view',[
  'nuc/lib/marionette3',
  'csui/controls/otc.menu/menu.item.view',
], function (Marionette, MenuItemView) {
  'use strict';
  const MenuItemsView = Marionette.CollectionView.extend({
    tagName: function(){
      return this.options.parentElm ?? 'otc-menugroup';
    },
    attributes: function () {
      return {
        name: this.options.name
      };
    },
    childView: MenuItemView,

    childViewOptions: function() {
      return {
        childElm: this.options.childElm
      }
    },

    constructor: function MenuItemsView(options) {
      if (!options) {
        throw new Error('options object is mandatory for MenuItemsView');
      }
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },

    childViewEvents: {
      'change:selection': 'onChangeSelection', // triggered by otc-menuradio when changing the selection
    },

    onChangeSelection: function ({itemValue, event}) {
      this.trigger('change:selection', {itemValue, event });
    }
  });
  return MenuItemsView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/tab.panel/impl/tab.links.dropdown',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJatoTheme") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"loc":{"start":{"line":3,"column":0},"end":{"line":14,"column":7}}})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <otc-button\n      id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"btnId") || (depth0 != null ? lookupProperty(depth0,"btnId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"btnId","hash":{},"loc":{"start":{"line":5,"column":10},"end":{"line":5,"column":19}}}) : helper)))
    + "\"\n      class=\"cs-metadata-dropdown-jato\"\n      disabled>\n      "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedTitle") || (depth0 != null ? lookupProperty(depth0,"selectedTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedTitle","hash":{},"loc":{"start":{"line":8,"column":6},"end":{"line":8,"column":23}}}) : helper)))
    + "\n    </otc-button>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <button id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"btnId") || (depth0 != null ? lookupProperty(depth0,"btnId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"btnId","hash":{},"loc":{"start":{"line":11,"column":14},"end":{"line":11,"column":23}}}) : helper)))
    + "\" type=\"button\" class=\"cs-metadata-dropdown\" disabled>\n    <span class=\"cs-label\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedTitle") || (depth0 != null ? lookupProperty(depth0,"selectedTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedTitle","hash":{},"loc":{"start":{"line":12,"column":27},"end":{"line":12,"column":44}}}) : helper)))
    + "</span>\n  </button>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isJatoTheme") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(9, data, 0),"loc":{"start":{"line":16,"column":2},"end":{"line":37,"column":11}}})) != null ? stack1 : "")
    + "    <otc-menu \n      class=\"csui-metadata-dropdown\" \n      buttonId=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"btnId") || (depth0 != null ? lookupProperty(depth0,"btnId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"btnId","hash":{},"loc":{"start":{"line":40,"column":16},"end":{"line":40,"column":25}}}) : helper)))
    + "\" \n      ariarole=\"menu\"\n      scrollable=\"\">\n    </otc-menu>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <otc-button\n      id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"btnId") || (depth0 != null ? lookupProperty(depth0,"btnId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"btnId","hash":{},"loc":{"start":{"line":18,"column":10},"end":{"line":18,"column":19}}}) : helper)))
    + "\"\n      class=\"cs-metadata-dropdown-jato\"\n      type=\"subtleDropdown\"\n      title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dropdownButtonTitle") || (depth0 != null ? lookupProperty(depth0,"dropdownButtonTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dropdownButtonTitle","hash":{},"loc":{"start":{"line":21,"column":13},"end":{"line":21,"column":36}}}) : helper)))
    + "\"\n      arialabel=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dropdownButtonAria") || (depth0 != null ? lookupProperty(depth0,"dropdownButtonAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dropdownButtonAria","hash":{},"loc":{"start":{"line":22,"column":17},"end":{"line":22,"column":39}}}) : helper)))
    + "\"\n      tabindex=\"0\"\n    >\n      "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedTitle") || (depth0 != null ? lookupProperty(depth0,"selectedTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedTitle","hash":{},"loc":{"start":{"line":25,"column":6},"end":{"line":25,"column":23}}}) : helper)))
    + "\n    </otc-button>\n";
},"9":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"btnId") || (depth0 != null ? lookupProperty(depth0,"btnId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"btnId","hash":{},"loc":{"start":{"line":28,"column":16},"end":{"line":28,"column":25}}}) : helper)))
    + "\"\n          type=\"button\"\n          class=\"cs-metadata-dropdown\"\n          tabindex=\"0\" aria-haspopup=\"true\" aria-expanded=\"false\"\n          aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dropdownButtonAria") || (depth0 != null ? lookupProperty(depth0,"dropdownButtonAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dropdownButtonAria","hash":{},"loc":{"start":{"line":32,"column":22},"end":{"line":32,"column":44}}}) : helper)))
    + "\" \n          title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dropdownButtonTitle") || (depth0 != null ? lookupProperty(depth0,"dropdownButtonTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dropdownButtonTitle","hash":{},"loc":{"start":{"line":33,"column":17},"end":{"line":33,"column":40}}}) : helper)))
    + "\">\n      <span class=\"cs-label\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedTitle") || (depth0 != null ? lookupProperty(depth0,"selectedTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedTitle","hash":{},"loc":{"start":{"line":34,"column":29},"end":{"line":34,"column":46}}}) : helper)))
    + "</span>\n      <span class=\"cs-icon icon-caret-down\"></span>\n    </button>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-meta-data\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"single_item") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(6, data, 0),"loc":{"start":{"line":2,"column":0},"end":{"line":44,"column":9}}})) != null ? stack1 : "")
    + "</div>\n";
}});
Handlebars.registerPartial('csui_controls_tab.panel_impl_tab.links.dropdown', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/themes/csui.jato.action.icons',[], function () {
let icons = {
'actionUserAdd': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M12.069 4c0 1.427-.753 2.68-1.886 3.388A6.05 6.05 0 0 1 12.544 9h-1.482a5.04 5.04 0 0 0-3.02-1c-2.781 0-5.035 2.239-5.035 5v1c0 .552.45 1 1.007 1H8.04v1H4.014A2.007 2.007 0 0 1 2 14v-1c0-2.565 1.62-4.753 3.9-5.612A3.99 3.99 0 0 1 4.013 4c0-2.21 1.803-4 4.027-4s4.028 1.79 4.028 4M8.04 1a3.01 3.01 0 0 0-3.02 3c0 1.657 1.352 3 3.02 3a3.01 3.01 0 0 0 3.02-3c0-1.657-1.352-3-3.02-3" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M12.5 16a.5.5 0 0 1-.5-.5V14h-1.5a.5.5 0 0 1 0-1H12v-1.5a.5.5 0 0 1 1 0V13h1.5a.5.5 0 0 1 0 1H13v1.5a.5.5 0 0 1-.5.5" fill-opacity="1"/></svg>`,
'actionAdd': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M7.5 2.25a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-1 0v-10a.5.5 0 0 1 .5-.5" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M2.25 7.5a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1h-10a.5.5 0 0 1-.5-.5" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionCheckmarkSelect': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M12.505 4.49a.714.714 0 0 1 0 1.01l-6.22 6.22-2.79-2.791a.714.714 0 0 1 1.01-1.01l1.78 1.78 5.21-5.21a.714.714 0 0 1 1.01 0" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionEditSm': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M11.503 3a1.5 1.5 0 0 0-1.059.438L4.007 9.876l-.794 2.911 2.91-.794 6.439-6.437A1.497 1.497 0 0 0 11.503 3m-.956-.81a2.497 2.497 0 0 1 2.722 4.073l-6.532 6.531a.5.5 0 0 1-.222.13l-3.883 1.058a.5.5 0 0 1-.614-.614l1.059-3.883a.5.5 0 0 1 .129-.222l6.531-6.532c.232-.232.508-.415.81-.54" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionEditCancel': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-14)"><path d="M13.5 0a2.5 2.5 0 0 0-1.768.732l-3.938 3.94.707.708 3.946-3.949a1.5 1.5 0 0 1 2.13 2.114L10.62 7.5l.707.707 3.94-3.94A2.5 2.5 0 0 0 13.5 0M2.201 10.268l3.472-3.474.707.707-3.378 3.38-.79 2.906 2.915-.793L8.5 9.62l.707.707-3.467 3.467a.5.5 0 0 1-.222.129l-3.887 1.058a.5.5 0 0 1-.613-.614l1.054-3.878a.5.5 0 0 1 .13-.222M3.854 2.146a.5.5 0 1 0-.708.708l10 10a.5.5 0 0 0 .708-.708z" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-14"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionApplyToAll': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M4 9H2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2zM2 2h12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3v1h3a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4V6H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M8.498 4a.5.5 0 0 1 .5.5v6.157l1.622-1.621a.5.5 0 1 1 .707.707L8.498 12.57 5.67 9.743a.5.5 0 1 1 .707-.707l1.621 1.62V4.5a.5.5 0 0 1 .5-.5" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionArrowLeft': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="m1.04 8.5 5.1 5.345a.5.5 0 1 0 .724-.69L2.9 9h11.605a.5.5 0 1 0 0-1H2.899l3.965-4.155a.5.5 0 1 0-.723-.69z" fill-opacity="1"/></svg>`,
'actionDragHandle': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M6 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2M10 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2M11 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0M10 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0M6 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2" fill-opacity="1"/></svg>`,
'actionCheckmark': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M12.854 4.146a.5.5 0 0 1 0 .708L6.5 11.207 3.146 7.854a.5.5 0 1 1 .708-.708L6.5 9.793l5.646-5.647a.5.5 0 0 1 .708 0" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionChevronLargeDown': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M2.146 5.146a.5.5 0 0 1 .708 0L8 10.293l5.146-5.147a.5.5 0 0 1 .708.708L8 11.707 2.146 5.854a.5.5 0 0 1 0-.708" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionChevronLargeUp': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M13.854 10.854a.5.5 0 0 1-.708 0L8 5.707l-5.146 5.147a.5.5 0 0 1-.708-.707L8 4.292l5.854 5.853a.5.5 0 0 1 0 .708" clip-rule="evenodd" opacity=".89" fill-opacity="1"/></svg>`,
'actionChevronSmallRight': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M6.146 11.854a.5.5 0 0 1 0-.708L9.293 8 6.146 4.854a.5.5 0 1 1 .708-.708L10.707 8l-3.853 3.854a.5.5 0 0 1-.708 0" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionChevronSmallDown': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M4.146 6.146a.5.5 0 0 1 .708 0L8 9.293l3.146-3.147a.5.5 0 0 1 .708.708L8 10.707 4.146 6.854a.5.5 0 0 1 0-.708" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionChevronSmallUp': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M11.854 9.854a.5.5 0 0 1-.708 0L8 6.707 4.854 9.854a.5.5 0 1 1-.708-.707L8 5.293l3.854 3.854a.5.5 0 0 1 0 .707" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionClearCircleFilled': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-action-id-32)"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M13.657 2.343A8 8 0 1 1 2.343 13.657 8 8 0 0 1 13.657 2.343M6.055 4.995a.75.75 0 1 0-1.06 1.06L6.939 8 4.995 9.945a.75.75 0 0 0 1.06 1.06L8 9.061l1.945 1.944a.75.75 0 1 0 1.06-1.06L9.061 8l1.944-1.945a.75.75 0 1 0-1.06-1.06L8 6.939z" clip-rule="evenodd" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-32"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionCloseSmall': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M4.853 4.146a.5.5 0 0 0-.707.707L7.293 8l-3.147 3.146a.5.5 0 1 0 .707.708L8 8.707l3.146 3.146a.5.5 0 1 0 .707-.707L8.707 8l3.146-3.146a.5.5 0 1 0-.707-.708L8 7.293z" fill-opacity="1"/></svg>`,
'actionClose': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M2.854 2.146a.5.5 0 1 0-.708.708L7.293 8l-5.147 5.147a.5.5 0 1 0 .708.707L8 8.707l5.146 5.147a.5.5 0 0 0 .708-.708L8.707 8l5.147-5.146a.5.5 0 0 0-.708-.708L8 7.293z" fill-opacity="1"/></svg>`,
'actionCollection': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M3.084 1.223A.5.5 0 0 1 3.5 1h9a.5.5 0 0 1 .416.223l2 3A.5.5 0 0 1 15 4.5v8.667A1.833 1.833 0 0 1 13.166 15H2.833A1.833 1.833 0 0 1 1 13.167V4.5a.5.5 0 0 1 .084-.277zM3.767 2 2 4.651v8.516a.833.833 0 0 0 .833.833h10.333a.833.833 0 0 0 .834-.833V4.65L12.232 2z" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M1.5 4.5A.5.5 0 0 1 2 4h12a.5.5 0 0 1 0 1H2a.5.5 0 0 1-.5-.5M5.334 6.5a.5.5 0 0 1 .5.5 2.167 2.167 0 1 0 4.333 0 .5.5 0 0 1 1 0 3.167 3.167 0 1 1-6.333 0 .5.5 0 0 1 .5-.5" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionComment': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-action-id-72)"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M5 12v3l2.5-3H14a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1zm3 1h6a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2v2c0 .945 1.19 1.363 1.78.625z" clip-rule="evenodd" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-72"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionCommentFilled': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-7)"><path fill-rule="evenodd" d="M5 12v3l2.5-3H14a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1zm3 1h6a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2v2c0 .945 1.19 1.363 1.78.625z" clip-rule="evenodd" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path d="M15 11a1 1 0 0 1-1 1H7.5L5 15v-3H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-7"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionCopy': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M7 0H6v1h1zM1.004.248l-.75.75.996.352.102-.102zM10 .25l.75.75-1 .348-.102-.102zM5 6.2A1.2 1.2 0 0 1 6.2 5h6.6A1.2 1.2 0 0 1 14 6.2v6.6a1.2 1.2 0 0 1-1.2 1.2H6.2A1.2 1.2 0 0 1 5 12.8zm-1 0A2.2 2.2 0 0 1 6.2 4h6.6A2.2 2.2 0 0 1 15 6.2v6.6a2.2 2.2 0 0 1-2.2 2.2H6.2A2.2 2.2 0 0 1 4 12.8zm-2.996 4.57-.75-.75 1-.348.102.101zM10 2h1v1h-1zM8 0h1v1H8zM5 0H4v1h1zM2 0h1v1H2zM1 2H0v1h1zM0 4h1v1H0zm1 2H0v1h1zM0 8h1v1H0zm3 2H2v1h1z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionCreateShortcut': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2h-1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6a1 1 0 0 1 .8.4l2 2.667a1 1 0 0 1 .2.6V5h1v-.333a2 2 0 0 0-.4-1.2L11.6.8A2 2 0 0 0 10 0z" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M12.599 7.15a.5.5 0 0 1 .707-.007L15.715 9.5l-2.41 2.357a.5.5 0 1 1-.699-.714L13.774 10H10.5A1.5 1.5 0 0 0 9 11.5v1a.5.5 0 0 1-1 0v-1A2.5 2.5 0 0 1 10.5 9h3.274l-1.168-1.143a.5.5 0 0 1-.007-.707" fill-opacity="1"/></svg>`,
'actionDelete': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M11 3V1.5a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1V3H1.5a.5.5 0 0 0 0 1H3v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h1.5a.5.5 0 0 0 0-1zm-1-1.5H6V3h4zM12 4H4v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionDocument': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M2 2a2 2 0 0 1 2-2h5.05a2 2 0 0 1 1.552.74l2.95 3.632A2 2 0 0 1 14 5.632V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm11 12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h4v4.5a.5.5 0 0 0 .5.5H13zm-.226-9L9.826 1.37A1 1 0 0 0 9.05 1H9v4z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionDownload': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M8.5 1.5a.5.5 0 0 0-1 0v7.793L5.354 7.146a.5.5 0 1 0-.708.708L8 11.207l3.354-3.353a.5.5 0 0 0-.708-.708L8.5 9.293z" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M2 9a.5.5 0 0 0-1 0v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a.5.5 0 0 0-1 0v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" fill-opacity="1"/></svg>`,
'actionEdit': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-action-id-69)"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M12.503 2a1.5 1.5 0 0 0-1.059.438l-9.437 9.438-.794 2.911 2.91-.794 9.439-9.437A1.497 1.497 0 0 0 12.503 2m-.956-.81a2.497 2.497 0 0 1 2.722 4.073l-9.532 9.532a.5.5 0 0 1-.222.128l-3.883 1.06a.5.5 0 0 1-.614-.615l1.059-3.883a.5.5 0 0 1 .129-.222l9.531-9.532c.232-.232.508-.415.81-.54" clip-rule="evenodd" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-69"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionEditCancel': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-14)"><path d="M13.5 0a2.5 2.5 0 0 0-1.768.732l-3.938 3.94.707.708 3.946-3.949a1.5 1.5 0 0 1 2.13 2.114L10.62 7.5l.707.707 3.94-3.94A2.5 2.5 0 0 0 13.5 0M2.201 10.268l3.472-3.474.707.707-3.378 3.38-.79 2.906 2.915-.793L8.5 9.62l.707.707-3.467 3.467a.5.5 0 0 1-.222.129l-3.887 1.058a.5.5 0 0 1-.613-.614l1.054-3.878a.5.5 0 0 1 .13-.222M3.854 2.146a.5.5 0 1 0-.708.708l10 10a.5.5 0 0 0 .708-.708z" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-14"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionEditLayout': `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" fill="none" viewBox="0 0 17 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M12.878 1.66a2.19 2.19 0 0 1 2.302 2.82l-.074.203a2.2 2.2 0 0 1-.33.55L8.487 13.15l-.083.077a.4.4 0 0 1-.1.053l-3.3 1.25-.056.016a.44.44 0 0 1-.33-.055l-.048-.034a.44.44 0 0 1-.153-.412l.6-3.477a.44.44 0 0 1 .093-.204l6.287-7.918a2.2 2.2 0 0 1 .477-.43l.184-.11c.19-.101.395-.174.606-.215zM.923 13.995a1 1 0 0 1-.893-.892L.025 13a1 1 0 0 1 1-1l.103.005a1 1 0 0 1 .897.995l-.004.102a1 1 0 0 1-.996.898zm12.05-11.337a1.2 1.2 0 0 0-.338.083l-.106.05a1.2 1.2 0 0 0-.36.293L5.979 10.88l-.408 2.366 2.237-.845 6.185-7.79.012-.015c.1-.12.174-.259.22-.408l.028-.113a1.2 1.2 0 0 0-.066-.688l-.05-.105a1.2 1.2 0 0 0-.206-.28l-.086-.08a1.2 1.2 0 0 0-.3-.18l-.11-.04a1.2 1.2 0 0 0-.46-.045M3.632 8.01c.24.049.42.261.42.515l-.011.105a.53.53 0 0 1-.41.408l-.105.011h-3L.42 9.04a.525.525 0 0 1 0-1.029l.105-.01h3zm1.975-3.05c.24.05.42.261.42.515l-.011.105a.53.53 0 0 1-.409.409L5.501 6H.525L.42 5.99a.525.525 0 0 1 0-1.029l.105-.01h4.976zm3.025-2.95c.24.05.42.261.42.515l-.011.105a.53.53 0 0 1-.41.409l-.105.01h-8L.42 3.04a.525.525 0 0 1 0-1.029l.105-.01h8z" fill-opacity="1"/></svg>`,
'actionEmail': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1h12q.12 0 .232.027L8 7.39 1.768 3.027Q1.879 3 2 3m-.965.735A1 1 0 0 0 1 4v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4q0-.138-.036-.265L8.288 8.41a.5.5 0 0 1-.574 0z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionErrorCircle': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-40)"><path d="M5.172 5.172a.5.5 0 0 1 .707 0L8 7.292l2.121-2.12a.5.5 0 1 1 .707.707L8.708 8l2.12 2.121a.5.5 0 1 1-.707.707L8 8.708l-2.121 2.12a.5.5 0 1 1-.707-.707L7.292 8l-2.12-2.121a.5.5 0 0 1 0-.707" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path fill-rule="evenodd" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-1 0A7 7 0 1 1 1 8a7 7 0 0 1 14 0" clip-rule="evenodd" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-40"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionFilter': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M9 8.925 14.036 2H1.964L7 8.925v5.457l2-1zM6 9.25v5.132a1 1 0 0 0 1.447.894l2-1a1 1 0 0 0 .553-.894V9.25l4.845-6.662A1 1 0 0 0 14.036 1H1.964a1 1 0 0 0-.809 1.588z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionFolder': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M0 3a2 2 0 0 1 2-2h4.172a2 2 0 0 1 1.414.586l1.121 1.121A1 1 0 0 0 9.414 3H14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm15 4v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7zm0-1V5a1 1 0 0 0-1-1H9.414A2 2 0 0 1 8 3.414L6.879 2.293A1 1 0 0 0 6.172 2H2a1 1 0 0 0-1 1v3z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionFolderBrowse': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M0 3a2 2 0 0 1 2-2h4.172a2 2 0 0 1 1.414.586l1.121 1.121A1 1 0 0 0 9.414 3H14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm15 4v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7zm0-1V5a1 1 0 0 0-1-1H9.414A2 2 0 0 1 8 3.414L6.879 2.293A1 1 0 0 0 6.172 2H2a1 1 0 0 0-1 1v3z" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M5 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0M9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0M12 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2" fill-opacity="1"/></svg>`,
'actionFolderOpen': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M13.827 5a2 2 0 0 0-2-2H8.413a1 1 0 0 1-.707-.293L6.586 1.586A2 2 0 0 0 5.172 1H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9.802a2 2 0 0 0 1.889-1.341l2.092-6A2 2 0 0 0 13.894 5zm-1 0a1 1 0 0 0-1-1H8.413A2 2 0 0 1 7 3.414L5.879 2.293A1 1 0 0 0 5.172 2H2a1 1 0 0 0-1 1v7.313l1.749-4.098A2 2 0 0 1 4.589 5zm-9.85 10h8.192-8.191M14.84 7.33l-2.093 6a1 1 0 0 1-.944.67H2.028a1 1 0 0 1-.92-1.393l2.56-6A1 1 0 0 1 4.589 6h9.306a1 1 0 0 1 .944 1.33" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionGoToLocation': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="m12.293 7-2.147 2.146a.5.5 0 0 0 .708.708L14.207 6.5l-3.353-3.354a.5.5 0 0 0-.708.708L12.293 6H5.5A3.5 3.5 0 0 0 2 9.5v3a.5.5 0 0 0 1 0v-3A2.5 2.5 0 0 1 5.5 7z" fill-opacity="1"/></svg>`,
'actionInformationCircle': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-46)"><path d="M8 6.031a.6.6 0 0 1 .6.6v4.77a.6.6 0 1 1-1.2 0v-4.77a.6.6 0 0 1 .6-.6M8 5.088a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path fill-rule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m0-1A7 7 0 1 0 8 1a7 7 0 0 0 0 14" clip-rule="evenodd" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-46"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionInformationCircleFilled': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-action-id-45)"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.25-4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5h-.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5zm-1-7.45a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0" clip-rule="evenodd" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-45"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionLanguage': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-action-id-18)"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-11.342.616H1.027a7.004 7.004 0 0 0 5.79 6.285c-1.34-1.694-2.048-4.063-2.159-6.285m1.002 0h4.68c-.123 2.29-.927 4.652-2.34 6.12-1.413-1.468-2.217-3.83-2.34-6.12m4.69-1h-4.7C5.74 5.34 6.615 2.813 8 1.283c1.386 1.53 2.26 4.057 2.35 6.333m.992 1c-.111 2.222-.82 4.59-2.16 6.285a7.004 7.004 0 0 0 5.791-6.285zm3.648-1h-3.64c-.081-2.244-.862-4.766-2.209-6.523 3.2.524 5.67 3.219 5.849 6.523m-10.34 0H1.01A7 7 0 0 1 6.86 1.093C5.513 2.85 4.73 5.373 4.649 7.616" clip-rule="evenodd" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-18"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionLicenseKey': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-8)"><path d="M11.428 5.714a1.143 1.143 0 1 0 0-2.285 1.143 1.143 0 0 0 0 2.285" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path fill-rule="evenodd" d="M5.904 6.532.218 12.218a.5.5 0 0 0-.147.353v2.858a.5.5 0 0 0 .5.5H4a.5.5 0 0 0 .5-.5v-1.786h1.786a.5.5 0 0 0 .5-.5v-1.786H8a.5.5 0 0 0 .353-.146l1.115-1.115a5.143 5.143 0 1 0-3.564-3.564M15 5.142A4.143 4.143 0 0 1 9.22 8.95L8.15 10l-.357.357H5.786v2.286H3.5v2.286H1.07v-2.15l4.78-4.78 1.197-1.225A4.143 4.143 0 1 1 15 5.143" clip-rule="evenodd" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-8"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionLink': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M9.098 2.923a3.192 3.192 0 0 1 4.513 4.513L11.328 9.72a3.19 3.19 0 0 1-4.514 0 .5.5 0 1 1 .711-.703c.856.852 2.24.85 3.095-.004l2.284-2.284a2.192 2.192 0 0 0-3.1-3.1L8.664 4.773a.5.5 0 1 1-.707-.707z" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M7.022 14.027A3.192 3.192 0 1 1 2.51 9.513L4.792 7.23a3.19 3.19 0 0 1 4.514 0l-.002.002a.5.5 0 1 1-.745.667 2.19 2.19 0 0 0-3.06.039L3.217 10.22a2.192 2.192 0 1 0 3.099 3.1l1.142-1.142a.5.5 0 1 1 .707.707z" fill-opacity="1"/></svg>`,
'actionLock': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M8.5 12.5a.5.5 0 0 0-1 0v1a.5.5 0 0 0 1 0z" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M3 5v2a1 1 0 0 0-1 1v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1V5A5 5 0 0 0 3 5m9 2V5a4 4 0 0 0-8 0v2zm-9 7V8h10v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionLockOpen': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M8 12a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 12" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M4 4.5A3.5 3.5 0 0 1 7.5 1h1A3.5 3.5 0 0 1 12 4.5a.5.5 0 0 0 1 0A4.5 4.5 0 0 0 8.5 0h-1A4.5 4.5 0 0 0 3 4.5V7a1 1 0 0 0-1 1v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1H4zM13 8H3v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionMoreCircle': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-10)"><path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path fill-rule="evenodd" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-1 0A7 7 0 1 1 1 8a7 7 0 0 1 14 0" clip-rule="evenodd" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-10"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionMoreHorizontal': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2" fill-opacity="1"/></svg>`,
'actionMove': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-53)"><path d="M2 1h7a1 1 0 0 1 1 1h1a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2v-1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path d="M7 3a2 2 0 0 0-2 2v1.132q.13.112.233.25c.173.233.43.542.767.861V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-3.083a7.5 7.5 0 0 1-1-.598V14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path d="M4.423 6.985c.44.592 1.368 1.644 2.78 2.279 1.552.698 3.22.345 3.69.245l.075-.015-1.206-1.206c-.195-.195-.255-.509-.028-.736s.54-.167.736.029l2.473 2.473-2.466 2.483a.513.513 0 0 1-.719 0 .507.507 0 0 1 .006-.712l1.337-1.337c-.892.205-2.431.242-3.657-.08-1.961-.516-3.34-2.16-3.887-2.917a.457.457 0 0 1 .128-.649c.238-.16.567-.087.738.143" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-53"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionPanelLeft': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M11 3v10h1V3z" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M5.694 6.143a.5.5 0 1 1 .7.714L5.226 8H9.5a.5.5 0 0 1 0 1H5.226l1.168 1.143a.5.5 0 0 1-.7.714L3.285 8.5z" fill-opacity="1"/></svg>`,
'actionPanelRight': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M11 3v10h1V3z" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M7.306 6.143a.5.5 0 1 0-.7.714L7.774 8H3.5a.5.5 0 0 0 0 1h4.274l-1.168 1.143a.5.5 0 0 0 .7.714L9.715 8.5z" fill-opacity="1"/></svg>`,
'actionProperties': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M9.75 3.432a1.11 1.11 0 1 1-2.219 0 1.11 1.11 0 0 1 2.219 0m-3.277 9.07c-.28-.308-.43-.59-.393-1.155.027-.416.221-1.733.376-2.787.056-.38.107-.727.143-.984.137-.969.142-1.096.142-1.096a.33.33 0 0 1 .058-.15c.068-.092.185-.166.435-.238.251-.073.712-.092 1.384 0l.092.008-.022.09a241 241 0 0 1-.742 3.076c-.111.438-.184.727-.206.83l-.043.201a7 7 0 0 0-.108.56.6.6 0 0 0 .044.363.41.41 0 0 0 .268.205.65.65 0 0 0 .376-.003c.149-.046.325-.155.511-.386.053-.075.095-.137.149-.22l.027-.041.05.006h.003c.04.005.248.028.571.183.218.104.31.208.346.288.032.074.002.144-.02.184-.09.157-.372.632-.728.972a2.06 2.06 0 0 1-1.546.597c-.582-.02-.876-.191-1.167-.503" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionPropertiesView': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M13 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1M3 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M7 4.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5M5 7.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M7 10.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5" fill-opacity="1"/></svg>`,
'actionRename': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M12 2.5a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0 0 1h.5v10h-.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1H11V3h.5a.5.5 0 0 0 .5-.5" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M2 4h7v1H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h7v1H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2M14 11h-2v1h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2v1h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1" fill-opacity="1"/></svg>`,
'actionRedo': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M13.617 5.148C11.964 2.43 8.752 1.17 5.594 2.59a6.196 6.196 0 0 0 .478 11.44.5.5 0 1 1-.345.938 7.2 7.2 0 0 1-4.047-3.714c-1.687-3.606-.122-7.89 3.493-9.571l.006-.003C8.564.157 12.004 1.313 14 3.938V1.994a.5.5 0 1 1 1 0v4.154h-4.185a.5.5 0 1 1 0-1z" fill-opacity="1"/></svg>`,
'actionRestore': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M13 5h1v8.321c0 .947-.768 1.715-1.714 1.715H6.714A1.714 1.714 0 0 1 5 13.32V7h1v6.321c0 .474.24.679.714.679h5.572c.473 0 .714-.205.714-.679z" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M10.433.197a.957.957 0 0 0-1.307.35l-.593 1.027L6.02.124a.529.529 0 1 0-.528.915l9.65 5.572a.529.529 0 1 0 .528-.916l-2.511-1.45.593-1.026a.957.957 0 0 0-.35-1.308zm-.985 1.906.543-.94 2.796 1.614-.543.94z" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M4.116 1.15a.5.5 0 0 0-.707-.007L1 3.5l2.41 2.357a.5.5 0 0 0 .699-.714L2.94 4h3.274c.829 0 1.77.68 1.77 1.508v3c0 .276.239.492.515.492a.48.48 0 0 0 .484-.492v-3C8.984 4.128 7.596 3 6.215 3H2.941l1.168-1.143a.5.5 0 0 0 .007-.707" fill-opacity="1"/></svg>`,
'actionSave': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M8.5 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M1 13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4.53a1 1 0 0 0-.278-.693l-2.427-2.53A1 1 0 0 0 11.574 1H3a2 2 0 0 0-2 2zm3.5-4a.5.5 0 0 0-.5.5V14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2v2.5A1.5 1.5 0 0 0 6.5 6h3A1.5 1.5 0 0 0 11 4.5V2h.574L14 4.53V13a1 1 0 0 1-1 1h-1V9.5a.5.5 0 0 0-.5-.5zm6.5 1v4H5v-4zM6 4.5V2h4v2.5a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionSearch': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M10.836 11.614a6 6 0 1 1 .778-.778l3.664 3.664a.55.55 0 1 1-.778.778zM11.9 7a4.9 4.9 0 1 1-9.8 0 4.9 4.9 0 0 1 9.8 0" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionSearchSmall': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M11 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0m-.836 3.871a5 5 0 1 1 .707-.707l3.018 3.018a.5.5 0 0 1-.707.707z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionSendTo': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M8.55 14.5a.5.5 0 0 0-.5-.5H3.175c-.593 0-1.075-.448-1.075-1V3c0-.552.482-1 1.075-1h9.675c.594 0 1.075.448 1.075 1v5.463a.538.538 0 0 0 1.075 0V3c0-1.105-.963-2-2.15-2H3.175c-1.187 0-2.15.895-2.15 2v10c0 1.105.963 2 2.15 2H8.05a.5.5 0 0 0 .5-.5" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M4.5 3.972a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM4 6.472a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M4 8.472a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5M13.306 10.143a.5.5 0 1 0-.7.714L13.774 12H9.5a.5.5 0 0 0 0 1h4.274l-1.168 1.143a.5.5 0 1 0 .7.714l2.409-2.357z" fill-opacity="1"/></svg>`,
'actionShare': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M3.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m0 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M12.5 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m0 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M12.5 14a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m0 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M11 5.175 5.477 7.52l-.39-.92 5.522-2.344zM10.762 12 5.238 9.656l.391-.92 5.523 2.343z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionShowToolbar': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M4.5 2a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zM9 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-1 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-3.854.854a.5.5 0 0 1 .708-.708L8 13.293l3.146-3.147a.5.5 0 0 1 .708.708L8 14.707z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionSortAscending': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M14.146 6.854a.5.5 0 0 0 .708-.708L11.5 2.793 8.146 6.146a.5.5 0 1 0 .708.708L11 4.707V12.5a.5.5 0 1 0 1 0V4.707zM1.5 12a.5.5 0 1 1 0-1h7a.5.5 0 0 1 0 1zM1.5 9a.5.5 0 1 1 0-1h5a.5.5 0 0 1 0 1zM1 5.5a.5.5 0 0 0 .5.5h2a.5.5 0 1 0 0-1h-2a.5.5 0 0 0-.5.5" fill-opacity="1"/></svg>`,
'actionSortDescending': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M11 11.293 8.854 9.146a.5.5 0 1 0-.708.708l3.354 3.353 3.354-3.353a.5.5 0 0 0-.708-.708L12 11.293V3.5a.5.5 0 0 0-1 0zM1.5 5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zM1.5 8a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM1 11.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5" fill-opacity="1"/></svg>`,
'actionSettings': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" clip-path="url(#jato-action-id-4)" clip-rule="evenodd"><path d="M11.466 8.005a3.461 3.461 0 1 1-6.923 0 3.461 3.461 0 0 1 6.923 0m-1 0a2.461 2.461 0 1 1-4.923 0 2.461 2.461 0 0 1 4.923 0" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path d="M7.21.005a1 1 0 0 0-.948.683l-.397 1.193-.71.354-1.148-.765a1 1 0 0 0-1.261.125l-1.152 1.15a1 1 0 0 0-.124 1.262l.765 1.149-.354.709-1.193.397a1 1 0 0 0-.684.949v1.587a1 1 0 0 0 .684.948l1.193.398.354.709L1.47 12a1 1 0 0 0 .124 1.262l1.151 1.15a1 1 0 0 0 1.262.126l1.149-.766.709.355.397 1.192a1 1 0 0 0 .949.684h1.587a1 1 0 0 0 .948-.684l.398-1.192.709-.355L12 14.54a1 1 0 0 0 1.262-.125l1.15-1.151A1 1 0 0 0 14.54 12l-.766-1.148.355-.71 1.192-.397a1 1 0 0 0 .684-.948V7.21a1 1 0 0 0-.684-.949l-1.192-.397-.355-.71.766-1.148a1 1 0 0 0-.125-1.261l-1.151-1.151A1 1 0 0 0 12 1.47l-1.148.765-.71-.354L9.747.688a1 1 0 0 0-.948-.683zm0 1h1.588l.397 1.192a1 1 0 0 0 .501.578l.71.355a1 1 0 0 0 1.001-.063l1.149-.765 1.15 1.15-.765 1.149a1 1 0 0 0-.062 1.002l.354.709a1 1 0 0 0 .579.501l1.192.398v1.587l-1.192.397a1 1 0 0 0-.579.502l-.354.709a1 1 0 0 0 .062 1.002l.766 1.148-1.151 1.15-1.149-.765a1 1 0 0 0-1.001-.062l-.71.354a1 1 0 0 0-.501.579l-.397 1.192H7.21l-.398-1.192a1 1 0 0 0-.501-.579l-.71-.354a1 1 0 0 0-1.001.062l-1.148.766-1.151-1.151.765-1.148a1 1 0 0 0 .062-1.002l-.354-.71a1 1 0 0 0-.578-.5l-1.193-.398V7.21l1.193-.398a1 1 0 0 0 .578-.501l.354-.71a1 1 0 0 0-.062-1.001l-.765-1.148 1.15-1.151 1.149.765a1 1 0 0 0 1.002.063l.709-.355a1 1 0 0 0 .501-.578z" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-4"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionStar': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-action-id-67)"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M7.106.67a1 1 0 0 1 1.788 0l1.908 3.81 4.254.61a1 1 0 0 1 .551 1.71l-3.069 2.95.726 4.17a1 1 0 0 1-1.445 1.06L8 13l-3.819 1.98a1 1 0 0 1-1.445-1.06l.726-4.17L.392 6.8a1 1 0 0 1 .552-1.71l4.254-.61zM8 1.116 5.858 5.396l-4.772.683 3.452 3.318-.817 4.695 4.28-2.218 4.278 2.218-.817-4.695 3.453-3.318-4.773-.683z" clip-rule="evenodd" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-67"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionStarFilled': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-action-id-61)"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M7.106.67a1 1 0 0 1 1.788 0l1.908 3.81 4.254.61a1 1 0 0 1 .551 1.71l-3.069 2.95.726 4.17a1 1 0 0 1-1.445 1.06L8 13l-3.819 1.98a1 1 0 0 1-1.445-1.06l.726-4.17L.392 6.8a1 1 0 0 1 .552-1.71l4.254-.61z" clip-rule="evenodd" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-61"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionTreeView': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M2 1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1.5v9a.5.5 0 0 0 .5.5h4v-1H4.5v-5H8V9a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v.5H4.5V5H6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm4 1H2v2h4zm6 5H9v2h3z" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M8 13a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1zm1 0h3v2H9z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionUserChange': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M9.692 15.857a.5.5 0 1 0 .7-.714L9.224 14h2.275A2.5 2.5 0 0 0 14 11.5V8.226l1.143 1.167a.5.5 0 0 0 .714-.699L13.5 6.284l-2.357 2.41a.5.5 0 1 0 .714.7L13 8.225v1.23l-.002.044v2A1.5 1.5 0 0 1 11.5 13H9.224l1.168-1.143a.5.5 0 0 0-.7-.714L7.283 13.5z" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M10.183 7.388A3.99 3.99 0 0 0 12.07 4c0-2.21-1.803-4-4.028-4S4.014 1.79 4.014 4c0 1.427.753 2.68 1.885 3.388C3.62 8.247 2 10.435 2 13v1c0 1.105.902 2 2.014 2h4.008L7 15H4.014a1.003 1.003 0 0 1-1.007-1v-1c0-2.761 2.254-5 5.034-5 .743 0 1.448.16 2.083.447q.106-.248.304-.452l.342-.35a6 6 0 0 0-.587-.257M5.021 4c0-1.657 1.352-3 3.02-3a3.01 3.01 0 0 1 3.02 3c0 1.657-1.352 3-3.02 3a3.01 3.01 0 0 1-3.02-3" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionVersionAdd': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="m6.07 5.5 1.402 3.936h.056L8.927 5.5H10l-1.899 5H6.896L5 5.5zM11.5 15a.5.5 0 0 1-.5-.5V13H9.5a.5.5 0 0 1 0-1H11v-1.5a.5.5 0 0 1 1 0V12h1.5a.5.5 0 0 1 0 1H12v1.5a.5.5 0 0 1-.5.5" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M4 1a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h4v-1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v6h1V3a2 2 0 0 0-2-2z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionVersionControl': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-64)"><path d="M2 1h6a1 1 0 0 1 1 1h1a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2v-1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path fill-rule="evenodd" d="M7 3a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 1a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z" clip-rule="evenodd" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path d="m9.07 7.5 1.402 3.935h.056L11.927 7.5H13l-1.899 5H9.896L8 7.5z" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-64"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionViewDescriptions': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M2 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M2 7.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5M2.5 10a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z" fill-opacity="1"/></svg>`,
'actionVisibility': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M8 12c-3.306 0-5.885-1.653-6.71-4C2.114 5.653 4.693 4 8 4s5.884 1.653 6.71 4c-.826 2.347-3.405 4-6.71 4m0-9c3.744 0 6.887 1.962 7.76 5-.873 3.038-4.016 5-7.76 5S1.112 11.038.24 8C1.112 4.962 4.256 3 8 3m1 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0m1 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionWindowCollapse': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M2 10a.5.5 0 0 1 .5-.5h4v4a.5.5 0 0 1-1 0v-2.293l-3.646 3.647a.5.5 0 1 1-.708-.707L4.793 10.5H2.5A.5.5 0 0 1 2 10M14.854 1.146a.5.5 0 0 1 0 .708L11.207 5.5H13.5a.5.5 0 1 1 0 1h-4v-4a.5.5 0 0 1 1 0v2.293l3.646-3.647a.5.5 0 0 1 .707 0" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionWindowExpand': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M5.5 14.5a.5.5 0 0 1-.5.5H1v-4a.5.5 0 0 1 1 0v2.293l3.646-3.647a.5.5 0 0 1 .708.707L2.707 14H5a.5.5 0 0 1 .5.5M9.646 6.354a.5.5 0 0 1 0-.708L13.293 2H11a.5.5 0 0 1 0-1h4v4a.5.5 0 0 1-1 0V2.707l-3.646 3.647a.5.5 0 0 1-.708 0" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionCheckmarkSelect': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M12.505 4.49a.714.714 0 0 1 0 1.01l-6.22 6.22-2.79-2.791a.714.714 0 0 1 1.01-1.01l1.78 1.78 5.21-5.21a.714.714 0 0 1 1.01 0" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionChevronLargeRight': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M5.146 13.854a.5.5 0 0 1 0-.708L10.293 8 5.146 2.854a.5.5 0 1 1 .708-.708L11.707 8l-5.853 5.854a.5.5 0 0 1-.708 0" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionNodeLocation': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-50)"><path fill-rule="evenodd" d="M8 4.2a3.8 3.8 0 1 0 .001 7.601A3.8 3.8 0 0 0 8 4.2M3 8a5 5 0 1 1 10.001.001A5 5 0 0 1 3 8" clip-rule="evenodd" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path d="M8 1c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.14-7-7 3.14-7 7-7m0-1a8 8 0 1 0 0 16A8 8 0 0 0 8 0" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-50"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionUpload': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M1.5 8.5A.5.5 0 0 1 2 9v4a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9a.5.5 0 0 1 1 0v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a.5.5 0 0 1 .5-.5" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M11.354 4.854a.5.5 0 0 1-.708 0L8.5 2.707V10.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 0 1-.708-.708L8 .793l3.354 3.353a.5.5 0 0 1 0 .708" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionUserGroup': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="#323435" fill-rule="evenodd" d="M5 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0" clip-rule="evenodd" fill-opacity="1"/><path fill="#323435" fill-rule="evenodd" d="M9 14v-2a4 4 0 1 0-8 0v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1M5 7a5 5 0 0 0-5 5v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2a5 5 0 0 0-5-5" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M11.25 2a2.75 2.75 0 0 1 1.215 5.218C14.512 7.844 16 9.246 16 11.016v.734c0 .966 0 2.25-1.75 2.25H11v-1h3.25c.75 0 .75-.836.75-1.25v-.437C15 9.437 13.21 8 11 8c-.437 0-.857.073-1.251.202l-.772-.772a5 5 0 0 1 .892-.301A2.75 2.75 0 0 1 11.25 2m0 1a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5" fill-opacity="1"/></svg>`,
'actionViewColumns': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M5 3v10h1V3zm5 0v10h1V3z" clip-rule="evenodd" fill-opacity="1"/><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M14 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionViewRows': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M3 14a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2zM2 5h12V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1zm0 1v3h12V6zm12 4H2v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1z" fill-opacity="1"/></svg>`,
'actionWorkspace': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M5 11H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v2h2a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3zM3 1h5a2 2 0 0 1 2 2v2H8a3 3 0 0 0-3 3v2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2m8 5h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2h2a3 3 0 0 0 3-3zm-1 0v2a2 2 0 0 1-2 2H6V8a2 2 0 0 1 2-2z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionChevronLargeLeft': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M10.854 2.146a.5.5 0 0 1 0 .708L5.707 8l5.147 5.146a.5.5 0 0 1-.707.708L4.292 8l5.853-5.854a.5.5 0 0 1 .708 0" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionRefresh': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M7.924 2C11.285 2 14 4.692 14 8s-2.715 6-6.076 6a6.09 6.09 0 0 1-5.209-2.91.5.5 0 1 0-.854.52A7.09 7.09 0 0 0 7.924 15C11.827 15 15 11.871 15 8s-3.173-7-7.076-7A7.09 7.09 0 0 0 2 4.171V1.5a.5.5 0 0 0-1 0V6h4.5a.5.5 0 0 0 0-1H2.661a6.09 6.09 0 0 1 5.263-3" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionZoomIn': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-action-id-2)"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11m4.936-1.27a6.5 6.5 0 1 0-.707.707l4.372 4.371a.5.5 0 1 0 .707-.707zM7.051 3.5a.5.5 0 0 0-1 0V6.05H3.5a.5.5 0 1 0 0 1h2.551V9.5a.5.5 0 1 0 1 0V7.05H9.5a.5.5 0 0 0 0-1H7.051z" clip-rule="evenodd" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-2"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionZoomOut': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g clip-path="url(#jato-action-id-1)"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11m4.936-1.27a6.5 6.5 0 1 0-.707.707l4.307 4.306a.5.5 0 1 0 .707-.707zM3 6.55a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5" clip-rule="evenodd" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-1"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionHelpCircle': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-5)"><path d="M6.871 5.407C6.59 5.65 6.5 5.899 6.5 6a.5.5 0 0 1-1 0c0-.49.303-.992.717-1.35A2.7 2.7 0 0 1 8 4c.809 0 1.44.203 1.877.586.442.388.623.909.623 1.414 0 .407-.23.8-.435 1.087-.222.31-.498.603-.727.826-.286.28-.524.577-.686.902-.1.2-.152.42-.152.642V10a.5.5 0 0 1-1 0v-.543c0-.378.088-.751.257-1.09.228-.454.546-.839.882-1.168.21-.205.44-.452.613-.695.19-.265.248-.435.248-.504a.85.85 0 0 0-.283-.663C9.018 5.163 8.65 5 8 5c-.48 0-.865.178-1.129.407" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path fill-rule="evenodd" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-1 0A7 7 0 1 1 1 8a7 7 0 0 1 14 0" clip-rule="evenodd" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><circle cx="8.025" cy="12.025" r=".625" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-5"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionLayouts': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-rule="evenodd" d="M6 2H2v7h4zM2 1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM14 7H9v7h5zM9 6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1zM14 2H9v2h5zM9 1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM6 12H2v2h4zm-4-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" clip-rule="evenodd" fill-opacity="1"/></svg>`,
'actionWidgetsAdd': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-48)"><path d="M5 6v1H2V6zm1-1V2a1 1 0 0 0-.897-.995L5 1H2a1 1 0 0 0-.995.897L1 2v3a1 1 0 0 0 1 1v1l-.204-.01A2 2 0 0 1 .01 5.203L0 5V2A2 2 0 0 1 1.796.01L2 0h3l.204.01A2 2 0 0 1 7 2v3l-.01.204A2 2 0 0 1 5.203 6.99L5 7V6a1 1 0 0 0 1-1M5 15v1H2v-1zm1-1v-3a1 1 0 0 0-.897-.995L5 10H2a1 1 0 0 0-.995.898L1 11v3a1 1 0 0 0 1 1v1l-.204-.01A2 2 0 0 1 .01 14.203L0 14v-3a2 2 0 0 1 1.796-1.99L2 9h3l.204.01A2 2 0 0 1 7 11v3l-.01.204a2 2 0 0 1-1.786 1.785L5 16v-1a1 1 0 0 0 1-1M14 15v1h-3v-1zm1-1v-3a1 1 0 0 0-.898-.995L14 10h-3a1 1 0 0 0-.995.898L10 11v3a1 1 0 0 0 1 1v1l-.204-.01a2 2 0 0 1-1.785-1.786L9 14v-3a2 2 0 0 1 1.796-1.99L11 9h3l.204.01A2 2 0 0 1 16 11v3l-.01.204a2 2 0 0 1-1.786 1.785L14 16v-1a1 1 0 0 0 1-1M12 6.125V.875a.5.5 0 0 1 1 0v5.25a.5.5 0 0 1-1 0" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path d="M9.813 3h5.25a.5.5 0 0 1 0 1h-5.25a.5.5 0 0 1 0-1" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-48"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'actionCloseExtraSmall': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="var(--jato-cta-content-color-tertiary, #313233ff)" d="M5.172 10.121a.5.5 0 1 0 .707.707L8 8.707l2.121 2.121a.5.5 0 1 0 .707-.707L8.709 8l2.12-2.121a.5.5 0 1 0-.707-.708L8 7.293 5.879 5.172a.5.5 0 0 0-.707.707l2.12 2.12z" fill-opacity="1"/></svg>`,
'actionAttachment': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><g fill="var(--jato-cta-content-color-tertiary, #313233ff)" clip-path="url(#jato-action-id-21)"><path d="M5.858 14.708c.428-.175.8-.426 1.034-.66l.002-.001 7.453-7.453.707.707-7.453 7.453-.025.024c-.338.33-.816.642-1.34.856-.53.217-1.15.35-1.756.268-1.586-.115-2.794-1.424-2.68-3.126a4.06 4.06 0 0 1 .795-2.175l-.003-.003.022-.023.031-.04.005.004L9.81 3.29c.38-.386.9-.605 1.441-.605.542 0 1.06.218 1.442.605.38.387.593.91.593 1.453a2.07 2.07 0 0 1-.593 1.453l-6.511 6.605a.5.5 0 0 1-.712-.702l6.51-6.605a1.071 1.071 0 0 0 0-1.503 1.02 1.02 0 0 0-.729-.306c-.272 0-.534.11-.728.307l-7.15 7.237c-.216.297-.524.84-.576 1.614-.076 1.15.717 1.993 1.769 2.063l.019.001.018.003c.383.055.825-.026 1.255-.202" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/><path d="m8.628 2.258-.106.12-.008-.007-7.222 7.111a.5.5 0 1 1-.702-.713l7.32-7.207A4.42 4.42 0 0 1 10.58.199a4.73 4.73 0 0 1 3.653 1.084 4.8 4.8 0 0 1 1.661 3.088c.133 1.091-.122 2.214-.838 2.93l-.707-.708c.432-.431.662-1.208.553-2.101a3.8 3.8 0 0 0-1.312-2.444 3.73 3.73 0 0 0-2.88-.857c-.714.093-1.39.4-1.926.91l-.04.043z" fill="var(--jato-cta-content-color-tertiary, #313233ff)" fill-opacity="1"/></g><defs><clipPath id="jato-action-id-21"><path fill="#fff" d="M0 0h16v16H0z" fill-opacity="1"/></clipPath></defs></svg>`,
};
return icons;
});


csui.define('css!csui/controls/tab.panel/impl/tab.links.dropdown',[],function(){});

csui.define('csui/controls/tab.panel/tab.links.dropdown.view',['csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'hbs!csui/controls/tab.panel/impl/tab.links.dropdown',
  'csui/controls/otc.menu/menu.items.view',
  'i18n!csui/controls/tab.panel/impl/nls/lang', 'csui/themes/csui.jato.action.icons',
  'smart/themes/theming', 'css!csui/controls/tab.panel/impl/tab.links.dropdown',
], function (_, Backbone, Marionette, template, MenuItemsView, lang, JatoIcons, theming) {
  "use strict";

  const TabLinkDropDownView = Marionette.LayoutView.extend({
    className: 'cs-tab-links binf-dropdown tile-nav',
    template: template,
    templateHelpers: function () {
      const title = this.selected?.get('title');
      return {
        single_item: this.collection.length <=1,
        isJatoTheme: theming.isJATOTheme(),
        jatoChevronSmallDown: JatoIcons.actionChevronSmallDown,
        dropdownButtonTitle: lang.dropdownButtonTitle,
        dropdownButtonAria: _.str.sformat(lang.dropdownButtonAria, title),
        btnId: _.uniqueId("cstabBtn"),
        selectedTitle: title
      };
    },
    ui: {
      tabLinkBtn: '.csui-meta-data>otc-button',
      cbTabLinkBtn: '.csui-meta-data>button'
    },
    regions: {
      selectedMenuRegion: '.csui-meta-data>otc-menu'
    },

    constructor: function TabLinkDropDownView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.selected = new Backbone.Model();
      const activeTabIndex = this.options.activeTab?.get("tabIndex");
      if (this.collection?.length === 0 || activeTabIndex > this.collection.length) return;
            let selectedTabTitle = this.options.selectedTab &&
            (this.options.selectedTab instanceof Backbone.Model && this.options.selectedTab?.get("title") ||
            this. options.selectedTab);
          if (selectedTabTitle === this.collection.at(activeTabIndex).get("title")) {
          this._setSelection(this.collection.at(activeTabIndex));
        } else {
          let matchIndex = 0;
          if (selectedTabTitle !== undefined) {
            // The view state model saves the selected tab name in the url and not title. titles can be
            // translated and that would invalidate the url if the language changes. Search in the title first
            matchIndex = this._getModelIndexByPropertyValue(selectedTabTitle, this.collection, 'title', 'name');
          }
          this._setSelection(this.collection.at(matchIndex));
          this.options.activeTab.set("tabIndex", matchIndex);
        }      
    },
    _getModelIndexByPropertyValue: function (value, collection, ...properties) {
      let indexToReturn = 0;
      const collectionLen = collection.length;
      for (let index = 0; index < collectionLen; index++) {
        const model = collection.at(index);
        if (model.get(properties[0]) === value || model.get(properties[1]) === value) {
          indexToReturn = index;
          break;
        }
      }
      return indexToReturn;
    },

    onRender: function () {
      if (this.collection.length<=1) return;
      this.linkCollection = new Backbone.Collection();
      const selectedId = this.selected.get('id');
      for (let i = 0; i < this.collection.length; i++) {
        const model = this.collection.at(i);
        model.set('displayName', model.get('title'), {silent: true});
        model.set('checked', selectedId === model.get('id'), {silent: true});
        this.linkCollection.add(model);
      }
      this.sortMenuSelectGroupView = new MenuItemsView({
        collection: this.linkCollection,
        childElm: 'otc-menuradio'
      });
      this.listenTo(this.sortMenuSelectGroupView, 'change:selection', this._selectTabItem);
      this.selectedMenuRegion.show(this.sortMenuSelectGroupView);
    },
    currentlyFocusedElement: function() {
      return theming.isJATOTheme() ? this.ui.tabLinkBtn : this.ui.cbTabLinkBtn;
    },

    _selectTabItem: function({itemValue, isSilent = true}) {
      this._setSelection(itemValue);
      this.options.activeTab.set('tabIndex', this.collection.indexOf(itemValue), {silent: isSilent});
      this.render();
      const tabPane = this.options.tabPanel?.tabContent?.children.findByModel(itemValue);
      tabPane.ensureContent();
      this._activateTab(this.options.tabPanel?.tabContent.children._views, tabPane);
      const btnLink = theming.isJATOTheme() ? this.ui.tabLinkBtn : this.ui.cbTabLinkBtn
      setTimeout(() => { btnLink.focus(); }, 0);
    },
    _setSelection: function (model) {
      this.selected.set(model.pick('id', 'title', 'name'));
    },
    _activateTab: function(views={}, selectedView) {
      const viewKeys = Object.keys(views); 
      if(viewKeys.length === 0) return;
      for (let i = 0; i < viewKeys.length; i++) {
        const key = viewKeys[i];
        const view = views[key];
        if(view === selectedView) {
          view?.el?.classList.add('binf-in', 'binf-active');
          // in case of fast switching to ensure the DOM is loaded correctly apart from properties
          this.selected.get('name')!=='properties' && view.trigger('dom:refresh');
        }else {
          view?.el?.classList.remove('binf-in', 'binf-active');
        }
      }
    },

    activateDropdownTab: function(name, isSilent) {
      this.sortMenuSelectGroupView.children.some((view) => {
        if (view.model.get('name') === name) {
          this._selectTabItem({itemValue: view.model, isSilent: isSilent});
          return true;
        }
      });
    }
  });
  return TabLinkDropDownView;
});


csui.define('csui/controls/tab.panel/tab.links.ext.scroll.mixin',['smart/controls/tab.panel/tab.links.ext.scroll.mixin'
], function (SmartTabLinksScrollMixin) {

  return SmartTabLinksScrollMixin;

});


csui.define('csui/controls/tab.panel/tab.links.ext.view',['smart/controls/tab.panel/tab.links.ext.view'
], function (SmartTabLinkCollectionViewExt) {
  "use strict";

  var TabLinkCollectionViewExt = SmartTabLinkCollectionViewExt.extend({

    constructor: function TabLinkCollectionViewExt(options) {
      this.options = options || {};
      SmartTabLinkCollectionViewExt.prototype.constructor.apply(this, arguments);
      this.listenTo(this, 'metadata:schema:updated', function (model) {
        // Re-Render model specific tab to reflect model changes - ex: required
        this.children.findByModel(model).render();
      }, this);
    }
  });

  return TabLinkCollectionViewExt;

});


csui.define('csui/controls/tab.panel/impl/tab.link.ext.view',['smart/controls/tab.panel/tab.link.ext.view',
], function (SmartTabLinkExtView) {
  "use strict";

  return SmartTabLinkExtView;

});



csui.define('csui/controls/tab.panel/tab.link.ext.view.v2',['csui/utils/log','csui/controls/tab.panel/impl/tab.link.ext.view',
], function (log, TabLinkExtView) {
  "use strict";
  log.warn('DEPRECATED: depend on the module "csui/controls/tab.panel/impl/tab.link.ext.view" instead.');
  return TabLinkExtView;

});



csui.define('csui/controls/tab.panel/tab.links.ext.view.v2',['csui/utils/log','csui/controls/tab.panel/tab.links.ext.view'
], function (log, TabLinkCollectionViewExt) {
  "use strict";
  log.warn('DEPRECATED: depend on the module "csui/controls/tab.panel/tab.links.ext.view" instead.');
  return TabLinkCollectionViewExt;

});


csui.define('csui/controls/tab.panel/tab.links.ext.scroll.mixin.v2',['csui/utils/log','csui/controls/tab.panel/tab.links.ext.scroll.mixin'
], function (log, TabLinksScrollMixin) {
  "use strict";
  log.warn('DEPRECATED: depend on the module "csui/controls/tab.panel/tab.links.ext.scroll.mixin" instead.');
  return TabLinksScrollMixin;

});


csui.define('csui/controls/tab.panel/impl/tab.contents.view',['smart/controls/tab.panel/tab.contents.view',
], function (SmartTabContentsView) {
  "use strict";

  return SmartTabContentsView;

});


csui.define('csui/controls/tab.panel/behaviors/common.keyboard.behavior.mixin',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/log'
], function (module, _, $, log) {
  'use strict';

  var KeyboardBehaviorMixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {

        // start <integer> : starting index
        // optional reverseDirection <boolean>: true/false
        _findNextFocusableElementIndex: function (start, reverseDirection) {
          var tabElemId = start;
          var elemsLength = this.keyboardBehavior.tabableElements.length;
          if (elemsLength === 0) {
            return -1;
          }

          if (tabElemId < 0 || tabElemId >= elemsLength) {
            return tabElemId;
          }
          var $currentElem = $(this.keyboardBehavior.tabableElements[tabElemId]);
          //avoiding focus on scrollbar
          if($currentElem.hasClass('ps-scrollbar-y')|| $currentElem.hasClass('ps-scrollbar-x')){
            tabElemId = tabElemId -1;
            $currentElem = $(this.keyboardBehavior.tabableElements[tabElemId]);
          }
          while (this.closestTabable($currentElem) === false) {
            tabElemId = reverseDirection === true ? tabElemId - 1 : tabElemId + 1;
            if (tabElemId < 0 || tabElemId >= elemsLength) {
              tabElemId = -1;
              break;
            }
            $currentElem = $(this.keyboardBehavior.tabableElements[tabElemId]);
          }
          return tabElemId;
        },

        // This function has a valid check on top of the _findNextFocusableElementIndex() call.
        // If the element is no longer valid, refresh the tabable element lists.
        _findNextValidFocusableElementIndex: function (start, reverseDirection) {
          var tabElemId = this._findNextFocusableElementIndex (start, reverseDirection);
          /* TODO: revisit this algorithm ...
          if (tabElemId >= 0 && tabElemId < this.keyboardBehavior.tabableElements.length) {
            // does the view contain target element?
            var $elem = $(this.keyboardBehavior.tabableElements[tabElemId]);
            if (this.$el.find($elem).length === 0 && this.keyboardBehavior.refreshTabableElements) {
              this.keyboardBehavior.refreshTabableElements(this);
              tabElemId = this._findNextFocusableElementIndex (start, reverseDirection);
            }
          }
          */
          return tabElemId;
        },

        // handle scenario that currentlyFocusedElement does not have event param for shiftTab
        _setFirstAndLastFocusable: function (event) {
          var tabElemId;
          var elemsLength = this.keyboardBehavior.tabableElements.length;
          if (elemsLength === 0) {
            return;
          }
          // first element
          tabElemId = 0;
          tabElemId = this._findNextValidFocusableElementIndex (tabElemId);
          if (tabElemId >= 0 && tabElemId < elemsLength) {
            $(this.keyboardBehavior.tabableElements[tabElemId]).prop('tabindex', '0');
          }
          // last element
          tabElemId = this.keyboardBehavior.tabableElements.length - 1;
          tabElemId = this._findNextValidFocusableElementIndex (tabElemId, true);
          if (tabElemId >= 0 && tabElemId < elemsLength) {
            $(this.keyboardBehavior.tabableElements[tabElemId]).prop('tabindex', '0');
          }
        },

        currentlyFocusedElement: function (event) {
          return this.currentlyFocusedElementInternal(event);
        },

        currentlyFocusedElementInternal: function (event) {
          // log.debug(this.constructor.name + '::currentlyFocusedElement ') && console.log(log.last);

          this._setFirstAndLastFocusable(event);

          var tabElemId = -1;
          var elemsLength = this.keyboardBehavior.tabableElements.length;
          if (elemsLength > 0) {
            var reverseDirection = event && event.shiftKey;
            tabElemId = event.elementCursor || (reverseDirection ? elemsLength - 1 : 0);

            // tab is being activated, return the tab to the global tabable behavior
            if (this.options.tabPanel && this.options.tabPanel.activatingTab) {
              var curPos = this.currentTabPosition;
              if (curPos >= 0 && curPos < elemsLength) {
                tabElemId = curPos;
              }
            }

            // only focus on editable and focusable field
            tabElemId = this._findNextValidFocusableElementIndex (tabElemId, reverseDirection);
          }

          if (tabElemId >= 0 && tabElemId < elemsLength) {
            this.currentTabPosition = tabElemId;
            var $elem = $(this.keyboardBehavior.tabableElements[tabElemId]);
            // tabLink can be invisible, autoScroll until it is visible
            this._autoScrollUntilElemIsVisible && this._autoScrollUntilElemIsVisible($elem);
            return $elem;
          } else {
            return undefined;
          }
        },

        _accSetFocusToPreviousOrNextElement: function (previous) {
          // log.debug(this.constructor.name + '::_accSetFocusToPreviousOrNextElement. previous: ' +
          //           previous) && console.log(log.last);

          var newTabbedElement = -1;
          var elemsLength = this.keyboardBehavior.tabableElements.length;
          if (elemsLength > 0) {
            if (this.currentTabPosition < 0) {
              newTabbedElement = 0;
            } else {
              if (previous) {
                if (this.currentTabPosition > 0) {
                  newTabbedElement = this.currentTabPosition - 1;
                }
              } else {
                if (this.currentTabPosition < elemsLength - 1) {
                  newTabbedElement = this.currentTabPosition + 1;
                }
              }
              // only focus on editable and focusable field
              newTabbedElement = this._findNextValidFocusableElementIndex (newTabbedElement,
                  previous);
            }
          }
          if (newTabbedElement >= 0 && newTabbedElement !== this.currentTabPosition) {
            this.currentTabPosition = newTabbedElement;
            this.keyboardBehavior.refreshTabableElements(this);
            return $(this.keyboardBehavior.tabableElements[newTabbedElement]);
          }
          this.currentTabPosition = -1;
          return undefined;
        },

        containTargetElement: function (event) {
          // does the view contain target element?
          var contain = this.$el.find(event.target).length > 0 ? true : false;
          // try to determine the position accurately
          if (contain) {
            var pos, elem;
            for (pos = 0; pos < this.keyboardBehavior.tabableElements.length; pos++) {
              elem = this.keyboardBehavior.tabableElements[pos];
              // fallback: match the parent container for nested alpaca form field
              if ($(elem).parents('.alpaca-control').find(event.target).length > 0) {
                this.currentTabPosition = pos;
              }
              // accurate case
              // note: FireFox removed isSameNode in some versions
              if (elem.isSameNode && elem.isSameNode(event.target)) {
                this.currentTabPosition = pos;
                break;
              } else if (elem === event.target) {
                this.currentTabPosition = pos;
                break;
              }
            }
          }
          return contain;
        },

        numberOfTabableElements: function (event) {
          return this.keyboardBehavior.tabableElements.length;
        },

        closestTabable: function ($el) {
          var tabable = true;
          var $currentElem = $el;
          // note: for efficiency, only traverse up to 10 ancestors including itself
          var i;
          for (i = 0; i < 10; i++) {
            if ($currentElem &&
                ($currentElem.attr("data-cstabindex") === "-1" || $currentElem.attr("disabled"))) {
              tabable = false;
              break;
            }
            $currentElem = $currentElem.parent();
          }
          return tabable;
        }

      });
    }
  };

  return KeyboardBehaviorMixin;

});


csui.define('csui/controls/tab.panel/behaviors/tab.contents.keyboard.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/log', 'csui/lib/marionette',
  'csui/controls/tab.panel/behaviors/common.keyboard.behavior.mixin'
], function (module, _, $, log, Marionette, KeyboardBehaviorMixin) {
  'use strict';

  // This behavior implements a default keyboard navigation by tab keys similar to the browser
  // default and is used when the browser default can't be used because of tabable region behavior.

  var TabContentKeyboardBehavior = Marionette.Behavior.extend({

    constructor: function TabContentKeyboardBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      view.keyboardBehavior = this;
      this.tabableElements = [];

      var self = this;
      this.listenTo(view, 'refresh:tabable:elements', function (tabPanel) {
        this.alreadyRefreshedTabableElements = false;
        self.refreshTabableElements(view);
      });
      this.listenTo(view, 'render', function () {
        // must listen to async render of forms in children, to get all tabable elements
        view.children && view.children.each(function (child) {
          child.content && self.listenTo(child.content, 'render', function () {
            this.alreadyRefreshedTabableElements = false;
            self.refreshTabableElements(view);
          });
        });
        // jQuery event (removed in destroy)
        view.$el.on('tab:content:field:changed', function () {
          this.alreadyRefreshedTabableElements = false;
          if (this.keyboardAction) {
            // triggered by keyboard
            self.refreshTabableElementsAndSetFocus(view);
          } else {
            // triggered by mouse
            self.refreshTabableElements(view);
          }
          this.keyboardAction = false;
        });
      });

      KeyboardBehaviorMixin.mixin(view);

      _.extend(view, {

        onKeyInView: function (event) {
          var ret;
          if (this.keyboardBehavior.alreadyRefreshedTabableElements !== true) {
            this.keyboardBehavior.refreshTabableElements(this);
          }
          if (this.keyboardBehavior.tabableElements.length === 0) {
            // don't handle keystrokes at all if no elements were found for keyboard navigation
            return ret;
          }
          var elem, elemsLength, focusPos;
          elemsLength = this.keyboardBehavior.tabableElements.length;
          focusPos = 0;
          if (event.keyCode === 9) {  // tab

            while (focusPos < elemsLength) {
              elem = this.keyboardBehavior.tabableElements[focusPos];
              if (elem && $(elem).is(event.target)) {
                break;
              }
              focusPos++;
            }
            if (focusPos >= 0 && focusPos < elemsLength) {
              this.currentTabPosition = focusPos;
            }

            // event.shiftKey: shift tab -> activate previous region
            ret = this._accSetFocusToPreviousOrNextElement(event.shiftKey);
          } else if (event.keyCode === 32 || event.keyCode === 13) {
            // space key(32) or enter key(13)
            var $elem = $(this.keyboardBehavior.tabableElements[this.currentTabPosition]);
            if ($elem && $elem.is(':focus') && $elem.hasClass('binf-hidden') === false &&
                $elem.closest('.cs-field-write').length === 0) {
              event.preventDefault();
              event.stopPropagation();
              this.keyboardBehavior.keyboardAction = true;  // triggered by keyboard, not mouse
              // trigger the click event
              $elem.trigger('click');
            }

            while (focusPos < elemsLength) {
              elem = this.keyboardBehavior.tabableElements[focusPos];
              if (elem && $(elem).is(event.target)) {
                break;
              }
              focusPos++;
            }
            var foundFocusable = focusPos >= 0 && focusPos < elemsLength;
            if (foundFocusable) {
              this.currentTabPosition = focusPos;
            }

            $elem = this._accSetFocusToPreviousOrNextElement(event.shiftKey);
            if ($elem !== undefined) {
              $elem.prop("tabindex", "0");
            }

            if (!!event.activeTabContent && !!event.activeTabContent.alpaca &&
                event.activeTabContent.alpaca.data.type === 140 && foundFocusable) {
              var urlelem = this.keyboardBehavior.tabableElements[focusPos];
                  urlelem.click();
            }

          }
          return ret;
        }

      });
    }, // constructor

    onBeforeDestroy: function () {
      this.view.$el.off('tab:content:field:changed');
    },

    refreshTabableElements: function (view) {
      this.tabableElements = view.options.searchTabContentForTabableElements ?
                             view.$el.find(view.options.tabContentAccSelectors).filter(':visible') :
          [];

      // remove elements with data-cstabindex=-1
      var i;
      for (i = this.tabableElements.length - 1; i >= 0; i--) {
        if (view.closestTabable && view.closestTabable($(this.tabableElements[i])) === false) {
          this.tabableElements.splice(i, 1);
        }
      }
      this.view.currentTabPosition = -1;
      this.alreadyRefreshedTabableElements = true;
      setTimeout(function () {
        view._setFirstAndLastFocusable && view._setFirstAndLastFocusable();
      }, 50);

      // log.debug('TabContentKeyboardBehavior::refreshTabableElements ' + view.constructor.name +
      //           ': found ' + this.tabableElements.length + ' tabable elements') &&
      // console.log(log.last);
    },

    refreshTabableElementsAndSetFocus: function (view) {
      // after the content is changed, refresh the elements and try best to keep the same focus
      var currentTabPos = this.view.currentTabPosition;
      this.refreshTabableElements(view);
      $(this.tabableElements[currentTabPos]).prop("tabindex", "0");
      $(this.tabableElements[currentTabPos]).trigger('focus');
      this.view.currentTabPosition = currentTabPos;
    },

    updateCurrentTabPosition: function () {
      var i;
      for (i = 0; i < this.tabableElements.length; i++) {
        if ($(this.tabableElements[i]).is(':focus')) {
          this.view.currentTabPosition = i;
          break;
        }
      }
    }

  });

  return TabContentKeyboardBehavior;

});


csui.define('csui/controls/tab.panel/behaviors/tab.contents.proxy.keyboard.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/log', 'csui/lib/marionette'
], function (module, _, $, log, Marionette) {
  'use strict';

  // This behavior is a proxy to delegate tab contents keyboard navigation to the child view.

  var TabContentProxyKeyboardBehavior = Marionette.Behavior.extend({

    constructor: function TabContentProxyKeyboardBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      view.keyboardBehavior = this;

      var self = this;
      this.listenTo(view, 'refresh:tabable:elements', function (tabPanel) {
        self.refreshTabableElements(view, tabPanel);
      });

      _.extend(view, {

        // handle scenario that currentlyFocusedElement does not have event param for shiftTab
        _setFirstAndLastFocusable: function (event) {
          if (event && event.activeTabContent && event.activeTabContent.childTabPanelView &&
              event.activeTabContent.childTabPanelView._setFirstAndLastFocusable) {
            event.activeTabContent.childTabPanelView._setFirstAndLastFocusable(event);
          }
        },

        currentlyFocusedElement: function (event) {
          if (event && event.activeTabContent && event.activeTabContent.childTabPanelView &&
              event.activeTabContent.childTabPanelView.currentlyFocusedElement) {
            return event.activeTabContent.childTabPanelView.currentlyFocusedElement(event);
          }
          return undefined;
        },

        _accSetFocusToPreviousOrNextElement: function (previous) {
          if (this.tabPanel && this.tabPanel.activeTabContent &&
              this.tabPanel.activeTabContent.childTabPanelView &&
              this.tabPanel.activeTabContent.childTabPanelView._accSetFocusToPreviousOrNextElement) {
            return this.tabPanel.activeTabContent.childTabPanelView._accSetFocusToPreviousOrNextElement(
                previous);
          }
          return undefined;
        },

        containTargetElement: function (event) {
          if (event && event.activeTabContent && event.activeTabContent.childTabPanelView &&
              event.activeTabContent.childTabPanelView.containTargetElement) {
            return event.activeTabContent.childTabPanelView.containTargetElement(event);
          }
          return false;
        },

        onKeyInView: function (event) {
          // let the child view handle the keypress
          if (event.activeTabContent && event.activeTabContent.childTabPanelView &&
              event.activeTabContent.childTabPanelView.onKeyInView) {
            return event.activeTabContent.childTabPanelView.onKeyInView(event);
          }
          return undefined;
        },

        numberOfTabableElements: function (event) {
          if (event && event.activeTabContent && event.activeTabContent.childTabPanelView &&
              event.activeTabContent.childTabPanelView.numberOfTabableElements) {
            return event.activeTabContent.childTabPanelView.numberOfTabableElements(event);
          }
          return 0;
        }

      });
    }, // constructor

    refreshTabableElements: function (view, tabPanel) {
      // log.debug('TabContentProxyKeyboardBehavior::refreshTabableElements ' + view.constructor.name)
      // && console.log(log.last);

      view.tabPanel = tabPanel;
      if (tabPanel && tabPanel.activeTabContent && tabPanel.activeTabContent.childTabPanelView) {
        var childTabPanel = tabPanel.activeTabContent.childTabPanelView;
        childTabPanel.refreshTabableElements && childTabPanel.refreshTabableElements(childTabPanel);
        var e = {activeTabLink: tabPanel.activeTabLink, activeTabContent: tabPanel.activeTabContent};
        view._setFirstAndLastFocusable && view._setFirstAndLastFocusable();
      }
    }

  });

  return TabContentProxyKeyboardBehavior;

});


csui.define('csui/controls/tab.panel/behaviors/tab.links.dropdown.keyboard.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/log', 'csui/lib/marionette',
  'csui/controls/tab.panel/behaviors/common.keyboard.behavior.mixin'
], function (module, _, $, log, Marionette, KeyboardBehaviorMixin) {
  'use strict';

  // This behavior implements a default keyboard navigation by tab keys similar to the browser
  // default and is used when the browser default can't be used because of tabable region behavior.

  var TabLinksDropdownKeyboardBehavior = Marionette.Behavior.extend({

    constructor: function TabLinksDropdownKeyboardBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      view.keyboardBehavior = this;
      this.tabableElements = [];

      var self = this;
      this.listenTo(view, 'refresh:tabable:elements', function (tabPanel) {
        self.refreshTabableElements(view, tabPanel);
      });

      KeyboardBehaviorMixin.mixin(view);

      _.extend(view, {

        onKeyInView: function (event) {
          var ret;
          if (this.keyboardBehavior.tabableElements.length === 0) {
            // don't handle keystrokes at all if no elements were found for keyboard navigation
            return ret;
          }
          if (event.keyCode === 9) {  // tab
            // log.debug('TabLinksDropdownKeyboardBehavior::onKeyInView ' + this.constructor.name)
            // && console.log(log.last);

            // event.shiftKey: shift tab -> activate previous region
            ret = this._accSetFocusToPreviousOrNextElement(event.shiftKey);
          }
          return ret;
        }
      });

    }, // constructor

    refreshTabableElements: function (view, tabPanel) {
      this.tabableElements = view.$el.find('button:not([disabled])').filter(':visible');
      this.view.currentTabPosition = -1;
      setTimeout(function () {
        view._setFirstAndLastFocusable && view._setFirstAndLastFocusable();
      }, 50);

      // log.debug('TabLinksDropdownKeyboardBehavior::refreshTabableElements ' +
      //           view.constructor.name + ': found ' + this.tabableElements.length + ' tabable' +
      //           ' elements') && console.log(log.last);
    }

  });

  return TabLinksDropdownKeyboardBehavior;

});


csui.define('csui/controls/tab.panel/behaviors/tab.links.keyboard.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/log', 'csui/lib/marionette',
  'csui/utils/base', 'csui/controls/tab.panel/behaviors/common.keyboard.behavior.mixin'
], function (module, _, $, log, Marionette, base, KeyboardBehaviorMixin) {
  'use strict';

  // This behavior implements a default keyboard navigation by tab keys similar to the browser
  // default and is used when the browser default can't be used because of tabable region behavior.

  var TabLinksKeyboardBehavior = Marionette.Behavior.extend({

    constructor: function TabLinksKeyboardBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      view.keyboardBehavior = this;
      this.tabableElements = [];

      var self = this;
      this.listenTo(view, 'refresh:tabable:elements', function (tabPanel) {
        self.refreshTabableElements(view, tabPanel);
      });

      KeyboardBehaviorMixin.mixin(view);

      _.extend(view, {

        // handle scenario that currentlyFocusedElement does not have event param for shiftTab
        _setFirstAndLastFocusable: function (event) {
          if (this.keyboardBehavior.tabableElements.length > 0) {
            // first element
            var $elem = $(this.keyboardBehavior.tabableElements[0]).prop('tabindex', '0');
            // last element: for tabLinks, the last element could be the add button, so search
            // for the last a[href] and set it focusable too
            var lastElemIndex = this.keyboardBehavior.tabableElements.length - 1;
            if ($elem.is('a')) {
              $elem = $(this.keyboardBehavior.tabableElements[lastElemIndex]);
              $elem.prop('tabindex', '0');
              while (!$elem.is('a') && lastElemIndex > 0) {
                lastElemIndex--;
                $elem = $(this.keyboardBehavior.tabableElements[lastElemIndex]);
              }
              $elem.prop('tabindex', '0');
            }
          }
        },

        // Automatically scroll until the tabLink $elem is visible.
        // Note: this function stores a Deferred in $elem.csuiPromise that can be used
        // for ansynchronous check to unset 'skipAutoScroll' and run subsequent code.
        _autoScrollUntilElemIsVisible: function ($elem) {
          var $tabLink = $elem;
          // if $elem is the tablink delete icon, get the sibbling tablink element for scrolling
          if ($tabLink && $tabLink.hasClass('cs-delete-icon')) {
            $tabLink = $elem.parent().parent().find('.cs-tablink');
          }

          if ($tabLink && $tabLink.is('a') && $tabLink.hasClass('cs-tablink')) {
            var tabPanel = this.options && this.options.tabPanel;
            var tabID = $tabLink.attr('href');
            tabID[0] === '#' && (tabID = tabID.substr(1));
            if (tabPanel && tabPanel._isTablinkVisibleInParents($tabLink) === false) {
              var tabIndex = tabPanel._findTabIndexByID ? tabPanel._findTabIndexByID(tabID) : -1;
              if (tabIndex >= 0) {
                var deferred = $.Deferred();
                tabPanel.skipAutoScroll = true;  // unset this after the deferred is done
                $tabLink.csuiPromise = deferred.promise();
                var options = {animationOff: true};
                tabPanel._autoScrollTabTo && tabPanel._autoScrollTabTo(tabIndex, options)
                    .done(function () {
                      tabPanel.skipAutoScroll = false;
                      deferred.resolve();
                    });
              }
            }
          }
        },

        onKeyInView: function (event) {
          var ret;
          if (this.keyboardBehavior.tabableElements.length === 0) {
            // don't handle keystrokes at all if no elements were found for keyboard navigation
            return ret;
          }

          this.keyboardBehavior.keyboardActionDeleteTabPosition = undefined;
          var self = this;
          var _focusOnTabContent = function (e) {
            var hrefElem = self.keyboardBehavior.tabableElements[self.currentTabPosition];
            var $hrefElem = hrefElem && $(hrefElem);
            if ($hrefElem && $hrefElem.is(":focus")) {
              e.preventDefault();
              e.stopPropagation();
              var tabPanel = self.options && self.options.tabPanel;
              tabPanel && (tabPanel.skipAutoScroll = true);
              if ($hrefElem.hasClass('cs-delete-icon')) {
                // when focus is on the delete icon: move back two positions
                self.keyboardBehavior.keyboardActionDeleteTabPosition = self.currentTabPosition - 2;
              }
              // trigger the click event
              $hrefElem.trigger('click');
              // focus is on tablink (not delete icon): move to the first focusable field
              if (self.keyboardBehavior.keyboardActionDeleteTabPosition === undefined) {
                setTimeout(function () {
                  // let tabContents know to focus on 1st editable field of activating tabContent
                  var href = $hrefElem.attr('href');
                  var focusEvent = $.Event('tab:content:focus', {tabId: href});
                  self.$el.trigger(focusEvent);
                  tabPanel && (tabPanel.skipAutoScroll = false);
                }, 100);
              }
            }
          };

          if (event.keyCode === 9) {  // tab
            // log.debug('TabLinksKeyboardBehavior::onKeyInView ' + view.constructor.name) &&
            // console.log(log.last);

            var leftScroll = event.shiftKey;
            var $elem = this._accSetFocusToPreviousOrNextElement(leftScroll);

            // if the scroll-to element is a tab, auto-scroll for it to be visible
            this._autoScrollUntilElemIsVisible($elem);

            ret = $elem;
          } else if (event.keyCode === 32 || event.keyCode === 13) {
            // space key(32) or enter key(13)
            _focusOnTabContent.call(this, event);
          } else if (event.keyCode === 46) {
            // delete key
            var hrefElem = this.keyboardBehavior.tabableElements[this.currentTabPosition];
            if (hrefElem && $(hrefElem).is(":focus")) {
              event.preventDefault();
              event.stopPropagation();
              // when focus is on the tablink: move back one position
              this.keyboardBehavior.keyboardActionDeleteTabPosition = this.currentTabPosition - 1;

              // let tabLinks know to delete the tab
              var href = $(hrefElem).attr('href');
              var deleteEvent = $.Event('tab:link:delete', {tabId: href});
              this.$el.trigger(deleteEvent);
            }
          }
          return ret;
        }
      });

    }, // constructor

    refreshTabableElements: function (view, tabPanel) {
      this.tabableElements = view.$el.find('a[href], *[tabindex="0"]:visible, *[data-cstabindex]');
      // remove elements with data-cstabindex=-1
      var i;
      for (i = this.tabableElements.length - 1; i >= 0; i--) {
        if ($(this.tabableElements[i]).attr('data-cstabindex') === '-1') {
          this.tabableElements.splice(i, 1);
        }
      }

      this.view.currentTabPosition = -1;
      // if delete a tab by keyboard, put focus on the previous tab afterwards
      if (this.keyboardActionDeleteTabPosition !== undefined) {
        var $elem = $(this.tabableElements[this.keyboardActionDeleteTabPosition]);
        if ($elem && $elem.length > 0) {
          this.view.currentTabPosition = this.keyboardActionDeleteTabPosition;
          // if the scroll-to element is a tab, auto-scroll for it to be visible
          this.view._autoScrollUntilElemIsVisible($elem);
          $elem.trigger('focus');
        }
        this.keyboardActionDeleteTabPosition = undefined;
      }

      setTimeout(function () {
        view._setFirstAndLastFocusable && view._setFirstAndLastFocusable();
      }, 50);

      // log.debug('TabLinksKeyboardBehavior::refreshTabableElements ' + view.constructor.name +
      //           ': found ' + this.tabableElements.length + ' tabable elements') &&
      // console.log(log.last);
    }

  });

  return TabLinksKeyboardBehavior;

});


csui.define('csui/controls/tab.panel/behaviors/tab.panel.keyboard.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/log', "csui/utils/base",
  'csui/lib/marionette'
], function (module, _, $, log, base, Marionette) {
  'use strict';

  // This behavior implements a default keyboard navigation by tab keys similar to the browser
  // default and is used when the browser default can't be used because of tabable region behavior.

  var TabPanelKeyboardBehavior = Marionette.Behavior.extend({

    constructor: function TabPanelKeyboardBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      view.keyboardBehavior = this;
      view.currentTabPosition = options.currentTabPosition || 0;
      this.tabableElements = [];

      var self = this;
      this.listenTo(view, 'render', function () {
        self.refreshTabableElements(view);

        // if tab content is rendered later such as with Alpaca form rendering,
        // then watch for this custom event and refresh tabable elements again
        // jQuery event (removed in destroy)
        view.$el.on('tab:content:render', function () {
          self.refreshTabableElements(view);
        });
      });
      this.listenTo(view, 'activate:tab', function (tabContent, tabPane, tabLink) {
        var tabLinkHref = tabLink && tabLink.$el.find('>a')[0];
        if (tabLinkHref) {
          var event = {target: tabLinkHref};
          var tabLinks = this.tabableElements[this.tabLinksIndex];
          if (tabLinks && tabLinks.containTargetElement && tabLinks.containTargetElement(event)) {
            var tabContents = this.tabableElements[this.tabContentIndex];
            if (tabContents && tabContents.options.searchTabContentForTabableElements !== true) {
              var $elem = $(tabLinks.keyboardBehavior.tabableElements[tabLinks.currentTabPosition]);
              // overcome dom:refresh that triggers the global tabable behavior sets focus elsewhere
              setTimeout(_.bind(function () {
                this.view._focusOnElement($elem);
              }, this), 500);
            }
          }
        }
      });

      _.extend(view, {

        // When TabPanelView is not used for form rendering, there is no content rendered event.
        // Thus, check and refresh tabable elements if needed in case the view render event was
        // called before animation is done or the view is still loading, not fully visible.
        _checkAndRefreshTabableElements: function (event) {
          if (this.keyboardBehavior.tabableElements.length > 0) {
            // only need to check the tabLinks, tabContents can be empty
            var tabLinks = this.keyboardBehavior.tabableElements[this.keyboardBehavior.tabLinksIndex];
            if (tabLinks.numberOfTabableElements && tabLinks.numberOfTabableElements(event) === 0) {
              tabLinks.keyboardBehavior.refreshTabableElements(tabLinks);
            }
          }
        },

        // handle scenario that currentlyFocusedElement does not have event param for shiftTab
        _setFirstAndLastFocusable: function (event) {
          if (this.keyboardBehavior.tabableElements.length > 0) {
            // first element
            var elem = this.keyboardBehavior.tabableElements[0];
            elem && elem._setFirstAndLastFocusable && elem._setFirstAndLastFocusable(event);
            // last element
            var lastElemIndex = this.keyboardBehavior.tabableElements.length - 1;
            elem = this.keyboardBehavior.tabableElements[lastElemIndex];
            elem && elem._setFirstAndLastFocusable && elem._setFirstAndLastFocusable(event);
          }
        },

        currentlyFocusedElement: function (event) {
          // log.debug('TabPanelKeyboardBehavior::currentlyFocusedElement ' +
          //           this.constructor.name) && console.log(log.last);

          var e = _.extend(
              {activeTabLink: this.activeTabLink, activeTabContent: this.activeTabContent},
              event);

          this._checkAndRefreshTabableElements(e);
          this._setFirstAndLastFocusable(e);

          var $focusElem;
          var elemsLength = this.keyboardBehavior.tabableElements.length;
          if (elemsLength > 0) {
            var curPos = this.currentTabPosition;
            if (curPos < 0 || curPos > elemsLength - 1) {
              curPos = this.currentTabPosition = e.shiftKey ? elemsLength - 1 : 0;
            }
            // on ShiftTab: use last element
            e.shiftKey && (curPos = this.currentTabPosition = elemsLength - 1);
            var elem = this.keyboardBehavior.tabableElements[curPos];
            if (elem.currentlyFocusedElement) {
              $focusElem = elem.currentlyFocusedElement(e);
              if ($focusElem !== undefined) {
                $focusElem.prop("tabindex", "0");
                // The form field at the bottom may not be visitble, and the global TabablesBehavior
                // has a check base.isVisibleInWindowViewport(elToFocus) on line 198 that
                // ignores the region.
                // So as a workaround as usual to the limitation of the weak code elsewhere without
                // touching it, handle it here.  Set the focus on the form field element so that it
                // would scroll into the view and become visible.
                if (this.currentTabPosition === this.tabContentIndex) {
                  self.skipAutoScroll = true;
                  this._focusOnElement($focusElem);
                  self.skipAutoScroll = false;
                }
              }
            }
          }
          return $focusElem;
        },

        accActivateTabableRegion: function (shiftTab) {
          if (shiftTab) {
            this.currentTabPosition = -1;
          }
          var $focusElem = this.currentlyFocusedElement({shiftKey: shiftTab});
          this._focusOnElement($focusElem);
        },

        _focusOnElement: function ($elem) {
          if ($elem && $elem instanceof $) {
            this.tabableRegionBehavior && (this.tabableRegionBehavior.ignoreFocusEvents = true);
            $elem.trigger('focus');
            this.tabableRegionBehavior && (this.tabableRegionBehavior.ignoreFocusEvents = false);
          }
        },

        _moveTo: function (event, $elem) {
          event.preventDefault();
          event.stopPropagation();
          // this.trigger('changed:focus', this);
          var self = this;
          if ($elem.csuiPromise) {
            $elem.csuiPromise.done(function () {
              $elem.prop("tabindex", "0");
              self._focusOnElement($elem);
              setTimeout(function () {
                self.skipAutoScroll = false;
              }, 600);
            });
          } else {
            $elem.prop("tabindex", "0");
            self._focusOnElement($elem);
            setTimeout(function () {
              self.skipAutoScroll = false;
            }, 600);
          }
        },

        onKeyInView: function (event) {
          // handle tab, space, enter, delete only
          if (event.keyCode !== 9 && event.keyCode !== 32 && event.keyCode !== 13 &&
              event.keyCode !== 46) {
            return;
          }

          event.activeTabLink = this.activeTabLink;
          event.activeTabContent = this.activeTabContent;

          var elem, $focusingElem;
          var curPos = this.currentTabPosition;
          var elemsLength = this.keyboardBehavior.tabableElements.length;

          // if the focus is already in the region, find the view containing currently focused element
          var focusPos = 0;
          while (focusPos < elemsLength) {
            elem = this.keyboardBehavior.tabableElements[focusPos];
            if (elem && elem.containTargetElement && elem.containTargetElement(event)) {
              // if the region contains target elememt but has no tabable element, just return and
              // let the global Tabable behavior handle the keypress
              if (elem.numberOfTabableElements() === 0) {
                this.currentTabPosition = -1;
                return;
              }
              break;
            }
            focusPos++;
          }
          if (focusPos >= 0 && focusPos < elemsLength) {
            curPos = this.currentTabPosition = focusPos;
          }

          // let the child view handle the keypress first
          if (curPos >= 0 && curPos < elemsLength) {
            elem = this.keyboardBehavior.tabableElements[curPos];
            if (elem.onKeyInView) {
              // skip autoScroll if the focusing area is TabLink (index = 0)
              curPos === 0 && (this.skipAutoScroll = true);
              $focusingElem = elem.onKeyInView(event);
              if ($focusingElem !== undefined) {
                this._moveTo(event, $focusingElem);
                return;
              }
            }
          }

          // if the child did not handle the keypress
          if (event.keyCode === 9) {  // tab
            if (curPos >= 0 && curPos < elemsLength) {
              // log.debug('TabPanelKeyboardBehavior::onKeyInView ' + this.constructor.name) &&
              // console.log(log.last);

              var newTabbedElement = -1;
              if (event.shiftKey) {  // shift tab -> activate previous region
                if (this.currentTabPosition > 0) {
                  newTabbedElement = this.currentTabPosition - 1;
                }
              } else {
                if (this.currentTabPosition < elemsLength - 1) {
                  newTabbedElement = this.currentTabPosition + 1;
                }
              }

              // check and move to a region with focusable element
              while (newTabbedElement >= 0 && newTabbedElement < elemsLength) {
                elem = this.keyboardBehavior.tabableElements[newTabbedElement];
                if (elem.currentlyFocusedElement) {
                  $focusingElem = elem.currentlyFocusedElement(event);
                  if ($focusingElem !== undefined) {
                    break;
                  }
                }
                // move to the next one to check
                if (event.shiftKey) {  // shift tab -> activate previous region
                  newTabbedElement = newTabbedElement - 1;
                } else {
                  newTabbedElement = newTabbedElement + 1;
                }
              }

              if (newTabbedElement >= 0 && newTabbedElement < elemsLength &&
                  newTabbedElement !== this.currentTabPosition) {
                // skip autoScroll if the focusing area is TabLink
                newTabbedElement === this.tabLinksIndex && (this.skipAutoScroll = true);
                this.currentTabPosition = newTabbedElement;
                this._moveTo(event, $focusingElem);
              } else {
                // FireFox quirky: need to blur
                // for versions,activity tab $(event.target) is not working in IE.
                if (base.isMSBrowser()) {
                  $(event.srcElement).blur();
                } else {
                  // For form fields blur event not working in Firefox
                  if (/^(?:input|select|textarea|button)$/i.test(event.target)) {
                    $(event.target).blur();
                  }
                }
                this.currentTabPosition = -1;
              }
            }
          }
        }
      });

    }, // constructor

    onBeforeDestroy: function () {
      this.view.$el.off('tab:content:render');
    },

    refreshTabableElements: function (view) {
      // log.debug('TabPanelKeyboardBehavior::refreshTabableElements ' + view.constructor.name) &&
      // console.log(log.last);

      view.tabLinks.triggerMethod('refresh:tabable:elements', view);
      view.tabContent.triggerMethod('refresh:tabable:elements', view);

      // tabLinks
      this.tabLinksIndex = 0;
      this.tabableElements[this.tabLinksIndex] = view.tabLinks;

      // tabContentHeader if defined
      this.tabContentHeaderIndex = -1;
      if (view.tabContentHeader) {
        this.tabContentHeaderIndex = 1;
        this.tabableElements[this.tabContentHeaderIndex] = view.tabContentHeader;
      }

      // tabContent
      this.tabContentIndex = view.tabContentHeader ? 2 : 1;
      this.tabableElements[this.tabContentIndex] = view.tabContent;

      this.view.currentTabPosition = -1;
      this.view.triggerMethod("refresh:tabindexes");
    }

  });

  return TabPanelKeyboardBehavior;

});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/perspective.header/impl/perspective.header',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"cs-back-button-container\">\n    <otc-button class=\"cs-back-button\" size=\"small\" type=\"subtle\" arialabel=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTitle") || (depth0 != null ? lookupProperty(depth0,"backTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTitle","hash":{},"loc":{"start":{"line":3,"column":77},"end":{"line":3,"column":90}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTitle") || (depth0 != null ? lookupProperty(depth0,"backTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTitle","hash":{},"loc":{"start":{"line":3,"column":99},"end":{"line":3,"column":112}}}) : helper)))
    + "\">\n      <otc-icon size=\"16\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"jatoLeftIcon") || (depth0 != null ? lookupProperty(depth0,"jatoLeftIcon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"jatoLeftIcon","hash":{},"loc":{"start":{"line":4,"column":31},"end":{"line":4,"column":47}}}) : helper)))
    + "\" mirrorIfRtl></otc-icon>\n    </otc-button>\n  </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"cs-back-button-container cs-back-button\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTitle") || (depth0 != null ? lookupProperty(depth0,"backTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTitle","hash":{},"loc":{"start":{"line":8,"column":62},"end":{"line":8,"column":75}}}) : helper)))
    + "\"\n      tabindex=\"0\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTitle") || (depth0 != null ? lookupProperty(depth0,"backTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTitle","hash":{},"loc":{"start":{"line":9,"column":31},"end":{"line":9,"column":44}}}) : helper)))
    + "\" role=\"button\">\n    <span class=\"arrow_back cs-go-back\"></span>\n  </div>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <otc-icon type=\"raw\" size=\"24\" svg=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"jatoIcon") || (depth0 != null ? lookupProperty(depth0,"jatoIcon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"jatoIcon","hash":{},"loc":{"start":{"line":17,"column":42},"end":{"line":17,"column":54}}}) : helper)))
    + "\"></otc-icon>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <span class=\"title-icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"icon") || (depth0 != null ? lookupProperty(depth0,"icon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon","hash":{},"loc":{"start":{"line":19,"column":30},"end":{"line":19,"column":38}}}) : helper)))
    + "\"></span>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"canShowJatoIcon") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":1,"column":0},"end":{"line":12,"column":7}}})) != null ? stack1 : "")
    + "\n<div class=\"cs-title-container\">\n  <div class=\"cs-title-inner-container\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"canShowJatoIcon") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(7, data, 0),"loc":{"start":{"line":16,"column":4},"end":{"line":20,"column":11}}})) != null ? stack1 : "")
    + "    <h2 class=\"title\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":21,"column":22},"end":{"line":21,"column":31}}}) : helper)))
    + "</h2>\n  </div>\n</div>\n";
}});
Handlebars.registerPartial('csui_controls_perspective.header_impl_perspective.header', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/perspective.header/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/controls/perspective.header/impl/nls/root/lang',{
  backTitle: 'Back'
});




csui.define('css!csui/controls/perspective.header/impl/perspective.header',[],function(){});

csui.define('csui/controls/perspective.header/perspective.header.view',['csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'smart/themes/theming',
  'csui/themes/csui.jato.action.icons',
  'hbs!csui/controls/perspective.header/impl/perspective.header',
  'i18n!csui/controls/perspective.header/impl/nls/lang',
  'css!csui/controls/perspective.header/impl/perspective.header'
], function (_, $, Marionette, theming, jatoActionIcons, headerTemplate, lang) {

  var PerspectiveHeaderView = Marionette.ItemView.extend({

    className: 'csui-perspective-toolbar-container',

    template: headerTemplate,

    ui: {
      headerControl: '.cs-header-control',
      backButton: '.cs-back-button'
    },

    events: {
      'keydown @ui.backButton': 'onKeyInView',
      'click @ui.backButton': 'onBackButton'
    },

    templateHelpers: function () {
      const isJATO = theming.isJATOTheme(),
        // until UX provides a solution for SVG+Gradient+UID, encode the SVG content.
        jatoIcon = this.options.jatoIcon;
      return {
        isJATO,
        jatoIcon,
        jatoLeftIcon: jatoActionIcons.actionArrowLeft,
        canShowJatoIcon: isJATO && jatoIcon,
        icon: this.options.icon,
        title: this.options.title,
        backTitle: lang.backTitle
      };
    },

    constructor: function DialogHeaderView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.listenToOnce(this, 'render', _.bind(function () {
        setTimeout(_.bind(function () {
          let expandedViewEle = this.$el.closest('.binf-col-xs-12.row-xs-full>div');
          expandedViewEle.addClass('csui-expanded-tile-view');
        }, this), 0);
      }, this));
    },

    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this.__executeBackFunc(event);
      }
    },

    onBackButton: function (event) {
      this.__executeBackFunc(event);
    },

    __executeBackFunc: function (event) {
      event.preventDefault();
      var context = this.options.context,
        viewStateModel = context && context.viewStateModel;
      if (viewStateModel) {
        viewStateModel.restoreLastRouter();
      }
    },

    // onRender: function () {
    //   let expandedViewEle = this.$el.closest('.binf-col-xs-12.row-xs-full>div');
    //   expandedViewEle.addClass('csui-expanded-tile-view');
    // }
  });

  return PerspectiveHeaderView;
});


csui.define('csui/controls/tab.panel/impl/tab.link.view',['smart/controls/tab.panel/tab.link.view',
], function (SmartTabLinkView) {
  "use strict";

  return SmartTabLinkView;

});



csui.define('csui/controls/tab.panel/impl/tab.links.view',['smart/controls/tab.panel/tab.links.view',
], function (SmartTabLinksView) {
  "use strict";

  return SmartTabLinksView;

});



csui.define('csui/controls/mixins/global.alert/global.alert.mixin',[], function () {
  'use strict';
  var GlobalAlertMixin = {
    prepareForGlobalAlert: function () {
      this.listenTo(this, 'global.alert.inprogress', this.handleAlertInProgress);
      this.listenTo(this, 'global.alert.completed', this.handleAlertComplete);
    },

    handleAlertInProgress: function () {
      if (this.currentlyFocusedElement !== this.disableCurrentFocusElementHandler) {
        this.originalCurrentlyFocusedElement = this.currentlyFocusedElement;
      }
      this.currentlyFocusedElement = this.disableCurrentFocusElementHandler;
    },

    disableCurrentFocusElementHandler: function () {
      // console.log('Disabled current focus for ', this.constructor.name);
    },

    handleAlertComplete: function () {
      if (this.originalCurrentlyFocusedElement != null) {
        // console.log('Rolling back to original currentlyFocusedElement.', this.constructor.name);
        this.currentlyFocusedElement = this.originalCurrentlyFocusedElement;
        this.originalCurrentlyFocusedElement = undefined;
      }
    }
  };
  return GlobalAlertMixin;
});

csui.define('csui/utils/contexts/factories/metadata.factory',['module',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/utils/contexts/factories/factory'
], function (module, _, Backbone, ModelFactory) {

  var MetadataModel = Backbone.Model.extend({});

  // MetadataModelFactory
  return ModelFactory.extend({

    MetadataModelPrefix: 'MetadataModel',
    propertyPrefix: 'MetadataModel',

    constructor: function PropertiesModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var metadataModel = this.options.MetadataModel || {};
      if (!(metadataModel instanceof Backbone.Model)) {
        var config = module.config();
        metadataModel = new MetadataModel(metadataModel.models, _.extend({},
            metadataModel.options, config.options));
      }
      this.property = metadataModel;
    }
  });
});


csui.define('csui/controls/mixins/view.state/metadata.view.state.mixin',['module', 'csui/lib/underscore', 'csui/lib/marionette',
          'csui/utils/contexts/factories/metadata.factory'
], function (module, _, Marionette, MetadataModelFactory) {
  'use strict';

  return {

    getViewStateDropdown: function () {
      return this.context && this.context.viewStateModel.getViewState('dropdown');
    },

    getDefaultViewStateDropdown: function () {
      return this.context && this.context.viewStateModel.getDefaultViewState('dropdown');
    },

    setViewStateDropdown: function (value, options) {
      var viewStateModel = this.context && this.context.viewStateModel;
      if (options && options.default) {
        viewStateModel.setDefaultViewState('dropdown', value);
      }
      return viewStateModel.setViewState('dropdown', value);
    },

    setViewStateId: function (id, options) {
      var metadataModel = this.context && this.context.getModel(MetadataModelFactory);
      var metadataInfo = _.clone(metadataModel.get('metadata_info'));
      if (metadataInfo) {
        metadataInfo.id = id;
        metadataInfo.model = options.model;
        metadataModel.set('metadata_info', metadataInfo, options);
      }
    },

    getViewStateId: function (id) {
      var metadataModel = this.context && this.context.getModel(MetadataModelFactory);
      var metadataInfo = _.clone(metadataModel.get('metadata_info'));
      if (metadataInfo) {
        return metadataInfo.id;
      }
    },

    isMetadataNavigation: function () {
      var metadataModel = this.context && this.context.getModel(MetadataModelFactory);
      if (metadataModel) {
        var metadataInfo = metadataModel.get('metadata_info');
        if (metadataInfo) {
          return metadataInfo.navigator;
        }
      }
      return true;
    },

    getThumbnailViewState: function () {
      var metadataModel = this.context && this.context.getModel(MetadataModelFactory);
      if (metadataModel) {
        var metadataInfo = metadataModel.get('metadata_info');
        if (metadataInfo) {
          return metadataInfo.isThumbnailView;
        }
      }
    },

    getViewStateSelectedProperty: function () {
      var metadataModel = this.context && this.context.getModel(MetadataModelFactory);
      if (metadataModel) {
        var metadataInfo = metadataModel.get('metadata_info');
        if (metadataInfo) {
          return metadataInfo.selectedProperty;
        }
      }
    },

    isShowPermissionView: function () {
      var metadataModel = this.context && this.context.getModel(MetadataModelFactory);
      if (metadataModel) {
        var metadataInfo = metadataModel.get('metadata_info');
        if (metadataInfo) {
          return metadataInfo.showPermissionView;
        }
      }
    },

    initOptionsFromMetadataInfo: function (options) {
      var metadataModel = this.context && this.context.getModel(MetadataModelFactory);
      if (metadataModel) {
        var metadataInfo = metadataModel.get('metadata_info');
        if (metadataInfo) {
          options.id = metadataInfo.id;
          options.model = metadataInfo.model;
          options.navigator = metadataInfo.navigationView;
          options.originatingView = metadataInfo.originatingView;
          options.targetView = metadataInfo.targetView;
          options.commands = metadataInfo.commands;
          options.showCloseIcon = metadataInfo.showCloseIcon;
          options.showBackIcon = metadataInfo.showBackIcon;
          options.selectedTab = metadataInfo.selectedTab;
          options.showPermissionView = metadataInfo.showPermissionView;
        }
      }
    }

  };

});


csui.define('csui/controls/mixins/view.state/node.view.state.mixin',[
  'module', 'csui/lib/underscore', 'csui/utils/log'
], function (module, _, log) {
  'use strict';

  log = log(module.id);

  return {

    getViewStatePage: function () {
      return this._parsePageInfo(this.context.viewStateModel.getViewState('page'));
    },

    getDefaultViewStatePage: function () {
      return this._parsePageInfo(this.context.viewStateModel.getDefaultViewState('page'));
    },

    _parsePageInfo: function (page) {
      if (page) {
        page = page.split('_');
        if (page.length > 1) {
          try {
            return {
              top: parseInt(page[0]),
              skip: parseInt(page[1])
            };
          } catch (error) {
            log.error('invalid page info in url.');
          }
        }
      }
    },

    setViewStatePage: function (top, skip, options) {
      var viewStateModel = this.context.viewStateModel;
      top = top > 50 ? 100 : top;
      if (options && options.default) {
        viewStateModel.setDefaultViewState('page', top + '_' + skip, options);
        if (options.defaultOnly) {
          return;
        }
      }
      return viewStateModel.setViewState('page', top + '_' + skip, options);
    },

    setViewStateCacheId: function (cacheId, options) {
      const viewStateModel = this.context.viewStateModel;
      if (options && options.default) {
        viewStateModel.setDefaultViewState('cacheId', cacheId, options);
      }
      return viewStateModel.setViewState('cacheId', cacheId, options);
    },
    
    getViewStateCacheId: function () {
      return this.context.viewStateModel.getViewState('cacheId');
    },

    getViewStateOrderBy: function (uiState) {
      var orderBy = uiState ? uiState.order_by : this.context.viewStateModel.getViewState('order_by');
      return this._formatOrderBy(orderBy);
    },

    _formatOrderBy: function (orderBy) {
      return orderBy && orderBy.replace(/_desc/g, ' desc').replace(/_asc/g, ' asc');
    },

    getDefaultViewStateOrderBy: function() {
      var orderBy = this.context.viewStateModel.getDefaultViewState('order_by');
      return this._formatOrderBy(orderBy);
    },

    setViewStateOrderBy: function (orderBy, options) {
      var viewStateModel = this.context.viewStateModel;
      if (orderBy && orderBy.length) {
        var stateOrderBy = viewStateModel.getViewState('order_by'),
            order_by     = orderBy.join();
        if (order_by !== stateOrderBy) {
          // all ui state params must be saved in the ui state model as a url param ready to be
          // used as a url parameter.
          order_by = order_by.replace(/ /g, '_');
          if (options && options.default) {
            viewStateModel.setDefaultViewState('order_by', order_by, _.omit(options, 'default'));
          }
          return viewStateModel.setViewState('order_by', order_by, options);
        }
      } else {
        return viewStateModel.setViewState('order_by', undefined, options);
      }
    },

    getViewStateFilter: function () {
      // make sure to decode the filter
      return this.context.viewStateModel.getViewState('filter', true);
    },

    setViewStateFilter: function (filterObject, options) {
      // We need to remove from the filter object any keys that contain empty string like name: '' and
      // facet: []. That is what cleanObject is doing.
      const clearedFilter = this._cleanObject(filterObject);
      const filterString = !_.isEmpty(clearedFilter)? JSON.stringify(clearedFilter) : undefined;
      if (this.getViewStateFilter() !== filterString) {
        let viewStateModel = this.context.viewStateModel;
        options || (options = {});
        options.encode = true;
        if (options && options.default) {
          viewStateModel.setDefaultViewState('filter', filterString, options);
        }
        return viewStateModel.setViewState('filter', filterString, options);
      }
    },

    // Remove all the empty strings objects, empty objects and empty arrays.
    _cleanObject: function (obj) {
      if (!_.isObject(obj) || obj === null) {
        return obj;
      }

      const result = Array.isArray(obj) ? [] : {};

      for (const key in obj) {
        if (!Object.hasOwn(obj, key)) continue;

        const value = obj[key];

        if (value === undefined || value === "" || (Array.isArray(value) && _.isEmpty(value))) {
          continue;
        }

        if (_.isObject(value) && value !== null) {
          const cleaned = this._cleanObject(value);
          if (_.isEmpty(cleaned)) {
            continue;
          }
          result[key] = cleaned;
        } else {
          result[key] = value;
        }
      }

      return result;
    },

    getViewStateTabIndex: function () {
      var tabIndex = this.context.viewStateModel.getViewState('tab');
      if (tabIndex) {
          try {
            tabIndex = parseInt(tabIndex);
          } catch (error) {
            log.error('invalid tab info in url.');
          }
      }
      return tabIndex;
    },

    setViewStateTabIndex: function (tabIndex, options) {
      var viewStateModel = this.context.viewStateModel;
      if (options && options.default) {
        viewStateModel.setDefaultViewState('tab', tabIndex, options);
      }
      return viewStateModel.setViewState('tab', tabIndex, options);
    },

    getDefaultViewStateTabIndex: function () {
      var tabIndex = this.context.viewStateModel.getDefaultViewState('tab');
      if (tabIndex) {
        try {
          tabIndex = parseInt(tabIndex);
        } catch (error) {
          log.error('invalid tab info in url.');
        }
      }
      return tabIndex;
    },

    _restoreCollectionOptionsFromViewState: function () {
      var pageInfo = this.getViewStatePage();
      if (pageInfo && pageInfo.top && pageInfo.skip) {
        try {
          pageInfo.top = parseInt(pageInfo.top);
          pageInfo.skip = parseInt(pageInfo.skip);
          this.options.pageSize = this.options.data.pageSize = pageInfo.top;
          this.options.pageNumber = pageInfo.skip / pageInfo.top;
        } catch (error) {
          log.error('invalid page info in url.');
        }
      }

      var viewStateOrder = this.getViewStateOrderBy() || this.getDefaultViewStateOrderBy();

      var viewStateFilter = this.getViewStateFilter();
      viewStateFilter = viewStateFilter ? JSON.parse(viewStateFilter) : {};

      return {
        top: pageInfo && pageInfo.top,
        skip: pageInfo && pageInfo.skip,
        filter: viewStateFilter,
        orderBy: viewStateOrder,
        cacheId: this.getViewStateCacheId()
      };
    },

    convertFacetFilterToObjects: function (stringFacets) {
      const objectFacets = stringFacets.map(function (entry) {
        // 'key'               => { id: 'key': values: undefined }
        // 'key:'              => { id: 'key': values: [] }
        // 'key:value'         => { id: 'key': values: [{ id: 'value' }] }
        // 'key:value1|value2' => { id: 'key': values: [{ id: 'value1' }, { id: 'value2' }] }
        const [facet, values] = entry.split(/:(.*)/);
        const stringValues = values !== undefined ? splitFacetValues(values) : undefined;
        const objectValues = stringValues && stringValues.map(value => ({ id: value }));
        return {
          id: facet,
          values: objectValues
        };
      });
      return objectFacets;
    }
  };

  function splitFacetValues(value) {
    // ''                    => []
    // 'value'               => ['value']
    // 'value1|value2'       => ['value1', 'value2']
    // 'value{|}1|value{|}2' => ['value{|}1', 'value{|}2']
    const items = [];
    if (value) {
      for (let startIndex = 0, itemIndex = 0; ; ) {
        const pipeIndex = value.indexOf('|', startIndex);
        if (pipeIndex >= 0) {
          if (value.charAt(pipeIndex - 1) !== '{' && value.charAt(pipeIndex + 1) !== '}') {
            items.push(value.substring(itemIndex, pipeIndex));
            itemIndex = pipeIndex + 1;
          }
          startIndex = pipeIndex + 1;
        } else {
          items.push(value.substring(itemIndex));
          break;
        }
      }
    }
    return items;
  }
});


csui.define('csui/controls/mixins/view.state/toolitems.state.mixin',['module',
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/lib/backbone', 'csui/utils/log', 'csui/utils/base'
], function (module, _, $, Marionette, Backbone, log, base) {
  'use strict';

  log = log(module.id);

  return {

    _hasIcon: function () {
      return this.model.get('iconName') || this._iconName || this._icon;
    },

    _calculateIconName: function () {
      this._stateIsOn = this.model.get('stateIsOn');
      if (this._stateIsOn) {
        this._iconName = this.model.get('iconNameForOn');
        if (this._iconName) {
          this._stateIsOn = false;  // not using the icon-v2 modifier, because other icon is used
        } else {
          this._iconName = this.model.get('iconName');  // default back to non on state icon
        }
      } else {
        this._iconName = this.model.get('iconName');
        if (!this._iconName) {  // @deprecate using of css based (background-image) icons
          this._icon = this.model.get('icon');
        }
      }
    },

    renderIconAndText: function () {
      this.options.renderIconAndText = true;
      this.render();  // re-render
      this.options.renderIconAndText = false;
    },

    renderTextOnly: function (saveState) {
      if (this.isRenderedTextOnly()) {
        return;
      }
      saveState && this.saveRenderState();
      this.options.renderTextOnly = true;
      this.render();  // re-render
      this.options.renderTextOnly = false;
    },

    isRenderedTextOnly: function () {
      return !this._hasIcon() || // No Icon, only text is rendered.
        (this.options.renderTextOnly === true && // Has Icon, but asked to rendered textonly
          this.options.renderIconAndText !== true);
    },

    makeFocusable: function () {
      this.ui.link.addClass("csui-acc-focusable");
    },

    _handleClick: function (event, isKeyEvent = false) {
      if (base.isControlClick(event)) {
        // do nothing, let's execute browser's default behaviour as it is in both ctrl+click and
        // command+click in mac.
      } else {
        event.preventDefault();

        // when the dropdown menu command runs with more options, keep the menu open
        if (this.model.get('menuWithMoreOptions') === true) {
          event.stopPropagation();
        } else {
          // close the dropdown menu before triggering the event
          this.closeDropdown();
        }
        this.model.set({ isKeyEvent: isKeyEvent }, { silent: true });
        var args = { toolItem: this.model };
        this.triggerMethod('before:toolitem:action', args);
        if (!args.cancel) {
          this.triggerMethod('toolitem:action', args);
        }
      }
    },
    // TODO: Deprecate and remove this method. This information is carried by the model.
    isSeparator: function () {
      return this.model.isSeparator();
    },

    closeDropdown: function () {
      var dropdownEl = this.$el.closest('li.binf-dropdown.binf-open');
      var dropdownToggleEl = dropdownEl.find('.binf-dropdown-toggle');
      dropdownToggleEl.binf_dropdown('toggle');
    },

    closeSubMenu: function () {
      var subMenuEl = this.$el.closest('.binf-dropdown-submenu');
      if(subMenuEl && subMenuEl.length){
        subMenuEl.binf_dropdown_submenu('hide');
      }
    }
  };
});


csui.define('csui/controls/mixins/view.state/multi.node.fetch.mixin',['module', 'csui/lib/underscore', "csui/lib/jquery", 'csui/lib/marionette', 'csui/utils/log'
], function (module, _, $, Marionette, log) {
  'use strict';

  log = log(module.id);

  return {

    _getNodesFromCollection: function (collection, ids, connector) {
      var deferred      = $.Deferred(),
          nodesNotInCollection = [],
          nodesInCollection = [];

      var nodes = ids.map(function (id) {
        var node = collection.find({id: id});
        if (node) {
          nodesInCollection.push(node);
        } else {
          node = new collection.model({id: id}, {connector: connector});
          nodesNotInCollection.push(node);
        }
        return node;
      }.bind(this));

      if (nodesNotInCollection.length === 0) {
        return deferred.resolve(nodes, nodesInCollection);
      } else {
        this.blockActions && this.blockActions();
        this._fetchNodes(nodesNotInCollection, collection).done(function () {
          deferred.resolve(nodes, nodesInCollection);
          this.unblockActions && this.unblockActions();
        }.bind(this));
      }

      return deferred.promise();
    },

    _fetchNodes: function (nodes, collection) {
      var deferred  = $.Deferred(),
          deferreds = [];
      nodes.forEach(function (node) {
        deferreds.push(node.fetch({collection: collection}));
      });

      $.whenAll.apply($, deferreds).always(function () {
        deferred.resolve();
      });

      return deferred.promise();
    }

  };

});


csui.define('csui/controls/mixins/view.state/node.selection.restore.mixin',['module',
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/lib/backbone', 'csui/utils/log'
], function (module, _, $, Marionette, Backbone, log) {
  'use strict';

  // Note: This mixin depends on the multi.node.fetch.mixin. You need to add the multi.node.fetch.mixin if you
  // use this mixin.

  log = log(module.id);

  var DEFAULT_KEY_NAME = 'key';

  return {

    /**
     * this method initializes for all items selection process accros pages.
     */
    initSelectionMixin: function (options, collection, key) {

      collection = collection || options.collection;

      var allSelectedNodes = collection.selectedItems || this.getCollectionWithSpecificModelId(collection);

      this.getAllSelectedNodes = function() {
        return allSelectedNodes;
      };
      
      this.allSelectedNodes = function() {
          return allSelectedNodes;
      };

      this.getContext = function() {
        return options.context;
      };

      this.getCollection = function() {
        return collection;
      };

      this.getKey = function () {
        return key || DEFAULT_KEY_NAME;
      };

      this.setSelectionKey = function (newkey) {
        key = newkey;
      };

      this.getConnector = function () {
        return options.connector || collection.connector;
      };

      var context        = this.getContext(),
          viewStateModel = context && context.viewStateModel;

      this.listenTo(allSelectedNodes, 'remove', this.removeItemToAllSelectedItems)
          .listenTo(allSelectedNodes, 'add', this.addItemToAllSelectedItems)
          .listenTo(allSelectedNodes, 'reset', this.resetAllSelectedItems);

      viewStateModel && this.listenTo(viewStateModel, 'change:multiItemOperationRunning', this._multiItemOperationEnded);

      this.listenTo(allSelectedNodes, 'reset update', function () {
        viewStateModel && viewStateModel.get("enabled") &&
        this._saveSelectedNodesInSessionViewState(this.getAllSelectedNodes(), this.getContext());
      }.bind(this));

      this.listenTo(collection, 'sync', this._restoreSelectedNodesFromSessionViewSate);
    },

    addTableViewSelectionEvents: function (tableView) {
      this.listenTo(tableView, 'tableRowSelected', function (args) {
        this.addNodesToSelection(args.nodes);
      });

      this.listenTo(tableView, 'tableRowUnselected', function (args) {
        this.removeNodesFromSelection(args.nodes);
      });
    },

    /**
     * This method creates a new Backbone collection and set's modelId, and if any other module
     * or in any other view which extends nodestable.view can override it if they do have unique
     * model id is other than default "id".
     *
     * @returns {*}
     */
    getCollectionWithSpecificModelId: function (collection) {
      var MultiSelectCollection = Backbone.Collection.extend({
            modelId: function (attr) {
              return attr.id;
            }
          }),
          allSelectedCollection = new MultiSelectCollection();
      if (collection && collection.modelId) {
        allSelectedCollection.modelId = collection.modelId;
      }
      return allSelectedCollection;
    },

    /**
     * this method removes specific item from all selection.
     *
     * @param node
     */
    removeItemToAllSelectedItems: function (node) {
      var model = this.getCollection().get(node) || this.getCollection().findWhere({id: node.get('id')});
      if (model) {
        model.set('csuiIsSelected', false); // will be ignored if already false
      } else {
        // update the node itself when unselect the node from different page
        node.set('csuiIsSelected', false);
      }
      
      this.onRemoveItemFromAllSelectedItems && this.onRemoveItemFromAllSelectedItems(node);
    },

    /**
     * this method adds new item to all selected items.
     *
     * @param node
     */
    addItemToAllSelectedItems: function (node) {
      var model = this.getCollection().get(node) || this.getCollection().findWhere({id: node.get('id')});
      if (model) {
        model.set('csuiIsSelected', true); // will be ignored if already true
      } else {
        // update the node itself when select the node from different page
        node.set('csuiIsSelected', true);
      }

      this.onAddItemToAllSelectedItems && this.onAddItemToAllSelectedItems(node);
    },

    /**
     * this method resets all selected item's collection.
     */
    resetAllSelectedItems: function () {
      var allSelectedNodes = this.getAllSelectedNodes();
      this.getCollection().each(_.bind(function (node) {
        var selectedNode = allSelectedNodes.get(node);
        node.set('csuiIsSelected', selectedNode !== undefined);// setting to same value is ignored
      }, this));

      this.onResetAllSelectedItems && this.onResetAllSelectedItems();
    },
    
    _saveSelectedNodesInSessionViewState: function () {
      if (this.restoringSelection) {
          return;
      }  
      var context        = this.getContext(),
          viewStateModel = context && context.viewStateModel;
      if (viewStateModel) {
        var selectedNodes = viewStateModel.getSessionViewState('selected_nodes') || {},
            ids = this.getAllSelectedNodes().models.map(function (model) {
              return model.get('id');
            });
        if (ids.length > 0) {
          if (selectedNodes) {
             selectedNodes = _.clone(selectedNodes);
          }  
          selectedNodes [this.getKey()] = ids;
          viewStateModel.setSessionViewState('selected_nodes', selectedNodes);
        } else {
            selectedNodes && (delete selectedNodes[this.getKey()]);
            if (Object.keys(selectedNodes) > 0) {
                viewStateModel.setSessionViewState('selected_nodes',  _.clone(selectedNodes));
            } else {
                viewStateModel.setSessionViewState('selected_nodes',  undefined);
            }
        }
      }
    },

    _multiItemOperationEnded: function () {
      var context        = this.getContext(),
          viewStateModel = context && context.viewStateModel;

      if (viewStateModel && !viewStateModel.get('multiItemOperationRunning') && this._restoreSelectedNodesPending) {
        this._restoreSelectedNodesFromSessionViewSate();
      }
    },

    _restoreSelectedNodesFromSessionViewSate: function () {

      var context = this.getContext(),
          viewStateModel = context && context.viewStateModel;

      if (viewStateModel && viewStateModel.get('multiItemOperationRunning')) {
        this._restoreSelectedNodesPending = true;
        return true;
      }

      if (viewStateModel && viewStateModel.get('enabled')) {
        var selectedNodes = viewStateModel.getSessionViewState('selected_nodes');
        if (selectedNodes) {
          var ids = selectedNodes[this.getKey()] || [],
              collection = this.getCollection(), connector = this.getConnector();
          ids = this._removeSelectedFetchedNodesIds(ids);
          if (ids && ids.length) {
            this.restoringSelection = true;
            this._getNodesFromCollection(collection, ids, connector)
                .done(this._afterFetchingAllSelectedNodes.bind(this));
          }
        }
      }
    },

    _afterFetchingAllSelectedNodes: function (allSelectedNodes, nodesInCollection) {
      var context = this.getContext(),
          viewStateModel = context && context.viewStateModel,
          sessionState = viewStateModel.get('session_state'),
          state        = viewStateModel.get('state');
      if (sessionState &&
           (sessionState.id === undefined || allSelectedNodes?.length>0 ||
           (state && state.filter && state.filter.length) || this.getKey() === DEFAULT_KEY_NAME)) {
        if (viewStateModel && viewStateModel.getSessionViewState('selected_nodes')) {
          this._resetSelectedNodeCollections(allSelectedNodes, nodesInCollection);
        }
      }
      this.restoringSelection = false;
    },

    // Reset all selected nodes and the selected nodes. Note: the selected nodes is what
    // is on the current displayed page and all the selected nodes is what is selected
    // on all the pages. This include the displayed and the undisplayed pages.
    _resetSelectedNodeCollections: function(allSelectedNodes, nodesInCollection) {
      var selectedNodes = this.getAllSelectedNodes();
      selectedNodes.reset(allSelectedNodes);
      if (this.thumbnailView) {
        nodesInCollection && this.thumbnail.selectedChildren.reset(nodesInCollection);
        if (this.collection.length > 0) {
          var selected = this.collection.where({ csuiIsSelected: true }).length;
          if (selected > 0) {
            this.thumbnail.updateSelectAllCheckbox.call(this);
          }
        }
      } else if (this.isTableViewInTheDom()) {
        nodesInCollection && this.tableView.selectedChildren.reset(nodesInCollection);
      } else {
          this.getCollection().trigger("sync");
      }
    },

    _removeSelectedFetchedNodesIds: function (ids) {
      var selectedNodes = this.getAllSelectedNodes();
      if (ids && ids.length > 0) {
        if (selectedNodes.length > 0) {
          ids = ids.filter(function (id) {
            var node = selectedNodes.find({id: id});
            return node && node.attributes.length === 1;
          });
        }
      }
      return ids;
    },

    isTableViewInTheDom:function() {
      return this.tableView && this.el;
    },

    setupTableSelection: function (tableView) {
      // correct the aria and icon of the filter icon after rendering when the children have been fetched
      this.listenTo(tableView.collection, 'sync', _.bind(function () {

       // on page navigation new models are loaded into this.collection,
        // so replacing with new models in allSelectedNodes to maintain consistency.
        var selectedNodes = this.getAllSelectedNodes();
        selectedNodes && selectedNodes.each(_.bind(function (model) {
          var targetModel = selectedNodes.get(model),
              index       = selectedNodes.findIndex(targetModel);
          if (index !== -1 && selectedNodes.at(index) !== model) {
            this.getAllSelectedNodes().remove(selectedNodes.at(index));
            this.getAllSelectedNodes().add(model, {at: index});
          }
        }, this));

        this.onTableViewCollectionSync();
        this.enableViewState && this._saveSelectedNodesInSessionViewState();
      }, this));
    },

    clearAllSelectedNodes: function () {
      var selectedNodes = this.getAllSelectedNodes();
      selectedNodes && selectedNodes.reset([]);
    },

    addNodesToSelection: function (nodes) {
      if (nodes) {
        var selectedNodes = this.getAllSelectedNodes();
        var selectedModels = selectedNodes.models.slice(0);
        _.each(nodes, function (node) {
          if (!selectedNodes.get(node) && node.get('id') !== undefined) {
            selectedModels.push(node);
          }
        }, this);
        selectedNodes.reset(selectedModels)
      }
    },

    removeNodesFromSelection: function (nodes) {
      if (nodes) {
        var selectedNodes = this.getAllSelectedNodes();
        _.each(nodes, function (node) {
          selectedNodes.remove(node, {silent: true});
        }, this);
        selectedNodes.reset(_.clone(selectedNodes.models));
      }
    }
  };

});


csui.define('csui/controls/mixins/search.query/search.query.mixin',[
  'csui/lib/underscore',
  'csui/utils/contexts/factories/connector',
  'csui/utils/url',
], function (_, ConnectorFactory, Url) {
  'use strict'

  var SearchQueryMixin = {
    mixin: function (prototype) {

      return _.extend(prototype, {

        searchQueryAction: function (id) {
          var context = this.context || this.options.context;
          var connector = context.getObject(ConnectorFactory);
          var postData = {
            "ids": id,
            "actions":["updatesearchbroker"]
          };
          var data = {
            method: 'POST',
            url: Url.combine(connector.getConnectionUrl().getApiBase('v2'), '/nodes/actions'),
            data: postData,
          };
          return connector.makeAjaxCall(data)
            
        },
      })
    }
  }
  return SearchQueryMixin;
})



;

csui.define('csui/controls/tile/behaviors/blocking.behavior',['csui/lib/underscore', 'csui/lib/marionette',
  'csui/controls/progressblocker/blocker'
], function (_, Marionette, BlockingView) {
  'use strict';

  var BlockingBehavior = Marionette.Behavior.extend({

    constructor: function BlockingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      var blockingParentView = getOption.call(this, 'blockingParentView', options);
      if (blockingParentView) {
        BlockingView.delegate(view, blockingParentView);
      } else {
        BlockingView.imbue(view);
      }

      if (this.collection) {
        view.listenTo(view.collection, "request", view.blockActions)
            .listenTo(view.collection, "sync", view.unblockActions)
          // TODO: Find a better workaround for model.destroy relaying request
          // event to the collection but not the sync and error events
            .listenTo(view.collection, "destroy", view.unblockActions)
            .listenTo(view.collection, "error", view.unblockActions);
      }
      if (view.model) {
        view.listenTo(view.collection, "request", view.blockActions)
            .listenTo(view.collection, "sync", view.unblockActions)
            .listenTo(view.collection, "error", view.unblockActions);
      }
    }

  });

  // TODO: Expose this functionality and make it generic for other behaviors
  function getOption(property, options) {
    options = this.options || options || {};
    var value = options[property];
    return _.isFunction(value) ? options[property].call(this.view) : value;
  }

  return BlockingBehavior;

});


csui.define('csui/controls/tile/behaviors/infinite.scrolling.behavior',['require', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/marionette'
], function (require, $, _, Marionette) {
  "use strict";

  var InfiniteScrollingBehavior = Marionette.Behavior.extend({

    defaults: {
      content: null,
      contentParent: null,
      fetchMoreItemsThreshold: 95
    },

    constructor: function ScrollingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      var bindEvent = getOption.call(this,'bindEvent') || 'render';
      var unbindEvent = getOption.call(this,'unbindEvent') || 'before:destroy';
      this.listenTo(view, bindEvent, this._bindScrollingEvents);
      this.listenTo(view, unbindEvent, this._unbindScrollingEvents);
    },

    _bindScrollingEvents: function () {
      var contentParent = this.__contentParent = getOption.call(this, 'contentParent');
      if (this._contentParent) {
        this._contentParent.off('scroll.' + this.view.cid);
      }
      this._contentParent = contentParent ? this.view.$(contentParent) : this.view.$el;
      this._contentParent.on('scroll.' + this.view.cid, _.bind(this._checkScrollPosition, this));
    },

    _checkScrollPosition: function () {
      var content = getOption.call(this, 'content');
      this._content = content ? this.view.$(content) :
                      this.__contentParent ? this._contentParent.children().first() : this.view.$el;
      var fetchMoreItemsThreshold = getOption.call(this, 'fetchMoreItemsThreshold') || this.defaults.fetchMoreItemsThreshold;
      var contentHeight;
      if (this._content.length === 1) {
        contentHeight = this._content.outerHeight(true);
      } else {
        contentHeight = _.reduce(this._content, function (sum, el) {return sum + $(el).outerHeight(true)}, 0);
      }
      var parentHeight         = this._contentParent.height(),
          scrollTop            = this._contentParent.scrollTop(),
          scrollablePercentage;
      // old formula: (all that was scrolled) / (all that is scrollable)
      // scrollablePercentage = scrollTop * 100 / (contentHeight - parentHeight);
      // this is wrong: it results in a division by zero error when contentHeight equals parentHeight.
      // Also the more you scroll down, the larger is the absolute distance to the end, when a fetch
      // is triggered and it can end up in multiple fetches with one scroll tick.
      // new formula: (height of the visible part of the last page) / (height of viewable area)
      // regardless how much you scroll, fetch is triggered at the same absolute distance to the end.
      scrollablePercentage = (parentHeight - (contentHeight - scrollTop - parentHeight))*100/parentHeight;
      if (scrollablePercentage >= fetchMoreItemsThreshold) {
        this._checkScrollPositionFetch();
      }
    },

    _checkScrollPositionFetch: function () {
      var collection = this.view.collection;
      if (collection.length < collection.totalCount && !collection.fetching &&
          collection.skipCount < collection.length) {
        if (this.fetching) {
          // if another scroll event is triggered while fetch is still in progress, ignore.
          return;
        }
        this.fetching = true;
        var self = this;
        this.view.trigger('before:collection:scroll:fetch');
        collection.setSkip(collection.length, false);

        collection.fetch({
          reset: false,
          remove: false,
          merge: false,
          success: function () {
            delete self.fetching;
            self.view.trigger('collection:scroll:fetch');
          },
          error: function() {
            delete self.fetching;
            self.view.trigger('collection:scroll:fetch:error');
          }
        });
      }
    },

    _unbindScrollingEvents: function () {
      if (this._contentParent) {
        this._contentParent.off('scroll.' + this.view.cid);
      }
    }

  });

  // TODO: Expose this functionality and make it generic for other behaviors
  function getOption(property) {
    var options = this.options || {};
    var value = options[property];
    return _.isFunction(value) ? value.call(this.view) : value;
  }

  return InfiniteScrollingBehavior;

});


csui.define('css!csui/controls/tile/behaviors/impl/perfect.scrolling',[],function(){});

csui.define('csui/controls/tile/behaviors/perfect.scrolling.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/utils/base', 'csui/utils/accessibility',
  'csui/lib/perfect-scrollbar',
  'css!csui/controls/tile/behaviors/impl/perfect.scrolling'
], function (module, _, $, Marionette, base, Accessibility) {
  'use strict';

  // Default static options for the behaviour object
  var config = module.config();
  _.defaults(config, {
    usePerfectScrollbar: false
  });
  if (Accessibility.isAccessibleMode()) {
    config.usePerfectScrollbar = false;
  }

  // Default options for the perfect scrollbar plugin to be created with
  var defaultPluginOptions = {
    minScrollbarLength: 32,
    stopPropagationOnClick: false
  };

  var PerfectScrollingRegion = Marionette.Region.extend({
    constructor: function PerfectScrollingRegion(options) {
      Marionette.Region.prototype.constructor.apply(this, arguments);
      // Set when before:swapOut is triggered and reset when its finishing
      // counterpart is triggered to optimize the event handlers for view
      // swapping in the region
      this._swapping = false;

      // Support scrollbar updates on populating and emptying regions
      this
          .listenTo(this, 'before:swapOut', function () {
            this._swapping = true;
          })
          .listenTo(this, 'swapOut', function () {
            this._swapping = false;
          })
          .listenTo(this, 'show', function () {
            this._requestScrollbarUpdate();
          })
          .listenTo(this, 'empty', function () {
            if (!this._swapping) {
              this._requestScrollbarUpdate();
            }
          });
    },

    _requestScrollbarUpdate: function () {
      // {this.region}.{owning region manager}.{owning layout view}
      this._parent._parent.trigger('update:scrollbar');
    }
  });

  var PerfectScrollingBehavior = Marionette.Behavior.extend({
    defaults: {
      contentParent: null
    },

    constructor: function PerfectScrollingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      this.listenTo(view, 'render', this._applyClasses);

      if (this._useScrollbar() && this._usePerfectScrollbar()) {
        var updateOnWindowResize = getOption.call(this, 'updateOnWindowResize');
        // Increase when before:render and before:render:collection events
        // are triggered and decrease, when their finishing counterparts are
        // triggered to optimize the event handlers for single view adding
        // or removal
        this._renderState = 0;

        this
        // Bubbling from a child view with ParentScrollbarUpdatingBehavior
        // and window resizing (if the view resizes itself by CSS only)
            .listenToOnce(view, 'render', function () {
              this.view.$el.on('csui:update:scrollbar.' + view.cid,
                  _.bind(this._updateScrollbarFromPropagation, this));
              if (updateOnWindowResize !== false) {
                $(window).on('resize.' + view.cid, _.bind(this._updateScrollbar, this));
              }
            })
            .listenToOnce(view, 'before:destroy', function () {
              this.view.$el.off('csui:update:scrollbar.' + view.cid);
              if (updateOnWindowResize !== false) {
                $(window).off('resize.' + view.cid);
              }
            })
            // Maintain the rendering state for the events triggered between
            // before:render and render
            .listenTo(view, 'before:render', function () {
              this._renderState = 1;
              // console.log('Perfect scrollbar expects render event',
              //     Object.getPrototypeOf(this.view).constructor.name);
            })
            .listenTo(view, 'render', function () {
              this._renderState = 0;
            })
            // Create and destroy the perfect scrollbar plugin
            .listenTo(view, 'dom:refresh', this._ensureScrollbar)
            .listenTo(view, 'ensure:scrollbar', this._ensureScrollbar)
            .listenTo(view, 'before:render', this._destroyScrollbar)
            .listenTo(view, 'before:destroy', this._destroyScrollbar)
            // Listen to requests for an explicit scrollbar update
            .listenTo(view, 'update:scrollbar', this._refreshScrollbar)
            // Delay listening to the collection events; the collection may
            // not be present in the view or its options yet
            .listenToOnce(view, 'before:render', function () {
              // Support optimized adding and removing child views
              // in CollectionView, which does not call render
              if (view instanceof Marionette.CollectionView && view.collection) {
                this
                    .listenTo(view.collection, 'reset', function () {
                      this._resetTriggered = true;
                      // console.log('Perfect scrollbar expects reset event processed',
                      //     Object.getPrototypeOf(this.view).constructor.name);
                    })
                    .listenTo(view, 'before:render:collection', function () {
                      ++this._renderState;
                      // console.log('Perfect scrollbar expects render:collection event',
                      //     Object.getPrototypeOf(this.view).constructor.name);
                    })
                    .listenTo(view, 'render:collection', function () {
                      this._resetTriggered = false;
                      --this._renderState;
                      // console.log('Perfect scrollbar received render:collection event',
                      //     Object.getPrototypeOf(this.view).constructor.name);
                      // If the collection was re-rendered after catching the
                      // 'reset' event, single child view updates were skipped
                      if (!this._renderState) {
                        // console.log('Perfect scrollbar got update from children reset');
                        this._updateScrollbar();
                      }
                    })
                    .listenTo(view, 'render:empty', function () {
                      // If the collection was re-rendered after catching the
                      // 'reset' event, no child view updates were performed
                      if (this._resetTriggered || !this._renderState) {
                        // console.log('Perfect scrollbar got update from children emptied');
                        this._updateScrollbar();
                      }
                    })
                    .listenTo(view, 'add:child', function () {
                      // If a child view was added alone, otside the 'reset' event
                      // handler and render() method call, request the update
                      if (!this._renderState) {
                        // console.log('Perfect scrollbar got update from child add');
                        this._updateScrollbar();
                      }
                    })
                    .listenTo(view, 'remove:child', function () {
                      // If a child view was removed alone, otside the 'reset' event
                      // handler and render() method call, request the update
                      if (!this._resetTriggered && !this._renderState) {
                        // console.log('Perfect scrollbar got update from child remove');
                        this._updateScrollbar();
                      }
                    });
              }
            });
      }
    },

    _applyClasses: function () {
      // console.log('Perfect scrollbar got render in',
      //     Object.getPrototypeOf(this.view).constructor.name);
      var classes;
      this._contentParent = this._getContentParent();
      if (this._useScrollbar()) {
        if (this._usePerfectScrollbar()) {
          classes = 'csui-perfect-scrolling';
        } else {
          var suppressScrollX = getOption.call(this, 'suppressScrollX'),
              suppressScrollY = getOption.call(this, 'suppressScrollY');
          classes = 'csui-normal-scrolling';
          if (suppressScrollX) {
            classes += ' csui-no-scroll-x';
          }
          if (suppressScrollY) {
            classes += ' csui-no-scroll-y';
          }
        }
      } else {
        classes = 'csui-no-scrolling';
      }
      this._contentParent.addClass(classes);
    },

    _ensureScrollbar: function () {
      // obtain content parent from options if it is available.
      this._contentParent = !!this._contentParent ? this._contentParent : this._getContentParent();
      // console.log('Perfect scrollbar got dom:refresh in',
      //     Object.getPrototypeOf(this.view).constructor.name);
      if (!this._contentParent) {
        throw new Error('The "dom:refresh"" event was triggered earlier ' +
                        'than the "render" event in view ' + this.view.cid +
                        '(' + Object.getPrototypeOf(this.view).constructor.name + ')');
      }
      if (this._perfectScrollbar) {
        //if (!this._contentParent.data('perfect-scrollbar')) { // 'ps-id' for 0.6.7
        //  throw new Error('Uninitialized perfect-scrollbar in view ' + this.view.cid +
        //                  '(' + Object.getPrototypeOf(this.view).constructor.name + ')');
        //}
        this._contentParent.perfectScrollbar('update');
      } else {
        var options = _.reduce(['suppressScrollX', 'suppressScrollY', 'scrollXMarginOffset',
          'scrollYMarginOffset', 'maxScrollbarLength', 'minScrollbarLength', 'includePadding'
        ], function (result, property) {
          var value = getOption.call(this, property);
          value && (result[property] = value);
          return result;
        }, {}, this);
        _.defaults(options, defaultPluginOptions);
        this._contentParent.perfectScrollbar(options);
        this._perfectScrollbar = true;

        //Keep focus on scroll rail if focus was removed due to an inline click event.
        this._setClickEventFocus();
      }
    },

    _setClickEventFocus: function () {
      var yRail = this._contentParent.find('.ps-scrollbar-y-rail');
      var xRail = this._contentParent.find('.ps-scrollbar-x-rail');

      //For chrome only, when you click within a rail to scroll, a mouseleave event is
      //triggered removing focus and hover from the rail. To maintain hover status, a
      //class is added to the scroll rail
      if (base.isChrome()) {
        this._setClickEventRailFocus(yRail);
        this._setClickEventRailFocus(xRail);
      }
      //For FF and IE, when you click to drag a scrollbar, a mouseleave event is
      //triggered removing focus and hover from the rail. To maintain hover status, a
      //class is added to the scroll rail
      else {
        var yScrollBar = this._contentParent.find('.ps-scrollbar-y');
        var xScrollBar = this._contentParent.find('.ps-scrollbar-x');
        this._setClickEventBarFocus(yScrollBar, yRail);
        this._setClickEventBarFocus(xScrollBar, xRail);
      }
    },

    _setClickEventBarFocus: function (xyBar, xyRail) {
      var self = this;
      xyBar.on('mousedown', function (e) {
        self.addXYFocus = true;
        xyRail.addClass('binf-focus');
      });
      xyRail.on('mouseout', function (e) {
        if (!self.addXYFocus) {
          xyRail.removeClass('binf-focus');
          xyRail.blur();
        }
        self.addXYFocus = false;
      });
    },

    _setClickEventRailFocus: function (xyRail) {
      var self = this;
      if (xyRail.length > 0) {
        xyRail.on('mouseup', function (e) {
          $(this).addClass('binf-focus');
          self.addXYFocus = true;
        });
        xyRail.on('mouseleave', function (e) {
          if (!self.addXYFocus) {
            $(this).removeClass('binf-focus');
          }
          self.addXYFocus = false;
        });
      }
    },

    _refreshScrollbar: function () {
      // console.log('Perfect scrollbar was refreshed in',
      //     Object.getPrototypeOf(this.view).constructor.name);
      if (this._contentParent && this._perfectScrollbar) {
        // Workaround for broken views, which re-render their content
        // but do not trigger the render event, like table view.
        if (!(this._contentParent.find('.ps-scrollbar-y-rail').length ||
            this._contentParent.find('.ps-scrollbar-x-rail').length)) {
          this._destroyScrollbar();
          this._ensureScrollbar();
        } else {
          this._updateScrollbar();
        }
      }
    },

    _updateScrollbar: function () {
      // console.log('Perfect scrollbar got update in',
      //     Object.getPrototypeOf(this.view).constructor.name);
      if (this._perfectScrollbar) {
        this._contentParent.perfectScrollbar('update');
      }
    },

    _updateScrollbarFromPropagation: function (event) {
      // console.log('Perfect scrollbar got update from a child in',
      //     Object.getPrototypeOf(this.view).constructor.name);
      event.stopPropagation();
      this._updateScrollbar();
    },

    _destroyScrollbar: function () {
      // console.log('Perfect scrollbar got destroy or re-render in',
      //     Object.getPrototypeOf(this.view).constructor.name);
      if (this._perfectScrollbar) {
        this._contentParent.perfectScrollbar('destroy');
        this._contentParent.find('.ps-scrollbar-y-rail').off();
        this._contentParent.find('.ps-scrollbar-x-rail').off();
        this._perfectScrollbar = false;
      }
    },

    _getContentParent: function () {
      var contentParent = getOption.call(this, 'contentParent');
      if (contentParent) {
        if (contentParent.insertAfter) { // check for a jQuery object
          return contentParent;
        }
        if (_.isElement(contentParent)) { // check for a HTML element
          return $(contentParent);
        }
        return this.view.$(contentParent); // DOM selector
      }
      return this.view.$el; // use the view root element by default
    },

    _useScrollbar: function () {
      var scrollingDisabled = getOption.call(this, 'scrollingDisabled') ||
                              getOption.call(this, 'scrollingDisabled', this.view.options);
      return !scrollingDisabled;
    },

    _usePerfectScrollbar: function () {
      return PerfectScrollingBehavior.usePerfectScrollbar();
    }
  }, {
    // Support showing and emptying regions in LayoutView,
    // which does not call render
    Region: PerfectScrollingRegion,

    usePerfectScrollbar: function () {
      return config.usePerfectScrollbar &&
             !(base.isTouchBrowser() || base.isIE11());
      //return false;
    }
  });

  // TODO: Expose this functionality and make it generic for other behaviors
  function getOption(property, source) {
    var options = source || this.options || {};
    var value = options[property];
    return _.isFunction(value) ? options[property].call(this.view) : value;
  }

  return PerfectScrollingBehavior;
});


csui.define('csui/controls/tile/behaviors/parent.scrollbar.updating.behavior',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior'
], function (_, $, Marionette, PerfectScrollingBehavior) {
  'use strict';

  var ParentScrollbarUpdatingRegion = Marionette.Region.extend({

    constructor: function ParentScrollbarUpdatingRegion(options) {
      Marionette.Region.prototype.constructor.apply(this, arguments);
      // Set when before:swapOut is triggered and reset when its finishing
      // counterpart is triggered to optimize the event handlers for view
      // swapping in the region
      this._swapping = false;
      
      // Support scrollbar updates on populating and emptying regions
      this
          .listenTo(this, 'before:swapOut', function () {
            this._swapping = true;
          })
          .listenTo(this, 'swapOut', function () {
            this._swapping = false;
          })
          .listenTo(this, 'show', function () {
            this._requestScrollbarUpdate();
          })
          .listenTo(this, 'empty', function () {
            if (!this._swapping) {
              this._requestScrollbarUpdate();
            }
          });
    },

    _requestScrollbarUpdate: function () {
      // There is no connection from the current view in the region to the layout
      // view, which could be used for event triggering.  Use DOM event bubbling
      // as a workaround to reach the parent views.
      // {this.region}.{owning region manager}.{owning layout view}
      triggerScrollbarUpdate(this._parent._parent);
    }

  });

  var ParentScrollbarUpdatingBehavior = Marionette.Behavior.extend({

    constructor: function ParentScrollbarUpdatingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      if (PerfectScrollingBehavior.usePerfectScrollbar()) {
        var updateOnWindowResize = getOption.call(this, 'updateOnWindowResize');
        // Increase when before:render and before:render:collection events
        // are triggered and decrease, when their finishing counterparts are
        // triggered to optimize the event handlers for single view adding
        // or removal
        this._renderState = 0;
        
        this
        // Maintain the rendering state for the events triggered between
        // before:render and render
            .listenTo(view, 'before:render', function () {
              this._renderState = 1;
            })
            .listenTo(view, 'render', function () {
              this._renderState = 0;
              this._requestScrollbarUpdate();
            })
            // Listen to requests for an explicit scrollbar update
            .listenTo(view, 'update:scrollbar', this._requestScrollbarUpdate)
            // Delay listening to the collection events; the collection may
            // not be present in the view or its options yet
            .listenToOnce(view, 'before:render', function () {
              if (updateOnWindowResize) {
                $(window).on('resize.' + view.cid, _.bind(this._updateScrollbar, this));
                this.listenToOnce(view, 'before:destroy', function () {
                  $(window).off('resize.' + view.cid);
                });
              }
              // Support optimized adding and removing child views
              // in CollectionView, which does not call render
              if (view instanceof Marionette.CollectionView && view.collection) {
                this
                    .listenTo(view.collection, 'reset', function () {
                      this._resetTriggered = true;
                    })
                    .listenTo(view, 'before:render:collection', function () {
                      ++this._renderState;
                    })
                    .listenTo(view, 'render:collection', function () {
                      this._resetTriggered = false;
                      --this._renderState;
                      // If the collection was re-rendered after catching the
                      // 'reset' event, single child view updates were skipped
                      if (!this._renderState) {
                        this._requestScrollbarUpdate();
                      }
                    })
                    .listenTo(view, 'render:empty', function () {
                      // If the collection was re-rendered after catching the
                      // 'reset' event, no child view updates were performed
                      if (this._resetTriggered || !this._renderState) {
                        this._requestScrollbarUpdate();
                      }
                    })
                    .listenTo(view, 'add:child', function () {
                      // If a child view was added alone, otside the 'reset' event
                      // handler and render() method call, request the update
                      if (!this._renderState) {
                        this._requestScrollbarUpdate();
                      }
                    })
                    .listenTo(view, 'remove:child', function () {
                      // If a child view was removed alone, otside the 'reset' event
                      // handler and render() method call, request the update
                      if (!this._resetTriggered && !this._renderState) {
                        this._requestScrollbarUpdate();
                      }
                    });
              }
            });
      }
    },

    _requestScrollbarUpdate: function () {
      // ChildView should proxy all events to its parent with the 'childview:'
      // prefix, but this concept supports only CollectionView.  Use DOM event
      // bubbling as a workaround to reach the parent views.
      triggerScrollbarUpdate(this.view);
    }

  }, {

    // Support showing and emptying regions in LayoutView,
    // which does not call render
    Region: ParentScrollbarUpdatingRegion

  });

  function triggerScrollbarUpdate(view) {
    // console.log('Updating parent scrollbar requested in',
    //     Object.getPrototypeOf(view).constructor.name);
    $.event.trigger('csui:update:scrollbar', {view: view}, view.el, false);
  }

  // TODO: Expose this functionality and make it generic for other behaviors
  function getOption(property, source) {
    var options = source || this.options || {};
    var value = options[property];
    return _.isFunction(value) ? options[property].call(this.view) : value;
  }

  return ParentScrollbarUpdatingBehavior;

});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/tile/behaviors/impl/searching.behavior',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<form class=\"search-box binf-hidden\">\n  <input class=\"search\" type=\"search\" placeholder=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchPlaceholder") || (depth0 != null ? lookupProperty(depth0,"searchPlaceholder") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchPlaceholder","hash":{},"loc":{"start":{"line":2,"column":51},"end":{"line":2,"column":72}}}) : helper)))
    + "\" style=\"display: none\">\n  <span class=\"clearer csui-icon formfield_clear\"></span>\n</form><span class=\"icon icon-search\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchIconTitle") || (depth0 != null ? lookupProperty(depth0,"searchIconTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchIconTitle","hash":{},"loc":{"start":{"line":4,"column":45},"end":{"line":4,"column":64}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchIconAria") || (depth0 != null ? lookupProperty(depth0,"searchIconAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchIconAria","hash":{},"loc":{"start":{"line":4,"column":78},"end":{"line":4,"column":96}}}) : helper)))
    + "\" role=\"button\"></span>\n";
}});
Handlebars.registerPartial('csui_controls_tile_behaviors_impl_searching.behavior', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/controls/tile/behaviors/searching.behavior',['csui/lib/underscore', 'csui/lib/marionette',
  'hbs!csui/controls/tile/behaviors/impl/searching.behavior',
  'csui/lib/jquery.ui/js/jquery-ui'
], function (_, Marionette, template) {
  "use strict";

  var SearchingBehavior = Marionette.Behavior.extend({

    defaults: {
      searchPlaceholder: 'Type to filter',
      headerTitle: '.tile-title',
      searchButton: '.tile-controls'
    },

    ui: function () {
      var headerTitle = getOption.call(this, 'headerTitle');
      return {
        headerTitle: headerTitle,
        searchBox: '.search-box',
        searchInput: '.search',
        clearer: '.clearer'
      };
    },

    triggers: {
      'click .icon-search': 'toggle:search'
    },

    constructor: function SearchingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.listenTo(view, 'render', this._renderSearchButton);
      this.listenTo(view, 'toggle:search', this._toggleSearching);
    },

    _renderSearchButton: function () {
      var searchButtonSelector = getOption.call(this, 'searchButton'),
          searchButton         = this.view.$(searchButtonSelector),
          searchPlaceholder    = getOption.call(this, 'searchPlaceholder'),
          iconTitle = getOption.call(this, 'searchIconTitle'),
          searchIconTitle = iconTitle ? iconTitle : 'Search',
          iconAria = getOption.call(this, 'searchIconAria'),
          searchIconAria = iconAria ? iconAria : searchIconTitle,
          data                 = {
            searchPlaceholder: searchPlaceholder,
            searchIconTitle: searchIconTitle,
            searchIconAria: searchIconAria
          };
      searchButton.html(template(data));
      this.view._bindUIElements.call(this);
    },

    _toggleSearching: function () {
      var self = this;
      this.ui.searchInput.val('');
      this.ui.clearer.toggle(false);
      this.ui.headerTitle.toggle('fade');
      this.ui.searchBox.removeClass('binf-hidden');
      this.ui.searchInput.toggle('blind', {direction: 'right'}, 200, function () {
        if (self.ui.searchInput.is(":visible")) {
          self.ui.searchInput.trigger('focus');
        }
      });
    }

  });

  // TODO: Expose this functionality and make it generic for other behaviors
  function getOption(property) {
    var options = this.options || {};
    var value = options[property];
    return _.isFunction(value) ? options[property].call(this.view) : value;
  }

  return SearchingBehavior;

});


/**
 * Behaviour applied to draggable item, works along with dnd.container.behaviour.js
 */
csui.define('csui/behaviors/drag.drop/dnd.item.behaviour',['csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/lib/backbone'
], function (_, $, Marionette, Backbone) {

  var DragAndDropItemBehaviour = Marionette.Behavior.extend({
    constructor: function DragAndDropItemBehaviour(options, view) {
      this.view = view;
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this._registerListeners();
    },

    _registerListeners: function () {
      this.listenTo(this.view, 'render', this._initDnD);
    },

    _initDnD: function () {
      this.$el.addClass(DragAndDropItemBehaviour.DRAGGABLE_CLASSNAME);
      this.$el.attr(DragAndDropItemBehaviour.DRAGGABLE_DATA_ATTR, this.view.model.cid);
    }
  }, {
    DRAGGABLE_CLASSNAME: 'csui-draggable-item',
    DRAGGABLE_DATA_ATTR: 'data-csui-draggable-item'
  });

  return DragAndDropItemBehaviour;
});

csui.define('csui/behaviors/drag.drop/dnd.container.behaviour',['require', 'i18n', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/lib/backbone', 'csui/behaviors/drag.drop/dnd.item.behaviour',
  'csui/lib/jquery.ui/js/jquery-ui'
], function (require, i18n, _, $, Marionette, Backbone, DnDItemBehaviour) {

  var DragAndDropContainerBehaviour = Marionette.Behavior.extend({

    defaults: {
      placeholder: undefined, // a class or function. Undefined represents close of original element
      handle: undefined, // Restricts sort start click to the specified element.
      draggableItem: '.' + DnDItemBehaviour.DRAGGABLE_CLASSNAME,
      disableDraggable: '.csui-draggable-item-disable',
      over: false,
      receive: false,
      helper: "original" // Use original element as drag image
    },

    constructor: function DragAndDropContainerBehaviour(options, view) {
      this.view = view;
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.listenTo(this.view, 'render', this._initSorting);
    },

    _getPlaceholder: function (currentItem) {
      var placeholder = this.options.placeholder;
      if (!placeholder || _.isString(placeholder)) {
        var className = placeholder;
        placeholder = function () {
          var nodeName = currentItem[0].nodeName.toLowerCase(),
              element  = $("<" + nodeName + ">");

          element.addClass("ui-sortable-placeholder")
              .addClass(className || currentItem[0].className)
              .removeClass("ui-sortable-helper");
          return element;
        };
      }
      return placeholder.call(this, currentItem);
    },

    _initSorting: function () {
      var self = this;
      this.view.$el.addClass('csui-dnd-container');
      this.$el.sortable({
        items: this.options.draggableItem,
        cancel: this.options.disableDraggable,
        handle: this.options.handle,
        placeholder: {
          element: this._getPlaceholder.bind(this),
          update: function () {}
        },
        helper: this.options.helper,
        start: this._onSortStart.bind(this),
        stop: this._onSortStop.bind(this),
        over: this.options.over,
        out: this.options.out,
        receive: this.options.receive
      });
    },

    _onSortStart: function (event, ui) {
      this.$el.addClass('csui-drag-start');
      var allContainers = $('.csui-dnd-container'),
          excludedContainer = $(ui.helper).closest('.csui-dnd-container'),
          disabledContainers = allContainers.filter(function(e) {
            return !allContainers.get(e).isSameNode(excludedContainer.get(0));
          });
      disabledContainers.addClass('dnd-disabled');
      $(ui.helper).css('pointer-events','none');
      this.options.start && this.options.start(event, ui);
    },

    /**
     * Update respective Backbone colleciton on DOM changes
     */
    _onSortStop: function (event, ui) {
      this.$el.removeClass('csui-drag-start');
      $('.csui-dnd-container').removeClass('dnd-disabled');
      var dragItemId = ui.item.attr(DnDItemBehaviour.DRAGGABLE_DATA_ATTR);
      var model = this.view.collection.get(dragItemId);
      var modelIndex = this.view.collection.indexOf(model);
      var updatedIndex = this.$el.find('[data-csui-draggable-item=' + dragItemId + ']').index();
      if (modelIndex === updatedIndex) {
        // DOM placement not changes.. no collection update required.
        return;
      }
      this.view.collection.remove(model, {silent: true});
      this.view.collection.add(model, {at: updatedIndex, silent: true});
      // Trigger sort to let CollectionView reorder views according to collection order modifications.
      this.view.collection.trigger('sort');
      this.options.stop && this.options.stop(event, ui);
    }
  });

  return DragAndDropContainerBehaviour;
});


/**
 * This is CSUI specific error view.
 * If any module/products want different implementation, please point
 * directly to "smart/dialogs/modal.alert/modal.alert" instead-of
 * pointing to this class.
 */
csui.define('csui/dialogs/modal.alert/modal.alert',['nuc/utils/log',
  'smart/dialogs/modal.alert/modal.alert'
], function (log, SmartModelAlert) {
  'use strict';

  log.warn("Use modal alert from smart controls instead of depending on csui modal alert");
  var ModalAlertView = SmartModelAlert.extend({

    constructor: function ModalAlertView(options) {
      SmartModelAlert.prototype.constructor.call(this, options);
    }
  });

  return ModalAlertView;
});


csui.define('csui/perspectives/impl/nls/lang',{
    // Always load the root bundle for the default locale (en-us)
    "root": true,
    // Do not load English locale bundle provided by the root bundle
    "en-us": false,
    "en": false
  });
  

csui.define('csui/perspectives/impl/nls/root/lang',{
  invalidWidgetOptions: 'Some widgets have options that require values before the perspective can be saved. Please click on each of the highlighted widgets and check for any required options that have missing values.',
  invalidWidget: 'Some widgets are not configurable. Please remove these widgets to save.',
  widgetsMigrated: 'Single shortcut widgets were converted to shortcut group widgets.',
  widgetValidationFailed: 'Validation failed for some of the widgets.'
});



csui.define(
    'csui/perspectives/mixins/perspective.edit.mixin',['require', 'csui/lib/underscore', 'csui/lib/jquery', "csui/utils/log",
      'i18n!csui/perspectives/impl/nls/lang', 'csui/models/node/node.model',
      'csui/models/widget/widget.model',
      'csui/utils/contexts/factories/connector', 'csui/utils/perspective/perspective.util'],
    function (require, _, $, log, lang, NodeModel, WidgetModel, ConnectorFactory, PerspectiveUtil) {
      'use strict';
      /**
       * Mix provides supported functionality required for Perspective Inline Editing
       */
          // used for constant extraction, fields which when specified must be replaced with constants
          // when perspective is transported
      var CONSTANT_FIELD_TYPES = ['otcs_node_picker', 'otconws_workspacetype_id',
            'otcs_user_picker', 'otconws_metadata', 'otconws_customcolumn'];

      var PerspectiveEditMixin = {
        mixin: function (prototype) {
          return _.extend(prototype, {

            /**
             * Get prepare for perspective edit. Add required event listeners
             */
            prepareForEditMode: function () {
              this.listenTo(this, 'update:widget:options',
                  function (config) {
                    var widget = config.widgetView.model.get('widget');
                    if (widget.type === 'csui/perspective.manage/widgets/perspective.widget') {
                      widget = widget.options;
                    }
                    widget.options = config.options;
                    config.widgetView.model.set('hasValidOptions', config.isValid, {
                      silent: true
                    });
                  });
            },

            _notifyAboutWidgetMigrations: function () {
              csui.require([
                'csui/controls/globalmessage/globalmessage'
              ], function (GlobalMessage) {
                // Perspective save success
                GlobalMessage.showMessage("info", lang.widgetsMigrated);
              });
            },

            /**
             * Loads View and Manifest of the widgets provided
             *
             * @param {Array<{type: ""}>} widgets
             */
            _resolveWidgets: function (widgets) {
              var self          = this,
                  deferred      = $.Deferred(),
                  uniqueWidgets = _.chain(widgets)
                      .pluck('type')
                      .unique()
                      .map(function (id) {
                        return {id: id};
                      })
                      .value(),
                  allWidgets    = _.map(uniqueWidgets, function (w) {
                    return self._resolveWidget(w, true);
                  });

              function resolveDeprecates(widgetModel, widget) {
                if (widgetModel.useInstead) {
                  var migratedView = widgetModel.useInstead.get('view');
                  if (_.isFunction(migratedView.migrateData)) {
                    // Migrate data also to new widget
                    widget.options = migratedView.migrateData(widget.type, widget.options);
                  }
                  widget.type = widgetModel.useInstead.id;
                  widget.view = migratedView;
                  return resolveDeprecates(widgetModel.useInstead, widget);
                }
                return widgetModel;
              }

              $.whenAll.apply($, allWidgets).always(function (resolvedWidgets) {
                var foundDeprecatedWidgets = false,
                    byId                   = {};
                _.each(uniqueWidgets, function (w, index) {
                  byId[w.id] = resolvedWidgets[index];
                });

                var result = _.map(widgets, function (widget) {
                  var widgetModel = byId[widget.type];
                  var finalWidget = resolveDeprecates(widgetModel, widget);
                  if (widgetModel !== finalWidget) {
                    // Migrated
                    foundDeprecatedWidgets = true;
                  }
                  return finalWidget;
                });
                if (foundDeprecatedWidgets) {
                  self._notifyAboutWidgetMigrations();
                  self.options.context.pmanView.foundDeprecatedWidgets = true;
                }
                deferred.resolve(result);
              });
              return deferred;
            },

            _resolveWidget: function (widget, supressError) {
              var self            = this,
                  deferred        = $.Deferred(),
                  _errorHandler   = function (error) {
                    if (supressError) {
                      deferred.resolve(widgetModel);
                    } else {
                      deferred.reject(error);
                    }
                  },
                  _successHandler = function () {
                    var manifest = widgetModel.get('manifest');
                    if (!self._isPersonalizeMode() && manifest.deprecated && manifest.useInstead) {
                      widgetModel.deprecated = manifest.deprecated;
                      self._resolveWidget({id: manifest.useInstead}).then(function (userInstead) {
                        widget.view = userInstead.view;
                        widgetModel.useInstead = userInstead;
                        deferred.resolve(widgetModel);
                      }, _errorHandler);
                    } else {
                      widget.view = widgetModel.get('view');
                      deferred.resolve(widgetModel);
                    }
                  };
              var widgetModel = new WidgetModel({id: widget.id || widget.type});
              widgetModel.fetch().then(_successHandler, _errorHandler);
              return deferred.promise();
            },

            /**
             * Serialize widget options
             */
            serializeWidget: function (model, constantsDataSeed, ignoreErrors) {//constantsDataSeed: path for constant extraction
              var deferred = $.Deferred();
              var widget = model.get('widget');
              if (widget.type === 'csui/widgets/error') {
                // Error widget indicates, original cannot load / initial widget. Respoective module might be uninstalled later.
                // Hence cannot be configurated. So retain configuration of original widget.
                widget = widget.options.originalWidget;
                // TODO Take care of constant data as it cannot be evaluated now since widget is not available.
                widget = _.pick(widget, 'type', 'kind', 'options',
                    PerspectiveUtil.getExtraWidgetKeys());
                deferred.resolve({
                  widget: widget,
                });
                return deferred.promise();
              }
              if (model.get('hasValidOptions') !== false || ignoreErrors) {
                // Has valid form options
                var type    = widget.type,
                    options = widget.options;
                delete options?.___pman_opencallout;
                if (type === 'csui/perspective.manage/widgets/perspective.widget') {
                  type = options.widget.id;
                  widget.type = type;
                  options = options.options;
                  if(type === "csui/widgets/html.editor"){
                    widget.options = options;
                  }
                }
                options = PerspectiveEditMixin.removeNullsInObject(options);
                //Fetch widget model for the widget
                this._resolveWidget(widget).done(_.bind(function (widgetModel) {
                  var widgetManifest = widgetModel ? widgetModel.get('manifest') :
                      {},
                      properties     = widgetManifest && widgetManifest.options ?
                                       widgetManifest.options : {};
                  var constantsData = [];
                  this.collectionConstantData(options, properties, constantsData,
                      constantsDataSeed + '/options');
                  widget = _.pick(widget, 'type', 'kind', PerspectiveUtil.getExtraWidgetKeys());
                  widget.options = options;
                  deferred.resolve({
                    widget: widget,
                    constantsData: constantsData
                  });
                }, this)).fail(function (error) {
                  deferred.reject({
                    error: lang.invalidWidget
                  });
                });
              } else {
                // Invalid options form
                deferred.reject({
                  error: lang.invalidWidgetOptions
                });
              }
              return deferred.promise();
            },

            //Collect attributes if any, which are needed to be replaced with constants
            collectionConstantData: function (data, options, constants, seed) {
              if (_.isEmpty(options)) {
                return;
              }
              if (_.isArray(data)) {
                //data contains items which are to be traversed
                _.each(data, function (value, key) {
                  this.collectionConstantData(value, options.items, constants, seed + '/' + key);
                }, this);
              } else if (_.isObject(data)) {
                //data contains fields which are to be traversed
                _.each(data, function (value, key) {
                  if (!!options.fields && !!options.fields[key]) {
                    this.collectionConstantData(value, options.fields[key], constants,
                        seed + '/' + key);
                  }
                }, this);
              } else if (CONSTANT_FIELD_TYPES.indexOf(options.type) !== -1) {
                //attribute which constant generation
                constants.push({
                  type: options.type,
                  path: seed
                });
              }
            },

            _isPersonalizeMode: function() {
              return this.options.perspectiveMode === PerspectiveUtil.MODE_PERSONALIZE;
            },

            /**
             * Execute callbacks if any, once for each widget type in current perspective
             */
            executeCallbacks: function (models, perspectiveModel, context) {
              // Avoid executing callbacks in "Personalize" mode
              if (this._isPersonalizeMode()) {
                // Executing callbacks in "Personalize" mode is not required 
                // since only widget that can be created / configurated in personalize mode is shortcuts 
                // which doesn't need to callback execution.
                return $.Deferred().resolve().promise();
              }
              this.perspectiveWidgets = models;
              var deferred = $.Deferred();
              models = _.filter(models, function (config) {
                return config.widget.type !== 'csui/widgets/error';
              });
              this.loadCallbacks(models).then(_.bind(function (widgetsWithCallback) {
                var promises = _.map(widgetsWithCallback,
                    _.bind(function (widgetWithCallback) {
                      return this.initializeWidget(widgetWithCallback, perspectiveModel, context);
                    }, this));
                $.whenAll.apply($, promises)
                    .then(function () {
                      deferred.resolve();
                    }, function (error) {
                      deferred.reject(error);
                    });
              }, this));
              return deferred.promise();
            },

            loadCallbacks: function (models) {
              var self     = this,
                  deferred = $.Deferred(),
                  promises = _.chain(models)
                      .groupBy(function (model) {
                        return model.widget.type;
                      })
                      .map(function (widgetType) {
                        var deferredEach = $.Deferred();
                        self._resolveWidget(_.pick(widgetType[0].widget, 'type')).done(
                            function (widgetModel) {
                              var widgetManifest = widgetModel ? widgetModel.get('manifest') :
                                                   false,
                                  widgetCallback = widgetManifest ? widgetManifest.callback : false;
                              if (widgetCallback) {
                                require([widgetCallback], function (callback) {
                                  if (callback && _.isFunction(callback)) {
                                    widgetModel.type = widgetModel.id;
                                    deferredEach.resolve(_.extend(widgetModel, new callback()));
                                  } else {
                                    deferredEach.reject();
                                  }
                                }, function (error) {
                                  log.warn('Failed to load callback. {0}', error);
                                  deferredEach.reject(error);
                                });
                              } else {
                                deferredEach.resolve();
                              }
                            }).fail(function () {
                          // Ingore errors here since those were handled while serializing widget. For ex, Error Widget etc.,
                          deferredEach.resolve();
                        });
                        return deferredEach.promise();
                      })
                      .compact()
                      .value();
              $.whenAll.apply($, promises)
                  .then(function (results) {
                    deferred.resolve(_.compact(results));
                  });
              return deferred.promise();
            },

            initializeWidget: function (widgetWithCallback, perspectiveModel, context) {
              var deferred   = $.Deferred(),
                  widgets    = _.filter(this.perspectiveWidgets, function (widget) {
                    return widget.widget.type === widgetWithCallback.type;
                  }),
                  mode       = (perspectiveModel.getPerspectiveId() || perspectiveModel.get('assetContainerId')) ? 'update' :
                               'create',
                  settings   = {
                    priority: parseInt(perspectiveModel.get('priority')) || undefined,
                    title: perspectiveModel.get('title') || '',
                    overrideType: perspectiveModel.get('overrideType'),
                    scope: perspectiveModel.get('scope') || '',
                    containerType: parseInt(perspectiveModel.get('containerType')) ||
                                   undefined,
                    perspectiveParentId: parseInt(perspectiveModel.get('override_id')) ||
                                         parseInt(perspectiveModel.get('perspectivesVolId')) ||
                                         undefined,
                    overrideObjId: parseInt(perspectiveModel.get('node')) || undefined,
                    assetContainerId: perspectiveModel.get('assetContainerId') || undefined
                  },
                  parameters = {
                    mode: mode,
                    widgets: widgets,
                    settings: settings,
                    connector: context.getObject(ConnectorFactory)
                  };
              if (mode == 'update') {
                //TODO implement getPreviousWidgets for all perspectives other than flow perspective
                var previousPerspectiveWidgets = this.getPreviousWidgets &&
                                                 this.getPreviousWidgets(perspectiveModel);
                parameters.previousWidgets = _.filter(previousPerspectiveWidgets,
                    function (widget) {
                      return widget.widget.type === widgetWithCallback.type;
                    });
              }
              var callbackPromise = this.getHiddenWidgetOptions(widgetWithCallback, parameters,
                  perspectiveModel),
                  that            = this;
              $.when(callbackPromise)
                  .done(_.bind(function (responseParameters) {
                    //TODO refactor the execution of retrieving and validating new widget options
                    /*var responseWidgets = (_.has(responseParameters, 'widgets')) ?
                                               responseParameters.widgets : [];

                        // iterate the returned widgets array to get new options
                        _.each(responseWidgets, _.bind(function (item) {
                          if (_.has(item, 'newOptions') && _.isObject(item.newOptions)) {
                            //TODO refactor with appropriate attributes
                            var existingObjPath = 'perspective' +
                                                  this.convertJSONPointerToPath(item.widgetBaseLocation),
                                existingObj     = this.getDeepProperty(perspectiveModel,
                                    existingObjPath);

                            // options before changes
                            item.oldOptions = _.deepClone(item.widget.options);
                            // iterate the widget options and remove any bogus properties that have not been defined in the widget's manifest
                            _.each(item.newOptions, function (value, key) {
                              var manifest=widgetWithCallback.get('manifest');
                              if (!_.has(manifest.schema.properties, key) ||
                                  !_.has(manifest.options.fields[key], 'hidden') ||
                                  !manifest.options.fields[key].hidden) {
                                delete(item.newOptions[key]);
                              }
                            });
                            // update the options
                            _.deepExtend(existingObj, item.newOptions);
                          }
                      }, this));*/
                    deferred.resolve();
                  }, this))
                  .fail(function (error) {
                    deferred.reject(error[0] || error);
                  });
              return deferred.promise();
            },

            getHiddenWidgetOptions: function (widgetWithCallback, parameters, perspectiveModel) {
              var deferredOptions        = $.Deferred(),
                  deferredContainer      = $.Deferred(),
                  widgetPromises         = [],
                  errors                 = [],
                  ensureContainerPromise = deferredContainer.promise(), // note: no response argument - i.e. an empty promise
                  useOverrideContainer   = false;

              // check that the callback object is valid
              if (!widgetWithCallback || !_.has(widgetWithCallback, 'defineWidgetOptionsCommon') ||
                  !_.has(widgetWithCallback, 'defineWidgetOptionsEach')) {
                deferredOptions.reject();
                return deferredOptions.promise();
              }

              // the callback should have an ensureContainer() function that returns a promise
              if (_.has(widgetWithCallback, 'ensureContainer') &&
                  _.isFunction(widgetWithCallback.ensureContainer)) {
                // call ensureContainer() function to create a container in the assets volume
                if (widgetWithCallback.ensureContainer(parameters)) {
                  ensureContainerPromise = this.ensureContainer(parameters);
                } else {
                  useOverrideContainer = true;
                }
              } else {
                useOverrideContainer = true;
              }

              if (useOverrideContainer) {
                // no need to call ensureContainer(), so resolve with an empty promise
                deferredContainer.resolve();
              }

              $.when(ensureContainerPromise).done(function (response) {
                // when asset container is known to exist

                if (!_.has(parameters.settings, 'assetContainerId') ||
                    _.isUndefined(parameters.settings.assetContainerId)) {
                  // the assetContainerId is the id of where the asset will be added. e.g. either in the Perspective Assets Volume, or the container that the perspective overrides
                  var id = (response) ? response.id : parameters.settings.overrideObjId, // no response if ensureContainer was an empty promise
                      ac = {assetContainerId: id};

                  _.extend(parameters.settings, ac); // the containerId is required by the callback
                  perspectiveModel.set(ac);
                }

                var promiseBefore = widgetWithCallback.defineWidgetOptionsCommon(parameters);

                // check callback returns something that looks like a promise
                if (!promiseBefore || typeof promiseBefore != 'object' ||
                    !_.has(promiseBefore, 'state')) {
                  // looks like the callback didn't return a promise, so reject the deferred and return from this function immediately
                  deferredOptions.reject();
                  return deferredOptions.promise();
                }

                // when common options have been processed
                $.when(promiseBefore).done(function (commonOptions) {
                  if (_.has(parameters, 'widgets') && _.isArray(parameters.widgets)) {

                    _.each(parameters.widgets, function (item, index) {
                      // first add any common option properties

                      if (!_.has(item, 'newOptions')) {
                        item.newOptions = {};
                      }

                      _.extend(item.newOptions, commonOptions);

                      // next apply any widget-specific options
                      widgetPromises.push(widgetWithCallback.defineWidgetOptionsEach(item,
                          parameters));
                      $.when(widgetPromises[index])
                          .done(function (newOptions) {
                            _.extend(item.newOptions, newOptions);
                          })
                          .fail(function (errorMsg) {
                            errors.push(errorMsg); // error returned by user-extended _eachWidgetOptions()
                          });
                    });

                    // when all widgets have been processed
                    $.when.apply(this, widgetPromises)
                        .done(function () {
                          // all done
                          deferredOptions.resolve(parameters);
                        })
                        .fail(function (errorMsg) {
                          errors.push(errorMsg);
                          deferredOptions.reject(errors); // errors array returned to perspective manager
                        });
                  }

                })
                    .fail(function (errorMsg) {
                      errors.push(errorMsg); // error returned by user-extended _eachWidgetOptions()
                      deferredOptions.reject(errors);
                    });
              })
                  .fail(function (error) {
                    deferredContainer.reject(error);
                    // Also reject the deferredOptions promise so the error is reported
                    deferredOptions.reject([error]);
                  });

              return deferredOptions.promise();
            },

            ensureContainer: function (parameters) {
              // ensures that a container exists for perspective assets created by callbacks.

              var deferredContainer = $.Deferred();

              function uniqueId() {
                // using a timestamp alone does not guard against 2 users near-simultaneously attempting to create an asset container with the same name, whereas combination of timestamp and ~16 digit random suffix makes it practically impossible (1 in 1e+32)
                return _.now() + Math.random().toString().substring(2);
              }

              //TODO: update scenario: need to identify if an assetcontainer exists and what it's ID is (it might not, if e.g. the perspective didn't previously contain a wiki tile)
              if (_.has(parameters.settings, 'assetContainerId') &&
                  !isNaN(parseInt(parameters.settings.assetContainerId))) {
                // assetContainerId already exists, nothing to do
                // this is the case if there are more than one wiki tiles
                deferredContainer.resolve(false);
              } else {
                this.perspectiveAssetsVolume = new NodeModel(
                    {
                      id: 'volume',
                      type: 954
                    },
                    {
                      connector: parameters.connector
                    });
                this.perspectiveAssetsVolume.fetch().then(_.bind(function () {
                  var collectOptions = {
                    url: parameters.connector.connection.url + '/nodes',
                    type: 'POST',
                    data: {
                      type: 955,
                      parent_id: this.perspectiveAssetsVolume.get('id'),
                      name: 'assets_' + uniqueId()
                    },
                    success: function (response) {
                      deferredContainer.resolve(response);
                    },
                    error: function (error) {
                      deferredContainer.reject(error.responseJSON);
                    }
                  };

                  parameters.connector.makeAjaxCall(collectOptions).done(function (resp) {
                    deferredContainer.resolve(resp);
                  }).fail(function (resp) {
                    deferredContainer.reject(resp);
                  });
                }, this));
              }

              return deferredContainer.promise();
            },

            /*convertJSONPointerToPath: function (jpath) {
              // converts JSONPointer path notation to standard JS dotted/bracketed notation
              if (jpath) {
                var path = jpath.split('/');
                path = path.reduce(function (memo, item) {
                  if (Number(item)) {
                    return memo + '[' + item + ']';
                  } else {
                    return memo + '.' + item;
                  }
                });
                return path;
              }
            },

            getDeepProperty: function (obj, path) {
              // gets properties deep within an object, by passing in a path string 'key' in dotted form e.g. 'foo.bar.thing'
              var keys  = path.replace(/\[(["']?)([^\1]+?)\1?\]/g, '.$2').replace(/^\./,
                      '').split('.'),
                  value = false;

              for (var i = 0, n = keys.length; i < n; i++) {
                var property = keys[i];
                if (property in obj) {
                  obj = obj[property];
                } else {
                  return;
                }
              }
              return obj;

            }*/
            getEmptyPlaceholderWidget: function (options) {
              options || (options = this.options);
              return {
                type: PerspectiveUtil.getEmptyPlaceholderWidgetType(options.perspectiveMode),
                className: 'csui-draggable-item-disable',
                __isPlacehoder: true, // To differentiate this from general shortcutgroup widget
                options: {}
              };
            },

            isEmptyPlaceholder: function (widget) {
              return PerspectiveUtil.isEmptyPlaceholder(widget, this.options.perspectiveMode);
            },

            /**
             * Validate the existance and uniqueness IDs to widgets.
             * Also generates unique IDs to new widgets.
             *
             * @param {*} widgets
             * @returns {Boolean} True if all widgets are valid, false otherwise.
             */
            validateAndGenerateWidgetId: function (widgets) {
              _.each(widgets, function (w, index) {
                if (!PerspectiveUtil.hasWidgetId(w)) {
                  // No widget Id yet, generate one
                  w[PerspectiveUtil.KEY_WIDGET_ID] = PerspectiveUtil.generateWidgetId(
                      this.options.perspectiveMode) + index;
                }
              }, this);

              var widgetIds = _.pluck(widgets, PerspectiveUtil.KEY_WIDGET_ID);
              if (widgetIds.length !== _.uniq(widgetIds).length) {
                // Has duplicate Ids
                log.warn('Found duplicate widget IDs: {0}', widgetIds) && console.warn(log.last);
                return false;
              }
              var allWidgetsHasIds = _.every(widgets, PerspectiveUtil.hasWidgetId);
              if (!allWidgetsHasIds) {
                // Few widgets has no widget ID assigned to it
                log.warn('Found widgets with No Ids: {0}', widgets) && console.warn(log.last);
                return false;
              }
              return true;
            }
          });
        },

        //remove null and undefined objects from options form
        removeNullsInObject: function (obj) {

          function _checkAndRemove(value, key) {
            if (typeof value === 'object' || _.isArray(value)) {
              PerspectiveEditMixin.removeNullsInObject(value);
            }
            if (_.isNull(value) || _.isUndefined(value) || value.length === 0 ||
                (_.isObject(value) && _.isEmpty(value))) {
              if (_.isArray(obj)) {
                obj.splice(key, 1);
              } else {
                delete obj[key];
              }
            }
          }

          if (_.isArray(obj)) {
            for (var i = obj.length - 1; i >= 0; i--) {
              _checkAndRemove(obj[i], i);
            }
          } else {
            _.each(obj, _checkAndRemove);
          }
          return obj;
        }
      };

      return PerspectiveEditMixin;
    });


csui.define('csui/perspectives/flow/impl/nls/lang',{
    // Always load the root bundle for the default locale (en-us)
    "root": true,
    // Do not load English locale bundle provided by the root bundle
    "en-us": false,
    "en": false
  });
  

csui.define('csui/perspectives/flow/impl/nls/root/lang',{
    tileLabel: 'Single Width',
    headerLabel: 'Double Width',
    fullpageLabel: 'Full Page'
  });
  



csui.define('css!csui/perspectives/impl/perspective',[],function(){});

csui.define('css!csui/perspectives/flow/impl/flow.perspective',[],function(){});

// Loads widgets and renders them in a single row of grid cells
csui.define('csui/perspectives/flow/flow.perspective.view',['require', 'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/lib/radio', 'csui/models/widget/widget.collection',
  'csui/utils/base',
  'csui/controls/grid/grid.view', 'csui/utils/log',
  'csui/utils/contexts/fragment/context.fragment',
  'csui/behaviors/widget.container/widget.container.behavior',
  'csui/behaviors/drag.drop/dnd.item.behaviour',
  'csui/behaviors/drag.drop/dnd.container.behaviour',
  'csui/perspectives/mixins/perspective.edit.mixin',
  'csui/utils/perspective/perspective.util',
  'i18n!csui/perspectives/flow/impl/nls/lang',
  'i18n!csui/perspectives/impl/nls/lang',
  'css!csui/perspectives/impl/perspective',
  'css!csui/perspectives/flow/impl/flow.perspective'
], function (require, module, _, $, Backbone, Marionette, Radio, WidgetCollection, base, GridView,
    log, ContextFragment, WidgetContainerBehavior, DnDItemBehaviour, DnDContainerBehaviour, PerspectiveEditMixin,
    PerspectiveUtil,
    lang, commonLang) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    defaultWidgetKind: 'tile',
    widgetSizes: {
      fullpage: {
        widths: {
          xs: 12
        },
        heights: {
          xs: 'full'
        }
      },
      header: {
        widths: {
          xs: 12,
          md: 8,
          xl: 6
        }
      },
      widetile: {
        widths: {
          xs: 12,
          lg: 6
        }
      },
      tile: {
        widths: {
          xs: 12,
          sm: 6,
          md: 4,
          xl: 3
        }
      }
    }
  });

  var FlowPerspectiveView = GridView.extend({

    className: function () {
      var className       = this.options.className || 'cs-perspective cs-flow-perspective grid-rows',
          parentClassName = _.result(GridView.prototype, 'className');
      if (parentClassName) {
        className = className + ' ' + parentClassName;
      }
      return className;
    },

    cellView: function (model) {
      var widget = model.get('widget');
      if (widget) {
        if (!widget.view) {
          throw new Marionette.Error({
            name: 'UnresolvedWidgetError',
            message: 'Widget "' + widget.type + '" not resolved:' +
                     widget['error']
          });
        }
        return widget.view;
      }
    },

    cellViewOptions: function (model, cellView) {
      var widget = model.get('widget');
      var cellOptions = {
        context: this.options.context,
        data: widget && widget.options || {},
        // widgets in the grid should create their own model instead
        // of using the grid cell model
        model: undefined,
        perspectiveMode: this.options.perspectiveMode,
        widgetContainer: cellView
      };
      cellOptions[PerspectiveUtil.KEY_WIDGET_ID] = widget[PerspectiveUtil.KEY_WIDGET_ID];
      return cellOptions;
    },

    cellConstructionFailed: function (model, error) {
      var widget = model.get('widget');
      if (widget) {
        var errorWidget = WidgetContainerBehavior.getErrorWidget(widget, error.message);
        model.set('widget', _.defaults(errorWidget, widget.attributes));
      }
    },

    constructor: function FlowPerspectiveView(options) {
      options || (options = {});
      options = $.extend(true, {}, options);
      this.widgetSizes = _.defaults(options.widgetSizes, config.widgetSizes);
      options.context.perspective.type = options.type;
      options.disableDnd = options.disableDnd;
      this._preInitialize(options);
      GridView.prototype.constructor.call(this, options);
      this._postInitialize();
    },

    _preInitialize: function (options) {
      options.widgets || (options.widgets = []);
      if (!!options.perspectiveMode) {
        this._prepareOptionsForEditMode(options);
        this.prepareForEditMode();
      } else {
        options.widgets = _.reject(options.widgets, PerspectiveUtil.isHiddenWidget, this);
      }
      if (!options.collection) {
        var extWidgets = _.chain(config)
            .pick(function (value, key) {
              return key.indexOf('-widgets') >= 0;
            })
            .values()
            .flatten();

        if (extWidgets && extWidgets._wrapped && extWidgets._wrapped.length > 0) {
          options.widgets = _.filter(options.widgets, function (widget) {
            return _.contains(extWidgets._wrapped, widget.type);
          });
        }

        options.widgets = _.filter(options.widgets, function (widget) {
          return base.filterUnSupportedWidgets(widget, config,
                  options.perspectiveMode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) != undefined;
        });

        options.collection = this._createCollection(options);
        options.context.widgetCollection = options.collection;
      }
    },

    _postInitialize: function () {
      if (!!this.options.perspectiveMode) {
        this._registerEditEvents();
      }
    },

    /**
     * Tasks:
     *  - Add a empty placeholder to the widgets based on `perspectiveMode`
     *  - Enable widget configuration to all cells of the group by adding respective behaviors
     *  - Allow dragging of cells to reorder
     *  - Enable DnD to entire row for re-ordering.
     *
     */
    _prepareOptionsForEditMode: function (options) {
      var self = this;
      // Insert Empty Placeholder widget before hidden widgets
      var firstHiddenIdx = _.findIndex(options.widgets, PerspectiveUtil.isHiddenWidget, this);
      if (firstHiddenIdx === -1) {
        // No Hidden widget, add placeholder to last
        firstHiddenIdx = options.widgets.length;
      }
      options.widgets.splice(firstHiddenIdx, 0, this.getEmptyPlaceholderWidget(options));

      options.cellBehaviours = {
        PerspectiveWidgetConfig: { // For widget editing
          behaviorClass: require(
              'csui/perspective.manage/behaviours/pman.widget.config.behaviour'),
          perspectiveView: this,
          perspectiveMode: options.perspectiveMode
        },
        DnDItemBehaviour: { // For DnD widget
          behaviorClass: DnDItemBehaviour
        }
      };

      options.contextFragment = new ContextFragment(options.context);

      this._createDnDPlaceholderWidget();

      function addCell(widgetConfig, index) {
        var newCell = self._prepareGridCell(widgetConfig, index);
        var cells = self.collection.at(0).columns;
        cells.add(newCell, {at: index});
       //LPAD-86991 Edit page: superfluous models loaded
       // self.options.contextFragment.fetch();
        self.options.context.trigger('update:widget:panel', {
          'action': 'add',
          'widgetModel': newCell.widget
        });
      }

      options.reorderOnSort = true; // To let reorder views on collection reorder (DnD reorder)
      if(!options.disableDnd){
        options.rowBehaviours = {
          DnDContainerBehaviour: {
            behaviorClass: DnDContainerBehaviour,
            placeholder: this._getDnDPlaceholder.bind(this),
            handle: '.csui-pman-widget-masking', // Limit re-ordering to mask (avoids callout popover),
            helper: 'clone', // Use clone of the original element as drag image to preserve styles of original element as it is.
            start: function (event, ui) {
              //hiding popover on drag start
              var popoverTarget = self.$el.find(".binf-popover");
              if (popoverTarget.length) {
                popoverTarget.removeClass("pman-ms-popover");
                popoverTarget.hide();
                popoverTarget.binf_popover('destroy');
              }
            },
            over: _.bind(function (event, ui) {
              var placeholderWidget = this._getDnDPlaceholder(ui.helper);
               var defaultPlaceHolder = this.$el.find('.csui-pman-placeholder-container');
               defaultPlaceHolder.addClass('binf-hidden');
              var placeholder = ui.placeholder;
              placeholder.show();
              // Update DnD placeholder with widget styles
              placeholder.attr('class', placeholderWidget.attr('class'));
              placeholder.html(placeholderWidget.html());
              placeholder.css('visibility', 'visible');
              placeholder.css({'width': '', 'height': ''});
              // FIXME: Remove transfer data to placeholder. Instead set data to ui.item
              placeholder.data('pman.widget', ui.helper.data('pman.widget'));
              placeholder.removeData('isBeyondLayout');
              if (!!ui.helper.data('pman.widget')) { // "pman.widget" is not available when reorder within flow
                // Preload widget's view which is going to be drop to get ready with manifest etc., to avoid delay in placing widget immeditly on drop
                this._resolveWidget({
                  type: ui.helper.data('pman.widget').id
                }).done(
                    function (resolvedWidget) {
                      placeholder.data('pman.widget.view', resolvedWidget);
                    });
              }
            }, this),
            out: _.bind(function (event, ui) {
              var defaultPlaceHolder = this.$el.find('.csui-pman-placeholder-container');
              ui.placeholder.hide();
              ui.placeholder.data('isBeyondLayout', true);
              defaultPlaceHolder.removeClass('binf-hidden');
              this._notifyPerspectiveChanges();
            }, this),
            receive: _.bind(function (event, ui) {
              if (ui.placeholder.data('isBeyondLayout') === true ||
                  !ui.placeholder.data("pman.widget.view")) {
                // Dropped outside the placeholder.
                ui.sender.sortable("cancel");
                return;
              }
              if (ui.position.top > 0) {
                var newWidget = ui.placeholder.data('pman.widget'),
                    index     = ui.item.index(), // this.$el.find('.binf-row >div').index(ui.item);
                    manifest  = newWidget.get('manifest');
                var widget,
                    preloadedWidgetView = ui.placeholder.data("pman.widget.view");
                if (PerspectiveUtil.isEligibleForLiveWidget(manifest)) {
                  widget = {
                    type: newWidget.id,
                    kind: manifest.kind,
                    view: preloadedWidgetView.get('view')
                  };
                } else {
                  widget = {
                    type: 'csui/perspective.manage/widgets/perspective.widget',
                    kind: manifest.kind,
                    options: {
                      options: {}, // To be used and filled by callout form
                      widget: newWidget
                    },
                    view: (preloadedWidgetView = this.pespectiveWidgetView)
                  };
                }
                widget.options = _.extend({___pman_isdropped: true}, widget.options);
                if (!preloadedWidgetView) {
                  // Widget's view is not loaded yet, load view to attach new cell
                  this._resolveWidget(widget).done(function (resolvedWidget) {
                    addCell(widget, index);
                  });
                } else {
                  // Widget's view preloaded on, ready to attach the cell.
                  addCell(widget, index);
                }
              }
              // Move Placeholder widget to last
              this._ensurePlaceholder();
              // Cancel sort event since placing widget manually here.
              ui.sender.sortable("cancel");
            }, this),
            stop: _.bind(function () {
              this._ensurePlaceholder();
            }, this)
          }
        };
      }
    },

    /**
     * Make sure placeholder exist, and at right position based on perspectiveMode.
     * If `edit` - placeholder must be at the end.
     * If `personalization` - placeholder must be between enabled and hidden widgets.
     *
     */
    _ensurePlaceholder: function () {
      var cells = this.collection.at(0).columns,
          self  = this;
      var placeholderCell = cells.find(function (cell) {
        return this.isEmptyPlaceholder(cell.get("widget"));
      }, this);
      if (!placeholderCell) {
        // No placeholder. Hence create a new one
        var placeholderWidget = this.getEmptyPlaceholderWidget();
        this._resolveWidget(placeholderWidget).done(function (resolvedWidget) {
          var newCell = self._createCell(placeholderWidget, resolvedWidget, cells.length);
          var position = self._getPlaceholderIdealIndex();
          cells.add(newCell, {at: position + 1});
        });
      } else {
        // Placeholder exist, check if it is at the right position.
        var currentIndex = cells.indexOf(placeholderCell),
            idealIndex   = this._getPlaceholderIdealIndex(currentIndex);
        if (currentIndex !== idealIndex) {
          cells.remove(placeholderCell);
          cells.add(placeholderCell, {at: idealIndex});
        }
      }
    },

    _getPlaceholderIdealIndex: function (currentPlaceIndex) {
      var cells    = this.collection.at(0).columns,
          position = cells.length;
      currentPlaceIndex = currentPlaceIndex || -1;
      switch (this.options.perspectiveMode) {
      case PerspectiveUtil.MODE_PERSONALIZE:
        // Keep the placeholder widget after last active element.
        while (position-- > currentPlaceIndex) {
          if (!PerspectiveUtil.isHiddenWidget(cells.at(position).get('widget'))) {
            break;
          }
        }
        return position;
      case PerspectiveUtil.MODE_EDIT_PERSPECTIVE:
        return position - 1;
      default:
        return currentPlaceIndex;
      }
    },

    /**
     * Create a empty placeholder widget to be used to show as DnD watermark placeholder
     */
    _createDnDPlaceholderWidget: function () {
      var self              = this,
          placeholderWidget = {
            type: 'csui/perspective.manage/widgets/perspective.placeholder',
          };
      this._resolveWidget(placeholderWidget).done(function (resolvedWidget) {
        var cellOptions = self._createCell(placeholderWidget, resolvedWidget, 0);
        cellOptions.className = "pman-dnd-hover-placeholder";
        self.dndPlaceholderCell = new GridView.CellView({
          grid: self,
          model: new Backbone.Model(cellOptions)
        });
        self.dndPlaceholderCell.render();
      });

      this._resolveWidget({
        type: 'csui/perspective.manage/widgets/perspective.widget'
      }).done(function (resolvedWidget) {
        self.pespectiveWidgetView = resolvedWidget.get('view');
      });
    },

    /**
     * Prepare placeholder watermark for widget currently dropping
     */
    _getDnDPlaceholder: function (dragEl) {
      var widget = dragEl.data('pman.widget');
      if (!!widget) {
        var kind = widget.attributes.manifest.kind;
        if (!kind) {
          kind = config.defaultWidgetKind;
        }
        var sizes = this.widgetSizes[kind];
        // Update watermark widget with current droping widget sizes
        this.dndPlaceholderCell.model.set({
          sizes: sizes.widths,
          heights: sizes.heights
        });
      }
      return this.dndPlaceholderCell.$el;
    },

    _registerEditEvents: function () {
      var self = this;
      this.listenTo(this, 'delete:widget', function (widgetView) {
        var cells = self.collection.at(0).columns;
        var model = widgetView.model;
        cells.remove(model);
        this._notifyPerspectiveChanges();
      });

      this.listenTo(this, 'update:widget:size', function (widgetView, kind) {
        var sizes  = this.widgetSizes[kind],
            widget = widgetView.model.get('widget');
        widget.kind = kind;
        widgetView.model.set({
          sizes: sizes.widths,
          heights: sizes.heights,
          widget: widget
        });
        //Added as part of LPAD-104683
        widgetView.$el.addClass('csui-draggable-item csui-pman-editable-widget');
        var widgetInfo = { widgetView: widgetView, kind: kind };
        Radio.channel("newlayout:widget:size").trigger("update:widget:size", widgetInfo);
        this._notifyPerspectiveChanges();
      });

      this.listenTo(this, 'replace:widget', this._replaceWidget);
      if (this.options.perspectiveMode === PerspectiveUtil.MODE_PERSONALIZE) {
        // Since shortcut group is being used as placeholder, 
        // a new empty placeholder (shortcuts) needs to be created on configurating it.
        // Hence, listen to options update, if shortcut group which is acting as placeholder is update, 
        // Create a new shortcut group to act as placeholder widget.
        this.listenTo(this, 'update:widget:options', function (config) {
          var cell   = config.widgetView,
              widget = cell.model.get('widget');
          if (this.isEmptyPlaceholder(widget)) {
            delete widget.__isPlacehoder;
            // Remove "drag disabling" to this shortcut can now be reorderable
            cell.model.unset('className', {silent: true});
            cell.$el.removeClass('csui-draggable-item-disable');
            this._ensurePlaceholder();
            this._notifyPerspectiveChanges();
          }
        });
      }
      this.on({
        "perspective:modified": this._notifyPerspectiveChanges.bind(this),
        "hide:widget": this._notifyPerspectiveChanges.bind(this),
        "show:widget": this._notifyPerspectiveChanges.bind(this)
      });
      this.listenTo(this.options.context, "perspective:save:success", ()=>this.notified=false); 
    },

    _replaceWidget: function (currentWidget, widgetToReplace) {
      if (!this.getPManPlaceholderWidget) {
        // 'getPManPlaceholderWidget' Provided by pman.config.behaviour
        return;
      }
      var self = this;
      var cells = this.collection.at(0).columns;
      // Load new widget
      this._resolveWidget(widgetToReplace).done(function () {
        // Replace current widget with new widget
        if (!self.isEmptyPlaceholder(currentWidget.model.get('widget'))) {
          // Preserve widget kind if dropping on existing widget
          widgetToReplace.kind = currentWidget.model.get('widget').kind;
        }
        var widgetUpdates = self._prepareGridCell(widgetToReplace,
            cells.indexOf(currentWidget.model));
        self.options.context.clear();
        currentWidget.model.set(widgetUpdates);
        self.options.context.fetch();
        // Check if has any placeholders, otherwise add new placeholder widget
        self._ensurePlaceholder();
        self._notifyPerspectiveChanges();
      });
    },

    _notifyPerspectiveChanges: function () {
      PerspectiveUtil.notifyPerspectiveChanges.call(this);
    },

    _createCollection: function (options) {
      var self = this,
          rows = new Backbone.Collection();

      if (!!options.perspectiveMode) {
        this.widgetsResolved = this._resolveWidgets(options.widgets)
            .always(function (resolvedWidgets) {
              var firstRow = rows.add({});
              var columns = _.map(options.widgets, function (widget, index) {
                return self._createCell(widget, resolvedWidgets[index], index);
              });
              firstRow.columns = new Backbone.Collection(columns);
              return resolvedWidgets;
            });
      } else {
        var uniqueWidgets = _.chain(options.widgets)
            .pluck('type')
            .unique()
            .map(function (id) {
              return {id: id};
            })
            .value();
        var resolvedWidgets = new WidgetCollection(uniqueWidgets);
        this.widgetsResolved = resolvedWidgets
            .fetch()
            .then(function () {
              var firstRow = rows.add({});
              firstRow.columns = self._createColumns(options.widgets, resolvedWidgets);
              return resolvedWidgets;
            });
      }
      return rows;
    },

    _createColumns: function (widgets, resolvedWidgets) {
      var columns = _.map(widgets, function (widget, columnIndex) {
        var resolvedWidget = resolvedWidgets.get(widget.type);
        return this._createCell(widget, resolvedWidget, columnIndex);
      }.bind(this));
      return new Backbone.Collection(columns);
    },

    _prepareGridCell: function (widgetConfig, columnIndex) {
      var kind = widgetConfig.kind;
      if (!kind) {
        kind = config.defaultWidgetKind;
      }
      var sizes = this.widgetSizes[kind];
      return {
        sizes: sizes.widths,
        heights: sizes.heights,
        className: widgetConfig.className,
        widget: _.defaults({kind: kind, cellAddress: 'grid0:r0:c' + columnIndex}, widgetConfig)
      };
    },

    _createCell: function (widget, resolvedWidget, columnIndex) {
      var widgetView     = resolvedWidget.get('view'),
          manifest       = resolvedWidget.get('manifest') || {},
          supportedKinds = manifest.supportedKinds,
          kind           = widget.kind;
      if (!kind || !supportedKinds || !_.contains(supportedKinds, kind)) {
        kind = manifest.kind;
      }
      widget.kind = kind;
      if (widgetView) {
        widget.view = widgetView;
        return this._prepareGridCell(widget, columnIndex);
      }
      var error = resolvedWidget.get('error');
      log.warn('Loading widget "{0}" failed. {1}', widget.type, error)
      && console.warn(log.last);
      var sizes = this.widgetSizes[config.defaultWidgetKind];
      return {
        sizes: sizes.widths,
        heights: sizes.heights,
        widget: WidgetContainerBehavior.getErrorWidget(widget, error)
      };
    },

    /**
     * Returns supported widgets sizes(kinds) for given widget
     */
    getSupportedWidgetSizes: function (manifest, widget) {
      return _.map(manifest.supportedKinds, function (suppKind) {
        return {
          kind: suppKind,
          label: lang[suppKind + 'Label'],
          selected: widget.model.get('widget').kind === suppKind
        };
      });
    },

    serializePerspective: function (perspectiveModel, ignoreErrors = false) {
      var self         = this,
          deferred     = $.Deferred(),
          cells        = this.collection.at(0).columns,
          widgetModels = cells.filter(function (cell) {
            return !this.isEmptyPlaceholder(cell.get('widget'));
          }, this);

      var widgetPromises = widgetModels.map(function (widget, index) {
        return self.serializeWidget(widget, '/options/widgets/' + index, ignoreErrors);
      });
      $.whenAll.apply($, widgetPromises).done(function (results) {
        self.executeCallbacks(results, perspectiveModel, self.options.context).done(function () {
          var widgets           = _.pluck(results, 'widget'),
              constant_data     = _.flatten(_.pluck(results, 'constantsData')),
              perspectiveResult = {
                perspective: {
                  type: 'flow',
                  options: {widgets: widgets}
                },
                constant_data: constant_data,
                constant_extraction_mode: 1
              };
          var isAllWidgetsValid = self.validateAndGenerateWidgetId(widgets);
          if (!isAllWidgetsValid) {
            deferred.reject(commonLang.widgetValidationFailed);
          } else {
            deferred.resolve(perspectiveResult);
          }
        }).fail(function (results) {
          // TODO Group errors
          results = _.filter(results, function (result) {return !!result.error});
          deferred.reject(results[0].error);
        });
      }, this).fail(function (results) {
        // TODO Group errors
        results = _.filter(results, function (result) {return !!result.error});
        deferred.reject(results[0].error);
      });
      return deferred.promise();
    },

    getPreviousWidgets: function (perspectiveModel) {
      var perspective     = perspectiveModel.getPerspective(),
          previousWidgets = perspective &&
                            perspective.options ?
                            perspective.options.widgets :
              {};
      previousWidgets = _.map(previousWidgets, function (widget) {
        return {widget: widget};
      });
      return previousWidgets;
    },

    _supportMaximizeWidget: true,

    _supportMaximizeWidgetOnDisplay: true

  });

  // TODO add mixin dynamically for edit mode only
  PerspectiveEditMixin.mixin(FlowPerspectiveView.prototype);
  return FlowPerspectiveView;

});


// Loads widgets and renders them in a grid
csui.define('csui/perspectives/grid/grid.perspective.view',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/base',
  'csui/controls/grid/grid.view',
  'csui/behaviors/widget.container/widget.container.behavior',
  'css!csui/perspectives/impl/perspective'
], function (module, _, $, Marionette,
    base,
    GridView,
    WidgetContainerBehavior) {

  var config = module.config();

  var GridPerspectiveView = GridView.extend({

    className: function () {
      var className       = 'cs-perspective cs-grid-perspective grid-rows',
          parentClassName = _.result(GridView.prototype, 'className');
      if (parentClassName) {
        className = className + ' ' + parentClassName;
      }
      return className;
    },

    cellView: function (model) {
      var widget = model.get('widget');
      if (widget) {
        var view = widget.view;
        if (!view) {
          throw new Marionette.Error({
            name: 'UnresolvedWidgetError',
            message: 'Widget "' + widget.type + '" not resolved: ' +
                     widget.error
          });
        }
        return view;
      }
    },

    cellViewOptions: function (model) {
      var widget = model.get('widget');
      return {
        context: this.options.context,
        data: widget && widget.options || {},
        // widgets in the grid should create their own model instead
        // of using the grid cell model
        model: undefined
      };
    },

    behaviors: {
      WidgetContainer: {
        behaviorClass: WidgetContainerBehavior
      }
    },

    constructor: function GridPerspectiveView(options) {
      options || (options = {});
      options = $.extend(true, {}, options);
      var rows = options.rows;
      if (rows && rows.length > 0 && config.supportedWidgets) {
        var columns = rows[0].columns;
        rows[0].columns = _.filter(columns, function (column) {
          return _.contains(config.supportedWidgets, column.widget.type);
        });

        if (columns.length > 1 && config.widgetSizes) {
          _.each(columns, function (column) {
            column.sizes = config.widgetSizes;
            column.heights = {};
          });
        }
      }

      filterRows(rows);

      function filterRows (rows) {
        _.each(rows, function (row) {
          var columns = row.columns;
          if (columns) {
            row.columns = filterColumns(columns);
          }
        });
      }

      function filterColumns (columns) {
        return _.filter(columns, function (column) {
          var widget = column.widget;
          if (widget) {
            return base.filterUnSupportedWidgets(widget, config) != undefined;
          }
          var rows = column.rows;
          if (rows) {
            filterRows(rows);
          }
          return true;
        });
      }

      GridView.prototype.constructor.call(this, options);
    },

    enumerateWidgets: function (callback) {
      this._enumerateWidgetRow(this.options.collection, callback);
    },

    _enumerateWidgetRow: function (rows, callback) {
      rows.each(function (row) {
        row.columns.each(function (column) {
          var widget = column.get('widget');
          widget && callback(widget);
          if (column.rows) {
            this._enumerateWidgetRow(column.rows, callback);
          }
        }, this);
      }, this);
    },

    _supportMaximizeWidget: true,

    _supportMaximizeWidgetOnDisplay: true

  });

  return GridPerspectiveView;

});


csui.define('css!csui/perspectives/zone/impl/zone.perspective',[],function(){});

// Base for perspectives placing widgets to named grid cells - zones
csui.define('csui/perspectives/zone/zone.perspective.view',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/utils/base', 'csui/controls/grid/grid.view',
  'csui/behaviors/widget.container/widget.container.behavior',
  'csui/perspectives/mixins/perspective.edit.mixin',
  'css!csui/perspectives/impl/perspective',
  'css!csui/perspectives/zone/impl/zone.perspective'
], function (module, _, $, Backbone, Marionette, base, GridView, WidgetContainerBehavior,
    PerspectiveEditMixin) {

  var config = module.config();

  var ZonePerspectiveView = GridView.extend({

    className: function () {
      var className       = 'cs-perspective cs-zone-perspective grid-rows ',
          parentClassName = _.result(GridView.prototype, 'className');
      if (parentClassName) {
        className = className + parentClassName;
      }
      return className;
    },

    cellView: function (model) {
      var widget = model.get('widget');
      if (widget) {
        var view = widget.view;
        if (!view) {
          throw new Marionette.Error({
            name: 'UnresolvedWidgetError',
            message: 'Widget "' + widget.type + '" not resolved: ' +
                     widget.error
          });
        }
        return view;
      }
    },

    cellViewOptions: function (model, cellView) {
      var widget = model.get('widget');
      return {
        context: this.options.context,
        data: widget && widget.options || {},
        // widgets in the grid should create their own model instead
        // of using the grid cell model
        model: undefined,
        perspectiveMode: this.options.perspectiveMode,
        widgetContainer: cellView
      };
    },

    cellConstructionFailed: function (model, error) {
      var widget = model.get('widget');
      if (widget) {
        var errorWidget = WidgetContainerBehavior.getErrorWidget(widget, error.message);
        model.set('widget', _.defaults(errorWidget, widget.attributes));
      }
    },

    behaviors: {
      WidgetContainer: {
        behaviorClass: WidgetContainerBehavior
      }
    },

    constructor: function ZonePerspectiveView(options) {
      options || (options = {});
      options = $.extend(true, {}, options);
      if (!options.collection) {
        options.collection = this._createCollection(options);
      }
      options.collection.each(function (row, rowIndex) {
        row.columns.each(function (column, colIndex) {
          column.get('widget').cellAddress = 'grid0:r' + rowIndex + ':c' + colIndex;
        });
      });
      if (options.perspectiveMode === 'edit') {
        this.prepareForEditMode();
      }
      GridView.prototype.constructor.call(this, options);
    },

    _createCollection: function (options) {
      var rows      = new Backbone.Collection(),
          zoneNames = getOption.call(this, 'zoneNames');
      _.extend(config, {'unSupportedWidgets': getOption.call(this, 'unSupportedWidgets')});
      _.mapObject(options, function (val, key) {
        if (_.contains(zoneNames, key)) {
          if (!base.filterUnSupportedWidgets(val, config)) {
            options[key] = undefined;
          }
        }
      });

      var layoutName = this._getLayoutName(options);

      if (layoutName) {
        var zoneLayouts = getOption.call(this, 'zoneLayouts'),
            zoneLayout  = zoneLayouts[layoutName];
        if (zoneLayout) {
          var row     = rows.add({}),
              columns = _.map(zoneLayout.zoneOrder, function (zone) {
                var zoneConfig = _.defaults({
                  widget: options[zone]
                }, zoneLayout.zoneSizes[zone]);
                if (options[zone].className) {
                  zoneConfig.className = (zoneConfig.className || '') + ' ' + options[zone].className;
                }
                return zoneConfig;
              });

          row.columns = new Backbone.Collection(columns);
        } else {
          throw new Marionette.Error({
            name: 'InvalidLayoutContentError',
            message: 'Missing widget in the important perspective zone'
          });
        }
      }
      return rows;
    },

    /**
     * Calculates and returns layout to use based on the options configured
     */
    _getLayoutName: function (options) {
      var zoneNames = getOption.call(this, 'zoneNames');
      return _.reduce(zoneNames, function (result, zone) {
        if (options[zone] && !_.isEmpty(options[zone])) {
          result && (result += '-');
          result += zone;
        }
        return result;
      }, '');
    },

    enumerateWidgets: function (callback) {
      var zoneNames = getOption.call(this, 'zoneNames'),
          widgets   = _.compact(_.map(zoneNames, function (zone) {
            var zoneContent = this.options[zone];
            return !_.isEmpty(zoneContent) && zoneContent;
          }, this));

      if (this.options.perspectiveMode === 'edit') {
        var deferreds = _.map(widgets, function () {
          var deferred = $.Deferred();
          callback(deferred);
          return deferred;
        });
        this._resolveWidgets(widgets).then(function (widgetModel) {
          _.each(widgets, function (widget, index) {
            deferreds[index].resolve(widget);
          });
        });
      } else {
        _.each(widgets, callback, this);
      }
    },

    /**
     * Serilize Zone options to save
     */
    serializeOptions: function (perspectiveModel, ignoreErrors) {
      var self        = this,
          deferred    = $.Deferred(),
          layoutName  = this._getLayoutName(this.options),
          zoneLayouts = getOption.call(this, 'zoneLayouts'),
          zoneLayout  = zoneLayouts[layoutName],
          cells       = this.collection.at(0).columns;
      var widgetPromises = _.map(zoneLayout.zoneOrder, function (zone, index) {
        if (cells.at(index).get('widget').type ===
            'csui/perspective.manage/widgets/perspective.placeholder') {
          // Placeholder, no widget placed on this zone. Hence empty options
          return $.Deferred().resolve({
            zone: zone,
            config: {widget: {}}
          });
        }
        // Resolve and Serialize widget options
        return self.serializeWidget(cells.at(index), '/options/' + zone, ignoreErrors).then(function (result) {
          return {
            zone: zone,
            config: result
          };
        });
      });

      $.whenAll.apply($, widgetPromises).done(function (results) {
        var widgets = _.map(_.filter(results, function (layout) {
          return layout.config && layout.config.widget && !_.isEmpty(layout.config.widget);
        }), function (layout) {
          return layout.config;
        });
        self.executeCallbacks(widgets, perspectiveModel, self.options.context).done(function () {
          // Resolve promise with options
          deferred.resolve(results);
        }).fail(function (results) {
          results = _.filter(results, function (result) {return !!result.error});
          deferred.reject(results[0].error);
        });
      }).fail(function (results) {
        results = _.filter(results, function (result) {return !!result.error});
        deferred.reject(results[0].error);
      });

      return deferred.promise();
    },

    getPreviousWidgets: function (perspectiveModel) {
      var perspective     = perspectiveModel.get('perspective'),
          layoutName      = this._getLayoutName(this.options),
          zoneLayouts     = getOption.call(this, 'zoneLayouts'),
          zoneLayout      = zoneLayouts[layoutName],
          previousWidgets = {};

      if (zoneLayout && zoneLayout.zoneOrder) {
        previousWidgets = _.map(_.filter(zoneLayout.zoneOrder, function (zone) {
          return perspective && perspective.options && !_.isEmpty(perspective.options[zone]);
        }), function (zone) {
          return {widget: perspective.options[zone]};
        });
      }

      return previousWidgets;
    }

  });

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
    return _.isFunction(value) ? value.call(this) : value;
  }

  // TODO add mixin dynamically for edit mode only
  PerspectiveEditMixin.mixin(ZonePerspectiveView.prototype);

  return ZonePerspectiveView;

});


// Loads widgets and renders them in a left-center-right zone layout
csui.define('csui/perspectives/left-center-right/left-center-right.perspective.view',['require', 'module', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/perspectives/zone/zone.perspective.view',
  'csui/utils/contexts/fragment/context.fragment',
  'csui/behaviors/widget.container/widget.container.behavior',
  'csui/utils/perspective/perspective.util',
  'i18n!csui/perspectives/impl/nls/lang',
], function (require, module, $, _, ZonePerspectiveView, ContextFragment, WidgetContainerBehavior, PerspectiveUtil, commonLang) {

  var config = module.config();
  _.defaults(config, {
    zoneNames: ['left', 'center', 'right'],
    zoneLayouts: {
      'center': {
        zoneOrder: ['center'],
        zoneSizes: {
          center: {
            sizes: {
              xs: 12
            },
            heights: {
              xs: 'full'
            }
          }
        }
      },
      'left': {
        zoneOrder: ['left'],
        zoneSizes: {
          left: {
            sizes: {
              xs: 12
            },
            heights: {
              xs: 'full'
            }
          }
        }
      },
      'right': {
        zoneOrder: ['right'],
        zoneSizes: {
          right: {
            sizes: {
              xs: 12
            },
            heights: {
              xs: 'full'
            }
          }
        }
      },
      'left-center': {
        zoneOrder: ['center', 'left'],
        zoneSizes: {
          left: {
            sizes: {
              "md": 4,
              "xl": 3
            },
            "pulls": {
              "md": 8,
              "xl": 9
            },
            heights: {
              xs: 'full'
            }
          },
          center: {
            sizes: {
              "md": 8,
              "xl": 9
            },
            "pushes": {
              "md": 4,
              "xl": 3
            },
            heights: {
              xs: 'full'
            }
          }
        }
      },
      'center-right': {
        zoneOrder: ['center', 'right'],
        zoneSizes: {
          center: {
            sizes: {
              "md": 8,
              "xl": 9
            },
            heights: {
              xs: 'full'
            }
          },
          right: {
            sizes: {
              "md": 4,
              "xl": 3
            },
            heights: {
              xs: 'full'
            }
          }
        }
      },
      'left-right': {
        zoneOrder: ['left', 'right'],
        zoneSizes: {
          left: {
            sizes: {
              "md": 6
            },
            heights: {
              xs: 'full'
            }
          },
          right: {
            sizes: {
              "md": 6
            },
            heights: {
              xs: 'full'
            }
          }
        }
      },
      'left-center-right': {
        zoneOrder: ['center', 'left', 'right'],
        zoneSizes: {
          left: {
            sizes: {
              "sm": 6,
              "md": 6,
              "lg": 3,
              "xl": 3
            },
            "pulls": {
              "lg": 6,
              "xl": 6
            },
            heights: {
              xs: 'full'
            }
          },
          center: {
            sizes: {
              "sm": 12,
              "md": 12,
              "lg": 6,
              "xl": 6
            },
            "pushes": {
              "lg": 3,
              "xl": 3
            },
            heights: {
              xs: 'full'
            }
          },
          right: {
            sizes: {
              "sm": 6,
              "md": 6,
              "lg": 3,
              "xl": 3
            },
            heights: {
              xs: 'full'
            }
          }
        }
      }
    }
  });

  var LeftCenterRightPerspectiveView = ZonePerspectiveView.extend({

    className: function () {
      var className       = 'cs-left-center-right-perspective',
          parentClassName = _.result(ZonePerspectiveView.prototype, 'className');
      if (parentClassName) {
        className = className + ' ' + parentClassName;
      }
      var lcr = !_.isEmpty(this.options.left) && !_.isEmpty(this.options.right);
      if (lcr) {
        className = className + " csui-lcr-multiwidget";
      }
      return className;
    },

    zoneNames: config.zoneNames,
    zoneLayouts: config.zoneLayouts,
    unSupportedWidgets: config.unSupportedWidgets,

    constructor: function LeftCenterRightPerspectiveView(options) {
      if (!!options && options.perspectiveMode === 'edit') {
        this._prepareForEditMode(options);
      }
      ZonePerspectiveView.prototype.constructor.apply(this, arguments);
      if (!!options && options.perspectiveMode === 'edit') {
        this._registerEditEvents();
      }
    },

    /**
     * Fill placeholders in empty zones
     */
    _prepareForEditMode: function (options) {
      if (!options.left || _.isEmpty(options.left.type)) {
        options.left = {
          kind: 'tile',
          type: 'csui/perspective.manage/widgets/perspective.placeholder'
        };
      }
      if (!options.center || _.isEmpty(options.center.type)) {
        options.center = {
          kind: 'fullpage',
          type: 'csui/perspective.manage/widgets/perspective.placeholder'
        };
      }
      if (!options.right || _.isEmpty(options.right.type)) {
        options.right = {
          kind: 'tile',
          type: 'csui/perspective.manage/widgets/perspective.placeholder'
        };
      }

      options.cellBehaviours = {
        PerspectiveWidgetConfig: { // For widget editing
          behaviorClass: require(
              'csui/perspective.manage/behaviours/pman.widget.config.behaviour'),
          perspectiveView: this
        }
      };
    },

    _registerEditEvents: function () {
      var self = this;
      self.options.contextFragment = new ContextFragment(self.options.context);
      this.listenTo(this, 'delete:widget', function (widget) {
        if (self.getPManPlaceholderWidget) { // Provided by pman.config.behaviour
          var newWidget = self.getPManPlaceholderWidget();
          this._resolveWidget(newWidget).done(function () {
            widget.model.set('widget', newWidget);
          });
        }
        this._notifyPerspectiveChanges();
      });
      this.listenTo(this, 'replace:widget', function (widgetView, widgetToReplace) {
        var self = this;
        this._resolveWidget(widgetToReplace).done(function () {
          if (!widgetToReplace.options.___pman_isdropped) {
            self.options.context.clear();
            widgetView.model.set('widget', widgetToReplace);
            self.options.context.fetch();
          } else {
            widgetView.model.set('widget', widgetToReplace);
           //LPAD-86991 Edit page: superfluous models loaded
           // self.options.contextFragment.fetch();
          }
          self._notifyPerspectiveChanges();
        });
      }.bind(this));
      this.listenTo(this, "perspective:modified", this._notifyPerspectiveChanges);
      this.listenTo(this.options.context, "perspective:save:success", ()=>this.notified=false);
    },

    /**
     * Serializes the widget configuration to save the perspective.
     */
    serializePerspective: function (perspectiveModel, ignoreErrors = false) {
      var self     = this,
          deferred = $.Deferred();
      var optionsPromise = this.serializeOptions(perspectiveModel, ignoreErrors);
      optionsPromise.then(function (results) {
        var constant_data     = _.flatten(results.map(function (result) {
              return result.config.constantsData || [];
            })),
            options           = _.reduce(results, function (seed, result) {
              seed[result.zone] = result.config.widget;
              return seed;
            }, {}),
            perspectiveResult = {
              perspective: {
                type: 'left-center-right',
                options: options
              },
              constant_data: constant_data,
              constant_extraction_mode: 1
            };
        var allWidgets = _.reject(_.values(options), _.isEmpty);
        var isAllWidgetsValid = self.validateAndGenerateWidgetId(allWidgets);
        if (!isAllWidgetsValid) {
          deferred.reject(commonLang.widgetValidationFailed);
        } else {
          deferred.resolve(perspectiveResult);
        }
      }, deferred.reject);
      return deferred.promise();
    },

    _notifyPerspectiveChanges: function () {
      PerspectiveUtil.notifyPerspectiveChanges.call(this);
    },

    _supportMaximizeWidget: true,

    _supportMaximizeWidgetOnDisplay: true

  });

  return LeftCenterRightPerspectiveView;

});

csui.define('css!csui/perspectives/banner-content-sidebar/impl/banner-content-sidebar',[],function(){});

csui.define('csui/perspectives/banner-content-sidebar/banner-content-sidebar.perspective.view',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/jquery', 'csui/lib/marionette',
"csui/lib/radio", 'csui/utils/base', 
  'csui/perspectives/mixins/perspective.edit.mixin',
  'csui/utils/perspective/perspective.util',
  'csui/behaviors/drag.drop/dnd.container.behaviour',
  'csui/perspectives/flow/flow.perspective.view',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'i18n!csui/perspectives/impl/nls/lang',
  'css!csui/perspectives/banner-content-sidebar/impl/banner-content-sidebar'
], function (module, _, Backbone, $, Marionette, Radio, base, PerspectiveEditMixin, PerspectiveUtil,
  DnDContainerBehaviour, FlowPerspectiveView, LayoutViewEventsPropagationMixin, lang, commonLang) {
  var FlowPerspective = FlowPerspectiveView.extend({
    getSupportedWidgetSizes: function (manifest, widget) {
      var supportedKinds = [];
        if (this.$el.hasClass('cs-bcs-perspective-content')) {
          supportedKinds = _.filter(manifest.supportedKinds, function (supportedItem) {
            return supportedItem !== 'fullpage';
          });
          return _.map(supportedKinds, function (suppKind) {
            return {
              kind: suppKind,
              label: lang[suppKind + 'Label'],
              selected: widget.model.get('widget').kind === suppKind
            };
          });
        } else if (this.$el.hasClass('cs-bcs-perspective-banner') || this.$el.hasClass('cs-bcs-perspective-sidebar')) {
          return supportedKinds;
        } else {
          supportedKinds = _.filter(manifest.supportedKinds, function (supportedItem) {
            return supportedItem !== 'heroTile';
          });
          return _.map(supportedKinds, function (suppKind) {
            return {
              kind: suppKind,
              label: lang[suppKind + 'Label'],
              selected: widget.model.get('widget').kind === suppKind
            };
          });
        }
      }
  });

  var BannerContentSidebarView = Marionette.LayoutView.extend({

    className: 'banner-content-sidebar-perspective cs-perspective binf-container-fluid',

    regions: {
      bannerRegion: '#banner-region',
      contentRegion: '#content-region',
      sidebarRegion: '#sidebar-region'
    },

    constructor: function BannerContentSidebarView(options) {
      options || (options = {});
      options = $.extend(true, {}, options);
      this.context = options.context;
      if (options.banner && options.banner.length || options.perspectiveMode == "edit") {
        this.headerView = new FlowPerspective({
          widgets: options.banner && options.banner.length > 0 ? options.banner : undefined,
          context: options.context,
          type: options.type,
          perspectiveMode: options.perspectiveMode,
          className: 'cs-bcs-perspective-banner',
          disableDnd: true,
          widgetSizes : {
            tile: {
              widths: {
                xs: 12,
                sm: 12,
                md: 12,
                xl: 12
              }
            }
          },
          model: this.model
        });
        this.headerView.allowHTMLTilesOnly =  true;
        if (!!options.perspectiveMode && this.headerView.options.disableDnd) {
          this.addRowBehaviours(this.headerView);
        }
        this.headerView.listenTo(this.headerView, 'delete:widget', function (widgetView) {
          var self = this;
          var cells = self.collection.at(0).columns;
          var model = widgetView.model;
          cells.remove(model);
          self.$el.find('.csui-draggable-item-disable').removeClass('binf-hidden');
        });
      }

      this.contentView = new FlowPerspective({
        widgets: options.content,
        context: options.context,
        type: options.type,
        perspectiveMode: options.perspectiveMode,
        className: "cs-bcs-perspective cs-bcs-perspective-content grid-rows",
        widgetSizes: {
          tile: {
            widths: {
              xs: 12,
              sm: 12,
              md: 6,
              xl: 4
            }
          },
          header: {
            widths: {
              xs: 12,
              sm: 12,
              md: 6,
              xl: 8
            }
          },
          heroTile: {
            widths: {
              xs: 12,
              sm: 12,
              md: 12,
              xl: 12
            }
          }
        },
        model: this.model
      });
       this.sidebarView = new FlowPerspective({
        widgets: options.sidebar,
        context: options.context,
        type: options.type,
        perspectiveMode: options.perspectiveMode,
        className: "cs-bcs-perspective cs-bcs-perspective-sidebar grid-rows",
        widgetSizes: {
          tile: {
            widths: {
              xs: 12,
              sm: 12,
              md: 12,
              xl: 12
            }
          }
        },
        model: this.model
      });

      var waitFor = [this.contentView.widgetsResolved,
      this.sidebarView.widgetsResolved];
      if (this.headerView) {
        waitFor.push(this.headerView.widgetsResolved);
      }
      var deferred = $.Deferred();
      this.widgetsResolved = deferred.promise();
      $.whenAll.apply($, waitFor)
        .done(function () {
          deferred.resolve(_.flatten(arguments));
        }).fail(deferred.fail);

      Radio.channel("quicklink:Tiles").on("transparent:background",
        _.bind(function () {
          $(this.contentView.$el[0]).find('.quicklinkTiles').parents('.csui-widget').addClass('csui-transparent-background');
          $(this.sidebarView.$el[0]).find('.actionButton').parents('.csui-widget').addClass('csui-action-button');
        }, this));
      Radio.channel("newlayout:widget:size").on("update:widget:size",
        _.bind(function (widgetInfo) {
          if (widgetInfo.widgetView.$el.hasClass('csui-heroTile')) {
            widgetInfo.widgetView.$el.removeClass('csui-heroTile').addClass('csui-' + widgetInfo.kind);
          }
          Radio.channel("quicklink:Tiles").trigger("transparent:background");
        }, this));

      Radio.channel("dropdown:open").on("align:dropDown:menu",
        _.bind(function (widgetInfo) {
          var dropdownToggler = widgetInfo.$el.find('.binf-dropdown > a.binf-dropdown-toggle');
          this.$el.find('.csui-binf-dropdown-open').removeClass('csui-binf-dropdown-open');
          widgetInfo.options.widgetContainer.$el.addClass('csui-binf-dropdown-open');
          base.alignDropDownMenu({ targetEl: dropdownToggler });
        }, this));
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.propagateEventsToRegions();
    },
    
    addRowBehaviours: function (self) {
      function addCell(widgetConfig, index) {
        var newCell = self._prepareGridCell(widgetConfig, index);
        var cells = self.collection.at(0).columns;
        cells.add(newCell, { at: index });
        self.options.context.trigger('update:widget:panel', {
          'action': 'add',
          'widgetModel': newCell.widget
        });
      }
      self.options.rowBehaviours = {
        DnDContainerBehaviour: {
          behaviorClass: DnDContainerBehaviour,
          placeholder: self._getDnDPlaceholder.bind(self),
          handle: '.csui-pman-widget-masking', // Limit re-ordering to mask (avoids callout popover),
          helper: 'clone', // Use clone of the original element as drag image to preserve styles of original element as it is.
          start: _.bind(function (event, ui) {
            var banner = self.$el.find('.csui-draggable-item');
            if (banner.length >= 1) {
              return;
            }
            //hiding popover on drag start
            var popoverTarget = self.$el.find(".binf-popover");
            if (popoverTarget.length) {
              popoverTarget.removeClass("pman-ms-popover");
              popoverTarget.hide();
              popoverTarget.binf_popover('destroy');
            }
          },self),
          over: _.bind(function (event, ui) {
            ui.placeholder.addClass('binf-hidden');
            $(ui.helper).css('cursor', 'no-drop');
            var banner = self.$el.find('.csui-draggable-item');
            if (banner.length === 0 && (ui.placeholder.data("pman.widget.view") && ui.placeholder.data("pman.widget.view").get('id') == 'csui/widgets/html.editor' ||
              ui.placeholder.data("pman.widget") && ui.placeholder.data("pman.widget").get('id') == 'csui/widgets/html.editor')) {
              ui.helper.css('cursor', 'grabbing');
            }
            if (banner.length >= 1 || ui.placeholder.data("pman.widget.view") && ui.placeholder.data("pman.widget.view").get('id') != 'csui/widgets/html.editor' ||
              ui.placeholder.data("pman.widget") && ui.placeholder.data("pman.widget").get('id') != 'csui/widgets/html.editor') {
              return;
            }
            var placeholderWidget = self._getDnDPlaceholder(ui.helper);
            var placeholder = self.$el.find('.csui-pman-placeholder-container');
            // Update DnD placeholder with widget styles
            placeholder.attr('class', placeholderWidget.attr('class'));
            placeholder.html(placeholderWidget.html());
            placeholder.css('visibility', 'visible');
            placeholder.data('pman.widget', ui.helper.data('pman.widget'));
            placeholder.removeData('isBeyondLayout');
            if (!!ui.helper.data('pman.widget')) { // "pman.widget" is not available when reorder within flow
              // Preload widget's view which is going to be drop to get ready with manifest etc., to avoid delay in placing widget immeditly on drop
              self._resolveWidget({
                type: ui.helper.data('pman.widget').id
              }).done(
                function (resolvedWidget) {
                  placeholder.data('pman.widget.view', resolvedWidget);
                });
            }
          }, self),
          out: _.bind(function (event, ui) {
            $(ui.helper).css('cursor', 'grabbing');
            var placeholder = self.$el.find('.csui-pman-placeholder-container');
            placeholder.removeClass('pman-dnd-hover-placeholder');
            placeholder.addClass('csui-draggable-item-disable csui-pman-editable-widget');
            var banner = self.$el.find('.csui-draggable-item');
            if (banner.length >= 1 || !ui.placeholder.data("pman.widget.view") ||
              ui.placeholder.data("pman.widget.view") && ui.placeholder.data("pman.widget.view").get('id') != 'csui/widgets/html.editor') {
              return;
            }
            ui.placeholder.addClass('binf-hidden');
            ui.placeholder.data('isBeyondLayout', true);
          }, self),
          receive: _.bind(function (event, ui) {
            var banner = self.$el.find('.csui-draggable-item');
            if (banner.length >= 1 || !ui.placeholder.data("pman.widget.view") ||
              ui.placeholder.data("pman.widget.view") && ui.placeholder.data("pman.widget.view").get('id') != 'csui/widgets/html.editor') {
              self.$el.find('.csui-widget-item').remove();
              ui.sender.sortable("cancel");
              return;
            }
            if (ui.position.top > 0) {
              var newWidget = ui.placeholder.data('pman.widget'),
                index = ui.item.index(), // this.$el.find('.binf-row >div').index(ui.item);
                manifest = newWidget.get('manifest');

              var widget,
                preloadedWidgetView = ui.placeholder.data("pman.widget.view");
              if (PerspectiveUtil.isEligibleForLiveWidget(manifest)) {
                widget = {
                  type: newWidget.id,
                  kind: 'fullpage',
                  view: preloadedWidgetView.get('view')
                };
              } else {
                widget = {
                  type: 'csui/perspective.manage/widgets/perspective.widget',
                  kind: 'fullpage',
                  options: {
                    options: {}, // To be used and filled by callout form
                    widget: newWidget
                  },
                  view: (preloadedWidgetView = self.pespectiveWidgetView)
                };
              }
              widget.options = _.extend({ ___pman_isdropped: true }, widget.options);

              if (!preloadedWidgetView) {
                // Widget's view is not loaded yet, load view to attach new cell
                self._resolveWidget(widget).done(function (resolvedWidget) {
                  addCell(widget, index);
                });
              } else {
                // Widget's view preloaded on, ready to attach the cell.
                addCell(widget, index);
              }
            }
            // Move Placeholder widget to last
            self._ensurePlaceholder();
            self.$el.find('.csui-draggable-item-disable').addClass('binf-hidden');
            // Cancel sort event since placing widget manually here.
            ui.sender.sortable("cancel");
          }, self),
          stop: _.bind(function () {
            self._ensurePlaceholder();
          }, self)
        }
      };
    },

    onRender: function () {
      var self = this,
        clasName = 'csui-' + this.perspectiveType + '-layout';
      self.$el.addClass(clasName);
      if (self.options.banner && !!self.options.banner.length && this.options.banner[0].hidden !== true ||
        self.options.perspectiveMode == "edit" || (this.options.perspectiveMode === 'personalize' && !!self.options.banner.length)) {
        self.bannerRegion.show(self.headerView);
        if (self.headerView.options.widgets.length > 1) {
          self.headerView.$el.find('.csui-draggable-item-disable').addClass('binf-hidden');
        }
      }
      var contentViewWidgetsList = self.contentView.collection.models[0].columns.models;
      _.each(contentViewWidgetsList, function (widget) {
        widget.set('className', 'csui-' + widget.get('widget').kind + ' csui-widget');
      });
      var sidebarViewwWidgetsList = self.sidebarView.collection.models[0].columns.models;
      _.each(sidebarViewwWidgetsList, function (widget) {
        widget.set('className', 'csui-' + widget.get('widget').kind + ' csui-widget');
      });
      self.contentRegion.show(self.contentView);
      self.sidebarRegion.show(self.sidebarView);

    },

    serializePerspective: function (perspectiveModel, ignoreErrors = false) {
      this.setZoneName();
      var self         = this,
      deferred     = $.Deferred(),
      cells        = new Backbone.Collection();
      cells.push(this.contentView.collection.at(0).columns.models);
      cells.push(this.sidebarView.collection.at(0).columns.models);
      if (this.headerView) {
        cells.push(this.headerView.collection.at(0).columns.models);
      }
      var widgetModels = cells.filter(function (cell) {
        return !this.isEmptyPlaceholder(cell.get('widget'));
      }, this);
      widgetModels.sort(function (a, b) {
        return parseInt(a.cid.replace(/\D/g,'')) - parseInt(b.cid.replace(/\D/g,''));
      });
      var widgetPromises = widgetModels.map(function (widget, index) {
        return self.serializeWidget(widget, '/options/widgets/' + index, ignoreErrors);
      });
      $.whenAll.apply($, widgetPromises).done(function (results) {
        self.executeCallbacks(results, perspectiveModel, self.options.context).done(function () {
          // sorting the results to get the order of the widgets placed
          results = results.sort(function (a, b) {
            return a.widget.options.index - b.widget.options.index;
          });
          var widgets           = _.pluck(results, 'widget'),
              constant_data     = _.flatten(_.pluck(results, 'constantsData')),
              bannerModels = widgets.filter(function (cell) {
                if (!cell.options) {
                  return;
                }
                return cell.options.zone == 'banner';
              }, this),
              contentModels = widgets.filter(function (cell) {
                if (!cell.options) {
                  return;
                }
                return cell.options.zone == 'content';
              }, this),
              sidebarModels = widgets.filter(function (cell) {
                if (!cell.options) {
                  return;
                }
                return cell.options.zone == 'sidebar';
              }, this);
              self.unsetZoneName(widgets);
              var perspectiveResult = {
                perspective: {
                  type: self.perspectiveType,
                  options: {
                    banner: bannerModels,
                    content: contentModels,
                    sidebar: sidebarModels}
                  },
                constant_data: constant_data,
                constant_extraction_mode: 1
              };
          var isAllWidgetsValid = self.validateAndGenerateWidgetId(widgets);
          if (!isAllWidgetsValid) {
            deferred.reject(commonLang.widgetValidationFailed);
          } else {
            deferred.resolve(perspectiveResult);
          }
        }).fail(function (results) {
          // TODO Group errors
          results = _.filter(results, function (result) {return !!result.error});
          deferred.reject(results[0].error);
        });
      }, this).fail(function (results) {
        // TODO Group errors
        results = _.filter(results, function (result) {return !!result.error});
        deferred.reject(results[0].error);
      });
      return deferred.promise();
    },

    swapLayout: function(perspectiveModel){
      this.perspectiveType = perspectiveModel.attributes.perspective.type;
      var className = 'csui-' + this.perspectiveType + '-layout';
      this.$el.removeClass('csui-sidepanel-right-layout').removeClass('csui-sidepanel-left-layout')
        .addClass(className);
    },

    setZoneName: function () {
      if (this.headerView) {
        _.each(this.headerView.collection.at(0).columns.models, function (widget) {
          if (widget.get('widget').type == "csui/perspective.manage/widgets/perspective.widget") {
            widget.get('widget').options.options.zone = 'banner';
          } else {
            widget.get('widget').options.zone = 'banner';
          }
        });
      }
      _.each(this.contentView.collection.at(0).columns.models, function (widget, index) {
        if (widget.get('widget').type == "csui/perspective.manage/widgets/perspective.widget") {
          widget.get('widget').options.options.index = index;
          widget.get('widget').options.options.zone = 'content';
        } else {
          widget.get('widget').options.index = index;
          widget.get('widget').options.zone = 'content';
        }
      });

      _.each(this.sidebarView.collection.at(0).columns.models, function (widget, index) {
        if (widget.get('widget').type == "csui/perspective.manage/widgets/perspective.widget") {
          widget.get('widget').options.options.index = index;
          widget.get('widget').options.options.zone = 'sidebar';
        } else {
          widget.get('widget').options.index = index;
          widget.get('widget').options.zone = 'sidebar';
        }
      });
    },

    unsetZoneName: function (widgetModels) {
      _.each(widgetModels, function (model) {
         delete model.options.zone;
      });
    },

    enumerateWidgets: function (callback) {
      if (this.options.banner && this.options.banner.length) {
        _.each(this.options.banner, function (widget) {
          widget && callback(widget);
        });
      }

      _.each(this.options.content, function (widget) {
        widget && callback(widget);
      });

      _.each(this.options.sidebar || [], function (widget) {
        widget && callback(widget);
      });
    },

    getPreviousWidgets: function (perspectiveModel) {
      var perspective     = perspectiveModel.getPerspective(),
          previousWidgets = perspective &&
                            perspective.options ?
                            perspective.options.banner : {};
      _.each(this.options.sidebar, function (widget) {
        previousWidgets.push(widget);
      });
      _.each(this.options.content, function (widget) {
        previousWidgets.push(widget);
      });
      previousWidgets = _.map(previousWidgets, function (widget) {
        return {widget: widget};
      });
      return previousWidgets;
    },
    
    _supportMaximizeWidget: true,

    _supportMaximizeWidgetOnDisplay: true
  });
  _.extend(BannerContentSidebarView.prototype, LayoutViewEventsPropagationMixin);

  PerspectiveEditMixin.mixin(BannerContentSidebarView.prototype);
  return BannerContentSidebarView;

});

/* START_TEMPLATE */
csui.define('hbs!csui/perspectives/sidepanel-left/impl/sidepanel-left',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "<div id=\"banner-region\" class=\"binf-row\"></div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showBanner") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":3,"column":7}}})) != null ? stack1 : "")
    + "<div id=\"main\" class=\"binf-main\">\n    <div id=\"sidebar-region\" class=\"binf-col-xs-6 binf-col-sm-6 binf-col-md-4 binf-col-lg-3 binf-col-xl-3\"></div>\n    <div id=\"content-region\" class=\"binf-col-xs-6 binf-col-sm-6 binf-col-md-8 binf-col-lg-9 binf-col-xl-9\"></div>\n</div>";
}});
Handlebars.registerPartial('csui_perspectives_sidepanel-left_impl_sidepanel-left', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspectives/sidepanel-left/sidepanel-left.perspective.view',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/jquery', 'csui/lib/marionette',
  'csui/perspectives/mixins/perspective.edit.mixin',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/perspectives/banner-content-sidebar/banner-content-sidebar.perspective.view',
  'hbs!csui/perspectives/sidepanel-left/impl/sidepanel-left',
  'css!csui/perspectives/banner-content-sidebar/impl/banner-content-sidebar'
], function (module, _, Backbone, $, Marionette, PerspectiveEditMixin, LayoutViewEventsPropagationMixin, BannerContentSidebarView, perspectiveTemplate) {

  var SidepanelLeftPerspectiveView = BannerContentSidebarView.extend({
    template: perspectiveTemplate,
    templateHelpers: function () {
      var showBanner;
      if (this.options.perspectiveMode === "edit" || (this.options.perspectiveMode === 'personalize' && !!this.options.banner.length)) {
        showBanner = true;
      } else {
        showBanner = !!this.options.banner.length && this.options.banner[0].hidden != true ? true : false;
      }
      return {
        showBanner: showBanner,
        sidebarLeft: true,
        sidebarRight: false
      };
    },
    constructor: function SidepanelLeftPerspectiveView(options) {
      options || (options = {});
      options = $.extend(true, {}, options);
      this.perspectiveType = 'sidepanel-left';
      options.context.perspective.type = this.perspectiveType;
      BannerContentSidebarView.prototype.constructor.call(this, options);
      var self = this;
      this.listenTo(this,'expand:view', function() {
        if (self.headerView) {
          if (self.headerView.$el.parent().hasClass('binf-hidden')) {
            self.headerView.$el.parent().removeClass('binf-hidden');
          } else {
            self.headerView.$el.parent().addClass('binf-hidden');
          }
        }
        if (self.contentView.$el.has('.csui-expand-view').length) {
          self.contentView.$el.parent().addClass('csui-expanded-view');
          self.sidebarView.$el.parent().removeClass('csui-expanded-view').addClass('binf-hidden');
        } else if (self.sidebarView.$el.has('.csui-expand-view').length) {
          self.sidebarView.$el.parent().addClass('csui-expanded-view');
          self.contentView.$el.parent().removeClass('csui-expanded-view').addClass('binf-hidden');
        } else {
          self.sidebarView.$el.parent().removeClass('csui-expanded-view binf-hidden');
          self.contentView.$el.parent().removeClass('csui-expanded-view binf-hidden');
        }
      });
    }
  });
  _.extend(SidepanelLeftPerspectiveView.prototype, LayoutViewEventsPropagationMixin);
  PerspectiveEditMixin.mixin(SidepanelLeftPerspectiveView.prototype);
  return SidepanelLeftPerspectiveView;

});

/* START_TEMPLATE */
csui.define('hbs!csui/perspectives/sidepanel-right/impl/sidepanel-right',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "<div id=\"banner-region\" class=\"binf-row\"></div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showBanner") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":3,"column":7}}})) != null ? stack1 : "")
    + "<div id=\"main\" class=\"binf-main\">\n    <div id=\"content-region\" class=\"binf-col-xs-6 binf-col-sm-6 binf-col-md-8 binf-col-lg-9 binf-col-xl-9\"></div>\n    <div id=\"sidebar-region\" class=\"binf-col-xs-6 binf-col-sm-6 binf-col-md-4 binf-col-lg-3 binf-col-xl-3\"></div>\n</div>";
}});
Handlebars.registerPartial('csui_perspectives_sidepanel-right_impl_sidepanel-right', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspectives/sidepanel-right/sidepanel-right.perspective.view',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/jquery', 'csui/lib/marionette',
  'csui/perspectives/mixins/perspective.edit.mixin',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/perspectives/banner-content-sidebar/banner-content-sidebar.perspective.view',
  'hbs!csui/perspectives/sidepanel-right/impl/sidepanel-right',
  'css!csui/perspectives/banner-content-sidebar/impl/banner-content-sidebar'
], function (module, _, Backbone, $, Marionette, PerspectiveEditMixin, LayoutViewEventsPropagationMixin, BannerContentSidebarView, perspectiveTemplate) {

  var SidepanelRightPerspectiveView = BannerContentSidebarView.extend({
    template: perspectiveTemplate,
    templateHelpers: function () {
      var showBanner;
      if (this.options.perspectiveMode === "edit" || (this.options.perspectiveMode === 'personalize' && !!this.options.banner.length)) {
        showBanner = true;
      } else {
        showBanner = !!this.options.banner.length && this.options.banner[0].hidden !== true ? true : false;
      }
      return {
        showBanner: showBanner,
        sidebarRight: true,
        sidebarLeft: false
      };
    },
    constructor: function SidepanelRightPerspectiveView(options) {
      options || (options = {});
      options = $.extend(true, {}, options);
      this.perspectiveType = 'sidepanel-right';
      options.context.perspective.type = this.perspectiveType;
      BannerContentSidebarView.prototype.constructor.call(this, options);
      var self = this;
      this.listenTo(this,'expand:view', function() {
        if (self.headerView) {
          if (self.headerView.$el.parent().hasClass('binf-hidden')) {
            self.headerView.$el.parent().removeClass('binf-hidden');
          } else {
            self.headerView.$el.parent().addClass('binf-hidden');
          }
        }
        if (self.contentView.$el.has('.csui-expand-view').length) {
          self.contentView.$el.parent().addClass('csui-expanded-view');
          self.sidebarView.$el.parent().removeClass('csui-expanded-view').addClass('binf-hidden');
        } else if (self.sidebarView.$el.has('.csui-expand-view').length) {
          self.sidebarView.$el.parent().addClass('csui-expanded-view');
          self.contentView.$el.parent().removeClass('csui-expanded-view').addClass('binf-hidden');
        } else {
          self.sidebarView.$el.parent().removeClass('csui-expanded-view binf-hidden');
          self.contentView.$el.parent().removeClass('csui-expanded-view binf-hidden');
        }
      });
    }
  });
  _.extend(SidepanelRightPerspectiveView.prototype, LayoutViewEventsPropagationMixin);
  PerspectiveEditMixin.mixin(SidepanelRightPerspectiveView.prototype);
  return SidepanelRightPerspectiveView;

});

// Loads a widget and renders it in a full-page zone layout
csui.define('csui/perspectives/single/single.perspective.view',['module', 'csui/lib/underscore', 'csui/perspectives/zone/zone.perspective.view'
], function (module, _, ZonePerspectiveView) {

  var config = module.config();
  _.defaults(config, {
    zoneNames: ['widget'],
    zoneLayouts: {
      'widget': {
        zoneOrder: ['widget'],
        zoneSizes: {
          widget: {
            sizes: {
              xs: 12
            },
            heights: {
              xs: 'full'
            }
          }
        }
      }
    }
  });

  var SinglePerspectiveView = ZonePerspectiveView.extend({

    className: function () {
      var className       = 'cs-single-perspective',
          parentClassName = _.result(ZonePerspectiveView.prototype, 'className');
      if (parentClassName) {
        className = className + ' ' + parentClassName;
      }
      return className;
    },

    zoneNames: config.zoneNames,
    zoneLayouts: config.zoneLayouts,
	unSupportedWidgets: config.unSupportedWidgets,

    constructor: function SinglePerspectiveView(options) {
      ZonePerspectiveView.prototype.constructor.apply(this, arguments);
    }

  });

  return SinglePerspectiveView;

});


csui.define('csui/utils/contexts/factories/active.tab.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory'
], function (module, _, Backbone, ModelFactory) {

  var ActiveTabModel = Backbone.Model.extend({

    defaults: {
      tabIndex: 0
    }

  });

  var ActiveTabModelFactory = ModelFactory.extend({

    propertyPrefix: 'activeTab',

    constructor: function ActiveTabModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var activeTab = this.options.activeTab || {};
      if (!(activeTab instanceof Backbone.Model)) {
        var config = module.config();
        activeTab = new ActiveTabModel(activeTab.attributes, _.extend({},
            activeTab.options, config.options));
      }
      this.property = activeTab;
    }

  });

  return ActiveTabModelFactory;

});


csui.define('csui/utils/non-emptying.region/non-emptying.region',['smart/utils/non-emptying.region/non-emptying.region'], function (SmartNonEmptyingRegion) {
  'use strict';
  
  return SmartNonEmptyingRegion;

});


csui.define('csui/perspectives/tabbed/behaviors/tab.extensions.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/non-emptying.region/non-emptying.region'
], function (module, _, $, Marionette, NonEmptyingRegion) {
  'use strict';

  var TabExtensionsBehavior = Marionette.Behavior.extend({

    constructor: function TabExtensionsBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.listenTo(view, 'render', this.renderExtension);
      this.listenTo(view, 'before:destroy', this.destroyExtension);
      this.listenTo(view, 'dom:refresh', this.refreshTab);
    },

    renderExtension: function () {
      var options                         = this.view.options,
          tabBarLeftExtensionViewClass    = options.tabBarLeftExtensionViewClass,
          tabBarLeftExtensionViewOptions  = options.tabBarLeftExtensionViewOptions,
          tabBarRightExtensionViewClass   = options.tabBarRightExtensionViewClass,
          tabBarRightExtensionViewOptions = options.tabBarRightExtensionViewOptions,
          // tabpanel ==> 'left extension', 'tablinks', 'right extension','tabcontent'
          tabLeftExtensionIndex           = 0, // left extension if present, index is 0
          tabRightExtensionIndex;//right extension if present,index can be either 1(no left extension or 2( with left extension)

      this.tabBarLeftExtensionsRegion = this.showExtension(tabBarLeftExtensionViewClass,
          tabBarLeftExtensionViewOptions, tabLeftExtensionIndex);
      tabRightExtensionIndex = !!this.tabBarLeftExtensionsRegion ? 2 : 1;
      this.tabBarRightExtensionsRegion = this.showExtension(tabBarRightExtensionViewClass,
          tabBarRightExtensionViewOptions, tabRightExtensionIndex);
      this.view._initializeToolbars();
    },

    showExtension: function (viewClass, viewOptions, index) {
      var viewRegion;
      if (!!viewClass) {
        if (typeof (viewClass) === "function") {
          this.tabBarExtensionView = new viewClass(viewOptions);
          this.tabBarExtensionView.$el.addClass("tab-extension");
          if (!!viewOptions.customClass) {
            this.tabBarExtensionView.$el.addClass(viewOptions.customClass);
          }
          viewRegion = new NonEmptyingRegion({
            el: this.view.el,
            index: index
          });
          viewRegion.show(this.tabBarExtensionView);
        }
      }
      return viewRegion;
    },

    refreshTab: function () {
      this.view._enableToolbarState();

      if(this.tabBarExtensionView){
        this.tabBarExtensionView.triggerMethod("dom:refresh");
      }
    },

    destroyExtension: function () {
      if (!!this.tabBarLeftExtensionsRegion) {
        this.tabBarLeftExtensionsRegion.empty();
      }
      if (!!this.tabBarRightExtensionsRegion) {
        this.tabBarRightExtensionsRegion.empty();
      }
    }
  });

  return TabExtensionsBehavior;

});




csui.define('csui/perspectives/tabbed/tab.index/tab.index.preferences',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui-ext!csui/perspectives/tabbed/tab.index/tab.index.preferences'
], function (_, Backbone, extensions) {
  'use strict';

  var TabIndexPreferenceModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      getPreferredTabIndex: null
    },

    constructor: function TabIndexPreferenceModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });

  var TabIndexPreferenceCollection = Backbone.Collection.extend({
    model: TabIndexPreferenceModel,
    comparator: 'sequence',

    constructor: function TabIndexPreferenceCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    getPreferredTabIndex: function (options) {
      var tabIndex;
      this.some(function (extension) {
        tabIndex = extension.get('getPreferredTabIndex')(options);
        return tabIndex !== undefined;
      });
      return tabIndex;
    }
  });

  var tabIndexPreferences = new TabIndexPreferenceCollection();

  if (extensions) {
    tabIndexPreferences.add(_
      .chain(extensions)
      .flatten()
      .value()
    );
  }

  return tabIndexPreferences;
});


/* START_TEMPLATE */
csui.define('hbs!csui/perspectives/tabbed/impl/tabbed.perspective',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"cs-header\"></div>\n<div class=\"cs-content\"></div>\n";
}});
Handlebars.registerPartial('csui_perspectives_tabbed_impl_tabbed.perspective', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspectives/tabbed/impl/tabbed.perspective',[],function(){});

csui.define('csui/perspectives/tabbed/tabbed.perspective.view',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/base',
  'csui/controls/tab.panel/tab.panel.view', 'csui/controls/grid/grid.view',
  'csui/behaviors/widget.container/widget.container.behavior',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/utils/contexts/factories/active.tab.factory',
  'csui/controls/tab.panel/tab.links.ext.scroll.mixin',
  'csui/controls/tab.panel/tab.links.ext.view',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'csui/perspectives/tabbed/behaviors/tab.extensions.behavior',
  'csui/controls/mixins/view.state/node.view.state.mixin',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/contexts/fragment/context.fragment',
  'csui/perspectives/tabbed/tab.index/tab.index.preferences',
  'hbs!csui/perspectives/tabbed/impl/tabbed.perspective',
  'css!csui/perspectives/impl/perspective',
  'css!csui/perspectives/tabbed/impl/tabbed.perspective'
], function (module, _, Backbone, $, Marionette, base, TabPanelView, GridView,
    WidgetContainerBehavior, LayoutViewEventsPropagationMixin,
    ActiveTabModelFactory, TabLinksScrollMixin, TabLinkCollectionViewExt,
    TabablesBehavior,
    TabExtensionsBehavior, NodeViewStateMixin, NextNodeModelFactory,
    ContextFragment, tabIndexPreferences, perspectiveTemplate) {
  'use strict';

  var config = module.config();

  // TODO: Remove these experimental parameters.
  // Let incremental tab loading be enabled or disabled by URL temporarily.
  var delayTabContent = /\bdelayTabContent\b(?:=([^&]*)?)?/i.exec(location.search);
  delayTabContent = delayTabContent ? delayTabContent[1] !== 'false' : true;
  if (delayTabContent === undefined) {
    delayTabContent = config.delayTabContent;
  }

  var GridRowWidgetContainerView = GridView.RowView.extend({

    cellView: function (model) {
      var widget = model.get('widget');
      if (widget) {
        var view = widget.view;
        if (!view) {
          throw new Marionette.Error({
            name: 'UnresolvedWidgetError',
            message: 'Widget "' + widget.type + '" not resolved: ' +
                     widget.error
          });
        }
        return view;
      }
    },

    cellViewOptions: function (model) {
      var widget = model.get('widget');
      return {
        context: this.options.context,
        data: widget && widget.options || {},
        // Widgets in the tab panel should create their own model instead
        // of using the grid cell model
        model: undefined
      };
    },

    constructor: function GridRowWidgetContainerView() {
      GridView.RowView.prototype.constructor.apply(this, arguments);
    }

  });

  var TabWidgetContainerView = TabPanelView.extend({

    contentView: GridRowWidgetContainerView,

    contentViewOptions: function (model) {
      return {
        context: this.options.context,
        columns: model.get('columns')
      };
    },

    constructor: function TabWidgetContainerView(options) {
      options || (options = {});
      _.defaults(options, {
        // Perspective can fetch all data, only if all widgets
        // are created; including on non-activated tabes
        delayTabContent: delayTabContent,
        // Prevent activating another tab before the activating animation
        // finished. Events before:activate:tab and activate:tab may be
        // triggered for a different tab.
        overlappingTabActivation: false,
        toolbar: true,
        TabLinkCollectionViewClass: TabLinkCollectionViewExt,
        tabBarLeftExtensionViewClass: options.tabBarLeftExtensionViewClass,
        tabBarLeftExtensionViewOptions: options.tabBarLeftExtensionViewOptions,
        tabBarRightExtensionViewClass: options.tabBarRightExtensionViewClass,
        tabBarRightExtensionViewOptions: options.tabBarRightExtensionViewOptions
      });

      if (options.tabs) {
        _.each(options.tabs, function (tab, tabIndex) {
          _.each(tab.columns, function (col, columnIndex) {
            col.widget.cellAddress = 'tab' + tabIndex + ':r0:c' + columnIndex;
          });
        });
      }
      this.behaviors = _.extend({
        TabExtensionsBehavior: {
          behaviorClass: TabExtensionsBehavior
        }
      }, this.behaviors);

      $(window).on('resize', {view: this}, this._onWindowResize);
      TabPanelView.prototype.constructor.call(this, options);
    },

    clearTabIndexes: function () {
      TabablesBehavior.clearTabIndexes(this.tabLinks);
      TabablesBehavior.clearTabIndexes(this.tabContent);
    },

    _onWindowResize: function (event) {
      if (event && event.data && event.data.view) {
        event.data.view._enableToolbarState();
      }
    }

  });

  _.extend(TabWidgetContainerView.prototype, TabLinksScrollMixin);

  function AllowTabIndexBeSet() {
    /**
     * We should not need this method. However, as the tab index is not reliably
     * contained in the view state, there is no other chance currently.
     * We check, whether routing was initiated by the browser (routeFromUrl).
     * This covers the cases for browser back/forward/Refresh/F5/UrlEdit which can
     * not be distinguished, at least not currently.
     * We also check if state was restored from the csui history (isFromHistory).
     * In both cases (routeFromUrl, isFromHistory) we must not set a tab index in the
     * view state even when undefined there, except if we are in the very first navigation
     * directly after starting (isFirstRoute), where it is allowed to set the tab.
     *
     * "the tab index is not reliably set in the view state" means:
     * tab=0 is not included in the URL and so if the view state is restored from the browser
     * history or from the csui history, then the view state does not contain a tab. However
     * in these cases we must not call GetPreferredTabIndex again.
     */
    if (this.context && this.context.viewStateModel) {
      var isFirstRoute = this.context.viewStateModel.get('isFirstRoute');
      var routeFromUrl = this.context.viewStateModel.get('routeFromUrl');
      var isFromHistory = this.context.viewStateModel.get('isFromHistory');
      if (isFirstRoute || !routeFromUrl && !isFromHistory) {
        return true;
      }
    }
  }

  var TabbedPerspectiveView = Marionette.LayoutView.extend({

    className: 'cs-tabbed-perspective cs-perspective binf-container-fluid',
    template: perspectiveTemplate,

    behaviors: {
      WidgetContainer: {
        behaviorClass: WidgetContainerBehavior
      }
    },

    regions: {
      headerRegion: '> .cs-header',
      contentRegion: '> .cs-content'
    },

    constructor: function TabbedPerspectiveView(options) {
      options || (options = {});
      options = $.extend(true, {}, options);

      this.context = options.context;
      var viewStateModel = this.context && this.context.viewStateModel;
      viewStateModel.setDefaultViewState('tab', 0);
      viewStateModel.addUrlParameters(['tab', 'order_by', 'page', 'filter']);
      this.activeTab =  this._initActiveTabFromViewState();
      this.associatedRouter = viewStateModel.get("activeRouterInstance");
      viewStateModel && viewStateModel.set(viewStateModel.CONSTANTS.ALLOW_WIDGET_URL_PARAMS, false);

      var widget = options && options.header && options.header.widget;
      if (widget) {
        options.header.widget = base.filterUnSupportedWidgets(widget, config);
      }
      if (options.tabs) {
        options.tabs = _.each(options.tabs, function (tab, tabIndex) {
          tab.columns = _.filter(tab.columns, function (col, columnIndex) {
            return base.filterUnSupportedWidgets(col.widget, config) != undefined;
          });
        });
      }

      Marionette.LayoutView.prototype.constructor.call(this, options);

      // The current tab may be wanted to be remembered when the perspective
      // is switched again.  The following model from the context does it.
      //this.activeTab = this.options.context.getModel(ActiveTabModelFactory);

      this.listenTo(this.context.viewStateModel, 'change:state', this.onViewStateChanged);

      this.listenTo(this.context,'before:change:perspective',function(){
        // when perspective changes in a normal navigation step, unset tab (fix LPAD-101476)
        if (AllowTabIndexBeSet.call(this)) {
          this.context.viewStateModel.setViewState('tab',undefined,{silent:true});
        }
      }.bind(this));

      this.listenTo(this.context,'retain:perspective',function(){
        if (this.tabPanel && this.tabPanel.activeTab) {
          // if perspective doesn't change, restore tab index deleted by perspective.router (fix LPAD-101475)
          var tabPanelTab = this.tabPanel.activeTab.get('tabIndex');
          this.context.viewStateModel.setViewState('tab',tabPanelTab,{silent:true});
          if (AllowTabIndexBeSet.call(this)) {
            var newTabIndex = tabIndexPreferences.getPreferredTabIndex({context: this.context});
            if (newTabIndex!=null && newTabIndex!=tabPanelTab) {
              var tabLink = this.tabPanel.tabLinks.children.findByIndex(newTabIndex);
              if (tabLink && tabLink.ui && tabLink.ui.link) {
                tabLink.ui.link.binf_tab('show');
              }
            }
          }
        }
      }.bind(this));

      this.nextNode = this.context.getModel(NextNodeModelFactory);
      this._originalId = this.nextNode.get('id');

      this.propagateEventsToRegions();
    },

    onRender: function () {
      this.navigationHeader = this.options.header.widget ?
                              this._createWidget(this.options.header.widget) : {};
      this.tabPanel = new TabWidgetContainerView(_.extend({
        activeTab: this.activeTab,
        delayTabContent: this.options.delayTabContent,
        tabBarLeftExtensionViewClass: this.navigationHeader.tabBarLeftExtensionView,
        tabBarLeftExtensionViewOptions: this.navigationHeader.tabBarLeftExtensionViewOptions,
        tabBarRightExtensionViewClass: this.navigationHeader.tabBarRightExtensionView,
        tabBarRightExtensionViewOptions: this.navigationHeader.tabBarRightExtensionViewOptions,
        disableExtensionOnFirstTab: this.navigationHeader.disableExtensionOnFirstTab,
        disableExtensionOnOtherTabs: this.navigationHeader.disableExtensionOnOtherTabs
      }, this.options));
      this._updateToggleHeaderState();
      // Do not use before:activate:tab and activate:tab. When overlapping of
      // those events is disabled, the content creation on before:activate:tab
      // wil not be ensured. The content population events have to be used to
      // cover the case, when the content is populated first on activate:tab.
      this.listenTo(this.tabPanel, 'before:populate:tab', this._onBeforePopulateTab)
          .listenTo(this.tabPanel, 'populate:tab', this._onPopulateTab)
          .listenTo(this.tabPanel, 'activate:tab', this._onActivateTab);
      if (!_.isEmpty(this.navigationHeader)) {
        this.$el.removeClass('csui-no-header');
        this.headerRegion.show(this.navigationHeader);
      } else {
        this.$el.addClass('csui-no-header');
      }
      this.contentRegion.show(this.tabPanel);
      this.headerRegion.$el.on(this._transitionEnd(), _.bind(function (event) {
        if (event.target === this.headerRegion.el) {
          this.$el.removeClass('cs-toggling');
          this.triggerMethod('dom:refresh');
        }
      }, this));

    },

    _onBeforePopulateTab: function (tabPanel, tabPane) {
      if (delayTabContent && !tabPane.contextFragment) {
        tabPane.contextFragment = new ContextFragment(this.context);
      }
    },

    _onPopulateTab: function (tabPanel, tabPane) {
      if (tabPane.contextFragment) {
        tabPane.contextFragment.fetch();
        tabPane.contextFragment.destroy();
        tabPane.contextFragment = undefined;
      }
    },

    _onActivateTab: function (tabContent, tabPane, tabLink) {
      this._updateToggleHeaderState(tabContent, tabPane, tabLink);
      this._notifyHeader();
    },

    _notifyHeader: function(tabContent, tabPane, tabLink){
      var tabIndex = this.tabPanel.activeTab.get('tabIndex');
      var isCollapsed = this.tabPanel.activeTab.get('isCollapsed');
      this.navigationHeader.triggerMethod("active:tab", {'tabIndex':tabIndex, 'isCollapsed': isCollapsed});
    },

    onBeforeRender: function () {
      if (this.headerRegion && this.headerRegion.$el) {
        this.headerRegion.$el.off(this._transitionEnd());
      }
    },

    onBeforeDestroy: function () {
      if (this.headerRegion && this.headerRegion.$el) {
        this.headerRegion.$el.off(this._transitionEnd());
      }
    },

    enumerateWidgets: function (callback) {
      var widget = this.options && this.options.header && this.options.header.widget;
      widget && callback(widget);
      _.each(this.options.tabs, function (tab) {
        _.each(tab.columns || [], function (column) {
          column.widget && callback(column.widget);
        });
      });
    },

    _createWidget: function (widget) {
      var Widget = widget.view;
      if (!Widget) {
        throw new Marionette.Error({
          name: 'UnresolvedWidgetError',
          message: 'Widget not resolved: "' + widget.type + '"'
        });
      }
      return new Widget({
        context: this.options.context,
        data: widget.options || {}
      });
    },

    _updateToggleHeaderState: function (tabContent, tabPane, tabLink) {
      // If this handler is triggered by before:activate:tab, the activeTab
      // model has not been updated yet
      var tabIndex    = tabLink ? tabLink.model.collection.indexOf(tabLink.model) :
                        this.activeTab && this.activeTab.get('tabIndex') || 0,
          method      = tabIndex === 0 ? 'removeClass' : 'addClass',
          isCollapsed = this.$el.hasClass('cs-collapse');
      if (method === 'removeClass' && isCollapsed ||
          method === 'addClass' && !isCollapsed) {
        this.$el.addClass('cs-toggling');
        this.$el[method]('cs-collapse');
      }
      this.tabPanel.activeTab.set('isCollapsed', (tabIndex > 0) );

      if (this.tabPanel && this.tabPanel.tabLinks) {
        this.setViewStateTabIndex(tabIndex);
      }
    },

    onDomRefresh: function () {
      this.onViewStateChanged();
    },

    _initActiveTabFromViewState: function () {
      var tabIndex = this.getViewStateTabIndex();

      // Call the plugins to see if the tab that needs to be displayed is different from what the
      // url has and the viewStateModel has.
      var context = this.context;

      var newTabIndex = tabIndex;
      // Do not call the plugin if we already navigated, but if we have not
      // navigated already then make sure we do not call the plugin unless no
      // tab specifically specified in the url.
      if ((tabIndex === undefined || tabIndex === null) && AllowTabIndexBeSet.call(this)) {
        newTabIndex = tabIndexPreferences.getPreferredTabIndex({context: context});
      }

      if (newTabIndex !== undefined && newTabIndex !== tabIndex) {
        tabIndex = newTabIndex;
        // The url needs to change to the new tab, but we need to make sure
        // the original url that did not have a tab parameter in it to be replaced
        // with the one that has one equal to the new index.
        this.context.viewStateModel.set('replaceURL', true);

        // By setting the tab on the viewState, we will trigger a new navigation and the url
        // will be constructed correctly.
        this.setViewStateTabIndex(tabIndex);
      }

      // if the tabIndex is > 0 then return a tab to activate, otherwise we let the view do the
      // default behavior.
      if (tabIndex) {
        return new Backbone.Model({tabIndex: tabIndex});
      }
    },

    onViewStateChanged: function (forceActivation) {

      if (this.context.viewStateModel.get('disable_tab_switching') ||
            this._originalId !== this.nextNode.get('id')) {
        return;
      }
      // do not activate a tab, if router is different: new perspective will be loaded and
      // if there is a tabbed perspective it will be rendered explicitly (fix LPAD-102154)
      var activeRouter = this.context.viewStateModel.get("activeRouterInstance");
      if (activeRouter!==this.associatedRouter) {
        return;
      }
      
      var tabIndex = this.getViewStateTabIndex(),
          defaultTabIndex = this.getDefaultViewStateTabIndex(),
          tabPanel = this.tabPanel,
          tabLinks = tabPanel && this.tabPanel.tabLinks,
          self     = this;
      this.tabPanel.rightToolbar[0].querySelector('otc-icon').setAttribute("iconappearance","light")
      this.tabPanel.leftToolbar[0].querySelector('otc-icon').setAttribute("iconappearance","light")
      if (tabIndex === undefined) {
        tabIndex = defaultTabIndex || 0;
      }

      // todo: Remove all all this stuff from here. This is a last minute fix before the 16.2.10
      // release and did not know how to fix it any other way.
      function isTabContentCreated(index) {
        var tabPanels = tabPanel.el.querySelectorAll('[role=tabpanel]');
        if (self.context.viewStateModel.get('routeFromUrl')) {
          return true;
        } else if (tabPanels && tabPanels.length > index) {
          return $(tabPanels[index]).height() > 0;
        }
      }

      function activateTabWhenReady(tab, tabIndex) {
        if (isTabContentCreated(tabIndex)) {
          tab.activate();
        } else {
          setTimeout(activateTabWhenReady.bind(self, tab, tabIndex), 50);
        }
      }

      if (tabLinks && tabIndex !== undefined) {
        var tab = tabLinks.children.findByIndex(tabIndex);
        if (tab && !tab.isActive()) {
          activateTabWhenReady(tab, tabIndex);
        }
      }
    },

    _setFirstTabPanelVisibility: function (show) {
      var tabPanel = this.tabPanel.el.querySelector('[role=tabpanel]');
      tabPanel && (tabPanel.style.visibility = show ? 'visible' : 'hidden');
    },

    // TODO: Make a common method for this or remove it,
    // if all browsers support it.
    _transitionEnd: _.once(
        function () {
          var transitions = {
                transition: 'transitionend',
                WebkitTransition: 'webkitTransitionEnd',
                MozTransition: 'transitionend',
                OTransition: 'oTransitionEnd otransitionend'
              },
              element     = document.createElement('div'),
              transition;
          for (transition in transitions) {
            if (typeof element.style[transition] !== 'undefined') {
              return transitions[transition];
            }
          }
        }
    ),

    _supportMaximizeWidget: true

  });

  _.extend(TabbedPerspectiveView.prototype, LayoutViewEventsPropagationMixin);
  _.extend(TabbedPerspectiveView.prototype, NodeViewStateMixin);

  return TabbedPerspectiveView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/perspectives/tabbed-flow/impl/edit.perspective/tab.links',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "  <div class=\"left-toolbar\"></div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "  <div class=\"right-toolbar\"></div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"toolbar") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":3,"column":7}}})) != null ? stack1 : "")
    + "\n<div class=\"tab-links-bar\">\n  <span class=\"fadeout\"></span>\n  <ul class=\"binf-nav "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"tab_type") || (depth0 != null ? lookupProperty(depth0,"tab_type") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"tab_type","hash":{},"loc":{"start":{"line":7,"column":22},"end":{"line":7,"column":34}}}) : helper)))
    + "\" role=\"tablist\"></ul>\n</div>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"toolbar") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":10,"column":0},"end":{"line":12,"column":7}}})) != null ? stack1 : "")
    + "\n<div class=\"csui-pman-add-newtab\">\n  <button class=\"icon icon-action-add\" title=\"Add tab\"></button>\n</div>\n";
}});
Handlebars.registerPartial('csui_perspectives_tabbed-flow_impl_edit.perspective_tab.links', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/perspectives/tabbed-flow/impl/edit.perspective/tab.link',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<a href=\"#"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"uniqueTabId") || (depth0 != null ? lookupProperty(depth0,"uniqueTabId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"uniqueTabId","hash":{},"loc":{"start":{"line":1,"column":10},"end":{"line":1,"column":25}}}) : helper)))
    + "\" class=\"cs-tablink\" data-binf-toggle=\"tab\" title=\""
    + container.escapeExpression((lookupProperty(helpers,"csui-l10n")||(depth0 && lookupProperty(depth0,"csui-l10n"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"title") : depth0),{"name":"csui-l10n","hash":{},"loc":{"start":{"line":1,"column":76},"end":{"line":1,"column":95}}}))
    + "\">\n  <span class=\"cs-tablink-text\">"
    + container.escapeExpression((lookupProperty(helpers,"csui-l10n")||(depth0 && lookupProperty(depth0,"csui-l10n"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"title") : depth0),{"name":"csui-l10n","hash":{},"loc":{"start":{"line":2,"column":32},"end":{"line":2,"column":51}}}))
    + "</span>\n  <input class=\"csui-pman-editinput binf-hidden\" tabindex=\"-1\">\n</a>\n<div class=\"cs-tablink-delete\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"removeTab") || (depth0 != null ? lookupProperty(depth0,"removeTab") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"removeTab","hash":{},"loc":{"start":{"line":5,"column":38},"end":{"line":5,"column":51}}}) : helper)))
    + "\">\n  <span class=\"icon clear-icon-white cs-delete-icon\" role=\"button\" data-cstabindex=\"0\"></span>\n</div>\n";
}});
Handlebars.registerPartial('csui_perspectives_tabbed-flow_impl_edit.perspective_tab.link', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/perspectives/tabbed-flow/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/perspectives/tabbed-flow/impl/nls/root/lang',{
  deleteConfirmTitle: 'Remove Tab',
  deleteConfirmMsg: 'Are you sure, you want to remove Tab?',
  removeTab: 'Remove Tab',
  newTabTitle: 'Tab',
  newTabInput: 'Add tab label'
});




csui.define('css!csui/perspectives/tabbed-flow/impl/edit.perspective/tab.link',[],function(){});

csui.define('csui/perspectives/tabbed-flow/impl/edit.perspective/tab.link.view',['csui/lib/underscore', 'csui/controls/tab.panel/impl/tab.link.view',
  'hbs!csui/perspectives/tabbed-flow/impl/edit.perspective/tab.link',
  'i18n!csui/perspectives/tabbed-flow/impl/nls/lang',
  'csui/lib/binf/js/binf',
  'css!csui/perspectives/tabbed-flow/impl/edit.perspective/tab.link',
], function (_, TabLinkView, tabLinkTemplate, lang) {
  var EditPerspectiveTabLink = TabLinkView.extend({
    template: tabLinkTemplate,

    templateHelpers: function () {
      return {
        removeTab: lang.removeTab
      };
    },

    className: function () {
      return this._isOptionActiveTab() ? 'pman-edit-tab binf-active' : 'pman-edit-tab';
    },

    events: function () {
      return _.extend(TabLinkView.prototype.events, {
        'click @ui.link': '_onShowTab',
        'dblclick @ui.tabLink': '_onTabClick',
        'keydown @ui.editInput': '_onInputKeydown',
        'keyup @ui.editInput': '_onInputKeyup',
        'focusout @ui.editInput': '_onInputFocusOut',
        'click @ui.tabRemove': '_onTabRemove'
      });
    },

    ui: function () {
      return _.extend(TabLinkView.prototype.ui, {
        'editInput': '.csui-pman-editinput',
        'tabLink': '.cs-tablink-text',
        'tabRemove': '.cs-delete-icon'
      });
    },

    _onShowTab: function (event) {
      //prevent activating new tab with no title
      if (!this.model.get('title')) {
        event.preventDefault();
        event.stopPropagation();
      }
    },

    _onTabRemove: function () {
      var self = this;
      csui.require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
        alertDialog.confirmQuestion(lang.deleteConfirmMsg, lang.deleteConfirmTitle)
            .done(function (yes) {
              if (yes) {
                self._doRemoveTab();
              }
            });
      });
    },

    _doRemoveTab: function () {
      if (!this.model.get('title')) {
        this.trigger('enable:addTab');
      }
      this.trigger('remove:tab', this.model);
    },

    _onTabClick: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this._editTab();
    },

    _editTab: function () {
      var text;
      if (this.ui.tabLink.text()) {
        text = this.ui.tabLink.text();
        this.ui.editInput.val(text);
      }
      else {
        this.ui.editInput.attr('placeholder', lang.newTabInput);
      }
      this._setEdit(true);
    },

    _setEdit: function (isEdit) {
      if (isEdit) {
        //prevent edit for double click on non active tab as it is still activating
        if (this.options && this.options.tabPanel && this.options.tabPanel.activatingTab) {
          return;
        }
        this.trigger('disable:addTab');
        this.ui.tabRemove.addClass('binf-hidden');
        this.ui.editInput.removeClass('binf-hidden');
        this.ui.tabLink.addClass('binf-hidden');
        //Trigger event so that the parent view will scroll until input field is visible
        //and set focus
        this.trigger('before:edit', this);
      } else {
        this.ui.tabLink.removeClass('binf-hidden');
        this.ui.editInput.addClass('binf-hidden');
        this.activate();
        this.ui.link.trigger('focus');
      }
    },

    _onInputFocusOut: function () {
      if (!this.ui.tabLink.text()) {
        this._doRemoveTab();
        return;
      }
      this._setEdit(false);
      this.ui.tabRemove.removeClass('binf-hidden');
      this.trigger('enable:addTab');
    },

    _onInputKeydown: function (event) {
      var value = event.target.value;
      if (event.which == 32) {
        //disable space if no text
        (!value) && event.preventDefault();
        //space key is is disabled for tabs by jquery to differentiate from links
        //but enabling it as per requirement by preventing disable
        event.stopPropagation();
      }
    },
    _onInputKeyup: function (event) {
      var value = event.target.value;
      if ((!value || value.length === 0) && (event.which == 13 || event.which == 27)) {
        this._doRemoveTab();
        return;
      }
      switch (event.which) {
      case 13:
        this._setTabTitle(value);
        break;
      case 27:
        this._setEdit(false);
        break;
      }
    },

    _setTabTitle: function (newTitle) {
      this.ui.tabLink.text(newTitle);
      this._setEdit(false);
      //Remove edit mode before model 'change' which triggers tab adjustment
      this.model.set('title', newTitle);
    },

    onShow: function () {
      if (!this.model.get('title')) {
        this._editTab();
      }
    },

    constructor: function EditPerspectiveTabLink() {
      TabLinkView.prototype.constructor.apply(this, arguments);
    }
  });
  return EditPerspectiveTabLink;
});

csui.define('css!csui/perspectives/tabbed-flow/impl/edit.perspective/tab.links',[],function(){});

csui.define('csui/perspectives/tabbed-flow/impl/edit.perspective/tab.links.view',['csui/lib/underscore', 'csui/controls/tab.panel/tab.links.ext.view',
  'hbs!csui/perspectives/tabbed-flow/impl/edit.perspective/tab.links',
  'csui/perspectives/tabbed-flow/impl/edit.perspective/tab.link.view',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'i18n!csui/perspectives/tabbed-flow/impl/nls/lang',
  'csui/lib/binf/js/binf',
  'css!csui/perspectives/tabbed-flow/impl/edit.perspective/tab.links'
], function (_, TabLinkCollectionView, tabLinksTemplate, TabLinkViewExt,
    ViewEventsPropagationMixin, lang) {

  var EditPerspectiveTabLinks = TabLinkCollectionView.extend({
    template: tabLinksTemplate,

    childView: TabLinkViewExt,

    childViewContainer: function () {
      return '.' + this.tabType;
    },

    ui: {
      'addNewTab': '.csui-pman-add-newtab'
    },

    triggers: {
      'before:edit': 'before:edit'
    },

    events: {
      'click @ui.addNewTab': '_onAddNewTab'
    },

    childViewOptions: function (model, index) {
      return _.extend(this.options, {});
    },

    childEvents: {
      'remove:tab': '_onRemoveTab',
      'enable:addTab': 'enableAddTab',
      'disable:addTab': 'disableAddTab',
      'before:edit': 'onBeforeEditTab'
    },

    constructor: function EditPerspectiveTabLinks() {
      TabLinkCollectionView.prototype.constructor.apply(this, arguments);
    },

    _onRemoveTab: function (tabView) {
      var isDeletingActive = tabView.isActive(),
          tabIndex         = this.collection.indexOf(tabView.model);
      this.collection.remove(tabView.model);
      if (!isDeletingActive) {
        return;
      }
      if (tabIndex >= this.collection.length) {
        tabIndex = this.collection.length - 1;
      }
      if (tabIndex < 0) {
        // No Tabs left
        return;
      }
      var tabToActivate = this.collection.at(tabIndex);
      this.children.findByModel(tabToActivate).activate();
    },

    _onAddNewTab: function () {
      if (this.ui.addNewTab.hasClass("csui-pman-disable-newtab")) {
        return;
      }
      var newTab = {
        title: ""
      };
      this.options.tabPanel.collection.add(newTab);
    },

    enableAddTab: function () {
      this.ui.addNewTab.removeClass("csui-pman-disable-newtab");
      //Refresh keyboard behavior when tab is added
      this.keyboardBehavior.refreshTabableElements(this);
    },

    disableAddTab: function () {
      this.ui.addNewTab.addClass("csui-pman-disable-newtab");
    },

    onBeforeEditTab: function (tab) {
      this.trigger('before:edit', tab);
    }
  });
  return EditPerspectiveTabLinks;
});

csui.define('csui/perspectives/tabbed-flow/tabbed-flow.perspective.view',[
  'require', 'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette','csui/utils/base', 'csui/models/widget/widget.collection',
  'csui/models/widget/widget.model', 'csui/controls/tab.panel/tab.panel.view',
  'csui/controls/grid/grid.view',
  'csui/behaviors/widget.container/widget.container.behavior',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/utils/contexts/factories/active.tab.factory',
  'csui/controls/tab.panel/tab.links.ext.scroll.mixin',
  'csui/controls/tab.panel/tab.links.ext.view',
  'csui/perspectives/tabbed/behaviors/tab.extensions.behavior', 'csui/utils/log',
  'csui/perspectives/tabbed-flow/impl/edit.perspective/tab.links.view',
  'csui/utils/contexts/fragment/context.fragment',
  'hbs!csui/perspectives/tabbed/impl/tabbed.perspective',
  'css!csui/perspectives/impl/perspective',
  'css!csui/perspectives/tabbed/impl/tabbed.perspective'
], function (require, module, _, $, Backbone, Marionette, base, WidgetCollection,
    WidgetModel, TabPanelView, GridView, WidgetContainerBehavior,
    LayoutViewEventsPropagationMixin, ActiveTabModelFactory, TabLinksScrollMixin,
    TabLinkCollectionViewExt, TabExtensionsBehavior, log, EditPerspectiveTabLinks,
    ContextFragment, perspectiveTemplate) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    defaultWidgetKind: 'tile',
    widgetSizes: {
      fullpage: {
        widths: {
          xs: 12
        }
      },
      tile: {
        widths: {
          md: 6,
          xl: 4
        }
      },
      header: {
        widths: {
          xs: 12,
          md: 8,
          xl: 6
        }
      }
    }
  });


  // TODO: Remove these experimental parameters.
  // Let incremental tab loading be enabled or disabled by URL temporarily.
  var delayTabContent = /\bdelayTabContent\b(?:=([^&]*)?)?/i.exec(location.search);
  delayTabContent = delayTabContent ? delayTabContent[1] !== 'false' : true;
  if (delayTabContent === undefined) {
    delayTabContent = config.delayTabContent;
  }

  var GridRowWidgetContainerView = GridView.RowView.extend({

    cellView: function (model) {
      var widget = model.get('widget');
      if (widget) {
        if (!widget.view) {
          throw new Marionette.Error({
            name: 'UnresolvedWidgetError',
            message: 'Widget "' + widget.type + '" not resolved:' +
                     widget['error']
          });
        }
        return widget.view;
      }
    },

    cellViewOptions: function (model) {
      var widget = model.get('widget');
      return {
        context: this.options.context,
        data: widget && widget.options || {},
        // Widgets in the tab panel should create their own model instead
        // of using the grid cell model
        model: undefined
      };
    },

    constructor: function GridRowWidgetContainerView(options) {
      if (!!options && options.perspectiveMode === 'edit') {
        this._prepareForEditMode(options);
      }
      GridView.RowView.prototype.constructor.apply(this, arguments);
      if (this.options.perspectiveMode === 'edit') {
        this._initEditMode();
        this._registerEditEvents();
      }
    },

    _prepareForEditMode: function (options) {
      options.cellBehaviours = {
        PerspectiveWidgetConfig: { // For widget editing
          behaviorClass: require(
              'csui/perspective.manage/behaviours/pman.widget.config.behaviour'),
          perspectiveView: this,
          perspectiveSelector: '.perspective-editing .cs-perspective #' + options.tabId
        }
      };
    },

    _initEditMode: function () {
      var self         = this,
          placeholderW = {
            type: 'csui/perspective.manage/widgets/perspective.placeholder'
          };
      TabbedFlowPerspectiveView._resolveWidget(placeholderW).done(function (resolvedWidget) {
        var newCell = TabbedFlowPerspectiveView._createCell(placeholderW, resolvedWidget);
        self.options.collection.add(newCell);
      });
    },

    _registerEditEvents: function () {
      var self = this;
      this.listenTo(this, 'delete:widget', function (widgetView) {
        var model = widgetView.model;
        self.collection.remove(model);
        // TODO Add a new placeholder when all cells removed
      });

      this.listenTo(this, 'replace:widget', this._replaceWidget);
    },

    _replaceWidget: function (currentWidget, widgetToReplace) {
      if (!this.getPManPlaceholderWidget) {
        // 'getPManPlaceholderWidget' Provided by pman.config.behaviour
        return;
      }
      var self = this;
      // Load new widget
      TabbedFlowPerspectiveView._resolveWidget(widgetToReplace).done(function () {
        // update current widget with new widget
        if (currentWidget.model.get('widget').type !== self.getPManPlaceholderWidget().type) {
          // Preserve widget kind if dropping on existing widget
          widgetToReplace.kind = currentWidget.model.get('widget').kind;
        }
        var widgetUpdates = TabbedFlowPerspectiveView._prepareCell(widgetToReplace);
        currentWidget.model.set(widgetUpdates);
        // Check if last widget of flow is replacing, then add new placeholder widget
        var placeholderWidget = self.getPManPlaceholderWidget(),
            cells             = self.collection,
            hasPlaceholders   = cells.filter(function (w) {
              return w.get('widget').type === placeholderWidget.type;
            }).length > 0;
        if (!hasPlaceholders) {
          // Create a placeholder wiget to be able to drop new widgets
          TabbedFlowPerspectiveView._resolveWidget(placeholderWidget).done(
              function (resolvedWidget) {
                var newCell = TabbedFlowPerspectiveView._createCell(placeholderWidget,
                    resolvedWidget, cells.length);
                cells.add(newCell);
              });
        }
      });
    }

  });

  var TabWidgetContainerView = TabPanelView.extend({

    contentView: GridRowWidgetContainerView,

    contentViewOptions: function (model) {
      return {
        context: this.options.context,
        columns: model.get('columns'),
        perspectiveMode: this.options.perspectiveMode,
        tabId: model.get('uniqueTabId')
      };
    },

    constructor: function TabWidgetContainerView(options) {
      options || (options = {});
      _.defaults(options, {
        // Perspective can fetch all data, only if all widgets
        // are created; including on non-activated tabes
        delayTabContent: delayTabContent,
        // Prevent activating another tab before the activating animation
        // finished. Events before:activate:tab and activate:tab may be
        // triggered for a different tab.
        overlappingTabActivation: false,
        toolbar: true,
        TabLinkCollectionViewClass: TabLinkCollectionViewExt,
        tabBarExtensionViewClass: options.tabBarExtensionViewClass,
        tabBarExtensionViewOptions: options.tabBarExtensionViewOptions,
        enableExtensionOnFirstTab: options.enableExtensionOnFirstTab
      });
      if (options.perspectiveMode === 'edit') {
        _.extend(options, {
          TabLinkCollectionViewClass: EditPerspectiveTabLinks
        });
      }

      this.behaviors = _.extend({
        TabExtensionsBehavior: {
          behaviorClass: TabExtensionsBehavior
        }
      }, this.behaviors);

      $(window).on('resize', {view: this}, this._onWindowResize);
      TabPanelView.prototype.constructor.call(this, options);
    },

    render: function () {
      TabPanelView.prototype.render.apply(this);
      this.listenTo(this.collection, 'change reset remove', _.bind(function (event) {
        this._enableToolbarState();
        //adjust the tab position after rename or removal
        this.activatingTab = false;
        this.skipAutoScroll = false;
        this._autoScrolling();
      }, this));
      this.listenTo(this.tabLinks, 'before:edit', function (tab) {
        this.skipAutoScroll = false;
        //refreshing the tabs if any new tab is added
        this.tabsSelector = $(this.$el.find('.tab-links .tab-links-bar')[0]).find('> ul li');
        this.tablinksToolbar = $(this.$el.find('.tab-links .tab-links-bar')[0]);
        //Scroll to the last if it is a new tab or
        // scroll until the input field of current tab is visible completely
        var scroll = tab && tab.model.get('title') ? '_autoScrolling' : '_autoScrollLastTab';
        this[scroll]().done(_.bind(function () {
          //update the toolbar after scroll
          this._enableToolbarState();
          //set focus only when the tab is completely visible
          tab && tab.ui && tab.ui.editInput.trigger('focus');
        }, this));
      });
      return this;
    },

    onDomRefresh: function () {
      this._enableToolbarState();
    },

    _onWindowResize: function (event) {
      if (event && event.data && event.data.view) {
        event.data.view._enableToolbarState();
      }
    }
  });

  _.extend(TabWidgetContainerView.prototype, TabLinksScrollMixin);

  /**
   * Header view to hold Navigation header of the Tabbed perspective.
   */
  var HeaderView = Marionette.ItemView.extend({
    className: 'cs-tabbed-perspective-header',
    constructor: function HeaderView(options) {
      options || (options = {});
      if (!options.header) {
        options.header = {};
      }
      if (options.perspectiveMode === 'edit') {
        var PerspectiveWidgetConfigBehaviour = require(
            'csui/perspective.manage/behaviours/pman.widget.config.behaviour');
        this.behaviors = _.extend({
          PerspectiveWidgetConfig: {
            behaviorClass: PerspectiveWidgetConfigBehaviour,
            perspectiveView: this
          }
        }, this.behaviors);
      }
      Marionette.ItemView.call(this, _.extend({template: false}, options));
      if (this.options.perspectiveMode === 'edit') {
        this._initEditMode(options);
        this._registerEditEvents();
      }
    },

    _initEditMode: function (options) {
      if (!this.options.header.widget && this.getPManPlaceholderWidget) {
        this._handleReplaceWidget(this, this.getPManPlaceholderWidget());
      }
    },

    _ensureRegion: function () {
      if (!this.headerContainer) {
        this.headerContainer = new Marionette.Region({
          el: this.el
        });
      }
      return this.headerContainer;
    },

    onRender: function () {
      if (!!this.options.header.widget) {
        this.navigationHeader = this._createWidget(this.options.header.widget);
        var region = this._ensureRegion();
        region.show(this.navigationHeader);
      }
    },

    _createWidget: function (widget) {
      var Widget = widget.view;
      if (!Widget) {
        throw new Marionette.Error({
          name: 'UnresolvedWidgetError',
          message: 'Widget not resolved: "' + widget.type + '"'
        });
      }
      return new Widget({
        context: this.options.context,
        data: widget.options || {}
      });
    },

    _registerEditEvents: function () {
      var self = this;
      this.listenTo(this, 'delete:widget', function (widgetView) {
        if (self.getPManPlaceholderWidget) {
          var placeholder = self.getPManPlaceholderWidget();
          TabbedFlowPerspectiveView._resolveWidget(placeholder).done(function () {
            self._replaceWidget(placeholder);
          });
        }
      });
      this.listenTo(this, 'replace:widget', this._handleReplaceWidget);
    },

    _replaceWidget: function (widgetToReplace) {
      this.options.header.widget = widgetToReplace;
      this.render();
    },

    _handleReplaceWidget: function (currentWidget, widgetToReplace) {
      var self = this;
      // Load new widget
      TabbedFlowPerspectiveView._resolveWidget(widgetToReplace).done(function () {
        // Replace current widget with new widget
        self._replaceWidget(widgetToReplace);
      });
    },

    /**
     * Provide header widget configuration to perspective manager
     */
    getPManWidgetConfig: function () {
      return this.options.header.widget;
    }
  });

  var TabbedFlowPerspectiveView = Marionette.LayoutView.extend({

    className: 'cs-tabbed-perspective cs-perspective binf-container-fluid cs-tabbed-flow-perspective',
    template: perspectiveTemplate,

    regions: {
      headerRegion: '> .cs-header',
      contentRegion: '> .cs-content'
    },

    constructor: function TabbedFlowPerspectiveView(options) {
      options || (options = {});
      options = $.extend(true, {}, options);
      this.context = options.context;
      if (!options.collection) {
        options.collection = this._createCollection(options);
      }
      Marionette.LayoutView.prototype.constructor.call(this, options);

      // The current tab may be wanted to be remembered when the perspective
      // is switched again.  The following model from the context does it.
      //this.activeTab = this.options.context.getModel(ActiveTabModelFactory);

      this.propagateEventsToRegions();
    },

    onRender: function () {
      this.headerView = new HeaderView(this.options);
      if (this.options.header.widget) {
        this.$el.removeClass('csui-no-header');
      } else {
        this.$el.addClass('csui-no-header');
      }
      this.headerRegion.show(this.headerView);
      this.tabPanel = new TabWidgetContainerView(_.extend({
        activeTab: this.activeTab,
        delayTabContent: this.options.delayTabContent,
        tabBarExtensionViewClass: this.headerView.navigationHeader && this.headerView.navigationHeader.tabBarExtensionView,
        tabBarExtensionViewOptions: this.headerView.navigationHeader && this.headerView.navigationHeader.tabBarExtensionViewOptions,
        enableExtensionOnFirstTab: this.headerView.navigationHeader && this.headerView.navigationHeader.enableExtensionOnFirstTab
      }, this.options));
      this._updateToggleHeaderState();
      this.listenTo(this.tabPanel, 'before:activate:tab', this._onBeforeActivateTab)
          .listenTo(this.tabPanel, 'activate:tab', this._onActivateTab);
      this.contentRegion.show(this.tabPanel);
      this.headerRegion.$el.on(this._transitionEnd(), _.bind(function (event) {
        if (event.target === this.headerRegion.el) {
          this.$el.removeClass('cs-toggling');
          this.triggerMethod('dom:refresh');
        }
      }, this));
    },

    onBeforeRender: function () {
      if (this.headerRegion && this.headerRegion.$el) {
        this.headerRegion.$el.off(this._transitionEnd());
      }
    },

    onBeforeDestroy: function () {
      if (this.headerRegion && this.headerRegion.$el) {
        this.headerRegion.$el.off(this._transitionEnd());
      }
    },

    _onBeforeActivateTab: function (tabContent, tabPane, tabLink) {
      if (delayTabContent && !tabPane.contextFragment) {
        this.contextFragment = new ContextFragment(this.context);
      }
    },

    _onActivateTab: function(tabContent, tabPane, tabLink){
      if (tabPane.contextFragment) {
        tabPane.contextFragment.fetch();
        tabPane.contextFragment.destroy();
        tabPane.contextFragment = undefined;
      }
      this._updateToggleHeaderState(tabContent, tabPane, tabLink);
    },

    _updateToggleHeaderState: function (tabContent, tabPane, tabLink) {
      if (this.options.perspectiveMode === 'edit') {
        // Ignore Tab header update for edit perspective mode.
        return;
      }
      // If this handler is triggered by before:activate:tab, the activeTab
      // model has not been updated yet
      var tabIndex    = tabLink ? tabLink.model.collection.indexOf(tabLink.model) :
                        this.activeTab && this.activeTab.get('tabIndex') || 0,
          method      = tabIndex === 0 ? 'removeClass' : 'addClass',
          isCollapsed = this.$el.hasClass('cs-collapse');
      if (method === 'removeClass' && isCollapsed ||
          method === 'addClass' && !isCollapsed) {
        this.$el.addClass('cs-toggling');
        this.$el[method]('cs-collapse');
      }
    },

    // TODO: Make a common method for this or remove it,
    // if all browsers support it.
    _transitionEnd: _.once(
        function () {
          var transitions = {
                transition: 'transitionend',
                WebkitTransition: 'webkitTransitionEnd',
                MozTransition: 'transitionend',
                OTransition: 'oTransitionEnd otransitionend'
              },
              element     = document.createElement('div'),
              transition;
          for (transition in transitions) {
            if (typeof element.style[transition] !== 'undefined') {
              return transitions[transition];
            }
          }
        }
    ),

    _createCollection: function (options) {

      if (options.tabs) {
        options.tabs = _.each(options.tabs, function (tab) {
          tab.widgets = _.filter(tab.widgets, function (widget) {
            return base.filterUnSupportedWidgets(widget, config) != undefined;
          });
        });
      }
		
      var tabs            = new Backbone.Collection(options.tabs),
          uniqueWidgets   = _.chain(options.tabs)
              .map(function (tab) {
                return tab.widgets;
              })
              .flatten()
              .pluck('type')
              .unique()
              .map(function (id) {
                return {id: id};
              })
              .value(),
          headerWidget = options.header && options.header.widget &&
                         base.filterUnSupportedWidgets(options.header.widget, config),
          resolvedWidgets = new WidgetCollection(uniqueWidgets),
          self            = this;
      if (headerWidget) {
        resolvedWidgets.add({id: headerWidget.type});
      }
      tabs.each(function (tab) {
        tab.set('id', _.uniqueId('cs-tab'));
      });
      this.widgetsResolved = resolvedWidgets
          .fetch()
          .then(function () {
            if (headerWidget) {
              var resolvedWidget = resolvedWidgets.get(headerWidget.type),
                  widgetView     = resolvedWidget.get('view');
              if (widgetView) {
                _.extend(headerWidget, {view: widgetView});
              } else {
                var error = resolvedWidget.get('error');
                log.warn('Loading widget "{0}" failed. {1}', headerWidget.type, error)
                && console.warn(log.last);
                _.extend(headerWidget, WidgetContainerBehavior.getErrorWidget(
                    headerWidget, error));
              }
            }
            tabs.each(function (tab) {
              tab.set('columns', self._createColumns(tab.get('widgets'), resolvedWidgets));
            });
            return resolvedWidgets; /* this will be used later when the promise is resolved */
          });
      return tabs;
    },

    _createColumns: function (widgets, resolvedWidgets) {
      return _.map(widgets, function (widget) {
        var resolvedWidget = resolvedWidgets.get(widget.type);
        return TabbedFlowPerspectiveView._createCell(widget, resolvedWidget);
      }.bind(this));
    }

  }, {

    _prepareCell: function (widgetConfig) {
      if (!widgetConfig.kind) {
        widgetConfig.kind = config.defaultWidgetKind;
      }
      var sizes = config.widgetSizes[widgetConfig.kind] || {};
      return {
        sizes: sizes.widths,
        widget: {
          type: widgetConfig.type,
          options: widgetConfig.options,
          view: widgetConfig.view
        }
      };
    },

    _createCell: function (widget, resolvedWidget) {
      var widgetView     = resolvedWidget.get('view'),
          manifest       = resolvedWidget.get('manifest') || {},
          supportedKinds = manifest.supportedKinds,
          kind           = widget.kind;
      if (!kind || !supportedKinds || !_.contains(supportedKinds, kind)) {
        kind = manifest.kind;
      }
      widget.kind = kind;
      if (!kind) {
        kind = config.defaultWidgetKind;
      }
      var sizes = config.widgetSizes[kind] || {};
      if (widgetView) {
        widget.view = widgetView;
        return TabbedFlowPerspectiveView._prepareCell(widget);
      }
      var error = resolvedWidget.get('error');
      log.warn('Loading widget "{0}" failed. {1}', widget.type, error)
      && console.warn(log.last);
      return {
        sizes: config.widgetSizes[config.defaultWidgetKind].widths,
        widget: WidgetContainerBehavior.getErrorWidget(widget, error)
      };
    },

    _resolveWidget: function (widget) {
      var deferred = $.Deferred();
      var widgetModel = new WidgetModel({id: widget.type});
      widgetModel.fetch().then(function () {
        widget.view = widgetModel.get('view');
        deferred.resolve(widgetModel);
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }
  });

  _.extend(TabbedFlowPerspectiveView.prototype, LayoutViewEventsPropagationMixin);

  return TabbedFlowPerspectiveView;

});


csui.define('csui/pages/start/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/pages/start/nls/root/lang',{
  // Used as a parameter in other patterns below
  ProductName: "OpenText Content Management CE 25.4",

  // Used for the back to title
  LandingPageBackTo:    "Home",

  // Example: "Home - OpenText Content Management"
  // Pattern: "Home - {1}"
  // {0} is the name of the user
  // {1} is the name of the product
  UserTitle: "Home - {1}",

  // Example: "CarbonFibre - OpenText Content Management"
  // Pattern: "{0} - {2}",
  // {0} is the name of the node
  // {1} is the type of the node
  // {2} is the name of the product
  NodeTitle: "{0} - {2}",

  // Example: "testDocument.docx v5.1 - OpenText Content Management"
  // Pattern: "{0} - {2}",
  // {0} is the name of the version
  // {1} is the version number
  // {2} is the name of the product
  VersionTitle: "{0} v{1} - {2}",

  // Example: "CarbonFibre, Properties - OpenText Content Management"
  // Pattern: "{1}, {0} - {2}",
  // {0} is the title of the metadata panel
  // {1} is the name of the node
  // {2} is the name of the product
  MetadataTitle:  "{1}, {0} - {2}",

  MetadataBackTo:    "Properties",

  // Example: "CarbonFibre, Permissions - John Smith"
  // Pattern: "{0}, Permissions - {1}",
  // {0} is the name of the node
  // {1} is the name of the user
  PermissionsTitle:  "{0}, Permissions - {1}",

  PermissionsBackTo:    "Permissions",

  // Example: "Searching for \"test\" - OpenText Content Management"
  // Pattern: "Searching for \"{0}\" - {1}",
  // {0} are the search terms
  // {1} is the name of the product
  SearchTitle:    "Searching for \"{0}\" - {1}",

  // Used for the back to title
  SearchBackTo:    "Search",

  // Example: "Favorites - OpenText Content Management"
  // Pattern: "Favorites - {0}"
  // {0} is the name of the product
  FavoritesTitle: "Favorites - {0}",

  // Used for the back to title
  FavoritesBackTo: "Favorites",

  // Example: "My Assignments - OpenText Content Management"
  // Pattern: "My Assignments - {0}"
  // {0} is the name of the product
  MyAssignmentsTitle: "My Assignments - {0}",

  // Used for the back to title
  MyAssignmentsBackTo: "My Assignments",

  // Example: "Recently Accessed - OpenText Content Management"
  // Pattern: "Recently Accessed - {0}"
  // {0} is the name of the product
  RecentlyAccessedTitle: "Recently Accessed - {0}",

  // Used for the back to title
  RecentlyAccessedBackTo: "Recently Accessed",

  // Example: "Search Results - OpenText Content Management"
  // Pattern: "Search Results - {0}"
  // {0} is the name of the product
  SearchResultsTitle: "Search Results - {0}",

  // Used for the back to title
  SearchResultsBackTo: "Search Results",

  // Example: "My Reserved Items - OpenText Content Management"
  // Pattern: "My Reserved Items - {0}"
  // {0} is the name of the product
  ReservedItemsTitle: "My Reserved Items - {0}",

  // Used for the back to title
  ReservedItemsBackTo: "My Reserved Items",

  // Example: "Recycle bin - OpenText Content Management"
  // Pattern: "Recycle bin - {0}"
  // {0} is the name of the product
  RecycleTitle: "Recycle bin - {0}",

  // Used for the back to title
  RecycleBackTo: "Recycle bin",


  // default back button title
  back: 'back'
});




csui.define('csui/pages/start/impl/location',[], function () {
  return {
    get search() {
      return location.search;
    },
    get href() {
      return location.href;
    },
    get hash() {
      return location.hash;
    }
  };
});


csui.define('csui/pages/start/perspective.router',[
  'csui/lib/backbone',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/pages/start/impl/location',
  'csui/utils/url'
], function (Backbone, $, _, ApplicationScopeModelFactory, location, Url) {
  'use strict';

  var activeRouter, previousRouter;
  var noViewStateRest = true;

  var PerspectiveRouter = Backbone.Router.extend({
    constructor: function PerspectiveRouter(options) {
      Backbone.Router.prototype.constructor.apply(this, arguments);

      this.history = this.history || Backbone.history;

      // Save common options for descended routers
      this.context = options.context;
      this._routeWithSlashes = options.routeWithSlashes;

      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);

      // Allow this router to react, before another router routes
      this.listenTo(this, 'other:route', this.onOtherRoute);
      //this.listenTo(this.context, 'change:perspective', this._resetViewStateModel);
      this.listenTo(this.context, 'sync error', function () {
        noViewStateRest = false;
      });
    },

    execute: function (callback, args) {
      this._session = this.context.viewStateModel.get("session_state") || false;
      // Inform the routing container, that a router is about to route
      this.trigger('before:route', this);
      this._restoreUrlParamsFromViewState();
      return Backbone.Router.prototype.execute.apply(this, arguments);
    },

    _restoreUrlParamsFromViewState: function () {
      if (!this.urlParams || this.urlParams.length === 0) {
        var viewStateModel = this.context.viewStateModel;
        var urlParams = viewStateModel.get(viewStateModel.CONSTANTS.URL_PARAMS);
        urlParams && _.isString(urlParams) && (urlParams = JSON.parse(urlParams)) && (this.urlParams = urlParams.slice());
      }
    },

    getUrlParametersList: function() {
      return this.urlParams;
    },

    addUrlParameters: function(urlParameters, replace) {
      var urlParams = this.getUrlParametersList() || [];

      if (replace) {
        urlParams = [];
      }

      this.urlParams = _.unique(urlParams.concat(urlParameters));

      var viewStateModel = this.context.viewStateModel;
      viewStateModel.set(viewStateModel.CONSTANTS.URL_PARAMS, this.urlParams);
      
      // remove from the viewStateModel any entry that is not listed in the urlParams
      this._clearViewStateModelKeys(this.urlParams);

      return true;
    } ,

    _clearViewStateModelKeys: function (keys) {
      var viewStateModel = this.context.viewStateModel,
          modified;
      var state = viewStateModel.get('state');
      _.keys(state).forEach(function (key) {
        if (keys.indexOf(key) === -1) {
          delete state[key];
          modified = true;
        }
      });
      if (modified) {
        this._syncDefaultStateToViewState(state);
        viewStateModel.unset('state', {silent: true});

        // Make sure we do not trigger the onViewStateChanged in the routers.
        // Some routers are not ready to handle building the URL yet. See LPAD-113953
        viewStateModel.set('state', state, {silent: true});
      }
    },

    _resetViewStateModel: function (keys) {
      if (noViewStateRest) {
        return;
      }
      var viewStateModel = this.context.viewStateModel,
          constants = viewStateModel.CONSTANTS;
      viewStateModel.unset(constants.STATE, {silent: true});
      viewStateModel.unset(constants.DEFAULT_STATE, {silent: true});
      viewStateModel.unset(constants.SESSION_STATE, {silent: true});
      viewStateModel.unset(constants.QUERY_STRING_PARAMS, {silent: true});

      viewStateModel.set(constants.STATE, {});
      viewStateModel.set(constants.DEFAULT_STATE, {});
      viewStateModel.set(constants.SESSION_STATE, {});
      viewStateModel.set(constants.QUERY_STRING_PARAMS, '');
    },

    getActiveRouter : function() {
      return activeRouter;
    },

    getPreviousRouter : function() {
      return previousRouter;
    },

    onViewStateChanged:function() {
    },

    getInitialViewState: function () {
      return {};
    },

    activate: function (setDefault) {
      // heuristic flags, not completely true but good enough for normal browser scenarios:
      // isFirstRoute: true if it is the first navigation step after initial load
      // routeFromUrl: true if it is a browser back, forward, url edit, Refresh/F5, href change.
      this.context.viewStateModel.set("isFirstRoute", this._session === false, {silent: true});
      this.context.viewStateModel.set("routeFromUrl", this._session !== undefined, {silent: true});
      delete this._session;
      if (activeRouter !== this) {
        previousRouter = activeRouter;
        activeRouter = this;
        var urlParams = this.getUrlParametersList();
        if (previousRouter && !this.restoring && urlParams && urlParams.length > 0) {
          urlParams.length = 0;
        }

        this._activeRouterChanged();
      }

      var viewStateModel = this.context.viewStateModel;

      viewStateModel.set('enabled', this.isViewStateModelSupported());

      // initialize the UI state with the defaults of this router.
      if (setDefault) {

        this._saveViewStates();

        this._initializeViewState();
      }
    },

    _saveViewStates: function() {

      // If we activate the router with setDefault before the potential history entry is saved
      // we will lose the state for the previous router and it history will not have the correct state.
      // In the _savePotentialHistoryEntry in the viewStateModel, we will look if the state was saved
      // if the router needed a viewstate to be initialized.

      var viewStateModel = this.context.viewStateModel;
      var saved_viewState = {},
          saved_defaultViewState = {},
          state = viewStateModel.get('state'),
          defaultViewState = viewStateModel.get('default_state');

      if (state) {
        _.extend(saved_viewState, state);
      }

      if (defaultViewState) {
        _.extend(saved_defaultViewState, defaultViewState);
      }

      viewStateModel.set('saved_viewstate', saved_viewState);
      viewStateModel.set('saved_defaultstate', saved_defaultViewState);
    },

    _initializeViewState:function() {
      var viewStateModel = this.context.viewStateModel;
      var state = viewStateModel.get('state');
      if (state && _.keys(state).length === 0) {
        viewStateModel.unset('state', {silent: true});
      }
      var newViewState = this.getInitialViewState();

      viewStateModel.setViewState('state', newViewState, {silent: true});
      this._syncDefaultStateToViewState(newViewState);
    },

    // remove any entry in the default state if its not in the viewState
    _syncDefaultStateToViewState: function (viewState) {
      var viewStateModel = this.context.viewStateModel;
      // make sure we sync the default state with the viewState
      var defaultState = viewStateModel.get('default_state'), modified;
      if (defaultState) {
        var viewStateKeys = Object.keys(viewState);
        Object.keys(defaultState).forEach(function(key){
          if (viewStateKeys.indexOf(key) === -1) {
            delete defaultState[key];
            modified = true;
          }
        });
        if (modified) {
          viewStateModel.unset('default_state');
          viewStateModel.set('default_state', JSON.parse(JSON.stringify(defaultState)));
        }
      }
    },

    _activeRouterChanged: function () {
      var viewStateModel = this.context.viewStateModel;

      if (activeRouter === this) {
        viewStateModel.set('activeRouterInstance', this);
        this.listenTo(viewStateModel, 'change:state', this.onViewStateChanged);
        if (previousRouter) {
          previousRouter.stopListening(viewStateModel, 'change:state', previousRouter.onViewStateChanged);
        }
      }
    },

    // The order of the url params needs to be consistent. otherwise when we
    // construct the url when we hit the back button and we build a url with a different
    // url parameters the history gets updated as if its a new url.
    buildUrlParams: function () {
      var urlParams = this.urlParams,
          context = this.context,
          viewStateModel = context && context.viewStateModel,
          viewState = viewStateModel && viewStateModel.get('state'),
          defaultViewState = viewStateModel.get('default_state');
      var paramsArray = [];

      var initialUrlParams = viewStateModel && viewStateModel.get('initialUrlParams');
      if (initialUrlParams && initialUrlParams.length) {
        paramsArray = paramsArray.concat(initialUrlParams);
        paramsArray.forEach(function (entry) {
          viewState[entry.name] = entry.value;
          urlParams = urlParams || [];
          urlParams.push(entry.name);
        });
      }

      if (urlParams && viewState) {
        urlParams.forEach(function (param) {
          var value        = viewState[param],
              defaultValue = defaultViewState && defaultViewState[param];
          if (value !== undefined && defaultValue !== undefined &&
              value.toString().toUpperCase() !== defaultValue.toString().toUpperCase()) {
            this._addToParamsArray(paramsArray, {
              name: param,
              value: value
            });
          }
        }.bind(this));
      }

      paramsArray = paramsArray || [];

      _.keys(viewState).forEach(function (key) {
        // only if the param in the url params list
        if (defaultViewState && defaultViewState[key] !== undefined && viewState[key] !== undefined &&
                    defaultViewState[key].toString().toUpperCase() === viewState[key].toString().toUpperCase()) {
          return true;
        }
        if (viewState[key] !== undefined) {
            this._addToParamsArray(paramsArray, {
              name: key,
              value: viewState[key]
            });
        }
      }.bind(this));

      // Do not retain the url parameters if the router changed
      var currentRouter = viewStateModel.get(viewStateModel.CONSTANTS.CURRENT_ROUTER);
      if (!currentRouter) {
        var queryStringParams = viewStateModel.get(viewStateModel.CONSTANTS.QUERY_STRING_PARAMS);
        _.keys(queryStringParams).forEach(function (key) {
          this._addToParamsArray(paramsArray, {
            name: key,
            value: queryStringParams[key]
          });
        }.bind(this));
      }

      return $.param(paramsArray);
    },

    _addToParamsArray: function(paramsArray, object) {
        if (object && object.name) {
          var found = false;
          paramsArray.some(function(entry) {
            if (entry.name === object.name) {
              found = true;
              return true;
            }
          });
          if (!found) {
            paramsArray.push(object);
            return true;
          }
        }
    },

    restore: function (routerInfo) {

      this._restoringRouterInfo = routerInfo;

      var viewStateModel = this.context.viewStateModel,
          fragment       = routerInfo.fragment;

      if (viewStateModel) {
        this.restoring = true;
        viewStateModel.set(viewStateModel.CONSTANTS.URL_PARAMS, routerInfo.urlParam);
        // The call to the Backbone.Router.prototype.navigate will trigger
        // new routing, we need to make sure we don't have the wrong url in the
        // browser history.
        viewStateModel.set('replaceURL', true);
        fragment && Backbone.Router.prototype.navigate.call(this, fragment, {trigger: true});
      } else {
        window.history.back();
      }
    },

    _getRestoringRouterInfo: function() {
      return this._restoringRouterInfo;
    },

    initSessionViewState: function () {
      var viewStateModel = this.context && this.context.viewStateModel;
      viewStateModel && viewStateModel.set(viewStateModel.CONSTANTS.SESSION_STATE, {});
    },

    initDefaultViewState: function () {
      if (!this.restoring) {
        var viewStateModel = this.context && this.context.viewStateModel;
        viewStateModel && viewStateModel.set(viewStateModel.CONSTANTS.DEFAULT_STATE,
            _.pick(viewStateModel.get(viewStateModel.CONSTANTS.DEFAULT_STATE)||{},viewStateModel.get(viewStateModel.CONSTANTS.URL_PARAMS)||[]));
      }
    },

    getUrlParamsNotInFragment: function (fragment) {
      var notInFragment = [],
          inUrl = _.keys(Url.urlParams(fragment));
      var allRoutersUrlParams = this.getUrlParametersList();
      allRoutersUrlParams && allRoutersUrlParams.forEach(function (param) {
        if (inUrl.indexOf(param) === -1) {
          notInFragment.push(param);
        }
      });
      return notInFragment;
    },

    initViewStateFromUrlParams: function (query_string, silent) {
      var viewState = {},
          viewStateModel = this.context && this.context.viewStateModel;

      this._saveViewStates();

       if (_.isString(query_string)) {
        var query_string_params = $.parseParams(query_string);
        viewStateModel.set(viewStateModel.CONSTANTS.QUERY_STRING_PARAMS, $.parseParams(query_string));
        var urlParams = this.getUrlParametersList();
        if (urlParams && urlParams.length > 0) {
          viewState = _.pick(query_string_params, this.getUrlParametersList());
        } else {
          _.extend(viewState, query_string_params);
          this.addUrlParameters(_.keys(viewState));
        }

        // Get the default current view state and merge it with whatever in the url, we could have loaded
        // the view state from storage.
        var defaultViewState = this.context.viewStateModel.get('default_state');
        if (defaultViewState) {
          var original = {};
          _.extend(original, viewState);
          _.extend(viewState, defaultViewState);
          _.extend(viewState, original);
        }

        // to make sure the change event gets triggered.
      } else {
        viewState = query_string || {};
      }

      viewStateModel && viewState &&
      JSON.stringify(viewState) !== JSON.stringify(viewStateModel.get('state')) &&
      viewStateModel.unset('state', {silent: true}) &&
      viewStateModel.setViewState('state', viewState, {silent: silent});
    },

    isViewStateModelSupported: function() {
      return false;
    },

    navigate: function (fragment, options) {

      var params = this.buildUrlParams(),
          originalFragment = fragment;

      if (params) {
        fragment += '?' + params;
      }

      if (this !== activeRouter) {
        this.activate(true);
      }

      this.trigger('before:route', this);

      // Preserve query (carries application settings) and hash parts (carries
      // inside-page location); perspective routers use path only
      // With the routing support you can use params with the fragment
      if (this._routeWithSlashes) {
        var excludeUrlParams = previousRouter ? previousRouter.getUrlParametersList() : [];
        excludeUrlParams = excludeUrlParams || [];
        var urlParamsNotInfragment = this.getUrlParamsNotInFragment(fragment);
        if (urlParamsNotInfragment) {
          excludeUrlParams = excludeUrlParams.concat(urlParamsNotInfragment);
        }
        fragment = Url.appendQuery(fragment, Url.mergeUrlParams(fragment, location.search, excludeUrlParams));
        fragment += location.hash;
      }

      var viewStateModel = this.context.viewStateModel,
          ViewStateConstants = viewStateModel.CONSTANTS;

      if (viewStateModel.get('replaceURL')) {
        viewStateModel.set('replaceURL', false);
        options = options || {};
        options.replace = true;
      }

      if (originalFragment !== viewStateModel.get(ViewStateConstants.CURRENT_ROUTER_FRAGMENT)) {
        viewStateModel.onNavigationStarted({
          'router': this.name,
          'back_to_title': this.getBackToTitle(),
          'fragment': originalFragment,
          'scopeId': this.applicationScope,
          'navigateOptions': options,
          'state': viewStateModel.get(ViewStateConstants.STATE),
          'sessionState': viewStateModel.get(ViewStateConstants.SESSION_STATE),
          'defaultState': viewStateModel.get(ViewStateConstants.DEFAULT_STATE)
        }, this.restoring);
      }

      // Widgets can set the initial url parameters for the routers by setting the initialUrlParams
      // i.e. viewStateModel.set('initialUrlParams', [{name: 'widgetName', value: 'D2Widget'}]);
      viewStateModel.set('initialUrlParams', undefined);

      var navigate = Backbone.Router.prototype.navigate.call(this, fragment, options);

      this.initSessionViewState();

      if (viewStateModel.get(ViewStateConstants.CURRENT_ROUTER) !== this.name) {
        viewStateModel.set(ViewStateConstants.CURRENT_ROUTER, this.name);
        viewStateModel.set(ViewStateConstants.BACK_TO_TITLE, this.getBackToTitle());
        this.initDefaultViewState();
      }

      // save the
      viewStateModel.set(ViewStateConstants.CURRENT_ROUTER_FRAGMENT, originalFragment);
      viewStateModel.set(ViewStateConstants.CURRENT_ROUTER_NAVIGATE_OPTIONS, options);
      this.applicationScope ?
        viewStateModel.set(ViewStateConstants.CURRENT_ROUTER_SCOPE_ID, this.applicationScope.get('id')) :
        viewStateModel.unset(ViewStateConstants.CURRENT_ROUTER_SCOPE_ID);

      this.restoring = false;

      this.trigger('after:route', this);

      return navigate;
    },

    getBackToTitle: function () {
      return document.title;
    }
  });

  return PerspectiveRouter;
});




// Route hash-based URLs to contextual object changes and the other way round
csui.define('csui/pages/start/multi.perspective.routing',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/utils/routing',
  // Load external routers working with perspective context
  'csui-ext!csui/pages/start/perspective.routing',
  'csui/models/navigation.history'
], function (module, _, Backbone, Url, routing, extraRouters, NavigationHistory) {
  'use strict';

  var config = _.extend({
    handlerUrlPathSuffix: '/app',
    rootUrlPath: null
  }, module.config());

  function MultiPerspectiveRouting(options) {

    var urlCanChange = options.urlCanChange ?? NavigationHistory.urlCanChange;
    this.options = _.extend({}, config, options, {history : urlCanChange === false && new NavigationHistory({detached: true})});

    // Later added routers override the earlier ones;
    // put the landing page router to the front
    var DefaultRouters = [];
    var Routers = _
            .chain(extraRouters)
            .flatten(true)
            .filter(function (Router) {
              if (Router.isDefault) {
                DefaultRouters.push(Router);
              } else {
                return true;
              }
            })
            .concat(DefaultRouters)
            .unique()
            .reverse()
            .value(),
        routeWithSlashes = routing.routesWithSlashes();
    this._routers = _.map(Routers, function (Router, index) {
      var router = new Router(_.extend({
        routeWithSlashes: routeWithSlashes
      }, this.options));
      if (!router.name) {
        router.name = index;
      }
      router.on('before:route', _.bind(this._informOthers, this));
      return router;
    }, this);

    this._context = this.options.context;
    this._context.viewStateModel.set('PerspectiveRouting', this);
    this._originalHistoryLength = history.length;
    this.started = false;
  }

  _.extend(MultiPerspectiveRouting.prototype, Backbone.Events, {
    start: function (options) {

      // Start the client application URL router
      var historyOptions;
      if (routing.routesWithSlashes()) {
        historyOptions = {
          pushState: true,
          // The application should configure root of their slash-based path.
          // Otherwise it will be inferred from the current location, which
          // will be handled as an OTCS CGI URL.
          root: this.options.rootUrlPath != null && this.options.rootUrlPath ||
                Url.combine(
                    new Url(new Url(location.pathname).getCgiScript()).getPath(),
                    this.options.handlerUrlPathSuffix)
        };
      } else {
        // The current location path is the default root. However, the
        // Backbone.history.atRoot() returns true, only if the root is
        // set explicitly.  Probably a Backbone bug.
		    var rootPath = Backbone.history.decodeFragment(location.pathname);
        historyOptions = {
          root: rootPath
        };
      }

      _.extend(historyOptions, options);

      this.options.history ? this.options.history.start(historyOptions) : Backbone.history.start(historyOptions);

      this.started = true;
      this._context && this._context.viewStateModel.set('history', true);
    },

    ensureStart: function (options) {
      if (!this.started) {
        this.start(options);
      }
    },

    hasRouted: function () {
      return history.length > this._originalHistoryLength;
    },

    addUrlParameters: function (name, urlParameters, replace) {
      var added = true;
      this._routers.some(function (router) {
        if (router.name === name) {
          if (router.addUrlParameters(urlParameters, replace)) {
            added = true;
          }
          return true;
        }
      });
      return true;
    },

    restoreRouter: function (lastRouterInfo) {
      this._routers.some(function (router) {
        if (router.name === lastRouterInfo.router) {
          router.restoring = true;
          router.restore(lastRouterInfo);
          return true;
        }
      });
    },

    getRouter: function (name) {
      var routerToFind;
      this._routers.some(function (router) {
        if (router.name === name) {
          routerToFind = router;
          return true;
        }
      });
      return routerToFind;
    },

    _informOthers: function (activeRouter) {
      _.each(this._routers, function (router) {
        if (router !== activeRouter) {
          router.trigger('other:route', router, activeRouter);
        }
      });
    }
  });

  MultiPerspectiveRouting.extend = Backbone.History.extend;

  return MultiPerspectiveRouting;
});


// Route hash-based URLs to contextual object changes and the other way round
csui.define('csui/pages/start/perspective.routing',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/utils/routing',
  'csui/pages/start/multi.perspective.routing',
  // Load external routers working with perspective context
  'csui-ext!csui/pages/start/perspective.routing'
], function (module, _, Backbone, Url, routing, MultiPerspectiveRouting, extraRouters) {
  'use strict';
  var instance;
  var config = _.extend({
    handlerUrlPathSuffix: '/app',
    rootUrlPath: null
  }, module.config());

  var PerspectiveRouting = MultiPerspectiveRouting.extend({
    constructor: function PerspectiveRouting(options) {
      options = _.extend({}, config, options);
      MultiPerspectiveRouting.prototype.constructor.call(this, options);
    }
  });

  PerspectiveRouting.routesWithSlashes = routing.routesWithSlashes;

  return {
    //The is made singleton as the "hasRouted()" functionality will be helpful for widgets
    //to verify whether to display back button or not (Eg:SearchResultsHeaderView)
    getInstance: function (options) {
      if (!instance) {
        // This is a protection for calling getInstance on a MultiPerspectiveRouting.
        // The instance is not set if the user creates a MultiPerspectiveRouting.
        if (options.context && options.context.viewStateModel) {
          var inst = options.context.viewStateModel.get('PerspectiveRouting');
          if (inst) {
            return inst;
          }
        }
        instance = new PerspectiveRouting(options);
      }
      return instance;
    },
    // TODO: Deprecate this method, use csui/utils/routing
    routesWithSlashes: routing.routesWithSlashes
  };

});


csui.define('csui/pages/start/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/pages/start/impl/nls/root/lang',{
  UserLoadingTitle: "Loading current user...",
  NodeLoadingTitle: "Loading {0}...",
  Home: 'Home',
  HomeIconAria: 'Home page',
  invalidObjectName: 'Unrecognized object name was detected in the web address.',
  mainNavigationAria: 'Main navigation',
  profileMenuTitle: 'Profile Menu',
  profileMenuAria: '{0} Profile Menu of {1}',
  profileImageAlt: 'Profile Menu of {0}',
  LblMoreDetails: 'More details',
  productLogoAria: 'opentext|{0}',
  skipLinkAria: 'Skip to content',
  pendoHeaderTitle: "Feedback",
  pendoDialogMessage: "Introducing new in-app guides and usage analysis features! Provided by OpenText, in-app guides offer helpful guidance, support, and tips for new features added to the software. We've also added usage analysis to gain insights into how users interact with OpenText Content Management. These reports will help us understand your habits, track progress, and optimize your experience based on real data. Note that no personal information is collected. Click the below link to disable in-app guides and usage analysis.",
  closeButtonLabel: "Close",
  checkBoxLabel: "Do not show this message again",
  clickMessage: "Settings",
  badgeLabel: "New",
});




csui.define('csui/pages/start/impl/landing.perspective.router',['csui/lib/underscore', 'csui/utils/base',
  'csui/pages/start/perspective.router',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/user', 'i18n!csui/pages/start/nls/lang',
  'i18n!csui/pages/start/impl/nls/lang'
], function (_, base, PerspectiveRouter, ApplicationScopeModelFactory,
    UserModelFactory, publicLang, lang) {
  'use strict';

  var LandingPerspectiveRouter = PerspectiveRouter.extend({
    routes: {
      '*other': 'openLandingPerspective'
    },

    name: 'Landing',

    constructor: function LandingPerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(this.applicationScope, 'change:id', this._updateHomeUrl);

      this.user = this.context.getModel(UserModelFactory);
      this.listenTo(this.user, 'change:id', this._updatePageTitle);
    },

    openLandingPerspective: function (/*viewState*/) {

      // we need to activate the new router so the old router does not keep listening
      // to the viewState object changes. Like resetting it for example.
      this.activate(true);

      this._updatePageTitle();
      this.applicationScope.set('id', '');
    },

    onViewStateChanged: function () {
      this._updateHomeUrl();
    },

    restore: function (viewState/*, sessionViewState*/) {
      this.openLandingPerspective(viewState);
    },

    _updateHomeUrl: function () {
      // Empty scope means landing page
      if (this.applicationScope.id) {
        return;
      }

      if (this !== this.getActiveRouter()) {
        this.activate(true);
      }

      this._updatePageTitle();
      this.navigate('');
    },

    _updatePageTitle: function () {
      if (!this.history.detached && this.applicationScope.id === "") {
        document.title = !this.user.has('name') ? lang.UserLoadingTitle :
                         _.str.sformat(publicLang.UserTitle, base.formatMemberName(this.user), publicLang.ProductName);
      }
    },

    getBackToTitle: function () {
      return publicLang.LandingPageBackTo;
    },

    isViewStateModelSupported: function() {
      return true;
    },

  }, {
    isDefault: true
  });

  return LandingPerspectiveRouter;
});


csui.define('csui/pages/start/impl/node.perspective.router',['module', 'csui/lib/jquery',
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/pages/start/perspective.router',
  'csui/utils/contexts/factories/next.node', 'csui/models/node/node.model',
  'i18n!csui/pages/start/nls/lang', 'i18n!csui/pages/start/impl/nls/lang'
], function (module, $, _, Backbone, PerspectiveRouter, NextNodeModelFactory, NodeModel, publicLang, lang) {
  'use strict';

  var NodePerspectiveRouter = PerspectiveRouter.extend({
    routes: {
      'nodes/:id': 'openNodePerspective',
      'nodes/:id(?*query_string)': 'openNodePerspective'
    },

    name: 'Node',

    constructor: function NodePerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);

      this.nextNode = this.context.getModel(NextNodeModelFactory);

      this.listenTo(this.nextNode, 'change:id', this._updateNodeUrl);
      this.listenTo(this.nextNode, 'just:changed:id', this._nextNodeIdHasJustChanged);
    },

    // This function gets called immediately after setting the id on the nextNode and
    // before any code react to setting the id on the nextNode and change the viewState
    _nextNodeIdHasJustChanged: function() {
      // _skipRouterActivation is set by this router when the user
      // uses the browser history button. In this case we are not going to reset
      // the viewState, we will just initialize the viewState from the url parameters.
      if (this._skipRouterActivation) {
        // The id used by this router is in the newId.
        this.newId = this.nextNode.get('id');
        this._skipRouterActivation = false;
        return;
      }
      if (this.newId) {
        this.lastNodeId = this.newId;
        this.activate(true);
      }
      // The newId has the current nextNode if. Next time we get called it will have the
      // last id that was used by the router.
      this.newId = this.nextNode.get('id');
    },

    openNodePerspective: function (id, query_string) {

      this.navigateFromUrl = true;

      if (NodeModel.usesIntegerId) {
        id = parseInt(id);
        // handle invalid nickname
        if (isNaN(id)) {
          this.nextNode.unset('id', {silent: true});
          return this.context.rejectPerspective(new Backbone.Model(),
            new Error(lang.invalidObjectName));
        }
      }

      var setId = id && id !== this.nextNode.get('id');

      // we need to activate the new router so the old router does not keep listening
      // to the viewState object changes. Like resetting it for example.
      this.activate(false);

      // if the id is changing we will make sure the viewStateModel does not trigger
      // changing the url until the id is updated.
      if (!this.restoring) {
        this.initViewStateFromUrlParams(query_string, setId);
      }

      var context = this.context,
          viewStateModel = context.viewStateModel;

      if (setId) {
        this._skipRouterActivation = true;
        this.nextNode.set('id', id);
      }

      // todo: remove this.
      setTimeout(function () {
        if (setId) {
          if (viewStateModel && viewStateModel.get('state') &&
              viewStateModel.get('state').filter) {
            viewStateModel.trigger('change:state');
          }
        }
      }, 1000);

    },

    onOtherRoute: function (/*thisRouter, activeRouter*/) {
      this.lastNodeId = this.newId = undefined;
      this.nextNode.clear({silent: true});
    },

    isViewStateModelSupported: function () {
      return true;
    },

    onViewStateChanged: function () {
      if (this.nextNode.get('id')) {
        this._updateNodeUrlImmediately();
      }
    },

    restore: function (routerInfo) {
      this.openNodePerspective(routerInfo.sessionState.id, routerInfo.state);
    },

    resetQueryStringParams: function() {
      var viewStateModel = this.context.viewStateModel,
          constants = viewStateModel.CONSTANTS;
      viewStateModel.unset(constants.QUERY_STRING_PARAMS);
    },

    waitForPerspectiveChange: function (callback) {
      this.listenToOnce(this.context, 'retain:perspective change:perspective error:perspective', callback);
    },

    _updateNodeUrl: function () {

      if (this !== this.getActiveRouter()) {
        this.activate(true);
      }

      var callback = function () {

        // Make sure we stop listening because if we receive one of those events, then the next time the router
        // is not active, this function will be called on the other events that has not been called before.
        this.stopListening(this.context, 'retain:perspective change:perspective error:perspective', callback);

        this._updateNodeUrlImmediately();
        this._updatePageTitle();

      }.bind(this);

      this.waitForPerspectiveChange(callback);

    },

    _updateNodeUrlImmediately:function() {

      if (this.navigateFromUrl) {
        this.navigateFromUrl = false;
      } else {
        this.resetQueryStringParams();
      }

      if (!this.nextNode.isFetchable()) {
        return;
      }

      var nextNode   = this.nextNode,
          nextNodeId = nextNode.get('id'),
          uri        = 'nodes/' + encodeURIComponent(nextNodeId);

      if (this !== this.getActiveRouter()) {
        this.activate(true);
      }

      this.navigate(uri);
    },

    initSessionViewState: function () {
      this._updateSessionState();
    },

    _updateSessionState: function () {
      // Update the session view state model with the node id we are navigating to.
      // Do this after the router has been activated.
      var nextNode       = this.nextNode,
          nextNodeId     = nextNode && nextNode.get('id'),
          viewStateModel = this.context && this.context.viewStateModel;

      var currentId = viewStateModel.getSessionViewState('id');
      if (currentId && currentId === nextNodeId) {
        // We already initialized the session view state. This call again is due to the viewStateChanged call possibly.
        return;
      }

      // The sessionViewState keeps variables like the selected nodes and maybe the scroll position in the future.
      // If we are restoring, we will keep this information otherwise we will just reset it and the widgets will load
      // without this initialization.
      if (viewStateModel && nextNodeId) {
        var newSessionState = {};
        // Restore the old session_state if we are restoring or the perspective node did not change
        if (this.restoring ||
            this.lastNodeId === undefined ||
            this.lastNodeId === this.nextNode.get('id')) {
          _.extend(newSessionState, viewStateModel.get(viewStateModel.CONSTANTS.SESSION_STATE));
        }
        _.extend(newSessionState, {id: nextNodeId});
        viewStateModel.unset(viewStateModel.CONSTANTS.SESSION_STATE, {silent: true});
        viewStateModel.set(viewStateModel.CONSTANTS.SESSION_STATE, newSessionState);
      }
    },

    _updatePageTitle: function () {
      if (!this.history.detached) {
        document.title = _.str.sformat(publicLang.NodeTitle, this.nextNode.get('name'), this.nextNode.get('type_name'), publicLang.ProductName);
      }
      this._updateBackToTitle();
    },

    _updateBackToTitle: function() {
      var viewStateModel = this.context && this.context.viewStateModel;
      viewStateModel && viewStateModel.set(viewStateModel.CONSTANTS.BACK_TO_TITLE, this.nextNode.get('name'));
    }

  });

  return NodePerspectiveRouter;
});


csui.define('csui/models/server.adaptors/objecttypes.mixin',['csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {

      return _.extend(prototype, {
        makeServerAdaptor: function () {
          return this;
        },

        url: function () {
          return Url.combine(this.options.connector.getConnectionUrl().getApiBase('v2'),'members/objecttypes');
        },

        parse: function (response) {
          var returnData = {
            objecttypes: response.results.data && response.results.data.objects
          };
          return returnData;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});


csui.define('csui/models/objecttypesmodel',['csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/server.adaptors/objecttypes.mixin'
], function (_, Backbone, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";

  var ObjectTypesModel = Backbone.Model.extend({

    constructor: function ObjectTypesModel(models, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, models, options);
      this.makeConnectable(options)
        .makeFetchable(options)
        .makeServerAdaptor(options);
    }
  });

  ConnectableMixin.mixin(ObjectTypesModel.prototype);
  FetchableMixin.mixin(ObjectTypesModel.prototype);
  ServerAdaptorMixin.mixin(ObjectTypesModel.prototype);

  _.extend(ObjectTypesModel.prototype, {

    isFetchable: function () {
      return !this.get('objecttypes');
    }

  });

  return ObjectTypesModel;

});

csui.define('csui/utils/contexts/factories/objecttypes.factory',[
  'csui/lib/underscore',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/connector',
  'csui/models/objecttypesmodel'
], function (_, CollectionFactory, ConnectorFactory, ObjectTypesModel) {
  'use strict';

  var ObjectTypesFactory = CollectionFactory.extend({
    propertyPrefix: 'objecttypes',

    constructor: function ObjectTypesFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var objectTypes = this.options.objectTypes || {},
       connector = context.getObject(ConnectorFactory, options);
      objectTypes = new ObjectTypesModel(objectTypes.attributes,
        _.defaults({
          connector: connector
        }, objectTypes.options, {
          autofetch: true,
        }));
      this.property = objectTypes;
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }
  });

  return ObjectTypesFactory;
});


csui.define('csui/pages/start/impl/search.perspective.router',[
  'module', 'csui/lib/underscore', 'csui/pages/start/perspective.router',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/search.formquery.factory',
  'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/objecttypes.factory',
  'i18n!csui/pages/start/nls/lang', 'i18n!csui/pages/start/impl/nls/lang'
], function (module, _, PerspectiveRouter, SearchQueryModelFactory,
  SearchFormQueryModelFactory, UserModelFactory, ObjectTypesFactory, publicLang, lang) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    // TODO: Remove this parameters. Private modules must not have public
    // configuration. Introduce a public localization string, if you need
    // to override the page title.
    showTitle: true,
    enableObjectTypes:false
  });

  var SearchPerspectiveRouter = PerspectiveRouter.extend({
    routes: {
      'search/*path': 'openSearchPerspective',
      'search/*path(?*query_string)': 'openSearchPerspective'
    },

    name: 'Search',

    constructor: function SearchPerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);

      this.searchQuery = this.context.getModel(SearchQueryModelFactory);
      this.listenTo(this.searchQuery, 'change', this._updateSearchUrl);
      this.searchForm = this.context.getModel(SearchFormQueryModelFactory);
      this.listenTo(this.searchForm, 'change', this._updateSearchFormUrl);
      if(config.enableObjectTypes){
        this.objectTypesModel = this.context.getModel(ObjectTypesFactory, {
          permanent: true
        });
        this.objectTypesModel.ensureFetched();
      }
    },

    openSearchPerspective: function (path, query_string) {
      // convert the path made of 'name/value' pairs to {name; value} map
      var name,
          parameters = _.reduce(path.split('/'), function (result, item) {
            if (name) {
              result[name] = item != null ? decodeURIComponent(item).trim() : '';
              name = undefined;
            } else {
              name = decodeURIComponent(item);
            }
            return result;
          }, {});

      // we need to activate the new router so the old router does not keep listening
      // to the viewState object changes. Like resetting it for example.
      this.activate(false);

      if (!this.restoring) {
        this.initViewStateFromUrlParams(query_string, true);
      }

      this._updateSearchQueryPageTitle();
      this._updateSearchFormQueryPageTitle();

      var user = this.context.getModel(UserModelFactory);
      user.ensureFetched().then(_.bind(function () {
        // if context is coming from CVS then do 'silent:true' otherwise keep it false , to avoid
        // double call to _fetchSearchPerspective().
        this.searchQuery.set(parameters, {silent: !!this.searchQuery.get('query_id')});
        if (this.searchForm.get('query_id')) {
          this.searchForm.set(parameters, {silent: !!this.searchForm.get('query_id')});
        }
      }, this));

    },

    onOtherRoute: function () {
      this.searchQuery.clear({silent: true});
      this.searchForm.clear({silent: true});
    },

    routerURL: function (searchQuery) {
      var url = _.reduce(searchQuery.attributes, function (result, value, name) {
        if (value) {
          result += '/' + encodeURIComponent(name) + '/' + encodeURIComponent(value);
        } else {
          result += '/' + encodeURIComponent(name) + '/' + '%20';
        }
        return result;
      }, 'search');
      return url;
    },

    _updateSearchUrl: function () {
      if (this !== this.getActiveRouter()) {
        this.activate(true);
      }
      // format the path using the {name; value} map to 'name/value' pairs
      var url;
      if (this.restoring) {
        // The url sometimes gets constructed by routerURL function different than
        // the history and that is based on how the attributes in the search query
        // are organized. The new url needs to be exactly the same so that the
        // navigation to work correctly.
        url = this._getRestoringRouterInfo().fragment;
      } else {
        url = this.routerURL(this.searchQuery);
      }
      this._updateSearchQueryPageTitle();
      this.navigate(url);
    },

    _updateSearchQueryPageTitle: function () {
      if (config.showTitle && !this.history.detached) {
        document.title = _.str.sformat(publicLang.SearchTitle, this.searchQuery.get('where'), publicLang.ProductName);
      }
    },

    isViewStateModelSupported: function () {
      return true;
    },

    onViewStateChanged: function () {
      this.viewStateChanged = true;
      this._updateSearchUrl();
      this.viewStateChanged = false;
    },

    _updateSearchFormUrl: function () {
      if (this !== this.getActiveRouter()) {
        this.activate(true);
      }
      // format the path using the {name; value} map to 'name/value' pairs
      var url = this.routerURL(this.searchForm);
      this._updateSearchQueryPageTitle();
      this.navigate(url);
    },

    _updateSearchFormQueryPageTitle: function () {
      if (config.showTitle) {
        document.title = _.str.sformat(publicLang.SearchTitle, this.searchForm.get('where'), publicLang.ProductName);
      }
    },

    initSessionViewState: function () {
      var viewStateModel = this.context && this.context.viewStateModel,
          lastRouter = viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.LAST_ROUTER);
      if (!this.restoring && !this.viewStateChanged &&
          (viewStateModel && viewStateModel.get('navigated') && lastRouter !== undefined && lastRouter !== this.name)) {
        viewStateModel && viewStateModel.set(viewStateModel.CONSTANTS.SESSION_STATE, {});
      }
    },

    // TODO: Remove this. URLs have to be properly encoded and decoded.
    // Overriding this to pass the encoded url fragment to the 'openSearchPerspective' .
    // This is to ensure correct functionality even in the case of the search value containing '/' symbols.
    _extractParameters: function (route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function (param, i) {
        return param ? param : null;
      });
    },

    getBackToTitle:function() {
      return publicLang.SearchBackTo;
    }
  });

  return SearchPerspectiveRouter;
});


csui.define('csui/pages/start/impl/metadata.perspective.router',['module',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/pages/start/perspective.router',
  'csui/utils/contexts/factories/metadata.factory',
  'csui/models/node/node.model',
  'i18n!csui/pages/start/nls/lang',
  'i18n!csui/pages/start/impl/nls/lang'
], function (module, $, _, Backbone, PerspectiveRouter, MetadataFactory, NodeModel, publicLang, lang) {
  'use strict';

  var MetadataPerspectiveRouter = PerspectiveRouter.extend({

    routes: {
      'nodes/:node_id/metadata': 'openMetadata',
      'nodes/:node_id/metadata(?*query_string)': 'openMetadata',
      'nodes/:node_id/metadata/navigator': 'openMetadataNavigator',
      'nodes/:node_id/metadata/navigator(?*query_string)': 'openMetadataNavigator',
      'nodes/:node_id/permissions': 'openPermissions',
      'nodes/:node_id/permissions(?*query_string)': 'openPermissions',
      'nodes/:node_id/permissions/navigator': 'openPermissionsNavigator',
      'nodes/:node_id/permissions/navigator(?*query_string)': 'openPermissionsNavigator'
    },

    name: "Metadata",

    constructor: function MetadataPerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);

      this.metadataModel = this.context.getModel(MetadataFactory);

      this.listenTo(this.metadataModel, 'change:metadata_info', this._updateUrl);
      this.listenTo(this.metadataModel, 'change:metadata_info', this._updatePageTitle);
    },

    openPermissions: function (id, query_string) {
      this._updateMetadataInfo({showPermissionView:true}, true);
      this._open(id, query_string, false);
    },

    openPermissionsNavigator: function (id, query_string) {
      this._updateMetadataInfo({showPermissionView:true}, true);
      this._open(id, query_string, true);
    },

    openMetadata: function (id, query_string) {
      this._updateMetadataInfo({showPermissionView:false}, true);
      this._open(id, query_string, false);
    },

    openMetadataNavigator: function (id, query_string) {
      this._updateMetadataInfo({showPermissionView:false}, true);
      this._open(id, query_string, true);
    },

    isViewStateModelSupported: function() {
      return true;
    },

    getInitialViewState: function () {
      var metadata_info = this.metadataModel && this.metadataModel.get('metadata_info');
      if (metadata_info && metadata_info.selectedTab) {
        var selectedTab = metadata_info.selectedTab;
        if (_.isString(selectedTab)) {
          return {dropdown: selectedTab};
        } else if (selectedTab instanceof Backbone.Model) {
          var name = selectedTab.get('name'), title = selectedTab.get('title');
          return {dropdown: name || title};
        }
      }
      return {};
    },

    _updateMetadataInfo: function (newMetadataInfo, silent) {
      var metadata_info = this.metadataModel.get('metadata_info') || {};
      var newMergedMetadataInfo = {};

      _.extend(newMergedMetadataInfo, metadata_info);
      _.extend(newMergedMetadataInfo, newMetadataInfo);

      if (!silent) {
        this.metadataModel.unset('metadata_info', newMergedMetadataInfo, {silent: true});
      }
      this.metadataModel.set('metadata_info', newMergedMetadataInfo, {silent: silent});
    },

    _open: function (id, query_string, navigator) {

      if (NodeModel.usesIntegerId) {
        id = parseInt(id);
      }

      var metadata_info = this.metadataModel.get('metadata_info');

      var setId = !metadata_info || (id && id !== metadata_info.id);

      // we need to activate the new router so the old router does not keep listening
      // to the viewState object changes. Like resetting it for example.
      if (this !== this.getActiveRouter()) {
        this.activate(false);
      }

      // if the id is changing we will make sure the viewStateModel does not trigger
      // changing the url until the id is updated.
      if (!this.restoring) {
        this.initViewStateFromUrlParams(query_string, setId);
      }

      this._updateMetadataInfo({id: id, navigator: navigator}, false);
    },

    onOtherRoute: function () {
      this.metadataModel.clear({silent: true});
      var viewStateModel = this.context.viewStateModel;
      // Do not remove METADATA_CONTAINER because some other perspectives depend on this
      // to show the back button title.
      //viewStateModel.unset(viewStateModel.CONSTANTS.METADATA_CONTAINER);
      viewStateModel.unset('displayBreadcrumbUpToParentOnly');
    },

    onViewStateChanged:function() {
      var metadata_info = this.metadataModel.get('metadata_info');
      if (metadata_info && metadata_info.id) {
        this._updateUrl();
      }

      var dropdownTitle = this.context.viewStateModel.getViewState("dropdown");
      if (metadata_info && metadata_info.model && dropdownTitle) {
        this._updatePageTitle();
      }
    },

    _updateUrl: function () {

      if (this !== this.getActiveRouter()) {
        this.activate(true);
      }

      var metadata_info = this.metadataModel.get('metadata_info');
      if (!metadata_info) {
        return;
      }

      if (!this.restoring && this.lastMetadataInfo && this.lastMetadataInfo.collection &&
          this.lastMetadataInfo.collection !== metadata_info.collection &&
          this.context.viewStateModel.get('saved_viewstate') === undefined) {
        this._saveViewStates();
        this._initializeViewState();
      }

      this.lastMetadataInfo = metadata_info;

      var id = metadata_info.id,
          uri      = 'nodes/' + encodeURIComponent(id) + (metadata_info.showPermissionView ? '/permissions' : '/metadata');

      if (metadata_info.navigator) {
        uri += '/navigator';
        this.context.viewStateModel.set('displayBreadcrumbUpToParentOnly', true);
      }
      this.navigate(uri);
    },

    _updatePageTitle: function () {
      if (this.history.detached) {
        return;
      }
      var metadata_info = this.metadataModel.get('metadata_info');
      if (!metadata_info) {
        return;
      }
      if (metadata_info.model) {
        var modelTitle;

        if (this.context.viewStateModel) {
          modelTitle = this.getBackToTitle();
        }

        const model = metadata_info.model;
        const modelName = model.get('name');
        const modelId = model.get('id');
        const parentName = model.parent?.get('name');
        const productName = publicLang.ProductName;
        
        let formattedTitle;
        
        if (!modelName || !modelTitle) {
          formattedTitle = _.str.sformat(lang.NodeLoadingTitle, modelId);
        } else {
          formattedTitle = parentName
            ? `${parentName}/${modelName}, ${modelTitle} - ${productName}`
            : `${modelName}, ${modelTitle} - ${productName}`;
        }
        
        document.title = formattedTitle;
      }

    },

    getBackToTitle: function () {
      var metadata_info = this.metadataModel.get('metadata_info');
      if (metadata_info.showPermissionView) {
        return publicLang.PermissionsBackTo;
      } else {
        return publicLang.MetadataBackTo;
      }
    }
  });

  return MetadataPerspectiveRouter;

});


csui.define('csui/pages/start/impl/root.perspective.router',['csui/lib/underscore',
  'csui/pages/start/perspective.router',
  'i18n!csui/pages/start/nls/lang',
  'csui/utils/contexts/factories/next.node'

], function (_, PerspectiveRouter, publicLang, NextNodeModelFactory) {
  'use strict';

  var applicationScopes = {
    myassignments: _.str.sformat(publicLang.MyAssignmentsTitle, publicLang.ProductName),
    recentlyaccessed: _.str.sformat(publicLang.RecentlyAccessedTitle, publicLang.ProductName),
    favorites: _.str.sformat(publicLang.FavoritesTitle, publicLang.ProductName),
    searchresults: _.str.sformat(publicLang.SearchResultsTitle, publicLang.ProductName),
    myreserveditems:_.str.sformat(publicLang.ReservedItemsTitle, publicLang.ProductName),
    recycleitems:_.str.sformat(publicLang.RecycleTitle, publicLang.ProductName)
  };

  var applicationScopesBackToTitle = {
    myassignments: publicLang.MyAssignmentsBackTo,
    recentlyaccessed: publicLang.RecentlyAccessedBackTo,
    favorites: publicLang.FavoritesBackTo,
    searchresults: publicLang.SearchResultsBackTo,
    myreserveditems: publicLang.ReservedItemsBackTo,
    recycleitems: publicLang.RecycleBackTo
  };

  var RootPerspectiveRouter = PerspectiveRouter.extend({

    name: 'Root',

    routes: {
      'myassignments': 'openMyAssignmentsPerspective',
      'myassignments(?*query_string)': 'openMyAssignmentsPerspective',
      'recentlyaccessed': 'openRecentlyAccessedPerspective',
      'recentlyaccessed(?*query_string)': 'openRecentlyAccessedPerspective',
      'favorites': 'openFavoritesPerspective',
      'favorites(?*query_string)': 'openFavoritesPerspective',
      'searchresults/:id': 'openSearchResultsPerspective',
      'searchresults/:id(?*query_string)': 'openSearchResultsPerspective',
      'myreserveditems': 'openReservedItemsPerspective',
      'myreserveditems(?*query_string)': 'openReservedItemsPerspective',
      'recycleitems': 'openRecycleItemsPerspective',
      'recycleitems(?*query_string)': 'openRecycleItemsPerspective'
    },

    constructor: function RootPerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);

      this.listenTo(this.applicationScope, 'change:id', this._updateUrl);
    },

    openRecentlyAccessedPerspective: function(query_string) {
      this.openApplicationScope('recentlyaccessed', query_string);
    },

    openMyAssignmentsPerspective: function(query_string) {
      this.openApplicationScope('myassignments', query_string);
    },

    openFavoritesPerspective: function(query_string) {
      this.openApplicationScope('favorites', query_string);
    },

    openSearchResultsPerspective: function(id, query_string) {
      id = parseInt(id);
      // if the id is changing we will make sure the viewStateModel does not trigger
      // changing the url until the id is updated.

      // we need to activate the new router so the old router does not keep listening
      // to the viewState object changes. Like resetting it for example.
      this.activate(false);

      if (!this.restoring) {
        this.initViewStateFromUrlParams(query_string, id);
      }
      this._updatePageTitle();
      this.applicationScope.set('query_id', id);
      this.applicationScope.set('id', "searchresults");
    },

    openReservedItemsPerspective: function(query_string) {
      this.openApplicationScope('myreserveditems', query_string);
    },

    openRecycleItemsPerspective: function(query_string){
      this.openApplicationScope('recycleitems', query_string);
    },

    openApplicationScope: function (scope, query_string) {
      this.activate(false);
      this.initViewStateFromUrlParams(query_string);
      this._updatePageTitle();
      this.applicationScope.set('id', scope);
    },

    isViewStateModelSupported: function () {
      return true;
    },

    initSessionViewState: function () {
      this._updateSessionState();
    },

    _updateSessionState: function () {
      var viewStateModel = this.context && this.context.viewStateModel;

      // The sessionViewState keeps variables like the selected nodes and maybe the scroll position in the future.
      // If we are restoring, we will keep this information otherwise we will just reset it and the widgets will load
      // without this initialization.
      if (viewStateModel) {
        var newSessionState = {};
        _.extend(newSessionState, viewStateModel.get(viewStateModel.CONSTANTS.SESSION_STATE));
        viewStateModel.unset(viewStateModel.CONSTANTS.SESSION_STATE, {silent: true});
        viewStateModel.set(viewStateModel.CONSTANTS.SESSION_STATE, newSessionState);
      }
    },

    onViewStateChanged: function () {
      this._updateUrl();
    },

    restore: function (routerInfo) {
      this.applicationScope.set('id', routerInfo.scopeId);
    },

    _updateUrl: function () {

      // Skip scopes handled by other routers
      var scope = this.applicationScope.id;

      // if (scope !== 'tasks' && scope !== 'recent' && scope !== 'favorites' && scope !== 'search')
      if (applicationScopes[scope]){

        if (this !== this.getActiveRouter()) {
          this.activate(true);
        }

        //Generic Tile widget 
        var query_id = this.applicationScope.get('query_id');
        if (query_id) {
          scope += '/' + query_id;
        }
        this._updatePageTitle();
        this.navigate(scope);
      }
    },

    _updatePageTitle: function () {
      if (!this.history.detached) {
        document.title = applicationScopes[this.applicationScope.id];
      }
    },

    getBackToTitle:function() {
      return applicationScopesBackToTitle[this.applicationScope.id];
    }
  });

  return RootPerspectiveRouter;

});


csui.define('csui/utils/contexts/factories/next.version',[
    'module', 'csui/lib/underscore', 'csui/lib/backbone',
    'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
    'csui/models/version', 'csui/utils/commands/versions'
  ], function (module, _, Backbone, ModelFactory, ConnectorFactory, VersionModel, VersionCommands) {
    'use strict';

    var NextVersionModelFactory = ModelFactory.extend({

      propertyPrefix: 'nextVersion',

      constructor: function NextVersionModelFactory(context, options) {
        ModelFactory.prototype.constructor.call(this, context, options);

        var nextVersion = this.options.nextVersion || {};
        if (!(nextVersion instanceof VersionModel)) {
          var connector = context.getObject(ConnectorFactory, options),
              config = module.config();
          nextVersion = new VersionModel(undefined, _.extend({
             connector: connector,
             commands: VersionCommands.getAllSignatures()
            }, nextVersion.options, config.options));
        }
        this.property = nextVersion;
      },

      isFetchable: function () {
        return this.property.isFetchable();
      },

      fetch: function (options) {
        return this.property.fetch(options);
      }
    });

    return NextVersionModelFactory;
  });


csui.define('csui/pages/start/impl/version.perspective.router',[
  'csui/lib/underscore', 'csui/pages/start/perspective.router',
  'csui/utils/contexts/factories/next.version',
  'csui/models/node/node.model', 'i18n!csui/pages/start/nls/lang',
  'csui/lib/underscore.string',
], function (_, PerspectiveRouter, NextVersionModelFactory, NodeModel, publicLang) {
  'use strict';

  var VersionPerspectiveRouter = PerspectiveRouter.extend({
    routes: {
      'nodes/:node_id/versions/:version_number': 'openVersionPerspective'
    },

    name: 'Vesion',

    constructor: function VersionPerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.call(this, options);

      this.nextVersion = this.context.getModel(NextVersionModelFactory);
      this.listenTo(this.nextVersion, 'change:id change:version_number', this._updateVersionUrl);
      this.listenTo(this.nextVersion, 'change:name change:version_number_name', this._updateVersionPageTitle);
    },

    openVersionPerspective: function (nodeId, versionNumber) {

      if (NodeModel.usesIntegerId) {
        nodeId = parseInt(nodeId);
      }
      versionNumber = parseInt(versionNumber);

      this.nextVersion.set({ id: nodeId, version_number: versionNumber });
    },

    _updateVersionUrl: function () {
      this.navigate('nodes/' + this.nextVersion.get('id') + '/versions/' + this.nextVersion.get('version_number'));
    },

    _updateVersionPageTitle: function () {
      if (!this.history.detached) {
        document.title = _.str.sformat(publicLang.VersionTitle, this.nextVersion.get('name'), this.nextVersion.get('version_number_name'), publicLang.ProductName);
      }
    }
  });

  return VersionPerspectiveRouter;
});


csui.define('csui/utils/classic.nodes/impl/core.classic.nodes',[],function () {
  'use strict';

  return [
    // Discussion
    {
      equals: {type: 215},
      forced: true,
      urlQuery: function (node) {
        return {
          func: 'll',
          objAction: 'view',
          objId: node.get('id'),
          nexturl: location.href
        };
      }
    },
    // Discussion Topic or Reply
    {
      equals: {type: [130, 134]},
      forced: true,
      urlQuery: function (node) {
        return {
          func: 'll',
          objAction: 'view',
          objId: node.get('id'),
          show: 1,
          nexturl: location.href
        };
      }
    },
    // Task
    {
      equals: {type: 206},
      forced: true,
      urlQuery: function (node) {
        return {
          func: 'll',
          objAction: 'BrowseTask',
          objId: node.get('id'),
          nexturl: location.href
        };
      }
    },
    // Task List
    {
      equals: {type: 204},
      forced: true,
      urlQuery: function (node) {
        return {
          func: 'll',
          objAction: 'BrowseTaskList',
          objId: node.get('id'),
          nexturl: location.href
        };
      }
    },
    // Task Group
    {
      equals: {type: 205},
      forced: true,
      urlQuery: function (node) {
        return {
          func: 'll',
          objAction: 'BrowseTaskGroup',
          objId: node.get('id'),
          nexturl: location.href
        };
      }
    },
    // Milestone
    {
      equals: {type: 212},
      forced: true,
      urlQuery: function (node) {
        return {
          func: 'll',
          objAction: 'BrowseMilestone',
          objId: node.get('id'),
          nexturl: location.href
        };
      }
    },
    // Channel
    {
      equals: {type: 207},
      forced: true,
      urlQuery: function (node) {
        return {
          func: 'll',
          objAction: 'ViewChannel',
          objId: node.get('id'),
          nexturl: location.href
        };
      }
    },
    // News
    {
      equals: {type: 208},
      forced: true,
      urlQuery: function (node) {
        return {
          func: 'll',
          objAction: 'ViewNews',
          objId: node.get('id'),
          nexturl: location.href
        };
      }
    },
    // Poll
    {
      equals: {type: 218},
      forced: true,
      urlQuery: function (node) {
        return {
          func: 'll',
          objAction: 'OpenPoll',
          objId: node.get('id'),
          nexturl: location.href
        };
      }
    },
    // LiveReport
    {
      equals: {type: 299},
      forced: true,
      urlQuery: function (node) {
        return {
          func: 'll',
          objAction: 'RunReport',
          objId: node.get('id'),
          nexturl: location.href
        };
      }
    },
    // Prospector
    {
      equals: {type: 384},
      forced: true,
      urlQuery: function (node) {
        return {
          func: 'll',
          objAction: 'ProspectorBrowse',
          objId: node.get('id'),
          order: '-SCORE',
          summaries: 1,
          nexturl: location.href
        };
      }
    },
    // follow up
    {
      equals: {type: 31214},
      forced: true,
      urlQuery: function (node) {
        return {
          func: 'll',
          objAction: 'addresubmission',
          RS_FUNCTION: 'Edit',
          RSID: node.get('followup_id'),
          objId: node.get('location_id'),
          nexturl: location.href
        };
      }
    }
  ];
});


csui.define('csui/utils/content.helper',[
  'csui/lib/underscore', 'csui/utils/url', 'csui/models/version'
], function (_, Url, VersionModel) {
  'use strict';

  function getContentPageUrl (node, options) {
    options || (options = {});
    var cgiUrl = new Url(node.connector.connection.url).getCgiScript();
    var urlQuery = {
      func: 'doc.fetchcsui',
      nodeid: node.get('id')
    };
    if (options.download) {
      urlQuery = _.extend(urlQuery, { action: 'download' });
    }
    if (node instanceof VersionModel || node.get('version_number')) {
      urlQuery.vernum = node.get('version_number');
    }
    return Url.appendQuery(cgiUrl, Url.combineQueryString(urlQuery));
  }

  return {
    getContentPageUrl: getContentPageUrl
  };
});


csui.define('csui/utils/handlebars/l10n',['csui/lib/handlebars', 'csui/utils/base'
], function (Handlebars, base) {

  Handlebars.registerHelper('csui-l10n', function (value) {
    return base.getClosestLocalizedString(value);
  });
  Handlebars.registerHelper("with", function(context, options) {
    return options.fn(context);
  });

  return Handlebars.helpers['csui-l10n', 'with'];

});


csui.define('csui/utils/impl/core.defaultactionitems',[
  'csui/utils/classic.nodes/classic.nodes',
  'csui/utils/smart.nodes/smart.nodes'
], function (classicNodes, smartNodes) {
  'use strict';

  return [
    // Document
    // TODO: Move E-mail to its module
    {
      equals: {type: [144, 736, 801]},
      signature: 'OpenDocument',
      sequence: 10
    },
    // Generation
    {
      equals: { type: [2] },
      signature: 'Open',
      sequence: 10
    },
    // URL
    {
      type: 140,
      signature: 'Navigate',
      sequence: 30
    },
    // Saved Search Query
    {
      type: 258,
      signature: 'ExecuteSavedQuery',
      sequence: 30
    },

    // Search Form
    {
      type: 292,
      signature: 'ExecuteSearchForm',
      sequence: 30
    },
    // Nodes forced to be opened in Classic UI
    {
      signature: 'OpenSpecificClassicPage',
      sequence: 600,
      decides: function (node) {
        return classicNodes.isForced(node);
      }
    },
    // Containers (supported in Smart UI, but need a permission check)
    // THis fallback rule comes after the "OpenSpecificClassicPage" command,
    // because some containers may want to get redirected to Classic UI.
    {
      equals: {container: true},
      signature: 'Browse',
      sequence: 700
    },
    // Nodes, which should have just their perspective open in Smart UI
    {
      signature: 'OpenSpecificNodePerspective',
      sequence: 800,
      decides: function (node) {
        return smartNodes.isSupported(node);
      }
    }
  ];
});


csui.define('csui/utils/non-attaching.region/non-attaching.region',['csui/lib/marionette'], function (Marionette) {
  'use strict';

  var NonAttachingRegion = Marionette.Region.extend({

    constructor: function NonAttachingRegion(options) {
      Marionette.Region.prototype.constructor.apply(this, arguments);
    },

    attachHtml: function (view) {}

  });

  return NonAttachingRegion;

});


csui.define('csui/utils/script-executing.region/script-executing.region',['csui/lib/marionette'], function (Marionette) {
  'use strict';

  var ScriptExecutingRegion = Marionette.Region.extend({

    constructor: function ScriptExecutingRegion(options) {
      Marionette.Region.prototype.constructor.apply(this, arguments);
    },

    attachHtml: function(view) {
      this.$el
          .html('')
          .append(view.el);
    }

  });

  return ScriptExecutingRegion;

});


csui.define('csui/utils/node.links/impl/core.node.links',[
  'csui/utils/url',
  'csui/models/version'
], function (Url, VersionModel) {
  'use strict';

  return [
    {
      equals: {
        type: 140
      },
      getUrl: function (node) {
        return node.get('url');
      }
    },
    {
      equals: {
        type: 258
      },
      getUrl: function (node) {
        return Url.combine('search/query_id/', node.get('id'));
      }
    },
    {
      sequence: 1000,
      getUrl: function (node) {
        return Url.combine('nodes/', node.get('id'));
      }
    },
    {
      equals: {
        type: 144
      },
      getUrl: function (node) {
        var url = Url.combine('nodes/', node.get('id'));
        if(node instanceof VersionModel) {
          var versionNumber = node.get('version_number');
          url = Url.combine(url, 'versions/' + versionNumber);
        }
        return url;
      }
    },
    {
      equals: {
        type: 292
      },
      getUrl: function (node) {
        return Url.combine('searchtemplates/', node.get('id'));
      }
    },
  ];
});


csui.define('csui/utils/open.authenticated.page',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/utils/connector', 'csui/utils/url', 'csui/utils/log'
], function (module, _, $, Connector, Url, log) {
  'use strict';

  var config = _.extend({
    openInNewTab: undefined, // defaults to true in the code
    apiUrl: '/xecmauth', // will be prefixed by the CGI URL
    useFormPost: false      
  }, module.config());

  log = log(module.id);

  function openAuthenticatedPage1 (connection, url, options) {
    // New windows cannot cannot be opened from background tasks.
    var contentWindow = openContentWindow();
    var connectionUrl;

    // Connection parameter may be a connector or a just a connection,
    // if the connector has not been authenticated yet.
    var authenticated = $.Deferred();
    if (connection instanceof Connector) {
      connectionUrl = connection.getConnectionUrl();
      authenticateWithConnector();
    } else {
      connectionUrl = new Url(connection.url);
      authenticateWithoutConnector();
    }

    return authenticated.then(function () {
      contentWindow.location = completeTargetUrl();
    }, function (error) {
      // Close the window if it was opened here.
      if (contentWindow !== window && contentWindow !== options.window) {
        contentWindow.close();
      }
      throw error;
    });

    function openContentWindow() {
      options || (options = {});
      var openInNewTab = options.openInNewTab !== undefined ?
        options.openInNewTab : config.openInNewTab;
      var content = options.window || (openInNewTab === false ?
            window : window.open('', '_blank'));
      // Calling window.open("") returns null in the SAP Fiori Client.
      return content && content.location ? content : parent.window;
    }

    function completeTargetUrl() {
      if (!(url.indexOf('http:') === 0 || url.indexOf('https:') === 0)) {
        if (url.indexOf('?') === 0) {
          url = connectionUrl.getCgiScript() + url;
        } else {
          url = connectionUrl.getOrigin() + url;
        }
      }
      return url;
    }

    function getAuthenticationURL() {
      var apiUrl = options.apiUrl !== undefined && options.apiUrl || config.apiUrl;
      return connectionUrl.getCgiScript() + apiUrl;
    }

    function authenticateWithConnector() {
      connection
        .makeAjaxCall({
          url: getAuthenticationURL(),
          xhrFields: { withCredentials: true }
        }).then(authenticated.resolve, authenticated.reject);
    }

    function authenticateWithoutConnector() {
      var authenticationUrl = getAuthenticationURL();
      var request = new XMLHttpRequest();
      request.onreadystatechange = function () {
        if (request.readyState === 4) {
          if (request.status === 200) {
            authenticated.resolve();
          } else {
            log.warn('GET request to {0} failed:', authenticationUrl) && console.warn(log.last);
            authenticated.reject(new Error(request.status + ' ' + request.statusText));
          }
        }
      };
      request.open('GET', authenticationUrl, true);
      request.setRequestHeader('OTCSTicket', connection.session.ticket);
      request.withCredentials = true;
      request.send(null);
    }
  }

  function openAuthenticatedPage2 (connection, url, options) {
    // connection parameter may be a connector
    if (connection.connection) {
      connection = connection.connection;
    }
    var cgiUrl = new Url(connection.url).getCgiScript();
    var ticket = connection.session.ticket;

    var contentDocument = createWindowDocument();
    var form = createForm();
    createField('func', 'csui.authenticate');
    createField('otcsticket', ticket);
    createField('nexturl', url);
    form.submit();

    return $.Deferred().resolve().promise();

    function createWindowDocument() {
      options || (options = {});
      var content = options.window || (options.openInNewTab === false ?
            window : window.open('', '_blank'));
      // Calling window.open("") returns null in the SAP Fiori Client.
      if (!content || !content.location) {
        content = parent.window;
      }
      return content.document;
    }

    function createForm() {
      var form = contentDocument.createElement('form');
      form.setAttribute('method', 'post');
      form.setAttribute('action', cgiUrl);
      contentDocument.body.appendChild(form);
      return form;
    }

    function createField(name, value) {
      var field = contentDocument.createElement('input');
      field.setAttribute('name', name);
      field.setAttribute('value', value);
      field.setAttribute('type', 'hidden');
      form.appendChild(field);
    }
  }

  return config.useFormPost ? openAuthenticatedPage1 : openAuthenticatedPage2;
});


csui.define('csui/utils/smart.nodes/impl/core.smart.nodes',[],function () {
  'use strict';

  return [
    // Document and Generation
    // TODO: Move E-mail to its module
    {
      equals: {type: [144, 736, 2, 801]},
    },
    // Containers - browse children by default
    {
      equals: {container: true},
      sequence: 1000
    }
  ];
});


csui.define('csui/utils/taskqueue',['module', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/lib/backbone', 'csui/utils/log'
], function (module, $, _, Backbone, log) {
  'use strict';

  log = log(module.id);

  var Task = Backbone.Model.extend({

    constructor: function Task(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.deferred = $.Deferred();
    },

    promise: function () {
      return this.deferred.promise();
    }

  });

  var TaskCollection = Backbone.Collection.extend({model: Task});

  function TaskQueue(options) {
    this.parallelism = options && options.parallelism || Infinity;
    this.pending = new TaskCollection(undefined, {model: Task});
    this.pending.on("add", this.dequeue, this);
    this.active = new TaskCollection(undefined, {model: Task});
  }

  _.extend(TaskQueue.prototype, {

    dequeue: function () {
      var task;
      log.debug(
          'Pending queue {0} contains {1} tasks, active queue {0} contains {1} tasks.',
          this.pending.cid, this.pending.length, this.active.cid, this.active.length)
      && console.log(log.last);
      if (this.active.length < this.parallelism &&
          (task = this.pending.shift())) {
        this.execute(task);
        this.dequeue();
      }
    },

    execute: function (task) {
      log.debug('Executing task {0}...', task.cid)
      && console.log(log.last);
      this.active.add(task);
      task.get("worker")()
          .done(task.deferred.done)
          .fail(task.deferred.fail)
          .always(_.bind(function () {
            this.active.remove(task);
            this.dequeue();
          }, this));
    }

  });

  TaskQueue.Task = Task;
  TaskQueue.TaskCollection = TaskCollection;
  TaskQueue.version = "1.0";

  return TaskQueue;

});


csui.define('csui/models/node/node.addable.type.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/node',
  'csui/models/node/node.addable.type.collection'
], function (module, _, Backbone, CollectionFactory, NodeModelFactory, NodeAddableTypeCollection) {

  var AddableTypeCollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'addableTypes',

    constructor: function AddableTypeCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var addableTypes = this.options.addableTypes || {};
      if (!(addableTypes instanceof Backbone.Collection)) {
        var node   = context.getModel(NodeModelFactory, options),
            config = module.config();
        addableTypes = new NodeAddableTypeCollection(addableTypes.models,
            _.defaults(
                {
                  // Prefer refreshing the entire collection after re-fetching it
                  // to improve rendering performance
                  autoreset: true
                },
                addableTypes.options,
                config.options,
                // node is intentionally listed at the end to give previous options preference
                {node: node}
            ));
      }
      this.property = addableTypes;
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  return AddableTypeCollectionFactory;

});


csui.define('csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data',[],function () {
  'use strict';

  var hasOwnProperty = Object.prototype.hasOwnProperty;

  // ['id'], ['name'], [], undefined => ['id', 'name']
  function mergeArrays(target, source) {
    if (!source) {
      return target && (target.slice ? target.slice() : target) || [];
    }
    if (!target) {
      return source && (source.slice ? source.slice() : source) || [];
    }
    target = target.slice ? target.slice() : target;
    for (var i = 0, l = source.length; i < l; ++i) {
      var item = source[i];
      if (target.indexOf(item) < 0) {
        target.push(item);
      }
    }
    return target;
  }

  // merge { properties: ['id'], columns: [] }
  // with  { properties: ['name'] }
  // to    { properties: ['id', 'name'], columns: [] }
  function mergeExtraData(objects) {
    if (!Array.isArray(objects)) {
      objects = Array.prototype.slice.call(arguments);
    }
    var merged = {};
    for (var i = 0, l = objects.length; i < l; ++i) {
      var object = objects[i];
      if (!object) {
        continue;
      }
      for (var key in object) {
        if (hasOwnProperty.call(object, key)) {
          merged[key] = mergeArrays(object[key], merged[key]);
        }
      }
    }
    return merged;
  }

  return mergeExtraData;
});


csui.define('csui/utils/contexts/perspective/plugins/node/utils/implement.extra.data',[
  'csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data'
], function (mergeExtraData) {
  'use strict';

  // [ { getModelFields() { ... }, getModelExpand() { ... } } ]
  // to { getModelFields() { ... }, getModelExpand() { ... } }
  // with the methods returning collected extra data
  return function implementExtraData(extraNodeData) {
    return {
      getModelFields: function (options) {
        if (!extraNodeData) {
          return {};
        }
        var objects = extraNodeData.map(function (nodeData) {
          return nodeData.getModelFields && nodeData.getModelFields(options);
        });
        return mergeExtraData(objects);
      },

      getModelExpand: function (options) {
        if (!extraNodeData) {
          return {};
        }
        var objects = extraNodeData.map(function (nodeData) {
          return nodeData.getModelExpand && nodeData.getModelExpand(options);
        });
        return mergeExtraData(objects);
      }
    };
  };
});




csui.define('csui/utils/contexts/perspective/plugins/node/main.node.extra.data',[
  'csui/utils/contexts/perspective/plugins/node/utils/implement.extra.data',
  // Load external extra data for the main contextual node
  'csui-ext!csui/utils/contexts/perspective/plugins/node/main.node.extra.data'
], function (implementExtraData, extraNodeData) {
  'use strict';

  return implementExtraData(extraNodeData);
});




csui.define('csui/utils/contexts/perspective/plugins/node/node.extra.data',[
  'csui/utils/contexts/perspective/plugins/node/utils/implement.extra.data',
  // Load external extra node data
  'csui-ext!csui/utils/contexts/perspective/plugins/node/node.extra.data'
], function (implementExtraData, extraNodeData) {
  'use strict';

  return implementExtraData(extraNodeData);
});


csui.define('csui/utils/contexts/impl/node.opening.context',[
  'csui/lib/underscore',
  'csui/utils/contexts/context',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/node.links/node.links',
  'csui/utils/contexts/factories/user',
  'csui/behaviors/default.action/impl/defaultaction',
  'csui/utils/contexts/perspective/plugins/node/main.node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data'
], function (_,Context, ConnectorFactory, NextNodeModelFactory,
    nodeLinks, UserModelFactory, DefaultActionController,
    mainNodeExtraData, nodeExtraData, mergeExtraData) {
  'use strict';

  var NodeOpeningContext = Context.extend({
    constructor: function NodeOpeningContext(options) {
      Context.prototype.constructor.apply(this, arguments);
      var defaultActionController = new DefaultActionController();

      this.connector = this.getObject(ConnectorFactory, {
        permanent: true,
        detached: true
      });
      this.user = this.getModel(UserModelFactory, {
        permanent: true
      });
      this.nextNode = this.getModel(
          NextNodeModelFactory, {
            options: {
              delayRestCommands: true,
              defaultActionCommands: defaultActionController.actionItems.getAllCommandSignatures(
                defaultActionController.commands)
            },
            permanent: true,
            detached: true
      });
      this._setExtraNodeOptions(this.nextNode);
      this.nextNode.on('change:id', function(){
        this._nextNodeOptions || (this._nextNodeOptions = this._setExtraNodeOptions(this.nextNode));
        this.onNextNodeChanged.apply(this,arguments);
      }, this);
    },

    _isFetchable: function (factory) {
      return Context.prototype._isFetchable.apply(this, arguments) &&
             // The user model should be fetched only at the beginning
             (factory.property !== this.user || !this.user.get('id'));
    },

    openNodePage: function (node) {
      this.triggerMethod('before:open:page', this, this.nextNode);
      window.open(nodeLinks.getUrl(node));
    },

    _setExtraNodeOptions: function(node){
      var options = {
        fields: mergeExtraData(mainNodeExtraData.getModelFields({context:this}), nodeExtraData.getModelFields(), {'versions.element(0)':['mime_type']}),
        expand: mergeExtraData(mainNodeExtraData.getModelExpand({context:this}), nodeExtraData.getModelExpand()),
        includeResources: ['metadata', 'perspective']
      };
      node.setFields(options.fields);
      node.setExpand(options.expand);
      node.includeResources(options.includeResources);
      return options;
    }
  });

  return NodeOpeningContext;
});


csui.define('csui/models/widget/settings/impl/widget.settings.model.local.access.mixin',['nuc/lib/underscore', 'nuc/lib/jquery',
], function (_, $
) {
  'use strict';

  const WidgetSettingsModelLocalAccessMixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {
        makeWidgetSettingsModelLocalAccess: function (options) {
          options || (options = {});

          return this;
        },

        _storeValues: function (values, collection) {
          if (!collection) {
            collection = this.collection;
          }
          const storeId = values[this.idAttribute];
          const storeAttrs = _.omit(values,this.idAttribute);
          const entries = collection._widgetSettingsLocalStorage.get('entries') || {};
          entries[storeId] = storeAttrs;
          collection._widgetSettingsLocalStorage.set('entries', entries);
        }

      });
    }
  };
  return WidgetSettingsModelLocalAccessMixin;
});


csui.define('csui/models/server.adaptors/widget.settings.model.mixin',['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/utils/url',
  'csui/models/widget/settings/impl/widget.settings.model.local.access.mixin'
], function (_, $, Url,
  WidgetSettingsModelLocalAccessMixin
) {
  'use strict';

  const ServerAdaptorMixin = {
    mixin: function (prototype) {
      WidgetSettingsModelLocalAccessMixin.mixin(prototype);
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          options || (options = {});

          this.makeWidgetSettingsModelLocalAccess(options);

          return this;
        },

        sync: function (method, model, options) {
          options || (options = {});
          const deferred = $.Deferred();
          switch (method) {
          case 'read':
            deferred.reject(new Error(`Cannot get widget settings for one widget only`));
            break;
          case 'create':
          case 'update':
          case 'patch': {
            if (!model.get(model.idAttribute)) {
              deferred.reject(new Error(`Can't save without attribute ${model.idAttribute}`));
              break;
            }
            this.trigger('request', this, deferred.promise(), options);
            const attributes = _.clone(model.attributes);
            const collection = this.collection;
            setTimeout(() => {
              this._storeValues(attributes, collection);
              options.success && options.success.call(this, attributes);
              deferred.resolve(model);
            });
            break;
          }
          default:
            deferred.reject(new Error(`unknown method ${method} specified`));
          }
          return deferred.promise();
        }

      });
    }
  };
  return ServerAdaptorMixin;
});


csui.define('csui/models/widget/settings/impl/widget.settings.model',[
  'require', 'module', 'nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/log',
  'nuc/models/mixins/connectable/connectable.mixin',
  'nuc/models/mixins/fetchable/fetchable.mixin',
  'csui/models/server.adaptors/widget.settings.model.mixin'
], function (require, module, _, Backbone, log,
    ConnectableMixin,
    FetchableMixin,
    ServerAdaptorMixin,
) {
  'use strict';

  log = log(module.id);

  const WidgetSettingsModel = Backbone.Model.extend({

    idAttribute: 'preferencesStorageId',

    constructor: function WidgetSettingsModel(attributes, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.makeConnectable(options)
          .makeFetchable(options)
          .makeServerAdaptor(options);
    },
  });

  ConnectableMixin.mixin(WidgetSettingsModel.prototype);
  FetchableMixin.mixin(WidgetSettingsModel.prototype);
  ServerAdaptorMixin.mixin(WidgetSettingsModel.prototype);

  return WidgetSettingsModel;
});


csui.define('csui/models/widget/settings/impl/widget.settings.collection.local.access.mixin',['nuc/lib/underscore',
  'nuc/utils/namedlocalstorage'
], function (_,
  NamedLocalStorage
) {
  'use strict';

  const WidgetSettingsCollectionLocalAccessMixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {
        makeWidgetSettingsCollectionLocalAccess: function (options) {
          options || (options = {});

          this._widgetSettingsLocalStorage = new NamedLocalStorage('csui/models/widget/settings');

          return this;
        },

        _readList: function (options) {
          options || (options = {});

          let entries = this._widgetSettingsLocalStorage.get('entries') || {};
          let idAttribute = this.model.prototype.idAttribute || 'id';
          let widgetSettings = Object.keys(entries).map( key => {
            entries[key][idAttribute] = key;
            return entries[key];
          });

          return widgetSettings;
        }

      });
    }
  };
  return WidgetSettingsCollectionLocalAccessMixin;
});


csui.define('csui/models/server.adaptors/widget.settings.collection.mixin',['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/utils/url',
  'module', 'nuc/utils/log',
  'csui/models/widget/settings/impl/widget.settings.collection.local.access.mixin'
], function (_, $, Url,
  module, log,
  WidgetSettingsCollectionLocalAccessMixin) {
  'use strict';

  log = log(module.id);

  const ServerAdaptorMixin = {
    mixin: function (prototype) {
      WidgetSettingsCollectionLocalAccessMixin.mixin(prototype);
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          options || (options = {});

          this.makeWidgetSettingsCollectionLocalAccess(options);

          return this;
        },

        sync: function (method, model, options) {
          options || (options = {});
          const deferred = $.Deferred();
          switch (method) {
          case 'read':
            this.trigger('request', this);
            setTimeout(() => {
              // todo: only provide needed entries, which can be determined using:
              // previous calls/events like sync:perspective before:enter:container,
              // before:change:perspective, perspectivePlugin.onRefresh, investigation
              // of context.viewStateModel, context.perspective and so on.
              let widgetSettings = this._readList(options);
              log.debug("widget settings collection fetched") && console.log(log.last);
              options.success && options.success.call(this, widgetSettings);
              deferred.resolve(widgetSettings);
            });
            break;
          case 'create':
          case 'update':
          case 'patch':
            deferred.reject(new Error(`Cannot save widget settings collection as a whole`));
            break;
          default:
            deferred.reject(new Error(`Unknown method ${method} specified in sync of widget settings collection`));
          }
          return deferred.promise();
        }
      });
    }
  };
  return ServerAdaptorMixin;
});


csui.define('csui/models/widget/settings/impl/widget.settings.collection',[
  'require', 'module', 'nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/log',
  'nuc/models/mixins/connectable/connectable.mixin',
  'nuc/models/mixins/fetchable/fetchable.mixin',
  'csui/models/widget/settings/impl/widget.settings.model',
  'csui/models/server.adaptors/widget.settings.collection.mixin'
], function (require, module, _, Backbone, log,
    ConnectableMixin,
    FetchableMixin,
    WidgetSettingsModel,
    ServerAdaptorMixin,
) {
  'use strict';

  log = log(module.id);

  const WidgetSettingsCollection = Backbone.Collection.extend({

    model: WidgetSettingsModel,

    constructor: function WidgetSettingsCollection(models, options) {
      options = _.pick(options || {}, 'context');
      if (!options.context) {
        throw new Error('WidgetSettingsCollection needs context in constructor options');
      }
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options)
          .makeFetchable(options)
          .makeServerAdaptor(options);
    }
  });

  ConnectableMixin.mixin(WidgetSettingsCollection.prototype);
  FetchableMixin.mixin(WidgetSettingsCollection.prototype);
  ServerAdaptorMixin.mixin(WidgetSettingsCollection.prototype);

  return WidgetSettingsCollection;
});


csui.define('csui/utils/contexts/factories/widget.settings.collection.factory',['csui/lib/underscore',
  'csui/utils/contexts/factories/factory',
  'csui/models/widget/settings/impl/widget.settings.collection'
], function (_,
    ModelFactory,
    WidgetSettingsCollection) {

  var WidgetSettingsCollectionFactory = ModelFactory.extend({

    propertyPrefix: 'widgetSettings',

    constructor: function WidgetSettingsCollectionFactory(context, options) {

      if (options.permanent === undefined) {
        options.permanent = true;
      }
      if (options.detached === undefined) {
        options.detached = true;
      }

      ModelFactory.prototype.constructor.apply(this, arguments);

      this.property = new WidgetSettingsCollection(undefined, { context: context });
    }

  });

  return WidgetSettingsCollectionFactory;

});


csui.define('csui/utils/contexts/factories/previous.node',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/node/node.model'
], function (module, _, Backbone, ModelFactory, ConnectorFactory, NodeModel) {
  'use strict';

  var PreviousNodeModelFactory = ModelFactory.extend({

    propertyPrefix: 'previousNode',

    constructor: function PreviousNodeModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var connector = context.getObject(ConnectorFactory, options),
          config = module.config();
      this.property = new NodeModel(undefined,
          _.defaults({
            connector: connector
          }, config.options));
    }

  });

  return PreviousNodeModelFactory;

});


csui.define('csui/utils/contexts/impl/delayed.actions.for.node',[
  'csui/utils/commands', 'csui/utils/defaultactionitems'
], function (commands, defaultActionItems) {
  'use strict';

  function delayCommands (node) {
    node.resetCommands();
    node.resetDefaultActionCommands();
    node.setCommands(commands.getAllSignatures());
    node.setDefaultActionCommands(defaultActionItems.getAllCommandSignatures(commands));
    node.setEnabledDelayRestCommands(true, false);
  }

  function relayActionEvents (context) {
    if (context.nextNode.delayRestCommands) {
      context.nextNode.delayedActions
          .on('request', relayRequestNodeActions, context)
          .on('sync', relaySyncNodeActions, context)
          .on('error', relayErrorNodeActions, context);
      context.nextNode.actions
          .on('reset update', relayUpdateNodeActions, context);
      // The csuiDelayedActionsRetrieved flag belongs to the delayed action
      // workflow. Once they were fetched, this flag is set to true.
      context.nextNode
          .on('change:csuiDelayedActionsRetrieved', relayActionRetrievedFlag, context);
      resumeRelayingActionEvents(context);
    }
  }

  function relayRequestNodeActions () {
    if (this.relayingActionEvents) {
      var delayedActions = this.node.delayedActions;
      delayedActions._fetchStarted();
      delayedActions.trigger('request', delayedActions, {}, {});
      delayedActions.fetching = this.nextNode.delayedActions.fetching;
    }
  }

  function relaySyncNodeActions () {
    if (this.relayingActionEvents) {
      var delayedActions = this.node.delayedActions;
      delayedActions._fetchSucceeded();
      delayedActions.trigger('sync', delayedActions, {}, {});
    }
  }

  function relayErrorNodeActions () {
    if (this.relayingActionEvents) {
      var delayedActions = this.node.delayedActions;
      delayedActions._fetchFailed();
      delayedActions.trigger('error', delayedActions, {}, {});
    }
  }

  function relayUpdateNodeActions () {
    if (this.relayingActionEvents) {
      updateNodeActions(this);
    }
  }

  function relayActionRetrievedFlag () {
    if (this.relayingActionEvents) {
      this.node.set('csuiDelayedActionsRetrieved', this.nextNode.get('csuiDelayedActionsRetrieved'));
    }
  }

  function suppressRelayingActionEvents (context) {
    if (context.nextNode.delayRestCommands) {
      context.relayingActionEvents = false;
    }
  }

  function resumeRelayingActionEvents (context) {
    if (context.nextNode.delayRestCommands) {
      context.relayingActionEvents = true;
    }
  }

  function updateNodeActions(context, options) {
    if (context.nextNode.delayRestCommands) {
      context.node.actions.reset(context.nextNode.actions.models, options);
    }
  }

  return {
    delayCommands: delayCommands,
    relayActionEvents: relayActionEvents,
    suppressRelayingActionEvents: suppressRelayingActionEvents,
    resumeRelayingActionEvents: resumeRelayingActionEvents,
    updateNodeActions: updateNodeActions
  };
});




csui.define('csui/utils/contexts/browsing/browsing.context',[
  'require', 'csui/lib/underscore',
  'csui/utils/contexts/impl/node.opening.context',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/widget.settings.collection.factory',
  'csui/utils/contexts/factories/previous.node',
  'csui/utils/contexts/impl/delayed.actions.for.node',
  'csui-ext!csui/utils/contexts/browsing/browsing.context',
  'csui/behaviors/default.action/impl/defaultaction'
], function (require, _, NodeOpeningContext, NodeModelFactory,
    WidgetSettingsCollectionFactory,
    PreviousNodeModelFactory, delayedActions, contextPlugins, DefaultActionController) {
  'use strict';

  var BrowsingContext = NodeOpeningContext.extend({
    constructor: function BrowsingContext(options) {
      NodeOpeningContext.prototype.constructor.apply(this, arguments);
      var defaultActionController = new DefaultActionController();

      this.on('request', this._changeNode, this);

      this.previousNode = this.getModel(PreviousNodeModelFactory, {
        permanent: true,
        detached: true
      });
      // TODO: Re-enable delayed actions once views can handle them properly.
      // delayedActions.delayCommands(this.nextNode);
      delayedActions.relayActionEvents(this);
      this.node = this.getModel(NodeModelFactory, {
        options: {
          delayRestCommands: true,
          defaultActionCommands: defaultActionController.actionItems.getAllCommandSignatures(
            defaultActionController.commands)
        },
        permanent: true,
        detached: true
      });
      this._setExtraNodeOptions(this.node);
      // TODO: Re-enable delayed actions once views can handle them properly.
      // delayedActions.delayCommands(this.node);

      this._widgetSettings = this.getCollection(WidgetSettingsCollectionFactory);

      // Keep the same order as in perspective context
      var Plugins = _
          .chain(options && options.plugins || contextPlugins)
          .flatten(true)
          .unique()
          .reverse()
          .value();
      this._plugins = _.map(Plugins, function (Plugin) {
        return new Plugin({context: this});
      }, this);
      _.invoke(this._plugins, 'onCreate');
    },

    _isFetchable: function (factory) {
      return NodeOpeningContext.prototype._isFetchable.apply(this, arguments) &&
             _.all(this._plugins, function (plugin) {
               return plugin.isFetchable(factory) !== false;
             });
    },

    onBeforeEnterContainer: function() {
      // widget settings are available for views earliest with the "request" event on the context.
      // it is not allowed to get the settings BEFORE that event, thus reset it here.
      this._widgetSettings.reset([], { silent: true });
    },

    onNextNodeChanged: function () {
      this._nodeOptions || (this._nodeOptions = this._setExtraNodeOptions(this.node));
      // Setting just node ID to nextNode will try to drill down;
      // non-containers are handled by opening a new window, but
      // need passing more node attributes to nextNode
      if (this.nextNode.get('container') !== false) {
        this.enterContainer();
      } else {
        this.openNewNodePage();
      }
    },

    openNewNodePage: function () {
      this.openNodePage(this.nextNode);
      this.nextNode.clear({silent: true});
    },

    enterContainer: function () {
      this.triggerMethod('before:enter:container', this, this.nextNode);
      this.nextNode
          .fetch()
          .then(() => this._widgetSettings.fetch())
          .then(function () {
            this._enteringContainer = true;
            return this.fetch();
          }.bind(this))
          .fail(function (error) {
            csui.require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
              ModalAlert.showError(error.toString());
            });
          });
    },

    _changeNode: function () {
      if (this._enteringContainer) {
        this.previousNode.clear({silent: true});
        this.previousNode.set(this.node.attributes);
        // Set the contextual node attributes before the rest of the context
        // starts fetching, so that dependent models can refer to it.
        this.node.clear({silent: true});
        this.node.set(this.nextNode.attributes, {silent: true});
        // Trigger the "change" events on the contextual node after the context
        // triggers the "request" event. TableView optimizes rew-rendering for
        //  changes that happen between "request" and "sync" events.
        setTimeout(function () {
          this.node.triggerAllChanges();
          delayedActions.updateNodeActions(this);
          this.nextNode.clear({silent: true});
        }.bind(this));
        this._enteringContainer = false;
      }
    },

    fetch: function () {
      var parameters = Array.prototype.slice.apply(arguments),
          self = this;

      function continueFetching () {
        NodeOpeningContext.prototype.fetch.apply(self, parameters);
      }

      if (!this._enteringContainer && this.node.isFetchable()) {
        this.triggerMethod('before:enter:container', this, this.node);
        return this.node
            .fetch()
            .then(() => this._widgetSettings.fetch())
            .then(continueFetching);
      }
      return continueFetching();
    }
  });

  return BrowsingContext;
});


csui.define('csui/utils/contexts/impl/csui.context.plugin',[
  'csui/utils/contexts/context.plugin', 'csui/models/view.state.model'
], function (ContextPlugin, ViewStateModel) {
  'use strict';

  var CsuiContextPlugin = ContextPlugin.extend({
    constructor: function CsuiContextPlugin(options) {
      ContextPlugin.call(this, options);

      var context = this.context;
      context.viewStateModel = new ViewStateModel();
      context.listenTo(context, 'request', propagateRequestEventToViewState.bind(this))
             .listenTo(context, 'destroy', clearViewState.bind(this));
    }
  });

  function propagateRequestEventToViewState() {
    this.context.viewStateModel.onContextFetch();
  }

  function clearViewState() {
    this.context.viewStateModel.clear();
  }

  return CsuiContextPlugin;
});




csui.define('csui/utils/contexts/portal/portal.context',[
  'csui/lib/underscore', 'csui/utils/contexts/impl/node.opening.context',
  'csui-ext!csui/utils/contexts/portal/portal.context'
], function (_, NodeOpeningContext, contextPlugins) {
  'use strict';

  var PortalContext = NodeOpeningContext.extend({
    constructor: function PortalContext(options) {
      NodeOpeningContext.prototype.constructor.apply(this, arguments);

      // Keep the same order as in perspective context
      var Plugins = _
          .chain(options && options.plugins || contextPlugins)
          .flatten(true)
          .unique()
          .reverse()
          .value();
      this._plugins = _.map(Plugins, function (Plugin) {
        return new Plugin({context: this});
      }, this);
      _.invoke(this._plugins, 'onCreate');
    },

    _isFetchable: function (factory) {
      return NodeOpeningContext.prototype._isFetchable.apply(this, arguments) &&
             _.all(this._plugins, function (plugin) {
               return plugin.isFetchable(factory) !== false;
             });
    },

    onNextNodeChanged: function () {
      this.openNewNodePage();
    },

    openNewNodePage: function () {
      this.openNodePage(this.nextNode);
      this.nextNode.clear({silent: true});
    }
  });

  return PortalContext;
});


csui.define('csui/utils/contexts/perspective/perspective.context.plugin',[
  'csui/utils/contexts/context.plugin'
], function (ContextPlugin) {
  'use strict';

  var PerspectiveContextPlugin = ContextPlugin.extend({
    // Called when the context and all plugins are constructed.
    onCreate: function () {},

    // Called when the perspective was fetched, but it was not applied yet.
    // If it returns `true` the original perspective will not be applied; the
    // plugin si expected to apply an alternative one.
    onApply: function () {},

    // Called when the context is cleared, when a new perspective is loading
    onClear: function () {},

    // Called when the context is going to be re-fetched, because the current
    // perspective did not change
    onRefresh: function () {}
  });

  return PerspectiveContextPlugin;
});




csui.define('csui/utils/contexts/perspective/landing.perspectives',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external perspectives
  'csui-ext!csui/utils/contexts/perspective/landing.perspectives'
], function (_, Backbone, RulesMatchingMixin, extraPerspectives) {

  var UserPerspectiveModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      important: false,
      module: null
    },

    constructor: function UserPerspectiveModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }

  });

  RulesMatchingMixin.mixin(UserPerspectiveModel.prototype);

  var UserPerspectiveCollection = Backbone.Collection.extend({

    model: UserPerspectiveModel,
    comparator: "sequence",

    constructor: function UserPerspectiveCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findByUser: function (user) {
      return this.find(function (item) {
        return item.matchRules(user, item.attributes);
      });
    }

  });

  var userPerspectives = new UserPerspectiveCollection([
    {
      // default landing page
      module: 'json!csui/utils/contexts/perspective/impl/perspectives/user.json',
      sequence: 10000
    }
  ]);

  if (extraPerspectives) {
    userPerspectives.add(_.flatten(extraPerspectives, true));
  }

  return userPerspectives;

});


csui.define('csui/utils/contexts/perspective/impl/landing.perspective.context.plugin',[
  'module', 'csui/lib/underscore', 'csui/utils/log',
  'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/perspective/perspective.context.plugin',
  'csui/utils/contexts/perspective/landing.perspectives',
  'csui/models/perspective/personalization.model'
], function (module, _, log, UserModelFactory, ApplicationScopeModelFactory,
    PerspectiveContextPlugin, landingPerspectives, PersonalizationModel) {
  'use strict';

  log = log(module.id);

  var LandingPerspectiveContextPlugin = PerspectiveContextPlugin.extend({
    constructor: function LandingPerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context
          .getModel(ApplicationScopeModelFactory)
          .on('change:id', this.onApplicationScopeChanged, this);
      this.userFactory = this.context.getFactory(UserModelFactory);
      this.user = this.userFactory.property;
    },

    onApplicationScopeChanged: function () {
      // Empty scope means landing page
      if (this.applicationScope.id) {
        return;
      }

      // Do not fetch another time when the user is still being fetched.
      // Setting attributes coming from the server when the earlier fetch
      // finishes might cause an endless loop. It would also trigger another
      // pair of fetching events and disturb the subscribers.
      if (this.fetching) {
        return;
      }

      this.context.triggerMethod('request:perspective', this);
      // Use the factory to allow pre-fetching data from the page.
      var self = this;
      var promise = this.fetching = this.userFactory.fetch({
        success: function () {
          self.onUserFetchSuccess(promise);
        },
        error: function (error) {
          self.onUserFetchFailure(promise, error);
        }
      });
    },

    onUserFetchSuccess: function (promise) {
      // Another navigation change suppresses the earlier one.
      if (suppressFetchResult.call(this, promise)) {
        return;
      }

      // TODO Reconsider having this function to fetch personalization
      // once REST API is ready.
      PersonalizationModel.loadPersonalization(this.user, this.context)
        .then(this._changePerspective.bind(this, this.user),
              this.context.rejectPerspective.bind(this.context));
    },

    onUserFetchFailure: function (promise, error) {
      // Another navigation change suppresses the earlier one.
      if (suppressFetchResult.call(this, promise)) {
        return;
      }

      this.context.rejectPerspective(error);
    },

    _changePerspective: function (sourceModel, personalization) {
      var perspectiveModule,
          perspective = landingPerspectives.findByUser(sourceModel);

      // Let override landing page on the client side
      if ((_.isEmpty(sourceModel.get('perspective')) && _.isEmpty(personalization)) ||
          perspective.get('important')) {
        perspectiveModule = perspective.get('module');
      }
      if (perspectiveModule) {
        return this.context.overridePerspective(sourceModel, perspectiveModule);
      }
      this.context.applyPerspective(sourceModel, false, personalization);
    }
  });

  // TODO: Create a utility mixin for this.
  function suppressFetchResult(promise) {
    var fetching = this.fetching;
    this.fetching = null;
    if (promise === fetching) {
      return false;
    }
    // Another navigation change suppresses the earlier one.
    log.debug('Suppressing the user perspective delivery in {0}.', this.cid) && console.log(log.last);
    var error = new Error('Earlier user navigation suppressed.');
    this.context.triggerMethod('error:perspective', this, error);
    return true;
  }

  return LandingPerspectiveContextPlugin;
});




csui.define('csui/utils/contexts/perspective/node.perspectives',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external perspectives
  'csui-ext!csui/utils/contexts/perspective/node.perspectives'
], function (_, Backbone, RulesMatchingMixin, extraPerspectives) {

  var NodePerspectiveModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      important: false,
      module: null
    },

    constructor: function NodePerspectiveModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }

  });

  RulesMatchingMixin.mixin(NodePerspectiveModel.prototype);

  var NodePerspectiveCollection = Backbone.Collection.extend({

    model: NodePerspectiveModel,
    comparator: "sequence",

    constructor: function NodePerspectiveCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findByNode: function (node) {
      return this.find(function (item) {
        return item.matchRules(node, item.attributes);
      });
    }

  });

  var nodePerspectives = new NodePerspectiveCollection([

    {
      // saved search query
      equals: {type: 258},
      module: 'json!csui/utils/contexts/perspective/impl/perspectives/saved.query.json',
      sequence: 100
    },
    {
      // document
      equals: {type: [ 144, 801 ]},
      important: true,
      module: 'json!csui/utils/contexts/perspective/impl/perspectives/document.overview.json',
      sequence: 100
    },
    {
      // node container
      equals: {container: true},
      module: 'json!csui/utils/contexts/perspective/impl/perspectives/container.json',
      sequence: 1000
    },
    {
      // default node
      module: 'json!csui/utils/contexts/perspective/impl/perspectives/metadata.json',
      sequence: 10000
    }
  ]);

  if (extraPerspectives) {
    nodePerspectives.add(_.flatten(extraPerspectives, true));
  }

  return nodePerspectives;

});


csui.define('csui/utils/contexts/perspective/plugins/node/node.perspective.context.plugin',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/log',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/contexts/factories/previous.node',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/perspective/perspective.context.plugin',
  'csui/utils/contexts/perspective/node.perspectives',
  'csui/utils/classic.nodes/classic.nodes',
  'csui/utils/contexts/impl/delayed.actions.for.node',
  'csui/utils/contexts/perspective/plugins/node/main.node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data',
  'csui/models/perspective/personalization.model'
], function (module, _, Backbone, log, NodeModelFactory, NextNodeModelFactory,
    PreviousNodeModelFactory, ApplicationScopeModelFactory,
    PerspectiveContextPlugin, nodePerspectives, classicNodes,
    delayedActions, mainNodeExtraData, nodeExtraData, mergeExtraData,
    PersonalizationModel) {
  'use strict';

  log = log(module.id);

  // TODO: Remove these experimental parameters.
  // Let fast browsing be enabled or disabled by URL temporarily.
  var delayCommands = /\bdelayCommands\b(?:=([^&]*)?)?/i.exec(location.search);
  delayCommands = delayCommands ? delayCommands[1] !== 'false' : undefined;

  var config = module.config();

  // override config by URL param
  if(delayCommands !== undefined) {
    config.delayCommands = delayCommands;
  }

  var sendOriginParams  = config.sendOriginParams;

  function setExtraNodeOptions(node,options){
    options = options ? _.deepClone(options) : {
      fields: mergeExtraData(mainNodeExtraData.getModelFields({context:this.context}), nodeExtraData.getModelFields()),
      expand: mergeExtraData(mainNodeExtraData.getModelExpand({context:this.context}), nodeExtraData.getModelExpand()),
      includeResources: ['metadata', 'perspective']
    };
    node.setFields(options.fields);
    node.setExpand(options.expand);
    node.includeResources(options.includeResources);
    return options;
}

  var NodePerspectiveContextPlugin = PerspectiveContextPlugin.extend({
    constructor: function NodePerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context
          .getModel(ApplicationScopeModelFactory);

      this.nextNodeFactory = this.context.getFactory(NextNodeModelFactory, {
        permanent: true,
        detached: true
      });

      this.nextNode = this.nextNodeFactory.property;
      this.nextNode.on('change:id', this.onNextNodeChanged, this);

      setExtraNodeOptions.call(this,this.nextNode);
      // TODO: Re-enable delayed actions once views can handle them properly.
      if( config.delayCommands) {
        delayedActions.delayCommands(this.nextNode);
      }
      delayedActions.relayActionEvents(this);

      // TODO: Remove previousNode. Nobody should use it.
      this.previousNode = this.context
          .getModel(PreviousNodeModelFactory, {
            permanent: true,
            detached: true
          });

      // Move the contextual node out of permanent factories; it cannot be
      // retained, because when the perspective switches, other models could
      // be listening on it and would waist a fetch, because their views are
      // going to be destroyed with the old perspective. Create the node right
      // away, though, to ensure, that the expected factory options will be set.
      createNodeModel.call(this);
    },

    onClear: function () {
      this._clearModels(true);
    },

    onRefresh: function () {
      this._clearModels(false);
    },

    isFetchable: function (factory) {
      // The contextual node is fetched by fetchPerspective already.
      return factory.property !== this.node;
    },

    _clearModels: function (recreateNode) {
      // Reset the next-node model on navigating to other than node perspective.
      // Allow navigation to the previously visited node from that perspective.
      if (this.applicationScope.id !== 'node') {
        clearCurrentNode.call(this);
        return this.nextNode.clear({silent: true});
      }

      clearCurrentNode.call(this);
      // Do not trigger change events, when the node was recreated. Nobody had a chance
      // to subscribe to change events on the node created right above.
      var delayChangeEvents = !recreateNode && (
          // If there are no children used on the page do not delay the events.
          // Delaying the events is a dirty hack only to make the nodestable widget
          // feel rendering smoother. It does not help much anyway.
          this.context.hasCollection('children') ||
          this.context.hasCollection('children2'));
      // Initialize the contextual node. It needs to be complete, so that widget
      // can use it to ask for their models. It should not trigger events, if the
      // container model is used together with children. csui renders very slowly
      // and triggering the change events together with children will make the
      // rendering appear less busy.
      this.node.set(this.nextNode.attributes, {silent: delayChangeEvents});
      // If the actions are delayed, there is a chance that their request had
      // ended before the decision about the new perspective was made. If it
      // was so, they should be synchronized together with the node attributes.
      if (this.nextNode.delayRestCommands && this.nextNode.get('csuiDelayedActionsRetrieved')) {
        this.node.actions.reset(this.nextNode.actions.models, {silent: delayChangeEvents});
      }

      if (delayChangeEvents) {
        var children = this.context.hasCollection('children') &&
                       this.context.getCollection('children') ||
                       this.context.hasCollection('children2') &&
                       this.context.getCollection('children2');
        var updated;
        children.once('reset update', function () {
          // Depending on the collection owner, either of the two events will be triggered.
          if (!updated) {
            updated = true;
            this.node.set(this.nextNode.attributes, { silent: true });
            delayedActions.updateNodeActions(this, { silent: true });
            this.node.triggerAllChanges();
            // Resume updating actions on the current node suppressed during the navigation.
            delayedActions.resumeRelayingActionEvents(this);
          }
        }, this);
      } else {
        delayedActions.updateNodeActions(this);
        // Resume updating actions on the current node suppressed during the navigation.
        delayedActions.resumeRelayingActionEvents(this);
      }

      function clearCurrentNode() {
        // TODO: Remove previousNode. Nobody should use it.
        // make these operations silently as we do not need views react on this
        this.previousNode.clear({silent: true});
        this.previousNode.set(this.node.attributes, {silent: true});

        // Create the new model if it has not existed yet (the node perspective
        // is navigated to for the first time), or if thi navigation is not
        // a drill down and a new model has to be added to prevent changes
        // on the current perspective, which is going to be destroyed.
        if (recreateNode) {
          this._nodeOptions = createNodeModel.call(this,this._nodeOptions);
        } else {
          this.node.clear({silent: true});
        }
      }
    },

    onNextNodeChanged: function () {
      // TODO: Remove this dirty hack. This has nothing to do with the context.
      // Whoever needs to react on context events, has to subscribe to it.
      Backbone.trigger('closeToggleAction');

      // Compatibility with the early way how to go to the landing page
      var nextNodeId = this.nextNode.get('id');
      if (nextNodeId == null || nextNodeId <= 0) {
        return;
      }

      this.nextNode.trigger('just:changed:id', this.nextNode.previous('id'));

      // Do not fetch another node when the previous one is still fetching.
      // Setting attributes coming from the server when the earlier fetch
      // finishes would cause an endless loop. It would also trigger another
      // pair of fetching events and disturb the subscribers.
      if (this.fetching) {
        return;
      }

      this.context.triggerMethod('request:perspective', this);
      this.applicationScope.set('id', 'node');
      // Do not update actions on the current node; a new node will be created soon.
      delayedActions.suppressRelayingActionEvents(this);
      // Remove the content of the nextNode before it is fetched. Only "id" was
      // changed to trigger the navigation. If there were other old attributes,
      // they must not get merged with the new ones retrieved from the server.
      var id = this.nextNode.get('id');
      this.nextNode.clear({ silent: true });
      // TODO: Move this to the clear method.
      // Actions is the only model attached to the node that gets populated
      // separately and not through the attributes,
      this.nextNode.actions.reset([], { silent: true });
      this.nextNode.set('id', id, { silent: true });

      // ensure node options be determined at this point in time.
      this._nextNodeOptions || (this._nextNodeOptions = setExtraNodeOptions.call(this,this.nextNode));
      this._nodeOptions || (this._nodeOptions = setExtraNodeOptions.call(this,this.node));

      // Use the factory to allow pre-fetching data from the page.
      var self = this;
      var promise = this.fetching = this.nextNodeFactory.fetch({
        headers: sendOriginParams ? { 'X-OriginParams': location.search } : undefined,
        success: function () {
          self.onNodeFetchSuccess(promise);
        },
        error: function (model, jqxhr) {
          self.onNodeFetchFailure(promise, model, jqxhr);
        }
      });
    },

    onNodeFetchSuccess: function (promise) {
      // Another navigation change suppresses the earlier one.
      if (suppressFetchResult.call(this, promise)) {
        return;
      }

      // TODO Reconsider having this function to fetch personalization
      // once REST API is ready.
      PersonalizationModel.loadPersonalization(this.nextNode, this.context)
        .then(this._changePerspective.bind(this, this.nextNode),
              this.context.rejectPerspective.bind(this.context));
    },

    onNodeFetchFailure: function (promise, sourceModel, error) {
      // Another navigation change suppresses the earlier one.
      if (suppressFetchResult.call(this, promise)) {
        return;
      }

      this.context.rejectPerspective(sourceModel, error);
    },

    _changePerspective: function (sourceModel, personalization) {
      // Check if the node is forced to be opened in Classic UI
      var classicUrl = classicNodes.getUrl(sourceModel);
      if (classicUrl) {
        window.location.replace(classicUrl);
        return;
      }

      var perspectiveModule,
          perspective = nodePerspectives.findByNode(sourceModel);
      // Avoid opening a non-container in the children-browse perspective when using the old perspective engine
      // and prefer important client-side perspectives too
      var emptySource = _.isEmpty(sourceModel.get('perspective')) && _.isEmpty(personalization);
      var oldNonContainer = !config.enableNewPerspectiveNodes && !sourceModel.get('container');
      var importantPerspective = perspective.get('important');
      if (emptySource || oldNonContainer || importantPerspective) {
        perspectiveModule = perspective.get('module');
      }
      if (perspective) {
        sourceModel.set({"persist": perspective.get("persist")}, {silent: true});
      }
      if (perspectiveModule) {
        return this.context.overridePerspective(sourceModel, perspectiveModule);
      }

      this.context.applyPerspective(sourceModel, false, personalization);
    }
  });

  function createNodeModel(options) {
    this.node = this.context.getModel(NodeModelFactory);
    setExtraNodeOptions.call(this,this.node,options);
    // Since this node will never be fetched, and will only filled by NextNode on node change, 
    // Mark this as fetched to avoid (re)fetching it on `ensureFetch`
    this.node.markFetched();
    // TODO: Re-enable delayed actions once views can handle them properly.
    if( config.delayCommands) {
      delayedActions.delayCommands(this.node);
    }
  }

  // TODO: Create a utility mixin for this.
  function suppressFetchResult(promise) {
    var fetching = this.fetching;
    this.fetching = null;
    if (promise === fetching) {
      return false;
    }
    // Another navigation change suppresses the earlier one.
    log.debug('Suppressing the node perspective delivery in {0}.', this.cid) && console.log(log.last);
    var error = new Error('Earlier node navigation suppressed.');
    this.context.triggerMethod('error:perspective', this, error);
    return true;
  }

  return NodePerspectiveContextPlugin;
});




csui.define('csui/utils/contexts/perspective/search.perspectives',['module',
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external perspectives
  'csui-ext!csui/utils/contexts/perspective/search.perspectives'
], function (module, _, Backbone, RulesMatchingMixin, extraPerspectives) {

  var config = module.config();
  _.defaults(config, {
    perspectiveCollection:[{
      // default search
      module: 'json!csui/utils/contexts/perspective/impl/perspectives/search.json',
      sequence: 10000
    }]
  });

  var SearchPerspectiveModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      module: null
    },

    constructor: function SearchPerspectiveModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }

  });

  RulesMatchingMixin.mixin(SearchPerspectiveModel.prototype);

  var SearchPerspectiveCollection = Backbone.Collection.extend({

    model: SearchPerspectiveModel,
    comparator: "sequence",

    constructor: function SearchPerspectiveCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findByQuery: function (query) {
      return this.find(function (item) {
        return item.matchRules(query, item.attributes);
      });
    }

  });

  var searchPerspectives = new SearchPerspectiveCollection(config.perspectiveCollection);

  if (extraPerspectives) {
    searchPerspectives.add(_.flatten(extraPerspectives, true));
  }

  return searchPerspectives;

});


csui.define('csui/utils/contexts/perspective/plugins/search.perspective.context.plugin',['require', 'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/log', 'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/search.formquery.factory',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/perspective/perspective.context.plugin',
  'csui/utils/contexts/perspective/search.perspectives'
], function (require, module, _, Backbone, log, SearchQueryModelFactory, SearchFormQueryModelFactory,
    ApplicationScopeModelFactory, PerspectiveContextPlugin,
    searchPerspectives) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    allowAlphaNumericsInQueryId : false
  });

  var SearchPerspectiveContextPlugin = PerspectiveContextPlugin.extend({

    constructor: function SearchPerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context
          .getModel(ApplicationScopeModelFactory);
      this.searchQuery = this.context
          .getModel(SearchQueryModelFactory, {
            permanent: true,
            detached: true
          })
          .on('change', this.onSearchQueryChanged, this);
      this.searchForm = this.context
          .getModel(SearchFormQueryModelFactory, {
            permanent: true,
            detached: true
          })
          .on('change', this.onSearchQueryChanged, this);
    },

    onSearchQueryChanged: function () {
      if (this.searchQuery.get('query_id') && typeof this.searchQuery.get('query_id') === "string" && 
          this.searchQuery.attributes.enableSearchForm && typeof this.searchQuery.attributes.enableSearchForm === "string") {
        if (!config.allowAlphaNumericsInQueryId) {
          this.searchQuery.attributes.query_id = parseInt(this.searchQuery.get('query_id'));
        } else {
          this.searchQuery.attributes.query_id = this.searchQuery.get('query_id');
        }
        this.searchQuery.attributes.enableSearchForm = this.searchQuery.attributes.forcePerspectiveChange = true;
        this.context._factories.searchTemplate.property = this.searchQuery;
      }
      var searchQueryId = !this.searchQuery.get('query_id') && 
                          !this.searchForm.get('query_id') ? true : this.searchQuery.get('query_id');
      var perspective            = searchQueryId ? searchPerspectives.findByQuery(this.searchQuery)
                                             : searchPerspectives.findByQuery(this.searchForm),
          // Search results should be displayed in new perspective when someone requred for it or navigating between location search and CVS
          //checking if isPerspectiveChange is true as in this case, forcePerspectiveChange value should be true to render results
          forcePerspectiveChange = (this.searchQuery.isPerspectiveChange) || (searchQueryId ?
                                    this.searchQuery.get('forcePerspectiveChange') : this.searchForm.get('forcePerspectiveChange'));
      this.applicationScope.set('id', 'search'); // set application view state
      this.context.loadPerspective(perspective.get('module'), forcePerspectiveChange);
      this.listenToOnce(this.context, 'sync:perspective', function () {
        this.searchQuery.unset('forcePerspectiveChange', {silent: true});
        this.searchForm.unset('forcePerspectiveChange', {silent: true});
      });
    }

  });

  return SearchPerspectiveContextPlugin;

});


csui.define('csui/utils/contexts/perspective/impl/search.perspective.context.plugin',['require', 'csui/utils/contexts/perspective/plugins/search.perspective.context.plugin',
], function (require, SearchPerspectiveContextPlugin) {
  'use strict';
  // 'DEPRECATED: depend on the module 'csui/utils/contexts/perspective/plugins/search.perspective.context.plugin' instead.
  return SearchPerspectiveContextPlugin;

});


csui.define('csui/utils/contexts/perspective/impl/metadata.perspective.context.plugin',['module', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette', 'csui/lib/jquery',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/metadata.factory',
  'csui/utils/contexts/perspective/perspective.context.plugin',
  'csui/utils/contexts/factories/node',
  'csui/utils/log',
  'csui/models/node/node.model'
], function (module, _, Backbone, Marionette, $, ApplicationScopeModelFactory,
    MetadataModelFactory, PerspectiveContextPlugin, NodeModelFactory, log) {
  'use strict';

  log = log(module.id);

  var MetadataPerspectiveContextPlugin = PerspectiveContextPlugin.extend({

    constructor: function MetadataPerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.metadataModel = this.context
          .getModel(MetadataModelFactory, {
            permanent: true,
            detached: true
          })
          .on('change:metadata_info', this.onMetadataChanged, this);

      this.listenTo(this.context, "clear", this._prepareContext);
    },

    _prepareContext: function () {
      if (['properties', 'permissions'].indexOf(this.applicationScope.get('id')) !== -1) {
        var metadataInfo = this.metadataModel.get('metadata_info');
        if (metadataInfo && metadataInfo.id) {
          this.node = this.context.getModel(NodeModelFactory);
          this.node.set('id', metadataInfo.id);
        }
      }
    },

    onMetadataChanged: function () {
      var metadata_info = this.metadataModel.get('metadata_info');
      if (!metadata_info) {
        return;
      }
      if (['properties', 'permissions'].indexOf(this.applicationScope.get('id')) !== -1) {
        {
          var model = metadata_info.model;
          if (metadata_info.navigator) {
            if (model && model.get('id') === metadata_info.id) {
              this.node.set(model.attributes);
            }
          }
          if (metadata_info.collection && metadata_info.collection.find({id: metadata_info.id})
                && metadata_info.collection === this.lastMetadataInfo.collection) {
            return;
          }

          if (metadata_info.collection && !metadata_info.collection.find({id: metadata_info.id})) {
            metadata_info.collection = undefined;
          }
        }
      }
      this.lastMetadataInfo = metadata_info;
      if (metadata_info.showPermissionView) {
        this.applicationScope.set('id', 'permissions');
      } else {
        this.applicationScope.set('id', 'properties');
      }
      var perspectivePath = 'json!csui/utils/contexts/perspective/impl/perspectives/',
          perspectiveName;
      if (this.metadataModel.get('metadata_info').navigator) {
        perspectiveName = 'metadata.navigation.json';
      } else {
        perspectiveName = 'metadata.json';
      }

      this.context.loadPerspective(perspectivePath + perspectiveName, true);
    }

  });

  return MetadataPerspectiveContextPlugin;

});


csui.define('csui/utils/contexts/perspective/impl/root.perspective.context.plugin',['csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/perspective/perspective.context.plugin'
], function (_, Backbone, ApplicationScopeModelFactory,
    PerspectiveContextPlugin) {
  'use strict';

  var supportedPerspectives = {
    myassignments: 'myassignmentstable',
    recentlyaccessed: 'recentlyaccessedtable',
    favorites: 'favorites2.table',
    recycleitems: 'recycleitems.table'
  };

  var RootPerspectiveContextPlugin = PerspectiveContextPlugin.extend({

    constructor: function RootPerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context
          .getModel(ApplicationScopeModelFactory)
          .on('change:id', this.onApplicationScopeChanged, this);
    },

    onApplicationScopeChanged: function () {
      // Skip scopes handled by other plugins
      var scope = this.applicationScope.id;

      // Two perspective driving models used above can generate two change
      // events quickly after each other; process only the first one
      if (!supportedPerspectives[scope] || this.loadingPerspective){
        return;
      }

      this.context.loadPerspective('json!csui/utils/contexts/perspective/impl/perspectives/' +
        supportedPerspectives[scope] + '.json');
    }

  });

  return RootPerspectiveContextPlugin;

});


csui.define('csui/utils/contexts/factories/version',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/version', 'csui/utils/commands/versions'
], function (module, _, Backbone, ModelFactory, ConnectorFactory, VersionModel, VersionCommands) {
  'use strict';

  var VersionModelFactory = ModelFactory.extend({

    propertyPrefix: 'version',

    constructor: function VersionModelFactory(context, options) {
      ModelFactory.prototype.constructor.call(this, context, options);

      var version = this.options.version || {};
      if (!(version instanceof VersionModel)) {
        var connector = context.getObject(ConnectorFactory, options),
            config = module.config();
        version = new VersionModel(undefined, _.extend({
           connector: connector,
           commands: VersionCommands.getAllSignatures()
          }, version.options, config.options));
      }
      this.property = version;
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }
  });

  return VersionModelFactory;
});


csui.define('csui/utils/contexts/perspective/impl/version.perspective.context.plugin',[
  'csui/lib/jquery',
  'csui/utils/contexts/factories/version',
  'csui/utils/contexts/factories/next.version',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/ancestors',
  'csui/utils/contexts/perspective/perspective.context.plugin'
], function ($, VersionModelFactory, NextVersionModelFactory, ApplicationScopeModelFactory,
    AncestorCollectionFactory, PerspectiveContextPlugin) {
  'use strict';

  var VersionPerspectiveContextPlugin = PerspectiveContextPlugin.extend({
    constructor: function VersionPerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.call(this, options);

      this.applicationScope = this.context
          .getModel(ApplicationScopeModelFactory);

      this.nextVersionFactory = this.context.getFactory(NextVersionModelFactory, {
            permanent: true,
            detached: true
      });
      this.nextVersion = this.nextVersionFactory.property;

      this.nextVersion.on('change:id change:version_number', this.onVersionChanged, this);

      this.listenTo(this.context, 'retain:perspective', this.onRetainPerspective);

      // Move the contextual version out of permanent factories; it cannot be
      // retained, because when the perspective switches, other models could
      // be listening on it and would waist a fetch, because their views are
      // going to be destroyed with the old perspective. Create the version right
      // away, though, to ensure, that the expected factory options will be set.
      createVersionModel.call(this);
    },

    onClear: function () {
      this._clearModels(true);
      var self = this;
      // the contextual node is cleared in the node perspective context plugin.
      // always set the 'id' to the contextual node once the node perspective plugin clears the node.
      $.Deferred().resolve().then(function () {
        self._setAncestortAttrs();
      });
    },

    onRefresh: function () {
      this._clearModels(false);
    },

    onRetainPerspective: function () {
      this._setAncestortAttrs();
    },

    isFetchable: function (factory) {
      // The contextual version is fetched by fetchPerspective already.
      return factory.property !== this.version;
    },

    _setAncestortAttrs: function () {
      if (this.applicationScope.id === 'version') {
        var ancestors = this.context.getCollection(AncestorCollectionFactory);
        ancestors.node.set('id', this.nextVersion.get('id'), { silent: true });
      }
    },

    _clearModels: function (recreateVersion) {
      // Reset the next-version model on navigating to other than verion perspective.
      // Allow navigation to the previously visited version from that perspective.
      if (this.applicationScope.id !== 'version') {
        clearCurrentVersion.call(this);
        return this.nextVersion.clear({silent: true});
      }

      clearCurrentVersion.call(this);
      // Do not trigger change events, when the version was recreated. Nobody had a chance
      // to subscribe to change events on the version created right above.

      // Initialize the contextual version. It needs to be complete, so that widget
      // can use it to ask for their models. It should not trigger events, if the
      // container model is used together with children. csui renders very slowly
      // and triggering the change events together with children will make the
      // rendering appear less busy.
      this.version.set(this.nextVersion.attributes);

      function clearCurrentVersion() {
        // Create the new version if it has not existed yet (the version perspective
        // is navigated to for the first time), or if thi navigation is not
        // a drill down and a new model has to be added to prevent changes
        // on the current perspective, which is going to be destroyed.
        if (recreateVersion) {
          createVersionModel.call(this);
        } else {
          this.version.clear({silent: true});
        }
      }
    },

    onVersionChanged: function () {
      if (!this.context.loadingPerspective) {

        this.context.triggerMethod('request:perspective', this);
        this.applicationScope.set('id', 'version');

        var nodeId = this.nextVersion.get('id');
        var versionNumber = this.nextVersion.get('version_number');

        this.nextVersion.clear({ silent: true });
        this.nextVersion.actions.reset([], { silent: true });
        this.nextVersion.set({ id: nodeId, version_number: versionNumber }, { silent: true });

        // Use the factory to allow pre-fetching data from the page.
        var self = this;
        var promise = this.fetching = this.nextVersionFactory.fetch({
          success: function () {
            self.onVersionFetchSuccess();
          },
          error: function (model, jqxhr) {
            self.onVersionFetchFailure(model, jqxhr);
          }
        });
      }
    },

    onVersionFetchSuccess: function () {
      this.context.loadPerspective('json!csui/utils/contexts/perspective/impl/perspectives/version.overview.json');
    },

    onVersionFetchFailure: function (sourceModel, error) {
      this.context.rejectPerspective(sourceModel, error);
    },
  });

  function createVersionModel() {
    this.version = this.context.getModel(VersionModelFactory);
    // Since this version will never be fetched, and will only filled by NextVersion on version change,
    // Mark this as fetched to avoid (re)fetching it on `ensureFetch`
    this.version.markFetched();
  }

  return VersionPerspectiveContextPlugin;
});


csui.define('csui/utils/contexts/perspective/plugins/node/impl/csui.node.extra.data',[], function () {
  'use strict';

  return {
    getModelFields: function (options) {
      return {
        properties: []
      };
    },

    getModelExpand: function (options) {
      return {
        properties: ['reserved_user_id']
      };
    }
  };

});


csui.define('csui/utils/contexts/perspective/plugins/node/impl/csui.main.node.extra.data',[], function () {
  'use strict';

  return {
    getModelFields: function (options) {
      return {
        columns: []
      };
    },

    getModelExpand: function (options) {
      return {};
    }
  };

});


csui.define('csui/utils/contexts/factories/global.error',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory'
], function (module, _, Backbone, ModelFactory) {
  'use strict';

  var GlobalError = Backbone.Model.extend({
    defaults: {
      message: null,
      details: null
    }
  });

  var GlobalErrorFactory = ModelFactory.extend({
    propertyPrefix: 'globalError',

    constructor: function GlobalErrorModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var globalError = this.options.globalError || {};
      if (!(globalError instanceof Backbone.Model)) {
        var config = module.config();
        globalError = new GlobalError(globalError.attributes, _.extend({},
            globalError.options, config.options));
        // The default global error model should be permanent to
        // survive a perspective switch to the error perspective.
        this.options.permanent = true;
      }
      this.property = globalError;
    }
  });

  return GlobalErrorFactory;
});


csui.define('csui/utils/contexts/perspective/perspective.guide',['csui/lib/underscore'], function (_) {

  function PerspectiveGuide() {
  }

  PerspectiveGuide.prototype = {
    isNew: function (oldPerspective, newPerspective) {
      //In case of widget maximize mode we are setting showWidgetInMaxMode attribute, we need to
      // omit this atrribute for perspective comparison
      var attributeA = sortKeys( _.omit(newPerspective, ['showWidgetInMaxMode', 'id', 'canEditPerspective']) );
      var attributeB = sortKeys( _.omit(oldPerspective, ['showWidgetInMaxMode', 'id', 'canEditPerspective']) );      
      return !_.isEqual(attributeA,attributeB);       
    }   
  };

  function sortKeys(a){
    var keysA = Object.keys(a).sort();        
    return keysA.reduce(function(result, item){
      result[item] = a[item];
      return result;
    }, {});
  }

  return PerspectiveGuide;

});




csui.define('csui/utils/contexts/perspective/perspective.context',[
  'require', 'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/utils/base', 'csui/utils/log',
  'csui/utils/contexts/context', 'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/global.error',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/widget.settings.collection.factory',
  'csui/utils/contexts/impl/csui.context.plugin',
  'csui/utils/contexts/perspective/impl/landing.perspective.context.plugin',
  'csui/utils/contexts/perspective/perspective.guide',
  // Load external plugins to drivw perspective switches
  'csui-ext!csui/utils/contexts/perspective/perspective.context'
], function (require, module, _, $, Backbone, base, log, Context,
    UserModelFactory, GlobalErrorModelFactory, ApplicationScopeModelFactory,
    WidgetSettingsCollectionFactory,
    CsuiContextPlugin, LandingPerspectiveContextPlugin, PerspectiveGuide, contextPlugins) {
  'use strict';

  log = log(module.id);

  var PerspectiveContext = Context.extend({
    constructor: function PerspectiveContext(options) {
      Context.prototype.constructor.apply(this, arguments);

      _.defaults(this.options, {online: true});

      this.perspective = new Backbone.Model();
      this.perspectiveGuide = new PerspectiveGuide();

      // Automatically initialized context models
      this._applicationScope = this.getModel(ApplicationScopeModelFactory, {
        permanent: true,
        detached: true
      });

      if (this.options.online) {
        this._user = this.getModel(UserModelFactory, {
          options: {
            includeResources: ['perspective']
          },
          permanent: true
        });
      }

      this._widgetSettings = this.getCollection(WidgetSettingsCollectionFactory);

      // 1. Keep the same order as for perspective routers.
      // 2. Process the csui plugin at the beginning, because it sets the property
      //    viewStateModel on the context and other plugins may depend on it.
      //    It is a bad practice, because foreign objects are not supposed to
      //    be just hardcoded to context. That is why just a local workaround here
      //    and not in other contexts, or on the extension registration level.
      // 3. Hardcode csui and landing perspective plugins, because they were not
      //    registered in the standard way initially and perspective context
      //    constructions with a local list of plugins might depend on it.
      var corePlugins = [CsuiContextPlugin, LandingPerspectiveContextPlugin];
      var allPlugins = _
          .chain(options && options.plugins || contextPlugins)
          .flatten(true)
          .filter(function (Plugin) {
            return Plugin !== CsuiContextPlugin && Plugin !== LandingPerspectiveContextPlugin;
          })
          .concat(corePlugins)
          .unique()
          .reverse()
          .value();
      this._plugins = _.map(allPlugins, function (Plugin) {
        return new Plugin({context: this});
      }, this);
      _.invoke(this._plugins, 'onCreate');
    },

    onRequestPerspective: function() {
      // widget settings are available for views earliest with the "request" event on the context.
      // it is not allowed to get the settings BEFORE that event, thus reset it here.
      this._widgetSettings.reset([], { silent: true });
    },

    // TODO: Deprecate this function, force empty URL to route
    fetchPerspective: function () {
      var landingPerspectivePlugin = _.find(this._plugins, function (plugin) {
        return plugin instanceof LandingPerspectiveContextPlugin;
      });
      landingPerspectivePlugin.onApplicationScopeChanged();
      return this;
    },

    _destroyNonPermanentFactories: function () {
      Context.prototype._destroyNonPermanentFactories.apply(this, arguments);
      _.invoke(this._plugins, 'onClear');
    },

    _isFetchable: function (factory) {
      return Context.prototype._isFetchable.apply(this, arguments) &&
             // The user model should be fetched only at the beginning
             (factory.property !== this._user || !this._user.get('id')) &&
             _.all(this._plugins, function (plugin) {
               return plugin.isFetchable(factory) !== false;
             });
    },

    loadPerspective: function (perspectiveModule, forceChange) {
      var deferred = $.Deferred(),
          self     = this;
      log.debug('Using perspective from "{0}".', perspectiveModule) &&
      console.log(log.last);
      this.triggerMethod('request:perspective', this.context);
      this.loadingPerspective = deferred.promise();
      require([perspectiveModule], function (perspective) {
        var wrapperModel = new Backbone.Model({perspective: perspective});
        self.loadingPerspective = false;
        self.applyPerspective(wrapperModel, forceChange);
      }, function (error) {
        self.loadingPerspective = false;
        self.rejectPerspective(error);
      });
    },

    overridePerspective: function (sourceModel, perspectiveModule) {
      var self = this;
      log.debug('Overriding the perspective in {0} with "{1}".',
          log.getObjectName(sourceModel), perspectiveModule) &&
      console.log(log.last);
      return require([perspectiveModule], function (perspective) {
        sourceModel.set('perspective', perspective);
        self.applyPerspective(sourceModel);
      }, _.bind(this.rejectPerspective, this));
    },

    /**
     *
     * @param {Backbone.Model} sourceModel Model changing the perspective.
     * @param {Boolean} forceChange Default to FALSE. Force the persepctive to change, even though current and new perspectives are same
     * @param {JSON} perspective Optional. Perspective to use to render. If not provided, sourceModel.perspective will be used.
     */
    applyPerspective: function (sourceModel, forceChange, perspective) {
      var self = this;
      this.triggerMethod('sync:perspective', this, sourceModel);
      this._interceptApplyPerspective(sourceModel, forceChange)
          .done(function (result) {
            if (result && result.forceChange !== undefined) {
              forceChange = result.forceChange;
            }
            self._continueApplyingPerspective(sourceModel, forceChange, perspective);
          })
          .fail(function (error) {
            if (error) {
              self.rejectPerspective(error);
            }
          });
    },

    _continueApplyingPerspective: function (sourceModel, forceChange, perspective) {
      var newPerspective = perspective || sourceModel.get('perspective') || {};
      const widgetSettingsFetchOptions = {
        perspective: {
          type: newPerspective.type,
          options: newPerspective.options,
        },
        context: this,
      }
      if (forceChange || this.perspectiveGuide.isNew(this.perspective.attributes, newPerspective)) {
        var viewStateModel = this.viewStateModel;
        viewStateModel && viewStateModel.set(viewStateModel.CONSTANTS.ALLOW_WIDGET_URL_PARAMS, true);
        this.triggerMethod('before:change:perspective', this, sourceModel);
        log.info('Perspective has changed') && console.log(log.last);
        // Remove non-permanent factories, cancel a fetch running in the background.
        this.perspective.clear();
        this.perspective.set(newPerspective);
        this._widgetSettings.fetch(widgetSettingsFetchOptions).then(() => {
          this.triggerMethod('change:perspective', this.perspective, sourceModel);
        }, (error) => this.rejectPerspective(error));
        // The context will be fetched by the owner, after it resolves the widgets
        // and renders them to get the context filled by models.
      } else {
        // The context will be reused to fetch new data. Even if the old data were
        // still being fetched, it would be a background operation without display,
        // which does not have to block the new data to keep the pag consistent.
        this.suppressFetch();
        // TODO: DO not set properties like ID, canEdit, which do not belong
        // to the perspective configuration, to the perspective model.
        // Perspective is same. Keep the context's perspective updated with
        // non-perspective UI properties like ID, canEdit.
        this.perspective.set(newPerspective, {silent: true});
        log.info('Perspective has not changed') && console.log(log.last);
        this._destroyTemporaryFactories();
        _.invoke(this._plugins, 'onRefresh');
        this._widgetSettings.fetch(widgetSettingsFetchOptions).then(() => {
          // The current perspective stays, just the widgets may need refresh.
          this.triggerMethod('retain:perspective', this, sourceModel);
          this.fetch();
        }, (error) => this.rejectPerspective(error));
      }
    },

    rejectPerspective: function (sourceModel, error) {
      var self = this;

      if (!error) {
        error = sourceModel;
      }
      if (!(error instanceof Error)) {
        error = new base.Error(error);
      }
      this.triggerMethod('error:perspective', this, error);

      function informFailure() {
        self._informFailure(error)
            .then(function () {
              self.trigger('reject:perspective');
            });
      }

      if (sourceModel && sourceModel instanceof Backbone.Model) {
        //Set nextNode id to '-1' so a user can re-attempt to open it.
        sourceModel.set('id', -1, {silent: true});

        // trigger event to update breadcrumbs
        self.trigger('current:folder:changed', sourceModel);

        csui.require([
          'json!csui/utils/contexts/perspective/impl/perspectives/error.global.json'
        ], function (perspective) {
          log.debug('Showing error perspective for {0}.',
              log.getObjectName(sourceModel)) &&
          console.log(log.last);

          sourceModel.set('perspective', perspective, {silent: true});
          var globalError = self.getModel(GlobalErrorModelFactory);
          globalError.set(_.defaults({
            message: error.message,
            details: error.errorDetails
          }, self.options.errorDefaults));

          self.applyPerspective(sourceModel);
        }, function () {
          informFailure();
        });
      } else {
        informFailure();
      }
    },

    _interceptApplyPerspective: function (sourceModel, forceChange) {
      // The first plugin, which intercepts the perspective application
      // will abort the currently running one.
      return this._plugins.reduce(function (promise, plugin) {
        return promise.then(function (result) {
          // Use the value passed from the previous aggregateResult.
          var forceChange = result.forceChange;

          // Handle plugins that do not inherit from PerspectiveContextPlugin.
          if (!_.isFunction(plugin.onApply)) {
            return aggregateResult();
          }

          return aggregateResult(plugin.onApply(sourceModel, forceChange));

          function aggregateResult (result) {
            if (result === false) {
              return $.Deferred().reject();
            }
            if (result === true || !result) {
              result = {};
            } else if (result.then) {
              return result.then(aggregateResult);
            }
            if (result.forceChange === undefined) {
              result.forceChange = forceChange;
            }
            return result;
          }
        });
      }, $.Deferred().resolve({ forceChange: forceChange }));
    },

    _informFailure: function (error) {
      var errorHandled = false,
          deferred     = $.Deferred();

      //If offline is supported, then let the plugin handle the network error
      if (error.statusCode === 0) {
        errorHandled = _.find(this._plugins, function (plugin) {
          if (plugin.offlineErrorHandler) {
            return plugin.offlineErrorHandler(error);
          }
        });
      }

      if (!errorHandled) {
        csui.require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
          alertDialog.showError(error.toString())
              .always(deferred.resolve);
        });
      }
      return deferred.promise();
    }
  });

  return PerspectiveContext;
});


// TODO: move nuc/models/mixins/appcontainer/appcontainer.mixin.js this to CSUI this file
csui.define('csui/models/mixins/appcontainer/appcontainerv3.mixin',["csui/models/browsable/v1.request.mixin", "csui/utils/url"], function (
  BrowsableV1RequestMixin,
  Url
) {
  "use strict";

  const AppContainerv2Mixin = {
    mixin: function (prototype) {
      BrowsableV1RequestMixin.mixin(prototype);
      return Object.assign(prototype, {
        makeAppContainer: function (_options) {
          return this;
        },
        createQueryParams: function () {
          let queryParam = "";
          let { topCount, skipCount, orderBy, filters } = this.children;
          const pageSize = topCount;
          const pageNo = Math.floor((skipCount || 0) / pageSize) + 1;
          queryParam = `?page_size=${pageSize}`;
          if (pageNo > 1) {
            queryParam += `&page=${pageNo}`;
          }
          if (orderBy) {
            let first = orderBy.split(",")[0].split(" ");
            if (orderBy.toLowerCase() === "relevance") {
              queryParam += `&sort=${orderBy}`;
            } else {
              queryParam += `&sort=${(first[1] || "asc") + "_" + first[0]}`;
            }
          }
          // TODO: where_facet is present in the prototypes but not honored in rest API
          queryParam += this.getFilterParam(filters);
          return queryParam;
        },
        getFilterParam: function (filters) {
          let facetQuery = {};
          for (let name in filters) {
            if (filters.hasOwnProperty(name)) {
              const param = makeFilterParam(filters[name], name);
              let filterArray = [];
              if (param?.value instanceof Array) {
                filterArray =
                  param.value[0] instanceof Object
                    ? this.getFilterValue(param.value)
                    : param.value;
              } else {
                filterArray = param.value;
              }
              if (param.key) {
                facetQuery[param.key] = filterArray;
              }
            }
          }
          const filterParam = Url.combineQueryString(facetQuery);
          if(!filterParam) return '';
          
          return `&${filterParam}`;
        },
        massageAddableTypes: function (addableTypes) {
          let addableType = {
            data: {},
            definitions: {},
          };
          for (let tempAddableType of addableTypes) {
            const { type, name, url } = tempAddableType;
            const typeObjDef = name?.split(" ").join("_").toLocaleLowerCase();
            addableType.data[typeObjDef] = url;
            addableType.definitions[typeObjDef] = {
              name: name,
              type: type,
            };
          }

          return addableType;
        },

        // Overwriting this method from nuc/appcontainermixin
        massageResponse: function (properties, references) {
          const referenceNodes = references?.nodes || {};
          const referenceMembers = references?.members || {};
        
          const expandFields = [
            'original',
            'create_user',
            'owner_user',
            'reserved_user',
            'modify_user',
            'parent'
          ];
        
          expandFields.forEach((field) => {
            const idKey = `${field}_id`;
            const expandKey = `${idKey}_expand`;
            const reference = referenceNodes[properties[idKey]] || referenceMembers[properties[idKey]];
        
            if (reference) {
              properties[expandKey] = { ...reference, id: properties[idKey] };
            }
          });
        
          properties.reserved = !!properties.reserved_user_id;
          properties.actions = properties.data?.actions;
        
          // Ensure expected properties exist for utils/nodesprites
          if (properties.parent_id && !properties.parent_id_expand) {
            properties.parent_id_expand = {
              id: this.node.get('id'),
              type: this.node.get('type'),
              name: this.node.get('name'),
              openable: this.node.get('openable')
            };
          }
        
          if (properties.parent_id_expand) {
            properties.parent_id_expand.container = true;
            properties.parent_id_expand.mime_type ||= null;
          }
        
          return properties;
        },
        createCollection: function (response) {
          // create collection object
          let collection = {
            paging: {},
            sorting: { sort: [] },
          };
          // To keep intact the actaual response results
          const tResult = structuredClone(response.results); // deep clone
          if(tResult.paging){
            collection.paging = tResult.paging;
          }
          collection.paging.limit = this.children.topCount; // adding the number of records per page
          if(tResult.sorting instanceof Object){
            collection.sorting.sort.push(tResult.sorting);
          }
          delete collection.paging.types;
          response.collection = collection;
        },
      });
    },
  };
  /**
   * appends 'where_' to the name of the filter and returns filter,value as an object
   * @param {value of the filter} value
   * @param {name of the filter} name
   */
  function makeFilterParam(value, name) {
    let param = {};
    if (value) {
      param.key = `where_${name}`;
      param.value = value;
    }
    return param;
  }

  return AppContainerv2Mixin;
});


csui.define('csui/utils/contexts/factories/appcontainer',['module',
  'csui/utils/contexts/factories/factory',
  'csui/models/mixins/appcontainer/appcontainer.mixin',
  'csui/models/mixins/appcontainer/appcontainerv3.mixin',
  'csui/utils/contexts/factories/ancestors',
  'csui/utils/url', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/base',
  'csui/utils/commonconfig.util'
], function (module, Factory, AppContainerMixin, AppContainerv2Mixin, NodeAncestorsFactory, Url, $, _, base, CommonConfigUtil) {
  'use strict';
  let config = Object.assign({
    useV3RestApi :  CommonConfigUtil.enableFeatureInSmartView() || false
  }, module.config());
  var AppContainerFactory = Factory.extend({
    propertyPrefix: 'appcontainer',
    
    constructor: function AppContainerFactory(context, options) {
      Factory.prototype.constructor.call(this, context, options);

      var models = this.options.models;
      this.node = models.container;
      this.addableTypes = models.addableTypes;
      this.children = models.children;
      this.connector = this.node.connector;
      this.facetCollection = models.facets;

      var ancestorFactory = context.getFactory(NodeAncestorsFactory);
      this.ancestors = ancestorFactory.property;
      // TODO: Introduce an interface to control factory options like
      // "detached" after construction. The detached flag is not used
      // by the factory itself; it is checked by the context.
      this.listenTo(context, 'request', function () {
        ancestorFactory.options.detached = true;
      });

      this.property = {};

      this.makeAppContainer(options);
    },

    isFetchable: function () {
      return this.node.isFetchable();
    },

    fetch: function (options) {

      const isv3AppContainer = config.useV3RestApi;
      var queryparams = this.children.getResourceFieldsUrlQuery();
      var query = Url.combineQueryString(this.children.getBrowsableUrlQuery(),
        { fields: _.without(queryparams.fields, 'properties')});
        let baseUrl;
        let appUrl;
        let url;
        if (isv3AppContainer) {
          baseUrl = new Url(this.connector.connection.url).getApiBase(3);
          appUrl = `${baseUrl}app/container/${this.node.get("id")}${this.createQueryParams()}`;          
          url = appUrl;
        } else {
          baseUrl = new Url(this.connector.connection.url).getApiBase(2);
          appUrl = Url.combine(baseUrl, "app/container", this.node.get("id"));
          url = Url.appendQuery(appUrl, query);
        }
      
      var prefetchedModels = [this.children, this.ancestors, this.addableTypes];
      var self = this;

      // TODO: Extract the AJAX call from here to a AppContainerModel with a custom
      // sync method. This error-prone event triggering could be removed then.
      updateStateAndRelayEvent(prefetchedModels, 'request', {}, options);
      return this.connector
        .makeAjaxCall({
          url: url
        })
        .then(function (response, textStatus, request) {
          var results = response.results;          
          if(isv3AppContainer){
            self.createCollection(response);
            results.addable_node_types = self.massageAddableTypes(results.addable_node_types);
          }
          // Do not trigger the request/sync event pairs once more, because
          // they are triggered outside the batch callback. However, the reset
          // event has to be triggered explicitly about the change of contents.
          var prefetchOptions = {silent: true};

          // Populate the children at first and then the other models.
          // Usually it would be irrelevant, but the nodestable widget
          // is so slow, that the children appeared to render much later,
          // than the rest of the page. Reordering the change events like
          // this is a fragile and dirty hack. It does not help on more
          // complicated perspectives anyway.

          const references = results.references;
          var nodes = results.contents.map(function (props) {
            return self.massageResponse(props, references);
          });

          // Fetch default and delayed actions. The app/container endpoint does not
          // return default actions, which can cause issues when clicking node links.
          // To avoid inconsistent behavior, default actions are temporarily disabled
          // during prefetch.
          const originalDefaultActions = self.children.defaultActionCommands;
          self.children.defaultActionCommands = [];
          self.children.once('reset', () => {
            self.children.defaultActionCommands = [];
          });
          self.children.once('sync error', () => {
            // Restore the original configuration. Default and delayed actions
            // are essential for fetching children or single nodes properly.
            self.children.defaultActionCommands = originalDefaultActions;
          });

          var childrenPromise = self.children.prefetch({
            collection: response.collection,
            links: response.links,
            results: nodes
          }, prefetchOptions);

          var ancestorsPromise = self.ancestors.prefetch({
            ancestors: results.ancestors
          }, prefetchOptions);

          var addableTypesPromise;
          var addMenu = results.add_menu;
          if (addMenu) {
            addMenu = results.add_menu.map(adaptAddableType);
            addableTypesPromise = self.addableTypes.prefetch(addMenu, {
              parse: false,
              silent: true
            });
          } else {
            var addableTypes = results.addable_node_types;
            if (addableTypes) {
              addableTypesPromise = self.addableTypes.prefetch(addableTypes, prefetchOptions);
            }
          }

          return $
              .when(ancestorsPromise, addableTypesPromise, childrenPromise)
              .then (function () {
                updateStateAndRelayEvent(prefetchedModels, 'reset', response, options);
                updateStateAndRelayEvent(prefetchedModels, 'sync', response, options);
                return $.Deferred().resolve(response, textStatus, request);
              });
        }, function (request, textStatus, errorThrown) {
          updateStateAndRelayEvent(prefetchedModels, 'error', request, options);
          return $.Deferred().reject(request, textStatus, errorThrown);
        });
    },
    fetchRawChildren: function () {
      const isv3AppContainer = config.useV3RestApi;
      const queryparams = this.children.getResourceFieldsUrlQuery();
      const query = Url.combineQueryString(this.children.getBrowsableUrlQuery(), {
        fields: _.without(queryparams.fields, "properties"),
      });

      let baseUrl = new Url(this.connector.connection.url).getApiBase(2);
      let appUrl = Url.combine(baseUrl, "app/container", this.node.get("id"), "page");
      let url = Url.appendQuery(appUrl, query);
      if (isv3AppContainer) {
        baseUrl = new Url(this.connector.connection.url).getApiBase(3);
        appUrl = `${baseUrl}app/container/${this.node.get(
          "id"
        )}/page${this.createQueryParams()}`;
        url = appUrl;
      }

      return this.connector.makeAjaxCall({ url: url })
        .then((response) =>{
          if (isv3AppContainer) {
            this.createCollection(response);
            if(response.results?.references) {
              response.references = response.results?.references
            }
            if(Array.isArray(response.results?.contents)){
              response.results = response.results?.contents
            }
          }
         return response;

        }).catch(e=>{
          showError(this.children, e);
          throw this.children.error;
        });
    },
    fetchFacet: function(options) {
     const promise1 = this.fetchRawChildren();
     const promise2 = this.facetCollection.fetch();
     Promise.allSettled([promise1, promise2])
     .then(([childResult, facetResult]) =>{
        if(childResult.status === "rejected") {
          showError(this.children, childResult.reason);
          throw this.children.error
        }
        if(facetResult.status === "rejected") {
          throw this.facetCollection.error
        }
        const response = childResult.value;
        this.prefetchChildren(response, options);
     })
    },
    fetchChildren: function(options) {
     return this.fetchRawChildren()
      .then(response =>{
        this.prefetchChildren(response, options);
      })
    },
    prefetchChildren: function(response, options) {
      const references = response.references;
      const nodes = response.results.map(props => this.massageResponse(props, references));
        this.children.prefetch({
          collection: response.collection,
          links: response.links,
          results: nodes,
        }, options);
    }
  });


  function adaptAddableType (ancestor) {
    ancestor.type_name = ancestor.name;
    delete ancestor.name;
    return ancestor;
  }

  function updateStateAndRelayEvent(models, event, object, options) {
    models.forEach(function (model) {
      if (event === 'error') {
        showError(model, object)
      }
      model.trigger(event, model, object, options);
    });
  }

  function showError(model, object) {
    model.error = new base.Error(object);
    model.fetched = false;
    model.fetching = null;
  }

  AppContainerMixin.mixin(AppContainerFactory.prototype);
  AppContainerv2Mixin.mixin(AppContainerFactory.prototype);

  return AppContainerFactory;
});


csui.define('csui/utils/contexts/factories/children',['module', 'nuc/lib/underscore', 'nuc/lib/backbone',
  'csui/utils/contexts/mixins/clone.and.fetch.mixin',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/node',
  'nuc/models/nodechildren', 'csui/utils/commands'
], function (module, _, Backbone,
    CloneAndFetchMixin,
    CollectionFactory, NodeModelFactory,
    NodeChildrenCollection, allCommands) {
  'use strict';

  var ChildrenCollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'children',

    constructor: function ChildrenCollectionFactory(context, options) {
      options || (options = {});
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var children = this.options.children || {},
          commands = children.options && children.options.commands ||
                     allCommands;
      if (!(children instanceof Backbone.Collection)) {
        var node = context.getModel(NodeModelFactory, options),
            config = module.config();
        children = new NodeChildrenCollection(children.models,
            _.defaults({
                  // Prefer refreshing the entire table to rendering one row after another.
                  autoreset: true,
                  // Minimize the response information; the server adds information with
                  // every update and UI would get slower
                  fields: {
                    properties: []
                  },
                  // Shortcut information needs to be resolved to support UI and actions.
                  expand: {
                    properties: ['original_id']
                  },
                  // Ask the server to check for permitted actions V2
                  commands: commands.getAllSignatures()
                },
                config.options,
                children.options,
                // node is intentionally listed at the end to give previous options preference
                {node: node}
            ));
      }
      this.property = children;

      this.makeCloneAndFetch(options);
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  CloneAndFetchMixin.mixin(ChildrenCollectionFactory.prototype);

  return ChildrenCollectionFactory;
});


csui.define('csui/utils/contexts/factories/children2',['module', 'nuc/lib/underscore', 'nuc/lib/backbone',
  'csui/utils/contexts/mixins/clone.and.fetch.mixin',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/node',
  'nuc/models/node.children2/node.children2', 'csui/utils/commands'
], function (module, _, Backbone, CloneAndFetchMixin,
    CollectionFactory, NodeModelFactory,
    NodeChildren2Collection, allCommands) {
  'use strict';

  var Children2CollectionFactory = CollectionFactory.extend({
    propertyPrefix: 'children2',

    constructor: function Children2CollectionFactory(context, options) {
      options || (options = {});
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var children = this.options.children2 || {},
          commands = children.options && children.options.commands ||
                     allCommands;
      if (!(children instanceof Backbone.Collection)) {
        var node = context.getModel(NodeModelFactory, options),
            config = module.config();
        children = new NodeChildren2Collection(children.models,
            _.defaults({
                  // Prefer refreshing the entire table to rendering one row after another.
                  autoreset: true,
                  // Minimize the response information; the server adds information with
                  // every update and UI would get slower
                  fields: {
                    properties: []
                  },
                  // Shortcut information needs to be resolved to support UI and actions.
                  expand: {
                    properties: ['original_id']
                  },
                  // Make sure, that the metadata token is returned for nodes
                  // requesated via this factory, because they are supposed to
                  // be shared and may be the subject of changes.
                  stateEnabled: true,
                  // Ask the server to check for permitted actions V2
                  commands: Array.isArray(commands) ? commands : commands.getAllSignatures()
                },
                config.options,
                children.options,
                {useSpecialPaging: options.useSpecialPaging},
                // node is intentionally listed at the end to give previous options preference
                {node: node}
            ));
      }
      this.property = children;

      this.makeCloneAndFetch(options);
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }
  });

  CloneAndFetchMixin.mixin(Children2CollectionFactory.prototype);

  return Children2CollectionFactory;
});


csui.define('csui/utils/contexts/factories/columns',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/children'
], function (module, _, Backbone, CollectionFactory, NodeChildrenFactory) {

  var ColumnCollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'columns',

    constructor: function ColumnsCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var columns = this.options.columns || {};
      if (!(columns instanceof Backbone.Collection)) {
        var children = context.getModel(NodeChildrenFactory, options),
            config = module.config();
        columns = children.columns;
      }
      this.property = columns;
    }

  });

  return ColumnCollectionFactory;

});


csui.define('csui/utils/contexts/factories/columns2',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/node', 'csui/models/node.columns2',
  'csui/utils/log'
], function (module, _, Backbone, CollectionFactory, NodeModelFactory,
    NodeColumn2Collection, log) {
  'use strict';

  log = log(module.id);

  var Column2CollectionFactory = CollectionFactory.extend({
    propertyPrefix: 'columns2',

    constructor: function Column2CollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var columns = this.options.columns2 || {};
      if (!(columns instanceof Backbone.Collection)) {
        var node = columns.options && columns.options.node ||
                   context.getModel(NodeModelFactory, options);
        this.property = new NodeColumn2Collection();
        this.node = node;
        node.columns.on('reset', this._resetColumns, this);
        this._resetColumns();
      } else {
        this.property = columns;
      }
    },

    _resetColumns: function () {
      var node          = this.node,
          definitionMap = {},
          definitions   = completeDefinitions(node.definitions, definitionMap);
      node.columns.each(markDisplayableColumn.bind(null, definitionMap));
      if (areDifferent(this.property, definitions)) {
        this.property.reset(definitions);
      } else {
        this.property.trigger('remain', this.property);
      }
    }
  });

  function completeDefinitions(definitions, definitionMap) {
    return definitions.map(function (definition) {
      definition = definition.toJSON();
      var key = definition.key;
      definition.column_key = key;
      switch (key) {
      case 'name':
        definition.default_action = true;
        definition.contextual_menu = false;
        definition.editable = true;
        definition.filter_key = key;
        break;
      case 'type':
        definition.default_action = true;
        break;
      case 'modify_date':
        definition.initialSortingDescending = true;
        break;
      }
      definitionMap[key] = definition;
      if (definition.sort_key) {
        definition.sort = true;
        //delete definition.sort_key;
      }
      return definition;
    });
  }

  function markDisplayableColumn(definitionMap, column, index) {
    var columnKey      = column.get('key'),
        formattedIndex = columnKey.lastIndexOf('_formatted'),
        order          = 500 + index,
        definition;
    // Update the real value-carrying column, which does not end with
    // "_formatted", if only the "_formatted" one is present and not
    // the real one. "_formatted"  columns should not be used, because
    // they do not provide the real value for sorting, filtering, saving
    // or other scenarios, where it is needed. Also the right formatting
    // is specified in Smart UI. "_formatted" columns are for AJAX calls
    // from Classic UI, because they for at according to its design.
    if (formattedIndex >= 0) {
      var realColumnKey = columnKey.substr(0, columnKey.length - 10);
      definition = definitionMap[realColumnKey];
      if (definition) {
        definition.definitions_order = order;
        return;
      }
    }
    definition = definitionMap[columnKey];
    if (definition) {
      definition.definitions_order = order;
    } else {
      log.warn('No definition found for the column "{0}".', columnKey);
    }
  }

  var columnProperties = [
    'description', 'key', 'multi_value', 'name', 'type', 'type_name'];

  function areDifferent(collection, objects) {
    return collection.length !== objects.length ||
           collection.some(function (model, index) {
             var expected = _.pick(objects[index], columnProperties),
                 actual = _.pick(model.attributes, columnProperties);
             return !_.isEqual(expected, actual);
           });
  }

  return Column2CollectionFactory;
});


csui.define('csui/utils/contexts/factories/usernodepermission',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory',  'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/connector', 'csui/models/authenticated.user.node.permission'
], function (module, _, $, Backbone, ModelFactory, UserModelFactory, ConnectorFactory,
    AuthenticatedUserNodePermissionModel) {
  'use strict';

  var UserNodePermissionModelFactory = ModelFactory.extend({
    propertyPrefix: 'userNodePermission',

    constructor: function UserNodePermissionModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var userNodePermission = this.options.userNodePermission || {},
          config = module.config();
      if (!(userNodePermission instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options),
            user      = context.getModel(UserModelFactory);
        userNodePermission = new AuthenticatedUserNodePermissionModel(
            userNodePermission.attributes,
            _.defaults({
                  connector: connector,
                  user: user,
                  node: this.options.node
                }, userNodePermission.options, config.options
            )
        );
      }
      this.property = userNodePermission;
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }
  });

  return UserNodePermissionModelFactory;
});


csui.define('csui/utils/contexts/factories/volume',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/node',
  'csui/models/node/node.model'
], function (module, _, Backbone, ModelFactory, NodeModelFactory, NodeModel) {

  var VolumeModelFactory = ModelFactory.extend({

    propertyPrefix: 'volume',

    constructor: function VolumeModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var volume = this.options.volume || {};
      if (!(volume instanceof Backbone.Model)) {
        var node = context.getModel(NodeModelFactory, options),
            config = module.config();

        // Make sure that the volume info is returned with the node info
        node.setExpand('properties', 'volume_id');

        // Create an empty node model to fill with the volume info
        // as soon as it is fetched with the node info
        volume = new NodeModel(
            _.extend({}, node.get('volume_id'), volume.attributes || config.attributes),
            _.extend({
              connector: node.connector
            }, volume.options, config.options));

        this.listenTo(node, 'change:volume_id', function () {
          volume.set(node.get('volume_id'));
        });
      }
      this.property = volume;
    }

  });

  return VolumeModelFactory;

});


csui.define('csui/models/widget/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/models/widget/nls/root/lang',{
  searchResults: "Search Results",

  ra_access_date_last: 'Last Accessed',
  ra_parent_id: 'Location',
  ra_name:'Name',
  ra_modify_date: 'Modified',
  ra_reserved: 'State', // "reserved" is just to bind the column to some property
  ra_size: 'Size',
  ra_type: "Type",
  ra_favorite: "Favorite",

  rd_reserved_date: 'Reserved date',
  rd_reserved_user_id:'Reserved by',
  rd_parent_id: 'Location',
  rd_name:'Name',
  rd_modify_date: 'Modified',
  rd_reserved: 'State', // "reserved" is just to bind the column to some property
  rd_size: 'Size',
  rd_type: "Type",
  rd_favorite: "Favorite",

  ma_type: "Type",
  ma_name: "Name",
  ma_location_name: "Location",
  ma_location_id: "Location",
  ma_date_due: "Due Date",
  ma_priority: "Priority",
  ma_status: "Status",
  ma_from_user_name: "From",

  fav_parent_id: 'Location',
  fav_favorite_name: 'Name',
  fav_size: 'Size',

  owner: "Owner",
  created: "Created",
  createdBy: "Created by",
  modified: "Modified",
  size: "Size",
  type: "Type",

  owner_user_id: "User",
  status: "Status",
  originalParent: "Filed location",
  pending: "Pending",
  filed: "Filed",
  failed: "Failed",
  failedAria: "Failed message",

  // recycle bin lang
  rcb_type: 'Type',
  rcb_name:'Name',
  rcb_deleted_date: 'Deleted',
  rcb_deleted_user_name: 'Deleted by',
  rcb_parent_id: 'Original location',
  rcb_purged_date: 'Final deletion date',
  rcb_created_by_user_name: 'Created by',
  rcb_size: 'Size'
});




csui.define('csui/models/widget/favorites.model',['csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/v2.commandable/v2.commandable.mixin',
  'csui/models/browsable/client-side.mixin', 'csui/models/browsable/v2.response.mixin',
  'csui/models/nodechildrencolumn', 'csui/models/nodechildrencolumns',
  'csui/models/node/node.model', 'i18n!csui/models/widget/nls/lang',
  'csui/utils/deepClone/deepClone'
], function (_, Backbone, Url, ConnectableMixin, FetchableMixin,
    AdditionalResourcesV2Mixin, FieldsV2Mixin, ExpandableV2Mixin, CommandableV2Mixin,
    ClientSideBrowsableMixin, BrowsableV2ResponseMixin, NodeChildrenColumnModel,
    NodeChildrenColumnCollection, NodeModel, lang) {
  'use strict';

  var FavoriteColumnModel = NodeChildrenColumnModel.extend({

    constructor: function FavoriteColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var columnKey = 'fav_' + attributes.column_key;
        attributes.title = lang[columnKey];
      }
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }

  });

  var FavoriteColumnCollection = NodeChildrenColumnCollection.extend({

    model: FavoriteColumnModel,

    // private
    getColumnModels: function (columnKeys, definitions) {
      var columns = NodeChildrenColumnCollection.prototype.getColumnModels.call(
          this, columnKeys, definitions);
      _.each(columns, function (column) {
        var columnKey = column['column_key'];
        if (columnKey === 'type' || columnKey === 'name' || columnKey === 'modify_date' ||
            columnKey === 'parent_id' || columnKey == 'size') {
          column.sort = true;
        }
      });
      return columns;
    }

  });

  var FavoriteModel = NodeModel.extend({

    parse: function (response, options) {
      var fav, fav_version;
      if (response.data && response.data.properties) {
        fav = response.data.properties;
        fav_version = response.data.versions;
      } else {
        fav = response;
        fav_version = response.versions;
      }
      fav.short_name = fav.name; // fav.name.length > 20 ? fav.name.substr(0, 20) + '...' : fav.name;
      if (!fav.size) {
        if (fav.container) {
          fav.size = fav.container_size;
        } else if (fav_version) {
          fav.size = fav_version.file_size;
        }
      }
      if (!fav.mime_type && fav_version && fav_version.mime_type) {
        fav.mime_type = fav_version.mime_type;
      }
      return NodeModel.prototype.parse.call(this, response, options);
    }

  });

  var FavoriteCollection = Backbone.Collection.extend({

    model: FavoriteModel,

    constructor: function FavoriteCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      // Support collection cloning
      if (options) {
        this.options = _.pick(options, ['connector', 'autoreset',
          'includeResources', 'fields', 'expand', 'commands']);
      }

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeCommandableV2(options)
          .makeClientSideBrowsable(options)
          .makeBrowsableV2Response(options);

      this.columns = new FavoriteColumnCollection();
    },

    clone: function () {
      // Provide the options; they may include connector and other parameters
      var clone = new this.constructor(this.models, this.options);
      // Clone sub-models not covered by Backbone
      if (this.columns) {
        clone.columns.reset(this.columns.toJSON());
      }
      // Clone properties about the full (not-yet fetched) collection
      clone.actualSkipCount = this.actualSkipCount;
      clone.totalCount = this.totalCount;
      clone.filteredCount = this.filteredCount;
      return clone;
    },

    url: function () {
      var url = this.connector.getConnectionUrl().getApiBase('v2'),
          query = Url.combineQueryString(
              this.getAdditionalResourcesUrlQuery(),
              this.getResourceFieldsUrlQuery(),
              this.getExpandableResourcesUrlQuery(),
              this.getRequestedCommandsUrlQuery(),
              this.getBrowsableUrlQuery()
          );
      url = Url.combine(url, '/members/favorites');
      return query ? url + '?' + query : url;
    },

    parse: function (response, options) {
      this.parseBrowsedState(response, options);
      this.columns && this.columns.resetColumnsV2(response, this.options);
      return this.parseBrowsedItems(response, options);
    },

    getResourceScope: function () {
      return _.deepClone({
        fields: this.fields,
        expand: this.expand,
        includeResources: this._additionalResources,
        commands: this.commands
      });
    },

    setResourceScope: function (scope) {
      this.excludeResources();
      scope.includeResources && this.includeResources(scope.includeResources);
      this.resetFields();
      scope.fields && this.setFields(scope.fields);
      this.resetExpand();
      scope.expand && this.setExpand(scope.expand);
      this.resetCommands();
      scope.commands && this.setCommands(scope.commands);
    }

  });

  ClientSideBrowsableMixin.mixin(FavoriteCollection.prototype);
  BrowsableV2ResponseMixin.mixin(FavoriteCollection.prototype);
  ConnectableMixin.mixin(FavoriteCollection.prototype);
  FetchableMixin.mixin(FavoriteCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(FavoriteCollection.prototype);
  FieldsV2Mixin.mixin(FavoriteCollection.prototype);
  ExpandableV2Mixin.mixin(FavoriteCollection.prototype);
  CommandableV2Mixin.mixin(FavoriteCollection.prototype);

  return FavoriteCollection;

});


csui.define('csui/utils/contexts/factories/favorites',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/widget/favorites.model', 'csui/utils/commands',
  'csui/utils/deepClone/deepClone'
], function (module, _, Backbone, CollectionFactory, ConnectorFactory, FavoritesCollection,
    commands) {
  'use strict';

  var FavoriteCollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'favorites',

    constructor: function FavoritesCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var favorites = this.options.favorites || {};
      if (!(favorites instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options),
            config = module.config();
        favorites = new FavoritesCollection(favorites.models, _.extend(
            {connector: connector}, favorites.options, config.options,
            FavoritesCollectionFactory.getDefaultResourceScope(),
            {autoreset: true}));
      }
      this.property = favorites;
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  }, {

    getDefaultResourceScope: function () {
      return _.deepClone({
        // The latest version properties can be considered common properties
        // too (the MIME type is there, for example)
        fields: {
          properties: [],
          'versions.element(0)': []
        },
        // Get property definitions to support table columns or similar
        // and actions to support clickability and others
        includeResources: ['metadata'],
        // Ask the server to check for permitted actions V2
        commands: commands.getAllSignatures()
      });
    }

  });

  return FavoriteCollectionFactory;

});


csui.define('csui/utils/contexts/factories/favoritescolumns',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/favorites'
], function (module, _, Backbone, CollectionFactory, FavoriteCollectionFactory) {

  var FavoritesColumnsCollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'favorites_columns',

    constructor: function FavoritesColumnsCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var columns = this.options.columns || {};
      if (!(columns instanceof Backbone.Collection)) {
        var children = context.getCollection(FavoriteCollectionFactory, options);
        columns = children.columns;
      }
      this.property = columns;
    }

  });

  return FavoritesColumnsCollectionFactory;

});


csui.define('csui/utils/contexts/factories/favorites2',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/connector',
  'csui/models/favorites2', 'csui/utils/defaultactionitems',
  'csui/utils/commands', 'csui/utils/deepClone/deepClone'
], function (module, _, Backbone, CollectionFactory, ConnectorFactory,
    Favorites2Collection, defaultActionItems, commands) {
  'use strict';

  var Favorite2CollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'favorites2',

    constructor: function Favorite2CollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var favorites = this.options.favorites || {};

      if (!(favorites instanceof Backbone.Collection)) {

        var connector = context.getObject(ConnectorFactory, options);
        var config = module.config();

        favorites = new Favorites2Collection(favorites.models,
            _.extend({
                  connector: connector,
                  autoreset: true
                },
                favorites.options,
                config.options,
                Favorite2CollectionFactory.getDefaultResourceScope()
            )
        );
      }
      this.property = favorites;
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  }, {

    getDefaultResourceScope: function () {
      return _.deepClone({
        fields: {
          properties: [],
          favorites: ['name', 'tab_id'],
          'versions.element(0)': ['mime_type', 'owner_id']
        },
        expand: {
          properties: ['original_id', 'parent_id', 'reserved_user_id', 'custom_view_search']
        },
        // Make sure, that the metadata token is returned for nodes
        // requesated via this factory, because they are supposed to
        // be shared and may be the subject of changes.
        stateEnabled: true,
        // no need for metadata to include, because column definitions are created fully client side
        includeResources: [],
        // Ask the server to check for permitted actions V2
        commands: commands.getAllSignatures()
      });
    },

    getLimitedResourceScope: function () {
      return _.deepClone({
        fields: {
          properties: ['container', 'id', 'name', 'original_id', 'type', 'type_name', 'parent_id',
            'container', 'custom_view_search', 'version_number','image_url', 'size', 'container_size', 'size_formatted'],
          favorites: ['name', 'tab_id'],
          'versions.element(0)': ['mime_type']
        },
        expand: {
          properties: ['original_id']
        },
        // Make sure, that the metadata token is returned for nodes
        // requesated via this factory, because they are supposed to
        // be shared and may be the subject of changes.
        stateEnabled: true,
        // Get property definitions to support table columns or similar
        // and actions to support clickability and others
        includeResources: [],
        // Ask the server to check for permitted actions V2 - only default actions
        commands: defaultActionItems.getAllCommandSignatures(commands)
      });
    },

    getDefaultsOnlyResourceScope: function () {
      return _.deepClone({
        fields: {
          properties: [],
          favorites: ['name', 'tab_id'],
          'versions.element(0)': []
        },
        expand: {
          properties: ['original_id', 'parent_id', 'reserved_user_id','locked_user_id']
        },
        // Make sure, that the metadata token is returned for nodes
        // requesated via this factory, because they are supposed to
        // be shared and may be the subject of changes.
        stateEnabled: true,
        // no need for metadata to include, because column definitions are created fully client side
        includeResources: [],
        // Ask the server to check for permitted actions V2
        commands: defaultActionItems.getAllCommandSignatures(commands)
      });
    }

  });

  return Favorite2CollectionFactory;
});


csui.define('csui/utils/contexts/factories/favorite2groups',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/favorites2',
  'csui/models/favorite2groups', 'csui/utils/commands',
  'csui/utils/deepClone/deepClone'
], function (module, _, Backbone, CollectionFactory, ConnectorFactory,
    Favorite2CollectionFactory, Favorite2GroupsCollection, commands) {
  'use strict';

  var Favorite2GroupsCollectionFactory = CollectionFactory.extend({
    propertyPrefix: 'favorites2groups',

    constructor: function Favorite2GroupsCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var favoriteGroups = this.options.favoriteGroups || {};

      if (!(favoriteGroups instanceof Backbone.Collection)) {

        var config = module.config();
        var connector = context.getObject(ConnectorFactory, options);
        var favorites = context.getCollection(Favorite2CollectionFactory, options);

        favoriteGroups = new Favorite2GroupsCollection(favoriteGroups.models,
            _.extend({
                  favorites: favorites,
                  connector: connector,
                  autoreset: true,
                  commands: commands.getAllSignatures()
                },
                favoriteGroups.options,
                config.options,
                Favorite2GroupsCollectionFactory.getDefaultResourceScope()
            )
        );
      }
      this.property = favoriteGroups;
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }
  }, {
    getDefaultResourceScope: function () {
      return _.deepClone({
        fields: {
          properties: []
        },
        // Make sure, that the metadata token is returned for nodes
        // requesated via this factory, because they are supposed to
        // be shared and may be the subject of changes.
        stateEnabled: true,
      });
    }
  });

  return Favorite2GroupsCollectionFactory;
});


csui.define('csui/utils/contexts/factories/favorite2columns',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/favorites2'
], function (module, _, Backbone, CollectionFactory, Favorite2CollectionFactory) {

  var Favorite2ColumnsCollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'favorites2_columns',

    constructor: function Favorite2ColumnsCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var columns = this.options.columns || {};
      if (!(columns instanceof Backbone.Collection)) {
        var children = context.getCollection(Favorite2CollectionFactory, options);
        columns = children.columns;
      }
      this.property = columns;
    }

  });

  return Favorite2ColumnsCollectionFactory;
});


csui.define('csui/models/widget/recentlyaccessed/server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var url   = this.connector.getConnectionUrl().getApiBase('v2'),
              query = Url.combineQueryString(
                  this.getAdditionalResourcesUrlQuery(),
                  this.getResourceFieldsUrlQuery(),
                  this.getExpandableResourcesUrlQuery(),
                  this.getStateEnablingUrlQuery(),
                  this.getRequestedCommandsUrlQuery(),
                  this._getSubtypesUrlQuery()
              );
          url = Url.combine(url, '/members/accessed');
          return query ? url + '?' + query : url;
        },

        parse: function (response, options) {
          this.parseBrowsedState(response, options);
          // don't parse columns here, because they are hardcoded in the constructor of RecentlyAccessedColumnCollection
          return this.parseBrowsedItems(response, options);
        },

        _getSubtypesUrlQuery: function () {
          var where_types = "";

          if (this.options.recentlyAccessedSubtypes) {
            for (var i = 0; i < this.options.recentlyAccessedSubtypes.length; i++) {
              where_types = where_types.concat("where_type=",
                  this.options.recentlyAccessedSubtypes[i],
                  "&");
            }
          }
          return where_types;
        }

      });
    }
  };

  return ServerAdaptorMixin;
});


csui.define('csui/models/recentlyaccessed2/recentlyaccessed.columns',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/v2.commandable/v2.commandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/browsable/client-side.mixin', 'csui/models/browsable/v2.response.mixin',
  'csui/models/nodechildrencolumn', 'csui/models/nodechildrencolumns',
  'csui/models/node/node.model', 'i18n!csui/models/widget/nls/lang',
  'csui/models/widget/recentlyaccessed/server.adaptor.mixin',
  'csui/utils/deepClone/deepClone'
], function (_, Backbone, ConnectableMixin, FetchableMixin,
    AdditionalResourcesV2Mixin, FieldsV2Mixin, ExpandableV2Mixin, StateRequestorMixin,
    CommandableV2Mixin, DelayedCommandableV2Mixin, ClientSideBrowsableMixin,
    BrowsableV2ResponseMixin, NodeChildrenColumnModel, NodeChildrenColumnCollection,
    NodeModel, lang, ServerAdaptorMixin) {
  'use strict';

  var RecentlyAccessedColumnModel = NodeChildrenColumnModel.extend({

    constructor: function RecentlyAccessedColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var columnKey = 'ra_' + attributes.column_key;
        attributes.title = lang[columnKey];
      }
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }

  });

  var RecentlyAccessedColumnCollection = NodeChildrenColumnCollection.extend({

    model: RecentlyAccessedColumnModel,

    constructor: function RecentlyAccessedColumnCollection(models, options) {
      if (!models) {
        models = [
          {
            key: 'type',
            type: 2,
            sort: true,
            default_action: true,
            name: 'Type'
          },
          {
            key: 'name',
            type: -1,
            sort: true,
            default_action: true,
            contextual_menu: false,
            editable: true,
            filter_key: 'name',
            name: 'Name'
          },
          {
            key: 'reserved',
            type: 5,
            name: 'Reserved'
          },
          {
            key: 'parent_id',
            type: 15,
            sort: false,
            name: 'Parent ID'
          },
          {
            key: 'access_date_last',
            type: -7,
            sort: true,
            name: 'Last Accessed'
          },
          {
            key: 'size',
            type: 2,
            sort: true,
            name: 'Size'
          },
          {
            key: 'modify_date',
            type: -7,
            sort: true,
            initialSortingDescending: true,
            name: 'Modified'
          },
          {
            key: 'favorite',
            type: 5,
            name: 'Favorite'
          }
        ];

        models.forEach(function (column, index) {
          column.definitions_order = index + 100;
          column.column_key = column.key;
        });
      }
      NodeChildrenColumnCollection.prototype.constructor.call(this, models, options);
    },

    // private
    getColumnModels: function (columnKeys, definitions) {
      var columns = NodeChildrenColumnCollection.prototype.getColumnModels.call(
          this, columnKeys, definitions);
      _.each(columns, function (column) {
        var columnKey = column['column_key'];
        if (columnKey === 'type' || columnKey === 'name' || columnKey === 'access_date_last' ||
            columnKey === 'modify_date' || columnKey === 'parent_id' || columnKey === 'size') {
          column.sort = true;
          if (columnKey === 'parent_id') {
            column.sort_key = 'parent_name';
          }
        }
      });
      return columns;
    },

    // private
    getV2Columns: function (response) {
      var definitions = (response.results &&
                         response.results[0] &&
                         response.results[0].metadata &&
                         response.results[0].metadata.properties) || {};

      // TODO: sadly the server is again missing the metadata output for access_date_last field.
      // Remove this temporary hard-coded code after the server properly outputs this metadata.
      if (!definitions.access_date_last && definitions.modify_date) {
        definitions.access_date_last = _.clone(definitions.modify_date);
        definitions.access_date_last.key = 'access_date_last';
        definitions.access_date_last.name = 'Last Accessed';
      }

      // client-side sub-field column
      if (!definitions.parent_name && definitions.name) {
        definitions.parent_name = _.clone(definitions.name);
        definitions.parent_name.key = 'parent_name';
        definitions.parent_name.name = 'Location Name';  // no i18n needed, server has it in EN
      }

      return NodeChildrenColumnCollection.prototype.getV2Columns.call(this, response);
    }

  });

  return RecentlyAccessedColumnCollection

});


csui.define('csui/models/widget/recentlyaccessed.model',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/v2.commandable/v2.commandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/browsable/client-side.mixin', 'csui/models/browsable/v2.response.mixin',
  'csui/models/nodechildrencolumn', 'csui/models/nodechildrencolumns',
  'csui/models/node/node.model', 'i18n!csui/models/widget/nls/lang',
  'csui/models/widget/recentlyaccessed/server.adaptor.mixin',
  'csui/models/recentlyaccessed2/recentlyaccessed.columns',
  'csui/utils/deepClone/deepClone'
], function (_, Backbone, ConnectableMixin, FetchableMixin,
    AdditionalResourcesV2Mixin, FieldsV2Mixin, ExpandableV2Mixin, StateRequestorMixin,
    CommandableV2Mixin, DelayedCommandableV2Mixin, ClientSideBrowsableMixin,
    BrowsableV2ResponseMixin, NodeChildrenColumnModel, NodeChildrenColumnCollection,
    NodeModel, lang, ServerAdaptorMixin,
    RecentlyAccessedColumnCollection) {
  'use strict';


  var RecentlyAccessedModel = NodeModel.extend({

    parse: function (response, options) {
      var ra, ra_version, ra_propertiesUser, ra_parentIdExpanded;
      if (response.data && response.data.properties) {
        ra = response.data.properties;
        ra_version = response.data.versions;
        ra_propertiesUser = response.data.properties_user;
        ra_parentIdExpanded = response.data.properties.parent_id_expand;
      } else {
        ra = response;
        ra_version = response.versions;
        ra_propertiesUser = response.properties_user;
        ra_parentIdExpanded = response.parent_id_expanded;
      }

      ra.short_name = ra.name; //ra.name.length > 20 ? ra.name.substr(0, 20) + '...' : ra.name;

      if (!ra.size) {
        if (ra.container) {
          ra.size = ra.container_size;
        } else if (ra_version) {
          ra.size = ra_version.file_size;
        }
      }

      if (!ra.mime_type && ra_version && ra_version.mime_type) {
        ra.mime_type = ra_version.mime_type;
      }

      if (!ra.access_date_last && ra_propertiesUser && ra_propertiesUser.access_date_last) {
        ra.access_date_last = ra_propertiesUser.access_date_last;
      }

      ra.parent_name = '';
      if (!ra.parent_name && ra_parentIdExpanded && ra_parentIdExpanded.name) {
        ra.parent_name = ra_parentIdExpanded.name;
      }

      return NodeModel.prototype.parse.call(this, response, options);
    }

  });
  var RecentlyAccessedCollection = Backbone.Collection.extend({

    model: RecentlyAccessedModel,

    constructor: function RecentlyAccessedCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      // Support collection cloning
      if (options) {
        this.options = _.pick(options, ['connector', 'autoreset',
          'includeResources', 'fields', 'expand', 'commands', 'recentlyAccessedSubtypes']);
      }

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeStateRequestor(options)
          .makeCommandableV2(options)
          .makeClientSideBrowsable(options)
          .makeBrowsableV2Response(options)
          .makeDelayedCommandableV2(options)
          .makeServerAdaptor(options);

      this.columns = new RecentlyAccessedColumnCollection();
    },

    _prepareModel: function (attrs, options) {
      options || (options = {});
      options.promotedActionCommands = this.promotedActionCommands;
      options.nonPromotedActionCommands = this.nonPromotedActionCommands;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
    },

    clone: function () {
      // Provide the options; they may include connector and other parameters
      var clone = new this.constructor(this.models, this.options);
      // Clone sub-models not covered by Backbone
      if (this.columns) {
        clone.columns.reset(this.columns.toJSON());
      }
      // Clone properties about the full (not-yet fetched) collection
      clone.actualSkipCount = this.actualSkipCount;
      clone.skipCount = this.skipCount;
      clone.topCount = this.topCount;
      clone.totalCount = this.totalCount;
      clone.filteredCount = this.filteredCount;
      clone.filters = _.deepClone(this.filters);
      clone.orderBy = this.orderBy;
      clone.expand = _.clone(this.expand);
      clone.includeActions = this.includeActions;
      clone.includeCommands = _.clone(this.includeCommands);
      clone.defaultActionCommands = _.clone(this.defaultActionCommands);
      clone.commands = _.clone(this.commands);
      //clone.delayRestCommands = this.delayRestCommands; //cloning of this attribute doesnot
      // required since to enable delayedRestCommands on new cloned collection

      return clone;
    },

    getResourceScope: function () {
      return _.deepClone({
        fields: this.fields,
        expand: this.expand,
        includeResources: this._additionalResources,
        commands: this.commands,
        defaultActionCommands: this.defaultActionCommands
      });
    },

    setResourceScope: function (scope) {
      this.excludeResources();
      scope.includeResources && this.includeResources(scope.includeResources);
      this.resetFields();
      scope.fields && this.setFields(scope.fields);
      this.resetExpand();
      scope.expand && this.setExpand(scope.expand);
      this.resetCommands();
      scope.commands && this.setCommands(scope.commands);
      this.resetDefaultActionCommands();
      scope.defaultActionCommands && this.setDefaultActionCommands(scope.defaultActionCommands);
    }
  });
  ClientSideBrowsableMixin.mixin(RecentlyAccessedCollection.prototype);
  BrowsableV2ResponseMixin.mixin(RecentlyAccessedCollection.prototype);
  ConnectableMixin.mixin(RecentlyAccessedCollection.prototype);
  FetchableMixin.mixin(RecentlyAccessedCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(RecentlyAccessedCollection.prototype);
  FieldsV2Mixin.mixin(RecentlyAccessedCollection.prototype);
  ExpandableV2Mixin.mixin(RecentlyAccessedCollection.prototype);
  StateRequestorMixin.mixin(RecentlyAccessedCollection.prototype);
  CommandableV2Mixin.mixin(RecentlyAccessedCollection.prototype);
  DelayedCommandableV2Mixin.mixin(RecentlyAccessedCollection.prototype);
  ServerAdaptorMixin.mixin(RecentlyAccessedCollection.prototype);

  return RecentlyAccessedCollection;

});


csui.define('csui/models/recentlyaccessed2/recentlyaccessed2',['csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url', 'csui/models/node/node.model',
  'csui/utils/deepClone/deepClone'
], function (_, Backbone, Url, NodeModel) {
  'use strict';

  var RecentlyAccessed2Model = NodeModel.extend({
    parse: function (response, options) {
      var ra, ra_version, ra_propertiesUser, ra_parentIdExpanded;
      if (response.data && response.data.properties) {
        ra = response.data.properties;
        ra_version = response.data.versions;
        ra_propertiesUser = response.data.properties_user;
        ra_parentIdExpanded = response.data.properties.parent_id_expand;
      } else {
        ra = response;
        ra_version = response.versions;
        ra_propertiesUser = response.properties_user;
        ra_parentIdExpanded = response.parent_id_expanded;
      }

      ra.short_name = ra.name; //ra.name.length > 20 ? ra.name.substr(0, 20) + '...' : ra.name;

      if (!ra.size) {
        if (ra.container) {
          ra.size = ra.container_size;
        } else if (ra_version) {
          ra.size = ra_version.file_size;
        }
      }

      if (!ra.mime_type && ra_version && ra_version.mime_type) {
        ra.mime_type = ra_version.mime_type;
      }

      if (!ra.access_date_last && ra_propertiesUser && ra_propertiesUser.access_date_last) {
        ra.access_date_last = ra_propertiesUser.access_date_last;
      }

      ra.parent_name = '';
      if (!ra.parent_name && ra_parentIdExpanded && ra_parentIdExpanded.name) {
        ra.parent_name = ra_parentIdExpanded.name;
      }

      return NodeModel.prototype.parse.call(this, response, options);
    }

  }); 

  return RecentlyAccessed2Model;
});

csui.define('csui/models/recentlyaccessed2/collection.server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/utils/url',
  'csui/models/browsable/v1.request.mixin',
  'csui/models/browsable/v2.response.mixin',
], function (_, Url, BrowsableV1RequestMixin, BrowsableV2ResponseMixin,) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      BrowsableV2ResponseMixin.mixin(prototype);
      BrowsableV1RequestMixin.mixin(prototype);
      return _.extend(prototype,  {
        makeServerAdaptor: function (options) {
          this.makeBrowsableV1Request(options)
              .makeBrowsableV2Response(options)
          return this;
        },

        url: function () {
          var url   = this.connector.getConnectionUrl().getApiBase('v2');
          url = Url.combine(url, '/members/accessed');
          var query;
            query = Url.combineQueryString(
              this.getBrowsableUrlQuery(),
              this.getResourceFieldsUrlQuery(),
              this.getExpandableResourcesUrlQuery(),
              this.getStateEnablingUrlQuery(),
              this.getAdditionalResourcesUrlQuery(),
              this.getRequestedCommandsUrlQuery(),
              this.options.recentlyAccessedSubtypes ? this.options.recentlyAccessedSubtypes.map(e => "where_type=" + e).join('&') : ""
            );

          return Url.appendQuery(url, query);
        },

        parse: function (response, options) {
          this.parseBrowsedState(response, options);
          return this.parseBrowsedItems(response, options);
        }
      });
    }
  };

  return ServerAdaptorMixin;
});


csui.define('csui/models/recentlyaccessed2/recentlyaccessed2.collection',[
  'module',
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/defaultactionitems',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.commandable/v2.commandable.mixin',
  'csui/models/browsable/browsable.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/recentlyaccessed2/recentlyaccessed2',
  'csui/models/recentlyaccessed2/recentlyaccessed.columns',
  'csui/models/recentlyaccessed2/collection.server.adaptor.mixin',
  'csui/utils/deepClone/deepClone'
], function (
  module,
  _, Backbone,
  defaultActionItems,
    ConnectableMixin,
    FetchableMixin,
    AdditionalResourcesV2Mixin,
    FieldsV2Mixin,
    ExpandableV2Mixin,
    StateRequestorMixin,
    CommandableV2Mixin,
    BrowsableMixin,
    DelayedCommandableV2Mixin,
    RecentlyAccessed2Model,
    RecentlyAccessedColumnCollection,
    ServerAdaptorMixin) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 25
  });
  var RecentlyAccessed2Collection = Backbone.Collection.extend({

    model: RecentlyAccessed2Model,

    constructor: function RecentlyAccessed2Collection(attributes, options) {
      options = _.defaults({}, options, {
        top: config.defaultPageSize
      }, options);
      Backbone.Collection.prototype.constructor.apply(this, arguments, options);

      // Support collection cloning
      if (options) {
        this.options = _.pick(options, ['connector', 'autoreset', 'limit',
          'includeResources', 'fields', 'expand', 'commands', 'recentlyAccessedSubtypes']);
      }
      this.filters = options.filters || [];

      this.makeConnectable(options)
          .makeBrowsable(options)
          .makeBrowsableV1Request(options)
          .makeFetchable(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeStateRequestor(options)
          .makeCommandableV2(options)
          .makeBrowsableV2Response(options)
          .makeDelayedCommandableV2(options)
          .makeServerAdaptor(options);
      this.columns = new RecentlyAccessedColumnCollection();
    },
    _prepareModel: function (attrs, options) {
      options || (options = {});
      options.promotedActionCommands = this.promotedActionCommands;
      options.nonPromotedActionCommands = this.nonPromotedActionCommands;
      options.limit = this.limit;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
    },
    clone: function () {
      // Provide the options; they may include connector and other parameters
      var clone = new this.constructor(this.models, this.options);
      // Clone sub-models not covered by Backbone
      if (this.columns) {
        clone.columns.reset(this.columns.toJSON());
      }
      // Clone properties about the full (not-yet fetched) collection
      clone.actualSkipCount = this.actualSkipCount;
      clone.skipCount = this.skipCount;
      clone.topCount = this.topCount;
      clone.totalCount = this.totalCount;
      clone.filteredCount = this.filteredCount;
      clone.filters = _.deepClone(this.filters);
      clone.orderBy = this.orderBy;
      clone.expand = _.clone(this.expand);
      clone.includeActions = this.includeActions;
      clone.includeCommands = _.clone(this.includeCommands);
      clone.defaultActionCommands = _.clone(this.defaultActionCommands);
      clone.commands = _.clone(this.commands);
      //clone.delayRestCommands = this.delayRestCommands; //cloning of this attribute doesnot
      // required since to enable delayedRestCommands on new cloned collection

      return clone;
    },

    getResourceScope: function () {
      return _.deepClone({
        fields: this.fields,
        expand: this.expand,
        includeResources: this._additionalResources,
        commands: this.commands,
        defaultActionCommands: this.defaultActionCommands
      });
    },

    setResourceScope: function (scope) {
      this.excludeResources();
      scope.includeResources && this.includeResources(scope.includeResources);
      this.resetFields();
      scope.fields && this.setFields(scope.fields);
      this.resetExpand();
      scope.expand && this.setExpand(scope.expand);
      this.resetCommands();
      scope.commands && this.setCommands(scope.commands);
      this.resetDefaultActionCommands();
      scope.defaultActionCommands && this.setDefaultActionCommands(scope.defaultActionCommands);
    }

  });

  BrowsableMixin.mixin(RecentlyAccessed2Collection.prototype);
  ConnectableMixin.mixin(RecentlyAccessed2Collection.prototype);
  FetchableMixin.mixin(RecentlyAccessed2Collection.prototype);
  AdditionalResourcesV2Mixin.mixin(RecentlyAccessed2Collection.prototype);
  FieldsV2Mixin.mixin(RecentlyAccessed2Collection.prototype);
  ExpandableV2Mixin.mixin(RecentlyAccessed2Collection.prototype);
  StateRequestorMixin.mixin(RecentlyAccessed2Collection.prototype);
  CommandableV2Mixin.mixin(RecentlyAccessed2Collection.prototype);
  DelayedCommandableV2Mixin.mixin(RecentlyAccessed2Collection.prototype);
  ServerAdaptorMixin.mixin(RecentlyAccessed2Collection.prototype);
  
  

  return RecentlyAccessed2Collection;

});


csui.define('csui/utils/contexts/factories/recentlyaccessed',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/widget/recentlyaccessed.model', 'csui/utils/commands',
  'csui/utils/defaultactionitems',
  'csui/models/recentlyaccessed2/recentlyaccessed2.collection',
  'csui/utils/deepClone/deepClone'
], function (module, _, Backbone, CollectionFactory, ConnectorFactory,
    RecentlyAccessedCollection, commands, defaultActionItems, RecentlyAccessed2Collection) {
  'use strict';

  var RecentlyAccessedCollectionFactory = CollectionFactory.extend({
    propertyPrefix: 'recentlyaccessed',
    constructor: function RecentlyAccessedCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var recentlyAccessed = this.options.recentlyaccessed || {};
      if (!(recentlyAccessed instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options),
            config    = module.config();
        var RACollection = config.useRecentlyAccessed2Collection ? RecentlyAccessed2Collection : RecentlyAccessedCollection;
        recentlyAccessed = new RACollection(recentlyAccessed.models, _.extend(
            {connector: connector, recentlyAccessedSubtypes: config.recentlyAccessedSubtypes},
            recentlyAccessed.options, config.options,
            RecentlyAccessedCollectionFactory.getDefaultResourceScope(),
            {autoreset: true}));
      }
      this.property = recentlyAccessed;
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  }, {
   /**
     *
     * This method provides the default resources to be add to the REST API url.
     * eg., fields, properties, extends, include resources like metadata, commands, etc.,
     * Arguments:
     *  `includeMoreOptions`: type boolean, based on this flag, it includes only required resources.
     * return object
     *
   **/
    getDefaultResourceScope: function (includeMoreOptions) {
      var resourceScope =  _.deepClone({
        // The latest version properties can be considered common properties
        // too (the MIME type is there, for example)
        fields: {
          properties: [],
          'versions.element(0)': []
        },
        // Make sure, that the metadata token is returned for nodes
        // requesated via this factory, because they are supposed to
        // be shared and may be the subject of changes.
        stateEnabled: !!includeMoreOptions,
        // Get property definitions to support table columns
        includeResources: !!includeMoreOptions ? ['metadata'] : [],
        // Ask the server to check for permitted actions
        commands: !!includeMoreOptions ? commands.getAllSignatures() : []
      });

      return resourceScope;
    },

    getLimitedResourceScope: function () {
      var resourceScope = _.deepClone({
        fields: {
          properties: ['container', 'id', 'name', 'original_id', 'type', 'type_name', 'parent_id',
            'reserved', 'custom_view_search', 'version_number','image_url', 'size', 'container_size', 'size_formatted'],
          'versions.element(0)': ['mime_type']
        },
        // Get property definitions to support table columns or similar
        // and actions to support clickability and others
        includeResources: [],
        // Ask the server to check for permitted actions V2 - only default actions
        commands: defaultActionItems.getAllCommandSignatures(commands)
      });
      return resourceScope;
    },
    getInfiniteScrollFlag: function(){
      var config    = module.config();
      return config.useRecentlyAccessed2Collection;
    }

  });

  return RecentlyAccessedCollectionFactory;

});


csui.define('csui/utils/contexts/factories/recentlyaccessedcolumns',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/recentlyaccessed'
], function (module, _, Backbone, CollectionFactory, RecentlyAccessedCollectionFactory) {

  var RecentlyAccessedColumnsCollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'recentlyaccessed_columns',

    constructor: function RecentlyAccessedColumnsCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var columns = this.options.columns || {};
      if (!(columns instanceof Backbone.Collection)) {
        var children = context.getCollection(RecentlyAccessedCollectionFactory, options);
        columns = children.columns;
      }
      this.property = columns;
    }

  });

  return RecentlyAccessedColumnsCollectionFactory;

});


csui.define('csui/models/server.adaptors/recycle.bin.mixin',['csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {

      return _.extend(prototype, {
        makeServerAdaptor: function () {
          return this;
        },

        url: function () {
          const recyclebinVolumeID = 405; // static volume ID for recycle bin
          return Url.combine(this.options.connector.getConnectionUrl().getApiBase('v2'),`volumes/${recyclebinVolumeID}?actions=BrowseRecycleBin`);
        },
        
        parse: function(response) {
            const results = response.results;
            const parsedResponse = {
                isEnabled: !!results.actions.data.BrowseRecycleBin,
                referenceId: results.data.properties.id,
                modes_available: results.data.properties.modes_available,
                show_purge_date_column: results.data.properties.show_purge_date_column
            };
            return parsedResponse;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});


csui.define('csui/models/recycle.bin',['csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/server.adaptors/recycle.bin.mixin'
], function (_, Backbone, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";

  const RecycleBinVolumeModel = Backbone.Model.extend({

    constructor: function RecycleBinVolumeModel(models, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, models, options);
      this.makeConnectable(options)
        .makeFetchable(options)
        .makeServerAdaptor(options);
    }
  });

  ConnectableMixin.mixin(RecycleBinVolumeModel.prototype);
  FetchableMixin.mixin(RecycleBinVolumeModel.prototype);
  ServerAdaptorMixin.mixin(RecycleBinVolumeModel.prototype);

  return RecycleBinVolumeModel;

});

csui.define('csui/utils/contexts/factories/recycle.bin',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/recycle.bin'
], function (module, _, Backbone, ModelFactory, ConnectorFactory, RecycleBinVolumeModel) {
  'use strict';

  const RecycleBinVolumeModelFactory = ModelFactory.extend({

    propertyPrefix: 'recycleBin',

    constructor: function RecycleBinVolumeModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      let recycleBin = this.options.recycleBin || {};
      if (!(recycleBin instanceof Backbone.Model)) {
        const connector = context.getObject(ConnectorFactory, options),
            config = module.config();
            recycleBin = new RecycleBinVolumeModel(recycleBin.attributes || config.attributes, _.defaults({
          connector: connector,
        }, recycleBin.options, config.options));
      }
      this.property = recycleBin;
    },

    isFetchable: function () {
      return true;
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  return RecycleBinVolumeModelFactory;

});


csui.define('csui/models/widget/recycle.items/server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      var originalSync = prototype.sync;
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
         var url   = this.connector.getConnectionUrl().getApiBase('v2'),
             query = Url.combineQueryString(
                  this.getBrowsableParams(),
                  this.getAdditionalResourcesUrlQuery(),
                  this.getResourceFieldsUrlQuery(),
                  this.getExpandableResourcesUrlQuery(),
                  this.getStateEnablingUrlQuery(),
                  this.getRequestedCommandsUrlQuery(),
              );
              if(this.mode){
                const mode = {mode : this.mode};
                query = Url.combineQueryString(
                  query,
                  mode
                );
              }
          url = Url.combine(url, '/volumes/recyclebin/nodes');
          return query ? `${url}?${query}` : url;
        },

        parse: function (response, options) {
          const recycleBinReferenceId = this.recycleBinReferenceId;
          if(Array.isArray(response.results)){
            response.results.forEach(function(item){
              item.data.properties.deleted_user_name = item.data.properties?.deleted_user_id_expand?.name;
              item.data.properties.created_by_user_name = item.data.properties?.create_user_id_expand?.name;
              item.data.properties.reference_id = recycleBinReferenceId;
            });
          }
          this.parseBrowsedState(response, options);
          return this.parseBrowsedItems(response, options);
        }

      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('csui/models/widget/recycle.items.model',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/browsable/browsable.mixin',
  'csui/models/browsable/v1.request.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/v2.commandable/v2.commandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/browsable/v2.response.mixin',
  'csui/models/nodechildrencolumn', 'csui/models/nodechildrencolumns',
  'csui/models/node/node.model', 'i18n!csui/models/widget/nls/lang',
  'csui/models/widget/recycle.items/server.adaptor.mixin',
  'csui/themes/csui.jato.action.icons',
  'csui/utils/deepClone/deepClone'
], function (_, Backbone, ConnectableMixin,
    BrowsableMixin,BrowsableV1RequestMixin,FetchableMixin,AdditionalResourcesV2Mixin,
    FieldsV2Mixin, ExpandableV2Mixin, StateRequestorMixin,
    CommandableV2Mixin, DelayedCommandableV2Mixin,
    BrowsableV2ResponseMixin, NodeChildrenColumnModel, NodeChildrenColumnCollection,
    NodeModel, lang, ServerAdaptorMixin, jatoIcons) {
  'use strict';

  const RecycleDocumentsColumnModel = NodeChildrenColumnModel.extend({

    constructor: function RecycleDocumentsColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var columnKey = 'rcb_' + attributes.column_key;
        attributes.title = lang[columnKey];
      }
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }

  });

  var RecycleDocumentsColumnCollection = NodeChildrenColumnCollection.extend({

    model: RecycleDocumentsColumnModel,

    constructor: function RecycleDocumentsColumnCollection(models, options) {
      if (!models) {
        models = [
          {
            key: 'type',
            type: 2,
            sort: true,
            titleIconInHeader: 'mime_type',
            titleSvgInHeader: jatoIcons.actionDocument,
            default_action: false,
            name: lang.rcb_type
          },
          {
            key: 'name',
            type: 2,
            sort: true,
            default_action: false,
            contextual_menu: false,
            editable: true,
            filter_key: 'name',
            name: lang.rcb_name
          },
          {
            key: 'deleted_date',
            type: -7,
            sort: true,
            name: lang.rcb_deleted_date
          },
          {
            key: 'deleted_user_name',
            type: -1,
            name: lang.rcb_deleted_user_name
          },
          {
            key: 'created_by_user_name',
            type: -1,
            name: lang.rcb_created_by_user_name
          },
          {
            key: 'size',
            type: 2,
            sort: true,
            name: lang.rcb_size
          },
          {
            key: 'parent_id',
            type: 2,
            contextual_menu: false,
            editable: true,
            filter_key: 'name',
            name: lang.rcb_parent_id
          },
          {
            key: 'purged_date',
            type: -7,
            sort: true,
            name: lang.rcb_purged_date
          },
        ];

        models.forEach(function (column, index) {
          column.definitions_order = index + 100;
          column.column_key = column.key;
        });
      }
      NodeChildrenColumnCollection.prototype.constructor.call(this, models, options);
    }
  });

  const RecycleBinModel = NodeModel.extend({

    parse: function (response, options) {
      if(!response.data?.properties) return;

      return NodeModel.prototype.parse.call(this, response, options);
    }

  });

  const RecycleDocumentsCollection = Backbone.Collection.extend({

    model: RecycleBinModel,

    constructor: function RecycleDocumentsCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      // Support collection cloning
      if (options) {
        this.options = _.pick(options, []);
      }
      this.makeConnectable(options)
          .makeBrowsable(options)
          .makeBrowsableV1Request(options)
          .makeFetchable(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeStateRequestor(options)
          .makeCommandableV2(options)
          .makeBrowsableV2Response(options)
          .makeDelayedCommandableV2(options)
          .makeServerAdaptor(options);

      this.columns = new RecycleDocumentsColumnCollection();
      this.typeOfCollection = 'recyclebin'
    },

    _prepareModel: function (attrs, options) {
      options || (options = {});
      options.promotedActionCommands = this.promotedActionCommands;
      options.nonPromotedActionCommands = this.nonPromotedActionCommands;
      options.limit = this.limit;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
    },

    clone: function () {
      // Provide the options; they may include connector and other parameters
      var clone = new this.constructor(this.models, this.options);
      // Clone sub-models not covered by Backbone
      if (this.columns) {
        clone.columns.reset(this.columns.toJSON());
      }
      // Clone properties about the full (not-yet fetched) collection
      clone.actualSkipCount = this.actualSkipCount;
      clone.skipCount = this.skipCount;
      clone.topCount = this.topCount;
      clone.totalCount = this.totalCount;
      clone.filteredCount = this.filteredCount;
      clone.filters = _.deepClone(this.filters);
      clone.orderBy = this.orderBy;
      clone.expand = _.clone(this.expand);
      clone.includeActions = this.includeActions;
      clone.includeCommands = _.clone(this.includeCommands);
      clone.commands = _.clone(this.commands);

      return clone;
    },
    
    setDefaultPageNum: function () {
      this.skipCount = 0;
    },

    getResourceScope: function () {
      return _.deepClone({
        fields: this.fields,
        expand: this.expand,
        includeResources: this._additionalResources,
        commands: this.commands
      });
    },

    setResourceScope: function (scope) {
      this.excludeResources();
      scope.includeResources && this.includeResources(scope.includeResources);
      this.resetFields();
      scope.fields && this.setFields(scope.fields);
      this.resetExpand();
      scope.expand && this.setExpand(scope.expand);
      this.resetCommands();
      scope.commands && this.setCommands(scope.commands);
      this.resetDefaultActionCommands();
      scope.defaultActionCommands && this.setDefaultActionCommands(scope.defaultActionCommands);
    },

  });

  BrowsableMixin.mixin(RecycleDocumentsCollection.prototype);
  BrowsableV1RequestMixin.mixin(RecycleDocumentsCollection.prototype);
  BrowsableV2ResponseMixin.mixin(RecycleDocumentsCollection.prototype);
  ConnectableMixin.mixin(RecycleDocumentsCollection.prototype);
  FetchableMixin.mixin(RecycleDocumentsCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(RecycleDocumentsCollection.prototype);
  FieldsV2Mixin.mixin(RecycleDocumentsCollection.prototype);
  ExpandableV2Mixin.mixin(RecycleDocumentsCollection.prototype);
  StateRequestorMixin.mixin(RecycleDocumentsCollection.prototype);
  CommandableV2Mixin.mixin(RecycleDocumentsCollection.prototype);
  DelayedCommandableV2Mixin.mixin(RecycleDocumentsCollection.prototype);
  ServerAdaptorMixin.mixin(RecycleDocumentsCollection.prototype);

  return RecycleDocumentsCollection;

});


csui.define('csui/utils/commands/recycle',[
  'csui/lib/underscore', 'csui/models/commands'
], function (_, CommandCollection) {
  'use strict';

  var commands = new CommandCollection();

  _.extend(commands, {
    signatures: ["Restore", "Purge"] // to add actions
  });

  return commands;
});


csui.define('csui/utils/contexts/factories/recycle.items',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/widget/recycle.items.model', 'csui/utils/commands/recycle',
  'csui/utils/contexts/factories/recycle.bin',
  'csui/utils/deepClone/deepClone'
], function (module, _, Backbone, CollectionFactory, ConnectorFactory,
    RecycleItemsCollection, commandsRecycle, RecycleBinVolumeFactory) {
  'use strict';

  const RecycleItemsCollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'recycleitems',

    constructor: function RecycleItemsCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      let recycleItems = this.options.recycleitems || {};
      if (!(recycleItems instanceof Backbone.Collection)) {
        let connector = context.getObject(ConnectorFactory, options),
            config    = module.config();
            recycleItems = new RecycleItemsCollection(recycleItems.models,
              _.extend(
                { connector },
                recycleItems.options,
                config.options,
                RecycleItemsCollectionFactory.getDefaultResourceScope(),
                {autoreset: true}));
      }
      this.property = recycleItems;
    },

    setRecycleBinReferenceId: async function() {
      const recycleBinVolumeModel = this.context.getModel(RecycleBinVolumeFactory, {permanent: true,  detached: true});
      await recycleBinVolumeModel.ensureFetched();
      this.property.recycleBinReferenceId = recycleBinVolumeModel.get('referenceId');
    },

    fetch: function (options) {
      if(!this.recycleBinReferenceId){
        this.setRecycleBinReferenceId();
      }
      return this.property.fetch(options);
    }

  }, {

    getDefaultResourceScope: function () {
      return _.deepClone({
        expand: {
          properties:["parent_id", "deleted_user_id", "create_user_id"]
        },
        commands: commandsRecycle.signatures
      });
    }

  });

  return RecycleItemsCollectionFactory;

});



csui.define('csui/utils/contexts/factories/recycle.items.columns.factory',['csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/recycle.items'
], function (Backbone, CollectionFactory, RecycleItemsCollectionFactory) {

  const RecycleItemsColumnsCollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'recycleitems_columns',

    constructor: function RecycleItemsColumnsCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      let columns = this.options.columns || {};
      if (!(columns instanceof Backbone.Collection)) {
        let children = context.getCollection(RecycleItemsCollectionFactory, options);
        columns = children.columns;
      }
      this.property = columns;
    }

  });

  return RecycleItemsColumnsCollectionFactory;

});


csui.define('csui/utils/contexts/factories/member',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/member'
], function (module, _, Backbone, ModelFactory, ConnectorFactory, MemberModel) {
  'use strict';

  var MemberModelFactory = ModelFactory.extend({

    propertyPrefix: 'member',

    constructor: function MemberModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var member = this.options.member || {};
      if (!(member instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options),
            config = module.config();
        member = new MemberModel(member.attributes || config.attributes, _.defaults({
          connector: connector,
          expand: ['member']
        }, member.options, config.options));
      }
      this.property = member;
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  return MemberModelFactory;

});


csui.define('csui/models/widget/search.box/server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/url'
], function (_, $, Url) {
  'use strict';

  var ServerAdaptorMixin = {

    mixin: function (prototype) {

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var url = this.connector.connection.url.replace('/v1', '/v2');
          return Url.combine(url, 'search/members/info?enterprise_slices=true');
        },

        parse: function (response, options) {
          var res = response.results,
              sliceLabels = res.slices,
              returnData  = {},
              slices      = [];
          returnData.search_forms = {};

          $.each(sliceLabels, function (sliceIdx) {
            slices.push({
              sliceId: sliceLabels[sliceIdx].id,
              sliceDisplayName: sliceLabels[sliceIdx].name
            });
          });

          returnData = {
            search_forms: {
              recent_search_forms: this.createSearchFormsList(res.recent_search_forms),
              personal_search_forms: this.createSearchFormsList(res.personal_search_forms),
              system_search_forms: this.createSearchFormsList(res.system_search_forms)
            },
            slices: slices,
            search_bar_settings: res.search_bar_settings
          };
          return returnData;
        },

        createSearchFormsList: function (list) {
          var form = [];
          $.each(list, function (listIdx) {
            //TODO: Remove this condition once rest API is fixed
            if (list[listIdx].name !== null || !!list[listIdx].name) {
              form.push(list[listIdx]);
            }
          });
          return form;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});


csui.define('csui/models/widget/search.box.model',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/widget/search.box/server.adaptor.mixin'
], function (_, $, Backbone, Url, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";

  var SearchBoxModel = Backbone.Model.extend({

    constructor: function SearchBoxModel(models, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, models, options);
      this.makeConnectable(options)
          .makeFetchable(options)
          .makeServerAdaptor(options);
    }
  });

  ConnectableMixin.mixin(SearchBoxModel.prototype);
  FetchableMixin.mixin(SearchBoxModel.prototype);
  ServerAdaptorMixin.mixin(SearchBoxModel.prototype);

  _.extend(SearchBoxModel.prototype, {

    isFetchable: function () {
      return !!this.options;
    }

  });

  return SearchBoxModel;

});

csui.define('csui/utils/contexts/factories/search.box.factory',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/widget/search.box.model'
], function (module, _, $, Backbone, CollectionFactory, ConnectorFactory,
    SearchBoxModel) {
  'use strict';

  var prefetch = /\bprefetch(?:=([^&]*)?)/i.exec(location.search);
  prefetch = !prefetch || prefetch[1] !== 'false';

  var initialResourceFetched;

  var SearchBoxFactory = CollectionFactory.extend({
    propertyPrefix: 'searchBox',

    constructor: function SearchBoxFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var searchBox = this.options.searchBox || {},
          config = module.config();
      if (prefetch) {
        this.initialResponse = searchBox.initialResponse || config.initialResponse;
      }
      if (!(searchBox instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options);
        searchBox = new SearchBoxModel(searchBox.attributes || config.attributes,
          _.defaults({
            connector: connector
          }, searchBox.options, config.options, {
            autofetch: true
          }));
      }
      this.property = searchBox;
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      if (this.initialResponse && !initialResourceFetched) {
        var promise = this.property.prefetch(this.initialResponse, options);
        initialResourceFetched = true;
        return promise;
      } else {
        return this.property.fetch(options);
      }
    }
  });

  return SearchBoxFactory;
});


csui.define('csui/models/widget/search.results/search.metadata/search.metadata.mixin',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone'
], function (_, $, Backbone) {
  'use strict';

  var SearchMetadataMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeSearchMetadataResponse: function (options) {
          return this;
        },

        parseSearchMetadataResponse: function (resp, options) {
          return resp;
        }
      });
    }
  };

  return SearchMetadataMixin;
});


csui.define('csui/models/widget/search.results/search.metadata/server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone'
], function (_, $, Backbone) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        sync: function (method, model, options) {
          var deferred = $.Deferred();
          options = _.defaults({parse: true}, options);
          this.trigger('request', this, {}, options);
          setTimeout(function () {
            options.success.call(options.context, {}, 'success', {});
            deferred.resolve();
          }.bind(this));
          return deferred.promise();
        },

        parse: function (response, options) {
          return this.parseSearchMetadataResponse(response, options);
        }

      });
    }
  };

  return ServerAdaptorMixin;
});


csui.define('csui/models/widget/search.results/search.metadata/search.metadata.model',['csui/lib/jquery', 'csui/lib/underscore', "csui/lib/backbone",
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/widget/search.results/search.metadata/search.metadata.mixin',
  'csui/models/widget/search.results/search.metadata/server.adaptor.mixin'
], function ($, _, Backbone, ConnectableMixin, FetchableMixin, SearchMetadataMixin,
    ServerAdaptorMixin) {
  "use strict";

  var SearchMetadataItemModel = Backbone.Model.extend({

    idAttribute: "key",

    defaults: {
      key: null,  // key from the resource definitions
      sequence: 0 // smaller number moves the column to the front
    }

  });

  var SearchMetadataItemsCollection = Backbone.Collection.extend({

    model: SearchMetadataItemModel,
    comparator: "sequence",

    constructor: function SearchMetadataItemsCollection(attributes, options) {
      SearchMetadataItemsCollection.__super__.constructor.apply(this, arguments);
      this.makeConnectable(options)
          .makeFetchable(options)
          .makeSearchMetadataResponse(options)
          .makeServerAdaptor(options);
    },

    getColumnKeys: function () {
      return this.pluck('key');
    },

    deepClone: function () {
      return new SearchMetadataItemsCollection(
          this.map(function (column) {
            return column.attributes;
          }));
    }
  });

  ConnectableMixin.mixin(SearchMetadataItemsCollection.prototype);
  FetchableMixin.mixin(SearchMetadataItemsCollection.prototype);
  SearchMetadataMixin.mixin(SearchMetadataItemsCollection.prototype);
  ServerAdaptorMixin.mixin(SearchMetadataItemsCollection.prototype);

  return SearchMetadataItemsCollection;
});

csui.define('csui/utils/contexts/factories/search.metadata.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory',
  'csui/models/widget/search.results/search.metadata/search.metadata.model'
], function (module, _, Backbone, CollectionFactory, SearchMetadataModel) {

  var SearchMetadataModelFactory = CollectionFactory.extend({

    propertyPrefix: 'searchMetadata',

    constructor: function SearchMetadataModelFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var metadata = this.options.metadata || {};
      if (!(metadata instanceof Backbone.Collection)) {
        var config = module.config();
        metadata = new SearchMetadataModel(metadata.models, _.extend({},
            metadata.options, config.options));
      }
      this.property = metadata;
    },
    isFetchable: function () {
      return !!this.options;
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }
  });
  return SearchMetadataModelFactory;
});

csui.define('csui/utils/contexts/factories/task.queue.factory',[
  "module",
  "csui/lib/underscore",
  "csui/lib/backbone",
  "csui/utils/contexts/factories/factory",
  "csui/utils/taskqueue"
], function(module, _, Backbone, ModelFactory, TaskQueue) {
  var TaskQueueFactory = ModelFactory.extend({
    propertyPrefix: "taskQueue",

    constructor: function TaskQueueFactory(options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var taskQueue = this.options.taskQueue || {};
      if (!(taskQueue instanceof TaskQueue)) {
        var config = module.config();
        taskQueue = new TaskQueue(
          _.extend({}, taskQueue.options, config.options)
        );
      }
      this.property = taskQueue;
    }
  });
  return TaskQueueFactory;
});


csui.define('csui/models/server.info',['csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/server.info/server.adaptor.mixin'
], function (Backbone, Url, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";
  var ServerInfoModel = Backbone.Model.extend({

    constructor: function ServerInfoModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options)
          .makeFetchable(options);
    }
  });

  ConnectableMixin.mixin(ServerInfoModel.prototype);
  FetchableMixin.mixin(ServerInfoModel.prototype);
  ServerAdaptorMixin.mixin(ServerInfoModel.prototype);

  return ServerInfoModel;
});

csui.define('csui/utils/contexts/factories/server.info',['csui/lib/backbone',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/factory',
  'csui/models/server.info'
], function (Backbone, ConnectorFactory, ModelFactory, ServerInfoModel) {

  var ServerInfoModelFactory = ModelFactory.extend({

    propertyPrefix: 'serverInfo',

    constructor: function ServerInfoModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var connector       = context.getObject(ConnectorFactory, {
            permanent: true
          }),
          serverInfoModel = this.options.serverInfoModel || {};

      if (!(serverInfoModel instanceof Backbone.Model)) {
        serverInfoModel = new ServerInfoModel(undefined, {connector: connector});
      }
      this.property = serverInfoModel;
    }

  });

  return ServerInfoModelFactory;
});


csui.define('csui/models/widget/search.results/search.settings/server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url'
], function (_, $, Backbone, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      var originalSync = prototype.sync;
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var url         = this.connector.getConnectionUrl().getApiBase('v2'),
              queryString = "",
              templateId  = this.options.templateId;
              const cacheId = this.options?.collection?.cacheId;
              if(!!cacheId){
                queryString = Url.combine(queryString, `session/${cacheId}`);
              }else{
                if (templateId) {
                  queryString = Url.combine(queryString, "/template/" + templateId);
                } else {
                  queryString = Url.combine(queryString, "/template");
                }
              }
            queryString = Url.combine(queryString, "/settings/display");
            return Url.combine(url, 'search' + queryString);
        },

        sync: function (method, model, options) {
          return originalSync.apply(this, arguments);
        }
      });
    }
  };

  return ServerAdaptorMixin;
});


csui.define('csui/models/widget/search.results/search.settings/search.settings.model',['csui/lib/jquery', 'csui/lib/underscore', "csui/lib/backbone",
  'csui/models/mixins/connectable/connectable.mixin', 'csui/utils/url',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/widget/search.results/search.settings/server.adaptor.mixin'
], function ($, _, Backbone, ConnectableMixin, Url, FetchableMixin, ServerAdaptorMixin) {
  "use strict";

  var RegionsModel = Backbone.Model.extend({
    constructor: function RegionsModel() {
      Backbone.Model.apply(this, arguments);
    }
  });

  var RegionsModelCollection = Backbone.Collection.extend({
    model: RegionsModel,

    constructor: function RegionsModelCollection() {
      Backbone.Collection.apply(this, arguments);
    },

    isFetchable: false
  });

  var SearchSettingsModel = Backbone.Model.extend({
    constructor: function SearchSettingsModel(attributes, options) {
      this.options = options || (options = {});
      Backbone.Model.apply(this, arguments);
      this.makeConnectable(options)
          .makeFetchable(options)
          .makeServerAdaptor(options);
    },

    idAttribute: "key",

    defaults: {
      key: null,  // key from the resource definitions
      sequence: 0 // smaller number moves the column to the front
    },

    isNew: function () {
      return false;
    },

    parse: function (response, options) {
      response = response.results && response.results.data;
      var displayRegions = ['available', 'selected'];
      _.each(response && response.display, function (item) {
        if (_.isObject(item)) {
          displayRegions.map(function (region) {
            if (item[region]) {
              if (_.isArray(item[region])) {
                item[region] = new RegionsModelCollection(item[region]);
              }
            }
          });
        }
      });
      return response;
    },

    isFetchable: function () {
      return true;
    },

    getColumnKeys: function () {
      return this.pluck('key');
    }
  });

  ConnectableMixin.mixin(SearchSettingsModel.prototype);
  FetchableMixin.mixin(SearchSettingsModel.prototype);
  ServerAdaptorMixin.mixin(SearchSettingsModel.prototype);

  return SearchSettingsModel;
});

csui.define('csui/utils/contexts/factories/search.settings.factory',['require', 'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/widget/search.results/search.settings/search.settings.model'
], function (require, module, _, Backbone, CollectionFactory, ConnectorFactory,
    SearchSettingsCollection) {

  var SearchSettingsFactory = CollectionFactory.extend({
    propertyPrefix: 'searchSettings',

    constructor: function SearchSettingsFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var searchSettings = this.options.searchSettings || {};
      if (!(searchSettings instanceof Backbone.Collection)) {
        var connector  = context.getObject(ConnectorFactory, options),
            config     = module.config(),
            templateId = options.templateId;
        searchSettings = new SearchSettingsCollection(searchSettings.models, _.extend({
          connector: connector,
          templateId: templateId,
          collection: this.options.collection
        }, searchSettings.options, config.options, {
          autofetch: true,
          autoreset: true
        }));
      }
      this.property = searchSettings;
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }
  });
  return SearchSettingsFactory;
});

csui.define('csui/models/server.adaptors/largefilesettings.mixin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url', 'i18n!csui/models/impl/nls/lang'
], function ($, _, Url, lang) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          return Url.combine(this.options.connector.getConnectionUrl().getApiBase('v2'),
          'multipart/settings');
        },

        parse: function (response) {
          var res = response.results.data, returnData;

          returnData = {
            largeFileSettings: {
              is_enabled: res.is_enabled,
              max_size: res.max_size,
              min_size: res.min_size
            }
          };
          return returnData;
        }

      });
    }
  };

  return ServerAdaptorMixin;
});


csui.define('csui/models/largefilesettingsmodel',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/server.adaptors/largefilesettings.mixin'
], function (_, $, Backbone, Url, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";

  var LargeFileSettingsModel = Backbone.Model.extend({

    constructor: function LargeFileSettingsModel(models, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, models, options);
      this.makeConnectable(options)
          .makeFetchable(options)
          .makeServerAdaptor(options);
    }
  });

  ConnectableMixin.mixin(LargeFileSettingsModel.prototype);
  FetchableMixin.mixin(LargeFileSettingsModel.prototype);
  ServerAdaptorMixin.mixin(LargeFileSettingsModel.prototype);

  _.extend(LargeFileSettingsModel.prototype, {

    isFetchable: function () {
      return !this.get('largeFileSettings');
    }

  });

  return LargeFileSettingsModel;

});

csui.define('csui/utils/contexts/factories/largefilesettings.factory',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/largefilesettingsmodel'
], function (module, _, $, Backbone, CollectionFactory, ConnectorFactory,
    LareFileSettingsModel) {
  'use strict';


  var LargeFileSettingsFactory = CollectionFactory.extend({
    propertyPrefix: 'largeFileSettings',

    constructor: function LargeFileSettingsFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var largeFileSettings = this.options.largeFileSettings || {},
          config = module.config();
  
        var connector = context.getObject(ConnectorFactory, options);
         largeFileSettings = new LareFileSettingsModel(largeFileSettings.attributes || config.attributes,
          _.defaults({
            connector: connector
          }, largeFileSettings.options, config.options, {
            autofetch: true
         }));
      this.property = largeFileSettings;
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
    
        return this.property.fetch(options);
    }
  });

  return LargeFileSettingsFactory;
});


csui.define('csui/utils/contexts/factories/branding.config.factory',['module',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/utils/contexts/factories/factory'
], function (module, _, Backbone, BrandingConfigFactory) {

  var BrandingConfigModel = Backbone.Model.extend({});

  // BrandingConfigFactory
  return BrandingConfigFactory.extend({

    BrandingConfigModelPrefix: 'BrandingConfigModel',
    propertyPrefix: 'BrandingConfigModel',

    constructor: function BrandingConfigModelFactory(context, options) {
      BrandingConfigFactory.prototype.constructor.apply(this, arguments);

      var brandingConfigModel = this.options.brandingConfigModel || {};
      if (!(brandingConfigModel instanceof Backbone.Model)) {
        var config = module.config();
        brandingConfigModel = new BrandingConfigModel(brandingConfigModel.models, _.extend({},
          brandingConfigModel.options, config.options));
      }
      this.property = brandingConfigModel;
    }
  });
});


csui.define('csui/themes/csui.jato.mime.illustrations',[], function () {
let icons = {
'illustrationsNoUser': `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" fill="none" viewBox="0 0 220 220"><path fill="gray" fill-opacity=".2" d="M161.5 29.001c-6.049-8.641-14-13.44-18-13.5C137 13 126.833 12.624 125 14c12.5.499 18.5 3.498 23 6.499s10.14 8.053 14.5 17.5c3 6.5 4.166 21.834 5.5 29.5 1-15 .5-28.499-6.5-38.499M147 112.192c-15.336.984-22.357-3.472-25.858-7.165-.467-.492-1.296-.437-1.475.217-.622 2.268.548 6.224 14.737 8.586 3.11.518 11.721-.182 12.596-1.638M55.5 129.001c-4.5 1.5-7.5-4-11-4.5 1 4.501 9 9 10 9 4.5 0 16.5-18 15-16s-9.5 10-14 11.5M113 158.5c-4.5-2.077-1.5-8-2.001-20-3.999 18.5-9.5 24.5-9 25.5s2.5 0 4.5.5c1.6.4 17.501-.5 25.501.5-5.5-4.5-12.5-3.5-19-6.5M141.5 165c-1.861-1.24-1-4.5-2-11-1.999 7.5-2 15-2 15 4.079 0 10.667-2.333 13.5-4-.333.167-1.6.6-4 1-3 .5-4 0-5.5-1"/><g fill="gray" opacity=".4"><path d="M71.17 157.256c.61-.89 2.79-4.177 5.33-9.256-9 0-8.5 7.499-11.5 3 1.676 5.027 4.755 6.193 5.71 6.439a.43.43 0 0 0 .46-.183M85.245 164.774c2.686-1.698 7.102-5.421 6.255-11.774 0 0 6.5 6 9 11.5 1-.5 3.5-4 3.5-4-.333 1.666.722 4.259-7.5 7-6.47 2.157-9.095.84-11.406-1.06-.54-.444-.44-1.293.15-1.666M125.5 173.5c-.999-1 3-5.5-1.5-9 1.5-.5 6.6-.2 9 1 3 1.5 4.5 2 4 4.5-.658 3.289-11 4-11.5 3.5" fill="gray" fill-opacity="1"/></g><path fill="gray" d="M182 185.667c0 4.418-32.235 5.333-72 5.333s-72-.915-72-5.333 32.4-3.334 72.36-4.667c13.64.5 71.64.248 71.64 4.667" opacity=".4" fill-opacity="1"/><path fill="#8d91a9" d="m82.943 127.092.026-.025-.024.027c-5.511 6.048-10.365 14.186-13.194 19.804a73 73 0 0 0-1.25 2.602q.126-.063.288-.135c.533-.233 1.34-.518 2.357-.781C74.76 147.652 81.02 147.01 87 150c7.16 3.58 10.73 9.466 12.365 12.338l.007.012q.119.207.222.392l.002.003.28.494q.11.191.202.339c.21.341.345.499.422.422.431-.353.862-.836 1.291-1.429l.008-.012q.105-.143.208-.295c1.689-2.482 3.335-6.613 4.777-11.081 1.863-5.771 3.384-12.107 4.216-16.183.5 3-.55 7.106-3 16.5-1.473 5.644-2.704 8.759-3.577 10.468C103.519 163.741 103 164 103 164l.225-.005c.381-.009 1.223-.028 2.385-.051 5.784-.114 19.481-.335 23.391.056 2.431.243 4.37.991 5.704 1.728.63.348 1.125.693 1.473.981q.192.159.323.291s.166-.854.413-2.245c.805-4.535 2.475-14.781 2.087-19.755 1.541 3.083.509 11.214-.351 17.985v.005a360 360 0 0 0-.432 3.483l-.095.842q-.068.615-.122 1.185l.25-.021a30 30 0 0 0 1.783-.222c2.56-.393 6.234-1.239 8.967-2.757 2.794-1.552 6.973-1.197 9.873-.571.837.181 1.567.384 2.127.571 0 0-.139-.799-.372-2.2-1.015-6.114-3.815-23.689-4.628-36.3a47 47 0 0 1 .009-5.837c.664.002 1.337-.001 2.004-.015a45 45 0 0 0-.017 5.723c.494 7.666 1.734 17.226 2.858 24.902a606 606 0 0 0 1.944 12.375l.128.752.044.254v.003l-.845.147.845-.147.574 3.299-3.177-1.059c-1.106-.368-3.037-.83-5.085-.964-2.097-.136-4.01.092-5.311.815-3.975 2.209-9.55 3.072-11.818 3.246l-.298.023-.619.048-1.316-1.317-.834-.834c-.499-.498-2.733-2.069-6.285-2.424-2.363-.236-8.727-.241-14.655-.178a974 974 0 0 0-10.864.182l-.232.005h-.002l-.042-1.725.042 1.725h-1.257c-1.292.001-1.05.097-1.676-.009a2.15 2.15 0 0 1-1.022-.475 3 3 0 0 1-.565-.65c-.193-.286-.421-.69-.642-1.081l-.041-.073c-.505-.892-1.199-2.116-2.17-3.499-1.941-2.766-4.959-6.118-9.57-8.423-3.593-1.797-7.336-2.151-10.458-1.919-3.156.233-4.359.261-6.254 1.419s-2.537 3.293-2.537 3.293l-1.392-1.328-.606-.578-.24-.229c-1.742-1.664-4.675-4.069-7.972-6.044-3.35-2.008-6.8-3.403-9.646-3.403h-5.678l4.424-3.558q.942-.757 1.937-1.549l.002-.001a307 307 0 0 0 4.596-3.713c-1.296-.685-2.74-1.663-4.132-2.837-1.984-1.672-3.998-3.853-5.398-6.371l-.826-1.487 1.335-1.054c3.213-2.536 6.103-4.105 8.918-5.634 6.194-3.363 12.025-6.529 20.13-19.364 5.856-9.27 10.417-21.683 14.229-33.305.95-2.896 1.849-5.73 2.71-8.448l.158-.502c.802-2.532 1.571-4.96 2.311-7.221 1.567-4.787 3.045-8.951 4.495-11.85C101.821 24.888 111.339 12 130.501 12c18.838 0 28.438 9.996 32.227 16.492 5.753 9.861 7.273 21.284 7.273 31.008 0 11.474-1.329 18.052-2.634 23.325-.589-.17-1.249-.3-1.962-.397 1.292-5.21 2.596-11.624 2.596-22.928 0-9.553-1.5-20.571-7-30-3.5-6-12.5-15.5-30.5-15.5s-27 12-32.5 23c-2.02 4.04-4.176 10.847-6.689 18.784-4.328 13.67-9.719 30.695-17.311 42.716-8.385 13.276-14.817 16.787-21.173 20.257-2.74 1.496-5.465 2.984-8.327 5.243 2.337 4.207 6.714 7.54 9.453 8.773a9 9 0 0 0 .547.227c7.547-4.717 13.315-12.995 16.882-18.115l.618-.885c-4.059 8.455-10.557 15.003-16.71 20.264q-.48.411-.956.81a249 249 0 0 1-5.066 4.115l-.31.246q-1.012.805-1.958 1.565c.907 0 1.845.116 2.798.324 5.293 1.16 11.054 5.191 14.6 8.232A41 41 0 0 1 66 151a38 38 0 0 1 .872-2.24c3.63-8.531 10.373-16.245 16.071-21.668" fill-opacity="1"/><path fill="url(#jato-illustrations-id-91)" fill-rule="evenodd" d="M146.5 86.54c-.439 2.192-1 12-1 12 0 .581-.014 1.221-.037 1.903 3.641 1.549 6.037 3.252 6.037 6.096 0 3.461-2.5 5-5 5.461-.396.073-1.018.146-1.813.2-.11 1.6-.187 2.953-.187 3.838 0 4 3.197 5 5 5 .497 0 1.23.02 2.114.044 3.566.096 9.581.258 12.386-.544 2.239-.639 2.473-2.138 2.856-4.6q.067-.43.144-.9c.076-.454.293-2.041.558-4.068-1.45-.966-3.058-2.967-3.058-4.431 0-1.771.392-4.718 4.301-5.717.123-1.137.199-1.97.199-2.283 0-.257.017-.762.039-1.435.107-3.253.343-10.433-.539-12.604-1-2.46-3.5-2.46-6-2.46H152c-4.516 0-5 2-5.5 4.5m6.25 3.46c.966 0 1.75-.895 1.75-2s-.784-2-1.75-2-1.75.895-1.75 2 .784 2 1.75 2" clip-rule="evenodd"/><path stroke="#8d91a9" stroke-linecap="round" stroke-width="2" d="M122 106.539c7 6.5 20.633 5.99 23.5 5.461 2.5-.461 6-1 6-5.461 0-2.915-5.5-6-12.5-8.5s-5-1.5-9.5-6m41 8.5c-5.5.5-6 4-6 6s3 5 4.5 5 3-11.234 1.5-11Z" stroke-opacity="1"/><path fill="gray" fill-opacity=".4" d="M140.5 55c5 .5 5 18.5-4.5 18 4-4.5 5.5-10 4.5-18"/><path fill="gray" fill-opacity=".4" stroke="#8d91a9" stroke-width="2" d="M139.74 54.875c1.154.173 2.251 1.14 2.986 2.917.727 1.756 1.015 4.14.629 6.723s-1.358 4.779-2.566 6.246c-1.222 1.485-2.553 2.09-3.708 1.917s-2.252-1.14-2.987-2.917c-.726-1.756-1.015-4.14-.629-6.723s1.358-4.779 2.566-6.246c1.222-1.485 2.554-2.09 3.709-1.917Z" stroke-opacity="1"/><path fill="gray" fill-opacity=".4" d="M156.66 57c9.35 2.568 3.34 18.5-3.16 15.5 2-1.5 8.297-9.336 3.16-15.5"/><path fill="gray" fill-opacity=".4" stroke="#8d91a9" stroke-width="2" d="M157.547 57.196c.99.148 1.954.981 2.608 2.562.645 1.56.904 3.686.56 5.994-.345 2.308-1.214 4.266-2.287 5.57-1.087 1.32-2.253 1.835-3.243 1.687s-1.954-.98-2.608-2.562c-.645-1.56-.904-3.686-.559-5.994s1.213-4.265 2.286-5.569c1.088-1.32 2.253-1.836 3.243-1.688Z" stroke-opacity="1"/><defs><linearGradient id="jato-illustrations-id-91" x1="140.979" x2="181.84" y1="82.17" y2="100.594" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'illustrationsFavorites': `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" fill="none" viewBox="0 0 220 220"><path fill="gray" fill-opacity=".4" d="M210 191c0 3.314-44.772 4-100 4s-100-.686-100-4 45-2.5 100.5-3.5c73 2.569 99.5.186 99.5 3.5M200 172.5V109c0-6.075-4.925-11-11-11l-7.555 76.491a5 5 0 0 1-4.976 4.509H170c.839 1.22 1.768 3.165 2.5 4 1.659 1.891 4.786 4.485 6.5 5 1.497.45 2.862 0 5 0 11.2 0 16-10 16-15.5"/><path stroke="#8d91a9" stroke-width="2" d="M168 188h16c8.837 0 16-7.163 16-16v-62c0-6.627-5.373-12-12-12" stroke-opacity="1"/><path fill="gray" fill-opacity=".2" d="M53.6 188H184c-12.5 0-15.5-10-16-15.068H57c-22 0-32.833-11.688-36-17.532 0 18.004 14.596 32.6 32.6 32.6"/><path stroke="#8d91a9" stroke-width="2" d="M32 57h51.993a11 11 0 0 1 8.14 3.602l.2.225 14.317 16.65A13 13 0 0 0 116.507 82H157c6.075 0 11 4.925 11 11v80.007c.023 3.414 2.449 10.842 10.503 14.993H56c-19.33 0-35-15.67-35-35V68c0-6.075 4.925-11 11-11Z" stroke-opacity="1"/><path stroke="#8d91a9" stroke-width="2" d="M180 33h11.696a3 3 0 0 1 2.987 3.288l-13.334 138.096a4 4 0 0 1-3.981 3.616h-6.766" stroke-opacity="1"/><path stroke="#8d91a9" stroke-width="2" d="M42 56.5V27a4 4 0 0 1 4-4h129a4 4 0 0 1 4 4v147a4 4 0 0 1-4 4h-6" stroke-opacity="1"/><path fill="url(#jato-illustrations-id-54)" fill-rule="evenodd" d="M91.094 102.175c1.198-2.394 4.614-2.394 5.812 0l6.201 12.385 13.826 1.98c2.68.384 3.743 3.685 1.791 5.561l-9.975 9.584 2.359 13.557c.461 2.648-2.31 4.679-4.697 3.442L94 142.253l-12.41 6.431c-2.388 1.237-5.159-.794-4.698-3.442l2.359-13.557-9.975-9.584c-1.952-1.876-.89-5.177 1.791-5.561l13.826-1.98z" clip-rule="evenodd"/><defs><linearGradient id="jato-illustrations-id-54" x1="60.924" x2="126.2" y1="100.543" y2="149.922" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'illustrationsFavoritesSmall': `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" fill="none" viewBox="0 0 110 110"><path fill="url(#jato-illustrations-id-55)" fill-rule="evenodd" d="M45.547 51.087c.6-1.196 2.307-1.196 2.906 0l3.1 6.193 6.914.99c1.34.192 1.871 1.842.895 2.78l-4.987 4.793 1.179 6.778c.23 1.324-1.155 2.34-2.349 1.721L47 71.126l-6.205 3.216c-1.194.619-2.58-.397-2.349-1.721l1.18-6.778-4.988-4.793c-.976-.938-.445-2.588.895-2.78l6.914-.99z" clip-rule="evenodd"/><path fill="gray" fill-opacity=".4" d="M105 95.5c0 1.657-22.386 2-50 2s-50-.343-50-2 22.5-1.25 50.25-1.75c36.5 1.284 49.75.093 49.75 1.75M100 86.25V55a6 6 0 0 0-6-6l-3.332 37.602a2.5 2.5 0 0 1-2.043 2.239L85 89.5s.884 1.583 1.25 2c.83.946 2.393 2.242 3.25 2.5.748.225 1.431 0 2.5 0 5.6 0 8-5 8-7.75"/><path stroke="#8d91a9" stroke-width="1.5" d="M90 16.75h5.848a1.5 1.5 0 0 1 1.493 1.645l-6.666 68.798A2 2 0 0 1 88.685 89H85.3" stroke-opacity="1"/><path stroke="#8d91a9" stroke-width="1.5" d="M21.75 28.5V13.75a2 2 0 0 1 2-2h63.5a2 2 0 0 1 2 2v73a2 2 0 0 1-2 2H84.5" stroke-opacity="1"/><path stroke="#8d91a9" stroke-width="1.5" d="M83.75 93.75h8a8 8 0 0 0 8-8V54.5A5.75 5.75 0 0 0 94 48.75" stroke-opacity="1"/><path fill="gray" fill-opacity=".2" d="M27.5 94H92c-6.25 0-7.75-5.466-8-8H28.5c-11 0-16.417-6.078-18-9 0 9.389 7.611 17 17 17"/><path stroke="#8d91a9" stroke-width="1.5" d="M16 28.75h26.008a5.25 5.25 0 0 1 3.777 1.605l.193.21 7.66 8.852a6.75 6.75 0 0 0 5.104 2.333H79c2.9 0 5.25 2.35 5.25 5.25v39c0 2.288.275 4.243 1.436 5.818.557.755 1.294 1.39 2.24 1.932H28c-9.527 0-17.25-7.723-17.25-17.25V34c0-2.9 2.35-5.25 5.25-5.25Z" stroke-opacity="1"/><defs><linearGradient id="jato-illustrations-id-55" x1="30.462" x2="63.1" y1="50.271" y2="74.961" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'illustrationsRecentlyAccessed': `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" fill="none" viewBox="0 0 220 220"><path fill="gray" fill-opacity=".4" d="M210 191c0 3.314-44.772 4-100 4s-100-.686-100-4 45-2.5 100.5-3.5c73 2.569 99.5.186 99.5 3.5M200 172.5V109c0-6.075-4.925-11-11-11l-7.555 76.491a5 5 0 0 1-4.976 4.509H170c.839 1.22 1.768 3.165 2.5 4 1.659 1.891 4.786 4.485 6.5 5 1.497.45 2.862 0 5 0 11.2 0 16-10 16-15.5"/><path stroke="#8d91a9" stroke-width="2" d="M168 188h16c8.837 0 16-7.163 16-16v-62c0-6.627-5.373-12-12-12" stroke-opacity="1"/><path fill="gray" fill-opacity=".2" d="M53.6 188H184c-12.5 0-15.5-10-16-15.068H57c-22 0-32.833-11.688-36-17.532 0 18.004 14.596 32.6 32.6 32.6"/><path stroke="#8d91a9" stroke-width="2" d="M32 57h51.993a11 11 0 0 1 8.14 3.602l.2.225 14.317 16.65A13 13 0 0 0 116.507 82H157c6.075 0 11 4.925 11 11v80.007c.023 3.414 2.449 10.842 10.503 14.993H56c-19.33 0-35-15.67-35-35V68c0-6.075 4.925-11 11-11Z" stroke-opacity="1"/><path stroke="#8d91a9" stroke-width="2" d="M180 33h11.696a3 3 0 0 1 2.987 3.288l-13.334 138.096a4 4 0 0 1-3.981 3.616h-6.766" stroke-opacity="1"/><path stroke="#8d91a9" stroke-width="2" d="M42 56.5V27a4 4 0 0 1 4-4h129a4 4 0 0 1 4 4v147a4 4 0 0 1-4 4h-6" stroke-opacity="1"/><path fill="url(#jato-illustrations-id-56)" fill-rule="evenodd" d="M94 156c16.569 0 30-13.431 30-30s-13.431-30-30-30c-16.568 0-30 13.431-30 30s13.432 30 30 30m1-46.75a2 2 0 1 0-4 0V130h13.25a2 2 0 1 0 0-4H95z" clip-rule="evenodd"/><defs><linearGradient id="jato-illustrations-id-56" x1="55.429" x2="134.573" y1="96.201" y2="152.842" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient></defs></svg>`,
'illustrationsRecentlyAccessedSmall': `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" fill="none" viewBox="0 0 110 110"><path fill="url(#jato-illustrations-id-46)" fill-rule="evenodd" d="M47 78c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15m.063-23.4a1 1 0 1 0-2 0v10.375h6.624a1 1 0 1 0 0-2h-4.624z" clip-rule="evenodd"/><path fill="gray" fill-opacity=".4" d="M105 95.5c0 1.657-22.386 2-50 2s-50-.343-50-2 22.5-1.25 50.25-1.75c36.5 1.284 49.75.093 49.75 1.75M100 86.25V55a6 6 0 0 0-6-6l-3.332 37.602a2.5 2.5 0 0 1-2.043 2.239L85 89.5s.884 1.583 1.25 2c.83.946 2.393 2.242 3.25 2.5.748.225 1.431 0 2.5 0 5.6 0 8-5 8-7.75"/><path stroke="#8d91a9" stroke-width="1.5" d="M90 16.75h5.848a1.5 1.5 0 0 1 1.493 1.645l-6.666 68.798A2 2 0 0 1 88.685 89H85.3" stroke-opacity="1"/><path stroke="#8d91a9" stroke-width="1.5" d="M21.75 28.5V13.75a2 2 0 0 1 2-2h63.5a2 2 0 0 1 2 2v73a2 2 0 0 1-2 2H84.5" stroke-opacity="1"/><path stroke="#8d91a9" stroke-width="1.5" d="M83.75 93.75h8a8 8 0 0 0 8-8V54.5A5.75 5.75 0 0 0 94 48.75" stroke-opacity="1"/><path fill="gray" fill-opacity=".2" d="M27.5 94H92c-6.25 0-7.75-5.466-8-8H28.5c-11 0-16.417-6.078-18-9 0 9.389 7.611 17 17 17"/><path stroke="#8d91a9" stroke-width="1.5" d="M16 28.75h26.008a5.25 5.25 0 0 1 3.777 1.605l.193.21 7.66 8.852a6.75 6.75 0 0 0 5.104 2.333H79c2.9 0 5.25 2.35 5.25 5.25v39c0 2.288.275 4.243 1.436 5.818.557.755 1.294 1.39 2.24 1.932H28c-9.527 0-17.25-7.723-17.25-17.25V34c0-2.9 2.35-5.25 5.25-5.25Z" stroke-opacity="1"/><defs><linearGradient id="jato-illustrations-id-46" x1="27.714" x2="67.287" y1="48.1" y2="76.421" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient></defs></svg>`,
'illustrationsDragDropSmall': `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" fill="none" viewBox="0 0 110 110"><path stroke="#8d91a9" stroke-linecap="round" stroke-width="1.5" d="M63.79 55.132V37.258m-8.936 8.937h17.874" stroke-opacity="1"/><path stroke="#8d91a9" stroke-dasharray="7 5" stroke-linecap="round" stroke-width="1.5" d="M54 77.25h36.25a4 4 0 0 0 4-4v-53.5a4 4 0 0 0-4-4H36.781a4 4 0 0 0-4 4V56" stroke-opacity="1"/><path fill="url(#jato-illustrations-id-89)" d="M16 61a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3v30a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3z"/><defs><linearGradient id="jato-illustrations-id-89" x1="21.143" x2="46.369" y1="62" y2="88.233" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient></defs></svg>`,
'illustrationsConfigureWidgetSmall': `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" fill="none" viewBox="0 0 110 110"><path fill="gray" d="M105 92c0 1.657-22.386 2-50 2s-50-.343-50-2 22.5-1.25 50.25-1.75C91.75 91.534 105 90.343 105 92" opacity=".4" fill-opacity="1"/><path fill="#8d91a9" fill-rule="evenodd" d="M42 13H11a3 3 0 0 0-3 3v69a3 3 0 0 0 3 3h88a3 3 0 0 0 3-3V16a3 3 0 0 0-3-3h-5.1c.362.26.54.674.587 1.5H99a1.5 1.5 0 0 1 1.5 1.5v69a1.5 1.5 0 0 1-1.5 1.5H11A1.5 1.5 0 0 1 9.5 85V16a1.5 1.5 0 0 1 1.5-1.5h31z" clip-rule="evenodd" fill-opacity="1"/><path fill="#8d91a9" fill-rule="evenodd" d="M42 20H8v65a3 3 0 0 0 3 3h88a3 3 0 0 0 3-3V20H91l-.7 1.5h10.2V85a1.5 1.5 0 0 1-1.5 1.5H11A1.5 1.5 0 0 1 9.5 85V21.5H42z" clip-rule="evenodd" fill-opacity="1"/><circle cx="18.25" cy="17.25" r="1.25" fill="#8d91a9" fill-opacity="1"/><circle cx="12.75" cy="17.25" r="1.25" fill="#8d91a9" fill-opacity="1"/><path fill="#8d91a9" fill-rule="evenodd" d="M84.69 28.424v18.002a3.2 3.2 0 0 1-3.202 3.202H47.637a3.2 3.2 0 0 1-3.202-3.203v-33.85a3.2 3.2 0 0 1 3.202-3.203h18.106A34 34 0 0 1 64.853 8H47.637a4.575 4.575 0 0 0-4.574 4.575v33.85A4.575 4.575 0 0 0 47.637 51h33.851a4.575 4.575 0 0 0 4.575-4.574V29.249a19 19 0 0 1-1.373-.825" clip-rule="evenodd" fill-opacity="1"/><path fill="gray" fill-opacity=".1" d="M11 87.5h88a3 3 0 0 0 3-3C55.75 72.5 15 48.25 8 17v67.5a3 3 0 0 0 3 3"/><path fill="url(#jato-illustrations-id-88)" fill-rule="evenodd" d="M75.262 1.233A1.07 1.07 0 0 1 76.279.5h3.288c.462 0 .872.295 1.018.733l.954 2.864 2.36 1.18 2.861-1.909a1.07 1.07 0 0 1 1.353.134L90.5 5.887c.361.362.417.928.134 1.353l-1.909 2.863 1.18 2.358 2.864.955c.437.146.733.556.733 1.017v3.289c0 .461-.296.871-.733 1.017l-2.864.955-1.18 2.358 1.909 2.863c.283.425.227.991-.134 1.353l-2.386 2.385a1.07 1.07 0 0 1-1.353.134l-2.862-1.908-2.359 1.18-.954 2.863a1.07 1.07 0 0 1-1.018.733H76.28c-.462 0-.871-.295-1.017-.733l-.955-2.864-2.359-1.18-2.862 1.909a1.07 1.07 0 0 1-1.353-.134l-2.385-2.385a1.07 1.07 0 0 1-.134-1.353l1.908-2.863-1.18-2.358-.392-.131-2.471-.824a1.07 1.07 0 0 1-.733-1.017v-3.289c0-.461.295-.87.733-1.017l2.864-.955 1.18-2.358-1.91-2.863a1.07 1.07 0 0 1 .135-1.353l2.385-2.385a1.07 1.07 0 0 1 1.353-.134l2.862 1.908 2.36-1.179zm2.662 7.332a7.513 7.513 0 1 0 0 15.026 7.513 7.513 0 0 0 0-15.026" clip-rule="evenodd"/><rect width="21.5" height="21.5" x="15.75" y="28.75" stroke="#8d91a9" stroke-linecap="round" stroke-width="1.5" rx="2.75" stroke-opacity="1"/><rect width="21.5" height="21.5" x="15.75" y="56.75" stroke="#8d91a9" stroke-linecap="round" stroke-width="1.5" rx="2.75" stroke-opacity="1"/><rect width="21.5" height="21.5" x="43.75" y="56.75" stroke="#8d91a9" stroke-linecap="round" stroke-width="1.5" rx="2.75" stroke-opacity="1"/><defs><linearGradient id="jato-illustrations-id-88" x1="57.895" x2="98.991" y1=".604" y2="30.015" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient></defs></svg>`,
};
return icons;
});


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/document.overview.json',{
  "type": "left-center-right",
  "options": {
    "center": {
      "type": "csui/widgets/document.overview"
    }
  }
}
);


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/version.overview.json',{
  "type": "left-center-right",
  "options": {
    "center": {
      "type": "csui/widgets/version.overview"
    }
  }
}
);


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/favorites2.table.json',{
  "type": "left-center-right",
  "options": {
    "center": {
      "type": "csui/widgets/favorites2.table"
    }
  }
});


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/container.json',{
  "type": "left-center-right",
  "options": {
    "center": {
      "type": "csui/widgets/nodestable"
    }
  }
}
);


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/metadata.json',{
  "type": "left-center-right",
  "options": {
    "center": {
      "type": "csui/widgets/metadata"
    }
  }
}
);


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/metadata.navigation.json',{
  "type": "left-center-right",
  "options": {
    "center": {
      "type": "csui/widgets/metadata.navigation"
    }
  }
}
);


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/recentlyaccessedtable.json',{
  "type": "left-center-right",
  "options": {
    "center": {
      "type": "csui/widgets/recentlyaccessedtable"
    }
  }
});


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/search.json',{
  "type": "left-center-right",
  "options": {
    "center": {
      "type": "csui/widgets/search.results",
      "className": "search-results-container"
    }
  }
}
);


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/saved.query.json',{
  "type": "grid",
  "options": {
    "rows": [
      {
        "columns": [
          {
            "sizes": {
              "md": 12
            },
            "heights": {
              "xs": "half"
            },
            "widget": {
              "type": "csui/widgets/placeholder",
              "options": {
                "label": "Saved Query",
                "color": "#fff",
                "bgcolor": "#cccc88"
              }
            }
          },
          {
            "sizes": {
              "md": 12
            },
            "heights": {
              "xs": "full"
            },
            "widget": {
              "type": "csui/widgets/search.results",
              "options": {
              }
            }
          }
        ]
      }
    ]
  }
}
);


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/user.json',{
  "type": "flow",
  "options": {
    "widgets": [{
        "type": "csui/widgets/welcome.placeholder"
      },
      {
        "type": "csui/widgets/myassignments"
      },
      {
        "type": "csui/widgets/favorites"
      },
      {
        "type": "csui/widgets/shortcuts",
        "options": {
          "shortcutItems": [{
            "type": 141
          }],
          "shortcutTheme": "csui-shortcut-theme-teal2"
        }
      },
      {
        "type": "csui/widgets/shortcuts",
        "options": {
          "shortcutItems": [{
            "type": 142
          }],
          "shortcutTheme": "csui-shortcut-theme-pink1"
        }
      },
      {
        "type": "csui/widgets/recentlyaccessed"
      }
    ]
  }
});


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/recycleitems.table.json',{
    "type": "left-center-right",
    "options": {
      "center": {
        "type": "csui/widgets/recycle.items.table"
      }
    }
});


csui.define('csui/models/widget/myassignments.model',['csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.commandable/v2.commandable.mixin',
  'csui/models/browsable/client-side.mixin', 'csui/models/browsable/v2.response.mixin',
  'csui/models/nodechildrencolumn', 'csui/models/nodechildrencolumns',
  'csui/models/node/node.model', 'i18n!csui/models/widget/nls/lang',
  'csui/utils/deepClone/deepClone'
], function (_, Backbone, Url, ConnectableMixin, FetchableMixin,
    AdditionalResourcesV2Mixin, FieldsV2Mixin, ExpandableV2Mixin, StateRequestorMixin,
    CommandableV2Mixin, ClientSideBrowsableMixin, BrowsableV2ResponseMixin,
    NodeChildrenColumnModel, NodeChildrenColumnCollection, NodeModel, lang) {
  'use strict';

  var MyAssignmentColumnModel = NodeChildrenColumnModel.extend({

    constructor: function MyAssignmentColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var columnKey = 'ma_' + attributes.column_key;
        attributes.title = lang[columnKey];
      }
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }

  });

  var MyAssignmentColumnCollection = NodeChildrenColumnCollection.extend({

    model: MyAssignmentColumnModel,

    constructor: function MyAssignmentColumnCollection(models, options) {
      if (!models) {
        models = [
          {
            key: 'type',
            type: 2,
            sort: true,
            default_action: true,
            name: 'Type'
          },
          {
            key: 'name',
            type: -1,
            sort: true,
            default_action: true,
            contextual_menu: false,
            editable: true,
            filter_key: 'name',
            name: 'Name'
          },
          {
            key: 'location_name',
            type: 2,
            sort: true,
            name: 'Location',
            filter_key: 'location_name'
          },
          {
            key: 'date_due',
            type: -7,
            sort: true,
            name: 'Due Date'
          },
          {
            key: 'priority',
            type: 2,
            sort: true,
            name: 'Priority'
          },
          {
            key: 'status',
            type: 2,
            sort: true,
            initialSortingDescending: true,
            name: 'Status'
          },
          {
            key: 'from_user_name',
            type: -1,
            sort: true,
            name: 'From'
          }
        ];

        models.forEach(function (column, index) {
          column.definitions_order = index + 100;
          column.column_key = column.key;
        });
      }
      NodeChildrenColumnCollection.prototype.constructor.call(this, models, options);
    },

    // private
    getColumnModels: function (columnKeys, definitions) {
      var columns = NodeChildrenColumnCollection.prototype.getColumnModels.call(
          this, columnKeys, definitions);
      _.each(columns, function (column) {
        var columnKey = column['column_key'];
        if (columnKey === 'type' || columnKey === 'name' || columnKey === 'location_name' ||
            columnKey === 'date_due' || columnKey === 'priority' || columnKey === 'status' ||
            columnKey === 'from_user_name') {
          column.sort = true;
        }
      });
      return columns;
    },

    // private: convert v2 'metadata' to v1 'definitions' for backward code compatibility and
    //          reuse purpose
    getV2Columns: function (response) {

      // Note: from a long discussion with the server developer, use the common 'metadata' (or
      // called 'definitions' in v1) in the first element. Elements in the collection can have
      // different extended metadata (definitions).  If a business case arises that
      // extended definitions are needed, will discuss again with them and add that support.

      var definitions = (response.results && response.results[0] &&
                         response.results[0].metadata &&
                         response.results[0].metadata.assignments) || {};

      // TODO: the server is currently missing the metadata output for expanded fields.
      // Remove this temporary hard-coded code after the server properly outputs metadata.
      // Watch for LPAD-43411.
      if (!definitions.location_id_expand && definitions.name) {
        definitions.location_id_expand = _.clone(definitions.name);
        definitions.location_id_expand.key = 'location_id_expand';
        definitions.location_id_expand.name = 'Location';
      }
      if (!definitions.from_user_id_expand && definitions.name) {
        definitions.from_user_id_expand = _.clone(definitions.name);
        definitions.from_user_id_expand.key = 'from_user_id_expand';
        definitions.from_user_id_expand.name = 'From';
      }

      // client-side sub-field column
      if (!definitions.location_name && definitions.name) {
        definitions.location_name = _.clone(definitions.name);
        definitions.location_name.key = 'location_name';
        definitions.location_name.name = 'Location Name';
      }
      if (!definitions.from_user_name && definitions.name) {
        definitions.from_user_name = _.clone(definitions.name);
        definitions.from_user_name.key = 'from_user_name';
        definitions.from_user_name.name = 'From';
      }

      var columnKeys = _.keys(definitions);

      return this.getColumnModels(columnKeys, definitions);
    }

  });

  var MyAssignmentModel = NodeModel.extend({

    parse: function (response, options) {
      var assignments = response.data.assignments;
      assignments.short_name = assignments.name;

      var from_user_id_expand = assignments.from_user_id_expand || {};
      var name = from_user_id_expand.first_name || '';
      name = name + ' ' + (from_user_id_expand.last_name || '');
      if (!name.length || (name.length === 1 && name === ' ')) {
        name = from_user_id_expand.name;
      }
      assignments.from_user_name = name;

      if (response.data && response.data.assignments) {
        response.data.properties = response.data.assignments;
      }

      var node = NodeModel.prototype.parse.call(this, response, options);
      return node;
    }

  });

  var MyAssignmentCollection = Backbone.Collection.extend({

    model: MyAssignmentModel,

    constructor: function MyAssignmentCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      // Support collection cloning
      if (options) {
        this.options = _.pick(options, ['connector', 'autoreset',
          'includeResources', 'fields', 'expand', 'commands']);
      }

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeStateRequestor(options)
          .makeCommandableV2(options)
          .makeClientSideBrowsable(options)
          .makeBrowsableV2Response(options);

      this.columns = new MyAssignmentColumnCollection();
    },

    clone: function () {
      // Provide the options; they may include connector and other parameters
      var clone = new this.constructor(this.models, this.options);
      // Clone sub-models not covered by Backbone
      if (this.columns) {
        clone.columns.reset(this.columns.toJSON());
      }
      // Clone properties about the full (not-yet fetched) collection
      clone.actualSkipCount = this.actualSkipCount;
      clone.totalCount = this.totalCount;
      clone.filteredCount = this.filteredCount;
      return clone;
    },

    url: function () {
      var url   = this.connector.getConnectionUrl().getApiBase('v2'),
          query = Url.combineQueryString(
              this.getAdditionalResourcesUrlQuery(),
              this.getResourceFieldsUrlQuery(),
              this.getExpandableResourcesUrlQuery(),
              this.getStateEnablingUrlQuery(),
              this.getRequestedCommandsUrlQuery()
          );
      url = Url.combine(url, '/members/assignments');
      return query ? url + '?' + query : url;
    },

    parse: function (response, options) {
      // filter out pstage items
      response.results = _.filter(response.results, function (item) {
        return item.data.assignments.type != 398; //pstage
      });

      this.parseBrowsedState(response, options);
      // don't parse columns here, because they are hardcoded in the constructor
      return this.parseBrowsedItems(response, options);
    },

    getResourceScope: function () {
      return _.deepClone({
        fields: this.fields,
        expand: this.expand,
        includeResources: this._additionalResources,
        commands: this.commands
      });
    },

    setResourceScope: function (scope) {
      this.excludeResources();
      scope.includeResources && this.includeResources(scope.includeResources);
      this.resetFields();
      scope.fields && this.setFields(scope.fields);
      this.resetExpand();
      scope.expand && this.setExpand(scope.expand);
      this.resetCommands();
      scope.commands && this.setCommands(scope.commands);
    }

  });

  ClientSideBrowsableMixin.mixin(MyAssignmentCollection.prototype);
  // when due_date is null, put the record at the bottom for ascending sort as PM and CWS request
  var originalCompareValues = MyAssignmentCollection.prototype._compareValues;
  MyAssignmentCollection.prototype._compareValues = function (property, left, right) {
    if (property.indexOf('date') >= 0) {
      if (left === null) {
        return 1;
      }
      if (right === null) {
        return -1;
      }
    }
    return originalCompareValues.apply(this, arguments);
  };

  BrowsableV2ResponseMixin.mixin(MyAssignmentCollection.prototype);
  ConnectableMixin.mixin(MyAssignmentCollection.prototype);
  FetchableMixin.mixin(MyAssignmentCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(MyAssignmentCollection.prototype);
  FieldsV2Mixin.mixin(MyAssignmentCollection.prototype);
  ExpandableV2Mixin.mixin(MyAssignmentCollection.prototype);
  StateRequestorMixin.mixin(MyAssignmentCollection.prototype);
  CommandableV2Mixin.mixin(MyAssignmentCollection.prototype);

  return MyAssignmentCollection;

});


csui.define('csui/models/sidebar.item',['csui/lib/backbone',
'csui/widgets/error/error.view'
], function (Backbone,ErrorView) {
  'use strict';

  var SidebarItemModel = Backbone.Model.extend({

    idAttribute: 'signature',

    constructor: function SidebarItemModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },

    isEnabled: function(){
      return true;
    },

    getPanelView: function () {
      return new ErrorView();
    },

    getPanelTitle: function(){
      return this.get("panelTitle") || this.get("name")
    }

  });

  return SidebarItemModel;

});


csui.define('csui/temporary/activeviews/icons/icons',['csui/themes/csui.jato.mime.icons'
], function (jatoIcons) {
  'use strict';

  return [
    {
      // ActiveView
      equals: {type: 30309},
      jatoIcon: jatoIcons.mimeActiveView,
      className: 'csui-icon mime_active_view',
      // ActiveView has a MIME type, which would decide the icon otherwise;
      // the MIME type icons have the sequence number 50 in common
      sequence: 30
    },
    {
      // web report
      equals:    {type: 30303},
      jatoIcon: jatoIcons.mimeWebReports,
      className: 'csui-icon mime_web_report',
      // Web Report has a MIME type, which would decide the icon otherwise;
      // the MIME type icons have the sequence number 50 in common
      sequence:  30
    }
  ];

});


csui.define('csui/temporary/appearances/icons/icons',['csui/themes/csui.jato.mime.icons'
], function (jatoIcons) {
  'use strict';

  return [
    {
      // Appearance
      equals: {type: 480},
      jatoIcon: jatoIcons.mimeAppearance,
      className: 'csui-icon mime_appearance',
      // Appearance has a MIME type, which would decide the icon otherwise;
      // the MIME type icons have the sequence number 50 in common
      sequence: 30
    }
  ];

});


csui.define('css!csui/temporary/cop/icons/icons',[],function(){});

csui.define('csui/temporary/cop/icons/icons',['csui/themes/csui.jato.mime.icons',
  'css!csui/temporary/cop/icons/icons'
], function (jatoIcons) {
  'use strict';

  return [
    // Blog, FAQ, Forum, Wiki and their entries have a MIME type,
    // which would decide the icon otherwise; the MIME type icons
    // have the sequence number 50 in common
    {
      // blog
      equals:    {type: 356},
      className: 'csui-icon csui-temporary-cop-blog',
      jatoIcon: jatoIcons.mimeBlog,
      sequence:  30
    },
    {
      // blog entry
      equals:    {type: 357},
      className: 'csui-icon mime_blog_entry',
      jatoIcon: jatoIcons.mimeBlogEntry,
      sequence:  30
    },
    {
      // collaborative place
      equals:    {type: 1257},
      className: 'csui-icon mime_collaborative_place',
      jatoIcon: jatoIcons.mimeCollaborativePlace,
      sequence:  30
    },
    {
      // faq
      equals:    {type: 123475},
      className: 'csui-icon mime_faq',
      jatoIcon: jatoIcons.mimeFaq,
      sequence:  30
    },
    {
      // faq entry
      equals:    {type: 123476},
      className: 'csui-icon mime_faq_entry',
      jatoIcon: jatoIcons.mimeFaqEntry,
      sequence:  30
    },
    {
      // forum
      equals:    {type: 123469},
      className: 'csui-icon mime_forum',
      jatoIcon: jatoIcons.mimeForum,
      sequence:  30
    },
    {
      // forum topics and replies
      equals:    {type: 123470},
      className: 'csui-icon mime_forum_topics_replies',
      jatoIcon: jatoIcons.mimeForumTopicsReplies,
      sequence:  30
    },
    {
      // topic
      equals:    {type: 130},
      className: 'csui-icon mime_topic',
      jatoIcon: jatoIcons.mimeTopic,
      sequence:  30
    },
    {
      // wiki
      equals:    {type: 5573},
      className: 'csui-icon mime_wiki',
      jatoIcon: jatoIcons.mimeWiki,
      sequence:  30
    },
    {
      // wiki page
      equals:    {type: 5574},
      jatoIcon: jatoIcons.mimeWikiPage,
      className: 'csui-icon mime_wiki_page',
      sequence:  30
    },
    {
      // community
      equals:    {type: 3030202},
      jatoIcon: jatoIcons.mimeCommunity,
      className: 'csui-icon mime_community',
      sequence:  30
    }
  ];

});


csui.define('bundles/csui-data',[
  // icon-v2
  'csui/controls/icons.v2',
  'csui/controls/icon/icon.view',

  // Behaviours
  'csui/behaviors/default.action/default.action.behavior',
  // The controller using the commands is loaded dynamically
  'csui/behaviors/default.action/impl/defaultaction',
  'csui/behaviors/dropdown.menu/dropdown.menu.behavior',
  'csui/behaviors/keyboard.navigation/retainfocus.behavior',
  'csui/behaviors/keyboard.navigation/tabkey.behavior',
  'csui/behaviors/widget.container/widget.container.behavior',

  // Controls
  'csui/controls/error/error.view',
  'csui/controls/globalmessage/globalmessage',
  'css!csui/controls/globalmessage/globalmessage_icons',
  'csui/controls/grid/grid.view',
  'csui/controls/doc.preview/doc.preview.view',
  'csui/controls/doc.preview/active.plugin',
  'csui/controls/doc.preview/preview.plugins/preview.plugins',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/controls/node-type.icon/node-type.icon.view.ext',
  'csui/controls/progressblocker/blocker',
  'csui/controls/globalmessage/impl/progresspanel/progresspanel.view',
  'csui/controls/globalmessage/impl/progresspanel/progressbar.view',
  'csui/controls/globalmessage/progresspanel.view.ext',
  'csui/controls/globalmessage/message.dialog.mixin',
  'csui/controls/globalmessage/progressbar.view.ext',
  'i18n!csui/controls/globalmessage/impl/nls/globalmessage.lang',
  'csui/controls/perspective.panel/perspective.animator',
  'csui/controls/perspective.panel/perspective.panel.view',
  'csui/controls/breadcrumbspanel/breadcrumbspanel.view',
  'csui/controls/breadcrumbs/breadcrumbs.view',
  'csui/controls/breadcrumbs/breadcrumb.view',
  'csui/controls/breadcrumbs/impl/breadcrumb/breadcrumb.view',
  'csui/controls/form/pub.sub',
  'csui/controls/mixins/dynamic.toolitems/dynamic.toolitems.mixin',
  'csui/controls/mixins/keyboard.navigation/modal.keyboard.navigation.mixin',
  'csui/controls/tab.panel/tab.panel.view',
  'csui/controls/tab.panel/tab.panel.view.v2',
  'csui/controls/tab.panel/requiredfield/tab.contents.header.requiredfield.view',
  'csui/controls/otc.menu/menu.items.view',
  'csui/controls/otc.menu/menu.item.view',
  'csui/controls/tab.panel/tab.links.dropdown.view',
  'csui/controls/tab.panel/tab.links.ext.scroll.mixin',
  'csui/controls/tab.panel/tab.links.ext.view',
  'csui/controls/tab.panel/impl/tab.link.ext.view',
  'csui/controls/tab.panel/tab.link.ext.view.v2',
  'csui/controls/tab.panel/tab.links.ext.view.v2',
  'csui/controls/tab.panel/tab.links.ext.scroll.mixin.v2',
  'csui/controls/tab.panel/impl/tab.contents.view',
  'csui/controls/tab.panel/behaviors/common.keyboard.behavior.mixin',
  'csui/controls/tab.panel/behaviors/tab.contents.keyboard.behavior',
  'csui/controls/tab.panel/behaviors/tab.contents.proxy.keyboard.behavior',
  'csui/controls/tab.panel/behaviors/tab.links.dropdown.keyboard.behavior',
  'csui/controls/tab.panel/behaviors/tab.links.keyboard.behavior',
  'csui/controls/tab.panel/behaviors/tab.panel.keyboard.behavior',
  'csui/controls/perspective.header/perspective.header.view',
  // Used in tab.link.dropdown.view from csui-forms
  'csui/controls/tab.panel/impl/tab.link.view',
  // Used in tab.links.ext.view from csui-forms
  'csui/controls/tab.panel/impl/tab.links.view',
  //Shared for metadataproperties from cs-metadata
  'i18n!csui/controls/tab.panel/impl/nls/lang',

  // Control mixins
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/controls/mixins/global.alert/global.alert.mixin',
  'csui/controls/mixins/view.state/metadata.view.state.mixin',
  'csui/controls/mixins/view.state/node.view.state.mixin',
  'csui/controls/mixins/view.state/toolitems.state.mixin',
  'csui/controls/mixins/view.state/multi.node.fetch.mixin',
  'csui/controls/mixins/view.state/node.selection.restore.mixin',
  'csui/controls/mixins/search.query/search.query.mixin',

  // Control behaviours
  'csui/controls/tile/behaviors/blocking.behavior',
  'csui/controls/tile/behaviors/infinite.scrolling.behavior',
  'csui/controls/tile/behaviors/parent.scrollbar.updating.behavior',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/controls/tile/behaviors/searching.behavior',
  'csui/behaviors/drag.drop/dnd.container.behaviour',

  // Dialogs
  'csui/dialogs/modal.alert/modal.alert',

  // Perspectives
  'csui/perspectives/flow/flow.perspective.view',
  'csui/perspectives/grid/grid.perspective.view',
  'csui/perspectives/left-center-right/left-center-right.perspective.view',
  'csui/perspectives/banner-content-sidebar/banner-content-sidebar.perspective.view',
  'csui/perspectives/sidepanel-left/sidepanel-left.perspective.view',
  'csui/perspectives/sidepanel-right/sidepanel-right.perspective.view',
  'csui/perspectives/single/single.perspective.view',
  'csui/perspectives/tabbed/tabbed.perspective.view',
  'csui/perspectives/tabbed-flow/tabbed-flow.perspective.view',
  'csui/perspectives/zone/zone.perspective.view',
  'csui/perspectives/mixins/perspective.edit.mixin',

  // Perspectives Related
  'csui/perspectives/tabbed/tab.index/tab.index.preferences',

  // Public language modules
  'i18n!csui/pages/start/nls/lang',

  // Routers
  'csui/pages/start/perspective.router',
  'csui/pages/start/perspective.routing',
  'csui/pages/start/multi.perspective.routing',
  'csui/pages/start/impl/landing.perspective.router',
  'csui/pages/start/impl/node.perspective.router',
  'csui/pages/start/impl/search.perspective.router',
  'csui/pages/start/impl/metadata.perspective.router',
  'csui/pages/start/impl/root.perspective.router',
  'csui/pages/start/impl/version.perspective.router',

  // Utilities
  'csui/utils/classic.nodes/impl/core.classic.nodes',
  'csui/utils/content.helper',
  'csui/utils/handlebars/l10n',
  'csui/utils/impl/core.defaultactionitems',
  'csui/utils/non-attaching.region/non-attaching.region',
  'csui/utils/non-emptying.region/non-emptying.region',
  'csui/utils/script-executing.region/script-executing.region',
  'csui/utils/node.links/impl/core.node.links',
  'csui/utils/open.authenticated.page',
  'csui/utils/smart.nodes/impl/core.smart.nodes',
  'csui/utils/taskqueue',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',

  // Open plugins are bundled in csui-view-support, but one of them is used
  // as a preview plugin too. Although originally private, it's become
  // an inter-bundle dependency.
  'csui/utils/commands/open.plugins/impl/brava.plugin',

  // Contexts and factories
  'csui/models/node/node.addable.type.factory',
  'csui/controls/perspective.panel/perspective.factory',
  'csui/utils/contexts/browsing/browsing.context',
  'csui/utils/contexts/impl/csui.context.plugin',
  'csui/utils/contexts/portal/portal.context',
  'csui/utils/contexts/perspective/impl/landing.perspective.context.plugin',
  'csui/utils/contexts/perspective/plugins/node/node.perspective.context.plugin',
  'csui/utils/contexts/perspective/impl/search.perspective.context.plugin',
  'csui/utils/contexts/perspective/plugins/search.perspective.context.plugin',
  'csui/utils/contexts/perspective/impl/metadata.perspective.context.plugin',
  'csui/utils/contexts/perspective/impl/root.perspective.context.plugin',
  'csui/utils/contexts/perspective/impl/version.perspective.context.plugin',
  'csui/utils/contexts/perspective/plugins/node/main.node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/impl/csui.node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/impl/csui.main.node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/utils/implement.extra.data',
  'csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data',
  'csui/utils/contexts/perspective/landing.perspectives',
  'csui/utils/contexts/perspective/node.perspectives',
  'csui/utils/contexts/perspective/perspective.context',
  'csui/utils/contexts/perspective/perspective.guide',
  'csui/utils/contexts/perspective/perspective.context.plugin',
  'csui/utils/contexts/perspective/search.perspectives',
  'csui/utils/contexts/factories/ancestors',
  'csui/utils/contexts/factories/appcontainer',
  'csui/utils/contexts/factories/children',
  'csui/utils/contexts/factories/children2',
  'csui/utils/contexts/factories/columns',
  'csui/utils/contexts/factories/columns2',
  'csui/utils/contexts/factories/global.error',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/contexts/factories/previous.node',
  'csui/utils/contexts/factories/version',
  'csui/utils/contexts/factories/next.version',
  'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/usernodepermission',
  'csui/utils/contexts/factories/volume',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/favoritescolumns',
  'csui/utils/contexts/factories/favorite2groups',
  'csui/utils/contexts/factories/favorites',
  'csui/utils/contexts/factories/favorites2',
  'csui/utils/contexts/factories/favorite2columns',
  'csui/utils/contexts/factories/recentlyaccessedcolumns',
  'csui/utils/contexts/factories/recentlyaccessed',
  'csui/utils/contexts/factories/recycle.bin',
  'csui/utils/contexts/factories/recycle.items.columns.factory',
  'csui/utils/contexts/factories/recycle.items',
  'csui/utils/contexts/factories/member',
  'csui/utils/contexts/factories/search.box.factory',
  'csui/utils/contexts/factories/search.formquery.factory',
  'csui/utils/contexts/factories/search.metadata.factory',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/metadata.factory',
  'csui/utils/contexts/factories/task.queue.factory',
  'csui/utils/contexts/factories/server.info',
  'csui/utils/contexts/factories/search.settings.factory',
  'csui/utils/contexts/factories/largefilesettings.factory',
  'csui/utils/contexts/factories/objecttypes.factory',
  'csui/utils/contexts/factories/branding.config.factory',
  'csui/utils/contexts/factories/widget.settings.collection.factory',

  // helper code to make the routing code testable
  'csui/pages/start/impl/location',

  'csui/themes/csui.jato.action.icons',
  'csui/themes/csui.jato.status.icons',
  'csui/themes/csui.jato.mime.illustrations',

  // Client-side perspectives
  'json!csui/utils/contexts/perspective/impl/perspectives/document.overview.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/version.overview.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/favorites2.table.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/container.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/metadata.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/metadata.navigation.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/recentlyaccessedtable.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/search.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/saved.query.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/user.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/recycleitems.table.json',

  // Application widgets
  'csui/widgets/error/error.view',

  // Models publicly exposed
  'csui/models/widget/myassignments.model',
  'csui/models/widget/recentlyaccessed.model',
  'csui/models/widget/recycle.items.model',
  'csui/models/sidebar.item',

  // TODO: Remove this, as long as the module owners take over
  // the icons
  'csui/temporary/activeviews/icons/icons',
  'csui/temporary/appearances/icons/icons',
  'csui/temporary/cop/icons/icons',

  // TODO: Remove this module from public area. Localization has to
  // be private  for its module.
  'i18n!csui/models/widget/nls/lang',
  'i18n!csui/pages/start/impl/nls/lang',
  'i18n!csui/perspectives/impl/nls/lang'
], {});

csui.require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-data', true);
});


csui.define('csui/pages/start/impl/perspective.factory',[
  'csui/controls/perspective.panel/perspective.factory'
], function (PerspectiveFactory) {
  'use strict';

  console.warn('DEPRECATED: depend on the module "csui/controls/perspective.panel/perspective.factory" instead.');

  return PerspectiveFactory;
});

csui.define('csui/pages/start/impl/perspective.router',[
  'csui/utils/routing'
], function (routing) {
  'use strict';

  // TODO: Deprecate this module, use csui/utils/routing

  function PerspectiveRouter() {}

  PerspectiveRouter.routesWithSlashes = routing.routesWithSlashes;

  return PerspectiveRouter;
});


csui.define('csui/pages/start/impl/perspective.panel/perspective.animator',[
  'csui/controls/perspective.panel/perspective.animator'
], function (PerspectiveAnimator) {
  'use strict';

  console.warn('DEPRECATED: depend on the module "csui/controls/perspective.panel/perspective.animator" instead.');

  return PerspectiveAnimator;
});

csui.define('csui/pages/start/impl/perspective.panel/perspective.panel.view',[
  'csui/controls/perspective.panel/perspective.panel.view'
], function (PerspectivePanelView) {
  'use strict';

  console.warn('DEPRECATED: depend on the module "csui/controls/perspective.panel/perspective.panel.view" instead.');

  return PerspectivePanelView;
});
//# sourceMappingURL=csui-data.js.map