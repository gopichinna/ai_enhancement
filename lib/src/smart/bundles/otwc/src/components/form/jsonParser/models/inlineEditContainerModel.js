/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { BaseModel } from './baseModel.js';

class InlineEditContainerModel extends BaseModel {
  label = null;

  placeholder = null;

  infoMessage = null;

  required = null;

  #child = null;

  constructor() {
    super('otc-inline-edit-container');
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

    childModel.label = null;
    childModel.placeholder = null;
    childModel.infoMessage = null;

    this.#child = childModel;
  }

  get child() {
    return this.#child;
  }
}

export { InlineEditContainerModel };
//# sourceMappingURL=inlineEditContainerModel.js.map
