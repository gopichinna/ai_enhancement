/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { formatAttributeData } from '../utilities.js';
import { BaseModel } from './baseModel.js';

class FormElementBaseModel extends BaseModel {
  name = null;

  dark = null;

  readonly = null;

  required = null;

  disabled = null;

  label = null;

  ariaLabel = null;

  infoMessage = null;

  errorMessage = null;

  value = null;

  liveValidation = null;

  constructor(tagName = '', elementName = null) {
    super(tagName);

    this.name = elementName;
  }

  get hasOptions() {
    return false;
  }

  setData(schema, options, data, setValue = true) {
    super.setData(options);

    let { label } = options;
    if (!label || !label.length) {
      label = schema.title ? schema.title : schema.label;
    }

    this.dark = formatAttributeData(options.dark, true);
    this.readonly = formatAttributeData(schema.readonly, true);
    this.required = formatAttributeData(schema.required, true);
    this.disabled = formatAttributeData(options.disabled, true);
    this.label = formatAttributeData(label);
    this.ariaLabel = formatAttributeData(options.ariaLabel);
    this.infoMessage = formatAttributeData(options.infoMessage);
    this.errorMessage = formatAttributeData(options.errorMessage);
    this.liveValidation = formatAttributeData(options.liveValidation, true);

    if (setValue) {
      this.value = formatAttributeData(data);
    }
  }
}

export { FormElementBaseModel };
//# sourceMappingURL=formElementBaseModel.js.map
