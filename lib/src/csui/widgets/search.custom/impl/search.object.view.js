/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/widgets/search.custom/impl/search.customFormView", "csui/controls/progressblocker/blocker", "csui/utils/contexts/factories/search.query.factory", "csui/widgets/search.custom/impl/search.customquery.factory", "csui/models/mixins/fetchable/fetchable.mixin", "csui/utils/contexts/factories/application.scope.factory", "i18n!csui/widgets/search.custom/impl/nls/lang", "hbs!csui/widgets/search.custom/impl/customsearch.main", "hbs!csui/widgets/search.custom/impl/error.template", "csui/utils/contexts/factories/next.node", "css!csui/widgets/search.custom/impl/search.custom.css" ], function(_, $, Marionette, SearchCustomFormView, BlockingView, SearchQueryModelFactory, SearchCustomQueryFactory, FetchableMixin, ApplicationScopeModelFactory, lang, SearchObjectTemplate, errorTemplate, NextNodeModelFactory) {
  var SearchObjectView = Marionette.CompositeView.extend({
    className: "csui-custom-view-search initialLoading",
    templateHelpers: function() {
      var messages = {
        search: lang.searchButtonMessage,
        reset: lang.resetButtonMessage
      };
      var hideSearchButton = this.options.hideSearchButton ? this.options.hideSearchButton : false;
      var showResetButton = this.options.showResetButton;
      var searchFormId = this.searchFormId;
      var searchButton = _.uniqueId("csui-custom-search-form-submit");
      var resetButton = _.uniqueId("csui-custom-search-form-reset");
      const isParentContainScroll = this._parent.el?.classList?.contains("csui-normal-scrolling");
      return {
        messages: messages,
        hideSearchButton: hideSearchButton,
        searchFormId: searchFormId,
        searchButton: searchButton,
        scrolling: !isParentContainScroll ? "csui-normal-scrolling" : "",
        resetButton: resetButton,
        showResetButton: showResetButton
      };
    },
    constructor: function SearchObjectView(options) {
      options = options || {};
      options.data || (options.data = {});
      this.context = options.context;
      this.searchFormId = _.uniqueId("csui-saved-search-form");
      this.jQuery = $;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      if (!options.model) {
        var savedSearchQueryId = options.data.savedSearchQueryId || options.savedSearchQueryId;
        this.model = options.context.getCollection(SearchCustomQueryFactory, {
          attributes: {
            id: savedSearchQueryId
          }
        });
        FetchableMixin.mixin(SearchCustomQueryFactory);
      }
      this.listenTo(this.model, "sync", this.render);
      this.listenTo(this.model, "error", this.handleError);
      this.loadingText = lang.loadingText;
      this.listenToOnce(this.model, "sync", function() {
        this.$el.removeClass("initialLoading");
      });
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
    },
    ui: function() {
      return {
        searchFormId: "#" + this.searchFormId,
        searchButton: ".csui-custom-search-form-submit",
        resetButton: ".csui-custom-reset-form-submit"
      };
    },
    template: SearchObjectTemplate,
    events: {
      "click .csui-custom-search-form-submit": "loadCustomSearch",
      "click @ui.resetButton": "resetCustomSearch"
    },
    onRender: function(e) {
      if (this.model.attributes && this.model.attributes.data) {
        this.defaultFormValues = structuredClone(this.model.get("data"));
        if (!!this.options.parentView) {
          if (!!this.model.get("schema").title) {
            this.options.parentView.options.title = this.model.get("schema").title;
          } else {
            this.options.parentView.options.title = !!this.options.parentView.options.data && !!this.options.parentView.options.data.title ? this.options.parentView.options.data.title : this.options.parentView.options.title || lang.title;
          }
          this.trigger("change:title");
        } else {
          var schemaSearchTitle = !!this.model.get("schema").title ? this.model.get("schema").title : lang.title;
          if (!!this.options.titleElement) {
            this.options.titleElement.html(schemaSearchTitle);
            this.options.titleElement.attr("title", schemaSearchTitle);
          }
        }
        if (this.options.customValues) {
          var isModelUpdatedWithCustomVals = this.updateCustomSearch(this.options.customValues.updatedValues, this.options.customValues.attributes, this.model.get("data"), true);
          if (isModelUpdatedWithCustomVals) {
            this.trigger("model:updated");
          }
        }
        this.options.objectView = this;
        var _searchCustomFormView = new SearchCustomFormView(_.extend(this.options, {
          model: this.model
        }));
        this.listenTo(_searchCustomFormView, "trigger:search", this._triggerSearch);
        this.listenTo(_searchCustomFormView, "enable:search", function(isSearchEnabled) {
          this._enableSearch(isSearchEnabled);
        });
        var _searchCustomFormViewEle = new Marionette.Region({
          el: this.ui.searchFormId
        });
        _searchCustomFormViewEle.show(_searchCustomFormView);
        this.customFormView = _searchCustomFormView;
        this.listenTo(this.customFormView.formView, "form:changed", function() {
          this.customFormView.formView.isFormChanged = true;
        });
        this.blockActions();
        if (this.options.disableSearch) {
          this._enableSearch(false);
        } else {
          var defaultValues = _.filter(_.flatten(_.map(this.model.get("data"), _.values)), function(val) {
            return val;
          });
          if (!!defaultValues && defaultValues.length === 0) {
            this._enableSearch(false);
          } else {
            this._enableSearch(true);
          }
        }
      }
    },
    handleError: function() {
      this.unblockActions();
      if (this.model.error && this.model.error.message) {
        this.options.parentView.options.title = !!this.options.parentView.options.data && !!this.options.parentView.options.data.title ? this.options.parentView.options.data.title : this.options.parentView.options.title || lang.title;
        this.trigger("change:title");
        this.ui.searchFormId.addClass("csui-custom-error");
        var emptyEl = errorTemplate.call(this, {
          errorMessage: this.model.error.message
        });
        this.ui.searchFormId.append(emptyEl);
        this.$el.find(".csui-saved-search-submit-container").addClass("binf-hidden");
      }
    },
    _triggerSearch: function() {
      var that = this;
      setTimeout(function(event) {
        if (!$(that.ui.searchButton).hasClass("binf-disabled")) {
          that.loadCustomSearch();
        }
      }, 50);
    },
    _enableSearch: function(isSearchEnabled) {
      if (isSearchEnabled) {
        $(this.ui.searchButton).removeClass("binf-disabled").removeClass("csui-search-form-submit-disabled").removeAttr("disabled");
        this.trigger("enable:search", true);
      } else {
        $(this.ui.searchButton).addClass("binf-disabled").addClass("csui-search-form-submit-disabled").attr("disabled", true);
        this.trigger("enable:search", false);
      }
    },
    onRenderForm: function() {
      this.unblockActions();
      if (this.options.parentView && typeof this.options.parentView.unblockActions === "function" && this.applicationScope && this.applicationScope.id != "search") {
        this.options.parentView.unblockActions();
      }
      return;
    },
    onFieldUpdated: function() {
      this.loadCustomSearch();
    },
    _checkEqualValues: function(obj1, obj2) {
      var keys = Object.keys(obj1);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (obj1[key] instanceof Object) {
          if (!this._checkEqualValues(obj1[key], obj2[key])) {
            return false;
          }
        } else if (obj1[key] != obj2[key]) {
          return false;
        }
      }
      return true;
    },
    updateCustomSearch: function(updatedFormValues, updatedValues, dataModel, checkDiff) {
      var foundDiff = false;
      if (!!updatedFormValues) {
        if (checkDiff) {
          foundDiff = !this._checkEqualValues(this.model.attributes.data, updatedFormValues);
        }
        this.model.attributes.data = _.extend(this.model.attributes.data, updatedFormValues);
      } else if (!!updatedValues) {
        var self = this, cloneUpdatedValues = Object.create(updatedValues);
        _.each(dataModel, function(dataVal, dataKey) {
          if (dataVal instanceof Object) {
            _.each(dataVal, function(cVal, cKey) {
              if (cVal instanceof Object) {
                if (cVal instanceof Array) {
                  if (!!cloneUpdatedValues[cKey]) {
                    if (checkDiff && !foundDiff) {
                      foundDiff = cVal[0] != cloneUpdatedValues[cKey];
                    }
                    cVal[0] = cloneUpdatedValues[cKey];
                    delete cloneUpdatedValues[cKey];
                  }
                } else {
                  _.each(cVal, function(cV, cK) {
                    if (!!cloneUpdatedValues[cK]) {
                      if (checkDiff && !foundDiff) {
                        foundDiff = cVal[cK] != cloneUpdatedValues[cK];
                      }
                      cVal[cK] = cloneUpdatedValues[cK];
                      delete cloneUpdatedValues[cK];
                    }
                  });
                }
              } else if (!!cloneUpdatedValues[cKey]) {
                if (checkDiff && !foundDiff) {
                  foundDiff = dataVal[cKey] != cloneUpdatedValues[cKey];
                }
                dataVal[cKey] = cloneUpdatedValues[cKey];
                delete cloneUpdatedValues[cKey];
              }
            });
          }
        });
        _.each(cloneUpdatedValues, function(val, key) {
          if (key !== "query_id") {
            var keyTokens = key.indexOf("__") !== -1 ? key.split("__") : undefined, tempObj = {};
            if (!!keyTokens) {
              var parentAttr = keyTokens[0].indexOf("_") !== -1 ? key.split("_") : undefined;
              if (!!parentAttr) {
                tempObj[key] = val;
                var parentObj = this.model.attributes.data[parentAttr[0]];
                parentObj[keyTokens[0]] = _.extend(parentObj[keyTokens[0]], tempObj);
                checkDiff && (foundDiff = true);
              } else {
                tempObj[key] = val;
                this.model.attributes.data[keyTokens[0]] = _.extend(this.model.attributes.data[keyTokens[0]], tempObj);
                checkDiff && (foundDiff = true);
              }
            } else {
              var keyToken = key.indexOf("_") !== -1 ? key.split("_") : undefined;
              tempObj[key] = val;
              if (keyToken) {
                this.model.attributes.data[keyToken[0]] = _.extend(this.model.attributes.data[keyToken[0]], tempObj);
                checkDiff && (foundDiff = true);
              }
            }
          }
        }, this);
      }
      return checkDiff ? foundDiff : undefined;
    },
    loadCustomSearch: function() {
      var defaultValues = this.customFormView.formView.customFilter();
      if (!!defaultValues && defaultValues.length !== 0) {
        if (this.$(".csui-custom-search-form-submit").hasClass("binf-disabled")) {
          this._enableSearch(true);
        }
        var isFormChanged = this.customFormView && this.customFormView.formView ? this.customFormView.formView.isFormChanged : undefined;
        if (isFormChanged !== undefined && !isFormChanged) {
          return;
        }
        this.updatedFormValues = this.customFormView.formView.getValues();
        this.queryModel = this.options.query || this.context.getModel(SearchQueryModelFactory);
        this.nextNode = this.context.getModel(NextNodeModelFactory);
        if (!this.options.query && _.isEmpty(this.queryModel.attributes) && _.isEmpty(this.nextNode.attributes)) {
          history.pushState({
            search: {
              name: undefined,
              id: undefined
            }
          }, "", location.href);
        }
        this.queryModel.clear({
          silent: true
        });
        this.queryModel.updatedValues = this.updatedFormValues;
        var params = {};
        _.each(this.updatedFormValues, function(curChild) {
          if (curChild instanceof Object) {
            _.each(curChild, function(childValue, childKey) {
              if (childValue instanceof Object) {
                _.each(childValue, function(val, key) {
                  if (val instanceof Object) {
                    _.each(val, function(val, key) {
                      params[key] = val;
                    });
                  } else {
                    params[key] = val;
                  }
                });
              } else {
                params[childKey] = childValue;
              }
            });
          }
        });
        params["query_id"] = this.model.get("data").templateId;
        params.forcePerspectiveChange = this.options.showInSearchResultsNewPerspective;
        this.resetPageDefaults();
        this.queryModel.set(params);
        this.trigger("click:search");
      } else {
        this._enableSearch(false);
      }
    },
    resetCustomSearch: function() {
      this._enableSearch(true);
      this.customFormView.model.set("data", structuredClone(this.defaultFormValues));
      this.customFormView.formView.isFormChanged = true;
    },
    resetPageDefaults: function() {
      this.queryModel.resetDefaults = true;
    }
  });
  return SearchObjectView;
});