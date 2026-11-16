import { html } from 'lit';
import { ElementBase } from '../element-base.js';
import { OTC_ICON_BUNDLE_WC_ACTION } from '../../utilities/render-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import widgetHeaderStyles from './otcWidgetHeader.scss.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/* eslint-disable lit-a11y/click-events-have-key-events */

/**
 * The Widget Header component is a container used above widgets like a folder browser or search results.  It contains a central title
 * component in the form of a `otc-widget-header-title`, or a variation thereof.  It contains slots to the left and right of the title for
 * displaying actions.  It also contains a slot below the header bar for displaying additional actions.<br><br>
 * **NOTE:** There is no need to place
 * `otc-toolbar` components inside the widget header slots.  The widget header already includes similar functionality to `otc-toolbar`
 * internally, so placing a conflicting `otc-toolbar` component in a widget header slot may have undesired behavior.
 * @prop {string} actionsBarAriaLabel The aria-label of the actions toolbar.
 * @prop {string} titleBarAriaLabel The aria-label of the title toolbar.
 * @prop {boolean} hideActionsBar Controls the display of the actions bar.
 * @prop {boolean} hideTitleBar Controls the display of the title bar.
 * @slot expandIcon An slot that is used to contain the expand icon on the actions bar.
 * @slot left A slot that is used to place items to the left on the header bar.
 * @slot right A slot that is used to place items to the right on the header bar.
 * @slot title A slot that is used to place items in the center of the header bar.
 * @slot unnamed An slot that is used to place items below the header bar.
 */
