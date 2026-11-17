/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { nothing, html, svg } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import buttonStyleSheet from '../button/otcButton.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import componentStyleSheet from './otcProgressIcon.scss.js';
import componentJatoStyleSheet from './otcProgressIconJato.scss.js';
import { ElementBase } from '../element-base.js';
import { ThemeController } from '../../controllers/themeController.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';
import { unsafeSVG as o } from '../../../node_modules/lit-html/directives/unsafe-svg.js';

const MODE_INDETERMINATE = 'indeterminate';
const MAX_VALUE = 100;

const STATE_FINISHED = 'finished';
const STATE_ERROR = 'error';

const INDETERMINATE_ARIA = 'indeterminate';
const ERROR_ARIA = 'error';

const ICON_APPEARANCE_LIGHT = 'light';
const ICON_APPEARANCE_DARK = 'dark';

const CF_ICON_SIZE = 42;
const CF_CIRCLE_RADIUS = 18; // Don't let the circle go to the edge of the icon
const CF_MAX_DURATION = 2; // Duration in seconds for progress changing from 0% to 100%

const JATO_ICON_SIZE = 32;
const JATO_CIRCLE_RADIUS = 14;

/**
 * The Otc Progress Icon component is used for progress indication.
 * @prop {string} mode Different style of the progress icon.
 * <br><br>Leave the value empty or unset will show the determinate progress icon and read the numerical state.
 * <br>Set the value to **indeterminate** will show the indeterminate progress icon and Not read a numerical state.
 * @prop {string} state Different states of the progress icon. Leave the value empty or unset will show the progress icon in loading state.
 * <br><br>Set the value to **error** will show the error icon, and the progress icon stops loading. Reads an error state.
 * <br>Set the value to **finished** will show the finished icon, and the progress icon stops loading. Reads as 100%.
 * @prop {string} iconAppearance Specifies the icon appearance.
 * Supported values are: 'light' and 'dark'.
 * @prop {string} from The value in percent. The loading circle will start its animation at this value. Valid from 0 and 100.
 * <br> Use only for default mode.
 * @prop {string} to The new value in percent. The loading circle will animate to this value. Valid from 0 and 100.
 * @prop {string} ariaLabel The aria-label for the progress icon, will be combined with the current value.
 * @prop {string} ariaValueText The current value/state as text. This ignores all modes and states and will be appended to the aria-label.
 * @prop {string} ariaExpanded The optional aria-expanded state of the progress icon. Valid values are 'true', 'false' or empty.
 */
class OtcProgressIcon extends ElementBase {
  #themeController = new ThemeController(this);

  static get styles() {
    return [
      commonStyleSheet,
      buttonStyleSheet,
      iconStyleSheet,
      componentStyleSheet,
      componentJatoStyleSheet,
    ];
  }

  static get properties() {
    const props = {
      mode: { type: String, reflect: true },
      state: { type: String, reflect: true },
      iconAppearance: { type: String, reflect: true },
      from: { type: Number, reflect: true },
      to: { type: Number, reflect: true },
      ariaLabel: { type: String, reflect: true },
      ariaExpanded: { type: String, reflect: true },
      ariaValueText: { type: String, reflect: true },
      _ariaValueNow: { type: String },
      _a11yName: { type: String },
    };
    return { ...ThemeController.properties, ...props };
  }

  constructor() {
    super();
    this.mode = '';
    this.state = '';
    this.iconAppearance = '';
    this.from = 0;
    this.to = MAX_VALUE;
    this.ariaLabel = 'Progress Icon';
    this.ariaExpanded = '';
    this.ariaValueText = '';
    this._ariaValueNow = '';
    this._a11yName = '';
  }

  _getA11yValues() {
    let valueAria = `${this.to}%`;
    let valueNow = `${this.to}`;

    if (this.mode === MODE_INDETERMINATE) {
      valueAria = INDETERMINATE_ARIA;
      valueNow = '';
    }
    if (this.state === STATE_ERROR) {
      valueAria = ERROR_ARIA;
      valueNow = '';
    } else if (this.state === STATE_FINISHED) {
      valueAria = '100%';
      valueNow = '100';
    }

    if (this.ariaValueText) {
      // the explicit value text trumps all modes/states for our a11yName
      valueAria = this.ariaValueText;
    }
    this._a11yName = `${this.ariaLabel} ${valueAria}`;
    this._ariaValueNow = valueNow;
  }

  update(changedProperties) {
    super.update(changedProperties);

    // ensure valid values for from and to
    if (changedProperties.has('from')) {
      const fromVal = Number(this.from);
      if (fromVal < 1) {
        this.from = 0;
      }
      if (fromVal > MAX_VALUE) {
        this.from = MAX_VALUE;
      }
    }
    if (changedProperties.has('to')) {
      const toVal = Number(this.to);
      if (toVal === 0 || toVal > MAX_VALUE) {
        this.to = MAX_VALUE;
      }
      if (toVal < 0) {
        this.to = 0;
      }
    }
    this._getA11yValues();
  }

