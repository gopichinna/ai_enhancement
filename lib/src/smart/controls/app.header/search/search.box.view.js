/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette3", "nuc/lib/backbone", "smart/controls/app.header/search/location/location.view", "smart/controls/app.header/search/slices/slices.view", "smart/controls/app.header/search/forms/forms.view", "smart/controls/app.header/search/slices/slice.item.view", "smart/controls/app.header/search/forms/forms.item.view", "hbs!smart/controls/app.header/search/impl/search.box", "i18n!smart/controls/app.header/search/impl/nls/lang" ], function(module, _, $, Marionette, Backbone, locationView, SliceCollectionView, formsView, sliceItemView, formsItemView, template, lang) {
  let searchBoxView = Marionette.View.extend({
    tagName: "otc-menu",
    template: template,
    ui: {
      loadingMenu: ".loading-menu",
      moreText: ".more-text",
      slice: ".sliceContainer",
      form: ".formContainer",
      location: ".locationContainer",
      sectionDivider: ".section-divider",
      formsDivider: ".forms-divider",
      formsMoreDivider: ".forms-more-divider",
      moreRecentButton: ".smart-show-more-recent"
    },
    templateContext: function() {
      return {
        moreTxt: lang.searchFormsText,
        loadingErrorText: lang.loadingViewErrorText,
        loadingText: lang.loadingText,
        savedMoreTxt: lang.showMoreText
      };
    },
    attributes: function() {
      let attrs = {
        issearch: "",
        iswide: ""
      };
      return attrs;
    },
    constructor: function searchBoxView(options = {}) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "slice:item:click", this._locationClick);
      this.listenTo(this, "form:item:click", this._formClick);
      this.listenTo(this, "saved:form:item:click", this._savedFormClick);
      this.listenTo(this, "form:item:remove", this._formRemove);
      this.options?.otcEl.addEventListener("click", _.bind(this._searchClick, this));
      this.options?.otcEl.addEventListener("search", _.bind(this._onSearch, this));
    },
    events: {
      "item-click .more-text": "_moreFormsClick",
      "click .smart-show-more-recent": "_moreRecentClick",
      "keydown .smart-show-more-recent": "_moreRecentClick"
    },
    performClickAction: false,
    _formClick: function(formInfo) {
      this.leadingView.trigger("form:click", formInfo);
    },
    _savedFormClick: function(formInfo) {
      this.leadingView.trigger("saved:form:click", formInfo);
    },
    _formRemove: function(formInfo) {
      this.leadingView.trigger("form:remove", formInfo);
    },
    _moreRecentClick: function(event) {
      if (event?.type === "click" || event?.keyCode == 13 || event?.keyCode == 32) {
        this.leadingView.trigger("more:recent:click", event);
      }
    },
    _moreFormsClick: function(event) {
      this.leadingView.trigger("more:forms:click", event);
    },
    _locationClick: function(locationInfo) {
      this.leadingView.trigger("slice:click", locationInfo);
    },
    _searchClick: function() {
      this.leadingView.trigger("fetch:data");
    },
    _onSearch: function(event) {
      let cbEle = $(this.options.otcEl).find("otc-menugroup:not(.binf-hidden) otc-menucheckbox"), sliceSelected = $(cbEle)?.attr("checked"), searchOption = "";
      if (sliceSelected) {
        searchOption = $(cbEle).attr("id");
      }
      this.leadingView.trigger("perform:search", event, searchOption);
    },
    onShow: function() {
      this.otcData = {};
      this.leadingView = new this.options.leadingView(this.options);
      this.leadingView.render();
      let prevRecentForms = "";
      this.listenTo(this.leadingView, "data:synced", _.bind(function() {
        this.otcData = _.extend(this.otcData, this?.leadingView?.otcData);
        this.options.otcEl.setAttribute("value", this.otcData?.query ?? "");
        if (this.otcData.isFetched) {
          let slices = this.otcData?.slices ?? [];
          this.slicesCollection = new Backbone.Collection();
          let sliceRegion = "";
          if (!this.otcData?.slices || this.otcData?.slices?.length == 0) {
            this.sliceContainer = this?.$el?.find(".sliceContainer");
          } else {
            slices.forEach(slice => {
              if (slice) {
                let sliceModel = new Backbone.Model({
                  label: slice.sliceDisplayName,
                  id: slice.sliceId
                });
                this.slicesCollection.add(sliceModel);
                this.showMenu = true;
              }
            });
            this.sliceCollectionView = new SliceCollectionView({
              collection: this.slicesCollection,
              leadingView: this?.leadingView
            });
            sliceRegion = new Marionette.Region({
              el: ".sliceContainer",
              replaceElement: true
            });
          }
          this.formCollection = new Backbone.Collection();
          let recentFormstoShow = this.otcData?.forms ? this.otcData?.forms?.slice(0, 5) : [];
          let recentFormsUpdated = true;
          if (prevRecentForms !== "" && Object.keys(prevRecentForms).length > 0 && recentFormstoShow.length > 0) {
            recentFormsUpdated = recentFormstoShow[0].name !== prevRecentForms?.name || recentFormstoShow[0].id !== prevRecentForms?.id;
          }
          if (recentFormstoShow.length > 0) {
            prevRecentForms = recentFormstoShow[0];
          }
          let formsRegion = "";
          if (recentFormsUpdated && recentFormstoShow.length > 0) {
            this.recentForms = true;
            this.ui.moreText[0].innerHTML = lang.moreSearchFormsText;
            recentFormstoShow.forEach(form => {
              if (form) {
                var formView = new formsItemView({
                  label: form.name,
                  id: form.id,
                  icon: form?.icon,
                  jatoIcon: form?.jatoIcon
                });
                this.formCollection.add(formView);
              }
              this.showMenu = true;
            });
            if (this.$el.find(".formContainer").length === 0) {
              this.formsElement.insertAfter(this.$el.find(".section-divider"));
            }
            let groupName = this?.otcData?.savedForms !== undefined ? lang.recentSearches : "";
            this.formGroup = new formsView({
              collection: this.formCollection,
              leadingView: this,
              groupName: groupName
            });
            formsRegion = new Marionette.Region({
              el: ".formContainer",
              replaceElement: true
            });
          }
          if (!this.recentForms && recentFormstoShow.length === 0 && this.$el.find(".formContainer").length > 0) {
            this.formsElement = this.$el.find(".formContainer");
            this.$el.find(".formContainer").remove();
          }
          this.savedFormCollection = new Backbone.Collection();
          let savedFormsRegion = "";
          if (this.otcData?.savedForms !== undefined) {
            this.ui.moreText[0].innerHTML = lang.advancedSearch;
          }
          if (!this.otcData?.savedForms || this.otcData?.savedForms?.length == 0) {
            this.savedFormsElement = this.$el.find(".savedFormContainer");
            this.$el.find(".savedFormContainer").remove();
            this.ui.formsMoreDivider.addClass("binf-hidden");
          } else {
            let eleLen = this.el.querySelectorAll(".savedFormContainer");
            if (eleLen.length == 0) {
              let savedFormsContainer = document.createElement("div");
              savedFormsContainer.setAttribute("class", "savedFormContainer");
              $(savedFormsContainer).insertAfter(this.$el.find(".forms-divider"));
              this.savedFormsElement = this.$el.find(".savedFormContainer");
            }
            let savedFormstoShow = this.otcData?.savedForms ? this.otcData?.savedForms?.slice(0, 5) : [];
            let moreButton = this.otcData?.savedForms?.length > 5;
            if (savedFormstoShow.length > 0) {
              if (moreButton) {
                this.ui.moreRecentButton.removeClass("binf-hidden");
              } else {
                this.ui.moreRecentButton.addClass("binf-hidden");
              }
              savedFormstoShow.forEach(form => {
                if (form) {
                  var formView = new formsItemView({
                    label: form.name,
                    id: form.id,
                    icon: form?.icon,
                    jatoIcon: form?.jatoIcon,
                    deletable: true,
                    savedSearches: true,
                    arialabel: form?.arialabel
                  });
                  this.savedFormCollection.add(formView);
                }
                this.showMenu = true;
              });
              this.savedFormGroup = new formsView({
                collection: this.savedFormCollection,
                leadingView: this,
                groupName: lang.savedSearches,
                className: "savedFormContainer"
              });
              savedFormsRegion = new Marionette.Region({
                el: ".savedFormContainer",
                replaceElement: true
              });
            }
          }
          let locationData = this.otcData?.location;
          let locationRegion = "";
          if (locationData !== undefined) {
            this.locationView = new locationView({
              nodeName: locationData?.locationName,
              id: locationData.locationId
            });
            locationRegion = new Marionette.Region({
              el: ".locationContainer",
              replaceElement: true
            });
          } else {
            this.$el.find(".locationContainer").addClass("binf-hidden");
          }
          this.otcData?.slices?.length === 0 && this.otcData?.forms?.length === 0 && (this.showMenu = true);
          this.otcData?.forms?.length === 0 && this.otcData?.savedForms?.length === 0 && (this.showMenu = true);
          if (this?.showMenu) {
            this.ui.loadingMenu.addClass("binf-hidden");
            if (sliceRegion !== "" && sliceRegion.$el[0] instanceof HTMLElement) {
              sliceRegion.show(this.sliceCollectionView);
              this.ui.sectionDivider.removeClass("binf-hidden");
            }
            this.options.otcEl.addEventListener("open", _.bind(function() {
              this.sliceCollectionView?.trigger("reorder:collection");
            }, this));
            if (formsRegion !== "" && formsRegion.$el[0] instanceof HTMLElement) {
              formsRegion?.show(this.formGroup);
              this.ui.formsDivider.removeClass("binf-hidden");
            }
            if (savedFormsRegion !== "" && savedFormsRegion.$el[0] instanceof HTMLElement) {
              savedFormsRegion?.show(this.savedFormGroup);
              this.ui.formsMoreDivider.removeClass("binf-hidden");
            }
            if (locationRegion !== "" && locationRegion.$el[0] instanceof HTMLElement) {
              locationRegion?.show(this.locationView);
            }
            this.ui.moreText.removeClass("binf-hidden");
          }
        } else {
          this.ui.loadingMenu.attr("showError", "");
        }
      }, this));
    }
  });
  return searchBoxView;
});