class OtcWidgetHeader extends ElementBase {
  #partRefs = {
    actionBarSlot: e(),
    widgetHeaderDiv: e(),
    widgetHeaderTitleBarDiv: e(),
  };

  static get styles() {
    return [
      commonStyleSheet,
      widgetHeaderStyles,
    ];
  }

  static get properties() {
    return {
      actionsBarAriaLabel: { type: String, reflect: true },
      titleBarAriaLabel: { type: String, reflect: true },
      hideActionsBar: { type: Boolean, reflect: true },
      hideTitleBar: { type: Boolean, reflect: true },

      // Whether or not to show the title bar does not just depend on the value of `hideTitleBar`.  It can change based on whether or not
      // the expand icon has been clicked.  We will track the current state here so that we still have the ability to reset to the initial
      // state as represented by the public properties.
      _shouldShowTitleBar: { state: true },

      // Determines if the expand icon should be rotated 180 degrees.  We use the same icon for both expanded and collapsed and just rotate
      // it based on the state.  By default, the icon is an arrow pointing up.
      _rotateExpandIcon: { state: true },
    };
  }

  constructor() {
    super();

    this.actionsBarAriaLabel = 'Actions toolbar';
    this.titleBarAriaLabel = 'Title toolbar';
    this.hideActionsBar = false;
    this.hideTitleBar = false;
    this._shouldShowTitleBar = true;
    this._rotateExpandIcon = false;
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }
  }

  updated(changedProperties) {
    // If the `hideActionsBar` or `hideTitleBar` properties change, reset the state of the title bar and expand icon back to the initial
    // state as represented by the public properties.
    if (changedProperties.has('hideActionsBar') || changedProperties.has('hideTitleBar')) {
      this.#resetShowTitleBarState();
      this.#resetRotateExpandIconState();
    }

    if (changedProperties.has('_shouldShowTitleBar')) {
      // If we contain an `otc-widget-header-folder-title` that is in edit mode, cancel editing,
      const folderTitle = this.querySelector('otc-widget-header-folder-title');
      if (folderTitle && folderTitle.isEditing) {
        folderTitle.isEditing = false;
      }
    }
  }

  #resetShowTitleBarState() {
    // Reset the state of the title bar back to the public property.
    this._shouldShowTitleBar = !this.hideTitleBar;
  }

  #resetRotateExpandIconState() {
    // If the title bar is being shown, we need to rotate the expand icon to match this state.
    this._rotateExpandIcon = this._shouldShowTitleBar;
  }

  #handleExpandIconClick(event) {
    // Flip the state of the expand icon rotation.
    this._rotateExpandIcon = !this._rotateExpandIcon;

    // By default, the title bar is hidden and the expand icon is not rotated.  So, if we just set the expand icon to be rotated, we must be
    // in a state where we should show the title bar.
    this._shouldShowTitleBar = this._rotateExpandIcon;

    // Set the `aria-expanded` property.
    if (event.target) {
      if (event.target.menuOpen === undefined) {
        // If the event target does not have a 'menuOpen' property, e.g. it is not one of our web components, then set 'aria-expanded'
        // directly.
        event.target.setAttribute('aria-expanded', this._shouldShowTitleBar);
      } else {
        // If the event target does have a 'menuOpen' property, e.g. it is one of our web components, then set 'menuOpen'.  The web
        // component will set 'aria-expanded' on the proper element in the shadow root itself.
        event.target.updateComplete?.then(() => { event.target.menuOpen = this._shouldShowTitleBar; });
      }
    }
  }

  #handleTransitionStart() {
    const widgetHeaderDiv = this.#partRefs.widgetHeaderDiv.value;
    const widgetHeaderTitleBarDiv = this.#partRefs.widgetHeaderTitleBarDiv.value;

    // Hide the overflow while the transition animation is running.  The transition animation relies on the overflow being hidden for a
    // smooth transition.  Otherwise, the title bar and action bar could overlap each other in an unpleasant way.
    widgetHeaderDiv.style.overflow = 'hidden';
    widgetHeaderTitleBarDiv.style.overflow = 'hidden';
  }

  #handleTransitionEnd() {
    const widgetHeaderDiv = this.#partRefs.widgetHeaderDiv.value;
    const widgetHeaderTitleBarDiv = this.#partRefs.widgetHeaderTitleBarDiv.value;

    // Show the overflow again now that the transition animation is finished.
    widgetHeaderDiv.style.overflow = 'revert';
    widgetHeaderTitleBarDiv.style.overflow = 'revert';
  }

  get #actionBarItems() {
    return this.#partRefs.actionBarSlot.value?.assignedElements({ flatten: true });
  }

  render() {
    const titleBarClasses = {
      'ot-widget-header-title-bar': true,
      'ot-widget-header--is-hidden': !this._shouldShowTitleBar,
    };

    const actionBarClasses = {
      'ot-widget-header-actions-bar': true,
      'ot-widget-header--is-hidden': this.hideActionsBar,
      'ot--is-hidden': this.#actionBarItems?.length < 1,
    };

    const expandIconClasses = {
      'ot-widget-header-expand-icon': true,
      'ot-widget-header--is-hidden': this.hideActionsBar || this.#actionBarItems?.length < 1,
      'ot-widget-header-expand-icon-rotated': this._rotateExpandIcon,
    };

    return html`<div ${n(this.#partRefs.widgetHeaderDiv)} class="ot-widget-header" @transitionstart="${this.#handleTransitionStart}" @transitionend="${this.#handleTransitionEnd}"><div id="widget-header-title-bar" class="${e$1(titleBarClasses)}" ${n(this.#partRefs.widgetHeaderTitleBarDiv)}><otc-toolbar ariaLabel="${this.titleBarAriaLabel}"><div class="ot-widget-header-title-bar__wrapper"><div class="ot-widget-header-title-bar__left"><slot name="left"></slot></div><div class="ot-widget-header-title-bar__title"><slot name="title"></slot></div><div class="ot-widget-header-title-bar__right"><slot name="right"></slot></div></div></otc-toolbar></div><div id="widget-header-actions-bar" class="${e$1(actionBarClasses)}"><div class="ot-widget-header-actions-bar__items"><otc-toolbar ariaLabel="${this.actionsBarAriaLabel}" wrapWideItems><slot ${n(this.#partRefs.actionBarSlot)}></slot><slot name="otc-overflow-slot" slot="otc-overflow-slot"></slot></otc-toolbar></div><div class="${e$1(expandIconClasses)}" @click="${this.#handleExpandIconClick}"><slot name="expandIcon"><otc-button arialabel="${this._rotateExpandIcon ? 'Hide table header' : 'Show table header'}" icon="${OTC_ICON_BUNDLE_WC_ACTION}:action_reveal_header32" title="${this._rotateExpandIcon ? 'Hide header' : 'Show header'}"></otc-button></slot></div></div></div>`;
  }
}

customElements.define('otc-widget-header', OtcWidgetHeader);

export { OtcWidgetHeader };
//# sourceMappingURL=otcWidgetHeader.js.map
