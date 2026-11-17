import { nothing, html } from 'lit';
import { ElementBase } from '../element-base.js';
import { ThemeController } from '../../controllers/themeController.js';
import { waitForTimeout, isChild } from '../../utilities/common-utilities.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';
import { PopoverUtilities } from '../../utilities/popover-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import inputStyleSheet from '../input/otcInput.scss.js';
import otcFlyoutStyles from './otcFlyout.scss.js';
import { RTLController } from '../../controllers/rtlController.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/* eslint-disable lit-a11y/list */

/**
 * The flyout component represents a non modal dialog element for lightweight dialog content
 * usually closed automatically.
 * @prop {string} ariaLabel Defines the aria-label of the flyout.
 * @prop {string} buttonId Defines the id of the button that is associated with the flyout.
 * @prop {boolean} isOpen The open state of the flyout.
 * @prop {string} openingDirection Specifies the preferred opening direction (start(=left), end(=right), top, bottom).
 * @slot head Defines the header of the flyout.
 * @slot message Defines the additional message of the flyout.
 * **Note: ** It is strongly recommended that you only use simple formatting layout elements to show a message in this slot.
 * @slot main Defines the content of the flyout.
 * @slot foot Defines the footer of the flyout.
 * **Note: ** It is strongly recommended that you only use `otc-button` in order to preserve the intended design.
 * @fires beforeClose Fired before the flyout gets closed, to give the application a hook to prevent closing.
 * Can be reject via event.preventDefault()
 * @fires close Fired when the flyout gets closed.
 * @fires open Fired when the flyout is opened.
 */
class OtcFlyout extends ElementBase {
  #themeController = new ThemeController(this);

  #rtlController = new RTLController(this);

  #toggleButton;

  #otcToggleButton;

  #plainToggleButton;

  #removeMoveHandler;

  #layoutOffset;

  #flyoutOffset;

  #buttonOffset;

  #buttonPointerDown;

  #boundDocumentClickHandler = this.#handleDocumentClick.bind(this);

  #boundButtonPointerDownHandler = this.#handleButtonPointerDown.bind(this);

  #boundButtonClickHandler = this.#handleButtonClick.bind(this);

  #boundButtonKeyDownHandler = this.#handleButtonKeyDown.bind(this);

