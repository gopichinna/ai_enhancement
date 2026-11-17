import { html, nothing } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import iconJatoStyleSheet from '../../styles/icons_jato.scss.js';
import { ElementBase } from '../element-base.js';
import { shouldRenderIcon, getSVGForIconWithOptions, getClassesForIcon } from '../../utilities/render-utilities.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Icon component is a small graphical element.
 * @prop {string} ariaLabel The `aria-label` associated with an interactive avatar component.
 * @prop {boolean} disabled The disabled state of the icon.
 * @prop {boolean} disableEffects Disables effects such as hover and active when using a smart icon.
 * @prop {boolean} emphasis Emphasizes the icon.<br>This can be used to advertise a default action.
 * @prop {boolean} isPresentation Indicates whether this icon is strictly visual and should have the role `presentation`.<br>The default
 * role is `img`.<br>With role="img" you need some text being specified with ariaLabel. Wth role="presentation" you should not add an
 * ariaLabel.
 * @prop {boolean} menuOpen Indicates that the icon is associated with a menu that is currently open.
 * @prop {boolean} toggled Toggled/On state of the icon.
 * @prop {string} size The size of the SVG.
 * @prop {string} svg The `svg` markup.
 * @prop {string} type The type of icon, such as `primary`, `secondary`, `subtle`, `status`, `raw` or `link`.
 * @prop {boolean} mirrorIfRtl Indicates that the icon should be horizontally mirrored if dir="rtl" is detected
 * @prop {string} viewBox The viewBox of the SVG.
 * @prop {string} icon A string containing the icon bundle and icon name, e.g. action:action_cancel32.
 * <br>**DEPRECATED:** Use the `svg` property to set the inline SVG element.
 * @prop {string} iconAppearance Specifies the icon appearance.  Not all icon categories support all or even the same icon appearances.
 * <br>**DEPRECATED:** Use the `svg` property to set the inline SVG element.
 * @prop {string} image A data URI representing an image.
 * <br>**DEPRECATED:** Use the `svg` property to set the inline SVG element.
 */
