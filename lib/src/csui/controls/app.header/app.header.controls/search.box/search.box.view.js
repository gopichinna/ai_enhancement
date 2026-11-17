/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette3", "csui/lib/backbone", "csui/models/node/node.model", "csui/utils/contexts/factories/search.query.factory", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/contexts/factories/search.box.factory", "csui/utils/contexts/factories/next.node", "csui/utils/namedsessionstorage", "csui/widgets/search.forms/search.forms", "csui/utils/namedlocalstorage", "csui/utils/contexts/factories/branding.config.factory", "csui/utils/contexts/factories/search.formquery.factory", "i18n!csui/controls/app.header/app.header.controls/search.box/impl/nls/lang", "css!csui/controls/app.header/app.header.controls/search.box/impl/search.box" ], function(module, _, $, Marionette, Backbone, NodeModel, SearchQueryModelFactory, ApplicationScopeModelFactory, SearchBoxFactory, NextNodeModelFactory, NamedSessionStorage, SearchForms, NamedLocalStorage, BrandingConfigFactory, SearchFormQueryModelFactory, lang) {
  var config = _.defaults({}, module.config() ?? {}, {
    enableSearchBarSettings: true
  });
  let SearchBoxView = Marionette.View.extend({
    template: false,
    namedSessionStorage: new NamedSessionStorage(),
    namedLocalStorage: new NamedLocalStorage("search_bar_settings"),
    performClickAction: false,
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
      this.searchForms = new SearchForms({
        options: this.options,
        connector: this.searchboxModel && this.searchboxModel.connector,
        originatingView: this
      });
      this.brandingConfigData = this.options.context.getModel(BrandingConfigFactory);
      this.otcData = {
        query: "",
        showFromHere: false,
        isFetched: true
      };
      this.deferred = $.Deferred();
      this.updateData();
      this.listenTo(context, "sync:perspective", this._perspectiveSynced);
      this.listenTo(context, "change:current:node", this._currentNodeChanged);
      this.listenTo(this.searchboxModel, "change", this.setOTCData);
      this.listenTo(this.searchboxModel, "change", this.updateSearchBarSettings);
      this.nextmodel = this.options.context.getModel(NextNodeModelFactory);
      this.listenTo(this, "form:click", this._formClick);
      this.listenTo(this, "slice:click", this._sliceClick);
      this.listenToOnce(this, "fetch:data", this._dataSynced);
      this.listenTo(this, "perform:search", this.performSearch);
      this.listenTo(this, "more:forms:click", this._moreFormsCicked);
      this.stopListening(this.nextmodel, "change:id").listenTo(this.nextmodel, "change:id", this._changeLocation);
      this.options.otcEl.addEventListener("open", _.bind(this._onOpen, this));
      this.firstOpen = true;
    },
    _onOpen: function() {
      if (this.firstOpen) {
        this._updateInput();
        this.trigger("data:synced");
        this.firstOpen = false;
      }
    },
    onDestroy: function() {
      this.options.otcEl.removeEventListener("open", _.bind(this._onOpen, this));
    },
    performSearch: function(event, searchOption) {
      let value = event.detail.searchstring;
      if (!!value) {
        this._setSearchQuery(value, searchOption, event);
        this._updateInput();
        this.trigger("data:synced");
      }
    },
    _changeLocation: function() {
      this.trigger("collapse:search");
    },
    _updateInput: function() {
      var value = this.model.get("where") || "";
      this.otcData.query = value;
    },
    updateData: function() {
      this.otcData = _.extend(this.otcData, {
        tooltipstartsearch: lang.tooltipstartsearch,
        tooltipclearkeywords: lang.tooltipclearkeywords,
        tooltipsearchbutton: lang.tooltipsearchbutton,
        tooltipsearchbuttonopen: lang.tooltipsearchbuttonopen,
        arialabelsearchbutton: lang.arialabelsearchbutton
      });
      this.trigger("data:synced");
    },
    updateSearchBarSettings: function() {
      this.search_bar_settings = this.searchboxModel.get("search_bar_settings");
      if (this.search_bar_settings && this.search_bar_settings.full_text) {
        this.namedLocalStorage.set("full_text", this.search_bar_settings.full_text);
        if (!!this.model) {
          var full_text = this.search_bar_settings && this.search_bar_settings.full_text;
          this.model.set("modifier", full_text.modifier, {
            silent: true
          });
          this.model.set("lookfor", full_text.lookfor, {
            silent: true
          });
        }
      }
    },
    _formClick: function(event) {
      this.hideBackButton = true;
      this.searchForms.isModelFetched($(event.target).attr("formId"));
    },
    _moreFormsCicked: function(event) {
      this.hideBackButton = false;
      this.searchForms.isKeyPress = event.keyCode === 13 || event.keyCode === 32;
      this.searchForms.openFormInSidepanel(this.searchboxModel.get("search_forms"));
    },
    _sliceClick: function(event) {
      if ($(event.target).attr("checked")) {
        let sliceID = $(event.target).attr("sliceId");
        let sliceTxt = "{" + sliceID + "}";
        this.namedLocalStorage.set("selectedSlice", sliceTxt);
      } else {
        this.namedLocalStorage.remove("selectedSlice");
      }
    },
    _perspectiveSynced: function(context, perspectiveSource) {
      this._currentNodeChanged(perspectiveSource);
    },
    _currentNodeChanged: function(currentNode) {
      if (currentNode instanceof NodeModel && (currentNode.get("container") || currentNode.get("type") === 5574)) {
        this.searchboxModel.nodeId = currentNode.get("id");
        this.searchboxModel.nodeName = currentNode.get("name");
        this.namedSessionStorage.set(this.searchboxModel.nodeId, this.searchboxModel.nodeName);
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
    _setSearchQuery: function(value, searchOption, event) {
      let sliceString = this._getSliceString();
      this.model.clear({
        silent: true
      });
      this.options.context.getModel(SearchFormQueryModelFactory).clear({
        silent: true
      });
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
      var full_text = this.search_bar_settings && this.search_bar_settings.full_text;
      if (full_text && (full_text.modifier || full_text.lookfor)) {
        params["modifier"] = full_text.modifier;
        params["lookfor"] = full_text.lookfor;
      }
      this.model.set(params);
    },
    _dataSynced: function(context, perspectiveSource) {
      var self = this;
      if (this.searchboxModel) {
        if (this.options.data && this.options.data.alwaysFetchDropdown || !(this.searchboxModel && this.searchboxModel.fetched)) {
          this.searchBoxFactory.fetch().then(() => {
            self.deferred.resolve();
          }, () => {
            self.deferred.reject();
          });
        }
      }
      self.deferred.promise().then(() => {
        self.otcData.isFetched = true;
      }, () => {
        self.otcData.isFetched = false;
        self.trigger("data:synced");
      });
    },
    setOTCData: function(e) {
      if (this.otcData.isFetched) {
        if (!this.searchboxModel.nodeId) {
          var currentNode = _.has(this.options, "context") && this.options.context.getModel(NextNodeModelFactory);
          if (currentNode && currentNode instanceof NodeModel && (currentNode.get("container") || currentNode.get("type") === 5574)) {
            this.searchboxModel.nodeId = currentNode.get("id");
            this.searchboxModel.nodeName = currentNode.get("name");
            this.namedSessionStorage.set(this.searchboxModel.nodeId, this.searchboxModel.nodeName);
          }
        }
        if (!this.searchboxModel.nodeId && this.model.get("location_id1")) {
          this.searchboxModel.nodeId = this.model.get("location_id1");
          if (!!this.namedSessionStorage.get(this.searchboxModel.nodeId)) {
            this.searchboxModel.nodeName = this.namedSessionStorage.get(this.searchboxModel.nodeId);
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
          this.searchOptions = _.extend(this.searchOptions, this.searchboxModel.attributes);
        }
        this.otcData.slices = this.searchOptions?.slices;
        if (this.searchOptions?.nodeName) {
          this.otcData.location = {
            locationId: this.searchOptions?.nodeId,
            locationName: this.searchOptions?.nodeName
          };
        } else {
          this.otcData.location = undefined;
        }
        this.otcData.forms = this.searchOptions?.search_forms?.recent_search_forms ?? [];
        if (this.namedLocalStorage.get("selectedSlice")) {
          let selectedSlice = this.namedLocalStorage.get("selectedSlice");
          selectedSliceID = selectedSlice.substring(1, selectedSlice.length - 1);
          this.otcData.selectedSlice = selectedSliceID;
        }
        this.trigger("data:synced");
      }
    },
    onRender: function() {}
  });
  return SearchBoxView;
});