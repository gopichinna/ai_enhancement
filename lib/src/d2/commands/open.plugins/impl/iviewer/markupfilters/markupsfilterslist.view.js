/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import Marionette from "nuc/lib/marionette";

import ModalAlert from "csui/dialogs/modal.alert/modal.alert";

import GlobalMessage from "d2/controls/globalmessage/globalmessage";

import MarkupFilterService from "d2/commands/open.plugins/impl/iviewer/markupfilters/markupfilters.service";

import MarkupFilterUtil from "d2/commands/open.plugins/impl/iviewer/markupfilters/markupfilter.util";

import RestResources from "dctmw/utils/rest.resources";

import lang from "i18n!d2/commands/open.plugins/nls/localized.strings";

export default class FiltersListView extends Marionette.View {
  constructor(options) {
    super(options);
    this.filters = options.filters || [];
    this.markupsList = options.markupsList;
    this.selectedMarkupIds = options.selectedMarkupIds;
    this.scrollPane = options.scrollPane;
    this.currentDocumentId = options.currentDocumentId;
    this.iViewerContext = options.iViewerContext;
    this.createFilterButtonShow = options.createFilterButtonShow;
    this.ConsolidatedMarkupState = options.ConsolidatedMarkupState;
    this.onFilterSelection = options.onFilterSelection;
  }
  render() {
    this.el.innerHTML = "";
    const header = document.createElement("div");
    header.className = "ot-iv-MarkupDetails-headerRow ot-iv-MarkupDetails-hit ot-iv-MarkupDetails-pageIndexRow";
    header.textContent = lang.AvailableFilters;
    this.el.appendChild(header);
    if (!Array.isArray(this.filters) || this.filters.length === 0) {
      const msg = document.createElement("div");
      msg.className = "ot-iv-NoFiltersMessage";
      msg.textContent = lang.NoFiltersAvailable;
      this.el.appendChild(msg);
      return;
    }
    this.filters.forEach((item, idx) => this.addFilterRow(item, idx));
  }
  addFilterRow(item, index) {
    const row = document.createElement("div");
    row.className = "ot-iv-MarkupList-Row";
    row.dataset.name = item.title;
    row.dataset.filterContent = JSON.stringify(item.filter_content || {});
    row.dataset.filterCreator = item.filter_creator;
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "consolidatedGroup";
    const titleSpan = document.createElement("span");
    titleSpan.className = "filter-title";
    titleSpan.textContent = item.title;
    const creatorSpan = document.createElement("span");
    creatorSpan.className = "filter-creator";
    creatorSpan.textContent = `(${item.filter_creator})`;
    const updateBtn = document.createElement("button");
    updateBtn.textContent = lang.SetDefault;
    updateBtn.className = "markup-update-btn";
    updateBtn.style.display = "none";
    updateBtn.title = lang.SetDefaultFilterToolTip;
    const deleteBtn = document.createElement("span");
    deleteBtn.className = "markup-delete-icon";
    const isDisabled = RestResources.getCurrentUser().id !== item.filter_creator;
    if (isDisabled) {
      deleteBtn.classList.add("disabled");
    }
    updateBtn.addEventListener("click", e => {
      e.stopPropagation();
      MarkupFilterService.updateDefaultFilter(this.iViewerContext.connector, this.iViewerContext.bearerToken, item.r_object_id).then(() => {
        GlobalMessage.showMessage("success", lang.DefaultFilterUpdateSuccessful);
        this.onFilterSelection?.();
      }).catch(() => {
        GlobalMessage.showMessage("error", lang.ParseFailure);
      });
    });
    deleteBtn.addEventListener("click", e => {
      e.stopPropagation();
      ModalAlert.confirmQuestion(confirmed => {
        if (confirmed) {
          this.filters = this.filters.filter(f => f.title !== item.title);
          this.ConsolidatedMarkupState.groups.delete(item.title);
          MarkupFilterService.deleteMarkupFilter(this.iViewerContext.connector, this.iViewerContext.bearerToken, item.r_object_id).then(() => {
            GlobalMessage.showMessage("success", lang.DefaultFilterDeleteSuccessful);
            this.onFilterSelection?.();
          }).catch(() => {
            GlobalMessage.showMessage("error", lang.DefaultFilterDeleteFailure);
          });
        }
      }, lang.DeleteFilter, lang.ConfirmDeleteFilterMessage, {
        buttons: {
          labelYes: lang.ConfirmDeleteFilter,
          labelNo: lang.DoNotDeleteFilter,
          showNo: true,
          showCancel: false
        },
        modalClass: "d2-be-sm-dialog"
      });
    });
    row.addEventListener("click", () => {
      radio.checked = true;
      this.createFilterButtonShow.disabled = true;
      this.el.querySelectorAll(".ot-iv-MarkupList-Row").forEach((rowEl, i) => {
        const btn = rowEl.querySelector(".markup-update-btn");
        const isDefault = this.filters[i]?.is_default;
        btn.style.display = i === index && !isDefault ? "inline-block" : "none";
      });
      this.scrollPane.querySelectorAll("input[type='checkbox']").forEach(cb => {
        cb.checked = false;
        this.selectedMarkupIds.clear();
      });
      const parsed = MarkupFilterUtil.parseFilterContent(item.filter_content);
      const markupIds = (parsed.withAnyProperties || []).filter(p => p.name === "id").map(p => p.value);
      this.scrollPane.querySelectorAll("input[type='checkbox']").forEach(cb => {
        const m = this.markupsList[cb.dataset.markupId];
        if (m && markupIds.includes(m.id)) {
          cb.checked = true;
          this.selectedMarkupIds.add(cb.dataset.markupId);
        }
      });
      this.trigger("markupfilterpane:resetFilter");
      const filterObj = MarkupFilterUtil.getFilterContent(this.selectedMarkupIds);
      this.trigger("markupfilterpane:setFilter", filterObj);
    });
    row.append(radio, titleSpan, creatorSpan, updateBtn, deleteBtn);
    this.el.appendChild(row);
  }
}