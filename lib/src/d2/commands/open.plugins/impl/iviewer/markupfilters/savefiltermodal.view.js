/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import Marionette from "nuc/lib/marionette";

import saveFilterDialogTpl from "hbs!d2/commands/open.plugins/impl/iviewer/markupfilters/markupfilter.save";

import lang from "i18n!d2/commands/open.plugins/nls/localized.strings";

export default class SaveFilterModalView extends Marionette.View {
  constructor(options = {}) {
    super(options);
    this.existingNames = options.existingNames || [];
  }
  show() {
    return new Promise((resolve, reject) => {
      const backdrop = document.createElement("div");
      backdrop.className = "binf-modal-backdrop binf-fade binf-in";
      const modal = document.createElement("div");
      modal.innerHTML = saveFilterDialogTpl({
        saveFilterTitle: lang.SaveFilterTitle,
        saveFilterMessage: lang.SaveFilterMessage,
        filterLabel: lang.FilterNamePlaceholder,
        filterTextPlaceholder: lang.FilterTextBoxPlaceholder,
        saveFilter: lang.SaveButtonText,
        cancelCreation: lang.CancelButtonText
      });
      document.body.appendChild(modal.firstElementChild);
      document.body.appendChild(backdrop);
      const wrapper = document.querySelector(".save-markupfilter-dialog");
      wrapper.classList.add("binf-in");
      backdrop.classList.add("binf-in");
      setTimeout(() => {
        document.getElementById("markup-filter-name-input")?.focus();
      }, 100);
      const cleanup = () => {
        wrapper.remove();
        backdrop.remove();
      };
      document.getElementById("saveMarkupFilterBtn")?.addEventListener("click", () => {
        const input = document.getElementById("markup-filter-name-input");
        const name = input.value.trim();
        const errorDiv = document.getElementById("markup-filter-error");
        const isDefaultFilter = document.getElementById("set-default-filter")?.checked || false;
        errorDiv.textContent = "";
        if (!name) {
          errorDiv.textContent = lang.EmptyFilterName;
          return;
        }
        if (this.existingNames.includes(name)) {
          errorDiv.textContent = lang.DuplicateFilterName;
          return;
        }
        cleanup();
        resolve({
          name: name,
          isDefaultFilter: isDefaultFilter
        });
      });
      document.getElementById("cancelMarkupFilterBtn")?.addEventListener("click", () => {
        cleanup();
        reject();
      });
    });
  }
}