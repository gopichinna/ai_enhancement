/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import Marionette from "nuc/lib/marionette";

import GlobalMessage from "d2/controls/globalmessage/globalmessage";

import MarkupsListView from "d2/commands/open.plugins/impl/iviewer/markupfilters/markupslist.view";

import FiltersListView from "d2/commands/open.plugins/impl/iviewer/markupfilters/markupsfilterslist.view";

import SaveFilterModalView from "d2/commands/open.plugins/impl/iviewer/markupfilters/savefiltermodal.view";

import MarkupFilterService from "d2/commands/open.plugins/impl/iviewer/markupfilters/markupfilters.service";

import MarkupFilterUtil from "d2/commands/open.plugins/impl/iviewer/markupfilters/markupfilter.util";

import lang from "i18n!d2/commands/open.plugins/nls/localized.strings";

import "css!d2/commands/open.plugins/impl/iviewer/markupfilters/markupfilters.style";

const MarkupFiltersController = Marionette.View.extend({
  constructor: function(options) {
    Marionette.View.prototype.constructor.call(this, options);
    this.iViewerContext = null;
    this.ConsolidatedMarkupState = {
      groups: new Map()
    };
    this.filtersContainer = null;
    this.currentDocumentId = null;
    this.markupFiltersMap = [];
    this.selectedMarkupIds = new Set();
    this.createFilterButtonShow = null;
  },
  render: function() {
    const container = document.querySelector(".ot-iv-CustomPane");
    if (!container) return;
    if (!this.iViewerContext) {
      this.trigger("markupfilterpane:data");
      return;
    }
    const docId = this.iViewerContext?.documentId;
    if (this.currentDocumentId !== docId) {
      this.currentDocumentId = docId;
      this.ConsolidatedMarkupState.groups.clear();
      this.markupFiltersMap = [];
      this.selectedMarkupIds.clear();
    }
    container.innerHTML = "";
    const title = document.createElement("div");
    title.textContent = lang.AllAvailableMarkups;
    title.className = "ot-iv-MarkupDetails-headerRow ot-iv-MarkupDetails-hit ot-iv-MarkupDetails-pageIndexRow";
    container.appendChild(title);
    let allMarkups = {};
    this.trigger("markupfilterpane:getAllLoadedMarkups", allLoadedMarkups => {
      allMarkups = allLoadedMarkups;
    });
    const markupsList = {};
    Object.entries(allMarkups).forEach(([ id, m ]) => {
      if (!m.deleted) markupsList[id] = m;
    });
    if (!this.selectedMarkupIds || this.selectedMarkupIds.size === 0) {
      this.selectedMarkupIds = new Set(Object.keys(markupsList));
    }
    const markupsPane = document.createElement("div");
    container.appendChild(markupsPane);
    const filterBtnWrapper = document.createElement("div");
    filterBtnWrapper.id = "ot-iv-ButtonWrapper";
    container.appendChild(filterBtnWrapper);
    const filterBtn = document.createElement("button");
    filterBtn.textContent = lang.CreateFilter;
    filterBtn.setAttribute("data-testid", "customMenuButton");
    filterBtn.title = lang.CreateFilterToolTip;
    this.createFilterButtonShow = filterBtn;
    const markupsView = new MarkupsListView({
      el: markupsPane,
      markupsList: markupsList,
      selectedMarkupIds: this.selectedMarkupIds,
      filtersContainer: this.filtersContainer,
      createFilterButtonShow: this.createFilterButtonShow,
      onSelectionChange: ids => {
        this.selectedMarkupIds = new Set(ids);
        this.applyFilter(ids, markupsList, false);
      }
    });
    markupsView.render();
    filterBtn.addEventListener("click", () => {
      const selectedIds = Array.from(this.selectedMarkupIds);
      if (selectedIds.length === 0) return;
      const modal = new SaveFilterModalView({
        existingNames: this.markupFiltersMap.map(f => f.title)
      });
      modal.show().then(({
        name,
        isDefaultFilter
      }) => {
        if (this.ConsolidatedMarkupState.groups.has(name)) {
          GlobalMessage.showMessage("error", lang.DuplicateFilterName);
          return;
        }
        const filterContent = MarkupFilterUtil.getFilterContent(selectedIds);
        this.ConsolidatedMarkupState.groups.set(name, selectedIds);
        MarkupFilterService.saveMarkupFilter(this.iViewerContext?.connector, name, this.iViewerContext?.bearerToken, this.currentDocumentId, filterContent, isDefaultFilter).then(result => {
          if (result?.r_object_id?.length > 0) {
            GlobalMessage.showMessage("success", lang.FilterSaveSuccess);
          } else {
            GlobalMessage.showMessage("error", lang.FilterSaveError);
          }
          this.render();
        }).catch(() => {
          GlobalMessage.showMessage("error", lang.FilterSaveError);
        });
      }).catch(() => {});
    });
    filterBtnWrapper.appendChild(filterBtn);
    this.filtersContainer = document.createElement("div");
    this.filtersContainer.classList.add("ot-iv-Filters");
    container.appendChild(this.filtersContainer);
    MarkupFilterService.getMarkupFiltersList(this.iViewerContext?.connector, this.currentDocumentId, this.iViewerContext?.bearerToken).then(filters => {
      this.markupFiltersMap = filters;
      const filtersView = new FiltersListView({
        el: this.filtersContainer,
        filters: filters,
        markupsList: markupsList,
        scrollPane: markupsPane,
        selectedMarkupIds: this.selectedMarkupIds,
        currentDocumentId: this.currentDocumentId,
        iViewerContext: this.iViewerContext,
        createFilterButtonShow: this.createFilterButtonShow,
        ConsolidatedMarkupState: this.ConsolidatedMarkupState,
        onFilterSelection: () => this.render()
      });
      filtersView.render();
      filtersView.on("markupfilterpane:resetFilter", () => {
        this.trigger("markupfilterpane:resetFilter");
      });
      filtersView.on("markupfilterpane:setFilter", filterObj => {
        this.trigger("markupfilterpane:setFilter", filterObj);
      });
      const defaultFilter = filters.find(f => f.is_default);
      if (defaultFilter?.is_default) {
        const parsed = MarkupFilterUtil.parseFilterContent(defaultFilter.filter_content);
        const defaultFilterMarkupIds = (parsed.withAnyProperties || []).filter(p => p.name === "id").map(p => p.value);
        markupsPane.querySelectorAll("input[type='checkbox']").forEach(cb => {
          cb.checked = defaultFilterMarkupIds.includes(cb.dataset.markupId);
        });
        this.selectedMarkupIds.clear();
        defaultFilterMarkupIds.forEach(id => this.selectedMarkupIds.add(id));
        filtersView.selectedMarkupIds = this.selectedMarkupIds;
        filtersView.render();
        this.applyFilter(defaultFilterMarkupIds);
        this.filtersContainer.querySelectorAll("input[type='radio']").forEach(r => {
          r.checked = r.closest("[data-name]")?.dataset.name === defaultFilter.title;
        });
        return;
      }
      this.applyFilter(Array.from(this.selectedMarkupIds));
    });
  },
  applyFilter: function(ids) {
    const filterObj = MarkupFilterUtil.getFilterContent(ids);
    this.trigger("markupfilterpane:resetFilter");
    this.trigger("markupfilterpane:setFilter", ids?.length == 0 ? {
      author: Date.now()
    } : filterObj);
  },
  renderMarkupsAndFiltersPane: function(forceRender) {
    if (forceRender) {
      this.render();
    }
  },
  setIViewerParamsForFilterPane: function({
    connector,
    bearerToken,
    documentId
  }) {
    this.iViewerContext = {
      connector: connector,
      bearerToken: bearerToken,
      documentId: documentId
    };
  }
});

export default function MarkupFiltersControllerFactory(options) {
  return new MarkupFiltersController(options);
}