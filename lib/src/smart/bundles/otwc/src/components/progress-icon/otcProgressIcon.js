/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import buttonStyleSheet from '../button/otcButton.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import componentStyleSheet from './otcProgressIcon.scss.js';
import { ElementBase } from '../element-base.js';
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

const ICON_SIZE = 42;
const HALF_ICON_SIZE = ICON_SIZE / 2;
const CIRCLE_RADIUS = 18; // Don't let the circle go to the edge of the icon
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
const MAX_DURATION = 2; // Duration in seconds for progress changing from 0% to 100%

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
  static get styles() {
    return [
      commonStyleSheet,
      buttonStyleSheet,
      iconStyleSheet,
      componentStyleSheet,
    ];
  }

  static get properties() {
    return {
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
      'ot-btn': true,
      'ot-icon': true,
      'ot-icon--is-header-icon': true,
      'ot-icon--is-styleable-icon': true,
      'ot-progress-icon': true,
      'ot-progress-icon--is-finished': this.state === STATE_FINISHED,
      'ot-progress-icon--is-error': this.state === STATE_ERROR,
      'ot-icon--appearance-light': this.iconAppearance === ICON_APPEARANCE_LIGHT,
      'ot-icon--appearance-dark': this.iconAppearance === ICON_APPEARANCE_DARK,
    };

    // add additional a11y names as the screenreaders do not handle the progressbar correctly yet
    return html`<button class="${e(classes)}" aria-labelledby="a11yname" aria-expanded="${this.ariaExpanded ? this.ariaExpanded : nothing}"><div role="progressbar" aria-labelledby="a11yname" aria-valuenow="${this._ariaValueNow ? this._ariaValueNow : nothing}" aria-valuetext="${this.ariaValueText ? this.ariaValueText : nothing}">${o(this.#getSVGMarkup())} <span id="a11yname" class="ot--is-sr-only">${this._a11yName}</span></div></button>`;
  }

  #getSVGMarkup() {
    return `
        <svg role="presentation"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}"
          class='ot-svg ot-svg--header'
        >
          ${this.#getFinishIconMarkup()}
          ${this.#getErrorIconMarkup()}
          <circle class="ot-progress-icon__background"
            cx="${HALF_ICON_SIZE}"
            cy="${HALF_ICON_SIZE}"
            r="${CIRCLE_RADIUS}"
          />
          ${this.#getAnimationMarkup()}
          <circle
            class="ot-progress-icon__focus-inner"
            fill="none"
            stroke="none"
            cx="${HALF_ICON_SIZE}"
            cy="${HALF_ICON_SIZE}"
            r="20.0"
          />
          <circle
            class="ot-progress-icon__focus-outer"
            fill="none"
            stroke="none"
            cx="${HALF_ICON_SIZE}"
            cy="${HALF_ICON_SIZE}"
            r="20.5"
          />
        </svg>`;
  }

  #getFinishIconMarkup() {
    return this.state === STATE_FINISHED
      ? `<path
        class="ot-progress-icon__finish-mark"
        d="M18.219,26.57l-4.926-4.925C13.106,21.458,13,21.203,13,20.938c0-0.131,0.026-0.261,0.076-0.383
        c0.05-0.121,0.124-0.232,0.217-0.325s0.203-0.167,0.324-0.217s0.251-0.076,0.383-0.076c0.265,0,0.52,0.105,0.707,0.293l3.512,3.512
        l8.436-8.437c0.092-0.095,0.203-0.172,0.325-0.224c0.122-0.052,0.253-0.08,0.386-0.081s0.264,0.024,0.387,0.074
        s0.234,0.125,0.328,0.218s0.168,0.205,0.218,0.328c0.05,0.123,0.076,0.255,0.075,0.387c-0.001,0.133-0.029,0.264-0.081,0.386
        s-0.129,0.232-0.224,0.325L18.219,26.57z" />`
      : '';
  }

  #getErrorIconMarkup() {
    return this.state === STATE_ERROR
      ? `<g class="ot-progress-icon__error-mark">
          <path d="M21,28.1c0.718,0,1.3-0.582,1.3-1.3c0-0.718-0.582-1.3-1.3-1.3c-0.718,0-1.3,0.582-1.3,1.3S20.282,28.1,21,28.1z" />
          <path d="M19.8,22.1v-7.8c0-0.7,0.5-1.3,1.2-1.3s1.3,0.6,1.3,1.3v7.8c0,0.7-0.6,1.3-1.3,1.3 C20.3,23.3,19.8,22.8,19.8,22.1z" />
        </g>`
      : '';
  }

  #getAnimationMarkup() {
    let style;
    let animateMarkup;

    if (this.mode === MODE_INDETERMINATE) {
      const strokeDashArrayStyle = (this.state !== STATE_FINISHED && this.state !== STATE_ERROR) ? CIRCUMFERENCE / 8 : 'none';
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
      const duration = MAX_DURATION * (diff / 100);
      const fromValue = `${this.#percentageToCircumference(this.from)} ${CIRCUMFERENCE}`;
      const toValue = `${this.#percentageToCircumference(this.to)} ${CIRCUMFERENCE}`;
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
        />`;
    }

    return `
      <circle
        class="ot-progress-icon__rotating"
        style="${style}"
        cx="${HALF_ICON_SIZE}"
        cy="${HALF_ICON_SIZE}"
        r="${CIRCLE_RADIUS}"
      >
        ${animateMarkup}
      </circle>`;
  }

  #percentageToCircumference(percentage) {
    return Math.round(CIRCUMFERENCE * (percentage / 100));
  }
}

if (!customElements.get('otc-progress-icon')) {
  customElements.define('otc-progress-icon', OtcProgressIcon);
}

export { OtcProgressIcon };
//# sourceMappingURL=otcProgressIcon.js.map