class OtcIcon extends ElementBase {
  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
      iconJatoStyleSheet,
    ];
  }

  static get properties() {
    return {
      svg: {
        type: String,
        reflect: true,
      },
      viewBox: {
        type: String,
        reflect: true,
      },
      size: {
        type: String,
        reflect: true,
      },
      type: {
        type: String,
        reflect: true,
      },
      ariaLabel: {
        type: String,
        reflect: true,
      },
      disabled: {
        type: Boolean,
        reflect: true,
      },
      disableEffects: {
        type: Boolean,
        reflect: true,
      },
      emphasis: {
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
      isPresentation: {
        type: Boolean,
        reflect: true,
      },
      menuOpen: {
        type: Boolean,
        reflect: true,
      },
      toggled: {
        type: Boolean,
        reflect: true,
      },
      mirrorIfRtl: {
        type: Boolean,
        reflect: true,
      },
    };
  }

  constructor() {
    super();

    this.svg = '';
    this.ariaLabel = '';
    this.disabled = false;
    this.disableEffects = false;
    this.size = ''; // if not set, width and height will be 100%
    this.type = 'subtle'; // can be primary, secondary, subtle or link for using a specific set of colors
    this.emphasis = false; // for jato: if true, the primary state will be used
    this.icon = '';
    this.iconAppearance = '';
    this.image = '';
    this.isPresentation = false;
    this.menuOpen = false; // for jato: if true, ot-icon--is-active is added
    this.toggled = false;
    this.mirrorIfRtl = false;
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }
  }

  #getIconHTML() {
    if (shouldRenderIcon(this)) {
      return getSVGForIconWithOptions({ iconKey: this.icon, image: this.image });
    }
    return html``;
  }

  #getTypeSpecificClasses() {
    return getClassesForIcon(this);
  }

  #adjustSVG(svg) {
    const isIconV2Svg = svg.classList.contains('csui-icon-v2');
    if (isIconV2Svg) {
      this.#adjustV2Icon(svg);
    } else {
      const isSmartIconSvg = svg.classList.contains('ot-svg');
      if (isSmartIconSvg) {
        this.#adjustSmartIcon(svg);
      }
    }

    svg.setAttribute('role', this.isPresentation ? 'presentation' : 'img');
    if (this.ariaLabel.length > 0 && !this.isPresentation) {
      svg.setAttribute('aria-label', this.ariaLabel);
    }
    if (this.title?.length > 0) {
      svg.setAttribute('title', this.title);
    }
    svg.removeAttribute('id');
    svg.removeAttribute('version');
    svg.removeAttribute('style');
    if (this.viewBox) {
      svg.setAttribute('viewBox', this.viewBox);
    }
    if (this.type === 'raw' || this.type === 'status') {
      svg.classList.add('ot-icon-raw');
    } else {
      svg.classList.add('ot-icon-jato');
    }
    if (this.mirrorIfRtl) {
      svg.classList.add('ot-icon--is-mirrored-if-rtl');
    }
    if (!this.disableEffects) {
      svg.classList.add('ot-icon--is-reactive');
    }

    // emphasis means showing the icon as with type='primary'
    const iconType = this.emphasis ? 'primary' : this.type;
    switch (iconType) {
      case 'primary':
        svg.classList.add('ot-icon--is-primary');
        break;
      case 'secondary':
        svg.classList.add('ot-icon--is-secondary');
        break;
      case 'link':
        svg.classList.add('ot-icon--is-link');
        break;
      case 'status':
      case 'raw':
        svg.classList.add('ot-icon--is-status');
        break;
      default:
        // default is subtle
        svg.classList.add('ot-icon--is-subtle');
    }

    if (this.size) {
      svg.setAttribute('width', this.size);
      svg.setAttribute('height', this.size);
    } else if (this.type === 'status') {
      // if no explicit size is set, use 16px for status icons
      svg.setAttribute('width', 16);
      svg.setAttribute('height', 16);
    } else {
      // if no explicit size is set, use 100%
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
    }

    if (this.type === 'raw' || this.type === 'status') {
      // don't add other classes or properties if type is raw or status - let the svg being displayed as it is
      return;
    }

    if (this.menuOpen) {
      svg.classList.add('ot-icon--is-active');
    }
    if (this.toggled) {
      svg.classList.add('ot-icon--is-toggled');
    }
    if (this.disabled) {
      svg.classList.add('ot-icon--is-disabled');
    }

    svg.setAttribute('part', 'ot-icon');
    const childElements = svg.querySelectorAll('path, circle');
    childElements.forEach((el) => {
      // expose child element as part to let it be accessible from light dom
      el.setAttribute('part', 'ot-icon-path');

      // remove any fill property
      el.removeAttribute('fill');

      // remove all fill styles
      const styleObj = el.style;
      // eslint-disable-next-line no-plusplus
      for (let i = styleObj.length; i--;) {
        const nameString = styleObj[i];
        if (nameString === 'fill') {
          styleObj.removeProperty(nameString);
        }
      }
    });
  }

  #adjustSvgForJato(svg, circleSelectors, viewBoxReplacements) {
    // remove circles for state and focus
    for (const selector of circleSelectors) {
      const el = svg.querySelector(selector);
      if (el) {
        el.remove();
      }
    }
    // remove classes at svg level
    svg.removeAttribute('class');
    const currentViewBox = svg.getAttribute('viewBox');
    let viewBoxForZoom = currentViewBox;
    const viewBoxReplacement = viewBoxReplacements[currentViewBox];
    if (viewBoxReplacement) {
      viewBoxForZoom = viewBoxReplacement;
    }
    svg.setAttribute('viewBox', viewBoxForZoom);
  }

  #adjustSmartIcon(svg) {
    const circleSelectors = ['circle.ot-state', 'circle.ot-focus'];
    const viewBoxReplacements = {
      '0 0 32 32': '7 7 18 18',
      '0 0 42 42': '10 10 22 22',
    };
    this.#adjustSvgForJato(svg, circleSelectors, viewBoxReplacements);
  }

  #adjustV2Icon(svg) {
    const circleSelectors = ['circle.csui-icon-v2-state', 'circle.csui-icon-v2-focus'];
    const viewBoxReplacements = {
      '0 0 32 32': '7 7 18 18',
      '0 0 42 42': '10 10 22 22',
    };
    this.#adjustSvgForJato(svg, circleSelectors, viewBoxReplacements);
  }

  #getSVGElement() {
    if (!this.svg) {
      return nothing;
    }
    const startOfSvg = this.svg.substring(0, 4);
    if (startOfSvg.toLowerCase() !== '<svg') { // check for unwanted tags
      return nothing;
    }
    const frag = document.createRange().createContextualFragment(`${this.svg}`);
    const svg = frag.querySelector('svg');
    if (!svg) {
      return nothing;
    }
    this.#adjustSVG(svg);
    return frag;
  }

  render() {
    // check for legacy smart icon name specified in icon prop
    if (this.icon || this.image) {
      const classes = this.#getTypeSpecificClasses();
      if (this.mirrorIfRtl) {
        classes['ot-icon--is-mirrored-if-rtl'] = true;
      }

      return html`<div aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" class="${e(classes)}" role="${this.isPresentation ? 'presentation' : 'img'}">${this.#getIconHTML()}</div>`;
    }

    // render jato icon if no icon property is set: expect the svg in the slot
    return html`${this.#getSVGElement()}`;
  }
}