  render() {
    const classes = {
      'ot-btn': this._themeIsCarbonFiber,
      'ot-icon': this._themeIsCarbonFiber,
      'ot-icon--is-header-icon': this._themeIsCarbonFiber,
      'ot-icon--is-styleable-icon': this._themeIsCarbonFiber,
      'ot-progress-icon': this._themeIsCarbonFiber,
      'ot-progress-icon-jato': !this._themeIsCarbonFiber,
      'ot-progress-icon--is-finished': this.state === STATE_FINISHED,
      'ot-progress-icon--is-error': this.state === STATE_ERROR,
      'ot-icon--appearance-light': this._themeIsCarbonFiber && (this.iconAppearance === ICON_APPEARANCE_LIGHT),
      'ot-icon--appearance-dark': this._themeIsCarbonFiber && (this.iconAppearance === ICON_APPEARANCE_DARK),
    };

    // add additional a11y names as the screenreaders do not handle the progressbar correctly yet
    return html`<button class="${e(classes)}" aria-labelledby="a11yname" aria-expanded="${this.ariaExpanded ? this.ariaExpanded : nothing}"><div role="progressbar" aria-labelledby="a11yname" aria-valuenow="${this._ariaValueNow ? this._ariaValueNow : nothing}" aria-valuetext="${this.ariaValueText ? this.ariaValueText : nothing}">${this._themeIsCarbonFiber ? this.#getSVGMarkupCF() : this.#getSVGMarkupJATO()} <span id="a11yname" class="ot--is-sr-only">${this._a11yName}</span></div></button>`;
  }

