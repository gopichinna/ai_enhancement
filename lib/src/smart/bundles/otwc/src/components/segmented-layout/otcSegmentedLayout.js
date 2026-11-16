/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import styles from './otcSegmentedLayout.scss.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';

/**
 * The Segmented Layout component is an element for organizing contents of a page or of a widget. A component layout for complex controls,
 * which contain header and navigation slots at the top, footer and navigation slots at the bottom and main and side slots in the middle.
 * If a slot is omitted, the others will take over the remaining space. This layout is also known as the "Holy Grail" layout.
 * @cssprop [--ot-segmented-layout-side-start-max-width=unset] The maximum width of the first side slot.
 * @cssprop [--ot-segmented-layout-side-start-min-width=48px] The minimum width of the first side slot.
 * @cssprop [--ot-segmented-layout-side-start-width=25%] The width of the first side slot.
 * @cssprop [--ot-segmented-layout-side-end-max-width=unset] The maximum width of the second side slot.
 * @cssprop [--ot-segmented-layout-side-end-min-width=48px] The minimum width of the second side slot.
 * @cssprop [--ot-segmented-layout-side-end-width=25%] The width of the second side slot.
 * @csspart foot - The bottom of the overall layout.
 * @csspart head - The top of the overall layout.
 * @csspart main - The center of the middle navigation section.
 * @csspart navBottom - The bottom of the middle navigation section.
 * @csspart navTop - The top of the middle navigation section.
 * @csspart sideEnd - The second side panel.
 * @csspart sideStart - The first side panel.
 * @slot foot - Width: full<br>Height: fits contents<br>Stacking: vertical
 * @slot head - Width: full<br>Height: fits contents<br>Stacking: vertical
 * @slot main - Width: the rest between the sides<br>Height: fills the rest<br>Stacking: horizontal
 * @slot nav-bottom - Width: as wide as `main`<br>Height: fits contents<br>Stacking: vertical
 * @slot nav-top - Width: as wide as `main`<br>Height: fits contents<br>Stacking: vertical
 * @slot side-end - Width: specified width<br>Height: fills the rest<br>Stacking: horizontal
 * @slot side-start - Width: specified width<br>Height: fills the rest<br>Stacking: horizontal
 */
class OtcSegmentedLayout extends ElementBase {
  static get styles() {
    return [
      commonStyleSheet,
      styles,
    ];
  }

  // Used internally to populate `parts` with elements wrapping the slots.
  #partRefs = {
    head: e(),
    navTop: e(),
    main: e(),
    navBottom: e(),
    sideStart: e(),
    sideEnd: e(),
    foot: e(),
  };

  // Accessors for HTML elements, which are the layout parts (slot parents).

  head = null;

  navTop = null;

  main = null;

  navBottom = null;

  sideStart = null;

  sideEnd = null;

  foot = null;

  updated() {
    // Whenever the element is updated, make sure that `parts` point
    // to with elements wrapping the slots.
    this.#updateParts();
  }

  #updateParts() {
    // Populate `parts` with elements wrapping the slots.
    for (const [name, { value }] of Object.entries(this.#partRefs)) {
      this[name] = value;
    }
  }

  #toggleSlot({ target: slot }) {
    // Some slots (main, side-start and side-end) have their width and heights
    // set explicitly and thus they won't collapse like other flex-items, if
    // left without content. If using pure HTML, it's easy not to include
    // an element to have the other flex-items take its space. But this web
    // component always contains all slot parents, ready to take children.
    // Hiding a slot's parent if the slot is empty is easier than removing it.
    const isFilled = slot.assignedNodes().length;
    slot.parentElement.classList[isFilled ? 'remove' : 'add']('ot--is-hidden');
  }

  render() {
    return html`<div part="head" ${n(this.#partRefs.head)} class="ot-segmented-layout__head"><slot name="head"></slot></div><div class="ot-segmented-layout__body"><div class="ot-segmented-layout__content"><div part="nav-top" ${n(this.#partRefs.navTop)} class="ot-segmented-layout__nav-top"><slot name="nav-top"></slot></div><div part="main" ${n(this.#partRefs.main)} class="ot-segmented-layout__main"><slot name="main"></slot></div><div part="nav-bottom" ${n(this.#partRefs.navBottom)} class="ot-segmented-layout__nav-bottom"><slot name="nav-bottom"></slot></div></div><div part="side-start" ${n(this.#partRefs.sideStart)} class="ot-segmented-layout__side-start ot--is-hidden"><slot name="side-start" @slotchange="${this.#toggleSlot}"></slot></div><div part="side-end" ${n(this.#partRefs.sideEnd)} class="ot-segmented-layout__side-end ot--is-hidden"><slot name="side-end" @slotchange="${this.#toggleSlot}"></slot></div></div><div part="foot" ${n(this.#partRefs.foot)} class="ot-segmented-layout__foot"><slot name="foot"></slot></div>`;
  }
}

customElements.define('otc-segmented-layout', OtcSegmentedLayout);

export { OtcSegmentedLayout };
//# sourceMappingURL=otcSegmentedLayout.js.map