customElements.define('otc-icon', OtcIcon);

// Accessing the exposed parts from the svg is only possible from light dom. Instead, putting the css rules into a separate
// css file, that would have to be loaded by the application, create a constructable style sheet that is loaded by code
// once this web component file is loaded.
const sheet = new CSSStyleSheet();
sheet.insertRule('*:hover > otc-icon[type=primary]:not([disableEffects])::part(ot-icon-path) { fill:'
                 + ' var(--jatx-otc-icon-content-color-primary-hover); }');
sheet.insertRule('*:hover > otc-icon[type=secondary]:not([disableEffects])::part(ot-icon-path) { fill:'
                 + ' var(--jatx-otc-icon-content-color-secondary-hover); }');
sheet.insertRule('*:hover > otc-icon[type=subtle]:not([disableEffects])::part(ot-icon-path) { fill:'
                 + ' var(--jatx-otc-icon-content-color-tertiary-hover); }');
sheet.insertRule('*:hover > otc-icon[type=subtle][emphasis]:not([disableEffects])::part(ot-icon-path) { fill:'
                 + ' var(--jatx-otc-icon-content-color-primary-hover); }');
sheet.insertRule('*:hover > otc-icon[type=link]:not([disableEffects])::part(ot-icon-path) { fill:'
                 + ' var(--jato-cta-links-text-color-hover); }');
sheet.insertRule('*:active > otc-icon[type=primary]:not([disableEffects])::part(ot-icon-path), *:hover:active >'
                 + ' otc-icon[type=primary]:not([disableEffects])::part(ot-icon-path) { fill:'
                 + ' var(--jatx-otc-icon-content-color-primary); }');
sheet.insertRule('*:active > otc-icon[type=secondary]:not([disableEffects])::part(ot-icon-path), *:hover:active >'
                 + ' otc-icon[type=secondary]:not([disableEffects])::part(ot-icon-path) { fill:'
                 + ' var(--jatx-otc-icon-content-color-secondary-active); }');
sheet.insertRule('*:active > otc-icon[type=subtle]:not([disableEffects])::part(ot-icon-path), *:hover:active >'
                 + ' otc-icon[type=subtle]:not([disableEffects])::part(ot-icon-path) { fill:'
                 + ' var(--jatx-otc-icon-content-color-tertiary); }');
sheet.insertRule('*:active > otc-icon[type=link]:not([disableEffects])::part(ot-icon-path), *:hover:active >'
                 + ' otc-icon[type=link]:not([disableEffects])::part(ot-icon-path) { fill:'
                 + ' var(--jato-cta-links-text-color-active); }');
document.adoptedStyleSheets.push(sheet);

export { OtcIcon };
//# sourceMappingURL=otcIcon.js.map
