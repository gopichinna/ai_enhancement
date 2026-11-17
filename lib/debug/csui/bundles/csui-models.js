csui.define('csui/models/audit/server.adaptor.mixin',[
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
          var apiUrl = new Url(this.connector.connection.url).getApiBase(2);
          var query = Url.combineQueryString(
              this.getBrowsableUrlQuery(),
              {
                expand: 'audit{id, user_id, agent_id, target_user_id}'
              }
          );
          return Url.combine(apiUrl, 'nodes', this.options.node.get('id'), 'audit?' + query) ;
        },

        parse: function (response, options) {
          this.parseBrowsedState(response, options);
          this.columns && this.columns.resetColumnsV2(response, this.options);
          this.auditEvents.add(response.results.data.audit_event_types);
          return response.results.data.audit;
        },

        isFetchable: function () {
          return !!this.options;
        },

      });
    }

  };

  return ServerAdaptorMixin;
});

csui.define('csui/models/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/models/impl/nls/root/lang',{
  serverCallPrecheckFailedMissingConnector: 'Missing connector data for server call.',
  serverCallPrecheckFailedModelIsNew: 'Model is new.',

  fav_parent_id: 'Location',
  fav_favorite_name: 'Name',
  fav_size: 'Size',
  fav_ungrouped: 'Ungrouped',

  proxy_working_as:' working as ',

  name: "Name",
  type: "Type",
  version: "Version",
  state: "State",
  favorite: "Favorite",
  comment: "Comments", //TODO: move it to cs-sv-ui once comment column is removed completely from table/search columns in csui
  toggleDetails: "Toggle Details",
  parentID: "Parent ID"
});




csui.define('csui/models/audit/audit.collection',['csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/browsable/browsable.mixin',
  'csui/models/browsable/v2.response.mixin',
  'csui/models/browsable/v1.request.mixin',
  'csui/models/audit/server.adaptor.mixin',
  'csui/models/nodechildrencolumn',
  'csui/models/nodechildrencolumns',
  'csui/models/node/node.model',
  'i18n!csui/models/impl/nls/lang'
], function (_, $, Backbone, ConnectableMixin, FetchableMixin, BrowsableMixin,
    BrowsableV2ResponseMixin, BrowsableV1RequestMixin, ServerAdaptorMixin, NodeChildrenColumnModel,
    NodeChildrenColumnCollection, NodeModel, lang) {

  var auditObject = {
    auditName: 'audit_name',
    auditDate: 'audit_date',
    userIdKey: 'user_id',
    proxyUserIdKey: 'target_user_id',
    dateType: '-7'
  };

  var AuditColumnModel = NodeChildrenColumnModel.extend({

    constructor: function AuditColumnModel(attributes, options) {
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }
  });

  var AuditColumnCollection = NodeChildrenColumnCollection.extend({

    model: AuditColumnModel,

    resetColumnsV2: function (response, options) {
      if(!this.models.length) {// Stopping reset as event data is static and doesn't change after first fetch
      this.resetCollection(this.getV2Columns(response), options);
    }
    },

    getColumnModels: function (columnKeys, definitions) {
      var columns = NodeChildrenColumnCollection.prototype.getColumnModels.call(
          this, columnKeys, definitions);
      _.each(columns, function (column) {
        var columnKey = column['column_key'];
        if (columnKey === auditObject.auditDate) {
          column.sort = true;
        }
      });
      return columns;
    },

    getV2Columns: function (response) {
      var definitions = (response.results &&
                         response.results[0] &&
                         response.results[0].metadata &&
                         response.results[0].metadata.properties) || {};

        definitions.audit_name = {filter: true};
        definitions.audit_date = {};
        definitions.user_id = {
          filter: true,
          proxykey: auditObject.proxyUserIdKey,
          proxyWorksAs: lang.proxy_working_as
        };

        definitions.audit_name.key = auditObject.auditName;
        definitions.audit_date.key = auditObject.auditDate;
        definitions.user_id.key = auditObject.userIdKey;
        definitions.audit_date.type = auditObject.dateType;

      var columnKeys = _.keys(definitions);
      return this.getColumnModels(columnKeys, definitions);
    }

  });

  var AuditEventModel = Backbone.Model.extend({});

  var AuditEventCollection = Backbone.Collection.extend({

    model: AuditEventModel,
    constructor: function AuditEventCollection(models, options) {
      this.options = options || {};
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },
  });

  var AuditModel = NodeModel.extend({});

  var AuditCollection = Backbone.Collection.extend({

    model: AuditModel,

    constructor: function AuditCollection(models, options) {
      this.options = options || {};
      Backbone.Collection.prototype.constructor.call(this, models, options);

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeBrowsable(options)
          .makeBrowsableV2Response(options)
          .makeBrowsableV1Request(options)
          .makeServerAdaptor(options);

      this.columns = new AuditColumnCollection();
      this.auditEvents = new AuditEventCollection();
    }

  });

  ConnectableMixin.mixin(AuditCollection.prototype);
  FetchableMixin.mixin(AuditCollection.prototype);
  BrowsableMixin.mixin(AuditCollection.prototype);
  BrowsableV2ResponseMixin.mixin(AuditCollection.prototype);
  BrowsableV1RequestMixin.mixin(AuditCollection.prototype);
  ServerAdaptorMixin.mixin(AuditCollection.prototype);

  return AuditCollection;

});

csui.define('csui/models/authenticated.user.node.permission',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/expandable/expandable.mixin',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/including.additional.resources/including.additional.resources.mixin'
], function (_, Backbone, Url, ExpandableMixin, ResourceMixin,
    IncludingAdditionalResourcesMixin) {
  'use strict';

  var AuthenticatedUserNodePermissionModel = Backbone.Model.extend({
    constructor: function AuthenticatedUserNodePermissionModel(attributes, options) {
      options || (options = {});

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeResource(options)
          .makeIncludingAdditionalResources(options)
          .makeExpandable(options);
      this.options= options;
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    },

    url: function () {
      var selectedNodeId = this.node ? this.node.get('id') : this.options.node.get('id'),
          userId         = this.options.user.get('id');
      var apiBase = new Url(this.connector.connection.url).getApiBase('v2'),
          url     = Url.combine(apiBase, '/nodes/', selectedNodeId, '/permissions/effective/',
              userId);

      return url;
    },

    parse: function (response) {
      var permissions = response.results && response.results.data && response.results.data.permissions;
      if (permissions) {
        if (this.node && !this.node.get('container') && permissions.permissions.indexOf('add_items') !== -1) {
          permissions.permissions.splice(permissions.permissions.indexOf('add_items'), 1);
        }
      } else {
        permissions = {};
      }
      return permissions;
    },

    hasEditPermissionRights:function () {
      //Added check to provide edit rights to wiki pages(i.e. HTML widgets) only
      /*var nodeType = this.node ? this.node.get('type') : this.options.node.get('type');
      if(nodeType !== 5574) { //Wiki page type- 5574
        return false;
      }*/
      if (this.node && this.node.get("permissions_model") === "simple") {
        return false;
      }
      var permissons=this.get("permissions");
      return permissons && _.isArray(permissons) && _.contains(permissons,'edit_permissions');
    }
  });

  IncludingAdditionalResourcesMixin.mixin(AuthenticatedUserNodePermissionModel.prototype);
  ExpandableMixin.mixin(AuthenticatedUserNodePermissionModel.prototype);
  ResourceMixin.mixin(AuthenticatedUserNodePermissionModel.prototype);

  return AuthenticatedUserNodePermissionModel;
});


csui.define('csui/models/server.adaptors/favorite2.mixin',[
  'csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      var superParseMethod = prototype.parse;
      var superSyncMethod = prototype.sync;

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        parse: function (response, options) {
          if (response.results) {
            response = response.results;
          }
          if (_.isEmpty(response)) {
            return {};
          } else {
            if (options.attrs) {
              var updatedAttributes = {};
              _.each(_.keys(options.attrs), function (attr) {
                updatedAttributes['favorite_' + attr] = options.attrs[attr];
              }, this);
              return updatedAttributes;
            } else {
              if (response.data && response.data.properties && response.data.favorites) {
                response.data.properties.favorite_name = response.data.favorites.name;
                response.data.properties.favorite_tab_id = response.data.favorites.tab_id;
              }

              var m = superParseMethod.call(this, response);

              if (m.actions) {
                m.actions = _.reject(m.actions,
                  function (action) {
                    return action.signature == 'rename' || action.signature == 'delete';
                  });
                m.actions.push({signature: 'favorite_rename'});

                // console.log("NODE ACTIONS");
                // _.each(m.actions, function(a) {
                //   console.log(a.signature);
                // });
              }
              return m;
            }
          }
        },

        sync: function (method, model, options) {
          var useFavoritesUrl = false;
          if (method === 'update' || method === 'patch') {

            // if attr key starts with 'favorite_' do the update on the /members/favorites url but
            // remove the prefix to have the original attribute-name from the favorite model
            // otherwise, just pass the attribute-to-update as it is and use the url from he
            // original node model
            var prefix = 'favorite_';
            var attributesToUpdate = {};
            _.each(_.keys(options.attrs), function (k) {
              var newKey = k;
              if (k.indexOf(prefix) === 0) {
                useFavoritesUrl = true;
                newKey = k.substr(prefix.length);
              }
              attributesToUpdate[newKey] = options.attrs[k];
            });
            options.attrs = attributesToUpdate;
            if (useFavoritesUrl) {
              var url = this.connector.getConnectionUrl().getApiBase('v2');
              url = Url.combine(url, '/members/favorites');
              url = Url.combine(url, model.id);

              options.url = url;
            }
          }
          return superSyncMethod.call(this, method, model, options);
        }

      });
    }
  };

  return ServerAdaptorMixin;
});


csui.define('csui/models/favorite2',['csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url', 'csui/models/node/node.model',
  'csui/models/server.adaptors/favorite2.mixin', 'csui/utils/deepClone/deepClone'
], function (_, Backbone, Url, NodeModel, ServerAdaptorMixin) {
  'use strict';

  var Favorite2Model = NodeModel.extend({

    mustRefreshAfterPut: false,

    idAttribute: 'id',

    constructor: function Favorite2Model(attributes, options) {
      NodeModel.prototype.constructor.apply(this, arguments);
      this.makeServerAdaptor(options);
    }
  });

  ServerAdaptorMixin.mixin(Favorite2Model.prototype);

  return Favorite2Model;
});


csui.define('csui/models/favorite2column',['csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/url',
  'i18n!csui/models/impl/nls/lang'
], function (_, Backbone,
    Url,
    lang) {
  'use strict';

  var Favorite2ColumnModel = Backbone.Model.extend({

    idAttribute: null,

    constructor: function Favorite2ColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var columnKey = 'fav_' + attributes.column_key;
        attributes.title = lang[columnKey];
      }
      Backbone.Model.prototype.constructor.call(this, attributes, options);
    }

  });

  return Favorite2ColumnModel;
});


csui.define('csui/models/favorite2columns',['csui/lib/underscore', 'csui/lib/backbone', 'csui/models/favorite2column', 'i18n!csui/models/impl/nls/lang'
], function (_, Backbone, Favorite2ColumnModel, modelLang) {
  'use strict';

  var Favorite2ColumnCollection = Backbone.Collection.extend({

    model: Favorite2ColumnModel,

    constructor: function Favorite2ColumnCollection(models, options) {
      if (!models) {
        models = [
          {
            default_action: true,
            key: "type",
            name: modelLang.type,
            type: 2
          },
          {
            default_action: true,
            key: "favorite_name",
            name: modelLang.name,
            type: -1
          },
          {
            key: "reserved", // the column can hold different icons representing state-information, not just the reserved-state.
            name: modelLang.state,
            type: 5
          },
          {
            key: "parent_id",
            name: modelLang.parentID,
            type: 2
          },
          {
            key: "favorite",
            name: modelLang.favorite,
            type: 5
          }
        ];
        models.forEach(function (column, index) {
          column.definitions_order = index + 100;
          column.column_key = column.key;
        });
      }
      Backbone.Collection.prototype.constructor.call(this, models, options);
    }

  });

  return Favorite2ColumnCollection;
});


csui.define('csui/models/server.adaptors/favorites2.mixin',[
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
          // this.setExpand('favorites', 'tab_id');
          var url   = this.connector.getConnectionUrl().getApiBase('v2'),
              query = Url.combineQueryString(
                  this.getAdditionalResourcesUrlQuery(),
                  this.getResourceFieldsUrlQuery(),
                  this.getExpandableResourcesUrlQuery(),
                  this.getStateEnablingUrlQuery(),
                  this.getRequestedCommandsUrlQuery(),
                  this.getSortByOrderUrlQuery()
              );
          url = Url.combine(url, '/members/favorites');
          return query ? url + '?' + query : url;
        },

        getSortByOrderUrlQuery: function () {
          return {sort: 'order'};
        },

        parse: function (response, options) {
          this.parseBrowsedState({results: response}, options);
          // don't parse columns here, because they are hardcoded in the constructor of Favorite2ColumnCollection
          return this.parseBrowsedItems(response, options);
        }

      });
    }
  };

  return ServerAdaptorMixin;
});


csui.define('csui/models/favorites2',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.commandable/v2.commandable.mixin',
  'csui/models/browsable/client-side.mixin',
  'csui/models/browsable/v2.response.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/favorite2',
  'csui/models/favorite2columns',
  'csui/models/server.adaptors/favorites2.mixin',
  'csui/utils/deepClone/deepClone'
], function (_, Backbone,
    ConnectableMixin,
    FetchableMixin,
    AdditionalResourcesV2Mixin,
    FieldsV2Mixin,
    ExpandableV2Mixin,
    StateRequestorMixin,
    CommandableV2Mixin,
    ClientSideBrowsableMixin,
    BrowsableV2ResponseMixin,
    DelayedCommandableV2Mixin,
    Favorite2Model,
    Favorite2ColumnCollection,
    ServerAdaptorMixin) {
  'use strict';

  var Favorite2Collection = Backbone.Collection.extend({

    model: Favorite2Model,

    constructor: function Favorite2Collection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.callCounter = 0;

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
          .makeBrowsableV2Response(options)
          .makeDelayedCommandableV2(options)
          .makeServerAdaptor(options);

      this.columns = new Favorite2ColumnCollection(options.columns);
    },

    _prepareModel: function (attrs, options) {
      options || (options = {});
      options.promotedActionCommands = this.promotedActionCommands;
      options.nonPromotedActionCommands = this.nonPromotedActionCommands;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
    },

    clone: function () {
      // Provide the options; they may include connector and other parameters
      var clone = new this.constructor(this.models, {
        connector: this.connector,
        fields: _.deepClone(this.fields),
        expand: _.deepClone(this.expand),
        includeResources: _.clone(this._additionalResources),
        skip: this.skipCount,
        top: this.topCount,
        filter: _.deepClone(this.filters),
        orderBy: this.orderBy,
        commands: _.clone(this.commands),
        defaultActionCommands: _.clone(this.defaultActionCommands),
        delayRestCommands: this.delayRestCommands
      });

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

  ClientSideBrowsableMixin.mixin(Favorite2Collection.prototype);
  BrowsableV2ResponseMixin.mixin(Favorite2Collection.prototype);
  ConnectableMixin.mixin(Favorite2Collection.prototype);
  FetchableMixin.mixin(Favorite2Collection.prototype);
  AdditionalResourcesV2Mixin.mixin(Favorite2Collection.prototype);
  FieldsV2Mixin.mixin(Favorite2Collection.prototype);
  ExpandableV2Mixin.mixin(Favorite2Collection.prototype);
  StateRequestorMixin.mixin(Favorite2Collection.prototype);
  CommandableV2Mixin.mixin(Favorite2Collection.prototype);
  DelayedCommandableV2Mixin.mixin(Favorite2Collection.prototype);
  ServerAdaptorMixin.mixin(Favorite2Collection.prototype);

  return Favorite2Collection;

});


csui.define('csui/models/favorite2group',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/favorites2', 'csui/utils/deepClone/deepClone'
], function (_, Backbone, Url, ResourceMixin, UploadableMixin,
   Favorite2Collection) {
  'use strict';

  var Favorite2GroupModel = Backbone.Model.extend({
    mustRefreshAfterPut: false,

    idAttribute: 'tab_id',

    constructor: function Favorite2GroupModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeResource(options);
      this.makeUploadable(options);

      // initialize favorites of this group with provided favorites and columns
      attributes || (attributes = {});

      this.favorites = new Favorite2Collection(attributes.favorites, {
        connector: options.connector,
        autoreset: true,
        tab_id: this.get('tab_id'),
        columns: attributes.favorite_columns,
        commands: options && options.commands,
        stateEnabled: options.stateEnabled,
      });
    },

    urlRoot: function () {
      var v2Url = this.connector.getConnectionUrl().getApiBase('v2');
      var url = Url.combine(v2Url, "/members/favorites/tabs/");
      return url;
    },

    parse: function (resp, options) {
      if (resp.results && resp.results.data) {
        return {tab_id: resp.results.data.tab_id};
      } else {
        return resp;
      }
    }
  });

  ResourceMixin.mixin(Favorite2GroupModel.prototype);
  UploadableMixin.mixin(Favorite2GroupModel.prototype);

  return Favorite2GroupModel;
});


csui.define('csui/utils/base',[
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/utils/url',
  'nuc/utils/errormessage',
  'nuc/utils/messagehelper',
  'nuc/utils/types/date',
  'nuc/utils/types/number',
  'nuc/utils/types/member',
  'nuc/utils/types/localizable',
  'i18n',
  'smart/utils/smart.base'
], function (_, $, Url, Message, MessageHelper, date, number, member, localizable, i18n, smartBase) {
  'use strict';

  // handler as singleton, bind dialog to handler
  var messageHelper = MessageHelper.getInstance();

  var escapeHtmlHelper = $('<p></p>');

  function escapeHtml(text, preserveLineBreaks) {
    // There's no HTML escaping function which would return a text to be
    // concatenated with the rest of the raw HTML markup so that the text
    // value would be the same and not interpreted as HTML markup.
    // Let's use an artificial DOM element for this, wrapped with jQuery.
    var html = escapeHtmlHelper.text(text).html();
    if (preserveLineBreaks) {
      html = html.replace(/\r?\n/g, '\r\n<br>');
    }
    return html;
  }

  function isBackbone(value) {
    // descendant of Backbone.Events
    return value && value.once;
  }

  function isPlaceholder(value) {
    // string selector, DOM object or jQuery object
    return value && (_.isString(value) || _.isElement(value) || value instanceof $);
  }

  function isMacintosh() {
    return navigator.platform.indexOf('Mac') > -1;
  }

  /**
   * returns true if the current browser is accessed from any iOS device
   * @returns Boolean.
   **/
  function isIOSBrowser() {
    return navigator.userAgent.indexOf('Mac') > -1;
  }

  function isLandscape() {
    return smartBase.isAppleMobile() && window.matchMedia('(orientation: landscape)').matches;
  }

  function isPortrait() {
    return smartBase.isAppleMobile() && window.matchMedia('(orientation: portrait)').matches;
  }

  function isMozilla() {
    if (navigator && navigator.userAgent) {
      var isMozilla = /Mozilla/.test(navigator.userAgent);
      return isMozilla;
    }
  }

  function isChrome() {
    // please note,
    // that IE11 now returns undefined again for window.chrome
    // and new Opera 30 outputs true for window.chrome
    // and new IE Edge outputs to true now for window.chrome
    // and if not iOS Chrome check
    // so use the below updated condition
    var isChromium = window.chrome,
      winNav = window.navigator,
      vendorName = winNav.vendor,
      isOpera = winNav.userAgent.indexOf('OPR') > -1,
      isIEedge = winNav.userAgent.indexOf('Edge') > -1,
      isIOSChrome = winNav.userAgent.match('CriOS'),
      retVal = false;
    if (
      isIOSChrome ||
      (isChromium != null && vendorName === 'Google Inc.' && isOpera === false && isIEedge === false)
    ) {
      retVal = true;
    }
    return retVal;
  }

  function isSafari() {
    if (navigator && navigator.userAgent) {
      //it excludes Chrome and all Android browsers that include the Safari name in their user agent.
      var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      return isSafari;
    }
  }

  // This shared function is used to compute the number characters can fit in a container.
  // Input:
  // - container width in pixels
  // - element width in pixels
  // Return:
  // - number of elements to fill the container
  function px2em(pxContainerWidth, pxElemWidth) {
    var pxInEms = 0;
    if (pxElemWidth > 0) {
      pxInEms = Math.floor((2 * pxContainerWidth) / pxElemWidth);
    }
    return pxInEms;
  }

  function checkAndScrollElemToViewport(elem) {
    var $elem = $(elem),
      scrollSelector =
        $elem.closest('.csui-perfect-scrolling').length > 0 ? '.csui-perfect-scrolling' : '.csui-normal-scrolling',
      elemScrollParent = $elem.closest(scrollSelector),
      stickyHeader = elemScrollParent.siblings('.csui-tab-contents-header-wrapper');
    if (stickyHeader[0]) {
      var elemTop = $elem.offset().top,
        viewportTop = elemScrollParent[0].getBoundingClientRect().top + stickyHeader.height(),
        isElemVisible = elemTop > viewportTop;
      if (!isElemVisible) {
        var currScrollTop = elemScrollParent.scrollTop();
        elemScrollParent.scrollTop(currScrollTop - (viewportTop - elemTop));
      }
    }
  }

  function setScrollHandler(e) {
    var eventArg = e.data;
    var inputElement = eventArg.inputElement,
      view = eventArg.view,
      dropdownContainer = eventArg.dropdownContainer,
      callback = eventArg.callback;
    //When dropdown is closed
    inputElement.parents('.csui-normal-scrolling').css('overflow', 'auto');
    //close respective drop-downs using callback
    if (
      dropdownContainer.length > 0 &&
      dropdownContainer[0] !== e.target &&
      dropdownContainer.is(':visible') &&
      callback
    ) {
      callback(view);
    }
  }

  /* eslint-disable no-unused-vars */
  function adjustDropDownField(
    inputElement,
    dropdownContainer,
    applyWidth,
    view,
    callback,
    scrollableDropdownContainer
  ) {
    var scrollEl;
    var eventArg = {
      inputElement: inputElement,
      view: view,
      dropdownContainer: dropdownContainer,
      callback: callback
    };

    var isIEBrowser = smartBase.isIE11(),
      isTouchBrowser = smartBase.isTouchBrowser();

    if (isTouchBrowser && !inputElement.closest('.csui-scrollable-writemode').hasClass('csui-dropdown-open')) {
      inputElement.closest('.csui-scrollable-writemode').addClass('csui-dropdown-open');
    }

    // for scrollable set
    if (
      inputElement.parents('.csui-scrollablecols').length > 0 &&
      inputElement.parents('.cs-form-set-container').length > 0
    ) {
      scrollEl = inputElement
        .parents('.csui-scrollablecols')
        .parents('.cs-form-set-container')
        .find('.ps-container.ps-active-x');
      var isRtl = i18n && i18n.settings.rtl,
        inputElementLeft = inputElement.offset().left,
        leftShadow = inputElement
          .parents('.csui-scrollablecols')
          .siblings('.csui-lockedcols')
          .find('.csui-shadowleft-container'),
        leftShadowLeft = leftShadow.offset().left,
        currentLeft,
        scrollUpdate;
      if (isRtl) {
        var inputElementRight = inputElementLeft + inputElement.outerWidth();
        scrollUpdate = inputElementRight - leftShadowLeft;
      } else {
        var leftShadowRight = leftShadowLeft + leftShadow.outerWidth();
        scrollUpdate = leftShadowRight - inputElementLeft;
      }
      // for partially visible dropdownfield
      if (scrollUpdate > 0) {
        var that = this;
        scrollEl.off('scroll', this.setScrollHandler);
        scrollEl.one('set:scrolled', function () {
          if (scrollEl) {
            scrollEl.on('scroll', eventArg, that.setScrollHandler);
          }
          that.autoAlignDropDowns(
            inputElement,
            dropdownContainer,
            applyWidth,
            scrollableDropdownContainer,
            isIEBrowser
          );
          that.hideDropDowns(inputElement, dropdownContainer, view, callback);
        });
        if (isRtl) {
          currentLeft = scrollEl.scrollLeftRtl();
          scrollEl.scrollLeftRtl(currentLeft + scrollUpdate);
        } else {
          currentLeft = scrollEl.scrollLeft();
          scrollEl.scrollLeft(currentLeft - scrollUpdate);
          setTimeout(function () {
            if (
              smartBase.isTouchBrowser &&
              !inputElement.closest('.csui-scrollable-writemode').hasClass('.csui-dropdown-open')
            ) {
              inputElement.closest('.csui-scrollable-writemode').addClass('csui-dropdown-open');
            }
          }, 100);
        }
        return;
      }
    }

    if (scrollEl) {
      scrollEl.off('scroll', this.setScrollHandler).on('scroll', eventArg, this.setScrollHandler);
    }
    this.autoAlignDropDowns(inputElement, dropdownContainer, applyWidth, scrollableDropdownContainer, isIEBrowser);
    this.hideDropDowns(inputElement, dropdownContainer, view, callback);
  }
  /* eslint-ensable no-unused-vars */

  var I = new DOMMatrix();

  function Point(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  Point.prototype.transformBy = function (matrix) {
    var tmp = matrix.multiply(I.translate(this.x, this.y, this.z));
    return new Point(tmp.m41, tmp.m42, tmp.m43);
  };

  function getTransformStyle(element) {
    var computedStyle = window.getComputedStyle(element);
    var transform = computedStyle.transform;
    var display = computedStyle.display;
    if (transform && transform !== 'none' && display !== 'inline') {
      return transform;
    }
    var contain = computedStyle.contain;
    if (contain === 'layout') {
      return I;
    }
  }

  function getTransformInfo(target) {
    for (var parent = target; parent; parent = parent.parentElement) {
      var transform = getTransformStyle(parent);
      if (transform) {
        return { element: parent, transform: transform };
      }
    }
  }

  function getTransformParentInfo(target) {
    return getTransformInfo(target.parentElement);
  }

  function getElementToPageTransformationMatrix(element) {
    var transform = getTransformStyle(element);
    var transformationMatrix = transform ? new DOMMatrix(transform) : I;

    for (var x = getTransformParentInfo(element); x; x = getTransformParentInfo(x.element)) {
      transformationMatrix = transformationMatrix.multiply(new DOMMatrix(x.transform));
    }

    var w = element.offsetWidth;
    var h = element.offsetHeight;
    var p1 = new Point(0, 0, 0).transformBy(transformationMatrix);
    var p2 = new Point(w, 0, 0).transformBy(transformationMatrix);
    var p3 = new Point(w, h, 0).transformBy(transformationMatrix);
    var p4 = new Point(0, h, 0).transformBy(transformationMatrix);
    var left = Math.min(p1.x, p2.x, p3.x, p4.x);
    var top = Math.min(p1.y, p2.y, p3.y, p4.y);

    var rect = element.getBoundingClientRect();
    transformationMatrix = I.translate(
      window.scrollX + rect.left - left,
      window.scrollY + rect.top - top,
      0
    ).multiply(transformationMatrix);

    return transformationMatrix;
  }

  function getPageToElementTransformationMatrix(element) {
    return getElementToPageTransformationMatrix(element).inverse();
  }

  function getOffsetsForFixedPosition(target, dropdown, differentParents) {
    var transformParentInfo = getTransformParentInfo(differentParents ? dropdown : target);
    var offsets;
    if (transformParentInfo) {
      var transformParent = transformParentInfo.element;
      var pageToTrans = getPageToElementTransformationMatrix(transformParent).translate(
        transformParent.scrollLeft,
        transformParent.scrollTop,
        0
      );
      var targetToPage = getElementToPageTransformationMatrix(target);
      var targetTopLeft = new Point(0, 0, 0).transformBy(targetToPage).transformBy(pageToTrans);
      var targetBottomRight = new Point(target.offsetWidth, target.offsetHeight, 0)
        .transformBy(targetToPage)
        .transformBy(pageToTrans);
      var borderTopWidth = +(window.getComputedStyle(transformParent)['border-top-width'] || '') || 0;
      var borderLeftWidth = +(window.getComputedStyle(transformParent)['border-left-width'] || '') || 0;

      offsets = {
        top: targetTopLeft.y - borderTopWidth,
        left: targetTopLeft.x - borderLeftWidth,
        bottom: targetBottomRight.y - borderTopWidth,
        right: targetBottomRight.x - borderLeftWidth,
        height: transformParent.clientHeight,
        width: transformParent.clientWidth
      };
    } else {
      // In this state the dropdown is already created, consumes space and possibly causes temporary
      // scrollbars, which at the end are not there, and thus the offsets do not fit anymore. To avoid
      // this, we hide the dropdown, get the coordinates of the target and window and restore the display
      // style. Not needed for sub menus as there these temp scrollbars appear in the parent menu.
      var display = dropdown.style['display'];
      dropdown !== target && $(dropdown).css({ display: 'none' });
      var targetRect = target.getBoundingClientRect();
      offsets = {
        top: targetRect.top,
        left: targetRect.left,
        bottom: targetRect.bottom,
        right: targetRect.right,
        height: document.documentElement.clientHeight,
        width: document.documentElement.clientWidth
      };
      dropdown !== target && $(dropdown).css({ display: display });
    }
    return offsets;
  }

  //This function is used to display drop-downs either top or bottom based on available space
  function autoAlignDropDowns(inputElement, dropdownContainer, applyWidth, scrollableDropdownContainer, isIEBrowser) {
    // return the control if inputElement is not available in dom.
    if (!inputElement.is(':visible')) {
      return false;
    }
    dropdownContainer.css({
      left: 0,
      top: 0
    });
    var hasPerspective = !!inputElement.closest('.cs-perspective-panel').length,
      isRtl = i18n && i18n.settings.rtl,
      elTop = inputElement.offset().top,
      elPositionX = hasPerspective ? inputElement.offset().left : inputElement[0].getBoundingClientRect().left,
      scrollSelector =
        inputElement.closest('.csui-perfect-scrolling').length > 0
          ? '.csui-perfect-scrolling'
          : '.csui-normal-scrolling',
      form = inputElement.closest(scrollSelector),
      modalContentElem = isIEBrowser
        ? []
        : form.length > 0
        ? form.parents('.binf-modal-content, .csui-sidepanel-container')
        : inputElement.closest('.binf-modal-content, .csui-sidepanel-container') /*For
         IE, left & top position is calculated with respect to document*/,
      modalContentPositionX =
        modalContentElem.length > 0
          ? isRtl
            ? modalContentElem.outerWidth() + modalContentElem.offset().left
            : modalContentElem.offset().left
          : isRtl
          ? $(document).width()
          : 0,
      modalContentTop = modalContentElem.length > 0 ? modalContentElem.offset().top : 0,
      controlheight = inputElement.outerHeight(),
      dropdownWidth = inputElement.outerWidth(),
      perspectivePanel = $('.cs-perspective-panel'),
      closestPerspectivePan = inputElement.closest('.cs-perspective-panel'),
      perspective = closestPerspectivePan.length > 0 ? closestPerspectivePan : inputElement.closest('.cs-perspective'),
      perspectiveHeight = perspective.length > 0 ? perspective.outerHeight() : $(document).height(),
      perspectiveTop = perspective.length > 0 ? perspective.offset().top : 0,
      perspectiveLeft = perspective.length > 0 ? perspective.offset().left : 0,
      elemBoundingRect = inputElement[0].getBoundingClientRect(),
      contextBottom,
      contextTop;

    if (applyWidth) {
      dropdownContainer.css({
        width: dropdownWidth
      });
    }
    //When dropdown is opened
    if (scrollSelector != '.csui-normal-scrolling') {
      inputElement.parents('.csui-normal-scrolling').css('overflow', 'hidden');
    }

    var perspectivePanelClientTop = perspectivePanel.length > 0 ? perspectivePanel[0].getBoundingClientRect().top : 0;
    if (perspectivePanelClientTop < 0) {
      perspectivePanelClientTop = perspectivePanel.offset().top;
    }
    var perspectiveTopSpace = perspectiveTop > 0 ? perspectiveTop : perspectivePanelClientTop,
      spaceOnTop = elemBoundingRect.top - perspectiveTopSpace,
      spaceOnBottom = window.innerHeight - (elemBoundingRect.top + elemBoundingRect.height),
      isDropdownShownOnTop = spaceOnTop > spaceOnBottom;

    if (scrollableDropdownContainer) {
      scrollableDropdownContainer.css({
        'max-height': Math.abs((isDropdownShownOnTop ? spaceOnTop : spaceOnBottom) * 0.9) + 'px'
      });
      // Check if whole dropdown can fit in bottom since bottom is prefferable if it can fit in bottom
      isDropdownShownOnTop = scrollableDropdownContainer.outerHeight() > spaceOnBottom;
    }
    var offsets = getOffsetsForFixedPosition(inputElement[0], dropdownContainer[0]);
    // below code used to display dropdown at top of the field.
    if (isDropdownShownOnTop) {
      if (isIEBrowser) {
        if (perspective.length > 0) {
          contextBottom = perspectiveHeight + perspectiveTop - elemBoundingRect.top;
        } else {
          contextBottom = document.documentElement.offsetHeight + document.documentElement.scrollTop - elTop;
        }
      } else {
        if (modalContentElem.length > 0) {
          contextBottom = modalContentElem.outerHeight() + modalContentTop - elTop;
        } else {
          if (perspective.length > 0 || isSafari()) {
            contextBottom = perspectiveHeight + perspectiveTop - elTop;
          } else {
            contextBottom = hasPerspective
              ? document.documentElement.offsetHeight - elTop
              : window.innerHeight - inputElement[0].getBoundingClientRect().top;
          }
        }
      }
      if (isRtl) {
        dropdownContainer.css({
          position: 'fixed',
          right: offsets.width - offsets.right,
          top: 'auto',
          bottom: offsets.height - offsets.top,
          left: 'auto'
        });
      } else {
        dropdownContainer.css({
          position: 'fixed',
          left: offsets.left,
          top: 'auto',
          bottom: offsets.height - offsets.top
        });
      }
      if (dropdownContainer.hasClass('binf-datetimepicker-widget')) {
        dropdownContainer.addClass('binf-top').removeClass('binf-bottom');
      }
      // below code used to display dropdown at bottom of the field.
    } else {
      if (isIEBrowser) {
        contextTop = elTop + controlheight - document.documentElement.scrollTop;
      } else {
        if (modalContentElem.length > 0) {
          contextTop = elTop + controlheight - modalContentTop;
        } else {
          if (perspective.length > 0) {
            contextTop = elTop + controlheight - perspectiveTop;
          } else {
            contextTop = elemBoundingRect.top + elemBoundingRect.height - perspectiveTop;
          }
        }
      }
      if (isRtl) {
        dropdownContainer.css({
          position: 'fixed',
          right: offsets.width - offsets.right,
          top: offsets.bottom,
          bottom: 'auto',
          left: 'auto'
        });
      } else {
        dropdownContainer.css({
          position: 'fixed',
          left: offsets.left,
          top: offsets.bottom,
          bottom: 'auto'
        });
      }
      if (dropdownContainer.hasClass('binf-datetimepicker-widget')) {
        dropdownContainer.addClass('binf-bottom').removeClass('binf-top');
      }
    }
  }

  /**
   * Options:
   *  - targetEl  # Required. Element (usually anchor) which triggers the dropdown
   *  - dropdownMenu # Optional. Element "binf-dropdown-menu" that is opened by `targetEl`. Default to sibling of `targetEl`.
   *  - hAlignment # Optional. Default to `left` aligned.
   *  - vAlignment # Optional. Default to `bottom`.
   *
   * @param {*} options
   */
  function alignDropDownMenu(options) {
    var $targetEl = options.targetEl,
      $dropdownMenu = options.dropdownMenu || $targetEl.nextAll('.binf-dropdown-menu'),
      hAlignment = options.hAlignment || 'left',
      vAlignment = options.vAlignment || 'bottom',
      isRtl = i18n && i18n.settings.rtl;

    if (!$targetEl.length || !$targetEl.is(':visible') || !$dropdownMenu.length) {
      // return the control if inputElement is not available in dom.
      return false;
    }

    $dropdownMenu.css({
      maxHeight: '',
      maxWidth: '',
      top: '',
      left: '',
      right: '',
      bottom: ''
    }); // Reset all inline styles
    $dropdownMenu.removeClass(
      'binf-dropdown-align-left-top binf-dropdown-align-left-bottom' +
        ' binf-dropdown-align-right-top binf-dropdown-align-right-bottom'
    );

    var dropdownHeight = $dropdownMenu.outerHeight(),
      dropdownWidth = $dropdownMenu.outerWidth();
    // Hide to dropdown to avoid window scrolls due to overflow of dropdown beyond visible area.
    $dropdownMenu.addClass('binf-hidden');
    
    var documentWidth = options.width ?? $(window).width(),
      documentHeight = $(window).height(),
      maxWidthAllowed = parseInt($dropdownMenu.css('maxWidth'), 10) || 224 /** UX Suggested */,
      viewportOffset = $targetEl[0].getBoundingClientRect(),
      top = viewportOffset.bottom,
      left = viewportOffset.left,
      right = documentWidth - viewportOffset.right,
      bottom = documentHeight - viewportOffset.top,
      scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
      scrollTop = window.pageYOffset || document.documentElement.scrollTop,
      spaceTop = viewportOffset.top - 10,
      spaceBottom = documentHeight - viewportOffset.bottom - 10,
      spaceLeft = viewportOffset.right - 10,
      spaceRight = documentWidth - viewportOffset.left - 10;

    if (vAlignment === 'bottom' && spaceBottom <= dropdownHeight) {
      // Requested to place at bottom, but insufficient space at bottom.
      if (spaceTop > dropdownHeight || spaceTop > spaceBottom) {
        vAlignment = 'top';
      }
    } else if (vAlignment === 'top' && spaceTop <= dropdownHeight) {
      // Requested to place at top, but insufficient space at top.
      if (spaceBottom > dropdownHeight || spaceBottom > spaceTop) {
        vAlignment = 'bottom';
      }
    }

    // Flip the horizontal position incase of RTL
    hAlignment = isRtl ? (hAlignment === 'left' ? 'right' : 'left') : hAlignment;
    if (hAlignment === 'left' && spaceRight <= dropdownWidth) {
      // Requested to align left, but insufficient space towards right.
      if (spaceLeft > dropdownWidth || spaceLeft > spaceRight) {
        hAlignment = 'right';
      }
    } else if (hAlignment === 'right' && spaceLeft <= dropdownWidth) {
      // Requested to align right, but insufficient space towards left.
      if (spaceRight > dropdownWidth || spaceRight > spaceLeft) {
        hAlignment = 'left';
      }
    }
    $dropdownMenu.addClass('binf-dropdown-align-' + hAlignment + '-' + vAlignment);

    if (!smartBase.isIE11()) {
      // Since perspectives and model dialogs styles with "transform" in which "position: fixed" relative to these container (not viewport).
      var closestPerspectivePan = $targetEl.closest('.cs-perspective-panel'),
        modelContent = $targetEl.parents('.binf-modal-content'),
        $transformParent = closestPerspectivePan.length ? closestPerspectivePan : $targetEl.closest('.cs-perspective');
      /** Check if inside perspective */
      // If not perspective MODEL dialog?
      $transformParent = $transformParent.length ? $transformParent : modelContent;

      if ($transformParent.length > 0) {
        // To counter the transform
        var transParentOffset = $transformParent.offset(),
          $elDocOffset = $targetEl.offset(); // Includes top, left scrolls with viewport position;
        top += scrollTop - transParentOffset.top;
        left += scrollLeft - transParentOffset.left;
        right = $transformParent.outerWidth() + transParentOffset.left - $elDocOffset.left - $targetEl.outerWidth();
        bottom = $transformParent.outerHeight() + transParentOffset.top - $elDocOffset.top;
      }
    }

    const dropdownParent = $dropdownMenu.parent()[0]
    const differentParents = dropdownParent && $targetEl.parent()[0] !== dropdownParent;
    var offsets = getOffsetsForFixedPosition($targetEl[0], $dropdownMenu[0], differentParents);
    var styles = { position: 'fixed' };
    if (hAlignment === 'left') {
      styles = _.extend(styles, {
        left: offsets.left
      });
      if (isRtl) {
        styles = _.extend(styles, {
          right: 'auto'
        });
      }
      if (spaceRight < maxWidthAllowed) {
        styles.maxWidth = spaceRight;
      }
    } else {
      styles = _.extend(styles, {
        right: offsets.width - offsets.right
      });
    }

    if (vAlignment === 'bottom') {
      styles = _.extend(styles, {
        top: offsets.bottom
      });
    } else {
      styles = _.extend(styles, {
        bottom: offsets.height - offsets.top
      });
    }

    $dropdownMenu.css(styles);
    $dropdownMenu.removeClass('binf-hidden');
    // if toggle and dropdown have different parents (typically when data-binf-target is used)
    if (differentParents) {
      // generate a unique csui scroll watch id.
      const csswid = $dropdownMenu.attr('csswid') || $dropdownMenu.attr('csswid', _.uniqueId("cssw")).attr('csswid');
      if (!$dropdownMenu.attr('csswid-listening')) {
        const visited = startListenToScrollEvents(csswid, $targetEl, $dropdownMenu, () => {
          if ($dropdownMenu.parent().hasClass('binf-open')) {
            const topelement = visited[0];
            const elements = getElementsCoveringToggle($targetEl[0], vAlignment, topelement);
            const elementsAreInBetweenLayer = elements
              ? isDropdownCoveringElements($dropdownMenu[0], elements, vAlignment, hAlignment, $targetEl[0], topelement)
              : undefined;
            if (elementsAreInBetweenLayer || elementsAreInBetweenLayer === undefined) {
              // when toggle and dropdown have different parents, it can happen due to the z layering of the elements,
              // that after scrolling, the toggle is covered by a dom element which in turn is covered by the dropdown.
              // if this is the case or if it was not possible to determine this => close dropdown
              $dropdownMenu.binf_dropdown('toggle');
            } else {
              // reposition the dropdown only as long as the toggle is not covered.
              alignDropDownMenu({targetEl: $targetEl, dropdownMenu: $dropdownMenu});
            }
          }
        });
        $dropdownMenu.attr('csswid-listening', true);
        $dropdownMenu.parent().one('hidden.binf.dropdown', () => {
          $dropdownMenu.attr('csswid-listening', null);
          stopListenToScrollEvents(csswid, visited);
        })
      }
    }
    return
  }

  function startListenToScrollEvents(csswid, targetEl, dropdownMenu, listener) {
      var inListener;
      const eventName = 'scroll.' + csswid;
      const debounce = _.debounce( () => {
        inListener = true;
        listener();
        inListener = false;
      }, 10);
      const visited = traverseParents(targetEl[0], dropdownMenu[0], el => {
        $(el).off(eventName).on(eventName, function() {
          if (!inListener) {
            debounce();
          }
        });
      });
      return visited;
  }

  function stopListenToScrollEvents(csswid, visited) {
    visited.forEach(el => $(el).off('scroll.' + csswid));
  }

  function getClosestCommonParent (startNode, endNode) {
    if (startNode.contains(endNode)) return startNode;
    if (endNode.contains(startNode)) return endNode;
 
    const range = new Range();
    range.setStartBefore(startNode);
    range.setEndAfter(endNode);
    if (range.collapsed) {
       range.setStartBefore(endNode);
       range.setEndAfter(startNode);
    }
    return range.commonAncestorContainer;
 };

  function traverseParents(toggle, dropdown, callback) {
    const common = getClosestCommonParent(toggle, dropdown);
    const transform = getTransformInfo(common);
    const topelement = transform ? transform.element : document;
    const visited = [topelement];
    const nodes = [toggle, dropdown];
    for (let ii = 0; ii < nodes.length; ii++) {
      for (let parent = nodes[ii].parentNode; parent; parent = parent.parentNode) {
        if (visited.includes(parent)) {
          break;
        }
        visited.push(parent);
        callback(parent);
      }
    }
    callback(topelement);
    return visited;
  }

  /**
   * get all elements that cover the toggle at its corners near to the dropdown
   */
  function getElementsCoveringToggle(toggle, vAlign, topelement){
    const toggleRect = toggle.getBoundingClientRect();
    var result = [];
    const checks = [];
    checks.push(document.elementsFromPoint(toggleRect.left + 1, vAlign === 'bottom' ? toggleRect.bottom - 1 : toggleRect.top));
    checks.push(document.elementsFromPoint(toggleRect.right - 1, vAlign === 'bottom' ? toggleRect.bottom - 1 : toggleRect.top));
    let resultValid;
    checks.forEach(elems => {
      let checkValid;
      const checked = [];
      for (let ll = 0; ll < elems.length; ll++) {
        if (topelement === elems[ll]) {
          break;
        }
        if (toggle === elems[ll] || toggle.contains(elems[ll])) {
          // result of elementsFromPoint is valid for this check only if toggle is such an element.
          checkValid = true;
          break;
        }
        if (elems[ll].contains(toggle)) {
          continue;
        }
        if (result.includes(elems[ll])) {
          continue;
        }
        checked.push(elems[ll]);
      }
      if (checkValid) {
        // result is valid only if at least one check is valid
        resultValid = true;
        result = result.concat(checked);
      }
    })
    // return found elements, but return undefined, if toggle was not element of any call to elementsFromPoint.
    return resultValid ? result : undefined;
  }

  /**
   * check if elements are covered by the dropdown at its points nearest to the toggle
   */
  function isDropdownCoveringElements(dropdown, toggleCoveringElements, vAlign, hAlign, toggle, topelement){
    // each element in toggleCoveringElements covers the toggle at a point.
    if (toggleCoveringElements.length >0) {
      const toggleRect = toggle.getBoundingClientRect();
      const menuRect = dropdown.getBoundingClientRect();
      const checks = [];
      // remove border-radius to make the points really be part of the display area element.
      dropdown.style['border-radius'] = 0;
      checks.push(document.elementsFromPoint(
        hAlign === 'left' ? menuRect.left + 1 : menuRect.right - toggleRect.width,
        vAlign === 'bottom' ? menuRect.top + 1 : menuRect.bottom - 1));
      if (!checks.at(-1).includes(dropdown)) {
        checks.pop(); // dropdown not listed as point => cannot compute layering
      }
      checks.push(document.elementsFromPoint(
        hAlign === 'left' ? menuRect.left + toggleRect.width : menuRect.right - 1,
        vAlign === 'bottom' ? menuRect.top + 1: menuRect.bottom - 1));
      if (!checks.at(-1).includes(dropdown)) {
        checks.pop(); // dropdown not listed as point => cannot compute layering
      }
      // restore border-radius.
      dropdown.style['border-radius'] = null;
      if (checks.length === 0) {
        // return undefined, if dropdown, was not listed by elementsFromPoint
        return undefined;
      }
      let coveringPointsCount = 0;
      // for each point from above, check, if there is one from toggleCoveringElements between toggle and dropdown
      for (let cc = 0; cc < checks.length; cc++) {
        let dropdownPointElements = checks[cc]; // contains all elements on one of the above points of the dropdown
        let underDropdown = false; // indicates if dropdownPointElements[ll] is under the dropdown
        let includeCount = 0;
        for (let ll = 0; ll < dropdownPointElements.length; ll++) {
          if (topelement === dropdownPointElements[ll]) {
            break;
          }
          if (dropdownPointElements[ll] === dropdown) {
            underDropdown = true;
            continue;
          }
          let included = toggleCoveringElements.includes(dropdownPointElements[ll]);
          if (included) {
            if (underDropdown) {
              // this means, that the element from toggleCoveringElements is covered by the dropdown
              coveringPointsCount += 1;
              break;
            }
            includeCount += 1;
            if (includeCount === toggleCoveringElements.length) {
              // if we already have seen all elements of toggleCoveringElements in dropdownPointElements
              // we can stop this loop here
              break;
            }
          }
        }
      }
      // if for each checked point there exists an element between toggle and dropdown
      // only then consider dropdown as covering the toggleCoveringElements.
      return coveringPointsCount === checks.length;
    }
    return false;
  }

  function alignDropDownSubMenus(options) {
    var $dropdown = options.dropdownMenu,
      $targetEl = options.targetEl,
      $childEl = $targetEl.children(),
      isRtl = i18n && i18n.settings.rtl,
      viewportWidth = window.innerWidth || document.documentElement.clientWidth,
      bounding = $targetEl[0].getBoundingClientRect(),
      childBounding = $childEl[0].getBoundingClientRect(),
      dropdownBounding = $dropdown[0].getBoundingClientRect(),
      isPullDown = $targetEl.hasClass('binf-pull-down'),
      isLandingTileView = $targetEl.parents().hasClass('csui-tileview-more-btn'),
      startPosition = isPullDown === isRtl ? bounding.right : bounding.left,
      rightSpaceAvailable = isRtl ? startPosition : viewportWidth - startPosition,
      leftSpaceAvailable = isRtl ? viewportWidth - bounding.right : bounding.left;

    // Reset positions / styles to DEFAULTs
    $targetEl.removeClass('binf-dropdown-menu-left binf-dropdown-menu-right');
    $dropdown.css({ left: '', right: '', top: '', bottom: '', position: '' });
    $dropdown.removeAttr('style');
    $dropdown.removeClass('csui-fixed-submenu csui-perfect-scrolling csui-normal-scrolling csui-no-scroll-x');

    // Assess horizontal position
    if (
      Math.floor(rightSpaceAvailable) <= dropdownBounding.width ||
      ($targetEl.parent().closest('.binf-dropdown-submenu').hasClass('binf-dropdown-menu-left') &&
        leftSpaceAvailable > dropdownBounding.width)
    ) {
      $targetEl.addClass('binf-dropdown-menu-left');
    }
    // Assess vertical position position
    $targetEl.removeClass('binf-dropup'); // Default toward down

    var ulOffset = $dropdown.offset();
    // how much space would be left on the top if the dropdown opened that direction
    var spaceUp = ulOffset.top - $dropdown.outerHeight() - $(window).scrollTop();
    // how much space is left at the bottom
    var spaceDown = $(window).scrollTop() + $(window).height() - (ulOffset.top + $dropdown.outerHeight());
    // switch to dropup only if there is no space at the bottom AND
    // there is space at the top, or there isn't either but it would be still better fit
    if (
      (spaceDown < 0 && (spaceUp >= 0 || spaceUp > spaceDown)) ||
      ($targetEl.parent().closest('.binf-dropdown-submenu').hasClass('binf-dropup') && spaceUp > spaceDown)
    ) {
      $targetEl.addClass('binf-dropup');
    }

    // TODO Make submenu "position: fixed" only when overflowed by perfect scrollbar
    var scrollOffset = $targetEl.parent().scrollTop(),
      perspectiveOffsetTop = 0;
    $targetEl.parent().css('overflow', 'visible');
    var offsets = getOffsetsForFixedPosition($dropdown[0], $dropdown[0]);
    var viewportOffset = $dropdown[0].getBoundingClientRect(),
      top = viewportOffset.top,
      left = viewportOffset.left;
    $targetEl.parent().css('overflow', '');
    if (!smartBase.isIE11()) {
      var modalContentElem = $targetEl.parents('.binf-modal-content'),
        closestPerspectivePan = $targetEl.closest('.cs-perspective-panel'),
        landingPerspective = $targetEl.closest('.cs-perspective'),
        perspective = closestPerspectivePan.length > 0 ? closestPerspectivePan : landingPerspective;
      if (modalContentElem.length > 0) {
        var modalOffset = modalContentElem.offset();
        top = top - modalOffset.top - scrollOffset;
        left = left - modalOffset.left;
      } else if (perspective.length > 0) {
        var perspectiveOffset = perspective.offset(),
          perspectiveBounding = landingPerspective[0].getBoundingClientRect();
        perspectiveOffsetTop = isLandingTileView ? perspectiveBounding.top : perspectiveOffset.top;
        top = top - perspectiveOffsetTop - scrollOffset;
        left = left - perspectiveOffset.left;
      }
    }
    $targetEl.parent().css('overflow', 'visible');

    if ($targetEl.hasClass('binf-dropdown-menu-left')) {
      left += !isPullDown ? $targetEl.width() - $dropdown.width() : 0;
      offsets.left = offsets.left + (!isPullDown ? $targetEl.width() - $dropdown.width() : 0);
    }

    if (isPullDown) {
      top = top - (bounding.bottom - childBounding.bottom);
      offsets.top = offsets.top - (bounding.bottom - childBounding.bottom);
    }

    //Set the css of the submenu based on its horizontal orientation.
    var scrollHeight = document.body.getBoundingClientRect().top,
      currentElementTop = $targetEl.offset().top + scrollHeight,
      currentElementHeight = $targetEl.innerHeight(),
      screenHeight = $(window).outerHeight(),
      bottom = 0;

    $targetEl.parent().css('overflow', '');
    $dropdown.addClass('csui-fixed-submenu');

    var subMenuCSS = {
      position: 'fixed',
      left: offsets.left
    };
    // This condition is required only for Node Browsing Table widget
    if ($targetEl.parents().hasClass('csui-nodestable') && !smartBase.isIE11()) {
      top = top + window.scrollY;
    }
    if ($targetEl.hasClass('binf-dropup')) {
      bottom = screenHeight - currentElementTop - currentElementHeight;
      // Making bottom to default value if its negative
      bottom = bottom < 0 ? 0 : bottom;
      if (smartBase.isIE11()) {
        _.extend(subMenuCSS, {
          bottom: offsets.top,
          top: 'auto',
          maxHeight: screenHeight - bottom
        });
      } else {
        _.extend(subMenuCSS, {
          bottom: 'auto',
          top: offsets.top + $targetEl.height() / 2,
          maxHeight: screenHeight - bottom
        });
      }
    } else {
      _.extend(subMenuCSS, {
        top: offsets.top,
        bottom: 'auto',
        maxHeight: screenHeight - (top + perspectiveOffsetTop)
      });
    }

    $dropdown.css(subMenuCSS);
    csui.require(['csui/controls/tile/behaviors/perfect.scrolling.behavior'], function (PerfectScrollingBehavior) {
      // Apply perfect scrollbar
      if (PerfectScrollingBehavior.usePerfectScrollbar()) {
        $dropdown.addClass('csui-perfect-scrolling');
        $dropdown.perfectScrollbar({
          suppressScrollX: true,
          includePadding: true
        });
      } else {
        $dropdown.addClass('csui-normal-scrolling csui-no-scroll-x');
      }

      // Hide submenu on scroll of its parent (dropdown menu).
      var $scrollParent = $targetEl.closest('.binf-dropdown-menu');
      $scrollParent.off('scroll.csui.submenu').on(
        'scroll.csui.submenu',
        _.bind(function (event) {
          !$dropdown.is(':hidden') && $targetEl.binf_dropdown_submenu('hide');
          $scrollParent.off('scroll.csui.inline.actions');
        }, this)
      );
    });
  }

  function hideDropDowns(inputElement, dropdownContainer, view, callback) {
    var scrollSelector =
        inputElement.closest('.csui-perfect-scrolling').length > 0
          ? '.csui-perfect-scrolling'
          : '.csui-normal-scrolling',
      eventArg = {
        inputElement: inputElement,
        view: view,
        dropdownContainer: dropdownContainer,
        callback: callback
      };

    // called when the parent view is scrolled.
    this.getParentScrollViews(inputElement[0], scrollSelector).forEach((scrollView) => {
      $(scrollView).off('scroll', this.setScrollHandler).on('scroll', eventArg, this.setScrollHandler);
    });

    // called when the window is scrolled.
    $(window).off('scroll', this.setScrollHandler).on('scroll', eventArg, this.setScrollHandler);

    // called when the window is resized.
    $(window).off('resize', this.setScrollHandler).on('resize', eventArg, this.setScrollHandler);
  }

  function getParentScrollViews(inputElement, scrollSelector, scrollParents = []) {
    if (!inputElement || inputElement === document.documentElement) {
      return scrollParents; // Base case: Stop when reaching the root element
    }
  
    if (inputElement.matches(scrollSelector)) {
      scrollParents.push(inputElement); // Add to the result if it matches the selector
    }
  
    return this.getParentScrollViews(inputElement.parentElement, scrollSelector, scrollParents);
  }

  // TODO: Deprecate and remove this method
  function stringifyDate(date) {
    return JSON.stringify(date);
  }

  // TODO: Deprecate and remove this method
  function dateToLocalIsoString(dateStr, format) {
    if (format === 'YYYY-MM-DD' || format === 'MM/DD/YYYY' || format === 'DD/MM/YYYY') {
      return date.serializeDate(dateStr);
    }
    return date.serializeDateTime(dateStr);
  }

  /**
   * The parent div for the span element in which we have to apply ellipsis
   * The number of lines we have to apply ellipses
   * @param element
   * @param numberOfLines
   * Limitation of Multiline text with ellipsis:
   * If there is a single lengthy word then the word is displayed in single line with ellipsis at the end of the line ex: 'Counterproductiveness'
   * If there are 2 lengthy words, where none of them will fit in the line then the first word is displayed with ellipsis in a single line ex:  'Methylenedioxymethamphetamine chemical'
   * If the first word is very short and the 2nd word is longer, then the single line is displayed and ellipsis are displayed at the end of 2nd word ex: 'Digital Transformation'
   */
  function applyEllipsis(element, numberOfLines) {
    var measure,
      text,
      lineWidth,
      lineStart,
      lineCount,
      wordStart,
      line,
      lineText,
      wasNewLine,
      updatedFirstLineWidth = false,
      createElement = document.createElement.bind(document),
      createTextNode = document.createTextNode.bind(document);
    if (typeof element === 'object' && element.length > 0) {
      element = element[0];
    }
    // measurement element is made a child of the element to get it's style
    measure = createElement('span');

    $(measure).css({
      position: 'absolute', // prevent page reflow
      whiteSpace: 'pre', // cross-browser width results
      visibilty: 'hidden' // prevent drawing});
    });

    // make sure the element belongs to the document
    if (!(element.ownerDocument || element.ownerDocument === document)) {
      return;
    }

    // reset to safe starting values
    lineStart = wordStart = 0;
    lineCount = 1;
    wasNewLine = false;
    lineWidth = element.clientWidth;
    // get all the text, remove any line changes
    text = (element.textContent || element.innerText).trim().replace(/\n/g, ' ');
    // remove all content
    while (element.firstChild !== null) {
      element.removeChild(element.firstChild);
    }
    // add measurement element within so it inherits styles
    element.appendChild(measure);
    function checkLine(pos) {
      // ignore any further processing if we have total lines
      if (lineCount === numberOfLines) {
        return;
      }
      // create a text node and place it in the measurement element
      measure.appendChild(createTextNode(text.substr(lineStart, pos + 1 - lineStart)));
      // have we exceeded allowed line width?
      if (lineWidth < measure.clientWidth) {
        if (wasNewLine) {
          // we have a long word so it gets a line of it's own
          lineText = text.substr(lineStart, pos + 1 - lineStart);
          // next line start position
          lineStart = pos + 1;
        } else {
          // grab the text until this word
          lineText = text.substr(lineStart, wordStart - lineStart);
          // next line start position
          lineStart = wordStart;
        }
        // create a line element
        line = createElement('span');
        // add text to the line element
        line.appendChild(createTextNode(lineText));
        // add the line element to the container
        element.appendChild(line);
        // yes, we created a new line
        wasNewLine = true;
        lineCount++;
      } else {
        // did not create a new line
        wasNewLine = false;
      }
      // remember last word start position
      wordStart = pos + 1;
      // clear measurement element
      measure.removeChild(measure.firstChild);
    }

    // http://ejohn.org/blog/search-and-dont-replace/
    text.replace(/\W|_/g, function (m, pos) {
      checkLine(pos);
    });
    checkLine(text.substr(lineStart).length);
    // remove the measurement element from the container
    element.removeChild(measure);
    // create the last line element
    line = createElement('span');
    // give styles required for text-overflow to kick in
    $(line).css({
      display: 'inline-block',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%'
    });
    if (lineCount > 1) {
      $(line).css({
        textOverflow: 'ellipsis'
      });
    }
    // add all remaining text to the line element
    line.appendChild(createTextNode(text.substr(lineStart)));
    // add the line element to the container
    element.appendChild(line);
  }

  /**
   * This method is used to filter out unsupported widgets based on the config
   *
   * @param widget  widget json : {type:"<widget-path>",options:{<widget-options>}}
   * @param config  configuration json:
   *                {"unSupportedWidgets":{"<module>":["<widget1-path>","<widget2-path>"]}
   * @param skipFilter type: boolean, enhancing perspective to allow loading unSupportedWidgets
   *                in perspective edit mode
   * @returns {*}   returns the widget only if it is not listed in the 'UnSupportedWidgets' list
   *                else returns undefined
   */
  function filterUnSupportedWidgets(widget, config, skipFilter) {
    if (widget && config && config.unSupportedWidgets && !skipFilter) {
      var extWidgets = _.chain(config.unSupportedWidgets).values().flatten()._wrapped;
      if (extWidgets && extWidgets.length > 0) {
        if (_.contains(extWidgets, widget.type)) {
          return undefined;
        }
      }
    }
    return widget;
  }

  function getOffset(element) {
    return element.is(':visible') ? element.offset() : { top: 0, left: 0 };
  }

  return {
    MessageHelper: messageHelper,
    ErrorHandler: messageHelper,

    MessageType: Message.Type,
    Message: Message.Message,
    RequestErrorMessage: Message.RequestErrorMessage,

    ErrorStatus: Message.Type,
    ErrorToShow: Message.Message,
    ErrorMessage: Message.ErrorMessage,
    Error: Message.RequestErrorMessage,

    exactDateFormat: date.exactDateFormat,
    exactTimeFormat: date.exactTimeFormat,
    exactDateTimeFormat: date.exactDateTimeFormat,

    parseDate: date.deserializeDate,
    stringifyDate: stringifyDate,
    dateToLocalIsoString: dateToLocalIsoString,
    deserializeDate: date.deserializeDate,
    serializeDate: date.serializeDate,
    serializeDateTime: date.serializeDateTime,
    formatDate: date.formatDate,
    formatDateTime: date.formatDateTime,
    formatExactDate: date.formatExactDate,
    formatExactTime: date.formatExactTime,
    formatExactDateTime: date.formatExactDateTime,
    formatFriendlyDate: date.formatFriendlyDate,
    formatFriendlyDateTime: date.formatFriendlyDateTime,
    formatFriendlyDateTimeNow: date.formatFriendlyDateTimeNow,
    formatISODateTime: date.formatISODateTime,
    formatISODate: date.formatISODate,

    getReadableFileSizeString: number.formatFileSize,
    formatFileSize: number.formatFileSize,
    formatFriendlyFileSize: number.formatFriendlyFileSize,
    formatExactFileSize: number.formatExactFileSize,

    formatInteger: number.formatInteger,
    formatIntegerWithCommas: number.formatIntegerWithCommas,

    formatMemberName: member.formatMemberName,

    getClosestLocalizedString: localizable.getClosestLocalizedString,

    localeCompareString: localizable.localeCompareString,
    localeContainsString: localizable.localeContainsString,
    localeEndsWithString: localizable.localeEndsWithString,
    localeIndexOfString: localizable.localeIndexOfString,
    localeStartsWithString: localizable.localeStartsWithString,

    formatMessage: localizable.formatMessage,

    escapeHtml: escapeHtml,

    isBackbone: isBackbone,
    isPlaceholder: isPlaceholder,
    Url: Url,
    isTouchBrowser: smartBase.isTouchBrowser,
    isHybrid: smartBase.isHybrid,
    isAppleMobile: smartBase.isAppleMobile,
    isMacintosh: isMacintosh,
    isIOSBrowser: isIOSBrowser,
    isIE11: smartBase.isIE11,
    isEdge: smartBase.isEdge,
    isMozilla: isMozilla,
    isFirefox: smartBase.isFirefox,
    isSafari: isSafari,
    isLandscape: isLandscape,
    isPortrait: isPortrait,
    isMSBrowser: smartBase.isMSBrowser,
    isChrome: isChrome,
    px2em: px2em,
    isVisibleInWindowViewport: smartBase.isVisibleInWindowViewport,
    isVisibleInWindowViewportHorizontally: smartBase.isVisibleInWindowViewportHorizontally,
    isVisibleInWindowViewportVertically: smartBase.isVisibleInWindowViewportVertically,
    isElementVisibleInParents: smartBase.isElementVisibleInParents,
    isElementVisibleInParent: smartBase.isElementVisibleInParent,
    checkAndScrollElemToViewport: checkAndScrollElemToViewport,
    setScrollHandler: setScrollHandler,
    adjustDropDownField: adjustDropDownField,
    autoAlignDropDowns: autoAlignDropDowns,
    hideDropDowns: hideDropDowns,
    findFocusables: smartBase.findFocusables,
    clearFocusables: smartBase.clearFocusables,
    applyEllipsis: applyEllipsis,
    filterUnSupportedWidgets: filterUnSupportedWidgets,
    onTransitionEnd: smartBase.onTransitionEnd,
    getOffset: getOffset,
    alignDropDownMenu: alignDropDownMenu,
    alignDropDownSubMenus: alignDropDownSubMenus,
    getLanguageInfo: smartBase.getLanguageInfo,
    getMetadataLanguageInfo: smartBase.getMetadataLanguageInfo,
    getUserMetadataLanguageInfo: smartBase.getUserMetadataLanguageInfo,
    isControlClick: smartBase.isControlClick,
    getParentScrollViews: getParentScrollViews
  };
});


csui.define('csui/themes/csui.jato.mime.icons',[], function () {
let icons = {
'mimePermPublic': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="var(--jato-color-steel-1750, #6c7582ff)" d="M16 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3z" fill-opacity="1"/><path fill="url(#jato-mime-id-366)" fill-rule="evenodd" d="M4.821 2.85A1 1 0 0 0 4 3.836v16.33a1 1 0 0 0 .821.984l9 1.637A1 1 0 0 0 15 21.802V2.198a1 1 0 0 0-1.179-.984zM13 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2" clip-rule="evenodd"/><defs><linearGradient id="jato-mime-id-366" x1="4.393" x2="20.934" y1="2.398" y2="10.164" gradientUnits="userSpaceOnUse"><stop stop-color="#46a800" stop-opacity="1"/><stop offset="1" stop-color="#008273" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeGroup': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-222)" fill-rule="evenodd" d="M7.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M2 16a5.5 5.5 0 0 1 2.883-4.839A4.48 4.48 0 0 0 7.5 12c.976 0 1.88-.31 2.617-.839A5.5 5.5 0 0 1 13 16v2.1a1.9 1.9 0 0 1-1.9 1.9H3.9A1.9 1.9 0 0 1 2 18.1z" clip-rule="evenodd"/><circle cx="16.5" cy="7.5" r="3.5" fill="#5b7aab" fill-opacity="1"/><path fill="#5b7aab" fill-rule="evenodd" d="M13.291 20h7.126C21.29 20 22 19.291 22 18.417V16a5.5 5.5 0 0 0-2.883-4.839A4.48 4.48 0 0 1 16.5 12a4.48 4.48 0 0 1-2.617-.839 5.5 5.5 0 0 0-1.216.895A6.47 6.47 0 0 1 14 16v2.1c0 .727-.267 1.391-.709 1.9" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-222" x1=".429" x2="18.094" y1="4.054" y2="12.745" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimePerson': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-131)" fill-rule="evenodd" d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m-7 6a7 7 0 0 1 3.788-6.221A4.98 4.98 0 0 0 12 11.947a4.98 4.98 0 0 0 3.212-1.168A7 7 0 0 1 19 17v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" clip-rule="evenodd"/><defs><linearGradient id="jato-mime-id-131" x1="7" x2="19.865" y1="5.111" y2="14.969" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimePermissionsGroup': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="6.5" cy="4.5" r="2.5" fill="url(#jato-mime-id-381)"/><path fill="url(#jato-mime-id-382)" fill-rule="evenodd" d="M8.015 7.656C7.556 7.876 7.043 8 6.5 8a3.5 3.5 0 0 1-2.305-.866A4.5 4.5 0 0 0 2 11v1.5A1.5 1.5 0 0 0 3.5 14h2.689a6 6 0 0 1 2.623-3.584 3.98 3.98 0 0 1-.797-2.76" clip-rule="evenodd"/><circle cx="17.5" cy="4.5" r="2.5" fill="url(#jato-mime-id-383)"/><path fill="url(#jato-mime-id-384)" fill-rule="evenodd" d="M16 8c0 .909-.303 1.746-.812 2.416.515.324.977.724 1.371 1.184a4.87 4.87 0 0 1 5.44.353V11c0-1.643-.88-3.08-2.195-3.866A3.5 3.5 0 0 1 17.5 8a3.5 3.5 0 0 1-1.515-.344Q16 7.826 16 8" clip-rule="evenodd"/><path fill="url(#jato-mime-id-385)" fill-rule="evenodd" d="M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-5.466 3.15A5 5 0 0 0 7 15.5v1A1.5 1.5 0 0 0 8.5 18h5.114l.767-.745a4.86 4.86 0 0 1 1.37-5.06c-.366-.416-.8-.77-1.285-1.046-.68.533-1.536.851-2.466.851s-1.787-.318-2.466-.85" clip-rule="evenodd"/><path fill="#5b7aab" fill-rule="evenodd" d="M21.881 13.138a3.84 3.84 0 0 1-4.23 6.236l-1.566 1.55-1.358-.006-.006 1.357-1.357-.006V23H12l.014-2.095 3.603-3.57a3.84 3.84 0 0 1 6.264-4.197m-1.589 1.123a.96.96 0 1 1-1.363 1.351.96.96 0 0 1 1.363-1.35" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-381" x1="3.286" x2="9.881" y1="2.017" y2="6.737" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-382" x1="1.027" x2="10.06" y1="7.157" y2="13.572" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-383" x1="14.286" x2="20.881" y1="2.017" y2="6.737" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-384" x1="14.214" x2="20.929" y1="7.15" y2="13.944" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-385" x1="5.75" x2="19.918" y1="5.044" y2="11.87" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimePermissionsOwner': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" fill="url(#jato-mime-id-352)"/><path fill="url(#jato-mime-id-353)" fill-rule="evenodd" d="M5 17a7 7 0 0 1 3.788-6.221A4.98 4.98 0 0 0 12 11.947a4.98 4.98 0 0 0 3.212-1.168c.465.24.9.532 1.297.866a4.861 4.861 0 0 0-2.272 5.709L11 20.5V22H7a2 2 0 0 1-2-2zm11.5 5h.5a2 2 0 0 0 1.853-1.245 5 5 0 0 1-1-.108z" clip-rule="evenodd"/><path fill="#5b7aab" fill-rule="evenodd" d="M21.881 13.138a3.84 3.84 0 0 1-4.23 6.236l-1.566 1.55-1.358-.006-.006 1.357-1.357-.006V23H12l.014-2.095 3.603-3.57a3.84 3.84 0 0 1 6.264-4.197m-1.589 1.123a.96.96 0 1 1-1.363 1.351.96.96 0 0 1 1.363-1.35" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-352" x1="9.143" x2="14.749" y1="3.889" y2="9.719" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-353" x1="6.979" x2="14.608" y1="12.026" y2="21.82" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeRecentlyAccessed': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-387)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10m-1-7.5a.5.5 0 0 1 1 0v2.793l1.484 1.484a.5.5 0 1 1-.707.707l-1.619-1.62A.5.5 0 0 1 11 12.5z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-387" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeXml': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-393)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" d="M9.072 15.235a.63.63 0 0 1-.44-.177L6 12.508l2.633-2.552a.634.634 0 0 1 .877 0 .59.59 0 0 1 0 .85l-1.755 1.702 1.755 1.7a.59.59 0 0 1 0 .85.63.63 0 0 1-.438.177M14.928 15.235a.63.63 0 0 1-.438-.177.587.587 0 0 1 0-.85l1.755-1.7-1.755-1.701a.587.587 0 0 1 0-.85.634.634 0 0 1 .877 0L18 12.506l-2.633 2.551a.63.63 0 0 1-.439.177M13.95 8l-2.812 9H10l2.813-9z" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-393" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeApplicationForm': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="18" cy="18" r="5" fill="#5b7aab" fill-opacity="1"/><path fill="url(#jato-mime-id-283)" fill-rule="evenodd" d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7.528A6 6 0 0 1 20 12.341V6.593a2 2 0 0 0-.604-1.432l-2.66-2.593A2 2 0 0 0 15.34 2z" clip-rule="evenodd"/><path fill="#fff" fill-rule="evenodd" d="m17.619 16.692-1.94 1.944-.517 1.867a.25.25 0 0 0 .308.308l1.867-.517 1.94-1.944zm2.39.926.53-.532a1 1 0 0 0-.001-1.414l-.244-.244a1 1 0 0 0-1.415 0l-.53.531z" clip-rule="evenodd" fill-opacity="1"/><path fill="#fff" d="M6 13.5a.5.5 0 0 1 .5-.5H11a.5.5 0 0 1 0 1H6.5a.5.5 0 0 1-.5-.5" fill-opacity="1"/><rect width="5" height="1" x="13" y="7" fill="#fff" rx=".5" fill-opacity="1"/><rect width="3" height="1" x="6" y="16" fill="#fff" rx=".5" fill-opacity="1"/><rect width="2" height="1" x="13" y="9" fill="#fff" rx=".5" fill-opacity="1"/><path fill="#fff" d="M6 6.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5z" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-283" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeNewsItem': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-224)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><rect width="5" height="1" x="7" y="15" fill="#fff" rx=".5" fill-opacity="1"/><rect width="9" height="1" x="7" y="6" fill="#fff" rx=".5" fill-opacity="1"/><rect width="4" height="1" x="13" y="15" fill="#fff" rx=".5" fill-opacity="1"/><rect width="4" height="1" x="13" y="9" fill="#fff" rx=".5" fill-opacity="1"/><rect width="4" height="1" x="13" y="12" fill="#fff" rx=".5" fill-opacity="1"/><rect width="5" height="1" x="7" y="18" fill="#fff" rx=".5" fill-opacity="1"/><rect width="4" height="1" x="13" y="18" fill="#fff" rx=".5" fill-opacity="1"/><rect width="5" height="4" x="7" y="9" fill="#fff" rx=".5" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-224" x1="6.286" x2="20.077" y1="4.222" y2="15.696" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeNotification': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="url(#jato-mime-id-228)"/><path fill="#fff" d="M13 13.033V7.59c0-.43-.448-.778-1-.778s-1 .349-1 .778v5.444c0 .43.448.778 1 .778s1-.348 1-.778" fill-opacity="1"/><circle cx="1.189" cy="1.189" r="1.189" fill="#fff" transform="matrix(1 0 0 -1 10.812 18)" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-228" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#f16e00" stop-opacity="1"/><stop offset="1" stop-color="#dc198e" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeFacets': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-391)" d="M3 8a2 2 0 0 1 2-2h7.07a2 2 0 0 1 1.385.557l1.93 1.853A2 2 0 0 1 16 9.852V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path fill="#5b7aab" fill-rule="evenodd" d="M10 2a2 2 0 0 0-2 2v1h4.07a3 3 0 0 1 2.078.836l1.93 1.852A3 3 0 0 1 17 9.852V18h2a2 2 0 0 0 2-2V5.852a2 2 0 0 0-.615-1.442l-1.93-1.853A2 2 0 0 0 17.07 2z" clip-rule="evenodd" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M10.894 13.173a2.22 2.22 0 1 1-4.441 0 2.22 2.22 0 0 1 4.441 0m-.34 2.554a3.173 3.173 0 1 1 .674-.673l2.144 2.146a.476.476 0 0 1-.672.672z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-391" x1="1.143" x2="20.521" y1="6.054" y2="17.322" gradientUnits="userSpaceOnUse"><stop stop-color="#f52c1e" stop-opacity="1"/><stop offset="1" stop-color="#ce24a9" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeTask': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#5b7aab" d="M9 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9z" fill-opacity="1"/><path fill="url(#jato-mime-id-305)" fill-rule="evenodd" d="M4 6a2 2 0 0 1 2-2v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4a2 2 0 0 1 2 2v6.341A6 6 0 0 0 13.528 22H6a2 2 0 0 1-2-2z" clip-rule="evenodd"/><path fill="#94a8c9" d="M7 4h10v2.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z" fill-opacity="1"/><path fill="#fff" d="M8 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5" fill-opacity="1"/><circle cx="18" cy="18" r="5" fill="#5b7aab" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M14 13.529V13.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h5.028q.223-.249.471-.472" clip-rule="evenodd" opacity=".85" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M12.341 16H8.5a.5.5 0 0 0 0 1h3.583a6 6 0 0 1 .258-1" clip-rule="evenodd" opacity=".65" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M20.854 16.146a.5.5 0 0 1 0 .708L17.5 20.207l-1.854-1.853a.5.5 0 0 1 .708-.708l1.146 1.147 2.646-2.647a.5.5 0 0 1 .708 0" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-305" x1="1.714" x2="24.435" y1="4.06" y2="18.514" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeSupportAssetsImage': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-208)" fill-rule="evenodd" d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7.528A6 6 0 0 1 20 12.341V6.593a2 2 0 0 0-.604-1.432l-2.66-2.593A2 2 0 0 0 15.34 2z" clip-rule="evenodd"/><path fill="#fff" fill-rule="evenodd" d="M16.724 12.136a6.01 6.01 0 0 0-4.588 4.588 3.5 3.5 0 1 1 4.588-4.588" clip-rule="evenodd" opacity=".6" fill-opacity="1"/><rect width="7" height="7" x="7" y="6" fill="#fff" rx="1" fill-opacity="1"/><circle cx="18" cy="18" r="5" fill="#5b7aab" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M18.69 21.561a.25.25 0 0 0 .08-.16l.094-1.054c.269-.099.516-.244.733-.424l.96.447a.25.25 0 0 0 .32-.103l.522-.907a.25.25 0 0 0-.07-.328l-.867-.608c.048-.28.048-.566 0-.846l.87-.61a.25.25 0 0 0 .07-.328l-.523-.907a.25.25 0 0 0-.32-.103l-.963.449a2.5 2.5 0 0 0-.733-.424l-.093-1.058a.25.25 0 0 0-.248-.225h-1.048a.25.25 0 0 0-.249.225l-.093 1.058a2.5 2.5 0 0 0-.733.423l-.96-.446a.25.25 0 0 0-.319.103l-.523.907a.25.25 0 0 0 .07.328l.866.608c-.048.28-.048.566 0 .846l-.867.608a.25.25 0 0 0-.07.328l.524.907a.25.25 0 0 0 .32.103l.96-.447a2.5 2.5 0 0 0 .732.424l.093 1.054a.25.25 0 0 0 .249.225h1.048a.25.25 0 0 0 .167-.065m-2.17-3.56a1.48 1.48 0 1 0 2.96 0 1.48 1.48 0 0 0-2.96 0" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-208" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeFacetsTree': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="6" height="6" x="16" y="3" fill="url(#jato-mime-id-255)" rx="1"/><rect width="6" height="6" x="16" y="15" fill="url(#jato-mime-id-256)" rx="1"/><path fill="#94a8c9" fill-rule="evenodd" d="M13 7.5A1.5 1.5 0 0 1 14.5 6H16v1h-1.5a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5H16v1h-1.5a1.5 1.5 0 0 1-1.5-1.5V13h-3v-1h3z" clip-rule="evenodd" fill-opacity="1"/><path fill="url(#jato-mime-id-257)" d="M2 7.125C2 6.504 2.504 6 3.125 6h6.027c.285 0 .56.109.769.304l1.723 1.613c.227.212.356.51.356.82v8.138c0 .621-.504 1.125-1.125 1.125h-7.75A1.125 1.125 0 0 1 2 16.875z"/><rect width="5" height="1" x="3.5" y="10" fill="#fff" rx=".5" fill-opacity="1"/><rect width="3" height="1" x="3.5" y="12" fill="#fff" rx=".5" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-255" x1="15.143" x2="23.057" y1="3.02" y2="8.684" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-256" x1="15.143" x2="23.057" y1="15.02" y2="20.684" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-257" x1=".714" x2="14.651" y1="6.04" y2="13.521" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeLayoutTemplate': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-309)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><rect width="4" height="3" x="7" y="8" fill="#fff" rx=".5" fill-opacity="1"/><rect width="5" height="3" x="12" y="14" fill="#fff" rx=".5" fill-opacity="1"/><rect width="5" height="5" x="12" y="8" fill="#fff" rx=".5" fill-opacity="1"/><rect width="4" height="5" x="7" y="12" fill="#fff" rx=".5" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-309" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCustomColumn': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-236)" fill-rule="evenodd" d="M7 2a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h6.528A6.003 6.003 0 0 1 16 12.341V3a1 1 0 0 0-1-1z" clip-rule="evenodd"/><circle cx="18" cy="18" r="5" fill="#5b7aab" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M18.69 21.562a.25.25 0 0 0 .081-.16l.094-1.054c.269-.099.516-.244.733-.424l.96.447a.25.25 0 0 0 .32-.103l.522-.907a.25.25 0 0 0-.07-.328l-.867-.608c.048-.28.048-.566 0-.847l.87-.61a.25.25 0 0 0 .07-.327l-.523-.907a.25.25 0 0 0-.32-.103l-.963.449a2.5 2.5 0 0 0-.733-.424l-.093-1.058a.25.25 0 0 0-.248-.225h-1.048a.25.25 0 0 0-.249.225l-.093 1.058a2.5 2.5 0 0 0-.733.423l-.96-.446a.25.25 0 0 0-.319.103l-.524.907a.25.25 0 0 0 .071.328l.866.607c-.048.28-.048.567 0 .848l-.867.607a.25.25 0 0 0-.07.328l.524.907a.25.25 0 0 0 .32.103l.96-.447c.218.182.465.325.732.424l.093 1.054a.25.25 0 0 0 .249.225h1.048a.25.25 0 0 0 .167-.065m-2.17-3.56a1.48 1.48 0 1 0 2.962 0 1.48 1.48 0 0 0-2.961 0" clip-rule="evenodd" fill-opacity="1"/><path fill="#94a8c9" d="M6 3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1H6z" fill-opacity="1"/><rect width="6" height="1" x="8" y="6" fill="#fff" rx=".5" fill-opacity="1"/><rect width="6" height="1" x="8" y="9" fill="#fff" rx=".5" fill-opacity="1"/><rect width="6" height="1" x="8" y="12" fill="#fff" rx=".5" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M12.76 15.073A.5.5 0 0 0 12.5 15h-4a.5.5 0 0 0 0 1h3.841q.172-.484.42-.927" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-236" x1="4.571" x2="22.254" y1="2.067" y2="8.394" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeTaskGroup': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-303)" fill-rule="evenodd" d="M2 5a2 2 0 0 1 2-2v3a1 1 0 0 0 1 1h1v14H4a2 2 0 0 1-2-2z" clip-rule="evenodd"/><path fill="#5b7aab" d="M12 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1h-6z" fill-opacity="1"/><path fill="url(#jato-mime-id-304)" fill-rule="evenodd" d="M9 6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2v3a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1z" clip-rule="evenodd"/><path fill="#94a8c9" d="M10 6h10v2.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z" fill-opacity="1"/><path stroke="#fff" stroke-linecap="round" stroke-width="1.25" d="m12 14 2 2 4-4" stroke-opacity="1"/><path fill="#fff" d="M11 18.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5" fill-opacity="1"/><path fill="#fff" d="M12 20.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5" opacity=".65" fill-opacity="1"/><path fill="#94a8c9" fill-rule="evenodd" d="M5 3h8a2 2 0 0 0-2 2H9c-.889 0-1.687.386-2.236 1H5.5a.5.5 0 0 1-.5-.5z" clip-rule="evenodd" fill-opacity="1"/><path fill="#5b7aab" fill-rule="evenodd" d="M8 1a1 1 0 0 0-1 1v1h6V2a1 1 0 0 0-1-1z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-303" x1="1.429" x2="9.21" y1="3.06" y2="4.298" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-304" x1="4.714" x2="27.435" y1="6.06" y2="20.514" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimePerspectiveAssetsFolder': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-259)" d="M2 5.5A1.5 1.5 0 0 1 3.5 4h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12a1.5 1.5 0 0 0 1.06.44H20.5A1.5 1.5 0 0 1 22 7.5v11a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5z"/><path fill="#fff" fill-rule="evenodd" d="M5.75 8a.75.75 0 0 0-.75.75v3.5c0 .414.336.75.75.75h12.5a.75.75 0 0 0 .75-.75v-3.5a.75.75 0 0 0-.75-.75zm0 6a.75.75 0 0 0-.75.75v2.5c0 .414.336.75.75.75h2.5a.75.75 0 0 0 .75-.75v-2.5a.75.75 0 0 0-.75-.75zm9.25.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1-.75-.75zM10.75 14a.75.75 0 0 0-.75.75v2.5c0 .414.336.75.75.75h2.5a.75.75 0 0 0 .75-.75v-2.5a.75.75 0 0 0-.75-.75z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-259" x1="2.714" x2="18.476" y1="4.889" y2="23.057" gradientUnits="userSpaceOnUse"><stop stop-color="#46a800" stop-opacity="1"/><stop offset="1" stop-color="#008273" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeFolderPerspectiveAssetsVolume': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#94a8c9" fill-rule="evenodd" d="M4.5 3A1.5 1.5 0 0 0 3 4.5v3a.5.5 0 0 1-1 0v-3A2.5 2.5 0 0 1 4.5 2h3a.5.5 0 0 1 0 1zM4.5 21A1.5 1.5 0 0 1 3 19.5v-3a.5.5 0 0 0-1 0v3A2.5 2.5 0 0 0 4.5 22h3a.5.5 0 0 0 0-1zM19.5 3A1.5 1.5 0 0 1 21 4.5v3a.5.5 0 0 0 1 0v-3A2.5 2.5 0 0 0 19.5 2h-3a.5.5 0 0 0 0 1zM19.5 21a1.5 1.5 0 0 0 1.5-1.5v-3a.5.5 0 0 1 1 0v3a2.5 2.5 0 0 1-2.5 2.5h-3a.5.5 0 0 1 0-1z" clip-rule="evenodd" fill-opacity="1"/><path fill="url(#jato-mime-id-273)" fill-rule="evenodd" d="M5.75 7a.75.75 0 0 0-.75.75v3.5c0 .414.336.75.75.75h12.5a.75.75 0 0 0 .75-.75v-3.5a.75.75 0 0 0-.75-.75zm0 6a.75.75 0 0 0-.75.75v2.5c0 .414.336.75.75.75h2.5a.75.75 0 0 0 .75-.75v-2.5a.75.75 0 0 0-.75-.75zm9.25.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1-.75-.75zM10.75 13a.75.75 0 0 0-.75.75v2.5c0 .414.336.75.75.75h2.5a.75.75 0 0 0 .75-.75v-2.5a.75.75 0 0 0-.75-.75z" clip-rule="evenodd"/><defs><linearGradient id="jato-mime-id-273" x1="3" x2="16.936" y1="7.033" y2="20.996" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeFormula': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-201)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path stroke="#fff" stroke-linecap="round" d="M11.5 6.5h-1a1 1 0 0 0-1 1v8c0 .667-.4 2-2 2M7.5 12.5h4M12.5 10.5h1l2 4h1" stroke-opacity="1"/><path stroke="#fff" stroke-linecap="round" d="M16.5 10.5h-1l-2 4h-1" stroke-opacity="1"/><defs><linearGradient id="jato-mime-id-201" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeVideo': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-414)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M8 8.5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1zm2 5.76v-3.521a.25.25 0 0 1 .362-.224l3.52 1.76a.25.25 0 0 1 0 .448l-3.52 1.76A.25.25 0 0 1 10 14.26" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-414" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeSpreadsheet': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-199)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" d="M7 10a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1H7zM11 12h6v2h-6zM11 15h6v1a1 1 0 0 1-1 1h-5zM7 15h3v2H8a1 1 0 0 1-1-1zM7 12h3v2H7z" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-199" x1="6.286" x2="20.077" y1="4.222" y2="15.696" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeSearchQuery': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="url(#jato-mime-id-150)"/><path fill="#fff" fill-rule="evenodd" d="M13.8 11a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0m-.428 3.22a4 4 0 1 1 .849-.849l2.703 2.705a.6.6 0 0 1-.848.848z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-150" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCompoundRevisionFolder': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-275)" d="M2 6a2 2 0 0 1 2-2h3.172a2 2 0 0 1 1.414.586l1.121 1.121a1 1 0 0 0 .707.293H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path fill="#fff" d="M14.929 9c.078.03.163.049.234.092.17.104.263.264.264.464a149 149 0 0 1 0 1.745.566.566 0 0 1-.557.555q-.87.003-1.741 0a.57.57 0 1 1 .035-1.142h.522l.012-.013q-.016-.003-.027-.01a2.8 2.8 0 0 0-1.377-.532 2.855 2.855 0 0 0-1.872 5.223 2.8 2.8 0 0 0 1.69.472c.898-.034 1.616-.42 2.162-1.128q.432-.56.592-1.252a.63.63 0 0 1 .219-.364c.274-.218.795-.12.898.334a1 1 0 0 1-.033.48 4 4 0 0 1-.53 1.158 4.26 4.26 0 0 1-1.463 1.412 3.8 3.8 0 0 1-1.42.471 4 4 0 0 1-1.914-.21 3.96 3.96 0 0 1-2.103-1.783 3.9 3.9 0 0 1-.49-1.484q-.013-.122-.022-.244L8 13.187v-.375q.006-.023.007-.047.022-.432.142-.847A3.96 3.96 0 0 1 10.063 9.5c.462-.262.96-.417 1.488-.475q.131-.014.262-.026h.375l.052.008c.126.013.252.02.377.04a3.95 3.95 0 0 1 1.63.645l.039.023v-.152a.55.55 0 0 1 .27-.474c.07-.042.153-.06.23-.09z" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-275" x1="-.857" x2="21.302" y1="4.054" y2="23.877" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCompoundReleaseFolder': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-278)" d="M2 6a2 2 0 0 1 2-2h3.172a2 2 0 0 1 1.414.586l1.121 1.121a1 1 0 0 0 .707.293H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path fill="#fff" d="M18 13.125c-.036 1.16-.58 2.218-1.666 3.028a.45.45 0 0 1-.451.07.39.39 0 0 1-.264-.333c-.017-.154.053-.274.182-.367q.478-.342.8-.817c.95-1.403.61-3.228-.792-4.251-.22-.161-.26-.413-.093-.597a.45.45 0 0 1 .595-.055q.544.385.93.91c.502.686.753 1.447.759 2.412" fill-opacity="1"/><path fill="#fff" d="M15.99 13.139c-.033.647-.4 1.242-1.137 1.626-.26.136-.56.02-.638-.237-.054-.182.031-.366.223-.463.223-.113.401-.268.526-.475.351-.58.133-1.312-.491-1.638-.143-.075-.248-.17-.267-.328a.37.37 0 0 1 .175-.375.43.43 0 0 1 .449-.029q.536.259.85.74c.208.317.312.673.31 1.179M8 14.998c-.19 0-.432.007-.612-.002a.404.404 0 0 1-.387-.407v-3.157c0-.27.176-.434.467-.435H8c-.122.297-.078.6-.08.9-.004.849 0 1.697-.002 2.545 0 .187.007.37.082.556M12.276 9.362l-3 1.5a.5.5 0 0 0-.276.447v3.382a.5.5 0 0 0 .276.447l3 1.5a.5.5 0 0 0 .724-.447V9.809a.5.5 0 0 0-.724-.447" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-278" x1="-.857" x2="21.302" y1="4.054" y2="23.877" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCompoundDocument': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-302)" d="M2 11a1 1 0 0 1 1-1h2.31a2 2 0 0 1 1.486.662l.906 1.007a1 1 0 0 0 .743.331H15a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/><path fill="#5b7aab" fill-rule="evenodd" d="M11 2a2 2 0 0 0-2 2v7h6a2 2 0 0 1 2 2v5h3a2 2 0 0 0 2-2V5.852a2 2 0 0 0-.615-1.442l-1.93-1.853A2 2 0 0 0 18.07 2z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-302" x1="0" x2="15.263" y1="10.037" y2="23.939" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeVisio': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-252)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="var(--jato-color-white-10000, #ffff)" fill-rule="evenodd" d="M8.2 7.813a.75.75 0 0 1 .987.386L12 14.63l2.813-6.43a.75.75 0 0 1 1.374.602l-3.5 8a.75.75 0 0 1-1.374 0l-3.5-8a.75.75 0 0 1 .386-.988" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-252" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeSupportAssetsImageFolder': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-298)" fill-rule="evenodd" d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8.341A6 6 0 0 1 22 13.528V8a2 2 0 0 0-2-2h-9.586a1 1 0 0 1-.707-.293L8.586 4.586A2 2 0 0 0 7.172 4z" clip-rule="evenodd"/><path fill="#fff" fill-rule="evenodd" d="M16.201 12.274a6 6 0 0 0-4.192 5.394 3.5 3.5 0 1 1 4.192-5.394" clip-rule="evenodd" opacity=".6" fill-opacity="1"/><rect width="6" height="6" x="7" y="8" fill="#fff" rx="1" fill-opacity="1"/><circle cx="18" cy="18" r="5" fill="#5b7aab" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M18.69 21.561a.25.25 0 0 0 .08-.16l.094-1.054c.269-.099.516-.244.733-.424l.96.447a.25.25 0 0 0 .32-.103l.522-.907a.25.25 0 0 0-.07-.328l-.867-.608c.048-.28.048-.566 0-.846l.87-.61a.25.25 0 0 0 .07-.328l-.523-.907a.25.25 0 0 0-.32-.103l-.963.449a2.5 2.5 0 0 0-.733-.424l-.093-1.058a.25.25 0 0 0-.248-.225h-1.048a.25.25 0 0 0-.249.225l-.093 1.058a2.5 2.5 0 0 0-.733.423l-.96-.446a.25.25 0 0 0-.319.103l-.523.907a.25.25 0 0 0 .07.328l.866.608c-.048.28-.048.566 0 .846l-.867.608a.25.25 0 0 0-.07.328l.524.907a.25.25 0 0 0 .32.103l.96-.447a2.5 2.5 0 0 0 .732.424l.093 1.054a.25.25 0 0 0 .249.225h1.048a.25.25 0 0 0 .167-.065m-2.17-3.56a1.48 1.48 0 1 0 2.96 0 1.48 1.48 0 0 0-2.96 0" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-298" x1="-.857" x2="21.302" y1="4.054" y2="23.877" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeSupportAssetsDocument': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-290)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M13.004 17.46a.36.36 0 0 0 .118-.234l.136-1.533a3.6 3.6 0 0 0 1.066-.617l1.397.65a.363.363 0 0 0 .465-.15l.76-1.32a.364.364 0 0 0-.102-.477l-1.26-.883c.07-.408.07-.825 0-1.232l1.265-.888a.363.363 0 0 0 .102-.477l-.762-1.32a.364.364 0 0 0-.464-.15l-1.401.654a3.6 3.6 0 0 0-1.067-.617l-.135-1.539A.364.364 0 0 0 12.76 7h-1.524a.364.364 0 0 0-.362.327l-.135 1.54a3.6 3.6 0 0 0-1.067.616l-1.396-.65a.364.364 0 0 0-.465.15l-.761 1.32a.364.364 0 0 0 .102.477l1.26.884c-.07.407-.07.824 0 1.232l-1.261.884a.364.364 0 0 0-.102.477l.762 1.32a.364.364 0 0 0 .464.15l1.397-.651c.318.265.679.473 1.067.617l.135 1.533a.364.364 0 0 0 .361.328h1.525c.09 0 .177-.034.244-.094m-3.156-5.18a2.154 2.154 0 1 0 4.308 0 2.154 2.154 0 0 0-4.308 0" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-290" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeSupportAssetsFolder': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-294)" d="M2 6a2 2 0 0 1 2-2h3.172a2 2 0 0 1 1.414.586l1.121 1.121a1 1 0 0 0 .707.293H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M12.803 17.146a.3.3 0 0 0 .095-.187l.108-1.226c.313-.116.601-.284.853-.494l1.118.52a.29.29 0 0 0 .372-.12l.608-1.056a.29.29 0 0 0-.082-.381l-1.008-.707c.055-.326.055-.66 0-.986l1.012-.71a.29.29 0 0 0 .082-.381l-.61-1.056a.29.29 0 0 0-.371-.12l-1.121.523a2.9 2.9 0 0 0-.853-.494l-.108-1.23a.29.29 0 0 0-.29-.263h-1.22a.29.29 0 0 0-.289.262l-.108 1.232a2.9 2.9 0 0 0-.853.492l-1.117-.52a.29.29 0 0 0-.372.12l-.61 1.056a.29.29 0 0 0 .083.382l1.008.707c-.056.326-.056.66 0 .986l-1.01.707a.29.29 0 0 0-.08.382l.609 1.056a.29.29 0 0 0 .371.12l1.118-.52c.254.211.543.378.853.493l.108 1.226a.29.29 0 0 0 .29.262h1.22a.3.3 0 0 0 .194-.075m-2.525-4.144a1.723 1.723 0 1 0 3.446 0 1.723 1.723 0 0 0-3.446 0" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-294" x1="-.857" x2="21.302" y1="4.054" y2="23.877" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeEnterprise': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="url(#jato-mime-id-276)"/><path stroke="#fff" d="M16 5.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM6 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM16 15.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" stroke-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M14.654 5.52a7.003 7.003 0 0 0-9.406 4.625 2 2 0 0 1 1.084-.118 6.003 6.003 0 0 1 7.767-3.65c.109-.332.303-.626.555-.856m-8.322 8.453a2 2 0 0 1-1.083-.12 7.003 7.003 0 0 0 9.405 4.626 2 2 0 0 1-.555-.856 6.003 6.003 0 0 1-7.767-3.65m10.692 1.309c.297.177.543.428.715.728A6.97 6.97 0 0 0 19 12a6.97 6.97 0 0 0-1.261-4.01 2 2 0 0 1-.715.728c.617.943.976 2.07.976 3.282a5.97 5.97 0 0 1-.976 3.282" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-276" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeOneNote': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-286)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" d="M15.123 8c.484 0 .877.393.877.877V16a1 1 0 0 1-1 1h-.068a1 1 0 0 1-.8-.4L9.86 10.89a.054.054 0 0 0-.096.033v5.194a.882.882 0 1 1-1.764 0V9a1 1 0 0 1 1-1h.077a1 1 0 0 1 .801.402l4.265 5.71a.057.057 0 0 0 .103-.034V8.877c0-.484.393-.877.877-.877" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-286" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeFolder': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-129)" d="M2 6a2 2 0 0 1 2-2h3.172a2 2 0 0 1 1.414.586l1.121 1.121a1 1 0 0 0 .707.293H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><defs><linearGradient id="jato-mime-id-129" x1="-.857" x2="21.302" y1="4.054" y2="23.877" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeExcel': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-415)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" d="m12 13.85-2.223 2.801a.923.923 0 1 1-1.412-1.187L11 12.5 8.365 9.535A.923.923 0 1 1 9.777 8.35L12 11.15l2.223-2.801a.923.923 0 1 1 1.412 1.186L13 12.5l2.635 2.964a.923.923 0 1 1-1.412 1.187z" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-415" x1="4.571" x2="23.586" y1="3.111" y2="17.138" gradientUnits="userSpaceOnUse"><stop stop-color="#46a800" stop-opacity="1"/><stop offset="1" stop-color="#008273" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeWord': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-412)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="var(--jato-color-white-10000, #ffff)" fill-rule="evenodd" d="M6.763 7.788a.75.75 0 0 1 .948.475l1.813 5.439 1.77-4.954a.75.75 0 0 1 1.412 0l1.77 4.954 1.812-5.44a.75.75 0 0 1 1.424.475l-2.5 7.5a.75.75 0 0 1-1.418.015L12 11.23l-1.794 5.022a.75.75 0 0 1-1.418-.015l-2.5-7.5a.75.75 0 0 1 .475-.949" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-412" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeUrl': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="url(#jato-mime-id-45)"/><path fill="#fff" d="m6.32 15.292-.006-.01-.005-.01c-.157-.285-.214-.99.57-2.175.216-.327.48-.664.79-1.001.252.62.56 1.249.92 1.874.36.624.751 1.204 1.162 1.733q-.672.149-1.262.184c-1.418.085-2-.316-2.169-.595M9.726 13.313a14 14 0 0 1-1.03-2.199 14 14 0 0 1 1.99-1.388c.746-.43 1.488-.772 2.2-1.03.486.579.958 1.246 1.388 1.991s.772 1.487 1.03 2.198a14 14 0 0 1-1.991 1.39c-.745.43-1.487.771-2.198 1.028a14 14 0 0 1-1.389-1.99M10.03 8.589a15 15 0 0 1 1.874-.921 8 8 0 0 0-1-.79c-1.2-.791-1.907-.725-2.186-.563-.28.16-.69.74-.604 2.175.023.39.084.814.183 1.26A15 15 0 0 1 10.03 8.59M15.51 8.113c-.391.024-.814.084-1.26.184.41.529.801 1.11 1.161 1.734s.668 1.252.921 1.872q.464-.507.789-1c.783-1.186.727-1.89.57-2.176l-.006-.01-.006-.009c-.168-.279-.75-.68-2.17-.595M11.902 5.435a6.6 6.6 0 0 1 4.095 1.355c-.811-.015-1.733.118-2.707.396-.704-.728-1.437-1.304-2.147-1.696q.38-.05.759-.055M18.51 11.143c-.392.71-.969 1.442-1.696 2.146.278.974.411 1.896.396 2.708a6.6 6.6 0 0 0 1.3-4.854M15.301 17.674c.279-.175.67-.76.586-2.164a8 8 0 0 0-.183-1.26c-.53.41-1.11.8-1.735 1.161-.624.36-1.253.668-1.872.92.337.31.673.574 1 .79 1.174.775 1.876.728 2.167.575l.018-.01zM12.857 18.51c-.71-.392-1.442-.969-2.147-1.697-.974.279-1.896.412-2.708.397a6.6 6.6 0 0 0 4.855 1.3M7.186 10.71c-.278-.974-.41-1.897-.395-2.708a6.59 6.59 0 0 0-1.302 4.855c.393-.71.97-1.443 1.697-2.147" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-45" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeAudio': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-413)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><rect width="1" height="11" x="14" y="7" fill="#fff" rx=".5" fill-opacity="1"/><rect width="1" height="5" x="16" y="10" fill="#fff" rx=".5" fill-opacity="1"/><rect width="1" height="7" x="12" y="9" fill="#fff" rx=".5" fill-opacity="1"/><rect width="1" height="3" x="10" y="11" fill="#fff" rx=".5" fill-opacity="1"/><rect width="1" height="5" x="8" y="10" fill="#fff" rx=".5" fill-opacity="1"/><rect width="1" height="1" x="6" y="12" fill="#fff" rx=".5" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-413" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#f52c1e" stop-opacity="1"/><stop offset="1" stop-color="#ce24a9" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeZip': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-200)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" d="M10 2h2v2h-2zM12 4h2v2h-2zM10 6h2v2h-2zM12 8h2v2h-2zM10 10h2v2h-2z" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M14 13h-4v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm-1 2h-2v2h2z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-200" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCollaborativePlace': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-132)" d="M19.5 9.5c0 5-7.5 12.5-7.5 12.5S4.5 14.5 4.5 9.5a7.5 7.5 0 1 1 15 0"/><circle cx="12" cy="10.5" r="2.5" fill="#fff" fill-opacity="1"/><circle cx="7.5" cy="11.5" r="1.5" fill="#fff" opacity=".65" fill-opacity="1"/><circle cx="16.5" cy="11.5" r="1.5" fill="#fff" opacity=".65" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M7.635 15.156c1.403 2.08 3.397 4.294 4.379 5.297 1.353-1.368 3.144-3.645 4.396-5.313a5 5 0 0 0-2.045-2.055 3.5 3.5 0 0 1-2.36.915c-.901 0-1.723-.34-2.344-.9a5 5 0 0 0-2.026 2.056" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-132" x1="2.357" x2="25.585" y1="2.067" y2="14.535" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCollection': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-274)" d="M3 3a1 1 0 0 1 1-1h12a2 2 0 0 1 2 2v16.002a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1z"/><path fill="#5b7aab" d="M19 4h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1z" fill-opacity="1"/><path fill="#5b7aab" d="M19 9h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1z" opacity=".8" fill-opacity="1"/><path fill="#5b7aab" d="M19 14h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1z" opacity=".6" fill-opacity="1"/><path fill="#fff" d="M6 6.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5z" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-274" x1=".857" x2="24.086" y1="2.067" y2="14.534" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimePdf': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-362)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><g clip-path="url(#jato-mime-id-363)"><path fill="#fff" d="M7.216 19c.838 0 1.672-.844 2.86-2.898 1.209-.398 2.534-.895 3.7-1.087 1.015.553 2.205.914 2.996.914 1.367 0 1.46-1.5.922-2.035-.65-.637-2.542-.455-3.446-.337-.936-.572-1.559-1.36-1.999-2.523.21-.867.543-2.185.29-3.01-.22-1.378-1.985-1.242-2.237-.319-.234.858-.02 2.068.379 3.61-.543 1.295-1.344 3.03-1.91 4.023-.005 0-.005.005-.01.005-1.268.652-3.446 2.086-2.551 3.188.262.324.749.469 1.006.469m9.977-4.107s-.267.319-2.004-.422c1.887-.136 2.196.295 2.004.422m-5.758-7.085c.393 0 .355 1.73.093 2.2-.234-.75-.23-2.2-.093-2.2m.014 4.412c.45.816 1.02 1.463 1.615 1.913-1.12.22-2.088.699-2.945 1.027.52-.91.97-1.993 1.33-2.94m-2.772 3.967c-1.016 1.631-1.634 1.922-1.634 1.885.272-.736 1.32-1.59 1.634-1.885" fill-opacity="1"/></g><defs><linearGradient id="jato-mime-id-362" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#f52c1e" stop-opacity="1"/><stop offset="1" stop-color="#ce24a9" stop-opacity="1"/></linearGradient><clipPath id="jato-mime-id-363"><path fill="#fff" d="M0 0h12v12H0z" transform="translate(6 7)" fill-opacity="1"/></clipPath></defs></svg>`,
'mimePresentation': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-182)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" d="M8 10h8v4a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" fill-opacity="1"/><rect width="10" height="1" x="7" y="8" fill="#fff" rx=".5" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M12 7a.5.5 0 0 1 .5.5v1h-1v-1A.5.5 0 0 1 12 7M15.447 16.776 15 16h-1.184l.737 1.224a.5.5 0 1 0 .894-.448M8.55 16.776 8.999 16h1.184l-.737 1.224a.5.5 0 1 1-.894-.448" clip-rule="evenodd" opacity=".8" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-182" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimePublisher': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-153)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path stroke="#fff" d="M7.5 17v-4.5m0 0v-4h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1zM13.5 12.5h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2V9" stroke-opacity="1"/><defs><linearGradient id="jato-mime-id-153" x1="6.286" x2="20.077" y1="4.222" y2="15.696" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeActiveView': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-347)" fill-rule="evenodd" d="M2 7a3 3 0 0 1 3-3h1a4 4 0 0 0-4 4zm6 6a3 3 0 0 0 3-3V4h8a3 3 0 0 1 3 3v4h-6a3 3 0 0 0-3 3v6H5a3 3 0 0 1-3-3v-4zm10 7h1a3 3 0 0 0 3-3v-1a4 4 0 0 1-4 4" clip-rule="evenodd"/><path fill="url(#jato-mime-id-348)" d="M2 7a3 3 0 0 1 3-3h5v6a2 2 0 0 1-2 2H2z"/><path fill="url(#jato-mime-id-349)" d="M22 17a3 3 0 0 1-3 3h-5v-6a2 2 0 0 1 2-2h6z"/><defs><linearGradient id="jato-mime-id-347" x1="-.857" x2="21.302" y1="4.054" y2="23.877" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-348" x1=".857" x2="11.41" y1="4.027" y2="11.579" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-349" x1="23.143" x2="12.59" y1="19.973" y2="12.421" gradientUnits="userSpaceOnUse"><stop stop-color="#f52c1e" stop-opacity="1"/><stop offset="1" stop-color="#ce24a9" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeAppearance': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-103)" d="M14.787 4.988c0 .903-.613 2.777-1.165 4.282a.915.915 0 0 1-1.737 0c-.553-1.505-1.165-3.379-1.165-4.282C10.72 3.34 11.626 2 12.753 2s2.034 1.333 2.034 2.988"/><path fill="url(#jato-mime-id-104)" d="M11.51 19.802c-.312-.852-.378-2.815-.375-4.416a.915.915 0 0 1 1.631-.594c1.036 1.227 2.254 2.778 2.565 3.626.568 1.553.17 3.115-.88 3.497-1.06.382-2.374-.56-2.941-2.113"/><path fill="url(#jato-mime-id-105)" d="M16.552 18.215c-.784-.451-2.099-1.91-3.128-3.137a.915.915 0 0 1 .867-1.504c1.582.276 3.51.684 4.295 1.135 1.432.823 2.135 2.275 1.576 3.242-.568.968-2.178 1.087-3.61.264"/><path fill="url(#jato-mime-id-106)" d="M9.503 4.755c.58.692 1.315 2.511 1.86 4.016a.916.916 0 0 1-1.33 1.117c-1.39-.8-3.06-1.84-3.64-2.528-1.06-1.264-1.229-2.868-.364-3.59.855-.721 2.415-.28 3.474.985"/><path fill="url(#jato-mime-id-107)" d="M6.623 17.79c.312-.852 1.528-2.4 2.563-3.625a.916.916 0 0 1 1.63.596c.003 1.601-.065 3.566-.371 4.413-.568 1.553-1.881 2.503-2.94 2.122-1.051-.39-1.441-1.953-.882-3.506"/><path fill="url(#jato-mime-id-108)" d="M19.386 13.763c-.89.158-2.84-.117-4.42-.397a.915.915 0 0 1-.3-1.711c1.39-.802 3.126-1.723 4.017-1.881 1.627-.289 3.102.374 3.296 1.477.195 1.103-.966 2.224-2.593 2.512"/><path fill="url(#jato-mime-id-109)" d="M5.324 7.98c.891.158 2.628 1.079 4.017 1.88a.915.915 0 0 1-.3 1.711c-1.58.281-3.529.556-4.42.398-1.627-.289-2.788-1.41-2.601-2.513.203-1.103 1.677-1.765 3.304-1.476"/><path fill="url(#jato-mime-id-110)" d="M4.183 13.12c.785-.45 2.713-.859 4.295-1.135a.915.915 0 0 1 .867 1.504c-1.03 1.228-2.344 2.686-3.128 3.137-1.432.823-3.05.704-3.61-.264-.56-.967.144-2.418 1.576-3.242"/><path fill="url(#jato-mime-id-111)" d="M18.686 8.543c-.581.694-2.258 1.736-3.653 2.535a.915.915 0 0 1-1.328-1.118c.546-1.506 1.282-3.33 1.863-4.023 1.06-1.264 2.618-1.706 3.483-.984.864.713.703 2.325-.365 3.59"/><defs><linearGradient id="jato-mime-id-103" x1="10.139" x2="17.555" y1="2.032" y2="4.305" gradientUnits="userSpaceOnUse"><stop stop-color="#f52c1e" stop-opacity="1"/><stop offset="1" stop-color="#ce24a9" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-104" x1="11.771" x2="16.909" y1="13.995" y2="16.639" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-105" x1="12.218" x2="17.447" y1="13.515" y2="20.838" gradientUnits="userSpaceOnUse"><stop stop-color="#46a800" stop-opacity="1"/><stop offset="1" stop-color="#008273" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-106" x1="4.524" x2="14.074" y1="3.449" y2="9.425" gradientUnits="userSpaceOnUse"><stop stop-color="#f52c1e" stop-opacity="1"/><stop offset="1" stop-color="#ce24a9" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-107" x1="5.733" x2="13.622" y1="12.397" y2="15.184" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-108" x1="11.265" x2="16.351" y1="9.72" y2="18.052" gradientUnits="userSpaceOnUse"><stop stop-color="#eeb111" stop-opacity="1"/><stop offset="1" stop-color="#08a61a" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-109" x1=".657" x2="5.741" y1="7.926" y2="16.261" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-110" x1="5.814" x2="1.51" y1="11.618" y2="14.769" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#2470ff" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-111" x1="12.138" x2="20.513" y1="5.265" y2="10.036" gradientUnits="userSpaceOnUse"><stop stop-color="#e17109" stop-opacity="1"/><stop offset="1" stop-color="#eeb111" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeBlog': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-164)" d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14.002a2 2 0 0 1-2 2h-2v1.98c0 .93-1.158 1.356-1.761.648L12 20.002H6a2 2 0 0 1-2-2z"/><rect width="6" height="5" x="7" y="5" fill="#fff" rx="1" fill-opacity="1"/><rect width="10" height="1" x="7" y="12" fill="#fff" rx=".5" fill-opacity="1"/><rect width="7" height="1" x="7" y="15" fill="#fff" rx=".5" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-164" x1="1.714" x2="27.155" y1="2.076" y2="14.91" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeBlogEntry': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-202)" d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14.002a2 2 0 0 1-2 2h-2v1.98c0 .93-1.158 1.356-1.761.648L12 20.002H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M16.552 8.925a1.85 1.85 0 0 0-2.617-2.617l-.96.96 2.617 2.617zm-1.667 1.667-2.617-2.617-3.813 3.813-1.037 3.404a.2.2 0 0 0 .25.25l3.404-1.037z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-202" x1="1.714" x2="27.155" y1="2.076" y2="14.91" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCategory': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-167)" fill-rule="evenodd" d="M8.201 7.507a1.5 1.5 0 0 1 0-2.122l2.739-2.739a1.5 1.5 0 0 1 2.121 0l2.74 2.74a1.5 1.5 0 0 1 0 2.12l-2.74 2.74a1.5 1.5 0 0 1-2.121 0zm-.694.694a1.5 1.5 0 0 0-2.122 0L2.646 10.94a1.5 1.5 0 0 0 0 2.121l2.74 2.739a1.5 1.5 0 0 0 2.12 0l2.74-2.739a1.5 1.5 0 0 0 0-2.121zm5.554 5.554a1.5 1.5 0 0 0-2.121 0l-2.739 2.74a1.5 1.5 0 0 0 0 2.12l2.739 2.74a1.5 1.5 0 0 0 2.121 0l2.74-2.74a1.5 1.5 0 0 0 0-2.12zm5.555-5.554a1.5 1.5 0 0 0-2.122 0l-2.739 2.739a1.5 1.5 0 0 0 0 2.121l2.74 2.739a1.5 1.5 0 0 0 2.12 0l2.74-2.739a1.5 1.5 0 0 0 0-2.121z" clip-rule="evenodd"/><defs><linearGradient id="jato-mime-id-167" x1="5.005" x2="18.73" y1="4.383" y2="18.656" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCategoryFolder': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-162)" d="M2 5.5A1.5 1.5 0 0 1 3.5 4h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12a1.5 1.5 0 0 0 1.06.44H20.5A1.5 1.5 0 0 1 22 7.5v11a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5z"/><rect width="3.157" height="3.157" x="6.792" y="13" fill="#fff" rx=".5" transform="rotate(-45 6.792 13)" fill-opacity="1"/><rect width="3.157" height="3.157" x="9.768" y="15.977" fill="#fff" rx=".5" transform="rotate(-45 9.768 15.977)" fill-opacity="1"/><rect width="3.157" height="3.157" x="9.768" y="10.024" fill="#fff" rx=".5" transform="rotate(-45 9.768 10.024)" fill-opacity="1"/><rect width="3.157" height="3.157" x="12.744" y="13" fill="#fff" rx=".5" transform="rotate(-45 12.744 13)" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-162" x1="2.714" x2="18.476" y1="4.889" y2="23.057" gradientUnits="userSpaceOnUse"><stop stop-color="#46a800" stop-opacity="1"/><stop offset="1" stop-color="#008273" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCategoryNonSelectable': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="19" cy="19" r="3.5" fill="#fff" stroke="#cd3632" fill-opacity="1" stroke-opacity="1"/><path stroke="#cd3632" d="m16.5 16.5 5 5" stroke-opacity="1"/><path fill="url(#jato-mime-id-207)" fill-rule="evenodd" d="M8.201 5.385a1.5 1.5 0 0 0 0 2.122l2.739 2.739a1.5 1.5 0 0 0 2.121 0l2.74-2.74a1.5 1.5 0 0 0 0-2.12l-2.74-2.74a1.5 1.5 0 0 0-2.121 0zM5.385 8.201a1.5 1.5 0 0 1 2.122 0l2.739 2.739a1.5 1.5 0 0 1 0 2.121L7.506 15.8a1.5 1.5 0 0 1-2.12 0l-2.74-2.739a1.5 1.5 0 0 1 0-2.121zm7.676 5.554a1.5 1.5 0 0 0-2.121 0l-2.739 2.74a1.5 1.5 0 0 0 0 2.12l2.739 2.74a1.5 1.5 0 0 0 2.121 0l1.098-1.099a5.01 5.01 0 0 1 .975-4.428zm7.195.404a5 5 0 0 0-4.427.975l-2.074-2.073a1.5 1.5 0 0 1 0-2.121l2.74-2.74a1.5 1.5 0 0 1 2.12 0l2.74 2.74a1.5 1.5 0 0 1 0 2.121z" clip-rule="evenodd"/><defs><linearGradient id="jato-mime-id-207" x1="-.591" x2="25.245" y1="2.273" y2="20.763" gradientUnits="userSpaceOnUse"><stop stop-color="#ccc" stop-opacity="1"/><stop offset="1" stop-color="#757575" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeChannel': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-306)" d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><rect width="2" height="1" x="8" y="10" fill="#fff" rx=".25" fill-opacity="1"/><rect width="2" height="1" fill="#fff" rx=".25" transform="matrix(1 0 0 -1 8 13)" fill-opacity="1"/><rect width="3" height="2" x="13" y="4" fill="#fff" rx=".25" fill-opacity="1"/><rect width="2" height="1" x="11" y="10" fill="#fff" rx=".25" fill-opacity="1"/><rect width="2" height="1" x="11" y="12" fill="#fff" rx=".25" fill-opacity="1"/><rect width="2" height="1" x="14" y="10" fill="#fff" rx=".25" fill-opacity="1"/><rect width="2" height="1" x="8" y="8" fill="#fff" rx=".25" fill-opacity="1"/><rect width="2" height="1" x="11" y="8" fill="#fff" rx=".25" fill-opacity="1"/><rect width="2" height="1" x="14" y="8" fill="#fff" rx=".25" fill-opacity="1"/><rect width="2" height="1" x="14" y="12" fill="#fff" rx=".25" fill-opacity="1"/><rect width="1.604" height="1.604" x="9.594" y="16.417" fill="#fff" rx=".25" fill-opacity="1"/><rect width="1.604" height="1.604" x="11.441" y="14.594" fill="#fff" rx=".25" fill-opacity="1"/><rect width="1.604" height="1.604" x="13.287" y="16.417" fill="#fff" rx=".25" fill-opacity="1"/><rect width="1.604" height="1.604" x="11.441" y="18.24" fill="#fff" rx=".25" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-306" x1="4.286" x2="24.495" y1="2.067" y2="10.745" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeComment': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-293)" d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10.002a2 2 0 0 1-2 2h-8L8.761 20.63c-.603.708-1.761.282-1.761-.648v-1.98H5a2 2 0 0 1-2-2z"/><circle cx="8" cy="11" r="1" fill="#fff" fill-opacity="1"/><circle cx="12" cy="11" r="1" fill="#fff" fill-opacity="1"/><circle cx="16" cy="11" r="1" fill="#fff" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-293" x1=".429" x2="24.777" y1="4.063" y2="20.837" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCommunity': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="5.5" cy="4.5" r="2.5" fill="#5b7aab" fill-opacity="1"/><path fill="#5b7aab" fill-rule="evenodd" d="M8.3 7.477a5 5 0 0 0-.495-.343A3.5 3.5 0 0 1 5.5 8a3.5 3.5 0 0 1-2.305-.866A4.5 4.5 0 0 0 1 11v1.5A1.5 1.5 0 0 0 2.5 14h4.044a6.02 6.02 0 0 1 2.268-2.584A4 4 0 0 1 8 9c0-.54.107-1.053.3-1.523" clip-rule="evenodd" fill-opacity="1"/><circle cx="18.5" cy="4.5" r="2.5" fill="#5b7aab" fill-opacity="1"/><path fill="#5b7aab" fill-rule="evenodd" d="M15.188 11.416C15.697 10.746 16 9.908 16 9c0-.54-.107-1.054-.3-1.523q.235-.188.495-.343c.616.54 1.422.866 2.305.866.882 0 1.689-.327 2.304-.866A4.5 4.5 0 0 1 23 11v1.5a1.5 1.5 0 0 1-1.5 1.5h-4.044a6.02 6.02 0 0 0-2.268-2.584" clip-rule="evenodd" fill-opacity="1"/><path fill="#94a8c9" fill-rule="evenodd" d="M2.458 15a2.5 2.5 0 0 1-1.12-.286C2.545 19.477 6.861 23 12 23s9.455-3.524 10.663-8.286c-.336.176-.716.279-1.12.286-1.275 4.057-5.065 7-9.543 7s-8.268-2.943-9.542-7M15.533 2.642a3.5 3.5 0 0 1 .692-.802C14.924 1.3 13.497 1 12 1s-2.924.299-4.224.84c.268.23.502.501.69.802A10 10 0 0 1 12 2c1.244 0 2.435.227 3.533.642" clip-rule="evenodd" fill-opacity="1"/><path fill="url(#jato-mime-id-91)" fill-rule="evenodd" d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5 4.5c0-1.865 1.02-3.49 2.534-4.35.68.532 1.536.85 2.466.85s1.787-.318 2.466-.85A5 5 0 0 1 17 16.5v1a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 17.5z" clip-rule="evenodd"/><defs><linearGradient id="jato-mime-id-91" x1="5.571" x2="20.879" y1="6.044" y2="14.471" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCss': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-25)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M6 12.5A1.5 1.5 0 0 1 7.5 11h1a1.5 1.5 0 0 1 1.5 1.5H9a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5h1A1.5 1.5 0 0 1 8.5 16h-1A1.5 1.5 0 0 1 6 14.5z" clip-rule="evenodd" fill-opacity="1"/><path stroke="#fff" d="M13.5 12c0-.167-.1-.5-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1c-.167 0-.5-.1-.5-.5M17.5 12c0-.167-.1-.5-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1c-.167 0-.5-.1-.5-.5" stroke-opacity="1"/><defs><linearGradient id="jato-mime-id-25" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCustomView': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="18" y="3" fill="url(#jato-mime-id-22)" rx="4"/><rect width="4" height="4" x="10" y="10" fill="#fff" rx="1" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M9.5 8A1.5 1.5 0 0 0 8 9.5v1a.5.5 0 0 1-1 0v-1A2.5 2.5 0 0 1 9.5 7h1a.5.5 0 0 1 0 1zM9.5 16A1.5 1.5 0 0 1 8 14.5v-1a.5.5 0 0 0-1 0v1A2.5 2.5 0 0 0 9.5 17h1a.5.5 0 0 0 0-1zM14.5 8A1.5 1.5 0 0 1 16 9.5v1a.5.5 0 0 0 1 0v-1A2.5 2.5 0 0 0 14.5 7h-1a.5.5 0 0 0 0 1zM14.5 16a1.5 1.5 0 0 0 1.5-1.5v-1a.5.5 0 0 1 1 0v1a2.5 2.5 0 0 1-2.5 2.5h-1a.5.5 0 0 1 0-1z" clip-rule="evenodd" opacity=".8" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-22" x1="-3.429" x2="21.628" y1="3.06" y2="26.97" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeDocumentType': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-406)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M16 12.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0m-5.1.08a.6.6 0 0 1 1.2 0v2.796a.6.6 0 1 1-1.2 0zm.6-1.336a.801.801 0 1 0 0-1.603.801.801 0 0 0 0 1.603" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-406" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeDrawingDwg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-398)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><rect width="7" height="7" x="8.5" y="8.5" stroke="#fff" rx=".5" stroke-opacity="1"/><path stroke="#fff" stroke-linecap="round" stroke-width="1.25" d="M6.5 12h11M12 6.5v11" stroke-opacity="1"/><defs><linearGradient id="jato-mime-id-398" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeDwg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-116)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><rect width="4" height="4" x="7.5" y="5.5" stroke="#fff" rx=".5" stroke-opacity="1"/><path fill="#fff" d="M4 7h3v1H4zM9 10h1v4H9zM9 2h1v3H9zM12 7h8v1h-8zM9 7h1v1H9z" fill-opacity="1"/><path fill="url(#jato-mime-id-117)" d="M4 14h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M14.747 17.2a1.2 1.2 0 0 1 1.2-1.2h1.44a.16.16 0 0 1 .16.16v.48a.16.16 0 0 1-.16.16h-1.44a.4.4 0 0 0-.4.4v1.6c0 .22.18.4.4.4h1.2v-.8h-.4a.4.4 0 0 1 0-.8h1.2v1.6a.8.8 0 0 1-.8.8h-1.2a1.2 1.2 0 0 1-1.2-1.2z" clip-rule="evenodd" fill-opacity="1"/><path stroke="#fff" stroke-width=".8" d="M6.547 19.6v-3.2c.8-.133 2.4 0 2.4 1.6s-1.6 1.733-2.4 1.6Z" stroke-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M9.598 16h.8l.4 2 .8-2h.8l.8 2 .4-2h.8l-.8 4h-.8l-.8-2.8-.8 2.8H10.4z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-116" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-117" x1="1.714" x2="12.182" y1="14.027" y2="29.01" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#00087d" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeEmail': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-33)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M7 10.452V16a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-5.561L12 14.5zm9.74-1.125A1 1 0 0 0 16 9H8a1 1 0 0 0-.747.335L12 13z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-33" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeEmailFolder': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-166)" d="M2 6a2 2 0 0 1 2-2h3.172a2 2 0 0 1 1.414.586l1.121 1.121a1 1 0 0 0 .707.293H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M7 10.452V16a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-5.561L12 14.5zm9.74-1.125A1 1 0 0 0 16 9H8a1 1 0 0 0-.747.335L12 13z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-166" x1="-.857" x2="21.302" y1="4.054" y2="23.877" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeExcel': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-415)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" d="m12 13.85-2.223 2.801a.923.923 0 1 1-1.412-1.187L11 12.5 8.365 9.535A.923.923 0 1 1 9.777 8.35L12 11.15l2.223-2.801a.923.923 0 1 1 1.412 1.186L13 12.5l2.635 2.964a.923.923 0 1 1-1.412 1.187z" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-415" x1="4.571" x2="23.586" y1="3.111" y2="17.138" gradientUnits="userSpaceOnUse"><stop stop-color="#46a800" stop-opacity="1"/><stop offset="1" stop-color="#008273" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeFaq': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#5b7aab" d="M5 3.5A1.5 1.5 0 0 1 6.5 2H18v.592a3 3 0 0 0 .504 1.664L19 5H6.5A1.5 1.5 0 0 1 5 3.5" fill-opacity="1"/><path fill="url(#jato-mime-id-114)" fill-rule="evenodd" d="M4.063 4.497c-.011-.043-.063-.044-.063 0v16a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-12.5a2 2 0 0 0-2-2H6a2 2 0 0 1-1.937-1.5" clip-rule="evenodd"/><path fill="#fff" d="M11.163 14.963c0-.478-.079-1.005.047-1.47.157-.563.511-.975.991-1.296.354-.244.643-.496.808-.812.169-.33.174-.77-.017-1.091a1.02 1.02 0 0 0-.902-.493c-.369 0-.72.174-.931.516a1.23 1.23 0 0 0-.17.625H9.244q.021-.912.41-1.506c.534-.82 1.492-1.186 2.444-1.186 1.132 0 2.033.408 2.529 1.163q.372.566.371 1.365c0 .707-.228 1.25-.623 1.679-.357.38-.978.582-1.252 1.017-.278.443-.065 1.515-.064 1.49z" fill-opacity="1"/><circle cx="12.168" cy="17.48" r="1.14" fill="#fff" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-114" x1="1.714" x2="24.087" y1="4.523" y2="19.134" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeFaqEntry': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-204)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" d="M7.547 6.991c0-.548.444-.991.991-.991h7.015v.53c0 .302.08.599.23.86l.342.593H8.538a.99.99 0 0 1-.991-.992" opacity=".65" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M7 7.909v-.02c.021.62.53 1.115 1.153 1.115h7.537c.634 0 1.147.513 1.147 1.147v6.99a.86.86 0 0 1-.86.86H7.86a.86.86 0 0 1-.86-.86zm4.358 6.1c-.01-.218-.02-.44.04-.645.103-.34.337-.59.654-.783.234-.147.425-.3.534-.491a.65.65 0 0 0-.012-.66c-.123-.19-.341-.297-.595-.297a.73.73 0 0 0-.615.312.7.7 0 0 0-.113.377h-1.152q.015-.55.271-.91c.353-.496.986-.717 1.615-.717.747 0 1.343.247 1.67.703q.246.342.246.825c0 .427-.15.756-.412 1.015a2 2 0 0 1-.372.258c-.176.104-.353.208-.455.357-.18.261-.05.885-.043.9h-1.253q-.001-.12-.008-.244m1.426 1.766c0 .38-.338.689-.754.689s-.753-.309-.753-.69.337-.688.754-.688c.415 0 .753.308.753.689" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-204" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeFavouritesFolder': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-225)" d="M2 6a2 2 0 0 1 2-2h3.172a2 2 0 0 1 1.414.586l1.121 1.121a1 1 0 0 0 .707.293H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M11.548 9.295a.494.494 0 0 1 .904 0l.964 2.036 2.15.325c.416.063.582.605.278.914l-1.55 1.575.366 2.228c.072.435-.36.77-.73.566L12 15.882l-1.93 1.057c-.37.203-.802-.13-.73-.566l.367-2.228-1.551-1.575c-.304-.309-.139-.851.278-.914l2.15-.325z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-225" x1="-.857" x2="21.302" y1="4.054" y2="23.877" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeFavouritesGroup': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" fill="url(#jato-mime-id-99)" rx="4"/><path fill="#fff" fill-rule="evenodd" d="M11.435 7.369a.617.617 0 0 1 1.13 0l1.205 2.544 2.687.407c.521.079.728.757.348 1.142l-1.938 1.97.458 2.784c.09.544-.449.962-.913.708L12 15.602l-2.412 1.322c-.464.254-1.003-.163-.913-.708l.458-2.785-1.938-1.969c-.38-.385-.173-1.063.348-1.142l2.687-.407z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-99" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeFolderNonSelectable': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-233)" d="M2 6a2 2 0 0 1 2-2h3.172a2 2 0 0 1 1.414.586l1.121 1.121a1 1 0 0 0 .707.293H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="5" fill="#fff" fill-opacity=".65"/><circle cx="12" cy="13" r="4" fill="#fff" fill-opacity="1"/><circle cx="12" cy="13" r="3.5" stroke="#cd3632" stroke-opacity="1"/><path stroke="#cd3632" d="m9.5 10.5 5 5" stroke-opacity="1"/><defs><linearGradient id="jato-mime-id-233" x1="-.857" x2="21.302" y1="4.054" y2="23.877" gradientUnits="userSpaceOnUse"><stop stop-color="#ccc" stop-opacity="1"/><stop offset="1" stop-color="#757575" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeForm': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-175)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M8.732 7.75h6.536c.404 0 .732.327.732.73v6.54c0 .403-.328.73-.732.73H8.732A.73.73 0 0 1 8 15.02V8.48c0-.403.328-.73.732-.73m1.03 4.493 1.624 1.624 3.098-3.1a.552.552 0 0 0-.78-.78l-2.318 2.317-.843-.843a.553.553 0 0 0-.78.782" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-175" x1="6.286" x2="20.077" y1="4.222" y2="15.696" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeForum': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#94a8c9" d="M6 18h12v2.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20.5z" fill-opacity="1"/><path fill="#5b7aab" d="M4 16a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1" fill-opacity="1"/><path fill="url(#jato-mime-id-19)" fill-rule="evenodd" d="M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-2.283.45A6 6 0 0 0 6 14h12a6 6 0 0 0-3.717-5.55C13.599 8.8 12.823 9 12 9a5 5 0 0 1-2.283-.55" clip-rule="evenodd"/><defs><linearGradient id="jato-mime-id-19" x1="4.286" x2="20.115" y1="2.04" y2="13.368" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeForumTopicsReplies': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#5b7aab" d="M6 18h12v2.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20.5z" opacity=".65" fill-opacity="1"/><path fill="#5b7aab" d="M4 16a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1" fill-opacity="1"/><path fill="url(#jato-mime-id-136)" d="M7 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6l-1.142 1.904c-.522.87-1.858.5-1.858-.514V12H9a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M15 7h-4.5V6H15a2 2 0 0 1 2 2v1.5a.5.5 0 0 1-1 0V8a1 1 0 0 0-1-1" clip-rule="evenodd" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M12.854 4.146a.5.5 0 0 1 0 .708L11.207 6.5l1.647 1.646a.5.5 0 1 1-.707.708L9.793 6.5l2.354-2.354a.5.5 0 0 1 .707 0" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-136" x1="5" x2="24.31" y1="2.05" y2="14.948" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeGif': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-264)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M7 12.5A1.5 1.5 0 0 1 8.5 11h1.8c.11 0 .2.09.2.2v.6a.2.2 0 0 1-.2.2H8.5a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5H10v-1h-.5a.5.5 0 0 1 0-1H11v2a1 1 0 0 1-1 1H8.5A1.5 1.5 0 0 1 7 14.5z" clip-rule="evenodd" fill-opacity="1"/><path fill="#fff" d="M12 11.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v4.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zM14 11h1v4.75a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zM15 11h1.75a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25H15zM15 13h.75a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25H15z" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-264" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeHtml': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-216)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M7.741 15.571c.123.213.564.526 1.657.46q.449-.026.96-.14c-.312-.402-.61-.844-.885-1.32a12 12 0 0 1-.701-1.426 6 6 0 0 0-.601.761c-.604.914-.553 1.452-.43 1.665m1.286 1.468a5.02 5.02 0 0 0 3.697.99c-.541-.298-1.099-.737-1.635-1.292-.742.212-1.444.314-2.062.302m7.012-.923a5.02 5.02 0 0 0 .99-3.698c-.298.541-.737 1.099-1.291 1.636.211.741.313 1.444.301 2.062m-8.926-2.392c.299-.541.738-1.099 1.292-1.635-.212-.742-.313-1.445-.302-2.062a5.02 5.02 0 0 0-.99 3.697m2.456-4.982c-.212.124-.523.566-.458 1.656.018.297.064.62.14.96q.606-.471 1.32-.885c.476-.275.955-.508 1.427-.701a6 6 0 0 0-.762-.601c-.913-.603-1.452-.553-1.664-.43zm1.85-.63c.54.3 1.098.738 1.635 1.293.741-.212 1.444-.313 2.062-.302a5.02 5.02 0 0 0-3.698-.99m-1.08 5.96c.328.567.687 1.075 1.058 1.515a10.5 10.5 0 0 0 1.674-.784 10.5 10.5 0 0 0 1.516-1.058 10.5 10.5 0 0 0-.784-1.674 10.5 10.5 0 0 0-1.058-1.516c-.541.196-1.106.456-1.674.784s-1.075.687-1.516 1.058c.196.541.457 1.107.784 1.674m4.406-3.961q-.449.027-.96.14c.312.402.61.845.884 1.32.275.476.509.955.702 1.427q.353-.387.6-.762c.604-.914.553-1.452.43-1.665-.122-.213-.563-.526-1.656-.46m.287 5.634a6 6 0 0 0-.14-.96c-.403.312-.845.61-1.32.884a12 12 0 0 1-1.427.701q.386.355.761.601c.914.604 1.452.553 1.665.43s.526-.563.46-1.656" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-216" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeImage': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-128)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><rect width="7" height="7" x="7" y="7" fill="#fff" rx="1" fill-opacity="1"/><circle cx="13.5" cy="14.5" r="3.5" fill="#fff" opacity=".6" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-128" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#f52c1e" stop-opacity="1"/><stop offset="1" stop-color="#ce24a9" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeJpeg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-395)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" d="M7 8h2v2H7zM7 12h2v2H7zM7 16h2v2H7zM9 10h2v2H9zM9 14h2v2H9zM13 10h2v2h-2zM13 14h2v2h-2zM11 8h2v2h-2zM11 12h2v2h-2zM11 16h2v2h-2zM15 8h2v2h-2zM15 12h2v2h-2zM15 16h2v2h-2z" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-395" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimePdf': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-362)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><g clip-path="url(#jato-mime-id-363)"><path fill="#fff" d="M7.216 19c.838 0 1.672-.844 2.86-2.898 1.209-.398 2.534-.895 3.7-1.087 1.015.553 2.205.914 2.996.914 1.367 0 1.46-1.5.922-2.035-.65-.637-2.542-.455-3.446-.337-.936-.572-1.559-1.36-1.999-2.523.21-.867.543-2.185.29-3.01-.22-1.378-1.985-1.242-2.237-.319-.234.858-.02 2.068.379 3.61-.543 1.295-1.344 3.03-1.91 4.023-.005 0-.005.005-.01.005-1.268.652-3.446 2.086-2.551 3.188.262.324.749.469 1.006.469m9.977-4.107s-.267.319-2.004-.422c1.887-.136 2.196.295 2.004.422m-5.758-7.085c.393 0 .355 1.73.093 2.2-.234-.75-.23-2.2-.093-2.2m.014 4.412c.45.816 1.02 1.463 1.615 1.913-1.12.22-2.088.699-2.945 1.027.52-.91.97-1.993 1.33-2.94m-2.772 3.967c-1.016 1.631-1.634 1.922-1.634 1.885.272-.736 1.32-1.59 1.634-1.885" fill-opacity="1"/></g><defs><linearGradient id="jato-mime-id-362" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#f52c1e" stop-opacity="1"/><stop offset="1" stop-color="#ce24a9" stop-opacity="1"/></linearGradient><clipPath id="jato-mime-id-363"><path fill="#fff" d="M0 0h12v12H0z" transform="translate(6 7)" fill-opacity="1"/></clipPath></defs></svg>`,
'mimePerspective': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-134)" fill-rule="evenodd" d="M3 5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zm0 8a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1zm13 1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm-6-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z" clip-rule="evenodd"/><defs><linearGradient id="jato-mime-id-134" x1="4.857" x2="13.953" y1="6.556" y2="20.068" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimePng': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-226)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M8 8a1 1 0 0 0-1 1v4.778l1.248-1.27a1.5 1.5 0 0 1 2.299.19l1.622 2.318 1.19-1.427a1.5 1.5 0 0 1 2.29-.016L17 15.148V9a1 1 0 0 0-1-1zm-1 9v-1.796l1.961-1.996a.5.5 0 0 1 .766.064L13.04 18H8a1 1 0 0 1-1-1m9 1h-1.74l-1.496-2.136 1.363-1.635a.5.5 0 0 1 .763-.005L17 16.685V17a1 1 0 0 1-1 1m-1-7a1 1 0 1 0 0-2 1 1 0 0 0 0 2" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-226" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimePoll': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-268)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><rect width="6.187" height="1" x="7.708" y="6.082" fill="var(--jato-color-white-10000, #ffff)" rx=".5" transform="rotate(45 7.708 6.082)" fill-opacity="1"/><rect width="6.187" height="1" x="12.082" y="6.707" fill="var(--jato-color-white-10000, #ffff)" rx=".5" transform="rotate(135 12.082 6.707)" fill-opacity="1"/><rect width="4" height="4" x="7.5" y="13.5" stroke="var(--jato-color-white-10000, #ffff)" opacity=".6" rx=".5" stroke-opacity="1"/><rect width="4" height="1" x="13" y="8" fill="var(--jato-color-white-10000, #ffff)" rx=".5" fill-opacity="1"/><rect width="4" height="1" x="13" y="15" fill="var(--jato-color-white-10000, #ffff)" opacity=".6" rx=".5" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-268" x1="4.571" x2="23.586" y1="3.111" y2="17.138" gradientUnits="userSpaceOnUse"><stop stop-color="#46a800" stop-opacity="1"/><stop offset="1" stop-color="#008273" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimePowerpoint': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-121)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M8.75 7.75h3.75a2.75 2.75 0 1 1 0 5.5h-2.25V17h-1.5zm1.5 4h2.25a1.25 1.25 0 1 0 0-2.5h-2.25z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-121" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#f16e00" stop-opacity="1"/><stop offset="1" stop-color="#dc198e" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimePresentation': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-182)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" d="M8 10h8v4a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" fill-opacity="1"/><rect width="10" height="1" x="7" y="8" fill="#fff" rx=".5" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M12 7a.5.5 0 0 1 .5.5v1h-1v-1A.5.5 0 0 1 12 7M15.447 16.776 15 16h-1.184l.737 1.224a.5.5 0 1 0 .894-.448M8.55 16.776 8.999 16h1.184l-.737 1.224a.5.5 0 1 1-.894-.448" clip-rule="evenodd" opacity=".8" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-182" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeRecycleBin': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-173)" d="M6 7h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path fill="url(#jato-mime-id-174)" fill-rule="evenodd" d="M10 5V4h4v1zM9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1h4.5a.5.5 0 0 1 0 1h-15a.5.5 0 0 1 0-1z" clip-rule="evenodd"/><defs><linearGradient id="jato-mime-id-173" x1="4.286" x2="21.677" y1="7.047" y2="17.715" gradientUnits="userSpaceOnUse"><stop stop-color="#848f97" stop-opacity="1"/><stop offset="1" stop-color="#525b7b" stop-opacity="1"/></linearGradient><linearGradient id="jato-mime-id-174" x1="1.714" x2="3.764" y1="3.01" y2="10.834" gradientUnits="userSpaceOnUse"><stop stop-color="#848f97" stop-opacity="1"/><stop offset="1" stop-color="#525b7b" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeShortcut': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="url(#jato-mime-id-133)"/><path fill="#fff" d="M7.875 16.5a.625.625 0 1 0 1.25 0zm1.25 0v-3h-1.25v3zm2.375-5.375H16v-1.25h-4.5zM9.125 13.5a2.375 2.375 0 0 1 2.375-2.375v-1.25A3.625 3.625 0 0 0 7.875 13.5z" fill-opacity="1"/><path stroke="#fff" stroke-linecap="round" stroke-width="1.25" d="m14 8 2.5 2.5L14 13" stroke-opacity="1"/><defs><linearGradient id="jato-mime-id-133" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeSvg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-5)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M6 12a1 1 0 0 1 1-1h1.8c.11 0 .2.09.2.2v.6a.2.2 0 0 1-.2.2H7v1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H6.2a.2.2 0 0 1-.2-.2v-.6c0-.11.09-.2.2-.2H8v-1H7a1 1 0 0 1-1-1zM14 12.5a1.5 1.5 0 0 1 1.5-1.5h1.8c.11 0 .2.09.2.2v.6a.2.2 0 0 1-.2.2h-1.8a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5H17v-1h-.5a.5.5 0 0 1 0-1H18v2a1 1 0 0 1-1 1h-1.5a1.5 1.5 0 0 1-1.5-1.5zM10.8 11c.11 0 .2.09.2.2v3.093l.5.5.5-.5V11.2c0-.11.09-.2.2-.2h.6c.11 0 .2.09.2.2v3.507l-1.5 1.5-1.5-1.5V11.2c0-.11.09-.2.2-.2z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-5" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#f52c1e" stop-opacity="1"/><stop offset="1" stop-color="#ce24a9" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeSxd': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="18" cy="18" r="5" fill="#5b7aab" fill-opacity="1"/><path fill="url(#jato-mime-id-102)" fill-rule="evenodd" d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7.528A6 6 0 0 1 20 12.341V6.593a2 2 0 0 0-.604-1.432l-2.66-2.593A2 2 0 0 0 15.34 2z" clip-rule="evenodd"/><path fill="#fff" fill-rule="evenodd" d="M10.174 6.883a.25.25 0 0 0 0 .354l1.768 1.768a.25.25 0 0 0 .353 0l1.06-1.061a.25.25 0 0 0 0-.354l-1.517-1.517a.25.25 0 0 0-.177-.074h-.5a.25.25 0 0 0-.177.074zm4.073.118a.25.25 0 0 0-.25.25v2.5c0 .138.112.25.25.25h1.5a.25.25 0 0 0 .25-.25V7.604a.25.25 0 0 0-.073-.177l-.354-.353A.25.25 0 0 0 15.393 7zm-7 3a.25.25 0 0 1-.25-.25V8.604a.25.25 0 0 1 .073-.177l.354-.353A.25.25 0 0 1 7.6 8h2.146a.25.25 0 0 1 .25.25v1.5a.25.25 0 0 1-.25.25zm2.75 6.75a.25.25 0 0 1-.25.25H8.601a.25.25 0 0 1-.177-.074l-.354-.353a.25.25 0 0 1-.073-.177v-2.146a.25.25 0 0 1 .25-.25h1.5a.25.25 0 0 1 .25.25zm-3.123-2.927a.25.25 0 0 0 .354 0l1.767-1.768a.25.25 0 0 0 0-.353l-1.06-1.061a.25.25 0 0 0-.354 0L6.063 12.16a.25.25 0 0 0-.073.176v.5c0 .067.027.13.073.177zm9.893-3.647a.25.25 0 0 1 .354 0l.81.811a.25.25 0 0 1 .074.177v.5a.25.25 0 0 1-.073.177l-.163.162a6 6 0 0 0-2.441.623L15 12.299a.25.25 0 0 1 0-.354zm-4.218 5.311a6 6 0 0 0-.545 2.284l-1.366-1.366a.25.25 0 0 1 0-.354l1.06-1.06a.25.25 0 0 1 .354 0z" clip-rule="evenodd" fill-opacity="1"/><path fill="#fff" d="M20 15.5h-4a1 1 0 0 0-1 1V19a1 1 0 0 0 1 1v.896c0 .223.27.335.427.177L17.5 20H20a1 1 0 0 0 1-1v-2.5a1 1 0 0 0-1-1" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-102" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeTaskList': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#5b7aab" d="M9 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9z" fill-opacity="1"/><path fill="url(#jato-mime-id-146)" fill-rule="evenodd" d="M6 4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2v3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" clip-rule="evenodd"/><path fill="#94a8c9" d="M7 4h10v2.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z" fill-opacity="1"/><path stroke="#fff" stroke-linecap="round" d="m7 15 1 1 2-2" opacity=".85" stroke-opacity="1"/><path stroke="#fff" stroke-linecap="round" d="m7 11.5 1 1 2-2" stroke-opacity="1"/><path stroke="#fff" stroke-linecap="round" d="m7 18.5 1 1 2-2" opacity=".65" stroke-opacity="1"/><path fill="#fff" d="M12 12.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5" fill-opacity="1"/><path fill="#fff" d="M12 15.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5" opacity=".85" fill-opacity="1"/><path fill="#fff" d="M12 18.5a.5.5 0 0 1 .5-.5H16a.5.5 0 0 1 0 1h-3.5a.5.5 0 0 1-.5-.5" opacity=".65" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-146" x1="1.714" x2="24.435" y1="4.06" y2="18.514" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeTopic': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-261)" d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10.002a2 2 0 0 1-2 2h-8L8.761 20.63c-.603.708-1.761.282-1.761-.648v-1.98H5a2 2 0 0 1-2-2z"/><path fill="#fff" d="M11.817 6.41a.2.2 0 0 1 .366 0l1.151 2.583a.2.2 0 0 0 .162.118l2.813.297a.2.2 0 0 1 .113.347l-2.101 1.894a.2.2 0 0 0-.062.19l.587 2.767a.2.2 0 0 1-.296.215l-2.45-1.413a.2.2 0 0 0-.2 0L9.45 14.82a.2.2 0 0 1-.296-.215l.587-2.767a.2.2 0 0 0-.062-.19L7.578 9.755a.2.2 0 0 1 .113-.347l2.813-.297a.2.2 0 0 0 .162-.118z" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-261" x1=".429" x2="24.777" y1="4.063" y2="20.837" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeUrl': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="url(#jato-mime-id-45)"/><path fill="#fff" d="m6.32 15.292-.006-.01-.005-.01c-.157-.285-.214-.99.57-2.175.216-.327.48-.664.79-1.001.252.62.56 1.249.92 1.874.36.624.751 1.204 1.162 1.733q-.672.149-1.262.184c-1.418.085-2-.316-2.169-.595M9.726 13.313a14 14 0 0 1-1.03-2.199 14 14 0 0 1 1.99-1.388c.746-.43 1.488-.772 2.2-1.03.486.579.958 1.246 1.388 1.991s.772 1.487 1.03 2.198a14 14 0 0 1-1.991 1.39c-.745.43-1.487.771-2.198 1.028a14 14 0 0 1-1.389-1.99M10.03 8.589a15 15 0 0 1 1.874-.921 8 8 0 0 0-1-.79c-1.2-.791-1.907-.725-2.186-.563-.28.16-.69.74-.604 2.175.023.39.084.814.183 1.26A15 15 0 0 1 10.03 8.59M15.51 8.113c-.391.024-.814.084-1.26.184.41.529.801 1.11 1.161 1.734s.668 1.252.921 1.872q.464-.507.789-1c.783-1.186.727-1.89.57-2.176l-.006-.01-.006-.009c-.168-.279-.75-.68-2.17-.595M11.902 5.435a6.6 6.6 0 0 1 4.095 1.355c-.811-.015-1.733.118-2.707.396-.704-.728-1.437-1.304-2.147-1.696q.38-.05.759-.055M18.51 11.143c-.392.71-.969 1.442-1.696 2.146.278.974.411 1.896.396 2.708a6.6 6.6 0 0 0 1.3-4.854M15.301 17.674c.279-.175.67-.76.586-2.164a8 8 0 0 0-.183-1.26c-.53.41-1.11.8-1.735 1.161-.624.36-1.253.668-1.872.92.337.31.673.574 1 .79 1.174.775 1.876.728 2.167.575l.018-.01zM12.857 18.51c-.71-.392-1.442-.969-2.147-1.697-.974.279-1.896.412-2.708.397a6.6 6.6 0 0 0 4.855 1.3M7.186 10.71c-.278-.974-.41-1.897-.395-2.708a6.59 6.59 0 0 0-1.302 4.855c.393-.71.97-1.443 1.697-2.147" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-45" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeVirtualFolder': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-17)" d="M2 6a2 2 0 0 1 2-2h3.172a2 2 0 0 1 1.414.586l1.121 1.121a1 1 0 0 0 .707.293H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><rect width="10" height="6" x="7" y="9" fill="#fff" rx="1" fill-opacity="1"/><rect width="4" height="1" x="10" y="16" fill="#fff" rx=".5" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-17" x1="-.857" x2="21.302" y1="4.054" y2="23.877" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeWebReports': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><g clip-path="url(#jato-mime-id-292)"><path fill="url(#jato-mime-id-291)" fill-rule="evenodd" d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7.528A6 6 0 0 1 20 12.341V6.593a2 2 0 0 0-.604-1.432l-2.66-2.593A2 2 0 0 0 15.34 2z" clip-rule="evenodd"/><path fill="#fff" d="m10.042 12.232-1.528-1.528a1.055 1.055 0 0 0-1.492 1.492l3.043 3.042 5.966-5.966a1.071 1.071 0 0 0-1.514-1.515z" fill-opacity="1"/><circle cx="18" cy="18" r="5" fill="#5b7aab" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="m19.09 22-.002.001h-.002c-.14.037-.543-.003-1.135-.67-.394-.445-.778-1.077-1.085-1.846q.656-.123 1.458-.337.8-.216 1.43-.436c.119.818.102 1.558-.017 2.14-.178.873-.507 1.11-.647 1.149m-2.55-3.5.026.093c.445-.082.95-.194 1.516-.346a20 20 0 0 0 1.486-.458l-.025-.094c-.326-1.217-.858-2.208-1.41-2.832-.595-.67-.999-.707-1.137-.67-.139.037-.47.271-.65 1.149-.167.816-.132 1.94.194 3.158m4.07 2.719c.194-.786.214-1.779.035-2.845q.545-.23.921-.428.294-.154.495-.279a4.05 4.05 0 0 1-1.45 3.552m1.163-4.476.061-.043a4.05 4.05 0 0 0-3.128-2.59c.717.748 1.359 1.931 1.736 3.337q.407-.177.693-.328c.302-.157.51-.288.638-.376m-6.899 2.054q.324-.014.763-.063c-.375-1.406-.411-2.752-.164-3.758a4.04 4.04 0 0 0-1.415 3.807l.076.007c.155.012.4.021.74.007m.04.931q-.331.014-.568.006a4.05 4.05 0 0 0 3.032 2.351c-.56-.584-1.074-1.434-1.452-2.447-.392.051-.728.078-1.012.09" clip-rule="evenodd" fill-opacity="1"/></g><defs><linearGradient id="jato-mime-id-291" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient><clipPath id="jato-mime-id-292"><path fill="#fff" d="M0 0h24v24H0z" fill-opacity="1"/></clipPath></defs></svg>`,
'mimeWiki': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" fill="url(#jato-mime-id-24)" rx="4"/><path fill="#fff" d="M6 13h2v1H6zM6 17h4v1H6z" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="m14.49 11.136-3.755 3.754-.495 1.79a.25.25 0 0 0 .308.308l1.79-.495 3.754-3.754zm2.31.896.488-.489a1 1 0 0 0 0-1.414l-.189-.189a1 1 0 0 0-1.414 0l-.489.489zM12.34 7.106l-3.754 3.753-.495 1.79a.25.25 0 0 0 .307.308l1.79-.495 3.755-3.754zM14.65 8l.489-.489a1 1 0 0 0 0-1.414l-.19-.188a1 1 0 0 0-1.413 0l-.489.488z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-24" x1="2.714" x2="22.551" y1="3.111" y2="21.403" gradientUnits="userSpaceOnUse"><stop stop-color="#46a800" stop-opacity="1"/><stop offset="1" stop-color="#008273" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeWikiPage': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-272)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" d="M6 14h2v1H6zM6 18h4v1H6z" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="m14.49 12.136-3.755 3.754-.495 1.79a.25.25 0 0 0 .308.308l1.79-.495 3.754-3.754zm2.31.896.488-.489a1 1 0 0 0 0-1.414l-.189-.189a1 1 0 0 0-1.414 0l-.489.489zM12.34 8.106l-3.754 3.753-.495 1.79a.25.25 0 0 0 .307.308l1.79-.495 3.755-3.754zM14.65 9l.489-.489a1 1 0 0 0 0-1.414l-.19-.188a1 1 0 0 0-1.413 0l-.489.488z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-272" x1="6.286" x2="20.077" y1="4.222" y2="15.696" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeZip': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-200)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" d="M10 2h2v2h-2zM12 4h2v2h-2zM10 6h2v2h-2zM12 8h2v2h-2zM10 10h2v2h-2z" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M14 13h-4v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm-1 2h-2v2h2z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-200" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeCsProject': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-125)" fill-rule="evenodd" d="M12.476 3.254a2 2 0 0 0-1.952 0l-6.5 3.632q-.228.13-.413.307l7.889 4.516 7.973-4.43a2 2 0 0 0-.497-.393zm7.471 4.922L12 12.709v8.645q.247-.064.476-.19l6.5-3.633A2 2 0 0 0 20 15.786V8.632a2 2 0 0 0-.053-.456M11 21.354V12.71L3.086 8.053Q3 8.333 3 8.633v7.152a2 2 0 0 0 1.024 1.746l6.5 3.633a2 2 0 0 0 .476.19" clip-rule="evenodd"/><defs><linearGradient id="jato-mime-id-125" x1=".571" x2="24.13" y1="3.061" y2="18.677" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimePaper': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-421)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path stroke="#fff" d="M8 9.5h3" stroke-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M8.286 6.713A1 1 0 0 1 9.244 6h.271a1 1 0 0 1 .942.665L12 11h-1L9.5 7h-.28L8 11H7z" clip-rule="evenodd" fill-opacity="1"/><rect width="10" height="1" x="7" y="13" fill="#fff" rx=".5" fill-opacity="1"/><rect width="6" height="1" x="7" y="16" fill="#fff" rx=".5" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-421" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeSearchSaved': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-149)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M13.8 11a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0m-.428 3.22a4 4 0 1 1 .849-.849l2.703 2.705a.6.6 0 0 1-.848.848z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-149" x1="6.286" x2="20.077" y1="4.222" y2="15.696" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeGeneration': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="url(#jato-mime-id-183)"/><path fill="#fff" fill-rule="evenodd" d="M13 6a1 1 0 0 1-.465.845L12.583 8h.917a.5.5 0 0 1 0 1h-.875l.247 5.937a6 6 0 0 0 4.035-2.483L16 12l1.9-1.9.017-.1.012.071L18 10v1a6 6 0 0 1-5.045 5.924L13 18l-1 1-1-1 .045-1.076A6 6 0 0 1 6 11v-1l.071.071.012-.071.018.1L8 12l-.907.454a6 6 0 0 0 4.035 2.483L11.375 9H10.5a.5.5 0 0 1 0-1h.917l.048-1.155A1 1 0 1 1 13 6" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-183" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#7a5af8" stop-opacity="1"/><stop offset="1" stop-color="#0c5ffa" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeLiveReport': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-6)" d="M2 2a1 1 0 0 1 1-1h16a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H3a1 1 0 0 1-1-1z"/><rect width="2" height="5" x="9" y="10" fill="#fff" rx=".5" fill-opacity="1"/><rect width="2" height="7" x="15" y="8" fill="#fff" rx=".5" fill-opacity="1"/><rect width="2" height="9" x="12" y="6" fill="#fff" rx=".5" fill-opacity="1"/><rect width="8" height="1" x="9" y="16" fill="#fff" rx=".5" fill-opacity="1"/><path fill="#000" d="M2 2a1 1 0 0 1 1-1h2v22H3a1 1 0 0 1-1-1z" opacity=".2" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-6" x1="-.857" x2="27.172" y1="1.074" y2="19.31" gradientUnits="userSpaceOnUse"><stop stop-color="#bf72f2" stop-opacity="1"/><stop offset="1" stop-color="#8755eb" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeMilestone': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#5b7aab" fill-rule="evenodd" d="M20 4V2l-1.447.724a1 1 0 0 0-.553.894v1.534l-5.075 5.075a2 2 0 1 0 .848.849L18.85 6h1.533a1 1 0 0 0 .894-.553L22 4z" clip-rule="evenodd" fill-opacity="1"/><path fill="url(#jato-mime-id-193)" fill-rule="evenodd" d="M20.416 7.017h-1.203l-.552.551a8 8 0 1 1-2.1-2.142l.473-.473V3.635q0-.136.018-.267A9.95 9.95 0 0 0 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10c0-1.82-.487-3.528-1.337-4.999q-.122.015-.247.016M12 6c1.14 0 2.207.318 3.116.871L13.637 8.35a4 4 0 1 0 2.078 2.165l1.494-1.494A6 6 0 1 1 12 6" clip-rule="evenodd"/><defs><linearGradient id="jato-mime-id-193" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#f52c1e" stop-opacity="1"/><stop offset="1" stop-color="#ce24a9" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeProspector': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="url(#jato-mime-id-181)"/><path fill="#fff" fill-rule="evenodd" d="M15.252 7.476c-.731-.72-1.513-1.415-2.12-1.415l-.354.353.098.059c.5.297 1.07.636 1.748 1.63l-.785.786.353.354-6.717 6.717a.5.5 0 0 0 .707.707l6.717-6.717.354.353.785-.785c.995.678 1.334 1.247 1.631 1.748l.059.098.353-.354c0-.596-.754-1.444-1.415-2.12h.001l-.353-.354.353-.354a.5.5 0 0 0-.707-.707l-.353.353-.354-.353" clip-rule="evenodd" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M8.89 7.476c.732-.72 1.513-1.415 2.12-1.415l.354.353-.098.059c-.5.297-1.07.636-1.747 1.63l.785.786-.354.354 6.718 6.717a.5.5 0 0 1-.707.707L9.243 9.95l-.353.353-.786-.785c-.995.678-1.333 1.247-1.63 1.748l-.06.098-.353-.354c0-.596.755-1.444 1.416-2.12h-.002l.354-.354-.354-.354a.5.5 0 1 1 .707-.707l.354.353.354-.353" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-181" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeRules': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-253)" d="M2 4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/><path fill="var(--jato-color-charcoal-0645, #47484aff)" d="M3 5.5a.5.5 0 0 1 .5-.5h17a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5h-17a.5.5 0 0 1-.5-.5z" fill-opacity="1"/><path fill="var(--jato-color-charcoal-7365, #dedfe0ff)" d="M13 18h8v1.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5zM3 18h8v1.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5z" fill-opacity="1"/><path fill="var(--jato-color-white-10000, #ffff)" fill-rule="evenodd" d="M3.5 4a.5.5 0 0 0-.5.5V18h6.172a2 2 0 0 1 1.414.586L11 19V6a2 2 0 0 0-2-2zM15 4a2 2 0 0 0-2 2v13l.414-.414A2 2 0 0 1 14.828 18H21V4.5a.5.5 0 0 0-.5-.5z" clip-rule="evenodd" fill-opacity="1"/><path stroke="var(--jato-color-firebrick-1440, #d41200ff)" stroke-linecap="round" d="m4.5 9.5 4 4M8.5 9.5l-4 4" stroke-opacity="1"/><path stroke="var(--jato-color-hunter-1635, #008244ff)" stroke-linecap="round" d="M15 11.69 16.31 13l3-3" stroke-opacity="1"/><defs><linearGradient id="jato-mime-id-253" x1="-.857" x2="23.583" y1="3.06" y2="22.494" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeWorkflowAssignment': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" fill="url(#jato-mime-id-239)" rx="4"/><rect width="4" height="4" x="5" y="10" fill="#fff" rx="1" fill-opacity="1"/><rect width="4" height="4" x="14" y="15" fill="#fff" rx="1" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M11 7H8.5A1.5 1.5 0 0 0 7 8.5V9h1v-.5a.5.5 0 0 1 .5-.5H11zm-3 8H7v.5A1.5 1.5 0 0 0 8.5 17H13v-1H8.5a.5.5 0 0 1-.5-.5z" clip-rule="evenodd" opacity=".65" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M13 5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zm4.854 2.854a.5.5 0 0 0-.708-.708L15 9.293l-.646-.647a.5.5 0 0 0-.708.708l1 1 .354.353.354-.353z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-239" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#974fe6" stop-opacity="1"/><stop offset="1" stop-color="#4951fc" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeWorkflowMap': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" fill="url(#jato-mime-id-13)" rx="4"/><rect width="4" height="4" x="14" y="5" fill="#fff" rx="1" fill-opacity="1"/><rect width="4" height="4" x="14" y="15" fill="#fff" rx="1" fill-opacity="1"/><g fill="#fff" opacity=".65"><path d="M8.5 7H13v1H8.845a2 2 0 0 0-1.461-.502A1.5 1.5 0 0 1 8.5 7M7.384 16.503c.275.305.673.497 1.116.497H13v-1H8.845a2 2 0 0 1-1.46.503" fill="#fff" fill-opacity="1"/></g><rect width="5.545" height="5.545" x="7.515" y="8.079" fill="#fff" rx="1" transform="rotate(45 7.515 8.08)" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-13" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeWorkflowStatus': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" fill="url(#jato-mime-id-210)" rx="4"/><rect width="4" height="4" x="14" y="5" fill="#fff" rx="1" fill-opacity="1"/><rect width="4" height="4" x="5" y="10" fill="#fff" rx="1" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M8.5 7H13v1H8.5a.5.5 0 0 0-.5.5V9H7v-.5A1.5 1.5 0 0 1 8.5 7M7 15h1v.5a.5.5 0 0 0 .5.5H9v1h-.5A1.5 1.5 0 0 1 7 15.5zm3 2h1v-1h-1z" clip-rule="evenodd" opacity=".65" fill-opacity="1"/><path fill="#fff" fill-rule="evenodd" d="M12 13a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1zm2.929.345a.571.571 0 0 1 1.142 0v2.357a.571.571 0 0 1-1.142 0zM15.5 17a.578.578 0 1 0 0 1.156.578.578 0 0 0 0-1.156" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-210" x1="-.857" x2="25.524" y1="2.067" y2="20.947" gradientUnits="userSpaceOnUse"><stop stop-color="#f16e00" stop-opacity="1"/><stop offset="1" stop-color="#dc198e" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeConversation': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-212)" d="M2 4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6.002a2 2 0 0 1-2 2H8l-1.618 2.533C5.98 15.166 5 14.88 5 14.13v-2.13H4a2 2 0 0 1-2-2z"/><path fill="#5b7aab" fill-rule="evenodd" d="M9 13.002h4a3 3 0 0 0 3-3V9h4a2 2 0 0 1 2 2v6.002a2 2 0 0 1-2 2h-1v2.129c0 .75-.979 1.035-1.382.404L16 19.002h-5a2 2 0 0 1-2-2z" clip-rule="evenodd" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-212" x1="3.857" x2="14.129" y1="3.633" y2="13.081" gradientUnits="userSpaceOnUse"><stop stop-color="#00a851" stop-opacity="1"/><stop offset="1" stop-color="#007eb0" stop-opacity="1"/></linearGradient></defs></svg>`,
'mimeSearchQueryForm': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="url(#jato-mime-id-378)" d="M4 4a2 2 0 0 1 2-2h9.34a2 2 0 0 1 1.396.568l2.66 2.593A2 2 0 0 1 20 6.593V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path fill="#fff" fill-rule="evenodd" d="M13.394 8.173a2.22 2.22 0 1 1-4.441 0 2.22 2.22 0 0 1 4.441 0m-.34 2.554a3.173 3.173 0 1 1 .674-.673l2.144 2.146a.476.476 0 0 1-.672.672z" clip-rule="evenodd" fill-opacity="1"/><rect width="10" height="1" x="7" y="15" fill="#fff" rx=".5" fill-opacity="1"/><rect width="10" height="1" x="7" y="15" fill="#fff" rx=".5" fill-opacity="1"/><rect width="10" height="1" x="7" y="15" fill="#fff" rx=".5" fill-opacity="1"/><rect width="10" height="1" x="7" y="18" fill="#fff" rx=".5" fill-opacity="1"/><rect width="10" height="1" x="7" y="18" fill="#fff" rx=".5" fill-opacity="1"/><rect width="10" height="1" x="7" y="18" fill="#fff" rx=".5" fill-opacity="1"/><defs><linearGradient id="jato-mime-id-378" x1="1.714" x2="25.75" y1="2.067" y2="15.829" gradientUnits="userSpaceOnUse"><stop stop-color="#0098d9" stop-opacity="1"/><stop offset="1" stop-color="#666cff" stop-opacity="1"/></linearGradient></defs></svg>`,
};
return icons;
});


csui.define('csui/models/server.adaptors/favorite2groups.mixin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url',
  'i18n!csui/models/impl/nls/lang', 'csui/themes/csui.jato.mime.icons'
], function ($, _, Url, lang, jatoIcons) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        sync: function (method, model, options) {
          if (method !== 'read') {
            throw new Error('Only fetching groups with favorites is supported.');
          }
          var groups = this.connector.makeAjaxCall({url: this.url()})
            .then(function (response) {
              return response;
            });

          var favoritesCollection = this.favorites;
          var favoritesFetchOptions = _.omit(options, ['success', 'error']);
          var favorites = favoritesCollection.fetch(favoritesFetchOptions)
            .then(function (response) {
              return favoritesCollection; // need full object, including columns when merging
            });

          // Groups will be parsed by _createMergedResponse,
          // favorites were parsed by Favorite2Collection.
          options.parse = false;

          return this.syncFromMultipleSources([groups, favorites], this._createMergedResponse, options);
        },

        _createMergedResponse: function (groups, favoritesCollection, options) {
          var favorites = favoritesCollection.toJSON();
          var columns = favoritesCollection.columns;
          // add "Unspecified group"
          groups.results.push({data: {name: lang.fav_ungrouped, order: -1, tab_id: -1}});
          var merged = groups.results.map(function (group) {
            group = group.data;

            var tabId = group.tab_id;
            group.favorites = favorites.filter(function (favorite) {
              return favorite.favorite_tab_id === tabId || tabId === -1 && favorite.favorite_tab_id ===
                null;
            });
            group.favorite_columns = columns.toJSON(); //
            group.jatoGroupIcon = jatoIcons.mimeFavouritesGroup;
            return group;
          });

          return merged;
        },

        parse: function (response, options) {
          return response;
        },

        url: function () {
          // this.setExpand('favorites', 'tab_id');
          var url = this.connector.getConnectionUrl().getApiBase('v2'),
            query = Url.combineQueryString(
              this.getAdditionalResourcesUrlQuery(),
              this.getResourceFieldsUrlQuery(),
              this.getExpandableResourcesUrlQuery(),
              this.getSortByOrderUrlQuery()
              // this.getRequestedCommandsUrlQuery()
            );
          url = Url.combine(url, '/members/favorites/tabs');
          return query ? url + '?' + query : url;
        }

      });
    }
  };

  return ServerAdaptorMixin;
});


csui.define('csui/models/favorite2groups',['csui/lib/jquery',
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/utils/base',
  'csui/models/mixins/syncable.from.multiple.sources/syncable.from.multiple.sources.mixin',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/favorite2group', 'csui/models/favorites2',
  'csui/models/server.adaptors/favorite2groups.mixin',
  'i18n!csui/models/impl/nls/lang'
], function ($, _, Backbone, Url, base, ConnectableMixin, FetchableMixin,
    AdditionalResourcesV2Mixin, FieldsV2Mixin, ExpandableV2Mixin,
    StateRequestorMixin, SyncableFromMultipleSources,
    Favorite2GroupModel, Favorite2Collection, ServerAdaptorMixin, lang) {
  'use strict';

  var Favorite2GroupsCollection = Backbone.Collection.extend({
    model: Favorite2GroupModel,

    constructor: function Favorite2GroupsCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      // Support collection cloning
      if (options) {
        this.options = _.pick(options, ['connector', 'autoreset',
          'includeResources', 'fields', 'expand' /*, 'commands'*/]);
      }

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeServerAdaptor(options)
          .makeStateRequestor(options);

      if (options) {
        this.favorites = options.favorites;
        this.commands = options.commands;
      }
      if (!this.favorites) {
        this.favorites = new Favorite2Collection(undefined, {
          connector: this.connector,
          autoreset: true,
          commands: this.commands
        });
      }
      this.on('sync', this._setupEventPropagation, this);
      this.on('add', this._propagateFavorite2CollectionOptions, this);
      this.on('reset', function (groups, options) {
        var self = this;
        groups.each(function (group) {
          self._propagateFavorite2CollectionOptions(group, groups, options);
        });
      }, this);
    },

    _fetch: function (options) {
      options || (options = {});
      options.originalSilent = options.silent;
      // make this fetch silent, because another fetch is done at then reset
      //  event is triggered
      options.silent = true;

      return this.originalFetch.call(this, options);
    },

    _prepareModel: function (attrs, options) {
      options || (options = {});
      options.commands = this.commands;
      // this should not be needed, but Favorite2Model uses its own server adaptor mixin, which
      // overwrites some of the URL handling...
      options.stateEnabled = this.stateEnabled;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
    },

    _setupEventPropagation: function () {
      var self = this;
      this.each(function (group) {
        group.favorites.listenTo(group.favorites, "reset update",
            function (favoritesCollection, options) {
              self.trigger('update', self, options);
            });

      }, this);
    },

    // Note: this.favorites is the collection that was used to set the resource scope and when group
    // plus the favorites are being merged, reset is triggered for all groups, which then
    // already have the favorites. Then the options get copied or cloned from the original
    // collection to each favorite collection of each group.
    // This is necessary, because if a model of those favorite collections is saved and fetched
    // again, the options from the collection are used if not set at the single model. Otherwise
    // a single favorite model would be fetched without commands, expands, etc.
    _propagateFavorite2CollectionOptions: function (group, collection, options) {
      group.favorites.setFilter(_.deepClone(this.favorites.filters), false);
      group.favorites.setOrder(this.favorites.orderBy, false);
      group.favorites.setFields(_.deepClone(this.favorites.fields));
      group.favorites.setExpand(_.deepClone(this.favorites.expand));
      if (this.favorites.commands) {
        group.favorites.setCommands(this.favorites.commands);
      }
      group.favorites.promotedActionCommands = this.favorites.promotedActionCommands;
      group.favorites.nonPromotedActionCommands = this.favorites.nonPromotedActionCommands;
      group.favorites.each(function (favorite) {
        favorite.promotedActionCommands = group.favorites.promotedActionCommands;
        favorite.nonPromotedActionCommands = group.favorites.nonPromotedActionCommands;
      });
    },

    clone: function () {
      var clone = new this.constructor(this.models, {
        // node: this.node,
        // skip: this.skipCount,
        // top: this.topCount,
        connector: this.connector,
        filter: _.deepClone(this.filters),
        orderBy: this.orderBy,
        fields: _.clone(this.fields),
        expand: _.clone(this.expand),
        commands: _.clone(this.commands),
        favorites: this.favorites.clone()
      });

      return clone;
    },

    getSortByOrderUrlQuery: function () {
      return {sort: 'order'};
    },

    // private: reset the collection
    resetCollection: function (models, options) {
      this.reset(models, options);
      this.fetched = true;
    },

    // todo: this should be a PUT to /members/favorites/tabs with the following hierarchical
    // structure (and it should be moved to the favorites2groups model):

    // var tabs = [
    //   {
    //     name: "first group",
    //     favorites: [
    //       {
    //         name: "Document for review",
    //         size: 20099790,
    //         favorite_name: "Favorite of Document for review"
    //         // more attributes follow ...
    //       },
    //       {
    //         name: "Specification",
    //         size: 98898690,
    //         favorite_name: "Pump Specification"
    //         // more attributes follow ...
    //       }
    //     ]
    //   },
    //   {
    //     name: "second group",
    //     favorites: [
    //       {
    //         name: "My Presentation",
    //         size: 987078,
    //         favorite_name: "The Presentation for all Managers"
    //         // more attributes follow ...
    //       }
    //     ]
    //   }
    // ];

    saveAll: function () {
      var self = this;
      var tabs = this.map(function (group) {
        var groupName;
        var groupId = group.get('tab_id');
        if (groupId == -1) {
          groupName = null; // the ungrouped group has no name
        } else {
          groupName = group.get('name');
        }
        return {
          name: groupName, tab_id: groupId, favorites: group.favorites.map(function (favorite) {
            return {
              id: favorite.get('id'),
              name: favorite.get('favorite_name')
            };
          })
        };
      });

      // this makes a formdata request
      var putUrl = this.connector.getConnectionUrl().getApiBase('v2');
      putUrl = Url.combine(putUrl, '/csui/favorites');

      // callCounter is for detecting parallel REST calls and to use only response from latest
      this.callCounter++;

      var options = {
        type: 'PUT',
        url: putUrl,
        data: tabs,
        beforeSend: function (request, settings) {
          request.counter = self.callCounter;
        }
      };

      var deferred = $.Deferred();
      var jqxhr = this.connector.makeAjaxCall(options);
      jqxhr.then(function (response) {
        if (jqxhr.counter < self.callCounter) {
          // let the caller ignore the results, because a new save operation was already started
          deferred.reject();
        } else {
          // get new tab_ids because with bulk update call, the server invalidates all tab_ids
          options = {
            type: 'GET',
            url: self.url()
          };
          var jqxhrTabs = self.connector.makeAjaxCall(options)
              .then(function (tabsResp) {
                if (tabsResp.results && tabsResp.results instanceof Array) {
                  // merge the retrieved tab_id and order attributes with the existing models: the
                  // order of the returned list is the same as the order in this collection.
                  // Associate the models one by one, because the sequence is the same (if
                  // nothing changed them again in the meanwhile at the server)
                  // Note, this collection has at the end an additional group with tab_id = -1,
                  // which is the Ungrouped favorite group. This never changes. It's always at
                  // the end.

                  tabsResp.results.forEach(function (elem, index) {
                    if (elem.data) {
                      var group = self.at(index);
                      // must remove the group from the collection and add it again before
                      // changing the id (in this case tab_id) to let backbone update the byId
                      // structure correctly. this is a hack!
                      self.remove(group, {silent: true});
                      group.set('tab_id', elem.data.tab_id, {silent: true});
                      self.add(group, {at: index, silent: true});

                      group.set('order', elem.data.order, {silent: true});
                      // also update the tab_id stored in each favorite too, just in case
                      // anybody is using this...
                      for (var i = 0; i < group.favorites.length; i++) {
                        var favorite = group.favorites.at(i);
                        // do the hack also here to let backbone update the byId structure
                        group.favorites.remove(favorite, {silent: true});
                        favorite.set('favorite_tab_id', elem.data.tab_id, {silent: true});
                        group.favorites.add(favorite, {at: i, silent: true});
                      }
                    }
                  });

                }
                deferred.resolve(response);
                self.trigger('bulk:update:succeed');
              }, function (jqxhrTabs, statusText) {
                var errorTabs = new base.RequestErrorMessage(jqxhrTabs);
                deferred.reject(errorTabs);
                self.trigger('bulk:update:fail');
              });
        }
      }, function (jqxhr, statusText) {
        // if self.callCounter is already higher than the stored value of this request, then
        // a newer request was already started -> ignore the error in that case.
        if (jqxhr.counter < self.callCounter) {
          deferred.reject();
        } else {
          var error = new base.RequestErrorMessage(jqxhr);
          deferred.reject(error);
        }
        self.trigger('bulk:update:fail');
      });
      return deferred.promise();
    }
  });

  ConnectableMixin.mixin(Favorite2GroupsCollection.prototype);
  FetchableMixin.mixin(Favorite2GroupsCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(Favorite2GroupsCollection.prototype);
  FieldsV2Mixin.mixin(Favorite2GroupsCollection.prototype);
  ExpandableV2Mixin.mixin(Favorite2GroupsCollection.prototype);
  SyncableFromMultipleSources.mixin(Favorite2GroupsCollection.prototype);
  ServerAdaptorMixin.mixin(Favorite2GroupsCollection.prototype);
  StateRequestorMixin.mixin(Favorite2GroupsCollection.prototype);

  return Favorite2GroupsCollection;
});


csui.define('csui/models/server.adaptors/favorite.model.mixin',[
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
            'members/favorites', this.get('id'));
        },

        _serverCallPreCheck: function () {
          if (this.isNew()) {
            return {error: lang.serverCallPrecheckFailedModelIsNew};
          }
          if (!this.options || !this.options.connector) {
            return {error: lang.serverCallPrecheckFailedMissingConnector};
          }
          return undefined;
        },

        _serverCallUpdateFavorite: function (ajaxMethod, deferred, selected) {
          var error = this._serverCallPreCheck();
          if (error !== undefined) {
            deferred.reject(error);
            return;
          }

          var options = {
            type: ajaxMethod,
            url: this.url()
          };

          if (ajaxMethod === 'POST') {
            var tabId = this.get('tab_id');
            var name = this.get('name');
            // do this check for code backward compatibility
            if (tabId !== undefined || name !== undefined) {
              var data = {};
              name !== undefined && _.extend(data, {name: name});
              (tabId !== undefined && tabId !== -1) && _.extend(data, {tab_id: tabId});
              _.extend(options, {data: data});
            }
          }

          this.options.connector.makeAjaxCall(options)
            .done(_.bind(function (resp) {
              this.set('selected', selected);
              if (window.csui && window.csui.mobile) {
                // LPAD-59888: update the favorites list properly by fetching the update node model
                // change does not affect Smart UI
                var selectedNode = this.get('node');
                selectedNode.fetch({
                  force: true
                });
              }
              deferred.resolve(resp);
            }, this))
            .fail(function (err) {
              deferred.reject(err);
            });
        }

      });
    }
  };

  return ServerAdaptorMixin;
});


csui.define('csui/models/favorite.model',['csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/base',
  'csui/utils/url', 'csui/models/server.adaptors/favorite.model.mixin', 'i18n!csui/models/impl/nls/lang'
], function ($, _, Backbone, base, Url, ServerAdaptorMixin, lang) {
  "use strict";

  var FavoriteModel = Backbone.Model.extend({

    constructor: function FavoriteModel(attributes, options) {
      options || (options = {});
      this.options = options;
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeServerAdaptor(options);
    },

    isNew: function () {
      return this.get('id') === undefined;
    },

    addToFavorites: function () {
      var deferred = $.Deferred();
      this._serverCallUpdateFavorite('POST', deferred, true);
      return deferred.promise();
    },

    removeFromFavorites: function () {
      var deferred = $.Deferred();
      this._serverCallUpdateFavorite('DELETE', deferred, false);
      return deferred.promise();
    }

  });

  ServerAdaptorMixin.mixin(FavoriteModel.prototype);
  return FavoriteModel;

});


csui.define('csui/models/permission/permission.action.server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        urlBase: function () {
          var type              = this.get('type'),
              right_id          = this.get('right_id'),
              nodeId            = this.nodeId,
              apply_to          = this.apply_to,
              include_sub_types = this.include_sub_types,
              queryString       = "",
              url               = this.options.connector.getConnectionUrl().getApiBase('v2');
          if (!_.isNumber(nodeId) || nodeId > 0) {
            // Add an existing node by VERB /nodes/:id
            url = Url.combine(url, 'nodes', nodeId, 'permissions');
            if (apply_to) {
              queryString = Url.combineQueryString(queryString, {apply_to: apply_to});
            }
            if (include_sub_types) {
              _.each(include_sub_types, function (subtype) {
                queryString = Url.combineQueryString(queryString, {include_sub_types: subtype});
              });
            }

            queryString = queryString.length > 0 ? "?" + queryString : queryString;
            if (!type) {
              // Create a new permission model by POST
              url = Url.combine(url, 'custom' + queryString);
            } else if (type !== 'custom') {
              //Access an existing permission model by VERB /:type where type is public/owner/group
              url = Url.combine(url, type + queryString);
            } else if (!_.isNumber(right_id) || right_id > 0) {
              //Access an existing permission model by VERB /custom/:right_id
              url = Url.combine(url, type, right_id + queryString);
            } else {
              throw new Error('Unsupported permission type or user id');
            }
          } else {
            throw new Error('Unsupported id value');
          }
          return url;
        },

        url: function () {
          var url   = this.urlBase(),
              query = null;
          return query ? url + '?' + query : url;
        },

        parse: function (response, options) {
          if (this.collection) {
            var addItemsOptionIndex = response.permissions ?
                                      response.permissions.indexOf('add_items') : -1,
                addMajorVersionOptionIndex;
            if (!this.collection.isContainer) {
              if (addItemsOptionIndex !== -1) {
                response.permissions.splice(addItemsOptionIndex, 1);
              }
              addMajorVersionOptionIndex = response.permissions ?
                                           response.permissions.indexOf("add_major_version") : -1;
              if (!(this.collection.options.node &&
                  this.collection.options.node.get('advanced_versioning')) &&
                  addMajorVersionOptionIndex !== -1) {
                response.permissions.splice(addMajorVersionOptionIndex, 1);
              }
            } else {
              addMajorVersionOptionIndex = response.permissions ?
                                           response.permissions.indexOf("add_major_version") : -1;
              if (!(this.collection.options.node &&
                  this.collection.options.node.get('advancedVersioningEnabled')) &&
                  addMajorVersionOptionIndex !== -1) {
                response.permissions.splice(addMajorVersionOptionIndex, 1);
              }
            }
          }
          return response;
        }
      });
    },

    getPermissionLevel: function (permissions, isContainer, versionControlAdvanced, node, permissionModel) {
      var value,
          permissionsCount = 9;
      if (isContainer) {
        permissionsCount++;
        if (!node.get('advancedVersioningEnabled')) {
          permissionsCount--;
        }
      } else if (!versionControlAdvanced) {
        permissionsCount--;
      }
      if (permissions && permissions.length > 0 && (node.get('permissions_model') !== 'simple')) {
        if (permissions.indexOf("edit_permissions") >= 0 &&
            permissions.length === permissionsCount) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL;
        } else if (permissions.indexOf("edit_permissions") < 0 &&
                   permissions.indexOf("delete") >= 0 &&
                   permissions.length === (permissionsCount - 1)) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_WRITE;
        } else if (permissions.indexOf("see_contents") >= 0 &&
                   permissions.length === 2) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_READ;
        } else {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_CUSTOM;
        }
      } else if (permissions && permissions.length > 0 &&
                 (node.get('permissions_model') === 'simple')) {
        if (permissions.indexOf("edit_permissions") >= 0) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL;
        } else if (permissions.indexOf("edit_permissions") < 0 &&
                   permissions.indexOf("delete") >= 0) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_WRITE;
        } else if (permissions.indexOf("see_contents") >= 0 &&
                   permissions.length === 2) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_READ;
        }
      } else if (permissionModel.get("type") === "public" || !!permissionModel.get("right_id")) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_NONE;
      }
      return value;
    },

    getReadPermissions: function () {
      return ["see", "see_contents"];
    },

    getWritePermissions: function (isContainer, versionControlAdvanced, advancedVersioningEnabled) {
      var permissions = ["see", "see_contents", "modify", "edit_attributes", "add_items", "reserve",
        "add_major_version", "delete_versions", "delete"];
      if (!isContainer) {
        permissions.splice(permissions.indexOf('add_items'), 1);
        if (!versionControlAdvanced) {
          permissions.splice(permissions.indexOf('add_major_version'), 1);
        }
      } else {
        if (!advancedVersioningEnabled) {
          permissions.splice(permissions.indexOf('add_major_version'), 1);
        }
      }
      return permissions;
    },

    getFullControlPermissions: function (isContainer, versionControlAdvanced,
        advancedVersioningEnabled) {
      var permissions = ["see", "see_contents", "modify", "edit_attributes", "add_items", "reserve",
        "add_major_version", "delete_versions", "delete", "edit_permissions"];
      if (!isContainer) {
        permissions.splice(permissions.indexOf('add_items'), 1);
        if (!versionControlAdvanced) {
          permissions.splice(permissions.indexOf('add_major_version'), 1);
        }
      } else {
        if (!advancedVersioningEnabled) {
          permissions.splice(permissions.indexOf('add_major_version'), 1);
        }
      }
      return permissions;
    },

    getPermissionsByLevelExceptCustom: function (level, isContainer, versionControlAdvanced,
        advancedVersioningEnabled) {
      var permissions = null;
      switch (level) {
      case ServerAdaptorMixin.PERMISSION_LEVEL_NONE:
        permissions = [];
        break;
      case ServerAdaptorMixin.PERMISSION_LEVEL_READ:
        permissions = ServerAdaptorMixin.getReadPermissions();
        break;
      case ServerAdaptorMixin.PERMISSION_LEVEL_WRITE:
        permissions = ServerAdaptorMixin.getWritePermissions(isContainer, versionControlAdvanced,
            advancedVersioningEnabled);
        break;
      case ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL:
        permissions = ServerAdaptorMixin.getFullControlPermissions(isContainer,
            versionControlAdvanced,
            advancedVersioningEnabled);
        break;
      }
      return permissions;
    }

  };

  ServerAdaptorMixin.PERMISSION_LEVEL_NONE = 0;
  ServerAdaptorMixin.PERMISSION_LEVEL_READ = 1;
  ServerAdaptorMixin.PERMISSION_LEVEL_WRITE = 2;
  ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL = 3;
  ServerAdaptorMixin.PERMISSION_LEVEL_CUSTOM = 4;
  return ServerAdaptorMixin;
});


csui.define('csui/models/permission/nodepermission.model',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/permission/permission.action.server.adaptor.mixin'
], function (module, _, $, Backbone, Url, ConnectableMixin, UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var config = _.extend({
    idAttribute: null
  }, module.config());

  var NodePermissionModel = Backbone.Model.extend({
    idAttribute: config.idAttribute,

    defaults: {
      "addEmptyAttribute": true
    },

    constructor: function NodePermissionModel(attributes, options) {
      attributes || (attributes = {});
      options || (options = {});

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.options = _.pick(options, ['connector']);
      this.makeConnectable(options)
          .makeUploadable(options);
    },

    isNew: function () {
      return !this.get('type') || !(this.has('right_id') || this.get('type') === 'public');
    }

  }, {
    getPermissionLevel: getPermissionLevel,
    getReadPermissions: ServerAdaptorMixin.getReadPermissions,
    getWritePermissions: ServerAdaptorMixin.getWritePermissions,
    getFullControlPermissions: ServerAdaptorMixin.getFullControlPermissions,
    getPermissionsByLevelExceptCustom: ServerAdaptorMixin.getPermissionsByLevelExceptCustom
  });

  function getPermissionLevel () {
    return ServerAdaptorMixin.getPermissionLevel(this.get("permissions"),
        this.collection.isContainer, this.collection.options.node &&
                                     this.collection.options.node.get('advanced_versioning'),
        this.collection.options.node, this);
  }

  NodePermissionModel.prototype.PERMISSION_LEVEL_NONE = NodePermissionModel.PERMISSION_LEVEL_NONE = ServerAdaptorMixin.PERMISSION_LEVEL_NONE;
  NodePermissionModel.prototype.PERMISSION_LEVEL_READ = NodePermissionModel.PERMISSION_LEVEL_READ = ServerAdaptorMixin.PERMISSION_LEVEL_READ;
  NodePermissionModel.prototype.PERMISSION_LEVEL_WRITE = NodePermissionModel.PERMISSION_LEVEL_WRITE = ServerAdaptorMixin.PERMISSION_LEVEL_WRITE;
  NodePermissionModel.prototype.PERMISSION_LEVEL_FULL_CONTROL = NodePermissionModel.PERMISSION_LEVEL_FULL_CONTROL = ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL;
  NodePermissionModel.prototype.PERMISSION_LEVEL_CUSTOM = NodePermissionModel.PERMISSION_LEVEL_CUSTOM = ServerAdaptorMixin.PERMISSION_LEVEL_CUSTOM;

  NodePermissionModel.prototype.getPermissionLevel = NodePermissionModel.getPermissionLevel;
  NodePermissionModel.prototype.getReadPermissions = NodePermissionModel.getReadPermissions;
  NodePermissionModel.prototype.getWritePermissions = NodePermissionModel.getWritePermissions;
  NodePermissionModel.prototype.getFullControlPermissions = NodePermissionModel.getFullControlPermissions;
  NodePermissionModel.prototype.getPermissionsByLevelExceptCustom = NodePermissionModel.getPermissionsByLevelExceptCustom;

  ConnectableMixin.mixin(NodePermissionModel.prototype);
  UploadableMixin.mixin(NodePermissionModel.prototype);
  ServerAdaptorMixin.mixin(NodePermissionModel.prototype);

  return NodePermissionModel;
});


csui.define('csui/models/permission/permission.response.mixin',[
  'csui/lib/underscore', 'csui/utils/base'
], function (_, base) {
  'use strict';

  var PermissionResponseMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makePermissionResponse: function (options) {
          return this;
        },

        /**
         * This method update the response data for the following fields....
         * removes public access record if no permission data exists,
         * @param resp
         * @param options
         */
        parsePermissionResponse: function (resp, options, clearEmptyPermissionModel) {
          if (!!resp.results && !!resp.results.data && !!resp.results.data.permissions &&
              !_.isEmpty(resp.results.data.permissions)) {
            var permissionsList = resp.results.data.permissions;
            if (_.isArray(permissionsList)) {
              //Removing public access entry from response if there is no permissions available
              permissionsList = _.reject(permissionsList,
                  function (child) { return (child.type === 'public' && !child.permissions); });
              var ownerData = _.find(permissionsList, function (item) {
                    return item.type === 'owner';
                  }),
                  groupData = _.find(permissionsList, function (item) {
                    return item.type === 'group';
                  });
              //Removing group entry from response if owner is available and group is not available
              if ((ownerData && ownerData.permissions) && (groupData && !groupData.permissions)) {
                permissionsList = _.reject(permissionsList,
                    function (child) { return (child.type === 'group' && !child.permissions); });
              }
              //Removing owner entry from response if group is available and owner is not available
              if ((ownerData && !ownerData.permissions) && (groupData && groupData.permissions)) {
                permissionsList = _.reject(permissionsList,
                    function (child) { return (child.type === 'owner' && !child.permissions); });
              }
              //Removing group entry from response if there is no permissions available for owner
              // and owner group
              if ((ownerData && !ownerData.permissions) && (groupData && !groupData.permissions)) {
                permissionsList = _.reject(permissionsList,
                    function (child) { return (child.type === 'group' && !child.permissions); });
              }
            } else if (_.isObject(permissionsList)) {
              permissionsList = [];
              if (resp.results.data.permissions &&
                  resp.results.data.permissions.permissions.length > 0) {
                permissionsList.push(resp.results.data.permissions);
              }
            }
            resp.results.data.permissions = permissionsList;
          }
        }
      });
    }
  };

  return PermissionResponseMixin;
});


csui.define('csui/models/permission/server.adaptor.mixin',[
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
          var url = Url.combine(this.connector.getConnectionUrl().getApiBase('v2'), 'nodes',
              this.options.node.get('id')), query;
          if (!!this.options.memberId) {
            url += '/permissions/effective/' + this.options.memberId;
            query = Url.combineQueryString(
                {
                  expand: 'permissions{right_id}'
                }, query);
          } else {
            query = Url.combineQueryString(
                {
                  fields: ['properties{container, name, type, versions_control_advanced,' +
                           ' permissions_model}',
                    'permissions{right_id, permissions, type}', 'versions{version_id}'],
                  expand: ['permissions{right_id}']
                }, query);
          }
          if (query) {
            url += '?' + query;
          }

          return url;
        },

        parse: function (response, options) {
          if (!!response.results && !!response.results.data) {
            this.parsePermissionResponse(response, options, this.options.clearEmptyPermissionModel);
            //Add name in the permission collection
            if (!this.options.node.get("isNotFound")) {
              this.nodeName = response.results.data.properties ? response.results.data.properties.name :
                              "";
              if (this.isContainer === undefined || response.results.data.properties) {
                this.isContainer = response.results.data.properties ?
                                   response.results.data.properties.container : true;
              }
              return response.results.data.permissions;
            }
          }
        }
      });
    }

  };

  return ServerAdaptorMixin;
});


csui.define('csui/models/permission/nodeuserpermissions',['module',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/utils/url',
  'csui/models/permission/nodepermission.model',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/browsable/browsable.mixin',
  'csui/models/browsable/v2.response.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/permission/permission.response.mixin',
  'csui/models/permission/server.adaptor.mixin'
], function (module, $, _, Backbone, Url, NodePermissionModel,
    ConnectableMixin, FetchableMixin, BrowsableMixin,
    BrowsableV2ResponseMixin, ExpandableV2Mixin, PermissionResponseMixin,
    ServerAdaptorMixin) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30
  });

  var NodeUserPermissionCollection = Backbone.Collection.extend({

    model: NodePermissionModel,

    constructor: function NodeUserPermissionCollection(models, options) {
      options = _.defaults({}, options, {
        top: config.defaultPageSize
      }, options);

      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.makeFetchable(options);

      this.options = options;
      this.includeActions = options.includeActions;
      this.query = this.options.query;

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeBrowsable(options)
          .makeBrowsableV2Response(options)
          .makePermissionResponse(options);
    },

    isFetchable: function () {
      return true;
    },

    setOrder: function (attributes, fetch) {
      if (this.orderBy != attributes) {
        this.orderBy = attributes;
        if (fetch !== false) {
          this.fetch({skipSort: false});
        }
        return true;
      }
    },

    processForEmptyOwner: function () {
      if (!this.findWhere({type: 'owner'}) && !this.findWhere({type: 'group'})) {
        //Add dummy model at index 0, for no owner assigned row
        this.add({permissions: null, right_id: null, type: 'owner'}, {at: 0});
      }
    },

    addPublicAccess: function (publicAccessModel) {
      if (this.findWhere({type: 'owner'}) && this.findWhere({type: 'group'})) {
        //Add dummy model at index 0, for no owner assigned row
        this.add(publicAccessModel, {at: 2});
      } else {
        //Add public access at index 1, if anyone is present from owner or group
        this.add(publicAccessModel, {at: 1});
      }
    },

    addOwnerOrGroup: function (nodePermissionModel, flag) {
      var owner = this.findWhere({type: 'owner'});
      if (owner && owner.get('permissions') === null) { //No owner or group
        var currentModel = this.at(0);
        this.remove(currentModel, {silent: flag});
        this.add(nodePermissionModel, {at: 0});
      }
      else {
        this.add(nodePermissionModel, {at: (nodePermissionModel.get('type') === 'owner') ? 0 : 1});
      }
    }
  });

  FetchableMixin.mixin(NodeUserPermissionCollection.prototype);
  BrowsableMixin.mixin(NodeUserPermissionCollection.prototype);
  BrowsableV2ResponseMixin.mixin(NodeUserPermissionCollection.prototype);
  ConnectableMixin.mixin(NodeUserPermissionCollection.prototype);
  ExpandableV2Mixin.mixin(NodeUserPermissionCollection.prototype);
  PermissionResponseMixin.mixin(NodeUserPermissionCollection.prototype);
  ServerAdaptorMixin.mixin(NodeUserPermissionCollection.prototype);

  return NodeUserPermissionCollection;

});



csui.define('csui/models/server.module/server.module.collection',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone'
], function (module, _, $, Backbone) {
  'use strict';

  // Map with ids as keys and attributes as values
  var sourceModules = module.config().modules || {},
  // Convert the configuration map to an array of model attributes
      serverModules = _.map(sourceModules, function (attributes, id) {
        attributes.id = id;
        return attributes;
      });

  var ServerModuleModel = Backbone.Model.extend({

    defaults: {
      id: null,   // Require.js module prefix used by the server module
      title: null // Displayable title of the server module
    },

    constructor: function ServerModuleModel(attributes, options) {
      ServerModuleModel.__super__.constructor.apply(this, arguments);
    }

  });

  var ServerModuleCollection = Backbone.Collection.extend({

    model: ServerModuleModel,

    constructor: function ServerModuleCollection(models, options) {
      models || (models = serverModules);
      ServerModuleCollection.__super__.constructor.call(this, models, options);
    },

    sync: function (method, collection, options) {
      if (method !== 'read') {
        throw new Error('Only fetching the server modules is supported.');
      }
      var self = this;
      options || (options = {});
      return this._resolveServerModules()
          .then(function () {
            var response = self.toJSON();
            options.success && options.success(response, options);
            self.trigger('sync', self, response, options);
          });
    },

    _resolveServerModules: function (options) {
      options = _.extend({}, this.options, options);
      var deferred = $.Deferred(),
          missing = this.find(function (serverModule) {
            var sourceModule = sourceModules[serverModule.id];
            if (sourceModule) {
              serverModule.set(sourceModule.attributes);
            } else {
              if (!options.ignoreErrors) {
                return true;
              }
            }
          });
      if (missing) {
        var error = new Error('Invalid module prefix: ' + missing.id);
        return deferred.reject(error);
      }
      return deferred.resolve().promise();
    }

  });

  return ServerModuleCollection;

});


csui.define('csui/models/specificnodemodel',['csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/node.resource/node.resource.mixin'
], function (_, Backbone, Url, NodeResourceMixin) {
  'use strict';

  var SpecificNodeModel = Backbone.Model.extend({

    constructor: function SpecificNodeModel(attributes, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, arguments);
      this.makeNodeResource(options);
    },

    parse: function (response) {
      return response;
    },

    url: function () {

      var node   = this.options.node,
          nodeId = node.get('id'),
          url;
      url = _.str.sformat('forms/nodes/properties/specific?id={0}',
          nodeId);

      return Url.combine(this.options.connector.connection.url, url);

    }

  });

  NodeResourceMixin.mixin(SpecificNodeModel.prototype);

  return SpecificNodeModel;

});


csui.define('csui/models/mixins/versions/v2.versions.response.mixin',['csui/lib/underscore'
], function (_) {
  'use strict';

  var VersionsV2ResponseMixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {

        makeVersionableV2Response: function (options) {
          return this;
        },

        parseVersionsResponse: function (response) {
          if (!!response.results && !!response.results.data) {
            if(!!response.results.actions) {
              _parseActions.call(this, response.results.actions, response.results.data.versions);
            }
            return response.results.data.versions;
          }
          return response;
        }

      });
    }
  };

  // parsing actions and adding singature for existing actions
  function _parseActions(actions, version) {

    version.actions =
    _.chain(actions.data)
    .keys()
    .map(function (key) {
      var attributes = actions.data[key];
      attributes.signature = key;
      return attributes;
    })
    .value();
  }

  return VersionsV2ResponseMixin;
});


csui.define('csui/models/server.adaptors/version.mixin',[
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
          var url = Url.combine(this.connector.getConnectionUrl().getApiBase('v2'), 'nodes',
            this.get('id'), 'versions');
          if (!this.isNew()) {
            url = Url.combine(url, this.get('version_number'));
            var query = Url.combineQueryString(
              this.getExpandableResourcesUrlQuery(),
              this.getRequestedCommandsUrlQuery()
            );
            if (query) {
              url += '?' + query;
            }
          }

          return url;
        },

        parse: function (response) {
          // Handle both version objects when parsed from the single
          // /versions/:id and the collection /versions responses.
          var version = response.data || this.parseVersionsResponse(response);

          // TODO: Remove this.  Version properties should have its own general
          // property panel instead of using the node and breaking each other
          // when one of them gets changed
          /*if (version.type === undefined) {
            version.type = 144;
          }*/

          // get node type info from NodeVersionCollection for Version Collection, if it is single
          // fetch then collect it from rest api response id_expand object
          if (version.id_expand && version.id_expand.type) {
            version.type = version.id_expand.type;
          }

          if (!!version.version_number_name) {
            version.version_number_name_formatted = version.version_number_name;
          }

          if (version.commands) {
            var commands = version.commands;
            version.actions = _
              .chain(commands)
              .keys()
              .map(function (key) {
                var attributes = commands[key];
                attributes.signature = key;
                return attributes;
              })
              .value();
            delete version.commands;
            delete version.commands_map;
            delete version.commands_order;
          }

          return version;
        }

      });
    }
  };

  return ServerAdaptorMixin;
});


csui.define('csui/models/version',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/log', 'csui/utils/url', 'csui/models/actions',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/mixins/expandable/expandable.mixin',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/mixins/versions/v2.versions.response.mixin',
  'csui/models/server.adaptors/version.mixin',
  'csui/utils/deepClone/deepClone'
], function (module, _, Backbone, log, Url, ActionCollection, DelayedCommandableV2Mixin,
    ExpandableMixin, ResourceMixin, UploadableMixin, VersionsableV2ResponseMixin, ServerAdaptorMixin) {
  'use strict';

  var VersionModel = Backbone.Model.extend({

    idAttribute: 'version_number',

    constructor: function VersionModel(attributes, options) {
      attributes || (attributes = {});
      options = _.extend({expand: ['user', 'versions{id, owner_id}']}, options);

      // TODO: Remove this, this is set for version model only because widgets like metadata
      // do not handle models without delayed commands. Find a boolean that every model
      // must use when it has delayed actions so that widgets can behave accordingly.
      this.lazyActionsDisabled = options.lazyActionsDisabled || true;

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeResource(options)
          .makeUploadable(options)
          .makeVersionableV2Response(options)
          .makeDelayedCommandableV2(options)
          .makeExpandable(options)
          .makeServerAdaptor(options);

      if (!attributes.actions) {
        this.actions = new ActionCollection();
      }
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector,
        commands: this.commands,
        expand: _.deepClone(this.expand)
      });
    },

    set: function (key, val, options) {
      var attrs;
      if (key == null) {
        return this;
      }

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      if(key === 'has_generation' && val === true){
        //once generation is created for new version we need to remove delete action
        this._removeDeleteAction(this);
      }
      // TODO: Support sub-models and sub-collections in general
      if (attrs.actions) {
        if (this.actions) {
          this.actions.reset(attrs.actions, options);
        } else {
          this.actions = new ActionCollection(attrs.actions);
        }
      }

      // do the usual set
      return Backbone.Model.prototype.set.call(this, attrs, options);
    },
    
    _removeDeleteAction: function (version) {
      // Once a generation is created for a version, it is not deletable.
      // so, remove the action from the collection if available
      // instead of re-fetching.
      if(!version || !version.actions || version.actions.length === 0) {
        return;
      }
      var actionCollection = version.actions,
          updatedActions = actionCollection.filter(function (action) {
            return !(action.id === 'delete' || action.id === 'versions_delete');
          });

      if(updatedActions.length < actionCollection.length) {
          actionCollection.reset(updatedActions);
      }
    },

    isNew: function () {
      return !this.has('version_number');
    },

    isFetchable: function () {
      return !!(this.get('id') && this.get('version_number'));
    }

  });

  ExpandableMixin.mixin(VersionModel.prototype);
  UploadableMixin.mixin(VersionModel.prototype);
  ResourceMixin.mixin(VersionModel.prototype);
  DelayedCommandableV2Mixin.mixin(VersionModel.prototype);
  VersionsableV2ResponseMixin.mixin(VersionModel.prototype);
  ServerAdaptorMixin.mixin(VersionModel.prototype);

  return VersionModel;

});


csui.define('csui/models/view.state.model',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/log', 'csui/utils/url', 'csui/utils/namedsessionstorage'

], function (module, _, Backbone, log, Url, NamedSessionStorage) {
  'use strict';

  var PublicLang;
  csui.require(['i18n!csui/pages/start/nls/lang'
  ], function (publicLang) {
    PublicLang = publicLang;
  }.bind(this));

  var MAX_ROUTERS_INFO_STACK = 50;

  var constants = Object.freeze({
    LAST_ROUTER: 'lastRouter',
    CURRENT_ROUTER: 'currentRouter',
    CURRENT_ROUTER_FRAGMENT: 'currentRouterFragment',
    CURRENT_ROUTER_NAVIGATE_OPTIONS: 'currentRouterNavigateOptions',
    CURRENT_ROUTER_SCOPE_ID: 'currentRouterScopeId',
    BACK_TO_TITLE: 'back_to_title',
    METADATA_CONTAINER: 'metadata_container',
    STATE: 'state',
    DEFAULT_STATE: 'default_state',
    SESSION_STATE: 'session_state',
    NAVIGATION_HISTORY_ARRAY: 'navigationHistoryArray',
    URL_PARAMS: 'urlParams',
    ALLOW_WIDGET_URL_PARAMS: 'allowWidgetUrlParams',
    START_ID: 'start_id',
    BREADCRUMB: 'breadcrumb',
    QUERY_STRING_PARAMS: 'query_string_params',
    COLLECTION_DATA: 'collection_data',
  });

  var counter = 0;

  /*var noExpanding = /\bno_expand\b(?:=([^&]*)?)?/i.exec(location.search);
  noExpanding = noExpanding && noExpanding[1] !== 'false';*/
    
  // The view state model stores variables in the state attribute. Those variables are used to build
  // the url parameters. In this sense the url is the long term storage.
  // The session session_state contains variables that are stored in the browser session storage.
  var ViewStateModel = Backbone.Model.extend({

    constructor: function ViewStateModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      // Moved this into the constructor to ensure integration widgets have time to set the configuration.
      // These widgets can't configure the module at load time, so we delay initialization until they get a chance to set the proper configuration
      let config = module.config();

      let storageNamePrefix = module.id;
      if  (config.viewStateModelNameSpace) {
        storageNamePrefix += ":" + config.viewStateModelNameSpace;
      }

      if (counter === 0) {
        this.storage = new NamedSessionStorage(storageNamePrefix);
      } else {
        this.storage = new NamedSessionStorage(storageNamePrefix + '_' + counter);
        this.storage.destroy();
      }

      counter++;

      this.set('enabled', attributes ? attributes.enabled : false);

      this._navigationHistory = [];

      _.values(constants).forEach(function (property) {
        var value = attributes ? attributes[property] : this.storage.get(property);
        if (value && (property.indexOf("Array") !== -1 || property.indexOf("urlParams") !== -1)) {
          value = _.isString(value) ? JSON.parse(value) : value;
        }
        this.listenTo(this, 'change:' + property, this._syncWithStorage.bind(this, property));
        this.set(property, value, {silent: true});
      }.bind(this));

      this._navigationHistory = this.get(constants.NAVIGATION_HISTORY_ARRAY) || [];
    },

    CONSTANTS: constants,

    _setViewStateAttribute: function (attributeName, key, value, options) {
      options || (options = {});
      if (this._getViewStateAttribute(attributeName, key) === value) {
        return;
      }

      var object = this.get(attributeName) || {};
      object = _.clone(object);
      if (value === undefined || value === '') {
        delete object[key];
      } else {
        object[key] = value;
      }
      options = _.omit(options, 'encode');
      this.set(attributeName, object, options);
      this._syncWithStorageIfSilentUpdate(attributeName, options);
      return true;
    },

    _getViewStateAttribute: function(attributeName, key, decode) {
      var state = this.get(attributeName);
      if (state) {
        return state[key];
      }
    },

    // All the view state elements are added to the url. These variables are stored in the url.
    setViewState: function (key, value, options) {
      if (key === 'state') {
        this.set(constants.STATE, value, options);
        this._syncWithStorageIfSilentUpdate(constants.STATE, options);
      } else {
        return this._setViewStateAttribute(constants.STATE, key, value, options);
      }
    },

    getViewState: function (key, decode) {
      return this._getViewStateAttribute(constants.STATE, key, decode);
    },

    // Default states are not serialized in the url even if they exist in the 'state' object.
    setDefaultViewState: function(key, value, options) {
      return this._setViewStateAttribute(constants.DEFAULT_STATE, key, value, options);
    },

    getDefaultViewState: function(key, decode) {
      return this._getViewStateAttribute(constants.DEFAULT_STATE, key, decode);
    },

    // All variables in the session view state are stored in the session local storage.
    // They are used to initialize the widgets view
    setSessionViewState: function (key, value, options) {
      options || (options = {});
      if (this.getSessionViewState(key) === value) {
        return;
      }
      var sessionState = this.get(constants.SESSION_STATE) || {};
      sessionState = _.clone(sessionState);
      sessionState[key] = value;
      this.set(constants.SESSION_STATE, sessionState, options);
      this._syncWithStorageIfSilentUpdate(constants.SESSION_STATE, options);
      return true;
    },

    getSessionViewState: function (key) {
      var state = this.get(constants.SESSION_STATE);
      if (state) {
        return state[key];
      }
    },

    _syncWithStorageIfSilentUpdate: function(property, options) {
      if (options && options.silent) {
        this._syncWithStorage(property);
      }
    },

    _syncWithStorage: function (property) {
      var value = this.get(property);
      if (_.isArray(value)) {
        value = JSON.stringify(value);
      }
      this.storage.set(property, value);
    },

    getCurrentRouterName: function() {
      return this.get(this.CONSTANTS.CURRENT_ROUTER);
    },

    onNavigationStarted: function (newRouterInfo, canRestore) {

      this.trigger('before:navigate');

      this.set('navigated', true);

      var lastHistoryEntry = this.getLastHistoryEntry();
      var restore = this.isSameRoutingInfo(newRouterInfo, lastHistoryEntry);
      if (!canRestore) {
        restore = false;
      }

      // This condition has been hardcoded to resolve bug LPAD-100633. We can't detect if the
      // user hit the browser back button. If the nodestable has a csui back button this issue
      // would not happen.
      if (lastHistoryEntry && lastHistoryEntry.router === 'Metadata' &&
          newRouterInfo.router === 'Metadata' && this.get(this.CONSTANTS.CURRENT_ROUTER) === 'Node'
          && !this.get('CommandNavigation')) {
        restore = true;
      }

      this.set('CommandNavigation', false);

      // we need to do this for backward compatibility. This is for any code that uses this
      // value from previous implementation.
      this.set(this.CONSTANTS.LAST_ROUTER, this.get(this.CONSTANTS.CURRENT_ROUTER));

      if (restore) {
        this._currentHistoryEntry = undefined;
        this._restoreStatesFromHistoryEntry(this._navigationHistory.pop());
        this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
        this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);
      } else {
        this._savePotentialHistoryEntry();
      }
    },

    _savePotentialHistoryEntry: function () {
      var storage = this.storage;
      var routerName = storage.get(constants.CURRENT_ROUTER);
      if (routerName) {

        var state = this.get('saved_viewstate');
        if (!state) {
          state = this.storage.get(constants.STATE);
        }

        this.set('saved_viewstate', undefined);

        var defaultState = this.get('saved_defaultstate');
        if (!defaultState) {
          defaultState = this.storage.get(constants.DEFAULT_STATE);
        }

       this.set('saved_defaultstate', undefined);

        // some context plugins could change the urlParams in the viewState
        // make sure we take the urlParams from the router and not the viewStateModel.
        var router = this.get('PerspectiveRouting').getRouter(routerName);
        
        this._currentHistoryEntry = {
          'router': routerName,
          'back_to_title': this.storage.get(constants.BACK_TO_TITLE),
          'urlParam': router && router.urlParams,
          'fragment': this.storage.get(constants.CURRENT_ROUTER_FRAGMENT),
          'scopeId': this.storage.get(constants.CURRENT_ROUTER_SCOPE_ID),
          'navigateOptions': this.storage.get(constants.CURRENT_ROUTER_NAVIGATE_OPTIONS),
          'state': state,
          'sessionState': this.storage.get(constants.SESSION_STATE),
          'defaultState': defaultState
        };
      }
    },

    getPotentialHistoryEntry: function () {
      return this._currentHistoryEntry;
    },

    onContextFetch: function () {
      this.trigger('navigate', this._currentHistoryEntry);
      this.unset("isFromHistory", {silent: true});
      this._currentHistoryEntry && this._addRouterInfoToHistory(this._currentHistoryEntry);
    },

    _restoreStatesFromHistoryEntry : function(historyInfo) {
      if (historyInfo) {
        var restoreStates = {
          'isFromHistory': true,
          'state': historyInfo.state,
          'default_state': historyInfo.defaultState,
          'session_state': historyInfo.sessionState
        };
        this.set(restoreStates, {silent: true});
        ['state', 'default_state', 'session_state'].forEach(function (property) {
          this._syncWithStorage(property);
        }.bind(this));
      }
    },

    _addRouterInfoToHistory: function (historyEntry) {

      // do not add duplicate entries
      if (this._navigationHistory.length > 0 &&
            JSON.stringify(historyEntry) === JSON.stringify(this._navigationHistory[this._navigationHistory.length - 1])) {
        return;
      }

      this._navigationHistory.push(historyEntry);

      if (this._navigationHistory.length > MAX_ROUTERS_INFO_STACK) {
        this._navigationHistory.shift();
      }

      this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
      this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);
    },

    _copyAttributes: function (viewStateModel) {
      Object.keys(viewStateModel.attributes).forEach(function (attributeName) {
        this.unset(attributeName);
        this.set(attributeName, viewStateModel.get(attributeName));
      }.bind(this));
    },

    saveHistory: function() {
      this.savedViewStateModel = this.clone();
      this.savedViewStateModel._copyAttributes(this);
      this._resetAttributes();
    },

    _resetAttributes: function() {

      this._navigationHistory = [];

      this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
      this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);

      this.set(constants.LAST_ROUTER, undefined);
      this.set(constants.CURRENT_ROUTER, undefined);
      this.set(constants.CURRENT_ROUTER_FRAGMENT, undefined);
      this.set(constants.CURRENT_ROUTER_NAVIGATE_OPTIONS, undefined);
      this.set(constants.CURRENT_ROUTER_SCOPE_ID, undefined);
      this.set(constants.BACK_TO_TITLE, undefined);
      this.set(constants.METADATA_CONTAINER, undefined);
      this.set(constants.STATE, undefined);
      this.set(constants.DEFAULT_STATE, undefined);
      this.set(constants.SESSION_STATE, undefined);
      this.set(constants.URL_PARAMS, undefined);
      this.set(constants.ALLOW_WIDGET_URL_PARAMS, undefined);
      this.set(constants.SESSION_STATE, undefined);
      this.set(constants.START_ID, undefined);
      this.set(constants.BREADCRUMB, undefined);
      this.set(constants.COLLECTION_DATA, undefined);
    },

    restoreHistory: function () {
      if (this.savedViewStateModel) {
        this._copyAttributes(this.savedViewStateModel);
        this.savedViewStateModel.clean();
        this.savedViewStateModel = undefined;

        var value = this.storage.get(constants.NAVIGATION_HISTORY_ARRAY);
        if (value) {
          value = JSON.parse(value);
          this._navigationHistory = value;
        }
      }
    },

    hasRouted: function () {
      return this._navigationHistory.length > 0;
    },

    isSameRoutingInfo: function (router1Info, router2Info) {
      return router1Info && router2Info &&
             router1Info.router === router2Info.router &&
             router1Info.fragment === router2Info.fragment;
    },

    /**
     * Warning: Cleaning of state will eventually clears the internals session storage. 
     * Thus, restoring the state (perhaps on page refresh or navigating between pages) will not be possible after this operation.
     */
    clean: function() {
      // Clear model state
      this.clear(); 
      // Clear session storage
      this.storage.destroy();
    },

    getBackToTitle: function () {

      var title = PublicLang.back;
      if (this._currentHistoryEntry) {
        title = this._currentHistoryEntry.back_to_title || title;
      } else {
        var index = this.getLastRouterIndex();
        if (index !== -1) {
          var lastRouterInfo = this._navigationHistory[index];
          if (lastRouterInfo) {
            title = lastRouterInfo.back_to_title || title;
          }
        }
      }

      return title;
    },

    clearHistory: function() {
      this._navigationHistory = [];
      this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
      this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);
    },

    clearCurrentHistoryEntry: function () {
      this._currentHistoryEntry = undefined;
    },

    getLastRouterIndex: function () {
      var index = -1,
          navigationHistory = this._navigationHistory;
      if (navigationHistory && navigationHistory.length > 0) {
        for (var i = navigationHistory.length - 1; i >= 0; i--) {
          if (navigationHistory[i].router !== this.get(constants.CURRENT_ROUTER)) {
            index = i;
            break;
          }
        }
      }
      return index;
    },

    getIndexOfOfLastApplicationScope: function () {
      var index = -1,
          navigationHistory = this._navigationHistory;
      if (navigationHistory && navigationHistory.length > 0) {
        for (var i = navigationHistory.length - 1; i >= 0; i--) {
          if (navigationHistory[i].scopeId !== this.get(constants.CURRENT_ROUTER_SCOPE_ID)) {
            index = i;
            break;
          }
        }
      }
      return index;
    },

    getLastHistoryEntry: function () {
      return this._navigationHistory && this._navigationHistory.length > 0 &&
             this._navigationHistory[this._navigationHistory.length - 1];
    },

    getHistory: function () {
      return this._navigationHistory;
    },

    restoreRouterOfLastApplicationScope: function () {
      this._restoreHistoryEntryByIndex(this.getIndexOfOfLastApplicationScope());
    },

    restoreLastRouter: function () {
      this._restoreHistoryEntryByIndex(this.getLastRouterIndex());
    },

    restoreLastFragment: function () {
      this._restoreHistoryEntryByIndex(this._navigationHistory.length - 1);
    },

    restoreHistoryEntryByIndex: function(index) {
      return this._restoreHistoryEntryByIndex(index);
    },

    _restoreHistoryEntryByIndex: function (index) {
      if (index !== -1 && index < this._navigationHistory.length) {
        this._navigationHistory.length = index + 1;
        var historyEntryInfo = this.getLastHistoryEntry();
        this._restoreStatesFromHistoryEntry(historyEntryInfo);
        this.get('PerspectiveRouting').restoreRouter(historyEntryInfo);
      } else {
        // Just go back if no history. It should not happen really.
        window.history.back();
      }
    },

    addUrlParameters: function (urlParameters, context, replace, force) {
      if (!force && !this.get(this.CONSTANTS.ALLOW_WIDGET_URL_PARAMS)) {
        return;
      }
      var perspectiveRouting = this.get('PerspectiveRouting');
      // The activeRouterInstance gets inserted in the viewStateModel
      // once the new router is activated and before the routing happens
      // But the new router from that time on will start listening to the viewState change.
      var activeRouter = this.get("activeRouterInstance");
      var routerName = activeRouter && activeRouter.name;
      routerName = routerName || this.get(constants.CURRENT_ROUTER);
      return perspectiveRouting &&
                   perspectiveRouting.addUrlParameters(routerName, urlParameters, replace);
    },

    clear: function () {
      this.storage.destroy();
      // init also all variables, just incase someone wants to use this viewStateModel instance again.
      // see SAPSSF-7778
      this._navigationHistory = [];
      this._currentHistoryEntry = undefined;
      Backbone.Model.prototype.clear.call(this, {silent: true});
    },

    hasNotNavigatedAndNotJustStarted:function() {
    }

  }, {
    CONSTANTS: constants,
    clean: function() {
      var storage = new NamedSessionStorage(module.id);
      storage.destroy();
    }
  });

  return ViewStateModel;
});


csui.define('csui/models/perspective/personalization.server.adaptor.mixin',[
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
          var perspectiveId = this.get('perspective_id'),
              url           = new Url(this.connector.connection.url).getApiBase('v2');
          if (!!perspectiveId) {
            // Create a new node by POST /perspectives
            url = Url.combine(url, 'perspectives', perspectiveId, 'personalization');
          } else {
            throw new Error('Unsupported perspective_id value');
          }
          return url;
        },
        // TODO Take care of parse, once REST API response finalized.
      });
    }
  };

  return ServerAdaptorMixin;
});
  

csui.define('csui/models/perspective/localstorage.server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/url',
  'csui/utils/namedlocalstorage'
], function (_, $, Url, NamedLocalStorage) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        getStorage: function () {
          var deferred = $.Deferred(),
              that     = this;
          csui.require(['csui/utils/contexts/factories/user'], function (UserModelFactory) {
            var user          = that.options.context.getModel(UserModelFactory),
                currentUserId = user.get('id');
            if (!currentUserId) {
              var userFactory = that.options.context.getFactory(UserModelFactory);
              if (userFactory.initialResponse) {
                currentUserId = userFactory.initialResponse.data.id;
              }
            }
            if (!that.namedLocalStorage) {
              that.namedLocalStorage = new NamedLocalStorage('perspective:personalization:' +
                                                             currentUserId);
            }
            that.namedLocalStorage;
            return deferred.resolve(that.namedLocalStorage);
          }, deferred.reject);
          return deferred;
        },

        savePerspective: function () {
          var that = this;
          return this.getStorage().then(function (storage) {
            return storage.set(that.getNodeId(), that.toJSON());
          });
        },

        fetchPerspective: function () {
          var that = this;
          return this.getStorage().then(function (storage) {
            return storage.get(that.getNodeId());
          });
        },
        sync: function (method, model, options) {
          var deferred = $.Deferred();
          switch (method) {
          case 'create':
          case 'update':
          case 'patch':
            model.savePerspective().then(function () {
              deferred.resolve(this);
            }, deferred.reject);

            break;
          case 'read':
            model.fetchPerspective().then(function (personalization) {
              if (!_.isEmpty(personalization)) {
                model.set(personalization);
              }
              deferred.resolve(model);
            }, deferred.reject);
            break;
          default:
            deferred.reject();
            break;
          }
          return deferred.promise();
        }
      });

    }
  };

  return ServerAdaptorMixin;
});

/**
 * Utiltiy of Perspective editing and Personalization
 */
csui.define('csui/utils/perspective/perspective.util',['module'], function (module) {

  var constants = Object.freeze({
    MODE_EDIT_PERSPECTIVE: 'edit',
    MODE_PERSONALIZE: 'personalize',
    WIDGET_PERSPECTIVE_PLACEHOLDER: 'csui/perspective.manage/widgets/perspective.placeholder',
    WIDGET_SHORTCUTS: 'csui/widgets/shortcuts',
    KEY_WIDGET_ID: 'w_id',
    KEY_HIDDEN: 'hidden',
    WIDGET_ID_PERSPECTIVE_PREFIX: 'pman-',
    WIDGET_ID_PESONALIZATION_PREFIX: 'personal-',
    PERSONALIZE_SUPPORTED_TYPES: ["sidepanel-right", "sidepanel-left", "flow"]
  });

  var EXTRA_WIDGET_CONFIG_KEYS = [constants.KEY_WIDGET_ID, constants.KEY_HIDDEN];

  //To check required fields in widget options
  function hasRequiredFields(manifest) {
    if (!!manifest && !!manifest.schema && !!manifest.schema.required &&
        manifest.schema.required.length > 0) {
      // Has required fields in the widget options
      return true;
    }
    return false;
  }

  function isEligibleForLiveWidget(manifest) {
    manifest = manifest || {};
    if (!!manifest.callback || hasRequiredFields(manifest)) {
      return false;
    }
    return true;
  }

  function getExtraWidgetKeys() {
    return EXTRA_WIDGET_CONFIG_KEYS;
  }

  /**
   * Returns shortcut group widget for personalization mode, otherwise default pman empty placeholder
   *
   * @param {`edit` or `personalize`} perspectiveMode
   */
  function getEmptyPlaceholderWidgetType(perspectiveMode) {
    switch (perspectiveMode) {
    case constants.MODE_PERSONALIZE:
      return constants.WIDGET_SHORTCUTS;
    default:
      return constants.WIDGET_PERSPECTIVE_PLACEHOLDER;
    }
  }

  function isEmptyPlaceholder(widget, perspectiveMode) {
    if (widget.type === constants.WIDGET_PERSPECTIVE_PLACEHOLDER) {
      return true;
    }
    var emptyType = getEmptyPlaceholderWidgetType(perspectiveMode);
    return emptyType === widget.type && widget.options && widget.__isPlacehoder;
  }

  function generateWidgetId(perspectiveMode) {
    var prefix = constants.WIDGET_ID_PERSPECTIVE_PREFIX;
    if (perspectiveMode === constants.MODE_PERSONALIZE) {
      prefix = constants.WIDGET_ID_PESONALIZATION_PREFIX;
    }
    return prefix + (+new Date());
  }

  function isPersonalWidget(widget) {
    var widgetId = widget && widget[constants.KEY_WIDGET_ID];
    if (!widgetId) {
      // Widet ID not present. Could be legacy perspectives
      return false;
    }
    // Check if IDs starts with personalization prefix
    return isPersonalWidgetId(widgetId);
  }

  function isPersonalWidgetId(widgetId) {
    return widgetId && widgetId.substr(0, constants.WIDGET_ID_PESONALIZATION_PREFIX.length) ===
           constants.WIDGET_ID_PESONALIZATION_PREFIX;
  }

  function hasWidgetId(widget) {
    return widget && !!widget[constants.KEY_WIDGET_ID];
  }

  function isErrorWidget(widget) {
    return widget && widget.type === 'csui/widgets/error';
  }

  function isHiddenWidget(widget) {
    if (isErrorWidget(widget)) {
      return isHiddenWidget(widget.options.originalWidget);
    }
    return widget && !isPersonalWidget(widget) && (widget[constants.KEY_HIDDEN] === true);
  }

  function setWidgetHidden(widget, hide) {
    if (isErrorWidget(widget)) {
      setWidgetHidden(widget.options.originalWidget, hide);
    } else {
      widget && (widget[constants.KEY_HIDDEN] = hide);
    }
  }

  function canPersonalizePage(type) {
    return constants.PERSONALIZE_SUPPORTED_TYPES.includes(type)
  }

  function notifyPerspectiveChanges() {
    if (!this.notified) {
      this.options.context.pmanView?.perspective.trigger("perspective:modified", this);
      this.notified = true;
    }
  }

  return {
    MODE_EDIT_PERSPECTIVE: constants.MODE_EDIT_PERSPECTIVE,
    MODE_PERSONALIZE: constants.MODE_PERSONALIZE,
    WIDGET_PERSPECTIVE_PLACEHOLDER: constants.WIDGET_PERSPECTIVE_PLACEHOLDER,
    WIDGET_SHORTCUTS: constants.WIDGET_SHORTCUTS,
    KEY_WIDGET_ID: constants.KEY_WIDGET_ID,
    WIDGET_ID_PERSPECTIVE_PREFIX: constants.WIDGET_ID_PERSPECTIVE_PREFIX,
    WIDGET_ID_PESONALIZATION_PREFIX: constants.WIDGET_ID_PESONALIZATION_PREFIX,

    isEligibleForLiveWidget: isEligibleForLiveWidget,
    hasRequiredFields: hasRequiredFields,
    isEmptyPlaceholder: isEmptyPlaceholder,
    getExtraWidgetKeys: getExtraWidgetKeys,
    getEmptyPlaceholderWidgetType: getEmptyPlaceholderWidgetType,
    generateWidgetId: generateWidgetId,
    isPersonalWidget: isPersonalWidget,
    isPersonalWidgetId: isPersonalWidgetId,
    hasWidgetId: hasWidgetId,
    isHiddenWidget: isHiddenWidget,
    setWidgetHidden: setWidgetHidden,
    canPersonalizePage,
    notifyPerspectiveChanges
  };

});

/**
 * Delta Format:
 * {
 *    "perspectiveWidgets": perspectiveWidgetIds,
 *    "personalWidgets": personalWidgets,
 *    "perspecitve_id" : 1235,
 *    "perspective_version": 1,
 *    "type" : "flow"
 *    "order": ['perspective-1', 'perspective-0', 'perspective-2', 'personalize-0'],
 *    "hidden": ['perspective-4', 'perspective-7']
*  }
 */
csui.define('csui/models/perspective/personalize/delta.generator',['module', 'csui/lib/underscore', 'csui/lib/backbone',
      'csui/utils/perspective/perspective.util'],
    function (module, _, Backbone, PerspectiveUtil) {

      var DeltaGenerator = function (options) {
        this.personalization = options.personalization;
        this.perspective = options.perspective;
        if (this.perspective instanceof Backbone.Model) {
          this.perspective = this.perspective.toJSON();
        }
      };

      _.extend(DeltaGenerator.prototype, {
        getDeltaOfCurrentPerspective: function (allPerspectiveWidgets,allPersonalWidgets) {
          allPerspectiveWidgets = _.reject(allPerspectiveWidgets, PerspectiveUtil.isPersonalWidget);
           var perspectiveWidgetIds = _.pluck(allPerspectiveWidgets, PerspectiveUtil.KEY_WIDGET_ID),
           personalWidgets = _.filter(allPersonalWidgets, PerspectiveUtil.isPersonalWidget),
           personalParts = _.partition(allPersonalWidgets, PerspectiveUtil.isHiddenWidget),
           personalActiveWidgets = _.pluck(personalParts[1], PerspectiveUtil.KEY_WIDGET_ID),
           personalHiddenWidgets = _.pluck(personalParts[0], PerspectiveUtil.KEY_WIDGET_ID);
          return {
            perspectiveWidgets: perspectiveWidgetIds,
            personalWidgets: personalWidgets,
            order: personalActiveWidgets,
            hidden: personalHiddenWidgets
          };
        },
        getDelta: function () {
          var result = _.pick(this.perspective, 'type', 'perspective_id', 'perspective_version');
          result.perspective_id = result.perspective_id || this.perspective.id;
          if (this.perspective.override) {
            _.extend(result,
                _.pick(this.perspective.override, 'perspective_id', 'perspective_version'));
          } else {
            // Possibly APIs not updated to latest. This case, lets assume the version as 1
            result.perspective_version = result.perspective_version || 1;
          }
          switch (this.perspective.type) {
            case 'flow': // flow layout
              var delta = this.getDeltaOfCurrentPerspective(this.perspective.options.widgets, this.personalization.options.widgets);
              _.extend(result, delta);
              return result;
            case 'sidepanel-right': // Right side panel layout
            case 'sidepanel-left': // Left side panel layout
              _.extend(result, {
                banner: this.getDeltaOfCurrentPerspective(this.perspective.options.banner, this.personalization.options.banner),
                content: this.getDeltaOfCurrentPerspective(this.perspective.options.content, this.personalization.options.content),
                sidebar: this.getDeltaOfCurrentPerspective(this.perspective.options.sidebar, this.personalization.options.sidebar),
              });
              return result;
            default:
              throw new Error('Personalization not supported.');
          }
        }
      });
      return DeltaGenerator;

    });


csui.define('csui/models/perspective/personalize/delta.resolver',['module', 'csui/lib/underscore', 'csui/lib/backbone',
      'csui/utils/perspective/perspective.util'],
    function (module, _, Backbone, PerspectiveUtil) {

      var DeltaResolver = function (options) {
        this.delta = options.delta;
        this.perspective = options.perspective;
        if (this.perspective instanceof Backbone.Model) {
          this.perspective = this.perspective.toJSON();
        }
      };

      _.extend(DeltaResolver.prototype, {

        resolveContent: function (perspectiveWidgets, zone) {
            zone = this.delta[zone];
            var personalWidgets = this.delta.personalWidgets || zone && zone.personalWidgets,
            widgetOrder = this.delta.order || zone && zone.order,
            hiddenWidgetIds = this.delta.hidden || zone && zone.hidden,
            personalWidgetsById, perspectiveWidgetsById, newPerspectiveWidgets,
            allActiveWidgets, hiddenWidgets;
          personalWidgets = this.delta.personalWidgets || zone && zone.personalWidgets,
            personalWidgetsById = _.indexBy(personalWidgets, PerspectiveUtil.KEY_WIDGET_ID);
          perspectiveWidgetsById = _.indexBy(perspectiveWidgets, PerspectiveUtil.KEY_WIDGET_ID);
          widgetOrder = _.filter(widgetOrder, function (widgetId) {
            return _.has(perspectiveWidgetsById, widgetId) || _.has(personalWidgetsById, widgetId);
          });

          hiddenWidgetIds = _.filter(hiddenWidgetIds, function (widgetId) {
            return _.has(perspectiveWidgetsById, widgetId);
          });

          newPerspectiveWidgets = _.filter(perspectiveWidgets, function (widget) {
            var widgetId = widget[PerspectiveUtil.KEY_WIDGET_ID];
            return !_.contains(widgetOrder, widgetId) && !_.contains(hiddenWidgetIds, widgetId);
          });

          allActiveWidgets = _.map(widgetOrder, function (widgetId) {
            if (PerspectiveUtil.isPersonalWidgetId(widgetId)) {
              return personalWidgetsById[widgetId];
            } else {
              return perspectiveWidgetsById[widgetId];
            }
          });
          hiddenWidgets = _.map(hiddenWidgetIds, function (widgetId) {
            // Make copy of original perspective view to avoid changes to it.
            var widget = _.clone(perspectiveWidgetsById[widgetId]);
            PerspectiveUtil.setWidgetHidden(widget, true);
            return widget;
          });
          return _.union(allActiveWidgets, newPerspectiveWidgets, hiddenWidgets);
        },

        canMergeDelta: function () {
          return (this.perspective.perspectiveId === this.delta.perspectiveId &&
                 this.perspective.type === this.delta.type) ||
                 //when layout is changed from sidepanel-right to sidepanel-left or vice-versa,
                 //personalized changes have to be merged
                 ((this.delta.type === 'sidepanel-right' && this.perspective.type ==='sidepanel-left')
                 || (this.delta.type === 'sidepanel-left' && this.perspective.type ==='sidepanel-right'));
        },

        getPersonalization: function () {
          if (!this.canMergeDelta()) {
            return this.perspective;
          }
          var result = _.clone(this.perspective);
          switch (this.delta.type) {
            case 'flow':
              _.extend(result, {
                options: { widgets: this.resolveContent(this.perspective.options.widgets) },
                personalizations: this.delta
              });
              return result;
            case 'sidepanel-right': // Right side panel layout
            case 'sidepanel-left': // Left side panel layout
              _.extend(result, {
                options: {
                  content: this.resolveContent(this.perspective.options.content, 'content'),
                  sidebar: this.resolveContent(this.perspective.options.sidebar, 'sidebar'),
                  banner: this.resolveContent(this.perspective.options.banner, 'banner')
                },
                personalizations: this.delta,
              });
              return result;
            default:
              return result;
          }
        }
      });

      return DeltaResolver;

    });


csui.define('csui/models/perspective/personalize/personalize.guide',['module', 'csui/models/perspective/personalize/delta.generator',
  'csui/models/perspective/personalize/delta.resolver'
], function (module, DeltaGenerator, DeltaResolver) {

  var PersonalizeGuide = {
    getDelta: function (perspective, personalization) {
      var generator = new DeltaGenerator(
          {perspective: perspective, personalization: personalization});
      return generator.getDelta();
    },

    getPersonalization: function (perspective, delta) {
      var merger = new DeltaResolver({perspective: perspective, delta: delta});
      return merger.getPersonalization();
    }
  };

  return PersonalizeGuide;

});

csui.define('csui/models/perspective/personalization.model',["require", "module", 'csui/lib/jquery', 'csui/lib/underscore', "csui/lib/backbone",
  'csui/models/node/node.model',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/perspective/personalization.server.adaptor.mixin',
  'csui/models/perspective/localstorage.server.adaptor.mixin',
  'csui/models/perspective/personalize/personalize.guide',
  'csui/utils/perspective/perspective.util'
], function (require, module, $, _, Backbone, NodeModel,
    UploadableMixin, ConnectableMixin, ServerAdaptorMixin, LocalStorageServerAdaptorMixin,
    PersonalizeGuide, PerspectiveUtil) {
  "use strict";

  var config = _.extend({
    persistOnLocalStorage: false
  }, module.config());

  var PersonalizationModel = Backbone.Model.extend({

    constructor: function PersonalizationModel(attributes, options) {
      PersonalizationModel.__super__.constructor.apply(this, arguments);
      this.options = options;
      if (config.persistOnLocalStorage) {
        this.makeServerAdaptor(options);
      } else {
        this.makeUploadable(options)
            .makeConnectable(options)
            .makeServerAdaptor(options);
      }
      this.resolvePersonalization = true;
    },

    getPerspectiveId: function () {
      return this.get('perspective_id');
    },

    getType: function() {
      return this.get('type');
    },

    getTitle: function() {
      return this.escape('title');
    },

    isNew: function () {
      return false; // personalization can be done only for an existing perspective. Hence isNew() will always be false
    },

    /**
     * Get the perspective config JSON of personalization
     */
    getPerspective: function () {
      if (!this.resolvePersonalization) {
        // No updates to delta after last resolution of personalization
        this.personalization;
      }
      this.personalization = PersonalizeGuide.getPersonalization(this.options.perspective,
          this.toJSON());
      this.resolvePersonalization = false;
      return this.personalization;
    },

    /**
     * Set the perspective config JSON of personalization
     */
    setPerspective: function (personalization, options) {
      var delta = PersonalizeGuide.getDelta(this.options.perspective, personalization);
      this.set(delta, options);
      // Mark to re-resolve of personalization from delta
      this.resolvePersonalization = true;
    },

    update: function (changes, options) {
      var personalization = this.getPerspective();
      _.extend(personalization, changes.perspective);
      this.setPerspective(personalization, options);
    },

    prepareFormData: function (data, options) {
      var payload = {
        personalizations: JSON.stringify(data),
        perspective_id: this.get('perspective_id'),
        perspective_version: this.get('perspective_version'),
        node: this.getNodeId()
      };
      return payload;
    },

    getNodeId: function () {
      return (!this.options.sourceModel || !(this.options.sourceModel instanceof NodeModel) ||
              !(this.options.sourceModel.has('id'))) ? 'landing-page' :
             this.options.sourceModel.get('id');
    },

  }, {
    loadPersonalization: function (sourceModel, context) {
      var deferred,
          perspective = sourceModel.get('perspective');
      if (!perspective) {
        // Perspective info not available in source model, hence personalization cannot exist. 
        return $.Deferred().resolve().promise();
      }
      if (config.persistOnLocalStorage) {
        deferred = PersonalizationModel.loadPersonalizationFromLocalStorage(sourceModel, context,
            perspective);
      } else if (!!perspective.personalizations) {
        var personalization = new PersonalizationModel(perspective.personalizations,
            {sourceModel: sourceModel, perspective: perspective});
        deferred = $.Deferred().resolve(personalization.getPerspective());
      } else {
        deferred = $.Deferred().resolve();
      }
      deferred.then(function (personalization) {
        if (!personalization || _.isEmpty(personalization)) {
          return undefined;
        }
        return _.defaults(personalization, {perspectiveMode: PerspectiveUtil.MODE_PERSONALIZE});
      });
      return deferred.promise();
    },

    loadPersonalizationFromLocalStorage: function (sourceModel, context, perspective) {
      var deferred = $.Deferred();
      var personalization = new PersonalizationModel({},
          {sourceModel: sourceModel, context: context, perspective: perspective});
      personalization.fetch().then(function () {
        var result = personalization.getPerspective();
        if (!_.isEmpty(result)) {
          deferred.resolve(result);
        } else {
          deferred.resolve();
        }
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }
  });

  if (config.persistOnLocalStorage) {
    LocalStorageServerAdaptorMixin.mixin(PersonalizationModel.prototype);
  } else {
    UploadableMixin.mixin(PersonalizationModel.prototype);
    ConnectableMixin.mixin(PersonalizationModel.prototype);
    ServerAdaptorMixin.mixin(PersonalizationModel.prototype);
  }

  return PersonalizationModel;

});


csui.define('csui/models/memberancestorcollection',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone'
], function (module, _, $, Backbone) {
  'use strict';

  var MemberAncestorCollection = Backbone.Collection.extend({

    constructor: function MemberAncestorCollection(model, options, context) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.context = context;
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    },

    isFetchable: function () {
      return false;
    },

    add: function( models, options ) {
      Backbone.Collection.prototype.add.apply(this, arguments); // (this, models, options) doesn't work
      this.trigger('sync', this);
    },

    findByIndex: function(id){
      for (var i = 0; i < this.models.length; i++) {
        if( this.models[i].id === id ) {
          return i;
        }
      }
      return -1;
    }

  });

  return MemberAncestorCollection;

});



//TODO Check if this should be moved to pman 
csui.define('csui/models/perspective/perspective.model',["module", 'csui/lib/underscore', "csui/lib/backbone",
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/mixins/connectable/connectable.mixin',
  "csui/utils/log", "csui/utils/base", 'csui/utils/url'
], function (module, _, Backbone, UploadableMixin, ConnectableMixin, log,
    base, Url) {
  "use strict";

  var config = _.extend({
    idAttribute: null
  }, module.config());

  var PerspectiveModel = Backbone.Model.extend({
    idAttribute: config.idAttribute,

    constructor: function PerspectiveModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.options = _.pick(options, ['connector']);
      this.makeUploadable(options)
          .makeConnectable(options);
    },

    getPerspectiveId: function() {
      return this.get('id') || this.get('av_id');
    },

    getType: function() {
      return this.getPerspective().type;
    },

    getTitle: function() {
      return this.escape('title');
    },

    getPerspective: function () {
      return this.get('perspective');
    },

    setPerspective: function (attributes, options) {
      this.set('perspective', attributes, options);
    },

    getPerspectiveRules: function(){
      return this.get("rules")
    },

    setPerspectiveRules: function(rules){
      this.set("rules", rules);
    },

    update: function (changes) {
      this.set.apply(this, arguments);
    },

    isNew: function () {
      return !((this.has("id") && this.get('id') !== 0) || this.has("av_id"))
    },

    urlBase: function () {
      var id  = this.get('id'),
          url = this.connector.connection.url;
      if (!id) {
        // Create a new node by POST /perspectives
        url = Url.combine(url, 'perspectives');
      } else if (!_.isNumber(id) || id > 0) {
        // Access an existing node by VERB /perspectives/:id
        url = Url.combine(url, 'perspectives', id);
      } else {
        throw new Error('Unsupported id value');
      }
      return url;
    },

    url: function () {
      var url = this.urlBase();
      return url;
    },

    prepareFormData: function (data, options) {
      return {pData: JSON.stringify(data)};
    }
  });

  UploadableMixin.mixin(PerspectiveModel.prototype);
  ConnectableMixin.mixin(PerspectiveModel.prototype);

  return PerspectiveModel;

});

csui.define('csui/models/perspective/server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/url'
], function (_, $, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        isFetchableDirectly: function () {
          return this.get('id') > 0;
        },

        urlBase: function () {
          var id  = this.get('id'),
              url = this.connector.connection.url;
          let query;
          if (this.has('personalize')) {
            query = Url.combineQueryString({
              personalize: this.get('personalize'),
            });
          }
          if (!id) {
            // Create a new node by POST /perspectives
            url = Url.combine(url, 'perspectives');
          } else if (!_.isNumber(id) || id > 0) {
            // Access an existing node by VERB /perspectives/:id
            url = Url.combine(url, 'perspectives', id);
          } else {
            throw new Error('Unsupported id value');
          }
          if(query){
            url += '?' + query;
          }
          return url;
        },

        url: function () {
          var url = this.urlBase();
          return url;
        },

        parse: function (response) {

          var perspectives = response.perspectives;
          if (!perspectives) {
            // Update response
            return response;
          }

          if(perspectives.length === 0){
            // Perspectives are empty for GET request
            return {};
          }
          perspectives = _.each(perspectives, function (perspective) {
            perspective.cascading = perspective.cascading + '';
            perspective.containerType = perspective.container_type;
            perspective.constantData = perspective.constant_data;
            perspective.overrideType = perspective.override_type;
            perspective.overrideId = perspective.override_id;
            perspective.nodepath = perspective.node_path;
            perspective.rules = perspective.rule_data;
            perspective.perspective = JSON.parse(perspective.perspective);
            perspective.constant_extraction_mode = perspective.container_type;
            perspective.pnodepath = perspective.perspective_node_path;
          });
          return {
            'perspectives': perspectives
          };
        }
      });
    }
  };

  return ServerAdaptorMixin;
});
  

//TODO Check if this should be moved to pman
csui.define('csui/models/perspective/perspective.template.model',["module", 'csui/lib/underscore', "csui/lib/backbone",
  "csui/models/perspective/server.adaptor.mixin",
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/perspective/perspective.model',
  "csui/utils/log", "csui/utils/base"
], function (module, _, Backbone, ServerAdaptorMixin, UploadableMixin, ConnectableMixin,
    PerspectiveModel, log,
    base) {
  "use strict";

  var config = _.extend({
    idAttribute: null
  }, module.config());

  var PerspectiveTemplateModel = Backbone.Model.extend({
    idAttribute: config.idAttribute,

    constructor: function PerspectiveTemplateModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.options = _.pick(options, ['connector']);
      this.makeUploadable(options)
          .makeConnectable(options)
          .makeServerAdaptor(options);
    },

    isNew: function () {
      return !this.get('id') || this.get('id') === 0;
    },

    isFetchable: function () {
      return !!this.get('id');
    },

    set: function (key, value, options) {
      var attrs;
      if (key == null) {
        return this;
      }
      if (typeof key === 'object') {
        attrs = key;
        options = value;
      } else {
        (attrs = {})[key] = value;
      }
      if (attrs.perspectives) {
        key = 'perspectives';
        var perspectiveCollection = new Backbone.Collection();
        options = _.pick(this.options, ['connector']);

        _.each(attrs.perspectives, function (perspective) {
          //default 'id' for the current perspective model will be replaced with perspective 'id'
          //later  as models in the collection need to have unique 'id'
          perspectiveCollection.add(new PerspectiveModel(perspective, options));
        });
        value = perspectiveCollection;
        (attrs = {})[key] = value;
      }
      // do the usual set
      return Backbone.Model.prototype.set.call(this, attrs, options);
    }
  });

  UploadableMixin.mixin(PerspectiveTemplateModel.prototype);
  ConnectableMixin.mixin(PerspectiveTemplateModel.prototype);
  ServerAdaptorMixin.mixin(PerspectiveTemplateModel.prototype);

  return PerspectiveTemplateModel;

});


csui.define('csui/models/perspective/personalize/personalization.collection.mixin',[
  'csui/utils/url',
  'csui/utils/perspective/perspective.util'
], function (Url, PerspectiveUtil) {
  'use strict';

  const PersonalizationCollectionMixin = {
    mixin: function (prototype) {
      return Object.assign(prototype, {
        makeServerAdaptor: function () {
          return this;
        },

        url: function () {
          const apiUrl = new Url(this.connector.connection.url).getApiBase(2);
          let url;
          url = Url.combine(apiUrl, 'perspectives/myperspectives');
          return url;
        },

        parse: function (response) {
          let personalizationCollection = [];
          if (Array.isArray(response.results)) {
            for (let perspective of response.results) {
              if (this.options.removeUnsupportedPagesForPersonalization && !(PerspectiveUtil.canPersonalizePage(perspective.layoutType)))
                continue;
              personalizationCollection.push({
                perspective_id: perspective.dataid,
                title: perspective.name,
                type: perspective.layoutType,
                default: perspective.isDefault,
                hasOnlybasicPerspectiveInfo: true //flag used to fetch complete perspective information
              });
            }
          }
          return personalizationCollection;
        }
      });
    }
  };
  return PersonalizationCollectionMixin;
});

csui.define('csui/models/perspective/personalize/personalization.collection',[
  'csui/lib/backbone',
  'csui/models/perspective/personalization.model',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/perspective/personalize/personalization.collection.mixin'
], function (Backbone, PersonalizationModel, ConnectableMixin, PersonalizationCollectionMixin) {

  const PersonalizationCollection = Backbone.Collection.extend({
    model: PersonalizationModel,
    constructor: function PersonalizationCollection(options = {}) {
      this.options = options;
      Backbone.Collection.prototype.constructor.call(this, [], options);
      this.makeConnectable(options)
        .makeServerAdaptor(options);
    }
  });

  ConnectableMixin.mixin(PersonalizationCollection.prototype);
  PersonalizationCollectionMixin.mixin(PersonalizationCollection.prototype);

  return PersonalizationCollection;
});

csui.define('csui/models/perspective/perspective.collection/perspective.collection.mixin',['csui/utils/url'
], function ( Url) {
  'use strict';

  const PerspectiveCollectionMixin = {
    mixin: function (prototype) {
      return Object.assign(prototype, {
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
          if (Array.isArray(response.results)) {
            for (let perspective of response.results) {
              perspectiveCollection.push({
                av_id: perspective.dataid,
                title: perspective.name,
                perspective: { type: perspective.layoutType },
                default: perspective.isDefault,
                hasOnlybasicPerspectiveInfo: true, //flag used to fetch complete perspective information
                enabled: perspective.enabled,
                departmentId: perspective.departmentId
              });
            }
          }
          return perspectiveCollection;
        }
      });
    }
  };
  return PerspectiveCollectionMixin;
});

csui.define('csui/models/perspective/perspective.collection/perspective.collection',[
  'csui/lib/backbone',
  'csui/models/perspective/perspective.model',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/perspective/perspective.collection/perspective.collection.mixin',
], function (Backbone, PerspectiveModel, ConnectableMixin, PerspectiveCollectionMixin) {

  const PerspectiveCollection = Backbone.Collection.extend({
    model: PerspectiveModel,
    constructor: function PerspectiveCollection(options = {}) {
      this.options = options;
      Backbone.Collection.prototype.constructor.call(this, [], options);
      this.makeConnectable(options)
        .makeServerAdaptor(options);
    }
  });

  ConnectableMixin.mixin(PerspectiveCollection.prototype);
  PerspectiveCollectionMixin.mixin(PerspectiveCollection.prototype);

  return PerspectiveCollection;
});


// Return's object of experimental widget or features
csui.define('csui/utils/exp.widget.config',['module'],
  function (module) {
    return module.config();
  });

csui.define('csui/models/widget/widget.model',[
  'require', 'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/utils/log',
  'csui/models/server.module/server.module.collection',
  'csui/models/tool.item.config/tool.item.config.collection',
  'csui/models/tool.item.mask/tool.item.mask.collection',
  'csui/utils/exp.widget.config'
], function (require, module, _, $, Backbone, log,
    ServerModuleCollection, ToolItemConfigCollection, ToolItemMaskCollection, ExpWidgetConfig) {
  'use strict';

  log = log(module.id);

  var WidgetModel = Backbone.Model.extend({

    defaults: {
      id: null,       // Require.js module ID
      view: null,     // Resolved function object of the widget's view controller
      manifest: null, // Resolved meta-data describing the widget
      error: null     // Error from the widget's resolution if it failed
    },

    constructor: function WidgetModel(attributes, options) {
      this.options = _.defaults({}, options, {
        includeView: true,
        includeManifest: true,
        includeServerModule: true,
        includeToolItems: true
      });
      if (this.options.includeToolItems) {
        this.options.includeManifest = true;
      }
      WidgetModel.__super__.constructor.call(this, attributes, this.options);
      this.serverModule = new ServerModuleCollection.prototype.model();
      this.actions = new Backbone.Collection();
    },

    getDefaultData: function () {
      var manifest = this.get('manifest');
      return manifest ? this._getDefaultPropertyValue(manifest.schema) : {};
    },

    _getDefaultPropertyValue: function (schema) {
      if (schema) {
        if (schema.type === 'object') {
          return _.reduce(schema.properties,
              function (result, propertySchema, propertyName) {
                result[propertyName] = this._getDefaultPropertyValue(propertySchema);
                return result;
              }, {}, this);
        }
        return schema['default'];
      }
    },

    _getDefaultPrimitiveValue: function (schema) {
      if (schema) {
        var value = schema['default'];
        if (value !== undefined) {
          return value;
        }
        switch (schema.type) {
        case 'string':
          return '';
        case 'integer':
        case 'number':
          return 0;
        case 'boolean':
          return false;
        case 'array':
          return [];
        case 'null':
          return null;
        }
      }
    },

    sync: function (method, collection, options) {
      if (method !== 'read') {
        throw new Error('Only fetching the widget is supported.');
      }
      options = _.extend({}, this.options, options);
      _.defaults(options, {
        includeView: this.options.includeView,
        includeManifest: this.options.includeManifest,
        includeServerModule: this.options.includeServerModule,
        includeToolItems: this.options.includeToolItems
      });
      if (options.includeToolItems) {
        options.includeManifest = true;
      }
      var serverModulesPromise = this._resolveServerModules(options),
          toolItemsPromise     = this._resolveToolItems(options),
          toolItemMasksPromise = this._resolveToolItemMasks(options),
          self                 = this;
      return $.when(serverModulesPromise, toolItemsPromise, toolItemMasksPromise)
          .then(_.bind(this._resolveWidget, this, options))
          .then(function () {
            var response = self.toJSON();
            options.success && options.success(response, options);
            self.trigger('sync', self, response, options);
          }, function () {
            var error = self.get('error');
            options.error && options.error(error, options);
            self.trigger('error', self, error, options);
            return $.Deferred().reject(error);
          });
    },

    _resolveWidget: function (options) {
      var viewPromise     = this._resolveView(options),
          manifestPromise = this._resolveManifest(options),
          self            = this;
      return $.when(viewPromise, manifestPromise)
          .then(function () {
            self._updateServerModule(options);
            self._updateActions(options);
          });
    },

    _isExpWidgetEnable: function(widget){
      if(!widget || !ExpWidgetConfig) return;
      const { expWidgetConfig } = ExpWidgetConfig[widget.path] || {};
      if(expWidgetConfig && !expWidgetConfig.isBothEnable){
        widget.path = expWidgetConfig.newWidget;
        const list = expWidgetConfig.newWidget?.split('/');
        if(list.length>0) 
          widget.name = list[list.length-1];
      }
    },

    _resolveView: function (options) {
      var deferred = $.Deferred();
      if (options.includeView) {
        const self       = this;
        const widgetData = this.getModuleData();
        this._isExpWidgetEnable(widgetData);
        const viewPath   = this.getViewModulePath(widgetData);
        require([viewPath],
            function (View) {
              self.set('view', View);
              deferred.resolve();
            }, function (error) {
              self.set('error', error);
              if (options.ignoreErrors) {
                deferred.resolve();
              } else {
                deferred.reject(error);
              }
            });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },

    _resolveManifest: function (options) {
      var deferred = $.Deferred();
      if (options.includeManifest) {
        const self         = this;
        const  widgetData   = this.getModuleData();
        this._isExpWidgetEnable(widgetData);
        const manifestPath = this.getManifestModulePath(widgetData);
        require([manifestPath],
            function (manifest) {
              if (self._needsLocalization(manifest)) {
                var manifestLocalizedPath = self.getLocalizedManifestModulePath(widgetData);
                require([manifestLocalizedPath],
                    function (manifestLocalized) {
                      manifest = WidgetModel.resolveLocalizedManifest(manifestPath,
                          manifest, manifestLocalized);
                      self.set('manifest', manifest);
                      deferred.resolve();
                    }, function (error) {
                      if (!self.has('error')) {
                        self.set('error', error);
                      }
                      if (options.ignoreErrors || options.ignoreManifestErrors) {
                        // If errors are ignored, return not localized manifest;
                        // if it were undefined, non-robust consumers might crash
                        self.set('manifest', manifest);
                        deferred.resolve();
                      } else {
                        deferred.reject(error);
                      }
                    });
              } else {
                self.set('manifest', manifest);
                deferred.resolve();
              }
            }, function (error) {
              if (!self.has('error')) {
                self.set('error', error);
              }
              if (options.ignoreErrors || options.ignoreManifestErrors) {
                // If errors are ignored, return an empty manifest;
                // if it were undefined, non-robust consumers might crash
                self.set('manifest', {});
                deferred.resolve();
              } else {
                deferred.reject(error);
              }
            });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },

    _resolveServerModules: function (options) {
      var serverModules;
      if (options.includeServerModule && !options.serverModules) {
        options.serverModules = serverModules = new ServerModuleCollection();
        return serverModules.fetch({ignoreErrors: options.ignoreErrors});
      }
      return $.Deferred().resolve().promise();
    },

    _resolveToolItems: function (options) {
      var toolItems;
      if (options.includeToolItems && !options.toolItems) {
        options.toolItems = toolItems = new ToolItemConfigCollection();
        return toolItems.fetch({ignoreErrors: options.ignoreErrors});
      }
      return $.Deferred().resolve().promise();
    },

    _resolveToolItemMasks: function (options) {
      var toolItemMasks;
      if (options.includeToolItems && !options.toolItemMasks) {
        options.toolItemMasks = toolItemMasks = new ToolItemMaskCollection();
        return toolItemMasks.fetch({ignoreErrors: options.ignoreErrors});
      }
      return $.Deferred().resolve().promise();
    },

    _getModulePrefix: function () {
      var name       = this.get('id'),
          firstSlash = name.indexOf('/');
      // Enable widget names without the module path for the core widgets;
      // compatibility for early perspectives, which did not use full paths
      return firstSlash < 0 ? 'csui' : name.substring(0, firstSlash);
    },

    getModuleData: function () {
      var name      = this.get('id'),
          lastSlash = name.lastIndexOf('/'),
          path;
      // Enable widget names without the module path for the core widgets;
      // compatibility for early perspectives, which did not use full paths
      if (lastSlash < 0) {
        path = 'csui/widgets/' + name;
      } else {
        path = name;
        name = name.substring(lastSlash + 1);
      }
      return {
        name: name,
        path: path
      };
    },

    getViewModulePath: function (moduleData) {
      return moduleData.path + '/' + moduleData.name + '.view';
    },

    getManifestModulePath: function (moduleData) {
      return 'json!' + moduleData.path + '/' + moduleData.name + '.manifest.json';
    },

    getLocalizedManifestModulePath: function (moduleData) {
      return 'i18n!' + moduleData.path + '/impl/nls/' + moduleData.name + '.manifest';
    },

    _updateServerModule: function (options) {
      if (options.includeServerModule) {
        var modulePrefix = this._getModulePrefix(),
            serverModule = options.serverModules.get(modulePrefix),
            attributes   = serverModule && serverModule.toJSON() ||
                {id: modulePrefix};
        this.serverModule.set(attributes);
      }
    },

    _updateActions: function (options) {
      if (options.includeToolItems) {
        var manifest = this.get('manifest'),
            actions  = manifest && manifest.actions;
        this.actions.reset(actions, {silent: true});
        this.actions.each(function (action) {
          action.toolItems = options.toolItems.get(action.get('toolItems'));
          action.toolItemMasks = options.toolItemMasks.get(action.get('toolItemMasks'));
          action.toolbars = new Backbone.Collection(action.get('toolbars'));
        });
        if (!options.silent) {
          this.actions.trigger('reset', this.actions, options);
        }
      }
    },

    _needsLocalization: function (object) {
      function isLocalizableString(value) {
        return typeof value === 'string' && value.indexOf('{{') === 0 &&
               value.lastIndexOf('}}') === value.length - 2;
      }

      var value;

      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          value = object[key];
          if (isLocalizableString(value)) {
            return true;
          } else if (_.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
              if (isLocalizableString(value[i])) {
                return true;
              }
            }
          } else if (typeof value === 'object') {
            return this._needsLocalization(value);
          }
        }
      }
    }

  }, {
    resolveLocalizedManifest: function (manifestPath, manifest, localizedManifest) {
      function traverseManifest(object, localizedManifestParent) {
        var key, value, localizationKey, arrayItem, localizationArrayItem, i;

        function getLocalizationKey(value) {
          return _.isString(value) && value.indexOf('{{') === 0 &&
                 value.lastIndexOf('}}') === value.length - 2 &&
                 value.substring(2, value.length - 2);
        }

        for (key in object) {
          if (object.hasOwnProperty(key)) {
            value = object[key];
            localizationKey = getLocalizationKey(value);
            if (localizationKey) {
              // Support both real and dummy localization keys
              object[key] = localizedManifestParent[localizationKey] ||
                            localizedManifestParent[key] ||
                            // Show the localization string key in case
                            // the value is missing
                            value;
            } else if (_.isArray(value)) {
              localizationArrayItem = localizedManifestParent[key] || [];
              for (i = 0; i < value.length; ++i) {
                arrayItem = value[i];
                localizationKey = getLocalizationKey(arrayItem);
                if (localizationKey) {
                  // Support both array of dummy placeholders and flat
                  // localization by unique property names.
                  value[i] = localizationArrayItem[i] ||
                             // Support both real and dummy localization keys
                             localizedManifestParent[localizationKey] ||
                             localizedManifestParent[key] ||
                             // Show the localization string key in case
                             // the value is missing
                             arrayItem;
                } else if (_.isObject(arrayItem)) {
                  // Support both hierarchical and flat localization modules
                  value[i] = traverseManifest(arrayItem, localizationArrayItem[i] ||
                                                         localizedManifestParent);
                }
              }
            } else if (_.isObject(value)) {
              if (localizedManifestParent[key]) {
                log.warn(
                    'Hierarchical format has been detected in the localization ' +
                    'module "{0}". It has been deprecated and the support for it ' +
                    'will be removed. Please, change it to the flat format as soon ' +
                    'as possible. Although JSON format allows using nested objects, ' +
                    'automated translation tools can handle only key-value pairs. ' +
                    'That is why localization modules has to contain only one ' +
                    'object with properties pointing to strings.', manifestPath)
                && console.log(log.last);
              }
              // Support both hierarchical and flat localization modules
              object[key] = traverseManifest(value, localizedManifestParent[key] ||
                                                    localizedManifestParent);
            }
          }
        }
        return object;
      }

      return traverseManifest(manifest, localizedManifest);
    },
  });

  return WidgetModel;

});


csui.define('csui/models/widget/widget.collection',[
  'require', 'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/models/widget/widget.model',
  'csui/models/server.module/server.module.collection',
  'csui/models/tool.item.config/tool.item.config.collection',
  'csui/models/tool.item.mask/tool.item.mask.collection',
  'csui/utils/exp.widget.config'
], function (require, module, _, $, Backbone, WidgetModel,
    ServerModuleCollection, ToolItemConfigCollection, ToolItemMaskCollection, ExpWidgetConfig) {
  'use strict';

  var widgets = module.config().widgets || [];
  if(Array.isArray(widgets.cssvui) && widgets.cssvui.length>0){
    // merging the cssvui widgets to csui and remove the dulpicates
    widgets.csui = _.union(widgets.csui, widgets.cssvui);
    delete widgets.cssvui; // removing it from the list
  }
  const orientExpWidgets = (widgets, ExpWidgetConfig) => {
    const expWidgetsList = ExpWidgetConfig;
    const widgetsList = Object.keys(expWidgetsList);
    const noOfWidgets = widgetsList.length;
    if (noOfWidgets === 0) return;

    for (let i = 0; i < noOfWidgets; i++) {
      const oldWidget = widgetsList[i];
      const { expWidgetConfig } = expWidgetsList[oldWidget] || {};
      const {moduleName, newWidget, isBothEnable} = expWidgetConfig || {};
      const module =  widgets[moduleName];
      if(newWidget && Array.isArray(module)){
        if(!isBothEnable){
          const indexOfOldWidget = module.indexOf(oldWidget);
          indexOfOldWidget>-1 && module.splice(indexOfOldWidget, 1);
        }
        module.push(newWidget);
      }
    }

  }
  orientExpWidgets(widgets, ExpWidgetConfig);
  // Support either array of module IDs or a map with keys pointing
  // to arrays of module IDs; the latter can be used for decentralized
  // configuration (multiple calls to require.config, which merge maps,
  // but not arrays)
  if (!_.isArray(widgets)) {
    widgets = Array.prototype.concat.apply([], _.values(widgets));
  }
  // Convert the array of widget names to model attributes
  widgets = _.map(widgets, function (name) {
    return {
      id: name
    };
  });

  var WidgetCollection = Backbone.Collection.extend({

    model: WidgetModel,

    constructor: function WidgetCollection(models, options) {
      // Store the options before calling the parent constructor;
      // model processing in _prepareModel may access the options
      this.options = _.defaults({}, options, {
        includeView: true,
        includeManifest: true,
        includeServerModule: true,
        includeToolItems: true
      });
      if (this.options.includeToolItems) {
        this.options.includeManifest = true;
      }
      models || (models = widgets);
      WidgetCollection.__super__.constructor.call(this, models, options);
    },

    sync: function (method, collection, options) {
      if (method !== 'read') {
        throw new Error('Only fetching the widgets is supported.');
      }
      var self = this;
      options = _.extend({}, this.options, options);
      if (options.includeToolItems) {
        options.includeManifest = true;
      }
      var serverModulesPromise = this._resolveServerModules(options),
          toolItemsPromise     = this._resolveToolItems(options),
          toolItemMasksPromise = this._resolveToolItemMasks(options);
      return $.when(serverModulesPromise, toolItemsPromise, toolItemMasksPromise)
              .then(_.bind(this._resolveWidgets, this, options))
              .then(function () {
                var response = self.toJSON();
                options.success && options.success(response, options);
                self.trigger('sync', self, response, options);
              });
    },

    _prepareModel: function (attrs, options) {
      options || (options = {});
      _.defaults(options, {
        includeView: this.options.includeView,
        includeManifest: this.options.includeManifest,
        includeServerModule: this.options.includeServerModule,
        includeToolItems: this.options.includeToolItems
      });
      return WidgetCollection.__super__._prepareModel.call(this, attrs, options);
    },

    _resolveServerModules: function (options) {
      var serverModules = options.serverModules;
      if (serverModules || !options.includeServerModule) {
        return $.Deferred().resolve().promise();
      }
      serverModules = options.serverModules = new ServerModuleCollection();
      return serverModules.fetch({ignoreErrors: options.ignoreErrors !== false});
    },

    _resolveToolItems: function (options) {
      var toolItems = options.toolItems;
      if (toolItems || !options.includeToolItems) {
        return $.Deferred().resolve().promise();
      }
      toolItems = options.toolItems = new ToolItemConfigCollection();
      return toolItems.fetch({ignoreErrors: options.ignoreErrors !== false});
    },

    _resolveToolItemMasks: function (options) {
      var toolItemMasks = options.toolItemMasks;
      if (toolItemMasks || !options.includeToolItems) {
        return $.Deferred().resolve().promise();
      }
      toolItemMasks = options.toolItemMasks = new ToolItemMaskCollection();
      return toolItemMasks.fetch({ignoreErrors: options.ignoreErrors !== false});
    },

    _resolveWidgets: function (options) {
      var resolvableModels = this.filter(function (model) {
            // A resolvable widget must have an ID and it was already resolved
            // neither with a success nor with a failure
            return model.has('id') &&
                   !(model.has('view') || model.has('manifest') || model.has('error'));
          }),
          promises = _.invoke(resolvableModels, 'fetch', {
            ignoreErrors: options.ignoreErrors !== false,
            ignoreManifestErrors: options.ignoreManifestErrors !== false,
            includeView: options.includeView,
            includeManifest: options.includeManifest,
            includeServerModule: options.includeServerModule,
            includeToolItems: options.includeToolItems,
            serverModules: options.serverModules,
            toolItems: options.toolItems,
            toolItemMasks: options.toolItemMasks
          });
      return $.when.apply($, promises);
    }

  });

  return WidgetCollection;

});


csui.define('csui/models/zipanddownload/zipanddownload.preflight',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin'
], function (module, _, $, Backbone, Url, ConnectableMixin, UploadableMixin) {
  'use strict';

  var config = _.extend({
    idAttribute: null
  }, module.config());

  var PreFlightModel = Backbone.Model.extend({

    constructor: function PreFlightModel(attributes, options) {
      attributes || (attributes = {});
      options || (options = {});
      this.options = options;

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.options.connector = options.collection && options.collection.connector ||
                               options.container && options.container.connector ||
                               options.nodes.models && options.nodes.models[0].connector;
      this.makeConnectable(options)
          .makeUploadable(options);
    },

    urlBase: function () {
      var queryString = "",
          url         = this.options.connector.getConnectionUrl().getApiBase('v2');
      url = Url.combine(url, 'zipanddownload');

      if (this.preflight) {
        // Create a new permission model by POST
        url = Url.combine(url, 'preflight', queryString);
      } else {
        url = Url.combine(url, queryString);
      }
      return url;
    },

    url: function () {
      var url   = this.urlBase(),
          query = null;
      return query ? url + '?' + query : url;
    },

    parse: function (response, options) {
      return response;
    }
  });
  ConnectableMixin.mixin(PreFlightModel.prototype);
  UploadableMixin.mixin(PreFlightModel.prototype);

  return PreFlightModel;
});


csui.define('csui/models/zipanddownload/zipanddownload.stages',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin'
], function (_, $, Backbone, URL, ConnectableMixin) {
  'use strict';

  var StagesModel = Backbone.Model.extend({
    constructor: function StageModel(attributes, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options);
    },

    url: function () {
      var url = this.options.connector.getConnectionUrl().getApiBase('v2');
      return URL.combine(url, 'zipanddownload', this.get('id'));
    },

    parse: function (response) {
      this.updateLocation(response.results.data.jobs);
      return response.results.data.jobs;
    },

    updateLocation: function (jobs) {
      if (jobs.complete && jobs.unprocessed_items_list && jobs.unprocessed_items_list.length > 0) {
        _.each(jobs.unprocessed_items_list, function (model, value) {
          if (model.path) {
            var locations = model.path.split('\\');
            if (locations.length > 0 && locations[locations.length - 1] !== "") {
              model.parentLocation = locations[locations.length - 1];
            } else if (locations.length > 0) {
              model.parentLocation = locations[locations.length - 2];
            }
          }
        });
      }
    }
  });
  ConnectableMixin.mixin(StagesModel.prototype);
  return StagesModel;
});

/**
 * This utility will send the mime type information needed by SmartUI.
 * For example, if we upload any un-recognized file as part of document upload, default browser
 * file input returns blank for such files, in this case, let's list out those frequently
 * un-recognized file types. For example, drawing files, jar, war files etc.,
 */
csui.define('csui/utils/mime.types',[
  'csui/lib/underscore'
], function (_) {
  'use strict';

  function getMimeType(fileName) {
    if (!fileName || fileName.indexOf('.') === -1) {
      return '';
    }

    var mimeType = '',
        name     = fileName.split('.').pop();

    switch (name) {
    case 'dwg':
    case 'dxf':
    case 'svf':
      mimeType = 'drawing/dwg';
      break;
    case 'jar':
    case 'war':
      mimeType = 'application/x-zip';
      break;
    case 'XLS5':
    case 'xlb':
    case 'xlsx':
      mimeType = 'application/vnd.ms-excel';
      break;
    case 'pptx':  //chrome does not provide the 'type' information for office docs while drand drop from desktop.
    case 'ppt':
      mimeType = 'application/vnd.ms-powerpoint';
      break;
    case 'docx':
    case 'doc':
      mimeType = 'application/msword';
      break;
    case 'vob':
      mimeType = 'video/mpeg';
      break;
    case 'odf':
    case 'xsm':
      mimeType = 'application/vnd.oasis.opendocument.formula';
      break;
    }

    return mimeType;
  }

  return {
    getMimeType: getMimeType
  };

});



csui.define('csui/utils/classic.nodes/classic.nodes',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external Classic UI node rules
  'csui-ext!csui/utils/classic.nodes/classic.nodes'
], function (_, Backbone, Url, RulesMatchingMixin, rules) {
  'use strict';

  var ClassicNodeModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      url: null,
      urlQuery: null,
      force: false
    },

    constructor: function ClassicNodeModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });

  RulesMatchingMixin.mixin(ClassicNodeModel.prototype);

  var ClassicNodeCollection = Backbone.Collection.extend({
    model: ClassicNodeModel,
    comparator: 'sequence',

    constructor: function ClassicNodeCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findByNode: function (node, options) {
      var model = this.find(function (item) {
        return item.matchRules(node, item.attributes);
      });
      if (model) {
        return {
          url: this._getUrl(model, node, options),
          forced: model.get('forced')
        };
      }
    },

    isForced: function (node, options) {
      return this.some(function (item) {
        return item.get('forced') &&
               item.matchRules(node, item.attributes);
      });
    },

    isSupported: function (node, options) {
      return this.some(function (item) {
        return item.matchRules(node, item.attributes);
      });
    },

    getUrl: function (node, options) {
      var model = this.find(function (item) {
        return item.matchRules(node, item.attributes);
      });
      if (model) {
        return this._getUrl(model, node, options);
      }
    },

    _getUrl: function (model, node, options) {
      var url = model.get('url');
      if (url) {
        // Receive a complete URL
        if (typeof url === 'string') {
          url = this._replaceParameters(url, node.attributes);
        } else if (typeof url === 'function') {
          url = url(node);
        }
      } else {
        var urlQuery = model.get('urlQuery');
        if (urlQuery) {
          // Receive a URL query to be appended to the CGI URL
          if (typeof urlQuery === 'string') {
            urlQuery = this._replaceParameters(urlQuery, node.attributes);
          } else if (typeof urlQuery === 'function') {
            urlQuery = urlQuery(node);
          }
          var connector = options && options.connector || node.connector;
          if (connector) {
            url = new Url(connector.connection.url).getCgiScript();
          } else {
            url = '';
          }
          urlQuery = Url.combineQueryString(urlQuery);
          url = Url.appendQuery(url, urlQuery);
        }
      }
      return url;
    },

    _replaceParameters: function (expression, node) {
      var attributes = node.attributes,
          parameter = /{([^}]+)}/g,
          match, names, value, index;
      // Go over every parameter placeholder found
      while ((match = parameter.exec(expression))) {
        names = match[1].split('.');
        value = attributes;
        // Nested object property names are separated by dots
        _.find(names, function (name) {
          value = value[name];
          if (value == null) {
            value = '';
            return true;
          }
        });
        // Replace the placeholder with the value found
        index = match.index;
        expression = expression.substring(0, index) +
                     encodeURIComponent(value) +
                     expression.substring(index + match[0].length);
      }
      return expression;
    }
  });

  var classicNodes = new ClassicNodeCollection();

  if (rules) {
    classicNodes.add(_.flatten(rules, true));
  }

  return classicNodes;
});




csui.define('csui/utils/defaultactionitems',[
  'csui/lib/underscore', 'csui/models/actionitems',
  // Load and register external default action rules
  'csui-ext!csui/utils/defaultactionitems'
], function (_, ActionItemCollection, rules) {
  'use strict';

  var defaultActionItems = new ActionItemCollection();

  if (rules) {
    defaultActionItems.add(_.flatten(rules, true));
  }

  return defaultActionItems;
});


csui.define('csui/utils/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/utils/impl/nls/root/lang',{

  // nodesprites - node types
  NodeTypeSearchQuery: 'Search',
  NodeTypeSearchForm: 'Search form',
  NodeTypeURL: 'Web Address',
  // nodesprites - general formats
  NodeTypeAudio: 'Audio',
  NodeTypeCompressed: 'Compressed File',
  NodeTypeImage: 'Image',
  NodeTypeText: 'Text Document',
  NodeTypeHtml: 'Html Document',
  NodeTypeUnknown: 'Unknown',
  NodeTypeVideo: 'Video',
  // nodesprites - application formats
  NodeTypeDOC: 'Microsoft Word',
  NodeTypePDF: 'Portable Document Format',
  NodeTypePPT: 'Microsoft Powerpoint',
  NodeTypePresentation: 'Presentation',
  NodeTypeXLS: 'Microsoft Excel',
  NodeTypeSpreadsheet: 'Spreadsheet',
  NodeTypeFormula: 'Formula',
  NodeTypePublisher: 'Microsoft Publisher',
  NodeTypeVisio: 'Microsoft Visio',
  NodeTypeMPP: 'Microsoft Project',
  NodeTypeONE: 'Microsoft OneNote',
  NodeTypeSDD: 'Document template',
  NodeTypeDWG: 'Autocad Drawing',

  //templates - thumbnail
  Loading:"Loading...",
  NotAvailable:"Not available."

});






csui.define('csui/utils/nodesprites',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  'i18n!csui/utils/impl/nls/lang',
  // Load and register external cell views
  'csui-ext!csui/utils/nodesprites',
  'csui/themes/csui.jato.mime.icons'
], function (_, Backbone, RulesMatchingMixin, lang, extraIcons, jatoIcons) {

  var NodeSpriteModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      className: null
    },

    constructor: function NodeSpriteModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }

  });

  RulesMatchingMixin.mixin(NodeSpriteModel.prototype);

  var NodeSpriteCollection = Backbone.Collection.extend({

    model: NodeSpriteModel,
    comparator: "sequence",

    constructor: function NodeSpriteCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findClass: function (compareType, key, val) {
      var nodeSprite = this.find(function (item) {
        var values = item.get(compareType);
        if (values === undefined) {
          return undefined;
        }
        if (_.isArray(values[key])) {
          var keyValues = values[key];
          for (var i = 0; i < keyValues.length; i++) {
            if (keyValues[i] === val) {
              return true;
            }
          }
        }

        return (values[key] === val);
      });
      return nodeSprite ? nodeSprite.get('className') : undefined;
    },

    findTypeByNode: function (node) {
      var typeName = node.get('type_name') || lang.NodeTypeUnknown;

      var nodeSprite = this.findByNode(node);
      if (nodeSprite) {
        var spriteName = _.result(nodeSprite.attributes, 'mimeType');
        if (spriteName) {
          typeName = spriteName;
        }
      }

      return typeName;
    },

    findClassByNode: function (node, iconType = 'className') {
      var nodeSprite = this.findByNode(node);
      return nodeSprite && _.result(nodeSprite.attributes, iconType) || '';
    },

    findByNode: function (node) {
      // FIXME: Show the original icon with a shortcut overlay, as soon as agreed
      // If the node is a shortcut and the original_id is expanded to contain
      // the node data, we can show the original icon with a small arrow overlay.
      //if (node.original && node.original.has('type')) {
      //  node = node.original;
      //}
      return this.find(function (item) {
        return item.matchRules(node, item.attributes);
      });
    }

  });

  // MS Office: http://filext.com/faq/office_mime_types.php
  // OpenOffice: https://www.openoffice.org/framework/documentation/mimetypes/mimetypes.html

  var nodeSprites = new NodeSpriteCollection([
    {
      // excel
      equalsNoCase: {
        mime_type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
          'application/vnd.ms-excel.sheet.macroEnabled.12',
          'application/vnd.ms-excel.template.macroEnabled.12',
          'application/vnd.ms-excel.addin.macroEnabled.12',
          'application/vnd.ms-excel.sheet.binary.macroEnabled.12'
        ]
      },
      className: 'csui-icon mime_excel',
      iconName: 'csui_mime_excel',
      jatoIcon: jatoIcons.mimeExcel,
      mimeType: lang.NodeTypeXLS,
      sequence: 50
    },
    {
      // visio
      equalsNoCase: {
        mime_type: [
          'application/visio',
          'application/x-visio',
          'application/vnd.visio',
          'application/visio.drawing',
          'application/vsd',
          'application/x-vsd',
          'image/x-vsd',
          'application/vnd.visio2013',
          'application/vnd.ms-visio.drawing',
          'application/vnd.ms-visio.viewer',
          'application/vnd.ms-visio.stencil',
          'application/vnd.ms-visio.template'
        ]
      },
      className: 'csui-icon mime_visio',
      iconName: 'csui_mime_visio',
      mimeType: lang.NodeTypeVisio,
      jatoIcon: jatoIcons.mimeVisio,
      sequence: 50
    },
    {
      // spreadsheets
      equalsNoCase: {
        mime_type: [
          'application/vnd.oasis.opendocument.spreadsheet',
          'application/vnd.oasis.opendocument.spreadsheet-template',
          'application/vnd.sun.xml.calc',
          'application/vnd.sun.xml.calc.template',
          'application/vnd.stardivision.calc',
          'application/x-starcalc'
        ]
      },
      className: 'csui-icon mime_spreadsheet',
      iconName: 'csui_mime_spreadsheet',
      mimeType: lang.NodeTypeSpreadsheet,
      jatoIcon: jatoIcons.mimeSpreadsheet,
      sequence: 50
    },
    {
      // powerpoint
      equalsNoCase: {
        mime_type: [
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.openxmlformats-officedocument.presentationml.template',
          'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
          'application/vnd.ms-powerpoint.addin.macroEnabled.12',
          'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
          'application/vnd.ms-powerpoint.template.macroEnabled.12',
          'application/vnd.ms-powerpoint.slideshow.macroEnabled.12'
        ]
      },
      className: 'csui-icon mime_powerpoint',
      iconName: 'csui_mime_powerpoint',
      mimeType: lang.NodeTypePPT,
      jatoIcon: jatoIcons.mimePowerpoint,
      sequence: 50
    },
    {
      // presentations
      equalsNoCase: {
        mime_type: [
          'application/vnd.google-apps.presentation', // GSLIDE - Google Drive Presentation
          'application/x-iwork-keynote-sffkey', // KEY, KEYNOTE — Apple Keynote Presentation
          'application/vnd.wolfram.mathematica', // NB — Mathematica Slideshow
          'application/vnd.wolfram.player', // NBP — Mathematica Player slideshow
          'application/vnd.oasis.opendocument.presentation', // ODP — OpenDocument Presentation
          'application/vnd.oasis.opendocument.presentation-template', // OTP - ODP Template
          'application/vnd.sun.xml.impress',
          'application/vnd.sun.xml.impress.template',
          'application/vnd.stardivision.impress',
          'application/vnd.stardivision.impress-packed',
          'application/x-starimpress',
          'application/vnd.lotus-freelance', // PRZ — Lotus Freelance Graphics
          'application/vnd.stardivision.impress', // SDD - Star Office's StarImpress
          'application/vnd.corel-presentations', // SHW — Corel Presentations slide show creation
          'application/vnd.sun.xml.impress', // SXI — OpenOffice.org XML (obsolete) Presentation
          'application/vnd.ms-officetheme', // THMX — Microsoft PowerPoint theme template
          'application/vnd.sun.xml.impress.template '// STI — OpenOffice Impress template

          // the following extensions could not mapped to a mime-type
          // todo: intro mapping to file extensions
          // WATCH — Dataton Watchout Presentation
          // PEZ — Prezi Desktop Presentation
          // SHF — ThinkFree Show
          // SHOW — Haansoft(Hancom) Presentation software document
          // SLP — Logix-4D Manager Show Control Project
          // SSPSS — SongShow Plus Slide Show

        ]
      },
      className: 'csui-icon mime_presentation',
      iconName: 'csui_mime_presentation',
      mimeType: lang.NodeTypePresentation,
      jatoIcon: jatoIcons.mimePresentation,
      sequence: 50
    },
    {
      // MS Office publisher
      equalsNoCase: {
        mime_type: [
          'application/vnd.ms-publisher',
          'application/x-mspublisher'
        ]
      },
      className: 'csui-icon mime_publisher',
      iconName: 'csui_mime_publisher',
      mimeType: lang.NodeTypePublisher,
      jatoIcon: jatoIcons.mimePublisher,
      sequence: 50
    },
    {
      // formulas
      equalsNoCase: {
        mime_type: [
          'application/vnd.oasis.opendocument.formula',
          'application/vnd.sun.xml.math',
          'application/vnd.stardivision.math',
          'application/x-starmath'
        ]
      },
      className: 'csui-icon mime_formula',
      iconName: 'csui_mime_formula',
      mimeType: lang.NodeTypeFormula,
      jatoIcon: jatoIcons.mimeFormula,
      sequence: 50
    },
    {
      // pdf
      equalsNoCase: {
        mime_type: [
          'application/vnd.pdf',
          'application/x-pdf',
          'application/pdf'
        ]
      },
      className: 'csui-icon mime_pdf',
      iconName: 'csui_mime_pdf',
      mimeType: lang.NodeTypePDF,
      jatoIcon: jatoIcons.mimePdf,
      sequence: 50
    },
    {
      // word
      equalsNoCase: {
        mime_type: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
          'application/vnd.ms-word.document.macroEnabled.12',
          'application/vnd.ms-word.template.macroEnabled.12'
        ]
      },
      className: 'csui-icon mime_word',
      iconName: 'csui_mime_word',
      mimeType: lang.NodeTypeDOC,
      jatoIcon: jatoIcons.mimeWord,
      sequence: 50
    },
    {
      // dwg
      equalsNoCase: {
        mime_type: [
          'application/dwg',
          'drawing/dwg'
        ]
      },
      className: 'csui-icon mime_dwg',
      iconName: 'csui_mime_dwg',
      mimeType: lang.NodeTypeDWG,
      jatoIcon: jatoIcons.mimeDwg,
      sequence: 50
    },
    {
      // MS OneNote
      equalsNoCase: {
        mime_type: [
          'application/onenote',
          'application/msonenote'
        ]
      },
      className: 'csui-icon mime_onenote',
      iconName: 'csui_mime_onenote',
      mimeType: lang.NodeTypeONE,
      jatoIcon: jatoIcons.mimeOneNote,
      sequence: 50
    },
    {
      // MS project
      equalsNoCase: {
        mime_type: [
          'application/vnd.ms-project',
          'application/msproj',
          'application/msproject',
          'application/x-msproject',
          'application/x-ms-project',
          'application/mpp'
        ]
      },
      className: 'csui-icon mime_project',
      iconName: 'csui_mime_project',
      mimeType: lang.NodeTypeMPP,
      jatoIcon: jatoIcons.mimeCsProject,
      sequence: 50
    },
    {
      // image
      startsWithNoCase: { mime_type: 'image/' },
      className: 'csui-icon mime_image',
      iconName: 'csui_mime_image',
      mimeType: lang.NodeTypeImage,
      jatoIcon: jatoIcons.mimeImage,
      sequence: 50
    },
    {
      // audio
      startsWithNoCase: { mime_type: 'audio/' },
      className: 'csui-icon mime_audio',
      iconName: 'csui_mime_audio',
      mimeType: lang.NodeTypeAudio,
      jatoIcon: jatoIcons.mimeAudio,
      sequence: 50
    },
    {
      // text
      startsWithNoCase: { mime_type: 'text/' },
      className: 'csui-icon mime_paper',
      iconName: 'csui_mime_paper',
      mimeType: lang.NodeTypeText,
      jatoIcon: jatoIcons.mimePaper,
      sequence: 50
    },
    {
      // text
      equalsNoCase: { mime_type: 'text/html' },
      className: 'csui-icon mime_html',
      iconName: 'csui_mime_html',
      mimeType: lang.NodeTypeHtml,
      jatoIcon: jatoIcons.mimeHtml,
      // startsWith 'text/' operation happens first, which would decide the icon otherwise;
      // it has the sequence number 50 in common
      // do not set sequence to 30 that would take over the 'type' that has this MIME type
      // and do not set to 50 because this object with this MIME type would have a different icon
      sequence: 40
    },
    {
      // video
      startsWithNoCase: { mime_type: 'video/' },
      className: 'csui-icon mime_video',
      iconName: 'csui_mime_video',
      mimeType: lang.NodeTypeVideo,
      jatoIcon: jatoIcons.mimeVideo,
      sequence: 50
    },
    {
      // zip
      equalsNoCase: {
        mime_type: [
          'application/x-rar-compressed',
          'application/zip',
          'application/x-zip',
          'application/x-zip-compressed'
        ]
      },
      className: 'csui-icon mime_zip',
      iconName: 'csui_mime_zip',
      mimeType: lang.NodeTypeCompressed,
      jatoIcon: jatoIcons.mimeZip,
      sequence: 50
    },
    {
      // document
      equals: { type: 144 },
      className: 'csui-icon mime_document',
      iconName: 'csui_mime_document',
      jatoIcon: jatoIcons.mimeDocumentType,
      sequence: 100
    },
    {
      // CAD
      equals: { type: 736 },
      className: 'csui-icon mime_drawing',
      iconName: 'csui_mime_drawing',
      jatoIcon: jatoIcons.mimeDwg,
      sequence: 100
    },
    {
      // saved search query
      equals: { type: 258 },
      className: 'csui-icon csui-icon-saved-search-query',
      iconName: 'csui_mime_saved_search',
      mimeType: lang.NodeTypeSearchQuery,
      jatoIcon: jatoIcons.mimeSearchSaved,
      sequence: 100
    },
    {
      // custom search form
      equals: { type: 292 },
      className: 'csui-icon csui-icon-query-form-search',
      iconName: 'csui_mime_query_form_search',
      mimeType: lang.NodeTypeSearchForm,
      jatoIcon: jatoIcons.mimeSearchQuery,
      sequence: 100
    },
    {
      // URL link
      equals: { type: 140 },
      className: 'csui-icon url1',
      iconName: 'csui_mime_url',
      mimeType: lang.NodeTypeURL,
      jatoIcon: jatoIcons.mimeUrl,
      sequence: 100
    },
    {
      // shortcut
      equals: { type: 1 },
      className: 'csui-icon shortcut1',
      iconName: 'csui_mime_shortcut',
      withColorSchemaIconName: 'csui_colorschema_mime_shortcut',
      jatoIcon: jatoIcons.mimeShortcut,
      sequence: 100
    },
    {
      // generation
      equals: { type: 2 },
      className: 'csui-icon generation1',
      iconName: 'csui_mime_generation',
      sequence: 100
    },
    {
      // category
      equals: { type: 131 },
      className: 'csui-icon category1',
      iconName: 'csui_mime_category',
      jatoIcon: jatoIcons.mimeCategory,
      sequence: 100
    },
    {
      // project
      equals: { type: 202 },
      className: 'csui-icon csui-icon-project',
      iconName: 'csui_mime_cs_project',
      withColorSchemaIconName: 'csui_colorschema_mime_cs_project',
      jatoIcon: jatoIcons.mimeCsProject,
      sequence: 100
    },
    {
      // collection
      equals: { type: 298 },
      className: 'csui-icon collection',
      iconName: 'csui_mime_collection',
      withColorSchemaIconName: 'csui_colorschema_mime_collection',
      jatoIcon: jatoIcons.mimeCollection,
      sequence: 100
    },
    {
      equals: { type: 141 },
      className: 'csui-icon csui-icon-enterprise-volume',
      iconName: 'csui_mime_enterprise',
      jatoIcon: jatoIcons.mimeEnterprise,
      sequence: 100
    },
    {
      equals: { type: 142 },
      className: 'csui-icon csui-icon-personal-volume',
      iconName: 'csui_mime_enterprise',
      jatoIcon: jatoIcons.mimeEnterprise, // until personal volume jato icon is available, use enterprise volume icon temporarily
      sequence: 100
    },
    {
      equals: { type: 133 },
      className: 'csui-icon csui-icon-category-volume',
      jatoIcon: jatoIcons.mimeCategoryFolder,
      iconName: 'csui_mime_category_volume',
      sequence: 100
    },
    {
      // Category Folder
      equals: { type: 132 },
      className: 'csui-icon csui-icon-node-category-folder',
      iconName: 'csui_mime_category_volume',
      jatoIcon: jatoIcons.mimeCategoryFolder,
      sequence: 100
    },
    {
      // LiveReport
      equals: { type: 299 },
      className: 'csui-icon csui-icon-node-livereport',
      iconName: 'csui_mime_livereport',
      withColorSchemaIconName: 'csui_colorschema_mime_livereport',
      jatoIcon: jatoIcons.mimeLiveReport,
      sequence: 100
    },
    {
      // Milestone
      equals: { type: 212 },
      className: 'csui-icon csui-icon-node-milestone',
      iconName: 'csui_mime_milestone',
      jatoIcon: jatoIcons.mimeMilestone,
      sequence: 100
    },
    {
      // Poll
      equals: { type: 218 },
      className: 'csui-icon csui-icon-node-poll',
      iconName: 'csui_mime_poll',
      jatoIcon: jatoIcons.mimePoll,
      sequence: 100
    },
    {
      // Prospector
      equals: { type: 384 },
      className: 'csui-icon csui-icon-node-prospector',
      iconName: 'csui_mime_prospector',
      jatoIcon: jatoIcons.mimeProspector,
      sequence: 100
    },
    {
      // Task
      equals: { type: 206 },
      className: 'csui-icon csui-icon-node-task',
      iconName: 'csui_mime_task',
      jatoIcon: jatoIcons.mimeTask,
      sequence: 100
    },
    {
      // Task Group
      equals: { type: 205 },
      className: 'csui-icon csui-icon-node-task-group',
      iconName: 'csui_mime_task_group',
      jatoIcon: jatoIcons.mimeTaskGroup,
      sequence: 100
    },
    {
      // Task List
      equals: { type: 204 },
      className: 'csui-icon csui-icon-node-task-list',
      iconName: 'csui_mime_task_list',
      withColorSchemaIconName: 'csui_colorschema_mime_task_list',
      jatoIcon: jatoIcons.mimeTaskList,
      sequence: 100
    },
    {
      // Perspective
      equals: { type: 957 },
      className: 'csui-icon csui-icon-perspective',
      iconName: 'csui_mime_perspective',
      jatoIcon: jatoIcons.mimePerspective,
      sequence: 100
    },
    {
      // Rule
      equals: { type: 958 },
      className: 'csui-icon csui-icon-rule',
      iconName: 'csui_mime_rule',
      jatoIcon: jatoIcons.mimeRules,
      sequence: 100
    },
    {
      // Perspective Assets Folder
      equals: { type: 955 },
      className: 'csui-icon csui-icon-perspective-assets-folder',
      iconName: 'csui_mime_perspective_assets_folder',
      jatoIcon: jatoIcons.mimePerspectiveAssetsFolder,
      sequence: 100
    },
    {
      // Perspective Assets Volume
      equals: { type: 954 },
      className: 'csui-icon csui-icon-perspective-assets-volume',
      iconName: 'csui_mime_perspective_assets_volume',
      jatoIcon: jatoIcons.mimeFolderPerspectiveAssetsVolume,
      sequence: 100
    },
    {
      // Virtual Folder
      equals: { type: 899 },
      className: 'csui-icon csui-icon-node-virtual-folder',
      iconName: 'csui_mime_virtual_folder',
      withColorSchemaIconName: 'csui_colorschema_mime_virtual_folder',
      jatoIcon: jatoIcons.mimeVirtualFolder,
      sequence: 100
    },
    {
      // Custom View
      equals: { type: 146 },
      className: 'csui-icon mime_custom_view',
      iconName: 'csui_mime_custom_view',
      jatoIcon: jatoIcons.mimeCustomView,
      // Custom View has a MIME type, which would decide the icon otherwise;
      // the MIME type icons have the sequence number 50 in common
      sequence: 30
    },
    {
      // Workflow Step
      equals: { type: 153 },
      className: 'csui-icon assignment-workflow',
      iconName: 'csui_mime_assignment_workflow',
      jatoIcon: jatoIcons.mimeWorkflowAssignments,
      sequence: 100
    },
    {
      // Workflow Map
      equals: { type: 128 },
      className: 'csui-icon mime_workflow_map',
      iconName: 'csui_mime_workflow_map',
      withColorSchemaIconName: 'csui_colorschema_mime_workflow_map',
      jatoIcon: jatoIcons.mimeWorkflowMap,
      sequence: 100
    },
    {
      // Workflow Status
      equals: { type: 190 },
      className: 'csui-icon mime_workflow_status',
      iconName: 'csui_mime_workflow_status',
      withColorSchemaIconName: 'csui_colorschema_mime_workflow_status',
      jatoIcon: jatoIcons.mimeWorkflowStatus,
      sequence: 100
    },
    {
      // Channel
      equals: { type: 207 },
      className: 'csui-icon mime_channel',
      iconName: 'csui_mime_channel',
      withColorSchemaIconName: 'csui_colorschema_mime_channel',
      jatoIcon: jatoIcons.mimeChannel,
      sequence: 100
    },
    {
      // News item
      equals: { type: 208 },
      className: 'csui-icon mime_news',
      iconName: 'csui_mime_news_item',
      jatoIcon: jatoIcons.mimeNewsItem,
      sequence: 100
    },
    {
      // Discussion
      equals: { type: 215 },
      className: 'csui-icon mime_discussion',
      iconName: 'csui_mime_conversation',
      jatoIcon: jatoIcons.mimeConversation,
      sequence: 100
    },
    {
      // XML DTD
      equals: { type: 335 },
      className: 'csui-icon mime_xml_dtd',
      iconName: 'csui_mime_xml',
      jatoIcon: jatoIcons.mimeXml,
      withColorSchemaIconName: 'csui_colorschema_mime_xml',
      // XML DTD has a MIME type, which would decide the icon otherwise;
      // the MIME type icons have the sequence number 50 in common
      sequence: 30
    },
    {
      // form
      equals: { type: 223 },
      className: 'csui-icon mime_form',
      iconName: 'csui_mime_form',
      withColorSchemaIconName: 'csui_colorschema_mime_form',
      jatoIcon: jatoIcons.mimeForm,
      sequence: 100
    },
    {
      // form template
      equals: { type: 230 },
      className: 'csui-icon mime_form_template',
      iconName: 'csui_mime_layout_template',
      withColorSchemaIconName: 'csui_colorschema_mime_layout_template',
      jatoIcon: jatoIcons.mimeLayoutTemplate,
      sequence: 100
    },
    {
      // pulse comments
      equals: { type: 1281 },
      className: 'csui-icon icon-pulse-comment',
      iconName: 'csui_mime_pulse_comment',
      jatoIcon: jatoIcons.mimeComment,
      sequence: 100
    },
    {
      // wiki pages
      equals: { type: 5574 },
      className: 'csui-icon mime_wiki_page',
      iconName: 'csui_mime_wiki_page',
      jatoIcon: jatoIcons.mimeWikiPage,
      sequence: 10
    },
    // wikis
    {
      equals: { type: 5573 },
      className: 'csui-icon mime_wiki',
      iconName: 'csui_mime_wiki',
      withColorSchemaIconName: 'csui_colorschema_mime_wiki',
      jatoIcon: jatoIcons.mimeWiki,
      sequence: 10
    },


    {
      // default container
      equals: { container: 'nonselectable' },
      className: 'csui-icon mime_folder_nonselectable',
      iconName: 'csui_mime_folder_nonselectable32',
      jatoIcon: jatoIcons.mimeFolderNonSelectable,
      sequence: 1000
    },
    {
      // default container; covers folder-like nodes too
      equals: { container: true },
      className: 'csui-icon mime_folder',
      iconName: 'csui_mime_folder',
      withColorSchemaIconName: 'csui_colorschema_mime_folder',
      jatoIcon: jatoIcons.mimeFolder,
      sequence: 1000
    },
    {
      // facets volume
      equals: { type: 901 },
      className: 'csui-icon mime_facets_volume',
      iconName: 'csui_mime_facets_volume',
      jatoIcon: jatoIcons.mimeFacets,
      sequence: 100
    },
    {
      // custom column
      equals: { type: 902 },
      className: 'csui-icon csui-icon-custom-column',
      iconName: 'csui_mime_custom_column',
      jatoIcon: jatoIcons.mimeCustomColumn,
      sequence: 100
    },
    {
      // facets tree
      equals: { type: 903 },
      className: 'csui-icon mime_facets_tree',
      iconName: 'csui_mime_facets_tree',
      jatoIcon: jatoIcons.mimeFacetsTree,
      sequence: 100
    },
    {
      // facets
      equals: { type: 904 },
      className: 'csui-icon mime_facets',
      iconName: 'csui_mime_facets',
      jatoIcon: jatoIcons.mimeFacets,
      sequence: 100
    },
    {
      // default node
      className: 'csui-icon mime_document',
      iconName: 'csui_mime_document',
      jatoIcon: jatoIcons.mimeDocumentType,
      sequence: 10000
    },
    {
      // SDD document
      startsWithNoCase: { mime_type: 'application/sdd' },
      className: 'csui-icon mime_application',
      iconName: 'csui_mime_application',
      mimeType: lang.NodeTypeSDD,
      jatoIcon: jatoIcons.mimeApplicationForm,
      sequence: 50
    },
    {
      // Support Assets Volume
      equals: { type: 1309 },
      className: 'csui-icon csui-icon-perspective-assets-volume',
      iconName: 'csui_mime_perspective_assets_volume',
      jatoIcon: jatoIcons.mimeFolderPerspectiveAssetsVolume,
      sequence: 100
    },
    {
      // Support Assets Folder
      equals: { type: 1308 },
      className: 'csui-icon csui-icon-support-assets-folder',
      iconName: 'csui_mime_support_assets_folder',
      jatoIcon: jatoIcons.mimeSupportAssetsFolder,
      sequence: 10000
    },
    {
      // Support Assets Document
      equals: { type: 1307 },
      className: 'csui-icon csui-icon-support-assets-document',
      iconName: 'csui_mime_support_assets_document',
      jatoIcon: jatoIcons.mimeSupportAssetsDocument,
      sequence: 10000
    },
    {
      // Support Assets ImageFolder
      equals: { type: 1306 },
      className: 'csui-icon csui-icon-support-assets-image-folder',
      iconName: 'csui_mime_support_assets_image_folder',
      jatoIcon: jatoIcons.mimeSupportAssetsImageFolder,
      sequence: 10000
    },
    {
      // Support Assets Image
      equals: { type: 1305 },
      className: 'csui-icon csui-icon-support-assets-image',
      iconName: 'csui_mime_support_assets_image',
      jatoIcon: jatoIcons.mimeSupportAssetsImage,
      sequence: 10000
    }
  ]);

  if (extraIcons) {
    nodeSprites.add(_.flatten(extraIcons, true));
  }

  return nodeSprites;

});




csui.define('csui/utils/node.info.sprites',[
  'csui/lib/underscore', 'csui/lib/backbone',
  // Load and register external node information sprites
  'csui-ext!csui/utils/node.info.sprites'
], function (_, Backbone, extraNodeInfoSprites) {

  var NodeSpriteModel = Backbone.Model.extend({

    defaults: {
      sequence: 100
    },

    constructor: function NodeSpriteModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var NodeSpriteCollection = Backbone.Collection.extend({

    model: NodeSpriteModel,
    comparator: "sequence",

    constructor: function NodeSpriteCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }

  });

  var nodeSprites = new NodeSpriteCollection();

  if (extraNodeInfoSprites) {
    nodeSprites.add(_.flatten(extraNodeInfoSprites, true));
  }

  return nodeSprites;

});


csui.define('csui/utils/promoted.actionitems',['nuc/lib/underscore', 'nuc/models/actionitems'], function (_, ActionItemCollection) {
  'use strict';

  // This file is supposed to be mapped to `nuc/utils/promoted.actionitems`.
  // TODO: Remove this module as soon as the actions are passed only via
  /// module constructors.
  var promotedActionItems = new ActionItemCollection([
    {
      signature: 'properties',
      sequence: 10
    },
    {
      signature: 'aviator',
      sequence: 10
    },
    {
      signature: 'unreserve',
      sequence: 10
    },
    {
      signature: 'permissions',
      sequence: 10
    },
    {
      signature: 'dynamicpermissions',
      sequence: 10
    },
    {
      signature: 'reserve',
      sequence: 10
    },
    {
      signature: 'rename',
      sequence: 10
    },
    {
      signature: 'share',
      sequence: 10
    },
    {
      signature: 'edit',
      sequence: 10
    },
    {
      signature: 'opendocumentofficeeditor',
      sequence: 10
    },
    {
      signature: 'openofficeonline',
      sequence: 10
    },
    {
      signature: 'copy',
      sequence: 10
    },
    {
      signature: 'move',
      sequence: 10
    },
    {
      signature: 'download',
      sequence: 10
    },
    {
      signature: 'comment',
      sequence: 10
    },
    {
      signature: 'open',
      sequence: 10
    },
    {
      signature: 'delete',
      sequence: 10
    },
    {
      signature: 'browse',
      sequence: 10
    },
    {
      signature: 'addversion',
      sequence: 10
    },
    {
      signature: 'editpermissions',
      sequence: 10
    },
    {
      signature: 'versionscontrol',
      sequence: 10
    }
  ]);

  return promotedActionItems;
});




csui.define('csui/utils/smart.nodes/smart.nodes',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external Smart UI node rules
  'csui-ext!csui/utils/smart.nodes/smart.nodes'
], function (_, Backbone, RulesMatchingMixin, rules) {
  'use strict';

  var SmartNodeModel = Backbone.Model.extend({
    defaults: {
      sequence: 100
    },

    constructor: function SmartNodeModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });

  RulesMatchingMixin.mixin(SmartNodeModel.prototype);

  var SmartNodeCollection = Backbone.Collection.extend({
    model: SmartNodeModel,
    comparator: "sequence",

    constructor: function SmartNodeCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    isSupported: function (node, options) {
      return this.some(function (item) {
        return item.matchRules(node, item.attributes);
      });
    }
  });

  var smartNodes = new SmartNodeCollection();

  if (rules) {
    smartNodes.add(_.flatten(rules, true));
  }

  return smartNodes;
});


csui.define('csui/utils/user.session/expirationwarning.instance',[
  'module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/log',
], function (module, _, $, log) {
  'use strict';
  log = log(module.id);

  var singleton = function () {
    var ExpirationWarningDlg = undefined;

    function isDisplayed() {
      return !!(ExpirationWarningDlg && ExpirationWarningDlg.isDisplayed());
    }

    function resetStartTime(timeSecs) {
      if (ExpirationWarningDlg) {
        ExpirationWarningDlg.resetStartTime(timeSecs);
      }
    }

    function closeDialog() {
      if (ExpirationWarningDlg) {
        ExpirationWarningDlg.closeDialog();
      }
    }

    function showExpirationWarningDialog(dlgOptions) {
      var deferred = $.Deferred();

      // we use here dynamical loading to allow the expiration warning dialog
      // to be in a different bundle than UserSession which gets required in authenticator          
      csui.require([ 'csui/utils/expiration.warning/expiration.warning.dialog'
      ], function(ExpWrnDlg) {
        ExpirationWarningDlg = ExpWrnDlg;        
        ExpirationWarningDlg.showExpirationWarningDialog(dlgOptions)
        .then(
          function success(result) {
            deferred.resolve(result);
          },
          function failure(result) {
            deferred.reject(result);
          }
        );
      });
      return deferred.promise();
    }

    return {
      showExpirationWarningDialog: showExpirationWarningDialog,
      isDisplayed: isDisplayed,
      resetStartTime: resetStartTime,
      closeDialog: closeDialog
    }

  };

  return singleton();
});


csui.define('csui/utils/user.session/impl/nls/lang',{
    // Always load the root bundle for the default locale (en-us)
    "root": true,
    // Do not load English locale bundle provided by the root bundle
    "en-us": false,
    "en": false
  });
  

csui.define('csui/utils/user.session/impl/nls/root/lang',{

  errorTerminateSession: 'Terminating the session failed.',    
  errorContinueSession: 'Continuing the session failed.',

  errorHttpPrefix: 'HTTP'

});




csui.define('csui/utils/user.session/user.session',[
  'module',
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/log',
  'csui/utils/url',
  'csui/utils/base',
  'csui/utils/user.session/expirationwarning.instance',
  'i18n!csui/utils/user.session/impl/nls/lang'
  ], function (module, require, _, $, log, Url, base,
               ExpirationWarningInstance, lang) {
    'use strict';
    log = log(module.id);

    var singleton = function() {
      log.info("user.session: module.config is: " + JSON.stringify(module.config())) && console.log(log.last);
      var DEFAULT_KINDNESS_PERIOD = 30 * 1000;                // at least 30 sec kindness time needed for refresh-call with still valid ticket
      var DEFAULT_COOKIE_EXPIRATION_MODE = 1;                 // last request
      var DEFAULT_ENABLE_EXPIRATION_HANDLING = false;         // disabled
      var DEFAULT_SESSION_INACTIVITY_TIME = 27 * 60 * 1000;
      var DEFAULT_SESSION_REACTION_TIME = 3 * 60 * 1000;
      var MINIMUM_SESSION_INACTIVITY_TIME = 1 * 60 * 1000;
      var MINIMUM_SESSION_REACTION_TIME = 2 * 60 * 1000;
      var SERVER_TEST_ALIVE_INTERVAL = 15 * 1000;
      var preExeced = false;
      var postExeced = false;

      var config = _.extend({
            signInPageUrl: 'signin.html',       // only for development
            kindnessPeriod: DEFAULT_KINDNESS_PERIOD,
            cookieExpirationMode: DEFAULT_COOKIE_EXPIRATION_MODE,
            enableExpirationHandling: DEFAULT_ENABLE_EXPIRATION_HANDLING    
          }, module.config()),
          redirectEnabled = config.enableExpirationHandling == null ? DEFAULT_ENABLE_EXPIRATION_HANDLING : config.enableExpirationHandling,
          cookieExpirationMode = config.cookieExpirationMode == null ? DEFAULT_COOKIE_EXPIRATION_MODE : config.cookieExpirationMode,
          sessionInactivity = config.sessionInactivity == null ? DEFAULT_SESSION_INACTIVITY_TIME : config.sessionInactivity,
          sessionReactionTime = config.sessionReactionTime == null ? DEFAULT_SESSION_REACTION_TIME : config.sessionReactionTime,
          kindnessPeriod = config.kindnessPeriod == null ? DEFAULT_KINDNESS_PERIOD : config.kindnessPeriod,

          // CS provides 3 modes: 
          //     0 = never expires (no additional params available)
          //     1 = expire after last request
          //     2 = expire after last login
          isCookieExpirationEnabled   = (cookieExpirationMode > 0);

      // check the timeout configurations
      // the overallTimeout is sessionInactivity + sessionReactionTime
      if (sessionInactivity < MINIMUM_SESSION_INACTIVITY_TIME) {
        log.warn("user.session: config: Timeout configuration error, 'timeout' value (= sessionInactivity) is less than minimum " + (MINIMUM_SESSION_INACTIVITY_TIME / 1000 / 60) + " minutes!") && console.warn(log.last);
      }
      if (sessionReactionTime < MINIMUM_SESSION_REACTION_TIME) {
        log.warn("user.session: config: Timeout configuration error, 'timeout alert' value (= sessionReactionTime) is less than minimum " + (MINIMUM_SESSION_REACTION_TIME / 1000 / 60) + " minutes!") && console.warn(log.last);        
      }

      // print the finally used config values
      var usedConfig = {
        enableExpirationHandling: redirectEnabled,
        cookieExpirationMode: cookieExpirationMode,          
        sessionInactivity: sessionInactivity,
        sessionReactionTime: sessionReactionTime,
        kindnessPeriod: kindnessPeriod
      };
      log.warn("user.session: used config: " + JSON.stringify(usedConfig)) && console.warn(log.last);


      var timerId;
      var logoutInitiated = false;
      var dlgResult = undefined;


      function getSessionReactionTime() {
        return sessionReactionTime;
      }

      function getSessionInactivity() {
        return sessionInactivity;
      }

      function isSessionExpirationEnabled() {
        return redirectEnabled;
      }

      function getCookieExpirationMode() {
        return cookieExpirationMode;
      }

      function currentDateUTC() {
        return (new Date()).toUTCString();
      }

      // returns the overall expiration time, used to correct wrong/missing values
      function _getOverallExpirationTime() {
        return getSessionInactivity() + getSessionReactionTime();
      }

      // Ensures that the 'expires' and 'serverDate' exists
      function _ensureExpiresTime(session) {
        if ( session ) {
          if (!session.expires || !session.serverDate) {
            var dat = new Date();
            session.serverDate = dat.toUTCString();
            session.expires = new Date(dat.getTime() + _getOverallExpirationTime()).toUTCString();          
            log.warn("user.session: _ensureExpiresTime: Adding 'serverDate' and 'expires' information to session (expires: " + session.expires + ").") && console.warn(log.last);
          } else if( new Date(session.expires).getTime() <= new Date(session.serverDate).getTime() ) {
            var dat2 = new Date();
            session.serverDate = dat2.toUTCString();
            session.expires = new Date(dat2.getTime() + _getOverallExpirationTime()).toUTCString();
            log.warn("user.session: _ensureExpiresTime: Provided 'serverDate' is newer or equal than 'expires' value, exceptionally replacing values (expires: " + session.expires + ").") && console.warn(log.last);
          }
        } else {
          log.error("user.session: _ensureExpiresTime: The provided argument 'session' is undefined!") && console.error(log.last);
        }
      }

      // Returns the expiration start time duration for the timer in seconds.
      // After the duration the ExpirationWarningDialog should be shown.
      function _calcExpirationStartTime(authenticator) {
        var session = authenticator.connection.session;
        var diffTime = 0;

        _ensureExpiresTime(session);

        if ( session && session.expires !== undefined && 
            (typeof session.expires === "string") && session.expires.length > 0 ) {

          var expireDate = new Date(session.expires);
          if (isNaN(expireDate.getTime())) { 
            expireDate = new Date(new Date().getTime() + _getOverallExpirationTime());
            log.info("user.session: _calcExpirationStartTime: Got unparseable date value for expires '" + session.expires + "', using fallback value '" + expireDate.toUTCString() + "'.") && console.log(log.last);
            session.expires = expireDate.toUTCString();
          }
          var expireTime = expireDate.getTime();
          expireTime -= kindnessPeriod;
          if (expireTime < 0) { expireTime = 0; }

          var currentDate = new Date(session.serverDate);
          if (isNaN(currentDate.getTime())) {
            currentDate = new Date();
            log.warn("user.session: _calcExpirationStartTime: Got unparseable date value for serverDate '" + session.serverDate + "', using fallback value '" + currentDate.toUTCString() + "'.") && console.warn(log.last);
            session.serverDate = currentDate.toUTCString();
          }
          var currentTime = currentDate.getTime();
          log.info("user.session: _calcExpirationStartTime: srvDate: " 
            + session.serverDate + ", expires: " + session.expires + " (Date: " + currentDateUTC() + ").") 
            && console.log(log.last);

          if ( currentTime >= expireTime ) {
            diffTime = 0;
          } else {
            diffTime = expireTime - currentTime;
          }
          diffTime /= 1000; // secs
        } else {
          log.error("user.session: _calcExpirationStartTime: The provided authenticator.connection.session has no expiration information.") && console.error(log.last);
          // if we want to allow this you can return e.g. 5 secs, within a REST-call with expiration information has to provide the start time
        }
        log.info("user.session: _calcExpirationStartTime: secs until expiration: " + diffTime) && console.log(log.last);
        return diffTime;
      }

      // if countdown of expiration warning should be displayed
      function _shouldDisplayExpirationWarning() {
        if ( this.isSessionExpirationEnabled() === true && isCookieExpirationEnabled ) {
          // == 1 for only 'expire after last request'
          // > 0 for mode 1 and 2
          return ( this.getCookieExpirationMode() == 1 );
        } else {
          return false;
        }
      }

      function reinitExpirationTimer(authenticator) {
        log.debug("user.session: reinitExpirationTimer: Reinit expiration timer at: " + this.currentDateUTC()) && console.log(log.last);
        this.clearExpirationTimer();
        this._createExpirationTimer(authenticator);
      }

      // The authenticator.connection.session contains the 'ticket', 'serverDate' and 'expires' information.
      function updateSessionTicket(authenticator, request) {
        if (authenticator && authenticator.isAuthenticated()) {
          if (request && request.settings && request.settings.url) {
            var url = new Url(request.settings.url).getAbsolute().toLowerCase(),
                match = url.match(/^.*\/(api\/[^?]+)/);
            // Only REST API request handlers can supply a fresh ticket and
            // renew the expiration warning timeout. Custom handlers written
            // without the RESTAPIObject are not standardized and will not be
            // able to take part on the expiration warning feature.
            if (match) {
              var call = match[1];
              log.debug("user.session: updateSessionTicket: Resetting expiration timer based on call '" + call + "'.") && console.log(log.last);
              this.reinitExpirationTimer(authenticator);
            }
          } else {
            log.debug("user.session: updateSessionTicket: Resetting expiration timer based on unspecified call.") && console.log(log.last);
            this.reinitExpirationTimer(authenticator);
          }
        } else {
          log.warn("user.session: updateSessionTicket: Authenticator has to be 'authenticated' before updating session ticket!") && console.warn(log.last);
        }
      }
      
      function startExpirationTimer(authenticator) {
        if (authenticator && authenticator.isAuthenticated()) {
          log.debug("user.session: startExpirationTimer: Creating new expiration timer with provided authenticator...") && console.log(log.last);
          this.reinitExpirationTimer(authenticator);
        } else {
          console.warn("user.session: startExpirationTimer: Unable to start expiration timer, you have to provide an (still) authenticated 'authenticator'! Verify your parameter(s) for startExpirationTimer() function.");
        }
      }
      
      function clearExpirationTimer() {
        log.debug("user.session: clearExpirationTimer: called...") && console.log(log.last);
        if ( timerId ) {
          clearInterval(timerId);
          timerId = undefined;
        }
      }

      /**
       * Helper to detect invalid session due to "End session now" in another Tab/process.
       * On failure the expiration warning dialog must be closed since in the background the login-page
       * may be already displayed due to the 401 handling.
       * With a failed call it just closes the expiration warning dialog, it does not modify the user
       * session timer.
       * @param {*} authenticator 
       */
      function _checkCurrentExpirationFromServer(authenticator) {
        this.getTicketExpires(authenticator,
          () => { // success
            log.debug("user.session: _checkCurrentExpirationFromServer: Session still alive (Date: " + currentDateUTC() + ")") && console.log(log.last);
          },
          () => { // failure
            if (ExpirationWarningInstance.isDisplayed()) {
              log.info("user.session: _checkCurrentExpirationFromServer: closing dialog due to failed call (Date: " + currentDateUTC() + ")") && console.log(log.last);
              ExpirationWarningInstance.closeDialog();
            }
          }
        );        
      }

      /**
       * Helper to check and handle the session expiration including the display of the expiration warning dialog,
       * the time value updates and the end session detection.
       * It deals with the user session timer and with the expiration warning dialog timer.
       * @param {*} authenticator 
       * @param {number} timeVal 
       * @param {number} reactionTimeSecs 
       * @param {boolean} forceDialogUpdate 
       */
      function checkAndHandleExpired(authenticator, timeVal, reactionTimeSecs, forceDialogUpdate = false) {
        log.info("user.session: checkAndHandleExpired: given timer value: " + timeVal + " (pre: " + preExeced+ ", post: " + postExeced + ")") && console.log(log.last);
        if (timeVal < reactionTimeSecs) {
          log.debug("user.session: checkAndHandleExpired: current expiration value: " + timeVal) && console.log(log.last);
          if ( timeVal > 0 ) {
            if (forceDialogUpdate && ExpirationWarningInstance.isDisplayed()) {
              // a dialog time value update was requested due to an external reason like adjust timeout value
              log.info("user.session: checkAndHandleExpired: Forcing reset of timer value in dialog: " + timeVal + " (forceDialogUpdate: " + forceDialogUpdate + ")") && console.log(log.last);
              ExpirationWarningInstance.resetStartTime(timeVal);
            }
            if (postExeced) {
              // the session was prolonged in the meantime
              ExpirationWarningInstance.resetStartTime(timeVal);
              postExeced = false;
            }

            if (!preExeced) {
              preExeced = true;
              postExeced = false;
              log.info("user.session: checkAndHandleExpired: get latest ticket expiration") && console.log(log.last);
              this.getTicketExpires(authenticator);

              if (!this._shouldDisplayExpirationWarning() && isCookieExpirationEnabled) {
                // mode 2
                this.reinitExpirationTimer(authenticator);
              }
            }

            if (!ExpirationWarningInstance.isDisplayed()) {
              if (this._shouldDisplayExpirationWarning()) {
                // create dialog with separate timer, so upcoming REST-calls do not influence the timer;
                // an automatic logout is initiated as soon as the timer reached 0
                log.info("user.session: checkAndHandleExpired: current time for expiration warning count down: " + currentDateUTC()) && console.log(log.last);
                this.displayExpirationWarning(authenticator, 
                    { startWithWarningContent: this.getCookieExpirationMode() === 1 ? true : false,
                      startTime: timeVal })
                .then(
                  function success(result) {
                    log.info("user.session: checkAndHandleExpired: dialog reported closed by 'Continue session' (Date: " + currentDateUTC() + ")") && console.log(log.last);
                  }, 
                  function failure(result) {
                    if (result === false) {
                      log.info("user.session: checkAndHandleExpired: dialog reported closed by 'End session' (Date: " + currentDateUTC() + ")") && console.log(log.last);
                    } else {
                      // undefined
                      log.info("user.session: checkAndHandleExpired: dialog reported unhandled state 'undefined' (Date: " + currentDateUTC() + ")") && console.log(log.last);
                    }
                });
              }
            }
          } else {
            log.info("user.session: checkAndHandleExpired: Ticket is expired based on timer...") && console.log(log.last);

            if (!postExeced) {
              // re-test expiration
              log.info("user.session: checkAndHandleExpired: Get latest ticket expiration with already passed timer") && console.log(log.last);
              this.getTicketExpires(authenticator);
              preExeced = true; // avoid duplicate execution of getTicketExpires

              postExeced = true;
              this.reinitExpirationTimer(authenticator);
            } else {
              // perform logout
              this.clearExpirationTimer();
              log.info("user.session: checkAndHandleExpired: Switching to LoggedOut dialog content due to expired session...") && console.log(log.last);
              // trigger logout event on authenticator
              this.sendAuthenticatorEvent(authenticator);
              preExeced = false; postExeced = false; // reset flags
              // show loggedOut content
              this.performSessionExpired(authenticator, false);
            }
          }
        } else {          
          preExeced = false; postExeced = false;  // reset flags
          // if dialog displayed, close dialog silently
          if (ExpirationWarningInstance.isDisplayed() === true) {
            this.clearExpirationTimer(); // stop timer
            log.info("user.session: checkAndHandleExpired: Expiration warning dialog is displayed, but timer is meanwhile not expired. Just closing the dialog.") && console.log(log.last);
            // we have to destroy the modal alert dialog
            ExpirationWarningInstance.closeDialog();

            this.reinitExpirationTimer(authenticator); // create new timer
          }

        }
      }

      function _adjustTimeCalculation(expectedEndTime, currTimer) {
        var nowTime = Date.now();
        var timeDiff = Math.floor((expectedEndTime - nowTime + 500) / 1000);
        if ( timeDiff < currTimer) {
          if (timeDiff > 0) {
            log.info("user.session: _adjustTimeCalculation: Adjusting timer value to actual time, using: " + timeDiff + " (currentTimer was: " + currTimer + ")") && console.log(log.last);
            currTimer = timeDiff;
          } else {
            var prevTimer = currTimer;
            currTimer = (currTimer > 0 ? 0 : currTimer); // don't modify an already negative timer
            log.info("user.session: _adjustTimeCalculation: Adjusting timer value to " + currTimer + ", diff was: " + timeDiff + " (currentTimer was: " + prevTimer + ")") && console.log(log.last);
          }
        }
        return currTimer;
      }

      // creates new expiration timer based on given time(s) in authenticator.connection.session;
      // this is also called when session expiration handling is disabled, since you can switch it on
      // without server restart
      function _createExpirationTimer(authenticator) {
        if (this.isSessionExpirationEnabled() === true) {
          var timeVal = _calcExpirationStartTime(authenticator);
          var self = this;
          var reactionTimeSecs = this.getSessionReactionTime()/1000;
          var expectedEndTime = Date.now() + (timeVal * 1000);
          var nextAliveCheckTime = Date.now() + SERVER_TEST_ALIVE_INTERVAL;

          timerId = setInterval(function () {
            log.debug("user.session: _createExpirationTimer: calling checkAndHandleExpired..., next alive check: " + nextAliveCheckTime) && console.log(log.last);
            --timeVal;
            if (Date.now() >= nextAliveCheckTime) {
              log.debug("user.session: _createExpirationTimer: initiating server alive check...") && console.log(log.last);
              self._checkCurrentExpirationFromServer(authenticator);
              nextAliveCheckTime = Date.now() + SERVER_TEST_ALIVE_INTERVAL;
            }
            var prevTimeout = timeVal;
            var forceDialogUpdate = false;
            timeVal = self._adjustTimeCalculation(expectedEndTime, prevTimeout);
            if (timeVal != prevTimeout && timeVal >= 0) {
              // if something was adjusted, also update the dialog
              forceDialogUpdate = true;
            }
            self.checkAndHandleExpired(authenticator, timeVal, reactionTimeSecs, forceDialogUpdate);
          }, 1000);
        } else {
          log.debug("user.session: _createExpirationTimer: skipping creating timer due to disabled session expiration handling...") && console.log(log.last);
        }
      }

      // This is allows an external source to stop the expiration warning view timer.
      function stopExpirationWarningViewTimer() {
        log.info("user.session: stopExpirationWarningViewTimer: triggering clear timer from external source...") && console.info(log.last);
        ExpirationWarningInstance.triggerClearTimer();
      }

      function _showExpirationWarningDialog(authenticator, options) {
        var self = this;

        var dlgOptions = {
          userSession: self,
          authenticator: authenticator,
          startWithWarningContent: options.startWithWarningContent,
          startTime: options.startTime,
          clearExpirationTimer: function() {  // callback function to clear timer
            self.clearExpirationTimer();
          },
          closeDialog: function() {  // callback function to close dialog
            ExpirationWarningInstance.closeDialog();
          }
        };

        return ExpirationWarningInstance.showExpirationWarningDialog(dlgOptions);
      }

      // helper to close the dialog e.g. if the session is already expired;
      // no timers are stopped or created
      function closeExpirationWarningDialog() {
        if (ExpirationWarningInstance && ExpirationWarningInstance.isDisplayed() === true) {
          log.info("user.session: closeExpirationWarningDialog: Expiration warning dialog is displayed and will be closed.") && console.log(log.last);
          // we have to destroy the modal alert dialog
          ExpirationWarningInstance.closeDialog();
        }
      }

      // In case the remaining time is already lower than the sessionReactionTime when loading
      // the page then this function is called with each REST-call.
      // => there should be only one expiration warning dialog.
      function displayExpirationWarning(authenticator, options) {
        log.info("user.session: displayExpirationWarning: got into...") && console.log(log.last);

        if (this.isSessionExpirationEnabled() === true && this._shouldDisplayExpirationWarning()) {     // we want just one dialog
          log.info("user.session: displayExpirationWarning: expiration warning is displayed: " + ExpirationWarningInstance.isDisplayed()) && console.log(log.last);
          if (ExpirationWarningInstance.isDisplayed() === false) {
            if (options && options.startWithWarningContent === true) {
              // usual message and usual buttons
              dlgResult = this._showExpirationWarningDialog(authenticator, options); 
              return dlgResult;
            } 
            /* else {
              // just close button and loggedOut content for 2 (= after login);
              // We perform a redirect after session expired for mode 2 and do
              // not display an expired message and a close button (the expiration
              // warning view does not support such a static text anymore).
              if (isCookieExpirationEnabled) {
                options = options || {};
                options.startWithWarningContent = false;
                dlgResult = this._showExpirationWarningDialog(authenticator, options);
                return dlgResult;
              }
            } */
          }

          // when dialog already exists, we return the existing result 
          return dlgResult;
        }
      }

      function redirectToTargetPage(authenticator) {
        log.debug("user.session: redirectToTargetPage: Called ...") && console.log(log.last);
        // At this point of time the session in authenticator is normally invalid or cleared.
        var cgiUrl = new Url(authenticator.connection.url).getCgiScript();
        var targetUrl = Url.appendQuery(cgiUrl, 'func=csui.redirecttotarget');

        // redirect to target
        location.href = targetUrl;
      }

      function performSessionExpired(authenticator, doRedirect) {
        var self = this;
        if (this.isSessionExpirationEnabled() === true) {
          if (!logoutInitiated) {
            logoutInitiated = true;
            log.debug("user.session: performSessionExpired: Initiating automatic logout ...") && console.log(log.last);
            // initiate automatic logout
            this.clearExpirationTimer();

            if (doRedirect === true) {
              // redirect without logout    
              log.info("user.session: performSessionExpired: Session expired, performing requested redirect (Date: " + this.currentDateUTC() + ").") && console.log(log.last);
              this.redirectToTargetPage(authenticator);
            } else {
              // perform signOut
              log.info("user.session: performSessionExpired: Session expired, performing signOut (Date: " + this.currentDateUTC() + ").") && console.log(log.last);
              this.signOut(authenticator, { onErrorRedirect: true, isSessionExpired: true })
              .done(function() {
                logoutInitiated = false;
                log.debug("user.session: performSessionExpired: Automatic logout requests successfully sent.") && console.log(log.last);
              })
              .fail(function() {
                logoutInitiated = false;
                log.info("user.session: performSessionExpired: Sending automatic logout requests returned error.") && console.log(log.last);
              })
              .always(function() {
                log.info("user.session: performSessionExpired: Sending automatic logout requests finished, spawning redirect timer.") && console.log(log.last);
                // the timer based on kindnessPeriod may last longer than the session is valid, 
                // but redirectToTargetPage() supports this
                var timerRedirectId = setTimeout(function () {
                  logoutInitiated = false;
                  if ( timerRedirectId ) {
                    clearTimeout(timerRedirectId);
                    timerRedirectId = undefined;
                  }
                  log.info("user.session: performSessionExpired: Redirecting to target page...'") && console.log(log.last);
                  self.redirectToTargetPage(authenticator);
                }, kindnessPeriod);
              });
            }

            // keep dialog on page to hide content
          } else {
            log.debug("user.session: performSessionExpired: A logout is already executed.") && console.log(log.last);
          }
        } else {
          log.debug("user.session: performSessionExpired: Skipping automatic logout due to disabled expiration handling.") && console.log(log.last);
          this.clearExpirationTimer();
        }
      }

      /**
       * This function just perfroms the 'v2/messages/status' call and returns the result.
       * It does not handle the result.
       * @param {*} authenticator 
       */
      function getTicketExpires(authenticator, successFct = undefined, failureFct = undefined) {
        var self = this;
        var cgiUrl = new Url(authenticator.connection.url).getCgiScript();

        // performs 'GET v2/messages/status' call
        var messagesUrl = Url.combine(cgiUrl, 'api/v2/messages/status');
        authenticator.makeAjaxCall({
          url: messagesUrl,
          headers: { 
            OTCSTicket: authenticator.connection.session.ticket
          },
          success: function (response, textStatus, request) {
              log.debug('user.session: getTicketExpires: Receiving request response from {0}, textStatus: {1}', messagesUrl, textStatus) && console.log(log.last);
              response = authenticator.parseResponse(response, request);
              // update session and call indirectly updateSessionTicket
              authenticator.updateAuthenticatedSession(response, request);
            }
        })
        .done(function() {
          // the modal alert dialog handles destroy itself when you press a button
          self.startExpirationTimer(authenticator);
          if (successFct) {
            successFct();
          }
          log.info("user.session: getTicketExpires: Processed get ticket expires (currentDate: " + self.currentDateUTC() + ", expires: " + authenticator.connection.session.expires + ").") && console.log(log.last);
        })
        .fail(function(req) {           
          if (failureFct) {
            failureFct();
          } 
          self.sendAuthenticatorEvent(authenticator, 'expired');          
          // the error parameter is the request and the error-messages are in base.MessageHelper
          var errDetails = new base.RequestErrorMessage(req);
          var errResponse = lang.errorHttpPrefix + ' ' + errDetails.statusCode + (errDetails.message?': ':'') + errDetails.message;
          log.warn("user.session: getTicketExpires: Processing get ticket expires failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.warn(log.last);
          self.redirectToTargetPage(authenticator);
        });
      }

      function continueSession(authenticator) {
        var self = this;
        var cgiUrl = new Url(authenticator.connection.url).getCgiScript();

        // performs 'GET auth' call
        var authUrl = Url.combine(cgiUrl, 'api/v1/auth');
        authenticator.makeAjaxCall({
          url: authUrl,
          headers: { 
              OTCSTicket: authenticator.connection.session.ticket
            },
          success: function (response, textStatus, request) {
              log.debug('user.session: continueSession: Receiving request response from {0}.', authUrl) && console.log(log.last);
              response = authenticator.parseResponse(response, request);
              // update session and call indirectly updateSessionTicket
              authenticator.updateAuthenticatedSession(response, request);
            }
        })
        .done(function() {
          // the modal alert dialog handles destroy itself when you press a button
          self.startExpirationTimer(authenticator);
          log.info("user.session: continueSession: Processed continue session (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
        })
        .fail(function(req) {            
          self.sendAuthenticatorEvent(authenticator, 'failedTicketRefresh');          
          // the error parameter is the request and the error-messages are in base.MessageHelper
          var errMsg = lang.errorContinueSession;
          var errDetails = new base.RequestErrorMessage(req);
          var errResponse = lang.errorHttpPrefix + ' ' + errDetails.statusCode + (errDetails.message?': ':'') + errDetails.message;
          log.error("user.session: continueSession: Processing continue session failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
          csui.require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
            ModalAlert
              .showError(errMsg + '\n' + errResponse)
              .always(function () {
                self.redirectToTargetPage(authenticator);
              });
          });             
        });      
      }

      function sendAuthenticatorEvent(authenticator, reasonStr) {
        if (authenticator) {
          authenticator.trigger(reasonStr || 'loggedOut', { sender: authenticator });
        }
      }

      // The cmdData can contain optional flags:
      //   unauthenticateReason - user specified unauthenticateReason reason
      //   onErrorRedirect - if true, on error directly a redirect is performed 
      //                     otherwise a modal-error is displayed
      //   isSessionExpired - flag, if signOut-reason is an expired session (e.g. automatic logout)
      function signOut(authenticator, cmdData) {
        var deferred = $.Deferred();
        var self = this;
        cmdData || (cmdData = {});

        if (authenticator && authenticator.isAuthenticated()) {
          var cgiUrl = new Url(authenticator.connection.url).getCgiScript();

          csui.require(['csui/utils/routing',
                   'csui/utils/open.authenticated.page'
            ], function (routing, openAuthenticatedPage) {

            // Development HTML pages do not use the OTDS login page
            if (routing.routesWithSlashes()) {

              if (self.isSessionExpirationEnabled() === true) {

                if (authenticator && authenticator.makeAjaxCall && typeof authenticator.makeAjaxCall === 'function') {
                  // Invalidate the authenticated session, get the secure request token
                  // for the classic logout page and perform the logout by navigating there.
                  // Since csui.DoLogout is a ClassicUI call you have to provide a cookie.

                  // get secure request token
                  var tokenUrl = Url.combine(cgiUrl, 'api/v1/auth/logouttoken');
                  authenticator.makeAjaxCall({
                    url: tokenUrl,
                    headers: {
                      OTCSTicket: authenticator.connection.session.ticket
                    },
                    success: function (response, textStatus, request) {
                      log.debug('Receiving request response from {0}.', tokenUrl) && console.log(log.last);
                      response = authenticator.parseResponse(response, request);
                      // update session and call indirectly updateSessionTicket
                      authenticator.updateAuthenticatedSession(response, request);
                    }
                  }).then(function (response) {
                    // perform csui.DoLogout
                    var queryStr = 'func=csui.dologout&secureRequestToken=' + encodeURIComponent(response.token);
                    if (cmdData.isSessionExpired === true) {
                      // inform OTDS about expired session
                      queryStr += '&authcontext=sessionexpired';
                    }
                    var logoutFct = Url.appendQuery(cgiUrl, queryStr);
                    openAuthenticatedPage(authenticator.connection, logoutFct, {
                      openInNewTab: false
                    }).always(function() {
                      authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                      log.debug("user.session: signOut: The logout request was sent to server (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                      deferred.resolve();
                    });
                  }, function(req) {
                    // the error parameter is the request and the error-messages are in base.MessageHelper
                    var errMsg = lang.errorTerminateSession;
                    var errDetails = new base.RequestErrorMessage(req);
                    var errResponse = lang.errorHttpPrefix + ' ' + errDetails.statusCode + (errDetails.message?': ':'') + errDetails.message;
                    if (cmdData.onErrorRedirect === true) {
                      authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                      log.info("user.session: signOut: Terminate session was not successful, redirecting ... (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
                      self.redirectToTargetPage(authenticator);
                    } else {
                      log.error("user.session: signOut: Terminate session failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
                      csui.require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
                        ModalAlert
                          .showError(errMsg + '\n' + errResponse)
                          .always(function () {
                            authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                            // redirect without logout    
                            self.redirectToTargetPage(authenticator);
                          });                        
                      });
                    }
                    deferred.reject(req);     
                  });
                } else {
                  // we have no makeAjaxCall, so perform just redirect to target page
                  authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                  log.debug("user.session: signOut: makeAjaxCall is not available, so performing redirect to target page (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                  self.redirectToTargetPage(authenticator);
                  deferred.resolve();
                }

              } else {
                // no session expiration warning enabled
                // let the authenticators do their work, do not unauthenticate since it clears the session

                log.debug("user.session: signOut: Session expiration handling is disabled, skipping logout (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                deferred.resolve();
              }

            } else {
              
              // This is used on the development pages.
              // Invalidate the authenticated session and navigate to the login page.
              authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
              var signInPageUrl = config.signInPageUrl,
                  query = location.search;
              query += query ? '&' : '?';
              query += 'nextUrl=' + encodeURIComponent(location.pathname);
              var logoutUrl = signInPageUrl + query + location.hash;
              log.debug("user.session: signOut: Performed unauthenticate with redirect to development signIn page.") && console.log(log.last);
              location.href = logoutUrl;

              deferred.resolve();
            }
          });   // require

        } else {
          // not authenticated
          log.info("user.session: signOut: Authenticator is not 'authenticated' anymore, just returning success.") && console.log(log.last);
          deferred.resolve();
        }

        return deferred.promise();
      }    



      return {
        // this can be used by everyone and specifies the authentication expiration
        // configuration
        getSessionReactionTime: getSessionReactionTime,
        getSessionInactivity: getSessionInactivity,
        isSessionExpirationEnabled: isSessionExpirationEnabled,
        getCookieExpirationMode: getCookieExpirationMode,
        currentDateUTC: currentDateUTC,

        // these are helpers which can be used
        signOut: signOut,
        continueSession: continueSession,
        getTicketExpires: getTicketExpires,
        redirectToTargetPage: redirectToTargetPage,
        closeExpirationWarningDialog: closeExpirationWarningDialog,

        // these internal functions are needed by the dialog and views,
        // you should avoid to call these functions directly
        updateSessionTicket: updateSessionTicket,
        startExpirationTimer: startExpirationTimer,
        displayExpirationWarning: displayExpirationWarning,
        performSessionExpired: performSessionExpired,      
        clearExpirationTimer: clearExpirationTimer,
        stopExpirationWarningViewTimer: stopExpirationWarningViewTimer,      
        sendAuthenticatorEvent: sendAuthenticatorEvent,
        reinitExpirationTimer: reinitExpirationTimer,
        checkAndHandleExpired: checkAndHandleExpired,

        // private functions
        _createExpirationTimer: _createExpirationTimer,
        _shouldDisplayExpirationWarning: _shouldDisplayExpirationWarning,
        _adjustTimeCalculation: _adjustTimeCalculation,
        _showExpirationWarningDialog: _showExpirationWarningDialog,
        _checkCurrentExpirationFromServer: _checkCurrentExpirationFromServer
      };
 
    };

    return singleton();

  });
  

csui.define('csui/utils/authenticators/interactive.credentials.authenticator',[
  'require', 'module', 'csui/lib/underscore',
  'csui/utils/authenticators/request.authenticator'
], function (require, module, _, RequestAuthenticator) {
  'use strict';

  // Warns, that the developer did not specify any authentication ticket
  // or other header.  There is no interactive authentication in CS UI
  // Widgets.  Integrators have to authenticate, preferably by SSO.
  var InteractiveCredentialsAuthenticator = RequestAuthenticator.extend({
    interactive: function() {
      return true;
    },

    constructor: function InteractiveCredentialsAuthenticator(options) {
      RequestAuthenticator.prototype.constructor.call(this, options);
    },

    authenticate: function (options, succeeded, failed) {
      // Normalize input parameters, which are all optional.
      if (typeof options === 'function') {
        failed = succeeded;
        succeeded = options;
        options = undefined;
      }

      RequestAuthenticator.prototype.authenticate.call(this, options,
          succeeded, _.bind(this.openSignInDialog, this, succeeded));
    },

    openSignInDialog: function (succeeded) {
      if (this.reauthenticating) {
        return;
      }
      var self = this;
      self.reauthenticating = true;
      csui.require([
        'csui/utils/impl/signin.dialog/signin.dialog', 'csui/controls/progressblocker/blocker'
      ], function (SignInDialog, BlockingView) {
        var dialog = new SignInDialog({
          connection: self.connection
        });
        BlockingView.suppressAll();
        dialog.show()
              .done(function (args) {
                self.connection.session = args.session;
                self.reauthenticating = false;
                BlockingView.resumeAll();
                succeeded(self.connection);
              });
      });
    }
  });

  return InteractiveCredentialsAuthenticator;
});


/* START_TEMPLATE */
csui.define('hbs!csui/utils/authenticators/impl/redirecting.form.authenticator',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"on":(depth0 != null ? lookupProperty(depth0,"on") : depth0),"states":"true","iconName":(depth0 != null ? lookupProperty(depth0,"iconName") : depth0)},"loc":{"start":{"line":4,"column":8},"end":{"line":4,"column":59}}})) != null ? stack1 : "")
    + "        \n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class=\"icon circular "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"iconRight") || (depth0 != null ? lookupProperty(depth0,"iconRight") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"iconRight","hash":{},"loc":{"start":{"line":6,"column":34},"end":{"line":6,"column":47}}}) : helper)))
    + "\"></div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<button class=\"csui-signin-close csui-with-iframe\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dialogCloseButtonTooltip") || (depth0 != null ? lookupProperty(depth0,"dialogCloseButtonTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dialogCloseButtonTooltip","hash":{},"loc":{"start":{"line":1,"column":58},"end":{"line":1,"column":86}}}) : helper)))
    + "\"\n    aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dialogCloseAria") || (depth0 != null ? lookupProperty(depth0,"dialogCloseAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dialogCloseAria","hash":{},"loc":{"start":{"line":2,"column":16},"end":{"line":2,"column":35}}}) : helper)))
    + "\">    \n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"iconName") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":3,"column":4},"end":{"line":7,"column":11}}})) != null ? stack1 : "")
    + "</button>\n";
}});
Handlebars.registerPartial('csui_utils_authenticators_impl_redirecting.form.authenticator', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/utils/authenticators/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/utils/authenticators/impl/nls/root/lang',{

  dialogCloseButtonTooltip: 'Close',
  dialogCloseButtonAria: 'Close sign in dialog'

});




csui.define('css!csui/utils/authenticators/impl/redirecting.form.authenticator',[],function(){});

csui.define('csui/utils/authenticators/redirecting.form.authenticator',[
  'require', 'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/jquery', 'csui/utils/log',
  'csui/utils/authenticators/request.authenticator',
  'csui/utils/user.session/user.session',
  'hbs!csui/utils/authenticators/impl/redirecting.form.authenticator',
  'i18n!csui/utils/authenticators/impl/nls/lang',
  'css!csui/utils/authenticators/impl/redirecting.form.authenticator'
], function (require, module, _, Backbone, $, log, RequestAuthenticator, 
             UserSession, CloseButton, lang) {
  'use strict';
  log = log(module.id);

  var config                      = module.config(),
      authenticationIFrameTimeout = config.authenticationIFrameTimeout || 3000,
      showCloseButtonOnError      = config.showCloseButtonOnError;

  // Warns, that the developer did not specify any authentication ticket
  // or other header.  There is no interactive authentication in CS UI
  // Widgets.  Integrators have to authenticate, preferably by SSO.
  var RedirectingFormAuthenticator = RequestAuthenticator.extend({
    interactive: function() {      
      return false;      
    },

    constructor: function RedirectingFormAuthenticator(options) {
      RequestAuthenticator.prototype.constructor.call(this, options);
    },

    authenticate: function (options, succeeded, failed) {
      // Normalize input parameters, which are all optional.
      if (typeof options === 'function') {
        failed = succeeded;
        succeeded = options;
        options = undefined;
      }
      RequestAuthenticator.prototype.authenticate.call(this, options,
          succeeded, _.bind(this.initiateLoginSequence, this, succeeded, failed));
    },

    
    updateAuthenticatedSession: function (response, request) {
      // call the parent implementation
      RequestAuthenticator.prototype.updateAuthenticatedSession.call(this, response, request);

      if (this.connection.session && this.connection.session.ticket) {        
        // inform user session about updated ticket; in rare cases UserSession can be undefined 
        // if something went wrong in UserSession
        if ( UserSession ) {
          UserSession.updateSessionTicket(this, (request ? request : response));
        } else {
          log.info("redirecting.form.authenticator: updateAuthenticatedSession: UserSession is undefined, unable to updateSessionTicket in UserSession.") && console.log(log.last);
        }
      } else {
        log.error("redirecting.form.authenticator: updateAuthenticatedSession: Cannot get 'ticket' from just updated session, invalid request!") && console.error(log.last);
      }

    },

    unauthenticate: function (options) {
      var authen = this.isAuthenticated();
      if (UserSession && UserSession.isSessionExpirationEnabled()) {
        log.info("redirecting.form.authenticator: unauthenticate: ensure that the expiration warning dialog is closed.") && console.log(log.last);
        UserSession.closeExpirationWarningDialog();
      }
      if (authen && options && options.reason 
        && (options.reason === 'logged-out' || options.reason === 'expired') ) {
          if (UserSession && UserSession.isSessionExpirationEnabled() === true) {
            // Avoid popup of expiration warning dialog e.g. during ticket refresh.
            // Clear expiration timer.
            log.debug("redirecting.form.authenticator: unauthenticate: clearing expiration timer based on logged-out or expired.") && console.log(log.last);
            UserSession.clearExpirationTimer();
          }
      }
      // the parent clears the session and sends 'loggedOut'
      return RequestAuthenticator.prototype.unauthenticate.apply(this, arguments);
    },


    initiateLoginSequence: function (succeeded, failed) {
      // this method is trying to reauthenticate with OTDS in the background
      var self = this;
      var timer, dialog, urlOrigin;
      var skipFailedEvent = false;

      // the initiateLoginSequence is only called if the authenticate failed;
      if ( !isTruthy( self.getUserId() ) ) {
        showErrorMessage();
      } else {
        window.addEventListener('message', receiveMessage, false);
        createIFrame()
          .done(waitForLogin);
      }

      function showErrorMessage() {
        csui.require([
          'csui/controls/dialog/dialog.view',
          'csui/widgets/error.global/error.global.view'
        ], function (DialogView, ErrorGlobalView) {
          // wrong credentials is a programmer error and we must not translate this message
          var errorModel    = new Backbone.Model({
              message:  'The userId is undefined, the preceding authentication failed. Please initialize CSUI in a correct way.',
              hideNavigationButtons: true,
              showCloseButton: showCloseButtonOnError,
              errorCode: 401,
              showLogout: false
            }),
            errorGlobalView = new ErrorGlobalView({
              model: errorModel
            });

            var edialog = new DialogView({
              standardHeader: false,
              view: errorGlobalView,
              fullSize: true
            });
  
            edialog
              .on('destroy', handleDestroy)
              .on('childview:destroy', handleDestroy)
              .show();

            function handleDestroy() {
              reportFailedTicketRefresh();
              edialog.off('destroy', handleDestroy);
              edialog.off('childview:destroy', handleDestroy);
              // destroy the dialog and not just the view (but without receiving events again)
              edialog.destroy();
            }

          // get rid of rotating wheel
          suppressBlockingView();
        });
      }      

      function reportFailedTicketRefresh()  {
        if (skipFailedEvent === false && !self.isAuthenticated()) {
          log.warn("redirecting.form.authenticator: Sending 'failedTicketRefresh' event...") && console.log(log.last);
          self.trigger('failedTicketRefresh', { sender: self });
        }        
      }

      function createIFrame() {
        var deferred = $.Deferred();
        csui.require([
          'csui/lib/marionette', 
          'csui/controls/dialog/dialog.view',
          'csui/utils/url'          
        ], function (Marionette, DialogView, Url) {
          var src = Url.appendQuery(new Url(self.connection.url).getCgiScript(), 'func=csui.ticket');
          src = Url.appendQuery(src, 'userid=' + self.getUserId());
          urlOrigin = new Url(self.connection.url).getOrigin();

          var view = new Marionette.View({
            el: $('<iframe>', {
              width: '100%',
              height: '100%',
              src: src
            })
          });

          var ControlView = Marionette.ItemView.extend({

            ui: {
              closeButton: 'button.csui-signin-close'
            },

            templateHelpers: function () {
              return {
                dialogCloseButtonTooltip: lang.dialogCloseButtonTooltip,
                dialogCloseAria: lang.dialogCloseButtonAria,
                iconName: 'csui_action_close_white32',
                on: 'false'
              };
            },

            template: CloseButton,

            events: {
              'click @ui.closeButton': 'onButtonClick'
            },

            onButtonClick: function(event) {
              // use the matching implementation for destruction of the dialog from the parent
              dialog.onClickClose(event);
            }

          });

          dialog = new DialogView({
            className: 'csui-signin-close',
            standardHeader: false,
            view: view,
            fullSize: true,
            footerView: new ControlView()
          });
          view.render();

          //
          // Comment out code below because on a real server with SSO, it always fails.
          // The iframe load event is triggered 3 times:
          // - The first 2 times have undefined location. Thus, error is triggered.
          // - Only the third time has href pointing to the csui.ticket URL.
          //
          //view.el.addEventListener('load', function () {
          //  try {
          //    // If we cannot access the URL, the iframe was blocked by the content security policy.
          //    var href = !!this.contentWindow.location.href;
          //  } catch (error) {
          //    reportError(error);
          //  }
          //});
          dialog
            .on('destroy', function () {
              if(dialog.$el.parent().find(".cs-dialog.binf-modal").length <= 1 && $("body").hasClass("binf-modal-open"))
                $("body").removeClass("binf-modal-open"); // removing binf class from here as smart controls dialog view is currently removing this class only if the dialog is visible. 
              reportFailedTicketRefresh();
            })
            .show({render: false});

          dialog.$el.css({'z-index': '1061'});  // higher than popover
          dialog.$el.addClass('binf-hidden');
          deferred.resolve();
        }, deferred.reject);
        return deferred.promise();
      }

      function removeIFrame() {
        resumeBlockingView();
        // prevent failedTicketRefresh event from being triggered by destroy
        skipFailedEvent = true;
        dialog && dialog.destroy();
        skipFailedEvent = false;
      }

      function suppressBlockingView() {
        csui.require(['csui/controls/progressblocker/blocker'],
            function (BlockingView) {
              BlockingView.suppressAll();
            });
      }

      function resumeBlockingView() {
        csui.require(['csui/controls/progressblocker/blocker'],
            function (BlockingView) {
              BlockingView.resumeAll();
            });
      }

      function receiveMessage(event) {
        // the IFrame was created with urlOrigin, so check that we communicate only with our IFrame
        if (event.origin !== urlOrigin) {
          log.warn('redirecting.form.authenticator: event.origin and urlOrigin differ, aborting!') && console.warn(log.last);
          return;
        }
        if (event.data === 'csuiTicketLoaded') {
          log.info('redirecting.form.authenticator: Sending getOrigin back to child.') && console.log(log.last);
          event.source.postMessage('getOrigin', '*');
        } else {
          if (event.data.ticket) {
            log.debug('redirecting.form.authenticator: Redirecting Form Authenticator received new ticket.') && console.log(log.last);
            window.removeEventListener('message', receiveMessage, false);
            timer && clearTimeout(timer);
            timer = undefined;
            removeIFrame();
            var session = self.connection.session || (self.connection.session = {});
            session.ticket = event.data.ticket;
            session.expires = event.data.expires;
            session.serverDate = event.data.serverDate;
            succeeded && succeeded(self.connection);
            // if this ticket refresh will be used with expiration warning, inform here UserSession
            if (UserSession) {
              UserSession.updateSessionTicket(self);
            }
            // signal loggedIn (= ticket refreshed), like normal login-page does
            log.info("redirecting.form.authenticator: Sending 'loggedIn' event...") && console.log(log.last);
            self.trigger('loggedIn', {
              sender: self,
              connection: self.connection
            });            
          }
        }
      }

      function waitForLogin() {
        // If the server doesn't post a message after a few seconds, show the OTDS page.
        timer = setTimeout(enableInteactiveLogin, authenticationIFrameTimeout);
      }

      function enableInteactiveLogin() {
        // Show modal dialog containing the iFrame that shows the OTDS login page.
        if (dialog) {
          dialog.$el.removeClass('binf-hidden');
          suppressBlockingView();
        }
      }

      function reportError(error) {
        csui.require(['csui/dialogs/modal.alert/modal.alert'
        ], function (ModalAlert) {
          ModalAlert.showError(error.message);
        });
        failed(error, self.connection);
      }

      // avoid undefined, null, 0 and ''
      function isTruthy(n) {
        return !!n;
      }

    }
  });

  return RedirectingFormAuthenticator;
});


csui.define('csui/utils/authenticators/core.authenticators',[
  'module', 'csui/lib/underscore',
  'csui/utils/authenticators/ticket.authenticator',
  'csui/utils/authenticators/interactive.credentials.authenticator',
  'csui/utils/authenticators/redirecting.form.authenticator'
], function (module, _, TicketAuthenticator,
    InteractiveCredentialsAuthenticator, RedirectingFormAuthenticator) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
      .config['csui/utils/interactiveauthenticator'] || {},
      enableInteractiveAuthenticator = config.enabled,
      originalConfig = module.config();
  config = _.extend({
    // If there is no ticket, show a modal dialog with a login form and
    // allow the user to enter credentials and get a ticket.
    enableInteractiveAuthenticator: originalConfig.enableRedirectingFormAuthenticator === undefined &&
                                    enableInteractiveAuthenticator !== false,
    // If there is no ticket, try to get it using a request in a hidden
    // iframe. Using response redirection it either posts back a ticket
    // automatically, or it renders a login form and waits. The iframe
    // will be shown to the user, who will log in manually and let the
    // redirection to the pahe posting back tyhe ticket continue.
    enableRedirectingFormAuthenticator: false
  }, originalConfig);

  // If no custom authentication means are detected, authentication
  // will assume the native ticket. There are two authenticators, which
  // can be enabled to prompt for login, or fetch the ticket
  // automatically, is it is missing.
  var FallbackAuthenticator =
    config.enableInteractiveAuthenticator ?
      InteractiveCredentialsAuthenticator :
      config.enableRedirectingFormAuthenticator ?
        RedirectingFormAuthenticator :
        TicketAuthenticator;

  return [
    {
      sequence: 500,
      authenticator: FallbackAuthenticator
    }
  ];
});


csui.define('csui/models/node.createform/server.adaptor.mixin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url'
], function ($, _, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var path = 'forms/nodes/create',
              params = {
                parent_id: this.docParentId ? this.docParentId : this.node.get("id"),
                type: this.type
              },
              resource = path + '?' + $.param(params);
          return Url.combine(this.node.connector.connection.url, resource);
        },

        parse: function (response) {
          var forms = response.forms;

          // TODO this should be sent by server, remove when possible
          _.each(forms, function (form) {
            form.id = form.schema.title;
          });
          forms && forms.length && (forms[0].id = "general");

          return forms;
        }

      });
    }
  };


  return ServerAdaptorMixin;
});


csui.define('csui/models/server.info/server.adaptor.mixin',[
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
          var url = Url.combine(this.connector.getConnectionUrl().getApiBase('v1'), 'serverInfo');
          return url;
        },
        parse: function (response) {
          this._changing = false;
          return response;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});

csui.define('csui/models/permission/permission.precheck.server.adaptor',[
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
          var url = Url.combine(this.connector.getConnectionUrl().getApiBase('v2'), 'nodes',
              this.get("id"), '/descendents/subtypes/exists');
          if (this.get("subType") !== undefined) {
            url = Url.appendQuery(url, 'sub_types=' + this.get("subType"));
          }
          if (this.get("include_sub_items")) {
            url = Url.appendQuery(url, 'include_sub_items=' + this.get("include_sub_items"));
          }
         return url;
        },

        parse: function (response, options) {
          return response;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});

csui.define('csui/models/appliedcategories/category.server.adaptor.mixin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url'
], function ($, _, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var id = this.id, url;
          if (id) {
            url = Url.combine(this.node.urlBase(), 'categories', id);
          } else {
            url = Url.combine(this.node.urlBase(), 'categories');
          }
          return url;
        },

        parse: function (response, options) {
          return this.sortInitially(response.data);
        },

        sortInitially: function (data) {
          //default initial sort (only on arrays) is based on `name`.
          return _.isArray(data) ? _.sortBy(data, function (ele) {return ele.name.toLowerCase()}) :
                 data;
        }
      });
    }
  };


  return ServerAdaptorMixin;
});


csui.define('csui/models/appliedcategories/category',['csui/lib/backbone',
'csui/models/mixins/expandable/expandable.mixin',
'csui/models/mixins/resource/resource.mixin',
'csui/models/mixins/uploadable/uploadable.mixin',
'csui/models/appliedcategories/category.server.adaptor.mixin'
], function (Backbone, ExpandableMixin, ResourceMixin,
  UploadableMixin, ServerAdaptorMixin) {
    'use strict';

  var CategoryModel = Backbone.Model.extend({

    idAttribute: null,
    
    constructor: function CategoryModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.node = options.node;
      this.id = options.id;

      this.makeResource(options)
          .makeUploadable(options)
          .makeExpandable(options)
          .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  ExpandableMixin.mixin(CategoryModel.prototype);
  UploadableMixin.mixin(CategoryModel.prototype);
  ResourceMixin.mixin(CategoryModel.prototype);
  ServerAdaptorMixin.mixin(CategoryModel.prototype);

  return CategoryModel;
});


csui.define('csui/models/appliedcategories/systemattributes.server.adaptor.mixin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url'
], function ($, _, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var id = this.id,
              url = this.connector.getConnectionUrl().getApiBase('v2');
          url = Url.combine(url, "nodes", id, 'systemattributes');
          return url;
        },

        parse: function (response, options) {
          return response;
        }
      });
    }
  };


  return ServerAdaptorMixin;
});


csui.define('csui/models/appliedcategories/systemattributes.model',['csui/lib/backbone',
  'csui/models/mixins/expandable/expandable.mixin',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/appliedcategories/systemattributes.server.adaptor.mixin'
], function (Backbone, ExpandableMixin, ResourceMixin,
    UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var SystemAttributesModel = Backbone.Model.extend({

    idAttribute: null,

    constructor: function SystemAttributesModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.node = options.node;
      this.id = options.id;

      this.makeResource(options)
          .makeUploadable(options)
          .makeExpandable(options)
          .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  ExpandableMixin.mixin(SystemAttributesModel.prototype);
  UploadableMixin.mixin(SystemAttributesModel.prototype);
  ResourceMixin.mixin(SystemAttributesModel.prototype);
  ServerAdaptorMixin.mixin(SystemAttributesModel.prototype);

  return SystemAttributesModel;
});


csui.define('csui/models/appliedcategories/category.validation.server.adaptor.mixin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url'
], function ($, _, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var url = this.connector.getConnectionUrl().getApiBase('v1');
          url = Url.combine(url, 'validation/nodes/categories/enforcement');
          return url;
        },

        parse: function (response, options) {
          return response;
        }
      });
    }
  };


  return ServerAdaptorMixin;
});


csui.define('csui/models/appliedcategories/category.validation.model',['csui/lib/backbone',
  'csui/models/mixins/expandable/expandable.mixin',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/appliedcategories/category.validation.server.adaptor.mixin'
], function (Backbone, ExpandableMixin, ResourceMixin,
    UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var CategoryValidationModel = Backbone.Model.extend({

    idAttribute: null,

    constructor: function CategoryValidationModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeResource(options)
          .makeUploadable(options)
          .makeExpandable(options)
          .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  ExpandableMixin.mixin(CategoryValidationModel.prototype);
  UploadableMixin.mixin(CategoryValidationModel.prototype);
  ResourceMixin.mixin(CategoryValidationModel.prototype);
  ServerAdaptorMixin.mixin(CategoryValidationModel.prototype);

  return CategoryValidationModel;
});


csui.define('csui/models/navigation.history',[
  'module','csui/lib/underscore', 'csui/lib/backbone', 'csui/models/view.state.model'
], function (module, _, Backbone, viewStateModel) {
  'use strict';


  var NavigationHistory = Backbone.History.extend({
    constructor: function NavigationHistory(options) {
      Backbone.History.prototype.constructor.apply(this, arguments);

      var config = _.extend({
        urlCanChange: true
      }, module.config());

      this.urlCanChange = config.urlCanChange;
    },

    is: 'CSUINavigationHistory',

    checkUrl: function(e) {
      if (this.urlCanChange) {
        Backbone.History.prototype.checkUrl.call(this, e);
      }
    },

    _updateHash: function (location, fragment, replace) {
      if (this.urlCanChange) {
        Backbone.History.prototype._updateHash.call(this, location, fragment, replace);
      }
    },

    matchRoot: function () {
      if (this.urlCanChange) {
        return Backbone.History.prototype.matchRoot.call(this);
      }
      return true;
    }

  });

  //var history = new NavigationHistory();
  //Backbone.history = history;
  return NavigationHistory;
});


csui.define('bundles/csui-models',[
  // Models
  'csui/models/audit/audit.collection',
  'csui/models/authenticated.user.node.permission',
  'csui/models/favorite2',
  'csui/models/favorite2group',
  'csui/models/favorite2groups',
  'csui/models/favorites2',
  'csui/models/favorite2column',
  'csui/models/favorite2columns',
  'csui/models/favorite.model',
  'csui/models/permission/nodepermission.model',
  'csui/models/permission/nodeuserpermissions',
  'csui/models/server.module/server.module.collection',
  'csui/models/specificnodemodel',
  'csui/models/version',
  'csui/models/view.state.model',
  'csui/models/perspective/personalization.model',
  'csui/models/perspective/personalize/delta.generator',
  'csui/models/perspective/personalize/delta.resolver',
  'csui/models/memberancestorcollection',
  'csui/models/perspective/perspective.model',
  'csui/models/perspective/perspective.template.model',
  'csui/models/perspective/personalize/personalization.collection',
  'csui/models/perspective/perspective.collection/perspective.collection',

  // Model mixins
  'csui/models/widget/widget.collection',
  'csui/models/widget/widget.model',
  'csui/models/zipanddownload/zipanddownload.preflight',
  'csui/models/zipanddownload/zipanddownload.stages',

  // TODO: Remove this private module, once
  // csui/models/widget/search.results/search.metadata/search.columns
  // stops their bad practice.
  'i18n!csui/models/impl/nls/lang',

  // Utilities
  'csui/utils/base',
  'csui/utils/mime.types',
  'csui/utils/classic.nodes/classic.nodes',
  'csui/utils/defaultactionitems',
  'csui/utils/nodesprites',
  'csui/utils/node.info.sprites',
  'i18n!csui/utils/impl/nls/lang',
  'csui/utils/promoted.actionitems',
  'csui/utils/smart.nodes/smart.nodes',
  'csui/utils/perspective/perspective.util',
  'csui/utils/user.session/user.session',
  'csui/utils/exp.widget.config',

  // Authenticators
  'csui/utils/authenticators/core.authenticators',
  'csui/utils/authenticators/interactive.credentials.authenticator',
  'csui/utils/authenticators/redirecting.form.authenticator',


  'csui/themes/csui.jato.mime.icons',
  // Server Adaptors
  // TODO: Move them to the csui-server-adaptors bundle.
  'csui/models/audit/server.adaptor.mixin',
  'csui/models/node.createform/server.adaptor.mixin',
  'csui/models/permission/server.adaptor.mixin',
  'csui/models/permission/permission.action.server.adaptor.mixin',
  'csui/models/server.info/server.adaptor.mixin',
  'csui/models/permission/permission.precheck.server.adaptor',
  'csui/models/appliedcategories/category',
  'csui/models/appliedcategories/category.server.adaptor.mixin',
  'csui/models/appliedcategories/systemattributes.model',
  'csui/models/appliedcategories/systemattributes.server.adaptor.mixin',
  'csui/models/appliedcategories/category.validation.server.adaptor.mixin',
  'csui/models/appliedcategories/category.validation.model',

  'csui/models/navigation.history'
], {});

//# sourceMappingURL=csui-models.js.map