import { html } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import styleSheet from './otcText.scss.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Text component supports text truncation when there isn't enough space to display the full content. A common use case is placing
 * it inside a flex container, allowing the text to be truncated with an ellipsis.
 * @prop {string} overflowMode The overflow mode for the text. If set to `ellipsis` or not specified, the overflow mode is `ellipsis`.
 * Setting it to `none` will render the text without truncation and will be wrapped if not enough space is available to render it in one
 * line.
 * @slot unnamed The text content, which will be rendered in a span with appropriate styles set.  **Note:** Only text content is expected.
 */
class OtcText extends ElementBase {
  static get styles() {
    return [commonStyleSheet, styleSheet];
  }

  static get properties() {
    return {
      overflowMode: {
        type: String,
        reflect: true,
      },
    };
  }

  constructor() {
    super();

    this.overflowMode = 'ellipsis';
  }

  render() {
    const classes = {
      'ot-text': true,
      'ot-text--is-truncated-ellipsis': this.overflowMode === 'ellipsis' || this.overflowMode === '',
    };
    return html`<span class="${e(classes)}"><slot></slot></span>`;
  }
}

customElements.define('otc-text', OtcText);

export { OtcText };
//# sourceMappingURL=otcText.js.map
