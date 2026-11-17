/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { TAG_NAME_OTC_INLINE_EDIT_CONTAINER } from '../jsonParser.constants.js';
import { BaseModel } from './baseModel.js';

class InlineEditContainerModel extends BaseModel {
  label = null;

  placeholder = null;

  infoMessage = null;

  required = null;

  validation = null;

  disabled = null;

  readonly = null;

  edit = null;

  #child = null;

  constructor() {
    super(TAG_NAME_OTC_INLINE_EDIT_CONTAINER);
  }

  setData(childModel) {
    super.setData(childModel.options);

    /**
     * Get the information from the child component to the inline edit container.
     * And remove it from the child component to avoid duplicated content showing.
     */
    this.label = childModel.label ? childModel.label : null;
    this.placeholder = childModel.placeholder ? childModel.placeholder : null;
    this.infoMessage = childModel.infoMessage ? childModel.infoMessage : null;
    this.required = childModel.required ? childModel.required : null;
    this.validation = childModel.validation ? childModel.validation : null;
    this.hidden = childModel.hidden ? childModel.hidden : null;
    this.disabled = childModel.disabled ? childModel.disabled : null;
    this.readonly = childModel.readonly ? childModel.readonly : null;
    this.edit = childModel.edit ? childModel.edit : null;

    childModel.label = null;
    childModel.placeholder = null;
    childModel.infoMessage = null;
    childModel.validation = null;

    this.#child = childModel;
  }

  get child() {
    return this.#child;
  }
}

export { InlineEditContainerModel };
//# sourceMappingURL=inlineEditContainerModel.js.map
