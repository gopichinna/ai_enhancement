/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/log", "smart/controls/side.panel/side.panel.view", "smart/controls/table.settings/impl/columns.side.panel.selected.view", "smart/controls/table.settings/impl/columns.side.panel.edit.view", "smart/dialogs/modal.alert/modal.alert", "i18n!smart/controls/table.settings/impl/nls/lang" ], function(module, _, Backbone, Marionette, logUtils, SidePanelView, ColumnsSidePanelSelectedView, ColumnsSidePanelEditView, ModalAlert, lang) {
  const log = logUtils(module.id);
  class TableSettingsColumnsSidePanelView {
    constructor(options) {
      const self = this;
      let allColumnsCollection;
      this._haveOtherCustomizations = options.haveOtherCustomizations;
      if (_.isArray(options.allColumns)) {
        allColumnsCollection = new Backbone.Collection(options.allColumns);
      } else {
        if (options.allColumns instanceof Backbone.Collection) {
          allColumnsCollection = options.allColumns;
        } else {
          throw new Error("options.allColumns must either be an Array with model data or a Backbone.Collection");
        }
      }
      if (!options.selectedColumns) {
        throw new Error("selectedColumns must not be undefined");
      }
      if (!(options.selectedColumns instanceof Backbone.Collection)) {
        throw new Error("selectedColumns must be a Backbone.Collection");
      }
      for (let i = allColumnsCollection.length - 1; i >= 0; i--) {
        const column = allColumnsCollection.at(i);
        if (column.get("permanent")) {
          column.set("permanentAtEnd", true, {
            silent: true
          });
        } else {
          break;
        }
      }
      this._columnsSelectedView = new ColumnsSidePanelSelectedView({
        allColumns: allColumnsCollection,
        selectedColumns: options.selectedColumns
      });
      this._currentSelectedColumns = new Backbone.Collection();
      this._columnsEditView = new ColumnsSidePanelEditView({
        allColumns: allColumnsCollection,
        selectedColumns: this._currentSelectedColumns,
        ungroupedFirst: options.ungroupedFirst
      });
      this._sidePanelView = new SidePanelView({
        sidePanelClassName: "smart-side-panel-table-settings",
        layout: {
          size: "custom"
        },
        hideNextButton: true,
        hideBackButton: false,
        beforeDestroyCallback: function() {
          return new Promise((resolve, reject) => {
            let mustAskForConfirmation = self._checkForChanges.call(self);
            if (mustAskForConfirmation) {
              const discardAllOptions = {
                lightWeight: true,
                buttons: {
                  showYes: true,
                  labelYes: lang.buttonTextDiscard,
                  showNo: false,
                  showCancel: true
                }
              };
              ModalAlert.confirmWarning(lang.discardChangesTitle, "", discardAllOptions).done(function() {
                resolve(true);
              }).fail(function() {
                resolve(false);
              });
            } else {
              resolve(true);
            }
          });
        },
        slides: [ {
          title: lang.columnsTitleSelected,
          ariaDescription: lang.columnsAriaSelected,
          layout: {
            header: true,
            footer: true
          },
          footer: {
            rightButtons: [ {
              label: lang.buttonTextApply,
              id: "apply",
              key: "apply",
              variant: "primary",
              close: true
            }, {
              label: lang.buttonTextEdit,
              id: "edit",
              key: "edit",
              variant: "secondary"
            }, {
              label: lang.buttonTextResetLong,
              id: "reset",
              key: "reset",
              variant: "secondary"
            } ]
          },
          content: this._columnsSelectedView
        }, {
          title: lang.columnsTitleEdit,
          ariaDescription: lang.columnsAriaEdit,
          layout: {
            header: true,
            footer: true
          },
          footer: {
            hideBackButton: false,
            rightButtons: [ {
              label: lang.buttonTextUpdate,
              id: "update",
              key: "update",
              variant: "primary"
            } ]
          },
          content: this._columnsEditView
        } ]
      });
      this._sidePanelView.slides[0].footer.rightButtons[0].disabled = true;
      this._sidePanelView.slides[0].footer.rightButtons[2].disabled = true;
      this._sidePanelView.slides[1].footer.rightButtons[0].disabled = true;
      this.listenTo(this._sidePanelView, "after:hide", () => {
        this.trigger("hidden");
      });
      this.listenTo(this._sidePanelView, "shown:slide", (slide, slideIndex) => {
        for (let idx = 0; idx < this._sidePanelView.slides.length; idx++) {
          if (idx !== slideIndex) {
            this._sidePanelView.slides[idx].content.markShown(false);
          }
          switch (slideIndex) {
           case 0:
            this._selectedColumnsFooterView = this._sidePanelView.footerView;
            if (!this._initialSelectedColumnsHash) {
              this._initialSelectedColumnsHash = this._columnsSelectedView.getCurrentlySelectedColumnsHash();
            }
            this._enableOrDisableApplyButton();
            this._enableOrDisableResetToDefaultButton();
            break;

           case 1:
            this._editColumnsFooterView = this._sidePanelView.footerView;
            this._initialEditColumnsHash = this._columnsEditView.getCurrentlySelectedColumnsHash();
            break;
          }
        }
        slide.content.markShown(true);
        slide.content.setInitialFocus();
      });
      this.listenTo(this._columnsSelectedView, "button:click", (button, args) => {
        switch (button.key) {
         case "apply":
          this._columnsSelectedView.applyChanges();
          this._initialSelectedColumnsHash = this._columnsSelectedView.getCurrentlySelectedColumnsHash();
          break;

         case "edit":
          this._setCurrentlySelectedColumns();
          this._sidePanelView._showSlide(1);
          break;

         case "reset":
          this._wantResetAllChanges().then(confirmed => {
            if (confirmed) {
              if (this._haveOtherCustomizations) {
                this._haveOtherCustomizationsReset = true;
                this._haveOtherCustomizations = false;
              }
              this._columnsSelectedView.resetToDefaults();
            }
          });
          break;
        }
      });
      this.listenTo(this._columnsEditView, "before:button:click", async (button, args) => {
        if (button.type === "back") {
          let selectedEditColumnsHash = this._columnsEditView.getCurrentlySelectedColumnsHash();
          if (selectedEditColumnsHash === this._initialEditColumnsHash) {
            return;
          }
          const keepDiscardOptions = {
            buttons: {
              showYes: true,
              labelYes: lang.buttonTextKeep,
              showNo: true,
              labelNo: lang.buttonTextDiscard,
              showCancel: true
            }
          };
          args.wait = new Promise((resolve, reject) => {
            ModalAlert.confirmQuestion("", lang.keepChangesTitle, keepDiscardOptions).done(function() {
              args.keep = true;
              resolve();
            }).fail(function(arg) {
              if (arg === undefined) {
                args.cancel = true;
              } else {
                args.discard = true;
              }
              resolve();
            });
          });
        }
      });
      this.listenTo(this._columnsEditView, "button:click", (button, args) => {
        if (button.type === "back") {
          if (args.keep) {
            this._initialEditColumnsHash = this._columnsEditView.getCurrentlySelectedColumnsHash();
            this._columnsSelectedView.setCurrentSelectedColumns(this._columnsEditView.getSelectedColumns());
            return;
          }
          this._currentSelectedColumns.reset([]);
          return;
        }
        switch (button.key) {
         case "update":
          this._sidePanelView._showSlide(0);
          this._initialEditColumnsHash = this._columnsEditView.getCurrentlySelectedColumnsHash();
          this._columnsSelectedView.setCurrentSelectedColumns(this._columnsEditView.getSelectedColumns());
          break;
        }
      });
      this.listenTo(this._currentSelectedColumns, "add remove", () => {
        if (!this._initialEditColumnsHash) {
          return;
        }
        const editColumnsHash = this._columnsEditView.getCurrentlySelectedColumnsHash();
        const disabled = editColumnsHash === this._initialEditColumnsHash;
        const activeElementBeforeUpdateButton = document.activeElement;
        this._editColumnsFooterView.updateButton("update", {
          disabled: disabled
        });
        if (activeElementBeforeUpdateButton) {
          activeElementBeforeUpdateButton.focus();
        }
      });
      this.listenTo(this._columnsSelectedView.collection, "update reset", () => {
        if (!this._initialSelectedColumnsHash) {
          return;
        }
        this._enableOrDisableApplyButton();
        this._enableOrDisableResetToDefaultButton();
      });
    }
    _enableOrDisableResetToDefaultButton() {
      const enabled = this._haveOtherCustomizations || !this.areSelectedColumnsDefault();
      const activeElementBeforeUpdateButton = document.activeElement;
      this._selectedColumnsFooterView.updateButton("reset", {
        disabled: !enabled
      });
      if (activeElementBeforeUpdateButton) {
        activeElementBeforeUpdateButton.focus();
      }
    }
    _enableOrDisableApplyButton() {
      const selectedColumnsHash = this._columnsSelectedView.getCurrentlySelectedColumnsHash();
      const enabled = this._haveOtherCustomizationsReset || selectedColumnsHash !== this._initialSelectedColumnsHash;
      const activeElementBeforeUpdateButton = document.activeElement;
      this._selectedColumnsFooterView.updateButton("apply", {
        disabled: !enabled
      });
      if (activeElementBeforeUpdateButton) {
        activeElementBeforeUpdateButton.focus();
      }
    }
    async _wantResetAllChanges() {
      const isResetToDefault = !this._haveOtherCustomizations && this.areSelectedColumnsDefault();
      return new Promise((resolve, reject) => {
        if (isResetToDefault) {
          resolve(true);
        } else {
          const resetOptions = {
            buttons: {
              showYes: true,
              labelYes: lang.buttonTextReset,
              showNo: false,
              showCancel: true
            }
          };
          ModalAlert.confirmWarning(lang.resetAllChanges, lang.resetAllChangesTitle, resetOptions).done(function() {
            resolve(true);
          }).fail(function() {
            resolve(false);
          });
        }
      });
    }
    _checkForChanges() {
      let mustAskForConfirmation = false;
      const selectedColumnsHash = this._columnsSelectedView.getCurrentlySelectedColumnsHash();
      if (selectedColumnsHash !== this._initialSelectedColumnsHash) {
        mustAskForConfirmation = true;
      } else {
        if (this._initialEditColumnsHash) {
          const editColumnsHash = this._columnsEditView.getCurrentlySelectedColumnsHash();
          if (editColumnsHash !== this._initialEditColumnsHash) {
            mustAskForConfirmation = true;
          }
        }
      }
      return mustAskForConfirmation;
    }
    _updateSubtitle() {
      const selected = this._columnsEditView.collection.where({
        selected: true
      });
      this._sidePanelView.slides[1].subTitle = `${selected.length} selected`;
      this._sidePanelView.slides[1].content.trigger("update:header", this._sidePanelView.slides[1]);
    }
    _setCurrentlySelectedColumns() {
      const models = this._columnsSelectedView.getSelectedColumns();
      this._currentSelectedColumns.reset(models);
    }
    show() {
      return new Promise((resolve, reject) => {
        this._sidePanelView.show(() => {
          this._columnsSelectedView.focusFirst();
          this.trigger("shown");
          resolve();
        });
      });
    }
    hide() {
      return new Promise((resolve, reject) => {
        this._sidePanelView.hide(() => {
          resolve();
        });
      });
    }
    areSelectedColumnsDefault() {
      return this._columnsSelectedView.areSelectedColumnsDefault();
    }
  }
  Object.assign(TableSettingsColumnsSidePanelView.prototype, Backbone.Events);
  return TableSettingsColumnsSidePanelView;
});