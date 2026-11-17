import { html, nothing } from 'lit';
import { actionChevronSmallDown } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import buttonStyleSheet from './otcButton.scss.js';
import buttonJatoStyleSheet from './otcButtonJato.scss.js';
import { ElementBase } from '../element-base.js';
import { Interactive } from '../interactive.js';
import { ThemeController } from '../../controllers/themeController.js';
import { shouldRenderIcon, getSVGForIconWithOptions, getJatoSVGFromSmartIconRepository, getClassesForIcon } from '../../utilities/render-utilities.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

const DEFAULT_OTC_BUTTON_TYPE = 'subtle';

/**
 * The Button component represents a clickable button.
 * The otc-button might need additional aria attributes to implement correct a11y in some use cases.
 * To facilitate this we observe the otc-button for attributes starting with "aria" (without the -, so eg. "ariahaspopup") and map these
 * into the shadow-dom with corrected names. Not having the actual aria attributes on the host avoids issues with a11y checkers and tools.
 * @prop {boolean} dark The dark state of the button.
 * @prop {boolean} disabled The disabled state of the button.
 * @prop {boolean} emphasis Emphasizes the icon (if specified).  This can be used to advertise a default action.
 * @prop {boolean} headerItem Indicates that the button is part of a Header Bar.
 * @prop {boolean} menuOpen Indicates that the button is associated with a menu that is currently open.
 * @prop {boolean} signIn Styles the button as a "Sign In" button.
 * @prop {boolean} toggled The toggled state of the icon (if specified).
 * @prop {string} ariaLabel The aria-label of the button.
 * @prop {string} icon A string containing the icon bundle and icon name, e.g. action:action_cancel32.
 * @prop {string} iconAppearance Specifies the icon appearance (theme) of the button.
 * @prop {string} image A data URI representing an image.<br>**Note:** The `image` property is only used in combination with `headerItem`.
 * @prop {boolean} mirrorIconIfRtl Mirror the icon (specified by the icon attribute) in RTL mode if this attribute is specified.
 * @prop {string} size The size of button.  `micro` and `mini` apply to primary and secondary buttons.  `small` applies to `inline` buttons.
 * @prop {string} type The type of button. When using button in a form, the type of button can be set to submit, reset or button.
 * The button will behave like a native button with type="submit", type="reset" or type="button".
 * <br>**Note:** - When setting type to submit. The button will look like a primary button.
 * <br> - When setting type to reset. The button will look like a secondary button.
 * <br> - When setting type to button. The button will look like a button without specific styling.
 * @slot count Defines an `otc-badge` that will be overlaid onto the button icon.
 * @slot unnamed Defines the label of the button.<br>**Note:** It is strongly recommended that you only use text or \`otc-icon\` in
 * order to preserve the intended design.
 */
class OtcButton extends Interactive(ElementBase) {
  #ariaAttributesMutationObserver = new MutationObserver(this.#handleAriaAttributeMutation.bind(this));

  #themeController = new ThemeController(this);

  #badgeInSlot;

  #iconInSlot;

  #avatarInSlot;

  #countSlotRef = e();

  #defaultSlotRef = e();

  #haveOtcIconAddedToSlot;