  // Used internally to access elements in the shadow root.
  #partRefs = {
    flyoutRoot: e(),
    triangle: e(),
  };

  static get styles() {
    return [
      commonStyleSheet,
      inputStyleSheet,
      otcFlyoutStyles,
    ];
  }

  static get properties() {
    const props = {
      ariaLabel: { type: String, reflect: true },
      buttonId: { type: String, reflect: true },
      id: { type: String, reflect: true },
      isOpen: { type: Boolean, reflect: true },
      openingDirection: { type: String, reflect: true },
    };

    return { ...ThemeController.properties, ...props };
  }

  constructor() {
    super();

    this.ariaLabel = '';
    this.isOpen = false;
    this.openingDirection = '';

    this.addEventListener('keydown', this.#handleKeyDown);
    this.addEventListener('focusout', this.#handleFocusout);
  }

  render() {
    const flyoutClasses = {
      'ot-flyout__root': true,
      'ot--is-hidden': !this.isOpen,
    };

    const headClasses = {
      'ot-flyout__head': true,
      'ot--is-hidden': !this.querySelector('[slot="head"]'),
    };

    const messageClasses = {
      'ot-flyout__message': true,
      'ot--is-hidden': !this.querySelector('[slot="message"]'),
    };

    const mainClasses = {
      'ot-flyout__main': true,
      'ot--is-hidden': !this.querySelector('[slot="main"]'),
    };

    const footClasses = {
      'ot-flyout__foot': true,
      'ot--is-hidden': !this.querySelector('[slot="foot"]'),
    };

    // render flyout with default position avoiding scrollbars in the ancestors during very first computation time
    return html`<div ${n(this.#partRefs.flyoutRoot)} class="${e$1(flyoutClasses)}" style="visibility:hidden"><div class="ot-flyout" role="dialog" aria-label="${this.ariaLabel?.length > 0 ? this.ariaLabel : nothing}"><div class="ot-flyout__panel"><div class="${e$1(headClasses)}"><slot name="head" @slotchange="${this.#handleSlotChange}"></slot></div><div class="${e$1(messageClasses)}"><slot name="message" @slotchange="${this.#handleSlotChange}"></slot></div><div class="${e$1(mainClasses)}"><slot name="main" @slotchange="${this.#handleSlotChange}"></slot></div><div class="${e$1(footClasses)}"><slot name="foot" @slotchange="${this.#handleSlotChange}"></slot></div><div class="ot-flyout__stripe-frame"><div class="ot-flyout__stripe-border"></div></div></div></div><div ${n(this.#partRefs.triangle)} class="ot-flyout__triangle"><div class="ot-flyout__triangle-content"></div></div></div>`;
  }

  async updated(changedProperties) {
    if (changedProperties.has('buttonId')) {
      this.#detachToggleButton();
      await this.#attachToggleButton();
    }

    this.#clearAutoUpdate();
    if (this.isOpen) {
      // Set the position of the dropdown relative to the button.
      this.#computeOffsets();
      await this.#moveFlyout();
      this.#setupAutoUpdate();
    }

    if (changedProperties.has('isOpen')) {
      // Dispatch open and close events.
      if (this.isOpen) {
        if (this.#plainToggleButton) {
          this.#plainToggleButton.setAttribute('aria-expanded', '');
        }
        if (this.#otcToggleButton) {
          this.#otcToggleButton.menuOpen = true;
        }

        // This event will only be dispatched when all animations on the flyout have finished.
        const animatedElement = this.#partRefs.flyoutRoot.value;
        const flyoutAnimationPromises = animatedElement.getAnimations().map(animation => animation.finished);
        Promise.all(flyoutAnimationPromises).then(async () => {
          // This is a hack to wait for the flyout to finish animating before we can dispatch the event.
          // needed that setting the focus by the application works.
          await waitForTimeout(100);
          const openEvent = new CustomEvent('open', { bubbles: true, composed: true });
          this.dispatchEvent(openEvent);
        });
      } else {
        if (this.#plainToggleButton) {
          this.#plainToggleButton.removeAttribute('aria-expanded');
        }
        if (this.#otcToggleButton) {
          this.#otcToggleButton.menuOpen = false;
        }

        // There is no close animation, so we can just dispatch the event immediately.
        const closeEvent = new CustomEvent('close', { bubbles: true, composed: true });
        this.dispatchEvent(closeEvent);
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.#clearAutoUpdate();
    this.#attachToggleButton().then(() => {
      if (this.isOpen) {
        this.#setupAutoUpdate();
      }
    });

    // Add the document click handler so that we can listen for the escape key to close the flyout.
    document.addEventListener('click', this.#boundDocumentClickHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#detachToggleButton();
    this.#clearAutoUpdate();

    // Remove any handlers that were added in connectedCallback().
    document.removeEventListener('click', this.#boundDocumentClickHandler);
  }

  #handleSlotChange({ target: slot }) {
    // slots are direct children of their DIV wrappers
    if (slot.assignedNodes().length > 0) {
      slot.parentElement.classList.remove('ot--is-hidden');
    } else {
      slot.parentElement.classList.add('ot--is-hidden');
    }
  }

  #handleFocusout(event) {
    // check if focus goes out of the flyout
    if (this.isOpen) {
      if (event.relatedTarget == null) {
        // occurs, when focus goes to outer frame or browser controls.
        // also occurs for example when the close button has the focus
        // and the user clicks into the main slot.
        // as we cannot distinguish these situations, ignore it.
        return;
      }
      if (event.relatedTarget === this || this.contains(event.relatedTarget)) {
        // focus stays inside the flyout
        return;
      }
      if (event.relatedTarget === this.#toggleButton && this.#buttonPointerDown) {
        // focusout is triggered by a click on the button, where a click event will follow;
        return;
      }
      // focus goes to outside the flyout
      if (this.#checkBeforeClose()) {
        this.isOpen = false;
      } else if (event.target !== this) {
        event.target.focus();
      }
    }
  }

  #handleKeyDown(event) {
    switch (event.key) {
      case 'Escape':
      case 'Esc':
        if (this.isOpen) {
          // Stop the default 'Escape' action.
          event.preventDefault();

          if (this.#checkBeforeClose()) {
            // Close the flyout.
            this.isOpen = false;

            // Focus on the associated button element when closing the flyout.
            this.#toggleButton?.focus();
          }
        }
        break;

      // no default
    }
  }

  #handleButtonKeyDown(event) {
    if (event.target?.readonly) {
      return;
    }

    switch (event.key) {
      case 'Escape':
      case 'Esc':
        if (this.isOpen) {
          // Stop the default 'Escape' action.
          event.preventDefault();

          if (this.#checkBeforeClose()) {
            // Close the flyout.
            this.isOpen = false;
          }
        }
        break;

      // no default
    }
  }

  #handleButtonPointerDown() {
    this.#buttonPointerDown = true;
  }

  #handleButtonClick(event) {
    if (this.isOpen) {
      if (this.#checkBeforeClose()) {
        this.isOpen = false;
      }
    } else if (event.target && !event.target.disabled && !event.target.readonly) {
      this.isOpen = true;
    }
  }

  #handleDocumentClick(event) {
    this.#buttonPointerDown = false;
    if (this.isOpen) {
      const newTarget = event.composedPath()[0] ?? event.target;
      if (!newTarget) {
        // If we don't know the new target, close the flyout.
        if (this.#checkBeforeClose()) {
          this.isOpen = false;
        }
      }

      // check if this flyout was clicked and don't close it if yes
      const isFlyoutChild = isChild(this, newTarget);
      if (isFlyoutChild) {
        return; // don't close the flyout, because it was a click inside the flyout
      }

      // Check if the flyout button was clicked (or any child, even if it is in any shadow-dom) and don't close the flyout if yes.
      //
      // don't just use `event.target` to avoid cases like with the overflow menu in `otc-toolbar`.  In that case, the overflow menu button
      // is in the shadow root of the toolbar and will generate a click event that is re-targeted to the `otc-toolbar` itself.  If we were
      // to use `event.target`, there is no way to differentiate between an actual click somewhere else on the toolbar and the re-targeted
      // event when clicking on the overflow menu button.
      //
      const isButtonChild = this.#toggleButton && event.composedPath().some(el => el === this.#toggleButton);
      if (isButtonChild) {
        return; // don't close the flyout, because it was a click to the flyout-button
      }

      // Check if we are associated with an `otc-select` element.  Any click inside our associated `otc-select` should not close the flyout.
      // The `otc-select` will handle closing the flyout itself, as necessary.
      const parentSelect = this.getRootNode()?.host;
      const eventSelect = event.composedPath().find(el => el.tagName === 'OTC-SELECT');
      if ((parentSelect?.tagName === 'OTC-SELECT') && (parentSelect === eventSelect)) {
        return;
      }

      // not clicked at flyout nor at the button => close the flyout
      if (this.#checkBeforeClose()) {
        this.isOpen = false;
      }
    }
  }

  #checkBeforeClose() {
    const beforeCloseEvent = new CustomEvent('beforeClose', { bubbles: true, composed: true, cancelable: true });
    const dr = this.dispatchEvent(beforeCloseEvent);
    return dr;
  }

  // ---------- connection of the button & popover

  #detachToggleButton() {
    if (!this.#toggleButton) return;

    if (this.#plainToggleButton) {
      this.#plainToggleButton.removeAttribute('aria-haspopup');
    }

    this.#toggleButton.removeEventListener('pointerdown', this.#boundButtonPointerDownHandler);
    this.#toggleButton.removeEventListener('click', this.#boundButtonClickHandler);
    this.#toggleButton.removeEventListener('keydown', this.#boundButtonKeyDownHandler);
  }

  async #attachToggleButton() {
    this.#findToggleButtons();
    if (!this.#toggleButton) return;

    if (this.#plainToggleButton) {
      this.#plainToggleButton.setAttribute('aria-haspopup', 'dialog');
    }

    this.#toggleButton.addEventListener('pointerdown', this.#boundButtonPointerDownHandler);
    this.#toggleButton.addEventListener('click', this.#boundButtonClickHandler);
    this.#toggleButton.addEventListener('keydown', this.#boundButtonKeyDownHandler);
  }

  #clearAutoUpdate() {
    if (this.#removeMoveHandler) {
      this.#removeMoveHandler();
      this.#removeMoveHandler = undefined;
    }
  }

  #setupAutoUpdate() {
    const button = this.#toggleButton;
    const wrapper = this.#partRefs.flyoutRoot.value;
    if (button && wrapper) {
      this.#removeMoveHandler = PopoverUtilities.autoUpdate(button, wrapper, () => this.#moveFlyout());
    }
  }

  #computeOffsets() {
    // to make the variable overridable in style sheet we could use main slot
    // const element = this.querySelector('[slot="main"]') || this.#partRefs.flyoutRoot.value;
    const element = this.#partRefs.flyoutRoot.value;
    [
      this.#layoutOffset,
      this.#flyoutOffset,
      this.#buttonOffset,
    ] = PopoverUtilities.getComputedPropertyValues(element, [
      '--otc-flyout-layout-offset',
      '--otc-flyout-flyout-offset',
      '--otc-flyout-button-offset',
    ]);
  }

  async #moveFlyout() {
    const wrapper = this.#partRefs.flyoutRoot.value;
    const triangle = this.#partRefs.triangle.value;
    // toggleButton or wrapper can be null due to async update and layout computation
    if (!this.#toggleButton || !wrapper) {
      return;
    }

    // set position style according strategy
    wrapper.style.position = 'fixed';
    triangle.style.position = 'absolute';

    const options = {
      isRTL: this.#rtlController.isRTL,
      openingDirection: this.openingDirection,
      layoutOffset: this.#layoutOffset,
      flyoutOffset: this.#flyoutOffset,
      buttonOffset: this.#buttonOffset,
    };
    await PopoverUtilities.positionFlyout(this.#toggleButton, wrapper, triangle, options);
  }

  #findToggleButtons() {
    let otcButton = null;
    let plainButton = null;

    const { buttonId } = this;
    if (buttonId) {
      let button;

      // Get the element specified by the buttonId property.  In Storybook, when switching from an individual story back to the Docs page,
      // it will simply set the elements of the previous story to hidden before displaying the Docs page.  This means that there are
      // actually duplicate elements on the page with the same id, the hidden one from the previous story and the visible one on the Docs
      // page.  So, instead of using `getElementById`, which would only return the first/hidden element, we will use `querySelectorAll` and
      // filter out the hidden elements.
      const buttons = Array.from(document.querySelectorAll(`[id="${buttonId}"]`));
      if (buttons.length === 1) {
        // If there is only one element, we can use it directly.
        button = buttons.at(0);
      } else {
        // If there is more than one element, we will use the first non-hidden element.
        const visibleButtons = buttons.filter(e => !FocusUtilities.isHidden(e));
        button = visibleButtons.at(0);
      }

      if (!button) {
        // If we couldn't find the element, it may be because we are in the shadow
        // root of another component along with the button we are looking for.
        let rootNode = this.getRootNode();
        while (!button && rootNode) {
          button = rootNode.querySelector(`#${buttonId}`) ?? rootNode.host?.querySelector(`#${buttonId}`);
          rootNode = rootNode.host?.getRootNode();
        }
      }

      if (button) {
        if (button.tagName.startsWith('OTC-')) {
          otcButton = button;
          plainButton = button.shadowRoot.querySelector('button');
        } else {
          plainButton = button;
        }
      }
    }

    this.#otcToggleButton = otcButton;
    this.#plainToggleButton = plainButton;
    this.#toggleButton = otcButton ?? plainButton;
  }
}

customElements.define('otc-flyout', OtcFlyout);

export { OtcFlyout };
//# sourceMappingURL=otcFlyout.js.map
