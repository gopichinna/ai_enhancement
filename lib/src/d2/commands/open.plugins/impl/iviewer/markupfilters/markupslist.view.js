/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import Marionette from "nuc/lib/marionette";

export default class MarkupsListView extends Marionette.View {
  constructor(options) {
    super(options);
    this.markupsList = options.markupsList || {};
    this.selectedMarkupIds = options.selectedMarkupIds || new Set();
    this.onSelectionChange = options.onSelectionChange;
    this.filtersContainer = options.filtersContainer;
    this.createFilterButtonShow = options.createFilterButtonShow;
  }
  render() {
    this.el.innerHTML = "";
    Object.values(this.markupsList).forEach(({
      id,
      title,
      author
    }) => {
      const row = document.createElement("div");
      row.className = "ot-iv-MarkupList-Row";
      row.dataset.markupId = id;
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `markup-checkbox-${id}`;
      checkbox.dataset.markupId = id;
      checkbox.checked = this.selectedMarkupIds.has(id);
      checkbox.addEventListener("change", () => {
        checkbox.checked ? this.selectedMarkupIds.add(id) : this.selectedMarkupIds.delete(id);
        this.createFilterButtonShow.disabled = false;
        this.filtersContainer?.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
        this.filtersContainer?.querySelectorAll(".markup-update-btn").forEach(btn => btn.style.display = "none");
        this.onSelectionChange?.(Array.from(this.selectedMarkupIds));
      });
      const label = document.createElement("label");
      label.setAttribute("for", checkbox.id);
      label.textContent = `${title} (${author})`;
      row.append(checkbox, label);
      this.el.appendChild(row);
    });
  }
}