  #slottedIconWasWithoutDisabledEffects;

  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
      buttonStyleSheet,
      buttonJatoStyleSheet,
    ];
  }

  static get formAssociated() {
    return true;
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }
    this.#ariaAttributesMutationObserver.observe(this, { attributes: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#ariaAttributesMutationObserver.disconnect();
  }

  static get properties() {
    const props = {
      ariaLabel: {
        type: String,
        reflect: true,
      },
      dark: {
        type: Boolean,
        reflect: true,
      },
      disabled: {
        type: Boolean,
        reflect: true,
      },
      emphasis: {
        type: Boolean,
        reflect: true,
      },
      headerItem: {
        type: Boolean,
        reflect: true,
      },
      icon: {
        type: String,
        reflect: true,
      },
      iconAppearance: {
        type: String,
        reflect: true,
      },
      image: {
        type: String,
        reflect: true,
      },
      menuOpen: {
        type: Boolean,
        reflect: true,
      },
      signIn: {
        type: Boolean,
        reflect: true,
      },
      size: {
        type: String,
        reflect: true,
      },
      toggled: {
        type: Boolean,
        reflect: true,
      },
      type: {
        type: String,
        reflect: true,
      },
      mirrorIconIfRtl: {
        type: Boolean,
        reflect: true,
      },
    };

    return { ...ThemeController.properties, ...props };
  }

  constructor() {
    super();

    this.#haveOtcIconAddedToSlot = false;
    this.internals = this.attachInternals();

    this.ariaLabel = '';
    this.disabled = false;
    this.emphasis = false;
    this.toggled = false;
    this.menuOpen = null; // null means the button is not used to expand or collapse => no aria-expanded is added
    this.size = 'regular';
    this.type = DEFAULT_OTC_BUTTON_TYPE;

    // properties exclusively used to render old (pre jato) buttons
    this.dark = false;
    this.headerItem = false;
    this.icon = '';
    this.iconAppearance = '';
    this.image = '';
    this.signIn = false;
    this.mirrorIconIfRtl = false;

    this.addEventListener('click', this._handleClick);
  }

  /**
   * Get the native button element. This method is used by the interactive interface.
   * @returns {*|null}
   * @internal
   */
  get innerInteractiveElement() {
    return this._button;
  }

  get _button() {
    return this.shadowRoot?.querySelector('button');
  }

  get _slottedNodes() {
    let nodes = [];
    if (!this._button) {
      return nodes;
    }
    if (!this.#defaultSlotRef.value) {
      return nodes;
    }

    nodes = this.#defaultSlotRef.value.assignedNodes();
    // Remove any all-whitespace text nodes.
    return nodes.filter(node => (node.nodeType === HTMLElement.ELEMENT_NODE && node.nodeName !== 'SLOT')
                                || (node.nodeType === HTMLElement.TEXT_NODE && node.nodeValue.trim().length));
  }

  firstUpdated() {
    // reflect the initial aria attributes to the native button
    this.getAttributeNames().forEach((attrName) => {
      this.#handleAriaAttr(attrName);
    });
  }

  async updated() {
    // Set the border-radius of the web component to match that of the inner button.  Otherwise, there would be an area of whitespace
    // outside the inner button that would still be clickable.
    if (this._button) {
      const borderRadius = window.getComputedStyle(this._button)['border-radius'];
      this.style.borderRadius = borderRadius;
    }
    if (this.#haveOtcIconAddedToSlot) {
      this.updateComplete.then(() => {
        // If switching theme from cf to jato and removing the component from dom it can
        // happen that this.#haveOtcIconAddedToSlot is true, but component is already disconnected.
        // If the component is disconnected this.#defaultSlotRef.value can be undefined.
        if (this.isConnected) {
          this.#iconInSlot = this.#defaultSlotRef.value.querySelector('otc-icon');
          if (this.#iconInSlot) {
            this.#adjustIconInSlot();
          }
        }
      });
    }

    if (this.#badgeInSlot) {
      await this.#adjustBadgeInSlot();
    }
    if (this.#iconInSlot) {
      await this.#adjustIconInSlot();
    }
    if (this.#avatarInSlot) {
      await this.#adjustAvatarInSlot();
    }
  }

  // returns the child nodes of otc-button in light dom, which is needed to evaluate children in slot before
  // actually have rendered
  get _childNodes() {
    const nodes = Array.from(this.childNodes);
    // Remove any all-whitespace text nodes.
    return nodes.filter(node => (node.nodeType === HTMLElement.ELEMENT_NODE && node.nodeName !== 'SLOT')
                                || (node.nodeType === HTMLElement.TEXT_NODE && node.nodeValue.trim().length));
  }

  #isLeadingIcon() {
    const slottedNodes = this._childNodes;
    return this.type !== 'inline'
           && (slottedNodes?.at(0)?.nodeName === 'OTC-ICON')
           && (slottedNodes?.at(1)?.nodeName === '#text');
  }

  #isTrailingIcon() {
    const slottedNodes = this._childNodes;
    return this.type !== 'inline'
           && (slottedNodes?.at(-1)?.nodeName === 'OTC-ICON')
           && (slottedNodes?.at(-2)?.nodeName === '#text');
  }

  #isInlineTextBulkSelection() {
    if (!this.#countSlotRef.value) {
      return false;
    }
    const countElement = this.#countSlotRef.value.assignedElements();
    return this.type === 'inline'
           && (countElement.length > 0)
           && (this._slottedNodes.at(-1)?.nodeName === '#text');
  }

  #isInlineTextDropdown() {
    const slottedNodes = this._childNodes;
    return this.type === 'inline'
           && (slottedNodes?.at(-1)?.nodeName === 'OTC-ICON')
           && (slottedNodes?.at(-2)?.nodeName === '#text');
  }

  #isIconOnly() {
    if (this.#haveOtcIconAddedToSlot) {
      return true;
    }
    return (this._childNodes.filter(node => node.slot !== 'count').length === 1)
           && this._childNodes.at(0).nodeName !== '#text'
           && this._childNodes.at(0)?.matches('otc-icon, otc-avatar, img, svg');
  }

  _handleClick(event) {
    // If the button is disabled, then ignore the event and stop it from propagating.
    // Else if the button is integrated in a form tag, then trigger submit to the form.
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    } else if (this.internals.form && this.type === 'submit') {
      this.internals.form.requestSubmit();
    } else if (this.internals.form && this.type === 'reset') {
      this.internals.form.reset();
    }
  }

  async #adjustBadgeInSlot() {
    if (!this.#badgeInSlot) {
      return;
    }
    await this.#badgeInSlot.updateComplete;

    this.#badgeInSlot.disabled = this.disabled;
    this.#setBadgeSize();
  }

  #setBadgeSize() {
    const badge = this.#badgeInSlot;
    let badgeSize;
    switch (this.size) {
      case 'small':
      case 'large':
        badgeSize = this.size;
        break;
      default:
        badgeSize = 'regular';
    }
    badge.setAttribute('size', badgeSize);
  }

  async #adjustIconInSlot() {
    const icon = this.#iconInSlot;

    await icon.updateComplete;

    if (this.#isOldButton()) {
      this.#slottedIconWasWithoutDisabledEffects = !icon.disableEffects;
      // If in carbonfiber mode an icon is in the slot, it must be treated as decorative only, because in this case
      // otc-button would draw a smart icon by itself and does not expect one in the slot
      icon.setAttribute('disableEffects', '');
      return;
    }
    if (this.#slottedIconWasWithoutDisabledEffects) {
      icon.removeAttribute('disableEffects');
    }

    this.#synchronizeSlottedIconAttributes(icon);
  }

  #synchronizeSlottedIconAttributes(icon) {
    switch (this.type) {
      case 'primary':
      case 'secondary':
      case 'subtle':
      case 'link':
      case 'status':
        icon.setAttribute('type', this.type);
        break;
      case 'primaryDropdown':
        icon.setAttribute('type', 'primary');
        break;
      case 'secondaryDropdown':
        icon.setAttribute('type', 'secondary');
        break;
      case 'subtleDropdown':
        icon.setAttribute('type', 'subtle');
        break;
      case 'linkDropdown':
        icon.setAttribute('type', 'link');
        break;
      default:
        icon.setAttribute('type', 'subtle');
    }

    const flags = ['disabled', 'toggled', 'emphasis', 'menuOpen'];
    for (const flag of flags) {
      if (this[flag]) {
        icon.setAttribute(flag, '');
      } else {
        icon.removeAttribute(flag);
      }
    }

    icon.setAttribute('isPresentation', ''); // image inside button is always for presentation only

    // set size on icon only if no size is explicitly set at the otc-icon
    if (!icon.getAttribute('size')) {
      icon.setAttribute('size', 16);
    }
  }

  async #adjustAvatarInSlot() {
    const avatar = this.#avatarInSlot;

    await avatar.updateComplete;

    const flags = ['disabled', 'toggled', 'emphasis', 'menuOpen'];
    for (const flag of flags) {
      if (this[flag]) {
        avatar.setAttribute(flag, '');
      } else {
        avatar.removeAttribute(flag);
      }
    }

    // set size on icon only if no size is explicitly set at the otc-avatar
    if (!avatar.getAttribute('size')) {
      let avatarSize;
      switch (this.size) {
        case 'small':
          avatarSize = 24;
          break;
        case 'large':
          avatarSize = 40;
          break;
        default:
          avatarSize = 32;
      }
      avatar.setAttribute('size', avatarSize);
    }
  }

  async #handleSlotChange() {
    const slottedNodes = this._slottedNodes;

    let haveOtcIcon = false;
    let haveOtcBadge = false;
    let haveOtcAvatar = false;
    for (const node of slottedNodes) {
      if (!haveOtcIcon && node.nodeName === 'OTC-ICON') {
        haveOtcIcon = true;
        this.#iconInSlot = node;
        // eslint-disable-next-line no-await-in-loop
        await this.#adjustIconInSlot();
      }
      if (!haveOtcAvatar && node.nodeName === 'OTC-AVATAR') {
        haveOtcAvatar = true;
        this.#avatarInSlot = node;
        // eslint-disable-next-line no-await-in-loop
        await this.#adjustAvatarInSlot();
      }
      if (!haveOtcBadge && node.nodeName === 'OTC-BADGE') {
        haveOtcBadge = true;
        this.#badgeInSlot = node;
        // eslint-disable-next-line no-await-in-loop
        await this.#adjustBadgeInSlot();
      }
    }
    if (!haveOtcIcon) {
      this.#iconInSlot = undefined;
    }
    if (!haveOtcBadge) {
      this.#badgeInSlot = undefined;
    }
    if (!haveOtcAvatar) {
      this.#avatarInSlot = undefined;
    }
  }

  #handleAriaAttributeMutation(mutationList) {
    for (const mutation of mutationList) {
      if (mutation.type === 'attributes') {
        this.#handleAriaAttr(mutation.attributeName);
      }
    }
  }

  // copy the ariaXYZ attributes to the native element, using the appropriate name
  #handleAriaAttr(hostAttrName) {
    // we do not handle actual "aria-XYZ" attributes
    if (!hostAttrName.startsWith('aria') || hostAttrName.startsWith('aria-')) {
      return;
    }
    const ariaName = `aria-${hostAttrName.substring(4)}`;
    const currentlyExists = this.hasAttribute(hostAttrName);
    if (currentlyExists) {
      const currentValue = this.getAttribute(hostAttrName);
      this._button.setAttribute(ariaName, currentValue);
    } else {
      this._button.removeAttribute(ariaName);
    }
  }

  #getIconHTML() {
    if (this._themeIsCarbonFiber && shouldRenderIcon(this)) {
      return getSVGForIconWithOptions({ iconKey: this.icon, image: this.image }, { role: 'presentation' });
    }
    return html``;
  }

  #getOtcIconHTML() {
    this.#haveOtcIconAddedToSlot = false;
    if (this._themeIsCarbonFiber) {
      return html``;
    }
    // theme is jato
    if (this.icon) {
      const svg = getJatoSVGFromSmartIconRepository(this.icon);
      this.#haveOtcIconAddedToSlot = true;
      return html`<otc-icon isPresentation size="16" ?disabled="${this.disabled}" ?emphasis="${this.emphasis}" ?menuopen="${this.menuOpen}" type="${this.#getButtonType()}" svg="${svg}"></otc-icon>`;
    }
    return html``;
  }

  #getTypeSpecificClassesOld() {
    const classes = {
      'ot-btn': true,
      'ot--is-width-100': true,
      'ot--is-height-100': shouldRenderIcon(this),
      'ot-btn--is-dark': this.dark,
      'ot-btn--is-menu-open': this.menuOpen, // The menuOpen property is controlled by otcMenu.js
      'ot-btn--reduced-padding-end': this.#isTrailingIcon(),
      'ot-btn--reduced-padding-start': this.#isLeadingIcon(),
      'ot-btn--remove-padding': this.#isIconOnly(),
      'ot-pl-1--is-half-step': this.#isIconOnly(),
      'ot-pr-1--is-half-step': this.#isIconOnly(),
      'ot-btn--is-sign-in': this.signIn,
      'ot-btn--is-micro': this.size === 'micro',
      'ot-btn--is-mini': this.size === 'mini',
      'ot-btn--is-small': this.size === 'small',
      'ot-btn--is-inline-text': this.type === 'inline',
      'ot-btn--is-inline-text-bulk-selection': this.#isInlineTextBulkSelection(),
      'ot-btn--is-inline-text-dropdown': this.#isInlineTextDropdown(),
      'ot-btn--is-primary': this.type === 'primary' || this.type === 'submit',
      'ot-btn--is-secondary': this.type === 'secondary' || this.type === 'reset',
    };
    return { ...classes, ...getClassesForIcon(this) };
  }

  #getTypeSpecificClasses() {
    return {
      'ot-btn-jato': true,
      'ot-btn-jato--is-primary': this.type === 'primary' || this.type === 'primaryDropdown'
                                 || (this.emphasis && this.type !== 'more') || this.type === 'submit',
      'ot-btn-jato--is-secondary': !this.emphasis && (this.type === 'secondary' || this.type === 'secondaryDropdown'),
      'ot-btn-jato--is-subtle': !this.emphasis
                                && (this.type === 'inline' || this.type === 'subtle'
                                    || this.type === 'subtleDropdown' || this.type === 'status'),
      'ot-btn-jato--is-link': !this.emphasis && (this.type === 'link' || this.type === 'linkDropdown'),
      'ot-btn-jato--is-more': this.type === 'more',
      'ot-btn-jato--is-avatar': !this.emphasis && (this.type === 'avatar' || this.type === 'avatarDropdown'),
      'ot-btn-jato--is-dropdown': this.#isDropdown(),
      'ot-btn-jato--is-small': this.type !== 'more' && (this.size === 'small' || this.size === 'mini'
                                                        || this.size === 'micro' || this.type === 'status'),
      'ot-btn-jato--is-large': !(this.type === 'more' || this.type === 'status') && this.size === 'large',
      'ot-btn-jato--is-icon-only': this.#isIconOnly(),
      'ot-btn-jato--is-active': this.menuOpen,
      'ot-btn-jato--is-toggled': !(this.type === 'more' || this.type === 'status') && this.toggled,
    };
  }

  #isOldButton() {
    return this._themeIsCarbonFiber || this.image || this.dark || this.headerItem || this.signIn;
  }

  #isDropdown() {
    return this.type === 'primaryDropdown' || this.type === 'secondaryDropdown' || this.type === 'subtleDropdown'
           || this.type === 'linkDropdown' || this.type === 'avatarDropdown';
  }

  #getChevronTemplate() {
    if (this.#isDropdown()) {
      return html`<slot name="chevron"><otc-icon isPresentation size="16" ?disabled="${this.disabled}" ?emphasis="${this.emphasis}" ?menuopen="${this.menuOpen}" type="${this.#getButtonType()}" svg="${actionChevronSmallDown}"></otc-icon></slot>`;
    }
    return html``;
  }

  #getButtonType() {
    let buttonType;
    switch (this.type) {
      case 'primaryDropdown':
        buttonType = 'primary';
        break;
      case 'secondaryDropdown':
        buttonType = 'secondary';
        break;
      case 'linkDropdown':
        buttonType = 'link';
        break;
      case 'avatarDropdown':
        buttonType = 'avatar';
        break;
      default:
        buttonType = 'subtle';
        break;
    }
    return buttonType;
  }

  render() {
    let classes;
    const otcIconHtml = this.#getOtcIconHTML();
    if (this.#isOldButton()) {
      if (this.signIn && this.type !== '') {
        // set the type to nothing, but only if not already done (prevents recursion)
        this.type = '';
      }
      classes = this.#getTypeSpecificClassesOld();
    } else {
      if (this.type === '') {
        this.type = DEFAULT_OTC_BUTTON_TYPE;
      }
      if (this.type === 'status') {
        this.setAttribute('size', 'small');
      }
      classes = this.#getTypeSpecificClasses();
    }
    return html`<div class="ot-btn__container"><button ?disabled="${this.disabled}" class="${e$1(classes)}" aria-expanded="${this.menuOpen ?? nothing}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}">${this.#getIconHTML()}<slot ${n(this.#defaultSlotRef)} @slotchange="${this.#handleSlotChange}">${otcIconHtml}</slot>${this.#getChevronTemplate()}<slot ${n(this.#countSlotRef)} name="count"></slot></button></div>`;
  }
}

customElements.define('otc-button', OtcButton);

export { OtcButton };
//# sourceMappingURL=otcButton.js.map