  #getSVGMarkupCF() {
    return this.#getSVGMarkup({ 'ot-svg': true, 'ot-svg--header': true }, CF_ICON_SIZE, CF_CIRCLE_RADIUS, '20.0', '20.5');
  }

  #getSVGMarkupJATO() {
    return this.#getSVGMarkup({ 'ot-svg': true, 'ot-svg--progress': true }, JATO_ICON_SIZE, JATO_CIRCLE_RADIUS, '20.0', '20.5');
  }

  #getSVGMarkup(classes, iconSize, circleRadius, focusInnerRadius, focusOuterRadius) {
    const halfIconSize = iconSize / 2;
    return svg`<svg role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${iconSize} ${iconSize}" class="${e(classes)}">${o(this.#getFinishIconMarkup())} ${o(this.#getErrorIconMarkup())}<circle class="ot-progress-icon__background" cx="${halfIconSize}" cy="${halfIconSize}" r="${circleRadius}"/>${o(this.#getAnimationMarkup())} ${this.#getFocusMarkupCF(halfIconSize, focusInnerRadius, focusOuterRadius)}</svg>`;
  }

  #getFinishIconMarkup() {
    if (this.state === STATE_FINISHED) {
      if (this._themeIsCarbonFiber) {
        return `<path class='ot-progress-icon__finish-mark'
          d='M18.219,26.57l-4.926-4.925C13.106,21.458,13,21.203,13,20.938c0-0.131,0.026-0.261,0.076-0.383
          c0.05-0.121,0.124-0.232,0.217-0.325s0.203-0.167,0.324-0.217s0.251-0.076,0.383-0.076c0.265,0,0.52,0.105,0.707,0.293l3.512,3.512
          l8.436-8.437c0.092-0.095,0.203-0.172,0.325-0.224c0.122-0.052,0.253-0.08,0.386-0.081s0.264,0.024,0.387,0.074
          s0.234,0.125,0.328,0.218s0.168,0.205,0.218,0.328c0.05,0.123,0.076,0.255,0.075,0.387c-0.001,0.133-0.029,0.264-0.081,0.386
          s-0.129,0.232-0.224,0.325L18.219,26.57z'></path>`;
      }
      return `<path class='ot-progress-icon__finish-mark' transform="translate(8 8)"
        d='M6.28535 12.4377L1.50052 7.97497C1.30486 7.77944 1.19488 7.5142 1.19479 7.23759C1.19474 
        7.10063 1.22167 6.965 1.27403 6.83844C1.3264 6.71188 1.40319 6.59688 1.5 6.5C1.59681
        6.40312 1.71176 6.32625 1.83828 6.2738C1.9648 6.22134 2.10041 6.19431 2.23737 6.19426C2.51398 
        6.19417 2.7793 6.30396 2.97496 6.49948L6.28535 9.48881L13.242 2.5803C13.3382 2.48071 13.4532
        2.40127 13.5804 2.34662C13.7077 2.29197 13.8445 2.26321 13.983 2.262C14.1214 2.2608 14.2587
        2.28718 14.3869 2.33961C14.515 2.39204 14.6314 2.46947 14.7293 2.56738C14.8273 2.66528 14.9047
        2.78171 14.9571 2.90986C15.0095 3.03801 15.0359 3.17532 15.0347 3.31377C15.0335 3.45223 15.0047
        3.58906 14.9501 3.71628C14.8955 3.8435 14.816 3.95856 14.7164 4.05475L6.28535 12.4377Z'></path>`;
    }
    return '';
  }

  #getErrorIconMarkup() {
    if (this.state === STATE_ERROR) {
      if (this._themeIsCarbonFiber) {
        return `<g class='ot-progress-icon__error-mark'>
          <path d='M21,28.1c0.718,0,1.3-0.582,1.3-1.3c0-0.718-0.582-1.3-1.3-1.3c-0.718,0-1.3,0.582-1.3,1.3S20.282,28.1,21,28.1z'></path>
          <path d='M19.8,22.1v-7.8c0-0.7,0.5-1.3,1.2-1.3s1.3,0.6,1.3,1.3v7.8c0,0.7-0.6,1.3-1.3,1.3 C20.3,23.3,19.8,22.8,19.8,22.1z'></path>
        </g>`;
      }
      return `<g transform="translate(4 4)">
          <circle cx="12" cy="12" r="10" fill="url(#paint0_linear_107_6715)"/>
          <path d="M13 13.0332V7.58904C13 7.15974 12.5519 6.81113 12 6.81113C11.4481 6.81113 11 7.15974 11 7.58904V13.0332C11
           13.4625 11.4481 13.8111 12 13.8111C12.5519 13.8111 13 13.4625 13 13.0332Z" fill="white" style="fill:white;fill-opacity:1;"/>
          <circle cx="1.18887" cy="1.18887" r="1.18887" transform="matrix(1 0 0 -1 10.8115 18)" fill="white" 
          style="fill:white;fill-opacity:1;"/>
          <defs>
            <linearGradient id="paint0_linear_107_6715" x1="-0.857143" y1="2.06694" x2="25.5244" y2="20.9474" 
                gradientUnits="userSpaceOnUse">
              <stop stop-color="#F16E00" style="stop-color:#F16E00;stop-color:color(display-p3 0.9451 0.4314 0.0000);stop-opacity:1;"/>
              <stop offset="1" stop-color="#DC198E" style="stop-color:#DC198E;stop-color:color(display-p3 0.8627 0.0980 0.5569);
                stop-opacity:1;"/>
            </linearGradient>
          </defs>
      </g>`;
    }
    return '';
  }

  #getFocusMarkupCF(halfIconSize, focusInnerRadius, focusOuterRadius) {
    if (this._themeIsCarbonFiber) {
      return svg`<circle class="ot-progress-icon__focus-inner" fill="none" stroke="none" cx="${halfIconSize}" cy="${halfIconSize}" r="${focusInnerRadius}"><circle class="ot-progress-icon__focus-outer" fill="none" stroke="none" cx="${halfIconSize}" cy="${halfIconSize}" r="${focusOuterRadius}">`;
    }
    return nothing;
  }

  #getAnimationMarkup() {
    let style;
    let animateMarkup;
    let circleRadius;
    let halfIconSize;

    if (this._themeIsCarbonFiber) {
      circleRadius = CF_CIRCLE_RADIUS;
      halfIconSize = CF_ICON_SIZE / 2;
    } else {
      circleRadius = JATO_CIRCLE_RADIUS;
      halfIconSize = JATO_ICON_SIZE / 2;
    }
    const circumference = 2 * Math.PI * circleRadius;

    if (this.mode === MODE_INDETERMINATE) {
      const strokeDashArrayStyle = (this.state !== STATE_FINISHED && this.state !== STATE_ERROR) ? circumference / 8 : 'none';
      style = `stroke-dasharray: ${strokeDashArrayStyle};`;
      animateMarkup = `
        <animateTransform
          attributeName="transform"
          begin="0s"
          fill="freeze"
          type="${this.state !== STATE_FINISHED && this.state !== STATE_ERROR ? 'rotate' : ''}"
          from="0"
          to="360"
          dur="3s"
          repeatCount="indefinite"
        ></animateTransform>`;
    } else {
      const diff = Math.abs(this.to - this.from);
      const duration = CF_MAX_DURATION * (diff / 100);
      const fromValue = `${this.#percentageToCircumference(circumference, this.from)} ${circumference}`;
      const toValue = `${this.#percentageToCircumference(circumference, this.to)} ${circumference}`;
      const values = `${fromValue};${toValue}`;
      const attributeName = (this.state !== STATE_FINISHED && this.state !== STATE_ERROR) ? 'stroke-dasharray' : '';

      style = 'transform: rotate(-90deg);';
      animateMarkup = `
        <animate
          attributeName="${attributeName}"
          begin="0s"
          fill="freeze"
          dur="${duration}s"
          values="${values}"
          calcMode="linear"
        ></animate>/`;
    }

    return `
      <circle
        class="ot-progress-icon__rotating"
        style="${style}"
        cx="${halfIconSize}"
        cy="${halfIconSize}"
        r="${circleRadius}"
      >
        ${animateMarkup}
      </circle>`;
  }

  #percentageToCircumference(circumFerence, percentage) {
    return Math.round(circumFerence * (percentage / 100));
  }
}

if (!customElements.get('otc-progress-icon')) {
  customElements.define('otc-progress-icon', OtcProgressIcon);
}

export { OtcProgressIcon };
//# sourceMappingURL=otcProgressIcon.js.map
