/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/lib/backbone", "csui/utils/non-emptying.region/non-emptying.region", "csui/themes/csui.jato.action.icons", "i18n!csui/widgets/search.forms/impl/nls/lang", "css!csui/widgets/search.forms/impl/search.forms" ], function(_, $, Marionette, Backbone, NonEmptyingRegion, JatoIcons, lang) {
  "use strict";
  var SearchForm = Marionette.View.extend({
    className: "csui-search-form-container",
    constructor: function SearchForm(options) {
      options || (options = {});
      this.models = new Backbone.Collection();
      Marionette.View.prototype.constructor.call(this, options);
    },
    findButton: function(ele, btnType, value) {
      var button = _.find(ele, function(item) {
        return item.get("btnType") === btnType;
      });
      button && button.set("hidden", value);
    },
    openFormInSidepanel: function(searchFormCollectionOrModel, searchFormId) {
      var deferred = $.Deferred();
      var self = this;
      require([ "csui/controls/side.panel/side.panel.view", "csui/widgets/search.forms/search.form.view", "csui/widgets/search.forms/search.forms.container.view", "i18n" ], function(SidePanelView, SearchFormView, SearchFormsContainerView, i18n) {
        var title;
        const isRtl = i18n && i18n.settings?.rtl;
        if (searchFormId) {
          var schema = searchFormCollectionOrModel.get("schema");
          title = schema.title ? schema.title : searchFormCollectionOrModel.get("name");
          self.customSearchForm = new SearchFormView({
            model: searchFormCollectionOrModel,
            searchFormId: searchFormId,
            hideSearchButton: true,
            showInSearchResultsNewPerspective: true,
            context: self.options.options.context
          });
          self.sidePanel ? self.sidePanel.options.slides[0].content = self.customSearchForm : "";
        } else {
          if (!self.searchFormsContainerView) {
            self.searchFormsContainerView = new SearchFormsContainerView({
              searchFormsList: searchFormCollectionOrModel,
              originatingView: self
            });
          }
          title = lang.searchFormLabel;
          self.sidePanel ? self.sidePanel.options.slides[0].content = self.searchFormsContainerView : "";
          self.searchFormsContainerView.$el.removeClass("binf-hidden");
        }
        if (!self.sidePanel || self.sidePanel && self.sidePanel.isDestroyed) {
          var sidePanel = new SidePanelView({
            slides: [ {
              title: title,
              content: searchFormId ? self.customSearchForm : self.searchFormsContainerView,
              footer: {
                leftButtons: [ {
                  type: "action",
                  icon: "smart_action:action_back32",
                  jatoIcon: JatoIcons.actionArrowLeft,
                  btnType: "back",
                  className: "cs-go-back arrow_back",
                  attributes: {
                    title: lang.btnBack,
                    "aria-label": lang.btnBackAriaLabel
                  },
                  disabled: !!self.options.originatingView.hideBackButton
                } ],
                rightButtons: [ {
                  label: lang.search,
                  type: "action",
                  id: "search-btn",
                  btnType: "search",
                  attributes: {
                    title: lang.btnSearch,
                    "aria-label": lang.btnSearch
                  },
                  className: "binf-btn binf-btn-primary csui-custom-search-form-submit cs-search",
                  disabled: false
                } ]
              }
            } ],
            sidePanelClassName: "cvs-in-sidepanel"
          });
          self.sidePanel = sidePanel;
          sidePanel.show();
        } else if (self.sidePanel.$el.is(":visible")) {
          var bodyRegion = new NonEmptyingRegion({
            el: self.sidePanel.ui.body
          });
          self.sidePanel.slides[0].title = title;
          if (searchFormId) {
            bodyRegion.$el.find(".csui-search-forms-list").addClass("binf-hidden");
            bodyRegion.$el.find(".csui-search-form-collection").addClass("binf-hidden");
            bodyRegion.$el.find(".csui-custom-view-search").removeClass("binf-hidden");
          } else {
            bodyRegion.$el.find(".csui-search-forms-list").removeClass("binf-hidden");
            bodyRegion.$el.find(".csui-search-form-collection").removeClass("binf-hidden");
            bodyRegion.$el.find(".csui-custom-view-search").remove();
            self.sidePanel.trigger("after:show");
          }
          self.sidePanel.headerView.update(self.sidePanel.options.slides[0]);
          if (searchFormId) {
            bodyRegion.show(self.sidePanel.options.slides[0].content);
          }
        }
        self.sidePanel.listenTo(self.customSearchForm, "enable:search", function(isSearchEnabled) {
          self.sidePanel.trigger("update:button", "search-btn", {
            disabled: !isSearchEnabled
          });
        });
        var defaultValues = _.filter(_.flatten(_.map(self.customSearchForm && self.customSearchForm.model.get("data"), _.values)), function(val) {
          return val;
        });
        let disableSearch = true;
        if (!!defaultValues && defaultValues.length > 0) {
          for (let value of defaultValues) {
            if (typeof value === "number" || typeof value === "string" && !/^(anydate|anyvalue)/i.test(value)) {
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
          $(".cs-search").removeClass("binf-disabled").removeClass("csui-search-form-submit-disabled");
          self.customSearchForm?.trigger("enable:search", true);
        } else {
          $(".cs-search").addClass("binf-disabled").addClass("csui-search-form-submit-disabled");
          self.customSearchForm?.trigger("enable:search", false);
        }
        if (!searchFormId) {
          self.findButton(self.sidePanel.footerView.leftCollection.models, "back", true);
          self.findButton(self.sidePanel.footerView.rightCollection.models, "search", true);
        } else {
          if (!self.options.originatingView.hideBackButton) {
            self.findButton(self.sidePanel.footerView.leftCollection.models, "back", false);
          } else {
            self.findButton(self.sidePanel.footerView.leftCollection.models, "back", true);
          }
          self.customSearchForm.listenTo(self.customSearchForm, "render:form", function() {
            self.sidePanel.triggerMethod("set:focus");
          });
          self.findButton(self.sidePanel.footerView.rightCollection.models, "search", false);
        }
        self.sidePanel && self.sidePanel.footerView.trigger("update:footer");
        self.options.originatingView.$el.find(".csui-searchforms-popover-row").removeClass("binf-disabled");
        self.sidePanel && self.sidePanel.$el.find(".csui-searchforms-popover-row").removeClass("binf-disabled");
        self.sidePanel.listenTo(self.customSearchForm, "button:click", function(actionButton) {
          if (actionButton.btnType === "search") {
            self.customSearchForm.options.query = self.options.options.model;
            self.customSearchForm.loadCustomSearch();
          } else if (actionButton.btnType === "back") {
            self.openFormInSidepanel(self.options.originatingView.searchboxModel.get("search_forms"));
            return;
          }
          self.sidePanel.hide();
        });
        self.sidePanel.listenTo(self.sidePanel, "after:show", function() {
          if (self.isNewForm) {
            self.customSearchForm.customFormView.formView.isFormChanged = undefined;
          }
          if (this.$el.find(".csui-searchforms-popover-row").length && self.isKeyPress) {
            this.$el.find(".csui-searchforms-popover-row")[0].focus();
            self.isKeyPress = false;
          }
          var cid = self.options.originatingView.cid;
          $(document).off("click." + cid + " keydown." + cid);
        });
        self.sidePanel.listenTo(self.sidePanel, "before:hide", function() {
          var searchBoxView = self.options.originatingView;
          if (!searchBoxView?.options?.otcEl) {
            $(document).on("click." + searchBoxView.cid + " keydown." + searchBoxView.cid, searchBoxView, searchBoxView._hideSearchBar);
          }
          self.options.originatingView?.ui?.input?.attr("tabindex", 0);
        });
        self.sidePanel.listenTo(self.sidePanel, "keydown", function(event) {
          if (event.keyCode === 9) {
            if (event.shiftKey && $(event.target)[0].id === "csui-side-panel-cancel") {
              var that = self;
              if (!!that.searchFormsContainerView) {
                setTimeout(function() {
                  that.searchFormsContainerView.systemSearchForms.$el.find(".csui-searchforms-popover-row")[0].focus();
                }, 0);
              }
            }
          }
        });
        self.sidePanel.listenTo(self.customSearchForm, "click:search", function() {
          self.sidePanel.hide();
        });
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    },
    isModelFetched: function(searchFormId) {
      this.isNewForm = true;
      if (this.models && this.models.length && this.models.get(searchFormId)) {
        var data = JSON.parse(JSON.stringify(this.models.get(searchFormId).originalAttributesData));
        this.models.get(searchFormId).set("data", data);
        this.openFormInSidepanel(this.models.get(searchFormId), searchFormId);
      } else {
        var self = this;
        require([ "csui/widgets/search.forms/search.form.model" ], function(SearchFormModel) {
          var searchFormModel = new SearchFormModel({
            id: searchFormId
          }, {
            connector: self.options.connector,
            options: self.options
          });
          searchFormModel.fetch().then(function(result) {
            var data = JSON.parse(JSON.stringify(searchFormModel.attributes.data));
            searchFormModel.originalAttributesData = data;
            self.models.push(searchFormModel);
            self.openFormInSidepanel(searchFormModel, searchFormId);
          });
        });
      }
    }
  });
  return SearchForm;
});