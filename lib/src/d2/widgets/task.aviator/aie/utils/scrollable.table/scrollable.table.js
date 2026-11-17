/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
export function makeTablesScrollable(html, {
  maxWidth
}) {
  const fragment = document.createDocumentFragment();
  const fragDiv = document.createElement("div");
  fragDiv.innerHTML = html;
  fragment.appendChild(fragDiv);
  const tables = fragDiv.querySelectorAll("table");
  if (!tables.length) {
    return html;
  }
  const incrementBy = maxWidth / 2;
  for (const table of tables) {
    const columns = table.querySelectorAll("thead th");
    if (!columns) continue;
    const numOfColumns = columns.length;
    if (numOfColumns <= 3) continue;
    const cells = table.querySelectorAll("tbody td");
    if (!cells) continue;
    for (const cell of cells) {
      cell.style.maxWidth = maxWidth - 50 + "px";
    }
    const widthToBeApplied = incrementBy * numOfColumns;
    table.style.width = widthToBeApplied + "px";
    const tableWrapperParent = document.createElement("div");
    tableWrapperParent.classList.add("aie-table-parent");
    const tableWrapper = document.createElement("div");
    tableWrapper.classList.add("aie-dyna-table-wrapper");
    table.parentNode.insertBefore(tableWrapper, table);
    tableWrapper.parentNode.insertBefore(tableWrapperParent, tableWrapper);
    tableWrapper.appendChild(table);
    tableWrapperParent.appendChild(tableWrapper);
  }
  return fragDiv.innerHTML;
}