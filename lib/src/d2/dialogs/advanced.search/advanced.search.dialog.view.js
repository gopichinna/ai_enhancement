/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/url", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/controls/form/pub.sub", "csui/controls/progressblocker/blocker", "csui/utils/commands", "smart/dialogs/modal.alert/modal.alert", "d2/controls/globalmessage/globalmessage", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/group.panel/group.panel.view", "d2/dialogs/advanced.search/advanced.search.form.view", "d2/dialogs/new.file/edit/header.message.view", "d2/utils/advanced.search.utils", "dctmw/utils/utils", "d2/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "i18n!d2/dialogs/advanced.search/impl/nls/lang", "css!d2/dialogs/advanced.search/impl/advanced.search.dialog.view" ], function($, _, Marionette, Url, TabablesBehavior, PubSub, BlockingView, commands, ModalAlert, GlobalMessage, WizardTabableRegionBehavior, GroupPanelView, AdvancedSearchFormView, HeaderMessageView, AdvancedSearchUtils, utils, constants, RestLinkrels, RestResources, lang) {
  "use strict";
  return GroupPanelView.extend({
    className: function() {
      return GroupPanelView.prototype.className + " d2-advanced-search-dialog csui-normal-scrolling";
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    constructor: function AdvancedSearchDialogView(options) {
      options = options || {};
      options.groups = options.groups || this._buildGroups(options);
      options.groupData = options.groupData || {};
      _.extend(options.groupData, options.searchConfig || {}, {
        wizard: options.wizard
      });
      options.isSavedSearchUpdatable = this._checkSavedSearchForEditPermission(options.savedSearchModel);
      if (options.savedSearchModel && options.savedSearchModel.get("name") !== "lastSearch" && options.isSavedSearchUpdatable) {
        this.previouslySavedSearch = {
          id: options.savedSearchModel.get("id"),
          name: options.savedSearchModel.get("name"),
          type: options.savedSearchModel.get("r_object_type")
        };
      }
      GroupPanelView.prototype.constructor.call(this, options);
      var blockingView = this.options.blockingView || this.options.wizard;
      if (blockingView) {
        BlockingView.delegate(this, blockingView);
      } else {
        BlockingView.imbue(this);
      }
      this.currentlyFocusedElement = function(event) {
        var tabElements = this.$(TabablesBehavior.focusablesSelector).filter(":visible:not([disabled])"), elToFocus;
        if (tabElements.length) {
          tabElements.prop("tabindex", "-1");
          tabElements = tabElements.not(tabElements.filter(".d2-group-content:not(.group-expanded) *:not(.d2-group-expandCollapse)"));
          tabElements.prop("tabindex", 0);
        }
        if (!!event && event.shiftKey) {
          elToFocus = tabElements[tabElements.length - 1];
        } else {
          elToFocus = tabElements[0];
        }
        if (!event.preventScroll) {
          var elemScrollParent = this.$el;
          var elemTop = $(elToFocus).offset().top, viewportTop = elemScrollParent[0].getBoundingClientRect().top, viewportBottom = elemScrollParent[0].getBoundingClientRect().bottom, isElemVisible = elemTop > viewportTop && elemTop < viewportBottom;
          if (!isElemVisible) {
            var currScrollTop = elemScrollParent.scrollTop();
            elemTop < viewportBottom ? elemScrollParent.scrollTop(currScrollTop + (elemTop - viewportBottom)) : elemScrollParent.scrollTop(currScrollTop - (viewportTop - elemTop));
          }
        }
        return elToFocus;
      };
      this.listenTo(this, "d2:group:expand:collapse", function() {
        this.currentlyFocusedElement({
          preventScroll: true
        });
      }.bind(this));
      this.listenTo(this, "group:form:value:changed", this.formValueChanged.bind(this));
      this.listenTo(this, "update:footer", this.updateFooter.bind(this));
    },
    formValueChanged: function(childview) {
      _.each(this.children._views, function(gContentView) {
        if (childview !== gContentView.contentView) {
          gContentView.contentView.trigger("form:value:changed");
        }
      });
    },
    validateSaveAction: function(skipTypes) {
      return this.isValid() && this.isSaveFieldPopulated() && this.isValueUpdated(skipTypes);
    },
    isSaveAsModeEnabled: function() {
      return this.previouslySavedSearch && this.isSearchNameUpdated();
    },
    isSearchNameUpdated: function() {
      var saveFormView = this.getContentViewByType("save"), values = saveFormView && saveFormView.form && saveFormView.getValues(), searchNameInForm = values && values["search_name"], previouslySavedSearchName = this.previouslySavedSearch && this.previouslySavedSearch.name || "";
      if (previouslySavedSearchName === searchNameInForm) {
        return false;
      }
      return true;
    },
    isValid: function() {
      var isValid = true;
      _.each(this.children._views, function(childView) {
        isValid = isValid && childView && childView.getContentView() && childView.getContentView().isValidForm();
      });
      return isValid;
    },
    validateAllForms: function(refreshState, validateOnlyRequiredFields) {
      var dfd = $.Deferred(), promises = [];
      _.each(this.children._views, function(childView) {
        var formView = childView && childView.getContentView();
        promises.push(formView.validateForm(refreshState, validateOnlyRequiredFields));
      });
      $.whenAll.apply($, promises).done(function(validationsList) {
        var validationStatus = !_.contains(validationsList, false);
        dfd.resolve(validationStatus);
      }.bind(this));
      return dfd.promise();
    },
    isSaveFieldPopulated: function() {
      var saveFormView = this.getContentViewByType("save"), values = saveFormView && saveFormView.getValues();
      return !_.isEmpty(values && values["search_name"]);
    },
    isValueUpdated: function(skipTypes) {
      var isUpdated = false;
      _.each(this.children._views, function(childView) {
        var contentView = childView.getContentView();
        if (skipTypes && _.contains(skipTypes, contentView.options.formType)) {
          return;
        }
        isUpdated = isUpdated || contentView.isUpdated();
      });
      return isUpdated;
    },
    updateInitialValues: function() {
      _.each(this.children._views, function(childView) {
        childView.getContentView().updateInitialValue();
      });
      this.updateFooter();
    },
    updateFooter: function() {
      this.options.wizard && this.options.wizard.refreshFooter();
    },
    getPreviouslySavedSearch: function() {
      return this.previouslySavedSearch;
    },
    getAllValues: function() {
      var values = {};
      _.each(this.children._views, function(childView) {
        if (childView && childView.getContentView()) {
          _.extend(values, childView.getContentView().getValues());
        }
      });
      return values;
    },
    _getSaveLink: function() {
      return RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_SAVED_SEARCH);
    },
    _createPayload: function(excludeSearchName) {
      var values = this.getAllValues(), fulltextOperatorMap = AdvancedSearchUtils.getFullTextOperationMapping();
      return $.extend({}, {
        search_name: !excludeSearchName ? values["search_name"] : undefined,
        link_id: !excludeSearchName ? values["search_save"].category ? values["search_save"].key : undefined : undefined,
        search_category: !excludeSearchName ? values["search_save"].category || values["search_save"].key : undefined,
        search_in_folders: values["search_in"] && values["search_in"].length ? {
          folder_descend: !!values["include_sub_folders"].length,
          folder_path_ids: values["search_in"]
        } : undefined,
        search_types: values["types"],
        case_sensitive: values["case_sensitive"] ? !!values["case_sensitive"].length : undefined,
        all_version: !!values["include_all_versions"].length,
        wizard_search: !excludeSearchName && !!values["display_advanced_search_form"].length,
        search_columns: {
          display_columns: values["columns"],
          order_by_column: values["default_order"] ? [ values["default_order"] ] : undefined,
          order_by_direction: values["default_order"] ? values["order_direction"].length > 0 ? [ "ascending" ] : [ "descending" ] : undefined
        },
        facets: values["facets"],
        fulltext: this.options.searchConfig.is_full_text_search_enabled === true && values["full_text_search_type"] ? {
          fulltext_operator: fulltextOperatorMap[values["full_text_search_type"]],
          fulltext_words: values["full_text_search_input"]
        } : undefined,
        "expression-set": !_.isEmpty(values["property_search"].criteria) ? values["property_search"]["expression-set"] : undefined
      });
    },
    executeAdvancedSearch: function() {
      var me = this;
      this.resolveSavedSearchId().done(function(savedSearchId) {
        me.invokeSavedSearchCommand(savedSearchId);
        me.options.wizard && me.options.wizard.close(true);
      });
    },
    invokeSavedSearchCommand: function(savedSearchId, disableTriggerOnNavigate) {
      var executeSavedSearchCommand = commands.get("D2-ExecuteSavedSearch");
      executeSavedSearchCommand.execute({
        savedSearchId: savedSearchId,
        context: this.options.context,
        disableTriggerOnNavigate: disableTriggerOnNavigate
      });
    },
    resolveSavedSearchId: function() {
      var me = this, dfd = $.Deferred();
      if (me.previouslySavedSearch && me.previouslySavedSearch.id && me.isSaveFieldPopulated() && me.isValueUpdated() === false) {
        dfd.resolve(me.previouslySavedSearch.id);
      } else {
        var payload = this._createPayload(true);
        this.blockActions();
        me.invokeSavedSearchAPI({
          payload: payload
        }).done(function(response) {
          me.unblockActions();
          var savedSearchId = _.findWhere(response.attributes, {
            name: "id"
          }).value;
          dfd.resolve(savedSearchId);
        }).fail(function(xhr) {
          me.unblockActions();
          var errorMsg = utils.parseAjaxErrorAsString(xhr);
          me.showBanner("error", errorMsg || lang.searchFail);
          dfd.reject(xhr);
        });
      }
      return dfd.promise();
    },
    saveOrUpdateSavedSearch: function(closeDialogAfterSave) {
      this.clearBanner();
      if (this.isSaveAsModeEnabled() || !this.previouslySavedSearch) {
        return this.saveAdvancedSearch(closeDialogAfterSave);
      } else {
        return this.updateSavedSearch(closeDialogAfterSave);
      }
    },
    updateSavedSearch: function(closeDialogAfterSave) {
      var dfd = $.Deferred(), payload = this._createPayload(), savedSearchId = this.previouslySavedSearch.id, me = this;
      me.clearBanner();
      me.blockActions();
      me.invokeSavedSearchAPI({
        savedSearchId: savedSearchId,
        payload: payload
      }).done(function() {
        me.unblockActions();
        if (closeDialogAfterSave) {
          me.options.wizard && me.options.wizard.close(true, _.str.sformat(lang.saveSuccess, payload["search_name"]));
        } else {
          me.showBanner("success", _.str.sformat(lang.saveSuccess, payload["search_name"]));
          me.updateInitialValues();
          me._updateTileCollection();
        }
        dfd.resolve(savedSearchId);
      }).fail(function(xhr) {
        me.unblockActions();
        var errorMsg = utils.parseAjaxErrorAsString(xhr);
        if (closeDialogAfterSave) {
          me.options.wizard && me.options.wizard.close(false, errorMsg);
        } else {
          me.showBanner("error", errorMsg);
        }
        dfd.reject();
      });
      return dfd.promise();
    },
    saveAdvancedSearch: function(closeDialogAfterSave) {
      var dfd = $.Deferred(), payload = this._createPayload(), me = this;
      me.clearBanner();
      me.blockActions();
      me.invokeSavedSearchAPI({
        payload: payload
      }).done(function(response) {
        var savedSearchId = _.findWhere(response.attributes, {
          name: "id"
        }).value;
        me.options.isSavedSearchUpdatable = true;
        me.previouslySavedSearch = {
          id: savedSearchId,
          name: payload["search_name"],
          type: payload["wizard_search"] === true ? "d2c_query_wizard" : "d2c_query"
        };
        me.unblockActions();
        if (closeDialogAfterSave) {
          me.options.wizard && me.options.wizard.close(true, _.str.sformat(lang.saveSuccess, payload["search_name"]));
        } else {
          me.showBanner("success", _.str.sformat(lang.saveSuccess, payload["search_name"]));
          me.updateInitialValues();
          me.trigger("advanced:search:saved");
          me._updateTileCollection();
        }
        dfd.resolve(savedSearchId);
      }).fail(function(xhr) {
        me.unblockActions();
        var errorMsg = utils.parseAjaxErrorAsString(xhr);
        if (closeDialogAfterSave) {
          me.options.wizard && me.options.wizard.close(false, errorMsg);
        } else {
          me.showBanner("error", errorMsg);
        }
        dfd.reject();
      });
      return dfd.promise();
    },
    _updateTileCollection: function() {
      var namedSessionStorage = utils.getSessionStore(constants.StorageKey.WIDGET_CONTEXT);
      namedSessionStorage.set("WidgetReload", true);
      PubSub.trigger("d2:savedsearch:collection:sync");
    },
    invokeSavedSearchAPI: function(options) {
      options = options || {};
      var dfd = $.Deferred(), httpMethod = "POST", url = this._getSaveLink(), payload = options.payload;
      if (options.savedSearchId) {
        url = Url.combine(url, options.savedSearchId);
        httpMethod = "PUT";
      }
      if (payload["link_id"]) {
        url = Url.appendQuery(url, Url.combineQueryString({
          "parent-id": payload["link_id"]
        }));
      }
      $.ajax(this.options.connector.extendAjaxOptions({
        url: url,
        type: httpMethod,
        contentType: constants.MediaTypes.DCTM_JSON,
        data: JSON.stringify(payload),
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
      return dfd.promise();
    },
    showBanner: function(mode, message) {
      if (this.options.showMessageInPanel === false) {
        GlobalMessage.showMessage(mode, message);
        this.clearBanner();
        return;
      }
      if (this.destroyTimeout) {
        clearTimeout(this.destroyTimeout);
        this.destroyTimeout = null;
      }
      this.headerMessageView && this.headerMessageView.destroy();
      this.headerMessageView = new HeaderMessageView({
        mode: mode,
        message: message
      });
      this.headerMessageRegion && this.headerMessageRegion.destroy();
      var el = $('<div class="d2-advanced-search-header-message-container"></div>');
      el.insertBefore(this.$el);
      this.headerMessageRegion = new Marionette.Region({
        el: el[0]
      });
      this.headerMessageRegion.show(this.headerMessageView);
      this.trigger("show:banner:message");
      this.$el.scrollTop(0);
      if (mode === "success") {
        this.destroyTimeout = setTimeout(function() {
          this.clearBanner();
        }.bind(this), 5e3);
      }
    },
    clearBanner: function() {
      this.headerMessageView && this.headerMessageView.destroy();
      this.headerMessageRegion && this.headerMessageRegion.destroy();
      this.headerMessageView = this.headerMessageRegion = null;
      this.$el.parent().find(".d2-advanced-search-header-message-container").remove();
      this.trigger("clear:banner:message");
    },
    _checkSavedSearchForEditPermission: function(savedSearchModel) {
      return !!(savedSearchModel && savedSearchModel.actions && savedSearchModel.actions.findWhere({
        signature: "Rename"
      }));
    },
    _buildGroups: function(options) {
      return [ {
        name: lang.saveGroupName,
        subtitle: lang.saveGroupSubtitle,
        contentView: AdvancedSearchFormView,
        groupType: "save",
        contentViewOptions: {
          formType: "save"
        }
      }, {
        name: lang.typeGroupName,
        subtitle: lang.typeGroupSubtitle,
        indicateRequired: true,
        initialExpand: true,
        contentView: AdvancedSearchFormView,
        groupType: "type",
        contentViewOptions: {
          formType: "type"
        }
      }, {
        name: lang.searchGroupName,
        subtitle: lang.searchGroupSubtitle,
        initialExpand: true,
        contentView: AdvancedSearchFormView,
        groupType: "search",
        contentViewOptions: {
          formType: "search",
          search_in_storeContainer: options.search_in_storeContainer,
          search_in_restoreContainer: options.search_in_restoreContainer
        }
      }, {
        name: lang.displayGroupName,
        subtitle: lang.displayGroupSubtitle,
        contentView: AdvancedSearchFormView,
        groupType: "display",
        contentViewOptions: {
          formType: "display"
        }
      } ];
    }
  });
});