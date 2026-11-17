/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/utils/accessibility", "csui/utils/commands", "csui/widgets/metadata/metadata.properties.view", "smart/controls/tab.panel/tab.panel.view", "csui/controls/form/form.view", "csui/controls/toolbar/toolitem.model", "csui/controls/toolbar/toolitems.mask", "nuc/lib/jsonpath", "d2/utils/form.utils", "d2/controls/tab.panel/d2tab.links.ext.view", "d2/controls/tab.panel/metadata.edit.view", "d2/widgets/metadata/general.panels/d2/d2.general.form.view", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/widgets/metadata/tab.contents.esignature/tab.contents.esignature.view", "d2/widgets/metadata/error.panel/error.panel.view", "d2/widgets/metadata/behavior/d2.metadata.properties.keyboard.behavior", "csui/dialogs/modal.alert/modal.alert", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/constants", "d2/utils/node.utils", "dctmw/utils/user.preference.storage", "dctmw/utils/authenticators/session", "csui/controls/toolbar/toolitems.factory", "csui/controls/form/pub.sub", "d2/utils/format.utils", "i18n!d2/widgets/metadata/impl/nls/lang", "css!d2/widgets/metadata/impl/metadata.properties.css" ], function(i18n, _, $, Backbone, Marionette, Accessibility, commands, MetadataPropertiesView, TabPanelView, FormView, ToolItemModel, ToolItemsMask, jsonPath, formUtils, D2TabLinkCollectionViewExt, MetadataEditView, D2FormView, d2genFormModel, D2ESignatureView, D2ErrorPanelView, D2MetadataPropertiesKeyboardBehavior, Alert, RestLinkrels, utils, constants, nodeUtils, userPreference, Session, ToolItemsFactory, PubSub, FormatUtils, lang) {
  var D2MetadataPropertiesView = MetadataPropertiesView.extend({
    className: function() {
      var className = MetadataPropertiesView.prototype.className;
      if (_.isString(className)) {
        className += " d2-metadata-properties d2-set-container";
      } else {
        className = className.apply(this, arguments) + " d2-metadata-properties d2-set-container";
      }
      return className;
    },
    constructor: function D2MetadataPropertiesView(options) {
      if (options?.suppressSpyScroll) {
        options.hideTabLinkConversion = true;
        options.hideStickyHeader = true;
      }
      options.hideRequiredFieldsSwitch = true;
      options.notTabableRegion = false;
      options["TabLinkCollectionViewClass"] = D2TabLinkCollectionViewExt;
      options.action = options.action || "edit";
      this.slidingList = [];
      this.behaviors.TabPanelKeyboardBehavior.behaviorClass = D2MetadataPropertiesKeyboardBehavior;
      options.toolbarItems = {
        addPropertiesToolbar: new ToolItemsFactory({}),
        rightToolbar: new ToolItemsFactory({})
      };
      options.context = options.context || Session.get().getContext();
      options.tabContentAccSelectors = "a[href]:not(.fr-command), area[href], input:not([disabled])," + " select:not([disabled]), textarea:not([disabled])," + " button:not([disabled],.fr-command), iframe, object, embed," + " *[tabindex]:not(.fr-command), *[data-cstabindex], *[contenteditable]";
      MetadataPropertiesView.prototype.constructor.apply(this, arguments);
      this.listenTo(Backbone, "dctmw:metadata:schema:updated", function(model) {
        this.tabLinks && this.tabLinks.trigger("dctmw:metadata:schema:updated", model);
        this.tabContent && this.tabContent._setLastTabCssClass();
        this._computeTablinkWidth();
        this._enableToolbarState();
      }, this);
      this.listenTo(this, "render", this.loadListheight);
      this.listenTo(PubSub, "update:scroll:position", function(elementHeight, elementOffsetTop) {
        if (!_.isUndefined(elementHeight) && !_.isUndefined(elementOffsetTop)) {
          this.updateScrollPosition(elementHeight, elementOffsetTop);
        }
      }.bind(this));
      this.listenTo(PubSub, "change:panel:layout", this._toggleMiniviewer);
      if (this.options.metadataView && this.options.metadataView.childWithBlockingView) {
        this.listenTo(this.options.metadataView.childWithBlockingView, "restore:additional:widget", this._onRestoreMiniviewer);
      }
      if (this.options.metadataView && this.options.metadataView._parentLayoutView()) {
        this.listenTo(this.options.metadataView._parentLayoutView(), "restore:additional:widget", this._onRestoreMiniviewer);
      }
      var resizeFn = _.bind(this.reLayoutPanels, this);
      $(window).on("resize", resizeFn);
      this.once("before:destroy", function() {
        $(window).off("resize", resizeFn);
      });
      this.listenTo(this.options.node, "sync", function() {
        if (!this.options.node.get("container")) {
          this.allForms.fetched = false;
          this.render();
        }
      }.bind(this));
      this._setupMiniviewerToolbar();
      this.listenTo(this.options.metadataView?.metadataTabView?.tabLinks?.selected, "change", selected => {
        if (selected.get("name") === "properties") {
          this._onViewerMinimized();
        }
      });
      this.listenTo(this, "add:mini:viewer", this._addMiniViewer.bind(this));
      this.listenTo(this, "panel:activated", this.addPreviewIcon.bind(this));
      this.listenTo(PubSub, "d2:form:expression:executed", this._formExpressionExecuted);
    },
    _formExpressionExecuted(control, methodName, value) {
      var buttonModel = this.options?.wizard?.steps[this.options.wizard.currentStep].buttons.find(button => button.id === control);
      if (!buttonModel) return;
      if (buttonModel) {
        switch (methodName) {
         case "setEnabled":
          buttonModel.disabled = !value;
          break;

         case "setVisible":
          buttonModel.hidden = !value;
          break;

         default:
          return;
        }
      }
      this.options.wizard.footerView.refresh([ control ]);
    },
    addPreviewIcon: function() {
      if (this.options.metadataView.metadataHeaderView.rightbarView.options.toolbarItems.rightToolbar && this.options.metadataView.metadataHeaderView.rightbarView.options.toolbarItems.rightToolbar.collection.find({
        signature: "D2-RestoreMiniviewer"
      })) {
        if (!this._retreiveMiniViewerPanelVisibilitySetting()) {
          this.miniviewerButtonSuppressorMask && this.miniviewerButtonSuppressorMask.clearMask();
        }
      }
    },
    _triggerMiniviewerVisibility: function(isShown) {
      if (isShown && (this.miniviewerView && !this.miniviewerView._isMinimized || !this.miniviewerView && this.viewer_visiblity_pref !== false)) {
        this.enablePreviewRegion();
      } else {
        this.disablePreviewRegion();
      }
    },
    updateScrollPosition: function(elementHeight, elementOffsetTop) {
      if (this.tabContent && this.tabContent.$el) {
        var tabScrollTop = this.tabContent.$el.scrollTop(), tabHeight = this.tabContent.$el.height(), elementTop = elementOffsetTop - this.tabContent.$el.offset().top;
        if (tabHeight < elementTop + elementHeight) {
          var scrollMore = elementTop + elementHeight - tabHeight;
          this.tabContent.$el.scrollTop(tabScrollTop + scrollMore);
        }
      }
    },
    onPanelActivated: function() {
      if (this.options.action === "edit") {
        this.context && this.context.viewStateModel.set({
          properties: true
        }, {
          silent: true
        });
      }
    },
    loadListheight: function() {
      var self = this;
      var triggerVisibleEvent = _.bind(function(control) {
        _.each(control.children, function(childControl) {
          if (childControl.isContainer() && childControl.children) {
            triggerVisibleEvent(childControl);
          }
          if (childControl.fieldView && childControl.fieldView._events["after:visible"]) {
            childControl.fieldView.trigger("after:visible", childControl.fieldView);
          }
        });
      }, this);
      this._allFormsRenderedPromise().done(function() {
        var childrenView = self.options.tabPanel.tabContent._getImmediateChildren();
        _.each(childrenView, function(childView) {
          triggerVisibleEvent(childView.content.form);
        });
      });
    },
    _allFormsRenderedPromise: function() {
      var allFormsRendered = [];
      this.tabContent.children.each(_.bind(function(childView) {
        var formRendered = $.Deferred();
        allFormsRendered.push(formRendered.promise());
        var childViewContent = childView.content;
        if (childViewContent instanceof FormView && !childViewContent.isRenderFinished()) {
          this.listenTo(childViewContent, "render:form", function() {
            formRendered.resolve();
          });
        } else {
          formRendered.resolve();
        }
      }, this));
      return $.when.apply($, allFormsRendered);
    },
    contentView: function() {
      return D2FormView;
    },
    _syncForms: function() {
      var self = this;
      this.blockActions();
      this._clearValidationError();
      self._fetchingForms = false;
      self.collection.reset(this.allForms.models);
      self._checkCategoriesActions();
      self.unblockActions();
    },
    setGridState: function() {
      this.options.gridState = {};
    },
    resetGridState: function() {
      this.options.gridState = undefined;
    },
    storeCurrentTabPosition: function() {
      this.resetCurrentTabPosition();
      this.tabContent.children.each(_.bind(function(childView) {
        var childViewContent = childView.content;
        if (childViewContent instanceof FormView) {
          childViewContent.cacheFormState();
        }
      }, this));
      var currentTabPosition = this.tabLinks.currentTabPosition || 0;
      if (currentTabPosition > 0) {
        var spyScrollModels = _.filter(this.tabLinks.collection.models, function(model) {
          return model.get("spyhidden") !== true && model.get("hidden") !== true;
        });
        if (spyScrollModels.length > currentTabPosition) {
          this.focusedFormId = spyScrollModels[currentTabPosition].id;
        }
      }
    },
    resetCurrentTabPosition: function() {
      this.focusedFormId = undefined;
      this.tabContent.children.each(_.bind(function(childView) {
        var childViewContent = childView.content;
        if (childViewContent instanceof FormView) {
          childViewContent.resetFormState();
        }
      }, this));
    },
    resetToOriginalConfiguration: function() {
      if (this.allForms) {
        this.allForms.syncFromCache();
        this.collection.reset(this.allForms.models, {
          silent: true
        });
        this.render();
      }
    },
    render: function() {
      if (this.options.action === "edit") {
        this.context && this.context.viewStateModel && this.context.viewStateModel.set({
          d2selectedNode: this.options.node,
          properties: true
        }, {
          silent: true
        });
      }
      var me = this;
      var dataFetched = true;
      if (!this.allForms.fetched && !this.allForms.error) {
        dataFetched = false;
        if (!this._fetchingForms) {
          this._fetchForms().always(me.unblockActions.bind(me)).fail(me.onPropertiesPageFetchError.bind(me));
        }
      }
      if (dataFetched === false || this._fetchingForms) {
        return this;
      }
      if (!this.options.node.get("suppressSignoffInputs")) {
        this.options.signOffFormModel = this.allForms.signOffFormModel;
      }
      var self = this;
      this.collection.each(function(model) {
        var reqFieldIds = [], has_required_fields = false;
        formUtils.jsonObjTraverse(model.get("schema"), "", "required", true, reqFieldIds, "properties", true);
        if (reqFieldIds.length > 0) {
          has_required_fields = true;
        }
        if (model.get("required") !== has_required_fields) {
          model.set({
            required: has_required_fields
          }, {
            silent: true
          });
        }
        if (has_required_fields) {
          self.hasRequiredField = true;
        }
      });
      _.extend(this, {
        _: _
      });
      if (!this.options.ignoreAutoEditConfig) {
        this._setAutoEditFormMode();
      }
      this.eventAdded = false;
      TabPanelView.prototype.render.apply(this);
      this.tabContent.collection.forEach(model => {
        var tabContentView = this.tabContent.children.findByModel(model);
        var formData = tabContentView.content.model?.collection?.cachedData;
        if (formData) this.updateButtons(tabContentView, formData);
        tabContentView.content.initializeExpressions();
      });
      this.tabContent.$el.binf_scrollspy().data()["binf.scrollspy"].activate = function(target) {
        var selector = this.selector + '[data-binf-target="' + target + '"],' + this.selector + '[href="' + target + '"]';
        var active = $(selector).parents("li");
        if (active.hasClass("binf-hidden")) {
          active = active.prevAll().not(".binf-hidden").first();
        }
        if (active.length === 1) {
          this.activeTarget = target;
          this.clear();
          active.addClass("binf-active");
          if (active.parent(".binf-dropdown-menu").length) {
            active = active.closest("li.binf-dropdown").addClass("binf-active");
          }
          active.trigger("activate.binf.scrollspy");
        }
      };
      this._createAddPropertiesView();
      this._initializeOthers();
      this._createEditModeView();
      this.loadListheight();
      return this;
    },
    updateButtonProperties: function(buttonModelAttributes, buttonFromRes) {
      if (!buttonFromRes) return false;
      buttonModelAttributes.origId = buttonModelAttributes.id;
      buttonModelAttributes.id = buttonFromRes.id;
      buttonModelAttributes.action = buttonFromRes.action;
      if (buttonFromRes["honor_button_label_sv"]) {
        buttonModelAttributes.label = buttonFromRes.label;
      }
      buttonModelAttributes.isPrimary = buttonFromRes?.primary_button ? true : false;
      return buttonFromRes["honor_button_label_sv"] || buttonModelAttributes.isPrimary;
    },
    updateButtons: function(tabContentView, formData) {
      var currentStepView = tabContentView.options.wizard?.steps[tabContentView.options.wizard.currentStep];
      if (!currentStepView || !currentStepView.isPropertyPageType) return;
      var buttons = formData["page-content"].dialog.buttons.button;
      let footerButtonModels = this.options.wizard?.footerView?.collection?.models || [], currentStepFooterButtons = [], buttonPropertiesUpdated = false;
      currentStepView.buttonPropertiesUpdated = false;
      footerButtonModels.forEach(function(buttonModel) {
        let buttonModelAttributes = Object.assign({}, buttonModel.attributes);
        let buttonFromRes;
        switch (buttonModelAttributes.id) {
         case "next":
          buttonFromRes = buttons?.filter(button => button.id === "buttonOk").at(0);
          buttonPropertiesUpdated = this.updateButtonProperties(buttonModelAttributes, buttonFromRes) || buttonPropertiesUpdated;
          break;

         case "cancel":
          buttonFromRes = buttons?.filter(button => button.id === "buttonCancel").at(0);
          buttonPropertiesUpdated = this.updateButtonProperties(buttonModelAttributes, buttonFromRes) || buttonPropertiesUpdated;
          break;
        }
        currentStepFooterButtons.push(buttonModelAttributes);
      }, this);
      if (buttonPropertiesUpdated) {
        let buttonOkIndex = currentStepFooterButtons.findIndex(button => button.id === "buttonOk"), buttonOkIsPrimary = currentStepFooterButtons[buttonOkIndex].isPrimary, buttonCancelIndex = currentStepFooterButtons.findIndex(button => button.id === "buttonCancel"), buttonCancelIsPrimary = currentStepFooterButtons[buttonCancelIndex].isPrimary;
        if (!buttonOkIsPrimary && !buttonCancelIsPrimary) {
          currentStepFooterButtons[buttonOkIndex].isPrimary = true;
        }
        currentStepView.buttonPropertiesUpdated = true;
        currentStepView.buttons = currentStepFooterButtons;
        tabContentView.options.wizard?.refreshFooter();
      }
    },
    _initializeToolbars: function() {
      MetadataPropertiesView.prototype._initializeToolbars.apply(this, arguments);
      this.tabsSelector = "> ul li:not(.binf-hidden)";
    },
    onRendered: function() {
      this.options.selectedProperty = undefined;
      var model = this.focusedFormId ? this.collection.get(this.focusedFormId) : undefined;
      if (model instanceof Backbone.Model) {
        this.options.selectedProperty = model.get("title");
      }
      MetadataPropertiesView.prototype.onRendered.apply(this, arguments);
      this.updateTitle = true;
    },
    isTabable: function() {
      return !this.options.notTabableRegion;
    },
    onDestroy: function() {
      if (this.options.action === "edit" && this.context && this.context.viewStateModel) {
        this.context.viewStateModel.unset("d2selectedNode", {
          silent: true
        });
        this.context.viewStateModel.unset("properties", {
          silent: true
        });
      }
      MetadataPropertiesView.prototype.onDestroy.apply(this, arguments);
      this.$el.off("d2:tab:content:render");
      if (this.options.metadataView && this.options.metadataView.metadataHeaderView && this.options.metadataView.metadataHeaderView.rightbarView.options.toolbarItems.rightToolbar) {
        this.options.metadataView.metadataHeaderView.rightbarView.options.toolbarItems.rightToolbar.reset();
      }
      if (this.options.node.get("resetOrigLinks") && this.options.node.get("origLinks")) {
        this.options.node.attributes.links = this.options.node.attributes.origLinks;
      }
    },
    _setAutoEditFormMode: function() {
      var that = this;
      var hasPermission = function() {
        return !_.isUndefined(RestLinkrels.getLink(that.options.node.get("links"), RestLinkrels.EDIT));
      };
      if (this.options.action === "edit" && hasPermission()) {
        var autoEditInSmartView = this.allForms.models[0].attributes.schema.auto_smartview_edit_mode;
        this.options.formMode = autoEditInSmartView ? "create" : this.options.formMode;
      }
    },
    _createEditModeView: function() {
      if (this.editModeView) {
        this.cancelEventsToViewsPropagation(this.editModeView);
        this.editModeView.destroy();
      }
      var options = _.extend({
        parentView: this,
        blockingParentView: this.options.blockingParentView
      }, this.options);
      this.editModeView = new MetadataEditView(options);
      this.propagateEventsToViews(this.editModeView);
    },
    _hideNotRequiredFormFields: function() {},
    validateAllForms: function(refreshState, validateOnlyRequiredFields) {
      var deferred = $.Deferred();
      var childrenViews = this.options.tabPanel.tabContent._getImmediateChildren();
      if (this.eSignatureView && this.eSignatureView.signFormView) {
        childrenViews.push(this.eSignatureView);
      }
      var validityPromiseArray = _.map(childrenViews, function(view) {
        return view instanceof D2ESignatureView ? view.signFormView.validateForm(refreshState) : view.content.validateForm(refreshState, validateOnlyRequiredFields);
      });
      $.whenAll.apply($, validityPromiseArray).done(function(validityResultArray) {
        var errs = this.getValidationErrorsList();
        if (!validateOnlyRequiredFields && errs.length > 0) {
          this.setErrorMode(true, errs);
        }
        deferred.resolve(!_.contains(validityResultArray, false));
      }.bind(this));
      return deferred;
    },
    _validateFormsOnChange: function() {
      var deferred = $.Deferred();
      if (!this.isErrorMode()) {
        this.validateAllForms(false, true).done(function(isValid) {
          deferred.resolve(isValid);
        });
      } else {
        this.validateAllForms(false).done(function(isValid) {
          if (this.getValidationErrorsList().length === 0) {
            this.setErrorMode(false);
          }
          deferred.resolve(isValid);
        }.bind(this));
      }
      return deferred;
    },
    isErrorMode: function() {
      return this.errorMode;
    },
    setErrorMode: function(mode, errorList) {
      this.errorMode = mode;
      if (mode === true) {
        var errorWrapper = this.$el.find(".d2-metadata-errors-wrapper");
        if (errorWrapper.length === 0) {
          var newElHtml = "<div class='d2-metadata-errors-wrapper'></div>";
          if (this.options.wizard) {
            this.tabContent.$el.after(newElHtml);
          } else {
            this.tabContent.$el.before(newElHtml);
          }
          errorWrapper = this.$el.find(".d2-metadata-errors-wrapper");
          this.errorPanelRegion = new Marionette.Region({
            el: errorWrapper
          });
        }
        if (!this.errorPanelView) {
          this.errorPanelView = new D2ErrorPanelView(_.extend(_.clone(this.options), {
            errorList: errorList,
            tabContent: this.tabContent
          }));
          this.listenTo(this.errorPanelView, "relayout", this.reLayoutTabContent, this);
          this.errorPanelRegion.show(this.errorPanelView);
        } else {
          this.errorPanelView.updateErrorList(errorList);
        }
        if (this.eSignatureContentRegion) {
          this.eSignatureContentRegion.$el.addClass("binf-hidden");
        }
      } else {
        if (this.errorPanelView) {
          this.errorPanelView.$el.addClass("binf-hidden");
        }
        if (this.eSignatureContentRegion) {
          this.eSignatureContentRegion.$el.removeClass("binf-hidden");
        }
      }
      this.$el.trigger($.Event("d2:tab:content:render"), {
        supressTabIndexRefresh: true
      });
      this.reLayoutTabContent();
    },
    _validateAllFormsAndRefireEvent: function() {
      clearTimeout(this._prevDelayedValidationTaskId);
      this._prevDelayedValidationTaskId = setTimeout(() => {
        this._prevDelayedValidationTaskId = null;
        this._validateFormsOnChange().done(function(isValid) {
          this.triggerMethod("d2:metadata:formValidation", isValid);
        }.bind(this));
      }, 250);
    },
    _changeFormFieldAndRefireEvent: function(args) {
      this.triggerMethod("d2:metadata:formFieldChange", args);
    },
    getValidationErrorsList: function() {
      var childrenViews = this.options.tabPanel.tabContent._getImmediateChildren();
      return _.reduce(childrenViews, function(validationErrorList, childView) {
        return _.union(validationErrorList, childView.content.validationErrorList);
      }, []);
    },
    _destroyContent: function() {
      MetadataPropertiesView.prototype._destroyContent.apply(this, arguments);
      clearTimeout(this._prevDelayedValidationTaskId);
      this.tabContent?.destroy();
      this.errorMode = false;
      if (this.eSignatureContentRegion) {
        delete this.eSignatureView;
        this.eSignatureContentRegion.$el.removeClass("binf-hidden");
        this.eSignatureContentRegion.empty();
        this.$el.find(".d2-esignature-contents-wrapper").remove();
      }
      if (this.errorPanelRegion) {
        delete this.errorPanelView;
        this.errorPanelRegion.empty();
        this.$el.find(".d2-metadata-errors-wrapper").remove();
      }
      if (this.maskingDivs) {
        this.onApplyMask(false);
      }
    },
    onRenderForms: function() {
      this._listenToFormValidationEvents();
      this._showElectronicSignaturePanel();
      this._addEditViewToToolbar();
      var reloadMiniviewer = this.miniviewerView ? !this.miniviewerView.isRendered && this.miniviewerView._isMinimized : true;
      if (this.options.metadataView && this.options.metadataView.internal && this.options.metadataView.metadataTabView.tabLinks.selected.get("name") === "properties" && this.options.formMode === "update" && reloadMiniviewer) {
        this.viewer_visiblity_pref = this._retreiveMiniViewerPanelVisibilitySetting() === false ? false : true;
        if (this.viewer_visiblity_pref && (window.innerWidth > constants.Resolution.MEDIUM || window.innerWidth === constants.Resolution.LOW) || window.innerWidth < constants.Resolution.LOW) {
          if ($.contains(document.documentElement, this.el)) {
            this.trigger("add:mini:viewer");
            this._updateViews();
          } else {
            this.timer = setInterval(function() {
              if ($.contains(document.documentElement, this.el)) {
                this.trigger("add:mini:viewer");
                this._updateViews();
                clearInterval(this.timer);
              }
            }.bind(this), 500);
          }
        } else {
          this.viewer_visiblity_pref = false;
          nodeUtils._showViewer(this.options.node) && this._onViewerMinimized();
        }
      }
      this.executePostRenderExpression();
      var metadataPage = this.$el.closest(".cs-metadata");
      metadataPage.trigger("refresh:setcontainer");
      var me = this;
      this.resizeOptions = {
        handles: i18n && i18n.settings.rtl ? "w" : "e",
        minWidth: 240,
        maxWidth: 400,
        start: function() {
          me.options.metadataView._parent.$el.addClass("d2-resizing");
        },
        stop: function() {
          me.options.metadataView._parent.$el.removeClass("d2-resizing");
          me.options.metadataView.triggerMethod("dom:refresh");
        }
      };
      this.options.metadataView && this.options.metadataView.options.metadataNavigationView && this.options.metadataView.options.metadataNavigationView.navigationRegion.$el.resizable(this.resizeOptions);
      this.$el.closest(".metadata-navigation").find(".cs-metadata").on("toggled:navigationbar", _.bind(this._onToggleSidebar, this));
    },
    _activateSelectedPropertyTab: function() {
      MetadataPropertiesView.prototype._activateSelectedPropertyTab.apply(this, arguments);
      this.setFocusOnConfiguredElement();
      if (this.options.metadataView && this.options.metadataView.metadataTabView.tabLinks && this.options.metadataView.metadataTabView.tabLinks.selected) {
        var me = this, showHideMiniviewerBasedOnTab = function(selectedTab) {
          if (selectedTab && selectedTab.get("name") !== "properties") {
            me._triggerMiniviewerVisibility(false);
            me.miniviewerButtonSuppressorMask && me.miniviewerButtonSuppressorMask.restoreMask();
          } else {
            nodeUtils._showViewer(me.options.node) && me._triggerMiniviewerVisibility(true);
          }
          if (selectedTab && selectedTab.get("name") !== "audit") {
            me.options?.metadataView?.options?.metadataNavigationView?.$el.find(".d2-icon").addClass("binf-hidden");
          } else {
            me.options?.metadataView?.options?.metadataNavigationView?.$el.find(".d2-icon").removeClass("binf-hidden");
          }
        };
        this.options.metadataView.metadataTabView.tabLinks.selected.on("change:name", showHideMiniviewerBasedOnTab);
        showHideMiniviewerBasedOnTab(this.options.metadataView.metadataTabView.tabLinks.selected);
      } else {
        this._triggerMiniviewerVisibility(true);
      }
      if (this.$el.closest(".metadata-navigation").length) {
        setTimeout(function() {
          this._updateViews();
        }.bind(this), 1500);
      }
    },
    reLayoutPanels: function() {
      this.reLayoutTabContent();
      if (this.miniviewerView && !this.miniviewerView._isMinimized) {
        this.setHeaderPropertyPageMaskWidth(false);
      }
      this._onResizeMetadataPanel();
    },
    reLayoutTabContent: function() {
      if (this.tabContent && this.tabContent.$el.is(":visible")) {
        var isTabLinkVisible = this.tabLinks.$el.is(":visible"), panelsHeight = isTabLinkVisible ? this.tabLinks.$el.outerHeight() : 0;
        if (this.errorPanelRegion) {
          panelsHeight += this.errorPanelRegion.$el.outerHeight();
        }
        if (this.eSignatureContentRegion) {
          panelsHeight += this.eSignatureContentRegion.$el.outerHeight();
        }
        this.tabContent.$el.outerHeight(this.$el.height() - panelsHeight);
        if (this.errorPanelRegion && this.options.wizard) {
          panelsHeight -= this.errorPanelRegion.$el.outerHeight();
        }
        this.tabContentHeader && this.tabContentHeader.$el.parent().offset({
          top: panelsHeight + (isTabLinkVisible ? this.tabLinks : this.tabContent).$el.offset().top
        });
        this.triggerMethod("metadataView:relayout");
      }
    },
    _onResizeMetadataPanel: function() {
      var self = this;
      setTimeout(function() {
        if (self.options.metadataView && self.options.metadataView.metadataTabView.tabLinks.selected.get("name") === "properties") {
          self._updateViews();
        }
      }, 200);
    },
    _updateViews: function(toggleState) {
      var me = this, viewPortWidth = window.innerWidth, showSideBar = _.isUndefined(toggleState) ? _.isUndefined(this.resolutionState && this.resolutionState.showSideBar) ? true : this.resolutionState.showSideBar : toggleState, resolutionCLasses = [ "d2-lowest-resolution-panel", "d2-low-resolution-panel", "d2-medium-resolution-panel", "d2-above-medium-resolution-panel", "d2-high-resolution-panel", "d2-highest-resolution-panel" ], setResolutionClass = function(className) {
        me.options.metadataView && me.options.metadataView.options.metadataNavigationView && me.options.metadataView.options.metadataNavigationView.$el.find(".metadata-doc-preview").removeClass(getAllResolutionClasses()).addClass(className);
      }, getAllResolutionClasses = function() {
        return resolutionCLasses.join(" ");
      };
      if (viewPortWidth <= constants.Resolution.LOWEST) {
        setResolutionClass("d2-lowest-resolution-panel");
        showSideBar = _.isUndefined(toggleState) ? _.isUndefined(this.resolutionState && this.resolutionState.showSideBar) ? false : this.resolutionState.showSideBar : toggleState;
      } else if (viewPortWidth > constants.Resolution.LOWEST && viewPortWidth <= constants.Resolution.LOW) {
        setResolutionClass("d2-low-resolution-panel");
        showSideBar = _.isUndefined(toggleState) ? _.isUndefined(this.resolutionState && this.resolutionState.showSideBar) ? false : this.resolutionState.showSideBar : toggleState;
      } else if (viewPortWidth > constants.Resolution.LOW && viewPortWidth <= constants.Resolution.MEDIUM) {
        setResolutionClass("d2-medium-resolution-panel");
        showSideBar = _.isUndefined(toggleState) ? _.isUndefined(this.resolutionState && this.resolutionState.showSideBar) ? true : this.resolutionState.showSideBar : toggleState;
      } else if (viewPortWidth > constants.Resolution.MEDIUM && viewPortWidth < constants.Resolution.HIGH) {
        showSideBar = true;
        setResolutionClass("d2-above-medium-resolution-panel");
      } else if (viewPortWidth >= constants.Resolution.HIGH && viewPortWidth < constants.Resolution.HIGHEST) {
        showSideBar = true;
        setResolutionClass("d2-high-resolution-panel");
      } else {
        showSideBar = true;
        setResolutionClass("d2-highest-resolution-panel");
      }
      if (viewPortWidth <= constants.Resolution.MEDIUM && !this.firstLoaded) {
        showSideBar = true;
      }
      this.firstLoaded = true;
      this.resolutionState = {
        viewPortWidth: viewPortWidth,
        showSideBar: showSideBar
      };
      this.toggleMetadataView(this.resolutionState);
      var sideBarEl = this.options.metadataView._parentLayoutView()?.$el.find(".metadata-sidebar"), parentWrapper = sideBarEl?.closest(".metadata-navigation");
      if (this.resolutionState.showSideBar) {
        parentWrapper?.removeClass("csui-hide-side-bar");
        sideBarEl?.show();
      } else {
        sideBarEl?.hide();
        parentWrapper?.addClass("csui-hide-side-bar");
      }
      if (this.miniviewerView) {
        var hideMiniviewer = this.miniviewerView.triggerMethod("resolution:change", this.resolutionState) || Accessibility.isAccessibleMode();
        var panel = this.options.metadataView && this.options.metadataView._parentLayoutView() && this.options.metadataView._parentLayoutView().$el.find(".metadata-doc-preview.d2-doc-preview-region"), region = this.options.metadataView && this.options.metadataView._parentLayoutView() && (this.options.metadataView._parentLayoutView().docPreviewRegion || this.options.metadataView._parentLayoutView().rgnTertiaryPane);
        if (panel && region) {
          if (hideMiniviewer) {
            this.collapseMiniViewer();
          } else {
            this.expandMiniviewer();
          }
        }
      }
      if (this.tabContent && this.tabContent && this.tabContent.children._views) {
        _.each(this.tabContent.children._views, function(childView) {
          if (childView.content && _.isFunction(childView.content.trigger)) {
            childView.content.trigger("form:view:updated");
          }
        });
      }
    },
    toggleMetadataView: function(resolutionData) {
      if (resolutionData.viewPortWidth <= constants.Resolution.MEDIUM) {
        this.options.metadataView && this.options.metadataView.metadataHeaderView && this.options.metadataView.metadataHeaderView.metadataItemNameView._applyToggle(resolutionData.showSideBar);
      } else {
        this.options.metadataView && this.options.metadataView.metadataHeaderView && this.options.metadataView.metadataHeaderView.metadataItemNameView._removeToggle();
      }
    },
    toggleSideBar: function(resolutionData) {
      var panel = this.options.metadataView && this.options.metadataView._parentLayoutView() && this.options.metadataView._parentLayoutView().$el.find(".d2-split-panel-content.primary-pane"), region = this.options.metadataView && this.options.metadataView._parentLayoutView() && this.options.metadataView._parentLayoutView().navigationRegion;
      if (panel && region) {
        if (resolutionData.showSideBar === false) {
          this.collapsePanel(panel, region);
        } else {
          this.expandPanel(panel, region);
        }
      }
    },
    collapsePanel: function(panel, region) {
      if (region.collapsed) {
        return;
      }
      var width = panel.width();
      region.currentView && region.currentView.triggerMethod("before:collapse");
      panel.data("restoreWidth", width);
      panel.css({
        "flex-basis": width
      });
      panel.css("min-width", 0);
      panel.animate({
        "flex-basis": 0
      }, {
        duration: 300,
        complete: function() {
          region.collapsed = true;
          region.currentView && region.currentView.triggerMethod("after:collapse");
          $(window).trigger("resize.tableview");
        }
      });
    },
    expandPanel: function(panel, region) {
      if (!region.collapsed) {
        return;
      }
      var width = panel.data("restoreWidth");
      region.currentView && region.currentView.triggerMethod("before:expand");
      panel.css({
        "flex-basis": 0
      });
      panel.animate({
        "flex-basis": width
      }, {
        duration: 300,
        complete: function() {
          region.collapsed = false;
          panel.css("min-width", "");
          panel.css({
            "flex-basis": "auto"
          });
          region.currentView && region.currentView.triggerMethod("after:expand");
          $(window).trigger("resize.tableview");
        }
      });
    },
    _showElectronicSignaturePanel: function() {
      if (_.isUndefined(this.options.signOffFormModel)) {
        return;
      }
      var me = this;
      if (this.options.formMode === "create") {
        var signWrapper = this.$el.find(".d2-esignature-contents-wrapper");
        if (signWrapper.length === 0) {
          this.tabContent.$el.before("<div class='d2-esignature-contents-wrapper'></div>");
          signWrapper = this.$el.find(".d2-esignature-contents-wrapper");
        }
        this.eSignatureContentRegion = new Marionette.Region({
          el: signWrapper
        });
        this.eSignatureView = new D2ESignatureView(this.options);
        this.eSignatureView.on("eSign:form:ready", function() {
          me.reLayoutPanels();
          this.listenTo(me.eSignatureView.signFormView, "d2:change:formValidation", _.bind(me._validateAllFormsAndRefireEvent, me));
        });
        this.eSignatureView.on("show", function() {
          me.reLayoutPanels();
        });
        this.eSignatureContentRegion.show(this.eSignatureView);
      }
    },
    _addEditViewToToolbar: function() {
      var apv1 = this.editModeView.render();
      Marionette.triggerMethodOn(apv1, "before:show", apv1, this);
      this.tabLinks.$el.append(apv1.el);
      Marionette.triggerMethodOn(apv1, "show", apv1, this);
    },
    _listenToFormValidationEvents: function() {
      _.each(this.options.tabPanel.tabContent._getImmediateChildren(), function(child) {
        if (!(child instanceof D2ESignatureView)) {
          this.listenTo(child.content, "d2:change:formValidation", _.bind(this._validateAllFormsAndRefireEvent, this));
          this.listenTo(child.content, "d2:change:form:field", _.bind(this._changeFormFieldAndRefireEvent, this));
          this.listenTo(child.content, "dctmw:updateTab:formValidation", _.bind(function(model) {
            this.tabLinks.trigger("d2:formValidation", model);
          }, this));
        }
      }, this);
    },
    _onToggleSidebar: function() {
      var sideBarEl = this.options.metadataView._parentLayoutView().$el.find(".metadata-sidebar"), parentWrapper = sideBarEl.closest(".metadata-navigation");
      if (window.innerWidth <= constants.Resolution.MEDIUM && window.innerWidth >= constants.Resolution.LOW) {
        if (parentWrapper.hasClass("csui-hide-side-bar")) {
          !this.miniviewerView._userHasMinimized && this.expandMiniviewer();
        } else {
          this.miniviewerView && this.collapseMiniViewer();
        }
      }
    },
    _toggleMiniviewer: function(showMiniViewer) {
      if (!this.miniviewerView) {
        return;
      }
      var sideBarEl = this.options.metadataView._parentLayoutView()?.$el.find(".metadata-sidebar"), parentWrapper = sideBarEl?.closest(".metadata-navigation");
      this.resolutionState = this.resolutionState || {
        viewPortWidth: window.innerWidth
      };
      if (this.miniviewerView._userHasMinimized || showMiniViewer) {
        this.collapseMiniViewer();
        if (window.innerWidth <= constants.Resolution.MEDIUM && this.miniviewerView._userHasMinimized) {
          this.resolutionState.showSideBar = true;
          this.toggleMetadataView(this.resolutionState);
          sideBarEl?.show();
          parentWrapper?.removeClass("csui-hide-side-bar");
        }
      } else {
        this.expandMiniviewer();
        if (window.innerWidth <= constants.Resolution.MEDIUM && !this.miniviewerView._userHasMinimized) {
          this.resolutionState.showSideBar = false;
          this.toggleMetadataView(this.resolutionState);
          sideBarEl?.hide();
          parentWrapper?.addClass("csui-hide-side-bar");
        }
      }
    },
    collapseMiniViewer: function() {
      if (this.miniviewerView && !this.miniviewerView._isMinimized) {
        this.miniviewerView.triggerMethod("before:collapse");
        this.disablePreviewRegion();
        this.miniviewerView.triggerMethod("after:collapse");
        $(window).trigger("resize.tableview");
      }
    },
    expandMiniviewer: function() {
      if (this.options.metadataView.metadataTabView.tabLinks.selected.get("name") === "properties" && this.miniviewerView && this.miniviewerView._isMinimized) {
        this.miniviewerView.triggerMethod("before:expand");
        this.enablePreviewRegion();
        this.miniviewerView.triggerMethod("after:expand");
        $(window).trigger("resize.tableview");
      }
    },
    disablePreviewRegion: function() {
      if (this.options.metadataView && this.options.metadataView.options.metadataNavigationView && this.options.metadataView.options.metadataNavigationView.contentRegion) {
        this.options.metadataView.options.metadataNavigationView.contentRegion.$el.removeClass("d2-content-region");
        this.options.metadataView.options.metadataNavigationView.$el.find(".metadata-doc-preview").removeClass("d2-doc-preview-region");
        this.options.metadataView.options.metadataNavigationView.$el.find(".metadata-doc-preview").addClass("binf-hidden");
      } else if (this.childWithBlockingView && this.childWithBlockingView.options && this.childWithBlockingView.options.originatingView && this.childWithBlockingView.options.originatingView.splitPanel) {
        var splitPane = this.childWithBlockingView.options.originatingView.splitPanel;
        splitPane.collapsePanel(splitPane.ui.tertiaryPane, null, splitPane.rgnTertiaryPane);
      }
    },
    enablePreviewRegion: function() {
      if (this.options.metadataView && this.options.metadataView.options.metadataNavigationView && this.options.metadataView.options.metadataNavigationView.docPreviewRegion) {
        this.options.metadataView.options.metadataNavigationView.contentRegion.$el.addClass("d2-content-region");
        this.options.metadataView.options.metadataNavigationView.$el.find(".metadata-doc-preview").addClass("d2-doc-preview-region");
        this.options.metadataView.options.metadataNavigationView.$el.find(".metadata-doc-preview").removeClass("binf-hidden");
      } else if (this.childWithBlockingView && this.childWithBlockingView.options && this.childWithBlockingView.options.originatingView && this.childWithBlockingView.options.originatingView.splitPanel && !Accessibility.isAccessibleMode()) {
        var splitPane = this.childWithBlockingView.options.originatingView.splitPanel;
        splitPane.expandPanel(splitPane.ui.tertiaryPane, null, splitPane.rgnTertiaryPane);
      }
    },
    _addMiniViewer: function(firstLoad) {
      this.enablePreviewRegion();
      this.miniviewerView = this.childWithBlockingView && this.childWithBlockingView.options.originatingView && this.childWithBlockingView.options.originatingView.miniviewerView;
      this.connector = this.options.connector || this.context && this.context.getObject("connector");
      var me = this, viewerRegion = this.getPreviewRegion(), model = this.childWithBlockingView && this.childWithBlockingView.model || this.options.metadataView && this.options.metadataView.model, viewerModel = viewerRegion && viewerRegion.currentView && viewerRegion.currentView.model || this.miniviewerView && this.miniviewerView.options.model;
      if (viewerModel && viewerRegion.currentView && viewerRegion.currentView._isRendered && viewerModel.get("id") !== model.get("id")) {
        viewerModel.set(model.attributes, {
          silent: true
        });
        viewerModel.fetched = true;
        viewerModel.trigger("sync");
        if (viewerRegion.currentView._isMinimized) {
          this._onViewerMinimized();
          this.disablePreviewRegion();
        }
        this.listenTo(this.miniviewerView, "widget:minimized", this._onViewerMinimized).listenTo(this.miniviewerView, "widget:restored", this._onViewerRestored);
      } else {
        require([ "d2/widgets/miniviewer/miniviewer.view" ], function(D2MiniViewer) {
          var node = me.options.node.clone();
          node.fetched = true;
          me.miniviewerView = new D2MiniViewer(_.defaults({
            el: me.getPreviewRegion(),
            model: node,
            context: me.options.context
          }));
          me.miniviewerView && me.miniviewerView.render();
          me.miniviewerView.model.trigger("sync");
          if (window.innerWidth >= constants.Resolution.MEDIUM) {
            PubSub.trigger("change:panel:layout");
          } else {
            PubSub.trigger("change:panel:layout", false);
          }
          if (me.childWithBlockingView && me.childWithBlockingView.options && me.childWithBlockingView.options.originatingView) {
            me.childWithBlockingView.options.originatingView.miniviewerView = me.miniviewerView;
          }
          me.options.metadataView && me.options.metadataView.options.metadataNavigationView && me.options.metadataView.options.metadataNavigationView.$el.find(".metadata-doc-preview").resizable(_.defaults({
            handles: i18n && i18n.settings.rtl ? "e" : "w",
            minWidth: "",
            maxWidth: ""
          }, me.resizeOptions));
          me.listenTo(me.miniviewerView, "widget:minimized", me._onViewerMinimized).listenTo(me.miniviewerView, "widget:restored", me._onViewerRestored);
          me.firstLoaded = firstLoad === false;
          me._updateViews();
        });
      }
    },
    getPreviewRegion: function() {
      if (this.childWithBlockingView && this.childWithBlockingView.options.originatingView.splitPanel) {
        return this.childWithBlockingView.options.originatingView.splitPanel.getHostRegionForContentInPane("Tertiary");
      } else {
        this.enablePreviewRegion();
        return this.options.metadataView && this.options.metadataView.options.metadataNavigationView && this.options.metadataView.options.metadataNavigationView.$el.find(".d2-doc-preview-region");
      }
    },
    _setupMiniviewerToolbar: function() {
      var toolItem = new ToolItemModel({
        signature: "D2-RestoreMiniviewer",
        name: lang.previewIconTooltip,
        enabled: true,
        icon: "icon d2-icon-restore-miniviewer"
      });
      var miniviewerButtonSuppressorMask = new ToolItemsMask({
        blacklist: [ "D2-RestoreMiniviewer" ],
        whitelist: []
      }, {
        normalize: true
      });
      miniviewerButtonSuppressorMask.storeMask();
      if (this.options.metadataView && this.options.metadataView.metadataHeaderView && this.options.metadataView.metadataHeaderView.rightbarView.options.toolbarItems.rightToolbar && !this.options.metadataView.metadataHeaderView.rightbarView.options.toolbarItems.rightToolbar.collection.find({
        signature: "D2-RestoreMiniviewer"
      }) && nodeUtils._showViewer(this.options.node)) {
        this.options.metadataView.metadataHeaderView.rightbarView.options.toolbarItems.rightToolbar.addItem(toolItem);
      }
      this.miniviewerButtonSuppressorMask = this.options.metadataView && this.options.metadataView.metadataHeaderView && this.options.metadataView.metadataHeaderView.rightbarView.options.toolbarItemsMasks.toolbars.rightToolbar;
      if (this.miniviewerButtonSuppressorMask) {
        this.miniviewerButtonSuppressorMask.extendMask && this.miniviewerButtonSuppressorMask.extendMask(miniviewerButtonSuppressorMask);
        this.miniviewerButtonSuppressorMask.storeMask && this.miniviewerButtonSuppressorMask.storeMask();
      }
    },
    _onViewerMinimized: function() {
      this.miniviewerButtonSuppressorMask && this.miniviewerButtonSuppressorMask.clearMask();
      if (this.childWithBlockingView && this.childWithBlockingView.options.originatingView) {
        this.childWithBlockingView.options.originatingView.miniviewerButtonSuppressorMask && this.childWithBlockingView.options.originatingView.miniviewerButtonSuppressorMask.clearMask();
        var className = this.childWithBlockingView.options.originatingView.getMetadataRightbarClassName && this.childWithBlockingView.options.originatingView.getMetadataRightbarClassName();
        this.childWithBlockingView.options.originatingView.metadataView && this.childWithBlockingView.options.originatingView.metadataView.$el.addClass(className);
      }
      this.setHeaderPropertyPageMaskWidth(true);
      $(window).trigger("resize.tableview");
      this._saveMiniViewerPanelVisibilitySetting(false);
    },
    _onViewerRestored: function() {
      this.miniviewerButtonSuppressorMask && this.miniviewerButtonSuppressorMask.restoreMask();
      if (this.childWithBlockingView && this.childWithBlockingView.options.originatingView) {
        this.childWithBlockingView.options.originatingView.miniviewerButtonSuppressorMask && this.childWithBlockingView.options.originatingView.miniviewerButtonSuppressorMask.restoreMask();
        var className = this.childWithBlockingView.options.originatingView.getMetadataRightbarClassName && this.childWithBlockingView.options.originatingView.getMetadataRightbarClassName();
        this.childWithBlockingView.options.originatingView.metadataView && this.childWithBlockingView.options.originatingView.metadataView.$el.removeClass(className);
      }
      this.setHeaderPropertyPageMaskWidth(false);
      $(window).trigger("resize.tableview");
      this._saveMiniViewerPanelVisibilitySetting(true);
    },
    setHeaderPropertyPageMaskWidth: function(hasPreviewIcon) {
      var metadataNavigation = this.getMetadataNavigationElement();
      var $metadataHeader = metadataNavigation && metadataNavigation.find(".metadata-header"), hasRightBar = $metadataHeader.hasClass("with-right-bar"), parentWidth = Math.floor($metadataHeader.parent().outerWidth() + 1);
      if (hasRightBar) {
        var mask = $metadataHeader.find(".d2-property-page-mask");
        hasPreviewIcon && parentWidth ? mask.width("") : mask.width(parentWidth);
      }
    },
    _onRestoreMiniviewer: function() {
      if (this.miniviewerView) {
        this.miniviewerView.trigger("widget:restore");
      } else {
        this._addMiniViewer(false);
        this._onViewerRestored();
      }
    },
    executePostRenderExpression: function() {
      const filteredFormarr = this.options.collection.models.filter(item => !item.get("spyhidden"));
      if (filteredFormarr.length == 1 && !utils.isMobile()) {
        this.$el.addClass("single-tab-hide");
      }
      this.tabContent.children.each(function(view) {
        _.each(view.content.postRenderExpressions, function(eventHandler) {
          eventHandler();
        });
      });
    },
    getInitialInvalid: function() {
      return this.tabContent.children.findByIndex(0).content.initialInvalid;
    },
    getMetadataNavigationElement: function() {
      var metadataNavigation = this.$el.closest(".metadata-navigation");
      metadataNavigation = metadataNavigation.length === 1 ? metadataNavigation : this.$el.closest(".cs-metadata");
      return metadataNavigation;
    },
    onApplyMask: function(showMask) {
      var metadataNavigation = this.getMetadataNavigationElement();
      var toggle;
      if (showMask) {
        if (_.isUndefined(this.maskingDivs)) {
          var maskDivTemplate = $('<div class="d2-property-page-mask" />');
          var isInsidePerspective = this.$el.closest(".cs-perspective-panel").length === 1;
          this.maskingDivs = $();
          if (isInsidePerspective) {
            var navbarClass = $("body").find(".d2-navbar").length > 0 ? "d2-navbar" : "binf-navbar-default";
            this.maskingDivs = this.maskingDivs.add(maskDivTemplate.clone().prependTo($("body").find(".breadcrumb-inner")));
            this.maskingDivs = this.maskingDivs.add(maskDivTemplate.clone().prependTo($("body").find("." + navbarClass)));
            this.maskingDivs = this.maskingDivs.add(maskDivTemplate.clone().prependTo($("body").find(".d2-vdoc-widget .primary-pane")));
            this.maskingDivs = this.maskingDivs.add(maskDivTemplate.clone().prependTo($("body").find(".d2-task-documents-widget .d2-task-documents-title-container")));
            this.maskingDivs = this.maskingDivs.add(maskDivTemplate.clone().prependTo($("body").find(".d2-task-documents-widget .primary-pane")));
          } else {
            this.maskingDivs = this.maskingDivs.add(maskDivTemplate.clone().prependTo($("body").find(".binf-modal-header")));
          }
          this.maskingDivs = this.maskingDivs.add(maskDivTemplate.clone().prependTo(metadataNavigation.find(".metadata-sidebar")));
          metadataNavigation.find(".metadata-sidebar .cs-list-group .arrow-overlay").hide();
          var $metadataHeader = metadataNavigation.find(".metadata-header"), hasRightBar = $metadataHeader.hasClass("with-right-bar");
          if (hasRightBar) {
            this.maskingDivs = this.maskingDivs.add(maskDivTemplate.prependTo(metadataNavigation.find(".metadata-header")));
          } else {
            this.maskingDivs = this.maskingDivs.add(maskDivTemplate.prependTo(metadataNavigation.find(".metadata-content-header")));
          }
          if (this.options.metadataView) {
            toggle = this.options.metadataView.metadataTabView.tabLinks.ui.cbTabLinkBtn;
            toggle.find(".icon-caret-down").css("visibility", "hidden");
            toggle.attr("disabled", true);
            toggle = this.options.metadataView.metadataTabView.tabLinks.ui.tabLinkBtn;
            toggle.attr("disabled", true);
          }
        }
      } else {
        if (!_.isUndefined(this.maskingDivs)) {
          this.maskingDivs.remove();
          this.maskingDivs = undefined;
          metadataNavigation.find(".metadata-sidebar .cs-list-group .arrow-overlay").show();
          if (this.options.metadataView) {
            toggle = this.options.metadataView.metadataTabView.tabLinks.ui.cbTabLinkBtn;
            toggle.find(".icon-caret-down").css("visibility", "");
            toggle.prop("disabled", false);
            toggle = this.options.metadataView.metadataTabView.tabLinks.ui.tabLinkBtn;
            toggle.attr("disabled", false);
          }
        }
      }
    },
    setFocusOnConfiguredElement: function() {
      var fieldPath, formId, childrenView = this.options.tabPanel.tabContent._getImmediateChildren();
      if (this.options.tabPanel.options.formMode === "create" && this.allForms.configuredFocusControlName && this.allForms.configuredFocusControlName !== "") {
        var focusControlName = this.allForms.configuredFocusControlName;
        if (childrenView[0].content._keyPathMap[focusControlName]) {
          fieldPath = childrenView[0].content._keyPathMap[focusControlName].fieldPath;
          formId = childrenView[0].content._keyPathMap[focusControlName].formId;
        }
        _.each(childrenView, function(childView) {
          if (childView.content.model.id === formId) {
            var fieldControl = childView.content.getAlpacaControlByPath(fieldPath);
            var fieldView = _.isArray(fieldControl) ? fieldControl[0].fieldView : fieldControl.fieldView;
            formUtils.setFocusOnConfiguredElement(fieldView);
          }
        });
      }
    },
    onPropertiesPageFetchError: function(error) {
      this.trigger("external:request:failed");
      if (error) {
        error.message = error.errorDetails ? error.errorDetails : error.message;
        Alert.showError(error);
      }
    },
    _saveMiniViewerPanelVisibilitySetting: function(value) {
      if (!Accessibility.isAccessibleMode()) {
        userPreference.saveLocalStorePreference(userPreference.StorageTypes.MINIVIEWER_VISIBLITY, "is_miniview_visible", value);
      }
    },
    _retreiveMiniViewerPanelVisibilitySetting: function() {
      if (Accessibility.isAccessibleMode()) {
        return true;
      }
      return nodeUtils._showViewer(this.options.node) ? userPreference.getLocalStorePreference(userPreference.StorageTypes.MINIVIEWER_VISIBLITY, "is_miniview_visible") : false;
    },
    getLayoutMode: function(dialogSize) {
      if (constants.WizardSize.MEDIUM === dialogSize || constants.WizardSize.LARGE === dialogSize || constants.WizardSize.LARGE === dialogSize) {
        return "doubleCol";
      }
      return "singleCol";
    },
    fetchFullForm: function(fullForm, properties) {
      if (fullForm) {
        var childrenViews = this.options.tabPanel.tabContent._getImmediateChildren();
        _.each(childrenViews, function(view) {
          var form = view.content.form;
          var getChildControls = function(controls, properties) {
            _.each(controls, function(control) {
              if (control.children) {
                if (control.schema && control.schema._d2Containertype !== "d2grid") {
                  getChildControls(control.children, properties);
                }
              } else {
                var exclusionList = [ "r_version_label", "a_status" ];
                if (!exclusionList.includes(control.propertyId)) {
                  if (properties[control.propertyId] === undefined) {
                    var value = control.getValue();
                    if (FormatUtils.isDateType(control.type) || FormatUtils.isDateType(control.options._type)) {
                      value = FormatUtils.convertToServerFormat(value);
                    }
                    if (control.options._repeating && !_.isArray(value)) {
                      value = [ value ];
                    }
                    properties[control.propertyId] = value;
                  }
                }
              }
            });
          };
          getChildControls(form.children, properties);
        });
      }
      return properties;
    }
  });
  return D2MetadataPropertiesView;
});