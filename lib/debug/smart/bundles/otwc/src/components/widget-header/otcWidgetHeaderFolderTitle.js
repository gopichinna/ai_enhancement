import { css, html, nothing } from 'lit';
import { actionChevronSmallDown } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { OtcWidgetHeaderTitle } from './otcWidgetHeaderTitle.js';
import { ThemeController } from '../../controllers/themeController.js';
import { OTC_ICON_BUNDLE_WC_ACTION_16, getSVGForIconWithOptions } from '../../utilities/render-utilities.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Widget Header Folder Title is a widget header title for use above a folder.  It contains the folder name in the title text and a
 * button associated with a dropdown menu.  The title text can also be replaced with an `otc-inline-edit-container` for renaming the folder.
 * @prop {string} dropdownButtonAriaLabel The `aria-label` of the dropdown button.
 * @prop {string} dropdownButtonTitle The `title` of the dropdown button.
 * @prop {boolean} isEditing Determines if the user is currently editing the folder name.
 * @prop {string} placeholder Defines a short hint intended to aid the user with data entry when the renaming input has no value.
 * @fires rename Fired when the user tries to save the new folder name.  The actual renaming of the folder is left to the implementor.
 */
class OtcWidgetHeaderFolderTitle extends OtcWidgetHeaderTitle {
  #themeController = new ThemeController(this);

  #defaultTitleIcon = 'mime:mime_folder32';

  #defaultTitleIconAriaLabel = 'Folder';

  #defaultDropdownButtonAriaLabel = 'Show more';

  #defaultDropdownButtonTitle = 'Show more';

  #dropdownButtonId = 'otc-folder-title-dropdown-button';

  #dropdownButtonRef = e();

  #dropdownButtonIcon = `${OTC_ICON_BUNDLE_WC_ACTION_16}:action_caret_down16`;

  #inputId = 'otc-folder-title-input';

  #inputRef = e();

  static get styles() {
    return [
      OtcWidgetHeaderTitle.styles,
      css`:host{min-width:264px;width:100%}otc-inline-edit-container{max-width:360px;min-width:264px;width:100%}otc-inline-edit-container otc-input{max-width:288px;min-width:192px;width:100%}otc-menu{margin-inline-start:-8px}`,
    ];
  }

  static get properties() {
    return {
      ...ThemeController.properties,
      ...OtcWidgetHeaderTitle.properties,
      dropdownButtonAriaLabel: { type: String, reflect: true },
      dropdownButtonTitle: { type: String, reflect: true },
      isEditing: { type: Boolean, reflect: true },
      placeholder: { type: String, reflect: true },
    };
  }

  constructor() {
    super();

    this.dropdownButtonAriaLabel = '';
    this.dropdownButtonTitle = '';
    this.isEditing = false;
    this.placeholder = '';
  }

  updated(changedProperties) {
    if (changedProperties.has('isEditing') && this.isEditing) {
      this.#inputRef.value?.focus();
      this.#inputRef.value?.select();
    }
  }

  reportValidity() {
    this.#inputRef.value?.reportValidity();
  }

  setCustomValidity(message) {
    this.#inputRef.value?.setCustomValidity(message);
  }

  #handleInlineEditCancelled() {
    // Check if we had focus when editing was cancelled.
    const hadFocus = (document.activeElement === this);

    this.isEditing = false;

    if (hadFocus) {
      // If we had focus when editing was cancelled, we should re-focus on the only focusable part of the non-editing template.
      this.#dropdownButtonRef.value?.focus();
    }
  }

  #handleInlineEditSaved(event) {
    // Check if we had focus when we saved.
    const hadFocus = (document.activeElement === this);

    const eventOptions = {
      bubbles: true,
      composed: true,
      detail: {
        oldValue: this.titleText,
        value: event.detail.value,
      },
    };

    const renameEvent = new CustomEvent('rename', eventOptions);
    this.dispatchEvent(renameEvent);

    if (hadFocus) {
      // If we had focus when editing was cancelled, we should re-focus on the only focusable part of the non-editing template.
      this.#dropdownButtonRef.value?.focus();
    }
  }

  #handleInputInput() {
    this.setCustomValidity('');
  }

  #getEditingTemplate() {
    return html`<otc-inline-edit-container edit placeholder="${this.placeholder}" @cancelled="${this.#handleInlineEditCancelled}" @saved="${this.#handleInlineEditSaved}"><otc-input ${n(this.#inputRef)} id="${this.#inputId}" @input="${{ handleEvent: event => this.#handleInputInput(event), capture: true }}" value="${this.titleText}"></otc-input></otc-inline-edit-container>`;
  }

  #getNotEditingTemplate() {
    return html`<span class="ot-widget-header-title__icon">${this.#getIconTemplate()}</span><h2 class="ot-widget-header-title__text">${this.titleText}</h2><otc-button ${n(this.#dropdownButtonRef)} ariaLabel="${this.dropdownButtonAriaLabel || this.#defaultDropdownButtonAriaLabel}" icon="${this._themeIsCarbonFiber ? this.#dropdownButtonIcon : nothing}" id="${this.#dropdownButtonId}" size="small" title="${this.dropdownButtonTitle || this.#defaultDropdownButtonTitle}">${!this._themeIsCarbonFiber ? html`<otc-icon svg="${actionChevronSmallDown}"></otc-icon>` : nothing}</otc-button><otc-menu buttonId="${this.#dropdownButtonId}"><slot></slot></otc-menu>`;
  }

  #getIconTemplate() {
    return getSVGForIconWithOptions({
      iconKey: this.titleIcon || this.#defaultTitleIcon,
      title: this.titleIconAriaLabel || this.#defaultTitleIconAriaLabel,
    });
  }

  render() {
    const widgetHeaderFolderTitleClasses = {
      'ot-widget-header-title': true,
      'ot-widget-header-folder-title--is-editing': this.isEditing,
    };

    return html`<span class="${e$1(widgetHeaderFolderTitleClasses)}">${this.isEditing ? this.#getEditingTemplate() : this.#getNotEditingTemplate()}</span>`;
  }
}

customElements.define('otc-widget-header-folder-title', OtcWidgetHeaderFolderTitle);

export { OtcWidgetHeaderFolderTitle };
//# sourceMappingURL=otcWidgetHeaderFolderTitle.js.map
