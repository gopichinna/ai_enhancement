/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/base", "smart/themes/theming", "csui/controls/progressblocker/blocker", "csui/utils/non-emptying.region/non-emptying.region", "csui/perspective.manage/impl/pman.panel.view", "csui/utils/perspective/perspective.util", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/contexts/factories/node", "csui/utils/contexts/factories/user", "csui/widgets/navigation.header/controls/help/help.view", "csui/models/perspective/personalization.model", "csui/perspectives/mixins/draganddrop.kn.mixin", "i18n!csui/perspective.manage/impl/nls/lang", "hbs!csui/perspective.manage/impl/pman", "i18n", "csui/perspective.manage/mixins/update.supportasset.branding.config.mixin", "csui/utils/commonconfig.util", "csui/themes/csui.jato.action.icons", "css!csui/perspective.manage/impl/pman", "csui/perspective.manage/behaviours/pman.widget.config.behaviour", "csui/lib/jquery.ui/js/jquery-ui" ], function(_, $, Backbone, Marionette, base, theming, BlockingView, NonEmptyingRegion, PManPanelView, PerspectiveUtil, ApplicationScopeModelFactory, NodeModelFactory, UserModelFactory, HelpView, PersonalizationModel, DragAndDropKNMixin, lang, template, i18n, UpdateSupportAssetBrandingConfigMixin, CommonConfigUtil, jatoActionIcons) {
  const isJato = () => theming.isJATOTheme();
  let themes = [ "light", "dark" ];
  var pmanContainer;
  let enableSideBar = CommonConfigUtil.enableSideBar();
  var PManView = Marionette.ItemView.extend({
    className: function() {
      var classNames = [ "pman", "pman-container" ];
      classNames.push("pman-mode-" + this.options.mode);
      return _.unique(classNames).join(" ");
    },
    template: template,
    templateHelpers: function() {
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
        personalizeMode: this.mode === PerspectiveUtil.MODE_PERSONALIZE && (this.options.perspective.has("perspective_id") || this.options.perspective.has("id"))
      };
    },
    ui: {
      pmanPanel: ".pman-header .pman-pannel-wrapper",
      cancelEdit: ".pman-header .pman-cancel-edit",
      addIcon: ".pman-header .icon-toolbarAdd",
      helpIcon: ".pman-header .icon-help",
      saveBtn: ".pman-header .pman-icon-save",
      trashArea: ".pman-header .pman-trash-area",
      resetBtn: ".pman-header .pman-icon-reset",
      headerContainer: ".pman-container-header-container .pman-container-header"
    },
    events: {
      "click @ui.cancelEdit": "onClickClose",
      "click @ui.addIcon": "togglePannel",
      "click @ui.helpIcon": "onClickHelp",
      "click @ui.saveBtn": "onClickSave",
      "click @ui.resetBtn": "onClickReset",
      keydown: "onKeyDown"
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
    _registerEventHandler: function() {
      this.listenTo(this, "change:layout", this._changeLayout);
      this.listenTo(this, "swap:layout", this._swapLayout);
      this.listenTo(this.context, "save:perspective", this._savePerspective);
      this.listenTo(this.context, "change:perspective", this._onChangePerspective);
      this.listenTo(this.context, "retain:perspective", this._doExitPerspective);
      this.listenTo(this.context, "finish:exit:edit:perspective", this._doCleanup);
    },
    _prepareForEdit: function(originalPerspective) {
      if (!originalPerspective) {
        throw new Error("Missing perspective");
      }
      this.perspective = this._clonePrespective(originalPerspective);
    },
    _clonePrespective: function(original) {
      var perspectiveConfig = original.getPerspective();
      var config = JSON.parse(JSON.stringify(perspectiveConfig));
      original.setPerspective(config);
      return original;
    },
    show: function() {
      var container = this.getContainer(), region = new NonEmptyingRegion({
        el: container
      });
      region.show(this);
      return this;
    },
    getContainer: function() {
      if (!pmanContainer || !$.contains(this.options.container, pmanContainer)) {
        pmanContainer = $("<div>", {
          class: "binf-widgets"
        }).appendTo(this.options.container)[0];
      }
      return pmanContainer;
    },
    _savePerspective: function(perspectiveChanges) {
      if (!!perspectiveChanges && !!perspectiveChanges.error) {
        this.ui.saveBtn.prop("disabled", false);
        return;
      }
      this.perspective.update(perspectiveChanges);
      this.perspective.save().then(_.bind(this._onSaveSuccess, this), _.bind(this._onSaveError, this));
    },
    _onSaveSuccess: function() {
      var self = this;
      if (self.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        if (self.context.previewBranding?.get("isBrandingChangeTriggered")) {
          this._showMessage("success", lang.LblBrandingChanges);
        } else {
          this._showMessage("success", lang.perspectiveSaveSuccess);
        }
      } else {
        this._showMessage("success", lang.personalizationSaveSuccess);
      }
      var contextPerspectiveMode = self.context.perspective.get("perspectiveMode") || PerspectiveUtil.MODE_EDIT_PERSPECTIVE, sourceModel = self._getSourceModel();
      var updatePerspective = self.perspective.getPerspective();
      updatePerspective.id = self.perspective.getPerspectiveId();
      if (self.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        var originalPerspective = sourceModel.get("perspective");
        sourceModel.set("perspective", _.defaults(updatePerspective, originalPerspective));
      } else {
        var originalPerspective = sourceModel.get("perspective");
        sourceModel.set("perspective", _.defaults({
          personalizations: self.perspective.toJSON()
        }, originalPerspective));
      }
      if (contextPerspectiveMode === self.mode) {
        self.context.perspective.set(updatePerspective);
      } else if (self.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        var personalization = new PersonalizationModel({}, {
          perspective: updatePerspective
        });
        personalization.setPerspective(self.context.perspective.toJSON());
        updatePerspective = personalization.getPerspective();
        self.context.perspective.set(updatePerspective);
      } else if (self.mode === PerspectiveUtil.MODE_PERSONALIZE) {
        var personalization = new PersonalizationModel({}, {
          perspective: sourceModel.get("perspective")
        });
        personalization.setPerspective(updatePerspective);
        updatePerspective = personalization.getPerspective();
        self.context.perspective.set(updatePerspective);
      }
      self._doExitPerspective();
    },
    _onSaveError: function(error) {
      this.ui.saveBtn.prop("disabled", false);
      this.displayError(error);
    },
    displayError: function(error) {
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
    _showMessage: function(type, message) {
      require([ "csui/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
        GlobalMessage.showMessage(type, message);
      });
    },
    _swapLayout: function(newLayoutType) {
      this.perspective.setPerspective({
        type: newLayoutType,
        options: this.perspective.attributes.perspective.options
      }, {
        silent: true
      });
      this.context.triggerMethod("swap:layout", this.perspective);
    },
    _changeLayout: function(newLayoutType) {
      this.perspective.setPerspective({
        type: newLayoutType,
        options: {
          perspectiveMode: this.mode
        }
      }, {
        silent: true
      });
      this._triggerEditMode();
      !enableSideBar && this.togglePannel();
    },
    onClickSave: function() {
      this.applyHeaderChanges().done(() => {
        var popoverTarget = this.options.container.find(".binf-popover");
        if (popoverTarget.length) {
          popoverTarget.binf_popover("hide");
          setTimeout(_.bind(function() {
            this.context.triggerMethod("serialize:perspective", this.perspective);
          }, this), 1500);
        } else {
          this.context.triggerMethod("serialize:perspective", this.perspective);
        }
      });
    },
    applyHeaderChanges: function() {
      let deferred = $.Deferred();
      if (!this.context?.previewBranding?.get("isBrandingChangeTriggered")) return deferred.resolve();
      this.blockActions();
      if (isJato() && CommonConfigUtil.enableJatoBranding()) {
        let brandLogoUploadPromises = [];
        const cssFileUri = this.changeInJatoBrandingCSS();
        this.getSupportAssetVolumeID().done(response => {
          const supportAssetVolumeDetails = response.data;
          if (!supportAssetVolumeDetails) return deferred.reject({
            statusMsg: "no support asset volume"
          });
          themes.forEach(theme => {
            const {
              fileDetails,
              brandLogoUri
            } = this.getJatoThemeBrandingLogo(theme, this.context.previewBranding.attributes);
            brandLogoUploadPromises.push(this.uploadBrandingConfigJato(supportAssetVolumeDetails, fileDetails, brandLogoUri, theme));
          });
          $.whenAll.apply($, brandLogoUploadPromises).done(responses => {
            let requestObject = this.getRequestObjForJatoBrandSettingsUpdate(responses, themes);
            this.uploadBrandingConfigSettings(requestObject).done(response => {
              const {
                fileDetails,
                brandLogoUri
              } = this.getJatoThemeBrandingLogo(theming.getTheme(), this.context.previewBranding.attributes);
              this.applyNavigationCSSJato(cssFileUri, fileDetails, brandLogoUri);
              this.unblockActions();
              deferred.resolve();
            }).fail(error => deferred.reject(error));
          }).fail(errors => {
            errors = errors.filter(error => !error.statusMsg);
            deferred.reject(errors.length > 0 ? errors[0] : "");
          });
        }).fail(error => deferred.reject(error));
      } else {
        const {
          fileDetails,
          brandLogoUri
        } = this.context.previewBranding.attributes;
        const cssFileUri = this.changeInBrandingCSS();
        this.uploadBrandingConfig(fileDetails, brandLogoUri).done(() => {
          this.applyNavigationCSS(cssFileUri, fileDetails, brandLogoUri);
          this.unblockActions();
          deferred.resolve();
        }).fail(error => {
          deferred.reject(error);
        });
      }
      return deferred.promise();
    },
    applyNavigationCSS: function(cssFileUri, fileDetails, brandLogoUri) {
      const imgFileURL = fileDetails ? URL.createObjectURL(fileDetails) : brandLogoUri;
      let brandingConfig = this.context.navigationHeaderView?.brandingConfigData ?? this.context.navigationHeaderView?.options?.brandingConfig ?? {};
      brandingConfig.set("brandLogoUri", imgFileURL);
      brandingConfig.set("brandingCSS", cssFileUri);
      brandingConfig.set("tempBrandingCSS", cssFileUri);
      brandingConfig.set("brandingSettingCodes", this.tBrandingSettingCodes);
      this.context.navigationHeaderView.render();
    },
    applyNavigationCSSJato: function(cssFileUri, fileDetails, brandLogoUri) {
      const imgFileURL = fileDetails ? URL.createObjectURL(fileDetails) : brandLogoUri;
      let brandingConfig = this.context.navigationHeaderView?.brandingConfigData ?? this.context.navigationHeaderView?.options?.brandingConfig ?? {};
      brandingConfig.set("brandingCSS", cssFileUri);
      brandingConfig.set("tempBrandingCSS", cssFileUri);
      brandingConfig.set("brandingSettingCodes", this.tBrandingSettingCodes);
      this.context.navigationHeaderView.render();
    },
    changeInBrandingCSS: function() {
      const changedBrandingData = this.context?.previewBranding?.get("brandingSettingCodes") ?? {};
      this.tBrandingSettingCodes = structuredClone(changedBrandingData);
      const brandingConfigCSSUri = this.createStyleSheet(changedBrandingData);
      return brandingConfigCSSUri;
    },
    changeInJatoBrandingCSS: function() {
      const changedBrandingData = this.context?.previewBranding?.get("brandingSettingCodes") ?? {};
      this.tBrandingSettingCodes = structuredClone(changedBrandingData);
      const brandingConfigCSSUri = changedBrandingData?.themes ? this.createStyleSheetForJatoTheme(changedBrandingData) : this.createStyleSheet(changedBrandingData);
      return brandingConfigCSSUri;
    },
    uploadBrandingConfig: function(imgFile, isBrandLogoUriPresent) {
      const self = this;
      const deferred = $.Deferred();
      this.getSupportAssetVolumeID().done(response => {
        const supportAssetVolumeDetails = response.data;
        if (!supportAssetVolumeDetails) return deferred.reject({
          statusMsg: "no support asset volume"
        });
        this.fetchBrandingConfigFolderDetails(supportAssetVolumeDetails, imgFile, isBrandLogoUriPresent).done(responseFromBrandingConfig => {
          self.uploadInSupportAssetVolume(imgFile, responseFromBrandingConfig).done(() => deferred.resolve({
            statusMsg: "user has reset the data"
          })).fail(error => {
            return deferred.reject(error);
          });
        }).fail(error => deferred.reject(error));
      }).fail(error => deferred.reject(error));
      return deferred.promise();
    },
    uploadBrandingConfigJato: function(supportAssetVolumeDetails, imgFile, isBrandLogoUriPresent, theme) {
      const deferred = $.Deferred();
      this.uploadBrandingLogoForJato(supportAssetVolumeDetails, imgFile, isBrandLogoUriPresent, theme).done(response => {
        deferred.resolve(response);
      }).fail(error => deferred.reject(error));
      return deferred.promise();
    },
    uploadBrandingLogoForJato: function(supportAssetVolumeDetails, imgFile, isBrandLogoUriPresent, theme) {
      const deferred = $.Deferred();
      this.fetchBrandingConfigFolderDetailsJato(supportAssetVolumeDetails, imgFile, isBrandLogoUriPresent, theme).done(responseFromBrandingConfig => {
        this.uploadConfigInBrandingFolder(imgFile, responseFromBrandingConfig).done(response => {
          deferred.resolve(response);
        }).fail(error => {
          deferred.reject(error);
        });
      });
      return deferred.promise();
    },
    uploadInSupportAssetVolume: function(imgFile, responseFromBrandingConfig) {
      const deferred = $.Deferred();
      this.uploadConfigInBrandingFolder(imgFile, responseFromBrandingConfig).done(response => {
        this.uploadBrandingConfigData(response).done(() => {
          return deferred.resolve({
            statusMsg: "Image updated"
          });
        }).fail(error => {
          return deferred.reject(error);
        });
      }).fail(error => {
        return deferred.reject(error);
      });
      return deferred.promise();
    },
    uploadBrandingConfigData: function(responseFromBrandingConfig) {
      const {
        brandingSettingCodes
      } = structuredClone(this.context?.previewBranding?.toJSON() ?? {});
      const deferred = $.Deferred();
      const updatedPreviewObject = this.context.previewBranding?.get("brandingSettingCodes");
      let brandLogoUri = responseFromBrandingConfig?.id ?? this.context.previewBranding?.get("brandLogoUri_id");
      if (!brandLogoUri) {
        brandLogoUri = null;
      }
      let brandingConfig = this.context.navigationHeaderView?.brandingConfigData ?? this.context.navigationHeaderView?.options?.brandingConfig ?? {};
      brandingConfig?.set("brandLogoUri_id", brandLogoUri);
      if (brandingSettingCodes.themes) {
        themes.forEach(theme => {
          let brandSettingTheme = brandingSettingCodes?.themes[theme];
          if (brandingSettingCodes?.themes && brandSettingTheme && updatedPreviewObject?.themes[theme]?.brandLogoUri_id) {
            brandSettingTheme.brandLogoUri = updatedPreviewObject?.themes[theme]?.brandLogoUri_id;
            delete brandSettingTheme?.fileDetails;
            delete brandSettingTheme?.brandLogoUri_id;
          }
          if (brandSettingTheme && !brandSettingTheme.brandLogoUri) {
            brandSettingTheme.brandLogoUri = null;
          }
          if (brandSettingTheme && brandSettingTheme.customBgColor?.indexOf("rgb") > -1) {
            brandSettingTheme.customBgColor = "";
          }
        });
      }
      const data = {
        brandLogoUri: brandLogoUri,
        brandingSettingCodes: brandingSettingCodes
      };
      this.uploadBrandingConfigSettings(data).done(response => {
        return deferred.resolve(response);
      }).fail(error => {
        return deferred.reject(error);
      });
      return deferred.promise();
    },
    getRequestObjForJatoBrandSettingsUpdate: function(responses, themes) {
      let data;
      let savedBrandSettingCodes = this.tBrandingSettingCodes;
      themes.forEach((theme, i) => {
        let brandLogoUri = responses[i]?.id ?? this.context.previewBranding?.get("brandingSettingCodes")?.themes[theme]?.brandLogoUri_id;
        if (!brandLogoUri) {
          brandLogoUri = null;
        }
        let cfthemeLogoId = this.context?.previewBranding.get("brandLogoUri_id");
        let brandingConfig = this.context.navigationHeaderView?.brandingConfigData ?? this.context.navigationHeaderView?.options?.brandingConfig ?? {};
        if (!cfthemeLogoId) {
          brandingConfig?.set("brandLogoUri", null);
        }
        const {
          brandingSettingCodes
        } = structuredClone(this.context?.previewBranding?.toJSON() ?? {});
        data = data ? data : {
          brandLogoUri: !cfthemeLogoId ? null : cfthemeLogoId,
          brandingSettingCodes: brandingSettingCodes
        };
        if (data.brandingSettingCodes?.themes[theme]) {
          let themeObj = data.brandingSettingCodes.themes[theme];
          let iconColor = data.brandingSettingCodes.themes[theme].isInvertIconColor;
          if (iconColor) {
            data.brandingSettingCodes.themes[theme].isInvertIconColor = true;
          } else {
            data.brandingSettingCodes.themes[theme].isInvertIconColor = false;
          }
          themeObj.brandLogoUri = brandLogoUri;
          if (savedBrandSettingCodes?.themes[theme]) {
            savedBrandSettingCodes.themes[theme].brandLogoUri_id = brandLogoUri;
          }
          if (themeObj?.customBgColor?.indexOf("rgb") > -1) {
            themeObj.customBgColor = "";
          }
          delete themeObj.brandLogoUri_id;
          delete themeObj.fileDetails;
        }
      });
      return data;
    },
    onClickHelp: function() {
      this.context._applicationScope.set("oldScopeId", this.context._applicationScope.get("id"));
      if (this.options.mode === "personalize") {
        this.helpView.triggerMethod("click:help", "editpersonalizepage");
      } else if (this.options.mode === "editNavigationHeader") {
        this.helpView.triggerMethod("click:help", "editNavigationHeader");
      } else {
        this.helpView.triggerMethod("click:help", "editpage");
      }
    },
    onClickReset: function() {
      var self = this;
      require([ "csui/dialogs/modal.alert/modal.alert" ], function(alertDialog) {
        alertDialog.confirmQuestion(lang.resetConfirmMsg, lang.reset, {
          buttons: {
            showYes: true,
            labelYes: lang.reset,
            showNo: true,
            labelNo: lang.cancel
          }
        }).done(function(yes) {
          if (yes) {
            self._doReset();
          }
        });
      });
    },
    _doReset: function() {
      var sourceModel = this._getSourceModel();
      originalPerspective = JSON.parse(JSON.stringify(sourceModel.get("perspective")));
      originalPerspective.options = originalPerspective.options || {};
      originalPerspective.options.perspectiveMode = this.mode;
      var originalConfig = new Backbone.Model(originalPerspective);
      this.context.triggerMethod("enter:edit:perspective", originalConfig);
      this.listenToOnce(this.context, "finish:enter:edit:perspective", function() {
        this._showMessage("success", lang.resetSuccessful);
      });
    },
    _getSourceModel: function(params) {
      var sourceModel;
      if (this.applicationScope.get("id") === "node") {
        sourceModel = this.context.getModel(NodeModelFactory);
      } else {
        sourceModel = this.context.getModel(UserModelFactory);
      }
      return sourceModel;
    },
    onClickClose: function() {
      document.querySelector(".binf-widgets.perspective-editing .cs-perspective-panel").removeAttribute("style");
      this._doExitPerspective();
    },
    togglePannel: function(event) {
      if (!this.ui.pmanPanel.hasClass("binf-active")) {
        if (!(event.originalEvent.pointerType === "mouse")) {
          this.$el.find(".csui-layout-tab").attr("tabindex", 0);
          this.$el.find(".csui-layout-tab").focus();
        }
        this._openToolsPanel();
      } else {
        this.$el.find(".csui-layout-tab").attr("tabindex", -1);
        this.$el.find(".cs-go-back").attr("tabindex", -1);
        this._closeToolsPanel();
      }
    },
    _openToolsPanel: function() {
      this.pmanPanelView.trigger("reset:items");
      this.ui.addIcon.addClass("binf-active");
      this.ui.addIcon.attr("title", lang.close);
      this.ui.pmanPanel.addClass("binf-active");
      this.pmanPanelView.triggerMethod("panel:open");
    },
    _closeToolsPanel: function() {
      this.ui.pmanPanel.removeClass("binf-active");
      this.ui.addIcon.attr("title", lang.addWidget);
      this.ui.addIcon.removeClass("binf-active");
    },
    applyMasking: function() {},
    _initializeWidgets: function() {
      if (this.mode === PerspectiveUtil.MODE_PERSONALIZE) {
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
        tolerance: "pointer",
        hoverClass: "pman-trash-hover",
        accept: function() {
          return false;
        }
      });
    },
    _triggerEditMode: function() {
      var perspectiveConfig = this.perspective.getPerspective();
      perspectiveConfig.options = perspectiveConfig.options || {};
      perspectiveConfig.options.perspectiveMode = this.mode;
      var perspective = new Backbone.Model(perspectiveConfig);
      this.context.triggerMethod("enter:edit:perspective", perspective);
      this.listenToOnce(this.context, "finish:enter:edit:perspective", this._setFocusOnFirstWidget);
    },
    _beforeTransition: function() {
      var perspectiveContainer = this.options.container.find(".cs-perspective");
      this.options.container.addClass("perspective-editing-transition");
      base.onTransitionEnd(perspectiveContainer, function() {
        this.options.container.removeClass("perspective-editing-transition");
      }, this);
    },
    onRender: function() {
      var self = this;
      this._beforeTransition();
      this.options.container.addClass("perspective-editing");
      !enableSideBar && this.options.container.find(".cs-perspective-panel")?.addClass("csui-normal-scrolling");
      this.options.applyMasking();
      this._initializeWidgets();
      this._triggerEditMode();
      $(document).on("click." + this.cid, {
        view: this
      }, this._documentClick);
      var applyKNMixin = this.perspective.get("type") === "sidepanel-right" || this.perspective.get("type") === "sidepanel-left" || this.perspective.get("type") === "flow" || this.perspective.get("perspective").type === "sidepanel-right" || this.perspective.get("perspective").type === "sidepanel-left" || this.perspective.get("perspective").type === "flow";
      if (applyKNMixin) {
        $(document).on("keydown", {
          view: this
        }, this.onKeyInView);
      }
    },
    onKeyInView: function(event) {
      var isRtl = i18n && i18n.settings.rtl, self = event.data && event.data.view, continueEvent = true, isMac = base.isMacintosh();
      if ($(document.activeElement).parents("#banner").length > 0) {
        return;
      }
      if (isMac && event.metaKey && !event.ctrlKey || !isMac && !event.metaKey && event.ctrlKey) {
        var $target = $(event.target), $targetParent = $target.closest(".csui-draggable-item"), widgetCells = self.options && self.options.context && self.options.context.widgetCollection && self.options.context.widgetCollection.at(0).columns.models;
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
    _documentClick: function(event) {
      var self = event.data.view;
      if (self.ui.addIcon.is(event.target) || !!self.ui.addIcon.has(event.target).length) {
        return;
      }
      if (self.ui.pmanPanel.is(event.target) || !!self.ui.pmanPanel.has(event.target).length) {
        return;
      }
      self._closeToolsPanel();
    },
    _onChangePerspective: function() {
      this._doCleanup();
    },
    _doCleanup: function() {
      var popoverTarget = this.options.container.find(".binf-popover");
      this._beforeTransition();
      if (popoverTarget.length) {
        popoverTarget.binf_popover("destroy");
      }
      this.options.container.removeClass("perspective-editing");
      this.options.container.find(".cs-perspective-panel")?.removeClass("csui-normal-scrolling");
      $(document).off("click." + this.cid, this._documentClick);
      $(document).off("keydown", this.onKeyInView);
      this.trigger("destroy");
    },
    _doExitPerspective: function() {
      this.context.triggerMethod("exit:edit:perspective", this.perspective);
    },
    _setFocusOnFirstWidget: function() {
      var focusableEle = this.options.container.find(".cs-perspective-panel .cs-perspective .csui-pman-editable-widget").first(), shortcutButton = focusableEle.find(".shortcut-group-wrapper");
      if (shortcutButton.attr("tabindex") === "0") {
        shortcutButton[0].focus();
      } else {
        focusableEle.find(".wrapper-button")[0].focus();
      }
    },
    onKeyDown: function(event) {
      switch (event.keyCode) {
       case 9:
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