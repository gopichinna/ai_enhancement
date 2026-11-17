/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/utils/url", "nuc/lib/backbone", "csui/dialogs/modal.alert/modal.alert", "csui/perspective.manage/impl/landing.page.pman.constants", "csui/utils/perspective/perspective.util", "csui/models/perspective/personalization.model", "i18n!csui/perspective.manage/impl/nls/lang" ], function(URL, Backbone, ModalAlert, PmanConstants, PerspectiveUtil, PersonalizationModel, lang) {
  "use strict";
  let LandingPagePmanMixin = {
    mixin: function(prototype) {
      return Object.assign(prototype, {
        onFinishSerializeWelcomePage: async function(currentPModel, action, nextPModel) {
          switch (action) {
           case "save":
            this.saveAllPerspectives();
            break;

           case "close":
            this.closeAllPerspectives(currentPModel);
            break;

           case "add":
            this.addNewPerspective(nextPModel);
            break;

           default:
            if (this.shouldShowSavePrompt(currentPModel, action, nextPModel)) {
              await this.promptToSaveModifiedPerspectives(currentPModel);
              return false;
            }
            nextPModel?.trigger("finish:serialize:welcomepage");
          }
        },
        saveAllPerspectives: function(modifiedPerspectives = this.getAllModifiedPerspectives(), exitAfterSave = false) {
          if (modifiedPerspectives.length === 0) return;
          let url = this.connector.getConnectionUrl().getApiBase("v2");
          let ajaxOptions = {
            url: URL.combine(url, `${this.options.requestUrl}`),
            type: "POST",
            data: `${this.options.body}=${encodeURIComponent(JSON.stringify(modifiedPerspectives))}`
          };
          this.connector.makeAjaxCall(ajaxOptions).then(this._onSaveSuccess.bind(this, exitAfterSave), this._onSaveError.bind(this));
        },
        closeAllPerspectives: async function(currentPModel, modifiedPerspectives = this.getAllModifiedPerspectives()) {
          if (modifiedPerspectives.length === 0) {
            this._doExitPerspective();
            return;
          }
          try {
            await ModalAlert.confirmQuestion(lang.closeConfirmation, lang.close, {
              buttons: {
                showYes: true,
                labelYes: lang.save,
                showNo: true,
                labelNo: lang.close,
                showCancel: true,
                labelCancel: lang.cancel,
                disableYes: this.ui.saveBtn[0].disabled
              }
            });
            this.saveAllPerspectives(modifiedPerspectives, true);
          } catch (result) {
            if (result === false) {
              this._doExitPerspective();
            } else {
              currentPModel?.trigger("finish:serialize:welcomepage");
            }
          }
        },
        getAllModifiedPerspectives: function() {
          let modifiedPerspectives = [];
          this.topRibbonView.collection.map(pModel => pModel.has("hasOnlybasicPerspectiveInfo") || modifiedPerspectives.push(pModel.toJSON()));
          return modifiedPerspectives;
        },
        promptToSaveModifiedPerspectives: async function(pModel) {
          await ModalAlert.confirmQuestion(lang.promptToSaveMsg.replace("{0}", pModel.collection.modifiedCount), lang.promptToSaveTitle, {
            buttons: {
              showYes: true,
              labelYes: lang.saveAll,
              showNo: false,
              showCancel: true,
              disableYes: this.ui.saveBtn[0].disabled
            }
          });
          this.saveAllPerspectives();
        },
        addNewPerspective: function(pModel) {
          this.topRibbonView.addPerspective(pModel);
        },
        shouldShowSavePrompt: function(currentPModel, action, nextPModel) {
          return currentPModel.collection.modifiedCount >= PmanConstants.MAX_THRESHOLD && !action && nextPModel.has("hasOnlybasicPerspectiveInfo");
        },
        toggleAddNewPageBtn: function(modifiedCount) {
          let addPageBtn = this.el.querySelector(".csui-top-ribbon-actions .csui-add-new-page");
          if (addPageBtn) {
            addPageBtn.disabled = modifiedCount >= PmanConstants.MAX_THRESHOLD;
          }
        },
        _onSaveSuccess: async function(exitAfterSave) {
          this._showMessage("success", lang.personalizationSaveSuccess);
          try {
            if (this.mode === PerspectiveUtil.MODE_PERSONALIZE) {
              let activePModel = this.topRibbonView.collection.findWhere({
                perspective_id: this.context.perspective.get("id")
              });
              this.context.perspective.set(activePModel.getPerspective());
            }
          } catch (err) {
            console.error(err);
          }
          exitAfterSave ? this._doExitPerspective() : this.topRibbonView.collection.fetch({
            reset: true
          });
          this.el.querySelector(".pman-icon-save").setAttribute("disabled", true);
          this.context.trigger("perspective:save:success");
        },
        _onSaveError: function(error) {
          const errorMessages = error.responseJSON?.errorDetail && JSON.parse(error.responseJSON.errorDetail);
          if (errorMessages) {
            let errorMessageMap = {};
            errorMessages.forEach(errorMessage => {
              const message = JSON.stringify(errorMessage).slice(1, -1);
              const title = message.split(":")[0].slice(1, -1);
              errorMessageMap[title] = message;
            });
            const perspectiveArray = this.topRibbonView.children.toArray();
            for (let i = perspectiveArray.length - 1; i >= 0; i--) {
              const child = perspectiveArray[i];
              let message = errorMessageMap[child.model.getTitle()];
              if (message) {
                message = message.split(":");
                child.el.classList.add("csui-server-error-perspective");
                this._showMessage("error", `${message[0]}: ${message[1]}`);
              }
            }
            this.toggleSave();
            if (errorMessages) this.topRibbonView.navigateToErrorPerspective(Object.keys(errorMessages[0])[0]);
          } else {
            this.displayError(error);
          }
        },
        loadDefaultPerspective: async function() {
          let perspectiveChanges = await this.getDefaultPerspective();
          let pModel = new Backbone.Model();
          pModel.set("perspective", perspectiveChanges);
          let peronalize = await PersonalizationModel.loadPersonalization(pModel);
          this.context.perspective.clear();
          this.context.perspective.set(peronalize ?? perspectiveChanges);
        },
        getDefaultPerspective: async function() {
          let url = this.connector.getConnectionUrl().getApiBase("v2");
          let ajaxOptions = {
            url: URL.combine(url, "/perspectives/defaultperspective"),
            type: "GET"
          };
          let resp = await this.connector.makeAjaxCall(ajaxOptions);
          return resp.results;
        }
      });
    }
  };
  return LandingPagePmanMixin;
});